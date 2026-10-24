import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { loadAnimationModule } from "../src/animation-registry";
import courseTs006, {
  COURSE_G04_L03_TS_006_MOVIE,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_CONTRACT,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_COLOR_PROJECTION,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_STATUS_STRIP,
  COURSE_G04_L03_TS_006_PROGRESS_THUMB_ASSET,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT,
  COURSE_G04_L03_TS_006_RUNTIME,
  COURSE_G04_L03_TS_006_SHELL_STRUCTURAL_ASSETS,
  COURSE_G04_L03_TS_006_SOURCE,
  COURSE_G04_L03_TS_006_SOURCE_CONTRACT,
  buildCourseG04L03Ts006CaptureAttributes,
  getCourseG04L03Ts006FrameState,
  normalizeCourseG04L03Ts006Frame,
} from "../src/modules/course-g04-l03-ts-006";
import { matchPrototype } from "../src/prototype-manifest";
import {
  COURSE_G04_L03_TS_006_AUTHORITY,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_CALIBRATION,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_COLOR_CALIBRATION,
  COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_ANCHORS,
  getCourseG04L03Ts006DiagnosticProgressWidth,
  getCourseG04L03Ts006DiagnosticCompositeState,
  getCourseG04L03Ts006ShellControlState,
} from "../src/timelines/course-g04-l03-ts-006";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const embeddedAudioPath =
  "artifacts/g4-l3-embedded-audio/sha256/4d/4d50cee1ee64bec0919933132ec250212474f236c699cd007a40f9ff2dce3122.mp3";
const publicSpanishAudioPath =
  "public/flash-assets/audio/courses/course-g04-l03-ts-006/es.mp3";
const diagnosticShellAssetBase =
  "public/flash-assets/courses/course-g04-l03-ts-006/diagnostic-composite-assets";
const sha256 = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");

test("TS006 keeps the 10-frame root and both nested source domains separate", async () => {
  assert.deepEqual(COURSE_G04_L03_TS_006_MOVIE.stage, {
    width: 800,
    height: 600,
  });
  assert.equal(COURSE_G04_L03_TS_006_MOVIE.fps, 12);
  assert.equal(COURSE_G04_L03_TS_006_MOVIE.frameCount, 128);
  assert.equal(COURSE_G04_L03_TS_006_RUNTIME.frameCount, 10);
  assert.equal(COURSE_G04_L03_TS_006_RUNTIME.defaultFrameDomain, "sprite-23");
  assert.deepEqual(COURSE_G04_L03_TS_006_RUNTIME.frameDomains, [
    { id: "sprite-23", frameCount: 128, fps: 12, rootFrame: 6 },
    { id: "sprite-3", frameCount: 1, fps: 12, rootFrame: 6 },
  ]);
  assert.equal(courseTs006.runtime, COURSE_G04_L03_TS_006_RUNTIME);
  assert.deepEqual(courseTs006.playbackEndFrameByDomain, {
    root: 1,
    "sprite-3": 1,
  });
  assert.equal(
    sha256(
      await readFile(`${repositoryRoot}${COURSE_G04_L03_TS_006_SOURCE.swf}`),
    ),
    COURSE_G04_L03_TS_006_SOURCE.swfSha256,
  );
});

test("TS006 binds both unresolved audio candidates by their actual bytes", async () => {
  const candidates = [
    [
      COURSE_G04_L03_TS_006_SOURCE.associatedAudio,
      COURSE_G04_L03_TS_006_SOURCE.associatedAudioSha256,
    ],
    [embeddedAudioPath, COURSE_G04_L03_TS_006_SOURCE.embeddedAudioSha256],
  ] as const;
  for (const [source, expectedSha256] of candidates) {
    assert.equal(
      sha256(await readFile(`${repositoryRoot}${source}`)),
      expectedSha256,
    );
  }
});

