import { ZipArchive } from "archiver";
import { createWriteStream, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const rootDir = resolve(".");
const distDir = join(rootDir, "dist");
const releaseDir = join(rootDir, "release");

if (!existsSync(distDir)) {
  console.error("\n✗ dist/ not found. Run `npm run build:extension` first.\n");
  process.exit(1);
}

const manifestPath = join(distDir, "manifest.json");
if (!existsSync(manifestPath)) {
  console.error("\n✗ dist/manifest.json not found. Extension build may be incomplete.\n");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const slug = manifest.name.toLowerCase().replace(/\s+/g, "-");
const zipName = `${slug}-v${manifest.version}.zip`;
const zipPath = join(releaseDir, zipName);

mkdirSync(releaseDir, { recursive: true });

await new Promise((resolvePromise, reject) => {
  const output = createWriteStream(zipPath);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  output.on("close", resolvePromise);
  archive.on("error", reject);

  archive.pipe(output);
  archive.directory(distDir, false);
  archive.finalize();
});

console.log("\n✓ Chrome Web Store package ready.");
console.log(`  Upload this file: ${zipPath}`);
console.log("  Chrome Web Store → Developer Dashboard → your item → Package → Upload new package\n");
