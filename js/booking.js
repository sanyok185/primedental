(function () {
  // Куди надсилати заявку. Поки порожньо — форма працює без сервера (демо).
  // Вкажіть адресу вашого бекенду / сервісу форм, наприклад: 'https://formspree.io/f/xxxx'
  var ENDPOINT = '';

  var form = document.getElementById('booking-form');
  var steps = [].slice.call(form.querySelectorAll('.bk-step'));
  var progress = document.getElementById('bk-progress').children;
  var head = form.querySelector('.bk-head');
  var title = document.getElementById('bk-title');
  var titles = ['Запис на прийом', 'Лікар і час', 'Ваші контакти'];
  var DAYS = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  var MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
  var WEEKDAY_FULL = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  var WEEK_TIMES = ['09:00', '09:30', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30'];
  var SAT_TIMES = ['10:00', '11:00', '12:30', '14:00', '15:30'];
  var current = 0;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function val(name) { var c = form.querySelector('[name="' + name + '"]:checked'); return c; }

  // Дати: найближчі 5 робочих днів (без неділі)
  var dates = [];
  var d = new Date(); d.setHours(0, 0, 0, 0);
  var now = new Date();
  if (now.getHours() >= 18) d.setDate(d.getDate() + 1);
  while (dates.length < 5) {
    if (d.getDay() !== 0) dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  var datesBox = document.getElementById('dates');
  var timesBox = document.getElementById('times');
  datesBox.innerHTML = dates.map(function (dt, i) {
    return '<label class="chip"><input type="radio" name="date" value="' + i + '"' + (i === 0 ? ' checked' : '') + '><span>' + DAYS[dt.getDay()] + ' ' + dt.getDate() + '</span></label>';
  }).join('');

  function renderTimes() {
    var idx = +val('date').value;
    var list = dates[idx].getDay() === 6 ? SAT_TIMES : WEEK_TIMES;
    var prev = val('time') && val('time').value;
    timesBox.className = 'chips chips--4';
    timesBox.innerHTML = list.map(function (t) {
      return '<label class="chip"><input type="radio" name="time" value="' + t + '"' + (t === prev ? ' checked' : '') + '><span>' + t + '</span></label>';
    }).join('');
    if (!val('time')) timesBox.querySelector('input').checked = true;
  }
  datesBox.addEventListener('change', renderTimes);
  renderTimes();

  // Передвибір послуги: ?service=treatment
  var qs = new URLSearchParams(location.search).get('service');
  if (qs) {
    var pre = form.querySelector('input[name="service"][value="' + qs.replace(/[^a-z]/g, '') + '"]');
    if (pre) pre.checked = true;
  }

  function show(i) {
    current = i;
    steps.forEach(function (s, k) { s.classList.toggle('active', k === i); });
    var done = i === 3;
    head.hidden = done;
    document.getElementById('bk-progress').hidden = done;
    if (!done) {
      title.textContent = titles[i];
      for (var k = 0; k < progress.length; k++) progress[k].classList.toggle('on', k <= i);
    }
    if (i === 2) fillSummary();
    window.scrollTo({ top: 0 });
    var target = steps[i].querySelector('input:not([type=radio]):not([type=checkbox]), h2, button');
    if (target && i === 3) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  }

  function selection() {
    var dt = dates[+val('date').value];
    return {
      service: val('service').dataset.label,
      doctor: val('doctor').dataset.label,
      date: DAYS[dt.getDay()] + ', ' + dt.getDate() + ' ' + MONTHS[dt.getMonth()],
      time: val('time').value,
      when: dt
    };
  }

  function fillSummary() {
    var s = selection();
    var html = '<div><b>' + s.service + '</b></div><div>' + s.doctor.charAt(0).toUpperCase() + s.doctor.slice(1) + '</div><div>' + s.date + ' · ' + s.time + '</div>';
    [].forEach.call(form.querySelectorAll('[data-summary]'), function (el) {
      el.innerHTML = html + (el.dataset.address ? '<div>' + el.dataset.address + '</div>' : '');
    });
  }

  form.addEventListener('click', function (e) {
    if (e.target.closest('[data-next]')) show(Math.min(current + 1, 2));
    if (e.target.closest('[data-back]')) show(Math.max(current - 1, 0));
  });

  function setError(fieldName, msg) {
    var f = form.querySelector('[data-field="' + fieldName + '"]');
    var err = f.querySelector('.error');
    if (msg) { f.setAttribute('data-invalid', ''); err.textContent = msg; } else { f.removeAttribute('data-invalid'); err.textContent = ''; }
    return !msg;
  }

  function validate() {
    var name = form.elements.name.value.trim();
    var phone = form.elements.phone.value.replace(/[^\d+]/g, '');
    var ok = true;
    ok = setError('name', name.length < 2 ? 'Вкажіть, як до вас звертатися' : '') && ok;
    ok = setError('phone', !/^(\+?38)?0\d{9}$/.test(phone) ? 'Введіть номер у форматі +380XXXXXXXXX' : '') && ok;
    ok = setError('consent', form.elements.consent.checked ? '' : 'Потрібна згода на обробку даних') && ok;
    if (!ok) { var bad = form.querySelector('[data-invalid] input'); if (bad) bad.focus(); }
    return ok;
  }
  ['name', 'phone'].forEach(function (n) {
    form.elements[n].addEventListener('input', function () { setError(n, ''); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    var s = selection();
    var payload = {
      service: s.service, doctor: s.doctor, date: s.date, time: s.time,
      name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(),
      comment: form.elements.comment.value.trim()
    };
    if (ENDPOINT) {
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) }).catch(function () {});
    } else if (window.console) {
      console.info('Заявка (демо, сервер не підключено):', payload);
    }
    fillSummary();
    show(3);
  });

  // .ics для календаря
  document.getElementById('add-calendar').addEventListener('click', function () {
    var s = selection(), p = s.time.split(':');
    var st = new Date(s.when); st.setHours(+p[0], +p[1], 0, 0);
    var en = new Date(st.getTime() + 60 * 60000);
    function f(x) { return x.getFullYear() + pad(x.getMonth() + 1) + pad(x.getDate()) + 'T' + pad(x.getHours()) + pad(x.getMinutes()) + '00'; }
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Prime Dental//UA', 'BEGIN:VEVENT',
      'UID:' + st.getTime() + '@primedental', 'DTSTAMP:' + f(new Date()) , 'DTSTART:' + f(st), 'DTEND:' + f(en),
      'SUMMARY:Prime Dental — ' + s.service, 'LOCATION:м. Рівне\\, вул. Соборна\\, 112', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'prime-dental.ics';
    document.body.appendChild(a); a.click(); a.remove();
  });

  show(0);
})();
