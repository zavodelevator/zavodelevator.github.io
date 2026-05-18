// Вибір та збереження моделі приводу; карта для швидкого доступу до об'єктів
let drive = null;
let __driveMap = new Map();
let __driveData = [];

function __uniq(arr) {
  return Array.from(
    new Set(
      arr.filter(function (v) {
        return v !== undefined && v !== null && String(v).trim() !== '';
      })
    )
  ).sort();
}

function __fmtUA(n) {
  try {
    return new Intl.NumberFormat('uk-UA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(n));
  } catch (_) {
    var x = parseFloat(n) || 0;
    return x.toFixed(2);
  }
}

function __fillSelect(sel, values, placeholder) {
  if (!sel) return;
  sel.innerHTML = '';
  var ph = document.createElement('option');
  ph.value = '';
  ph.textContent = placeholder;
  sel.appendChild(ph);
  values.forEach(function (v) {
    var o = document.createElement('option');
    o.value = String(v);
    o.textContent = String(v);
    sel.appendChild(o);
  });
}

function __updateDriveItems() {
  __driveMap.clear();
  var salerEl = document.getElementById('drive_saler');
  var typeEl = document.getElementById('drive_type');
  var itemEl = document.getElementById('drive_item');
  var s = salerEl ? salerEl.value : '';
  var t = typeEl ? typeEl.value : '';
  var items = __driveData.filter(function (x) {
    return (!s || x.saler === s) && (!t || x.type === t);
  });
  if (itemEl) {
    itemEl.innerHTML = '';
    var ph = document.createElement('option');
    ph.value = '';
    ph.textContent = 'вибери';
    itemEl.appendChild(ph);
  }
  items.forEach(function (x) {
    var txt = (x.gab || '') + '/' + (x.kwt || '') + 'кВт  ' + __fmtUA(x.sale_price) + ' грн';
    var val = x.full_n || (x.full_name || '') + '_' + (x.kwt || '') + '_' + (x.gab || '');
    __driveMap.set(val, x);
    if (itemEl) {
      var o = document.createElement('option');
      o.value = val;
      o.textContent = txt;
      itemEl.appendChild(o);
    }
  });
}

function __updateDriveTypes() {
  var salerEl = document.getElementById('drive_saler');
  var typeEl = document.getElementById('drive_type');
  var s = salerEl ? salerEl.value : '';
  var types = __uniq(
    __driveData
      .filter(function (x) { return !s || x.saler === s; })
      .map(function (x) { return x.type; })
  );
  __fillSelect(typeEl, types, 'вибери');
  __updateDriveItems();
}

// Програмний вибір приводу: мінімальна достатня кВт, максимальний габарит при цій кВт
function autoSelectDrive(saler, type, minKwt) {
  try {
    var salerEl = document.getElementById('drive_saler');
    var typeEl = document.getElementById('drive_type');
    var itemEl = document.getElementById('drive_item');
    if (salerEl) salerEl.value = saler || '';
    __updateDriveTypes();
    if (typeEl) typeEl.value = type || '';
    __updateDriveItems();
    var candidates = __driveData.filter(function (x) {
      return (!saler || x.saler === saler) &&
             (!type || x.type === type) &&
             parseFloat(x.kwt) >= minKwt;
    });
    if (!candidates.length) return;
    // Сортування: спочатку за зростанням кВт, потім за спаданням габариту
    candidates.sort(function (a, b) {
      var kd = parseFloat(a.kwt) - parseFloat(b.kwt);
      if (kd !== 0) return kd;
      return parseFloat(b.gab) - parseFloat(a.gab);
    });
    var minK = parseFloat(candidates[0].kwt);
    var atMinKwt = candidates.filter(function (x) { return parseFloat(x.kwt) === minK; });
    atMinKwt.sort(function (a, b) { return parseFloat(b.gab) - parseFloat(a.gab); });
    var pick = atMinKwt[0];
    var val = pick.full_n || (pick.full_name || '') + '_' + (pick.kwt || '') + '_' + (pick.gab || '');
    if (itemEl) itemEl.value = val;
    drive = __driveMap.get(val) || null;
    if (typeof updatePricesSummary === 'function') { try { updatePricesSummary(); } catch (_) {} }
  } catch (_) {}
}

function initDriveFilters() {
  __driveData = (NKZ_data && NKZ_data.g_motor) ? NKZ_data.g_motor : [];
  var salers = __uniq(__driveData.map(function (x) { return x.saler; }));
  var salerEl = document.getElementById('drive_saler');
  var typeEl = document.getElementById('drive_type');
  var itemEl = document.getElementById('drive_item');

  __fillSelect(salerEl, salers, 'вибери');

  if (salerEl) {
    salerEl.addEventListener('change', function () { __updateDriveTypes(); });
  }
  if (typeEl) {
    typeEl.addEventListener('change', function () { __updateDriveItems(); });
  }
  if (itemEl) {
    itemEl.addEventListener('change', function () {
      var v = this.value;
      drive = __driveMap.get(v) || null;
      console.log('Обрана модель мотора:', drive);
      if (typeof updatePricesSummary === 'function') {
        try { updatePricesSummary(); } catch (_) {}
      }
    });
  }

  __updateDriveTypes();
}
