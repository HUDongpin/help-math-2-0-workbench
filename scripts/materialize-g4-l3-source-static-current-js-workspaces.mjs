#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {chmod, copyFile, lstat, mkdir, readFile, rename, stat, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {buildExpectedPendingCoverageDocuments} from "./materialize-g4-l3-valid-pending-root-coverage.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const CURRENT_JS_PROGRESS_PATH = "reports/g4-l3-current-javascript-progress.json";
const MACHINE_AUDIT_PATH = "reports/g4-l3-machine-source-audits.json";
const RUNTIME_CONTRACT_PATH = "reports/g4-l3-authoritative-runtime-acquisition-contract.json";
const REPORT_PATH = "reports/g4-l3-source-static-current-javascript-workspace-bindings.json";
const MARKDOWN_PATH = "reports/g4-l3-source-static-current-javascript-workspace-bindings.md";
const TEST_FILE = "scripts/build-g4-l3-current-javascript-progress.test.mjs";
const EXCLUDED = new Set([
  "course-g04-l03-in-009",
  "course-g04-l03-ts-006",
]);
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

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function sameJson(left, right) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
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

async function readBound(relativePath) {
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
    value: JSON.parse(bytes.toString("utf8")),
  };
}

async function hashFile(relativePath) {
  const absolute = projectPath(relativePath);
  const metadata = await lstat(absolute);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(), `${relativePath} must be a regular non-symlink file`);
  const physical = await stat(absolute);
  invariant(physical.nlink === 1, `${relativePath} must not be hard-linked`);
  const bytes = await readFile(absolute);
  return {path: portable(relativePath), bytes: bytes.length, sha256: sha256(bytes)};
}

function binding(record) {
  return {path: record.path, bytes: record.bytes, sha256: record.sha256};
}

function outputPath(value, label) {
  const candidate = typeof value === "string" ? value : value?.path;
  invariant(typeof candidate === "string" && candidate.length > 0, `${label} path is missing`);
  return candidate;
}

export function normalizeCandidateTimeline(candidate) {
  const root = candidate?.timeline?.root;
  const main = candidate?.timeline?.main
    ? {
      id: candidate.timeline.main.frameDomain,
      frameCount: candidate.timeline.main.frameCount,
      blockedFrameCount: candidate.timeline.main.blockedFrameCount ?? 0,
    }
    : {
      id: candidate?.timeline?.local?.timelineId,
      frameCount: candidate?.timeline?.local?.frameCount,
      blockedFrameCount: candidate?.timeline?.local?.blockedFrameCount ?? 0,
    };
  const rawCompanions = candidate?.timeline?.companions
    ?? (candidate?.timeline?.companion ? [candidate.timeline.companion] : []);
  const companions = rawCompanions.map((entry) => ({
    id: entry.frameDomain ?? entry.timelineId,
    frameCount: entry.frameCount,
  }));
  invariant(Number.isSafeInteger(root?.frameCount) && root.frameCount > 0,
    `${candidate?.animationId}: candidate root frame count is invalid`);
  invariant(/^sprite-[1-9][0-9]*$/.test(main.id ?? "")
    && Number.isSafeInteger(main.frameCount) && main.frameCount > 0
    && main.blockedFrameCount === 0,
  `${candidate?.animationId}: candidate main timeline is not an exhaustive renderable source-static domain`);
  invariant(companions.every(({id, frameCount}) => /^sprite-[1-9][0-9]*$/.test(id ?? "")
    && Number.isSafeInteger(frameCount) && frameCount > 0),
  `${candidate?.animationId}: candidate companion timeline is invalid`);
  invariant(new Set([main.id, ...companions.map(({id}) => id)]).size === companions.length + 1,
    `${candidate?.animationId}: candidate timeline identifiers are duplicated`);
  return {rootFrameCount: root.frameCount, main, companions};
}

function exactCandidate(candidate, animationId) {
  invariant(candidate.animationId === animationId
    && candidate.reportType === "current-javascript-engineering-candidate"
    && candidate.strictAcceptanceEffect === "none"
    && candidate.disposition?.currentJavaScriptCandidate === true
    && candidate.disposition?.strictLedgerChanged === false
    && candidate.disposition?.publicLibraryAdmitted === false
    && candidate.disposition?.productionAdmission === false
    && Object.values(candidate.acceptance ?? {}).every((value) => value === false),
  `${animationId}: candidate report is missing or has been promoted`);
}

