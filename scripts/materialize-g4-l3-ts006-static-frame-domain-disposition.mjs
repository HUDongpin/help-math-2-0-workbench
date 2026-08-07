#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {chmod, copyFile, lstat, mkdir, readFile, rename, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {buildCourseScenarioInventories} from "./build-course-scenario-inventories.mjs";
import {buildFrameDomainDispositions} from "./build-frame-domain-dispositions.mjs";
import {buildStaticFrameDomainDispositionEvidence} from "./build-static-frame-domain-disposition-evidence.mjs";
import {
  buildExpectedPendingCoverageDocuments,
  TS006_ANIMATION_ID,
} from "./materialize-g4-l3-valid-pending-root-coverage.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const WORKSPACE = `migrations/${TS006_ANIMATION_ID}`;
const MIGRATION_PATH = `${WORKSPACE}/migration.json`;
const COVERAGE_PATH = `${WORKSPACE}/evidence/full-frame-coverage.json`;
const SCENARIO_PATH = `${WORKSPACE}/audit/scenario-inventory.json`;
const STATIC_EVIDENCE_PATH = `${WORKSPACE}/audit/static-frame-domain-disposition-evidence.json`;
const DISPOSITION_PATH = `${WORKSPACE}/audit/frame-domain-disposition.json`;
const REPORT_PATH = "reports/g4-l3-ts006-static-frame-domain-disposition-closure.json";
const MARKDOWN_PATH = "reports/g4-l3-ts006-static-frame-domain-disposition-closure.md";
const CONTRACT_PATH = "reports/g4-l3-authoritative-runtime-acquisition-contract.json";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

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

function relative(file) {
  const value = portable(path.relative(ROOT, file));
  invariant(value && !value.startsWith("../") && !path.isAbsolute(value), `${file} escapes project root`);
  return value;
}

