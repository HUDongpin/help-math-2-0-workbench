#!/usr/bin/env node

import {createHash, randomUUID} from "node:crypto";
import {chmod, readFile, rename, stat, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SHA256 = /^[a-f0-9]{64}$/;

export const PRODUCTION_CONTRACT = Object.freeze({
  tiAnimationId: "course-g03-l06-ti-001",
  resolutionPath: "migrations/course-g03-l06-ti-001/audit/host-binding-resolution.json",
  tiSourceSwf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/TI/L6TI01.swf",
  tiSourceSwfSha256: "722b56b73cfc3bcff71c83cf71b00bfc89b4fdd3b147ecb43646f644f45dc739",
  dependencyArtifactId: "paired-common-authoring-audit",
  dependencyPath: "migrations/course-g04-l01-ir-001/audit/adobe-animate-2021-authoring-audit.json",
  expectedPriorDependencySha256: "71a977a61ff114ebb145f0505a9904ef628cceab6f83f2501c84d5f9f0501042",
  expectedCurrentDependencySha256: "27de76cabebadbf1dd58dc9562c15b4786c93ffb5cc7be350aadaa07dc5241d7",
  expectedPriorResolutionSha256: "fa14606bc3be45836d3c51c5b3be4c712aef78f7fe4fb5247eb0718bb8a74667",
  irAnimationId: "course-g04-l01-ir-001",
  irManifestPath: "migrations/course-g04-l01-ir-001/migration.json",
  irSourceFla: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/IR/L1RW01.fla",
  irSourceFlaSha256: "c4ba5fd0b37b1a1ad622f4fdf89295a6b76c820588a8000b239b0f4d68984fb9",
});

const AUTHORING_EVIDENCE_KIND = "adobe-animate-2021-cold-start-authoring-audit";
const AUTHORING_AUTHORITY = "Original owner-provided FLA inspected read-only in Adobe Animate 2021";
const AUTHORING_BINDING_PATH = "audit/adobe-animate-2021-authoring-audit.json";
const AMENDMENT_ID = "ti001-paired-common-authoring-audit-binding-refresh";
const AMENDMENT_REASON = "The paired IR001 authoring audit was superseded by its current canonical schema-v2 audit under the same source identity. This machine amendment refreshes only the exact raw-file SHA dependency pin; it does not reinterpret the host-binding resolution or grant runtime, human, owner, audio, or visual acceptance.";

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function projectFile(root, declared, label) {
  invariant(typeof declared === "string" && declared.length > 0, `${label}: path is missing`);
  invariant(!path.isAbsolute(declared) && !declared.includes("\\") && !declared.includes("\0"), `${label}: path must be portable and relative`);
  invariant(path.posix.normalize(declared) === declared && declared !== ".." && !declared.startsWith("../"), `${label}: path is not normalized or escapes the project root`);
  const resolved = path.resolve(root, ...declared.split("/"));
  const relative = path.relative(root, resolved);
  invariant(relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), `${label}: path escapes the project root`);
  return resolved;
}

async function readJsonRecord(file, label) {
  const bytes = await readFile(file);
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
  return {bytes, text: bytes.toString("utf8"), value, sha256: sha256(bytes)};
}

function expectedAmendment(contract) {
  return {
    schemaVersion: 1,
    amendmentId: AMENDMENT_ID,
    evidenceKind: "machine-binding-only-amendment",
    dependency: {
      artifactId: contract.dependencyArtifactId,
      path: contract.dependencyPath,
      priorSha256: contract.expectedPriorDependencySha256,
      currentSha256: contract.expectedCurrentDependencySha256,
    },
    priorResolutionSha256: contract.expectedPriorResolutionSha256,
    reason: AMENDMENT_REASON,
    changedField: `evidenceArtifacts[artifactId=${contract.dependencyArtifactId}].sha256`,
    preservedClaims: ["authority", "entryHandoff", "commonComponentEvidence", "bindings", "remainingAuthoritativeBlockers", "strictAcceptanceEffect"],
    generatedBy: {script: "scripts/refresh-ti-host-binding-authoring-audit-pin.mjs", deterministic: true},
    strictAcceptanceEffect: "none",
  };
}

async function verifySource(root, declared, expectedSha256, label) {
  invariant(SHA256.test(expectedSha256 || ""), `${label}: expected SHA-256 is invalid`);
  const file = projectFile(root, declared, label);
  const bytes = await readFile(file);
  invariant(sha256(bytes) === expectedSha256, `${label}: source bytes do not match the declared SHA-256`);
}

