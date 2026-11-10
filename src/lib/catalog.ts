import { getCollection, type CollectionEntry } from 'astro:content';
import { assertTagVocabulary, tagError } from '../data/tags';

export type WorkEntry = CollectionEntry<'works'>;
export type CharacterEntry = CollectionEntry<'characters'>;

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertSlug(id: string, kind: string): void {
  if (!slug.test(id)) {
    throw new Error(
      `${kind} file "${id}" must be named with a lowercase latin slug, for example lien-sol.md.`,
    );
  }
}

function assertWebp(format: string, id: string, field: string): void {
  if (format !== 'webp') {
    throw new Error(
      `${id}: ${field} must point at an optimized .webp in src/assets/optimized/. Run npm run images and use the generated WebP, not the source JPG/PNG.`,
    );
  }
}

export interface Catalog {
  works: WorkEntry[];
  characters: CharacterEntry[];
  worksById: Map<string, WorkEntry>;
  charactersByWork: Map<string, CharacterEntry[]>;
}

let cache: Promise<Catalog> | null = null;

async function load(): Promise<Catalog> {
  assertTagVocabulary();
  const allWorks = await getCollection('works');
  const allCharacters = await getCollection('characters');
  const worksById = new Map<string, WorkEntry>();

  for (const work of allWorks) {
    assertSlug(work.id, 'Work');
    if (worksById.has(work.id)) throw new Error(`Duplicate work id "${work.id}".`);
    worksById.set(work.id, work);
    assertWebp(work.data.cover.format, work.id, 'cover');
  }

  const seenCharacters = new Set<string>();
  for (const character of allCharacters) {
    assertSlug(character.id, 'Character');
    if (seenCharacters.has(character.id)) throw new Error(`Duplicate character id "${character.id}".`);
    seenCharacters.add(character.id);
    assertWebp(character.data.image.format, character.id, 'image');
    if (character.data.hoverImage) assertWebp(character.data.hoverImage.format, character.id, 'hoverImage');
    if (character.data.imageAlt) assertWebp(character.data.imageAlt.format, character.id, 'imageAlt');
    const work = worksById.get(character.data.work);
    if (!work) {
      throw new Error(
        `Character "${character.id}" references unknown work "${character.data.work}". Create src/content/works/${character.data.work}.md or fix the work field.`,
      );
    }
    if (character.data.draft !== true && work.data.draft === true) {
      throw new Error(
        `Character "${character.id}" is public, but work "${character.data.work}" is a draft.`,
      );
    }
    for (const [categoryId, valueId] of Object.entries(character.data.tags ?? {})) {
      const issue = tagError(categoryId, valueId);
      if (issue) throw new Error(`Character "${character.id}": ${issue}`);
    }
  }

  const works = allWorks.filter((work) => work.data.draft !== true);
  const characters = allCharacters.filter((character) => character.data.draft !== true);
  const publicIds = new Set(works.map((work) => work.id));
  const charactersByWork = new Map<string, CharacterEntry[]>();
  for (const character of characters) {
    if (!publicIds.has(character.data.work)) continue;
    const list = charactersByWork.get(character.data.work) ?? [];
    list.push(character);
    charactersByWork.set(character.data.work, list);
  }

  return {
    works,
    characters,
    worksById: new Map(works.map((work) => [work.id, work])),
    charactersByWork,
  };
}

export function getCatalog(): Promise<Catalog> {
  if (!cache) cache = load();
  return cache;
}
