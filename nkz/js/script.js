

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
  revision_secton: 1 
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
    nkz_h_base = baseHeights[normType(typeEl.value)] || null;
    NKZ_HEIGHT();
    // Показ/приховування чекбокса “Ланцюгова” залежно від обраного типу НКЗ
    // Виклик функції керування видимістю
    setChainCheckboxVisibility(typeEl.value);
    // Оновити вибір норії згідно типу та стану чекбокса
    updateNkzProduct();
    // Оновити селектор стрічка/ланцюг згідно типу та стану “ланцюгова”
    updateConvSelect();

    typeEl.addEventListener('change', function () {
      nkz_h_base = baseHeights[normType(this.value)] || null;
      NKZ_HEIGHT();
      updateNkzProduct();
      updateConvSelect();
      updateConvLengthAndPrice();
      updatebusketSelect();
      setChainCheckboxVisibility(this.value);
    });
  }

  // Перерахунок вибору норії при зміні стану чекбокса “Ланцюгова”
  var chainEl = document.getElementById('lan_check');
  if (chainEl) {
    chainEl.addEventListener('change', function () {
      updateNkzProduct();
      updateConvSelect();
      updateConvLengthAndPrice();
      updatebusketSelect();
      updateShaftsDetails();
      updatePricesSummary();
    });
  }
  // Збереження вибраного елемента стрічка/ланцюг при зміні селектора
  var convEl = document.getElementById('conv_item');
  if (convEl) {
    convEl.addEventListener('change', function () {
      var v = this.value;
      nkz_conv = __convMap.get(v) || null;
      console.log('Вибрано стрічку/ланцюг:', nkz_conv);
      updateConvLengthAndPrice();
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
  total_h_nkz = Math.round((((count_nkz_section.one + count_nkz_section.two + count_nkz_section.revision_secton) * 30)/1000 + nkz_h + nkz_h_base) * 1000) / 1000;

  rob_h_nkz = Math.round((((count_nkz_section.one + count_nkz_section.two + count_nkz_section.revision_secton) * 30)/1000 + nkz_h ) * 1000) / 1000;

    // Вивід результатів у відповідні елементи DOM
    document.querySelector('.gab_vis span').textContent = total_h_nkz;
    document.querySelector('.rob_vis span').textContent = rob_h_nkz;

  // console.log('Висота норії (м.):', total_h_nkz);

  };
    
  setHeight(v);
  updateShaftsInfo();
  updateShaftsDetails();
  updateConvLengthAndPrice();
  updateFasteners();
  updatePricesSummary();

}

// Перевірка, чи для поточного типу потрібно показувати чекбокс “Ланцюгова”
function shouldShowChainCheckbox(typeVal) {
  var v = normType(typeVal);
  return v === '10' || v === '25' || v === '50';
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
  var code = nkzTypeMap[normType(typeVal)];
  if (!code) return null;
  var allowChain = shouldShowChainCheckbox(typeVal);
  var effectiveChain = allowChain && !!chainChecked;
  var candidates = data.filter(function (x) {
    return x.n_2 === code && (effectiveChain ? x.chain === '1' : x.chain !== '1');
  });
  if (!candidates.length) return null;
  var modeWord = effectiveChain ? 'ланцюг' : 'стріч';
  var byName = candidates.filter(function (x) {
    var s = (x.name_3 || '').toLowerCase();
    return s.indexOf(modeWord) !== -1;
  });
  return byName.length ? byName[0] : candidates[0];
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

// -----------------------------------------------
// Узагальнення цін: побудова хеша і відображення
// -----------------------------------------------
let nkz_prices = {};
function updatePricesSummary() {
  try {
    var out = {};
    // Стрічка/ланцюг: назва, довжина, вартість
    out.conv = {
      name: nkz_conv ? ((nkz_conv.name_1 || '') + ' ' + (nkz_conv.name_2 || '')).trim() : '',
      length_m: chain_belt_l || 0,
      price: price_chain_or_belt || 0
    };
    // Ківші: назва (лейбл), ціна за шт, кількість, загальна вартість
    var bucketUnit = nkz_busket ? __parsePrice(nkz_busket) : 0;
    var bucketName = nkz_busket ? __busketLabel(nkz_busket) : '';
    var bucketSum = Math.round(bucketUnit * (total_count_busket || 0) * 100) / 100;
    out.buckets = {
      name: bucketName,
      unit_price: bucketUnit,
      count: total_count_busket || 0,
      total_price: bucketSum
    };
    // Метизи: болт, гайка, шайба норійна
    out.fasteners = {
      bolt: {
        count: busket_metiz_count || 0,
        weight_kg: Number((busket_metiz_weight || 0).toFixed ? (busket_metiz_weight || 0).toFixed(2) : (busket_metiz_weight || 0)),
        price: busket_metiz_prace || 0
      },
      nut: {
        count: busket_metiz_gayka_count || 0,
        weight_kg: Number((busket_metiz_gayka_weight || 0).toFixed ? (busket_metiz_gayka_weight || 0).toFixed(2) : (busket_metiz_gayka_weight || 0)),
        price: busket_metiz_gayka_prace || 0
      },
      washer: {
        count: busket_metiz_shayba_noriyna_count || 0,
        weight_kg: Number((busket_metiz_shayba_noriyna_weight || 0).toFixed ? (busket_metiz_shayba_noriyna_weight || 0).toFixed(2) : (busket_metiz_shayba_noriyna_weight || 0)),
        price: busket_metiz_shayba_noriyna_prace || 0
      }
    };
    // Мотор-редуктор: назва і ціна
    var drvName = '';
    var drvPrice = 0;
    if (typeof drive === 'object' && drive) {
      var parts = [];
      if (drive.saler) parts.push(String(drive.saler));
      if (drive.type) parts.push(String(drive.type));
      var gab = String(drive.gab || '').trim();
      var kwt = String(drive.kwt || '').trim();
      var spec = '';
      if (gab || kwt) {
        spec = (gab ? gab : '') + (kwt ? ('/' + kwt + 'кВт') : '');
      }
      if (spec) parts.push(spec);
      drvName = parts.join(' ');
      drvPrice = __parsePrice(drive) || 0;
    }
    out.drive = { name: drvName, price: drvPrice };
    // Секції: зважування і ціни
    var chainEl = document.getElementById('lan_check');
    var isChainMode = chainEl ? !!chainEl.checked : false;
    var frame = __pickFirst(__noriaItemsForProductByName('Рамка шахти '));
    var rev = __pickFirst(__noriaItemsForProductByName('Шахта оглядова'));
    var shaft1mName = isChainMode ? 'Шахта ланцюгова 1м.' : 'Шахта 1м.';
    var shaft1m = __pickFirst(__noriaItemsForProductByName(shaft1mName));
    var wFrame = __itemWeightKg(frame), pFrame = __parsePrice(frame);
    var wRev = __itemWeightKg(rev), pRev = __parsePrice(rev);
    var w1m = __itemWeightKg(shaft1m), p1m = __parsePrice(shaft1m);
    var cntRev = parseInt(count_nkz_section.revision_secton, 10) || 0;
    var cntOne = parseInt(count_nkz_section.one, 10) || 0;
    var cntTwo = parseInt(count_nkz_section.two, 10) || 0;
    var wR = frame && rev ? (wFrame * 2 + wRev) * cntRev : 0;
    var pR = frame && rev ? (pFrame * 2 + pRev) * cntRev : 0;
    var wM = frame && shaft1m ? (wFrame * 2 + w1m) * cntOne : 0;
    var pM = frame && shaft1m ? (pFrame * 2 + p1m) * cntOne : 0;
    var wT = frame && shaft1m ? (wFrame * 2 + (w1m * 2)) * cntTwo : 0;
    var pT = frame && shaft1m ? (pFrame * 2 + (p1m * 2)) * cntTwo : 0;
    var head = __pickFirst(__noriaItemsForProductByName('Голова привідна в зборі'));
    var wH = __itemWeightKg(head), pH = __parsePrice(head);
    out.shafts = {
      revision: { count: cntRev, weight_kg: Number(wR.toFixed ? wR.toFixed(2) : wR), price: pR || 0 },
      meter:    { count: cntOne, weight_kg: Number(wM.toFixed ? wM.toFixed(2) : wM), price: pM || 0 },
      twometer: { count: cntTwo, weight_kg: Number(wT.toFixed ? wT.toFixed(2) : wT), price: pT || 0 },
      bashmak:  { weight_kg: Number((__itemWeightKg(__pickFirst(__noriaItemsForProductByName('Башмак в зборі'))) || 0).toFixed ? (__itemWeightKg(__pickFirst(__noriaItemsForProductByName('Башмак в зборі'))) || 0).toFixed(2) : (__itemWeightKg(__pickFirst(__noriaItemsForProductByName('Башмак в зборі'))) || 0)), price: __parsePrice(__pickFirst(__noriaItemsForProductByName('Башмак в зборі'))) || 0 },
      head:     { weight_kg: Number(wH.toFixed ? wH.toFixed(2) : wH), price: pH || 0 }
    };
    // Підсумкова вартість: сума всіх відомих позицій
    var tp = 0;
    tp += out.conv.price || 0;
    tp += out.buckets.total_price || 0;
    tp += (out.fasteners.bolt.price || 0) + (out.fasteners.nut.price || 0) + (out.fasteners.washer.price || 0);
    tp += (out.shafts.revision.price || 0) + (out.shafts.meter.price || 0) + (out.shafts.twometer.price || 0);
    tp += (out.shafts.bashmak.price || 0) + (out.shafts.head.price || 0);
    tp += out.drive.price || 0;
    out.total_price = Math.round(tp * 100) / 100;
    nkz_prices = out;
    // Оновити заголовок “Ціни — total_price”
    var labelEl = document.getElementById('total_price_label');
    if (labelEl) {
      var labelStr = (__fmtUA ? __fmtUA(out.total_price) : out.total_price.toFixed(2)) + ' грн';
      labelEl.textContent = labelStr;
    }
    // Оновити контент розкривного блоку “Ціни”
    var wrap = document.getElementById('info-prices');
    if (wrap) {
      wrap.innerHTML = '';
      var col = document.createElement('div');
      col.className = 'col-sm';
      function line(txt) {
        var p = document.createElement('p');
        p.textContent = txt;
        p.style.fontSize = '0.875em';
        p.style.color = '#555';
        p.style.display = 'block';
        col.appendChild(p);
      }
      line('Стрічка/Ланцюг: ' + (out.conv.name || '') + '; довжина ' + (out.conv.length_m || 0) + 'м; ціна ' + ((__fmtUA ? __fmtUA(out.conv.price) : (out.conv.price || 0).toFixed(2)) + ' грн'));
      line('Ківші: ' + (out.buckets.name || '') + '; кільк. ' + (out.buckets.count || 0) + 'шт; ціна ' + ((__fmtUA ? __fmtUA(out.buckets.total_price) : (out.buckets.total_price || 0).toFixed(2)) + ' грн'));
      line('Болти: ' + (out.fasteners.bolt.count || 0) + 'шт; вага ' + Number(out.fasteners.bolt.weight_kg).toFixed(2) + 'кг; ціна ' + ((__fmtUA ? __fmtUA(out.fasteners.bolt.price) : (out.fasteners.bolt.price || 0).toFixed(2)) + ' грн'));
      line('Гайки: ' + (out.fasteners.nut.count || 0) + 'шт; вага ' + Number(out.fasteners.nut.weight_kg).toFixed(2) + 'кг; ціна ' + ((__fmtUA ? __fmtUA(out.fasteners.nut.price) : (out.fasteners.nut.price || 0).toFixed(2)) + ' грн'));
      line('Шайби норійні: ' + (out.fasteners.washer.count || 0) + 'шт; вага ' + Number(out.fasteners.washer.weight_kg).toFixed(2) + 'кг; ціна ' + ((__fmtUA ? __fmtUA(out.fasteners.washer.price) : (out.fasteners.washer.price || 0).toFixed(2)) + ' грн'));
      line('Секція ревізійна (' + (out.shafts.revision.count || 0) + ' шт.): вага ' + Number(out.shafts.revision.weight_kg).toFixed(2) + 'кг; ціна ' + ((__fmtUA ? __fmtUA(out.shafts.revision.price) : (out.shafts.revision.price || 0).toFixed(2)) + ' грн'));
      line('Секції метрові (' + (out.shafts.meter.count || 0) + ' шт.): вага ' + Number(out.shafts.meter.weight_kg).toFixed(2) + 'кг; ціна ' + ((__fmtUA ? __fmtUA(out.shafts.meter.price) : (out.shafts.meter.price || 0).toFixed(2)) + ' грн'));
      line('Секції двохметрові (' + (out.shafts.twometer.count || 0) + ' шт.): вага ' + Number(out.shafts.twometer.weight_kg).toFixed(2) + 'кг; ціна ' + ((__fmtUA ? __fmtUA(out.shafts.twometer.price) : (out.shafts.twometer.price || 0).toFixed(2)) + ' грн'));
      line('Башмак в зборі: вага ' + Number(out.shafts.bashmak.weight_kg || 0).toFixed(2) + 'кг; ціна ' + ((__fmtUA ? __fmtUA(out.shafts.bashmak.price) : (out.shafts.bashmak.price || 0).toFixed(2)) + ' грн'));
      line('Голова привідна в зборі: вага ' + Number(out.shafts.head.weight_kg || 0).toFixed(2) + 'кг; ціна ' + ((__fmtUA ? __fmtUA(out.shafts.head.price) : (out.shafts.head.price || 0).toFixed(2)) + ' грн'));
      line('Мотор-редуктор: ' + (out.drive.name || '') + '; ціна ' + ((__fmtUA ? __fmtUA(out.drive.price) : (out.drive.price || 0).toFixed(2)) + ' грн'));
      line('Разом (total_price): ' + ((__fmtUA ? __fmtUA(out.total_price) : out.total_price.toFixed(2)) + ' грн'));
      wrap.appendChild(col);
    }
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
        updateConvLengthAndPrice();
      }
    }
  } catch (_) {}
}

