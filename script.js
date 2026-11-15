/* =========================================================
   1. НАВИГАЦИЯ: фон при скролле + мобильное меню
   ========================================================= */
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

const onScroll = () => {
  // Порог, после которого показываем навигацию
  const isScrolled = window.scrollY > 80;

  nav.classList.toggle('scrolled', isScrolled);
  nav.classList.toggle('nav--visible', isScrolled);
};

window.addEventListener('scroll', onScroll, { passive: true });
onScroll(); // проверяем сразу при загрузке

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  navToggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.textContent = '☰';
  });
});

/* =========================================================
   2. ОБРАТНЫЙ ОТСЧЁТ
   ========================================================= */
// ⚠️ Измените дату свадьбы здесь
const weddingDate = new Date('2027-07-07T12:15:00').getTime();

const cdNodes = {
  days:    document.querySelector('[data-cd="days"]'),
  hours:   document.querySelector('[data-cd="hours"]'),
  minutes: document.querySelector('[data-cd="minutes"]'),
  seconds: document.querySelector('[data-cd="seconds"]')
};
const pad = n => String(n).padStart(2, '0');

/* Хелпер: обновляет число и запускает анимацию «тика» */
function setNum(node, value){
  if (!node) return;
  if (node.textContent === value) return;   // значение не изменилось — ничего не делаем
  node.textContent = value;

  // Перезапускаем анимацию (нужен рефлоу, иначе класс не «сбросится»)
  node.classList.remove('is-ticking');
  void node.offsetWidth;
  node.classList.add('is-ticking');
}

function updateCountdown() {
  const diff = weddingDate - Date.now();

  if (diff <= 0) {
    setNum(cdNodes.days, '00');
    setNum(cdNodes.hours, '00');
    setNum(cdNodes.minutes, '00');
    setNum(cdNodes.seconds, '00');
    return;
  }

  const t = Math.floor(diff / 1000);
  setNum(cdNodes.days,    pad(Math.floor(t / 86400)));
  setNum(cdNodes.hours,   pad(Math.floor(t % 86400 / 3600)));
  setNum(cdNodes.minutes, pad(Math.floor(t % 3600 / 60)));
  setNum(cdNodes.seconds, pad(t % 60));
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* =========================================================
   3. ПОЯВЛЕНИЕ ПРИ СКРОЛЛЕ
   ========================================================= */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

/* =========================================================
   4. АНКЕТА: условные поля + отправка в Google Sheets
   ========================================================= */
const rsvpForm = document.getElementById('rsvpForm');
const companionField = document.getElementById('companionField');
const childrenField = document.getElementById('childrenField');

if (rsvpForm) {
  // Показать/скрыть поле «Имя спутника» — теперь от вопроса with_pair
  rsvpForm.querySelectorAll('input[name="with_pair"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const withPair = rsvpForm.querySelector('input[name="with_pair"]:checked')?.value === 'Да';
      companionField.classList.toggle('is-hidden', !withPair);
      if (!withPair) companionField.querySelector('input').value = '';
    });
  });

  // Показать/скрыть поле «Сколько лет детям»
  rsvpForm.querySelectorAll('input[name="children"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const hasKids = rsvpForm.querySelector('input[name="children"]:checked')?.value === 'Да';
      childrenField.classList.toggle('is-hidden', !hasKids);
      if (!hasKids) childrenField.querySelector('input').value = '';
    });
  });

  // ⚠️ Вставьте URL вашего веб-приложения Google Apps Script (заканчивается на /exec)
  const scriptURL = 'https://script.google.com/macros/s/AKfycbyGysXIAd1ci3RkpKprLTYP_X4hCLt7mwALarcqHkEkwtoJgIGFKek5VtVNZ1fIT-of/exec';

  rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = rsvpForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Отправляем...';
    btn.disabled = true;

    const data = new URLSearchParams(new FormData(rsvpForm));

    try {
      await fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: data
      });

      rsvpForm.hidden = true;
      document.getElementById('rsvpThanks').hidden = false;
    } catch (error) {
      console.error('Ошибка отправки:', error);
      alert('Не получилось отправить анкету. Проверьте интернет и попробуйте ещё раз.');
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
}

