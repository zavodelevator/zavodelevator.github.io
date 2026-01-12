// alert("Hello33");
// Глобальна змінна для відстеження стану відображення історії руху
let showMovementHistory = false;

// Ініціалізація: перемикачі, Enter, завантаження даних
  $(document).ready(function(){

  $(document).ready(function() {
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

     // Обробка зміни стану чекбокса історії руху
     $(document).on('change', '#movementHistoryCheckbox', function() {
       showMovementHistory = $(this).is(':checked');
       // Видаляємо логіку з класом active для Bootstrap кнопок, оскільки тепер використовуємо кастомний чекбокс
       console.log('Movement history display:', showMovementHistory);
       displayContent();
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
    const movements = moveData.filter(move => String(move.id) === String(item.n_p));
    
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
    const historyCheckbox = document.getElementById('movementHistoryCheckbox');
    if (historyCheckbox) {
      showMovementHistory = historyCheckbox.checked;
    }
    const dd = document.getElementById('dd').value;
    const result = filterByDd(dd);
    const productContainer = document.querySelector('.product-container');
    const option1 = document.getElementById('option1');

    if (option1.checked) {
        result.forEach((item) => {
            const adjustedSaldoPrc = calculateAdjustedSaldoPrc(item);
            const productBlock = document.createElement('div');
            productBlock.classList.add('product-block');
            productBlock.innerHTML =
                `<h4>${item.dd}/${item.d}/${item.p}/${item.l_r === "Права" ? "R" : "L"} S-${item.s}мм.</h4>
                <p>L-${item.l}м.</p>
                <p>${adjustedSaldoPrc}шт.</p>
                <p>${roundToDecimal(item.saldo_m)}.м</p>
                <p>${item.sclad}*${item.stilaj}*${item.place_on_sclad}</p>
                <p>Вміст</p>
                <p>Вміст</p>`;
            productContainer.appendChild(productBlock);

            // Додаємо блок історії руху у режимі "block", якщо чекбокс увімкнено
            if (showMovementHistory) {
              const movementHistoryHTML = generateMovementHistory(item.n_p, /* expanded */ true);
              if (movementHistoryHTML) {
                const historyContainer = document.createElement('div');
                historyContainer.className = 'movement-history-row';
                historyContainer.innerHTML = movementHistoryHTML;
                productBlock.appendChild(historyContainer);
              }
            }
        });
    } else {
        const productBlock = document.createElement('div');
        productBlock.classList.add('product-block');
        productBlock.innerHTML =
            `<div class="table-responsive">
                <table class="table" id="table_resault">
                    <thead>
                        <tr>
                            <th>Парам</th>
                            <th>L(м.)</th>
                            <th>ШТ</th>
                            <th>Залиш</th>
                            <th>Склад</th>
                            <th>N_p</th>
                            <th>Опт</th>
                        </tr>
                    </thead>
                    <tbody class="table_resault">
                        
                    </tbody>
                </table>
            </div>`;
        productContainer.appendChild(productBlock);
        const resultDiv = productBlock.querySelector('.table_resault');

        result.forEach((item) => {
            const adjustedSaldoPrc = calculateAdjustedSaldoPrc(item);
            const movementHistoryHTML = generateMovementHistory(item.n_p);

            const itemRow = document.createElement('tr');
            itemRow.innerHTML =
                `<td>
                    ${item.dd}/${item.d}/${item.p}/${item.l_r === "Права" ? "R" : "L"} S-${item.s}мм.
                </td>
                <td>
                    L-${item.l}м.
                </td>
                <td>
                    ${adjustedSaldoPrc}шт.
                </td>
                <td>
                    ${roundToDecimal(item.saldo_m)}.м
                </td>
                <td>
                    ${item.sclad}*${item.stilaj}*${item.place_on_sclad}
                </td>
                <td>${item.n_p}</td>
                <td>
                  <button type="button" class="btn btn-sm btn-outline-secondary" onclick="openMiniForm(event, '${item.n_p}')">Рух спіралі</button>
                </td>`;

                
                resultDiv.appendChild(itemRow);
                
                // Додаємо рядок з історією руху, якщо увімкнено відображення історії
                if (showMovementHistory) {
                    const movementHistoryHTMLExpanded = generateMovementHistory(item.n_p, /* expanded */ true);
                    if (movementHistoryHTMLExpanded) {
                        const historyRow = document.createElement('tr');
                        historyRow.className = 'movement-history-row';
                        historyRow.innerHTML = `
                            <td colspan="7" class="p-0 border-0">
                                ${movementHistoryHTMLExpanded}
                            </td>
                        `;
                        resultDiv.appendChild(historyRow);
                    }
                }
        });
    }
    
    // Ініціалізуємо перемикачі для новостворених елементів після рендерингу
    initializeMovementHistoryToggle();
}

// MiniForm: показ оверлею праворуч угорі для операції руху
function openMiniForm(ev, n_p) {
  if (ev && ev.preventDefault) { ev.preventDefault(); ev.stopPropagation(); }
  const a = JSON.parse(localStorage.getItem('sclad_sp_json')) || [];
  const item = a.find(x => String(x.n_p) === String(n_p));
  const miniForm = document.querySelector('.MiniForm');
  miniForm.style.display = 'block';
  miniForm.style.position = 'fixed';
  miniForm.style.top = '16px';
  miniForm.style.right = '16px';
  miniForm.style.zIndex = '1050';
  miniForm.style.width = 'min(420px, 95vw)';
  miniForm.style.maxHeight = '80vh';
  miniForm.style.overflowY = 'auto';
  if (!item) {
    miniForm.innerHTML = `<div class="card mt-3"><div class="card-body"><p>Не знайдено: ${n_p}</p><button class="btn btn-sm btn-secondary" onclick="closeMiniForm()">Закрити</button></div></div>`;
    return;
  }
  const l_r = item.l_r === "Права" ? "R" : "L";
  const l_r_text = l_r === "R" ? "Права" : "Ліва";
  const adjustedSaldoPrc = calculateAdjustedSaldoPrc(item);
  const text = `${item.n_p}) ${item.dd}/${item.d}/${item.p}/${l_r_text} S-${item.s}мм. Заг.довж ${item.saldo_m}м. (${adjustedSaldoPrc}шт. по ${item.l}м.) ${item.sclad}*${item.stilaj}*${item.place_on_sclad}`;
  const itemDataStr = JSON.stringify(item);
  
  miniForm.innerHTML = `
    <form action="#" id="miniForm" class="needs-validation" novalidate>
      <div class="card mt-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title">Рух спіралі</h5>
            <button type="button" class="close" onclick="closeMiniForm()">&times;</button>
          </div>
          <p>${text}</p>
          <div class="form-group">
            <div class="form-group">
              <label>Тип операції</label><br>
              <div class="btn-group btn-group-toggle" data-toggle="buttons">
                <label class="btn btn-outline-danger active">
                  <input type="radio" name="debetCredit" value="credit" checked> Кредит
                </label>
                <label class="btn btn-outline-success">
                  <input type="radio" name="debetCredit" value="debet"> Дебет
                </label>
              </div>
            </div>
            <!-- Поля вводу для кредиту/дебету з перемиканням видимості -->
            <div id="creditBlock">
              <label>Кредит (мінус із залишку)</label>
              <input name="creditParam" type="number" id="creditParam" class="form-control" min="0" max="${adjustedSaldoPrc}" step="0.1" placeholder="Кт">
            </div>
            <div id="debetBlock" style="display:none">
              <label>Дебет (плюс до залишку)</label>
              <input name="debetParam" type="number" id="debetParam" class="form-control" min="0" step="0.1" placeholder="Дт">
            </div>

            <div id="note_data">
              <label>Нотатки</label>
              <input name="note" type="text" id="note" class="form-control" placeholder="Нотатки">
            </div>

            <div id="date_data">
              <label>Дата</label>
              <input name="customDate" type="date" id="customDate" class="form-control">
            </div>

            

            <!-- Приховані службові дані для MiniForm -->
            <input type="hidden" id="miniFormN_p" value="${item.n_p}">
            <input type="hidden" id="miniFormDataText" value="${text}">

          </div>
          <!-- Кнопка запису операції -->
          <button type="button" class="btn btn-sm btn-success" onclick="saveMiniForm()">Записати</button>
        </div>
      </div>
    </form>`;



  // Перемикання видимості полів вводу залежно від вибраного типу операції
  const toggleOpInputs = () => {
    const op = document.querySelector('input[name="debetCredit"]:checked')?.value || 'credit';
    const credit = document.getElementById('creditBlock');
    const debet = document.getElementById('debetBlock');
    if (op === 'debet') {
      debet.style.display = '';
      credit.style.display = 'none';
    } else {
      credit.style.display = '';
      debet.style.display = 'none';
    }
  };
  toggleOpInputs();
  document.querySelectorAll('.btn-group.btn-group-toggle input[name="debetCredit"]').forEach(r => {
    r.addEventListener('change', toggleOpInputs);
  });
  document.querySelectorAll('.btn-group.btn-group-toggle label').forEach(l => {
    l.addEventListener('click', toggleOpInputs);
  });
  // Enter у числових полях MiniForm виконує збереження
  const addEnterSubmit = (el) => {
    if (!el) return;
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveMiniForm();
      }
    });
  };
  addEnterSubmit(document.getElementById('creditParam'));
  addEnterSubmit(document.getElementById('debetParam'));
  miniForm.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveMiniForm();
    }
  });
}

