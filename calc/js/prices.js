// Файли цін: calc/prices/prices_YYYY-MM-DD_HH-MM.json. Береться файл з найпізнішою датою, не пізніше «зараз».
// Список файлів: GitHub API (на github.io) → список каталогу локального сервера → prices/index.json.
(function () {
  'use strict';
  var RE = /prices_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})\.json$/;
  var REPO = 'zavodelevator/zavodelevator.github.io';

  function stamp(name) {
    var m = RE.exec(name);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : null;
  }

  function list(base) {
    var tries = [];
    if (/github\.io$/.test(location.hostname)) {
      var dir = (location.pathname.replace(/[^/]*$/, '') + base).replace(/^\//, '').replace(/\/$/, '');
      tries.push(function () {
        return fetch('https://api.github.com/repos/' + REPO + '/contents/' + dir).then(function (r) {
          if (!r.ok) throw new Error('GitHub API ' + r.status);
          return r.json();
        }).then(function (a) { return a.map(function (x) { return x.name; }); });
      });
    }
    tries.push(function () {
      return fetch(base, { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('dir ' + r.status);
        return r.text();
      }).then(function (html) {
        var out = [], re = /href="([^"]*prices_[^"]+\.json)"/g, m;
        while ((m = re.exec(html))) out.push(decodeURIComponent(m[1].split('/').pop()));
        if (!out.length) throw new Error('empty');
        return out;
      });
    });
    tries.push(function () {
      return fetch(base + 'index.json', { cache: 'no-store' }).then(function (r) {
        if (!r.ok) throw new Error('index ' + r.status);
        return r.json();
      }).then(function (j) { return j.files || j; });
    });
    var i = 0;
    function next(err) {
      if (i >= tries.length) return Promise.reject(err || new Error('Не знайдено файлів цін'));
      return tries[i++]().catch(next);
    }
    return next();
  }

  // { file, data } найсвіжішого файлу (дата ≤ зараз)
  function latest(base) {
    base = base || 'prices/';
    var now = Date.now();
    return list(base).then(function (names) {
      var best = null, bestT = -1;
      names.forEach(function (n) {
        var t = stamp(n);
        if (t !== null && t <= now + 60000 && t > bestT) { best = n; bestT = t; }
      });
      if (!best) {  // годинник відстає або всі файли «з майбутнього» — беремо найраніший
        bestT = Infinity;
        names.forEach(function (n) { var t = stamp(n); if (t !== null && t < bestT) { best = n; bestT = t; } });
      }
      if (!best) throw new Error('Немає файлів prices_*.json');
      return fetch(base + best, { cache: 'no-store' }).then(function (r) { return r.json(); })
        .then(function (data) { return { file: best, time: bestT, data: data }; });
    });
  }

  function setPath(obj, path, value) {
    var keys = path.split('.'), last = keys.pop(), t = obj;
    for (var i = 0; i < keys.length; i++) { if (t == null) return false; t = t[keys[i]]; }
    if (t == null || !(last in t)) return false;
    t[last] = value;
    return true;
  }

  // Накласти ціни на завантажені дані (тільки для тих JSON, що є на сторінці)
  function apply(target, prices) {
    var n = 0;
    (prices.items || []).forEach(function (it) {
      (it.paths || []).forEach(function (p) {
        if (target[p.split('.')[0]] !== undefined && setPath(target, p, it.value)) n++;
      });
    });
    return n;
  }

  function get(prices, id) {
    var it = (prices.items || []).filter(function (x) { return x.id === id; })[0];
    return it ? it.value : undefined;
  }

  function fileName(d) {
    d = d || new Date();
    function p(x) { return (x < 10 ? '0' : '') + x; }
    return 'prices_' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '_' + p(d.getHours()) + '-' + p(d.getMinutes()) + '.json';
  }

  window.Prices = { latest: latest, apply: apply, get: get, fileName: fileName, stamp: stamp };
})();
