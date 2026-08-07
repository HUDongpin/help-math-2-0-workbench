#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
  CANONICAL_PROJECTION_ENCODING,
  TECHNICAL_MANIFEST_PROJECTION,
  technicalManifestSha256,
} from "./evidence-projections.mjs";
import {
  PRODUCTION_CONTRACT as TI_HOST_BINDING_CONTRACT,
  planTiHostBindingAuthoringAuditPin,
} from "./refresh-ti-host-binding-authoring-audit-pin.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const SHA256 = /^[a-f0-9]{64}$/i;
const GS002_ANIMATION_ID = "course-g04-l09-gs-002";
const GS002_SCENARIO_INVENTORY_REVALIDATION = Object.freeze({
  status: "revalidated-after-english-structural-root-renderer-addition",
  checkedAt: "2026-07-22T15:20:37Z",
  checkedFacts: Object.freeze([
    "The preserved SWF SHA-256 and sprite-787 identity remain unchanged.",
    "The regenerated scenario inventory still records the ten-frame root placement at frame 6 and the 653-frame sprite-787 timeline.",
    "The source frame-642 action initializes game globals and hides Mc_Popup plus Robos_1 through Robos_8; therefore only frames 1 through 641 are admitted by the JavaScript candidate.",
    "The new English root renderer exposes only hash-bound FFDec structural drawings 1 through 10, keeps normal root playback stopped at frame 1, and does not alter the sprite-787 Canvas adapter contract.",
    "The adapter generator must revalidate the current scenario inventory, audio audit, FFDec helper, and FFDec frame export before writing outputs.",
  ]),
  strictAcceptanceEffect: "none",
});
const GS002_SCENARIO_INVENTORY_REVALIDATION_SHA256 =
  "97c8e36187612d3bab26aa3e99dcbb44cfaf9e9f8973de7efdfd642d17af22e0";

export const SPEC_ALLOWLIST = Object.freeze([
  {animationId: "course-g03-l01-ts-008", artifact: "audit/canvas-adapter-spec.json", kind: "adapter", semanticSha256: "d8b702d357fee9021f5c23f4e475366dca66da7ae0d79976b7ab4e8467035d77", consumer: "scripts/build-safe-ffdec-canvas-adapter.mjs"},
  {animationId: "course-g03-l01-vb-004", artifact: "audit/animate-createjs-adapter-spec.json", kind: "adapter", semanticSha256: "04bb3c051ba6e4af1718637f3cb1ad2fa1bcc555f2728ef5d320ab4cfae691db", consumer: "scripts/build-safe-animate-createjs-adapter.mjs"},
  {animationId: "course-g03-l06-fq-002-review", artifact: "audit/canvas-adapter-spec.json", kind: "adapter", semanticSha256: "73efcde3d18332b43402083e068b520cc7efe495c5bab0fb54dcfc1d481f4eb2", consumer: "scripts/build-safe-ffdec-canvas-adapter.mjs"},
  {animationId: "course-g03-l06-ti-001", artifact: "audit/adobe-frame-controller-spec.json", kind: "adobe-controller", semanticSha256: "2b1542e7fbb6a3a2e5d8f9b9594caa8eaed31a56f92a02fd7bb38d43cecd53d2", consumer: "scripts/build-adobe-ti-frame-controller-fixture.mjs"},
  {animationId: "course-g03-l06-ti-001", artifact: "audit/canvas-adapter-spec.json", kind: "adapter", semanticSha256: "cfeaf3af52e5c5ccb10969adaffce39f0eebf52407df4370e3f6d3158ed2d8bf", consumer: "scripts/build-safe-ffdec-canvas-adapter.mjs"},
  {animationId: "course-g04-l01-ir-001", artifact: "audit/canvas-adapter-spec.json", kind: "adapter", semanticSha256: "72a6dc78b0d5694e43798c31d5a16edef66fd6bffc395251d6f2fb794ace4ed1", consumer: "scripts/build-safe-ffdec-canvas-adapter.mjs"},
  {animationId: "course-g04-l03-in-009", artifact: "audit/canvas-candidate-spec.json", kind: "adapter", semanticSha256: "4dac7bd83ec62da25f84eb50f5393652bf5cd132d3d22afdbe4812cd26dbacf8", consumer: "scripts/build-in-009-ffdec-canvas-candidate.mjs"},
  {animationId: "course-g04-l09-gs-002", artifact: "audit/canvas-adapter-spec.json", kind: "adapter", semanticSha256: "d1a7e2d4f148adf123ab06bacd3d1c8a2f43dcb8a2ee4dbae60c1259f841047f", consumer: "scripts/build-safe-ffdec-canvas-adapter.mjs"},
  {animationId: "course-g05-l13-rw-002", artifact: "audit/canvas-adapter-spec.json", kind: "adapter", semanticSha256: "6ef27f170fe7e586cd940e88b2e47fdfcdf357d84ec18e8e65019f4068f42ec5", consumer: "scripts/build-safe-ffdec-canvas-adapter.mjs"},
]);

