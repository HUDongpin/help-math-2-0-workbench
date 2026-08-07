import assert from "node:assert/strict";
import test from "node:test";

import {
  G4_L10_RELEASE_ID,
  SOURCE_PROVEN_RELEASE_CONTRACTS,
  assertExactSourceProofCensus,
  canonicalPairSet,
  materializeLessonReleaseSourceProvenFrameDomainDispositions,
  parseArguments,
} from "./materialize-lesson-release-source-proven-frame-domain-dispositions.mjs";
import {
  materializeG4L10IndependentFrameDomainDeclarations,
} from "./materialize-g4-l10-independent-frame-domain-declarations.mjs";
import {
  materializeG4L10PostDeclarationStaticComposites,
} from "./materialize-g4-l10-post-declaration-static-composites.mjs";

test("requires one exact release and one explicit execution mode", () => {
  assert.deepEqual(
    parseArguments([
      "--release-id",
      G4_L10_RELEASE_ID,
      "--check",
    ]),
    {
      help: false,
      mode: "check",
      releaseId: G4_L10_RELEASE_ID,
    },
  );
  assert.deepEqual(parseArguments(["--help"]), {
    help: true,
    mode: "",
    releaseId: "",
  });
  assert.throws(() => parseArguments([]), /--release-id is required/);
  assert.throws(
    () => parseArguments(["--release-id", G4_L10_RELEASE_ID]),
    /choose exactly one execution mode/,
  );
  assert.throws(
    () => parseArguments([
      "--release-id",
      G4_L10_RELEASE_ID,
      "--apply",
      "--check",
    ]),
    /choose exactly one execution mode/,
  );
  assert.throws(
    () => parseArguments([
      "--release-id",
      G4_L10_RELEASE_ID,
      "--dry-run",
      "--id",
      "course-g04-l10-ir-001",
    ]),
    /Unknown option: --id/,
  );
});

