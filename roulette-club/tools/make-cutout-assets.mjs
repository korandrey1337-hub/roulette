import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const artDir = new URL("../assets/art/", import.meta.url);

const source = new URL("props-sheet-v2-source.png", artDir);
const cutoutSheet = new URL("props-sheet-v2-cutout.png", artDir);
const sourcePath = fileURLToPath(source);
const cutoutSheetPath = fileURLToPath(cutoutSheet);

const jobs = [
  ["weapon-revolver.png", 20, 55, 430, 340],
  ["weapon-shotgun.png", 520, 70, 840, 250],
  ["item-hammer.png", 25, 365, 455, 565],
  ["item-claw.png", 420, 410, 300, 520],
  ["item-vape.png", 760, 380, 280, 555],
  ["item-tarot.png", 1145, 365, 300, 355],
  ["charge-live.png", 1090, 705, 190, 235],
  ["charge-blank.png", 1290, 705, 190, 235],
];

function colorDistance(data, a, b) {
  const dr = data[a] - data[b];
  const dg = data[a + 1] - data[b + 1];
  const db = data[a + 2] - data[b + 2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

async function removeBackground(input, output) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const visited = new Uint8Array(width * height);
  const queue = [];
  const threshold = 12;

  const enqueue = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pixel = y * width + x;
    if (visited[pixel]) return;
    visited[pixel] = 1;
    queue.push(pixel);
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  for (let index = 0; index < queue.length; index += 1) {
    const pixel = queue[index];
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    const src = pixel * 4;
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nextPixel = ny * width + nx;
      if (visited[nextPixel]) continue;
      const dst = nextPixel * 4;
      if (colorDistance(data, src, dst) <= threshold) {
        visited[nextPixel] = 1;
        queue.push(nextPixel);
      }
    }
  }

  for (let pixel = 0; pixel < visited.length; pixel += 1) {
    if (!visited[pixel]) continue;
    const offset = pixel * 4;
    data[offset + 3] = 0;
  }

  await sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(output);
}

async function cropSprites() {
  const artPath = fileURLToPath(artDir);
  await mkdir(dirname(fileURLToPath(new URL("item-hammer.png", artDir))), { recursive: true });
  await removeBackground(sourcePath, cutoutSheetPath);

  for (const [name, left, top, width, height] of jobs) {
    const buffer = await sharp(cutoutSheetPath)
      .extract({ left, top, width, height })
      .png()
      .toBuffer();
    await sharp(buffer)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
      .png()
      .toFile(join(artPath, name));
  }
}

cropSprites();
