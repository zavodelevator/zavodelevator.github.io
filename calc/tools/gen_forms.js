// Генерує дві PDF-форми для ручного заповнення цін: node calc/tools/gen_forms.js calc
// Потрібен Playwright (Chromium).
const path = require('path');
const fs = require('fs');
const root = path.resolve(process.argv[2] || 'calc');
const J = (n) => JSON.parse(fs.readFileSync(path.join(root, 'data', n + '.json'), 'utf8'));
const S = require(path.join(root, 'js', 'shnek_core.js'));
const cfg = J('shnek_core'), metals = J('metals'), repair = J('repair'), sc = J('screw_conveyor'), sections = J('sections'),
  gm = J('gear_motors'), noria = J('noria'), tsh = J('tsh'), spiral = J('spiral');

const fmt = (x, d = 0) => x === '' || x === null || x === undefined ? '' : Number(x).toLocaleString('uk-UA', { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const vatBox = '<span class="vat">ціни: ☐ з ПДВ &nbsp; ☐ без ПДВ</span>';

// таблиця «позиція — од. — зараз — нова ціна»
function list(title, rows, opts = {}) {
  return `<h2>${esc(title)}${opts.vat === false ? '' : vatBox}</h2>${opts.note ? `<p class="note">${esc(opts.note)}</p>` : ''}
  <table class="list"><thead><tr><th class="n">№</th><th>Позиція</th><th class="u">Од.</th><th class="cur">Зараз у калькуляторі</th><th class="new">Нова ціна</th></tr></thead><tbody>
  ${rows.map((r, i) => `<tr><td class="n">${i + 1}</td><td>${esc(r[0])}${r[3] ? `<div class="src">${esc(r[3])}</div>` : ''}</td><td class="u">${esc(r[1])}</td><td class="cur">${r[2]}</td><td class="new"></td></tr>`).join('')}
  </tbody></table>`;
}
// сітка «рядок × колонки»: у кожній клітинці дрібно поточне значення + місце для запису
function grid(title, colHeads, rows, opts = {}) {
  return `<h2>${esc(title)}${opts.vat === false ? '' : vatBox}</h2>${opts.note ? `<p class="note">${esc(opts.note)}</p>` : ''}
  <table class="grid"><thead><tr><th>${esc(opts.first || '')}</th>${colHeads.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
  ${rows.map((r) => `<tr><th>${esc(r[0])}</th>${r[1].map((v) => `<td><span class="was">${v === '' ? '' : 'зараз ' + v}</span></td>`).join('')}</tr>`).join('')}
  </tbody></table>`;
}

function page(title, subtitle, body) {
  return `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>${esc(title)}</title><style>
  @page { size: A4; margin: 12mm 11mm 14mm; }
  body { font: 10.5pt Arial, sans-serif; color: #000; }
  h1 { font-size: 16pt; margin: 0 0 2mm; } .sub { margin: 0 0 4mm; font-size: 9.5pt; }
  .meta { display: flex; gap: 10mm; font-size: 10pt; margin-bottom: 5mm; } .meta span { flex: 1; border-bottom: 1px solid #000; padding-bottom: 1mm; }
  h2 { font-size: 12pt; margin: 6mm 0 1.5mm; padding: 1mm 2mm; background: #e9e9e9; border-left: 3px solid #000; display: flex; justify-content: space-between; break-after: avoid; }
  .vat { font-weight: normal; font-size: 9pt; }
  .note { margin: 0 0 1.5mm; font-size: 8.5pt; color: #333; }
  table { width: 100%; border-collapse: collapse; break-inside: auto; } tr { break-inside: avoid; }
  th, td { border: 1px solid #000; padding: 1mm 1.5mm; vertical-align: middle; }
  thead th { background: #f2f2f2; font-size: 8.5pt; } thead { display: table-header-group; }
  .list td { height: 8.5mm; } .list .n { width: 7mm; text-align: center; } .list .u { width: 16mm; text-align: center; font-size: 9pt; }
  .list .cur { width: 30mm; text-align: right; color: #555; font-size: 9pt; } .list .new { width: 36mm; }
  .src { font-size: 7.5pt; color: #555; }
  .grid th, .grid td { text-align: center; } .grid tbody th { white-space: nowrap; font-size: 9.5pt; width: 22mm; }
  .grid td { height: 11mm; vertical-align: top; text-align: left; position: relative; } .grid thead th { font-size: 8pt; }
  .was { font-size: 6.8pt; color: #666; }
  .sign { margin-top: 8mm; display: flex; gap: 10mm; font-size: 10pt; } .sign span { flex: 1; border-bottom: 1px solid #000; padding-top: 8mm; }
  .pb { break-before: page; }
  </style></head><body>
  <h1>${esc(title)}</h1><p class="sub">${esc(subtitle)}</p>
  <div class="meta"><span>Дата:</span><span>Заповнив:</span><span>Постачальник / джерело:</span></div>
  ${body}
  <div class="sign"><span>Підпис:</span><span>Перевірив:</span></div>
  </body></html>`;
}

// ---------- поточні значення з детального розрахунку ----------
const tubeSizes = cfg.std.tube, troughSizes = cfg.std.trough;
const q = (inp) => S.quote(Object.assign({ length: 6, drive_kind: 'none' }, inp), cfg, null);
function standPair(type, size) {
  const a = q({ type, size, stand: 'stand' }), b = q({ type, size });
  const pairs = Math.ceil(6 / cfg.stand.span_m) + 1;
  return ((a.subtotal - b.subtotal) * cfg.vat) / pairs;
}
function hopperCost(v) {
  const a = q({ type: 'tube', size: 159, hopper: v }), b = q({ type: 'tube', size: 159 });
  return (a.subtotal - b.subtotal) * cfg.vat;
}

// ================= Форма 1: шнекові =================
const mats = { black: 'чорна ст.3', tech: 'нерж. технічна', food: 'нерж. харчова AISI 304' };
const cls = { flight: 'Штрипс на спіраль', sheet: 'Лист', tube_body: 'Труба корпусу', shaft_tube: 'Труба вала (трубовал)', bar: 'Пруток (цапфи)' };
let f1 = '';
f1 += list('1. Метал для ремонту шнека і спіралі', [
  ...metals.strip_grades.map((g) => ['Штрипс — ' + g.label, 'грн/кг', fmt(g.price, 2)]),
  ['Труба вала шнека (нова труба при ремонті)', 'грн/кг', fmt(metals.tube.price, 2)]
], { note: 'Ремонт шнека (вкладка РШ) і цільнотягнута спіраль.' });
f1 += list('2. Метал для виготовлення транспортера (детальний розрахунок)', Object.keys(cfg.prices).flatMap((c) =>
  Object.keys(cfg.prices[c]).map((m) => [cls[c] + ' — ' + mats[m], 'грн/кг', fmt(cfg.prices[c][m], 2)])));
f1 += list('3. Роботи при ремонті шнека', [
  ['Демонтаж старої спіралі, D ≥ 300', 'грн/м', fmt(repair.rates.disassembly_300, 2)],
  ['Демонтаж старої спіралі, D ≥ 150', 'грн/м', fmt(repair.rates.disassembly_150, 2)],
  ['Демонтаж старої спіралі, D < 150', 'грн/м', fmt(repair.rates.disassembly_small, 2)],
  ['Монтаж нової спіралі (за 1 м на 1 мм D)', 'грн', fmt(repair.rates.assembly, 2)],
  ['Балансування шнека', 'грн/м', fmt(repair.rates.balancing, 2)],
  ['Грунтування', 'грн/м²', fmt(repair.rates.priming, 2)]
]);
f1 += list('4. Коефіцієнти (вписати нове значення, якщо змінюється)', [
  ['Спіраль: роздріб (× ціна штрипса)', '×', fmt(repair.spiral_coef, 2)],
  ['Спіраль: опт', '×', fmt(repair.spiral_coef_wholesale, 2)],
  ['Запас на спіраль', '×', fmt(repair.spiral_overhead, 2)],
  ['Нова труба при ремонті (× ціна труби)', '×', fmt(repair.tube_coef, 2)],
  ['Кінцевий коефіцієнт ремонту (8 487 → 9 336)', '×', fmt(1 + repair.pricing.markup_pct / 100, 2)],
  ['Сегмент: s = 2 мм / s = 3 мм / інші', '×', [repair.segment.coef_s2, repair.segment.coef_s3, repair.segment.coef_default].join(' / ')],
  ['Виготовлення транспортера (× метал)', '×', fmt(cfg.k_fab, 2)],
  ['Покупні вузли (× ціна закупівлі)', '×', fmt(cfg.k_buy, 2)]
], { vat: false });

const secCols = [['casing_2m', 'Кожух, секція 2 м'], ['shaft_2m', 'Трубовал, секція 2 м'], ['spiral_2m', 'Спіраль, секція 2 м'], ['hanger', 'Підвіс, шт'],
  ['end_plate', 'Торцева плита з підшипн., шт'], ['drive_gear', 'Привідна секція під МР'], ['drive_motor', 'Привідна секція ремінна'], ['nozzles', 'Патрубки, компл.']];
const secRows = (type) => sections.items.black[type].map((it) => [(type === 'tube' ? 'Труба Ø' : 'Жолоб ') + it.size, secCols.map((c) => fmt(it[c[0]] * cfg.vat, 0))]);
f1 += '<div class="pb"></div>' + grid('5. Шнековий транспортер — вузли «За секціями», труба (чорна сталь)', secCols.map((c) => c[1]), secRows('tube'),
  { first: 'Типорозмір', note: '«Зараз» — з ПДВ, з детального розрахунку CRM. Для нержавійки — окремо, якщо відрізняється.' });
f1 += grid('6. Шнековий транспортер — вузли «За секціями», жолоб (чорна сталь)', secCols.map((c) => c[1]), secRows('trough'), { first: 'Типорозмір' });

f1 += grid('7. Підставка за діаметром', ['Пара опор (ніжки), шт', 'Підставка комплект, до 6 м', 'Підставка комплект, 6–12 м'],
  tubeSizes.map((s) => ['Труба Ø' + s, [fmt(standPair('tube', s), 0), fmt(s < sc.coef.small_limit ? sc.coef.stand_small : sc.coef.stand_large, 0), '']])
    .concat(troughSizes.map((s) => ['Жолоб ' + s, [fmt(standPair('trough', s), 0), '', '']])),
  { first: 'Типорозмір', note: '«Пара опор» — з детального розрахунку (з ПДВ); «до 6 м» — простий прайс (Ø<160 / Ø≥160).' });

const vols = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5];
f1 += list('8. Бункери за об\'ємом', vols.map((v) => ['Приймальний бункер ' + (v < 1 ? v * 1000 + ' л' : v + ' м³') + ' з опорами', 'шт', fmt(hopperCost(v), 0)]),
  { note: '«Зараз» — з детального розрахунку (з ПДВ). Простий прайс: ' + sc.coef.hopper_small + ' грн (Ø<160) / ' + sc.coef.hopper_large + ' грн (Ø≥160).' });
f1 += list('9. Покупні вузли', Object.keys(cfg.buy).map((k) => [k, 'шт', fmt(cfg.buy[k].price, 2), cfg.buy[k].src || '']));
f1 += grid('10. Простий прайс шнекового транспортера (як стара сторінка)', ['Кінцеві вузли', 'За 1 м', 'Бункер', 'Підставка', 'Крот'],
  sc.diameters.map((d) => ['Ø' + d.d, [fmt(d.base, 0), fmt(d.per_m, 0), fmt(d.d < sc.coef.small_limit ? sc.coef.hopper_small : sc.coef.hopper_large, 0),
    fmt(d.d < sc.coef.small_limit ? sc.coef.stand_small : sc.coef.stand_large, 0), '']]), { first: 'Діаметр' });
const motorTable = (n) => grid(n + '. Мотор-редуктори і двигуни за потужністю', ['Об/хв на виході', 'Модель / габарит', 'Мотор-редуктор, грн', 'Двигун (ремінний), грн'],
  gm.items.map((x) => [x.kw + ' кВт', ['', '', x.price ? fmt(x.price, 0) : '', '']]), { first: 'Потужність', note: 'Зараз ціни не задані — привід не входить у суму калькулятора.' });
f1 += motorTable(11);

// ================= Форма 2: норія і ТШ =================
let f2 = '';
const nCols = [['boot', 'Башмак (натяжна секція), шт'], ['head', 'Голова привідна, шт'], ['shaft_per_m', 'Шахта (секції), за 1 м'], ['belt_per_m', 'Стрічка, за 1 м'],
  ['bucket', 'Ківш, шт'], ['bucket_hardware', 'Метизи на 1 ківш'], ['buckets_per_m', 'Ковшів на 1 м стрічки']];
f2 += grid('1. Норія — вузли', nCols.map((c) => c[1]), noria.models.map((m) => [m.capacity + ' т/год', nCols.map((c) => m[c[0]] ? fmt(m[c[0]], c[0] === 'buckets_per_m' ? 1 : 0) : '')]).concat(
  [[5, '5 т/год'], [150, '150 т/год'], [200, '200 т/год']].map((x) => [x[1], nCols.map(() => '')])),
  { first: 'Продуктивність', note: 'Зараз ціни вузлів норії не задані (0). Довідково з вкладки НКЗ: стрічка 125/150/175/300 мм, барабан 300/300/500/500, ківш 110/125/160/260 для 5/10/25/50 т/год.' });
f2 += list('2. Норія — додаткові позиції', [
  ['Секція шахти 1 м (ревізійна)', 'шт', ''], ['Секція шахти 2 м', 'шт', ''], ['Натяжний пристрій', 'шт', ''], ['Стрічка: ширина ____ мм, шари ____', 'м', ''],
  ['Болт норійний М8', 'кг', '195'], ['Болт норійний М10', 'кг', '195'], ['Гайка', 'кг', '195'], ['Шайба норійна', 'кг', '240'], ['Шайба посилена', 'кг', '195'],
  ['Монтаж норії', 'грн/м', ''], ['Фарбування', 'грн/м²', '']
], { note: 'Ціни метизів — з вкладки НКЗ.' });
f2 += grid('3. Норія — відділити привід від ціни (паперовий прайс)', ['Висота, м', 'Ціна в прайсі', 'кВт', 'Ціна без приводу'],
  ['10', '25', '50', '100'].map((c) => { const r = noria.price_list[c][Math.floor(noria.price_list[c].length / 2)]; return [c + ' т/год', [fmt(r.h, 2), fmt(r.price, 0), fmt(r.kw, 1), '']]; }),
  { first: 'Продуктивність', note: 'Приклад середнього рядка кожного прайсу. Що означає «кт» у вкладці «НКЗ Price»? ________________________________' });

f2 += '<div class="pb"></div>' + grid('4. Скребковий транспортер ТШ', ['Секція привідна, шт', 'Секція натяжна, шт', 'Короб з ланцюгом, за 1 м', 'Футування, за 1 м', 'Розподільник, за 1 м'],
  tsh.variants.map((v) => [v.model + ' · ' + v.chain, [fmt(v.drive, 0), fmt(v.tension, 0), fmt(v.per_m, 0), fmt(v.liner, 0), fmt(v.distrib, 0)]]),
  { first: 'Модель · ланцюг', note: '«Зараз» — вкладка ТШ (з ПДВ). У вкладці «НКЗ Price» інші ціни за 1 м (ТС-50 зварний 7 200 / 8 400 / 12 000) — яка таблиця актуальна? ☐ ТШ ☐ НКЗ Price' });
f2 += grid('5. ТШ — потужність мотор-редуктора за довжиною', ['до 10 м', 'до 20 м', 'до 30 м', 'до 40 м', 'до 50 м', 'до 60 м'],
  ['ТШ 25', 'ТШ 50', 'ТШ 100', 'ТШ 200'].map((m) => [m, ['', '', '', '', '', '']]), { first: 'Модель', vat: false, note: 'Вписати кВт. Зараз таблиці немає — привід ТШ обирається вручну.' });
f2 += motorTable(6);
f2 += list('7. Спіраль цільнотягнута — ціна за 1 м (контроль)', [
  ['D159 × d60, крок 159, s=4 (ст.3), роздріб', 'грн/м', ''], ['D200 × d60, крок 200, s=4 (ст.3), роздріб', 'грн/м', ''],
  ['D250 × d76, крок 250, s=5 (ст.3), роздріб', 'грн/м', ''], ['Коефіцієнт роздріб / опт', '×', spiral.coef_retail + ' / ' + spiral.coef_wholesale]
], { note: 'Для звірки з калькулятором спіралі.' });

const today = new Date().toLocaleDateString('uk-UA');
const forms = [
  ['Ціни для калькуляторів — шнекові.pdf', page('Ціни для калькуляторів: шнекове обладнання', 'Ремонт шнека · шнековий транспортер · спіраль. Сформовано ' + today + ' з calc/data/*.json. Впишіть ручкою нову ціну там, де вона змінилась.', f1)],
  ['Ціни для калькуляторів — норія і ТШ.pdf', page('Ціни для калькуляторів: норія і скребковий транспортер', 'Норія ковшова · ТШ · мотор-редуктори. Сформовано ' + today + '. Впишіть ручкою ціни; порожні клітинки — даних у калькуляторі ще немає.', f2)]
];

(async () => {
  const { chromium } = require('playwright');
  const outDir = path.join(root, 'forms');
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [name, html] of forms) {
    fs.writeFileSync(path.join(outDir, name.replace('.pdf', '.html')), html);
    await p.setContent(html, { waitUntil: 'load' });
    await p.pdf({ path: path.join(outDir, name), format: 'A4', printBackground: true, displayHeaderFooter: true,
      headerTemplate: '<span></span>', footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;">' + name.replace('.pdf', '') + ' · стор. <span class="pageNumber"></span> з <span class="totalPages"></span></div>',
      margin: { top: '12mm', bottom: '14mm', left: '11mm', right: '11mm' } });
    console.log('ok', name);
  }
  await b.close();
})();
