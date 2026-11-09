import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const base = import.meta.env.BASE_URL;
  const body = {
    name: 'Чернильный атлас',
    short_name: 'Атлас',
    lang: 'ru',
    start_url: base,
    scope: base,
    display: 'standalone',
    background_color: '#f3eee4',
    theme_color: '#1d1915',
    icons: [
      { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `${base}favicon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
