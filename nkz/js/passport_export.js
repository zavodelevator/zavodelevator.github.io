(function () {
  function val(id) {
    var el = document.getElementById(id);
    return el ? (el.value || '') : '';
  }
  function selText(id) {
    var el = document.getElementById(id);
    if (!el) return '';
    var i = el.selectedIndex;
    var opt = i >= 0 ? el.options[i] : null;
    return opt ? (opt.text || '') : '';
  }
  function checked(id) {
    var el = document.getElementById(id);
    return el ? !!el.checked : false;
  }
  function collect() {
    return {
      typeText: selText('nkz_type'),
      typeValue: val('nkz_type'),
      workHeight: val('nkz_l'),
      chain: checked('lan_check'),
      convItem: selText('conv_item'),
      driveSaler: selText('drive_saler'),
      driveType: selText('drive_type'),
      driveItem: selText('drive_item')
    };    
  }

  function buildHtml(d) {
    var model = d.typeText || ('НКЗ-' + (d.typeValue || ''));
    var chainText = d.chain ? 'ланцюгова' : 'стрічкова';
    var mr = [d.driveSaler, d.driveType, d.driveItem].filter(Boolean).join(' / ');
    var conv = d.convItem || '';
    var title = 'Паспорт ' + model + ' – Норія';
    var h = '';

    // h += '<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>' + title + '</title>';
    // h += '<script src="https://cdn.tailwindcss.com"></script>';
    // h += '<style>body{font-family:Inter,system-ui,-apple-system,sans-serif;font-display:swap}@media print{.break-after-page{page-break-after:always}}</style>';
    // h += '</head><body class="bg-white text-gray-900 leading-relaxed">';
    // h += '<header class="border-b border-gray-300 p-6"><div class="max-w-5xl mx-auto">';
    // h += '<h1 class="text-2xl font-bold uppercase">НОРІЯ ' + model + '</h1>';
    // h += '<p class="text-lg mt-2">Інструкція з експлуатації, паспорт</p>';
    // h += '<p class="mt-4 text-sm">ТОВ «Хорошівський завод елеваторної техніки та технологій»<br>ТОВ «ХЗЕТТ»<br>смт. Хорошів</p>';
    // h += '</div></header>';
    // h += '<main class="max-w-5xl mx-auto p-6" role="main">';
    // h += '<section class="break-after-page"><h2 class="text-xl font-bold mb-4">ЗМІСТ</h2><nav><ul class="space-y-2 list-decimal list-inside">';
    // h += '<li>Вступ</li><li>Призначення та використання</li><li>Технічні параметри</li><li>Склад виробу</li><li>Пристрій та принцип роботи</li><li>Маркування</li><li>Заходи безпеки</li><li>Технічне обслуговування</li><li>Транспортування</li><li>Гарантія виробника</li><li>Утилізація</li><li>Свідчення про приймання</li><li>Зберігання</li><li>Ремонт</li>';
    // h += '</ul></nav></section>';
    // h += '<section class="break-after-page"><h2 class="text-xl font-bold mb-4">1. ВСТУП</h2>';
    // h += '<p class="mb-4">Даний документ є паспортом виробу.</p>';
    // h += '</section>';
    // h += '<section class="break-after-page"><h2 class="text-xl font-bold mb-4">3. ТЕХНІЧНІ ПАРАМЕТРИ</h2>';
    // h += '<div class="overflow-x-auto"><table class="min-w-full border border-gray-300 text-sm"><thead class="bg-gray-100"><tr><th class="border p-2 text-left">Параметр</th><th class="border p-2 text-left">Показник</th></tr></thead><tbody>';
    // h += '<tr><td class="border p-2">Модель</td><td class="border p-2">' + model + '</td></tr>';
    // h += '<tr><td class="border p-2">Тип</td><td class="border p-2">' + chainText + '</td></tr>';
    // h += '<tr><td class="border p-2">Робоча висота</td><td class="border p-2">' + (d.workHeight || '') + ' м</td></tr>';
    // h += '<tr><td class="border p-2">Стрічка/Ланцюг</td><td class="border p-2">' + conv + '</td></tr>';
    // h += '<tr><td class="border p-2">Мотор-редуктор</td><td class="border p-2">' + mr + '</td></tr>';
    // h += '</tbody></table></div></section>';
    // h += '<section class="break-after-page"><h2 class="text-xl font-bold mb-4">9. ГАРАНТІЯ ВИРОБНИКА</h2>';
    // h += '<p class="mb-4">Гарантійний термін експлуатації – 12 місяців з дня введення в експлуатацію.</p>';
    // h += '<div class="grid md:grid-cols-2 gap-4 text-sm"><div>';
    // h += '<p><strong>Модель:</strong> ' + model + '</p>';
    // h += '<p><strong>Дата виготовлення:</strong> ' + new Date().toLocaleDateString('uk-UA') + '</p>';
    // h += '</div><div>';
    // h += '<p><strong>Виробник:</strong> ТОВ «ХЗЕТТ»</p>';
    // h += '<p>Житомирська обл., смт. Хорошів, вул. Східна, 20</p>';
    // h += '</div></div></section>';
    // h += '</main>';
    // h += '<footer class="border-t border-gray-300 mt-8 p-6 text-center text-sm text-gray-600">© ТОВ «ХЗЕТТ». Всі права захищені.</footer>';
    // h += '</body></html>';

    return h;
  }

  function buildPdfLines(d) {
    var lines = [];
    var model = d.typeText || ('НКЗ-' + (d.typeValue || ''));
    lines.push('Паспорт ' + model);
    lines.push('Тип: ' + (d.chain ? 'ланцюгова' : 'стрічкова'));
    lines.push('Робоча висота: ' + (d.workHeight || '') + ' м');
    lines.push('Стрічка/Ланцюг: ' + (d.convItem || ''));
    var mr = [d.driveSaler, d.driveType, d.driveItem].filter(Boolean).join(' / ');
    lines.push('Мотор-редуктор: ' + mr);
    return lines;
  }
  function buildPdf(lines) {
    var content = [];
    content.push('BT');
    content.push('/F1 12 Tf');
    content.push('16 TL');
    content.push('1 0 0 1 50 800 Tm');
    lines.forEach(function (ln, idx) {
      var safe = ln.replace(/[\(\)\r\n]/g, '');
      if (idx === 0) {
        content.push('(' + safe + ') Tj');
      } else {
        content.push('T*');
        content.push('(' + safe + ') Tj');
      }
    });
    content.push('ET');
    var stream = content.join('\n') + '\n';
    var objs = [];
    var o1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    var o2 = '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n';
    var o3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n';
    var o4 = '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
    var o5 = '5 0 obj\n<< /Length ' + stream.length + ' >>\nstream\n' + stream + 'endstream\nendobj\n';
    objs.push(o1, o2, o3, o4, o5);
    var pdf = '%PDF-1.4\n';
    var offsets = [0];
    var pos = pdf.length;
    for (var i = 0; i < objs.length; i++) {
      offsets.push(pos);
      pdf += objs[i];
      pos = pdf.length;
    }
    var xrefPos = pdf.length;
    pdf += 'xref\n0 6\n';
    pdf += '0000000000 65535 f \n';
    for (var j = 1; j <= 5; j++) {
      var off = offsets[j];
      var s = String(off);
      while (s.length < 10) s = '0' + s;
      pdf += s + ' 00000 n \n';
    }
    pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF';
    return pdf;
  }
  function buildPdfFull(d) {
    var lines = [];
    var model = d.typeText || ('НКЗ-' + (d.typeValue || ''));
    lines.push('Паспорт ' + model + ' – Норія');
    lines.push('--------------------------');
    lines.push('ЗМІСТ: Вступ; Призначення; Технічні параметри; Безпека; Гарантія');
    lines.push('ТЕХНІЧНІ ПАРАМЕТРИ');
    lines.push('Модель: ' + model);
    lines.push('Тип: ' + (d.chain ? 'ланцюгова' : 'стрічкова'));
    lines.push('Робоча висота: ' + (d.workHeight || '') + ' м');
    lines.push('Стрічка/Ланцюг: ' + (d.convItem || ''));
    var mr = [d.driveSaler, d.driveType, d.driveItem].filter(Boolean).join(' / ');
    lines.push('Мотор-редуктор: ' + mr);
    lines.push('БЕЗПЕКА: заземлення; монтаж при знеструмленні; ознайомлення з інструкцією');
    lines.push('ГАРАНТІЯ: 12 міс. з введення в експлуатацію');
    return buildPdf(lines);
  }
  function download(name, mime, dataStr) {
    var blob = new Blob([dataStr], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function exportAll() {
    var d = collect();
    var pdfSummary = buildPdf(buildPdfLines(d));
    var pdfFull = buildPdfFull(d);
    download('паспорт_nkz_summary.pdf', 'application/pdf', pdfSummary);
    download('паспорт_nkz_full.pdf', 'application/pdf', pdfFull);
  }
  window.exportNkzPassport = exportAll;
})();

// Експорт розпису цін норії у текстовий файл
window.exportNkzPriceTxt = function () {
  var p = (typeof nkz_prices === 'object' && nkz_prices) ? nkz_prices : {};
  var fmt = (typeof __fmtUA === 'function') ? __fmtUA : function (v) { return Number(v || 0).toFixed(2); };

  function selText(id) {
    var el = document.getElementById(id);
    if (!el) return '';
    var i = el.selectedIndex;
    var opt = i >= 0 ? el.options[i] : null;
    return opt ? (opt.text || '') : '';
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? (el.value || '') : '';
  }
  function checked(id) {
    var el = document.getElementById(id);
    return el ? !!el.checked : false;
  }

  var model = selText('nkz_type') || ('НКЗ-' + val('nkz_type'));
  var workH = val('nkz_l');
  var chainType = checked('lan_check') ? 'ланцюгова' : 'стрічкова';

  var lines = [];
  lines.push('РОЗПИС ВАРТОСТІ НОРІЇ');
  lines.push('=============================================');
  lines.push('Модель: ' + model);
  lines.push('Тип: ' + chainType);
  lines.push('Робоча висота: ' + workH + ' м');
  lines.push('Дата: ' + new Date().toLocaleDateString('uk-UA'));
  lines.push('');
  lines.push('СКЛАДОВІ ВАРТОСТІ:');
  lines.push('---------------------------------------------');

  var conv = p.conv || {};
  lines.push('Стрічка / Ланцюг: ' + (conv.name || '—'));
  lines.push('  Довжина: ' + (conv.length_m || 0) + ' м');
  lines.push('  Вартість: ' + fmt(conv.price || 0) + ' грн');
  lines.push('');

  var bk = p.buckets || {};
  lines.push('Ківші: ' + (bk.name || '—'));
  lines.push('  Кількість: ' + (bk.count || 0) + ' шт');
  lines.push('  Ціна за шт: ' + fmt(bk.unit_price || 0) + ' грн');
  lines.push('  Вартість: ' + fmt(bk.total_price || 0) + ' грн');
  lines.push('');

  var ft = p.fasteners || {};
  var bolt = ft.bolt || {};
  var nut = ft.nut || {};
  var washer = ft.washer || {};
  lines.push('Метизи:');
  lines.push('  Болти: ' + (bolt.count || 0) + ' шт, ' + Number(bolt.weight_kg || 0).toFixed(2) + ' кг  →  ' + fmt(bolt.price || 0) + ' грн');
  lines.push('  Гайки: ' + (nut.count || 0) + ' шт, ' + Number(nut.weight_kg || 0).toFixed(2) + ' кг  →  ' + fmt(nut.price || 0) + ' грн');
  lines.push('  Шайби норійні: ' + (washer.count || 0) + ' шт, ' + Number(washer.weight_kg || 0).toFixed(2) + ' кг  →  ' + fmt(washer.price || 0) + ' грн');
  lines.push('');

  var sh = p.shafts || {};
  var rev = sh.revision || {};
  var mtr = sh.meter || {};
  var two = sh.twometer || {};
  var bsh = sh.bashmak || {};
  var hd  = sh.head || {};
  lines.push('Секції шахти:');
  lines.push('  Ревізійна (' + (rev.count || 0) + ' шт): ' + Number(rev.weight_kg || 0).toFixed(2) + ' кг  →  ' + fmt(rev.price || 0) + ' грн');
  lines.push('  Метрові (' + (mtr.count || 0) + ' шт): ' + Number(mtr.weight_kg || 0).toFixed(2) + ' кг  →  ' + fmt(mtr.price || 0) + ' грн');
  lines.push('  Двохметрові (' + (two.count || 0) + ' шт): ' + Number(two.weight_kg || 0).toFixed(2) + ' кг  →  ' + fmt(two.price || 0) + ' грн');
  lines.push('');
  lines.push('Башмак в зборі: ' + Number(bsh.weight_kg || 0).toFixed(2) + ' кг  →  ' + fmt(bsh.price || 0) + ' грн');
  lines.push('Голова привідна в зборі: ' + Number(hd.weight_kg || 0).toFixed(2) + ' кг  →  ' + fmt(hd.price || 0) + ' грн');
  lines.push('');

  var drv = p.drive || {};
  lines.push('Мотор-редуктор: ' + (drv.name || '—'));
  lines.push('  Вартість: ' + fmt(drv.price || 0) + ' грн');
  lines.push('');
  lines.push('=============================================');
  lines.push('РАЗОМ: ' + fmt(p.total_price || 0) + ' грн');
  lines.push('=============================================');

  var text = lines.join('\r\n');
  var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'ціни_' + model.replace(/\s+/g, '_') + '_' + (workH || '0') + 'м.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
};

// Render summary to canvas (avoids font encoding issues by rasterizing)
function renderCanvasSummary(d) {
  var cw = 1200, ch = 1700;
  var c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = '#111111';
  ctx.font = '48px Inter, Arial, sans-serif';
  var model = d.typeText || ('НКЗ-' + (d.typeValue || ''));
  var y = 120;
  ctx.fillText('Паспорт ' + model + ' – Норія', 60, y); y += 60;
  ctx.font = '36px Inter, Arial, sans-serif';
  y += 20; ctx.fillText('Тип: ' + (d.chain ? 'ланцюгова' : 'стрічкова'), 60, y); y += 50;
  ctx.fillText('Робоча висота: ' + (d.workHeight || '') + ' м', 60, y); y += 50;
  ctx.fillText('Стрічка/Ланцюг: ' + (d.convItem || ''), 60, y); y += 50;
  var mr = [d.driveSaler, d.driveType, d.driveItem].filter(Boolean).join(' / ');
  ctx.fillText('Мотор-редуктор: ' + mr, 60, y);
  return c;
}

// Render full to canvas with more sections
function renderCanvasFull(d) {
  var cw = 1200, ch = 2000;
  var c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = '#111111';
  ctx.font = '48px Inter, Arial, sans-serif';
  var model = d.typeText || ('НКЗ-' + (d.typeValue || ''));
  var y = 120;
  ctx.fillText('Паспорт ' + model + ' – Норія', 60, y); y += 70;
  ctx.font = '38px Inter, Arial, sans-serif';
  y += 10; ctx.fillText('ЗМІСТ', 60, y); y += 40;
  ctx.font = '30px Inter, Arial, sans-serif';
  var items = ['Вступ', 'Призначення та використання', 'Технічні параметри', 'Безпека', 'Гарантія'];
  items.forEach(function (t) { ctx.fillText('• ' + t, 80, y); y += 34; });
  y += 24;
  ctx.font = '36px Inter, Arial, sans-serif'; ctx.fillText('ТЕХНІЧНІ ПАРАМЕТРИ', 60, y); y += 50;
  ctx.font = '30px Inter, Arial, sans-serif';
  var mr = [d.driveSaler, d.driveType, d.driveItem].filter(Boolean).join(' / ');
  var rows = [
    ['Модель', model],
    ['Тип', (d.chain ? 'ланцюгова' : 'стрічкова')],
    ['Робоча висота', (d.workHeight || '') + ' м'],
    ['Стрічка/Ланцюг', d.convItem || ''],
    ['Мотор-редуктор', mr]
  ];
  rows.forEach(function (r) { ctx.fillText(r[0] + ': ' + r[1], 80, y); y += 34; });
  y += 24;
  ctx.font = '36px Inter, Arial, sans-serif'; ctx.fillText('БЕЗПЕКА', 60, y); y += 50;
  ctx.font = '30px Inter, Arial, sans-serif';
  ['Заземлення', 'Монтаж при знеструмленні', 'Ознайомлення з інструкцією'].forEach(function (t) { ctx.fillText('• ' + t, 80, y); y += 34; });
  y += 24;
  ctx.font = '36px Inter, Arial, sans-serif'; ctx.fillText('ГАРАНТІЯ', 60, y); y += 50;
  ctx.font = '30px Inter, Arial, sans-serif'; ctx.fillText('12 міс. з введення в експлуатацію', 80, y);
  return c;
}

function canvasToJpeg(canvas) {
  return canvas.toDataURL('image/jpeg', 0.92);
}

function linesToJpeg(lines) {
  var c = document.createElement('canvas');
  c.width = 1200; c.height = 1700;
  var ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,c.width,c.height);
  ctx.fillStyle = '#111111'; ctx.font = '36px Inter, Arial, sans-serif';
  var y = 100;
  lines.forEach(function (ln) { ctx.fillText(ln, 60, y); y += 42; });
  return canvasToJpeg(c);
}

function buildPdfFromJpegData(dataUrl) {
  var parts = dataUrl.split(',');
  var b64 = parts[1] || '';
  var binStr = atob(b64);
  var len = binStr.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
  // Assume A4 page: 595x842 points. Fit image to page fully.
  var imgWidthPx = 1200, imgHeightPx = 1700; // matches our canvas defaults
  // PDF objects
  var header = '%PDF-1.4\n';
  var obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  var obj2 = '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n';
  var obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n';
  var imgDict = '4 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + imgWidthPx + ' /Height ' + imgHeightPx + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + bytes.length + ' >>\nstream\n';
  var imgEnd = '\nendstream\nendobj\n';
  var content = '5 0 obj\n<< /Length 53 >>\nstream\nq\n595 0 0 842 0 0 cm\n/Im0 Do\nQ\nendstream\nendobj\n';
  // Build full PDF binary using Uint8Array
  function concatStr(arr) {
    return arr.join('');
  }
  var pre = concatStr([header, obj1, obj2, obj3, imgDict]);
  // Convert pre to bytes
  function strToBytes(s) {
    var out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  var chunks = [];
  chunks.push(strToBytes(pre));
  chunks.push(bytes);
  chunks.push(strToBytes(imgEnd + content));
  // Compute xref
  var totalLen = 0;
  function lenOf(u8) { return u8.length; }
  var offsets = [0];
  for (var ci = 0; ci < chunks.length; ci++) {
    offsets.push(totalLen);
    totalLen += lenOf(chunks[ci]);
  }
  var xrefStart = totalLen;
  var xrefStr = 'xref\n0 6\n0000000000 65535 f \n';
  function pad10(n) {
    var s = String(n);
    while (s.length < 10) s = '0' + s;
    return s;
  }
  // Objects: 1,2,3,4,5
  var offset1 = 0 + header.length;
  var offset2 = offset1 + obj1.length;
  var offset3 = offset2 + obj2.length;
  var offset4 = offset3 + obj3.length;
  var offset5 = offset4 + imgDict.length + bytes.length + imgEnd.length;
  xrefStr += pad10(offset1) + ' 00000 n \n';
  xrefStr += pad10(offset2) + ' 00000 n \n';
  xrefStr += pad10(offset3) + ' 00000 n \n';
  xrefStr += pad10(offset4) + ' 00000 n \n';
  xrefStr += pad10(offset5) + ' 00000 n \n';
  var trailer = 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefStart + '\n%%EOF';
  chunks.push(strToBytes(xrefStr + trailer));
  // Combine
  var finalLen = 0; chunks.forEach(function (b) { finalLen += b.length; });
  var out = new Uint8Array(finalLen);
  var pos = 0;
  chunks.forEach(function (b) { out.set(b, pos); pos += b.length; });
  // Return binary as a Blob-convertible string via uint8 array
  return out;
}
