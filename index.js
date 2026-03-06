// ── Sticky nav shadow + hero parallax
const nav = document.getElementById('mainNav');
const heroDecor2 = document.querySelector('.hero-decor-2');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y > 20);
  if (heroDecor2) heroDecor2.style.transform = `translateY(${y * 0.2}px)`;
});

// ── Mobile menu
function setNavOpen(isOpen) {
  const burger = document.getElementById('navBurger');
  document.body.classList.toggle('nav-open', isOpen);
  burger.classList.toggle('open', isOpen);
}
function toggleMenu() {
  setNavOpen(!document.body.classList.contains('nav-open'));
}
document.getElementById('navBurger').addEventListener('click', toggleMenu);
document.getElementById('navOverlay')?.addEventListener('click', () => setNavOpen(false));
document.querySelectorAll('#navLinks a').forEach(a => {
  a.addEventListener('click', () => setNavOpen(false));
});

// ── Scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
        entry.target.addEventListener('animationend', function onEnd() {
          this.classList.remove('animate', 'visible');
          this.removeEventListener('animationend', onEnd);
        });
      }, i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.animate').forEach(el => observer.observe(el));

// ── Section accent line
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    entry.target.classList.toggle('visible', entry.isIntersecting);
  });
}, { threshold: 0.15 });
document.querySelectorAll('section').forEach(s => sectionObserver.observe(s));

// ── Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 100) {
      current = section.getAttribute('id');
    }
  });
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) {
      link.classList.add('active');
    }
  });
});

// ── Form handler (Netlify Forms)
const FORM_COOLDOWN_MS = 60_000; // 60 s mellan skickningar
let _lastSubmitTime = 0;

async function handleSubmit(e) {
  e.preventDefault();
  const form     = e.target;
  const btn      = form.querySelector('.form-submit');
  const errorEl  = document.getElementById('form-error');
  const errorMsg = document.getElementById('form-error-msg');

  // Rate limiting: max 1 skickning per 60 s
  const now = Date.now();
  if (now - _lastSubmitTime < FORM_COOLDOWN_MS) {
    const secsLeft = Math.ceil((FORM_COOLDOWN_MS - (now - _lastSubmitTime)) / 1000);
    errorMsg.textContent = `Vänta ${secsLeft} sekunder innan du skickar igen.`;
    errorEl.style.display = 'block';
    return;
  }

  // Återställ eventuellt tidigare felmeddelande
  errorEl.style.display = 'none';
  btn.textContent = 'Skickar...';
  btn.disabled = true;
  _lastSubmitTime = now;

  try {
    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    });

    if (response.ok) {
      // 200 OK → tack-state
      form.style.display = 'none';
      document.getElementById('form-success').style.display = 'block';
    } else {
      // 4xx / 5xx → felmeddelande + Ring/SMS-fallback
      errorMsg.textContent = 'Något gick fel (' + response.status + ') – meddelandet skickades inte.';
      errorEl.style.display = 'block';
      btn.textContent = 'Skicka meddelande';
      btn.disabled = false;
    }
  } catch (err) {
    // Nätverksfel → felmeddelande + Ring/SMS-fallback
    errorMsg.textContent = 'Nätverksfel – meddelandet skickades inte.';
    errorEl.style.display = 'block';
    btn.textContent = 'Skicka meddelande';
    btn.disabled = false;
  }
}
document.querySelector('form[name="contact"]').addEventListener('submit', handleSubmit);

// ── Center target vertically in viewport on #services / #service-* clicks
function getDocTop(el) {
  let top = 0;
  while (el) { top += el.offsetTop; el = el.offsetParent; }
  return top;
}
document.querySelectorAll('a[href="#services"], a[href^="#service-"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const href = link.getAttribute('href');
    const target = document.querySelector(href);
    if (!target) return;
    const navH = document.getElementById('mainNav')?.offsetHeight || 68;
    window.scrollTo({ top: Math.max(0, getDocTop(target) - navH - 16), behavior: 'smooth' });
  });
});

// ── Modal system
let _lastModalOpenTime = 0; // Skyddar mot ghost clicks på touch-enheter

function openModal(id) {
  closeAllModals();
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  _lastModalOpenTime = Date.now();
  // Chrome-fix: blockera pointer-events under innevarande event-loop så att
  // klicket som öppnade modalen inte omdirigeras till overlayen av Chromes hit-tester.
  overlay.style.pointerEvents = 'none';
  requestAnimationFrame(() => { overlay.style.pointerEvents = ''; });
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay.active').forEach(m => {
    m.classList.remove('active');
  });
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAllModals();
});

document.querySelectorAll('[data-modal]').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    openModal(btn.dataset.modal);
  });
});

// Stäng modal vid klick på dimmat område – men INTE om klicket är inuti panelen.
// 350 ms-skyddet förhindrar att ghost clicks på touch-enheter stänger modalen direkt.
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (Date.now() - _lastModalOpenTime < 350) return;
    if (!e.target.closest('.modal-panel')) closeModal(overlay.id);
  });
});

document.querySelectorAll('.modal-close').forEach(btn => {
  const overlay = btn.closest('.modal-overlay');
  if (overlay) btn.addEventListener('click', () => closeModal(overlay.id));
});

document.querySelectorAll('.modal-cta-btn').forEach(btn => {
  btn.addEventListener('click', closeAllModals);
});

// ── Services carousel dots
(function () {
  const grid = document.querySelector('.services-grid');
  const cards = Array.from(document.querySelectorAll('.service-card'));
  const dots = Array.from(document.querySelectorAll('.services-dot'));
  if (!grid || !dots.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.intersectionRatio >= 0.6) {
        const i = cards.indexOf(entry.target);
        if (i >= 0) dots.forEach((d, j) => d.classList.toggle('active', j === i));
      }
    });
  }, { root: grid, threshold: 0.6 });

  cards.forEach(card => observer.observe(card));

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      cards[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });
  });

  // Reset to first card when navigating to #services via any link
  document.querySelectorAll('a[href="#services"]').forEach(link => {
    link.addEventListener('click', () => {
      requestAnimationFrame(() => { grid.scrollLeft = 0; });
    });
  });
}());
