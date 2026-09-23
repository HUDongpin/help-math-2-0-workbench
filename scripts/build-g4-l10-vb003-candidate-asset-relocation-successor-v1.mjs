#!/usr/bin/env node

import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  chmod,
  lstat,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  resolveCurrentJsCandidateAssetBinding,
} from "./current-js-candidate-asset-binding.mjs";
import {
  collectImplementationArtifactClosure,
  implementationArtifactClosureErrors,
} from "./implementation-artifact-closure.mjs";
import {
  MIGRATION_VALIDATOR_VERSION,
  validateMigration,
} from "../skills/flash-to-js/scripts/validate_migration.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
export const ANIMATION_ID = "course-g04-l10-vb-003";
export const WORKSPACE = `migrations/${ANIMATION_ID}`;
export const PREDECESSOR_ROOT =
  "output/playwright/g4-l10-vb003-current-js-engineering-diagnostic-v1";
export const PREDECESSOR_MANIFEST = `${PREDECESSOR_ROOT}/capture-manifest.json`;
export const REPORT_JSON =
  "reports/g4-l10-vb003-candidate-asset-relocation-successor-v1.json";
export const REPORT_MARKDOWN =
  "reports/g4-l10-vb003-candidate-asset-relocation-successor-v1.md";
export const TEST_PATH =
  "scripts/build-g4-l10-vb003-candidate-asset-relocation-successor-v1.test.mjs";

const FRAME_COUNT = 203;
const OLD_CANVAS_PATH =
  "public/flash-assets/courses/course-g04-l10-vb-003/canvas-renderer.js";
const OLD_CANDIDATE_MANIFEST_PATH =
  "public/flash-assets/courses/course-g04-l10-vb-003/manifest.json";
const CURRENT_CANDIDATE_MANIFEST_PATH =
  "candidate-evidence/current-js/2026-08-22-page-only-candidates-v1/courses/course-g04-l10-vb-003/product-candidate-assets-v1/manifest.json";
const CURRENT_CANVAS_PATH =
  "apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/courses/course-g04-l10-vb-003/canvas-renderer.js";
const CANDIDATE_PROFILE_PATH =
  "apps/web/config/current-js-candidate-assets.v1.json";
const RELEASE_ID = "lesson-g04-l10-perimeter-area";
const PAGE_ONLY_RELEASE_ID =
  "lesson-g04-l10-perimeter-area-page-only";

const PREDECESSOR_IDENTITY = Object.freeze({
  bytes: 218603,
  sha256: "c44b36665057c66c22bc7dec5603d3482bd70aea4e7df9d5d3419a99c098d43c",
});
const CANVAS_IDENTITY = Object.freeze({
  bytes: 1400676,
  sha256: "5923392682aa868e7348e31c3db7bbab1d1ef34861c4af641b0ac71385b583ee",
});
const CANDIDATE_MANIFEST_IDENTITY = Object.freeze({
  bytes: 14679,
  sha256: "bf85e1e1b77939c5b82933e3dc9a47c3ef2ba41bf65916d7ac1c3a050c9f6da7",
});

const AUTHORITY_FALSE_KEYS = Object.freeze([
  "browserRecapture",
  "originalRuntimeEvidence",
  "originalRuntimeNaturalTrace",
  "actionScriptBehaviorParity",
  "bilingualVisualParity",
  "audioCueParity",
  "audioListeningAcceptance",
  "replayParity",
  "fullFrameOriginalRuntimeComparison",
  "rmseAcceptance",
  "coverageAdoption",
  "rendererAdoption",
  "humanVisualReview",
  "engineeringReviewAccepted",
  "ownerAcceptance",
  "strictMigrationCompletion",
  "wholeLessonIntegration",
  "releaseApproval",
  "promotion",
  "publication",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [
    key,
    stable(value[key]),
  ]));
}

function canonicalJson(value) {
  return JSON.stringify(stable(value));
}

function fingerprint(report) {
  const copy = structuredClone(report);
  delete copy.reportFingerprintSha256;
  return sha256(Buffer.from(canonicalJson(copy)));
}

function modeOf(metadata) {
  return Number(metadata.mode & 0o777).toString(8).padStart(4, "0");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function inside(root, target) {
  const relative = path.relative(root, target);
  return relative !== ""
    && relative !== ".."
    && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative);
}

