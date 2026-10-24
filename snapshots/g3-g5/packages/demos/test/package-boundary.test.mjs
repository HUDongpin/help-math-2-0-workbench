import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const packageJsonUrl = new URL("../package.json", import.meta.url);
const componentsUrl = new URL("../src/components.js", import.meta.url);
const registryUrl = new URL("../src/registry.js", import.meta.url);

test("public exports contain only modern demo integration entry points", async () => {
  const packageJson = JSON.parse(await readFile(packageJsonUrl, "utf8"));
  const exportedPaths = Object.keys(packageJson.exports);

  assert.deepEqual(exportedPaths, [
    ".",
    "./components",
    "./contracts",
    "./manifests",
    "./registry",
    "./styles.css",
    "./animation-registry",
    "./runtime",
    "./prototype-manifest",
  ]);
  assert.equal(JSON.stringify(packageJson.exports).includes("ruffle"), false);
  assert.equal(JSON.stringify(packageJson.exports).includes(".swf"), false);
});

test("component adapters reuse the maintained React implementations", async () => {
  const source = await readFile(componentsUrl, "utf8");

  assert.match(source, /components\/GallonConversionAnimation\.jsx/);
  assert.match(source, /components\/LiterConversionAnimation\.jsx/);
  assert.doesNotMatch(source, /RuffleFlashPlayer/);
  assert.doesNotMatch(source, /public\/flash\//);
});

test("registry documents deterministic capture and all runtime asset paths", async () => {
  const source = await readFile(registryUrl, "utf8");

  assert.match(source, /deterministicFrameCapture: true/);
  assert.equal((source.match(/deterministicFrameCapture: true/g) ?? []).length, 2);
  assert.match(source, /\/flash-assets\/conversion-1-2\/gallon-128\.png/);
  assert.match(source, /\/flash-assets\/cylinder-base\.png/);
  assert.doesNotMatch(source, /\.swf/);
  assert.doesNotMatch(source, /ruffle/i);

  const assetPaths = [...source.matchAll(/"(\/flash-assets\/[^"]+)"/g)].map(
    ([, assetPath]) => assetPath,
  );
  assert.equal(assetPaths.length, 12);
  await Promise.all(
    assetPaths.map((assetPath) =>
      access(new URL(`../../../public${assetPath}`, import.meta.url)),
    ),
  );
});
