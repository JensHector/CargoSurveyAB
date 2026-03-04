const categoryEmoji = { 'Ledarskap': '🎧', 'Grupputveckling': '👥', 'Ledningsgrupp': '🏢', 'Coaching': '💡', 'Organisation': '🔥', 'default': '📖' };
function formatDate(dateStr) { const months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec']; const d = new Date(dateStr); return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`; }
function parseFrontmatter(text) { const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/); if (!match) return { data: {}, content: text }; const data = {}; match[1].split('\n').forEach(line => { const [key, ...val] = line.split(':'); if (key && val.length) data[key.trim()] = val.join(':').trim().replace(/^["']|["']$/g, ''); }); return { data, content: match[2] }; }
function fileToSlug(filename) { return filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, ''); }
async function loadPosts() { try { const res = await fetch('_posts/index.json').catch(() => null); if (res && res.ok) { const files = await res.json(); return await Promise.all(files.map(f => loadPost(f))); } const indexRes = await fetch('_posts/posts.json').catch(() => null); if (indexRes && indexRes.ok) { const files = await indexRes.json(); return await Promise.all(files.map(f => loadPost(f))); } return []; } catch(e) { return []; } }
async function loadPost(filename) { const res = await fetch(`_posts/${filename}`); const text = await res.text(); const { data, content } = parseFrontmatter(text); return { ...data, filename, slug: fileToSlug(filename), content }; }
function renderPosts(posts) {
  const container = document.getElementById('blog-container');
  const activeFilter = document.querySelector('.filter-tag.active')?.dataset.filter || 'Alla';
  const filtered = activeFilter === 'Alla' ? posts : posts.filter(p => p.category === activeFilter);
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state"><h3>Inga inlägg ännu</h3><p>Kom snart tillbaka!</p></div>';
    return;
  }
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  const featured = filtered[0];
  const rest = filtered.filter(p => p !== featured);
  const emojiMap = {'Ledarskap':'🎧','Grupputveckling':'👥','Ledningsgrupp':'🏢','Coaching':'💡','Organisation':'🔥'};
  const emoji = emojiMap[featured.category] || '📖';
  let out = `<div class="post-featured">
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
      const em = emojiMap[p.category] || '📖';
      out += `<div class="post-card">
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
document.querySelectorAll('.filter-tag').forEach(tag => { tag.addEventListener('click', e => { e.preventDefault(); document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active')); tag.classList.add('active'); const filter = tag.dataset.filter; document.querySelectorAll('[data-category]').forEach(el => { el.style.display = (filter === 'alla' || el.dataset.category === filter) ? '' : 'none'; }); }); });
if (window.netlifyIdentity) { window.netlifyIdentity.on("init", user => { if (!user) { window.netlifyIdentity.on("login", () => { document.location.href = "/admin/"; }); } }); }
loadPosts().then(renderPosts);

// ── Sticky nav shadow
const nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
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