const INVALIDATED_PREREVIEW = Object.freeze({
  animationId: "course-g03-l06-ti-001",
  artifact: "audit/canvas-adapter-engineering-prereview.json",
  sidecar: "audit/canvas-adapter-engineering-prereview.invalidated-stale-scenario-inventory.json",
});

const TI_CONTROLLER_BINDING = Object.freeze({
  animationId: "course-g03-l06-ti-001",
  artifact: "audit/adobe-frame-controller-spec.json",
  pinId: "host-binding-resolution",
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function readJson(candidate, label) {
  const text = await readFile(candidate, "utf8");
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`${label}: invalid JSON (${error.message})`);
  }
  return {text, value, sha256: sha256(text)};
}

function scenarioPin(spec, kind) {
  if (kind === "adapter") {
    invariant(spec.evidence && typeof spec.evidence === "object", "adapter spec: evidence object missing");
    return {
      path: spec.evidence.scenarioInventory,
      sha256: spec.evidence.scenarioInventorySha256,
      update(targetPath, targetSha256) {
        spec.evidence.scenarioInventory = targetPath;
        spec.evidence.scenarioInventorySha256 = targetSha256;
      },
    };
  }
  const matches = (spec.evidencePins || []).filter(({id}) => id === "scenario-inventory");
  invariant(matches.length === 1, "controller spec: exactly one scenario-inventory evidence pin is required");
  return {
    path: matches[0].path,
    sha256: matches[0].sha256,
    update(targetPath, targetSha256) {
      matches[0].path = targetPath;
      matches[0].sha256 = targetSha256;
    },
  };
}

function audioPin(spec, kind) {
  if (kind === "adapter") {
    invariant(spec.evidence && typeof spec.evidence === "object", "adapter spec: evidence object missing");
    return {
      path: spec.evidence.audioAudit,
      sha256: spec.evidence.audioAuditSha256,
      update(targetPath, targetSha256) {
        spec.evidence.audioAudit = targetPath;
        spec.evidence.audioAuditSha256 = targetSha256;
      },
    };
  }
  const matches = (spec.evidencePins || []).filter(({id}) => id === "audio-runtime-evidence");
  invariant(matches.length === 1, "controller spec: exactly one audio-runtime-evidence pin is required");
  return {
    path: matches[0].path,
    sha256: matches[0].sha256,
    update(targetPath, targetSha256) {
      matches[0].path = targetPath;
      matches[0].sha256 = targetSha256;
    },
  };
}

function controllerEvidencePin(spec, pinId) {
  const matches = (spec.evidencePins || []).filter(({id}) => id === pinId);
  invariant(matches.length === 1, `controller spec: exactly one ${pinId} evidence pin is required`);
  return matches[0];
}

export function normalizeAuthorizedTiHostBindingPin(
  spec,
  {
    priorResolutionSha256 = TI_HOST_BINDING_CONTRACT.expectedPriorResolutionSha256,
    currentResolutionSha256,
  } = {},
) {
  invariant(SHA256.test(String(priorResolutionSha256)), "TI controller: prior host-binding SHA-256 is invalid");
  invariant(SHA256.test(String(currentResolutionSha256)), "TI controller: current host-binding SHA-256 is invalid");
  const normalized = structuredClone(spec);
  const pin = controllerEvidencePin(normalized, TI_CONTROLLER_BINDING.pinId);
  invariant(
    pin.path === TI_HOST_BINDING_CONTRACT.resolutionPath,
    "TI controller: host-binding-resolution path changed",
  );
  invariant(
    [priorResolutionSha256, currentResolutionSha256].includes(pin.sha256),
    "TI controller: host-binding-resolution pin is neither the authorized prior nor current value",
  );
  pin.sha256 = priorResolutionSha256;
  return normalized;
}

