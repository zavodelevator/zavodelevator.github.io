# zavodelevator.github.io: site research (read-only)

Repo: `/home/user/zavodelevator.github.io`, checked out branch `claude/busy-planck-aknjhi`, working tree clean. No files in the repo were modified.

Notes on scope:
- All JS formulas below are copied from the source; line numbers refer to the files as they are in this checkout.
- Where a meaning is not stated in the code, it is marked "meaning not in code".
- Prices and constants are as written in the source. Nothing was verified against the live site.

---

## 0. Site map

| Public page | Source file(s) | In nav? | Status (per code) |
|---|---|---|---|
| Шнековий транспортер (screw conveyor price) | `calc_sh_t2.html` + `calc_sh_t2.js` | yes | price works; production calc disabled ("В розробці") |
| Цільнокатана спіраль (seamless spiral stock) | `sclad_sp2.html` + `sclad_sp2.js` | yes | works, data from Google Apps Script |
| ТШ (scraper conveyor) | `calc_tsh.html` + `src/calc_sh_t/src/vue.js` | yes | page says "Ще не працює!"; only motor recommendation computed, no price |
| НКЗ (bucket elevator / норія) | `nkz/kalk_nkz.html` + `nkz/js/*.js` | yes | full price calculator, data from Google Apps Script |
| Scraper variant | `calc_sh_t3.html` + `calc_sh_t3.js` | no | newer copy of screw calc; different price formula (see §1.3) |
| Price newsletters | `pages/price_spiral.html`, `pages/price_spiral2.html` | no | email HTML exports, no price data in text |
| Spiral catalogue | `khzet_files_andprogects/list_katalog/*` | no | uses `src/style.css` |
| Others | `sclad_sp_send.html/js`, `sclad_sp3.html`, `busket/*`, `src/basik/*`, `src_sklad_sp/*`, `screw_passport/*`, `dream/*`, `other_pages/*`, `api_nova.html`, `other_scripts/*` | no | not analysed in detail |

Root `/` has no `index.html` on this branch (`ls` at root). The GitHub Pages root URL would not serve a page from this checkout.

---

## 1. Per-page detail

### 1.1 `calc_sh_t2.html` + `calc_sh_t2.js` (Шнековий транспортер)

**Purpose:** Price calculator for a screw conveyor (шнековий транспортер). Also a half-built "productivity" block that is marked "В розробці поки-що не працює".

**Inputs (`calc_sh_t2.html`)**

| Control id | Type | Label | Options (value → label) | Default |
|---|---|---|---|---|
| `params_trans` | select | Діаметер труби шнека мм. | `102,4050,4500,2048`→102; `127,4116,4500,2486`→127; `159,4512,4500,2914`→159; `219,7350,4500,4384`→219; `250,8000,4500,5000`→250; `300,9000,4500,6000`→300 | first option (102) |
| `length_trans` | select | Довжина шнека | 1..20 (value = number) | 1 |
| `flexSwitchCheckChecked_1` (class `radio_boonker`) | checkbox | Бункер | — | off |
| `flexSwitchCheckChecked_2` (class `radio_pidstavka`) | checkbox | Підставка | — | off |
| `flexSwitchCheckChecked_krot` (class `radio_krot`) | checkbox | Крот | — | off |
| `flexSwitchCheckChecked_zholob` (class `radio_zholob`) | checkbox | Жолоб | — | off |
| `exampleRadios1` / `exampleRadios2` (class `form-check-input_engyne`, name `exampleRadios`) | radio | Двигун / Мотор редуктор | value `option2` (Двигун, checked) / `option1` (Мотор редуктор) | Двигун |
| `engine_params` | select | (engine) | see table §1.1.3 | `0,0,0` "Без двигуна" |
| `calck_price` | button | Розрахувати | — | — |
| `weight_product` | select (hidden in `#content_weight_product`) | Продукт насипна маса на т./м. куб. | 0.1 ... 2 (see HTML) | 0.7 (зерно пшениці) |
| `working_angle` | select (hidden) | Кут роботи (градусів) | 0, 15, 30, 45, 60, 90 | 0 |
| `calck_production` | button | Розрахувати | — | — |

Hidden block `#content_weight_product` is shown only by `add_content_params_select()`, which runs only inside `calck_production()` (see bugs).

**Hardcoded tables**

§1.1.1 Engine-length to motor kW (`equal_engene_redukt_for_params`, `calck_price` shows the kW in `.need_engyne`). Only the rows with a numeric kW are listed; "Невідомо" rows show nothing.

| Pipe Ø mm | Length m → kW |
|---|---|
| 102 | 1→1.1; 2→1.1; 3→1.5; 4→1.5; 5→1.5; 6→1.5; 7→2.2; 8→2.2; 9→2.2; 10–20→Невідомо |
| 127 | 1→1.5; 2→1.5; 3→1.5; 4→1.5; 5→2.2; 6→2.2; 7→2.2; 8→2.2; 9→3; 10→3; 11–20→Невідомо |
| 159 | 1→2.2; 2→2.2; 3→2.2; 4→2.2; 5→3; 6→3; 7→3; 8→3; 9→4; 10→4; 11→4; 12→4; 13–20→Невідомо |
| 219 | 1→3; 2→3; 3→3; 4→3; 5→4; 6→4; 7→4; 8→4; 9→4; 10→4; 11→5.5; 12→5.5; 13–20→Невідомо |
| 250 | 1→3; 2→3; 3→3; 4→3; 5→4; 6→4; 7→4; 8→5; **11→5 (typo, see bugs)**; 10→7.5; 11→7.5; 12→7.5; 13–20→Невідомо. **Length 9 has no row.** |
| 300 | 1→3; 2→3; 3→4; 4→4; 5→4; 6→4; 7→5.5; 8→5.5; 9→5.5; 10→5.5; 11→7.5; 12→7.5; 13–20→Невідомо |

§1.1.2 Motor-tube constants in `calc_sh_t2.html` (the static option list, `engine_params`, value `rpm,kW,price`). Price is the 3rd field.

| value | Label | Price (3rd field) |
|---|---|---|
| `0,0,0` | Без двигуна (default) | 0 |
| `1500,1.1,5470` | Мотор 1.1 кВт. 1500 об./хв. | 5470 |
| `1500,1.5,6053` | Мотор 1.5 кВт. 1500 об./хв. | 6053 |
| `1500,2.2,9206` | Мотор 2.2 кВт. 1500 об./хв. | 9206 |
| `1500,3.0,8198` | Мотор 3.0 кВт. 1500 об./хв. | 8198 |
| `1500,4.0,10656` | Мотор 4.0 кВт. 1500 об./хв. | 10656 |
| `1500,5.5,14834` | Мотор 5.5 кВт. 1500 об./хв. | 14834 |
| `1500,7.5,19301` | Мотор 7.5 кВт. 1500 об./хв. | 19301 |
| `1500,11.0,23904` | Мотор 11.0 кВт. 1500 об./хв. | 23904 |

