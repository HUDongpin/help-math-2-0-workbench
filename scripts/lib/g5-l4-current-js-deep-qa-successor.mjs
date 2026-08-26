import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstat, readFile, realpath} from "node:fs/promises";
import path from "node:path";

import {assertManifestBoundary} from
  "../build-g5-l4-whole-lesson-package-mvp.mjs";

export const RELEASE_ID = "lesson-g05-l04-number-lines";
export const PACKAGE_ID = "g5-l4-whole-lesson-package-mvp-v6";
export const FAILED_RAW_REPORT_ID =
  "g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r1";
export const FAILED_RAW_REPORT_PATH = `reports/${FAILED_RAW_REPORT_ID}.json`;
export const FAILED_RAW_MARKDOWN_PATH = `reports/${FAILED_RAW_REPORT_ID}.md`;
export const FAILED_RAW_R2_REPORT_ID =
  "g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r2";
export const FAILED_RAW_R2_REPORT_PATH =
  `reports/${FAILED_RAW_R2_REPORT_ID}.json`;
export const FAILED_RAW_R2_MARKDOWN_PATH =
  `reports/${FAILED_RAW_R2_REPORT_ID}.md`;
export const FAILED_RAW_R3_REPORT_ID =
  "g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r3";
export const FAILED_RAW_R3_REPORT_PATH =
  `reports/${FAILED_RAW_R3_REPORT_ID}.json`;
export const FAILED_RAW_R3_MARKDOWN_PATH =
  `reports/${FAILED_RAW_R3_REPORT_ID}.md`;
export const RAW_REPORT_ID =
  "g5-l4-whole-lesson-package-mvp-v6-deep-product-qa-2026-08-01-r4";
export const RAW_REPORT_PATH = `reports/${RAW_REPORT_ID}.json`;
export const RAW_MARKDOWN_PATH = `reports/${RAW_REPORT_ID}.md`;
export const RAW_RUNNER_PATH = "scripts/qa-g5-l4-v6-deep-product.mjs";
export const RAW_RUNNER_TEST_PATH =
  "scripts/qa-g5-l4-v6-deep-product.test.mjs";

export const FQ_MEMBERS = Object.freeze([
  "course-g05-l04-fq-002",
  "course-g05-l04-fq-003",
]);

export const V6_PACKAGE_SOURCE_SNAPSHOT = Object.freeze({
  fileCount: 537,
  totalBytes: 189628108,
  sha256: "f8e506deb23dfd1c2c9d231d1c80470cab4df9ae91992409d29fc6dc293d955a",
});

export const CURRENT_SOURCE_SNAPSHOT = Object.freeze({
  fileCount: 537,
  totalBytes: 189628204,
  sha256: "88e39500a536fd8dae91cf1b907734c6ab88d8b665a7e5562f7b43604b6a2484",
});

export const EXPECTED_ASSERTION_COUNTS = Object.freeze({
  layout: Object.freeze({observations: 648, passed: 648, failed: 0}),
  identity: Object.freeze({observations: 648, passed: 648, failed: 0}),
  overflow: Object.freeze({observations: 648, passed: 648, failed: 0}),
  reducedMotion: Object.freeze({rows: 108, samples: 324, failed: 0}),
  replay: Object.freeze({activations: 324, passed: 324, failed: 0}),
});

export const EXPECTED_FRESH_CLAIMS = Object.freeze({
  exactReleaseOrder: true,
  mapInteractionFreshlyReperformed: true,
  mapDifferentPageFocusPassed: true,
  mapSamePageReselectFocusPassed: false,
  keyTerms: true,
  fq: true,
  persistence: true,
});

export const KNOWN_REMEDIATIONS_REQUIRED = Object.freeze([
  "Reduced-motion note pointer interception can block stage interaction.",
  "VB004 Spanish modern UI, ARIA, and feedback remain English.",
  "The Exit hit target is clipped at the 390 px viewport.",
  "Course Map same-page selection loses focus to the document body.",
]);

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

export const RAW_ACCEPTANCE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntimeAccepted: false,
  originalRuntimeFullFrameAccepted: false,
  originalRuntimeNaturalTraversalAccepted: false,
  audioAccepted: false,
  humanAudioAccepted: false,
  humanVisualAccepted: false,
  rmseAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  lessonStrictComplete: false,
  publicReleaseAuthorized: false,
  published: false,
});

