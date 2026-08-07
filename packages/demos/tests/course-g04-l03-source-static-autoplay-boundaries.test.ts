import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {fileURLToPath} from "node:url";

import type {
  AnimationModule,
  RuntimeContext,
} from "../src/contract";
import {
  G4_L3_SOURCE_STATIC_AUTOPLAY_BOUNDARIES,
  G4_L3_SOURCE_STATIC_AUTOPLAY_CONTRACT,
} from "../src/g4-l3-source-static-autoplay-contract";
import {
  G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES,
} from "../src/g4-l3-main-timeline-audio.generated";
import courseFq003 from "../src/modules/course-g04-l03-fq-003";
import courseIn004 from "../src/modules/course-g04-l03-in-004";
import courseIn005 from "../src/modules/course-g04-l03-in-005";
import courseIn012 from "../src/modules/course-g04-l03-in-012";
import courseTi002 from "../src/modules/course-g04-l03-ti-002";
import courseTi003 from "../src/modules/course-g04-l03-ti-003";
import courseTi004 from "../src/modules/course-g04-l03-ti-004";
import courseTi006 from "../src/modules/course-g04-l03-ti-006";
import courseTs007 from "../src/modules/course-g04-l03-ts-007";
import courseTs008 from "../src/modules/course-g04-l03-ts-008";
import courseVb003 from "../src/modules/course-g04-l03-vb-003";
import courseVb007 from "../src/modules/course-g04-l03-vb-007";
import courseVb008 from "../src/modules/course-g04-l03-vb-008";
import {frameAtElapsedMs} from "../src/runtime";
import type {SourceStaticCanvasCandidateConfig} from "../src/source-static-canvas-candidate";
import {
  COURSE_G04_L03_FQ_003_CONFIG,
  COURSE_G04_L03_FQ_003_SOURCE,
} from "../src/timelines/course-g04-l03-fq-003";
import {
  COURSE_G04_L03_IN_004_CONFIG,
  COURSE_G04_L03_IN_004_SOURCE,
} from "../src/timelines/course-g04-l03-in-004";
import {
  COURSE_G04_L03_IN_005_CONFIG,
  COURSE_G04_L03_IN_005_SOURCE,
} from "../src/timelines/course-g04-l03-in-005";
import {
  COURSE_G04_L03_IN_012_CONFIG,
  COURSE_G04_L03_IN_012_SOURCE,
} from "../src/timelines/course-g04-l03-in-012";
import {
  COURSE_G04_L03_TI_002_CONFIG,
  COURSE_G04_L03_TI_002_SOURCE,
} from "../src/timelines/course-g04-l03-ti-002";
import {
  COURSE_G04_L03_TI_003_CONFIG,
  COURSE_G04_L03_TI_003_SOURCE,
} from "../src/timelines/course-g04-l03-ti-003";
import {
  COURSE_G04_L03_TI_004_CONFIG,
  COURSE_G04_L03_TI_004_SOURCE,
} from "../src/timelines/course-g04-l03-ti-004";
import {
  COURSE_G04_L03_TI_006_CONFIG,
  COURSE_G04_L03_TI_006_SOURCE,
} from "../src/timelines/course-g04-l03-ti-006";
import {
  COURSE_G04_L03_TS_007_CONFIG,
  COURSE_G04_L03_TS_007_SOURCE,
} from "../src/timelines/course-g04-l03-ts-007";
import {
  COURSE_G04_L03_TS_008_CONFIG,
  COURSE_G04_L03_TS_008_SOURCE,
} from "../src/timelines/course-g04-l03-ts-008";
import {
  COURSE_G04_L03_VB_003_CONFIG,
  COURSE_G04_L03_VB_003_SOURCE,
} from "../src/timelines/course-g04-l03-vb-003";
import {
  COURSE_G04_L03_VB_007_CONFIG,
  COURSE_G04_L03_VB_007_SOURCE,
} from "../src/timelines/course-g04-l03-vb-007";
import {
  COURSE_G04_L03_VB_008_CONFIG,
  COURSE_G04_L03_VB_008_SOURCE,
} from "../src/timelines/course-g04-l03-vb-008";

