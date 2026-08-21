#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

import {chromium} from "playwright";

import {
  buildSafeRuntime,
} from "./build-safe-ffdec-canvas-adapter.mjs";
import {
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {
  validateSourceProvenIndependentEvidenceDocument,
} from "./source-proven-independent-frame-domain-evidence.mjs";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(scriptPath), "..");
const GENERATOR_PATH =
  "scripts/build-release-source-static-engineering-candidates.mjs";
const SAFE_ADAPTER_PATH =
  "scripts/build-safe-ffdec-canvas-adapter.mjs";
const RELEASE_CATALOG_PATH = "catalog/lesson-releases.json";
const DECLARATION_REPORT_PATH =
  "reports/g4-l10-independent-frame-domain-declarations.json";
const DECLARATION_REPORT_SHA256 =
  "d961ff2401d01740a6dc04b6084d3849f2cac1f729b43b3fe40565a7a7a15e20";
const DECLARATION_GENERATOR_PATH =
  "scripts/materialize-g4-l10-independent-frame-domain-declarations.mjs";
const INDEPENDENT_EVIDENCE_PATH =
  "audit/source-proven-independent-frame-domain-evidence.json";
const DECLARED_DOMAIN_SCENARIO =
  "source-proven-independent-domain-entry-unresolved";
const DECLARATION_PAIR_SET_SHA256 =
  "32bd3115ff796d2905eb8f83b9860717f9022b43d2295a1bba8ce1d2adbc4c1f";
const EXPECTED_FFDEC_VERSION = "JPEXS Free Flash Decompiler v.26.2.1";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const PROTECTED_REGISTRY_PATHS = Object.freeze([
  "packages/demos/prototype-registry.json",
  "packages/demos/src/registry.generated.ts",
  "packages/demos/src/prototype-manifest.ts",
  "apps/web/lib/whole-lesson-course-registry.ts",
]);
const ACCEPTANCE_EFFECTS = Object.freeze({
  implementationAuthorized: false,
  authoritativeOriginalRuntime: false,
  naturalRuntimeReachabilityComplete: false,
  frameDomainDispositionComplete: false,
  bilingualVisualParityComplete: false,
  audioAccepted: false,
  replayParityComplete: false,
  fullFrameRmseComplete: false,
  behaviorComplete: false,
  productQaComplete: false,
  accessibilityQaComplete: false,
  engineeringReviewAccepted: false,
  humanVisualReviewAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function projectPath(relativePath, root = ROOT) {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0,
    "project-relative path is required",
  );
  invariant(!path.isAbsolute(relativePath),
    `absolute project path is forbidden: ${relativePath}`);
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  invariant(
    relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `project path escapes the root: ${relativePath}`,
  );
  return resolved;
}

async function readBinding(relativePath, root = ROOT) {
  const absolutePath = projectPath(relativePath, root);
  const metadata = await lstat(absolutePath);
  invariant(metadata.isFile() && !metadata.isSymbolicLink(),
    `${relativePath}: expected an ordinary file`);
  const bytes = await readFile(absolutePath);
  return Object.freeze({
    path: portable(relativePath),
    bytes: bytes.length,
    sha256: sha256(bytes),
    contents: bytes,
  });
}

function withoutContents(binding) {
  return {path: binding.path, bytes: binding.bytes, sha256: binding.sha256};
}

function parseJson(binding) {
  return JSON.parse(binding.contents.toString("utf8"));
}

function parseTagAttributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([A-Za-z][A-Za-z0-9]*)="([^"]*)"/g)]
      .map((match) => [match[1], match[2]]),
  );
}

export function parseDirectRootPlacementFromSwfmill(
  compressedBytes,
  {objectId, expectedDepth, expectedName, expectedFrame},
) {
  const xml = gunzipSync(compressedBytes).toString("utf8");
  const objectPattern = new RegExp(
    `<PlaceObject2\\b[^>]*\\bobjectID="${objectId}"[^>]*>` +
      `\\s*<transform>\\s*<Transform\\b[^>]*/>\\s*</transform>`,
    "g",
  );
  const matches = [...xml.matchAll(objectPattern)];
  invariant(matches.length === 1,
    `sprite-${objectId}: expected one exact root placement, observed ${matches.length}`);
  const placeTag = matches[0][0].match(/<PlaceObject2\b[^>]*>/)?.[0];
  const transformTag = matches[0][0].match(/<Transform\b[^>]*\/>/)?.[0];
  invariant(placeTag && transformTag,
    `sprite-${objectId}: placement transform is incomplete`);
  const placement = parseTagAttributes(placeTag);
  const transform = parseTagAttributes(transformTag);
  invariant(
    placement.objectID === String(objectId) &&
      placement.depth === String(expectedDepth) &&
      placement.name === expectedName &&
      placement.replace === "0",
    `sprite-${objectId}: exact named placement attributes drifted`,
  );
  const transX = Number(transform.transX);
  const transY = Number(transform.transY);
  invariant(Number.isSafeInteger(transX) && Number.isSafeInteger(transY),
    `sprite-${objectId}: placement translation is invalid`);
  return Object.freeze({
    parentTimelineId: "root",
    childTimelineId: `sprite-${objectId}`,
    sourceObjectId: String(objectId),
    frame: expectedFrame,
    depth: String(expectedDepth),
    instanceName: expectedName,
    tag: "PlaceObject2",
    replace: "0",
    hasClipActions: false,
    placementTwips: Object.freeze({x: transX, y: transY}),
    placementPixels: Object.freeze({x: transX / 20, y: transY / 20}),
  });
}

function hasControlReason(timeline, frame, reason) {
  return timeline?.controlStates?.some((state) =>
    state.frame === frame && state.reasons?.includes(reason));
}

function identifyPageTitle(scenario, sourcePath) {
  const suffix = sourcePath.split("/HELP_COURSES/").at(-1);
  for (const section of scenario.courseXml?.sections ?? []) {
    const page = section.pages?.find(({path: candidate}) =>
      suffix?.endsWith(candidate));
    if (page?.attributes?.Title) return page.attributes.Title;
  }
  return scenario.animationId;
}

export function resolveDirectNamedAnimationTimeline(
  disposition,
  {animationId = "unknown-animation"} = {},
) {
  const candidates = (disposition?.timelines ?? []).filter((timeline) => {
    const namedPath = timeline.rootPlacement?.namedPlacementPath;
    return (
      timeline.timelineId !== "root" &&
      /^sprite-\d+$/.test(timeline.timelineId ?? "") &&
      Number.isSafeInteger(timeline.frameCount) &&
      timeline.frameCount > 1 &&
      timeline.structuralReachability ===
        "reachable-from-root-placement-graph" &&
      timeline.rootPlacement?.status === "proven-named-placement-chain" &&
      namedPath?.length === 1 &&
      namedPath[0].parentTimelineId === "root" &&
      namedPath[0].childTimelineId === timeline.timelineId &&
      namedPath[0].sourceObjectId === timeline.sourceObjectId &&
      typeof namedPath[0].instanceName === "string" &&
      namedPath[0].instanceName.toLowerCase() === "animation" &&
      namedPath[0].tag === "PlaceObject2" &&
      namedPath[0].replace === "0" &&
      namedPath[0].hasClipActions === false
    );
  });
  invariant(
    candidates.length === 1,
    `${animationId}: expected one exact direct named animation timeline, observed ${candidates.length}`,
  );
  return candidates[0];
}

