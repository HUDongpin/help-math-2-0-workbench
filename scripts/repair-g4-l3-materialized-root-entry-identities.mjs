#!/usr/bin/env node

import {createHash} from "node:crypto";
import {
  lstat,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {buildExpandedDocuments} from "./materialize-g4-l3-unresolved-frame-domains.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SOURCE_REPORT_PATH = "reports/g4-l3-unresolved-frame-domain-materialization.json";
const PREVIOUS_REPORT_PATH = "reports/g4-l3-materialized-root-entry-identity-successor.json";
const REPORT_PATH = "reports/g4-l3-materialized-root-entry-identity-successor-v2.json";
const MARKDOWN_PATH = "reports/g4-l3-materialized-root-entry-identity-successor-v2.md";
const SHA256 = /^[a-f0-9]{64}$/;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function canonicalJson(value) {
  return JSON.stringify(stable(value));
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0 && !path.isAbsolute(relativePath),
    "project-relative path is required");
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`), `${relativePath} escapes the project root`);
  return absolute;
}

async function record(relativePath) {
  const absolute = projectPath(relativePath);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath} must be a regular non-symlink file`);
  const physical = await stat(absolute);
  invariant(physical.nlink === 1, `${relativePath} must not be hard-linked`);
  const bytesValue = await readFile(absolute);
  return {
    path: portable(relativePath),
    bytes: bytesValue.length,
    sha256: sha256(bytesValue),
    bytesValue,
  };
}

function binding(fileRecord) {
  return {path: fileRecord.path, bytes: fileRecord.bytes, sha256: fileRecord.sha256};
}

function exactBinding(actual, expected, label) {
  invariant(actual.path === expected?.path
    && actual.bytes === expected?.bytes
    && actual.sha256 === expected?.sha256,
  `${label} binding drifted`);
}

function entryStateSha256(entryState) {
  return sha256(Buffer.from(canonicalJson(entryState)));
}

function candidateByAnimation(document, animationId) {
  const matches = (document.members || []).filter((member) => member.animationId === animationId);
  invariant(matches.length === 1, `${animationId}: source candidate member identity drifted`);
  return matches[0];
}

export function deriveRootEntryFrame(frameDomainId, frameDomains) {
  const byId = new Map(frameDomains.map((domain) => [domain.id, domain]));
  invariant(byId.size === frameDomains.length && byId.has("root"), "frame-domain set is missing root or contains duplicates");
  invariant(frameDomainId !== "root" && byId.has(frameDomainId), `${frameDomainId}: nested frame domain is missing`);
  const visited = new Set();
  let currentId = frameDomainId;
  while (currentId !== "root") {
    invariant(!visited.has(currentId), `${frameDomainId}: frame-domain parent chain is cyclic`);
    visited.add(currentId);
    const domain = byId.get(currentId);
    invariant(domain && domain.kind === "nested", `${frameDomainId}: parent chain contains an invalid nested domain`);
    if (domain.parentFrameDomainId === "root") {
      return Number.isSafeInteger(domain.parentEntryFrame) && domain.parentEntryFrame >= 1
        ? domain.parentEntryFrame
        : null;
    }
    invariant(typeof domain.parentFrameDomainId === "string" && byId.has(domain.parentFrameDomainId),
      `${frameDomainId}: parent frame domain is missing`);
    currentId = domain.parentFrameDomainId;
  }
  return null;
}

function validatePendingRequirement(requirement, animationId) {
  invariant(requirement?.entryState?.kind === "lesson-shell-natural-entry-to-source-static-reachable-domain"
    && requirement.planningAuthority === "source-static-reachable-domain-candidate-not-executed-original-runtime-evidence"
    && requirement.status === "pending"
    && requirement.baselineAuthority === "unresolved"
    && requirement.baselineAuthorityRequirement === "original-runtime-natural-trace"
    && requirement.capturedFrameCount === 0
    && requirement.baselineCaptureManifest === ""
    && requirement.captureManifest === ""
    && requirement.metricsFile === "",
  `${animationId}/${requirement?.requirementId}: materialized requirement was promoted or changed scope`);
  invariant(requirement.entryStateSha256 === entryStateSha256(requirement.entryState),
    `${animationId}/${requirement.requirementId}: entry-state hash is stale`);
}

