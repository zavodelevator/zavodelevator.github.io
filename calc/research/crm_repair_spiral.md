# Research 01: ScrewRepairCalculator and SpiralCalculator (read-only)

Repo: /home/user/new_ax_crm. No repo files were modified.

## 0. Scope notes and discrepancies with the brief

- The brief's view paths do not exist: `app/views/calculators/_repair_form.html.erb` and `_spiral_form.html.erb` are absent. No ERB form for either calculator exists in `app/views/calculators/`. Inputs for both appear only as Ruby params (below) and as JS in the shnek workspace (`app/javascript/lib/shnek_core.js`, `shnek_workspace_controller.js`, `shnek_detail_controller.js`). Those JS files were NOT extracted in full, so the UI inputs and their defaults are unverified.
- Neither calculator is in `CalculatorsController::CALCULATOR_CLASSES` (only noria and shnek are). Live callers found:
  - `SpiralCalculator`: `app/services/crm_mcp/calc_tools.rb:178` (quantity 0, material_price from Material); `app/services/specs/capture.rb:9`.
  - `ScrewRepairCalculator`: `app/services/specs/capture.rb:11` and tests only.
  - `shnek_save` maps `repair` to `screw_repair` and `spiral` to `spiral` for storage; the JS shnek_core.js ports the spiral price logic (`k = allowance × coef`, `RHO = 7.85`) instead of calling Ruby.
- `ScrewGeometry::PI = 3.14`, not `Math::PI` (see §4).
- Files read: `screw_repair_calculator.rb`, `spiral_calculator.rb`, `spiral_stock_service.rb`, `screw_geometry.rb`, `screw_weight.rb`, `screw_pricing.rb`, `traceable.rb`, `base_calculator.rb` (not used by either calculator), `screw_segment_calculator.rb` (called by repair for `spiral_type=segments`), `db/seeds/pricing_parameters.rb`, `db/seeds/calculator_material_configs.rb`, `db/seeds/calculator_formula_models.rb` (no repair/spiral entries), migrations `20260608120001_seed_spiral_steel_material.rb`, `20261023000001_seed_shnek_core_pricing_parameters.rb` (only `shnek_core_%` keys, not repair/spiral), `app/models/pricing_parameter.rb`.
- Not read: `shnek_core/config.rb` contents (defines `spiral.allowance`, `coef_wholesale`, `coef_retail`, `seg_coef`), `_shnek_detail.html.erb` JS, `Specs::Specifiable`, `Pricing::Rounding`, `CalculatorMaterialConfig` model, `Material` model.

### Shared helpers (exact)
- `PricingParameter.value_for(key, default:)` = `all_as_hash.fetch(key.to_s, default.to_f)`. A DB value overrides the in-code default when present.
- `ScrewPricing.ceil_to_3(n)`: `n = n.ceil; n + (3 - n % 3) % 3` (ceil to a multiple of 3, not a round).
- `ScrewPricing.round_to_3(c)` = `ceil_to_3(c)`.
- `ScrewPricing.round_with_vat(c)` = `ceil_to_3(c * 1.1)`.
- `ScrewWeight::STEEL_DENSITY = 7.85`.
- `ScrewWeight.tube_weight_kg(w, D, L)` = `w * 0.02465 * (D - w) * L`.
- `ScrewWeight.d31_per_meter(bi, fh, p, s)` = `sqrt((Math::PI*bi)**2 + p**2) * (1000.0/p) * fh * s * 7.85 / 1_000_000`.
- `ScrewWeight.flight_weight_per_turn(bo, fh, s)` = `(bo - fh) * fh * 0.02466 / 1000 * s`.
- `ScrewWeight.segment_blank_weight(bo, s)` = `bo**2 * s * 7.85 / 1_000_000` (see §5, trace text disagrees).
- `ScrewGeometry`: `helix_angle_deg(d, p) = atan(p.to_f / PI / d) * 180 / Math::PI` with `PI = 3.14`; `cos_val(deg) = cos(deg*Math::PI/180)`; `d1 = d_inner / cos`; `blank_inner = d1 * 1.038`; `blank_outer = d_outer - d_inner + blank_inner`; `flange_height = (bo - bi)/2.0`; `inner_helix = sqrt((Math::PI*d)**2 + p**2)`; `outer_helix = sqrt((Math::PI*D)**2 + p**2)`.
- `cut_angles(d_inner, bi, hd)`: `d1 = d_inner / cos(hd)`; `excess = PI*(bi - d1)` (PI = 3.14); `angle_p = atan(excess/bi)*180/Math::PI*2`; `add_angle = atan(hd*0.32/bi)*180/Math::PI*2`; returns `angle_p`, `add_angle`, `cut_angle = angle_p + add_angle`, each rounded to 2 decimals.
- `Traceable#log_step` appends `{step, category, name, formula, result, unit}` to `@trace`. `Traceable#call` merges `trace:` into a Hash result.

