import {isHfrArtifactEntry, validateHfrArtifactBinding} from './lib/hfr-artifact-binding-v1.mjs';

function invariant(value, message) {
  if (!value) throw new Error(message);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const DEPLOYMENT_SCOPES = new Set(["bundled", "local-only"]);
const SHA256 = /^[a-f0-9]{64}$/u;

function validateArtifactBinding(binding, label) {
  invariant(
    binding && typeof binding.path === "string" &&
      !binding.path.startsWith("/") && !binding.path.includes("..") &&
      Number.isSafeInteger(binding.bytes) && binding.bytes > 0 &&
      SHA256.test(binding.sha256),
    `${label} artifact binding is invalid`,
  );
}

function exactKeys(value, expected, message) {
  invariant(value && typeof value === "object" && !Array.isArray(value) &&
    JSON.stringify(Object.keys(value).sort()) ===
      JSON.stringify([...expected].sort()), message);
}

function validateLocalArtifacts(calibration, entry) {
  const artifacts = entry?.artifacts;
  if (isHfrArtifactEntry(entry)) {
    validateHfrArtifactBinding(calibration, entry);
    return;
  }
  if (artifacts?.kind === "maintained-dom-module-v1") {
    exactKeys(artifacts, ["kind", "module", "timeline", "memberManifest",
      "sourceRun"],
    `${calibration.calibrationId}:${entry?.key}: maintained DOM artifacts are invalid`);
    for (const [kind, binding] of Object.entries({module: artifacts.module,
      timeline: artifacts.timeline, memberManifest: artifacts.memberManifest,
      sourceRun: artifacts.sourceRun})) {
      validateArtifactBinding(binding,
        `${calibration.calibrationId}:${entry?.key}:${kind}`);
    }
    const pageToken = entry.key.match(/-(p\d{3})$/u)?.[1];
    const runRoot = artifacts.sourceRun.path.replace(/\/run-manifest\.json$/u,
      "");
    const p001Timeline = entry.key === "shared-alg001-l06-p001" &&
      artifacts.timeline.path ===
        "packages/demos/src/alg-l06-p001-title-state.ts";
    invariant(pageToken &&
      artifacts.module.path ===
        `packages/demos/src/${entry.module.slice(2)}.tsx` &&
      artifacts.module.path.endsWith(`-${pageToken}.tsx`) &&
      (p001Timeline ||
        (artifacts.timeline.path.startsWith("packages/demos/src/timelines/") &&
          artifacts.timeline.path.endsWith(`-${pageToken}.ts`))) &&
      artifacts.memberManifest.path ===
        `${runRoot}/members/${entry.key}/member-manifest.json` &&
      artifacts.sourceRun.path.startsWith(
        "work/g678-shared-page-factory/") &&
      artifacts.sourceRun.path.endsWith("/run-manifest.json"),
    `${calibration.calibrationId}:${entry?.key}: maintained DOM artifact paths are not exact`);
    return;
  }
  // Preserve the established external-canvas contract byte-for-byte for all
  // predecessor registrations. Only the exact new union member is tagged.
  exactKeys(artifacts, ["module", "timeline", "runtime"],
    `${calibration.calibrationId}:${entry?.key}: canvas artifacts are invalid`);
  validateArtifactBinding(artifacts.module,
    `${calibration.calibrationId}:${entry?.key}:module`);
  validateArtifactBinding(artifacts.timeline,
    `${calibration.calibrationId}:${entry?.key}:timeline`);
  validateArtifactBinding(artifacts.runtime,
    `${calibration.calibrationId}:${entry?.key}:runtime`);
  invariant(artifacts.module.path ===
      `packages/demos/src/${entry.module.slice(2)}.tsx` &&
    artifacts.timeline.path ===
      `packages/demos/src/timelines/${entry.key}.ts` &&
    artifacts.runtime.path.startsWith("work/g678-shared-page-factory/") &&
    artifacts.runtime.path.endsWith(
      `/members/${entry.key}/canvas-renderer.js`),
  `${calibration.calibrationId}:${entry?.key}: artifact paths are not canonical`);
}

function calibrationOrder(left, right) {
  const lessonIdentity = (value) => {
    const match = String(value?.calibrationId ?? "").match(
      /^g(\d+)-l(\d+)-/,
    );
    return match
      ? [Number(match[1]), Number(match[2])]
      : [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
  };
  const [leftGrade, leftLesson] = lessonIdentity(left);
  const [rightGrade, rightLesson] = lessonIdentity(right);
  return leftGrade - rightGrade || leftLesson - rightLesson ||
    String(left.calibrationId).localeCompare(String(right.calibrationId));
}

function calibrationsFrom(document) {
  invariant(
    document?.registryScope === "private-engineering",
    "private Current-JS registry scope changed",
  );
  if (document.schemaVersion === 1) {
    return [{
      calibrationId: document.calibrationId,
      freezeManifest: document.freezeManifest,
      entries: document.entries,
    }];
  }
  invariant(
    document.schemaVersion === 2 && Array.isArray(document.calibrations),
    "private Current-JS registry must use schemaVersion 1 or 2",
  );
  return document.calibrations;
}

function validateCalibration(calibration) {
  invariant(
    typeof calibration?.calibrationId === "string" &&
      calibration.calibrationId.length > 0 &&
      typeof calibration.freezeManifest === "string" &&
      calibration.freezeManifest.startsWith(
        "catalog/product-bridge-calibrations/",
      ) &&
      Array.isArray(calibration.entries) && calibration.entries.length > 0,
    "private Current-JS calibration is malformed",
  );
  invariant(
    calibration.deploymentScope === undefined ||
      DEPLOYMENT_SCOPES.has(calibration.deploymentScope),
    `${calibration.calibrationId}: private registry deploymentScope is invalid`,
  );
  const keys = calibration.entries.map((entry) => entry?.key);
  invariant(
    keys.every((key) => typeof key === "string" && key.length > 0) &&
      new Set(keys).size === keys.length,
    `${calibration.calibrationId}: private registry keys are invalid`,
  );
  if (calibration.entries.some(isHfrArtifactEntry))
    invariant(calibration.deploymentScope === "local-only", "HFR is local-only");
  if (calibration.deploymentScope === "local-only") {
    invariant(
      Number.isSafeInteger(calibration.freezeManifestBytes) &&
        calibration.freezeManifestBytes > 0 &&
        SHA256.test(calibration.freezeManifestSha256),
      `${calibration.calibrationId}: local-only freeze binding is invalid`,
    );
    for (const entry of calibration.entries) {
      validateLocalArtifacts(calibration, entry);
    }
  }
}

export function privateCurrentJsCalibrationDeploymentScope(calibration) {
  validateCalibration(calibration);
  return calibration.deploymentScope ?? "bundled";
}

export function privateCurrentJsCalibrationMatches(document, expected) {
  validateCalibration(expected);
  const matches = calibrationsFrom(document).filter(
    ({calibrationId}) => calibrationId === expected.calibrationId,
  );
  return matches.length === 1 &&
    JSON.stringify(matches[0]) === JSON.stringify(expected);
}

export function upsertPrivateCurrentJsCalibration(document, calibration) {
  validateCalibration(calibration);
  const prior = calibrationsFrom(document).find(item => item.calibrationId === calibration.calibrationId);
  if (calibration.entries.some(isHfrArtifactEntry) || prior?.entries.some(isHfrArtifactEntry)) {
    invariant(!prior || JSON.stringify(prior) === JSON.stringify(calibration),
      "HFR cannot replace an existing registration");
  }
  const calibrations = calibrationsFrom(document)
    .filter(({calibrationId}) => calibrationId !== calibration.calibrationId)
    .map(clone);
  calibrations.push(clone(calibration));
  calibrations.sort(calibrationOrder);

  const calibrationIds = calibrations.map(({calibrationId}) => calibrationId);
  invariant(
    new Set(calibrationIds).size === calibrationIds.length,
    "duplicate private Current-JS calibrationId",
  );
  const entryKeys = calibrations.flatMap(({entries}) =>
    entries.map(({key}) => key)
  );
  invariant(
    new Set(entryKeys).size === entryKeys.length,
    "duplicate private Current-JS animation key across calibrations",
  );

  return {
    schemaVersion: 2,
    registryScope: "private-engineering",
    calibrations,
  };
}
