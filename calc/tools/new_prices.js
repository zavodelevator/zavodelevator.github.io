// Накладає патч {items: {id: {value, note}}} на найсвіжіший файл цін і записує новий prices_<зараз>.json.
//   TZ=Europe/Kyiv node calc/tools/new_prices.js calc calc/tools/proposals_2026-11-24.json "Опис змін"
const fs = require('fs');
const path = require('path');
const root = path.resolve(process.argv[2] || 'calc');
const patch = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')).items;
const dir = path.join(root, 'prices');
const files = fs.readdirSync(dir).filter((f) => /^prices_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.json$/.test(f)).sort();
const base = files[files.length - 1];
const data = JSON.parse(fs.readFileSync(path.join(dir, base), 'utf8'));
const byId = Object.fromEntries(data.items.map((it) => [it.id, it]));
const changes = [], missing = [];
for (const [id, p] of Object.entries(patch)) {
  const it = byId[id];
  if (!it) { missing.push(id); continue; }
  if (p.value !== undefined && p.value !== it.value) changes.push({ id, label: it.group + ' · ' + (it.sub ? it.sub + ' · ' : '') + it.label, from: it.value, to: p.value });
  if (p.value !== undefined) it.value = p.value;
  if (p.note) it.note = p.note;
}
if (missing.length) { console.error('Невідомі id:', missing.join(', ')); process.exit(1); }
const d = new Date(), pad = (x) => String(x).padStart(2, '0');
const stamp = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + '_' + pad(d.getHours()) + '-' + pad(d.getMinutes());
const name = 'prices_' + stamp + '.json';
if (name === base) { console.error('Файл з таким часом уже є — зачекайте хвилину'); process.exit(1); }
data.created = stamp.replace('_', ' ').replace(/-(\d\d)$/, ':$1');
data.based_on = base;
data.note = process.argv[4] || ('Змінено позицій: ' + changes.length);
data.changes = changes;
fs.writeFileSync(path.join(dir, name), JSON.stringify(data, null, 1));
const all = fs.readdirSync(dir).filter((f) => /^prices_.*\.json$/.test(f)).sort();
fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ _note: 'Запасний список файлів (якщо GitHub API недоступний).', files: all }, null, 1));
console.log('ok', name, 'на основі', base, '· змінено', changes.length, '· приміток', Object.keys(patch).length);