async function authorizedTiHostBindingRefresh({root, item, spec}) {
  if (
    item.animationId !== TI_CONTROLLER_BINDING.animationId ||
    item.artifact !== TI_CONTROLLER_BINDING.artifact ||
    item.kind !== "adobe-controller"
  ) return null;
  const plan = await planTiHostBindingAuthoringAuditPin({root});
  invariant(
    plan.changed === false,
    "TI controller: host-binding resolution lacks the exact current machine amendment",
  );
  const reconstructedPrior = JSON.parse(plan.beforeText);
  const dependencies = (reconstructedPrior.evidenceArtifacts || []).filter(
    ({artifactId}) => artifactId === TI_HOST_BINDING_CONTRACT.dependencyArtifactId,
  );
  invariant(
    dependencies.length === 1 &&
      dependencies[0].path === TI_HOST_BINDING_CONTRACT.dependencyPath &&
      dependencies[0].sha256 === TI_HOST_BINDING_CONTRACT.expectedCurrentDependencySha256,
    "TI controller: current host-binding dependency does not match the authorized amendment",
  );
  dependencies[0].sha256 = TI_HOST_BINDING_CONTRACT.expectedPriorDependencySha256;
  delete reconstructedPrior.machineBindingAmendments;
  invariant(
    sha256(`${JSON.stringify(reconstructedPrior, null, 2)}\n`) ===
      TI_HOST_BINDING_CONTRACT.expectedPriorResolutionSha256,
    "TI controller: host-binding resolution contains changes beyond the exact machine amendment",
  );
  const currentResolutionSha256 = sha256(plan.beforeText);
  normalizeAuthorizedTiHostBindingPin(spec, {currentResolutionSha256});
  return {
    priorResolutionSha256: TI_HOST_BINDING_CONTRACT.expectedPriorResolutionSha256,
    currentResolutionSha256,
  };
}

export function redactedSemanticSha256(spec, kind) {
  const clone = structuredClone(spec);
  scenarioPin(clone, kind).update("__CURRENT_SCENARIO_INVENTORY_PATH__", "__CURRENT_SCENARIO_INVENTORY_SHA256__");
  audioPin(clone, kind).update("__CURRENT_AUDIO_AUDIT_PATH__", "__CURRENT_AUDIO_AUDIT_SHA256__");
  if (clone.animationId === GS002_ANIMATION_ID) {
    invariant(kind === "adapter", "GS002 revalidation receipt is supported only for an adapter spec");
    const receipt = clone.evidence?.scenarioInventoryRevalidation;
    const canonicalReceipt = JSON.stringify(stable(receipt));
    const canonicalAllowlist = JSON.stringify(stable(GS002_SCENARIO_INVENTORY_REVALIDATION));
    invariant(
      canonicalReceipt === canonicalAllowlist
        && sha256(canonicalReceipt) === GS002_SCENARIO_INVENTORY_REVALIDATION_SHA256,
      "GS002 scenarioInventoryRevalidation receipt differs from the exact acceptance-neutral allowlist",
    );
    delete clone.evidence.scenarioInventoryRevalidation;
  }
  return sha256(JSON.stringify(stable(clone)));
}

function sourceFacts(spec) {
  return {
    swf: spec.source?.swf || spec.source?.path,
    swfSha256: spec.source?.swfSha256 || spec.source?.sha256,
    fla: spec.source?.fla || null,
    flaSha256: spec.source?.flaSha256 || null,
  };
}

function timelineFacts(spec) {
  const timeline = spec.timeline || spec.timelineContract;
  return {
    stage: timeline.stage || spec.source?.stage,
    fps: timeline.fps || spec.source?.fps,
    rootFrameCount: timeline.root?.frameCount,
    entryFrame: timeline.root?.beginFrame || timeline.root?.entryFrame,
    placementName: timeline.root?.placementName,
    placementObjectId: timeline.root?.placementObjectId || timeline.local?.objectId || String(timeline.local?.timelineId || "").replace(/^sprite-/, ""),
    localTimelineId: timeline.local?.timelineId,
    localFrameCount: timeline.local?.frameCount,
  };
}

