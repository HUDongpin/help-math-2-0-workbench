#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {chmod, copyFile, lstat, mkdir, readFile, rename, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  buildExpectedPendingCoverageDocuments,
  buildPendingRootRequirement,
  canonicalJson,
  TS006_ANIMATION_ID,
  TS006_NESTED_DOMAIN,
} from "./materialize-g4-l3-valid-pending-root-coverage.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const CONTRACT_PATH = "reports/g4-l3-authoritative-runtime-acquisition-contract.json";
const MACHINE_AUDIT_PATH = "reports/g4-l3-machine-source-audits.json";
const PROTOCOL_PATH = "reports/g4-l3-ts006-original-runtime-session-protocol-draft.json";
const PENDING_COVERAGE_CONTRACT_GENERATOR_PATH = "scripts/materialize-g4-l3-valid-pending-root-coverage.mjs";
const MIGRATION_PATH = `migrations/${TS006_ANIMATION_ID}/migration.json`;
const COVERAGE_PATH = `migrations/${TS006_ANIMATION_ID}/evidence/full-frame-coverage.json`;
const REPORT_PATH = "reports/g4-l3-ts006-pending-domain-coverage-upgrade.json";
const MARKDOWN_PATH = "reports/g4-l3-ts006-pending-domain-coverage-upgrade.md";
const STATIC_DISPOSITION_CLOSURE_PATH = "reports/g4-l3-ts006-static-frame-domain-disposition-closure.json";
const CURRENT_JS_WORKSPACE_BINDING_PATH = "reports/g4-l3-ts006-current-javascript-workspace-binding.json";
const CURRENT_JS_CAPTURE_ADOPTION_PATH = `migrations/${TS006_ANIMATION_ID}/evidence/current-javascript-implementation-capture-adoption.json`;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function relative(file) {
  const value = path.relative(ROOT, file).split(path.sep).join("/");
  invariant(value && !value.startsWith("../") && !path.isAbsolute(value), `${file} escapes project root`);
  return value;
}