function resolveInside(root, relativePath) {
  assert.equal(path.isAbsolute(relativePath), false,
    `Absolute path is forbidden: ${relativePath}`);
  assert.equal(relativePath.includes("\\"), false,
    `Non-portable path is forbidden: ${relativePath}`);
  const absolutePath = path.resolve(root, relativePath);
  assert.ok(inside(root, absolutePath), `Path escapes root: ${relativePath}`);
  return absolutePath;
}

async function canonicalRoot(projectRoot) {
  const root = path.resolve(projectRoot);
  const metadata = await lstat(root);
  assert.ok(metadata.isDirectory() && !metadata.isSymbolicLink(),
    `Project root must be an ordinary directory: ${root}`);
  assert.equal(await realpath(root), root,
    `Project root resolves through a symbolic link: ${root}`);
  return root;
}

async function assertOrdinaryAncestors(root, absolutePath) {
  const relative = path.relative(root, absolutePath);
  let cursor = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const metadata = await lstat(cursor);
    assert.equal(metadata.isSymbolicLink(), false,
      `Path contains a symbolic link: ${portable(path.relative(root, cursor))}`);
  }
}

async function bindFile(root, relativePath, expected = null,
  expectedMode = null) {
  const absolutePath = resolveInside(root, relativePath);
  await assertOrdinaryAncestors(root, absolutePath);
  const before = await lstat(absolutePath);
  assert.ok(before.isFile() && !before.isSymbolicLink(),
    `${relativePath} must be an ordinary file`);
  assert.equal(await realpath(absolutePath), absolutePath,
    `${relativePath} resolves through a symbolic link`);
  const bytes = await readFile(absolutePath);
  const after = await lstat(absolutePath);
  assert.equal(after.size, before.size, `${relativePath} changed while read`);
  assert.equal(after.mtimeMs, before.mtimeMs, `${relativePath} changed while read`);
  const binding = {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    mode: modeOf(after),
  };
  if (expected) {
    assert.equal(binding.bytes, expected.bytes, `${relativePath} bytes drifted`);
    assert.equal(binding.sha256, expected.sha256,
      `${relativePath} SHA-256 drifted`);
  }
  if (expectedMode) assert.equal(binding.mode, expectedMode,
    `${relativePath} mode drifted`);
  return {binding, bytes};
}

async function assertAbsent(root, relativePath) {
  const absolutePath = resolveInside(root, relativePath);
  try {
    await lstat(absolutePath);
  } catch (error) {
    if (error?.code === "ENOENT") return {path: relativePath, absent: true};
    throw error;
  }
  throw new Error(`Historical workbench mirror still exists: ${relativePath}`);
}

async function readPredecessorCapture(root) {
  const directoryPath = resolveInside(root, PREDECESSOR_ROOT);
  await assertOrdinaryAncestors(root, directoryPath);
  const directory = await lstat(directoryPath);
  assert.ok(directory.isDirectory() && !directory.isSymbolicLink(),
    "Predecessor capture root must be an ordinary directory");
  assert.equal(modeOf(directory), "0555",
    "Predecessor capture root mode drifted");
  const entries = await readdir(directoryPath, {withFileTypes: true});
  const expectedNames = [
    "capture-manifest.json",
    ...Array.from({length: FRAME_COUNT}, (_, index) =>
      `frame-${String(index + 1).padStart(4, "0")}.png`),
  ].sort();
  assert.deepEqual(entries.map(({name}) => name).sort(), expectedNames,
    "Predecessor capture membership drifted");
  assert.ok(entries.every((entry) => entry.isFile()
    && !entry.isSymbolicLink()),
  "Predecessor capture contains a non-file member");

  const manifestRead = await bindFile(root, PREDECESSOR_MANIFEST,
    PREDECESSOR_IDENTITY, "0444");
  const manifest = JSON.parse(manifestRead.bytes.toString("utf8"));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.artifactType,
    "g4-l10-vb003-current-js-engineering-diagnostic-v1");
  assert.equal(manifest.animationId, ANIMATION_ID);
  assert.equal(manifest.status, "pass");
  assert.equal(manifest.classification,
    "source-static-current-javascript-engineering-diagnostic-only");
  assert.equal(manifest.acceptanceEffect, "none");
  assert.equal(manifest.bindings.canvasAsset.path, OLD_CANVAS_PATH);
  assert.equal(manifest.bindings.canvasAsset.bytes, CANVAS_IDENTITY.bytes);
  assert.equal(manifest.bindings.canvasAsset.sha256, CANVAS_IDENTITY.sha256);
  assert.equal(manifest.bindings.candidateManifest.path,
    OLD_CANDIDATE_MANIFEST_PATH);
  assert.equal(manifest.bindings.candidateManifest.bytes,
    CANDIDATE_MANIFEST_IDENTITY.bytes);
  assert.equal(manifest.bindings.candidateManifest.sha256,
    CANDIDATE_MANIFEST_IDENTITY.sha256);
  assert.equal(manifest.summary.captureCount, FRAME_COUNT);
  assert.equal(manifest.captures.length, FRAME_COUNT);

  const captureSet = createHash("sha256");
  let totalPngBytes = 0;
  for (const [index, capture] of manifest.captures.entries()) {
    const frame = index + 1;
    assert.equal(capture.frame, frame, `Predecessor frame ${frame} order drifted`);
    assert.equal(capture.file,
      `frame-${String(frame).padStart(4, "0")}.png`);
    const file = await bindFile(root, `${PREDECESSOR_ROOT}/${capture.file}`, {
      bytes: capture.bytes,
      sha256: capture.sha256,
    }, "0444");
    totalPngBytes += file.binding.bytes;
    captureSet.update(`${capture.file}\0${capture.bytes}\0${capture.sha256}\n`);
  }
  assert.equal(totalPngBytes, manifest.summary.totalPngBytes);
  return {
    manifest: manifestRead.binding,
    directoryMode: modeOf(directory),
    captureCount: FRAME_COUNT,
    fileCountIncludingManifest: FRAME_COUNT + 1,
    totalPngBytes,
    captureSetEncoding: "file\\0bytes\\0sha256\\n in frame order",
    captureSetSha256: captureSet.digest("hex"),
    historicalBindingPathsPreserved: true,
  };
}

