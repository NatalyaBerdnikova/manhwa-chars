import tagsFile from './tags.json';
import { pick, type Locale, type Localized } from '../i18n';

export interface TagValue {
  id: string;
  label: Localized;
}

export interface TagCategory {
  id: string;
  label: Localized;
  description?: Localized;
  values: TagValue[];
}

export const tagCategories = tagsFile.categories as TagCategory[];

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertTagVocabulary(): void {
  const seen = new Set<string>();
  for (const category of tagCategories) {
    if (!slug.test(category.id)) {
      throw new Error(
        `Tag category id "${category.id}" must be a lowercase latin slug (letters, numbers, hyphens).`,
      );
    }
    if (seen.has(category.id)) throw new Error(`Duplicate tag category id "${category.id}".`);
    seen.add(category.id);
    const values = new Set<string>();
    for (const value of category.values) {
      if (!slug.test(value.id)) {
        throw new Error(
          `Tag value id "${value.id}" in "${category.id}" must be a lowercase latin slug.`,
        );
      }
      if (values.has(value.id)) {
        throw new Error(`Duplicate value "${value.id}" in tag category "${category.id}".`);
      }
      values.add(value.id);
    }
  }
}

export function tagError(categoryId: string, valueId: string): string | null {
  const category = tagCategories.find((item) => item.id === categoryId);
  if (!category) {
    return `Unknown tag category "${categoryId}". Add it to src/data/tags.json.`;
  }
  if (!category.values.some((item) => item.id === valueId)) {
    return `Unknown tag value "${valueId}" in category "${categoryId}". Add it to src/data/tags.json.`;
  }
  return null;
}

export function categoryById(id: string): TagCategory | undefined {
  return tagCategories.find((item) => item.id === id);
}

export function valueById(categoryId: string, valueId: string): TagValue | undefined {
  return categoryById(categoryId)?.values.find((item) => item.id === valueId);
}

export interface ResolvedTag {
  categoryId: string;
  valueId: string;
  category: { text: string; fellBack: boolean };
  value: { text: string; fellBack: boolean };
}

export function resolveTags(
  tags: Record<string, string> | undefined,
  locale: Locale,
): ResolvedTag[] {
  const map = tags ?? {};
  const resolved: ResolvedTag[] = [];
  for (const category of tagCategories) {
    const valueId = map[category.id];
    if (!valueId) continue;
    const value = category.values.find((item) => item.id === valueId);
    if (!value) continue;
    resolved.push({
      categoryId: category.id,
      valueId,
      category: pick(category.label, locale),
      value: pick(value.label, locale),
    });
  }
  return resolved;
}
