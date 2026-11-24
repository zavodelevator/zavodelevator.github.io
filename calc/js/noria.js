// Норія ковшова: вузли (головка, башмак, секції, стрічка, ковші, футування, муфти) + мотор-редуктор.
(function () {
  'use strict';
  var num = Calc.num, money = Calc.money, esc = Calc.esc;
  function f(x, d) { return Number(x).toLocaleString('uk-UA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function $(id) { return document.getElementById(id); }
  function ceil(x) { return Math.ceil(x - 1e-9); }

  function initInputs(Dt) {
    $('capacity').innerHTML = Dt.noria.models.map(function (m) {
      return '<option value="' + m.capacity + '"' + (m.capacity === 25 ? ' selected' : '') + '>' + m.capacity + ' т/год</option>';
    }).join('');
    $('kw').innerHTML = '<option value="0">авто</option>' + Dt.gear_motors.items.map(function (x) { return '<option value="' + x.kw + '">' + x.kw + '</option>'; }).join('');
    $('capacity').addEventListener('change', function () { Calc.renderPanel(); });
    $('drive').addEventListener('change', function () { $('kw').disabled = $('drive').value === 'none'; });
    document.querySelectorAll('[data-toggle-group] input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', function () {
        document.querySelectorAll('input[name="' + r.name + '"]').forEach(function (x) { x.parentNode.classList.toggle('active', x.checked); });
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

  // ---------- креслення: норія спереду ----------
  function drawNoria(o) {
    var Hpx = 380, top = 40, W = 560;
    var k = Hpx / o.H;
    var cx = 230, gap = 34, sw = 26;           // центр, відстань між трубами, ширина труби
    var headH = Math.max(34, Math.min(70, o.headH * k)), bootH = Math.max(30, Math.min(60, o.bootH * k));
    var yTop = top, yBot = top + Hpx;
    var yHeadB = yTop + headH, yBootT = yBot - bootH;
    var lx = cx - gap - sw / 2, rx = cx + gap - sw / 2;
    var s = [];
    // шахта (дві труби) з фланцями секцій
    s.push('<rect class="nr-leg" x="' + lx + '" y="' + yHeadB + '" width="' + sw + '" height="' + (yBootT - yHeadB) + '"/>');
    s.push('<rect class="nr-leg" x="' + rx + '" y="' + yHeadB + '" width="' + sw + '" height="' + (yBootT - yHeadB) + '"/>');
    for (var m = 2; m < o.shaftLen - 0.01; m += 2) {
      var yy = yBootT - m * k;
      s.push('<line class="nr-flange" x1="' + (lx - 4) + '" y1="' + yy + '" x2="' + (lx + sw + 4) + '" y2="' + yy + '"/>');
      s.push('<line class="nr-flange" x1="' + (rx - 4) + '" y1="' + yy + '" x2="' + (rx + sw + 4) + '" y2="' + yy + '"/>');
    }
    // стрічка й ковші (схематично)
    var bl = lx + sw / 2, br = rx + sw / 2;
    s.push('<line class="nr-belt" x1="' + bl + '" y1="' + (yHeadB - 10) + '" x2="' + bl + '" y2="' + (yBootT + 10) + '"/>');
    s.push('<line class="nr-belt" x1="' + br + '" y1="' + (yHeadB - 10) + '" x2="' + br + '" y2="' + (yBootT + 10) + '"/>');
    var step = Math.max(9, 1000 / o.perM * k * 0.001 * 1000 / 1000 * 1);
    step = Math.max(9, k / o.perM);
    for (var y = yHeadB + 6; y < yBootT - 4; y += step) {
      s.push('<path class="nr-bucket" d="M' + bl + ',' + y + ' l9,0 l-3,6 l-6,0 z"/>');
      s.push('<path class="nr-bucket" d="M' + br + ',' + (y + 3) + ' l-9,0 l3,-6 l6,0 z"/>');
    }
    // головка
    var hw = gap * 2 + sw + 34;
    s.push('<path class="nr-head" d="M' + (cx - hw / 2) + ',' + yHeadB + ' L' + (cx - hw / 2) + ',' + (yTop + headH * 0.45) + ' Q' + cx + ',' + (yTop - 6) + ' ' + (cx + hw / 2) + ',' + (yTop + headH * 0.45) + ' L' + (cx + hw / 2) + ',' + yHeadB + ' Z"/>');
    s.push('<circle class="nr-drum' + (o.lagging >= 1 ? ' lag' : '') + '" cx="' + cx + '" cy="' + (yTop + headH * 0.5) + '" r="' + Math.min(gap + 2, headH * 0.38) + '"/>');
    // вивантажувальний носик
    s.push('<path class="nr-head" d="M' + (cx + hw / 2) + ',' + (yTop + headH * 0.55) + ' l34,22 l0,14 l-34,-14 z"/>');
    s.push('<text class="nr-lbl" x="' + (cx + hw / 2 + 40) + '" y="' + (yTop + headH * 0.55 + 30) + '">вивантаження</text>');
    // привід
    if (o.drive !== 'none') {
      s.push('<rect class="nr-gear" x="' + (cx - hw / 2 - 30) + '" y="' + (yTop + headH * 0.5 - 13) + '" width="26" height="26" rx="3"/>');
      s.push('<rect class="nr-motor" x="' + (cx - hw / 2 - 66) + '" y="' + (yTop + headH * 0.5 - 10) + '" width="36" height="20" rx="5"/>');
      s.push('<text class="nr-lbl" x="' + (cx - hw / 2 - 48) + '" y="' + (yTop + headH * 0.5 - 18) + '" text-anchor="middle">МР' + (o.kw ? ' ' + f(o.kw, o.kw % 1 ? 1 : 0) + ' кВт' : '') + '</text>');
      if (o.coupling) s.push('<rect class="nr-coupling" x="' + (cx - hw / 2 - 5) + '" y="' + (yTop + headH * 0.5 - 6) + '" width="6" height="12"/>');
      if (o.backstop) s.push('<text class="nr-lbl" x="' + (cx - hw / 2 - 48) + '" y="' + (yTop + headH * 0.5 + 24) + '" text-anchor="middle">+ зворотний хід</text>');
    }
    // башмак
    s.push('<rect class="nr-head" x="' + (cx - hw / 2) + '" y="' + yBootT + '" width="' + hw + '" height="' + bootH + '" rx="4"/>');
    s.push('<circle class="nr-drum' + (o.lagging >= 2 ? ' lag' : '') + '" cx="' + cx + '" cy="' + (yBootT + bootH * 0.55) + '" r="' + Math.min(gap + 2, bootH * 0.35) + '"/>');
    s.push('<path class="nr-head" d="M' + (cx - hw / 2) + ',' + (yBootT + 6) + ' l-34,-26 l0,16 l34,22 z"/>');
    s.push('<text class="nr-lbl" x="' + (cx - hw / 2 - 40) + '" y="' + (yBootT - 26) + '" text-anchor="end">завантаження</text>');
    s.push('<line class="nr-ground" x1="20" y1="' + yBot + '" x2="' + (W - 20) + '" y2="' + yBot + '"/>');
    // розміри
    var xd = cx + hw / 2 + 130;
    function dimV(x, ya, yb, label) {
      return '<line class="nr-dim" x1="' + x + '" y1="' + ya + '" x2="' + x + '" y2="' + yb + '" marker-start="url(#nar)" marker-end="url(#nar)"/>' +
        '<text class="nr-txt" x="' + (x + 6) + '" y="' + ((ya + yb) / 2) + '" dominant-baseline="middle">' + label + '</text>';
    }
    s.push('<line class="nr-ext" x1="' + (cx + hw / 2) + '" y1="' + yTop + '" x2="' + (xd + 6) + '" y2="' + yTop + '"/>');
    s.push(dimV(xd, yTop, yBot, 'H = ' + f(o.H, 2) + ' м'));
    var xs = cx + hw / 2 + 40;
    s.push('<line class="nr-ext" x1="' + (rx + sw) + '" y1="' + yHeadB + '" x2="' + (xs + 6) + '" y2="' + yHeadB + '"/>');
    s.push('<line class="nr-ext" x1="' + (rx + sw) + '" y1="' + yBootT + '" x2="' + (xs + 6) + '" y2="' + yBootT + '"/>');
    s.push(dimV(xs, yHeadB, yBootT, 'секції ' + f(o.shaftLen, 2) + ' м'));
    s.push('<text class="nr-txt" x="' + cx + '" y="' + (yTop + headH * 0.5 + 4) + '" text-anchor="middle" style="font-size:10px">Ø' + o.drum + '</text>');
    s.push('<text class="nr-lbl" x="' + cx + '" y="' + (yBot + 16) + '" text-anchor="middle">стрічка ' + o.belt + ' мм · ківш ' + esc(o.bucketSize) + ' · ' + o.perM + ' шт/м</text>');

    return '<svg viewBox="0 0 ' + W + ' ' + (yBot + 24) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Норія спереду з розмірами" style="max-height:520px">' +
      '<defs><marker id="nar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" fill="#333"/></marker></defs>' +
      '<style>.nr-leg{fill:#d5dae1;stroke:#444}.nr-flange{stroke:#333;stroke-width:2}.nr-belt{stroke:#555;stroke-width:2.5}.nr-bucket{fill:#e6a23c;stroke:#8a5a12;stroke-width:.6}' +
      '.nr-head{fill:#c9ced6;stroke:#333;stroke-width:1.2}.nr-drum{fill:#fff;stroke:#333;stroke-width:1.2}.nr-drum.lag{stroke:#222;stroke-width:4}.nr-gear{fill:#6b7a8c;stroke:#333}' +
      '.nr-motor{fill:#2f6db3;stroke:#1a3d66}.nr-coupling{fill:#e04c4c}.nr-ground{stroke:#8a6d3b;stroke-width:1.5;stroke-dasharray:6 4}.nr-dim{stroke:#333;stroke-width:.9}' +
      '.nr-ext{stroke:#999;stroke-width:.6}.nr-txt{font:13px Arial,sans-serif;fill:#222}.nr-lbl{font:11px Arial,sans-serif;fill:#444}</style>' + s.join('') + '</svg>';
  }

  function priceRow(list, H) {
    if (!list || !list.length) return null;
    for (var i = 0; i < list.length; i++) if (list[i].h >= H - 1e-9) return { row: list[i], above: false };
    return { row: list[list.length - 1], above: true };
  }

  var NODE_FIELDS = [
    ['head', 'Приводна головка', 'шт'], ['boot', 'Натяжний башмак', 'шт'], ['section_per_m', 'Секція шахти, за 1 м', 'грн/м'],
    ['belt_per_m', 'Стрічка, за 1 м', 'грн/м'], ['bucket_metal', 'Ківш металевий', 'шт'], ['bucket_plastic', 'Ківш пластиковий', 'шт'],
    ['bucket_hw', 'Метизи на 1 ківш', 'грн'], ['lagging', 'Футування барабана (1 барабан)', 'шт'], ['coupling', "З'єднувальна муфта", 'шт'],
    ['backstop', 'Муфта зворотного ходу', 'шт']
  ];
  var GEO_FIELDS = [['base_h', 'Висота головки + башмака', 'м'], ['buckets_per_m', 'Ковшів на 1 м стрічки', 'шт'], ['drum_d', 'Діаметр барабана', 'мм'], ['rpm', 'Оберти барабана', 'об/хв']];

  Calc.boot({
    data: ['noria', 'gear_motors'],
    pricing: 'noria',
    docked: true,
    init: initInputs,
    panel: function (Dt) {
      var cap = num($('capacity').value) || 25, idx = 0;
      Dt.noria.models.forEach(function (m, i) { if (m.capacity === cap) idx = i; });
      var base = 'noria.models.' + idx + '.';
      return [
        { tab: 'Розрахунок', details: true, note: 'Довжини, кількості, ціни вузлів і довідковий паперовий прайс.' },
        { tab: 'Вузли ' + cap + ' т/год', note: 'Ціни для обраної продуктивності. Постійно — calc/data/noria.json.',
          fields: NODE_FIELDS.map(function (x) { return { path: base + x[0], label: x[1], unit: x[2] === 'шт' ? 'грн/шт' : x[2] }; }) },
        { tab: 'Геометрія', note: 'Звідки кількості: секції = H − висота головки й башмака; стрічка = 2·H + запас; ковші = стрічка × ковшів/м.',
          fields: GEO_FIELDS.map(function (x) { return { path: base + x[0], label: x[1], unit: x[2] }; }).concat([{ path: 'noria.belt_extra_m', label: 'Запас стрічки', unit: 'м' }]) },
        { tab: 'Приводи', note: 'Ціна мотор-редуктора за кВт (з ПДВ).', fields: [
          { type: 'table', path: 'gear_motors.items', columns: [{ key: 'kw', label: 'кВт', readonly: true }, { key: 'price', label: 'Ціна' }] }
        ] }
      ];
    },
    compute: function (Dt, inp) {
      var N = Dt.noria, cap = num(inp.capacity), H = num(inp.height);
      var m = N.models.filter(function (x) { return x.capacity === cap; })[0];
      if (!m) return { error: 'Оберіть продуктивність' };
      if (H <= 0) return { error: 'Вкажіть висоту норії' };
      if (H <= m.base_h) return { error: 'Висота має бути більшою за висоту головки й башмака (' + f(m.base_h, 2) + ' м)' };
      var shaftLen = H - m.base_h;
      var beltLen = 2 * H + N.belt_extra_m;
      var buckets = ceil(beltLen * m.buckets_per_m);
      var plastic = inp.bucket === 'plastic';
      var lag = num(inp.lagging);
      var pl = priceRow(N.price_list[String(cap)], H);
      var kw = num(inp.kw) > 0 ? num(inp.kw) : (pl ? pl.row.kw : 0);
      var drive = inp.drive;
      var gm = Dt.gear_motors.items.filter(function (x) { return x.kw === kw; })[0];
      var gmPrice = gm ? gm.price : 0;

      var rows = [
        { name: 'Приводна головка', qty: 1, unit: 'шт', qtyDigits: 0, price: m.head, note: 'барабан Ø' + m.drum_d },
        { name: 'Натяжний башмак', qty: 1, unit: 'шт', qtyDigits: 0, price: m.boot },
        { name: 'Секції шахти', qty: shaftLen, unit: 'м', price: m.section_per_m, note: 'H ' + f(H, 2) + ' − ' + f(m.base_h, 3) + ' (головка + башмак)' },
        { name: 'Стрічка ' + m.belt_width + ' мм', qty: beltLen, unit: 'м', price: m.belt_per_m, note: '2 × H + ' + N.belt_extra_m + ' м' },
        { name: 'Ковші ' + (plastic ? 'пластикові ' : 'металеві ') + m.bucket_size, qty: buckets, unit: 'шт', qtyDigits: 0, price: plastic ? m.bucket_plastic : m.bucket_metal, note: f(beltLen, 2) + ' м × ' + m.buckets_per_m + ' шт/м' },
        { name: 'Метизи ковшів', qty: buckets, unit: 'компл.', qtyDigits: 0, price: m.bucket_hw }
      ];
      if (lag > 0) rows.push({ name: 'Футування барабана' + (lag === 2 ? ' (привідний + натяжний)' : ' (привідний)'), qty: lag, unit: 'шт', qtyDigits: 0, price: m.lagging });
      if (inp.coupling) rows.push({ name: "З'єднувальна муфта", qty: 1, unit: 'шт', qtyDigits: 0, price: m.coupling });
      if (inp.backstop) rows.push({ name: 'Муфта зворотного ходу', qty: 1, unit: 'шт', qtyDigits: 0, price: m.backstop });
      if (drive !== 'none' && kw) rows.push({ name: 'Мотор-редуктор ' + kw + ' кВт', qty: 1, unit: 'шт', qtyDigits: 0, price: gmPrice });

      var warnings = [];
      var used = NODE_FIELDS.filter(function (x) {
        var k = x[0];
        if (k === 'bucket_plastic') return plastic;
        if (k === 'bucket_metal') return !plastic;
        if (k === 'lagging') return lag > 0;
        if (k === 'coupling') return !!inp.coupling;
        if (k === 'backstop') return !!inp.backstop;
        return true;
      });
      var empty = used.filter(function (x) { return !m[x[0]]; }).map(function (x) { return x[1].toLowerCase(); });
      if (empty.length === used.length) warnings.push('Ціни вузлів норії ' + cap + ' т/год ще не задані — заповніть у панелі «Вузли» або в calc/data/noria.json (форма PDF «Ціни для калькулятора норії»).');
      else if (empty.length) warnings.push('Не задані ціни: ' + empty.join(', ') + '.');
      if (drive !== 'none' && kw && !gmPrice) warnings.push('Ціна мотор-редуктора ' + kw + ' кВт не задана.');
      if (drive !== 'none' && !kw) warnings.push('Для ' + cap + ' т/год немає прайсу з кВт — оберіть кВт вручну.');
      if (pl && pl.above) warnings.push('Висота більша за паперовий прайс — кВт взято з останнього рядка.');

      var tot = Calc.totals(rows, N.pricing);
      var title = 'Норія ковшова ' + cap + ' т/год, H=' + f(H, 2) + ' м, стрічка ' + m.belt_width + ' мм, ковші ' + (plastic ? 'пластикові' : 'металеві') +
        (drive !== 'none' && kw ? ', мотор-редуктор ' + kw + ' кВт' : '');
      var details = [
        { group: 'Розміри й кількості', items: [
          { label: 'Висота головки + башмака', formula: 'CRM, для ' + cap + ' т/год', value: f(m.base_h, 3) + ' м' },
          { label: 'Довжина секцій шахти', formula: f(H, 2) + ' − ' + f(m.base_h, 3), value: f(shaftLen, 2) + ' м' },
          { label: 'Секцій по 2 м (довідково)', formula: 'довжина / 2', value: f(Math.floor(shaftLen / 2), 0) + ' × 2 м' + (shaftLen % 2 > 0.01 ? ' + ' + f(shaftLen % 2, 2) + ' м' : '') },
          { label: 'Довжина стрічки', formula: '2 × ' + f(H, 2) + ' + ' + N.belt_extra_m, value: f(beltLen, 2) + ' м' },
          { label: 'Ковшів', formula: 'вгору(' + f(beltLen, 2) + ' × ' + m.buckets_per_m + ')', value: buckets + ' шт' },
          { label: 'Стрічка / барабан / ківш', formula: 'вкладка НКЗ', value: m.belt_width + ' / Ø' + m.drum_d + ' / ' + m.bucket_size },
          { label: 'Оберти барабана', formula: '', value: m.rpm + ' об/хв' }
        ] },
        { group: 'Вартість вузлів', items: rows.map(function (r) {
          return { label: r.name, formula: f(r.qty, r.qtyDigits == null ? 2 : r.qtyDigits) + ' ' + r.unit + ' × ' + money(r.price), value: money(r.qty * r.price) };
        }) }
      ];
      if (pl) details.push({ group: 'Довідково: паперовий прайс', items: [
        { label: 'Рядок прайсу', formula: 'перший рядок з висотою ≥ H', value: 'H ' + f(pl.row.h, 2) + ' м' },
        { label: 'Ціна в прайсі', formula: cap === 100 ? 'без приводу' : 'може включати привід', value: money(pl.row.price) + ' грн' },
        { label: 'Потужність', formula: 'з прайсу', value: pl.row.kw + ' кВт' }
      ] });

      return {
        title: title,
        rows: rows,
        warnings: warnings,
        details: details,
        viz: drawNoria({ H: H, shaftLen: shaftLen, headH: m.base_h * 0.55, bootH: m.base_h * 0.45, perM: m.buckets_per_m, drum: m.drum_d, belt: m.belt_width,
          bucketSize: m.bucket_size, lagging: lag, coupling: !!inp.coupling, backstop: !!inp.backstop, drive: drive, kw: kw }),
        after: '<button type="button" class="btn btn-sm btn-success mt-2" data-copy="' + esc(title + ' — ' + f(tot.total, 0) + ' грн з ПДВ.') + '">Скопіювати для клієнта</button>',
        info: [
          { label: 'Секції / стрічка', value: f(shaftLen, 2) + ' м / ' + f(beltLen, 2) + ' м' },
          { label: 'Ковшів', value: buckets + ' шт' },
          { label: 'Довідково: паперовий прайс', value: pl ? money(pl.row.price) + ' грн (H ' + f(pl.row.h, 2) + ' м)' : 'немає для ' + cap + ' т/год' }
        ]
      };
    }
  });
})();