export function buildCandidateBoundManifest({manifest, animationId, sequence, candidatePath, candidate, timeline, machineItem, registryEntry}) {
  invariant(manifest.animationId === animationId
    && manifest.status === "preserved"
    && manifest.runtime?.frameCount === timeline.rootFrameCount
    && manifest.localization?.languages?.join("|") === "en|es",
  `${animationId}: preserved migration identity or runtime scope drifted`);
  invariant(registryEntry?.key === animationId
    && registryEntry?.module === `./modules/${animationId}`
    && registryEntry?.maturity === "legacy-prototype",
  `${animationId}: prototype registry binding drifted`);
  const domains = machineItem?.swf?.frameDomains?.domains ?? [];
  const rootAudit = domains.find(({domainId}) => domainId === "root");
  const mainAudit = domains.find(({domainId}) => domainId === timeline.main.id);
  const mainSpriteId = Number(timeline.main.id.slice("sprite-".length));
  const rootPlacements = rootAudit?.placementEdges?.filter(({childSpriteId}) => childSpriteId === mainSpriteId) ?? [];
  invariant(rootAudit?.declaredFrameCount === timeline.rootFrameCount
    && mainAudit?.declaredFrameCount === timeline.main.frameCount
    && mainAudit?.staticallyRootReachable === true
    && rootPlacements.length === 1
    && Number.isSafeInteger(rootPlacements[0].firstFrame)
    && rootPlacements[0].firstFrame > 0,
  `${animationId}: machine-audit main timeline or root placement drifted`);
  for (const companion of timeline.companions) {
    const audit = domains.find(({domainId}) => domainId === companion.id);
    invariant(audit?.declaredFrameCount === companion.frameCount && audit?.staticallyRootReachable === true,
      `${animationId}: companion ${companion.id} differs from the machine audit`);
  }
  const existingRoot = manifest.implementation?.frameDomains?.find(({id}) => id === "root");
  const existingAdditionalDomains = manifest.implementation?.capturePlanning
    ?.sourceStaticReachablePendingRequirementsEstablished === true
    ? manifest.implementation.frameDomains.filter(({id}) => id !== "root" && id !== timeline.main.id)
    : [];
  invariant(existingRoot?.frameCount === timeline.rootFrameCount,
    `${animationId}: root frame-domain binding drifted`);
  const modulePath = outputPath(candidate.outputs?.prototypeModule, `${animationId} prototype module`);
  const timelinePath = outputPath(candidate.outputs?.pureTimeline, `${animationId} pure timeline`);
  const upgraded = structuredClone(manifest);
  upgraded.implementation = {
    ...upgraded.implementation,
    rendering: "source-static Canvas engineering candidate; root, Spanish, audio, interaction, Replay, runtime reachability, and fidelity fail closed",
    route: `/animations/${animationId}`,
    routeFile: "apps/web/app/[locale]/animations/[animationId]/page.tsx",
    component: modulePath,
    registryModule: registryEntry.module,
    timelineModule: timelinePath,
    testFile: TEST_FILE,
    standalonePackage: "",
    defaultFrameDomainId: timeline.main.id,
    frameDomains: [
      {
        ...existingRoot,
        frameCount: timeline.rootFrameCount,
        scenarioIds: ["root-unavailable"],
      },
      {
        id: timeline.main.id,
        kind: "nested",
        sourceTimelineId: timeline.main.id,
        sourceInstanceId: "animation",
        parentFrameDomainId: "root",
        parentEntryFrame: rootPlacements[0].firstFrame,
        localEntryFrame: 1,
        frameCount: timeline.main.frameCount,
        scenarioIds: ["source-static-frame"],
        role: "main-teaching-animation-source-static-candidate",
      },
      ...structuredClone(existingAdditionalDomains),
    ],
    candidateState: {
      status: "current-javascript-engineering-candidate-only",
      report: candidatePath,
      sourceStaticFrameDomain: timeline.main.id,
      sourceStaticFrames: {firstFrame: 1, lastFrame: timeline.main.frameCount},
      sourceStaticCompositeCandidateTimelineIds: timeline.companions.map(({id}) => id),
      rootEnabled: false,
      spanishEnabled: false,
      audioEnabled: false,
      replayParityEstablished: false,
      originalRuntimeBaselineUsed: false,
      rmseComputed: false,
      strictAcceptanceEffect: "none",
    },
  };
  upgraded.scenarios = manifest.implementation?.capturePlanning
    ?.sourceStaticReachablePendingRequirementsEstablished === true
    ? structuredClone(manifest.scenarios)
    : [
    {
      id: "root-unavailable",
      kind: "linear",
      description: "Current-JavaScript diagnostic identity for the source root obligation. The root remains disabled until an authorized natural original-runtime trace establishes its behavior.",
      reachable: true,
    },
    {
      id: "source-static-frame",
      kind: "linear",
      description: `Current-JavaScript diagnostic identity for the source-static ${timeline.main.id} drawing candidate. Natural runtime reachability, Spanish visuals, audio, Replay, behavior, and fidelity remain unresolved.`,
      reachable: true,
    },
    ];
  upgraded.evidence = {
    ...upgraded.evidence,
    currentJavascriptCandidateReport: candidatePath,
    currentJavascriptAssetManifest: outputPath(candidate.outputs?.canvasManifest, `${animationId} Canvas manifest`),
  };
  return upgraded;
}

