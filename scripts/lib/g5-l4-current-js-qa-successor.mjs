import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {lstat, readFile, realpath} from "node:fs/promises";
import path from "node:path";

import {
  PACKAGE_ID,
  assertManifestBoundary,
  buildCurrentPackageInputSnapshot,
  selectG5L4Release,
} from "../build-g5-l4-whole-lesson-package-mvp.mjs";

export const RELEASE_ID = "lesson-g05-l04-number-lines";
export const FQ_MEMBERS = Object.freeze([
  "course-g05-l04-fq-002",
  "course-g05-l04-fq-003",
]);

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

export async function verifyBinding(root, binding) {
  assert.equal(binding && typeof binding === "object", true);
  assertRelativeFilePath(binding.path);
  assert.equal(Number.isSafeInteger(binding.bytes), true);
  assert.equal(binding.bytes > 0, true);
  assert.match(binding.sha256, /^[0-9a-f]{64}$/);
  const expected = await bindingFor(root, binding.path);
  assert.equal(expected.bytes, binding.bytes, `${binding.path}: byte drift`);
  assert.equal(expected.sha256, binding.sha256, `${binding.path}: hash drift`);
  const bytes = await readFile(path.resolve(root, binding.path));
  if (binding.path.endsWith(".png")) {
    assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(bytes.readUInt32BE(16), binding.pixelWidth);
    assert.equal(bytes.readUInt32BE(20), binding.pixelHeight);
  }
  return bytes;
}

export function assertAcceptanceNeutral(record, label = "acceptanceEffects") {
  assert.equal(record && typeof record === "object", true, `${label} missing`);
  assert.equal(Object.keys(record).length > 0, true, `${label} is empty`);
  for (const [key, value] of Object.entries(record)) {
    assert.equal(value, false, `${label}.${key} must remain false`);
  }
  return true;
}

export function validateFreshPackageSmoke(smoke) {
  assert.equal(smoke?.schemaVersion, 1);
  assert.match(
    smoke.reportType,
    /^g5-l4-whole-lesson-package-mvp-v\d+-smoke$/,
  );
  assert.equal(smoke.reportType, `${smoke.packageId}-smoke`);
  assert.match(smoke.packageId, /^g5-l4-whole-lesson-package-mvp-v\d+$/);
  assert.equal(smoke.freshArchiveExtraction, true);
  assert.equal(smoke.pagesExpectedPerLocale, 54);
  assert.equal(smoke.englishPagesReady, 54);
  assert.equal(smoke.spanishPagesReady, 54);
  assert.equal(smoke.status, "pass-current-javascript-private-preview");

  assert.deepEqual(
    smoke.fqFlows.map((flow) => flow.animationId),
    FQ_MEMBERS,
  );
  assert.equal(smoke.fqFlows[0].firstLegend,
    "Question 1 of 10: choose A, B, C, or D");
  assert.equal(smoke.fqFlows[0].secondLegend,
    "Question 2 of 10: choose A, B, C, or D");
  assert.equal(smoke.fqFlows[1].firstLegend,
    "Question 1 of 18: choose A, B, C, or D");
  assert.equal(smoke.fqFlows[1].secondLegend,
    "Question 2 of 18: choose A, B, C, or D");
  for (const flow of smoke.fqFlows) {
    assert.equal(flow.answerSelectionAndSubmit, true);
    assert.equal(flow.replayResetToQuestionOne, true);
  }

  assert.deepEqual(smoke.glossaryCounts, {
    englishIndex: 761,
    spanishIndex: 753,
  });
  for (const key of [
    "consoleErrors",
    "pageErrors",
    "badHttpResponses",
    "failedRequests",
    "externalRequests",
    "failures",
  ]) assert.deepEqual(smoke[key], [], `${key} must be empty`);
  assertAcceptanceNeutral(smoke.authority, "smoke.authority");

  assert.equal(smoke.packageVerifier?.status, "verified");
  assert.equal(smoke.packageVerifier?.packageId, smoke.packageId);
  assert.equal(smoke.packageVerifier?.members, 55);
  assert.equal(smoke.packageVerifier?.currentJavascriptPages, 54);
  assert.deepEqual(smoke.packageVerifier?.glossaries, {en: 761, es: 753});
  assert.equal(smoke.packageVerifier?.strictComplete, 0);
  assert.equal(smoke.packageVerifier?.published, false);
  assert.equal(smoke.packageVerifier?.privacyScan?.status, "pass");
  assert.equal(smoke.privacyScan?.status, "pass");

  assert.deepEqual(
    {
      releaseId: smoke.release?.releaseId,
      expectedMembers: smoke.release?.expectedMembers,
      activePages: smoke.release?.activePages,
      courseShells: smoke.release?.courseShells,
      strictCompleteCount: smoke.release?.strictCompleteCount,
      missingCount: smoke.release?.missingCount,
      published: smoke.release?.published,
    },
    {
      releaseId: RELEASE_ID,
      expectedMembers: 55,
      activePages: 54,
      courseShells: 1,
      strictCompleteCount: 0,
      missingCount: 55,
      published: false,
    },
  );
  assert.equal(smoke.serverIdentity?.bindAddress, "127.0.0.1");
  assert.equal(smoke.serverIdentity?.listenerOwnedBySpawnedChild, true);
  assert.match(smoke.baseUrl, /^http:\/\/127\.0\.0\.1:\d+$/);
  assert.equal(smoke.spanishMobile?.viewportWidth, 390);
  assert.equal(smoke.spanishMobile?.horizontalOverflow, false);
  assert.equal(Array.isArray(smoke.screenshots), true);
  assert.equal(smoke.screenshots.length, 2);
  return true;
}

