import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  buildReport,
  deriveStaticFacts,
  parseArguments,
  renderMarkdown,
  selectCalibrationSet,
  selectRelease,
  stableJson,
} from "./build-lesson-risk-calibration.mjs";

const digest = "a".repeat(64);

function releaseFixture() {
  return {
    schemaVersion: 1,
    releases: [{
      releaseId: "lesson-test",
      publicationMode: "atomic",
      expectedCounts: {members: 2},
      members: [
        {ordinal: 1, animationId: "page-1", assetId: "swf-1", source: {sha256: digest}},
        {ordinal: 2, animationId: "shell-1", assetId: "swf-2", source: {sha256: "b".repeat(64)}},
      ],
    }],
  };
}

function calibrationFixture() {
  return {
    schemaVersion: 1,
    calibrationSets: [{
      releaseId: "lesson-test",
      members: [
        {animationId: "page-1", intendedAxes: ["nested"]},
        {animationId: "shell-1", intendedAxes: ["host"]},
      ],
      humanWorkStudy: {
        memberAnimationIds: ["shell-1"],
        requiredPhases: ["audit", "implementation"],
        measurementRule: "Human times only.",
      },
    }],
  };
}

function machineFixture() {
  return {
    animationId: "page-1",
    migrationStatusUnchanged: true,
    source: {expectedSha256: digest, hashMatches: true},
    authoringSource: {pairedFlaStatus: "missing", inspectionStatus: "missing-source"},
    findings: {
      ffdecHeader: {widthPx: 800, heightPx: 600, frameRate: 12},
      exportedScriptFileCount: 2,
      externalCallCandidates: [{api: "getURL", occurrences: 1}],
      swfmill: {
        tagCounts: {
          BranchIfTrue: 3,
          Random: 1,
          DefineButton2: 2,
          PlaceObject2: 4,
          RemoveObject2: 1,
          DefineSound: 1,
          SoundStreamBlock: 8,
        },
        categories: {
          scriptTags: {DoAction: 2},
          morphDefinitions: {},
          filterTags: {},
          fontDefinitions: {DefineFont2: 1},
        },
      },
    },
  };
}

function domainsFixture() {
  return {
    animationId: "page-1",
    source: {sha256: digest},
    root: {timelineId: "root", frameCount: 10},
    nestedDefinitions: [
      {timelineId: "sprite-1", frameCount: 1},
      {timelineId: "sprite-2", frameCount: 20},
    ],
    summary: {
      completeRootReachableDomainInventory: false,
      unresolvedReachabilityCount: 2,
    },
    acceptanceEffects: {strictComplete: false, published: false},
  };
}

test("release and calibration selection require exact unique in-release membership", () => {
  const release = selectRelease(releaseFixture(), "lesson-test");
  const calibration = selectCalibrationSet(calibrationFixture(), release);
  assert.equal(calibration.members.length, 2);

  const duplicateRelease = releaseFixture();
  duplicateRelease.releases.push(structuredClone(duplicateRelease.releases[0]));
  assert.throws(() => selectRelease(duplicateRelease, "lesson-test"), /exactly one release/);

  const outside = calibrationFixture();
  outside.calibrationSets[0].members[0].animationId = "not-a-member";
  assert.throws(() => selectCalibrationSet(outside, release), /nonmember/);
});

test("static facts preserve root and nested domains without promoting reachability", () => {
  const release = selectRelease(releaseFixture(), "lesson-test");
  const item = deriveStaticFacts({
    member: release.members[0],
    calibrationMember: {
      animationId: "page-1",
      intendedAxes: ["nested"],
      workStudySelected: true,
      requiredPhases: ["audit", "implementation"],
    },
    machineReport: machineFixture(),
    frameDomains: domainsFixture(),
  });
  assert.equal(item.staticFacts.rootFrameCount, 10);
  assert.equal(item.staticFacts.nestedDefinitionCount, 2);
  assert.equal(item.staticFacts.nestedLongerThanRootCount, 1);
  assert.equal(item.staticFacts.maxNestedFrameCount, 20);
  assert.equal(item.staticFacts.randomOpcodeCount, 1);
  assert.equal(item.staticRiskSignals.unresolvedNestedReachability, true);
  assert.equal(item.readiness.implementationAuthorizedByThisReport, false);
  assert.deepEqual(item.workStudy.phases.map(({actualMinutes}) => actualMinutes), [null, null]);

  const promoted = domainsFixture();
  promoted.summary.completeRootReachableDomainInventory = true;
  assert.throws(() => deriveStaticFacts({
    member: release.members[0],
    calibrationMember: {intendedAxes: ["nested"], workStudySelected: false, requiredPhases: []},
    machineReport: machineFixture(),
    frameDomains: promoted,
  }), /unexpectedly claim complete runtime reachability/);
});

