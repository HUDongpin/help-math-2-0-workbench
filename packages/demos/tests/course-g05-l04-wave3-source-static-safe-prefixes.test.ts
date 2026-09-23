import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";

import type {SourceStaticCanvasFrameState} from
  "../src/source-static-canvas-candidate";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const candidates = [
  ["course-g05-l04-vb-003", "sprite-95", 175, 125,
    () => import("../src/modules/course-g05-l04-vb-003")],
  ["course-g05-l04-vb-004", "sprite-71", 257, 208,
    () => import("../src/modules/course-g05-l04-vb-004")],
  ["course-g05-l04-in-006", "sprite-103", 464, 413,
    () => import("../src/modules/course-g05-l04-in-006")],
  ["course-g05-l04-in-008", "sprite-123", 195, 121,
    () => import("../src/modules/course-g05-l04-in-008")],
  ["course-g05-l04-in-011", "sprite-231", 428, 341,
    () => import("../src/modules/course-g05-l04-in-011")],
  ["course-g05-l04-in-019", "sprite-265", 274, 220,
    () => import("../src/modules/course-g05-l04-in-019")],
  ["course-g05-l04-in-021", "sprite-97", 288, 286,
    () => import("../src/modules/course-g05-l04-in-021")],
  ["course-g05-l04-in-022", "sprite-355", 475, 411,
    () => import("../src/modules/course-g05-l04-in-022")],
  ["course-g05-l04-ti-002", "sprite-413", 275, 256,
    () => import("../src/modules/course-g05-l04-ti-002")],
  ["course-g05-l04-ti-003", "sprite-270", 164, 162,
    () => import("../src/modules/course-g05-l04-ti-003")],
  ["course-g05-l04-ti-004", "sprite-299", 472, 197,
    () => import("../src/modules/course-g05-l04-ti-004")],
  ["course-g05-l04-ti-005", "sprite-272", 363, 137,
    () => import("../src/modules/course-g05-l04-ti-005")],
  ["course-g05-l04-ti-006", "sprite-191", 237, 187,
    () => import("../src/modules/course-g05-l04-ti-006")],
  ["course-g05-l04-ti-007", "sprite-177", 167, 111,
    () => import("../src/modules/course-g05-l04-ti-007")],
  ["course-g05-l04-ti-008", "sprite-160", 146, 94,
    () => import("../src/modules/course-g05-l04-ti-008")],
  ["course-g05-l04-ti-009", "sprite-171", 114, 96,
    () => import("../src/modules/course-g05-l04-ti-009")],
  ["course-g05-l04-gs-002", "sprite-436", 460, 451,
    () => import("../src/modules/course-g05-l04-gs-002")],
] as const;

