import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildG4L3ShellNativeMenuAssets,
  parseArguments,
} from "./build-g4-l3-shell-ffdec-native-menu-assets.mjs";

test("native-menu asset arguments accept only check mode", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--write"]), /Unknown argument/);
});

test("native-menu assets remain a hash-bound structural nested timeline only", async () => {
  const manifest = await buildG4L3ShellNativeMenuAssets({check: true});
  assert.equal(manifest.animationId, "shell-course-g04-l03-index-local");
  assert.equal(manifest.runtime.frameDomain, "sprite-1011");
  assert.equal(manifest.runtime.sourceCharacterId, 1011);
  assert.equal(manifest.runtime.frameCount, 48);
  assert.deepEqual(manifest.geometry.exporterCanvas, {width: 1368, height: 719});
  assert.deepEqual(manifest.geometry.exporterLocalOrigin, {x: 726.8, y: 671.5});
  assert.equal(manifest.geometry.rootPlacement.rootFrame, 50);
  assert.equal(manifest.geometry.rootPlacement.depth, 263);
  assert.equal(manifest.geometry.rootPlacement.instanceName, "m1_l1");
  assert.deepEqual(manifest.geometry.rootCompositionOffset, {x: -486.65, y: -126.1});
  assert.equal(manifest.authority.actionScriptExecuted, false);
  assert.equal(manifest.authority.originalRuntimeBaseline, false);
  assert.equal(manifest.strictAcceptanceEffect, "none");
  assert.equal(manifest.frames.length, 48);
  assert.equal(new Set(manifest.frames.map(({sha256}) => sha256)).size, 33);
  for (const frame of manifest.frames) {
    assert.equal(frame.width, 1368);
    assert.equal(frame.height, 719);
    await readFile(
      new URL(`../public/flash-assets/courses/shell-course-g04-l03-index-local/sprite-1011/${frame.file}`, import.meta.url),
    );
  }
});