interface SourceBinding {
  readonly swf: string;
  readonly swfSha256: string;
}

interface PageBinding {
  readonly config: SourceStaticCanvasCandidateConfig;
  readonly module: AnimationModule;
  readonly source: SourceBinding;
}

interface IndexedOperation {
  readonly operationId: string;
  readonly operationKind: string;
  readonly sourceEventIds: readonly string[];
  readonly scriptPath: string;
  readonly scriptSha256: string;
  readonly scope: Readonly<{
    frameDomainCandidate: string;
    sourceFrame: number | null;
  }>;
  readonly method: string | null;
  readonly canonicalTimelineMethod: string | null;
  readonly receiverExpression: string | null;
  readonly argumentExpressions: readonly string[];
  readonly exactExpression: string;
}

interface SourceOperationIndex {
  readonly schemaVersion: number;
  readonly reportType: string;
  readonly items: readonly Readonly<{
    animationId: string;
    source: Readonly<{
      swf: Readonly<{
        path: string;
        sha256: string;
        physicalHashVerifiedNow: boolean;
      }>;
    }>;
    operations: readonly IndexedOperation[];
  }>[];
  readonly acceptance: Readonly<{
    acceptanceNeutral: boolean;
    strictAcceptanceEffect: boolean;
  }>;
}

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const pages: readonly PageBinding[] = Object.freeze([
  {config: COURSE_G04_L03_FQ_003_CONFIG, module: courseFq003, source: COURSE_G04_L03_FQ_003_SOURCE},
  {config: COURSE_G04_L03_IN_004_CONFIG, module: courseIn004, source: COURSE_G04_L03_IN_004_SOURCE},
  {config: COURSE_G04_L03_IN_005_CONFIG, module: courseIn005, source: COURSE_G04_L03_IN_005_SOURCE},
  {config: COURSE_G04_L03_IN_012_CONFIG, module: courseIn012, source: COURSE_G04_L03_IN_012_SOURCE},
  {config: COURSE_G04_L03_TI_002_CONFIG, module: courseTi002, source: COURSE_G04_L03_TI_002_SOURCE},
  {config: COURSE_G04_L03_TI_003_CONFIG, module: courseTi003, source: COURSE_G04_L03_TI_003_SOURCE},
  {config: COURSE_G04_L03_TI_004_CONFIG, module: courseTi004, source: COURSE_G04_L03_TI_004_SOURCE},
  {config: COURSE_G04_L03_TI_006_CONFIG, module: courseTi006, source: COURSE_G04_L03_TI_006_SOURCE},
  {config: COURSE_G04_L03_TS_007_CONFIG, module: courseTs007, source: COURSE_G04_L03_TS_007_SOURCE},
  {config: COURSE_G04_L03_TS_008_CONFIG, module: courseTs008, source: COURSE_G04_L03_TS_008_SOURCE},
  {config: COURSE_G04_L03_VB_003_CONFIG, module: courseVb003, source: COURSE_G04_L03_VB_003_SOURCE},
  {config: COURSE_G04_L03_VB_007_CONFIG, module: courseVb007, source: COURSE_G04_L03_VB_007_SOURCE},
  {config: COURSE_G04_L03_VB_008_CONFIG, module: courseVb008, source: COURSE_G04_L03_VB_008_SOURCE},
]);

function runtimeContext(
  config: SourceStaticCanvasCandidateConfig,
  frame: number,
  replay: number,
): RuntimeContext {
  return {
    frame,
    frameDomain: config.mainFrameDomain,
    rootFrame: config.rootBeginFrame,
    scenario: "source-static-frame",
    lang: "en",
    seed: 0,
    traceId: "source-static-diagnostic",
    requirementId: "source-static-diagnostic",
    entryStateSha256: "0".repeat(64),
    replay,
  };
}

