# CLAUDE.md — AI Assistant Guide for CargoSurveyAB

This file documents the codebase structure, conventions, and workflows for AI assistants (Claude Code and others) working in this repository.

---

## Project Overview

**Cargo Survey AB** is a Swedish marine survey company. This repository is a static website built entirely with vanilla HTML, CSS, and JavaScript, deployed via Netlify. There is no server-side backend, no framework, and no bundler — all pages are plain static files served from the repository root.

The site was recently rebranded from "Ignicon AB" (leadership consulting) to "Cargo Survey AB" (marine surveying). Some internal references to the old brand may still appear in configuration files (e.g., `admin/config.yml` references the old GitHub repository name).

---

## Repository Structure

```
/
├── index.html                   # Homepage (hero, services, contact form)
├── om-oss.html                  # About page
├── kontakt.html                 # Contact page
├── jobba-at-oss.html            # Careers page
├── blogg.html                   # Blog listing page
├── inlagg.html                  # Single blog post page (dynamic via query param)
├── marina-inspektioner.html     # Service: marina inspections
├── olja-petroleum.html          # Service: oil & petroleum
├── pre-shipment.html            # Service: pre-shipment inspection
├── pre-wash-marpol.html         # Service: pre-wash MARPOL
├── provtagning-bulk.html        # Service: sampling & bulk
├── skadeinspektioner.html       # Service: damage inspections
├── terminal.html                # Service: terminal inspections
│
├── index.js                     # Homepage interactivity (nav, modals, scroll effects)
├── blogg.js                     # Blog listing (fetch, filter, render posts)
├── inlagg.js                    # Single post renderer (fetch MD, parse frontmatter, render)
├── build-posts-index.js         # Build script: generates _posts/index.json and posts-meta.json
│
├── _posts/                      # Markdown blog posts (YYYY-MM-DD-slug.md)
│   ├── index.json               # Generated: ordered list of filenames
│   └── posts-meta.json          # Generated: pre-extracted frontmatter for all posts
│
├── admin/
│   ├── index.html               # Netlify CMS interface
│   └── config.yml               # CMS field definitions & backend config
│
├── .claude/
│   └── launch.json              # Local dev server config (python http.server, port 4500)
│
├── .github/
│   └── dependabot.yml           # Weekly npm & GitHub Actions dependency updates
│
├── logga_transparent.svg        # Company logo (SVG)
├── netlify.toml                 # Netlify build, redirect, and header config
├── package.json                 # Node.js metadata; single dep: marked@15.0.7
├── robots.txt                   # Blocks /admin from crawlers
├── sitemap.xml                  # Basic XML sitemap
└── .nojekyll                    # Disables GitHub Pages Jekyll processing
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (semantic elements) |
| Styling | CSS3 (embedded in `<style>` tags per file; no external CSS) |
| Scripting | Vanilla JavaScript (ES6+, no frameworks) |
| Markdown parsing | `marked` v15.0.7 (client-side, for blog posts) |
| CMS | Netlify CMS (GitHub backend) |
| Hosting | Netlify (static CDN) |
| Fonts | Google Fonts: Cinzel, Cormorant Garamond, Lora, DM Mono |
| SEO | Schema.org JSON-LD structured data |
| Auth (CMS) | Netlify Identity |

---

## Development Workflow

### Local Development Server

```bash
python3 -m http.server 4500
```

Then open `http://localhost:4500` in a browser.

> The `.claude/launch.json` configures this for the Claude IDE, targeting port 4500.

### Build Step

The only build step generates the blog post index files:

```bash
npm run build
# or directly:
node build-posts-index.js
```

This reads all `*.md` files in `_posts/`, extracts frontmatter, and writes:
- `_posts/index.json` — array of filenames sorted newest-first
- `_posts/posts-meta.json` — array of post metadata objects

**Run this whenever you add, remove, or rename a blog post.**

### Deployment

- Push to the `master` branch on GitHub
- Netlify auto-triggers: runs `node build-posts-index.js`, then serves from `.` (root)
- No manual deployment steps needed

---

## Blog Post System

### Adding a Blog Post

1. Create a file in `_posts/` named `YYYY-MM-DD-slug.md`
2. Include YAML frontmatter at the top:

```markdown
---
title: "Post title in Swedish"
date: 2026-03-10
category: Ledarskap
excerpt: "One-sentence summary shown in the listing."
author: Jens Hector
readtime: "3 min läsning"
featured: false
---

Markdown content here...
```

3. Run `npm run build` to regenerate the index files
4. Commit both the `.md` file and the updated `_posts/index.json` / `_posts/posts-meta.json`

### Valid Categories

Categories must exactly match one of (case-sensitive):
- `Ledarskap`
- `Grupputveckling`
- `Ledningsgrupp`
- `Coaching`
- `Organisation`

### Blog Rendering Flow

