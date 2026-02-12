// Hamburger menu toggle
(function () {
  const btn = document.querySelector('.hamburger-toggle');
  const nav = document.querySelector('.site-nav');
  if (!btn || !nav) return;

  const icon = btn.querySelector('.material-symbols-outlined');

  function open() {
    nav.classList.add('nav-open');
    btn.setAttribute('aria-expanded', 'true');
    if (icon) icon.textContent = 'close';
  }

  function close() {
    nav.classList.remove('nav-open');
    btn.setAttribute('aria-expanded', 'false');
    if (icon) icon.textContent = 'menu';
  }

  btn.addEventListener('click', function () {
    nav.classList.contains('nav-open') ? close() : open();
  });

  // Close on click outside header
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('nav-open') && !e.target.closest('.site-header')) {
      close();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('nav-open')) {
      close();
    }
  });
})();
