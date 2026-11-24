# Калькулятори обладнання (calc/)

Статичні сторінки: HTML + JavaScript + JSON, без збирання. Вигляд як у старих сторінках сайту (Bootstrap 4.3.1).

| Сторінка | Дані | Джерело формули |
|---|---|---|
| `repair.html` — ремонт шнека | `data/repair.json`, `data/metals.json` | Google Sheet «РЕМОНТ шнека», вкладка РШ (контроль 9 336) + сегменти з CRM |
| `screw.html` — шнековий транспортер | `data/screw_conveyor.json` (простий прайс), `data/shnek_core.json` (детальний), `data/gear_motors.json` | простий: CRM `ScrewConveyorSimpleCalculator`; детальний: `js/shnek_core.js` = порт CRM `app/javascript/lib/shnek_core.js`, звірено з 57 golden-кейсами CRM |
| `noria.html` — норія | `data/noria.json`, `data/gear_motors.json` | вузли (ціни ще 0) + паперовий прайс довідково |
| `tsh.html` — шкребковий ТШ | `data/tsh.json`, `data/gear_motors.json` | Google Sheet «РЕМОНТ шнека», вкладка ТШ = CRM `TshConveyorCalculator` |
| `spiral.html` — цільнотягнута спіраль | `data/spiral.json`, `data/metals.json` | CRM `SpiralCalculator`, ПДВ 20% один раз |

## Як відкрити
JSON читається через `fetch`, тому подвійний клік по файлу не спрацює. Потрібен веб-сервер:
```
cd zavodelevator.github.io
python -m http.server 8000
```
і відкрити `http://localhost:8000/calc/`. На GitHub Pages працює одразу.

## Як змінити ціни
- **На один розрахунок** — кнопка «⚙ Параметри» праворуч. Змінені поля підсвічуються жовтим; «Скинути» повертає значення з JSON.
- **Назавжди** — відредагувати потрібний файл у `data/` і закомітити.

## Ціна в результаті
`собівартість (сума складових) → + націнка % → ПДВ → вгору до кратного 3`.
Якщо `pricing.vat_included = true` (ТШ, шнек, норія — ціни в таблицях уже з ПДВ), ПДВ виділяється з ціни, а не додається.
Націнка за замовчуванням 0%, щоб ціни збігалися з нинішніми таблицями.

## Для розробника
`js/core.js` — спільне ядро: `Calc.boot({ data, pricing, init, panel, compute })`.
- `data` — імена JSON з `data/`; `pricing` — у якому з них лежить блок `pricing`.
- `panel(D)` — вкладки правої панелі: `{ tab, note, fields: [{ path, label, unit, type: number|checkbox|select|table, columns }] }`.
- `compute(D, inputs)` → `{ title, rows: [{ name, qty, unit, price, note }], info: [{ label, value }], warnings: [] }` або `{ error }`.
Новий калькулятор = HTML за зразком `tsh.html` + `js/<name>.js` + `data/<name>.json`.
