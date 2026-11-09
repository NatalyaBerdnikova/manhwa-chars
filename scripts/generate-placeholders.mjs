/**
 * Draws original placeholder illustrations (not traced from any comic)
 * into src/assets/source. Character files are full-body cutouts with a
 * transparent background, plus a hover pose (`*-alt.png`).
 * Run `npm run images` afterwards.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src', 'assets', 'source');

/**
 * Full-body cutout on a transparent canvas. No background rect: the PNG
 * keeps an alpha channel so the figure can stand on the podium and pop
 * out of a product tile. `pose: "alt"` is the hover variant.
 */
function figure(p) {
  const alt = p.pose === 'alt';
  const g = p.gaze || 0;
  const smile = alt ? 28 : 16;
  const hairBack = {
    long: `<path d="M300 250 C250 340 214 560 236 980 L318 980 C300 620 330 390 360 300 Z" fill="${p.hair}"/>
      <path d="M420 250 C470 340 506 560 484 980 L402 980 C420 620 390 390 360 300 Z" fill="${p.hair}"/>`,
    waves: `<path d="M292 260 C230 360 200 560 250 900 C300 820 270 640 320 520 C300 420 310 320 340 270 Z" fill="${p.hair}"/>
      <path d="M428 260 C490 360 520 560 470 900 C420 820 450 640 400 520 C420 420 410 320 380 270 Z" fill="${p.hair}"/>`,
    side: `<path d="M300 280 C230 360 210 560 248 860 C300 760 270 560 330 420 C310 340 300 300 330 270 Z" fill="${p.hair}"/>`,
    bob: `<path d="M278 236 C262 146 468 140 462 246 L448 338 C400 358 314 358 278 336 Z" fill="${p.hair}"/>`,
    bun: `<path d="M286 270 C278 160 450 150 452 280 C430 230 310 230 286 280 Z" fill="${p.hair}"/>`,
    short: `<path d="M292 275 C286 155 448 150 446 285 C420 230 314 228 292 280 Z" fill="${p.hair}"/>`,
  }[p.style];

  const scalp = `<ellipse cx="360" cy="162" rx="86" ry="40" fill="${p.hair}"/>`;
  const hairFront = {
    long: `${scalp}<path d="M292 210 C310 132 420 128 446 214 C400 176 322 176 292 220 Z" fill="${p.hair}"/>
      <path d="M286 220 C268 300 274 390 314 450" stroke="${p.hair}" stroke-width="30" stroke-linecap="round" fill="none"/>
      <path d="M448 214 C470 300 462 390 420 450" stroke="${p.hair}" stroke-width="30" stroke-linecap="round" fill="none"/>`,
    waves: `${scalp}<path d="M300 205 C318 140 418 136 438 214 C396 180 328 180 300 214 Z" fill="${p.hair}"/>
      <path d="M292 230 C250 310 268 420 320 470" stroke="${p.hair}" stroke-width="26" stroke-linecap="round" fill="none"/>
      <path d="M440 220 C478 310 460 430 410 480" stroke="${p.hair}" stroke-width="26" stroke-linecap="round" fill="none"/>`,
    side: `${scalp}<path d="M318 214 C300 150 450 142 458 240 C410 190 340 196 312 230 Z" fill="${p.hair}"/>
      <path d="M304 250 C250 340 236 500 276 680" stroke="${p.hair}" stroke-width="36" stroke-linecap="round" fill="none"/>`,
    bob: `${scalp}<path d="M300 196 C328 150 408 148 434 204 C390 176 332 176 300 206 Z" fill="${p.hair}"/>`,
    bun: `${scalp}<path d="M300 200 C322 146 430 150 440 214 C396 180 326 180 300 214 Z" fill="${p.hair}"/>
      <circle cx="456" cy="168" r="34" fill="${p.hair}"/>
      <circle cx="456" cy="168" r="11" fill="${p.accent}"/>`,
    short: `${scalp}<path d="M304 214 C314 148 430 146 438 230 C400 188 328 190 304 222 Z" fill="${p.hair}"/>
      <path d="M292 248 C286 290 300 320 324 330" stroke="${p.hair}" stroke-width="16" stroke-linecap="round" fill="none"/>`,
  }[p.style];

  const floor = p.garment === 'dress' || p.garment === 'robe';
  const hem = floor ? 1120 : p.garment === 'uniform' ? 860 : 980;
  const garment =
    p.garment === 'dress' || p.garment === 'robe'
      ? `<path d="M262 400 C236 470 214 620 196 ${hem} H524 C506 620 484 470 458 400 C430 434 290 434 262 400 Z" fill="${p.cloth}"/>
         <path d="M330 396 L360 470 L390 396" fill="${p.skin}"/>
         <path d="M248 470 C300 520 420 520 472 470 L500 ${hem - 40} H220 Z" fill="${p.cloth2}" opacity="0.28"/>`
      : `<path d="M268 396 L250 ${hem} H470 L452 396 Q360 438 268 396 Z" fill="${p.cloth}"/>
         <path d="M338 400 L360 468 L382 400" fill="${p.skin}"/>
         <path d="M352 520 H368 V${hem} H352 Z" fill="${p.cloth2}"/>`;

  const legs = floor
    ? ''
    : `<path d="M292 ${hem - 20} L276 1188 H348 L356 ${hem} Z" fill="${p.leg}"/>
       <path d="M364 ${hem} L372 1188 H444 L428 ${hem - 20} Z" fill="${p.leg}"/>`;

  const shoes = `<ellipse cx="312" cy="${floor ? 1136 : 1204}" rx="46" ry="16" fill="${p.shoe}"/>
    <ellipse cx="408" cy="${floor ? 1136 : 1204}" rx="46" ry="16" fill="${p.shoe}"/>`;

  const sleeve = p.cloth;
  const arms = alt
    ? `<path d="M268 430 C200 360 168 280 214 214" stroke="${sleeve}" stroke-width="34" stroke-linecap="round" fill="none"/>
       <circle cx="214" cy="200" r="15" fill="${p.skin}"/>
       <path d="M456 440 C530 510 508 660 442 730" stroke="${sleeve}" stroke-width="34" stroke-linecap="round" fill="none"/>
       <circle cx="430" cy="742" r="15" fill="${p.skin}"/>`
    : `<path d="M262 424 C196 530 184 700 224 860" stroke="${sleeve}" stroke-width="34" stroke-linecap="round" fill="none"/>
       <circle cx="224" cy="874" r="15" fill="${p.skin}"/>
       <path d="M458 424 C524 530 536 700 496 860" stroke="${sleeve}" stroke-width="34" stroke-linecap="round" fill="none"/>
       <circle cx="496" cy="874" r="15" fill="${p.skin}"/>`;

  const prop =
    alt && p.prop === 'blade'
      ? `<path d="M188 210 L156 560" stroke="#f4f7fb" stroke-width="8" stroke-linecap="round"/>
         <path d="M146 196 H196" stroke="${p.accent}" stroke-width="7" stroke-linecap="round"/>`
      : alt && p.prop === 'book'
        ? `<g transform="rotate(-16 188 230)">
             <rect x="154" y="188" width="58" height="74" rx="3" fill="#f7f3ea" stroke="${p.brow}" stroke-width="3"/>
             <path d="M183 188 V262" stroke="${p.brow}" stroke-width="2"/>
           </g>`
        : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
  <g transform="${alt ? 'translate(16 0)' : ''}">
    ${hairBack}
    ${legs}
    ${garment}
    ${shoes}
    ${p.belt || ''}
    ${arms}
    ${prop}
    <g transform="${alt ? 'rotate(-8 360 236)' : ''}">
      <ellipse cx="286" cy="250" rx="16" ry="22" fill="${p.skin}"/>
      <ellipse cx="434" cy="250" rx="16" ry="22" fill="${p.skin}"/>
      <path d="M338 300 H382 L376 438 H344 Z" fill="${p.skin}"/>
      <ellipse cx="360" cy="236" rx="82" ry="96" fill="${p.skin}"/>
      <ellipse cx="318" cy="268" rx="20" ry="11" fill="${p.blush}" opacity="0.75"/>
      <ellipse cx="402" cy="268" rx="20" ry="11" fill="${p.blush}" opacity="0.75"/>
      <path d="M300 196 Q332 180 362 198" stroke="${p.brow}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M358 198 Q390 180 422 196" stroke="${p.brow}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="${322 + g}" cy="236" rx="26" ry="15" fill="#fffaf6"/>
      <ellipse cx="${398 + g}" cy="236" rx="26" ry="15" fill="#fffaf6"/>
      <circle cx="${324 + g}" cy="237" r="8.5" fill="${p.eye}"/>
      <circle cx="${400 + g}" cy="237" r="8.5" fill="${p.eye}"/>
      <circle cx="${324 + g}" cy="237" r="4.2" fill="#1b1714"/>
      <circle cx="${400 + g}" cy="237" r="4.2" fill="#1b1714"/>
      <circle cx="${328 + g}" cy="234" r="2.1" fill="#fff"/>
      <circle cx="${404 + g}" cy="234" r="2.1" fill="#fff"/>
      <path d="M360 248 Q356 286 364 304" stroke="${p.skinShadow}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M332 312 Q360 ${312 + smile} 388 312" stroke="${p.lip}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      ${hairFront}
      ${p.jewel || ''}
    </g>
  </g>
</svg>`;
}

function cover(kind) {
  if (kind === 'silver') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
      <rect width="900" height="1200" fill="#d5e0ea"/>
      <rect x="0" y="0" width="900" height="1200" fill="#edf3f7" opacity="0.55"/>
      <circle cx="450" cy="560" r="250" fill="none" stroke="#f7fbff" stroke-width="28"/>
      <circle cx="450" cy="560" r="168" fill="none" stroke="#8ea0b0" stroke-width="10"/>
      <path d="M450 180 V1020" stroke="#f4f8fb" stroke-width="8"/>
      <circle cx="450" cy="300" r="36" fill="#f7fbff"/>
      <circle cx="620" cy="860" r="18" fill="#8ea0b0"/>
      <rect x="32" y="32" width="836" height="1136" rx="40" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="3"/>
    </svg>`;
  }
  if (kind === 'garden') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
      <rect width="900" height="1200" fill="#16302b"/>
      <path d="M180 980 V430 Q180 180 450 180 Q720 180 720 430 V980" fill="none" stroke="#d7e6cf" stroke-width="18"/>
      <ellipse cx="450" cy="980" rx="280" ry="46" fill="#0f241f"/>
      <g fill="#f4f1e6">
        <circle cx="340" cy="640" r="22"/>
        <circle cx="530" cy="560" r="14"/>
        <circle cx="470" cy="740" r="28"/>
        <circle cx="610" cy="700" r="10"/>
      </g>
      <g fill="#e7b7b0">
        <circle cx="400" cy="500" r="9"/>
        <circle cx="250" cy="720" r="7"/>
      </g>
      <rect x="32" y="32" width="836" height="1136" rx="40" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="3"/>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
    <rect width="900" height="1200" fill="#2c2624"/>
    <path d="M250 1040 L330 520 H570 L650 1040 Z" fill="#3e3430"/>
    <path d="M360 470 H540 V390 H500 V330 H470 V390 H400 V330 H370 V390 H360 Z" fill="#e6c27a"/>
    <path d="M430 390 H470 V250 H430 Z" fill="#e6c27a"/>
    <circle cx="300" cy="860" r="16" fill="#e07a4a" opacity="0.9"/>
    <circle cx="620" cy="780" r="22" fill="#e07a4a" opacity="0.75"/>
    <circle cx="480" cy="960" r="10" fill="#f0b2a4" opacity="0.8"/>
    <circle cx="210" cy="280" r="70" fill="#5a4038" opacity="0.7"/>
    <rect x="32" y="32" width="836" height="1136" rx="40" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3"/>
  </svg>`;
}

function og() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#f3eee4"/>
    <rect width="460" height="630" fill="#1d1915"/>
    <path d="M120 390 C200 250 280 210 360 250" fill="none" stroke="#f3eee4" stroke-width="16" stroke-linecap="round"/>
    <circle cx="760" cy="250" r="90" fill="#8d3428"/>
    <circle cx="980" cy="430" r="46" fill="#e7d8c4"/>
  </svg>`;
}

