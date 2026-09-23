import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalProjectionJson,
  projectionSha256,
} from "./evidence-projections.mjs";
import {
  computePhysicalFrameAggregates,
  normalizeRequirementSelection,
  selectedPhysicalFrames,
  selectionSha256,
  validateRequirementCoverageGroups,
} from "./lib/trace-frame-selection.mjs";

function withSelectionHash(requirement, frameCount) {
  return {
    ...requirement,
    selectionSha256: selectionSha256(requirement, frameCount),
  };
}

function v2Set(frames, coverageRole, overrides = {}, frameCount = 5) {
  const requirement = {
    requirementSchemaVersion: 2,
    coverageRole,
    coverageGroupId: "coverage-group:test",
    requiredFrameSet: {frames},
    ...overrides,
  };
  return withSelectionHash(requirement, frameCount);
}

function aggregateRequirement({
  requirementId,
  frameDomainId = "root",
  language = "en",
  frames,
  evidenceValid = true,
  status = "complete",
  coverageGroupId = `coverage-group:${frameDomainId}:default:${language}:seed-0`,
}) {
  const entryState = {
    kind: "fixture-entry",
    frameDomainId,
    scenario: "default",
    language,
    seed: "0",
  };
  return {
    requirementId,
    frameDomainId,
    language,
    scenario: "default",
    seed: "0",
    entryState,
    entryStateSha256: projectionSha256(entryState),
    evidenceValid,
    status,
    capturedFrameCount: 999,
    missingFrames: [],
    ...v2Set(frames, frames.length === 5 ? "full-domain" : "partial-path", {coverageGroupId}),
  };
}

test("schema v1 defaults to the legacy full-domain range", () => {
  const requirement = {requiredRange: {firstFrame: 1, lastFrame: 4}};
  const normalized = normalizeRequirementSelection(requirement, 4);

  assert.deepEqual(normalized, {
    requirementSchemaVersion: 1,
    selectionKind: "required-range",
    coverageRole: "full-domain",
    requiredUniverse: {firstFrame: 1, lastFrame: 4},
    selectedPhysicalFrames: [1, 2, 3, 4],
    selectionSha256: projectionSha256({
      schemaVersion: 1,
      requiredUniverse: {firstFrame: 1, lastFrame: 4},
      selectedPhysicalFrames: [1, 2, 3, 4],
    }),
  });
  assert.deepEqual(selectedPhysicalFrames(requirement, 4), [1, 2, 3, 4]);
  assert.equal(selectionSha256(requirement, 4), normalized.selectionSha256);
});

test("schema v1 rejects partial ranges, frame sets, and mismatched roles", () => {
  assert.throws(
    () => normalizeRequirementSelection({requiredRange: {firstFrame: 1, lastFrame: 3}}, 4),
    /only supports the full/,
  );
  assert.throws(
    () => normalizeRequirementSelection({requiredFrameSet: {frames: [1, 2, 3, 4]}}, 4),
    /schema v1 requires requiredRange/,
  );
  assert.throws(
    () => normalizeRequirementSelection({requiredRange: {firstFrame: 1, lastFrame: 4}, coverageRole: "partial-path"}, 4),
    /coverageRole must be full-domain/,
  );
  assert.throws(
    () => normalizeRequirementSelection({
      requiredRange: {firstFrame: 1, lastFrame: 4},
      coverageGroupId: "not-legacy-compatible",
    }, 4),
    /only allowed for schema v2/,
  );
});

