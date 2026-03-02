// ── Sticky nav shadow
const nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
});

// ── Mobile menu
function toggleMenu() {
    const links = document.getElementById('navLinks');
    const burger = document.getElementById('navBurger');
    links.classList.toggle('open');
    burger.classList.toggle('open');
}

// Stäng menyn vid klick utanför
document.addEventListener('click', function(e) {
    const burger = document.getElementById('navBurger');
    const links = document.getElementById('navLinks');
    if (!burger.contains(e.target) && !links.contains(e.target)) {
          links.classList.remove('open');
          burger.classList.remove('open');
    }
});

// ── Scroll animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
                  setTimeout(() => {
                            entry.target.classList.add('visible');
                  }, i * 80);
                  observer.unobserve(entry.target);
          }
    });
}, { threshold: 0.12 });
document.querySelectorAll('.animate').forEach(el => observer.observe(el));

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

// ── Form handler (Formspree)
async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const emailVal = form.querySelector('#email').value;
    document.getElementById('replyto-field').value = emailVal;
    const btn = form.querySelector('.form-submit');
    btn.textContent = 'Skickar...';
    btn.disabled = true;
    try {
          const response = await fetch('https://formspree.io/f/mzdajvaw', {
                  method: 'POST',
                  body: new FormData(form),
                  headers: { 'Accept': 'application/json' }
          });
          if (response.ok) {
                  form.style.display = 'none';
                  document.getElementById('form-success').style.display = 'block';
          } else {
                  btn.textContent = 'Något gick fel – försök igen';
                  btn.disabled = false;
          }
    } catch {
          btn.textContent = 'Något gick fel – försök igen';
          btn.disabled = false;
    }
}

// ── Smooth close dropdown on link click
document.querySelectorAll('.dropdown a').forEach(link => {
    link.addEventListener('click', () => {
          document.getElementById('navLinks').classList.remove('open');
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
document.querySelectorAll('.modal-cta-btn').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
});
