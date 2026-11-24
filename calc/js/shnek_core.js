// Порт CRM app/javascript/lib/shnek_core.js (new_ax_crm), без змін логіки. Звірено з test/fixtures/files/shnek_core_golden.json.
(function (root) {
'use strict';
const RHO = 7.85
const PI_CRM = 3.14
const ENGINE_VERSION = "shnek_core/1"
const OVERRIDDEN_ORDER = ["name", "w", "buy", "k", "manual_cost", "mode", "off"]
const NUMERIC_KEYS = ["w", "buy", "k", "manual_cost"]

const or = (v, d) => (v === undefined || v === null || v === false ? d : v)
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
const isHash = (v) => typeof v === "object" && v !== null && !Array.isArray(v)

const r = (x, digits = 0) => {
  const f = Math.pow(10, digits)
  return Math.round(x * f) / f
}

const hangers = (length, spacing) => Math.max(0, Math.ceil(length * 1000 / spacing) - 1)

const ceil3 = (x) => {
  const n = Math.ceil(x - 1e-9)
  return n + ((3 - (n % 3)) % 3)
}

const lookupStep = (table, value) => {
  let out = table[0][1]
  for (const [k, v] of table) if (value >= k) out = v
  return out
}

const byKey = (table, size) => {
  const key = String(size)
  return has(table, key) ? table[key] : table.default
}

const comma = (x) => String(x).replace(".", ",")

const parseNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value === "string") {
    const s = value.trim().replace(/,/g, ".")
    return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : null
  }
  return null
}

const Geo = {
  helixDeg: (di, p) => Math.atan(p / PI_CRM / di) * 180 / Math.PI,
  cosv: (deg) => Math.cos(deg * Math.PI / 180),
  blankInner: (di, c) => (di / c) * 1.038,
  blankOuter: (dOut, di, bi) => dOut - di + bi,
  flangeH: (bo, bi) => (bo - bi) / 2,
  cutAngles(di, bi, deg) {
    const d1 = di / this.cosv(deg)
    const excess = PI_CRM * (bi - d1)
    const angP = Math.atan(excess / bi) * 180 / Math.PI * 2
    const add = Math.atan(deg * 0.32 / bi) * 180 / Math.PI * 2
    return { angle_p: r(angP, 2), add_angle: r(add, 2), cut_angle: r(angP + add, 2) }
  }
}

const W = {
  tubeKg: (wall, od, lenM) => wall * 0.02465 * (od - wall) * lenM,
  d31PerM: (bi, fh, p, t) => {
    const x = Math.PI * bi
    return Math.sqrt(x * x + p * p) * (1000 / p) * fh * t * RHO / 1e6
  },
  flightPerM: (di, d, p, t) => {
    const f = (r) => { const u = 2 * Math.PI * r; return u * Math.sqrt(u * u + p * p) + p * p * Math.log(u + Math.sqrt(u * u + p * p)) }
    const area = (f(d / 2) - f(di / 2)) / (4 * Math.PI)
    return area * (1000 / p) * t * RHO / 1e6
  },
  segAnnulus: (bo, bi, t) => Math.PI / 4 * (bo * bo - bi * bi) * t * RHO / 1e6,
  plate: (a, b, t) => a * b * t * RHO / 1e6,
  disc: (d, t) => Math.PI / 4 * d * d * t * RHO / 1e6,
  ring: (dOut, di, t) => Math.PI / 4 * (dOut * dOut - di * di) * t * RHO / 1e6,
  rod: (d, lenMm) => Math.PI / 4 * d * d * lenMm * RHO / 1e6,
  sqTubeKgPerM: (a, t) => (a * a - (a - 2 * t) * (a - 2 * t)) * RHO / 1000
}

function geom(type, size, cfg) {
  const tube = type === "tube"
  const shaftOd = cfg.shaft_od_sel || cfg.shaft_by_size[String(size)] || lookupStep(cfg.shaft_od, size)
  const shaftT = cfg.shaft_t_sel || byKey(cfg.shaft_wall, shaftOd)
  const wall = byKey(tube ? cfg.casing_wall : cfg.trough_t, size)
  const gap = tube ? cfg.gap.tube : cfg.gap.trough
  const inner = tube ? size - 2 * wall : size
  const d = cfg.flight_d_by_size[String(size)] || inner - gap
  const s = r(d * cfg.pitch_ratio, 0)
  const t = byKey(cfg.flight_t, size) || 4
  const hel = Geo.helixDeg(shaftOd, s)
  const c = Geo.cosv(hel)
  const bi = Geo.blankInner(shaftOd, c)
  const bo = Geo.blankOuter(d, shaftOd, bi)
  const fh = Geo.flangeH(bo, bi)
  return { type, size, wall, inner, d, shaft_od: shaftOd, shaft_t: shaftT, s, flight_t: t, helix_deg: hel, cos: c, blank_inner: bi, blank_outer: bo, flange_h: fh,
    cut: Geo.cutAngles(shaftOd, bi, hel), gap }
}

// Крок спіралі в мм для діаметра спіралі d; межі — limits.pitch_ratio (частка від d).
function pitchBounds(d, range) { return [Math.ceil(d * range[0]), Math.floor(d * range[1])] }
// Частка кроку для кроку mm; null = за замовчуванням (крок = D), щоб не слати зайвого у вхід.
function pitchRatioFor(mm, d) { return Math.abs(mm - d) < 0.5 ? null : Math.round((mm / d) * 1e4) / 1e4 }

const row = (attrs) => ({ qty: 1, per_m: false, unit: "шт", buy: null, w: 0, mat_key: null, k: null, note: "", src: "", ...attrs })
const buyPrice = (cfg, key) => cfg.buy[key].price
const buySrc = (cfg, key) => cfg.buy[key].src

const bearingFor = (type, size) => {
  if (size <= 108) return "ucf206"
  if (size <= 160 && type === "tube") return "ucf207"
  if (size <= 200) return "ucf207"
  if (size <= 275 || (type === "trough" && size <= 250)) return "ucf209"
  if (size <= 300) return "ucf210"
  return "ucf216"
}

