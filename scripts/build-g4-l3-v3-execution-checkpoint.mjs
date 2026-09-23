#!/usr/bin/env node

import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  open,
  readFile,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const GENERATOR_RELATIVE = "scripts/build-g4-l3-v3-execution-checkpoint.mjs";
const JSON_OUTPUT = "reports/g4-l3-v3-execution-checkpoint.json";
const MARKDOWN_OUTPUT = "reports/g4-l3-v3-execution-checkpoint.md";
const OWN_OUTPUTS = new Set([JSON_OUTPUT, MARKDOWN_OUTPUT]);
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const SHELL_ID = "shell-course-g04-l03-index-local";
const WHOLE_LESSON_PACKAGE_ID = "g4-l3-whole-lesson-package-mvp-v1";
const WHOLE_LESSON_PACKAGE_DIRECTORY =
  "outputs/g4-l3-whole-lesson-package-mvp-v1-darwin-arm64";
const WHOLE_LESSON_PACKAGE_MANIFEST =
  `${WHOLE_LESSON_PACKAGE_DIRECTORY}/package-manifest.json`;
const WHOLE_LESSON_PACKAGE_ZIP =
  `${WHOLE_LESSON_PACKAGE_DIRECTORY}.zip`;
const WHOLE_LESSON_PACKAGE_SMOKE =
  "reports/g4-l3-whole-lesson-package-smoke.json";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const INPUT_PATHS = Object.freeze({
  plan: "outputs/g4-l3-39-page-complete-lesson-mvp-plan-v3.md",
  p0PreimageSnapshot: "reports/g4-l3-p0-preimage-snapshot-2026-07-29.json",
  ts006Candidate: "reports/g4-l3-ts006-current-javascript-candidate.json",
  currentJavascriptProgress: "reports/g4-l3-current-javascript-progress.json",
  productQa: "reports/g4-l3-current-javascript-product-qa.json",
  controlledCeoPreviewQa: "reports/g4-l3-controlled-ceo-preview-qa.json",
  wholeLessonPackageSmoke: WHOLE_LESSON_PACKAGE_SMOKE,
  wholeLessonPackageManifest: WHOLE_LESSON_PACKAGE_MANIFEST,
  wholeLessonPackageZip: WHOLE_LESSON_PACKAGE_ZIP,
  lessonProductContract: "reports/g4-l3-lesson-product-navigation-contract.json",
  shellCurrentJavascriptContract:
    "migrations/shell-course-g04-l03-index-local/audit/source-local-current-javascript-shell-contract.json",
  shellPendingCoverage:
    "migrations/shell-course-g04-l03-index-local/evidence/full-frame-coverage.json",
  shellStrictReadiness:
    "migrations/shell-course-g04-l03-index-local/audit/strict-readiness.json",
  frameDomainPlanningClosure:
    "reports/g4-l3-frame-domain-planning-closure.json",
  rendererFrameDomainSupportIndex:
    "reports/g4-l3-renderer-frame-domain-support-index.json",
  rendererGapClosure: "reports/g4-l3-renderer-gap-closure.json",
  completionLedger: "catalog/completion-ledger.json",
  lessonReleaseLedger: "catalog/lesson-release-ledger.json",
  fullFrameInventory: "reports/g4-l3-full-frame-acquisition-inventory.json",
  captureCapacity: "reports/g4-l3-capture-capacity-readiness.json",
  previewBuildReceipt:
    "reports/g4-l3-controlled-ceo-preview-build-receipt.json",
  v3Successor:
    "reports/g4-l3-renderer-live-drift-successor-2026-07-29-v3.json",
  generator: GENERATOR_RELATIVE,
});
const RAW_INPUT_KEYS = new Set([
  "plan",
  "generator",
  "wholeLessonPackageZip",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonical(value[key])]),
  );
}

function canonicalBytes(value) {
  return Buffer.from(JSON.stringify(canonical(value)));
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function assertSafeRelative(relativePath, label = "path") {
  invariant(
    typeof relativePath === "string"
      && relativePath.length > 0
      && !relativePath.includes("\\")
      && !relativePath.includes("\0")
      && !path.isAbsolute(relativePath),
    `${label} must be a safe project-relative path`,
  );
  const segments = relativePath.split("/");
  invariant(
    segments.every(
      (segment) => segment.length > 0 && segment !== "." && segment !== "..",
    ),
    `${label} contains an unsafe path segment`,
  );
  invariant(
    portable(path.normalize(relativePath)) === relativePath,
    `${label} is not normalized`,
  );
  return relativePath;
}

function projectPath(relativePath) {
  assertSafeRelative(relativePath);
  const absolutePath = path.resolve(PROJECT_ROOT, relativePath);
  const relative = path.relative(PROJECT_ROOT, absolutePath);
  invariant(
    relative
      && relative !== ".."
      && !relative.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relative),
    `${relativePath} escapes the project root`,
  );
  return absolutePath;
}

function sameIdentity(left, right) {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.size === right.size
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs
    && left.nlink === right.nlink
    && left.mode === right.mode;
}

function publicBinding(relativePath, bytes) {
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  };
}

