// ── Hjälpfunktioner ───────────────────────────────────────────────────────

const emojiMap = {
  'Ledarskap': '🎧', 'Grupputveckling': '👥',
  'Ledningsgrupp': '🏢', 'Coaching': '💡', 'Organisation': '🔥'
};

function formatDate(dateStr) {
  const months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// fetch med AbortController-timeout
async function fetchWithTimeout(url, ms = 5000) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ── Datainläsning ─────────────────────────────────────────────────────────

async function loadPosts() {
  // Primär: posts-meta.json — ett enda anrop, all frontmatter klar
  try {
    const res = await fetchWithTimeout('_posts/posts-meta.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.error('[blogg] posts-meta.json:', e.name === 'AbortError' ? 'timeout (5 s)' : e.message);
  }

  // Fallback: index.json + individuella .md-filer
  try {
    const res = await fetchWithTimeout('_posts/index.json');
    if (res.ok) {
      const files = await res.json();
      const posts = await Promise.all(files.map(parseMarkdownFile));
      if (posts.length > 0) return posts;
    }
  } catch (e) {
    console.error('[blogg] index.json-fallback:', e.name === 'AbortError' ? 'timeout (5 s)' : e.message);
  }

  return null; // null = visa felmeddelande
}

async function parseMarkdownFile(filename) {
  const res  = await fetchWithTimeout(`_posts/${filename}`);
  const text = await res.text();
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  const data  = {};
  if (match) {
    match[1].split('\n').forEach(line => {
      const [key, ...val] = line.split(':');
      if (key && val.length) data[key.trim()] = val.join(':').trim().replace(/^["']|["']$/g, '');
    });
  }
  return { ...data, filename };
}

// ── Rendering ────────────────────────────────────────────────────────────

function renderPosts(posts) {
  const container    = document.getElementById('blog-container');
  const activeFilter = document.querySelector('.filter-tag.active')?.dataset.filter || 'Alla';
  const filtered     = activeFilter === 'Alla' ? posts : posts.filter(p => p.category === activeFilter);

  if (!filtered.length) {
    container.innerHTML =
      '<div class="empty-state">' +
        '<h3>Inga inlägg i den kategorin</h3>' +
        '<p>Välj en annan kategori eller kom tillbaka snart!</p>' +
      '</div>';
    return;
  }

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  const [featured, ...rest] = filtered;

  let out =
    `<div class="post-featured">
      <div class="post-featured-content">
        <p class="post-cat">★ Senaste inlägg · ${featured.category || ''}</p>
        <h2><a href="inlagg.html?post=${featured.filename}" style="color:inherit;text-decoration:none;">${featured.title}</a></h2>
        <p>${featured.excerpt || ''}</p>
        <p class="post-featured-meta">${featured.author || 'Ignicon'} · ${formatDate(featured.date)} · ${featured.readtime || '5 min läsning'}</p>
        <a href="inlagg.html?post=${featured.filename}" class="post-read-link">Läs inlägget →</a>
      </div>
    </div>`;

  if (rest.length) {
    out += '<div class="posts-grid">';
    rest.forEach(p => {
      out +=
        `<div class="post-card">
          <div class="post-card-content">
            <p class="post-cat">${p.category || ''}</p>
            <h3><a href="inlagg.html?post=${p.filename}" style="color:inherit;text-decoration:none;">${p.title}</a></h3>
            <p>${p.excerpt || ''}</p>
            <p class="post-card-meta">${p.author || 'Ignicon'} · ${formatDate(p.date)}</p>
            <a href="inlagg.html?post=${p.filename}" class="post-read-link">Läs inlägget →</a>
          </div>
        </div>`;
    });
    out += '</div>';
  }

  container.innerHTML = out;
}

function showError() {
  const container = document.getElementById('blog-container');
  container.innerHTML =
    '<div class="blog-error">' +
      '<p>Artiklarna kunde inte laddas.<br>Kontrollera din anslutning och försök igen.</p>' +
      '<button class="retry-btn" id="retryBtn">↺ Försök igen</button>' +
    '</div>';
  document.getElementById('retryBtn').addEventListener('click', init);
}

// ── Initiering ────────────────────────────────────────────────────────────

let _cachedPosts = null;

async function init() {
  document.getElementById('blog-container').innerHTML =
    '<div class="loading"><span class="spinner"></span> Laddar inlägg…</div>';

  const posts = await loadPosts();

  if (!posts) {
    showError();
    return;
  }

  _cachedPosts = posts;
  renderPosts(posts);
}

// Filter-knappar använder cachaddata — ingen ny fetch behövs
document.querySelectorAll('.filter-tag').forEach(tag => {
  tag.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
    if (_cachedPosts) renderPosts(_cachedPosts);
  });
});

if (window.netlifyIdentity) {
  window.netlifyIdentity.on('init', user => {
    if (!user) window.netlifyIdentity.on('login', () => { document.location.href = '/admin/'; });
  });
}

init();

// ── Sticky nav shadow ─────────────────────────────────────────────────────

const nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// ── Mobilmeny ────────────────────────────────────────────────────────────

function setNavOpen(isOpen) {
  document.body.classList.toggle('nav-open', isOpen);
  document.getElementById('navBurger').classList.toggle('open', isOpen);
}
function toggleMenu() { setNavOpen(!document.body.classList.contains('nav-open')); }

document.getElementById('navBurger').addEventListener('click', toggleMenu);
document.getElementById('navOverlay')?.addEventListener('click', () => setNavOpen(false));
document.querySelectorAll('#navLinks a').forEach(a => {
  a.addEventListener('click', () => setNavOpen(false));
});