test("CLI exposes only release/config/output/check planning controls", () => {
  const parsed = parseArguments([
    "--release-id", "lesson-g05-l05-add-subtract-negative-numbers",
    "--calibration-sets", "catalog/lesson-release-calibration-sets.json",
    "--source-scope", "reports/g5-l5-source-scope-freeze.json",
    "--workspace-readiness", "reports/g5-l5-workspace-readiness.json",
    "--output-prefix", "reports/g5-l5-risk-calibration",
    "--check",
  ]);
  assert.equal(parsed.check, true);
  assert.equal(parsed.releaseId, "lesson-g05-l05-add-subtract-negative-numbers");
  assert.equal(parsed.sourceScopePath, "reports/g5-l5-source-scope-freeze.json");
  assert.equal(parsed.workspaceReadinessPath, "reports/g5-l5-workspace-readiness.json");
  assert.throws(() => parseArguments(["--release-id", "lesson-test"]), /--output-prefix is required/);
  assert.throws(() => parseArguments([
    "--release-id", "lesson-test",
    "--output-prefix", "reports/test",
    "--launch", "true",
  ]), /Unknown option/);
  assert.throws(() => parseArguments([
    "--release-id", "lesson-test",
    "--output-prefix", "migrations/test",
  ]), /below reports/);
});

test("markdown states that static counts do not select a renderer or estimate effort", () => {
  const markdown = renderMarkdown({
    releaseId: "lesson-test",
    authority: "Acceptance-neutral.",
    release: {expectedMemberCount: 2, machineAuditMemberCount: 2},
    summary: {
      calibrationMemberCount: 1,
      pairedFlaSwfCount: 0,
      swfOnlyCount: 1,
      workStudyTargetCount: 1,
      workStudyCompletedCount: 0,
      rootFrameCount: 10,
      nestedDefinitionCount: 2,
      nestedLongerThanRootCount: 1,
    },
    items: [{
      ordinal: 1,
      animationId: "page-1",
      staticFacts: {
        sourceModel: "swf-only",
        rootFrameCount: 10,
        nestedDefinitionCount: 2,
        nestedLongerThanRootCount: 1,
        maxNestedFrameCount: 20,
        exportedScriptFileCount: 2,
        branchOpcodeCount: 3,
        randomOpcodeCount: 1,
        externalCalls: [],
      },
      workStudy: {status: "candidate-pending-separate-authorization-and-human-timed-study"},
    }],
    humanWorkStudyProtocol: {measurementRule: "Human times only.", requiredPhases: ["audit"]},
    blockers: ["Runtime pending."],
  });
  assert.match(markdown, /neither effort estimates nor runtime reachability/);
  assert.match(markdown, /No renderer is selected/);
  assert.match(markdown, /Automation must not fill names, times/);
  assert.match(markdown, /No authorization, hours, receipt, or acceptance is inherited/);
});

