#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {chmod, copyFile, lstat, mkdir, readFile, rename, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_PATH = "catalog/lesson-releases.json";
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const REPORT_PATH = "reports/g4-l3-frame-domain-planning-closure.json";
const REPORT_MARKDOWN_PATH = "reports/g4-l3-frame-domain-planning-closure.md";
const SHA256 = /^[a-f0-9]{64}$/;

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

function projectPath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath && !path.isAbsolute(relativePath),
    "project-relative path is required");
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`), `${relativePath} escapes the project root`);
  return absolute;
}

async function readBound(relativePath) {
  const absolute = projectPath(relativePath);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath} must be a regular non-symlink file`);
  const physical = await stat(absolute);
  invariant(physical.nlink === 1, `${relativePath} must not be hard-linked`);
  const bytes = await readFile(absolute);
  return {path: portable(relativePath), bytes: bytes.length, sha256: sha256(bytes), value: JSON.parse(bytes)};
}

async function hashBinding(relativePath) {
  const bytes = await readFile(projectPath(relativePath));
  return {path: portable(relativePath), bytes: bytes.length, sha256: sha256(bytes)};
}

function binding(record) {
  return {path: record.path, bytes: record.bytes, sha256: record.sha256};
}

function numericTimelineCompare(left, right) {
  const a = Number.parseInt(String(left).replace(/^sprite-/, ""), 10);
  const b = Number.parseInt(String(right).replace(/^sprite-/, ""), 10);
  if (Number.isSafeInteger(a) && Number.isSafeInteger(b) && a !== b) return a - b;
  return String(left).localeCompare(String(right), "en");
}

export function buildClosedManifest({manifest, disposition}) {
  const animationId = manifest.animationId;
  invariant(disposition.animationId === animationId
    && disposition.status === "structurally-enumerated"
    && disposition.summary?.dispositionCounts?.unresolved === 0
    && disposition.summary?.dispositionCounts?.["independent-required"] === 0
    && disposition.summary?.dispositionCounts?.nonvisual === 0
    && disposition.strictAcceptanceEffect?.startsWith("none"),
  `${animationId}: frame-domain disposition is not a zero-unresolved acceptance-neutral report`);
  const declared = disposition.timelines.filter(({disposition: value}) => value === "declared-frame-domain");
  const composites = disposition.timelines.filter(({disposition: value}) => value === "composite-child-with-parent");
  invariant(declared.length + composites.length === disposition.timelines.length,
    `${animationId}: disposition report contains an unsupported terminal classification`);
  const domains = manifest.implementation?.frameDomains || [];
  const declaredSources = new Set(declared.map(({sourceTimelineId}) => sourceTimelineId));
  invariant(domains.length === declared.length
    && domains.every(({sourceTimelineId}) => declaredSources.has(sourceTimelineId)),
  `${animationId}: manifest domains do not exactly match declared disposition timelines`);
  const compositeIds = composites.map(({timelineId}) => timelineId).sort(numericTimelineCompare);
  const next = structuredClone(manifest);
  const planning = next.implementation.capturePlanning || {};
  const currentCompositeIds = [...(planning.staticCompositeTimelineIds || [])].sort(numericTimelineCompare);
  const alreadyStructurallyAligned = planning.nestedFrameDomainDispositionEstablished === true
    && JSON.stringify(currentCompositeIds) === JSON.stringify(compositeIds)
    && Array.isArray(planning.unresolvedTimelineCandidateIds)
    && planning.unresolvedTimelineCandidateIds.length === 0;
  if (alreadyStructurallyAligned) {
    return {manifest: next, declaredCount: declared.length, compositeCount: composites.length, compositeIds};
  }
  next.implementation.capturePlanning = {
    ...planning,
    nestedFrameDomainDispositionEstablished: true,
    authoritativeRuntimeFrameDomainDispositionEstablished: false,
    structuralFrameDomainPlanningClosed: true,
    staticCompositeTimelineIds: compositeIds,
    ...(Object.hasOwn(planning, "sourceStaticCompositeCandidateTimelineIds")
      || next.implementation?.candidateState?.status === "current-javascript-engineering-candidate-only"
      ? {sourceStaticCompositeCandidateTimelineIds: compositeIds}
      : {}),
    unresolvedTimelineCandidateIds: [],
    runtimeReachabilityEstablished: false,
    strictAcceptanceEffect: "none",
  };
  return {manifest: next, declaredCount: declared.length, compositeCount: composites.length, compositeIds};
}

