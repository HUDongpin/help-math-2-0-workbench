#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {chmod, copyFile, lstat, mkdir, readFile, rename, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
  buildExpectedPendingCoverageDocuments,
  canonicalJson,
} from "./materialize-g4-l3-valid-pending-root-coverage.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const releasePath = "catalog/lesson-releases.json";
const runtimeContractPath = "reports/g4-l3-authoritative-runtime-acquisition-contract.json";
const reportPath = "reports/g4-l3-coverage-capture-identity-repair.json";
const markdownPath = "reports/g4-l3-coverage-capture-identity-repair.md";
const excluded = new Set(["course-g04-l03-in-009", "shell-course-g04-l03-index-local"]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

async function record(relativePath) {
  const bytes = await readFile(path.join(projectRoot, relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

function withoutEntryState(requirement) {
  const copy = structuredClone(requirement);
  delete copy.entryState;
  delete copy.entryStateSha256;
  return copy;
}

function legacyEntryState(expectedRequirement) {
  const entryState = structuredClone(expectedRequirement.entryState);
  delete entryState.rootEntryFrame;
  delete entryState.scenario;
  delete entryState.seed;
  if (expectedRequirement.frameDomainId === "root") delete entryState.frameDomainId;
  return entryState;
}

export function repairedCoverageDocument({item, manifest, coverage}) {
  const expected = buildExpectedPendingCoverageDocuments({item, manifest});
  invariant(pretty(expected.manifest) === pretty(manifest), `${item.animationId}: repair may not change migration.json`);
  invariant(coverage.schemaVersion === 2 && coverage.animationId === item.animationId,
    `${item.animationId}: coverage identity drifted`);
  invariant(coverage.requirements?.length === expected.coverage.requirements.length,
    `${item.animationId}: coverage requirement count drifted`);
  for (let index = 0; index < expected.coverage.requirements.length; index += 1) {
    const current = coverage.requirements[index];
    const target = expected.coverage.requirements[index];
    invariant(pretty(withoutEntryState(current)) === pretty(withoutEntryState(target)),
      `${item.animationId}/${target.requirementId}: fields outside entryState drifted`);
    invariant(pretty(current.entryState) === pretty(legacyEntryState(target)),
      `${item.animationId}/${target.requirementId}: legacy entryState is not the exact repair preimage`);
    invariant(current.entryStateSha256 === sha256(Buffer.from(canonicalJson(current.entryState))),
      `${item.animationId}/${target.requirementId}: legacy entryState hash is invalid`);
    invariant(target.entryState.scenario === target.scenario
      && target.entryState.language === target.language
      && String(target.entryState.seed) === String(target.seed)
      && target.entryState.frameDomainId === target.frameDomainId
      && Number.isInteger(target.entryState.rootEntryFrame)
      && target.entryState.rootEntryFrame >= 1,
    `${item.animationId}/${target.requirementId}: repaired capture identity is incomplete`);
  }
  invariant(expected.coverage.requirements.every(({status, baselineAuthority, capturedFrameCount}) =>
    status === "pending" && baselineAuthority === "unresolved" && capturedFrameCount === 0),
  `${item.animationId}: repair attempted to promote coverage authority or status`);
  return expected.coverage;
}

async function loadScope() {
  const [releaseBytes, contractBytes] = await Promise.all([
    readFile(path.join(projectRoot, releasePath)),
    readFile(path.join(projectRoot, runtimeContractPath)),
  ]);
  const releaseCatalog = JSON.parse(releaseBytes);
  const release = releaseCatalog.releases?.find(({releaseId}) => releaseId === "lesson-g04-l03-negative-numbers");
  invariant(release?.publicationMode === "atomic" && release.members?.length === 40,
    "G4 L3 atomic release scope drifted");
  const contract = JSON.parse(contractBytes);
  invariant(contract.summary?.canonicalItems === 40 && contract.items?.length === 40,
    "G4 L3 runtime acquisition contract scope drifted");
  const contractById = new Map(contract.items.map((item) => [item.animationId, item]));
  const items = release.members
    .filter(({animationId}) => !excluded.has(animationId))
    .map(({animationId, ordinal}) => {
      const item = contractById.get(animationId);
      invariant(item?.sequence === ordinal && item.nativeRuntimeFacts?.rootFrameCount >= 1,
        `${animationId}: runtime contract identity drifted`);
      return item;
    });
  invariant(items.length === 38, "Expected exactly 38 capture-identity repair targets");
  return {
    items,
    sourceBindings: {
      lessonRelease: {path: releasePath, bytes: releaseBytes.length, sha256: sha256(releaseBytes)},
      runtimeAcquisitionContract: {path: runtimeContractPath, bytes: contractBytes.length, sha256: sha256(contractBytes)},
    },
  };
}

async function inspect(item, {allowRepaired = true} = {}) {
  const migrationPath = `migrations/${item.animationId}/migration.json`;
  const coveragePath = `migrations/${item.animationId}/evidence/full-frame-coverage.json`;
  const [migrationBytes, coverageBytes] = await Promise.all([
    readFile(path.join(projectRoot, migrationPath)),
    readFile(path.join(projectRoot, coveragePath)),
  ]);
  const manifest = JSON.parse(migrationBytes);
  const coverage = JSON.parse(coverageBytes);
  const expected = buildExpectedPendingCoverageDocuments({item, manifest});
  invariant(pretty(expected.manifest) === pretty(manifest), `${item.animationId}: migration contract drifted`);
  if (allowRepaired && pretty(coverage) === pretty(expected.coverage)) {
    return {item, migrationPath, coveragePath, migrationBytes, coverageBytes, manifest, coverage, repaired: coverage};
  }
  const repaired = repairedCoverageDocument({item, manifest, coverage});
  return {item, migrationPath, coveragePath, migrationBytes, coverageBytes, manifest, coverage, repaired};
}

async function atomicReplace(filePath, bytes) {
  const temporary = `${filePath}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  try {
    await rename(temporary, filePath);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}

async function writeAllWithRollback(plans) {
  const written = [];
  try {
    for (const plan of plans) {
      await atomicReplace(path.join(projectRoot, plan.coveragePath), plan.afterBytes);
      written.push(plan);
    }
  } catch (error) {
    for (const plan of written.reverse()) {
      await atomicReplace(path.join(projectRoot, plan.coveragePath), plan.coverageBytes);
    }
    throw error;
  }
}

function markdown(report) {
  return `# G4 L3 Coverage Capture Identity Repair\n\n`
    + `All ${report.summary.repairedWorkspaces} legacy pending-coverage workspaces now bind scenario, language, seed, frame domain, and root entry frame inside the canonical entry state.\n\n`
    + `- Repaired requirements: **${report.summary.repairedRequirements}**.\n`
    + `- Invalid entry-state capture identities after repair: **0**.\n`
    + `- Runtime sessions / implementation captures / strict completions: **0 / 0 / 0**.\n`
    + `- Preimages: ignored \`${report.backup.root}\`; set SHA-256 \`${report.backup.preimageSetSha256}\`.\n\n`
    + `This repair changes planning identity hashes only. Every requirement remains pending and every runtime, RMSE, audio, human, owner, and release gate remains closed.\n`;
}

async function verifyExisting(scope) {
  const reportBytes = await readFile(path.join(projectRoot, reportPath));
  const report = JSON.parse(reportBytes);
  invariant(report.reportType === "g4-l3-coverage-capture-identity-repair" && report.schemaVersion === 1,
    "Capture-identity repair report identity drifted");
  invariant(pretty(report.generator) === pretty(await record(portable(path.relative(projectRoot, scriptPath)))),
    "Capture-identity repair generator binding is stale");
  invariant(pretty(report.sourceBindings) === pretty(scope.sourceBindings),
    "Capture-identity repair source bindings are stale");
  const rows = [];
  for (const item of scope.items) {
    const current = await inspect(item);
    const afterBytes = Buffer.from(pretty(current.repaired));
    invariant(current.coverageBytes.equals(afterBytes), `${item.animationId}: repaired coverage drifted`);
    const recorded = report.items.find(({animationId}) => animationId === item.animationId);
    invariant(recorded?.sequence === item.sequence
      && recorded.after.path === current.coveragePath
      && recorded.after.bytes === afterBytes.length
      && recorded.after.sha256 === sha256(afterBytes),
    `${item.animationId}: repair receipt is stale`);
    rows.push(recorded);
  }
  invariant(rows.length === 38
    && report.summary?.repairedRequirements === 78
    && report.summary?.invalidCaptureIdentitiesAfter === 0
    && report.summary?.strictCompletions === 0
    && Object.values(report.acceptance || {}).every((value) => value === false),
  "Capture-identity repair summary was promoted or regressed");
  return report;
}

export async function repairG4L3CoverageCaptureIdentities({check = false} = {}) {
  const scope = await loadScope();
  const reportExists = await lstat(path.join(projectRoot, reportPath))
    .then(() => true)
    .catch((error) => error.code === "ENOENT" ? false : Promise.reject(error));
  if (reportExists) return verifyExisting(scope);
  invariant(!check, "Capture-identity repair report is missing");
  const plans = [];
  for (const item of scope.items) {
    const current = await inspect(item, {allowRepaired: false});
    const afterBytes = Buffer.from(pretty(current.repaired));
    invariant(!current.coverageBytes.equals(afterBytes), `${item.animationId}: repair target is already current without a receipt`);
    plans.push({...current, afterBytes});
  }
  const preimageRows = plans.map(({item, coveragePath, coverageBytes}) => ({
    animationId: item.animationId,
    path: coveragePath,
    bytes: coverageBytes.length,
    sha256: sha256(coverageBytes),
  }));
  const preimageSetSha256 = sha256(Buffer.from(canonicalJson(preimageRows)));
  const backupRoot = `work/g4-l3-v2-coverage-capture-identity-preimages/${preimageSetSha256}`;
  await mkdir(path.join(projectRoot, backupRoot), {recursive: true});
  for (const plan of plans) {
    const itemRoot = path.join(projectRoot, backupRoot, plan.item.animationId);
    await mkdir(itemRoot, {recursive: true});
    const destination = path.join(itemRoot, "full-frame-coverage.json");
    await copyFile(path.join(projectRoot, plan.coveragePath), destination, fsConstants.COPYFILE_EXCL);
    await chmod(destination, 0o444);
  }
  await writeAllWithRollback(plans);
  const generator = await record(portable(path.relative(projectRoot, scriptPath)));
  const items = plans.map(({item, coveragePath, coverageBytes, afterBytes}) => ({
    sequence: item.sequence,
    animationId: item.animationId,
    before: {path: coveragePath, bytes: coverageBytes.length, sha256: sha256(coverageBytes)},
    after: {path: coveragePath, bytes: afterBytes.length, sha256: sha256(afterBytes)},
    repairedRequirements: item.animationId === "course-g04-l03-ts-006" ? 4 : 2,
    authoritativeRuntimeSessions: 0,
    strictComplete: false,
  }));
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-coverage-capture-identity-repair",
    generator,
    sourceBindings: scope.sourceBindings,
    scope: {releaseId: "lesson-g04-l03-negative-numbers", repairedMembers: 38, excludedAlreadyCompleteIdentityMembers: [...excluded].sort()},
    backup: {root: backupRoot, preimageSetSha256, ignoredWorkArtifact: true},
    items,
    summary: {
      repairedWorkspaces: items.length,
      repairedRequirements: items.reduce((sum, item) => sum + item.repairedRequirements, 0),
      invalidCaptureIdentitiesAfter: 0,
      runtimeSessionsExecuted: 0,
      implementationCapturesExecuted: 0,
      strictCompletions: 0,
    },
    acceptance: {
      authoritativeRuntimeAccepted: false,
      implementationCaptureAccepted: false,
      rmseAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
    },
    strictAcceptanceEffect: "none; this repairs canonical pending-capture identity fields and hashes without executing a runtime or satisfying any acceptance gate",
  };
  await atomicReplace(path.join(projectRoot, reportPath), Buffer.from(pretty(report)));
  await atomicReplace(path.join(projectRoot, markdownPath), Buffer.from(markdown(report)));
  return verifyExisting(scope);
}

export function parseArguments(argv) {
  const unknown = argv.filter((argument) => argument !== "--check");
  if (unknown.length) throw new Error(`Unknown option: ${unknown[0]}`);
  return {check: argv.includes("--check")};
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  repairG4L3CoverageCaptureIdentities(parseArguments(process.argv.slice(2))).then((report) => {
    process.stdout.write(`PASS: ${report.summary.repairedWorkspaces}/38 coverage workspaces; ${report.summary.repairedRequirements} complete pending identities; strict completion 0.\n`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