---

## 1. SpiralCalculator (`app/services/calculators/spiral_calculator.rb`)

### 1.1 Inputs (params keys, all strings from the form or Hash)
| Key | Type | Default in code | Notes |
|---|---|---|---|
| `D` | float (mm) | `0` → error | outer diameter |
| `d` | float (mm) | `0` → error | inner diameter |
| `p` | float (mm) | `0` → error | pitch |
| `s` | float (mm) | `0` → error | strip thickness |
| `quantity` | int (turns) | `0` | if >0, turn count is manual |
| `length` | float (m) | `0` | used when quantity=0 |
| `material_price` | float (грн/кг) | `0` | if 0 and `material_id` present, taken from `Material.find_by(id:).price_per_kg` |
| `material_id` | id | nil | fallback for price |
No dropdowns in this class. Allowed values: none enforced in code.

Validation order: missing D/d/p/s → error `"Заповніть поля: <list>"`; then `mat_price.zero?` → `"Вкажіть ціну матеріалу (₴/кг)"`.

### 1.2 Step-by-step formula (in code order)
1. `h = (D - d) / 2.0` [mm] (trace "Висота штрипси")
2. `lm = sqrt((π·d)² + p²)` with `Math::PI` [mm] (`L_mean`)
3. `n = 1000.0 / p` [шт/м] (turns per meter), not rounded
4. `sl = lm * n * 1.3` [mm] (strip length per 1 m; 1.3 is a literal, not a PricingParameter)
5. `w1m = sl * h * s * 7.86 / 1_000_000.0` [кг/м]. Density literal 7.86, not 7.85 (see §5).
6. `eff_length = quantity > 0 ? (quantity.to_f / n).round(4) : length`
7. `turns = quantity > 0 ? quantity : (n * length).ceil`
8. `total_weight = w1m * eff_length` [кг]
9. `coef_wholesale = PricingParameter.value_for("spiral_coef_wholesale", default: 5)`; `coef_retail = value_for("spiral_coef_retail", default: 6)`
10. `sub_w = total_weight * 1.1 * mat_price * coef_wholesale`
11. `total_w = round_with_vat(sub_w)` = `ceil_to_3(sub_w * 1.1)`. **Applies VAT twice (see §5).**
12. `sub_r = total_weight * 1.1 * mat_price * coef_retail`
13. `total_r = round_with_vat(sub_r)` = `ceil_to_3(sub_r * 1.1)` (same double-VAT issue)

Return values (rounded for display): `strip_height = h.round(2)`, `L_mean = lm.round(2)`, `turns_per_m = n.round(3)`, `strip_length_1m = sl.round(2)`, `weight_1m = w1m.round(4)`, `eff_length`, `total_weight = total_weight.round(3)`, `pricing: { turns, mat_price, coef_wholesale, coef_retail, subtotal_wholesale: sub_w.round(2), vat_wholesale: (sub_w*0.1).round(2), total_wholesale: total_w, subtotal_retail: sub_r.round(2), vat_retail: (sub_r*0.1).round(2), total_retail: total_r }`.

Plus Traceable `trace` array.