export function repairCoverageDocument({sourceItem, sourceRequirements, manifest, coverage, allowRepaired = false}) {
  const animationId = sourceItem.animationId;
  invariant(manifest.animationId === animationId
    && coverage.animationId === animationId
    && coverage.schemaVersion === 2,
  `${animationId}: migration or coverage identity drifted`);
  invariant(Number.isSafeInteger(sourceItem.newPendingRequirements)
    && sourceItem.newPendingRequirements > 0
    && sourceRequirements?.length === sourceItem.newPendingRequirements,
  `${animationId}: materialized requirement count is invalid`);
  const repairedCoverage = structuredClone(coverage);
  const repairs = [];
  const unresolved = [];
  const frameDomains = manifest.implementation?.frameDomains || [];

  for (const sourceRequirement of sourceRequirements) {
    const matchingIndexes = coverage.requirements
      .map((requirement, index) => requirement.requirementId === sourceRequirement.requirementId ? index : -1)
      .filter((index) => index >= 0);
    invariant(matchingIndexes.length === 1,
      `${animationId}/${sourceRequirement.requirementId}: current materialized requirement is missing or duplicated`);
    const index = matchingIndexes[0];
    const current = coverage.requirements[index];
    validatePendingRequirement(current, animationId);
    const expectedRootEntryFrame = deriveRootEntryFrame(current.frameDomainId, frameDomains);
    const currentPreimage = structuredClone(current);
    delete currentPreimage.entryState.rootEntryFrame;
    currentPreimage.entryState = stable(currentPreimage.entryState);
    currentPreimage.entryStateSha256 = entryStateSha256(currentPreimage.entryState);
    invariant(pretty(currentPreimage) === pretty(sourceRequirement),
      `${animationId}/${current.requirementId}: current requirement is not an exact descendant of the materialized source requirement`);
    if (expectedRootEntryFrame === null) {
      invariant(!Object.hasOwn(current.entryState, "rootEntryFrame"),
        `${animationId}/${current.requirementId}: unresolved root entry frame must remain absent`);
      unresolved.push({
        requirementId: current.requirementId,
        frameDomainId: current.frameDomainId,
        reason: "source placement chain lacks a proven root parent entry frame",
      });
      continue;
    }
    const hasRootEntryFrame = Object.hasOwn(current.entryState, "rootEntryFrame");
    invariant(!hasRootEntryFrame || (allowRepaired && current.entryState.rootEntryFrame === expectedRootEntryFrame),
      `${animationId}/${current.requirementId}: rootEntryFrame is not the exact repair preimage or successor value`);
    const nextEntryState = stable({...current.entryState, rootEntryFrame: expectedRootEntryFrame});
    repairedCoverage.requirements[index].entryState = nextEntryState;
    repairedCoverage.requirements[index].entryStateSha256 = entryStateSha256(nextEntryState);
    repairs.push({
      requirementId: current.requirementId,
      frameDomainId: current.frameDomainId,
      rootEntryFrame: expectedRootEntryFrame,
      entryStateSha256: repairedCoverage.requirements[index].entryStateSha256,
    });
  }

  const preimageCoverage = structuredClone(repairedCoverage);
  for (const repair of repairs) {
    const requirement = preimageCoverage.requirements.find(({requirementId}) => requirementId === repair.requirementId);
    invariant(requirement, `${animationId}/${repair.requirementId}: repaired requirement disappeared`);
    delete requirement.entryState.rootEntryFrame;
    requirement.entryState = stable(requirement.entryState);
    requirement.entryStateSha256 = entryStateSha256(requirement.entryState);
  }
  return {coverage: repairedCoverage, preimageCoverage, repairs, unresolved};
}

