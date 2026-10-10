/**
 * Generates public/og.png (1200×630) with zero dependencies.
 *
 * Why hand-rolled: the sandbox/host has no system fonts, so SVG text
 * rasterisation and next/og (which fetches a font at build time) are both
 * unreliable. Instead this script rasterises a tiny 5×7 pixel font — which
 * suits the cybernetic look anyway — and writes a PNG straight from zlib.
 *
 * Usage: npm run og
 */
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1200;
const H = 630;

const VOID = [8, 9, 12];
const ACID = [217, 255, 99];
const VOLT = [57, 255, 136];
const IRIS = [168, 85, 247];
const FROST = [245, 245, 245];
const ASH = [161, 161, 170];

/* ── 5×7 bitmap font ──────────────────────────────────────────── */
const FONT = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#..##", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: [".####", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  3: ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  4: ["#..#.", "#..#.", "#..#.", "#####", "...#.", "...#.", "...#."],
  5: ["#####", "#....", "#....", "####.", "....#", "#...#", ".###."],
  6: ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
  7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  9: [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  "·": [".....", ".....", ".....", "..#..", ".....", ".....", "....."],
};

/* ── pixel buffer ─────────────────────────────────────────────── */
const pixels = new Uint8Array(W * H * 4);

function put(x, y, [r, g, b], a = 1) {
  const px = Math.round(x);
  const py = Math.round(y);
  if (px < 0 || py < 0 || px >= W || py >= H || a <= 0) return;
  const i = (py * W + px) * 4;
  const alpha = Math.min(1, a);
  pixels[i] = pixels[i] + (r - pixels[i]) * alpha;
  pixels[i + 1] = pixels[i + 1] + (g - pixels[i + 1]) * alpha;
  pixels[i + 2] = pixels[i + 2] + (b - pixels[i + 2]) * alpha;
  pixels[i + 3] = 255;
}

function fill([r, g, b]) {
  for (let i = 0; i < W * H; i += 1) {
    pixels[i * 4] = r;
    pixels[i * 4 + 1] = g;
    pixels[i * 4 + 2] = b;
    pixels[i * 4 + 3] = 255;
  }
}

function disc(cx, cy, radius, color, alpha) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 <= r2) put(x, y, color, alpha * (1 - Math.sqrt(d2) / (radius * 1.35)));
    }
  }
}

function ellipse(cx, cy, rx, ry, rotation, color, alpha, thickness = 1) {
  const steps = Math.max(220, Math.round((rx + ry) * 3));
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const ex = Math.cos(t) * rx;
    const ey = Math.sin(t) * ry;
    put(cx + ex * cos - ey * sin, cy + ex * sin + ey * cos, color, alpha);
    if (thickness > 1) {
      for (let k = 1; k < thickness; k += 1) {
        put(cx + ex * cos - ey * sin + k, cy + ex * sin + ey * cos, color, alpha * 0.6);
        put(cx + ex * cos - ey * sin, cy + ex * sin + ey * cos + k, color, alpha * 0.6);
      }
    }
  }
}

function text(str, x, y, scale, color, alpha = 1, tracking = 1) {
  let cursor = x;
  for (const char of str.toUpperCase()) {
    const glyph = FONT[char] ?? FONT[" "];
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        if (glyph[row][col] !== "#") continue;
        for (let dy = 0; dy < scale; dy += 1) {
          for (let dx = 0; dx < scale; dx += 1) {
            put(cursor + col * scale + dx, y + row * scale + dy, color, alpha);
          }
        }
      }
    }
    cursor += 6 * scale * tracking;
  }
  return cursor;
}

/** Cheap bloom: draw the same text offset in 8 directions at low alpha. */
function glowText(str, x, y, scale, color, tracking = 1) {
  for (const [dx, dy] of [
    [-3, 0], [3, 0], [0, -3], [0, 3],
    [-2, -2], [2, -2], [-2, 2], [2, 2],
    [-6, 0], [6, 0], [0, -6], [0, 6],
  ]) {
    text(str, x + dx, y + dy, scale, color, 0.05, tracking);
  }
  text(str, x, y, scale, color, 1, tracking);
}

/* ── compose ──────────────────────────────────────────────────── */
fill(VOID);