test("canonical pair sets bind identities, not only counts", () => {
  const left = canonicalPairSet([
    {animationId: "b", timelineId: "sprite-2"},
    {animationId: "a", timelineId: "sprite-9"},
  ]);
  const reordered = canonicalPairSet([
    {animationId: "a", timelineId: "sprite-9"},
    {animationId: "b", timelineId: "sprite-2"},
  ]);
  const swapped = canonicalPairSet([
    {animationId: "a", timelineId: "sprite-8"},
    {animationId: "b", timelineId: "sprite-2"},
  ]);
  assert.deepEqual(left, reordered);
  assert.equal(left.count, 2);
  assert.notEqual(left.sha256, swapped.sha256);
  assert.equal(
    canonicalPairSet([]).sha256,
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
  assert.throws(
    () => canonicalPairSet([
      {animationId: "a", timelineId: "sprite-1"},
      {animationId: "a", timelineId: "sprite-1"},
    ]),
    /duplicates/,
  );
});

test("the pinned census fails closed on count, pair-set, or multi-frame broadening", () => {
  const expected =
    SOURCE_PROVEN_RELEASE_CONTRACTS[G4_L10_RELEASE_ID].expected;
  const aggregate = {
    totals: {
      members: expected.members,
      declaredRoots: expected.declaredRoots,
      reachableChildren: expected.reachableChildren,
      oneFrameChildren: expected.oneFrameChildren,
      acceptedSingleFrameChildren: expected.acceptedSingleFrameChildren,
      disqualifiedSingleFrameChildren:
        expected.disqualifiedSingleFrameChildren,
      multiFrameChildren: expected.multiFrameChildren,
      acceptedMultiFrameChildren: expected.acceptedMultiFrameChildren,
      sourceProvenIndependentRequiredChildren:
        expected.sourceProvenIndependentRequiredChildren,
      wave2UnresolvedChildren: expected.wave2UnresolvedChildren,
      excludedNotProvenDefinitions: expected.excludedNotProvenDefinitions,
      membersWithAcceptedClaims: expected.membersWithAcceptedClaims,
      membersWithIndependentRequiredClaims:
        expected.membersWithIndependentRequiredClaims,
    },
    pairSets: {
      eligibleSingleFrame: {
        sha256: expected.eligibleSingleFramePairSetSha256,
      },
      disqualifiedSingleFrame: {
        sha256: expected.disqualifiedSingleFramePairSetSha256,
      },
      multiFrame: {sha256: expected.multiFramePairSetSha256},
      acceptedMultiFrame: {
        sha256: expected.acceptedMultiFramePairSetSha256,
      },
      sourceProvenIndependentRequired: {
        sha256: expected.sourceProvenIndependentRequiredPairSetSha256,
      },
      wave2Rejected: {
        sha256: expected.wave2RejectedPairSetSha256,
      },
      excludedNotProven: {
        sha256: expected.excludedNotProvenPairSetSha256,
      },
    },
  };
  assert.equal(assertExactSourceProofCensus(aggregate, expected), true);
  assert.throws(
    () => assertExactSourceProofCensus({
      ...aggregate,
      totals: {
        ...aggregate.totals,
        acceptedSingleFrameChildren:
          aggregate.totals.acceptedSingleFrameChildren - 1,
      },
    }, expected),
    /acceptedSingleFrameChildren drifted/,
  );
  assert.throws(
    () => assertExactSourceProofCensus({
      ...aggregate,
      pairSets: {
        ...aggregate.pairSets,
        eligibleSingleFrame: {sha256: "0".repeat(64)},
      },
    }, expected),
    /eligibleSingleFrame exact pair set drifted/,
  );
  assert.throws(
    () => assertExactSourceProofCensus({
      ...aggregate,
      totals: {
        ...aggregate.totals,
        acceptedMultiFrameChildren: 1,
      },
    }, {...expected, acceptedMultiFrameChildren: 1}),
    /multi-frame domains require a separately pinned parent-clock contract/,
  );
});

test("live L10 verifies the exact wave3 successor or its immutable declaration predecessor", async () => {
  const wave3 =
    await materializeG4L10PostDeclarationStaticComposites({
      mode: "dry-run",
    });
  if (wave3.inputState === "wave3-successor") {
    assert.equal(wave3.action, "verified-plan");
    assert.equal(wave3.report.exactPairSets.accepted.count, 3);
    assert.equal(
      wave3.report.exactPairSets.accepted.sha256,
      "f65d4dabb98ad5f4a175bafd03c591edd86f1b11247c01b47375723fef1e22f7",
    );
    assert.deepEqual(wave3.report.summary.afterDispositionTotals, {
      declared: 260,
      composite: 754,
      independentRequired: 0,
      unresolved: 74,
      nonvisual: 0,
      excludedNotProven: 210,
    });
    assert.match(wave3.report.strictAcceptanceEffect, /^none;/);
    return;
  }
  const successor =
    await materializeG4L10IndependentFrameDomainDeclarations({
      mode: "dry-run",
    });
  if (successor.inputState === "declared-successor") {
    assert.equal(successor.action, "verified-plan");
    assert.equal(successor.report.exactPairSet.count, 213);
    assert.equal(
      successor.report.exactPairSet.sha256,
      "32bd3115ff796d2905eb8f83b9860717f9022b43d2295a1bba8ce1d2adbc4c1f",
    );
    assert.deepEqual(successor.report.summary.afterDispositionTotals, {
      declared: 260,
      composite: 751,
      independentRequired: 0,
      unresolved: 77,
      nonvisual: 0,
      excludedNotProven: 210,
    });
    assert.match(successor.report.strictAcceptanceEffect, /^none;/);
    return;
  }
  const result = await materializeLessonReleaseSourceProvenFrameDomainDispositions({
    releaseId: G4_L10_RELEASE_ID,
    mode: "dry-run",
  });
  assert.equal(result.action, "planned");
  assert.equal(result.evidenceCount, 46);
  assert.deepEqual(result.totals, {
    declaredRoots: 47,
    composites: 751,
    independentRequired: 213,
    nonvisual: 0,
    unresolved: 77,
    excludedNotProven: 210,
  });
  assert.equal(
    result.report.exactPairSets.eligibleSingleFrame.sha256,
    "41bc1f1c765553e6e6f2a2c123b0d89aa666ce90b5402d13212e00bc8744e1c0",
  );
  assert.equal(result.report.summary.acceptedMultiFrameChildren, 0);
  assert.equal(
    result.report.summary.sourceProvenIndependentRequiredChildren,
    213,
  );
  assert.equal(result.report.summary.wave2UnresolvedChildren, 77);
  assert.match(
    result.report.proofPolicy.multiFramePolicy,
    /Of 249 source multi-frame timelines, 213 are separately classified independent-required.*36 remain unresolved.*41 scripted one-frame timelines remain unresolved separately/,
  );
  assert.equal(result.wave2Report.summary.remainingBefore, 290);
  assert.equal(result.wave2Report.summary.independentRequired, 213);
  assert.equal(result.wave2Report.summary.unresolvedAfter, 77);
  assert.equal(
    result.wave2Report.exactPairSets.accepted.sha256,
    "32bd3115ff796d2905eb8f83b9860717f9022b43d2295a1bba8ce1d2adbc4c1f",
  );
  assert.equal(
    result.wave2Report.exactPairSets.rejected.sha256,
    "e796abfd334b8c92971f26e7ff35e2706b88e382964221623c63636afcf5f76e",
  );
  assert.equal(
    result.report.members.flatMap(
      ({multiFrameTimelines}) => multiFrameTimelines,
    ).every(({eligible}) => eligible === false),
    true,
  );
  assert.deepEqual(result.report.acceptanceBoundary, {
    runtimeEvidenceEstablished: false,
    visualFidelityEstablished: false,
    behaviorEstablished: false,
    audioEstablished: false,
    fullFrameRmseEstablished: false,
    humanReviewEstablished: false,
    ownerAcceptanceEstablished: false,
    strictCompletionEstablished: false,
    releasePublicationEstablished: false,
  });
  assert.match(result.report.strictAcceptanceEffect, /^none;/);
});

test("the current L10 package checker verifies wave3 while preserving d961 as its immutable predecessor", async () => {
  const result =
    await materializeG4L10PostDeclarationStaticComposites({
      mode: "check",
    });
  assert.equal(result.action, "verified");
  assert.deepEqual(result.report.summary.afterDispositionTotals, {
    declared: 260,
    composite: 754,
    independentRequired: 0,
    unresolved: 74,
    nonvisual: 0,
    excludedNotProven: 210,
  });
  assert.equal(
    result.report.generatedFrom.immutableDeclarationReceipt.sha256,
    "d961ff2401d01740a6dc04b6084d3849f2cac1f729b43b3fe40565a7a7a15e20",
  );
});
