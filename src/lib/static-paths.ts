import { getCatalog } from './catalog';
import { tagCategories } from '../data/tags';

export async function characterPaths() {
  const { characters } = await getCatalog();
  return characters.map((character) => ({ params: { slug: character.id } }));
}

export async function workPaths() {
  const { works } = await getCatalog();
  return works.map((work) => ({ params: { slug: work.id } }));
}

export function tagCategoryPaths() {
  return tagCategories.map((category) => ({ params: { category: category.id } }));
}

export function tagValuePaths() {
  return tagCategories.flatMap((category) =>
    category.values.map((value) => ({
      params: { category: category.id, value: value.id },
    })),
  );
}