test("TS006 exposes the exact Spanish MP3 as a host-audio candidate without promoting acceptance", async () => {
  assert.equal(
    sha256(await readFile(`${repositoryRoot}${publicSpanishAudioPath}`)),
    COURSE_G04_L03_TS_006_SOURCE.associatedAudioSha256,
  );
  assert.deepEqual(courseTs006.audioTracks, [
    {
      id: "course-g04-l03-ts-006-en-source-audio",
      language: "en",
      spokenLanguage: "undetermined",
      label: "English source audio",
      source:
        "/flash-assets/courses/course-g04-l03-ts-006/audio/embedded-stream-0001.mp3",
      durationMs: 10582,
      sha256: COURSE_G04_L03_TS_006_SOURCE.embeddedAudioSha256,
      activation: "user",
      visibleWhen: ["en"],
      frameDomains: ["sprite-23"],
      timelineBehavior: "none",
    },
    {
      id: "course-g04-l03-ts-006-es-host-audio",
      language: "es",
      label: "Audio en español",
      source:
        "/flash-assets/courses/course-g04-l03-ts-006/audio/spanish-host-narration.mp3",
      durationMs: 7632,
      sha256: COURSE_G04_L03_TS_006_SOURCE.associatedAudioSha256,
      activation: "user",
      visibleWhen: ["en", "es"],
      frameDomains: ["sprite-23"],
      timelineBehavior: "pause-while-playing",
    },
  ]);
  assert.equal(
    COURSE_G04_L03_TS_006_SOURCE_CONTRACT.audioStatus,
    "exact-spanish-host-track-candidate-listening-unvalidated",
  );
  assert.equal(COURSE_G04_L03_TS_006_SOURCE_CONTRACT.ownerAccepted, false);
  assert.equal(COURSE_G04_L03_TS_006_DIAGNOSTIC_CONTRACT.audioRendered, false);
});

test("TS006 binds the exact Shell structural manifest and control bytes without promoting authority", async () => {
  const structural = COURSE_G04_L03_TS_006_SHELL_STRUCTURAL_ASSETS;
  const manifestBytes = await readFile(
    `${repositoryRoot}${structural.manifest.path}`,
  );
  assert.equal(manifestBytes.length, structural.manifest.bytes);
  assert.equal(sha256(manifestBytes), structural.manifest.sha256);
  assert.equal(
    structural.manifest.sha256,
    "aa99f9637c17026d8f763579ed907b8c7a2933ad2c95cd867d6cf2a3f6ee2a0d",
  );
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  assert.equal(manifest.classification, structural.classification);
  assert.equal(manifest.authority.originalRuntimeBaseline, false);
  assert.equal(manifest.authority.sourceFrameMappingEstablished, false);
  assert.equal(manifest.authority.audioRendered, false);
  assert.equal(manifest.strictAcceptanceEffect, "none");

  for (const asset of Object.values(structural.controls)) {
    const bytes = await readFile(
      `${repositoryRoot}${diagnosticShellAssetBase}/${asset.file}`,
    );
    assert.equal(bytes.length, asset.bytes, asset.role);
    assert.equal(sha256(bytes), asset.sha256, asset.role);
    const bound = manifest.assets.find(
      (entry: { role?: string }) => entry.role === asset.role,
    );
    assert.equal(bound?.file, asset.file, asset.role);
    assert.equal(bound?.bytes, asset.bytes, asset.role);
    assert.equal(bound?.sha256, asset.sha256, asset.role);
    assert.equal(bound?.sourceCharacterId, asset.sourceCharacterId, asset.role);
    assert.equal(bound?.sourceState, asset.sourceState, asset.role);
  }
  assert.equal(structural.controls.previous.mirrorX, true);
  assert.equal(structural.controls.next.mirrorX, false);
  assert.equal(
    structural.controls.spanishPageAudio.sourceAction,
    "_root.doPlaySpanishAudio()",
  );
  for (const [name, value] of Object.entries(structural.authority)) {
    if (name === "structuralPlacementMetadataIncluded") {
      assert.equal(value, true);
    } else if (name === "strictAcceptanceEffect") {
      assert.equal(value, "none");
    } else {
      assert.equal(value, false, name);
    }
  }
});