function validateDeclarationReportBoundary(
  report,
  declarationReport,
  declarationGenerator,
) {
  invariant(
    declarationReport.path === DECLARATION_REPORT_PATH &&
      declarationReport.sha256 === DECLARATION_REPORT_SHA256 &&
      report?.schemaVersion === 1 &&
      report.reportType ===
        "g4-l10-source-proven-independent-frame-domain-declarations" &&
      report.releaseId === "lesson-g04-l10-perimeter-area" &&
      report.generatedBy?.path === DECLARATION_GENERATOR_PATH &&
      report.generatedBy.sha256 === declarationGenerator.sha256 &&
      report.generatedBy.deterministic === true &&
      report.generatedBy.transactional === true &&
      report.exactPairSet?.count === 213 &&
      report.exactPairSet.sha256 === DECLARATION_PAIR_SET_SHA256 &&
      report.exactPairSet.encoding ===
        "sorted-animationId-tab-timelineId-newline-v1" &&
      report.summary?.childFrameDomainsDeclared === 213 &&
      report.summary?.actionFrameSequenceMismatchCount === 0 &&
      report.summary?.authoritativeRuntimeSessionsExecuted === 0 &&
      report.summary?.implementationFramesCaptured === 0 &&
      report.summary?.originalRuntimeFramesCaptured === 0 &&
      report.summary?.rmseComparisonsCompleted === 0 &&
      report.summary?.strictCompletions === 0 &&
      report.summary?.publishedMembers === 0 &&
      Object.values(report.acceptanceBoundary ?? {}).length > 0 &&
      Object.values(report.acceptanceBoundary).every((value) => value === false) &&
      String(report.strictAcceptanceEffect ?? "").startsWith("none;"),
    "G4 L10 independent frame-domain declaration report crossed its evidence boundary",
  );
}

function exactReportMember(report, animationId) {
  const members = (report.members ?? []).filter((member) =>
    member.animationId === animationId);
  invariant(members.length <= 1,
    `${animationId}: duplicate declaration-report members`);
  return members[0] ?? null;
}

function assertSuccessorBinding(actual, binding, label) {
  invariant(
    actual?.path === binding.path &&
      actual.bytes === binding.bytes &&
      actual.sha256 === binding.sha256,
    `${label}: declaration successor binding drifted`,
  );
}

export function validateDeclaredTargetLineage({
  animationId,
  bindings,
  declarationReport,
  independentEvidence,
  migration,
  target,
}) {
  const member = exactReportMember(declarationReport, animationId);
  invariant(member,
    `${animationId}/${target.timelineId}: declaration-report member is missing`);
  assertSuccessorBinding(
    member.successor?.migrationJson,
    bindings.migration,
    `${animationId}: migration`,
  );
  invariant(
    member.successor.migrationJson.technicalProjectionSha256 ===
      technicalManifestSha256(migration),
    `${animationId}: successor migration technical projection drifted`,
  );
  assertSuccessorBinding(
    member.successor?.scenarioInventory,
    bindings.scenario,
    `${animationId}: scenario inventory`,
  );
  assertSuccessorBinding(
    member.successor?.frameDomainDisposition,
    bindings.disposition,
    `${animationId}: frame-domain disposition`,
  );
  const reportDomains = (member.declaration?.domains ?? []).filter((domain) =>
    domain.sourceTimelineId === target.timelineId);
  const manifestDomains = (migration.implementation?.frameDomains ?? []).filter(
    (domain) => domain.sourceTimelineId === target.timelineId,
  );
  invariant(
    reportDomains.length === 1 && manifestDomains.length === 1 &&
      JSON.stringify(reportDomains[0]) === JSON.stringify(manifestDomains[0]),
    `${animationId}/${target.timelineId}: exact declared manifest/report domain binding drifted`,
  );
  const domain = manifestDomains[0];
  const declared = target.declaredFrameDomains;
  invariant(
    target.disposition === "declared-frame-domain" &&
      Array.isArray(declared) && declared.length === 1 &&
      declared[0].frameDomainId === domain.id &&
      declared[0].kind === domain.kind &&
      declared[0].sourceTimelineId === domain.sourceTimelineId &&
      declared[0].parentFrameDomainId === domain.parentFrameDomainId &&
      declared[0].frameCount === domain.frameCount &&
      declared[0].role === domain.role &&
      domain.id === target.timelineId &&
      domain.kind === "nested" &&
      domain.parentFrameDomainId === "root" &&
      domain.frameCount === target.frameCount &&
      domain.scenarioIds?.length === 1 &&
      domain.scenarioIds[0] === DECLARED_DOMAIN_SCENARIO &&
      domain.sourceParentTimelineIds?.length === 1 &&
      domain.sourceParentTimelineIds[0] === "root",
    `${animationId}/${target.timelineId}: declared frame-domain identity is incomplete`,
  );
  const sourceProof = domain.sourceProof;
  const preTransition = member.preTransitionProof;
  invariant(
    sourceProof?.path === INDEPENDENT_EVIDENCE_PATH &&
      sourceProof.sha256 === bindings.independentEvidence.sha256 &&
      sourceProof.sha256 === preTransition?.independentEvidence?.sha256 &&
      preTransition.independentEvidence.path === bindings.independentEvidence.path &&
      preTransition.independentEvidence.bytes === bindings.independentEvidence.bytes &&
      sourceProof.proofType === "multi-frame-local-action-independent-domain" &&
      sourceProof.claimScope === "separate-local-frame-action-domain-required" &&
      sourceProof.sourceObjectId === target.sourceObjectId &&
      sourceProof.directDoActionTagCount > 0 &&
      sourceProof.ffdecFrameScriptCount ===
        sourceProof.directDoActionTagCount &&
      SHA256_PATTERN.test(sourceProof.actionFrameSequenceSha256 ?? "") &&
      sourceProof.actionFrameSequenceEncoding ===
        "one-indexed-decimal-frame-newline-v1" &&
      sourceProof.authoritativeRuntimeEntryEstablished === false &&
      sourceProof.strictAcceptanceEffect === "none",
    `${animationId}/${target.timelineId}: declared domain source-proof binding drifted`,
  );
  validateSourceProvenIndependentEvidenceDocument(independentEvidence, {
    animationId,
    sourceSwf: {
      path: migration.source.swf,
      sha256: migration.source.swfSha256,
    },
    scenarioInventory: {
      path: bindings.scenario.path,
      sha256: preTransition.scenarioInventorySha256,
    },
    migrationTechnicalProjection: {
      path: bindings.migration.path,
      sha256: preTransition.migrationTechnicalProjectionSha256,
      projection: "help-math-technical-manifest-v1",
    },
    swfmillStructure: {
      path: "audit/machine/swfmill.xml.gz",
      sha256: bindings.swfmill.sha256,
    },
    ffdecScripts: {
      path: "audit/machine/ffdec-scripts.txt.gz",
      sha256: bindings.ffdecScripts.sha256,
    },
  });
  const claim = independentEvidence.claims?.[sourceProof.claimIndex];
  invariant(
    claim?.timelineId === target.timelineId &&
      claim.sourceObjectId === target.sourceObjectId &&
      claim.frameCount === target.frameCount &&
      claim.disposition === "independent-required" &&
      claim.role === sourceProof.proofType &&
      claim.claimScope === sourceProof.claimScope &&
      JSON.stringify(claim.parentTimelineIds) ===
        JSON.stringify(domain.sourceParentTimelineIds) &&
      claim.sourceProof?.directDoActionTagCount ===
        sourceProof.directDoActionTagCount &&
      claim.sourceProof?.ffdecFrameScriptCount ===
        sourceProof.ffdecFrameScriptCount &&
      claim.sourceProof?.swfmillDoActionFrameSequenceSha256 ===
        sourceProof.actionFrameSequenceSha256 &&
      claim.sourceProof?.ffdecFrameScriptFrameSequenceSha256 ===
        sourceProof.actionFrameSequenceSha256 &&
      Object.values(claim.preservedObligations ?? {}).every(
        (status) => status === "pending",
      ),
    `${animationId}/${target.timelineId}: declaration claim lineage is incomplete`,
  );
  return Object.freeze({
    status: "declared-source-proven-independent-domain",
    declarationReportPath: bindings.declarationReport.path,
    declarationReportSha256: bindings.declarationReport.sha256,
    frameDomainId: domain.id,
    sourceProofPath: bindings.independentEvidence.path,
    sourceProofSha256: bindings.independentEvidence.sha256,
    sourceProofClaimIndex: sourceProof.claimIndex,
    actionFrameSequenceSha256: sourceProof.actionFrameSequenceSha256,
    blockerClass: null,
  });
}