const gearPlateOf = (cfg, kw) => cfg.gear_plate.find(([maxKw]) => kw <= maxKw).slice(1)

function crmKw(cfg, size, length) {
  const keys = Object.keys(cfg.crm_kw).map(Number).sort((a, b) => a - b)
  const k = keys.reduce((a, b) => (Math.abs(b - size) < Math.abs(a - size) ? b : a))
  const tbl = cfg.crm_kw[String(k)]
  const lc = Math.ceil(length)
  const out = tbl[String(lc)]
  if (out !== undefined) return out
  const mx = Math.max(...Object.keys(tbl).map(Number))
  const v = tbl[String(Math.min(lc, mx))]
  return v === undefined ? null : v
}

const patrubokW = (size) => {
  const a = size * 0.9
  const h = size * 0.7
  return (4 * a * h * 3 * RHO / 1e6) + W.ring(a + 70, a, 6) * 1.3
}

const pcOf = (type, id) => {
  switch (id) {
    case "casing": return type === "tube" ? "tube_body" : "sheet"
    case "shaft": return "shaft_tube"
    case "flight": return "flight"
    case "stub": return "bar"
    default: return "sheet"
  }
}

function buildParts(type, size, length, cfg, kw) {
  const g = geom(type, size, cfg)
  const tube = type === "tube"
  const out = []
  const add = (attrs) => out.push(row(attrs))
  const hangN = hangers(length, cfg.hanger_spacing)
  const bear = bearingFor(type, size)
  const bore = cfg.bore_of[bear]
  const wall = g.wall

  if (tube) {
    add({ id: "casing", name: `Корпус — труба Ø${size}×${wall}`, cat: "Корпус", per_m: true, unit: "м", w: W.tubeKg(wall, size, 1), mat_key: "casing" })
    add({ id: "flange", name: `Фланець корпусу (кільце) Ø${size + 60}`, cat: "Корпус", qty: 2 / (cfg.section_len / 1000), per_m: true, unit: "шт/м",
      w: W.ring(size + 60, size - 2 * wall, cfg.flange_t), mat_key: "casing", note: `по 2 на секцію ${cfg.section_len} мм` })
  } else {
    const b = Math.PI * size / 2 + 2 * 0.3 * size + 60
    const coverT = byKey(cfg.cover_t, size)
    add({ id: "casing", name: `Жолоб U-подібний, ширина ${size}, s=${wall}`, cat: "Корпус", per_m: true, unit: "м", w: b * wall * RHO / 1000, mat_key: "casing", note: `розгортка ${r(b, 0)} мм` })
    add({ id: "cover", name: `Кришка жолоба s=${coverT}`, cat: "Корпус", per_m: true, unit: "м", w: (size + 80) * coverT * RHO / 1000, mat_key: "casing" })
    add({ id: "ribs", name: "Ребра жорсткості жолоба (смуга 40×4, 2 шт/м)", cat: "Корпус", qty: 2, per_m: true, unit: "шт/м",
      w: 40 * 4 * (Math.PI * size / 2 + 0.6 * size + 60) * RHO / 1e6, mat_key: "casing", note: "кожні 0,5 м" })
  }

  add({ id: "shaft", name: `Вал шнека — труба Ø${g.shaft_od}×${g.shaft_t}`, cat: "Шнек", per_m: true, unit: "м", w: W.tubeKg(g.shaft_t, g.shaft_od, 1), mat_key: "screw" })
  if (cfg.flight_tech === "segment") {
    const nSeg = 1000 / g.s
    const wSeg = W.segAnnulus(g.blank_outer, g.blank_inner, g.flight_t)
    const sc = byKey(cfg.spiral.seg_coef, g.flight_t)
    add({ id: "flight", name: `Спіраль із сегментів: зовн. Ø${g.d}, внутр. Ø${g.shaft_od}, крок ${g.s}, s=${g.flight_t}`, cat: "Шнек", qty: nSeg, per_m: true, unit: "сегм/м", w: wSeg, mat_key: "screw", k: sc,
      note: `сегмент: D${r(g.blank_outer, 1)}/d${r(g.blank_inner, 1)}, кут різу ${g.cut.cut_angle}°; k=коеф. сегментів CRM` })
  } else {
    const w1 = W.flightPerM(g.shaft_od, g.d, g.s, g.flight_t)
    const coef = cfg.price_type === "wholesale" ? cfg.spiral.coef_wholesale : cfg.spiral.coef_retail
    add({ id: "flight", name: `Спіраль цільнотягнута: зовн. Ø${g.d}, внутр. Ø${g.shaft_od}, крок ${g.s}, s=${g.flight_t}`, cat: "Шнек", per_m: true, unit: "м", w: w1, mat_key: "screw",
      k: cfg.spiral.allowance * coef, note: `геометрична вага гвинтової стрічки; k = запас ${cfg.spiral.allowance} × коеф. ${coef} (SpiralCalculator)` })
  }
  add({ id: "stub", name: `Цапфа вала Ø${bore} (2 шт)`, cat: "Шнек", qty: 2, w: W.rod(bore, 350), mat_key: "screw", note: `круг під підшипник ${bear.toUpperCase()}` })

  const pt = byKey(cfg.plate_t, size)
  const sideEnd = (tube ? size : size + 2 * wall) + 80
  add({ id: "endplate", name: `Торцева плита ${sideEnd}×${sideEnd}×${pt} (2 шт)`, cat: "Торці", qty: 2, w: W.plate(sideEnd, sideEnd, pt) - W.disc(bore + 10, pt), mat_key: "plates" })
  add({ id: "bearing", name: `Корпус підшипника ${bear.toUpperCase()} (2 шт)`, cat: "Торці", qty: 2, buy: buyPrice(cfg, bear), src: buySrc(cfg, bear) })
  add({ id: "gland", name: "Сальникове ущільнення — манжета (2 шт)", cat: "Торці", qty: 2, buy: buyPrice(cfg, "manzheta"), src: buySrc(cfg, "manzheta") })
  add({ id: "inlet", name: "Завантажувальний патрубок з фланцем", cat: "Торці", w: patrubokW(size), mat_key: "plates", note: "коробка 0,9D×0,9D×0,7D, s=3 + фланець" })
  add({ id: "outlet", name: "Розвантажувальний патрубок з фланцем", cat: "Торці", w: patrubokW(size), mat_key: "plates" })

  if (hangN > 0) {
    add({ id: "hanger", name: `Проміжна підвіска (кронштейн + втулка ковзання), кожні ${cfg.hanger_spacing / 1000} м`, cat: "Підвіски", qty: hangN,
      w: W.plate(size * 0.9, 60, 6) + W.rod(10, size / 2 + 300) * 0.5, mat_key: "screw", note: "кількість = ⌈L/крок⌉−1; у 1С реальний крок 3–4 м" })
    add({ id: "hangerBush", name: "Втулка ковзання підвіски", cat: "Підвіски", qty: hangN, buy: buyPrice(cfg, "hanger_bush"), src: buySrc(cfg, "hanger_bush") })
    add({ id: "greaseTube", name: "Трубка змащення Ø10×1,5 + маслянка", cat: "Підвіски", qty: hangN, w: 0.4, mat_key: "plates", note: "≈0,4 кг/шт; довжину трубки задайте вручну" })
  }

  const kwNeed = kw && kw > 0 ? kw : 1.5
  const gp = gearPlateOf(cfg, kwNeed)
  const coupling = kwNeed <= 3 ? "coupling_s" : kwNeed <= 7.5 ? "coupling_m" : "coupling_l"
  add({ id: "gearplate", name: `Плита під редуктор ${gp[0]}×${gp[0]}×${gp[1]}`, cat: "Привід", w: W.plate(gp[0], gp[0], gp[1]), mat_key: "plates" })
  add({ id: "coupling", name: "Муфта еластична", cat: "Привід", buy: buyPrice(cfg, coupling), src: buySrc(cfg, coupling) })
  add({ id: "tension", name: "Плита натягу з шківами та ременями", cat: "Привід", w: W.plate(280, 160, 8) + 1.2, mat_key: "plates", note: "лише для схеми «двигун + пас»; для мотор-редуктора вимкніть" })
  add({ id: "pulleys", name: "Шківи (2 шт) + паси (2 шт)", cat: "Привід", buy: buyPrice(cfg, "pulley_big") + buyPrice(cfg, "pulley_small") + 2 * buyPrice(cfg, "belt"),
    src: `${buySrc(cfg, "pulley_big")} + ${buySrc(cfg, "pulley_small")} + ${buySrc(cfg, "belt")}` })
  add({ id: "feet", name: `Опори корпусу (кутник 50×50×5 + плита), по 1 на ${r(cfg.stand.span_m, 0)} м`, cat: "Опори", qty: Math.max(2, Math.ceil(length / cfg.stand.span_m) + 1),
    w: 0.6 + W.plate(120, 120, 5), mat_key: "plates" })
  add({ id: "consum", name: "Витратні: дріт, CO₂, кисень/азот, ґрунт, фарба", cat: "Витратні", note: "відсоток від вартості металу (1С: ≈10–15 %)" })

  for (const p of out) p.pc = p.mat_key ? pcOf(type, p.id) : null
  return out
}

