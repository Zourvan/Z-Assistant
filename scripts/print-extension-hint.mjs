import { resolve } from "node:path";

const distPath = resolve("dist");

console.log("\n✓ Extension build ready.");
console.log(`  Load this folder in Chrome: ${distPath}`);
console.log("  chrome://extensions → Developer mode → Load unpacked → select dist/\n");
console.log("  Do NOT load the project root — that causes MIME type errors.\n");
