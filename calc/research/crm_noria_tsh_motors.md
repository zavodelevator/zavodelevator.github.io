# Норія / ТШ / шнек / мотор-редуктори — витяг формул, констант і каталогів

Джерело: `/home/user/new_ax_crm` (read-only). Формули скопійовано з коду, значення з файлів. Нічого не вигадано. Де даних у репо немає, це зазначено явно.

Усі ціни в коді: `Pricing::Rounding.to_multiple_of_3` = ціле грн вгору, потім до кратного 3 вгору (`((uah + 2) / 3) * 3`, попередньо `BigDecimal(value).round(2).ceil`). Нуль або від’ємне → 0.

---

## 0. Спільні примітки

### 0.1 Драйви/мотор-редуктори: DrivePricing (`app/services/drive_pricing.rb`)

```ruby
DEFAULT_MARKUPS = { "wholesale" => 1.0, "retail" => 1.0 }
MARKUP_KEYS     = { "wholesale" => "drive_markup_wholesale", "retail" => "drive_markup_retail" }
def self.markup(price_type) = PricingParameter.value_for(MARKUP_KEYS[type], default: DEFAULT_MARKUPS[type])
def self.call(full_n:, price_type:)
  drive = DrivePrice.active.find_by(full_n:) || raise NotFound
  raise ZeroPrice unless drive.purchase_price_vat.to_d.positive?
  price = drive.purchase_price_vat.to_f * markup      # kw = drive.kw.to_f
end
```
- `price = purchase_price_vat × markup`, markup за замовчуванням 1.0 (сід міграції `20261019000003`, описи: 1.0 = без націнки).
- `catalog(kind:)` повертає `price_wholesale = purchase × wholesale`, `price_retail = purchase × retail`, сортування `order(:kw, :purchase_price_vat)`, тільки `active` і `priced`.

### 0.2 Моделі

`app/models/drive_price.rb` (таблиця `drive_prices`, міграції `20261019000001`, `20261019000002`):
- `KINDS = %w[motor gear_motor]`
- поля: `kind, full_n (unique, not null), name, kw (decimal 8,3, >0), rpm (int), reducer_type, gab, saler, brand, purchase_price_vat (decimal 12,2, >=0, default 0), active (default true), source (default "manual"), price_updated_at, legacy_product_id`
- `before_save`: при зміні `purchase_price_vat` ставить `price_updated_at = now`.
- `display_name = name.presence || full_n`

`app/models/gear_motor.rb` (таблиця `gear_motors`, міграція `20260413100001`, схема `db/schema.rb:793`):
- `REDUCER_TYPES = ["Черв'ячний", "Конічно-циліндричний IRKPM", "Конічно-циліндричний SEW", "Конічно-циліндричний"]`
- `belongs_to :product`; `kwt` (>0), `rpm`, `reducer_type`, `gab`, `saler`, `brend`, `full_n` (unique), `active`
- `sale_price = product.price`. Контролер `app/controllers/gear_motors_controller.rb` існує. Чи ця таблиця ще використовується калькуляторами: у `app/services` і `lib` немає жодного виклику `GearMotor.`, тільки контролер. Див. розділ 9.

`app/models/pricing_parameter.rb`: `value_for(key, default:)` читає з `Rails.cache` (10 хв), тобто значення з БД перекривають дефолти в коді.

### 0.3 Міграції, що переносили дані

- `20260413100001_create_gear_motors.rb`: створює `gear_motors` і переносить `nkz_gear_motors` → `products` (category=2) + `gear_motors`.
- `20260412200007_create_nkz_gear_motors.rb` створює `nkz_gear_motors`; `20260413100002_drop_nkz_gear_motors.rb` видаляє її (down відновлює).
- `20261019000001_create_drive_prices.rb`: створює `drive_prices`.
- `20261019000002_migrate_products_to_drive_prices.rb`: переносить `products` з `category IN ('nkz_motor','nkz_gear_motor')` у `drive_prices`. Ціна = `specs.start_price`, якщо > 0, інакше `products.price`. `kind`: nkz_motor→motor, nkz_gear_motor→gear_motor. Поля з `specs`: kwt, rpm, reducer_type, gab, saler, brend.
- Фактичні рядки каталогу в міграціях НЕ вставляються. Каталог лежить у БД (продукти категорій nkz_motor / nkz_gear_motor, потім `drive_prices`).

### 0.4 Загальний пайплайн продажу (`app/services/calculators/base_calculator.rb`)

Використовується `NoriaCalculator` і `NkzCalculator` (через `super`):
```ruby
base      = result[:base_cost].to_f
overhead  = (base * overhead_pct / 100).round(2)        # overhead_pct: param > 0 ? param : 15.0
cost      = (base + overhead).round(2)
margin    = (cost * margin_pct / 100).round(2)          # margin_pct: param > 0 ? param : 20.0
sale      = Pricing::Rounding.to_multiple_of_3(cost + margin)
total_sale = sale * qty
```

---

## 1. NoriaCalculator (норія, портал клієнта) — `app/services/calculators/noria_calculator.rb`

Реєстр: `app/services/calculators/registry.rb:4` (`"noria" => "Calculators::NoriaCalculator"`); портал: `app/controllers/portal/calculators_controller.rb:6` (`registry: "noria", calc_type: "nkz"`). Тести: `test/services/calculators/noria_calculator_test.rb`.

### 1.1 Входи

| Ключ | Тип | Одиниця | За замовчуванням | Примітка |
|---|---|---|---|---|
| `performance` | float | т/год | 0 (`.to_f`) | продуктивність |
| `height` | float | м | 0 | висота |
| `material_koef` | float | × | 1.0 якщо ≤ 0 | опції з UI: `1.0` (Ст3), `1.4` (нержавійка) |
| `overhead_pct`, `margin_pct`, `quantity` | — | % / шт | 15 / 20 / 1 | з BaseCalculator |

`MATERIAL_LABELS = {"1.0" => "Сталь ст.3", "1.4" => "Нержавіюча сталь"}`; для інших значень підпис `"Сталь ст.3"`.

### 1.2 Два шляхи

1. `CalculatorFormulaModel.active_for("noria")` є → `FormulaInterpreter` з `model.formula_ast` і `model.constants`.
2. Інакше `calculate_hardcoded` (зараз саме цей шлях, див. розділ 9).

### 1.3 Кроки (hardcoded), скопійовано з коду

```ruby
performance   = params[:performance].to_f
height        = params[:height].to_f
material_koef = params[:material_koef].to_f
material_koef = 1.0 if material_koef <= 0

perf_part   = (performance * 1_200).round(2)                 # "Складова продуктивності", грн
height_part = (height * 800).round(2)                        # "Складова висоти", грн
base_raw    = perf_part + height_part                        # "База до матеріалу"
base_cost   = base_raw * material_koef                       # "База × коефіцієнт матеріалу" (без round тут)
```
Результат: `{ name: product_name, product_class: "Норія", base_cost: base_cost }`, далі BaseCalculator.

`product_name`:
```ruby
"Норія ковшова #{performance.to_i} т/год, #{height.to_i}м, #{material_label}"
```

### 1.4 Константи

