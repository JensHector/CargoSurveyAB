function parseFrontmatter(text) {
    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { data: {}, content: text };
    const data = {};
    match[1].split('\n').forEach(line => {
        const [key, ...val] = line.split(':');
        if (key && val.length) data[key.trim()] = val.join(':').trim().replace(/^["']|["']$/g, '');
    });
    return { data, content: match[2] };
}

function formatDate(d) {
    const m = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
    const dt = new Date(d);
    return dt.getDate() + ' ' + m[dt.getMonth()] + ' ' + dt.getFullYear();
}

function injectArticleSchema(data, filename) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": data.title || "",
        "description": data.excerpt || "",
        "author": {
            "@type": "Person",
            "name": data.author || "Jens Hector",
            "url": "https://ignicon.se/#about",
            "jobTitle": "VD & Ledarskapsutvecklare",
            "worksFor": {
                "@type": "Organization",
                "name": "Ignicon AB"
            }
        },
        "publisher": {
            "@type": "Organization",
            "name": "Ignicon AB",
            "url": "https://ignicon.se",
            "logo": {
                "@type": "ImageObject",
                "url": "https://ignicon.se/logga_transparent.svg"
            }
        },
        "datePublished": data.date || "",
        "dateModified": data.date || "",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "https://ignicon.se/inlagg.html?post=" + filename
        },
        "url": "https://ignicon.se/inlagg.html?post=" + filename,
        "inLanguage": "sv-SE",
        "articleSection": data.category || "Ledarskap",
        "isPartOf": {
            "@type": "Blog",
            "name": "Artiklar & Tankar",
            "url": "https://ignicon.se/blogg.html"
        }
    };

    const scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    scriptTag.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(scriptTag);
}

function injectBreadcrumbSchema(data, filename) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Hem",
                "item": "https://ignicon.se/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Artiklar & Tankar",
                "item": "https://ignicon.se/blogg.html"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": data.title || "Artikel"
            }
        ]
    };

    const scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    scriptTag.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(scriptTag);
}

function updateMetaTags(data, filename) {
    document.title = (data.title || 'Inlägg') + ' | Ignicon AB';

    const setMeta = (attr, key, value) => {
        let el = document.querySelector('meta[' + attr + '="' + key + '"]');
        if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
        el.setAttribute('content', value);
    };

    setMeta('name', 'description', data.excerpt || '');
    setMeta('property', 'og:title', (data.title || '') + ' | Ignicon AB');
    setMeta('property', 'og:description', data.excerpt || '');
    setMeta('property', 'og:url', 'https://ignicon.se/inlagg.html?post=' + filename);
    setMeta('property', 'og:image', 'https://ignicon.se/jens-hector.jpg');

    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = 'https://ignicon.se/inlagg.html?post=' + filename;
}

async function loadPost() {
    const filename = new URLSearchParams(window.location.search).get('post');
    if (!filename) { renderError('Inget inlägg angivet.'); return; }

    try {
        const res = await fetch('_posts/' + filename);
        if (!res.ok) throw new Error('404');
        const text = await res.text();
        const { data, content } = parseFrontmatter(text);

        updateMetaTags(data, filename);
        injectArticleSchema(data, filename);
        injectBreadcrumbSchema(data, filename);
        renderPost(data, content);
    } catch(e) {
        renderError('Inlägget kunde inte laddas.');
    }
}

function renderPost(data, content) {
    const html = marked.parse(content);
    const emojiMap = {'Ledarskap':'🎓','Grupputveckling':'👥','Ledningsgrupp':'🏢','Coaching':'💡','Organisation':'🔥'};
    const emoji = emojiMap[data.category] || '📖';

    document.getElementById('post-root').innerHTML =
        '<section class="post-hero">' +
            '<div class="hero-bg-text">' + emoji + '</div>' +
            '<div class="post-hero-inner">' +
                '<div class="post-eyebrow">' +
                    '<a href="/blogg.html" class="back-link">← Alla artiklar</a>' +
                    '<span class="post-category">' + (data.category || '') + '</span>' +
                '</div>' +
                '<h1>' + (data.title || '') + '</h1>' +
                '<p class="post-meta">' +
                    '<span>' + (data.author || 'Ignicon') + '</span>' +
                    '<span>' + (data.date ? formatDate(data.date) : '') + '</span>' +
                    (data.readtime ? '<span>' + data.readtime + '</span>' : '') +
                '</p>' +
            '</div>' +
        '</section>' +
        '<article class="post-body">' + html + '</article>' +
        '<div class="post-cta">' +
            '<h3>Vill du veta mer?</h3>' +
            '<p>Vi hjälper chefer och team att utvecklas – hela vägen till resultat.</p>' +
            '<a href="/index.html#contact" class="cta-btn">Kontakta oss</a>' +
        '</div>' +
        '<div class="back-section">' +
            '<a href="/blogg.html" class="back-btn">← Tillbaka till alla artiklar</a>' +
        '</div>';
}

function renderError(msg) {
    document.getElementById('post-root').innerHTML = '<div class="loading">' + msg + ' <a href="/blogg.html" style="color:#E8571A">Gå tillbaka</a></div>';
}

loadPost();

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
