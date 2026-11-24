// Скребковий транспортер ТШ за вузлами: головки, секції, ланцюг зі шкребками, футування, розподільник, мотор-редуктор.
(function () {
  'use strict';
  var num = Calc.num, money = Calc.money, esc = Calc.esc;
  function f(x, d) { return Number(x).toLocaleString('uk-UA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function $(id) { return document.getElementById(id); }
  var D0 = null;

  function model(Dt, name) { return Dt.tsh.models.filter(function (m) { return m.model === name; })[0]; }

  function fillChains(Dt) {
    var m = model(Dt, $('model').value), sel = $('chain'), cur = sel.value;
    sel.innerHTML = Dt.tsh.chains.map(function (c) {
      return '<option value="' + c.key + '">' + esc(c.label) + '</option>';
    }).join('');
    if (cur) sel.value = cur;
  }

  function initInputs(Dt) {
    D0 = Dt;
    $('model').innerHTML = Dt.tsh.models.map(function (m) { return '<option>' + esc(m.model) + '</option>'; }).join('');
    $('model').value = 'ТШ 50';
    fillChains(Dt);
    $('motor').innerHTML = '<option value="none">Без мотор-редуктора</option>' + Dt.noria_catalog.gear_motors.slice().sort(function (a, b) { return a.kw - b.kw || a.price - b.price; })
      .map(function (g) { return '<option value="' + esc(g.id) + '">' + g.kw + ' кВт · ' + esc(g.type) + ' габ.' + esc(g.gab) + ' · ' + esc(g.saler) + ' — ' + f(g.price, 0) + '</option>'; }).join('');
    $('model').addEventListener('change', function () { fillChains(D0); Calc.renderPanel(); Calc.recompute(); });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]');
      if (!b) return;
      var text = b.getAttribute('data-copy');
      var done = function () { var t = b.textContent; b.textContent = 'Скопійовано ✓'; setTimeout(function () { b.textContent = t; }, 1500); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done);
      else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done(); }
    });
  }

  // ---------- креслення: ТШ збоку ----------
  function drawTsh(o) {
    var W = 820, x0 = 90, x1 = 700, y0 = 120, h = 46;
    var k = (x1 - x0) / o.L;
    var s = [];
    var headW = Math.max(36, Math.min(70, 0.8 * k)), tailW = Math.max(30, Math.min(60, 0.7 * k));
    // короб
    s.push('<rect class="ts-box" x="' + x0 + '" y="' + (y0 - h / 2) + '" width="' + (x1 - x0) + '" height="' + h + '"/>');
    if (o.liner !== 'none') s.push('<rect class="ts-liner" x="' + (x0 + tailW) + '" y="' + (y0 + h / 2 - 5) + '" width="' + (x1 - x0 - tailW - headW) + '" height="5"/>');
    for (var m = 2; m < o.L - 0.01; m += 2) s.push('<line class="ts-joint" x1="' + (x0 + m * k) + '" y1="' + (y0 - h / 2 - 3) + '" x2="' + (x0 + m * k) + '" y2="' + (y0 + h / 2 + 3) + '"/>');
    // ланцюг (дві гілки) зі шкребками
    var yt = y0 - h / 2 + 10, yb = y0 + h / 2 - 9;
    s.push('<line class="ts-chain" x1="' + (x0 + 14) + '" y1="' + yt + '" x2="' + (x1 - 14) + '" y2="' + yt + '"/>');
    s.push('<line class="ts-chain" x1="' + (x0 + 14) + '" y1="' + yb + '" x2="' + (x1 - 14) + '" y2="' + yb + '"/>');
    var step = Math.max(12, Math.min(28, k * 0.25));
    for (var x = x0 + 22; x < x1 - 20; x += step) {
      s.push('<line class="ts-scraper ' + o.scraper + '" x1="' + x + '" y1="' + (yb - 7) + '" x2="' + x + '" y2="' + (yb + 4) + '"/>');
      s.push('<line class="ts-scraper ' + o.scraper + '" x1="' + x + '" y1="' + (yt - 4) + '" x2="' + x + '" y2="' + (yt + 6) + '"/>');
    }
    // натяжна (ліво) і приводна (право) головки
    s.push('<rect class="ts-head" x="' + x0 + '" y="' + (y0 - h / 2 - 6) + '" width="' + tailW + '" height="' + (h + 12) + '" rx="4"/>');
    s.push('<circle class="ts-sprocket" cx="' + (x0 + tailW / 2) + '" cy="' + y0 + '" r="' + (h / 2 - 6) + '"/>');
    s.push('<text class="ts-lbl" x="' + (x0 + tailW / 2) + '" y="' + (y0 + h / 2 + 22) + '" text-anchor="middle">натяжна</text>');
    s.push('<rect class="ts-head" x="' + (x1 - headW) + '" y="' + (y0 - h / 2 - 6) + '" width="' + headW + '" height="' + (h + 12) + '" rx="4"/>');
    s.push('<circle class="ts-sprocket" cx="' + (x1 - headW / 2) + '" cy="' + y0 + '" r="' + (h / 2 - 6) + '"/>');
    s.push('<text class="ts-lbl" x="' + (x1 - headW / 2) + '" y="' + (y0 + h / 2 + 22) + '" text-anchor="middle">приводна</text>');
    if (o.kw) {
      s.push('<rect class="ts-gear" x="' + (x1 + 4) + '" y="' + (y0 - 15) + '" width="24" height="30" rx="3"/><rect class="ts-motor" x="' + (x1 + 28) + '" y="' + (y0 - 12) + '" width="40" height="24" rx="6"/>');
      s.push('<text class="ts-lbl" x="' + (x1 + 46) + '" y="' + (y0 - 20) + '" text-anchor="middle">МР ' + f(o.kw, o.kw % 1 ? 1 : 0) + ' кВт</text>');
    }
    // завантаження / вивантаження / розподільник
    var xi = x0 + tailW + 18;
    s.push('<rect class="ts-pipe" x="' + (xi - 10) + '" y="' + (y0 - h / 2 - 20) + '" width="20" height="20"/><text class="ts-lbl" x="' + xi + '" y="' + (y0 - h / 2 - 26) + '" text-anchor="middle">завантаження</text>');
    if (o.distrib > 0) {
      var xa = x1 - headW - o.distrib * k, xb = x1 - headW - 6;
      xa = Math.max(xa, x0 + tailW + 40);
      for (var xx = xa; xx < xb; xx += 34) s.push('<rect class="ts-pipe" x="' + xx + '" y="' + (y0 + h / 2) + '" width="16" height="14"/>');
      s.push('<text class="ts-lbl" x="' + ((xa + xb) / 2) + '" y="' + (y0 + h / 2 + 40) + '" text-anchor="middle">розподільник ' + f(o.distrib, 1) + ' м</text>');
    } else {
      s.push('<rect class="ts-pipe" x="' + (x1 - headW - 30) + '" y="' + (y0 + h / 2) + '" width="20" height="16"/><text class="ts-lbl" x="' + (x1 - headW - 20) + '" y="' + (y0 + h / 2 + 40) + '" text-anchor="middle">вивантаження</text>');
    }
    // розміри
    var yd = y0 + h / 2 + 62;
    s.push('<line class="ts-ext" x1="' + x0 + '" y1="' + (y0 + h / 2 + 6) + '" x2="' + x0 + '" y2="' + (yd + 4) + '"/><line class="ts-ext" x1="' + x1 + '" y1="' + (y0 + h / 2 + 6) + '" x2="' + x1 + '" y2="' + (yd + 4) + '"/>');
    s.push('<line class="ts-dim" x1="' + x0 + '" y1="' + yd + '" x2="' + x1 + '" y2="' + yd + '" marker-start="url(#tar)" marker-end="url(#tar)"/>');
    s.push('<text class="ts-txt" x="' + ((x0 + x1) / 2) + '" y="' + (yd - 5) + '" text-anchor="middle">L = ' + f(o.L, 2) + ' м · ' + esc(o.model) + ' · ' + esc(o.chainLabel) + (o.liner !== 'none' ? ' · футування ' + (o.liner === 'pe500' ? 'ПЕ-500' : 'ПЕ-1000') : '') + '</text>');
    return '<svg viewBox="0 40 ' + W + ' ' + (yd - 20) + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Скребковий транспортер збоку">' +
      '<defs><marker id="tar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" fill="#333"/></marker></defs>' +
      '<style>.ts-box{fill:#d5dae1;stroke:#444;stroke-width:1.2}.ts-liner{fill:#f2f2f2;stroke:#2e8b57;stroke-width:1}.ts-joint{stroke:#444;stroke-width:2}' +
      '.ts-chain{stroke:#333;stroke-width:2.5;stroke-dasharray:5 2}.ts-scraper{stroke-width:3}.ts-scraper.rubber{stroke:#222}.ts-scraper.plastic{stroke:#2e7dd1}' +
      '.ts-head{fill:#bfc6cf;stroke:#333;stroke-width:1.2}.ts-sprocket{fill:#fff;stroke:#333;stroke-width:1.5;stroke-dasharray:3 2}.ts-gear{fill:#6b7a8c;stroke:#333}.ts-motor{fill:#2f6db3;stroke:#1a3d66}' +
      '.ts-pipe{fill:#bfc6cf;stroke:#444}.ts-dim{stroke:#333;stroke-width:.9}.ts-ext{stroke:#999;stroke-width:.6}.ts-txt{font:13px Arial,sans-serif;fill:#222}.ts-lbl{font:11px Arial,sans-serif;fill:#444}</style>' +
      s.join('') + '</svg>';
  }

  Calc.boot({
    data: ['tsh', 'noria_catalog'],
    pricing: 'tsh',
    docked: true,
    init: initInputs,
    panel: function (Dt) {
      var name = $('model').value || 'ТШ 50', i = 0;
      Dt.tsh.models.forEach(function (m, j) { if (m.model === name) i = j; });
      var P = 'tsh.models.' + i + '.';
      return [
        { tab: 'Розрахунок', details: true, note: 'Кількості, формули й вартість вузлів.' },
        { tab: name, note: 'Ціни для обраної моделі, з ПДВ. Постійно — calc/data/tsh.json.', fields: [
          { path: P + 'drive_head', label: 'Приводна головка', unit: 'грн/шт' },
          { path: P + 'tension_head', label: 'Натяжна головка', unit: 'грн/шт' },
          { path: P + 'section_per_m', label: 'Секція короба, за 1 м', unit: 'грн/м' },
          { path: P + 'chain.trd38_rubber', label: 'Ланцюг ТРД-38 + гумові шкребки, 1 м', unit: 'грн/м' },
          { path: P + 'chain.trd38_plastic', label: 'Ланцюг ТРД-38 + пластикові шкребки, 1 м', unit: 'грн/м' },
          { path: P + 'chain.m81x_plastic', label: 'Ланцюг М-81х + пластикові шкребки, 1 м', unit: 'грн/м' },
          { path: P + 'chain.m125_plastic', label: 'Ланцюг М-125 + пластикові шкребки, 1 м', unit: 'грн/м' },
          { path: P + 'liner_pe500', label: 'Футування ПЕ-500, за 1 м', unit: 'грн/м' },
          { path: P + 'liner_pe1000', label: 'Футування ПЕ-1000, за 1 м', unit: 'грн/м' },
          { path: P + 'distrib', label: 'Розподільник, за 1 м', unit: 'грн/м' }
        ] },
        { tab: 'Геометрія', fields: [
          { path: 'tsh.base_length', label: 'Довжина двох головок разом', unit: 'м' },
          { path: 'tsh.chain_extra_m', label: 'Запас ланцюга', unit: 'м' },
          { path: 'tsh.max_length', label: 'Максимальна довжина', unit: 'м' }
        ] }
      ];
    },
    compute: function (Dt, inp) {
      var T = Dt.tsh, m = model(Dt, inp.model), L = num(inp.length);
      if (!m) return { error: 'Оберіть модель' };
      if (L <= T.base_length) return { error: 'Довжина має бути більшою за ' + T.base_length + ' м (дві головки)' };
      var ch = T.chains.filter(function (c) { return c.key === inp.chain; })[0] || T.chains[0];
      var secLen = L - T.base_length;
      var chainLen = 2 * L + T.chain_extra_m;
      var rows = [
        { name: 'Приводна головка ' + m.model, qty: 1, unit: 'шт', qtyDigits: 0, price: m.drive_head },
        { name: 'Натяжна головка ' + m.model, qty: 1, unit: 'шт', qtyDigits: 0, price: m.tension_head },
        { name: 'Секції короба', qty: secLen, unit: 'м', price: m.section_per_m, note: 'L ' + f(L, 2) + ' − ' + T.base_length + ' м (головки)' },
        { name: 'Ланцюг ' + ch.label, qty: chainLen, unit: 'м', price: m.chain[ch.key], note: '2 × L + ' + T.chain_extra_m + ' м (петля)' }
      ];
      var warnings = [];
      if (inp.liner !== 'none') {
        var lp = inp.liner === 'pe500' ? m.liner_pe500 : m.liner_pe1000;
        rows.push({ name: 'Футування короба ' + (inp.liner === 'pe500' ? 'ПЕ-500' : 'ПЕ-1000'), qty: L, unit: 'м', price: lp });
        if (!lp) warnings.push('Ціна футування ' + (inp.liner === 'pe500' ? 'ПЕ-500' : 'ПЕ-1000') + ' для ' + m.model + ' не задана.');
      }
      var dl = 0;
      if (inp.distributor) {
        dl = num(inp.distributor_length) > 0 ? Math.min(num(inp.distributor_length), L) : L;
        rows.push({ name: 'Розподільний механізм', qty: dl, unit: 'м', price: m.distrib });
      }
      var motor = Dt.noria_catalog.gear_motors.filter(function (g) { return g.id === inp.motor; })[0];
      if (motor) rows.push({ name: 'Мотор-редуктор ' + motor.kw + ' кВт ' + motor.type + ' габ.' + motor.gab, qty: 1, unit: 'шт', qtyDigits: 0, price: motor.price, note: motor.saler + ' (каталог НКЗ)' });
      if (!m.section_per_m) warnings.push('Ціна секції короба для ' + m.model + ' не задана.');
      if (!m.chain[ch.key]) warnings.push('Ціна ланцюга «' + ch.label + '» для ' + m.model + ' не задана.');
      if (!motor) warnings.push('Мотор-редуктор не обрано (таблиці кВт за довжиною для ТШ поки немає — оберіть вручну).');
      if (L > T.max_length) warnings.push('Довжина більша за ' + T.max_length + ' м — перевірте з конструктором.');

      var tot = Calc.totals(rows, T.pricing);
      var title = 'Транспортер скребковий ' + m.model.replace(/^ТШ\s*/, 'ТШ-') + ' L=' + f(L, 2) + ' м, ' + ch.label.toLowerCase() +
        (inp.liner !== 'none' ? ', футування ' + (inp.liner === 'pe500' ? 'ПЕ-500' : 'ПЕ-1000') : '') + (dl ? ', розподільник ' + f(dl, 1) + ' м' : '') +
        (motor ? ', мотор-редуктор ' + motor.kw + ' кВт' : '');

      // довідково: стара таблиця «за м/пог»
      var oldKey = { trd38_rubber: /трд 38 гума/i, trd38_plastic: /трд 38 п/i, m81x_plastic: /M-81x/i, m125_plastic: /M-11|M-12/i }[ch.key];
      var old = T.old_variants.filter(function (v) { return v.model === m.model && oldKey.test(v.chain); })[0];
      var oldTotal = old ? (L - T.base_length) * old.per_m + old.drive + old.tension + (inp.liner !== 'none' ? old.liner * L : 0) + (dl ? old.distrib * dl : 0) : 0;
      var details = [
        { group: 'Розміри', items: [
          { label: 'Секції короба', formula: f(L, 2) + ' − ' + T.base_length, value: f(secLen, 2) + ' м' },
          { label: 'Ланцюг', formula: '2 × ' + f(L, 2) + ' + ' + T.chain_extra_m, value: f(chainLen, 2) + ' м' },
          { label: 'Шкребки', formula: /rubber/.test(ch.key) ? 'гумові' : 'пластикові', value: ch.label.split(',')[0] }
        ] },
        { group: 'Вартість вузлів', items: rows.map(function (r) {
          return { label: r.name, formula: f(r.qty, r.qtyDigits == null ? 2 : r.qtyDigits) + ' ' + r.unit + ' × ' + money(r.price), value: money(r.qty * r.price) };
        }) },
        { group: 'Довідково: стара таблиця ТШ (короб + ланцюг «за м/пог»)', items: old ? [
          { label: m.model + ' · ' + old.chain, formula: '(L − 1,5) × ' + f(old.per_m, 0) + ' + головки' + (inp.liner !== 'none' ? ' + футування' : '') + (dl ? ' + розподільник' : ''), value: money(oldTotal) },
          { label: 'Секція + ланцюг за старою таблицею', formula: 'за 1 м транспортера', value: money(old.per_m) }
        ] : [{ label: 'Для цього ланцюга в старій таблиці рядка немає', value: '—' }] }
      ];
      return {
        title: title,
        rows: rows,
        warnings: warnings,
        details: details,
        viz: drawTsh({ L: L, model: m.model, chainLabel: ch.label, scraper: /rubber/.test(ch.key) ? 'rubber' : 'plastic', liner: inp.liner, distrib: dl, kw: motor ? motor.kw : 0 }),
        after: '<button type="button" class="btn btn-sm btn-success mt-2" data-copy="' + esc(title + ' — ' + f(tot.total, 0) + ' грн з ПДВ.') + '">Скопіювати для клієнта</button>',
        info: [
          { label: 'Секції / ланцюг', value: f(secLen, 2) + ' м / ' + f(chainLen, 2) + ' м' },
          { label: 'Довідково: стара таблиця', value: old ? money(oldTotal) + ' грн (без приводу)' : '—' }
        ]
      };
    }
  });
})();