function validateExpectedPair({item, manifest, coverage, candidatePath, candidate, timeline, machineItem, registryEntry}) {
  const expectedManifest = buildCandidateBoundManifest({
    manifest,
    animationId: item.animationId,
    sequence: item.sequence,
    candidatePath,
    candidate,
    timeline,
    machineItem,
    registryEntry,
  });
  const expected = buildExpectedPendingCoverageDocuments({
    item,
    manifest: expectedManifest,
    coverage,
  });
  invariant(sameJson(expected.manifest, manifest), `${item.animationId}: candidate-bound migration drifted`);
  invariant(sameJson(expected.coverage, coverage), `${item.animationId}: candidate-bound coverage drifted`);
  const materializedDomainCount = manifest.implementation.capturePlanning
    .sourceStaticReachablePendingFrameDomainIds?.length ?? 0;
  const structuralPlanningClosed = manifest.implementation.capturePlanning
    .structuralFrameDomainPlanningClosed === true;
  invariant(coverage.requirements.length === 4 + materializedDomainCount * 2
    && coverage.requirements.filter(({frameDomainId}) => frameDomainId === timeline.main.id).length === 2
    && coverage.requirements.every(({status, baselineAuthority}) => status === "pending" && baselineAuthority === "unresolved")
    && (materializedDomainCount > 0 || structuralPlanningClosed
      ? manifest.implementation.capturePlanning.nestedFrameDomainDispositionEstablished === true
        && manifest.implementation.capturePlanning.authoritativeRuntimeFrameDomainDispositionEstablished === false
        && manifest.implementation.capturePlanning.unresolvedTimelineCandidateIds.length === 0
      : manifest.implementation.capturePlanning.nestedFrameDomainDispositionEstablished === false
        && manifest.implementation.capturePlanning.unresolvedTimelineCandidateIds.length === timeline.companions.length),
  `${item.animationId}: candidate-bound workspace has an authority, coverage, or disposition overclaim`);
}

async function loadInputs() {
  const [progressRecord, machineRecord, contractRecord] = await Promise.all([
    readBound(CURRENT_JS_PROGRESS_PATH),
    readBound(MACHINE_AUDIT_PATH),
    readBound(RUNTIME_CONTRACT_PATH),
  ]);
  const progress = progressRecord.value;
  const machine = machineRecord.value;
  const contract = contractRecord.value;
  invariant(progress.summary?.activePages === 39 && progress.summary?.currentJavaScriptModules === 39,
    "G4 L3 current-JavaScript progress scope drifted");
  invariant(machine.summary?.canonicalItems === 40 && machine.items?.length === 40,
    "G4 L3 machine-audit scope drifted");
  invariant(contract.summary?.canonicalItems === 40 && contract.items?.length === 40,
    "G4 L3 runtime contract scope drifted");
  const targets = [];
  for (const page of progress.pages) {
    if (EXCLUDED.has(page.animationId)) continue;
    invariant(page.currentJavaScript?.candidateReport?.path, `${page.animationId}: candidate report binding is missing`);
    const candidateRecord = await readBound(page.currentJavaScript.candidateReport.path);
    invariant(candidateRecord.bytes === page.currentJavaScript.candidateReport.bytes
      && candidateRecord.sha256 === page.currentJavaScript.candidateReport.sha256,
    `${page.animationId}: candidate report differs from current-JavaScript progress`);
    const candidate = candidateRecord.value;
    exactCandidate(candidate, page.animationId);
    const timeline = normalizeCandidateTimeline(candidate);
    const item = contract.items.find(({animationId}) => animationId === page.animationId);
    const machineItem = machine.items.find(({animationId}) => animationId === page.animationId);
    invariant(item && machineItem && item.sequence === page.globalPageOrdinal,
      `${page.animationId}: release sequence or source-audit binding drifted`);
    const moduleBinding = page.currentJavaScript.module;
    const modulePath = outputPath(candidate.outputs?.prototypeModule, `${page.animationId} prototype module`);
    invariant(moduleBinding?.path === modulePath, `${page.animationId}: prototype module path drifted`);
    const moduleRecord = await hashFile(modulePath);
    invariant(moduleRecord.bytes === moduleBinding.bytes && moduleRecord.sha256 === moduleBinding.sha256,
      `${page.animationId}: prototype module differs from its candidate binding`);
    targets.push({
      item,
      machineItem,
      candidate,
      candidatePath: candidateRecord.path,
      candidateBinding: binding(candidateRecord),
      timeline,
      registryEntry: page.currentJavaScript.registryEntry,
    });
  }
  invariant(targets.length === 37, `Expected 37 source-static workspace targets, found ${targets.length}`);
  return {
    targets,
    sourceBindings: {
      currentJavascriptProgress: binding(progressRecord),
      machineSourceAudits: binding(machineRecord),
      runtimeAcquisitionContract: binding(contractRecord),
    },
  };
}

