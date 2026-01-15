new Vue({
    el: '#distributorApp',
    data: {
      hasDistributor: false,
      distributorLength: null,
      data_shkr: [],
      selectedTsh: "25",
      tableData: {},
      selectedMr: null,
      mrBrand: "Neromotori",
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
            let raw = this.tableData['MR']
            if (!raw) return []
            if (typeof raw === 'string') {
                try { raw = JSON.parse(raw) } catch (e) { return [] }
            }
            if (raw && Array.isArray(raw.data)) {
                raw = raw.data
            }
            if (!Array.isArray(raw)) return []
            const normalized = raw.map(it => ({
                name: it.name ?? it.Name ?? '',
                kWt: String(it.kWt ?? it.kwt ?? it.kW ?? '').replace(',', '.'),
                gab: it.gab ?? it.Gab ?? '',
                price: it.price ?? it.Price ?? '',
                id: it.id ?? it.ID ?? ''
            }))
            const brand = (this.mrBrand || '').trim().toLowerCase()
            const filtered = normalized.filter(it => {
                const n = (it.name || '').trim().toLowerCase()
                return n && n !== 'без приводу' && (!brand || n === brand)
            })
            return filtered.length ? filtered : normalized.filter(it => (it.name || '').trim().toLowerCase() !== 'без приводу')
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
              }
            },
            error: (xhr, status, error) => {
              console.error("Помилка при отриманні даних:", status, error);
            }
          });
        });
      }
    },
    created() {
      console.log('Конфігурація таблиць:', this.tables);
    },
    mounted() {
      this.processData();
      this.$watch(() => this.tableData['MR'], (val) => {
        try {
          const len = Array.isArray(val) ? val.length : (val && Array.isArray(val.data) ? val.data.length : 0)
          console.log('MR loaded length:', len)
        } catch(e) {}
      }, { deep: true })
    }
  })