function hopperParts(volume, cfg) {
  if (volume === null || volume === undefined || volume <= 0) return []
  const hp = cfg.hopper_fill
  const h = hp.h_mul * Math.cbrt(volume)
  const rr = hp.taper
  const a = Math.sqrt(3 * volume / (h * (1 + rr + rr * rr)))
  const b = rr * a
  const slant = Math.sqrt(h * h + ((a - b) / 2) * ((a - b) / 2))
  const area = 2 * (a + b) * slant
  const t = volume >= hp.big_from ? hp.t_big : hp.t
  const sheet = area * 1e6 * t * RHO / 1e6
  const rimLen = 4 * a * 1000 + 4 * b * 1000
  const label = volume < 1 ? `${volume * 1000} л` : `${volume} м³`
  const st = cfg.stand
  const out = [
    row({ id: "hopper", name: `Приймальний бункер ${label} (s=${t})`, cat: "Бункер", w: sheet, mat_key: "hopper",
      note: `усічена піраміда: верх ${r(a * 1000, 0)} мм, низ ${r(b * 1000, 0)} мм, h ${r(h * 1000, 0)} мм` }),
    row({ id: "hopperRim", name: "Обв'язка бункера (кутник 25×25×3)", cat: "Бункер", w: (rimLen / 1000) * 1.12, mat_key: "hopper" }),
    row({ id: "hopperLegs", name: `Опора бункера (профтруба ${st.tube_a}×${st.tube_a}×${st.tube_t})`, cat: "Бункер", w: (4 * (0.6 + h * 0.8)) * W.sqTubeKgPerM(st.tube_a, st.tube_t), mat_key: "frame" })
  ]
  for (const p of out) p.pc = p.mat_key ? "sheet" : null
  return out
}