test("schema v2 accepts exactly one bounded selection and verifies its coverage role", () => {
  const partialRange = normalizeRequirementSelection({
    requirementSchemaVersion: 2,
    coverageRole: "partial-path",
    coverageGroupId: "coverage-group:test",
    requiredRange: {firstFrame: 2, lastFrame: 4},
    selectionSha256: selectionSha256({
      requirementSchemaVersion: 2,
      coverageRole: "partial-path",
      coverageGroupId: "coverage-group:test",
      requiredRange: {firstFrame: 2, lastFrame: 4},
    }, 5),
  }, 5);
  assert.equal(partialRange.selectionKind, "required-range");
  assert.deepEqual(partialRange.selectedPhysicalFrames, [2, 3, 4]);

  const fullSet = normalizeRequirementSelection(v2Set([1, 2, 3, 4, 5], "full-domain"), 5);
  assert.equal(fullSet.selectionKind, "required-frame-set");
  assert.deepEqual(fullSet.selectedPhysicalFrames, [1, 2, 3, 4, 5]);

  assert.throws(() => normalizeRequirementSelection({
    requirementSchemaVersion: 2,
    coverageRole: "full-domain",
    coverageGroupId: "coverage-group:test",
    requiredRange: {firstFrame: 1, lastFrame: 5},
    requiredFrameSet: {frames: [1, 2, 3, 4, 5]},
  }, 5), /exactly one/);
  assert.throws(() => normalizeRequirementSelection({
    requirementSchemaVersion: 2,
    coverageRole: "partial-path",
    coverageGroupId: "coverage-group:test",
  }, 5), /exactly one/);
  assert.throws(
    () => normalizeRequirementSelection(v2Set([1, 2, 3, 4, 5], "partial-path"), 5),
    /coverageRole must be full-domain/,
  );
  assert.throws(
    () => normalizeRequirementSelection(v2Set([1, 3], undefined), 5),
    /coverageRole must be/,
  );
  const missingGroup = {
    requirementSchemaVersion: 2,
    coverageRole: "partial-path",
    requiredRange: {firstFrame: 1, lastFrame: 2},
  };
  missingGroup.selectionSha256 = selectionSha256(missingGroup, 5);
  assert.throws(
    () => normalizeRequirementSelection(missingGroup, 5),
    /coverageGroupId must be a non-empty string/,
  );
});

test("schema v2 frame sets are non-empty, bounded, integral, unique, and strictly increasing", () => {
  assert.throws(() => normalizeRequirementSelection(v2Set([], "partial-path"), 5), /non-empty/);
  assert.throws(() => normalizeRequirementSelection(v2Set([1, 1], "partial-path"), 5), /strictly increasing/);
  assert.throws(() => normalizeRequirementSelection(v2Set([2, 1], "partial-path"), 5), /strictly increasing/);
  assert.throws(() => normalizeRequirementSelection(v2Set([1, 6], "partial-path"), 5), /exceeds frameCount/);
  assert.throws(() => normalizeRequirementSelection(v2Set([1, 2.5], "partial-path"), 5), /positive integer/);
  assert.throws(() => normalizeRequirementSelection({
    requirementSchemaVersion: 2,
    coverageRole: "partial-path",
    requiredRange: {firstFrame: 4, lastFrame: 3},
  }, 5), /must not exceed/);
});

test("natural paths retain repeated ordered outcomes while projecting exactly onto physical selection", () => {
  const orderedVisits = [
    {order: 1, frame: 1},
    {order: 2, frame: 3, outcomeId: "wrong-a"},
    {order: 3, frame: 1, outcomeId: "retry"},
    {order: 4, frame: 5, outcomeId: "correct"},
    {order: 5, frame: 3, outcomeId: "review"},
  ];
  const requirement = v2Set([1, 3, 5], "partial-path", {
    naturalPath: {
      orderedVisits,
      orderedVisitsSha256: projectionSha256(orderedVisits),
    },
  });
  const normalized = normalizeRequirementSelection(requirement, 5);

  assert.deepEqual(normalized.naturalPath.orderedVisits, orderedVisits);
  assert.equal(normalized.naturalPath.orderedVisitsSha256, projectionSha256(orderedVisits));
  assert.equal(
    canonicalProjectionJson(normalized.naturalPath.orderedVisits),
    canonicalProjectionJson(orderedVisits),
  );

  const wrongProjection = structuredClone(requirement);
  wrongProjection.requiredFrameSet.frames = [1, 3, 4, 5];
  wrongProjection.selectionSha256 = selectionSha256(wrongProjection, 5);
  assert.throws(() => normalizeRequirementSelection(wrongProjection, 5), /unique physical-frame projection/);

  const wrongHash = structuredClone(requirement);
  wrongHash.naturalPath.orderedVisitsSha256 = "0".repeat(64);
  assert.throws(() => normalizeRequirementSelection(wrongHash, 5), /does not match orderedVisits/);

  const wrongOrder = structuredClone(requirement);
  wrongOrder.naturalPath.orderedVisits[1].order = 3;
  wrongOrder.naturalPath.orderedVisitsSha256 = projectionSha256(wrongOrder.naturalPath.orderedVisits);
  assert.throws(() => normalizeRequirementSelection(wrongOrder, 5), /contiguous one-based/);
});