// Ініціалізація селектора стрічка/ланцюг та вибору норії після надходження даних NKZ_data
function initAfterDataReady() {
  try {
    var typeEl = document.getElementById('nkz_type');
    if (typeEl) {
      setChainCheckboxVisibility(normType(typeEl.value));
      updateNkzProduct();
      updateConvSelect();
      updateConvLengthAndPrice();
      updatebusketSelect(); // виклик: ініціалізація блоку “ківші” після надходження даних
      updateShaftsDetails();
      updatePricesSummary();
    }
  } catch (_) {}
}
function normType(v) {
  var m = String(v || '').match(/\d+/);
  return m ? m[0] : String(v || '');
}

// -----------------------------------------------
// Ківші: фільтрація, вибір за замовчуванням, відображення
// -----------------------------------------------
let nkz_busket = null; // вибраний ківш
let __busketMap = new Map();
function __getbusketDataset() {
  var a = (NKZ_data && NKZ_data.busket) ? NKZ_data.busket : [];
  var b = (NKZ_data && NKZ_data.busket) ? NKZ_data.busket : [];
  return (a && a.length) ? a : b;
}
function __busketCandidates(nkzProd) {
  if (!nkzProd) return [];
  var ds = __getbusketDataset();
  var code = nkzProd.full_n;
  var out = ds.filter(function (x) {
    var setOn = (x.set_on || '').split(',').map(function (s) { return s.trim(); });
    return setOn.indexOf(code) !== -1;
  });
  if (!out.length && typeof code === 'string') {
    var parts = code.split('-');
    if (parts.length >= 4) {
      var prefix = parts.slice(0, 3).join('-') + '-';
      out = ds.filter(function (x) {
        var setOn = (x.set_on || '').split(',').map(function (s) { return s.trim(); });
        return setOn.some(function (c) { return c.indexOf(prefix) === 0; });
      });
    }
  }
  console.log('Кандидати ківшів:', { total: ds.length, code: code, matched: out.length });
  return out;
}
function __num(v) {
  var n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}