async function atomicWrite(relativePath, bytes) {
  const target = projectPath(relativePath);
  const temporary = `${target}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, target);
}

async function backupFile(sourceRelative, destinationRelative) {
  const destination = projectPath(destinationRelative);
  await mkdir(path.dirname(destination), {recursive: true});
  const existing = await lstat(destination).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (!existing) {
    await copyFile(projectPath(sourceRelative), destination, fsConstants.COPYFILE_EXCL);
    await chmod(destination, 0o444);
  }
  const [source, backup] = await Promise.all([readFile(projectPath(sourceRelative)), readFile(destination)]);
  invariant(source.equals(backup), `${destinationRelative}: backup differs from preimage`);
  return {path: destinationRelative, bytes: backup.length, sha256: sha256(backup)};
}

function markdown(report) {
  return `# G4 L3 frame-domain planning closure\n\n`
    + `This acceptance-neutral reconciliation makes every zero-unresolved frame-domain disposition explicit in migration capture planning. It does not establish original-runtime reachability, baselines, fidelity, audio, human review, owner acceptance, strict completion, or publication.\n\n`
    + `- Release members checked: **${report.summary.releaseMembers}/40**.\n`
    + `- Manifests reconciled: **${report.summary.changedManifests}**.\n`
    + `- Declared frame domains: **${report.summary.declaredFrameDomains}**.\n`
    + `- Source-proven composite timelines: **${report.summary.compositeTimelines}**.\n`
    + `- Unresolved timelines / original-runtime sessions / strict completions: **0 / 0 / 0**.\n`
    + `- Preimages: ignored \`${report.backup.root}\`.\n`;
}

async function loadCurrent() {
  const releaseRecord = await readBound(RELEASE_PATH);
  const release = releaseRecord.value.releases?.find(({releaseId}) => releaseId === RELEASE_ID);
  invariant(release?.publicationMode === "atomic" && release.members?.length === 40
    && release.members.every(({ordinal}, index) => ordinal === index + 1),
  "G4 L3 atomic release scope drifted");
  const items = [];
  for (const member of release.members) {
    const [manifestRecord, dispositionRecord] = await Promise.all([
      readBound(`migrations/${member.animationId}/migration.json`),
      readBound(`migrations/${member.animationId}/audit/frame-domain-disposition.json`),
    ]);
    const expected = buildClosedManifest({manifest: manifestRecord.value, disposition: dispositionRecord.value});
    items.push({sequence: member.ordinal, animationId: member.animationId, manifestRecord, dispositionRecord, expected});
  }
  return {releaseRecord, items};
}