test("checked-in G5 L4 calibration report is deterministic and acceptance-neutral", async () => {
  const report = await buildReport({releaseId: "lesson-g05-l04-number-lines"});
  const [actualJson, actualMarkdown] = await Promise.all([
    readFile("reports/g5-l4-risk-calibration.json", "utf8"),
    readFile("reports/g5-l4-risk-calibration.md", "utf8"),
  ]);
  assert.equal(actualJson, stableJson(report));
  assert.equal(actualMarkdown, renderMarkdown(report));
  assert.equal(report.summary.calibrationMemberCount, 8);
  assert.equal(report.summary.workStudyTargetCount, 4);
  assert.equal(report.summary.workStudyCompletedCount, 0);
  assert.equal(report.release.machineAuditMemberCount, 55);
  assert.equal(report.sourceBindings.machineAuditCoverage.verifiedMemberCount, 55);
  assert.equal(report.summary.unresolvedReachabilityCount, report.summary.nestedDefinitionCount);
  assert.equal(report.acceptanceEffects.implementationAuthorized, false);
  assert.equal(report.acceptanceEffects.strictComplete, false);
  assert.equal(report.acceptanceEffects.published, false);
  assert.doesNotMatch(actualJson, /\/Users\/|\/Volumes\/|file:\/\//);
});

test("checked-in G5 L5 calibration is bound to 57 release-local machine audits without inheriting G5 L4 authority", async () => {
  const report = await buildReport({
    releaseId: "lesson-g05-l05-add-subtract-negative-numbers",
    sourceScopePath: "reports/g5-l5-source-scope-freeze.json",
    workspaceReadinessPath: "reports/g5-l5-workspace-readiness.json",
  });
  const [actualJson, actualMarkdown] = await Promise.all([
    readFile("reports/g5-l5-risk-calibration.json", "utf8"),
    readFile("reports/g5-l5-risk-calibration.md", "utf8"),
  ]);
  assert.equal(actualJson, stableJson(report));
  assert.equal(actualMarkdown, renderMarkdown(report));
  assert.equal(report.release.expectedMemberCount, 57);
  assert.equal(report.release.machineAuditMemberCount, 57);
  assert.equal(report.sourceBindings.machineAuditCoverage.expectedMemberCount, 57);
  assert.equal(report.sourceBindings.machineAuditCoverage.verifiedMemberCount, 57);
  assert.equal(report.sourceBindings.machineAuditCoverage.members.length, 57);
  assert.equal(new Set(report.sourceBindings.machineAuditCoverage.members.map(({animationId}) => animationId)).size, 57);
  assert.equal(report.summary.calibrationMemberCount, 8);
  assert.equal(report.summary.workStudyTargetCount, 4);
  assert.deepEqual(report.items.map(({animationId}) => animationId), [
    "shell-course-g05-l05-index-local",
    "course-g05-l05-rw-002",
    "course-g05-l05-in-016",
    "course-g05-l05-in-020",
    "course-g05-l05-ti-006",
    "course-g05-l05-gs-002",
    "course-g05-l05-ts-007",
    "course-g05-l05-fq-002",
  ]);
  assert.deepEqual(
    report.items.filter(({workStudy}) => workStudy).map(({animationId}) => animationId),
    [
      "shell-course-g05-l05-index-local",
      "course-g05-l05-rw-002",
      "course-g05-l05-in-020",
      "course-g05-l05-fq-002",
    ],
  );
  assert.ok(report.items.filter(({workStudy}) => workStudy).every(({workStudy}) =>
    workStudy.status === "candidate-pending-separate-authorization-and-human-timed-study" &&
    workStudy.actualTotalMinutes === null &&
    workStudy.measuredBy === null &&
    workStudy.phases.every((phase) =>
      phase.actualMinutes === null &&
      phase.measuredBy === null &&
      phase.startedAt === null &&
      phase.finishedAt === null),
  ));
  assert.equal(report.items.find(({animationId}) => animationId === "course-g05-l05-rw-002").staticFacts.maxNestedFrameCount, 1514);
  assert.equal(report.items.find(({animationId}) => animationId === "course-g05-l05-fq-002").staticFacts.nestedDefinitionCount, 213);
  assert.equal(report.items.find(({animationId}) => animationId === "shell-course-g05-l05-index-local").staticFacts.externalCalls.length, 4);
  assert.equal(report.sourceBindings.sourceScope.path, "reports/g5-l5-source-scope-freeze.json");
  assert.equal(report.sourceBindings.workspaceReadiness.path, "reports/g5-l5-workspace-readiness.json");
  assert.equal(report.method.noPriorLessonAuthorizationHoursReceiptOrAcceptanceInheritance, true);
  assert.equal(report.humanWorkStudyProtocol.authorizationInheritedFromAnotherLesson, false);
  assert.equal(report.humanWorkStudyProtocol.hoursInheritedFromAnotherLesson, false);
  assert.equal(report.humanWorkStudyProtocol.receiptInheritedFromAnotherLesson, false);
  assert.equal(report.humanWorkStudyProtocol.acceptanceInheritedFromAnotherLesson, false);
  assert.equal(report.acceptanceEffects.implementationAuthorized, false);
  assert.equal(report.acceptanceEffects.strictComplete, false);
  assert.equal(report.acceptanceEffects.published, false);
  assert.doesNotMatch(actualJson, /lesson-g05-l04|g5-l4|\/Users\/|\/Volumes\/|file:\/\//);
});

test("G5 L5 calibration rejects a foreign source freeze or workspace-readiness binding", async () => {
  await assert.rejects(
    buildReport({
      releaseId: "lesson-g05-l05-add-subtract-negative-numbers",
      sourceScopePath: "reports/g5-l4-source-scope-freeze.json",
      workspaceReadinessPath: "reports/g5-l5-workspace-readiness.json",
    }),
    /source scope belongs to another release/,
  );
  await assert.rejects(
    buildReport({
      releaseId: "lesson-g05-l05-add-subtract-negative-numbers",
      sourceScopePath: "reports/g5-l5-source-scope-freeze.json",
      workspaceReadinessPath: "reports/g5-l4-workspace-readiness.json",
    }),
    /workspace readiness belongs to another release/,
  );
});
