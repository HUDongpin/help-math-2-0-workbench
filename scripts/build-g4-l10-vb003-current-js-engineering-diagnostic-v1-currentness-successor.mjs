#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {PNG} from "pngjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const ANIMATION_ID = "course-g04-l10-vb-003";
export const PREDECESSOR_ROOT =
  "output/playwright/g4-l10-vb003-current-js-engineering-diagnostic-v1";
export const PREDECESSOR_MANIFEST = `${PREDECESSOR_ROOT}/capture-manifest.json`;
export const REPORT_JSON =
  "reports/g4-l10-vb003-current-js-engineering-diagnostic-v1-currentness-successor.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-vb003-current-js-engineering-diagnostic-v1-currentness-successor.md";
export const TEST_RELATIVE =
  "scripts/build-g4-l10-vb003-current-js-engineering-diagnostic-v1-currentness-successor.test.mjs";

const PREDECESSOR_IDENTITY = Object.freeze({
  bytes: 218603,
  sha256: "c44b36665057c66c22bc7dec5603d3482bd70aea4e7df9d5d3419a99c098d43c",
  mode: "0444",
});

const LEDGER_EPOCH = Object.freeze({
  completionLedger: Object.freeze({
    path: "catalog/completion-ledger.json",
    predecessorBytes: 122550,
    predecessorSha256:
      "62d5b5f71ed8ccbf94ba31132d3347f43ac4918585ece52ead8fbb36a4c0b92d",
    currentBytes: 122550,
    currentSha256:
      "3b0a159ea3860d383b89582abd605bcfbe8933ae3bdfeb3e19bc42acdaa1f2db",
  }),
  lessonReleaseLedger: Object.freeze({
    path: "catalog/lesson-release-ledger.json",
    predecessorBytes: 102724,
    predecessorSha256:
      "4ea4850993ffb50eb2ba484279457f7e98bbfa339a29a71f6092f23d4b7f4650",
    currentBytes: 102724,
    currentSha256:
      "1315e554a94a0461d365c50090f91a09e3d83724826d80a006bccbc8159c9fbc",
  }),
});

const FRAME_COUNT = 203;
const STAGE_WIDTH = 800;
const STAGE_HEIGHT = 600;
const BACKGROUND = Object.freeze([184, 216, 247, 255]);
const FRAME_DOMAIN = "sprite-120";
const RELEASE_ID = "lesson-g04-l10-perimeter-area";