function standParts(length, kind, cfg, wheelKey) {
  if (!kind || kind === "none") return []
  const s = cfg.stand
  const pairs = Math.ceil(length / s.span_m) + 1
  const kg = W.sqTubeKgPerM(s.tube_a, s.tube_t)
  const legsM = pairs * (2 * s.leg_h + 0.5 + 0.7 * 2)
  const out = [row({ id: "stand", name: `Підставка: ${pairs} пар опор, профтруба ${s.tube_a}×${s.tube_a}×${s.tube_t}`, cat: "Підставка",
    w: legsM * kg + pairs * 2 * W.plate(120, 120, 5), mat_key: "frame" })]
  if (kind === "chassis") {
    const c = cfg.chassis
    const fk = W.sqTubeKgPerM(c.frame_tube_a, c.frame_tube_t)
    const wk = wheelKey || c.wheels
    out.push(row({ id: "chassisFrame", name: `Рама шасі (профтруба ${c.frame_tube_a}×${c.frame_tube_a}×${c.frame_tube_t}) з віссю і дишлом`, cat: "Шасі",
      w: (2 * length + 2 * 1.0 + 1.5 + 1.2) * fk + W.rod(35, 1100), mat_key: "frame" }))
    out.push(row({ id: "wheels", name: `${cfg.wheels[wk]} (2 шт)`, cat: "Шасі", qty: 2, buy: buyPrice(cfg, `wheel_${wk}`), src: buySrc(cfg, `wheel_${wk}`) }))
  }
  for (const p of out) p.pc = p.mat_key ? "sheet" : null
  return out
}

const winchPart = (cfg) => row({ id: "winch", name: "Лебідка (кут нахилу)", cat: "Шасі", buy: buyPrice(cfg, "winch"), src: buySrc(cfg, "winch") })

function cleanField(key, value, limits) {
  if (NUMERIC_KEYS.includes(key)) {
    const n = parseNumber(value)
    return n !== null && n >= 0 && n <= limits[key] ? [true, n] : [false, null]
  }
  if (key === "off") return value === true || value === false ? [true, value] : [false, null]
  if (key === "mode") return value === "metal" || value === "purchase" ? [true, value] : [false, null]
  if (key === "name") {
    return typeof value === "string" && value.trim() !== "" && [...value].length <= limits.name_len ? [true, value.trim()] : [false, null]
  }
  return [false, null]
}

function sanitizeOverrides(raw, knownIds, cfg) {
  const clean = {}
  const dropped = []
  if (!isHash(raw)) return [clean, dropped]
  for (const id of Object.keys(raw)) {
    const fields = raw[id]
    if (!knownIds.includes(id) || !isHash(fields)) {
      dropped.push(id)
      continue
    }
    const ov = {}
    for (const key of Object.keys(fields)) {
      const value = fields[key]
      if (value === null || value === undefined || value === "") continue
      const [ok, v] = cleanField(key, value, cfg.limits)
      if (ok) {
        if (v !== null) ov[key] = v
      } else {
        dropped.push(`${id}.${key}`)
      }
    }
    if (Object.keys(ov).length > 0) clean[id] = ov
  }
  return [clean, dropped]
}

const pkgPrice = (cfg, matKey, pc) => (matKey ? cfg.prices[pc][cfg.mat[matKey]] : 0)

function priceLines(parts, length, cfg, overrides) {
  const defaultOff = cfg.default_off || []
  let metalBase = 0
  let sum = 0
  const rows = parts.map((p) => {
    const ov = overrides[p.id] || {}
    const off = has(ov, "off") ? ov.off === true : defaultOff.includes(p.id)
    const hasBuy = p.buy !== null && p.buy !== undefined
    const mode = ov.mode || (hasBuy ? "purchase" : "metal")
    const w = has(ov, "w") ? ov.w : p.w
    const pkg = pkgPrice(cfg, p.mat_key, p.pc || "sheet")
    const buy = has(ov, "buy") ? ov.buy : (hasBuy ? p.buy : 0)
    const defK = p.k === null || p.k === undefined ? (mode === "purchase" ? cfg.k_buy : cfg.k_fab) : p.k
    const k = has(ov, "k") ? ov.k : defK
    const qty = p.per_m ? p.qty * length : p.qty
    const base = mode === "purchase" ? buy : w * pkg
    const manual = has(ov, "manual_cost")
    const cost = off ? 0 : (manual ? ov.manual_cost : qty * base * k)
    const rawMetal = !off && !manual && mode === "metal" ? qty * w * pkg : 0
    if (p.id !== "consum") {
      metalBase += rawMetal
      sum += cost
    }
    return { p, ov, mode, w, pkg, buy, k, qty, cost, off, manual, total_w: off ? 0 : qty * w }
  })
  const cons = rows.find((x) => x.p.id === "consum")
  if (cons) {
    cons.k = has(cons.ov, "k") ? cons.ov.k : cfg.consumables
    cons.qty = 1
    cons.cost = cons.off ? 0 : (cons.manual ? cons.ov.manual_cost : metalBase * cons.k)
    sum += cons.cost
  }
  return { rows, subtotal: sum, total_weight: rows.reduce((a, x) => a + x.total_w, 0), metal_base: metalBase }
}

function krotRow(priced, length, kl, cfg) {
  const pm = priced.rows.filter((x) => !x.off && ["shaft", "flight", "casing"].includes(x.p.id))
  const costM = pm.reduce((a, x) => a + x.cost, 0) / length
  const wM = pm.reduce((a, x) => a + x.total_w, 0) / length
  const coef = cfg.krot_coef
  const p = row({ id: "krot", name: `Кріт — оголений шнек ${comma(kl)} м (${comma(coef)} × (шнек + кожух) за метр)`, cat: "Кріт", unit: "м", qty: kl, k: 1,
    w: coef * wM, note: "без кожуха, в бурт сипкого матеріалу" })
  return { p, ov: {}, mode: "metal", w: coef * wM, pkg: 0, buy: 0, k: 1, qty: kl, cost: coef * costM * kl, off: false, manual: false, total_w: coef * wM * kl }
}

const codeFor = (type, size, id, cfg) => `AX-${type === "tube" ? "T" : "Z"}${size}-${String(cfg.codes[id]).padStart(2, "0")}`

