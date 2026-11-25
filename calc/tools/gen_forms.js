// Генерує дві PDF-форми для ручного заповнення цін: node calc/tools/gen_forms.js calc
// Потрібен Playwright (Chromium).
const path = require('path');
const fs = require('fs');
const root = path.resolve(process.argv[2] || 'calc');
const J = (n) => JSON.parse(fs.readFileSync(path.join(root, 'data', n + '.json'), 'utf8'));
const S = require(path.join(root, 'js', 'shnek_core.js'));
const cfg = J('shnek_core'), metals = J('metals'), repair = J('repair'), sc = J('screw_conveyor'), sections = J('sections'),
  gm = J('gear_motors'), noria = J('noria'), tsh = J('tsh'), spiral = J('spiral'), bc = J('belt_conveyor');

// Режим «заповнено»: FILL=1 node calc/tools/gen_forms.js calc → пропозиції з calc/forms/proposals.json
const FILL = process.env.FILL === '1';
const P = FILL ? JSON.parse(fs.readFileSync(path.join(root, 'forms', 'proposals.json'), 'utf8')) : {};
let CUR = '';
const secOf = (title) => (String(title).match(/^(\d+)\./) || [])[1] || '';
function prop(title, row, col) {
  const s = ((P[CUR] || {})[secOf(title)] || {})[row];
  return s ? s[col] : null;
}
function fillHtml(x) {
  if (!x) return '';
  return (x.v !== undefined && x.v !== '' ? '<div class="fill">' + esc(x.v) + '</div>' : '') +
    (x.src ? '<div class="fsrc">' + esc(x.src) + '</div>' : '') + (x.alt ? '<div class="alt">(' + esc(x.alt) + ')</div>' : '');
}
const fmt = (x, d = 0) => x === '' || x === null || x === undefined ? '' : Number(x).toLocaleString('uk-UA', { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const vatBox = '<span class="vat">ціни: ☐ з ПДВ &nbsp; ☐ без ПДВ</span>';

// таблиця «позиція — од. — зараз — нова ціна»
function list(title, rows, opts = {}) {
  return `<h2>${esc(title)}${opts.vat === false ? '' : vatBox}</h2>${opts.note ? `<p class="note">${esc(opts.note)}</p>` : ''}
  <table class="list"><thead><tr><th class="n">№</th><th>Позиція</th><th class="u">Од.</th><th class="cur">Зараз у калькуляторі</th><th class="new">Нова ціна</th></tr></thead><tbody>
  ${rows.map((r, i) => `<tr><td class="n">${i + 1}</td><td>${esc(r[0])}${r[3] ? `<div class="src">${esc(r[3])}</div>` : ''}</td><td class="u">${esc(r[1])}</td><td class="cur">${r[2]}</td><td class="new">${fillHtml(prop(title, r[0], 'v'))}</td></tr>`).join('')}
  </tbody></table>`;
}
// сітка «рядок × колонки»: у кожній клітинці дрібно поточне значення + місце для запису
function grid(title, colHeads, rows, opts = {}) {
  return `<h2>${esc(title)}${opts.vat === false ? '' : vatBox}</h2>${opts.note ? `<p class="note">${esc(opts.note)}</p>` : ''}
  <table class="grid"><thead><tr><th>${esc(opts.first || '')}</th>${colHeads.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
  ${rows.map((r) => `<tr><th>${esc(r[0])}</th>${r[1].map((v, j) => `<td><span class="was">${v === '' ? '' : 'зараз ' + v}</span>${fillHtml(prop(title, r[0], String(j)))}</td>`).join('')}</tr>`).join('')}
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
  .fill { font: 600 10.5pt 'Segoe Print', 'Comic Sans MS', cursive; color: #1a3d9e; line-height: 1.15; }
  .fsrc { font-size: 6.3pt; color: #1a3d9e; opacity: .8; }
  .alt { font-size: 6.8pt; color: #8a8a8a; font-style: italic; }
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
let f1 = ''; CUR = 'screw';
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
f1 += list('10. Спіраль цільнотягнута — ціна за 1 м (контроль)', [
  ['D159 × d60, крок 159, s=4 (ст.3), роздріб', 'грн/м', ''], ['D200 × d60, крок 200, s=4 (ст.3), роздріб', 'грн/м', ''],
  ['D250 × d76, крок 250, s=5 (ст.3), роздріб', 'грн/м', ''], ['Коефіцієнт роздріб / опт', '×', spiral.coef_retail + ' / ' + spiral.coef_wholesale]
], { note: 'Для звірки з калькулятором спіралі.' });
f1 += grid('11. Простий прайс шнекового транспортера (як стара сторінка)', ['Кінцеві вузли', 'За 1 м', 'Бункер', 'Підставка', 'Крот'],
  sc.diameters.map((d) => ['Ø' + d.d, [fmt(d.base, 0), fmt(d.per_m, 0), fmt(d.d < sc.coef.small_limit ? sc.coef.hopper_small : sc.coef.hopper_large, 0),
    fmt(d.d < sc.coef.small_limit ? sc.coef.stand_small : sc.coef.stand_large, 0), '']]), { first: 'Діаметр' });
const motorTable = (n) => grid(n + '. Мотор-редуктори і двигуни за потужністю', ['Об/хв на виході', 'Модель / габарит', 'Мотор-редуктор, грн', 'Двигун (ремінний), грн'],
  gm.items.map((x) => [x.kw + ' кВт', ['', '', x.price ? fmt(x.price, 0) : '', '']]), { first: 'Потужність', note: 'Зараз ціни не задані — привід не входить у суму калькулятора.' });

// ================= Форма 3: норія =================
const nc = J('noria_catalog');
let f3 = ''; CUR = 'noria';
const caps = noria.models.map((m) => m.capacity);
const manRow = (cols) => noria.models.map((m) => ['НКЗ-' + m.capacity, cols.map((c) => (c[2] && !c[2].includes(m.capacity)) ? '—' : (m[c[0]] ? fmt(m[c[0]], 0) : ''))]);
f3 += grid('1. Ціни, яких немає в каталозі НКЗ', ['Футування привідного барабана', 'Стрічка маслостійка, за 1 м', 'Стрічка термостійка, за 1 м', 'Зірочка НКЗ (своя для кожної норії), шт', 'Муфта зворотного ходу', "З'єднувальна муфта"],
  manRow([['lagging'], ['belt_oil_per_m'], ['belt_heat_per_m'], ['sprocket', 0, [5, 10, 25, 50]], ['backstop'], ['coupling']]),
  { first: 'Норія', note: 'Зірочки — лише ланцюгові: НКЗ-5/10 на одному ланцюгу ТРД-38, НКЗ-25/50 на двох. Муфта зворотного ходу в каталозі є лише для НКЗ-100/200 (GV 60, ' + fmt(nc.backstops[0] ? nc.backstops[0].price : 0, 0) + ' грн).' });
f3 += grid('2. Барабани (запчастини, довідково)', ['Барабан стрічковий', 'Барабан ланцюговий'],
  noria.models.map((m) => ['НКЗ-' + m.capacity, [m.drum ? fmt(m.drum, 0) : '', [5, 10, 25, 50].includes(m.capacity) ? (m.drum_chain ? fmt(m.drum_chain, 0) : '') : '—']]),
  { first: 'Норія', note: 'Голова й башмак «в зборі» в каталозі вже з барабанами — ці ціни для окремого продажу.' });
f3 += '<div class="pb"></div>' + grid('3. Каталог НКЗ — перевірте ціни вузлів', ['Голова в зборі', 'Башмак в зборі', 'Шахта 1 м (за 1 мм)', 'Оглядова 1 м (за 1 мм)', 'Рамка (за 1 мм)', 'Товщина, мм'],
  nc.models.map((m) => ['НКЗ-' + m.capacity, [fmt(m.head, 0), fmt(m.boot, 0), fmt(m.shaft_1m, 0), fmt(m.shaft_rev, 0), fmt(m.frame, 0), m.thickness.join(' / ')]]),
  { first: 'Норія', note: 'Синхронізовано з таблиці НКЗ ' + nc.synced + '. Правки вносьте в таблицю НКЗ (тоді оновиться і CRM).' });
f3 += list('4. Ковші (каталог НКЗ)', nc.buckets.map((b) => [b.name + ' — для НКЗ-' + b.caps.join('/'), 'шт', fmt(b.price, 2), b.volume_l + ' л, ' + b.bolts + ' гвинти ' + b.bolt])
  .concat([['Ківш металевий для НКЗ-100', 'шт', ''], ['Ківш металевий для НКЗ-175', 'шт', ''], ['Ківш металевий для НКЗ-200', 'шт', ''], ['Ківш поліетиленовий для НКЗ-5', 'шт', '']]),
  { note: 'Ковшів на 1 м: стрічкові 5 (НКЗ-100 — 6, НКЗ-200 — 4,5), ланцюгові 6,6.' });
f3 += list('5. Стрічки і ланцюги (каталог НКЗ)', nc.belts.map((b) => [b.name + (b.caps.length ? ' — НКЗ-' + b.caps.join('/') : ''), 'грн/м', fmt(b.price, 2)])
  .concat(nc.chains.map((c) => [c.name + (c.caps.length ? ' — НКЗ-' + c.caps.join('/') : ''), 'грн/м', fmt(c.price, 2)])));
f3 += list('6. Муфти, датчики, метизи (каталог НКЗ)', nc.couplings.concat(nc.backstops, nc.sensors).map((x) => [x.name + (x.caps.length ? ' — НКЗ-' + x.caps.join('/') : ''), 'шт', fmt(x.price, 2)])
  .concat(Object.keys(nc.metiz).map((k) => [{ bolt_M8: 'Гвинт М8 норійний', bolt_M10: 'Гвинт М10 норійний', nut_M8: 'Гайка М8', nut_M10: 'Гайка М10', washer: 'Шайба норійна' }[k], 'грн/кг', fmt(nc.metiz[k].price_kg, 2)])));
f3 += grid('7. Геометрія — перевірте', ['Висота головки + башмака, м', 'Ковшів на 1 м стрічки', 'Ковшів на 1 м ланцюга'],
  noria.models.map((m) => { const c = nc.models.find((x) => x.capacity === m.capacity) || {}; return ['НКЗ-' + m.capacity, [fmt(m.base_h, 3), fmt(c.buckets_per_m, 1), [5, 10, 25, 50].includes(m.capacity) ? '6,6' : '—']]; }),
  { first: 'Норія', vat: false });

// ================= Форма 2: скребковий транспортер ТШ =================
let f2 = ''; CUR = 'tsh';
const tm = tsh.models;
f2 += grid('1. Головки і секції', ['Приводна головка, шт', 'Натяжна головка, шт', 'Секція короба, за 1 м'],
  tm.map((m) => [m.model, [fmt(m.drive_head, 0), fmt(m.tension_head, 0), m.section_per_m ? fmt(m.section_per_m, 0) : '']]),
  { first: 'Модель', note: 'Головки — зараз з вкладки ТШ. Секція: довжина секцій = L − 1,5 м (дві головки). Яка довжина однієї секції, м? ______' });
f2 += grid('2. Ланцюг разом зі шкребками, за 1 м', tsh.chains.map((c) => c.label), tm.map((m) => [m.model, tsh.chains.map((c) => m.chain[c.key] ? fmt(m.chain[c.key], 0) : '')]),
  { first: 'Модель', note: 'Довжина ланцюга = 2·L + 1 м (петля). ТРД-38 — з гумовими або пластиковими шкребками; М-ланцюги — лише з пластиковими. Якщо модель не буває з цим ланцюгом — поставте «—».' });
f2 += grid('3. Футування короба і розподільник, за 1 м', ['Пластик ПЕ-500', 'Пластик ПЕ-1000', 'Розподільний механізм'],
  tm.map((m) => [m.model, [m.liner_pe500 ? fmt(m.liner_pe500, 0) : '', m.liner_pe1000 ? fmt(m.liner_pe1000, 0) : '', fmt(m.distrib, 0)]]),
  { first: 'Модель', note: 'ПЕ-500 «зараз» — стовпчик «футування» з вкладки ТШ (тип пластику там не вказано). Розподільний механізм ставиться, коли транспортер працює в завальній ямі; довжина від 1 до 10 м.' });
f2 += list('4. Довідково', [
  ['Стара таблиця ТШ: «за м/пог» (короб + ланцюг разом) — більше не використовується', '', ''],
  ['Інші вузли ТШ, яких немає в калькуляторі', '', '']
], { vat: false });

// ================= Форма 4: потужності мотор-редукторів =================
let f4 = ''; CUR = 'power';
const lens = ['до 10 м', 'до 20 м', 'до 30 м', 'до 40 м', 'до 50 м', 'до 60 м'];
f4 += grid('1. Скребкові ТШ — звичайний транспортер, кВт', lens, tsh.models.map((m) => [m.model, m.kw_by_length.map((r) => r.kw ? fmt(r.kw, 1) : '')]),
  { first: 'Модель', vat: false, note: 'Потужність мотор-редуктора за довжиною транспортера.' });
f4 += grid('2. Скребкові ТШ — у завальній ямі (з розподільним механізмом), кВт', Array.from({ length: 10 }, (_, i) => (i + 1) + ' м'),
  tsh.models.map((m) => [m.model, m.kw_pit.map((r) => r.kw ? fmt(r.kw, 1) : '')]),
  { first: 'Модель', vat: false, note: 'Колонки — довжина розподільного механізму від 1 до 10 м.' });
f4 += grid('3. Скребкові ТШ — оберти і тип редуктора', ['Оберти на виході, об/хв', 'Тип редуктора', 'Габарит', 'Примітка'],
  tsh.models.map((m) => [m.model, ['', '', '', '']]), { first: 'Модель', vat: false });
f4 += '<div class="pb"></div>' + grid('4. Стрічкові транспортери — потужність за довжиною, кВт', lens,
  bc.widths.map((w) => ['Стрічка ' + w.width + ' мм', w.kw_by_length.map((r) => r.kw ? fmt(r.kw, 1) : '')]),
  { first: 'Стрічка', vat: false, note: 'Довідково з «НКЗ Price»: ТС-40, ТС-60, ТС-80, ТС-100 (жолобоподібні), ТК-200 (стрічка 600×3) — вкажіть ширину стрічки кожного: ___________' });
f4 += grid('5. Стрічкові транспортери — оберти, швидкість, тип редуктора', ['Діаметр приводного барабана, мм', 'Швидкість стрічки, м/с', 'Оберти на виході, об/хв', 'Тип / габарит редуктора'],
  bc.widths.map((w) => ['Стрічка ' + w.width + ' мм', ['', '', '', '']]), { first: 'Стрічка', vat: false,
  note: 'Довідково з вкладки «Прод Шт»: барабан 300 мм — 0,2 м/с → 13 об/хв, 1,1 м/с → 72 об/хв.' });

// ================= Форма 5: стрічковий транспортер =================
let f5 = ''; CUR = 'belt';
const bw = bc.widths;
const bcell = (v) => v ? fmt(v, 0) : '';
f5 += grid('1. Станції і став', ['Приводна станція (барабан, рама), шт', 'Натяжна станція (барабан, натяжний пристрій), шт', 'Став (рама), за 1 м', 'Футування приводного барабана, шт'],
  bw.map((w) => ['Стрічка ' + w.width + ' мм', [bcell(w.drive_station), bcell(w.tail_station), bcell(w.frame_per_m), bcell(w.lagging)]]),
  { first: 'Ширина', note: 'Став = L − ' + bc.stations_length + ' м (дві станції). L — між осями барабанів.' });
f5 += grid('2. Роликоопори і стрічка', ['Роликоопора робоча жолобчаста (3 ролики), шт', 'Роликоопора робоча пряма (1 ролик), шт', 'Роликоопора зворотна (нижня), шт', 'Стрічка, за 1 м'],
  bw.map((w) => ['Стрічка ' + w.width + ' мм', [bcell(w.idler_trough), bcell(w.idler_flat), bcell(w.idler_return), bcell(w.belt_per_m)]]),
  { first: 'Ширина', note: 'Стрічка 400 і 600 мм «зараз» — каталог НКЗ (БКНЛ). Довжина стрічки = 2·L + ' + bc.belt_extra_m + ' м.' });
f5 += grid('3. Відстань між роликоопорами, м', ['Верхні (робочі)', 'Нижні (зворотні)', 'Діаметр ролика, мм', 'Тип стрічки / кількість прокладок'],
  bw.map((w) => ['Стрічка ' + w.width + ' мм', [fmt(bc.top_pitch, 1), fmt(bc.bottom_pitch, 1), '', '']]),
  { first: 'Ширина', vat: false, note: 'Зараз однаково для всіх ширин: верхні ' + fmt(bc.top_pitch, 1) + ' м, нижні ' + fmt(bc.bottom_pitch, 1) + ' м. Впишіть, якщо для ширини інакше.' });
f5 += list('4. Довідково', [['Інші вузли стрічкового транспортера (завантажувальна воронка, скребок очищення, кожух), яких немає в калькуляторі', '', ''],
  ['Потужність мотор-редуктора — у формі «Потужності мотор-редукторів», розділ 4', '', '']], { vat: false });

const today = new Date().toLocaleDateString('uk-UA');
const forms = [
  ['Ціни для калькуляторів — шнекові.pdf', page('Ціни для калькуляторів: шнекове обладнання', 'Ремонт шнека · шнековий транспортер · спіраль. Сформовано ' + today + ' з calc/data/*.json. Впишіть ручкою нову ціну там, де вона змінилась.', f1)],
  ['Ціни для калькулятора ТШ.pdf', page('Ціни для калькулятора скребкового транспортера ТШ', 'ТШ 25 / 50 / 100 / 200: головки, секції, ланцюг зі шкребками, футування ПЕ-500 / ПЕ-1000, розподільник. Сформовано ' + today + '. Впишіть ручкою ціни.', f2)],
  ['Ціни для калькулятора стрічкового транспортера.pdf', page('Ціни для калькулятора стрічкового транспортера', 'Стрічка 400 / 500 / 600 / 800 мм: станції, став, роликоопори, стрічка, футування барабана. Сформовано ' + today + '. Впишіть ручкою ціни.', f5)],
  ['Потужності мотор-редукторів.pdf', page('Потужності мотор-редукторів: скребкові й стрічкові транспортери', 'Впишіть потужність, кВт. Скребкові — звичайні за довжиною і в завальній ямі (розподільник 1–10 м). Сформовано ' + today + '.', f4)],
  ['Ціни для калькулятора норії.pdf', page('Ціни для калькулятора норії', 'Розділи 1–2 — заповнити (цін немає в каталозі). Розділи 3–7 — ціни з каталогу НКЗ, перевірити й виправити. Сформовано ' + today + '.', f3)]
];

(async () => {
  const { chromium } = require('playwright');
  const outDir = path.join(root, 'forms');
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [name0, html0] of forms) {
    const name = FILL ? name0.replace('.pdf', ' (заповнено).pdf') : name0;
    const html = FILL ? html0.replace('<p class="sub">', '<p class="sub"><b style="color:#1a3d9e">Пропозиція: синім — ціна з ваших джерел (або інтернету, якщо своїх немає), під нею джерело; сірим у дужках — порада.</b><br>') : html0;
    fs.writeFileSync(path.join(outDir, name.replace('.pdf', '.html')), html);
    await p.setContent(html, { waitUntil: 'load' });
    await p.pdf({ path: path.join(outDir, name), format: 'A4', printBackground: true, displayHeaderFooter: true,
      headerTemplate: '<span></span>', footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;">' + name.replace('.pdf', '') + ' · стор. <span class="pageNumber"></span> з <span class="totalPages"></span></div>',
      margin: { top: '12mm', bottom: '14mm', left: '11mm', right: '11mm' } });
    console.log('ok', name);
  }
  await b.close();
})();
