import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  G5_L4_SOURCE_STATIC_CANDIDATE_IDS,
  G5_L4_SOURCE_STATIC_NESTED_SOURCE_INSTANCE_IDS,
  GENERATOR_PATH,
  buildLessonCoverageTraceObligationMatrix,
  parseArguments,
  releaseDefinitionFingerprint,
  releaseProfileForId,
  validateReleaseCoverageTraceObligationReport,
} from "./build-lesson-coverage-trace-obligation-matrix.mjs";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const digest = (value) => createHash("sha256").update(value).digest("hex");

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function writeJson(root, relativePath, value) {
  const destination = path.join(root, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, json(value));
  const bytes = await readFile(destination);
  return {
    path: relativePath,
    bytes: bytes.length,
    sha256: digest(bytes),
  };
}

async function exists(candidate) {
  try {
    await lstat(candidate);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function treeDigest(root) {
  const rows = [];
  async function visit(relative = "") {
    const directory = path.join(root, relative);
    for (const entry of (
      await readdir(directory, { withFileTypes: true })
    ).sort((left, right) => left.name.localeCompare(right.name))) {
      const next = path.join(relative, entry.name);
      if (entry.isDirectory()) await visit(next);
      else {
        const bytes = await readFile(path.join(root, next));
        rows.push(`${next.split(path.sep).join("/")}:${digest(bytes)}`);
      }
    }
  }
  await visit();
  return digest(rows.join("\n"));
}

function releaseDefinition() {
  const pageHash = "1".repeat(64);
  const shellHash = "2".repeat(64);
  return {
    releaseId: "lesson-synthetic-coverage-trace",
    releaseType: "complete-lesson",
    titleDisplay: "Synthetic Pending Lesson",
    publicationMode: "atomic",
    developmentMode: "parallel-shards",
    scope: {
      collection: "course",
      grade: 5,
      lesson: 99,
      excludeNonMembers: true,
    },
    expectedCounts: {
      activeXmlReferencedPages: 1,
      courseShells: 1,
      members: 2,
      shards: 1,
    },
    shards: [
      {
        shardId: "synthetic-shard",
        batchId: "synthetic-shard",
        ordinal: 1,
        parallelGroup: "synthetic",
        memberCount: 2,
        developmentPrerequisites: [],
      },
    ],
    members: [
      {
        ordinal: 1,
        animationId: "synthetic-page-001",
        assetId: `swf-${pageHash}`,
        releaseRole: "active-xml-referenced-page",
        batchId: "synthetic-shard",
        shardId: "synthetic-shard",
        source: {
          path: "HELP_COURSES/ELMGR5/L99/PAGE01.swf",
          sha256: pageHash,
        },
        xmlOccurrence: 1,
      },
      {
        ordinal: 2,
        animationId: "synthetic-shell-index",
        assetId: `swf-${shellHash}`,
        releaseRole: "course-shell",
        batchId: "synthetic-shard",
        shardId: "synthetic-shard",
        source: {
          path: "HELP_COURSES/ELMGR5/L99/index_local.swf",
          sha256: shellHash,
        },
        xmlOccurrence: null,
      },
    ],
  };
}

function manifest(member, frameCount) {
  return {
    schemaVersion: 2,
    id: member.animationId,
    animationId: member.animationId,
    assetId: member.assetId,
    status: "preserved",
    source: {
      swf: `source-assets/flash/HELP MATH_ORIGINAL FILES/${member.source.path}`,
      swfSha256: member.source.sha256,
    },
    runtime: { fps: 12, frameCount },
    implementation: {
      rendering: "undecided",
      route: "",
      routeFile: "",
      component: "",
      registryModule: "",
      timelineModule: "",
      testFile: "",
      standalonePackage: "",
      frameDomains: [
        {
          id: "root",
          kind: "root",
          sourceTimelineId: "root",
          parentFrameDomainId: null,
          frameCount,
          scenarioIds: ["default"],
        },
      ],
    },
    acceptance: {
      engineeringReview: {
        decision: "pending",
        reviewer: "",
        reviewedAt: "",
      },
      humanVisualReview: {
        decision: "pending",
        reviewer: "",
        reviewedAt: "",
      },
      ownerReview: {
        decision: "pending",
        reviewer: "",
        reviewedAt: "",
      },
    },
  };
}

function coverage(member, frameCount) {
  return {
    schemaVersion: 2,
    animationId: member.animationId,
    requirements: ["en", "es"].map((language) => ({
      requirementId: `req-default-root-${language}`,
      scenario: "default",
      frameDomainId: "root",
      traceId: `default-root-${language}`,
      language,
      seed: "0",
      requiredRange: { firstFrame: 1, lastFrame: frameCount },
      entryState: { kind: "initial-load", language },
      entryStateSha256: digest(`${member.animationId}:${language}:entry`),
      baselineAuthorityRequirement: "original-runtime-frame-accurate",
      baselineAuthority: "unresolved",
      status: "pending",
      capturedFrameCount: 0,
      missingFrames: Array.from(
        { length: frameCount },
        (_, index) => index + 1,
      ),
      baselineCaptureManifest: "",
      baselineCaptureManifestSha256: "",
      captureManifest: "",
      captureManifestSha256: "",
      metricsFile: "",
      metricsSha256: "",
    })),
  };
}

function sourceStaticCandidateManifest(member, frameCount) {
  const document = manifest(member, frameCount);
  document.implementation = {
    rendering:
      "source-static Canvas engineering candidate; strict fidelity fail closed",
    route: `/animations/${member.animationId}`,
    routeFile: "apps/web/app/[locale]/animations/[animationId]/page.tsx",
    component: `packages/demos/src/modules/${member.animationId}.tsx`,
    registryModule: `./modules/${member.animationId}`,
    timelineModule: `packages/demos/src/timelines/${member.animationId}.ts`,
    testFile: "packages/demos/tests/source-static.test.ts",
    standalonePackage: "",
    defaultFrameDomainId: "sprite-routed",
    frameDomains: [
      {
        id: "root",
        kind: "root",
        sourceTimelineId: "root",
        sourceInstanceId: "root",
        parentFrameDomainId: null,
        frameCount,
        scenarioIds: ["root-unavailable"],
      },
      {
        id: "sprite-routed",
        kind: "nested",
        sourceTimelineId: "sprite-routed",
        sourceInstanceId: "animation",
        parentFrameDomainId: "root",
        parentEntryFrame: 2,
        localEntryFrame: 1,
        frameCount: 5,
        scenarioIds: ["source-static-frame"],
      },
    ],
    capturePlanning: {
      nestedFrameDomainDispositionEstablished: true,
      nestedFrameDomainDeclaredInCurrentManifest: true,
      conservativeNestedDomainRequirementsEstablished: true,
      conservativeNestedFrameDomainIds: ["sprite-routed"],
      rootNaturalTraceExecuted: false,
      authoritativeScenarioInventoryEstablished: false,
      authoritativeRuntimeFrameDomainDispositionEstablished: false,
      structuralFrameDomainPlanningClosed: false,
      runtimeReachabilityEstablished: false,
      strictAcceptanceEffect: "none",
    },
    candidateState: {
      status: "current-javascript-engineering-candidate-only",
      sourceStaticFrameDomain: "sprite-routed",
      sourceStaticFrames: { firstFrame: 1, lastFrame: 5 },
      renderedFrameCount: 5,
      rootEnabled: false,
      spanishEnabled: false,
      audioEnabled: false,
      sourceControlsEnabled: false,
      replayParityEstablished: false,
      originalRuntimeBaselineUsed: false,
      rmseComputed: false,
      humanVisualReviewPerformed: false,
      ownerReviewPerformed: false,
      strictAcceptanceEffect: "none",
    },
  };
  return document;
}

function sourceStaticCandidateCoverage(member, rootFrameCount) {
  const build = (frameDomainId, scenario, language, frameCount) => ({
    requirementId: `req:${frameDomainId}:lesson-shell-natural-entry:${language}`,
    scenario,
    frameDomainId,
    traceId: `trace:${frameDomainId}:lesson-shell-natural-entry:${language}:seed-0`,
    language,
    seed: "0",
    requiredRange: { firstFrame: 1, lastFrame: frameCount },
    entryState: {
      authoritativeTraceExecuted: false,
      frameDomainId,
      language,
      scenario,
      ...(frameDomainId === "root"
        ? {}
        : {
            runtimeReachabilityEstablished: false,
            parentFrameDomainId: "root",
            sourceTimelineId: frameDomainId,
          }),
    },
    entryStateSha256: digest(
      `${member.animationId}:${frameDomainId}:${language}:entry`,
    ),
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    baselineAuthority: "unresolved",
    status: "pending",
    capturedFrameCount: 0,
    missingFrames: Array.from({ length: frameCount }, (_, index) => index + 1),
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  });
  return {
    schemaVersion: 2,
    animationId: member.animationId,
    requirements: [
      ...["en", "es"].map((language) =>
        build("root", "root-unavailable", language, rootFrameCount),
      ),
      ...["en", "es"].map((language) =>
        build("sprite-routed", "source-static-frame", language, 5),
      ),
    ],
  };
}

function scenario(
  member,
  releaseBinding,
  frameCount,
  { complex = false, sourceStaticUnresolvedChild = false } = {},
) {
  const evidence = { artifactId: "source-swf" };
  const nested = complex
    ? [
        {
          timelineId: "sprite-routed",
          objectId: "11",
          frameCount: 5,
          structuralReachability: "reachable-from-root-placement-graph",
        },
        {
          timelineId: "sprite-not-proven",
          objectId: "12",
          frameCount: 2,
          structuralReachability: "not-proven",
        },
        ...(sourceStaticUnresolvedChild
          ? [
              {
                timelineId: "sprite-unresolved",
                objectId: "13",
                frameCount: 4,
                structuralReachability: "reachable-from-root-placement-graph",
              },
            ]
          : []),
      ]
    : [];
  return {
    schemaVersion: 1,
    animationId: member.animationId,
    inventoryStatus: "static-exhaustive-runtime-unverified",
    migrationStatusChanged: false,
    strictAcceptanceEffect: "none; machine-only static inventory",
    source: {
      swf: `source-assets/flash/HELP MATH_ORIGINAL FILES/${member.source.path}`,
      swfSha256: member.source.sha256,
    },
    evidenceIndex: [
      {
        artifactId: "source-swf",
        path: `source-assets/flash/HELP MATH_ORIGINAL FILES/${member.source.path}`,
        sha256: member.source.sha256,
      },
      {
        artifactId: "lesson-release-membership",
        ...releaseBinding,
        releaseId: "lesson-synthetic-coverage-trace",
        publicationMode: "atomic",
        expectedMemberCount: 2,
        ordinal: member.ordinal,
        animationId: member.animationId,
        assetId: member.assetId,
        releaseRole: member.releaseRole,
        sourcePath: member.source.path,
        sourceSha256: member.source.sha256,
      },
    ],
    timelineInventory: [
      {
        timelineId: "root",
        objectId: null,
        frameCount,
        structuralReachability: "root",
      },
      ...nested,
    ],
    interactions: { handlers: [] },
    coverage: {
      authoritativeRuntimeCoverage: [],
      timelineStateCoverage: [],
      handlerBehaviorGroups: [],
      buttonTargetObligations: complex
        ? [
            {
              buttonObjectId: "21",
              eventsEncodedByConditions: ["release"],
              hitRecords: [{}],
              placements: [{}],
              evidence,
            },
          ]
        : [],
      dragObligations: [],
      conditionalBranchObligations: complex
        ? [
            {
              obligationId: "branch-answer",
              condition: "answer == expected",
              requiredOutcomes: ["true", "false"],
              feasibility: "unresolved",
              evidence,
            },
          ]
        : [],
      randomObligations: complex
        ? [
            {
              obligationId: "random-item",
              expression: "random(2)",
              requiredOutcomes: [0, 1],
              deterministicHarness: "unresolved",
              evidence,
            },
          ]
        : [],
      inputObligations: [],
      correctWrongObligations: [],
      labeledStateObligations: [],
      glossaryAndHyperlinkObligations: [],
      sectionMenuObligations: [],
      courseRouteObligations: [],
      sideEffectObligations: [],
      dependencyFixtureObligations: [],
      replayAndTerminalObligations: {
        replayCandidates: [],
        terminalCandidates: [],
      },
    },
    dependencies: { safeSideEffectPolicy: [] },
    unknowns: [
      {
        id: "runtime-reachability",
        statement: "Static structure does not prove runtime reachability.",
        resolution: "Use an authorized natural original-runtime trace.",
        evidence,
      },
    ],
  };
}

function frameDomainDisposition(
  member,
  scenarioBinding,
  frameCount,
  {
    complex = false,
    sourceStaticCandidate = false,
    sourceStaticUnresolvedChild = false,
  } = {},
) {
  const child = {
    timelineId: "sprite-routed",
    sourceTimelineId: "sprite-routed",
    sourceObjectId: "11",
    frameCount: 5,
    structuralReachability: "reachable-from-root-placement-graph",
    disposition: sourceStaticCandidate ? "declared-frame-domain" : "unresolved",
    declaredFrameDomains: sourceStaticCandidate
      ? [
          {
            frameDomainId: "sprite-routed",
            kind: "nested",
            sourceTimelineId: "sprite-routed",
            sourceInstanceId: "animation",
            parentFrameDomainId: "root",
            parentEntryFrame: 2,
            localEntryFrame: 1,
            frameCount: 5,
          },
        ]
      : [],
    rootPlacement: {
      status: sourceStaticCandidate
        ? "proven-named-placement-chain"
        : "candidate",
    },
    riskAssessment: {
      level: "high",
      signals: ["local-frame-count-exceeds-root"],
    },
    sourceEvidence: {
      scenarioInventoryPath: "audit/scenario-inventory.json",
      scenarioInventorySha256: scenarioBinding.sha256,
    },
  };
  const unresolvedChild = {
    timelineId: "sprite-unresolved",
    sourceTimelineId: "sprite-unresolved",
    sourceObjectId: "13",
    frameCount: 4,
    structuralReachability: "reachable-from-root-placement-graph",
    disposition: "unresolved",
    declaredFrameDomains: [],
    rootPlacement: { status: "candidate" },
    riskAssessment: {
      level: "high",
      signals: ["local-frame-count-exceeds-root"],
    },
    sourceEvidence: {
      scenarioInventoryPath: "audit/scenario-inventory.json",
      scenarioInventorySha256: scenarioBinding.sha256,
    },
  };
  return {
    schemaVersion: 1,
    animationId: member.animationId,
    status: sourceStaticCandidate && !sourceStaticUnresolvedChild
      ? "structurally-enumerated"
      : "structurally-enumerated-dispositions-unresolved",
    migrationStatusChanged: false,
    strictAcceptanceEffect: "none; all child dispositions remain unresolved",
    generatedFrom: {
      lessonReleaseCatalog: {
        releaseId: "lesson-synthetic-coverage-trace",
        member: {
          animationId: member.animationId,
          ordinal: member.ordinal,
          assetId: member.assetId,
          sourceSha256: member.source.sha256,
        },
      },
      scenarioInventory: {
        path: "audit/scenario-inventory.json",
        sha256: scenarioBinding.sha256,
      },
      sourceSwf: { sha256: member.source.sha256 },
    },
    timelines: [
      {
        timelineId: "root",
        sourceTimelineId: "root",
        sourceObjectId: null,
        frameCount,
        disposition: "declared-frame-domain",
        declaredFrameDomains: ["root"],
      },
      ...(complex ? [child] : []),
      ...(sourceStaticUnresolvedChild ? [unresolvedChild] : []),
    ],
    summary: {
      inventoryTimelineCount: complex
        ? 3 + Number(sourceStaticUnresolvedChild)
        : 1,
      enumeratedTimelineCount: complex
        ? 2 + Number(sourceStaticUnresolvedChild)
        : 1,
      reachableChildTimelineCount: complex
        ? 1 + Number(sourceStaticUnresolvedChild)
        : 0,
      excludedNotProvenTimelineCount: complex ? 1 : 0,
      dispositionCounts: {
        "declared-frame-domain": sourceStaticCandidate ? 2 : 1,
        "composite-child-with-parent": 0,
        "independent-required": 0,
        nonvisual: 0,
        unresolved: sourceStaticUnresolvedChild
          ? 1
          : complex && !sourceStaticCandidate
            ? 1
            : 0,
      },
      highRiskIndependentCandidateCount: complex ? 1 : 0,
      highRiskIndependentCandidates: complex
        ? [
            {
              timelineId: "sprite-routed",
              sourceObjectId: "11",
              frameCount: 5,
              rootPlacementStatus: "candidate",
              signals: ["local-frame-count-exceeds-root"],
            },
          ]
        : [],
    },
  };
}

async function createFixture({
  sourceStaticCandidate = false,
  sourceStaticUnresolvedChild = false,
} = {}) {
  const root = await realpath(
    await mkdtemp(path.join(os.tmpdir(), "lesson-coverage-trace-")),
  );
  await mkdir(path.join(root, "scripts"), { recursive: true });
  await copyFile(
    path.join(projectRoot, GENERATOR_PATH),
    path.join(root, GENERATOR_PATH),
  );
  const release = releaseDefinition();
  const releaseCatalog = { schemaVersion: 1, releases: [release] };
  const releaseBinding = await writeJson(
    root,
    "catalog/lesson-releases.json",
    releaseCatalog,
  );
  for (const [index, member] of release.members.entries()) {
    const frameCount = index === 0 ? 3 : 2;
    const complex = index === 0;
    const memberIsSourceStaticCandidate = sourceStaticCandidate && index === 0;
    const workspace = `migrations/${member.animationId}`;
    await writeJson(
      root,
      `${workspace}/migration.json`,
      memberIsSourceStaticCandidate
        ? sourceStaticCandidateManifest(member, frameCount)
        : manifest(member, frameCount),
    );
    await writeJson(
      root,
      `${workspace}/evidence/full-frame-coverage.json`,
      memberIsSourceStaticCandidate
        ? sourceStaticCandidateCoverage(member, frameCount)
        : coverage(member, frameCount),
    );
    const scenarioBinding = await writeJson(
      root,
      `${workspace}/audit/scenario-inventory.json`,
      scenario(member, releaseBinding, frameCount, {
        complex,
        sourceStaticUnresolvedChild:
          memberIsSourceStaticCandidate && sourceStaticUnresolvedChild,
      }),
    );
    await writeJson(
      root,
      `${workspace}/audit/frame-domain-disposition.json`,
      frameDomainDisposition(member, scenarioBinding, frameCount, {
        complex,
        sourceStaticCandidate: memberIsSourceStaticCandidate,
        sourceStaticUnresolvedChild:
          memberIsSourceStaticCandidate && sourceStaticUnresolvedChild,
      }),
    );
  }
  const profile = {
    releaseId: release.releaseId,
    releaseLabel: "Synthetic",
    expectedReleaseFingerprint: releaseDefinitionFingerprint(release),
    expectedCounts: structuredClone(release.expectedCounts),
    expectedRootLanguages: ["en", "es"],
    expectedRootScenario: "default",
    sourceStaticCandidateIds: sourceStaticCandidate
      ? [release.members[0].animationId]
      : [],
    releaseCatalogPath: "catalog/lesson-releases.json",
    generatorPath: GENERATOR_PATH,
    reportJsonPath: `reports/release-coverage-trace-obligations/${release.releaseId}.json`,
    reportMarkdownPath: `reports/release-coverage-trace-obligations/${release.releaseId}.md`,
  };
  return { root, release, profile };
}

test("built-in G5 L4 profile pins the exact 55-member atomic release", () => {
  const profile = releaseProfileForId("lesson-g05-l04-number-lines");
  assert.equal(profile.expectedCounts.members, 55);
  assert.equal(profile.expectedCounts.activeXmlReferencedPages, 54);
  assert.equal(profile.expectedCounts.courseShells, 1);
  assert.equal(profile.expectedCounts.shards, 3);
  assert.equal(
    profile.expectedReleaseFingerprint,
    "df2f04bb91ffecffcde4447807dce7eeff25b689269d5de1f44741f25b5ba2cc",
  );
  assert.deepEqual(
    profile.sourceStaticCandidateIds,
    G5_L4_SOURCE_STATIC_CANDIDATE_IDS,
  );
  assert.deepEqual(G5_L4_SOURCE_STATIC_CANDIDATE_IDS, [
    "course-g05-l04-vb-002",
    "course-g05-l04-vb-005",
    "course-g05-l04-vb-006",
    "course-g05-l04-in-009",
    "course-g05-l04-in-015",
    "course-g05-l04-ts-006",
    "course-g05-l04-ts-002",
    "course-g05-l04-ts-005",
    "course-g05-l04-vb-008",
    "course-g05-l04-vb-009",
    "course-g05-l04-in-020",
    "course-g05-l04-in-012",
    "course-g05-l04-ts-003",
    "course-g05-l04-ts-004",
    "course-g05-l04-rw-003",
    "course-g05-l04-rw-004",
    "course-g05-l04-in-002",
    "course-g05-l04-in-007",
    "course-g05-l04-rw-002",
    "course-g05-l04-in-004",
    "course-g05-l04-in-018",
    "course-g05-l04-in-017",
    "course-g05-l04-in-016",
    "course-g05-l04-in-014",
    "course-g05-l04-in-013",
    "course-g05-l04-in-010",
    "course-g05-l04-in-005",
    "course-g05-l04-in-003",
    "course-g05-l04-vb-007",
    "course-g05-l04-vb-010",
    "course-g05-l04-vb-011",
    "course-g05-l04-ts-008",
    "course-g05-l04-ts-007",
    "course-g05-l04-ir-001-a662633d",
    "course-g05-l04-vb-003",
    "course-g05-l04-vb-004",
    "course-g05-l04-in-006",
    "course-g05-l04-in-008",
    "course-g05-l04-in-011",
    "course-g05-l04-in-019",
    "course-g05-l04-in-021",
    "course-g05-l04-in-022",
    "course-g05-l04-ti-002",
    "course-g05-l04-ti-003",
    "course-g05-l04-ti-004",
    "course-g05-l04-ti-005",
    "course-g05-l04-ti-006",
    "course-g05-l04-ti-007",
    "course-g05-l04-ti-008",
    "course-g05-l04-ti-009",
    "course-g05-l04-gs-002",
  ]);
  assert.deepEqual(G5_L4_SOURCE_STATIC_NESTED_SOURCE_INSTANCE_IDS, {
    "course-g05-l04-rw-002": "Animation",
    "course-g05-l04-rw-003": "Animation",
    "course-g05-l04-rw-004": "Animation",
  });
  assert.match(profile.reportJsonPath, /^reports\//);
});

test("CLI is release-driven and defaults to a non-writing dry-run", () => {
  assert.deepEqual(
    parseArguments(["--release-id", "lesson-g05-l04-number-lines"]),
    {
      releaseId: "lesson-g05-l04-number-lines",
      mode: "dry-run",
      help: false,
    },
  );
  assert.equal(
    parseArguments(["--release-id", "lesson-g05-l04-number-lines", "--check"])
      .mode,
    "check",
  );
  assert.throws(() => parseArguments([]), /--release-id is required/);
  assert.throws(
    () =>
      parseArguments([
        "--release-id",
        "lesson-g05-l04-number-lines",
        "--apply",
        "--check",
      ]),
    /choose at most one/,
  );
  assert.throws(
    () => parseArguments(["--release-id", "lesson-unknown"]),
    /unsupported coverage\/trace release/,
  );
});

test("synthetic dry-run is deterministic, report-only, and leaves every obligation pending", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const migrationsPath = path.join(fixture.root, "migrations");
  const before = await treeDigest(migrationsPath);
  const first = await buildLessonCoverageTraceObligationMatrix({
    projectRoot: fixture.root,
    profile: fixture.profile,
    mode: "dry-run",
  });
  const second = await buildLessonCoverageTraceObligationMatrix({
    projectRoot: fixture.root,
    profile: fixture.profile,
    mode: "dry-run",
  });
  assert.deepEqual(second, first);
  assert.equal(first.action, "planned");
  assert.equal(first.memberCount, 2);
  assert.equal(first.outputCount, 2);
  assert.equal(first.workspaceOutputCount, 0);
  assert.equal(first.rootOnlyRequirementCount, 4);
  assert.equal(first.pendingRequirementCount, 4);
  assert.equal(first.missingFrameCount, 10);
  assert.equal(first.nestedDefinitionCount, 2);
  assert.equal(first.unresolvedChildDomainCount, 1);
  assert.equal(first.excludedNotProvenDefinitionCount, 1);
  assert.equal(first.branchObligationCount, 1);
  assert.equal(first.randomObligationCount, 1);
  assert.equal(first.originalRuntimeSessionsExecuted, 0);
  assert.equal(first.acceptanceAdvanced, false);
  assert.equal(await treeDigest(migrationsPath), before);
  for (const output of first.outputs) {
    assert.equal(await exists(path.join(fixture.root, output.path)), false);
  }
});

test("synthetic apply writes only two reports and exact check remains read-only", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const migrationsPath = path.join(fixture.root, "migrations");
  const before = await treeDigest(migrationsPath);
  const applied = await buildLessonCoverageTraceObligationMatrix({
    projectRoot: fixture.root,
    profile: fixture.profile,
    mode: "apply",
  });
  assert.equal(applied.action, "written");
  assert.equal(await treeDigest(migrationsPath), before);
  assert.equal(
    await exists(
      path.join(
        fixture.root,
        "migrations/synthetic-page-001/audit/machine/coverage-trace-plan.json",
      ),
    ),
    false,
  );
  for (const output of applied.outputs) {
    assert.equal(await exists(path.join(fixture.root, output.path)), true);
  }
  const checked = await buildLessonCoverageTraceObligationMatrix({
    projectRoot: fixture.root,
    profile: fixture.profile,
    mode: "check",
  });
  assert.equal(checked.action, "verified");
  assert.deepEqual(checked.outputs, applied.outputs);
  assert.equal(await treeDigest(migrationsPath), before);

  const report = JSON.parse(
    await readFile(
      path.join(fixture.root, fixture.profile.reportJsonPath),
      "utf8",
    ),
  );
  assert.equal(
    validateReleaseCoverageTraceObligationReport(report, fixture),
    true,
  );
  assert.equal(report.outputScope.memberWorkspaceOutputCount, 0);
  assert.equal(report.currentCanonicalCoverage.authoritativeBaselineCount, 0);
  assert.equal(report.frameDomainDisposition.resolvedChildCount, 0);
  assert.equal(
    report.members[0].obligationRoutes.conditionalBranches[0].status,
    "pending-authoritative-reachability-entry-state-outcome-traces",
  );
  assert.equal(report.acceptanceEffects.strictComplete, false);
  assert.equal(report.acceptanceEffects.published, false);
});

test("a bounded source-static candidate reports root plus nested pending coverage without authority promotion", async (t) => {
  const fixture = await createFixture({ sourceStaticCandidate: true });
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const planned = await buildLessonCoverageTraceObligationMatrix({
    projectRoot: fixture.root,
    profile: fixture.profile,
    mode: "dry-run",
  });
  assert.equal(planned.canonicalRequirementCount, 6);
  assert.equal(planned.rootOnlyRequirementCount, 4);
  assert.equal(planned.nestedRequirementCount, 2);
  assert.equal(planned.pendingRequirementCount, 6);
  assert.equal(planned.missingFrameCount, 20);
  assert.equal(planned.declaredNestedFrameDomainCount, 1);
  assert.equal(planned.unresolvedChildDomainCount, 0);
  await buildLessonCoverageTraceObligationMatrix({
    projectRoot: fixture.root,
    profile: fixture.profile,
    mode: "apply",
  });
  const report = JSON.parse(
    await readFile(
      path.join(fixture.root, fixture.profile.reportJsonPath),
      "utf8",
    ),
  );
  const candidate = report.members[0];
  assert.equal(candidate.sourceStaticCandidate, true);
  assert.equal(candidate.rootCoverage.requirementCount, 4);
  assert.equal(candidate.rootCoverage.rootRequirementCount, 2);
  assert.equal(candidate.rootCoverage.nestedRequirementCount, 2);
  assert.equal(
    candidate.structuralDefinitions.declaredNestedFrameDomainCount,
    1,
  );
  assert.equal(
    candidate.structuralDefinitions.runtimeAuthorityPendingDeclaredNestedCount,
    1,
  );
  assert.equal(report.frameDomainDisposition.resolvedChildCount, 1);
  assert.equal(report.frameDomainDisposition.runtimeAuthoritativeChildCount, 0);
  assert.equal(candidate.runtimeReachabilityEstablished, false);
  assert.equal(
    candidate.obligationRoutes.childDomains[0].status,
    "pending-authoritative-runtime-reachability-entry-state-trace",
  );
  assert.equal(report.currentCanonicalCoverage.authoritativeBaselineCount, 0);
  assert.equal(report.currentCanonicalCoverage.implementationCaptureCount, 0);
  assert.equal(report.acceptanceEffects.currentJavaScriptCandidate, false);
  assert.equal(
    report.acceptanceEffects.authoritativeOriginalRuntimeAccepted,
    false,
  );
  assert.equal(report.acceptanceEffects.audioAccepted, false);
  assert.equal(report.acceptanceEffects.rmseAccepted, false);
  assert.equal(report.acceptanceEffects.humanVisualAccepted, false);
  assert.equal(report.acceptanceEffects.ownerAccepted, false);
  assert.equal(report.acceptanceEffects.strictComplete, false);
  assert.equal(report.acceptanceEffects.published, false);

  const coveragePath = path.join(
    fixture.root,
    "migrations/synthetic-page-001/evidence/full-frame-coverage.json",
  );
  const coverageDocument = JSON.parse(await readFile(coveragePath, "utf8"));
  coverageDocument.requirements.pop();
  await writeFile(coveragePath, json(coverageDocument));
  await assert.rejects(
    buildLessonCoverageTraceObligationMatrix({
      projectRoot: fixture.root,
      profile: fixture.profile,
      mode: "dry-run",
    }),
    /declared frame-domain coverage requirement count drifted/,
  );
});

test("a bounded source-static candidate retains additional reachable children as unresolved", async (t) => {
  const fixture = await createFixture({
    sourceStaticCandidate: true,
    sourceStaticUnresolvedChild: true,
  });
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const planned = await buildLessonCoverageTraceObligationMatrix({
    projectRoot: fixture.root,
    profile: fixture.profile,
    mode: "dry-run",
  });
  assert.equal(planned.canonicalRequirementCount, 6);
  assert.equal(planned.rootOnlyRequirementCount, 4);
  assert.equal(planned.nestedRequirementCount, 2);
  assert.equal(planned.pendingRequirementCount, 6);
  assert.equal(planned.missingFrameCount, 20);
  assert.equal(planned.declaredNestedFrameDomainCount, 1);
  assert.equal(planned.unresolvedChildDomainCount, 1);
  await buildLessonCoverageTraceObligationMatrix({
    projectRoot: fixture.root,
    profile: fixture.profile,
    mode: "apply",
  });
  const report = JSON.parse(
    await readFile(
      path.join(fixture.root, fixture.profile.reportJsonPath),
      "utf8",
    ),
  );
  const candidate = report.members[0];
  assert.equal(
    candidate.structuralDefinitions.declaredNestedFrameDomainCount,
    1,
  );
  assert.equal(
    candidate.structuralDefinitions
      .structurallyReachableUnresolvedChildCount,
    1,
  );
  assert.equal(candidate.runtimeReachabilityEstablished, false);
  assert.equal(report.frameDomainDisposition.resolvedChildCount, 1);
  assert.equal(report.frameDomainDisposition.unresolvedChildCount, 1);
  assert.equal(report.acceptanceEffects.strictComplete, false);
  assert.equal(report.acceptanceEffects.published, false);
});

test("captured root frames and promoted branches fail closed before report output", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const coveragePath = path.join(
    fixture.root,
    "migrations/synthetic-page-001/evidence/full-frame-coverage.json",
  );
  const document = JSON.parse(await readFile(coveragePath, "utf8"));
  document.requirements[0].capturedFrameCount = 1;
  document.requirements[0].missingFrames = [2, 3];
  await writeFile(coveragePath, json(document));
  await assert.rejects(
    buildLessonCoverageTraceObligationMatrix({
      projectRoot: fixture.root,
      profile: fixture.profile,
      mode: "dry-run",
    }),
    /coverage crossed the all-frames-pending boundary/,
  );
  assert.equal(
    await exists(path.join(fixture.root, fixture.profile.reportJsonPath)),
    false,
  );

  await writeFile(coveragePath, json(coverage(fixture.release.members[0], 3)));
  await buildLessonCoverageTraceObligationMatrix({
    projectRoot: fixture.root,
    profile: fixture.profile,
    mode: "apply",
  });
  const reportPath = path.join(fixture.root, fixture.profile.reportJsonPath);
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  report.members[0].obligationRoutes.conditionalBranches[0].status = "accepted";
  assert.throws(
    () => validateReleaseCoverageTraceObligationReport(report, fixture),
    /routed obligation was promoted/,
  );
});
