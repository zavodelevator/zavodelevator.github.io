// Спіраль шнекова: цільнотягнута (формули вкладки РШ) або сегменти (CRM ScrewSegmentCalculator).
(function () {
  'use strict';
  var num = Calc.num, money = Calc.money, esc = Calc.esc;
  var pitchManual = false;
  function f(x, d) { return Number(x).toLocaleString('uk-UA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function $(id) { return document.getElementById(id); }

  function initInputs(Dt) {
    $('grade').innerHTML = Dt.metals.strip_grades.map(function (x, i) { return '<option value="' + i + '">' + esc(x.label) + ' — ' + x.price + ' грн/кг</option>'; }).join('');
    var D = $('D'), p = $('p'), hint = $('p-hint');
    function syncHint() { hint.textContent = pitchManual ? '(свій)' : '= D'; }
    D.addEventListener('input', function () { if (!pitchManual) p.value = D.value; });
    p.addEventListener('focus', function () { if (!pitchManual) { p.value = ''; p.placeholder = D.value; } });
    p.addEventListener('input', function () { pitchManual = p.value !== ''; syncHint(); });
    p.addEventListener('blur', function () { if (p.value === '') { pitchManual = false; p.value = D.value; syncHint(); Calc.recompute(); } });
    document.querySelectorAll('.btn-group-toggle input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', function () {
        document.querySelectorAll('input[name="' + r.name + '"]').forEach(function (x) { x.parentNode.classList.toggle('active', x.checked); });
        if (r.name === 'kind') $('seg-fields').hidden = !(r.value === 'segments' && r.checked);
      });
    });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]');
      if (!b) return;
      var text = b.getAttribute('data-copy');
      var done = function () { var t = b.textContent; b.textContent = 'Скопійовано ✓'; setTimeout(function () { b.textContent = t; }, 1500); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done);
      else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); }
    });
  }

  Calc.boot({
    data: ['spiral', 'metals'],
    pricing: 'spiral',
    docked: true,
    init: initInputs,
    panel: function () {
      return [
        { tab: 'Розрахунок', details: true, note: 'Усі величини, як у вкладці РШ.' },
        { tab: 'Метал', note: 'Ціна штрипса за маркою, грн/кг. Постійно — calc/data/metals.json → strip_grades.', fields: [
          { type: 'table', path: 'metals.strip_grades', columns: [{ key: 'label', label: 'Марка', readonly: true }, { key: 'price', label: 'грн/кг' }] },
          { path: 'spiral.density', label: 'Питома вага ρ', unit: 'г/мм³' }
        ] },
        { tab: 'Коефіцієнти', fields: [
          { path: 'spiral.coef_retail', label: 'Роздріб', unit: '×' },
          { path: 'spiral.coef_wholesale', label: 'Опт', unit: '×' },
          { path: 'spiral.overhead', label: 'Запас матеріалу', unit: '×' },
          { path: 'spiral.final_coef', label: 'Кінцевий коефіцієнт (як у РШ)', unit: '×' },
          { path: 'spiral.strip_length_factor', label: 'Коеф. довжини штрипса', unit: '×' },
          { path: 'spiral.segment.coef_s2', label: 'Сегмент, s = 2 мм', unit: '×' },
          { path: 'spiral.segment.coef_s3', label: 'Сегмент, s = 3 мм', unit: '×' },
          { path: 'spiral.segment.coef_default', label: 'Сегмент, інші s', unit: '×' }
        ] }
      ];
    },
    compute: function (Dt, inp) {
      var S = Dt.spiral, M = Dt.metals;
      var D = num(inp.D), d = num(inp.d), s = num(inp.s), L = num(inp.L);
      var t = num(inp.p) || D;
      if (D <= 0 || d <= 0 || t <= 0 || s <= 0 || L <= 0) return { error: 'Заповніть D, d, крок, товщину і довжину' };
      if (d >= D) return { error: 'd має бути меншим за D' };
      var grade = M.strip_grades[num(inp.grade)] || M.strip_grades[0], Cs = grade.price;
      var wholesale = inp.price_type === 'wholesale', coef = wholesale ? S.coef_wholesale : S.coef_retail;
      var segments = inp.kind === 'segments';

      var l = Math.sqrt(Math.pow(Math.PI * d, 2) + t * t);
      var Lo = Math.sqrt(Math.pow(Math.PI * D, 2) + t * t);
      var a = (D - d) / 2, ang = (Lo - l) / a, Do = 2 * Lo / ang, dO = 2 * l / ang, n = 1000 / t;
      var stripPerM = l * n * S.strip_length_factor;
      var massPerM = s * a * stripPerM * S.density / 1000;
      var perM = Calc.round3(massPerM * S.overhead * Cs * coef * S.final_coef);
      var perMR = Calc.round3(massPerM * S.overhead * Cs * S.coef_retail * S.final_coef);
      var perMW = Calc.round3(massPerM * S.overhead * Cs * S.coef_wholesale * S.final_coef);

      var segCoef = s === 2 ? S.segment.coef_s2 : s === 3 ? S.segment.coef_s3 : S.segment.coef_default;
      var segBlank = Do * Do * s * S.density / 1000;
      var segPiece = Calc.ceil3(segBlank * Cs * segCoef);
      var segAuto = Math.round(L * 1000 / t) + 1;
      var segQty = num(inp.seg_qty) > 0 ? Math.round(num(inp.seg_qty)) : segAuto;
      var segMarkup = num(inp.seg_markup);
      $('seg_qty').placeholder = 'авто: ' + segAuto;

      var spec = 'D' + D + '×d' + d + ', крок ' + t + ', s=' + s + ' мм, ' + grade.label;
      var rows = segments
        ? [{ name: 'Сегменти спіралі ' + spec, qty: segQty, unit: 'шт', qtyDigits: 0, price: segPiece * (1 + segMarkup / 100),
            note: 'заготовка ' + f(segBlank, 2) + ' кг × ' + Cs + ' грн/кг × ' + segCoef + ' → ' + f(segPiece, 0) + ' грн/шт' + (segMarkup ? ' + ' + segMarkup + '%' : '') }]
        : [{ name: 'Спіраль цільнотягнута ' + spec, qty: L, unit: 'м', price: perM, note: (wholesale ? 'опт' : 'роздріб') + ': ' + f(perM, 0) + ' грн/м з ПДВ' }];
      var warnings = [];
      if (t < 0.5 * D || t > 1.2 * D) warnings.push('Незвичний крок: ' + t + ' мм при D ' + D + ' (зазвичай 0,5–1,2 D).');
      if (s > 8) warnings.push('Товщина ' + s + ' мм — перевірте, чи катаємо таку спіраль.');

      var tot = Calc.totals(rows, S.pricing);
      var title = 'Спіраль шнекова ' + (segments ? 'сегментна' : 'цільнотягнута') + ' ' + spec + ', L=' + f(L, 2) + ' м' + (segments ? ' (' + segQty + ' шт)' : ', ' + (wholesale ? 'опт' : 'роздріб'));
      var details = [
        { group: 'Геометрія', items: [
          { label: 'Внутрішня гвинтова лінія l', formula: '√((π·' + d + ')² + ' + t + '²)', value: f(l, 1) + ' мм' },
          { label: 'Зовнішня гвинтова лінія L', formula: '√((π·' + D + ')² + ' + t + '²)', value: f(Lo, 1) + ' мм' },
          { label: 'Висота витка a', formula: '(' + D + ' − ' + d + ') / 2', value: f(a, 1) + ' мм' },
          { label: 'Розгортка Do / do', formula: '2·L / кут, 2·l / кут', value: f(Do, 1) + ' / ' + f(dO, 1) + ' мм' },
          { label: 'Витків на 1 м / на спіраль', formula: '1000 / ' + t, value: f(n, 2) + ' / ' + f(n * L, 1) },
          { label: 'Штрипс на 1 м', formula: 'l × n × ' + S.strip_length_factor, value: f(stripPerM, 0) + ' мм' }
        ] },
        { group: 'Маса і ціна (як у РШ)', items: [
          { label: 'Маса 1 м', formula: s + ' × ' + f(a, 1) + ' × ' + f(stripPerM, 0) + ' × ' + S.density + ' / 1000', value: f(massPerM, 3) + ' кг' },
          { label: 'Маса спіралі', formula: 'на 1 м × ' + f(L, 2), value: f(massPerM * L, 2) + ' кг' },
          { label: 'Ціна 1 м, роздріб', formula: f(massPerM, 3) + ' × ' + S.overhead + ' × ' + Cs + ' × ' + S.coef_retail + ' × ' + S.final_coef, value: f(perMR, 0) + ' грн' },
          { label: 'Ціна 1 м, опт', formula: '… × ' + S.coef_wholesale + ' × ' + S.final_coef, value: f(perMW, 0) + ' грн' }
        ] },
        { group: 'Сегменти', items: [
          { label: 'Маса заготовки', formula: 'Do² × s × ρ', value: f(segBlank, 3) + ' кг' },
          { label: 'Ціна сегмента', formula: 'вгору до 3 (' + f(segBlank, 3) + ' × ' + Cs + ' × ' + segCoef + ')', value: f(segPiece, 0) + ' грн' },
          { label: 'Кількість (авто)', formula: 'round(L / крок) + 1', value: segAuto + ' шт' }
        ] }
      ];
      return {
        title: title,
        rows: rows,
        warnings: warnings,
        details: details,
        viz: window.drawScrew(D, d, t, L, 0, f(n * L, 1)),
        after: '<div class="extra-card"><div>Ціна 1 м з ПДВ: роздріб <b>' + f(perMR, 0) + ' грн</b> · опт <b>' + f(perMW, 0) + ' грн</b></div>' +
          '<div>Сегмент: <b>' + f(segPiece, 0) + ' грн/шт</b> (' + segAuto + ' шт на ' + f(L, 2) + ' м)</div></div>' +
          '<button type="button" class="btn btn-sm btn-success mt-2" data-copy="' + esc(title + ' — ' + f(tot.total, 0) + ' грн з ПДВ.') + '">Скопіювати для клієнта</button>',
        info: [
          { label: 'Маса 1 м / спіралі', value: f(massPerM, 3) + ' / ' + f(massPerM * L, 2) + ' кг' },
          { label: 'Розгортка Do / do', value: f(Do, 0) + ' / ' + f(dO, 0) + ' мм' }
        ]
      };
    }
  });
})();