async function readStableFile(
  relativePath,
  {singleLink = false, mode = null} = {},
) {
  const normalized = assertSafeRelative(relativePath);
  const absolutePath = projectPath(normalized);
  const before = await lstat(absolutePath, {bigint: true});
  invariant(
    before.isFile() && !before.isSymbolicLink(),
    `${normalized} must be a regular non-symlink file`,
  );
  if (singleLink) {
    invariant(before.nlink === 1n, `${normalized} must have link count 1`);
  }
  if (mode !== null) {
    invariant(
      Number(before.mode & 0o777n) === mode,
      `${normalized} must have mode ${mode.toString(8)}`,
    );
  }
  const bytes = await readFile(absolutePath);
  const after = await lstat(absolutePath, {bigint: true});
  invariant(
    sameIdentity(before, after),
    `${normalized} changed while it was being bound`,
  );
  invariant(
    BigInt(bytes.length) === after.size,
    `${normalized} byte length changed while it was being bound`,
  );
  return {
    bytes,
    binding: publicBinding(normalized, bytes),
    identity: after,
  };
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

async function readBoundJson(relativePath, options) {
  const record = await readStableFile(relativePath, options);
  return {
    ...record,
    value: parseJson(record.bytes, relativePath),
  };
}

function assertSha256(value, label) {
  invariant(SHA256_PATTERN.test(value ?? ""), `${label} must be a SHA-256`);
}

function assertAllFalse(object, label) {
  invariant(
    object && typeof object === "object" && !Array.isArray(object),
    `${label} must be an object`,
  );
  const entries = Object.entries(object);
  invariant(entries.length > 0, `${label} must not be empty`);
  for (const [key, value] of entries) {
    invariant(value === false, `${label}.${key} must remain false`);
  }
}

function assertSelectedFalse(object, keys, label) {
  for (const key of keys) {
    invariant(object?.[key] === false, `${label}.${key} must remain false`);
  }
}

function assertStrictEffectNone(value, label) {
  invariant(
    typeof value === "string"
      && (value === "none" || value.startsWith("none;")),
    `${label} must retain a none strict-acceptance effect`,
  );
}

function validateTs006(document) {
  invariant(
    document.reportType === "current-javascript-engineering-candidate"
      && document.animationId === "course-g04-l03-ts-006",
    "TS006 current-JavaScript candidate identity drifted",
  );
  invariant(
    document.disposition?.currentJavaScriptCandidate === true
      && document.disposition?.candidateRenderabilityOnly === true
      && document.disposition?.strictMigrationComplete === false
      && document.disposition?.publicLibraryAdmitted === false
      && document.disposition?.productionAdmission === false,
    "TS006 candidate disposition drifted or was promoted",
  );
  assertAllFalse(document.acceptance, "TS006 acceptance");
  assertAllFalse(document.authorization, "TS006 authorization");
  assertStrictEffectNone(
    document.strictAcceptanceEffect,
    "TS006 candidate",
  );
}

function validatePlan(bytes) {
  const text = bytes.toString("utf8");
  invariant(
    text.startsWith("# G4 L3 39 页完整 Lesson MVP 忠实迁移完成计划 v3\n")
      && text.includes("CEO 预览与 strict completion 分轨")
      && text.includes("Machine-Verified Controlled CEO Preview"),
    "v3 plan identity or controlled-preview boundary drifted",
  );
}

function validateP0PreimageSnapshot(document) {
  invariant(
    document.schemaVersion === 1
      && document.reportType === "g4-l3-p0-preimage-snapshot"
      && document.mutationEffect === "none-on-snapshotted-targets"
      && Number.isSafeInteger(document.targetCount)
      && document.targetCount > 0
      && document.targets?.length === document.targetCount,
    "P0 preimage snapshot identity or target set drifted",
  );
  assertSha256(
    document.snapshotFingerprintSha256,
    "P0 preimage snapshot fingerprint",
  );
  const {snapshotFingerprintSha256, ...fingerprintSource} = document;
  invariant(
    snapshotFingerprintSha256
      === sha256(Buffer.from(JSON.stringify(fingerprintSource))),
    "P0 preimage snapshot fingerprint is stale",
  );
}

function validateCurrentJavascriptProgress(document) {
  invariant(
    document.reportType
      === "g4-l3-current-javascript-progress-acceptance-neutral",
    "Current-JavaScript progress report identity drifted",
  );
  invariant(
    document.scope?.activePages === 39
      && document.scope?.courseShellExcluded === true
      && document.summary?.activePages === 39
      && document.summary?.currentJavaScriptModules === 39
      && document.summary?.hashBoundCandidateReports === 39
      && document.summary?.registeredHashBoundCandidateModules === 39
      && document.summary?.pagesWithoutCurrentJavaScript === 0
      && document.summary?.strictCompletePages === 0
      && document.pages?.length === 39,
    "Current-JavaScript progress is not the acceptance-neutral 39/39 page set",
  );
  const ids = document.pages.map(({animationId}) => animationId);
  invariant(new Set(ids).size === 39, "Current-JavaScript page IDs repeat");
  invariant(
    document.pages.every(
      (page) => page.currentJavaScript?.currentOutputExists === true,
    ),
    "At least one G4 L3 page lacks a current-JavaScript output",
  );
  invariant(
    document.pages.every(
      (page) => Object.values(page.acceptance ?? {}).every(
        (value) => value === false,
      ),
    ),
    "A current-JavaScript page contains an acceptance promotion",
  );
  invariant(
    document.acceptance?.acceptanceNeutral === true,
    "Current-JavaScript progress must remain acceptance-neutral",
  );
  assertSelectedFalse(
    document.acceptance,
    [
      "implementationAccepted",
      "authoritativeOriginalRuntimeAccepted",
      "bilingualVisualParityAccepted",
      "audioAccepted",
      "fullFrameRmseAccepted",
      "productAndAccessibilityQaAccepted",
      "humanVisualReviewAccepted",
      "ownerAccepted",
      "strictMigrationComplete",
      "lessonComplete",
    ],
    "Current-JavaScript progress acceptance",
  );
  assertStrictEffectNone(
    document.acceptance?.strictAcceptanceEffect,
    "Current-JavaScript progress",
  );
  return ids;
}

function qaEntries(routeChecks) {
  return [
    ...(routeChecks?.courseMaps ?? []),
    ...(routeChecks?.shellAuditRoutes ?? []),
    ...(routeChecks?.animations ?? []).flatMap(
      ({desktopEnglish, mobileSpanishReduced, replay}) => [
        desktopEnglish,
        mobileSpanishReduced,
        replay,
      ],
    ),
  ];
}

function qaScreenshots(routeChecks) {
  return qaEntries(routeChecks).flatMap(
    (entry) => (entry?.screenshot ? [entry.screenshot] : []),
  );
}

function qaEvidenceDigests(routeChecks) {
  const routeManifest = [
    ...(routeChecks?.courseMaps ?? []).map(({locale, route}) => ({
      kind: "course-map",
      locale,
      route,
    })),
    ...(routeChecks?.shellAuditRoutes ?? []).map(({locale, route}) => ({
      kind: "shell",
      locale,
      route,
    })),
    ...(routeChecks?.animations ?? []).flatMap(
      ({animationId, desktopEnglish, mobileSpanishReduced}) => [
        {
          kind: "animation",
          locale: "en",
          animationId,
          route: desktopEnglish.route,
        },
        {
          kind: "animation",
          locale: "es",
          animationId,
          route: mobileSpanishReduced.route,
        },
      ],
    ),
  ];
  const visitManifest = qaEntries(routeChecks).map(
    ({route, status}, visitOrdinal) => ({
      visitOrdinal: visitOrdinal + 1,
      route,
      status,
    }),
  );
  const captureManifest = qaScreenshots(routeChecks).map(
    ({path: capturePath, bytes, sha256: captureSha256}) => ({
      path: capturePath,
      bytes,
      sha256: captureSha256,
    }),
  );
  return {
    routeManifestCount: routeManifest.length,
    routeManifestSha256: sha256(JSON.stringify(routeManifest)),
    visitManifestCount: visitManifest.length,
    visitManifestSha256: sha256(JSON.stringify(visitManifest)),
    captureManifestCount: captureManifest.length,
    captureManifestSha256: sha256(JSON.stringify(captureManifest)),
  };
}

function validateQa(document, {controlled}) {
  const expectedReportType = controlled
    ? "g4-l3-controlled-ceo-preview-qa"
    : "g4-l3-current-javascript-lesson-product-qa";
  const expectedStatus = controlled
    ? "pass-machine-verified-controlled-ceo-preview"
    : "pass-current-javascript-product-layer";
  invariant(
    document.reportType === expectedReportType
      && document.summary?.status === expectedStatus,
    `${expectedReportType} identity or pass status drifted`,
  );
  const summary = document.summary;
  invariant(
    summary.activePages === 39
      && summary.courseShells === 1
      && summary.releaseMembers === 40
      && summary.strictCompleteMembers === 0
      && summary.published === false
      && summary.currentJavascriptAnimationModules === 39
      && summary.runnableShellModules === 1,
    `${expectedReportType} is not the 39-page plus shell, 0/40 unpublished scope`,
  );
  invariant(
    summary.uniqueRoutesVerified === 82
      && summary.routeVisits === 121
      && summary.courseMapRoutes === 2
      && summary.animationLocaleRoutes === 78
      && summary.shellAuditRoutes === 2
      && summary.liveReplayRoutes === 39
      && summary.desktopFixedFrameRoutes === 39
      && summary.mobileSpanishReducedMotionRoutes === 39
      && summary.replayMouseEnterSpaceRoutes === 39
      && summary.axeAudits === 82,
    `${expectedReportType} route, visit, locale, or Replay coverage drifted`,
  );
  for (const field of [
    "axeSeriousOrCriticalViolations",
    "horizontalOverflowFailures",
    "runtimeRenderFailures",
    "navigationFailures",
    "replayFailures",
    "consoleErrors",
    "pageErrors",
    "failedRequests",
    "badHttpResponses",
    "failureCount",
  ]) {
    invariant(summary[field] === 0, `${expectedReportType} ${field} is not 0`);
  }
  invariant(
    Array.isArray(summary.failures) && summary.failures.length === 0,
    `${expectedReportType} contains failures`,
  );
  for (const field of [
    "controlledPreviewBoundaryPasses",
    "privateNoStoreHeaderPasses",
    "noindexHeaderPasses",
    "controlledPreviewIdentityHeaderPasses",
  ]) {
    invariant(
      summary[field] === 121,
      `${expectedReportType} ${field} is not 121`,
    );
  }
  invariant(
    summary.screenshotCount === 6
      && document.screenshots?.length === 6
      && document.routeChecks?.courseMaps?.length === 2
      && document.routeChecks?.shellAuditRoutes?.length === 2
      && document.routeChecks?.animations?.length === 39,
    `${expectedReportType} route or screenshot evidence shape drifted`,
  );
  assertAllFalse(document.authorityClaims, `${expectedReportType} authority`);
  invariant(
    document.acceptance?.acceptanceNeutral === true
      && document.acceptance?.currentJavascriptProductQaPassed === true
      && document.acceptance?.controlledCeoPreview === controlled,
    `${expectedReportType} bounded acceptance state drifted`,
  );
  assertSelectedFalse(
    document.acceptance,
    [
      "authoritativeOriginalRuntimeComplete",
      "originalNavigationParityAccepted",
      "bilingualVisualParityAccepted",
      "audioAccepted",
      "fullFrameRmseAccepted",
      "humanVisualAccepted",
      "ownerAccepted",
      "strictMigrationComplete",
      "lessonComplete",
    ],
    `${expectedReportType} acceptance`,
  );
  const expectedDigests = qaEvidenceDigests(document.routeChecks);
  invariant(
    JSON.stringify(document.evidenceDigests) === JSON.stringify(expectedDigests),
    `${expectedReportType} route, visit, or capture digest is stale`,
  );
  invariant(
    expectedDigests.routeManifestCount === 82
      && expectedDigests.visitManifestCount === 121
      && expectedDigests.captureManifestCount === 6,
    `${expectedReportType} digest counts drifted`,
  );
  for (const field of [
    "routeManifestSha256",
    "visitManifestSha256",
    "captureManifestSha256",
  ]) {
    assertSha256(expectedDigests[field], `${expectedReportType}.${field}`);
  }
  return expectedDigests;
}

function samePublicBinding(left, right) {
  return left?.path === right?.path
    && left?.bytes === right?.bytes
    && left?.sha256 === right?.sha256;
}

function validateQaLedgerBindings(
  document,
  completionLedgerBinding,
  lessonReleaseLedgerBinding,
  label,
) {
  invariant(
    samePublicBinding(
      document.sourceBindings?.completionLedger,
      completionLedgerBinding,
    ),
    `${label} does not bind the current completion ledger`,
  );
  invariant(
    samePublicBinding(
      document.sourceBindings?.lessonReleaseLedger,
      lessonReleaseLedgerBinding,
    ),
    `${label} does not bind the current lesson-release ledger`,
  );
}

function validateWholeLessonPackageManifest(
  document,
  currentJavascriptIds,
  completionLedgerBinding,
  lessonReleaseLedgerBinding,
) {
  invariant(
    document.schemaVersion === 1
      && document.packageId === WHOLE_LESSON_PACKAGE_ID
      && document.packageType
        === "machine-verified-controlled-preview-package"
      && document.productLayer === "whole-lesson-current-javascript-mvp",
    "Whole-lesson package manifest identity drifted",
  );
  invariant(
    document.target?.platform === "darwin"
      && document.target?.architecture === "arm64"
      && document.target?.nodeMajor === 24
      && document.entry?.command === "node start.mjs"
      && document.entry?.serverEntry === "runtime/apps/web/server.js"
      && document.entry?.url === "http://127.0.0.1:3216/courses/4/3"
      && document.entry?.spanishUrl
        === "http://127.0.0.1:3216/es/courses/4/3"
      && document.entry?.network === "loopback-only",
    "Whole-lesson package target or loopback entry drifted",
  );
  invariant(
    document.build?.inputSnapshotBefore?.fileCount > 0
      && document.build?.inputSnapshotBefore?.totalBytes > 0
      && JSON.stringify(document.build.inputSnapshotBefore)
        === JSON.stringify(document.build.inputSnapshotAfter),
    "Whole-lesson package input snapshot changed during its build",
  );
  assertSha256(
    document.build.inputSnapshotBefore.sha256,
    "Whole-lesson package input snapshot SHA-256",
  );
  invariant(
    document.release?.releaseId === RELEASE_ID
      && document.release?.expectedMembers === 40
      && document.release?.activePages === 39
      && document.release?.courseShells === 1
      && document.release?.strictCompleteCount === 0
      && document.release?.missingCount === 40
      && document.release?.published === false,
    "Whole-lesson package release boundary is not strict 0/40 unpublished",
  );
  assertAllFalse(document.authority, "Whole-lesson package authority");
  const expectedMemberIds = [...currentJavascriptIds, SHELL_ID];
  invariant(
    document.members?.length === 40
      && JSON.stringify(document.members.map(({animationId}) => animationId))
        === JSON.stringify(expectedMemberIds)
      && document.members.every(
        ({ordinal, sourceSha256}, index) =>
          ordinal === index + 1 && SHA256_PATTERN.test(sourceSha256 ?? ""),
      ),
    "Whole-lesson package member order or source identity drifted",
  );
  invariant(
    document.assets?.fileCount === 523
      && document.assets?.audioFileCount === 72
      && document.assets?.pagesWithCurrentWebAudio === 36
      && JSON.stringify(document.assets?.pagesWithoutCurrentWebAudio)
        === JSON.stringify([
          "course-g04-l03-fq-001",
          "course-g04-l03-fq-002",
          "course-g04-l03-fq-003",
        ])
      && document.assets?.audioAcceptance === false,
    "Whole-lesson package asset or audio boundary drifted",
  );
  const completionCatalogBinding = document.catalog?.find(
    ({path: relativePath}) => relativePath === completionLedgerBinding.path,
  );
  const releaseCatalogBinding = document.catalog?.find(
    ({path: relativePath}) => relativePath === lessonReleaseLedgerBinding.path,
  );
  invariant(
    samePublicBinding(completionCatalogBinding, completionLedgerBinding),
    "Whole-lesson package does not bind the current completion ledger",
  );
  invariant(
    samePublicBinding(releaseCatalogBinding, lessonReleaseLedgerBinding),
    "Whole-lesson package does not bind the current lesson-release ledger",
  );
  invariant(
    document.evidence?.length === 2
      && document.evidence.every(
        ({status}) => status === "dated-prior-checkpoint",
      ),
    "Whole-lesson package must retain its embedded checkpoint as dated evidence",
  );
  invariant(
    document.payload?.fileCount > 0
      && document.payload?.totalBytes > 0,
    "Whole-lesson package payload summary is empty",
  );
  assertSha256(
    document.payload?.indexSha256,
    "Whole-lesson package payload index SHA-256",
  );
  invariant(
    document.exclusions?.includes("public deployment authorization")
      && document.knownPendingGates?.includes(
        "authoritative original-runtime complete-frame evidence",
      )
      && document.knownPendingGates?.includes(
        "independent visual and audio review",
      )
      && document.knownPendingGates?.includes("Owner acceptance")
      && document.knownPendingGates?.includes("strict completion")
      && document.knownPendingGates?.includes("atomic public release"),
    "Whole-lesson package pending authority gates drifted",
  );
}

function validateWholeLessonPackageSmoke(document, packageManifestBinding) {
  invariant(
    document.schemaVersion === 1
      && document.reportType === "g4-l3-whole-lesson-package-smoke"
      && document.packageId === WHOLE_LESSON_PACKAGE_ID
      && document.packageManifestSha256 === packageManifestBinding.sha256
      && document.baseUrl === "http://127.0.0.1:3217"
      && document.pagesExpected === 39
      && document.pagesRendered === 39
      && document.audioUrlsChecked === 72,
    "Whole-lesson package smoke identity or coverage drifted",
  );
  invariant(
    Array.isArray(document.failures) && document.failures.length === 0
      && Array.isArray(document.consoleErrors)
      && document.consoleErrors.length === 0
      && Array.isArray(document.pageErrors)
      && document.pageErrors.length === 0,
    "Whole-lesson package smoke contains failures",
  );
  assertAllFalse(document.authority, "Whole-lesson package smoke authority");
}

async function validateWholeLessonPackageZip(zipRecord, manifestRecord) {
  invariant(
    zipRecord.bytes.length > 4
      && zipRecord.bytes[0] === 0x50
      && zipRecord.bytes[1] === 0x4b
      && zipRecord.bytes[2] === 0x03
      && zipRecord.bytes[3] === 0x04,
    "Whole-lesson package ZIP signature drifted",
  );
  const zipPath = projectPath(WHOLE_LESSON_PACKAGE_ZIP);
  const integrity = spawnSync("unzip", ["-tqq", zipPath], {
    cwd: PROJECT_ROOT,
    encoding: null,
    maxBuffer: 1024 * 1024,
  });
  invariant(
    integrity.status === 0,
    `Whole-lesson package ZIP integrity failed: ${(integrity.stderr
      ?? Buffer.alloc(0)).toString("utf8").trim()}`,
  );
  const packageDirectoryName = path.basename(WHOLE_LESSON_PACKAGE_DIRECTORY);
  const embeddedManifest = spawnSync(
    "unzip",
    [
      "-p",
      zipPath,
      `${packageDirectoryName}/package-manifest.json`,
    ],
    {
      cwd: PROJECT_ROOT,
      encoding: null,
      maxBuffer: 1024 * 1024,
    },
  );
  invariant(
    embeddedManifest.status === 0
      && embeddedManifest.stdout.equals(manifestRecord.bytes),
    "Whole-lesson package ZIP does not contain the bound package manifest",
  );
  const stableAfterValidation = await readStableFile(
    WHOLE_LESSON_PACKAGE_ZIP,
    {singleLink: true},
  );
  invariant(
    samePublicBinding(stableAfterValidation.binding, zipRecord.binding),
    "Whole-lesson package ZIP changed during validation",
  );
}

function validateLessonContract(document, currentJavascriptIds) {
  invariant(
    document.reportType === "g4-l3-full-lesson-product-navigation-contract",
    "Lesson product navigation contract identity drifted",
  );
  invariant(
    document.summary?.activePages === 39
      && document.summary?.courseShells === 1
      && document.summary?.currentPrototypePageModules === 39
      && document.summary?.currentPrototypeShellModules === 1
      && document.summary?.strictCompletePages === 0
      && document.summary?.strictCompleteShells === 0
      && document.pages?.length === 39
      && document.shell?.animationId === SHELL_ID,
    "Lesson product contract is not the 39-page plus shell candidate",
  );
  invariant(
    document.publication?.releaseId === RELEASE_ID
      && document.publication?.mode === "atomic"
      && document.publication?.requiredMembers === 40
      && document.publication?.strictCompleteMembers === 0
      && document.publication?.published === false
      && document.publication?.state === "unpublished",
    "Lesson product contract release boundary is not strict 0/40 unpublished",
  );
  const contractIds = document.pages.map(({animationId}) => animationId);
  invariant(
    JSON.stringify(contractIds) === JSON.stringify(currentJavascriptIds),
    "Lesson product contract order differs from current-JavaScript progress",
  );
  invariant(
    document.lesson?.sequenceAuthority?.shippedShellStaticConflictResolved
      === false
      && document.shell?.staticSequence?.pageCount === 44
      && document.shell.staticSequence.conflictStatus === "unresolved"
      && document.shell.staticSequence
        .productContractStillUses39ActiveXmlPages === true,
    "Lesson product contract no longer preserves the 44-versus-39 conflict",
  );
  invariant(
    document.acceptance?.acceptanceNeutral === true
      && typeof document.acceptance?.statement === "string",
    "Lesson product contract must remain explicitly acceptance-neutral",
  );
  assertSelectedFalse(
    document.acceptance,
    [
      "implementationAuthorized",
      "routeBehaviorVerified",
      "originalRuntimeAccepted",
      "audioAccepted",
      "humanVisualAccepted",
      "ownerAccepted",
      "strictProductAccepted",
      "lessonComplete",
    ],
    "Lesson product contract acceptance",
  );
}

function validateShellContract(document) {
  invariant(
    document.reportType
      === "g4-l3-source-local-current-javascript-shell-contract"
      && document.animationId === SHELL_ID,
    "Shell current-JavaScript contract identity drifted",
  );
  invariant(
    document.pages?.length === 39
      && document.sourceEvidence?.staticSequenceConflict?.pageCount === 44
      && document.rendererContract?.classification
        === "acceptance-neutral-current-javascript-structural-shell-candidate",
    "Shell contract lost the 39-page projection or 44-page static conflict",
  );
  assertAllFalse(document.acceptance, "Shell contract acceptance");
}

function validateShellCoverage(document) {
  invariant(
    document.schemaVersion === 2
      && document.animationId === SHELL_ID
      && document.evidenceType
        === "pending-original-runtime-full-frame-requirement-contract"
      && Array.isArray(document.requirements)
      && document.requirements.length > 0,
    "Shell pending full-frame coverage identity drifted",
  );
  invariant(
    document.requirements.every(({status}) => status === "pending"),
    "Shell coverage contains a non-pending strict requirement",
  );
  assertStrictEffectNone(
    document.strictAcceptanceEffect,
    "Shell pending coverage",
  );
}

function validateShellStrictReadiness(document) {
  invariant(
    document.schemaVersion === 2
      && document.animationId === SHELL_ID
      && document.evidenceKind === "g4-l3-shell-strict-readiness"
      && document.migrationStatusChanged === false,
    "Shell strict-readiness identity drifted",
  );
  invariant(
    document.conclusion?.strictAcceptanceReady === false
      && document.conclusion?.completionClaimAllowed === false
      && document.review?.decision === "pending",
    "Shell strict-readiness no longer fails closed",
  );
  assertStrictEffectNone(
    document.strictAcceptanceEffect,
    "Shell strict readiness",
  );
}

function validateFrameDomainPlanningClosure(document) {
  invariant(
    document.reportType === "g4-l3-frame-domain-planning-closure"
      && document.scope?.releaseId === RELEASE_ID
      && document.scope?.releaseMembers === 40
      && document.summary?.releaseMembers === 40
      && document.summary?.unresolvedTimelines === 0
      && document.summary?.authoritativeRuntimeSessions === 0
      && document.summary?.strictCompletions === 0
      && document.summary?.publishedReleases === 0,
    "Frame-domain planning closure semantics drifted",
  );
  assertAllFalse(
    document.acceptance,
    "Frame-domain planning closure acceptance",
  );
  assertStrictEffectNone(
    document.strictAcceptanceEffect,
    "Frame-domain planning closure",
  );
}

function validateRendererIndex(document) {
  invariant(
    document.evidenceType
      === "course-shell-pilot-renderer-frame-domain-support-index"
      && document.status === "renderer-frame-domain-support-incomplete"
      && document.pilotCount === 40,
    "Renderer support index identity or 40-member scope drifted",
  );
  assertStrictEffectNone(
    document.strictAcceptanceEffect,
    "Renderer support index",
  );
}

function validateRendererGap(document) {
  invariant(
    document.reportType === "g4-l3-renderer-gap-closure"
      && document.scope?.releaseId === RELEASE_ID
      && document.scope?.releaseMembers === 40
      && document.decision?.runtimeLaunchAuthorized === false,
    "Renderer gap closure identity or release scope drifted",
  );
  assertAllFalse(document.acceptance, "Renderer gap closure acceptance");
  assertStrictEffectNone(
    document.strictAcceptanceEffect,
    "Renderer gap closure",
  );
}

function validateLedgers(completion, lessonRelease, releaseMemberIds) {
  invariant(
    completion.schemaVersion === 1
      && Array.isArray(completion.entries),
    "Completion ledger shape drifted",
  );
  const releaseEntries = completion.entries.filter(
    ({animationId}) => releaseMemberIds.has(animationId),
  );
  invariant(
    releaseEntries.length === 0,
    "Completion ledger contains a strict-complete G4 L3 release member",
  );
  const release = lessonRelease.releases?.find(
    ({releaseId}) => releaseId === RELEASE_ID,
  );
  invariant(
    release
      && release.expectedMemberCount === 40
      && release.strictCompleteCount === 0
      && release.published === false
      && release.status === "unpublished",
    "Lesson release ledger is not strict 0/40 and unpublished",
  );
  return release;
}

function validateFullFrameInventory(document) {
  const summary = document.summary;
  invariant(
    document.reportType === "g4-l3-full-frame-acquisition-inventory"
      && summary?.activePages === 39
      && summary?.courseShells === 1
      && summary?.canonicalMembers === 40
      && summary?.authoritativeBaselinePackages === 0
      && summary?.authoritativeBaselineRequirements === 0
      && summary?.completeRequirements === 0
      && summary?.pairedMetricRequirements === 0
      && summary?.runtimeSessionsExecuted === 0
      && summary?.strictCompletions === 0,
    "Full-frame inventory was promoted or its 40-member scope drifted",
  );
  invariant(
    document.acceptance?.acceptanceNeutral === true
      && document.acceptance?.batchCaptureAuthorized === false
      && document.acceptance?.fullFrameMatrixAuthoritative === false
      && document.acceptance?.humanVisualAccepted === false
      && document.acceptance?.ownerAccepted === false
      && document.acceptance?.lessonPublished === false
      && document.runtimeAndPromotionGate?.bulkCaptureAuthorized === false,
    "Full-frame inventory no longer fails closed",
  );
}

function validateCaptureCapacity(document) {
  invariant(
    document.reportType === "g4-l3-capture-capacity-readiness"
      && document.lessonScope?.canonicalItems === 40
      && document.lessonScope?.activePages === 39
      && document.lessonScope?.courseShells === 1
      && document.capacityModel?.admission
        === "admit-full-lesson-capture-capacity"
      && document.capacityModel?.admissionIsFidelityEvidence === false,
    "Capture-capacity readiness scope or evidence boundary drifted",
  );
  invariant(
    document.acceptance?.acceptanceNeutral === true
      && document.acceptance?.migrationStatusChanges === 0
      && document.acceptance?.reviewOrApprovalChanges === 0
      && document.acceptance?.baselineOrCoverageChanges === 0
      && document.acceptance?.sourceAssetChanges === 0,
    "Capture-capacity report contains an acceptance or source mutation",
  );
}

function validateBuildReceipt(document) {
  invariant(
    document.schemaVersion === 1
      && document.reportType
        === "g4-l3-controlled-ceo-preview-production-build-receipt"
      && document.status === "pass-production-build"
      && document.command?.status === "pass"
      && document.command?.exitCode === 0
      && document.command?.signal === null
      && document.summary?.productionBuildPassed === true,
    "Controlled CEO preview production build receipt is not a pass",
  );
  invariant(
    typeof document.generatedAt === "string"
      && !Number.isNaN(Date.parse(document.generatedAt)),
    "Build receipt generatedAt is not an ISO timestamp",
  );
  invariant(
    document.build?.workspace === "@helpmath/web"
      && document.build?.buildId?.path === "apps/web/.next/BUILD_ID"
      && Number.isSafeInteger(document.build?.buildId?.bytes)
      && document.build.buildId.bytes > 0
      && typeof document.build.buildId.value === "string"
      && /^[A-Za-z0-9_-]{8,256}$/u.test(document.build.buildId.value),
    "Controlled CEO preview BUILD_ID binding drifted",
  );
  assertSha256(
    document.build.buildId.sha256,
    "Controlled CEO preview BUILD_ID SHA-256",
  );
  invariant(
    document.summary?.buildIdSha256 === document.build.buildId.sha256,
    "Controlled CEO preview BUILD_ID summary binding drifted",
  );
  assertAllFalse(document.authority, "Preview build receipt authority");
  assertSha256(
    document.reportFingerprintSha256,
    "Preview build receipt fingerprint",
  );
  const {reportFingerprintSha256, ...fingerprintSource} = document;
  invariant(
    reportFingerprintSha256 === sha256(canonicalBytes(fingerprintSource)),
    "Preview build receipt fingerprint is stale",
  );
}

function validateSuccessorDocument(document) {
  invariant(
    document.schemaVersion === 1
      && document.packageType === "g4-l3-renderer-live-drift-successor-v3"
      && document.status
        === "current-bound-successor-with-historical-stale-legacy"
      && document.transitionId
        === "g4-l3-renderer-live-drift-2026-07-29-v3"
      && SHA256_PATTERN.test(document.transactionId ?? ""),
    "v3 renderer successor identity or status drifted",
  );
  invariant(
    document.output?.reportPath
        === "reports/g4-l3-renderer-live-drift-successor-2026-07-29-v3.json"
      && document.output?.preparedPath
        === `work/g4-l3-renderer-live-drift-successor-v3-transactions/${document.transactionId}/prepared/successor-package.json`
      && document.output?.publicationMode
        === "independent-no-replace-immutable-files"
      && document.output?.exactSameBytesRequired === true
      && document.output?.separateInodesRequired === true
      && document.output?.linkCountRequired === 1
      && document.output?.mode === 0o444,
    "v3 renderer successor independent-inode contract drifted",
  );
  invariant(
    document.semanticState?.renderer?.strictAcceptanceEffect === "none",
    "v3 renderer successor changed renderer strict acceptance",
  );
  assertAllFalse(
    document.semanticState?.renderer?.gapAcceptance,
    "v3 renderer successor gap acceptance",
  );
  invariant(
    document.semanticState?.g4L3Release?.expectedMemberCount === 40
      && document.semanticState?.g4L3Release?.strictCompleteCount === 0
      && document.semanticState?.g4L3Release?.published === false
      && document.semanticState?.g4L3Release?.status === "unpublished",
    "v3 renderer successor changed the G4 L3 release boundary",
  );
  assertAllFalse(document.authority, "v3 renderer successor authority");
  invariant(
    document.effects?.strictAcceptanceEffect === "none"
      && document.effects?.releaseEffect === "none",
    "v3 renderer successor changed strict or release effects",
  );
  assertAllFalse(
    document.preservation,
    "v3 renderer successor preservation effects",
  );
  invariant(
    document.legacyArtifacts?.length === 2
      && document.legacyArtifacts.every(
        ({status}) => status === "historical-stale",
      ),
    "v3 renderer successor lost its historical stale-artifact disposition",
  );
  const transactionMaterial = {
    schemaVersion: 1,
    transitionId: document.transitionId,
    outputPath: document.output.reportPath,
    inputBindings: document.inputBindings,
    generator: document.generator,
    legacyArtifacts: document.legacyArtifacts,
    semanticState: document.semanticState,
    authority: document.authority,
    effects: document.effects,
  };
  invariant(
    document.transactionId === sha256(canonicalBytes(transactionMaterial)),
    "v3 renderer successor transaction ID is stale",
  );
  assertSha256(
    document.packageFingerprintSha256,
    "v3 renderer successor package fingerprint",
  );
  const fingerprintSource = structuredClone(document);
  fingerprintSource.packageFingerprintSha256 = "";
  invariant(
    document.packageFingerprintSha256
      === sha256(Buffer.from(pretty(fingerprintSource))),
    "v3 renderer successor package fingerprint is stale",
  );
}

function assertCurrentSuccessorBinding(
  successorBinding,
  currentBinding,
  expectedMode,
  label,
) {
  invariant(
    isCurrentSuccessorBinding(
      successorBinding,
      currentBinding,
      expectedMode,
    ),
    `v3 renderer successor ${label} binding is not current`,
  );
}

function isCurrentSuccessorBinding(
  successorBinding,
  currentBinding,
  expectedMode,
) {
  return samePublicBinding(successorBinding, currentBinding)
    && successorBinding?.mode === expectedMode;
}

function scopedGitFingerprint(relativePaths) {
  const paths = [...new Set(relativePaths)]
    .filter((item) => !OWN_OUTPUTS.has(item))
    .map((item) => assertSafeRelative(item))
    .sort();
  const result = spawnSync(
    "git",
    [
      "status",
      "--porcelain=v1",
      "-z",
      "--untracked-files=all",
      "--no-renames",
      "--",
      ...paths,
    ],
    {
      cwd: PROJECT_ROOT,
      encoding: null,
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  invariant(
    result.status === 0,
    `scoped git status failed: ${(result.stderr ?? Buffer.alloc(0))
      .toString("utf8")
      .trim()}`,
  );
  const records = result.stdout
    .toString("utf8")
    .split("\0")
    .filter(Boolean);
  const statusCounts = {};
  for (const record of records) {
    invariant(
      record.length >= 4 && record[2] === " ",
      "Unexpected scoped porcelain-v1 record",
    );
    const status = record.slice(0, 2);
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }
  const sortedRecords = [...records].sort();
  return {
    algorithm: "git-status-porcelain-v1-z-scoped-paths-sha256-v1",
    scopePathCount: paths.length,
    scopePathManifestSha256: sha256(
      Buffer.from(`${paths.join("\0")}\0`),
    ),
    recordCount: records.length,
    statusCounts: Object.fromEntries(
      Object.entries(statusCounts).sort(([left], [right]) =>
        left.localeCompare(right)),
    ),
    porcelainSha256: sha256(
      Buffer.from(`${sortedRecords.join("\0")}\0`),
    ),
    pathsWithheld: true,
    fullWorktreeEnumerated: false,
    checkpointOutputsExcluded: true,
  };
}

async function bindPreviewScreenshots(controlledQa) {
  const expected = qaScreenshots(controlledQa.routeChecks);
  invariant(
    expected.length === 6
      && JSON.stringify(expected) === JSON.stringify(controlledQa.screenshots),
    "Controlled CEO preview screenshot manifest drifted",
  );
  const paths = expected.map(({path: screenshotPath}) => screenshotPath);
  invariant(new Set(paths).size === 6, "Preview screenshot paths repeat");
  const records = [];
  for (const expectedBinding of expected) {
    assertSafeRelative(expectedBinding.path, "preview screenshot path");
    assertSha256(
      expectedBinding.sha256,
      `${expectedBinding.path} screenshot SHA-256`,
    );
    const record = await readStableFile(expectedBinding.path, {
      singleLink: true,
    });
    invariant(
      record.binding.bytes === expectedBinding.bytes
        && record.binding.sha256 === expectedBinding.sha256,
      `${expectedBinding.path} no longer matches the controlled preview QA`,
    );
    records.push(record);
  }
  return records;
}

async function collectInputs() {
  const entries = await Promise.all(
    Object.entries(INPUT_PATHS).map(async ([key, relativePath]) => {
      const options = key === "v3Successor"
        || key === "previewBuildReceipt"
        || key === "wholeLessonPackageManifest"
        ? {singleLink: true, mode: 0o444}
        : {singleLink: true};
      const record = RAW_INPUT_KEYS.has(key)
        ? await readStableFile(relativePath, options)
        : await readBoundJson(relativePath, options);
      return [key, record];
    }),
  );
  return Object.fromEntries(entries);
}

export async function generateCheckpoint() {
  const inputs = await collectInputs();
  validatePlan(inputs.plan.bytes);
  validateP0PreimageSnapshot(inputs.p0PreimageSnapshot.value);
  const currentJavascriptIds = validateCurrentJavascriptProgress(
    inputs.currentJavascriptProgress.value,
  );
  validateTs006(inputs.ts006Candidate.value);
  const productDigests = validateQa(inputs.productQa.value, {
    controlled: false,
  });
  const controlledDigests = validateQa(
    inputs.controlledCeoPreviewQa.value,
    {controlled: true},
  );
  invariant(
    JSON.stringify(productDigests) === JSON.stringify(controlledDigests),
    "Product QA and Controlled CEO Preview QA evidence digests differ",
  );
  validateQaLedgerBindings(
    inputs.productQa.value,
    inputs.completionLedger.binding,
    inputs.lessonReleaseLedger.binding,
    "Current-JavaScript product QA",
  );
  validateQaLedgerBindings(
    inputs.controlledCeoPreviewQa.value,
    inputs.completionLedger.binding,
    inputs.lessonReleaseLedger.binding,
    "Controlled CEO Preview QA",
  );
  validateWholeLessonPackageManifest(
    inputs.wholeLessonPackageManifest.value,
    currentJavascriptIds,
    inputs.completionLedger.binding,
    inputs.lessonReleaseLedger.binding,
  );
  validateWholeLessonPackageSmoke(
    inputs.wholeLessonPackageSmoke.value,
    inputs.wholeLessonPackageManifest.binding,
  );
  await validateWholeLessonPackageZip(
    inputs.wholeLessonPackageZip,
    inputs.wholeLessonPackageManifest,
  );
  validateLessonContract(
    inputs.lessonProductContract.value,
    currentJavascriptIds,
  );
  validateShellContract(inputs.shellCurrentJavascriptContract.value);
  validateShellCoverage(inputs.shellPendingCoverage.value);
  validateShellStrictReadiness(inputs.shellStrictReadiness.value);
  validateFrameDomainPlanningClosure(
    inputs.frameDomainPlanningClosure.value,
  );
  validateRendererIndex(inputs.rendererFrameDomainSupportIndex.value);
  validateRendererGap(inputs.rendererGapClosure.value);
  validateFullFrameInventory(inputs.fullFrameInventory.value);
  validateCaptureCapacity(inputs.captureCapacity.value);
  validateBuildReceipt(inputs.previewBuildReceipt.value);
  validateSuccessorDocument(inputs.v3Successor.value);
  assertCurrentSuccessorBinding(
    inputs.v3Successor.value.inputBindings?.rendererIndex,
    inputs.rendererFrameDomainSupportIndex.binding,
    0o644,
    "renderer index",
  );
  assertCurrentSuccessorBinding(
    inputs.v3Successor.value.inputBindings?.rendererGap,
    inputs.rendererGapClosure.binding,
    0o644,
    "renderer gap",
  );
  assertCurrentSuccessorBinding(
    inputs.v3Successor.value.inputBindings?.preimageSnapshot,
    inputs.p0PreimageSnapshot.binding,
    0o444,
    "P0 preimage snapshot",
  );
  const successorLedgerBindingsCurrent =
    isCurrentSuccessorBinding(
      inputs.v3Successor.value.inputBindings?.completionLedger,
      inputs.completionLedger.binding,
      0o644,
    )
    && isCurrentSuccessorBinding(
      inputs.v3Successor.value.inputBindings?.lessonReleaseLedger,
      inputs.lessonReleaseLedger.binding,
      0o644,
    );

  const releaseMemberIds = new Set([...currentJavascriptIds, SHELL_ID]);
  invariant(
    releaseMemberIds.size === 40,
    "G4 L3 release member identity set is not 39 pages plus one shell",
  );
  const release = validateLedgers(
    inputs.completionLedger.value,
    inputs.lessonReleaseLedger.value,
    releaseMemberIds,
  );

  const preparedRelative = inputs.v3Successor.value.output.preparedPath;
  const prepared = await readStableFile(preparedRelative, {
    singleLink: true,
    mode: 0o444,
  });
  invariant(
    inputs.v3Successor.bytes.equals(prepared.bytes),
    "v3 renderer successor report and prepared package bytes differ",
  );
  invariant(
    inputs.v3Successor.identity.dev !== prepared.identity.dev
      || inputs.v3Successor.identity.ino !== prepared.identity.ino,
    "v3 renderer successor report and prepared package share an inode",
  );
  const successorGeneratorPath = inputs.v3Successor.value.generator?.path;
  invariant(
    successorGeneratorPath
      === "scripts/build-g4-l3-renderer-drift-successor-v3.mjs",
    "v3 renderer successor generator path drifted",
  );
  const successorGenerator = await readStableFile(successorGeneratorPath, {
    singleLink: true,
    mode: 0o644,
  });
  invariant(
    successorGenerator.binding.bytes
        === inputs.v3Successor.value.generator.bytes
      && successorGenerator.binding.sha256
        === inputs.v3Successor.value.generator.sha256
      && inputs.v3Successor.value.generator.mode === 0o644,
    "v3 renderer successor generator binding is not current",
  );

  const screenshotRecords = await bindPreviewScreenshots(
    inputs.controlledCeoPreviewQa.value,
  );
  const sourceBindings = Object.fromEntries(
    Object.entries(inputs).map(([key, record]) => [key, record.binding]),
  );
  sourceBindings.v3SuccessorPrepared = prepared.binding;
  sourceBindings.v3SuccessorGenerator = successorGenerator.binding;
  sourceBindings.previewScreenshots = screenshotRecords.map(
    ({binding}) => binding,
  );

  const scopedPaths = [
    ...Object.values(sourceBindings)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .map(({path: relativePath}) => relativePath),
  ];
  const worktree = scopedGitFingerprint(scopedPaths);
  const generatedAt = inputs.previewBuildReceipt.value.generatedAt;
  const base = {
    schemaVersion: 1,
    reportType: "g4-l3-v3-execution-checkpoint",
    status:
      "p0-p1-machine-verified-controlled-ceo-preview-ready",
    generatedAt,
    scope: {
      releaseId: RELEASE_ID,
      activePages: 39,
      courseShells: 1,
      releaseMembers: 40,
      productLayer: "controlled-ceo-preview-current-javascript-candidate",
      externalRuntimeWorkflowIncluded: false,
      liveFlashPidRequired: false,
      publicDeploymentIncluded: false,
    },
    sourceBindings,
    worktree,
    summary: {
      currentJavascriptPages: 39,
      runnableShells: 1,
      releaseMembers: 40,
      strictCompleteMembers: release.strictCompleteCount,
      published: release.published,
      uniqueRoutesVerified:
        inputs.controlledCeoPreviewQa.value.summary.uniqueRoutesVerified,
      routeVisits:
        inputs.controlledCeoPreviewQa.value.summary.routeVisits,
      replayMouseEnterSpaceRoutes:
        inputs.controlledCeoPreviewQa.value.summary
          .replayMouseEnterSpaceRoutes,
      controlledPreviewBoundaryPasses:
        inputs.controlledCeoPreviewQa.value.summary
          .controlledPreviewBoundaryPasses,
      privateNoStoreHeaderPasses:
        inputs.controlledCeoPreviewQa.value.summary
          .privateNoStoreHeaderPasses,
      noindexHeaderPasses:
        inputs.controlledCeoPreviewQa.value.summary.noindexHeaderPasses,
      controlledPreviewIdentityHeaderPasses:
        inputs.controlledCeoPreviewQa.value.summary
          .controlledPreviewIdentityHeaderPasses,
      screenshots: controlledDigests.captureManifestCount,
      qaFailures:
        inputs.controlledCeoPreviewQa.value.summary.failureCount,
      productionBuild: inputs.previewBuildReceipt.value.status,
      wholeLessonPackageId:
        inputs.wholeLessonPackageManifest.value.packageId,
      wholeLessonPackageManifestSha256:
        inputs.wholeLessonPackageManifest.binding.sha256,
      wholeLessonPackageZipSha256:
        inputs.wholeLessonPackageZip.binding.sha256,
      wholeLessonPackageZipBytes:
        inputs.wholeLessonPackageZip.binding.bytes,
      wholeLessonPackagePagesRendered:
        inputs.wholeLessonPackageSmoke.value.pagesRendered,
      wholeLessonPackageAudioUrlsChecked:
        inputs.wholeLessonPackageSmoke.value.audioUrlsChecked,
      wholeLessonPackageSmokeFailures:
        inputs.wholeLessonPackageSmoke.value.failures.length,
      wholeLessonPackageEmbeddedCheckpointStatus:
        "dated-prior-checkpoint",
      rendererStrictAcceptanceEffect: "none",
      rendererSuccessorDocumentStatus: inputs.v3Successor.value.status,
      rendererSuccessorLedgerBindingsCurrent:
        successorLedgerBindingsCurrent,
      rendererSuccessorDisposition: successorLedgerBindingsCurrent
        ? "current-bound-input"
        : "historical-stale-after-ledger-rebuild",
      successorIndependentInodesVerified: true,
    },
    evidenceDigests: controlledDigests,
    executionActions: {
      captureStarted: false,
      publicDeployment: false,
      completionLedgerPromoted: false,
      releaseLedgerPublished: false,
      wholeLessonPackageMutated: false,
      externalRuntimeWorkflowExcludedFromP1: true,
    },
    authority: {
      authoritativeOriginalRuntimeBaseline: false,
      naturalOriginalRuntimeTraversal: false,
      originalNavigationParity: false,
      interactionBranchParity: false,
      scoringParity: false,
      bilingualVisualParity: false,
      audioParity: false,
      audioListeningAcceptance: false,
      fullFrameCoverage: false,
      rmseAcceptance: false,
      humanVisualReview: false,
      ownerAcceptance: false,
      strictMigrationCompletion: false,
      atomicLessonPublication: false,
    },
    acceptance: {
      currentJavascriptPagesAvailable: true,
      shellCandidateAvailable: true,
      controlledCeoPreviewMachineVerified: true,
      productQaPassed: true,
      productionBuildPassed: true,
      wholeLessonPackageSmokePassed: true,
      authoritativeOriginalRuntimeComplete: false,
      humanAudioVisualReviewAccepted: false,
      ownerAccepted: false,
      fullFrameRmseAccepted: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
    pendingGates: {
      flashOriginalRuntimeEvidence: "pending",
      humanVisualReview: "pending",
      humanAudioListening: "pending",
      ownerAcceptance: "pending",
      fullFrameRmse: "pending",
      strictCompletion: "pending",
      publicRelease: "pending",
    },
    boundaryStatement:
      "This checkpoint proves only the machine-verified local current-JavaScript Controlled CEO Preview and the hash-bound loopback whole-lesson package smoke. The package embeds the earlier checkpoint only as dated evidence; this refreshed checkpoint is external to the frozen package. Original-runtime Flash evidence, human audio/visual review, Owner acceptance, full-frame RMSE, strict completion, and public release remain pending. The external runtime workflow, including any live Flash PID, is deliberately excluded from P1.",
  };
  return {
    ...base,
    reportFingerprintSha256: sha256(canonicalBytes(base)),
  };
}

function markdown(report) {
  const bindings = Object.values(report.sourceBindings)
    .flatMap((value) => Array.isArray(value) ? value : [value]);
  const rows = bindings
    .map(
      ({path: relativePath, bytes, sha256: digest}) =>
        `| \`${relativePath}\` | ${bytes} | \`${digest}\` |`,
    )
    .join("\n");
  return `# G4 L3 v3 execution checkpoint\n\n`
    + `Status: **${report.status}**\n\n`
    + `This is a machine-verified local Controlled CEO Preview and loopback whole-lesson package checkpoint, not a Flash fidelity, human, Owner, strict-completion, publication, or public-deployment acceptance report.\n\n`
    + `- Scope: **${report.summary.currentJavascriptPages}/39 current-JavaScript pages + ${report.summary.runnableShells}/1 shell**.\n`
    + `- Product QA: **${report.summary.uniqueRoutesVerified} routes / ${report.summary.routeVisits} visits**, **${report.summary.replayMouseEnterSpaceRoutes}/39 Replay mouse/Enter/Space**, **${report.summary.qaFailures} failures**.\n`
    + `- Preview boundary and headers: **${report.summary.controlledPreviewBoundaryPasses}/121 boundary**, **${report.summary.privateNoStoreHeaderPasses}/121 private no-store**, **${report.summary.noindexHeaderPasses}/121 noindex**, **${report.summary.controlledPreviewIdentityHeaderPasses}/121 preview identity**.\n`
    + `- Screenshots: **${report.summary.screenshots}/6**, hash-bound.\n`
    + `- Production build: **${report.summary.productionBuild}**.\n`
    + `- Frozen whole-lesson package: **${report.summary.wholeLessonPackagePagesRendered}/39 pages**, **${report.summary.wholeLessonPackageAudioUrlsChecked}/72 audio URLs**, **${report.summary.wholeLessonPackageSmokeFailures} smoke failures**; manifest and ZIP are hash-bound below.\n`
    + `- Package-embedded checkpoint: **${report.summary.wholeLessonPackageEmbeddedCheckpointStatus}**; this refreshed checkpoint remains external to the frozen package.\n`
    + `- Strict completion / publication: **${report.summary.strictCompleteMembers}/40**, **${report.summary.published ? "published" : "unpublished"}**.\n`
    + `- Renderer successor document: **${report.summary.rendererSuccessorDocumentStatus}**; checkpoint disposition: **${report.summary.rendererSuccessorDisposition}**; separate link-count-1 inodes verified.\n`
    + `- Capture started by this P0/P1 workflow: **no**. Public deployment: **no**.\n`
    + `- External Flash/runtime workflow: **excluded from P1; no live Flash PID is required by this checkpoint**.\n\n`
    + `Original-runtime Flash evidence, human visual review, human audio listening, Owner acceptance, full-frame RMSE, strict completion, and public release remain **pending**.\n\n`
    + `## Hash-bound inputs\n\n`
    + `| Path | Bytes | SHA-256 |\n`
    + `| --- | ---: | --- |\n`
    + `${rows}\n\n`
    + `The scoped Git fingerprint covers only the related input paths, excludes both checkpoint outputs, and withholds porcelain paths. It contains ${report.worktree.recordCount} status records across ${report.worktree.scopePathCount} scoped paths.\n\n`
    + `Checkpoint fingerprint: \`${report.reportFingerprintSha256}\`\n`;
}

async function outputExists(relativePath) {
  try {
    await lstat(projectPath(relativePath));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function createReadOnlyNoReplace(relativePath, bytes) {
  const absolutePath = projectPath(relativePath);
  await mkdir(path.dirname(absolutePath), {recursive: true});
  const handle = await open(absolutePath, "wx", 0o444);
  const identity = await handle.stat({bigint: true});
  let closed = false;
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.chmod(0o444);
    await handle.sync();
    const written = await handle.stat({bigint: true});
    invariant(
      written.isFile()
        && written.dev === identity.dev
        && written.ino === identity.ino
        && written.nlink === 1n
        && Number(written.mode & 0o777n) === 0o444
        && written.size === BigInt(bytes.length),
      `${relativePath} no-replace output descriptor drifted`,
    );
    await handle.close();
    closed = true;
    const final = await lstat(absolutePath, {bigint: true});
    invariant(
      final.isFile()
        && !final.isSymbolicLink()
        && final.dev === identity.dev
        && final.ino === identity.ino
        && final.nlink === 1n
        && Number(final.mode & 0o777n) === 0o444
        && final.size === BigInt(bytes.length),
      `${relativePath} no-replace output identity drifted`,
    );
    return {relativePath, dev: final.dev, ino: final.ino};
  } catch (error) {
    if (!closed) await handle.close().catch(() => {});
    await rollbackOwned({relativePath, dev: identity.dev, ino: identity.ino});
    throw error;
  }
}

async function rollbackOwned(owned) {
  if (!owned) return;
  const absolutePath = projectPath(owned.relativePath);
  const current = await lstat(absolutePath, {bigint: true}).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (
    current
      && current.isFile()
      && !current.isSymbolicLink()
      && current.dev === owned.dev
      && current.ino === owned.ino
  ) {
    await unlink(absolutePath);
  }
}

async function buildOutputs(report) {
  for (const relativePath of [JSON_OUTPUT, MARKDOWN_OUTPUT]) {
    invariant(
      !(await outputExists(relativePath)),
      `${relativePath} already exists; no-replace build refused`,
    );
  }
  const artifacts = [
    [JSON_OUTPUT, Buffer.from(pretty(report))],
    [MARKDOWN_OUTPUT, Buffer.from(markdown(report))],
  ];
  const owned = [];
  try {
    for (const [relativePath, bytes] of artifacts) {
      owned.push(await createReadOnlyNoReplace(relativePath, bytes));
    }
  } catch (error) {
    for (const artifact of [...owned].reverse()) {
      await rollbackOwned(artifact);
    }
    throw error;
  }
}

async function checkOutput(relativePath, expectedBytes) {
  const record = await readStableFile(relativePath, {
    singleLink: true,
    mode: 0o444,
  });
  invariant(
    record.bytes.equals(expectedBytes),
    `${relativePath} is stale`,
  );
}

async function checkOutputs(report) {
  await checkOutput(JSON_OUTPUT, Buffer.from(pretty(report)));
  await checkOutput(MARKDOWN_OUTPUT, Buffer.from(markdown(report)));
}

export function parseArguments(argv) {
  invariant(
    argv.length === 1 && ["--build", "--check"].includes(argv[0]),
    "Usage: node scripts/build-g4-l3-v3-execution-checkpoint.mjs --build|--check",
  );
  return {mode: argv[0].slice(2)};
}

export async function runCheckpoint({mode}) {
  const report = await generateCheckpoint();
  if (mode === "build") await buildOutputs(report);
  else if (mode === "check") await checkOutputs(report);
  else throw new Error(`Unsupported mode: ${mode}`);
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  runCheckpoint(parseArguments(process.argv.slice(2))).then((report) => {
    process.stdout.write(
      `PASS: ${report.status}; current JavaScript ${report.summary.currentJavascriptPages}/39 plus shell, strict ${report.summary.strictCompleteMembers}/40, unpublished.\n`,
    );
  }).catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
