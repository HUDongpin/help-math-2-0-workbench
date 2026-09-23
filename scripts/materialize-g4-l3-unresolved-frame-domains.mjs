#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {chmod, copyFile, lstat, mkdir, open, readFile, rename, stat, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_PATH = "catalog/lesson-releases.json";
const SINGLE_CANDIDATE_PATH = "reports/g4-l3-single-frame-disposition-candidates.json";
const SINGLE_SELECTION_PATH = "reports/g4-l3-reviewed-single-frame-disposition-selection.json";
const MULTI_CANDIDATE_PATH = "reports/g4-l3-multi-frame-disposition-candidates.json";
const MULTI_SELECTION_PATH = "reports/g4-l3-reviewed-multi-frame-disposition-selection.json";
const REPORT_PATH = "reports/g4-l3-unresolved-frame-domain-materialization.json";
const REPORT_MARKDOWN_PATH = "reports/g4-l3-unresolved-frame-domain-materialization.md";
const LOCK_PATH = "work/g4-l3-unresolved-frame-domain-materialization.lock";
const RELEASE_ID = "lesson-g04-l03-negative-numbers";
const SCENARIO_ID = "source-static-reachable-domain";
const LANGUAGES = Object.freeze(["en", "es"]);
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

export function canonicalJson(value) {
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

async function hashBound(relativePath) {
  const absolute = projectPath(relativePath);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath} must be a regular non-symlink file`);
  const physical = await stat(absolute);
  invariant(physical.nlink === 1, `${relativePath} must not be hard-linked`);
  const bytes = await readFile(absolute);
  return {
    path: portable(relativePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    bytesValue: bytes,
  };
}

async function readBound(relativePath) {
  const record = await hashBound(relativePath);
  return {...record, value: JSON.parse(record.bytesValue.toString("utf8"))};
}

function binding(record) {
  return {path: record.path, bytes: record.bytes, sha256: record.sha256};
}

function numericTimelineCompare(left, right) {
  if (left === "root") return -1;
  if (right === "root") return 1;
  const leftId = Number.parseInt(String(left).replace(/^sprite-/, ""), 10);
  const rightId = Number.parseInt(String(right).replace(/^sprite-/, ""), 10);
  if (Number.isSafeInteger(leftId) && Number.isSafeInteger(rightId) && leftId !== rightId) return leftId - rightId;
  return String(left).localeCompare(String(right), "en");
}

function exactRelease(document) {
  const release = document.releases?.find(({releaseId}) => releaseId === RELEASE_ID);
  invariant(release?.publicationMode === "atomic" && release.members?.length === 40,
    "G4 L3 atomic release scope drifted");
  invariant(release.members.every(({ordinal}, index) => ordinal === index + 1),
    "G4 L3 release ordering drifted");
  return release;
}

function candidateByAnimation(document, animationId) {
  const matches = (document.members || []).filter((member) => member.animationId === animationId);
  invariant(matches.length === 1, `${animationId}: candidate report member identity drifted`);
  return matches[0];
}

function classifyUnresolvedTimeline({animationId, timeline, singleMember, multiMember}) {
  invariant(timeline.disposition === "unresolved"
    && timeline.structuralReachability === "reachable-from-root-placement-graph"
    && /^sprite-[1-9][0-9]*$/.test(timeline.timelineId)
    && timeline.sourceTimelineId === timeline.timelineId
    && Number.isSafeInteger(timeline.frameCount) && timeline.frameCount > 0
    && Array.isArray(timeline.declaredFrameDomains) && timeline.declaredFrameDomains.length === 0
    && !timeline.staticCompositeEvidence,
  `${animationId}/${timeline.timelineId}: unresolved source timeline identity drifted`);
  if (timeline.frameCount === 1) {
    const matches = (singleMember.disqualifiedOneFrameTimelines || [])
      .filter(({timelineId}) => timelineId === timeline.timelineId);
    invariant(matches.length === 1 && matches[0].eligible === false
      && matches[0].frameCount === 1
      && (matches[0].disqualifiers || []).some((reason) => reason.includes("action") || reason.includes("script")),
    `${animationId}/${timeline.timelineId}: one-frame scripted exclusion is not exact`);
    return {
      classification: "source-static-reachable-one-frame-scripted-domain-candidate",
      disqualifiers: [...matches[0].disqualifiers],
    };
  }
  const matches = (multiMember.excludedCandidates || [])
    .filter(({timelineId}) => timelineId === timeline.timelineId);
  invariant(matches.length === 1 && matches[0].eligible === false
    && matches[0].frameCount === timeline.frameCount
    && (matches[0].disqualifiers || []).length > 0,
  `${animationId}/${timeline.timelineId}: multi-frame strong-proof exclusion is not exact`);
  return {
    classification: "source-static-reachable-multi-frame-domain-candidate",
    disqualifiers: [...matches[0].disqualifiers],
  };
}

function finalDomainSources(manifest, unresolvedTimelines) {
  const map = new Map();
  for (const domain of manifest.implementation?.frameDomains || []) {
    invariant(domain?.id && domain.sourceTimelineId && !map.has(domain.sourceTimelineId),
      `${manifest.animationId}: declared source timeline is missing or duplicated`);
    map.set(domain.sourceTimelineId, domain.id);
  }
  for (const timeline of unresolvedTimelines) {
    invariant(!map.has(timeline.timelineId), `${manifest.animationId}/${timeline.timelineId}: unresolved timeline is already declared`);
    map.set(timeline.timelineId, timeline.timelineId);
  }
  invariant(map.get("root") === "root", `${manifest.animationId}: root frame-domain identity drifted`);
  return map;
}

export function derivePendingDomain({animationId, timeline, finalDomainBySource}) {
  const placementPath = timeline.rootPlacement?.namedPlacementPath || [];
  const namedPathProven = timeline.rootPlacement?.status === "proven-named-placement-chain" && placementPath.length > 0;
  const lineage = namedPathProven ? ["root", ...placementPath.map(({childTimelineId}) => childTimelineId)] : ["root"];
  invariant(!namedPathProven || lineage.at(-1) === timeline.timelineId,
    `${animationId}/${timeline.timelineId}: named placement path does not terminate at the target`);
  const parentSourceTimelineId = [...lineage.slice(0, -1)].reverse()
    .find((candidate) => finalDomainBySource.has(candidate)) || "root";
  const parentFrameDomainId = finalDomainBySource.get(parentSourceTimelineId);
  invariant(parentFrameDomainId && parentFrameDomainId !== timeline.timelineId,
    `${animationId}/${timeline.timelineId}: no acyclic declared parent frame domain`);
  const immediateEdge = namedPathProven ? placementPath.at(-1) : null;
  const directParent = immediateEdge?.parentTimelineId === parentSourceTimelineId;
  return {
    id: timeline.timelineId,
    kind: "nested",
    sourceTimelineId: timeline.timelineId,
    parentFrameDomainId,
    ...(directParent && immediateEdge.instanceName ? {sourceInstanceId: immediateEdge.instanceName} : {}),
    ...(directParent && Number.isSafeInteger(immediateEdge.frame) ? {parentEntryFrame: immediateEdge.frame} : {}),
    localEntryFrame: 1,
    frameCount: timeline.frameCount,
    scenarioIds: [SCENARIO_ID],
    role: "source-static-reachable-capture-domain-candidate-runtime-unverified",
    sourceStaticReachability: {
      structuralReachability: timeline.structuralReachability,
      namedPlacementPathStatus: timeline.rootPlacement.status,
      parentBinding: directParent ? "direct-source-parent-frame-domain" : "nearest-declared-ancestor-or-root",
      runtimeReachabilityEstablished: false,
    },
  };
}

export function buildPendingRequirement({animationId, sequence, domain, language, classification, disqualifiers}) {
  invariant(LANGUAGES.includes(language), `${animationId}/${domain.id}: unsupported language ${language}`);
  const entryState = {
    authoritativeTraceExecuted: false,
    frameDomainId: domain.id,
    kind: "lesson-shell-natural-entry-to-source-static-reachable-domain",
    language,
    localEntryFrameCandidate: 1,
    parentFrameDomainId: domain.parentFrameDomainId,
    releaseId: RELEASE_ID,
    runtimeReachabilityEstablished: false,
    scenario: SCENARIO_ID,
    seed: "0",
    sourceScenarioCandidateId: "source-static-reachable-domain-natural-entry",
    sourceTimelineId: domain.sourceTimelineId,
    targetAnimationId: animationId,
    targetSequence: sequence,
  };
  return {
    requirementId: `req:${domain.id}:lesson-shell-natural-entry:${language}`,
    scenario: SCENARIO_ID,
    frameDomainId: domain.id,
    traceId: `trace:${domain.id}:lesson-shell-natural-entry:${language}:seed-0`,
    language,
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: domain.frameCount},
    entryState,
    entryStateSha256: sha256(Buffer.from(canonicalJson(entryState))),
    baselineAuthorityRequirement: "original-runtime-natural-trace",
    baselineAuthority: "unresolved",
    status: "pending",
    capturedFrameCount: 0,
    missingFrames: Array.from({length: domain.frameCount}, (_, index) => index + 1),
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
    planningAuthority: "source-static-reachable-domain-candidate-not-executed-original-runtime-evidence",
    blockingReason: `Pending authorized natural original-runtime trace; source classification ${classification}; static disqualifiers: ${disqualifiers.join(", ")}.`,
  };
}

function exactRequirementIdentity(requirement) {
  return `${requirement.requirementId}\u0000${requirement.frameDomainId}\u0000${requirement.traceId}`;
}

export function buildExpandedDocuments({sequence, manifest, coverage, disposition, singleMember, multiMember}) {
  const animationId = manifest.animationId;
  invariant(coverage.schemaVersion === 2 && coverage.animationId === animationId,
    `${animationId}: coverage identity drifted`);
  invariant(disposition.animationId === animationId
    && disposition.strictAcceptanceEffect?.startsWith("none")
    && disposition.status === "structurally-enumerated-dispositions-unresolved",
  `${animationId}: unresolved disposition report identity drifted`);
  const unresolved = disposition.timelines.filter(({disposition: value}) => value === "unresolved");
  invariant(unresolved.length > 0, `${animationId}: no unresolved timelines to materialize`);
  const classified = unresolved.map((timeline) => ({
    timeline,
    ...classifyUnresolvedTimeline({animationId, timeline, singleMember, multiMember}),
  }));
  const finalDomainBySource = finalDomainSources(manifest, unresolved);
  const domains = classified.map(({timeline}) => derivePendingDomain({animationId, timeline, finalDomainBySource}));
  const depth = new Map(domains.map((domain) => [domain.id, 0]));
  for (const domain of domains) {
    const visited = new Set([domain.id]);
    let parent = domain.parentFrameDomainId;
    let value = 1;
    while (depth.has(parent)) {
      invariant(!visited.has(parent), `${animationId}/${domain.id}: cyclic materialized parent chain`);
      visited.add(parent);
      value += 1;
      parent = domains.find(({id}) => id === parent)?.parentFrameDomainId;
    }
    depth.set(domain.id, value);
  }
  domains.sort((left, right) => depth.get(left.id) - depth.get(right.id) || numericTimelineCompare(left.id, right.id));
  const nextManifest = structuredClone(manifest);
  invariant(!(nextManifest.scenarios || []).some(({id}) => id === SCENARIO_ID),
    `${animationId}: source-static reachable scenario already exists without a receipt`);
  nextManifest.scenarios = [
    ...(nextManifest.scenarios || []),
    {
      id: SCENARIO_ID,
      kind: "source-static-candidate",
      description: "Conservative capture identity for a source-static root-reachable timeline. Runtime reachability, entry state, behavior, audio, visual fidelity, human review, and owner acceptance remain unproven until authorized natural execution.",
      reachable: false,
      sourceStaticReachable: true,
      authoritativeRuntimeReachabilityEstablished: false,
    },
  ];
  nextManifest.implementation.frameDomains = [
    ...nextManifest.implementation.frameDomains,
    ...domains,
  ];
  const compositeIds = disposition.timelines
    .filter(({disposition: value}) => value === "composite-child-with-parent")
    .map(({timelineId}) => timelineId)
    .sort(numericTimelineCompare);
  const allNestedDomainIds = nextManifest.implementation.frameDomains
    .filter(({kind}) => kind === "nested")
    .map(({id}) => id);
  nextManifest.implementation.capturePlanning = {
    ...(nextManifest.implementation.capturePlanning || {}),
    state: "pending-authoritative-natural-trace",
    releaseId: RELEASE_ID,
    releaseSequence: sequence,
    nestedFrameDomainDispositionEstablished: true,
    authoritativeRuntimeFrameDomainDispositionEstablished: false,
    conservativeNestedDomainRequirementsEstablished: true,
    conservativeNestedFrameDomainIds: allNestedDomainIds,
    sourceStaticReachablePendingFrameDomainIds: domains.map(({id}) => id),
    sourceStaticReachablePendingRequirementsEstablished: true,
    staticCompositeTimelineIds: compositeIds,
    sourceStaticCompositeCandidateTimelineIds: compositeIds,
    unresolvedTimelineCandidateIds: [],
    runtimeReachabilityEstablished: false,
    strictAcceptanceEffect: "none",
  };
  const existingIdentities = new Set(coverage.requirements.map(exactRequirementIdentity));
  invariant(existingIdentities.size === coverage.requirements.length,
    `${animationId}: existing coverage requirement identity is duplicated`);
  const newRequirements = [];
  for (const item of classified) {
    const domain = domains.find(({id}) => id === item.timeline.timelineId);
    for (const language of LANGUAGES) {
      const requirement = buildPendingRequirement({
        animationId,
        sequence,
        domain,
        language,
        classification: item.classification,
        disqualifiers: item.disqualifiers,
      });
      invariant(!existingIdentities.has(exactRequirementIdentity(requirement)),
        `${animationId}/${domain.id}: pending requirement already exists without a receipt`);
      newRequirements.push(requirement);
    }
  }
  const nextCoverage = {
    ...structuredClone(coverage),
    planningState: "valid-source-static-reachable-domain-requirements-pending-authoritative-runtime",
    requirements: [...structuredClone(coverage.requirements), ...newRequirements],
    limitations: [
      ...(coverage.limitations || []),
      `${domains.length} formerly unresolved source-static root-reachable timelines are now explicit pending capture-domain candidates with EN/ES full-range requirements. This is conservative planning, not runtime reachability or fidelity evidence.`,
      "All newly added requirements remain pending with zero captured baseline or implementation frames. Authorized natural original-runtime execution may split, merge, or supersede their scenario and entry-state contract.",
      "No source-static disposition, manifest declaration, or pending coverage requirement changes strict acceptance, human review, owner acceptance, or publication.",
    ],
  };
  return {
    manifest: nextManifest,
    coverage: nextCoverage,
    domains,
    newRequirements,
    classifications: classified.map(({timeline, classification, disqualifiers}) => ({
      timelineId: timeline.timelineId,
      frameCount: timeline.frameCount,
      classification,
      disqualifiers,
    })),
  };
}

function validateExpandedPair({sequence, beforeManifest, beforeCoverage, afterManifest, afterCoverage, disposition, singleMember, multiMember}) {
  const expected = buildExpandedDocuments({
    sequence,
    manifest: beforeManifest,
    coverage: beforeCoverage,
    disposition,
    singleMember,
    multiMember,
  });
  invariant(pretty(afterManifest) === pretty(expected.manifest), `${beforeManifest.animationId}: materialized manifest differs from plan`);
  invariant(pretty(afterCoverage) === pretty(expected.coverage), `${beforeManifest.animationId}: materialized coverage differs from plan`);
  invariant(pretty(afterCoverage.requirements.slice(0, beforeCoverage.requirements.length)) === pretty(beforeCoverage.requirements),
    `${beforeManifest.animationId}: an existing coverage requirement changed`);
  invariant(expected.newRequirements.length === expected.domains.length * 2
    && expected.newRequirements.every((requirement) => requirement.status === "pending"
      && requirement.baselineAuthority === "unresolved"
      && requirement.capturedFrameCount === 0
      && requirement.baselineCaptureManifest === ""
      && requirement.captureManifest === ""
      && requirement.metricsFile === ""
      && SHA256.test(requirement.entryStateSha256)),
  `${beforeManifest.animationId}: new requirements are incomplete or promoted`);
  return expected;
}

async function loadInputs() {
  const [releaseRecord, singleRecord, singleSelectionRecord, multiRecord, multiSelectionRecord] = await Promise.all([
    readBound(RELEASE_PATH),
    readBound(SINGLE_CANDIDATE_PATH),
    readBound(SINGLE_SELECTION_PATH),
    readBound(MULTI_CANDIDATE_PATH),
    readBound(MULTI_SELECTION_PATH),
  ]);
  const release = exactRelease(releaseRecord.value);
  invariant(singleRecord.value.reportType === "g4-l3-single-frame-disposition-candidates"
    && singleRecord.value.summary?.eligibleCandidateCount === 576
    && singleRecord.value.summary?.disqualifiedOneFrameTimelineCount === 5,
  "Single-frame candidate report scope drifted");
  invariant(multiRecord.value.reportType === "g4-l3-multi-frame-disposition-candidates"
    && multiRecord.value.summary?.eligibleCandidateCount === 1
    && multiRecord.value.summary?.excludedCandidateCount === 144,
  "Multi-frame candidate report scope drifted");
  invariant(singleSelectionRecord.value.candidateReport?.sha256 === singleRecord.sha256
    && singleSelectionRecord.value.acceptedSet?.candidateCount === 576
    && singleSelectionRecord.value.excludedSet?.candidateCount === 5
    && singleSelectionRecord.value.review?.humanReviewer === false
    && singleSelectionRecord.value.review?.ownerAcceptance === false,
  "Reviewed single-frame selection does not bind the current candidate report");
  invariant(multiSelectionRecord.value.candidateReport?.sha256 === multiRecord.sha256
    && multiSelectionRecord.value.acceptedSet?.candidateCount === 1
    && multiSelectionRecord.value.excludedSet?.candidateCount === 144
    && multiSelectionRecord.value.review?.humanReviewer === false
    && multiSelectionRecord.value.review?.ownerAcceptance === false,
  "Reviewed multi-frame selection does not bind the current candidate report");
  const targets = [];
  const dispositions = [];
  let unresolvedCount = 0;
  let oneFrameCount = 0;
  let multiFrameCount = 0;
  for (const member of release.members) {
    const animationId = member.animationId;
    const dispositionPath = `migrations/${animationId}/audit/frame-domain-disposition.json`;
    const dispositionRecord = await readBound(dispositionPath);
    dispositions.push(binding(dispositionRecord));
    const unresolved = dispositionRecord.value.timelines?.filter(({disposition}) => disposition === "unresolved") || [];
    if (!unresolved.length) continue;
    const [manifestRecord, coverageRecord] = await Promise.all([
      readBound(`migrations/${animationId}/migration.json`),
      readBound(`migrations/${animationId}/evidence/full-frame-coverage.json`),
    ]);
    const singleMember = candidateByAnimation(singleRecord.value, animationId);
    const multiMember = candidateByAnimation(multiRecord.value, animationId);
    const expected = buildExpandedDocuments({
      sequence: member.ordinal,
      manifest: manifestRecord.value,
      coverage: coverageRecord.value,
      disposition: dispositionRecord.value,
      singleMember,
      multiMember,
    });
    unresolvedCount += unresolved.length;
    oneFrameCount += unresolved.filter(({frameCount}) => frameCount === 1).length;
    multiFrameCount += unresolved.filter(({frameCount}) => frameCount > 1).length;
    targets.push({
      sequence: member.ordinal,
      animationId,
      manifestRecord,
      coverageRecord,
      dispositionRecord,
      singleMember,
      multiMember,
      expected,
    });
  }
  invariant(targets.length === 20 && unresolvedCount === 149 && oneFrameCount === 5 && multiFrameCount === 144,
    `Expected 20 members / 149 unresolved domains (5 one-frame + 144 multi-frame), found ${targets.length} / ${unresolvedCount} (${oneFrameCount} + ${multiFrameCount})`);
  return {
    targets,
    sourceRecords: {releaseRecord, singleRecord, singleSelectionRecord, multiRecord, multiSelectionRecord},
    dispositionBindings: dispositions,
  };
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

async function withLock(action) {
  await mkdir(projectPath("work"), {recursive: true});
  const lock = projectPath(LOCK_PATH);
  const handle = await open(lock, "wx", 0o600).catch((error) => {
    if (error.code === "EEXIST") throw new Error(`Materialization lock already exists: ${LOCK_PATH}`);
    throw error;
  });
  try {
    await handle.writeFile(pretty({pid: process.pid, operation: "g4-l3-unresolved-frame-domain-materialization"}));
    return await action();
  } finally {
    await handle.close();
    await removeIfPresent(lock);
  }
}

async function copyBackup(sourceRelative, destinationRelative) {
  const destination = projectPath(destinationRelative);
  await mkdir(path.dirname(destination), {recursive: true});
  const sourceBytes = await readFile(projectPath(sourceRelative));
  const existing = await lstat(destination).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (existing) {
    invariant(existing.isFile() && !existing.isSymbolicLink(), `${destinationRelative}: existing backup is not a regular file`);
    const existingBytes = await readFile(destination);
    invariant(existingBytes.equals(sourceBytes), `${destinationRelative}: existing backup differs from the required preimage`);
  } else {
    await copyFile(projectPath(sourceRelative), destination, fsConstants.COPYFILE_EXCL);
    await chmod(destination, 0o444);
  }
  const bytes = await readFile(destination);
  return {path: destinationRelative, bytes: bytes.length, sha256: sha256(bytes)};
}

function markdown(report) {
  return `# G4 L3 unresolved frame-domain materialization\n\n`
    + `This fail-closed planning transaction converts every currently unresolved, source-static root-reachable G4 L3 timeline into an explicit pending capture-domain candidate. It does not establish original-runtime reachability, visual fidelity, audio, human review, owner acceptance, strict completion, or publication.\n\n`
    + `- Members changed: **${report.summary.changedMembers}/40**.\n`
    + `- Newly declared pending frame domains: **${report.summary.materializedFrameDomains}** (${report.summary.oneFrameScriptedDomains} one-frame scripted; ${report.summary.multiFrameExcludedDomains} multi-frame).\n`
    + `- New pending EN/ES requirements: **${report.summary.newPendingRequirements}**.\n`
    + `- New required source-domain frames across EN/ES: **${report.summary.newRequiredFrames}**.\n`
    + `- Authoritative runtime sessions / accepted baselines / strict completions / publications: **0 / 0 / 0 / 0**.\n`
    + `- Read-only preimage set: ignored \`${report.backup.root}\`; SHA-256 \`${report.backup.preimageSetSha256}\`.\n\n`
    + `The 17 timelines without a complete named placement chain are parented to the nearest safely declared ancestor (root) and explicitly retain unresolved runtime-entry state. Authorized natural execution may refine or supersede any candidate domain contract.\n`;
}