export const V6_FIXED_BINDINGS = Object.freeze({
  smokeReport: Object.freeze({
    path: "reports/g5-l4-whole-lesson-package-mvp-v6-smoke.json",
    bytes: 3638,
    sha256: "291f14d8ace623980bd263d45ab6633a2f42c0a1410915f6fa9784ee74436301",
  }),
  archive: Object.freeze({
    path: "outputs/g5-l4-whole-lesson-package-mvp-v6-darwin-arm64.zip",
    bytes: 38556629,
    sha256: "6c642f4081466ec826bb79a3525e30b701940c184a5a50bb74afba912c83ef85",
  }),
  archiveSha256: Object.freeze({
    path: "outputs/g5-l4-whole-lesson-package-mvp-v6-darwin-arm64.zip.sha256",
    bytes: 117,
    sha256: "5253c44a0e7c5563f3109a14ebc65aecae776d39fed6837b0755d44146523e67",
  }),
  packageManifest: Object.freeze({
    path:
      "outputs/g5-l4-whole-lesson-package-mvp-v6-darwin-arm64/package-manifest.json",
    bytes: 26945,
    sha256: "fa640b7ce7f64096744106cc87a88aebb56f25958e4270aed69b0b6776bda05c",
  }),
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

export function assertAcceptanceNeutral(record, label = "acceptanceEffects") {
  assert.equal(record && typeof record === "object", true, `${label} missing`);
  assert.equal(Object.keys(record).length > 0, true, `${label} empty`);
  for (const [key, value] of Object.entries(record)) {
    assert.equal(typeof value, "boolean", `${label}.${key} must be boolean`);
    assert.equal(value, false, `${label}.${key} must remain false`);
  }
  return true;
}

function validateSnapshot(actual, expected, label) {
  assert.deepEqual(actual, expected, `${label} changed`);
  return true;
}

function validateFreshClaims(actual) {
  assert.equal(actual && typeof actual === "object", true);
  for (const [key, expected] of Object.entries(EXPECTED_FRESH_CLAIMS)) {
    assert.equal(actual[key], expected, `freshClaims.${key}`);
  }
  return true;
}

function validateRawFreshClaims(actual) {
  assert.equal(actual && typeof actual === "object", true);
  for (const key of [
    "deepQaFreshlyPerformed",
    "freshUnzip",
    "packageVerifierBeforeAndAfter",
    "dynamicLoopbackServer",
    "exactReleaseOrder",
    "layout",
    "reducedMotion",
    "replayMouseEnterSpace",
    "mapCore",
    "mapDifferentPageFocus",
    "keyTerms",
    "fq",
    "persistence",
    "directUrlBoundary",
    "networkBoundary",
    "currentJavascriptDeepQaMatrixComplete",
  ]) assert.equal(actual[key], true, `freshClaims.${key}`);
  for (const key of [
    "mapSameCurrentPageReselectFocus",
    "map",
    "perPageDirectUrl",
    "machineWorkExhausted",
    "productQaComplete",
    "migrationQaComplete",
  ]) assert.equal(actual[key], false, `freshClaims.${key}`);
  return true;
}

export function normalizeRawFreshClaims(freshClaims) {
  validateRawFreshClaims(freshClaims);
  return {
    exactReleaseOrder: freshClaims.exactReleaseOrder,
    mapInteractionFreshlyReperformed: true,
    mapDifferentPageFocusPassed: freshClaims.mapDifferentPageFocus,
    mapSamePageReselectFocusPassed:
      freshClaims.mapSameCurrentPageReselectFocus,
    keyTerms: freshClaims.keyTerms,
    fq: freshClaims.fq,
    persistence: freshClaims.persistence,
  };
}

function validateNormalizedAssertionCounts(actual) {
  assert.equal(actual && typeof actual === "object", true);
  for (const [group, expected] of Object.entries(EXPECTED_ASSERTION_COUNTS)) {
    assert.deepEqual(actual[group], expected, `assertionCounts.${group}`);
  }
  return true;
}

function validateRawAssertionCounts(actual) {
  assert.equal(actual && typeof actual === "object", true);
  for (const [group, expected] of Object.entries({
    layout: 648,
    identity: 648,
    overflow: 648,
    reducedMotionObservations: 108,
    reducedMotionSamples: 324,
    replayActivations: 324,
    mapCore: 4,
    mapSamePageReselectFocus: 0,
    keyTerms: 4,
    fq: 4,
    persistence: 2,
  })) {
    const expectedBlock = group === "mapSamePageReselectFocus"
      ? {passed: 0, failed: 4}
      : {passed: expected, failed: 0};
    assert.deepEqual(actual[group], expectedBlock, `assertionCounts.${group}`);
  }
  return true;
}

function remediationText(list) {
  assert.equal(Array.isArray(list), true);
  assert.equal(list.length >= 4, true);
  return JSON.stringify(list).toLowerCase();
}

export function validateKnownRemediations(list, {exact = false} = {}) {
  if (exact) assert.deepEqual(list, KNOWN_REMEDIATIONS_REQUIRED);
  const text = remediationText(list);
  for (const tokens of [
    ["reduced", "note", "intercept"],
    ["vb004", "spanish", "ui"],
    ["390", "exit", "clip"],
    ["map", "same", "focus"],
  ]) {
    for (const token of tokens) {
      assert.equal(text.includes(token), true, `remediation missing ${token}`);
    }
  }
  return true;
}

export function validateRawDeepQaReport(report) {
  assert.equal(report?.schemaVersion, 1);
  assert.equal(
    report.reportType,
    "g5-l4-v6-fresh-unzip-deep-current-javascript-product-qa",
  );
  assert.equal(report.packageId, PACKAGE_ID);
  assert.equal(
    report.status,
    "observed-current-javascript-deep-qa-remediations-required",
  );
  if (report.reportId !== undefined) assert.equal(report.reportId, RAW_REPORT_ID);
  assert.deepEqual(report.releaseBoundary, {
    releaseId: RELEASE_ID,
    activePages: 54,
    courseShells: 1,
    expectedMembers: 55,
    strictCompleteCount: 0,
    missingCount: 55,
    published: false,
  });
  assert.deepEqual(report.authorityBoundary, {
    evidenceLayer: "current-javascript-machine-product-qa-only",
    acceptanceNeutral: true,
    strictAcceptanceEffect: "none",
    originalRuntimeAuthority: false,
    humanReviewAuthority: false,
    ownerAuthority: false,
    publicationAuthority: false,
  });

  const source = report.sourceObservation;
  assert.equal(source?.sourceCurrentAtObservation, false);
  assert.equal(source?.currentWorkspaceSourceUsedToServeQa, false);
  assert.equal(source?.acceptanceEffect, "none");
  validateSnapshot(
    source.packageSnapshot,
    V6_PACKAGE_SOURCE_SNAPSHOT,
    "sourceObservation.packageSnapshot",
  );
  validateSnapshot(
    source.currentSnapshot,
    CURRENT_SOURCE_SNAPSHOT,
    "sourceObservation.currentSnapshot",
  );
  assert.deepEqual(source.delta, {
    fileCount: 0,
    totalBytes: 96,
    sha256Changed: true,
  });
  const reason = `${source.driftReason ?? ""}`.toLowerCase();
  for (const token of ["g4", "v3.1", "apps/web/tsconfig.json", "96", "v6"]) {
    assert.equal(reason.includes(token), true, `driftReason missing ${token}`);
  }
  assert.equal(
    `${source.qaRuntimeSource ?? ""}`.toLowerCase().includes("fresh-unzip"),
    true,
  );
  validateRawFreshClaims(report.freshClaims);
  validateRawAssertionCounts(report.assertionCounts);
  validateKnownRemediations(report.knownRemediationsRequired);
  assert.deepEqual(report.acceptanceEffects, RAW_ACCEPTANCE_EFFECTS);
  if (report.scopeResult !== undefined) {
    assert.equal(report.scopeResult.productQaComplete, false);
    assert.equal(report.scopeResult.migrationQaComplete, false);
  }
  if (report.remediationFindings !== undefined) {
    validateKnownRemediations(report.remediationFindings);
    assert.equal(report.remediationFindings.length, 4);
    assert.equal(
      report.remediationFindings.every(({observed}) => observed === true),
      true,
    );
  }
  if (report.failures !== undefined && report.failures.length > 0) {
    validateKnownRemediations(report.failures);
  }
  return true;
}

export function validateFailedRawDeepQaAttempt(report, revision = 1) {
  assert.equal(report?.schemaVersion, 1);
  assert.equal(
    report.reportType,
    "g5-l4-v6-fresh-unzip-deep-current-javascript-product-qa",
  );
  assert.equal(report.packageId, PACKAGE_ID);
  assert.equal([1, 2, 3].includes(revision), true);
  assert.equal(
    report.status,
    revision === 1
      ? "fail-current-javascript-deep-qa-execution"
      : "fail-current-javascript-deep-qa",
  );
  assert.deepEqual(report.acceptanceEffects, RAW_ACCEPTANCE_EFFECTS);
  assert.equal(report.releaseBoundary?.strictCompleteCount, 0);
  assert.equal(report.releaseBoundary?.published, false);
  assert.equal(report.sourceObservation?.sourceCurrentAtObservation, false);
  validateSnapshot(
    report.sourceObservation?.packageSnapshot,
    V6_PACKAGE_SOURCE_SNAPSHOT,
    "failedAttempt.packageSnapshot",
  );
  validateSnapshot(
    report.sourceObservation?.currentSnapshot,
    CURRENT_SOURCE_SNAPSHOT,
    "failedAttempt.currentSnapshot",
  );
  if (revision === 1) assert.deepEqual(report.assertionCounts, {});
  else if (revision === 2) {
    assert.deepEqual(report.assertionCounts?.layout, {passed: 648, failed: 0});
    assert.deepEqual(report.assertionCounts?.replayActivations, {
      passed: 324,
      failed: 0,
    });
    assert.deepEqual(report.assertionCounts?.mapCore, {passed: 0, failed: 4});
  } else {
    for (const group of ["layout", "identity", "overflow"]) {
      assert.deepEqual(report.assertionCounts?.[group], {
        passed: 647,
        failed: 1,
      });
    }
    assert.deepEqual(report.assertionCounts?.replayActivations, {
      passed: 324,
      failed: 0,
    });
    assert.deepEqual(report.assertionCounts?.mapCore, {passed: 4, failed: 0});
    assert.deepEqual(report.assertionCounts?.mapSamePageReselectFocus, {
      passed: 0,
      failed: 4,
    });
    assert.deepEqual(report.assertionCounts?.keyTerms, {passed: 4, failed: 0});
    assert.deepEqual(report.assertionCounts?.fq, {passed: 4, failed: 0});
    assert.deepEqual(report.assertionCounts?.persistence, {passed: 2, failed: 0});
  }
  assert.equal(
    report.freshClaims?.deepQaFreshlyPerformed,
    revision !== 1,
  );
  assert.equal(report.freshClaims?.machineWorkExhausted, false);
  assert.equal(report.freshClaims?.productQaComplete, false);
  assert.equal(report.freshClaims?.migrationQaComplete, false);
  assert.equal(Array.isArray(report.failures), true);
  const failures = report.failures.map((failure) => `${failure}`);
  if (revision === 1) {
    assert.equal(
      failures.some((failure) =>
        failure.includes("session storage key is absent")
      ),
      true,
    );
  } else if (revision === 2) {
    assert.equal(
      failures.some((failure) => failure.includes("Course Map core")),
      true,
    );
    assert.equal(
      failures.some((failure) =>
        failure.includes("canvas-renderer.js") && failure.includes("ERR_ABORTED")
      ),
      true,
    );
  } else {
    assert.equal(
      failures.some((failure) =>
        failure.includes("course-g05-l04-vb-004") &&
        failure.includes("layout assertion failed")
      ),
      true,
    );
    assert.equal(
      failures.some((failure) =>
        failure.includes("g5-l4-elementary-keyterms-reference-es.json") &&
        failure.includes("ERR_ABORTED")
      ),
      true,
    );
  }
  return true;
}

export function normalizeRawAssertionCounts(assertionCounts) {
  validateRawAssertionCounts(assertionCounts);
  return {
    layout: {
      observations: assertionCounts.layout.passed,
      passed: assertionCounts.layout.passed,
      failed: assertionCounts.layout.failed,
    },
    identity: {
      observations: assertionCounts.identity.passed,
      passed: assertionCounts.identity.passed,
      failed: assertionCounts.identity.failed,
    },
    overflow: {
      observations: assertionCounts.overflow.passed,
      passed: assertionCounts.overflow.passed,
      failed: assertionCounts.overflow.failed,
    },
    reducedMotion: {
      rows: assertionCounts.reducedMotionObservations.passed,
      samples: assertionCounts.reducedMotionSamples.passed,
      failed: assertionCounts.reducedMotionObservations.failed +
        assertionCounts.reducedMotionSamples.failed,
    },
    replay: {
      activations: assertionCounts.replayActivations.passed,
      passed: assertionCounts.replayActivations.passed,
      failed: assertionCounts.replayActivations.failed,
    },
  };
}

function assertFixedBinding(actual, expected, label) {
  validateBindingShape(actual, label);
  assert.deepEqual(
    {path: actual.path, bytes: actual.bytes, sha256: actual.sha256},
    expected,
    `${label} changed`,
  );
}

function assertAllFalse(record, label) {
  assert.equal(record && typeof record === "object", true, `${label} missing`);
  for (const [key, value] of Object.entries(record)) {
    assert.equal(value, false, `${label}.${key} must remain false`);
  }
}

export async function collectV6DeepQaEvidence({root}) {
  const smokeReport = await bindingFor(root, V6_FIXED_BINDINGS.smokeReport.path, {
    role: "v6-fresh-unzip-smoke",
  });
  assertFixedBinding(smokeReport, V6_FIXED_BINDINGS.smokeReport, "smokeReport");
  const smoke = JSON.parse(
    await readFile(path.resolve(root, smokeReport.path), "utf8"),
  );
  assert.equal(smoke.packageId, PACKAGE_ID);
  assert.equal(smoke.freshArchiveExtraction, true);
  assert.equal(smoke.status, "pass-current-javascript-private-preview");
  assert.equal(smoke.packageManifestSha256, V6_FIXED_BINDINGS.packageManifest.sha256);
  assert.deepEqual(
    {
      path: smoke.archive?.path,
      bytes: smoke.archive?.bytes,
      sha256: smoke.archive?.sha256,
    },
    V6_FIXED_BINDINGS.archive,
  );
  assert.equal(smoke.packageVerifier?.status, "verified");
  assert.equal(smoke.packageVerifier?.strictComplete, 0);
  assert.equal(smoke.packageVerifier?.published, false);
  assertAllFalse(smoke.authority, "smoke.authority");

  const archive = await bindingFor(root, V6_FIXED_BINDINGS.archive.path, {
    role: "immutable-v6-private-preview-archive",
  });
  const archiveSha256 = await bindingFor(
    root,
    V6_FIXED_BINDINGS.archiveSha256.path,
    {role: "v6-archive-sha256-sidecar"},
  );
  const packageManifest = await bindingFor(
    root,
    V6_FIXED_BINDINGS.packageManifest.path,
    {role: "v6-package-manifest"},
  );
  assertFixedBinding(archive, V6_FIXED_BINDINGS.archive, "archive");
  assertFixedBinding(
    archiveSha256,
    V6_FIXED_BINDINGS.archiveSha256,
    "archiveSha256",
  );
  assertFixedBinding(
    packageManifest,
    V6_FIXED_BINDINGS.packageManifest,
    "packageManifest",
  );
  const sidecar = await readFile(path.resolve(root, archiveSha256.path), "utf8");
  assert.equal(sidecar.trim().split(/\s+/)[0], archive.sha256);
  const manifest = JSON.parse(
    await readFile(path.resolve(root, packageManifest.path), "utf8"),
  );
  assertManifestBoundary(manifest);
  assert.equal(manifest.packageId, PACKAGE_ID);
  validateSnapshot(
    manifest.build?.inputSnapshotBefore,
    V6_PACKAGE_SOURCE_SNAPSHOT,
    "manifest.build.inputSnapshotBefore",
  );
  validateSnapshot(
    manifest.build?.inputSnapshotAfter,
    V6_PACKAGE_SOURCE_SNAPSHOT,
    "manifest.build.inputSnapshotAfter",
  );

  const report = await bindingFor(root, RAW_REPORT_PATH, {
    role: "v6-fresh-unzip-deep-product-qa-raw-report",
  });
  const markdown = await bindingFor(root, RAW_MARKDOWN_PATH, {
    role: "v6-fresh-unzip-deep-product-qa-human-boundary",
  });
  const runner = await bindingFor(root, RAW_RUNNER_PATH, {
    role: "v6-deep-product-qa-runner",
  });
  const runnerTest = await bindingFor(root, RAW_RUNNER_TEST_PATH, {
    role: "v6-deep-product-qa-runner-test",
  });
  const raw = JSON.parse(
    await readFile(path.resolve(root, RAW_REPORT_PATH), "utf8"),
  );
  validateRawDeepQaReport(raw);
  const failedReport = await bindingFor(root, FAILED_RAW_REPORT_PATH, {
    role: "failed-r1-deep-qa-attempt-report",
  });
  const failedMarkdown = await bindingFor(root, FAILED_RAW_MARKDOWN_PATH, {
    role: "failed-r1-deep-qa-attempt-human-boundary",
  });
  const failedRaw = JSON.parse(
    await readFile(path.resolve(root, FAILED_RAW_REPORT_PATH), "utf8"),
  );
  validateFailedRawDeepQaAttempt(failedRaw, 1);
  const failedR2Report = await bindingFor(root, FAILED_RAW_R2_REPORT_PATH, {
    role: "failed-r2-deep-qa-attempt-report",
  });
  const failedR2Markdown = await bindingFor(
    root,
    FAILED_RAW_R2_MARKDOWN_PATH,
    {role: "failed-r2-deep-qa-attempt-human-boundary"},
  );
  const failedR2Raw = JSON.parse(
    await readFile(path.resolve(root, FAILED_RAW_R2_REPORT_PATH), "utf8"),
  );
  validateFailedRawDeepQaAttempt(failedR2Raw, 2);
  const failedR3Report = await bindingFor(root, FAILED_RAW_R3_REPORT_PATH, {
    role: "failed-r3-deep-qa-attempt-report",
  });
  const failedR3Markdown = await bindingFor(
    root,
    FAILED_RAW_R3_MARKDOWN_PATH,
    {role: "failed-r3-deep-qa-attempt-human-boundary"},
  );
  const failedR3Raw = JSON.parse(
    await readFile(path.resolve(root, FAILED_RAW_R3_REPORT_PATH), "utf8"),
  );
  validateFailedRawDeepQaAttempt(failedR3Raw, 3);
  if (raw.generatorBinding !== undefined) {
    assert.deepEqual(raw.generatorBinding, {
      path: runner.path,
      bytes: runner.bytes,
      sha256: runner.sha256,
    });
  }
  assert.deepEqual(raw.testBinding, {
    path: runnerTest.path,
    bytes: runnerTest.bytes,
    sha256: runnerTest.sha256,
  });
  assert.deepEqual(
    {
      path: raw.archiveBinding?.path,
      bytes: raw.archiveBinding?.bytes,
      sha256: raw.archiveBinding?.sha256,
    },
    V6_FIXED_BINDINGS.archive,
  );
  assert.deepEqual(
    {
      path: raw.packageManifestBinding?.path,
      bytes: raw.packageManifestBinding?.bytes,
      sha256: raw.packageManifestBinding?.sha256,
    },
    {
      path:
        "g5-l4-whole-lesson-package-mvp-v6-darwin-arm64/package-manifest.json",
      bytes: V6_FIXED_BINDINGS.packageManifest.bytes,
      sha256: V6_FIXED_BINDINGS.packageManifest.sha256,
    },
  );
  assert.deepEqual(raw.archiveSidecarBinding, {
    path: V6_FIXED_BINDINGS.archiveSha256.path,
    bytes: V6_FIXED_BINDINGS.archiveSha256.bytes,
    sha256: V6_FIXED_BINDINGS.archiveSha256.sha256,
  });
  for (const phase of ["before", "after"]) {
    assert.equal(raw.packageVerifier?.[phase]?.status, 0);
    assert.equal(raw.packageVerifier?.[phase]?.timedOut, false);
    const verification = JSON.parse(raw.packageVerifier[phase].stdout);
    assert.equal(verification.status, "verified");
    assert.equal(verification.packageId, PACKAGE_ID);
    assert.equal(verification.strictComplete, 0);
    assert.equal(verification.published, false);
  }
  const artifactBindings = [];
  for (const artifact of raw.artifacts ?? []) {
    validateBindingShape(artifact, "raw.artifact");
    await verifyBinding(root, artifact);
    artifactBindings.push(artifact);
  }

  return {
    packageEvidence: {
      packageId: PACKAGE_ID,
      smokeReport,
      archive,
      archiveSha256,
      packageManifest,
      packageSourceSnapshot: V6_PACKAGE_SOURCE_SNAPSHOT,
      currentSourceSnapshot: CURRENT_SOURCE_SNAPSHOT,
      sourceCurrentAtObservation: false,
      sourceDrift: {
        changedPath: "apps/web/tsconfig.json",
        totalBytesDelta: 96,
        explanation: raw.sourceObservation.driftReason,
      },
      freshArchiveExtraction: true,
      qaRuntimeSource: raw.sourceObservation.qaRuntimeSource,
      browserStatus: raw.status,
      strictAcceptanceEffect: "none",
    },
    rawDeepQaEvidence: {
      report,
      markdown,
      runner,
      runnerTest,
      freshClaims: normalizeRawFreshClaims(raw.freshClaims),
      assertionCounts: normalizeRawAssertionCounts(raw.assertionCounts),
      artifactBindings,
      failedAttempts: [
        {
          report: failedReport,
          markdown: failedMarkdown,
          status: failedRaw.status,
          failure:
            "Replay session storage key lookup used the wrong prefix before r2 correction.",
          generatorCurrentAtSuccessorAssembly: false,
          currentAuthority: false,
          claimsCarriedForward: false,
          strictAcceptanceEffect: "none",
        },
        {
          report: failedR2Report,
          markdown: failedR2Markdown,
          status: failedR2Raw.status,
          failure:
            "Map-core classification and an expected navigation-aborted renderer request prevented observed-remediations status before r3 correction.",
          generatorCurrentAtSuccessorAssembly: false,
          currentAuthority: false,
          claimsCarriedForward: false,
          strictAcceptanceEffect: "none",
        },
        {
          report: failedR3Report,
          markdown: failedR3Markdown,
          status: failedR3Raw.status,
          failure:
            "A transient VB004 mobile layout sample and an aborted Spanish Key Terms reference request prevented observed-remediations status before r4 correction.",
          generatorCurrentAtSuccessorAssembly: false,
          currentAuthority: false,
          claimsCarriedForward: false,
          strictAcceptanceEffect: "none",
        },
      ],
    },
    raw,
    smoke,
    manifest,
  };
}

function expectedPredecessorPaths(kind) {
  const stem = `reports/g5-l4-current-js-${kind}-qa-successor-2026-08-01-r4`;
  return {receipt: `${stem}.json`, markdown: `${stem}.md`};
}

function validatePackageEvidence(evidence) {
  assert.equal(evidence?.packageId, PACKAGE_ID);
  validateSnapshot(
    evidence.packageSourceSnapshot,
    V6_PACKAGE_SOURCE_SNAPSHOT,
    "packageEvidence.packageSourceSnapshot",
  );
  validateSnapshot(
    evidence.currentSourceSnapshot,
    CURRENT_SOURCE_SNAPSHOT,
    "packageEvidence.currentSourceSnapshot",
  );
  assert.equal(evidence.sourceCurrentAtObservation, false);
  assert.equal(evidence.sourceDrift?.changedPath, "apps/web/tsconfig.json");
  assert.equal(evidence.sourceDrift?.totalBytesDelta, 96);
  const explanation = `${evidence.sourceDrift?.explanation ?? ""}`.toLowerCase();
  for (const token of ["g4", "v3.1", "apps/web/tsconfig.json", "96", "v6"]) {
    assert.equal(explanation.includes(token), true, `sourceDrift missing ${token}`);
  }
  return true;
}

function validateCommonSuccessor(receipt, kind) {
  assert.equal(receipt?.schemaVersion, 3);
  assert.equal(receipt.releaseId, RELEASE_ID);
  assert.equal(
    receipt.status,
    "observed-current-javascript-deep-qa-remediations-required",
  );
  assert.equal(
    receipt.receiptId,
    `g5-l4-current-js-${kind}-qa-successor-2026-08-01-r5`,
  );
  assert.equal(receipt.evidenceAssembledOn, "2026-08-01");
  assert.equal(receipt.scope?.networkBoundary, "loopback-only-local-preview");
  assert.equal(receipt.scope?.previewClass, "private-controlled-ceo-preview");
  assert.equal(receipt.scope?.packageId, PACKAGE_ID);
  assert.equal(receipt.scope?.g4L3Port3216Touched, false);
  assert.equal(receipt.scope?.externalDeploymentPerformed, false);
  validatePackageEvidence(receipt.packageEvidence);

  const predecessorPaths = expectedPredecessorPaths(kind);
  validateBindingShape(receipt.predecessorEvidence?.receipt);
  validateBindingShape(receipt.predecessorEvidence?.markdown);
  assert.equal(receipt.predecessorEvidence.receipt.path, predecessorPaths.receipt);
  assert.equal(receipt.predecessorEvidence.markdown.path, predecessorPaths.markdown);
  assert.equal(receipt.predecessorEvidence.immediatePredecessor, true);
  assert.equal(receipt.predecessorEvidence.currentAuthority, false);
  assert.equal(receipt.predecessorEvidence.claimsCarriedForward, false);

  const raw = receipt.rawDeepQaEvidence;
  for (const [key, expectedPath] of Object.entries({
    report: RAW_REPORT_PATH,
    markdown: RAW_MARKDOWN_PATH,
    runner: RAW_RUNNER_PATH,
    runnerTest: RAW_RUNNER_TEST_PATH,
  })) {
    validateBindingShape(raw?.[key], `rawDeepQaEvidence.${key}`);
    assert.equal(raw[key].path, expectedPath);
  }
  validateFreshClaims(raw.freshClaims);
  validateNormalizedAssertionCounts(raw.assertionCounts);
  assert.equal(raw.failedAttempts?.length, 3);
  const failedPaths = [
    [FAILED_RAW_REPORT_PATH, FAILED_RAW_MARKDOWN_PATH,
      "fail-current-javascript-deep-qa-execution"],
    [FAILED_RAW_R2_REPORT_PATH, FAILED_RAW_R2_MARKDOWN_PATH,
      "fail-current-javascript-deep-qa"],
    [FAILED_RAW_R3_REPORT_PATH, FAILED_RAW_R3_MARKDOWN_PATH,
      "fail-current-javascript-deep-qa"],
  ];
  for (let index = 0; index < failedPaths.length; index += 1) {
    const failed = raw.failedAttempts[index];
    const [reportPath, markdownPath, status] = failedPaths[index];
    validateBindingShape(failed?.report, `failedAttempts.${index}.report`);
    validateBindingShape(failed?.markdown, `failedAttempts.${index}.markdown`);
    assert.equal(failed.report.path, reportPath);
    assert.equal(failed.markdown.path, markdownPath);
    assert.equal(failed.status, status);
    assert.equal(failed.generatorCurrentAtSuccessorAssembly, false);
    assert.equal(failed.currentAuthority, false);
    assert.equal(failed.claimsCarriedForward, false);
    assert.equal(failed.strictAcceptanceEffect, "none");
  }
  validateKnownRemediations(receipt.knownRemediationsRequired, {exact: true});
  assert.equal(Array.isArray(receipt.sourceBindings), true);
  assert.equal(Array.isArray(receipt.artifacts), true);
  assertAcceptanceNeutral(receipt.acceptanceEffects);
  assert.equal(receipt.scopeResult?.predecessorClaimsCarriedForward, false);
  assert.equal(receipt.scopeResult?.deepQaFreshlyPerformed, true);
  assert.equal(
    receipt.scopeResult?.currentJavascriptDeepProductQaMachineWorkExhausted,
    false,
  );
  assert.equal(receipt.scopeResult?.productQaComplete, false);
  assert.equal(receipt.scopeResult?.migrationQaComplete, false);
  return true;
}

export function validateFqDeepQaSuccessor(receipt) {
  validateCommonSuccessor(receipt, "fq23-companion");
  assert.equal(
    receipt.evidenceType,
    "g5-l4-current-js-fq23-companion-deep-qa-successor-receipt",
  );
  assert.deepEqual(receipt.scope.members, FQ_MEMBERS);
  assert.equal(
    receipt.scopeResult.currentJavascriptFq23DeepQaFreshlyPerformed,
    true,
  );
  assert.equal(receipt.scopeResult.exactReleaseOrderFreshlyEstablished, true);
  assert.equal(receipt.scopeResult.fqInteractionFreshlyReperformed, true);
  return true;
}

export function validateWholeLessonDeepQaSuccessor(receipt) {
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
  assert.equal(
    receipt.childReceipts[0].path,
    "reports/g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r5.json",
  );
  for (const key of [
    "exactReleaseOrderFreshlyEstablished",
    "layoutAssertionsFreshlyPassed",
    "reducedMotionAssertionsFreshlyPassed",
    "replayAssertionsFreshlyPassed",
    "courseMapInteractionFreshlyReperformed",
    "mapDifferentPageFocusPassed",
    "keyTermsInteractionFreshlyReperformed",
    "fqInteractionFreshlyReperformed",
    "crossLocalePersistenceFreshlyReperformed",
  ]) assert.equal(receipt.scopeResult[key], true, `scopeResult.${key}`);
  assert.equal(receipt.scopeResult.mapSamePageReselectFocusPassed, false);
  return true;
}
