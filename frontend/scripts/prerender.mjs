import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
// Plain ESM with no JSX or Vite-isms, so plain Node can read it — the app and
// the build share one source of truth for which posts exist.
import { POSTS_BY_DATE, BLOG_BASE } from '../src/content/posts.js';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist');
const SITE = 'https://collzap.com';

// React HTML-escapes text children when it renders them (& -> &amp; etc), so a
// `must` string taken verbatim from source content silently fails to match the
// very content it was pulled from whenever that content contains one of these
// characters — as happened with "Founder & CEO". Escape the needle the same
// way rather than requiring every post's assertion text to avoid them.
function htmlEscape(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * The public routes. Each needs a matching entry in App.jsx's INDEXABLE_PATHS
 * (or NOINDEX_FOLLOW_PATHS) and, if indexable, in the sitemap below.
 *
 * `must` is a string that has to appear in the rendered body. It is the guard
 * against silently shipping a Suspense spinner if someone later reintroduces a
 * boundary that can't resolve at build time.
 */
const ROUTES = [
  // Assertions avoid text that spans an inline element — the hero <h1> has a
  // <span> in the middle of it, so it is not contiguous in the output.
  { path: '/', must: 'discover like-minded people from their own campus', sitemap: true },
  { path: '/about', must: 'What CollZap is', sitemap: true },
  { path: '/faq', must: 'Frequently asked questions', sitemap: true },
  { path: '/bring-collzap', must: 'Bring CollZap to your college', sitemap: true },
  { path: '/privacy', must: 'Privacy Policy', sitemap: true },
  { path: '/terms', must: 'Terms and Conditions', sitemap: true },
  { path: '/login', must: 'Back again.', sitemap: true },
  { path: '/signup', must: 'Get on the list.', sitemap: true },
  { path: '/forgot-password', must: 'Forgot your password?', sitemap: false },
  { path: BLOG_BASE, must: 'Finding your people in college.', sitemap: true },
  // One entry per post, asserted against its own title so a broken render is
  // caught per-post rather than by a single blanket check.
  ...POSTS_BY_DATE.map((post) => ({
    path: `${BLOG_BASE}/${post.slug}`,
    must: post.blocks.find((b) => b.t === 'p').x.slice(0, 40),
    sitemap: true,
  })),
];

// Windows: import() of a bare drive path throws ERR_UNSUPPORTED_ESM_URL_SCHEME.
const { render } = await import(
  pathToFileURL(resolve(ROOT, 'dist-ssr/entry-server.js')).href
);

// Read the pristine client template EXACTLY ONCE, before any write. Rendering
// '/' overwrites dist/index.html — which *is* the template — so re-reading per
// route would feed the already-injected landing page in as the shell for the
// next route.
const TEMPLATE = await readFile(resolve(DIST, 'index.html'), 'utf8');

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Collapse duplicates *within* the rendered head, keeping the last occurrence.
 * React 19 hoists every matching tag in the tree without deduping, and the
 * deeper (page-level) component renders later — so last wins is "most
 * specific wins".
 */
function dedupeWithinHead(head) {
  const tags = head.match(/<(?:meta|link|base)\b[^>]*>|<title\b[^>]*>[\s\S]*?<\/title>/gi) || [];
  const byKey = new Map();
  const unkeyed = [];

  for (const tag of tags) {
    let key = null;
    if (/^<title/i.test(tag)) key = 'title';
    else {
      const name = tag.match(/\bname="([^"]+)"/i);
      const property = tag.match(/\bproperty="([^"]+)"/i);
      const rel = tag.match(/\brel="([^"]+)"/i);
      if (name) key = `meta:name:${name[1].toLowerCase()}`;
      else if (property) key = `meta:property:${property[1].toLowerCase()}`;
      else if (rel && /canonical|manifest/i.test(rel[1])) key = `link:${rel[1].toLowerCase()}`;
    }
    if (key) byKey.set(key, tag);
    else unkeyed.push(tag);
  }

  return [...unkeyed, ...byKey.values()].join('');
}

/**
 * Subtract, then append: for every tag the render produced, delete the tag it
 * supersedes from the template's <head>, then insert the rendered block before
 * </head>. Keyed on identity rather than position, and the lookahead form keeps
 * it independent of attribute order.
 */