async function loadSourceReport() {
  const sourceRecord = await record(SOURCE_REPORT_PATH);
  const sourceReport = JSON.parse(sourceRecord.bytesValue);
  invariant(sourceReport.schemaVersion === 1
    && sourceReport.reportType === "g4-l3-unresolved-frame-domain-materialization"
    && sourceReport.items?.length === 20
    && sourceReport.summary?.materializedFrameDomains === 149
    && sourceReport.summary?.newPendingRequirements === 298
    && sourceReport.summary?.authoritativeRuntimeSessions === 0
    && sourceReport.summary?.strictCompletions === 0
    && Object.values(sourceReport.acceptance || {}).every((value) => value === false),
  "Source materialization receipt drifted or contains an acceptance claim");
  const sourceGenerator = await record(sourceReport.generator.path);
  exactBinding(binding(sourceGenerator), sourceReport.generator, "Source materialization generator");
  const [singleRecord, multiRecord] = await Promise.all([
    record(sourceReport.backup?.sourceSnapshots?.singleFrameCandidates?.path),
    record(sourceReport.backup?.sourceSnapshots?.multiFrameCandidates?.path),
  ]);
  exactBinding(binding(singleRecord), sourceReport.backup.sourceSnapshots.singleFrameCandidates,
    "Source single-frame candidate snapshot");
  exactBinding(binding(multiRecord), sourceReport.backup.sourceSnapshots.multiFrameCandidates,
    "Source multi-frame candidate snapshot");
  return {
    sourceRecord,
    sourceReport,
    singleCandidates: JSON.parse(singleRecord.bytesValue),
    multiCandidates: JSON.parse(multiRecord.bytesValue),
  };
}

async function reconstructSourceItem(sourceItem, singleCandidates, multiCandidates) {
  const [beforeManifestRecord, beforeCoverageRecord, dispositionRecord] = await Promise.all([
    record(sourceItem.before.migrationJson.backupPath),
    record(sourceItem.before.fullFrameCoverage.backupPath),
    record(sourceItem.sourceDisposition.backupPath),
  ]);
  exactBinding(binding(beforeManifestRecord), {
    path: sourceItem.before.migrationJson.backupPath,
    bytes: sourceItem.before.migrationJson.bytes,
    sha256: sourceItem.before.migrationJson.sha256,
  }, `${sourceItem.animationId} source migration preimage`);
  exactBinding(binding(beforeCoverageRecord), {
    path: sourceItem.before.fullFrameCoverage.backupPath,
    bytes: sourceItem.before.fullFrameCoverage.bytes,
    sha256: sourceItem.before.fullFrameCoverage.sha256,
  }, `${sourceItem.animationId} source coverage preimage`);
  exactBinding(binding(dispositionRecord), {
    path: sourceItem.sourceDisposition.backupPath,
    bytes: sourceItem.sourceDisposition.bytes,
    sha256: sourceItem.sourceDisposition.sha256,
  }, `${sourceItem.animationId} source disposition preimage`);
  const expected = buildExpandedDocuments({
    sequence: sourceItem.sequence,
    manifest: JSON.parse(beforeManifestRecord.bytesValue),
    coverage: JSON.parse(beforeCoverageRecord.bytesValue),
    disposition: JSON.parse(dispositionRecord.bytesValue),
    singleMember: candidateByAnimation(singleCandidates, sourceItem.animationId),
    multiMember: candidateByAnimation(multiCandidates, sourceItem.animationId),
  });
  const expectedManifestBytes = Buffer.from(pretty(expected.manifest));
  const expectedCoverageBytes = Buffer.from(pretty(expected.coverage));
  invariant(expectedManifestBytes.length === sourceItem.after.migrationJson.bytes
    && sha256(expectedManifestBytes) === sourceItem.after.migrationJson.sha256
    && expectedCoverageBytes.length === sourceItem.after.fullFrameCoverage.bytes
    && sha256(expectedCoverageBytes) === sourceItem.after.fullFrameCoverage.sha256,
  `${sourceItem.animationId}: source materialization receipt cannot be reconstructed`);
  return expected;
}

