// Floating Action Button (FAB) menu for NKZ pages
// Reusable component: include <script src="./js/fab_menu.js"></script> and <link rel="stylesheet" href="./fab.css">
// This script injects a floating button and a three-button menu (placeholders).
// Buttons are labeled "1", "2", "3" without attached actions.

(function () {
  // Utility: create element with properties and children
  function el(tag, props, children) {
    var e = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      if (k === 'className') e.className = props[k];
      else if (k === 'text') e.textContent = props[k];
      else e.setAttribute(k, props[k]);
    });
    if (children && children.length) children.forEach(function (c) { e.appendChild(c); });
    return e;
  }

  // Safe query helpers
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  // Placeholder actions intentionally removed

  // Close menu when clicking outside
  function bindOutsideClose(menu, toggleBtn) {
    document.addEventListener('click', function (e) {
      var target = e.target;
      if (!menu || !toggleBtn) return;
      var inside = menu.contains(target) || toggleBtn.contains(target);
      if (!inside) {
        menu.classList.remove('open');
        menu.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // Initialize FAB and menu once DOM is ready
  function initFab() {
    // Avoid duplicate init
    if (qs('#nkz_fab_toggle')) return;

    // Build floating button
    var fabBtn = el('button', {
      id: 'nkz_fab_toggle',
      className: 'fab-btn',
      type: 'button',
      'aria-label': 'Меню'
    }, [el('span', { text: '☰' })]);

    // Build menu container
    var fabMenu = el('div', {
      id: 'nkz_fab_menu',
      className: 'fab-menu',
      'aria-hidden': 'true'
    }, []);

    // Action buttons (placeholders): "1", "2", "3"
    var btn1 = el('button', { className: 'btn btn-sm btn-outline-secondary', type: 'button' }, [el('span', { text: '1' })]);
    var btn2 = el('button', { className: 'btn btn-sm btn-outline-primary', type: 'button' }, [el('span', { text: '2' })]);
    var btn3 = el('button', { className: 'btn btn-sm btn-outline-info', type: 'button' }, [el('span', { text: '3' })]);

    fabMenu.appendChild(btn1);
    fabMenu.appendChild(btn2);
    fabMenu.appendChild(btn3);

    // Attach to document
    document.body.appendChild(fabBtn);
    document.body.appendChild(fabMenu);

    // Toggle menu visibility
    fabBtn.addEventListener('click', function () {
      var open = fabMenu.classList.contains('open');
      fabMenu.classList.toggle('open', !open);
      fabMenu.setAttribute('aria-hidden', open ? 'true' : 'false');
    });

    // No actions bound to buttons 1, 2, 3

    // Bind outside click for closing
    bindOutsideClose(fabMenu, fabBtn);
  }

  // DOM ready hook
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFab);
  } else {
    initFab();
  }
})();