### 1.3 Constants and default prices
| Key / constant | Value | Unit | Where defined |
|---|---|---|---|
| `COEF_WHOLESALE_DEFAULT` | 5 | × | spiral_calculator.rb:16 |
| `COEF_RETAIL_DEFAULT` | 6 | × | spiral_calculator.rb:17 |
| PricingParameter `spiral_coef_wholesale` | 5 | × | db/seeds/pricing_parameters.rb:11 |
| PricingParameter `spiral_coef_retail` | 6 | × | db/seeds/pricing_parameters.rb:12 |
| PricingParameter `spiral_overhead` | 1.1 | × | seeded (line 13) but **not read by SpiralCalculator** (literal 1.1 is used) |
| Literal `1.3` (strip length factor) | 1.3 | × | spiral_calculator.rb:54 (hard-coded) |
| Literal `7.86` (density) | 7.86 | кг/дм³ | spiral_calculator.rb:58 (hard-coded) |
| Literal `1.1` (VAT) | 1.1 | × | lines 77, 79, 82, 84 and ScrewPricing.round_with_vat |
| `ScrewPricing::MATERIAL_DEFAULTS` | (see §3) | грн/кг | not used by SpiralCalculator |
| Material price for spiral | from params, else `Material.price_per_kg` | грн/кг | runtime, not a constant |
| Stock service URL / cache | see §3 | — | spiral_stock_service.rb |

### 1.4 Outputs shown to user
`strip_height`, `L_mean`, `turns_per_m`, `strip_length_1m`, `weight_1m`, `eff_length`, `total_weight`, `pricing.*` (above), `trace`. Error hash on invalid input. The MCP tool (crm_mcp/calc_tools.rb:178+) uses `total_wholesale`/`total_retail`, computes `unit_price = to_multiple_of_3(calc_total / length)`, and warns if `s > SPIRAL_MAX_S` or `h` outside `SPIRAL_H_RANGE` (constants not read).

---

## 2. ScrewRepairCalculator (`app/services/calculators/screw_repair_calculator.rb`)

### 2.1 Inputs (params keys)
| Key | Default in code | Notes |
|---|---|---|
| `D` | 0 → error | outer diameter mm |
| `d` | 0 → error | inner diameter mm |
| `p` | 0 → error | pitch mm |
| `s` | 0 → error | spiral thickness mm |
| `screw_length` | 0 → error | m |
| `material_price` | 0 → error | грн/кг |
| `tube_length` | = `screw_length` if blank | m |
| `spiral_length` | = `screw_length` if blank | m |
| `tube_price` | `100.0` if blank (hard-coded, not a PricingParameter) | грн/кг |
| `spiral_type` | `""` | dropdown values seen in code: `"segments"` (segment path) or anything else (drawn) |
| `wall_thickness` (`wall`) | 0 | >0 means tube replacement |
Spec mapping (`spec_schema`): `diameter_mm→D`, `inner_diameter_mm→d`, `screw_pitch_mm→p`, `spiral_thickness_mm→s`, `length_m→screw_length`, `wall_thickness_mm→wall` (only if positive).
Validation: `[D, d, p, s, screw_length, mat_price].any?(&:zero?)` → `{error: "Заповніть усі обов'язкові поля"}`. Tube and spiral lengths are not validated.

### 2.2 Step-by-step formula (in code order)
A. Inputs: `replace_tube = wall > 0`.
B. `turns = ceil(spiral_length * 1000.0 / p)` (trace "Кількість витків").
C. Geometry (`geometry(D, d, p, s)`):
  1. `hd = atan(p / (3.14 × d)) × 180/π` (PI=3.14 inside ScrewGeometry)
  2. `cos = cos(hd × π/180)` (log rounded to 4 in the output)
  3. `d1 = d / cos`
  4. `bi = d1 × 1.038` (blank inner)
  5. `bo = D - d + bi` (blank outer)
  6. `fh = (bo - bi) / 2`
  7. `ca = cut_angles(d, bi, hd)` → `{angle_p, add_angle, cut_angle}`
  8. `il = sqrt((π·d)² + p²)` (trace "d26")
  9. `ol = sqrt((π·D)² + p²)`
  10. Output geometry: `helix_angle_deg = hd.round(2)`, `cosine_value = cos.round(4)`, `d1 = d1.round(2)`, `inner_diam_calc = bi.round(2)`, `outer_diam_calc = bo.round(2)`, `flange_height = fh.round(2)`, `weight_per_turn = flight_weight_per_turn(bo, fh, s).round(3)` (uses unrounded bo, fh), `inner_helix_per_turn`, `outer_helix_per_turn` (2 dp), and cut angles (2 dp).