function icon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="8" fill="#1d1915"/>
    <path d="M8.5 21.5c2.4-5.4 4.6-8 8-8 2.6 0 4 1.6 5.2 3.6" fill="none" stroke="#f3eee4" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="22.2" cy="10.5" r="2.3" fill="#e07a68"/>
  </svg>`;
}

const people = [
  {
    file: 'characters/lien-sol.png',
    style: 'long',
    garment: 'coat',
    hair: '#e4e8ee',
    skin: '#f3d5c6',
    skinShadow: '#e0b39d',
    blush: '#e7b1a0',
    eye: '#7d868e',
    brow: '#9aa2ab',
    lip: '#c47d74',
    cloth: '#3e4c5c',
    cloth2: '#c5d0dc',
    leg: '#2c3848',
    shoe: '#1c242e',
    accent: '#f7fbff',
    gaze: 0,
    prop: 'blade',
    jewel: `<path d="M300 168 Q360 142 420 168" fill="none" stroke="#f7fbff" stroke-width="6" stroke-linecap="round"/>`,
  },
  {
    file: 'characters/kayren-vale.png',
    style: 'short',
    garment: 'coat',
    hair: '#1c1a1a',
    skin: '#e7b892',
    skinShadow: '#c98b62',
    blush: '#d98974',
    eye: '#c47a2a',
    brow: '#2a2422',
    lip: '#a85a52',
    cloth: '#2a2422',
    cloth2: '#c6a15a',
    leg: '#1a1818',
    shoe: '#111',
    accent: '#c6a15a',
    gaze: 2,
    prop: '',
    belt: `<path d="M268 760 H452" stroke="#c6a15a" stroke-width="8" stroke-linecap="round"/>`,
  },
  {
    file: 'characters/yuna-rek.png',
    style: 'bob',
    garment: 'dress',
    hair: '#6d4b34',
    skin: '#f0cbb4',
    skinShadow: '#d9a88c',
    blush: '#e8a898',
    eye: '#3f6b45',
    brow: '#5a3b2a',
    lip: '#c47870',
    cloth: '#f6f1e6',
    cloth2: '#d7e3c4',
    leg: '#f6f1e6',
    shoe: '#c4b39a',
    accent: '#d7e3c4',
    gaze: -2,
    prop: 'book',
    jewel: `<circle cx="438" cy="176" r="7" fill="#d7e3c4"/>`,
  },
  {
    file: 'characters/mira-han.png',
    style: 'bun',
    garment: 'dress',
    hair: '#3a2a22',
    skin: '#e8c0a4',
    skinShadow: '#c99678',
    blush: '#d98978',
    eye: '#2f6a45',
    brow: '#2a211c',
    lip: '#b86a62',
    cloth: '#234038',
    cloth2: '#d5e6c8',
    leg: '#234038',
    shoe: '#14241f',
    accent: '#d5e6c8',
    gaze: 0,
    prop: '',
    jewel: `<ellipse cx="492" cy="150" rx="14" ry="8" fill="#d5e6c8" transform="rotate(-24 492 150)"/>
      <circle cx="486" cy="150" r="4" fill="#e7b7b0"/>`,
  },
  {
    file: 'characters/nox.png',
    style: 'short',
    garment: 'coat',
    hair: '#f4f1ea',
    skin: '#f6e4da',
    skinShadow: '#e3c3b6',
    blush: '#e7b0b4',
    eye: '#a33b45',
    brow: '#d9d3cc',
    lip: '#a84a55',
    cloth: '#141216',
    cloth2: '#c98b98',
    leg: '#0e0c10',
    shoe: '#0a090b',
    accent: '#c98b98',
    gaze: 3,
    prop: '',
  },
  {
    file: 'characters/sera-ash.png',
    style: 'waves',
    garment: 'dress',
    hair: '#8a4030',
    skin: '#f0c8b0',
    skinShadow: '#d7a88c',
    blush: '#e09080',
    eye: '#c4963a',
    brow: '#6a3024',
    lip: '#b85a52',
    cloth: '#6e2e28',
    cloth2: '#e6c27a',
    leg: '#6e2e28',
    shoe: '#3a1816',
    accent: '#e6c27a',
    gaze: 0,
    prop: '',
    jewel: `<path d="M306 164 Q360 140 414 164" fill="none" stroke="#e6c27a" stroke-width="6" stroke-linecap="round"/>`,
  },
  {
    file: 'characters/ren-sho.png',
    style: 'side',
    garment: 'uniform',
    hair: '#1a1c22',
    skin: '#efcbb8',
    skinShadow: '#d7aa92',
    blush: '#e4a090',
    eye: '#3a5f8a',
    brow: '#1a1c22',
    lip: '#b86e68',
    cloth: '#2c3a4e',
    cloth2: '#8eacc4',
    leg: '#1e2a3a',
    shoe: '#141a24',
    accent: '#8eacc4',
    gaze: -3,
    prop: '',
  },
  {
    file: 'characters/orpheus-dal.png',
    style: 'long',
    garment: 'robe',
    hair: '#16141c',
    skin: '#f3d3c4',
    skinShadow: '#e0b5a2',
    blush: '#e3a498',
    eye: '#6d4f90',
    brow: '#241e2c',
    lip: '#a86a78',
    cloth: '#cfc6d8',
    cloth2: '#8a7e9c',
    leg: '#cfc6d8',
    shoe: '#2a2434',
    accent: '#d5cbe2',
    gaze: 1,
    prop: '',
    jewel: `<rect x="430" y="156" width="36" height="10" rx="5" fill="#d5cbe2"/>`,
  },
];

async function writeSvg(file, svg, width, height) {
  const dest = path.join(source, file);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await sharp(Buffer.from(svg)).resize(width, height).png().toFile(dest);
  console.log(`placeholders: ${file}`);
}

await writeSvg('works/silver-oath.png', cover('silver'), 900, 1200);
await writeSvg('works/midnight-garden.png', cover('garden'), 900, 1200);
await writeSvg('works/ash-throne.png', cover('ash'), 900, 1200);
await writeSvg('meta/og-default.png', og(), 1200, 630);
for (const person of people) {
  await writeSvg(person.file, figure({ ...person, pose: 'idle' }), 720, 1280);
  const altFile = person.file.replace(/\.png$/, '-alt.png');
  await writeSvg(altFile, figure({ ...person, pose: 'alt' }), 720, 1280);
}

const icons = path.join(root, 'public', 'icons');
await fs.mkdir(icons, { recursive: true });
for (const size of [180, 192, 512]) {
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  await sharp(Buffer.from(icon(size))).resize(size, size).png().toFile(path.join(icons, name));
}
console.log('placeholders: public/icons');