function validateUnresolvedTargetLineage({
  animationId,
  bindings,
  declarationReport,
  independentEvidence,
  migration,
  target,
}) {
  const reportMember = exactReportMember(declarationReport, animationId);
  invariant(
    target.disposition === "unresolved" &&
      target.sourceProvenIndependentEvidence == null &&
      Array.isArray(target.declaredFrameDomains) &&
      target.declaredFrameDomains.length === 0 &&
      target.riskAssessment?.independentFrameDomainCandidate === true &&
      target.riskAssessment?.signals?.includes("direct-named-root-placement") &&
      !(migration.implementation?.frameDomains ?? []).some((domain) =>
        domain.sourceTimelineId === target.timelineId) &&
      !(reportMember?.declaration?.domains ?? []).some((domain) =>
        domain.sourceTimelineId === target.timelineId),
    `${animationId}/${target.timelineId}: unresolved direct-child blocker lineage is incomplete`,
  );
  validateSourceProvenIndependentEvidenceDocument(independentEvidence, {
    animationId,
    sourceSwf: {
      path: migration.source.swf,
      sha256: migration.source.swfSha256,
    },
    scenarioInventory: {
      path: bindings.scenario.path,
      sha256: bindings.scenario.sha256,
    },
    migrationTechnicalProjection: {
      path: bindings.migration.path,
      sha256: technicalManifestSha256(migration),
      projection: "help-math-technical-manifest-v1",
    },
    swfmillStructure: {
      path: "audit/machine/swfmill.xml.gz",
      sha256: bindings.swfmill.sha256,
    },
    ffdecScripts: {
      path: "audit/machine/ffdec-scripts.txt.gz",
      sha256: bindings.ffdecScripts.sha256,
    },
  });
  const rejected = (independentEvidence.rejected ?? []).filter((item) =>
    item.timelineId === target.timelineId);
  const blockerClass =
    "scriptless-direct-root-local-playhead-needs-runtime-continuation-proof";
  invariant(
    rejected.length === 1 &&
      rejected[0].sourceObjectId === target.sourceObjectId &&
      rejected[0].frameCount === target.frameCount &&
      rejected[0].disposition === "unresolved" &&
      rejected[0].blockerClass === blockerClass,
    `${animationId}/${target.timelineId}: unresolved proof rejection drifted`,
  );
  return Object.freeze({
    status: "unresolved-runtime-continuation-proof-required",
    declarationReportPath: bindings.declarationReport.path,
    declarationReportSha256: bindings.declarationReport.sha256,
    frameDomainId: null,
    sourceProofPath: bindings.independentEvidence.path,
    sourceProofSha256: bindings.independentEvidence.sha256,
    sourceProofRejectedIndex: independentEvidence.rejected.indexOf(rejected[0]),
    actionFrameSequenceSha256: null,
    blockerClass,
  });
}