D. Spiral material:
  - if `spiral_type == "segments"` → `segments_cost` (below).
  - else `drawn_spiral_cost`:
    1. `coef_retail = PricingParameter.value_for("spiral_coef_retail", default: 6)` (`COEF_RETAIL_DEFAULT`).
    2. `bi = geo[:inner_diam_calc]` (rounded value), `fh = geo[:flange_height]` (rounded value).
    3. `d31 = d31_per_meter(bi, fh, p, s).round(4)` [кг/м]. Uses 7.85 density.
    4. `pre_vat = (d31 × spiral_length × mat_price × coef_retail).round(2)`
    5. `cost = round_with_vat(pre_vat)` = `ceil_to_3(pre_vat × 1.1)`.
    Note: this path uses the RETAIL coefficient only (no wholesale switch).
  - `segments_cost`: calls `Calculators::ScrewSegmentCalculator.new(D: geo.outer_diam_calc.to_s, d: geo.inner_diam_calc.to_s, p:, s:, material_price: mat_price, length: (spiral_length*1000).to_s, quantity: "0", coefficient: "", markup_pct: "0").call`, then `cost = seg.pricing.total_price.round(2)`. No VAT is added.
E. `tube_mat = replace_tube ? tube_material_cost(wall, d, tube_length, tube_price) : 0.0`
  - `tube_material_cost`: `w = tube_weight_kg(wall, d, tube_length)`; `cost = (w × tube_price).round(2)`.
F. `disasm = replace_tube ? 0.0 : disassembly_cost(D, tube_length)`
  - rate by D: `D >= 300 → 508.88`; `D >= 150 → 436.43`; else `290.95`. Then `cost = (tube_length × rate).round(2)`.
G. `assem = assembly_cost(tube_length, D)` = `(tube_length × 3.0 × D).round(2)` (**applied always**, see §5)
H. `balancing = (tube_length × 436.43).round(2)` (**applied always**)
I. `priming = priming_cost(D, d, tube_length, spiral_length, turns)`:
  - `spiral_m2 = (π × (D² - d²) × turns / 2_000_000.0).round(4)`
  - `pipe_m2 = (π × d × tube_length / 1000.0).round(4)`
  - `total_m2 = (spiral_m2 + pipe_m2).round(4)`
  - `cost = (total_m2 × 92.58).round(2)`
J. `total = spiral_mat + tube_mat + disasm + assem + balancing + priming` (no rounding of total itself)
K. `final = round_to_3(total)` = `ceil_to_3(total)`. Trace text says `ROUND(total/3;0)×3`, which is wrong (see §5).
L. Return `{ result: final, breakdown: {...}, geometry: geo }`; Traceable adds `trace`.
  breakdown: `inputs` (D, d, pitch_mm, thickness_mm, screw_length_m, tube_length_m, spiral_length_m, wall_mm, spiral_type, mat_price_kg, tube_price_kg, replace_tube), `computed: {turns}`, `costs: {spiral_material, tube_material, disassembly, assembly, balancing, priming, subtotal: total.round(2)}`, `summary: {formula: "ROUND(subtotal×1.1/3; 0)×3", final_price: final}`.

