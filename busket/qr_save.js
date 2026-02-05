function qrSave(text) {
  var t = (typeof text === 'string' && text.trim()) ? text.trim() : 'Привіт світ';
  var url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(t);
  return fetch(url)
    .then(function(res){ return res.blob(); })
    .then(function(blob){
      var objUrl = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = objUrl;
      a.download = 'qr.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    });
}
