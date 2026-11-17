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

/* Липка шапка: тінь після скролу */
(function () {
  var header = document.querySelector('.header');
  if (!header) return;
  var ticking = false;
  function update() { header.classList.toggle('is-scrolled', window.scrollY > 8); ticking = false; }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();

/* Поява блоків при скролі та лічильники цифр */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('js-anim')) return;

  // Блоки, що плавно з'являються (вкладені один в одного тут не перетинаються)
  var REVEAL = [
    '.section-head', '.stack.text-center', '.grid-3 > *', '.why__img', '.why__body > :not(.reasons)', '.reason',
    '.steps-wrap > .h2', '.step', '.steps-wrap > .btn', '.stack--40 > .map', '.stack--40 > .btn', '.cta',
    '.faq > .h2', '.faq__list > details', '.aside', '.included', '.price-row', '.stats-3 > *',
    '.about-team > *', '.contacts-list > *', '.map--tall', '.note', '.stack--40 > div:not([class])',
    '.footer__cols > *', '.footer__bottom'
  ].join(',');
  // Блоки, яким лише ставимо is-in (лінія кроків, піни, лічильники)
  var TRIGGER = '.steps, .map, .stats, .stats-3';

  var items = Array.prototype.slice.call(document.querySelectorAll(REVEAL));
  items.forEach(function (el) {
    el.setAttribute('data-reveal', '');
    // невелика затримка для сусідів, щоб картки виїжджали по черзі
    var sibs = Array.prototype.filter.call(el.parentNode.children, function (s) { return s.matches(REVEAL); });
    var i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', Math.min(i * 0.1, 0.5) + 's');
  });
  var triggers = Array.prototype.slice.call(document.querySelectorAll(TRIGGER));

  function show(el) {
    el.classList.add('is-in');
    if (el.matches('.stats, .stats-3')) countUp(el);
  }

  if (!('IntersectionObserver' in window)) {
    items.concat(triggers).forEach(show);
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });
  var all = items.concat(triggers);
  all.forEach(function (el) { io.observe(el); });

  // Внизу сторінки показуємо все, що лишилось (наприклад, низ футера)
  function revealRest() {
    if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 4) return;
    all.forEach(function (el) { if (!el.classList.contains('is-in')) { show(el); io.unobserve(el); } });
    window.removeEventListener('scroll', revealRest);
  }
  window.addEventListener('scroll', revealRest, { passive: true });

  // Лічильник: «4 800+» рахує від 0 до 4800, решта тексту лишається як є
  function countUp(box) {
    var nums = box.querySelectorAll('.stat__num, b');
    Array.prototype.forEach.call(nums, function (el) {
      var node = el.firstChild;
      if (!node || node.nodeType !== 3) return;
      var m = node.nodeValue.match(/^(\d+(?:[\s ]\d{3})*)(.*)$/);
      if (!m) return;
      var original = node.nodeValue;
      var sep = (m[1].match(/[\s ]/) || [' '])[0];
      var target = parseInt(m[1].replace(/[\s ]/g, ''), 10);
      var tail = m[2];
      var start = null, dur = 1600;
      function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep); }
      function frame(t) {
        if (start === null) start = t;
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        node.nodeValue = p < 1 ? fmt(Math.round(target * eased)) + tail : original;
        if (p < 1) requestAnimationFrame(frame);
      }
      node.nodeValue = '0' + tail;
      setTimeout(function () { requestAnimationFrame(frame); }, 300);
    });
  }
})();
