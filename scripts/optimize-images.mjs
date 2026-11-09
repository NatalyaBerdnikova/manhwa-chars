/**
 * Converts source JPG/PNG masters into optimized WebP and AVIF.
 *
 *   npm run images            process every file in src/assets/source
 *   npm run images:check      fail if any source is missing its optimized pair
 *   node scripts/optimize-images.mjs --staged
 *                             pre-commit: only staged sources, then git-add outputs
 *   node scripts/optimize-images.mjs --force
 *                             re-encode even when the hash matches
 *
 * Idempotent: a source is skipped when manifest.json records the same SHA-256
 * and settings version and both output files already exist.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'src', 'assets', 'source');
const outputRoot = path.join(root, 'src', 'assets', 'optimized');
const manifestPath = path.join(outputRoot, 'manifest.json');

const SETTINGS = {
  version: 1,
  maxEdge: 1600,
  webpQuality: 78,
  avifQuality: 50,
};

const SOURCE_EXT = new Set(['.jpg', '.jpeg', '.png']);
const args = new Set(process.argv.slice(2));
const stagedOnly = args.has('--staged');
const checkOnly = args.has('--check');
const force = args.has('--force');

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function gitPaths(diffFilter) {
  const result = spawnSync('git', ['diff', '--cached', '--name-only', `--diff-filter=${diffFilter}`, '-z'], {
    cwd: root,
    encoding: 'buffer',
  });
  if (result.status !== 0) {
    const detail = result.stderr?.toString() || 'git diff failed';
    throw new Error(detail.trim());
  }
  return result.stdout
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .map((file) => file.replaceAll('\\', '/'));
}

async function walk(dir) {
  let entries;
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

function relFromSource(file) {
  return toPosix(path.relative(sourceRoot, file));
}

function isSourceImage(rel) {
  const normalized = rel.replaceAll('\\', '/');
  if (!normalized.startsWith('src/assets/source/')) return false;
  return SOURCE_EXT.has(path.posix.extname(normalized).toLowerCase());
}

function outputKey(rel) {
  const ext = path.posix.extname(rel);
  return rel.slice(0, -ext.length);
}

async function sha256(file) {
  const data = await fs.readFile(file);
  return createHash('sha256').update(data).digest('hex');
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function readManifest() {
  try {
    const raw = await fs.readFile(manifestPath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      version: SETTINGS.version,
      files: parsed.files && typeof parsed.files === 'object' ? parsed.files : {},
    };
  } catch (error) {
    if (error && error.code === 'ENOENT') return { version: SETTINGS.version, files: {} };
    throw error;
  }
}

function serializeManifest(manifest) {
  const files = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => a.localeCompare(b)));
  return `${JSON.stringify({ version: SETTINGS.version, settings: SETTINGS, files }, null, 2)}\n`;
}

async function convert(sourceFile, key) {
  const { default: sharp } = await import('sharp');
  const input = await fs.readFile(sourceFile);
  const resized = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize({
      width: SETTINGS.maxEdge,
      height: SETTINGS.maxEdge,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer({ resolveWithObject: true });

  const webpRel = `${key}.webp`;
  const avifRel = `${key}.avif`;
  const webpPath = path.join(outputRoot, ...webpRel.split('/'));
  const avifPath = path.join(outputRoot, ...avifRel.split('/'));
  await fs.mkdir(path.dirname(webpPath), { recursive: true });

  await sharp(resized.data).webp({ quality: SETTINGS.webpQuality, effort: 4 }).toFile(webpPath);
  await sharp(resized.data).avif({ quality: SETTINGS.avifQuality, effort: 4 }).toFile(avifPath);

  return {
    sourceSha256: await sha256(sourceFile),
    settingsVersion: SETTINGS.version,
    webp: webpRel,
    avif: avifRel,
    width: resized.info.width,
    height: resized.info.height,
  };
}

async function removeOutputs(entry) {
  if (!entry) return;
  for (const rel of [entry.webp, entry.avif]) {
    if (!rel) continue;
    await fs.rm(path.join(outputRoot, ...rel.split('/')), { force: true });
  }
}

function gitAdd(paths) {
  if (paths.length === 0) return;
  const result = spawnSync('git', ['add', '--', ...paths], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  const manifest = await readManifest();
  /** @type {string[]} */
  const problems = [];
  /** @type {string[]} */
  const toStage = [];
  let converted = 0;
  let skipped = 0;
  let removed = 0;

  /** @type {Map<string, string>} key -> absolute source */
  const jobs = new Map();

  if (stagedOnly) {
    const added = gitPaths('ACMR').filter(isSourceImage);
    const deleted = gitPaths('D').filter(isSourceImage);
    if (added.length === 0 && deleted.length === 0) {
      console.log('images: no staged jpg/png sources');
      return;
    }
    for (const rel of added) {
      const key = outputKey(rel.slice('src/assets/source/'.length));
      jobs.set(key, path.join(root, ...rel.split('/')));
    }
    for (const rel of deleted) {
      const key = outputKey(rel.slice('src/assets/source/'.length));
      const entry = manifest.files[key];
      await removeOutputs(entry);
      if (entry) {
        delete manifest.files[key];
        removed += 1;
        if (entry.webp) toStage.push(toPosix(path.join('src', 'assets', 'optimized', entry.webp)));
        if (entry.avif) toStage.push(toPosix(path.join('src', 'assets', 'optimized', entry.avif)));
      }
    }
  } else {
    const files = await walk(sourceRoot);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!SOURCE_EXT.has(ext)) continue;
      jobs.set(relFromSource(file).replace(/\.[^.]+$/, ''), file);
    }
  }

  for (const [key, sourceFile] of jobs) {
    const hash = await sha256(sourceFile);
    const current = manifest.files[key];
    const webpPath = path.join(outputRoot, `${key}.webp`);
    const avifPath = path.join(outputRoot, `${key}.avif`);
    const fresh =
      !force &&
      current &&
      current.sourceSha256 === hash &&
      current.settingsVersion === SETTINGS.version &&
      (await exists(webpPath)) &&
      (await exists(avifPath));

    if (checkOnly) {
      if (!fresh) problems.push(`${key}: run npm run images (source changed or optimized files are missing)`);
      continue;
    }

    if (fresh) {
      skipped += 1;
    } else {
      manifest.files[key] = await convert(sourceFile, key);
      manifest.files[key].sourceSha256 = hash;
      converted += 1;
      console.log(`images: wrote ${key}.webp and ${key}.avif`);
    }
    toStage.push(
      toPosix(path.join('src', 'assets', 'optimized', `${key}.webp`)),
      toPosix(path.join('src', 'assets', 'optimized', `${key}.avif`)),
    );
  }

  if (!stagedOnly && !checkOnly) {
    const expected = new Set();
    for (const entry of Object.values(manifest.files)) {
      if (entry.webp) expected.add(entry.webp);
      if (entry.avif) expected.add(entry.avif);
    }
    const outputs = await walk(outputRoot);
    for (const file of outputs) {
      if (path.basename(file) === 'manifest.json') continue;
      const outRel = toPosix(path.relative(outputRoot, file));
      if (!expected.has(outRel)) {
        await fs.rm(file, { force: true });
        removed += 1;
        console.log(`images: removed orphan ${outRel}`);
      }
    }
    const liveKeys = new Set(jobs.keys());
    for (const key of Object.keys(manifest.files)) {
      if (!liveKeys.has(key)) {
        await removeOutputs(manifest.files[key]);
        delete manifest.files[key];
        removed += 1;
      }
    }
  }

  if (checkOnly) {
    const live = await walk(sourceRoot);
    const liveKeys = new Set(
      live
        .filter((file) => SOURCE_EXT.has(path.extname(file).toLowerCase()))
        .map((file) => relFromSource(file).replace(/\.[^.]+$/, '')),
    );
    for (const key of Object.keys(manifest.files)) {
      if (!liveKeys.has(key)) problems.push(`${key}: manifest entry has no source file`);
    }
    const outputs = await walk(outputRoot);
    const expected = new Set(['manifest.json']);
    for (const entry of Object.values(manifest.files)) {
      if (entry.webp) expected.add(entry.webp);
      if (entry.avif) expected.add(entry.avif);
    }
    for (const file of outputs) {
      const outRel = toPosix(path.relative(outputRoot, file));
      if (!expected.has(outRel)) problems.push(`${outRel}: orphan optimized file`);
    }
    if (problems.length) {
      console.error('images: optimized masters are out of date');
      for (const problem of problems) console.error(`  - ${problem}`);
      process.exit(1);
    }
    console.log(`images: check ok (${liveKeys.size} sources)`);
    return;
  }

  const nextManifest = serializeManifest(manifest);
  let previous = '';
  try {
    previous = await fs.readFile(manifestPath, 'utf8');
  } catch {
    previous = '';
  }
  if (previous !== nextManifest) {
    await fs.mkdir(outputRoot, { recursive: true });
    await fs.writeFile(manifestPath, nextManifest);
  }

  console.log(`images: ${converted} converted, ${skipped} skipped, ${removed} removed`);

  if (stagedOnly) {
    toStage.push('src/assets/optimized/manifest.json');
    gitAdd([...new Set(toStage)]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
