/**
 * Draws original placeholder illustrations (not traced from any comic)
 * into src/assets/source. Run `npm run images` afterwards.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src', 'assets', 'source');

function portrait(p) {
  const bangs = {
    long: `<path d="M292 530 C310 360 380 292 450 292 C530 292 600 360 612 540 C555 455 500 448 450 460 C395 448 340 460 292 530 Z" fill="${p.hair}"/>
      <path d="M300 560 C330 500 390 490 450 500 C510 490 570 505 610 560 C560 520 500 530 450 528 C395 530 340 520 300 560 Z" fill="${p.hair}" opacity="0.95"/>`,
    short: `<path d="M305 545 C318 370 385 305 450 305 C525 305 590 375 605 550 C548 470 500 455 450 458 C390 455 345 480 305 545 Z" fill="${p.hair}"/>`,
    bob: `<path d="M275 520 C268 700 310 790 360 805 L545 805 C600 785 640 690 628 515 C575 370 500 305 450 305 C385 305 320 385 275 520 Z" fill="${p.hair}"/>`,
    bun: `<path d="M308 545 C320 375 388 310 450 310 C522 310 588 380 602 548 C550 475 498 458 450 460 C392 458 348 482 308 545 Z" fill="${p.hair}"/>
      <circle cx="575" cy="355" r="52" fill="${p.hair}"/>
      <circle cx="575" cy="355" r="16" fill="${p.accent}"/>`,
    waves: `<path d="M300 545 C340 400 395 330 450 328 C515 326 575 400 610 545 C545 470 495 490 450 478 C400 490 345 470 300 545 Z" fill="${p.hair}"/>`,
    side: `<path d="M318 560 C300 390 370 310 450 308 C540 306 600 390 608 530 C560 470 515 455 468 460 C430 390 360 430 318 560 Z" fill="${p.hair}"/>
      <path d="M330 470 C360 560 345 680 360 790" stroke="${p.hair}" stroke-width="36" stroke-linecap="round" fill="none"/>`,
  }[p.style];

  const hairBack =
    p.style === 'long' || p.style === 'waves'
      ? `<path d="M330 580 C310 840 325 1040 360 1200 L540 1200 C575 1040 590 840 570 580 C540 490 500 450 450 450 C400 450 360 500 330 580 Z" fill="${p.hair}"/>`
      : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.bg}"/>
      <stop offset="1" stop-color="${p.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="900" height="1200" fill="url(#bg)"/>
  <circle cx="680" cy="250" r="170" fill="${p.accent}" opacity="0.45"/>
  <circle cx="180" cy="980" r="120" fill="${p.accent}" opacity="0.18"/>
  <path d="M110 1200 L110 980 Q140 820 310 800 L590 800 Q760 820 790 980 L790 1200 Z" fill="${p.cloth}"/>
  <path d="M390 800 L450 910 L510 800" fill="${p.cloth2}"/>
  ${hairBack}
  <ellipse cx="302" cy="575" rx="24" ry="34" fill="${p.skin}"/>
  <ellipse cx="598" cy="575" rx="24" ry="34" fill="${p.skin}"/>
  <rect x="402" y="700" width="96" height="110" rx="42" fill="${p.skin}"/>
  ${p.style === 'bob' ? bangs : ''}
  <ellipse cx="450" cy="555" rx="152" ry="180" fill="${p.skin}" stroke="${p.skinShadow}" stroke-width="3"/>
  <ellipse cx="385" cy="615" rx="30" ry="16" fill="${p.blush}" opacity="0.7"/>
  <ellipse cx="515" cy="615" rx="30" ry="16" fill="${p.blush}" opacity="0.7"/>
  ${p.style === 'bob' ? '' : bangs}
  <path d="M356 505 Q392 488 430 506" stroke="${p.brow}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M470 506 Q508 488 544 505" stroke="${p.brow}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <ellipse cx="${390 + p.gaze}" cy="548" rx="34" ry="18" fill="#fffaf6"/>
  <ellipse cx="${508 + p.gaze}" cy="548" rx="34" ry="18" fill="#fffaf6"/>
  <circle cx="${392 + p.gaze}" cy="549" r="11" fill="${p.eye}"/>
  <circle cx="${510 + p.gaze}" cy="549" r="11" fill="${p.eye}"/>
  <circle cx="${392 + p.gaze}" cy="549" r="5.5" fill="#1b1714"/>
  <circle cx="${510 + p.gaze}" cy="549" r="5.5" fill="#1b1714"/>
  <circle cx="${397 + p.gaze}" cy="545" r="3" fill="#fff"/>
  <circle cx="${515 + p.gaze}" cy="545" r="3" fill="#fff"/>
  <path d="M450 570 Q444 612 454 632" stroke="${p.skinShadow}" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M412 668 Q450 688 488 668" stroke="${p.lip}" stroke-width="5" fill="none" stroke-linecap="round"/>
  ${p.extra}
  <rect x="32" y="32" width="836" height="1136" rx="40" fill="none" stroke="${p.frame}" stroke-width="3"/>
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
    bg: '#d7e1ea',
    bg2: '#b7c6d4',
    hair: '#e4e8ee',
    skin: '#f3d5c6',
    skinShadow: '#e0b39d',
    blush: '#e7b1a0',
    eye: '#7d868e',
    brow: '#9aa2ab',
    lip: '#c47d74',
    cloth: '#3e4c5c',
    cloth2: '#2d3948',
    accent: '#f7fbff',
    frame: 'rgba(255,255,255,0.65)',
    gaze: 0,
    extra: `<path d="M360 400 Q450 360 540 400" fill="none" stroke="#f7fbff" stroke-width="8" stroke-linecap="round"/>`,
  },
  {
    file: 'characters/kayren-vale.png',
    style: 'short',
    bg: '#ead4cb',
    bg2: '#c9a394',
    hair: '#1c1a1a',
    skin: '#e7b892',
    skinShadow: '#c98b62',
    blush: '#d98974',
    eye: '#c47a2a',
    brow: '#2a2422',
    lip: '#a85a52',
    cloth: '#2a2422',
    cloth2: '#c6a15a',
    accent: '#c6a15a',
    frame: 'rgba(255,255,255,0.4)',
    gaze: 2,
    extra: `<path d="M360 860 H540" stroke="#c6a15a" stroke-width="8" stroke-linecap="round"/>`,
  },
  {
    file: 'characters/yuna-rek.png',
    style: 'bob',
    bg: '#e5eedd',
    bg2: '#c9d7b8',
    hair: '#6d4b34',
    skin: '#f0cbb4',
    skinShadow: '#d9a88c',
    blush: '#e8a898',
    eye: '#3f6b45',
    brow: '#5a3b2a',
    lip: '#c47870',
    cloth: '#f6f1e6',
    cloth2: '#d7e3c4',
    accent: '#d7e3c4',
    frame: 'rgba(255,255,255,0.7)',
    gaze: -2,
    extra: `<circle cx="560" cy="470" r="10" fill="#d7e3c4"/>`,
  },
  {
    file: 'characters/mira-han.png',
    style: 'bun',
    bg: '#1c3330',
    bg2: '#31584e',
    hair: '#3a2a22',
    skin: '#e8c0a4',
    skinShadow: '#c99678',
    blush: '#d98978',
    eye: '#2f6a45',
    brow: '#2a211c',
    lip: '#b86a62',
    cloth: '#234038',
    cloth2: '#16302b',
    accent: '#d5e6c8',
    frame: 'rgba(255,255,255,0.22)',
    gaze: 0,
    extra: `<path d="M250 300 C280 250 310 270 300 320" stroke="#d5e6c8" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="292" cy="292" rx="16" ry="8" fill="#d5e6c8" transform="rotate(-30 292 292)"/>`,
  },
  {
    file: 'characters/nox.png',
    style: 'short',
    bg: '#241c2c',
    bg2: '#4a3148',
    hair: '#f4f1ea',
    skin: '#f6e4da',
    skinShadow: '#e3c3b6',
    blush: '#e7b0b4',
    eye: '#a33b45',
    brow: '#d9d3cc',
    lip: '#a84a55',
    cloth: '#141216',
    cloth2: '#2a2030',
    accent: '#c98b98',
    frame: 'rgba(255,255,255,0.18)',
    gaze: 3,
    extra: `<path d="M340 760 H560 V900 Q450 860 340 900 Z" fill="#141216"/>`,
  },
  {
    file: 'characters/sera-ash.png',
    style: 'waves',
    bg: '#3a2a24',
    bg2: '#6a4034',
    hair: '#8a4030',
    skin: '#f0c8b0',
    skinShadow: '#d7a88c',
    blush: '#e09080',
    eye: '#c4963a',
    brow: '#6a3024',
    lip: '#b85a52',
    cloth: '#6e2e28',
    cloth2: '#4a2420',
    accent: '#e6c27a',
    frame: 'rgba(255,255,255,0.22)',
    gaze: 0,
    extra: `<path d="M355 430 Q450 390 545 430" fill="none" stroke="#e6c27a" stroke-width="8" stroke-linecap="round"/>`,
  },
  {
    file: 'characters/ren-sho.png',
    style: 'side',
    bg: '#d5dee6',
    bg2: '#aebcc8',
    hair: '#1a1c22',
    skin: '#efcbb8',
    skinShadow: '#d7aa92',
    blush: '#e4a090',
    eye: '#3a5f8a',
    brow: '#1a1c22',
    lip: '#b86e68',
    cloth: '#2c3a4e',
    cloth2: '#1e2a3a',
    accent: '#8eacc4',
    frame: 'rgba(255,255,255,0.55)',
    gaze: -3,
    extra: '',
  },
  {
    file: 'characters/orpheus-dal.png',
    style: 'long',
    bg: '#2c3148',
    bg2: '#4d4468',
    hair: '#16141c',
    skin: '#f3d3c4',
    skinShadow: '#e0b5a2',
    blush: '#e3a498',
    eye: '#6d4f90',
    brow: '#241e2c',
    lip: '#a86a78',
    cloth: '#cfc6d8',
    cloth2: '#b7adc4',
    accent: '#d5cbe2',
    frame: 'rgba(255,255,255,0.25)',
    gaze: 1,
    extra: `<rect x="560" y="470" width="46" height="14" rx="7" fill="#d5cbe2"/>`,
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
  await writeSvg(person.file, portrait(person), 900, 1200);
}

const icons = path.join(root, 'public', 'icons');
await fs.mkdir(icons, { recursive: true });
for (const size of [180, 192, 512]) {
  const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  await sharp(Buffer.from(icon(size))).resize(size, size).png().toFile(path.join(icons, name));
}
console.log('placeholders: public/icons');
