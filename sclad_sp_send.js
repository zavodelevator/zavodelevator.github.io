alert("Hello25");

  // Ініціалізація: перемикачі, Enter, завантаження даних
  $(document).ready(function(){

  $(document).ready(function() {
    // Перемикання кнопок-груп: керує класом active і станом checked
    $(document).on('click', '.btn-group-toggle label', function() {
      const group = $(this).closest('.btn-group-toggle');
      group.find('label').removeClass('active');
      $(this).addClass('active');
      group.find('input[type=radio]').prop('checked', false);
      $(this).find('input[type=radio]').prop('checked', true);
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
      },
      error: function(xhr, status, error) {            
        console.error("Error fetching data:", error);
      }
    });
    console.log("move_sp_json:");
    console.log(JSON.parse(localStorage.getItem('move_sp_json')));
  
    
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

  // Функція для розрахунку скоригованого saldo_prc з урахуванням рухів
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
        });
    }
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


            <!-- Приховані службові дані для MiniForm -->
            <input type="hidden" id="miniFormN_p" value="${item.n_p}">
            <input type="hidden" id="miniFormDataText" value="${text}">

          </div>
          <!-- Кнопка запису операції -->
          <button type="button" class="btn btn-sm btn-success" onclick="saveMiniForm()">Записати</button>
        </div>
      </div>
    </form>
  `;



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

// Закриття MiniForm і очищення вмісту
function closeMiniForm() {
  const miniForm = document.querySelector('.MiniForm');
  miniForm.style.display = 'none';
  miniForm.innerHTML = '';
}

// Функція для збереження даних з MiniForm та відправки до Google Sheets
function saveMiniForm() {
  const n_p = document.getElementById('miniFormN_p').value;
  const operationType = document.querySelector('input[name="debetCredit"]:checked')?.value || 'credit';
  const creditValue = document.getElementById('creditParam')?.value || '';
  const debetValue = document.getElementById('debetParam')?.value || '';
  const noteValue = document.getElementById('note')?.value || '';
  
  // Заповнюємо приховані поля форми
  const form = document.forms['submit-to-google-sheet'];
  form.timestamp.value = new Date().toISOString();
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
