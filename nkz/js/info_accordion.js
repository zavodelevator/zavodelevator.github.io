document.addEventListener('DOMContentLoaded', function () {
  var infoToggle = document.querySelector('.card-info .info-toggle');
  var infoContent = document.querySelector('.card-info .info-content');
  var imgCard = document.querySelector('.card.mb-3');
  function setArrow(btn, open) {
    var s = btn && btn.querySelector('.arrow');
    if (s) s.textContent = open ? '▴' : '▾';
  }
  if (infoToggle && infoContent) {
    setArrow(infoToggle, false);
    infoToggle.addEventListener('click', function () {
      var open = infoContent.style.display !== 'none';
      var newOpen = !open;
      infoContent.style.display = newOpen ? '' : 'none';
      setArrow(infoToggle, newOpen);
      if (imgCard) {
        if (newOpen) {
          imgCard.classList.add('collapsed');
        } else {
          imgCard.classList.remove('collapsed');
        }
      }
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