async function pngBindingFor(root, screenshot) {
  const binding = await bindingFor(root, screenshot.path);
  assert.equal(binding.bytes, screenshot.bytes);
  assert.equal(binding.sha256, screenshot.sha256);
  const bytes = await readFile(path.resolve(root, screenshot.path));
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  return {
    ...binding,
    pixelWidth: bytes.readUInt32BE(16),
    pixelHeight: bytes.readUInt32BE(20),
  };
}

export async function collectCurrentPackageEvidence({root, smokePath}) {
  const smokeReport = await bindingFor(root, smokePath, {
    role: "fresh-unzip-current-javascript-package-smoke",
  });
  const smoke = JSON.parse(
    await readFile(path.resolve(root, smokePath), "utf8"),
  );
  validateFreshPackageSmoke(smoke);
  assert.equal(
    smoke.packageId,
    PACKAGE_ID,
    "smoke is not for the package version selected by the current builder",
  );

  const archive = await bindingFor(root, smoke.archive.path, {
    role: "immutable-private-preview-package-archive",
  });
  assert.equal(archive.bytes, smoke.archive.bytes);
  assert.equal(archive.sha256, smoke.archive.sha256);
  const archiveSha256 = await bindingFor(root, `${smoke.archive.path}.sha256`, {
    role: "archive-sha256-sidecar",
  });
  const sidecar = await readFile(
    path.resolve(root, archiveSha256.path),
    "utf8",
  );
  assert.equal(sidecar.trim().split(/\s+/)[0], archive.sha256);

  assert.equal(smoke.archive.path.endsWith(".zip"), true);
  const packageManifestPath =
    `${smoke.archive.path.slice(0, -4)}/package-manifest.json`;
  const packageManifest = await bindingFor(root, packageManifestPath, {
    role: "fresh-package-manifest",
  });
  assert.equal(packageManifest.sha256, smoke.packageManifestSha256);
  const manifest = JSON.parse(
    await readFile(path.resolve(root, packageManifestPath), "utf8"),
  );
  assertManifestBoundary(manifest);
  assert.equal(manifest.packageId, smoke.packageId);

  const releases = JSON.parse(
    await readFile(path.resolve(root, "catalog/lesson-releases.json"), "utf8"),
  );
  const release = selectG5L4Release(releases);
  const currentInputSnapshot = await buildCurrentPackageInputSnapshot(release);
  assert.deepEqual(
    manifest.build?.inputSnapshotBefore,
    currentInputSnapshot,
    "package input snapshot before build is stale",
  );
  assert.deepEqual(
    manifest.build?.inputSnapshotAfter,
    currentInputSnapshot,
    "package input snapshot after build is stale",
  );

  const screenshots = [];
  for (const screenshot of smoke.screenshots) {
    screenshots.push(await pngBindingFor(root, screenshot));
  }

  return {
    evidence: {
      packageId: smoke.packageId,
      smokeReport,
      archive,
      archiveSha256,
      packageManifest,
      currentInputSnapshot,
      freshArchiveExtraction: true,
      browserStatus: "pass-current-javascript-private-preview",
      strictAcceptanceEffect: "none",
    },
    manifest,
    smoke,
    screenshots,
  };
}