The 1000 and 750 rpm rows are commented out in both HTML and JS.

§1.1.3 Motor-gearbox (мотор-редуктор) options, built in JS by `build_select_engin()` when radio `exampleRadios2` is checked (value `rpm,kW,price`, here rpm is always 0):

| value | Label | Price (3rd field) |
|---|---|---|
| `0,0,0` | Без мотор-редуктора (default) | 0 |
| `0,1.1,11848` | Мотор редуктор 1.1 кВт. WMI 63 | 11848 |
| `0,1.1,13483` | Мотор редуктор 1.1 кВт. WMI 75 | 13483 |
| `0,1.5,12669` | Мотор редуктор 1.5 кВт. WMI 63 | 12669 |
| `0,1.5,14334` | Мотор редуктор 1.5 кВт. WMI 75 | 14334 |
| `0,2.2,16869` | Мотор редуктор 2.2 кВт. WMI 75 | 16869 |
| `0,2.2,18948` | Мотор редуктор 2.2 кВт. WMI 90 | 18948 |
| `0,3,21098` | Мотор редуктор 3 кВт. WMI 90 | 21098 |
| `0,3,27090` | Мотор редуктор 3 кВт. WMI 110 | 27090 |
| `0,4,23051` | Мотор редуктор 4 кВт. WMI 90 | 23051 |
| `0,4,29043` | Мотор редуктор 4 кВт. WMI 110 | 29043 |
| `0,5.5,33169` | Мотор редуктор 5.5 кВт. WMI 110 | 33169 |
| `0,5.5,36666` | Мотор редуктор 5.5 кВт. WMI 130 | 36666 |
| `0,7.5,39359` | Мотор редуктор 7.5 кВт. WMI 110 | 39359 |
| `0,7.5,42855` | Мотор редуктор 7.5 кВт. WMI 130 | 42855 |
| `0,7.5,53987` | Мотор редуктор 7.5 кВт. WMI 150 | 53987 |
| `0,9.2,47478` | Мотор редуктор 9.2 кВт. WMI 130 | 47478 |
| `0,9.2,58610` | Мотор редуктор 9.2 кВт. WMI 150 | 58610 |
| `0,11,61201` | Мотор редуктор 11 кВт. WMI 150 | 61201 |
| `0,15,76006` | Мотор редуктор 15 кВт. WMI 150 | 76006 |

Note: the HTML static select (for the motor case) lists only the motor rows; the gearbox rows exist only in the JS string at `calc_sh_t2.js` lines 260–280.

§1.1.4 Price constants (from `prace_vue()` and the commented labels at `calc_sh_t2.js` lines 152–159):

| Constant | Value | Meaning |
|---|---|---|
| Base constant (motor mode) | `params_trans[2]` = 4500 for all sizes | comment label: "Ціна шкіків та підшипніків" (pulleys and bearings); the code reads only `params_trans[2]` |
| Base constant (gearbox mode) | 3000 | not labelled in code |
| `params_trans[1]` | 4050 / 4116 / 4512 / 7350 / 8000 / 9000 | comment label: "Ціна навісного" (mounting part price) |
| `params_trans[3]` | 2048 / 2486 / 2914 / 4384 / 5000 / 6000 | comment label: "Ціна за метр" (price per metre) |
| Bunker (бункер) | +2000 if Ø < 160, else +3000 | comment label "Ціна бункера" 2000 |
| Підставка | +4000 if Ø < 160, else +5000 | comment label 4000 |
| Крот | + `params_trans[3] × 0.5` | comment label "Ціна крот" |
| Жолоб | × 1.1 | — |
| Length ≥ 10 m | × 1.1 | — |
| Tax/markup step 1 | × 1.15 (ПДВ 15%, `parseInt`) | comment: "ПДВ 15% та націнка 10%" |
| Markup step 2 | × 1.1 (`parseInt`) | comment: "націнка 10%" |
| Markup step 3 | × 1.15 (`parseInt`) | comment: "+15% на вартість транспортера" |
| Drive markup | engine price × 1.1 (`parseInt`) | comment: "націнка +10% на вартість приводу" |

**Formulas (copied; `L` = `l_trans`, `D` = `params_trans[0]`, `P1..P3` = `params_trans[1..3]`, `E` = `engine_params`)**

From `prace_vue()` (`calc_sh_t2.js` lines 289–359):

```js
// engine radio: chek_chose_radio == false means Двигун (motor), true means Мотор редуктор
if(chek_chose_radio == false){
    price_sh_transporter = ((params_trans[2]*1)+(params_trans[1]*1)+(params_trans[3]*l_trans*1.1*1.2));
}else{
    price_sh_transporter = (3000 + (params_trans[1]*1)+(params_trans[3]*l_trans*1.1*1.2));
}
if($(".radio_boonker").prop("checked")){ if(params_trans[0]<160){ price_sh_transporter += 2000 }else{ price_sh_transporter += 3000 } }
if($(".radio_pidstavka").prop("checked")){ if(params_trans[0]<160){ price_sh_transporter += 4000 }else{ price_sh_transporter += 5000 } }
if($(".radio_krot").prop("checked")){ price_sh_transporter += (params_trans[3]*0.5) }
if($(".radio_zholob").prop("checked")){ price_sh_transporter = price_sh_transporter*1.1 }
if(l_trans >= 10){ price_sh_transporter = price_sh_transporter*1.1 }
price_sh_transporter = parseInt(price_sh_transporter*1.15)
price_sh_transporter = parseInt(price_sh_transporter*1.1)
price_sh_transporter = parseInt(price_sh_transporter*1.15)
var price_engine = parseInt((engine_params[2]*1)*1.1)
// output: "Транспортер ₴ X.00 з пдв", "Привід ₴ Y.00 з пдв", "Разом ₴ X+Y.00 з пдв"
// numberToSpaceString(n): Math.trunc, thousands separated by a space
```

Final formula: `Total = T + E₂·1.1` where
`T = trunc(trunc(trunc(B·[bonus]·1.15)·1.1)·1.15)`, `B` as above.

From `calck_production()` (`calc_sh_t2.js` lines 424–589). **This function is never called** (see bugs), so it has no live output. Copied for reference:

