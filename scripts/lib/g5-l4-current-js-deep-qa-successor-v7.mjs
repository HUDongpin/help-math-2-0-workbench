import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstat, readFile, realpath} from "node:fs/promises";
import path from "node:path";

import {
  PACKAGE_BASENAME,
  PACKAGE_ID as V7_PACKAGE_ID,
  RELEASE_ID as V7_RELEASE_ID,
  assertManifestBoundary,
  buildCurrentPackageInputSnapshot,
  selectG5L4Release,
} from "../build-g5-l4-whole-lesson-package-mvp-v7.mjs";
import {
  ACCEPTANCE_EFFECTS as RAW_ACCEPTANCE_EFFECTS,
  REMEDIATION_IDS,
  REPORT_TYPE,
  SCOPE_RESULT_PASS,
  validateReportBoundary,
} from "../qa-g5-l4-v7-deep-product.mjs";

export const RELEASE_ID = V7_RELEASE_ID;
export const PACKAGE_ID = V7_PACKAGE_ID;
export const RAW_REPORT_ID =
  "g5-l4-whole-lesson-package-mvp-v7-deep-product-qa-2026-08-01-r2";
export const RAW_REPORT_PATH = `reports/${RAW_REPORT_ID}.json`;
export const RAW_MARKDOWN_PATH = `reports/${RAW_REPORT_ID}.md`;
export const RAW_ARTIFACT_ROOT = `output/playwright/${RAW_REPORT_ID}`;
export const RAW_RUNNER_PATH = "scripts/qa-g5-l4-v7-deep-product.mjs";
export const RAW_RUNNER_TEST_PATH =
  "scripts/qa-g5-l4-v7-deep-product.test.mjs";

export const FQ_RECEIPT_ID =
  "g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r6";
export const WHOLE_RECEIPT_ID =
  "g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r6";
export const FQ_RECEIPT_PATH = `reports/${FQ_RECEIPT_ID}.json`;
export const FQ_MARKDOWN_PATH = `reports/${FQ_RECEIPT_ID}.md`;
export const WHOLE_RECEIPT_PATH = `reports/${WHOLE_RECEIPT_ID}.json`;
export const WHOLE_MARKDOWN_PATH = `reports/${WHOLE_RECEIPT_ID}.md`;

export const FQ_PREDECESSOR_PATH =
  "reports/g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r5.json";
export const FQ_PREDECESSOR_MARKDOWN_PATH =
  "reports/g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r5.md";
export const WHOLE_PREDECESSOR_PATH =
  "reports/g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r5.json";
export const WHOLE_PREDECESSOR_MARKDOWN_PATH =
  "reports/g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r5.md";

export const FQ_MEMBERS = Object.freeze([
  "course-g05-l04-fq-002",
  "course-g05-l04-fq-003",
]);

export const V7_PACKAGE_PATHS = Object.freeze({
  smokeReport:
    "reports/g5-l4-whole-lesson-package-mvp-v7-smoke.json",
  archive: `outputs/${PACKAGE_BASENAME}.zip`,
  archiveSha256: `outputs/${PACKAGE_BASENAME}.zip.sha256`,
  packageManifest: `outputs/${PACKAGE_BASENAME}/package-manifest.json`,
});

export const EXPECTED_ASSERTION_COUNTS = Object.freeze({
  layout: 648,
  identity: 648,
  overflow: 648,
  reducedMotionObservations: 108,
  reducedMotionSamples: 324,
  replayActivations: 324,
  map: 4,
  keyTerms: 4,
  fq: 4,
  persistence: 2,
  remediations: 4,
});