/* =========================================================
   5. ФОНОВАЯ МУЗЫКА (автозапуск)
   ========================================================= */
const bgMusic  = document.getElementById('bgMusic');
const musicBtn = document.getElementById('musicBtn');

if (bgMusic && musicBtn) {
  const TARGET_VOLUME = 0.25;
  bgMusic.volume = TARGET_VOLUME;

  const setPlayingUI = (playing) => {
    musicBtn.classList.toggle('is-playing', playing);
    musicBtn.title = playing ? 'Выключить музыку' : 'Включить музыку';
    musicBtn.setAttribute('aria-label', playing ? 'Выключить музыку' : 'Включить музыку');
  };

  const fadeIn = (duration = 2000) => {
    bgMusic.volume = 0;
    const step = TARGET_VOLUME / (duration / 50);
    const timer = setInterval(() => {
      bgMusic.volume = Math.min(bgMusic.volume + step, TARGET_VOLUME);
      if (bgMusic.volume >= TARGET_VOLUME) clearInterval(timer);
    }, 50);
  };

  let started = false;

  const tryPlay = () => {
    if (started || !bgMusic.paused) return;
    const p = bgMusic.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        started = true;
        setPlayingUI(true);
        fadeIn();
        removeAutoStart();
      }).catch(() => { /* заблокировано — ждём следующего жеста */ });
    }
  };

  /*
   * ⚠️ ВАЖНО: браузеры разрешают звук ТОЛЬКО после user gesture.
   *
   * НЕ включают музыку (это норма, не баг):
   *   scroll, wheel, mousemove, touchmove, touchstart на iOS
   *
   * Включают музыку:
   *   click, pointerdown/up (мышь), mousedown/up, touchend, keydown
   */
  const autoEvents = [
    'click',
    'pointerdown', 'pointerup',
    'mousedown', 'mouseup',
    'touchend',
    'keydown'
  ];

  const bindAutoStart = () => {
    autoEvents.forEach(evt =>
      window.addEventListener(evt, tryPlay, { passive: true })
    );
  };

  const removeAutoStart = () => {
    autoEvents.forEach(evt =>
      window.removeEventListener(evt, tryPlay)
    );
  };

  // Пробуем стартовать сразу (некоторые браузеры/настройки разрешают)
  tryPlay();
  setTimeout(tryPlay, 300);
  setTimeout(tryPlay, 1000);

  bindAutoStart();

  /* ---- Кнопка вкл/выкл ---- */
  const toggleMusic = () => {
    if (bgMusic.paused) {
      bgMusic.volume = TARGET_VOLUME;
      bgMusic.play()
        .then(() => {
          started = true;
          setPlayingUI(true);
          removeAutoStart();
        })
        .catch(() => {});
    } else {
      bgMusic.pause();
      setPlayingUI(false);
    }
  };

  /* ❗ Не даём событиям с кнопки долететь до window —
         иначе на мобильных музыка стартует и тут же встаёт на паузу. */
  ['pointerdown', 'pointerup', 'mousedown', 'mouseup',
   'touchstart', 'touchend', 'touchmove']
    .forEach(evt => musicBtn.addEventListener(evt, (e) => e.stopPropagation()));

  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMusic();
  });

  bgMusic.addEventListener('play',  () => setPlayingUI(true));
  bgMusic.addEventListener('pause', () => setPlayingUI(false));

  /* ---- Подсказка: гость скроллит, а музыки нет — мигаем кнопкой ---- */
  let hintShown = false;
  const showHint = () => {
    if (hintShown || started || !bgMusic.paused) return;
    hintShown = true;
    musicBtn.classList.add('music-btn--hint');
    setTimeout(() => musicBtn.classList.remove('music-btn--hint'), 3000);
  };
  window.addEventListener('wheel',     showHint, { passive: true });
  window.addEventListener('touchmove', showHint, { passive: true });
  window.addEventListener('scroll',    showHint, { passive: true });
}