### 2.3 Constants and default prices
| Key / constant | Value | Unit | Where defined |
|---|---|---|---|
| `COEF_RETAIL_DEFAULT` | 6 | × | screw_repair_calculator.rb:19 (**unused**: code uses PricingParameter default 6 directly, same value) |
| `WASTE_FACTOR_DEFAULT` | 1.3 | × | screw_repair_calculator.rb:20 (**unused in class**) |
| PricingParameter `repair_waste_factor` | 1.3 | × | pricing_parameters.rb:17 (**not read by any code found**) |
| PricingParameter `spiral_coef_retail` | 6 | × | used as default 6 in drawn_spiral_cost |
| `tube_price` default | 100.0 | грн/кг | hard-coded in `call` (line 38) |
| `disassembly_rate_300` | 508.88 | грн/м | pricing_parameters.rb:20 (default in code line 167) |
| `disassembly_rate_150` | 436.43 | грн/м | pricing_parameters.rb:21 (default line 169) |
| `disassembly_rate_small` | 290.95 | грн/м | pricing_parameters.rb:22 (default line 171) |
| `assembly_rate` | 3.0 | грн/(м·мм) | pricing_parameters.rb:23 (default line 180) |
| `balancing_rate` | 436.43 | грн/м | pricing_parameters.rb:24 (default line 188) |
| `priming_rate` | 92.58 | грн/м² | pricing_parameters.rb:25 (default line 196) |
| `material_st3` / `09g2s` / `st45` / `aisi304` / `nerz` / `hardox` | 50 / 55 / 75 / 140 / 100 / 125 | грн/кг | pricing_parameters.rb:3–8 and ScrewPricing::MATERIAL_DEFAULTS (not used by the repair calc; it takes `material_price` from input) |
| Literal `3.14` (PI) | 3.14 | — | ScrewGeometry::PI |
| Literal `1.038` (blank inner factor) | 1.038 | — | ScrewGeometry.blank_inner_diam |
| Literal `0.02466` (flight weight) | 0.02466 | — | ScrewWeight.flight_weight_per_turn |
| Literal `0.02465` (tube weight) | 0.02465 | — | ScrewWeight.tube_weight_kg |
| Literal `0.32` (add-angle factor) | 0.32 | — | ScrewGeometry.cut_angles |
| Literal `7.85` (steel density) | 7.85 | кг/дм³ | ScrewWeight::STEEL_DENSITY |
| Literal `1.1` (VAT) | 1.1 | × | ScrewPricing.round_with_vat |
| Literal `2_000_000.0` | — | — | priming spiral area |

### 2.4 Segment sub-path (`spiral_type == "segments"`)
`ScrewSegmentCalculator` (`screw_segment_calculator.rb`) is called with `coefficient` blank, so `default_coefficient(s)`: `s == 3.0 → PricingParameter("segment_coef_s3", 3.5)`; `s == 2.0 → ("segment_coef_s2", 4.5)`; else `("segment_coef_default", 3.0)`. Engineering and pricing run through its own code:
- `blank_weight = bo² × s × 7.85 / 1e6` (uses ScrewWeight.segment_blank_weight)
- `price_per_piece = ceil_to_3(blank_weight × mat_price × coeff)`
- `qty = (length / pitch).round + 1` (length in mm)
- `total_price = qty × price_per_piece` (no markup, since markup_pct = "0")
Repair takes `pricing.total_price.round(2)` as spiral material cost. Coefficient values are from PricingParameter seeds (§3).

### 2.5 Outputs shown to user
`result` (final, грн, multiple of 3), `breakdown` (inputs, computed turns, cost components, subtotal, summary), `geometry` (see step C10), `trace` (list of steps with category, name, formula string, result, unit). Error hash on missing mandatory fields.

---

## 3. Other constants and seeds (both calculators)

### 3.1 Material prices
- `db/seeds/pricing_parameters.rb:3–8`: `material_st3=50`, `material_09g2s=55`, `material_st45=75`, `material_aisi304=140`, `material_nerz=100`, `material_hardox=125` (грн/кг).
- `db/migrate/20260608120001_seed_spiral_steel_material.rb`: creates `Material` rows `steel_strip_3` = 19.80, `steel_strip_4` = 20.50, `steel_strip_5` = 21.20 грн/кг (category `metal`). Creates spiral `CalculatorMaterialConfig` rows with `steel_strip_3` = `is_default: true`, `steel_strip_4`/`steel_strip_5` = false.
- `db/seeds/calculator_material_configs.rb`: spiral and screw_repair enabled matrices (see §5); `DEFAULT_MATERIALS["spiral"] = "material_dd11"`.
- `Material` `Сталь DD11` (key `material_dd11`) has no PricingParameter default; its price is in the Material table (not read).

### 3.2 Coefficients
- Spiral: `spiral_coef_wholesale = 5`, `spiral_coef_retail = 6`, `spiral_overhead = 1.1` (seeded, unused).
- Segments: `segment_coef_s3 = 3.5`, `segment_coef_s2 = 4.5`, `segment_coef_default = 3.0`.
- Repair: `repair_waste_factor = 1.3` (seeded, unused by any code found).

