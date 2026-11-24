(function () {
  'use strict';
  var num = Calc.num;

  // число з комою для українського відображення
  function fmt(v) {
    var f = num(v);
    return f === Math.round(f) ? String(Math.round(f)) : String(Math.round(f * 100) / 100).replace('.', ',');
  }

  function fillDiameters(D) {
    var s = document.getElementById('diameter');
    s.innerHTML = D.screw_conveyor.diameters.map(function (r) {
      return '<option value="' + r.d + '"' + (r.d === 159 ? ' selected' : '') + '>Ø' + r.d + ' мм</option>';
    }).join('');
  }

  var COEF_LABELS = [
    ['pulleys_bearings', 'Шківи та підшипники (варіант з двигуном)', 'грн'],
    ['gear_base', 'База під мотор-редуктор (заміна шківів)', 'грн'],
    ['meter_coef', 'Коефіцієнт за метр (запас 1,1 × 1,2)', ''],
    ['hopper_small', 'Бункер, Ø менше ліміту', 'грн'],
    ['hopper_large', 'Бункер, Ø від ліміту', 'грн'],
    ['stand_small', 'Підставка, Ø менше ліміту', 'грн'],
    ['stand_large', 'Підставка, Ø від ліміту', 'грн'],
    ['krot_coef', 'Крот, частка від ціни за метр', ''],
    ['trough_coef', 'Жолоб (множник)', ''],
    ['long_coef', 'Довгий транспортер (множник)', ''],
    ['long_from', 'Довгий — з довжини', 'м'],
    ['small_limit', 'Малий діаметр — менше', 'мм'],
    ['overhead_coef', 'Накладні (множник)', ''],
    ['markup_coef', 'Націнка CRM (множник)', ''],
    ['max_length', 'Максимальна довжина', 'м']
  ];

  Calc.boot({
    data: ['screw_conveyor', 'gear_motors'],
    pricing: 'screw_conveyor',
    init: fillDiameters,
    panel: function (D) {
      var S = D.screw_conveyor;
      var kwFields = [];
      Object.keys(S.kw_table).forEach(function (d) {
        S.kw_table[d].forEach(function (kw, i) {
          kwFields.push({ path: 'screw_conveyor.kw_table.' + d + '.' + i, label: 'Ø' + d + ', до ' + (i + 1) + ' м', unit: 'кВт' });
        });
      });
      return [
        { tab: 'Діаметри', note: 'Кінцеві вузли — грн за штуку, за метр — грн за метр. Ціни з ПДВ.',
          fields: [{ type: 'table', path: 'screw_conveyor.diameters', columns: [
            { key: 'd', label: 'Ø, мм', readonly: true },
            { key: 'base', label: 'Кінцеві вузли' },
            { key: 'per_m', label: 'За метр' }
          ] }] },
        { tab: 'Коефіцієнти', fields: COEF_LABELS.map(function (c) {
          return { path: 'screw_conveyor.coef.' + c[0], label: c[1], unit: c[2] || undefined };
        }) },
        { tab: 'Потужність', note: 'кВт за довжиною (1…12 м)', fields: kwFields },
        { tab: 'Приводи', note: 'Ціна мотор-редуктора / електродвигуна за потужністю, грн з ПДВ.',
          fields: [{ type: 'table', path: 'gear_motors.items', columns: [
            { key: 'kw', label: 'кВт', readonly: true },
            { key: 'price', label: 'Ціна' }
          ] }] }
      ];
    },
    compute: function (D, inp) {
      var S = D.screw_conveyor, c = S.coef;
      var L = num(inp.length);
      if (!(L > 0)) return { error: 'Вкажіть довжину' };
      var d = num(inp.diameter);
      var dRow = S.diameters.filter(function (r) { return r.d === d; })[0];
      if (!dRow) return { error: 'Оберіть діаметр' };

      var drive = inp.drive, gear = drive === 'gear';
      var small = d < c.small_limit;
      var hopperPrice = small ? c.hopper_small : c.hopper_large;
      var standPrice = small ? c.stand_small : c.stand_large;
      var krotPrice = dRow.per_m * c.krot_coef;

      var K = (inp.trough ? c.trough_coef : 1) * (L >= c.long_from ? c.long_coef : 1) *
        c.overhead_coef * c.markup_coef;

      var rows = [];
      if (gear) rows.push({ name: 'База під мотор-редуктор', qty: 1, unit: 'шт', price: c.gear_base * K, qtyDigits: 0 });
      else rows.push({ name: 'Шківи та підшипники', qty: 1, unit: 'шт', price: c.pulleys_bearings * K, qtyDigits: 0 });
      rows.push({ name: 'Кінцеві вузли Ø' + d, qty: 1, unit: 'шт', price: dRow.base * K, qtyDigits: 0 });
      rows.push({ name: 'Корпус і шнек за метр', note: 'грн/м × ' + fmt(c.meter_coef) + ' (запас 1,1 × 1,2) × коефіцієнти',
        qty: L, unit: 'м', price: dRow.per_m * c.meter_coef * K });
      if (inp.hopper) rows.push({ name: 'Бункер', qty: 1, unit: 'шт', price: hopperPrice * K, qtyDigits: 0 });
      if (inp.stand) rows.push({ name: 'Підставка', qty: 1, unit: 'шт', price: standPrice * K, qtyDigits: 0 });
      if (inp.krot) rows.push({ name: 'Крот (прохідний)', qty: 1, unit: 'шт', price: krotPrice * K, qtyDigits: 0 });

      var warnings = [];
      var kwVal = null;
      if (drive !== 'none') {
        var kwList = S.kw_table[String(d)] || [];
        var kw = kwList[Math.ceil(L) - 1];
        if (typeof kw === 'number' && kw > 0) {
          kwVal = kw;
          var gm = D.gear_motors.items.filter(function (x) { return Number(x.kw) === kw; })[0];
          var gp = gm ? num(gm.price) : 0;
          rows.push({ name: (gear ? 'Мотор-редуктор ' : 'Електродвигун ') + fmt(kw) + ' кВт', qty: 1, unit: 'шт', price: gp, qtyDigits: 0 });
          if (!gp) warnings.push('Ціна приводу ' + fmt(kw) + ' кВт не задана — впишіть у панелі «Параметри» → «Приводи».');
        } else {
          warnings.push('Потужність для цієї довжини не задана — оберіть привід вручну');
        }
      }
      if (L > c.max_length) warnings.push('Довжина понад ' + c.max_length + ' м — перевірте з конструктором');

      var opts = [];
      if (inp.hopper) opts.push('бункер');
      if (inp.stand) opts.push('підставка');
      if (inp.krot) opts.push('крот');
      if (inp.trough) opts.push('жолоб');
      var title = 'Шнековий транспортер Ø' + d + ' L=' + fmt(L) + ' м' +
        (opts.length ? ' (' + opts.join(', ') + ')' : '');
      if (drive !== 'none') {
        title += ', ' + (gear ? 'мотор-редуктор' : 'електродвигун') + (kwVal ? ' ' + fmt(kwVal) + ' кВт' : '');
      }

      return {
        title: title,
        rows: rows,
        info: [
          { label: 'Коефіцієнт K (жолоб×довжина≥10×1,15×1,1)', value: K.toFixed(4).replace('.', ',') },
          { label: 'Потужність приводу', value: kwVal ? fmt(kwVal) + ' кВт' : '—' }
        ],
        warnings: warnings
      };
    }
  });
})();
