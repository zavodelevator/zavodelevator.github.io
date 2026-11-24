// Будує файл цін calc/prices/prices_YYYY-MM-DD_HH-MM.json з поточних calc/data/*.json.
//   TZ=Europe/Kyiv node calc/tools/build_prices.js calc
// Однакові позиції (той самий товар/коефіцієнт з тим самим значенням у кількох калькуляторах) зведено в одну з кількома paths.
const fs = require('fs');
const path = require('path');
const root = path.resolve(process.argv[2] || 'calc');
const J = (n) => JSON.parse(fs.readFileSync(path.join(root, 'data', n + '.json'), 'utf8'));
const metals = J('metals'), repair = J('repair'), spiral = J('spiral'), sc = J('screw_conveyor'), core = J('shnek_core'),
  sections = J('sections'), gm = J('gear_motors'), tsh = J('tsh'), belt = J('belt_conveyor'), noria = J('noria');
const ROOTS = { metals, repair, spiral, screw_conveyor: sc, shnek_core: core, sections, gear_motors: gm, tsh, belt_conveyor: belt, noria };
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), ROOTS);

const items = [];
function add(group, sub, id, label, unit, paths, used, note) {
  paths = [].concat(paths);
  const vals = paths.map((p) => get(null, p));
  if (vals.some((v) => v === undefined)) throw new Error('немає шляху: ' + paths.join(', '));
  if (new Set(vals.map(String)).size > 1) throw new Error('різні значення в групі ' + id + ': ' + vals.join(' / '));
  items.push({ id, group, sub: sub || '', label, unit, value: vals[0], paths, used: [].concat(used || []), note: note || '' });
}

// ---- Метал
const G1 = 'Метал, грн/кг';
add(G1, 'Штрипс для спіралі', 'metal.strip.st3', 'Сталь 3', 'грн/кг', ['metals.strip.price', 'metals.strip_grades.0.price'], ['Ремонт шнека', 'Спіраль', 'Склад спіралей'],
  'Склад спіралей бере цю ціну замість зашитих 65.');
add(G1, 'Штрипс для спіралі', 'metal.strip.09g2s', '09Г2С', 'грн/кг', 'metals.strip_grades.1.price', ['Ремонт шнека', 'Спіраль']);
add(G1, 'Штрипс для спіралі', 'metal.strip.tech', 'Нержавійка технічна', 'грн/кг', ['metals.strip_grades.2.price', 'shnek_core.prices.flight.tech'], ['Ремонт шнека', 'Спіраль', 'Шнековий (детальний)']);
add(G1, 'Штрипс для спіралі', 'metal.strip.food', 'Нержавійка AISI 304 (харчова)', 'грн/кг', ['metals.strip_grades.3.price', 'shnek_core.prices.flight.food'], ['Ремонт шнека', 'Спіраль', 'Шнековий (детальний)']);
add(G1, 'Штрипс для спіралі', 'metal.strip.black_conv', 'Чорна (спіраль транспортера)', 'грн/кг', 'shnek_core.prices.flight.black', ['Шнековий (детальний)'], 'Відрізняється від «Сталь 3» для ремонту (65).');
add(G1, 'Труба', 'metal.tube.repair', 'Труба вала — нова труба при ремонті', 'грн/кг', 'metals.tube.price', ['Ремонт шнека']);
const cls = { sheet: 'Лист', tube_body: 'Труба корпусу', shaft_tube: 'Труба вала (трубовал)', bar: 'Пруток (цапфи)' };
const mats = { black: 'чорна', tech: 'нерж. технічна', food: 'нерж. харчова' };
for (const c of Object.keys(cls)) for (const m of Object.keys(mats))
  add(G1, cls[c].split(' (')[0] === 'Лист' ? 'Лист' : (c === 'bar' ? 'Пруток' : 'Труба'), 'metal.' + c + '.' + m, cls[c] + ', ' + mats[m], 'грн/кг', 'shnek_core.prices.' + c + '.' + m, ['Шнековий (детальний, за секціями)']);
add(G1, 'Інше', 'metal.density', 'Питома вага сталі', 'г/мм³', ['repair.density', 'spiral.density'], ['Ремонт шнека', 'Спіраль']);