function assertPathHash(root, declaredPath, declaredSha256, label) {
  invariant(typeof declaredPath === "string" && declaredPath.length > 0, `${label}: path missing`);
  invariant(SHA256.test(String(declaredSha256)), `${label}: SHA-256 missing`);
  const absolute = path.resolve(root, declaredPath);
  invariant(!path.relative(root, absolute).startsWith(".."), `${label}: path escapes project root`);
  return absolute;
}

async function validateCandidate({root, item}) {
  const workspace = path.join(root, "migrations", item.animationId);
  const specPath = path.join(workspace, item.artifact);
  const [specRecord, manifestRecord, inventoryRecord, readinessRecord] = await Promise.all([
    readJson(specPath, `${item.animationId} spec`),
    readJson(path.join(workspace, "migration.json"), `${item.animationId} manifest`),
    readJson(path.join(workspace, "audit", "scenario-inventory.json"), `${item.animationId} inventory`),
    readJson(path.join(workspace, "audit", "strict-readiness.json"), `${item.animationId} readiness`),
  ]);
  const audioRecord = await readJson(path.join(workspace, "audit", "audio-runtime-evidence.json"), `${item.animationId} current audio audit`);
  const {value: spec} = specRecord;
  const manifest = manifestRecord.value;
  const inventory = inventoryRecord.value;
  const readiness = readinessRecord.value;
  invariant(spec.animationId === item.animationId && manifest.animationId === item.animationId && inventory.animationId === item.animationId && readiness.animationId === item.animationId, `${item.animationId}: identity mismatch`);
  const hostBindingRefresh = await authorizedTiHostBindingRefresh({root, item, spec});
  const semanticSpec = hostBindingRefresh
    ? normalizeAuthorizedTiHostBindingPin(spec, hostBindingRefresh)
    : spec;
  invariant(redactedSemanticSha256(semanticSpec, item.kind) === item.semanticSha256, `${item.animationId}: non-binding spec semantics changed; refusing a hash-only refresh`);
  const facts = sourceFacts(spec);
  invariant(facts.swf === manifest.source?.swf && facts.swf === inventory.source?.swf && facts.swf === readiness.source?.swf, `${item.animationId}: source SWF path mismatch`);
  invariant(facts.swfSha256 === manifest.source?.swfSha256 && facts.swfSha256 === inventory.source?.swfSha256 && facts.swfSha256 === readiness.source?.swfSha256, `${item.animationId}: source SWF hash mismatch`);
  const sourcePath = assertPathHash(root, facts.swf, facts.swfSha256, `${item.animationId} source SWF`);
  invariant(sha256(await readFile(sourcePath)) === facts.swfSha256, `${item.animationId}: source SWF bytes changed`);
  if (facts.fla) {
    invariant(facts.fla === manifest.source?.fla && facts.flaSha256 === manifest.source?.flaSha256, `${item.animationId}: source FLA mismatch`);
    const flaPath = assertPathHash(root, facts.fla, facts.flaSha256, `${item.animationId} source FLA`);
    invariant(sha256(await readFile(flaPath)) === facts.flaSha256, `${item.animationId}: source FLA bytes changed`);
  }
  const manifestPin = inventory.evidenceIndex?.find(({artifactId}) => artifactId === "migration-technical-contract");
  const readinessPin = inventory.evidenceIndex?.find(({artifactId}) => artifactId === "strict-readiness");
  invariant(
    manifestPin?.path === "migration.json" &&
    manifestPin.hashMode === CANONICAL_PROJECTION_ENCODING &&
    manifestPin.projection === TECHNICAL_MANIFEST_PROJECTION.id &&
    JSON.stringify(manifestPin.excludedPaths) === JSON.stringify(TECHNICAL_MANIFEST_PROJECTION.excludedPaths) &&
    manifestPin.sha256 === technicalManifestSha256(manifest),
    `${item.animationId}: scenario inventory does not bind current manifest technical projection`,
  );
  invariant(readinessPin?.path === "audit/strict-readiness.json" && readinessPin.sha256 === readinessRecord.sha256, `${item.animationId}: scenario inventory does not bind current readiness`);

  const timeline = timelineFacts(spec);
  invariant(timeline.stage?.width === manifest.runtime?.stage?.width && timeline.stage?.height === manifest.runtime?.stage?.height, `${item.animationId}: stage mismatch`);
  invariant(timeline.fps === manifest.runtime?.fps && timeline.fps === inventory.source?.fps, `${item.animationId}: FPS mismatch`);
  invariant(timeline.rootFrameCount === manifest.runtime?.frameCount && timeline.rootFrameCount === inventory.source?.rootFrameCount, `${item.animationId}: root frame count mismatch`);
  const rootTimeline = inventory.timelineInventory?.find(({timelineId}) => timelineId === "root");
  const localTimeline = inventory.timelineInventory?.find(({timelineId}) => timelineId === timeline.localTimelineId);
  invariant(rootTimeline?.frameCount === timeline.rootFrameCount, `${item.animationId}: root inventory mismatch`);
  invariant(localTimeline?.frameCount === timeline.localFrameCount, `${item.animationId}: local frame count mismatch`);
  const domain = manifest.implementation?.frameDomains?.find(({id}) => id === timeline.localTimelineId);
  invariant(domain?.sourceTimelineId === timeline.localTimelineId && domain.frameCount === timeline.localFrameCount, `${item.animationId}: manifest frame-domain mismatch`);
  invariant(domain.parentEntryFrame === timeline.entryFrame, `${item.animationId}: entry frame mismatch`);
  const placement = manifest.runtime?.instances?.find(({id}) => id === domain.sourceInstanceId)?.placement;
  invariant(placement?.frame === timeline.entryFrame, `${item.animationId}: main placement frame mismatch`);
  if (timeline.placementName) invariant(placement.instanceName === timeline.placementName, `${item.animationId}: main placement name mismatch`);
  invariant(String(placement?.sourceObjectId) === String(timeline.placementObjectId), `${item.animationId}: placement object mismatch`);
  const inventoryPlacement = rootTimeline.namedPlacements?.find(({name, frame, objectId}) => (!timeline.placementName || name === timeline.placementName) && name === placement.instanceName && frame === timeline.entryFrame && String(objectId) === String(timeline.placementObjectId));
  invariant(inventoryPlacement && String(inventoryPlacement.depth) === String(placement.depth), `${item.animationId}: scenario placement mismatch`);

  const defaultScenario = spec.runtimeContract?.defaultScenario;
  if (defaultScenario) {
    invariant((manifest.scenarios || []).some(({id}) => id === defaultScenario), `${item.animationId}: default scenario ${defaultScenario} is absent from current manifest`);
    invariant(domain.scenarioIds?.includes(defaultScenario), `${item.animationId}: default scenario ${defaultScenario} is absent from current frame domain`);
  }
  invariant(audioRecord.value.animationId === item.animationId, `${item.animationId}: current audio audit identity mismatch`);
  invariant(audioRecord.value.source?.expectedSha256 === manifest.source?.swfSha256 && audioRecord.value.source?.observedSha256 === manifest.source?.swfSha256, `${item.animationId}: current audio audit source binding mismatch`);
  invariant(readiness.audioAudit?.report?.path === "audit/audio-runtime-evidence.json" && readiness.audioAudit?.report?.sha256 === audioRecord.sha256, `${item.animationId}: readiness audio pin mismatch`);
  invariant(await exists(path.join(root, item.consumer)), `${item.animationId}: consumer script missing`);

  const expectedInventoryPath = `migrations/${item.animationId}/audit/scenario-inventory.json`;
  const expectedAudioPath = `migrations/${item.animationId}/audit/audio-runtime-evidence.json`;
  const updatedSpec = structuredClone(spec);
  scenarioPin(updatedSpec, item.kind).update(expectedInventoryPath, inventoryRecord.sha256);
  audioPin(updatedSpec, item.kind).update(expectedAudioPath, audioRecord.sha256);
  if (hostBindingRefresh) {
    controllerEvidencePin(updatedSpec, TI_CONTROLLER_BINDING.pinId).sha256 =
      hostBindingRefresh.currentResolutionSha256;
  }
  const updatedSemanticSpec = hostBindingRefresh
    ? normalizeAuthorizedTiHostBindingPin(updatedSpec, hostBindingRefresh)
    : updatedSpec;
  invariant(redactedSemanticSha256(updatedSemanticSpec, item.kind) === item.semanticSha256, `${item.animationId}: refresh changed non-binding semantics`);
  return {
    item,
    specPath,
    previousSha256: specRecord.sha256,
    previousInventoryPin: scenarioPin(spec, item.kind).sha256,
    previousAudioPin: audioPin(spec, item.kind).sha256,
    previousHostBindingPin: hostBindingRefresh
      ? controllerEvidencePin(spec, TI_CONTROLLER_BINDING.pinId).sha256
      : null,
    currentInventorySha256: inventoryRecord.sha256,
    currentAudioSha256: audioRecord.sha256,
    currentHostBindingSha256: hostBindingRefresh?.currentResolutionSha256 || null,
    updatedText: `${JSON.stringify(updatedSpec, null, 2)}\n`,
    changed: specRecord.text !== `${JSON.stringify(updatedSpec, null, 2)}\n`,
  };
}

