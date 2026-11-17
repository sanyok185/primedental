(function () {
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('mobile-menu');
  if (!burger || !menu) return;
  // затемнення сторінки під меню; клік по ньому закриває меню
  var backdrop = document.createElement('div');
  backdrop.className = 'menu-backdrop';
  document.body.appendChild(backdrop);
  backdrop.addEventListener('click', function () { set(false); });
  function set(open) {
    menu.classList.toggle('open', open);
    backdrop.classList.toggle('on', open);
    document.body.classList.toggle('menu-open', open);
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
    '.cta', '.map', '.trust__label', '.service-hero__media', '.split > *',
    '.contacts-grid > *', '.crumbs', '.faq > h2', '.page-top__inner > .btn', 'main .section .stack > .text-center',
    'main .section .stack > div[style*="justify-content:center"]', '.slider', '.bk-head'
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
  // лічильник лише на «Про клініку»; на головній цифри статичні
  var counters = Array.prototype.slice.call(document.querySelectorAll('.stats-3 b'));

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
      countUp(en.target);
    });
  }, { threshold: 0.6 });
  counters.forEach(function (el) { cio.observe(el); });
})();

/* ---------- Слайдер відгуків ---------- */
(function () {
  document.querySelectorAll('[data-slider]').forEach(function (root) {
    var track = root.querySelector('.slider__track');
    var slides = Array.prototype.slice.call(track.children);
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    var dotsBox = root.querySelector('.slider__dots');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dots = [], timer = null;

    function step() { return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth; }
    function perView() { return Math.max(1, Math.round(track.clientWidth / step())); }
    function pages() { return Math.max(1, slides.length - perView() + 1); }
    function index() { return Math.round(track.scrollLeft / step()); }
    function go(i) {
      var n = pages();
      i = (i + n) % n;
      track.scrollTo({ left: i * step(), behavior: reduce ? 'auto' : 'smooth' });
    }
    function buildDots() {
      dotsBox.innerHTML = ''; dots = [];
      for (var i = 0; i < pages(); i++) {
        var b = document.createElement('button');
        b.type = 'button'; b.tabIndex = -1;
        b.addEventListener('click', go.bind(null, i));
        dotsBox.appendChild(b); dots.push(b);
      }
      update();
    }
    function update() {
      var i = Math.min(index(), pages() - 1);
      dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
      prev.disabled = i <= 0;
      next.disabled = i >= pages() - 1;
    }
    prev.addEventListener('click', function () { go(index() - 1); restart(); });
    next.addEventListener('click', function () { go(index() + 1); restart(); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index() - 1); }
    });
    window.addEventListener('resize', buildDots);

    // Автогортання раз на 6 с; пауза, коли курсор чи фокус на слайдері
    function start() { if (!reduce && !timer) timer = setInterval(function () { go(index() + 1); }, 6000); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    track.addEventListener('touchstart', stop, { passive: true });

    buildDots();
    start();
  });
})();

/* ---------- Закріплена кнопка запису (мобільні): з'являється після ~800px скролу ---------- */
(function () {
  var bar = document.querySelector('.sticky-cta');
  if (!bar) return;
  var ticking = false;
  function update() { bar.classList.toggle('is-shown', window.scrollY > 800); ticking = false; }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();

/* ---------- Часті питання: плавне розкриття й закриття ---------- */
(function () {
  var list = Array.prototype.slice.call(document.querySelectorAll('.faq details'));
  if (!list.length || !('animate' in document.body)) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function toggle(d, open) {
    if (d._anim) { d._anim.cancel(); d._anim = null; }
    d._target = open;
    if (reduce) { d.open = open; return; }
    var start = d.offsetHeight;
    d.open = open;                 // кінцева висота
    var end = d.offsetHeight;
    d.open = true;                 // поки йде анімація, вміст видно
    d.style.overflow = 'hidden';
    var a = d.animate({ height: [start + 'px', end + 'px'] }, { duration: 450, easing: 'cubic-bezier(.2, .7, .2, 1)' });
    d._anim = a;
    a.onfinish = function () { d.open = open; d.style.overflow = ''; d._anim = null; };
  }

  list.forEach(function (d) {
    // «одне відкрите питання» обробляємо самі, щоб інші теж закривалися плавно
    d.dataset.group = d.getAttribute('name') || '';
    d.removeAttribute('name');
    d._target = d.open;
    d.querySelector('summary').addEventListener('click', function (e) {
      e.preventDefault();
      var open = !d._target;
      if (open && d.dataset.group) {
        list.forEach(function (o) {
          if (o !== d && o.dataset.group === d.dataset.group && o._target) toggle(o, false);
        });
      }
      toggle(d, open);
    });
  });
})();
