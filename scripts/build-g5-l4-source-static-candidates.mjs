#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

import {
  buildSafeRuntime,
  validateAdapterAuditEvidence,
} from "./build-safe-ffdec-canvas-adapter.mjs";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptPath), "..");
const GENERATOR_PATH =
  "scripts/build-g5-l4-source-static-candidates.mjs";
const SAFE_ADAPTER_PATH =
  "scripts/build-safe-ffdec-canvas-adapter.mjs";
const COMPLETION_LEDGER = "catalog/completion-ledger.json";
const LESSON_RELEASE_LEDGER = "catalog/lesson-release-ledger.json";
const EXPECTED_FFDEC_VERSION = "JPEXS Free Flash Decompiler v.26.2.1";
const ROOT_PRELOADER_NAVIGATION_WITHOUT_STOP_IDS = new Set([
  "course-g05-l04-ts-003",
  "course-g05-l04-ts-004",
]);
const ROOT_PRELOADER_NAVIGATION_ACTION =
  '_level0.InternalPreloader.gotoAndPlay("jump_check");';
const ROOT_PLACEMENT_NAME_OVERRIDES = new Map([
  ["course-g05-l04-rw-002", "Animation"],
  ["course-g05-l04-rw-003", "Animation"],
  ["course-g05-l04-rw-004", "Animation"],
]);
const BLOCKED_LOCAL_FRAME_RANGES = new Map([
  ["course-g05-l04-in-004", [{
    firstFrame: 308,
    lastFrame: 320,
    reason:
      "Frames 308..320 place source right/wrong feedback clips whose visibility and progression depend on unresolved host and ActionScript state.",
  }]],
  ["course-g05-l04-in-018", [{
    firstFrame: 218,
    lastFrame: 275,
    reason:
      "Frames 218..275 begin quiz, NewProblem, Q2/Q3, answer, and feedback states whose causal transitions depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-in-017", [{
    firstFrame: 374,
    lastFrame: 541,
    reason:
      "Frames 374..541 begin quiz answer, feedback, and continuation states whose causal transitions depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-in-016", [{
    firstFrame: 191,
    lastFrame: 299,
    reason:
      "Frames 191..299 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-in-014", [{
    firstFrame: 84,
    lastFrame: 197,
    reason:
      "Frames 84..197 begin a stop- and release-handler-controlled quiz state whose answer and feedback progression depends on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-in-013", [{
    firstFrame: 83,
    lastFrame: 178,
    reason:
      "Frames 83..178 begin a stop- and release-handler-controlled quiz state whose answer and feedback progression depends on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-in-010", [{
    firstFrame: 130,
    lastFrame: 180,
    reason:
      "Frames 130..180 begin a stop- and release-handler-controlled quiz state whose answer and feedback progression depends on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-in-005", [{
    firstFrame: 93,
    lastFrame: 226,
    reason:
      "Frames 93..226 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-in-003", [{
    firstFrame: 74,
    lastFrame: 182,
    reason:
      "Frames 74..182 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-vb-007", [{
    firstFrame: 53,
    lastFrame: 136,
    reason:
      "Frames 53..136 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-vb-010", [{
    firstFrame: 36,
    lastFrame: 88,
    reason:
      "Frames 36..88 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-vb-011", [{
    firstFrame: 33,
    lastFrame: 81,
    reason:
      "Frames 33..81 begin a stop-controlled quiz state and place answer plus right/wrong feedback clips whose progression depends on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-ts-008", [{
    firstFrame: 273,
    lastFrame: 695,
    reason:
      "Frames 273..695 begin the first stop- and release-handler-controlled interaction and include later staged interactions whose progression depends on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-ts-007", [{
    firstFrame: 264,
    lastFrame: 684,
    reason:
      "Frames 264..684 begin the first stop- and release-handler-controlled interaction and include later staged interactions whose progression depends on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-vb-003", [{
    firstFrame: 126,
    lastFrame: 175,
    reason:
      "Frames 126..175 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-vb-004", [{
    firstFrame: 209,
    lastFrame: 257,
    reason:
      "Frames 209..257 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-in-006", [{
    firstFrame: 414,
    lastFrame: 464,
    reason:
      "Frames 414..464 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-in-008", [{
    firstFrame: 122,
    lastFrame: 195,
    reason:
      "Frames 122..195 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-in-011", [{
    firstFrame: 342,
    lastFrame: 428,
    reason:
      "Frames 342..428 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-in-019", [{
    firstFrame: 221,
    lastFrame: 274,
    reason:
      "Frames 221..274 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-in-021", [{
    firstFrame: 287,
    lastFrame: 288,
    reason:
      "Frames 287..288 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-in-022", [{
    firstFrame: 412,
    lastFrame: 475,
    reason:
      "Frames 412..475 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-ti-002", [{
    firstFrame: 257,
    lastFrame: 275,
    reason:
      "Frames 257..275 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-ti-003", [{
    firstFrame: 163,
    lastFrame: 164,
    reason:
      "Frames 163..164 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-ti-004", [{
    firstFrame: 198,
    lastFrame: 472,
    reason:
      "Frames 198..472 begin a stop- and answer-handler-controlled quiz; attempt/scoring branches, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-ti-005", [{
    firstFrame: 138,
    lastFrame: 363,
    reason:
      "Frames 138..363 begin a stop- and answer-handler-controlled quiz; attempt/scoring branches, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-ti-006", [{
    firstFrame: 188,
    lastFrame: 237,
    reason:
      "Frames 188..237 begin a stop- and answer-handler-controlled quiz; attempt/scoring branches, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-ti-007", [{
    firstFrame: 112,
    lastFrame: 167,
    reason:
      "Frames 112..167 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-ti-008", [{
    firstFrame: 95,
    lastFrame: 146,
    reason:
      "Frames 95..146 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-ti-009", [{
    firstFrame: 97,
    lastFrame: 114,
    reason:
      "Frames 97..114 begin a stop- and drag-handler-controlled quiz; hit testing, drop branches, score/count updates, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
  ["course-g05-l04-gs-002", [{
    firstFrame: 452,
    lastFrame: 460,
    reason:
      "Frames 452..460 begin a stop- and release-handler-controlled randomized game; question selection, scoring/timer state, feedback/audio progression, terminal state, and Replay depend on unresolved ActionScript and host state.",
  }]],
]);

const WAVE3_SAFE_PREFIX_BOUNDARIES = new Map([
  ["course-g05-l04-vb-003", [95, 126, "drag"]],
  ["course-g05-l04-vb-004", [71, 209, "drag"]],
  ["course-g05-l04-in-006", [103, 414, "drag"]],
  ["course-g05-l04-in-008", [123, 122, "drag"]],
  ["course-g05-l04-in-011", [231, 342, "drag"]],
  ["course-g05-l04-in-019", [265, 221, "drag"]],
  ["course-g05-l04-in-021", [97, 287, "drag"]],
  ["course-g05-l04-in-022", [355, 412, "drag"]],
  ["course-g05-l04-ti-002", [413, 257, "drag"]],
  ["course-g05-l04-ti-003", [270, 163, "drag"]],
  ["course-g05-l04-ti-004", [299, 198, "answer-button"]],
  ["course-g05-l04-ti-005", [272, 138, "answer-button"]],
  ["course-g05-l04-ti-006", [191, 188, "answer-release"]],
  ["course-g05-l04-ti-007", [177, 112, "drag"]],
  ["course-g05-l04-ti-008", [160, 95, "drag"]],
  ["course-g05-l04-ti-009", [171, 97, "drag"]],
  ["course-g05-l04-gs-002", [436, 452, "random-game"]],
]);

export const G5_L4_SOURCE_STATIC_IDS = Object.freeze([
  "course-g05-l04-vb-002",
  "course-g05-l04-vb-005",
  "course-g05-l04-vb-006",
  "course-g05-l04-in-009",
  "course-g05-l04-in-015",
  "course-g05-l04-ts-006",
  "course-g05-l04-ts-002",
  "course-g05-l04-ts-005",
  "course-g05-l04-vb-008",
  "course-g05-l04-vb-009",
  "course-g05-l04-in-020",
  "course-g05-l04-in-012",
  "course-g05-l04-ts-003",
  "course-g05-l04-ts-004",
  "course-g05-l04-rw-003",
  "course-g05-l04-rw-004",
  "course-g05-l04-in-002",
  "course-g05-l04-in-007",
  "course-g05-l04-rw-002",
  "course-g05-l04-in-004",
  "course-g05-l04-in-018",
  "course-g05-l04-in-017",
  "course-g05-l04-in-016",
  "course-g05-l04-in-014",
  "course-g05-l04-in-013",
  "course-g05-l04-in-010",
  "course-g05-l04-in-005",
  "course-g05-l04-in-003",
  "course-g05-l04-vb-007",
  "course-g05-l04-vb-010",
  "course-g05-l04-vb-011",
  "course-g05-l04-ts-008",
  "course-g05-l04-ts-007",
  "course-g05-l04-vb-003",
  "course-g05-l04-vb-004",
  "course-g05-l04-in-006",
  "course-g05-l04-in-008",
  "course-g05-l04-in-011",
  "course-g05-l04-in-019",
  "course-g05-l04-in-021",
  "course-g05-l04-in-022",
  "course-g05-l04-ti-002",
  "course-g05-l04-ti-003",
  "course-g05-l04-ti-004",
  "course-g05-l04-ti-005",
  "course-g05-l04-ti-006",
  "course-g05-l04-ti-007",
  "course-g05-l04-ti-008",
  "course-g05-l04-ti-009",
  "course-g05-l04-gs-002",
  "course-g05-l04-ir-001-a662633d",
]);

const SPEC_PATHS = Object.freeze(Object.fromEntries(
  G5_L4_SOURCE_STATIC_IDS.map((animationId) => [
    animationId,
    `migrations/${animationId}/audit/source-static-current-js-candidate-spec.json`,
  ]),
));

const ACCEPTANCE_EFFECTS = Object.freeze({
  implementationAuthorized: false,
  authoritativeOriginalRuntime: false,
  naturalRuntimeReachabilityComplete: false,
  frameDomainDispositionComplete: false,
  bilingualVisualParityComplete: false,
  audioAccepted: false,
  replayParityComplete: false,
  fullFrameRmseComplete: false,
  behaviorComplete: false,
  productQaComplete: false,
  accessibilityQaComplete: false,
  engineeringReviewAccepted: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required");
  invariant(!path.isAbsolute(relativePath),
    `absolute project path is forbidden: ${relativePath}`);
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  invariant(relative && !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative), `path escapes the project: ${relativePath}`);
  return resolved;
}

async function readBinding(relativePath, expected = {}) {
  const absolutePath = projectPath(relativePath);
  const [metadata, canonical] = await Promise.all([
    lstat(absolutePath),
    realpath(absolutePath),
  ]);
  invariant(metadata.isFile(), `${relativePath}: expected a regular file`);
  invariant(canonical === absolutePath,
    `${relativePath}: symbolic-link or path-alias input is forbidden`);
  const bytes = await readFile(absolutePath);
  const binding = {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    contents: bytes.toString("utf8"),
  };
  if (expected.bytes !== undefined) {
    invariant(binding.bytes === expected.bytes,
      `${relativePath}: expected ${expected.bytes} bytes, observed ${binding.bytes}`);
  }
  if (expected.sha256 !== undefined) {
    invariant(binding.sha256 === expected.sha256,
      `${relativePath}: SHA-256 drifted`);
  }
  return binding;
}

function withoutContents(binding) {
  const {contents: _contents, ...rest} = binding;
  return rest;
}

function pairedFlaStatus(spec) {
  return spec.source?.pairedFlaStatus ?? "present";
}

function sourceFlaEvidence(spec) {
  const status = pairedFlaStatus(spec);
  return {
    pairedFlaStatus: status,
    path: status === "present" ? spec.source.fla : null,
    bytes: status === "present" ? spec.source.flaBytes : null,
    sha256: status === "present" ? spec.source.flaSha256 : null,
    authoringAuditEstablished: false,
  };
}

function associatedAudioKind(spec) {
  return spec.source?.associatedAudioKind ?? "external-file";
}

function expectedBlockedLocalFrameRanges(animationId) {
  return BLOCKED_LOCAL_FRAME_RANGES.get(animationId) ?? [];
}

function isBlockedLocalFrame(spec, frame) {
  return spec.runtimeContract.blockedLocalFrameRanges.some(
    ({firstFrame, lastFrame}) =>
      frame >= firstFrame && frame <= lastFrame,
  );
}

function renderableLocalFrames(spec) {
  return Array.from(
    {length: spec.timeline.local.frameCount},
    (_, index) => index + 1,
  ).filter((frame) => !isBlockedLocalFrame(spec, frame));
}

export function parseArguments(argv) {
  const options = {check: false, ffdec: "ffdec", ids: []};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--id" || argument === "--ffdec") {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("-"),
        `${argument} requires one value`);
      if (argument === "--id") options.ids.push(value);
      else options.ffdec = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (!options.help) {
    const selected = options.ids.length > 0
      ? options.ids
      : [...G5_L4_SOURCE_STATIC_IDS];
    invariant(new Set(selected).size === selected.length,
      "duplicate --id is forbidden");
    for (const id of selected) {
      invariant(Object.hasOwn(SPEC_PATHS, id), `unsupported animation ID: ${id}`);
    }
    options.ids = selected;
  }
  return options;
}

export function validateG5L4SourceStaticSpec(spec) {
  invariant(spec?.schemaVersion === 1,
    "G5 L4 source-static spec schemaVersion must be 1");
  invariant(G5_L4_SOURCE_STATIC_IDS.includes(spec.animationId),
    "G5 L4 source-static spec animationId is not allowlisted");
  invariant(spec.classification ===
    "source-static-current-javascript-engineering-candidate-only",
  `${spec.animationId}: candidate classification changed`);
  invariant(typeof spec.title === "string" && spec.title.length > 0,
    `${spec.animationId}: title is required`);
  for (const [label, value] of [
    ["SWF", spec.source?.swf],
    ["associated audio", spec.source?.associatedAudio],
    [
      "prebinding scenario inventory",
      spec.evidence?.prebindingScenarioInventory,
    ],
    ["audio audit", spec.evidence?.audioAudit],
    [
      "prebinding frame-domain disposition",
      spec.evidence?.prebindingFrameDomainDisposition,
    ],
    ["runtime output", spec.output?.script],
    ["manifest output", spec.output?.manifest],
    ["report output", spec.output?.report],
  ]) {
    invariant(typeof value === "string" && value.length > 0,
      `${spec.animationId}: ${label} path is required`);
  }
  const flaStatus = pairedFlaStatus(spec);
  invariant(flaStatus === "present" || flaStatus === "missing",
    `${spec.animationId}: pairedFlaStatus must be present or missing`);
  if (flaStatus === "present") {
    invariant(typeof spec.source?.fla === "string" &&
      spec.source.fla.length > 0 &&
      Number.isSafeInteger(spec.source.flaBytes) &&
      spec.source.flaBytes > 0 &&
      /^[a-f0-9]{64}$/.test(spec.source.flaSha256 ?? ""),
    `${spec.animationId}: present paired FLA binding is invalid`);
  } else {
    invariant(spec.source?.pairedFlaStatus === "missing" &&
      spec.source.fla === null &&
      spec.source.flaBytes === null &&
      spec.source.flaSha256 === null,
    `${spec.animationId}: missing paired FLA must remain explicit null evidence`);
  }
  const audioKind = associatedAudioKind(spec);
  invariant(
    audioKind === "external-file" ||
      audioKind === "embedded-swf-stream-container",
    `${spec.animationId}: associated audio kind is invalid`,
  );
  if (audioKind === "embedded-swf-stream-container") {
    invariant(
      spec.source.associatedAudio === spec.source.swf &&
        spec.source.associatedAudioBytes === spec.source.swfBytes &&
        spec.source.associatedAudioSha256 === spec.source.swfSha256,
      `${spec.animationId}: embedded audio container must be the exact source SWF`,
    );
  }
  for (const [label, value] of [
    ["SWF", spec.source?.swfSha256],
    ["associated audio", spec.source?.associatedAudioSha256],
    [
      "prebinding scenario inventory",
      spec.evidence?.prebindingScenarioInventorySha256,
    ],
    ["audio audit", spec.evidence?.audioAuditSha256],
    [
      "prebinding frame-domain disposition",
      spec.evidence?.prebindingFrameDomainDispositionSha256,
    ],
    ["FFDec helper", spec.ffdecExport?.helperSha256],
    ["FFDec frames", spec.ffdecExport?.framesHtmlSha256],
  ]) {
    invariant(/^[a-f0-9]{64}$/.test(value ?? ""),
      `${spec.animationId}: ${label} SHA-256 is invalid`);
  }
  invariant(spec.ffdecExport.tool === EXPECTED_FFDEC_VERSION,
    `${spec.animationId}: FFDec version binding changed`);
  const fontCountDeclared =
    spec.ffdecExport.expectedFontFunctionCount !== undefined;
  const fontHashDeclared =
    spec.ffdecExport.expectedFontFunctionsSha256 !== undefined;
  invariant(
    fontCountDeclared === fontHashDeclared &&
      (!fontCountDeclared || (
        Number.isSafeInteger(spec.ffdecExport.expectedFontFunctionCount) &&
        spec.ffdecExport.expectedFontFunctionCount >= 0 &&
        /^[a-f0-9]{64}$/.test(
          spec.ffdecExport.expectedFontFunctionsSha256,
        )
      )),
    `${spec.animationId}: FFDec font-function binding is invalid`,
  );
  invariant(spec.timeline?.stage?.width === 800 &&
    spec.timeline.stage.height === 600 &&
    spec.timeline.stage.backgroundColor === "#b8d8f7" &&
    spec.timeline.fps === 12,
  `${spec.animationId}: native stage contract changed`);
  const rootPreloaderContract =
    ROOT_PRELOADER_NAVIGATION_WITHOUT_STOP_IDS.has(spec.animationId)
      ? spec.timeline.root?.preloaderStopFrame === null &&
        spec.timeline.root.preloaderNavigationFrame === 1 &&
        spec.timeline.root.preloaderNavigationAction ===
          ROOT_PRELOADER_NAVIGATION_ACTION
      : spec.timeline.root?.preloaderStopFrame === 1;
  const expectedPlacementName =
    ROOT_PLACEMENT_NAME_OVERRIDES.get(spec.animationId) ?? "animation";
  invariant(spec.timeline.root?.frameCount === 10 &&
    rootPreloaderContract &&
    spec.timeline.root.beginFrame === 6 &&
    spec.timeline.root.beginLabel === "begin" &&
    spec.timeline.root.placementName === expectedPlacementName,
  `${spec.animationId}: root contract changed`);
  invariant(/^sprite-\d+$/.test(spec.timeline.local?.timelineId ?? "") &&
    Number.isSafeInteger(spec.timeline.local?.frameCount) &&
    spec.timeline.local.frameCount > 0 &&
    spec.timeline.local.playbackMode === "once",
  `${spec.animationId}: local timeline contract is invalid`);
  invariant(spec.timeline.local.timelineId ===
    `sprite-${spec.ffdecExport.targetSpriteObjectId}` &&
    spec.ffdecExport.targetSpriteFunction ===
      `sprite${spec.ffdecExport.targetSpriteObjectId}`,
  `${spec.animationId}: FFDec target and frame domain disagree`);
  invariant(spec.runtimeContract?.kind === "structural-local-frame" &&
    JSON.stringify(spec.runtimeContract.scenarios) ===
      JSON.stringify(["source-static-frame"]) &&
    spec.runtimeContract.defaultScenario === "source-static-frame" &&
    JSON.stringify(spec.runtimeContract.supportedLanguages) ===
      JSON.stringify(["en"]) &&
    JSON.stringify(spec.runtimeContract.blockedLocalFrameRanges) ===
      JSON.stringify(expectedBlockedLocalFrameRanges(spec.animationId)) &&
    Array.isArray(spec.runtimeContract.unresolved) &&
    spec.runtimeContract.unresolved.length >= 3,
  `${spec.animationId}: fail-closed runtime contract changed`);
  const wave3Boundary = WAVE3_SAFE_PREFIX_BOUNDARIES.get(spec.animationId);
  if (wave3Boundary) {
    const [objectId, firstBlockedFrame, interactionKind] = wave3Boundary;
    const boundary = spec.runtimeContract.safePrefixBoundary;
    invariant(
      spec.evidence?.boundaryScriptInventory ===
        `migrations/${spec.animationId}/audit/script-inventory.json` &&
        /^[a-f0-9]{64}$/.test(
          spec.evidence.boundaryScriptInventorySha256 ?? "",
        ) &&
        spec.evidence.swfmillStructure ===
          `migrations/${spec.animationId}/audit/machine/swfmill.xml.gz` &&
        /^[a-f0-9]{64}$/.test(
          spec.evidence.swfmillStructureSha256 ?? "",
        ),
      `${spec.animationId}: safe-prefix evidence bindings are invalid`,
    );
    invariant(
      objectId === spec.ffdecExport.targetSpriteObjectId &&
        boundary?.firstNonInitialStopFrame === firstBlockedFrame &&
        boundary.firstBlockedFrame === firstBlockedFrame &&
        boundary.lastSafeFrame === firstBlockedFrame - 1 &&
        boundary.interactionKind === interactionKind &&
        boundary.boundaryDoActionSourcePath ===
          `DefineSprite_${objectId}/frame_${firstBlockedFrame}/DoAction.as` &&
        Array.isArray(boundary.requiredReasons) &&
        boundary.requiredReasons.includes("script-stop-state") &&
        boundary.requiredReasons.includes("structural-action:DoAction") &&
        boundary.sourceStaticInferenceOnly === true &&
        boundary.authoritativeRuntimeReachabilityEstablished === false &&
        boundary.behaviorReconstructed === false,
      `${spec.animationId}: safe-prefix boundary contract changed`,
    );
  } else {
    invariant(spec.runtimeContract.safePrefixBoundary === undefined,
      `${spec.animationId}: unallowlisted safe-prefix boundary is forbidden`);
  }
  invariant(renderableLocalFrames(spec).length > 0,
    `${spec.animationId}: source-static contract blocks every local frame`);
  invariant(
    spec.runtimeContract.prebindingTargetFrameDomainDisposition ===
      "unresolved" &&
    spec.runtimeContract.currentCanonicalFrameDomainDispositionAsserted ===
      false,
    `${spec.animationId}: immutable prebinding disposition boundary changed`,
  );
  invariant(
    spec.evidence.scenarioInventory === undefined &&
    spec.evidence.scenarioInventorySha256 === undefined &&
    spec.evidence.frameDomainDisposition === undefined &&
    spec.evidence.frameDomainDispositionSha256 === undefined,
    `${spec.animationId}: candidate must not pin mutable canonical evidence`,
  );
  invariant(spec.strictAcceptanceEffect === "none",
    `${spec.animationId}: strict acceptance effect must remain none`);
  invariant(spec.output.script ===
    `public/flash-assets/courses/${spec.animationId}/canvas-renderer.js` &&
    spec.output.manifest ===
      `public/flash-assets/courses/${spec.animationId}/manifest.json` &&
    spec.output.report ===
      `migrations/${spec.animationId}/evidence/source-static-current-js-candidate.json` &&
    spec.output.globalRegistry === "HELP_MATH_CANVAS_ASSETS",
  `${spec.animationId}: output contract changed`);
  return spec;
}

function safeAdapterCompatibilitySpec(spec) {
  return {
    ...spec,
    evidence: {
      ...spec.evidence,
      scenarioInventory: spec.evidence.prebindingScenarioInventory,
      scenarioInventorySha256:
        spec.evidence.prebindingScenarioInventorySha256,
    },
  };
}

function validateWave3SafePrefixBoundary(
  spec,
  scenarioInventory,
  scriptInventory,
) {
  const profile = WAVE3_SAFE_PREFIX_BOUNDARIES.get(spec.animationId);
  if (!profile) return null;
  const [objectId, firstBlockedFrame, interactionKind] = profile;
  invariant(scriptInventory?.animationId === spec.animationId,
    `${spec.animationId}: boundary script inventory identity drifted`);
  const timeline = scenarioInventory.timelineInventory?.find(
    ({timelineId}) => timelineId === `sprite-${objectId}`,
  );
  invariant(timeline?.frameCount === spec.timeline.local.frameCount,
    `${spec.animationId}: boundary target timeline drifted`);
  const nonInitialStops = (timeline.controlStates ?? [])
    .filter(({frame, reasons}) =>
      frame > 1 && reasons.includes("script-stop-state"))
    .sort((left, right) => left.frame - right.frame);
  const firstStop = nonInitialStops[0];
  invariant(firstStop?.frame === firstBlockedFrame &&
    JSON.stringify(firstStop.reasons) ===
      JSON.stringify(spec.runtimeContract.safePrefixBoundary.requiredReasons),
  `${spec.animationId}: immutable first-stop boundary drifted`);
  if (interactionKind === "drag") {
    invariant(firstStop.reasons.includes("event-handler:press") &&
      firstStop.reasons.includes("event-handler:releaseOutside+release"),
    `${spec.animationId}: immutable drag signals drifted`);
  } else if (["answer-release", "random-game"].includes(interactionKind)) {
    invariant(firstStop.reasons.includes("event-handler:release"),
      `${spec.animationId}: immutable release signal drifted`);
  }
  const scripts = scriptInventory.scripts ?? [];
  const boundaryDoAction =
    `DefineSprite_${objectId}/frame_${firstBlockedFrame}/DoAction.as`;
  invariant(scripts.some(({sourcePath}) => sourcePath === boundaryDoAction),
    `${spec.animationId}: boundary DoAction evidence drifted`);
  const interactiveScriptFound = interactionKind === "answer-button"
    ? scripts.some(({sourcePath}) =>
      /^DefineButton2_\d+\/BUTTONCONDACTION on\(release\)\.as$/.test(
        sourcePath,
      ))
    : scripts.some(({sourcePath}) =>
      sourcePath.startsWith(
        `DefineSprite_${objectId}/frame_${firstBlockedFrame}/`,
      ) && sourcePath.includes("CLIPACTIONRECORD"));
  invariant(interactiveScriptFound,
    `${spec.animationId}: interactive boundary script evidence drifted`);
  return {
    ...spec.runtimeContract.safePrefixBoundary,
    scenarioAntecedent: {
      path: spec.evidence.prebindingScenarioInventory,
      sha256: spec.evidence.prebindingScenarioInventorySha256,
      immutable: true,
    },
    scriptInventory: {
      path: spec.evidence.boundaryScriptInventory,
      sha256: spec.evidence.boundaryScriptInventorySha256,
    },
    swfmillStructure: {
      path: spec.evidence.swfmillStructure,
      sha256: spec.evidence.swfmillStructureSha256,
    },
  };
}

async function inspectFfdec(command) {
  const result = await execFile(command, ["-help"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const output = `${result.stdout}\n${result.stderr}`;
  invariant(output.includes(EXPECTED_FFDEC_VERSION),
    `FFDec version changed; expected ${EXPECTED_FFDEC_VERSION}`);
  return {command, version: EXPECTED_FFDEC_VERSION};
}

async function exportCanvas({ffdec, spec, temporaryRoot}) {
  const canvasRoot = path.join(temporaryRoot, spec.animationId);
  const result = await execFile(ffdec.command, [
    "-config", "packJavaScripts=false",
    "-onerror", "abort",
    "-selectid", String(spec.ffdecExport.targetSpriteObjectId),
    "-format", "sprite:canvas",
    "-export", "sprite",
    canvasRoot,
    projectPath(spec.source.swf),
  ], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  invariant(`${result.stdout}\n${result.stderr}`.includes(EXPECTED_FFDEC_VERSION),
    `${spec.animationId}: fresh FFDec export version changed`);
  const exportDirectory = path.join(
    canvasRoot,
    `DefineSprite_${spec.ffdecExport.targetSpriteObjectId}`,
  );
  const [helper, frames] = await Promise.all([
    readFile(path.join(exportDirectory, "canvas.js")),
    readFile(path.join(exportDirectory, "frames.html")),
  ]);
  invariant(helper.length === spec.ffdecExport.helperBytes &&
    sha256(helper) === spec.ffdecExport.helperSha256,
  `${spec.animationId}: fresh FFDec helper drifted`);
  invariant(frames.length === spec.ffdecExport.framesHtmlBytes &&
    sha256(frames) === spec.ffdecExport.framesHtmlSha256,
  `${spec.animationId}: fresh FFDec frames export drifted`);
  return {helper, frames};
}

async function runBrowserSweep(browser, runtime, spec) {
  const page = await browser.newPage({viewport: {width: 800, height: 600}});
  const consoleErrors = [];
  const pageErrors = [];
  const networkRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => networkRequests.push(request.url()));
  try {
    await page.setContent(
      `<canvas id="stage" width="800" height="600"></canvas>`,
      {waitUntil: "load"},
    );
    await page.addScriptTag({content: runtime});
    const allowedFrames = renderableLocalFrames(spec);
    const blockedFrames = Array.from(
      {length: spec.timeline.local.frameCount},
      (_, index) => index + 1,
    ).filter((frame) => isBlockedLocalFrame(spec, frame));
    const result = await page.evaluate(async ({
      allowedFrames,
      animationId,
      blockedFrames,
      frameDomain,
    }) => {
      const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[animationId];
      if (!asset) throw new Error("candidate runtime did not register");
      await asset.ready();
      const canvas = document.getElementById("stage");
      const context = canvas.getContext("2d", {willReadFrequently: true});
      const sampleFrames = new Set([
        allowedFrames[0],
        allowedFrames[Math.floor((allowedFrames.length - 1) / 2)],
        allowedFrames[allowedFrames.length - 1],
      ]);
      const samples = [];
      for (const frame of allowedFrames) {
        const state = asset.render(canvas, {
          frame,
          scenario: "source-static-frame",
          lang: "en",
          seed: 0,
        });
        if (
          state.localFrame !== frame ||
          state.frameDomain !== frameDomain ||
          state.rootFrame !== 6 ||
          state.scenario !== "source-static-frame" ||
          state.lang !== "en" ||
          state.seed !== 0 ||
          state.audioRendered !== false
        ) {
          throw new Error(`deterministic identity mismatch at frame ${frame}`);
        }
        if (sampleFrames.has(frame)) {
          const pixels = context.getImageData(0, 0, 800, 600).data;
          let hash = 2166136261;
          let nonTransparentPixelCount = 0;
          for (let index = 0; index < pixels.length; index += 4) {
            hash ^= pixels[index];
            hash = Math.imul(hash, 16777619);
            hash ^= pixels[index + 1];
            hash = Math.imul(hash, 16777619);
            hash ^= pixels[index + 2];
            hash = Math.imul(hash, 16777619);
            hash ^= pixels[index + 3];
            hash = Math.imul(hash, 16777619);
            if (pixels[index + 3] !== 0) nonTransparentPixelCount += 1;
          }
          samples.push({
            frame,
            fnv1a32Rgba: (hash >>> 0).toString(16).padStart(8, "0"),
            nonTransparentPixelCount,
          });
        }
      }
      for (const frame of blockedFrames) {
        for (const operation of ["resolve", "render"]) {
          let rejected = false;
          try {
            const request = {
              frame,
              scenario: "source-static-frame",
              lang: "en",
              seed: 0,
            };
            if (operation === "resolve") asset.resolveFrameState(request);
            else asset.render(canvas, request);
          } catch (error) {
            rejected =
              error instanceof Error &&
              error.message.includes("source behavior-dependent frame blocked");
          }
          if (!rejected) {
            throw new Error(
              `blocked frame ${frame} did not fail closed during ${operation}`,
            );
          }
        }
      }
      return {
        renderedFrameCount: allowedFrames.length,
        blockedFrameCount: blockedFrames.length,
        blockedRequestRejectionCount: blockedFrames.length * 2,
        samples,
        canvasIdentity: {
          frame: canvas.getAttribute("data-flash-frame"),
          frameDomain: canvas.getAttribute("data-flash-frame-domain"),
          rootFrame: canvas.getAttribute("data-flash-root-frame"),
          scenario: canvas.getAttribute("data-runtime-scenario"),
          seed: canvas.getAttribute("data-runtime-seed"),
        },
      };
    }, {
      allowedFrames,
      animationId: spec.animationId,
      blockedFrames,
      frameDomain: spec.timeline.local.timelineId,
    });
    invariant(result.renderedFrameCount === allowedFrames.length,
      `${spec.animationId}: browser sweep was incomplete`);
    invariant(
      result.blockedFrameCount === blockedFrames.length &&
        result.blockedRequestRejectionCount === blockedFrames.length * 2,
      `${spec.animationId}: blocked-frame fail-closed sweep was incomplete`,
    );
    invariant(result.samples.every((sample) =>
      sample.nonTransparentPixelCount === 800 * 600),
    `${spec.animationId}: representative canvas frame was not fully painted`);
    invariant(consoleErrors.length === 0,
      `${spec.animationId}: browser console error: ${consoleErrors.join("; ")}`);
    invariant(pageErrors.length === 0,
      `${spec.animationId}: browser page error: ${pageErrors.join("; ")}`);
    invariant(networkRequests.length === 0,
      `${spec.animationId}: unexpected browser network request`);
    return {
      ...result,
      consoleErrorCount: 0,
      pageErrorCount: 0,
      unexpectedNetworkRequestCount: 0,
      nativeStage: {width: 800, height: 600},
    };
  } finally {
    await page.close();
  }
}

async function atomicWrite(relativePath, bytes) {
  const target = projectPath(relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  const temporary = `${target}.tmp-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, target);
}

async function emit(relativePath, bytes, check) {
  if (check) {
    const current = await readFile(projectPath(relativePath));
    invariant(current.equals(bytes), `${relativePath}: generated output is stale`);
    return;
  }
  await atomicWrite(relativePath, bytes);
}

function buildManifest({
  antecedentFrameDomainDispositionStatus,
  antecedentTargetFrameDomainDisposition,
  browserQa,
  built,
  generatorBinding,
  runtimeBytes,
  safeAdapterBinding,
  safePrefixBoundary,
  spec,
  specBinding,
}) {
  return {
    schemaVersion: 1,
    animationId: spec.animationId,
    classification: spec.classification,
    authority:
      "Hash-bound safe FFDec drawing adapter and current-browser full-frame engineering sweep only; no original-runtime, audio, localization, human, Owner, strict, or publication acceptance is implied.",
    generator: GENERATOR_PATH,
    inputs: {
      spec: withoutContents(specBinding),
      generator: withoutContents(generatorBinding),
      safeAdapterGenerator: withoutContents(safeAdapterBinding),
      sourceSwf: {
        path: spec.source.swf,
        bytes: spec.source.swfBytes,
        sha256: spec.source.swfSha256,
      },
      sourceFla: {
        ...sourceFlaEvidence(spec),
      },
      associatedAudio: {
        kind: associatedAudioKind(spec),
        path: spec.source.associatedAudio,
        bytes: spec.source.associatedAudioBytes,
        sha256: spec.source.associatedAudioSha256,
        listened: false,
        rendered: false,
      },
      prebindingScenarioInventory: {
        path: spec.evidence.prebindingScenarioInventory,
        sha256: spec.evidence.prebindingScenarioInventorySha256,
        immutableAntecedent: true,
        currentCanonicalInventoryAsserted: false,
      },
      audioAudit: {
        path: spec.evidence.audioAudit,
        sha256: spec.evidence.audioAuditSha256,
      },
      prebindingFrameDomainDisposition: {
        path: spec.evidence.prebindingFrameDomainDisposition,
        sha256: spec.evidence.prebindingFrameDomainDispositionSha256,
        status: antecedentFrameDomainDispositionStatus,
        targetTimelineDisposition: antecedentTargetFrameDomainDisposition,
        immutableAntecedent: true,
        antecedentDispositionWasUnresolved: true,
        currentCanonicalDispositionAsserted: false,
        authoritativeRuntimeDispositionEstablished: false,
        strictAcceptanceEffect: "none",
      },
      ...(safePrefixBoundary
        ? {safePrefixBoundaryEvidence: safePrefixBoundary}
        : {}),
      freshFfdecExport: {
        helperBytes: spec.ffdecExport.helperBytes,
        helperSha256: spec.ffdecExport.helperSha256,
        framesHtmlBytes: spec.ffdecExport.framesHtmlBytes,
        framesHtmlSha256: spec.ffdecExport.framesHtmlSha256,
        ...(spec.ffdecExport.expectedFontFunctionCount !== undefined
          ? {
              expectedFontFunctionCount:
                spec.ffdecExport.expectedFontFunctionCount,
              expectedFontFunctionsSha256:
                spec.ffdecExport.expectedFontFunctionsSha256,
            }
          : {}),
      },
    },
    output: {
      script: spec.output.script,
      bytes: runtimeBytes.length,
      sha256: sha256(runtimeBytes),
      globalRegistry: spec.output.globalRegistry,
    },
    safety: {
      noLegacyActionScriptExecuted: true,
      noDynamicEvaluation: true,
      noNetworkPrimitives: true,
      noTimersOrAutoplay: true,
      noPersistentStorage: true,
      noAmbientDomListeners: true,
      pointerEventsEnabled: false,
      audioRendered: false,
      embeddedImages: built.imageVariables,
      drawingObjectAllowlist: built.placedFunctions,
    },
    timeline: built.metadata,
    sourceStaticFrameContract: {
      sourceTimelineFirstFrame: 1,
      sourceTimelineLastFrame: spec.timeline.local.frameCount,
      renderableFrames: renderableLocalFrames(spec).length,
      blockedLocalFrameRanges:
        spec.runtimeContract.blockedLocalFrameRanges,
      ...(safePrefixBoundary ? {safePrefixBoundary} : {}),
    },
    browserQa,
    unresolved: spec.runtimeContract.unresolved,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
    strictAcceptanceEffect: "none",
  };
}

function buildReport({
  browserQa,
  manifest,
  safePrefixBoundary,
  spec,
  specBinding,
}) {
  return {
    schemaVersion: 1,
    artifactType: "g5-l4-source-static-current-javascript-candidate",
    animationId: spec.animationId,
    title: spec.title,
    status: "current-javascript-engineering-candidate-only",
    source: {
      swf: {
        path: spec.source.swf,
        bytes: spec.source.swfBytes,
        sha256: spec.source.swfSha256,
      },
      fla: {
        ...sourceFlaEvidence(spec),
      },
      associatedAudio: {
        kind: associatedAudioKind(spec),
        path: spec.source.associatedAudio,
        bytes: spec.source.associatedAudioBytes,
        sha256: spec.source.associatedAudioSha256,
        listened: false,
        rendered: false,
      },
    },
    specification: withoutContents(specBinding),
    renderer: {
      kind: "safe-hash-bound-ffdec-canvas-source-static",
      frameDomain: spec.timeline.local.timelineId,
      firstFrame: 1,
      lastFrame: spec.timeline.local.frameCount,
      lastRenderableFrame:
        renderableLocalFrames(spec).at(-1),
      renderableFrameCount: renderableLocalFrames(spec).length,
      blockedLocalFrameRanges:
        spec.runtimeContract.blockedLocalFrameRanges,
      ...(safePrefixBoundary ? {safePrefixBoundary} : {}),
      rootFrameCount: spec.timeline.root.frameCount,
      rootEnabled: false,
      supportedLanguages: ["en"],
      audioEnabled: false,
      sourceControlsEnabled: false,
      runtimeScript: manifest.output,
      runtimeManifest: {
        path: spec.output.manifest,
        sha256: sha256(Buffer.from(stableJson(manifest))),
      },
    },
    browserQa,
    evidenceBoundary: {
      prebindingAntecedentUsed: true,
      antecedentTargetFrameDomainDisposition: "unresolved",
      originalRuntimeBaselineUsed: false,
      canonicalFrameDomainDispositionChanged: false,
      currentCanonicalFrameDomainDispositionAsserted: false,
      authoritativeRuntimeFrameDomainDispositionEstablished: false,
      naturalRuntimeReachabilityEstablished: false,
      visualParityCompared: false,
      normalizedRmseComputed: false,
      spanishVisualEstablished: false,
      audioAccepted: false,
      humanVisualReviewPerformed: false,
      ownerReviewPerformed: false,
      strictCompletionClaimed: false,
      publicationClaimed: false,
    },
    unresolved: spec.runtimeContract.unresolved,
    acceptanceEffects: ACCEPTANCE_EFFECTS,
    strictAcceptanceEffect: "none",
  };
}

export async function buildG5L4SourceStaticCandidates({
  check = false,
  ffdec = "ffdec",
  ids = [...G5_L4_SOURCE_STATIC_IDS],
} = {}) {
  invariant(ids.length > 0, "at least one animation ID is required");
  for (const id of ids) {
    invariant(Object.hasOwn(SPEC_PATHS, id), `unsupported animation ID: ${id}`);
  }
  const [completionBefore, releaseBefore, generatorBinding, safeAdapterBinding] =
    await Promise.all([
      readBinding(COMPLETION_LEDGER),
      readBinding(LESSON_RELEASE_LEDGER),
      readBinding(GENERATOR_PATH),
      readBinding(SAFE_ADAPTER_PATH),
    ]);
  const ffdecTool = await inspectFfdec(ffdec);
  const browser = await chromium.launch({headless: true});
  const browserVersion = browser.version();
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "help-math-g5-l4-source-static-"),
  );
  const results = [];
  try {
    for (const animationId of ids) {
      const specBinding = await readBinding(SPEC_PATHS[animationId]);
      const spec = validateG5L4SourceStaticSpec(
        JSON.parse(specBinding.contents),
      );
      const flaStatus = pairedFlaStatus(spec);
      const [
        sourceSwf,
        sourceFla,
        associatedAudio,
        prebindingScenarioInventory,
        audioAudit,
        prebindingFrameDomainDisposition,
        boundaryScriptInventory,
        swfmillStructure,
      ] = await Promise.all([
        readBinding(spec.source.swf, {
          bytes: spec.source.swfBytes,
          sha256: spec.source.swfSha256,
        }),
        flaStatus === "present"
          ? readBinding(spec.source.fla, {
              bytes: spec.source.flaBytes,
              sha256: spec.source.flaSha256,
            })
          : Promise.resolve(null),
        readBinding(spec.source.associatedAudio, {
          bytes: spec.source.associatedAudioBytes,
          sha256: spec.source.associatedAudioSha256,
        }),
        readBinding(spec.evidence.prebindingScenarioInventory, {
          sha256: spec.evidence.prebindingScenarioInventorySha256,
        }),
        readBinding(spec.evidence.audioAudit, {
          sha256: spec.evidence.audioAuditSha256,
        }),
        readBinding(spec.evidence.prebindingFrameDomainDisposition, {
          sha256: spec.evidence.prebindingFrameDomainDispositionSha256,
        }),
        WAVE3_SAFE_PREFIX_BOUNDARIES.has(animationId)
          ? readBinding(spec.evidence.boundaryScriptInventory, {
              sha256: spec.evidence.boundaryScriptInventorySha256,
            })
          : Promise.resolve(null),
        WAVE3_SAFE_PREFIX_BOUNDARIES.has(animationId)
          ? readBinding(spec.evidence.swfmillStructure, {
              sha256: spec.evidence.swfmillStructureSha256,
            })
          : Promise.resolve(null),
      ]);
      validateAdapterAuditEvidence(
        safeAdapterCompatibilitySpec(spec),
        JSON.parse(prebindingScenarioInventory.contents),
        JSON.parse(audioAudit.contents),
      );
      const disposition = JSON.parse(
        prebindingFrameDomainDisposition.contents,
      );
      const safePrefixBoundary = validateWave3SafePrefixBoundary(
        spec,
        JSON.parse(prebindingScenarioInventory.contents),
        boundaryScriptInventory
          ? JSON.parse(boundaryScriptInventory.contents)
          : null,
      );
      if (safePrefixBoundary) {
        invariant(
          swfmillStructure?.sha256 ===
            spec.evidence.swfmillStructureSha256,
          `${animationId}: swfmill boundary evidence drifted`,
        );
      }
      const targetTimeline = disposition.timelines?.find((timeline) =>
        timeline.timelineId === spec.timeline.local.timelineId);
      invariant(
        targetTimeline?.disposition ===
          spec.runtimeContract.prebindingTargetFrameDomainDisposition,
        `${animationId}: immutable antecedent target disposition differs from the specification`,
      );
      invariant(
        disposition.status ===
          "structurally-enumerated-dispositions-unresolved" &&
        disposition.summary?.dispositionCounts?.unresolved > 0,
      `${animationId}: immutable antecedent must retain unresolved timelines`);
      const freshExport = await exportCanvas({
        ffdec: ffdecTool,
        spec,
        temporaryRoot,
      });
      const built = buildSafeRuntime({
        helperSource: freshExport.helper.toString("utf8"),
        framesHtml: freshExport.frames.toString("utf8"),
        spec: safeAdapterCompatibilitySpec(spec),
      });
      const runtimeBytes = Buffer.from(built.runtime);
      const browserQa = {
        ...(await runBrowserSweep(browser, built.runtime, spec)),
        browser: `Chromium ${browserVersion}`,
      };
      const manifest = buildManifest({
        antecedentFrameDomainDispositionStatus: disposition.status,
        antecedentTargetFrameDomainDisposition: targetTimeline.disposition,
        browserQa,
        built,
        generatorBinding,
        runtimeBytes,
        safeAdapterBinding,
        safePrefixBoundary,
        spec,
        specBinding,
      });
      const manifestBytes = Buffer.from(stableJson(manifest));
      const report = buildReport({
        browserQa,
        manifest,
        safePrefixBoundary,
        spec,
        specBinding,
      });
      const reportBytes = Buffer.from(stableJson(report));
      await Promise.all([
        emit(spec.output.script, runtimeBytes, check),
        emit(spec.output.manifest, manifestBytes, check),
        emit(spec.output.report, reportBytes, check),
      ]);
      results.push({
        animationId,
        check,
        sourceSwf: withoutContents(sourceSwf),
        sourceFla: sourceFla
          ? {
              pairedFlaStatus: "present",
              ...withoutContents(sourceFla),
              authoringAuditEstablished: false,
            }
          : sourceFlaEvidence(spec),
        associatedAudio: {
          kind: associatedAudioKind(spec),
          ...withoutContents(associatedAudio),
        },
        runtime: {
          path: spec.output.script,
          bytes: runtimeBytes.length,
          sha256: sha256(runtimeBytes),
        },
        manifest: {
          path: spec.output.manifest,
          bytes: manifestBytes.length,
          sha256: sha256(manifestBytes),
        },
        report: {
          path: spec.output.report,
          bytes: reportBytes.length,
          sha256: sha256(reportBytes),
        },
        frameDomain: spec.timeline.local.timelineId,
        renderedFrameCount: browserQa.renderedFrameCount,
        acceptanceEffects: ACCEPTANCE_EFFECTS,
        strictAcceptanceEffect: "none",
      });
    }
  } finally {
    await browser.close();
    await rm(temporaryRoot, {recursive: true, force: true});
  }
  const [completionAfter, releaseAfter, generatorAfter, safeAdapterAfter] =
    await Promise.all([
      readBinding(COMPLETION_LEDGER),
      readBinding(LESSON_RELEASE_LEDGER),
      readBinding(GENERATOR_PATH),
      readBinding(SAFE_ADAPTER_PATH),
    ]);
  for (const [label, before, after] of [
    ["completion ledger", completionBefore, completionAfter],
    ["lesson release ledger", releaseBefore, releaseAfter],
    ["G5 generator", generatorBinding, generatorAfter],
    ["safe adapter generator", safeAdapterBinding, safeAdapterAfter],
  ]) {
    invariant(before.bytes === after.bytes && before.sha256 === after.sha256,
      `${label} changed during candidate generation`);
  }
  return {
    schemaVersion: 1,
    operation: check ? "check" : "build",
    ffdec: ffdecTool.version,
    memberCount: results.length,
    results,
    strictAcceptanceEffect: "none",
  };
}

function help() {
  return `Usage: node ${GENERATOR_PATH} [options]\n\n` +
    "Options:\n" +
    "  --id <animation-id>  Build one allowlisted candidate (repeatable)\n" +
    "  --check              Rebuild and verify checked-in outputs\n" +
    "  --ffdec <command>    FFDec launcher (default: ffdec)\n" +
    "  -h, --help           Show this help\n";
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(help());
    return;
  }
  process.stdout.write(stableJson(
    await buildG5L4SourceStaticCandidates(options),
  ));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main();
}
