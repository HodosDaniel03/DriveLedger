/**
 * DriveLedger | Standalone Brand Logo, Favicon & OpenGraph Generator
 * Pure Node.js (node:zlib, Buffer, fs) with zero external dependencies.
 *
 * Produces:
 *   - public/logo-512.png (512x512 valid PNG, <100KB, dark-emerald #183D22 & white #FFFFFF)
 *   - public/favicon-48x48.png (48x48 PNG for Google Search favicon crawler)
 *   - public/favicon.ico (48x48 ICO wrapping the 48x48 PNG)
 *   - public/favicon.svg (Matching vector SVG)
 *   - public/og-image.png (1200x630 OpenGraph & Google Search preview banner, <150KB)
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');

// SVG Generator
export function generateFaviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect x="16" y="16" width="480" height="480" rx="108" fill="#0F172A" />
  <g stroke="#10B981" stroke-width="38" stroke-linecap="butt" fill="none">
    <path d="M 92 324 A 164 164 0 0 1 108.6 252.11" />
    <path d="M 115.13 240.02 A 164 164 0 0 1 166.2 186.77" />
    <path d="M 178 179.74 A 164 164 0 0 1 249.13 160.14" />
    <path d="M 262.87 160.14 A 164 164 0 0 1 334 179.74" />
    <path d="M 345.8 186.77 A 164 164 0 0 1 396.87 240.02" />
    <path d="M 403.4 252.11 A 164 164 0 0 1 420 324" />
  </g>
  <path
    d="M 154.56 313.34 A 102 102 0 0 1 315.95 241.48"
    stroke="#10B981"
    stroke-width="20"
    stroke-linecap="round"
    fill="none"
  />
  <polygon points="272.23,291.22 361.53,228.98 290.30,311.28" fill="#10B981" />
  <circle cx="256" cy="324" r="30" stroke="#10B981" stroke-width="18" fill="none" />
</svg>
`;
}

// PNG Generator (Pure Node.js + zlib)
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // No interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT: Scanlines with filter byte 0 (None)
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (1 + width * 4);
    scanlines[scanlineOffset] = 0;
    rgbaBuffer.copy(scanlines, scanlineOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/**
 * Samples the DriveLedger emerald gauge emblem at normalized pixel coordinates (lx, ly) in [0..size].
 * Returns [r, g, b, a] or null if transparent.
 */