| Константа | Значення | Джерело |
|---|---|---|
| ставка продуктивності | 1200 грн за (т/год) | код `noria_calculator.rb:24` + PricingParameter `noria_perf_rate` (НЕ читається, див. §9) |
| ставка висоти | 800 грн за м | код + PricingParameter `noria_height_rate` (НЕ читається) |
| коефіцієнт нержавійки | 1.4 | `NoriaCalculator` не читає PricingParameter `stainless_material_coef`; значення 1.4 приходить у params |

### 1.5 Контрольний приклад з тесту
performance 10, height 20, material 1.0 → 10×1200 + 20×800 = 28 000 → base_cost 28 000.0. Для 1.4 → 39 200.

### 1.6 Формула в шаблоні FormulaModel (неактивна)
`db/seeds/calculator_formula_models.rb`, NORIA_AST: кроки `perf_part = performance × perf_multiplier`, `height_part = height × height_multiplier`, `base_raw = perf_part + height_part`, `base_cost = base_raw × material_koef`; constants `{"perf_multiplier" => 1200, "height_multiplier" => 800}`; `is_active = false` (сід). Тобто за замовчуванням неактивна.

---

## 2. TshConveyorCalculator (шкребковий транспортер ТШ, простий режим) — `app/services/calculators/tsh_conveyor_calculator.rb`

Тести: `test/services/calculators/tsh_conveyor_calculator_test.rb`.

### 2.1 Входи

| Ключ | Тип / одиниця | Обов’язково | Примітка |
|---|---|---|---|
| `model` | рядок: "ТШ 25", "ТШ 50", "ТШ 100", "ТШ 200" | так | точний збіг з VARIANTS |
| `chain` | рядок (тип ланцюга) | так | точний збіг з VARIANTS |
| `length` | м (рядок, кома→крапка) | так | має бути > 1.5 (`BASE_LENGTH`); >60 — попередження (`MAX_LENGTH = 60`) |
| `liner` | bool | ні | футування короба, ціна за м × довжина |
| `distributor` | bool | ні | розподільний механізм |
| `distributor_length` | м | ні | якщо ≤ 0 або пусто → дорівнює `length` |
| `drive_full_n` | код приводу | ні | ціна з DrivePricing (тип `gear_motor`) |
| `price_type` | `retail` / `wholesale` | ні | за замовчуванням retail; опт/роздріб в ціні не розрізняється в прайсі, але `DrivePricing` бере markup за типом |
| `gear_price` (клієнтське) | — | ігнорується | тест підтверджує |

### 2.2 Кроки (з коду)

```ruby
per_m_cost = (length - BASE_LENGTH) * variant[:per_m]                         # BASE_LENGTH = 1.5
liner_cost = bool(:liner) ? variant[:liner] * length : 0
distrib_len  = num(:distributor_length); distrib_len = length if distrib_len <= 0
distrib_cost = bool(:distributor) ? variant[:distrib] * distrib_len : 0
gear_price   = DrivePricing.call(full_n: drive_full_n, price_type:)[:price]   # 0.0 якщо привід не вказано
total = per_m_cost + variant[:drive] + variant[:tension] + liner_cost + distrib_cost + gear_price
price = Pricing::Rounding.to_multiple_of_3(total)                              # ціна з ПДВ, одна для всіх
```
- Немає BaseCalculator, немає націнки на сам транспортер; націнка тільки через `drive_markup_*` на приводі.
- `price_without_vat` не повертається (тест перевіряє).
- Назва: `"Транспортер шкребковий #{model_code} L=#{fmt(length)} м (#{chain})"`, де `model_code = "ТШ 50" → "ТШ-50"` (`sub(/\AТШ\s*/, "ТШ-")`). Якщо мотор: `", мотор-редуктор #{fmt(kw)} кВт #{gab}"`.
- `fmt(v)`: ціле без десяткових, інакше `round(2)` з комою.

### 2.3 Таблиця варіантів (VARIANTS, ціни в грн; `per_m` = грн за м погонний; `liner` = грн за м; `distrib` = грн за м розподільника; `drive` і `tension` = фіксовані грн)

| model | chain | liner (грн/м) | distrib (грн/м) | drive (грн) | tension (грн) | per_m (грн/м) |
|---|---|---|---|---|---|---|
| ТШ 25 | трд 38 гума | 1200 | 2000 | 15800 | 13300 | 6200 |
| ТШ 25 | трд 38 пє 500 | 1200 | 2000 | 15800 | 13300 | 6750 |
| ТШ 25 | M-81x пє 500 | 1200 | 2000 | 15800 | 13300 | 11250 |
| ТШ 50 | трд 38 гума | 1500 | 2200 | 18600 | 15700 | 6900 |
| ТШ 50 | трд 38 пє 500 | 1500 | 2200 | 18600 | 15700 | 7500 |
| ТШ 50 | M-81x пє 500 | 1500 | 2200 | 18600 | 15700 | 12500 |
| ТШ 100 | трд 38 пє 500 | 1800 | 2500 | 22320 | 18840 | 8700 |
| ТШ 100 | M-81x пє 500 | 1800 | 2500 | 22320 | 18840 | 14400 |
| ТШ 200 | M-112 пє 500 | 2100 | 3000 | 28000 | 26000 | 19800 |

Тест: ТШ 25 / трд 38 гума / 8 м → (8−1.5)×6200 + 15800 + 13300 = 69 400 → 69 402.
Футування 8 м: +1200×8 = 9 600 → 79 000 → 79 002 (тест).

### 2.4 Мотор-редуктор ТШ: таблиця kW (`TshMotorTable`)

- Файл `config/calculators/tsh_motor_kw.yml`; зараз **`rows: []`** (порожньо, заповнює власник). Формат: `{model, max_length, kw}`.
- `kw_for(model, length)`: серед рядків цієї моделі з `max_length >= length` береться з мінімальним `max_length`, повертається його `kw`. Інакше `nil`.
- Коментар у файлі: «Модель і ціна редуктора підбираються з каталогу мотор-редукторів норії за цими кВт».
- У самому калькуляторі автопідбору немає. Автопідбір є в `app/services/crm_mcp/calc_tools.rb:249`: `kw = TshMotorTable.kw_for(model, length)`; `motor = screw_drive_catalog("gear").select { kw == m[:kw] }.min_by { price }` (роздрібна ціна). Це поведінка MCP-інструмента `tsh_calc`.

### 2.5 Вихідні попередження
- length ≤ 1.5 → `{error: "Вкажіть довжину транспортера (> 1.5 м)"}`
- невідома модель/ланцюг → `"Невідома модель або тип ланцюга"`
- привід не gear_motor → `"Невідповідний вид приводу"`; `NotFound` / `ZeroPrice` → текст помилки.
- порожня таблиця kW → `"Таблиця кВт мотор-редукторів ще не задана — редуктор обирається вручну"`.

---

## 3. ScrewConveyorSimpleCalculator (шнековий транспортер, простий режим) — `app/services/calculators/screw_conveyor_simple_calculator.rb`

Тести: `test/services/crm_mcp/screw_conveyor_calc_test.rb`.

### 3.1 Входи

