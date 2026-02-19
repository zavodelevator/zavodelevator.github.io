

// силка на отримання даних з таблиці https://script.google.com/macros/s/AKfycbz_KMcNXy5f_LuvnduJS3P_IgM1z0Jukn8P78JmGSGAal8qennLE0WJKCEziNQL8UPE/exec
// Endpoint Google Apps Script для отримання даних (JSON)
const NKZ_ENDPOINT = "https://script.google.com/macros/s/AKfycbz_KMcNXy5f_LuvnduJS3P_IgM1z0Jukn8P78JmGSGAal8qennLE0WJKCEziNQL8UPE/exec";

NKZ_data = {};

// Ініціалізація запиту: AbortController з таймаутом, отримання JSON, кешування у window та NKZ_data
(function () {
  const controller = new AbortController();
  const timeout = setTimeout(function () {
    controller.abort();
  }, 15000);

  fetch(NKZ_ENDPOINT, { method: "GET", signal: controller.signal, mode: "cors" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(function (data) {
      console.log("NKZ data:", data);
      window.nkzData = data;
      NKZ_data = data;
      try { initDriveFilters(); } catch (_) {}
      try {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function () { initAfterDataReady(); });
        } else {
          initAfterDataReady();
        }
      } catch (_) {}
    })
    .catch(function (err) {
      console.log("NKZ fetch error:", err);
    })
    .finally(function () {
      clearTimeout(timeout);
    });
})();




//визов методів призавантаженні сторінки
// Ініціалізація обробників після завантаження DOM
document.addEventListener("DOMContentLoaded", function () {  // висота норії
  
});


// висота норії
// Базові висоти норій (м): сума геометрій башмака та голови, приведена до метрів
const baseHeights = { '5': (720 + 955)/1000, '10': (720 + 955)/1000, '25': (955 + 1080)/1000, '50': (955 + 1080)/1000, '100': (1350 + 1210)/1000, '175': (1500 + 1500)/1000, '200': (1500 + 1500)/1000 };


let nkz_h;
let nkz_h_base = null;

let count_nkz_section = {
  one: 0,
  two: 0,
  revision_secton: 1,
  totel: 0
};

total_h_nkz = 0;
rob_h_nkz = 0;


const nkzHeights = Object.fromEntries(Object.entries(baseHeights).map(function ([k, b]) { return [k, Array.from({ length: 26 }, function (_, i) { return b + i + 1; })]; }));
window.l_nkz_5 = nkzHeights['5'];
window.l_nkz_10 = nkzHeights['10'];
window.l_nkz_25 = nkzHeights['25'];
window.l_nkz_50 = nkzHeights['50'];
window.l_nkz_100 = nkzHeights['100'];
window.l_nkz_175 = nkzHeights['175'];
window.l_nkz_200 = nkzHeights['200'];

// логіка каскадного вибору “м-р” винесена у mr_kaskad_selektor_choise.js

