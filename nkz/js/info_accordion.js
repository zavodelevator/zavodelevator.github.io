document.addEventListener('DOMContentLoaded', function () {
  var infoToggle = document.querySelector('.card-info .info-toggle');
  var infoContent = document.querySelector('.card-info .info-content');
  function setArrow(btn, open) {
    var s = btn && btn.querySelector('.arrow');
    if (s) s.textContent = open ? '▴' : '▾';
  }
  if (infoToggle && infoContent) {
    setArrow(infoToggle, false);
    infoToggle.addEventListener('click', function () {
      var open = infoContent.style.display !== 'none';
      infoContent.style.display = open ? 'none' : '';
      setArrow(infoToggle, !open);
    });
  }
  var subs = document.querySelectorAll('.card-info .sub-toggle');
  Array.prototype.forEach.call(subs, function (btn) {
    var id = btn.getAttribute('data-target');
    var content = id ? document.getElementById(id) : null;
    if (!content) return;
    setArrow(btn, false);
    btn.addEventListener('click', function () {
      var open = content.style.display !== 'none';
      content.style.display = open ? 'none' : '';
      setArrow(btn, !open);
    });
  });
});