function makeAuthorityBoundary() {
  return Object.fromEntries(AUTHORITY_FALSE_KEYS.map((key) => [key, false]));
}

export async function buildBundle(projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const predecessor = await readPredecessorCapture(root);
  const [oldCanvasAbsence, oldManifestAbsence] = await Promise.all([
    assertAbsent(root, OLD_CANVAS_PATH),
    assertAbsent(root, OLD_CANDIDATE_MANIFEST_PATH),
  ]);
  const canvasResolution = await resolveCurrentJsCandidateAssetBinding({
    projectRoot: root,
    logicalPath: OLD_CANVAS_PATH,
    expectedBytes: CANVAS_IDENTITY.bytes,
    expectedSha256: CANVAS_IDENTITY.sha256,
  });
  assert.equal(canvasResolution?.kind, "candidate-profile");
  assert.equal(canvasResolution.relativePath, CURRENT_CANVAS_PATH);
  assert.equal(canvasResolution.profile.path, CANDIDATE_PROFILE_PATH);
  assert.equal(canvasResolution.profile.version,
    "2026-08-22-page-only-candidates-v1");
  assert.deepEqual(canvasResolution.profile.authority, {
    productionApproved: false,
    releaseEligible: false,
    published: false,
  });
  assert.equal(canvasResolution.record.releaseId, PAGE_ONLY_RELEASE_ID);
  const currentCanvas = await bindFile(root, CURRENT_CANVAS_PATH,
    CANVAS_IDENTITY);
  const currentCandidateManifest = await bindFile(
    root,
    CURRENT_CANDIDATE_MANIFEST_PATH,
    CANDIDATE_MANIFEST_IDENTITY,
  );
  const profile = await bindFile(root, CANDIDATE_PROFILE_PATH);
  assert.equal(profile.binding.bytes, canvasResolution.profile.bytes);
  assert.equal(profile.binding.sha256, canvasResolution.profile.sha256);

  const migrationRead = await bindFile(root, `${WORKSPACE}/migration.json`);
  const migration = JSON.parse(migrationRead.bytes.toString("utf8"));
  assert.equal(migration.animationId, ANIMATION_ID);
  const implementationArtifactClosure =
    await collectImplementationArtifactClosure({
      projectRoot: root,
      workspace: resolveInside(root, WORKSPACE),
      manifest: migration,
    });
  assert.deepEqual(
    implementationArtifactClosureErrors(implementationArtifactClosure),
    [],
  );
  assert.ok(implementationArtifactClosure.artifacts.some(({path: artifactPath,
    bytes, sha256: digest}) => (
    artifactPath === CURRENT_CANVAS_PATH
      && bytes === CANVAS_IDENTITY.bytes
      && digest === CANVAS_IDENTITY.sha256
  )), "Current closure does not bind the relocated Canvas asset");
  assert.equal(implementationArtifactClosure.artifacts.some(({path: artifactPath}) =>
    artifactPath === OLD_CANVAS_PATH), false,
  "Current closure still binds the removed workbench mirror");

  const validation = await validateMigration(resolveInside(root, WORKSPACE), {
    evidenceProjectRoot: root,
  });
  assert.equal(validation.ok, false);
  assert.equal(validation.mode, "strict");
  assert.equal(validation.errors.length, 93);
  assert.equal(validation.errors.some((error) =>
    error.includes("exported_file does not exist")
      || error.includes("current implementation artifact closure cannot be recomputed")),
  false, "Legacy mirror errors remain in strict validation");

  const completionRead = await bindFile(root,
    "catalog/completion-ledger.json");
  const releaseRead = await bindFile(root,
    "catalog/lesson-release-ledger.json");
  const completionLedger = JSON.parse(completionRead.bytes.toString("utf8"));
  const releaseLedger = JSON.parse(releaseRead.bytes.toString("utf8"));
  const diagnostic = completionLedger.diagnostics.find(({animationId}) =>
    animationId === ANIMATION_ID);
  assert.equal(completionLedger.validator.version, MIGRATION_VALIDATOR_VERSION);
  assert.equal(completionLedger.summary.migrationDirectories, 288);
  assert.equal(completionLedger.summary.strictComplete, 0);
  assert.equal(diagnostic.status, "preserved");
  assert.equal(diagnostic.errorCount, 93);
  assert.equal(releaseLedger.sources.completionLedger.sha256,
    completionRead.binding.sha256);
  assert.equal(releaseLedger.sources.completionLedger.generatedMarker,
    completionLedger.generatedMarker);
  assert.equal(releaseLedger.summary.releaseCount, 5);
  assert.equal(releaseLedger.summary.publishedReleaseCount, 0);
  assert.equal(releaseLedger.summary.memberCount, 265);
  assert.equal(releaseLedger.summary.strictCompleteMemberCount, 0);
  const release = releaseLedger.releases.find(({releaseId}) =>
    releaseId === RELEASE_ID);
  const member = release.members.find(({animationId}) =>
    animationId === ANIMATION_ID);
  assert.equal(release.expectedMemberCount, 46);
  assert.equal(release.strictCompleteCount, 0);
  assert.equal(release.missingCount, 46);
  assert.equal(release.published, false);
  assert.equal(release.gate.open, false);
  assert.equal(member.strictComplete, false);
  assert.equal(member.status, "missing");

  const scriptRelative = portable(path.relative(root, SCRIPT_PATH));
  const [script, test] = await Promise.all([
    bindFile(root, scriptRelative),
    bindFile(root, TEST_PATH),
  ]);
  const report = {
    schemaVersion: 1,
    artifactType:
      "g4-l10-vb003-candidate-asset-relocation-successor-v1",
    animationId: ANIMATION_ID,
    generatedForDate: "2026-08-22",
    status:
      "PASS_EXACT_CANDIDATE_ASSET_RELOCATION_VALIDATION_REPAIRED_CAPTURE_REMAINS_HISTORICAL_NO_AUTHORITY",
    decision:
      "KEEP_PREDECESSOR_IMMUTABLE_USE_EXACT_CANDIDATE_PROFILE_FOR_CURRENT_CLOSURE_DO_NOT_ADOPT_OR_PUBLISH",
    classification:
      "acceptance-neutral-currentness-successor-for-asset-storage-relocation-only",
    acceptanceEffect: "none",
    scope: {
      predecessorCaptureReadOnly: true,
      browserRecapturePerformed: false,
      originalRuntimeReadOrLaunchPerformed: false,
      candidateAssetWritePerformed: false,
      sourceAssetWritePerformed: false,
      migrationWorkspaceWritePerformed: false,
      registryWritePerformed: false,
      completionOrReleaseAdmissionPerformed: false,
    },
    predecessorCapture: predecessor,
    removedWorkbenchMirror: {
      canvas: oldCanvasAbsence,
      candidateManifest: oldManifestAbsence,
      historicalCaptureBindingsRewritten: false,
    },
    currentRelocation: {
      logicalCanvasPath: OLD_CANVAS_PATH,
      physicalCanvas: currentCanvas.binding,
      candidateEvidenceManifest: currentCandidateManifest.binding,
      candidateProfile: profile.binding,
      selectedProfileRecord: canvasResolution.record,
      selectedProfileAuthority: canvasResolution.profile.authority,
      oldAndCurrentCanvasBytesIdentical: true,
      oldAndCurrentCandidateManifestBytesIdentical: true,
      productionApprovalChanged: false,
      releaseEligibilityChanged: false,
      publicationChanged: false,
    },
    currentValidation: {
      validatorVersion: MIGRATION_VALIDATOR_VERSION,
      strictResult: "fail",
      errorCount: validation.errors.length,
      removedMirrorErrorCount: 0,
      implementationClosureRecomputed: true,
      implementationArtifactClosure,
      migration: migrationRead.binding,
    },
    ledgerState: {
      completionLedger: completionRead.binding,
      completionGeneratedMarker: completionLedger.generatedMarker,
      migrationDirectories: completionLedger.summary.migrationDirectories,
      strictComplete: completionLedger.summary.strictComplete,
      vb003Status: diagnostic.status,
      vb003ErrorCount: diagnostic.errorCount,
      lessonReleaseLedger: releaseRead.binding,
      releaseCount: releaseLedger.summary.releaseCount,
      publishedReleaseCount: releaseLedger.summary.publishedReleaseCount,
      memberCount: releaseLedger.summary.memberCount,
      strictCompleteMemberCount:
        releaseLedger.summary.strictCompleteMemberCount,
      l10ExpectedMemberCount: release.expectedMemberCount,
      l10StrictCompleteCount: release.strictCompleteCount,
      l10MissingCount: release.missingCount,
      l10Published: release.published,
      l10GateOpen: release.gate.open,
      vb003ReleaseMemberStatus: member.status,
    },
    authority: makeAuthorityBoundary(),
    selfIdentity: {
      script: script.binding,
      test: test.binding,
    },
    unresolved: [
      "The preserved diagnostic capture describes its historical renderer/input epoch and is not relabeled as a current browser capture.",
      "No authorized original-runtime natural trace, bilingual visual parity, audio listening acceptance, Replay parity, or full-frame original-runtime comparison is established.",
      "The remaining 93 strict validation failures are unchanged migration and acceptance obligations, not asset-storage failures.",
      "VB003 remains preserved and absent from strict completion; Lesson 10 remains 0/46 strict-complete, gate closed, and unpublished.",
    ],
  };
  report.reportFingerprintSha256 = fingerprint(report);
  validateReport(report);
  return {
    report,
    json: `${JSON.stringify(report, null, 2)}\n`,
    markdown: renderMarkdown(report),
  };
}