// ---- Коефіцієнти спіралі (однакові в ремонті, спіралі й детальному шнековому)
const G2 = 'Коефіцієнти спіралі';
add(G2, '', 'coef.spiral.retail', 'Роздріб (× ціна штрипса)', '×', ['repair.spiral_coef', 'spiral.coef_retail', 'shnek_core.spiral.coef_retail'], ['Ремонт шнека', 'Спіраль', 'Шнековий (детальний)']);
add(G2, '', 'coef.spiral.wholesale', 'Опт (× ціна штрипса)', '×', ['repair.spiral_coef_wholesale', 'spiral.coef_wholesale', 'shnek_core.spiral.coef_wholesale'], ['Ремонт шнека', 'Спіраль', 'Шнековий (детальний)']);
add(G2, '', 'coef.spiral.overhead', 'Запас матеріалу', '×', ['repair.spiral_overhead', 'spiral.overhead', 'shnek_core.spiral.allowance'], ['Ремонт шнека', 'Спіраль', 'Шнековий (детальний)']);
add(G2, '', 'coef.spiral.strip_len', 'Коеф. довжини штрипса', '×', ['repair.strip_length_factor', 'spiral.strip_length_factor'], ['Ремонт шнека', 'Спіраль']);
add(G2, '', 'coef.spiral.final', 'Кінцевий коефіцієнт ціни спіралі за метр', '×', 'spiral.final_coef', ['Спіраль']);
add(G2, 'Сегменти', 'coef.segment.s2', 'Сегмент, s = 2 мм', '×', ['repair.segment.coef_s2', 'spiral.segment.coef_s2', 'shnek_core.spiral.seg_coef.2'], ['Ремонт шнека', 'Спіраль', 'Шнековий (детальний)']);
add(G2, 'Сегменти', 'coef.segment.s3', 'Сегмент, s = 3 мм', '×', ['repair.segment.coef_s3', 'spiral.segment.coef_s3', 'shnek_core.spiral.seg_coef.3'], ['Ремонт шнека', 'Спіраль', 'Шнековий (детальний)']);
add(G2, 'Сегменти', 'coef.segment.other', 'Сегмент, інші s', '×', ['repair.segment.coef_default', 'spiral.segment.coef_default', 'shnek_core.spiral.seg_coef.default'], ['Ремонт шнека', 'Спіраль', 'Шнековий (детальний)']);

// ---- Ремонт шнека
const G3 = 'Ремонт шнека';
const rr = [['disassembly_300', 'Демонтаж старої спіралі, D ≥ 300', 'грн/м'], ['disassembly_150', 'Демонтаж старої спіралі, D ≥ 150', 'грн/м'],
  ['disassembly_small', 'Демонтаж старої спіралі, D < 150', 'грн/м'], ['assembly', 'Монтаж нової спіралі (за 1 м на 1 мм D)', 'грн'],
  ['balancing', 'Балансування шнека', 'грн/м'], ['priming', 'Грунтування', 'грн/м²']];
rr.forEach(([k, l, u]) => add(G3, 'Роботи', 'repair.' + k, l, u, 'repair.rates.' + k, ['Ремонт шнека']));
add(G3, 'Коефіцієнти', 'repair.tube_coef', 'Нова труба (× ціна труби)', '×', 'repair.tube_coef', ['Ремонт шнека']);
add(G3, 'Коефіцієнти', 'repair.tube_weight_k', 'Коеф. маси труби', '', 'repair.tube_weight_k', ['Ремонт шнека']);
add(G3, 'Коефіцієнти', 'repair.final_pct', 'Кінцевий коефіцієнт (8 487 → 9 336), %', '%', 'repair.pricing.markup_pct', ['Ремонт шнека']);

// ---- Шнековий — простий прайс
const G4 = 'Шнековий транспортер — простий прайс (з ПДВ)';
sc.diameters.forEach((d, i) => {
  add(G4, 'Ø' + d.d, 'screw.simple.' + d.d + '.base', 'Кінцеві вузли Ø' + d.d, 'грн', 'screw_conveyor.diameters.' + i + '.base', ['Шнековий (простий)']);
  add(G4, 'Ø' + d.d, 'screw.simple.' + d.d + '.per_m', 'За 1 м Ø' + d.d, 'грн/м', 'screw_conveyor.diameters.' + i + '.per_m', ['Шнековий (простий)']);
});
const cl = { pulleys_bearings: 'Шківи та підшипники', gear_base: 'База під мотор-редуктор', meter_coef: 'Коеф. метра', hopper_small: 'Бункер, Ø<160', hopper_large: 'Бункер, Ø≥160',
  stand_small: 'Підставка, Ø<160', stand_large: 'Підставка, Ø≥160', krot_coef: 'Крот (× за метр)', trough_coef: 'Жолоб', long_coef: 'L ≥ 10 м', overhead_coef: 'Коефіцієнт 1', markup_coef: 'Коефіцієнт 2' };
