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
async function handleSubmit(e) {
  e.preventDefault();
  const form     = e.target;
  const btn      = form.querySelector('.form-submit');
  const errorEl  = document.getElementById('form-error');
  const errorMsg = document.getElementById('form-error-msg');

  // Återställ eventuellt tidigare felmeddelande
  errorEl.style.display = 'none';
  btn.textContent = 'Skickar...';
  btn.disabled = true;

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
    const target = href === '#services'
      ? document.getElementById('service-ledarskap')
      : document.querySelector(href);
    if (!target) return;
    const navH = document.getElementById('mainNav')?.offsetHeight || 68;
    window.scrollTo({ top: Math.max(0, getDocTop(target) - navH - 16), behavior: 'smooth' });
  });
});

// ── Modal system
function openModal(id) {
  closeAllModals();
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
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

document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
  const overlay = backdrop.closest('.modal-overlay');
  if (overlay) backdrop.addEventListener('click', () => closeModal(overlay.id));
});

document.querySelectorAll('.modal-close').forEach(btn => {
  const overlay = btn.closest('.modal-overlay');
  if (overlay) btn.addEventListener('click', () => closeModal(overlay.id));
});

document.querySelectorAll('.modal-cta-btn').forEach(btn => {
  btn.addEventListener('click', closeAllModals);
});