async function buildPlans(sourceReport, singleCandidates, multiCandidates, {allowRepaired}) {
  const plans = [];
  for (const sourceItem of sourceReport.items) {
    const sourceExpected = await reconstructSourceItem(sourceItem, singleCandidates, multiCandidates);
    const [manifestRecord, coverageRecord] = await Promise.all([
      record(sourceItem.after.migrationJson.path),
      record(sourceItem.after.fullFrameCoverage.path),
    ]);
    const manifest = JSON.parse(manifestRecord.bytesValue);
    const coverage = JSON.parse(coverageRecord.bytesValue);
    for (const sourceDomain of sourceExpected.domains) {
      const currentDomains = (manifest.implementation?.frameDomains || [])
        .filter(({id}) => id === sourceDomain.id);
      invariant(currentDomains.length === 1 && pretty(currentDomains[0]) === pretty(sourceDomain),
        `${sourceItem.animationId}/${sourceDomain.id}: materialized frame-domain source identity drifted`);
    }
    const repaired = repairCoverageDocument({
      sourceItem,
      sourceRequirements: sourceExpected.newRequirements,
      manifest,
      coverage,
      allowRepaired,
    });
    const afterBytes = Buffer.from(pretty(repaired.coverage));
    plans.push({sourceItem, sourceExpected, manifest, manifestRecord, coverageRecord, afterBytes, ...repaired});
  }
  const repairedRequirements = plans.reduce((sum, plan) => sum + plan.repairs.length, 0);
  const unresolvedRequirements = plans.reduce((sum, plan) => sum + plan.unresolved.length, 0);
  invariant(repairedRequirements === 264 && unresolvedRequirements === 34,
    `Expected 264 source-resolvable and 34 unresolved requirements, found ${repairedRequirements} and ${unresolvedRequirements}`);
  const vb003 = plans.find(({sourceItem}) => sourceItem.animationId === "course-g04-l03-vb-003");
  invariant(vb003?.repairs.length === 6
    && vb003.unresolved.length === 0
    && vb003.repairs.every(({rootEntryFrame}) => rootEntryFrame === 6),
  "VB003 exact six-requirement root-entry repair drifted");
  return {plans, repairedRequirements, unresolvedRequirements};
}

async function atomicWrite(relativePath, bytes) {
  const target = projectPath(relativePath);
  const temporary = `${target}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, target);
}

function markdown(report) {
  return `# G4 L3 materialized root-entry identity successor v2\n\n`
    + `This successor adds a root timeline entry frame only where the existing source placement chain proves the exact value. It leaves every requirement without that proof unresolved.\n\n`
    + `- Materialized requirements inspected: **${report.summary.materializedRequirements}**.\n`
    + `- Source-resolvable root-entry identities repaired: **${report.summary.repairedRequirements}** across **${report.summary.repairedWorkspaces}** workspaces.\n`
    + `- Requirements still unresolved: **${report.summary.unresolvedRequirements}**.\n`
    + `- VB003 repaired requirements: **${report.summary.vb003RepairedRequirements}**, all at root frame **6**.\n`
    + `- Authoritative runtime sessions / fidelity acceptances / audio acceptances / human decisions / strict completions: **0 / 0 / 0 / 0 / 0**.\n\n`
    + `The repaired fields are planning and deterministic-capture identities only. They do not prove nested-domain rendering, original-runtime reachability, behavior, audio, visual fidelity, human review, owner acceptance, strict completion, or publication.\n`;
}

async function loadPreviousReport(sourceRecord, sourceReport) {
  const previousRecord = await record(PREVIOUS_REPORT_PATH);
  const previousReport = JSON.parse(previousRecord.bytesValue);
  invariant(previousReport.schemaVersion === 1
    && previousReport.reportType === "g4-l3-materialized-root-entry-identity-successor"
    && previousReport.items?.length === 20
    && previousReport.summary?.repairedRequirements === 264
    && previousReport.summary?.unresolvedRequirements === 34
    && Object.values(previousReport.acceptance || {}).every((value) => value === false),
  "Previous root-entry transaction report drifted or was promoted");
  exactBinding(previousReport.sourceMaterialization, binding(sourceRecord), "Previous root-entry source receipt");
  exactBinding(previousReport.sourceMaterializationGenerator, sourceReport.generator, "Previous root-entry source generator");
  return {previousRecord, previousReport};
}

