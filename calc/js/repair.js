// Ремонт шнека — формули вкладки РШ (Google Sheet «РЕМОНТ шнека») + сегменти (CRM ScrewSegmentCalculator).
(function () {
  'use strict';
  var num = Calc.num, money = Calc.money;
  var pitchManual = false;

  function f(x, d) { return Number(x).toLocaleString('uk-UA', { minimumFractionDigits: d, maximumFractionDigits: d }); }

  // ---------- поведінка полів ----------
  function initInputs(Dt) {
    var g = document.getElementById('grade');
    g.innerHTML = Dt.metals.strip_grades.map(function (x, i) {
      return '<option value="' + i + '">' + Calc.esc(x.label) + ' — ' + x.price + ' грн/кг</option>';
    }).join('');

    var tp = document.getElementById('tube_price'), owner = document.getElementById('owner');
    tp.value = Dt.metals.tube.price;
    owner.addEventListener('change', function () { document.getElementById('tube-price-group').hidden = owner.value !== 'hzett'; });

    var D = document.getElementById('D'), p = document.getElementById('p'), hint = document.getElementById('p-hint');
    function syncHint() { hint.textContent = pitchManual ? '(свій)' : '= D'; }
    D.addEventListener('input', function () { if (!pitchManual) p.value = D.value; });
    p.addEventListener('focus', function () { if (!pitchManual) { p.value = ''; p.placeholder = D.value; } });
    p.addEventListener('input', function () { pitchManual = p.value !== ''; syncHint(); });
    p.addEventListener('blur', function () {
      if (p.value === '') { pitchManual = false; p.value = D.value; syncHint(); Calc.recompute(); }
    });

    document.querySelectorAll('input[name="kind"]').forEach(function (r) {
      r.addEventListener('change', function () {
        document.querySelectorAll('input[name="kind"]').forEach(function (x) { x.parentNode.classList.toggle('active', x.checked); });
        document.getElementById('seg-fields').hidden = r.value !== 'segments' || !r.checked;
      });
    });

    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]');
      if (!b) return;
      var text = b.getAttribute('data-copy');
      var done = function () { var t = b.textContent; b.textContent = 'Скопійовано ✓'; setTimeout(function () { b.textContent = t; }, 1500); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done);
      else {
        var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta); done();
      }
    });
  }

  // ---------- розрахунок ----------
  function geometry(R, D, d, t, s, L) {
    var l = Math.sqrt(Math.pow(Math.PI * d, 2) + t * t);
    var Lo = Math.sqrt(Math.pow(Math.PI * D, 2) + t * t);
    var a = (D - d) / 2;
    var ang = (Lo - l) / a;
    var g = { l: l, Lo: Lo, a: a, ang: ang, Do: 2 * Lo / ang, dO: 2 * l / ang, n: 1000 / t };
    g.cutDeg = 360 - ang * 180 / Math.PI;
    g.spiralArea = Math.PI * (g.Do * g.Do - g.dO * g.dO) * g.n * L / 2e6;
    g.stripPerM = l * g.n * R.strip_length_factor;
    g.massPerM = s * a * g.stripPerM * R.density / 1000;
    g.turns = g.n * L;
    return g;
  }

  Calc.boot({
    data: ['repair', 'metals'],
    pricing: 'repair',
    docked: true,
    init: initInputs,
    panel: function () {
      return [
        { tab: 'Розрахунок', details: true, note: 'Усі проміжні величини, як у вкладці РШ. Оновлюються під час вводу.' },
        { tab: 'Метал', note: 'Ціна марки — грн/кг. Список марок і ціни — calc/data/metals.json → strip_grades.', fields: [
          { type: 'table', path: 'metals.strip_grades', columns: [{ key: 'label', label: 'Марка', readonly: true }, { key: 'price', label: 'грн/кг' }] },
          { path: 'repair.density', label: 'Питома вага ρ', unit: 'г/мм³' }
        ] },
        { tab: 'Коефіцієнти', fields: [
          { path: 'repair.spiral_coef', label: 'Спіраль, роздріб', unit: '×' },
          { path: 'repair.spiral_coef_wholesale', label: 'Спіраль, опт (довідково)', unit: '×' },
          { path: 'repair.spiral_overhead', label: 'Запас на спіраль', unit: '×' },
          { path: 'repair.strip_length_factor', label: 'Коеф. довжини штрипса', unit: '×' },
          { path: 'repair.tube_coef', label: 'Нова труба', unit: '×' },
          { path: 'repair.tube_weight_k', label: 'Коеф. маси труби', unit: '' },
          { path: 'repair.segment.coef_s2', label: 'Сегмент, s = 2 мм', unit: '×' },
          { path: 'repair.segment.coef_s3', label: 'Сегмент, s = 3 мм', unit: '×' },
          { path: 'repair.segment.coef_default', label: 'Сегмент, інші s', unit: '×' }
        ] },
        { tab: 'Роботи', fields: [
          { path: 'repair.rates.disassembly_300', label: 'Демонтаж, D ≥ 300', unit: 'грн/м' },
          { path: 'repair.rates.disassembly_150', label: 'Демонтаж, D ≥ 150', unit: 'грн/м' },
          { path: 'repair.rates.disassembly_small', label: 'Демонтаж, D < 150', unit: 'грн/м' },
          { path: 'repair.rates.assembly', label: 'Монтаж (× D, мм)', unit: 'грн/м' },
          { path: 'repair.rates.balancing', label: 'Балансування', unit: 'грн/м' },
          { path: 'repair.rates.priming', label: 'Грунтування', unit: 'грн/м²' }
        ] }
      ];
    },
    compute: function (Dt, inp) {
      var R = Dt.repair, M = Dt.metals;
      var D = num(inp.D), d = num(inp.d), s = num(inp.s), L = num(inp.L), wall = num(inp.wall);
      var t = num(inp.p) || D;
      if (D <= 0 || d <= 0 || t <= 0 || s <= 0 || L <= 0) return { error: 'Заповніть D, d, крок, товщину і довжину' };
      if (d >= D) return { error: 'Діаметр труби d має бути меншим за D' };
      if (wall >= d / 2) return { error: 'Стінка труби завелика для d' };
      var grade = M.strip_grades[num(inp.grade)] || M.strip_grades[0];
      var Cs = grade.price, Ct = num(inp.tube_price) > 0 ? num(inp.tube_price) : M.tube.price, hzett = inp.owner === 'hzett', segments = inp.kind === 'segments';
      var g = geometry(R, D, d, t, s, L);
      var tubeArea = Math.PI * d * L / 1000;
      var tubeMass = wall * R.tube_weight_k * (d - wall) * L;
      var rate = D >= 300 ? R.rates.disassembly_300 : D >= 150 ? R.rates.disassembly_150 : R.rates.disassembly_small;
      var rateLbl = D >= 300 ? 'D ≥ 300' : D >= 150 ? 'D ≥ 150' : 'D < 150';
      var spiralPriceKg = R.spiral_overhead * Cs * R.spiral_coef;

      // сегменти
      var segCoef = s === 2 ? R.segment.coef_s2 : s === 3 ? R.segment.coef_s3 : R.segment.coef_default;
      var segBlank = g.Do * g.Do * s * R.density / 1000;
      var segPiece = Calc.ceil3(segBlank * Cs * segCoef);
      var segAuto = Math.round(L * 1000 / t) + 1;
      var segQty = num(inp.seg_qty) > 0 ? Math.round(num(inp.seg_qty)) : segAuto;
      var segMarkup = num(inp.seg_markup);
      document.getElementById('seg_qty').placeholder = 'авто: ' + segAuto;

      var rows = [];
      if (segments) rows.push({ name: 'Сегменти спіралі (' + grade.label + ')', qty: segQty, unit: 'шт', qtyDigits: 0,
        price: segPiece * (1 + segMarkup / 100),
        note: 'заготовка ' + f(segBlank, 2) + ' кг × ' + Cs + ' грн/кг × ' + segCoef + ' → ' + f(segPiece, 0) + ' грн/шт' + (segMarkup ? ' + ' + segMarkup + '%' : '') });
      else rows.push({ name: 'Спіраль цільнотягнута (' + grade.label + ')', qty: g.massPerM * L, unit: 'кг',
        price: spiralPriceKg, note: Cs + ' грн/кг × ' + R.spiral_overhead + ' × ' + R.spiral_coef });
      if (hzett) rows.push({ name: 'Труба нова', qty: tubeMass, unit: 'кг', price: Ct * R.tube_coef, note: Ct + ' грн/кг × ' + R.tube_coef });
      else rows.push({ name: 'Демонтаж старої спіралі', qty: L, unit: 'м', price: rate, note: 'ставка ' + rateLbl });
      if (tubeMass > 0) {
        rows.push({ name: 'Монтаж нової спіралі', qty: L, unit: 'м', price: R.rates.assembly * D, note: R.rates.assembly + ' грн × D' });
        rows.push({ name: 'Балансування шнека', qty: L, unit: 'м', price: R.rates.balancing });
      }
      rows.push({ name: 'Грунтування', qty: g.spiralArea + tubeArea, unit: 'м²', price: R.rates.priming });

      var pricing = R.pricing, tot = Calc.totals(rows, pricing);
      var warnings = [];
      if (tubeMass <= 0) warnings.push('Без товщини стінки труби монтаж і балансування не рахуються (як у таблиці РШ).');
      if (t < 0.5 * D || t > 1.2 * D) warnings.push('Незвичний крок: ' + t + ' мм при D ' + D + ' (зазвичай 0,5–1,2 D).');
      if (s > 8) warnings.push('Товщина ' + s + ' мм — перевірте, чи катаємо таку спіраль.');
      if (D - d < 20) warnings.push('Висота витка лише ' + f(g.a, 1) + ' мм.');

      // спіраль окремо (рядки 38–44 РШ)
      var mRetail = Calc.round3(g.massPerM * R.spiral_overhead * Cs * R.spiral_coef * 1.1);
      var mWhole = Calc.round3(g.massPerM * R.spiral_overhead * Cs * R.spiral_coef_wholesale * 1.1);
      var specTxt = 'D' + D + '×d' + d + ', крок ' + t + ', s=' + s + ' мм, ' + grade.label;
      var spiralText = 'Спіраль шнекова ' + (segments ? 'сегментна' : 'цільнотягнута') + ' ' + specTxt + ': ' +
        (segments ? f(segPiece * (1 + segMarkup / 100), 0) + ' грн/шт, ' + segQty + ' шт = ' + f(segQty * segPiece * (1 + segMarkup / 100), 0) + ' грн'
                  : f(mRetail, 0) + ' грн/м (роздріб), ' + f(mWhole, 0) + ' грн/м (опт); на ' + f(L, 2) + ' м — ' + f(mRetail * L, 0) + ' грн') + ' з ПДВ.';
      var title = 'Ремонт шнека ' + specTxt + ', L=' + f(L, 2) + ' м; спіраль ' + (segments ? 'сегментна (' + segQty + ' шт)' : 'цільнотягнута') +
        '; труба ' + (hzett ? 'нова, стінка ' + wall + ' мм' : 'замовника');
      var repairText = title + ' — ' + f(tot.total, 0) + ' грн з ПДВ.';

      var after = '<div class="d-flex flex-wrap mt-2">' +
        '<button type="button" class="btn btn-sm btn-success mr-2 mb-2" data-copy="' + Calc.esc(repairText) + '">Скопіювати ремонт</button>' +
        '<button type="button" class="btn btn-sm btn-outline-primary mb-2" data-copy="' + Calc.esc(spiralText) + '">Скопіювати спіраль</button></div>' +
        '<div class="extra-card"><div class="font-weight-bold mb-1">Спіраль окремо (без ремонту)</div>' +
        (segments
          ? '<div>Сегмент: <b>' + f(segPiece * (1 + segMarkup / 100), 0) + ' грн/шт</b> · ' + segQty + ' шт = <b>' + f(segQty * segPiece * (1 + segMarkup / 100), 0) + ' грн</b></div>'
          : '<div>Роздріб: <b>' + f(mRetail, 0) + ' грн/м</b> · Опт: <b>' + f(mWhole, 0) + ' грн/м</b> (з ПДВ)</div>' +
            '<div>На ' + f(L, 2) + ' м: роздріб ' + f(mRetail * L, 0) + ' грн, опт ' + f(mWhole * L, 0) + ' грн</div>') +
        '<div class="small text-muted mt-1">' + Calc.esc(spiralText) + '</div></div>';

      var details = [
        { group: 'Геометрія спіралі', items: [
          { label: 'Внутрішня гвинтова лінія витка l', formula: '√((π·' + d + ')² + ' + t + '²)', value: f(g.l, 1) + ' мм' },
          { label: 'Зовнішня гвинтова лінія витка L', formula: '√((π·' + D + ')² + ' + t + '²)', value: f(g.Lo, 1) + ' мм' },
          { label: 'Висота витка a', formula: '(' + D + ' − ' + d + ') / 2', value: f(g.a, 1) + ' мм' },
          { label: 'Кут кільцевого тіла розгортки', formula: '(L − l) / a', value: f(g.ang, 3) + ' рад' },
          { label: 'Розгортка: зовнішній Do', formula: '2·L / кут', value: f(g.Do, 1) + ' мм' },
          { label: 'Розгортка: внутрішній do', formula: '2·l / кут', value: f(g.dO, 1) + ' мм' },
          { label: 'Виріз кільця заготовки', formula: '360° − кут·180/π', value: f(g.cutDeg, 1) + '°' },
          { label: 'Витків на 1 м', formula: '1000 / ' + t, value: f(g.n, 2) },
          { label: 'Витків на шнек', formula: f(g.n, 2) + ' × ' + f(L, 2), value: f(g.turns, 1) },
          { label: 'Довжина штрипса на 1 м', formula: 'l × n × ' + R.strip_length_factor, value: f(g.stripPerM, 0) + ' мм' },
          { label: 'Довжина штрипса на шнек', formula: 'на 1 м × L', value: f(g.stripPerM * L / 1000, 2) + ' м' }
        ] },
        { group: 'Маси й площі', items: [
          { label: 'Маса 1 м спіралі', formula: s + ' × ' + f(g.a, 1) + ' × ' + f(g.stripPerM, 0) + ' × ' + R.density + ' / 1000', value: f(g.massPerM, 3) + ' кг' },
          { label: 'Маса спіралі на шнек', formula: 'на 1 м × ' + f(L, 2), value: f(g.massPerM * L, 2) + ' кг' },
          { label: 'Маса труби', formula: wall + ' × ' + R.tube_weight_k + ' × (' + d + ' − ' + wall + ') × ' + f(L, 2), value: f(tubeMass, 2) + ' кг' },
          { label: 'Маса шнека (довідково)', formula: 'спіраль + труба', value: f(g.massPerM * L + tubeMass, 1) + ' кг' },
          { label: 'Площа спіралі', formula: 'π·(Do² − do²)·n·L / 2·10⁶', value: f(g.spiralArea, 3) + ' м²' },
          { label: 'Площа труби', formula: 'π·' + d + '·' + f(L, 2) + ' / 1000', value: f(tubeArea, 3) + ' м²' }
        ] },
        { group: 'Сегменти (якщо замість цільнотягнутої)', items: [
          { label: 'Маса заготовки сегмента', formula: 'Do² × s × ρ = ' + f(g.Do, 0) + '² × ' + s + ' × ' + R.density, value: f(segBlank, 3) + ' кг' },
          { label: 'Коефіцієнт для s = ' + s, formula: 's=2 → ' + R.segment.coef_s2 + ', s=3 → ' + R.segment.coef_s3 + ', інші → ' + R.segment.coef_default, value: '× ' + segCoef },
          { label: 'Ціна сегмента', formula: 'вгору до 3 (' + f(segBlank, 3) + ' × ' + Cs + ' × ' + segCoef + ')', value: f(segPiece, 0) + ' грн' },
          { label: 'Кількість (авто)', formula: 'round(L / крок) + 1', value: segAuto + ' шт' }
        ] },
        { group: 'Вартість (як у РШ)', items: [
          { label: 'Спіраль цільнотягнута', formula: f(g.massPerM * L, 2) + ' кг × ' + f(spiralPriceKg, 2), value: money(g.massPerM * L * spiralPriceKg) },
          { label: 'Сегменти', formula: segQty + ' × ' + f(segPiece * (1 + segMarkup / 100), 2), value: money(segQty * segPiece * (1 + segMarkup / 100)) },
          { label: 'Нова труба', formula: hzett ? f(tubeMass, 2) + ' кг × ' + Ct + ' × ' + R.tube_coef : 'труба замовника → 0', value: money(hzett ? tubeMass * Ct * R.tube_coef : 0) },
          { label: 'Демонтаж старої спіралі', formula: hzett ? 'лише для труби замовника → 0' : f(L, 2) + ' м × ' + rate + ' (' + rateLbl + ')', value: money(hzett ? 0 : L * rate) },
          { label: 'Монтаж нової спіралі', formula: f(L, 2) + ' × ' + R.rates.assembly + ' × ' + D, value: money(tubeMass > 0 ? L * R.rates.assembly * D : 0) },
          { label: 'Балансування', formula: f(L, 2) + ' × ' + R.rates.balancing, value: money(tubeMass > 0 ? L * R.rates.balancing : 0) },
          { label: 'Грунтування', formula: '(' + f(g.spiralArea, 3) + ' + ' + f(tubeArea, 3) + ') м² × ' + R.rates.priming, value: money((g.spiralArea + tubeArea) * R.rates.priming) },
          { label: 'Разом (округлено до 3)', formula: 'обраний варіант спіралі + решта', value: money(tot.cost) },
          { label: 'Відпускна ціна з ПДВ', formula: 'разом × ' + (1 + pricing.markup_pct / 100) + ', округлено до 3', value: money(tot.total, 0) + ' грн' }
        ] },
        { group: 'Спіраль окремо, з ПДВ', items: [
          { label: 'Ціна 1 м, роздріб', formula: f(g.massPerM, 3) + ' × ' + R.spiral_overhead + ' × ' + Cs + ' × ' + R.spiral_coef + ' × 1,1', value: f(mRetail, 0) + ' грн' },
          { label: 'Ціна 1 м, опт', formula: '… × ' + R.spiral_coef_wholesale + ' × 1,1', value: f(mWhole, 0) + ' грн' },
          { label: 'На ' + f(L, 2) + ' м, роздріб / опт', formula: '', value: f(mRetail * L, 0) + ' / ' + f(mWhole * L, 0) }
        ] }
      ];

      return {
        title: title,
        rows: rows,
        warnings: warnings,
        viz: drawScrew(D, d, t, L, wall, f(g.turns, 1)),
        details: details,
        after: after,
        info: [
          { label: 'Маса шнека (спіраль + труба)', value: f(g.massPerM * L + tubeMass, 1) + ' кг' },
          { label: 'Розгортка витка Do / do', value: f(g.Do, 0) + ' / ' + f(g.dO, 0) + ' мм' },
          { label: 'Витків', value: f(g.turns, 1) }
        ]
      };
    }
  });
})();
