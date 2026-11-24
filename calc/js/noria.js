(function () {
  'use strict';
  var num = Calc.num;
  var DEFAULT_CAPACITY = 25;

  function fillSelects(D) {
    var s = document.getElementById('capacity');
    s.innerHTML = D.noria.models.map(function (m) {
      return '<option value="' + m.capacity + '">' + m.capacity + ' т/год</option>';
    }).join('');
    s.value = String(DEFAULT_CAPACITY);
  }

  function ceilSafe(x) {
    return Math.ceil(Math.round(x * 1e6) / 1e6);
  }

  // Перший рядок прайсу з h >= H. Якщо H вище за останній рядок — останній, over = true.
  function priceRow(D, cap, H) {
    var list = D.noria.price_list[String(cap)] || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].h >= H) return { row: list[i], over: false };
    }
    return { row: list[list.length - 1], over: true };
  }

  Calc.boot({
    data: ['noria', 'gear_motors'],
    pricing: 'noria',
    init: fillSelects,
    panel: function () {
      return [
        { tab: 'Вузли норії', note: 'Ціни поки 0 — переоцінити. Ціни з ПДВ.',
          fields: [{ type: 'table', path: 'noria.models', columns: [
            { key: 'capacity', label: 'т/год', readonly: true },
            { key: 'boot', label: 'Башмак' },
            { key: 'head', label: 'Голова' },
            { key: 'shaft_per_m', label: 'Шахта/м' },
            { key: 'belt_per_m', label: 'Стрічка/м' },
            { key: 'bucket', label: 'Ківш' },
            { key: 'buckets_per_m', label: 'Ковшів/м' },
            { key: 'bucket_hardware', label: 'Метизи/ківш' },
            { key: 'belt_extra_m', label: 'Запас стрічки, м' }
          ] }] },
        { tab: 'Мотор-редуктори', note: 'Ціна мотор-редуктора за потужністю, грн з ПДВ.',
          fields: [{ type: 'table', path: 'gear_motors.items', columns: [
            { key: 'kw', label: 'кВт', readonly: true },
            { key: 'price', label: 'Ціна' }
          ] }] },
        { tab: 'Прайс (папір)', note: 'Довідково: паперовий прайс. Сума з нього не рахується; з нього береться потужність приводу (кВт) і довідкова ціна.',
          fields: [10, 25, 50, 100].map(function (cap) {
            return { type: 'table', path: 'noria.price_list.' + cap, label: cap + ' т/год', columns: [
              { key: 'h', label: 'H, м', readonly: true },
              { key: 'price', label: 'Ціна' },
              { key: 'kw', label: 'кВт' }
            ] };
          }) }
      ];
    },
    compute: function (D, inp) {
      var cap = num(inp.capacity);
      var H = num(inp.height);
      var m = D.noria.models.filter(function (x) { return x.capacity === cap; })[0];
      if (!m) return { error: 'Оберіть продуктивність' };
      if (!(H > 0)) return { error: 'Вкажіть висоту' };

      var beltExtra = num(m.belt_extra_m);
      var beltLen = 2 * H + beltExtra;
      var buckets = ceilSafe(beltLen * num(m.buckets_per_m));

      var rows = [
        { name: 'Башмак (натяжна секція)', qty: 1, unit: 'шт', price: num(m.boot), qtyDigits: 0 },
        { name: 'Голова привідна', qty: 1, unit: 'шт', price: num(m.head), qtyDigits: 0 },
        { name: 'Шахта (секції)', qty: H, unit: 'м', price: num(m.shaft_per_m) },
        { name: 'Стрічка', note: '2 × H + ' + beltExtra + ' м', qty: beltLen, unit: 'м', price: num(m.belt_per_m) },
        { name: 'Ковші', qty: buckets, unit: 'шт', price: num(m.bucket), qtyDigits: 0 },
        { name: 'Метизи ковшів', qty: buckets, unit: 'шт', price: num(m.bucket_hardware), qtyDigits: 0 }
      ];

      var warnings = [];
      var comp = [m.boot, m.head, m.shaft_per_m, m.belt_per_m, m.bucket, m.bucket_hardware].map(num);
      if (comp.every(function (x) { return x === 0; })) {
        warnings.push('Ціни вузлів норії ще не задані — заповніть у панелі «Параметри» (або в calc/data/noria.json).');
      }

      var ref = priceRow(D, cap, H);
      var kw = null;
      if (inp.drive) {
        if (ref.over) warnings.push('Висота більша за прайс — потужність взято з останнього рядка');
        kw = num(ref.row.kw);
        var gm = D.gear_motors.items.filter(function (x) { return x.kw === kw; })[0];
        var gmPrice = gm ? num(gm.price) : 0;
        rows.push({ name: 'Мотор-редуктор ' + kw + ' кВт', qty: 1, unit: 'шт', price: gmPrice, qtyDigits: 0 });
        if (!gmPrice) warnings.push('Ціна мотор-редуктора ' + kw + ' кВт не задана');
      }

      var info = [
        { label: 'Довжина стрічки', value: Calc.money(beltLen, 2) + ' м' },
        { label: 'Кількість ковшів', value: buckets + ' шт' },
        { label: 'Потужність приводу', value: kw != null ? kw + ' kW' : 'без приводу' },
        { label: 'Довідково: паперовий прайс', value: Calc.money(ref.row.price, 2) + ' грн (H=' + ref.row.h + ' м; ціна може включати привід' +
          (cap === 100 ? ', для 100 т/год — без приводу' : '') + ')' }
      ];

      return {
        title: 'Норія ковшова ' + cap + ' т/год, H=' + H + ' м' + (kw != null ? ', мотор-редуктор ' + kw + ' кВт' : ''),
        rows: rows,
        warnings: warnings,
        info: info
      };
    }
  });
})();