test("13 source-static autoplay boundaries bind the first exact main-domain stop()", async () => {
  const report = JSON.parse(
    await readFile(
      `${repositoryRoot}${G4_L3_SOURCE_STATIC_AUTOPLAY_CONTRACT.sourceOperationIndex.path}`,
      "utf8",
    ),
  ) as SourceOperationIndex;
  assert.equal(
    report.schemaVersion,
    G4_L3_SOURCE_STATIC_AUTOPLAY_CONTRACT.sourceOperationIndex.schemaVersion,
  );
  assert.equal(
    report.reportType,
    G4_L3_SOURCE_STATIC_AUTOPLAY_CONTRACT.sourceOperationIndex.reportType,
  );
  assert.equal(report.acceptance.acceptanceNeutral, true);
  assert.equal(report.acceptance.strictAcceptanceEffect, false);
  assert.equal(pages.length, 13);

  for (const page of pages) {
    const evidence =
      G4_L3_SOURCE_STATIC_AUTOPLAY_BOUNDARIES[
        page.config.animationId as keyof typeof G4_L3_SOURCE_STATIC_AUTOPLAY_BOUNDARIES
      ];
    assert.ok(evidence, page.config.animationId);
    const item = report.items.find(
      (candidate) => candidate.animationId === page.config.animationId,
    );
    assert.ok(item, page.config.animationId);
    assert.equal(item.source.swf.path, page.source.swf, page.config.animationId);
    assert.equal(
      item.source.swf.sha256,
      page.source.swfSha256,
      page.config.animationId,
    );
    assert.equal(item.source.swf.physicalHashVerifiedNow, true, page.config.animationId);

    const exactStops = item.operations
      .filter(
        (operation) =>
          operation.scope.frameDomainCandidate === page.config.mainFrameDomain &&
          Number.isSafeInteger(operation.scope.sourceFrame) &&
          operation.operationKind === G4_L3_SOURCE_STATIC_AUTOPLAY_CONTRACT.exactOperationKind &&
          operation.method === G4_L3_SOURCE_STATIC_AUTOPLAY_CONTRACT.exactTimelineMethod &&
          operation.canonicalTimelineMethod ===
            G4_L3_SOURCE_STATIC_AUTOPLAY_CONTRACT.exactTimelineMethod &&
          operation.receiverExpression === null &&
          operation.argumentExpressions.length === 0 &&
          operation.exactExpression ===
            G4_L3_SOURCE_STATIC_AUTOPLAY_CONTRACT.exactExpression,
      )
      .sort(
        (left, right) =>
          left.scope.sourceFrame! - right.scope.sourceFrame! ||
          left.operationId.localeCompare(right.operationId),
      );
    assert.ok(exactStops.length > 0, page.config.animationId);
    const first = exactStops[0]!;
    assert.deepEqual(
      first.sourceEventIds,
      [evidence.sourceEventId],
      page.config.animationId,
    );
    assert.deepEqual(
      {
        mainFrameDomain: page.config.mainFrameDomain,
        firstExactStopFrame: first.scope.sourceFrame,
        operationId: first.operationId,
        sourceEventId: evidence.sourceEventId,
        scriptPath: first.scriptPath,
        scriptSha256: first.scriptSha256,
      },
      evidence,
      page.config.animationId,
    );
    assert.equal(
      page.config.livePlaybackEndFrame,
      first.scope.sourceFrame,
      page.config.animationId,
    );
    assert.equal(
      page.module.playbackEndFrameByDomain?.[page.config.mainFrameDomain],
      first.scope.sourceFrame,
      page.config.animationId,
    );
  }
});