export function validateReport(report) {
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.animationId, ANIMATION_ID);
  assert.equal(report.status,
    "PASS_EXACT_CANDIDATE_ASSET_RELOCATION_VALIDATION_REPAIRED_CAPTURE_REMAINS_HISTORICAL_NO_AUTHORITY");
  assert.equal(report.acceptanceEffect, "none");
  assert.equal(report.predecessorCapture.captureCount, FRAME_COUNT);
  assert.equal(report.removedWorkbenchMirror.historicalCaptureBindingsRewritten,
    false);
  assert.equal(report.currentRelocation.physicalCanvas.path,
    CURRENT_CANVAS_PATH);
  assert.equal(report.currentRelocation.oldAndCurrentCanvasBytesIdentical, true);
  assert.equal(report.currentRelocation.productionApprovalChanged, false);
  assert.equal(report.currentValidation.errorCount, 93);
  assert.equal(report.currentValidation.removedMirrorErrorCount, 0);
  assert.equal(report.currentValidation.implementationClosureRecomputed, true);
  assert.equal(report.ledgerState.migrationDirectories, 288);
  assert.equal(report.ledgerState.strictComplete, 0);
  assert.equal(report.ledgerState.vb003ErrorCount, 93);
  assert.equal(report.ledgerState.publishedReleaseCount, 0);
  assert.equal(report.ledgerState.strictCompleteMemberCount, 0);
  assert.equal(report.ledgerState.l10ExpectedMemberCount, 46);
  assert.equal(report.ledgerState.l10StrictCompleteCount, 0);
  assert.equal(report.ledgerState.l10Published, false);
  assert.equal(report.ledgerState.l10GateOpen, false);
  assert.ok(Object.values(report.authority).every((value) => value === false));
  assert.equal(report.reportFingerprintSha256, fingerprint(report));
}