test("TS006 binds the source-structural progress thumb without promoting runtime behavior", async () => {
  const progressThumb = COURSE_G04_L03_TS_006_PROGRESS_THUMB_ASSET;
  const [manifestBytes, imageBytes] = await Promise.all([
    readFile(`${repositoryRoot}${progressThumb.manifest.path}`),
    readFile(`${repositoryRoot}${progressThumb.image.path}`),
  ]);
  assert.equal(manifestBytes.length, progressThumb.manifest.bytes);
  assert.equal(sha256(manifestBytes), progressThumb.manifest.sha256);
  assert.equal(imageBytes.length, progressThumb.image.bytes);
  assert.equal(sha256(imageBytes), progressThumb.image.sha256);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  assert.equal(manifest.runtime.frameDomain, progressThumb.sourceFrameDomain);
  assert.equal(
    manifest.runtime.sourceCharacterId,
    progressThumb.sourceCharacterId,
  );
  assert.equal(manifest.runtime.frameCount, progressThumb.sourceFrameCount);
  assert.equal(manifest.authority.originalRuntimeBaseline, false);
  assert.equal(manifest.authority.actionScriptExecuted, false);
  assert.equal(progressThumb.authority.originalRuntimeBaseline, false);
  assert.equal(progressThumb.authority.behaviorParityEstablished, false);
  assert.equal(progressThumb.authority.strictAcceptanceEffect, "none");
});

test("TS006 pure timeline selects deterministic Shell control visuals and keeps source actions disabled", () => {
  const first = getCourseG04L03Ts006ShellControlState(1);
  const playing = getCourseG04L03Ts006ShellControlState(127);
  const terminal = getCourseG04L03Ts006ShellControlState(128);
  assert.equal(first.playbackVisual, "pause");
  assert.equal(playing.playbackVisual, "pause");
  assert.equal(terminal.playbackVisual, "pause");
  assert.equal(first.progressWidthPixels, 0);
  assert.equal(playing.progressWidthPixels, 97);
  assert.equal(terminal.progressWidthPixels, 98);
  assert.equal(terminal.progressThumbOffsetPixels, 98);
  assert.equal(terminal.progressFillColor, "#28A4FF");
  assert.equal(terminal.progressTrackColor, "#717171");
  assert.equal(terminal.progressFillFilterInputColor, "#1C96FF");
  assert.equal(terminal.progressTrackFilterInputColor, "#606060");
  assert.equal(
    terminal.progressColorProjectionStatus,
    "acceptance-neutral-inverse-gamma-progress-input-not-authoritative",
  );
  assert.equal(
    terminal.statusStrip,
    COURSE_G04_L03_TS_006_DIAGNOSTIC_STATUS_STRIP,
  );
  assert.equal(terminal.statusStrip.blocks.length, 8);
  assert.deepEqual(
    terminal.statusStrip.blocks.map(({ x, observedOutputSrgbColor }) => [
      x,
      observedOutputSrgbColor,
    ]),
    [
      [9, "#f97100"],
      [49, "#f97100"],
      [89, "#f97100"],
      [129, "#f97100"],
      [169, "#facd00"],
      [209, "#ffffff"],
      [249, "#ffffff"],
      [289, "#ffffff"],
    ],
  );
  assert.deepEqual(terminal.statusStrip.geometry, {
    y: 529,
    height: 12,
    width: 14,
    edgeInsetPixels: 1,
  });
  assert.equal(terminal.statusStrip.activeOrdinal, null);
  assert.equal(terminal.statusStrip.blockOrdinalMeaning, "unresolved");
  assert.equal(terminal.statusStrip.ordinalAuthorityEstablished, false);
  assert.equal(terminal.statusStrip.sourceStaticPathAffected, false);
  assert.equal(terminal.statusStrip.wholeFrameOrRegionAssetUsed, false);
  assert.equal(terminal.statusStrip.strictAcceptanceEffect, "none");
  assert.equal(
    terminal.progressMappingStatus,
    "diagnostic-piecewise-anchor-projection-not-authoritative",
  );
  assert.equal(terminal.volumeVisual, "volume");
  assert.equal(terminal.previousNextVisual, "neutral-up");
  assert.equal(terminal.spanishPageAudioVisual, "up");
  assert.equal(terminal.replayVisual, "up");
  assert.equal(terminal.sourceActionsExecuted, false);
  assert.equal(terminal.audioRendered, false);
  assert.equal(terminal.strictAcceptanceEffect, "none");
  assert.equal(Object.isFrozen(terminal), true);
  assert.deepEqual(getCourseG04L03Ts006ShellControlState(128), terminal);
});