// Ініціалізація подій: валідація висоти; запуск фільтрів коли дані готові
document.addEventListener('DOMContentLoaded', function () {
  var heightEl = document.getElementById('nkz_l');
  if (heightEl) {
    heightEl.addEventListener('input', function () { NKZ_HEIGHT(); });
  }
  var typeEl = document.getElementById('nkz_type');
  if (typeEl) {
    nkz_h_base = baseHeights[typeEl.value] || null;
    NKZ_HEIGHT();
    // Показ/приховування чекбокса “Ланцюгова” залежно від обраного типу НКЗ
    // Виклик функції керування видимістю
    setChainCheckboxVisibility(typeEl.value);
    // Оновити вибір норії згідно типу та стану чекбокса
    updateNkzProduct();
    // Оновити селектор стрічка/ланцюг згідно типу та стану “ланцюгова”
    updateConvSelect();

    typeEl.addEventListener('change', function () {
      nkz_h_base = baseHeights[this.value] || null;
      NKZ_HEIGHT();

      // Перерахувати вибір норії при зміні типу
      updateNkzProduct();
      // Перерахувати селектор стрічка/ланцюг при зміні типу
      updateConvSelect();
      // Оновити список ківшів для нової норії
      updateBucketSelect(); // виклик: оновлення UI ківшів відповідно до типу
      // Оновити видимість чекбокса ланюгова відповідно до нового типу
      setChainCheckboxVisibility(this.value);
    });
  }

  // Перерахунок вибору норії при зміні стану чекбокса “Ланцюгова”
  var chainEl = document.getElementById('lan_check');
  if (chainEl) {
    chainEl.addEventListener('change', function () {
      updateNkzProduct();
      // Перерахувати селектор стрічка/ланцюг при зміні стану “ланцюгова”
      updateConvSelect();
      // Перерахувати ківші при зміні стану “ланцюгова”
      updateBucketSelect(); // виклик: синхронізувати вибір ківшів із режимом ланцюга/стрічки
    });
  }
  // Збереження вибраного елемента стрічка/ланцюг при зміні селектора
  var convEl = document.getElementById('conv_item');
  if (convEl) {
    convEl.addEventListener('change', function () {
      var v = this.value;
      nkz_conv = __convMap.get(v) || null;
      console.log('Вибрано стрічку/ланцюг:', nkz_conv);
    });
  }
});

// Валідація введеної висоти (ціле 1–30), зберігання у nkz_h і логування
function NKZ_HEIGHT() {
  var el = document.getElementById('nkz_l');
  if (!el) return;
  var s = el.value;
  var v = parseInt(s, 10);
  if (isNaN(v)) { el.value = ''; return; }
  if (v < 1) v = 1;
  if (v > 30) v = 30;
  el.value = String(v);
  console.log('Обрана висота норії (м.):', v);
  nkz_h = v;
 
  // Стрілкова функція для підрахунку кількості секцій на основі висоти норії
   const setHeight = (val) => {



    const half = Math.floor((v - 1) / 2);
    if ((v - 1) / 2 === half) {
      count_nkz_section.one = 0;
      count_nkz_section.two = half;
    }
    else {
      count_nkz_section.one = 1;
      count_nkz_section.two = half;
    }
  total_h_nkz = Math.round((((count_nkz_section.one + count_nkz_section.two + count_nkz_section.revision_secton) * 20)/1000 + nkz_h + nkz_h_base) * 1000) / 1000;

  rob_h_nkz = Math.round((((count_nkz_section.one + count_nkz_section.two + count_nkz_section.revision_secton) * 20)/1000 + nkz_h ) * 1000) / 1000;

    // Вивід результатів у відповідні елементи DOM
    document.querySelector('.gab_vis span').textContent = total_h_nkz;
    document.querySelector('.rob_vis span').textContent = rob_h_nkz;

  // console.log('Висота норії (м.):', total_h_nkz);

  };
    
  setHeight(v);

}

// Перевірка, чи для поточного типу потрібно показувати чекбокс “Ланцюгова”
function shouldShowChainCheckbox(typeVal) {
  return typeVal === '10' || typeVal === '25' || typeVal === '50';
}

// Керування видимістю чекбокса “Ланцюгова” за значенням типу НКЗ
function setChainCheckboxVisibility(typeVal) {
  var el = document.getElementById('lan_check');
  if (!el || !el.parentElement) return;
  el.parentElement.style.display = shouldShowChainCheckbox(typeVal) ? '' : 'none';
}

// Вибір норії за типом та станом “ланцюгова”; збереження у nkz_product та логування
let nkz_product = null;
const nkzTypeMap = { '5': '1', '10': '2', '25': '3', '50': '4', '100': '5', '175': '6', '200': '7' };
function selectNkzProduct(typeVal, chainChecked) {
  var data = (NKZ_data && NKZ_data.prod) ? NKZ_data.prod : [];
  var code = nkzTypeMap[typeVal];
  if (!code) return null;
  var allowChain = shouldShowChainCheckbox(typeVal);
  var effectiveChain = allowChain && !!chainChecked;
  var candidates = data.filter(function (x) {
    return x.n_2 === code && (effectiveChain ? x.chain === '1' : x.chain !== '1');
  });
  return candidates.length ? candidates[0] : null;
}
function updateNkzProduct() {
  try {
    var typeEl = document.getElementById('nkz_type');
    var chainEl = document.getElementById('lan_check');
    var typeVal = typeEl ? typeEl.value : '';
    var chainChecked = chainEl ? chainEl.checked : false;
    nkz_product = selectNkzProduct(typeVal, chainChecked);
    console.log('Вибрана норія (nkz_product):', nkz_product);
  } catch (_) {}
}