const AUTHORITY_FALSE_KEYS = Object.freeze([
  "productionHelperImplementation",
  "helperExecution",
  "protectedInstallation",
  "originalRuntimeLaunch",
  "originalRuntimeEvidence",
  "originalRuntimeNaturalTrace",
  "sourceHostStateEstablished",
  "actionScriptBehaviorParity",
  "bilingualVisualParity",
  "audioCueParity",
  "audioListeningAcceptance",
  "replayParity",
  "fullFrameOriginalRuntimeComparison",
  "rmseAcceptance",
  "coverageRequirementSatisfied",
  "coverageAdopted",
  "rendererAdoption",
  "behaviorAcceptance",
  "humanVisualReview",
  "engineeringReviewAccepted",
  "ownerAcceptance",
  "strictMigrationCompletion",
  "wholeLessonIntegration",
  "atomicLessonPublication",
  "wholeCourseIntegration",
  "promotion",
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

function reportFingerprint(report) {
  const copy = structuredClone(report);
  delete copy.reportFingerprintSha256;
  return sha256(Buffer.from(canonicalJson(copy)));
}

function modeOf(info) {
  return Number(info.mode & 0o777n).toString(8).padStart(4, "0");
}

function statIdentity(info) {
  return [
    info.dev,
    info.ino,
    info.mode,
    info.nlink,
    info.uid,
    info.gid,
    info.size,
    info.mtimeNs,
    info.ctimeNs,
  ].map(String).join(":");
}

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function portable(value) {
  return value.split(path.sep).join("/");
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

async function readStable(root, key, relativePath, expected = null) {
  const absolute = resolveInside(root, relativePath);
  await assertOrdinaryAncestors(root, path.dirname(absolute));
  const before = await lstat(absolute, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${relativePath} must be an ordinary file`);
  assert.equal(before.nlink, 1n, `${relativePath} link count changed`);
  assert.equal(await realpath(absolute), absolute,
    `${relativePath} resolves through a symlink`);
  const contents = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    `${relativePath} changed while read`);
  const record = {
    key,
    path: relativePath,
    bytes: contents.length,
    sha256: sha256(contents),
    mode: modeOf(after),
    statIdentity: statIdentity(after),
  };
  if (expected) {
    assert.equal(record.bytes, expected.bytes, `${relativePath} bytes changed`);
    assert.equal(record.sha256, expected.sha256,
      `${relativePath} SHA-256 changed`);
    if (expected.mode) {
      assert.equal(record.mode, expected.mode, `${relativePath} mode changed`);
    }
  }
  return {contents, record};
}

function binding(record) {
  return {
    path: record.path,
    bytes: record.bytes,
    sha256: record.sha256,
    mode: record.mode,
  };
}

function compareRgba(left, right) {
  assert.equal(left.length, right.length, "RGBA byte lengths differ");
  let changedPixelCount = 0;
  for (let offset = 0; offset < left.length; offset += 4) {
    if (
      left[offset] !== right[offset] ||
      left[offset + 1] !== right[offset + 1] ||
      left[offset + 2] !== right[offset + 2] ||
      left[offset + 3] !== right[offset + 3]
    ) changedPixelCount += 1;
  }
  return {
    rgbaByteIdentical: changedPixelCount === 0,
    changedPixelCount,
    changedPixelRatio: changedPixelCount / (STAGE_WIDTH * STAGE_HEIGHT),
  };
}

function inspectPng(bytes, frame) {
  const image = PNG.sync.read(bytes);
  assert.equal(image.width, STAGE_WIDTH, `frame ${frame} width changed`);
  assert.equal(image.height, STAGE_HEIGHT, `frame ${frame} height changed`);
  let opaquePixelCount = 0;
  let nonBackgroundPixelCount = 0;
  for (let offset = 0; offset < image.data.length; offset += 4) {
    if (image.data[offset + 3] === 255) opaquePixelCount += 1;
    if (
      image.data[offset] !== BACKGROUND[0] ||
      image.data[offset + 1] !== BACKGROUND[1] ||
      image.data[offset + 2] !== BACKGROUND[2] ||
      image.data[offset + 3] !== BACKGROUND[3]
    ) nonBackgroundPixelCount += 1;
  }
  assert.equal(opaquePixelCount, STAGE_WIDTH * STAGE_HEIGHT,
    `frame ${frame} is not fully opaque`);
  return {
    rgba: image.data,
    rgbaSha256: sha256(image.data),
    opaquePixelCount,
    nonBackgroundPixelCount,
    nonBackgroundPixelRatio:
      nonBackgroundPixelCount / (STAGE_WIDTH * STAGE_HEIGHT),
  };
}

async function readPredecessor(snapshot) {
  const rootAbsolute = resolveInside(snapshot.projectRoot, PREDECESSOR_ROOT);
  await assertOrdinaryAncestors(snapshot.projectRoot, path.dirname(rootAbsolute));
  const before = await lstat(rootAbsolute, {bigint: true});
  assert.ok(before.isDirectory() && !before.isSymbolicLink(),
    "Predecessor capture root must be an ordinary directory");
  assert.equal(modeOf(before), "0555", "Predecessor capture root mode changed");
  assert.equal(await realpath(rootAbsolute), rootAbsolute,
    "Predecessor capture root resolves through a symlink");
  const members = await readdir(rootAbsolute, {withFileTypes: true});
  const expectedNames = [
    "capture-manifest.json",
    ...Array.from({length: FRAME_COUNT}, (_, index) =>
      `frame-${String(index + 1).padStart(4, "0")}.png`),
  ].sort();
  assert.deepEqual(members.map((entry) => entry.name).sort(), expectedNames,
    "Predecessor capture membership changed");
  assert.ok(members.every((entry) => entry.isFile() && !entry.isSymbolicLink()),
    "Predecessor capture contains a non-file member");

  const manifestRead = await readStable(snapshot.projectRoot,
    "predecessorManifest", PREDECESSOR_MANIFEST, PREDECESSOR_IDENTITY);
  const manifest = JSON.parse(manifestRead.contents.toString("utf8"));
  validatePredecessorManifest(manifest);

  const captures = [];
  const captureRecords = [];
  const pairComparisons = [];
  const transitionStartFrames = [];
  const rgbaSet = new Set();
  let totalPngBytes = 0;
  let previousRgba = null;
  let frameOneRgbaSha256 = null;
  let identicalToFrameOneCount = 0;
  const setHash = createHash("sha256");

  for (let index = 0; index < FRAME_COUNT; index += 1) {
    const frame = index + 1;
    const expectedCapture = manifest.captures[index];
    const relativePath = `${PREDECESSOR_ROOT}/${expectedCapture.file}`;
    const read = await readStable(snapshot.projectRoot, `frame-${frame}`,
      relativePath, {
        bytes: expectedCapture.bytes,
        sha256: expectedCapture.sha256,
        mode: "0444",
      });
    const inspected = inspectPng(read.contents, frame);
    assert.equal(inspected.rgbaSha256, expectedCapture.rgbaSha256,
      `frame ${frame} RGBA SHA-256 changed`);
    assert.equal(inspected.opaquePixelCount, expectedCapture.opaquePixelCount,
      `frame ${frame} opaque census changed`);
    assert.equal(inspected.nonBackgroundPixelCount,
      expectedCapture.nonBackgroundPixelCount,
      `frame ${frame} non-background census changed`);
    assert.equal(inspected.nonBackgroundPixelRatio,
      expectedCapture.nonBackgroundPixelRatio,
      `frame ${frame} non-background ratio changed`);
    if (frame === 1) frameOneRgbaSha256 = inspected.rgbaSha256;
    if (inspected.rgbaSha256 === frameOneRgbaSha256) {
      identicalToFrameOneCount += 1;
    }
    rgbaSet.add(inspected.rgbaSha256);
    if (previousRgba) {
      const comparison = compareRgba(previousRgba, inspected.rgba);
      const expectedPair = manifest.currentJavascriptSequence
        .consecutivePairs[index - 1];
      assert.deepEqual(comparison, {
        rgbaByteIdentical: expectedPair.rgbaByteIdentical,
        changedPixelCount: expectedPair.changedPixelCount,
        changedPixelRatio: expectedPair.changedPixelRatio,
      }, `frame ${frame} consecutive RGBA relationship changed`);
      pairComparisons.push({leftFrame: frame - 1, rightFrame: frame,
        ...comparison});
      if (!comparison.rgbaByteIdentical) transitionStartFrames.push(frame);
    }
    previousRgba = inspected.rgba;
    totalPngBytes += read.record.bytes;
    setHash.update(`${expectedCapture.file}\0${read.record.bytes}\0` +
      `${read.record.sha256}\0${inspected.rgbaSha256}\n`);
    captureRecords.push(read.record);
    captures.push({
      frame,
      file: expectedCapture.file,
      bytes: read.record.bytes,
      sha256: read.record.sha256,
      rgbaSha256: inspected.rgbaSha256,
    });
  }

  const identicalPairs = pairComparisons.filter((pair) =>
    pair.rgbaByteIdentical).length;
  const changedPairs = pairComparisons.length - identicalPairs;
  assert.equal(totalPngBytes, 5148744, "Total predecessor PNG bytes changed");
  assert.equal(pairComparisons.length, 202, "Consecutive pair count changed");
  assert.equal(identicalPairs, 55, "Identical pair count changed");
  assert.equal(changedPairs, 147, "Changed pair count changed");
  assert.equal(rgbaSet.size, 148, "Unique RGBA raster count changed");
  assert.equal(identicalToFrameOneCount, 3,
    "Frame-one-identical count changed");
  assert.deepEqual(transitionStartFrames,
    manifest.currentJavascriptSequence.transitionStartFrames,
    "Transition frame set changed");

  const after = await lstat(rootAbsolute, {bigint: true});
  assert.equal(statIdentity(after), statIdentity(before),
    "Predecessor capture root changed while read");
  snapshot.records.push(manifestRead.record, ...captureRecords);
  snapshot.predecessorDirectory = {
    path: PREDECESSOR_ROOT,
    mode: modeOf(after),
    statIdentity: statIdentity(after),
  };
  return {
    manifest,
    manifestRecord: manifestRead.record,
    captures,
    captureClosure: {
      captureCount: FRAME_COUNT,
      fileCountIncludingManifest: FRAME_COUNT + 1,
      decodedAndRehashedPngCount: FRAME_COUNT,
      totalPngBytes,
      captureSetCanonicalRecord:
        "file\\0bytes\\0pngSha256\\0rgbaSha256\\n in frame order",
      captureSetSha256: setHash.digest("hex"),
      comparedConsecutivePairCount: pairComparisons.length,
      byteIdenticalToPreviousFrameCount: identicalPairs,
      changedFromPreviousFrameCount: changedPairs,
      uniqueRgbaRasterCount: rgbaSet.size,
      byteIdenticalToFrameOneCount: identicalToFrameOneCount,
      transitionStartFrames,
      predecessorSequenceReproducedExactly: true,
    },
  };
}

function validatePredecessorManifest(manifest) {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.artifactType,
    "g4-l10-vb003-current-js-engineering-diagnostic-v1");
  assert.equal(manifest.animationId, ANIMATION_ID);
  assert.equal(manifest.status, "pass");
  assert.equal(manifest.classification,
    "source-static-current-javascript-engineering-diagnostic-only");
  assert.equal(manifest.acceptanceEffect, "none");
  assert.equal(manifest.coverageAdoptionAttempted, false);
  assert.equal(manifest.formalCoverageMutation, false);
  assert.equal(manifest.formalCapturedFrameCountEffect, 0);
  assert.equal(manifest.authorityBoundary.currentJavascriptCandidateOnly, true);
  assert.ok(Object.entries(manifest.authorityBoundary)
    .filter(([key]) => !["classification", "acceptanceEffect",
      "currentJavascriptCandidateOnly"].includes(key))
    .every(([, value]) => value === false),
  "Predecessor authority boundary was promoted");
  assert.equal(manifest.candidate.registered, false);
  assert.equal(manifest.candidate.actionScriptExecuted, false);
  assert.equal(manifest.candidate.controlsEnabled, false);
  assert.deepEqual(manifest.candidate.audioCues, []);
  assert.equal(manifest.candidate.SpanishVisualStatus, "unresolved-disabled");
  assert.equal(manifest.candidate.naturalRuntimeEstablished, false);
  assert.equal(manifest.candidate.replayParityEstablished, false);
  assert.equal(manifest.candidate.fullFrameFidelityEstablished, false);
  assert.equal(manifest.summary.captureCount, FRAME_COUNT);
  assert.equal(manifest.summary.fileCount, FRAME_COUNT + 1);
  assert.equal(manifest.summary.totalPngBytes, 5148744);
  assert.equal(manifest.captures.length, FRAME_COUNT);
  assert.deepEqual(manifest.captures.map((capture) => capture.frame),
    Array.from({length: FRAME_COUNT}, (_, index) => index + 1));
  assert.equal(manifest.currentJavascriptSequence.comparedConsecutivePairCount,
    202);
  assert.equal(manifest.currentJavascriptSequence
    .byteIdenticalToPreviousFrameCount, 55);
  assert.equal(manifest.currentJavascriptSequence
    .changedFromPreviousFrameCount, 147);
  assert.equal(manifest.currentJavascriptSequence.uniqueRgbaRasterCount, 148);
  assert.equal(manifest.currentJavascriptSequence.byteIdenticalToFrameOneCount,
    3);
}

async function rebindCurrentInputs(snapshot, predecessorManifest) {
  const currentBindings = {};
  const changes = [];
  for (const [key, predecessor] of Object.entries(predecessorManifest.bindings)) {
    const current = await readStable(snapshot.projectRoot, key,
      predecessor.path);
    snapshot.records.push(current.record);
    currentBindings[key] = binding(current.record);
    const changed = current.record.bytes !== predecessor.bytes ||
      current.record.sha256 !== predecessor.sha256;
    if (changed) {
      changes.push({
        key,
        path: predecessor.path,
        predecessor: {bytes: predecessor.bytes, sha256: predecessor.sha256},
        current: {bytes: current.record.bytes, sha256: current.record.sha256},
      });
    }
  }
  assert.deepEqual(changes.map((change) => change.key),
    ["completionLedger", "lessonReleaseLedger"],
    "Currentness drift is not exactly the two declared ledgers");
  for (const change of changes) {
    const expected = LEDGER_EPOCH[change.key];
    assert.equal(change.path, expected.path);
    assert.equal(change.predecessor.bytes, expected.predecessorBytes);
    assert.equal(change.predecessor.sha256, expected.predecessorSha256);
    assert.equal(change.current.bytes, expected.currentBytes);
    assert.equal(change.current.sha256, expected.currentSha256);
  }
  return {currentBindings, changes};
}

async function deriveFormalState(snapshot, predecessorManifest) {
  const parseBinding = async (key) => JSON.parse((await readStable(
    snapshot.projectRoot, `formal-${key}`,
    predecessorManifest.bindings[key].path)).contents.toString("utf8"));
  const [formalCoverage, formalTrace, completionLedger, releaseLedger] =
    await Promise.all([
      parseBinding("formalCoverage"),
      parseBinding("formalNestedEnTrace"),
      parseBinding("completionLedger"),
      parseBinding("lessonReleaseLedger"),
    ]);
  const nestedRequirements = formalCoverage.requirements.filter((requirement) =>
    requirement.frameDomainId === FRAME_DOMAIN);
  assert.equal(nestedRequirements.length, 2);
  for (const language of ["en", "es"]) {
    const requirement = nestedRequirements.find((entry) =>
      entry.language === language);
    assert.equal(requirement.status, "blocked");
    assert.equal(requirement.capturedFrameCount, 0);
    assert.equal(requirement.missingFrames.length, FRAME_COUNT);
    assert.equal(requirement.baselineAuthority, "unresolved");
    assert.equal(requirement.baselineCaptureManifest, "");
    assert.equal(requirement.captureManifest, "");
    assert.equal(requirement.metricsFile, "");
  }
  assert.equal(formalTrace.traceSpecStatus, "unresolved");
  assert.equal(formalTrace.schedule.status,
    "unresolved-no-complete-source-event-schedule");
  assert.equal(formalTrace.schedule.orderedSteps.length, 0);
  assert.equal(formalTrace.executionEvidence.executionReport, null);
  assert.equal(formalTrace.executionEvidence.originalRuntimeCaptureManifest,
    null);
  const completionEntry = completionLedger.entries.find((entry) =>
    entry.animationId === ANIMATION_ID);
  const completionDiagnostic = completionLedger.diagnostics.find((entry) =>
    entry.animationId === ANIMATION_ID);
  assert.equal(completionEntry, undefined);
  assert.equal(completionDiagnostic.status, "preserved");
  assert.equal(completionDiagnostic.workspace,
    "migrations/course-g04-l10-vb-003");
  assert.equal(completionDiagnostic.manifestSha256,
    predecessorManifest.bindings.migration.sha256);
  assert.equal(completionDiagnostic.errorCount, 93);
  const release = releaseLedger.releases.find((entry) =>
    entry.releaseId === RELEASE_ID);
  const member = release.members.find((entry) =>
    entry.animationId === ANIMATION_ID);
  assert.equal(release.expectedMemberCount, 47);
  assert.equal(release.strictCompleteCount, 0);
  assert.equal(release.missingCount, 47);
  assert.equal(release.published, false);
  assert.equal(release.status, "unpublished");
  assert.equal(release.gate.open, false);
  assert.equal(release.gate.admittedCount, 0);
  assert.equal(member.ordinal, 7);
  assert.equal(member.strictComplete, false);
  assert.equal(member.status, "missing");
  assert.equal(member.ledgerAssetId, null);
  assert.equal(member.workspace, null);
  assert.equal(member.manifestSha256, null);

  for (const key of ["prototypeRegistry", "generatedRegistry",
    "prototypeManifest", "wholeLessonRegistry"]) {
    const read = await readStable(snapshot.projectRoot, `registry-${key}`,
      predecessorManifest.bindings[key].path);
    assert.equal(read.contents.includes(Buffer.from(ANIMATION_ID)), false,
      `${ANIMATION_ID} unexpectedly appears in ${key}`);
  }

  const formalState = {
    coverageAdoptionAttempted: false,
    formalCoverageMutation: false,
    formalCapturedFrameCountEffect: 0,
    nestedRequirements: nestedRequirements.map((requirement) => ({
      requirementId: requirement.requirementId,
      frameDomainId: requirement.frameDomainId,
      scenario: requirement.scenario,
      language: requirement.language,
      status: requirement.status,
      capturedFrameCount: requirement.capturedFrameCount,
      missingFrameCount: requirement.missingFrames.length,
      baselineAuthority: requirement.baselineAuthority,
    })),
    formalNestedEnTrace: {
      requirementId: formalTrace.requirementId,
      traceId: formalTrace.identity.traceId,
      entryStateSha256: formalTrace.identity.entryStateSha256,
      scenario: formalTrace.identity.scenario,
      status: formalTrace.traceSpecStatus,
      orderedStepCount: formalTrace.schedule.orderedSteps.length,
      executionReport: formalTrace.executionEvidence.executionReport,
    },
    registryPresenceCount: 0,
    completionLedgerEntryPresent: false,
    completionLedgerStatus: completionDiagnostic.status,
    completionLedgerErrorCount: completionDiagnostic.errorCount,
    releaseMemberStatus: member.status,
    releaseStrictCompleteCount: release.strictCompleteCount,
    releaseMissingCount: release.missingCount,
    releasePublished: release.published,
    releaseGateOpen: release.gate.open,
  };
  assert.deepEqual(formalState, predecessorManifest.formalState,
    "Formal state changed across the ledger epoch");
  return formalState;
}

async function readSelfIdentity(snapshot) {
  const scriptRelative = portable(path.relative(snapshot.projectRoot,
    SCRIPT_PATH));
  const [script, test] = await Promise.all([
    readStable(snapshot.projectRoot, "successorBuilder", scriptRelative),
    readStable(snapshot.projectRoot, "successorBuilderTest", TEST_RELATIVE),
  ]);
  snapshot.records.push(script.record, test.record);
  return {script: binding(script.record), test: binding(test.record)};
}

export async function readSnapshot(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const snapshot = {projectRoot: root, records: []};
  const predecessor = await readPredecessor(snapshot);
  const rebound = await rebindCurrentInputs(snapshot, predecessor.manifest);
  const formalState = await deriveFormalState(snapshot, predecessor.manifest);
  const self = await readSelfIdentity(snapshot);
  return {...snapshot, predecessor, rebound, formalState, self};
}

function makeAuthorityBoundary() {
  return Object.fromEntries(AUTHORITY_FALSE_KEYS.map((key) => [key, false]));
}

export function deriveReport(snapshot) {
  const report = {
    schemaVersion: 1,
    artifactType:
      "g4-l10-vb003-current-js-engineering-diagnostic-v1-currentness-successor",
    animationId: ANIMATION_ID,
    generatedForDate: "2026-08-07",
    status:
      "CURRENTNESS_SUCCESSOR_PASS_CAPTURE_BYTES_UNCHANGED_LEDGER_EPOCH_REBOUND_NO_AUTHORITY",
    decision:
      "PRESERVE_V1_CAPTURE_AS_IMMUTABLE_CURRENT_JS_DIAGNOSTIC_DO_NOT_ADOPT_DO_NOT_LAUNCH",
    classification:
      "read-only-currentness-successor-for-pre-existing-source-static-current-javascript-engineering-diagnostic-only",
    acceptanceEffect: "none",
    scope: {
      predecessorArtifact: PREDECESSOR_ROOT,
      readsExistingCaptureOnly: true,
      browserRecapturePerformed: false,
      originalRuntimeReadOrLaunchPerformed: false,
      helperReadOrExecutionPerformed: false,
      sourceAssetWritePerformed: false,
      registryWritePerformed: false,
      ledgerWritePerformed: false,
    },
    predecessor: {
      manifest: binding(snapshot.predecessor.manifestRecord),
      directoryMode: snapshot.predecessorDirectory.mode,
      captureClosure: snapshot.predecessor.captureClosure,
      captures: snapshot.predecessor.captures,
      historicalMeaning:
        "The frozen bytes remain evidence of the source-static current-JavaScript candidate diagnostic at its original input epoch; they are not original-runtime or acceptance evidence.",
    },
    currentness: {
      exactChangedBindingCount: snapshot.rebound.changes.length,
      exactChangedBindingKeys: snapshot.rebound.changes.map((change) =>
        change.key),
      changes: snapshot.rebound.changes,
      allNonLedgerBindingsByteIdenticalToPredecessor: true,
      currentBindings: snapshot.rebound.currentBindings,
      predecessorCurrentnessStatus:
        "stale-only-by-two-ledger-hashes",
      predecessorProducerTestExpectedDisposition:
        "red-by-design-until-a-new-capture-or-successor-is-used-because-the-predecessor-pins-the-prior-ledger-epoch",
      successorMeaning:
        "This report rebinds the unchanged frozen capture to a read-only observation of the current ledgers; it does not rerun the browser or establish current browser determinism.",
    },
    formalState: snapshot.formalState,
    authority: makeAuthorityBoundary(),
    independentReview: {
      taskAuthorized: false,
      taskIds: [],
      reviewerVerdictPresent: false,
      acceptanceDecisionPresent: false,
    },
    selfIdentity: snapshot.self,
    unresolved: [
      "No authorized original-runtime capture, source-host entry, or natural trace is present.",
      "No original-runtime/current-JavaScript full-frame pair, diff, normalized RMSE, fidelity judgment, or RMSE acceptance is present.",
      "No browser recapture was performed; this successor verifies stored PNG bytes and current input bindings only.",
      "Spanish visuals, English/Spanish audio cues, listening, and synchronization remain unresolved.",
      "ActionScript controls, host behavior, terminal state, and Replay parity remain unresolved.",
      "Human, engineering, and owner acceptance remain pending.",
      "VB003 remains absent from formal registries and completion admission; L10 remains 0 strict-complete and 47 missing.",
    ],
  };
  report.reportFingerprintSha256 = reportFingerprint(report);
  validateReport(report);
  return report;
}

export function validateReport(report) {
  assert.equal(report.status,
    "CURRENTNESS_SUCCESSOR_PASS_CAPTURE_BYTES_UNCHANGED_LEDGER_EPOCH_REBOUND_NO_AUTHORITY");
  assert.equal(report.decision,
    "PRESERVE_V1_CAPTURE_AS_IMMUTABLE_CURRENT_JS_DIAGNOSTIC_DO_NOT_ADOPT_DO_NOT_LAUNCH");
  assert.equal(report.acceptanceEffect, "none");
  assert.equal(report.scope.browserRecapturePerformed, false);
  assert.equal(report.scope.originalRuntimeReadOrLaunchPerformed, false);
  assert.equal(report.scope.helperReadOrExecutionPerformed, false);
  assert.equal(report.predecessor.captureClosure.captureCount, FRAME_COUNT);
  assert.equal(report.predecessor.captureClosure.decodedAndRehashedPngCount,
    FRAME_COUNT);
  assert.equal(report.predecessor.captureClosure
    .predecessorSequenceReproducedExactly, true);
  assert.deepEqual(report.currentness.exactChangedBindingKeys,
    ["completionLedger", "lessonReleaseLedger"]);
  assert.equal(report.currentness.allNonLedgerBindingsByteIdenticalToPredecessor,
    true);
  assert.equal(report.formalState.completionLedgerEntryPresent, false);
  assert.equal(report.formalState.releaseStrictCompleteCount, 0);
  assert.equal(report.formalState.releaseMissingCount, 47);
  assert.equal(report.formalState.releasePublished, false);
  assert.equal(report.formalState.releaseGateOpen, false);
  assert.ok(Object.values(report.authority).every((value) => value === false));
  assert.equal(report.independentReview.taskAuthorized, false);
  assert.equal(report.independentReview.reviewerVerdictPresent, false);
  assert.equal(report.reportFingerprintSha256, reportFingerprint(report));
}

export function renderMarkdown(report) {
  const closure = report.predecessor.captureClosure;
  const changes = report.currentness.changes.map((change) =>
    `- \`${change.key}\`: \`${change.predecessor.sha256}\` → ` +
      `\`${change.current.sha256}\` (${change.current.bytes} bytes unchanged)`).join("\n");
  return `# G4 L10 VB003 current-JS diagnostic v1 currentness successor\n\n` +
    `Status: **${report.status}**\n\n` +
    `Decision: **${report.decision}**\n\n` +
    `The immutable v1 package was not overwritten or recaptured. All ` +
    `${closure.captureCount} PNG files were decoded and rehashed; their ` +
    `${closure.totalPngBytes} bytes and full RGBA sequence reproduce the ` +
    `predecessor exactly.\n\n` +
    `## Ledger epoch changes\n\n${changes}\n\n` +
    `Every non-ledger predecessor binding remains byte-identical. The formal ` +
    `state also remains closed: VB003 completion entry absent, Lesson 10 ` +
    `strict-complete 0/47, missing 47/47, gate closed, unpublished.\n\n` +
    `## Boundary\n\n` +
    `This is stored-byte and current-ledger evidence only. It is not a browser ` +
    `recapture, original-runtime baseline, helper execution, behavior or RMSE ` +
    `acceptance, renderer adoption, human/owner acceptance, promotion, ` +
    `integration, or publication authority. No independent review task or ` +
    `verdict is created.\n\n` +
    `Report fingerprint: \`${report.reportFingerprintSha256}\`.\n`;
}

export async function buildBundle(projectRoot = PROJECT_ROOT) {
  const snapshot = await readSnapshot(projectRoot);
  const report = deriveReport(snapshot);
  return {
    snapshot,
    report,
    json: `${JSON.stringify(report, null, 2)}\n`,
    markdown: renderMarkdown(report),
  };
}

async function outputState(outputRoot, relativePath) {
  const absolute = resolveInside(outputRoot, relativePath);
  await assertOrdinaryAncestors(outputRoot, path.dirname(absolute));
  try {
    return {absolute, info: await lstat(absolute)};
  } catch (error) {
    if (error?.code === "ENOENT") return {absolute, info: null};
    throw error;
  }
}

async function assertSnapshotUnchanged(snapshot) {
  for (const record of snapshot.records) {
    const absolute = resolveInside(snapshot.projectRoot, record.path);
    const current = await lstat(absolute, {bigint: true});
    assert.equal(statIdentity(current), record.statIdentity,
      `${record.path} changed after snapshot`);
  }
  const directory = resolveInside(snapshot.projectRoot, PREDECESSOR_ROOT);
  const currentDirectory = await lstat(directory, {bigint: true});
  assert.equal(statIdentity(currentDirectory),
    snapshot.predecessorDirectory.statIdentity,
  "Predecessor directory changed after snapshot");
}

export async function checkReport(bundle,
  outputRoot = bundle.snapshot.projectRoot, options = {}) {
  const root = await canonicalRoot(outputRoot);
  for (const [relativePath, expected] of [
    [REPORT_JSON, bundle.json],
    [REPORT_MARKDOWN, bundle.markdown],
  ]) {
    await readStable(root, "generated-currentness-successor", relativePath, {
      bytes: Buffer.byteLength(expected),
      sha256: sha256(Buffer.from(expected)),
      mode: "0444",
    });
  }
  if (options.skipInputCheck !== true) {
    await assertSnapshotUnchanged(bundle.snapshot);
  }
  return {
    disposition: "checked",
    status: bundle.report.status,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    captureBytesUnchanged: true,
    changedBindingCount: 2,
    originalRuntimeAuthorized: false,
    productionHelperImplementationEligible: false,
    acceptanceEffect: false,
  };
}

export async function publishNoClobber(bundle, options = {}) {
  const outputRoot = await canonicalRoot(
    options.outputRoot ?? bundle.snapshot.projectRoot);
  const jsonState = await outputState(outputRoot, REPORT_JSON);
  const markdownState = await outputState(outputRoot, REPORT_MARKDOWN);
  assert.equal(jsonState.info, null,
    `Output already exists; refusing overwrite: ${REPORT_JSON}`);
  assert.equal(markdownState.info, null,
    `Output already exists; refusing overwrite: ${REPORT_MARKDOWN}`);
  await assertSnapshotUnchanged(bundle.snapshot);
  await writeFile(jsonState.absolute, bundle.json, {flag: "wx", mode: 0o600});
  await chmod(jsonState.absolute, 0o444);
  await (options.beforeMarkdown ?? (async () => {}))();
  await assertSnapshotUnchanged(bundle.snapshot);
  await writeFile(markdownState.absolute, bundle.markdown,
    {flag: "wx", mode: 0o600});
  await chmod(markdownState.absolute, 0o444);
  await assertSnapshotUnchanged(bundle.snapshot);
  return checkReport(bundle, outputRoot, {skipInputCheck: true});
}

export function parseCliArgs(args) {
  assert.equal(args.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(args[0]),
    "Expected --dry-run, --write-no-clobber, or --check");
  return args[0];
}

export async function runCli(args = process.argv.slice(2),
  projectRoot = PROJECT_ROOT) {
  const mode = parseCliArgs(args);
  const bundle = await buildBundle(projectRoot);
  if (mode === "--write-no-clobber") return publishNoClobber(bundle);
  if (mode === "--check") return checkReport(bundle);
  return {
    disposition: "dry-run",
    status: bundle.report.status,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    captureBytesUnchanged: true,
    changedBindingCount: 2,
    originalRuntimeAuthorized: false,
    productionHelperImplementationEligible: false,
    acceptanceEffect: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCli().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
