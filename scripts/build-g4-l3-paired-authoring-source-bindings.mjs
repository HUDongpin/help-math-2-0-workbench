#!/usr/bin/env node

import {createHash} from "node:crypto";
import {lstat, readFile, readdir, realpath} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  assertSafeReportOutput as assertSharedSafeReportOutput,
  writeOrCheckReport as writeSharedOrCheckReport,
} from "./build-g4-l3-machine-source-audits.mjs";

const GENERATOR_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(GENERATOR_PATH), "..");
const REPORT_BASENAME = "g4-l3-paired-authoring-source-bindings";
const DEFAULT_JSON = path.join(ROOT, "reports", `${REPORT_BASENAME}.json`);
const DEFAULT_MARKDOWN = path.join(ROOT, "reports", `${REPORT_BASENAME}.md`);
const RUNNER = "scripts/run-assisted-animate-authoring-audit.mjs";
const EVIDENCE_ROOT = "work/animate/dependency-authoring-audits";
const BATCH_REPORTS = Object.freeze([
  "reports/g4-l3-batch-001-specification-readiness.json",
  "reports/g4-l3-batch-002-specification-readiness.json",
]);
const AUTHORING_INDEX = "reports/g4-l3-animate-authoring-audit-index.json";
const SHA256 = /^[a-f0-9]{64}$/;
const SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/";
const AUDIT_PRECONDITIONS = Object.freeze([
  "No Adobe Animate process is already running.",
  "The named human is present at an unlocked screen for the entire bounded run.",
  "The human may acknowledge only the legacy ActionScript conversion warning popup.",
  "Do not save, publish, export, or acknowledge any other dialog.",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertRegularReportTarget(filePath, label = "Report output") {
  const information = await lstat(path.resolve(filePath))
    .catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  invariant(!information || information.isFile() || information.isSymbolicLink(),
    `${label} must be missing or an existing regular file`);
}

export async function assertSafeReportOutput(filePath, options = {}) {
  await assertRegularReportTarget(filePath);
  return assertSharedSafeReportOutput(filePath, options);
}

export async function writeOrCheckReport(filePath, expected, options = {}) {
  await assertRegularReportTarget(filePath);
  return writeSharedOrCheckReport(filePath, expected, options);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(file) {
  const relative = path.relative(ROOT, file).split(path.sep).join("/");
  invariant(relative && !relative.startsWith("../") && !path.isAbsolute(relative), `${file} escapes the project root`);
  return relative;
}

async function binding(file) {
  const bytes = await readFile(file);
  return {file: portable(file), sha256: sha256(bytes), bytes: bytes.length};
}

async function json(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function assertPlainDirectory(file, label) {
  const info = await lstat(file);
  invariant(info.isDirectory() && !info.isSymbolicLink(), `${label} must be a plain directory`);
  const resolved = await realpath(file);
  invariant(resolved === file, `${label} contains a symbolic-link path component`);
}

async function fileIdentity(file, label, {readOnly = false} = {}) {
  const info = await lstat(file);
  invariant(info.isFile() && !info.isSymbolicLink(), `${label} must be a regular non-symbolic-link file`);
  const resolved = await realpath(file);
  invariant(resolved === file, `${label} contains a symbolic-link path component`);
  if (readOnly) invariant((info.mode & 0o777) === 0o444, `${label} mode must be exactly 0444`);
  const bytes = await readFile(file);
  return {
    file: portable(file),
    sha256: sha256(bytes),
    bytes: bytes.length,
    mode: (info.mode & 0o777).toString(8).padStart(4, "0"),
    nlink: info.nlink,
    dev: info.dev,
    ino: info.ino,
  };
}

async function recursiveFiles(root) {
  const result = [];
  async function walk(current) {
    for (const entry of await readdir(current, {withFileTypes: true})) {
      const file = path.join(current, entry.name);
      invariant(!entry.isSymbolicLink(), `${portable(file)} must not be a symbolic link`);
      if (entry.isDirectory()) await walk(file);
      else {
        invariant(entry.isFile(), `${portable(file)} is not a regular file`);
        result.push(portable(file));
      }
    }
  }
  await walk(root);
  return result.sort();
}

function exactJson(value) {
  return JSON.stringify(value);
}

function hasExactKeys(value, keys) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    && exactJson(Object.keys(value).sort()) === exactJson([...keys].sort());
}

function isSafeRelativeFile(value) {
  return typeof value === "string" && value.length > 0 && !value.includes("\\")
    && !path.posix.isAbsolute(value) && path.posix.normalize(value) === value
    && value !== ".." && !value.startsWith("../");
}

function validIdentity(record, keys) {
  return hasExactKeys(record, keys) && isSafeRelativeFile(record.file)
    && Number.isSafeInteger(record.bytes) && record.bytes > 0 && SHA256.test(record.sha256);
}

function derivedPreparationSummary(items) {
  const sum = (selector) => items.reduce((total, item) => total + selector(item), 0);
  const preparedRecords = items.flatMap((item) => [
    item.prepared.sourceBinding,
    item.prepared.fla,
    item.prepared.swf,
  ]);
  return {
    expectedBindings: items.length,
    verifiedBindings: items.length,
    preparedPhysicalFileCount: sum((item) => item.prepared.exactTreeFileCount),
    exactMode0444FileCount: preparedRecords.filter((record) => record.mode === "0444").length,
    sourceFlaBytes: sum((item) => item.source.fla.bytes),
    sourceSwfBytes: sum((item) => item.source.swf.bytes),
    preparedFlaBytes: sum((item) => item.prepared.fla.bytes),
    preparedSwfBytes: sum((item) => item.prepared.swf.bytes),
    runArtifactFiles: sum((item) => item.prepared.runArtifactFileCount),
  };
}

function expectedAuthoringAuditArgv(item) {
  const flaPath = item.source.fla.path || item.source.fla.file;
  const swfPath = item.source.swf.path || item.source.swf.file;
  return [
    "node",
    RUNNER,
    "--dependency-fla",
    flaPath,
    "--evidence-id",
    item.animationId,
    "--source-sha256",
    item.source.fla.sha256,
    "--paired-swf",
    swfPath,
    "--paired-swf-sha256",
    item.source.swf.sha256,
    "--dialog-operator",
    "Dr. Peter Hu",
  ];
}

function expectedCards(batchReports) {
  const cards = batchReports.flatMap((report) => report.cards.map((card) => ({
    ...card,
    batchId: report.batch.batchId,
  }))).filter((card) => card.source?.sourceKind === "fla+swf");
  invariant(cards.length === 29, `Expected 29 G4 L3 FLA-backed cards, found ${cards.length}`);
  invariant(new Set(cards.map((card) => card.animationId)).size === 29, "G4 L3 paired-source IDs are not unique");
  return cards;
}

async function verifyCard(card, authoringItem) {
  const evidenceRoot = path.join(ROOT, EVIDENCE_ROOT, card.animationId);
  const workingRoot = path.join(evidenceRoot, "working-copy");
  const runtimeRoot = path.join(evidenceRoot, "runtime-source");
  const runsRoot = path.join(evidenceRoot, "runs");
  await assertPlainDirectory(evidenceRoot, `${card.animationId}: evidence root`);
  await assertPlainDirectory(workingRoot, `${card.animationId}: working-copy root`);
  await assertPlainDirectory(runtimeRoot, `${card.animationId}: runtime-source root`);
  await assertPlainDirectory(runsRoot, `${card.animationId}: runs root`);

  const bindingFile = path.join(evidenceRoot, "source-binding.json");
  const sourceBinding = await json(bindingFile);
  const fla = card.source.fla;
  const swf = card.source.swf;
  const workingFla = path.join(ROOT, sourceBinding.workingCopy?.file || "");
  const workingSwf = path.join(ROOT, sourceBinding.shippedSwf?.workingCopy?.file || "");
  const sourceFla = path.join(ROOT, fla.path);
  const sourceSwf = path.join(ROOT, swf.path);
  const [bindingIdentity, sourceFlaIdentity, sourceSwfIdentity, workingFlaIdentity, workingSwfIdentity] =
    await Promise.all([
      fileIdentity(bindingFile, `${card.animationId}: source binding`, {readOnly: true}),
      fileIdentity(sourceFla, `${card.animationId}: source FLA`),
      fileIdentity(sourceSwf, `${card.animationId}: source SWF`),
      fileIdentity(workingFla, `${card.animationId}: working FLA`, {readOnly: true}),
      fileIdentity(workingSwf, `${card.animationId}: working SWF`, {readOnly: true}),
    ]);

  invariant(sourceBinding.schemaVersion === 1
    && sourceBinding.evidenceKind === "adobe-animate-read-only-paired-fla-swf-binding"
    && sourceBinding.evidenceId === card.animationId
    && sourceBinding.sourceKind === "paired-fla-swf",
  `${card.animationId}: paired-source binding identity drifted`);
  invariant(sourceBinding.acceptanceEffect === "none; work-only authoring evidence preparation",
    `${card.animationId}: source binding promoted acceptance`);
  invariant(sourceBinding.intendedAudit?.captureFrame === 1
    && sourceBinding.intendedAudit?.recursiveRootAndLibraryTimelines === true
    && sourceBinding.intendedAudit?.frameAndInstanceScriptInventory === true
    && sourceBinding.intendedAudit?.nativeStagePng === true
    && sourceBinding.intendedAudit?.saveOrPublishAllowed === false,
  `${card.animationId}: intended audit contract drifted`);
  invariant(sourceBinding.generatedBy?.file === RUNNER
    && SHA256.test(sourceBinding.generatedBy?.sha256 || ""),
  `${card.animationId}: source binding historical runner provenance is invalid`);
  invariant(sourceBinding.source?.file === fla.path
    && sourceBinding.source?.sha256 === fla.sha256
    && sourceBinding.source?.bytes === fla.bytes,
  `${card.animationId}: source FLA binding differs from the batch card`);
  invariant(sourceBinding.shippedSwf?.source?.file === swf.path
    && sourceBinding.shippedSwf?.source?.sha256 === swf.sha256
    && sourceBinding.shippedSwf?.source?.bytes === swf.bytes,
  `${card.animationId}: source SWF binding differs from the batch card`);
  invariant(sourceFlaIdentity.sha256 === fla.sha256 && sourceFlaIdentity.bytes === fla.bytes,
    `${card.animationId}: physical source FLA drifted`);
  invariant(sourceSwfIdentity.sha256 === swf.sha256 && sourceSwfIdentity.bytes === swf.bytes,
    `${card.animationId}: physical source SWF drifted`);
  invariant(workingFlaIdentity.sha256 === fla.sha256 && workingFlaIdentity.bytes === fla.bytes,
    `${card.animationId}: working FLA is not byte-identical`);
  invariant(workingSwfIdentity.sha256 === swf.sha256 && workingSwfIdentity.bytes === swf.bytes,
    `${card.animationId}: working SWF is not byte-identical`);
  invariant(authoringItem?.animationId === card.animationId
    && authoringItem.status === "verified-work-only-authoring-audit"
    && authoringItem.sourcePair?.bothSourceFilesReverified === true
    && authoringItem.sourcePair?.shippedSwfExecutedByTheseAudits === false
    && authoringItem.sourcePair?.flaSwfEquivalenceProven === false,
  `${card.animationId}: completed authoring-audit index binding is invalid`);
  invariant(workingFlaIdentity.nlink === 1 && workingSwfIdentity.nlink === 1 && bindingIdentity.nlink === 1,
    `${card.animationId}: a prepared file has an unexpected hard-link count`);
  invariant(workingFlaIdentity.dev !== sourceFlaIdentity.dev || workingFlaIdentity.ino !== sourceFlaIdentity.ino,
    `${card.animationId}: working FLA aliases its source inode`);
  invariant(workingSwfIdentity.dev !== sourceSwfIdentity.dev || workingSwfIdentity.ino !== sourceSwfIdentity.ino,
    `${card.animationId}: working SWF aliases its source inode`);
  invariant(sourceBinding.workingCopy?.file === workingFlaIdentity.file
    && sourceBinding.workingCopy?.sha256 === workingFlaIdentity.sha256
    && sourceBinding.workingCopy?.bytes === workingFlaIdentity.bytes
    && sourceBinding.workingCopy?.mode === "0444"
    && sourceBinding.workingCopy?.readOnly === true
    && sourceBinding.workingCopy?.byteIdenticalToSource === true
    && sourceBinding.workingCopy?.separateRegularFile === true,
  `${card.animationId}: working FLA descriptor drifted`);
  invariant(sourceBinding.shippedSwf?.workingCopy?.file === workingSwfIdentity.file
    && sourceBinding.shippedSwf?.workingCopy?.sha256 === workingSwfIdentity.sha256
    && sourceBinding.shippedSwf?.workingCopy?.bytes === workingSwfIdentity.bytes
    && sourceBinding.shippedSwf?.workingCopy?.mode === "0444"
    && sourceBinding.shippedSwf?.workingCopy?.readOnly === true
    && sourceBinding.shippedSwf?.workingCopy?.byteIdenticalToSource === true
    && sourceBinding.shippedSwf?.workingCopy?.separateRegularFile === true,
  `${card.animationId}: working SWF descriptor drifted`);

  const expectedFiles = [bindingIdentity.file, workingFlaIdentity.file, workingSwfIdentity.file].sort();
  const actualFiles = await recursiveFiles(evidenceRoot);
  invariant(expectedFiles.every((file) => actualFiles.includes(file)),
    `${card.animationId}: prepared evidence tree is missing a core binding file`);
  const runPrefix = `${EVIDENCE_ROOT}/${card.animationId}/runs/`;
  const runFiles = actualFiles.filter((file) => !expectedFiles.includes(file));
  invariant(runFiles.length > 0 && runFiles.every((file) => file.startsWith(runPrefix)),
    `${card.animationId}: prepared evidence tree contains an unexpected non-run file`);

  invariant(card.workOnlyAuthoringAudit?.status === "verified-work-only-authoring-audit"
    && card.workOnlyAuthoringAudit?.designatedDialogOperator === "Dr. Peter Hu"
    && card.workOnlyAuthoringAudit?.sourcePairReverified === true
    && card.workOnlyAuthoringAudit?.sourceSwfExecuted === false
    && card.workOnlyAuthoringAudit?.provesFlaSwfEquivalence === false
    && card.workOnlyAuthoringAudit?.originalRuntimeBehaviorEstablished === false
    && card.workOnlyAuthoringAudit?.authoringAccepted === false
    && card.workOnlyAuthoringAudit?.strictAcceptanceEffect === false,
  `${card.animationId}: completed work-only authoring card exceeds its authority`);
  const boundedRerunCommand = {
    argv: expectedAuthoringAuditArgv({animationId: card.animationId, source: {fla, swf}}),
    preconditions: AUDIT_PRECONDITIONS,
    dialogAutomationAllowed: false,
    sourceSwfExecuted: false,
    strictAcceptanceEffect: false,
  };

  return {
    sequence: card.sequence,
    batchId: card.batchId,
    animationId: card.animationId,
    source: {
      fla: {file: fla.path, sha256: fla.sha256, bytes: fla.bytes},
      swf: {file: swf.path, sha256: swf.sha256, bytes: swf.bytes},
    },
    prepared: {
      sourceBinding: {file: bindingIdentity.file, sha256: bindingIdentity.sha256, bytes: bindingIdentity.bytes, mode: "0444"},
      sourceBindingGenerator: {...sourceBinding.generatedBy},
      fla: {file: workingFlaIdentity.file, sha256: workingFlaIdentity.sha256, bytes: workingFlaIdentity.bytes, mode: "0444"},
      swf: {file: workingSwfIdentity.file, sha256: workingSwfIdentity.sha256, bytes: workingSwfIdentity.bytes, mode: "0444"},
      exactTreeFileCount: expectedFiles.length,
      coreBindingFileCount: expectedFiles.length,
      totalEvidenceFileCount: actualFiles.length,
      runArtifactFileCount: runFiles.length,
    },
    observedAuthoringAudit: {
      status: authoringItem.status,
      attemptCount: authoringItem.attempts.length,
      passedAttemptCount: authoringItem.attempts.filter((attempt) => attempt.status === "passed").length,
      failedAttemptCount: authoringItem.attempts.filter((attempt) => attempt.status === "failed").length,
      originalRuntimeBaselineEstablished: false,
      acceptanceEffect: false,
    },
    boundedRerunCommand,
  };
}

export async function buildPairedAuthoringSourceBindingsReport() {
  const batchFiles = BATCH_REPORTS.map((file) => path.join(ROOT, file));
  const [batchReports, batchBindings, runnerBinding, generatorBinding,
    authoringIndex, authoringIndexBinding] = await Promise.all([
    Promise.all(batchFiles.map(json)),
    Promise.all(batchFiles.map(binding)),
    binding(path.join(ROOT, RUNNER)),
    binding(GENERATOR_PATH),
    json(path.join(ROOT, AUTHORING_INDEX)),
    binding(path.join(ROOT, AUTHORING_INDEX)),
  ]);
  const cards = expectedCards(batchReports);
  invariant(authoringIndex.summary?.verifiedWorkOnlyAuthoringAudits === 29
    && authoringIndex.summary?.pendingAuthoringAudits === 0
    && authoringIndex.summary?.authoringCoverageComplete === true
    && authoringIndex.summary?.originalRuntimeBaselinesEstablished === 0
    && authoringIndex.summary?.strictAcceptancesEstablished === 0,
  "G4 L3 authoring-audit index is incomplete or exceeds work-only authority");
  const authoringById = new Map(authoringIndex.items.map((item) => [item.animationId, item]));
  const items = [];
  for (const card of cards) items.push(await verifyCard(card, authoringById.get(card.animationId)));
  items.sort((a, b) => a.sequence - b.sequence);
  invariant(items[0].sequence === 1 && items.at(-1).sequence === 39,
    "Paired-source preparation no longer spans the expected G4 L3 lesson order");
  const historicalRunnerHashes = new Set(
    items.map((item) => item.prepared.sourceBindingGenerator.sha256),
  );
  invariant(historicalRunnerHashes.size === 1,
    "Paired-source bindings no longer share one historical preparation runner");
  const historicalRunner = {
    file: RUNNER,
    sha256: [...historicalRunnerHashes][0],
  };

  const sum = (selector) => items.reduce((total, item) => total + selector(item), 0);
  return {
    schemaVersion: 1,
    reportType: REPORT_BASENAME,
    generator: generatorBinding,
    scope: {
      grade: 4,
      lesson: 3,
      titleRaw: "Negative Numbers",
      activePageCount: 39,
      courseShellCount: 1,
      flaBackedPageCount: 29,
      sourceKind: "paired-fla-swf",
    },
    authorityBoundary: {
      acceptanceNeutral: true,
      prepareOnly: false,
      animateLaunchedByPreparation: false,
      popupAcknowledgedByPreparation: false,
      sourceSwfExecuted: false,
      flaSwfEquivalenceProved: false,
      authoringAuditProved: true,
      originalRuntimeBaselineProved: false,
      migrationOrApprovalWrites: false,
      strictAcceptanceEffect: false,
    },
    inputBindings: {
      batchSpecificationReadiness: batchBindings,
      animateAuthoringAuditIndex: authoringIndexBinding,
      pairedSourceRunner: runnerBinding,
      historicalPairedSourcePreparationRunner: historicalRunner,
      preparationRunnerIsCurrent: historicalRunner.sha256 === runnerBinding.sha256,
    },
    summary: {
      expectedBindings: 29,
      verifiedBindings: items.length,
      preparedPhysicalFileCount: sum((item) => item.prepared.exactTreeFileCount),
      exactMode0444FileCount: sum((item) => item.prepared.coreBindingFileCount),
      sourceFlaBytes: sum((item) => item.source.fla.bytes),
      sourceSwfBytes: sum((item) => item.source.swf.bytes),
      preparedFlaBytes: sum((item) => item.prepared.fla.bytes),
      preparedSwfBytes: sum((item) => item.prepared.swf.bytes),
      runArtifactFiles: sum((item) => item.prepared.runArtifactFileCount),
      animateAuditAttemptsRecorded: authoringIndex.summary.totalAttemptReceipts,
      animateGuiExecutionsRecordedByThesePreparedTrees: authoringIndex.summary.totalAttemptReceipts,
      authoringAuditsCompleted: authoringIndex.summary.verifiedWorkOnlyAuthoringAudits,
      humanDialogActionsRecorded: 0,
      implementationAuthorizations: 0,
      strictComplete: 0,
    },
    items,
    acceptance: {
      pairedSourceBindingsReady: true,
      namedHumanDialogStepStillRequired: false,
      authoringEvidenceReady: true,
      authoritativeRuntimeReady: false,
      implementationAuthorized: false,
      strictMigrationComplete: false,
      statement: "All 29 paired FLA/SWF runner source bindings and 29 work-only Animate authoring audits are physically verified. No shipped SWF runtime baseline, implementation authorization, human visual review, owner acceptance, strict acceptance, or migration completion is claimed.",
    },
  };
}

export function validatePairedAuthoringSourceBindingsReport(report) {
  invariant(report?.schemaVersion === 1 && report?.reportType === REPORT_BASENAME,
    "Unexpected G4 L3 paired-source preparation schema");
  invariant(report.scope?.flaBackedPageCount === 29 && report.items?.length === 29,
    "G4 L3 paired-source preparation must contain exactly 29 items");
  for (const field of ["humanDialogActionsRecorded", "implementationAuthorizations", "strictComplete"]) {
    invariant(report.summary?.[field] === 0, `G4 L3 paired-source preparation field ${field} must remain zero`);
  }
  invariant(report.summary?.animateAuditAttemptsRecorded >= 29
    && report.summary?.animateGuiExecutionsRecordedByThesePreparedTrees ===
      report.summary.animateAuditAttemptsRecorded
    && report.summary?.authoringAuditsCompleted === 29,
  "G4 L3 work-only authoring-audit coverage is incomplete");
  const boundary = report.authorityBoundary;
  invariant(boundary?.acceptanceNeutral === true && boundary?.prepareOnly === false
    && boundary?.animateLaunchedByPreparation === false && boundary?.popupAcknowledgedByPreparation === false
    && boundary?.sourceSwfExecuted === false && boundary?.flaSwfEquivalenceProved === false
    && boundary?.authoringAuditProved === true && boundary?.originalRuntimeBaselineProved === false
    && boundary?.migrationOrApprovalWrites === false && boundary?.strictAcceptanceEffect === false,
  "G4 L3 paired-source preparation authority boundary was promoted");
  invariant(report.acceptance?.pairedSourceBindingsReady === true
    && report.acceptance?.namedHumanDialogStepStillRequired === false
    && report.acceptance?.authoringEvidenceReady === true
    && report.acceptance?.authoritativeRuntimeReady === false
    && report.acceptance?.implementationAuthorized === false
    && report.acceptance?.strictMigrationComplete === false,
  "G4 L3 paired-source preparation acceptance state drifted");
  invariant(new Set(report.items.map((item) => item.animationId)).size === 29,
    "G4 L3 paired-source report contains duplicate animation IDs");
  for (const item of report.items) {
    invariant(validIdentity(item.source?.fla, ["file", "sha256", "bytes"])
      && validIdentity(item.source?.swf, ["file", "sha256", "bytes"])
      && item.source.fla.file.startsWith(SOURCE_PREFIX) && item.source.swf.file.startsWith(SOURCE_PREFIX)
      && path.posix.extname(item.source.fla.file) === ".fla" && path.posix.extname(item.source.swf.file) === ".swf"
      && path.posix.basename(item.source.fla.file, ".fla") === path.posix.basename(item.source.swf.file, ".swf"),
    `${item.animationId}: source identity shape is invalid`);
    invariant(validIdentity(item.prepared?.sourceBinding, ["file", "sha256", "bytes", "mode"])
      && validIdentity(item.prepared?.fla, ["file", "sha256", "bytes", "mode"])
      && validIdentity(item.prepared?.swf, ["file", "sha256", "bytes", "mode"]),
    `${item.animationId}: prepared identity shape is invalid`);
    invariant(item.prepared.sourceBindingGenerator?.file === RUNNER
      && SHA256.test(item.prepared.sourceBindingGenerator?.sha256 || "")
      && item.prepared.sourceBindingGenerator.sha256 ===
        report.inputBindings?.historicalPairedSourcePreparationRunner?.sha256,
    `${item.animationId}: historical preparation runner binding is invalid`);
    const itemRoot = `${EVIDENCE_ROOT}/${item.animationId}`;
    invariant(item.prepared.sourceBinding.file === `${itemRoot}/source-binding.json`
      && item.prepared.fla.file === `${itemRoot}/working-copy/${path.posix.basename(item.source.fla.file)}`
      && item.prepared.swf.file === `${itemRoot}/runtime-source/${path.posix.basename(item.source.swf.file)}`,
    `${item.animationId}: prepared path binding is invalid`);
    invariant(item.prepared.sourceBinding.mode === "0444" && item.prepared.fla.mode === "0444"
      && item.prepared.swf.mode === "0444" && item.prepared.exactTreeFileCount === 3
      && item.prepared.coreBindingFileCount === 3
      && item.prepared.totalEvidenceFileCount === 3 + item.prepared.runArtifactFileCount
      && item.prepared.runArtifactFileCount > 0,
    `${item.animationId}: prepared tree count or mode is invalid`);
    invariant(item.observedAuthoringAudit?.status === "verified-work-only-authoring-audit"
      && item.observedAuthoringAudit?.attemptCount >= 1
      && item.observedAuthoringAudit?.passedAttemptCount >= 1
      && item.observedAuthoringAudit?.passedAttemptCount +
        item.observedAuthoringAudit?.failedAttemptCount === item.observedAuthoringAudit?.attemptCount
      && item.observedAuthoringAudit?.originalRuntimeBaselineEstablished === false
      && item.observedAuthoringAudit?.acceptanceEffect === false,
    `${item.animationId}: observed authoring-audit boundary is invalid`);
    invariant(item.prepared.fla.sha256 === item.source.fla.sha256
      && item.prepared.fla.bytes === item.source.fla.bytes
      && item.prepared.swf.sha256 === item.source.swf.sha256
      && item.prepared.swf.bytes === item.source.swf.bytes,
    `${item.animationId}: prepared FLA/SWF identity differs from its source`);
    invariant(item.boundedRerunCommand?.dialogAutomationAllowed === false
      && item.boundedRerunCommand?.sourceSwfExecuted === false
      && item.boundedRerunCommand?.strictAcceptanceEffect === false
      && exactJson(item.boundedRerunCommand?.argv) === exactJson(expectedAuthoringAuditArgv(item))
      && exactJson(item.boundedRerunCommand?.preconditions) === exactJson(AUDIT_PRECONDITIONS),
    `${item.animationId}: bounded rerun command exceeds the no-save/no-publish boundary`);
  }
  const derived = derivedPreparationSummary(report.items);
  for (const [field, value] of Object.entries(derived)) {
    invariant(report.summary?.[field] === value, `G4 L3 paired-source preparation summary field ${field} is stale`);
  }
  invariant(derived.expectedBindings === 29 && derived.verifiedBindings === 29
    && derived.preparedPhysicalFileCount === 87 && derived.exactMode0444FileCount === 87
    && derived.sourceFlaBytes === 59_227_648 && derived.sourceSwfBytes === 4_916_334
    && derived.preparedFlaBytes === derived.sourceFlaBytes && derived.preparedSwfBytes === derived.sourceSwfBytes
    && derived.runArtifactFiles > 0
    && report.summary.authoringAuditsCompleted === 29,
  "G4 L3 paired-source preparation derived totals changed");
  return report;
}

export function renderMarkdown(report) {
  const rows = report.items.map((item) =>
    `| ${item.sequence} | ${item.batchId} | \`${item.animationId}\` | \`${item.prepared.sourceBinding.sha256}\` | ${item.prepared.runArtifactFileCount} | completed-work-only |`);
  return [
    "# G4 L3 paired FLA/SWF authoring source bindings",
    "",
    "> Acceptance-neutral evidence for immutable paired-source preparation plus completed work-only Animate authoring audits. It does not establish original runtime behavior or migration acceptance.",
    "",
    "## Result",
    "",
    `- Verified paired bindings: **${report.summary.verifiedBindings}/${report.summary.expectedBindings}**.`,
    `- Exact read-only prepared files: **${report.summary.exactMode0444FileCount}** (29 bindings + 29 FLA copies + 29 SWF copies).`,
    `- Prepared FLA bytes: **${report.summary.preparedFlaBytes}**; prepared SWF bytes: **${report.summary.preparedSwfBytes}**.`,
    `- Run artifacts: **${report.summary.runArtifactFiles}**; work-only authoring audits completed: **${report.summary.authoringAuditsCompleted}**.`,
    "- Any future rerun command remains one cold-start FLA at a time and requires Dr. Peter Hu at an unlocked screen to acknowledge only the legacy conversion warning.",
    "",
    "| Lesson order | Batch | Animation | Source-binding SHA-256 | Run artifacts | Authoring audit |",
    "|---:|---|---|---|---:|---|",
    ...rows,
    "",
    "## Boundary",
    "",
    report.acceptance.statement,
    "",
  ].join("\n");
}

export function parseArguments(argv) {
  const options = {check: false, jsonOutput: DEFAULT_JSON, markdownOutput: DEFAULT_MARKDOWN};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--json-output") options.jsonOutput = path.resolve(argv[++index] || invariant(false, "--json-output requires a path"));
    else if (argument === "--markdown-output") options.markdownOutput = path.resolve(argv[++index] || invariant(false, "--markdown-output requires a path"));
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("node scripts/build-g4-l3-paired-authoring-source-bindings.mjs [--check] [--json-output <path>] [--markdown-output <path>]\n");
    return;
  }
  await Promise.all([
    assertSafeReportOutput(options.jsonOutput, {root: ROOT, extension: ".json"}),
    assertSafeReportOutput(options.markdownOutput, {root: ROOT, extension: ".md"}),
  ]);
  const report = validatePairedAuthoringSourceBindingsReport(await buildPairedAuthoringSourceBindingsReport());
  const jsonBytes = `${JSON.stringify(report, null, 2)}\n`;
  const markdownBytes = `${renderMarkdown(report)}\n`;
  await Promise.all([
    writeOrCheckReport(options.jsonOutput, jsonBytes, {root: ROOT, extension: ".json", check: options.check}),
    writeOrCheckReport(options.markdownOutput, markdownBytes, {root: ROOT, extension: ".md", check: options.check}),
  ]);
  process.stdout.write(`${options.check ? "PASS" : "WROTE"}: 29/29 G4 L3 paired FLA/SWF source bindings `
    + `and completed work-only authoring audits; original-runtime and acceptance effects none\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === GENERATOR_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
