/**
 * DriveLedger — Standalone Brand Logo & Favicon Generator
 * Pure Node.js (node:zlib, Buffer, fs) — Zero external dependencies.
 *
 * Produces:
 *   - public/logo-512.png (512x512 valid PNG, <100KB target ~5.1KB, dark-emerald #183D22 & white #FFFFFF)
 *   - public/favicon.svg (Matching vector SVG)
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public');

// --- SVG Generator ---
export function generateFaviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect x="16" y="16" width="480" height="480" rx="104" fill="#183D22"/>
  <g fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round">
    <!-- Dial Arc: radius 150 centered at (256, 276), 240 deg span -->
    <path d="M 126.1 351 A 150 150 0 1 1 385.9 351" stroke-width="32"/>
    <!-- Needle: -45 deg up-right -->
    <path d="M 256 276 L 333.8 198.2" stroke-width="32"/>
  </g>
  <!-- Center Hub -->
  <circle cx="256" cy="276" r="26" fill="#FFFFFF"/>
  <!-- Odometer Mileage Counter Window -->
  <rect x="201" y="344" width="110" height="24" rx="3" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>
  <line x1="228.5" y1="344" x2="228.5" y2="368" stroke="#FFFFFF" stroke-width="2"/>
  <line x1="256" y1="344" x2="256" y2="368" stroke="#FFFFFF" stroke-width="2"/>
  <line x1="283.5" y1="344" x2="283.5" y2="368" stroke="#FFFFFF" stroke-width="2"/>
</svg>
`;
}

// --- PNG Generator (Pure Node.js + zlib) ---
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

export function generateLogoPngBuffer(width = 512, height = 512) {
  const rgba = Buffer.alloc(width * height * 4);
  const cx = 256;
  const cy = 276;
  const arcRadius = 150;
  const strokeWidth = 32;
  const needleLen = 110;
  const needleAngle = -Math.PI / 4; // -45 deg (up-right)

  const startAngle = (150 * Math.PI) / 180;
  const endAngle = (390 * Math.PI) / 180;
  const pStart = { x: cx + arcRadius * Math.cos(startAngle), y: cy + arcRadius * Math.sin(startAngle) };
  const pEnd = { x: cx + arcRadius * Math.cos(endAngle), y: cy + arcRadius * Math.sin(endAngle) };
  const needleEnd = {
    x: cx + needleLen * Math.cos(needleAngle),
    y: cy + needleLen * Math.sin(needleAngle),
  };

  const cornerR = 104;
  const inset = 16;
  const minX = inset, maxX = width - inset, minY = inset, maxY = height - inset;

  // 2x2 sub-pixel supersampling for high-quality antialiasing
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0;

      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const px = x + (sx + 0.5) / 2;
          const py = y + (sy + 0.5) / 2;

          let insideBg = false;
          if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
            const dx = Math.max(0, Math.max(minX + cornerR - px, px - (maxX - cornerR)));
            const dy = Math.max(0, Math.max(minY + cornerR - py, py - (maxY - cornerR)));
            insideBg = (dx * dx + dy * dy) <= (cornerR * cornerR);
          }

          if (!insideBg) continue;

          // Background: Dark Emerald #183D22
          let pr = 0x18, pg = 0x3D, pb = 0x22, pa = 255;

          // 1. Center Hub
          const distCenter = Math.hypot(px - cx, py - cy);
          let isIcon = distCenter <= 26;

          // 2. Needle (-45 deg up-right)
          if (!isIcon) {
            const distNeedle = distToSegment(px, py, cx, cy, needleEnd.x, needleEnd.y);
            if (distNeedle <= strokeWidth / 2) isIcon = true;
          }

          // 3. Dial Arc (240 deg)
          if (!isIcon) {
            const distToRadius = Math.abs(distCenter - arcRadius);
            if (distToRadius <= strokeWidth / 2) {
              let angle = Math.atan2(py - cy, px - cx);
              if (angle < 0) angle += 2 * Math.PI;
              const inArc = (angle >= startAngle || angle <= (30 * Math.PI) / 180);
              if (inArc) {
                isIcon = true;
              } else if (
                Math.hypot(px - pStart.x, py - pStart.y) <= strokeWidth / 2 ||
                Math.hypot(px - pEnd.x, py - pEnd.y) <= strokeWidth / 2
              ) {
                isIcon = true;
              }
            } else if (
              Math.hypot(px - pStart.x, py - pStart.y) <= strokeWidth / 2 ||
              Math.hypot(px - pEnd.x, py - pEnd.y) <= strokeWidth / 2
            ) {
              isIcon = true;
            }
          }

          // 4. Odometer mileage counter window
          const boxY = cy + 78;
          if (!isIcon && px >= cx - 55 && px <= cx + 55 && py >= boxY - 14 && py <= boxY + 14) {
            const inBorder = (px <= cx - 50 || px >= cx + 50 || py <= boxY - 10 || py >= boxY + 10);
            const isTick = (Math.abs(px - (cx - 25)) <= 1.5 || Math.abs(px - cx) <= 1.5 || Math.abs(px - (cx + 25)) <= 1.5) && (py >= boxY - 9 && py <= boxY + 9);
            if (inBorder || isTick) {
              pr = 255; pg = 255; pb = 255;
            }
          }

          if (isIcon) {
            pr = 255; pg = 255; pb = 255;
          }

          rSum += pr;
          gSum += pg;
          bSum += pb;
          aSum += pa;
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

// Generate files if executed directly
if (process.argv[1] === __filename) {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const pngPath = path.join(PUBLIC_DIR, 'logo-512.png');
  const svgPath = path.join(PUBLIC_DIR, 'favicon.svg');

  console.log('[Logo Generator] Rendering 512x512 PNG...');
  const t0 = Date.now();
  const pngBuffer = generateLogoPngBuffer(512, 512);
  fs.writeFileSync(pngPath, pngBuffer);
  const pngMs = Date.now() - t0;
  console.log(`[Logo Generator] Saved ${pngPath} (${pngBuffer.length} bytes in ${pngMs}ms)`);

  console.log('[Logo Generator] Rendering vector favicon.svg...');
  const svgContent = generateFaviconSvg();
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log(`[Logo Generator] Saved ${svgPath} (${Buffer.byteLength(svgContent)} bytes)`);
}