export function renderMarkdown(report) {
  return `# G4 L10 VB003 candidate-asset relocation successor v1\n\n` +
    `Status: **${report.status}**\n\n` +
    `The immutable 203-frame diagnostic capture remains byte-bound to its ` +
    `historical \`public/flash-assets\` paths and was not overwritten or ` +
    `relabelled as current. Its ${report.predecessorCapture.captureCount} PNG ` +
    `files were rehashed successfully.\n\n` +
    `The same Canvas bytes now resolve through the exact acceptance-neutral ` +
    `candidate profile to \`${report.currentRelocation.physicalCanvas.path}\` ` +
    `(SHA-256 \`${report.currentRelocation.physicalCanvas.sha256}\`). The old ` +
    `workbench mirror remains absent.\n\n` +
    `Strict validation now reports **${report.currentValidation.errorCount}** ` +
    `failures: the two storage-only errors are gone, while no migration or ` +
    `acceptance gate was waived. The completion ledger remains ` +
    `${report.ledgerState.strictComplete}/${report.ledgerState.migrationDirectories} ` +
    `strict-complete. Lesson 10 remains ` +
    `${report.ledgerState.l10StrictCompleteCount}/${report.ledgerState.l10ExpectedMemberCount}, ` +
    `gate closed and unpublished. All ${report.ledgerState.releaseCount} lesson ` +
    `releases remain unpublished.\n\n` +
    `This successor proves asset identity and current closure resolution only. ` +
    `It is not a browser recapture, original-runtime/fidelity/audio result, ` +
    `human or Owner acceptance, strict completion, release approval, promotion, ` +
    `or publication authority.\n\n` +
    `Report fingerprint: \`${report.reportFingerprintSha256}\`.\n`;
}

