// alert("Hello 38");

// Ініціалізація: перемикачі, Enter, завантаження даних
  // Функція для оновлення положення та вмісту липкого заголовка
  function updateStickyHeader() {
    const originalTable = document.getElementById('table_resault');
    if (!originalTable) {
        $('#sticky-header-container').hide();
        return;
    }
    
    const tableRect = originalTable.getBoundingClientRect();
    const thead = originalTable.querySelector('thead');
    const theadRect = thead.getBoundingClientRect();
    
    // Показуємо липкий заголовок, коли оригінальний заголовок виходить за межі екрану зверху,
    // але таблиця все ще видима
    if (tableRect.top < 0 && tableRect.bottom > theadRect.height) {
        let stickyContainer = $('#sticky-header-container');
        if (stickyContainer.length === 0) {
            stickyContainer = $('<div id="sticky-header-container"><table class="table mb-0" style="background:white; table-layout: fixed;"><thead></thead></table></div>');
            stickyContainer.css({
                'position': 'fixed',
                'top': '0',
                'z-index': '1000',
                'background': 'white',
                'box-shadow': '0 2px 5px rgba(0,0,0,0.1)',
                'overflow': 'hidden'
            });
            $('body').append(stickyContainer);
        }
        
        const stickyTable = stickyContainer.find('table');
        const stickyThead = stickyTable.find('thead');
        
        // Синхронізуємо вміст заголовка (тільки якщо змінився або порожній)
        // Для простоти можна оновлювати завжди або перевіряти html
        stickyThead.html($(thead).html());
        
        // Синхронізуємо ширину колонок
        const originalThs = $(thead).find('th');
        const stickyThs = stickyThead.find('th');
        originalThs.each(function(index) {
            const w = $(this)[0].getBoundingClientRect().width;
            stickyThs.eq(index).css({
                'width': w + 'px',
                'min-width': w + 'px',
                'max-width': w + 'px',
                'box-sizing': 'border-box'
            });
        });
        
        // Синхронізуємо позицію контейнера
        stickyContainer.css({
            'display': 'block',
            'left': tableRect.left + 'px',
            'width': tableRect.width + 'px'
        });
        
    } else {
        $('#sticky-header-container').hide();
    }
  }

  $(document).ready(function(){

  $(document).ready(function() {
    // Слухачі подій для липкого заголовка
    $(window).on('scroll resize', updateStickyHeader);

    // Перевірка ширини екрану та автоматичне перемикання
    if ($(window).width() < 800) {
      $('#option1').prop('checked', true).trigger('change');
      $('#option2').prop('checked', false);
      $('#option1').closest('.btn-group-toggle').find('label').removeClass('active');
      $('#option1').closest('label').addClass('active');
    } else {
      $('#option2').prop('checked', true).trigger('change');
      $('#option1').prop('checked', false);
      $('#option2').closest('.btn-group-toggle').find('label').removeClass('active');
      $('#option2').closest('label').addClass('active');
    }

    // Перемикання кнопок-груп: керує класом active і станом checked (тільки для радіо кнопок)
    $(document).on('click', '.btn-group-toggle label', function() {
      const input = $(this).find('input');
      // Застосовуємо логіку перемикання тільки для радіо кнопок
      if (input.attr('type') === 'radio') {
        const group = $(this).closest('.btn-group-toggle');
        group.find('label').removeClass('active');
        $(this).addClass('active');
        group.find('input[type=radio]').prop('checked', false);
        input.prop('checked', true).trigger('change');
      }
    });

    // Зміна вигляду блок/таблиця тригерить ререндер
    $(document).on('change', 'input[name="options"]', function() {
      displayContent();
    });
     
     $('form').on('submit', function(e){ e.preventDefault(); displayContent(); });
     $('#dd').on('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); displayContent(); }});
  });
          
    // Завантаження даних із Google Apps Script у localStorage
    $.ajax({
      url: "https://script.google.com/macros/s/AKfycby1pO_94xtHo1m6LhtMEB8RlsBt6XkIq3FNSgTktGHn0xHmTrPjuJiNLy0CminF7t-YtQ/exec",
      dataType: "json",
      success: function(data) {
        localStorage.setItem('sclad_sp_json', JSON.stringify(data)); 
      },
      error: function(xhr, status, error) {            
        console.error("Error fetching data:", error);
      }
    });

        $.ajax({
      url: "https://script.google.com/macros/s/AKfycbyWDKmixxIOMG-ci3evfbLorrkXX41_bP6qmAWqR24Y_36HAZ6bnfYJ7OZwKjs_Dwi9Zw/exec",
      dataType: "json",
      success: function(data) {
        localStorage.setItem('move_sp_json', JSON.stringify(data)); 
        console.log("Movement data loaded successfully:", data.length, "records");
      },
      error: function(xhr, status, error) {            
        console.error("Error fetching movement data:", error);
      }
    });
  
    
  });
  
  // Фільтрація: підтримує '', '*d', '*d1-d2', 'dd1-dd2', точне 'dd'
  function filterByDd(dd) {
    let a = JSON.parse(localStorage.getItem('sclad_sp_json')) || [];
    customSort(a);
    console.log(a);
    
    if (dd === "") {
      return a;
    }

    if (dd[0] === "*" && dd.includes("-")) {
      let ddd = dd.slice(1);
      let tamp = [];
      let range_arrey = ddd.split("-").map(Number);
      
      for (let i = range_arrey[0]; i <= range_arrey[1]; i++) {
        console.log("a")
        let res_fil = a.filter((item) => item.d == i);
        tamp = tamp.concat(res_fil);
      }
      return tamp;
    }
    
    if (dd[0] === "*") {
      let ddd = dd.slice(1);
      let res_fil = a.filter((item) => item.d == ddd);       
      return res_fil;
    }
  
    if (dd.includes("-")) {
      let tamp = [];
      let range_arrey = dd.split("-").map(Number);
        
      for (let i = range_arrey[0]; i <= range_arrey[1]; i++) {
        let res_fil = a.filter((item) => item.dd == i);
        tamp = tamp.concat(res_fil);
      }
      return tamp;
    }
  
    return a.filter((item) => item.dd === dd);
  }
  
  // Округлення до десятої (0.1)
  function roundToDecimal(number) {
    return Math.round(number * 10) / 10;
  }

  // Функція для розрахунку скоригованого saldo_prc з урахуванням руху
  function calculateAdjustedSaldoPrc(item) {
    const moveData = JSON.parse(localStorage.getItem('move_sp_json')) || [];
    
    // Нормалізація ID для порівняння (прибираємо пробіли, приводимо до рядка)
    const normalize = (val) => String(val).trim();
    const itemId = normalize(item.n_p);
    
    const movements = moveData.filter(move => {
      // Перевіряємо різні варіанти назви поля ID в об'єкті move
      const moveId = move.id || move.ID || move.n_p;
      return normalize(moveId) === itemId;
    });
    
    let adjustedSaldoPrc = parseFloat(item.saldo_prc) || 0;
    
    movements.forEach(move => {
      const kt = parseFloat(move.kt) || 0;
      const dt = parseFloat(move.dt) || 0;
      
      // Віднімаємо кредит (kt) та додаємо дебет (dt)
      adjustedSaldoPrc -= kt;
      adjustedSaldoPrc += dt;
    });
    
    return Math.max(0, adjustedSaldoPrc); // Не даємо значенню бути менше 0
  }
      

// Сортування записів: спочатку dd, потім d, потім p
function customSort(arr) {
    arr.sort((a, b) => {
        if (a.dd !== b.dd) {
            return a.dd - b.dd;
        } else if (a.d !== b.d) {
            return a.d - b.d;
        } else {
            return a.p - b.p;
        }
    });
    return arr;
}

  // Рендер відфільтрованого контенту у вигляді блоків або таблиці
  function displayContent() {
    $(".product-container").empty();
    const dd = document.getElementById('dd').value;
    const result = filterByDd(dd);
    const productContainer = document.querySelector('.product-container');
    const option1 = document.getElementById('option1');

    // Define spiral_calculation function
    function spiral_calculation(data) {
        let length_inner_line = function(sp_d, sp_p) { 
            return Math.sqrt(Math.pow(Math.PI * sp_d, 2) + Math.pow(sp_p, 2));
        };
        
        let hight_shtrips = function(sp_dd, sp_d) {
            return (sp_dd - sp_d) / 2;
        };
        
        let count_segment_on_m = function(sp_p) {
            return 1000 / sp_p;
        };
        
        let leangrth_shtrp_on_m = function(length_inner_line, count_segment_on_m) {
            return length_inner_line * count_segment_on_m * 1.3;
        };
        
        let mass_m_spirall = function(sp_s, hight_shtrips, leangrth_shtrp_on_m ) {
            return (sp_s * hight_shtrips * leangrth_shtrp_on_m  * 0.00786) / 1000;
        };
        
        let price_rozdr = function(mass_m_spirall) {
            return Math.round((mass_m_spirall * 1.1 * 55 * 6 * 1.1) / 3) * 3;
        };
        
        let price_opt = function(mass_m_spirall) {
            return Math.round((mass_m_spirall * 1.1 * 55 * 5 * 1.1) / 3) * 3;
        };

        let resultArray = [];

        data.forEach((item) => {
            let sp_dd = parseFloat(item.dd);
            let sp_d = parseFloat(item.d);
            let sp_p = parseFloat(item.p);
            let sp_s = parseFloat(item.s);
            
            // Helper values
            let len_inner = length_inner_line(sp_d, sp_p);
            let h_shtrips = hight_shtrips(sp_dd, sp_d);
            let cnt_seg = count_segment_on_m(sp_p);
            let len_shtrp = leangrth_shtrp_on_m(len_inner, cnt_seg);
            let mass = mass_m_spirall(sp_s, h_shtrips, len_shtrp);
            
            resultArray.push({
                price_rozdr: price_rozdr(mass),
                price_opt: price_opt(mass)
            });
        });
        
        return resultArray;
    }

    let spiral_paramm = spiral_calculation(result);

    if (option1.checked) {
        result.forEach((item, index) => {
            const adjustedSaldoPrc = calculateAdjustedSaldoPrc(item);
            const adjustedSaldoM = adjustedSaldoPrc * parseFloat(item.l);
            const productBlock = document.createElement('div');
            productBlock.classList.add('product-block');
            productBlock.innerHTML =
                `<h4>${item.dd}/${item.d}/${item.p}/${item.l_r === "Права" ? "R" : "L"} S-${item.s}мм.</h4>
                <p>L-${item.l}м.</p>
                <p>${adjustedSaldoPrc}шт.</p>
                <p>${roundToDecimal(adjustedSaldoM)}.м</p>
                <p>Роздр: ${spiral_paramm[index].price_rozdr}</p>
                <p>Опт: ${spiral_paramm[index].price_opt}</p>
                <p>${item.sclad}*${item.stilaj}*${item.place_on_sclad}</p>`;
            productContainer.appendChild(productBlock);
        });
    } else {
        const productBlock = document.createElement('div');
        productBlock.classList.add('product-block');
        productBlock.innerHTML =
            `<div class="table-responsive">
                <table class="table" id="table_resault">
                    <thead>
                        <tr>
                            <th>N_p</th>
                            <th>Парам</th>
                            <th>L(м.)</th>
                            <th>ШТ</th>
                            <th>Залиш</th>
                            <th>Склад</th>
                            <th>Роздр</th>
                            <th>Опт</th>
                        </tr>
                    </thead>
                    <tbody class="table_resault">
                        
                    </tbody>
                </table>
            </div>`;
        productContainer.appendChild(productBlock);
        const resultDiv = productBlock.querySelector('.table_resault');

        // Додаємо слухач скролу для горизонтального прокручування
        const tableResponsive = productBlock.querySelector('.table-responsive');
        if(tableResponsive) {
            $(tableResponsive).on('scroll', updateStickyHeader);
        }

        result.forEach((item, index) => {
            const adjustedSaldoPrc = calculateAdjustedSaldoPrc(item);
            const adjustedSaldoM = adjustedSaldoPrc * parseFloat(item.l);

            const itemRow = document.createElement('tr');
            itemRow.innerHTML =
                `<td>${item.n_p}</td>
                <td>
                    ${item.dd}/${item.d}/${item.p}/${item.l_r === "Права" ? "R" : "L"} S-${item.s}мм.
                </td>
                <td>
                    L-${item.l}м.
                </td>
                <td>
                    ${adjustedSaldoPrc}шт.
                </td>
                <td>
                    ${roundToDecimal(adjustedSaldoM)}.м
                </td>
                <td>
                    ${item.sclad}*${item.stilaj}*${item.place_on_sclad}
                </td>
                <td>${spiral_paramm[index].price_rozdr}</td>
                <td>${spiral_paramm[index].price_opt}</td>`;

                resultDiv.appendChild(itemRow);
        });
    }
}
