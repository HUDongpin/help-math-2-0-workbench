#!/usr/bin/env node

import {createHash} from "node:crypto";
import {constants as fsConstants} from "node:fs";
import {chmod, copyFile, lstat, mkdir, readFile, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const CONTRACT_PATH = "reports/g4-l3-authoritative-runtime-acquisition-contract.json";
const RELEASE_PATH = "catalog/lesson-releases.json";
const REPORT_JSON = "reports/g4-l3-valid-pending-root-coverage-upgrade.json";
const REPORT_MARKDOWN = "reports/g4-l3-valid-pending-root-coverage-upgrade.md";
export const TS006_ANIMATION_ID = "course-g04-l03-ts-006";
export const TS006_NESTED_DOMAIN = Object.freeze({
  id: "sprite-23",
  kind: "nested",
  sourceTimelineId: "sprite-23",
  sourceInstanceId: "animation",
  parentFrameDomainId: "root",
  parentEntryFrame: 6,
  localEntryFrame: 1,
  frameCount: 128,
  scenarioIds: ["source-static-frame"],
  role: "main-teaching-animation",
});
export const TS006_SCENARIOS = Object.freeze([
  Object.freeze({
    id: "root-unavailable",
    kind: "linear",
    description: "Current-JavaScript diagnostic identity for the 10-frame root obligation. The root is deliberately blocked until an authorized natural original-runtime trace establishes its behavior.",
    reachable: true,
  }),
  Object.freeze({
    id: "source-static-frame",
    kind: "linear",
    description: "Current-JavaScript diagnostic identity for the source-static sprite-23 drawing candidate. Natural runtime reachability, Spanish visuals, audio, Replay, behavior, and fidelity remain unresolved.",
    reachable: true,
  }),
]);
const EXCLUDED_ALREADY_VALID = new Set([
  "course-g04-l03-in-009",
  "shell-course-g04-l03-index-local",
]);
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

function sameJson(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function relative(file) {
  const candidate = path.relative(ROOT, file).split(path.sep).join("/");
  invariant(candidate && !candidate.startsWith("../") && !path.isAbsolute(candidate), `${file} escapes project root`);
  return candidate;
}

async function binding(relativePath) {
  const bytes = await readFile(path.join(ROOT, relativePath));
  return {path: relativePath, bytes: bytes.length, sha256: sha256(bytes)};
}

function exactRelease(document) {
  const release = document.releases?.find(({releaseId}) => releaseId === "lesson-g04-l03-negative-numbers");
  invariant(release?.publicationMode === "atomic" && release.members?.length === 40,
    "G4 L3 atomic release scope drifted");
  invariant(release.members.every(({ordinal}, index) => ordinal === index + 1),
    "G4 L3 release ordering drifted");
  return release;
}

export function buildPendingRootRequirement({item, language, scenario = "default"}) {
  const entryState = {
    authoritativeTraceExecuted: false,
    frameDomainId: "root",
    kind: "lesson-shell-natural-entry",
    language,
    releaseId: "lesson-g04-l03-negative-numbers",
    rootEntryFrame: 1,
    scenario,
    seed: "0",
    sourceScenarioCandidateId: "root-natural-entry-and-playback",
    targetAnimationId: item.animationId,
    targetSequence: item.sequence,
  };
  const frameCount = item.nativeRuntimeFacts.rootFrameCount;
  return {
    requirementId: `req:root:lesson-shell-natural-entry:${language}`,
    scenario,
    frameDomainId: "root",
    traceId: `trace:root:lesson-shell-natural-entry:${language}:seed-0`,
    language,
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: frameCount},
    entryState,
    entryStateSha256: sha256(Buffer.from(canonicalJson(entryState))),
    baselineAuthorityRequirement: "original-runtime-natural-trace",
    baselineAuthority: "unresolved",
    status: "pending",
    capturedFrameCount: 0,
    missingFrames: Array.from({length: frameCount}, (_, index) => index + 1),
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
    planningAuthority: "source-bound-candidate-only-not-executed-original-runtime-evidence",
  };
}

export function buildPendingNestedRequirement({item, language, domain = TS006_NESTED_DOMAIN}) {
  invariant(domain?.kind === "nested"
    && /^sprite-[1-9][0-9]*$/.test(domain.id ?? "")
    && domain.sourceTimelineId === domain.id
    && domain.parentFrameDomainId === "root"
    && Number.isSafeInteger(domain.parentEntryFrame) && domain.parentEntryFrame > 0
    && Number.isSafeInteger(domain.localEntryFrame) && domain.localEntryFrame > 0
    && Number.isSafeInteger(domain.frameCount) && domain.frameCount > 0
    && domain.scenarioIds?.join("|") === "source-static-frame",
  `${item.animationId}: malformed conservative nested-domain candidate`);
  const entryState = {
    authoritativeTraceExecuted: false,
    frameDomainId: domain.id,
    kind: "lesson-shell-natural-entry-to-nested-domain",
    language,
    localEntryFrameCandidate: domain.localEntryFrame,
    parentEntryFrameCandidate: domain.parentEntryFrame,
    parentFrameDomainId: domain.parentFrameDomainId,
    releaseId: "lesson-g04-l03-negative-numbers",
    rootEntryFrame: domain.parentEntryFrame,
    runtimeReachabilityEstablished: false,
    scenario: domain.scenarioIds[0],
    seed: "0",
    sourceInstanceId: domain.sourceInstanceId,
    sourceScenarioCandidateId: "root-natural-entry-and-playback",
    sourceTimelineId: domain.sourceTimelineId,
    targetAnimationId: item.animationId,
    targetSequence: item.sequence,
  };
  return {
    requirementId: `req:${domain.id}:lesson-shell-natural-entry:${language}`,
    scenario: domain.scenarioIds[0],
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
    planningAuthority: "conservative-source-bound-domain-candidate-not-executed-original-runtime-evidence",
  };
}

function isLegacyPlaceholder(coverage) {
  return coverage.schemaVersion === 2
    && coverage.requirements?.length === 2
    && coverage.requirements.every((requirement) =>
      requirement.frameDomainId === "root"
      && requirement.scenario === "default"
      && requirement.requiredRange?.firstFrame === 1
      && requirement.requiredRange?.lastFrame === 0
      && requirement.status === "pending");
}

function validateMaterializedReachableDomainState({item, manifest, coverage}) {
  const planning = manifest.implementation?.capturePlanning;
  const materializedIds = planning?.sourceStaticReachablePendingFrameDomainIds;
  invariant(Array.isArray(materializedIds) && materializedIds.length > 0
    && new Set(materializedIds).size === materializedIds.length
    && planning.sourceStaticReachablePendingRequirementsEstablished === true
    && planning.nestedFrameDomainDispositionEstablished === true
    && planning.authoritativeRuntimeFrameDomainDispositionEstablished === false
    && planning.runtimeReachabilityEstablished === false
    && planning.unresolvedTimelineCandidateIds?.length === 0
    && planning.strictAcceptanceEffect === "none",
  `${item.animationId}: materialized reachable-domain planning state is incomplete or promoted`);
  const scenario = manifest.scenarios?.find(({id}) => id === "source-static-reachable-domain");
  invariant(scenario?.reachable === false
    && scenario.sourceStaticReachable === true
    && scenario.authoritativeRuntimeReachabilityEstablished === false,
  `${item.animationId}: source-static reachable scenario is missing or promoted`);
  const domainsById = new Map((manifest.implementation?.frameDomains || []).map((domain) => [domain.id, domain]));
  invariant(domainsById.size === manifest.implementation.frameDomains.length,
    `${item.animationId}: materialized frame-domain IDs are duplicated`);
  for (const id of materializedIds) {
    const domain = domainsById.get(id);
    invariant(domain?.kind === "nested"
      && domain.sourceTimelineId === id
      && domainsById.has(domain.parentFrameDomainId)
      && Number.isSafeInteger(domain.frameCount) && domain.frameCount > 0
      && domain.scenarioIds?.join("|") === "source-static-reachable-domain"
      && domain.role === "source-static-reachable-capture-domain-candidate-runtime-unverified"
      && domain.sourceStaticReachability?.runtimeReachabilityEstablished === false,
    `${item.animationId}/${id}: materialized reachable frame domain drifted`);
    const requirements = coverage?.requirements?.filter(({frameDomainId}) => frameDomainId === id) || [];
    invariant(requirements.length === 2
      && requirements.map(({language}) => language).sort().join("|") === "en|es"
      && requirements.every((requirement) => requirement.scenario === "source-static-reachable-domain"
        && requirement.requiredRange?.firstFrame === 1
        && requirement.requiredRange?.lastFrame === domain.frameCount
        && requirement.entryState?.authoritativeTraceExecuted === false
        && requirement.entryState?.runtimeReachabilityEstablished === false
        && requirement.entryState?.frameDomainId === id
        && requirement.entryStateSha256 === sha256(Buffer.from(canonicalJson(requirement.entryState)))
        && requirement.baselineAuthorityRequirement === "original-runtime-natural-trace"
        && requirement.baselineAuthority === "unresolved"
        && requirement.status === "pending"
        && requirement.capturedFrameCount === 0
        && requirement.missingFrames?.length === domain.frameCount
        && requirement.baselineCaptureManifest === ""
        && requirement.captureManifest === ""
        && requirement.metricsFile === ""),
    `${item.animationId}/${id}: materialized EN/ES coverage is incomplete or promoted`);
  }
  const declaredMaterializedRequirementCount = coverage.requirements
    .filter(({frameDomainId}) => materializedIds.includes(frameDomainId)).length;
  invariant(declaredMaterializedRequirementCount === materializedIds.length * 2,
    `${item.animationId}: materialized requirement set contains duplicate or extra identities`);
}

const IMPLEMENTATION_CAPTURE_OVERLAY_FIELDS = [
  "blockingReason",
  "capturedFrameCount",
  "missingFrames",
  "captureManifest",
  "captureManifestSha256",
  "blockingEvidence",
];

function withoutImplementationCaptureOverlay(requirement) {
  const projection = structuredClone(requirement);
  for (const key of IMPLEMENTATION_CAPTURE_OVERLAY_FIELDS) delete projection[key];
  return projection;
}

export function canonicalAcceptanceNeutralBlockingEvidence(requirement) {
  const evidence = requirement.blockingEvidence;
  if (evidence === undefined || (Array.isArray(evidence) && evidence.length === 0)) return [];
  invariant(Array.isArray(evidence),
    `${requirement.requirementId || "coverage requirement"}: blockingEvidence must be an array`);
  const scenarioEntries = evidence.filter(({file}) => file === "audit/scenario-inventory.json");
  invariant(scenarioEntries.length <= 1,
    `${requirement.requirementId || "coverage requirement"}: duplicate scenario-inventory blocking evidence`);
  const capturePath = typeof requirement.captureManifest === "string" && requirement.captureManifest
    ? requirement.captureManifest
    : null;
  const captureEntries = capturePath ? evidence.filter(({file}) => file === capturePath) : [];
  invariant(captureEntries.length === (capturePath ? 1 : 0),
    `${requirement.requirementId || "coverage requirement"}: current-JavaScript capture blocking evidence is missing or duplicated`);
  invariant(evidence.length === scenarioEntries.length + captureEntries.length,
    `${requirement.requirementId || "coverage requirement"}: unrecognized blocking evidence cannot be preserved as an acceptance-neutral overlay`);
  for (const [index, entry] of [...scenarioEntries, ...captureEntries].entries()) {
    invariant(entry && typeof entry === "object"
      && typeof entry.file === "string" && entry.file.length > 0
      && SHA256.test(entry.sha256),
    `${requirement.requirementId || "coverage requirement"}: blockingEvidence[${index}] is malformed`);
  }
  if (capturePath) {
    invariant(captureEntries[0].sha256 === requirement.captureManifestSha256,
      `${requirement.requirementId || "coverage requirement"}: capture blocking evidence hash differs from captureManifestSha256`);
  }
  return [...scenarioEntries, ...captureEntries].map((entry) => structuredClone(entry));
}

export function applyAcceptanceNeutralImplementationCaptureOverlay({expectedCoverage, currentCoverage, manifest}) {
  if (!currentCoverage) return expectedCoverage;
  invariant(currentCoverage.schemaVersion === expectedCoverage.schemaVersion
    && currentCoverage.animationId === expectedCoverage.animationId,
  `${expectedCoverage.animationId}: implementation-capture overlay coverage identity drifted`);
  invariant(currentCoverage.requirements?.length === expectedCoverage.requirements.length,
    `${expectedCoverage.animationId}: implementation-capture overlay requirement count drifted`);
  const currentById = new Map(currentCoverage.requirements.map((requirement) => [requirement.requirementId, requirement]));
  invariant(currentById.size === currentCoverage.requirements.length,
    `${expectedCoverage.animationId}: implementation-capture overlay has duplicate requirement IDs`);
  const candidateManifests = manifest.evidence?.candidateCaptureManifests || [];
  const adoption = manifest.evidence?.currentJavaScriptImplementationCaptureAdoption;
  const requirements = expectedCoverage.requirements.map((expected) => {
    const current = currentById.get(expected.requirementId);
    invariant(current, `${expectedCoverage.animationId}: implementation-capture overlay is missing ${expected.requirementId}`);
    invariant(pretty(withoutImplementationCaptureOverlay(current)) === pretty(withoutImplementationCaptureOverlay(expected)),
      `${expectedCoverage.animationId}: non-capture requirement fields drifted for ${expected.requirementId}`);
    const blockingEvidence = canonicalAcceptanceNeutralBlockingEvidence(current);
    const hasCapture = current.capturedFrameCount !== 0
      || current.captureManifest !== ""
      || current.captureManifestSha256 !== "";
    if (!hasCapture) {
      invariant(current.capturedFrameCount === 0
        && pretty(current.missingFrames) === pretty(expected.missingFrames)
        && current.captureManifest === ""
        && current.captureManifestSha256 === "",
      `${expectedCoverage.animationId}: incomplete implementation-capture overlay for ${expected.requirementId}`);
      return blockingEvidence.length
        ? {...expected, blockingEvidence}
        : expected;
    }
    const requiredFrameCount = expected.requiredRange.lastFrame - expected.requiredRange.firstFrame + 1;
    invariant(current.status === "pending"
      && current.baselineAuthority === "unresolved"
      && current.baselineCaptureManifest === ""
      && current.baselineCaptureManifestSha256 === ""
      && current.metricsFile === ""
      && current.metricsSha256 === ""
      && current.capturedFrameCount === requiredFrameCount
      && Array.isArray(current.missingFrames) && current.missingFrames.length === 0
      && typeof current.captureManifest === "string"
      && current.captureManifest.startsWith("output/playwright/")
      && SHA256.test(current.captureManifestSha256)
      && typeof current.blockingReason === "string" && current.blockingReason.length > 0,
    `${expectedCoverage.animationId}: implementation capture for ${expected.requirementId} is incomplete or overclaims authority`);
    invariant(Array.isArray(current.blockingEvidence)
      && current.blockingEvidence.some(({file, sha256: digest}) =>
        file === current.captureManifest && digest === current.captureManifestSha256),
    `${expectedCoverage.animationId}: implementation capture for ${expected.requirementId} is not bound as blocking evidence`);
    const candidate = candidateManifests.find(({requirementId}) => requirementId === expected.requirementId);
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
    `${expectedCoverage.animationId}: implementation capture for ${expected.requirementId} is not bound in migration.json`);
    invariant(adoption?.path === "evidence/current-javascript-implementation-capture-adoption.json"
      && SHA256.test(adoption.sha256)
      && adoption.authority === "non-authoritative-current-javascript-output"
      && adoption.strictAcceptanceEffect === "none",
    `${expectedCoverage.animationId}: implementation capture adoption binding is missing or promoted`);
    const overlay = Object.fromEntries(
      IMPLEMENTATION_CAPTURE_OVERLAY_FIELDS
        .filter((key) => key !== "blockingEvidence")
        .filter((key) => Object.hasOwn(current, key))
        .map((key) => [key, structuredClone(current[key])]),
    );
    if (blockingEvidence.length) overlay.blockingEvidence = blockingEvidence;
    return Object.assign(structuredClone(expected), overlay);
  });
  return {...expectedCoverage, requirements};
}

