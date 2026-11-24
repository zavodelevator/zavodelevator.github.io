// Форма редагування файлу цін: групи, пошук, підсвітка змін, вивантаження нового prices_*.json.
(function () {
  'use strict';
  var src = null, orig = {}, cur = {}, ai = {}, onlyChanged = false, onlyAi = false, open = {};
  var AI_LBL = { own: 'з ваших таблиць', web: 'з інтернету', estimate: 'оцінка Claude' };
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function num(v) { var n = parseFloat(String(v).replace(',', '.').replace(/\s/g, '')); return isNaN(n) ? 0 : n; }
  function fmt(v) { return Number(v).toLocaleString('uk-UA', { maximumFractionDigits: 6 }); }
  function changed(id) { return cur[id] !== orig[id]; }
  function changedCount() { return Object.keys(cur).filter(function (k) { return changed(k) || (!!src.items.filter(function (i) { return i.id === k && i.ai; })[0] && !ai[k]); }).length; }

  function load(data, file) {
    src = data; orig = {}; cur = {};
    ai = {};
    data.items.forEach(function (it) { orig[it.id] = it.value; cur[it.id] = it.value; if (it.ai) ai[it.id] = it.ai; });
    $('pe-file').textContent = file ? 'Файл: ' + file + (data.created ? ' (' + data.created + ')' : '') : '';
    render();
  }

  function matches(it, q) {
    if (!q) return true;
    var hay = (it.group + ' ' + it.sub + ' ' + it.label + ' ' + it.used.join(' ') + ' ' + it.note).toLowerCase();
    return q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
  }

  function render() {
    var q = $('pe-search').value.trim();
    var groups = {}, order = [];
    src.items.forEach(function (it) {
      if (!matches(it, q) || (onlyChanged && !changed(it.id)) || (onlyAi && !ai[it.id])) return;
      if (!groups[it.group]) { groups[it.group] = {}; order.push(it.group); }
      (groups[it.group][it.sub] = groups[it.group][it.sub] || []).push(it);
    });
    $('pe-groups').innerHTML = order.map(function (g, gi) {
      var subs = groups[g], n = 0, ch = 0, na = 0;
      Object.keys(subs).forEach(function (s) { subs[s].forEach(function (it) { n++; if (changed(it.id)) ch++; if (ai[it.id]) na++; }); });
      var isOpen = open[g] || q || onlyChanged || onlyAi || n <= 40;
      return '<div class="card pe-group mb-2"><div class="card-header" data-g="' + esc(g) + '"><span><b>' + esc(g) + '</b> <span class="text-muted small">' + n + '</span>' +
        (na ? ' <span class="badge pe-ai-badge">неточних ' + na + '</span>' : '') + (ch ? ' <span class="badge badge-changed">змінено ' + ch + '</span>' : '') + '</span><span>' + (isOpen ? '▾' : '▸') + '</span></div>' +
        (isOpen ? '<div class="card-body py-2">' + Object.keys(subs).map(function (s) {
          return (s ? '<div class="pe-sub">' + esc(s) + '</div>' : '') + '<table class="table table-sm pe-table mb-1"><tbody>' + subs[s].map(row).join('') + '</tbody></table>';
        }).join('') + '</div>' : '') + '</div>';
    }).join('') || '<p class="text-muted">Нічого не знайдено.</p>';
    $('pe-count').textContent = changedCount();
  }

  function row(it) {
    var c = changed(it.id), a = ai[it.id];
    return '<tr class="' + (c ? 'changed ' : '') + (a ? 'ai' : '') + '"><td>' + esc(it.label) +
      (a ? ' <span class="badge pe-ai-badge" title="Цю ціну заповнив Claude — перевірте">✎ ' + esc(AI_LBL[a] || 'Claude') + '</span>' : '') +
      (it.note ? '<div class="pe-note">' + esc(it.note) + '</div>' : '') +
      '<div class="pe-used">' + it.used.map(function (u) { return '<span class="badge badge-light border">' + esc(u) + '</span>'; }).join('') +
      (it.paths.length > 1 ? '<span class="badge badge-info" title="' + esc(it.paths.join('\n')) + '">спільна ×' + it.paths.length + '</span>' : '') + '</div></td>' +
      '<td style="width:150px"><input type="text" inputmode="decimal" class="form-control form-control-sm" data-id="' + esc(it.id) + '" value="' + esc(fmt(cur[it.id])) + '">' +
      (c ? '<div class="pe-was text-right">було ' + esc(fmt(orig[it.id])) + '</div>' : '') +
      (a ? '<button class="btn btn-link btn-sm p-0 pe-ok" data-ok="' + esc(it.id) + '" title="Ціна правильна — зняти позначку">✓ підтвердити</button>' : '') + '</td>' +
      '<td class="text-muted small text-nowrap" style="width:60px">' + esc(it.unit) + '</td></tr>';
  }

  function download() {
    var now = new Date();
    var name = window.Prices.fileName(now);
    var out = JSON.parse(JSON.stringify(src));
    out.created = name.replace(/^prices_|\.json$/g, '').replace('_', ' ').replace(/-(\d\d)$/, ':$1');
    out.based_on = $('pe-file').textContent.replace(/^Файл: /, '');
    out.note = $('pe-note').value || ('Змінено позицій: ' + changedCount());
    out.changes = src.items.filter(function (it) { return changed(it.id); }).map(function (it) { return { id: it.id, label: it.group + ' · ' + (it.sub ? it.sub + ' · ' : '') + it.label, from: orig[it.id], to: cur[it.id] }; });
    out.items.forEach(function (it) { it.value = cur[it.id]; if (ai[it.id]) it.ai = ai[it.id]; else delete it.ai; });
    var blob = new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    alert('Збережено ' + name + '.\nПокладіть файл у calc/prices на GitHub — калькулятори почнуть брати ці ціни.');
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('pe-groups').addEventListener('click', function (e) {
      var ok = e.target.closest('[data-ok]');
      if (ok) { delete ai[ok.getAttribute('data-ok')]; render(); return; }
      var h = e.target.closest('[data-g]');
      if (!h) return;
      var g = h.getAttribute('data-g'); open[g] = !(open[g] || false);
      render();
    });
    $('pe-groups').addEventListener('change', function (e) {
      var id = e.target.getAttribute('data-id');
      if (!id) return;
      cur[id] = num(e.target.value);
      if (cur[id] !== orig[id]) delete ai[id];
      setTimeout(render, 0);
    });
    $('pe-search').addEventListener('input', render);
    $('pe-only-ai').addEventListener('click', function () { onlyAi = !onlyAi; this.classList.toggle('active', onlyAi); render(); });
    $('pe-only-changed').addEventListener('click', function () { onlyChanged = !onlyChanged; this.classList.toggle('active', onlyChanged); render(); });
    $('pe-expand').addEventListener('click', function () { src.items.forEach(function (it) { open[it.group] = true; }); render(); });
    $('pe-reset').addEventListener('click', function () { if (confirm('Скинути всі зміни?')) { Object.keys(orig).forEach(function (k) { cur[k] = orig[k]; }); render(); } });
    $('pe-download').addEventListener('click', download);
    $('pe-open').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () { try { load(JSON.parse(r.result), f.name + ' (з комп’ютера)'); } catch (err) { alert('Не вдалося прочитати файл: ' + err.message); } };
      r.readAsText(f);
    });
    window.addEventListener('beforeunload', function (e) { if (changedCount()) { e.preventDefault(); e.returnValue = ''; } });
    window.Prices.latest('prices/').then(function (pr) { load(pr.data, pr.file); })
      .catch(function (err) { $('pe-groups').innerHTML = '<div class="alert alert-danger">Не знайдено файл цін: ' + esc(err.message) + '</div>'; });
  });
})();