Object.keys(cl).forEach((k) => add(G4, 'Опції й коефіцієнти', 'screw.simple.' + k, cl[k], /coef/.test(k) ? '×' : 'грн', 'screw_conveyor.coef.' + k, ['Шнековий (простий)']));

// ---- Шнековий — детальний: покупні й коефіцієнти
const G5 = 'Шнековий транспортер — детальний';
Object.keys(core.buy).forEach((k) => add(G5, 'Покупні вузли (з 1С)', 'screw.buy.' + k, k, 'грн', 'shnek_core.buy.' + k + '.price', ['Шнековий (детальний, за секціями)'], core.buy[k].src || ''));
[['k_fab', 'Виготовлення (× метал)', '×'], ['k_buy', 'Покупні (× закупівля)', '×'], ['consumables', 'Витратні (частка від металу)', ''], ['vat', 'ПДВ', '×'], ['krot_coef', 'Крот', '×']]
  .forEach(([k, l, u]) => add(G5, 'Коефіцієнти', 'screw.core.' + k, l, u, 'shnek_core.' + k, ['Шнековий (детальний)']));

// ---- Шнековий — за секціями
const G6 = 'Шнековий транспортер — за секціями (без ПДВ)';
const secF = { casing_2m: 'Кожух, секція 2 м', shaft_2m: 'Трубовал, секція 2 м', spiral_2m: 'Спіраль, секція 2 м', hanger: 'Підвіс, шт', end_plate: 'Торцева плита з підшипником, шт',
  drive_gear: 'Привідна секція під МР', drive_motor: 'Привідна секція ремінна', nozzles: 'Патрубки, компл.', consum_pct: 'Витратні, %' };
const presetLbl = { black: 'чорна', ss_screw_black_body: 'нерж. шнек + чорний корпус', food_full: 'харчова нерж.', tech_full: 'технічна нерж.' };
Object.keys(sections.items).forEach((pr) => ['tube', 'trough'].forEach((t) => (sections.items[pr][t] || []).forEach((it, i) => Object.keys(secF).forEach((f) =>
  add(G6, (t === 'tube' ? 'Труба Ø' : 'Жолоб ') + it.size + ' · ' + (presetLbl[pr] || pr), 'screw.sec.' + pr + '.' + t + '.' + it.size + '.' + f, secF[f], f === 'consum_pct' ? '%' : 'грн',
    'sections.items.' + pr + '.' + t + '.' + i + '.' + f, ['Шнековий (за секціями)'])))));

// ---- Мотор-редуктори шнекового
gm.items.forEach((x, i) => add('Мотор-редуктори (шнековий транспортер), з ПДВ', '', 'gm.' + x.kw, x.kw + ' кВт', 'грн', 'gear_motors.items.' + i + '.price', ['Шнековий']));

// ---- ТШ
const G7 = 'Скребковий транспортер ТШ (з ПДВ)';
const tf = { drive_head: ['Приводна головка', 'грн/шт'], tension_head: ['Натяжна головка', 'грн/шт'], section_per_m: ['Секція короба, за 1 м', 'грн/м'],
  'chain.trd38_rubber': ['Ланцюг ТРД-38 + гумові шкребки, за 1 м', 'грн/м'], 'chain.trd38_plastic': ['Ланцюг ТРД-38 + пластикові шкребки, за 1 м', 'грн/м'],
  'chain.m81x_plastic': ['Ланцюг М-81х + пластикові шкребки, за 1 м', 'грн/м'], 'chain.m112_plastic': ['Ланцюг М-112 + пластикові шкребки, за 1 м', 'грн/м'],
  liner_pe500: ['Футування ПЕ-500, за 1 м', 'грн/м'], liner_pe1000: ['Футування ПЕ-1000, за 1 м', 'грн/м'], distrib: ['Розподільний механізм (завальна яма), за 1 м', 'грн/м'] };
tsh.models.forEach((m, i) => Object.keys(tf).forEach((f) => add(G7, m.model, 'tsh.' + m.model.replace(/\s/g, '') + '.' + f, tf[f][0], tf[f][1], 'tsh.models.' + i + '.' + f, ['ТШ'])));