export function buildExpectedPendingCoverageDocuments({item, manifest, coverage: currentCoverage}) {
  invariant(manifest.animationId === item.animationId, `${item.animationId}: migration identity drifted`);
  invariant(manifest.runtime?.frameCount === item.nativeRuntimeFacts.rootFrameCount,
    `${item.animationId}: migration root frame count differs from the source-bound contract`);
  invariant(manifest.localization?.languages?.join("|") === "en|es",
    `${item.animationId}: expected exact EN/ES localization scope`);
  if (manifest.implementation?.capturePlanning?.sourceStaticReachablePendingRequirementsEstablished === true) {
    invariant(currentCoverage, `${item.animationId}: materialized reachable domains require the current coverage document`);
    validateMaterializedReachableDomainState({item, manifest, coverage: currentCoverage});
    return {manifest: structuredClone(manifest), coverage: structuredClone(currentCoverage)};
  }
  const isTs006 = item.animationId === TS006_ANIMATION_ID;
  const sourceStaticCandidate = !isTs006
    && manifest.implementation?.candidateState?.status === "current-javascript-engineering-candidate-only";
  const sourceStaticDispositionClosed = sourceStaticCandidate
    && manifest.implementation?.capturePlanning?.structuralFrameDomainPlanningClosed === true;
  invariant(isTs006 || sourceStaticCandidate || manifest.scenarios?.some(({id}) => id === "default"),
    `${item.animationId}: default scenario is absent`);
  const upgradedManifest = structuredClone(manifest);
  const rootDomain = upgradedManifest.implementation?.frameDomains?.find(({id}) => id === "root");
  invariant(rootDomain && [0, item.nativeRuntimeFacts.rootFrameCount].includes(rootDomain.frameCount),
    `${item.animationId}: root frame-domain state is neither the legacy placeholder nor the v2 value`);
  rootDomain.frameCount = item.nativeRuntimeFacts.rootFrameCount;
  rootDomain.scenarioIds = (isTs006 || sourceStaticCandidate) ? ["root-unavailable"] : ["default"];
  let conservativeNestedDomain = null;
  let staticCompositeTimelineIds = [];
  let unresolvedTimelineCandidateIds = [];
  if (isTs006) {
    const existingNested = upgradedManifest.implementation.frameDomains.filter(({id}) => id !== "root");
    const normalizedExistingNested = existingNested.length === 1
      ? {...existingNested[0], scenarioIds: [...TS006_NESTED_DOMAIN.scenarioIds]}
      : null;
    invariant(existingNested.length === 0
      || (existingNested.length === 1 && pretty(normalizedExistingNested) === pretty(TS006_NESTED_DOMAIN)),
    `${item.animationId}: refusing unexpected nested frame-domain state`);
    upgradedManifest.implementation.frameDomains = [rootDomain, structuredClone(TS006_NESTED_DOMAIN)];
    upgradedManifest.scenarios = TS006_SCENARIOS.map((scenario) => structuredClone(scenario));
    conservativeNestedDomain = structuredClone(TS006_NESTED_DOMAIN);
    staticCompositeTimelineIds = ["sprite-3"];
  } else if (sourceStaticCandidate) {
    const candidateState = upgradedManifest.implementation.candidateState;
    const existingNested = upgradedManifest.implementation.frameDomains.filter(({id}) => id !== "root");
    invariant(existingNested.length === 1
      && existingNested[0].id === candidateState.sourceStaticFrameDomain
      && existingNested[0].frameCount === candidateState.sourceStaticFrames?.lastFrame
      && candidateState.sourceStaticFrames?.firstFrame === 1,
    `${item.animationId}: source-static candidate frame-domain binding drifted`);
    conservativeNestedDomain = structuredClone(existingNested[0]);
    conservativeNestedDomain.scenarioIds = ["source-static-frame"];
    upgradedManifest.implementation.frameDomains = [rootDomain, conservativeNestedDomain];
    staticCompositeTimelineIds = sourceStaticDispositionClosed
      ? [...(manifest.implementation.capturePlanning.staticCompositeTimelineIds ?? [])]
      : [...(candidateState.sourceStaticCompositeCandidateTimelineIds ?? [])];
    unresolvedTimelineCandidateIds = sourceStaticDispositionClosed ? [] : [...staticCompositeTimelineIds];
    invariant(new Set(staticCompositeTimelineIds).size === staticCompositeTimelineIds.length
      && staticCompositeTimelineIds.every((id) => /^sprite-[1-9][0-9]*$/.test(id))
      && !staticCompositeTimelineIds.includes(conservativeNestedDomain.id),
    `${item.animationId}: source-static composite candidate timeline list drifted`);
    upgradedManifest.scenarios = TS006_SCENARIOS.map((scenario) => ({
      ...structuredClone(scenario),
      description: scenario.id === "root-unavailable"
        ? "Current-JavaScript diagnostic identity for the source root obligation. The root remains disabled until an authorized natural original-runtime trace establishes its behavior."
        : `Current-JavaScript diagnostic identity for the source-static ${conservativeNestedDomain.id} drawing candidate. Natural runtime reachability, Spanish visuals, audio, Replay, behavior, and fidelity remain unresolved.`,
    }));
  }
  upgradedManifest.implementation.capturePlanning = {
    state: "pending-authoritative-natural-trace",
    releaseId: "lesson-g04-l03-negative-numbers",
    releaseSequence: item.sequence,
    rootRequirementRangeIsValid: true,
    rootNaturalTraceExecuted: false,
    authoritativeScenarioInventoryEstablished: false,
    nestedFrameDomainDispositionEstablished: isTs006 || sourceStaticDispositionClosed,
    ...((isTs006 || sourceStaticCandidate) ? {
      conservativeNestedDomainRequirementsEstablished: true,
      conservativeNestedFrameDomainIds: [conservativeNestedDomain.id],
      staticCompositeTimelineIds,
      ...(sourceStaticCandidate ? {sourceStaticCompositeCandidateTimelineIds: staticCompositeTimelineIds} : {}),
      unresolvedTimelineCandidateIds,
      ...(sourceStaticDispositionClosed ? {
        authoritativeRuntimeFrameDomainDispositionEstablished: false,
        structuralFrameDomainPlanningClosed: true,
        runtimeReachabilityEstablished: false,
      } : {}),
    } : {}),
    strictAcceptanceEffect: "none",
  };
  const requirements = [
    ...["en", "es"].map((language) => buildPendingRootRequirement({
      item,
      language,
      scenario: (isTs006 || sourceStaticCandidate) ? "root-unavailable" : "default",
    })),
    ...((isTs006 || sourceStaticCandidate)
      ? ["en", "es"].map((language) => buildPendingNestedRequirement({
        item,
        language,
        domain: conservativeNestedDomain,
      }))
      : []),
  ];
  const coverage = {
    schemaVersion: 2,
    animationId: item.animationId,
    planningState: (isTs006 || sourceStaticCandidate)
      ? "valid-root-and-conservative-nested-requirements-pending-authoritative-runtime"
      : "valid-root-requirements-pending-authoritative-runtime",
    requirements,
    limitations: isTs006 ? [
      "These two requirements replace invalid 1..0 placeholders with the source-bound root 1..frameCount range.",
      "They are pending natural-trace requirements, not proof that the trace, scenario inventory, nested-domain disposition, baseline, audio, review, or acceptance exists.",
      "The sprite-23 EN/ES requirements conservatively preserve the 128-frame main-teaching timeline obligation identified by hash-bound static SWF and work-only authoring evidence; runtime reachability and entry state remain unresolved until an authorized natural trace executes.",
      "The one-frame, scriptless sprite-3 page-title companion is source-proven as composite-child-with-parent for independent-playhead disposition only; its visual, behavior, interaction, full-frame, audio, human, and owner obligations remain pending.",
      "The root-unavailable and source-static-frame scenario IDs bind the current JavaScript diagnostic interface only. They do not establish original-runtime scenario names or reachability and must be superseded if authoritative execution proves a different scenario contract.",
      "No requirement in this planning document is original-runtime evidence or changes strict acceptance.",
    ] : sourceStaticCandidate ? [
      "These two requirements replace invalid 1..0 placeholders with the source-bound root 1..frameCount range.",
      "They are pending natural-trace requirements, not proof that the trace, scenario inventory, nested-domain disposition, baseline, audio, review, or acceptance exists.",
      `The ${conservativeNestedDomain.id} EN/ES requirements conservatively preserve the ${conservativeNestedDomain.frameCount}-frame source-static drawing obligation identified by hash-bound SWF structure and current-JavaScript candidate evidence; runtime reachability and entry state remain unresolved until an authorized natural trace executes.`,
      `The ${(upgradedManifest.implementation.candidateState.sourceStaticCompositeCandidateTimelineIds ?? []).length} additional structurally reachable timeline(s) remain source-static composite candidates, not final runtime dispositions; each stays unresolved until authoritative execution or stronger source proof establishes independent-domain, composite-only, or unreachable status.`,
      "The root-unavailable and source-static-frame scenario IDs bind the current JavaScript diagnostic interface only. They do not establish original-runtime scenario names or reachability and must be superseded if authoritative execution proves a different scenario contract.",
      "No requirement in this planning document is original-runtime evidence or changes strict acceptance.",
    ] : [
      "These two requirements replace invalid 1..0 placeholders with the source-bound root 1..frameCount range.",
      "They are pending natural-trace requirements, not proof that the trace, scenario inventory, nested-domain disposition, baseline, audio, review, or acceptance exists.",
      "Additional scenario and nested-domain requirements must be added only from authorized original-runtime evidence; strict promotion remains closed.",
    ],
  };
  return {
    manifest: upgradedManifest,
    coverage: applyAcceptanceNeutralImplementationCaptureOverlay({
      expectedCoverage: coverage,
      currentCoverage,
      manifest: upgradedManifest,
    }),
  };
}