async function verifyBackupBinding(record) {
  invariant(record?.path?.startsWith("work/g4-l3-unresolved-frame-domain-preimages/")
    && Number.isSafeInteger(record.bytes) && record.bytes >= 0 && SHA256.test(record.sha256),
  "Materialization backup binding is malformed");
  const bytes = await readFile(projectPath(record.path));
  invariant(bytes.length === record.bytes && sha256(bytes) === record.sha256,
    `Materialization backup drifted: ${record.path}`);
}

async function verifyReceipt() {
  const reportRecord = await readBound(REPORT_PATH);
  const report = reportRecord.value;
  invariant(report.schemaVersion === 1 && report.reportType === "g4-l3-unresolved-frame-domain-materialization",
    "Unresolved frame-domain materialization receipt identity drifted");
  const generator = await hashBound(portable(path.relative(ROOT, SCRIPT_PATH)));
  invariant(pretty(report.generator) === pretty(binding(generator)), "Materialization generator binding is stale");
  invariant(report.summary?.changedMembers === 20
    && report.summary?.materializedFrameDomains === 149
    && report.summary?.oneFrameScriptedDomains === 5
    && report.summary?.multiFrameExcludedDomains === 144
    && report.summary?.newPendingRequirements === 298
    && report.summary?.newRequiredFrames === 8000
    && report.summary?.authoritativeRuntimeSessions === 0
    && report.summary?.strictCompletions === 0
    && report.summary?.publishedReleases === 0,
  "Materialization receipt summary drifted or was promoted");
  invariant(Object.values(report.acceptance || {}).every((value) => value === false),
    "Materialization receipt contains an acceptance claim");
  for (const record of report.backup.files || []) await verifyBackupBinding(record);
  for (const item of report.items || []) {
    const [manifestRecord, coverageRecord, beforeManifestBytes, beforeCoverageBytes, dispositionBytes, singleBytes, multiBytes] = await Promise.all([
      readBound(item.after.migrationJson.path),
      readBound(item.after.fullFrameCoverage.path),
      readFile(projectPath(item.before.migrationJson.backupPath)),
      readFile(projectPath(item.before.fullFrameCoverage.backupPath)),
      readFile(projectPath(item.sourceDisposition.backupPath)),
      readFile(projectPath(report.backup.sourceSnapshots.singleFrameCandidates.path)),
      readFile(projectPath(report.backup.sourceSnapshots.multiFrameCandidates.path)),
    ]);
    invariant(manifestRecord.bytes === item.after.migrationJson.bytes && manifestRecord.sha256 === item.after.migrationJson.sha256
      && coverageRecord.bytes === item.after.fullFrameCoverage.bytes && coverageRecord.sha256 === item.after.fullFrameCoverage.sha256,
    `${item.animationId}: materialized output drifted`);
    const beforeManifest = JSON.parse(beforeManifestBytes);
    const beforeCoverage = JSON.parse(beforeCoverageBytes);
    const disposition = JSON.parse(dispositionBytes);
    const single = JSON.parse(singleBytes);
    const multi = JSON.parse(multiBytes);
    validateExpandedPair({
      sequence: item.sequence,
      beforeManifest,
      beforeCoverage,
      afterManifest: manifestRecord.value,
      afterCoverage: coverageRecord.value,
      disposition,
      singleMember: candidateByAnimation(single, item.animationId),
      multiMember: candidateByAnimation(multi, item.animationId),
    });
  }
  invariant(report.items?.length === 20, "Materialization receipt must contain 20 changed members");
  return report;
}