function publicRow(x, type, size, cfg) {
  const p = x.p
  const overridden = OVERRIDDEN_ORDER.filter((key) => has(x.ov, key)).map((key) => (key === "manual_cost" ? "cost" : key))
  return {
    id: p.id, code: codeFor(type, size, p.id, cfg), name: x.ov.name || p.name, cat: p.cat, unit: p.unit,
    qty: x.qty, w: x.w, total_w: x.total_w, mode: x.mode, pc: p.pc, mat: p.mat_key ? cfg.mat[p.mat_key] : null,
    pkg: x.pkg, buy: x.buy, k: x.k, cost: x.cost, off: x.off, overridden, manual_cost: x.manual,
    note: p.note, src: p.src
  }
}

function driveProfileKeys(cfg) {
  return Object.keys(cfg.drive.profiles)
}

const CORE_NAMES = { friction: "ω", fill: "ψ", nmax_k: "k_nmax" }
const FT_PER_M = 3.28084

function applyProfile(cfg, key, slopeDeg = 0) {
  const profiles = cfg.drive.profiles
  const resolved = has(profiles, String(key)) ? String(key) : cfg.drive.default_profile
  const p = profiles[resolved]
  return {
    ...cfg.drive, profile: resolved, fill: p.fill, rho: p.rho, friction: p.friction, nmax_k: p.nmax_k, start_k: p.start_k, profile_src: p.src,
    hanger_spacing: cfg.hanger_spacing, slope_deg: Number(slopeDeg)
  }
}

const profileUnconfirmed = (ec) => Object.keys(ec.profile_src).filter((k) => !ec.profile_src[k].confirmed)

function profileWarning(ec) {
  const bad = Object.keys(CORE_NAMES).filter((k) => !ec.profile_src[k].confirmed)
  if (bad.length === 0) return null
  const values = bad.map((k) => `${CORE_NAMES[k]}=${comma(ec[k])}`).join(", ")
  return `Профіль «${ec.profiles[ec.profile].label}»: не підтверджено джерелами — ${values}; потужність і оберти оціночні`
}

const interp = (t, x) => {
  const v = Math.max(t[0][0], Math.min(t[t.length - 1][0], x))
  for (let i = 1; i < t.length; i++) if (v <= t[i][0]) return t[i - 1][1] + (t[i][1] - t[i - 1][1]) * (v - t[i - 1][0]) / (t[i][0] - t[i - 1][0])
  return t[t.length - 1][1]
}

const slopeC = (ec) => interp(ec.slope_c, ec.slope_deg)
const slopeEnergy = (ec) => interp(ec.slope_energy, ec.slope_deg)

function qm3h(g, n, ec) {
  const d = g.d / 1000
  const sh = g.shaft_od / 1000
  const s = g.s / 1000
  return 60 * Math.PI / 4 * (d * d - sh * sh) * s * n * ec.fill * slopeC(ec)
}

const nMax = (g, ec) => (or(ec.nmax_k, 1)) * ec.nmax_a / Math.sqrt(g.d / 1000)

const nFor = (g, q, ec) => q / qm3h(g, 1, ec)

function idle(g, n, length, ec) {
  const cfg = ec.idle
  const fd = interp(cfg.fd, g.d / 25.4)
  const fb = hangers(length, ec.hanger_spacing) > 0 ? cfg.fb[cfg.bearing] : 1.0
  return length * FT_PER_M * n * fd * fb / 1e6 * cfg.hp_kw
}

function power(g, q, n, length, ec) {
  const qt = q * ec.rho
  const rad = ec.slope_deg * Math.PI / 180
  const moving = qt * (length * Math.cos(rad) * ec.friction + length * Math.sin(rad)) / 367
  const labFloor = qt * length * ec.friction / 367 * slopeEnergy(ec)
  const n0 = Math.max(moving, labFloor)
  const idleKw = idle(g, n, length, ec)
  return { n0: r(n0, 4), p_idle: r(idleKw, 4), p_shaft: r(n0 + idleKw, 4), qt: r(qt, 3) }
}

const kwUp = (ec, kw) => ec.kw_std.find((x) => x >= kw - 1e-9) || ec.kw_std[ec.kw_std.length - 1]

const gbSizeByKw = (ec, kw) => {
  const v = ec.gb_size_by_kw[String(kw)]
  return v === undefined ? null : v
}

function chooseRatio(ec, nTarget, nMaxV, atLeast) {
  const series = ec.worm_i
  const nMotor = ec.n_motor
  const fit = series.filter((i) => nMotor / i <= nMaxV + 1e-9)
  const enough = fit.filter((i) => nMotor / i >= nTarget - 1e-9)
  let i
  if (fit.length === 0) i = series[series.length - 1]
  else if (atLeast && enough.length > 0) i = Math.max(...enough)
  else if (atLeast) i = Math.min(...fit)
  else i = fit.reduce((a, b) => (Math.abs(nMotor / b - nTarget) < Math.abs(nMotor / a - nTarget) ? b : a))
  return { i_std: i, n2: nMotor / i, fits: fit.length > 0 }
}

const wormEta = (ec, iStd) => ec.worm_eta[String(iStd)]

const etaStart = (ec, eta) => Math.min(eta, ec.eta_static)

function t2n(ec, size, iStd) {
  const row = size !== null && ec.gb_t2[String(size)]
  const v = row ? Number(row[String(iStd)]) : 0
  return v > 0 ? v : 0
}

const motorTorque = (kw, eta, n2) => 9550 * kw * eta / n2

function gearUnconfirmed(ec, iStd, kw) {
  const out = []
  if (!ec.src.fs.confirmed) out.push("fs")
  if (!ec.src.motor_reserve.confirmed) out.push("motor_reserve")
  if (!ec.src.eta_static.confirmed) out.push("eta_static")
  if (!ec.src.worm_eta[String(iStd)].confirmed) out.push(`worm_eta.${iStd}`)
  const src = ec.src.gb_size_by_kw[String(kw)]
  if (src === undefined || !src.confirmed) out.push(`gb_size.${kw}`)
  out.push("gb_t2")
  return out
}