test("source stop boundaries limit autoplay without removing diagnostic direct seek", () => {
  for (const page of pages) {
    const endFrame = page.config.livePlaybackEndFrame!;
    const audioCandidate =
      G4_L3_MAIN_TIMELINE_AUDIO_CANDIDATES[page.config.animationId];
    if (page.config.animationId === "course-g04-l03-ti-003") {
      assert.deepEqual(
        page.module.audioCues.map(({id, frame, frameDomain}) => ({
          id,
          frame,
          frameDomain,
        })),
        [{
          id: "course-g04-l03-ti-003-embedded-event-sound-0014",
          frame: 1,
          frameDomain: "sprite-126",
        }],
        page.config.animationId,
      );
      assert.deepEqual(
        page.module.audioTracks?.map(({id, language, activation}) => ({
          id,
          language,
          activation,
        })),
        [{
          id: "course-g04-l03-ti-003-spanish-host-narration",
          language: "es",
          activation: "user",
        }],
        page.config.animationId,
      );
    } else {
      assert.deepEqual(
        page.module.audioCues,
        audioCandidate?.audioCues ?? [],
        page.config.animationId,
      );
      assert.deepEqual(
        page.module.audioTracks,
        audioCandidate?.audioTracks,
        page.config.animationId,
      );
    }
    const domainMovie = {
      stage: page.config.stage,
      fps: page.config.fps,
      frameCount: page.config.mainFrameCount,
      durationMs: (page.config.mainFrameCount * 1_000) / page.config.fps,
    };
    const insideStopFrame =
      ((endFrame - 1) * 1_000) / page.config.fps + 0.001;
    assert.equal(
      frameAtElapsedMs(insideStopFrame, domainMovie, "once", endFrame),
      endFrame,
      page.config.animationId,
    );
    assert.equal(
      frameAtElapsedMs(domainMovie.durationMs * 2, domainMovie, "once", endFrame),
      endFrame,
      page.config.animationId,
    );

    const diagnostic = page.module.getFrameState(
      page.config.mainFrameCount,
      runtimeContext(page.config, page.config.mainFrameCount, 0),
    ) as Readonly<{
      frame: number;
      frameDomain: string;
      status: string;
      interactiveControlsEnabled: boolean;
      audioRendered: boolean;
    }>;
    assert.equal(diagnostic.frame, page.config.mainFrameCount, page.config.animationId);
    assert.equal(diagnostic.frameDomain, page.config.mainFrameDomain, page.config.animationId);
    assert.equal(diagnostic.status, "ready", page.config.animationId);
    assert.equal(diagnostic.interactiveControlsEnabled, false, page.config.animationId);
    assert.equal(diagnostic.audioRendered, false, page.config.animationId);
  }
});

test("generic Replay reset restarts each source-stopped module at frame 1", () => {
  for (const page of pages) {
    const endFrame = page.config.livePlaybackEndFrame!;
    const domainMovie = {
      stage: page.config.stage,
      fps: page.config.fps,
      frameCount: page.config.mainFrameCount,
      durationMs: (page.config.mainFrameCount * 1_000) / page.config.fps,
    };
    assert.equal(
      frameAtElapsedMs(domainMovie.durationMs, domainMovie, "once", endFrame),
      endFrame,
      page.config.animationId,
    );
    assert.equal(
      frameAtElapsedMs(0, domainMovie, "once", endFrame),
      1,
      page.config.animationId,
    );
    const replayStart = page.module.getFrameState(
      1,
      runtimeContext(page.config, 1, 1),
    ) as Readonly<{frame: number; frameDomain: string; status: string}>;
    assert.equal(replayStart.frame, 1, page.config.animationId);
    assert.equal(replayStart.frameDomain, page.config.mainFrameDomain, page.config.animationId);
    assert.equal(replayStart.status, "ready", page.config.animationId);
  }
  assert.equal(G4_L3_SOURCE_STATIC_AUTOPLAY_CONTRACT.interactionEnabled, false);
  assert.equal(G4_L3_SOURCE_STATIC_AUTOPLAY_CONTRACT.audioEnabled, false);
  assert.equal(
    G4_L3_SOURCE_STATIC_AUTOPLAY_CONTRACT.authority.replayParityEstablished,
    false,
  );
  assert.equal(G4_L3_SOURCE_STATIC_AUTOPLAY_CONTRACT.strictAcceptanceEffect, "none");
});