```js
let s_out_pipe = 3.5
let scrw_p = (params_trans[0] - 11) * 0.0001
let pered_zdatnist_shkiv = 0.25
diam_smale_pipe = (D==102 || D==127) ? 34 : 42
volume_smale_pipe = count_value_circle(diam_smale_pipe)
let params_volume_pipe = count_value_circle(params_trans[0] - (s_out_pipe*2))
engine_reduktor_speed = (mot-redukt selected) ? parsed value : 93
engine_speed = (chek_chose_radio == false) ? engine_params[0]*pered_zdatnist_shkiv : engine_reduktor_speed
cooficient_angle_working = { 0:0.85, 15:0.75, 30:0.7, 45:0.6, 60:0.5, 90:0.5 }[working_angle]
production_sh_transporter =
    ((params_volume_pipe * scrw_p) - (volume_smale_pipe * scrw_p))
    * cooficient_angle_working * engine_speed * weight_product * 60
// output: production_sh_transporter.toFixed(2) + " тон на годину"
// function count_value_circle(d) = ((d/2)*(d/2)*pi) * 0.00001 ; pi = 3.1415926535
```

Hardcoded production inputs: `s_out_pipe = 3.5`; `pered_zdatnist_shkiv = 0.25` (belt ratio); `93` rpm default; `diam_smale_pipe` 34 or 42; shaft pulleys `300/410` mm and motor pulleys `80/90/135` mm (HTML in `add_write_select_engine_params`, not used by any formula); motor-gearbox rpm `30,42,70,93,112,140`.

**Where data comes from:** all hardcoded in the HTML and `calc_sh_t2.js`. No ajax/fetch.

**Outputs:** `.price` block (transporter, engine, total, plus a debug formula box `#price_debug_ex` that is always rendered after every price calc, labelled "Формула ціноутворення (тимчасово)"); `.need_engyne` (required kW from §1.1.1); `.production_sh` (never filled).

**Layout:** Bootstrap 4 `.container` > `.card` > `.card-header` + `.card-body` > `.row` > two `.col-sm`: left = image card (`/img/shnek_trans/sh_t_21_krot.jpg`), right = form. Second block below a `<br>` spacer block (about 60 `<br>` tags) for productivity.

#### 1.1.5 Bugs and dead code (calc_sh_t2)
- `calck_production()` is never invoked: its calls are commented out in the `#calck_production` click handler and in the `#params_trans` change handler. The `#calck_production` button therefore only resets the price. The "В розробці" header is accurate.
- `calck_production()` line 588 `console.log(params_inner_volume_pipe)` references an undefined variable; it would throw `ReferenceError` if the function ever ran.
- `calck_production()` line 435 binds `.form-check-input_engyne` change handler inside a function that is not executed (dead, but would duplicate handlers if it were).
- `equal_engene_redukt_for_params` row `[250,11,5]` (line 114) should almost certainly be `[250,9,…]`. Length 9 has no row, and length 11 has two rows; the later `[250,11,7.5]` wins, so the kW shown for 11 m is 7.5 and 9 m shows nothing.
- `chose_kvt()` does not clear a previous `.need_engyne` value when no row matches (it only clears "Невідомо"). All 1–20 lengths exist in the table, so this is latent.
- `working_angle` and `weight_product` are parsed with `.val().split(',')*1`. Works for single values; misleading.
- Price debug box `renderPriceDebug` is rendered to all visitors (marked "тимчасово").
- `prace_vue()` is called on `#engine_params` change, and `build_select_engin()` replaces the engine select without refreshing price (clean_prace() clears it).
- Gearbox mode always adds 3000 to the transporter base, even when "Без мотор-редуктора" (0,0,0) is selected. Verify intent.
- Commented-out duplicate of `priceDebugFormula` (lines 361–396) groups the factors differently (`(P3*L*1.1)*1.2` at line 365 vs `P3*L*1.1*1.2` at line 292), but the product is the same. Dead code.
- `calc_sh_t.css` is linked as `href="calc_sh_t.css"` (line 11 of the HTML), which does not exist at the repo root. The real file is `src/calc_sh_t/src/calc_sh_t.css`. Stylesheet 404.
- Label typos: "Діаметер" (should be "Діаметр"), placeholder "Умоаний прохід" (should be "Умовний"). Also `Card image cap` alt text placeholder.
- Duplicate class and id conventions: `radio_boonker`, `radio_pidstavka` are checkboxes but named like radios.
- Empty `<script>` block in `<head>`.

### 1.2 `calc_tsh.html` + `src/calc_sh_t/src/vue.js` (ТШ, scraper conveyor)

**Purpose:** Vue 2 app for the ТШ scraper conveyor. Shows a warning "Ще не працює!" (line 25) and computes only a recommended motor power (kW) from lookup rows loaded from Google Apps Script. No price is computed.

**Important:** `src/calc_sh_t/src/vue.js` is the app code, not the Vue library. Its name is misleading. The `calc_sh_t/calc_sh_t.js` file referenced by the folder is **0 bytes**, and `calc_tsh.html` does not load it.

**Scripts loaded (in order):** Vue 2.6.14 (`cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.min.js`), jQuery 3.3.1 full (`code.jquery.com`), Popper 1.14.7 (cdnjs), Bootstrap 4.3.1 JS (stackpath), then `src/calc_sh_t/src/vue.js`.

**Inputs**

| Control | Binding | Options / default |
|---|---|---|
| `#params_trans` (label "Продуктивність транспортера") | `v-model="selectedTsh"` | ТШ 25 (value `25`), ТШ 50, ТШ 100, ТШ 200. Default in data: `"25"` |
| `#length_trans` (number, "Довжина транспортера, м") | `v-model="lengthTrans"` | empty, default `null` |
| Тип короба (radio group "Розбірний" checked / "Зварний") | no binding | no effect on output |
| `flexSwitchCheckChecked_1` "Розподільний механізм" | `v-model="hasDistributor"` | off |
| `#distributorLength` (shown when distributor on) | `v-model="distributorLength"` | empty, default `null` |
| `#mr` "Редуктор" | `v-model="selectedMrId"` | options from `mrOptions` (Google Sheet), first = "Без приводу" |
| Тип покриття (Грунт checked / Емаль / Порошкове фарбування / Оцинкований) | no binding | no effect on output |