const disallowedRuntimePatterns = [
  /\beval\s*\(/,
  /\bFunction\s*\(/,
  /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/,
  /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/,
  /\b(?:Worker|SharedWorker)\s*\(/,
  /\b(?:localStorage|sessionStorage|indexedDB)\b/,
  /\bimport\s*\(/,
  /\b(?:addEventListener|removeEventListener)\s*\(/,
];

test("wave 3 exposes exactly 3,816 source-static safe-prefix frames", async () => {
  assert.equal(candidates.length, 17);
  assert.equal(
    candidates.reduce((sum, candidate) => sum + candidate[3], 0),
    3_816,
  );
  assert.equal(
    candidates.reduce(
      (sum, candidate) => sum + candidate[2] - candidate[3],
      0,
    ),
    1_138,
  );

  for (const [id, frameDomain, frameCount, lastSafeFrame, load] of candidates) {
    const loaded = await load();
    const module = loaded.default;
    assert.equal(module.key, id);
    assert.equal(module.maturity, "legacy-prototype", id);
    assert.deepEqual(module.movie.stage, {width: 800, height: 600});
    assert.equal(module.movie.fps, 12, id);
    assert.equal(module.movie.frameCount, frameCount, id);
    assert.equal(module.runtime?.frameCount, 10, id);
    assert.equal(module.runtime?.defaultFrameDomain, frameDomain, id);
    assert.deepEqual(module.runtime?.frameDomains, [{
      id: frameDomain,
      frameCount,
      fps: 12,
      rootFrame: 6,
    }], id);
    assert.equal(module.playbackEndFrameByDomain?.[frameDomain], lastSafeFrame);

    const ready = module.getFrameState(lastSafeFrame, {
      entryStateSha256: "a".repeat(64),
      frame: lastSafeFrame,
      frameDomain,
      lang: "en",
      requirementId: `engineering:${id}:safe-prefix`,
      scenario: "source-static-frame",
      seed: 0,
      traceId: `source-static:${frameDomain}`,
    }) as SourceStaticCanvasFrameState;
    assert.equal(ready.status, "ready", id);
    assert.equal(ready.exportFrame, lastSafeFrame - 1, id);
    assert.equal(ready.rootFrame, 6, id);
    assert.equal(ready.interactiveControlsEnabled, false, id);
    assert.equal(ready.audioRendered, false, id);
    assert.ok(ready.visibleSourceMarkers.length > 0, id);

    for (const frame of [lastSafeFrame + 1, frameCount]) {
      const blocked = module.getFrameState(frame, {
        frame,
        frameDomain,
        lang: "en",
        scenario: "source-static-frame",
        seed: 0,
      }) as SourceStaticCanvasFrameState;
      assert.equal(blocked.status, "blocked", `${id}:${frame}`);
      assert.equal(
        blocked.blocker,
        "source-behavior-dependent-frame-unvalidated",
        `${id}:${frame}`,
      );
      assert.equal(blocked.sourceStaticVisualReady, false, `${id}:${frame}`);
      assert.deepEqual(blocked.visibleSourceMarkers, [], `${id}:${frame}`);
    }

    const spanish = module.getFrameState(1, {
      frame: 1,
      frameDomain,
      lang: "es",
      scenario: "source-static-frame",
      seed: 0,
    }) as SourceStaticCanvasFrameState;
    assert.equal(spanish.status, "blocked", id);
    assert.equal(spanish.blocker, "spanish-visual-and-audio-unvalidated", id);

    const root = module.getFrameState(1, {
      frame: 1,
      frameDomain: "root",
      lang: "en",
      scenario: "root-unavailable",
      seed: 0,
    }) as SourceStaticCanvasFrameState;
    assert.equal(root.status, "blocked", id);
    assert.equal(root.blocker, "root-baseline-unavailable", id);
  }
});

test("wave 3 generated evidence binds exact safe-prefix boundaries without promotion", async () => {
  for (const [id, frameDomain, frameCount, lastSafeFrame] of candidates) {
    const [spec, report, manifest, runtimeBytes] = await Promise.all([
      readFile(
        `${repositoryRoot}migrations/${id}/audit/source-static-current-js-candidate-spec.json`,
        "utf8",
      ).then(JSON.parse),
      readFile(
        `${repositoryRoot}migrations/${id}/evidence/source-static-current-js-candidate.json`,
        "utf8",
      ).then(JSON.parse),
      readFile(
        `${repositoryRoot}public/flash-assets/courses/${id}/manifest.json`,
        "utf8",
      ).then(JSON.parse),
      readFile(
        `${repositoryRoot}public/flash-assets/courses/${id}/canvas-renderer.js`,
      ),
    ]);
    const blockedFrameCount = frameCount - lastSafeFrame;
    assert.equal(spec.timeline.local.timelineId, frameDomain, id);
    assert.equal(spec.timeline.local.frameCount, frameCount, id);
    assert.equal(
      spec.runtimeContract.safePrefixBoundary.lastSafeFrame,
      lastSafeFrame,
      id,
    );
    assert.equal(
      spec.runtimeContract.safePrefixBoundary.firstBlockedFrame,
      lastSafeFrame + 1,
      id,
    );
    assert.deepEqual(spec.runtimeContract.blockedLocalFrameRanges, [{
      firstFrame: lastSafeFrame + 1,
      lastFrame: frameCount,
      reason: spec.runtimeContract.blockedLocalFrameRanges[0].reason,
    }], id);
    assert.equal(sha256(await readFile(`${repositoryRoot}${spec.source.swf}`)),
      spec.source.swfSha256, id);
    assert.equal(manifest.output.sha256, sha256(runtimeBytes), id);
    assert.equal(manifest.browserQa.renderedFrameCount, lastSafeFrame, id);
    assert.equal(manifest.browserQa.blockedFrameCount, blockedFrameCount, id);
    assert.equal(
      manifest.browserQa.blockedRequestRejectionCount,
      blockedFrameCount * 2,
      id,
    );
    assert.deepEqual(
      manifest.sourceStaticFrameContract.safePrefixBoundary,
      report.renderer.safePrefixBoundary,
      id,
    );
    assert.deepEqual(
      manifest.inputs.safePrefixBoundaryEvidence,
      report.renderer.safePrefixBoundary,
      id,
    );
    assert.equal(
      report.renderer.safePrefixBoundary.scenarioAntecedent.immutable,
      true,
      id,
    );
    assert.equal(manifest.safety.noLegacyActionScriptExecuted, true, id);
    assert.equal(manifest.safety.noNetworkPrimitives, true, id);
    assert.equal(manifest.safety.noTimersOrAutoplay, true, id);
    assert.equal(manifest.safety.pointerEventsEnabled, false, id);
    assert.equal(manifest.safety.audioRendered, false, id);
    assert.equal(report.evidenceBoundary.originalRuntimeBaselineUsed, false, id);
    assert.equal(report.evidenceBoundary.normalizedRmseComputed, false, id);
    assert.equal(report.evidenceBoundary.humanVisualReviewPerformed, false, id);
    assert.equal(report.evidenceBoundary.ownerReviewPerformed, false, id);
    assert.ok(Object.values(report.acceptanceEffects).every(
      (value) => value === false,
    ), id);

    const runtimeSource = runtimeBytes.toString("utf8");
    assert.doesNotThrow(() => new Script(runtimeSource, {filename: id}), id);
    for (const pattern of disallowedRuntimePatterns) {
      assert.doesNotMatch(runtimeSource, pattern, `${id}:${pattern}`);
    }
  }
});

test("wave 3 preserves TI002 as explicit SWF-only source evidence", async () => {
  const spec = JSON.parse(await readFile(
    `${repositoryRoot}migrations/course-g05-l04-ti-002/audit/source-static-current-js-candidate-spec.json`,
    "utf8",
  ));
  assert.equal(spec.source.pairedFlaStatus, "missing");
  assert.equal(spec.source.fla, null);
  assert.equal(spec.source.flaBytes, null);
  assert.equal(spec.source.flaSha256, null);
});
