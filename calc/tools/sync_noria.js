// Знімок каталогу норій НКЗ (та сама Google-таблиця, що синхронізує CRM) → calc/data/noria_catalog.json
//   node calc/tools/sync_noria.js calc            — завантажити з Apps Script
//   node calc/tools/sync_noria.js calc nkz.json   — з локального файлу
const fs = require('fs');
const path = require('path');
const URL = 'https://script.google.com/macros/s/AKfycbz_KMcNXy5f_LuvnduJS3P_IgM1z0Jukn8P78JmGSGAal8qennLE0WJKCEziNQL8UPE/exec';
const root = path.resolve(process.argv[2] || 'calc');
const PROD_CAP = { 1: 5, 2: 10, 3: 25, 4: 50, 5: 100, 6: 175, 7: 200 };
const CAPS = [5, 10, 25, 50, 100, 175, 200];

const num = (v) => { const x = parseFloat(String(v || '').replace(',', '.')); return isNaN(x) ? 0 : Math.round(x * 100) / 100; };
const codes = (s) => String(s || '').split(/[,\s]+/).map((x) => x.trim()).filter((x) => /^prod-\d+-\d+-\d+$/.test(x));
const capOfProd = (code) => PROD_CAP[+code.split('-')[2]];
const capsOfSetOn = (s) => [...new Set(codes(s).map(capOfProd).filter(Boolean))];
const isChainProd = (code) => code.split('-')[3] === '2';
function capsOfName(name) {
  const m = String(name).match(/НКЗ\s*([\d-]+)/i);
  if (!m) return [];
  const p = m[1].split('-').map(Number).filter(Boolean);
  return p.length === 2 ? CAPS.filter((c) => c >= p[0] && c <= p[1]) : p;
}

async function load() {
  if (process.argv[3]) return JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
  const r = await fetch(URL, { redirect: 'follow' });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

(async () => {
  const d = await load();
  const out = { _note: 'Знімок каталогу норій НКЗ (Google Sheets, та сама таблиця, що й CRM). Не редагуйте вручну — перезапустіть calc/tools/sync_noria.js. Ціни sale_price, грн.',
    synced: new Date().toISOString().slice(0, 10), models: [], buckets: [], belts: [], chains: [], couplings: [], backstops: [], sensors: [], metiz: {}, gear_motors: [], kw_by_h: {} };

  for (const cap of CAPS) {
    const prods = d.prod.filter((p) => capOfProd(p.full_n) === cap);
    const belt = prods.find((p) => !isChainProd(p.full_n));
    const chain = prods.find((p) => isChainProd(p.full_n));
    const parts = d.noria.filter((p) => capsOfName(p.full_name).includes(cap));
    const pick = (re) => { const x = parts.find((p) => re.test(p.full_name)); return x ? num(x.sale_price) : 0; };
    let thick = [];
    try { thick = JSON.parse((belt || chain || {}).thinks_mine_nkz || '[]').map((x) => num(x)); } catch (e) { thick = []; }
    out.models.push({
      capacity: cap,
      buckets_per_m: num(belt && belt.count_busket),
      chain_available: !!chain,
      chain_buckets_per_m: chain ? num(chain.count_busket) : 0,
      thickness: thick,
      boot: pick(/^Башмак в зборі/i),
      head: pick(/^Голова привідна в зборі/i),
      shaft_1m: pick(/^Шахта 1м/i),
      shaft_chain_1m: pick(/^Шахта ланцюгова 1м/i),
      shaft_rev: pick(/^Шахта оглядова/i),
      shaft_drive: pick(/^Шахта пирвідна|^Шахта привідна/i),
      frame: pick(/^Рамка шахти/i)
    });
  }
  const metizBy = Object.fromEntries(d.metiz.map((m) => [m.full_n, m]));
  for (const b of d.busket) {
    const bolt = metizBy[b.mitiz] || {};
    out.buckets.push({ id: b.full_n + ':' + b.name_3, name: b.full_name.trim(), type: /полі|пласт/i.test(b.full_name) ? 'plastic' : 'metal',
      price: num(b.sale_price), caps: capsOfSetOn(b.set_on), volume_l: num(b.volume_litr), bolts: num(b.count_metiz), bolt: (bolt.name_2 || '').trim() });
  }
  for (const b of d.conv_belt) out.belts.push({ id: b.full_n, name: (b.full_name.trim() + ' ' + b.width + ' мм, ' + b.s_material + ' пр.').replace('Срічка', 'Стрічка'),
    width: num(b.width), ply: b.s_material, price: num(b.sale_price), caps: capsOfSetOn(b.set_on) });
  for (const c of d.conv_chain) out.chains.push({ id: c.full_n, name: c.full_name.trim(), price: num(c.sale_price), caps: capsOfSetOn(c.set_on) });
  for (const a of d.att_equip) {
    const item = { id: a.full_n, name: a.full_name.trim(), price: num(a.sale_price), caps: capsOfSetOn(a.set_on) };
    if (/Муфта з.?єднувальна/i.test(a.full_name)) out.couplings.push(item);
    else if (/Обгонна|зворот/i.test(a.full_name)) out.backstops.push(item);
    else if (/Датчик/i.test(a.full_name)) out.sensors.push(item);
  }
  const m = (re) => d.metiz.find((x) => re.test((x['й'] || x.full_name || '') + ' ' + x.name_2 + ' ' + (x.name_5 || '')));
  for (const [k, re] of [['bolt_M8', /Гвинт М8 норійний/], ['bolt_M10', /Гвинт М10 норійний/], ['nut_M8', /Гайка М8/], ['nut_M10', /Гайка М10/], ['washer', /Шайба норійна/]]) {
    const x = m(re); out.metiz[k] = x ? { price_kg: num(x.sale_price), weight_kg: parseFloat(x.weight) || 0 } : { price_kg: 0, weight_kg: 0 };
  }
  for (const g of d.g_motor) out.gear_motors.push({ id: g.full_n + ':' + g.saler + ':' + g.gab, kw: num(g.kwt), type: g.type, gab: String(g.gab || '').trim(),
    saler: g.saler, price: num(g.sale_price) });
  for (const p of d.privod_nkz) (out.kw_by_h[p.type] = out.kw_by_h[p.type] || []).push({ max_h: num(p.max_h), kw: num(p.kvt) });

  fs.writeFileSync(path.join(root, 'data', 'noria_catalog.json'), JSON.stringify(out, null, 1));
  console.log('ok', out.models.map((x) => x.capacity + ':' + x.head + '/' + x.boot).join(' '), '| buckets', out.buckets.length, 'belts', out.belts.length, 'motors', out.gear_motors.length);
})().catch((e) => { console.error(e); process.exit(1); });