**Data source:** three Google Apps Script endpoints (fetched with `$.ajax` in `processData()` on `mounted`):
- `MR` — `https://script.google.com/macros/s/AKfycbzMg_jaGqQkMSqjXQAbhsvaCc16n-Cn2513om5-vNgU-uFJL4Z-gFpoXSkQgev5stsB/exec` → `mrData` (drive/reducer list). Field aliases: `name|Name`, `kWt|kwt|kW|kw`, `gab|Gab|size`, `price|Price`, `id|ID|Id`.
- `tsh_parts_price` — `https://script.google.com/macros/s/AKfycbwgvuaBSBb-EEkWGwFCV0gYjOcJ7e94Lko8qmCh2qrniXMVFpAomypQJQvjSBCm6q4L/exec` → stored in `tableData`, **never used**.
- `tsh_leangth_kWt` — `https://script.google.com/macros/s/AKfycbxNZn_bJqPj7QuhZJC-gkzEWW3NauE5cAySfQ_nhEoX3kB0dRGatP3i_0m_qd7fWbQIhA/exec` → `tshLKData` rows `{prod, L, kwt, rozp}` (field aliases `prod|Prod|product|PROD`, `L|length|Len`, `kwt|kWt|kW|kw`, `rozp|Rozp|distributor`).

**Formula (`recommendedKwt`, copied):**

```js
const filtered = rows.filter(r => String(r.prod).replace(/[^\d]/g,'') === normProdSel).sort((a,b)=>a.L-b.L);
const totalLen = Number(this.lengthTrans) || 0;
const distLen = this.hasDistributor ? (Number(this.distributorLength) || 0) : 0;
const effLen = Math.max(totalLen - distLen, 0);
const findRow = (arr, target) => arr.find(r => r.L === target) || arr.find(r => r.L >= target) || arr[arr.length-1];
const baseRow = findRow(filtered, effLen);
const baseKwt = Number(baseRow && baseRow.kwt) || 0;
let distKwt = 0;
if (this.hasDistributor && distLen > 0) { const distRow = findRow(filtered, distLen); distKwt = Number(distRow && distRow.rozp) || 0; }
const result = baseKwt + distKwt;
return result ? String(result).replace(/\.0+$/, '') : '';
```

`recommendedKwtDebug` repeats this and shows the steps in a visible `.alert.temp-debug` box.

**Hardcoded in vue.js:** Image paths `src/calc_sh_t/src/img/TSH{25,50,100,200}.jpg`, `banner22.jpg`, `Scraper_conveyor2.png`. Default `selectedTsh = "25"`. `MR` filter "Без приводу" (no-drive) inserted as first option with id `no_drive`. Regex `/\.0+$/` strips trailing `.0`.

**Outputs:** text "Рекомендована потужність: {{ recommendedKwt }} кВт" and debug line; the `#mr` select. No price.

**Layout:** `.container#distributorApp` > `.card` > `.card-header` "Транспортер шкребковий" > `.card-body` > `.row` > `.col-sm` (carousel, two slides, `.fixed-img` 500 px high) + `.col-sm` (form). Carousel controls restyled in `src/calc_sh_t/src/calc_sh_t.css`.

#### 1.2.1 Bugs and dead code (calc_tsh)
- Page heading says "Ще не працює!" and the computed value is only a motor recommendation. No price.
- `tsh_parts_price` is fetched and never used. `window.MR_DATA` is set but only read by nothing.
- `recommendedKwt` and `recommendedKwtDebug` duplicate the same ~25 lines (copy-paste).
- Google Apps Script endpoints: response may be a string or `{data: [...]}`; code handles both, but failures are only `console.error`. No UI error state.
- Stray text `Agrohelix236` (line 23) before the nav.
- Two `<img>` tags in the carousel have both a static `src` and a `:src` binding (static is overwritten by Vue).
- `calc_tsh.html` references `src/calc_sh_t/src/vue.js` as its "vue" file. Misleading name, not a bug.
- `data_shkr` array accumulates data for debugging.
- Scraper image `Scraper_conveyor2.png` vs `banner22.jpg` choice is driven by distributor state.

### 1.3 `calc_sh_t3.html` + `calc_sh_t3.js` (not in nav; newer screw calc)

- Same engine/motor tables and price base as `calc_sh_t2.js`, but **`prace_vue()` drops the third ×1.15 step and the drive markup**:
  `T = trunc(trunc(B·bonus·1.15)·1.1)` (no final ×1.15), engine price = `E₂` (no ×1.1).
- Adds `SHNEK_API = ''` (empty, so `initShnekApi()` falls back to `renderScrewInfo()`; no fetch happens) and `getParam()` reading `?shnek_id=`/`?row=`. Also `estimateSpiralMassPerMeter`, `estimatePipeMassTotal`, `deriveScrewSpec`, `renderScrewCostSummary` (not analysed in detail).
- Stylesheet link `calc_sh_t.css` also broken (same missing root file).

### 1.4 `sclad_sp2.html` + `sclad_sp2.js` (Цільнокатана спіраль, stock list)

**Purpose:** Stock list of seamless spiral (цільнокатана спіраль) items. Filters a Google Sheet dataset, shows stock, remaining metres, and computed wholesale/retail prices per item.

**Inputs**

| Control | Id | Default | Notes |
|---|---|---|---|
| Text filter "Введіть параметр" | `#dd` | empty | Syntax below |
| Radio "table" | `#option2` (name `options`, value `table`) | checked on desktop (width ≥ 800) | |
| Radio "block" | `#option1` (name `options`, value `block`) | checked on mobile (width < 800) | JS sets on ready |
| Hidden radio group "of" / "Manager" | `#option3` / `#option4`, `display:none` | `of` checked | Same `name="options"` as above (see bugs) |
| Button "Фільтрувати" | `onclick="displayContent()"` | — | Enter key and form submit also call it |

**Filter syntax (`filterByDd`, lines 133–174):**
- `""` → all rows.
- `*d` → rows where `item.d == d`.
- `*a-b` → for each integer `i` in `[a..b]`, rows with `item.d == i` (concatenated).
- `a-b` → for each integer `i` in `[a..b]`, rows with `item.dd == i`.
- otherwise → `item.dd === dd` (strict equality on a string from the input).

**Data sources (`$.ajax`, jQuery 3.6.0 from ajax.googleapis):**
- `https://script.google.com/macros/s/AKfycby1pO_94xtHo1m6LhtMEB8RlsBt6XkIq3FNSgTktGHn0xHmTrPjuJiNLy0CminF7t-YtQ/exec` → saved to `localStorage['sclad_sp_json']` (stock rows).
- `https://script.google.com/macros/s/AKfycbyWDKmixxIOMG-ci3evfbLorrkXX41_bP6qmAWqR24Y_36HAZ6bnfYJ7OZwKjs_Dwi9Zw/exec` → saved to `localStorage['move_sp_json']` (movement rows with `id|ID|n_p`, `dt`, `kt`).

Stock row fields used: `dd` (outer diameter), `d` (diameter used as π·d in the helix length), `p` (pitch), `s` (thickness), `l` (length, m), `l_r` ("Права" → R, else L), `sclad`, `stilaj`, `place_on_sclad` (location), `n_p` (id), `saldo_prc` (pieces). Movement rows: `id|ID|n_p`, `dt`, `kt`.