// Дані стрічка/ланцюг: мапа, вибраний об’єкт, фільтрація та заповнення селектора
let nkz_conv = null;
let __convMap = new Map();
function __parsePrice(obj) {
  var a = parseFloat(obj.sale_price);
  if (!isNaN(a) && a > 0) return a;
  var b = parseFloat(obj['$_sale_price']);
  if (!isNaN(b) && b > 0) return b;
  var c = parseFloat(obj['$_price']);
  if (!isNaN(c) && c > 0) return c;
  return 0;
}
function __getConvDataset(chainChecked) {
  var chain = (NKZ_data && NKZ_data.conv_chain) ? NKZ_data.conv_chain : [];
  var belt = (NKZ_data && NKZ_data.conv_belt) ? NKZ_data.conv_belt : [];
  return chainChecked ? chain : belt;
}
function __convCandidates(nkzProd, chainChecked) {
  if (!nkzProd) return [];
  var ds = __getConvDataset(chainChecked);
  var code = nkzProd.full_n;
  return ds.filter(function (x) {
    var setOn = (x.set_on || '').split(',').map(function (s) { return s.trim(); });
    return setOn.indexOf(code) !== -1;
  });
}
function __defaultConvIndex(items) {
  if (!items.length) return -1;
  var sorted = items.slice().sort(function (a, b) {
    return __parsePrice(a) - __parsePrice(b);
  });
  var pick = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.7))];
  var idx = items.findIndex(function (x) { return x.full_n === pick.full_n; });
  return idx >= 0 ? idx : 0;
}
function updateConvSelect() {
  try {
    __convMap.clear();
    var typeEl = document.getElementById('nkz_type');
    var chainEl = document.getElementById('lan_check');
    var convEl = document.getElementById('conv_item');
    var chainChecked = chainEl ? chainEl.checked : false;
    var candidates = __convCandidates(nkz_product, chainChecked);
    if (convEl) {
      convEl.innerHTML = '';
      var ph = document.createElement('option');
      ph.value = '';
      ph.textContent = '— оберіть —';
      convEl.appendChild(ph);
      candidates.forEach(function (x) {
        var val = x.full_n;
        __convMap.set(val, x);
        var specW = x.width || '';
        var specM = x.s_material || '';
        var mNum = !isNaN(parseFloat(specM));
        var spec = '';
        if (specW && specM) {
          spec = ' ' + String(specW) + '/' + String(specM) + (mNum ? 'мм.' : '');
        } else if (specW) {
          spec = ' ' + String(specW) + 'мм.';
        } else if (specM) {
          spec = ' ' + String(specM) + (mNum ? 'мм.' : '');
        }
        var priceStr = (__fmtUA ? __fmtUA(__parsePrice(x)) : (__parsePrice(x).toFixed(2))) + ' грн/м.';
        var txt = (x.name_1 || '') + ' ' + (x.name_2 || '') + spec + '  ' + priceStr;
        var o = document.createElement('option');
        o.value = val;
        o.textContent = txt;
        convEl.appendChild(o);
      });
      var di = __defaultConvIndex(candidates);
      if (di >= 0) {
        var def = candidates[di];
        convEl.value = def ? def.full_n : '';
        nkz_conv = def || null;
        console.log('Вибрано стрічку/ланцюг (дефолт):', nkz_conv);
      }
    }
  } catch (_) {}
}

