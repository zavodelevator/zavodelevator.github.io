(function () {
  'use strict';
  var num = Calc.num;

  Calc.boot({
    data: ['spiral', 'metals'],
    pricing: 'spiral',
    panel: function () {
      return [
        { tab: 'Метал', fields: [
          { path: 'metals.strip.price', label: 'Штрипс', unit: 'грн/кг' },
          { path: 'spiral.density', label: 'Густина', unit: 'г/см³' }
        ] },
        { tab: 'Коефіцієнти', fields: [
          { path: 'spiral.coef_retail', label: 'Коеф. роздріб' },
          { path: 'spiral.coef_wholesale', label: 'Коеф. опт' },
          { path: 'spiral.overhead', label: 'Запас матеріалу' },
          { path: 'spiral.strip_length_factor', label: 'Коеф. довжини штрипса' }
        ] }
      ];
    },
    compute: function (D, inp) {
      var S = D.spiral;
      var Dout = num(inp.D), d = num(inp.d), p = num(inp.p), s = num(inp.s), L = num(inp.length);
      if (!(Dout > 0 && d > 0 && p > 0 && s > 0 && L > 0)) return { error: 'Заповніть D, d, крок, товщину і довжину' };
      if (d >= Dout) return { error: 'd має бути меншим за D' };

      var wholesale = inp.price_type === 'wholesale';
      var typeName = wholesale ? 'опт' : 'роздріб';
      var coef = wholesale ? num(S.coef_wholesale) : num(S.coef_retail);

      var h = (Dout - d) / 2;                                   // висота штрипса, мм
      var lm = Math.sqrt(Math.pow(Math.PI * d, 2) + p * p);     // середня гвинтова лінія витка, мм
      var n = 1000 / p;                                         // витків на 1 м
      var sl = lm * n * num(S.strip_length_factor);             // довжина штрипса на 1 м, мм
      var w1m = sl * h * s * num(S.density) / 1e6;              // маса 1 м, кг
      var totalWeight = w1m * L;                                // маса загальна, кг
      var turns = Math.ceil(n * L);                             // кількість витків

      var price = num(D.metals.strip.price) * num(S.overhead) * coef;

      return {
        title: 'Спіраль шнекова цільнотягнута D' + Dout + '×d' + d + ', крок ' + p + ', s=' + s + ', L=' + L + ' м (' + typeName + ')',
        rows: [
          {
            name: 'Штрипс на спіраль',
            note: 'ціна штрипса × ' + S.overhead + ' (запас) × коеф. ' + coef + ' (' + typeName + ')',
            qty: totalWeight, qtyDigits: 3, unit: 'кг', price: price
          }
        ],
        info: [
          { label: 'Висота штрипса h, мм', value: Calc.money(h, 1) },
          { label: 'Середня гвинтова лінія витка lm, мм', value: Calc.money(lm, 2) },
          { label: 'Витків на 1 м', value: Calc.money(n, 3) },
          { label: 'Кількість витків', value: Calc.money(turns, 0) },
          { label: 'Довжина штрипса на 1 м, мм', value: Calc.money(sl, 1) },
          { label: 'Маса 1 м, кг', value: Calc.money(w1m, 4) },
          { label: 'Маса загальна, кг', value: Calc.money(totalWeight, 3) }
        ]
      };
    }
  });
})();