**Formulas (copied; `sp_dd`=dd, `sp_d`=d, `sp_p`=p, `sp_s`=s):**

```js
length_inner_line(sp_d, sp_p)  = Math.sqrt(Math.pow(Math.PI * sp_d, 2) + Math.pow(sp_p, 2));
hight_shtrips(sp_dd, sp_d)     = (sp_dd - sp_d) / 2;
count_segment_on_m(sp_p)       = 1000 / sp_p;
leangrth_shtrp_on_m(len_inner, cnt) = len_inner * cnt * 1.3;
mass_m_spirall(sp_s, h, L)     = (sp_s * h * L * 0.00786) / 1000;
price_rozdr(m) = Math.round((m * 1.1 * 60 * 6 * 1.1) / 3) * 3;
price_opt(m)   = Math.round((m * 1.1 * 60 * 5 * 1.1) / 3) * 3;
// per row: len_inner, h = (dd-d)/2, cnt = 1000/p, L = len_inner*cnt*1.3, mass = s*h*L*0.00786/1000
```

Hardcoded constants: `1.3` (strip length factor), `0.00786` (density in g/mm³, same as steel 7.86 g/cm³; inference, code has no comment), `1000`, `1.1`, `60`, `6` (retail), `5` (wholesale), rounding to 3. Meaning of `60` not in code (likely price per kg; not stated).

Adjusted stock: `saldo_prc` plus movements: for each movement with matching id, `adj = adj - kt + dt`, clamped at 0. Shown: `adj` pieces, `adj × l` metres (`roundToDecimal`, 1 decimal).

**Outputs:**
- Table mode (`#table_resault`): columns N_p, Парам (`dd/d/p/R|L S-s мм.`), L(м.), ШТ, Залиш (metres), Склад (`sclad*stilaj*place_on_sclad`), Роздр (price_rozdr), Опт (price_opt).
- Block mode: `.product-block` cards with the same data.
- Sticky header clone (`#sticky-header-container`) on scroll.

**Layout:** Bootstrap 4.3.1 `.container` with nav, `.form-inline` filter row, `.product-container`. Custom `.product-block` (1 px black border, 10 px padding).

#### 1.4.1 Bugs and dead code (sclad_sp2)
- Data is only rendered on user action. On load, `#option1`/`#option2` `.trigger('change')` calls `displayContent()` before the ajax results arrive (usually empty). There is no re-render when the fetch completes.
- `localStorage` cache is not refreshed on failure; error path only logs. Stale data persists.
- `filterByDd` exact branch `item.dd === dd` is strict. Range and `*` branches use `==`. If the sheet returns numbers, the exact search never matches a string input.
- `*d` branch and plain range branch use different keys (`d` vs `dd`). Easy to misread.
- `calculateAdjustedSaldoPrc` re-parses `localStorage` for every row (O(N × M)).
- Debug `console.log(a)`, `console.log("a")`, `console.log("Movement data loaded...")`.
- Nested `$(document).ready` inside another `$(document).ready`, both attaching duplicate handlers.
- `updateStickyHeader` runs on every `scroll`; it appends a new container to `<body>` on first call only (ok) but re-syncs thead HTML on every scroll.
- Radio group `of/Manager` (hidden) shares `name="options"` with table/block. Browser radio grouping means `prop('checked')` changes can deselect one another. Works now, fragile.
- Values from the sheet are interpolated into `innerHTML` without escaping (XSS if the sheet contains markup).
- Output has a literal `.м` suffix after the length (`${x}.м`), probably meant " м.".
- `customSort` sorts with `a.dd - b.dd`, which yields NaN for non-numeric strings.
- The page title "Спіраль цільнокатана" vs nav label "Цільнокатана спіраль" (cosmetic).
- Commented `alert("Hello 38")` (dead).

### 1.5 `nkz/kalk_nkz.html` + `nkz/js/*.js` (НКЗ, bucket elevator)

**Purpose:** Full price calculator for a НКЗ bucket elevator (норія). Chooses belt or chain, sections, buckets, fasteners, drive; outputs a total and a printable calculation.

**Scripts (load order):** jQuery 3.6.0 (ajax.googleapis), `vue@2` from `cdn.jsdelivr.net/npm/vue@2/dist/vue.min.js` (**not pinned to a version**), `nkz/vue.js` (one line: `new Vue({ el: "#app-4" })`, no data/template), `js/mr_kaskad_selektor_choise.js`, `js/info_accordion.js`, `js/script.js`, `js/shaft_schema.js`, `js/passport_export.js`, `js/fab_menu.js`. CSS: Bootstrap 4.3.1, `nkz/style.css`, `nkz/fab.css`.

**Inputs**

| Control | Id | Options / default |
|---|---|---|
| Норія type | `nkz_type` | НКЗ-5 (5), НКЗ-10 (10), НКЗ-25 (25), НКЗ-50 (50), НКЗ-100 (100), НКЗ-175 (175), НКЗ-200 (200). Default: first (5) |
| Висота робочої частини (m) | `nkz_l` (number) | placeholder "1–30"; clamped to 1..30 integer; empty if NaN |
| Мотор-редуктор виробник / тип / модель | `drive_saler` / `drive_type` / `drive_item` | options from `NKZ_data.g_motor` |
| Ланцюгова (chain) | `lan_check` | only visible for types 10, 25, 50 |
| Стрічка/ланцюг (belt/chain) | `conv_item` (in collapsible "стрічка, ланцюг") | auto-picked (see formula) |
| Ківші (buckets) | `busket_item` (created by JS) | auto-picked (largest dimension) |
| Розрахувати | button `onclick="updatePricesSummary()"` | output `#calc_total_price` |

Also: "Інфо" accordion (`info-content`) with sections: `info-belt`, `info-buckets`, `info-fasteners`, `info-shafts` (with SVG shaft schema and thickness selectors), `info-paint`, `info-prices`. Floating button (`.fab-btn`) with two actions: `exportNkzPassport()` and `exportNkzPriceTxt()` (from `passport_export.js`).

