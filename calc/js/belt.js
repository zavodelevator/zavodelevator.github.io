// Стрічковий транспортер за вузлами: приводна і натяжна станції, став, роликоопори, стрічка, футування, мотор-редуктор.
(function () {
  'use strict';
  var num = Calc.num, money = Calc.money, esc = Calc.esc;
  function f(x, d) { return Number(x).toLocaleString('uk-UA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function $(id) { return document.getElementById(id); }

  function W(Dt, w) { return Dt.belt_conveyor.widths.filter(function (x) { return x.width === w; })[0]; }

  function initInputs(Dt) {
    $('width').innerHTML = Dt.belt_conveyor.widths.map(function (w) { return '<option value="' + w.width + '"' + (w.width === 500 ? ' selected' : '') + '>' + w.width + ' мм</option>'; }).join('');
    $('top_pitch').placeholder = f(Dt.belt_conveyor.top_pitch, 1);
    $('bottom_pitch').placeholder = f(Dt.belt_conveyor.bottom_pitch, 1);
    $('motor').innerHTML = '<option value="auto">Авто (за таблицею кВт)</option><option value="none">Без мотор-редуктора</option>' +
      Dt.noria_catalog.gear_motors.slice().sort(function (a, b) { return a.kw - b.kw || a.price - b.price; })
        .map(function (g) { return '<option value="' + esc(g.id) + '">' + g.kw + ' кВт · ' + esc(g.type) + ' габ.' + esc(g.gab) + ' · ' + esc(g.saler) + ' — ' + f(g.price, 0) + '</option>'; }).join('');
    $('width').addEventListener('change', function () { Calc.renderPanel(); });
    document.querySelectorAll('[data-toggle-group] input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', function () { document.querySelectorAll('input[name="' + r.name + '"]').forEach(function (x) { x.parentNode.classList.toggle('active', x.checked); }); });
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

  // ---------- креслення: збоку ----------
  function drawBelt(o) {
    var Wd = 820, x0 = 100, x1 = 700, yTop = 110, yBot = 160, R = 22;
    var k = (x1 - x0) / o.L, s = [];
    // рама (став)
    s.push('<rect class="bc-frame" x="' + x0 + '" y="' + (yTop + 10) + '" width="' + (x1 - x0) + '" height="10"/>');
    var legs = Math.max(2, Math.ceil(o.L / 3) + 1);
    for (var i = 0; i < legs; i++) { var lx = x0 + (x1 - x0) * i / (legs - 1); s.push('<line class="bc-leg" x1="' + lx + '" y1="' + (yTop + 20) + '" x2="' + lx + '" y2="' + (yBot + 40) + '"/>'); }
    s.push('<line class="bc-ground" x1="40" y1="' + (yBot + 40) + '" x2="' + (Wd - 40) + '" y2="' + (yBot + 40) + '"/>');
    // стрічка
    s.push('<line class="bc-belt" x1="' + x0 + '" y1="' + (yTop - R + 2) + '" x2="' + x1 + '" y2="' + (yTop - R + 2) + '"/>');
    s.push('<line class="bc-belt ret" x1="' + x0 + '" y1="' + (yTop + R - 2 + 30) + '" x2="' + x1 + '" y2="' + (yTop + R - 2 + 30) + '"/>');
    s.push('<path class="bc-belt" d="M' + x1 + ',' + (yTop - R + 2) + ' A' + (R + 13) + ',' + (R + 13) + ' 0 0,1 ' + x1 + ',' + (yTop + R - 2 + 30) + '"/>');
    s.push('<path class="bc-belt" d="M' + x0 + ',' + (yTop - R + 2) + ' A' + (R + 13) + ',' + (R + 13) + ' 0 0,0 ' + x0 + ',' + (yTop + R - 2 + 30) + '"/>');
    // роликоопори
    for (var t = 1; t <= o.nTop; t++) { var xt = x0 + t * o.topPitch * k; if (xt < x1 - 6) s.push('<circle class="bc-idler" cx="' + xt + '" cy="' + (yTop - R + 8) + '" r="5"/>'); }
    for (var b = 1; b <= o.nBot; b++) { var xb = x0 + b * o.botPitch * k; if (xb < x1 - 6) s.push('<circle class="bc-idler ret" cx="' + xb + '" cy="' + (yTop + R + 22) + '" r="5"/>'); }
    // барабани
    s.push('<circle class="bc-drum' + (o.lagging ? ' lag' : '') + '" cx="' + x1 + '" cy="' + (yTop + 15) + '" r="' + (R + 10) + '"/>');
    s.push('<circle class="bc-drum" cx="' + x0 + '" cy="' + (yTop + 15) + '" r="' + (R + 6) + '"/>');
    s.push('<text class="bc-lbl" x="' + x0 + '" y="' + (yBot + 58) + '" text-anchor="middle">натяжна станція</text>');
    s.push('<text class="bc-lbl" x="' + x1 + '" y="' + (yBot + 58) + '" text-anchor="middle">приводна станція</text>');
    if (o.kw) {
      s.push('<rect class="bc-gear" x="' + (x1 + 36) + '" y="' + (yTop) + '" width="24" height="30" rx="3"/><rect class="bc-motor" x="' + (x1 + 60) + '" y="' + (yTop + 3) + '" width="40" height="24" rx="6"/>');
      s.push('<text class="bc-lbl" x="' + (x1 + 70) + '" y="' + (yTop - 6) + '" text-anchor="middle">МР ' + f(o.kw, o.kw % 1 ? 1 : 0) + ' кВт</text>');
    }
    // розміри
    var yd = yTop - R - 30;
    s.push('<line class="bc-dim" x1="' + x0 + '" y1="' + yd + '" x2="' + x1 + '" y2="' + yd + '" marker-start="url(#bar)" marker-end="url(#bar)"/>');
    s.push('<text class="bc-txt" x="' + ((x0 + x1) / 2) + '" y="' + (yd - 6) + '" text-anchor="middle">L = ' + f(o.L, 2) + ' м · стрічка ' + o.width + ' мм</text>');
    if (o.nTop >= 2) {
      var xa = x0 + o.topPitch * k, xb2 = x0 + 2 * o.topPitch * k, yk = yTop - R - 8;
      s.push('<line class="bc-dim" x1="' + xa + '" y1="' + yk + '" x2="' + xb2 + '" y2="' + yk + '" marker-start="url(#bar)" marker-end="url(#bar)"/>');
      s.push('<text class="bc-lbl" x="' + (xb2 + 4) + '" y="' + (yk + 3) + '">крок верхніх ' + f(o.topPitch, 1) + ' м · ' + o.nTop + ' шт</text>');
    }
    if (o.nBot >= 2) {
      var xc = x0 + o.botPitch * k, xd = x0 + 2 * o.botPitch * k, yb2 = yTop + R + 40;
      s.push('<line class="bc-dim" x1="' + xc + '" y1="' + yb2 + '" x2="' + xd + '" y2="' + yb2 + '" marker-start="url(#bar)" marker-end="url(#bar)"/>');
      s.push('<text class="bc-lbl" x="' + ((xc + xd) / 2) + '" y="' + (yb2 + 13) + '" text-anchor="middle">крок нижніх ' + f(o.botPitch, 1) + ' м</text>');
    }
    return '<svg viewBox="0 30 ' + Wd + ' ' + (yBot + 40) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Стрічковий транспортер збоку">' +
      '<defs><marker id="bar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" fill="#333"/></marker></defs>' +
      '<style>.bc-frame{fill:#c9ced6;stroke:#444}.bc-leg{stroke:#555;stroke-width:3}.bc-ground{stroke:#8a6d3b;stroke-width:1.5;stroke-dasharray:6 4}' +
      '.bc-belt{fill:none;stroke:#222;stroke-width:4}.bc-belt.ret{stroke:#555;stroke-width:3}.bc-idler{fill:#fff;stroke:#1d4f86;stroke-width:2}.bc-idler.ret{stroke:#6c8fb5}' +
      '.bc-drum{fill:#e3e7ec;stroke:#333;stroke-width:1.5}.bc-drum.lag{stroke:#222;stroke-width:5}.bc-gear{fill:#6b7a8c;stroke:#333}.bc-motor{fill:#2f6db3;stroke:#1a3d66}' +
      '.bc-dim{stroke:#333;stroke-width:.9}.bc-txt{font:13px Arial,sans-serif;fill:#222}.bc-lbl{font:11px Arial,sans-serif;fill:#444}</style>' + s.join('') + '</svg>';
  }

  Calc.boot({
    data: ['belt_conveyor', 'noria_catalog'],
    pricing: 'belt_conveyor',
    docked: true,
    init: initInputs,
    panel: function (Dt) {
      var w = num($('width').value) || 500, i = 0;
      Dt.belt_conveyor.widths.forEach(function (x, j) { if (x.width === w) i = j; });
      var P = 'belt_conveyor.widths.' + i + '.';
      return [
        { tab: 'Розрахунок', details: true, note: 'Кількості, формули й вартість вузлів.' },
        { tab: 'Стрічка ' + w, note: 'Ціни для ширини ' + w + ' мм, з ПДВ. Постійно — calc/data/belt_conveyor.json.', fields: [
          { path: P + 'drive_station', label: 'Приводна станція', unit: 'грн/шт' },
          { path: P + 'tail_station', label: 'Натяжна станція', unit: 'грн/шт' },
          { path: P + 'frame_per_m', label: 'Став (рама), за 1 м', unit: 'грн/м' },
          { path: P + 'idler_trough', label: 'Роликоопора робоча жолобчаста (3 ролики)', unit: 'грн/шт' },
          { path: P + 'idler_flat', label: 'Роликоопора робоча пряма (1 ролик)', unit: 'грн/шт' },
          { path: P + 'idler_return', label: 'Роликоопора зворотна (нижня)', unit: 'грн/шт' },
          { path: P + 'belt_per_m', label: 'Стрічка ' + w + ' мм, за 1 м', unit: 'грн/м' },
          { path: P + 'lagging', label: 'Футування приводного барабана', unit: 'грн/шт' }
        ] },
        { tab: 'Потужність', note: 'кВт для стрічки ' + w + ' мм за довжиною. 0 — не задано.',
          fields: Dt.belt_conveyor.widths[i].kw_by_length.map(function (r, j) { return { path: P + 'kw_by_length.' + j + '.kw', label: 'до ' + r.max_length + ' м', unit: 'кВт' }; }) },
        { tab: 'Геометрія', fields: [
          { path: 'belt_conveyor.top_pitch', label: 'Крок верхніх роликоопор (за замовч.)', unit: 'м' },
          { path: 'belt_conveyor.bottom_pitch', label: 'Крок нижніх роликоопор (за замовч.)', unit: 'м' },
          { path: 'belt_conveyor.stations_length', label: 'Довжина двох станцій разом', unit: 'м' },
          { path: 'belt_conveyor.belt_extra_m', label: 'Запас стрічки на барабани', unit: 'м' }
        ] }
      ];
    },
    compute: function (Dt, inp) {
      var B = Dt.belt_conveyor, w = W(Dt, num(inp.width)), L = num(inp.length);
      if (!w) return { error: 'Оберіть ширину стрічки' };
      if (L <= B.stations_length) return { error: 'Довжина має бути більшою за ' + B.stations_length + ' м (дві станції)' };
      var topPitch = num(inp.top_pitch) > 0 ? num(inp.top_pitch) : B.top_pitch;
      var botPitch = num(inp.bottom_pitch) > 0 ? num(inp.bottom_pitch) : B.bottom_pitch;
      var frameLen = L - B.stations_length;
      var beltLen = 2 * L + B.belt_extra_m;
      var nTop = Math.max(0, Math.ceil(L / topPitch - 1e-9) - 1);
      var nBot = Math.max(0, Math.ceil(L / botPitch - 1e-9) - 1);
      var trough = inp.idler !== 'flat';
      var rows = [
        { name: 'Приводна станція (барабан, рама)', qty: 1, unit: 'шт', qtyDigits: 0, price: w.drive_station },
        { name: 'Натяжна станція (барабан, натяжний пристрій)', qty: 1, unit: 'шт', qtyDigits: 0, price: w.tail_station },
        { name: 'Став (рама)', qty: frameLen, unit: 'м', price: w.frame_per_m, note: 'L ' + f(L, 2) + ' − ' + B.stations_length + ' м (станції)' },
        { name: 'Роликоопора робоча ' + (trough ? 'жолобчаста (3 ролики)' : 'пряма (1 ролик)'), qty: nTop, unit: 'шт', qtyDigits: 0, price: trough ? w.idler_trough : w.idler_flat, note: 'крок ' + f(topPitch, 2) + ' м' },
        { name: 'Роликоопора зворотна (нижня)', qty: nBot, unit: 'шт', qtyDigits: 0, price: w.idler_return, note: 'крок ' + f(botPitch, 2) + ' м' },
        { name: 'Стрічка ' + w.width + ' мм', qty: beltLen, unit: 'м', price: w.belt_per_m, note: '2 × L + ' + B.belt_extra_m + ' м' + (w.belt_note ? ' · ' + w.belt_note : '') }
      ];
      var warnings = [];
      if (inp.lagging) rows.push({ name: 'Футування приводного барабана', qty: 1, unit: 'шт', qtyDigits: 0, price: w.lagging });
      var kwRow = w.kw_by_length.filter(function (r) { return r.max_length >= L - 1e-9 && r.kw > 0; })[0], kwNeed = kwRow ? kwRow.kw : 0;
      var motorId = inp.motor;
      if (motorId === 'auto') {
        var c = Dt.noria_catalog.gear_motors.filter(function (g) { return g.kw === kwNeed; }).sort(function (a, b) { return a.price - b.price; });
        motorId = c.length ? c[0].id : 'none';
      }
      var motor = Dt.noria_catalog.gear_motors.filter(function (g) { return g.id === motorId; })[0];
      if (motor) rows.push({ name: 'Мотор-редуктор ' + motor.kw + ' кВт ' + motor.type + ' габ.' + motor.gab, qty: 1, unit: 'шт', qtyDigits: 0, price: motor.price, note: motor.saler + ' (каталог НКЗ)' });
      var missing = rows.filter(function (r) { return !r.price && r.qty; }).map(function (r) { return r.name.toLowerCase(); });
      if (missing.length) warnings.push('Не задані ціни: ' + missing.join(', ') + ' — заповніть у панелі «Стрічка ' + w.width + '».');
      if (!motor && inp.motor === 'auto') warnings.push('Потужність для стрічки ' + w.width + ' мм довжиною ' + f(L, 2) + ' м не задана — оберіть мотор-редуктор вручну або заповніть панель «Потужність».');
      if (motor && kwNeed && motor.kw < kwNeed) warnings.push('Обрано ' + motor.kw + ' кВт, а за таблицею потрібно ' + kwNeed + ' кВт.');
      if (L > B.max_length) warnings.push('Довжина більша за ' + B.max_length + ' м — перевірте з конструктором.');

      var tot = Calc.totals(rows, B.pricing);
      var title = 'Транспортер стрічковий, стрічка ' + w.width + ' мм, L=' + f(L, 2) + ' м, роликоопори ' + (trough ? 'жолобчасті' : 'прямі') +
        (inp.lagging ? ', футерований приводний барабан' : '') + (motor ? ', мотор-редуктор ' + motor.kw + ' кВт' : '');
      var details = [
        { group: 'Розміри й кількості', items: [
          { label: 'Став', formula: f(L, 2) + ' − ' + B.stations_length, value: f(frameLen, 2) + ' м' },
          { label: 'Стрічка', formula: '2 × ' + f(L, 2) + ' + ' + B.belt_extra_m, value: f(beltLen, 2) + ' м' },
          { label: 'Робочих роликоопор', formula: 'вгору(' + f(L, 2) + ' / ' + f(topPitch, 2) + ') − 1', value: nTop + ' шт' },
          { label: 'Зворотних роликоопор', formula: 'вгору(' + f(L, 2) + ' / ' + f(botPitch, 2) + ') − 1', value: nBot + ' шт' },
          { label: 'Потужність за таблицею', formula: kwRow ? 'до ' + kwRow.max_length + ' м' : 'таблиця не заповнена', value: kwNeed ? kwNeed + ' кВт' : '—' }
        ] },
        { group: 'Вартість вузлів', items: rows.map(function (r) {
          return { label: r.name, formula: f(r.qty, r.qtyDigits == null ? 2 : r.qtyDigits) + ' ' + r.unit + ' × ' + money(r.price), value: money(r.qty * r.price) };
        }) }
      ];
      return {
        title: title,
        rows: rows,
        warnings: warnings,
        details: details,
        viz: drawBelt({ L: L, width: w.width, topPitch: topPitch, botPitch: botPitch, nTop: nTop, nBot: nBot, lagging: !!inp.lagging, kw: motor ? motor.kw : 0 }),
        after: '<button type="button" class="btn btn-sm btn-success mt-2" data-copy="' + esc(title + ' — ' + f(tot.total, 0) + ' грн з ПДВ.') + '">Скопіювати для клієнта</button>',
        info: [
          { label: 'Стрічка / став', value: f(beltLen, 2) + ' м / ' + f(frameLen, 2) + ' м' },
          { label: 'Роликоопори робочі / зворотні', value: nTop + ' / ' + nBot + ' шт' }
        ]
      };
    }
  });
})();