async function inspectCurrentAuthoringAudit({root, contract}) {
  invariant(SHA256.test(contract.expectedCurrentDependencySha256 || ""), "current authoring-audit SHA-256 contract is invalid");
  const [auditRecord, manifestRecord] = await Promise.all([
    readJsonRecord(projectFile(root, contract.dependencyPath, "IR001 canonical authoring audit"), "IR001 canonical authoring audit"),
    readJsonRecord(projectFile(root, contract.irManifestPath, "IR001 migration manifest"), "IR001 migration manifest"),
  ]);
  const audit = auditRecord.value;
  const manifest = manifestRecord.value;
  invariant(auditRecord.sha256 === contract.expectedCurrentDependencySha256, `IR001 canonical authoring audit SHA changed: expected ${contract.expectedCurrentDependencySha256}, observed ${auditRecord.sha256}`);
  invariant(audit.schemaVersion === 2, "IR001 canonical authoring audit must be schema v2");
  invariant(audit.evidenceKind === AUTHORING_EVIDENCE_KIND, "IR001 canonical authoring audit kind is invalid");
  invariant(audit.authority === AUTHORING_AUTHORITY, "IR001 canonical authoring audit authority is invalid");
  invariant(audit.animationId === contract.irAnimationId, "IR001 canonical authoring audit identity mismatch");
  invariant(manifest.animationId === contract.irAnimationId && manifest.id === contract.irAnimationId, "IR001 migration identity mismatch");
  invariant(audit.source?.fla === contract.irSourceFla && manifest.source?.fla === contract.irSourceFla, "IR001 FLA path identity mismatch");
  invariant(audit.source?.flaSha256 === contract.irSourceFlaSha256 && manifest.source?.flaSha256 === contract.irSourceFlaSha256, "IR001 FLA SHA identity mismatch");
  invariant(audit.protocol?.openedWithoutSaving === true && audit.protocol?.originalSourceHashVerified === true, "IR001 canonical no-save/source-verification protocol is incomplete");
  invariant(audit.protocol?.recursiveLibraryTimelineAuditVerified === true, "IR001 canonical recursive authoring audit is incomplete");
  invariant(audit.authoringAudit?.schemaVersion === 1 && audit.authoringAudit?.evidenceKind === "adobe-animate-authoring-audit", "IR001 embedded authoring audit identity is invalid");
  invariant(SHA256.test(audit.rawAuditSha256 || "") && sha256(Buffer.from(JSON.stringify(audit.authoringAudit))) === audit.rawAuditSha256, "IR001 embedded authoring audit hash mismatch");
  invariant(audit.nativeMovie?.width === manifest.runtime?.stage?.width && audit.nativeMovie?.height === manifest.runtime?.stage?.height, "IR001 authoring stage differs from migration runtime");
  invariant(audit.nativeMovie?.fps === manifest.runtime?.fps && audit.nativeMovie?.frameCount === manifest.runtime?.frameCount, "IR001 authoring timeline differs from migration runtime");
  const binding = manifest.audit?.machineEvidence?.authoringEvidence;
  invariant(binding?.schemaVersion === 2 && binding.evidenceKind === AUTHORING_EVIDENCE_KIND, "IR001 manifest does not bind the current schema-v2 authoring contract");
  invariant(binding.file === AUTHORING_BINDING_PATH && binding.sha256 === auditRecord.sha256, "IR001 manifest authoring-evidence binding is stale");
  await verifySource(root, contract.irSourceFla, contract.irSourceFlaSha256, "IR001 owner-provided FLA");
  return auditRecord;
}

