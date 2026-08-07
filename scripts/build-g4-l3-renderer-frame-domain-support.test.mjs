import assert from "node:assert/strict";
import test from "node:test";

import {parseArguments, validateG4L3RendererIndex} from "./build-g4-l3-renderer-frame-domain-support.mjs";

test("G4 L3 renderer wrapper accepts only check mode", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--write-anywhere"]), /Unknown option/);
});

test("G4 L3 renderer index remains acceptance-neutral and exact-scope", () => {
  const ids = Array.from({length: 40}, (_, index) => `member-${index + 1}`);
  const reports = ids.map((animationId, index) => ({
    animationId,
    declaredFrameDomainCount: index === 0 ? 222 : 1,
    probeCount: 4,
    renderableCount: 2,
    blockedCount: 2,
  }));
  const index = {
    schemaVersion: 1,
    evidenceType: "course-shell-pilot-renderer-frame-domain-support-index",
    scope: "explicit-animation-id-selection",
    pilotCount: 40,
    reports,
    totalProbeCount: 160,
    totalRenderableCount: 80,
    totalBlockedCount: 80,
    strictAcceptanceEffect: "none; fixture",
  };
  assert.deepEqual(validateG4L3RendererIndex(index, ids), {
    declaredDomains: 261,
    probes: 160,
    renderable: 80,
    blocked: 80,
  });
  index.strictAcceptanceEffect = "complete";
  assert.throws(() => validateG4L3RendererIndex(index, ids), /identity or authority drifted/);
});