function gearboxChecks(ec, d) {
  const out = []
  if (d.m_motor < d.m_sel) out.push(`Момент двигуна на виході редуктора (${r(d.m_motor, 0)} Нм) менший за розрахунковий з f_s=${comma(ec.fs)} (${r(d.m_sel, 0)} Нм) — візьміть більшу потужність`)
  if (d.m_motor_start < d.m_start) out.push(`Пусковий момент (${r(d.m_motor_start, 0)} Нм при статичному ККД) менший за потрібний під завантаженням з K_пуск=${comma(ec.start_k)} (${r(d.m_start, 0)} Нм) — розгляньте більшу потужність, плавний пуск або частотник`)
  if (d.t2 > 0) {
    if (d.t2 < d.m_sel) out.push(`Довідковий T2н NMRV${d.size} (Motovario, не постачальника) при i=${d.i_std} (${d.t2} Нм) менший за розрахунковий (${r(d.m_sel, 0)} Нм) — потрібен більший габарит; звірте з каталогом постачальника`)
  } else {
    out.push(`T2н невідомо — візьміть із каталогу постачальника: потрібно T2н не менше ${r(d.m_sel, 0)} Нм (M_розр = M·f_s)${d.size !== null ? ` для NMRV${d.size} при i=${d.i_std}` : ""}`)
  }
  if (d.size === null) out.push(`Габарит редуктора для ${comma(d.kw)} кВт не встановлено`)
  const [lo, hi] = ec.i_range
  if (d.i_calc < lo || d.i_calc > hi) out.push(`Для обертів ${r(d.n_target, 0)} об/хв потрібне i≈${r(d.i_calc, 1)} — поза рядом ${comma(lo)}…${comma(hi)}; потрібна передача або інший двигун`)
  if (!d.fits) out.push(`Жоден i з ряду не дає n2 ≤ n_max (${r(d.n_max, 1)} об/хв): обрано i=${d.i_std}, n2=${r(d.n2, 1)} об/хв — потрібна додаткова передача або інший двигун`)
  out.push("Не перевірено: радіальне навантаження на вихідний вал, тепловий ліміт редуктора, кількість пусків/год, пік моменту двигуна при прямому пуску (розгляньте плавний пуск/частотник)")
  out.push("Самогальмування черв'ячного редуктора ненадійне (вібрація) — не покладайтеся на нього для утримання навантаження і проти зворотного ходу")
  return out
}

function operatingPoint(g, ec, { q = null, n = null } = {}) {
  const nm = nMax(g, ec)
  const warnings = []
  let source
  if (n !== null) {
    source = "n"
    if (n > nm) {
      n = nm
      warnings.push("Оберти обмежено до максимуму для цього діаметра")
    }
  } else if (q !== null) {
    source = "q"
    const need = nFor(g, q, ec)
    if (need > nm) {
      n = nm
      warnings.push("Для заданої продуктивності цей діаметр замалий — обертів обмежено")
    } else {
      n = need
    }
  } else {
    source = "max"
    n = nm
  }
  return { n, q: qm3h(g, n, ec), n_max: nm, source, warnings }
}

function actualPoint(g, length, op, ec) {
  const gear = chooseRatio(ec, op.n, op.n_max, op.source === "q")
  const n = gear.n2
  const q = qm3h(g, n, ec)
  return { ...gear, n, q, eta: wormEta(ec, gear.i_std), i_calc: ec.n_motor / op.n, power: power(g, q, n, length, ec) }
}

function requirement(ap, ec) {
  const pMotor = r(ap.power.p_shaft * ec.motor_reserve / ap.eta, 3)
  return { p_motor: pMotor, kw_advised: kwUp(ec, pMotor) }
}

function driveDetail(ap, op, kw, ec) {
  const pw = ap.power
  const n = ap.n
  const etaS = etaStart(ec, ap.eta)
  const mNom = 9550 * pw.p_shaft / n
  const mSel = mNom * ec.fs
  const mStart = mNom * ec.start_k
  const mMotor = motorTorque(kw, ap.eta, n)
  const mMotorStart = motorTorque(kw, etaS, n)
  const size = gbSizeByKw(ec, kw)
  const t2 = t2n(ec, size, ap.i_std)
  const checks = gearboxChecks(ec, {
    m_motor: mMotor, m_motor_start: mMotorStart, m_sel: mSel, m_start: mStart, size, i_std: ap.i_std, t2,
    i_calc: ap.i_calc, n_target: op.n, n_max: op.n_max, n2: n, fits: ap.fits, kw
  })
  const pw0 = profileWarning(ec)
  if (pw0) checks.unshift(pw0)
  const lookup = (table) => (size !== null && table[String(size)] !== null && table[String(size)] !== undefined ? table[String(size)] : "unknown")
  return {
    physics: { n0: pw.n0, p_idle: pw.p_idle, p_shaft: pw.p_shaft, m_nom: r(mNom, 1), p_motor_min: r(pw.p_shaft / ap.eta, 3) },
    margins: { fs: ec.fs, start_k: ec.start_k, motor_reserve: ec.motor_reserve, m_sel: r(mSel, 1), m_start: r(mStart, 1) },
    i_calc: r(ap.i_calc, 1), i_std: ap.i_std, eta: ap.eta, eta_start: etaS,
    m_motor: r(mMotor, 1), m_motor_start: r(mMotorStart, 1), size,
    t2n: t2, t2_known: t2 > 0, t2_required: r(mSel, 1),
    fr2max: lookup(ec.gb_fr2max), t_thermal: lookup(ec.gb_thermal),
    unconfirmed: profileUnconfirmed(ec).map((k) => `${ec.profile}.${k}`).concat(gearUnconfirmed(ec, ap.i_std, kw)),
    checks
  }
}

function driveSelect(g, length, op, kw, ec) {
  return driveDetail(actualPoint(g, length, op, ec), op, kw, ec)
}