test("physical selection hashes normalize equivalent range and set representations", () => {
  const range = {
    requirementSchemaVersion: 2,
    coverageRole: "full-domain",
    requiredRange: {firstFrame: 1, lastFrame: 3},
  };
  const set = v2Set([1, 2, 3], "full-domain", {}, 3);
  assert.equal(selectionSha256(range, 3), selectionSha256(set, 3));
});

test("schema v2 requires an exact lowercase selection hash while the builder helper stays pure", () => {
  const unsigned = {
    requirementSchemaVersion: 2,
    coverageRole: "partial-path",
    coverageGroupId: "coverage-group:test",
    requiredFrameSet: {frames: [1, 3]},
  };
  const candidate = selectionSha256(unsigned, 5);
  assert.match(candidate, /^[a-f0-9]{64}$/);
  assert.throws(() => normalizeRequirementSelection(unsigned, 5), /selectionSha256 must be a lowercase SHA-256/);

  const stale = {...unsigned, selectionSha256: "0".repeat(64)};
  assert.equal(selectionSha256(stale, 5), candidate);
  assert.throws(() => normalizeRequirementSelection(stale, 5), /does not match the canonical physical selection/);

  const uppercase = {...unsigned, selectionSha256: candidate.toUpperCase()};
  assert.equal(selectionSha256(uppercase, 5), candidate);
  assert.throws(() => normalizeRequirementSelection(uppercase, 5), /lowercase SHA-256/);
});

test("naturalPath is v2-only and rejects unknown container fields", () => {
  const orderedVisits = [{order: 1, frame: 1}, {order: 2, frame: 2}];
  const naturalPath = {
    orderedVisits,
    orderedVisitsSha256: projectionSha256(orderedVisits),
  };
  assert.throws(() => normalizeRequirementSelection({
    requiredRange: {firstFrame: 1, lastFrame: 2},
    naturalPath,
  }, 2), /only allowed for schema v2/);

  const requirement = v2Set([1, 2], "partial-path", {
    naturalPath: {...naturalPath, hiddenSemanticOverride: "not-bound"},
  });
  assert.throws(() => normalizeRequirementSelection(requirement, 5), /hiddenSemanticOverride is not allowed/);
});

test("aggregates union only caller-validated complete evidence and independently recompute gaps", () => {
  const requirements = [
    aggregateRequirement({requirementId: "req-a", frames: [1, 3]}),
    aggregateRequirement({requirementId: "req-b", frames: [2, 4], status: "blocked"}),
    aggregateRequirement({requirementId: "req-c", frames: [5], evidenceValid: false}),
    aggregateRequirement({requirementId: "req-es", language: "es", frames: [1, 2, 3, 4, 5], evidenceValid: "true"}),
  ];
  const aggregates = computePhysicalFrameAggregates(requirements, {root: 5});

  assert.deepEqual(aggregates, [
    {
      coverageGroupId: "coverage-group:root:default:en:seed-0",
      requirementSchemaVersion: 2,
      legacySingleton: false,
      frameDomainId: "root",
      scenario: "default",
      language: "en",
      seed: "0",
      entryStateSha256: requirements[0].entryStateSha256,
      requiredUniverse: {firstFrame: 1, lastFrame: 5},
      declaredRequirementIds: ["req-a", "req-b", "req-c"],
      contributingRequirementIds: ["req-a"],
      coveredFrameCount: 2,
      coveredFrames: [1, 3],
      missingFrames: [2, 4, 5],
      status: "incomplete",
    },
    {
      coverageGroupId: "coverage-group:root:default:es:seed-0",
      requirementSchemaVersion: 2,
      legacySingleton: false,
      frameDomainId: "root",
      scenario: "default",
      language: "es",
      seed: "0",
      entryStateSha256: requirements[3].entryStateSha256,
      requiredUniverse: {firstFrame: 1, lastFrame: 5},
      declaredRequirementIds: ["req-es"],
      contributingRequirementIds: [],
      coveredFrameCount: 0,
      coveredFrames: [],
      missingFrames: [1, 2, 3, 4, 5],
      status: "incomplete",
    },
  ]);
});

