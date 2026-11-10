import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { abs } from './urls';

export async function socialImage(src: ImageMetadata) {
  const width = Math.min(720, src.width);
  const height = Math.max(1, Math.min(630, Math.round(src.height * (width / src.width))));
  return getImage({
    src,
    width,
    height,
    format: 'jpeg',
    quality: 70,
    fit: 'cover',
    position: src.height > src.width ? 'north' : 'centre',
    // JPEG cannot keep a cutout's alpha. Flatten onto the page color
    // so a transparent figure does not turn black in Open Graph cards.
    background: '#f7f6f4',
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