async function verifyReceipt() {
  const [reportRecord, current] = await Promise.all([readBound(REPORT_PATH), loadCurrent()]);
  const report = reportRecord.value;
  invariant(report.schemaVersion === 1 && report.reportType === "g4-l3-frame-domain-planning-closure",
    "Frame-domain planning closure receipt identity drifted");
  const generator = await hashBinding(portable(path.relative(ROOT, SCRIPT_PATH)));
  invariant(pretty(report.generator) === pretty(generator), "Frame-domain planning closure generator binding is stale");
  invariant(report.summary?.releaseMembers === 40
    && report.summary?.changedManifests === 19
    && report.summary?.declaredFrameDomains === 261
    && report.summary?.compositeTimelines === 638
    && report.summary?.unresolvedTimelines === 0
    && report.summary?.strictCompletions === 0,
  "Frame-domain planning closure summary drifted or was promoted");
  invariant(Object.values(report.acceptance || {}).every((value) => value === false),
    "Frame-domain planning closure contains an acceptance claim");
  for (const item of current.items) {
    invariant(pretty(item.manifestRecord.value) === pretty(item.expected.manifest),
      `${item.animationId}: current capture planning is not closed against the current disposition`);
    const recorded = report.items.find(({animationId}) => animationId === item.animationId);
    invariant(recorded?.sequence === item.sequence
      && recorded.after.sha256 === item.manifestRecord.sha256
      && recorded.after.bytes === item.manifestRecord.bytes
      && recorded.disposition.path === item.dispositionRecord.path,
    `${item.animationId}: planning closure receipt is stale`);
  }
  return report;
}

async function refreshReceipt() {
  const [reportRecord, current] = await Promise.all([readBound(REPORT_PATH), loadCurrent()]);
  const report = reportRecord.value;
  invariant(report.schemaVersion === 1 && report.reportType === "g4-l3-frame-domain-planning-closure",
    "Frame-domain planning closure receipt identity drifted");
  invariant(report.summary?.releaseMembers === 40
    && report.summary?.changedManifests === 19
    && report.summary?.declaredFrameDomains === 261
    && report.summary?.compositeTimelines === 638
    && report.summary?.unresolvedTimelines === 0
    && report.summary?.strictCompletions === 0,
  "Frame-domain planning closure historical summary drifted or was promoted");
  invariant(Object.values(report.acceptance || {}).every((value) => value === false),
    "Frame-domain planning closure contains an acceptance claim");
  invariant(report.items?.length === 40, "Frame-domain planning closure receipt item scope drifted");

  const refreshedItems = current.items.map((item) => {
    invariant(pretty(item.manifestRecord.value) === pretty(item.expected.manifest),
      `${item.animationId}: refresh cannot rewrite capture planning`);
    const recorded = report.items.find(({animationId}) => animationId === item.animationId);
    invariant(recorded?.sequence === item.sequence
      && recorded.strictComplete === false
      && recorded.unresolvedTimelines === 0,
    `${item.animationId}: refresh source receipt is malformed or promoted`);
    return {
      ...recorded,
      sequence: item.sequence,
      disposition: binding(item.dispositionRecord),
      after: binding(item.manifestRecord),
      declaredFrameDomains: item.expected.declaredCount,
      compositeTimelines: item.expected.compositeCount,
      unresolvedTimelines: 0,
      strictComplete: false,
    };
  });
  invariant(refreshedItems.reduce((sum, item) => sum + item.declaredFrameDomains, 0) === 261
    && refreshedItems.reduce((sum, item) => sum + item.compositeTimelines, 0) === 638,
  "Frame-domain planning closure refresh aggregate drifted");

  const refreshed = {
    ...report,
    generator: await hashBinding(portable(path.relative(ROOT, SCRIPT_PATH))),
    sourceBindings: {lessonRelease: binding(current.releaseRecord)},
    items: refreshedItems,
    refreshHistory: [
      ...(report.refreshHistory || []),
      {
        priorReportSha256: reportRecord.sha256,
        manifestsRewritten: 0,
        reboundMembers: refreshedItems.length,
        compareAndSwapPreconditionsRequired: true,
        disposition: "receipt-only-rebind-after-current-structural-closure-validation",
        strictAcceptanceEffect: "none",
      },
    ],
  };
  await atomicWrite(REPORT_PATH, Buffer.from(pretty(refreshed)));
  await atomicWrite(REPORT_MARKDOWN_PATH, Buffer.from(markdown(refreshed)));
  return verifyReceipt();
}

