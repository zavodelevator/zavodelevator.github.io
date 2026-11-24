(function () {
  'use strict';
  var num = Calc.num;

  function fillSelects(D) {
    var models = [];
    D.tsh.variants.forEach(function (v) { if (models.indexOf(v.model) < 0) models.push(v.model); });
    var m = document.getElementById('model');
    m.innerHTML = models.map(function (x) { return '<option>' + x + '</option>'; }).join('');
    m.addEventListener('change', function () { fillChains(D); });
    fillChains(D);
    var g = document.getElementById('kw');
    g.innerHTML = '<option value="0">без мотор-редуктора</option>' + D.gear_motors.items.map(function (x) {
      return '<option value="' + x.kw + '">' + x.kw + ' кВт</option>';
    }).join('');
  }

  function fillChains(D) {
    var model = document.getElementById('model').value;
    var c = document.getElementById('chain');
    c.innerHTML = D.tsh.variants.filter(function (v) { return v.model === model; })
      .map(function (v) { return '<option>' + v.chain + '</option>'; }).join('');
  }

  Calc.boot({
    data: ['tsh', 'gear_motors'],
    pricing: 'tsh',
    init: fillSelects,
    panel: function () {
      return [
        { tab: 'Ціни вузлів', note: 'Ціни з ПДВ. Привідна і натяжна — за штуку, решта — грн за метр.',
          fields: [{ type: 'table', path: 'tsh.variants', columns: [
            { key: 'model', label: 'Модель', readonly: true },
            { key: 'chain', label: 'Ланцюг', readonly: true },
            { key: 'drive', label: 'Привідна' },
            { key: 'tension', label: 'Натяжна' },
            { key: 'per_m', label: 'За м/пог' },
            { key: 'liner', label: 'Футув./м' },
            { key: 'distrib', label: 'Розпод./м' }
          ] }] },
        { tab: 'Мотор-редуктори', note: 'Ціна мотор-редуктора за потужністю, грн з ПДВ.',
          fields: [{ type: 'table', path: 'gear_motors.items', columns: [
            { key: 'kw', label: 'кВт', readonly: true },
            { key: 'price', label: 'Ціна' }
          ] }] },
        { tab: 'Загальне', fields: [
          { path: 'tsh.base_length', label: 'Довжина, що входить у привідну+натяжну', unit: 'м' },
          { path: 'tsh.max_length', label: 'Максимальна довжина', unit: 'м' }
        ] }
      ];
    },
    compute: function (D, inp) {
      var T = D.tsh;
      var v = T.variants.filter(function (x) { return x.model === inp.model && x.chain === inp.chain; })[0];
      if (!v) return { error: 'Оберіть модель і ланцюг' };
      var L = num(inp.length), base = num(T.base_length);
      if (L <= base) return { error: 'Довжина має бути більшою за ' + base + ' м' };
      var rows = [
        { name: 'Секція привідна', qty: 1, unit: 'шт', price: v.drive, qtyDigits: 0 },
        { name: 'Секція натяжна', qty: 1, unit: 'шт', price: v.tension, qtyDigits: 0 },
        { name: 'Короб з ланцюгом (' + v.chain + ')', note: 'довжина мінус ' + base + ' м, що входять у секції', qty: L - base, unit: 'м', price: v.per_m }
      ];
      if (inp.liner) rows.push({ name: 'Футування короба', qty: L, unit: 'м', price: v.liner });
      if (inp.distributor) {
        var dl = num(inp.distributor_length) > 0 ? num(inp.distributor_length) : L;
        rows.push({ name: 'Розподільний механізм', qty: dl, unit: 'м', price: v.distrib });
      }
      var warnings = [];
      var kw = num(inp.kw);
      if (kw > 0) {
        var gm = D.gear_motors.items.filter(function (x) { return x.kw === kw; })[0];
        rows.push({ name: 'Мотор-редуктор ' + kw + ' кВт', qty: 1, unit: 'шт', price: gm ? gm.price : 0, qtyDigits: 0 });
        if (!gm || !gm.price) warnings.push('Ціна мотор-редуктора ' + kw + ' кВт не задана — впишіть її в панелі «Параметри» → «Мотор-редуктори».');
      }
      if (L > num(T.max_length)) warnings.push('Довжина більша за ' + T.max_length + ' м — перевірте з конструктором.');
      return {
        title: 'Транспортер шкребковий ' + v.model.replace(/^ТШ\s*/, 'ТШ-') + ' L=' + L + ' м (' + v.chain + ')' + (kw > 0 ? ', мотор-редуктор ' + kw + ' кВт' : ''),
        rows: rows,
        warnings: warnings
      };
    }
  });
})();
