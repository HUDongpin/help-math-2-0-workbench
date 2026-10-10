// Build the browser bundle (runtime + viewer) and compile every generated page
// module (.ts → .js next to it). Usage: node tools/build.mjs [esbuild main.js path]
import { readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const esbuildPath = process.argv[2] ?? join(root, "..", "..", "node_modules", "esbuild", "lib", "main.js");
const esbuild = (await import(pathToFileURL(esbuildPath).href)).default;
await esbuild.build({ entryPoints: [join(root, "viewer", "viewer.ts")], bundle: true, format: "esm", outfile: join(root, "dist", "viewer.js"), target: "es2022", logLevel: "warning" });
const pages = [];
const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (/^shared-.*\.ts$/.test(n)) pages.push(p); } };
walk(join(root, "out"));
await esbuild.build({ entryPoints: pages, outdir: join(root, "out"), outbase: join(root, "out"), format: "esm", target: "es2022", logLevel: "warning" });
console.log(`built dist/viewer.js and ${pages.length} page modules`);
