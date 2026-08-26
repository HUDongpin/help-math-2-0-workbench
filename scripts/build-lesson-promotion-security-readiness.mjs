#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {lstat, mkdir, open} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

import {ORIGINAL_RUNTIME_NATURAL_PROMOTION_ENABLED} from "./lib/original-runtime-natural-causality.mjs";
import {
  ORIGINAL_RUNTIME_RELEASE_BUNDLE_PRODUCTION_ENABLED,
  ORIGINAL_RUNTIME_RELEASE_BUNDLE_WRITES_ENABLED,
} from "./lib/original-runtime-promotion-release-bundle.mjs";
import {ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_WRITES_ENABLED} from "./lib/original-runtime-promotion-transaction.mjs";
import {
  ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_ENABLED,
  ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_EXECUTOR_CONNECTED,
} from "./lib/original-runtime-promotion-production-entry.mjs";
import {
  KERNEL_ANCHORED_PATH_RACE_CLOSURE_WRITES_ENABLED,
  inspectKernelAnchoredPathRaceClosure,
} from "./lib/kernel-anchored-path-race-closure.mjs";
import {
  PROMOTION_WRITES_ENABLED as TRUST_PROMOTION_WRITES_ENABLED,
  PRODUCTION_TRUST_ANCHOR_CONFIGURED,
} from "./lib/original-runtime-promotion-trust.mjs";
import {
  EVIDENCE_RECEIPT_V1_ISSUER_WRITES_ENABLED,
  EVIDENCE_RECEIPT_V1_PRODUCTION_ISSUER_PRESENT,
  inspectEvidenceReceiptV1IssuerFoundation,
} from "./lib/evidence-receipt-v1-issuer-foundation.mjs";
import {
  PROMOTION_V2_NATIVE_SECURITY_EXECUTOR_CONNECTED,
  PROMOTION_V2_NATIVE_SECURITY_PRODUCTION_ENABLED,
  PROMOTION_V2_NATIVE_SECURITY_WRITES_ENABLED,
} from "./lib/promotion-v2-native-security-candidate.mjs";
import {
  LEGACY_ADOPTER_CANONICAL_WRITE_IMPLEMENTATION_PRESENT,
  PROMOTION_REMAINING_GATES,
  PROMOTION_WRITES_ENABLED as LEGACY_ADOPTER_PROMOTION_WRITES_ENABLED,
  originalRuntimePromotionBoundary,
} from "./adopt-course-original-runtime-evidence.mjs";
import {checkCompletionLedger} from "./build-completion-ledger.mjs";
import {
  checkLessonReleaseLedger,
  evaluateRelease,
  inspectStrictCompletionLedger,
} from "./build-lesson-release-ledger.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const releaseManifestPath = "catalog/lesson-releases.json";
const releaseLedgerPath = "catalog/lesson-release-ledger.json";
const completionLedgerPath = "catalog/completion-ledger.json";
const expectedFoundationSecurityTestCount = 209;
const releaseIoAllowlist = Object.freeze({
  "lesson-g05-l04-number-lines": Object.freeze({
    outputPrefix: "reports/g5-l4-promotion-security-readiness",
    workspaceReadinessPath: "reports/g5-l4-workspace-readiness.json",
    diagnosticCandidateIds: Object.freeze(["promotion-v2-darwin-native-security"]),
  }),
  "lesson-g05-l05-add-subtract-negative-numbers": Object.freeze({
    outputPrefix: "reports/g5-l5-promotion-security-readiness",
    workspaceReadinessPath: "reports/g5-l5-workspace-readiness.json",
    diagnosticCandidateIds: Object.freeze([]),
  }),
});
const portablePathSegmentPattern = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;

const securitySuites = Object.freeze([
  "scripts/adopt-course-original-runtime-evidence.test.mjs",
  "scripts/original-runtime-natural-causality.test.mjs",
  "scripts/original-runtime-promotion-trust.test.mjs",
  "scripts/original-runtime-promotion-transaction.test.mjs",
  "scripts/original-runtime-promotion-production-entry.test.mjs",
  "scripts/kernel-anchored-path-race-closure.test.mjs",
  "scripts/original-runtime-promotion-release-bundle.test.mjs",
  "scripts/evidence-receipt-v1.test.mjs",
  "scripts/evidence-receipt-v1-issuer-foundation.test.mjs",
]);

const securityModules = Object.freeze([
  "scripts/build-completion-ledger.mjs",
  "scripts/build-lesson-release-ledger.mjs",
  "skills/flash-to-js/scripts/validate_migration.mjs",
  "scripts/adopt-course-original-runtime-evidence.mjs",
  "scripts/lib/original-runtime-natural-causality.mjs",
  "scripts/lib/original-runtime-promotion-trust.mjs",
  "scripts/lib/original-runtime-promotion-transaction.mjs",
  "scripts/lib/original-runtime-promotion-production-entry.mjs",
  "scripts/lib/kernel-anchored-path-race-closure.mjs",
  "scripts/lib/original-runtime-promotion-release-bundle.mjs",
  "scripts/lib/evidence-receipt-v1.mjs",
  "scripts/lib/evidence-receipt-v1-issuer-foundation.mjs",
  "scripts/verify-evidence-receipt-v1.mjs",
  "schemas/evidence-receipt-v1.schema.json",
  "docs/ORIGINAL_RUNTIME_EVIDENCE_PROMOTION.md",
  "docs/EVIDENCE_RECEIPT_V1.md",
]);