export const RESOLVED_REMEDIATIONS = Object.freeze([
  Object.freeze({
    id: "reduced-motion-note-does-not-intercept-pointer",
    predecessorFinding:
      "Reduced-motion note pointer interception can block stage interaction.",
  }),
  Object.freeze({
    id: "vb004-spanish-app-owned-ui-localized-source-runtime-english",
    predecessorFinding:
      "VB004 Spanish modern UI, ARIA, and feedback remain English.",
  }),
  Object.freeze({
    id: "mobile-390-legacy-exit-inside-stage",
    predecessorFinding:
      "The Exit hit target is clipped at the 390 px viewport.",
  }),
  Object.freeze({
    id: "course-map-same-current-page-reselect-focuses-heading",
    predecessorFinding:
      "Course Map same-page selection loses focus to the document body.",
  }),
]);

assert.deepEqual(
  RESOLVED_REMEDIATIONS.map(({id}) => id),
  [...REMEDIATION_IDS],
  "The successor remediation order must match the v7 raw runner",
);

export const ACCEPTANCE_EFFECTS = Object.freeze({
  productQaComplete: false,
  migrationQaComplete: false,
  authoritativeOriginalRuntime: false,
  naturalNavigationCausalityEstablished: false,
  spanishSourceVisualParityEstablished: false,
  audioAccepted: false,
  fullFrameRmseAccepted: false,
  independentHumanVisualReviewAccepted: false,
  ownerFidelityAccepted: false,
  strictComplete: false,
  externalDeploymentAuthorized: false,
  publicReleaseAuthorized: false,
  published: false,
});

export const AUTHORITY_BOUNDARY = Object.freeze({
  evidenceLayer: "current-javascript-machine-product-qa-only",
  acceptanceNeutral: true,
  strictAcceptanceEffect: "none",
  authoritativeOriginalRuntimeAuthority: false,
  audioAuthority: false,
  humanReviewAuthority: false,
  ownerAuthority: false,
  strictCompletionAuthority: false,
  publicationAuthority: false,
});

export const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
export const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");

