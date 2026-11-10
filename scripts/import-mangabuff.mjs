/**
 * Import titles and characters from a MangaBuff export.
 *
 *   node scripts/import-mangabuff.mjs
 *   node scripts/import-mangabuff.mjs --import data/mangabuff/import.json --images /path/to/images
 *
 * import.json is an array of titles. Each title has slug, title_ru, title_alt,
 * description, genres, cover, and characters[{name, slug, main, hover}].
 * source_url and the reading-folder name are never written into the site.
 *
 * A character is written only when the main image exists in --images or was
 * already copied into src/assets/library on a previous run. Re-run this after
 * adding another image batch; characters whose pictures are still missing stay out.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
function flag(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} needs a path.`);
  }
  return path.resolve(root, value);
}

const importPath = flag('--import', path.join(root, 'data', 'mangabuff', 'import.json'));
const imagesDir = flag('--images', path.join(root, 'data', 'mangabuff', 'images'));
const libraryRoot = path.join(root, 'src', 'assets', 'library');
const charactersDir = path.join(root, 'src', 'content', 'characters');
const worksDir = path.join(root, 'src', 'content', 'works');
const reportPath = path.join(root, 'data', 'mangabuff', 'import-report.json');
const sourceRoot = path.join(root, 'src', 'assets', 'source');
const optimizedRoot = path.join(root, 'src', 'assets', 'optimized');
const manifestPath = path.join(optimizedRoot, 'manifest.json');

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CYRILLIC = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const DEMO_KEYS = [
  'characters/kayren-vale',
  'characters/kayren-vale-alt',
  'characters/lien-sol',
  'characters/lien-sol-alt',
  'characters/mira-han',
  'characters/mira-han-alt',
  'characters/nox',
  'characters/nox-alt',
  'characters/orpheus-dal',
  'characters/orpheus-dal-alt',
  'characters/ren-sho',
  'characters/ren-sho-alt',
  'characters/sera-ash',
  'characters/sera-ash-alt',
  'characters/yuna-rek',
  'characters/yuna-rek-alt',
  'works/ash-throne',
  'works/midnight-garden',
  'works/silver-oath',
];

function quote(value) {
  return JSON.stringify(value);
}

function transliterate(input) {
  let out = '';
  for (const char of input.normalize('NFC')) {
    const lower = char.toLowerCase();
    const mapped = CYRILLIC[lower];
    if (mapped === undefined) {
      out += char;
      continue;
    }
    if (!mapped) continue;
    out += char === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
  }
  return out.replace(/\s+/g, ' ').trim();
}

function splitAlt(value) {
  return String(value || '')
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
}

function scripts(value) {
  return {
    latin: (value.match(/[A-Za-z]/g) || []).length,
    cyrillic: (value.match(/[А-Яа-яЁё]/g) || []).length,
    hangul: (value.match(/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/g) || []).length,
  };
}

function isMostlyLatin(value) {
  const count = scripts(value);
  return count.latin >= 2 && count.latin > count.cyrillic && count.latin >= count.hangul;
}

function englishTitle(titleRu, titleAlt) {
  const latin = splitAlt(titleAlt).find(isMostlyLatin);
  return latin || transliterate(titleRu);
}

function originalTitle(titleRu, titleEn, titleAlt) {
  const hangul = splitAlt(titleAlt).find((part) => {
    const count = scripts(part);
    return count.hangul > 0 && count.hangul >= count.latin && count.hangul >= count.cyrillic;
  });
  if (!hangul || hangul === titleRu || hangul === titleEn) return '';
  return hangul;
}

function otherTitles(titleRu, titleEn, original, titleAlt) {
  const skip = new Set([titleRu, titleEn, original].filter(Boolean).map((item) => item.toLowerCase()));
  const titles = [];
  for (const part of splitAlt(titleAlt)) {
    const key = part.toLowerCase();
    if (skip.has(key) || titles.some((item) => item.toLowerCase() === key)) continue;
    titles.push(part);
  }
  return titles;
}

function englishName(name) {
  if (!/[А-Яа-яЁё]/.test(name)) return name.trim();
  return transliterate(name);
}

function imageRel(ref) {
  if (!ref || typeof ref !== 'string') return '';
  const clean = ref.replaceAll('\\', '/').replace(/^\.?\//, '');
  return clean.startsWith('images/') ? clean.slice('images/'.length) : clean;
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function ensureFile(source, dest) {
  if (source && (await exists(source))) {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(source, dest);
    return true;
  }
  return exists(dest);
}

async function emptyMarkdown(dir) {
  await fs.mkdir(dir, { recursive: true });
  const entries = await fs.readdir(dir);
  await Promise.all(
    entries.filter((name) => name.endsWith('.md')).map((name) => fs.rm(path.join(dir, name))),
  );
}

function workDocument(work) {
  const lines = ['---', 'title:', `  ru: ${quote(work.titleRu)}`, `  en: ${quote(work.titleEn)}`];
  if (work.original) lines.push(`originalTitle: ${quote(work.original)}`);
  if (work.altTitles.length) {
    lines.push('altTitles:');
    for (const title of work.altTitles) lines.push(`  - ${quote(title)}`);
  }
  lines.push('description:', `  ru: ${quote(work.description)}`);
  if (work.cover) lines.push(`cover: ${quote(work.cover)}`);
  if (work.genres.length) {
    lines.push('genres:');
    for (const genre of work.genres) lines.push(`  - ${quote(genre)}`);
  }
  lines.push('---', '');
  return `${lines.join('\n')}\n`;
}

function characterDocument(character) {
  const lines = [
    '---',
    'name:',
    `  ru: ${quote(character.nameRu)}`,
    `  en: ${quote(character.nameEn)}`,
    `work: ${quote(character.workSlug)}`,
    `image: ${quote(character.image)}`,
  ];
  if (character.hover) lines.push(`hoverImage: ${quote(character.hover)}`);
  lines.push('---', '');
  return `${lines.join('\n')}\n`;
}

async function removeDemoPlaceholders() {
  for (const key of DEMO_KEYS) {
    const source = path.join(sourceRoot, `${key}.png`);
    await fs.rm(source, { force: true });
    await fs.rm(path.join(optimizedRoot, `${key}.webp`), { force: true });
    await fs.rm(path.join(optimizedRoot, `${key}.avif`), { force: true });
  }
  let manifest = { version: 2, files: {} };
  try {
    manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  } catch {
    return;
  }
  if (!manifest.files || typeof manifest.files !== 'object') return;
  for (const key of DEMO_KEYS) delete manifest.files[key];
  const files = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)));
  await fs.writeFile(manifestPath, `${JSON.stringify({ ...manifest, files }, null, 2)}\n`);
}

async function removeUnreferenced(expected) {
  async function walk(dir) {
    let entries = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (error) {
      if (error && error.code === 'ENOENT') return [];
      throw error;
    }
    const files = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) files.push(...(await walk(full)));
      else files.push(full);
    }
    return files;
  }
  let removed = 0;
  for (const file of await walk(libraryRoot)) {
    const rel = path.relative(libraryRoot, file).split(path.sep).join('/');
    if (!expected.has(rel)) {
      await fs.rm(file, { force: true });
      removed += 1;
    }
  }
  return removed;
}

function claimId(preferred, used) {
  let id = preferred;
  let n = 2;
  while (used.has(id) || !SLUG.test(id)) {
    id = `${preferred}-${n}`;
    n += 1;
    if (n > 50) throw new Error(`Could not make a unique id for "${preferred}".`);
  }
  used.add(id);
  return id;
}

async function main() {
  const raw = JSON.parse(await fs.readFile(importPath, 'utf8'));
  if (!Array.isArray(raw)) throw new Error('import.json must be an array of titles.');

  const candidates = [];
  const skipped = [];
  const works = [];

  for (const title of raw) {
    const workSlug = String(title.slug || '').trim();
    const titleRu = String(title.title_ru || '').trim();
    if (!SLUG.test(workSlug) || !titleRu) {
      skipped.push({ kind: 'work', slug: workSlug || '(empty)', reason: 'invalid slug or title' });
      continue;
    }
    const titleEn = englishTitle(titleRu, title.title_alt);
    const original = originalTitle(titleRu, titleEn, title.title_alt);
    const description = String(title.description || '').replace(/\s+/g, ' ').trim() || titleRu;
    const genres = Array.isArray(title.genres)
      ? [...new Set(title.genres.map((genre) => String(genre).trim()).filter(Boolean))]
      : [];
    works.push({
      slug: workSlug,
      titleRu,
      titleEn,
      original,
      altTitles: otherTitles(titleRu, titleEn, original, title.title_alt),
      description,
      genres,
      coverRef: imageRel(title.cover),
    });
    for (const character of title.characters || []) {
      const slug = String(character.slug || '').trim();
      const nameRu = String(character.name || '').trim();
      if (!SLUG.test(slug) || !nameRu) {
        skipped.push({ kind: 'character', slug: `${workSlug}/${slug || '(empty)'}`, reason: 'invalid slug or name' });
        continue;
      }
      candidates.push({
        workSlug,
        slug,
        nameRu,
        nameEn: englishName(nameRu),
        mainRef: imageRel(character.main),
        hoverRef: imageRel(character.hover),
      });
    }
  }

  const ready = [];
  for (const character of candidates) {
    const mainSource = character.mainRef ? path.join(imagesDir, character.mainRef) : '';
    const dest = path.join(libraryRoot, 'characters', `${character.workSlug}-${character.slug}.webp`);
    const mainAvailable = (mainSource && (await exists(mainSource))) || (await exists(dest));
    if (!mainAvailable) {
      skipped.push({ kind: 'character', slug: `${character.workSlug}/${character.slug}`, reason: 'missing main image' });
      continue;
    }
    ready.push(character);
  }

  const charactersInFile = raw.reduce((sum, title) => sum + (Array.isArray(title.characters) ? title.characters.length : 0), 0);
  const usedIds = new Set();
  const expected = new Set();
  let copied = 0;
  let covers = 0;

  await emptyMarkdown(charactersDir);
  await emptyMarkdown(worksDir);
  await removeDemoPlaceholders();

  for (const work of works) {
    const coverDest = path.join(libraryRoot, 'works', `${work.slug}.webp`);
    const coverSource = work.coverRef ? path.join(imagesDir, work.coverRef) : '';
    const hasCover = await ensureFile(coverSource, coverDest);
    if (hasCover) {
      work.cover = `../../assets/library/works/${work.slug}.webp`;
      expected.add(`works/${work.slug}.webp`);
      if (coverSource && (await exists(coverSource))) copied += 1;
      covers += 1;
    } else {
      work.cover = '';
    }
    await fs.writeFile(path.join(worksDir, `${work.slug}.md`), workDocument(work));
  }

  const writtenCharacters = [];
  for (const character of ready) {
    const id = claimId(`${character.workSlug}-${character.slug}`, usedIds);
    const mainDest = path.join(libraryRoot, 'characters', `${id}.webp`);
    const hoverDest = path.join(libraryRoot, 'characters', `${id}-alt.webp`);
    const mainSource = character.mainRef ? path.join(imagesDir, character.mainRef) : '';
    const hoverSource = character.hoverRef ? path.join(imagesDir, character.hoverRef) : '';
    const hasMain = await ensureFile(mainSource, mainDest);
    if (!hasMain) {
      skipped.push({ kind: 'character', slug: `${character.workSlug}/${character.slug}`, reason: 'missing main image' });
      continue;
    }
    if (mainSource && (await exists(mainSource))) copied += 1;
    expected.add(`characters/${id}.webp`);
    const hasHover = await ensureFile(hoverSource, hoverDest);
    if (hoverSource && hasHover && (await exists(hoverSource))) copied += 1;
    if (hasHover) expected.add(`characters/${id}-alt.webp`);
    const doc = {
      ...character,
      id,
      image: `../../assets/library/characters/${id}.webp`,
      hover: hasHover ? `../../assets/library/characters/${id}-alt.webp` : '',
    };
    await fs.writeFile(path.join(charactersDir, `${id}.md`), characterDocument(doc));
    writtenCharacters.push(doc);
  }

  const removed = await removeUnreferenced(expected);
  const report = {
    importedAt: new Date().toISOString(),
    titlesInFile: raw.length,
    titlesWritten: works.length,
    coversWritten: covers,
    charactersInFile,
    charactersWritten: writtenCharacters.length,
    charactersSkipped: skipped.filter((item) => item.kind === 'character').length,
    imagesCopied: copied,
    libraryFilesRemoved: removed,
    skipped,
  };
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `import: ${report.titlesWritten} titles (${report.coversWritten} covers), ${report.charactersWritten} characters, ${report.charactersSkipped} characters skipped, ${report.imagesCopied} images copied`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
