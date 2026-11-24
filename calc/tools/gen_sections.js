// Генерує data/sections.json з детального розрахунку: node calc/tools/gen_sections.js calc
const S=require(process.argv[2]+'/js/shnek_core.js'), c=require(process.argv[2]+'/data/shnek_core.json');
const L=6, r=x=>Math.round(x*100)/100;
const sum=(o,ids)=>o.parts.filter(p=>ids.includes(p.id)&&!p.off).reduce((s,p)=>s+p.cost,0);
const out={_note:"Ціни вузлів для режиму «За секціями», грн БЕЗ ПДВ (як собівартість детального розрахунку, з коеф. виготовлення). Початкові значення згенеровано з CRM shnek_core (L=6 м, цільнотягнута спіраль) — можна переоцінити. Секція = 2 м.",
  section_m:2, items:{}};
for (const preset of Object.keys(c.presets)) { out.items[preset]={};
 for (const type of ['tube','trough']) { out.items[preset][type]=[];
  for (const size of c.std[type]) {
   const g=S.quote({type,size,length:L,drive_kind:'gear',preset},c,null), m=S.quote({type,size,length:L,drive_kind:'motor',preset},c,null);
   if (g.error) { console.error(type,size,g.error); continue; }
   const hangers=g.parts.find(p=>p.id==='hanger'); const hn=hangers?hangers.qty:0;
   const base=g.subtotal-sum(g,['consum']);
   out.items[preset][type].push({ size,
     casing_2m: r(sum(g,['casing','flange','cover','ribs'])/L*2),
     shaft_2m: r(sum(g,['shaft'])/L*2),
     spiral_2m: r(sum(g,['flight'])/L*2),
     hanger: r(hn?sum(g,['hanger','hangerBush','greaseTube'])/hn:0),
     end_plate: r(sum(g,['stub','endplate','bearing','gland'])/2),
     drive_gear: r(sum(g,['gearplate','coupling'])),
     drive_motor: r(sum(m,['gearplate','coupling','tension','pulleys'])),
     nozzles: r(sum(g,['inlet','outlet'])),
     consum_pct: r(sum(g,['consum'])/base*100) });
  } } }
require('fs').writeFileSync(process.argv[2]+'/data/sections.json', JSON.stringify(out,null,1));
console.log(JSON.stringify(out.items.black.tube.slice(0,3)));