async function currentPair(target) {
  const migrationPath = `migrations/${target.item.animationId}/migration.json`;
  const coveragePath = `migrations/${target.item.animationId}/evidence/full-frame-coverage.json`;
  const [migrationRecord, coverageRecord] = await Promise.all([
    readBound(migrationPath),
    readBound(coveragePath),
  ]);
  return {
    migrationPath,
    coveragePath,
    migrationRecord,
    coverageRecord,
    manifest: migrationRecord.value,
    coverage: coverageRecord.value,
  };
}

function buildPlan(target, current) {
  const alreadyBound = current.manifest.implementation?.candidateState?.status
    === "current-javascript-engineering-candidate-only";
  if (alreadyBound) {
    validateExpectedPair({...target, manifest: current.manifest, coverage: current.coverage});
    return {manifest: current.manifest, coverage: current.coverage, alreadyBound};
  }
  const rootOnly = buildExpectedPendingCoverageDocuments({
    item: target.item,
    manifest: current.manifest,
    coverage: current.coverage,
  });
  invariant(sameJson(rootOnly.manifest, current.manifest)
    && sameJson(rootOnly.coverage, current.coverage)
    && current.coverage.requirements.length === 2,
  `${target.item.animationId}: refusing to overwrite a noncanonical root-only workspace`);
  const manifest = buildCandidateBoundManifest({
    manifest: current.manifest,
    animationId: target.item.animationId,
    sequence: target.item.sequence,
    candidatePath: target.candidatePath,
    candidate: target.candidate,
    timeline: target.timeline,
    machineItem: target.machineItem,
    registryEntry: target.registryEntry,
  });
  const expected = buildExpectedPendingCoverageDocuments({item: target.item, manifest});
  validateExpectedPair({...target, manifest: expected.manifest, coverage: expected.coverage});
  return {...expected, alreadyBound};
}

async function removeIfPresent(file) {
  await unlink(file).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
}

