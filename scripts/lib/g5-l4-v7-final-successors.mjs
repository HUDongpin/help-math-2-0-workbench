import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  realpath,
  rm,
  rmdir,
  unlink,
} from "node:fs/promises";
import path from "node:path";

import {
  SOURCE_INPUTS as V7_PACKAGE_SOURCE_INPUTS,
  assertManifestBoundary,
  buildCurrentPackageInputSnapshot,
} from "../build-g5-l4-whole-lesson-package-mvp-v7.mjs";
import {validateReport as validateAudioStaticReport} from
  "../build-g5-l4-audio-static-cue-reconciliation.mjs";
import {validateG5L4KeytermsSourceGapExceptionProposal} from
  "../build-g5-l4-keyterms-source-gap-exception-proposal.mjs";
import {validateG5L4MissingKeytermRecoveryReadiness} from
  "../build-g5-l4-missing-keyterm-recovery-readiness.mjs";
import {validateOwnerActionPacket} from
  "../build-g5-l4-owner-action-packet.mjs";
import {validateG5L4PerSessionAuthorizationPreparation} from
  "../build-g5-l4-per-session-authorization-preparation.mjs";
import {
  GENERATOR_PATH as KEYTERMS_R2_GENERATOR_PATH,
  OUTPUT_PATHS as KEYTERMS_R2_OUTPUT_PATHS,
  TEST_PATH as KEYTERMS_R2_TEST_PATH,
  validateG5L4CombinedKeytermsProductReferenceBindingSuccessorR2,
} from "../build-g5-l4-combined-keyterms-product-reference-binding-successor-r2.mjs";
import {
  validateFqDeepQaSuccessorV7,
  validateRawV7DeepQaReport,
  validateWholeLessonDeepQaSuccessorV7,
} from "./g5-l4-current-js-deep-qa-successor-v7.mjs";
import {validateG5L4OwnerWorkAuthorizationReceipt} from
  "./g5-l4-owner-work-authorization.mjs";

export const RELEASE_ID = "lesson-g05-l04-number-lines";
export const PACKAGE_ID = "g5-l4-whole-lesson-package-mvp-v7";
export const PACKAGE_BASENAME =
  "g5-l4-whole-lesson-package-mvp-v7-darwin-arm64";

export const OUTPUTS = Object.freeze({
  continuation:
    "reports/g5-l4-continuation-machine-readiness-successor-2026-08-01-v7-r1",
  delivery:
    "reports/g5-l4-whole-lesson-package-mvp-v7-delivery-2026-08-01-r1",
  owner:
    "reports/g5-l4-owner-action-packet-successor-2026-08-01-v7-r1",
});

export const GENERATORS = Object.freeze({
  continuation:
    "scripts/build-g5-l4-continuation-machine-readiness-v7-successor.mjs",
  delivery:
    "scripts/build-g5-l4-whole-lesson-package-mvp-v7-delivery.mjs",
  owner:
    "scripts/build-g5-l4-owner-action-packet-v7-successor.mjs",
});

export const CORE_INPUT_PATHS = Object.freeze({
  packageSmoke: "reports/g5-l4-whole-lesson-package-mvp-v7-smoke.json",
  packageManifest:
    `outputs/${PACKAGE_BASENAME}/package-manifest.json`,
  packageArchive: `outputs/${PACKAGE_BASENAME}.zip`,
  packageArchiveSha256: `outputs/${PACKAGE_BASENAME}.zip.sha256`,
  rawJson:
    "reports/g5-l4-whole-lesson-package-mvp-v7-deep-product-qa-2026-08-01-r2.json",
  rawMarkdown:
    "reports/g5-l4-whole-lesson-package-mvp-v7-deep-product-qa-2026-08-01-r2.md",
  fqR6Json:
    "reports/g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r6.json",
  fqR6Markdown:
    "reports/g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r6.md",
  wholeR6Json:
    "reports/g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r6.json",
  wholeR6Markdown:
    "reports/g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r6.md",
  audioStaticJson: "reports/g5-l4-audio-static-cue-reconciliation.json",
  audioStaticMarkdown: "reports/g5-l4-audio-static-cue-reconciliation.md",
  keytermsR2Json: KEYTERMS_R2_OUTPUT_PATHS.json,
  keytermsR2Markdown: KEYTERMS_R2_OUTPUT_PATHS.markdown,
});

export const OWNER_INPUT_PATHS = Object.freeze({
  predecessorJson: "reports/g5-l4-owner-action-packet.json",
  predecessorMarkdown: "reports/g5-l4-owner-action-packet.md",
  operatorAssignment:
    "catalog/owner-authorizations/g5-l4-original-runtime-animate-operator-assignment-2026-07-28.json",
  ownerWorkAuthorization:
    "catalog/owner-authorizations/g5-l4-owner-continuation-and-prospective-approval-intake-2026-08-01.json",
  perSessionPreparation:
    "reports/g5-l4-per-session-authorization-preparation.json",
  missingKeyterms: "reports/g5-l4-missing-keyterm-recovery-readiness.json",
  keytermsException:
    "reports/g5-l4-keyterms-source-gap-exception-proposal.json",
  releaseLedger: "catalog/lesson-release-ledger.json",
});

