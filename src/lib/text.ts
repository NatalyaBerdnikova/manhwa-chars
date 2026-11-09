import type { Locale } from '../i18n';

export function excerpt(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const sliced = clean.slice(0, max - 1);
  const cut = sliced.replace(/\s+\S*$/, '').trim();
  return `${cut || sliced.trim()}…`;
}

export function formatDate(locale: Locale, iso?: string): string {
  if (!iso) return '';
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function byAddedDesc<T extends { data: { added?: string } }>(a: T, b: T): number {
  return (b.data.added ?? '').localeCompare(a.data.added ?? '');
}