// Функція для генерації компактної історії руху
function generateMovementHistory(n_p, expanded = false) {
  const moveData = JSON.parse(localStorage.getItem('move_sp_json')) || [];
  console.log("Searching movements for n_p:", n_p, "in data:", moveData.length, "records");
  
  const movements = moveData.filter(move => {
    const match = String(move.id) === String(n_p);
    console.log("Comparing move.id:", move.id, "with n_p:", n_p, "match:", match);
    return match;
  });
  
  console.log("Found movements:", movements.length);
  
  if (movements.length === 0) {
    return ''; // Повертаємо порожній рядок, якщо немає руху
  }
  
  // Сортуємо за датою (новіші зверху)
  movements.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  let historyHTML = `
    <div class="movement-history-compact">
      <button class="movement-toggle-btn btn btn-sm btn-link p-0 mb-2" type="button" data-target="#movementHistory_${n_p}" aria-expanded="${expanded ? 'true' : 'false'}" style="text-decoration: none; font-size: 0.85rem; border: none; background: none; cursor: pointer;">
        <span class="arrow-icon">▼</span> Історія руху (${movements.length})
      </button>
      <div class="movement-content" id="movementHistory_${n_p}" style="${expanded ? '' : 'display: none;'}">
        <div class="movement-list small">`;
  
  movements.forEach(move => {
    const date = new Date(move.timestamp).toLocaleDateString('uk-UA');
    const operation = parseFloat(move.kt) > 0 ? 'Кредит' : 'Дебет';
    const amount = parseFloat(move.kt) > 0 ? move.kt : move.dt;
    const note = move.note || '';
    const operationClass = parseFloat(move.kt) > 0 ? 'text-danger' : 'text-success';
    
    historyHTML += `
          <div class="movement-item border-bottom pb-1 mb-1">
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-muted">${date}</span>
              <span class="${operationClass} font-weight-bold">${operation}: ${amount}</span>
            </div>`;
    
    if (note) {
      historyHTML += `
            <div class="text-muted small">${note}</div>`;
    }
    
    historyHTML += `
          </div>`;
  });
  
  historyHTML += `
        </div>
      </div>
    </div>`;
  
  return historyHTML;
}

