// Спільне ядро калькуляторів: завантаження JSON, права панель параметрів, розшифровка ціни.
// Сторінка викликає Calc.boot({ data, panel, compute }). Деталі — calc/README.md.
(function () {
  'use strict';

  var original = {};   // дані як у JSON-файлах
  var D = {};          // робоча копія (змінюється з панелі, лише на цей розрахунок)
  var cfg = null;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function set(obj, path, value) {
    var keys = path.split('.'), last = keys.pop();
    var target = keys.reduce(function (o, k) { return o[k]; }, obj);
    target[last] = value;
  }

  function num(v) {
    if (typeof v === 'number') return v;
    var n = parseFloat(String(v == null ? '' : v).replace(',', '.').replace(/\s/g, ''));
    return isNaN(n) ? 0 : n;
  }

  function ceil3(x) {
    var n = Math.ceil(Math.round(x * 100) / 100);
    return n <= 0 ? 0 : n + (3 - n % 3) % 3;
  }

  function money(x, digits) {
    var d = digits == null ? 2 : digits;
    return Number(x || 0).toLocaleString('uk-UA', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // ---------- завантаження ----------
  function load(names) {
    return Promise.all(names.map(function (n) {
      return fetch('data/' + n + '.json', { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('data/' + n + '.json: HTTP ' + r.status);
        return r.json();
      }).then(function (j) { original[n] = j; });
    })).then(function () { D = clone(original); });
  }

  // ---------- вхідні поля сторінки ----------
  function readInputs() {
    var form = document.getElementById('inputs');
    var out = {};
    if (!form) return out;
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') out[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) out[el.name] = el.value; }
      else if (el.type === 'number') out[el.name] = num(el.value);
      else out[el.name] = el.value;
    });
    return out;
  }

  // ---------- права панель ----------
  function pricingTab(name) {
    return {
      tab: 'Ціноутворення',
      fields: [
        { path: name + '.pricing.markup_pct', label: 'Націнка', unit: '%' },
        { path: name + '.pricing.vat_pct', label: 'ПДВ', unit: '%' },
        { path: name + '.pricing.vat_included', label: 'Ціни в таблицях уже з ПДВ', type: 'checkbox' }
      ]
    };
  }

  function fieldHtml(f) {
    var v = get(D, f.path), o = get(original, f.path);
    var changed = JSON.stringify(v) !== JSON.stringify(o);
    var id = 'p_' + f.path.replace(/\W/g, '_');
    if (f.type === 'checkbox') {
      return '<div class="form-check mb-2' + (changed ? ' changed' : '') + '">' +
        '<input class="form-check-input" type="checkbox" id="' + id + '" data-path="' + f.path + '"' + (v ? ' checked' : '') + '>' +
        '<label class="form-check-label" for="' + id + '">' + esc(f.label) + '</label></div>';
    }
    if (f.type === 'select') {
      return '<div class="form-group mb-2' + (changed ? ' changed' : '') + '"><label for="' + id + '">' + esc(f.label) + '</label>' +
        '<select class="form-control form-control-sm" id="' + id + '" data-path="' + f.path + '">' +
        f.options.map(function (op) {
          return '<option value="' + esc(op.value) + '"' + (String(op.value) === String(v) ? ' selected' : '') + '>' + esc(op.label) + '</option>';
        }).join('') + '</select></div>';
    }
    if (f.type === 'table') return tableHtml(f);
    return '<div class="form-group mb-2 row no-gutters align-items-center' + (changed ? ' changed' : '') + '">' +
      '<label class="col-7 mb-0 small" for="' + id + '">' + esc(f.label) + (f.unit ? ', <span class="text-muted">' + esc(f.unit) + '</span>' : '') + '</label>' +
      '<div class="col-5"><input type="number" step="any" class="form-control form-control-sm text-right" id="' + id + '" data-path="' + f.path + '" value="' + esc(v) + '"></div></div>';
  }

  function tableHtml(f) {
    var rows = get(D, f.path) || [];
    var orows = get(original, f.path) || [];
    var head = f.columns.map(function (c) { return '<th>' + esc(c.label) + '</th>'; }).join('');
    var body = rows.map(function (r, i) {
      return '<tr>' + f.columns.map(function (c) {
        var p = f.path + '.' + i + '.' + c.key;
        if (c.readonly) return '<td class="text-nowrap">' + esc(r[c.key]) + '</td>';
        var changed = orows[i] && JSON.stringify(r[c.key]) !== JSON.stringify(orows[i][c.key]);
        return '<td' + (changed ? ' class="changed"' : '') + '><input type="number" step="any" class="form-control form-control-sm text-right" data-path="' + p + '" value="' + esc(r[c.key]) + '"></td>';
      }).join('') + '</tr>';
    }).join('');
    return '<div class="mb-2">' + (f.label ? '<div class="small font-weight-bold mb-1">' + esc(f.label) + '</div>' : '') +
      '<div class="table-responsive"><table class="table table-sm table-bordered panel-table"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div></div>';
  }

  var lastDetails = [];

  // Вкладка «Розрахунок»: групи рядків { label, value, formula }
  function detailsHtml(groups) {
    if (!groups || !groups.length) return '<p class="small text-muted">Немає даних — перевірте введені розміри.</p>';
    return groups.map(function (g) {
      return '<div class="small font-weight-bold mt-2 mb-1">' + esc(g.group) + '</div>' +
        '<table class="table table-sm small details-table mb-2"><tbody>' +
        g.items.map(function (i) {
          return '<tr><td>' + esc(i.label) +
            (i.formula ? '<div class="text-muted formula">' + esc(i.formula) + '</div>' : '') +
            '</td><td class="text-right text-nowrap align-top font-weight-bold">' + esc(i.value) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }).join('');
  }

  function renderPanel() {
    var tabs = cfg.panel(D).concat([pricingTab(cfg.pricing)]);
    var active = renderPanel.active || 0;
    if (active >= tabs.length) active = 0;
    var nav = tabs.map(function (t, i) {
      return '<li class="nav-item"><a href="#" class="nav-link' + (i === active ? ' active' : '') + '" data-tab="' + i + '">' + esc(t.tab) + '</a></li>';
    }).join('');
    var pane = tabs[active];
    renderPanel.detailsActive = !!pane.details;
    var body = (pane.note ? '<p class="small text-muted">' + esc(pane.note) + '</p>' : '') +
      (pane.details ? detailsHtml(lastDetails) : pane.fields.map(fieldHtml).join(''));
    document.getElementById('panel-body').innerHTML =
      '<ul class="nav nav-tabs nav-tabs-sm mb-3">' + nav + '</ul>' + body;
  }

  function bindPanel() {
    var body = document.getElementById('panel-body');
    body.addEventListener('click', function (e) {
      var t = e.target.closest('[data-tab]');
      if (!t) return;
      e.preventDefault();
      renderPanel.active = +t.getAttribute('data-tab');
      renderPanel();
    });
    body.addEventListener('change', function (e) {
      var el = e.target, path = el.getAttribute('data-path');
      if (!path) return;
      var old = get(D, path);
      var v;
      if (el.type === 'checkbox') v = el.checked;
      else if (el.tagName === 'SELECT') v = typeof old === 'number' ? num(el.value) : el.value;
      else v = num(el.value);
      set(D, path, v);
      renderPanel();
      recompute();
    });
    document.getElementById('panel-reset').addEventListener('click', function () {
      D = clone(original);
      renderPanel();
      recompute();
    });
    document.getElementById('panel-open').addEventListener('click', function () {
      document.body.classList.add('panel-open');
    });
    document.getElementById('panel-close').addEventListener('click', function () {
      document.body.classList.remove('panel-open');
    });
  }

  // ---------- розрахунок і розшифровка ----------
  function round3(x) { return Math.round(x / 3) * 3; }

  function totals(rows, pricing) {
    var cost = rows.reduce(function (s, r) { return s + num(r.qty) * num(r.price); }, 0);
    var r3 = pricing.rounding === 'round3' ? round3 : ceil3;
    if (pricing.subtotal_round3) cost = round3(cost);
    var m = num(pricing.markup_pct), v = num(pricing.vat_pct);
    var marked = cost * (1 + m / 100);
    var total, noVat;
    if (pricing.vat_included) {
      total = r3(marked);
      noVat = total / (1 + v / 100);
    } else {
      noVat = marked;
      total = r3(marked * (1 + v / 100));
    }
    return { cost: cost, markup: marked - cost, markup_pct: m, noVat: noVat, vat: total - noVat, vat_pct: v, total: total };
  }

  function recompute() {
    var out;
    try {
      out = cfg.compute(D, readInputs());
    } catch (err) {
      out = { error: err.message };
    }
    var el = document.getElementById('result');
    var viz = document.getElementById('viz');
    lastDetails = out.details || [];
    if (renderPanel.detailsActive) renderPanel();
    if (viz) viz.innerHTML = out.error ? '' : (out.viz || '');
    if (out.error) {
      el.innerHTML = '<div class="alert alert-warning mb-0">' + esc(out.error) + '</div>';
      return;
    }
    var pricing = out.pricing || get(D, cfg.pricing + '.pricing');
    var t = totals(out.rows, pricing);
    var rowsHtml = out.rows.map(function (r) {
      var sum = num(r.qty) * num(r.price);
      return '<tr' + (num(r.price) === 0 ? ' class="text-muted"' : '') + '><td>' + esc(r.name) +
        (r.note ? '<div class="small text-muted">' + esc(r.note) + '</div>' : '') + '</td>' +
        '<td class="text-right text-nowrap">' + money(r.qty, r.qtyDigits == null ? 2 : r.qtyDigits) + ' ' + esc(r.unit || '') + '</td>' +
        '<td class="text-right text-nowrap">' + money(r.price) + '</td>' +
        '<td class="text-right text-nowrap">' + money(sum) + '</td></tr>';
    }).join('');
    var info = (out.info || []).map(function (i) {
      return '<tr><td>' + esc(i.label) + '</td><td class="text-right">' + esc(i.value) + '</td></tr>';
    }).join('');
    var warn = (out.warnings || []).map(function (w) {
      return '<div class="alert alert-warning py-1 px-2 small mb-2">' + esc(w) + '</div>';
    }).join('');
    var vatNote = pricing.vat_included ? ' (ціни в таблицях з ПДВ)' : '';
    el.innerHTML =
      '<div class="price-total">' + money(t.total, 0) + ' грн <span class="small text-muted">з ПДВ</span></div>' +
      (out.title ? '<div class="mb-3 font-weight-bold">' + esc(out.title) + '</div>' : '') +
      warn +
      '<div class="table-responsive"><table class="table table-sm breakdown"><thead><tr><th>Складова</th><th class="text-right">К-сть</th><th class="text-right">Ціна, грн</th><th class="text-right">Сума, грн</th></tr></thead><tbody>' +
      rowsHtml + '</tbody><tfoot>' +
      '<tr><th colspan="3">Собівартість' + esc(vatNote) + '</th><th class="text-right">' + money(t.cost) + '</th></tr>' +
      '<tr><td colspan="3">Націнка ' + money(t.markup_pct, 1) + '%</td><td class="text-right">' + money(t.markup) + '</td></tr>' +
      '<tr><td colspan="3">Ціна без ПДВ</td><td class="text-right">' + money(t.noVat) + '</td></tr>' +
      '<tr><td colspan="3">ПДВ ' + money(t.vat_pct, 0) + '%</td><td class="text-right">' + money(t.vat) + '</td></tr>' +
      '<tr class="table-success"><th colspan="3">Ціна з ПДВ (' + (pricing.rounding === 'round3' ? 'округлено' : 'вгору') + ' до кратного 3)</th><th class="text-right">' + money(t.total, 0) + '</th></tr>' +
      '</tfoot></table></div>' +
      (info ? '<div class="small font-weight-bold mt-3 mb-1">Розраховані параметри</div><table class="table table-sm small info-table"><tbody>' + info + '</tbody></table>' : '') +
      (out.after || '');
  }

  function boot(config) {
    cfg = config;
    bindPanel();
    var form = document.getElementById('inputs');
    if (form) {
      form.addEventListener('input', recompute);
      form.addEventListener('change', recompute);
      form.addEventListener('submit', function (e) { e.preventDefault(); });
    }
    if (config.docked && window.innerWidth >= 1400) document.body.classList.add('panel-open', 'panel-docked');
    load(config.data).then(function () {
      if (config.init) config.init(D);
      renderPanel();
      recompute();
    }).catch(function (err) {
      document.getElementById('result').innerHTML =
        '<div class="alert alert-danger">Не вдалося завантажити дані: ' + esc(err.message) +
        '.<br>Сторінку треба відкривати через веб-сервер (GitHub Pages або <code>python -m http.server</code> у корені репозиторію), а не подвійним кліком по файлу.</div>';
    });
  }

  window.Calc = { boot: boot, esc: esc, round3: round3, recompute: function () { recompute(); }, num: num, ceil3: ceil3, money: money, get: get, totals: totals };
})();