async function record(relativePath) {
  const bytes = await readFile(path.join(ROOT, relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

async function readDocument(relativePath) {
  const bytes = await readFile(path.join(ROOT, relativePath));
  return {bytes, document: JSON.parse(bytes.toString("utf8")), record: {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)}};
}

function exactContractItem(contract) {
  invariant(contract.reportType === "g4-l3-authoritative-runtime-acquisition-contract" && contract.items?.length === 40, "G4 L3 runtime contract scope drifted");
  const matches = contract.items.filter(({animationId}) => animationId === TS006_ANIMATION_ID);
  invariant(matches.length === 1, "G4 L3 runtime contract must contain exactly one TS006 item");
  const item = matches[0];
  invariant(item.sequence === 34 && item.nativeRuntimeFacts?.rootFrameCount === 10 && item.currentEvidenceState?.strictComplete === false, "TS006 runtime contract identity/status drifted");
  return item;
}

export function validateOldPlanningState({manifest, coverage}) {
  const planning = manifest.implementation?.capturePlanning || {};
  invariant(manifest.animationId === TS006_ANIMATION_ID, "TS006 manifest identity drifted");
  invariant(planning.nestedFrameDomainDispositionEstablished === false, "TS006 old planning state must retain an unresolved disposition");
  invariant(planning.unresolvedTimelineCandidateIds?.join("|") === "sprite-3", "TS006 old planning state must identify only sprite-3 as unresolved");
  invariant(!planning.staticCompositeTimelineIds, "TS006 old planning state already contains a static composite claim");
  invariant(coverage.animationId === TS006_ANIMATION_ID && coverage.requirements?.length === 4, "TS006 old coverage must retain four pending requirements");
  invariant(coverage.requirements.every(({status, baselineAuthority}) => status === "pending" && baselineAuthority === "unresolved"), "TS006 old coverage contains an acceptance claim");
}

export function validateDispositionChain({scenario, staticEvidence, disposition}) {
  invariant(scenario.animationId === TS006_ANIMATION_ID && scenario.inventoryStatus === "static-exhaustive-runtime-unverified", "TS006 scenario inventory identity/status drifted");
  invariant(staticEvidence.animationId === TS006_ANIMATION_ID && staticEvidence.status === "verified-static-composite-claims", "TS006 static evidence identity/status drifted");
  invariant(staticEvidence.claims?.length === 1, "TS006 static evidence must contain exactly one claim");
  const claim = staticEvidence.claims[0];
  invariant(claim.timelineId === "sprite-3"
    && claim.frameCount === 1
    && claim.role === "single-frame-scriptless-structural-child"
    && claim.disposition === "composite-child-with-parent"
    && claim.claimScope === "independent-local-playhead-only",
  "TS006 sprite-3 static claim drifted");
  invariant(Object.values(claim.preservedObligations || {}).every(({satisfiedByDisposition}) => satisfiedByDisposition === false), "TS006 sprite-3 claim incorrectly satisfies a preserved obligation");
  invariant(disposition.animationId === TS006_ANIMATION_ID
    && disposition.status === "structurally-enumerated"
    && disposition.summary?.enumeratedTimelineCount === 3
    && disposition.summary?.dispositionCounts?.["declared-frame-domain"] === 2
    && disposition.summary?.dispositionCounts?.["composite-child-with-parent"] === 1
    && disposition.summary?.dispositionCounts?.unresolved === 0,
  "TS006 frame-domain disposition is not exact and unresolved-free");
  const timeline = disposition.timelines?.find(({timelineId}) => timelineId === "sprite-3");
  invariant(timeline?.disposition === "composite-child-with-parent"
    && timeline.staticCompositeEvidence?.role === "single-frame-scriptless-structural-child",
  "TS006 disposition does not project the verified sprite-3 claim");
  invariant(String(disposition.strictAcceptanceEffect || "").startsWith("none;"), "TS006 disposition must not advance strict acceptance");
}

async function atomicWrite(file, bytes) {
  const temporary = `${file}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, file);
}

async function removeIfPresent(file) {
  await unlink(file).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

async function restoreFiles(backups) {
  for (const {target, bytes} of backups) await atomicWrite(target, bytes);
}

async function verifyReport() {
  const [reportRecord, manifest, coverage, scenario, staticEvidence, disposition, generator] = await Promise.all([
    readDocument(REPORT_PATH),
    readDocument(MIGRATION_PATH),
    readDocument(COVERAGE_PATH),
    readDocument(SCENARIO_PATH),
    readDocument(STATIC_EVIDENCE_PATH),
    readDocument(DISPOSITION_PATH),
    record(relative(SCRIPT_PATH)),
  ]);
  const report = reportRecord.document;
  invariant(report.schemaVersion === 1 && report.reportType === "g4-l3-ts006-static-frame-domain-disposition-closure", "TS006 disposition-closure report identity drifted");
  invariant(pretty(report.generator) === pretty(generator), "TS006 disposition-closure generator binding is stale");
  validateDispositionChain({scenario: scenario.document, staticEvidence: staticEvidence.document, disposition: disposition.document});
  const item = exactContractItem((await readDocument(CONTRACT_PATH)).document);
  const expected = buildExpectedPendingCoverageDocuments({
    item,
    manifest: manifest.document,
    coverage: coverage.document,
  });
  invariant(pretty(manifest.document) === pretty(expected.manifest) && pretty(coverage.document) === pretty(expected.coverage), "TS006 post-closure planning documents drifted");
  for (const [key, current] of Object.entries({migrationJson: manifest.record, fullFrameCoverage: coverage.record, scenarioInventory: scenario.record, staticDispositionEvidence: staticEvidence.record, frameDomainDisposition: disposition.record})) {
    invariant(pretty(report.after?.[key]) === pretty(current), `TS006 disposition-closure after.${key} binding is stale`);
  }
  invariant(report.summary?.unresolvedTimelineCandidatesBefore === 1
    && report.summary?.unresolvedTimelineCandidatesAfter === 0
    && report.summary?.declaredFrameDomains === 2
    && report.summary?.staticCompositeTimelines === 1
    && report.summary?.pendingRequirements === 4
    && report.summary?.runtimeSessionsExecuted === 0
    && report.summary?.strictCompletions === 0,
  "TS006 disposition-closure summary drifted or was promoted");
  for (const key of ["authoritativeRuntimeAccepted", "baselineAccepted", "audioAccepted", "humanVisualAccepted", "ownerAccepted", "strictMigrationComplete"]) {
    invariant(report.acceptance?.[key] === false, `TS006 disposition closure cannot set ${key}`);
  }
  invariant(report.acceptance?.frameDomainDispositionEstablished === true, "TS006 technical frame-domain disposition was not recorded");
  return report;
}

async function refreshReport() {
  const [reportRecord, manifest, coverage, scenario, staticEvidence, disposition, generator] = await Promise.all([
    readDocument(REPORT_PATH),
    readDocument(MIGRATION_PATH),
    readDocument(COVERAGE_PATH),
    readDocument(SCENARIO_PATH),
    readDocument(STATIC_EVIDENCE_PATH),
    readDocument(DISPOSITION_PATH),
    record(relative(SCRIPT_PATH)),
  ]);
  const report = reportRecord.document;
  invariant(report.schemaVersion === 1 && report.reportType === "g4-l3-ts006-static-frame-domain-disposition-closure", "TS006 disposition-closure report identity drifted");
  validateDispositionChain({scenario: scenario.document, staticEvidence: staticEvidence.document, disposition: disposition.document});
  const item = exactContractItem((await readDocument(CONTRACT_PATH)).document);
  const expected = buildExpectedPendingCoverageDocuments({
    item,
    manifest: manifest.document,
    coverage: coverage.document,
  });
  invariant(pretty(manifest.document) === pretty(expected.manifest) && pretty(coverage.document) === pretty(expected.coverage), "TS006 post-closure planning documents drifted");
  for (const key of ["authoritativeRuntimeAccepted", "baselineAccepted", "audioAccepted", "humanVisualAccepted", "ownerAccepted", "strictMigrationComplete"]) {
    invariant(report.acceptance?.[key] === false, `TS006 disposition closure cannot refresh a promoted ${key}`);
  }
  invariant(report.acceptance?.frameDomainDispositionEstablished === true
    && report.summary?.unresolvedTimelineCandidatesBefore === 1
    && report.summary?.unresolvedTimelineCandidatesAfter === 0
    && report.summary?.runtimeSessionsExecuted === 0
    && report.summary?.strictCompletions === 0,
  "TS006 disposition-closure report cannot refresh across scope or status drift");
  const currentAfter = {
    migrationJson: manifest.record,
    fullFrameCoverage: coverage.record,
    scenarioInventory: scenario.record,
    staticDispositionEvidence: staticEvidence.record,
    frameDomainDisposition: disposition.record,
  };
  const refreshed = {
    ...report,
    generator,
    after: currentAfter,
    refreshHistory: [
      ...(report.refreshHistory || []),
      {
        priorReportSha256: reportRecord.record.sha256,
        migrationOrCoverageDocumentsRewritten: false,
        disposition: "receipt-only-rebind-after-current-source-derived-disposition-chain-validation",
      },
    ],
  };
  await atomicWrite(path.join(ROOT, REPORT_PATH), Buffer.from(pretty(refreshed)));
  await atomicWrite(path.join(ROOT, MARKDOWN_PATH), Buffer.from(markdown(refreshed)));
  return verifyReport();
}

function markdown(report) {
  return `# G4 L3 TS006 Static Frame-Domain Disposition Closure\n\n`
    + `The source-bound scenario inventory enumerates exactly three structurally root-reachable timelines. Root and \`sprite-23\` are declared frame domains; the one-frame, scriptless \`sprite-3\` title MovieClip is proven composite-with-parent only for the independent-playhead question.\n\n`
    + `- Declared frame domains: **${report.summary.declaredFrameDomains}**.\n`
    + `- Source-proven static composite timelines: **${report.summary.staticCompositeTimelines}**.\n`
    + `- Unresolved timeline candidates: **${report.summary.unresolvedTimelineCandidatesBefore} → ${report.summary.unresolvedTimelineCandidatesAfter}**.\n`
    + `- Pending full-frame requirements: **${report.summary.pendingRequirements}**.\n`
    + `- Runtime sessions / strict completions: **0 / 0**.\n\n`
    + `This closes only TS006's structural frame-domain disposition. Visual, behavior, interaction, full-frame/RMSE, audio, natural-runtime, human-review, and owner-acceptance obligations remain pending.\n`;
}

export async function materializeTs006StaticDisposition({check = false, refresh = false} = {}) {
  const reportExists = await lstat(path.join(ROOT, REPORT_PATH)).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  invariant(!(check && refresh), "--check and --refresh are mutually exclusive");
  if (check) return verifyReport();
  if (reportExists) return refresh ? refreshReport() : verifyReport();
  invariant(!refresh, "Cannot refresh a missing TS006 disposition-closure report");

  const [manifest, coverage, scenario, staticEvidence, disposition, contract] = await Promise.all([
    readDocument(MIGRATION_PATH),
    readDocument(COVERAGE_PATH),
    readDocument(SCENARIO_PATH),
    readDocument(STATIC_EVIDENCE_PATH),
    readDocument(DISPOSITION_PATH),
    readDocument(CONTRACT_PATH),
  ]);
  validateOldPlanningState({manifest: manifest.document, coverage: coverage.document});
  validateDispositionChain({scenario: scenario.document, staticEvidence: staticEvidence.document, disposition: disposition.document});
  const item = exactContractItem(contract.document);
  const next = buildExpectedPendingCoverageDocuments({item, manifest: manifest.document});
  invariant(next.manifest.implementation.capturePlanning.nestedFrameDomainDispositionEstablished === true
    && next.manifest.implementation.capturePlanning.unresolvedTimelineCandidateIds.length === 0,
  "TS006 target disposition state is not closed");

  const preimageProjection = {
    migrationJsonSha256: manifest.record.sha256,
    fullFrameCoverageSha256: coverage.record.sha256,
    scenarioInventorySha256: scenario.record.sha256,
    staticDispositionEvidenceSha256: staticEvidence.record.sha256,
    frameDomainDispositionSha256: disposition.record.sha256,
  };
  const preimageSetSha256 = sha256(Buffer.from(JSON.stringify(preimageProjection)));
  const backupRoot = `work/g4-l3-v2-ts006-static-disposition-preimages/${preimageSetSha256}`;
  await mkdir(path.join(ROOT, backupRoot), {recursive: true});
  const originalFiles = [manifest, coverage, scenario, staticEvidence, disposition];
  for (const current of originalFiles) {
    const destination = path.join(ROOT, backupRoot, path.basename(current.record.path));
    await copyFile(path.join(ROOT, current.record.path), destination, fsConstants.COPYFILE_EXCL);
    await chmod(destination, 0o444);
  }

  const backups = originalFiles.map((current) => ({target: path.join(ROOT, current.record.path), bytes: current.bytes}));
  try {
    await atomicWrite(path.join(ROOT, MIGRATION_PATH), Buffer.from(pretty(next.manifest)));
    await atomicWrite(path.join(ROOT, COVERAGE_PATH), Buffer.from(pretty(next.coverage)));
    await buildCourseScenarioInventories({ids: [TS006_ANIMATION_ID]});
    await buildStaticFrameDomainDispositionEvidence({ids: [TS006_ANIMATION_ID]});
    await buildFrameDomainDispositions({ids: [TS006_ANIMATION_ID]});
    const [newScenario, newStaticEvidence, newDisposition] = await Promise.all([
      readDocument(SCENARIO_PATH), readDocument(STATIC_EVIDENCE_PATH), readDocument(DISPOSITION_PATH),
    ]);
    validateDispositionChain({scenario: newScenario.document, staticEvidence: newStaticEvidence.document, disposition: newDisposition.document});
  } catch (error) {
    await restoreFiles(backups);
    throw error;
  } finally {
    for (const target of backups.map(({target}) => `${target}.pending-${process.pid}`)) await removeIfPresent(target);
  }

  const [afterManifest, afterCoverage, afterScenario, afterStaticEvidence, afterDisposition] = await Promise.all([
    readDocument(MIGRATION_PATH), readDocument(COVERAGE_PATH), readDocument(SCENARIO_PATH), readDocument(STATIC_EVIDENCE_PATH), readDocument(DISPOSITION_PATH),
  ]);
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-static-frame-domain-disposition-closure",
    generator: await record(relative(SCRIPT_PATH)),
    scope: {animationId: TS006_ANIMATION_ID, releaseId: "lesson-g04-l03-negative-numbers", sequence: 34},
    sourceBindings: {
      runtimeAcquisitionContract: contract.record,
      sourceSwf: {path: item.source.swf.path, bytes: item.source.swf.bytes, sha256: item.source.swf.sha256},
      sourceFla: {path: item.source.fla.path, bytes: item.source.fla.bytes, sha256: item.source.fla.sha256},
    },
    before: {
      migrationJson: manifest.record,
      fullFrameCoverage: coverage.record,
      scenarioInventory: scenario.record,
      staticDispositionEvidence: staticEvidence.record,
      frameDomainDisposition: disposition.record,
    },
    after: {
      migrationJson: afterManifest.record,
      fullFrameCoverage: afterCoverage.record,
      scenarioInventory: afterScenario.record,
      staticDispositionEvidence: afterStaticEvidence.record,
      frameDomainDisposition: afterDisposition.record,
    },
    backup: {root: backupRoot, preimageSetSha256, ignoredWorkArtifact: true},
    summary: {
      enumeratedRootReachableTimelines: 3,
      declaredFrameDomains: 2,
      staticCompositeTimelines: 1,
      unresolvedTimelineCandidatesBefore: 1,
      unresolvedTimelineCandidatesAfter: 0,
      pendingRequirements: 4,
      runtimeSessionsExecuted: 0,
      strictCompletions: 0,
    },
    acceptance: {
      frameDomainDispositionEstablished: true,
      authoritativeRuntimeAccepted: false,
      baselineAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
    },
    strictAcceptanceEffect: "none; this closes only a source-proven structural frame-domain disposition and preserves every runtime, visual, audio, human, owner, and release gate",
  };
  await atomicWrite(path.join(ROOT, REPORT_PATH), Buffer.from(pretty(report)));
  await atomicWrite(path.join(ROOT, MARKDOWN_PATH), Buffer.from(markdown(report)));
  return verifyReport();
}

function parseArguments(argv) {
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
  materializeTs006StaticDisposition(parseArguments(process.argv.slice(2))).then((report) => {
    process.stdout.write(`PASS: TS006 ${report.summary.enumeratedRootReachableTimelines}/3 timelines dispositioned; ${report.summary.unresolvedTimelineCandidatesAfter} unresolved; strict completion 0.\n`);
  }).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
