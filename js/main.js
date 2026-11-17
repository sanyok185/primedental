(function () {
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('mobile-menu');
  if (!burger || !menu) return;
  function set(open) {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  }
  burger.addEventListener('click', function () { set(!menu.classList.contains('open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 860) set(false); });
})();

/* ---------- Поява елементів при скролі + лічильники ---------- */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var groups = [
    // [селектор контейнера з дітьми для каскаду, ефект]
    ['.grid-3', null], ['.reasons', null], ['.steps', 'self'], ['.stats-3', null],
    ['.contacts-list', null], ['.trust__row', null], ['.faq__list', null], ['.page-top__text', null],
    ['.service-hero__text', null], ['.hero__text', 'skip'], ['.list', null], ['.aside', null]
  ];
  var singles = [
    '.section-head', '.section .h2.text-center', '.why__img', '.why__body > .btn', '.steps-wrap > .btn',
    '.cta', '.map', '.trust__label', '.service-hero__media', '.about-team > *', '.split > *',
    '.contacts-grid > *', '.crumbs', '.faq > h2', '.page-top__inner > .btn', 'main .section .stack > .text-center',
    'main .section .stack > div[style*="justify-content:center"]', '.review', '.bk-head'
  ];
  var targets = [];
  function add(el, d, kind) {
    if (!el || el.hasAttribute('data-reveal') || el.closest('.hero') ) return;
    el.setAttribute('data-reveal', kind || '');
    if (d) el.style.setProperty('--d', d + 's');
    targets.push(el);
  }
  groups.forEach(function (g) {
    document.querySelectorAll(g[0]).forEach(function (box) {
      if (g[1] === 'skip') return;
      if (g[1] === 'self') { add(box, 0, ''); return; }
      Array.prototype.forEach.call(box.children, function (c, i) { add(c, Math.min(i, 5) * 0.09, ''); });
    });
  });
  singles.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) { add(el, 0, ''); });
  });
  // сходинки першого візиту — каскад
  document.querySelectorAll('.step').forEach(function (el, i) { add(el, 0.15 + i * 0.18, ''); });
  document.querySelectorAll('.faq details').forEach(function (el, i) { add(el, Math.min(i, 5) * 0.07, ''); });
  document.querySelectorAll('.price-row, .included').forEach(function (el, i) { add(el, Math.min(i % 6, 5) * 0.05, ''); });
  document.querySelectorAll('.brand').forEach(function (el, i) { add(el, i * 0.08, 'pop'); });

  function countUp(el) {
    var node = null;
    el.childNodes.forEach(function (n) { if (!node && n.nodeType === 3 && /\d/.test(n.nodeValue)) node = n; });
    if (!node) return;
    var m = node.nodeValue.match(/^(\D*)([\d\s  ]*\d)(.*)$/);
    if (!m) return;
    var sep = (m[2].match(/[\s  ]/) || [''])[0];
    var end = parseInt(m[2].replace(/[\s  ]/g, ''), 10);
    var t0 = null, dur = 1400;
    function fmt(v) {
      var s = String(v);
      return sep ? s.replace(/\B(?=(\d{3})+(?!\d))/g, sep) : s;
    }
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      node.nodeValue = m[1] + fmt(Math.round(end * e)) + m[3];
      if (p < 1) requestAnimationFrame(step);
    }
    node.nodeValue = m[1] + fmt(0) + m[3];
    requestAnimationFrame(step);
  }
  var counters = Array.prototype.slice.call(document.querySelectorAll('.stat__num, .stats-3 b'));

  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  targets.forEach(function (el) { io.observe(el); });

  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      cio.unobserve(en.target);
      // цифри на першому екрані стартують разом з появою блоку статистики
      if (en.target.closest('.stats')) setTimeout(function () { countUp(en.target); }, 150);
      else countUp(en.target);
    });
  }, { threshold: 0.6 });
  counters.forEach(function (el) { cio.observe(el); });
})();
