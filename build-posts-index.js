#!/usr/bin/env node
/**
 * build-posts-index.js
 *
 * Körs av Netlify vid varje deploy (se netlify.toml [build] command).
 * Genererar två filer i _posts/:
 *
 *   index.json       – array med filnamn, nyast först (bakåtkompatibilitet)
 *   posts-meta.json  – array med all frontmatter pre-extraherad
 *                      → blogg.html behöver bara ETT fetch-anrop
 *
 * Kör lokalt med: node build-posts-index.js
 */

const fs   = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '_posts');

// ── Parsning av YAML-frontmatter ───────────────────────────────────────────
function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const data = {};
  match[1].split('\n').forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) data[key] = val;
  });
  return data;
}

// ── Hämta alla .md-filer, sortera nyast först (YYYY-MM-DD-prefix) ──────────
const files = fs.readdirSync(postsDir)
  .filter(f => f.endsWith('.md'))
  .sort()
  .reverse();

// 1. index.json – bara filnamn (behålls för bakåtkompatibilitet)
fs.writeFileSync(
  path.join(postsDir, 'index.json'),
  JSON.stringify(files, null, 2)
);

// 2. posts-meta.json – all frontmatter pre-extraherad
const meta = files.map(filename => {
  const text = fs.readFileSync(path.join(postsDir, filename), 'utf8');
  const d    = parseFrontmatter(text);
  return {
    filename,
    title:    d.title    || '',
    date:     d.date     || '',
    category: d.category || '',
    excerpt:  d.excerpt  || '',
    author:   d.author   || 'Jens Hector',
    readtime: d.readtime || '5 min läsning',
  };
});

fs.writeFileSync(
  path.join(postsDir, 'posts-meta.json'),
  JSON.stringify(meta, null, 2)
);

console.log(`✓ Byggde blogindex för ${files.length} inlägg`);
meta.forEach(p => console.log(`  – ${p.date}  ${p.title}`));