function validateExpected({item, manifest, coverage}) {
  const expected = buildExpectedPendingCoverageDocuments({item, manifest, coverage});
  invariant(sameJson(manifest, expected.manifest), `${item.animationId}: upgraded migration.json drifted`);
  invariant(sameJson(coverage, expected.coverage), `${item.animationId}: upgraded full-frame coverage drifted`);
  invariant(coverage.requirements.every((requirement) =>
    requirement.requiredRange.firstFrame === 1
    && requirement.requiredRange.lastFrame === manifest.implementation.frameDomains
      .find(({id}) => id === requirement.frameDomainId)?.frameCount
    && SHA256.test(requirement.entryStateSha256)
    && requirement.traceId
    && requirement.status === "pending"
    && requirement.baselineAuthority === "unresolved"),
  `${item.animationId}: a pending requirement has incomplete identity or an invalid range`);
  const nestedDomainCount = manifest.implementation?.capturePlanning
    ?.conservativeNestedDomainRequirementsEstablished === true
    ? manifest.implementation.frameDomains.filter(({kind}) => kind === "nested").length
    : 0;
  invariant(coverage.requirements.length === 2 + nestedDomainCount * 2,
    `${item.animationId}: pending requirement count drifted`);
}

async function atomicWrite(file, bytes) {
  const temporary = `${file}.pending-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, file);
}

async function loadInputs() {
  const [contractBytes, releaseBytes] = await Promise.all([
    readFile(path.join(ROOT, CONTRACT_PATH)),
    readFile(path.join(ROOT, RELEASE_PATH)),
  ]);
  const contract = JSON.parse(contractBytes);
  const release = exactRelease(JSON.parse(releaseBytes));
  invariant(contract.summary?.canonicalItems === 40 && contract.items?.length === 40,
    "Runtime acquisition contract scope drifted");
  const targetItems = contract.items.filter(({animationId}) => !EXCLUDED_ALREADY_VALID.has(animationId));
  invariant(targetItems.length === 38, "Expected exactly 38 legacy-placeholder targets");
  invariant(targetItems.every((item, index) => item.animationId === release.members[index + (index >= 33 ? 0 : 0)]?.animationId
    || release.members.some(({animationId}) => animationId === item.animationId)), "Target is outside the atomic release");
  return {
    contract,
    targetItems,
    sourceBindings: {
      runtimeAcquisitionContract: {path: CONTRACT_PATH, bytes: contractBytes.length, sha256: sha256(contractBytes)},
      lessonRelease: {path: RELEASE_PATH, bytes: releaseBytes.length, sha256: sha256(releaseBytes)},
    },
  };
}

async function currentDocuments(item) {
  const migrationPath = `migrations/${item.animationId}/migration.json`;
  const coveragePath = `migrations/${item.animationId}/evidence/full-frame-coverage.json`;
  const [migrationBytes, coverageBytes] = await Promise.all([
    readFile(path.join(ROOT, migrationPath)),
    readFile(path.join(ROOT, coveragePath)),
  ]);
  return {
    migrationPath,
    coveragePath,
    migrationBytes,
    coverageBytes,
    manifest: JSON.parse(migrationBytes),
    coverage: JSON.parse(coverageBytes),
  };
}

async function inspectCurrentAndReport(inputs, {
  requireCurrentGenerator = true,
  requireCurrentItemHashes = true,
  requireCurrentSourceBindings = true,
} = {}) {
  const reportBytes = await readFile(path.join(ROOT, REPORT_JSON));
  const report = JSON.parse(reportBytes);
  invariant(report.reportType === "g4-l3-valid-pending-root-coverage-upgrade" && report.schemaVersion === 1,
    "Coverage-upgrade report identity drifted");
  const currentGenerator = await binding(relative(SCRIPT_PATH));
  if (requireCurrentGenerator) {
    invariant(report.generator?.sha256 === currentGenerator.sha256
      && report.generator?.bytes === currentGenerator.bytes,
    "Coverage-upgrade generator binding is stale");
  }
  if (requireCurrentSourceBindings) {
    invariant(report.sourceBindings.runtimeAcquisitionContract.sha256
        === inputs.sourceBindings.runtimeAcquisitionContract.sha256
      && report.sourceBindings.lessonRelease.sha256 === inputs.sourceBindings.lessonRelease.sha256,
    "Coverage-upgrade source chain is stale");
  }
  invariant(report.items.length === 38, "Coverage-upgrade report does not bind 38 targets");
  const currentItems = [];
  for (const item of inputs.targetItems) {
    const current = await currentDocuments(item);
    validateExpected({item, manifest: current.manifest, coverage: current.coverage});
    const recorded = report.items.find(({animationId}) => animationId === item.animationId);
    invariant(recorded?.sequence === item.sequence
      && recorded?.rootFrameCount === item.nativeRuntimeFacts.rootFrameCount
      && recorded?.after?.migrationJson?.path === current.migrationPath
      && recorded?.after?.fullFrameCoverage?.path === current.coveragePath,
    `${item.animationId}: coverage-upgrade receipt identity drifted`);
    const after = {
      migrationJson: {
        path: current.migrationPath,
        bytes: current.migrationBytes.length,
        sha256: sha256(current.migrationBytes),
      },
      fullFrameCoverage: {
        path: current.coveragePath,
        bytes: current.coverageBytes.length,
        sha256: sha256(current.coverageBytes),
      },
    };
    if (requireCurrentItemHashes) {
      invariant(recorded.after.migrationJson.sha256 === after.migrationJson.sha256
        && recorded.after.migrationJson.bytes === after.migrationJson.bytes
        && recorded.after.fullFrameCoverage.sha256 === after.fullFrameCoverage.sha256
        && recorded.after.fullFrameCoverage.bytes === after.fullFrameCoverage.bytes,
      `${item.animationId}: upgraded file hash differs from the receipt`);
    }
    const pendingRequirements = current.coverage.requirements.length;
    const pendingNestedRequirements = current.coverage.requirements
      .filter(({frameDomainId}) => frameDomainId !== "root").length;
    if (requireCurrentItemHashes) {
      invariant(recorded.pendingRequirements === pendingRequirements
        && (recorded.pendingNestedRequirements ?? 0) === pendingNestedRequirements,
      `${item.animationId}: coverage-upgrade receipt requirement counts differ from current documents`);
    }
    currentItems.push({...recorded, after, pendingRequirements, pendingNestedRequirements});
  }
  invariant(report.summary.invalidOneToZeroRangesAfter === 0
    && report.summary.rootRequirementsAfter === 76
    && report.acceptance.strictCompletions === 0,
  "Coverage-upgrade report was promoted or regressed");
  if (requireCurrentGenerator || requireCurrentItemHashes || requireCurrentSourceBindings) {
    const nestedRequirementsAfter = currentItems.reduce((sum, item) => sum + item.pendingNestedRequirements, 0);
    const totalPendingRequirementsAfter = currentItems.reduce((sum, item) => sum + item.pendingRequirements, 0);
    invariant(report.summary.nestedRequirementsAfter === nestedRequirementsAfter
      && report.summary.totalPendingRequirementsAfter === totalPendingRequirementsAfter
      && report.acceptance.ts006StaticFrameDomainDispositionEstablished === true,
    "Coverage-upgrade report nested requirement summary is stale");
  }
  return {currentGenerator, currentItems, report, reportBytes};
}

async function verifyCurrentAndReport(inputs) {
  return (await inspectCurrentAndReport(inputs)).report;
}

async function refreshCurrentAndReport(inputs) {
  const inspected = await inspectCurrentAndReport(inputs, {
    requireCurrentGenerator: false,
    requireCurrentItemHashes: false,
    requireCurrentSourceBindings: false,
  });
  const alreadyCurrent = inspected.report.generator?.sha256 === inspected.currentGenerator.sha256
    && inspected.report.generator?.bytes === inspected.currentGenerator.bytes
    && inspected.report.sourceBindings.runtimeAcquisitionContract.sha256
      === inputs.sourceBindings.runtimeAcquisitionContract.sha256
    && inspected.report.sourceBindings.lessonRelease.sha256 === inputs.sourceBindings.lessonRelease.sha256
    && inspected.report.items.every((recorded, index) =>
      recorded.after.migrationJson.sha256 === inspected.currentItems[index].after.migrationJson.sha256
      && recorded.after.migrationJson.bytes === inspected.currentItems[index].after.migrationJson.bytes
      && recorded.after.fullFrameCoverage.sha256 === inspected.currentItems[index].after.fullFrameCoverage.sha256
      && recorded.after.fullFrameCoverage.bytes === inspected.currentItems[index].after.fullFrameCoverage.bytes);
  if (alreadyCurrent) return inspected.report;
  const priorSourceBindings = inspected.report.sourceBindings;
  const refreshed = {
    ...inspected.report,
    generator: inspected.currentGenerator,
    sourceBindings: inputs.sourceBindings,
    items: inspected.currentItems,
    summary: {
      ...inspected.report.summary,
      nestedRequirementsAfter: inspected.currentItems.reduce((sum, item) => sum + item.pendingNestedRequirements, 0),
      totalPendingRequirementsAfter: inspected.currentItems.reduce((sum, item) => sum + item.pendingRequirements, 0),
    },
    acceptance: {
      ...inspected.report.acceptance,
      ts006StaticFrameDomainDispositionEstablished: true,
    },
    refreshHistory: [
      ...(inspected.report.refreshHistory ?? []),
      {
        priorReportSha256: sha256(inspected.reportBytes),
        priorRuntimeAcquisitionContractSha256: priorSourceBindings.runtimeAcquisitionContract.sha256,
        currentRuntimeAcquisitionContractSha256: inputs.sourceBindings.runtimeAcquisitionContract.sha256,
        migrationOrCoverageDocumentsRewritten: false,
        disposition: "receipt-only-rebind-after-current-documents-pass-exact-coverage-validation",
      },
    ],
  };
  await atomicWrite(path.join(ROOT, REPORT_JSON), Buffer.from(pretty(refreshed)));
  await atomicWrite(path.join(ROOT, REPORT_MARKDOWN), Buffer.from(markdown(refreshed)));
  return (await inspectCurrentAndReport(inputs)).report;
}

function markdown(report) {
  return `# G4 L3 Valid Pending Root Coverage Upgrade\n\n`
    + `The 38 untouched template workspaces now contain valid, one-indexed root requirements instead of invalid \`1..0\` ranges. This is a planning repair only.\n\n`
    + `- Upgraded workspaces: **${report.summary.upgradedWorkspaces}/38**.\n`
    + `- Valid pending root requirements: **${report.summary.rootRequirementsAfter}** (EN/ES).\n`
    + `- Conservative pending nested requirements: **${report.summary.nestedRequirementsAfter}** (source-static main domains, EN/ES).\n`
    + `- Total pending requirements in these 38 workspaces: **${report.summary.totalPendingRequirementsAfter}**.\n`
    + `- Invalid \`1..0\` ranges after upgrade: **${report.summary.invalidOneToZeroRangesAfter}**.\n`
    + `- Authoritative runtime sessions / strict completions: **0 / 0**.\n`
    + `- Preimages: preserved under ignored \`${report.backup.root}\`; set SHA-256 \`${report.backup.preimageSetSha256}\`.\n\n`
    + `Each requirement binds \`frameDomain\`, \`requirementId\`, \`trace\`, \`entryStateSha256\`, frame range, scenario, language, and seed. The trace is explicitly unexecuted and the baseline authority remains unresolved. Nested domains and additional scenarios remain runtime-gated.\n`;
}

