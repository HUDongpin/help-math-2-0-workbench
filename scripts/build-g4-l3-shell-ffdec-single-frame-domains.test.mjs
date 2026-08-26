import assert from "node:assert/strict";
import test from "node:test";

import {buildG4L3ShellSingleFrameDomains, parseArguments, SINGLE_FRAME_DOMAIN_CONFIGS} from "./build-g4-l3-shell-ffdec-single-frame-domains.mjs";

test("single-frame shell domain arguments accept only check mode", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--promote"]), /Unknown argument/);
});

test("all 14 scripted or interactive one-frame shell domains retain source-bound structural lookups", async () => {
  const manifests = await buildG4L3ShellSingleFrameDomains({check: true});
  assert.equal(manifests.length, 14);
  assert.deepEqual(manifests.map(({runtime}) => runtime.frameDomain), SINGLE_FRAME_DOMAIN_CONFIGS.map(({frameDomain}) => frameDomain));
  for (const manifest of manifests) {
    assert.equal(manifest.runtime.frameCount, 1);
    assert.equal(manifest.frames.length, 1);
    assert.equal(manifest.assets.length, 1);
    assert.equal(manifest.deduplication.everyFrameMapped, true);
    assert.equal(manifest.authority.actionScriptExecuted, false);
    assert.equal(manifest.authority.originalRuntimeBaseline, false);
    assert.equal(manifest.authority.naturalPlaybackClaimed, false);
    assert.equal(manifest.strictAcceptanceEffect, "none");
    assert.equal(manifest.geometry.rootPlacementChain.length >= 1, true);
  }
});