export async function deriveReleaseSourceStaticProfile({
  allowAcceptanceNeutralLineageFallback = false,
  animationId,
  release,
  root = ROOT,
} = {}) {
  invariant(release?.releaseId, "exact lesson release is required");
  const member = release.members?.find((candidate) =>
    candidate.animationId === animationId);
  invariant(member,
    `${animationId}: not a member of exact release ${release.releaseId}`);
  invariant(member.releaseRole === "active-xml-referenced-page",
    `${animationId}: only active page members may become source-static candidates`);
  const workspace = `migrations/${animationId}`;
  const paths = Object.freeze({
    migration: `${workspace}/migration.json`,
    machineCandidates: `${workspace}/audit/machine/swf-frame-domain-candidates.json`,
    scenario: `${workspace}/audit/scenario-inventory.json`,
    disposition: `${workspace}/audit/frame-domain-disposition.json`,
    independentEvidence: `${workspace}/${INDEPENDENT_EVIDENCE_PATH}`,
    audio: `${workspace}/audit/audio-runtime-evidence.json`,
    baseline: `${workspace}/baseline/ffdec-root-frames.json`,
    swfmill: `${workspace}/audit/machine/swfmill.xml.gz`,
    ffdecScripts: `${workspace}/audit/machine/ffdec-scripts.txt.gz`,
    declarationReport: DECLARATION_REPORT_PATH,
    declarationGenerator: DECLARATION_GENERATOR_PATH,
  });
  const bindings = Object.fromEntries(await Promise.all(
    Object.entries(paths).map(async ([key, relativePath]) =>
      [key, await readBinding(relativePath, root)]),
  ));
  const migration = parseJson(bindings.migration);
  const machineCandidates = parseJson(bindings.machineCandidates);
  const scenario = parseJson(bindings.scenario);
  const disposition = parseJson(bindings.disposition);
  const independentEvidence = parseJson(bindings.independentEvidence);
  const declarationReport = parseJson(bindings.declarationReport);
  const audio = parseJson(bindings.audio);
  const baseline = parseJson(bindings.baseline);
  invariant(
    [migration, machineCandidates, scenario, disposition, audio, baseline]
      .every((artifact) => artifact.animationId === animationId),
    `${animationId}: workspace evidence identity mismatch`,
  );
  invariant(migration.status === "preserved",
    `${animationId}: candidate must not advance the preserved migration status`);
  invariant(migration.source?.swfSha256 === member.source?.sha256 &&
    migration.source.swfSha256 === scenario.source?.swfSha256 &&
    migration.source.swfSha256 === audio.source?.observedSha256 &&
    audio.source?.hashMatches === true,
  `${animationId}: exact source identity is not consistently hash-bound`);
  const sourceSwf = await readBinding(migration.source.swf, root);
  invariant(sourceSwf.sha256 === migration.source.swfSha256,
    `${animationId}: source SWF changed`);
  const sourceFla = migration.source.pairedFlaStatus === "present"
    ? await readBinding(migration.source.fla, root)
    : null;
  if (sourceFla) {
    invariant(sourceFla.sha256 === migration.source.flaSha256,
      `${animationId}: paired FLA changed`);
  }
  const target = resolveDirectNamedAnimationTimeline(disposition, {animationId});
  const machineTarget = machineCandidates.nestedDefinitions?.find(({timelineId}) =>
    timelineId === target.timelineId);
  const scenarioTarget = scenario.timelineInventory?.find(({timelineId}) =>
    timelineId === target.timelineId);
  invariant(target && machineTarget && scenarioTarget,
    `${animationId}: target timeline is missing from bound evidence`);
  let lineageFallback = null;
  let targetLineage;
  try {
    validateDeclarationReportBoundary(
      declarationReport,
      bindings.declarationReport,
      bindings.declarationGenerator,
    );
    const lineageInputs = {
      animationId,
      bindings,
      declarationReport,
      independentEvidence,
      migration,
      target,
    };
    targetLineage = target.disposition === "declared-frame-domain"
      ? validateDeclaredTargetLineage(lineageInputs)
      : validateUnresolvedTargetLineage(lineageInputs);
  } catch (error) {
    invariant(
      allowAcceptanceNeutralLineageFallback,
      error instanceof Error ? error.message : String(error),
    );
    lineageFallback = Object.freeze({
      reason: error instanceof Error ? error.message : String(error),
      disposition:
        "manual-source-static-addressability-only; declaration successor lineage is not promoted",
      naturalRuntimeEstablished: false,
      fidelityEffect: "none",
      acceptanceEffect: "none",
    });
    targetLineage = Object.freeze({
      status: "acceptance-neutral-manual-source-static-fallback",
      declarationReportPath: bindings.declarationReport.path,
      declarationReportSha256: bindings.declarationReport.sha256,
      frameDomainId: target.timelineId,
      blockerClass: "stale-or-incomplete-declaration-successor-lineage",
    });
  }
  invariant(
    target.structuralReachability === "reachable-from-root-placement-graph" &&
      target.frameCount === machineTarget.frameCount &&
      target.frameCount === scenarioTarget.frameCount,
    `${animationId}: target timeline evidence disagrees`,
  );
  const namedPath = target.rootPlacement?.namedPlacementPath;
  invariant(namedPath?.length === 1 &&
    namedPath[0].parentTimelineId === "root" &&
    namedPath[0].childTimelineId === target.timelineId &&
    namedPath[0].sourceObjectId === target.sourceObjectId &&
    typeof namedPath[0].instanceName === "string" &&
    namedPath[0].instanceName.toLowerCase() === "animation" &&
    namedPath[0].hasClipActions === false,
  `${animationId}: target is not an exact direct inert named placement`);
  const rootTimeline = scenario.timelineInventory?.find(({timelineId}) =>
    timelineId === "root");
  const rootPlacement = rootTimeline?.namedPlacements?.find((placement) =>
    placement.frame === namedPath[0].frame &&
    placement.name === namedPath[0].instanceName &&
    Number(placement.objectId) === Number(target.sourceObjectId));
  const beginLabel = rootTimeline?.frameLabels?.find(({frame}) =>
    frame === namedPath[0].frame)?.label;
  const exactRootEntry = Boolean(
    rootTimeline?.frameCount === migration.runtime.frameCount &&
      hasControlReason(rootTimeline, 1, "script-stop-state") &&
      hasControlReason(rootTimeline, namedPath[0].frame, "script-stop-state") &&
      rootPlacement && beginLabel,
  );
  if (!exactRootEntry) {
    invariant(
      allowAcceptanceNeutralLineageFallback &&
        rootTimeline?.frameCount === migration.runtime.frameCount &&
        rootPlacement && beginLabel,
      `${animationId}: root entry structure is incomplete`,
    );
    lineageFallback = Object.freeze({
      reason: [
        lineageFallback?.reason,
        "root control-state stop proof is incomplete while the exact named placement and begin label remain source-bound",
      ].filter(Boolean).join("; "),
      disposition:
        "manual-source-static-addressability-only; root control-state behavior is not promoted",
      naturalRuntimeEstablished: false,
      fidelityEffect: "none",
      acceptanceEffect: "none",
    });
  }
  const exactPlacement = parseDirectRootPlacementFromSwfmill(
    bindings.swfmill.contents,
    {
      objectId: Number(target.sourceObjectId),
      expectedDepth: namedPath[0].depth,
      expectedName: namedPath[0].instanceName,
      expectedFrame: namedPath[0].frame,
    },
  );
  invariant(
    bindings.swfmill.sha256 === target.sourceEvidence?.swfmillSha256 &&
      target.sourceEvidence?.scenarioInventorySha256 === bindings.scenario.sha256,
    `${animationId}: exact placement evidence hashes drifted`,
  );
  const nativeStage = migration.runtime.stage;
  const backingStage = baseline.runtime?.rasterization;
  invariant(
    scenario.source?.stage?.width === nativeStage.width &&
      scenario.source?.stage?.height === nativeStage.height &&
      baseline.runtime?.stage?.width === nativeStage.width &&
      baseline.runtime?.stage?.height === nativeStage.height &&
      backingStage?.rule === "ceil-positive-native-stage-dimensions" &&
      backingStage.width === Math.ceil(nativeStage.width) &&
      backingStage.height === Math.ceil(nativeStage.height),
    `${animationId}: exact native/backing stage contract is unresolved`,
  );
  invariant(
    migration.runtime.fps === scenario.source.fps &&
      migration.runtime.fps === baseline.runtime.fps &&
      migration.runtime.backgroundColor === "#b8d8f7" &&
      migration.runtime.actionScriptVersion === "AS1/2",
    `${animationId}: runtime metadata changed`,
  );
  return Object.freeze({
    animationId,
    title: identifyPageTitle(scenario, migration.source.swf),
    release: Object.freeze({
      releaseId: release.releaseId,
      releaseTitle: release.titleDisplay,
      releaseOrdinal: member.ordinal,
      releaseRole: member.releaseRole,
      assetId: member.assetId,
    }),
    source: Object.freeze({
      swf: withoutContents(sourceSwf),
      fla: sourceFla ? withoutContents(sourceFla) : null,
      pairedFlaStatus: migration.source.pairedFlaStatus,
    }),
    evidence: Object.freeze(Object.fromEntries(
      Object.entries(bindings).map(([key, binding]) =>
        [key, withoutContents(binding)]),
    )),
    stage: Object.freeze({
      native: Object.freeze({
        width: nativeStage.width,
        height: nativeStage.height,
        backgroundColor: migration.runtime.backgroundColor,
      }),
      backing: Object.freeze({
        width: backingStage.width,
        height: backingStage.height,
        rule: backingStage.rule,
      }),
    }),
    fps: migration.runtime.fps,
    root: Object.freeze({
      frameCount: rootTimeline.frameCount,
      preloaderStopFrame: 1,
      beginFrame: namedPath[0].frame,
      beginLabel,
      placement: exactPlacement,
    }),
    target: Object.freeze({
      timelineId: target.timelineId,
      objectId: Number(target.sourceObjectId),
      frameCount: target.frameCount,
      disposition: target.disposition,
      structuralReachability: target.structuralReachability,
      declarationProofLineage: targetLineage,
    }),
    lineageFallback,
    scenario,
    audio,
  });
}