| Ключ | Тип / одиниця | За замовчуванням / опції |
|---|---|---|
| `diameter` | мм | з `DIAMETERS = [102, 127, 159, 219, 250, 300]`, інакше помилка |
| `length` | м | > 0; > 20 (`MAX_LENGTH`) — попередження |
| `drive_kind` | `motor` / `gear` / інше → `none` | `DRIVE_KIND_LABELS`: motor→«електродвигун», gear→«мотор-редуктор» |
| `drive_full_n` | код приводу | ціна з DrivePricing (retail або wholesale; клієнтську ціну не приймає) |
| `hopper`, `stand`, `krot`, `trough` | bool | опції |
| `price_type` | `wholesale` інакше `retail` | для DrivePricing |

### 3.2 Кроки (з коду)

```ruby
base, per_m  = DEFAULTS[d]                       # або PricingParameter screw_conv_base_#{d}, screw_conv_per_m_#{d}
pulleys = kind == "gear" ? param("screw_conv_gear_base") : param("screw_conv_pulleys_bearings")
meters  = per_m * length * param("screw_conv_meter_coef")

subtotal = pulleys + base + meters
small    = d < 160                                # SMALL_DIAMETER_LIMIT
hopper   = bool(:hopper) ? param(small ? "screw_conv_hopper_small" : "screw_conv_hopper_large") : 0
stand    = bool(:stand)  ? param(small ? "screw_conv_stand_small"  : "screw_conv_stand_large")  : 0
krot     = bool(:krot)   ? per_m * param("screw_conv_krot_coef") : 0
subtotal += hopper + stand + krot
subtotal *= param("screw_conv_trough_coef") if bool(:trough)
subtotal *= param("screw_conv_long_coef")   if length >= 10                   # LONG_FROM = 10
transport = subtotal * param("screw_conv_overhead_coef") * param("screw_conv_markup_coef")

drive_price = DrivePricing.call(full_n:, price_type:)[:price]   # тільки якщо kind != none і код є
price = Pricing::Rounding.to_multiple_of_3(transport + (kind == "none" ? 0 : drive_price))
```

Формула словами: `ціна = [(шківи/підшипники або база мотор-редуктора) + база_Ø + ціна_м × L × 1.32 + бункер + підставка + крот] × (жолоб) × (L≥10 ? 1.1 : 1) × 1.15 × 1.1 + привід`.

### 3.3 Таблиця: діаметр → [база, грн за м] (`DEFAULTS`, дублюється в міграції `20261015000001`)

| Ø мм | база (навісне), грн | грн за м |
|---|---|---|
| 102 | 4050 | 2048 |
| 127 | 4116 | 2486 |
| 159 | 4512 | 2914 |
| 219 | 7350 | 4384 |
| 250 | 8000 | 5000 |
| 300 | 9000 | 6000 |

### 3.4 Загальні константи (`GENERAL_DEFAULTS` = PricingParameter `screw_conv_*`)

| ключ | значення | опис |
|---|---|---|
| `screw_conv_pulleys_bearings` | 4500 грн | шківи та підшипники, варіант з двигуном |
| `screw_conv_gear_base` | 3000 грн | база замість шківів, варіант з мотор-редуктором |
| `screw_conv_meter_coef` | 1.32 | = 1.1 (запас) × 1.2 |
| `screw_conv_hopper_small` | 2000 грн | бункер, Ø<160 |
| `screw_conv_hopper_large` | 3000 грн | бункер, Ø≥160 |
| `screw_conv_stand_small` | 4000 грн | підставка, Ø<160 |
| `screw_conv_stand_large` | 5000 грн | підставка, Ø≥160 |
| `screw_conv_krot_coef` | 0.5 | крот = ціна за м × 0.5 |
| `screw_conv_trough_coef` | 1.1 | жолоб |
| `screw_conv_long_coef` | 1.1 | довжина ≥ 10 м |
| `screw_conv_overhead_coef` | 1.15 | «коефіцієнт 1 (було ПДВ 15%)» |
| `screw_conv_markup_coef` | 1.1 | «коефіцієнт 2 (націнка)» |

### 3.5 Таблиця потужності KW (кВт) = `KW[d][L]`, L у цілих метрах (`required_kw` бере `length.ceil`)

| Ø | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 102 | 1.1 | 1.1 | 1.5 | 1.5 | 1.5 | 1.5 | 2.2 | 2.2 | 2.2 | — | — | — |
| 127 | 1.5 | 1.5 | 1.5 | 1.5 | 2.2 | 2.2 | 2.2 | 2.2 | 3 | 3 | — | — |
| 159 | 2.2 | 2.2 | 2.2 | 2.2 | 3 | 3 | 3 | 3 | 4 | 4 | 4 | 4 |
| 219 | 3 | 3 | 3 | 3 | 4 | 4 | 4 | 4 | 4 | 4 | 5.5 | 5.5 |
| 250 | 3 | 3 | 3 | 3 | 4 | 4 | 4 | 5 | **—** | 7.5 | 7.5 | 7.5 |
| 300 | 3 | 3 | 4 | 4 | 4 | 4 | 5.5 | 5.5 | 5.5 | 5.5 | 7.5 | 7.5 |

Примітка з коду: для 250 мм / 9 м «значення в старому коді не було», тому порожньо.

### 3.6 Попередження
- Довжина > 20 м → попередження (розрахунок є).
- `required_kw` = nil і довжина ≤ 20 → «привід обирається вручну».
- Привід обрано, ціни немає → «рахунок без приводу».

### 3.7 Назва
`"Шнековий транспортер Ø#{d} L=#{L} м (бункер, підставка, крот, жолоб), мотор-редуктор|двигун #{kw} кВт #{gab}"`.

---

## 4. ShnekCalculator (шнек, старий простий режим) — `app/services/calculators/shnek_calculator.rb`

Хардкод (якщо немає активної `CalculatorFormulaModel` для `shnek`):
```ruby
diam_part = (diameter * 15).round(2)                 # "Складова діаметру"
len_part  = (length * 2_200).round(2)                # "Складова довжини"
base_raw  = diam_part + len_part
base_cost = base_raw * material_koef                 # material_koef ≤ 0 → 1.0; 1.4 = нержавійка
```
- Константи: 15 грн/мм діаметра, 2200 грн/м довжини.
- Назва: `"Шнековий транспортер Ø#{diameter.to_i}мм, #{length.to_i}м, #{material_label}"`.
- Тут також діє BaseCalculator (overhead/margin).
- PricingParameter `shnek_diam_rate` (15) та `shnek_length_rate` (2200) сідаються, але код їх не читає (§9).
- Сід formula-model `SHNEK_AST` аналогічний, з constants `{"diam_multiplier" => 15, "len_multiplier" => 2200}`, `is_active = false`.

---

## 5. NkzCalculator (норія НКЗ, сервіс CRM, каталог з Product) — `app/services/calculators/nkz_calculator.rb`

Не був у початковому списку «норія», але він і є канонічним калькулятором «Норія» в блоку калькуляторів (`vault/projects/new_ax_crm/decisions/2026-06-16_noria-calculator-duplicate.md`). Його каталожні частини (ланцюг, ківші, метизи, секції шахти) беруться з `Product` через `Nkz::ComponentSelector`, тобто їх немає в коді.

