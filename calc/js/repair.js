(function () {
  'use strict';
  var num = Calc.num;

  function r2(x) { return Math.round(x * 100) / 100; }
  function r3(x) { return Math.round(x * 1000) / 1000; }
  function r4(x) { return Math.round(x * 10000) / 10000; }

  Calc.boot({
    data: ['repair', 'metals'],
    pricing: 'repair',
    panel: function () {
      return [
        { tab: 'Метал', fields: [
          { path: 'metals.strip.price', label: 'Штрипс', unit: 'грн/кг' },
          { path: 'metals.tube.price', label: 'Труба', unit: 'грн/кг' },
          { path: 'repair.spiral_coef', label: 'Коефіцієнт ціни спіралі', unit: '×' },
          { path: 'repair.blank_factor', label: 'Коеф. заготовки', unit: '×' }
        ] },
        { tab: 'Роботи', fields: [
          { path: 'repair.rates.disassembly_300', label: 'Демонтаж D≥300', unit: 'грн/м' },
          { path: 'repair.rates.disassembly_150', label: 'Демонтаж D≥150', unit: 'грн/м' },
          { path: 'repair.rates.disassembly_small', label: 'Демонтаж D<150', unit: 'грн/м' },
          { path: 'repair.rates.assembly', label: 'Монтаж', unit: 'грн за м на мм D' },
          { path: 'repair.rates.balancing', label: 'Балансування', unit: 'грн/м' },
          { path: 'repair.rates.priming', label: 'Грунтування', unit: 'грн/м²' }
        ] }
      ];
    },
    compute: function (D, inp) {
      var R = D.repair, M = D.metals;
      var Dd = num(inp.D), d = num(inp.d), p = num(inp.p), s = num(inp.s), L = num(inp.L), wall = num(inp.wall);
      if (Dd <= 0 || d <= 0 || p <= 0 || s <= 0 || L <= 0) {
        return { error: 'Заповніть D, d, крок, товщину і довжину' };
      }
      if (d >= Dd) return { error: 'd має бути меншим за D' };

      // Розрахунок спіралі (порт CRM ScrewRepairCalculator)
      var turns = Math.ceil(L * 1000 / p);
      var hd = Math.atan(p / (3.14 * d)) * 180 / Math.PI;
      var cosv = Math.cos(hd * Math.PI / 180);
      var d1 = d / cosv;
      var biRaw = d1 * R.blank_factor;
      var bi = r2(biRaw);
      var bo = Dd - d + biRaw;
      var fh = r2((bo - biRaw) / 2);
      var d31 = r4(Math.sqrt(Math.pow(Math.PI * bi, 2) + p * p) * (1000 / p) * fh * s * 7.85 / 1e6);

      var stripPrice = M.strip.price, tubePrice = M.tube.price;
      var rows = [
        { name: 'Спіраль (штрипс)', note: 'маса d31×L; ціна = штрипс × коеф. ' + R.spiral_coef,
          qty: r2(d31 * L), unit: 'кг', price: stripPrice * R.spiral_coef }
      ];
      var tubeKg = 0;
      if (wall > 0) {
        tubeKg = r3(wall * 0.02465 * (d - wall) * L);
        rows.push({ name: 'Труба нова', qty: tubeKg, unit: 'кг', price: tubePrice });
      } else {
        var disPrice = Dd >= 300 ? R.rates.disassembly_300 : Dd >= 150 ? R.rates.disassembly_150 : R.rates.disassembly_small;
        rows.push({ name: 'Демонтаж старої спіралі', qty: L, unit: 'м', price: disPrice });
      }
      rows.push({ name: 'Монтаж нової спіралі', note: R.rates.assembly + ' грн × D за метр',
        qty: L, unit: 'м', price: R.rates.assembly * Dd });
      rows.push({ name: 'Балансування шнека', qty: L, unit: 'м', price: R.rates.balancing });
      var priming = r4(r4(Math.PI * (Dd * Dd - d * d) * turns / 2e6) + r4(Math.PI * d * L / 1000));
      rows.push({ name: 'Грунтування', qty: priming, unit: 'м²', price: R.rates.priming });

      var info = [
        { label: 'Кількість витків', value: turns },
        { label: 'Кут підйому гвинтової лінії', value: hd.toFixed(2) + '°' },
        { label: 'Внутрішній діаметр заготовки bi', value: bi + ' мм' },
        { label: 'Зовнішній діаметр заготовки bo', value: bo.toFixed(2) + ' мм' },
        { label: 'Висота витка fh', value: fh + ' мм' },
        { label: 'Маса спіралі на 1 м d31', value: d31 + ' кг/м' }
      ];
      if (wall > 0) info.push({ label: 'Маса труби', value: tubeKg + ' кг' });

      return {
        title: 'Ремонт шнека D' + Dd + '×d' + d + ', крок ' + p + ', s=' + s + ', L=' + L + ' м' +
          (wall > 0 ? ', заміна труби (стінка ' + wall + ' мм)' : ''),
        rows: rows,
        info: info
      };
    }
  });
})();
