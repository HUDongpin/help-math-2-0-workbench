import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {Script} from "node:vm";

import {loadAnimationModule} from "../src/animation-registry";
import {matchPrototype} from "../src/prototype-manifest";
import type {SourceStaticCanvasFrameState} from "../src/source-static-canvas-candidate";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

const candidates = [
  {
    id: "course-g05-l04-rw-002",
    frameDomain: "sprite-341",
    frameCount: 419,
    renderableFrameCount: 419,
    livePlaybackEndFrame: 419,
    blockedRange: null,
  },
  {
    id: "course-g05-l04-in-004",
    frameDomain: "sprite-436",
    frameCount: 320,
    renderableFrameCount: 307,
    livePlaybackEndFrame: 307,
    blockedRange: {firstFrame: 308, lastFrame: 320},
  },
  {
    id: "course-g05-l04-in-018",
    frameDomain: "sprite-220",
    frameCount: 275,
    renderableFrameCount: 217,
    livePlaybackEndFrame: 217,
    blockedRange: {firstFrame: 218, lastFrame: 275},
  },
  {
    id: "course-g05-l04-in-017",
    frameDomain: "sprite-494",
    frameCount: 541,
    renderableFrameCount: 373,
    livePlaybackEndFrame: 373,
    blockedRange: {firstFrame: 374, lastFrame: 541},
  },
  {
    id: "course-g05-l04-in-016",
    frameDomain: "sprite-264",
    frameCount: 299,
    renderableFrameCount: 190,
    livePlaybackEndFrame: 190,
    blockedRange: {firstFrame: 191, lastFrame: 299},
  },
  {
    id: "course-g05-l04-in-014",
    frameDomain: "sprite-170",
    frameCount: 197,
    renderableFrameCount: 83,
    livePlaybackEndFrame: 83,
    blockedRange: {firstFrame: 84, lastFrame: 197},
  },
  {
    id: "course-g05-l04-in-013",
    frameDomain: "sprite-170",
    frameCount: 178,
    renderableFrameCount: 82,
    livePlaybackEndFrame: 82,
    blockedRange: {firstFrame: 83, lastFrame: 178},
  },
  {
    id: "course-g05-l04-in-010",
    frameDomain: "sprite-58",
    frameCount: 180,
    renderableFrameCount: 129,
    livePlaybackEndFrame: 129,
    blockedRange: {firstFrame: 130, lastFrame: 180},
  },
  {
    id: "course-g05-l04-in-005",
    frameDomain: "sprite-222",
    frameCount: 226,
    renderableFrameCount: 92,
    livePlaybackEndFrame: 92,
    blockedRange: {firstFrame: 93, lastFrame: 226},
  },
  {
    id: "course-g05-l04-in-003",
    frameDomain: "sprite-217",
    frameCount: 182,
    renderableFrameCount: 73,
    livePlaybackEndFrame: 73,
    blockedRange: {firstFrame: 74, lastFrame: 182},
  },
  {
    id: "course-g05-l04-vb-007",
    frameDomain: "sprite-230",
    frameCount: 136,
    renderableFrameCount: 52,
    livePlaybackEndFrame: 52,
    blockedRange: {firstFrame: 53, lastFrame: 136},
  },
  {
    id: "course-g05-l04-vb-010",
    frameDomain: "sprite-228",
    frameCount: 88,
    renderableFrameCount: 35,
    livePlaybackEndFrame: 35,
    blockedRange: {firstFrame: 36, lastFrame: 88},
  },
  {
    id: "course-g05-l04-vb-011",
    frameDomain: "sprite-225",
    frameCount: 81,
    renderableFrameCount: 32,
    livePlaybackEndFrame: 32,
    blockedRange: {firstFrame: 33, lastFrame: 81},
  },
  {
    id: "course-g05-l04-ts-008",
    frameDomain: "sprite-435",
    frameCount: 695,
    renderableFrameCount: 272,
    livePlaybackEndFrame: 272,
    blockedRange: {firstFrame: 273, lastFrame: 695},
  },
  {
    id: "course-g05-l04-ts-007",
    frameDomain: "sprite-462",
    frameCount: 684,
    renderableFrameCount: 263,
    livePlaybackEndFrame: 263,
    blockedRange: {firstFrame: 264, lastFrame: 684},
  },
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

test("fifteen added G5 L4 candidates preserve exact domains and fail-closed prefixes", async () => {
  for (const candidate of candidates) {
    const module = await loadAnimationModule(candidate.id);
    assert.ok(module, candidate.id);
    assert.equal(module.maturity, "legacy-prototype", candidate.id);
    assert.deepEqual(module.movie.stage, {width: 800, height: 600});
    assert.equal(module.movie.fps, 12);
    assert.equal(module.movie.frameCount, candidate.frameCount, candidate.id);
    const runtime = module.runtime;
    assert.ok(runtime, candidate.id);
    assert.equal(runtime.frameCount, 10, candidate.id);
    assert.equal(
      runtime.defaultFrameDomain,
      candidate.frameDomain,
      candidate.id,
    );
    assert.deepEqual(runtime.frameDomains, [{
      id: candidate.frameDomain,
      frameCount: candidate.frameCount,
      fps: 12,
      rootFrame: 6,
    }], candidate.id);

    const ready = module.getFrameState(candidate.livePlaybackEndFrame, {
      entryStateSha256: "a".repeat(64),
      frame: candidate.livePlaybackEndFrame,
      frameDomain: candidate.frameDomain,
      lang: "en",
      requirementId: `engineering:${candidate.id}:safe-prefix`,
      scenario: "source-static-frame",
      seed: 0,
      traceId: `source-static:${candidate.frameDomain}`,
    }) as SourceStaticCanvasFrameState;
    assert.equal(ready.status, "ready", candidate.id);
    assert.equal(ready.frame, candidate.livePlaybackEndFrame, candidate.id);
    assert.equal(ready.exportFrame, candidate.livePlaybackEndFrame - 1);
    assert.equal(ready.rootFrame, 6);
    assert.equal(ready.interactiveControlsEnabled, false);
    assert.equal(ready.audioRendered, false);
    assert.ok(ready.visibleSourceMarkers.length > 0, candidate.id);

    const spanish = module.getFrameState(1, {
      frame: 1,
      frameDomain: candidate.frameDomain,
      lang: "es",
      scenario: "source-static-frame",
      seed: 0,
    }) as SourceStaticCanvasFrameState;
    assert.equal(
      spanish.blocker,
      "spanish-visual-and-audio-unvalidated",
      candidate.id,
    );
    const root = module.getFrameState(1, {
      frame: 1,
      frameDomain: "root",
      lang: "en",
      scenario: "root-unavailable",
      seed: 0,
    }) as SourceStaticCanvasFrameState;
    assert.equal(root.blocker, "root-baseline-unavailable", candidate.id);

    if (candidate.blockedRange) {
      assert.equal(
        module.playbackEndFrameByDomain?.[candidate.frameDomain],
        candidate.livePlaybackEndFrame,
        candidate.id,
      );
      for (const frame of [
        candidate.blockedRange.firstFrame,
        candidate.blockedRange.lastFrame,
      ]) {
        const blocked = module.getFrameState(frame, {
          frame,
          frameDomain: candidate.frameDomain,
          lang: "en",
          scenario: "source-static-frame",
          seed: 0,
        }) as SourceStaticCanvasFrameState;
        assert.equal(blocked.status, "blocked", `${candidate.id}:${frame}`);
        assert.equal(
          blocked.blocker,
          "source-behavior-dependent-frame-unvalidated",
          `${candidate.id}:${frame}`,
        );
        assert.equal(blocked.sourceStaticVisualReady, false);
        assert.deepEqual(blocked.visibleSourceMarkers, []);
      }
    }
  }
});

test("fifteen generated runtimes and reports bind exact safe-prefix QA without acceptance promotion", async () => {
  const registrySource = await readFile(
    `${repositoryRoot}packages/demos/src/registry.generated.ts`,
    "utf8",
  );
  for (const candidate of candidates) {
    const [spec, report, manifest, runtimeBytes] = await Promise.all([
      readFile(
        `${repositoryRoot}migrations/${candidate.id}/audit/source-static-current-js-candidate-spec.json`,
        "utf8",
      ).then(JSON.parse),
      readFile(
        `${repositoryRoot}migrations/${candidate.id}/evidence/source-static-current-js-candidate.json`,
        "utf8",
      ).then(JSON.parse),
      readFile(
        `${repositoryRoot}public/flash-assets/courses/${candidate.id}/manifest.json`,
        "utf8",
      ).then(JSON.parse),
      readFile(
        `${repositoryRoot}public/flash-assets/courses/${candidate.id}/canvas-renderer.js`,
      ),
    ]);
    const blockedFrameCount =
      candidate.frameCount - candidate.renderableFrameCount;
    assert.equal(
      sha256(await readFile(`${repositoryRoot}${spec.source.swf}`)),
      spec.source.swfSha256,
      candidate.id,
    );
    assert.equal(report.renderer.frameDomain, candidate.frameDomain);
    assert.equal(report.renderer.lastFrame, candidate.frameCount);
    assert.equal(
      report.renderer.lastRenderableFrame,
      candidate.livePlaybackEndFrame,
    );
    assert.equal(
      report.renderer.renderableFrameCount,
      candidate.renderableFrameCount,
    );
    assert.equal(
      report.browserQa.renderedFrameCount,
      candidate.renderableFrameCount,
    );
    assert.equal(report.browserQa.blockedFrameCount, blockedFrameCount);
    assert.equal(
      report.browserQa.blockedRequestRejectionCount,
      blockedFrameCount * 2,
    );
    assert.equal(report.evidenceBoundary.originalRuntimeBaselineUsed, false);
    assert.equal(report.evidenceBoundary.normalizedRmseComputed, false);
    assert.equal(report.evidenceBoundary.humanVisualReviewPerformed, false);
    assert.equal(report.evidenceBoundary.ownerReviewPerformed, false);
    assert.ok(Object.values(report.acceptanceEffects).every(
      (value) => value === false,
    ));
    assert.equal(manifest.output.sha256, sha256(runtimeBytes), candidate.id);
    assert.equal(manifest.safety.noLegacyActionScriptExecuted, true);
    assert.equal(manifest.safety.noNetworkPrimitives, true);
    assert.equal(manifest.safety.noTimersOrAutoplay, true);
    assert.equal(manifest.safety.pointerEventsEnabled, false);
    assert.equal(manifest.safety.audioRendered, false);
    assert.deepEqual(
      manifest.sourceStaticFrameContract.blockedLocalFrameRanges,
      spec.runtimeContract.blockedLocalFrameRanges,
      candidate.id,
    );
    const runtimeSource = runtimeBytes.toString("utf8");
    assert.doesNotThrow(
      () => new Script(runtimeSource, {filename: candidate.id}),
      candidate.id,
    );
    for (const pattern of disallowedRuntimePatterns) {
      assert.doesNotMatch(runtimeSource, pattern, `${candidate.id}:${pattern}`);
    }
    assert.match(
      registrySource,
      new RegExp(
        `'${candidate.id}': \\(\\) => import\\('\\./modules/${candidate.id}'\\)`,
      ),
      candidate.id,
    );
    const prototype = matchPrototype({animationId: candidate.id});
    assert.equal(prototype?.runtime.frameCount, 10, candidate.id);
    assert.equal(prototype?.movie.frameCount, candidate.frameCount, candidate.id);
    assert.deepEqual(prototype?.sourceBasenames, [], candidate.id);
  }
});

test("RW002 candidate remains acceptance-neutral and does not satisfy work-study evidence", async () => {
  const [spec, report] = await Promise.all([
    readFile(
      `${repositoryRoot}migrations/course-g05-l04-rw-002/audit/source-static-current-js-candidate-spec.json`,
      "utf8",
    ).then(JSON.parse),
    readFile(
      `${repositoryRoot}migrations/course-g05-l04-rw-002/evidence/source-static-current-js-candidate.json`,
      "utf8",
    ).then(JSON.parse),
  ]);
  assert.match(
    spec.runtimeContract.unresolved.join("\n"),
    /work-study labor evidence/,
  );
  assert.equal(report.acceptanceEffects.humanVisualReviewAccepted, false);
  assert.equal(report.acceptanceEffects.ownerAccepted, false);
  assert.equal(report.acceptanceEffects.strictMigrationComplete, false);
  assert.equal(report.acceptanceEffects.published, false);
});