async function buildInvalidation({root}) {
  const item = INVALIDATED_PREREVIEW;
  const workspace = path.join(root, "migrations", item.animationId);
  const targetPath = path.join(workspace, item.artifact);
  const inventoryPath = path.join(workspace, "audit", "scenario-inventory.json");
  const [target, inventory] = await Promise.all([
    readJson(targetPath, "TI engineering prereview"),
    readJson(inventoryPath, "TI scenario inventory"),
  ]);
  const oldPin = target.value.sourceEvidence?.scenarioInventory;
  invariant(oldPin?.path === `migrations/${item.animationId}/audit/scenario-inventory.json`, "TI prereview: scenario inventory path changed");
  invariant(SHA256.test(String(oldPin.sha256)) && oldPin.sha256 !== inventory.sha256, "TI prereview: expected a stale scenario-inventory pin before invalidation");
  const sidecar = {
    schemaVersion: 1,
    evidenceKind: "formal-evidence-invalidation",
    animationId: item.animationId,
    status: "invalidated",
    invalidates: {path: item.artifact, sha256: target.sha256},
    trigger: {
      dependency: {path: `audit/scenario-inventory.json`, sha256: inventory.sha256},
      recordedSha256: oldPin.sha256,
      reason: "The engineering prereview binds an obsolete scenario inventory and no deterministic producer exists that can rerun the same Chromium smoke while rebuilding every screenshot and output hash.",
    },
    disposition: "excluded-from-current-evidence; original artifact retained byte-for-byte",
    regenerationRequirement: "Rerun an explicit Chromium QA producer and rebuild every screenshot, browser observation, runtime/asset hash, and review conclusion before replacing this invalidation.",
    migrationStatusChanged: false,
    acceptanceChanged: false,
    strictAcceptanceEffect: "none; invalidation removes stale evidence from the current set and satisfies no gate",
    generatedBy: {script: "scripts/refresh-course-candidate-spec-bindings.mjs", deterministic: true},
  };
  return {path: path.join(workspace, item.sidecar), text: `${JSON.stringify(sidecar, null, 2)}\n`, targetSha256: target.sha256};
}