async function verifyExisting(sourceRecord, sourceReport, singleCandidates, multiCandidates, previousRecord, previousReport) {
  const [reportRecord, markdownRecord] = await Promise.all([record(REPORT_PATH), record(MARKDOWN_PATH)]);
  const report = JSON.parse(reportRecord.bytesValue);
  invariant(report.schemaVersion === 1
    && report.reportType === "g4-l3-materialized-root-entry-identity-successor-v2",
  "Root-entry successor report identity drifted");
  exactBinding(report.previousReport, binding(previousRecord), "Root-entry successor previous transaction");
  exactBinding(report.sourceMaterialization, binding(sourceRecord), "Root-entry successor source receipt");
  exactBinding(report.sourceMaterializationGenerator, sourceReport.generator, "Root-entry successor source generator");
  exactBinding(report.generator, binding(await record(portable(path.relative(ROOT, SCRIPT_PATH)))), "Root-entry successor generator");
  const built = await buildPlans(sourceReport, singleCandidates, multiCandidates, {allowRepaired: true});
  for (const plan of built.plans) {
    invariant(plan.coverageRecord.bytesValue.equals(plan.afterBytes), `${plan.sourceItem.animationId}: successor coverage is stale`);
    const row = report.items.find(({animationId}) => animationId === plan.sourceItem.animationId);
    const previousRow = previousReport.items.find(({animationId}) => animationId === plan.sourceItem.animationId);
    invariant(previousRow && pretty(row.before) === pretty(previousRow.before)
      && pretty(row.after) === pretty(previousRow.after)
      && pretty(row.backup) === pretty(previousRow.backup),
    `${plan.sourceItem.animationId}: v2 transaction lineage drifted`);
    exactBinding(row?.sourceMaterializationCoverage, plan.sourceItem.after.fullFrameCoverage,
      `${plan.sourceItem.animationId} materialization lineage`);
    invariant(row.repairedRequirements === plan.repairs.length
      && row.unresolvedRequirements === plan.unresolved.length
      && pretty(row.repairs) === pretty(plan.repairs)
      && pretty(row.unresolved) === pretty(plan.unresolved),
    `${plan.sourceItem.animationId}: report counts drifted`);
    const backupRecord = await record(row.backup.path);
    exactBinding(row.backup, binding(backupRecord), `${plan.sourceItem.animationId} backup`);
    invariant(row.backup.bytes === row.before.bytes && row.backup.sha256 === row.before.sha256,
    `${plan.sourceItem.animationId}: backup does not bind the exact successor preimage`);
    const transactionRepair = repairCoverageDocument({
      sourceItem: plan.sourceItem,
      sourceRequirements: plan.sourceExpected.newRequirements,
      manifest: plan.manifest,
      coverage: JSON.parse(backupRecord.bytesValue),
      allowRepaired: false,
    });
    const transactionAfterBytes = Buffer.from(pretty(transactionRepair.coverage));
    exactBinding(row.before, {
      path: plan.coverageRecord.path,
      bytes: backupRecord.bytes,
      sha256: backupRecord.sha256,
    }, `${plan.sourceItem.animationId} transaction preimage`);
    exactBinding(row.after, {
      path: plan.coverageRecord.path,
      bytes: transactionAfterBytes.length,
      sha256: sha256(transactionAfterBytes),
    }, `${plan.sourceItem.animationId} historical transaction output`);
  }
  invariant(report.items.length === 20
    && report.summary?.materializedRequirements === 298
    && report.summary?.repairedWorkspaces === 20
    && report.summary?.repairedRequirements === 264
    && report.summary?.unresolvedRequirements === 34
    && report.summary?.vb003RepairedRequirements === 6
    && Object.values(report.acceptance || {}).every((value) => value === false),
  "Root-entry successor summary drifted or was promoted");
  invariant(markdownRecord.bytesValue.equals(Buffer.from(markdown(report))), "Root-entry successor Markdown is stale");
  return report;
}