function validateCommonSuccessor(receipt, kind) {
  assert.equal(receipt?.schemaVersion, 2);
  assert.equal(receipt.releaseId, RELEASE_ID);
  assert.match(receipt.receiptId, new RegExp(
    `^g5-l4-current-js-${kind}-qa-successor-\\d{4}-\\d{2}-\\d{2}(?:-r(?:[2-9]|[1-9][0-9]+))?$`,
  ));
  assert.match(receipt.evidenceAssembledOn, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(receipt.scope.networkBoundary, "loopback-only-local-preview");
  assert.equal(receipt.scope.previewClass, "private-controlled-ceo-preview");
  assert.equal(receipt.scope.g4L3Port3216Touched, false);
  assert.equal(receipt.scope.externalDeploymentPerformed, false);
  assert.equal(receipt.packageEvidence.freshArchiveExtraction, true);
  assert.equal(receipt.packageEvidence.strictAcceptanceEffect, "none");
  assert.equal(receipt.predecessorEvidence.currentAuthority, false);
  assert.equal(receipt.predecessorEvidence.claimsCarriedForward, false);
  assertAcceptanceNeutral(receipt.acceptanceEffects);
  assert.equal(Array.isArray(receipt.sourceBindings), true);
  assert.equal(Array.isArray(receipt.artifacts), true);
  const allPaths = [
    ...receipt.sourceBindings,
    ...receipt.artifacts,
  ].map((binding) => binding.path);
  assert.equal(new Set(allPaths).size, allPaths.length);
  return true;
}

export function validateFqSuccessorReceipt(receipt) {
  validateCommonSuccessor(receipt, "fq23-companion");
  assert.equal(
    receipt.evidenceType,
    "g5-l4-current-js-fq23-companion-fresh-package-qa-successor-receipt",
  );
  assert.deepEqual(receipt.scope.members, FQ_MEMBERS);
  assert.deepEqual(
    receipt.freshBrowserObservations.fqFlows.map((flow) => flow.animationId),
    FQ_MEMBERS,
  );
  for (const flow of receipt.freshBrowserObservations.fqFlows) {
    assert.equal(flow.answerSelectionAndSubmit, true);
    assert.equal(flow.replayResetToQuestionOne, true);
  }
  assert.equal(receipt.scopeResult.currentJavascriptFq23FreshPackageQaPassed,
    true);
  assert.equal(receipt.scopeResult.fullScoreAndReviewFlowFreshlyReperformed,
    false);
  assert.equal(receipt.scopeResult.predecessorClaimsCarriedForward, false);
  assert.equal(receipt.scopeResult.productQaComplete, false);
  assert.deepEqual(
    receipt.focusedTests.map(({passed, failed}) => ({passed, failed})),
    [{passed: 10, failed: 0}, {passed: 2, failed: 0}],
  );
  return true;
}

export function validateWholeLessonSuccessorReceipt(receipt) {
  validateCommonSuccessor(receipt, "whole-lesson-product");
  assert.equal(
    receipt.evidenceType,
    "g5-l4-current-js-whole-lesson-fresh-package-qa-successor-receipt",
  );
  assert.deepEqual(
    {
      releaseMembers: receipt.scope.releaseMembers,
      activePages: receipt.scope.activePages,
      courseShells: receipt.scope.courseShells,
    },
    {releaseMembers: 55, activePages: 54, courseShells: 1},
  );
  assert.deepEqual(
    {
      englishPagesReady: receipt.freshBrowserObservations.englishPagesReady,
      spanishPagesReady: receipt.freshBrowserObservations.spanishPagesReady,
      englishGlossaryEntries:
        receipt.freshBrowserObservations.glossaryCounts.englishIndex,
      spanishGlossaryEntries:
        receipt.freshBrowserObservations.glossaryCounts.spanishIndex,
      horizontalOverflow:
        receipt.freshBrowserObservations.spanishMobile.horizontalOverflow,
    },
    {
      englishPagesReady: 54,
      spanishPagesReady: 54,
      englishGlossaryEntries: 761,
      spanishGlossaryEntries: 753,
      horizontalOverflow: false,
    },
  );
  assert.equal(
    receipt.scopeResult.currentJavascriptFreshPackageWholeLessonQaPassed,
    true,
  );
  assert.equal(receipt.scopeResult.exactReleaseOrderFreshlyEstablished, false);
  assert.equal(receipt.scopeResult.courseMapInteractionFreshlyReperformed,
    false);
  assert.equal(receipt.scopeResult.keyTermsEscapeFocusFreshlyReperformed, false);
  assert.equal(receipt.scopeResult.productQaComplete, false);
  assert.equal(receipt.childReceipts.length, 1);
  return true;
}