function drivePlan(g, length, tableKw, manualKw, ec, { q = null, n = null } = {}) {
  const op = operatingPoint(g, ec, { q, n })
  const ap = actualPoint(g, length, op, ec)
  const req = requirement(ap, ec)
  const advised = req.kw_advised
  const source = manualKw !== null ? "manual" : (tableKw === null || advised > tableKw ? "physical" : "table")
  const kw = manualKw !== null ? manualKw : Math.max(...[tableKw, advised].filter((x) => x !== null))
  const det = driveDetail(ap, op, kw, ec)
  const pShaft = ap.power.p_shaft
  const factor = pShaft > 0 ? r(kw / pShaft, 1) : null
  const status = kw < advised - 1e-9 ? "need" : "reserve"
  const warnings = [...op.warnings]
  if (q !== null && ap.q < q - 1e-9 && op.warnings.length === 0) warnings.push(`Обране i дає продуктивність ${comma(r(ap.q, 2))} м³/год — менше за задану ${comma(q)} м³/год`)
  if (status === "need") warnings.push(`Недобір потужності: за фізичним розрахунком потрібно ${comma(advised)} кВт, обрано ${comma(kw)} кВт`)
  if (source === "physical" && tableKw !== null) warnings.push(`Фізичний розрахунок вимагає ${comma(advised)} кВт — більше за таблицю CRM (${comma(tableKw)} кВт): прийнято ${comma(advised)} кВт`)
  if (factor !== null && kw >= ec.oversize_warn * pShaft) warnings.push(`Привід ${comma(kw)} кВт має запас ×${comma(factor)} відносно фізичного розрахунку (${comma(pShaft)} кВт на валу шнека)`)
  const calc = {
    profile: ec.profile, profile_label: ec.profiles[ec.profile].label, basis: op.source, slope_deg: ec.slope_deg,
    q_target: q, n_target: r(op.n, 1), q: r(ap.q, 3), n: r(ap.n, 1), n_max: r(op.n_max, 1),
    kw, kw_source: source, status, reserve_vs_physics: factor,
    floor: { kw_table: tableKw },
    ...det,
    margins: { ...det.margins, ...req }
  }
  return { kw, drive_calc: calc, warnings }
}

const STANDS = ["none", "stand", "chassis"]
const FLIGHT_TECHS = ["solid", "segment"]
const PRICE_TYPES = ["retail", "wholesale"]
const DRIVE_KINDS = ["none", "motor", "gear"]
const parseInRange = (v, [lo, hi]) => {
  const x = parseNumber(v)
  return x !== null && x >= lo && x <= hi ? x : NaN
}
const err = (error) => ({ error })

function normalizeInput(raw, cfg) {
  const i = raw || {}
  const type = String(or(i.type, ""))
  if (!has(cfg.std, type)) return err("Невідомий тип корпусу")

  const sizeF = parseNumber(i.size)
  const size = sizeF !== null && sizeF === Math.floor(sizeF) ? sizeF : null
  if (!cfg.std[type].includes(size)) return err(`Типорозмір ${or(i.size, "")} недоступний для типу ${type}`)

  const [lo, hi] = cfg.limits.length
  const length = parseNumber(i.length)
  if (!(length !== null && length >= lo && length <= hi)) return err(`Довжина має бути від ${lo} до ${hi} м`)

  const hopper = parseNumber(or(i.hopper, 0))
  if (!(hopper !== null && hopper >= 0 && hopper <= cfg.limits.hopper_max)) return err(`Об'єм бункера має бути від 0 до ${cfg.limits.hopper_max} м³`)

  const krotLen = parseNumber(or(i.krot_len, 0))
  const [klo, khi] = cfg.limits.krot_len
  if (!(krotLen !== null && (krotLen === 0 || (krotLen >= klo && krotLen <= khi)))) return err(`Довжина крота має бути 0 або від ${klo} до ${khi} м`)

  const stand = String(or(i.stand, "none"))
  if (!STANDS.includes(stand)) return err("Невідомий тип підставки")

  let wheels = i.wheels === null || i.wheels === undefined ? "" : String(i.wheels)
  if (wheels === "") wheels = null
  if (wheels && !has(cfg.wheels, wheels)) return err("Невідоме колесо")

  const preset = String(or(i.preset, "black"))
  if (!has(cfg.presets, preset)) return err("Невідомий пресет матеріалів")

  const flightTech = String(or(i.flight_tech, "solid"))
  if (!FLIGHT_TECHS.includes(flightTech)) return err("Невідома технологія спіралі")

  const priceType = String(or(i.price_type, "retail"))
  if (!PRICE_TYPES.includes(priceType)) return err("Невідомий тип ціни")

  const driveKind = String(or(i.drive_kind, "none"))
  if (!DRIVE_KINDS.includes(driveKind)) return err("Невідомий вид приводу")

  const profile = or(i.profile, "") === "" ? cfg.drive.default_profile : String(i.profile)
  if (!driveProfileKeys(cfg).includes(profile)) return err("Невідомий профіль продукту")

  const optional = (v, range) => (v === null || v === undefined || String(v).trim() === "" ? null : parseInRange(v, range))
  const q = optional(i.q, cfg.limits.q)
  if (Number.isNaN(q)) return err(`Продуктивність має бути від ${cfg.limits.q[0]} до ${cfg.limits.q[1]} м³/год`)
  const n = optional(i.n, cfg.limits.n)
  if (Number.isNaN(n)) return err(`Оберти мають бути від ${cfg.limits.n[0]} до ${cfg.limits.n[1]} об/хв`)

  const slopeDeg = optional(i.slope_deg, cfg.limits.slope_deg)
  if (Number.isNaN(slopeDeg)) return err(`Нахил має бути від ${cfg.limits.slope_deg[0]} до ${cfg.limits.slope_deg[1]} °`)

  const pitch = optional(i.pitch_ratio, cfg.limits.pitch_ratio)
  if (Number.isNaN(pitch)) return err(`Крок спіралі має бути від ${cfg.limits.pitch_ratio[0]} до ${cfg.limits.pitch_ratio[1]} діаметра спіралі`)

  let shaftOd = null
  if (!(or(i.shaft_od, "") === "")) {
    const v = parseNumber(i.shaft_od)
    const dFlight = geom(type, size, cfg).d
    if (!(v !== null && Number.isInteger(v) && cfg.shaft_od_options.includes(v) && v <= dFlight * cfg.limits.shaft_od_max_ratio)) return err(`Ø трубовалу ${i.shaft_od} недоступний для типорозміру ${size}`)
    shaftOd = v
  }
  const shaftT = optional(i.shaft_t, cfg.limits.shaft_t)
  if (Number.isNaN(shaftT)) return err(`Стінка трубовалу має бути від ${cfg.limits.shaft_t[0]} до ${cfg.limits.shaft_t[1]} мм`)
  const odEff = shaftOd || cfg.shaft_by_size[String(size)] || lookupStep(cfg.shaft_od, size)
  if (shaftT !== null && shaftT * 2 >= odEff) return err(`Стінка трубовалу ${shaftT} мм завелика для Ø${odEff}`)

  const flag = (v) => v === true || v === 1 || v === "1" || v === "true"
  const text = (v) => (v === null || v === undefined || v === "" ? null : String(v))
  return {
    pitch_ratio: pitch === null ? cfg.pitch_ratio : pitch, shaft_od: shaftOd, shaft_t: shaftT,
    type, size, length, hopper, stand, wheels, winch: flag(i.winch) && stand === "chassis", krot_len: krotLen, preset, flight_tech: flightTech,
    price_type: priceType, drive_kind: driveKind, profile, q, n, slope_deg: slopeDeg === null ? 0 : slopeDeg, drive_full_n: text(i.drive_full_n), overrides_scope: text(i.overrides_scope), overrides: i.overrides
  }
}

