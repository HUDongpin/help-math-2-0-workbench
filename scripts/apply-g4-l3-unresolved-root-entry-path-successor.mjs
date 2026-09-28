#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {chmod, copyFile, lstat, mkdir, readFile, rename, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const AUDIT_PATH = "reports/g4-l3-unresolved-root-entry-placement-path-audit.json";
const SOURCE_REPORT_PATH = "reports/g4-l3-materialized-root-entry-identity-successor-v2.json";
const REPORT_PATH = "reports/g4-l3-unresolved-root-entry-path-successor.json";
const MARKDOWN_PATH = "reports/g4-l3-unresolved-root-entry-path-successor.md";

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
  return {path: relativePath, bytes: bytesValue.length, sha256: sha256(bytesValue), bytesValue};
}

function binding(fileRecord) {
  return {path: fileRecord.path, bytes: fileRecord.bytes, sha256: fileRecord.sha256};
}

function exactBinding(actual, expected, label) {
  invariant(actual.path === expected?.path && actual.bytes === expected?.bytes && actual.sha256 === expected?.sha256,
    `${label} binding drifted`);
}

function entryStateSha256(entryState) {
  return sha256(Buffer.from(canonicalJson(entryState)));
}

export function applyRootEntryRepairs({coverage, animationId, domains, allowRepaired = false}) {
  invariant(coverage.schemaVersion === 2 && coverage.animationId === animationId && Array.isArray(coverage.requirements),
    `${animationId}: coverage identity drifted`);
  const output = structuredClone(coverage);
  const repairs = [];
  for (const domain of domains) {
    invariant(domain.rootEntryFrame === 6 && domain.rootInstanceName.toLowerCase() === "animation"
      && domain.pathCount >= 1 && domain.requirements.length === 2,
    `${animationId}/${domain.targetTimelineId}: source path decision drifted`);
    for (const requirementId of domain.requirements) {
      const indexes = coverage.requirements
        .map((requirement, index) => requirement.requirementId === requirementId ? index : -1)
        .filter((index) => index >= 0);
      invariant(indexes.length === 1, `${animationId}/${requirementId}: coverage requirement is missing or duplicated`);
      const index = indexes[0];
      const current = coverage.requirements[index];
      invariant(current.frameDomainId === domain.targetTimelineId
        && current.entryState?.frameDomainId === domain.targetTimelineId
        && current.entryState?.kind === "lesson-shell-natural-entry-to-source-static-reachable-domain"
        && current.status === "pending"
        && current.baselineAuthority === "unresolved"
        && current.capturedFrameCount === 0
        && current.captureManifest === ""
        && current.baselineCaptureManifest === ""
        && current.metricsFile === "",
      `${animationId}/${requirementId}: requirement is no longer the pending repair preimage`);
      invariant(current.entryStateSha256 === entryStateSha256(current.entryState),
        `${animationId}/${requirementId}: current entry-state hash is stale`);
      const hasRootEntryFrame = Object.hasOwn(current.entryState, "rootEntryFrame");
      invariant(!hasRootEntryFrame || (allowRepaired && current.entryState.rootEntryFrame === domain.rootEntryFrame),
        `${animationId}/${requirementId}: root entry frame conflicts with the source-path audit`);
      const nextEntryState = stable({...current.entryState, rootEntryFrame: domain.rootEntryFrame});
      output.requirements[index].entryState = nextEntryState;
      output.requirements[index].entryStateSha256 = entryStateSha256(nextEntryState);
      repairs.push({
        requirementId,
        frameDomainId: domain.targetTimelineId,
        rootEntryFrame: domain.rootEntryFrame,
        entryStateSha256: output.requirements[index].entryStateSha256,
      });
    }
  }
  return {coverage: output, repairs};
}

function verifyCurrentRepairDescendants({coverage, animationId, repairs}) {
  invariant(coverage.schemaVersion === 2 && coverage.animationId === animationId,
    `${animationId}: current coverage identity drifted`);
  for (const repair of repairs) {
    const matches = coverage.requirements.filter(({requirementId}) => requirementId === repair.requirementId);
    invariant(matches.length === 1, `${animationId}/${repair.requirementId}: repaired requirement disappeared or duplicated`);
    const current = matches[0];
    invariant(current.frameDomainId === repair.frameDomainId
      && current.entryState?.frameDomainId === repair.frameDomainId
      && current.entryState?.rootEntryFrame === repair.rootEntryFrame
      && current.entryStateSha256 === entryStateSha256(current.entryState),
    `${animationId}/${repair.requirementId}: source-proven root-entry identity drifted`);
  }
}