// Закриття MiniForm і очищення вмісту
function closeMiniForm() {
  const miniForm = document.querySelector('.MiniForm');
  miniForm.style.display = 'none';
  miniForm.innerHTML = '';
}

// Додаємо CSS стилі для компактної історії руху
const movementHistoryStyles = `
  .movement-history-compact {
    padding: 0.5rem;
    background-color: #f8f9fa;
  }
  
  .movement-history-compact .movement-toggle-btn {
    color: #6c757d;
    font-size: 0.8rem;
    padding: 0.25rem 0;
    cursor: pointer;
    border: none;
    background: none;
  }
  
  .movement-history-compact .movement-toggle-btn:hover {
    color: #495057;
    text-decoration: none;
  }
  
  .movement-history-compact .movement-toggle-btn[aria-expanded="true"] .arrow-icon {
    transform: rotate(180deg);
    display: inline-block;
    transition: transform 0.2s ease;
  }
  
  .movement-history-compact .arrow-icon {
    display: inline-block;
    transition: transform 0.2s ease;
    font-size: 0.7rem;
    margin-right: 0.25rem;
  }
  
  .movement-list {
    max-height: 200px;
    overflow-y: auto;
    background-color: white;
    border: 1px solid #dee2e6;
    border-radius: 0.25rem;
    padding: 0.5rem;
  }
  
  .movement-item {
    font-size: 0.75rem;
    line-height: 1.2;
  }
  
  .movement-item:last-child {
    border-bottom: none !important;
    margin-bottom: 0 !important;
    padding-bottom: 0 !important;
  }
  
  .movement-history-row {
    background-color: #f8f9fa;
  }
  
  .movement-history-row td {
    padding: 0 !important;
  }
`;

