import assert from "node:assert/strict";
import test from "node:test";

import {
  buildG4L3ShellControlAssets,
  parseArguments,
} from "./build-g4-l3-shell-ffdec-control-assets.mjs";

test("control asset arguments accept only check mode", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--write"]), /Unknown argument/);
});

test("control assets retain every structural frame without runtime promotion", async () => {
  const manifests = await buildG4L3ShellControlAssets({check: true});
  assert.deepEqual(manifests.map(({runtime}) => [runtime.frameDomain, runtime.frameCount]), [
    ["sprite-302", 149],
    ["sprite-327", 132],
  ]);
  assert.deepEqual(manifests.map(({assets}) => assets.length), [20, 22]);
  assert.deepEqual(manifests.map(({geometry}) => geometry.rootPlacement.instanceName), ["popup", "mouseobj"]);
  for (const manifest of manifests) {
    assert.equal(manifest.frames.length, manifest.runtime.frameCount);
    assert.equal(manifest.authority.actionScriptExecuted, false);
    assert.equal(manifest.authority.originalRuntimeBaseline, false);
    assert.equal(manifest.strictAcceptanceEffect, "none");
  }
});