function sampleGaugeEmblem(lx, ly, size, bgColor = [0x18, 0x3D, 0x22]) {
  const s = size / 512;
  const cx = 256 * s;
  const cy = 276 * s;
  const arcRadius = 150 * s;
  const strokeWidth = 32 * s;
  const needleLen = 110 * s;
  const needleAngle = -Math.PI / 4;

  const startAngle = (150 * Math.PI) / 180;
  const endAngle = (390 * Math.PI) / 180;
  const pStart = { x: cx + arcRadius * Math.cos(startAngle), y: cy + arcRadius * Math.sin(startAngle) };
  const pEnd = { x: cx + arcRadius * Math.cos(endAngle), y: cy + arcRadius * Math.sin(endAngle) };
  const needleEnd = {
    x: cx + needleLen * Math.cos(needleAngle),
    y: cy + needleLen * Math.sin(needleAngle),
  };

  const cornerR = 104 * s;
  const inset = 16 * s;
  const minX = inset;
  const maxX = size - inset;
  const minY = inset;
  const maxY = size - inset;

  let insideBg = false;
  if (lx >= minX && lx <= maxX && ly >= minY && ly <= maxY) {
    const dx = Math.max(0, Math.max(minX + cornerR - lx, lx - (maxX - cornerR)));
    const dy = Math.max(0, Math.max(minY + cornerR - ly, ly - (maxY - cornerR)));
    insideBg = (dx * dx + dy * dy) <= (cornerR * cornerR);
  }
  if (!insideBg) return null;

  let pr = bgColor[0];
  let pg = bgColor[1];
  let pb = bgColor[2];

  const distCenter = Math.hypot(lx - cx, ly - cy);
  let isIcon = distCenter <= 26 * s;

  if (!isIcon) {
    const distNeedle = distToSegment(lx, ly, cx, cy, needleEnd.x, needleEnd.y);
    if (distNeedle <= strokeWidth / 2) isIcon = true;
  }

  if (!isIcon) {
    const distToRadius = Math.abs(distCenter - arcRadius);
    if (distToRadius <= strokeWidth / 2) {
      let angle = Math.atan2(ly - cy, lx - cx);
      if (angle < 0) angle += 2 * Math.PI;
      const inArc = angle >= startAngle || angle <= (30 * Math.PI) / 180;
      if (inArc) {
        isIcon = true;
      } else if (
        Math.hypot(lx - pStart.x, ly - pStart.y) <= strokeWidth / 2 ||
        Math.hypot(lx - pEnd.x, ly - pEnd.y) <= strokeWidth / 2
      ) {
        isIcon = true;
      }
    } else if (
      Math.hypot(lx - pStart.x, ly - pStart.y) <= strokeWidth / 2 ||
      Math.hypot(lx - pEnd.x, ly - pEnd.y) <= strokeWidth / 2
    ) {
      isIcon = true;
    }
  }

  // Odometer mileage counter window scaled proportionally
  const boxY = cy + 78 * s;
  const halfW = 55 * s;
  const halfH = 14 * s;
  if (!isIcon && lx >= cx - halfW && lx <= cx + halfW && ly >= boxY - halfH && ly <= boxY + halfH) {
    const borderW = Math.max(1, 5 * s);
    const borderH = Math.max(1, 4 * s);
    const inBorder =
      lx <= cx - halfW + borderW ||
      lx >= cx + halfW - borderW ||
      ly <= boxY - halfH + borderH ||
      ly >= boxY + halfH - borderH;
    const tickHalfW = Math.max(0.75, 1.5 * s);
    const tickHalfH = 9 * s;
    const isTick =
      (Math.abs(lx - (cx - 25 * s)) <= tickHalfW ||
        Math.abs(lx - cx) <= tickHalfW ||
        Math.abs(lx - (cx + 25 * s)) <= tickHalfW) &&
      ly >= boxY - tickHalfH &&
      ly <= boxY + tickHalfH;
    if (inBorder || isTick) {
      pr = 255;
      pg = 255;
      pb = 255;
    }
  }

  if (isIcon) {
    pr = 255;
    pg = 255;
    pb = 255;
  }

  return [pr, pg, pb, 255];
}

export function generateLogoPngBuffer(width = 512, height = 512) {
  const rgba = Buffer.alloc(width * height * 4);
  const size = Math.min(width, height);

  // 2x2 sub-pixel supersampling for high-quality antialiasing
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let aSum = 0;

      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const px = x + (sx + 0.5) / 2;
          const py = y + (sy + 0.5) / 2;
          const sample = sampleGaugeEmblem(px, py, size);
          if (sample) {
            rSum += sample[0];
            gSum += sample[1];
            bSum += sample[2];
            aSum += sample[3];
          }
        }
      }

      const idx = (y * width + x) * 4;
      rgba[idx] = Math.round(rSum / 4);
      rgba[idx + 1] = Math.round(gSum / 4);
      rgba[idx + 2] = Math.round(bSum / 4);
      rgba[idx + 3] = Math.round(aSum / 4);
    }
  }

  return createPng(width, height, rgba);
}

/**
 * Wraps a 48x48 PNG buffer in a standard 22-byte Windows ICO container.
 */
export function generateFaviconIcoBuffer(png48Buffer) {
  const header = Buffer.alloc(22);
  // ICONDIR (6 bytes)
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(1, 4); // Image count: 1
  // ICONDIRENTRY (16 bytes)
  header.writeUInt8(48, 6); // Width
  header.writeUInt8(48, 7); // Height
  header.writeUInt8(0, 8); // Palette colors
  header.writeUInt8(0, 9); // Reserved
  header.writeUInt16LE(1, 10); // Color planes
  header.writeUInt16LE(32, 12); // Bits per pixel
  header.writeUInt32LE(png48Buffer.length, 14); // Image byte size
  header.writeUInt32LE(22, 18); // Data offset
  return Buffer.concat([header, png48Buffer]);
}