### 5.1 Входи
- `nkz_type` (тип НКЗ; `Product::NKZ_TYPES = [5, 10, 25, 50, 100, 175, 200]`), `height_m` (ціле, 1..30), `chain` (bool; ланцюг лише для типів, що в `CHAIN_TYPES`), `conv_full_n`, `busket_full_n`, `gear_motor_full_n`, `rev_thickness`, `meter_thickness`, `twometer_thickness` (мм; якщо < 0.5 → 1.5), `overhead_pct`, `margin_pct` (тут примусово ≥ 0; за замовчуванням 0).

### 5.2 Таблиця BASE_HEIGHTS (м)

| НКЗ тип | base_h, м | формула в коді |
|---|---|---|
| 5 | 1.675 | (720 + 955) / 1000 |
| 10 | 1.675 | (720 + 955) / 1000 |
| 25 | 2.035 | (955 + 1080) / 1000 |
| 50 | 2.035 | (955 + 1080) / 1000 |
| 100 | 2.560 | (1350 + 1210) / 1000 |
| 175 | 3.000 | (1500 + 1500) / 1000 |
| 200 | 3.000 | (1500 + 1500) / 1000 |

### 5.3 Кроки (з коду)

```ruby
half       = (@height_m - 1) / 2                    # ціле ділення
section_1m = (@height_m - 1).odd? ? 1 : 0
section_2m = half
section_rev = 1
sections_sum = section_1m + section_2m + section_rev
total_h   = (sections_sum * 0.030 + @height_m + base_h).round(3)
working_h = (sections_sum * 0.030 + @height_m).round(3)

conv_length_m = (chain_target? ? total_h * 4 + 2 : total_h * 2 + 1).round(2)   # chain_target? = chain && type in [25,50]
conv_price    = (conv_length * conv_item.price).round(2)                      # 0 якщо конвеєра немає

cb = product.count_busket.to_f
total_buskets = (chain_target? ? conv_length * cb / 2 : conv_length * cb).ceil   # 0 якщо cb==0 або length==0

# метизи
bolt_count = (total_buskets * busket.count_metiz.to_i).ceil
bolt_price = (bolt_count * metiz.weight_kg * metiz.price).round(2)
nut_count  = bolt_count * 2
nut_price  = (nut_count * nut.weight_kg * nut.price).round(2)
washer_count = bolt_count
washer_price = (washer_count * washer.weight_kg * washer.price).round(2)

# секції шахти (ціна)
rev:  p = frame.price*2 + shaft_rev.price;          price = (p * rev(=1) * rev_thickness).round(2)
1 м:  p = frame.price*2 + shaft_1m.price;           price = (p * one_m * meter_thickness).round(2)   # one_m = section_1m (0 або 1)
2 м:  p = (frame.price*2 + shaft_1m.price*2) * 2;   price = (p * two_m * twometer_thickness).round(2) # two_m = (H-1)/2

# мотор-редуктор
gear = DrivePricing.call(full_n: gear_motor_full_n, price_type:)   # price = purchase × markup

total = items.sum(price_uah).round(2)
```
Позиції: башмак (1 шт), шахти (ревізійна, 1м, 2м), голова привідна (1 шт), ланцюг/стрічка (`conv_length` м), ківші (`total_buskets` шт), метизи (болт, гайка, шайба), мотор-редуктор (1 шт).

Після цього BaseCalculator: `base_cost = total`, overhead = 0 і margin = 0 за замовчуванням, `sale = to_multiple_of_3(total)`.

### 5.4 Назва
`"Норія НКЗ-#{nkz_type} #{height_m}м#{chain_label}"`, `chain_label = " (ланцюг)"` або `""`.

---

## 6. Shnek core (детальний розрахунок шнека) — `app/services/calculators/shnek_core/`

Є паралельна JS-версія `app/javascript/lib/shnek_core.js` (39 KB, `ENGINE_VERSION = "shnek_core/1"`) і golden-файл `test/fixtures/files/shnek_core_golden.json`. Це уже готовий еталон для JS-порту, перевірити його зміст у рамках цього дослідження не було.

### 6.1 Дані: `tables.json` (повний вміст у файлі, ключові значення тут)

Скаляри: `vat = 1.2`, `k_fab = 4.0`, `k_buy = 1.3`, `consumables = 0.12`, `krot_coef = 0.5`, `nmax_a = 65`, `motor_reserve = 1.2`, `fs = 1.25`, `n_motor = 1450`, `i_range = [7.5, 60]`, `oversize_warn = 4`, `eta_static = 0.7`, `hanger_spacing = 2000`, `section_len = 2000`, `flange_t = 6`, `pitch_ratio = 1.0`.

Матеріальні ціни `prices[клас][матеріал]`, грн/кг:

| клас | black | tech | food |
|---|---|---|---|
| flight | 60 | 120 | 160 |
| sheet | 55 | 120 | 160 |
| tube_body | 55 | 300 | 300 |
| shaft_tube | 100 | 300 | 300 |
| bar | 120 | 200 | 200 |

Спіраль: `allowance = 1.1`, `coef_retail = 6.0`, `coef_wholesale = 5.0`, `seg_coef = {"2": 4.5, "3": 3.5, "default": 3.0}`.

Купівельні позиції `buy[ключ].price` (грн, з 1С/оцінок):

| ключ | ціна грн | джерело (з файлу) |
|---|---|---|
| ucf206 | 471.29 | 1С 2026-08-12 |
| ucf207 | 579.6 | 1С 2026-03-13 |
| ucf208 | 610.3 | 1С 2026-07-24 |
| ucf209 | 718.57 | 1С 2026-08-28 |
| ucf210 | 936.45 | 1С 2025-07-18 |
| ucf216 | 3500.0 | 1С 2026-03-27 |
| manzheta | 10.63 | 1С 2026-03-31 |
| hanger_bush | 225.88 | 1С GFM-3539-26 2026-03-23 |
| coupling_s | 900.0 | оцінка (еластична муфта до 3 кВт) |
| coupling_m | 2848.67 | 1С КС 5014 2026-03-13 |
| coupling_l | 5692.92 | 1С КС 6022 2026-03-24 |
| pulley_big | 700.0 | оцінка (шків 310/2) |
| pulley_small | 250.0 | оцінка (шків 95) |
| belt | 28.41 | 1С Tehno В-1280 2025-10-24, ⚠ позначено «підозріло низька» |
| winch | 1149.17 | 1С Forte HWT-800 2026-10-01 |
| wheel_w20250 | 958.35 | 1С закупівля 2026-02-26 |
| wheel_w400 | 988.0 | 1С закупівля 2026-03-30 |
| wheel_swivel | 455.65 | 1С закупівля 2026-03-20 |

Таблиці, що використовуються кодом:

