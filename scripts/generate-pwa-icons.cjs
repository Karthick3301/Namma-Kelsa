const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate clean vector brand SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Deep Forest Background -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />

  <!-- Inner Badge Container -->
  <g filter="url(#shadow)">
    <rect x="76" y="76" width="360" height="360" rx="84" fill="url(#badgeGrad)" stroke="#34d399" stroke-width="4" stroke-opacity="0.4" />
  </g>

  <!-- Stylized Monogram NK & Hammer/Sprout Motif -->
  <!-- Letter N -->
  <path d="M 148 350 L 148 162 L 192 162 L 256 288 L 256 162 L 292 162 L 292 350 L 248 350 L 184 224 L 184 350 Z" fill="#ffffff" />
  
  <!-- Letter K -->
  <path d="M 312 162 L 348 162 L 348 238 L 404 162 L 448 162 L 376 256 L 452 350 L 406 350 L 348 274 L 348 350 L 312 350 Z" fill="#ffffff" />

  <!-- Artisan Sparkle / Compassion Star -->
  <g transform="translate(256, 114) scale(0.9)">
    <path d="M 0 -24 Q 0 0 24 0 Q 0 0 0 24 Q 0 0 -24 0 Q 0 0 0 -24 Z" fill="#fef08a" />
  </g>

  <!-- Bottom Accent: Fair Wages / Direct Local Tagline Dot -->
  <circle cx="256" cy="402" r="8" fill="#a7f3d0" />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent.trim());
console.log('Saved public/icon.svg');

// 2. Generate PNG Helper functions
function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c >>> 0;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcInput);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function renderPwaPng(size, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const rowLength = size * 4 + 1;
  const rawData = Buffer.alloc(rowLength * size);

  // Geometry
  const cx = size / 2;
  const cy = size / 2;
  const cornerRadius = isMaskable ? size * 0.1 : size * 0.22;
  const badgeSize = isMaskable ? size * 0.70 : size * 0.78;
  const badgeRadius = badgeSize * 0.22;

  // Colors:
  // Background: #064e3b (6, 78, 59)
  // Badge: #059669 (5, 150, 105)
  // White text: (255, 255, 255)
  // Gold sparkle: (254, 240, 138)

  function insideRoundedRect(x, y, rx, ry, rw, rh, r) {
    if (x < rx || x > rx + rw || y < ry || y > ry + rh) return false;
    const dx = Math.min(Math.abs(x - rx), Math.abs(x - (rx + rw)));
    const dy = Math.min(Math.abs(y - ry), Math.abs(y - (ry + rh)));
    if (dx < r && dy < r) {
      const cx1 = x < rx + r ? rx + r : rx + rw - r;
      const cy1 = y < ry + r ? ry + r : ry + rh - r;
      const dist = Math.hypot(x - cx1, y - cy1);
      return dist <= r;
    }
    return true;
  }

  const badgeX = (size - badgeSize) / 2;
  const badgeY = (size - badgeSize) / 2;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Base background color
      let r = 6, g = 78, b = 59, a = 255;

      if (!isMaskable) {
        // Outer rounded rect for standard icon
        if (!insideRoundedRect(x, y, 0, 0, size, size, cornerRadius)) {
          r = 0; g = 0; b = 0; a = 0;
        }
      }

      if (a > 0) {
        // Check inside center badge
        if (insideRoundedRect(x, y, badgeX, badgeY, badgeSize, badgeSize, badgeRadius)) {
          r = 5; g = 150; b = 105;

          // Normalize relative coordinates in badge (-1 to 1)
          const nx = (x - cx) / (badgeSize / 2);
          const ny = (y - cy) / (badgeSize / 2);

          // Draw Monogram "N" (left side)
          const inNLeft = nx >= -0.70 && nx <= -0.50 && ny >= -0.55 && ny <= 0.55;
          const inNRight = nx >= -0.22 && nx <= -0.02 && ny >= -0.55 && ny <= 0.55;
          const inNDiag = (ny - (nx * 1.55 + 0.55)) > -0.25 && (ny - (nx * 1.55 + 0.55)) < 0.25 && nx >= -0.70 && nx <= -0.02 && ny >= -0.55 && ny <= 0.55;

          // Draw Monogram "K" (right side)
          const inKStem = nx >= 0.10 && nx <= 0.28 && ny >= -0.55 && ny <= 0.55;
          const inKTop = (ny + nx * 1.15) > 0.05 && (ny + nx * 1.15) < 0.40 && nx >= 0.22 && nx <= 0.72 && ny <= 0.05 && ny >= -0.55;
          const inKBot = (ny - nx * 1.15) > -0.38 && (ny - nx * 1.15) < -0.05 && nx >= 0.22 && nx <= 0.72 && ny >= -0.10 && ny <= 0.55;

          // Sparkle star at top center
          const distSparkle = Math.hypot(nx, ny - (-0.75));
          const inSparkle = (Math.abs(nx) * Math.abs(ny - (-0.75)) < 0.008) && distSparkle < 0.14;

          if (inNLeft || inNRight || inNDiag || inKStem || inKTop || inKBot) {
            r = 255; g = 255; b = 255;
          } else if (inSparkle) {
            r = 254; g = 240; b = 138;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Generate all standard PWA assets
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderPwaPng(180, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), renderPwaPng(192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), renderPwaPng(512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), renderPwaPng(512, true));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), renderPwaPng(64, false));

console.log('Successfully generated all PWA icons: apple-touch-icon.png, pwa-192x192.png, pwa-512x512.png, pwa-maskable-512x512.png, favicon.ico');
