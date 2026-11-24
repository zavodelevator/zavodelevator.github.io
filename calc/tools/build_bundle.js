// Пакет даних для відкриття калькуляторів подвійним кліком (file://), де fetch не працює.
//   node calc/tools/build_bundle.js calc   → calc/js/data_bundle.js (усі data/*.json + найсвіжіший prices_*.json)
// На сервері/GitHub Pages сторінки читають самі JSON-файли; пакет — лише запасний варіант. Перезбирати після змін даних.
const fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || 'calc');
const data = {};
for (const f of fs.readdirSync(path.join(root, 'data')).filter((f) => f.endsWith('.json')))
  data[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf8'));
const files = fs.readdirSync(path.join(root, 'prices')).filter((f) => /^prices_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.json$/.test(f)).sort();
const pf = files[files.length - 1];
const prices = { file: pf, data: JSON.parse(fs.readFileSync(path.join(root, 'prices', pf), 'utf8')) };
fs.writeFileSync(path.join(root, 'js', 'data_bundle.js'), '// Згенеровано tools/build_bundle.js — не редагувати.\nwindow.CALC_BUNDLE = ' + JSON.stringify({ built: new Date().toISOString(), data, prices }) + ';\n');
console.log('ok data_bundle.js', Object.keys(data).length, 'файлів даних +', pf, (fs.statSync(path.join(root, 'js', 'data_bundle.js')).size / 1024).toFixed(0) + ' КБ');
