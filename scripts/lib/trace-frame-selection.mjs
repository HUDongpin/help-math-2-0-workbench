import {
  canonicalProjectionJson,
  projectionSha256,
} from "../evidence-projections.mjs";

const COVERAGE_ROLES = new Set(["full-domain", "partial-path"]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const STABLE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertPlainObject(value, label) {
  if (!isPlainObject(value)) throw new Error(`${label} must be a plain object`);
  return value;
}

function assertExactKeys(value, required, optional, label) {
  const requiredSet = new Set(required);
  const allowed = new Set([...required, ...optional]);
  const keys = Object.keys(value);
  for (const key of required) {
    if (!Object.hasOwn(value, key)) throw new Error(`${label}.${key} is required`);
  }
  for (const key of keys) {
    if (!allowed.has(key)) throw new Error(`${label}.${key} is not allowed`);
  }
  for (const key of requiredSet) {
    if (value[key] === undefined) throw new Error(`${label}.${key} must not be undefined`);
  }
}

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${label} must be a positive integer`);
  return value;
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function assertStableId(value, label) {
  assertNonEmptyString(value, label);
  if (!STABLE_ID_PATTERN.test(value)) throw new Error(`${label} must be a stable identifier`);
  return value;
}

function assertSha256(value, label) {
  if (!SHA256_PATTERN.test(value || "")) throw new Error(`${label} must be a lowercase SHA-256`);
  return value;
}

function equalNumberArrays(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function rangeFrames(firstFrame, lastFrame) {
  return Array.from({length: lastFrame - firstFrame + 1}, (_, index) => firstFrame + index);
}

function normalizeRequiredRange(requiredRange, frameCount, label) {
  assertPlainObject(requiredRange, label);
  assertExactKeys(requiredRange, ["firstFrame", "lastFrame"], [], label);
  const firstFrame = assertPositiveInteger(requiredRange.firstFrame, `${label}.firstFrame`);
  const lastFrame = assertPositiveInteger(requiredRange.lastFrame, `${label}.lastFrame`);
  if (firstFrame > lastFrame) throw new Error(`${label}.firstFrame must not exceed lastFrame`);
  if (lastFrame > frameCount) throw new Error(`${label}.lastFrame exceeds frameCount ${frameCount}`);
  return rangeFrames(firstFrame, lastFrame);
}

function normalizeRequiredFrameSet(requiredFrameSet, frameCount, label) {
  assertPlainObject(requiredFrameSet, label);
  assertExactKeys(requiredFrameSet, ["frames"], [], label);
  if (!Array.isArray(requiredFrameSet.frames) || requiredFrameSet.frames.length === 0) {
    throw new Error(`${label}.frames must be a non-empty array`);
  }
  let previous = 0;
  return requiredFrameSet.frames.map((frame, index) => {
    assertPositiveInteger(frame, `${label}.frames[${index}]`);
    if (frame > frameCount) throw new Error(`${label}.frames[${index}] exceeds frameCount ${frameCount}`);
    if (frame <= previous) {
      throw new Error(`${label}.frames must be strictly increasing and unique`);
    }
    previous = frame;
    return frame;
  });
}

function physicalSelectionHash(requiredUniverse, frames) {
  return projectionSha256({
    schemaVersion: 1,
    requiredUniverse,
    selectedPhysicalFrames: frames,
  });
}

function normalizeNaturalPath(naturalPath, selectedFrames, frameCount) {
  assertPlainObject(naturalPath, "requirement.naturalPath");
  assertExactKeys(
    naturalPath,
    ["orderedVisits", "orderedVisitsSha256"],
    [],
    "requirement.naturalPath",
  );
  if (!Array.isArray(naturalPath.orderedVisits) || naturalPath.orderedVisits.length === 0) {
    throw new Error("requirement.naturalPath.orderedVisits must be a non-empty array");
  }
  assertSha256(
    naturalPath.orderedVisitsSha256,
    "requirement.naturalPath.orderedVisitsSha256",
  );

  const orderedVisits = naturalPath.orderedVisits.map((visit, index) => {
    const label = `requirement.naturalPath.orderedVisits[${index}]`;
    assertPlainObject(visit, label);
    assertExactKeys(visit, ["order", "frame"], ["outcomeId"], label);
    if (visit.order !== index + 1) throw new Error(`${label}.order must be the contiguous one-based visit order`);
    assertPositiveInteger(visit.frame, `${label}.frame`);
    if (visit.frame > frameCount) throw new Error(`${label}.frame exceeds frameCount ${frameCount}`);
    if (Object.hasOwn(visit, "outcomeId")) assertNonEmptyString(visit.outcomeId, `${label}.outcomeId`);
    return {
      order: visit.order,
      frame: visit.frame,
      ...(Object.hasOwn(visit, "outcomeId") ? {outcomeId: visit.outcomeId} : {}),
    };
  });

  const orderedVisitsSha256 = projectionSha256(orderedVisits);
  if (naturalPath.orderedVisitsSha256 !== orderedVisitsSha256) {
    throw new Error("requirement.naturalPath.orderedVisitsSha256 does not match orderedVisits");
  }

  const uniquePhysicalFrames = [...new Set(orderedVisits.map(({frame}) => frame))].sort((left, right) => left - right);
  if (!equalNumberArrays(uniquePhysicalFrames, selectedFrames)) {
    throw new Error("requirement.naturalPath unique physical-frame projection does not equal the requirement selection");
  }

  return {orderedVisits, orderedVisitsSha256};
}

function deriveSelection(
  requirement,
  frameCount,
  {validateDeclaredSelectionHash = true, validateNaturalPath = true} = {},
) {
  assertPlainObject(requirement, "requirement");
  assertPositiveInteger(frameCount, "frameCount");

  const requirementSchemaVersion = requirement.requirementSchemaVersion ?? 1;
  if (requirementSchemaVersion !== 1 && requirementSchemaVersion !== 2) {
    throw new Error("requirement.requirementSchemaVersion must be 1 or 2");
  }

  const hasRequiredRange = Object.hasOwn(requirement, "requiredRange");
  const hasRequiredFrameSet = Object.hasOwn(requirement, "requiredFrameSet");
  let selectionKind;
  let frames;

  if (requirementSchemaVersion === 1) {
    if (Object.hasOwn(requirement, "coverageGroupId")) {
      throw new Error("requirement.coverageGroupId is only allowed for schema v2");
    }
    if (!hasRequiredRange || hasRequiredFrameSet) {
      throw new Error("requirement schema v1 requires requiredRange and does not allow requiredFrameSet");
    }
    frames = normalizeRequiredRange(requirement.requiredRange, frameCount, "requirement.requiredRange");
    if (frames[0] !== 1 || frames.at(-1) !== frameCount) {
      throw new Error("requirement schema v1 only supports the full 1..frameCount range");
    }
    selectionKind = "required-range";
  } else {
    if (hasRequiredRange === hasRequiredFrameSet) {
      throw new Error("requirement schema v2 requires exactly one of requiredRange or requiredFrameSet");
    }
    if (hasRequiredRange) {
      selectionKind = "required-range";
      frames = normalizeRequiredRange(requirement.requiredRange, frameCount, "requirement.requiredRange");
    } else {
      selectionKind = "required-frame-set";
      frames = normalizeRequiredFrameSet(requirement.requiredFrameSet, frameCount, "requirement.requiredFrameSet");
    }
  }

  const expectedCoverageRole = frames.length === frameCount ? "full-domain" : "partial-path";
  if (requirementSchemaVersion === 2) {
    if (!COVERAGE_ROLES.has(requirement.coverageRole)) {
      throw new Error("requirement.coverageRole must be full-domain or partial-path for schema v2");
    }
    if (validateDeclaredSelectionHash) {
      assertStableId(requirement.coverageGroupId, "requirement.coverageGroupId");
    } else if (requirement.coverageGroupId !== undefined) {
      assertStableId(requirement.coverageGroupId, "requirement.coverageGroupId");
    }
    if (requirement.coverageRole !== expectedCoverageRole) {
      throw new Error(`requirement.coverageRole must be ${expectedCoverageRole} for the selected physical frames`);
    }
  } else if (requirement.coverageRole !== undefined && requirement.coverageRole !== expectedCoverageRole) {
    throw new Error(`requirement.coverageRole must be ${expectedCoverageRole} for schema v1`);
  }

  const requiredUniverse = {firstFrame: 1, lastFrame: frameCount};
  const computedSelectionSha256 = physicalSelectionHash(requiredUniverse, frames);
  if (requirementSchemaVersion === 2 && validateDeclaredSelectionHash) {
    assertSha256(requirement.selectionSha256, "requirement.selectionSha256");
    if (requirement.selectionSha256 !== computedSelectionSha256) {
      throw new Error("requirement.selectionSha256 does not match the canonical physical selection");
    }
  }
  const normalized = {
    requirementSchemaVersion,
    selectionKind,
    coverageRole: expectedCoverageRole,
    requiredUniverse,
    selectedPhysicalFrames: [...frames],
    selectionSha256: computedSelectionSha256,
    ...(requirementSchemaVersion === 2 && requirement.coverageGroupId !== undefined
      ? {coverageGroupId: requirement.coverageGroupId}
      : {}),
  };

  if (validateNaturalPath && Object.hasOwn(requirement, "naturalPath")) {
    if (requirementSchemaVersion !== 2) throw new Error("requirement.naturalPath is only allowed for schema v2");
    normalized.naturalPath = normalizeNaturalPath(requirement.naturalPath, frames, frameCount);
  }
  return normalized;
}

/**
 * Normalize the physical-frame selection declared by one coverage requirement.
 * Schema v1 remains intentionally limited to the legacy full-domain range.
 */
export function normalizeRequirementSelection(requirement, frameCount) {
  return deriveSelection(requirement, frameCount);
}

/** Return a fresh, strictly increasing list of the requirement's physical frames. */
export function selectedPhysicalFrames(requirement, frameCount) {
  return [...deriveSelection(requirement, frameCount).selectedPhysicalFrames];
}

/** Hash the canonical physical selection, independent of range/set representation. */
export function selectionSha256(requirement, frameCount) {
  return deriveSelection(requirement, frameCount, {
    validateDeclaredSelectionHash: false,
    validateNaturalPath: false,
  }).selectionSha256;
}

function frameCountForDomain(frameCountsByDomain, frameDomainId) {
  let frameCount;
  if (frameCountsByDomain instanceof Map) {
    frameCount = frameCountsByDomain.get(frameDomainId);
  } else {
    assertPlainObject(frameCountsByDomain, "frameCountsByDomain");
    if (Object.hasOwn(frameCountsByDomain, frameDomainId)) frameCount = frameCountsByDomain[frameDomainId];
  }
  if (frameCount === undefined) throw new Error(`frameCountsByDomain is missing ${frameDomainId}`);
  return assertPositiveInteger(frameCount, `frameCountsByDomain[${JSON.stringify(frameDomainId)}]`);
}

function normalizedRequirementGroup(requirement, index, frameCountsByDomain) {
  const label = `requirements[${index}]`;
  assertPlainObject(requirement, label);
  const requirementId = assertStableId(requirement.requirementId, `${label}.requirementId`);
  const frameDomainId = assertStableId(requirement.frameDomainId, `${label}.frameDomainId`);
  const scenario = assertStableId(requirement.scenario, `${label}.scenario`);
  const language = assertStableId(requirement.language, `${label}.language`);
  const seed = String(requirement.seed ?? "");
  assertStableId(seed, `${label}.seed`);
  const entryState = assertPlainObject(requirement.entryState, `${label}.entryState`);
  const entryStateSha256 = assertSha256(requirement.entryStateSha256, `${label}.entryStateSha256`);
  if (projectionSha256(entryState) !== entryStateSha256) {
    throw new Error(`${label}.entryStateSha256 does not match the canonical entryState`);
  }
  const frameCount = frameCountForDomain(frameCountsByDomain, frameDomainId);
  const selection = deriveSelection(requirement, frameCount);
  const legacySingleton = selection.requirementSchemaVersion === 1;
  const coverageGroupId = legacySingleton
    ? `legacy-singleton:${requirementId}`
    : selection.coverageGroupId;
  return {
    requirement,
    requirementId,
    frameDomainId,
    scenario,
    language,
    seed,
    entryState,
    entryStateSha256,
    frameCount,
    selection,
    legacySingleton,
    coverageGroupId,
  };
}

/**
 * Validate supplemental coverage groups independently from evidence adoption.
 * Schema-v2 members in one group must bind the same runtime identity and must
 * select disjoint physical frames. Legacy schema-v1 requirements intentionally
 * remain one-member singleton groups so existing canonical full requirements
 * can coexist with separately identified supplemental evidence.
 */
export function validateRequirementCoverageGroups(requirements, frameCountsByDomain) {
  if (!Array.isArray(requirements)) throw new Error("requirements must be an array");
  const requirementIds = new Set();
  const groups = new Map();

  for (const [index, requirement] of requirements.entries()) {
    const normalized = normalizedRequirementGroup(requirement, index, frameCountsByDomain);
    if (requirementIds.has(normalized.requirementId)) {
      throw new Error(`duplicate requirementId: ${normalized.requirementId}`);
    }
    requirementIds.add(normalized.requirementId);
    const identity = {
      frameDomainId: normalized.frameDomainId,
      scenario: normalized.scenario,
      language: normalized.language,
      seed: normalized.seed,
      entryStateSha256: normalized.entryStateSha256,
      entryState: normalized.entryState,
    };
    const identityJson = canonicalProjectionJson(identity);
    let group = groups.get(normalized.coverageGroupId);
    if (!group) {
      group = {
        coverageGroupId: normalized.coverageGroupId,
        requirementSchemaVersion: normalized.selection.requirementSchemaVersion,
        legacySingleton: normalized.legacySingleton,
        ...identity,
        identityJson,
        frameCount: normalized.frameCount,
        requirementIds: [],
        selectedPhysicalFrames: new Set(),
      };
      groups.set(normalized.coverageGroupId, group);
    } else {
      if (group.legacySingleton || normalized.legacySingleton) {
        throw new Error(`legacy coverage group ${normalized.coverageGroupId} must remain a singleton`);
      }
      if (
        group.requirementSchemaVersion !== normalized.selection.requirementSchemaVersion
        || group.frameCount !== normalized.frameCount
        || group.identityJson !== identityJson
      ) {
        throw new Error(
          `coverageGroupId ${normalized.coverageGroupId} must bind one exact frame-domain/scenario/language/seed/entry-state identity`,
        );
      }
    }
    for (const frame of normalized.selection.selectedPhysicalFrames) {
      if (group.selectedPhysicalFrames.has(frame)) {
        throw new Error(
          `coverageGroupId ${normalized.coverageGroupId} has overlapping physical frame ${frame}`,
        );
      }
      group.selectedPhysicalFrames.add(frame);
    }
    group.requirementIds.push(normalized.requirementId);
  }

  return [...groups.values()]
    .sort((left, right) => compareText(left.coverageGroupId, right.coverageGroupId))
    .map(({identityJson: _identityJson, selectedPhysicalFrames: frames, ...group}) => ({
      ...group,
      requirementIds: [...group.requirementIds].sort(compareText),
      selectedPhysicalFrames: [...frames].sort((left, right) => left - right),
    }));
}

/**
 * Recompute current-evidence physical-frame coverage per bound coverage group.
 * A requirement contributes only when its caller-owned evidence marker is
 * exactly true and its evidence status is exactly "complete". Requirement-level
 * captured/missing claims are deliberately ignored.
 */
export function computePhysicalFrameAggregates(
  requirements,
  frameCountsByDomain,
  {declaredAggregates} = {},
) {
  const validatedGroups = validateRequirementCoverageGroups(requirements, frameCountsByDomain);
  const normalizedById = new Map(requirements.map((requirement, index) => {
    const normalized = normalizedRequirementGroup(requirement, index, frameCountsByDomain);
    return [normalized.requirementId, normalized];
  }));
  const aggregates = validatedGroups.map((group) => {
      const covered = new Set();
      const contributingRequirementIds = [];
      for (const requirementId of group.requirementIds) {
        const normalized = normalizedById.get(requirementId);
        if (normalized.requirement.evidenceValid !== true || normalized.requirement.status !== "complete") continue;
        contributingRequirementIds.push(requirementId);
        for (const frame of normalized.selection.selectedPhysicalFrames) covered.add(frame);
      }
      const coveredFrames = [...covered].sort((left, right) => left - right);
      const missingFrames = rangeFrames(1, group.frameCount).filter((frame) => !covered.has(frame));
      return {
        coverageGroupId: group.coverageGroupId,
        requirementSchemaVersion: group.requirementSchemaVersion,
        legacySingleton: group.legacySingleton,
        frameDomainId: group.frameDomainId,
        scenario: group.scenario,
        language: group.language,
        seed: group.seed,
        entryStateSha256: group.entryStateSha256,
        requiredUniverse: {firstFrame: 1, lastFrame: group.frameCount},
        declaredRequirementIds: [...group.requirementIds],
        contributingRequirementIds,
        coveredFrameCount: coveredFrames.length,
        coveredFrames,
        missingFrames,
        status: missingFrames.length === 0 ? "complete" : "incomplete",
      };
    });

  if (declaredAggregates !== undefined) {
    if (!Array.isArray(declaredAggregates)) throw new Error("declaredAggregates must be an array");
    if (canonicalProjectionJson(declaredAggregates) !== canonicalProjectionJson(aggregates)) {
      throw new Error("declaredAggregates do not canonically equal the independently computed aggregates");
    }
  }
  return aggregates;
}
