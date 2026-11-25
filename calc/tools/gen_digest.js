// Зведення всіх цін і коефіцієнтів одним компактним файлом (2 колонки А4).
// node calc/tools/gen_digest.js  → calc/forms/Ціни і коефіцієнти — зведення.{html,pdf}
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const FILE = fs.readdirSync(path.join(root, 'prices')).filter((f) => /^prices_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}\.json$/.test(f)).sort().pop();
const PR = JSON.parse(fs.readFileSync(path.join(root, 'prices', FILE), 'utf8'));
const stamp = FILE.replace(/^prices_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})\.json$/, '$3.$2.$1 $4:$5');

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MAT = { food_screw_tech_body: 'харч. шнек + техн. корпус', 'нерж. шнек + чорний корпус': 'нерж. шнек + чорний корпус' };
const num = (v) => {
  if (v === 0 || v == null || v === '') return '—';
  const [i, d] = String(Math.round(v * 100000) / 100000).split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (d ? ',' + d : '');
};
const cell = (it) => `<td class="v${it.ai ? ' ai' : ''}${!it.value ? ' z' : ''}">${num(it.value)}</td>`;
const shortUnit = (u) => (u === '×' || !u ? '' : u);

// групи в порядку появи
const groups = [];
const byG = {};
for (const it of PR.items) {
  if (!byG[it.group]) { byG[it.group] = []; groups.push(it.group); }
  byG[it.group].push(it);
}

function unitsOf(items) {
  const us = [...new Set(items.map((i) => shortUnit(i.unit)))].filter(Boolean);
  return us.length === 1 ? us[0] : '';
}

const norm = (label, sub) => {
  let l = label.replace(/^розподільник /, '');
  const tok = (sub.match(/(Ø\d+|НКЗ-\d+)/) || [])[1];
  if (tok) l = l.split(' ' + tok).join('').split(tok + ' ').join('');
  return l.replace(/\s+/g, ' ').trim();
};

// звичайна група: кластеризуємо підгрупи з однаковим набором назв → матриця
function renderGroup(g, items) {
  const subs = [];
  const bySub = {};
  for (const it of items) { const s = it.sub || ''; if (!bySub[s]) { bySub[s] = []; subs.push(s); } bySub[s].push(it); }
  const clusters = [];
  for (const s of subs) {
    const key = bySub[s].map((i) => norm(i.label, s)).join('|');
    let c = clusters.find((x) => x.key === key);
    if (!c) { c = { key, subs: [] }; clusters.push(c); }
    c.subs.push(s);
  }
    let html = '';
  for (const c of clusters) {
    if (c.subs.length > 1) {
      const cu = unitsOf(c.subs.flatMap((s) => bySub[s]));
      const mu = !cu;
      const rows = bySub[c.subs[0]].map((x, r) => {
        const cells = c.subs.map((s) => cell(bySub[s][r])).join('');
        const u = unitsOf(c.subs.map((s) => bySub[s][r]));
        return `<tr><td class="l">${esc(norm(x.label, c.subs[0]))}</td>${cells}${mu ? `<td class="un">${esc(u)}</td>` : ''}</tr>`;
      }).join('');
      const wide = c.subs.length > 4;
      const heads = c.subs.map((s) => `<th>${esc(s.replace(/^Стрічка /, '').replace(/^ТШ /, 'ТШ-').replace(/ — звичайний$/, '').replace(/ — завальна яма \(доплата до основної\)$/, ' яма +').replace(/^НКЗ-/, '').replace(/^Ø/, 'Ø'))}</th>`).join('');
      html += `<div class="blk${wide ? ' wide' : ''}"><h3>${esc(g)}${cu ? ` <span class="u">${esc(cu)}</span>` : ''}</h3><table class="m"><thead><tr><th></th>${heads}${mu ? '<th></th>' : ''}</tr></thead><tbody>${rows}</tbody></table></div>`;
    } else {
      for (const s of c.subs) {
        const rows = bySub[s].map((x) => `<tr><td class="l">${esc(x.label)}</td>${cell(x)}<td class="un">${esc(shortUnit(x.unit))}</td></tr>`).join('');
        html += `<div class="blk"><h3>${esc(g)}${s ? ` · <span class="s">${esc(s)}</span>` : ''}</h3><table><tbody>${rows}</tbody></table></div>`;
      }
    }
  }
  return html;
}

