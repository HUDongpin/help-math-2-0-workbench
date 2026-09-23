import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCandidateProbeRequests,
  buildG5L4RendererSupport,
  classifyG5L4ReleaseMembers,
  G5_L4_MEMBER_CLASSES,
  parseArguments,
  validateG5L4RendererIndex,
} from "./build-g5-l4-renderer-frame-domain-support.mjs";

test("G5 L4 renderer wrapper accepts only deterministic check mode", () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(["--check"]), {check: true});
  assert.throws(() => parseArguments(["--write-anywhere"]), /Unknown option/);
});

test("G5 L4 release classification fixes 51 single sprites and four special members", () => {
  const ids = [
    ...Array.from({length: 51}, (_, index) => `member-${index + 1}`),
    "course-g05-l04-fq-001",
    "course-g05-l04-fq-002",
    "course-g05-l04-fq-003",
    "shell-course-g05-l04-index-local",
  ];
  const release = {
    releaseId: "lesson-g05-l04-number-lines",
    publicationMode: "atomic",
    members: ids.map((animationId, index) => ({
      ordinal: index + 1,
      animationId,
    })),
  };
  const classified = classifyG5L4ReleaseMembers(release);
  assert.equal(classified.length, 55);
  assert.equal(
    classified.filter(
      ({memberClass}) =>
        memberClass === G5_L4_MEMBER_CLASSES.singleSprite,
    ).length,
    51,
  );
  assert.deepEqual(
    classified.slice(-4).map(
      ({memberClass, canonicalRendererRuntimeUnavailable}) => [
        memberClass,
        canonicalRendererRuntimeUnavailable,
      ],
    ),
    [
      [G5_L4_MEMBER_CLASSES.fq001, false],
      [G5_L4_MEMBER_CLASSES.fq002, true],
      [G5_L4_MEMBER_CLASSES.fq003, true],
      [G5_L4_MEMBER_CLASSES.shell, true],
    ],
  );
});

test("candidate probes cover first and last frames without inventing companion frames", () => {
  const requests = buildCandidateProbeRequests([
    {id: "root", frameCount: 10, scenario: "root-unavailable"},
    {
      id: "sprite-145",
      frameCount: 52,
      scenario: "source-static-composite-prefix",
    },
    {
      id: "sprite-100",
      frameCount: 1,
      scenario: "sprite-100-standalone-unavailable",
    },
  ]);
  assert.equal(requests.length, 10);
  assert.deepEqual(
    requests.filter(({frameDomain}) => frameDomain === "sprite-100"),
    [
      {
        requestId:
          "sprite-100::sprite-100-standalone-unavailable::en::1",
        frameDomain: "sprite-100",
        frame: 1,
        scenario: "sprite-100-standalone-unavailable",
        language: "en",
        seed: 0,
      },
      {
        requestId:
          "sprite-100::sprite-100-standalone-unavailable::es::1",
        frameDomain: "sprite-100",
        frame: 1,
        scenario: "sprite-100-standalone-unavailable",
        language: "es",
        seed: 0,
      },
    ],
  );
});

test("55-member index rejects canonical-runtime fabrication or acceptance effects", () => {
  const ids = Array.from({length: 55}, (_, index) => `member-${index + 1}`);
  const classes = [
    ...Array(51).fill(G5_L4_MEMBER_CLASSES.singleSprite),
    G5_L4_MEMBER_CLASSES.fq001,
    G5_L4_MEMBER_CLASSES.fq002,
    G5_L4_MEMBER_CLASSES.fq003,
    G5_L4_MEMBER_CLASSES.shell,
  ];
  const index = {
    schemaVersion: 1,
    evidenceType: "g5-l4-release-renderer-frame-domain-support-index",
    releaseId: "lesson-g05-l04-number-lines",
    scope: "all-55-release-members",
    status: "renderer-frame-domain-support-incomplete",
    memberCount: 55,
    classCounts: Object.fromEntries(
      Object.values(G5_L4_MEMBER_CLASSES).map((memberClass) => [
        memberClass,
        classes.filter((value) => value === memberClass).length,
      ]),
    ),
    summary: {
      canonicalMigrationRendererBindingCount: 51,
      candidateMaturityRendererBindingCount: 1,
      productOnlyRendererBindingCount: 2,
      structuralOnlyMemberCount: 1,
      deterministicPureRendererAuditedMemberCount: 54,
      singleSpriteEndpointProfiles: {
        full: 20,
        safePrefix: 31,
      },
      canonicalRendererRuntimeUnavailableCount: 3,
      canonicalRendererRuntimeUnavailableMembers: [
        "course-g05-l04-fq-002",
        "course-g05-l04-fq-003",
        "shell-course-g05-l04-index-local",
      ],
      probeCount: 434,
      renderableCount: 77,
      blockedCount: 357,
      fullyRenderableMemberCount: 0,
    },
    members: ids.map((animationId, index) => ({
      animationId,
      memberClass: classes[index],
    })),
    acceptanceBoundary: {
      authoritativeOriginalRuntime: false,
      naturalRuntimeReachabilityComplete: false,
      fullFrameComparisonComplete: false,
      audioAccepted: false,
      humanVisualReviewAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      published: false,
    },
    strictAcceptanceEffect: "none; fixture",
  };
  assert.equal(
    validateG5L4RendererIndex(index, ids)
      .canonicalRendererRuntimeUnavailableCount,
    3,
  );
  index.summary.canonicalRendererRuntimeUnavailableCount = 2;
  assert.throws(
    () => validateG5L4RendererIndex(index, ids),
    /aggregate or no-fabrication boundary drifted/,
  );
  index.summary.canonicalRendererRuntimeUnavailableCount = 3;
  index.acceptanceBoundary.ownerAccepted = true;
  assert.throws(
    () => validateG5L4RendererIndex(index, ids),
    /acceptance or publication effect/,
  );
});

test("checked-in G5 L4 renderer audit is deterministic across all 55 members", async () => {
  const {index} = await buildG5L4RendererSupport({check: true});
  assert.equal(index.memberCount, 55);
  assert.equal(index.summary.deterministicPureRendererAuditedMemberCount, 54);
  assert.equal(index.summary.canonicalRendererRuntimeUnavailableCount, 3);
  assert.equal(index.summary.fullyRenderableMemberCount, 0);
  assert.equal(
    Object.values(index.acceptanceBoundary).every((value) => value === false),
    true,
  );
});
