// Норія ковшова НКЗ: ціни з каталогу НКЗ (noria_catalog.json) + ручні (noria.json).
(function () {
  'use strict';
  var num = Calc.num, money = Calc.money, esc = Calc.esc;
  function f(x, d) { return Number(x).toLocaleString('uk-UA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function $(id) { return document.getElementById(id); }
  function ceil(x) { return Math.ceil(x - 1e-9); }
  var CHAINS = { 5: 1, 10: 1, 25: 2, 50: 2 };
  var D0 = null;

  function cat(Dt, cap) { return Dt.noria_catalog.models.filter(function (m) { return m.capacity === cap; })[0]; }
  function man(Dt, cap) { return Dt.noria.models.filter(function (m) { return m.capacity === cap; })[0]; }
  function forCap(list, cap) { var x = list.filter(function (i) { return i.caps.indexOf(cap) >= 0; }); return x; }
  function chainOk(Dt, cap) { var c = cat(Dt, cap); return !!CHAINS[cap] && (c.chain_available || cap === 5); }
  function kwFor(Dt, cap, H) {
    var t = Dt.noria_catalog.kw_by_h[String(cap)] || Dt.noria_catalog.kw_by_h[cap === 5 ? '10' : ''] || [];
    for (var i = 0; i < t.length; i++) if (H <= t[i].max_h) return { kw: t[i].kw, above: false };
    return t.length ? { kw: t[t.length - 1].kw, above: true } : { kw: 0, above: false };
  }

  function opts(sel, items, keep) {
    var cur = sel.value;
    sel.innerHTML = items.map(function (x) { return '<option value="' + esc(x[0]) + '">' + esc(x[1]) + '</option>'; }).join('');
    if (keep && items.some(function (x) { return String(x[0]) === cur; })) sel.value = cur;
  }

  function refill(Dt) {
    var cap = num($('capacity').value), H = num($('height').value), c = cat(Dt, cap), m = man(Dt, cap);
    var chainAllowed = chainOk(Dt, cap);
    $('conv-chain-btn').classList.toggle('disabled', !chainAllowed);
    $('conv-chain-btn').querySelector('input').disabled = !chainAllowed;
    if (!chainAllowed && document.querySelector('input[name="conv"]:checked').value === 'chain') {
      document.querySelector('input[name="conv"][value="belt"]').checked = true;
    }
    var chain = document.querySelector('input[name="conv"]:checked').value === 'chain';
    document.querySelectorAll('input[name="conv"]').forEach(function (x) { x.parentNode.classList.toggle('active', x.checked); });
    $('belt-group').hidden = chain;
    $('sensor-belt').hidden = chain;

    var belts = forCap(Dt.noria_catalog.belts, cap), fallback = !belts.length;
    if (fallback) belts = Dt.noria_catalog.belts.slice().sort(function (a, b) { return b.width - a.width; });
    var bi = belts.map(function (b) { return [b.id, b.name + ' — ' + f(b.price, 0) + ' грн/м']; });
    bi.push(['oil', 'Маслостійка' + (m.belt_oil_per_m ? ' — ' + f(m.belt_oil_per_m, 0) + ' грн/м' : ' (ціна не задана)')]);
    opts($('belt'), bi, !$('belt').dataset.capChanged);
    $('belt').dataset.capChanged = '';

    var bk = forCap(Dt.noria_catalog.buckets, cap);
    if (!bk.length) bk = Dt.noria_catalog.buckets;
    opts($('bucket'), bk.map(function (b) { return [b.id, b.name + ' — ' + f(b.price, 0) + ' грн']; }), true);

    opts($('thick'), (c.thickness.length ? c.thickness : [1]).map(function (t) { return [t, t + ' мм']; }), true);

    var cp = forCap(Dt.noria_catalog.couplings, cap);
    if (!cp.length) cp = Dt.noria_catalog.couplings;
    var ci = [['none', 'Без муфти']].concat(cp.map(function (x) { return [x.id, x.name.replace(/^Муфта зєднувальна\s*/i, '') + ' — ' + f(x.price, 0)]; }));
    if (m.coupling) ci.push(['manual', 'Інша — ' + f(m.coupling, 0)]);
    opts($('coupling'), ci, true);
    if (!$('coupling').dataset.touched && ci.length > 1) $('coupling').value = ci[1][0];

    var k = kwFor(Dt, cap, H);
    var motors = Dt.noria_catalog.gear_motors.filter(function (g) { return g.kw === k.kw; }).sort(function (a, b) { return a.price - b.price; });
    var mi = [['none', 'Без приводу']].concat(motors.map(function (g) { return [g.id, g.kw + ' кВт · ' + g.type + ' габ.' + g.gab + ' · ' + g.saler + ' — ' + f(g.price, 0)]; }));
    var others = Dt.noria_catalog.gear_motors.filter(function (g) { return g.kw !== k.kw; }).sort(function (a, b) { return a.kw - b.kw || a.price - b.price; });
    mi = mi.concat(others.map(function (g) { return [g.id, g.kw + ' кВт · ' + g.type + ' габ.' + g.gab + ' · ' + g.saler + ' — ' + f(g.price, 0)]; }));
    var curMotor = $('motor').value;
    opts($('motor'), mi, false);
    if ($('motor').dataset.touched && mi.some(function (x) { return x[0] === curMotor; })) $('motor').value = curMotor;
    else $('motor').value = motors.length ? motors[0].id : 'none';
    $('kw-hint').textContent = k.kw ? '(за висотою: ' + k.kw + ' кВт)' : '';
  }

  function initInputs(Dt) {
    D0 = Dt;
    $('capacity').innerHTML = Dt.noria_catalog.models.map(function (m) {
      return '<option value="' + m.capacity + '"' + (m.capacity === 25 ? ' selected' : '') + '>НКЗ-' + m.capacity + ' (' + m.capacity + ' т/год)</option>';
    }).join('');
    ['coupling', 'motor'].forEach(function (id) { $(id).addEventListener('change', function () { $(id).dataset.touched = '1'; }); });
    $('capacity').addEventListener('change', function () { $('belt').dataset.capChanged = '1'; $('bucket').innerHTML = ''; $('motor').dataset.touched = ''; $('coupling').dataset.touched = ''; refill(D0); Calc.renderPanel(); Calc.recompute(); });
    $('height').addEventListener('input', function () { if (!$('motor').dataset.touched) { refill(D0); Calc.recompute(); } });
    document.querySelectorAll('input[name="conv"]').forEach(function (r) { r.addEventListener('change', function () { refill(D0); Calc.recompute(); }); });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]');
      if (!b) return;
      var text = b.getAttribute('data-copy');
      var done = function () { var t = b.textContent; b.textContent = 'Скопійовано ✓'; setTimeout(function () { b.textContent = t; }, 1500); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done);
      else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); }
    });
    refill(Dt);
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
    s.push('<line class="' + (o.chain ? 'nr-chain' : 'nr-belt') + '" x1="' + bl + '" y1="' + (yHeadB - 10) + '" x2="' + bl + '" y2="' + (yBootT + 10) + '"/>');
    s.push('<line class="' + (o.chain ? 'nr-chain' : 'nr-belt') + '" x1="' + br + '" y1="' + (yHeadB - 10) + '" x2="' + br + '" y2="' + (yBootT + 10) + '"/>');
    var step = Math.max(9, 1000 / o.perM * k * 0.001 * 1000 / 1000 * 1);
    step = Math.max(9, k / o.perM);
    for (var y = yHeadB + 6; y < yBootT - 4; y += step) {
      s.push('<path class="nr-bucket" d="M' + bl + ',' + y + ' l9,0 l-3,6 l-6,0 z"/>');
      s.push('<path class="nr-bucket" d="M' + br + ',' + (y + 3) + ' l-9,0 l3,-6 l6,0 z"/>');
    }
    // головка
    var hw = gap * 2 + sw + 34;
    s.push('<path class="nr-head" d="M' + (cx - hw / 2) + ',' + yHeadB + ' L' + (cx - hw / 2) + ',' + (yTop + headH * 0.45) + ' Q' + cx + ',' + (yTop - 6) + ' ' + (cx + hw / 2) + ',' + (yTop + headH * 0.45) + ' L' + (cx + hw / 2) + ',' + yHeadB + ' Z"/>');
    s.push('<circle class="nr-drum' + (o.lagging ? ' lag' : '') + '" cx="' + cx + '" cy="' + (yTop + headH * 0.5) + '" r="' + Math.min(gap + 2, headH * 0.38) + '"/>');
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
    s.push('<circle class="nr-drum" cx="' + cx + '" cy="' + (yBootT + bootH * 0.55) + '" r="' + Math.min(gap + 2, bootH * 0.35) + '"/>');
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
    if (o.drum) s.push('<text class="nr-txt" x="' + cx + '" y="' + (yTop + headH * 0.5 + 4) + '" text-anchor="middle" style="font-size:10px">Ø' + o.drum + '</text>');
    s.push('<text class="nr-lbl" x="' + cx + '" y="' + (yBot + 16) + '" text-anchor="middle">' + (o.chain ? 'ланцюг ' + o.belt : 'стрічка ' + o.belt + ' мм') + ' · ківш ' + esc(o.bucketSize) + ' · ' + o.perM + ' шт/м</text>');

    return '<svg viewBox="0 0 ' + W + ' ' + (yBot + 24) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Норія спереду з розмірами" style="max-height:520px">' +
      '<defs><marker id="nar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" fill="#333"/></marker></defs>' +
      '<style>.nr-leg{fill:#d5dae1;stroke:#444}.nr-flange{stroke:#333;stroke-width:2}.nr-belt{stroke:#555;stroke-width:2.5}.nr-chain{stroke:#333;stroke-width:3;stroke-dasharray:4 2}.nr-bucket{fill:#e6a23c;stroke:#8a5a12;stroke-width:.6}' +
      '.nr-head{fill:#c9ced6;stroke:#333;stroke-width:1.2}.nr-drum{fill:#fff;stroke:#333;stroke-width:1.2}.nr-drum.lag{stroke:#222;stroke-width:4}.nr-gear{fill:#6b7a8c;stroke:#333}' +
      '.nr-motor{fill:#2f6db3;stroke:#1a3d66}.nr-coupling{fill:#e04c4c}.nr-ground{stroke:#8a6d3b;stroke-width:1.5;stroke-dasharray:6 4}.nr-dim{stroke:#333;stroke-width:.9}' +
      '.nr-ext{stroke:#999;stroke-width:.6}.nr-txt{font:13px Arial,sans-serif;fill:#222}.nr-lbl{font:11px Arial,sans-serif;fill:#444}</style>' + s.join('') + '</svg>';
  }


  function priceRow(list, H) {
    if (!list || !list.length) return null;
    for (var i = 0; i < list.length; i++) if (list[i].h >= H - 1e-9) return list[i];
    return list[list.length - 1];
  }

  Calc.boot({
    data: ['noria', 'noria_catalog'],
    pricing: 'noria',
    docked: true,
    init: initInputs,
    panel: function (Dt) {
      var cap = num($('capacity').value) || 25, ic = 0, im = 0;
      Dt.noria_catalog.models.forEach(function (m, i) { if (m.capacity === cap) ic = i; });
      Dt.noria.models.forEach(function (m, i) { if (m.capacity === cap) im = i; });
      var C = 'noria_catalog.models.' + ic + '.', M = 'noria.models.' + im + '.';
      return [
        { tab: 'Розрахунок', details: true, note: 'Кількості, формули і вартість вузлів.' },
        { tab: 'НКЗ-' + cap, note: 'Ціни з каталогу НКЗ (Google Sheets, як у CRM) — змінюються тут лише на цей розрахунок. Постійно — у таблиці НКЗ, потім node calc/tools/sync_noria.js.', fields: [
          { path: C + 'head', label: 'Голова привідна в зборі (з барабаном)', unit: 'грн' },
          { path: C + 'boot', label: 'Башмак в зборі (з барабаном)', unit: 'грн' },
          { path: C + 'shaft_1m', label: 'Шахта 1 м (за 1 мм товщини)', unit: 'грн' },
          { path: C + 'shaft_rev', label: 'Шахта оглядова 1 м (за 1 мм)', unit: 'грн' },
          { path: C + 'frame', label: 'Рамка шахти (за 1 мм)', unit: 'грн' },
          { path: C + 'buckets_per_m', label: 'Ковшів на 1 м стрічки', unit: 'шт' },
          { path: C + 'chain_buckets_per_m', label: 'Ковшів на 1 м ланцюга', unit: 'шт' }
        ] },
        { tab: 'Ручні ціни', note: 'Немає в каталозі — заповнити з PDF. Постійно — calc/data/noria.json.', fields: [
          { path: M + 'lagging', label: 'Футування привідного барабана', unit: 'грн' },
          { path: M + 'belt_oil_per_m', label: 'Стрічка маслостійка, за 1 м', unit: 'грн/м' },
          { path: M + 'sprocket', label: 'Зірочка (ланцюгова), шт', unit: 'грн' },
          { path: M + 'drum', label: 'Барабан (запчастина, довідково)', unit: 'грн' },
          { path: M + 'drum_chain', label: 'Барабан ланцюговий (запчастина, довідково)', unit: 'грн' },
          { path: M + 'backstop', label: 'Муфта зворотного ходу (якщо немає в каталозі)', unit: 'грн' },
          { path: M + 'coupling', label: "З'єднувальна муфта (інша)", unit: 'грн' },
          { path: M + 'base_h', label: 'Висота головки + башмака', unit: 'м' },
          { path: 'noria.belt_extra_m', label: 'Запас стрічки/ланцюга', unit: 'м' }
        ] },
        { tab: 'Ковші й стрічки', note: 'Каталог НКЗ: усі ковші, стрічки, ланцюги.', fields: [
          { type: 'table', label: 'Ковші', path: 'noria_catalog.buckets', columns: [{ key: 'name', label: 'Ківш', readonly: true }, { key: 'price', label: 'грн' }] },
          { type: 'table', label: 'Стрічки', path: 'noria_catalog.belts', columns: [{ key: 'name', label: 'Стрічка', readonly: true }, { key: 'price', label: 'грн/м' }] },
          { type: 'table', label: 'Ланцюги', path: 'noria_catalog.chains', columns: [{ key: 'name', label: 'Ланцюг', readonly: true }, { key: 'price', label: 'грн/м' }] }
        ] }
      ];
    },
    compute: function (Dt, inp) {
      var N = Dt.noria, K = Dt.noria_catalog, cap = num(inp.capacity), H = num(inp.height);
      var c = cat(Dt, cap), m = man(Dt, cap);
      if (!c || !m) return { error: 'Оберіть норію' };
      if (H <= m.base_h) return { error: 'Висота має бути більшою за висоту головки й башмака (' + f(m.base_h, 2) + ' м)' };
      var chain = inp.conv === 'chain' && chainOk(Dt, cap);
      var nChains = chain ? CHAINS[cap] : 0;
      var th = num(inp.thick) || 1;
      var shaftLen = H - m.base_h;
      var convLen = 2 * H + N.belt_extra_m;
      var perM = chain ? (c.chain_buckets_per_m || 6.6) : c.buckets_per_m;
      var buckets = ceil(convLen * perM);
      var bucket = K.buckets.filter(function (b) { return b.id === inp.bucket; })[0] || forCap(K.buckets, cap)[0] || K.buckets[0];
      var shaft1 = chain && c.shaft_chain_1m ? c.shaft_chain_1m : c.shaft_1m;
      var secPerM = 2 * (shaft1 + c.frame) * th;
      var revAdd = N.rev_sections * (c.shaft_rev - shaft1) * th;
      var rows = [
        { name: 'Голова привідна в зборі НКЗ-' + cap, qty: 1, unit: 'шт', qtyDigits: 0, price: c.head, note: 'з барабаном' },
        { name: 'Башмак в зборі НКЗ-' + cap, qty: 1, unit: 'шт', qtyDigits: 0, price: c.boot, note: 'з барабаном' },
        { name: 'Шахта (дві труби), ' + th + ' мм', qty: shaftLen, unit: 'м', price: secPerM, note: '2 × (шахта 1 м ' + f(shaft1, 0) + ' + рамка ' + f(c.frame, 0) + ') × ' + th + ' мм' },
        { name: 'Оглядова секція (доплата)', qty: N.rev_sections, unit: 'шт', qtyDigits: 0, price: (c.shaft_rev - shaft1) * th, note: 'оглядова замість звичайної' }
      ];
      var warnings = [], convName;
      if (chain) {
        var ch = K.chains.filter(function (x) { return /ТРД-38/.test(x.name); })[0] || K.chains[0];
        convName = ch.name + (nChains > 1 ? ' × ' + nChains : '');
        rows.push({ name: 'Ланцюг ' + ch.name.replace(/^Ланцюг\s*/, ''), qty: convLen * nChains, unit: 'м', price: ch.price, note: nChains + ' ланцюг' + (nChains > 1 ? 'и' : '') + ' × (2·H + ' + N.belt_extra_m + ' м)' });
        rows.push({ name: 'Зірочки', qty: 2 * nChains, unit: 'шт', qtyDigits: 0, price: m.sprocket, note: '2 на кожен ланцюг (головка + башмак)' });
        if (!m.sprocket) warnings.push('Ціна зірочок для НКЗ-' + cap + ' не задана (панель «Ручні ціни»).');
      } else if (inp.belt === 'oil') {
        convName = 'маслостійка';
        rows.push({ name: 'Стрічка маслостійка', qty: convLen, unit: 'м', price: m.belt_oil_per_m, note: '2·H + ' + N.belt_extra_m + ' м' });
        if (!m.belt_oil_per_m) warnings.push('Ціна маслостійкої стрічки для НКЗ-' + cap + ' не задана (панель «Ручні ціни»).');
      } else {
        var belt = K.belts.filter(function (b) { return b.id === inp.belt; })[0] || forCap(K.belts, cap)[0] || K.belts[0];
        convName = belt.width + ' мм';
        rows.push({ name: belt.name, qty: convLen, unit: 'м', price: belt.price, note: '2·H + ' + N.belt_extra_m + ' м' });
      }
      rows.push({ name: bucket.name, qty: buckets, unit: 'шт', qtyDigits: 0, price: bucket.price, note: f(convLen, 2) + ' м × ' + perM + ' шт/м' });
      var big = /10/.test(bucket.bolt), bolts = buckets * (bucket.bolts || 2), Mz = K.metiz;
      var bolt = Mz[big ? 'bolt_M10' : 'bolt_M8'], nut = Mz[big ? 'nut_M10' : 'nut_M8'], washer = Mz.washer;
      var hw = bolt.price_kg * bolt.weight_kg + 2 * nut.price_kg * nut.weight_kg + washer.price_kg * washer.weight_kg;
      rows.push({ name: 'Метизи ковшів (гвинт ' + (big ? 'М10' : 'М8') + ' + 2 гайки + шайба)', qty: bolts, unit: 'компл.', qtyDigits: 0, price: hw, note: (bucket.bolts || 2) + ' на ківш' });
      if (inp.lagging) {
        rows.push({ name: 'Футування привідного барабана', qty: 1, unit: 'шт', qtyDigits: 0, price: m.lagging });
        if (!m.lagging) warnings.push('Ціна футування барабана для НКЗ-' + cap + ' не задана (панель «Ручні ціни»).');
      }
      if (inp.coupling && inp.coupling !== 'none') {
        var cp = inp.coupling === 'manual' ? { name: "З'єднувальна муфта", price: m.coupling } : K.couplings.filter(function (x) { return x.id === inp.coupling; })[0];
        if (cp) rows.push({ name: cp.name, qty: 1, unit: 'шт', qtyDigits: 0, price: cp.price });
      }
      if (inp.backstop) {
        var bs = forCap(K.backstops, cap)[0];
        rows.push({ name: bs ? bs.name : 'Муфта зворотного ходу', qty: 1, unit: 'шт', qtyDigits: 0, price: bs ? bs.price : m.backstop, note: bs ? 'каталог НКЗ' : 'ручна ціна' });
        if (!bs && !m.backstop) warnings.push('Ціна муфти зворотного ходу для НКЗ-' + cap + ' не задана (панель «Ручні ціни»).');
      }
      if (inp.sensors) K.sensors.forEach(function (s) {
        if (chain && /стрічк/i.test(s.name)) return;
        rows.push({ name: s.name.trim(), qty: 1, unit: 'шт', qtyDigits: 0, price: s.price });
      });
      var motor = K.gear_motors.filter(function (g) { return g.id === inp.motor; })[0];
      var kh = kwFor(Dt, cap, H);
      if (motor) rows.push({ name: 'Мотор-редуктор ' + motor.kw + ' кВт ' + motor.type + ' габ.' + motor.gab, qty: 1, unit: 'шт', qtyDigits: 0, price: motor.price, note: motor.saler });
      if (motor && kh.kw && motor.kw < kh.kw) warnings.push('Обрано ' + motor.kw + ' кВт, а за висотою потрібно ' + kh.kw + ' кВт.');
      if (kh.above) warnings.push('Висота більша за таблицю кВт — взято останній рядок.');

      var tot = Calc.totals(rows, N.pricing);
      var title = 'Норія НКЗ-' + cap + ' ' + (chain ? 'ланцюгова' : 'стрічкова') + ', H=' + f(H, 2) + ' м, ' + (chain ? convName : 'стрічка ' + convName) +
        ', ' + bucket.name.toLowerCase() + (motor ? ', мотор-редуктор ' + motor.kw + ' кВт' : '');
      var pl = priceRow(N.price_list[String(cap)], H);
      var details = [
        { group: 'Розміри й кількості', items: [
          { label: 'Висота головки + башмака', formula: 'CRM, НКЗ-' + cap, value: f(m.base_h, 3) + ' м' },
          { label: 'Шахта', formula: f(H, 2) + ' − ' + f(m.base_h, 3), value: f(shaftLen, 2) + ' м' },
          { label: 'Шахта за 1 м висоти', formula: '2 труби × (' + f(shaft1, 2) + ' + ' + f(c.frame, 2) + ') × ' + th + ' мм', value: money(secPerM) },
          { label: chain ? 'Ланцюг (на один)' : 'Стрічка', formula: '2 × ' + f(H, 2) + ' + ' + N.belt_extra_m, value: f(convLen, 2) + ' м' + (nChains > 1 ? ' × ' + nChains : '') },
          { label: 'Ковшів', formula: 'вгору(' + f(convLen, 2) + ' × ' + perM + ')', value: buckets + ' шт' },
          { label: 'Метизів (гвинтів)', formula: buckets + ' × ' + (bucket.bolts || 2), value: bolts + ' шт' },
          { label: 'Потужність за висотою', formula: 'таблиця privod_nkz', value: kh.kw ? kh.kw + ' кВт' : '—' }
        ] },
        { group: 'Вартість вузлів', items: rows.map(function (r) {
          return { label: r.name, formula: f(r.qty, r.qtyDigits == null ? 2 : r.qtyDigits) + ' ' + r.unit + ' × ' + money(r.price), value: money(r.qty * r.price) };
        }) },
        { group: 'Довідково', items: [
          { label: 'Барабан (запчастина)', formula: 'ручна ціна', value: m.drum ? money(m.drum) : 'не задано' },
          { label: 'Барабан ланцюговий (запчастина)', formula: 'ручна ціна', value: m.drum_chain ? money(m.drum_chain) : 'не задано' },
          { label: 'Паперовий прайс', formula: pl ? 'рядок H ' + f(pl.h, 2) + ' м, ' + pl.kw + ' кВт' : 'немає для НКЗ-' + cap, value: pl ? money(pl.price) : '—' },
          { label: 'Каталог оновлено', formula: 'calc/tools/sync_noria.js', value: K.synced }
        ] }
      ];
      return {
        title: title,
        rows: rows,
        warnings: warnings,
        details: details,
        viz: drawNoria({ H: H, shaftLen: shaftLen, headH: m.base_h * 0.55, bootH: m.base_h * 0.45, perM: perM, drum: '', belt: chain ? 'ТРД-38' + (nChains > 1 ? ' ×2' : '') : convName.replace(' мм', ''),
          bucketSize: bucket.name.replace(/^Ківш\s*/, ''), lagging: !!inp.lagging, coupling: inp.coupling && inp.coupling !== 'none', backstop: !!inp.backstop,
          drive: motor ? 'gear' : 'none', kw: motor ? motor.kw : 0, chain: chain }),
        after: '<button type="button" class="btn btn-sm btn-success mt-2" data-copy="' + esc(title + ' — ' + f(tot.total, 0) + ' грн з ПДВ.') + '">Скопіювати для клієнта</button>',
        info: [
          { label: 'Шахта / ' + (chain ? 'ланцюг' : 'стрічка'), value: f(shaftLen, 2) + ' м / ' + f(convLen * Math.max(1, nChains), 2) + ' м' },
          { label: 'Ковшів', value: buckets + ' шт' },
          { label: 'Довідково: паперовий прайс', value: pl ? money(pl.price) + ' грн (H ' + f(pl.h, 2) + ' м)' : '—' }
        ]
      };
    }
  });
})();
