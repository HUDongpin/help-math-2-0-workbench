import assert from "node:assert/strict";
import test from "node:test";

import {
  ADDITIONAL_DOMAIN_CONFIGS,
  buildG4L3ShellAdditionalDomains,
  parseArguments,
} from "./build-g4-l3-shell-ffdec-additional-domains.mjs";

test("additional shell domain arguments accept only check mode", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--write-anywhere"]), /Unknown argument/);
});

test("all 14 remaining multi-frame shell domains retain complete structural lookups", async () => {
  const manifests = await buildG4L3ShellAdditionalDomains({check: true});
  assert.equal(manifests.length, 14);
  assert.equal(manifests.reduce((sum, manifest) => sum + manifest.runtime.frameCount, 0), 142);
  assert.equal(manifests.reduce((sum, manifest) => sum + manifest.assets.length, 0), 41);
  assert.deepEqual(
    manifests.map(({runtime}) => [runtime.frameDomain, runtime.frameCount]),
    ADDITIONAL_DOMAIN_CONFIGS.map(({frameDomain, frameCount}) => [frameDomain, frameCount]),
  );
  for (const manifest of manifests) {
    assert.equal(manifest.frames.length, manifest.runtime.frameCount);
    assert.equal(manifest.deduplication.everyFrameMapped, true);
    assert.equal(manifest.authority.actionScriptExecuted, false);
    assert.equal(manifest.authority.originalRuntimeBaseline, false);
    assert.equal(manifest.authority.naturalPlaybackClaimed, false);
    assert.equal(manifest.strictAcceptanceEffect, "none");
    assert.equal(manifest.geometry.rootPlacementChain.length >= 1, true);
    assert.equal(Number.isFinite(manifest.geometry.rootCompositionMatrix.e), true);
    assert.equal(Number.isFinite(manifest.geometry.rootCompositionMatrix.f), true);
  }
});
