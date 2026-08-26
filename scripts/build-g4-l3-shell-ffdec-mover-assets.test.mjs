import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildG4L3ShellMoverAssets,
  parseArguments,
} from "./build-g4-l3-shell-ffdec-mover-assets.mjs";

test("mover asset arguments accept only check mode", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--write"]), /Unknown argument/);
});

test("mover assets retain all 871 structural frames without runtime promotion", async () => {
  const manifest = await buildG4L3ShellMoverAssets({check: true});
  assert.equal(manifest.animationId, "shell-course-g04-l03-index-local");
  assert.equal(manifest.runtime.frameDomain, "sprite-528");
  assert.equal(manifest.runtime.sourceCharacterId, 528);
  assert.equal(manifest.runtime.frameCount, 871);
  assert.deepEqual(manifest.geometry.exporterCanvas, {width: 1463, height: 263});
  assert.deepEqual(manifest.geometry.exporterLocalOrigin, {x: 1248.05, y: 204.9});
  assert.equal(manifest.geometry.rootPlacement.rootFrame, 49);
  assert.equal(manifest.geometry.rootPlacement.depth, 423);
  assert.equal(manifest.geometry.rootPlacement.instanceName, "mover_mc");
  assert.deepEqual(manifest.geometry.rootCompositionOffset, {x: -680.5, y: 236.8});
  assert.equal(manifest.authority.actionScriptExecuted, false);
  assert.equal(manifest.authority.originalRuntimeBaseline, false);
  assert.equal(manifest.strictAcceptanceEffect, "none");
  assert.equal(manifest.frames.length, 871);
  assert.equal(manifest.assets.length, 100);
  assert.equal(new Set(manifest.frames.map(({sha256}) => sha256)).size, 100);
  assert.ok(manifest.frames.every(({file, sha256}) =>
    manifest.assets.some((asset) => asset.file === file && asset.sha256 === sha256)));
  for (const asset of manifest.assets) {
    assert.equal(asset.width, 1463);
    assert.equal(asset.height, 263);
    await readFile(
      new URL(`../public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-528/${asset.file}`, import.meta.url),
    );
  }
});