export const CRITICAL_SOURCE_PATHS = Object.freeze([
  "scripts/lib/g5-l4-v7-final-successors.mjs",
  "scripts/g5-l4-v7-final-successors.test.mjs",
  KEYTERMS_R2_GENERATOR_PATH,
  KEYTERMS_R2_TEST_PATH,
  "scripts/build-g5-l4-continuation-machine-readiness-v7-successor.mjs",
  "scripts/build-g5-l4-whole-lesson-package-mvp-v7-delivery.mjs",
  "scripts/build-g5-l4-owner-action-packet-v7-successor.mjs",
  "scripts/build-g5-l4-whole-lesson-package-mvp-v7.mjs",
  "scripts/build-g5-l4-whole-lesson-package-mvp-v7.test.mjs",
  "scripts/qa-g5-l4-v7-deep-product.mjs",
  "scripts/qa-g5-l4-v7-deep-product.test.mjs",
  "scripts/lib/g5-l4-current-js-deep-qa-successor-v7.mjs",
  "scripts/build-g5-l4-current-js-deep-qa-successors-v7.mjs",
  "scripts/check-g5-l4-current-js-deep-qa-successors-v7.mjs",
  "scripts/g5-l4-current-js-deep-qa-successor-v7.test.mjs",
  "apps/web/app/globals.css",
  "apps/web/components/legacy-responsive-lesson-shell.tsx",
  "apps/web/components/descriptor-driven-whole-lesson-player.tsx",
  "apps/web/components/animation-runtime.tsx",
  "apps/web/lib/g5-l4-whole-lesson-player-descriptor.ts",
  "apps/web/playwright.config.ts",
  "apps/web/e2e/legacy-lesson-shell-responsive.spec.ts",
  "apps/web/tests/descriptor-driven-whole-lesson-player.test.ts",
  "apps/web/tests/g5-l4-whole-lesson-player-descriptor.test.ts",
  "apps/web/tests/legacy-lesson-layout.test.ts",
  "packages/demos/src/contract.ts",
  "packages/demos/src/modules/course-g05-l04-vb-004.tsx",
  "packages/demos/src/timelines/course-g05-l04-vb-004-integers-drag-interaction.ts",
  "packages/demos/tests/course-g05-l04-vb-004-integers-drag-interaction.test.ts",
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

const CORE_SOURCE_ROLES = Object.freeze({
  packageSmoke: "v7-fresh-unzip-smoke-report",
  packageManifest: "v7-private-preview-package-manifest",
  packageArchive: "immutable-v7-private-preview-archive",
  packageArchiveSha256: "v7-archive-sha256-sidecar",
  rawJson: "v7-r2-fresh-unzip-deep-product-qa-json",
  rawMarkdown: "v7-r2-fresh-unzip-deep-product-qa-markdown",
  fqR6Json: "r6-fq23-current-javascript-successor-json",
  fqR6Markdown: "r6-fq23-current-javascript-successor-markdown",
  wholeR6Json: "r6-whole-lesson-current-javascript-successor-json",
  wholeR6Markdown: "r6-whole-lesson-current-javascript-successor-markdown",
  audioStaticJson: "g5-l4-audio-static-reconciliation-json",
  audioStaticMarkdown: "g5-l4-audio-static-reconciliation-markdown",
  keytermsR2Json:
    "combined-keyterms-product-reference-machine-binding-successor-json",
  keytermsR2Markdown:
    "combined-keyterms-product-reference-machine-binding-successor-markdown",
});

const SUCCESSOR_PAIR_ROLES = Object.freeze({
  continuation: Object.freeze({
    json: "v7-final-continuation-successor-json",
    markdown: "v7-final-continuation-successor-markdown",
  }),
  delivery: Object.freeze({
    json: "v7-final-delivery-receipt-json",
    markdown: "v7-final-delivery-receipt-markdown",
  }),
  owner: Object.freeze({
    json: "v7-final-owner-action-successor-json",
    markdown: "v7-final-owner-action-successor-markdown",
  }),
});

const OWNER_INPUT_ROLES = Object.freeze({
  predecessorJson: "unsigned-owner-action-predecessor-json",
  predecessorMarkdown: "unsigned-owner-action-predecessor-markdown",
  operatorAssignment: "named-original-runtime-operator-role-assignment",
  ownerWorkAuthorization: "owner-continuation-work-authorization-intake",
  perSessionPreparation: "unsigned-per-session-authorization-preparation",
  missingKeyterms: "missing-keyterms-recovery-readiness",
  keytermsException: "unsigned-keyterms-source-gap-exception-proposal",
  releaseLedger: "strict-release-ledger",
});

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const EXPECTED_ASSERTIONS = Object.freeze({
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

export function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

export function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

export function assertRelativePath(value, label = "path") {
  invariant(
    typeof value === "string" && value.length > 0 &&
      !path.isAbsolute(value) && !value.includes("\\") &&
      !value.split("/").includes(".."),
    `${label} must be a normalized project-relative path`,
  );
  return value;
}

function resolveInside(root, relativePath, label) {
  assertRelativePath(relativePath, label);
  const absolute = path.resolve(root, relativePath);
  const relative = path.relative(root, absolute);
  invariant(
    relative !== ".." && !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative),
    `${label} escapes the project root`,
  );
  return absolute;
}

export async function readRecord(root, relativePath, {json = false} = {}) {
  const absolute = resolveInside(root, relativePath, relativePath);
  const [before, canonicalRoot, canonicalFile] = await Promise.all([
    lstat(absolute),
    realpath(root),
    realpath(absolute),
  ]).catch((error) => {
    throw new Error(`${relativePath}: required input unavailable (${error.message})`);
  });
  invariant(
    before.isFile() && !before.isSymbolicLink() && before.nlink === 1,
    `${relativePath}: expected one ordinary non-linked file`,
  );
  const canonicalRelative = path.relative(canonicalRoot, canonicalFile);
  invariant(
    canonicalRelative !== ".." &&
      !canonicalRelative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(canonicalRelative),
    `${relativePath}: resolves outside the project root`,
  );
  const bytes = await readFile(absolute);
  const after = await lstat(absolute);
  invariant(
    before.dev === after.dev && before.ino === after.ino &&
      before.mtimeMs === after.mtimeMs && after.size === bytes.length,
    `${relativePath}: changed while being read`,
  );
  const descriptor = {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
  if (!json) return {bytes, descriptor};
  try {
    return {
      bytes,
      descriptor,
      document: JSON.parse(bytes.toString("utf8")),
    };
  } catch (error) {
    throw new Error(`${relativePath}: invalid JSON (${error.message})`);
  }
}

export function validateDescriptor(value, label = "descriptor") {
  invariant(value && typeof value === "object", `${label} is missing`);
  assertRelativePath(value.path, `${label}.path`);
  invariant(
    Number.isSafeInteger(value.bytes) && value.bytes > 0,
    `${label}.bytes must be a positive safe integer`,
  );
  invariant(SHA256_PATTERN.test(value.sha256 || ""), `${label}.sha256 invalid`);
  return value;
}

function exactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} is missing`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(JSON.stringify(actual) === JSON.stringify(wanted), `${label} keys drifted`);
}

function withRole(descriptor, role) {
  return {...descriptor, role};
}

function validateRoleDescriptor(value, {path: expectedPath, role}, label) {
  validateDescriptor(value, label);
  invariant(value.path === expectedPath, `${label}.path drifted`);
  invariant(value.role === role, `${label}.role drifted`);
  exactKeys(value, ["path", "bytes", "sha256", "role"], label);
  return value;
}

function bindingTuple(value) {
  return value && {
    path: value.path,
    bytes: value.bytes,
    sha256: value.sha256,
  };
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function assertDescriptorMatches(actual, expected, label, {path = true} = {}) {
  validateDescriptor(actual, label);
  invariant(
    actual.bytes === expected.bytes && actual.sha256 === expected.sha256 &&
      (!path || actual.path === expected.path),
    `${label} does not match the fixed current file`,
  );
}

function assertExactFalseRecord(record, expectedKeys, label) {
  exactKeys(record, expectedKeys, label);
  for (const key of expectedKeys) {
    invariant(typeof record[key] === "boolean", `${label}.${key} must be boolean`);
    invariant(record[key] === false, `${label}.${key} must remain false`);
  }
  return record;
}

export function assertAllFalse(record, label = "acceptanceEffects") {
  return assertExactFalseRecord(record, Object.keys(ACCEPTANCE_EFFECTS), label);
}

function descriptorsIn(value, output = []) {
  if (Array.isArray(value)) {
    for (const item of value) descriptorsIn(item, output);
    return output;
  }
  if (!value || typeof value !== "object") return output;
  if (
    typeof value.path === "string" && Number.isSafeInteger(value.bytes) &&
      typeof value.sha256 === "string"
  ) output.push(value);
  for (const item of Object.values(value)) descriptorsIn(item, output);
  return output;
}

function descriptorMatches(actual, expected, {allowManifestArchivePath = false} = {}) {
  if (!actual || actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) {
    return false;
  }
  if (actual.path === expected.path) return true;
  return allowManifestArchivePath &&
    actual.path === `${PACKAGE_BASENAME}/package-manifest.json` &&
    expected.path.endsWith(`/${PACKAGE_BASENAME}/package-manifest.json`);
}

function requireDescriptor(value, expected, label, options) {
  const match = descriptorsIn(value).some((item) =>
    descriptorMatches(item, expected, options)
  );
  invariant(match, `${label}: exact hash-bound descriptor is absent`);
}

function requireFalseBoundary(document, label) {
  assertAllFalse(document.acceptanceEffects, `${label}.acceptanceEffects`);
  if (document.authorityBoundary?.strictAcceptanceEffect !== undefined) {
    invariant(
      document.authorityBoundary.strictAcceptanceEffect === "none",
      `${label}.authorityBoundary.strictAcceptanceEffect must be none`,
    );
  }
}

function validateManifest(manifest) {
  assertManifestBoundary(manifest);
  invariant(
    manifest.release?.releaseId === RELEASE_ID &&
      manifest.release.expectedMembers === 55 &&
      manifest.release.activePages === 54 &&
      manifest.release.courseShells === 1 &&
      manifest.release.strictCompleteCount === 0 &&
      manifest.release.missingCount === 55 &&
      manifest.release.published === false,
    "v7 manifest release boundary must remain strict 0/55 and unpublished",
  );
  assertExactFalseRecord(manifest.authority, [
    "authoritativeOriginalRuntime",
    "originalRuntimeFullFrameAccepted",
    "audioAccepted",
    "humanVisualAccepted",
    "humanAudioAccepted",
    "ownerFidelityAccepted",
    "strictComplete",
    "publicRelease",
    "published",
  ], "manifest.authority");
  invariant(
    manifest.entry?.externalDeploymentAuthorized === false,
    "v7 manifest external deployment boundary drifted",
  );
  invariant(
    sameValue(manifest.build?.inputSnapshotBefore, manifest.build?.inputSnapshotAfter),
    "v7 manifest input snapshots differ",
  );
}

function validateSmoke(smoke, records) {
  invariant(
    smoke?.schemaVersion === 1 &&
      smoke.reportType === "g5-l4-whole-lesson-package-mvp-v7-smoke" &&
      smoke.packageId === PACKAGE_ID &&
      smoke.status === "pass-current-javascript-private-preview" &&
      smoke.freshArchiveExtraction === true,
    "v7 smoke is not a passing fresh-extraction report",
  );
  assertDescriptorMatches(
    smoke.archive,
    records.packageArchive.descriptor,
    "smoke.archive",
  );
  invariant(
    smoke.packageManifestSha256 === records.packageManifest.descriptor.sha256,
    "smoke/manifest SHA-256 drifted",
  );
  invariant(
    smoke.packageVerifier?.status === "verified" &&
      smoke.packageVerifier.packageId === PACKAGE_ID &&
      smoke.packageVerifier.members === 55 &&
      smoke.packageVerifier.currentJavascriptPages === 54 &&
      smoke.packageVerifier.strictComplete === 0 &&
      smoke.packageVerifier.published === false,
    "smoke verifier boundary drifted",
  );
  invariant(
    smoke.englishPagesReady === 54 && smoke.spanishPagesReady === 54 &&
      smoke.fqFlows?.length === 2 &&
      smoke.fqFlows.every((flow) =>
        flow.answerSelectionAndSubmit === true &&
        flow.replayResetToQuestionOne === true
      ) &&
      smoke.glossaryCounts?.englishIndex === 761 &&
      smoke.glossaryCounts?.spanishIndex === 753 &&
      smoke.serverIdentity?.listenerOwnedBySpawnedChild === true &&
      smoke.spanishMobile?.horizontalOverflow === false &&
      smoke.privacyScan?.status === "pass" &&
      smoke.release?.expectedMembers === 55 &&
      smoke.release?.strictCompleteCount === 0 &&
      smoke.release?.missingCount === 55 && smoke.release?.published === false,
    "smoke complete pass matrix drifted",
  );
  for (const key of [
    "consoleErrors",
    "pageErrors",
    "badHttpResponses",
    "failedRequests",
    "externalRequests",
    "failures",
  ]) invariant(Array.isArray(smoke[key]) && smoke[key].length === 0, `smoke.${key} must be empty`);
  assertExactFalseRecord(smoke.authority, [
    "authoritativeOriginalRuntime",
    "originalRuntimeFullFrameAccepted",
    "audioAccepted",
    "humanVisualAccepted",
    "humanAudioAccepted",
    "ownerFidelityAccepted",
    "strictComplete",
    "publicRelease",
    "published",
  ], "smoke.authority");
}

function validateRaw(raw, records) {
  validateRawV7DeepQaReport(raw);
  assertDescriptorMatches(raw.archiveBinding, records.packageArchive.descriptor, "raw.archiveBinding");
  assertDescriptorMatches(
    raw.archiveSidecarBinding,
    records.packageArchiveSha256.descriptor,
    "raw.archiveSidecarBinding",
  );
  assertDescriptorMatches(
    raw.packageManifestBinding,
    records.packageManifest.descriptor,
    "raw.packageManifestBinding",
    {path: false},
  );
  invariant(
    raw.packageManifestBinding.path === `${PACKAGE_BASENAME}/package-manifest.json`,
    "raw package-manifest archive path drifted",
  );
  assertDescriptorMatches(
    raw.outputBindings?.markdown,
    records.rawMarkdown.descriptor,
    "raw.outputBindings.markdown",
  );
  const runner = records.criticalSourcesByPath.get("scripts/qa-g5-l4-v7-deep-product.mjs");
  const runnerTest = records.criticalSourcesByPath.get("scripts/qa-g5-l4-v7-deep-product.test.mjs");
  assertDescriptorMatches(raw.generatorBinding, runner, "raw.generatorBinding");
  assertDescriptorMatches(raw.testBinding, runnerTest, "raw.testBinding");
}

function validateR6(receipt, kind, records) {
  const expectedId = kind === "fq"
    ? "g5-l4-current-js-fq23-companion-qa-successor-2026-08-01-r6"
    : "g5-l4-current-js-whole-lesson-product-qa-successor-2026-08-01-r6";
  if (kind === "fq") validateFqDeepQaSuccessorV7(receipt);
  else validateWholeLessonDeepQaSuccessorV7(receipt);
  invariant(receipt.receiptId === expectedId, `${kind} r6 receiptId drifted`);
  invariant(receipt.status === "pass-current-javascript-deep-product-qa", `${kind} r6 status drifted`);
  assertDescriptorMatches(receipt.packageEvidence.smokeReport, records.packageSmoke.descriptor, `${kind}.packageEvidence.smokeReport`);
  assertDescriptorMatches(receipt.packageEvidence.archive, records.packageArchive.descriptor, `${kind}.packageEvidence.archive`);
  assertDescriptorMatches(receipt.packageEvidence.archiveSha256, records.packageArchiveSha256.descriptor, `${kind}.packageEvidence.archiveSha256`);
  assertDescriptorMatches(receipt.packageEvidence.packageManifest, records.packageManifest.descriptor, `${kind}.packageEvidence.packageManifest`);
  assertDescriptorMatches(receipt.rawDeepQaEvidence.report, records.rawJson.descriptor, `${kind}.rawDeepQaEvidence.report`);
  assertDescriptorMatches(receipt.rawDeepQaEvidence.markdown, records.rawMarkdown.descriptor, `${kind}.rawDeepQaEvidence.markdown`);
  const markdownRecord = kind === "fq" ? records.fqR6Markdown : records.wholeR6Markdown;
  const markdownRole = kind === "fq"
    ? "human-readable-r6-fq23-companion-deep-qa-successor-boundary"
    : "human-readable-r6-whole-lesson-product-deep-qa-successor-boundary";
  const matches = receipt.artifacts.filter((artifact) => artifact.path === markdownRecord.descriptor.path);
  invariant(matches.length === 1, `${kind} r6 must bind exactly one Markdown companion`);
  assertDescriptorMatches(matches[0], markdownRecord.descriptor, `${kind}.artifacts.markdown`);
  invariant(matches[0].role === markdownRole, `${kind} r6 Markdown role drifted`);
  if (kind === "whole") {
    invariant(receipt.childReceipts.length === 1, "whole r6 child receipt count drifted");
    assertDescriptorMatches(receipt.childReceipts[0], records.fqR6Json.descriptor, "whole r6 FQ child receipt");
    invariant(receipt.childReceipts[0].role === "r6-fq23-deep-qa-successor", "whole r6 child role drifted");
  }
}

function validateAudio(audio) {
  validateAudioStaticReport(audio);
  invariant(
    audio.releaseId === RELEASE_ID &&
      audio.status === "machine-static-reconciliation-complete-runtime-evidence-unresolved",
    "audio static reconciliation identity drifted",
  );
}

function validateKeytermsR2(report, records) {
  validateG5L4CombinedKeytermsProductReferenceBindingSuccessorR2(report);
  invariant(
    report.releaseId === RELEASE_ID &&
      report.acceptanceNeutral === true &&
      report.strictAcceptanceEffect === "none" &&
      report.browserQaExecutedByThisSuccessor === false &&
      report.predecessorBrowserObservationsInherited === false &&
      Object.values(report.acceptanceEffects).every((value) => value === false),
    "combined Key Terms r2 acceptance boundary drifted",
  );
  assertDescriptorMatches(
    report.companionMarkdown,
    records.keytermsR2Markdown.descriptor,
    "combined Key Terms r2 companion Markdown",
  );
  invariant(
    report.companionMarkdown.role ===
      "human-readable-machine-binding-successor-boundary",
    "combined Key Terms r2 companion Markdown role drifted",
  );
  for (const [key, relativePath, role] of [
    [
      "generator",
      KEYTERMS_R2_GENERATOR_PATH,
      "machine-binding-successor-generator-validator",
    ],
    [
      "test",
      KEYTERMS_R2_TEST_PATH,
      "machine-binding-successor-targeted-test",
    ],
  ]) {
    const current = records.criticalSourcesByPath.get(relativePath);
    invariant(current, `combined Key Terms r2 ${key} is outside the critical set`);
    assertDescriptorMatches(
      report.sourceBindings[key],
      current,
      `combined Key Terms r2 ${key}`,
    );
    invariant(
      report.sourceBindings[key].role === role,
      `combined Key Terms r2 ${key} role drifted`,
    );
  }
}

function sourceBindingProjection(value) {
  return descriptorsIn(value)
    .map(({path: itemPath, bytes, sha256: digest}) => ({
      path: itemPath,
      bytes,
      sha256: digest,
    }))
    .sort((left, right) => left.path.localeCompare(right.path, "en"));
}

function validateSnapshotShape(snapshot, label) {
  invariant(snapshot && typeof snapshot === "object", `${label} is missing`);
  exactKeys(snapshot, ["fileCount", "totalBytes", "sha256"], label);
  invariant(Number.isSafeInteger(snapshot.fileCount) && snapshot.fileCount > 0, `${label}.fileCount invalid`);
  invariant(Number.isSafeInteger(snapshot.totalBytes) && snapshot.totalBytes > 0, `${label}.totalBytes invalid`);
  invariant(SHA256_PATTERN.test(snapshot.sha256 || ""), `${label}.sha256 invalid`);
  return snapshot;
}

function criticalSourceProjection(sourceBindings) {
  return sourceBindings.criticalSourceAndQa.map(({path: itemPath, bytes, sha256: digest}) => ({
    path: itemPath,
    bytes,
    sha256: digest,
  }));
}

function currencyForBindings(sourceBindings, currencyEvidence) {
  const projection = sourceBindingProjection(sourceBindings);
  const snapshots = Object.values(currencyEvidence.snapshots);
  const packageSourceUnchanged = snapshots.every((snapshot) =>
    sameValue(snapshot, currencyEvidence.currentPackageSnapshot)
  );
  invariant(packageSourceUnchanged, "v7 package source changed after raw observation");
  const criticalProjection = criticalSourceProjection(sourceBindings);
  const criticalSourcesBound = criticalProjection.length === CRITICAL_SOURCE_PATHS.length &&
    criticalProjection.every((binding, index) => binding.path === CRITICAL_SOURCE_PATHS[index]);
  invariant(criticalSourcesBound, "critical final-successor source set is incomplete");
  const snapshotProjection = Object.entries(currencyEvidence.snapshots).map(([name, snapshot]) => ({
    name,
    ...snapshot,
  }));
  return {
    allInputsCurrent: packageSourceUnchanged && criticalSourcesBound,
    boundInputCount: projection.length,
    inputSetSha256: sha256(Buffer.from(stableJson(projection), "utf8")),
    packageSourceUnchangedSinceRawObservation: packageSourceUnchanged,
    criticalSourcesBoundAtSuccessorAssembly: criticalSourcesBound,
    packageSnapshot: currencyEvidence.currentPackageSnapshot,
    sourceSnapshots: currencyEvidence.snapshots,
    snapshotSetSha256: sha256(Buffer.from(stableJson(snapshotProjection), "utf8")),
    criticalSourceCount: criticalProjection.length,
    criticalSourceSetSha256:
      sha256(Buffer.from(stableJson(criticalProjection), "utf8")),
    criticalSourceCoverage: currencyEvidence.criticalSourceCoverage,
  };
}

function validateInputCurrency(inputCurrency, sourceBindings) {
  exactKeys(inputCurrency, [
    "allInputsCurrent",
    "boundInputCount",
    "inputSetSha256",
    "packageSourceUnchangedSinceRawObservation",
    "criticalSourcesBoundAtSuccessorAssembly",
    "packageSnapshot",
    "sourceSnapshots",
    "snapshotSetSha256",
    "criticalSourceCount",
    "criticalSourceSetSha256",
    "criticalSourceCoverage",
  ], "inputCurrency");
  const projection = sourceBindingProjection(sourceBindings);
  invariant(inputCurrency.allInputsCurrent === true, "inputCurrency must fail closed on drift");
  invariant(inputCurrency.packageSourceUnchangedSinceRawObservation === true, "package source currency is false");
  invariant(inputCurrency.criticalSourcesBoundAtSuccessorAssembly === true, "critical source binding is incomplete");
  invariant(inputCurrency.boundInputCount === projection.length, "inputCurrency.boundInputCount drifted");
  invariant(
    inputCurrency.inputSetSha256 === sha256(Buffer.from(stableJson(projection), "utf8")),
    "inputCurrency.inputSetSha256 drifted",
  );
  validateSnapshotShape(inputCurrency.packageSnapshot, "inputCurrency.packageSnapshot");
  exactKeys(inputCurrency.sourceSnapshots, [
    "manifestBefore",
    "manifestAfter",
    "rawPackage",
    "rawCurrent",
    "rawStart",
    "rawEnd",
    "fqR6Assembly",
    "wholeR6Assembly",
    "finalAssemblyStart",
    "finalAssemblyEnd",
  ], "inputCurrency.sourceSnapshots");
  for (const [name, snapshot] of Object.entries(inputCurrency.sourceSnapshots)) {
    validateSnapshotShape(snapshot, `inputCurrency.sourceSnapshots.${name}`);
    invariant(sameValue(snapshot, inputCurrency.packageSnapshot), `inputCurrency source snapshot ${name} drifted`);
  }
  const snapshotProjection = Object.entries(inputCurrency.sourceSnapshots).map(([name, snapshot]) => ({
    name,
    ...snapshot,
  }));
  invariant(
    inputCurrency.snapshotSetSha256 ===
      sha256(Buffer.from(stableJson(snapshotProjection), "utf8")),
    "inputCurrency.snapshotSetSha256 drifted",
  );
  const criticalProjection = criticalSourceProjection(sourceBindings);
  invariant(inputCurrency.criticalSourceCount === CRITICAL_SOURCE_PATHS.length, "inputCurrency critical count drifted");
  invariant(
    inputCurrency.criticalSourceSetSha256 ===
      sha256(Buffer.from(stableJson(criticalProjection), "utf8")),
    "inputCurrency critical source set hash drifted",
  );
  exactKeys(inputCurrency.criticalSourceCoverage, [
    "packageSnapshotAggregateCount",
    "rawOrR6ExactBindingCount",
    "keytermsR2ExactBindingCount",
    "successorAssemblyOnlyCount",
  ], "inputCurrency.criticalSourceCoverage");
}

function isPackageSnapshotCovered(relativePath) {
  return V7_PACKAGE_SOURCE_INPUTS.some((sourcePath) =>
    relativePath === sourcePath || relativePath.startsWith(`${sourcePath}/`)
  );
}

function validateCoreSourceBindings(sourceBindings) {
  exactKeys(sourceBindings, [
    "package",
    "deepCurrentJavascriptQa",
    "audioStaticReconciliation",
    "combinedKeytermsProductReferenceBindingSuccessor",
    "criticalSourceAndQa",
  ], "sourceBindings core");
  exactKeys(sourceBindings.package, ["smoke", "manifest", "archive", "archiveSha256"], "sourceBindings.package");
  for (const [key, recordKey] of [
    ["smoke", "packageSmoke"],
    ["manifest", "packageManifest"],
    ["archive", "packageArchive"],
    ["archiveSha256", "packageArchiveSha256"],
  ]) validateRoleDescriptor(sourceBindings.package[key], {
    path: CORE_INPUT_PATHS[recordKey], role: CORE_SOURCE_ROLES[recordKey],
  }, `sourceBindings.package.${key}`);
  exactKeys(sourceBindings.deepCurrentJavascriptQa, [
    "rawJson", "rawMarkdown", "fqR6Json", "fqR6Markdown",
    "wholeR6Json", "wholeR6Markdown",
  ], "sourceBindings.deepCurrentJavascriptQa");
  for (const key of [
    "rawJson", "rawMarkdown", "fqR6Json", "fqR6Markdown",
    "wholeR6Json", "wholeR6Markdown",
  ]) validateRoleDescriptor(sourceBindings.deepCurrentJavascriptQa[key], {
    path: CORE_INPUT_PATHS[key], role: CORE_SOURCE_ROLES[key],
  }, `sourceBindings.deepCurrentJavascriptQa.${key}`);
  exactKeys(sourceBindings.audioStaticReconciliation, ["json", "markdown"], "sourceBindings.audioStaticReconciliation");
  validateRoleDescriptor(sourceBindings.audioStaticReconciliation.json, {
    path: CORE_INPUT_PATHS.audioStaticJson, role: CORE_SOURCE_ROLES.audioStaticJson,
  }, "sourceBindings.audioStaticReconciliation.json");
  validateRoleDescriptor(sourceBindings.audioStaticReconciliation.markdown, {
    path: CORE_INPUT_PATHS.audioStaticMarkdown, role: CORE_SOURCE_ROLES.audioStaticMarkdown,
  }, "sourceBindings.audioStaticReconciliation.markdown");
  exactKeys(
    sourceBindings.combinedKeytermsProductReferenceBindingSuccessor,
    ["json", "markdown"],
    "sourceBindings.combinedKeytermsProductReferenceBindingSuccessor",
  );
  validateRoleDescriptor(
    sourceBindings.combinedKeytermsProductReferenceBindingSuccessor.json,
    {
      path: CORE_INPUT_PATHS.keytermsR2Json,
      role: CORE_SOURCE_ROLES.keytermsR2Json,
    },
    "sourceBindings.combinedKeytermsProductReferenceBindingSuccessor.json",
  );
  validateRoleDescriptor(
    sourceBindings.combinedKeytermsProductReferenceBindingSuccessor.markdown,
    {
      path: CORE_INPUT_PATHS.keytermsR2Markdown,
      role: CORE_SOURCE_ROLES.keytermsR2Markdown,
    },
    "sourceBindings.combinedKeytermsProductReferenceBindingSuccessor.markdown",
  );
  invariant(Array.isArray(sourceBindings.criticalSourceAndQa), "critical source bindings missing");
  invariant(sourceBindings.criticalSourceAndQa.length === CRITICAL_SOURCE_PATHS.length, "critical source binding count drifted");
  sourceBindings.criticalSourceAndQa.forEach((binding, index) =>
    validateRoleDescriptor(binding, {
      path: CRITICAL_SOURCE_PATHS[index],
      role: "critical-source-or-qa-at-final-successor-assembly",
    }, `sourceBindings.criticalSourceAndQa.${index}`)
  );
}

async function defaultSourceSnapshotCollector({manifest}) {
  return buildCurrentPackageInputSnapshot({members: manifest.members});
}

export async function collectCoreEvidence({
  projectRoot,
  inputPaths = CORE_INPUT_PATHS,
  criticalSourcePaths = CRITICAL_SOURCE_PATHS,
  sourceSnapshotCollector = defaultSourceSnapshotCollector,
} = {}) {
  const root = path.resolve(projectRoot);
  invariant(
    sourceSnapshotCollector === defaultSourceSnapshotCollector ||
      process.env.NODE_TEST_CONTEXT !== undefined,
    "custom source snapshot collectors are test-only",
  );
  invariant(sameValue(inputPaths, CORE_INPUT_PATHS), "core input path set drifted");
  invariant(sameValue(criticalSourcePaths, CRITICAL_SOURCE_PATHS), "critical source path set drifted");
  const records = {};
  for (const [key, relativePath] of Object.entries(inputPaths)) {
    records[key] = await readRecord(root, relativePath, {
      json: key.endsWith("Json") || key === "packageSmoke" ||
        key === "packageManifest",
    });
  }
  records.criticalSources = [];
  for (const relativePath of criticalSourcePaths) {
    records.criticalSources.push((await readRecord(root, relativePath)).descriptor);
  }
  records.criticalSourcesByPath = new Map(
    records.criticalSources.map((descriptor) => [descriptor.path, descriptor]),
  );

  validateManifest(records.packageManifest.document);
  validateSmoke(records.packageSmoke.document, records);
  validateRaw(records.rawJson.document, records);
  validateR6(records.fqR6Json.document, "fq", records);
  validateR6(records.wholeR6Json.document, "whole", records);
  validateAudio(records.audioStaticJson.document);
  validateKeytermsR2(records.keytermsR2Json.document, records);

  for (const receipt of [records.fqR6Json.document, records.wholeR6Json.document]) {
    for (const binding of receipt.sourceBindings) {
      const actual = records.criticalSourcesByPath.get(binding.path);
      invariant(actual, `r6 source binding is outside the fixed critical set: ${binding.path}`);
      assertDescriptorMatches(binding, actual, `r6.sourceBindings.${binding.path}`);
    }
  }

  const sidecar = records.packageArchiveSha256.bytes.toString("utf8").trim();
  const match = /^([a-f0-9]{64})\s+([^/\\\s]+\.zip)$/.exec(sidecar);
  invariant(
    match && match[1] === records.packageArchive.descriptor.sha256 &&
      match[2] === path.basename(records.packageArchive.descriptor.path),
    "v7 archive sidecar does not bind the ZIP",
  );
  invariant(
    records.rawMarkdown.bytes.length > 0 &&
      records.fqR6Markdown.bytes.length > 0 &&
      records.wholeR6Markdown.bytes.length > 0 &&
      records.audioStaticMarkdown.bytes.length > 0 &&
      records.keytermsR2Markdown.bytes.length > 0,
    "required human-readable boundary artifact is empty",
  );

  const sourceBindings = {
    package: {
      smoke: withRole(records.packageSmoke.descriptor, CORE_SOURCE_ROLES.packageSmoke),
      manifest: withRole(records.packageManifest.descriptor, CORE_SOURCE_ROLES.packageManifest),
      archive: withRole(records.packageArchive.descriptor, CORE_SOURCE_ROLES.packageArchive),
      archiveSha256: withRole(records.packageArchiveSha256.descriptor, CORE_SOURCE_ROLES.packageArchiveSha256),
    },
    deepCurrentJavascriptQa: {
      rawJson: withRole(records.rawJson.descriptor, CORE_SOURCE_ROLES.rawJson),
      rawMarkdown: withRole(records.rawMarkdown.descriptor, CORE_SOURCE_ROLES.rawMarkdown),
      fqR6Json: withRole(records.fqR6Json.descriptor, CORE_SOURCE_ROLES.fqR6Json),
      fqR6Markdown: withRole(records.fqR6Markdown.descriptor, CORE_SOURCE_ROLES.fqR6Markdown),
      wholeR6Json: withRole(records.wholeR6Json.descriptor, CORE_SOURCE_ROLES.wholeR6Json),
      wholeR6Markdown: withRole(records.wholeR6Markdown.descriptor, CORE_SOURCE_ROLES.wholeR6Markdown),
    },
    audioStaticReconciliation: {
      json: withRole(records.audioStaticJson.descriptor, CORE_SOURCE_ROLES.audioStaticJson),
      markdown: withRole(records.audioStaticMarkdown.descriptor, CORE_SOURCE_ROLES.audioStaticMarkdown),
    },
    combinedKeytermsProductReferenceBindingSuccessor: {
      json: withRole(
        records.keytermsR2Json.descriptor,
        CORE_SOURCE_ROLES.keytermsR2Json,
      ),
      markdown: withRole(
        records.keytermsR2Markdown.descriptor,
        CORE_SOURCE_ROLES.keytermsR2Markdown,
      ),
    },
    criticalSourceAndQa: records.criticalSources.map((descriptor) => withRole(
      descriptor,
      "critical-source-or-qa-at-final-successor-assembly",
    )),
  };
  validateCoreSourceBindings(sourceBindings);
  const currentPackageSnapshotAtStart = await sourceSnapshotCollector({
    root,
    manifest: records.packageManifest.document,
  });
  validateSnapshotShape(currentPackageSnapshotAtStart, "currentPackageSnapshotAtStart");
  for (const initial of records.criticalSources) {
    const current = (await readRecord(root, initial.path)).descriptor;
    assertDescriptorMatches(current, initial, `critical source stable read ${initial.path}`);
  }
  const currentPackageSnapshotAtEnd = await sourceSnapshotCollector({
    root,
    manifest: records.packageManifest.document,
  });
  validateSnapshotShape(currentPackageSnapshotAtEnd, "currentPackageSnapshotAtEnd");
  invariant(
    sameValue(currentPackageSnapshotAtStart, currentPackageSnapshotAtEnd),
    "v7 package source changed during final successor assembly",
  );
  const rawSource = records.rawJson.document.sourceObservation;
  const snapshots = {
    manifestBefore: records.packageManifest.document.build.inputSnapshotBefore,
    manifestAfter: records.packageManifest.document.build.inputSnapshotAfter,
    rawPackage: rawSource.packageSnapshot,
    rawCurrent: rawSource.currentSnapshot,
    rawStart: rawSource.currentSnapshotAtStart,
    rawEnd: rawSource.currentSnapshotAtEnd,
    fqR6Assembly:
      records.fqR6Json.document.packageEvidence.currentSourceSnapshotAtSuccessorAssembly,
    wholeR6Assembly:
      records.wholeR6Json.document.packageEvidence.currentSourceSnapshotAtSuccessorAssembly,
    finalAssemblyStart: currentPackageSnapshotAtStart,
    finalAssemblyEnd: currentPackageSnapshotAtEnd,
  };
  for (const [name, snapshot] of Object.entries(snapshots)) {
    validateSnapshotShape(snapshot, `source snapshot ${name}`);
    invariant(sameValue(snapshot, currentPackageSnapshotAtEnd), `source snapshot ${name} drifted`);
  }
  const r6BoundPaths = new Set([
    ...records.fqR6Json.document.sourceBindings,
    ...records.wholeR6Json.document.sourceBindings,
  ].map(({path: bindingPath}) => bindingPath));
  const keytermsR2BoundPaths = new Set([
    records.keytermsR2Json.document.sourceBindings.generator.path,
    records.keytermsR2Json.document.sourceBindings.test.path,
  ]);
  const criticalSourceCoverage = {
    packageSnapshotAggregateCount: criticalSourcePaths.filter(isPackageSnapshotCovered).length,
    rawOrR6ExactBindingCount: criticalSourcePaths.filter((relativePath) =>
      r6BoundPaths.has(relativePath) ||
      relativePath === "scripts/qa-g5-l4-v7-deep-product.mjs" ||
      relativePath === "scripts/qa-g5-l4-v7-deep-product.test.mjs"
    ).length,
    keytermsR2ExactBindingCount: criticalSourcePaths.filter((relativePath) =>
      keytermsR2BoundPaths.has(relativePath)
    ).length,
    successorAssemblyOnlyCount: 0,
  };
  invariant(
    criticalSourceCoverage.keytermsR2ExactBindingCount === 2,
    "combined Key Terms r2 critical source coverage drifted",
  );
  criticalSourceCoverage.successorAssemblyOnlyCount = criticalSourcePaths.length -
    new Set(criticalSourcePaths.filter((relativePath) =>
      isPackageSnapshotCovered(relativePath) || r6BoundPaths.has(relativePath) ||
      keytermsR2BoundPaths.has(relativePath) ||
      relativePath === "scripts/qa-g5-l4-v7-deep-product.mjs" ||
      relativePath === "scripts/qa-g5-l4-v7-deep-product.test.mjs"
    )).size;
  const currencyEvidence = {
    snapshots,
    currentPackageSnapshot: currentPackageSnapshotAtEnd,
    criticalSourceCoverage,
  };
  const projection = sourceBindingProjection(sourceBindings);
  return {
    root,
    records,
    sourceBindings,
    inputSetSha256: sha256(Buffer.from(stableJson(projection), "utf8")),
    boundInputCount: projection.length,
    packageSnapshot: currentPackageSnapshotAtEnd,
    currencyEvidence,
  };
}

function baseReport({reportType, generator, core}) {
  return {
    schemaVersion: 1,
    reportType,
    releaseId: RELEASE_ID,
    packageId: PACKAGE_ID,
    evidenceState:
      "hash-bound-v7-current-javascript-private-preview-machine-successor-original-runtime-human-owner-strict-publication-pending",
    authority:
      "This successor records only hash-bound v7 private current-JavaScript package and machine-QA evidence. It does not establish authoritative original-runtime evidence, audio acceptance, independent human review, Owner fidelity acceptance, strict completion, deployment, release, or publication.",
    generator: withRole(generator, "v7-final-successor-generator"),
    sourceBindings: core.sourceBindings,
    inputCurrency: currencyForBindings(core.sourceBindings, core.currencyEvidence),
  };
}

function descriptorFromBytes(relativePath, bytes, role) {
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes), role};
}

function validatePairEnvelope(pair, kind, label = `${kind} pair`) {
  exactKeys(pair, ["json", "markdown"], label);
  validateRoleDescriptor(pair.json, {
    path: `${OUTPUTS[kind]}.json`,
    role: SUCCESSOR_PAIR_ROLES[kind].json,
  }, `${label}.json`);
  validateRoleDescriptor(pair.markdown, {
    path: `${OUTPUTS[kind]}.md`,
    role: SUCCESSOR_PAIR_ROLES[kind].markdown,
  }, `${label}.markdown`);
  return pair;
}

function coreBindingsFrom(sourceBindings) {
  return {
    package: sourceBindings.package,
    deepCurrentJavascriptQa: sourceBindings.deepCurrentJavascriptQa,
    audioStaticReconciliation: sourceBindings.audioStaticReconciliation,
    combinedKeytermsProductReferenceBindingSuccessor:
      sourceBindings.combinedKeytermsProductReferenceBindingSuccessor,
    criticalSourceAndQa: sourceBindings.criticalSourceAndQa,
  };
}

function validateBaseReport(report, kind) {
  const expectedSourceKeys = [
    "package",
    "deepCurrentJavascriptQa",
    "audioStaticReconciliation",
    "combinedKeytermsProductReferenceBindingSuccessor",
    "criticalSourceAndQa",
    ...(kind === "delivery" ? ["continuationSuccessor"] : []),
    ...(kind === "owner"
      ? ["continuationSuccessor", "deliveryReceipt", "ownerAndExternalGateInputs"]
      : []),
  ];
  exactKeys(report.sourceBindings, expectedSourceKeys, `${kind}.sourceBindings`);
  validateCoreSourceBindings(coreBindingsFrom(report.sourceBindings));
  if (kind === "delivery" || kind === "owner") {
    validatePairEnvelope(report.sourceBindings.continuationSuccessor, "continuation", `${kind}.continuationSuccessor`);
  }
  if (kind === "owner") {
    validatePairEnvelope(report.sourceBindings.deliveryReceipt, "delivery", "owner.deliveryReceipt");
    exactKeys(report.sourceBindings.ownerAndExternalGateInputs, Object.keys(OWNER_INPUT_PATHS), "owner gate input bindings");
    for (const [key, relativePath] of Object.entries(OWNER_INPUT_PATHS)) {
      validateRoleDescriptor(report.sourceBindings.ownerAndExternalGateInputs[key], {
        path: relativePath,
        role: OWNER_INPUT_ROLES[key],
      }, `owner gate input ${key}`);
    }
  }
  validateInputCurrency(report.inputCurrency, report.sourceBindings);
  validateRoleDescriptor(report.generator, {
    path: GENERATORS[kind], role: "v7-final-successor-generator",
  }, `${kind}.generator`);
  validateRoleDescriptor(report.companionMarkdown, {
    path: `${OUTPUTS[kind]}.md`, role: SUCCESSOR_PAIR_ROLES[kind].markdown,
  }, `${kind}.companionMarkdown`);
}

function attachCompanionMarkdown(kind, report) {
  invariant(report.companionMarkdown === undefined, `${kind} companion already attached`);
  const bytes = Buffer.from(renderMarkdown(kind, report), "utf8");
  report.companionMarkdown = descriptorFromBytes(
    `${OUTPUTS[kind]}.md`,
    bytes,
    SUCCESSOR_PAIR_ROLES[kind].markdown,
  );
  return report;
}

export async function buildContinuationReport({
  projectRoot,
  inputPaths,
  criticalSourcePaths,
  sourceSnapshotCollector,
  generatorPath = GENERATORS.continuation,
} = {}) {
  const core = await collectCoreEvidence({
    projectRoot,
    inputPaths,
    criticalSourcePaths,
    ...(sourceSnapshotCollector ? {sourceSnapshotCollector} : {}),
  });
  const generator = (await readRecord(core.root, generatorPath)).descriptor;
  const report = {
    ...baseReport({
      reportType: "g5-l4-continuation-machine-readiness-v7-successor",
      generator,
      core,
    }),
    staticSpecificationMachinePreparationExhausted: true,
    currentJavascriptDeepProductQaMachineWorkExhausted: true,
    fourV6RemediationsResolvedInV7: true,
    audioStaticReconciliationComplete: true,
    audioRuntimeReachability: "pending-original-runtime",
    audioListening: "pending-named-human",
    currentJavascriptBoundary: {
      rawStatus: core.records.rawJson.document.status,
      exactReleaseOrderFreshlyEstablished: true,
      remediationChecksPassed: 4,
      sourceCurrentAtObservation: true,
      productQaComplete: false,
      migrationQaComplete: false,
    },
    releaseBoundary: {
      expectedMembers: 55,
      strictCompleteCount: 0,
      missingStrictCompletionEntryCount: 55,
      published: false,
    },
    remainingGates: [
      "Owner technical approval and exact immutable original-runtime session authorization",
      "authorized EN/ES original-runtime natural traversal and 44 Animate authoring audits",
      "authoritative full-frame evidence, comparison, and RMSE review for all requirements",
      "audio runtime reachability, synchronization, spoken-language verification, and named-human listening",
      "recover L4KTE01.xml and L4KTS01.xml or admit a validator-supported Owner-reviewed bounded exception",
      "independent engineering, visual, audio, and Spanish review",
      "Owner fidelity acceptance, strict validation, and atomic publication authorization",
    ],
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    acceptanceNeutral: true,
    strictAcceptanceEffect: "none",
  };
  attachCompanionMarkdown("continuation", report);
  return validateContinuationReport(report);
}

export function validateContinuationReport(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType ===
        "g5-l4-continuation-machine-readiness-v7-successor" &&
      report.releaseId === RELEASE_ID && report.packageId === PACKAGE_ID,
    "continuation successor identity drifted",
  );
  invariant(
    report.staticSpecificationMachinePreparationExhausted === true &&
      report.currentJavascriptDeepProductQaMachineWorkExhausted === true &&
      report.fourV6RemediationsResolvedInV7 === true &&
      report.audioStaticReconciliationComplete === true &&
      report.currentJavascriptBoundary?.productQaComplete === false &&
      report.currentJavascriptBoundary?.migrationQaComplete === false &&
      report.releaseBoundary?.expectedMembers === 55 &&
      report.releaseBoundary?.strictCompleteCount === 0 &&
      report.releaseBoundary?.missingStrictCompletionEntryCount === 55 &&
      report.releaseBoundary?.published === false,
    "continuation successor boundary drifted",
  );
  assertAllFalse(report.acceptanceEffects);
  invariant(
    report.acceptanceNeutral === true && report.strictAcceptanceEffect === "none",
    "continuation successor must remain acceptance-neutral",
  );
  validateBaseReport(report, "continuation");
  return report;
}

async function bindUpstreamPair(root, prefix, kind, validator, label, core) {
  invariant(prefix === OUTPUTS[kind], `${label} prefix drifted`);
  const jsonRecord = await readRecord(root, `${prefix}.json`, {json: true});
  const markdownRecord = await readRecord(root, `${prefix}.md`);
  validator(jsonRecord.document);
  const pair = {
    json: withRole(jsonRecord.descriptor, SUCCESSOR_PAIR_ROLES[kind].json),
    markdown: withRole(markdownRecord.descriptor, SUCCESSOR_PAIR_ROLES[kind].markdown),
  };
  validatePairEnvelope(pair, kind, label);
  assertDescriptorMatches(
    jsonRecord.document.companionMarkdown,
    markdownRecord.descriptor,
    `${label}.companionMarkdown`,
  );
  invariant(
    jsonRecord.document.companionMarkdown.role === SUCCESSOR_PAIR_ROLES[kind].markdown,
    `${label} companion Markdown role drifted`,
  );
  invariant(
    sameValue(coreBindingsFrom(jsonRecord.document.sourceBindings), core.sourceBindings),
    `${label} core source bindings are stale`,
  );
  invariant(
    sameValue(jsonRecord.document.inputCurrency.packageSnapshot, core.packageSnapshot) &&
      jsonRecord.document.inputCurrency.criticalSourceSetSha256 ===
        currencyForBindings(core.sourceBindings, core.currencyEvidence).criticalSourceSetSha256,
    `${label} source currency is stale`,
  );
  return {pair, document: jsonRecord.document};
}

export async function buildDeliveryReport({
  projectRoot,
  inputPaths,
  criticalSourcePaths,
  sourceSnapshotCollector,
  continuationPrefix = OUTPUTS.continuation,
  generatorPath = GENERATORS.delivery,
} = {}) {
  const core = await collectCoreEvidence({
    projectRoot,
    inputPaths,
    criticalSourcePaths,
    ...(sourceSnapshotCollector ? {sourceSnapshotCollector} : {}),
  });
  const generator = (await readRecord(core.root, generatorPath)).descriptor;
  const continuationBound = await bindUpstreamPair(
    core.root,
    continuationPrefix,
    "continuation",
    validateContinuationReport,
    "continuation successor",
    core,
  );
  const report = {
    ...baseReport({
      reportType: "g5-l4-whole-lesson-package-mvp-v7-delivery-receipt",
      generator,
      core,
    }),
    sourceBindings: {
      ...core.sourceBindings,
      continuationSuccessor: continuationBound.pair,
    },
    deliveryBoundary: {
      privateLocalCeoPreviewPackageVerified: true,
      freshUnzipSmokePassed: true,
      deepCurrentJavascriptQaPassed: true,
      fourV6RemediationsResolvedInV7: true,
      externalDeploymentPerformed: false,
      publicReleaseAuthorized: false,
    },
    releaseBoundary: {
      expectedMembers: 55,
      currentJavascriptPages: 54,
      strictCompleteCount: 0,
      published: false,
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    acceptanceNeutral: true,
    strictAcceptanceEffect: "none",
  };
  report.inputCurrency = currencyForBindings(
    report.sourceBindings,
    core.currencyEvidence,
  );
  attachCompanionMarkdown("delivery", report);
  return validateDeliveryReport(report);
}

export function validateDeliveryReport(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType ===
        "g5-l4-whole-lesson-package-mvp-v7-delivery-receipt" &&
      report.releaseId === RELEASE_ID && report.packageId === PACKAGE_ID,
    "delivery receipt identity drifted",
  );
  invariant(
    report.deliveryBoundary?.privateLocalCeoPreviewPackageVerified === true &&
      report.deliveryBoundary.freshUnzipSmokePassed === true &&
      report.deliveryBoundary.deepCurrentJavascriptQaPassed === true &&
      report.deliveryBoundary.externalDeploymentPerformed === false &&
      report.deliveryBoundary.publicReleaseAuthorized === false &&
      report.releaseBoundary?.expectedMembers === 55 &&
      report.releaseBoundary?.currentJavascriptPages === 54 &&
      report.releaseBoundary?.strictCompleteCount === 0 &&
      report.releaseBoundary?.published === false,
    "delivery receipt boundary drifted",
  );
  assertAllFalse(report.acceptanceEffects);
  invariant(
    report.acceptanceNeutral === true && report.strictAcceptanceEffect === "none",
    "delivery receipt must remain acceptance-neutral",
  );
  validateBaseReport(report, "delivery");
  return report;
}

function selectRelease(ledger) {
  const release = ledger?.releases?.find((item) => item.releaseId === RELEASE_ID);
  invariant(
    release?.expectedMemberCount === 55 && release.strictCompleteCount === 0 &&
      release.missingCount === 55 && release.published === false &&
      release.status === "unpublished",
    "Owner packet release-ledger boundary drifted",
  );
  return release;
}

function validateOperatorRoleReceipt(operator) {
  invariant(
    operator?.schemaVersion === 1 &&
      operator.evidenceType ===
        "g5-l4-user-stated-original-runtime-animate-operator-assignment-intake" &&
      operator.releaseId === RELEASE_ID,
    "operator-assignment receipt identity drifted",
  );
  invariant(
    operator.assignment?.roleId === "authorized-original-runtime-operator" &&
      operator.assignment.slot === "primary" &&
      operator.assignment.assigneeFullName === "Dr. Peter Hu" &&
      operator.assignment.samePersonAsOwner === true &&
      operator.assignment.explicit === true &&
      sameValue(operator.assignment.duties, [
        "authorized-original-runtime-human-operator",
        "adobe-animate-human-dialog-operator",
      ]),
    "operator-assignment role drifted",
  );
  invariant(
    operator.authorityBoundary?.assignmentUserAttested === true &&
      operator.authorityBoundary.namedHumanRoleAssignmentEstablished === true &&
      operator.authorityBoundary.namedRoleSlotCountEffect === 1 &&
      operator.authorityBoundary.strictAcceptanceEffect ===
        "named-primary-operator-role-only",
    "operator-assignment role boundary drifted",
  );
  for (const key of [
    "assigneeIdentityCryptographicallyVerified",
    "weeklyCapacityCommitmentEstablished",
    "backupAssignmentEstablished",
    "runtimeHostApproved",
    "containmentApproved",
    "immutableSessionAuthorizationEstablished",
    "animateGuiExecutionAuthorizedByThisReceiptAlone",
    "originalRuntimeExecutionAuthorizedByThisReceiptAlone",
    "actualAnimateExecutionEstablished",
    "actualOriginalRuntimeSessionEstablished",
    "humanReviewAccepted",
    "ownerFidelityAcceptanceEstablished",
    "strictCompletionEstablished",
    "publicationAuthorized",
  ]) invariant(operator.authorityBoundary[key] === false, `operator authority ${key} drifted`);
  invariant(operator.externalSignatureEnvelope === null, "operator receipt invented a signature");
}

export async function buildOwnerReport({
  projectRoot,
  inputPaths,
  criticalSourcePaths,
  sourceSnapshotCollector,
  ownerInputPaths = OWNER_INPUT_PATHS,
  continuationPrefix = OUTPUTS.continuation,
  deliveryPrefix = OUTPUTS.delivery,
  generatorPath = GENERATORS.owner,
} = {}) {
  const core = await collectCoreEvidence({
    projectRoot,
    inputPaths,
    criticalSourcePaths,
    ...(sourceSnapshotCollector ? {sourceSnapshotCollector} : {}),
  });
  const generator = (await readRecord(core.root, generatorPath)).descriptor;
  const continuationBound = await bindUpstreamPair(
    core.root,
    continuationPrefix,
    "continuation",
    validateContinuationReport,
    "continuation successor",
    core,
  );
  const deliveryBound = await bindUpstreamPair(
    core.root,
    deliveryPrefix,
    "delivery",
    validateDeliveryReport,
    "delivery receipt",
    core,
  );
  invariant(
    sameValue(
      deliveryBound.document.sourceBindings.continuationSuccessor,
      continuationBound.pair,
    ),
    "delivery receipt does not bind the same continuation pair used by Owner",
  );
  const ownerRecords = {};
  for (const [key, relativePath] of Object.entries(ownerInputPaths)) {
    ownerRecords[key] = await readRecord(core.root, relativePath, {
      json: key !== "predecessorMarkdown",
    });
  }
  const operator = ownerRecords.operatorAssignment.document;
  validateOperatorRoleReceipt(operator);
  validateG5L4OwnerWorkAuthorizationReceipt(ownerRecords.ownerWorkAuthorization.document);
  const predecessor = ownerRecords.predecessorJson.document;
  validateOwnerActionPacket(predecessor);
  invariant(ownerRecords.predecessorMarkdown.bytes.length > 0, "Owner predecessor Markdown is empty");
  const session = ownerRecords.perSessionPreparation.document;
  validateG5L4PerSessionAuthorizationPreparation(session);
  invariant(
    session?.evidenceState === "unsigned-non-runnable-session-preparation-only" &&
      session.summary?.sessionsExecuted === 0 &&
      session.summary.runnableTemplates === 0,
    "per-session preparation boundary drifted",
  );
  const missing = ownerRecords.missingKeyterms.document;
  validateG5L4MissingKeytermRecoveryReadiness(missing);
  invariant(
    missing?.releaseId === RELEASE_ID &&
      missing.recoveryGate?.exactTargetCandidates === 0 &&
      missing.recoveryGate.recoveredTargets === 0 &&
      missing.recoveryGate.sourceGapClosed === false,
    "missing-KeyTerms boundary drifted",
  );
  const exception = ownerRecords.keytermsException.document;
  validateG5L4KeytermsSourceGapExceptionProposal(exception);
  invariant(
    exception?.status ===
      "unsigned-proposal-runtime-observation-and-owner-review-required" &&
      exception.admissionPrerequisites?.every((item) => item.satisfied === false) &&
      exception.unsignedOwnerDecision?.decision === "pending",
    "KeyTerms exception boundary drifted",
  );
  const release = selectRelease(ownerRecords.releaseLedger.document);
  const ownerBindings = Object.fromEntries(
    Object.entries(ownerRecords).map(([key, value]) => [
      key,
      withRole(value.descriptor, OWNER_INPUT_ROLES[key]),
    ]),
  );
  const report = {
    ...baseReport({
      reportType: "g5-l4-owner-action-packet-v7-successor",
      generator,
      core,
    }),
    sourceBindings: {
      ...core.sourceBindings,
      continuationSuccessor: continuationBound.pair,
      deliveryReceipt: deliveryBound.pair,
      ownerAndExternalGateInputs: ownerBindings,
    },
    ownerIdentity: {
      ownerFullName: "Dr. Peter Hu",
      identityBasis: "user-attested-current-codex-task",
      cryptographicallyVerified: false,
    },
    operatorBoundary: {
      namedPrimaryRoleAssigned: true,
      assigneeFullName: "Dr. Peter Hu",
      samePersonAsOwner: true,
      exactSessionOperatorDeclarationEstablished: false,
      immutableSessionAuthorizationEstablished: false,
      runtimeHostApproved: false,
      originalRuntimeSessionExecuted: false,
      distinction:
        "The named primary operator role is recorded. That role assignment is not an exact-session declaration, immutable authorization, host approval, execution record, or original-runtime evidence.",
    },
    exactSessionTemplate: {
      sessionId: null,
      nonce: null,
      expiresAt: null,
      exactHostIdentifier: null,
      launchPath: null,
      launchCommand: null,
      readOnlyLessonTreePath: null,
      runtimeProfilePath: null,
      stopConditions: [],
      ownerExecutionAuthorization: null,
      operatorDeclaration: null,
      signatureEnvelope: null,
      runnable: false,
    },
    keytermsBoundary: {
      missingLessonLocalBasenames: ["L4KTE01.xml", "L4KTS01.xml"],
      exactCandidateCount: 0,
      recoveredTargetCount: 0,
      combinedElementaryReferenceUseAuthorized: true,
      lessonSpecificSubstitutionAuthorized: false,
      sourceGapClosed: false,
      reviewedExceptionEstablished: false,
    },
    orderedRemainingOwnerAndHumanActions: [
      "Approve and exact-session verify CR-01 through CR-08, the host, launch path, stop conditions, and one-time authorization.",
      "Complete the exact-session operator declaration for the already assigned primary operator Dr. Peter Hu.",
      "Recover both missing lesson-local KeyTerms XML files or review a validator-supported bounded exception after original-runtime request/load evidence exists.",
      "Execute the authorized EN/ES original-runtime traversals and 44 Animate audits, including named-human audio listening.",
      "Obtain independent engineering, visual, audio, and Spanish reviews, then a separate Owner fidelity decision.",
      "After all technical evidence passes, separately approve strict validation and atomic publication.",
    ],
    releaseBoundary: {
      expectedMembers: release.expectedMemberCount,
      strictCompleteCount: release.strictCompleteCount,
      missingStrictCompletionEntryCount: release.missingCount,
      published: release.published,
    },
    acceptanceEffects: {...ACCEPTANCE_EFFECTS},
    acceptanceNeutral: true,
    strictAcceptanceEffect: "none",
  };
  report.inputCurrency = currencyForBindings(
    report.sourceBindings,
    core.currencyEvidence,
  );
  attachCompanionMarkdown("owner", report);
  return validateOwnerReport(report);
}

export function validateOwnerReport(report) {
  invariant(
    report?.schemaVersion === 1 &&
      report.reportType === "g5-l4-owner-action-packet-v7-successor" &&
      report.releaseId === RELEASE_ID && report.packageId === PACKAGE_ID,
    "Owner successor identity drifted",
  );
  invariant(
    report.operatorBoundary?.namedPrimaryRoleAssigned === true &&
      report.operatorBoundary.assigneeFullName === "Dr. Peter Hu" &&
      report.operatorBoundary.exactSessionOperatorDeclarationEstablished === false &&
      report.operatorBoundary.immutableSessionAuthorizationEstablished === false &&
      report.operatorBoundary.originalRuntimeSessionExecuted === false &&
      report.exactSessionTemplate?.operatorDeclaration === null &&
      report.exactSessionTemplate.runnable === false,
    "Owner successor conflated role assignment with exact-session authority",
  );
  invariant(
    report.keytermsBoundary?.exactCandidateCount === 0 &&
      report.keytermsBoundary.recoveredTargetCount === 0 &&
      report.keytermsBoundary.lessonSpecificSubstitutionAuthorized === false &&
      report.keytermsBoundary.sourceGapClosed === false &&
      report.releaseBoundary?.expectedMembers === 55 &&
      report.releaseBoundary?.strictCompleteCount === 0 &&
      report.releaseBoundary?.missingStrictCompletionEntryCount === 55 &&
      report.releaseBoundary?.published === false,
    "Owner successor source/release boundary drifted",
  );
  assertAllFalse(report.acceptanceEffects);
  invariant(
    report.acceptanceNeutral === true && report.strictAcceptanceEffect === "none",
    "Owner successor must remain acceptance-neutral",
  );
  validateBaseReport(report, "owner");
  return report;
}

export function renderMarkdown(kind, report) {
  const common = [
    `Release: \`${RELEASE_ID}\``,
    `Package: \`${PACKAGE_ID}\``,
    "Strict completion: **0/55**",
    "Published: **false**",
    "Strict acceptance effect: **none**",
  ].join("  \n");
  if (kind === "continuation") {
    return `# G5 L4 continuation machine-readiness v7 successor\n\n${common}\n\n` +
      "The v7 private current-JavaScript package, fresh-unzip smoke, full deep-QA matrix, and all four v6 remediation reversals are hash-bound and machine-complete. Product/migration acceptance remains false.\n\n" +
      `## Remaining gates\n\n${report.remainingGates.map((item) => `- ${item}`).join("\n")}\n`;
  }
  if (kind === "delivery") {
    return `# G5 L4 Whole-Lesson CEO Preview MVP v7 delivery receipt\n\n${common}\n\n` +
      "This receipt delivers a private, loopback-only current-JavaScript CEO preview. It grants no external deployment, original-runtime, fidelity, Owner, strict, release, or publication authority.\n";
  }
  return `# G5 L4 Owner action packet v7 successor\n\n${common}\n\n` +
    "Dr. Peter Hu is already recorded as the named primary original-runtime/Animate operator. The exact-session operator declaration and immutable session authorization remain blank; the role assignment is not execution evidence.\n\n" +
    `## Remaining Owner and human actions\n\n${report.orderedRemainingOwnerAndHumanActions.map((item) => `- ${item}`).join("\n")}\n`;
}

function outputPair(prefix) {
  assertRelativePath(prefix, "output prefix");
  invariant(prefix.startsWith("reports/"), "output prefix must be under reports/");
  return [`${prefix}.json`, `${prefix}.md`];
}

async function assertAbsent(root, relativePath) {
  try {
    await lstat(resolveInside(root, relativePath, relativePath));
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  throw new Error(`${relativePath} already exists; immutable successor is never overwritten`);
}

async function pathExists(absolutePath) {
  try {
    await lstat(absolutePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function writeExclusiveSynced(absolutePath, bytes) {
  let handle;
  let created = false;
  try {
    handle = await open(absolutePath, "wx", 0o444);
    created = true;
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = null;
  } catch (error) {
    const cleanupErrors = [];
    if (handle) {
      try { await handle.close(); } catch (cleanupError) { cleanupErrors.push(cleanupError); }
    }
    if (created) {
      try { await unlink(absolutePath); } catch (cleanupError) {
        if (cleanupError?.code !== "ENOENT") cleanupErrors.push(cleanupError);
      }
    }
    if (cleanupErrors.length) {
      throw new AggregateError(
        [error, ...cleanupErrors],
        `exclusive write failed and cleanup was incomplete: ${absolutePath}`,
      );
    }
    throw error;
  }
}

async function publishStagedPair({
  root,
  outputs,
  kind,
  publishFailureAt = null,
  cleanupFailureAt = null,
}) {
  invariant(
    publishFailureAt === null || [1, 2, 3].includes(publishFailureAt),
    "publishFailureAt must be null or a 1-based test step 1..3",
  );
  invariant(
    cleanupFailureAt === null || cleanupFailureAt === "rollback-unlink",
    "cleanupFailureAt must be null or rollback-unlink",
  );
  for (const output of outputs) await assertAbsent(root, output.path);
  const stagingRoot = await mkdtemp(path.resolve(root, `.g5-l4-v7-${kind}-stage-`));
  const staged = [];
  let operationError = null;
  let reportsRootCreated = false;
  const createdFinals = [];
  try {
    for (const [index, output] of outputs.entries()) {
      const stagedPath = path.join(stagingRoot, `${index}-${path.basename(output.path)}`);
      await writeExclusiveSynced(stagedPath, output.bytes);
      const stagedBytes = await readFile(stagedPath);
      invariant(stagedBytes.equals(output.bytes), `${output.path}: staged bytes drifted`);
      staged.push({...output, stagedPath});
    }
    for (const output of outputs) await assertAbsent(root, output.path);
    const reportsRoot = path.resolve(root, "reports");
    if (!(await pathExists(reportsRoot))) {
      await mkdir(reportsRoot, {recursive: false, mode: 0o755});
      reportsRootCreated = true;
    }
    for (const [index, output] of staged.entries()) {
      if (publishFailureAt === index + 1) {
        throw new Error(`injected publish failure at step ${publishFailureAt}`);
      }
      const finalPath = resolveInside(root, output.path, output.path);
      try {
        await writeExclusiveSynced(finalPath, await readFile(output.stagedPath));
      } catch (error) {
        if (await pathExists(finalPath)) createdFinals.push(output.path);
        throw error;
      }
      createdFinals.push(output.path);
    }
    if (publishFailureAt === 3) throw new Error("injected publish failure at step 3");
  } catch (error) {
    operationError = error;
  }

  const cleanupErrors = [];
  try { await rm(stagingRoot, {recursive: true, force: false}); } catch (error) {
    cleanupErrors.push(new Error(`staging cleanup failed: ${error.message}`, {cause: error}));
  }

  if (operationError || cleanupErrors.length) {
    for (const [rollbackIndex, relativePath] of [...createdFinals].reverse().entries()) {
      if (cleanupFailureAt === "rollback-unlink" && rollbackIndex === 0) {
        cleanupErrors.push(new Error(`injected rollback unlink failure for ${relativePath}`));
        continue;
      }
      try { await unlink(resolveInside(root, relativePath, relativePath)); } catch (error) {
        if (error?.code !== "ENOENT") {
          cleanupErrors.push(new Error(`rollback unlink failed for ${relativePath}: ${error.message}`, {cause: error}));
        }
      }
    }
    for (const relativePath of createdFinals) {
      if (await pathExists(resolveInside(root, relativePath, relativePath))) {
        cleanupErrors.push(new Error(`rollback residual remains: ${relativePath}`));
      }
    }
    if (await pathExists(stagingRoot)) {
      try { await rm(stagingRoot, {recursive: true, force: false}); } catch (error) {
        cleanupErrors.push(new Error(`staging residual remains: ${stagingRoot}: ${error.message}`, {cause: error}));
      }
    }
    if (reportsRootCreated) {
      try { await rmdir(path.resolve(root, "reports")); } catch (error) {
        cleanupErrors.push(new Error(`created reports directory cleanup failed: ${error.message}`, {cause: error}));
      }
    }
    if (cleanupErrors.length) {
      throw new AggregateError(
        [operationError, ...cleanupErrors].filter(Boolean),
        "v7 final successor pair publication failed with cleanup errors or residuals",
      );
    }
    throw operationError;
  }
}

export async function writeOrCheckPair({
  projectRoot,
  prefix,
  kind,
  report,
  check = false,
  publishFailureAt = null,
  cleanupFailureAt = null,
} = {}) {
  const root = path.resolve(projectRoot);
  const validators = {
    continuation: validateContinuationReport,
    delivery: validateDeliveryReport,
    owner: validateOwnerReport,
  };
  invariant(validators[kind], `unknown report kind: ${kind}`);
  invariant(prefix === OUTPUTS[kind], `${kind} output prefix must be fixed`);
  validators[kind](report);
  const [jsonPath, markdownPath] = outputPair(prefix);
  const markdownBytes = Buffer.from(renderMarkdown(kind, report), "utf8");
  assertDescriptorMatches(
    report.companionMarkdown,
    {path: markdownPath, bytes: markdownBytes.length, sha256: sha256(markdownBytes)},
    `${kind}.companionMarkdown bytes`,
  );
  invariant(
    report.companionMarkdown.role === SUCCESSOR_PAIR_ROLES[kind].markdown,
    `${kind}.companionMarkdown role drifted`,
  );
  const outputs = [
    {path: jsonPath, bytes: Buffer.from(stableJson(report), "utf8")},
    {path: markdownPath, bytes: markdownBytes},
  ];
  if (check) {
    for (const output of outputs) {
      const current = await readRecord(root, output.path);
      invariant(current.bytes.equals(output.bytes), `${output.path} is stale`);
    }
    return {action: "verified", outputs: outputs.map((output) => ({
      path: output.path,
      bytes: output.bytes.length,
      sha256: sha256(output.bytes),
    }))};
  }
  await publishStagedPair({
    root,
    outputs,
    kind,
    publishFailureAt,
    cleanupFailureAt,
  });
  return {action: "created", outputs: outputs.map((output) => ({
    path: output.path,
    bytes: output.bytes.length,
    sha256: sha256(output.bytes),
  }))};
}

export function parseMode(argv) {
  invariant(
    argv.length === 1 && ["--write", "--check"].includes(argv[0]),
    "Use exactly one mode: --write or --check",
  );
  return {check: argv[0] === "--check"};
}

export async function runGenerator({kind, projectRoot, argv}) {
  const {check} = parseMode(argv);
  const builders = {
    continuation: buildContinuationReport,
    delivery: buildDeliveryReport,
    owner: buildOwnerReport,
  };
  invariant(builders[kind], `unknown report kind: ${kind}`);
  const report = await builders[kind]({projectRoot});
  return writeOrCheckPair({
    projectRoot,
    prefix: OUTPUTS[kind],
    kind,
    report,
    check,
  });
}