const diagnosticCandidateDefinitions = Object.freeze({
  "promotion-v2-darwin-native-security": Object.freeze({
    reportKey: "promotionV2DarwinNativeSecurity",
    state: "diagnostic-only-engineering-candidate",
    platform: "darwin",
    expectedTestCount: 13,
    modules: Object.freeze([
      "scripts/lib/promotion-v2-native-security-candidate.mjs",
      "native/promotion-v2-darwin/PromotionV2NativeHelper.swift",
      "docs/PROMOTION_V2_NATIVE_SECURITY_CANDIDATE.md",
    ]),
    suites: Object.freeze([
      "scripts/promotion-v2-native-security-candidate.test.mjs",
    ]),
  }),
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function stableJson(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function safeFilesystemCode(error) {
  return typeof error?.code === "string" && /^[A-Z0-9_]+$/.test(error.code)
    ? error.code
    : "UNKNOWN";
}

function safeFilesystemError(label, operation, error) {
  const wrapped = new Error(`${label}: ${operation} failed (${safeFilesystemCode(error)})`);
  wrapped.code = safeFilesystemCode(error);
  return wrapped;
}

async function safeLstat(filePath, label, {allowMissing = false} = {}) {
  try {
    return await lstat(filePath);
  } catch (error) {
    if (allowMissing && error?.code === "ENOENT") return null;
    throw safeFilesystemError(label, "lstat", error);
  }
}

async function safeOpen(filePath, flags, label) {
  try {
    return await open(filePath, flags);
  } catch (error) {
    throw safeFilesystemError(label, "open", error);
  }
}

async function safeHandleStat(handle, label) {
  try {
    return await handle.stat();
  } catch (error) {
    throw safeFilesystemError(label, "fstat", error);
  }
}

async function safeHandleReadFile(handle, label) {
  try {
    return await handle.readFile();
  } catch (error) {
    throw safeFilesystemError(label, "read", error);
  }
}

function releaseIoProfile(releaseId) {
  invariant(
    typeof releaseId === "string" && Object.hasOwn(releaseIoAllowlist, releaseId),
    `${releaseId || "release"}: no promotion-readiness I/O profile is allowlisted`,
  );
  return releaseIoAllowlist[releaseId];
}

function diagnosticCandidatesForRelease(releaseId) {
  const profile = releaseIoProfile(releaseId);
  return profile.diagnosticCandidateIds.map((candidateId) => {
    const definition = diagnosticCandidateDefinitions[candidateId];
    invariant(definition, `${releaseId}: unknown promotion diagnostic candidate ${candidateId}`);
    return {candidateId, ...definition};
  });
}

export function promotionSecurityTestPlan(releaseId) {
  const diagnosticCandidates = diagnosticCandidatesForRelease(releaseId).map((candidate) => ({
    candidateId: candidate.candidateId,
    reportKey: candidate.reportKey,
    state: candidate.state,
    platform: candidate.platform,
    expectedTestCount: candidate.expectedTestCount,
    modules: [...candidate.modules],
    suites: [...candidate.suites],
  }));
  return {
    foundation: {
      expectedTestCount: expectedFoundationSecurityTestCount,
      modules: [...securityModules],
      suites: [...securitySuites],
    },
    diagnosticCandidates,
    expectedTestCount: expectedFoundationSecurityTestCount + diagnosticCandidates.reduce(
      (total, candidate) => total + candidate.expectedTestCount,
      0,
    ),
  };
}

export function inspectPromotionV2NativeSecurityCandidateBoundary() {
  const boundary = {
    state: "diagnostic-only-engineering-candidate",
    productionEnabled: PROMOTION_V2_NATIVE_SECURITY_PRODUCTION_ENABLED,
    executorConnected: PROMOTION_V2_NATIVE_SECURITY_EXECUTOR_CONNECTED,
    writesEnabled: PROMOTION_V2_NATIVE_SECURITY_WRITES_ENABLED,
    productionIntegrationPresent: false,
    authoritativeOriginalRuntimeEffect: "none",
    reviewEffect: "none",
    strictCompletionEffect: "none",
    releaseEffect: "none",
    publicationEffect: "none",
  };
  return {
    ...boundary,
    allProductionCapabilitiesDisabled:
      boundary.productionEnabled === false &&
      boundary.executorConnected === false &&
      boundary.writesEnabled === false &&
      boundary.productionIntegrationPresent === false,
  };
}

function validatePortableReportsPath(value, label, {extension = null} = {}) {
  invariant(typeof value === "string" && value.length > 0, `${label} must be a non-empty path`);
  invariant(!path.isAbsolute(value) && !value.includes("\\"), `${label} must be project-relative and portable`);
  invariant(path.posix.normalize(value) === value, `${label} must be normalized`);
  const segments = value.split("/");
  invariant(segments[0] === "reports" && segments.length >= 2, `${label} must be confined under reports/`);
  invariant(segments.slice(1).every((segment) => portablePathSegmentPattern.test(segment)), `${label} contains a non-portable segment`);
  if (extension !== null) invariant(value.endsWith(extension), `${label} must end in ${extension}`);
  return value;
}

export function validateOutputPrefix(releaseId, value) {
  const expected = releaseIoProfile(releaseId).outputPrefix;
  invariant(value === expected, `${releaseId}: --output-prefix must use its allowlisted report prefix`);
  validatePortableReportsPath(value, "--output-prefix");
  invariant(!value.endsWith(".json") && !value.endsWith(".md"), "--output-prefix must not include a report extension");
  return value;
}

export function validateWorkspaceReadinessPath(releaseId, value) {
  const expected = releaseIoProfile(releaseId).workspaceReadinessPath;
  invariant(typeof value === "string" && value.length > 0, `${releaseId}: --workspace-readiness is required`);
  invariant(value === expected, `${releaseId}: --workspace-readiness must use its allowlisted report`);
  validatePortableReportsPath(value, "--workspace-readiness", {extension: ".json"});
  return value;
}

function outputPathsForPrefix(root, releaseId, outputPrefix) {
  validateOutputPrefix(releaseId, outputPrefix);
  return ["json", "markdown"].map((kind) => {
    const extension = kind === "json" ? ".json" : ".md";
    const relativePath = `${outputPrefix}${extension}`;
    return {kind, relativePath, absolutePath: path.resolve(root, relativePath)};
  });
}

function assertSafeDirectoryStat(stat, label) {
  invariant(!stat.isSymbolicLink(), `${label} must not be a symbolic link`);
  invariant(stat.isDirectory(), `${label} must be a directory`);
}

function assertSafeTargetStat(stat, label) {
  invariant(!stat.isSymbolicLink(), `${label} must not be a symbolic link`);
  invariant(stat.isFile(), `${label} must be a regular file`);
  invariant(stat.nlink === 1, `${label} must not be a hard link`);
}

function sameFile(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function sameContentMetadata(left, right) {
  return left.size === right.size &&
    left.mtimeMs === right.mtimeMs &&
    left.ctimeMs === right.ctimeMs &&
    left.mode === right.mode;
}

async function inspectSafeAncestors(root, targetPath, label) {
  const rootPath = path.resolve(root);
  const parentPath = path.dirname(targetPath);
  const relativeParent = path.relative(rootPath, parentPath);
  invariant(!relativeParent.startsWith("..") && !path.isAbsolute(relativeParent), `${label} parent escapes the project root`);
  const paths = [rootPath];
  if (relativeParent) {
    let current = rootPath;
    for (const segment of relativeParent.split(path.sep)) {
      current = path.join(current, segment);
      paths.push(current);
    }
  }
  const ancestors = [];
  for (let index = 0; index < paths.length; index += 1) {
    const ancestorPath = paths[index];
    const ancestorLabel = `${label} ancestor ${index}`;
    const stat = await safeLstat(ancestorPath, ancestorLabel, {allowMissing: true});
    invariant(stat, `${ancestorLabel} does not exist`);
    assertSafeDirectoryStat(stat, ancestorLabel);
    ancestors.push({path: ancestorPath, stat, label: ancestorLabel});
  }
  return ancestors;
}

async function recheckSafeAncestors(ancestors) {
  for (const ancestor of ancestors) {
    const current = await safeLstat(ancestor.path, ancestor.label, {allowMissing: true});
    invariant(current, `${ancestor.label} disappeared during access`);
    assertSafeDirectoryStat(current, ancestor.label);
    invariant(sameFile(current, ancestor.stat), `${ancestor.label} changed during access`);
  }
}

async function recheckSafeTarget(target, handle) {
  const descriptorStat = await safeHandleStat(handle, target.label);
  assertSafeTargetStat(descriptorStat, target.label);
  invariant(sameFile(descriptorStat, target.stat), `${target.label} descriptor identity changed during access`);
  const pathnameStat = await safeLstat(target.absolutePath, target.label, {allowMissing: true});
  invariant(pathnameStat, `${target.label} disappeared during access`);
  assertSafeTargetStat(pathnameStat, target.label);
  invariant(sameFile(pathnameStat, target.stat), `${target.label} pathname identity changed during access`);
  await recheckSafeAncestors(target.ancestors);
  return descriptorStat;
}

export async function inspectReportOutputSafety({
  root = projectRoot,
  releaseId,
  outputPrefix,
} = {}) {
  const targets = outputPathsForPrefix(root, releaseId, outputPrefix);
  const inspected = [];
  for (const target of targets) {
    const label = `${target.kind} report output`;
    const ancestors = await inspectSafeAncestors(root, target.absolutePath, label);
    const stat = await safeLstat(target.absolutePath, label, {allowMissing: true});
    invariant(stat, `${label} does not exist; this diagnostic builder never creates report targets`);
    assertSafeTargetStat(stat, label);
    inspected.push({...target, label, ancestors, stat});
  }
  return inspected;
}

async function openVerifiedOutput(target, {forWrite}) {
  invariant(Number.isInteger(fsConstants.O_NOFOLLOW), "This runtime does not expose O_NOFOLLOW for report output safety");
  invariant(Number.isInteger(fsConstants.O_NONBLOCK), "This runtime does not expose O_NONBLOCK for report output safety");
  invariant(target.stat, `${target.kind} report output does not exist`);
  const flags = (forWrite ? fsConstants.O_WRONLY : fsConstants.O_RDONLY)
    | fsConstants.O_NOFOLLOW
    | fsConstants.O_NONBLOCK;
  const handle = await safeOpen(target.absolutePath, flags, target.label);
  try {
    await recheckSafeTarget(target, handle);
    return handle;
  } catch (error) {
    await handle.close();
    throw error;
  }
}

async function readVerifiedOutput(target) {
  const handle = await openVerifiedOutput(target, {forWrite: false});
  try {
    const bytes = await safeHandleReadFile(handle, target.label);
    await recheckSafeTarget(target, handle);
    return bytes.toString("utf8");
  } finally {
    await handle.close();
  }
}

async function writeVerifiedOutput(target, contents) {
  const handle = await openVerifiedOutput(target, {forWrite: true});
  try {
    await recheckSafeTarget(target, handle);
    try {
      await handle.truncate(0);
      await handle.writeFile(contents, "utf8");
    } catch (error) {
      throw safeFilesystemError(target.label, "write", error);
    }
    await recheckSafeTarget(target, handle);
  } finally {
    await handle.close();
  }
}

function resolveProjectFile(root, relativePath, label) {
  invariant(typeof relativePath === "string" && relativePath.length > 0, `${label} must be a non-empty path`);
  invariant(!path.isAbsolute(relativePath) && !relativePath.includes("\\"), `${label} must be project-relative and portable`);
  const rootPath = path.resolve(root);
  const resolved = path.resolve(rootPath, relativePath);
  const relative = path.relative(rootPath, resolved);
  invariant(!relative.startsWith("..") && !path.isAbsolute(relative), `${label} escapes the project root`);
  invariant(portable(relative) === relativePath, `${label} must be normalized as ${portable(relative)}`);
  return resolved;
}

async function inspectFixedProjectFile({root, relativePath, label}) {
  const absolutePath = resolveProjectFile(root, relativePath, label);
  const ancestors = await inspectSafeAncestors(root, absolutePath, label);
  const stat = await safeLstat(absolutePath, label, {allowMissing: true});
  invariant(stat, `${label} does not exist`);
  assertSafeTargetStat(stat, label);
  return {relativePath, absolutePath, ancestors, stat, label};
}

/**
 * Read one immutable userspace snapshot from one O_NOFOLLOW descriptor.
 * Hashing and optional JSON parsing always consume these exact bytes. The
 * pathname, descriptor, link count, and in-project ancestor identities are
 * rechecked, but this diagnostic hardening is not kernel-anchored path-race
 * closure and must not be represented as such.
 */
export async function readFixedProjectFileBinding(relativePath, {
  root = projectRoot,
  parseJson = false,
} = {}) {
  const label = `fixed binding ${relativePath}`;
  const target = await inspectFixedProjectFile({root, relativePath, label});
  invariant(Number.isInteger(fsConstants.O_NOFOLLOW), "This runtime does not expose O_NOFOLLOW for fixed binding safety");
  invariant(Number.isInteger(fsConstants.O_NONBLOCK), "This runtime does not expose O_NONBLOCK for fixed binding safety");
  const handle = await safeOpen(
    target.absolutePath,
    fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_NONBLOCK,
    label,
  );
  try {
    const snapshotStat = await recheckSafeTarget(target, handle);
    invariant(sameContentMetadata(snapshotStat, target.stat), `${label} content metadata changed before snapshot`);
    const bytes = await safeHandleReadFile(handle, label);
    const finalStat = await recheckSafeTarget(target, handle);
    invariant(sameContentMetadata(finalStat, snapshotStat), `${label} content metadata changed during snapshot`);
    const binding = {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
    if (!parseJson) return binding;
    try {
      return {...binding, value: JSON.parse(bytes.toString("utf8"))};
    } catch {
      throw new Error(`${label} contains invalid JSON`);
    }
  } finally {
    await handle.close();
  }
}

async function fileBinding(relativePath) {
  return readFixedProjectFileBinding(relativePath);
}

async function jsonBinding(relativePath) {
  return readFixedProjectFileBinding(relativePath, {parseJson: true});
}

async function allowedWorkspaceReadinessBinding(releaseId, relativePath) {
  validateWorkspaceReadinessPath(releaseId, relativePath);
  return readFixedProjectFileBinding(relativePath, {parseJson: true});
}

function parseCount(output, label) {
  const match = output.match(new RegExp(`^# ${label} (\\d+)$`, "m"));
  invariant(match, `Node test output is missing ${label} count`);
  return Number(match[1]);
}

async function runNodeTestGroup({files, expectedTestCount, label}) {
  const externalTmp = path.join(projectRoot, "work", "tmp");
  await mkdir(externalTmp, {recursive: true});
  const {stdout, stderr} = await execFileAsync(process.execPath, [
    "--test",
    "--test-reporter=tap",
    ...files.map((file) => path.join(projectRoot, file)),
  ], {
    cwd: projectRoot,
    env: {...process.env, TMPDIR: externalTmp},
    maxBuffer: 12 * 1024 * 1024,
  });
  invariant(!stderr.trim(), `${label} emitted stderr: ${stderr.trim().slice(0, 500)}`);
  const tests = parseCount(stdout, "tests");
  const passed = parseCount(stdout, "pass");
  const failed = parseCount(stdout, "fail");
  invariant(
    tests === expectedTestCount && passed === expectedTestCount && failed === 0,
    `${label} result drifted: ${passed}/${tests} passed, ${failed} failed; expected ${expectedTestCount}/${expectedTestCount}`,
  );
  return {
    runner: "node",
    nodeVersion: process.version,
    reporter: "tap",
    tests,
    passed,
    failed,
    cancelled: parseCount(stdout, "cancelled"),
    skipped: parseCount(stdout, "skipped"),
    todo: parseCount(stdout, "todo"),
  };
}

async function runSecuritySuites(testPlan) {
  const foundation = await runNodeTestGroup({
    files: testPlan.foundation.suites,
    expectedTestCount: testPlan.foundation.expectedTestCount,
    label: "Promotion foundation security suite",
  });
  const diagnosticCandidates = {};
  for (const candidate of testPlan.diagnosticCandidates) {
    invariant(
      process.platform === candidate.platform,
      `${candidate.candidateId}: ${candidate.platform}-only diagnostic suite cannot run on ${process.platform}`,
    );
    diagnosticCandidates[candidate.reportKey] = await runNodeTestGroup({
      files: candidate.suites,
      expectedTestCount: candidate.expectedTestCount,
      label: `${candidate.candidateId} diagnostic suite`,
    });
  }
  const groups = [foundation, ...Object.values(diagnosticCandidates)];
  return {
    runner: "node",
    nodeVersion: process.version,
    reporter: "tap",
    tests: groups.reduce((sum, group) => sum + group.tests, 0),
    passed: groups.reduce((sum, group) => sum + group.passed, 0),
    failed: groups.reduce((sum, group) => sum + group.failed, 0),
    cancelled: groups.reduce((sum, group) => sum + group.cancelled, 0),
    skipped: groups.reduce((sum, group) => sum + group.skipped, 0),
    todo: groups.reduce((sum, group) => sum + group.todo, 0),
    foundation,
    diagnosticCandidates,
  };
}

export function selectAtomicRelease(manifest, releaseId) {
  invariant(isObject(manifest) && manifest.schemaVersion === 1 && Array.isArray(manifest.releases), "Lesson release manifest is malformed");
  const matches = manifest.releases.filter((release) => release?.releaseId === releaseId);
  invariant(matches.length === 1, `Expected exactly one release ${releaseId}, found ${matches.length}`);
  const release = matches[0];
  invariant(release.publicationMode === "atomic", `${releaseId}: publicationMode must be atomic`);
  invariant(Number.isSafeInteger(release.expectedCounts?.members) && release.expectedCounts.members > 0, `${releaseId}: expected member count is invalid`);
  invariant(Array.isArray(release.members) && release.members.length === release.expectedCounts.members, `${releaseId}: release members are incomplete`);
  invariant(release.members.every((member, index) => member.ordinal === index + 1), `${releaseId}: release member ordinals are not contiguous`);
  invariant(new Set(release.members.map(({animationId}) => animationId)).size === release.members.length, `${releaseId}: duplicate animationId`);
  invariant(new Set(release.members.map(({assetId}) => assetId)).size === release.members.length, `${releaseId}: duplicate assetId`);
  return release;
}

function bindingMatches(binding, expected, generatedMarker) {
  return isObject(binding) &&
    binding.path === expected.path &&
    binding.bytes === expected.bytes &&
    binding.sha256 === expected.sha256 &&
    (generatedMarker === undefined || binding.generatedMarker === generatedMarker);
}

function ledgerCheckSummary(result, fallbackReason = "not-checked") {
  return {
    current: result?.ok === true,
    reason: typeof result?.reason === "string" ? result.reason : fallbackReason,
    expectedGeneratedMarker: result?.ledger?.generatedMarker ?? null,
  };
}

function safeDiagnosticError(error) {
  if (typeof error?.code === "string") return `filesystem-${safeFilesystemCode(error)}`;
  const message = typeof error?.message === "string" ? error.message : "unknown-error";
  return message.split(projectRoot).join("<project-root>");
}

export function summarizeLedgerReproducibility({completion, release = null, releaseError = null}) {
  const completionSummary = ledgerCheckSummary(completion);
  if (!completionSummary.current) {
    return {
      allCurrent: false,
      freshCompletionLedger: completion?.ledger ?? null,
      completionLedger: completionSummary,
      releaseLedger: {
        current: false,
        reason: `blocked-by-completion-ledger-${completionSummary.reason}`,
        expectedGeneratedMarker: null,
      },
    };
  }

  if (releaseError !== null) {
    return {
      allCurrent: false,
      freshCompletionLedger: completion?.ledger ?? null,
      completionLedger: completionSummary,
      releaseLedger: {
        current: false,
        reason: `check-failed:${safeDiagnosticError(releaseError)}`,
        expectedGeneratedMarker: null,
      },
    };
  }

  const releaseSummary = ledgerCheckSummary(release);
  return {
    allCurrent: completionSummary.current && releaseSummary.current,
    freshCompletionLedger: completion?.ledger ?? null,
    completionLedger: completionSummary,
    releaseLedger: releaseSummary,
  };
}

export async function inspectLedgerReproducibility() {
  const completion = await checkCompletionLedger();
  if (completion?.ok !== true) return summarizeLedgerReproducibility({completion});
  try {
    const release = await checkLessonReleaseLedger({
      completionLedgerCheck: async () => completion,
    });
    return summarizeLedgerReproducibility({completion, release});
  } catch (releaseError) {
    return summarizeLedgerReproducibility({completion, releaseError});
  }
}

function projectionSha256(value) {
  return sha256(Buffer.from(stableJson(value)));
}

export function inspectReleaseScopedProjection({
  release,
  releaseLedger,
  persistedCompletionLedger,
  freshCompletionLedger,
}) {
  const membershipFingerprint = projectionSha256({
    releaseId: release.releaseId,
    publicationMode: release.publicationMode,
    expectedMemberCount: release.expectedCounts.members,
    members: release.members.map((member) => ({
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      releaseRole: member.releaseRole,
      batchId: member.batchId,
      shardId: member.shardId,
    })),
  });
  const releaseDefinitionSha256 = projectionSha256(release);
  try {
    invariant(freshCompletionLedger, "fresh completion ledger is unavailable");
    const persistedEntries = inspectStrictCompletionLedger(persistedCompletionLedger).entriesByAnimationId;
    const freshEntries = inspectStrictCompletionLedger(freshCompletionLedger).entriesByAnimationId;
    const persistedProjection = evaluateRelease(release, persistedEntries);
    const freshProjection = evaluateRelease(release, freshEntries);
    const releaseRows = Array.isArray(releaseLedger?.releases)
      ? releaseLedger.releases.filter((row) => row?.releaseId === release.releaseId)
      : [];
    const releaseLedgerProjection = releaseRows.length === 1 ? releaseRows[0] : null;
    const persistedProjectionJson = stableJson(persistedProjection);
    const freshProjectionJson = stableJson(freshProjection);
    const releaseLedgerProjectionJson = releaseLedgerProjection === null
      ? null
      : stableJson(releaseLedgerProjection);
    const persistedMatchesFresh = persistedProjectionJson === freshProjectionJson;
    const releaseLedgerMatchesFresh = releaseLedgerProjectionJson === freshProjectionJson;
    const current = persistedMatchesFresh && releaseLedgerMatchesFresh;
    return {
      current,
      reason: current
        ? "current"
        : releaseRows.length !== 1
          ? "release-row-missing-or-duplicated"
          : !persistedMatchesFresh
            ? "persisted-completion-projection-stale"
            : "release-ledger-projection-stale",
      membershipFingerprint,
      releaseDefinitionSha256,
      releaseLedgerRowCount: releaseRows.length,
      persistedProjectionSha256: projectionSha256(persistedProjection),
      freshProjectionSha256: projectionSha256(freshProjection),
      releaseLedgerProjectionSha256: releaseLedgerProjection === null
        ? null
        : projectionSha256(releaseLedgerProjection),
      strictCompleteCount: freshProjection.strictCompleteCount,
      missingCount: freshProjection.missingCount,
      assetMismatchCount: freshProjection.assetMismatchCount,
      published: freshProjection.published,
    };
  } catch (error) {
    return {
      current: false,
      reason: `projection-failed:${error.message}`,
      membershipFingerprint,
      releaseDefinitionSha256,
      releaseLedgerRowCount: Array.isArray(releaseLedger?.releases)
        ? releaseLedger.releases.filter((row) => row?.releaseId === release.releaseId).length
        : 0,
      persistedProjectionSha256: null,
      freshProjectionSha256: null,
      releaseLedgerProjectionSha256: null,
      strictCompleteCount: 0,
      missingCount: release.expectedCounts.members,
      assetMismatchCount: 0,
      published: false,
    };
  }
}

export function inspectReleaseLedger({releaseLedger, releaseManifestBinding, completionLedgerBinding, completionLedger, releaseId}) {
  if (!isObject(releaseLedger) || releaseLedger.schemaVersion !== 1 || !Array.isArray(releaseLedger.releases)) {
    return {bindingsCurrent: false, releaseRowPresent: false, published: false, strictCompleteCount: 0, reason: "release-ledger-malformed"};
  }
  const sourceBindings = releaseLedger.sources;
  const bindingsCurrent = isObject(sourceBindings) &&
    bindingMatches(sourceBindings.lessonReleases, releaseManifestBinding) &&
    bindingMatches(
      sourceBindings.completionLedger,
      completionLedgerBinding,
      completionLedger?.generatedMarker,
    );
  const rows = releaseLedger.releases.filter((release) => release?.releaseId === releaseId);
  if (rows.length !== 1) {
    return {bindingsCurrent, releaseRowPresent: false, published: false, strictCompleteCount: 0, reason: "release-row-missing-or-duplicated"};
  }
  const row = rows[0];
  return {
    bindingsCurrent,
    releaseRowPresent: true,
    published: bindingsCurrent && row.published === true,
    strictCompleteCount: Number.isSafeInteger(row.strictCompleteCount) ? row.strictCompleteCount : 0,
    reason: bindingsCurrent ? "current" : "source-binding-stale",
  };
}

function allProductionFuses() {
  const values = {
    naturalPromotionEnabled: ORIGINAL_RUNTIME_NATURAL_PROMOTION_ENABLED,
    trustPromotionWritesEnabled: TRUST_PROMOTION_WRITES_ENABLED,
    productionTrustAnchorConfigured: PRODUCTION_TRUST_ANCHOR_CONFIGURED,
    transactionWritesEnabled: ORIGINAL_RUNTIME_PROMOTION_TRANSACTION_WRITES_ENABLED,
    productionEntryEnabled: ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_ENABLED,
    productionEntryExecutorConnected: ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_EXECUTOR_CONNECTED,
    kernelAnchoredPathRaceClosureWritesEnabled:
      KERNEL_ANCHORED_PATH_RACE_CLOSURE_WRITES_ENABLED,
    releaseBundleWritesEnabled: ORIGINAL_RUNTIME_RELEASE_BUNDLE_WRITES_ENABLED,
    releaseBundleProductionEnabled: ORIGINAL_RUNTIME_RELEASE_BUNDLE_PRODUCTION_ENABLED,
    evidenceReceiptIssuerWritesEnabled: EVIDENCE_RECEIPT_V1_ISSUER_WRITES_ENABLED,
    evidenceReceiptProductionIssuerPresent: EVIDENCE_RECEIPT_V1_PRODUCTION_ISSUER_PRESENT,
    legacyAdopterPromotionWritesEnabled: LEGACY_ADOPTER_PROMOTION_WRITES_ENABLED,
    legacyAdopterCanonicalWriteImplementationPresent:
      LEGACY_ADOPTER_CANONICAL_WRITE_IMPLEMENTATION_PRESENT,
  };
  return {...values, allClosed: Object.values(values).every((value) => value === false)};
}

export async function buildReport({releaseId, workspaceReadinessPath}) {
  invariant(/^[a-z0-9][a-z0-9-]{2,127}$/.test(releaseId || ""), "--release-id must be a lowercase portable identifier");
  validateWorkspaceReadinessPath(releaseId, workspaceReadinessPath);
  const testPlan = promotionSecurityTestPlan(releaseId);
  const candidateModulePaths = testPlan.diagnosticCandidates.flatMap(({modules}) => modules);
  const candidateSuitePaths = testPlan.diagnosticCandidates.flatMap(({suites}) => suites);
  const [testResult, ledgerInspection, manifest, releaseLedger, completionLedger, generator, ...bindings] = await Promise.all([
    runSecuritySuites(testPlan),
    inspectLedgerReproducibility(),
    jsonBinding(releaseManifestPath),
    jsonBinding(releaseLedgerPath),
    jsonBinding(completionLedgerPath),
    fileBinding(portable(path.relative(projectRoot, scriptPath))),
    ...testPlan.foundation.modules.map(fileBinding),
    ...testPlan.foundation.suites.map(fileBinding),
    ...candidateModulePaths.map(fileBinding),
    ...candidateSuitePaths.map(fileBinding),
    allowedWorkspaceReadinessBinding(releaseId, workspaceReadinessPath),
  ]);
  const {freshCompletionLedger, ...ledgerReproducibility} = ledgerInspection;
  const release = selectAtomicRelease(manifest.value, releaseId);
  const ledger = inspectReleaseLedger({
    releaseLedger: releaseLedger.value,
    releaseManifestBinding: manifest,
    completionLedgerBinding: completionLedger,
    completionLedger: completionLedger.value,
    releaseId,
  });
  const productionFuses = allProductionFuses();
  const kernelAnchoredPathRaceClosure = inspectKernelAnchoredPathRaceClosure();
  const evidenceReceiptIssuerFoundation = inspectEvidenceReceiptV1IssuerFoundation();
  const releaseScopedProjection = inspectReleaseScopedProjection({
    release,
    releaseLedger: releaseLedger.value,
    persistedCompletionLedger: completionLedger.value,
    freshCompletionLedger,
  });
  invariant(productionFuses.allClosed, "A production promotion fuse opened unexpectedly; this readiness profile must be independently reviewed before regeneration");
  invariant(!ledger.published, `${releaseId} is published while the production promotion chain is disabled`);
  invariant(!releaseScopedProjection.published, `${releaseId} fresh release projection is published while the production promotion chain is disabled`);
  invariant(kernelAnchoredPathRaceClosure.productionReady === false, "Kernel-anchored path-race closure unexpectedly reports production ready");
  invariant(evidenceReceiptIssuerFoundation.productionIssuerPresent === false, "EvidenceReceiptV1 production issuer unexpectedly appeared");
  invariant(
    testResult.tests === testPlan.expectedTestCount &&
      testResult.passed === testPlan.expectedTestCount &&
      testResult.failed === 0,
    `${releaseId}: combined promotion security result does not match the release-scoped test plan`,
  );

  let bindingOffset = 0;
  const moduleBindings = bindings.slice(bindingOffset, bindingOffset + testPlan.foundation.modules.length);
  bindingOffset += testPlan.foundation.modules.length;
  const suiteBindings = bindings.slice(bindingOffset, bindingOffset + testPlan.foundation.suites.length);
  bindingOffset += testPlan.foundation.suites.length;
  const candidateModuleBindings = bindings.slice(bindingOffset, bindingOffset + candidateModulePaths.length);
  bindingOffset += candidateModulePaths.length;
  const candidateSuiteBindings = bindings.slice(bindingOffset, bindingOffset + candidateSuitePaths.length);
  bindingOffset += candidateSuitePaths.length;
  const workspaceBinding = bindings.at(-1);
  invariant(bindingOffset === bindings.length - 1, "Promotion security source-binding partition drifted");
  invariant(workspaceBinding.value?.releaseId === releaseId, "Workspace readiness belongs to another release");
  invariant(workspaceBinding.value?.summary?.expectedWorkspaceCount === release.expectedCounts.members, "Workspace readiness member count differs from release definition");
  const diagnosticCandidateSourceBindings = {};
  let candidateModuleOffset = 0;
  let candidateSuiteOffset = 0;
  for (const candidate of testPlan.diagnosticCandidates) {
    diagnosticCandidateSourceBindings[candidate.reportKey] = {
      candidateId: candidate.candidateId,
      modules: candidateModuleBindings.slice(
        candidateModuleOffset,
        candidateModuleOffset + candidate.modules.length,
      ),
      suites: candidateSuiteBindings.slice(
        candidateSuiteOffset,
        candidateSuiteOffset + candidate.suites.length,
      ),
    };
    candidateModuleOffset += candidate.modules.length;
    candidateSuiteOffset += candidate.suites.length;
  }
  invariant(
    candidateModuleOffset === candidateModuleBindings.length &&
      candidateSuiteOffset === candidateSuiteBindings.length,
    "Promotion diagnostic-candidate source-binding partition drifted",
  );
  const diagnosticCandidates = {};
  for (const candidate of testPlan.diagnosticCandidates) {
    invariant(
      candidate.reportKey === "promotionV2DarwinNativeSecurity",
      `${candidate.candidateId}: unsupported promotion diagnostic candidate`,
    );
    const boundary = inspectPromotionV2NativeSecurityCandidateBoundary();
    invariant(
      boundary.allProductionCapabilitiesDisabled,
      `${candidate.candidateId}: a diagnostic-only production capability opened unexpectedly`,
    );
    const candidateTestResult = testResult.diagnosticCandidates[candidate.reportKey];
    invariant(
      candidateTestResult?.tests === candidate.expectedTestCount &&
        candidateTestResult?.passed === candidate.expectedTestCount &&
        candidateTestResult?.failed === 0,
      `${candidate.candidateId}: diagnostic test result is incomplete`,
    );
    diagnosticCandidates[candidate.reportKey] = {
      candidateId: candidate.candidateId,
      platform: candidate.platform,
      ...boundary,
      testResult: candidateTestResult,
      bindingDisposition: "hash-bound-child-candidate-only",
      promotionAuthority: "none",
    };
  }
  const base = {
    reportType: "lesson-promotion-security-readiness",
    releaseId,
    authority: "Acceptance-neutral security/readiness report. It cannot authorize runtime capture, evidence promotion, strict completion, review, Owner acceptance, or publication.",
    generator,
    release: {
      expectedMemberCount: release.expectedCounts.members,
      publicationMode: release.publicationMode,
      shardCount: release.expectedCounts.shards,
      releaseManifestFileSha256: manifest.sha256,
      ledgerBindingsCurrent: ledger.bindingsCurrent,
      ledgerRowPresent: ledger.releaseRowPresent,
      strictCompleteCount: ledger.strictCompleteCount,
      published: ledger.published,
      ledgerDisposition: ledger.reason,
    },
    ledgerReproducibility: {
      ...ledgerReproducibility,
      completionLedger: {
        ...ledgerReproducibility.completionLedger,
        actualGeneratedMarker: completionLedger.value?.generatedMarker ?? null,
      },
      releaseLedger: {
        ...ledgerReproducibility.releaseLedger,
        actualGeneratedMarker: releaseLedger.value?.generatedMarker ?? null,
      },
    },
    releaseScopedProjection,
    sourceBindings: {
      releaseManifest: {path: manifest.path, bytes: manifest.bytes, sha256: manifest.sha256},
      releaseLedger: {path: releaseLedger.path, bytes: releaseLedger.bytes, sha256: releaseLedger.sha256},
      completionLedger: {path: completionLedger.path, bytes: completionLedger.bytes, sha256: completionLedger.sha256},
      workspaceReadiness: {path: workspaceBinding.path, bytes: workspaceBinding.bytes, sha256: workspaceBinding.sha256},
      modules: moduleBindings,
      suites: suiteBindings,
      diagnosticCandidates: diagnosticCandidateSourceBindings,
    },
    testResult,
    diagnosticCandidates,
    pathSafetyBoundary: {
      fixedInputsUseSingleDescriptorSnapshot: true,
      hashAndJsonParseUseIdenticalBytes: true,
      noFollowAndNonblockingOpenRequired: true,
      regularSingleLinkAndAncestorIdentityRechecked: true,
      reportTargetsMustPreexist: true,
      reportTargetCreationCapabilityPresent: false,
      kernelAnchoredPathRaceClosureClaimed: false,
      disposition: "userspace-diagnostic-hardening-only",
    },
    verifiedSyntheticControls: [
      "typed recursive candidate DAG closure and content hashing",
      "signature tampering, role mismatch, revocation freshness, and replay rejection",
      "path traversal, symlink, external hardlink, and disguised media rejection",
      "per-migration lock, compare-and-swap, concurrent writer exclusion, and no-replace writes",
      "segmented persistent journal, rollback, crash recovery, and foreign-drift preservation",
      "a test-only isolated reference harness covers durable nonce ordering, execute-replay recovery routing, changed-plan nonce rejection, crash recovery, and poisoned-TMPDIR rejection while the production-entry module remains physically write-free",
      "kernel path-capability detection, private-only operation planning, no pathname fallback, and zero-mutation adversarial ancestor/destination replacement negatives",
      "release-bundle substitution and Merkle inclusion failure handling",
      "EvidenceReceiptV1 exact counts, build drift, signature tampering, expiry, privacy, and failed-command rejection",
      "the G5 L4-pinned EvidenceReceiptV1 structural preflight rejects incomplete releases, release/member/hash drift, stale revocation claims, command-shape drift, callbacks, key/signature/receipt injection, and cloned descriptors while requiring external command and cryptographic verification",
      "legacy adopter has no filesystem mutation capability or latent promotion return path",
      ...(
        diagnosticCandidates.promotionV2DarwinNativeSecurity
          ? [
              "the hash-bound Promotion V2 Darwin native-security child candidate passes its isolated APFS adversarial suite while all candidate production, executor, write, integration, authority, review, strict-completion, release, and publication effects remain disabled",
            ]
          : []
      ),
    ],
    productionFuses,
    machineFoundations: {
      durableNonceAndTransactionEntry: {
        state: "foundation-only-production-disabled",
        foundationPresent: true,
        productionModuleReadOnlyPlanningAndInspectionOnly: true,
        productionModuleFilesystemMutationCapabilityPresent: false,
        productionDurableNonceExecutionIntegrationPresent: false,
        testOnlyReferenceHarnessCoversNonceOrderingRecoveryAndCrashSemantics: true,
        poisonedTmpdirRealProjectBypassRejectedBySyntheticTests: true,
        productionEntryEnabled: ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_ENTRY_ENABLED,
        canonicalExecutorConnected: ORIGINAL_RUNTIME_PROMOTION_PRODUCTION_EXECUTOR_CONNECTED,
        kernelAnchoredPathRaceClosureIntegrated: false,
        evidenceReceiptIssuerIntegrated: false,
        strictAcceptanceEffect: "none",
      },
      kernelAnchoredPathRaceClosure,
      evidenceReceiptIssuerFoundation,
    },
    legacyAdopterBoundary: originalRuntimePromotionBoundary(),
    remainingProductionGates: PROMOTION_REMAINING_GATES,
    externalDependencies: {
      fixedOutOfBandTrustRootInstalled: false,
      perSessionNamedCaptureOperatorAttestationBound: false,
      authorizedRuntimeHostAndContainmentBound: false,
      independentHumanReviewerBound: false,
      ownerRepresentativeBound: false,
      releaseCustodianBound: false,
      independentAppendOnlyOwnerLedgerDurabilityProven: false,
      realShellToRw02CandidateEndToEndQualified: false,
      independentPromotionSecurityReviewComplete: false,
    },
    readiness: {
      state: ledgerReproducibility.allCurrent
        ? "security-suite-passed-production-fail-closed"
        : "security-suite-passed-input-ledger-drift-production-fail-closed",
      inputLedgersReproducible: ledgerReproducibility.allCurrent,
      releaseScopedProjectionCurrent: releaseScopedProjection.current,
      diagnosticVerifierReady: true,
      evidenceReceiptVerifierReady: true,
      productionEntryReadOnlyFoundationPresent: true,
      durableNonceProductionIntegrationPresent: false,
      kernelAnchoredPathRaceClosureProductionReady:
        kernelAnchoredPathRaceClosure.productionReady,
      evidenceReceiptIssuancePreflightFoundationPresent:
        evidenceReceiptIssuerFoundation.capabilities.preconditionEvaluatorPresent,
      promotionV2NativeSecurityDiagnosticCandidateBound:
        Boolean(diagnosticCandidates.promotionV2DarwinNativeSecurity),
      promotionV2NativeSecurityProductionReady: false,
      productionPromotionWriterReady: false,
      productionReceiptIssuerPresent:
        evidenceReceiptIssuerFoundation.productionIssuerPresent,
      capturePromotionDisposition: "pending-candidate-only",
      authoritativeOriginalRuntimeCaptureMayStart: false,
      strictAcceptanceEffect: "none",
    },
    acceptance: {
      authoritativeBaselineAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      releaseAuthorized: false,
      strictCompletionsGrantedByThisReport: 0,
    },
  };
  return {
    schemaVersion: 1,
    reportSha256: sha256(Buffer.from(stableJson(base))),
    ...base,
  };
}

export function renderMarkdown(report) {
  const promotionV2 = report.diagnosticCandidates?.promotionV2DarwinNativeSecurity;
  const promotionV2Line = promotionV2
    ? `- Promotion V2 Darwin native-security child candidate: **${promotionV2.testResult.passed}/${promotionV2.testResult.tests} passed**; state **${promotionV2.state}**; production enabled **${promotionV2.productionEnabled}**; executor connected **${promotionV2.executorConnected}**; writes enabled **${promotionV2.writesEnabled}**; production integrated **${promotionV2.productionIntegrationPresent}**; promotion authority **${promotionV2.promotionAuthority}**.\n`
    : "";
  return `# ${report.releaseId} promotion security readiness\n\n`
    + `${report.authority}\n\n`
    + `- Synthetic security tests: **${report.testResult.passed}/${report.testResult.tests} passed**.\n`
    + `- Production fuses all closed: **${report.productionFuses.allClosed}**.\n`
    + `- Release ledger current: **${report.release.ledgerBindingsCurrent}**; row present: **${report.release.ledgerRowPresent}**.\n`
    + `- Deterministic ledger checks: completion **${report.ledgerReproducibility.completionLedger.current}**, release **${report.ledgerReproducibility.releaseLedger.current}**, all current **${report.ledgerReproducibility.allCurrent}**.\n`
    + `- Release-scoped fresh projection: **${report.releaseScopedProjection.current}** (${report.releaseScopedProjection.reason}); strict **${report.releaseScopedProjection.strictCompleteCount}/${report.release.expectedMemberCount}**.\n`
    + `- Release state: strict **${report.release.strictCompleteCount}/${report.release.expectedMemberCount}**, published **${report.release.published}**.\n`
    + `- Production-entry read-only foundation: **present**; test-only nonce/recovery reference covered **${report.machineFoundations.durableNonceAndTransactionEntry.testOnlyReferenceHarnessCoversNonceOrderingRecoveryAndCrashSemantics}**; production entry enabled **${report.machineFoundations.durableNonceAndTransactionEntry.productionEntryEnabled}**; canonical executor connected **${report.machineFoundations.durableNonceAndTransactionEntry.canonicalExecutorConnected}**.\n`
    + `- Kernel-anchored path-race closure production ready: **${report.machineFoundations.kernelAnchoredPathRaceClosure.productionReady}**; pathname fallback permitted **${report.machineFoundations.kernelAnchoredPathRaceClosure.publicNodeSurface.pathnameFallbackPermitted}**.\n`
    + `- EvidenceReceiptV1 caller-supplied structural preflight: **present**; external cryptographic verification required **${report.machineFoundations.evidenceReceiptIssuerFoundation.externalCryptographicVerificationRequired}**; production issuer present **${report.machineFoundations.evidenceReceiptIssuerFoundation.productionIssuerPresent}**; writes enabled **${report.machineFoundations.evidenceReceiptIssuerFoundation.writesEnabled}**.\n`
    + promotionV2Line
    + `- Generic report I/O hardening: **single-descriptor userspace diagnostic only**; it does not claim kernel-anchored path-race closure.\n`
    + `- Production promotion writer: **not ready**; receipt issuer: **not present**.\n`
    + `- Real Shell-to-RW02 promotion candidate and independent security review: **not complete**.\n\n`
    + `Passing synthetic tests enables diagnostic verification only. It does not authorize original-runtime execution, promotion, review, Owner acceptance, strict completion, or publication.\n\n`
    + `Remaining production gates: ${report.remainingProductionGates.map(({code}) => `\`${code}\``).join(", ")}.\n`;
}

export function parseArguments(argv) {
  const options = {check: false};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (["--release-id", "--workspace-readiness", "--output-prefix"].includes(argument)) {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("--"), `${argument} requires a value`);
      index += 1;
      if (argument === "--release-id") options.releaseId = value;
      else if (argument === "--workspace-readiness") options.workspaceReadinessPath = value;
      else options.outputPrefix = value;
    } else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  if (!options.help) {
    invariant(options.releaseId, "--release-id is required");
    const profile = releaseIoProfile(options.releaseId);
    if (!options.outputPrefix) options.outputPrefix = profile.outputPrefix;
    validateWorkspaceReadinessPath(options.releaseId, options.workspaceReadinessPath);
    validateOutputPrefix(options.releaseId, options.outputPrefix);
  }
  return options;
}

export function usage() {
  return "Usage: node scripts/build-lesson-promotion-security-readiness.mjs --release-id <allowlisted-id> --workspace-readiness <allowlisted-reports.json> [--output-prefix <allowlisted-reports-prefix>] [--check]";
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const outputTargets = await inspectReportOutputSafety({
    releaseId: options.releaseId,
    outputPrefix: options.outputPrefix,
  });
  const report = await buildReport(options);
  const json = stableJson(report);
  const markdown = renderMarkdown(report);
  const jsonTarget = outputTargets.find(({kind}) => kind === "json");
  const markdownTarget = outputTargets.find(({kind}) => kind === "markdown");
  if (options.check) {
    const [currentJson, currentMarkdown] = await Promise.all([
      readVerifiedOutput(jsonTarget),
      readVerifiedOutput(markdownTarget),
    ]);
    invariant(currentJson === json && currentMarkdown === markdown, "Lesson promotion security readiness report is stale");
    process.stdout.write(`PASS: ${report.testResult.passed}/${report.testResult.tests}; production promotion disabled\n`);
    return;
  }
  await Promise.all([
    writeVerifiedOutput(jsonTarget, json),
    writeVerifiedOutput(markdownTarget, markdown),
  ]);
  process.stdout.write(`WROTE: ${report.testResult.passed}/${report.testResult.tests}; production promotion disabled\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    process.stderr.write(`${safeDiagnosticError(error)}\n`);
    process.exitCode = 1;
  });
}
