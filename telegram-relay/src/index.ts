export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  ALLOWED_ORIGIN: string;
  TURNSTILE_SECRET?: string;
}

interface Payload {
  kind: string;
  work_title: string;
  character_name: string;
  source_url: string;
  image_url: string;
  suggested_tags: string;
  comments: string;
  contact_email: string;
  locale: string;
  honeypot: string;
  turnstile: string;
}

const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
const hits = new Map<string, number[]>();

function originOf(value: string): string {
  return value.trim().replace(/\/$/, '');
}

function corsHeaders(env: Env): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', originOf(env.ALLOWED_ORIGIN || ''));
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
  headers.set('Vary', 'Origin');
  return headers;
}

function json(env: Env, status: number, body: Record<string, unknown>): Response {
  const headers = corsHeaders(env);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { status, headers });
}

function html(env: Env, status: number, ok: boolean): Response {
  const back = originOf(env.ALLOWED_ORIGIN || '') || '/';
  const title = ok ? 'Заявка отправлена' : 'Не удалось отправить';
  const ru = ok
    ? 'Заявка отправлена. Страница появится в каталоге после того, как её добавят.'
    : 'Не удалось отправить заявку. Вернитесь к форме и попробуйте ещё раз.';
  const en = ok
    ? 'The suggestion was sent. A catalog page appears after it is added.'
    : 'The suggestion could not be sent. Go back to the form and try again.';
  const headers = corsHeaders(env);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(
    `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font-family:sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem"><h1>${title}</h1><p>${ru}</p><p>${en}</p><p><a href="${back}">Назад / Back</a></p></body></html>`,
    { status, headers },
  );
}

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function text(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

function validUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validEmail(value: string): boolean {
  return value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function readPayload(request: Request): Promise<Payload> {
  const type = request.headers.get('content-type') || '';
  let data: Record<string, string> = {};
  if (type.includes('application/json')) {
    const body = (await request.json()) as Record<string, unknown>;
    for (const [key, value] of Object.entries(body)) data[key] = String(value ?? '');
  } else {
    const form = await request.formData();
    for (const [key, value] of form.entries()) {
      if (typeof value === 'string') data[key] = value;
    }
  }
  return {
    kind: text(data.kind, 20),
    work_title: text(data.work_title, 200),
    character_name: text(data.character_name, 200),
    source_url: text(data.source_url, 500),
    image_url: text(data.image_url, 500),
    suggested_tags: text(data.suggested_tags, 500),
    comments: text(data.comments, 4000),
    contact_email: text(data.contact_email, 200),
    locale: text(data.locale, 5),
    honeypot: text(data['bot-field'], 200),
    turnstile: text(data['cf-turnstile-response'], 2000),
  };
}

function validate(payload: Payload): string | null {
  if (payload.honeypot) return 'spam';
  if (payload.kind !== 'character' && payload.kind !== 'work') return 'validation';
  if (payload.work_title.length < 2) return 'validation';
  if (payload.kind === 'character' && payload.character_name.length < 1) return 'validation';
  if (!validUrl(payload.source_url)) return 'validation';
  if (payload.image_url && !validUrl(payload.image_url)) return 'validation';
  if (!validEmail(payload.contact_email)) return 'validation';
  return null;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function message(payload: Payload): string {
  const lines = [
    '<b>Новая заявка в каталог</b>',
    `Тип: ${payload.kind === 'character' ? 'персонаж' : 'произведение'}`,
    `Произведение: ${escapeHtml(payload.work_title)}`,
  ];
  if (payload.character_name) lines.push(`Персонаж: ${escapeHtml(payload.character_name)}`);
  lines.push(`Источник: ${escapeHtml(payload.source_url)}`);
  if (payload.image_url) lines.push(`Изображение: ${escapeHtml(payload.image_url)}`);
  if (payload.suggested_tags) lines.push(`Метки: ${escapeHtml(payload.suggested_tags)}`);
  if (payload.comments) lines.push(`Комментарий: ${escapeHtml(payload.comments)}`);
  if (payload.contact_email) lines.push(`Почта: ${escapeHtml(payload.contact_email)}`);
  lines.push(`Язык формы: ${payload.locale === 'en' ? 'en' : 'ru'}`);
  return lines.join('\n');
}

async function verifyTurnstile(secret: string, token: string, ip: string): Promise<boolean> {
  const body = new FormData();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  if (!response.ok) return false;
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowed = originOf(env.ALLOWED_ORIGIN || '');
    const origin = originOf(request.headers.get('Origin') || '');
    if (request.method === 'OPTIONS') {
      if (origin && origin !== allowed) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }
    if (request.method !== 'POST') return json(env, 405, { ok: false, error: 'method' });
    if (!allowed || (origin && origin !== allowed)) return json(env, 403, { ok: false, error: 'origin' });

    const wantsJson = (request.headers.get('accept') || '').includes('application/json');
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (limited(ip)) {
      return wantsJson ? json(env, 429, { ok: false, error: 'rate' }) : html(env, 429, false);
    }

    let payload: Payload;
    try {
      payload = await readPayload(request);
    } catch {
      return wantsJson ? json(env, 400, { ok: false, error: 'validation' }) : html(env, 400, false);
    }
    if (validate(payload)) {
      return wantsJson ? json(env, 400, { ok: false, error: 'validation' }) : html(env, 400, false);
    }
    if (env.TURNSTILE_SECRET) {
      const passed = payload.turnstile
        ? await verifyTurnstile(env.TURNSTILE_SECRET, payload.turnstile, ip)
        : false;
      if (!passed) {
        return wantsJson ? json(env, 400, { ok: false, error: 'turnstile' }) : html(env, 400, false);
      }
    }
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return wantsJson ? json(env, 500, { ok: false, error: 'delivery' }) : html(env, 500, false);
    }

    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: message(payload),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!response.ok) {
      return wantsJson ? json(env, 502, { ok: false, error: 'delivery' }) : html(env, 502, false);
    }
    return wantsJson ? json(env, 200, { ok: true }) : html(env, 200, true);
  },
};