async function inspectFfdec(command) {
  const result = await execFile(command, ["-help"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const output = `${result.stdout}\n${result.stderr}`;
  invariant(output.includes(EXPECTED_FFDEC_VERSION),
    `FFDec version changed; expected ${EXPECTED_FFDEC_VERSION}`);
  return {command, version: EXPECTED_FFDEC_VERSION};
}

function analyzeFreshExport({frames, helper, profile}) {
  const text = frames.toString("utf8").replace(/\r\n?/g, "\n");
  const canvasMatch = text.match(
    /<canvas\s+id="myCanvas"\s+width="(\d+)"\s+height="(\d+)"/,
  );
  invariant(canvasMatch, `${profile.animationId}: FFDec Canvas size is missing`);
  const targetFunction = `sprite${profile.target.objectId}`;
  const functionPattern = new RegExp(
    `function\\s+${targetFunction}\\(ctx,ctrans,frame,ratio,time\\)\\{\\s*` +
      `ctx\\.save\\(\\);\\s*ctx\\.transform\\(1,0,0,1,([-0-9.]+),([-0-9.]+)\\);` +
      `\\s*var clips = \\[\\];\\s*var frame_cnt = (\\d+);`,
  );
  const functionMatch = text.match(functionPattern);
  invariant(functionMatch && Number(functionMatch[3]) === profile.target.frameCount,
    `${profile.animationId}: FFDec target sprite header drifted`);
  const definitionsStart = text.indexOf("var scalingGrids = {};");
  const viewerStart = text.indexOf("\nvar frame = -1;", definitionsStart);
  invariant(definitionsStart >= 0 && viewerStart > definitionsStart,
    `${profile.animationId}: FFDec definitions are incomplete`);
  const definitions = text.slice(definitionsStart, viewerStart);
  const placedFunctions = [...new Set(
    [...definitions.matchAll(/place\("([A-Za-z_$][A-Za-z0-9_$]*)"/g)]
      .map((match) => match[1]),
  )].sort();
  const imageVariables = [
    ...definitions.matchAll(
      /var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\);\s*\1\.src="data:image\/(?:PNG|JPEG);base64,[A-Za-z0-9+/=]+";/g,
    ),
  ].map((match) => match[1]);
  const fontFunctions = [
    ...definitions.matchAll(/function\s+(font\d+)\(ctx,ch,textColor\)\{/g),
  ].map((match) => match[1]);
  invariant(placedFunctions.length > 0,
    `${profile.animationId}: FFDec export has no placed drawing functions`);
  return Object.freeze({
    helperBytes: helper.length,
    helperSha256: sha256(helper),
    framesHtmlBytes: frames.length,
    framesHtmlSha256: sha256(frames),
    exportCanvas: Object.freeze({
      width: Number(canvasMatch[1]),
      height: Number(canvasMatch[2]),
    }),
    exportInternalTranslation: Object.freeze({
      x: Number(functionMatch[1]),
      y: Number(functionMatch[2]),
    }),
    targetSpriteFunction: targetFunction,
    placedFunctions,
    placedFunctionsSha256: sha256(JSON.stringify(placedFunctions)),
    imageVariables,
    imageVariablesSha256: sha256(JSON.stringify(imageVariables)),
    fontFunctions,
    fontFunctionsSha256: sha256(JSON.stringify(fontFunctions)),
  });
}

async function exportCanvas({ffdec, profile, temporaryRoot}) {
  const canvasRoot = path.join(temporaryRoot, profile.animationId);
  const result = await execFile(ffdec.command, [
    "-config", "packJavaScripts=false",
    "-onerror", "abort",
    "-selectid", String(profile.target.objectId),
    "-format", "sprite:canvas",
    "-export", "sprite",
    canvasRoot,
    projectPath(profile.source.swf.path),
  ], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  invariant(`${result.stdout}\n${result.stderr}`.includes(EXPECTED_FFDEC_VERSION),
    `${profile.animationId}: FFDec export version changed`);
  const exportDirectory = path.join(
    canvasRoot,
    `DefineSprite_${profile.target.objectId}`,
  );
  const [helper, frames] = await Promise.all([
    readFile(path.join(exportDirectory, "canvas.js")),
    readFile(path.join(exportDirectory, "frames.html")),
  ]);
  return {helper, frames, analysis: analyzeFreshExport({frames, helper, profile})};
}

function adapterSpec(profile, exported) {
  const placement = profile.root.placement;
  const stageRenderOffset = {
    x: placement.placementPixels.x - exported.exportInternalTranslation.x,
    y: placement.placementPixels.y - exported.exportInternalTranslation.y,
  };
  return {
    schemaVersion: 1,
    animationId: profile.animationId,
    classification:
      "source-static-current-javascript-engineering-candidate-only",
    source: {
      swf: profile.source.swf.path,
      swfSha256: profile.source.swf.sha256,
    },
    evidence: {
      scenarioInventory: profile.evidence.scenario.path,
      scenarioInventorySha256: profile.evidence.scenario.sha256,
      audioAudit: profile.evidence.audio.path,
      audioAuditSha256: profile.evidence.audio.sha256,
    },
    ffdecExport: {
      tool: EXPECTED_FFDEC_VERSION,
      helperSha256: exported.helperSha256,
      framesHtmlSha256: exported.framesHtmlSha256,
      targetSpriteObjectId: profile.target.objectId,
      targetSpriteFunction: exported.targetSpriteFunction,
      exportCanvas: exported.exportCanvas,
      exportInternalTranslation: exported.exportInternalTranslation,
      expectedPlacedFunctionCount: exported.placedFunctions.length,
      expectedPlacedFunctionsSha256: exported.placedFunctionsSha256,
      embeddedImageVariableCount: exported.imageVariables.length,
      embeddedImageVariablesSha256: exported.imageVariablesSha256,
      expectedFontFunctionCount: exported.fontFunctions.length,
      expectedFontFunctionsSha256: exported.fontFunctionsSha256,
    },
    timeline: {
      stage: {
        width: profile.stage.backing.width,
        height: profile.stage.backing.height,
        backgroundColor: profile.stage.native.backgroundColor,
      },
      fps: profile.fps,
      root: {
        frameCount: profile.root.frameCount,
        preloaderStopFrame: profile.root.preloaderStopFrame,
        beginFrame: profile.root.beginFrame,
        beginLabel: profile.root.beginLabel,
        placementName: placement.instanceName,
        placementTwips: placement.placementTwips,
        placementPixels: placement.placementPixels,
      },
      local: {
        timelineId: profile.target.timelineId,
        frameCount: profile.target.frameCount,
        playbackMode: "once",
        publicFrameIndexing: "one-indexed",
      },
      stageRenderOffset,
    },
    runtimeContract: {
      kind: "structural-local-frame",
      scenarios: ["source-static-frame"],
      defaultScenario: "source-static-frame",
      supportedLanguages: ["en"],
      seedMapping: "normalized-but-unused-by-source-static-drawing",
      blockedLocalFrameRanges: [],
      unresolved: [
        "authoritative original-runtime natural reachability and parent-host state",
        "Spanish visual behavior and bilingual audio cue/listening/synchronization",
        "ActionScript controls, branches, terminal state, and complete Replay reset",
        "full-frame original-runtime comparison, RMSE, human review, and owner acceptance",
      ],
    },
    output: {
      script:
        `public/flash-assets/courses/${profile.animationId}/canvas-renderer.js`,
      globalRegistry: "HELP_MATH_CANVAS_ASSETS",
    },
  };
}

async function runBrowserSweep(browser, runtime, profile, metadata) {
  const backing = profile.stage.backing;
  const page = await browser.newPage({
    viewport: {width: backing.width, height: backing.height},
  });
  const consoleErrors = [];
  const pageErrors = [];
  const networkRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => networkRequests.push(request.url()));
  try {
    await page.setContent(
      `<canvas id="stage" width="${backing.width}" height="${backing.height}"></canvas>`,
      {waitUntil: "load"},
    );
    await page.addScriptTag({content: runtime});
    const result = await page.evaluate(async ({
      animationId,
      frameCount,
      frameDomain,
      backingStage,
    }) => {
      const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[animationId];
      if (!asset) throw new Error("candidate runtime did not register locally");
      await asset.ready();
      if (
        asset.metadata.stage.width !== backingStage.width ||
        asset.metadata.stage.height !== backingStage.height
      ) throw new Error("Canvas backing-stage metadata mismatch");
      const canvas = document.getElementById("stage");
      const context = canvas.getContext("2d", {willReadFrequently: true});
      const sampleFrames = new Set([
        1,
        Math.ceil(frameCount / 2),
        frameCount,
      ]);
      const samples = [];
      let referencePixels = null;
      let previousPixels = null;
      let byteIdenticalToFrameOneCount = 0;
      let byteIdenticalToPreviousFrameCount = 0;
      const transitionStartFrames = [];
      const pixelsMatch = (left, right) => {
        if (!left || left.length !== right.length) return false;
        for (let index = 0; index < left.length; index += 1) {
          if (left[index] !== right[index]) return false;
        }
        return true;
      };
      for (let frame = 1; frame <= frameCount; frame += 1) {
        const state = asset.render(canvas, {
          frame,
          scenario: "source-static-frame",
          lang: "en",
          seed: 0,
        });
        if (
          state.localFrame !== frame ||
          state.frameDomain !== frameDomain ||
          state.scenario !== "source-static-frame" ||
          state.lang !== "en" ||
          state.audioRendered !== false ||
          state.interactiveStateResolved !== false
        ) throw new Error(`deterministic identity mismatch at frame ${frame}`);
        const pixels = context.getImageData(
          0,
          0,
          backingStage.width,
          backingStage.height,
        ).data;
        const pixelWords = new Uint32Array(
          pixels.buffer,
          pixels.byteOffset,
          pixels.byteLength / Uint32Array.BYTES_PER_ELEMENT,
        );
        if (frame === 1) {
          referencePixels = new Uint32Array(pixelWords);
          byteIdenticalToFrameOneCount = 1;
        } else {
          if (pixelsMatch(referencePixels, pixelWords)) {
            byteIdenticalToFrameOneCount += 1;
          }
          if (pixelsMatch(previousPixels, pixelWords)) {
            byteIdenticalToPreviousFrameCount += 1;
          } else {
            transitionStartFrames.push(frame);
          }
        }
        previousPixels = new Uint32Array(pixelWords);
        if (sampleFrames.has(frame)) {
          let nonTransparentPixelCount = 0;
          let hash = 2166136261;
          for (let index = 0; index < pixels.length; index += 4) {
            hash ^= pixels[index];
            hash = Math.imul(hash, 16777619);
            hash ^= pixels[index + 1];
            hash = Math.imul(hash, 16777619);
            hash ^= pixels[index + 2];
            hash = Math.imul(hash, 16777619);
            hash ^= pixels[index + 3];
            hash = Math.imul(hash, 16777619);
            if (pixels[index + 3] !== 0) nonTransparentPixelCount += 1;
          }
          samples.push({
            frame,
            fnv1a32Rgba: (hash >>> 0).toString(16).padStart(8, "0"),
            nonTransparentPixelCount,
          });
        }
      }
      const invalidRequests = [
        {label: "frame-zero", request: {frame: 0}},
        {label: "frame-overflow", request: {frame: frameCount + 1}},
        {label: "fractional-frame", request: {frame: 1.5}},
        {label: "scenario", request: {frame: 1, scenario: "unknown"}},
        {label: "spanish", request: {frame: 1, lang: "es"}},
        {label: "seed", request: {frame: 1, seed: 1.5}},
      ];
      const invalidRejections = [];
      for (const item of invalidRequests) {
        let rejected = false;
        try {
          asset.resolveFrameState({
            scenario: "source-static-frame",
            lang: "en",
            seed: 0,
            ...item.request,
          });
        } catch {
          rejected = true;
        }
        if (!rejected) throw new Error(`invalid request was accepted: ${item.label}`);
        invalidRejections.push(item.label);
      }
      return {
        renderedFrameCount: frameCount,
        sampleFrames: samples,
        fullFrameVisualSequence: {
          frameDomain,
          frameCount,
          comparisonMethod: "full-canvas-rgba-byte-equality",
          rgbaByteCountPerFrame:
            backingStage.width * backingStage.height * 4,
          comparedConsecutivePairCount: Math.max(0, frameCount - 1),
          byteIdenticalToPreviousFrameCount,
          changedFromPreviousFrameCount: transitionStartFrames.length,
          transitionStartFrames,
          byteIdenticalToFrameOneCount,
          allFramesByteIdenticalToFrameOne:
            byteIdenticalToFrameOneCount === frameCount,
          authority:
            "Exact current-JavaScript candidate raster comparison only; no original-runtime frame binding, fidelity, RMSE, or acceptance effect.",
        },
        invalidRejections,
        canvasIdentity: {
          frame: canvas.getAttribute("data-flash-frame"),
          frameDomain: canvas.getAttribute("data-flash-frame-domain"),
          rootFrame: canvas.getAttribute("data-flash-root-frame"),
          scenario: canvas.getAttribute("data-runtime-scenario"),
          seed: canvas.getAttribute("data-runtime-seed"),
        },
      };
    }, {
      animationId: profile.animationId,
      frameCount: profile.target.frameCount,
      frameDomain: profile.target.timelineId,
      backingStage: profile.stage.backing,
    });
    invariant(result.sampleFrames.every((sample) =>
      sample.nonTransparentPixelCount === backing.width * backing.height),
    `${profile.animationId}: representative Canvas frame was not fully painted`);
    invariant(
      result.fullFrameVisualSequence.frameCount === profile.target.frameCount &&
        result.fullFrameVisualSequence.comparedConsecutivePairCount ===
          Math.max(0, profile.target.frameCount - 1) &&
        result.fullFrameVisualSequence.byteIdenticalToPreviousFrameCount +
          result.fullFrameVisualSequence.changedFromPreviousFrameCount ===
          result.fullFrameVisualSequence.comparedConsecutivePairCount &&
        result.fullFrameVisualSequence.transitionStartFrames.length ===
          result.fullFrameVisualSequence.changedFromPreviousFrameCount,
      `${profile.animationId}: full-frame visual sequence accounting is incomplete`,
    );
    invariant(result.invalidRejections.length === 6,
      `${profile.animationId}: invalid request sweep was incomplete`);
    invariant(consoleErrors.length === 0,
      `${profile.animationId}: browser console errors: ${consoleErrors.join("; ")}`);
    invariant(pageErrors.length === 0,
      `${profile.animationId}: browser page errors: ${pageErrors.join("; ")}`);
    invariant(networkRequests.length === 0,
      `${profile.animationId}: unexpected browser network request`);
    return {
      ...result,
      adapterMetadataCanvasStage: metadata.stage,
      exactNativeStageContract: profile.stage.native,
      exactBackingStageContract: profile.stage.backing,
      consoleErrorCount: 0,
      pageErrorCount: 0,
      unexpectedNetworkRequestCount: 0,
    };
  } finally {
    await page.close();
  }
}

async function atomicWrite(relativePath, bytes) {
  const target = projectPath(relativePath);
  await mkdir(path.dirname(target), {recursive: true});
  const temporary = `${target}.tmp-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, target);
}

async function emit(relativePath, bytes, check) {
  if (check) {
    const current = await readFile(projectPath(relativePath));
    invariant(current.equals(bytes), `${relativePath}: generated output is stale`);
  } else {
    await atomicWrite(relativePath, bytes);
  }
}

function buildManifest({
  browserQa,
  built,
  exported,
  generatorBinding,
  profile,
  releaseCatalogBinding,
  runtimeBytes,
  safeAdapterBinding,
}) {
  return {
    schemaVersion: 1,
    artifactType: "release-source-static-engineering-candidate-manifest",
    animationId: profile.animationId,
    classification:
      "source-static-current-javascript-engineering-candidate-only",
    status: "unregistered-acceptance-neutral-engineering-artifact",
    authority:
      "Hash-bound FFDec source-static drawing and local current-browser diagnostics only. It is not a formal behavior renderer or original-runtime, bilingual, audio, Replay, fidelity, human, owner, strict, or publication acceptance record.",
    generator: withoutContents(generatorBinding),
    safeAdapter: withoutContents(safeAdapterBinding),
    releaseCatalog: {
      ...withoutContents(releaseCatalogBinding),
      release: profile.release,
    },
    source: profile.source,
    evidence: profile.evidence,
    exactDirectNamedChildPlacement: profile.root.placement,
    timeline: {
      nativeStage: profile.stage.native,
      backingStage: profile.stage.backing,
      fps: profile.fps,
      rootFrameCount: profile.root.frameCount,
      rootBeginFrame: profile.root.beginFrame,
      rootBeginLabel: profile.root.beginLabel,
      sourceStaticFrameDomain: profile.target,
      naturalRuntimeReachabilityEstablished: false,
    },
    sourceLineageFallback: profile.lineageFallback,
    freshFfdecExport: {
      tool: EXPECTED_FFDEC_VERSION,
      helperBytes: exported.helperBytes,
      helperSha256: exported.helperSha256,
      framesHtmlBytes: exported.framesHtmlBytes,
      framesHtmlSha256: exported.framesHtmlSha256,
      exportCanvas: exported.exportCanvas,
      exportInternalTranslation: exported.exportInternalTranslation,
      targetSpriteFunction: exported.targetSpriteFunction,
      placedFunctionCount: exported.placedFunctions.length,
      placedFunctionsSha256: exported.placedFunctionsSha256,
      embeddedImageVariableCount: exported.imageVariables.length,
      embeddedImageVariablesSha256: exported.imageVariablesSha256,
      fontFunctionCount: exported.fontFunctions.length,
      fontFunctionsSha256: exported.fontFunctionsSha256,
    },
    output: {
      script:
        `public/flash-assets/courses/${profile.animationId}/canvas-renderer.js`,
      bytes: runtimeBytes.length,
      sha256: sha256(runtimeBytes),
      globalRegistry: "HELP_MATH_CANVAS_ASSETS",
      registeredInProductRegistry: false,
    },
    runtimeBoundary: {
      supportedVisualLanguages: ["en"],
      SpanishVisualStatus: "unresolved-disabled",
      actionScriptExecuted: false,
      audioCues: [],
      audioRendered: false,
      controlsEnabled: false,
      sourceControlBehaviorResolved: false,
      naturalRuntimeEstablished: false,
      replayParityEstablished: false,
      fullFrameFidelityEstablished: false,
      maturity: "legacy-prototype",
    },
    safety: {
      sameOriginAssetRequired: true,
      sriRequired: true,
      noLegacyActionScriptExecuted: true,
      noDynamicEvaluation: true,
      noNetworkPrimitives: true,
      noTimersOrAutoplay: true,
      noPersistentStorage: true,
      noAmbientDomListeners: true,
      pointerEventsEnabled: false,
      embeddedImages: built.imageVariables,
      drawingObjectAllowlist: built.placedFunctions,
    },
    browserQa,
    unresolved: [
      "authoritative original-runtime natural reachability and parent-host state",
      "Spanish visual behavior and bilingual audio cue/listening/synchronization",
      "ActionScript controls, branches, terminal state, and complete Replay reset",
      "full-frame original-runtime comparison, RMSE, human review, and owner acceptance",
    ],
    acceptanceEffects: ACCEPTANCE_EFFECTS,
    registryChanged: false,
    migrationStatusChanged: false,
    strictAcceptanceEffect: "none",
  };
}

export function parseArguments(argv) {
  const options = {
    allowAcceptanceNeutralLineageFallback: false,
    check: false,
    ffdec: "ffdec",
    ids: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") options.check = true;
    else if (argument === "--allow-acceptance-neutral-lineage-fallback") {
      options.allowAcceptanceNeutralLineageFallback = true;
    }
    else if (["--release-id", "--id", "--ffdec"].includes(argument)) {
      const value = argv[++index];
      invariant(value && !value.startsWith("-"), `${argument} requires one value`);
      if (argument === "--release-id") {
        invariant(!options.releaseId, "duplicate --release-id is forbidden");
        options.releaseId = value;
      } else if (argument === "--id") options.ids.push(value);
      else options.ffdec = value;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (!options.help) {
    invariant(options.releaseId, "--release-id is required");
    invariant(options.ids.length > 0,
      "at least one exact --id is required; whole-release generation is forbidden");
    invariant(new Set(options.ids).size === options.ids.length,
      "duplicate --id is forbidden");
  }
  return options;
}

export async function buildReleaseSourceStaticEngineeringCandidates({
  allowAcceptanceNeutralLineageFallback = false,
  check = false,
  ffdec = "ffdec",
  ids,
  releaseId,
} = {}) {
  invariant(releaseId, "exact releaseId is required");
  invariant(Array.isArray(ids) && ids.length > 0,
    "exact non-empty candidate subset is required");
  const [releaseCatalogBinding, generatorBinding, safeAdapterBinding] =
    await Promise.all([
      readBinding(RELEASE_CATALOG_PATH),
      readBinding(GENERATOR_PATH),
      readBinding(SAFE_ADAPTER_PATH),
    ]);
  const releaseCatalog = parseJson(releaseCatalogBinding);
  const release = releaseCatalog.releases?.find((candidate) =>
    candidate.releaseId === releaseId);
  invariant(release, `unknown release ID: ${releaseId}`);
  const protectedBefore = Object.fromEntries(await Promise.all(
    PROTECTED_REGISTRY_PATHS.map(async (relativePath) => [
      relativePath,
      (await readBinding(relativePath)).sha256,
    ]),
  ));
  const profiles = [];
  for (const animationId of ids) {
    profiles.push(await deriveReleaseSourceStaticProfile({
      allowAcceptanceNeutralLineageFallback,
      animationId,
      release,
    }));
  }
  const ffdecTool = await inspectFfdec(ffdec);
  const browser = await chromium.launch({headless: true});
  const browserVersion = browser.version();
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "help-math-release-source-static-"),
  );
  const prepared = [];
  try {
    for (const profile of profiles) {
      const fresh = await exportCanvas({
        ffdec: ffdecTool,
        profile,
        temporaryRoot,
      });
      const spec = adapterSpec(profile, fresh.analysis);
      const built = buildSafeRuntime({
        helperSource: fresh.helper.toString("utf8"),
        framesHtml: fresh.frames.toString("utf8"),
        spec,
      });
      const runtimeBytes = Buffer.from(built.runtime);
      const browserQa = {
        ...(await runBrowserSweep(
          browser,
          built.runtime,
          profile,
          built.metadata,
        )),
        browser: `Chromium ${browserVersion}`,
      };
      const manifest = buildManifest({
        browserQa,
        built,
        exported: fresh.analysis,
        generatorBinding,
        profile,
        releaseCatalogBinding,
        runtimeBytes,
        safeAdapterBinding,
      });
      const manifestBytes = Buffer.from(stableJson(manifest));
      prepared.push({
        animationId: profile.animationId,
        runtime: {
          path: manifest.output.script,
          bytes: runtimeBytes,
        },
        manifest: {
          path:
            `public/flash-assets/courses/${profile.animationId}/manifest.json`,
          bytes: manifestBytes,
        },
        profile,
      });
    }
  } finally {
    await browser.close();
    await rm(temporaryRoot, {recursive: true, force: true});
  }
  for (const candidate of prepared) {
    await emit(candidate.runtime.path, candidate.runtime.bytes, check);
    await emit(candidate.manifest.path, candidate.manifest.bytes, check);
  }
  const protectedAfter = Object.fromEntries(await Promise.all(
    PROTECTED_REGISTRY_PATHS.map(async (relativePath) => [
      relativePath,
      (await readBinding(relativePath)).sha256,
    ]),
  ));
  invariant(JSON.stringify(protectedAfter) === JSON.stringify(protectedBefore),
    "protected product registry changed during unregistered candidate generation");
  return {
    schemaVersion: 1,
    operation: check ? "check" : "generate",
    releaseId,
    selectedMemberCount: prepared.length,
    allowAcceptanceNeutralLineageFallback,
    results: prepared.map((candidate) => ({
      animationId: candidate.animationId,
      targetFrameDomain: candidate.profile.target.timelineId,
      targetFrameCount: candidate.profile.target.frameCount,
      nativeStage: candidate.profile.stage.native,
      backingStage: candidate.profile.stage.backing,
      exactPlacement: candidate.profile.root.placement,
      runtime: {
        path: candidate.runtime.path,
        bytes: candidate.runtime.bytes.length,
        sha256: sha256(candidate.runtime.bytes),
      },
      manifest: {
        path: candidate.manifest.path,
        bytes: candidate.manifest.bytes.length,
        sha256: sha256(candidate.manifest.bytes),
      },
      registered: false,
      strictAcceptanceEffect: "none",
    })),
    protectedRegistriesUnchanged: true,
    migrationStatusChanged: false,
    strictAcceptanceEffect: "none",
  };
}

function help() {
  return [
    `Usage: node ${portable(path.relative(ROOT, scriptPath))} --release-id ID --id ANIMATION [--id ANIMATION ...] [options]`,
    "",
    "Options:",
    "  --release-id <id>  Exact atomic lesson release",
    "  --id <animation>    Exact candidate subset member (repeatable; required)",
    "  --ffdec <command>    FFDec command (default: ffdec)",
    "  --check              Regenerate in memory and compare without writing",
    "  -h, --help           Show this help",
  ].join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(`${help()}\n`);
    else process.stdout.write(`${JSON.stringify(
      await buildReleaseSourceStaticEngineeringCandidates(options),
      null,
      2,
    )}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  }
}
