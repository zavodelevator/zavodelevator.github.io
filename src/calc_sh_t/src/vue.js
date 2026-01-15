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
      }
    },
    created() {
      console.log('Конфігурація таблиць:', this.tables);
    },
    mounted() {
      this.processData();
     
    }
  })