// Ініціалізація селектора стрічка/ланцюг та вибору норії після надходження даних NKZ_data
function initAfterDataReady() {
  try {
    var typeEl = document.getElementById('nkz_type');
    if (typeEl) {
      setChainCheckboxVisibility(typeEl.value);
      updateNkzProduct();
      updateConvSelect();
      updateBucketSelect(); // виклик: ініціалізація блоку “ківші” після надходження даних
    }
  } catch (_) {}
}

// -----------------------------------------------
// Ківші: фільтрація, вибір за замовчуванням, відображення
// -----------------------------------------------
let nkz_bucket = null;
let __bucketMap = new Map();
function __bucketCandidates(nkzProd) {
  if (!nkzProd) return [];
  var ds = (NKZ_data && NKZ_data.busket) ? NKZ_data.busket : [];
  var code = nkzProd.full_n;
  return ds.filter(function (x) {
    var setOn = (x.set_on || '').split(',').map(function (s) { return s.trim(); });
    return setOn.indexOf(code) !== -1;
  });
}
function __num(v) {
  var n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}
function __bucketLength(x) {
  // “довжчий” ківш: візьмемо максимум з width/depth; якщо немає — за об’ємом
  var w = __num(x.width);
  var d = __num(x.depth);
  var vol = __num(x.volume_litr);
  var dim = Math.max(w, d);
  return dim > 0 ? dim : vol;
}
function __defaultBucketIndex(items) {
  if (!items.length) return -1;
  var sorted = items.slice().sort(function (a, b) { return __bucketLength(b) - __bucketLength(a); });
  var pick = sorted[0];
  var idx = items.findIndex(function (x) { return x.full_n === pick.full_n; });
  return idx >= 0 ? idx : 0;
}
function __bucketLabel(x) {
  var specW = x.width || '';
  var specD = x.depth || '';
  var specM = x.s_material || '';
  var mNum = !isNaN(parseFloat(specM));
  var size = '';
  if (specW && specD) {
    size = ' ' + String(specW) + '/' + String(specD) + 'мм.';
  } else if (specW) {
    size = ' ' + String(specW) + 'мм.';
  } else if (specD) {
    size = ' ' + String(specD) + 'мм.';
  }
  var vol = __num(x.volume_litr);
  var volStr = vol ? (' • ' + vol.toFixed(2) + ' л') : '';
  var price = __parsePrice(x);
  var priceStr = (__fmtUA ? __fmtUA(price) : price.toFixed(2)) + ' грн/шт.';
  return (x.name_1 || '') + ' ' + (x.type_and_material || x.name_2 || '') + ' ' + (x.name_3 || '') + size + volStr + '  ' + priceStr;
}
function updateBucketSelect() {
  try {
    __bucketMap.clear();
    var wrap = document.getElementById('info-buckets');
    var candidates = __bucketCandidates(nkz_product);
    if (wrap) {
      wrap.innerHTML = '';
      var col = document.createElement('div');
      col.className = 'col-sm';
      var lbl = document.createElement('label');
      lbl.setAttribute('for', 'bucket_item');
      lbl.textContent = 'Ківші';
      var sel = document.createElement('select');
      sel.className = 'form-control';
      sel.id = 'bucket_item';
      var ph = document.createElement('option');
      ph.value = '';
      ph.textContent = '— оберіть —';
      sel.appendChild(ph);
      candidates.forEach(function (x) {
        var val = x.full_n;
        __bucketMap.set(val, x);
        var o = document.createElement('option');
        o.value = val;
        o.textContent = __bucketLabel(x);
        sel.appendChild(o);
      });
      var di = __defaultBucketIndex(candidates);
      if (di >= 0) {
        var def = candidates[di];
        sel.value = def ? def.full_n : '';
        nkz_bucket = def || null;
        console.log('Вибрано ківш (дефолт):', nkz_bucket);
      }
      sel.addEventListener('change', function () {
        var v = this.value;
        nkz_bucket = __bucketMap.get(v) || null;
        console.log('Вибрано ківш:', nkz_bucket);
      });
      col.appendChild(lbl);
      col.appendChild(sel);
      wrap.appendChild(col);
    }
  } catch (_) {}
}