export async function refreshCourseCandidateSpecBindings({root = PROJECT_ROOT, ids = [], check = false, invalidationOnly = false} = {}) {
  if (invalidationOnly) {
    invariant(ids.length === 0 || (ids.length === 1 && ids[0] === INVALIDATED_PREREVIEW.animationId), `--invalidation-only is restricted to ${INVALIDATED_PREREVIEW.animationId}`);
  }
  const unknown = ids.filter((id) => !SPEC_ALLOWLIST.some(({animationId}) => animationId === id));
  invariant(unknown.length === 0, `Unknown or non-allowlisted animation IDs: ${unknown.join(", ")}`);
  const selected = invalidationOnly ? [] : SPEC_ALLOWLIST.filter(({animationId}) => !ids.length || ids.includes(animationId));
  invariant(invalidationOnly || selected.length > 0, "No allowlisted candidate spec selected");
  const results = [];
  for (const item of selected) {
    try {
      const candidate = await validateCandidate({root, item});
      if (check) invariant(!candidate.changed, `${item.animationId}/${item.artifact}: stale; run refresh-course-candidate-spec-bindings.mjs`);
      else if (candidate.changed) await writeFile(candidate.specPath, candidate.updatedText, "utf8");
      results.push({animationId: item.animationId, artifact: item.artifact, status: candidate.changed ? (check ? "stale" : "updated") : "current", consumer: item.consumer, previousSha256: candidate.previousSha256, previousInventoryPin: candidate.previousInventoryPin, currentInventorySha256: candidate.currentInventorySha256, previousHostBindingPin: candidate.previousHostBindingPin, currentHostBindingSha256: candidate.currentHostBindingSha256});
    } catch (error) {
      results.push({animationId: item.animationId, artifact: item.artifact, status: "blocked", consumer: item.consumer, reason: error.message});
    }
  }
  let invalidation = null;
  if (invalidationOnly || !ids.length || ids.includes(INVALIDATED_PREREVIEW.animationId)) {
    try {
      const expected = await buildInvalidation({root});
      const actual = await exists(expected.path) ? await readFile(expected.path, "utf8") : null;
      if (check) invariant(actual === expected.text, `${INVALIDATED_PREREVIEW.animationId}: TI prereview invalidation sidecar is missing or stale`);
      else if (actual !== expected.text) await writeFile(expected.path, expected.text, "utf8");
      invalidation = {path: portable(path.relative(root, expected.path)), status: actual === expected.text ? "current" : check ? "stale" : "written", targetSha256: expected.targetSha256};
    } catch (error) {
      invalidation = {path: `migrations/${INVALIDATED_PREREVIEW.animationId}/${INVALIDATED_PREREVIEW.sidecar}`, status: "blocked", reason: error.message};
    }
  }
  const blocked = results.filter(({status}) => status === "blocked" || (check && status === "stale"));
  if (invalidation?.status === "blocked" || (check && invalidation?.status === "stale")) blocked.push(invalidation);
  return {
    schemaVersion: 1,
    evidenceKind: "course-candidate-spec-binding-refresh",
    authority: "Allowlisted scenario-inventory + structural-audio binding-only refresh after source/runtime/timeline/placement/readiness/current-manifest invariants. TI001 additionally permits only the exact machine-amended host-binding-resolution prior-to-current SHA cascade. No implementation semantics, status, review, or acceptance fields are changed.",
    check,
    invalidationOnly,
    status: blocked.length ? "blocked" : "pass",
    results,
    invalidation,
  };
}