- `blogg.html` loads `blogg.js` → fetches `_posts/posts-meta.json` → renders card list
- `inlagg.html?post=filename` loads `inlagg.js` → fetches the `.md` file → parses frontmatter → renders via `marked`
- Filter buttons on `blogg.html` filter client-side by category

---

## Code Conventions

### JavaScript

- **No frameworks or bundlers.** All JS is vanilla ES6+ loaded via `<script src="...">` at the bottom of each HTML file.
- **Error handling:** Use `try/catch` with user-facing fallback messages for all `fetch()` calls.
- **Fetch timeouts:** Use `AbortController` with a 5000ms timeout on all network requests.
- **camelCase** for all variable and function names.
- **No global state pollution** — prefer locally scoped variables.
- Scroll animations use `IntersectionObserver`.
- Staggered animations use `setTimeout` with incremental delays.

### HTML / CSS

- **All CSS lives inside `<style>` tags** within each HTML file. There are no external `.css` files.
- **CSS custom properties** define the colour palette (e.g., `--navy`, `--orange`, `--body`). Always use these — never hard-code colour values.
- **Semantic HTML5** throughout: `<section>`, `<article>`, `<nav>`, `<main>`, `<footer>`, etc.
- **Accessibility:** All interactive elements must have ARIA labels where needed. Target WCAG 2.1 AA.
- **Mobile-first** responsive design using CSS media queries.
- **Kebab-case** for all CSS class names and HTML IDs (e.g., `service-card`, `blog-container`).

### Naming Conventions

- HTML/CSS identifiers: `kebab-case`
- JS variables/functions: `camelCase`
- Blog post files: `YYYY-MM-DD-slug.md` (ISO date prefix, lowercase kebab slug)
- All user-facing content is in **Swedish**

### SEO & Structured Data

Each page includes Schema.org JSON-LD. Update this when adding new pages or changing key content. The canonical domain is `https://cargosurvey.se/`.

---

## Netlify Configuration (`netlify.toml`)

### Key Settings

| Setting | Value |
|---|---|
| Build command | `node build-posts-index.js` |
| Publish directory | `.` (repository root) |
| Node version | Inherited from environment |

### Redirects

Short URLs redirect to anchor sections on the homepage:

| Short URL | Destination |
|---|---|
| `/ledare-chef` | `/#service-ledarskap` |
| `/coaching` | `/#service-coaching` |
| `/ledningsgrupper` | `/#service-ledningsgrupp` |
| `/grupper-team` | `/#service-grupputveckling` |
| `/workshop` | `/#service-workshops` |
| `/forelasningar` | `/#service-forelasningar` |
| `/admin` | `/admin/index.html` |

### Security Headers

The site sends HSTS, CSP, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, and Permissions-Policy headers on all responses. Modify these in `netlify.toml` only with care — the CSP in particular can break third-party scripts if incorrectly updated.

### Cache Headers

- Images: `Cache-Control: public, max-age=31536000, immutable`
- CSS/JS: `Cache-Control: public, max-age=2592000`

---

## Netlify CMS (`admin/`)

- CMS is available at `/admin` (requires Netlify Identity login)
- Backend: GitHub repository `JensHector/ignicon-hemsida` — **note: this is the old repo name and may need updating to `JensHector/CargoSurveyAB`**
- Media uploads go to `/bilder/`
- Blog post fields are defined in `admin/config.yml`

---

## Important Notes for AI Assistants

1. **Do not add external CSS files.** All styles belong in `<style>` tags inside the relevant HTML file.
2. **Do not introduce JS frameworks** (React, Vue, etc.) or a bundler (Webpack, Vite). Keep it vanilla.
3. **Run `npm run build` after any changes to `_posts/`** to keep the index files in sync.
4. **All content is Swedish** — maintain this when generating or editing user-facing text.
5. **The `master` branch is production.** Netlify deploys automatically on push to `master`.
6. **No `.env` files exist.** Configuration is embedded in HTML/JS or in `netlify.toml`. Do not introduce secrets into source files.
7. **There are no automated tests.** Verify changes manually by running the local server.
8. **CSS custom properties are the source of truth for colours** — always use `var(--property-name)` rather than raw hex/RGB values.
9. **Schema.org JSON-LD blocks** appear in `<script type="application/ld+json">` tags — keep these accurate when modifying pages.
10. **The canonical domain is `https://cargosurvey.se/`** — use this in all meta tags, sitemap entries, and structured data.

---

## Dependency Management

- `marked` (v15.0.7) is the only runtime npm dependency — it is loaded from `node_modules` at build time and not bundled for the browser. Client-side rendering loads it via a CDN or the local build. Check `inlagg.js` for the exact import method.
- Dependabot creates weekly PRs for npm and GitHub Actions updates.
- Review Dependabot PRs promptly; `marked` is a rendering dependency that can affect blog output if its API changes between major versions.