function within(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function assertRelativeFilePath(relativePath) {
  assert.equal(typeof relativePath, "string");
  assert.equal(relativePath.length > 0, true);
  assert.equal(path.isAbsolute(relativePath), false);
  assert.equal(relativePath.includes("\\"), false);
  assert.equal(relativePath.split("/").includes(".."), false);
  return relativePath;
}

export async function bindingFor(root, relativePath, extras = {}) {
  assertRelativeFilePath(relativePath);
  const absolutePath = path.resolve(root, relativePath);
  assert.equal(within(root, absolutePath), true);
  const [metadata, canonicalRoot, canonicalPath] = await Promise.all([
    lstat(absolutePath),
    realpath(root),
    realpath(absolutePath),
  ]);
  assert.equal(metadata.isFile(), true, `${relativePath} is not a file`);
  assert.equal(metadata.isSymbolicLink(), false, `${relativePath} is a symlink`);
  assert.equal(within(canonicalRoot, canonicalPath), true);
  const bytes = await readFile(absolutePath);
  return {
    path: relativePath,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
    ...extras,
  };
}

export function validateBindingShape(binding, label = "binding") {
  assert.equal(binding && typeof binding === "object", true, `${label} missing`);
  assertRelativeFilePath(binding.path);
  assert.equal(Number.isSafeInteger(binding.bytes), true, `${label}.bytes`);
  assert.equal(binding.bytes > 0, true, `${label}.bytes`);
  assert.match(binding.sha256, /^[0-9a-f]{64}$/, `${label}.sha256`);
  return true;
}

export async function verifyBinding(root, binding) {
  validateBindingShape(binding);
  const actual = await bindingFor(root, binding.path);
  assert.equal(actual.bytes, binding.bytes, `${binding.path}: byte drift`);
  assert.equal(actual.sha256, binding.sha256, `${binding.path}: hash drift`);
  return readFile(path.resolve(root, binding.path));
}

function assertBooleanFalseObject(record, expected, label) {
  assert.equal(record && typeof record === "object", true, `${label} missing`);
  assert.deepEqual(Object.keys(record).sort(), Object.keys(expected).sort());
  assert.equal(Object.prototype.hasOwnProperty.call(record, "acceptanceNeutral"), false);
  assert.equal(
    Object.prototype.hasOwnProperty.call(record, "strictAcceptanceEffect"),
    false,
  );
  for (const [key, value] of Object.entries(record)) {
    assert.equal(typeof value, "boolean", `${label}.${key} must be boolean`);
    assert.equal(value, false, `${label}.${key} must remain false`);
  }
  return true;
}

export function assertAcceptanceEffects(record, label = "acceptanceEffects") {
  return assertBooleanFalseObject(record, ACCEPTANCE_EFFECTS, label);
}

export function assertRawAcceptanceEffects(record) {
  return assertBooleanFalseObject(
    record,
    RAW_ACCEPTANCE_EFFECTS,
    "raw.acceptanceEffects",
  );
}

export function assertAuthorityBoundary(record) {
  assert.deepEqual(record, AUTHORITY_BOUNDARY);
  return true;
}

export function validateSnapshot(snapshot, label = "snapshot") {
  assert.equal(snapshot && typeof snapshot === "object", true, `${label} missing`);
  assert.equal(Number.isSafeInteger(snapshot.fileCount), true, `${label}.fileCount`);
  assert.equal(snapshot.fileCount > 0, true, `${label}.fileCount`);
  assert.equal(Number.isSafeInteger(snapshot.totalBytes), true, `${label}.totalBytes`);
  assert.equal(snapshot.totalBytes > 0, true, `${label}.totalBytes`);
  assert.match(snapshot.sha256, /^[0-9a-f]{64}$/, `${label}.sha256`);
  return true;
}

function validateRawCounts(counts) {
  for (const [key, expected] of Object.entries(EXPECTED_ASSERTION_COUNTS)) {
    assert.deepEqual(
      counts?.[key],
      {passed: expected, failed: 0},
      `raw.assertionCounts.${key}`,
    );
  }
}

function validateRawFreshClaims(claims) {
  for (const key of [
    "deepQaFreshlyPerformed",
    "freshUnzip",
    "packageVerifierBeforeAndAfter",
    "dynamicLoopbackServer",
    "sourceCurrentAtObservation",
    "exactReleaseOrder",
    "layout",
    "reducedMotion",
    "replayMouseEnterSpace",
    "map",
    "keyTerms",
    "fq",
    "persistence",
    "directUrlBoundary",
    "networkBoundary",
    "allFourV7Remediations",
  ]) assert.equal(claims?.[key], true, `raw.freshClaims.${key}`);
  assert.equal(claims?.perPageDirectUrl, false);
}

function validateRawMap(raw) {
  assert.equal(raw.support?.map?.length, 4);
  for (const [index, entry] of raw.support.map.entries()) {
    assert.equal(entry.passed, true, `raw.support.map.${index}.passed`);
    assert.equal(
      entry.samePageFocusPassed,
      true,
      `raw.support.map.${index}.samePageFocusPassed`,
    );
    assert.equal(entry.samePageFocus?.tagName, "H1");
    assert.equal(entry.samePageFocus?.insidePageHeading, true);
    assert.equal(entry.differentPageFocusPassed, true);
    assert.equal(entry.differentPageFocus?.tagName, "H1");
    assert.equal(entry.differentPageFocus?.insidePageHeading, true);
  }
}

function validateRawRemediations(raw) {
  assert.equal(raw.remediationChecks?.length, 4);
  assert.deepEqual(
    raw.remediationChecks.map(({id}) => id),
    RESOLVED_REMEDIATIONS.map(({id}) => id),
  );
  for (const check of raw.remediationChecks) {
    assert.equal(check.passed, true, `${check.id}.passed`);
    assert.equal(check.acceptanceEffect, "none", `${check.id}.acceptanceEffect`);
    assert.equal(check.evidence && typeof check.evidence === "object", true);
  }
}

export function validateRawV7DeepQaReport(raw) {
  assert.equal(raw?.schemaVersion, 1);
  assert.equal(raw.reportType, REPORT_TYPE);
  assert.equal(raw.packageId, PACKAGE_ID);
  assert.equal(raw.status, "pass-current-javascript-deep-product-qa");
  assert.deepEqual(validateReportBoundary(raw), []);
  assertRawAcceptanceEffects(raw.acceptanceEffects);
  assert.equal(raw.authorityBoundary?.acceptanceNeutral, true);
  assert.equal(raw.authorityBoundary?.strictAcceptanceEffect, "none");
  for (const [key, value] of Object.entries(raw.authorityBoundary ?? {})) {
    if (key.endsWith("Authority")) assert.equal(value, false, key);
  }
  assert.deepEqual(raw.scopeResult, SCOPE_RESULT_PASS);
  assert.equal(raw.releaseBoundary?.expectedMembers, 55);
  assert.equal(raw.releaseBoundary?.strictCompleteCount, 0);
  assert.equal(raw.releaseBoundary?.missingCount, 55);
  assert.equal(raw.releaseBoundary?.published, false);

  const source = raw.sourceObservation;
  assert.equal(source?.sourceCurrentAtObservation, true);
  assert.equal(source?.manifestBuildSnapshotsEqual, true);
  assert.equal(source?.unchangedThroughoutQa, true);
  assert.equal(source?.currentWorkspaceSourceUsedToServeQa, false);
  assert.equal(source?.qaRuntimeSource, "fresh-unzip-hash-bound-v7-archive");
  assert.equal(source?.acceptanceEffect, "none");
  validateSnapshot(source?.packageSnapshot, "raw.source.packageSnapshot");
  assert.deepEqual(source.currentSnapshot, source.packageSnapshot);
  assert.deepEqual(source.currentSnapshotAtStart, source.packageSnapshot);
  assert.deepEqual(source.currentSnapshotAtEnd, source.packageSnapshot);
  assert.deepEqual(source.delta, {
    fileCount: 0,
    totalBytes: 0,
    sha256Changed: false,
  });

  validateRawCounts(raw.assertionCounts);
  validateRawFreshClaims(raw.freshClaims);
  validateRawMap(raw);
  validateRawRemediations(raw);
  assert.equal(raw.failures?.length, 0);
  assert.equal(raw.network?.passed, true);
  assert.equal(raw.freshUnzip?.packageSource, "hash-bound-v7-zip-only");
  assert.equal(raw.freshUnzip?.currentWorkspaceSourceServed, false);
  assert.equal(raw.freshUnzip?.archiveEntriesSafetyCheckedInFull, true);
  assert.equal(raw.freshUnzip?.loopback?.dynamicPort, true);
  assert.equal(raw.freshUnzip?.loopback?.listenerOwnedBySpawnedChild, true);
  assert.equal(raw.packageVerifier?.before?.status, 0);
  assert.equal(raw.packageVerifier?.after?.status, 0);
  assert.equal(raw.outputBindings?.json?.path, RAW_REPORT_PATH);
  assert.equal(raw.outputBindings?.markdown?.path, RAW_MARKDOWN_PATH);
  assert.equal(raw.outputBindings?.artifactDirectory, RAW_ARTIFACT_ROOT);
  return true;
}

function bindingTuple(binding) {
  return {
    path: binding?.path,
    bytes: binding?.bytes,
    sha256: binding?.sha256,
  };
}

function assertBindingMatches(actual, expected, label) {
  validateBindingShape(actual, label);
  assert.deepEqual(bindingTuple(actual), bindingTuple(expected), label);
}

function assertAllFalse(record, label) {
  assert.equal(record && typeof record === "object", true, `${label} missing`);
  assert.equal(Object.keys(record).length > 0, true, `${label} empty`);
  for (const [key, value] of Object.entries(record)) {
    assert.equal(value, false, `${label}.${key}`);
  }
}

export async function collectV7DeepQaEvidence({root}) {
  const report = await bindingFor(root, RAW_REPORT_PATH, {
    role: "v7-r1-fresh-unzip-deep-product-qa-raw-report",
  });
  const markdown = await bindingFor(root, RAW_MARKDOWN_PATH, {
    role: "v7-r1-fresh-unzip-deep-product-qa-human-boundary",
  });
  const runner = await bindingFor(root, RAW_RUNNER_PATH, {
    role: "v7-deep-product-qa-runner",
  });
  const runnerTest = await bindingFor(root, RAW_RUNNER_TEST_PATH, {
    role: "v7-deep-product-qa-runner-test",
  });
  const raw = JSON.parse(await readFile(path.resolve(root, RAW_REPORT_PATH), "utf8"));
  validateRawV7DeepQaReport(raw);
  assertBindingMatches(raw.generatorBinding, runner, "raw.generatorBinding");
  assertBindingMatches(raw.testBinding, runnerTest, "raw.testBinding");
  assert.deepEqual(bindingTuple(raw.outputBindings.markdown), bindingTuple(markdown));

  const artifactBindings = [];
  for (const artifact of raw.artifacts ?? []) {
    assert.equal(artifact.path.startsWith(`${RAW_ARTIFACT_ROOT}/`), true);
    const actual = await bindingFor(root, artifact.path);
    assertBindingMatches(artifact, actual, `raw.artifact.${artifact.path}`);
    artifactBindings.push(actual);
  }
  assert.equal(artifactBindings.length > 0, true, "raw artifacts are missing");

  const smokeReport = await bindingFor(root, V7_PACKAGE_PATHS.smokeReport, {
    role: "v7-fresh-unzip-smoke",
  });
  const archive = await bindingFor(root, V7_PACKAGE_PATHS.archive, {
    role: "immutable-v7-private-preview-archive",
  });
  const archiveSha256 = await bindingFor(root, V7_PACKAGE_PATHS.archiveSha256, {
    role: "v7-archive-sha256-sidecar",
  });
  const packageManifest = await bindingFor(root, V7_PACKAGE_PATHS.packageManifest, {
    role: "v7-package-manifest",
  });
  assertBindingMatches(raw.archiveBinding, archive, "raw.archiveBinding");
  assertBindingMatches(raw.archiveSidecarBinding, archiveSha256, "raw.archiveSidecarBinding");
  assert.deepEqual(
    {bytes: raw.packageManifestBinding?.bytes, sha256: raw.packageManifestBinding?.sha256},
    {bytes: packageManifest.bytes, sha256: packageManifest.sha256},
  );
  assert.equal(
    raw.packageManifestBinding?.path,
    `${PACKAGE_BASENAME}/package-manifest.json`,
  );
  assert.equal(raw.freshUnzip.archiveSidecarSha256, archive.sha256);
  const sidecar = (await readFile(path.resolve(root, archiveSha256.path), "utf8"))
    .trim().split(/\s+/);
  assert.equal(sidecar[0], archive.sha256);
  assert.equal(sidecar[1], path.basename(archive.path));

  const manifest = JSON.parse(
    await readFile(path.resolve(root, packageManifest.path), "utf8"),
  );
  assertManifestBoundary(manifest);
  assert.equal(manifest.packageId, PACKAGE_ID);
  assert.deepEqual(manifest.build?.inputSnapshotBefore, raw.sourceObservation.packageSnapshot);
  assert.deepEqual(manifest.build?.inputSnapshotAfter, raw.sourceObservation.packageSnapshot);

  const smoke = JSON.parse(
    await readFile(path.resolve(root, smokeReport.path), "utf8"),
  );
  assert.equal(smoke.packageId, PACKAGE_ID);
  assert.equal(smoke.status, "pass-current-javascript-private-preview");
  assert.equal(smoke.freshArchiveExtraction, true);
  assert.equal(smoke.release?.strictCompleteCount, 0);
  assert.equal(smoke.release?.missingCount, 55);
  assert.equal(smoke.release?.published, false);
  assert.equal(smoke.packageManifestSha256, packageManifest.sha256);
  assert.deepEqual(bindingTuple(smoke.archive), bindingTuple(archive));
  assertAllFalse(smoke.authority, "smoke.authority");

  const releaseDocument = JSON.parse(await readFile(
    path.resolve(root, "catalog/lesson-releases.json"),
    "utf8",
  ));
  const release = selectG5L4Release(releaseDocument);
  const currentSnapshotAtAssembly = await buildCurrentPackageInputSnapshot(release);
  assert.deepEqual(
    currentSnapshotAtAssembly,
    raw.sourceObservation.packageSnapshot,
    "v7 package source snapshot drifted before r6 assembly",
  );

  return {
    packageEvidence: {
      packageId: PACKAGE_ID,
      smokeReport,
      archive,
      archiveSha256,
      packageManifest,
      packageSourceSnapshot: raw.sourceObservation.packageSnapshot,
      currentSourceSnapshotAtRawObservation: raw.sourceObservation.currentSnapshot,
      currentSourceSnapshotAtSuccessorAssembly: currentSnapshotAtAssembly,
      sourceCurrentAtObservation: true,
      sourceCurrentAtSuccessorAssembly: true,
      sourceUnchangedThroughoutRawQa: true,
      freshArchiveExtraction: true,
      qaRuntimeSource: "fresh-unzip-hash-bound-v7-archive",
      authorityBoundary: {...AUTHORITY_BOUNDARY},
    },
    rawDeepQaEvidence: {
      report,
      markdown,
      runner,
      runnerTest,
      artifactBindings,
      status: raw.status,
      assertionCounts: raw.assertionCounts,
      freshClaims: raw.freshClaims,
      remediationChecks: raw.remediationChecks.map(({id, passed, acceptanceEffect}) => ({
        id,
        passed,
        acceptanceEffect,
      })),
      mapFocus: raw.support.map.map((entry) => ({
        locale: entry.locale,
        viewport: entry.viewport,
        samePageAnimationId: entry.samePageAnimationId,
        samePageFocusPassed: entry.samePageFocusPassed,
        differentPageAnimationId: entry.differentPageAnimationId,
        differentPageFocusPassed: entry.differentPageFocusPassed,
      })),
    },
    raw,
    smoke,
    manifest,
  };
}

export function freshV7ResolutionFromRaw(raw) {
  validateRawV7DeepQaReport(raw);
  return RESOLVED_REMEDIATIONS.map(({id, predecessorFinding}) => ({
    id,
    predecessorFinding,
    predecessorFindingObserved: true,
    predecessorClaimsCarriedForward: false,
    freshV7Resolved: true,
    rawCheckPassed: true,
    acceptanceEffect: "none",
  }));
}

function expectedPredecessor(kind) {
  if (kind === "fq23-companion") {
    return {
      receipt: FQ_PREDECESSOR_PATH,
      markdown: FQ_PREDECESSOR_MARKDOWN_PATH,
    };
  }
  return {
    receipt: WHOLE_PREDECESSOR_PATH,
    markdown: WHOLE_PREDECESSOR_MARKDOWN_PATH,
  };
}

function validatePackageEvidence(evidence) {
  assert.equal(evidence?.packageId, PACKAGE_ID);
  for (const key of ["smokeReport", "archive", "archiveSha256", "packageManifest"]) {
    validateBindingShape(evidence[key], `packageEvidence.${key}`);
  }
  validateSnapshot(evidence.packageSourceSnapshot, "packageSourceSnapshot");
  assert.deepEqual(
    evidence.currentSourceSnapshotAtRawObservation,
    evidence.packageSourceSnapshot,
  );
  assert.deepEqual(
    evidence.currentSourceSnapshotAtSuccessorAssembly,
    evidence.packageSourceSnapshot,
  );
  assert.equal(evidence.sourceCurrentAtObservation, true);
  assert.equal(evidence.sourceCurrentAtSuccessorAssembly, true);
  assert.equal(evidence.sourceUnchangedThroughoutRawQa, true);
  assert.equal(evidence.freshArchiveExtraction, true);
  assert.equal(evidence.qaRuntimeSource, "fresh-unzip-hash-bound-v7-archive");
  assertAuthorityBoundary(evidence.authorityBoundary);
}

function validateRawEvidence(raw) {
  for (const [key, expectedPath] of Object.entries({
    report: RAW_REPORT_PATH,
    markdown: RAW_MARKDOWN_PATH,
    runner: RAW_RUNNER_PATH,
    runnerTest: RAW_RUNNER_TEST_PATH,
  })) {
    validateBindingShape(raw?.[key], `rawDeepQaEvidence.${key}`);
    assert.equal(raw[key].path, expectedPath);
  }
  assert.equal(raw.status, "pass-current-javascript-deep-product-qa");
  validateRawCounts(raw.assertionCounts);
  validateRawFreshClaims(raw.freshClaims);
  assert.equal(raw.remediationChecks?.length, 4);
  assert.deepEqual(
    raw.remediationChecks.map(({id}) => id),
    RESOLVED_REMEDIATIONS.map(({id}) => id),
  );
  assert.equal(raw.remediationChecks.every(({passed}) => passed === true), true);
  assert.equal(raw.mapFocus?.length, 4);
  assert.equal(
    raw.mapFocus.every(({samePageFocusPassed, differentPageFocusPassed}) =>
      samePageFocusPassed === true && differentPageFocusPassed === true),
    true,
  );
  assert.equal(Array.isArray(raw.artifactBindings), true);
  assert.equal(raw.artifactBindings.length > 0, true);
}

function validateSuccessorMarkdownBinding(receipt, kind) {
  const expected = kind === "fq23-companion"
    ? {
      path: FQ_MARKDOWN_PATH,
      role: "human-readable-r6-fq23-companion-deep-qa-successor-boundary",
    }
    : {
      path: WHOLE_MARKDOWN_PATH,
      role: "human-readable-r6-whole-lesson-product-deep-qa-successor-boundary",
    };
  const candidates = (receipt.artifacts ?? []).filter(({path: artifactPath}) =>
    artifactPath === expected.path
  );
  assert.equal(
    candidates.length,
    1,
    `${kind} successor must bind exactly one corresponding Markdown artifact`,
  );
  validateBindingShape(candidates[0], `${kind}.successorMarkdown`);
  assert.equal(
    candidates[0].role,
    expected.role,
    `${kind}.successorMarkdown.role`,
  );
  return candidates[0];
}

function validateCommonSuccessor(receipt, kind) {
  assert.equal(receipt?.schemaVersion, 4);
  assert.equal(receipt.releaseId, RELEASE_ID);
  assert.equal(receipt.packageId, PACKAGE_ID);
  assert.equal(receipt.status, "pass-current-javascript-deep-product-qa");
  assert.equal(
    receipt.receiptId,
    kind === "fq23-companion" ? FQ_RECEIPT_ID : WHOLE_RECEIPT_ID,
  );
  assert.equal(receipt.evidenceAssembledOn, "2026-08-01");
  assertAuthorityBoundary(receipt.authorityBoundary);
  assertAcceptanceEffects(receipt.acceptanceEffects);
  assert.equal(receipt.scope?.networkBoundary, "loopback-only-local-preview");
  assert.equal(receipt.scope?.previewClass, "private-controlled-ceo-preview");
  assert.equal(receipt.scope?.packageId, PACKAGE_ID);
  assert.equal(receipt.scope?.g4L3Port3216Touched, false);
  assert.equal(receipt.scope?.externalDeploymentPerformed, false);
  validatePackageEvidence(receipt.packageEvidence);

  const predecessor = expectedPredecessor(kind);
  validateBindingShape(receipt.predecessorEvidence?.receipt);
  validateBindingShape(receipt.predecessorEvidence?.markdown);
  assert.equal(receipt.predecessorEvidence.receipt.path, predecessor.receipt);
  assert.equal(receipt.predecessorEvidence.markdown.path, predecessor.markdown);
  assert.equal(receipt.predecessorEvidence.immediatePredecessor, true);
  assert.equal(receipt.predecessorEvidence.currentAuthority, false);
  assert.equal(receipt.predecessorEvidence.claimsCarriedForward, false);
  assert.equal(receipt.predecessorEvidence.supersededByFreshV7RawR1, true);

  validateRawEvidence(receipt.rawDeepQaEvidence);
  assert.deepEqual(
    receipt.resolvedRemediations.map(({id}) => id),
    RESOLVED_REMEDIATIONS.map(({id}) => id),
  );
  assert.equal(receipt.resolvedRemediations.length, 4);
  for (const resolution of receipt.resolvedRemediations) {
    assert.equal(resolution.predecessorFindingObserved, true);
    assert.equal(resolution.predecessorClaimsCarriedForward, false);
    assert.equal(resolution.freshV7Resolved, true);
    assert.equal(resolution.rawCheckPassed, true);
    assert.equal(resolution.acceptanceEffect, "none");
  }
  assert.equal(Array.isArray(receipt.sourceBindings), true);
  assert.equal(Array.isArray(receipt.artifacts), true);
  validateSuccessorMarkdownBinding(receipt, kind);
  assert.equal(receipt.scopeResult?.deepQaFreshlyPerformed, true);
  assert.equal(
    receipt.scopeResult?.currentJavascriptDeepProductQaMachineWorkExhausted,
    true,
  );
  assert.equal(receipt.scopeResult?.sourceSnapshotCurrent, true);
  assert.equal(receipt.scopeResult?.allFourPredecessorFindingsFreshV7Resolved, true);
  assert.equal(receipt.scopeResult?.mapSamePageReselectFocusPassed, true);
  assert.equal(receipt.scopeResult?.productQaComplete, false);
  assert.equal(receipt.scopeResult?.migrationQaComplete, false);
  assert.equal(receipt.scopeResult?.strictComplete, false);
  assert.equal(receipt.scopeResult?.published, false);
  return true;
}

export function validateFqDeepQaSuccessorV7(receipt) {
  validateCommonSuccessor(receipt, "fq23-companion");
  assert.equal(
    receipt.evidenceType,
    "g5-l4-current-js-fq23-companion-deep-qa-successor-receipt",
  );
  assert.deepEqual(receipt.scope.members, FQ_MEMBERS);
  assert.equal(receipt.scopeResult.currentJavascriptFq23DeepQaFreshlyPerformed, true);
  assert.equal(receipt.scopeResult.exactReleaseOrderFreshlyEstablished, true);
  assert.equal(receipt.scopeResult.fqInteractionFreshlyReperformed, true);
  return true;
}

export function validateWholeLessonDeepQaSuccessorV7(receipt) {
  validateCommonSuccessor(receipt, "whole-lesson-product");
  assert.equal(
    receipt.evidenceType,
    "g5-l4-current-js-whole-lesson-product-deep-qa-successor-receipt",
  );
  assert.deepEqual(
    {
      releaseMembers: receipt.scope.releaseMembers,
      activePages: receipt.scope.activePages,
      courseShells: receipt.scope.courseShells,
    },
    {releaseMembers: 55, activePages: 54, courseShells: 1},
  );
  assert.equal(receipt.childReceipts?.length, 1);
  validateBindingShape(receipt.childReceipts[0]);
  assert.equal(receipt.childReceipts[0].path, FQ_RECEIPT_PATH);
  for (const key of [
    "exactReleaseOrderFreshlyEstablished",
    "layoutAssertionsFreshlyPassed",
    "identityAssertionsFreshlyPassed",
    "overflowAssertionsFreshlyPassed",
    "reducedMotionAssertionsFreshlyPassed",
    "replayAssertionsFreshlyPassed",
    "courseMapInteractionFreshlyReperformed",
    "mapDifferentPageFocusPassed",
    "mapSamePageReselectFocusPassed",
    "keyTermsInteractionFreshlyReperformed",
    "fqInteractionFreshlyReperformed",
    "crossLocalePersistenceFreshlyReperformed",
  ]) assert.equal(receipt.scopeResult[key], true, `scopeResult.${key}`);
  assert.equal(receipt.scopeResult.perPageDirectUrlAvailable, false);
  return true;
}