- `std.tube` = [102, 108, 127, 159, 219, 275, 300, 400, 500]; `std.trough` = [160, 200, 220, 250, 300, 400, 500].
- `gap`: tube 14, trough 20.
- `shaft_od` (крок за розміром корпуса): [[0,34],[127,34],[159,42],[260,42],[261,73],[310,73],[311,114],[401,114],[402,127],[550,127]] (`lookup_step`).
- `shaft_wall`: default 3, "42": 5, "60": 5, "73": 4, "114": 5, "127": 5.
- `shaft_by_size`: {"219": 60, "220": 60}.
- `shaft_od_options`: [34, 42, 48, 57, 60, 73, 89, 102, 114, 127].
- `flight_d_by_size`: {"159": 140}.
- `casing_wall`: 102→3, 108→3, 127→3, 159→3, 219→4, 275→4, 300→4, 400→5, 500→6.
- `trough_t`: 160→3, 200→3, 220→3, 250→3, 300→4, 400→5, 500→6.
- `cover_t`: default 2, 300→3, 400→3, 500→4.
- `flight_t`: 102→3, 108→3, 127→3, 159→4, 219→5, 275→5, 300→5, 400→6, 500→6, 160→4, 200→4, 220→4, 250→5.
- `plate_t`: default 6, 219→8, 275→8, 300→10, 400→10, 500→12.
- `hopper_fill`: `t=2, t_big=3, big_from=0.9, taper=0.25, h_mul=0.8`.
- `stand`: `leg_h=0.9, tube_a=40, tube_t=3, span_m=3`. `chassis`: `frame_tube_a=50, frame_tube_t=3, wheels="w20250"`.
- `bore_of`: ucf206→30, ucf207→35, ucf208→40, ucf209→45, ucf210→50, ucf216→80.
- `default_off`: ["gland", "coupling", "feet"].
- `flight_d_by_size`, `hopper_max = 5 м³`, `limits`: length [1,30], krot_len [0.5,5], q [0.01,1000], slope_deg [0,20], pitch_ratio [0.5,1.2], shaft_t [2,10], shaft_od_max_ratio 0.75, n [1,500], w 100000, buy 10000000, k 100, manual_cost 100000000, name_len 120.
- `codes`: casing 1, flange 2, … (код артикула `AX-T|Z{size}-{NN}`).
- `presets`: black, ss_screw_black_body, food_full, tech_full, food_screw_tech_body (матеріали по вузлах).

Привідні константи:
- `worm_i` = [7.5, 10, 15, 20, 25, 30, 40, 50, 60]
- `worm_eta` = {7.5: 0.9, 10: 0.88, 15: 0.86, 20: 0.84, 25: 0.75, 30: 0.65, 40: 0.6, 50: 0.55, 60: 0.5}
- `kw_std` = [0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 9.2, 11, 15, 18.5, 22]
- `gb_size_by_kw` = {0.37: 63, 0.55: 63, 0.75: 63, 1.1: 63, 1.5: 75, 2.2: 90, 3: 90, 4: 110, 5.5: 130, 7.5: 130, 9.2: 130, 11: 150, 15: 150}
- `gb_t2` (довідковий T2н, Nm; джерело — Motovario VSF, **не постачальник**, `confirmed: false`):

| габарит | i=7.5 | 10 | 15 | 20 | 25 | 30 | 40 | 50 | 60 |
|---|---|---|---|---|---|---|---|---|---|
| 63 | 128 | 135 | 150 | 146 | 134 | 160 | 149 | 143 | 135 |
| 75 | 185 | 201 | 230 | 236 | 214 | 247 | 245 | 225 | 214 |
| 90 | 319 | 341 | 396 | 391 | 374 | 432 | 396 | 374 | 352 |
| 110 | 552 | 598 | 656 | 644 | 679 | 725 | 702 | 660 | 616 |
| 130 | 750 | 820 | 920 | 910 | 930 | 1040 | 1050 | 980 | 900 |
| 150 | 1200 | 1240 | 1250 | 1300 | 1200 | 1200 | 1550 | 1400 | 1260 |

- `gb_fr2max`: 63 → 6270 Н, 90 → 8180 Н, інші null.
- `gb_thermal`: усі null.
- `idle` (підвіски): `hp_kw = 0.7457`, `bearing = "bronze"`, `fb`: ball 1.0, bronze 1.7, plastic 2.0, hard_metal 4.4; `fd` (дюйми → CEMA Fd): [[4,12],[6,18],[9,31],[12,55],[14,78],[16,106],[18,135],[20,165],[24,235],[30,377],[36,549]].
- `slope_c` (0/5/10/15/20° → 1, 0.9, 0.8, 0.7, 0.6), `slope_energy` (0/15/45° → 1, 1.2, 1.5, лінійно між).
- `crm_kw` = **таблиця потужності, та сама, що `ScrewConveyorSimpleCalculator::KW`** (див. §3.5). Значення збігаються поелементно.
- `gear_plate` (макс. кВт → [розмір плити, товщина]): ≤1.1 → [180, 8]; ≤2.2 → [220, 10]; ≤4 → [260, 10]; ≤7.5 → [300, 12]; ≤1000 → [340, 14].

Профілі продукту `drive.profiles` (`fill` ψ, `rho` т/м³, `friction` ω, `nmax_k`, `start_k`):