async function writeSuccessor(
  sourceRecord,
  sourceReport,
  singleCandidates,
  multiCandidates,
  previousRecord,
  previousReport,
) {
  const built = await buildPlans(sourceReport, singleCandidates, multiCandidates, {allowRepaired: true});
  const items = built.plans.map((plan) => {
    const previousRow = previousReport.items.find(({animationId}) => animationId === plan.sourceItem.animationId);
    invariant(previousRow, `${plan.sourceItem.animationId}: previous transaction row is missing`);
    return {
      sequence: plan.sourceItem.sequence,
      animationId: plan.sourceItem.animationId,
      sourceMaterializationCoverage: plan.sourceItem.after.fullFrameCoverage,
      before: previousRow.before,
      after: previousRow.after,
      backup: previousRow.backup,
      currentCoverageAtSuccessor: binding(plan.coverageRecord),
      repairedRequirements: plan.repairs.length,
      unresolvedRequirements: plan.unresolved.length,
      repairs: plan.repairs,
      unresolved: plan.unresolved,
    };
  });
  const report = {
      schemaVersion: 1,
      reportType: "g4-l3-materialized-root-entry-identity-successor-v2",
      generator: binding(await record(portable(path.relative(ROOT, SCRIPT_PATH)))),
      previousReport: binding(previousRecord),
      sourceMaterialization: binding(sourceRecord),
      sourceMaterializationGenerator: sourceReport.generator,
      backup: previousReport.backup,
      items,
      summary: {
        materializedRequirements: 298,
        repairedWorkspaces: items.filter(({repairedRequirements}) => repairedRequirements > 0).length,
        repairedRequirements: built.repairedRequirements,
        unresolvedRequirements: built.unresolvedRequirements,
        vb003RepairedRequirements: items.find(({animationId}) => animationId === "course-g04-l03-vb-003").repairedRequirements,
        authoritativeRuntimeSessions: 0,
        fidelityAcceptances: 0,
        audioAcceptances: 0,
        humanDecisions: 0,
        strictCompletions: 0,
      },
      acceptance: {
        authoritativeOriginalRuntime: false,
        fidelityAccepted: false,
        audioAccepted: false,
        humanVisualAccepted: false,
        ownerAccepted: false,
        strictComplete: false,
        published: false,
      },
      strictAcceptanceEffect: "none; planning and deterministic-capture identity repair only",
  };
  invariant(report.summary.repairedWorkspaces === 20, "Expected all 20 materialized workspaces to have a source-resolvable repair");
  await atomicWrite(MARKDOWN_PATH, Buffer.from(markdown(report)));
  await atomicWrite(REPORT_PATH, Buffer.from(pretty(report)));
  return verifyExisting(
    sourceRecord,
    sourceReport,
    singleCandidates,
    multiCandidates,
    previousRecord,
    previousReport,
  );
}

export async function run({write = false} = {}) {
  const {sourceRecord, sourceReport, singleCandidates, multiCandidates} = await loadSourceReport();
  const {previousRecord, previousReport} = await loadPreviousReport(sourceRecord, sourceReport);
  const existing = await lstat(projectPath(REPORT_PATH)).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (existing) return verifyExisting(
    sourceRecord,
    sourceReport,
    singleCandidates,
    multiCandidates,
    previousRecord,
    previousReport,
  );
  if (!write) {
    await buildPlans(sourceReport, singleCandidates, multiCandidates, {allowRepaired: true});
    invariant(false, "Root-entry successor preflight passed but the report is missing; rerun with --write after review");
  }
  return writeSuccessor(
    sourceRecord,
    sourceReport,
    singleCandidates,
    multiCandidates,
    previousRecord,
    previousReport,
  );
}

export function parseArguments(argv) {
  invariant(argv.length <= 1, "Use zero arguments for check mode or --write");
  if (!argv.length) return {write: false};
  invariant(argv[0] === "--write", `Unknown option: ${argv[0]}`);
  return {write: true};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  run(parseArguments(process.argv.slice(2))).then((report) => {
    process.stdout.write(`PASS: ${report.summary.repairedRequirements}/298 source-proven root-entry identities; ${report.summary.unresolvedRequirements} remain unresolved; strict completion 0.\n`);
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