// 5x7 crisp bitmap glyphs for OpenGraph banner text rendering
const BITMAP_FONT_5X7 = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  '0': ['01110', '10011', '10101', '10101', '11001', '10001', '01110'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  ',': ['00000', '00000', '00000', '00000', '00110', '00100', '01000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};

function setPixel(rgba, width, height, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = (y * width + x) * 4;
  rgba[idx] = r;
  rgba[idx + 1] = g;
  rgba[idx + 2] = b;
  rgba[idx + 3] = a;
}

function fillRoundedRect(rgba, width, height, x0, y0, w, h, radius, fillRgb, borderRgb = null, borderW = 0) {
  const x1 = x0 + w;
  const y1 = y0 + h;
  const startY = Math.max(0, Math.floor(y0));
  const endY = Math.min(height - 1, Math.ceil(y1));
  const startX = Math.max(0, Math.floor(x0));
  const endX = Math.min(width - 1, Math.ceil(x1));

  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const dx = Math.max(0, Math.max(x0 + radius - px, px - (x1 - radius)));
      const dy = Math.max(0, Math.max(y0 + radius - py, py - (y1 - radius)));
      const dist = Math.hypot(dx, dy);
      if (dist <= radius) {
        let color = fillRgb;
        if (borderRgb && borderW > 0) {
          const innerR = Math.max(0, radius - borderW);
          const idxInner = Math.max(0, Math.max(x0 + borderW + innerR - px, px - (x1 - borderW - innerR)));
          const idyInner = Math.max(0, Math.max(y0 + borderW + innerR - py, py - (y1 - borderW - innerR)));
          const inInner =
            px >= x0 + borderW &&
            px <= x1 - borderW &&
            py >= y0 + borderW &&
            py <= y1 - borderW &&
            Math.hypot(idxInner, idyInner) <= innerR;
          if (!inInner) {
            color = borderRgb;
          }
        }
        setPixel(rgba, width, height, x, y, color[0], color[1], color[2], 255);
      }
    }
  }
}

function drawBitmapText(rgba, imgW, imgH, text, startX, startY, scale, colorRgb, charGap = null) {
  const gap = charGap === null ? scale : charGap;
  const advance = 5 * scale + gap;
  let cursorX = startX;

  for (const ch of text.toUpperCase()) {
    const glyph = BITMAP_FONT_5X7[ch] || BITMAP_FONT_5X7[' '];
    for (let row = 0; row < 7; row++) {
      const rowStr = glyph[row];
      for (let col = 0; col < 5; col++) {
        if (rowStr[col] === '1') {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              setPixel(rgba, imgW, imgH, cursorX + col * scale + dx, startY + row * scale + dy, colorRgb[0], colorRgb[1], colorRgb[2], 255);
            }
          }
        }
      }
    }
    cursorX += advance;
  }
  return cursorX - startX;
}

/**
 * Generates a 1200x630 OpenGraph & Google Search preview banner (<150KB).
 */
