#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {Script} from "node:vm";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SPEC = "migrations/course-g03-l06-ti-001/audit/canvas-adapter-spec.json";
const SOURCE_SHARED_BILINGUAL_VISUAL_ANIMATION_IDS = new Set([
  "course-g03-l01-ts-008",
  "course-g03-l06-ti-001",
  "course-g04-l01-ir-001",
  "course-g05-l13-rw-002"
]);
const SOURCE_SHARED_BILINGUAL_VISUAL_DISPOSITION =
  "single-source-drawing-timeline-with-embedded-english-title-and-no-language-branch; es preserves source pixels without claiming translation";
const HASH_BOUND_BILINGUAL_VISUAL_DISPOSITION_ANIMATION_IDS = new Set([
  "course-g03-l01-ts-008"
]);
const ROOT_PRELOADER_NAVIGATION_WITHOUT_STOP_ANIMATION_IDS = new Set([
  "course-g05-l04-ts-003",
  "course-g05-l04-ts-004"
]);
const ROOT_PRELOADER_NAVIGATION_ACTION =
  '_level0.InternalPreloader.gotoAndPlay("jump_check");';

const DISALLOWED_RUNTIME_PATTERNS = Object.freeze([
  Object.freeze({label: "dynamic evaluation", pattern: /\beval\s*\(/}),
  Object.freeze({label: "dynamic Function constructor", pattern: /\bFunction\s*\(/}),
  Object.freeze({label: "timer or animation loop", pattern: /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/}),
  Object.freeze({label: "network primitive", pattern: /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/}),
  Object.freeze({label: "worker primitive", pattern: /\b(?:Worker|SharedWorker)\s*\(/}),
  Object.freeze({label: "persistent browser storage", pattern: /\b(?:localStorage|sessionStorage|indexedDB)\b/}),
  Object.freeze({label: "navigation or cross-window messaging", pattern: /\b(?:location|postMessage|open)\s*(?:\.|\()/}),
  Object.freeze({label: "dynamic import", pattern: /\bimport\s*\(/}),
  Object.freeze({label: "document-body mutation", pattern: /document\.body/}),
  Object.freeze({label: "ambient DOM event listener", pattern: /\b(?:addEventListener|removeEventListener)\s*\(/})
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceExactlyOnce(source, search, replacement, label) {
  const first = source.indexOf(search);
  const last = source.lastIndexOf(search);
  assert(first >= 0, `${label}: expected source marker was not found`);
  assert(first === last, `${label}: source marker occurred more than once`);
  return `${source.slice(0, first)}${replacement}${source.slice(first + search.length)}`;
}

function replaceExactOccurrences(source, search, replacement, expected, label) {
  const observed = source.split(search).length - 1;
  assert(observed === expected,
    `${label}: expected ${expected} source marker occurrence(s), observed ${observed}`);
  return source.split(search).join(replacement);
}

function replaceSection(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  assert(start >= 0, `${label}: start marker was not found`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert(end >= 0, `${label}: end marker was not found`);
  assert(source.indexOf(startMarker, start + startMarker.length) < 0, `${label}: start marker occurred more than once`);
  return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

function resolveProjectPath(root, relativePath, label) {
  assert(typeof relativePath === "string" && relativePath.length > 0, `${label}: path is required`);
  assert(!path.isAbsolute(relativePath), `${label}: path must be project-relative`);
  const resolved = path.resolve(root, relativePath);
  assert(resolved.startsWith(`${root}${path.sep}`), `${label}: path escapes the project root`);
  return resolved;
}

function validateSpec(spec) {
  assert(spec?.schemaVersion === 1, "adapter spec: schemaVersion must be 1");
  assert(/^course-[a-z0-9-]+$/.test(spec.animationId || ""), "adapter spec: invalid animationId");
  assert(/^[a-f0-9]{64}$/.test(spec.source?.swfSha256 || ""), "adapter spec: invalid SWF SHA-256");
  for (const key of ["helperSha256", "framesHtmlSha256"]) {
    assert(/^[a-f0-9]{64}$/.test(spec.ffdecExport?.[key] || ""), `adapter spec: invalid ${key}`);
  }
  for (const key of ["scenarioInventorySha256", "audioAuditSha256"]) {
    assert(/^[a-f0-9]{64}$/.test(spec.evidence?.[key] || ""), `adapter spec: invalid ${key}`);
  }
  if (HASH_BOUND_BILINGUAL_VISUAL_DISPOSITION_ANIMATION_IDS.has(spec.animationId)) {
    assert(
      typeof spec.evidence?.bilingualVisualDisposition === "string" &&
        spec.evidence.bilingualVisualDisposition.length > 0,
      "adapter spec: bilingual visual disposition path is required"
    );
    assert(
      /^[a-f0-9]{64}$/.test(spec.evidence?.bilingualVisualDispositionSha256 || ""),
      "adapter spec: invalid bilingualVisualDispositionSha256"
    );
  }
  assert(Number.isSafeInteger(spec.ffdecExport?.targetSpriteObjectId), "adapter spec: targetSpriteObjectId is required");
  assert(/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(spec.ffdecExport?.targetSpriteFunction || ""), "adapter spec: invalid target sprite function");
  assert(Number.isSafeInteger(spec.timeline?.fps) && spec.timeline.fps > 0, "adapter spec: invalid FPS");
  for (const [label, value] of [
    ["stage width", spec.timeline?.stage?.width],
    ["stage height", spec.timeline?.stage?.height],
    ["root frame count", spec.timeline?.root?.frameCount],
    ["root begin frame", spec.timeline?.root?.beginFrame],
    ["local frame count", spec.timeline?.local?.frameCount]
  ]) {
    assert(Number.isSafeInteger(value) && value > 0, `adapter spec: invalid ${label}`);
  }
  if (ROOT_PRELOADER_NAVIGATION_WITHOUT_STOP_ANIMATION_IDS.has(
    spec.animationId
  )) {
    assert(
      spec.timeline.root.preloaderStopFrame === null &&
        spec.timeline.root.preloaderNavigationFrame === 1 &&
        spec.timeline.root.preloaderNavigationAction ===
          ROOT_PRELOADER_NAVIGATION_ACTION,
      "adapter spec: source-proven frame-1 preloader navigation changed"
    );
  } else {
    assert(
      spec.timeline.root.preloaderStopFrame === 1,
      "adapter spec: root preloader stop frame must remain frame 1"
    );
  }
  const contractKind = spec.runtimeContract?.kind ?? "ti-random-audio";
  assert(
    contractKind === "ti-random-audio" || contractKind === "structural-local-frame",
    "adapter spec: unsupported runtime contract kind"
  );
  if (contractKind === "ti-random-audio") {
    assert(Number.isSafeInteger(spec.timeline.local.terminalStopFrame) && spec.timeline.local.terminalStopFrame > 0, "adapter spec: invalid local terminal stop frame");
    assert(spec.timeline.local.terminalStopFrame === spec.timeline.local.frameCount, "adapter spec: terminal stop must be the local final frame");
  } else {
    assert(
      ["once", "loop", "state-explorer"].includes(spec.timeline.local.playbackMode),
      "adapter spec: structural candidate playbackMode is invalid"
    );
    assert(
      Array.isArray(spec.runtimeContract.unresolved) && spec.runtimeContract.unresolved.length > 0,
      "adapter spec: structural candidate must enumerate unresolved runtime obligations"
    );
    const blockedLocalFrameRanges = spec.runtimeContract.blockedLocalFrameRanges ?? [];
    assert(
      Array.isArray(blockedLocalFrameRanges),
      "adapter spec: blockedLocalFrameRanges must be an array"
    );
    let priorLastFrame = 0;
    for (const range of blockedLocalFrameRanges) {
      assert(
        Number.isSafeInteger(range.firstFrame) &&
          Number.isSafeInteger(range.lastFrame) &&
          range.firstFrame >= 1 &&
          range.firstFrame <= range.lastFrame &&
          range.lastFrame <= spec.timeline.local.frameCount,
        "adapter spec: blocked local frame range is invalid"
      );
      assert(
        range.firstFrame > priorLastFrame,
        "adapter spec: blocked local frame ranges must be sorted and non-overlapping"
      );
      assert(
        typeof range.reason === "string" && range.reason.length > 0,
        "adapter spec: blocked local frame range reason is required"
      );
      priorLastFrame = range.lastFrame;
    }
    const numberLineQuiz = spec.runtimeContract.sourceLocalNumberLineQuiz;
    const patternQuiz = spec.runtimeContract.sourceLocalPatternQuiz;
    const sourceLocalGame = spec.runtimeContract.sourceLocalGame;
    assert([numberLineQuiz, patternQuiz, sourceLocalGame]
      .filter(Boolean).length <= 1,
    "adapter spec: source-local dynamic contracts must be mutually exclusive");
    if (numberLineQuiz !== undefined) {
      assert(numberLineQuiz && typeof numberLineQuiz === "object",
        "adapter spec: source-local number-line quiz contract is invalid");
      assert(numberLineQuiz.frameDomain === spec.timeline.local.timelineId &&
        numberLineQuiz.entryFrame === 1054 &&
        numberLineQuiz.postStopLastFrame === spec.timeline.local.frameCount &&
        numberLineQuiz.sourceStopAtEntry === true &&
        numberLineQuiz.sequentialPlaybackAfterEntryPermitted === false &&
        numberLineQuiz.livePlaybackEndFrame === numberLineQuiz.entryFrame,
      "adapter spec: source-local number-line frame boundary changed");
      assert(Array.isArray(numberLineQuiz.sourcePairs) &&
        numberLineQuiz.sourcePairs.length === 8 &&
        numberLineQuiz.sourcePairs.every((pair) => /^-?\d+~-?\d+$/.test(pair)),
      "adapter spec: source-local number-line pairs are invalid");
      assert(numberLineQuiz.implementationSeedMapping ===
        "seed-modulo-eight-for-deterministic-current-javascript-only-not-injected-into-avm1" &&
        numberLineQuiz.sourceRandomExecuted === false,
      "adapter spec: source-local number-line seed authority changed");
      assert(numberLineQuiz.font?.functionName === "font3" &&
        numberLineQuiz.font.unitsPerEm === 1024 &&
        numberLineQuiz.font.ttfSha256 ===
          "2c6301244e439f355437371c4265d5070174222dcff3a8721313b3ce0cb507ee",
      "adapter spec: source-local number-line font changed");
      assert(numberLineQuiz.numberLine?.minimum === -15 &&
        numberLineQuiz.numberLine.maximum === 15 &&
        numberLineQuiz.numberLine.labelCount === 31 &&
        numberLineQuiz.numberLine.tickColor === "#0000cc" &&
        numberLineQuiz.questionText?.align === "center",
      "adapter spec: source-local number-line drawing geometry changed");
    }
    if (patternQuiz !== undefined) {
      assert(patternQuiz && typeof patternQuiz === "object",
        "adapter spec: source-local pattern quiz contract is invalid");
      const patternProfile = {
        "course-g04-l03-in-008": {
          entryFrame: 216,
          fontAscent: 729,
          primaryTtfSha256:
            "e56576cfc2c17204e624b1478586982ccc037ee8d117a7d169755ec8c0d690d8",
          supplementFields: {
            sameLessonSupplementTtfSha256:
              "2c6301244e439f355437371c4265d5070174222dcff3a8721313b3ce0cb507ee",
            sharedGlyphsEquivalent: true,
          },
          questionFontSize: 30,
          questionRight: 397.55,
          answerAlign: "center",
          hidden: {objectId: 52, functionName: "sprite52", depth: 38,
            x: 400.25, y: 216.75},
        },
        "course-g04-l03-ti-005": {
          entryFrame: 209,
          fontAscent: 735,
          primaryTtfSha256:
            "375aa51f945f0742a5e7aedc83316cb2e29860471cfdefd0ca58e48a24c5b22e",
          supplementFields: {
            digitMinusSupplementTtfSha256:
              "4b8c5b6896d18f56dfe908cec9b602e915e7ffb0dd4e83dce9d99c9d17bc3f11",
            commaSupplementTtfSha256:
              "5df6029d20f2fdefbb848f477aba21e3df37cb3a340cceb9b3c521efff9439e9",
            allSharedGlyphsEquivalent: true,
            deviceFontRuntimeEstablished: false,
          },
          questionFontSize: 25,
          questionRight: 413.55,
          answerAlign: "right",
          hidden: {objectId: 203, functionName: "sprite203", depth: 24,
            x: 399.25, y: 216.75},
        },
      }[spec.animationId];
      assert(patternProfile,
        "adapter spec: source-local pattern quiz animation is not allowlisted");
      assert(patternQuiz.frameDomain === spec.timeline.local.timelineId &&
        patternQuiz.entryFrame === patternProfile.entryFrame &&
        patternQuiz.postStopLastFrame === spec.timeline.local.frameCount &&
        patternQuiz.sourceStopAtEntry === true &&
        patternQuiz.sequentialPlaybackAfterEntryPermitted === false &&
        patternQuiz.livePlaybackEndFrame === patternQuiz.entryFrame,
      "adapter spec: source-local pattern quiz frame boundary changed");
      assert(Array.isArray(patternQuiz.sourceQuestions) &&
        patternQuiz.sourceQuestions.length === 5 &&
        patternQuiz.sourceQuestions.every((question) =>
          typeof question.label === "string" && question.label.endsWith(",") &&
          /^-?\d+~-?\d+$/.test(question.answers) &&
          typeof question.feedback === "string" &&
          Number.isSafeInteger(question.decrement) && question.decrement > 0),
      "adapter spec: source-local pattern quiz questions are invalid");
      assert(patternQuiz.implementationSeedMapping ===
        "seed-modulo-five-for-deterministic-current-javascript-only-not-injected-into-avm1" &&
        patternQuiz.sourceRandomExecuted === false &&
        patternQuiz.removesSelectedQuestion === true &&
        patternQuiz.initialRemainingQuestionCount === 4,
      "adapter spec: source-local pattern quiz seed authority changed");
      assert(patternQuiz.font?.name === "Bauhaus Md BT" &&
        patternQuiz.font.unitsPerEm === 1024 &&
        patternQuiz.font.ascent === patternProfile.fontAscent &&
        patternQuiz.font.primaryTtfSha256 ===
          patternProfile.primaryTtfSha256 &&
        Object.entries(patternProfile.supplementFields).every(([key, value]) =>
          patternQuiz.font[key] === value) &&
        JSON.stringify(Object.keys(patternQuiz.font.glyphs ?? {}).sort()) ===
          JSON.stringify([" ", ",", "-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].sort()) &&
        Object.values(patternQuiz.font.glyphs).every((glyph) =>
          Number.isSafeInteger(glyph.advance) && glyph.advance >= 0 &&
          Array.isArray(glyph.commands) && glyph.commands.every((command) =>
            Array.isArray(command) && ["M", "L", "Q", "C", "Z", "E"]
              .includes(command[0]))),
      "adapter spec: source-local pattern quiz source glyphs changed");
      assert(patternQuiz.questionText?.align === "right" &&
        patternQuiz.questionText.rightGutterPixels === 2 &&
        patternQuiz.questionText.fontSize === patternProfile.questionFontSize &&
        patternQuiz.questionText.box?.right === patternProfile.questionRight &&
        patternQuiz.answerOne?.align === patternProfile.answerAlign &&
        patternQuiz.answerOne.initialText === "" &&
        patternQuiz.answerTwo?.align === patternProfile.answerAlign &&
        patternQuiz.answerTwo.initialText === "",
      "adapter spec: source-local pattern quiz text geometry changed");
      assert(patternQuiz.initiallyHiddenClip?.name === "Mc_Wrong_Feed" &&
        patternQuiz.initiallyHiddenClip.objectId === patternProfile.hidden.objectId &&
        patternQuiz.initiallyHiddenClip.functionName ===
          patternProfile.hidden.functionName &&
        patternQuiz.initiallyHiddenClip.depth === patternProfile.hidden.depth &&
        patternQuiz.initiallyHiddenClip.placement?.x === patternProfile.hidden.x &&
        patternQuiz.initiallyHiddenClip.placement?.y === patternProfile.hidden.y &&
        patternQuiz.initiallyHiddenClip.sourceStatement ===
          "Mc_Wrong_Feed._visible = false;",
      "adapter spec: source-local pattern quiz hidden feedback clip changed");
    }
    if (sourceLocalGame !== undefined) {
      assert(spec.animationId === "course-g04-l03-gs-002" &&
        sourceLocalGame && typeof sourceLocalGame === "object",
      "adapter spec: source-local game animation is not allowlisted");
      assert(sourceLocalGame.frameDomain === spec.timeline.local.timelineId &&
        sourceLocalGame.entryFrame === 427 &&
        sourceLocalGame.postStopLastFrame === 428 &&
        sourceLocalGame.sourceStopAtEntry === true &&
        sourceLocalGame.sequentialPlaybackAfterEntryPermitted === false &&
        sourceLocalGame.livePlaybackEndFrame === 427,
      "adapter spec: source-local game frame boundary changed");
      assert(JSON.stringify(sourceLocalGame.coupLocations) === JSON.stringify([
        -177.35, -154.35, -130.35, -106.35, -82.35, -58.35, -33.35,
        -7.35, 16.65, 42.65, 67.65, 91.65, 117.65, 140.65, 166.65,
      ]) && JSON.stringify(sourceLocalGame.virusLocations) === JSON.stringify([
        -174.1, -151.1, -127.1, -103.1, -79.1, -55.1, -30.1,
        -4.1, 19.9, 45.9, 70.9, 94.9, 120.9, 143.9, 169.9,
      ]) && JSON.stringify(sourceLocalGame.allowedVirusIndices) ===
        JSON.stringify([0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14]) &&
        sourceLocalGame.coupIndex === 7 && sourceLocalGame.sourceCoupY === -4.1,
      "adapter spec: source-local game position arrays changed");
      assert(sourceLocalGame.implementationSeedMapping ===
        "seed-modulo-fourteen-selects-allowed-virus-index-for-deterministic-current-javascript-only-not-injected-into-avm1" &&
        sourceLocalGame.sourceRandomExecuted === false &&
        sourceLocalGame.sourceRandomRetryWhenVirusMatchesCoup === true,
      "adapter spec: source-local game seed authority changed");
      assert(sourceLocalGame.initialScore === 0 &&
        sourceLocalGame.initialMinutes === 4 &&
        sourceLocalGame.initialSeconds === 0 &&
        sourceLocalGame.initialTimerDisplayText === "00:00:00" &&
        sourceLocalGame.initialScoreDisplayText === "0" &&
        sourceLocalGame.quizSection === true &&
        sourceLocalGame.signText === "" &&
        sourceLocalGame.locationText === "" &&
        sourceLocalGame.locationRestrict === "0-9" &&
        sourceLocalGame.locationMaxLength === 2,
      "adapter spec: source-local game initial values changed");
      assert(sourceLocalGame.virusPlacement?.objectId === 69 &&
        sourceLocalGame.virusPlacement.functionName === "sprite69" &&
        JSON.stringify(sourceLocalGame.virusPlacement.matrixPrefix) ===
          JSON.stringify([0.05, 0, 0, 0.05, -67.2]) &&
        sourceLocalGame.virusPlacement.entryChildFrame === 0 &&
        sourceLocalGame.virusPlacement.postStopChildFrame === 1 &&
        sourceLocalGame.coupPlacement?.objectId === 48 &&
        sourceLocalGame.coupPlacement.functionName === "sprite48" &&
        JSON.stringify(sourceLocalGame.coupPlacement.matrix) ===
          JSON.stringify([0.05, 0, 0, 0.05, -298.2, -4.1]) &&
        sourceLocalGame.coupPlacement.childFrame === 0 &&
        sourceLocalGame.ffdecTargetInternalTranslation?.x === 815.15 &&
        sourceLocalGame.ffdecTargetInternalTranslation?.y === 717.2 &&
        sourceLocalGame.postStopStaticInspectionCarriesInitializedPositions ===
          true,
      "adapter spec: source-local game drawing placement changed");
      const gameText = sourceLocalGame.dynamicTextDrawing;
      assert(gameText?.authority ===
          "source-field-geometry-and-text-with-device-font-rendering-pending-original-runtime-baseline" &&
        gameText.timer?.objectId === 77 &&
        gameText.timer.sourceText === "00:00:00" &&
        gameText.timer.sourceFont?.objectId === 76 &&
        gameText.timer.sourceFont.name === "Arial" &&
        gameText.timer.sourceFont.bold === true &&
        gameText.timer.sourceFont.glyphCount === 0 &&
        gameText.timer.sourceUsesDeviceFont === true &&
        JSON.stringify(gameText.timer.placementMatrix) ===
          JSON.stringify([0.05, 0, 0, 0.05, 102.3, 160.45]) &&
        gameText.timer.currentJsFontFamily === "Arial, sans-serif" &&
        gameText.timer.currentJsFontSizePixels === 12.7998046875 &&
        gameText.timer.currentJsCenterX === 102.29940490722656 &&
        gameText.timer.currentJsBaselineY === 164.4998291015625 &&
        JSON.stringify(gameText.timer.visibleFrames) ===
          JSON.stringify([427]) &&
        gameText.score?.objectId === 83 &&
        gameText.score.sourceText === "0" &&
        gameText.score.sourceFont?.objectId === 82 &&
        gameText.score.sourceFont.name === "Bauhaus Md BT" &&
        gameText.score.sourceFont.bold === true &&
        gameText.score.sourceFont.glyphCount === 0 &&
        gameText.score.sourceUsesDeviceFont === true &&
        gameText.score.currentJsFontFamily ===
          "Bauhaus Md BT, Arial Rounded MT Bold, sans-serif" &&
        gameText.score.currentJsFontSizePixels === 17 &&
        JSON.stringify(gameText.score.framePlacements) === JSON.stringify([
          {frame: 427, placementMatrix: [0.05, 0, 0, 0.05, 241.3, 178.55],
            centerX: 268.9, baselineY: 153.1},
          {frame: 428, placementMatrix: [0.05, 0, 0, 0.05, 238.3, 196.55],
            centerX: 265.9, baselineY: 171.1},
        ]),
      "adapter spec: source-local game dynamic text drawing changed");
      assert(JSON.stringify(sourceLocalGame.initiallyHiddenClips?.map((clip) =>
        [clip.name, clip.objectId, clip.functionName,
          clip.ffdecPlacement?.expectedOccurrenceCount])) === JSON.stringify([
        ["Wrong_Feed", 158, "sprite158", 1],
        ["Mc_Popup1", 164, "sprite164", 2],
      ]), "adapter spec: source-local game hidden clips changed");
    }
  }
  assert(/^#[a-fA-F0-9]{6}$/.test(spec.timeline.stage.backgroundColor || ""), "adapter spec: invalid stage background");
  if (contractKind === "ti-random-audio") {
    assert(Array.isArray(spec.ffdecExport.expectedPlacedFunctions) && spec.ffdecExport.expectedPlacedFunctions.length > 0, "adapter spec: placed function allowlist is required");
    assert(Array.isArray(spec.ffdecExport.embeddedImageVariables), "adapter spec: embedded image allowlist is required");
  } else {
    assert(Number.isSafeInteger(spec.ffdecExport.expectedPlacedFunctionCount) && spec.ffdecExport.expectedPlacedFunctionCount > 0, "adapter spec: placed function count is required");
    assert(/^[a-f0-9]{64}$/.test(spec.ffdecExport.expectedPlacedFunctionsSha256 || ""), "adapter spec: placed function hash is required");
    assert(Number.isSafeInteger(spec.ffdecExport.embeddedImageVariableCount) && spec.ffdecExport.embeddedImageVariableCount >= 0, "adapter spec: embedded image count is required");
    assert(/^[a-f0-9]{64}$/.test(spec.ffdecExport.embeddedImageVariablesSha256 || ""), "adapter spec: embedded image hash is required");
    const fontCountDeclared =
      spec.ffdecExport.expectedFontFunctionCount !== undefined;
    const fontHashDeclared =
      spec.ffdecExport.expectedFontFunctionsSha256 !== undefined;
    assert(
      fontCountDeclared === fontHashDeclared,
      "adapter spec: font function count and hash must be declared together",
    );
    if (fontCountDeclared) {
      assert(
        Number.isSafeInteger(spec.ffdecExport.expectedFontFunctionCount) &&
          spec.ffdecExport.expectedFontFunctionCount >= 0,
        "adapter spec: font function count is invalid",
      );
      assert(
        /^[a-f0-9]{64}$/.test(
          spec.ffdecExport.expectedFontFunctionsSha256 || "",
        ),
        "adapter spec: font function hash is invalid",
      );
    }
  }
  assert(Array.isArray(spec.runtimeContract?.scenarios) && spec.runtimeContract.scenarios.includes(spec.runtimeContract.defaultScenario), "adapter spec: default scenario must be allowlisted");
  if (SOURCE_SHARED_BILINGUAL_VISUAL_ANIMATION_IDS.has(spec.animationId)) {
    assert(JSON.stringify(spec.runtimeContract.supportedLanguages) === JSON.stringify(["en", "es"]), "adapter spec: source-shared visual languages must be en/es");
    assert(
      spec.runtimeContract.visualLocalization === SOURCE_SHARED_BILINGUAL_VISUAL_DISPOSITION,
      "adapter spec: source-shared visual-localization disposition changed"
    );
  } else {
    assert(JSON.stringify(spec.runtimeContract.supportedLanguages) === JSON.stringify(["en"]), "adapter spec: candidate without a source-shared disposition must fail closed to source-proven English only");
  }
  assert(spec.timeline.root.beginFrame <= spec.timeline.root.frameCount, "adapter spec: root begin frame is outside the root timeline");
  assert(spec.timeline.root.placementPixels.x === spec.timeline.root.placementTwips.x / 20, "adapter spec: root X twips/pixels disagree");
  assert(spec.timeline.root.placementPixels.y === spec.timeline.root.placementTwips.y / 20, "adapter spec: root Y twips/pixels disagree");
  assert(Math.abs(spec.timeline.stageRenderOffset.x - (spec.timeline.root.placementPixels.x - spec.ffdecExport.exportInternalTranslation.x)) < 1e-9, "adapter spec: stage X offset does not preserve the root placement");
  assert(Math.abs(spec.timeline.stageRenderOffset.y - (spec.timeline.root.placementPixels.y - spec.ffdecExport.exportInternalTranslation.y)) < 1e-9, "adapter spec: stage Y offset does not preserve the root placement");
  return spec;
}

export function validateBilingualVisualDisposition(spec, disposition) {
  assert(
    disposition?.schemaVersion === 1 &&
      disposition?.evidenceType === "source-shared-bilingual-visual-disposition",
    "bilingual visual disposition: unsupported schema or evidence type"
  );
  assert(
    disposition.animationId === spec.animationId,
    "bilingual visual disposition: animationId mismatch"
  );
  assert(
    disposition.status === "verified-source-shared-untranslated-visual",
    "bilingual visual disposition: source-shared visual is not verified"
  );
  assert(
    disposition.generatedFrom?.sourceSwf?.sha256 === spec.source.swfSha256,
    "bilingual visual disposition: source SWF hash mismatch"
  );
  assert(
    JSON.stringify(disposition.implementationDisposition?.languages) ===
      JSON.stringify(spec.runtimeContract.supportedLanguages),
    "bilingual visual disposition: supported languages mismatch"
  );
  assert(
    disposition.implementationDisposition?.visualLocalization ===
      spec.runtimeContract.visualLocalization &&
      disposition.implementationDisposition?.renderSameSourceVisualForBothLanguages === true,
    "bilingual visual disposition: visual-localization contract mismatch"
  );
  assert(
    disposition.implementationDisposition?.audioRendered === false,
    "bilingual visual disposition: audio must remain unrendered"
  );
  assert(
    Object.values(disposition.acceptanceEffects ?? {}).every((value) => value === false) &&
      /^none;/.test(disposition.strictAcceptanceEffect ?? ""),
    "bilingual visual disposition: acceptance effects must remain false"
  );
  return disposition;
}

function timelineById(inventory, timelineId) {
  const matches = (inventory.timelineInventory || []).filter((timeline) => timeline.timelineId === timelineId);
  assert(matches.length === 1, `scenario inventory: expected exactly one ${timelineId} timeline`);
  return matches[0];
}

function hasStopState(timeline, frame) {
  return timeline.controlStates?.some((state) => state.frame === frame && state.reasons?.includes("script-stop-state"));
}

function hasControlReason(timeline, frame, reason) {
  return timeline.controlStates?.some(
    (state) => state.frame === frame && state.reasons?.includes(reason)
  );
}

export function validateAdapterAuditEvidence(spec, scenarioInventory, audioAudit) {
  validateSpec(spec);
  assert(scenarioInventory.animationId === spec.animationId, "scenario inventory: animationId mismatch");
  assert(scenarioInventory.source?.swfSha256 === spec.source.swfSha256, "scenario inventory: SWF hash mismatch");
  assert(scenarioInventory.source?.stage?.width === spec.timeline.stage.width && scenarioInventory.source?.stage?.height === spec.timeline.stage.height, "scenario inventory: stage mismatch");
  assert(scenarioInventory.source?.fps === spec.timeline.fps, "scenario inventory: FPS mismatch");
  assert(scenarioInventory.source?.rootFrameCount === spec.timeline.root.frameCount, "scenario inventory: root frame count mismatch");

  const root = timelineById(scenarioInventory, "root");
  assert(root.frameCount === spec.timeline.root.frameCount, "scenario inventory: root timeline length changed");
  if (ROOT_PRELOADER_NAVIGATION_WITHOUT_STOP_ANIMATION_IDS.has(
    spec.animationId
  )) {
    assert(
      !hasStopState(root, spec.timeline.root.preloaderNavigationFrame),
      "scenario inventory: source-proven frame-1 preloader navigation must not be relabeled as a stop"
    );
    assert(
      hasControlReason(
        root,
        spec.timeline.root.preloaderNavigationFrame,
        "exported-action-script"
      ) &&
        hasControlReason(
          root,
          spec.timeline.root.preloaderNavigationFrame,
          "structural-action:DoAction"
        ),
      "scenario inventory: frame-1 preloader navigation action is unproven"
    );
  } else {
    assert(hasStopState(root, spec.timeline.root.preloaderStopFrame), "scenario inventory: preloader stop frame is unproven");
  }
  assert(hasStopState(root, spec.timeline.root.beginFrame), "scenario inventory: begin stop frame is unproven");
  assert(root.frameLabels?.some((label) => label.frame === spec.timeline.root.beginFrame && label.label === spec.timeline.root.beginLabel), "scenario inventory: begin label is unproven");
  assert(root.namedPlacements?.some((placement) => placement.frame === spec.timeline.root.beginFrame && placement.name === spec.timeline.root.placementName && Number(placement.objectId) === spec.ffdecExport.targetSpriteObjectId), "scenario inventory: root sprite placement is unproven");

  const local = timelineById(scenarioInventory, spec.timeline.local.timelineId);
  assert(Number(local.objectId) === spec.ffdecExport.targetSpriteObjectId, "scenario inventory: local sprite object ID changed");
  assert(local.frameCount === spec.timeline.local.frameCount, "scenario inventory: local frame count changed");
  assert(audioAudit.animationId === spec.animationId, "audio audit: animationId mismatch");
  assert(audioAudit.source?.observedSha256 === spec.source.swfSha256 && audioAudit.source?.hashMatches === true, "audio audit: source hash is unverified");

  if ((spec.runtimeContract?.kind ?? "ti-random-audio") === "structural-local-frame") {
    const obligationCount = Object.values(scenarioInventory.coverage || {}).reduce(
      (count, value) => count + (Array.isArray(value) ? value.length : 0),
      0
    );
    assert(obligationCount > 0, "scenario inventory: structural candidate has no recorded runtime obligations");
    return {
      root,
      local,
      streams: audioAudit.embeddedAudio?.soundStreams || [],
      randomObligations: scenarioInventory.coverage?.randomObligations || []
    };
  }

  assert(local.controlStates?.some((state) => state.frame === spec.timeline.randomAudio.selectionFrame), "scenario inventory: random-selection frame is unproven");
  assert(local.controlStates?.some((state) => state.frame === spec.timeline.randomAudio.startFrame), "scenario inventory: sound-start frame is unproven");
  assert(hasStopState(local, spec.timeline.local.terminalStopFrame), "scenario inventory: local terminal stop is unproven");
  spec.timeline.randomAudio.outcomes.forEach((name, index) => {
    assert(local.namedPlacements?.some((placement) => placement.frame === 1 && placement.name === name && Number(placement.objectId) === 7 + index), `scenario inventory: ${name} placement is unproven`);
  });

  for (const [index, timelineId] of ["sprite-7", "sprite-8"].entries()) {
    const soundTimeline = timelineById(scenarioInventory, timelineId);
    assert(Number(soundTimeline.objectId) === 7 + index, `scenario inventory: ${timelineId} object ID changed`);
    assert(soundTimeline.frameCount === spec.timeline.randomAudio.nestedTerminalStopFrame, `scenario inventory: ${timelineId} frame count changed`);
    assert(hasStopState(soundTimeline, 1) && hasStopState(soundTimeline, spec.timeline.randomAudio.nestedTerminalStopFrame), `scenario inventory: ${timelineId} stop states are incomplete`);
  }
  const randomObligations = scenarioInventory.coverage?.randomObligations || [];
  assert(randomObligations.length === 1, "scenario inventory: expected exactly one random obligation");
  assert(randomObligations[0].expression === "random(2)" && JSON.stringify(randomObligations[0].requiredOutcomes) === JSON.stringify([0, 1]), "scenario inventory: random(2) outcomes changed");

  const streams = audioAudit.embeddedAudio?.soundStreams || [];
  assert(streams.length === 2, "audio audit: expected exactly two embedded streams");
  streams.forEach((stream, index) => {
    assert(stream.context?.kind === "sprite" && Number(stream.context?.characterId) === 7 + index, `audio audit: stream ${index + 1} context changed`);
    assert(stream.contextDeclaredFrames === spec.timeline.randomAudio.nestedTerminalStopFrame, `audio audit: stream ${index + 1} timeline length changed`);
    assert(stream.firstBlockFrame === 1 && stream.lastBlockFrame === spec.timeline.randomAudio.nestedTerminalStopFrame, `audio audit: stream ${index + 1} frame coverage changed`);
    assert(stream.blockCount === spec.timeline.randomAudio.nestedTerminalStopFrame && stream.format === "mp3", `audio audit: stream ${index + 1} encoding/coverage changed`);
  });
  return {root, local, streams, randomObligations};
}

export function parseArguments(argv, {root = ROOT} = {}) {
  let check = false;
  let specPath = DEFAULT_SPEC;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") {
      check = true;
    } else if (value === "--spec") {
      const next = argv[index + 1];
      assert(next && !next.startsWith("--"), "--spec requires a path");
      specPath = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  return {check, specPath: resolveProjectPath(root, specPath, "spec")};
}

export function resolveAdapterFrameState(request, spec) {
  validateSpec(spec);
  const frame = request?.frame;
  assert(Number.isSafeInteger(frame), "frame must be a safe integer");
  assert(frame >= 1 && frame <= spec.timeline.local.frameCount, `frame must be within 1..${spec.timeline.local.frameCount}`);

  const scenario = request?.scenario ?? spec.runtimeContract.defaultScenario;
  assert(spec.runtimeContract.scenarios.includes(scenario), `unsupported scenario: ${scenario}`);
  const lang = request?.lang ?? "en";
  assert(spec.runtimeContract.supportedLanguages.includes(lang), `unsupported source-proven language: ${lang}`);
  const rawSeed = request?.seed ?? 0;
  assert(Number.isSafeInteger(rawSeed), "seed must be a safe integer");
  const seed = rawSeed >>> 0;

  if ((spec.runtimeContract?.kind ?? "ti-random-audio") === "structural-local-frame") {
    const blockedRange = (spec.runtimeContract.blockedLocalFrameRanges ?? [])
      .find((range) => frame >= range.firstFrame && frame <= range.lastFrame);
    assert(
      !blockedRange,
      `source behavior-dependent frame blocked: ${frame}${blockedRange ? ` (${blockedRange.reason})` : ""}`
    );
    const state = {
      frameDomain: spec.timeline.local.timelineId,
      localFrame: frame,
      exportFrame: frame - 1,
      rootFrame: spec.timeline.root.beginFrame,
      rootState: "stopped-at-begin-while-child-static-frame-is-inspected",
      scenario,
      lang,
      seed,
      visualOnly: true,
      interactiveStateResolved: false,
      audioRendered: false
    };
    if (spec.runtimeContract.visualLocalization) {
      state.visualLocalizationStatus = spec.runtimeContract.visualLocalization;
    }
    const numberLineQuiz = spec.runtimeContract.sourceLocalNumberLineQuiz;
    if (numberLineQuiz && frame >= numberLineQuiz.entryFrame) {
      const questionIndex = seed % numberLineQuiz.sourcePairs.length;
      const [start, target] = numberLineQuiz.sourcePairs[questionIndex]
        .split("~").map(Number);
      state.quizInitialState = Object.freeze({
        questionIndex,
        start,
        target,
        text: `${start} to ${target}`,
        postStopStaticInspection: frame > numberLineQuiz.entryFrame,
      });
      state.dynamicOverlayRendered = true;
      state.sourceRandomExecuted = false;
      state.implementationSeedMapping =
        numberLineQuiz.implementationSeedMapping;
      state.livePlaybackEndFrame = numberLineQuiz.livePlaybackEndFrame;
    }
    const patternQuiz = spec.runtimeContract.sourceLocalPatternQuiz;
    if (patternQuiz && frame >= patternQuiz.entryFrame) {
      const questionIndex = seed % patternQuiz.sourceQuestions.length;
      const question = patternQuiz.sourceQuestions[questionIndex];
      const [answerFirst, answerSecond] = question.answers.split("~");
      state.quizInitialState = Object.freeze({
        questionIndex,
        label: question.label,
        answerFirst,
        answerSecond,
        feedback: question.feedback,
        decrement: question.decrement,
        remainingQuestionCount: patternQuiz.initialRemainingQuestionCount,
        postStopStaticInspection: frame > patternQuiz.entryFrame,
      });
      state.dynamicOverlayRendered = true;
      state.sourceRandomExecuted = false;
      state.implementationSeedMapping = patternQuiz.implementationSeedMapping;
      state.livePlaybackEndFrame = patternQuiz.livePlaybackEndFrame;
    }
    const sourceLocalGame = spec.runtimeContract.sourceLocalGame;
    if (sourceLocalGame && frame >= sourceLocalGame.entryFrame) {
      const selectedAllowedIndex = seed %
        sourceLocalGame.allowedVirusIndices.length;
      const selectedVirusIndex =
        sourceLocalGame.allowedVirusIndices[selectedAllowedIndex];
      state.gameInitialState = Object.freeze({
        selectedAllowedIndex,
        selectedVirusIndex,
        virusY: sourceLocalGame.virusLocations[selectedVirusIndex],
        virusChildFrame: frame === sourceLocalGame.entryFrame
          ? sourceLocalGame.virusPlacement.entryChildFrame
          : sourceLocalGame.virusPlacement.postStopChildFrame,
        coupIndex: sourceLocalGame.coupIndex,
        coupY: sourceLocalGame.sourceCoupY,
        score: sourceLocalGame.initialScore,
        minutes: sourceLocalGame.initialMinutes,
        seconds: sourceLocalGame.initialSeconds,
        quizSection: sourceLocalGame.quizSection,
        signText: sourceLocalGame.signText,
        locationText: sourceLocalGame.locationText,
        timerDisplayText: sourceLocalGame.initialTimerDisplayText,
        scoreDisplayText: sourceLocalGame.initialScoreDisplayText,
        postStopStaticInspection: frame > sourceLocalGame.entryFrame,
      });
      state.dynamicOverlayRendered = true;
      state.sourceRandomExecuted = false;
      state.implementationSeedMapping =
        sourceLocalGame.implementationSeedMapping;
      state.livePlaybackEndFrame = sourceLocalGame.livePlaybackEndFrame;
    }
    return Object.freeze(state);
  }

  const outcomes = spec.timeline.randomAudio.outcomes;
  let soundOutcome;
  if (scenario === "sound-0") soundOutcome = 0;
  else if (scenario === "sound-1") soundOutcome = 1;
  else soundOutcome = seed % outcomes.length;

  const startFrame = spec.timeline.randomAudio.startFrame;
  const nestedStartFrame = spec.timeline.randomAudio.nestedStartFrame;
  const selectedSoundLocalFrame = frame < startFrame
    ? 1
    : frame === startFrame
      ? nestedStartFrame
      : null;
  const selectedSoundLocalFrameAuthority = frame < startFrame
    ? "source-exact-stopped-frame-1"
    : frame === startFrame
      ? "source-exact-goto-and-play-frame-2-request"
      : "runtime-tick-phase-unresolved";

  return Object.freeze({
    frameDomain: spec.timeline.local.timelineId,
    localFrame: frame,
    exportFrame: frame - 1,
    rootFrame: spec.timeline.root.beginFrame,
    rootState: "stopped-at-begin-while-child-plays",
    scenario,
    lang,
    seed,
    soundOutcome,
    selectedSound: outcomes[soundOutcome],
    selectedSoundLocalFrame,
    selectedSoundLocalFrameAuthority,
    audioStartRequested: frame === startFrame,
    visualBranchIndependent: true,
    visualLocalizationStatus: spec.runtimeContract.visualLocalization,
    audioRendered: false
  });
}

function extractInlineDefinitions(framesHtml, spec) {
  framesHtml = framesHtml.replace(/\r\n?/g, "\n");
  const canvasPattern = new RegExp(`<canvas\\s+id="myCanvas"\\s+width="${spec.ffdecExport.exportCanvas.width}"\\s+height="${spec.ffdecExport.exportCanvas.height}"`);
  assert(canvasPattern.test(framesHtml), "frames export: unexpected canvas dimensions");

  const inlineStartMarker = "<script>var canvas=document.getElementById(\"myCanvas\");";
  const inlineStart = framesHtml.indexOf(inlineStartMarker);
  assert(inlineStart >= 0, "frames export: inline bootstrap marker was not found");
  assert(framesHtml.indexOf(inlineStartMarker, inlineStart + 1) < 0, "frames export: duplicate inline bootstrap marker");
  const inlineEnd = framesHtml.indexOf("</script>", inlineStart);
  assert(inlineEnd >= 0, "frames export: inline script end marker was not found");
  const inline = framesHtml.slice(inlineStart + "<script>".length, inlineEnd);

  const definitionsStart = inline.indexOf("var scalingGrids = {};");
  const viewerStart = inline.indexOf("\nvar frame = -1;");
  assert(definitionsStart >= 0 && viewerStart > definitionsStart, "frames export: definition/viewer boundaries were not found");
  let definitions = inline.slice(definitionsStart, viewerStart).trimEnd();
  const fontFunctions = [
    ...definitions.matchAll(/function\s+(font\d+)\(ctx,ch,textColor\)\{/g)
  ].map((match) => match[1]);
  const unscopedFontFill =
    /(function\s+(font\d+)\(ctx,ch,textColor\)\{\n\s*)defaultFill = textColor;/g;
  const fontFillMatches = [...definitions.matchAll(unscopedFontFill)];
  if (spec.ffdecExport.expectedFontFunctionCount === undefined) {
    assert(
      fontFunctions.length > 0,
      "frames export: no FFDec font functions were found",
    );
  } else {
    assert(
      fontFunctions.length === spec.ffdecExport.expectedFontFunctionCount,
      "frames export: font function count changed",
    );
    assert(
      sha256(JSON.stringify(fontFunctions)) ===
        spec.ffdecExport.expectedFontFunctionsSha256,
      "frames export: font function allowlist hash changed",
    );
  }
  assert(
    JSON.stringify(fontFillMatches.map((match) => match[2])) === JSON.stringify(fontFunctions),
    `frames export: font fill-scope markers changed (${fontFillMatches.map((match) => match[2]).join(", ")})`
  );
  definitions = definitions.replace(unscopedFontFill, "$1var defaultFill = textColor;");
  const viewer = inline.slice(viewerStart);

  const targetName = escapeRegExp(spec.ffdecExport.targetSpriteFunction);
  const spriteHeader = new RegExp(`function\\s+${targetName}\\(ctx,ctrans,frame,ratio,time\\)\\{\\s*ctx\\.save\\(\\);\\s*ctx\\.transform\\(1,0,0,1,([-0-9.]+),([-0-9.]+)\\);\\s*var clips = \\[\\];\\s*var frame_cnt = (\\d+);`);
  const headerMatch = definitions.match(spriteHeader);
  assert(headerMatch, "frames export: target sprite header did not match the audited structure");
  assert(Number(headerMatch[1]) === spec.ffdecExport.exportInternalTranslation.x, "frames export: target sprite X translation changed");
  assert(Number(headerMatch[2]) === spec.ffdecExport.exportInternalTranslation.y, "frames export: target sprite Y translation changed");
  assert(Number(headerMatch[3]) === spec.timeline.local.frameCount, "frames export: target sprite frame count changed");

  const pushedFrames = [...viewer.matchAll(/frames\.push\((\d+)\);/g)].map((match) => Number(match[1]));
  assert(pushedFrames.length === spec.timeline.local.frameCount, "frames export: viewer frame selection is incomplete");
  assert(pushedFrames.every((value, index) => value === index), "frames export: viewer frames are not the complete zero-indexed sequence");
  assert(viewer.includes(`var originalWidth = ${spec.ffdecExport.exportCanvas.width};`), "frames export: original width changed");
  assert(viewer.includes(`var originalHeight= ${spec.ffdecExport.exportCanvas.height};`), "frames export: original height changed");
  assert(viewer.includes("window.setInterval(function(){nextFrame(ctx,ctrans);},83);"), "frames export: expected FFDec autoplay loop changed");

  const placed = [...new Set([...definitions.matchAll(/place\("([A-Za-z_$][A-Za-z0-9_$]*)"/g)].map((match) => match[1]))].sort();
  if ((spec.runtimeContract?.kind ?? "ti-random-audio") === "ti-random-audio") {
    const expectedPlaced = [...spec.ffdecExport.expectedPlacedFunctions].sort();
    assert(JSON.stringify(placed) === JSON.stringify(expectedPlaced), `frames export: placed-function allowlist changed (${placed.join(", ")})`);
  } else {
    assert(placed.length === spec.ffdecExport.expectedPlacedFunctionCount, "frames export: placed-function count changed");
    assert(sha256(JSON.stringify(placed)) === spec.ffdecExport.expectedPlacedFunctionsSha256, "frames export: placed-function allowlist hash changed");
  }
  const definedFunctions = new Set([...definitions.matchAll(/function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g)].map((match) => match[1]));
  for (const name of placed) assert(definedFunctions.has(name), `frames export: placed function ${name} is undefined`);
  assert(definedFunctions.has(spec.ffdecExport.targetSpriteFunction), "frames export: target sprite function is undefined");
  if (spec.runtimeContract.sourceLocalNumberLineQuiz) {
    assert(definedFunctions.has(
      spec.runtimeContract.sourceLocalNumberLineQuiz.font.functionName,
    ), "frames export: source-local number-line font function is undefined");
  }
  if (spec.runtimeContract.sourceLocalPatternQuiz) {
    const patternQuiz = spec.runtimeContract.sourceLocalPatternQuiz;
    const hiddenFunction = patternQuiz.initiallyHiddenClip.functionName;
    assert(definedFunctions.has(hiddenFunction),
      "frames export: source-local pattern hidden feedback function is undefined");
    const hiddenFeedbackPlacement = new RegExp(
      `\\n\\s*place\\("${escapeRegExp(hiddenFunction)}",canvas,ctx,` +
      `\\[0\\.05,0\\.0,0\\.0,0\\.05,-13\\.15,-66\\.55\\],ctrans,1,` +
      `\\(0\\+time\\)%1,${patternQuiz.entryFrame - 1},time\\);`, "g");
    const hiddenFeedbackMatches = [...definitions.matchAll(hiddenFeedbackPlacement)];
    assert(hiddenFeedbackMatches.length === 2,
      `frames export: expected two source-hidden feedback placements, observed ${hiddenFeedbackMatches.length}`);
    definitions = definitions.replace(hiddenFeedbackPlacement,
      "\n\t\t\t// Mc_Wrong_Feed is source-hidden in the initial quiz state.");
  }
  if (spec.runtimeContract.sourceLocalGame) {
    const game = spec.runtimeContract.sourceLocalGame;
    for (const functionName of [
      game.virusPlacement.functionName,
      game.coupPlacement.functionName,
      ...game.initiallyHiddenClips.map((clip) => clip.functionName),
    ]) assert(definedFunctions.has(functionName),
      `frames export: source-local game function is undefined: ${functionName}`);
    const suppressions = [
      {
        search: '\n\t\t\tplace("sprite69",canvas,ctx,[0.05,0.0,0.0,0.05,-67.2,-4.1],ctrans,1,(0+time)%35,426,time);',
        expected: 1,
        replacement: "\n\t\t\t// Mc_Virus is redrawn from the source-local initialized game state.",
        label: "GS002 frame-427 raw virus placement",
      },
      {
        search: '\n\t\t\tplace("sprite69",canvas,ctx,[0.05,0.0,0.0,0.05,-67.2,-4.1],ctrans,1,(1+time)%35,426,time);',
        expected: 1,
        replacement: "\n\t\t\t// Mc_Virus is redrawn for post-stop structural inspection.",
        label: "GS002 frame-428 raw virus placement",
      },
      {
        search: '\n\t\t\tplace("sprite48",canvas,ctx,[0.05,0.0,0.0,0.05,-298.2,-7.35],ctrans,1,(0+time)%1,426,time);',
        expected: 2,
        replacement: "\n\t\t\t// Mc_Coup is redrawn at the frame-427 source-initialized Y position.",
        label: "GS002 raw coup placements",
      },
      {
        search: '\n\t\t\tplace("sprite158",canvas,ctx,[0.05,0.0,0.0,0.05,-168.45,-13.85],ctrans,1,(0+time)%15,426,time);',
        expected: 1,
        replacement: "\n\t\t\t// Wrong_Feed is source-hidden in the initial game state.",
        label: "GS002 source-hidden feedback placement",
      },
      {
        search: '\n\t\t\tplace("sprite164",canvas,ctx,[0.05000381469726563,0.0,0.0,0.05,372.25,-303.55],ctrans,1,(0+time)%1,426,time);',
        expected: 2,
        replacement: "\n\t\t\t// Mc_Popup1 is source-hidden in the initial game state.",
        label: "GS002 source-hidden popup placements",
      },
    ];
    for (const item of suppressions) {
      definitions = replaceExactOccurrences(definitions, item.search,
        item.replacement, item.expected, item.label);
    }
  }

  const imageAssignments = [...definitions.matchAll(/var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\);\s*\1\.src="(data:image\/(?:PNG|JPEG);base64,[A-Za-z0-9+/=]+)";/g)];
  const imageNames = imageAssignments.map((match) => match[1]);
  if ((spec.runtimeContract?.kind ?? "ti-random-audio") === "ti-random-audio") {
    assert(JSON.stringify(imageNames) === JSON.stringify(spec.ffdecExport.embeddedImageVariables), "frames export: embedded image allowlist changed");
  } else {
    assert(imageNames.length === spec.ffdecExport.embeddedImageVariableCount, "frames export: embedded image count changed");
    assert(sha256(JSON.stringify(imageNames)) === spec.ffdecExport.embeddedImageVariablesSha256, "frames export: embedded image allowlist hash changed");
  }
  assert(!definitions.includes("http://") && !definitions.includes("https://"), "frames export: external URL found in drawing definitions");

  return {definitions, placedFunctions: placed, imageVariables: imageNames};
}

function sanitizeHelper(helperSource) {
  let helper = helperSource.replace(/\r\n?/g, "\n");
  helper = replaceExactlyOnce(helper, "Filters = {};", "var Filters = {};", "FFDec helper global");
  helper = replaceExactlyOnce(
    helper,
    "    //temporary add to document to get this work (getImageData, etc.)\n    document.body.appendChild(c);\n    document.body.removeChild(c);\n",
    "    // Detached canvases support getImageData in the target browsers.\n",
    "FFDec helper document-body workaround"
  );

  const safeDispatcher = `var placeRaw = function (obj, canvas, ctx, matrix, ctrans, blendMode, frame, ratio, time) {
    var renderer = SAFE_OBJECTS[obj];
    if (typeof renderer !== "function") {
        throw new Error("Blocked unknown FFDec drawing object: " + obj);
    }
    ctx.save();
    ctx.transform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
    if (blendMode > 1) {
        var oldctx = ctx;
        var ncanvas = createCanvas(canvas.width, canvas.height);
        ctx = ncanvas.getContext("2d");
        enhanceContext(ctx);
        ctx.applyTransforms(oldctx._matrix);
    }
    var activeTransform = blendMode > 1
        ? new cxform(0,0,0,0,255,255,255,255)
        : ctrans;
    renderer(ctx,activeTransform,frame,ratio,time);
    if (blendMode > 1) {
        BlendModes.blendCanvas(ctrans.applyToImage(ncanvas), canvas, canvas, blendMode);
        ctx = oldctx;
    }
    ctx.restore();
}
`;
  helper = replaceSection(
    helper,
    "var placeRaw = function (obj, canvas, ctx, matrix, ctrans, blendMode, frame, ratio, time) {",
    "\nvar transformPoint = function (matrix, p) {",
    safeDispatcher,
    "FFDec helper dispatcher"
  );
  helper = replaceSection(
    helper,
    "window.addEventListener('load', function () {",
    "\nfunction drawMorphPath(ctx, p, ratio, doStroke, scaleMode) {",
    "",
    "FFDec helper resizer"
  );
  return helper.trim();
}

function metadataForRuntime(spec) {
  return {
    schemaVersion: 1,
    animationId: spec.animationId,
    classification: spec.classification,
    sourceSwfSha256: spec.source.swfSha256,
    generatorInput: {
      ffdec: spec.ffdecExport.tool,
      helperSha256: spec.ffdecExport.helperSha256,
      framesHtmlSha256: spec.ffdecExport.framesHtmlSha256,
      targetSpriteObjectId: spec.ffdecExport.targetSpriteObjectId
    },
    stage: spec.timeline.stage,
    fps: spec.timeline.fps,
    sourceRootTimeline: {
      frameCount: spec.timeline.root.frameCount,
      preloaderStopFrame: spec.timeline.root.preloaderStopFrame,
      ...(ROOT_PRELOADER_NAVIGATION_WITHOUT_STOP_ANIMATION_IDS.has(
        spec.animationId
      )
        ? {
            preloaderNavigationFrame:
              spec.timeline.root.preloaderNavigationFrame,
            preloaderNavigationAction:
              spec.timeline.root.preloaderNavigationAction
          }
        : {}),
      beginFrame: spec.timeline.root.beginFrame,
      beginLabel: spec.timeline.root.beginLabel,
      placementName: spec.timeline.root.placementName,
      placementTwips: spec.timeline.root.placementTwips,
      placementPixels: spec.timeline.root.placementPixels
    },
    deterministicContentTimeline: (spec.runtimeContract?.kind ?? "ti-random-audio") === "ti-random-audio"
      ? {
          timelineId: spec.timeline.local.timelineId,
          frameCount: spec.timeline.local.frameCount,
          durationMs: spec.timeline.local.frameCount * 1000 / spec.timeline.fps,
          terminalStopFrame: spec.timeline.local.terminalStopFrame,
          publicFrameIndexing: spec.timeline.local.publicFrameIndexing
        }
      : {
          timelineId: spec.timeline.local.timelineId,
          frameCount: spec.timeline.local.frameCount,
          durationMs: spec.timeline.local.frameCount * 1000 / spec.timeline.fps,
          playbackMode: spec.timeline.local.playbackMode,
          publicFrameIndexing: spec.timeline.local.publicFrameIndexing,
          stateCoverage: spec.runtimeContract.sourceLocalNumberLineQuiz
            ? "static-source-drawing-plus-source-local-number-line-initial-state"
            : spec.runtimeContract.sourceLocalPatternQuiz
              ? "static-source-drawing-plus-source-local-pattern-quiz-initial-state"
              : spec.runtimeContract.sourceLocalGame
                ? "static-source-drawing-plus-source-local-game-initial-state"
              : "static-source-drawing-only",
          ...((spec.runtimeContract.sourceLocalNumberLineQuiz ??
            spec.runtimeContract.sourceLocalPatternQuiz ??
            spec.runtimeContract.sourceLocalGame)
            ? {
                sourceStopFrame:
                  (spec.runtimeContract.sourceLocalNumberLineQuiz ??
                    spec.runtimeContract.sourceLocalPatternQuiz ??
                    spec.runtimeContract.sourceLocalGame).entryFrame,
                livePlaybackEndFrame:
                  (spec.runtimeContract.sourceLocalNumberLineQuiz ??
                    spec.runtimeContract.sourceLocalPatternQuiz ??
                    spec.runtimeContract.sourceLocalGame).livePlaybackEndFrame,
                postStopStaticInspectionLastFrame:
                  (spec.runtimeContract.sourceLocalNumberLineQuiz ??
                    spec.runtimeContract.sourceLocalPatternQuiz ??
                    spec.runtimeContract.sourceLocalGame).postStopLastFrame,
              }
            : {}),
          ...((spec.runtimeContract.blockedLocalFrameRanges ?? []).length > 0
            ? {blockedLocalFrameRanges: spec.runtimeContract.blockedLocalFrameRanges}
            : {})
        },
    stageRenderOffset: spec.timeline.stageRenderOffset,
    scenarios: spec.runtimeContract.scenarios,
    supportedLanguages: spec.runtimeContract.supportedLanguages,
    seedMapping: spec.runtimeContract.seedMapping,
    visualLocalization: spec.runtimeContract.visualLocalization ?? null,
    audioRendering: "not-included"
  };
}

function numberLineOverlaySource(spec) {
  const quiz = spec.runtimeContract.sourceLocalNumberLineQuiz;
  if (!quiz) return "";
  const line = quiz.numberLine;
  const question = quiz.questionText;
  const font = quiz.font;
  return `function drawSourceLocalNumberLineQuiz(ctx, state) {
    if (!state.quizInitialState) return;
    var advances = ${JSON.stringify(font.advances)};
    var unitsPerEm = ${font.unitsPerEm};
    function measureEmbeddedText(text, fontSize) {
        var total = 0;
        for (var index = 0; index < text.length; index += 1) {
            var advance = advances[text.charAt(index)];
            if (!Number.isSafeInteger(advance)) {
                throw new Error("source-local number-line glyph is unavailable: " + text.charAt(index));
            }
            total += advance;
        }
        return total * fontSize / unitsPerEm;
    }
    function drawEmbeddedText(text, color, fontSize, x, baselineY, align) {
        var scale = fontSize / unitsPerEm;
        var cursor = align === "center"
            ? x - measureEmbeddedText(text, fontSize) / 2
            : x;
        for (var index = 0; index < text.length; index += 1) {
            var character = text.charAt(index);
            ctx.save();
            ctx.translate(cursor, baselineY);
            ctx.scale(scale, scale);
            ${font.functionName}(ctx, character, color);
            ctx.restore();
            cursor += advances[character] * scale;
        }
    }
    ctx.save();
    ctx.strokeStyle = ${JSON.stringify(line.tickColor)};
    ctx.lineWidth = ${line.tickWidth};
    ctx.lineCap = "butt";
    ctx.beginPath();
    for (var value = ${line.minimum}; value <= ${line.maximum}; value += 1) {
        var x = ${line.firstTickX} + (value - ${line.minimum}) * ${line.spacing};
        ctx.moveTo(x, ${line.tickY});
        ctx.lineTo(x, ${line.tickY + line.tickLength});
    }
    ctx.stroke();
    for (var label = ${line.minimum}; label <= ${line.maximum}; label += 1) {
        var labelX = ${line.firstTickX} + (label - ${line.minimum}) * ${line.spacing};
        drawEmbeddedText(String(label), ${JSON.stringify(line.labelColor)},
            ${line.labelFontSize}, labelX, ${line.labelBaselineY}, "center");
    }
    drawEmbeddedText(state.quizInitialState.text,
        ${JSON.stringify(question.color)}, ${question.fontSize},
        ${(question.box.left + question.box.right) / 2},
        ${question.baselineY}, "center");
    ctx.restore();
}`;
}

function patternQuizOverlaySource(spec) {
  const quiz = spec.runtimeContract.sourceLocalPatternQuiz;
  if (!quiz) return "";
  const question = quiz.questionText;
  return `function drawSourceLocalPatternQuiz(ctx, state) {
    if (!state.quizInitialState) return;
    var glyphs = ${JSON.stringify(quiz.font.glyphs)};
    var unitsPerEm = ${quiz.font.unitsPerEm};
    function measureSourceText(text, fontSize) {
        var total = 0;
        for (var index = 0; index < text.length; index += 1) {
            var glyph = glyphs[text.charAt(index)];
            if (!glyph || !Number.isSafeInteger(glyph.advance)) {
                throw new Error("source-local pattern quiz glyph is unavailable: " + text.charAt(index));
            }
            total += glyph.advance;
        }
        return total * fontSize / unitsPerEm;
    }
    function drawGlyph(commands) {
        ctx.beginPath();
        for (var commandIndex = 0; commandIndex < commands.length; commandIndex += 1) {
            var command = commands[commandIndex];
            if (command[0] === "M") ctx.moveTo(command[1], command[2]);
            else if (command[0] === "L") ctx.lineTo(command[1], command[2]);
            else if (command[0] === "Q") {
                ctx.quadraticCurveTo(command[1], command[2], command[3], command[4]);
            } else if (command[0] === "C") {
                ctx.bezierCurveTo(command[1], command[2], command[3], command[4], command[5], command[6]);
            } else if (command[0] === "Z") ctx.closePath();
            else if (command[0] !== "E") {
                throw new Error("source-local pattern quiz glyph command is invalid");
            }
        }
        ctx.fill();
    }
    function drawSourceText(text, color, fontSize, rightX, baselineY) {
        var scale = fontSize / unitsPerEm;
        var cursor = rightX - measureSourceText(text, fontSize);
        ctx.fillStyle = color;
        for (var index = 0; index < text.length; index += 1) {
            var glyph = glyphs[text.charAt(index)];
            ctx.save();
            ctx.translate(cursor, baselineY);
            ctx.scale(scale, -scale);
            drawGlyph(glyph.commands);
            ctx.restore();
            cursor += glyph.advance * scale;
        }
    }
    ctx.save();
    drawSourceText(state.quizInitialState.label,
        ${JSON.stringify(question.color)}, ${question.fontSize},
        ${question.box.right - question.rightGutterPixels},
        ${question.baselineY});
    ctx.restore();
}`;
}

function gameInitialOverlaySource(spec) {
  const game = spec.runtimeContract.sourceLocalGame;
  if (!game) return "";
  const timer = game.dynamicTextDrawing.timer;
  const score = game.dynamicTextDrawing.score;
  return `function drawSourceLocalGameInitialState(ctx, state) {
    if (!state.gameInitialState) return;
    var identity = new cxform(0,0,0,0,255,255,255,255);
    ctx.save();
    try {
        ctx.transform(1, 0, 0, 1,
            ${game.ffdecTargetInternalTranslation.x},
            ${game.ffdecTargetInternalTranslation.y});
        place(${JSON.stringify(game.virusPlacement.functionName)}, canvas, ctx,
            [${game.virusPlacement.matrixPrefix.join(",")}, state.gameInitialState.virusY],
            identity, 1, state.gameInitialState.virusChildFrame, 426, 0);
        place(${JSON.stringify(game.coupPlacement.functionName)}, canvas, ctx,
            ${JSON.stringify(game.coupPlacement.matrix)}, identity, 1,
            ${game.coupPlacement.childFrame}, 426, 0);
        if (state.localFrame === ${timer.visibleFrames[0]}) {
            ctx.save();
            ctx.fillStyle = ${JSON.stringify(timer.color)};
            ctx.font = "bold ${timer.currentJsFontSizePixels}px " +
                ${JSON.stringify(timer.currentJsFontFamily)};
            ctx.textAlign = ${JSON.stringify(timer.align)};
            ctx.textBaseline = "alphabetic";
            ctx.fillText(state.gameInitialState.timerDisplayText,
                ${timer.currentJsCenterX}, ${timer.currentJsBaselineY});
            ctx.restore();
        }
        var scorePlacements = ${JSON.stringify(score.framePlacements)};
        var scorePlacement = scorePlacements.find(function (placement) {
            return placement.frame === state.localFrame;
        });
        if (!scorePlacement) {
            throw new Error("source-local game score placement is unavailable");
        }
        ctx.save();
        ctx.fillStyle = ${JSON.stringify(score.color)};
        ctx.font = "bold ${score.currentJsFontSizePixels}px " +
            ${JSON.stringify(score.currentJsFontFamily)};
        ctx.textAlign = ${JSON.stringify(score.align)};
        ctx.textBaseline = "alphabetic";
        ctx.fillText(state.gameInitialState.scoreDisplayText,
            scorePlacement.centerX, scorePlacement.baselineY);
        ctx.restore();
    } finally {
        ctx.restore();
    }
}`;
}

function runtimeStateSource(spec) {
  if ((spec.runtimeContract?.kind ?? "ti-random-audio") === "structural-local-frame") {
    const scenarios = JSON.stringify(spec.runtimeContract.scenarios);
    const defaultScenario = JSON.stringify(spec.runtimeContract.defaultScenario);
    const supportedLanguages = JSON.stringify(spec.runtimeContract.supportedLanguages);
    const languageGuard = supportedLanguages === '["en"]'
      ? `if (lang !== "en") {
        throw new Error("unsupported source-proven language: " + lang);
    }`
      : `var allowedLanguages = ${supportedLanguages};
    if (allowedLanguages.indexOf(lang) < 0) {
        throw new Error("unsupported source-proven language: " + lang);
    }`;
    const sourceSharedVisualState = spec.runtimeContract.visualLocalization
      ? `\n        visualLocalizationStatus: ${JSON.stringify(spec.runtimeContract.visualLocalization)},`
      : "";
    const numberLineQuiz = spec.runtimeContract.sourceLocalNumberLineQuiz;
    const numberLineQuizState = numberLineQuiz
      ? `\n    if (frame >= ${numberLineQuiz.entryFrame}) {
        var sourcePairs = ${JSON.stringify(numberLineQuiz.sourcePairs)};
        var questionIndex = seed % sourcePairs.length;
        var questionParts = sourcePairs[questionIndex].split("~");
        var start = Number(questionParts[0]);
        var target = Number(questionParts[1]);
        state.quizInitialState = Object.freeze({
            questionIndex: questionIndex,
            start: start,
            target: target,
            text: start + " to " + target,
            postStopStaticInspection: frame > ${numberLineQuiz.entryFrame}
        });
        state.dynamicOverlayRendered = true;
        state.sourceRandomExecuted = false;
        state.implementationSeedMapping = ${JSON.stringify(numberLineQuiz.implementationSeedMapping)};
        state.livePlaybackEndFrame = ${numberLineQuiz.livePlaybackEndFrame};
    }`
      : "";
    const patternQuiz = spec.runtimeContract.sourceLocalPatternQuiz;
    const patternQuizState = patternQuiz
      ? `\n    if (frame >= ${patternQuiz.entryFrame}) {
        var sourceQuestions = ${JSON.stringify(patternQuiz.sourceQuestions)};
        var questionIndex = seed % sourceQuestions.length;
        var question = sourceQuestions[questionIndex];
        var answers = question.answers.split("~");
        state.quizInitialState = Object.freeze({
            questionIndex: questionIndex,
            label: question.label,
            answerFirst: answers[0],
            answerSecond: answers[1],
            feedback: question.feedback,
            decrement: question.decrement,
            remainingQuestionCount: ${patternQuiz.initialRemainingQuestionCount},
            postStopStaticInspection: frame > ${patternQuiz.entryFrame}
        });
        state.dynamicOverlayRendered = true;
        state.sourceRandomExecuted = false;
        state.implementationSeedMapping = ${JSON.stringify(patternQuiz.implementationSeedMapping)};
        state.livePlaybackEndFrame = ${patternQuiz.livePlaybackEndFrame};
    }`
      : "";
    const sourceLocalGame = spec.runtimeContract.sourceLocalGame;
    const sourceLocalGameState = sourceLocalGame
      ? `\n    if (frame >= ${sourceLocalGame.entryFrame}) {
        var allowedVirusIndices = ${JSON.stringify(sourceLocalGame.allowedVirusIndices)};
        var virusLocations = ${JSON.stringify(sourceLocalGame.virusLocations)};
        var selectedAllowedIndex = seed % allowedVirusIndices.length;
        var selectedVirusIndex = allowedVirusIndices[selectedAllowedIndex];
        state.gameInitialState = Object.freeze({
            selectedAllowedIndex: selectedAllowedIndex,
            selectedVirusIndex: selectedVirusIndex,
            virusY: virusLocations[selectedVirusIndex],
            virusChildFrame: frame === ${sourceLocalGame.entryFrame}
                ? ${sourceLocalGame.virusPlacement.entryChildFrame}
                : ${sourceLocalGame.virusPlacement.postStopChildFrame},
            coupIndex: ${sourceLocalGame.coupIndex},
            coupY: ${sourceLocalGame.sourceCoupY},
            score: ${sourceLocalGame.initialScore},
            minutes: ${sourceLocalGame.initialMinutes},
            seconds: ${sourceLocalGame.initialSeconds},
            quizSection: ${sourceLocalGame.quizSection},
            signText: ${JSON.stringify(sourceLocalGame.signText)},
            locationText: ${JSON.stringify(sourceLocalGame.locationText)},
            timerDisplayText: ${JSON.stringify(sourceLocalGame.initialTimerDisplayText)},
            scoreDisplayText: ${JSON.stringify(sourceLocalGame.initialScoreDisplayText)},
            postStopStaticInspection: frame > ${sourceLocalGame.entryFrame}
        });
        state.dynamicOverlayRendered = true;
        state.sourceRandomExecuted = false;
        state.interactiveStateResolved = false;
        state.implementationSeedMapping = ${JSON.stringify(sourceLocalGame.implementationSeedMapping)};
        state.livePlaybackEndFrame = ${sourceLocalGame.livePlaybackEndFrame};
    }`
      : "";
    const hasSourceLocalState = Boolean(numberLineQuiz || patternQuiz ||
      sourceLocalGame);
    const sourceLocalState = `${numberLineQuizState}${patternQuizState}${sourceLocalGameState}`;
    const stateStart = hasSourceLocalState
      ? "var seed = rawSeed >>> 0;\n    var state = {"
      : "return Object.freeze({";
    const stateSeed = hasSourceLocalState ? "seed" : "rawSeed >>> 0";
    const stateEnd = hasSourceLocalState
      ? `};${sourceLocalState}\n    return Object.freeze(state);`
      : "});";
    const blockedLocalFrameRanges = spec.runtimeContract.blockedLocalFrameRanges ?? [];
    const blockedFrameGuard = blockedLocalFrameRanges.length > 0
      ? `\n    var blockedLocalFrameRanges = ${JSON.stringify(blockedLocalFrameRanges)};
    for (var blockedIndex = 0; blockedIndex < blockedLocalFrameRanges.length; blockedIndex += 1) {
        var blockedRange = blockedLocalFrameRanges[blockedIndex];
        if (frame >= blockedRange.firstFrame && frame <= blockedRange.lastFrame) {
            throw new Error("source behavior-dependent frame blocked: " + frame + " (" + blockedRange.reason + ")");
        }
    }`
      : "";
    return `function resolveFrameState(request) {
    request = request || {};
    var frame = request.frame;
    if (!Number.isSafeInteger(frame) || frame < 1 || frame > ${spec.timeline.local.frameCount}) {
        throw new Error("frame must be a safe integer within 1..${spec.timeline.local.frameCount}");
    }${blockedFrameGuard}
    var allowedScenarios = ${scenarios};
    var scenario = request.scenario === undefined ? ${defaultScenario} : request.scenario;
    if (allowedScenarios.indexOf(scenario) < 0) {
        throw new Error("unsupported scenario: " + scenario);
    }
    var lang = request.lang === undefined ? "en" : request.lang;
    ${languageGuard}
    var rawSeed = request.seed === undefined ? 0 : request.seed;
    if (!Number.isSafeInteger(rawSeed)) {
        throw new Error("seed must be a safe integer");
    }
    ${stateStart}
        frameDomain: ${JSON.stringify(spec.timeline.local.timelineId)},
        localFrame: frame,
        exportFrame: frame - 1,
        rootFrame: ${spec.timeline.root.beginFrame},
        rootState: "stopped-at-begin-while-child-static-frame-is-inspected",
        scenario: scenario,
        lang: lang,
        seed: ${stateSeed},
        visualOnly: true,
        interactiveStateResolved: false,${sourceSharedVisualState}
        audioRendered: false
    ${stateEnd}
}`;
  }
  const scenarios = JSON.stringify(spec.runtimeContract.scenarios);
  const defaultScenario = JSON.stringify(spec.runtimeContract.defaultScenario);
  const supportedLanguages = JSON.stringify(spec.runtimeContract.supportedLanguages);
  const outcomes = JSON.stringify(spec.timeline.randomAudio.outcomes);
  return `function resolveFrameState(request) {
    request = request || {};
    var frame = request.frame;
    if (!Number.isSafeInteger(frame) || frame < 1 || frame > ${spec.timeline.local.frameCount}) {
        throw new Error("frame must be a safe integer within 1..${spec.timeline.local.frameCount}");
    }
    var allowedScenarios = ${scenarios};
    var scenario = request.scenario === undefined ? ${defaultScenario} : request.scenario;
    if (allowedScenarios.indexOf(scenario) < 0) {
        throw new Error("unsupported scenario: " + scenario);
    }
    var lang = request.lang === undefined ? "en" : request.lang;
    var allowedLanguages = ${supportedLanguages};
    if (allowedLanguages.indexOf(lang) < 0) {
        throw new Error("unsupported source-proven language: " + lang);
    }
    var rawSeed = request.seed === undefined ? 0 : request.seed;
    if (!Number.isSafeInteger(rawSeed)) {
        throw new Error("seed must be a safe integer");
    }
    var seed = rawSeed >>> 0;
    var outcomes = ${outcomes};
    var soundOutcome = scenario === "sound-0" ? 0 : scenario === "sound-1" ? 1 : seed % outcomes.length;
    var selectedSoundLocalFrame = frame < ${spec.timeline.randomAudio.startFrame}
        ? 1
        : frame === ${spec.timeline.randomAudio.startFrame}
          ? ${spec.timeline.randomAudio.nestedStartFrame}
          : null;
    var selectedSoundLocalFrameAuthority = frame < ${spec.timeline.randomAudio.startFrame}
        ? "source-exact-stopped-frame-1"
        : frame === ${spec.timeline.randomAudio.startFrame}
          ? "source-exact-goto-and-play-frame-2-request"
          : "runtime-tick-phase-unresolved";
    return Object.freeze({
        frameDomain: ${JSON.stringify(spec.timeline.local.timelineId)},
        localFrame: frame,
        exportFrame: frame - 1,
        rootFrame: ${spec.timeline.root.beginFrame},
        rootState: "stopped-at-begin-while-child-plays",
        scenario: scenario,
        lang: lang,
        seed: seed,
        soundOutcome: soundOutcome,
        selectedSound: outcomes[soundOutcome],
        selectedSoundLocalFrame: selectedSoundLocalFrame,
        selectedSoundLocalFrameAuthority: selectedSoundLocalFrameAuthority,
        audioStartRequested: frame === ${spec.timeline.randomAudio.startFrame},
        visualBranchIndependent: true,
        visualLocalizationStatus: ${JSON.stringify(spec.runtimeContract.visualLocalization)},
        audioRendered: false
    });
}`;
}

export function buildSafeRuntime({helperSource, framesHtml, spec}) {
  validateSpec(spec);
  const helper = sanitizeHelper(helperSource);
  const {definitions, placedFunctions, imageVariables} = extractInlineDefinitions(framesHtml, spec);
  const metadata = metadataForRuntime(spec);
  const registryEntries = placedFunctions.map((name) => `${JSON.stringify(name)}: ${name}`).join(",\n        ");
  const imageEntries = imageVariables.join(", ");
  const registryName = JSON.stringify(spec.output.globalRegistry);
  const animationId = JSON.stringify(spec.animationId);
  const quizOverlaySource = spec.runtimeContract.sourceLocalNumberLineQuiz
    ? `\n\n${numberLineOverlaySource(spec)}`
    : "";
  const quizOverlayCall = spec.runtimeContract.sourceLocalNumberLineQuiz
    ? "\n    drawSourceLocalNumberLineQuiz(ctx, state);"
    : "";
  const patternQuizOverlayDefinition = spec.runtimeContract.sourceLocalPatternQuiz
    ? `\n\n${patternQuizOverlaySource(spec)}`
    : "";
  const patternQuizOverlayCall = spec.runtimeContract.sourceLocalPatternQuiz
    ? "\n    drawSourceLocalPatternQuiz(ctx, state);"
    : "";
  const gameInitialOverlayDefinition = spec.runtimeContract.sourceLocalGame
    ? `\n\n${gameInitialOverlaySource(spec)}`
    : "";
  const gameInitialOverlayCall = spec.runtimeContract.sourceLocalGame
    ? "\n        drawSourceLocalGameInitialState(ctx, state);"
    : "";

  const runtime = `/* Generated by scripts/build-safe-ffdec-canvas-adapter.mjs. */
/* Engineering candidate only: no strict, human, or owner acceptance is implied. */
(function (global) {
"use strict";
var canvas = null;
var SAFE_OBJECTS = null;

${helper}

${definitions}

SAFE_OBJECTS = Object.freeze({
        ${registryEntries}
});
var EMBEDDED_IMAGES = Object.freeze([${imageEntries}]);
var METADATA = deepFreeze(${JSON.stringify(metadata, null, 2)});
var readyPromise = null;

function deepFreeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    }
    return value;
}

function ready() {
    if (readyPromise !== null) return readyPromise;
    readyPromise = Promise.all(EMBEDDED_IMAGES.map(function (image, index) {
        if (typeof image.src !== "string" || image.src.indexOf("data:image/") !== 0) {
            return Promise.reject(new Error("blocked non-embedded image " + index));
        }
        if (image.complete && image.naturalWidth > 0) return Promise.resolve();
        return new Promise(function (resolve, reject) {
            image.onload = function () {
                image.onload = null;
                image.onerror = null;
                if (image.naturalWidth > 0) resolve();
                else reject(new Error("embedded image decoded with zero width: " + index));
            };
            image.onerror = function () {
                image.onload = null;
                image.onerror = null;
                reject(new Error("embedded image failed to decode: " + index));
            };
        });
    })).then(function () { return undefined; });
    return readyPromise;
}

${runtimeStateSource(spec)}${quizOverlaySource}${patternQuizOverlayDefinition}${gameInitialOverlayDefinition}

function render(targetCanvas, request) {
    if (!targetCanvas || typeof targetCanvas.getContext !== "function") {
        throw new Error("targetCanvas must provide a 2D canvas context");
    }
    if (targetCanvas.width !== ${spec.timeline.stage.width} || targetCanvas.height !== ${spec.timeline.stage.height}) {
        throw new Error("targetCanvas must be exactly ${spec.timeline.stage.width}x${spec.timeline.stage.height}");
    }
    for (var imageIndex = 0; imageIndex < EMBEDDED_IMAGES.length; imageIndex += 1) {
        if (!EMBEDDED_IMAGES[imageIndex].complete || EMBEDDED_IMAGES[imageIndex].naturalWidth < 1) {
            throw new Error("call and await ready() before render()");
        }
    }
    var state = resolveFrameState(request);
    var ctx = targetCanvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context is unavailable");
    var marker = "__helpMathFfdecAssetId";
    if (ctx[marker] === undefined) {
        enhanceContext(ctx);
        Object.defineProperty(ctx, marker, {value: ${animationId}, configurable: false, enumerable: false});
    } else if (ctx[marker] !== ${animationId}) {
        throw new Error("canvas context was enhanced by a different FFDec adapter");
    }

    var previousCanvas = canvas;
    canvas = targetCanvas;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = ${JSON.stringify(spec.timeline.stage.backgroundColor)};
    ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.save();
    try {
        ctx.transform(1, 0, 0, 1, ${spec.timeline.stageRenderOffset.x}, ${spec.timeline.stageRenderOffset.y});
        ${spec.ffdecExport.targetSpriteFunction}(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);${gameInitialOverlayCall}
    } finally {
        ctx.restore();
        canvas = previousCanvas;
    }${quizOverlayCall}${patternQuizOverlayCall}
    if (typeof targetCanvas.setAttribute === "function") {
        targetCanvas.setAttribute("data-flash-frame", String(state.localFrame));
        targetCanvas.setAttribute("data-flash-frame-domain", state.frameDomain);
        targetCanvas.setAttribute("data-flash-root-frame", String(state.rootFrame));
        targetCanvas.setAttribute("data-runtime-scenario", state.scenario);
        targetCanvas.setAttribute("data-runtime-seed", String(state.seed));
    }
    return state;
}

var registry = global[${registryName}];
if (registry === undefined) {
    registry = Object.create(null);
    Object.defineProperty(global, ${registryName}, {value: registry, configurable: false, enumerable: false, writable: false});
} else if (!registry || typeof registry !== "object") {
    throw new Error("blocked invalid canvas asset registry");
}
if (Object.prototype.hasOwnProperty.call(registry, ${animationId})) {
    throw new Error("canvas asset is already registered: " + ${animationId});
}
registry[${animationId}] = Object.freeze({metadata: METADATA, ready: ready, resolveFrameState: resolveFrameState, render: render});
})(globalThis);
`;

  const documentMembers = [...new Set([...runtime.matchAll(/document\.([A-Za-z_$][A-Za-z0-9_$]*)/g)].map((match) => match[1]))];
  assert(JSON.stringify(documentMembers) === JSON.stringify(["createElement"]), `generated runtime contains blocked document member(s): ${documentMembers.join(", ")}`);
  const createdElements = [...runtime.matchAll(/document\.createElement\("([a-z]+)"\)/g)].map((match) => match[1]);
  assert(createdElements.length === imageVariables.length + 1, "generated runtime contains an unrecognized element-construction expression");
  assert(createdElements[0] === "canvas" && createdElements.slice(1).every((name) => name === "img"), `generated runtime element allowlist changed: ${createdElements.join(", ")}`);
  for (const {label, pattern} of DISALLOWED_RUNTIME_PATTERNS) {
    assert(!pattern.test(runtime), `generated runtime contains blocked ${label}`);
  }
  new Script(runtime, {filename: path.basename(spec.output.script)});
  return {runtime, metadata, placedFunctions, imageVariables};
}

async function readAndVerify(root, relativePath, expectedHash, label) {
  const absolutePath = resolveProjectPath(root, relativePath, label);
  const bytes = await readFile(absolutePath);
  const actualHash = sha256(bytes);
  assert(actualHash === expectedHash, `${label}: SHA-256 mismatch (expected ${expectedHash}, observed ${actualHash})`);
  return {absolutePath, bytes, text: bytes.toString("utf8"), sha256: actualHash};
}

export async function generateSafeFfdecCanvasAdapter({root = ROOT, specPath = path.resolve(root, DEFAULT_SPEC), check = false} = {}) {
  const specBytes = await readFile(specPath);
  const spec = validateSpec(JSON.parse(specBytes.toString("utf8")));
  const source = await readAndVerify(root, spec.source.swf, spec.source.swfSha256, "source SWF");
  const scenarioInventory = await readAndVerify(root, spec.evidence.scenarioInventory, spec.evidence.scenarioInventorySha256, "scenario inventory");
  const audioAudit = await readAndVerify(root, spec.evidence.audioAudit, spec.evidence.audioAuditSha256, "audio audit");
  const bilingualVisualDisposition = spec.evidence.bilingualVisualDisposition
    ? await readAndVerify(
        root,
        spec.evidence.bilingualVisualDisposition,
        spec.evidence.bilingualVisualDispositionSha256,
        "bilingual visual disposition"
      )
    : null;
  if (bilingualVisualDisposition) {
    validateBilingualVisualDisposition(
      spec,
      JSON.parse(bilingualVisualDisposition.text)
    );
  }
  validateAdapterAuditEvidence(spec, JSON.parse(scenarioInventory.text), JSON.parse(audioAudit.text));
  const helper = await readAndVerify(root, spec.ffdecExport.helper, spec.ffdecExport.helperSha256, "FFDec helper");
  const frames = await readAndVerify(root, spec.ffdecExport.framesHtml, spec.ffdecExport.framesHtmlSha256, "FFDec frames export");
  const {runtime, metadata, placedFunctions, imageVariables} = buildSafeRuntime({
    helperSource: helper.text,
    framesHtml: frames.text,
    spec
  });
  const runtimeBytes = Buffer.from(runtime);
  const outputScript = resolveProjectPath(root, spec.output.script, "output script");
  const outputManifest = resolveProjectPath(root, spec.output.manifest, "output manifest");
  const preservedRoot = path.resolve(root, "source-assets");
  assert(!outputScript.startsWith(`${preservedRoot}${path.sep}`), "output script may not be written under source-assets");
  assert(!outputManifest.startsWith(`${preservedRoot}${path.sep}`), "output manifest may not be written under source-assets");

  const manifest = {
    schemaVersion: 1,
    animationId: spec.animationId,
    classification: spec.classification,
    authority: "Safe deterministic drawing adapter generated from a hash-pinned FFDec export; this is not authoritative runtime, audio, localization, visual, human, or owner acceptance.",
    generator: "scripts/build-safe-ffdec-canvas-adapter.mjs",
    inputs: {
      spec: {path: portable(path.relative(root, specPath)), sha256: sha256(specBytes)},
      sourceSwf: {path: spec.source.swf, sha256: source.sha256},
      scenarioInventory: {path: spec.evidence.scenarioInventory, sha256: scenarioInventory.sha256},
      audioAudit: {path: spec.evidence.audioAudit, sha256: audioAudit.sha256},
      ...(bilingualVisualDisposition
        ? {
            bilingualVisualDisposition: {
              path: spec.evidence.bilingualVisualDisposition,
              sha256: bilingualVisualDisposition.sha256
            }
          }
        : {}),
      ffdecHelper: {path: spec.ffdecExport.helper, sha256: helper.sha256},
      ffdecFramesHtml: {path: spec.ffdecExport.framesHtml, sha256: frames.sha256}
    },
    output: {
      script: spec.output.script,
      sha256: sha256(runtimeBytes),
      bytes: runtimeBytes.length,
      globalRegistry: spec.output.globalRegistry
    },
    safety: {
      noLegacyActionScriptExecuted: true,
      noDynamicEvaluation: true,
      noNetworkPrimitives: true,
      noTimersOrAutoplay: true,
      noPersistentStorage: true,
      noAmbientDomListeners: true,
      embeddedImages: imageVariables,
      drawingObjectAllowlist: placedFunctions
    },
    timeline: metadata,
    unresolved: (spec.runtimeContract?.kind ?? "ti-random-audio") === "ti-random-audio"
      ? [
          `The source root timeline stops at frame 1 until the original InternalPreloader contract advances it to labeled frame ${spec.timeline.root.beginFrame}; the deterministic renderer therefore exposes ${spec.timeline.local.timelineId} local frames rather than pretending root frames 1..${spec.timeline.root.frameCount} map one-to-one.`,
          "The FFDec drawing export omits AVM1 random(2), gotoAndPlay(2), stop(), and both embedded streaming-audio timelines; branch state is explicit but audio is not rendered.",
          "The one shipped drawing timeline has no language branch and embeds an English title; en and es requests preserve those source pixels unchanged, without claiming a Spanish translation.",
          "Both embedded audio streams remain language-undetermined and are not rendered.",
          "No safe-host Adobe GUI capture, full-frame RMSE comparison, product QA, human review, or owner review is represented by this asset."
        ]
      : spec.runtimeContract.unresolved,
    strictAcceptanceEffect: "none"
  };
  const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;

  if (check) {
    const [actualRuntime, actualManifest] = await Promise.all([
      readFile(outputScript),
      readFile(outputManifest, "utf8")
    ]);
    assert(actualRuntime.equals(runtimeBytes), "generated canvas runtime is stale");
    assert(actualManifest === manifestText, "generated canvas manifest is stale");
  } else {
    await mkdir(path.dirname(outputScript), {recursive: true});
    await mkdir(path.dirname(outputManifest), {recursive: true});
    await writeFile(outputScript, runtimeBytes);
    await writeFile(outputManifest, manifestText);
  }

  return {
    animationId: spec.animationId,
    check,
    outputScript: portable(path.relative(root, outputScript)),
    outputManifest: portable(path.relative(root, outputManifest)),
    outputSha256: manifest.output.sha256,
    bytes: runtimeBytes.length,
    localFrames: spec.timeline.local.frameCount,
    strictAcceptanceEffect: "none"
  };
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  console.log(JSON.stringify(await generateSafeFfdecCanvasAdapter(args), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
