// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

const fileEnv = loadEnv(process.env.NODE_ENV ?? '', process.cwd(), '');
const env = { ...fileEnv, ...process.env };
const defaults = JSON.parse(readFileSync(new URL('./site.config.json', import.meta.url), 'utf8'));

if (defaults.defaultLocale !== 'ru' || JSON.stringify(defaults.locales) !== JSON.stringify(['ru', 'en'])) {
  throw new Error(
    'site.config.json keeps the UI languages as ru (default, also the no-JS and SEO language) and en. URLs are not translated. See README.',
  );
}

/** @param {string | undefined} value */
function normalizeBase(value) {
  const raw = (value || '/').trim();
  if (raw === '/' || raw === '') return '/';
  let base = raw.startsWith('/') ? raw : `/${raw}`;
  if (!base.endsWith('/')) base += '/';
  return base;
}

const siteInput = (env.SITE_URL || defaults.url || 'https://example.com').trim();
let siteUrl;
try {
  siteUrl = new URL(siteInput);
} catch {
  throw new Error(`SITE_URL must be an absolute URL. Received "${siteInput}".`);
}
if (siteUrl.protocol !== 'http:' && siteUrl.protocol !== 'https:') {
  throw new Error('SITE_URL must start with http:// or https://.');
}
const site = siteUrl.href.replace(/\/$/, '');
const base = normalizeBase(env.BASE_PATH || defaults.base);

if (siteUrl.pathname !== '/' && base === '/') {
  console.warn(
    `\n[ink-atlas] SITE_URL includes the path "${siteUrl.pathname}" while BASE_PATH is "/". ` +
      `Prefer the origin only (${siteUrl.origin}) and put the subpath in BASE_PATH.\n`,
  );
}
if (site.includes('example.com')) {
  console.warn(
    '\n[ink-atlas] Site URL is still the example value. Set "url" in site.config.json or the SITE_URL environment variable before deploying.\n',
  );
}

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/submit/thanks'),
    }),
  ],
  build: {
    format: 'directory',
  },
  server: {
    host: '127.0.0.1',
    port: 4471,
  },
});