// ---- Стрічковий
const G8 = 'Стрічковий транспортер (з ПДВ)';
const bf = { drive_station: ['Приводна станція', 'грн/шт'], tail_station: ['Натяжна станція', 'грн/шт'], frame_per_m: ['Став (рама), за 1 м', 'грн/м'],
  idler_trough: ['Роликоопора робоча жолобчаста (3 ролики)', 'грн/шт'], idler_flat: ['Роликоопора робоча пряма (1 ролик)', 'грн/шт'], idler_return: ['Роликоопора зворотна (нижня)', 'грн/шт'],
  belt_per_m: ['Стрічка, за 1 м', 'грн/м'], lagging: ['Футування приводного барабана', 'грн/шт'] };
belt.widths.forEach((w, i) => Object.keys(bf).forEach((f) => add(G8, 'Стрічка ' + w.width + ' мм', 'belt.' + w.width + '.' + f, bf[f][0], bf[f][1], 'belt_conveyor.widths.' + i + '.' + f, ['Стрічковий'])));
add(G8, 'Геометрія', 'belt.top_pitch', 'Крок верхніх роликоопор', 'м', 'belt_conveyor.top_pitch', ['Стрічковий']);
add(G8, 'Геометрія', 'belt.bottom_pitch', 'Крок нижніх роликоопор', 'м', 'belt_conveyor.bottom_pitch', ['Стрічковий']);

// ---- Норія: ручні ціни (решта — каталог НКЗ у Google-таблиці)
const G9 = 'Норія — ціни, яких немає в каталозі НКЗ (з ПДВ)';
const nf = { lagging: 'Футування привідного барабана', belt_oil_per_m: 'Стрічка маслостійка, за 1 м', sprocket: 'Зірочка (ланцюгова), шт', backstop: 'Муфта зворотного ходу (якщо немає в каталозі)',
  coupling: "З'єднувальна муфта (інша)", drum: 'Барабан (запчастина)', drum_chain: 'Барабан ланцюговий (запчастина)' };
noria.models.forEach((m, i) => Object.keys(nf).forEach((f) => add(G9, 'НКЗ-' + m.capacity, 'noria.' + m.capacity + '.' + f, nf[f], /per_m/.test(f) ? 'грн/м' : 'грн', 'noria.models.' + i + '.' + f, ['Норія'])));

// ---- Потужності
const G10 = 'Потужності мотор-редукторів, кВт';
tsh.models.forEach((m, i) => {
  m.kw_by_length.forEach((r, j) => add(G10, m.model + ' — звичайний', 'kw.tsh.' + m.model.replace(/\s/g, '') + '.L' + r.max_length, 'до ' + r.max_length + ' м', 'кВт', 'tsh.models.' + i + '.kw_by_length.' + j + '.kw', ['ТШ']));
  m.kw_pit.forEach((r, j) => add(G10, m.model + ' — завальна яма', 'kw.tsh.' + m.model.replace(/\s/g, '') + '.pit' + r.distrib_m, 'розподільник ' + r.distrib_m + ' м', 'кВт', 'tsh.models.' + i + '.kw_pit.' + j + '.kw', ['ТШ']));
});
belt.widths.forEach((w, i) => w.kw_by_length.forEach((r, j) => add(G10, 'Стрічка ' + w.width + ' мм', 'kw.belt.' + w.width + '.L' + r.max_length, 'до ' + r.max_length + ' м', 'кВт', 'belt_conveyor.widths.' + i + '.kw_by_length.' + j + '.kw', ['Стрічковий'])));

// ---- Націнки
const G11 = 'Націнка, %';
[['screw_conveyor', 'Шнековий транспортер'], ['tsh', 'ТШ'], ['belt_conveyor', 'Стрічковий'], ['noria', 'Норія'], ['spiral', 'Спіраль']]
  .forEach(([k, l]) => add(G11, '', 'markup.' + k, l, '%', k + '.pricing.markup_pct', [l]));

// ---- Запис
const d = new Date();
const pad = (x) => String(x).padStart(2, '0');
const name = 'prices_' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '_' + pad(d.getHours()) + '-' + pad(d.getMinutes()) + '.json';
const out = { version: 1, created: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()),
  note: 'Перший файл цін — згенеровано з calc/data/*.json. Ціни норії з каталогу НКЗ (голови, башмаки, шахти, ковші, стрічки) змінюються в Google-таблиці НКЗ.', items };
const dir = path.join(root, 'prices');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, name), JSON.stringify(out, null, 1));
const files = fs.readdirSync(dir).filter((f) => /^prices_.*\.json$/.test(f)).sort();
fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ _note: 'Запасний список файлів (якщо GitHub API недоступний). Додайте сюди нове ім\'я, якщо завантажуєте файл.', files }, null, 1));
console.log('ok', name, items.length, 'позицій');