export function parseArguments(argv) {
  const options = {check: false, ids: [], json: false, invalidationOnly: false};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--check") options.check = true;
    else if (argv[index] === "--json") options.json = true;
    else if (argv[index] === "--invalidation-only") options.invalidationOnly = true;
    else if (argv[index] === "--id") {
      invariant(argv[index + 1] && !argv[index + 1].startsWith("--"), "--id requires a value");
      options.ids.push(argv[++index]);
    } else if (argv[index] === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return options;
}

function usage() {
  return `Usage: node scripts/refresh-course-candidate-spec-bindings.mjs [--id <animation-id>] [--check] [--json] [--invalidation-only]\n\nRefreshes only allowlisted scenario-inventory and structural-audio path/SHA pins after strict semantic invariants pass. For the TI001 Adobe controller only, it also propagates the exact prior-to-current host-binding-resolution SHA proven by the dedicated machine amendment. It also writes/checks the formal invalidation sidecar for the non-reproducible TI engineering prereview. --invalidation-only is restricted to TI001 and writes/checks only that sidecar, leaving all candidate specs untouched. It never changes sources, implementation semantics, migration status, reviews, or acceptance.`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) return process.stdout.write(`${usage()}\n`);
  const report = await refreshCourseCandidateSpecBindings({ids: options.ids, check: options.check, invalidationOnly: options.invalidationOnly});
  console.log(options.json ? JSON.stringify(report, null, 2) : JSON.stringify({status: report.status, updated: report.results.filter(({status}) => status === "updated").length, blocked: report.results.filter(({status}) => status === "blocked").length, invalidation: report.invalidation?.status || null}));
  if (report.status !== "pass") process.exitCode = 1;
}

if (path.resolve(process.argv[1] || "") === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
