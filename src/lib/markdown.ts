import { Marked } from 'marked';
import type { Locale } from '../i18n';

const marked = new Marked({ gfm: true, breaks: false });

export function renderMarkdown(source: string): string {
  const html = marked.parse(source, { async: false });
  if (typeof html !== 'string') return '';
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?(?:iframe|object|embed)\b[^>]*>/gi, '');
}

export function localizedMarkdown(
  body: string | undefined,
  locale: Locale,
): { html: string; fellBack: boolean } {
  const raw = body?.trim() ?? '';
  if (!raw) return { html: '', fellBack: false };
  const [ruPart = '', enPart = ''] = raw.split(/<!--\s*lang:en\s*-->/i);
  const ru = ruPart.trim();
  const en = enPart.trim();
  if (locale === 'en') {
    if (en) return { html: renderMarkdown(en), fellBack: false };
    if (ru) return { html: renderMarkdown(ru), fellBack: true };
    return { html: '', fellBack: false };
  }
  return { html: ru ? renderMarkdown(ru) : '', fellBack: false };
}