// шнекові секції: по матеріалу таблиця «розмір × вузол»
function renderSections(g, items) {
  const mats = [];
  const t = {};
  let labels = [];
  for (const it of items) {
    const [size, mat] = it.sub.split(' · ');
    if (!t[mat]) { t[mat] = { sizes: [], rows: {} }; mats.push(mat); }
    if (!t[mat].rows[size]) { t[mat].rows[size] = []; t[mat].sizes.push(size); }
    t[mat].rows[size].push(it);
    if (!labels.includes(it.label)) labels.push(it.label);
  }
  const SH = { 'Кожух, секція 2 м': 'Кожух 2 м', 'Трубовал, секція 2 м': 'Вал 2 м', 'Спіраль, секція 2 м': 'Спіраль 2 м', 'Підвіс, шт': 'Підвіс', 'Торцева плита з підшипником, шт': 'Торц. плита', 'Привідна секція під МР': 'Привід МР', 'Привідна секція ремінна': 'Привід рем.', 'Патрубки, компл.': 'Патрубки', 'Витратні, %': 'Витр. %' };
  const head = `<thead><tr><th></th>${labels.map((l) => `<th>${esc(SH[l] || l)}</th>`).join('')}</tr></thead>`;
  return mats.map((m) => {
    const rows = t[m].sizes.map((s) => `<tr><td class="l">${esc(s.replace('Труба ', '').replace('Жолоб ', 'Ж '))}</td>${labels.map((l) => { const it = t[m].rows[s].find((x) => x.label === l); return it ? cell(it) : '<td></td>'; }).join('')}</tr>`).join('');
    return `<div class="blk wide"><h3>${esc(g)} · <span class="s">${esc(MAT[m] || m)}</span> <span class="u">грн, Ø — труба, Ж — жолоб</span></h3><table class="m sec">${head}<tbody>${rows}</tbody></table></div>`;
  }).join('');
}

const nAi = PR.items.filter((i) => i.ai).length;
const nZero = PR.items.filter((i) => !i.value).length;
let body = '';
const secG = groups.filter((g) => /за секціями/.test(g));
for (const g of groups.filter((x) => !secG.includes(x))) body += renderGroup(g, byG[g]);
const secHtml = secG.map((g) => renderSections(g, byG[g])).join('');

const html = `<!doctype html><html lang="uk"><head><meta charset="utf-8"><title>Ціни і коефіцієнти — зведення</title><style>
@page { size: A4; margin: 9mm 8mm 10mm; }
* { box-sizing: border-box; }
body { font: 7.6pt/1.22 Arial, sans-serif; color: #000; margin: 0; }
header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1.5px solid #000; padding-bottom: 1.2mm; margin-bottom: 2mm; }
header h1 { font-size: 12pt; margin: 0; } header div { font-size: 7.5pt; text-align: right; }
.leg { display: inline-block; width: 7mm; height: 2.6mm; background: #fff2a8; border: 1px solid #c9b200; vertical-align: middle; }
.cols { column-count: 2; column-gap: 5mm; column-fill: balance; }
.blk { break-inside: avoid; margin: 0 0 2mm; }
.wide { column-span: all; }
h3 { font-size: 8pt; margin: 0 0 .6mm; padding: .5mm 1.5mm; background: #e6e6e6; border-left: 2.5px solid #000; break-after: avoid; }
h3 .s { font-weight: normal; } .u { font-weight: normal; color: #555; font-size: 7pt; }
table { width: 100%; border-collapse: collapse; }
td, th { border-bottom: .4pt solid #cfcfcf; padding: .25mm 1mm; }
th { font-size: 6.8pt; font-weight: bold; text-align: right; background: #f4f4f4; white-space: nowrap; }
td.l { text-align: left; } td.v { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; width: 1%; }
td.un { width: 1%; white-space: nowrap; color: #555; font-size: 6.8pt; padding-left: .5mm; }
td.ai { background: #fff2a8; } td.z { color: #999; }
.m td.v { width: auto; } .sec td.l { width: 13mm; white-space: nowrap; }
tr { break-inside: avoid; }
</style></head><body>
<header><h1>Ціни і коефіцієнти калькуляторів — зведення</h1><div>Файл цін: <b>${esc(FILE)}</b> (${stamp})<br>Позицій: ${PR.items.length} · <span class="leg"></span> заповнив Claude, неточно: ${nAi} · «—» не заповнено: ${nZero}</div></header>
<div class="cols">${body}</div>
${secHtml}
</body></html>`;

const out = path.join(root, 'forms', 'Ціни і коефіцієнти — зведення');
fs.writeFileSync(out + '.html', html);
(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + out + '.html');
  await p.pdf({ path: out + '.pdf', format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: `<div style="font:7px Arial;width:100%;text-align:center;color:#666">${esc(FILE)} · <span class="pageNumber"></span>/<span class="totalPages"></span></div>`, margin: { top: '9mm', bottom: '10mm', left: '8mm', right: '8mm' } });
  await b.close();
  console.log(out + '.pdf');
})();
