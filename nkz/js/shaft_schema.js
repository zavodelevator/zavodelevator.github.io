(function () {
  'use strict';

  var SW  = 52;
  var PPM = 22;
  var HH  = 64;
  var BH  = 50;
  var OX  = 18;

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

  var __docCleanup = [];

  function buildSections() {
    var cnts = window.count_nkz_section || {};
    var cRev = parseInt(cnts.revision_secton, 10) || 0;
    var cOne = parseInt(cnts.one, 10) || 0;
    var cTwo = parseInt(cnts.two, 10) || 0;
    var a = [];
    a.push({ id: 'head',      type: 'head',     hpx: HH,      hasT: false, tKey: '' });
    for (var i = cTwo - 1; i >= 0; i--)
      a.push({ id: 'two_' + i, type: 'twometer', hpx: PPM * 2, hasT: true,  tKey: 'twometer' });
    for (var i = cOne - 1; i >= 0; i--)
      a.push({ id: 'one_' + i, type: 'meter',    hpx: PPM,     hasT: true,  tKey: 'meter' });
    for (var i = cRev - 1; i >= 0; i--)
      a.push({ id: 'rev_' + i, type: 'revision', hpx: PPM,     hasT: true,  tKey: 'revision' });
    a.push({ id: 'bashmak',   type: 'bashmak',  hpx: BH,      hasT: false, tKey: '' });
    return a;
  }

  function tVal(key) {
    var t = window.shaft_thickness && window.shaft_thickness[key];
    return t != null ? t : 1.5;
  }

  function buildSVG(secs) {
    var totalH = secs.reduce(function (s, x) { return s + x.hpx; }, 0) + 8;
    var W = OX + SW + 22;

    var css = [
      '.ss{cursor:default;transition:filter .15s}',
      '.ss.htbl{cursor:pointer}',
      '.ss.htbl:hover{filter:brightness(1.18)}',
      '.ss.sel{filter:brightness(1.2) drop-shadow(0 0 4px #29b6f6)}',
      '.tb{font:bold 7px Arial,sans-serif;fill:rgba(255,255,255,.96)}'
    ].join('');

    var p = [
      '<svg id="shaft_svg" xmlns="http://www.w3.org/2000/svg"',
      ' viewBox="0 0 ' + W + ' ' + totalH + '"',
      ' width="' + W + '" height="' + totalH + '"',
      ' style="overflow:visible;display:block;user-select:none;">',
      '<defs><style>' + css + '</style></defs>'
    ];

    var y = 4;
    secs.forEach(function (s) {
      var sh  = s.hpx;
      var cy  = y + sh / 2;
      var cx  = OX + SW / 2;
      var col = COLORS[s.type] || '#78909c';
      var hc  = s.hasT ? ' htbl' : '';

      p.push('<g class="ss' + hc + '" data-id="' + s.id + '" data-type="' + s.type + '" data-tkey="' + s.tKey + '">');

      if (s.type === 'head') {
        var pcY = y + 22;
        // Housing (wider than shaft)
        p.push('<rect x="' + (OX-4) + '" y="' + (y+2) + '" width="' + (SW+8) + '" height="' + (HH-18) + '" rx="3" fill="' + col + '" stroke="#263238" stroke-width="1.5"/>');
        // Inner frame
        p.push('<rect x="' + (OX+4) + '" y="' + (y+6) + '" width="' + (SW-8) + '" height="' + (HH-30) + '" rx="2" fill="rgba(0,0,0,0.2)"/>');
        // Drive pulley
        p.push('<circle cx="' + cx + '" cy="' + pcY + '" r="13" fill="#ffa000" stroke="#e65100" stroke-width="1.5"/>');
        // Spokes
        p.push('<line x1="' + cx + '" y1="' + (pcY-13) + '" x2="' + cx + '" y2="' + (pcY+13) + '" stroke="rgba(0,0,0,.3)" stroke-width="1.5"/>');
        p.push('<line x1="' + (cx-13) + '" y1="' + pcY + '" x2="' + (cx+13) + '" y2="' + pcY + '" stroke="rgba(0,0,0,.3)" stroke-width="1.5"/>');
        // Hub
        p.push('<circle cx="' + cx + '" cy="' + pcY + '" r="4" fill="#bf360c"/>');
        // Discharge nozzle →
        p.push('<polygon points="'
          + (OX+SW+4) + ',' + (y+10)
          + ' ' + (OX+SW+18) + ',' + (y+14)
          + ' ' + (OX+SW+18) + ',' + (y+22)
          + ' ' + (OX+SW+4) + ',' + (y+24)
          + '" fill="#546e7a" stroke="#263238" stroke-width="1"/>');
        // Belt guide down
        p.push('<line x1="' + cx + '" y1="' + (pcY+13) + '" x2="' + cx + '" y2="' + (y+HH-18) + '" stroke="rgba(255,255,255,.2)" stroke-width="1.5" stroke-dasharray="3,2"/>');
        // Flange plate
        p.push('<rect x="' + OX + '" y="' + (y+HH-14) + '" width="' + SW + '" height="6" rx="1" fill="#37474f" stroke="#263238" stroke-width="1"/>');
        // Flange bolts
        p.push('<rect x="' + (OX+5) + '" y="' + (y+HH-16) + '" width="5" height="10" rx="1" fill="#546e7a" stroke="#263238" stroke-width=".5"/>');
        p.push('<rect x="' + (OX+SW-10) + '" y="' + (y+HH-16) + '" width="5" height="10" rx="1" fill="#546e7a" stroke="#263238" stroke-width=".5"/>');

      } else if (s.type === 'bashmak') {
        // Flange bolts at top
        p.push('<rect x="' + (OX+5) + '" y="' + (y-2) + '" width="5" height="10" rx="1" fill="#546e7a" stroke="#263238" stroke-width=".5"/>');
        p.push('<rect x="' + (OX+SW-10) + '" y="' + (y-2) + '" width="5" height="10" rx="1" fill="#546e7a" stroke="#263238" stroke-width=".5"/>');
        // Flange plate
        p.push('<rect x="' + OX + '" y="' + y + '" width="' + SW + '" height="6" rx="1" fill="#37474f" stroke="#263238" stroke-width="1"/>');
        // Housing
        p.push('<rect x="' + (OX-4) + '" y="' + (y+6) + '" width="' + (SW+8) + '" height="' + (BH-18) + '" rx="3" fill="' + col + '" stroke="#263238" stroke-width="1.5"/>');
        // Loading throat ←
        p.push('<polygon points="'
          + (OX-4) + ',' + (y+12)
          + ' ' + (OX-14) + ',' + (y+17)
          + ' ' + (OX-14) + ',' + (y+27)
          + ' ' + (OX-4) + ',' + (y+30)
          + '" fill="#546e7a" stroke="#263238" stroke-width="1"/>');
        // Tension drum
        var bDY = y + BH - 24;
        p.push('<circle cx="' + cx + '" cy="' + bDY + '" r="10" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.45)" stroke-width="1.5"/>');
        p.push('<circle cx="' + cx + '" cy="' + bDY + '" r="3.5" fill="rgba(255,255,255,.25)"/>');
        // Belt guide up
        p.push('<line x1="' + cx + '" y1="' + (y+8) + '" x2="' + cx + '" y2="' + (bDY-10) + '" stroke="rgba(255,255,255,.15)" stroke-width="1.5" stroke-dasharray="3,2"/>');
        // Tension rail
        p.push('<rect x="' + (OX-4) + '" y="' + (y+BH-12) + '" width="' + (SW+8) + '" height="4" rx="1" fill="#37474f" stroke="#263238" stroke-width="1"/>');
        // Adjustment bolts ×3
        p.push('<circle cx="' + (OX+8) + '" cy="' + (y+BH-10) + '" r="3" fill="#455a64" stroke="#263238" stroke-width=".8"/>');
        p.push('<circle cx="' + cx + '" cy="' + (y+BH-10) + '" r="3" fill="#455a64" stroke="#263238" stroke-width=".8"/>');
        p.push('<circle cx="' + (OX+SW-8) + '" cy="' + (y+BH-10) + '" r="3" fill="#455a64" stroke="#263238" stroke-width=".8"/>');

      } else if (s.type === 'revision') {
        p.push('<rect x="' + OX + '" y="' + y + '" width="' + SW + '" height="' + sh + '" fill="' + col + '" stroke="#263238" stroke-width="1"/>');
        var winH = Math.max(4, sh - 5);
        p.push('<rect x="' + (OX+3) + '" y="' + (y+2) + '" width="10" height="' + winH + '" rx="1.5" fill="#bbdefb" stroke="#64b5f6" stroke-width=".8" opacity=".9"/>');
        p.push('<line x1="' + cx + '" y1="' + (y+2) + '" x2="' + cx + '" y2="' + (y+sh-2) + '" stroke="rgba(255,255,255,.15)" stroke-width="1.5" stroke-dasharray="3,2"/>');
        p.push('<rect x="' + (OX+SW-22) + '" y="' + (cy-5.5) + '" width="22" height="11" rx="2" fill="rgba(0,0,0,.45)"/>');
        p.push('<text class="tb" x="' + (OX+SW-11) + '" y="' + (cy+2) + '" text-anchor="middle">' + tVal(s.tKey) + 'мм</text>');

      } else {
        // meter / twometer
        p.push('<rect x="' + OX + '" y="' + y + '" width="' + SW + '" height="' + sh + '" fill="' + col + '" stroke="#263238" stroke-width="1"/>');
        p.push('<line x1="' + cx + '" y1="' + (y+2) + '" x2="' + cx + '" y2="' + (y+sh-2) + '" stroke="rgba(255,255,255,.13)" stroke-width="1.5" stroke-dasharray="3,2"/>');
        if (s.type === 'twometer') {
          var mid = y + sh / 2;
          p.push('<line x1="' + OX + '" y1="' + mid + '" x2="' + (OX+SW) + '" y2="' + mid + '" stroke="rgba(255,255,255,.18)" stroke-width="1" stroke-dasharray="2,3"/>');
        }
        p.push('<rect x="' + (OX+SW-22) + '" y="' + (cy-5.5) + '" width="22" height="11" rx="2" fill="rgba(0,0,0,.3)"/>');
        p.push('<text class="tb" x="' + (OX+SW-11) + '" y="' + (cy+2) + '" text-anchor="middle">' + tVal(s.tKey) + 'мм</text>');
      }

      p.push('</g>');
      y += sh;
    });

    p.push('</svg>');
    return { html: p.join(''), w: W, h: totalH };
  }

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

  function refreshBadges(svgEl, key, val) {
    svgEl.querySelectorAll('.ss[data-tkey="' + key + '"] .tb').forEach(function (t) {
      t.textContent = val + 'мм';
    });
  }

  function buildBurgerMenu(secs, svgEl) {
    var tList = typeof getAvailableThicknesses === 'function'
      ? getAvailableThicknesses()
      : [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

    var keys = [];
    var seen = {};
    secs.forEach(function (s) {
      if (s.tKey && !seen[s.tKey]) {
        seen[s.tKey] = true;
        keys.push({ key: s.tKey, name: NAMES[s.type] });
      }
    });

    var wrap = document.createElement('div');
    wrap.style.cssText = 'margin-bottom:5px;';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText = 'background:#f0f4f8;border:1px solid #ccc;border-radius:4px;padding:3px 9px;font-size:0.8em;cursor:pointer;display:inline-flex;align-items:center;gap:5px;color:#444;line-height:1.6;';
    btn.innerHTML = '<span style="font-size:1.15em;line-height:1;">&#9776;</span> Товщина шахт';

    // Inline panel — no absolute positioning, avoids all overflow-clip issues
    var panel = document.createElement('div');
    panel.style.cssText = 'display:none;margin-top:4px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:4px;padding:7px 9px;';

    keys.forEach(function (kn) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:5px;';
      var lbl = document.createElement('label');
      lbl.textContent = kn.name + ':';
      lbl.style.cssText = 'font-size:0.78em;color:#555;min-width:100px;flex-shrink:0;';
      var sel = document.createElement('select');
      sel.style.cssText = 'font-size:0.82em;padding:2px 4px;border-radius:3px;border:1px solid #bbb;flex:1;';
      tList.forEach(function (v) {
        var o = document.createElement('option');
        o.value = v;
        o.textContent = v + ' мм';
        if (Math.abs(v - tVal(kn.key)) < 0.01) o.selected = true;
        sel.appendChild(o);
      });
      (function (key) {
        sel.addEventListener('change', function () {
          var newT = parseFloat(this.value);
          if (window.shaft_thickness) window.shaft_thickness[key] = newT;
          if (svgEl) refreshBadges(svgEl, key, newT);
          if (typeof updateShaftsDetails === 'function') updateShaftsDetails();
          if (typeof updatePricesSummary === 'function') updatePricesSummary();
        });
      })(kn.key);
      row.appendChild(lbl);
      row.appendChild(sel);
      panel.appendChild(row);
    });

    if (!keys.length) {
      var empty = document.createElement('span');
      empty.style.cssText = 'font-size:0.8em;color:#999;font-style:italic;';
      empty.textContent = 'Немає секцій з товщиною';
      panel.appendChild(empty);
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });

    wrap.appendChild(btn);
    wrap.appendChild(panel);
    return { el: wrap, panel: panel };
  }

  window.renderShaftSchema = function renderShaftSchema() {
    try {
      __docCleanup.forEach(function (fn) { document.removeEventListener('click', fn); });
      __docCleanup = [];

      var host = document.querySelector('#info-shafts .col-sm');
      if (!host) return;

      var old = host.querySelector('#shaft_schema_wrap');
      if (old) old.remove();

      var secs = buildSections();
      var built = buildSVG(secs);

      var wrap = document.createElement('div');
      wrap.id = 'shaft_schema_wrap';
      wrap.style.cssText = 'margin:6px 0 4px;';

      var svgCol = document.createElement('div');
      svgCol.style.cssText = 'flex-shrink:0;max-height:400px;overflow-y:auto;overflow-x:visible;';
      svgCol.innerHTML = built.html;
      var svgEl = svgCol.querySelector('#shaft_svg');

      var burger = buildBurgerMenu(secs, svgEl);
      wrap.appendChild(burger.el);

      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:flex-start;gap:10px;';

      var rightCol = document.createElement('div');
      rightCol.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:6px;min-width:130px;max-width:165px;';

      var legend = document.createElement('div');
      buildLegend(secs, legend);

      var panel = document.createElement('div');
      panel.id = 'shaft_detail_panel';
      panel.style.cssText = 'padding:7px 9px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:5px;font-size:0.78em;color:#555;';
      panel.innerHTML = '<span style="color:#aaa;font-style:italic;">&#8592; клікніть секцію</span>';
      panel.addEventListener('click', function (e) { e.stopPropagation(); });

      rightCol.appendChild(legend);
      rightCol.appendChild(panel);
      row.appendChild(svgCol);
      row.appendChild(rightCol);
      wrap.appendChild(row);

      var countP = host.querySelector('#shafts_count_p');
      host.insertBefore(wrap, countP ? countP.nextSibling : host.firstChild);

      if (!svgEl) return;

      var curG = null;

      function deselect() {
        if (curG) { curG.classList.remove('sel'); curG = null; }
        panel.innerHTML = '<span style="color:#aaa;font-style:italic;">&#8592; клікніть секцію</span>';
      }

      function selectSection(g) {
        if (curG === g) { deselect(); return; }
        if (curG) curG.classList.remove('sel');
        curG = g;
        g.classList.add('sel');

        var key  = g.dataset.tkey;
        var type = g.dataset.type;
        var name = NAMES[type] || type;

        if (!key) {
          panel.innerHTML =
            '<div style="font-weight:600;color:#333;margin-bottom:3px;">' + name + '</div>' +
            '<div style="color:#999;font-style:italic;font-size:0.9em;">Фіксований елемент</div>';
          return;
        }

        var cur = tVal(key);
        var tList = typeof getAvailableThicknesses === 'function'
          ? getAvailableThicknesses()
          : [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

        var opts = tList.map(function (v) {
          return '<option value="' + v + '"' + (Math.abs(v - cur) < 0.01 ? ' selected' : '') + '>' + v + ' мм</option>';
        }).join('');

        panel.innerHTML =
          '<div style="font-weight:600;color:#333;margin-bottom:5px;">' + name + '</div>' +
          '<label style="color:#666;display:block;margin-bottom:3px;">Товщина:</label>' +
          '<select id="ssp_sel" style="width:100%;padding:3px 5px;border-radius:3px;border:1px solid #bbb;font-size:0.95em;">' + opts + '</select>' +
          '<div style="margin-top:4px;color:#888;font-size:0.85em;">Усі секції цього типу</div>';

        document.getElementById('ssp_sel').addEventListener('change', function () {
          var newT = parseFloat(this.value);
          if (window.shaft_thickness) window.shaft_thickness[key] = newT;
          refreshBadges(svgEl, key, newT);
          if (typeof updateShaftsDetails === 'function') updateShaftsDetails();
          if (typeof updatePricesSummary === 'function') updatePricesSummary();
        });
      }

      svgEl.querySelectorAll('.ss').forEach(function (g) {
        g.addEventListener('click', function (e) { e.stopPropagation(); selectSection(g); });
      });

      svgEl.addEventListener('click', function (e) { e.stopPropagation(); deselect(); });

      var docFn = function () {
        burger.panel.style.display = 'none';
        deselect();
      };
      document.addEventListener('click', docFn);
      __docCleanup.push(docFn);

    } catch (e) {
      console.error('renderShaftSchema:', e);
    }
  };

})();