**Data source:** single Google Apps Script endpoint `https://script.google.com/macros/s/AKfycbz_KMcNXy5f_LuvnduJS3P_IgM1z0Jukn8P78JmGSGAal8qennLE0WJKCEziNQL8UPE/exec`, fetched once with `fetch` and a 15 s `AbortController` timeout. Result stored in `NKZ_data` (keys used: `prod`, `conv_chain`, `conv_belt`, `busket`, `metiz`, `noria`, `g_motor`, `privod_nkz`). Field names as used in code:
- `prod`: `n_2` (type code 1..7), `chain` ("1" for chain), `name_3`, `full_n`, `thinks_mine_nkz` (thickness list, JSON or CSV), `count_busket`.
- `conv_chain` / `conv_belt`: `set_on` (comma list of product codes), `name_1`, `name_2`, `width`, `s_material`, `sale_price` (or `$_sale_price`, `$_price`), `full_n`.
- `busket`: `set_on`, `width`, `depth`, `volume_litr`, `name_1`, `name_2`, `type_and_material`, `name_3`, `s_material`, `mitiz` (metiz code), `count_metiz`, `full_n`.
- `metiz`: `full_n`, `full_name`, `name_1..3`, `weight` (kg), `sale_price`.
- `noria`: `name_1` (e.g. "Рамка шахти ", "Шахта оглядова", "Шахта 1м.", "Шахта ланцюгова 1м.", "Башмак в зборі", "Голова привідна в зборі"), `set_on`, `kg`, `sale_price`/`$_sale_price`/`$_price`.
- `g_motor`: `saler`, `type`, `kwt`, `gab`, `full_n`, `full_name`, `sale_price`.
- `privod_nkz`: auto-detected columns: a type column (values 5/10/25/50/100/175/200), a kW column (values in {1.1,1.5,2.2,3,4,5.5,7.5,9.2,11,15,18,22,30,37,45,55}), and two height columns (`h_from` = smaller average, `h_to`).

**Hardcoded values and formulas (copied / summarised from code):**

Heights (`script.js` lines 54–71):

```js
baseHeights = { '5': (720+955)/1000, '10': (720+955)/1000, '25': (955+1080)/1000,
                '50': (955+1080)/1000, '100': (1350+1210)/1000, '175': (1500+1500)/1000, '200': (1500+1500)/1000 };
// one section = 30 mm
let v = nkz_l (1..30);
half = Math.floor((v-1)/2);
if ((v-1)/2 === half) { one = 0; two = half; } else { one = 1; two = half; }
// revision section count (rev) is fixed at 1
total_h_nkz = round3( (one + two + rev) * 30/1000 + v + baseHeights[type] );
rob_h_nkz   = round3( (one + two + rev) * 30/1000 + v );
```

Belt/chain length and bucket count (`updateConvLengthAndPrice`, script.js ~960–1000):

```js
isChainTargetType = chainChecked && (type == 25 || type == 50);
len = isChainTargetType ? (total_h_nkz * 4 + 2) : (total_h_nkz * 2 + 1);   // metres
chain_belt_l = max(0, round2(len));
price_chain_or_belt = round2(chain_belt_l * conv.sale_price);
total_count_busket = ceil( isChainTargetType ? chain_belt_l * cb / 2 : chain_belt_l * cb ); // cb = prod.count_busket
```

Default belt/chain choice (`__defaultConvIndex`): sort candidates by price ascending and take index `floor(n × 0.7)` (70th percentile).
Default bucket choice (`__defaultbusketIndex`): largest of `max(width, depth)`, else volume.

Fasteners (`updateFasteners`, script.js ~1080–1130):

```js
bolt_count   = ceil(total_count_busket * busket.count_metiz);
bolt_weight  = bolt_count * metiz.weight;
bolt_price   = round2(bolt_weight * metiz.sale_price);       // sale_price used per kg (labelled "/кг" in print)
nut_count    = ceil(bolt_count * 2);                          // hardcoded ×2
nut_price    = round2(nut_count * nut.weight * nut.sale_price);
washer_count = bolt_count;                                    // noriyna washer, 1 per bolt
washer_price = round2(washer_count * washer.weight * washer.sale_price);
// nut/washer found by name: contains "гайка", or "шайба" and "нор"; matched to thread size "M\d+" from busket.mitiz / metiz name
```

Shafts (`updatePricesSummary`, script.js ~375–470; per-section unit rates):

```js
wRperMm = frame && rev   ? wFrame*2 + wRev   : 0;   // revision
pRperMm = frame && rev   ? pFrame*2 + pRev   : 0;
wMperMm = frame && shaft1m ? wFrame*2 + w1m  : 0;   // meter
pMperMm = frame && shaft1m ? pFrame*2 + p1m  : 0;
wTperMm = frame && shaft1m ? (wFrame*2 + w1m*2)*2 : 0;  // two-meter
pTperMm = frame && shaft1m ? (pFrame*2 + p1m*2)*2 : 0;
// per thickness group: weight = round2(wPerMm × count × thickness), price = round2(pPerMm × count × thickness)
// shaft1m = "Шахта ланцюгова 1м." if chain checked, else "Шахта 1м."
// frame = name "Рамка шахти " (note trailing space)
```

Thickness: `shaft_thickness` per type (defaults = minimum of `thinks_mine_nkz`, else 1.5); individual sections can override via selects in `renderThicknessSelectors`. Options: `thinks_mine_nkz` values plus 0.5 mm steps from the minimum up to 5 mm.

Total (`updatePricesSummary`):

```js
total = conv.price + buckets.total + bolt.price + nut.price + washer.price
      + revision.price + meter.price + twometer.price + bashmak.price + head.price + drive.price;
// round2. Drive price = __parsePrice(drive) = sale_price (fallback $_sale_price, $_price).
```

Drive auto-selection (`updatePrivodKwtInfo` → `autoSelectDrive('techno_privod', "Черв'ячний", kwt)`): finds the `privod_nkz` row with matching type and `h_from ≤ nkz_h ≤ h_to`, takes its kW as required. Then, among `g_motor` rows with saler `techno_privod`, type `Черв'ячний`, `kwt ≥ required`: pick the smallest kW, then the largest `gab`.

Hardcoded in `mr_kaskad_selektor_choise.js`: saler "techno_privod", type "Черв'ячний". Hardcoded in `script.js`: `nkzTypeMap` (5→1, 10→2, 25→3, 50→4, 100→5, 175→6, 200→7), chain allowed only for 10/25/50, names "Шахта 1м.", "Шахта ланцюгова 1м.", "Рамка шахти ", "Шахта оглядова", "Башмак в зборі", "Голова привідна в зборі".

Money display: `__fmtUA` uses `Intl.NumberFormat('uk-UA', 2 decimals)`. The "ПДВ" labels are present in text ("грн з пдв").

Print/download (`window.__buildPriceHTML`): standalone HTML with table rows, opens `window.print()` on load. Download file name `nkz_<type>_h<height>_price.html`.

Passport (`passport_export.js`): builds an HTML and a hand-written PDF from fields on the page; PDF text includes fixed lines "Заземлення", "Монтаж при знеструмленні", "Ознайомлення з інструкцією" (in canvas summary). Not analysed in detail.