test("TS006 progress rectangles preserve semantic output colors through the diagnostic gamma filter", () => {
  const projection = COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_COLOR_PROJECTION;
  const projectChannel = (channel: number) =>
    Math.round(255 * (channel / 255) ** projection.filterExponent);
  const projectHex = (input: string) => {
    const channels = input.slice(1).match(/.{2}/gu);
    assert.ok(channels);
    return `#${channels
      .map((channel) =>
        projectChannel(Number.parseInt(channel, 16))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
      .toUpperCase()}`;
  };

  assert.equal(
    projectHex(projection.filterInputColors.fill),
    projection.semanticOutputColors.fill,
  );
  assert.equal(
    projectHex(projection.filterInputColors.track),
    projection.semanticOutputColors.track,
  );
  assert.equal(projection.progressRectanglesRemainInsideFilter, true);
  assert.equal(projection.progressThumbAffected, false);
  assert.equal(projection.progressMappingAffected, false);
  assert.equal(projection.sourceStaticPathAffected, false);
  assert.equal(projection.originalRuntimeColorPipelineEstablished, false);
  assert.equal(projection.strictAcceptanceEffect, "none");
});

test("TS006 diagnostic progress is a monotonic piecewise projection of all ten anchors", () => {
  assert.deepEqual(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_ANCHORS.map(
      ({ frame, widthPixels }) => [frame, widthPixels],
    ),
    [
      [1, 0],
      [8, 4],
      [13, 7],
      [55, 41],
      [58, 43],
      [74, 55],
      [77, 57],
      [125, 94],
      [127, 97],
      [128, 98],
    ],
  );
  for (const {
    frame,
    widthPixels,
  } of COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_ANCHORS) {
    assert.equal(
      getCourseG04L03Ts006DiagnosticProgressWidth(frame),
      widthPixels,
    );
  }
  const everyFrame = Array.from({ length: 128 }, (_, index) =>
    getCourseG04L03Ts006DiagnosticProgressWidth(index + 1),
  );
  assert.equal(
    everyFrame.every(
      (width, index) => index === 0 || width >= everyFrame[index - 1],
    ),
    true,
  );
  assert.equal(getCourseG04L03Ts006DiagnosticProgressWidth(Number.NaN), 0);
  assert.equal(getCourseG04L03Ts006DiagnosticProgressWidth(129), 98);
});