async function atomicWrite(file, bytes) {
  const temporary = `${file}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, file);
}

async function replacePairWithRollback(current, nextManifestBytes, nextCoverageBytes) {
  const migrationTarget = projectPath(current.migrationPath);
  const coverageTarget = projectPath(current.coveragePath);
  const migrationTemp = `${migrationTarget}.pending-${process.pid}`;
  const coverageTemp = `${coverageTarget}.pending-${process.pid}`;
  await writeFile(migrationTemp, nextManifestBytes, {flag: "wx"});
  try {
    await writeFile(coverageTemp, nextCoverageBytes, {flag: "wx"});
    await rename(migrationTemp, migrationTarget);
    try {
      await rename(coverageTemp, coverageTarget);
    } catch (error) {
      await writeFile(migrationTemp, Buffer.from(pretty(current.manifest)), {flag: "wx"});
      await rename(migrationTemp, migrationTarget);
      throw error;
    }
  } finally {
    await Promise.all([removeIfPresent(migrationTemp), removeIfPresent(coverageTemp)]);
  }
}

function itemReceipt(target, current, plan, before = null) {
  const planning = current.manifest.implementation?.capturePlanning || {};
  return {
    sequence: target.item.sequence,
    animationId: target.item.animationId,
    candidateReport: target.candidateBinding,
    sourceStaticMainDomain: target.timeline.main.id,
    sourceStaticMainFrameCount: target.timeline.main.frameCount,
    sourceStaticCompositeCandidateCount: target.timeline.companions.length,
    sourceStaticCompositeCandidateTimelineIds: target.timeline.companions.map(({id}) => id),
    materializedPendingFrameDomainCount: planning.sourceStaticReachablePendingFrameDomainIds?.length ?? 0,
    materializedPendingFrameDomainIds: planning.sourceStaticReachablePendingFrameDomainIds ?? [],
    unresolvedTimelineCandidateCount: planning.unresolvedTimelineCandidateIds?.length ?? 0,
    before,
    after: {
      migrationJson: binding(current.migrationRecord),
      fullFrameCoverage: binding(current.coverageRecord),
    },
    pendingRequirements: plan.coverage.requirements.length,
    pendingNestedRequirements: plan.coverage.requirements.filter(({frameDomainId}) => frameDomainId !== "root").length,
    authoritativeRuntimeSessions: 0,
    strictComplete: false,
  };
}

function reportMarkdown(report) {
  return `# G4 L3 Source-Static Current-JavaScript Workspace Bindings\n\n`
    + `This fail-closed transaction binds the 37 remaining source-static JavaScript candidates to their migration workspaces without promoting them.\n\n`
    + `- Bound workspaces: **${report.summary.boundWorkspaces}/37**.\n`
    + `- Conservative main frame domains: **${report.summary.mainFrameDomains}** containing **${report.summary.mainFrames}** frames.\n`
    + `- Pending nested-domain EN/ES requirements: **${report.summary.pendingNestedRequirements}**.\n`
    + `- Materialized source-static reachable domains: **${report.summary.materializedPendingFrameDomains}**.\n`
    + `- Structurally reachable timeline candidates still unresolved in these workspaces: **${report.summary.unresolvedCompositeCandidateTimelines}**.\n`
    + `- Original-runtime sessions / baselines / RMSE pairs / strict completions: **0 / 0 / 0 / 0**.\n\n`
    + `The new domains are capture identities for current-JavaScript implementation evidence. Static SWF reachability and candidate renderability do not establish natural runtime reachability, Spanish behavior, audio, interaction, Replay parity, human review, owner acceptance, or publication.\n`;
}

async function verifyOrRefresh(inputs, {refresh = false} = {}) {
  const reportRecord = await readBound(REPORT_PATH);
  const report = reportRecord.value;
  invariant(report.schemaVersion === 1
    && report.reportType === "g4-l3-source-static-current-javascript-workspace-bindings"
    && report.items?.length === 37
    && Object.values(report.acceptance ?? {}).every((value) => value === false),
  "Source-static workspace-binding report is malformed or promoted");
  const generator = await hashFile(portable(path.relative(ROOT, SCRIPT_PATH)));
  const items = [];
  for (const target of inputs.targets) {
    const current = await currentPair(target);
    const plan = buildPlan(target, current);
    const prior = report.items.find(({animationId}) => animationId === target.item.animationId);
    invariant(prior, `${target.item.animationId}: workspace-binding receipt is missing`);
    items.push(itemReceipt(target, current, plan, prior.before ?? null));
  }
  const summary = {
    boundWorkspaces: items.length,
    mainFrameDomains: items.length,
    mainFrames: items.reduce((sum, item) => sum + item.sourceStaticMainFrameCount, 0),
    pendingNestedRequirements: items.reduce((sum, item) => sum + item.pendingNestedRequirements, 0),
    materializedPendingFrameDomains: items.reduce((sum, item) => sum + item.materializedPendingFrameDomainCount, 0),
    unresolvedCompositeCandidateTimelines: items.reduce((sum, item) => sum + item.unresolvedTimelineCandidateCount, 0),
    authoritativeRuntimeSessions: 0,
    authoritativeBaselines: 0,
    pairedRmseRequirements: 0,
    strictCompletions: 0,
  };
  const current = pretty(report.generator) === pretty(generator)
    && pretty(report.sourceBindings) === pretty(inputs.sourceBindings)
    && pretty(report.items) === pretty(items)
    && pretty(report.summary) === pretty(summary);
  if (current) return report;
  invariant(refresh, "Source-static workspace-binding report is stale; rerun with --refresh after validating current documents");
  const refreshed = {
    ...report,
    generator,
    sourceBindings: inputs.sourceBindings,
    items,
    summary,
    refreshHistory: [
      ...(report.refreshHistory ?? []),
      {
        priorReportSha256: reportRecord.sha256,
        migrationOrCoverageDocumentsRewritten: false,
        disposition: "receipt-only-rebind-after-exact-acceptance-neutral-workspace-validation",
      },
    ],
  };
  await atomicWrite(projectPath(REPORT_PATH), Buffer.from(pretty(refreshed)));
  await atomicWrite(projectPath(MARKDOWN_PATH), Buffer.from(reportMarkdown(refreshed)));
  return refreshed;
}

