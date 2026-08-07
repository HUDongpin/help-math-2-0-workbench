import assert from "node:assert/strict";
import test from "node:test";

import {
  buildG4L3ShellProgressAssets,
  parseArguments,
} from "./build-g4-l3-shell-ffdec-progress-assets.mjs";

test("progress asset arguments accept only check mode", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--write"]), /Unknown argument/);
});

test("progress assets retain all 100 source-static frames without loading-causality promotion", async () => {
  const manifest = await buildG4L3ShellProgressAssets({check: true});
  assert.equal(manifest.runtime.frameDomain, "sprite-132");
  assert.equal(manifest.runtime.frameCount, 100);
  assert.equal(manifest.frames.length, 100);
  assert.equal(new Set(manifest.frames.map(({sha256}) => sha256)).size, 100);
  assert.equal(manifest.geometry.rootPlacementChain.length, 2);
  assert.deepEqual(manifest.geometry.effectiveRootTranslatePixels, {x: 394.25, y: 309.75});
  assert.deepEqual(manifest.geometry.rootCompositionOffset, {x: 23.05, y: 298.25});
  assert.equal(manifest.authority.actionScriptExecuted, false);
  assert.equal(manifest.authority.originalRuntimeBaseline, false);
  assert.equal(manifest.strictAcceptanceEffect, "none");
});