function itemName(input, cfg, kind, kw) {
  const o = []
  const h = input.hopper
  if (h > 0) o.push(`бункер ${h < 1 ? `${h * 1000} л` : `${h} м³`}`)
  if (input.stand === "stand") o.push("підставка")
  if (input.stand === "chassis") o.push(`шасі${input.winch ? ", лебідка" : ""}`)
  if (input.krot_len > 0) o.push(`крот ${comma(input.krot_len)} м`)
  const label = cfg.presets[input.preset].label.toLowerCase()
  let head = `Шнековий транспортер ${input.type === "tube" ? "в трубі Ø" : "в жолобі "}${input.size} L=${comma(input.length)} м, ${label}`
  if (o.length > 0) head += ` (${o.join(", ")})`
  if (kind !== "none" && kw) head += `, ${kind === "gear" ? "мотор-редуктор " : "двигун "}${kw} кВт`
  return head
}

function quote(raw, cfg, drive = null) {
  const input = normalizeInput(raw, cfg)
  if (input.error) return input

  const { type, size, length } = input
  const scope = `${type}-${size}`
  const c = { ...cfg, mat: cfg.presets[input.preset].mat, flight_tech: input.flight_tech, price_type: input.price_type, pitch_ratio: input.pitch_ratio,
    shaft_od_sel: input.shaft_od, shaft_t_sel: input.shaft_t }
  const kind = input.drive_kind
  const warnings = []
  if (kind !== "none" && !drive) warnings.push("Привід вибрано, але модель не вказано: ціну приводу не враховано")

  const crm = crmKw(c, size, length)
  const driveKw = drive && Number(drive.kw) > 0 ? Number(drive.kw) : null
  const plan = drivePlan(geom(type, size, c), length, crm, driveKw, applyProfile(c, input.profile, input.slope_deg), { q: input.q, n: input.n })
  const kw = plan.kw
  warnings.push(...plan.warnings)

  let parts = buildParts(type, size, length, c, kw).filter((p) => !(kind !== "motor" && ["tension", "pulleys"].includes(p.id)))
  parts = parts.concat(hopperParts(input.hopper, c), standParts(length, input.stand, c, input.wheels))
  if (input.winch) parts.push(winchPart(c))

  let overridesRaw = input.overrides
  if (input.overrides_scope && input.overrides_scope !== scope) {
    warnings.push(`Правки відносяться до іншого типорозміру (${input.overrides_scope}) і не застосовані`)
    overridesRaw = isHash(overridesRaw) ? Object.fromEntries(Object.keys(overridesRaw).map((k) => [k, null])) : null
  }
  const [overrides, dropped] = sanitizeOverrides(overridesRaw, parts.map((p) => p.id), c)

  const priced = priceLines(parts, length, c, overrides)
  const rows = priced.rows
  let subtotal = priced.subtotal
  let totalWeight = priced.total_weight
  if (input.krot_len > 0) {
    const krot = krotRow(priced, length, input.krot_len, c)
    rows.push(krot)
    subtotal += krot.cost
    totalWeight += krot.total_w
  }

  const drivePrice = kind === "none" || !drive ? 0 : Number(drive.price)
  return {
    engine_version: ENGINE_VERSION,
    name: itemName(input, c, kind, kw),
    price: ceil3(subtotal * c.vat + drivePrice),
    subtotal,
    subtotal_vat: subtotal * c.vat,
    drive: { kind, full_n: drive ? drive.full_n ?? null : null, name: drive ? drive.name ?? null : null, kw: driveKw, price: drivePrice },
    total_weight: totalWeight,
    metal_base: priced.metal_base,
    crm_kw: crm,
    drive_calc: plan.drive_calc,
    parts: rows.map((x) => publicRow(x, type, size, c)),
    dropped_overrides: dropped,
    warnings
  }
}

const util = { r, ceil3, comma }

var api = { geom, pitchBounds, pitchRatioFor, crmKw, sanitizeOverrides, driveProfileKeys, applyProfile, qm3h, nMax, nFor, idle, power, kwUp, gbSizeByKw, chooseRatio, wormEta, etaStart, t2n, gearboxChecks, operatingPoint, actualPoint, requirement, driveDetail, driveSelect, drivePlan, normalizeInput, quote, util };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ShnekCore = api;
})(this);