export async function materialize({check = false, refresh = false} = {}) {
  invariant(!(check && refresh), "--check and --refresh are mutually exclusive");
  const inputs = await loadInputs();
  const reportExists = await lstat(projectPath(REPORT_PATH)).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (reportExists) return verifyOrRefresh(inputs, {refresh});
  invariant(!check && !refresh, "Cannot check or refresh a missing source-static workspace-binding report");
  const plans = [];
  for (const target of inputs.targets) {
    const current = await currentPair(target);
    const plan = buildPlan(target, current);
    invariant(!plan.alreadyBound, `${target.item.animationId}: report is missing but workspace is already bound`);
    plans.push({target, current, plan});
  }
  const preimageProjection = plans.map(({target, current}) => ({
    animationId: target.item.animationId,
    migrationJsonSha256: current.migrationRecord.sha256,
    fullFrameCoverageSha256: current.coverageRecord.sha256,
  }));
  const preimageSetSha256 = sha256(Buffer.from(JSON.stringify(preimageProjection)));
  const backupRoot = `work/g4-l3-source-static-workspace-binding-preimages/${preimageSetSha256}`;
  await mkdir(projectPath(backupRoot), {recursive: true});
  for (const {target, current} of plans) {
    const itemRoot = projectPath(`${backupRoot}/${target.item.animationId}`);
    await mkdir(itemRoot, {recursive: true});
    for (const [name, source] of [["migration.json", current.migrationPath], ["full-frame-coverage.json", current.coveragePath]]) {
      const destination = path.join(itemRoot, name);
      await copyFile(projectPath(source), destination, fsConstants.COPYFILE_EXCL);
      await chmod(destination, 0o444);
    }
  }
  const rows = [];
  for (const {target, current, plan} of plans) {
    const before = {
      migrationJson: binding(current.migrationRecord),
      fullFrameCoverage: binding(current.coverageRecord),
    };
    await replacePairWithRollback(current, Buffer.from(pretty(plan.manifest)), Buffer.from(pretty(plan.coverage)));
    const written = await currentPair(target);
    validateExpectedPair({...target, manifest: written.manifest, coverage: written.coverage});
    rows.push(itemReceipt(target, written, plan, before));
  }
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-source-static-current-javascript-workspace-bindings",
    generator: await hashFile(portable(path.relative(ROOT, SCRIPT_PATH))),
    sourceBindings: inputs.sourceBindings,
    scope: {
      releaseId: "lesson-g04-l03-negative-numbers",
      boundWorkspaces: 37,
      excludedAlreadyBoundOrDistinctCandidates: [...EXCLUDED].sort(),
    },
    backup: {root: backupRoot, preimageSetSha256, ignoredPrivateOrWorkArtifact: true},
    items: rows,
    summary: {
      boundWorkspaces: rows.length,
      mainFrameDomains: rows.length,
      mainFrames: rows.reduce((sum, item) => sum + item.sourceStaticMainFrameCount, 0),
      pendingNestedRequirements: rows.length * 2,
      unresolvedCompositeCandidateTimelines: rows.reduce((sum, item) => sum + item.sourceStaticCompositeCandidateCount, 0),
      authoritativeRuntimeSessions: 0,
      authoritativeBaselines: 0,
      pairedRmseRequirements: 0,
      strictCompletions: 0,
    },
    acceptance: {
      implementationAuthorized: false,
      authoritativeOriginalRuntimeComplete: false,
      naturalRuntimeReachabilityComplete: false,
      bilingualVisualParityComplete: false,
      audioAccepted: false,
      replayParityComplete: false,
      fullFrameRmseComplete: false,
      humanVisualReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
  };
  await atomicWrite(projectPath(REPORT_PATH), Buffer.from(pretty(report)));
  await atomicWrite(projectPath(MARKDOWN_PATH), Buffer.from(reportMarkdown(report)));
  return report;
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
    process.stdout.write(`PASS: ${report.summary.boundWorkspaces}/37 source-static workspaces bind `
      + `${report.summary.mainFrames} main-domain frames; strict completion 0.\n`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
