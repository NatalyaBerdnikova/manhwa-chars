import en from './ui/en.json';
import ru from './ui/ru.json';

export const defaultLocale = 'ru' as const;
export const locales = ['ru', 'en'] as const;
export type Locale = (typeof locales)[number];

const dictionaries = { ru, en } as const;

export interface Localized {
  ru: string;
  en?: string;
}

type PluralCategory = 'one' | 'few' | 'many' | 'other';

function lookup(locale: Locale, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object' && part in node) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionaries[locale]);
  return typeof value === 'string' ? value : undefined;
}

export function t(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  let text = lookup(locale, key) ?? lookup(defaultLocale, key) ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export function pluralCategory(locale: Locale, n: number): PluralCategory {
  const abs = Math.abs(Math.trunc(n));
  if (locale === 'ru') {
    const n10 = abs % 10;
    const n100 = abs % 100;
    if (n10 === 1 && n100 !== 11) return 'one';
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return 'few';
    return 'many';
  }
  return abs === 1 ? 'one' : 'other';
}

export function plural(locale: Locale, key: string, n: number): string {
  const category = pluralCategory(locale, n);
  return t(locale, `${key}.${category}`, { n });
}

export function pick(field: Localized, locale: Locale): { text: string; fellBack: boolean } {
  if (locale === defaultLocale) return { text: field.ru, fellBack: false };
  const translated = field.en?.trim();
  if (translated) return { text: translated, fellBack: false };
  return { text: field.ru, fellBack: true };
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function documentTitle(locale: Locale, page?: string): string {
  if (!page) return t(locale, 'meta.homeTitle');
  return t(locale, 'meta.titleTemplate', { title: page, site: t(locale, 'meta.siteName') });
}

export const ogLocales: Record<Locale, string> = {
  ru: 'ru_RU',
  en: 'en_US',
};
