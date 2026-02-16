// Вибір та збереження моделі приводу; карта для швидкого доступу до об'єктів
let drive = null;
let __driveMap = new Map();

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

function initDriveFilters() {
  var data = (NKZ_data && NKZ_data.g_motor) ? NKZ_data.g_motor : [];
  var salers = __uniq(data.map(function (x) { return x.saler; }));
  var typeEl = document.getElementById('drive_type');
  var salerEl = document.getElementById('drive_saler');
  var itemEl = document.getElementById('drive_item');

  __fillSelect(salerEl, salers, 'вибери');

  function updateItems() {
    __driveMap.clear();
    var s = salerEl ? salerEl.value : '';
    var t = typeEl ? typeEl.value : '';
    var items = data.filter(function (x) {
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

  function updateTypes() {
    var s = salerEl ? salerEl.value : '';
    var types = __uniq(
      data
        .filter(function (x) { return !s || x.saler === s; })
        .map(function (x) { return x.type; })
    );
    __fillSelect(typeEl, types, 'вибери');
    updateItems();
  }

  if (salerEl) {
    salerEl.addEventListener('change', function () { updateTypes(); });
  }
  if (typeEl) {
    typeEl.addEventListener('change', function () { updateItems(); });
  }
  if (itemEl) {
    itemEl.addEventListener('change', function () {
      var v = this.value;
      drive = __driveMap.get(v) || null;
      console.log('Обрана модель мотора:', drive);
    });
  }

  updateTypes();
}