test("TS006 exposes only one-indexed English source-static sprite-23 frames", () => {
  assert.equal(normalizeCourseG04L03Ts006Frame(Number.NaN), 1);
  assert.equal(normalizeCourseG04L03Ts006Frame(129), 128);
  assert.equal(normalizeCourseG04L03Ts006Frame(8, "root"), 8);
  assert.equal(normalizeCourseG04L03Ts006Frame(8, "sprite-3"), 1);
  for (const frame of [1, 64, 128]) {
    const state = getCourseG04L03Ts006FrameState(frame, {
      frameDomain: "sprite-23",
      scenario: "source-static-frame",
      lang: "en",
      seed: frame === 128 ? -1 : 0,
    });
    assert.equal(state.status, "ready");
    assert.ok("exportFrame" in state);
    assert.equal(state.frame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.deepEqual(state.visibleSourceMarkers, ["four-step-plan"]);
    assert.equal(state.audioRendered, false);
    assert.equal(state.naturalRuntimeEstablished, false);
  }
});

test("TS006 fails closed for Spanish, root, companion, and mismatched requests", () => {
  const requests = [
    [
      "sprite-23",
      "source-static-frame",
      "es",
      "spanish-visual-and-audio-unvalidated",
    ],
    ["root", "root-unavailable", "en", "root-baseline-unavailable"],
    ["sprite-3", "sprite-3-unavailable", "en", "companion-domain-unrendered"],
    ["root", "source-static-frame", "en", "frame-domain-scenario-mismatch"],
  ] as const;
  for (const [frameDomain, scenario, lang, blocker] of requests) {
    const state = getCourseG04L03Ts006FrameState(1, {
      frameDomain,
      scenario,
      lang,
      seed: 0,
    });
    assert.equal(state.blocker, blocker);
  }
});

test("TS006 capture identity remains deterministic and muted", () => {
  const identity = {
    entryStateSha256: "a".repeat(64),
    requirementId: "engineering-source-static-frame-128",
    traceId: "engineering-source-static",
  };
  const state = getCourseG04L03Ts006FrameState(128, {
    frameDomain: "sprite-23",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
    ...identity,
  });
  assert.ok("exportFrame" in state);
  assert.equal(state.requirementId, identity.requirementId);
  assert.equal(state.traceId, identity.traceId);
  assert.equal(state.entryStateSha256, identity.entryStateSha256);
  const attributes = buildCourseG04L03Ts006CaptureAttributes({
    canvasStatus: "ready",
    frame: 128,
    frameDomain: "sprite-23",
    lang: "en",
    scenario: "source-static-frame",
    seed: 7,
    state,
    ...identity,
  });
  assert.equal(attributes["data-capture-stage"], "true");
  assert.equal(attributes["data-capture-identity-status"], "verified");
  assert.equal(attributes["data-flash-frame-domain"], "sprite-23");
  assert.equal(attributes["data-flash-lang"], "en");
  assert.equal(attributes["data-flash-scenario"], "source-static-frame");
  assert.equal(attributes["data-flash-seed"], 7);
  assert.equal(
    attributes["data-runtime-language"],
    attributes["data-flash-lang"],
  );
  assert.equal(
    attributes["data-runtime-scenario"],
    attributes["data-flash-scenario"],
  );
  assert.equal(attributes["data-runtime-seed"], attributes["data-flash-seed"]);
  assert.equal(attributes["data-source-controls-enabled"], "false");
  assert.equal(attributes["data-source-marker-visuals"], "four-step-plan");

  const unboundState = getCourseG04L03Ts006FrameState(128, {
    frameDomain: "sprite-23",
    scenario: "source-static-frame",
    lang: "en",
    seed: 7,
  });
  assert.ok("exportFrame" in unboundState);
  const unbound = buildCourseG04L03Ts006CaptureAttributes({
    canvasStatus: "ready",
    frame: 128,
    frameDomain: "sprite-23",
    lang: "en",
    scenario: "source-static-frame",
    seed: 7,
    state: unboundState,
    ...identity,
  });
  assert.equal(unbound["data-capture-stage"], undefined);
  assert.equal(unbound["data-capture-identity-status"], "blocked");

  const drifted = buildCourseG04L03Ts006CaptureAttributes({
    canvasStatus: "ready",
    frame: 128,
    frameDomain: "sprite-23",
    lang: "en",
    scenario: "source-static-frame",
    seed: 8,
    state,
    ...identity,
  });
  assert.equal(drifted["data-capture-stage"], undefined);
  assert.equal(drifted["data-capture-identity-status"], "blocked");
});

test("TS006 preserves historical projection values while blocking the content conflict", () => {
  const expected = [
    [1, 0, 0, 0, 0, 2032, 0],
    [8, 1 / 6, 0, 0, 0, 2045, 4],
    [13, 1, 0, 0, 0, 2054, 7],
    [55, 1, 0.25, 0, 0, 2134, 41],
    [58, 1, 1, 0, 0, 2140, 43],
    [74, 1, 1, 0.25, 0, 2170, 55],
    [77, 1, 1, 1, 0, 2176, 57],
    [125, 1, 1, 1, 1 / 3, 2267, 94],
    [127, 1, 1, 1, 1, 2271, 97],
    [128, 1, 1, 1, 1, 2272, 98],
  ] as const;
  for (const [
    frame,
    check,
    heading,
    list,
    show,
    captureOrdinal,
    progressWidth,
  ] of expected) {
    const state = getCourseG04L03Ts006DiagnosticCompositeState(frame, {
      frameDomain: "sprite-23",
      scenario: COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO,
      lang: "en",
      seed: 0,
    });
    assert.equal(state.frame, frame);
    assert.equal(state.status, "blocked");
    assert.equal(state.blocker, "diagnostic-source-page-content-conflict");
    assert.equal(state.checkYourWorkOpacity, check);
    assert.equal(state.strategiesHeadingOpacity, heading);
    assert.equal(state.strategyListOpacity, list);
    assert.equal(state.showYourWorkOpacity, show);
    assert.equal(state.mappedFirstRunCaptureOrdinal, captureOrdinal);
    assert.equal(state.shellControls.progressWidthPixels, progressWidth);
    assert.equal(
      state.colorCalibration,
      COURSE_G04_L03_TS_006_DIAGNOSTIC_COLOR_CALIBRATION,
    );
    assert.equal(state.colorCalibration.scope, "diagnostic-composite-only");
    assert.equal(state.colorCalibration.exponent, 5 / 6);
    assert.equal(state.colorCalibration.sourceStaticPathAffected, false);
    assert.equal(
      state.colorCalibration.originalRuntimeColorPipelineEstablished,
      false,
    );
    assert.equal(state.colorCalibration.strictAcceptanceEffect, "none");
    assert.equal(
      state.shellControls.manifestSha256,
      COURSE_G04_L03_TS_006_SHELL_STRUCTURAL_ASSETS.manifest.sha256,
    );
    assert.equal(state.strictAcceptanceEffect, "none");
  }
  assert.equal(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_CALIBRATION.sourceFrameMappingAuthority,
    "unresolved",
  );
  assert.equal(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_CALIBRATION.repeatedRuns.length,
    3,
  );
  assert.equal(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_CALIBRATION.firstNaturalRunAnchors.length,
    10,
  );
});

test("TS006 quarantines the conflicting diagnostic and preserves Spanish and identity blocks", () => {
  assert.deepEqual(COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.pageTitle, {
    x: 206,
    y: 67.25,
    width: 381,
    height: 24,
  });
  assert.deepEqual(COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.map, {
    x: 28,
    y: 548,
    width: 129,
    height: 40.5,
  });
  assert.deepEqual(COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.keyTerms, {
    x: 180,
    y: 548.5,
    width: 129,
    height: 40,
  });
  assert.deepEqual(COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.rewind, {
    x: 557,
    y: 531,
    width: 27,
    height: 26,
  });
  assert.deepEqual(COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.forward, {
    x: 708,
    y: 531.5,
    width: 27,
    height: 26,
  });
  assert.deepEqual(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.spanishPageAudio,
    { x: 631.25, y: 84.5, width: 134, height: 22 },
  );
  assert.deepEqual(COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.replay, {
    x: 563.78,
    y: 558.18,
    width: 27.22,
    height: 27.22,
  });
  assert.deepEqual(COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.playback, {
    x: 716.7,
    y: 558.8,
    width: 27.22,
    height: 27.22,
  });
  assert.deepEqual(COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.volumeIcon, {
    x: 601.7,
    y: 561.9,
    width: 21,
    height: 21,
  });
  assert.deepEqual(COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.volumeSlider, {
    x: 618.6,
    y: 564,
    width: 83.88,
    height: 17,
  });
  assert.deepEqual(COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.previous, {
    x: 500.95,
    y: 536,
    width: 44,
    height: 44,
  });
  assert.equal(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.status,
    "acceptance-neutral-diagnostic-layout-fit-not-original-runtime-validated",
  );
  assert.equal(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.sourceStaticPathAffected,
    false,
  );
  assert.equal(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.wholeFrameOrRegionAssetUsed,
    false,
  );
  assert.equal(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_SHELL_LAYOUT.strictAcceptanceEffect,
    "none",
  );
  const diagnosticMarkup = renderToStaticMarkup(
    createElement(courseTs006.Renderer, {
      entryStateSha256: "b".repeat(64),
      frame: 128,
      frameDomain: "sprite-23",
      requirementId: "diagnostic-ts006-composite-frame-128-en",
      scenario: COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO,
      lang: "en",
      seed: 0,
      traceId: "manual-runtime-diagnostic-piecewise-anchor-projection",
    }),
  );
  assert.match(diagnosticMarkup, /data-fail-closed-reason="diagnostic-source-page-content-conflict"/);
  assert.doesNotMatch(diagnosticMarkup, /<svg|data-capture-stage="true"|<audio\b|Check your work|Strategies to try/i);
  assert.equal(COURSE_G04_L03_TS_006_DIAGNOSTIC_CONTRACT.status, "blocked-source-page-content-conflict");
  assert.equal(COURSE_G04_L03_TS_006_DIAGNOSTIC_CONTRACT.sourceBinding.matchingContentAnimationId, "course-g04-l03-ts-005");
  assert.equal(COURSE_G04_L03_TS_006_DIAGNOSTIC_CONTRACT.audioRendered, false);
  assert.equal(COURSE_G04_L03_TS_006_DIAGNOSTIC_CONTRACT.ownerAccepted, false);
  assert.equal(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_CONTRACT.colorCalibration,
    COURSE_G04_L03_TS_006_DIAGNOSTIC_COLOR_CALIBRATION,
  );
  assert.equal(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_CONTRACT.progressColorProjection,
    COURSE_G04_L03_TS_006_DIAGNOSTIC_PROGRESS_COLOR_PROJECTION,
  );
  assert.equal(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_CONTRACT.shellStructuralAssetManifestSha256,
    COURSE_G04_L03_TS_006_SHELL_STRUCTURAL_ASSETS.manifest.sha256,
  );
  assert.equal(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_CONTRACT.shellSourceActionsExecuted,
    false,
  );
  assert.equal(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_CONTRACT.statusStripObservationStatus,
    COURSE_G04_L03_TS_006_DIAGNOSTIC_STATUS_STRIP.status,
  );
  assert.equal(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_CONTRACT.statusStripOrdinalAuthorityEstablished,
    false,
  );
  assert.equal(
    COURSE_G04_L03_TS_006_DIAGNOSTIC_CONTRACT.tablePatchSourceFill,
    "#fff5f4",
  );

  const playingMarkup = renderToStaticMarkup(
    createElement(courseTs006.Renderer, {
      entryStateSha256: "b".repeat(64),
      frame: 64,
      frameDomain: "sprite-23",
      requirementId: "diagnostic-ts006-composite-frame-064-en",
      scenario: COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO,
      lang: "en",
      seed: 0,
      traceId: "manual-runtime-diagnostic-piecewise-anchor-projection",
    }),
  );
  assert.match(playingMarkup, /diagnostic-source-page-content-conflict/);
  assert.doesNotMatch(playingMarkup, /<svg|data-capture-stage="true"/);

  const staleReadyState = {
    ...getCourseG04L03Ts006DiagnosticCompositeState(128, {
      frameDomain: "sprite-23",
      scenario: COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO,
      lang: "en", seed: 0,
    }),
    status: "ready", blocker: null,
    requirementId: "diagnostic-ts006-composite-frame-128-en",
    traceId: "manual-runtime-diagnostic-piecewise-anchor-projection",
    entryStateSha256: "b".repeat(64),
  };
  const cachedMarkup = renderToStaticMarkup(createElement(courseTs006.Renderer, {
    frame: 128, frameDomain: "sprite-23",
    scenario: COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO,
    lang: "en", seed: 0, state: staleReadyState,
    requirementId: staleReadyState.requirementId,
    traceId: staleReadyState.traceId,
    entryStateSha256: staleReadyState.entryStateSha256,
  }));
  assert.match(cachedMarkup, /diagnostic-source-page-content-conflict/);
  assert.doesNotMatch(cachedMarkup, /<svg|data-capture-stage="true"/);

  const spanishMarkup = renderToStaticMarkup(
    createElement(courseTs006.Renderer, {
      frame: 128,
      frameDomain: "sprite-23",
      scenario: COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO,
      lang: "es",
      seed: 0,
    }),
  );
  assert.match(
    spanishMarkup,
    /data-fail-closed-reason="spanish-diagnostic-observation-unavailable"/,
  );
  assert.doesNotMatch(spanishMarkup, /<svg/);
  assert.doesNotMatch(spanishMarkup, /<audio\b/i);

  const wrongDomain = getCourseG04L03Ts006DiagnosticCompositeState(1, {
    frameDomain: "root",
    scenario: COURSE_G04_L03_TS_006_DIAGNOSTIC_COMPOSITE_SCENARIO,
    lang: "en",
    seed: 0,
  });
  assert.equal(wrongDomain.status, "blocked");
  assert.equal(
    wrongDomain.blocker,
    "diagnostic-frame-domain-scenario-mismatch",
  );
});

test("TS006 remains prototype-only with every acceptance gate closed", async () => {
  const manifest = matchPrototype({ animationId: "course-g04-l03-ts-006" });
  assert.equal(manifest?.runtime.frameCount, 10);
  assert.equal(manifest?.movie.frameCount, 128);
  assert.equal(manifest?.title.en, "4 Step Plan");
  assert.equal(
    matchPrototype({ sourcePath: "/unknown/L3TS06.swf" }),
    undefined,
  );
  const registered = await loadAnimationModule("course-g04-l03-ts-006");
  assert.equal(registered?.maturity, "legacy-prototype");
  assert.equal(registered?.audioCues.length, 1);
  assert.equal(registered?.audioTracks?.length, 2);
  assert.equal(courseTs006.reducedMotionFrame, 1);
  assert.equal(COURSE_G04_L03_TS_006_SOURCE_CONTRACT.ownerAccepted, false);
  assert.equal(
    COURSE_G04_L03_TS_006_SOURCE_CONTRACT.shellStructuralAssetManifestSha256,
    COURSE_G04_L03_TS_006_SHELL_STRUCTURAL_ASSETS.manifest.sha256,
  );
  for (const [name, value] of Object.entries(COURSE_G04_L03_TS_006_AUTHORITY)) {
    if (name === "registryIsPrototypeOnly" || name === "strictAcceptanceEffect")
      continue;
    assert.equal(value, false, name);
  }
  assert.equal(COURSE_G04_L03_TS_006_AUTHORITY.registryIsPrototypeOnly, true);
  const englishMarkup = renderToStaticMarkup(
    createElement(courseTs006.Renderer, {
      frame: 1,
      frameDomain: "sprite-23",
      scenario: "source-static-frame",
      lang: "en",
      seed: 0,
    }),
  );
  assert.match(englishMarkup, /data-audio-rendered="false"/);
  assert.doesNotMatch(englishMarkup, /ts006-diagnostic-srgb-gamma-v12/);
  assert.doesNotMatch(englishMarkup, /<audio\b/i);
  const spanishMarkup = renderToStaticMarkup(
    createElement(courseTs006.Renderer, {
      frame: 1,
      frameDomain: "sprite-23",
      scenario: "source-static-frame",
      lang: "es",
      seed: 0,
    }),
  );
  assert.match(
    spanishMarkup,
    /data-fail-closed-reason="spanish-visual-and-audio-unvalidated"/,
  );
  assert.match(spanishMarkup, /data-audio-rendered="false"/);
  assert.match(spanishMarkup, /data-owner-accepted="false"/);
  assert.match(spanishMarkup, /data-strict-migration-complete="false"/);
  assert.doesNotMatch(spanishMarkup, /<canvas/);
  assert.doesNotMatch(spanishMarkup, /<audio\b/i);
});