async function createReceipt(current) {
  const changed = current.items.filter(({manifestRecord, expected}) => pretty(manifestRecord.value) !== pretty(expected.manifest));
  invariant(changed.length === 19, `Expected 19 stale planning manifests, found ${changed.length}`);
  const preimageSetSha256 = sha256(Buffer.from(JSON.stringify(changed.map(({animationId, manifestRecord}) => ({animationId, sha256: manifestRecord.sha256})))));
  const backupRoot = `work/g4-l3-frame-domain-planning-closure-preimages/${preimageSetSha256}`;
  const backups = new Map();
  for (const item of changed) {
    backups.set(item.animationId, await backupFile(item.manifestRecord.path, `${backupRoot}/${item.animationId}/migration.json`));
  }
  const written = [];
  try {
    for (const item of changed) {
      const bytes = Buffer.from(pretty(item.expected.manifest));
      await atomicWrite(item.manifestRecord.path, bytes);
      written.push(item);
    }
  } catch (error) {
    for (const item of [...written].reverse()) await atomicWrite(item.manifestRecord.path, Buffer.from(pretty(item.manifestRecord.value)));
    throw error;
  }
  const rows = [];
  for (const item of current.items) {
    const after = await readBound(item.manifestRecord.path);
    invariant(pretty(after.value) === pretty(item.expected.manifest), `${item.animationId}: planning closure write drifted`);
    rows.push({
      sequence: item.sequence,
      animationId: item.animationId,
      changed: changed.includes(item),
      disposition: binding(item.dispositionRecord),
      before: binding(item.manifestRecord),
      ...(backups.has(item.animationId) ? {backup: backups.get(item.animationId)} : {}),
      after: binding(after),
      declaredFrameDomains: item.expected.declaredCount,
      compositeTimelines: item.expected.compositeCount,
      unresolvedTimelines: 0,
      strictComplete: false,
    });
  }
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-frame-domain-planning-closure",
    generator: await hashBinding(portable(path.relative(ROOT, SCRIPT_PATH))),
    sourceBindings: {lessonRelease: binding(current.releaseRecord)},
    scope: {releaseId: RELEASE_ID, releaseMembers: 40},
    backup: {root: backupRoot, preimageSetSha256, ignoredPrivateOrWorkArtifact: true},
    items: rows,
    summary: {
      releaseMembers: rows.length,
      changedManifests: changed.length,
      declaredFrameDomains: rows.reduce((sum, row) => sum + row.declaredFrameDomains, 0),
      compositeTimelines: rows.reduce((sum, row) => sum + row.compositeTimelines, 0),
      unresolvedTimelines: 0,
      authoritativeRuntimeSessions: 0,
      strictCompletions: 0,
      publishedReleases: 0,
    },
    acceptance: {
      authoritativeRuntimeReachabilityEstablished: false,
      originalRuntimeBaselineAccepted: false,
      visualFidelityAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictComplete: false,
      published: false,
    },
    strictAcceptanceEffect: "none; this receipt reconciles structural capture planning only",
  };
  invariant(report.summary.declaredFrameDomains === 261 && report.summary.compositeTimelines === 638,
    "Frame-domain planning closure aggregate drifted");
  await atomicWrite(REPORT_PATH, Buffer.from(pretty(report)));
  await atomicWrite(REPORT_MARKDOWN_PATH, Buffer.from(markdown(report)));
  return report;
}

export async function materialize({check = false, refresh = false} = {}) {
  invariant(!(check && refresh), "--check and --refresh are mutually exclusive");
  const exists = await lstat(projectPath(REPORT_PATH)).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (exists) return refresh ? refreshReceipt() : verifyReceipt();
  invariant(!check, "Frame-domain planning closure receipt is missing");
  invariant(!refresh, "Cannot refresh a missing frame-domain planning closure receipt");
  return createReceipt(await loadCurrent());
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
    process.stdout.write(`PASS: ${report.summary.declaredFrameDomains} declared / ${report.summary.compositeTimelines} composite / 0 unresolved; strict completion 0.\n`);
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