async function binding(relativePath) {
  const bytes = await readFile(path.join(ROOT, relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

export function exactTs006Item(contract) {
  invariant(contract.reportType === "g4-l3-authoritative-runtime-acquisition-contract"
    && contract.summary?.canonicalItems === 40 && contract.items?.length === 40,
  "Authoritative runtime acquisition contract scope drifted");
  const matches = contract.items.filter(({animationId}) => animationId === TS006_ANIMATION_ID);
  invariant(matches.length === 1, "Runtime acquisition contract must contain exactly one TS006 item");
  const item = matches[0];
  invariant(item.sequence === 34
    && item.nativeRuntimeFacts?.rootFrameCount === 10
    && item.nativeRuntimeFacts?.staticallyRootReachableNestedDefinitionCount === 2
    && item.nativeRuntimeFacts?.frameDomainDispositionEstablished === false
    && item.currentEvidenceState?.authorizedOriginalRuntimeSessionEstablished === false
    && item.currentEvidenceState?.naturalExecutionProofEstablished === false
    && item.currentEvidenceState?.strictComplete === false,
  "TS006 runtime contract no longer matches the bounded pending-planning state");
  return item;
}

export function exactMachineAudit(machineReport) {
  invariant(machineReport.reportType === "g4-l3-machine-source-audits"
    && machineReport.summary?.canonicalItems === 40 && machineReport.items?.length === 40,
  "Machine source-audit scope drifted");
  const matches = machineReport.items.filter(({animationId}) => animationId === TS006_ANIMATION_ID);
  invariant(matches.length === 1, "Machine source-audit report must contain exactly one TS006 item");
  const audit = matches[0];
  const domains = audit.swf?.frameDomains?.domains || [];
  const root = domains.find(({domainId}) => domainId === "root");
  const title = domains.find(({domainId}) => domainId === "sprite-3");
  const teaching = domains.find(({domainId}) => domainId === TS006_NESTED_DOMAIN.id);
  invariant(root?.declaredFrameCount === 10
    && root.placementEdges?.some(({childSpriteId, firstFrame}) => childSpriteId === 23 && firstFrame === 6)
    && title?.declaredFrameCount === 1 && title.staticallyRootReachable === true
    && teaching?.declaredFrameCount === 128 && teaching.staticallyRootReachable === true
    && teaching.tagCounts?.SoundStreamBlock === 128
    && audit.evidenceLimits?.runtimeReachabilityEstablished === false
    && audit.evidenceLimits?.frameDomainDispositionEstablished === false,
  "TS006 static domain facts drifted or were incorrectly promoted to runtime proof");
  return audit;
}

export function exactProtocol(protocol) {
  invariant(protocol.reportType === "g4-l3-ts006-original-runtime-session-protocol-draft"
    && protocol.scope?.animationId === TS006_ANIMATION_ID
    && protocol.summary?.frameDomainCandidates === 3
    && protocol.summary?.runtimeSessionsExecuted === 0
    && protocol.proposedProtocol?.frameDomainsToDispose?.join("|") === "root|sprite-3|sprite-23"
    && protocol.acceptance?.migrationManifestModified === false
    && protocol.acceptance?.strictMigrationComplete === false,
  "TS006 runtime protocol is no longer the expected unexecuted three-domain-candidate draft");
}

export function validateRootOnlyPreimage({item, manifest, coverage}) {
  invariant(manifest.animationId === TS006_ANIMATION_ID, "TS006 migration identity drifted");
  const domains = manifest.implementation?.frameDomains || [];
  invariant(domains.length === 1 && domains[0].id === "root" && domains[0].frameCount === 10,
    "Refusing to overwrite a TS006 manifest that is not the exact root-only planning state");
  const expectedRootRequirements = ["en", "es"].map((language) => buildPendingRootRequirement({item, language}));
  invariant(coverage.schemaVersion === 2
    && coverage.animationId === TS006_ANIMATION_ID
    && pretty(coverage.requirements) === pretty(expectedRootRequirements),
  "Refusing to overwrite TS006 coverage that is not the exact two-requirement root-only preimage");
  invariant(coverage.requirements.every(({status, baselineAuthority}) => status === "pending" && baselineAuthority === "unresolved"),
    "TS006 root-only preimage has an authority or status claim");
}

export function validateExpected({item, manifest, coverage}) {
  const expected = buildExpectedPendingCoverageDocuments({item, manifest, coverage});
  invariant(pretty(manifest) === pretty(expected.manifest), "TS006 migration.json differs from the pending-domain plan");
  invariant(pretty(coverage) === pretty(expected.coverage), "TS006 full-frame coverage differs from the pending-domain plan");
  invariant(coverage.requirements.length === 4
    && coverage.requirements.filter(({frameDomainId}) => frameDomainId === "root").length === 2
    && coverage.requirements.filter(({frameDomainId}) => frameDomainId === "sprite-23").length === 2
    && coverage.requirements.every(({status, baselineAuthority, baselineAuthorityRequirement}) =>
      status === "pending" && baselineAuthority === "unresolved"
      && baselineAuthorityRequirement === "original-runtime-natural-trace"),
  "TS006 coverage is not four fail-closed natural-trace requirements");
  invariant(manifest.implementation.capturePlanning?.nestedFrameDomainDispositionEstablished === true
    && manifest.implementation.capturePlanning?.conservativeNestedDomainRequirementsEstablished === true
    && manifest.implementation.capturePlanning?.staticCompositeTimelineIds?.join("|") === "sprite-3"
    && manifest.implementation.capturePlanning?.unresolvedTimelineCandidateIds?.length === 0,
  "TS006 planning does not bind the source-proven sprite-3 disposition state");
}

async function loadInputs() {
  const [contractBytes, machineBytes, protocolBytes, manifestBytes, coverageBytes, dispositionClosureBytes, currentJsBindingBytes, captureAdoptionBytes] = await Promise.all([
    readFile(path.join(ROOT, CONTRACT_PATH)),
    readFile(path.join(ROOT, MACHINE_AUDIT_PATH)),
    readFile(path.join(ROOT, PROTOCOL_PATH)),
    readFile(path.join(ROOT, MIGRATION_PATH)),
    readFile(path.join(ROOT, COVERAGE_PATH)),
    readFile(path.join(ROOT, STATIC_DISPOSITION_CLOSURE_PATH)),
    readFile(path.join(ROOT, CURRENT_JS_WORKSPACE_BINDING_PATH)),
    readFile(path.join(ROOT, CURRENT_JS_CAPTURE_ADOPTION_PATH)),
  ]);
  const contract = JSON.parse(contractBytes);
  const machine = JSON.parse(machineBytes);
  const protocol = JSON.parse(protocolBytes);
  const item = exactTs006Item(contract);
  exactMachineAudit(machine);
  exactProtocol(protocol);
  const dispositionClosure = JSON.parse(dispositionClosureBytes);
  invariant(dispositionClosure.reportType === "g4-l3-ts006-static-frame-domain-disposition-closure"
    && dispositionClosure.summary?.unresolvedTimelineCandidatesAfter === 0
    && dispositionClosure.acceptance?.strictMigrationComplete === false,
  "TS006 static disposition closure is missing, malformed, or promoted");
  const currentJsBinding = JSON.parse(currentJsBindingBytes);
  invariant(currentJsBinding.reportType === "g4-l3-ts006-current-javascript-workspace-binding"
    && currentJsBinding.scope?.animationId === TS006_ANIMATION_ID
    && currentJsBinding.summary?.migrationStatusAfter === "preserved"
    && currentJsBinding.summary?.strictCompletions === 0
    && Object.values(currentJsBinding.acceptance || {}).every((value) => value === false),
  "TS006 current-JavaScript workspace binding is missing, malformed, or promoted");
  const captureAdoption = JSON.parse(captureAdoptionBytes);
  invariant(captureAdoption.evidenceType === "current-javascript-implementation-capture-adoption"
    && captureAdoption.animationId === TS006_ANIMATION_ID
    && String(captureAdoption.authority).startsWith("Deterministic current JavaScript output only.")
    && captureAdoption.strictAcceptanceEffect === "none"
    && captureAdoption.status === "partial-non-authoritative-implementation-capture"
    && captureAdoption.summary?.declaredRequirementCount === 4
    && captureAdoption.summary?.requirementCount === 1
    && captureAdoption.summary?.capturedFrameCount === 128
    && captureAdoption.summary?.validationErrors === 0,
  "TS006 current-JavaScript capture adoption is missing, malformed, or promoted");
  return {
    item,
    manifestBytes,
    coverageBytes,
    manifest: JSON.parse(manifestBytes),
    coverage: JSON.parse(coverageBytes),
    dispositionClosure,
    currentJsBinding,
    captureAdoption,
    sourceBindings: {
      pendingCoverageContractGenerator: await binding(PENDING_COVERAGE_CONTRACT_GENERATOR_PATH),
      runtimeAcquisitionContract: {path: CONTRACT_PATH, bytes: contractBytes.length, sha256: sha256(contractBytes)},
      machineSourceAudits: {path: MACHINE_AUDIT_PATH, bytes: machineBytes.length, sha256: sha256(machineBytes)},
      runtimeProtocolDraft: {path: PROTOCOL_PATH, bytes: protocolBytes.length, sha256: sha256(protocolBytes)},
      staticFrameDomainDispositionClosure: {
        path: STATIC_DISPOSITION_CLOSURE_PATH,
        bytes: dispositionClosureBytes.length,
        sha256: sha256(dispositionClosureBytes),
      },
      currentJavascriptWorkspaceBinding: {
        path: CURRENT_JS_WORKSPACE_BINDING_PATH,
        bytes: currentJsBindingBytes.length,
        sha256: sha256(currentJsBindingBytes),
      },
      currentJavascriptImplementationCaptureAdoption: {
        path: CURRENT_JS_CAPTURE_ADOPTION_PATH,
        bytes: captureAdoptionBytes.length,
        sha256: sha256(captureAdoptionBytes),
      },
    },
  };
}

async function removeIfPresent(file) {
  await unlink(file).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

async function replacePairWithRollback({manifestBytes, coverageBytes, nextManifestBytes, nextCoverageBytes}) {
  const migrationTarget = path.join(ROOT, MIGRATION_PATH);
  const coverageTarget = path.join(ROOT, COVERAGE_PATH);
  const migrationTemp = `${migrationTarget}.pending-${process.pid}`;
  const coverageTemp = `${coverageTarget}.pending-${process.pid}`;
  await writeFile(migrationTemp, nextManifestBytes, {flag: "wx"});
  try {
    await writeFile(coverageTemp, nextCoverageBytes, {flag: "wx"});
    await rename(migrationTemp, migrationTarget);
    try {
      await rename(coverageTemp, coverageTarget);
    } catch (error) {
      await writeFile(migrationTemp, manifestBytes, {flag: "wx"});
      await rename(migrationTemp, migrationTarget);
      throw error;
    }
  } finally {
    await Promise.all([removeIfPresent(migrationTemp), removeIfPresent(coverageTemp)]);
  }
  const [writtenManifest, writtenCoverage] = await Promise.all([
    readFile(migrationTarget), readFile(coverageTarget),
  ]);
  if (!writtenManifest.equals(nextManifestBytes) || !writtenCoverage.equals(nextCoverageBytes)) {
    await Promise.all([
      writeFile(migrationTemp, manifestBytes, {flag: "wx"}),
      writeFile(coverageTemp, coverageBytes, {flag: "wx"}),
    ]);
    await rename(migrationTemp, migrationTarget);
    await rename(coverageTemp, coverageTarget);
    throw new Error("TS006 post-write verification failed; both planning files were restored");
  }
}

async function atomicWrite(file, bytes) {
  const temporary = `${file}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, file);
}

function markdown(report) {
  return `# G4 L3 TS006 Pending Frame-Domain Coverage Upgrade\n\n`
    + `This acceptance-neutral planning upgrade keeps the shipped root timeline at 10 frames and adds the statically identified 128-frame \`sprite-23\` teaching timeline as a conservative, separate pending frame-domain obligation.\n\n`
    + `- Pending requirements: **4** (root EN/ES plus sprite-23 EN/ES).\n`
    + `- Original-runtime sessions / baseline captures / strict completions: **0 / 0 / 0**.\n`
    + `- Source-proven static disposition: **sprite-3 composite-child-with-parent**; unresolved timeline candidates: **0**.\n`
    + `- Preimages: ignored \`${report.backup.root}\`; set SHA-256 \`${report.backup.preimageSetSha256}\`.\n\n`
    + `The sprite-23 requirements demand a natural same-lesson-shell trace and frames 1–128. Static reachability, current JavaScript output, and work-only Animate evidence do not prove runtime reachability, entry state, audio timing, fidelity, or acceptance.\n`;
}

async function verify(inputs) {
  validateExpected(inputs);
  const reportBytes = await readFile(path.join(ROOT, REPORT_PATH));
  const report = JSON.parse(reportBytes);
  invariant(report.schemaVersion === 1 && report.reportType === "g4-l3-ts006-pending-domain-coverage-upgrade",
    "TS006 pending-domain report identity drifted");
  const generator = await binding(relative(SCRIPT_PATH));
  invariant(pretty(report.generator) === pretty(generator), "TS006 pending-domain generator binding is stale");
  invariant(pretty(report.sourceBindings) === pretty(inputs.sourceBindings), "TS006 pending-domain source chain is stale");
  invariant(report.after.migrationJson.sha256 === sha256(inputs.manifestBytes)
    && report.after.migrationJson.bytes === inputs.manifestBytes.length
    && report.after.fullFrameCoverage.sha256 === sha256(inputs.coverageBytes)
    && report.after.fullFrameCoverage.bytes === inputs.coverageBytes.length,
  "TS006 pending-domain output hashes are stale");
  invariant(report.summary.pendingRequirements === 4
    && report.summary.pendingNestedRequirements === 2
    && report.summary.unresolvedTimelineCandidates === 0
    && report.summary.authoritativeRuntimeSessions === 0
    && report.summary.strictCompletions === 0,
  "TS006 pending-domain summary was promoted or regressed");
  invariant(Object.values(report.acceptance).every((value) => value === false),
    "TS006 pending-domain planning report cannot contain an acceptance claim");
  return report;
}

async function refreshReport(inputs) {
  validateExpected(inputs);
  const reportBytes = await readFile(path.join(ROOT, REPORT_PATH));
  const report = JSON.parse(reportBytes);
  invariant(report.schemaVersion === 1 && report.reportType === "g4-l3-ts006-pending-domain-coverage-upgrade",
    "TS006 pending-domain report identity drifted");
  const closure = inputs.dispositionClosure;
  const currentJsBinding = inputs.currentJsBinding;
  const currentMigrationSha256 = sha256(inputs.manifestBytes);
  const currentCoverageSha256 = sha256(inputs.coverageBytes);
  const receiptIsPreClosure = report.after?.migrationJson?.sha256 === closure.before?.migrationJson?.sha256
    && report.after?.fullFrameCoverage?.sha256 === closure.before?.fullFrameCoverage?.sha256;
  const receiptIsAlreadyPostClosure = report.after?.migrationJson?.sha256 === currentMigrationSha256
    && report.after?.fullFrameCoverage?.sha256 === currentCoverageSha256;
  const receiptIsCurrentJsPreimage = report.after?.migrationJson?.sha256 === currentJsBinding.before?.migrationJson?.sha256
    && report.after?.fullFrameCoverage?.sha256 === currentJsBinding.before?.fullFrameCoverage?.sha256;
  const currentJsTransactionTargetsCurrent = currentJsBinding.after?.migrationJson?.sha256 === currentMigrationSha256
    && currentJsBinding.after?.fullFrameCoverage?.sha256 === currentCoverageSha256;
  const acceptanceNeutralCaptureOverlayIsCurrent = currentJsTransactionTargetsCurrent
    && String(inputs.captureAdoption.authority).startsWith("Deterministic current JavaScript output only.")
    && inputs.captureAdoption.strictAcceptanceEffect === "none";
  invariant((receiptIsPreClosure || receiptIsAlreadyPostClosure || receiptIsCurrentJsPreimage || acceptanceNeutralCaptureOverlayIsCurrent)
    && closure.after?.migrationJson?.sha256 === currentMigrationSha256
    && closure.after?.fullFrameCoverage?.sha256 === sha256(inputs.coverageBytes)
    && (!receiptIsCurrentJsPreimage || currentJsTransactionTargetsCurrent)
    && Object.values(report.acceptance || {}).every((value) => value === false)
    && report.summary?.strictCompletions === 0,
  "TS006 pending-domain report cannot be refreshed across output or acceptance drift");
  const refreshed = {
    ...report,
    generator: await binding(relative(SCRIPT_PATH)),
    sourceBindings: inputs.sourceBindings,
    after: {
      migrationJson: {path: MIGRATION_PATH, bytes: inputs.manifestBytes.length, sha256: sha256(inputs.manifestBytes)},
      fullFrameCoverage: {path: COVERAGE_PATH, bytes: inputs.coverageBytes.length, sha256: sha256(inputs.coverageBytes)},
    },
    summary: {
      ...report.summary,
      unresolvedTimelineCandidates: 0,
      sourceProvenStaticCompositeTimelines: 1,
    },
    refreshHistory: [
      ...(report.refreshHistory || []),
      {
        priorReportSha256: sha256(reportBytes),
        migrationOrCoverageDocumentsRewritten: false,
        disposition: receiptIsCurrentJsPreimage
          ? "receipt-only-rebind-through-hash-bound-current-javascript-workspace-transaction"
          : acceptanceNeutralCaptureOverlayIsCurrent
            ? "receipt-only-rebind-after-exact-acceptance-neutral-current-javascript-capture-overlay-validation"
            : "receipt-only-rebind-after-exact-pending-domain-and-static-disposition-validation",
      },
    ],
  };
  await atomicWrite(path.join(ROOT, REPORT_PATH), Buffer.from(pretty(refreshed)));
  await atomicWrite(path.join(ROOT, MARKDOWN_PATH), Buffer.from(markdown(refreshed)));
  return verify(await loadInputs());
}

export async function materialize({check = false, refresh = false} = {}) {
  const inputs = await loadInputs();
  const reportStat = await lstat(path.join(ROOT, REPORT_PATH)).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (check) return verify(inputs);
  if (refresh) {
    invariant(reportStat, "Cannot refresh a missing TS006 pending-domain report");
    return refreshReport(inputs);
  }
  if (reportStat) return verify(inputs);
  validateRootOnlyPreimage(inputs);
  const expected = buildExpectedPendingCoverageDocuments({
    item: inputs.item,
    manifest: inputs.manifest,
    coverage: inputs.coverage,
  });
  const nextManifestBytes = Buffer.from(pretty(expected.manifest));
  const nextCoverageBytes = Buffer.from(pretty(expected.coverage));
  const preimageProjection = {
    animationId: TS006_ANIMATION_ID,
    migrationJsonSha256: sha256(inputs.manifestBytes),
    fullFrameCoverageSha256: sha256(inputs.coverageBytes),
  };
  const preimageSetSha256 = sha256(Buffer.from(canonicalJson(preimageProjection)));
  const backupRoot = `work/g4-l3-v2-ts006-domain-preimages/${preimageSetSha256}`;
  await mkdir(path.join(ROOT, backupRoot), {recursive: true});
  for (const [name, source] of [["migration.json", MIGRATION_PATH], ["full-frame-coverage.json", COVERAGE_PATH]]) {
    const destination = path.join(ROOT, backupRoot, name);
    await copyFile(path.join(ROOT, source), destination, fsConstants.COPYFILE_EXCL);
    await chmod(destination, 0o444);
  }
  await replacePairWithRollback({
    manifestBytes: inputs.manifestBytes,
    coverageBytes: inputs.coverageBytes,
    nextManifestBytes,
    nextCoverageBytes,
  });
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-pending-domain-coverage-upgrade",
    generator: await binding(relative(SCRIPT_PATH)),
    sourceBindings: inputs.sourceBindings,
    scope: {
      releaseId: "lesson-g04-l03-negative-numbers",
      sequence: inputs.item.sequence,
      animationId: TS006_ANIMATION_ID,
      sourceSwfSha256: inputs.item.source.swf.sha256,
      sourceFlaSha256: inputs.item.source.fla.sha256,
    },
    before: {
      migrationJson: {path: MIGRATION_PATH, bytes: inputs.manifestBytes.length, sha256: sha256(inputs.manifestBytes)},
      fullFrameCoverage: {path: COVERAGE_PATH, bytes: inputs.coverageBytes.length, sha256: sha256(inputs.coverageBytes)},
    },
    after: {
      migrationJson: {path: MIGRATION_PATH, bytes: nextManifestBytes.length, sha256: sha256(nextManifestBytes)},
      fullFrameCoverage: {path: COVERAGE_PATH, bytes: nextCoverageBytes.length, sha256: sha256(nextCoverageBytes)},
    },
    backup: {root: backupRoot, preimageSetSha256, ignoredWorkArtifact: true},
    summary: {
      declaredFrameDomains: 2,
      pendingRequirements: 4,
      pendingNestedRequirements: 2,
      unresolvedTimelineCandidates: 0,
      sourceProvenStaticCompositeTimelines: 1,
      authoritativeRuntimeSessions: 0,
      strictCompletions: 0,
    },
    acceptance: {
      authoritativeRuntimeAccepted: false,
      baselineAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
    },
  };
  await atomicWrite(path.join(ROOT, REPORT_PATH), Buffer.from(pretty(report)));
  await atomicWrite(path.join(ROOT, MARKDOWN_PATH), Buffer.from(markdown(report)));
  return verify(await loadInputs());
}

export function parseArguments(argv) {
  const options = {check: false, refresh: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--refresh") options.refresh = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  invariant(!(options.check && options.refresh), "--check and --refresh are mutually exclusive");
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  materialize(parseArguments(process.argv.slice(2))).then((report) => {
    process.stdout.write(`PASS: TS006 ${report.summary.pendingRequirements} pending requirements; `
      + `${report.summary.unresolvedTimelineCandidates} unresolved timeline; strict completion 0.\n`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