export async function checkReport(bundle, projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  for (const [relativePath, expected] of [
    [REPORT_JSON, bundle.json],
    [REPORT_MARKDOWN, bundle.markdown],
  ]) {
    await bindFile(root, relativePath, {
      bytes: Buffer.byteLength(expected),
      sha256: sha256(Buffer.from(expected)),
    }, "0444");
  }
  return {
    status: bundle.report.status,
    reportFingerprintSha256: bundle.report.reportFingerprintSha256,
    vb003ErrorCount: bundle.report.currentValidation.errorCount,
    strictComplete: bundle.report.ledgerState.strictComplete,
    publishedReleaseCount: bundle.report.ledgerState.publishedReleaseCount,
    acceptanceEffect: false,
  };
}

export async function writeNoClobber(bundle, projectRoot = PROJECT_ROOT) {
  const root = await canonicalRoot(projectRoot);
  const jsonPath = resolveInside(root, REPORT_JSON);
  const markdownPath = resolveInside(root, REPORT_MARKDOWN);
  for (const outputPath of [jsonPath, markdownPath]) {
    try {
      await lstat(outputPath);
      throw new Error(`Output already exists; refusing overwrite: ${portable(path.relative(root, outputPath))}`);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  let jsonCreated = false;
  let markdownCreated = false;
  try {
    await writeFile(jsonPath, bundle.json, {flag: "wx", mode: 0o600});
    jsonCreated = true;
    await chmod(jsonPath, 0o444);
    await writeFile(markdownPath, bundle.markdown, {flag: "wx", mode: 0o600});
    markdownCreated = true;
    await chmod(markdownPath, 0o444);
  } catch (error) {
    if (markdownCreated) await rm(markdownPath, {force: true});
    if (jsonCreated) await rm(jsonPath, {force: true});
    throw error;
  }
  return checkReport(bundle, root);
}

export function parseCli(args) {
  assert.equal(args.length, 1,
    "Choose exactly one of --dry-run, --write-no-clobber, or --check");
  assert.ok(["--dry-run", "--write-no-clobber", "--check"].includes(args[0]),
    "Expected --dry-run, --write-no-clobber, or --check");
  return args[0];
}

async function main() {
  const mode = parseCli(process.argv.slice(2));
  const bundle = await buildBundle();
  const result = mode === "--dry-run"
    ? {
        status: bundle.report.status,
        reportFingerprintSha256: bundle.report.reportFingerprintSha256,
        vb003ErrorCount: bundle.report.currentValidation.errorCount,
        acceptanceEffect: false,
      }
    : mode === "--write-no-clobber"
      ? await writeNoClobber(bundle)
      : await checkReport(bundle);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  await main();
}
