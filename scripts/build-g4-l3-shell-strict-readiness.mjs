#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {ADDITIONAL_DOMAIN_CONFIGS} from "./build-g4-l3-shell-ffdec-additional-domains.mjs";
import {SINGLE_FRAME_DOMAIN_CONFIGS} from "./build-g4-l3-shell-ffdec-single-frame-domains.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const animationId = "shell-course-g04-l03-index-local";
const workspace = path.join(projectRoot, "migrations", animationId);
const outputPath = path.join(workspace, "audit", "strict-readiness.json");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function structuralDispositionProjection(document, kind) {
  const projection = structuredClone(document);
  if (projection.generatedFrom) delete projection.generatedFrom.scenarioInventory;
  if (kind === "frame" && projection.generatedFrom?.staticDispositionEvidence) {
    delete projection.generatedFrom.staticDispositionEvidence.sha256;
    delete projection.generatedFrom.staticDispositionEvidence.bindingStatus;
    for (const timeline of projection.timelines || []) {
      if (timeline.staticCompositeEvidence) delete timeline.staticCompositeEvidence.evidenceSha256;
      if (timeline.sourceEvidence) delete timeline.sourceEvidence.scenarioInventorySha256;
    }
  }
  return projection;
}

function structuralDispositionProjectionBinding(relativePath, document, kind) {
  const excludedPaths = kind === "frame"
    ? ["generatedFrom.scenarioInventory", "generatedFrom.staticDispositionEvidence.sha256", "generatedFrom.staticDispositionEvidence.bindingStatus", "timelines.*.staticCompositeEvidence.evidenceSha256", "timelines.*.sourceEvidence.scenarioInventorySha256"]
    : ["generatedFrom.scenarioInventory"];
  return {
    path: relativePath,
    hashMode: "canonical-json-v1",
    projection: `g4-l3-shell-${kind}-disposition-semantic-v1`,
    excludedPaths,
    sha256: sha256(Buffer.from(JSON.stringify(stable(structuralDispositionProjection(document, kind))))),
  };
}

async function bind(relativePath) {
  const absolutePath = path.join(projectRoot, relativePath);
  const bytes = await readFile(absolutePath);
  return {path: portable(relativePath), bytes: bytes.length, sha256: sha256(bytes)};
}

async function atomicWrite(candidate, contents) {
  await mkdir(path.dirname(candidate), {recursive: true});
  const temporary = `${candidate}.tmp-${process.pid}`;
  await writeFile(temporary, contents);
  await rename(temporary, candidate);
}

export function validateShellStrictReadiness(report) {
  invariant(report.schemaVersion === 2, "Unexpected shell strict-readiness schema");
  invariant(report.animationId === animationId, "Unexpected shell strict-readiness identity");
  invariant(report.migrationStatusChanged === false, "Strict-readiness may not mutate migration status");
  invariant(report.conclusion.strictAcceptanceReady === false, "Strict-readiness must remain fail closed");
  invariant(report.conclusion.completionClaimAllowed === false, "Strict-readiness cannot permit completion claims");
  invariant(report.branchCaptureReadiness.requiredScenarioInventory.length === 44, "Shell scenario inventory must enumerate forty-four structural/route/state families");
  invariant(report.branchCaptureReadiness.missing.length > 0, "Shell strict-readiness must retain evidence gaps");
  invariant(report.frameDomainReadiness.reachableChildTimelineCount === 89, "Shell must retain the exact root-reachable child timeline count");
  invariant(report.frameDomainReadiness.staticCompositeChildCount === 56, "Shell must bind the exact source-proven composite-child count");
  invariant(report.frameDomainReadiness.declaredFrameDomainCount === 34, "Shell declared frame-domain count drifted");
  invariant(report.frameDomainReadiness.unresolvedTimelineCount === 0, "Shell must have no structurally unresolved timeline");
  invariant(report.frameDomainReadiness.unresolvedSingleFrameTimelineCount === 0, "Shell unresolved single-frame count drifted");
  invariant(report.frameDomainReadiness.unresolvedMultiFrameTimelineCount === 0, "Shell unresolved multi-frame count drifted");
  invariant(report.frameDomainReadiness.highRiskIndependentCandidateCount === 0, "Shell high-risk independent candidate count drifted");
  invariant(report.frameDomainReadiness.strictFrameDomainReady === false, "Static disposition cannot establish strict frame-domain readiness");
  invariant(report.review.decision === "pending", "Human/owner review cannot be inferred by this report");
  invariant(report.evidence.every(({sha256: digest}) => /^[a-f0-9]{64}$/.test(digest)), "Every readiness input must be hash bound");
  invariant(
    [report.structuralDispositionProjections?.staticDisposition, report.structuralDispositionProjections?.frameDisposition]
      .every((binding) => binding?.hashMode === "canonical-json-v1" && /^[a-f0-9]{64}$/.test(binding.sha256)),
    "Structural disposition semantic projections must be hash bound",
  );
  invariant(report.strictAcceptanceEffect === "none", "Strict-readiness cannot advance acceptance");
  return report;
}