export async function planTiHostBindingAuthoringAuditPin({root = PROJECT_ROOT, contract = PRODUCTION_CONTRACT} = {}) {
  for (const key of ["expectedPriorDependencySha256", "expectedCurrentDependencySha256", "expectedPriorResolutionSha256", "tiSourceSwfSha256", "irSourceFlaSha256"]) {
    invariant(SHA256.test(contract[key] || ""), `${key}: invalid SHA-256 contract`);
  }
  await inspectCurrentAuthoringAudit({root, contract});
  await verifySource(root, contract.tiSourceSwf, contract.tiSourceSwfSha256, "TI001 owner-provided SWF");

  const resolutionFile = projectFile(root, contract.resolutionPath, "TI001 host-binding resolution");
  const record = await readJsonRecord(resolutionFile, "TI001 host-binding resolution");
  const report = record.value;
  invariant(report.schemaVersion === 1 && report.animationId === contract.tiAnimationId, "TI001 host-binding resolution identity mismatch");
  invariant(report.source?.swf === contract.tiSourceSwf && report.source?.swfSha256 === contract.tiSourceSwfSha256, "TI001 host-binding resolution source identity mismatch");
  const matches = (report.evidenceArtifacts || []).filter(({artifactId}) => artifactId === contract.dependencyArtifactId);
  invariant(matches.length === 1, `TI001 host-binding resolution must contain exactly one ${contract.dependencyArtifactId} dependency`);
  const dependency = matches[0];
  invariant(dependency.path === contract.dependencyPath, `TI001 ${contract.dependencyArtifactId} dependency path changed`);
  invariant([contract.expectedPriorDependencySha256, contract.expectedCurrentDependencySha256].includes(dependency.sha256), `TI001 ${contract.dependencyArtifactId} dependency SHA is neither the authorized prior nor current value`);

  const amendment = expectedAmendment(contract);
  const amendments = report.machineBindingAmendments;
  invariant(amendments === undefined || Array.isArray(amendments), "TI001 machineBindingAmendments must be an array when present");
  const matchingAmendments = (amendments || []).filter(({amendmentId}) => amendmentId === AMENDMENT_ID);
  invariant(matchingAmendments.length <= 1, `TI001 contains duplicate ${AMENDMENT_ID} amendments`);

  if (dependency.sha256 === contract.expectedCurrentDependencySha256) {
    invariant(matchingAmendments.length === 1 && canonicalJson(matchingAmendments[0]) === canonicalJson(amendment), "TI001 current dependency pin lacks the exact machine amendment record");
    return {resolutionFile, beforeText: record.text, updatedText: record.text, changed: false, dependencySha256: dependency.sha256, amendment};
  }

  invariant(record.sha256 === contract.expectedPriorResolutionSha256, `TI001 pre-amendment resolution SHA changed: expected ${contract.expectedPriorResolutionSha256}, observed ${record.sha256}`);
  invariant(matchingAmendments.length === 0, `TI001 has an amendment record while retaining the prior dependency SHA`);
  const updated = structuredClone(report);
  const updatedDependency = updated.evidenceArtifacts.find(({artifactId}) => artifactId === contract.dependencyArtifactId);
  updatedDependency.sha256 = contract.expectedCurrentDependencySha256;
  updated.machineBindingAmendments = [...(updated.machineBindingAmendments || []), amendment];

  const expected = structuredClone(report);
  expected.evidenceArtifacts.find(({artifactId}) => artifactId === contract.dependencyArtifactId).sha256 = contract.expectedCurrentDependencySha256;
  expected.machineBindingAmendments = [...(expected.machineBindingAmendments || []), amendment];
  invariant(canonicalJson(updated) === canonicalJson(expected), "TI001 amendment attempted to change a non-binding field");
  return {
    resolutionFile,
    beforeText: record.text,
    updatedText: `${JSON.stringify(updated, null, 2)}\n`,
    changed: true,
    dependencySha256: contract.expectedCurrentDependencySha256,
    amendment,
  };
}

async function atomicReplace(plan) {
  invariant(await readFile(plan.resolutionFile, "utf8") === plan.beforeText, "TI001 host-binding resolution changed after preflight; no write performed");
  const info = await stat(plan.resolutionFile);
  const temporary = `${plan.resolutionFile}.binding-amendment-${process.pid}-${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, plan.updatedText, {encoding: "utf8", flag: "wx"});
    await chmod(temporary, info.mode & 0o777);
    await rename(temporary, plan.resolutionFile);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

export async function refreshTiHostBindingAuthoringAuditPin({root = PROJECT_ROOT, contract = PRODUCTION_CONTRACT, check = false} = {}) {
  const plan = await planTiHostBindingAuthoringAuditPin({root, contract});
  if (check) {
    invariant(!plan.changed, "TI001 host-binding authoring-audit dependency pin is stale; run refresh-ti-host-binding-authoring-audit-pin.mjs");
    return {...plan, action: "verified"};
  }
  if (plan.changed) await atomicReplace(plan);
  return {...plan, action: plan.changed ? "written" : "unchanged"};
}

export function parseArguments(argv) {
  const options = {check: false, help: false};
  for (const value of argv) {
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function usage() {
  return `Usage: node scripts/refresh-ti-host-binding-authoring-audit-pin.mjs [--check]\n\nValidates the exact TI001 host-binding dependency and the current canonical IR001\nschema-v2 authoring/source identity, then refreshes only that dependency SHA and\nappends a deterministic machine amendment record. It changes no resolution,\nauthority, runtime, implementation, audio, human, owner, or acceptance claim.`;
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) return console.log(usage());
    const result = await refreshTiHostBindingAuthoringAuditPin(options);
    console.log(`${result.action}: ${PRODUCTION_CONTRACT.resolutionPath} -> ${result.dependencySha256}`);
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) await main();