### 3.3 Stock service (`spiral_stock_service.rb`)
Not a formula. Fetches a Google Apps Script JSON (URL at line 6), cache key `spiral_stock_v4`, TTL 5 min. `similar_to`: keeps items with `|D - d_outer| <= 10` and `|d - d_inner| <= 5`; sorts by direction match then sum of diffs. Direction normalization: starts with "прав" → right; "лів" → left.

---

## 4. Outputs and precision notes
- Rounding summary (Ruby): ceil-to-3 is used for every "грн" total (`round_to_3`, `round_with_vat`, segment price). Other intermediate values use `.round(2)` or `.round(4)`.
- `ScrewGeometry::PI = 3.14` is used in `helix_angle_deg` and `cut_angles`, while `Math::PI` is used in `cos_val`, `inner_helix_per_turn`, `outer_helix_per_turn`, and the priming and d31 formulas. Mixed.

---

## 5. Unclear or contradictory items
1. **Double VAT in SpiralCalculator.** `sub_w` and `sub_r` already include `× 1.1`, then `round_with_vat` applies `× 1.1` again, giving an effective factor of 1.21. The trace text `ROUND(sub × 1.1 / 3) × 3` implies `sub` excludes VAT. Tests only check multiples of 3, so this is not caught. Verify with the business rule before porting.
2. **Repair assembly and balancing always applied.** Seed descriptions for `assembly_rate` and `balancing_rate` say "Лише при заміні труби" (only when replacing the tube). Code (lines 51, 52) computes them unconditionally. Tests do not check this.
3. **Rounding label mismatch.** Trace/summary text says `ROUND(x/3; 0)×3`, but the code is `ceil_to_3` (always up). Same for spiral `ROUND(...)`.
4. **Spiral density 7.86 vs 7.85.** SpiralCalculator's `w1m` uses 7.86. The JS side (`shnek_core.js` `RHO = 7.85`) and `ScrewWeight` use 7.85. Possibly intentional, not documented.
5. **Segment blank weight formula.** Trace text says `π×(bo²−bi²)/4 × s × 7.85/10⁶`. Code (`ScrewWeight.segment_blank_weight`) is `bo² × s × 7.85/10⁶` (no π/4, no bi). Trace and value disagree.
6. **Unused seeds and constants.** `spiral_overhead` (1.1), `repair_waste_factor` (1.3), `COEF_RETAIL_DEFAULT` and `WASTE_FACTOR_DEFAULT` in ScrewRepair are not used by the code paths. Changing these in the DB has no effect.
7. **Spiral default material conflict.** `calculator_material_configs.rb` sets spiral default to `material_dd11` (run on every seed, `update_all(is_default: false)` then sets DD11). Migration `20260608120001` sets `steel_strip_3` as default. Which wins depends on run order. Not resolved.
8. **Helix PI.** `helix_angle_deg` uses `3.14` for π inside the atan argument, but Math::PI elsewhere. Small error (~0.05%) but inconsistent.
9. **Tube price default** 100 грн/кг in ScrewRepair is hard-coded, not a PricingParameter.
10. **Repair spiral pricing ignores wholesale.** `drawn_spiral_cost` always uses `spiral_coef_retail` (default 6) and adds VAT once. SpiralCalculator uses both coefficients. Intentional? Not documented.
11. **`ScrewRepair` validation** does not check `tube_length`, `spiral_length`, or `wall_thickness`; zero spiral length gives turns 0 and zero cost silently.
12. **JS port vs Ruby.** The JS shnek workspace re-implements the spiral price (`allowance × coef`) and uses `cfg.spiral.allowance`, `coef_*`, `seg_coef_*` from `shnek_core/config.rb` (not read). Those values were not extracted, so the JS constants are unverified against Ruby.
13. **Brief mismatch.** Form partials `_repair_form.html.erb` and `_spiral_form.html.erb` do not exist, so UI inputs and dropdown lists are not extracted beyond the Ruby params.

## 6. Not verified in this run
- No code was executed; formulas are transcribed from source, not run.
- Values from `shnek_core/config.rb`, `Material` table rows, and DB-overridden PricingParameters are unknown.