async function loadInputs() {
  const [auditRecord, sourceRecord, generatorRecord] = await Promise.all([
    record(AUDIT_PATH),
    record(SOURCE_REPORT_PATH),
    record(path.relative(ROOT, SCRIPT_PATH)),
  ]);
  const audit = JSON.parse(auditRecord.bytesValue);
  const source = JSON.parse(sourceRecord.bytesValue);
  invariant(audit.schemaVersion === 1
    && audit.reportType === "g4-l3-unresolved-root-entry-placement-path-audit"
    && audit.summary?.requirementsInspected === 34
    && audit.summary?.sourceResolvableRequirements === 34
    && audit.summary?.ambiguousRequirements === 0
    && audit.summary?.strictCompletions === 0
    && Object.values(audit.acceptance || {}).every((value) => value === false),
  "Placement-path audit drifted or changed acceptance scope");
  exactBinding(binding(await record(audit.generator.path)), audit.generator, "Placement-path audit generator");
  invariant(source.schemaVersion === 1
    && source.reportType === "g4-l3-materialized-root-entry-identity-successor-v2"
    && source.summary?.unresolvedRequirements === 34
    && source.summary?.strictCompletions === 0,
  "Root-entry v2 source report drifted or changed acceptance scope");
  exactBinding(audit.sourceRootEntrySuccessor, binding(sourceRecord), "Placement-path audit source report");
  return {auditRecord, audit, sourceRecord, source, generatorRecord};
}

async function buildPreimagePlans(audit) {
  const plans = [];
  for (const auditItem of audit.items) {
    const coveragePath = `migrations/${auditItem.animationId}/evidence/full-frame-coverage.json`;
    const coverageRecord = await record(coveragePath);
    const coverage = JSON.parse(coverageRecord.bytesValue);
    const repaired = applyRootEntryRepairs({
      coverage,
      animationId: auditItem.animationId,
      domains: auditItem.domains,
      allowRepaired: false,
    });
    const afterBytes = Buffer.from(pretty(repaired.coverage));
    invariant(!coverageRecord.bytesValue.equals(afterBytes),
      `${auditItem.animationId}: repair target is already current without a successor receipt`);
    plans.push({auditItem, coveragePath, coverageRecord, coverage, afterBytes, ...repaired});
  }
  invariant(plans.length === 7 && plans.reduce((sum, plan) => sum + plan.repairs.length, 0) === 34,
    "Expected exactly 7 workspaces and 34 root-entry repairs");
  return plans;
}

async function atomicReplace(relativePath, bytes) {
  const target = projectPath(relativePath);
  const temporary = `${target}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, target);
}

async function writeCoverageWithRollback(plans) {
  const written = [];
  try {
    for (const plan of plans) {
      await atomicReplace(plan.coveragePath, plan.afterBytes);
      written.push(plan);
    }
  } catch (error) {
    for (const plan of written.reverse()) await atomicReplace(plan.coveragePath, plan.coverageRecord.bytesValue);
    throw error;
  }
}

function markdown(report) {
  return `# G4 L3 unresolved root-entry path successor\n\n`
    + `The **${report.summary.repairedRequirements}** previously unresolved EN/ES capture requirements across **${report.summary.repairedFrameDomains}** domains and **${report.summary.repairedWorkspaces}** workspaces now carry the source-proven root entry frame **6** and a refreshed canonical entry-state hash.\n\n`
    + `All requirements remained pending when repaired. Authoritative runtime, fidelity acceptance, audio listening acceptance, human review, Owner acceptance, strict completion, and publication remain **0 / 0 / 0 / 0 / 0 / 0 / 0**.\n\n`
    + `The exact preimages are retained read-only under \`${report.backup.root}\`.\n`;
}

async function verifyExisting(inputs) {
  const [reportRecord, markdownRecord] = await Promise.all([record(REPORT_PATH), record(MARKDOWN_PATH)]);
  const report = JSON.parse(reportRecord.bytesValue);
  invariant(report.schemaVersion === 1
    && report.reportType === "g4-l3-unresolved-root-entry-path-successor"
    && report.summary?.repairedWorkspaces === 7
    && report.summary?.repairedFrameDomains === 17
    && report.summary?.repairedRequirements === 34
    && report.summary?.strictCompletions === 0
    && Object.values(report.acceptance || {}).every((value) => value === false),
  "Root-entry path successor drifted or changed acceptance scope");
  exactBinding(report.generator, binding(inputs.generatorRecord), "Root-entry path successor generator");
  exactBinding(report.sourcePlacementPathAudit, binding(inputs.auditRecord), "Root-entry path successor audit");
  exactBinding(report.sourceRootEntrySuccessorV2, binding(inputs.sourceRecord), "Root-entry path successor v2 lineage");
  for (const item of report.items) {
    const backupRecord = await record(item.backup.path);
    exactBinding(item.backup, binding(backupRecord), `${item.animationId} repair preimage`);
    exactBinding(item.before, {
      path: item.coveragePath,
      bytes: backupRecord.bytes,
      sha256: backupRecord.sha256,
    }, `${item.animationId} historical repair preimage`);
    const auditItem = inputs.audit.items.find(({animationId}) => animationId === item.animationId);
    invariant(auditItem, `${item.animationId}: source audit row is missing`);
    const rebuilt = applyRootEntryRepairs({
      coverage: JSON.parse(backupRecord.bytesValue),
      animationId: item.animationId,
      domains: auditItem.domains,
      allowRepaired: false,
    });
    const rebuiltBytes = Buffer.from(pretty(rebuilt.coverage));
    exactBinding(item.after, {
      path: item.coveragePath,
      bytes: rebuiltBytes.length,
      sha256: sha256(rebuiltBytes),
    }, `${item.animationId} historical repair output`);
    invariant(pretty(item.repairs) === pretty(rebuilt.repairs), `${item.animationId}: repair list drifted`);
    const current = JSON.parse((await record(item.coveragePath)).bytesValue);
    verifyCurrentRepairDescendants({coverage: current, animationId: item.animationId, repairs: item.repairs});
  }
  invariant(markdownRecord.bytesValue.equals(Buffer.from(markdown(report))), "Root-entry path successor Markdown is stale");
  return report;
}

