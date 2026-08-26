import {normalizeRequirementSelection} from "./trace-frame-selection.mjs";

export const STRICT_FULL_DOMAIN_BOUNDARY =
  "partial-path requirements cannot enter strict acceptance, human/owner review, trace indexes, or original-runtime evidence";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const PARTIAL_STATUS_VALUES = new Set(["complete", "blocked", "pending"]);
const CURRENT_JAVASCRIPT_ONLY_TRUE_AUTHORITY = "currentJavascriptImplementationCaptureOnly";

function exactOneIndexedDomain(frames, frameCount) {
  return frames.length === frameCount
    && frames.every((frame, index) => frame === index + 1);
}

function assertPartialFileBinding(requirement, pathKey, shaKey, label) {
  const declaredPath = requirement[pathKey];
  const declaredSha256 = requirement[shaKey];
  const hasPath = typeof declaredPath === "string" && declaredPath.length > 0;
  const hasSha256 = typeof declaredSha256 === "string" && declaredSha256.length > 0;
  if (hasPath !== hasSha256) {
    throw new Error(`${label}.${pathKey} and ${label}.${shaKey} must be declared together`);
  }
  if (hasSha256 && !SHA256_PATTERN.test(declaredSha256)) {
    throw new Error(`${label}.${shaKey} must be a lowercase SHA-256`);
  }
  return hasPath;
}

/**
 * Validate the evidence and authority boundary of a supplemental partial row.
 *
 * This deliberately does not grant authority when every selected frame has
 * current-JavaScript evidence. It only proves that the supplemental row is
 * internally coherent and explicitly non-promoting.
 */
export function validateSupplementalPartialRequirementBoundary(
  requirement,
  selection,
  label = "partial-path requirement",
) {
  if (selection?.coverageRole !== "partial-path") {
    throw new Error(`${label} is not a supplemental partial-path requirement`);
  }
  if (requirement.strictAcceptanceEffect !== "none") {
    throw new Error(`${label}.strictAcceptanceEffect must be exactly none`);
  }
  if (!PARTIAL_STATUS_VALUES.has(requirement.status)) {
    throw new Error(`${label}.status must be complete, blocked, or pending`);
  }

  const selectedFrames = selection.selectedPhysicalFrames;
  const selected = new Set(selectedFrames);
  if (!Number.isInteger(requirement.capturedFrameCount) || requirement.capturedFrameCount < 0) {
    throw new Error(`${label}.capturedFrameCount must be a non-negative integer`);
  }
  if (!Array.isArray(requirement.missingFrames)) {
    throw new Error(`${label}.missingFrames must be an array`);
  }
  let previous = 0;
  for (const [index, frame] of requirement.missingFrames.entries()) {
    if (!Number.isInteger(frame) || frame < 1 || !selected.has(frame)) {
      throw new Error(`${label}.missingFrames[${index}] must be one of the selected physical frames`);
    }
    if (frame <= previous) {
      throw new Error(`${label}.missingFrames must be strictly increasing and unique`);
    }
    previous = frame;
  }
  if (requirement.capturedFrameCount !== selectedFrames.length - requirement.missingFrames.length) {
    throw new Error(
      `${label}.capturedFrameCount must equal selected physical frames minus missingFrames`,
    );
  }
  if (
    requirement.status === "complete"
    && (requirement.capturedFrameCount !== selectedFrames.length || requirement.missingFrames.length > 0)
  ) {
    throw new Error(`${label}.status complete requires every selected physical frame and no missingFrames`);
  }

  const hasCapture = assertPartialFileBinding(requirement, "captureManifest", "captureManifestSha256", label);
  assertPartialFileBinding(requirement, "metricsFile", "metricsSha256", label);
  if (requirement.status === "complete" && !hasCapture) {
    throw new Error(`${label}.status complete requires a hash-bound current-JavaScript captureManifest`);
  }
  if (requirement.capturedFrameCount > 0 && !hasCapture) {
    throw new Error(`${label} cannot claim captured frames without a hash-bound captureManifest`);
  }
  if (
    (typeof requirement.baselineCaptureManifest === "string" && requirement.baselineCaptureManifest.length > 0)
    || (typeof requirement.baselineCaptureManifestSha256 === "string" && requirement.baselineCaptureManifestSha256.length > 0)
  ) {
    throw new Error(`${label} must not bind an original-runtime baseline capture`);
  }
  if (
    requirement.baselineAuthority !== undefined
    && requirement.baselineAuthority !== ""
    && requirement.baselineAuthority !== "unresolved"
  ) {
    throw new Error(`${label}.baselineAuthority must remain unresolved`);
  }

  if (requirement.authority !== undefined) {
    if (
      requirement.authority === null
      || typeof requirement.authority !== "object"
      || Array.isArray(requirement.authority)
    ) {
      throw new Error(`${label}.authority must be an object when declared`);
    }
    for (const [key, value] of Object.entries(requirement.authority)) {
      if (value === true && key !== CURRENT_JAVASCRIPT_ONLY_TRUE_AUTHORITY) {
        throw new Error(`${label}.authority.${key} must not be true`);
      }
    }
  }
  return selection;
}

export function classifyStrictFullDomainRequirement(requirement, frameCount, label = "requirement") {
  let selection;
  try {
    selection = normalizeRequirementSelection(requirement, frameCount);
  } catch (error) {
    throw new Error(`${label} has an invalid canonical frame selection: ${error.message}`);
  }
  return {
    eligible: selection.coverageRole === "full-domain"
      && exactOneIndexedDomain(selection.selectedPhysicalFrames, frameCount),
    selection,
  };
}

/**
 * Return the canonical selection only when this single requirement, by itself,
 * covers every physical frame in its declared frame domain.
 *
 * A union of partial-path requirements is intentionally irrelevant here:
 * strict/review/original-runtime authority is granted per canonical
 * requirement, never by an aggregate that erases path identity.
 */
export function assertStrictFullDomainRequirement(requirement, frameCount, label = "requirement") {
  const {eligible, selection} = classifyStrictFullDomainRequirement(requirement, frameCount, label);
  if (!eligible) {
    throw new Error(
      `${label}: ${STRICT_FULL_DOMAIN_BOUNDARY}; this requirement must itself select exactly 1..${frameCount}`,
    );
  }
  return selection;
}

export function strictFullDomainRequirementResult(requirement, frameCount, label = "requirement") {
  try {
    return {
      ok: true,
      selection: assertStrictFullDomainRequirement(requirement, frameCount, label),
      error: null,
    };
  } catch (error) {
    return {ok: false, selection: null, error: error.message};
  }
}
