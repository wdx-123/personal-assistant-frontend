import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const sourceDir = join(process.cwd(), "src/assets/background");
const outputDir = join(sourceDir, "generated");

const carouselSources = ["a", "b", "c", "d"];
const carouselPreset = {
  width: 1920,
  quality: 52,
  effort: 5,
};

const posterPreset = {
  width: 320,
  quality: 28,
  effort: 4,
  blur: 12,
  brightness: 1.16,
  saturation: 1.05,
};

const ensureOutputDir = async () => {
  await mkdir(outputDir, { recursive: true });
};

const buildPoster = async () => {
  const input = await readFile(join(sourceDir, "a.avif"));
  const output = await sharp(input)
    .resize({ width: posterPreset.width, withoutEnlargement: true })
    .modulate({
      brightness: posterPreset.brightness,
      saturation: posterPreset.saturation,
    })
    .blur(posterPreset.blur)
    .avif({ quality: posterPreset.quality, effort: posterPreset.effort })
    .toBuffer();

  await writeFile(join(outputDir, "poster.avif"), output);
};

const buildCarouselImage = async (name) => {
  const input = await readFile(join(sourceDir, `${name}.avif`));
  const output = await sharp(input)
    .resize({ width: carouselPreset.width, withoutEnlargement: true })
    .avif({ quality: carouselPreset.quality, effort: carouselPreset.effort })
    .toBuffer();

  await writeFile(join(outputDir, `${name}-carousel.avif`), output);
};

const run = async () => {
  await ensureOutputDir();
  await buildPoster();
  await Promise.all(carouselSources.map(buildCarouselImage));
};

await run();
