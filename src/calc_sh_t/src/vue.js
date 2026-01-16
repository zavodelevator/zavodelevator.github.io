/* 
Докладний опис (для новачка):
- Цей файл створює невеликий застосунок на Vue.js для роботи з даними TSH/MR.
- Застосунок завантажує дані з трьох Google Apps Script URL та показує їх у інтерфейсі.
- Головні частини: реактивні дані (data), обчислювані властивості (computed), методи (methods), життєві цикли (created, mounted).
- jQuery $.ajax використовується для отримання JSON-відповідей.
*/
// Глобальний кеш для списку приводів MR; використовується у computed mrOptions
window.MR_DATA = [];
// Створення інстансу Vue та підключення до елемента #distributorApp
new Vue({
    el: '#distributorApp',
    // data: реактивні змінні, які керують станом інтерфейсу
    data: {
      hasDistributor: false, // чи вибрано дистриб’ютора (впливає на банер)
      distributorLength: null, // довжина/параметр дистриб’ютора
      data_shkr: [], // накопичення сирих даних для логування
      selectedTsh: "25", // вибраний тип TSH для картинки
      tableData: {}, // відповіді сервера по кожній таблиці
      selectedMrId: null, // id вибраного приводу MR
      mrData: [],
      lengthTrans: null,
      tshLKData: [],
      tables: [ // конфігурація джерел даних
        {
          name: "MR", // довідник приводів MR
          url: "https://script.google.com/macros/s/AKfycbzMg_jaGqQkMSqjXQAbhsvaCc16n-Cn2513om5-vNgU-uFJL4Z-gFpoXSkQgev5stsB/exec"
        },
        {
          name: "tsh_parts_price", // ціни на запчастини TSH
          url: "https://script.google.com/macros/s/AKfycbwgvuaBSBb-EEkWGwFCV0gYjOcJ7e94Lko8qmCh2qrniXMVFpAomypQJQvjSBCm6q4L/exec"
        },
        {
          name: "tsh_leangth_kWt", // відповідність довжини та кВт для TSH
          url: "https://script.google.com/macros/s/AKfycbxNZn_bJqPj7QuhZJC-gkzEWW3NauE5cAySfQ_nhEoX3kB0dRGatP3i_0m_qd7fWbQIhA/exec"
        }
      
      ]
    },
    // computed: автоматично перераховувані значення на основі даних
    computed: {
        // currentImage — вибір банера залежно від hasDistributor
        currentImage() {
            return this.hasDistributor ? 'src/calc_sh_t/src/img/Scraper_conveyor2.png' : 'src/calc_sh_t/src/img/banner22.jpg'
        },
        // currentTshImage — шлях до зображення TSH залежно від selectedTsh
        currentTshImage() {
            return 'src/calc_sh_t/src/img/TSH' + this.selectedTsh + '.jpg'
        },
        // mrOptions — нормалізація та фільтрація списку MR з window.MR_DATA
        mrOptions() {
          let raw = this.mrData || [];
          if (!Array.isArray(raw)) raw = [];
          const normalized = raw.map(it => {
            let name = it.name || it.Name || '';
            let kWt = it.kWt ?? it.kwt ?? it.kW ?? it.kw ?? '';
            if (typeof kWt === 'string') kWt = kWt.replace(',', '.'); // заміна коми у значенні кВт
            let gab = it.gab ?? it.Gab ?? it.size ?? '';
            let price = it.price ?? it.Price ?? '';
            let id = it.id ?? it.ID ?? it.Id ?? null;
            return { name, kWt, gab, price, id };
          }).filter(it => it.name || it.id);
          let base = normalized.filter(it => String(it.name || '').trim().toLowerCase() !== 'без приводу');
          // Додаємо опцію "Без приводу" на початок
          const noDrive = normalized.find(it => String(it.name || '').trim().toLowerCase() === 'без приводу') || { name: 'Без приводу', kWt: '', gab: '', price: '', id: 'no_drive' };
          return [noDrive, ...base];
        },
        recommendedKwt() {
          const rows = Array.isArray(this.tshLKData) ? this.tshLKData.slice() : [];
          const prodSel = String(this.selectedTsh || '').trim();
          const normProdSel = prodSel.replace(/[^\d]/g, '');
          const filtered = rows.filter(r => String(r.prod).replace(/[^\d]/g, '') === normProdSel)
            .sort((a, b) => (a.L - b.L));
          if (!filtered.length) return '';
          const totalLen = Number(this.lengthTrans) || 0;
          const distLen = this.hasDistributor ? (Number(this.distributorLength) || 0) : 0;
          const effLen = Math.max(totalLen - distLen, 0);
          const findRow = (arr, target) => {
            let row = arr.find(r => r.L === target);
            if (row) return row;
            row = arr.find(r => r.L >= target);
            if (row) return row;
            return arr[arr.length - 1];
          };
          const baseRow = findRow(filtered, effLen);
          const baseKwt = Number(baseRow && baseRow.kwt) || 0;
          let distKwt = 0;
          if (this.hasDistributor && distLen > 0) {
            const distRow = findRow(filtered, distLen);
            distKwt = Number(distRow && distRow.rozp) || 0;
          }
          const result = baseKwt + distKwt;
          return result ? String(result).replace(/\.0+$/, '') : '';
        },
        recommendedKwtDebug() {
          const rows = Array.isArray(this.tshLKData) ? this.tshLKData.slice() : [];
          const prodSel = String(this.selectedTsh || '').trim();
          const normProdSel = prodSel.replace(/[^\d]/g, '');
          const filtered = rows.filter(r => String(r.prod).replace(/[^\d]/g, '') === normProdSel)
            .sort((a, b) => (a.L - b.L));
          if (!filtered.length) return '';
          const totalLen = Number(this.lengthTrans) || 0;
          const distLen = this.hasDistributor ? (Number(this.distributorLength) || 0) : 0;
          const effLen = Math.max(totalLen - distLen, 0);
          const findRow = (arr, target) => {
            let row = arr.find(r => r.L === target);
            if (row) return row;
            row = arr.find(r => r.L >= target);
            if (row) return row;
            return arr[arr.length - 1];
          };
          const baseRow = findRow(filtered, effLen);
          const baseKwt = Number(baseRow && baseRow.kwt) || 0;
          let distKwt = 0;
          let distRow = null;
          if (this.hasDistributor && distLen > 0) {
            distRow = findRow(filtered, distLen);
            distKwt = Number(distRow && distRow.rozp) || 0;
          }
          const result = baseKwt + distKwt;
          const parts = [
            'prod=' + normProdSel,
            'L_total=' + (isNaN(totalLen) ? '' : totalLen),
            'L_dist=' + (isNaN(distLen) ? '' : distLen),
            'L_eff=' + (isNaN(effLen) ? '' : effLen),
            'base(L=' + (baseRow ? baseRow.L : '') + ')->kwt=' + baseKwt,
            'L_dist(rozp): L=' + (distRow ? distRow.L : '') + ' -> ' + distKwt,
            'result=' + result
          ];
          return parts.join(' | ');
        }
        },
       
  
    // methods: завантаження та форматування даних
    methods: {
      // processData — завантажує всі таблиці через AJAX і кешує MR
      processData() {
        this.tables.forEach(item => {
          $.ajax({
            url: item.url,
            dataType: "json",
            success: (data) => {
              this.tableData[item.name] = data; // збереження відповіді у словнику tableData
              this.data_shkr.push(item.name, data); // накопичення для діагностики
              console.log('Отримані дані:', this.data_shkr);
              if (item.name === 'MR') { // додаткова обробка для таблиці MR
                console.log('MR options loaded:', this.tableData['MR']);
                let d = data;
                if (typeof d === 'string') { // якщо прийшов рядок — пробуємо розпарсити JSON
                  try { d = JSON.parse(d) } catch(e) { d = [] }
                }
                if (d && Array.isArray(d.data)) d = d.data; // якщо відповідь у полі data — беремо його
                window.MR_DATA = Array.isArray(d) ? d : []; // кешуємо масив записів MR
                this.mrData = Array.isArray(d) ? d : [];
                console.log('MR_DATA set:', window.MR_DATA);
                this.$nextTick(() => {
                  const first = this.mrOptions && this.mrOptions[0];
                  this.selectedMrId = first ? (first.id || first.name) : null;
                });
              } else if (item.name === 'tsh_leangth_kWt') {
                let d = data;
                if (typeof d === 'string') {
                  try { d = JSON.parse(d) } catch(e) { d = [] }
                }
                if (d && Array.isArray(d.data)) d = d.data;
                const arr = Array.isArray(d) ? d : [];
                const norm = arr.map(it => {
                  let prod = it.prod ?? it.Prod ?? it.product ?? it.PROD ?? '';
                  prod = String(prod).trim();
                  let L = it.L ?? it.length ?? it.Len ?? 0;
                  if (typeof L === 'string') L = Number(L.replace(',', '.')) || 0;
                  let kwt = it.kwt ?? it.kWt ?? it.kW ?? it.kw ?? 0;
                  if (typeof kwt === 'string') kwt = Number(kwt.replace(',', '.')) || 0;
                  let rozp = it.rozp ?? it.Rozp ?? it.distributor ?? 0;
                  if (typeof rozp === 'string') rozp = Number(rozp.replace(',', '.')) || 0;
                  return { prod, L: Number(L) || 0, kwt: Number(kwt) || 0, rozp: Number(rozp) || 0 };
                }).filter(r => r.prod && (r.L || r.kwt || r.rozp));
                this.tshLKData = norm;
              }
            },
            error: (xhr, status, error) => {
              console.error("Помилка при отриманні даних:", status, error); // обробка помилок мережі
            }
          });
        });
      },
      // formatMrOption — формує читабельний рядок для показу у списку MR
      formatMrOption(mr) {
        const parts = [];
        if (mr.name) parts.push(mr.name);
        if (mr.gab) parts.push(mr.gab);
        if (mr.kWt) parts.push(mr.kWt + ' кВт');
        if (mr.price) parts.push(mr.price);
        return parts.join(' | ')
      }
    },
    // created — логування конфігурації джерел даних при ініціалізації
    created() {
      console.log('Конфігурація таблиць:', this.tables);
    },
    // mounted — запуск завантаження даних після монтування компонента
    mounted() {
      this.processData();
     
    }
  })

