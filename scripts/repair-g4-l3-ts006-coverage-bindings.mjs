#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {chmod, copyFile, lstat, mkdir, readFile, realpath, rename, stat, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  buildExpectedPendingCoverageDocuments,
  canonicalAcceptanceNeutralBlockingEvidence,
  canonicalJson,
  TS006_ANIMATION_ID,
} from "./materialize-g4-l3-valid-pending-root-coverage.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const workspaceRelative = `migrations/${TS006_ANIMATION_ID}`;
const migrationPath = `${workspaceRelative}/migration.json`;
const coveragePath = `${workspaceRelative}/evidence/full-frame-coverage.json`;
const scenarioInventoryPath = `${workspaceRelative}/audit/scenario-inventory.json`;
const runtimeContractPath = "reports/g4-l3-authoritative-runtime-acquisition-contract.json";
const reportPath = "reports/g4-l3-ts006-coverage-binding-repair.json";
const markdownPath = "reports/g4-l3-ts006-coverage-binding-repair.md";
const SHA256 = /^[a-f0-9]{64}$/;
const ALLOWED_REPAIR_FIELDS = Object.freeze([
  "entryState",
  "entryStateSha256",
  "blockingReason",
  "capturedFrameCount",
  "missingFrames",
  "captureManifest",
  "captureManifestSha256",
  "blockingEvidence",
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sameJson(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function inside(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

async function exactProjectFile(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath),
    `${relativePath}: expected a project-relative file`);
  const lexical = path.resolve(projectRoot, relativePath);
  invariant(inside(lexical, projectRoot), `${relativePath}: escapes the project root`);
  const info = await lstat(lexical);
  invariant(!info.isSymbolicLink() && info.isFile(), `${relativePath}: must be a regular non-symlink file`);
  const [actualRoot, actual] = await Promise.all([realpath(projectRoot), realpath(lexical)]);
  invariant(inside(actual, actualRoot), `${relativePath}: resolves outside the project root`);
  const actualInfo = await stat(actual);
  invariant(actualInfo.isFile(), `${relativePath}: resolved target is not a file`);
  const bytes = await readFile(actual);
  return {
    path: portable(relativePath),
    bytes,
    record: {path: portable(relativePath), bytes: bytes.length, sha256: digest(bytes)},
  };
}

function withoutAllowedRepairFields(requirement) {
  const projection = structuredClone(requirement);
  for (const key of ALLOWED_REPAIR_FIELDS) delete projection[key];
  return projection;
}

function legacyFalseFieldPreimage(expected) {
  const entryState = structuredClone(expected.entryState);
  delete entryState.authoritativeTraceExecuted;
  if (expected.frameDomainId !== "root") delete entryState.runtimeReachabilityEstablished;
  return entryState;
}

function hasImplementationCapture(requirement) {
  return requirement.capturedFrameCount !== 0
    || requirement.captureManifest !== ""
    || requirement.captureManifestSha256 !== "";
}

function validateCaptureManifestDocument({document, expected, captureManifest, captureManifestSha256}) {
  invariant(document?.schemaVersion === 4
    && document.status === "complete"
    && document.animationId === TS006_ANIMATION_ID
    && document.requirementId === expected.requirementId
    && document.frameDomainId === expected.frameDomainId
    && document.traceId === expected.traceId
    && document.entryStateSha256 === expected.entryStateSha256
    && document.scenario === expected.scenario
    && document.language === expected.language
    && String(document.seed) === String(expected.seed)
    && Array.isArray(document.captured)
    && document.captured.length === expected.requiredRange.lastFrame - expected.requiredRange.firstFrame + 1
    && Array.isArray(document.consoleErrors) && document.consoleErrors.length === 0
    && Array.isArray(document.failedRequests) && document.failedRequests.length === 0
    && Array.isArray(document.httpErrors) && document.httpErrors.length === 0
    && Array.isArray(document.unexpectedRequests) && document.unexpectedRequests.length === 0
    && document.error === null,
  `${expected.requirementId}: current-JavaScript capture manifest is incomplete, stale, or promoted`);
  invariant(typeof captureManifest === "string" && captureManifest.startsWith("output/playwright/")
    && SHA256.test(captureManifestSha256),
  `${expected.requirementId}: current-JavaScript capture binding is malformed`);
}

function validateCaptureOverlay({current, expected, manifest, adoption, captureArtifacts}) {
  const requiredFrameCount = expected.requiredRange.lastFrame - expected.requiredRange.firstFrame + 1;
  invariant(current.status === "pending"
    && current.baselineAuthority === "unresolved"
    && current.baselineCaptureManifest === ""
    && current.baselineCaptureManifestSha256 === ""
    && current.metricsFile === ""
    && current.metricsSha256 === ""
    && current.capturedFrameCount === requiredFrameCount
    && Array.isArray(current.missingFrames) && current.missingFrames.length === 0
    && typeof current.blockingReason === "string" && current.blockingReason.length > 0,
  `${expected.requirementId}: implementation capture is incomplete or overclaims authority`);
  const candidate = (manifest.evidence?.candidateCaptureManifests || [])
    .find(({requirementId}) => requirementId === expected.requirementId);
  invariant(candidate
    && candidate.frameDomainId === expected.frameDomainId
    && candidate.traceId === expected.traceId
    && candidate.entryStateSha256 === expected.entryStateSha256
    && candidate.scenario === expected.scenario
    && candidate.language === expected.language
    && String(candidate.seed) === String(expected.seed)
    && candidate.path === current.captureManifest
    && candidate.sha256 === current.captureManifestSha256
    && candidate.frames === requiredFrameCount
    && candidate.authority === "non-authoritative-current-javascript-output"
    && ["none", "implementation-capture-only"].includes(candidate.strictAcceptanceEffect),
  `${expected.requirementId}: migration candidate capture binding is missing, stale, or promoted`);
  const adopted = adoption.requirements?.find(({requirementId}) => requirementId === expected.requirementId);
  invariant(adoption.schemaVersion === 1
    && adoption.evidenceType === "current-javascript-implementation-capture-adoption"
    && adoption.animationId === TS006_ANIMATION_ID
    && adoption.status === "partial-non-authoritative-implementation-capture"
    && String(adoption.authority).startsWith("Deterministic current JavaScript output only.")
    && adoption.strictAcceptanceEffect === "none"
    && adoption.summary?.validationErrors === 0
    && adopted?.frameDomainId === expected.frameDomainId
    && adopted.traceId === expected.traceId
    && adopted.entryStateSha256 === expected.entryStateSha256
    && adopted.scenario === expected.scenario
    && adopted.language === expected.language
    && String(adopted.seed) === String(expected.seed)
    && adopted.captureManifest?.path === current.captureManifest
    && adopted.captureManifest?.sha256 === current.captureManifestSha256
    && adopted.capturedFrameCount === requiredFrameCount
    && adopted.result === "validated-current-javascript-output-only",
  `${expected.requirementId}: current-JavaScript adoption record is missing, stale, or promoted`);
  const artifact = captureArtifacts.get(current.captureManifest);
  invariant(artifact?.sha256 === current.captureManifestSha256,
    `${expected.requirementId}: current-JavaScript capture bytes differ from the declared SHA-256`);
  validateCaptureManifestDocument({
    document: artifact.document,
    expected,
    captureManifest: current.captureManifest,
    captureManifestSha256: current.captureManifestSha256,
  });
}

export function repairedTs006Coverage({
  item,
  manifest,
  coverage,
  scenarioInventorySha256,
  adoption,
  captureArtifacts = new Map(),
}) {
  invariant(item?.animationId === TS006_ANIMATION_ID
    && item.sequence === 34
    && item.nativeRuntimeFacts?.rootFrameCount === 10,
  "TS006 runtime-contract identity drifted");
  invariant(SHA256.test(scenarioInventorySha256), "TS006 scenario inventory SHA-256 is malformed");
  const expected = buildExpectedPendingCoverageDocuments({item, manifest});
  invariant(sameJson(expected.manifest, manifest), "TS006 repair may not change migration.json");
  invariant(coverage?.schemaVersion === 2
    && coverage.animationId === TS006_ANIMATION_ID
    && coverage.requirements?.length === expected.coverage.requirements.length,
  "TS006 coverage identity or requirement count drifted");
  const currentById = new Map(coverage.requirements.map((requirement) => [requirement.requirementId, requirement]));
  invariant(currentById.size === coverage.requirements.length, "TS006 coverage contains duplicate requirement IDs");
  const requirements = expected.coverage.requirements.map((target) => {
    const current = currentById.get(target.requirementId);
    invariant(current, `TS006 coverage is missing ${target.requirementId}`);
    invariant(sameJson(withoutAllowedRepairFields(current), withoutAllowedRepairFields(target)),
      `${target.requirementId}: fields outside the exact binding-repair allowlist drifted`);
    const legacyEntryState = legacyFalseFieldPreimage(target);
    invariant(sameJson(current.entryState, legacyEntryState) || sameJson(current.entryState, target.entryState),
      `${target.requirementId}: entryState is neither the exact legacy false-field gap nor the repaired target`);
    invariant(current.entryStateSha256 === digest(Buffer.from(canonicalJson(current.entryState))),
      `${target.requirementId}: current entryStateSha256 does not bind the current entryState`);
    invariant(target.entryState.authoritativeTraceExecuted === false
      && (target.frameDomainId === "root" || target.entryState.runtimeReachabilityEstablished === false)
      && target.entryStateSha256 === digest(Buffer.from(canonicalJson(target.entryState))),
    `${target.requirementId}: target entry state is incomplete or promoted`);
    const currentBlockingEvidence = canonicalAcceptanceNeutralBlockingEvidence(current);
    const scenarioEntries = currentBlockingEvidence
      .filter(({file}) => file === "audit/scenario-inventory.json");
    invariant(scenarioEntries.length === 1,
      `${target.requirementId}: exact stale/current scenario-inventory preimage binding is missing`);
    const captured = hasImplementationCapture(current);
    const repaired = structuredClone(target);
    if (captured) {
      validateCaptureOverlay({current, expected: target, manifest, adoption, captureArtifacts});
      for (const key of ALLOWED_REPAIR_FIELDS) {
        if (["entryState", "entryStateSha256", "blockingEvidence"].includes(key)) continue;
        if (Object.hasOwn(current, key)) repaired[key] = structuredClone(current[key]);
      }
    } else {
      invariant(current.capturedFrameCount === 0
        && sameJson(current.missingFrames, target.missingFrames)
        && current.captureManifest === ""
        && current.captureManifestSha256 === ""
        && current.blockingReason === undefined,
      `${target.requirementId}: uncaptured requirement contains an incomplete capture overlay`);
    }
    repaired.blockingEvidence = [
      {file: "audit/scenario-inventory.json", sha256: scenarioInventorySha256},
      ...(captured ? [{
        file: current.captureManifest,
        sha256: current.captureManifestSha256,
      }] : []),
    ];
    return repaired;
  });
  const repaired = {...expected.coverage, requirements};
  const validated = buildExpectedPendingCoverageDocuments({item, manifest, coverage: repaired});
  invariant(sameJson(validated.manifest, manifest) && sameJson(validated.coverage, repaired),
    "TS006 repaired coverage does not pass the canonical pending-coverage contract");
  invariant(repaired.requirements.every((requirement) =>
    requirement.status === "pending"
    && requirement.baselineAuthority === "unresolved"
    && requirement.baselineCaptureManifest === ""
    && requirement.baselineCaptureManifestSha256 === ""
    && requirement.metricsFile === ""
    && requirement.metricsSha256 === ""),
  "TS006 coverage binding repair attempted to advance an acceptance field");
  return repaired;
}

async function loadInputs() {
  const [contractFile, migrationFile, coverageFile, inventoryFile] = await Promise.all([
    exactProjectFile(runtimeContractPath),
    exactProjectFile(migrationPath),
    exactProjectFile(coveragePath),
    exactProjectFile(scenarioInventoryPath),
  ]);
  const contract = JSON.parse(contractFile.bytes);
  const item = contract.items?.find(({animationId}) => animationId === TS006_ANIMATION_ID);
  invariant(contract.summary?.canonicalItems === 40 && contract.items?.length === 40,
    "G4 L3 runtime acquisition contract scope drifted");
  const manifest = JSON.parse(migrationFile.bytes);
  const coverage = JSON.parse(coverageFile.bytes);
  const inventory = JSON.parse(inventoryFile.bytes);
  invariant(inventory.schemaVersion === 1
    && inventory.animationId === TS006_ANIMATION_ID
    && inventory.inventoryStatus === "static-exhaustive-runtime-unverified"
    && inventory.migrationStatusChanged === false,
  "TS006 scenario inventory is missing, malformed, or promoted");
  const adoptionBinding = manifest.evidence?.currentJavaScriptImplementationCaptureAdoption;
  invariant(adoptionBinding?.path === "evidence/current-javascript-implementation-capture-adoption.json"
    && SHA256.test(adoptionBinding.sha256)
    && adoptionBinding.authority === "non-authoritative-current-javascript-output"
    && adoptionBinding.strictAcceptanceEffect === "none",
  "TS006 migration lacks the acceptance-neutral current-JavaScript adoption binding");
  const adoptionRelative = `${workspaceRelative}/${adoptionBinding.path}`;
  const adoptionFile = await exactProjectFile(adoptionRelative);
  invariant(adoptionFile.record.sha256 === adoptionBinding.sha256,
    "TS006 adoption bytes differ from migration.json");
  const adoption = JSON.parse(adoptionFile.bytes);
  const captureArtifacts = new Map();
  const captureRecords = [];
  for (const candidate of manifest.evidence?.candidateCaptureManifests || []) {
    const file = await exactProjectFile(candidate.path);
    invariant(file.record.sha256 === candidate.sha256,
      `${candidate.requirementId}: candidate capture bytes differ from migration.json`);
    const artifact = {sha256: file.record.sha256, document: JSON.parse(file.bytes)};
    captureArtifacts.set(candidate.path, artifact);
    captureRecords.push(file.record);
  }
  const repaired = repairedTs006Coverage({
    item,
    manifest,
    coverage,
    scenarioInventorySha256: inventoryFile.record.sha256,
    adoption,
    captureArtifacts,
  });
  return {
    item,
    manifest,
    coverage,
    repaired,
    coverageBytes: coverageFile.bytes,
    repairedBytes: Buffer.from(pretty(repaired)),
    sourceBindings: {
      runtimeAcquisitionContract: contractFile.record,
      migrationManifest: migrationFile.record,
      scenarioInventory: inventoryFile.record,
      currentJavascriptImplementationCaptureAdoption: adoptionFile.record,
      currentJavascriptCaptureManifests: captureRecords,
    },
  };
}

async function atomicReplaceWithCas(file, beforeBytes, afterBytes) {
  const temporary = `${file}.pending-${process.pid}`;
  await writeFile(temporary, afterBytes, {flag: "wx"});
  try {
    const current = await readFile(file);
    invariant(current.equals(beforeBytes), `${portable(path.relative(projectRoot, file))}: compare-and-swap preimage changed`);
    await rename(temporary, file);
    const written = await readFile(file);
    invariant(written.equals(afterBytes), `${portable(path.relative(projectRoot, file))}: post-write verification failed`);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}

async function writeImmutablePreimage(inputs) {
  const preimageSetSha256 = digest(Buffer.from(canonicalJson({
    animationId: TS006_ANIMATION_ID,
    path: coveragePath,
    bytes: inputs.coverageBytes.length,
    sha256: digest(inputs.coverageBytes),
  })));
  const root = `work/g4-l3-v2-coverage-preimages/ts006-binding-repair/${preimageSetSha256}`;
  const absoluteRoot = path.join(projectRoot, root);
  const destination = path.join(absoluteRoot, "full-frame-coverage.json");
  await mkdir(absoluteRoot, {recursive: true});
  try {
    await copyFile(path.join(projectRoot, coveragePath), destination, fsConstants.COPYFILE_EXCL);
    await chmod(destination, 0o444);
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const [existing, info] = await Promise.all([readFile(destination), stat(destination)]);
    invariant(existing.equals(inputs.coverageBytes) && (info.mode & 0o777) === 0o444,
      "TS006 deterministic coverage preimage already exists with different bytes or mode");
  }
  return {root, preimageSetSha256, ignoredWorkArtifact: true};
}

async function writeImmutableRefreshPreimage(inputs, reportFile, markdownFile) {
  const sources = [
    {path: coveragePath, bytes: inputs.coverageBytes},
    {path: reportPath, bytes: reportFile.bytes},
    {path: markdownPath, bytes: markdownFile.bytes},
  ];
  const bindings = Object.fromEntries(sources.map(({path: sourcePath, bytes}) => [
    sourcePath,
    {path: sourcePath, bytes: bytes.length, sha256: digest(bytes)},
  ]));
  const preimageSetSha256 = digest(Buffer.from(canonicalJson(bindings)));
  const root = `work/g4-l3-v2-coverage-refresh-preimages/ts006-binding-repair/${preimageSetSha256}`;
  const absoluteRoot = path.join(projectRoot, root);
  await mkdir(absoluteRoot, {recursive: true});
  for (const source of sources) {
    const destination = path.join(absoluteRoot, path.basename(source.path));
    try {
      await copyFile(path.join(projectRoot, source.path), destination, fsConstants.COPYFILE_EXCL);
      await chmod(destination, 0o444);
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      const [existing, info] = await Promise.all([readFile(destination), stat(destination)]);
      invariant(existing.equals(source.bytes) && (info.mode & 0o777) === 0o444,
        `TS006 immutable refresh preimage collision: ${portable(path.relative(projectRoot, destination))}`);
    }
  }
  return {root, preimageSetSha256, bindings, ignoredWorkArtifact: true};
}

async function replaceFilesWithRollback(files) {
  const changes = files.filter(({before, after}) => !before.equals(after));
  const written = [];
  try {
    for (const file of changes) {
      await atomicReplaceWithCas(path.join(projectRoot, file.path), file.before, file.after);
      written.push(file);
    }
  } catch (error) {
    for (const file of written.reverse()) {
      await atomicReplaceWithCas(path.join(projectRoot, file.path), file.after, file.before);
    }
    throw error;
  }
}

function markdown(report) {
  return `# G4 L3 TS006 Coverage Binding Repair\n\n`
    + `The four TS006 coverage requirements now bind the explicit fail-closed entry-state fields and the current static scenario inventory while preserving the existing 128-frame current-JavaScript implementation capture.\n\n`
    + `- Repaired entry-state bindings: **${report.summary.repairedEntryStateBindings}**.\n`
    + `- Preserved current-JavaScript capture requirements / frames: **${report.summary.preservedImplementationCaptureRequirements} / ${report.summary.preservedImplementationCaptureFrames}**.\n`
    + `- Original-runtime baselines / RMSE comparisons / strict completions: **0 / 0 / 0**.\n`
    + `- Immutable ignored preimage: \`${report.backup.root}\`.\n\n`
    + `This is an acceptance-neutral evidence-chain repair. It creates no original-runtime, audio, visual-review, owner, completion, or publication authority.\n`;
}

async function generatorRecord() {
  return (await exactProjectFile(portable(path.relative(projectRoot, scriptPath)))).record;
}

function buildReport(inputs, backup) {
  const captured = inputs.repaired.requirements.filter(hasImplementationCapture);
  return {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-coverage-binding-repair",
    generator: null,
    sourceBindings: inputs.sourceBindings,
    scope: {
      releaseId: "lesson-g04-l03-negative-numbers",
      sequence: inputs.item.sequence,
      animationId: TS006_ANIMATION_ID,
    },
    before: {
      fullFrameCoverage: {
        path: coveragePath,
        bytes: inputs.coverageBytes.length,
        sha256: digest(inputs.coverageBytes),
      },
    },
    after: {
      fullFrameCoverage: {
        path: coveragePath,
        bytes: inputs.repairedBytes.length,
        sha256: digest(inputs.repairedBytes),
      },
    },
    backup,
    summary: {
      requirements: inputs.repaired.requirements.length,
      repairedEntryStateBindings: inputs.repaired.requirements
        .filter((requirement, index) => !sameJson(requirement.entryState, inputs.coverage.requirements[index].entryState)).length,
      currentScenarioInventoryBindings: inputs.repaired.requirements.length,
      preservedImplementationCaptureRequirements: captured.length,
      preservedImplementationCaptureFrames: captured.reduce((sum, requirement) => sum + requirement.capturedFrameCount, 0),
      authoritativeRuntimeBaselines: 0,
      rmseComparisons: 0,
      strictCompletions: 0,
    },
    acceptance: {
      originalRuntimeAccepted: false,
      baselineAccepted: false,
      implementationCaptureAcceptedAsBaseline: false,
      rmseAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      lessonPublished: false,
    },
    strictAcceptanceEffect: "none",
  };
}

async function verifyReport(inputs) {
  invariant(inputs.coverageBytes.equals(inputs.repairedBytes),
    "TS006 full-frame coverage differs from the repaired fail-closed target");
  const [reportFile, markdownFile] = await Promise.all([
    exactProjectFile(reportPath),
    exactProjectFile(markdownPath),
  ]);
  const report = JSON.parse(reportFile.bytes);
  invariant(report.schemaVersion === 1 && report.reportType === "g4-l3-ts006-coverage-binding-repair",
    "TS006 coverage-binding repair report identity drifted");
  invariant(sameJson(report.generator, await generatorRecord()),
    "TS006 coverage-binding repair generator binding is stale");
  invariant(sameJson(report.sourceBindings, inputs.sourceBindings),
    "TS006 coverage-binding repair source bindings are stale");
  invariant(report.after?.fullFrameCoverage?.path === coveragePath
    && report.after.fullFrameCoverage.bytes === inputs.coverageBytes.length
    && report.after.fullFrameCoverage.sha256 === digest(inputs.coverageBytes)
    && report.summary?.requirements === 4
    && report.summary?.currentScenarioInventoryBindings === 4
    && report.summary?.preservedImplementationCaptureRequirements === 1
    && report.summary?.preservedImplementationCaptureFrames === 128
    && report.summary?.authoritativeRuntimeBaselines === 0
    && report.summary?.rmseComparisons === 0
    && report.summary?.strictCompletions === 0
    && Object.values(report.acceptance || {}).every((value) => value === false)
    && report.strictAcceptanceEffect === "none",
  "TS006 coverage-binding repair report was promoted or became stale");
  invariant(markdownFile.bytes.equals(Buffer.from(markdown(report))),
    "TS006 coverage-binding repair Markdown is stale");
  const backupFile = await exactProjectFile(`${report.backup.root}/full-frame-coverage.json`);
  invariant(backupFile.record.sha256 === report.before.fullFrameCoverage.sha256
    && backupFile.record.bytes === report.before.fullFrameCoverage.bytes
    && (await stat(path.join(projectRoot, backupFile.path))).mode % 0o1000 === 0o444,
  "TS006 immutable coverage preimage is missing, mutable, or hash-mismatched");
  return report;
}

async function refreshReport(inputs) {
  const [reportFile, markdownFile] = await Promise.all([
    exactProjectFile(reportPath),
    exactProjectFile(markdownPath),
  ]);
  const current = JSON.parse(reportFile.bytes);
  invariant(current.schemaVersion === 1
    && current.reportType === "g4-l3-ts006-coverage-binding-repair"
    && current.scope?.animationId === TS006_ANIMATION_ID
    && current.after?.fullFrameCoverage?.path === coveragePath
    && current.after.fullFrameCoverage.sha256 === digest(inputs.coverageBytes)
    && current.after.fullFrameCoverage.bytes === inputs.coverageBytes.length
    && current.summary?.strictCompletions === 0
    && Object.values(current.acceptance || {}).every((value) => value === false)
    && current.strictAcceptanceEffect === "none",
  "TS006 coverage-binding repair receipt cannot refresh across identity, preimage, or acceptance drift");
  const backup = await writeImmutableRefreshPreimage(inputs, reportFile, markdownFile);
  const report = buildReport(inputs, backup);
  report.generator = await generatorRecord();
  report.refreshHistory = [
    ...(current.refreshHistory || []),
    {
      priorReportSha256: reportFile.record.sha256,
      priorScenarioInventory: current.sourceBindings?.scenarioInventory || null,
      priorBackup: current.backup,
      compareAndSwapPreconditionsRequired: true,
      coverageRewritten: !inputs.coverageBytes.equals(inputs.repairedBytes),
      acceptanceEffect: "none",
    },
  ];
  invariant(report.summary?.strictCompletions === 0
    && Object.values(report.acceptance || {}).every((value) => value === false)
    && report.strictAcceptanceEffect === "none",
  "TS006 refreshed coverage report attempted to advance acceptance");
  const reportBytes = Buffer.from(pretty(report));
  const markdownBytes = Buffer.from(markdown(report));
  await replaceFilesWithRollback([
    {path: coveragePath, before: inputs.coverageBytes, after: inputs.repairedBytes},
    {path: markdownPath, before: markdownFile.bytes, after: markdownBytes},
    {path: reportPath, before: reportFile.bytes, after: reportBytes},
  ]);
  return verifyReport(await loadInputs());
}

export async function repairTs006CoverageBindings({check = false, dryRun = false, refresh = false} = {}) {
  invariant([check, dryRun, refresh].filter(Boolean).length <= 1,
    "--check, --dry-run, and --refresh are mutually exclusive");
  const inputs = await loadInputs();
  if (dryRun) {
    const captured = inputs.repaired.requirements.filter(hasImplementationCapture);
    return {
      dryRun: true,
      before: {
        path: coveragePath,
        bytes: inputs.coverageBytes.length,
        sha256: digest(inputs.coverageBytes),
      },
      after: {
        path: coveragePath,
        bytes: inputs.repairedBytes.length,
        sha256: digest(inputs.repairedBytes),
      },
      scenarioInventory: inputs.sourceBindings.scenarioInventory,
      summary: {
        requirements: inputs.repaired.requirements.length,
        preservedImplementationCaptureRequirements: captured.length,
        preservedImplementationCaptureFrames: captured
          .reduce((sum, requirement) => sum + requirement.capturedFrameCount, 0),
        strictCompletions: 0,
      },
    };
  }
  const reportExists = await lstat(path.join(projectRoot, reportPath))
    .then(() => true)
    .catch((error) => error.code === "ENOENT" ? false : Promise.reject(error));
  if (reportExists) return refresh ? refreshReport(inputs) : verifyReport(inputs);
  invariant(!refresh, "TS006 coverage-binding repair report is missing; cannot refresh");
  invariant(!check, "TS006 coverage-binding repair report is missing");
  invariant(!inputs.coverageBytes.equals(inputs.repairedBytes),
    "TS006 coverage is already repaired but lacks the immutable repair receipt");
  const backup = await writeImmutablePreimage(inputs);
  const report = buildReport(inputs, backup);
  report.generator = await generatorRecord();
  const reportBytes = Buffer.from(pretty(report));
  const markdownBytes = Buffer.from(markdown(report));
  const reportTemporary = path.join(projectRoot, `${reportPath}.pending-${process.pid}`);
  const markdownTemporary = path.join(projectRoot, `${markdownPath}.pending-${process.pid}`);
  await Promise.all([
    writeFile(reportTemporary, reportBytes, {flag: "wx"}),
    writeFile(markdownTemporary, markdownBytes, {flag: "wx"}),
  ]);
  let coverageWritten = false;
  let markdownWritten = false;
  try {
    await atomicReplaceWithCas(path.join(projectRoot, coveragePath), inputs.coverageBytes, inputs.repairedBytes);
    coverageWritten = true;
    await rename(markdownTemporary, path.join(projectRoot, markdownPath));
    markdownWritten = true;
    await rename(reportTemporary, path.join(projectRoot, reportPath));
  } catch (error) {
    if (coverageWritten) {
      await atomicReplaceWithCas(path.join(projectRoot, coveragePath), inputs.repairedBytes, inputs.coverageBytes);
    }
    if (markdownWritten) await unlink(path.join(projectRoot, markdownPath));
    throw error;
  } finally {
    await Promise.all([
      unlink(reportTemporary).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      }),
      unlink(markdownTemporary).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      }),
    ]);
  }
  return verifyReport(await loadInputs());
}

export function parseArguments(argv) {
  const unknown = argv.filter((argument) => !["--check", "--dry-run", "--refresh"].includes(argument));
  if (unknown.length) throw new Error(`Unknown option: ${unknown[0]}`);
  const options = {
    check: argv.includes("--check"),
    dryRun: argv.includes("--dry-run"),
    refresh: argv.includes("--refresh"),
  };
  invariant(Object.values(options).filter(Boolean).length <= 1,
    "--check, --dry-run, and --refresh are mutually exclusive");
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  repairTs006CoverageBindings(parseArguments(process.argv.slice(2))).then((report) => {
    if (report.dryRun) {
      process.stdout.write(`DRY RUN PASS: TS006 coverage ${report.before.sha256} -> ${report.after.sha256}; `
        + `${report.summary.preservedImplementationCaptureFrames} current-JS frames would be preserved; strict completion 0.\n`);
      return;
    }
    process.stdout.write(`PASS: TS006 ${report.summary.requirements}/4 fail-closed coverage bindings current; `
      + `${report.summary.preservedImplementationCaptureFrames} current-JS frames preserved; strict completion 0.\n`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