// Додаємо стилі до сторінки
if (!document.getElementById('movementHistoryStyles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'movementHistoryStyles';
  styleElement.textContent = movementHistoryStyles;
  document.head.appendChild(styleElement);
}

// Функція для ініціалізації розкривання блоків історії руху
function initializeMovementHistoryToggle() {
  console.log('Initializing movement history toggle...');
  
  // Використовуємо jQuery для делегування подій
  $(document).off('click', '.movement-toggle-btn').on('click', '.movement-toggle-btn', function(e) {
    e.preventDefault();
    console.log('Movement toggle clicked');
    
    const button = this;
    const targetId = button.getAttribute('data-target');
    const targetElement = $(targetId);
    const arrowIcon = $(button).find('.arrow-icon');
    
    console.log('Target ID:', targetId);
    console.log('Target element found:', targetElement.length > 0);
    
    if (targetElement.length) {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      console.log('Is expanded:', isExpanded);
      
      if (isExpanded) {
        // Закриваємо
        targetElement.hide();
        button.setAttribute('aria-expanded', 'false');
        arrowIcon.css('transform', 'rotate(0deg)');
      } else {
        // Відкриваємо
        targetElement.show();
        button.setAttribute('aria-expanded', 'true');
        arrowIcon.css('transform', 'rotate(180deg)');
      }
    }
  });
}

// Функція для збереження даних з MiniForm та відправки до Google Sheets
function saveMiniForm() {
  const n_p = document.getElementById('miniFormN_p').value;
  const operationType = document.querySelector('input[name="debetCredit"]:checked')?.value || 'credit';
  const creditValue = document.getElementById('creditParam')?.value || '';
  const debetValue = document.getElementById('debetParam')?.value || '';
  const noteValue = document.getElementById('note')?.value || '';
  const customDateValue = document.getElementById('customDate')?.value;
  
  // Заповнюємо приховані поля форми
  const form = document.forms['submit-to-google-sheet'];
  
  if (customDateValue) {
    // Якщо дата вибрана, використовуємо її (час 00:00)
    form.timestamp.value = new Date(customDateValue).toISOString();
  } else {
    // Якщо ні - поточна дата і час
    form.timestamp.value = new Date().toISOString();
  }
  
  form.id.value = n_p;
  form.note.value = noteValue;
  form.dt.value = operationType === 'debet' ? (debetValue || '0') : '0';
  form.kt.value = operationType === 'credit' ? (creditValue || '0') : '0';
  
  // Відправляємо форму до Google Sheets
  form.dispatchEvent(new Event('submit'));
  
  // Закриваємо міні-форму
  closeMiniForm();
}





  const scriptURL = 'https://script.google.com/macros/s/AKfycbxitVPkElsXFU19qbN09FCT2kHYDoTYpfG05z84ltlzUf7XpILyiaUAktt9Eyb7v1KzLg/exec'
  const form = document.forms['submit-to-google-sheet']

  form.addEventListener('submit', e => {
    e.preventDefault()
    fetch(scriptURL, { method: 'POST', body: new FormData(form)})
      .then(response => {
        console.log('Success!', response)
        // Очищаємо форму після успішної відправки
        form.reset()
        // Показуємо повідомлення про успіх (можна додати візуальне сповіщення)
        alert('Дані успішно відправлено до Google Sheets!')
      })
      .catch(error => {
        console.error('Error!', error.message)
        alert('Помилка при відправці даних: ' + error.message)
      })
  })