function __busketLength(x) {
  // “довжчий” ківш: візьмемо максимум з width/depth; якщо немає — за об’ємом
  var w = __num(x.width);
  var d = __num(x.depth);
  var vol = __num(x.volume_litr);
  var dim = Math.max(w, d);
  return dim > 0 ? dim : vol;
}
function __defaultbusketIndex(items) {
  if (!items.length) return -1;
  var sorted = items.slice().sort(function (a, b) { return __busketLength(b) - __busketLength(a); });
  var pick = sorted[0];
  var idx = items.findIndex(function (x) { return x.full_n === pick.full_n; });
  return idx >= 0 ? idx : 0;
}
function __busketLabel(x) {
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
function updatebusketSelect() {
  try {
    __busketMap.clear();
    var wrap = document.getElementById('info-buckets');
    var candidates = __busketCandidates(nkz_product);
    if (wrap) {
      wrap.innerHTML = '';
      var col = document.createElement('div');
      col.className = 'col-sm';
      var lbl = document.createElement('label');
      lbl.setAttribute('for', 'busket_item');
      lbl.textContent = 'Ківші';
      var sel = document.createElement('select');
      sel.className = 'form-control';
      sel.id = 'busket_item';
      var ph = document.createElement('option');
      ph.value = '';
      ph.textContent = '— оберіть —';
      sel.appendChild(ph);
      candidates.forEach(function (x) {
        var val = x.full_n;
        __busketMap.set(val, x);
        var o = document.createElement('option');
        o.value = val;
        o.textContent = __busketLabel(x);
        sel.appendChild(o);
      });
      var di = __defaultbusketIndex(candidates);
      if (di >= 0) {
        var def = candidates[di];
        sel.value = def ? def.full_n : '';
        nkz_busket = def || null;
        console.log('Вибрано ківш (дефолт):', nkz_busket);
      }
      sel.addEventListener('change', function () {
        var v = this.value;
        nkz_busket = __busketMap.get(v) || null;
        console.log('Вибрано ківш:', nkz_busket);
        updateFasteners(); // оновити метизи після вибору ківша
        var totalPriceP = document.getElementById('busket_total_price_p');
        if (totalPriceP && nkz_busket) {
          var unit = __parsePrice(nkz_busket) || 0;
          var sum = Math.round(unit * (total_count_busket || 0) * 100) / 100;
          var priceStr = (__fmtUA ? __fmtUA(sum) : sum.toFixed(2)) + ' грн';
          totalPriceP.textContent = 'Загальна вартість ківшів: ' + priceStr;
        }
        updatePricesSummary();
      });
      col.appendChild(lbl);
      col.appendChild(sel);
      var totalP = document.createElement('p');
      totalP.id = 'busket_total_p';
      totalP.textContent = 'Кількість ківшів: ' + total_count_busket;
       totalP.style.fontSize = '0.875em';
       totalP.style.color = '#555';
       totalP.style.display = 'block';
      col.appendChild(totalP);
       var totalPriceP = document.createElement('p');
       totalPriceP.id = 'busket_total_price_p';
       var unit = nkz_busket ? __parsePrice(nkz_busket) : 0;
       var sum = Math.round((unit || 0) * (total_count_busket || 0) * 100) / 100;
       var priceStr = (__fmtUA ? __fmtUA(sum) : sum.toFixed(2)) + ' грн';
       totalPriceP.textContent = 'Загальна вартість ківшів: ' + priceStr;
       totalPriceP.style.fontSize = '0.875em';
       totalPriceP.style.color = '#555';
       totalPriceP.style.display = 'block';
       col.appendChild(totalPriceP);
      wrap.appendChild(col);
      // первинне оновлення метизів для дефолтного ківша
      updateFasteners();
      updatePricesSummary();
    }
  } catch (_) {}
}

// -----------------------------------------------
// Довжина і вартість стрічки/ланцюга для норії
// -----------------------------------------------
let chain_belt_l = 0;
let price_chain_or_belt = 0;
let total_count_busket = 0;
function updateConvLengthAndPrice() {
  try {
    var wrap = document.getElementById('info-belt');
    var chainEl = document.getElementById('lan_check');
    var typeEl = document.getElementById('nkz_type');
    var typeVal = typeEl ? normType(typeEl.value) : '';
    var isChainMode = chainEl ? !!chainEl.checked : false;
    var isChainTargetType = isChainMode && (typeVal === '25' || typeVal === '50');
    var H = typeof total_h_nkz === 'number' ? total_h_nkz : 0;
    var len = isChainTargetType ? (H * 4 + 2) : (H * 2 + 1);
    chain_belt_l = Math.max(0, Math.round(len * 100) / 100);
    var pricePerUnit = nkz_conv ? __parsePrice(nkz_conv) : 0;
    price_chain_or_belt = Math.round(chain_belt_l * pricePerUnit * 100) / 100;
    var cb = parseFloat(nkz_product && nkz_product.count_busket) || 0;
    total_count_busket = Math.ceil((isChainTargetType ? (chain_belt_l * cb / 2) : (chain_belt_l * cb)));
    if (wrap) {
      var host = wrap.querySelector('.col-sm');
      if (!host) {
        host = document.createElement('div');
        host.className = 'col-sm';
        wrap.appendChild(host);
      }
      var lenP = host.querySelector('#conv_len_p');
      var priceP = host.querySelector('#conv_price_p');
      if (!lenP) { lenP = document.createElement('p'); lenP.id = 'conv_len_p'; host.appendChild(lenP); }
      if (!priceP) { priceP = document.createElement('p'); priceP.id = 'conv_price_p'; host.appendChild(priceP); }
      lenP.style.fontSize = '0.875em';
      lenP.style.color = '#555';
      lenP.style.display = 'block';
      priceP.style.fontSize = '0.875em';
      priceP.style.color = '#555';
      priceP.style.display = 'block';
      lenP.textContent = 'Довжина: ' + chain_belt_l + ' м';
      var priceStr = (__fmtUA ? __fmtUA(price_chain_or_belt) : price_chain_or_belt.toFixed(2)) + ' грн';
      priceP.textContent = 'Вартість: ' + priceStr;
    }
    var totalP = document.getElementById('busket_total_p');
    if (totalP) {
      totalP.textContent = 'Кількість ківшів: ' + total_count_busket;
    }
    var totalPriceP = document.getElementById('busket_total_price_p');
    if (totalPriceP && nkz_busket) {
      var unit2 = __parsePrice(nkz_busket) || 0;
      var sum2 = Math.round(unit2 * total_count_busket * 100) / 100;
      var priceStr2 = (__fmtUA ? __fmtUA(sum2) : sum2.toFixed(2)) + ' грн';
      totalPriceP.textContent = 'Загальна вартість ківшів: ' + priceStr2;
    }
    updatePricesSummary();
    console.log('Довжина і вартість стрічки/ланцюга:', { chain_belt_l: chain_belt_l, price_chain_or_belt: price_chain_or_belt });
  } catch (_) {}
}
// -----------------------------------------------
// Метизи для вибраного ківша: пошук і відображення
// -----------------------------------------------
let busket_metiz = null;
let busket_metiz_weight = 0;
let busket_metiz_prace = 0;
let busket_metiz_count = 0;

let busket_metiz_gayka = null;
let busket_metiz_gayka_count = 0;
let busket_metiz_gayka_weight = 0;
let busket_metiz_gayka_prace = 0;

let busket_metiz_shayba_noriyna = null;
let busket_metiz_shayba_noriyna_count = 0;
let busket_metiz_shayba_noriyna_weight = 0;
let busket_metiz_shayba_noriyna_prace = 0;


function __getMetizDataset() {
  var a = (NKZ_data && NKZ_data.metiz) ? NKZ_data.metiz : [];
  return Array.isArray(a) ? a : [];
}
function __findMetizByCode(code) {
  var ds = __getMetizDataset();
  var c = String(code || '').trim();
  if (!c) return null;
  return ds.find(function (x) { return String(x.full_n || '').trim() === c; }) || null;
}
function __fmtMetizText(m, busket) {
  var title = (m.full_name || ((m.name_1 || '') + ' ' + (m.name_2 || '') + ' ' + (m.name_3 || ''))).trim();

  
  return title;
}
function __extractThreadSize(m) {
  var s = '';
  var t = String(nkz_busket && nkz_busket.mitiz || '');
  var mm = t.match(/M\d+/i);
  if (mm) s = mm[0].toUpperCase();
  if (!s && m) {
    var pool = [m.name_3, m.full_name, m.name_2];
    for (var i = 0; i < pool.length; i++) {
      var v = String(pool[i] || '');
      var k = v.match(/M\d+/i);
      if (k) { s = k[0].toUpperCase(); break; }
    }
  }
  return s;
}
function __findNutForMetiz(m) {
  var ds = __getMetizDataset();
  var size = __extractThreadSize(m);
  for (var i = 0; i < ds.length; i++) {
    var x = ds[i];
    var txt = (String(x.name_1 || '') + ' ' + String(x.name_2 || '') + ' ' + String(x.name_3 || '') + ' ' + String(x.full_name || '')).toLowerCase();
    var isNut = txt.indexOf('гайка') !== -1;
    var ok = true;
    if (size) {
      var up = (String(x.full_name || '') + ' ' + String(x.name_3 || '')).toUpperCase();
      ok = up.indexOf(size) !== -1;
    }
    if (isNut && ok) return x;
  }
  return null;
}
function __findNoriynaWasherForMetiz(m) {
  var ds = __getMetizDataset();
  var size = __extractThreadSize(m);
  for (var i = 0; i < ds.length; i++) {
    var x = ds[i];
    var txt = (String(x.name_1 || '') + ' ' + String(x.name_2 || '') + ' ' + String(x.name_3 || '') + ' ' + String(x.full_name || '')).toLowerCase();
    var isWasher = txt.indexOf('шайба') !== -1 && (txt.indexOf('нор') !== -1 || txt.indexOf('норі') !== -1);
    var ok = true;
    if (size) {
      var up = (String(x.full_name || '') + ' ' + String(x.name_3 || '')).toUpperCase();
      ok = up.indexOf(size) !== -1;
    }
    if (isWasher && ok) return x;
  }
  return null;
}
function updateFasteners() {
  try {
    var wrap = document.getElementById('info-fasteners');
    if (!wrap) return;
    wrap.innerHTML = '';
    busket_metiz = null;
    if (!nkz_busket) return;
    var code = nkz_busket.mitiz || '';
    var m = __findMetizByCode(code);
    busket_metiz = m || null;
    var col = document.createElement('div');
    col.className = 'col-sm';
    var p = document.createElement('p');
    p.textContent = m ? __fmtMetizText(m, nkz_busket) : 'Метизи для вибраного ківша не знайдено';
    col.appendChild(p);
    if (m) {
      var cm = parseFloat(nkz_busket && nkz_busket.count_metiz) || 0;
      var w = parseFloat(m.weight) || 0;
      var pr = parseFloat(m.sale_price) || 0;
      busket_metiz_count = Math.ceil((total_count_busket || 0) * cm);
      busket_metiz_weight = busket_metiz_count * w;
      busket_metiz_prace = Math.round((busket_metiz_weight * pr) * 100) / 100;
      var s = document.createElement('small');
      s.textContent = 'вага: ' + busket_metiz_weight.toFixed(2) + 'кг, Ціна ' + busket_metiz_prace.toFixed(2) + 'грн з пдв. Кільк: ' + busket_metiz_count + 'шт.';
      s.style.fontSize = '0.875em';
      s.style.color = '#555';
      s.style.display = 'block';
      col.appendChild(s);
      busket_metiz_gayka = __findNutForMetiz(m);
      if (busket_metiz_gayka) {
        var gCnt = Math.ceil(busket_metiz_count * 2);
        var gW = (parseFloat(busket_metiz_gayka.weight) || 0) * gCnt;
        var gP = Math.round(gW * (parseFloat(busket_metiz_gayka.sale_price) || 0) * 100) / 100;
        busket_metiz_gayka_count = gCnt;
        busket_metiz_gayka_weight = gW;
        busket_metiz_gayka_prace = gP;
        var gs = document.createElement('small');
        gs.textContent = 'Гайка: вага ' + gW.toFixed(2) + 'кг, Ціна ' + gP.toFixed(2) + 'грн з пдв, Кільк ' + gCnt + 'шт.';
        gs.style.fontSize = '0.875em';
        gs.style.color = '#555';
        gs.style.display = 'block';
        col.appendChild(gs);
      }
      busket_metiz_shayba_noriyna = __findNoriynaWasherForMetiz(m);
      if (busket_metiz_shayba_noriyna) {
        var wCnt = busket_metiz_count;
        var wW = (parseFloat(busket_metiz_shayba_noriyna.weight) || 0) * wCnt;
        var wP = Math.round(wW * (parseFloat(busket_metiz_shayba_noriyna.sale_price) || 0) * 100) / 100;
        busket_metiz_shayba_noriyna_count = wCnt;
        busket_metiz_shayba_noriyna_weight = wW;
        busket_metiz_shayba_noriyna_prace = wP;
        var ws = document.createElement('small');
        ws.textContent = 'Шайба норійна: вага ' + wW.toFixed(2) + 'кг, Ціна ' + wP.toFixed(2) + 'грн з пдв, Кільк ' + wCnt + 'шт.';
        ws.style.fontSize = '0.875em';
        ws.style.color = '#555';
        ws.style.display = 'block';
        col.appendChild(ws);
      }
    }
    wrap.appendChild(col);
    console.log('Вибрані метизи (busket_metiz):', busket_metiz);
  } catch (_) {}
}

// -----------------------------------------------
// Шахти: вивід кількості секцій (ревізійна, метрова, двохметрова)
// -----------------------------------------------
function updateShaftsInfo() {
  try {
    var wrap = document.getElementById('info-shafts');
    if (!wrap) return;
    wrap.innerHTML = '';
    var col = document.createElement('div');
    col.className = 'col-sm';
    var p = document.createElement('p');
    var rev = parseInt(count_nkz_section.revision_secton, 10);
    var one = parseInt(count_nkz_section.one, 10);
    var two = parseInt(count_nkz_section.two, 10);
    var txt = 'Секції: ревізійна — ' + (isNaN(rev) ? 0 : rev) +
              '; метрова — ' + (isNaN(one) ? 0 : one) +
              '; двохметрова — ' + (isNaN(two) ? 0 : two);
    p.textContent = txt;
    col.appendChild(p);
    wrap.appendChild(col);
    console.log('Кількість секцій (шахти):', { revision: rev, one: one, two: two });
  } catch (_) {}
}

// -----------------------------------------------
// Шахти: деталізований вивід ваги/ціни елементів і секцій
// -----------------------------------------------
function __getNoriaDataset() {
  // Отримати масив елементів норії
  var a = (NKZ_data && NKZ_data.noria) ? NKZ_data.noria : [];
  return Array.isArray(a) ? a : [];
}
function __noriaItemsForProductByName(name) {
  // Підібрати елемент(и) норії за назвою і прив'язкою set_on до вибраної норії
  var ds = __getNoriaDataset();
  var code = nkz_product ? nkz_product.full_n : '';
  var target = String(name || '').trim().toLowerCase();
  if (!code || !target) return [];
  return ds.filter(function (x) {
    var n1 = String(x.name_1 || '').trim().toLowerCase();
    var setOn = (x.set_on || '').split(',').map(function (s) { return s.trim(); });
    return n1 === target && setOn.indexOf(code) !== -1;
  });
}
function __pickFirst(arr) {
  // Взяти перший елемент зі списку-кандидата
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}
function __itemWeightKg(x) {
  // Отримати вагу елементу; у норійних даних зберігається в полі "kg"
  var v = parseFloat(x && x.kg);
  return isNaN(v) ? 0 : v;
}
function updateShaftsDetails() {
  try {
    var wrap = document.getElementById('info-shafts'); // Контейнер секцій
    if (!wrap) return;
    var host = wrap.querySelector('.col-sm'); // Вже існуюча колонка з лічильниками
    if (!host) {
      host = document.createElement('div'); // Створити колонку, якщо її немає
      host.className = 'col-sm';
      wrap.appendChild(host);
    }
    // Очистити попередні деталізовані рядки (залишити лічильники)
    var olds = host.querySelectorAll('p._shaft_detail');
    olds.forEach(function (el) { el.remove(); });
    // Визначити режим: ланцюгова чи стрічкова
    var chainEl = document.getElementById('lan_check');
    var isChainMode = chainEl ? !!chainEl.checked : false;
    // Башмак в зборі: один елемент, вага і ціна
    var bashmak = __pickFirst(__noriaItemsForProductByName('Башмак в зборі'));
    if (bashmak) {
      var wB = __itemWeightKg(bashmak);
      var pB = __parsePrice(bashmak);
      var p = document.createElement('p'); // Створити рядок для башмака
      p.className = '_shaft_detail';
      p.textContent = 'Башмак в зборі: вага ' + wB.toFixed(2) + 'кг, ціна ' + (pB.toFixed ? pB.toFixed(2) : Number(pB).toFixed(2)) + 'грн';
      p.style.fontSize = '0.875em';
      p.style.color = '#555';
      host.appendChild(p);
    }
    // Підібрати базові елементи секцій
    var frame = __pickFirst(__noriaItemsForProductByName('Рамка шахти '));
    var rev = __pickFirst(__noriaItemsForProductByName('Шахта оглядова'));
    var shaft1mName = isChainMode ? 'Шахта ланцюгова 1м.' : 'Шахта 1м.';
    var shaft1m = __pickFirst(__noriaItemsForProductByName(shaft1mName));
    // Витягнути ваги і ціни
    var wFrame = __itemWeightKg(frame);
    var pFrame = __parsePrice(frame);
    var wRev = __itemWeightKg(rev);
    var pRev = __parsePrice(rev);
    var w1m = __itemWeightKg(shaft1m);
    var p1m = __parsePrice(shaft1m);
    // Лічильники секцій
    var cntRev = parseInt(count_nkz_section.revision_secton, 10) || 0;
    var cntOne = parseInt(count_nkz_section.one, 10) || 0;
    var cntTwo = parseInt(count_nkz_section.two, 10) || 0;
    // Ревізійна секція: дві рамки + оглядова, з урахуванням кількості
    if (frame && rev && cntRev > 0) {
      var wR = (wFrame * 2 + wRev) * cntRev;
      var pR = (pFrame * 2 + pRev) * cntRev;
      var pr = document.createElement('p'); // Рядок для ревізійної секції
      pr.className = '_shaft_detail';
      pr.textContent = 'Секція ревізійна: вага ' + wR.toFixed(2) + 'кг, ціна ' + pR.toFixed(2) + 'грн';
      pr.style.fontSize = '0.875em';
      pr.style.color = '#555';
      host.appendChild(pr);
    }
    // Метрова секція: дві рамки + шахта 1м., з урахуванням кількості
    if (frame && shaft1m && cntOne > 0) {
      var wM = (wFrame * 2 + w1m) * cntOne;
      var pM = (pFrame * 2 + p1m) * cntOne;
      var pm = document.createElement('p'); // Рядок для метрових секцій
      pm.className = '_shaft_detail';
      pm.textContent = 'Секція метрова (' + cntOne + ' шт.): вага ' + wM.toFixed(2) + 'кг, ціна ' + pM.toFixed(2) + 'грн';
      pm.style.fontSize = '0.875em';
      pm.style.color = '#555';
      host.appendChild(pm);
    }
    // Двохметрова секція: дві рамки + подвійна шахта 1м., * кількість
    if (frame && shaft1m && cntTwo > 0) {
      var wT = (wFrame * 2 + (w1m * 2)) * cntTwo;
      var pT = (pFrame * 2 + (p1m * 2)) * cntTwo;
      var pt = document.createElement('p'); // Рядок для двохметрових секцій
      pt.className = '_shaft_detail';
      pt.textContent = 'Секції двохметрові (' + cntTwo + ' шт.): вага ' + wT.toFixed(2) + 'кг, ціна ' + pT.toFixed(2) + 'грн';
      pt.style.fontSize = '0.875em';
      pt.style.color = '#555';
      host.appendChild(pt);
    }
    // Голова привідна в зборі: один елемент
    var head = __pickFirst(__noriaItemsForProductByName('Голова привідна в зборі'));
    if (head) {
      var wH = __itemWeightKg(head);
      var pH = __parsePrice(head);
      var ph = document.createElement('p'); // Рядок для голови
      ph.className = '_shaft_detail';
      ph.textContent = 'Голова привідна в зборі: вага ' + wH.toFixed(2) + 'кг, ціна ' + (pH.toFixed ? pH.toFixed(2) : Number(pH).toFixed(2)) + 'грн';
      ph.style.fontSize = '0.875em';
      ph.style.color = '#555';
      host.appendChild(ph);
    }
  } catch (_) {}
}
