import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { abs } from './urls';

export async function socialImage(src: ImageMetadata) {
  return getImage({
    src,
    width: 1200,
    height: 630,
    format: 'jpeg',
    quality: 75,
    fit: 'cover',
    position: src.height > src.width ? 'north' : 'centre',
  });
}

export function absoluteUrl(src: string, site: URL | undefined): string {
  if (!site) return src;
  return new URL(src, site).href;
}

export interface Crumb {
  ru: string;
  en: string;
  path: string;
}

export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.ru,
      item: abs(crumb.path),
    })),
  };
}