export function generateOgImagePngBuffer(width = 1200, height = 630) {
  const rgba = Buffer.alloc(width * height * 4);

  // Dark slate background #0F172A
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      rgba[idx] = 0x0F;
      rgba[idx + 1] = 0x17;
      rgba[idx + 2] = 0x2A;
      rgba[idx + 3] = 255;
    }
  }

  // Top emerald accent bar #10B981
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < width; x++) {
      setPixel(rgba, width, height, x, y, 0x10, 0xB9, 0x81, 255);
    }
  }

  // Recessed slate card (#131C2E fill, #1E293B border)
  fillRoundedRect(rgba, width, height, 56, 56, 1088, 518, 28, [0x13, 0x1C, 0x2E], [0x1E, 0x29, 0x3B], 2);

  // DriveLedger emerald gauge emblem on left
  const emblemSize = 260;
  const emblemX = 110;
  const emblemY = 185;
  for (let y = emblemY; y < emblemY + emblemSize; y++) {
    for (let x = emblemX; x < emblemX + emblemSize; x++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let hitCount = 0;
      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const lx = (x - emblemX) + (sx + 0.5) / 2;
          const ly = (y - emblemY) + (sy + 0.5) / 2;
          const s = sampleGaugeEmblem(lx, ly, emblemSize);
          if (s) {
            rSum += s[0];
            gSum += s[1];
            bSum += s[2];
            hitCount++;
          }
        }
      }
      if (hitCount > 0) {
        const bgFrac = (4 - hitCount) / 4;
        const r = Math.round((rSum + 0x13 * 4 * bgFrac) / 4);
        const g = Math.round((gSum + 0x1C * 4 * bgFrac) / 4);
        const b = Math.round((bSum + 0x2E * 4 * bgFrac) / 4);
        setPixel(rgba, width, height, x, y, r, g, b, 255);
      }
    }
  }

  // Right typography area (starts at x = 420)
  const textX = 420;
  // Domain kicker
  drawBitmapText(rgba, width, height, 'MYDRIVELEDGER.COM', textX, 148, 3, [0x10, 0xB9, 0x81], 3);

  // Main brand wordmark: DRIVE (white) + LEDGER (emerald)
  const driveW = drawBitmapText(rgba, width, height, 'DRIVE', textX, 200, 10, [0xFF, 0xFF, 0xFF], 8);
  drawBitmapText(rgba, width, height, 'LEDGER', textX + driveW + 6, 200, 10, [0x10, 0xB9, 0x81], 8);

  // Subtitle tagline
  drawBitmapText(rgba, width, height, 'INDEPENDENT CAR COST,', textX, 312, 3, [0x94, 0xA3, 0xB8], 3);
  drawBitmapText(rgba, width, height, 'RELIABILITY & OBD-II', textX, 348, 3, [0x94, 0xA3, 0xB8], 3);

  // Bottom metric preview pills
  const pills = ['5-YR TCO', 'RELIABILITY', 'OBD-II REPAIR'];
  let pillX = textX;
  const pillY = 432;
  const pillH = 48;
  const pillScale = 2;
  const pillGap = 3;
  const pillAdvance = 5 * pillScale + pillGap;
  for (const label of pills) {
    const textW = label.length * pillAdvance - pillGap;
    const padX = 24;
    const pillW = textW + padX * 2;
    fillRoundedRect(rgba, width, height, pillX, pillY, pillW, pillH, 12, [0x18, 0x3D, 0x22], [0x10, 0xB9, 0x81], 2);
    drawBitmapText(rgba, width, height, label, pillX + padX, pillY + 17, pillScale, [0xFF, 0xFF, 0xFF], pillGap);
    pillX += pillW + 18;
  }

  return createPng(width, height, rgba);
}

// Generate files if executed directly
const isDirectCli = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectCli) {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const png512Path = path.join(PUBLIC_DIR, 'logo-512.png');
  const png48Path = path.join(PUBLIC_DIR, 'favicon-48x48.png');
  const icoPath = path.join(PUBLIC_DIR, 'favicon.ico');
  const svgPath = path.join(PUBLIC_DIR, 'favicon.svg');
  const ogPath = path.join(PUBLIC_DIR, 'og-image.png');

  console.log('[Logo Generator] Rendering 512x512 PNG...');
  const t0 = Date.now();
  const png512Buffer = generateLogoPngBuffer(512, 512);
  fs.writeFileSync(png512Path, png512Buffer);
  console.log(`[Logo Generator] Saved ${png512Path} (${png512Buffer.length} bytes in ${Date.now() - t0}ms)`);

  console.log('[Logo Generator] Rendering 48x48 PNG & favicon.ico...');
  const png48Buffer = generateLogoPngBuffer(48, 48);
  fs.writeFileSync(png48Path, png48Buffer);
  const icoBuffer = generateFaviconIcoBuffer(png48Buffer);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`[Logo Generator] Saved ${png48Path} (${png48Buffer.length} bytes) & ${icoPath} (${icoBuffer.length} bytes)`);

  console.log('[Logo Generator] Rendering vector favicon.svg...');
  const svgContent = generateFaviconSvg();
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log(`[Logo Generator] Saved ${svgPath} (${Buffer.byteLength(svgContent)} bytes)`);

  console.log('[Logo Generator] Rendering 1200x630 og-image.png...');
  const tOg = Date.now();
  const ogBuffer = generateOgImagePngBuffer(1200, 630);
  fs.writeFileSync(ogPath, ogBuffer);
  console.log(`[Logo Generator] Saved ${ogPath} (${ogBuffer.length} bytes in ${Date.now() - tOg}ms)`);
}