**Outputs:** `#total_price_label` (in the "Ціни" accordion), `#calc_total_price` (next to "Розрахувати"), `#info-prices` table (breakdown), `.gab_vis span` (габаритна висота, m) and `.rob_vis span` (робоча висота, m), `#drive_kwt_info` ("Рекомендована потужність приводу: X кВт").

**Layout:** `.container` > `.card` > `.card-header` "Норія" > `.card-body` > `.row` > two `.col-sm`: left = image card (`/img/nkz/Screenshot_1.png`, 500 px high via `nkz/style.css`) with collapsible "Інфо" accordion; right = `#app-4` form.

#### 1.5.1 Bugs and dead code (NKZ)
- Implicit globals: `NKZ_data = {}`, `total_h_nkz = 0`, `rob_h_nkz = 0`, `nkz_conv`, `chain_belt_l`, `price_chain_or_belt`, `total_count_busket`, `busket_metiz*`, `nkz_busket`, `drive` (declared with `let` in another file). Fragile load order.
- `vue@2` CDN link is unpinned (the page's rules require an exact version). `nkz/vue.js` only mounts Vue on an element with no template; Vue is loaded for nothing.
- `__getbusketDataset()` has two identical branches (`a` and `b` both `NKZ_data.busket`).
- `count_nkz_section.revision_secton` is always 1 (no UI). Revision section weight/price are always included.
- `updateConvLengthAndPrice` uses the chain formula only for types 25 and 50. For type 10 with the chain checkbox on, the belt formula is used. Possibly intended, possibly not.
- `nkzHeights` / `window.l_nkz_*` arrays (script.js lines 71–78) are built but not read by any file in `nkz/js/`.
- `__buildPriceHTML` title and fields are not HTML-escaped (local data, low risk).
- Many `try { } catch (_) {}` blocks silently swallow errors, which hides failures.
- `NKZ_HEIGHT` writes the value back to the input on every keystroke and sets `count_nkz_section` in a nested `setHeight` arrow function that ignores its argument (`val` unused).
- `__busketLength` uses `max(width, depth)` but `__defaultbusketIndex` picks the largest with `sorted[0]`, so ties are not handled.
- Duplicate definition of `shaft_thickness` and `window.shaft_thickness`. Harmless.
- `nkz/js/script.js` line 3 comment contains the endpoint URL (duplicate of constant).
- `.gitignore` lists `nkz/Паспорт.pdf` (local file only).

### 1.6 `pages/price_spiral.html`, `pages/price_spiral2.html`, `pages/commercial.html`

- `price_spiral.html` and `price_spiral2.html` are email HTML exports (table layouts, Gmail proxy image URLs `ci3/ci4/ci5/ci6.googleusercontent.com`, flashissue links). Visible text: "Цільнотянута спіраль ... Розміри від 80 мм. до 600 мм.", contacts (phones (067) 549 47 48, (067) 767 31 81, emails `zavod.elevator@gmail.com`, `khzett@ukr.net`, `contak336@ukr.net` in v2), site `khzett.com.ua`. Prices are not in text (they are images, if any). **No price numbers in the HTML.**
- `commercial.html` is a placeholder with `<h1>commercial proposal</h1>`.
- No nav, no JS, no CSS links. Not in the site nav.

### 1.7 Shared CSS/JS not used by the four calculators

- `src/style.css` (467 lines): template CSS. Sets `body * { font-family: 'Montserrat', sans-serif !important }` but no `@import` / Google Fonts link is present. Colours: `#D1AC00` (logo background), `#666`, `#f1f1f1`, `#ccc`, `rgb(228,254,0)`, white overlays `rgba(255,255,255,0.65)`. Used only by `khzet_files_andprogects/list_katalog/*.html`.
- `src/main.js` and `src/main2.js`: jQuery hover animations for `.services .service` and `.services .serv-list .item1..3` (fadeIn/fadeOut with `.hover`/`.title`). Not referenced by any HTML in the repo (`main2.js` is a copy).
- `src/calc_sh_t/src/calc_sh_t.css` (132 lines): body `#f8f9fa`, Arial; `.container` max 1200 px, padding 20 px; `.card` margin-top 20 px and box-shadow `0 2px 4px rgba(0,0,0,0.1)`; `.fixed-img` 500 px high; `.label-title` grey (`gray`) 0.9em; carousel controls 48 px round, `rgba(0,0,0,0.65)`, white border.
- `nkz/style.css` (39 lines): `.product-block` (1 px `#000` border, 10 px padding), `.card-info .info-toggle` black button with white text, `.card.mb-3` collapse transition (0.4 s), `.card-img-top` 500 px high.
- `nkz/fab.css` (47 lines): `.fab-btn` fixed top 100 px, right 50 px, 56 px circle, `#007bff`, z-index 1100; `.fab-menu` below it, white card with `#dee2e6` border, 8 px radius, min width 240 px.

---

## 2. Shared UI and look

### 2.1 CSS framework and CDN links

| Page | Bootstrap CSS | Other CSS |
|---|---|---|
| `calc_sh_t2.html` | 4.3.1 `https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css` (SRI sha384-ggOyR0iX...), `crossorigin="anonymous"` | `calc_sh_t.css` (**missing at root**) |
| `calc_sh_t3.html` | 4.3.1 stackpath (no SRI) | `calc_sh_t.css` (**missing at root**) |
| `calc_tsh.html` | 4.3.1 stackpath (SRI) | `src/calc_sh_t/src/calc_sh_t.css` (exists) |
| `sclad_sp2.html` | 4.3.1 stackpath (SRI) | inline `<style>`: `.product-block` |
| `nkz/kalk_nkz.html` | 4.3.1 stackpath (SRI) | `./style.css`, `./fab.css` |
| `khzet .../list_katalog/*` | (see those files) | `./src/style.css` |

Favicon on every calc page: `https://fonts.gstatic.com/s/i/materialiconsoutlined/home/v6/24px.svg` (a Material "home" icon, not a site logo).

### 2.2 Navbar (identical on all four calculators)

`<nav class="navbar navbar-expand-lg navbar-light bg-light">` with brand "Agrohelix" → `https://agrohelix.com.ua/`, toggler `#navbarNav`, items in this order:

1. Шнековий транспортер → `https://zavodelevator.github.io/calc_sh_t2.html`
2. Цільнокатана спіраль → `https://zavodelevator.github.io/sclad_sp2.html`
3. ТШ → `https://zavodelevator.github.io/calc_tsh.html`
4. НКЗ → `https://zavodelevator.github.io/nkz/kalk_nkz.html`

Active item is set per page with class `nav-item active`. Note the first item also contains `<span class="sr-only">(current)</span>` on every page (wrong on the others). `calc_tsh.html` has a stray "Agrohelix236" paragraph before the nav.

### 2.3 Layout pattern

```
body
  nav.navbar.navbar-expand-lg.navbar-light.bg-light
  .container
    .card
      .card-header   <title of calculator>
      .card-body
        .row
          .col-sm  (left)  .card.mb-3 > img.card-img-top (product photo, 500 px high) + .card_price / Info accordion
          .col-sm  (right) .form-group > label + select.form-control ... + button.btn.btn-dark "Розрахувати"
                           .table-responsive > table.table.table-sm.table-borderless > tr th "Ціна" | td span.price
```

- Output row: `<th class="pl-0 w-25"><strong>Ціна</strong></th><td><span class="price">…</span></td>`.
- Spacer blocks: `<div style="width:10px;height:30px">` and up to 60 `<br>` tags (calc_sh_t2). Use proper margins instead for new pages.
- Images: `/img/shnek_trans/sh_t_21_krot.jpg` (calc_sh_t2), `/img/nkz/Screenshot_1.png` (nkz), `src/calc_sh_t/src/img/*.jpg` (calc_tsh).

### 2.4 Colours and fonts (values actually used)

| Token | Value | Where |
|---|---|---|
| Page bg | `#f8f9fa` | `calc_sh_t.css` |
| Nav bg | Bootstrap `bg-light` | all calc pages |
| Primary buttons | `btn-dark` (Bootstrap default) | calcs |
| Info button | `btn-info` (Bootstrap default) | sclad_sp2 |
| Brand accent | `#D1AC00` | `src/style.css` (list_katalog only) |
| Muted text | `gray` / `#555` / `#6c757d` | calc_tsh, NKZ |
| Danger text | `text-danger` (Bootstrap) | calc_sh_t2 productivity heading |
| FAB | `#007bff` | `nkz/fab.css` |
| Font | Arial, sans-serif (calc_sh_t.css body); Bootstrap default stack elsewhere; Montserrat declared in `src/style.css` but never loaded | |

### 2.5 Reusable starter for a new page (same look)

Load in `<head>`: the Bootstrap 4.3.1 CSS link above, `<meta charset="utf-8">`, the viewport meta, then the calc-page CSS from `src/calc_sh_t/src/calc_sh_t.css` (body bg, `.container`, `.card`, `.fixed-img`). Use the same navbar markup, `.container > .card > .card-header + .card-body > .row > .col-sm` layout, `form-control` selects, and `btn btn-dark` buttons.

---

## 3. Shared JS libraries

| Library | Version | Pages | Source |
|---|---|---|---|
| jQuery | 3.3.1 slim (SRI) | calc_sh_t2.html, calc_sh_t3.html | code.jquery.com |
| jQuery | 3.3.1 full | calc_tsh.html | code.jquery.com |
| jQuery | 3.6.0 | sclad_sp2.html, nkz/kalk_nkz.html | ajax.googleapis.com |
| Popper.js | 1.14.7 (UMD) | calc_sh_t2.html (SRI), calc_tsh.html, calc_sh_t3.html | cdnjs |
| Bootstrap JS | 4.3.1 | calc_sh_t2.html (SRI), calc_tsh.html, calc_sh_t3.html | stackpath |
| Vue | 2.6.14 (`vue.min.js`) | calc_tsh.html | cdn.jsdelivr.net/npm/vue@2.6.14/dist |
| Vue | `vue@2` (unpinned major) | nkz/kalk_nkz.html | cdn.jsdelivr.net/npm/vue@2/dist |

Notes: Vue is used only in `calc_tsh.html` (app data/computed/methods) and as a trivial mount in NKZ. The calc_sh_t2 page is pure jQuery. Google Apps Script endpoints are called from the browser with jQuery `$.ajax` (ТШ, sclad_sp2) and `fetch` (NKZ). The NKZ page also uses the native `Intl.NumberFormat`, `Blob`, `URL.createObjectURL` and `canvas` for export.

---

## 4. Broken, dead or buggy code (summary)

**Broken links / missing files**
1. `calc_sh_t2.html` and `calc_sh_t3.html` link `calc_sh_t.css` at root, which does not exist (`src/calc_sh_t/src/calc_sh_t.css` does). Stylesheet 404.
2. `calc_tsh.html` loads `src/calc_sh_t/src/vue.js` as its app, but the folder's `src/calc_sh_t/calc_sh_t.js` is 0 bytes (unused).
3. Root `/` has no `index.html` on this branch.
4. `nkz/kalk_nkz.html` image `/img/nkz/Screenshot_1.png` exists; `calc_sh_t2.html` image `/img/shnek_trans/sh_t_21_krot.jpg` exists.

**Calculation bugs**
5. `calc_sh_t2.js`: production calc (`calck_production`) is never called; if enabled it throws (`params_inner_volume_pipe` undefined).
6. `calc_sh_t2.js`: 250 mm table row `[250,11,5]` should be `[250,9,…]`; length 9 has no kW, length 11 double-listed.
7. `calc_sh_t2.js`: gearbox mode adds 3000 even with "Без мотор-редуктора" selected (intent unclear).
8. `calc_sh_t3.js` price omits a markup step and the drive markup relative to `calc_sh_t2.js` (two different prices for the same config).
9. `sclad_sp2.js`: exact search `item.dd === dd` strict; `*`/range use `==`. Empty first render on load (no re-render after ajax).
10. `sclad_sp2.js`: `${x}.м` literal output; `innerHTML` with unescaped sheet values.
11. `nkz/js/script.js`: `updateConvLengthAndPrice` uses belt length for type 10 with chain checked.
12. `nkz/js/script.js`: implicit globals and `try/catch {}` blanket swallowing hide failures.

**Dead / unused**
13. `calc_tsh`: `tsh_parts_price` fetched, never used; `selectedMrId`, "Тип короба", "Тип покриття" never affect output; "Ще не працює!".
14. `calc_tsh`: `recommendedKwt` and `recommendedKwtDebug` duplicated.
15. `src/main.js`, `src/main2.js`: not referenced by any page.
16. `nkz/vue.js`: one-line Vue mount with no template.
17. `pages/price_spiral*.html`: newsletter exports, no prices in text.
18. Folders `busket/`, `src/basik/`, `src_sklad_sp/`, copies `* — копия.*` in `img/`, `src/` (not analysed).

**Other**
19. Unpinned `vue@2` on NKZ page (not an exact version; the other CDN scripts are pinned).
20. Debug output shown to visitors: `#price_debug_ex` (calc_sh_t2), `.temp-debug` box (calc_tsh), `console.log` throughout.
21. Google Apps Script endpoints hardcoded in three pages (ТШ, sclad, NKZ); no fallback when they fail.