// Vertical gradient + corner colour wash
for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    const t = y / H;
    put(x, y, [10 + t * 4, 12 + t * 4, 17 + t * 5], 0.9);
  }
}
disc(1010, 190, 420, IRIS, 0.2);
disc(140, 620, 380, ACID, 0.07);
disc(960, 470, 300, VOLT, 0.06);

// Grid
for (let x = 0; x <= W; x += 60) {
  for (let y = 0; y < H; y += 1) put(x, y, [40, 46, 62], 0.35);
}
for (let y = 0; y <= H; y += 60) {
  for (let x = 0; x < W; x += 1) put(x, y, [40, 46, 62], 0.35);
}

// Orbital system on the right
const CX = 940;
const CY = 300;
const R = 186;

ellipse(CX, CY, 300, 108, -0.32, ACID, 0.5, 2);
ellipse(CX, CY, 246, 246, 0, IRIS, 0.26, 1);
ellipse(CX, CY, 352, 132, 0.42, VOLT, 0.2, 1);

// Wireframe globe
ellipse(CX, CY, R, R, 0, ACID, 0.55, 2);
for (const deg of [-68, -46, -23, 0, 23, 46, 68]) {
  ellipse(CX, CY, Math.max(2, R * Math.cos((deg * Math.PI) / 180)), R, 0, ACID, deg === 0 ? 0.34 : 0.16, 1);
}
for (const fraction of [-0.76, -0.5, -0.25, 0, 0.25, 0.5, 0.76]) {
  const offsetY = fraction * R;
  const rx = Math.sqrt(Math.max(1, R * R - offsetY * offsetY));
  ellipse(CX, CY + offsetY, rx, rx * 0.2, 0, fraction === 0 ? VOLT : ACID, fraction === 0 ? 0.4 : 0.16, 1);
}
disc(CX, CY, 62, VOLT, 0.5);
disc(CX, CY, 16, VOLT, 1);
disc(CX + 246, CY - 74, 7, ACID, 1);
disc(CX - 208, CY + 96, 5, IRIS, 1);

// Particles
let seed = 20261010;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
for (let i = 0; i < 190; i += 1) {
  const x = random() * W;
  const y = random() * H;
  const color = i % 5 === 0 ? IRIS : i % 3 === 0 ? VOLT : ACID;
  const radius = random() * 1.9 + 0.4;
  disc(x, y, radius, color, 0.18 + random() * 0.6);
}

// Frame brackets
const bracket = (x, y, dx, dy, color) => {
  for (let i = 0; i < 46; i += 1) {
    put(x + i * dx, y, color, 0.6);
    put(x + i * dx, y + dy, color, 0.6);
    put(x, y + i * dy, color, 0.6);
    put(x + dx, y + i * dy, color, 0.6);
  }
};
bracket(48, 48, 1, 1, ACID);
bracket(W - 48, 48, -1, 1, ACID);
bracket(48, H - 48, 1, -1, IRIS);
bracket(W - 48, H - 48, -1, -1, IRIS);

// Typography
glowText("ORBITAL//CYBER", 84, 96, 4, ACID, 1.12);
for (let i = 0; i < 26; i += 1) put(84 + i * 4, 138, ACID, 0.5);

glowText("BUILDING", 82, 178, 11, FROST, 1);
glowText("DIGITAL", 82, 272, 11, FROST, 1);
glowText("WORLDS.", 82, 366, 11, VOLT, 1);

text("FULL-STACK DEVELOPER PORTFOLIO", 84, 480, 4, ASH, 0.95, 1.05);
text("REACT · THREE.JS · GSAP · NODE · MONGODB", 84, 532, 3, ASH, 0.6, 1.05);

// Scanlines + vignette
for (let y = 0; y < H; y += 3) {
  for (let x = 0; x < W; x += 1) put(x, y, VOID, 0.16);
}
for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    const dx = (x - W / 2) / (W / 2);
    const dy = (y - H / 2) / (H / 2);
    const distance = Math.sqrt(dx * dx * 0.72 + dy * dy);
    if (distance > 0.62) put(x, y, VOID, Math.min(0.85, (distance - 0.62) * 1.25));
  }
}

/* ── PNG encoder ──────────────────────────────────────────────── */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    Buffer.from(rgba.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const output = join(process.cwd(), "public", "og.png");
const png = encodePng(W, H, pixels);
writeFileSync(output, png);
console.log(`✓ wrote ${output} (${(png.length / 1024).toFixed(1)} KB, ${W}×${H})`);