async function writeSuccessor(inputs) {
  const plans = await buildPreimagePlans(inputs.audit);
  const preimageRows = plans.map(({auditItem, coveragePath, coverageRecord}) => ({
    animationId: auditItem.animationId,
    path: coveragePath,
    bytes: coverageRecord.bytes,
    sha256: coverageRecord.sha256,
  }));
  const preimageSetSha256 = sha256(Buffer.from(canonicalJson(preimageRows)));
  const backupRoot = `work/g4-l3-unresolved-root-entry-path-preimages/${preimageSetSha256}`;
  await mkdir(projectPath(backupRoot), {recursive: true});
  for (const plan of plans) {
    const itemRoot = `${backupRoot}/${plan.auditItem.animationId}`;
    await mkdir(projectPath(itemRoot), {recursive: true});
    const backupPath = `${itemRoot}/full-frame-coverage.json`;
    await copyFile(projectPath(plan.coveragePath), projectPath(backupPath), fsConstants.COPYFILE_EXCL);
    await chmod(projectPath(backupPath), 0o444);
    plan.backupPath = backupPath;
  }
  await writeCoverageWithRollback(plans);
  const items = plans.map((plan) => ({
    sequence: plan.auditItem.sequence,
    animationId: plan.auditItem.animationId,
    coveragePath: plan.coveragePath,
    before: binding(plan.coverageRecord),
    after: {path: plan.coveragePath, bytes: plan.afterBytes.length, sha256: sha256(plan.afterBytes)},
    backup: {path: plan.backupPath, bytes: plan.coverageRecord.bytes, sha256: plan.coverageRecord.sha256},
    repairedFrameDomains: plan.auditItem.domains.length,
    repairedRequirements: plan.repairs.length,
    repairs: plan.repairs,
  }));
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-unresolved-root-entry-path-successor",
    generator: binding(inputs.generatorRecord),
    sourcePlacementPathAudit: binding(inputs.auditRecord),
    sourceRootEntrySuccessorV2: binding(inputs.sourceRecord),
    backup: {root: backupRoot, preimageSetSha256, readOnly: true, ignoredWorkArtifact: true},
    items,
    summary: {
      repairedWorkspaces: items.length,
      repairedFrameDomains: items.reduce((sum, item) => sum + item.repairedFrameDomains, 0),
      repairedRequirements: items.reduce((sum, item) => sum + item.repairedRequirements, 0),
      remainingUnresolvedRootEntryRequirements: 0,
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
    strictAcceptanceEffect: "none; pending deterministic-capture identity repair only",
  };
  await atomicReplace(MARKDOWN_PATH, Buffer.from(markdown(report)));
  await atomicReplace(REPORT_PATH, Buffer.from(pretty(report)));
  return verifyExisting(inputs);
}

export async function run({write = false} = {}) {
  const inputs = await loadInputs();
  const existing = await lstat(projectPath(REPORT_PATH)).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (existing) return verifyExisting(inputs);
  invariant(write, "Root-entry path successor is missing; rerun with --write after review");
  return writeSuccessor(inputs);
}

export function parseArguments(argv) {
  invariant(argv.length <= 1, "Use zero arguments for check mode or --write");
  if (!argv.length) return {write: false};
  invariant(argv[0] === "--write", `Unknown option: ${argv[0]}`);
  return {write: true};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  run(parseArguments(process.argv.slice(2))).then((report) => {
    process.stdout.write(`PASS: ${report.summary.repairedRequirements}/34 source-proven root-entry identities applied; 0 remain unresolved; strict completion 0.\n`);
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
