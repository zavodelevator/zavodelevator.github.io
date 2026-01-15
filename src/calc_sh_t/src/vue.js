window.MR_DATA = [];
new Vue({
    el: '#distributorApp',
    data: {
      hasDistributor: false,
      distributorLength: null,
      data_shkr: [],
      selectedTsh: "25",
      tableData: {},
      selectedMrId: null,
      mrBrand: "",
      tables: [
        {
          name: "MR",
          url: "https://script.google.com/macros/s/AKfycbzMg_jaGqQkMSqjXQAbhsvaCc16n-Cn2513om5-vNgU-uFJL4Z-gFpoXSkQgev5stsB/exec"
        },
        {
          name: "tsh_parts_price",
          url: "https://script.google.com/macros/s/AKfycbwgvuaBSBb-EEkWGwFCV0gYjOcJ7e94Lko8qmCh2qrniXMVFpAomypQJQvjSBCm6q4L/exec"
        },
        {
          name: "tsh_leangth_kWt",
          url: "https://script.google.com/macros/s/AKfycbxNZn_bJqPj7QuhZJC-gkzEWW3NauE5cAySfQ_nhEoX3kB0dRGatP3i_0m_qd7fWbQIhA/exec"
        }
      
      ]
    },
    computed: {
        currentImage() {
            return this.hasDistributor ? 'src/calc_sh_t/src/img/Scraper_conveyor2.png' : 'src/calc_sh_t/src/img/banner22.jpg'
        },
        currentTshImage() {
            return 'src/calc_sh_t/src/img/TSH' + this.selectedTsh + '.jpg'
        },
        mrOptions() {
          let raw = window.MR_DATA || [];
          if (!Array.isArray(raw)) raw = [];
          const normalized = raw.map(it => {
            let name = it.name || it.Name || '';
            let kWt = it.kWt ?? it.kwt ?? it.kW ?? it.kw ?? '';
            if (typeof kWt === 'string') kWt = kWt.replace(',', '.');
            let gab = it.gab ?? it.Gab ?? it.size ?? '';
            let price = it.price ?? it.Price ?? '';
            let id = it.id ?? it.ID ?? it.Id ?? null;
            return { name, kWt, gab, price, id };
          }).filter(it => it.name || it.id);
          const brand = String(this.mrBrand || '').trim().toLowerCase();
          let base = normalized.filter(it => {
            const n = String(it.name || '').trim().toLowerCase();
            return n !== 'без приводу' && (!brand || n === brand);
          });
          if (!base.length) {
            base = normalized.filter(it => String(it.name || '').trim().toLowerCase() !== 'без приводу');
          }
          const noDrive = normalized.find(it => String(it.name || '').trim().toLowerCase() === 'без приводу') || { name: 'Без приводу', kWt: '', gab: '', price: '', id: 'no_drive' };
          return [noDrive, ...base];
        }
        },
       
  
    methods: {
      processData() {
        this.tables.forEach(item => {
          $.ajax({
            url: item.url,
            dataType: "json",
            success: (data) => {
              this.tableData[item.name] = data;
              this.data_shkr.push(item.name, data);
              console.log('Отримані дані:', this.data_shkr);
              if (item.name === 'MR') {
                console.log('MR options loaded:', this.tableData['MR']);
                let d = data;
                if (typeof d === 'string') {
                  try { d = JSON.parse(d) } catch(e) { d = [] }
                }
                if (d && Array.isArray(d.data)) d = d.data;
                window.MR_DATA = Array.isArray(d) ? d : [];
                console.log('MR_DATA set:', window.MR_DATA);
              }
            },
            error: (xhr, status, error) => {
              console.error("Помилка при отриманні даних:", status, error);
            }
          });
        });
      },
      formatMrOption(mr) {
        const parts = [];
        if (mr.name) parts.push(mr.name);
        if (mr.gab) parts.push(mr.gab);
        if (mr.kWt) parts.push(mr.kWt + ' кВт');
        if (mr.price) parts.push(mr.price);
        return parts.join(' | ');
      }
    },
    created() {
      console.log('Конфігурація таблиць:', this.tables);
    },
    mounted() {
      this.processData();
     
    }
  })
