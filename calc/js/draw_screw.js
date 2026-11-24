// Креслення шнека збоку з розмірами (спільне для ремонту шнека і спіралі).
(function () {
  'use strict';
  function f(x, d) { return Number(x).toLocaleString('uk-UA', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  // ---------- креслення: шнек збоку ----------
  function drawScrew(D, d, t, L, wall, totalTurns) {
    var W = 800, H = 300, left = 80, right = 70, top = 50;
    var lenMm = L * 1000, maxTurns = 6;
    var cut = lenMm > maxTurns * t;
    var shownMm = cut ? maxTurns * t : lenMm;
    var k = Math.min((W - left - right) / shownMm, (H - top - 70) / D);
    var R = D / 2 * k, r = d / 2 * k, x0 = left, x1 = left + shownMm * k, y0 = top + R + 8;
    var out = [];
    function path(fn, a, b, steps) {
      var pts = [];
      for (var i = 0; i <= steps; i++) {
        var p = fn(a + (b - a) * i / steps);
        if (p[0] <= x1 + 0.01) pts.push(p[0].toFixed(1) + ',' + p[1].toFixed(1));
      }
      return pts.join(' ');
    }
    var turns = Math.ceil(shownMm / t);
    var back = [], front = [];
    for (var i = 0; i < turns; i++) {
      var base = i * 2 * Math.PI;
      var X = function (ph) { return x0 + (t * (base + ph) / (2 * Math.PI)) * k; };
      back.push('<polyline class="sv-back" points="' + path(function (ph) { return [X(ph), y0 - R * Math.cos(ph)]; }, Math.PI, 2 * Math.PI, 40) + '"/>');
      var outer = path(function (ph) { return [X(ph), y0 - R * Math.cos(ph)]; }, 0, Math.PI, 40);
      var inner = path(function (ph) { return [X(ph), y0 - r * Math.cos(ph)]; }, Math.PI, 0, 40);
      if (outer && inner) front.push('<polygon class="sv-flight" points="' + outer + ' ' + inner + '"/>');
      front.push('<polyline class="sv-edge" points="' + outer + '"/>');
    }
    out.push(back.join(''));
    out.push('<rect class="sv-tube" x="' + (x0 - 6) + '" y="' + (y0 - r) + '" width="' + (x1 - x0 + 12) + '" height="' + (2 * r) + '"/>');
    if (wall > 0) {
      var w = Math.max(wall * k, 1);
      out.push('<rect class="sv-bore" x="' + (x0 - 6) + '" y="' + (y0 - r + w) + '" width="10" height="' + Math.max(2 * r - 2 * w, 1) + '"/>');
    }
    out.push('<line class="sv-axis" x1="' + (x0 - 20) + '" y1="' + y0 + '" x2="' + (x1 + 20) + '" y2="' + y0 + '"/>');
    out.push(front.join(''));
    if (cut) out.push('<path class="sv-break" d="M' + (x1 + 4) + ',' + (y0 - R - 6) + ' l6,' + (R * 0.5) + ' l-8,' + (R * 0.5) + ' l8,' + (R * 0.5) + ' l-8,' + (R * 0.5) + ' l6,' + (R * 0.5 + 12) + '"/>');

    function dimV(x, ya, yb, label) {
      return '<line class="sv-dim" x1="' + x + '" y1="' + ya + '" x2="' + x + '" y2="' + yb + '" marker-start="url(#ar)" marker-end="url(#ar)"/>' +
        '<text class="sv-txt" x="' + (x - 6) + '" y="' + ((ya + yb) / 2) + '" text-anchor="end" dominant-baseline="middle">' + label + '</text>';
    }
    function dimH(xa, xb, y, label, below) {
      return '<line class="sv-dim" x1="' + xa + '" y1="' + y + '" x2="' + xb + '" y2="' + y + '" marker-start="url(#ar)" marker-end="url(#ar)"/>' +
        '<text class="sv-txt" x="' + ((xa + xb) / 2) + '" y="' + (y + (below ? 16 : -6)) + '" text-anchor="middle">' + label + '</text>';
    }
    out.push('<line class="sv-ext" x1="' + (x0 - 40) + '" y1="' + (y0 - R) + '" x2="' + x0 + '" y2="' + (y0 - R) + '"/>');
    out.push('<line class="sv-ext" x1="' + (x0 - 40) + '" y1="' + (y0 + R) + '" x2="' + (x0 + t * k / 2) + '" y2="' + (y0 + R) + '"/>');
    out.push(dimV(x0 - 34, y0 - R, y0 + R, 'Ø' + D));
    var xd = x1 + 40;
    out.push('<line class="sv-ext" x1="' + x1 + '" y1="' + (y0 - r) + '" x2="' + (xd + 6) + '" y2="' + (y0 - r) + '"/>');
    out.push('<line class="sv-ext" x1="' + x1 + '" y1="' + (y0 + r) + '" x2="' + (xd + 6) + '" y2="' + (y0 + r) + '"/>');
    out.push('<line class="sv-dim" x1="' + xd + '" y1="' + (y0 - r) + '" x2="' + xd + '" y2="' + (y0 + r) + '" marker-start="url(#ar)" marker-end="url(#ar)"/>');
    out.push('<text class="sv-txt" x="' + (xd + 6) + '" y="' + (y0 - r - 6) + '">Ø' + d + '</text>');
    if (shownMm >= t) {
      var yt = y0 - R - 16;
      out.push('<line class="sv-ext" x1="' + x0 + '" y1="' + (y0 - R) + '" x2="' + x0 + '" y2="' + (yt - 4) + '"/>');
      out.push('<line class="sv-ext" x1="' + (x0 + t * k) + '" y1="' + (y0 - R) + '" x2="' + (x0 + t * k) + '" y2="' + (yt - 4) + '"/>');
      out.push(dimH(x0, x0 + t * k, yt, 'крок ' + t));
    }
    var yl = y0 + R + 28;
    out.push(dimH(x0, x1, yl, 'L = ' + f(lenMm, 0) + ' мм' + (cut ? ' (показано ' + maxTurns + ' з ' + totalTurns + ' витків)' : ', витків ' + totalTurns), true));
    var Hn = Math.ceil(yl + 26);

    return '<svg viewBox="0 0 ' + W + ' ' + Hn + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Шнек збоку з розмірами">' +
      '<defs><marker id="ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" fill="#333"/></marker></defs>' +
      '<style>.sv-tube{fill:#c9ced6;stroke:#555;stroke-width:1}.sv-bore{fill:#fff;stroke:#555;stroke-width:.8}' +
      '.sv-flight{fill:#8fb3d9;fill-opacity:.85;stroke:none}.sv-edge{fill:none;stroke:#1d4f86;stroke-width:1.6}' +
      '.sv-back{fill:none;stroke:#6c8fb5;stroke-width:1;stroke-dasharray:4 3}.sv-axis{stroke:#999;stroke-dasharray:12 3 2 3;stroke-width:.8}' +
      '.sv-dim{stroke:#333;stroke-width:.9}.sv-ext{stroke:#999;stroke-width:.6}.sv-txt{font:13px Arial,sans-serif;fill:#222}' +
      '.sv-break{fill:none;stroke:#333;stroke-width:1.2}</style>' +
      out.join('') + '</svg>';
  }

  window.drawScrew = drawScrew;
})();
