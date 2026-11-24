// Ремонт шнека — формули вкладки РШ (Google Sheet «РЕМОНТ шнека»).
(function () {
  'use strict';
  var num = Calc.num;
  function r2(x) { return Math.round(x * 100) / 100; }

  Calc.boot({
    data: ['repair', 'metals'],
    pricing: 'repair',
    panel: function () {
      return [
        { tab: 'Метал', fields: [
          { path: 'metals.strip.price', label: 'Штрипс (Цш)', unit: 'грн/кг' },
          { path: 'metals.tube.price', label: 'Труба (Цт)', unit: 'грн/кг' },
          { path: 'repair.density', label: 'Питома вага ρ', unit: 'г/мм³' }
        ] },
        { tab: 'Коефіцієнти', fields: [
          { path: 'repair.spiral_coef', label: 'Коеф. ціни спіралі (роздріб 6, опт 5)', unit: '×' },
          { path: 'repair.spiral_overhead', label: 'Запас на спіраль', unit: '×' },
          { path: 'repair.strip_length_factor', label: 'Коеф. довжини штрипса', unit: '×' },
          { path: 'repair.tube_coef', label: 'Коеф. ціни нової труби', unit: '×' },
          { path: 'repair.tube_weight_k', label: 'Коеф. маси труби', unit: '' }
        ] },
        { tab: 'Роботи', fields: [
          { path: 'repair.rates.disassembly_300', label: 'Демонтаж, D ≥ 300', unit: 'грн/м' },
          { path: 'repair.rates.disassembly_150', label: 'Демонтаж, D ≥ 150', unit: 'грн/м' },
          { path: 'repair.rates.disassembly_small', label: 'Демонтаж, D < 150', unit: 'грн/м' },
          { path: 'repair.rates.assembly', label: 'Монтаж (× D, мм)', unit: 'грн/м' },
          { path: 'repair.rates.balancing', label: 'Балансування', unit: 'грн/м' },
          { path: 'repair.rates.priming', label: 'Грунтування', unit: 'грн/м²' }
        ] }
      ];
    },
    compute: function (Dt, inp) {
      var R = Dt.repair, M = Dt.metals;
      var D = num(inp.D), d = num(inp.d), t = num(inp.p), s = num(inp.s), L = num(inp.L), wall = num(inp.wall);
      if (D <= 0 || d <= 0 || t <= 0 || s <= 0 || L <= 0) return { error: 'Заповніть D, d, крок, товщину і довжину' };
      if (d >= D) return { error: 'd має бути меншим за D' };
      if (wall >= d / 2) return { error: 'Стінка труби завелика для d' };
      var hzett = inp.owner === 'hzett';

      var l = Math.sqrt(Math.pow(Math.PI * d, 2) + t * t);
      var Lo = Math.sqrt(Math.pow(Math.PI * D, 2) + t * t);
      var a = (D - d) / 2;
      var ang = (Lo - l) / a;
      var Do = 2 * Lo / ang, dO = 2 * l / ang;
      var n = 1000 / t;
      var spiralArea = Math.PI * (Do * Do - dO * dO) * n * L / 2e6;
      var stripPerM = l * n * R.strip_length_factor;
      var massPerM = s * a * stripPerM * R.density / 1000;
      var tubeArea = Math.PI * d * L / 1000;
      var tubeMass = wall * R.tube_weight_k * (d - wall) * L;
      var rate = D >= 300 ? R.rates.disassembly_300 : D >= 150 ? R.rates.disassembly_150 : R.rates.disassembly_small;

      var rows = [
        { name: 'Спіраль (штрипс)', qty: massPerM * L, unit: 'кг',
          price: R.spiral_overhead * M.strip.price * R.spiral_coef,
          note: 'Цш ' + M.strip.price + ' × ' + R.spiral_overhead + ' × коеф. ' + R.spiral_coef }
      ];
      if (hzett) rows.push({ name: 'Труба нова', qty: tubeMass, unit: 'кг', price: M.tube.price * R.tube_coef,
        note: 'Цт ' + M.tube.price + ' × ' + R.tube_coef });
      else rows.push({ name: 'Демонтаж старої спіралі', qty: L, unit: 'м', price: rate });
      if (tubeMass > 0) {
        rows.push({ name: 'Монтаж нової спіралі', qty: L, unit: 'м', price: R.rates.assembly * D, note: R.rates.assembly + ' грн × D за метр' });
        rows.push({ name: 'Балансування шнека', qty: L, unit: 'м', price: R.rates.balancing });
      }
      rows.push({ name: 'Грунтування', qty: spiralArea + tubeArea, unit: 'м²', price: R.rates.priming });

      var warnings = [];
      if (tubeMass <= 0) warnings.push('Без товщини стінки труби монтаж і балансування не рахуються (як у таблиці РШ).');

      return {
        title: 'Ремонт шнека D' + D + '×d' + d + ', крок ' + t + ', s=' + s + ', L=' + L + ' м, труба ' + (hzett ? 'нова (стінка ' + wall + ' мм)' : 'замовника'),
        rows: rows,
        warnings: warnings,
        info: [
          { label: 'Маса 1 м спіралі', value: massPerM.toFixed(3) + ' кг' },
          { label: 'Ціна 1 м спіралі, роздріб / опт (з ПДВ)', value:
              Calc.money(Math.round(massPerM * R.spiral_overhead * M.strip.price * 6 * 1.1 / 3) * 3, 0) + ' / ' +
              Calc.money(Math.round(massPerM * R.spiral_overhead * M.strip.price * 5 * 1.1 / 3) * 3, 0) + ' грн' },
          { label: 'Розгортка витка Do / do', value: Do.toFixed(0) + ' / ' + dO.toFixed(0) + ' мм' },
          { label: 'Висота витка a', value: a.toFixed(1) + ' мм' },
          { label: 'Витків на 1 м', value: n.toFixed(2) },
          { label: 'Довжина штрипса на 1 м', value: stripPerM.toFixed(0) + ' мм' },
          { label: 'Маса труби', value: tubeMass.toFixed(3) + ' кг' },
          { label: 'Маса шнека (довідково)', value: (massPerM * L + tubeMass).toFixed(1) + ' кг' }
        ]
      };
    }
  });
})();