async function createReceipt(inputs) {
  const preimageProjection = inputs.targets.map((target) => ({
    animationId: target.animationId,
    migrationJsonSha256: target.manifestRecord.sha256,
    fullFrameCoverageSha256: target.coverageRecord.sha256,
    dispositionSha256: target.dispositionRecord.sha256,
  }));
  const preimageSetSha256 = sha256(Buffer.from(canonicalJson(preimageProjection)));
  const backupRoot = `work/g4-l3-unresolved-frame-domain-preimages/${preimageSetSha256}`;
  const backupFiles = [];
  const sourceSnapshots = {};
  const snapshotSources = [
    ["lessonRelease", inputs.sourceRecords.releaseRecord],
    ["singleFrameCandidates", inputs.sourceRecords.singleRecord],
    ["singleFrameSelection", inputs.sourceRecords.singleSelectionRecord],
    ["multiFrameCandidates", inputs.sourceRecords.multiRecord],
    ["multiFrameSelection", inputs.sourceRecords.multiSelectionRecord],
  ];
  for (const [key, record] of snapshotSources) {
    const destination = `${backupRoot}/sources/${path.basename(record.path)}`;
    const copied = await copyBackup(record.path, destination);
    sourceSnapshots[key] = copied;
    backupFiles.push(copied);
  }
  for (const target of inputs.targets) {
    for (const [key, record, filename] of [
      ["migration", target.manifestRecord, "migration.json"],
      ["coverage", target.coverageRecord, "full-frame-coverage.json"],
      ["disposition", target.dispositionRecord, "frame-domain-disposition.json"],
    ]) {
      const destination = `${backupRoot}/${target.animationId}/${filename}`;
      const copied = await copyBackup(record.path, destination);
      target[`${key}Backup`] = copied;
      backupFiles.push(copied);
    }
  }
  const rows = [];
  const written = [];
  const restoreWritten = async () => {
    const restored = new Set();
    for (const entry of [...written].reverse()) {
      if (restored.has(entry.path)) continue;
      await atomicWrite(projectPath(entry.path), entry.bytes);
      restored.add(entry.path);
    }
  };
  try {
    for (const target of inputs.targets) {
      const manifestBytes = Buffer.from(pretty(target.expected.manifest));
      const coverageBytes = Buffer.from(pretty(target.expected.coverage));
      await atomicWrite(projectPath(target.manifestRecord.path), manifestBytes);
      written.push({path: target.manifestRecord.path, bytes: Buffer.from(pretty(target.manifestRecord.value))});
      await atomicWrite(projectPath(target.coverageRecord.path), coverageBytes);
      written.push({path: target.coverageRecord.path, bytes: Buffer.from(pretty(target.coverageRecord.value))});
      rows.push({
        sequence: target.sequence,
        animationId: target.animationId,
        sourceDisposition: {
          path: target.dispositionRecord.path,
          bytes: target.dispositionRecord.bytes,
          sha256: target.dispositionRecord.sha256,
          backupPath: target.dispositionBackup.path,
        },
        before: {
          migrationJson: {...binding(target.manifestRecord), backupPath: target.migrationBackup.path},
          fullFrameCoverage: {...binding(target.coverageRecord), backupPath: target.coverageBackup.path},
        },
        after: {
          migrationJson: {path: target.manifestRecord.path, bytes: manifestBytes.length, sha256: sha256(manifestBytes)},
          fullFrameCoverage: {path: target.coverageRecord.path, bytes: coverageBytes.length, sha256: sha256(coverageBytes)},
        },
        materializedFrameDomains: target.expected.domains.length,
        newPendingRequirements: target.expected.newRequirements.length,
        newRequiredFrames: target.expected.newRequirements.reduce((sum, requirement) =>
          sum + requirement.requiredRange.lastFrame - requirement.requiredRange.firstFrame + 1, 0),
        domainClassifications: target.expected.classifications,
        authoritativeRuntimeSessions: 0,
        strictComplete: false,
      });
    }
  } catch (error) {
    await restoreWritten();
    throw error;
  }
  try {
    const report = {
    schemaVersion: 1,
    reportType: "g4-l3-unresolved-frame-domain-materialization",
    generator: binding(await hashBound(portable(path.relative(ROOT, SCRIPT_PATH)))),
    scope: {releaseId: RELEASE_ID, releaseMembers: 40, changedMembers: rows.length},
    sourceBindingsAtTransaction: {
      lessonRelease: binding(inputs.sourceRecords.releaseRecord),
      singleFrameCandidates: binding(inputs.sourceRecords.singleRecord),
      singleFrameSelection: binding(inputs.sourceRecords.singleSelectionRecord),
      multiFrameCandidates: binding(inputs.sourceRecords.multiRecord),
      multiFrameSelection: binding(inputs.sourceRecords.multiSelectionRecord),
      dispositionSetSha256: sha256(Buffer.from(canonicalJson(inputs.dispositionBindings))),
    },
    backup: {
      root: backupRoot,
      preimageSetSha256,
      ignoredPrivateOrWorkArtifact: true,
      sourceSnapshots,
      files: backupFiles,
    },
    items: rows,
    summary: {
      changedMembers: rows.length,
      materializedFrameDomains: rows.reduce((sum, row) => sum + row.materializedFrameDomains, 0),
      oneFrameScriptedDomains: rows.flatMap(({domainClassifications}) => domainClassifications)
        .filter(({classification}) => classification.includes("one-frame")).length,
      multiFrameExcludedDomains: rows.flatMap(({domainClassifications}) => domainClassifications)
        .filter(({classification}) => classification.includes("multi-frame")).length,
      newPendingRequirements: rows.reduce((sum, row) => sum + row.newPendingRequirements, 0),
      newRequiredFrames: rows.reduce((sum, row) => sum + row.newRequiredFrames, 0),
      authoritativeRuntimeSessions: 0,
      acceptedBaselines: 0,
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
    strictAcceptanceEffect: "none; this transaction expands fail-closed capture obligations and cannot promote migration or release status",
    };
    invariant(report.summary.materializedFrameDomains === 149
      && report.summary.oneFrameScriptedDomains === 5
      && report.summary.multiFrameExcludedDomains === 144
      && report.summary.newPendingRequirements === 298
      && report.summary.newRequiredFrames === 8000,
    "Materialization aggregate differs from the reviewed 149-domain preimage");
    await atomicWrite(projectPath(REPORT_PATH), Buffer.from(pretty(report)));
    await atomicWrite(projectPath(REPORT_MARKDOWN_PATH), Buffer.from(markdown(report)));
    return await verifyReceipt();
  } catch (error) {
    await Promise.all([removeIfPresent(projectPath(REPORT_PATH)), removeIfPresent(projectPath(REPORT_MARKDOWN_PATH))]);
    await restoreWritten();
    throw error;
  }
}

export async function materialize({check = false} = {}) {
  const existing = await lstat(projectPath(REPORT_PATH)).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (existing) return verifyReceipt();
  invariant(!check, "Materialization receipt is missing");
  return withLock(async () => createReceipt(await loadInputs()));
}

export function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  materialize(parseArguments(process.argv.slice(2))).then((report) => {
    process.stdout.write(`PASS: ${report.summary.materializedFrameDomains} pending frame domains / ${report.summary.newPendingRequirements} EN/ES requirements; strict completion 0.\n`);
  }).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
