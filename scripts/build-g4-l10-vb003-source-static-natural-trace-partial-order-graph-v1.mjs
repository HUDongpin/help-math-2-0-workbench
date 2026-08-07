#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, lstat, readFile, realpath, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(scriptPath), "..");
export const REPORT_RELATIVE =
  "reports/g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1.json";
const GENERATOR_RELATIVE =
  "scripts/build-g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1.mjs";

const ANIMATION_ID = "course-g04-l10-vb-003";
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const SOURCE_SWF_SHA256 =
  "96a0c6c9cd7f5813d06e382bcb9dc2b81a0c0127a9865222dea1abba96a8d93d";
const SPANISH_MP3_SHA256 =
  "491873156323b693212856ce2d3bec9d0e43aac2851f547489ae9346931bff03";
const HOST_SCRIPT_BUNDLE_SHA256 =
  "1bb411fb194d87c163f6f1777f8701219f30f3d58db1b39c4add2e6ed76f9f90";

const FIXED_INPUTS = Object.freeze({
  hostEntryAntecedent: Object.freeze({
    path: "reports/g4-l10-vb003-host-entry-antecedent.json",
    bytes: 38497,
    sha256: "9c64d146c8560551beac47fd493c0a9a35135e3d4dc756363f3ac643525c595d",
    mode: "0644",
  }),
  languageAudioTechnicalBinding: Object.freeze({
    path: "migrations/course-g04-l10-vb-003/audit/language-audio-technical-binding.json",
    bytes: 17024,
    sha256: "ac87d1db72a799b8ec58a451051dc7d1e9cfe3d104c1722058b36769dc44081e",
    mode: "0644",
  }),
  baselineAcquisitionGapMatrix: Object.freeze({
    path: "reports/g4-l10-vb003-original-runtime-baseline-acquisition-gap-matrix-v1.json",
    bytes: 16324,
    sha256: "9bfa425bbc79feec945985358aa79d60bc9d2565a6571b44f55eee14443ce603",
    mode: "0444",
  }),
  targetScenarioInventory: Object.freeze({
    path: "migrations/course-g04-l10-vb-003/audit/scenario-inventory.json",
    bytes: 134836,
    sha256: "55a149952185c0f45e5843f6018288f7036269807cca1264e41905038a08b44a",
    mode: "0644",
  }),
  latestSecurityBatchFailure: Object.freeze({
    path: "reports/g4-l10-native-helper-v2-14-independent-review-batch-ab155b63-failed-v1.json",
    bytes: 8621,
    sha256: "63b168992ad40ed40348f9f0a299bfb78b271ccdab998b91ab0f08b5d4f15bbc",
    mode: "0444",
  }),
});

