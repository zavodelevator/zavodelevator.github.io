(function () {
  'use strict';

  var SW  = 52;   // ширина шахти в SVG px
  var PPM = 22;   // px на 1 метр висоти
  var HH  = 48;   // висота голови в px
  var BH  = 40;   // висота башмака в px
  var OX  = 10;   // відступ зліва всередині SVG

  var COLORS = {
    head:     '#37474f',
    twometer: '#546e7a',
    meter:    '#78909c',
    revision: '#1565c0',
    bashmak:  '#455a64'
  };

  var NAMES = {
    head:     'Голова привідна',
    bashmak:  'Башмак норійний',
    revision: 'Ревізійна (1м)',
    meter:    'Метрова (1м)',
    twometer: 'Двохметрова (2м)'
  };

  // -------------------------------------------------------
  // Будує масив секцій у порядку SVG (зверху вниз)
  // -------------------------------------------------------
  function buildSections() {
    var cnts = window.count_nkz_section || {};
    var cRev = parseInt(cnts.revision_secton, 10) || 0;
    var cOne = parseInt(cnts.one, 10) || 0;
    var cTwo = parseInt(cnts.two, 10) || 0;
    var a = [];
    a.push({ id: 'head',    type: 'head',     hpx: HH,      hasT: false, tKey: '' });
    for (var i = cTwo - 1; i >= 0; i--)
      a.push({ id: 'two_'+i, type: 'twometer', hpx: PPM * 2, hasT: true,  tKey: 'twometer' });
    for (var i = cOne - 1; i >= 0; i--)
      a.push({ id: 'one_'+i, type: 'meter',    hpx: PPM,     hasT: true,  tKey: 'meter' });
    for (var i = cRev - 1; i >= 0; i--)
      a.push({ id: 'rev_'+i, type: 'revision', hpx: PPM,     hasT: true,  tKey: 'revision' });
    a.push({ id: 'bashmak', type: 'bashmak',  hpx: BH,      hasT: false, tKey: '' });
    return a;
  }

  function tVal(key) {
    var t = window.shaft_thickness && window.shaft_thickness[key];
    return t != null ? t : 1.5;
  }

  // -------------------------------------------------------
  // Генерує SVG-рядок
  // -------------------------------------------------------
  function buildSVG(secs) {
    var totalH = secs.reduce(function (s, x) { return s + x.hpx; }, 0) + 8;
    var W = OX + SW + 6;

    var p = [
      '<svg id="shaft_svg" xmlns="http://www.w3.org/2000/svg"',
      ' viewBox="0 0 ' + W + ' ' + totalH + '"',
      ' width="' + W + '" height="' + totalH + '"',
      ' style="overflow:visible;display:block;user-select:none;">',
      '<defs><style>',
      '.ss{transition:transform .18s ease;transform-box:fill-box;transform-origin:left center;cursor:default}',
      '.ss.htbl{cursor:pointer}',
      '.ss.hov{transform:scaleX(1.7)}',
      '.tb{font:bold 7px Arial,sans-serif;fill:rgba(255,255,255,.96)}',
      '</style></defs>'
    ];

    var y = 4;
    secs.forEach(function (s) {
      var sh = s.hpx;
      var cy = y + sh / 2;
      var col = COLORS[s.type] || '#78909c';
      var hc = s.hasT ? ' htbl' : '';

      p.push('<g class="ss' + hc + '" data-id="' + s.id + '" data-type="' + s.type + '" data-tkey="' + s.tKey + '" data-y="' + y + '" data-sh="' + sh + '">');

      if (s.type === 'head') {
        // Трапеція: ширша зверху → звужується до шахти знизу
        p.push('<polygon points="' + (OX+4) + ',' + y + ' ' + (OX+SW-4) + ',' + y + ' ' + (OX+SW) + ',' + (y+sh) + ' ' + OX + ',' + (y+sh) + '" fill="' + col + '" stroke="#263238" stroke-width="1.5"/>');
        // Шків (жовте коло = привідний барабан)
        p.push('<circle cx="' + (OX+SW/2-2) + '" cy="' + cy + '" r="9" fill="#ffa000" stroke="#e65100" stroke-width="1"/>');
        p.push('<circle cx="' + (OX+SW/2-2) + '" cy="' + cy + '" r="3" fill="#e65100"/>');

      } else if (s.type === 'bashmak') {
        // Трапеція: звужується зверху → ширша знизу
        p.push('<polygon points="' + OX + ',' + y + ' ' + (OX+SW) + ',' + y + ' ' + (OX+SW+7) + ',' + (y+sh) + ' ' + (OX-7) + ',' + (y+sh) + '" fill="' + col + '" stroke="#263238" stroke-width="1.5"/>');
        // Натяжний барабан
        p.push('<ellipse cx="' + (OX+SW/2-2) + '" cy="' + (y+8) + '" rx="8" ry="4" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>');

      } else if (s.type === 'revision') {
        p.push('<rect x="' + OX + '" y="' + y + '" width="' + SW + '" height="' + sh + '" fill="' + col + '" stroke="#263238" stroke-width="1"/>');
        // Оглядовий люк (синє вікно зліва)
        var winH = Math.max(4, sh - 5);
        p.push('<rect x="' + (OX+3) + '" y="' + (y+2) + '" width="10" height="' + winH + '" rx="1.5" fill="#bbdefb" stroke="#64b5f6" stroke-width=".8" opacity=".9"/>');
        // Значок товщини (справа)
        p.push('<rect x="' + (OX+SW-22) + '" y="' + (cy-5.5) + '" width="22" height="11" rx="2" fill="rgba(0,0,0,.45)"/>');
        p.push('<text class="tb" x="' + (OX+SW-11) + '" y="' + (cy+2) + '" text-anchor="middle">' + tVal(s.tKey) + 'мм</text>');

      } else {
        // meter / twometer — стандартна секція
        p.push('<rect x="' + OX + '" y="' + y + '" width="' + SW + '" height="' + sh + '" fill="' + col + '" stroke="#263238" stroke-width="1"/>');
        // Направляюча стрічки/ланцюга (пунктир по центру)
        p.push('<line x1="' + (OX+SW/2) + '" y1="' + (y+2) + '" x2="' + (OX+SW/2) + '" y2="' + (y+sh-2) + '" stroke="rgba(255,255,255,.13)" stroke-width="1.5" stroke-dasharray="3,2"/>');
        // Горизонтальний роздільник між метрами для 2м-секцій
        if (s.type === 'twometer') {
          var mid = y + sh / 2;
          p.push('<line x1="' + OX + '" y1="' + mid + '" x2="' + (OX+SW) + '" y2="' + mid + '" stroke="rgba(255,255,255,.18)" stroke-width="1" stroke-dasharray="2,3"/>');
        }
        // Значок товщини
        p.push('<rect x="' + (OX+SW-22) + '" y="' + (cy-5.5) + '" width="22" height="11" rx="2" fill="rgba(0,0,0,.3)"/>');
        p.push('<text class="tb" x="' + (OX+SW-11) + '" y="' + (cy+2) + '" text-anchor="middle">' + tVal(s.tKey) + 'мм</text>');
      }

      p.push('</g>');
      y += sh;
    });

    p.push('</svg>');
    return { html: p.join(''), w: W, h: totalH };
  }

  // -------------------------------------------------------
  // Рендеринг легенди (список секцій справа від SVG)
  // -------------------------------------------------------
  function buildLegend(secs, container) {
    container.innerHTML = '';
    var shown = {};
    secs.forEach(function (s) {
      var key = s.type;
      if (shown[key]) return;
      shown[key] = true;
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:5px;margin-bottom:3px;font-size:0.75em;color:#444;';
      var dot = document.createElement('span');
      dot.style.cssText = 'width:10px;height:10px;border-radius:2px;flex-shrink:0;background:' + (COLORS[key] || '#888') + ';';
      var txt = document.createElement('span');
      txt.textContent = NAMES[key] || key;
      row.appendChild(dot);
      row.appendChild(txt);
      container.appendChild(row);
    });
  }

  // -------------------------------------------------------
  // Оновлює значки товщини в SVG без повного перемальовування
  // -------------------------------------------------------
  function refreshBadges(svgEl, key, val) {
    svgEl.querySelectorAll('.ss[data-tkey="' + key + '"] .tb').forEach(function (txt) {
      txt.textContent = val + 'мм';
    });
  }

  // -------------------------------------------------------
  // Головна функція рендерингу схеми
  // -------------------------------------------------------
  window.renderShaftSchema = function renderShaftSchema() {
    try {
      var host = document.querySelector('#info-shafts .col-sm');
      if (!host) return;

      // Видалити попередню схему
      var old = host.querySelector('#shaft_schema_wrap');
      if (old) old.remove();

      var secs = buildSections();
      var built = buildSVG(secs);

      /* ---- Оболонка ---- */
      var wrap = document.createElement('div');
      wrap.id = 'shaft_schema_wrap';
      wrap.style.cssText = 'display:flex;align-items:flex-start;gap:10px;margin:8px 0 4px;';

      /* ---- Колонка SVG ---- */
      var svgCol = document.createElement('div');
      svgCol.style.cssText = 'flex-shrink:0;max-height:400px;overflow-y:auto;overflow-x:visible;';
      svgCol.innerHTML = built.html;

      /* ---- Права частина: легенда + панель деталей ---- */
      var rightCol = document.createElement('div');
      rightCol.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:6px;min-width:130px;max-width:165px;';

      var legend = document.createElement('div');
      legend.id = 'shaft_legend';
      buildLegend(secs, legend);

      /* Панель деталей (з'являється при наведенні) */
      var panel = document.createElement('div');
      panel.id = 'shaft_detail_panel';
      panel.style.cssText = [
        'padding:7px 9px',
        'background:#f8f9fa',
        'border:1px solid #dee2e6',
        'border-radius:5px',
        'font-size:0.78em',
        'color:#555',
        'transition:opacity .15s'
      ].join(';');
      panel.innerHTML = '<span style="color:#aaa;font-style:italic;">← наведіть на секцію</span>';

      rightCol.appendChild(legend);
      rightCol.appendChild(panel);
      wrap.appendChild(svgCol);
      wrap.appendChild(rightCol);

      /* Вставляємо після рядка з кількістю секцій */
      var countP = host.querySelector('#shafts_count_p');
      host.insertBefore(wrap, countP ? countP.nextSibling : host.firstChild);

      /* ---- Hover-логіка ---- */
      var svgEl = svgCol.querySelector('#shaft_svg');
      if (!svgEl) return;

      var hideTimer = null;
      var curG = null;

      function showPanel(g) {
        clearTimeout(hideTimer);
        if (curG && curG !== g) curG.classList.remove('hov');
        curG = g;
        g.classList.add('hov');

        var key  = g.dataset.tkey;
        var type = g.dataset.type;
        var name = NAMES[type] || type;

        if (!key) {
          panel.innerHTML =
            '<div style="font-weight:600;color:#333;margin-bottom:3px;">' + name + '</div>' +
            '<div style="color:#999;font-style:italic;font-size:0.9em;">Товщина не змінюється</div>';
          return;
        }

        var cur   = tVal(key);
        var tList = typeof getAvailableThicknesses === 'function'
          ? getAvailableThicknesses()
          : [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

        panel.innerHTML =
          '<div style="font-weight:600;color:#333;margin-bottom:5px;">' + name + '</div>' +
          '<label style="color:#666;display:block;margin-bottom:3px;">Товщина металу:</label>' +
          '<select id="ssp_sel" style="width:100%;padding:3px 5px;border-radius:3px;border:1px solid #bbb;font-size:0.95em;">' +
          tList.map(function (v) {
            return '<option value="' + v + '"' + (Math.abs(v - cur) < 0.01 ? ' selected' : '') + '>' + v + ' мм</option>';
          }).join('') +
          '</select>' +
          '<div id="ssp_note" style="margin-top:4px;color:#888;font-size:0.85em;">Усі секції цього типу</div>';

        document.getElementById('ssp_sel').addEventListener('change', function () {
          var newT = parseFloat(this.value);
          if (window.shaft_thickness) window.shaft_thickness[key] = newT;
          refreshBadges(svgEl, key, newT);
          if (typeof updateShaftsDetails  === 'function') updateShaftsDetails();
          if (typeof updatePricesSummary  === 'function') updatePricesSummary();
        });
      }

      function scheduleHide() {
        hideTimer = setTimeout(function () {
          if (curG) { curG.classList.remove('hov'); curG = null; }
          panel.innerHTML = '<span style="color:#aaa;font-style:italic;">← наведіть на секцію</span>';
        }, 300);
      }

      svgEl.querySelectorAll('.ss').forEach(function (g) {
        g.addEventListener('mouseenter', function () { showPanel(g); });
        g.addEventListener('mouseleave', scheduleHide);
      });

      panel.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
      panel.addEventListener('mouseleave', scheduleHide);

    } catch (e) {
      console.error('renderShaftSchema:', e);
    }
  };

})();