function dedupeTemplateHead(template, head) {
  let out = template;

  if (/<title[\s>]/i.test(head)) {
    out = out.replace(/[ \t]*<title>[\s\S]*?<\/title>\r?\n?/i, '');
  }
  for (const [, key] of head.matchAll(/<meta\b[^>]*\bname="([^"]+)"/gi)) {
    out = out.replace(
      new RegExp(`[ \\t]*<meta\\b(?=[^>]*\\bname="${esc(key)}")[^>]*>\\r?\\n?`, 'i'),
      ''
    );
  }
  for (const [, key] of head.matchAll(/<meta\b[^>]*\bproperty="([^"]+)"/gi)) {
    out = out.replace(
      new RegExp(`[ \\t]*<meta\\b(?=[^>]*\\bproperty="${esc(key)}")[^>]*>\\r?\\n?`, 'i'),
      ''
    );
  }
  if (/<link\b[^>]*\brel="canonical"/i.test(head)) {
    out = out.replace(/[ \t]*<link\b(?=[^>]*\brel="canonical")[^>]*>\r?\n?/i, '');
  }

  return out;
}

function buildDocument(route, head, body) {
  if (!head.trim()) {
    throw new Error(
      `Prerender produced an empty <head> for ${route}. React 19's metadata ` +
        'hoisting or the splitter in entry-server.jsx has regressed — refusing to publish.'
    );
  }

  const deduped = dedupeWithinHead(head);
  let doc = dedupeTemplateHead(TEMPLATE, deduped);
  doc = doc.replace('</head>', `    ${deduped}\n  </head>`);
  doc = doc.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return doc;
}

function buildSitemap(paths) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const entries = paths
    .map(
      (p) =>
        `  <url>\n    <loc>${SITE}${p === '/' ? '/' : p}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

// The SPA fallback shell, written from the untouched template *before* the loop
// replaces dist/index.html. Without it, vercel.json's catch-all would serve the
// full marketing landing page for every authenticated deep link, flashing it
// before React clears the root.
await writeFile(resolve(DIST, 'app.html'), TEMPLATE, 'utf8');

for (const { path, must } of ROUTES) {
  const { head, html } = await render(path);

  if (html.includes('template data-msg')) {
    throw new Error(
      `${path} prerendered a Suspense fallback instead of content. A lazy ` +
        'boundary on this route could not resolve at build time.'
    );
  }
  if (must && !html.includes(htmlEscape(must))) {
    throw new Error(
      `${path} prerendered without its expected content (looked for ${JSON.stringify(must)}). ` +
        'Either the copy changed — update ROUTES in this script — or the render is broken.'
    );
  }

  const doc = buildDocument(path, head, html);
  const file =
    path === '/' ? resolve(DIST, 'index.html') : resolve(DIST, path.slice(1), 'index.html');

  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, doc, 'utf8');
  console.log(`prerendered ${path.padEnd(18)} -> ${(doc.length / 1024).toFixed(0)} KB`);
}

const sitemapPaths = ROUTES.filter((r) => r.sitemap).map((r) => r.path);
await writeFile(resolve(DIST, 'sitemap.xml'), buildSitemap(sitemapPaths), 'utf8');
console.log(`sitemap.xml  -> ${sitemapPaths.length} URLs`);

// Every prerendered route needs an explicit rewrite to its own file, ahead of
// the SPA catch-all. Relying on Vercel checking the filesystem before rewrites
// would work, but `vite preview` demonstrates that not every static host does —
// under it the catch-all shadowed /login and served the landing page instead.
// Rather than trust the ordering, the rewrite is explicit, and this asserts the
// two lists never drift.
const vercelConfig = JSON.parse(await readFile(resolve(ROOT, 'vercel.json'), 'utf8'));
const rewriteSources = new Set((vercelConfig.rewrites || []).map((r) => r.source));
const missing = ROUTES.map((r) => r.path).filter((p) => !rewriteSources.has(p));

if (missing.length > 0) {
  throw new Error(
    `vercel.json is missing an explicit rewrite for prerendered route(s): ${missing.join(', ')}. ` +
      'Without it the catch-all rewrite serves the SPA shell (or the landing page) for that URL.'
  );
}
console.log(`vercel.json  -> ${ROUTES.length} route rewrites verified`);