const AUTHORITY_EFFECT_KEYS = Object.freeze([
  "securityReviewAcceptance",
  "productionHelperImplementation",
  "productionHelperTesting",
  "protectedInstallation",
  "helperExecution",
  "originalRuntimeLaunch",
  "originalRuntimeEvidence",
  "naturalTraceRequirementAdoption",
  "captureKitCreation",
  "baselineAdoption",
  "specificationAdoption",
  "rendererImplementation",
  "behaviorAcceptance",
  "visualRmseAcceptance",
  "audioAcceptance",
  "humanVisualAcceptance",
  "ownerAcceptance",
  "strictCompletion",
  "wholeLessonIntegration",
  "wholeCourseIntegration",
  "sourcePromotion",
  "release",
  "publication",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function compareText(left, right) {
  return Buffer.compare(Buffer.from(String(left)), Buffer.from(String(right)));
}

function modeString(info) {
  const mode = typeof info.mode === "bigint" ? info.mode : BigInt(info.mode);
  return Number(mode & 0o777n).toString(8).padStart(4, "0");
}

function statIdentity(info) {
  return [info.dev, info.ino, info.mode, info.nlink, info.uid, info.gid,
    info.size, info.mtimeNs, info.ctimeNs].map(String).join(":");
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".."
    && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function canonicalRoot(projectRoot) {
  const lexical = path.resolve(projectRoot);
  const info = await lstat(lexical);
  assert.ok(info.isDirectory() && !info.isSymbolicLink(),
    `Project root must be an ordinary directory: ${lexical}`);
  assert.equal(await realpath(lexical), lexical,
    `Project root resolves through a symlink: ${lexical}`);
  return lexical;
}

function resolveInside(root, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Non-portable path is forbidden: ${relativePath}`);
  const absolute = path.resolve(root, relativePath);
  assert.ok(contained(root, absolute), `Path escapes root: ${relativePath}`);
  return absolute;
}

async function assertOrdinaryAncestors(root, absoluteParent) {
  assert.ok(absoluteParent === root || contained(root, absoluteParent));
  const relative = path.relative(root, absoluteParent);
  let cursor = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const info = await lstat(cursor);
    assert.ok(info.isDirectory() && !info.isSymbolicLink(),
      `Path ancestor must be an ordinary directory: ${cursor}`);
    assert.equal(await realpath(cursor), cursor,
      `Path ancestor resolves through a symlink: ${cursor}`);
  }
}

async function stableRead(root, expected) {
  const absolute = resolveInside(root, expected.path);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `Input must be an ordinary non-symlink file: ${expected.path}`);
  assert.equal(await realpath(absolute), absolute,
    `Input resolves through a symlink: ${expected.path}`);
  assert.equal(before.nlink, 1n, `Input must have one hard link: ${expected.path}`);
  const bytes = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `Input changed while read: ${expected.path}`);
  const record = {
    path: expected.path,
    bytes,
    byteCount: bytes.length,
    sha256: sha256(bytes),
    mode: modeString(before),
  };
  if (expected.bytes !== undefined) assert.equal(record.byteCount,
    expected.bytes, `Input byte count drifted: ${expected.path}`);
  if (expected.sha256) assert.equal(record.sha256, expected.sha256,
    `Input SHA-256 drifted: ${expected.path}`);
  if (expected.mode) assert.equal(record.mode, expected.mode,
    `Input mode drifted: ${expected.path}`);
  return record;
}

async function assertAbsent(root, relativePath) {
  const absolute = resolveInside(root, relativePath);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  try {
    await lstat(absolute);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  assert.fail(`Target must be absent: ${relativePath}`);
}

function binding(record) {
  return {path: record.path, bytes: record.byteCount, sha256: record.sha256,
    mode: record.mode};
}

function parseJson(record) {
  return JSON.parse(record.bytes.toString("utf8"));
}

function exactSet(rows, fields, encoding) {
  const encodedRows = rows.map((row) => fields.map((field) =>
    row[field] === null || row[field] === undefined ? "" : String(row[field]))
  .join("\t")).sort(compareText);
  assert.equal(new Set(encodedRows).size, encodedRows.length,
    `Exact-set rows are duplicated for ${encoding}`);
  return {
    count: encodedRows.length,
    sha256: sha256(Buffer.from(encodedRows.map((row) => `${row}\n`).join(""),
      "utf8")),
    encoding,
  };
}

function requireOne(rows, predicate, label) {
  const matches = rows.filter(predicate);
  assert.equal(matches.length, 1, `${label}: expected exactly one row`);
  return matches[0];
}

function makeNode(id, nodeClass, domain, position, sourceIdentity, sourceRef,
  extra = {}) {
  return {
    id,
    nodeClass,
    domain,
    position,
    sourceIdentity,
    sourceRef,
    sourceStaticEstablished: true,
    runtimeObserved: false,
    ...extra,
  };
}

function makeStaticEdge(id, from, to, relationClass, sourceRef,
  extra = {}) {
  return {
    id,
    from,
    to,
    relationClass,
    sourceRef,
    sourceStaticEstablished: true,
    runtimeCausalityEstablished: false,
    ...extra,
  };
}

function makeCandidateEdge(id, from, to, relationClass, reason) {
  return {
    id,
    from,
    to,
    relationClass,
    reason,
    candidateOnly: true,
    sourceStaticEstablished: false,
    runtimeCausalityEstablished: false,
    formalTraceEdge: false,
  };
}

export async function buildGraph(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const fixedRecords = Object.fromEntries(await Promise.all(
    Object.entries(FIXED_INPUTS).map(async ([key, expected]) =>
      [key, await stableRead(root, expected)]),
  ));
  const generatorRecord = await stableRead(root, {path: GENERATOR_RELATIVE});
  const host = parseJson(fixedRecords.hostEntryAntecedent);
  const audio = parseJson(fixedRecords.languageAudioTechnicalBinding);
  const gap = parseJson(fixedRecords.baselineAcquisitionGapMatrix);
  const scenario = parseJson(fixedRecords.targetScenarioInventory);
  const security = parseJson(fixedRecords.latestSecurityBatchFailure);

  assert.equal(host.status,
    "source-static-antecedent-materialized-ruffle-probe-not-authoritative");
  assert.equal(host.scope.targetAnimationId, ANIMATION_ID);
  assert.equal(host.scope.originalRuntimeExecuted, false);
  assert.equal(host.exactHostContract.target.childAnimationFrameDomain.timelineId,
    "sprite-120");
  assert.equal(host.exactHostContract.target.childAnimationFrameDomain.frameCount,
    203);
  assert.equal(host.exactHostContract.target.rootFrameCount, 10);
  assert.equal(host.exactHostContract.target.fps, 12);
  assert.deepEqual(host.exactHostContract.target.stage, {height: 600, width: 800});
  const targetPrefix = requireOne(host.exactHostContract.targetNaturalPrefix,
    (row) => row.target === true, "host natural-prefix target");
  assert.deepEqual(targetPrefix, {
    activeCourseXmlPage: true,
    entryKind: "DefineButton2_339-release-doPlayNextMovie",
    nextPressCount: 7,
    order: 8,
    sourcePath: "VB/L10VB03.swf",
    target: true,
  });
  assert.equal(host.traceSpecificationBoundary.en.orderedStepCount, 0);
  assert.equal(host.traceSpecificationBoundary.es.orderedStepCount, 0);
  assert.ok(Object.values(host.authority).every((value) =>
    value === false || value === "none" || value === true));
  assert.equal(host.authority.authoritativeOriginalRuntime, false);
  assert.equal(host.authority.originalRuntimeNaturalTrace, false);

  assert.equal(audio.status,
    "source-static-candidate-and-obligation-binding-runtime-and-listening-unresolved");
  assert.equal(audio.animationId, ANIMATION_ID);
  assert.equal(audio.releaseId, RELEASE_ID);
  assert.deepEqual(audio.summary, {
    cueCandidateCount: 2,
    languageObligationCount: 2,
    hostAudioControlObligationCount: 2,
    interactionSynchronizationObligationCount: 3,
    adoptedCueCount: 0,
    spokenLanguageEstablishedCueCount: 0,
    runtimeReachabilityEstablishedCueCount: 0,
    acceptedCueCount: 0,
    strictAcceptanceEffect: "none",
  });
  assert.ok(Object.values(audio.authorityBoundary).every((value) => value === false));
  assert.ok(Object.values(audio.acceptanceEffects).every((value) => value === false));

  assert.equal(gap.status,
    "ROOT_VISUAL_KITS_CURRENT_NATURAL_TRACE_AUDIO_INTERACTION_ACQUISITIONS_ABSENT");
  assert.equal(gap.decision,
    "DO_NOT_TREAT_TWO_ROOT_KITS_AS_COMPLETE_VB003_BASELINE_DO_NOT_LAUNCH");
  assert.deepEqual(gap.scope.sourceStaticObligationAtomSet, {
    count: 10,
    sha256: "19c1b88dc34b6623de13964d145a3238f5ad5ff0264bff1d8b730338812595b3",
    encoding:
      "sorted-id-tab-class-tab-language-tab-sourceIdentity-tab-controlIdentity-tab-evidenceMode-newline-v1",
  });
  assert.equal(gap.naturalTraceSpecificationBoundary.orderedNaturalTraceStepsCreated,
    0);
  assert.equal(gap.naturalTraceSpecificationBoundary.traceSpecsCreated, 0);
  assert.equal(gap.naturalTraceSpecificationBoundary.captureKitsCreated, 0);

  assert.equal(scenario.animationId, ANIMATION_ID);
  assert.equal(scenario.source.swfSha256, SOURCE_SWF_SHA256);
  assert.deepEqual(scenario.authoritativeRuntimeEvidence, []);
  const rootTimeline = requireOne(scenario.timelineInventory,
    ({timelineId}) => timelineId === "root", "root timeline");
  const spriteTimeline = requireOne(scenario.timelineInventory,
    ({timelineId}) => timelineId === "sprite-120", "sprite-120 timeline");
  assert.equal(rootTimeline.frameCount, 10);
  assert.equal(spriteTimeline.frameCount, 203);
  const spritePlacement = requireOne(rootTimeline.namedPlacements,
    ({objectId, name, frame}) => objectId === "120"
      && name === "animation" && frame === 6, "sprite-120 root placement");
  assert.equal(spritePlacement.depth, "4");
  const rootFrame1Script = requireOne(scenario.interactions.nonEventScripts,
    ({script}) => script === "frame_1/DoAction.as", "root frame-1 script");
  const rootFrame6Script = requireOne(scenario.interactions.nonEventScripts,
    ({script}) => script === "frame_6/DoAction.as", "root frame-6 script");
  const spriteStopScript = requireOne(scenario.interactions.nonEventScripts,
    ({script}) => script === "DefineSprite_120/frame_203/DoAction.as",
    "sprite-120 frame-203 script");
  assert.equal(rootFrame1Script.bodySha256,
    "a5082f87ce78b956c1437a6752536a29d6ab81602f2eef0cdc2ea4053c4283e3");
  assert.equal(rootFrame6Script.bodySha256,
    "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db");
  assert.equal(spriteStopScript.bodySha256, rootFrame6Script.bodySha256);
  assert.deepEqual(scenario.interactions.replayAndTerminal.replayCandidates, []);

  assert.equal(security.status,
    "FAILED_ALL_THREE_INVALIDATED_NONREUSABLE_NO_IMPLEMENTATION_AUTHORITY");
  assert.equal(security.batch.hmg4rb4,
    "ab155b63e1ffd8bdf588b0e5b69072e42542dabe99c936adbc1ad8caff289e0a");
  assert.equal(security.batch.reusable, false);
  assert.equal(security.batchResult.specReviewQualified, false);
  assert.equal(security.batchResult.productionHelperImplementationEligible,
    false);
  assert.ok(Object.values(security.authorityEffects).every((value) =>
    value === false));

  const cueById = new Map(audio.cueCandidates.map((cue) =>
    [cue.cueCandidateId, cue]));
  const embeddedCue = cueById.get(`${ANIMATION_ID}:embedded-stream-0001`);
  const externalCue = cueById.get(`${ANIMATION_ID}:catalog-audio-01`);
  assert.equal(embeddedCue.source.sha256, SOURCE_SWF_SHA256);
  assert.equal(embeddedCue.localFrameDomainId, "sprite-120");
  assert.equal(embeddedCue.headFrame, 1);
  assert.equal(embeddedCue.firstBlockFrame, 4);
  assert.equal(embeddedCue.lastBlockFrame, 203);
  assert.equal(embeddedCue.blockCount, 200);
  assert.equal(embeddedCue.durationMs, 16640);
  assert.equal(embeddedCue.spokenLanguage, null);
  assert.equal(embeddedCue.runtimeCueTime, null);
  assert.equal(externalCue.source.sha256, SPANISH_MP3_SHA256);
  assert.equal(externalCue.routingLanguageCandidate, "es");
  assert.equal(externalCue.durationMs, 15144);
  assert.equal(externalCue.spokenLanguage, null);
  assert.equal(externalCue.runtimeCueTime, null);

  const controlByObject = new Map(audio.hostAudioControlObligations.map((row) =>
    [row.buttonObjectId, row]));
  const sa = controlByObject.get("225");
  const ea = controlByObject.get("219");
  assert.equal(sa.call, "_root.doPlaySpanishAudio");
  assert.equal(sa.bodySha256,
    "3a1f4f0b8803ee1c00cd733ff84fbb275949c35d2ab452f79511d06416113a29");
  assert.deepEqual(sa.sourceStaticOperationSequence.map(({line}) => line),
    [5021, 5022, 5023, 5028, 5029, 5031, 5049]);
  assert.equal(ea.call, "_root.doStopSpanishAudio");
  assert.equal(ea.bodySha256,
    "1d90ab74a6e93ad4cb34865914dc0c800c817fd773705a015d8580bc271c5bc2");
  assert.deepEqual(ea.sourceStaticOperationSequence.map(({line}) => line),
    [5056, 5057, 5059]);

  const interactionByObject = new Map(
    audio.interactionSynchronizationObligations.map((row) =>
      [row.buttonObjectId, row]));
  const scenarioHandlerByObject = new Map(scenario.interactions.handlers.map(
    (row) => [row.scope.objectId, row]));
  const expectedInteractions = [
    ["10", 3, "Unit of measurement",
      "5dbc3b9a373c3a4cd656383122754689b0551dbe0e8b1c41124c410776bdf422",
      5],
    ["11", 3, "Quantity",
      "aee89262f1ae5afa3fdcc5dee482f4589794029c0920b203b46cc8be2ecc7ae3",
      13],
    ["15", 51, "Length",
      "d4481ebffa6b83402415f08234e1113d51a51c924f3fb97529b82058888bcf14",
      21],
  ];
  for (const [objectId, localFrame, keyAttribute, bodySha, stopLine] of
    expectedInteractions) {
    const obligation = interactionByObject.get(objectId);
    const handler = scenarioHandlerByObject.get(objectId);
    assert.equal(obligation.localFrame, localFrame);
    assert.equal(obligation.keyAttributeCandidate, keyAttribute);
    assert.equal(obligation.bodySha256, bodySha);
    assert.equal(handler.bodySha256, bodySha);
    assert.equal(handler.hitTarget.placements[0].frame, localFrame);
    assert.ok(handler.signals.transitions.some((transition) =>
      transition.target === "_root.animation_mc.animation.stop"
      && transition.evidence.line === stopLine));
  }

  const hostStatic = host.exactHostContract.staticEvidence;
  assert.equal(hostStatic.nextControl.line, 432);
  assert.equal(hostStatic.nextFunction.line, 3469);
  assert.equal(hostStatic.shellLoad.line, 3848);
  assert.deepEqual(hostStatic.hostPreloaderCompletion.map(({line}) => line),
    [1496, 1497, 1498]);
  assert.deepEqual(host.exactHostContract.hostPreloaderFrameDomain.labels,
    [{frame: 1, label: "inactive"}, {frame: 11, label: "jump_check"},
      {frame: 20, label: "done"}]);

  const nodes = [
    makeNode("host:next-control-339-release", "event-handler", "host-root",
      "frame49:button339:release", HOST_SCRIPT_BUNDLE_SHA256,
      "host.staticEvidence.nextControl", {call: "_root.doPlayNextMovie"}),
    makeNode("host:do-play-next-movie", "function", "host-root",
      "frame35:line3469", HOST_SCRIPT_BUNDLE_SHA256,
      "host.staticEvidence.nextFunction"),
    makeNode("host:playlist-vb003-order8", "playlist-selection", "host-root",
      "order8:nextPressCount7", SOURCE_SWF_SHA256,
      "host.exactHostContract.targetNaturalPrefix", {sourcePath: targetPrefix.sourcePath}),
    makeNode("host:load-movie-selected-path", "load-operation", "host-root",
      "frame35:line3848", HOST_SCRIPT_BUNDLE_SHA256,
      "host.staticEvidence.shellLoad"),
    makeNode("target:root1-preloader-jump-check", "actionscript-statement",
      "target-root", "frame1:line29", rootFrame1Script.bodySha256,
      "scenario.interactions.nonEventScripts.frame1", {call: "_level0.InternalPreloader.gotoAndPlay(\"jump_check\")"}),
    makeNode("target:root1-stop", "actionscript-statement", "target-root",
      "frame1:line30", rootFrame1Script.bodySha256,
      "scenario.interactions.nonEventScripts.frame1", {call: "stop"}),
    makeNode("host:preloader-jump-check-frame11", "timeline-label",
      "host-sprite-184", "frame11:jump_check", HOST_SCRIPT_BUNDLE_SHA256,
      "host.exactHostContract.hostPreloaderFrameDomain"),
    makeNode("host:preloader-done-frame20", "timeline-label",
      "host-sprite-184", "frame20:done", HOST_SCRIPT_BUNDLE_SHA256,
      "host.exactHostContract.hostPreloaderFrameDomain"),
    makeNode("host:preloader-goto-child-begin", "actionscript-statement",
      "host-sprite-184", "frame20:line1496", HOST_SCRIPT_BUNDLE_SHA256,
      "host.staticEvidence.hostPreloaderCompletion[0]"),
    makeNode("host:preloader-reset-inactive", "actionscript-statement",
      "host-sprite-184", "frame20:line1497", HOST_SCRIPT_BUNDLE_SHA256,
      "host.staticEvidence.hostPreloaderCompletion[1]"),
    makeNode("host:preloader-check-spanish-audio", "actionscript-statement",
      "host-sprite-184", "frame20:line1498", HOST_SCRIPT_BUNDLE_SHA256,
      "host.staticEvidence.hostPreloaderCompletion[2]"),
    makeNode("target:root6-begin-stop", "timeline-state", "target-root",
      "frame6:begin:line33", rootFrame6Script.bodySha256,
      "scenario.timelineInventory.root", {frameLabel: "begin", stopStatement: true}),
    makeNode("target:root6-place-sprite120", "placement", "target-root",
      "frame6:depth4:instance-animation", SOURCE_SWF_SHA256,
      "scenario.timelineInventory.root.namedPlacements", {objectId: "120"}),
    makeNode("sprite120:stream-head-frame1", "sound-stream-head",
      "sprite-120", "localFrame1", SOURCE_SWF_SHA256,
      "audio.cueCandidates.embedded", {language: "und", durationMs: 16640}),
    makeNode("sprite120:stream-first-block-frame4", "sound-stream-block",
      "sprite-120", "localFrame4:first", SOURCE_SWF_SHA256,
      "audio.cueCandidates.embedded"),
    makeNode("sprite120:stream-last-block-frame203", "sound-stream-block",
      "sprite-120", "localFrame203:last", SOURCE_SWF_SHA256,
      "audio.cueCandidates.embedded", {blockCount: 200}),
    makeNode("sprite120:terminal-stop-frame203", "actionscript-statement",
      "sprite-120", "localFrame203:line26", spriteStopScript.bodySha256,
      "scenario.interactions.nonEventScripts.sprite120", {call: "stop"}),
    ...expectedInteractions.flatMap(([objectId, localFrame, keyAttribute,
      bodySha, stopLine]) => [
      makeNode(`interaction:button${objectId}-release`, "event-handler",
        "sprite-120", `localFrame${localFrame}:button${objectId}:release`,
        bodySha, `scenario.interactions.handlers.button${objectId}`,
        {keyAttribute}),
      makeNode(`interaction:button${objectId}-stop`, "actionscript-statement",
        "sprite-120", `button${objectId}:line${stopLine}`, bodySha,
        `scenario.interactions.handlers.button${objectId}.signals.transitions`,
        {call: "_root.animation_mc.animation.stop"}),
    ]),
    makeNode("es:button225-sa-release", "event-handler", "host-root",
      "frame49:button225:release", sa.bodySha256,
      "audio.hostAudioControlObligations.button225", {call: sa.call}),
    makeNode("es:child-stop-line5021", "actionscript-statement", "host-root",
      "frame35:line5021", HOST_SCRIPT_BUNDLE_SHA256,
      "audio.hostAudioControlObligations.button225.sequence"),
    makeNode("es:path-resolve-line5022", "actionscript-statement", "host-root",
      "frame35:line5022", HOST_SCRIPT_BUNDLE_SHA256,
      "audio.hostAudioControlObligations.button225.sequence"),
    makeNode("es:load-sound-line5023", "actionscript-statement", "host-root",
      "frame35:line5023", HOST_SCRIPT_BUNDLE_SHA256,
      "audio.hostAudioControlObligations.button225.sequence"),
    makeNode("es:sound-start-line5049", "actionscript-statement", "host-root",
      "frame35:line5049", HOST_SCRIPT_BUNDLE_SHA256,
      "audio.hostAudioControlObligations.button225.sequence"),
    makeNode("es:external-mp3-l10vb03", "external-audio-source", "host-audio",
      "SA/L10VB03.mp3", SPANISH_MP3_SHA256,
      "audio.cueCandidates.external", {routingLanguageCandidate: "es", durationMs: 15144}),
    makeNode("es:completion-stop-line5028", "callback-statement", "host-root",
      "onSoundComplete:line5028", HOST_SCRIPT_BUNDLE_SHA256,
      "audio.hostAudioControlObligations.button225.sequence"),
    makeNode("es:completion-guard-line5029", "conditional", "host-root",
      "onSoundComplete:line5029", HOST_SCRIPT_BUNDLE_SHA256,
      "audio.hostAudioControlObligations.button225.sequence"),
    makeNode("es:completion-resume-line5031", "conditional-statement",
      "host-root", "onSoundComplete:line5031", HOST_SCRIPT_BUNDLE_SHA256,
      "audio.hostAudioControlObligations.button225.sequence"),
    makeNode("es:button219-ea-release", "event-handler", "host-root",
      "frame49:button219:release", ea.bodySha256,
      "audio.hostAudioControlObligations.button219", {call: ea.call}),
    makeNode("es:manual-stop-line5056", "actionscript-statement", "host-root",
      "frame35:line5056", HOST_SCRIPT_BUNDLE_SHA256,
      "audio.hostAudioControlObligations.button219.sequence"),
    makeNode("es:manual-guard-line5057", "conditional", "host-root",
      "frame35:line5057", HOST_SCRIPT_BUNDLE_SHA256,
      "audio.hostAudioControlObligations.button219.sequence"),
    makeNode("es:manual-resume-line5059", "conditional-statement", "host-root",
      "frame35:line5059", HOST_SCRIPT_BUNDLE_SHA256,
      "audio.hostAudioControlObligations.button219.sequence"),
    makeNode("unresolved:replay-target", "source-static-negative-finding",
      "target-runtime", "no-exported-unambiguous-handler", SOURCE_SWF_SHA256,
      "scenario.unknowns.replay-target", {replayCandidateCount: 0}),
  ].sort((left, right) => compareText(left.id, right.id));

  const staticEdges = [
    makeStaticEdge("S001", "host:next-control-339-release",
      "host:do-play-next-movie", "event-handler-call-declaration",
      "host.staticEvidence.nextControl"),
    makeStaticEdge("S002", "host:do-play-next-movie",
      "host:playlist-vb003-order8", "playlist-selection-rule",
      "host.exactHostContract.targetNaturalPrefix"),
    makeStaticEdge("S003", "host:playlist-vb003-order8",
      "host:load-movie-selected-path", "selected-path-dataflow",
      "host.staticEvidence.shellLoad"),
    makeStaticEdge("S004", "target:root1-preloader-jump-check",
      "target:root1-stop", "source-lexical-order",
      "scenario.interactions.nonEventScripts.frame1"),
    makeStaticEdge("S005", "target:root1-preloader-jump-check",
      "host:preloader-jump-check-frame11", "static-label-target",
      "host.staticEvidence.targetPreloaderSignal"),
    makeStaticEdge("S006", "host:preloader-jump-check-frame11",
      "host:preloader-done-frame20", "local-frame-order-only",
      "host.exactHostContract.hostPreloaderFrameDomain"),
    makeStaticEdge("S007", "host:preloader-done-frame20",
      "host:preloader-goto-child-begin", "coframe-action-membership",
      "host.staticEvidence.hostPreloaderCompletion[0]"),
    makeStaticEdge("S008", "host:preloader-goto-child-begin",
      "host:preloader-reset-inactive", "source-lexical-order",
      "host.staticEvidence.hostPreloaderCompletion"),
    makeStaticEdge("S009", "host:preloader-reset-inactive",
      "host:preloader-check-spanish-audio", "source-lexical-order",
      "host.staticEvidence.hostPreloaderCompletion"),
    makeStaticEdge("S010", "host:preloader-goto-child-begin",
      "target:root6-begin-stop", "static-label-target",
      "host.staticEvidence.hostPreloaderCompletion[0]"),
    makeStaticEdge("S011", "target:root6-begin-stop",
      "target:root6-place-sprite120", "coframe-placement-membership",
      "scenario.timelineInventory.root"),
    makeStaticEdge("S012", "target:root6-place-sprite120",
      "sprite120:stream-head-frame1", "structural-child-entry-relation",
      "audio.cueCandidates.embedded.rootPlacementCandidate"),
    makeStaticEdge("S013", "sprite120:stream-head-frame1",
      "sprite120:stream-first-block-frame4", "local-frame-order-only",
      "audio.cueCandidates.embedded"),
    makeStaticEdge("S014", "sprite120:stream-first-block-frame4",
      "sprite120:stream-last-block-frame203", "local-frame-order-only",
      "audio.cueCandidates.embedded"),
    makeStaticEdge("S015", "sprite120:stream-last-block-frame203",
      "sprite120:terminal-stop-frame203", "coframe-action-membership",
      "scenario.interactions.nonEventScripts.sprite120"),
    ...["10", "11", "15"].map((objectId, index) => makeStaticEdge(
      `S${String(16 + index).padStart(3, "0")}`,
      `interaction:button${objectId}-release`,
      `interaction:button${objectId}-stop`,
      "event-handler-source-operation",
      `scenario.interactions.handlers.button${objectId}`)),
    makeStaticEdge("S019", "es:button225-sa-release",
      "es:child-stop-line5021", "event-handler-call-body-entry",
      "audio.hostAudioControlObligations.button225"),
    makeStaticEdge("S020", "es:child-stop-line5021",
      "es:path-resolve-line5022", "source-lexical-order",
      "audio.hostAudioControlObligations.button225.sequence"),
    makeStaticEdge("S021", "es:path-resolve-line5022",
      "es:load-sound-line5023", "source-lexical-order",
      "audio.hostAudioControlObligations.button225.sequence"),
    makeStaticEdge("S022", "es:load-sound-line5023",
      "es:sound-start-line5049", "outer-handler-source-order",
      "audio.hostAudioControlObligations.button225.sequence"),
    makeStaticEdge("S023", "es:load-sound-line5023",
      "es:external-mp3-l10vb03", "resolved-source-path-binding",
      "audio.cueCandidates.external.hostDependency"),
    makeStaticEdge("S024", "es:completion-stop-line5028",
      "es:completion-guard-line5029", "callback-source-lexical-order",
      "audio.hostAudioControlObligations.button225.sequence"),
    makeStaticEdge("S025", "es:completion-guard-line5029",
      "es:completion-resume-line5031", "conditional-source-branch",
      "audio.hostAudioControlObligations.button225.sequence"),
    makeStaticEdge("S026", "es:button219-ea-release",
      "es:manual-stop-line5056", "event-handler-call-body-entry",
      "audio.hostAudioControlObligations.button219"),
    makeStaticEdge("S027", "es:manual-stop-line5056",
      "es:manual-guard-line5057", "source-lexical-order",
      "audio.hostAudioControlObligations.button219.sequence"),
    makeStaticEdge("S028", "es:manual-guard-line5057",
      "es:manual-resume-line5059", "conditional-source-branch",
      "audio.hostAudioControlObligations.button219.sequence"),
  ].sort((left, right) => compareText(left.id, right.id));

  const candidateEdges = [
    makeCandidateEdge("C001", "host:next-control-339-release",
      "host:playlist-vb003-order8", "seven-release-host-transition",
      "The playlist and seven required Next releases are source-static; no authorized runtime execution proves the transition sequence."),
    makeCandidateEdge("C002", "host:load-movie-selected-path",
      "target:root1-preloader-jump-check", "loaded-child-root-execution",
      "loadMovie source text does not prove successful load or target root execution."),
    makeCandidateEdge("C003", "target:root1-preloader-jump-check",
      "host:preloader-jump-check-frame11", "cross-movie-preloader-causality",
      "The call target is statically named; host reception and execution are unobserved."),
    makeCandidateEdge("C004", "host:preloader-jump-check-frame11",
      "host:preloader-done-frame20", "preloader-natural-advance",
      "Local frame order does not establish elapsed-time advance or completion."),
    makeCandidateEdge("C005", "host:preloader-done-frame20",
      "host:preloader-goto-child-begin", "frame-action-execution",
      "Coframe ActionScript membership does not prove the frame was reached or executed."),
    makeCandidateEdge("C006", "host:preloader-goto-child-begin",
      "target:root6-begin-stop", "child-begin-execution",
      "The label mapping is static; authorized runtime entry at root frame 6 is absent."),
    makeCandidateEdge("C007", "target:root6-place-sprite120",
      "sprite120:stream-head-frame1", "nested-runtime-entry",
      "Structural reachability does not prove the nested playhead entered local frame 1."),
    makeCandidateEdge("C008", "sprite120:stream-head-frame1",
      "sprite120:stream-last-block-frame203", "nested-natural-playback",
      "Local frame order and SoundStream blocks do not prove natural playback or timing."),
    makeCandidateEdge("C009", "interaction:button10-release",
      "interaction:button10-stop", "interaction-invocation-and-stream-pause",
      "The release handler exists, but runtime invocation and audio synchronization are unobserved."),
    makeCandidateEdge("C010", "interaction:button11-release",
      "interaction:button11-stop", "interaction-invocation-and-stream-pause",
      "The release handler exists, but runtime invocation and audio synchronization are unobserved."),
    makeCandidateEdge("C011", "interaction:button15-release",
      "interaction:button15-stop", "interaction-invocation-and-stream-pause",
      "The release handler exists, but runtime invocation and audio synchronization are unobserved."),
    makeCandidateEdge("C012", "es:button225-sa-release",
      "es:sound-start-line5049", "SA-release-runtime-causality",
      "Static handler contents do not prove the host control was invoked or sound started."),
    makeCandidateEdge("C013", "es:sound-start-line5049",
      "es:completion-stop-line5028", "onSoundComplete-runtime-callback",
      "Callback source exists, but completion timing and invocation are unobserved."),
    makeCandidateEdge("C014", "es:completion-guard-line5029",
      "es:completion-resume-line5031", "completion-conditional-runtime-resume",
      "The branch source exists; its condition and child resume are not runtime-proven."),
    makeCandidateEdge("C015", "es:sound-start-line5049",
      "es:external-mp3-l10vb03", "external-track-audibility-and-language",
      "Path binding does not prove audible playback, spoken language, or voice."),
    makeCandidateEdge("C016", "es:button219-ea-release",
      "es:manual-stop-line5056", "EA-release-runtime-causality",
      "Static handler contents do not prove manual stop invocation."),
    makeCandidateEdge("C017", "es:manual-guard-line5057",
      "es:manual-resume-line5059", "manual-stop-conditional-runtime-resume",
      "The branch source exists; its condition and child resume are not runtime-proven."),
  ].sort((left, right) => compareText(left.id, right.id));

  const nodeIds = new Set(nodes.map(({id}) => id));
  assert.equal(nodeIds.size, nodes.length);
  for (const edge of [...staticEdges, ...candidateEdges]) {
    assert.ok(nodeIds.has(edge.from), `Edge source node is absent: ${edge.id}`);
    assert.ok(nodeIds.has(edge.to), `Edge target node is absent: ${edge.id}`);
  }

  const unresolvedRuntimeClaims = [
    {id: "U001", category: "host-entry", languages: "en+es",
      claim: "Seven Next releases load VB003 and execute its root frame 1.",
      requiredEvidence: "authorized-original-runtime-natural-trace"},
    {id: "U002", category: "nested-entry", languages: "en+es",
      claim: "Preloader completion executes child begin and enters sprite-120.",
      requiredEvidence: "authorized-original-runtime-natural-trace"},
    {id: "U003", category: "nested-playback", languages: "en+es",
      claim: "sprite-120 naturally advances through all 203 local frames.",
      requiredEvidence: "authorized-original-runtime-natural-trace"},
    {id: "U004", category: "embedded-audio", languages: "en+es",
      claim: "The embedded stream is reachable, audible, and synchronized.",
      requiredEvidence: "authorized-original-runtime-natural-trace-plus-named-human-listening"},
    {id: "U005", category: "spoken-language", languages: "en",
      claim: "The embedded stream contains the required English spoken content and voice.",
      requiredEvidence: "authorized-original-runtime-natural-trace-plus-named-human-listening"},
    {id: "U006", category: "spoken-language", languages: "es",
      claim: "The external MP3 contains the required Spanish spoken content and voice.",
      requiredEvidence: "authorized-original-runtime-natural-trace-plus-named-human-listening"},
    {id: "U007", category: "audio-mix", languages: "es",
      claim: "Spanish playback excludes, replaces, pauses, or mixes the embedded stream as authored.",
      requiredEvidence: "authorized-original-runtime-natural-trace-plus-named-human-listening"},
    {id: "U008", category: "audio-resume", languages: "es",
      claim: "External-track completion and manual stop resume the child under the authored condition.",
      requiredEvidence: "authorized-original-runtime-natural-trace"},
    {id: "U009", category: "interaction-sync", languages: "en+es",
      claim: "All three glossary releases pause and later resume visual and audio state correctly.",
      requiredEvidence: "authorized-original-runtime-natural-trace"},
    {id: "U010", category: "replay-reset", languages: "en+es",
      claim: "Replay resets the complete visual, interaction, language, and audio state vector.",
      requiredEvidence: "authorized-original-runtime-natural-trace"},
  ];

  const candidateBranchSurfaces = [
    ["en-linear-embedded-playthrough", "en", "linear-playthrough",
      ["en:cue:course-g04-l10-vb-003:embedded-stream-0001"]],
    ["en-interaction-unit", "en", "nested-interaction",
      ["both:interaction:10:Unit of measurement"]],
    ["en-interaction-quantity", "en", "nested-interaction",
      ["both:interaction:11:Quantity"]],
    ["en-interaction-length", "en", "nested-interaction",
      ["both:interaction:15:Length"]],
    ["en-replay-reset", "en", "replay-reset", ["en:replay-reset"]],
    ["es-external-complete-resume", "es", "external-completion",
      ["es:cue:course-g04-l10-vb-003:catalog-audio-01",
        "es:cue:course-g04-l10-vb-003:embedded-stream-0001",
        "es:host-control:225:_root.doPlaySpanishAudio"]],
    ["es-external-manual-stop-resume", "es", "external-manual-stop",
      ["es:host-control:219:_root.doStopSpanishAudio"]],
    ["es-interaction-unit", "es", "nested-interaction",
      ["both:interaction:10:Unit of measurement"]],
    ["es-interaction-quantity", "es", "nested-interaction",
      ["both:interaction:11:Quantity"]],
    ["es-interaction-length", "es", "nested-interaction",
      ["both:interaction:15:Length"]],
    ["es-replay-reset", "es", "replay-reset", ["es:replay-reset"]],
  ].map(([id, language, branchClass, obligationAtomIds]) => ({
    id,
    language,
    branchClass,
    obligationAtomIds,
    candidateOnly: true,
    formalRequirementCreated: false,
    orderedSteps: [],
    runtimeObserved: false,
    accepted: false,
  }));

  const obligationIds = new Set(gap.sourceStaticObligationAtoms.map(({id}) => id));
  assert.equal(obligationIds.size, 10);
  for (const branch of candidateBranchSurfaces) {
    for (const id of branch.obligationAtomIds) assert.ok(obligationIds.has(id),
      `Candidate branch references an absent obligation atom: ${id}`);
  }

  const verifiedStaticNodeSet = exactSet(nodes,
    ["id", "nodeClass", "domain", "position", "sourceIdentity"],
    "sorted-id-tab-nodeClass-tab-domain-tab-position-tab-sourceIdentity-newline-v1");
  const verifiedStaticEdgeSet = exactSet(staticEdges,
    ["id", "from", "to", "relationClass"],
    "sorted-id-tab-from-tab-to-tab-relationClass-newline-v1");
  const unresolvedCausalityEdgeSet = exactSet(candidateEdges,
    ["id", "from", "to", "relationClass"],
    "sorted-id-tab-from-tab-to-tab-relationClass-newline-v1");
  const unresolvedRuntimeClaimSet = exactSet(unresolvedRuntimeClaims,
    ["id", "category", "languages", "requiredEvidence"],
    "sorted-id-tab-category-tab-languages-tab-requiredEvidence-newline-v1");
  const candidateBranchSurfaceSet = exactSet(candidateBranchSurfaces,
    ["id", "language", "branchClass"],
    "sorted-id-tab-language-tab-branchClass-newline-v1");

  const authorityEffects = Object.fromEntries(AUTHORITY_EFFECT_KEYS.map((key) =>
    [key, false]));
  const documentWithoutFingerprint = {
    schemaVersion: 1,
    artifactType:
      "g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1",
    status:
      "SOURCE_STATIC_PARTIAL_ORDER_ONLY_RUNTIME_CAUSALITY_AND_TRACE_SCHEDULE_UNRESOLVED",
    decision:
      "DO_NOT_CREATE_FORMAL_NATURAL_TRACE_OR_CAPTURE_KIT_DO_NOT_LAUNCH",
    evidenceClass:
      "acceptance-neutral-source-static-partial-order-analysis-not-runtime-evidence",
    purpose: [
      "Freeze the exact source-static VB003 host-entry, nested-frame, interaction, and bilingual-audio ordering constraints that can be supported without executing a runtime.",
      "Separate source structure and lexical order from every still-unproven runtime causal edge before any formal natural-trace requirement or kit is designed.",
    ],
    scope: {
      releaseId: RELEASE_ID,
      animationId: ANIMATION_ID,
      sourceSwfSha256: SOURCE_SWF_SHA256,
      spanishMp3Sha256: SPANISH_MP3_SHA256,
      languages: ["en", "es"],
      rootFrameCount: 10,
      nestedFrameDomain: {id: "sprite-120", frameCount: 203},
      sourceStaticObligationAtomSet: gap.scope.sourceStaticObligationAtomSet,
      verifiedStaticNodeSet,
      verifiedStaticEdgeSet,
      unresolvedCausalityEdgeSet,
      unresolvedRuntimeClaimSet,
      candidateBranchSurfaceSet,
    },
    generator: binding(generatorRecord),
    fixedEvidenceInputs: Object.fromEntries(Object.entries(fixedRecords).map(
      ([key, record]) => [key, binding(record)])),
    orderingSemantics: {
      sourceStaticEdgesEstablishRuntimeCausality: false,
      localFrameOrderEstablishesWallClockTime: false,
      sourceLexicalOrderEstablishesCallbackTime: false,
      staticLabelTargetEstablishesRuntimeReachability: false,
      structuralChildEntryEstablishesNaturalPlayback: false,
      pathBindingEstablishesAudibilityOrSpokenLanguage: false,
      handlerBodyEstablishesRuntimeInvocation: false,
      negativeReplayFindingEstablishesReplayAbsence: false,
    },
    nodes,
    verifiedStaticEdges: staticEdges,
    unresolvedRuntimeCausalityEdges: candidateEdges,
    unresolvedRuntimeClaims,
    candidateBranchSurfaces,
    formalizationBoundary: {
      graphIsFormalTraceSpecification: false,
      candidateBranchesAreFormalRequirements: false,
      authorizedRuntimeEntryEstablished: false,
      exactOrderedNaturalActionsEstablished: false,
      branchSchedulingEstablished: false,
      replaySchedulingEstablished: false,
      interactionCloseOrResumeSchedulingEstablished: false,
      exactAdditionalKitCount: null,
      exactAdditionalSessionCount: null,
      coverageRequirementsCreated: 0,
      orderedNaturalTraceStepsCreated: 0,
      traceSpecsCreated: 0,
      captureKitsCreated: 0,
      migrationFilesModified: false,
      staticSpecificationApplied: false,
      reviewVerdictPresent: false,
    },
    currentEvidenceState: {
      currentRootVisualKitCount: 2,
      currentNaturalTraceKitCount: 0,
      authoritativeOriginalRuntimeSessions: 0,
      authoritativeOriginalRuntimeFrames: 0,
      namedHumanListeningSessions: 0,
      spokenLanguageEstablishedCueCount: 0,
      runtimeReachabilityEstablishedCueCount: 0,
      synchronizedCueCount: 0,
      acceptedCueCount: 0,
      replayResetEstablished: false,
      vb003BaselineComplete: false,
    },
    currentGateBoundary: {
      latestSecurityBatchHmg4rb4: security.batch.hmg4rb4,
      latestSecurityBatchStatus: security.status,
      latestSecurityBatchReusable: false,
      specReviewQualified: false,
      productionHelperImplementationEligible: false,
      V28OperationalFreeze: false,
      peterHuOperatorActivated: false,
      launchAuthorizedNow: false,
      currentLaunchReceiptCount: 0,
      productionHelperImplemented: false,
      originalRuntimeLaunched: false,
      audioPlayedByThisReport: false,
    },
    implementationBoundary: {
      reportPublicationOnly: true,
      migrationWorkspaceWriteSupported: false,
      formalTraceSpecificationWriteSupported: false,
      captureKitWriteSupported: false,
      helperImplementationSupported: false,
      helperTestingSupported: false,
      helperExecutionSupported: false,
      originalRuntimeLaunchSupported: false,
      baselineAdoptionSupported: false,
      specificationAdoptionSupported: false,
      rendererImplementationSupported: false,
      applySupported: false,
      recoverSupported: false,
      acceptanceSupported: false,
      releaseSupported: false,
      publicationSupported: false,
    },
    supportedCliModes: ["--dry-run", "--write-no-clobber", "--check"],
    writeNoClobberMeaning:
      `publish only ${REPORT_RELATIVE} as a new mode-0444 report; never modify a migration workspace, trace spec, capture kit, source asset, helper, runtime, baseline, specification, renderer, acceptance, promotion, release, or publication artifact`,
    authorityEffects,
    nextPermittedAction:
      "Independently review this source-static graph, then use only reviewed static constraints to plan separately authorized natural-trace requirements. Do not create a formal trace, kit, launch receipt, or runtime session from this report.",
  };
  assert.ok(Object.values(authorityEffects).every((value) => value === false));
  const graphFingerprintSha256 = sha256(Buffer.from(
    canonicalJson(documentWithoutFingerprint), "utf8"));
  const document = {...documentWithoutFingerprint, graphFingerprintSha256};
  const json = `${JSON.stringify(document, null, 2)}\n`;
  return {root, document, json};
}

async function assertInputsCurrent(bundle) {
  const current = await buildGraph(bundle.root);
  assert.equal(current.json, bundle.json,
    "VB003 source-static partial-order graph inputs changed after derivation");
}

export async function checkGraph(bundle, outputRoot = bundle.root) {
  const root = await canonicalRoot(outputRoot);
  await assertInputsCurrent(bundle);
  const expected = Buffer.from(bundle.json, "utf8");
  const observed = await stableRead(root, {
    path: REPORT_RELATIVE,
    bytes: expected.length,
    sha256: sha256(expected),
    mode: "0444",
  });
  assert.deepEqual(observed.bytes, expected,
    "VB003 source-static partial-order graph report bytes drifted");
  return {
    disposition: "checked",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    reportSha256: observed.sha256,
    graphFingerprintSha256: bundle.document.graphFingerprintSha256,
    verifiedStaticNodes: bundle.document.scope.verifiedStaticNodeSet.count,
    verifiedStaticEdges: bundle.document.scope.verifiedStaticEdgeSet.count,
    unresolvedCausalityEdges:
      bundle.document.scope.unresolvedCausalityEdgeSet.count,
    unresolvedRuntimeClaims:
      bundle.document.scope.unresolvedRuntimeClaimSet.count,
    candidateBranchSurfaces:
      bundle.document.scope.candidateBranchSurfaceSet.count,
    formalNaturalTraceRequirements: 0,
    launchAuthorizedNow: false,
    originalRuntimeLaunched: false,
    acceptanceEffect: false,
  };
}

export async function publishGraphNoClobber(bundle, options = {}) {
  const outputRoot = await canonicalRoot(options.outputRoot ?? bundle.root);
  await assertInputsCurrent(bundle);
  const absolute = resolveInside(outputRoot, REPORT_RELATIVE);
  await assertOrdinaryAncestors(outputRoot, path.dirname(absolute));
  await assertAbsent(outputRoot, REPORT_RELATIVE);
  await (options.beforeWrite ?? (async () => {}))();
  await assertInputsCurrent(bundle);
  await writeFile(absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(absolute, 0o444);
  await assertInputsCurrent(bundle);
  return checkGraph(bundle, outputRoot);
}

export function parseArguments(argv) {
  assert.equal(argv.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(argv[0]),
    "Only --dry-run, --write-no-clobber, and --check are supported");
  return argv[0];
}

export async function runCli(argv = process.argv.slice(2),
  projectRoot = PROJECT_ROOT) {
  const mode = parseArguments(argv);
  const bundle = await buildGraph(projectRoot);
  if (mode === "--write-no-clobber") return publishGraphNoClobber(bundle);
  if (mode === "--check") return checkGraph(bundle);
  return {
    disposition: "dry-run",
    status: bundle.document.status,
    decision: bundle.document.decision,
    report: REPORT_RELATIVE,
    graphFingerprintSha256: bundle.document.graphFingerprintSha256,
    verifiedStaticNodes: bundle.document.scope.verifiedStaticNodeSet.count,
    verifiedStaticEdges: bundle.document.scope.verifiedStaticEdgeSet.count,
    unresolvedCausalityEdges:
      bundle.document.scope.unresolvedCausalityEdgeSet.count,
    unresolvedRuntimeClaims:
      bundle.document.scope.unresolvedRuntimeClaimSet.count,
    candidateBranchSurfaces:
      bundle.document.scope.candidateBranchSurfaceSet.count,
    formalNaturalTraceRequirements: 0,
    launchAuthorizedNow: false,
    originalRuntimeLaunched: false,
    acceptanceEffect: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`FAIL-CLOSED: ${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
