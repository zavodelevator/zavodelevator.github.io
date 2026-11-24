// Шнековий транспортер: простий прайс (CRM ScrewConveyorSimpleCalculator) + детальний розрахунок (CRM shnek_core, js/shnek_core.js).
(function () {
  'use strict';
  var num = Calc.num, money = Calc.money, esc = Calc.esc;
  function f(x, d) { return Number(x).toLocaleString('uk-UA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function $(id) { return document.getElementById(id); }
  var DEFAULT_SIZE = { tube: 159, trough: 250 };

  // ---------- поля ----------
  function fillSizes(cfg) {
    var type = document.querySelector('input[name="type"]:checked').value;
    var sel = $('size'), cur = num(sel.value);
    var list = cfg.std[type];
    sel.innerHTML = list.map(function (x) { return '<option value="' + x + '">' + (type === 'tube' ? 'Ø' : '') + x + '</option>'; }).join('');
    sel.value = list.indexOf(cur) >= 0 ? cur : DEFAULT_SIZE[type];
  }

  function initInputs(Dt) {
    var cfg = Dt.shnek_core;
    fillSizes(cfg);
    $('preset').innerHTML = Object.keys(cfg.presets).map(function (k) { return '<option value="' + k + '">' + esc(cfg.presets[k].label) + '</option>'; }).join('');
    $('profile').innerHTML = Object.keys(cfg.drive.profiles).map(function (k) {
      return '<option value="' + k + '"' + (k === cfg.drive.default_profile ? ' selected' : '') + '>' + esc(cfg.drive.profiles[k].label) + '</option>';
    }).join('');
    $('wheels').innerHTML = Object.keys(cfg.wheels).map(function (k) { return '<option value="' + k + '">' + esc(cfg.wheels[k]) + '</option>'; }).join('');
    $('kw').innerHTML = '<option value="0">авто</option>' + Dt.gear_motors.items.map(function (x) { return '<option value="' + x.kw + '">' + x.kw + '</option>'; }).join('');

    document.querySelectorAll('[data-toggle-group] input[type="radio"]').forEach(function (r) {
      r.addEventListener('change', function () {
        document.querySelectorAll('input[name="' + r.name + '"]').forEach(function (x) { x.parentNode.classList.toggle('active', x.checked); });
        if (r.name === 'type') fillSizes(cfg);
      });
    });
    ['size', 'preset'].forEach(function (id) { $(id).addEventListener('change', function () { Calc.renderPanel(); }); });
    document.querySelectorAll('input[name="type"]').forEach(function (r) { r.addEventListener('change', function () { Calc.renderPanel(); }); });
    $('stand').addEventListener('change', function () { $('chassis-fields').hidden = $('stand').value !== 'chassis'; });
    $('drive').addEventListener('change', function () { $('kw').disabled = $('drive').value === 'none'; });

    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]');
      if (!b) return;
      var text = b.getAttribute('data-copy');
      var done = function () { var t = b.textContent; b.textContent = 'Скопійовано ✓'; setTimeout(function () { b.textContent = t; }, 1500); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done);
      else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); }
    });
  }

  // ---------- креслення ----------
  function drawConveyor(o) {
    var W = 820, Hh = 330, gy = 290;
    var total = o.L + o.krot;
    var k = 560 / total;
    var hp = Math.max(18, Math.min(46, 14 + o.size / 12));
    var a = Math.min(o.slope, 20) * Math.PI / 180;
    var x0 = 110 + o.krot * k, y0 = gy - 70 - hp / 2;
    var x1 = x0 + o.L * k;
    var s = [];
    function zig(xa, xb, yc, amp, step, cls) {
      var pts = [], i = 0;
      for (var x = xa; x <= xb + 0.1; x += step / 2, i++) pts.push(x.toFixed(1) + ',' + (yc + (i % 2 ? amp : -amp)).toFixed(1));
      return '<polyline class="' + cls + '" points="' + pts.join(' ') + '"/>';
    }
    var pitchPx = Math.max(8, Math.min(30, o.size * k));
    var g = [];
    // крот
    if (o.krot > 0) {
      g.push('<line class="cv-shaft" x1="' + (x0 - o.krot * k) + '" y1="' + y0 + '" x2="' + x0 + '" y2="' + y0 + '"/>');
      g.push(zig(x0 - o.krot * k, x0, y0, hp / 2 - 2, pitchPx, 'cv-flight-open'));
      g.push('<text class="cv-lbl" x="' + (x0 - o.krot * k / 2) + '" y="' + (y0 + hp / 2 + 14) + '" text-anchor="middle">крот ' + f(o.krot, 1) + ' м</text>');
    }
    // корпус
    var rx = o.type === 'tube' ? hp / 2 : 3;
    g.push('<rect class="cv-casing" x="' + x0 + '" y="' + (y0 - hp / 2) + '" width="' + (x1 - x0) + '" height="' + hp + '" rx="' + Math.min(rx, 8) + '"/>');
    if (o.type === 'trough') g.push('<line class="cv-cover" x1="' + x0 + '" y1="' + (y0 - hp / 2) + '" x2="' + x1 + '" y2="' + (y0 - hp / 2) + '"/>');
    g.push(zig(x0 + 4, x1 - 4, y0, hp / 2 - 4, pitchPx, 'cv-flight'));
    g.push('<line class="cv-axis" x1="' + (x0 - 10) + '" y1="' + y0 + '" x2="' + (x1 + 10) + '" y2="' + y0 + '"/>');
    for (var m = 2; m < o.L - 0.01; m += 2) g.push('<line class="cv-flange" x1="' + (x0 + m * k) + '" y1="' + (y0 - hp / 2 - 3) + '" x2="' + (x0 + m * k) + '" y2="' + (y0 + hp / 2 + 3) + '"/>');
    // завантаження + бункер
    var xi = x0 + Math.min(0.35, o.L * 0.15) * k;
    g.push('<rect class="cv-pipe" x="' + (xi - 9) + '" y="' + (y0 - hp / 2 - 16) + '" width="18" height="16"/>');
    if (o.hopper > 0) {
      var hw = 34 + Math.min(o.hopper, 5) * 16, hh = 26 + Math.min(o.hopper, 5) * 8, ht = y0 - hp / 2 - 16;
      g.push('<polygon class="cv-hopper" points="' + (xi - 9) + ',' + ht + ' ' + (xi + 9) + ',' + ht + ' ' + (xi + hw / 2) + ',' + (ht - hh) + ' ' + (xi - hw / 2) + ',' + (ht - hh) + '"/>');
      g.push('<text class="cv-lbl" x="' + xi + '" y="' + (ht - hh - 6) + '" text-anchor="middle">бункер ' + f(o.hopper, o.hopper < 1 ? 2 : 1) + ' м³</text>');
    } else g.push('<text class="cv-lbl" x="' + xi + '" y="' + (y0 - hp / 2 - 22) + '" text-anchor="middle">завантаження</text>');
    // вивантаження
    var xo = x1 - Math.min(0.35, o.L * 0.15) * k;
    g.push('<rect class="cv-pipe" x="' + (xo - 9) + '" y="' + (y0 + hp / 2) + '" width="18" height="16"/>');
    g.push('<text class="cv-lbl" x="' + xo + '" y="' + (y0 + hp / 2 + 30) + '" text-anchor="middle">вивантаження</text>');
    // привід
    if (o.drive !== 'none') {
      g.push('<rect class="cv-drive" x="' + (x1 + 2) + '" y="' + (y0 - 16) + '" width="22" height="32" rx="3"/>');
      g.push('<rect class="cv-motor" x="' + (x1 + 24) + '" y="' + (y0 - 13) + '" width="38" height="26" rx="6"/>');
      g.push('<text class="cv-lbl" x="' + (x1 + 40) + '" y="' + (y0 - 22) + '" text-anchor="middle">' + (o.drive === 'gear' ? 'МР ' : 'двигун ') + (o.kw ? f(o.kw, o.kw % 1 ? 1 : 0) + ' кВт' : '') + '</text>');
    } else g.push('<rect class="cv-pipe" x="' + x1 + '" y="' + (y0 - 6) + '" width="14" height="12"/>');
    // розміри вздовж корпусу
    var yd = y0 + hp / 2 + 44;
    g.push('<line class="cv-dim" x1="' + x0 + '" y1="' + yd + '" x2="' + x1 + '" y2="' + yd + '" marker-start="url(#car)" marker-end="url(#car)"/>');
    g.push('<line class="cv-ext" x1="' + x0 + '" y1="' + (y0 + hp / 2) + '" x2="' + x0 + '" y2="' + (yd + 4) + '"/>');
    g.push('<line class="cv-ext" x1="' + x1 + '" y1="' + (y0 + hp / 2) + '" x2="' + x1 + '" y2="' + (yd + 4) + '"/>');
    g.push('<text class="cv-txt" x="' + ((x0 + x1) / 2) + '" y="' + (yd - 5) + '" text-anchor="middle">L = ' + f(o.L, 2) + ' м</text>');
    g.push('<text class="cv-txt" x="' + ((x0 + x1) / 2) + '" y="' + (y0 - hp / 2 - 8) + '" text-anchor="middle">' + (o.type === 'tube' ? 'труба Ø' : 'жолоб ') + o.size + '</text>');

    var rot = 'rotate(' + (-o.slope) + ' ' + x0 + ' ' + (y0 + hp / 2) + ')';
    s.push('<g transform="' + rot + '">' + g.join('') + '</g>');

    // опори (вертикальні, до землі)
    function yAt(x) { return (y0 + hp / 2) - (x - x0) * Math.tan(a); }
    if (o.stand === 'stand') {
      var nLegs = Math.max(2, Math.ceil(o.L / 3) + 1);
      for (var i = 0; i < nLegs; i++) {
        var lx = x0 + 10 + (x1 - x0 - 20) * i / (nLegs - 1);
        var px = x0 + (lx - x0) * Math.cos(a), py = yAt(x0) - (lx - x0) * Math.sin(a);
        s.push('<line class="cv-leg" x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + gy + '"/>');
        s.push('<line class="cv-leg" x1="' + (px - 8) + '" y1="' + gy + '" x2="' + (px + 8) + '" y2="' + gy + '"/>');
      }
    } else if (o.stand === 'chassis') {
      var cx = x0 + (x1 - x0) * 0.45 * Math.cos(a), cy = yAt(x0) - (x1 - x0) * 0.45 * Math.sin(a);
      s.push('<polyline class="cv-leg" points="' + (cx - 40) + ',' + (gy - 14) + ' ' + cx + ',' + cy + ' ' + (cx + 40) + ',' + (gy - 14) + '"/>');
      s.push('<line class="cv-leg" x1="' + (cx - 40) + '" y1="' + (gy - 14) + '" x2="' + (cx + 40) + '" y2="' + (gy - 14) + '"/>');
      s.push('<circle class="cv-wheel" cx="' + (cx - 40) + '" cy="' + (gy - 14) + '" r="14"/><circle class="cv-wheel" cx="' + (cx + 40) + '" cy="' + (gy - 14) + '" r="14"/>');
      if (o.winch) s.push('<rect class="cv-drive" x="' + (cx - 6) + '" y="' + (gy - 40) + '" width="12" height="10"/><text class="cv-lbl" x="' + (cx + 10) + '" y="' + (gy - 32) + '">лебідка</text>');
    }
    s.push('<line class="cv-ground" x1="20" y1="' + gy + '" x2="' + (W - 20) + '" y2="' + gy + '"/>');
    if (o.slope > 0) {
      var ax = x0 + 70;
      s.push('<path class="cv-dim" d="M' + ax + ',' + (y0 + hp / 2) + ' A70,70 0 0,0 ' + (x0 + 70 * Math.cos(a)) + ',' + (y0 + hp / 2 - 70 * Math.sin(a)) + '" fill="none"/>');
      s.push('<line class="cv-ext" x1="' + x0 + '" y1="' + (y0 + hp / 2) + '" x2="' + (x0 + 90) + '" y2="' + (y0 + hp / 2) + '"/>');
      s.push('<text class="cv-txt" x="' + (ax + 6) + '" y="' + (y0 + hp / 2 - 8) + '">' + f(o.slope, 0) + '°</text>');
    }
    var top = Math.min(10, y0 - hp / 2 - (x1 - x0) * Math.sin(a) - 80);
    return '<svg viewBox="0 ' + top + ' ' + W + ' ' + (Hh - top) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Шнековий транспортер збоку">' +
      '<defs><marker id="car" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" fill="#333"/></marker></defs>' +
      '<style>.cv-casing{fill:#d5dae1;stroke:#444;stroke-width:1.2}.cv-cover{stroke:#222;stroke-width:3}.cv-flight{fill:none;stroke:#1d4f86;stroke-width:1.2;stroke-dasharray:3 2}' +
      '.cv-flight-open{fill:none;stroke:#1d4f86;stroke-width:2}.cv-shaft{stroke:#555;stroke-width:4}.cv-axis{stroke:#999;stroke-dasharray:12 3 2 3;stroke-width:.7}' +
      '.cv-flange{stroke:#444;stroke-width:2}.cv-pipe{fill:#bfc6cf;stroke:#444}.cv-hopper{fill:#e3e7ec;stroke:#444}.cv-drive{fill:#6b7a8c;stroke:#333}.cv-motor{fill:#2f6db3;stroke:#1a3d66}' +
      '.cv-leg{fill:none;stroke:#555;stroke-width:3}.cv-wheel{fill:#333;stroke:#111}.cv-ground{stroke:#8a6d3b;stroke-width:1.5;stroke-dasharray:6 4}' +
      '.cv-dim{stroke:#333;stroke-width:.9}.cv-ext{stroke:#999;stroke-width:.6}.cv-txt{font:13px Arial,sans-serif;fill:#222}.cv-lbl{font:11px Arial,sans-serif;fill:#444}</style>' +
      s.join('') + '</svg>';
  }


  // ---------- за секціями ----------
  var SEC_FIELDS = [
    ['casing_2m', 'Кожух (метал), секція 2 м'], ['shaft_2m', 'Трубовал, секція 2 м'], ['spiral_2m', 'Спіраль, секція 2 м'],
    ['hanger', 'Підвіс (кронштейн + втулка + змащення), шт'], ['end_plate', 'Торцева плита з підшипником і цапфою, шт'],
    ['drive_gear', 'Привідна секція під мотор-редуктор'], ['drive_motor', 'Привідна секція ремінна (натяг, шківи, паси)'],
    ['nozzles', 'Патрубки завантаження + вивантаження'], ['consum_pct', 'Витратні, % від суми']
  ];
  function currentSel() {
    var t = document.querySelector('input[name="type"]:checked');
    return { type: t ? t.value : 'tube', size: num($('size').value), preset: $('preset').value || 'black' };
  }
  function sectionIdx(Dt, sel) {
    var list = ((Dt.sections.items[sel.preset] || {})[sel.type]) || [];
    for (var i = 0; i < list.length; i++) if (list[i].size === sel.size) return i;
    return -1;
  }
  function sectionsTab(Dt) {
    var sel = currentSel(), i = sectionIdx(Dt, sel);
    var lbl = (Dt.shnek_core.presets[sel.preset] || {}).label || sel.preset;
    if (i < 0) return { tab: 'Секції', note: 'Немає цін секцій для цього типорозміру.', fields: [] };
    var base = 'sections.items.' + sel.preset + '.' + sel.type + '.' + i + '.';
    return { tab: 'Секції', note: 'Режим «За секціями». ' + (sel.type === 'tube' ? 'Труба Ø' : 'Жолоб ') + sel.size + ', ' + lbl +
      '. Ціни без ПДВ, з коеф. виготовлення; початкові — з детального розрахунку. Постійно — calc/data/sections.json.',
      fields: SEC_FIELDS.map(function (x) { return { path: base + x[0], label: x[1], unit: x[0] === 'consum_pct' ? '%' : 'грн' }; }) };
  }
  var CORE_IDS = ['casing', 'flange', 'cover', 'ribs', 'shaft', 'flight', 'stub', 'endplate', 'bearing', 'gland', 'inlet', 'outlet',
    'hanger', 'hangerBush', 'greaseTube', 'gearplate', 'coupling', 'tension', 'pulleys', 'feet', 'consum'];
  function sectionRows(Dt, sel, L, drive, q, extraOpts) {
    var i = sectionIdx(Dt, sel);
    if (i < 0) return null;
    var it = Dt.sections.items[sel.preset][sel.type][i], secM = Dt.sections.section_m;
    var nSec = L / secM, nHang = Math.max(0, Math.ceil(L * 1000 / Dt.shnek_core.hanger_spacing) - 1);
    var rows = [
      { name: 'Кожух (метал)', qty: nSec, unit: 'секц.', price: it.casing_2m, note: 'секція ' + secM + ' м' },
      { name: 'Трубовал', qty: nSec, unit: 'секц.', price: it.shaft_2m, note: 'секція ' + secM + ' м' },
      { name: 'Спіраль', qty: nSec, unit: 'секц.', price: it.spiral_2m, note: 'секція ' + secM + ' м' },
      { name: 'Підвіс', qty: nHang, unit: 'шт', qtyDigits: 0, price: it.hanger, note: 'кожні ' + Dt.shnek_core.hanger_spacing / 1000 + ' м' },
      { name: 'Торцева плита з підшипником', qty: 2, unit: 'шт', qtyDigits: 0, price: it.end_plate },
      { name: drive === 'motor' ? 'Привідна секція (ремінна)' : 'Привідна секція (під МР)', qty: 1, unit: 'шт', qtyDigits: 0, price: drive === 'motor' ? it.drive_motor : it.drive_gear },
      { name: 'Патрубки завантаження/вивантаження', qty: 1, unit: 'компл.', qtyDigits: 0, price: it.nozzles }
    ];
    if (q && !q.error) q.parts.forEach(function (p) {
      if (CORE_IDS.indexOf(p.id) < 0 && !p.off && p.cost > 0) rows.push({ name: p.name, qty: p.qty, unit: p.unit, qtyDigits: p.unit === 'м' ? 2 : 0, price: p.cost / (p.qty || 1), note: 'опція, з детального розрахунку' });
    });
    var sub = rows.reduce(function (a, r) { return a + r.qty * r.price; }, 0);
    rows.push({ name: 'Витратні (дріт, газ, ґрунт, фарба)', qty: 1, unit: 'компл.', qtyDigits: 0, price: sub * it.consum_pct / 100, note: it.consum_pct + '% від суми' });
    return { rows: rows, it: it, nSec: nSec, nHang: nHang };
  }

  // ---------- простий прайс ----------
  function simpleRows(Dt, type, size, L, opt, kw, drivePrice, drive) {
    var S = Dt.screw_conveyor, c = S.coef;
    var row = S.diameters.filter(function (x) { return x.d === size; })[0];
    if (!row) return null;
    var small = size < c.small_limit;
    var K = (type === 'trough' ? c.trough_coef : 1) * (L >= c.long_from ? c.long_coef : 1) * c.overhead_coef * c.markup_coef;
    var rows = [
      { name: drive === 'gear' ? 'База під мотор-редуктор' : 'Шківи та підшипники', qty: 1, unit: 'шт', qtyDigits: 0, price: (drive === 'gear' ? c.gear_base : c.pulleys_bearings) * K },
      { name: 'Кінцеві вузли Ø' + size, qty: 1, unit: 'шт', qtyDigits: 0, price: row.base * K },
      { name: 'Корпус і шнек', qty: L, unit: 'м', price: row.per_m * c.meter_coef * K, note: row.per_m + ' грн/м × ' + c.meter_coef + ' × K' }
    ];
    if (opt.hopper) rows.push({ name: 'Бункер', qty: 1, unit: 'шт', qtyDigits: 0, price: (small ? c.hopper_small : c.hopper_large) * K });
    if (opt.stand) rows.push({ name: 'Підставка', qty: 1, unit: 'шт', qtyDigits: 0, price: (small ? c.stand_small : c.stand_large) * K });
    if (opt.krot) rows.push({ name: 'Крот', qty: 1, unit: 'шт', qtyDigits: 0, price: row.per_m * c.krot_coef * K });
    if (drive !== 'none') rows.push({ name: (drive === 'gear' ? 'Мотор-редуктор ' : 'Двигун ') + kw + ' кВт', qty: 1, unit: 'шт', qtyDigits: 0, price: drivePrice });
    return { rows: rows, K: K, row: row };
  }

  Calc.boot({
    data: ['screw_conveyor', 'shnek_core', 'gear_motors', 'sections'],
    pricing: 'screw_conveyor',
    docked: true,
    init: initInputs,
    panel: function (Dt) {
      var cfg = Dt.shnek_core, metal = [], buy = [];
      var mats = { black: 'чорна', tech: 'техн. нерж.', food: 'харч. нерж.' };
      var cls = { flight: 'Спіраль', sheet: 'Лист', tube_body: 'Труба корпусу', shaft_tube: 'Труба вала', bar: 'Пруток' };
      Object.keys(cfg.prices).forEach(function (c) {
        Object.keys(cfg.prices[c]).forEach(function (m) { metal.push({ path: 'shnek_core.prices.' + c + '.' + m, label: (cls[c] || c) + ', ' + (mats[m] || m), unit: 'грн/кг' }); });
      });
      Object.keys(cfg.buy).forEach(function (b) { buy.push({ path: 'shnek_core.buy.' + b + '.price', label: b + (cfg.buy[b].src ? ' · ' + cfg.buy[b].src : ''), unit: 'грн' }); });
      return [
        { tab: 'Розрахунок', details: true, note: 'Продуктивність, потужність, вузли й маси — за розрахунком CRM (shnek_core). Оновлюється під час вводу.' },
        sectionsTab(Dt),
        { tab: 'Метал', note: 'Детальний режим: ціна металу за класом і маркою, грн/кг.', fields: metal },
        { tab: 'Покупні', note: 'Підшипники, муфти, шківи, колеса тощо (ціни з 1С).', fields: buy },
        { tab: 'Коефіцієнти', fields: [
          { path: 'shnek_core.k_fab', label: 'Коеф. виготовлення (метал)', unit: '×' },
          { path: 'shnek_core.k_buy', label: 'Коеф. на покупні', unit: '×' },
          { path: 'shnek_core.consumables', label: 'Витратні', unit: 'частка' },
          { path: 'shnek_core.vat', label: 'ПДВ (детальний)', unit: '×' },
          { path: 'shnek_core.krot_coef', label: 'Крот', unit: '×' },
          { path: 'shnek_core.spiral.allowance', label: 'Спіраль: запас', unit: '×' },
          { path: 'shnek_core.spiral.coef_retail', label: 'Спіраль: роздріб', unit: '×' },
          { path: 'shnek_core.spiral.coef_wholesale', label: 'Спіраль: опт', unit: '×' }
        ] },
        { tab: 'Простий прайс', note: 'Ціни з ПДВ: кінцеві вузли й ціна за метр за діаметром.', fields: [
          { type: 'table', path: 'screw_conveyor.diameters', columns: [{ key: 'd', label: 'Ø', readonly: true }, { key: 'base', label: 'Вузли' }, { key: 'per_m', label: 'За метр' }] },
          { path: 'screw_conveyor.coef.pulleys_bearings', label: 'Шківи й підшипники', unit: 'грн' },
          { path: 'screw_conveyor.coef.gear_base', label: 'База під МР', unit: 'грн' },
          { path: 'screw_conveyor.coef.meter_coef', label: 'Коеф. метра', unit: '×' },
          { path: 'screw_conveyor.coef.hopper_small', label: 'Бункер Ø<160', unit: 'грн' },
          { path: 'screw_conveyor.coef.hopper_large', label: 'Бункер Ø≥160', unit: 'грн' },
          { path: 'screw_conveyor.coef.stand_small', label: 'Підставка Ø<160', unit: 'грн' },
          { path: 'screw_conveyor.coef.stand_large', label: 'Підставка Ø≥160', unit: 'грн' },
          { path: 'screw_conveyor.coef.krot_coef', label: 'Крот (× за метр)', unit: '×' },
          { path: 'screw_conveyor.coef.trough_coef', label: 'Жолоб', unit: '×' },
          { path: 'screw_conveyor.coef.long_coef', label: 'L ≥ 10 м', unit: '×' },
          { path: 'screw_conveyor.coef.overhead_coef', label: 'Коефіцієнт 1', unit: '×' },
          { path: 'screw_conveyor.coef.markup_coef', label: 'Коефіцієнт 2', unit: '×' }
        ] },
        { tab: 'Приводи', note: 'Ціна приводу за кВт, грн з ПДВ. Поки 0 — заповнити.', fields: [
          { type: 'table', path: 'gear_motors.items', columns: [{ key: 'kw', label: 'кВт', readonly: true }, { key: 'price', label: 'Ціна' }] }
        ] }
      ];
    },
    compute: function (Dt, inp) {
      var cfg = Dt.shnek_core;
      var type = inp.type || 'tube', size = num(inp.size), L = num(inp.length);
      var prof = cfg.drive.profiles[inp.profile] || cfg.drive.profiles[cfg.drive.default_profile];
      var rho = prof.rho;
      var slope = Math.max(0, Math.min(20, num(inp.slope)));
      var hopper = Math.max(0, num(inp.hopper)), krot = Math.max(0, num(inp.krot));
      var drive = inp.drive, mode = inp.mode;
      if (L <= 0) return { error: 'Вкажіть довжину' };

      var raw = { type: type, size: size, length: L, hopper: hopper, krot_len: krot, stand: inp.stand,
        wheels: inp.stand === 'chassis' ? inp.wheels : null, winch: !!inp.winch, preset: inp.preset, flight_tech: inp.flight_tech,
        price_type: inp.price_type, drive_kind: drive, profile: inp.profile, slope_deg: slope,
        q: num(inp.q) > 0 ? num(inp.q) / rho : null, pitch_ratio: num(inp.pitch_ratio) > 0 ? num(inp.pitch_ratio) : null };

      var p1 = ShnekCore.quote(raw, cfg, null);
      var warnings = [];
      var engineOk = !p1.error;
      var kw = num(inp.kw) > 0 ? num(inp.kw) : (engineOk ? p1.drive_calc.kw : 0);
      var gm = Dt.gear_motors.items.filter(function (x) { return x.kw === kw; })[0];
      var drivePrice = gm ? gm.price : 0;
      var driveObj = drive !== 'none' && kw ? { full_n: 'kW' + kw, name: (drive === 'gear' ? 'Мотор-редуктор ' : 'Двигун ') + kw + ' кВт', kw: kw, price: drivePrice } : null;
      var q = engineOk ? ShnekCore.quote(raw, cfg, driveObj) : p1;
      if (drive !== 'none' && kw && !drivePrice) warnings.push('Ціна приводу ' + kw + ' кВт не задана — впишіть у панелі «Приводи».');

      var simple = mode === 'simple' ? simpleRows(Dt, type, size, L, { hopper: hopper > 0, stand: inp.stand !== 'none', krot: krot > 0 }, kw, drivePrice, drive) : null;
      if (mode === 'simple' && !simple) warnings.push('У простому прайсі немає типорозміру ' + size + ' — показано детальний розрахунок.');
      if (simple && inp.preset !== 'black') warnings.push('Простий прайс — лише для чорної сталі; для нержавійки перемкніть на «Детальний».');
      if (!simple && q.error) return { error: q.error };

      var sec = mode === 'sections' ? sectionRows(Dt, { type: type, size: size, preset: inp.preset }, L, drive, q) : null;
      if (mode === 'sections' && !sec) warnings.push('Немає цін секцій для цього типорозміру — показано детальний розрахунок.');
      var rows, pricing, mt;
      if (sec) {
        rows = sec.rows;
        if (driveObj) rows.push({ name: driveObj.name, qty: 1, unit: 'шт', qtyDigits: 0, price: drivePrice / cfg.vat, note: 'ціна приводу з ПДВ ' + f(drivePrice, 0) });
        pricing = { markup_pct: Dt.screw_conveyor.pricing.markup_pct, vat_pct: Math.round((cfg.vat - 1) * 1000) / 10, vat_included: false };
        mt = 'за секціями';
      } else if (simple) {
        rows = simple.rows; pricing = Dt.screw_conveyor.pricing; mt = 'простий прайс';
      } else {
        rows = q.parts.filter(function (p) { return !p.off && p.cost > 0; }).map(function (p) {
          return { name: p.name, qty: p.qty, unit: p.unit === 'шт/м' ? 'шт' : p.unit, qtyDigits: p.unit === 'м' ? 2 : 0, price: p.cost / (p.qty || 1),
            note: p.cat + (p.mode === 'metal' ? ' · ' + f(p.total_w, 1) + ' кг × ' + p.pkg + ' грн/кг × ' + (+p.k.toFixed(3)) : (p.buy ? ' · покупне ' + f(p.buy, 2) + ' × ' + (+p.k.toFixed(3)) : '')) };
        });
        if (driveObj) rows.push({ name: driveObj.name, qty: 1, unit: 'шт', qtyDigits: 0, price: drivePrice / cfg.vat, note: 'ціна приводу з ПДВ ' + f(drivePrice, 0) });
        pricing = { markup_pct: Dt.screw_conveyor.pricing.markup_pct, vat_pct: Math.round((cfg.vat - 1) * 1000) / 10, vat_included: false };
        mt = 'детальний розрахунок';
      }
      if (engineOk) q.warnings.forEach(function (w) { if (warnings.indexOf(w) < 0 && !/модель не вказано/.test(w)) warnings.push(w); });

      var dc = engineOk ? q.drive_calc : null;
      var tph = dc ? dc.q * rho : 0;
      var title = (engineOk ? q.name : 'Шнековий транспортер ' + size + ' L=' + f(L, 2) + ' м') + (drive !== 'none' && kw && engineOk && !/кВт/.test(q.name) ? ', ' + kw + ' кВт' : '');
      var tot = Calc.totals(rows, pricing);

      var details = [];
      if (dc) details.push({ group: 'Продуктивність і привід', items: [
        { label: 'Продукт', formula: 'насипна щільність ρ, заповнення ψ', value: prof.label + ' · ' + rho + ' т/м³ · ψ ' + prof.fill },
        { label: 'Оберти шнека', formula: 'макс. ' + f(dc.n_max, 0) + ' об/хв', value: f(dc.n, 0) + ' об/хв' },
        { label: 'Продуктивність', formula: f(dc.q, 2) + ' м³/год × ' + rho, value: f(tph, 2) + ' т/год' },
        { label: 'Нахил', formula: 'знижує продуктивність, додає потужність', value: f(slope, 0) + '°' },
        { label: 'Потужність на валу', formula: 'холостий ' + f(dc.physics.p_idle, 3) + ' кВт', value: f(dc.physics.p_shaft, 3) + ' кВт' },
        { label: 'Мін. двигун з запасами', formula: 'fs ' + dc.margins.fs + ', запас ' + dc.margins.motor_reserve, value: f(dc.margins.p_motor, 3) + ' кВт' },
        { label: 'Привід', formula: dc.kw_source === 'table' ? 'за таблицею CRM (Ø, L), не менше фізики' : dc.kw_source === 'manual' ? 'обрано' : dc.kw_source, value: f(dc.kw, dc.kw % 1 ? 1 : 0) + ' кВт' },
        { label: 'Запас відносно фізики', formula: '', value: '×' + f(dc.reserve_vs_physics, 1) },
        { label: 'Передатне число', formula: 'розрахункове ' + f(dc.i_calc, 1), value: 'i = ' + dc.i_std },
        { label: 'Редуктор (черв.)', formula: 'T2 потрібно ' + f(dc.t2_required, 1) + ' Нм', value: 'габ. ' + dc.size + ' · T2n ' + dc.t2n + ' Нм' }
      ] });
      if (engineOk) details.push({ group: 'Маса', items: [
        { label: 'Маса транспортера', formula: 'усі вузли', value: f(q.total_weight, 1) + ' кг' },
        { label: 'Метал (база)', formula: 'без коеф. виготовлення', value: money(q.metal_base) + ' грн' },
        { label: 'Детальна ціна з ПДВ', formula: 'для порівняння з простим прайсом', value: f(q.price, 0) + ' грн' }
      ] });
      if (simple) details.push({ group: 'Простий прайс', items: [
        { label: 'Кінцеві вузли / за метр', formula: 'таблиця за Ø', value: simple.row.base + ' / ' + simple.row.per_m + ' грн' },
        { label: 'Коефіцієнт K', formula: (type === 'trough' ? 'жолоб × ' : '') + (L >= Dt.screw_conveyor.coef.long_from ? 'L≥10 × ' : '') + '1,15 × 1,1', value: f(simple.K, 4) },
        { label: 'кВт за старою таблицею', formula: 'Ø' + size + ', ' + Math.ceil(L) + ' м', value: ((Dt.screw_conveyor.kw_table[size] || [])[Math.ceil(L) - 1] || '—') + '' }
      ] });
      if (sec) details.push({ group: 'За секціями', items: [
        { label: 'Секцій по ' + Dt.sections.section_m + ' м', formula: f(L, 2) + ' / ' + Dt.sections.section_m, value: f(sec.nSec, 2) },
        { label: 'Секція 2 м разом', formula: 'кожух ' + f(sec.it.casing_2m, 0) + ' + вал ' + f(sec.it.shaft_2m, 0) + ' + спіраль ' + f(sec.it.spiral_2m, 0), value: money(sec.it.casing_2m + sec.it.shaft_2m + sec.it.spiral_2m) },
        { label: 'Підвісів', formula: 'ceil(L / 2 м) − 1', value: sec.nHang + ' шт' }
      ] });
      if (engineOk) details.push({ group: 'Вузли (детальний)', items: q.parts.filter(function (p) { return !p.off; }).map(function (p) {
        return { label: p.name, formula: p.code + ' · ' + f(p.qty, p.unit === 'м' ? 2 : 0) + ' ' + p.unit + (p.total_w ? ' · ' + f(p.total_w, 1) + ' кг' : '') + (p.mat ? ' · ' + p.mat : ''), value: money(p.cost) };
      }) });
      if (dc && dc.checks && dc.checks.length) details.push({ group: 'Інженерні застереження', items: dc.checks.map(function (c) { return { label: c, value: '' }; }) });

      var copyText = title + ' — ' + f(tot.total, 0) + ' грн з ПДВ' + (dc ? ' (≈' + f(tph, 1) + ' т/год, ' + prof.label.toLowerCase() + ')' : '') + '.';
      return {
        title: title + ' · ' + mt,
        rows: rows,
        pricing: pricing,
        warnings: warnings,
        details: details,
        viz: drawConveyor({ type: type, size: size, L: L, slope: slope, hopper: hopper, krot: krot, stand: inp.stand, winch: !!inp.winch, drive: drive, kw: kw }),
        after: '<button type="button" class="btn btn-sm btn-success mt-2" data-copy="' + esc(copyText) + '">Скопіювати для клієнта</button>',
        info: dc ? [
          { label: 'Продуктивність', value: f(tph, 1) + ' т/год (' + f(dc.q, 1) + ' м³/год)' },
          { label: 'Оберти / привід', value: f(dc.n, 0) + ' об/хв · ' + (drive === 'none' ? 'без приводу' : f(kw, kw % 1 ? 1 : 0) + ' кВт') },
          { label: 'Маса', value: f(q.total_weight, 0) + ' кг' }
        ] : []
      };
    }
  });
})();