| профіль | fill | rho | friction | nmax_k | start_k |
|---|---|---|---|---|---|
| dry (сухе зерно) | 0.4 | 0.75 | 1.4 | 1.0 | 1.5 |
| feed (борошно/комбікорм) | 0.4 | 0.6 | 2.0 | 1.0 | 1.8 |
| wet (вологий/в'язкий) | 0.25 | 0.9 | 4.5 | 0.415 | 2.2 |
| abr (абразивний) | 0.3 | 1.3 | 4.0 | 0.554 | 2.0 |

`default_profile = "dry"`. Джерела і `confirmed` — у `tables.json` (поля `src`). Не підтверджені: `rho` (dry, feed, wet, abr), `start_k` (усі), `friction` feed, `fill`/`nmax_k` wet і abr, `motor_reserve`, `fs`, `n_motor`, `i_range`, `eta_static`, `worm_eta` крім 30 і 60, `gb_size` для 0.37/0.55/15/18.5/22, `gb_t2`, `gb_thermal`.

### 6.2 Геометрія (`geometry.rb`)

```ruby
RHO = 7.85; PI_CRM = 3.14
helix_deg(di, p) = atan(p / PI_CRM / di) * 180 / π
cosv(deg)        = cos(deg * π / 180)
blank_inner(di, c) = (di / c) * 1.038
blank_outer(d_out, di, bi) = d_out - di + bi
flange_h(bo, bi) = (bo - bi) / 2
cut_angles(di, bi, deg):
  d1v      = di / cosv(deg)                        # d1(di, cos) = di / c
  excess   = PI_CRM * (bi - d1v)
  ang_p    = atan(excess / bi) * 180 / π * 2
  add      = atan(deg * 0.32 / bi) * 180 / π * 2
  cut      = ang_p + add
tube_kg(wall, od, len_m)        = wall * 0.02465 * (od - wall) * len_m
d31_per_m(bi, fh, p, t)         = sqrt((π·bi)² + p²) * (1000/p) * fh * t * RHO / 1e6
flight_per_m(di, d, p, t):      f(r) = u·sqrt(u²+p²) + p²·ln(u + sqrt(u²+p²)), u = 2πr
                                 area = (f(d/2) - f(di/2)) / (4π); kg = area * (1000/p) * t * RHO / 1e6
seg_annulus(bo, bi, t)          = π/4 (bo² - bi²) t RHO / 1e6
plate(a, b, t) = a·b·t·RHO/1e6;  disc(d,t) = π/4·d²·t·RHO/1e6;  ring(D,d,t) = π/4(D²-d²)t RHO/1e6
rod(d, len_mm) = π/4·d²·len_mm·RHO/1e6
sq_tube_kg_per_m(a,t) = (a² - (a-2t)²) · RHO / 1000
```
`geom(type, size, cfg)`:
```ruby
shaft_od = shaft_od_sel || shaft_by_size[size] || lookup_step(shaft_od, size)
shaft_t  = shaft_t_sel  || by_key(shaft_wall, shaft_od)
wall     = by_key(tube ? casing_wall : trough_t, size)
gap      = tube ? 14 : 20
inner    = tube ? size - 2*wall : size
d        = flight_d_by_size[size] || inner - gap
s        = r(d * pitch_ratio, 0)
t        = by_key(flight_t, size) || 4
hel = helix_deg(shaft_od, s); c = cosv(hel)
bi  = blank_inner(shaft_od, c); bo = blank_outer(d, shaft_od, bi); fh = flange_h(bo, bi)
```

### 6.3 Утиліти (`util.rb`)
```ruby
r(x, digits=0)     = floor(x * 10^digits + 0.5) / 10^digits          # half-up, не Ruby round
ceil3(x)           = n = ceil(x - 1e-9); n + ((3 - n % 3) % 3)
lookup_step(table, v) = останній ключ k з v >= k (початок — table[0][1])
by_key(table, size)   = table[str(size)] або table["default"]
hangers(L, spacing)   = max(0, ceil(L*1000/spacing) - 1)
```

### 6.4 Деталі (`parts.rb`) — ключові формули ваг і цін

- `bearing_for(type, size)`: ≤108 → ucf206; ≤160 і tube → ucf207; ≤200 → ucf207; ≤275 або (trough і ≤250) → ucf209; ≤300 → ucf210; інакше ucf216.
- `patrubok_w(size)`: a = 0.9·size, h = 0.7·size; `4·a·h·3·RHO/1e6 + ring(a+70, a, 6)·1.3`.
- Tube корпус: `tube_kg(wall, size, 1)`, фланець: `qty = 2 / (section_len/1000)`, `w = ring(size+60, size-2·wall, flange_t)`.
- Жолоб: `b = π·size/2 + 2·0.3·size + 60`; `w_casing = b·wall·RHO/1000`; кришка `(size+80)·cover_t·RHO/1000`; ребра: `qty=2`, `w = 40·4·(π·size/2 + 0.6·size + 60)·RHO/1e6`.
- Вал: `tube_kg(shaft_t, shaft_od, 1)`. Цапфа: `qty=2`, `w = rod(bore, 350)`.
- Торцева плита: `side = (tube ? size : size + 2·wall) + 80`, `w = plate(side, side, pt) − disc(bore+10, pt)`, qty 2.
- Спіраль цільна: `w = flight_per_m(shaft_od, d, s, flight_t)`, `k = allowance × coef` (coef = 5 wholesale або 6 retail).
- Спіраль сегментна: `n_seg = 1000 / s`, `w = seg_annulus(bo, bi, flight_t)`, `k = seg_coef[flight_t]`.
- Підвіски: `qty = hang_n`, `w = plate(0.9·sz, 60, 6) + rod(10, sz/2 + 300)·0.5`; втулка `buy=hanger_bush`; трубка змащення `w=0.4`.
- Привід: `kw_need = kw || 1.5`; `coupling = kw ≤ 3 ? coupling_s : kw ≤ 7.5 ? coupling_m : coupling_l`; плита редуктора `gear_plate(kw)`; натяг `w = plate(280,160,8)+1.2` (лише для motor); шківи `buy = pulley_big + pulley_small + 2·belt`.
- Опори: `qty = max(2, ceil(L/span_m) + 1)`, `w = 0.6 + plate(120,120,5)`.
- Бункер: `h = 0.8·cbrt(V)`, `a = sqrt(3V / (h·(1 + r + r²)))`, `b = r·a` (r = 0.25), `slant = sqrt(h² + ((a-b)/2)²)`, `area = 2(a+b)·slant`, `t = V ≥ 0.9 ? 3 : 2`, `sheet_kg = area·1e6·t·RHO/1e6`.
- `crm_kw(cfg, size, L)`: ближчий ключ Ø з `crm_kw`; `lc = ceil(L)`; якщо ключа немає → `tbl[min(lc, max_key)]` (відрізняється від ScrewConveyorSimple, див. §9).
- Pulley/belt/coupling/winch: `buy` з `buy`.

### 6.5 Ціноутворення (`pricing.rb`)

```ruby
pkg_price = prices[pc][mat]                        # pc: casing→tube_body (tube) | sheet (trough); shaft→shaft_tube; flight→flight; stub→bar; інакше sheet
mode   = override["mode"] || (has buy ? "purchase" : "metal")   # MODES: metal | purchase
base   = mode == "purchase" ? buy : w * pkg_price
k      = override["k"] || (p.k || (purchase ? k_buy(1.3) : k_fab(4.0)))
qty    = per_m ? p.qty * length : p.qty
cost   = off ? 0 : (manual ? manual_cost : qty * base * k)
raw_metal (для consumables) = qty * w * pkg_price  (mode metal, без manual/off)
consum.cost = metal_base * consumables(0.12)       # metal_base = сума raw_metal без consum
subtotal = Σ cost (без consum) + consum.cost
krot_row: cost = krot_coef(0.5) * (Σ cost shaft+flight+casing) / length * kl
final_price = ceil3(subtotal * vat(1.2) + drive_price)
```
- `Quote#compute` повертає `price = ceil3(subtotal × 1.2 + drive_price)`, де `drive_price = drive.price` (retail/wholesale з DrivePricing).
- ⚠ Розбіжність `Util.ceil3` (допуск 1e-9, без попереднього round) і `Pricing::Rounding` (round(2), ceil до цілого, потім кратне 3). Для JS-порту брати одну. Див. §9.

### 6.6 Потужність і оберти (`drive/power.rb`, `select.rb`, `gearbox.rb`, `profiles.rb`)

```ruby
qm3h(g, n, ec)  = 60·π/4 · (d² − shaft_od²) · s · n · fill · slope_c      # d, shaft_od, s у мм → м
n_max(g, ec)    = nmax_k · nmax_a / sqrt(d / 1000)                          # d у мм
n_for(g, q)     = q / qm3h(g, 1)
idle(g, n, L)   = L · 3.28084 · n · fd · fb / 1e6 · hp_kw                  # fd = interp(fd, d/25.4), fb = hangers>0 ? fb[bearing] : 1
power(g, q, n, L):
  qt      = q · rho
  moving  = qt · (L·cos(rad) · friction + L·sin(rad)) / 367                  # rad = slope_deg·π/180
  lab     = qt · L · friction / 367 · slope_energy                            # slope_energy = interp(slope_energy, slope_deg)
  n0      = max(moving, lab)
  p_shaft = n0 + idle
```
Значення `Util.r` для `n0`, `p_idle`, `p_shaft` — з 4 знаками, `qt` з 3.

Operating point (`operating_point`): `n = n_max` (source "max"), або `n = q→n_for` (якщо `need > n_max` → обмежено, warning), або задано `n` (обмежено n_max).

Gearbox.choose(ec, n_target, n_max, at_least):
```ruby
fit    = worm_i.select { |i| n_motor / i <= n_max + 1e-9 }
enough = fit.select { |i| n_motor / i >= n_target - 1e-9 }
i = fit.empty? ? worm_i.last
  : at_least && enough.any? ? enough.max
  : at_least ? fit.min
  : fit.min_by { |x| |n_motor/x - n_target| }
n2 = n_motor / i
```

actual_point: `i_calc = n_motor / op.n`, `q = qm3h(g, n2)`, `eta = worm_eta[i]`, `power = power(g, q, n2, L)`.

requirement:
```ruby
p_motor   = r(p_shaft · motor_reserve(1.2) / eta, 3)
kw_advised = kw_up(p_motor)        # перший kw_std ≥ p_motor (інакше останній)
```
detail:
```ruby
n = actual n2; eta_start = min(eta, eta_static(0.7))
m_nom   = 9550 · p_shaft / n
m_sel   = m_nom · fs(1.25)
m_start = m_nom · start_k
m_motor = 9550 · kw · eta / n2
m_motor_start = 9550 · kw · eta_start / n2
size    = gb_size_by_kw[kw]; t2 = gb_t2[size][i]  (0 якщо невідомо)
```
plan: `source = manual ? "manual" : (table_kw.nil? || advised > table_kw ? "physical" : "table")`; `kw = manual || max(table_kw, advised)`; `status = kw < advised ? "need" : "reserve"`; `factor = r(kw / p_shaft, 1)`; `oversize` warn якщо `kw ≥ 4·p_shaft`.

Попередження `Gearbox.checks`: момент двигуна < m_sel → попередження; пусковий < m_start → попередження; t2 < m_sel → попередження; габарит не встановлено; i поза [7.5, 60]; жоден i не дає n2 ≤ n_max; завжди: «Не перевірено: радіальне навантаження…», «Самогальмування … ненадійне».

Профілі (`profiles.rb`): `apply(cfg, key, slope)` перекриває `fill, rho, friction, nmax_k, start_k, hanger_spacing, slope_deg` з обраного профілю; `default_profile = dry`.

---

## 7. Gear motor / мотор-редуктор: каталоги

### 7.1 Рядки каталогу в репозиторії
**Немає.** У репо немає жодного рядка з реальними ціною/моделлю мотор-редуктора:
- `drive_prices` (основне джерело для всіх калькуляторів): заповнюється вручну через UI («Ціни приводів», `drive_prices_controller.rb`) або з міграції `20261019000002` з БД `products`. Дані з БД не в репо.
- `gear_motors` (старий): ті самі дані через `db/migrate/20260413100001`, рядки в БД.
- `config/calculators/tsh_motor_kw.yml`: `rows: []`.
- Тести створюють лише фіктивні рядки (`T-GM-1`, `MCP-GM-3`, `MCP-TSH-1` тощо, ціна 9000–12000). Їх не можна брати як каталог.

### 7.2 Що є в репо як довідник (не ціни, не закупівлі)
- `shnek_core/tables.json` → `kw_std`, `gb_size_by_kw`, `gb_t2` (Motovario, довідково), `gb_fr2max` (лише 63 і 90), `worm_i`, `worm_eta`. Таблиці в §6.1.
- Значення кВт для шнека / ТШ: `ScrewConveyorSimpleCalculator::KW` (§3.5) і `crm_kw` (той самий набір).

### 7.3 Що є у vault (тільки лічильники, без рядків)
`vault/projects/new_ax_crm/sessions/2026-05-09_noria-google-sheets-engineering-research.md`, розділ 1 таблиця: секція Google Sheets API, `motor` = 61 запис («АИР 750/1000/1500/3000 об/хв, 0.18–75 кВт»), `g_motor` = 39 записів («Черв'ячні techno_privod + конічні i-mak/SEW»). Самих рядків у нотатці немає. Для `att_equip` і `bearing` рядки є (див. §8). Джерело — Google Apps Script endpoint, який нотатка згадує; тут він не викликався.

### 7.4 Вимоги до JSON для мотор-редукторів (з коду)
Поля, які реально читає код: `full_n` (код), `kind` (`motor`/`gear_motor`), `name`, `kw` (>0), `rpm`, `reducer_type`, `gab`, `saler`, `brand`, `purchase_price_vat` (>0 для розрахунку), `active`. Ціна продажу: `purchase_price_vat × drive_markup_{wholesale|retail}`.

---

## 8. Інші довідникові таблиці з цього напряму (з коду/vault)

- Підшипники (сід/нотатка): UCF206/208/209/210/212/216, start_price 623–3080 грн, sale_price 1104–5462 грн (vault session, §4).
- `att_equip` (vault session, §3): PHE FRC 130RSB SKF — 9 691 грн; PHE FRC 180RSB SKF — 5 075 грн; GV 60 (обгонна) — 17 620 грн; датчик сходу стрічки — 1 762 грн; датчик обертів — 8 810 грн; датчик підпору — 1 762 грн. (Перевірити; тут з нотатки.)
- `conv_belt` 148–1102 грн/м, `conv_chain` ТРД-38, М-66, М-80, М-112 (vault, без рядків).

Сід `db/seeds/pricing_parameters.rb` (equipment): `noria_perf_rate` 1200 грн/(т/год); `noria_height_rate` 800 грн/м; `shnek_diam_rate` 15 грн/мм; `shnek_length_rate` 2200 грн/м; `stainless_material_coef` 1.4. Сід матеріалів (labor/material): Ст3 50 грн/кг, 09Г2С 55, Ст45 75, AISI 304 140, нержавійка загальна 100, Hardox 450 125; `disassembly_rate_*`, `assembly_rate`, `balancing_rate`, `priming_rate`, `repair_waste_factor`, `segment_coef_*`, `spiral_coef_*`, `spiral_overhead`. Ці ключі НЕ читаються калькуляторами норії/ТШ/шнека (див. §9).

---

## 9. Суперечності, пастки і відкриті питання

1. **PricingParameter норії/шнека без зв’язку з кодом.** `noria_perf_rate`, `noria_height_rate`, `shnek_diam_rate`, `shnek_length_rate`, `stainless_material_coef` сідаються з `used_in: "NoriaCalculator"/"ShnekCalculator"`, але ні в `app/`, ні в `lib/`, ні в `test/` їх не читають (grep порожній). `NoriaCalculator` і `ShnekCalculator` беруть 1200/800/15/2200 і 1.4 з коду. Зміна у «Фінанси → Параметри» на них не впливає. Це SR-4-рішення власника (ціни/коефіцієнти) — перед переносом в JS варто вирішити, що є джерелом.
2. **CalculatorFormulaModel для noria і shnek неактивні** (`is_active = false` в сідах). Тобто формула з БД не використовується, діє хардкод. Константи в моделі (1200/800, 15/2200) збігаються з кодом.
3. **Коефіцієнт матеріалу NoriaCalculator.** Підпис обирається лише для 1.0 і 1.4. Інші значення множать базу без попередження, з підписом «Сталь ст.3».
4. **Коментар TshMotorTable vs. код TshConveyorCalculator.** Коментар каже «модель і ціна редуктора підбираються з каталогу … за цими кВт», але калькулятор тільки приймає `drive_full_n`. Автопідбір (min ціна з відповідним kW) є лише в `crm_mcp/calc_tools.rb` (MCP `tsh_calc`) і в `screw_drive_options` (шнек). Для JS-порту вирішити, чи автопідбір входить у ядро.
5. **Посилання на план, якого немає.** Заголовок `tsh_conveyor_calculator.rb` посилається на `vault/projects/new_ax_crm/plans/2026-09-29_tsh-scraper-conveyor-simple-calculator.md`. У `vault/projects/new_ax_crm/plans/` є лише `2026-06-08_marketplace-elevator-equipment.md`, `2026-06-13_ai-team-leads-cross-brainstorm.md`, `2026-06-13_magic-button-cross-brainstorm.md`. Файлу немає.
6. **Таблиця KW для шнека в двох місцях.** `ScrewConveyorSimpleCalculator::KW` (Ruby) і `shnek_core/tables.json` → `crm_kw` містять однакові числа. При правці треба міняти обидва. Поведінка при відсутньому довжині різна: `ScrewConveyorSimple.required_kw` повертає `nil`; `Parts.crm_kw` бере `tbl[min(lc, max_key)]` (затискає до максимуму). Для 250 мм і 9 м: `nil` в обох варіантах, бо `tbl["9"]` відсутній. Для 159 мм і 13 м: `nil` в простому режимі, 4 кВт в ShnekCore.
7. **Два варіанти округлення.** `Pricing::Rounding.to_multiple_of_3` (BigDecimal round(2), ceil, кратне 3) для норії, ТШ, шнека простого режиму, NKZ. `Util.ceil3` (ceil(x − 1e-9) і кратне 3) для ShnekCore. Для тих самих входів можливі різниці на межі. Також `Util.r` (half-up через floor(x·10^d+0.5)) ≠ `Float#round` в Ruby на граничних значеннях; у JS використовувати ту саму функцію, що в `shnek_core.js`.
8. **Шнек простий: ціна мотор-редуктора відрізняється від двигуна лише базою.** `gear` → шківи замінюються на 3000 (`screw_conv_gear_base`), але коефіцієнти ті самі. Це задумано (коментар), але варто підтвердити.
9. **NKZ: типи.** `Product::NKZ_TYPES` містить 175, таблиця `BASE_HEIGHTS` теж. Vault-нотатка казала «НКЗ 5/10/25/50/100/200». Розбіжність документації, не коду.
10. **NKZ: накладні і маржа = 0 за замовчуванням.** `NkzCalculator#initialize` примусово ставить `overhead_pct = max(param, 0)` без дефолту 15, тому `BaseCalculator#call` дає sale = `to_multiple_of_3(total)`. Коментар: «Ціни в каталозі НКЗ вже продажні з ПДВ». Це свідома різниця з Noria/Shnek (там 15 % і 20 %).
11. **Шнек ShnekCore і шнек простий** — два окремих розрахунки з різною логікою (ShnekCore: фізика, вага, матеріали; простий: довідкові ціни). `LegacyPrefill.legacy?` визначає, який рахувати. Для порту уточнити, чи простий режим ще потрібен.
12. **GearMotor (`gear_motors`) vs DrivePrice (`drive_prices`).** Калькулятори (`DrivePricing`) читають тільки `drive_prices`. `gear_motors` має контролер, але в сервісах немає читання. Чи таблицю ще потрібно зберігати — відкрите питання.
13. **Немає повного каталогу в репо.** Для JS-порту з JSON потрібен експорт з БД (`drive_prices` де `active` і `purchase_price_vat > 0`) і таблиці `tsh_motor_kw.yml` (зараз порожня). Без них не можна перевірити ТШ чи шнек на реальних даних.
14. **Тестові golden-дані.** `test/fixtures/files/shnek_core_golden.json` має `cfg` з тими самими числами, що `tables.json`, і використовується для порівняння з JS. Перевірити, що цей файл не розходиться з `tables.json` після змін.
15. **`Calculators::NoriaCalculator` живий.** Він не мертвий: реєстр і портал його використовують (vault decision note 2026-06-16, оновлення 2026-06-17). Блоковий калькулятор «Норія» в CRM тепер NKZ.
16. **Ціни-заглушки.** Vault-нотатка згадує, що деякі ціни в NKZ-каталозі = 100 грн (placeholder). У коді не перевіряється.
17. **Підозрілі ціни.** `buy.belt = 28.41` позначено в JSON як «підозріло низька». `coupling_s = 900` і `pulley_*` — «оцінка», не закупівля.
18. **Невідомі параметри shnek_core.** `motor_reserve 1.2`, `fs 1.25`, `n_motor 1450`, `start_k`, `eta_static 0.7`, `worm_eta` (крім 30 і 60), `friction` для feed/wet/abr, `rho` для всіх профілів. Позначено `confirmed: false` у `tables.json`.

---

## 10. Що не прочитано або прочитано частково

- Повністю прочитано: `noria_calculator.rb`, `tsh_conveyor_calculator.rb`, `tsh_motor_table.rb`, `screw_conveyor_simple_calculator.rb`, `shnek_calculator.rb`, `nkz_calculator.rb`, `base_calculator.rb`, `shnek_core/{config,util,pricing,geometry,parts,quote,legacy_prefill,tables.json}.rb`, `shnek_core/drive/{power,select,gearbox,profiles}.rb`, `drive_pricing.rb`, моделі `drive_price`, `gear_motor`, `pricing_parameter`, міграції, сіди `pricing_parameters.rb`, `calculator_formula_models.rb`, тести норії/ТШ/шнека, три vault-нотатки (частково: session і decision повністю, brainstorm — лише пошуком, без таблиць з цінами).
- `db/seeds/calculator_material_configs.rb` прочитано частково (лише початок, матриця матеріалів не вивчена).
- `app/javascript/lib/shnek_core.js` і `test/services/calculators/shnek_core*_test.rb` не читалися.
- Vault-brainstorm `brainstorms/2026-05-09_noria-dismountable-engineering-calc.md` — лише пошук, не читався повністю. У ньому є тільки кілька згадок (NcRozbornaCalculator, 41 961 грн за НКЗ-10/10м), без каталогу мотор-редукторів.
- Google Apps Script каталог (`noria`, `motor`, `g_motor`) не викликався.
- Рядки `drive_prices` з бази даних не перевірялися (БД не доступна у цій сесії, і це вказано у завданні як read-only).
- `bundle exec rails runner` не запускався, тому жодного числа, отриманого через виконання, немає. Усі числа — з файлів.