export async function buildG4L3ShellStrictReadiness() {
  const manifestRelative = `migrations/${animationId}/migration.json`;
  const machineRelative = `migrations/${animationId}/audit/machine/report.json`;
  const shellContractRelative = `migrations/${animationId}/audit/source-local-current-javascript-shell-contract.json`;
  const coverageRelative = `migrations/${animationId}/evidence/full-frame-coverage.json`;
  const structuralReportRelative = `migrations/${animationId}/baseline/ffdec-root-frames.json`;
  const rootAssetsRelative = `public/flash-assets/courses/${animationId}/root-frames/manifest.json`;
  const nativeMenuAssetsRelative = `public/flash-assets/courses/${animationId}/sprite-1011/manifest.json`;
  const moverAssetsRelative = `public/flash-assets/courses/${animationId}/sprite-528/manifest.json`;
  const popupAssetsRelative = `public/flash-assets/courses/${animationId}/sprite-302/manifest.json`;
  const mouseObjectAssetsRelative = `public/flash-assets/courses/${animationId}/sprite-327/manifest.json`;
  const progressAssetsRelative = `public/flash-assets/courses/${animationId}/sprite-132/manifest.json`;
  const assetInventoryRelative = `migrations/${animationId}/asset-inventory.csv`;
  const audioAuditRelative = `migrations/${animationId}/audit/audio-runtime-evidence.json`;
  const audioInventoryRelative = `migrations/${animationId}/audio-inventory.csv`;
  const audioListeningRelative = `migrations/${animationId}/evidence/audio-listening-acceptance.json`;
  const frameDispositionRelative = `migrations/${animationId}/audit/frame-domain-disposition.json`;
  const staticDispositionRelative = `migrations/${animationId}/audit/static-frame-domain-disposition-evidence.json`;
  const additionalAssetInputsPromise = Promise.all(ADDITIONAL_DOMAIN_CONFIGS.map(async (config) => {
    const relativePath = `public/flash-assets/courses/${animationId}/${config.frameDomain}/manifest.json`;
    const bytes = await readFile(path.join(projectRoot, relativePath));
    return {config, bytes, document: JSON.parse(bytes.toString("utf8")), binding: await bind(relativePath)};
  }));
  const singleFrameAssetInputsPromise = Promise.all(SINGLE_FRAME_DOMAIN_CONFIGS.map(async (config) => {
    const relativePath = `public/flash-assets/courses/${animationId}/${config.frameDomain}/manifest.json`;
    const bytes = await readFile(path.join(projectRoot, relativePath));
    return {config, bytes, document: JSON.parse(bytes.toString("utf8")), binding: await bind(relativePath)};
  }));
  const [
    manifestBytes,
    machineBytes,
    shellContractBytes,
    coverageBytes,
    structuralReportBytes,
    rootAssetsBytes,
    nativeMenuAssetsBytes,
    moverAssetsBytes,
    popupAssetsBytes,
    mouseObjectAssetsBytes,
    progressAssetsBytes,
    audioAuditBytes,
    audioListeningBytes,
    frameDispositionBytes,
    staticDispositionBytes,
    ...evidence
  ] = await Promise.all([
    readFile(path.join(projectRoot, manifestRelative)),
    readFile(path.join(projectRoot, machineRelative)),
    readFile(path.join(projectRoot, shellContractRelative)),
    readFile(path.join(projectRoot, coverageRelative)),
    readFile(path.join(projectRoot, structuralReportRelative)),
    readFile(path.join(projectRoot, rootAssetsRelative)),
    readFile(path.join(projectRoot, nativeMenuAssetsRelative)),
    readFile(path.join(projectRoot, moverAssetsRelative)),
    readFile(path.join(projectRoot, popupAssetsRelative)),
    readFile(path.join(projectRoot, mouseObjectAssetsRelative)),
    readFile(path.join(projectRoot, progressAssetsRelative)),
    readFile(path.join(projectRoot, audioAuditRelative)),
    readFile(path.join(projectRoot, audioListeningRelative)),
    readFile(path.join(projectRoot, frameDispositionRelative)),
    readFile(path.join(projectRoot, staticDispositionRelative)),
    bind(manifestRelative),
    bind(machineRelative),
    bind(shellContractRelative),
    bind(coverageRelative),
    bind(structuralReportRelative),
    bind(rootAssetsRelative),
    bind(nativeMenuAssetsRelative),
    bind(moverAssetsRelative),
    bind(popupAssetsRelative),
    bind(mouseObjectAssetsRelative),
    bind(progressAssetsRelative),
    bind(assetInventoryRelative),
    bind(audioAuditRelative),
    bind(audioInventoryRelative),
    bind(audioListeningRelative),
    bind("catalog/toolchain.json"),
    bind("scripts/build-g4-l3-shell-strict-readiness.mjs"),
  ]);
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const machine = JSON.parse(machineBytes.toString("utf8"));
  const shellContract = JSON.parse(shellContractBytes.toString("utf8"));
  const coverage = JSON.parse(coverageBytes.toString("utf8"));
  const structuralReport = JSON.parse(structuralReportBytes.toString("utf8"));
  const rootAssets = JSON.parse(rootAssetsBytes.toString("utf8"));
  const nativeMenuAssets = JSON.parse(nativeMenuAssetsBytes.toString("utf8"));
  const moverAssets = JSON.parse(moverAssetsBytes.toString("utf8"));
  const popupAssets = JSON.parse(popupAssetsBytes.toString("utf8"));
  const mouseObjectAssets = JSON.parse(mouseObjectAssetsBytes.toString("utf8"));
  const progressAssets = JSON.parse(progressAssetsBytes.toString("utf8"));
  const audioAudit = JSON.parse(audioAuditBytes.toString("utf8"));
  const audioListening = JSON.parse(audioListeningBytes.toString("utf8"));
  const frameDisposition = JSON.parse(frameDispositionBytes.toString("utf8"));
  const staticDisposition = JSON.parse(staticDispositionBytes.toString("utf8"));
  const additionalAssetInputs = await additionalAssetInputsPromise;
  const singleFrameAssetInputs = await singleFrameAssetInputsPromise;
  invariant(manifest.animationId === animationId && machine.animationId === animationId && shellContract.animationId === animationId && coverage.animationId === animationId, "Shell readiness input identity mismatch");
  invariant(machine.source.hashMatches === true && machine.findings.runtimeCrossCheck.allMatch === true, "Machine source/runtime cross-check is incomplete");
  invariant(coverage.requirements.length === 88 && coverage.requirements.every(({status}) => status === "pending"), "Pending full-frame requirement contract drifted");
  invariant(
    nativeMenuAssets.animationId === animationId &&
      nativeMenuAssets.classification === "engineering-structural-inspection-not-strict-acceptance" &&
      nativeMenuAssets.runtime?.frameDomain === "sprite-1011" &&
      nativeMenuAssets.runtime?.frameCount === 48 &&
      nativeMenuAssets.authority?.actionScriptExecuted === false &&
      nativeMenuAssets.authority?.originalRuntimeBaseline === false &&
      nativeMenuAssets.frames?.length === 48 &&
      nativeMenuAssets.strictAcceptanceEffect === "none" &&
      manifest.implementation?.nativeMenuStructuralInspection?.assetManifestSha256 === sha256(nativeMenuAssetsBytes),
    "Product-readable sprite-1011 structural assets are missing, stale, or overclaimed",
  );
  invariant(
    moverAssets.animationId === animationId &&
      moverAssets.classification === "engineering-structural-inspection-not-strict-acceptance" &&
      moverAssets.runtime?.frameDomain === "sprite-528" &&
      moverAssets.runtime?.frameCount === 871 &&
      moverAssets.authority?.actionScriptExecuted === false &&
      moverAssets.authority?.originalRuntimeBaseline === false &&
      moverAssets.frames?.length === 871 &&
      moverAssets.assets?.length === 100 &&
      moverAssets.deduplication?.uniqueVisualCount === 100 &&
      moverAssets.strictAcceptanceEffect === "none" &&
      manifest.implementation?.moverTooltipStructuralInspection?.assetManifestSha256 === sha256(moverAssetsBytes),
    "Product-readable sprite-528 structural assets are missing, stale, or overclaimed",
  );
  for (const [assets, assetBytes, expected] of [
    [popupAssets, popupAssetsBytes, {frameDomain: "sprite-302", frameCount: 149, uniqueVisualCount: 20, manifestKey: "popupControlStructuralInspection"}],
    [mouseObjectAssets, mouseObjectAssetsBytes, {frameDomain: "sprite-327", frameCount: 132, uniqueVisualCount: 22, manifestKey: "mouseObjectControlStructuralInspection"}],
  ]) {
    invariant(
      assets.animationId === animationId &&
        assets.classification === "engineering-structural-inspection-not-strict-acceptance" &&
        assets.runtime?.frameDomain === expected.frameDomain &&
        assets.runtime?.frameCount === expected.frameCount &&
        assets.authority?.actionScriptExecuted === false &&
        assets.authority?.originalRuntimeBaseline === false &&
        assets.frames?.length === expected.frameCount &&
        assets.assets?.length === expected.uniqueVisualCount &&
        assets.deduplication?.uniqueVisualCount === expected.uniqueVisualCount &&
        assets.strictAcceptanceEffect === "none" &&
        manifest.implementation?.[expected.manifestKey]?.assetManifestSha256 === sha256(assetBytes),
      `Product-readable ${expected.frameDomain} structural assets are missing, stale, or overclaimed`,
    );
  }
  invariant(
    progressAssets.animationId === animationId &&
      progressAssets.classification === "engineering-structural-inspection-not-strict-acceptance" &&
      progressAssets.runtime?.frameDomain === "sprite-132" &&
      progressAssets.runtime?.frameCount === 100 &&
      progressAssets.authority?.actionScriptExecuted === false &&
      progressAssets.authority?.originalRuntimeBaseline === false &&
      progressAssets.frames?.length === 100 &&
      new Set(progressAssets.frames.map(({sha256: digest}) => digest)).size === 100 &&
      progressAssets.strictAcceptanceEffect === "none" &&
      manifest.implementation?.preloaderProgressStructuralInspection?.assetManifestSha256 === sha256(progressAssetsBytes),
    "Product-readable sprite-132 structural assets are missing, stale, or overclaimed",
  );
  const additionalInspections = manifest.implementation?.additionalFrameDomainStructuralInspections || [];
  invariant(additionalInspections.length === 14, "Shell additional-domain manifest bindings are incomplete");
  for (const {config, bytes, document, binding} of additionalAssetInputs) {
    const inspection = additionalInspections.find(({sourceTimelineId}) => sourceTimelineId === config.frameDomain);
    invariant(
      document.animationId === animationId &&
        document.classification === "engineering-structural-inspection-not-strict-acceptance" &&
        document.runtime?.frameDomain === config.frameDomain &&
        document.runtime?.frameCount === config.frameCount &&
        document.runtime?.rootFrame === config.rootFrame &&
        document.frames?.length === config.frameCount &&
        document.deduplication?.everyFrameMapped === true &&
        document.authority?.actionScriptExecuted === false &&
        document.authority?.originalRuntimeBaseline === false &&
        document.authority?.naturalPlaybackClaimed === false &&
        document.strictAcceptanceEffect === "none" &&
        inspection?.assetManifest === binding.path &&
        inspection?.assetManifestSha256 === sha256(bytes) &&
        inspection?.originalRuntimeBaselineComplete === false &&
        inspection?.strictAcceptanceEffect === "none",
      `Product-readable ${config.frameDomain} additional structural assets are missing, stale, or overclaimed`,
    );
  }
  const singleFrameInspections = manifest.implementation?.singleFrameDomainStructuralInspections || [];
  invariant(singleFrameInspections.length === 14, "Shell one-frame-domain manifest bindings are incomplete");
  for (const {config, bytes, document, binding} of singleFrameAssetInputs) {
    const inspection = singleFrameInspections.find(({sourceTimelineId}) => sourceTimelineId === config.frameDomain);
    invariant(
      document.animationId === animationId &&
        document.classification === "engineering-structural-inspection-not-strict-acceptance" &&
        document.runtime?.frameDomain === config.frameDomain &&
        document.runtime?.frameCount === 1 &&
        document.runtime?.rootFrame === config.rootFrame &&
        document.frames?.length === 1 &&
        document.deduplication?.everyFrameMapped === true &&
        document.authority?.actionScriptExecuted === false &&
        document.authority?.originalRuntimeBaseline === false &&
        document.authority?.naturalPlaybackClaimed === false &&
        document.strictAcceptanceEffect === "none" &&
        inspection?.assetManifest === binding.path &&
        inspection?.assetManifestSha256 === sha256(bytes) &&
        inspection?.originalRuntimeBaselineComplete === false &&
        inspection?.strictAcceptanceEffect === "none",
      `Product-readable ${config.frameDomain} one-frame structural assets are missing, stale, or overclaimed`,
    );
  }
  invariant(
    structuralReport.animationId === animationId &&
      structuralReport.status === "structural-baseline-only" &&
      structuralReport.authority?.kind === "swf-static-root-timeline-render" &&
      structuralReport.frames?.length === 50,
    "FFDec structural root report is missing or overclaimed",
  );
  invariant(
    rootAssets.animationId === animationId &&
      rootAssets.classification === "engineering-structural-inspection-not-strict-acceptance" &&
      rootAssets.authority?.actionScriptExecuted === false &&
      rootAssets.authority?.originalRuntimeBaseline === false &&
      rootAssets.frames?.length === 50 &&
      rootAssets.strictAcceptanceEffect === "none" &&
      manifest.implementation?.rootStructuralInspection?.assetManifestSha256 === sha256(rootAssetsBytes),
    "Product-readable root structural assets are missing, stale, or overclaimed",
  );
  invariant(
    audioAudit.animationId === animationId &&
      audioAudit.inventory?.rowCount === 16 &&
      audioAudit.inventory?.embeddedRows === 16 &&
      audioAudit.acceptance?.strictAudioAcceptance === "pending" &&
      audioListening.animationId === animationId &&
      audioListening.status === "pending" &&
      audioListening.cueReviews?.length === 16 &&
      audioListening.review?.decision === "pending",
    "Shell audio structure/listening boundary is missing or overclaimed",
  );
  invariant(
    frameDisposition.animationId === animationId &&
      frameDisposition.status === "structurally-enumerated" &&
      frameDisposition.summary?.reachableChildTimelineCount === 89 &&
      frameDisposition.summary?.dispositionCounts?.["declared-frame-domain"] === 34 &&
      frameDisposition.summary?.dispositionCounts?.["composite-child-with-parent"] === 56 &&
      frameDisposition.summary?.dispositionCounts?.unresolved === 0 &&
      frameDisposition.summary?.highRiskIndependentCandidateCount === 0 &&
      staticDisposition.animationId === animationId &&
      staticDisposition.status === "verified-static-composite-claims" &&
      staticDisposition.claims?.length === 56 &&
      staticDisposition.claims.every(({frameCount, role, claimScope, preservedObligations}) => (
        frameCount === 1 &&
        role === "single-frame-scriptless-structural-child" &&
        claimScope === "independent-local-playhead-only" &&
        Object.values(preservedObligations || {}).every(({satisfiedByDisposition}) => satisfiedByDisposition === false)
      )) &&
      staticDisposition.strictAcceptanceEffect?.startsWith("none;"),
    "Shell frame-domain disposition evidence is missing, stale, or overclaimed",
  );
  const unresolvedTimelines = frameDisposition.timelines.filter(({disposition}) => disposition === "unresolved");
  const unresolvedSingleFrameTimelines = unresolvedTimelines.filter(({frameCount}) => frameCount === 1);
  const unresolvedMultiFrameTimelines = unresolvedTimelines.filter(({frameCount}) => frameCount > 1);
  const highRiskTimelineIds = frameDisposition.summary.highRiskIndependentCandidates.map(({timelineId}) => timelineId);

  const report = {
    schemaVersion: 2,
    evidenceKind: "g4-l3-shell-strict-readiness",
    generatedBy: {script: "scripts/build-g4-l3-shell-strict-readiness.mjs", version: 5, deterministic: true},
    animationId,
    migrationStatusChanged: false,
    conclusion: {
      strictAcceptanceReady: false,
      completionClaimAllowed: false,
      localAuthoritativeBaselineCompletable: false,
      localExhaustiveBranchCaptureCompletable: false,
      risk: "critical",
      reason: "The preserved shell has hash-bound FFDec structural drawings for root frames 1-50 and all 33 independently required nested domains plus a separately labeled current-JavaScript route map, but no authorized original-runtime natural trace establishes ActionScript behavior, child loading, loading/mouse/hover causality, state branches, bilingual audio, terminal behavior, or Replay parity.",
    },
    source: {
      swf: manifest.source.swf,
      swfSha256: manifest.source.swfSha256,
      sourceHashVerified: true,
      fla: null,
      flaAvailability: "missing",
      authoringInspection: "not-applicable-no-paired-fla",
    },
    machineAudit: {
      auditStatus: machine.auditStatus,
      stage: manifest.runtime.stage,
      fps: manifest.runtime.fps,
      rootFrameCount: manifest.runtime.frameCount,
      actionScriptVersion: machine.findings.actionScriptVersion,
      exportedScriptFileCount: machine.findings.exportedScriptFileCount,
      externalCallCandidates: machine.findings.externalCallCandidates,
      observedBehaviorFromExtractedScripts: [
        "528 exported AVM1 script files include shell initialization, section/page routing, child-SWF loading, host commands, storage, and language/audio candidates.",
        "Frame 49 initializes the default section/page candidate and stops; frame 50 calls the source child-load sequence.",
        "The static child sequence exposes 44 candidates while the active index.xml product contract declares 39 lesson pages; the conflict remains unresolved.",
      ],
      report: {path: "audit/machine/report.json", sha256: sha256(machineBytes)},
      allReportOutputPinsVerified: true,
    },
    structuralRootInspection: {
      status: structuralReport.status,
      authority: structuralReport.authority.kind,
      frameCount: structuralReport.frames.length,
      distinctPngSha256Count: new Set(structuralReport.frames.map(({sha256: digest}) => digest)).size,
      productAssetClassification: rootAssets.classification,
      actionScriptExecuted: false,
      originalRuntimeBaselineComplete: false,
      strictAcceptanceEffect: "none",
    },
    structuralNativeMenuInspection: {
      frameDomain: nativeMenuAssets.runtime.frameDomain,
      sourceCharacterId: nativeMenuAssets.runtime.sourceCharacterId,
      frameCount: nativeMenuAssets.frames.length,
      distinctPngSha256Count: new Set(nativeMenuAssets.frames.map(({sha256: digest}) => digest)).size,
      rootFrame: nativeMenuAssets.geometry.rootPlacement.rootFrame,
      rootDepth: nativeMenuAssets.geometry.rootPlacement.depth,
      sourceInstanceId: nativeMenuAssets.geometry.rootPlacement.instanceName,
      productAssetClassification: nativeMenuAssets.classification,
      fullStageCompositionClaimed: false,
      actionScriptExecuted: false,
      originalRuntimeBaselineComplete: false,
      strictAcceptanceEffect: "none",
    },
    structuralMoverTooltipInspection: {
      frameDomain: moverAssets.runtime.frameDomain,
      sourceCharacterId: moverAssets.runtime.sourceCharacterId,
      frameCount: moverAssets.frames.length,
      distinctPngSha256Count: new Set(moverAssets.frames.map(({sha256: digest}) => digest)).size,
      deduplicatedAssetCount: moverAssets.assets.length,
      rootFrame: moverAssets.geometry.rootPlacement.rootFrame,
      rootDepth: moverAssets.geometry.rootPlacement.depth,
      sourceInstanceId: moverAssets.geometry.rootPlacement.instanceName,
      productAssetClassification: moverAssets.classification,
      hoverCausalityClaimed: false,
      fullStageCompositionClaimed: false,
      actionScriptExecuted: false,
      originalRuntimeBaselineComplete: false,
      strictAcceptanceEffect: "none",
    },
    structuralControlTooltipInspections: [
      {assets: popupAssets, key: "popup"},
      {assets: mouseObjectAssets, key: "mouse-object"},
    ].map(({assets, key}) => ({
      key,
      frameDomain: assets.runtime.frameDomain,
      sourceCharacterId: assets.runtime.sourceCharacterId,
      frameCount: assets.frames.length,
      distinctPngSha256Count: new Set(assets.frames.map(({sha256: digest}) => digest)).size,
      deduplicatedAssetCount: assets.assets.length,
      rootFrame: assets.geometry.rootPlacement.rootFrame,
      rootDepth: assets.geometry.rootPlacement.depth,
      sourceInstanceId: assets.geometry.rootPlacement.instanceName,
      productAssetClassification: assets.classification,
      mouseOrHoverCausalityClaimed: false,
      fullStageCompositionClaimed: false,
      actionScriptExecuted: false,
      originalRuntimeBaselineComplete: false,
      strictAcceptanceEffect: "none",
    })),
    structuralPreloaderProgressInspection: {
      frameDomain: progressAssets.runtime.frameDomain,
      sourceCharacterId: progressAssets.runtime.sourceCharacterId,
      frameCount: progressAssets.frames.length,
      distinctPngSha256Count: new Set(progressAssets.frames.map(({sha256: digest}) => digest)).size,
      rootPlacementChain: progressAssets.geometry.rootPlacementChain,
      sourceInstanceId: "preloader_mc.progress_mc",
      productAssetClassification: progressAssets.classification,
      loadingProgressCausalityClaimed: false,
      fullStageCompositionClaimed: false,
      actionScriptExecuted: false,
      originalRuntimeBaselineComplete: false,
      strictAcceptanceEffect: "none",
    },
    structuralAdditionalDomainInspections: additionalAssetInputs.map(({config, document, binding}) => ({
      frameDomain: config.frameDomain,
      sourceCharacterId: config.sourceCharacterId,
      sourceInstanceId: config.sourceInstanceId,
      frameCount: config.frameCount,
      uniqueVisualCount: document.deduplication.uniqueVisualCount,
      rootFrame: config.rootFrame,
      behaviorObligations: config.behaviorObligations,
      assetManifest: binding,
      productAssetClassification: document.classification,
      naturalPlaybackClaimed: false,
      fullStageCompositionClaimed: false,
      actionScriptExecuted: false,
      originalRuntimeBaselineComplete: false,
      strictAcceptanceEffect: "none",
    })),
    structuralSingleFrameDomainInspections: singleFrameAssetInputs.map(({config, document, binding}) => ({
      frameDomain: config.frameDomain,
      sourceCharacterId: config.sourceCharacterId,
      sourceInstanceId: config.sourceInstanceId,
      frameCount: 1,
      uniqueVisualCount: document.deduplication.uniqueVisualCount,
      rootFrame: config.rootFrame,
      behaviorObligations: config.behaviorObligations,
      assetManifest: binding,
      productAssetClassification: document.classification,
      eventCausalityClaimed: false,
      fullStageCompositionClaimed: false,
      actionScriptExecuted: false,
      originalRuntimeBaselineComplete: false,
      strictAcceptanceEffect: "none",
    })),
    structuralDispositionProjections: {
      staticDisposition: structuralDispositionProjectionBinding(staticDispositionRelative, staticDisposition, "static"),
      frameDisposition: structuralDispositionProjectionBinding(frameDispositionRelative, frameDisposition, "frame"),
      authorityBoundary: "These projections bind every semantic disposition and preserved obligation while excluding only the upstream scenario-inventory receipt hashes that would otherwise create a circular hash dependency. They do not promote static structure into runtime or fidelity evidence.",
    },
    frameDomainReadiness: {
      status: "partial-static-disposition-runtime-trace-required",
      reachableChildTimelineCount: frameDisposition.summary.reachableChildTimelineCount,
      declaredFrameDomainCount: frameDisposition.summary.dispositionCounts["declared-frame-domain"],
      staticCompositeChildCount: frameDisposition.summary.dispositionCounts["composite-child-with-parent"],
      staticCompositeProofType: "single-frame-scriptless-structural-child",
      staticCompositeClaimScope: "independent-local-playhead-only",
      unresolvedTimelineCount: unresolvedTimelines.length,
      unresolvedSingleFrameTimelineCount: unresolvedSingleFrameTimelines.length,
      unresolvedSingleFrameTimelineIds: unresolvedSingleFrameTimelines.map(({timelineId}) => timelineId),
      unresolvedMultiFrameTimelineCount: unresolvedMultiFrameTimelines.length,
      unresolvedMultiFrameTimelineIds: unresolvedMultiFrameTimelines.map(({timelineId}) => timelineId),
      highRiskIndependentCandidateCount: highRiskTimelineIds.length,
      highRiskIndependentCandidateTimelineIds: highRiskTimelineIds,
      strictFrameDomainReady: false,
      runtimeDispositionRequired: true,
      preservedObligations: [
        "button and clip-event behavior",
        "natural interaction and navigation traces",
        "audio reachability and synchronization",
        "full-frame capture and RMSE",
        "human visual review and owner acceptance",
      ],
      strictAcceptanceEffect: "none; all 89 reachable children now have source-bound structural dispositions (56 composite and 33 independent nested domains), while every original-runtime behavior, containing-context fidelity, audio, human, owner, and release obligation remains open",
    },
    audioReadiness: {
      inventoriedCueCount: audioAudit.inventory.rowCount,
      inventoriedLanguageCodes: audioAudit.inventory.inventoriedLanguages,
      authoritativeListeningComplete: audioAudit.acceptance.authoritativeListeningComplete,
      hostStateTraversalComplete: audioAudit.acceptance.hostStateTraversalComplete,
      synchronizationComplete: audioAudit.acceptance.synchronizationComplete,
      listeningRecordStatus: audioListening.status,
      reviewerDecision: audioListening.review.decision,
      strictAudioAcceptance: audioAudit.acceptance.strictAudioAcceptance,
    },
    branchCaptureReadiness: {
      status: "static-inventory-only",
      requiredScenarioInventory: [
        "source-root-structural static inspection versus original-runtime natural entry",
        "sprite-1011 native-menu structural inspection versus original-runtime nested natural entry",
        "sprite-528 mover-tooltip structural inspection versus original-runtime hover/nested natural entry",
        "sprite-302 popup-control structural inspection versus original-runtime hover/nested natural entry",
        "sprite-327 mouse-object structural inspection versus original-runtime mouse/nested natural entry",
        "sprite-132 preloader-progress structural inspection versus original-runtime loading/nested natural entry",
        ...ADDITIONAL_DOMAIN_CONFIGS.map(({frameDomain, label}) => `${frameDomain} ${label} structural inspection versus original-runtime nested natural entry`),
        ...SINGLE_FRAME_DOMAIN_CONFIGS.map(({frameDomain, label}) => `${frameDomain} ${label} structural inspection versus original-runtime nested natural entry`),
        "current-JavaScript lesson-map audit projection versus native shell state",
        "IR section selection",
        "RW section selection",
        "VB section selection",
        "IN section selection",
        "TI section selection",
        "GS section selection",
        "TS section selection",
        "FQ section selection",
        "quit confirmation, cancellation, terminal state, and complete Replay reset",
      ],
      missing: [
        "source-hash-bound authorized original-runtime natural-entry trace for root frames 1-50",
        "source-derived inert host fixture for child loading, language, history, storage, calculator, and close effects",
        "deterministic interaction traces for every section, quit branch, terminal state, and Replay",
        "authoritative English/Spanish audio cue, listening, synchronization, controls, and reset evidence",
        "paired baseline/implementation full-frame captures, RMSE metrics, diff inspection, and named review decisions",
      ],
      pendingFullFrameRequirementCount: coverage.requirements.length,
    },
    strictGateBlockers: [
      "All 50 root drawings are renderable only as FFDec static structure; original-runtime ActionScript, natural playback, child loading, audio, and interaction states remain unresolved.",
      "All 89 structurally root-reachable child timelines have source-bound structural dispositions: 56 one-frame scriptless children are composites and 33 timelines are independent nested domains; this establishes no runtime behavior or fidelity acceptance.",
      "All 88 root and nested-domain scenario/language full-frame requirements remain pending with zero authoritative baseline or paired implementation captures.",
      "No authoritative original-runtime, full-frame RMSE, bilingual audio, accessibility, engineering-review, human-review, or owner-acceptance evidence closes the shell.",
    ],
    executableNextActions: [
      "After fresh operator authorization, capture the exact shell SWF in an authorized original runtime with inert, source-derived host fixtures.",
      "Use authorized natural traces to verify the event causality and containing-context behavior of all structurally declared domains; do not promote FFDec structure into runtime truth.",
      "Capture paired native-stage frames, compute RMSE/diffs, inspect outliers, and obtain named human and owner decisions.",
    ],
    evidence: [...evidence, ...additionalAssetInputs.map(({binding}) => binding), ...singleFrameAssetInputs.map(({binding}) => binding)],
    review: {humanReviewer: null, engineeringReviewer: null, ownerReviewer: null, decision: "pending"},
    strictAcceptanceEffect: "none",
  };
  validateShellStrictReadiness(report);
  return report;
}

function parseArguments(argv) {
  const options = {check: false};
  for (const argument of argv) {
    if (argument === "--check") options.check = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log("Usage: node scripts/build-g4-l3-shell-strict-readiness.mjs [--check]");
    return;
  }
  const rendered = `${JSON.stringify(await buildG4L3ShellStrictReadiness(), null, 2)}\n`;
  if (options.check) {
    invariant(await readFile(outputPath, "utf8") === rendered, "G4 L3 shell strict-readiness is stale");
    console.log("verified G4 L3 shell strict-readiness");
  } else {
    await atomicWrite(outputPath, rendered);
    console.log("wrote G4 L3 shell strict-readiness");
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

export {parseArguments};