export async function materialize({check = false, refresh = false} = {}) {
  const inputs = await loadInputs();
  if (check) return verifyCurrentAndReport(inputs);
  const reportExists = await lstat(path.join(ROOT, REPORT_JSON)).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
  if (reportExists) return refresh ? refreshCurrentAndReport(inputs) : verifyCurrentAndReport(inputs);
  invariant(!refresh, "Cannot refresh a missing coverage-upgrade report");

  const plans = [];
  for (const item of inputs.targetItems) {
    const current = await currentDocuments(item);
    invariant(isLegacyPlaceholder(current.coverage), `${item.animationId}: refusing to overwrite non-template coverage`);
    const expected = buildExpectedPendingCoverageDocuments({item, manifest: current.manifest});
    plans.push({item, current, expected});
  }
  const preimageProjection = plans.map(({item, current}) => ({
    animationId: item.animationId,
    migrationJsonSha256: sha256(current.migrationBytes),
    fullFrameCoverageSha256: sha256(current.coverageBytes),
  }));
  const preimageSetSha256 = sha256(Buffer.from(canonicalJson(preimageProjection)));
  const backupRoot = `work/g4-l3-v2-coverage-preimages/${preimageSetSha256}`;
  await mkdir(path.join(ROOT, backupRoot), {recursive: true});
  for (const {item, current} of plans) {
    const itemRoot = path.join(ROOT, backupRoot, item.animationId);
    await mkdir(itemRoot, {recursive: true});
    for (const [name, source] of [["migration.json", current.migrationPath], ["full-frame-coverage.json", current.coveragePath]]) {
      const destination = path.join(itemRoot, name);
      await copyFile(path.join(ROOT, source), destination, fsConstants.COPYFILE_EXCL);
      await chmod(destination, 0o444);
    }
  }

  const rows = [];
  for (const {item, current, expected} of plans) {
    const migrationBytes = Buffer.from(pretty(expected.manifest));
    const coverageBytes = Buffer.from(pretty(expected.coverage));
    await atomicWrite(path.join(ROOT, current.migrationPath), migrationBytes);
    await atomicWrite(path.join(ROOT, current.coveragePath), coverageBytes);
    rows.push({
      sequence: item.sequence,
      animationId: item.animationId,
      rootFrameCount: item.nativeRuntimeFacts.rootFrameCount,
      before: {
        migrationJson: {path: current.migrationPath, bytes: current.migrationBytes.length, sha256: sha256(current.migrationBytes)},
        fullFrameCoverage: {path: current.coveragePath, bytes: current.coverageBytes.length, sha256: sha256(current.coverageBytes)},
      },
      after: {
        migrationJson: {path: current.migrationPath, bytes: migrationBytes.length, sha256: sha256(migrationBytes)},
        fullFrameCoverage: {path: current.coveragePath, bytes: coverageBytes.length, sha256: sha256(coverageBytes)},
      },
      pendingRequirements: expected.coverage.requirements.length,
      pendingNestedRequirements: expected.coverage.requirements
        .filter(({frameDomainId}) => frameDomainId !== "root").length,
      authoritativeRuntimeSessions: 0,
      strictComplete: false,
    });
  }
  const report = {
    schemaVersion: 1,
    reportType: "g4-l3-valid-pending-root-coverage-upgrade",
    generator: await binding(relative(SCRIPT_PATH)),
    sourceBindings: inputs.sourceBindings,
    scope: {
      releaseId: "lesson-g04-l03-negative-numbers",
      upgradedMembers: 38,
      preservedExistingValidMembers: [...EXCLUDED_ALREADY_VALID].sort(),
    },
    backup: {root: backupRoot, preimageSetSha256, ignoredPrivateOrWorkArtifact: true},
    items: rows,
    summary: {
      upgradedWorkspaces: rows.length,
      rootRequirementsAfter: rows.length * 2,
      nestedRequirementsAfter: rows.reduce((sum, item) => sum + item.pendingNestedRequirements, 0),
      totalPendingRequirementsAfter: rows.reduce((sum, item) => sum + item.pendingRequirements, 0),
      invalidOneToZeroRangesBefore: rows.length * 2,
      invalidOneToZeroRangesAfter: 0,
      authoritativeRuntimeSessions: 0,
      strictCompletions: 0,
    },
    acceptance: {
      acceptanceNeutral: true,
      sourceBoundRootRangesEstablished: true,
      authoritativeScenarioInventoryEstablished: false,
      nestedFrameDomainDispositionEstablished: false,
      ts006StaticFrameDomainDispositionEstablished: true,
      naturalTraceExecuted: false,
      baselineAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictCompletions: 0,
    },
  };
  await atomicWrite(path.join(ROOT, REPORT_JSON), Buffer.from(pretty(report)));
  await atomicWrite(path.join(ROOT, REPORT_MARKDOWN), Buffer.from(markdown(report)));
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
    process.stdout.write(`PASS: ${report.summary.upgradedWorkspaces}/38 valid pending root coverage; `
      + `${report.summary.invalidOneToZeroRangesAfter} invalid 1..0 ranges; strict completion 0.\n`);
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