test("aggregates become complete through union coverage and canonical-check declarations", () => {
  const requirements = [
    aggregateRequirement({requirementId: "req-z", frameDomainId: "sprite-7", frames: [4, 5]}),
    aggregateRequirement({requirementId: "req-a", frameDomainId: "sprite-7", frames: [1, 2, 3]}),
  ];
  const expected = [{
    coverageGroupId: "coverage-group:sprite-7:default:en:seed-0",
    requirementSchemaVersion: 2,
    legacySingleton: false,
    frameDomainId: "sprite-7",
    scenario: "default",
    language: "en",
    seed: "0",
    entryStateSha256: requirements[0].entryStateSha256,
    requiredUniverse: {firstFrame: 1, lastFrame: 5},
    declaredRequirementIds: ["req-a", "req-z"],
    contributingRequirementIds: ["req-a", "req-z"],
    coveredFrameCount: 5,
    coveredFrames: [1, 2, 3, 4, 5],
    missingFrames: [],
    status: "complete",
  }];

  assert.deepEqual(
    computePhysicalFrameAggregates(requirements, new Map([["sprite-7", 5]]), {declaredAggregates: expected}),
    expected,
  );

  const stale = structuredClone(expected);
  stale[0].missingFrames = [5];
  assert.throws(
    () => computePhysicalFrameAggregates(requirements, {"sprite-7": 5}, {declaredAggregates: stale}),
    /do not canonically equal/,
  );
});

test("aggregate validation fails closed on duplicate identities and missing domain counts", () => {
  const requirement = aggregateRequirement({requirementId: "duplicate", frames: [1, 2, 3, 4, 5]});
  assert.throws(
    () => computePhysicalFrameAggregates([requirement, structuredClone(requirement)], {root: 5}),
    /duplicate requirementId/,
  );
  assert.throws(
    () => computePhysicalFrameAggregates([requirement], {}),
    /missing root/,
  );
});

test("coverage groups bind one runtime identity, reject overlap, and keep legacy requirements singleton", () => {
  const left = aggregateRequirement({requirementId: "req-left", frames: [1, 2]});
  const right = aggregateRequirement({requirementId: "req-right", frames: [3, 4, 5]});
  const groups = validateRequirementCoverageGroups([left, right], {root: 5});
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].requirementIds, ["req-left", "req-right"]);
  assert.deepEqual(groups[0].selectedPhysicalFrames, [1, 2, 3, 4, 5]);

  const overlap = aggregateRequirement({requirementId: "req-overlap", frames: [2, 5]});
  assert.throws(
    () => validateRequirementCoverageGroups([left, overlap], {root: 5}),
    /overlapping physical frame 2/,
  );

  const mismatched = aggregateRequirement({
    requirementId: "req-mismatch",
    language: "es",
    frames: [3],
    coverageGroupId: left.coverageGroupId,
  });
  assert.throws(
    () => validateRequirementCoverageGroups([left, mismatched], {root: 5}),
    /must bind one exact/,
  );

  const legacy = (requirementId) => {
    const entryState = {
      kind: "fixture-entry",
      frameDomainId: "root",
      scenario: "default",
      language: "en",
      seed: "0",
    };
    return {
      requirementId,
      frameDomainId: "root",
      scenario: "default",
      language: "en",
      seed: "0",
      entryState,
      entryStateSha256: projectionSha256(entryState),
      requiredRange: {firstFrame: 1, lastFrame: 5},
    };
  };
  const legacyGroups = validateRequirementCoverageGroups(
    [legacy("legacy-a"), legacy("legacy-b")],
    {root: 5},
  );
  assert.deepEqual(
    legacyGroups.map(({coverageGroupId, legacySingleton}) => ({coverageGroupId, legacySingleton})),
    [
      {coverageGroupId: "legacy-singleton:legacy-a", legacySingleton: true},
      {coverageGroupId: "legacy-singleton:legacy-b", legacySingleton: true},
    ],
  );
});
