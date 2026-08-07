import assert from "node:assert/strict";
import {execFile as execFileCallback} from "node:child_process";
import {mkdtemp, readFile, writeFile, mkdir, unlink} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {promisify} from "node:util";
import {gzipSync} from "node:zlib";

import {
  COURSE_TRACE_PILOT_IDS,
  buildCourseTraceSpecs,
  buildTraceSpecsFromDocuments,
  canonicalJson,
  deriveCanonicalCourseSourceSchedules,
  deriveRandomSoundBranchSourceSchedulesFromEvidence,
  deriveRw002SourceSchedulesFromEvidence,
  deriveTs006PendingPlanSourceBindings,
  parseArguments,
  safeRequirementId,
  selectTraceLessonRelease,
  sha256Text,
  traceRequirementSelectionIdentity,
  validateExecutionProof,
} from "./build-course-trace-specs.mjs";
import {technicalManifestSha256} from "./evidence-projections.mjs";
import {selectionSha256} from "./lib/trace-frame-selection.mjs";

const execFile = promisify(execFileCallback);
const RW_SOURCE_SHA256 = "bf9ab1d12832fbe54c5bef08d0dd51307169eefbae1f75188efd9db94ed9e4e6";
const RANDOM_SOUND_PILOTS = Object.freeze({
  "course-g03-l06-ti-001": {
    frameDomainId: "sprite-21",
    inventoryTechnicalSha256: "1c74345f4a18c3e61e4e958d1c2f60ece351f05b274542aaef6c801e9ad4b7e7",
    sourceSwfSha256: "722b56b73cfc3bcff71c83cf71b00bfc89b4fdd3b147ecb43646f644f45dc739",
  },
  "course-g04-l01-ir-001": {
    frameDomainId: "sprite-58",
    inventoryTechnicalSha256: "c8545d9ba83b5b90d0c62cc1bc908297104058159335594066322c896861cf7f",
    sourceSwfSha256: "b21b16d1e5756820b5703136708f625dcc3a324d629b2337b1dc42af64559e46",
  },
});
const NO_DERIVED_SCHEDULES = async () => ({derivedSchedules: [], scheduleDerivationBindings: {}});
const TS006_ID = "course-g04-l03-ts-006";
const TS006_PENDING_PLAN_SOURCE_BINDINGS = Object.freeze({
  sameLessonShellSwf: Object.freeze({
    artifactId: "same-lesson-shell-swf",
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index_local.swf",
    bytes: 657421,
    sha256: "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e",
  }),
  sameLessonShellScenarioInventory: Object.freeze({
    artifactId: "same-lesson-shell-scenario-inventory",
    path: "migrations/shell-course-g04-l03-index-local/audit/scenario-inventory.json",
    bytes: 5837960,
    sha256: "94ee049da994622c7e444d421cdc81e21cbf0bfc1c01943b65e6c0bd28f6e118",
  }),
  sameLessonShellFfdecScripts: Object.freeze({
    artifactId: "same-lesson-shell-ffdec-scripts",
    path: "migrations/shell-course-g04-l03-index-local/audit/machine/ffdec-scripts.txt.gz",
    bytes: 24865,
    sha256: "c837d68c69d82cf025b9775a66f26ebb4f5a76dfb7e4d06eee43aaffce4d04f7",
  }),
  sameLessonShellSwfmillXml: Object.freeze({
    artifactId: "same-lesson-shell-swfmill-xml",
    path: "migrations/shell-course-g04-l03-index-local/audit/machine/swfmill.xml.gz",
    bytes: 865399,
    sha256: "f16d30d4ba6f3ce7c8c6588c50f01534d60d3cb5847a7d55c7ebf5633a9c53de",
  }),
  spanishNarrationAudioCandidate: Object.freeze({
    artifactId: "spanish-narration-audio-candidate",
    path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/SA/L3TS06.mp3",
    bytes: 106848,
    sha256: "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688",
  }),
});
const FIXTURE_PENDING_PLAN_SOURCE_BINDINGS = async ({id}) => (
  id === TS006_ID ? structuredClone(TS006_PENDING_PLAN_SOURCE_BINDINGS) : {}
);

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const HASH_C = "c".repeat(64);
const HASH_D = "d".repeat(64);
const HASH_E = "e".repeat(64);

test("trace-index eligibility is per-requirement and rejects a union of partial paths", () => {
  const partial = (frames, coverageGroupId) => {
    const value = {
      requirementSchemaVersion: 2,
      coverageRole: "partial-path",
      coverageGroupId,
      requiredFrameSet: {frames},
    };
    return {...value, selectionSha256: selectionSha256(value, 4)};
  };
  assert.throws(
    () => traceRequirementSelectionIdentity(partial([1, 2], "group-a"), 4, "partial A"),
    /partial-path requirements cannot enter strict acceptance, human\/owner review, trace indexes, or original-runtime evidence/,
  );
  assert.throws(
    () => traceRequirementSelectionIdentity(partial([3, 4], "group-a"), 4, "partial B"),
    /this requirement must itself select exactly 1\.\.4/,
  );

  const full = {
    requirementSchemaVersion: 2,
    coverageRole: "full-domain",
    coverageGroupId: "group-full",
    requiredFrameSet: {frames: [1, 2, 3, 4]},
  };
  full.selectionSha256 = selectionSha256(full, 4);
  assert.deepEqual(traceRequirementSelectionIdentity(full, 4).identity, {
    requirementSchemaVersion: 2,
    coverageRole: "full-domain",
    coverageGroupId: "group-full",
    requiredFrameSet: {frames: [1, 2, 3, 4]},
    selectionSha256: full.selectionSha256,
  });
});

function requirement({
  requirementId = "req:root:root-standalone:en",
  frameDomainId = "root",
  traceId = "trace:root:root-standalone:en:seed-0",
  scenario = "root-standalone",
  language = "en",
  lastFrame = 3,
  baselineAuthorityRequirement = "original-runtime-frame-accurate",
  inventorySha256 = HASH_E,
} = {}) {
  const entryState = frameDomainId === "root" ? {
    kind: "original-root-standalone-natural-entry",
    rootTimelineId: "root",
    rootEntryFrame: 1,
    scenario,
    language,
    seed: "0",
  } : {
    kind: "natural-root-placement-entry",
    rootTimelineId: "root",
    rootEntryFrame: 2,
    instanceId: "lesson",
    frameDomainId,
    localEntryFrame: 1,
    scenario,
    language,
    seed: "0",
  };
  return {
    requirementId,
    scenario,
    frameDomainId,
    traceId,
    language,
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame},
    entryState,
    entryStateSha256: sha256Text(canonicalJson(entryState)),
    baselineAuthorityRequirement,
    baselineAuthority: "unresolved",
    status: "blocked",
    blockingEvidence: [{file: "audit/scenario-inventory.json", sha256: inventorySha256}],
  };
}

function documents({id = COURSE_TRACE_PILOT_IDS[0], requirements, executableTraceSchedules} = {}) {
  const manifest = {
    animationId: id,
    source: {
      swf: `source-assets/flash/HELP MATH_ORIGINAL FILES/${id}.swf`,
      swfSha256: HASH_A,
    },
    runtime: {frameCount: 3, fps: 12, stage: {width: 800, height: 600}},
    implementation: {
      frameDomains: [
        {
          id: "root",
          kind: "root",
          sourceTimelineId: "root",
          sourceInstanceId: "root",
          parentFrameDomainId: null,
          frameCount: 3,
          scenarioIds: ["root-standalone"],
        },
        {
          id: "sprite-7",
          kind: "nested",
          sourceTimelineId: "sprite-7",
          sourceInstanceId: "lesson",
          parentFrameDomainId: "root",
          parentEntryFrame: 2,
          localEntryFrame: 1,
          frameCount: 5,
          scenarioIds: ["interactive"],
        },
      ],
    },
    scenarios: [
      {id: "root-standalone", kind: "linear", reachable: true},
      {id: "interactive", kind: "interactive", reachable: true},
    ],
  };
  const inventory = {
    schemaVersion: 1,
    animationId: id,
    inventoryStatus: "static-exhaustive-runtime-unverified",
    migrationStatusChanged: false,
    source: {swf: manifest.source.swf, swfSha256: HASH_A},
    evidenceIndex: [
      {artifactId: "source-swf", path: manifest.source.swf, sha256: HASH_A},
      {artifactId: "migration-manifest", path: "migration.json", sha256: HASH_B},
      {artifactId: "swfmill-xml", path: "audit/machine/swfmill.xml.gz", sha256: HASH_C},
    ],
    timelineInventory: [
      {
        timelineId: "root",
        frameCount: 3,
        structuralReachability: "root",
        controlStates: [{frame: 1, reasons: ["initial-one-indexed-frame"]}],
        evidence: {artifactId: "swfmill-xml", timelineId: "root"},
      },
      {
        timelineId: "sprite-7",
        frameCount: 5,
        structuralReachability: "reachable-from-root-placement-graph",
        controlStates: [{frame: 1, reasons: ["initial-one-indexed-frame"]}],
        evidence: {artifactId: "swfmill-xml", timelineId: "sprite-7"},
      },
    ],
    coverage: {
      handlerBehaviorGroups: [],
      buttonTargetObligations: [],
      inputObligations: [],
      dragObligations: [],
      correctWrongObligations: [],
      conditionalBranchObligations: [],
      randomObligations: [],
      labeledStateObligations: [],
      glossaryAndHyperlinkObligations: [],
      sectionMenuObligations: [],
      courseRouteObligations: [],
      sideEffectObligations: [],
      dependencyFixtureObligations: [],
      ...(executableTraceSchedules === undefined ? {} : {executableTraceSchedules}),
    },
    unknowns: [{id: "runtime-reachability"}],
  };
  const coverage = {
    schemaVersion: 2,
    animationId: id,
    requirements: requirements || [requirement()],
  };
  return {
    manifest,
    coverage,
    inventory,
    hashes: {
      sourceSwfSha256: HASH_A,
      manifestTechnicalSha256: HASH_B,
      coverageTechnicalSha256: HASH_D,
      inventoryTechnicalSha256: HASH_E,
      manifestFileSha256: HASH_B,
      coverageFileSha256: HASH_D,
      inventoryFileSha256: HASH_E,
    },
  };
}

function ts006Documents() {
  const rootRequirements = ["en", "es"].map((language) => requirement({
    requirementId: `req:root:lesson-shell-natural-entry:${language}`,
    frameDomainId: "root",
    traceId: `trace:root:lesson-shell-natural-entry:${language}:seed-0`,
    scenario: "root-unavailable",
    language,
    lastFrame: 10,
    baselineAuthorityRequirement: "original-runtime-natural-trace",
  }));
  const nestedRequirements = ["en", "es"].map((language) => requirement({
    requirementId: `req:sprite-23:lesson-shell-natural-entry:${language}`,
    frameDomainId: "sprite-23",
    traceId: `trace:sprite-23:lesson-shell-natural-entry:${language}:seed-0`,
    scenario: "source-static-frame",
    language,
    lastFrame: 128,
    baselineAuthorityRequirement: "original-runtime-natural-trace",
  }));
  const input = documents({id: TS006_ID, requirements: [...rootRequirements, ...nestedRequirements]});
  input.manifest.runtime.frameCount = 10;
  input.manifest.implementation.frameDomains = [{
    id: "root",
    kind: "root",
    sourceTimelineId: "root",
    sourceInstanceId: "root",
    parentFrameDomainId: null,
    frameCount: 10,
    scenarioIds: ["root-unavailable"],
  }, {
    id: "sprite-23",
    kind: "nested",
    sourceTimelineId: "sprite-23",
    sourceInstanceId: "animation",
    parentFrameDomainId: "root",
    parentEntryFrame: 6,
    localEntryFrame: 1,
    frameCount: 128,
    scenarioIds: ["source-static-frame"],
  }];
  input.manifest.scenarios = [
    {id: "root-unavailable", kind: "linear", reachable: true},
    {id: "source-static-frame", kind: "linear", reachable: true},
  ];
  input.inventory.evidenceIndex.push(
    {artifactId: "course-xml", path: "source-assets/flash/index.xml", sha256: HASH_A},
    {artifactId: "ffdec-scripts", path: "audit/machine/ffdec-scripts.txt.gz", sha256: HASH_B},
    {artifactId: "strict-readiness", sourcePath: "audit/strict-readiness.json", sha256: HASH_C},
  );
  input.inventory.timelineInventory = [{
    timelineId: "root",
    frameCount: 10,
    structuralReachability: "root",
    controlStates: [{frame: 1, reasons: ["initial-one-indexed-frame"]}, {frame: 6, reasons: ["frame-label:begin"]}],
    evidence: {artifactId: "swfmill-xml", timelineId: "root"},
  }, {
    timelineId: "sprite-23",
    frameCount: 128,
    structuralReachability: "reachable-from-root-placement-graph",
    controlStates: [{frame: 1, reasons: ["initial-one-indexed-frame"]}, {frame: 128, reasons: ["script-stop-state"]}],
    evidence: {artifactId: "swfmill-xml", timelineId: "sprite-23"},
  }];
  input.pendingTracePlanSourceBindings = structuredClone(TS006_PENDING_PLAN_SOURCE_BINDINGS);
  return input;
}

function resultHash(record) {
  const payload = {...record};
  delete payload.resultSha256;
  return sha256Text(canonicalJson(payload));
}

function artifact(file, sha256 = HASH_C) {
  return {file, sha256};
}

function proofIdentity(spec) {
  return {
    frameDomainId: spec.identity.frameDomainId,
    traceId: spec.identity.traceId,
    entryStateSha256: spec.identity.entryStateSha256,
    scenario: spec.identity.scenario,
    language: spec.identity.language,
    seed: spec.identity.seed,
  };
}

function observedState(spec, state, {rootFrame, localFrame, eventLogOffset}) {
  return {
    observedState: state,
    observedStateSha256: sha256Text(canonicalJson(state)),
    rootFrame,
    frameDomainId: spec.identity.frameDomainId,
    localFrame,
    screenshotSha256: HASH_D,
    eventLogOffset,
  };
}

test("parses bounded trace factory arguments and creates safe deterministic names", () => {
  const options = parseArguments([
    "--check", "--json",
    "--release-id", "lesson-g04-l10-perimeter-area",
    "--id", "course-g04-l10-vb-003",
    "--lesson-releases", "catalog/lesson-releases.json",
    "--migrations", "migrations",
    "--python", "/usr/bin/python3",
  ]);
  assert.equal(options.check, true);
  assert.equal(options.json, true);
  assert.equal(options.releaseId, "lesson-g04-l10-perimeter-area");
  assert.deepEqual(options.ids, ["course-g04-l10-vb-003"]);
  assert.equal(options.lessonReleasesPath, path.resolve("catalog/lesson-releases.json"));
  assert.equal(options.migrationsRoot, path.resolve("migrations"));
  assert.equal(options.python, "/usr/bin/python3");
  assert.equal(safeRequirementId("req:sprite-348:answer_correct:es"), "req-sprite-348-answer-correct-es");
  assert.throws(() => parseArguments(["--migrations"]), /requires a value/);
  assert.throws(() => parseArguments(["--python"]), /requires a value/);
  assert.throws(() => parseArguments(["--release-id", "lesson-a", "--release-id", "lesson-b"]), /may be supplied once/);
  assert.throws(() => safeRequirementId("::"), /cannot produce a safe filename/);
});

test("selects a complete atomic release or a verified subset in canonical release order", () => {
  const release = {
    releaseId: "lesson-fixture",
    publicationMode: "atomic",
    expectedCounts: {members: 2, shards: 2},
    shards: [
      {ordinal: 1, shardId: "shard-one", memberCount: 1},
      {ordinal: 2, shardId: "shard-two", memberCount: 1},
    ],
    members: [
      {
        ordinal: 1,
        animationId: "course-fixture-one",
        assetId: `swf-${HASH_A}`,
        releaseRole: "active-xml-referenced-page",
        shardId: "shard-one",
        source: {path: "HELP_COURSES/ELMGR4/L10/VB/ONE.swf", sha256: HASH_A},
      },
      {
        ordinal: 2,
        animationId: "shell-fixture-two",
        assetId: `swf-${HASH_B}`,
        releaseRole: "lesson-shell",
        shardId: "shard-two",
        source: {path: "HELP_COURSES/ELMGR4/L10/index_local.swf", sha256: HASH_B},
      },
    ],
  };
  const catalog = {schemaVersion: 1, releases: [release]};
  const complete = selectTraceLessonRelease(catalog, {releaseId: release.releaseId});
  assert.equal(complete.selectionIdentity.scope, "complete-atomic-release");
  assert.deepEqual(complete.members.map(({animationId}) => animationId), ["course-fixture-one", "shell-fixture-two"]);

  const subset = selectTraceLessonRelease(catalog, {
    releaseId: release.releaseId,
    ids: ["shell-fixture-two", "course-fixture-one"],
  });
  assert.equal(subset.selectionIdentity.scope, "verified-subset");
  assert.deepEqual(subset.members.map(({animationId}) => animationId), ["course-fixture-one", "shell-fixture-two"]);
  assert.match(subset.selectionSha256, /^[a-f0-9]{64}$/);

  assert.throws(
    () => selectTraceLessonRelease(catalog, {releaseId: release.releaseId, ids: ["course-outside-release"]}),
    /not verified lesson-release members/,
  );
  const drifted = structuredClone(catalog);
  drifted.releases[0].members[1].ordinal = 3;
  assert.throws(() => selectTraceLessonRelease(drifted, {releaseId: release.releaseId}), /ordinals must be contiguous/);
});

test("linear root exhaustive specs are frame-accurate ready without inventing a natural action schedule", () => {
  const input = documents();
  const [spec] = buildTraceSpecsFromDocuments({id: input.manifest.animationId, ...input});
  assert.equal(spec.traceModel.kind, "frame-accurate-root-exhaustive");
  assert.equal(spec.traceSpecStatus, "source-frame-accurate-root-ready-for-authoritative-capture");
  assert.equal(spec.schedule.status, "not-required-frame-accurate-root");
  assert.deepEqual(spec.traceModel.positioningProofModes, ["direct-seek-root-exhaustive", "sequential-step-root-exhaustive"]);
  assert.deepEqual(spec.schedule.orderedSteps, []);
  assert.deepEqual(spec.schedule.executedSteps, []);
  assert.deepEqual(spec.executionEvidence.executedSteps, []);
  assert.equal(spec.schedule.orderedStepSchema.required.includes("sourceTarget"), true);
  assert.deepEqual(spec.unresolvedMappings, []);
  assert.equal(spec.separateBehaviorUnknowns[0].id, "natural-playback-terminal-and-replay-semantics");
  assert.equal(spec.executionEvidence.executionProofSchema.invariants.some((item) => item.includes("identifier echoing")), true);
});

test("TS006 binds four pending natural-trace identities to ordered plans while keeping root frame stepping supplemental and non-authoritative", () => {
  const input = ts006Documents();
  const specs = buildTraceSpecsFromDocuments({id: input.manifest.animationId, ...input});
  assert.equal(specs.length, 4);
  assert.equal(specs.every((spec) => spec.traceSpecStatus === "unresolved"), true);
  assert.equal(specs.every((spec) => spec.schedule.status === "planned-pending-authorized-original-runtime-observation"), true);
  assert.equal(specs.every((spec) => spec.schedule.orderedSteps.length === 9), true);
  assert.equal(specs.every((spec) => spec.schedule.terminalSemantics.kind === "host-navigation-terminal"), true);
  assert.equal(specs.every((spec) => spec.acquisitionPlan.primary.acquisitionMode === "primary-natural-same-lesson-host-trace"), true);

  const roots = specs.filter((spec) => spec.identity.frameDomainId === "root");
  const nested = specs.filter((spec) => spec.identity.frameDomainId === "sprite-23");
  const english = specs.filter((spec) => spec.identity.language === "en");
  const spanish = specs.filter((spec) => spec.identity.language === "es");
  assert.equal(roots.length, 2);
  assert.equal(nested.length, 2);
  assert.equal(english.every((spec) => spec.schedule.stateCheckpoints.length === 7), true);
  assert.equal(spanish.every((spec) => spec.schedule.stateCheckpoints.length === 8), true);
  assert.equal(roots.every((spec) => spec.acquisitionPlan.supplemental.length === 1), true);
  assert.equal(roots.every((spec) => (
    spec.acquisitionPlan.supplemental[0].acquisitionMode === "supplemental-sequential-frame-step-after-natural-trace"
    && spec.acquisitionPlan.supplemental[0].prerequisite === "primary-natural-same-lesson-host-trace"
  )), true);
  assert.equal(nested.every((spec) => spec.acquisitionPlan.supplemental.length === 0), true);

  for (const spec of spanish) {
    assert.deepEqual(spec.schedule.orderedSteps.map((item) => item.id), [
      "navigate-same-lesson-host-to-ts006",
      "observe-root-preloader-handoff",
      "observe-natural-begin-and-nested-entry",
      "invoke-page-spanish-narration",
      "observe-first-natural-terminal",
      "invoke-host-native-replay",
      "observe-second-natural-terminal",
      "exercise-previous-next-and-natural-return",
      "close-runtime-and-record-postconditions",
    ]);
    assert.doesNotMatch(JSON.stringify(spec.schedule), /select-host-language|selectedLanguage/);
    const narration = spec.schedule.orderedSteps[3];
    assert.equal(narration.order, 4);
    assert.equal(narration.action.kind, "page-spanish-narration-release");
    assert.deepEqual(narration.action.point, {x: 699, y: 95});
    assert.equal(narration.sourceTarget.label, "En esta p\u00e1gina");
    assert.equal(narration.sourceTarget.timelineId, "root");
    assert.equal(narration.sourceTarget.frame, 49);
    assert.equal(narration.sourceTarget.instanceName, "SA");
    assert.equal(narration.sourceTarget.buttonObjectId, "217");
    assert.equal(narration.sourceTarget.hitShapeObjectId, "212");
    assert.equal(narration.sourceTarget.depth, "202");
    assert.deepEqual(narration.sourceTarget.nativeStageBounds, {
      left: 633.9,
      right: 762.65,
      top: 84.4,
      bottom: 106.4,
    });
    assert.equal(narration.postStateCheckpoint.expectedState.pageSpanishNarrationControl.SA_PLAYVisible, false);
    assert.equal(narration.postStateCheckpoint.expectedState.pageSpanishNarrationControl.SA_PAUSEVisible, true);
    assert.equal(narration.postStateCheckpoint.expectedState.successfulLoadAudibilitySpokenLanguageSynchronization,
      "must-be-observed-not-assumed-from-static-source");
    assert.equal(spec.sourceBindings.pendingTracePlanEvidence.sameLessonShellSwf.sha256,
      "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e");
    assert.equal(spec.sourceBindings.pendingTracePlanEvidence.spanishNarrationAudioCandidate.sha256,
      "c0ea9f1cede741945c763707ed89c5be76f651f761209880157bf0c45ded8688");
    assert.equal(spec.executionEvidence.status, "not-executed-by-this-generator");
    assert.equal(spec.executionEvidence.executionReport, null);
    assert.deepEqual(spec.executionEvidence.executedSteps, []);
    assert.match(spec.strictAcceptanceEffect, /^none;/);
  }
  assert.throws(
    () => validateExecutionProof(roots[0], {}, {
      traceSpecFile: "audit/trace-specs/req-root-lesson-shell-natural-entry-en.json",
      traceSpecSha256: HASH_A,
    }),
    /unresolved trace specs cannot admit execution proof/,
  );
});

test("TS006 Spanish pending plan fails closed on Shell or MP3 binding drift", () => {
  const changedShell = ts006Documents();
  changedShell.pendingTracePlanSourceBindings.sameLessonShellSwf.sha256 = HASH_A;
  assert.throws(
    () => buildTraceSpecsFromDocuments({id: changedShell.manifest.animationId, ...changedShell}),
    /sameLessonShellSwf differs from the source-locked path, byte count, or SHA-256/,
  );

  const changedAudio = ts006Documents();
  changedAudio.pendingTracePlanSourceBindings.spanishNarrationAudioCandidate.sha256 = HASH_A;
  assert.throws(
    () => buildTraceSpecsFromDocuments({id: changedAudio.manifest.animationId, ...changedAudio}),
    /spanishNarrationAudioCandidate differs from the source-locked path, byte count, or SHA-256/,
  );
});

test("TS006 pending-plan source bindings rehash the current Shell evidence and MP3 without creating authority", async () => {
  const bindings = await deriveTs006PendingPlanSourceBindings({id: TS006_ID, root: path.resolve(".")});
  assert.deepEqual(bindings, TS006_PENDING_PLAN_SOURCE_BINDINGS);
  assert.equal(Object.values(bindings).every((binding) => /^[a-f0-9]{64}$/.test(binding.sha256)), true);
});

test("trace-spec index inputs exclude supplemental partial paths without increasing the canonical denominator", () => {
  const canonical = requirement();
  const partialBase = {
    requirementSchemaVersion: 2,
    coverageRole: "partial-path",
    coverageGroupId: "supplemental-root-paths",
    requiredFrameSet: {frames: [1, 2]},
  };
  const partial = {
    ...requirement({
      requirementId: "req:root:supplemental-path:en",
      traceId: "trace:root:supplemental-path:en:seed-0",
    }),
    ...partialBase,
    selectionSha256: selectionSha256(partialBase, 3),
  };
  delete partial.requiredRange;
  const input = documents({requirements: [canonical, partial]});
  const specs = buildTraceSpecsFromDocuments({id: input.manifest.animationId, ...input});
  assert.deepEqual(specs.map(({requirementId}) => requirementId), [canonical.requirementId]);
});

test("frame-accurate root proof accepts exact direct seeks or Rewind plus one Step Forward per frame, never natural-playback claims", () => {
  const input = documents();
  const [spec] = buildTraceSpecsFromDocuments({id: input.manifest.animationId, ...input});
  let previousResultSha256 = null;
  const frameResults = Array.from({length: 3}, (_, index) => {
    const frame = index + 1;
    const record = {
      frame,
      positioningOperation: "direct-seek",
      operationCountSincePrevious: 1,
      requestSequence: frame,
      captureLogLocator: {requestSequence: frame, byteOffset: index * 100},
      observedRootFrame: frame,
      observedDisplayListStateSha256: sha256Text(`display-list-${frame}`),
      screenshotFile: `frame-${String(frame).padStart(3, "0")}.png`,
      screenshotSha256: sha256Text(`bitmap-${frame}`),
      width: 800,
      height: 600,
      previousResultSha256,
      result: "pass",
    };
    record.resultSha256 = resultHash(record);
    previousResultSha256 = record.resultSha256;
    return record;
  });
  const report = {
    schemaVersion: 1,
    status: "complete-pass",
    proofMode: "direct-seek-root-exhaustive",
    animationId: spec.animationId,
    requirementId: spec.requirementId,
    identity: proofIdentity(spec),
    traceSpecBinding: {file: "audit/trace-specs/root.json", sha256: HASH_B},
    authorizedRuntime: {
      name: "Adobe Flash Player Projector",
      version: "32",
      build: "32.0.0.465",
      launchProtocol: "local projector direct frame controller",
      authority: "original-runtime-frame-accurate",
      framePositioningAuthority: "original-runtime-direct-seek",
      sourceSwfSha256: HASH_A,
    },
    rawEventLog: {...artifact("direct-seek.log"), eventCount: 3, dispatchedActionCount: 0},
    sourceTargetResolutionLog: artifact("root-targets.json"),
    stateSnapshotArchive: artifact("display-list-states.json"),
    originalRuntimeCaptureManifest: artifact("capture.json"),
    frameResults,
    orderedStepResults: [],
    stateCheckpointResults: [],
    terminalResult: null,
    zeroActionObservation: null,
    unexpectedEvents: [],
    sequenceChainSha256: previousResultSha256,
  };
  assert.equal(validateExecutionProof(spec, report, {
    traceSpecFile: "audit/trace-specs/root.json",
    traceSpecSha256: HASH_B,
  }), true);

  const sequential = structuredClone(report);
  sequential.proofMode = "sequential-step-root-exhaustive";
  sequential.authorizedRuntime.framePositioningAuthority = "original-runtime-frame-step";
  sequential.rawEventLog.file = "rewind-step-forward.log";
  let sequentialPrevious = null;
  for (const [index, result] of sequential.frameResults.entries()) {
    result.positioningOperation = index === 0 ? "rewind" : "step-forward";
    result.previousResultSha256 = sequentialPrevious;
    result.resultSha256 = resultHash(result);
    sequentialPrevious = result.resultSha256;
  }
  sequential.sequenceChainSha256 = sequentialPrevious;
  assert.equal(validateExecutionProof(spec, sequential, {
    traceSpecFile: "audit/trace-specs/root.json",
    traceSpecSha256: HASH_B,
  }), true);

  const skippedStep = structuredClone(sequential);
  skippedStep.frameResults[2].operationCountSincePrevious = 2;
  assert.throws(
    () => validateExecutionProof(spec, skippedStep, {traceSpecFile: "audit/trace-specs/root.json", traceSpecSha256: HASH_B}),
    /exactly one step-forward positioning operation/,
  );

  const missingFrame = structuredClone(report);
  missingFrame.frameResults.splice(1, 1);
  assert.throws(
    () => validateExecutionProof(spec, missingFrame, {traceSpecFile: "audit/trace-specs/root.json", traceSpecSha256: HASH_B}),
    /cover every required frame/,
  );
  const wrongObservedFrame = structuredClone(report);
  wrongObservedFrame.frameResults[1].observedRootFrame = 3;
  assert.throws(
    () => validateExecutionProof(spec, wrongObservedFrame, {traceSpecFile: "audit/trace-specs/root.json", traceSpecSha256: HASH_B}),
    /observed at the wrong root frame/,
  );
});

test("nested and interactive requirements use a stateful natural trace without inventing actions", () => {
  const nested = requirement({
    requirementId: "req:sprite-7:interactive:en",
    frameDomainId: "sprite-7",
    traceId: "trace:sprite-7:interactive:en:seed-0",
    scenario: "interactive",
    lastFrame: 5,
    baselineAuthorityRequirement: "original-runtime-natural-trace",
  });
  const input = documents({requirements: [nested]});
  const [spec] = buildTraceSpecsFromDocuments({id: input.manifest.animationId, ...input});
  assert.equal(spec.traceModel.kind, "stateful-natural-trace");
  assert.equal(spec.traceModel.domainScope, "nested");
  assert.equal(spec.frameDomain.parentEntryFrame, 2);
  assert.equal(spec.schedule.exhaustiveFrameCapturePlan.frameCount, 5);
  assert.deepEqual(spec.schedule.orderedSteps, []);
  assert.deepEqual(spec.executionEvidence.stateCheckpointResults, []);
});

test("rejects stale inventory bindings, entry hashes, and safe-filename collisions", () => {
  const stale = documents();
  stale.coverage.requirements[0].blockingEvidence[0].sha256 = HASH_C;
  assert.throws(
    () => buildTraceSpecsFromDocuments({id: stale.manifest.animationId, ...stale}),
    /coverage is not bound to the exact scenario inventory/,
  );

  const badEntry = documents();
  badEntry.coverage.requirements[0].entryStateSha256 = HASH_A;
  assert.throws(
    () => buildTraceSpecsFromDocuments({id: badEntry.manifest.animationId, ...badEntry}),
    /entryStateSha256 does not match/,
  );

  const collision = documents({requirements: [
    requirement({requirementId: "req:a:b", traceId: "trace:a"}),
    requirement({requirementId: "req:a_b", traceId: "trace:b"}),
  ]});
  assert.throws(
    () => buildTraceSpecsFromDocuments({id: collision.manifest.animationId, ...collision}),
    /safe requirement filename collision/,
  );
});

test("does not accept noActionsRequired as an executable schedule for a nested trace", () => {
  const nestedRequirement = requirement({
    requirementId: "req:sprite-7:interactive:en",
    frameDomainId: "sprite-7",
    traceId: "trace:sprite-7:interactive:en:seed-0",
    scenario: "interactive",
    lastFrame: 5,
    baselineAuthorityRequirement: "original-runtime-natural-trace",
  });
  const schedule = {
    requirementId: nestedRequirement.requirementId,
    status: "source-evidenced-executable",
    noActionsRequired: true,
    sourceEvidence: [{artifactId: "swfmill-xml", timelineId: "root"}],
    orderedSteps: [],
    stateCheckpoints: [{
      id: "root-entry-and-terminal",
      expectedState: {rootFrameStart: 1, rootFrameEnd: 3},
      evidence: [{artifactId: "swfmill-xml", timelineId: "root"}],
    }],
    terminalSemantics: {
      status: "source-evidenced",
      expectedState: {rootFrame: 3, playState: "stopped"},
      evidence: [{artifactId: "swfmill-xml", timelineId: "root", frame: 3}],
    },
  };
  const invalid = documents({
    requirements: [nestedRequirement],
    executableTraceSchedules: [schedule],
  });
  assert.throws(
    () => buildTraceSpecsFromDocuments({id: invalid.manifest.animationId, ...invalid}),
    /noActionsRequired is allowed only for a linear root trace/,
  );
});

function nestedNaturalRequirement() {
  return requirement({
    requirementId: "req:sprite-7:interactive:en",
    frameDomainId: "sprite-7",
    traceId: "trace:sprite-7:interactive:en:seed-0",
    scenario: "interactive",
    lastFrame: 5,
    baselineAuthorityRequirement: "original-runtime-natural-trace",
  });
}

function noExternalActionsSchedule(nestedRequirement, {eventFree = false} = {}) {
  const evidence = [{artifactId: "swfmill-xml", timelineId: "sprite-7"}];
  return {
    requirementId: nestedRequirement.requirementId,
    status: "source-evidenced-executable",
    noExternalActionsRequired: true,
    sourceEvidence: evidence,
    naturalEntry: {
      status: "source-evidenced",
      sourceTarget: {rootTimelineId: "root", rootFrame: 2, instanceId: "lesson", timelineId: "sprite-7"},
      expectedState: {rootFrame: 2, localFrame: 1, localPlayState: "playing"},
      evidence,
    },
    sourceDrivenEvents: eventFree ? [] : [{
      order: 1,
      trigger: {kind: "timeline-frame-script", timelineId: "sprite-7", frame: 5},
      sourceTarget: {timelineId: "sprite-7", frame: 5, action: "stop"},
      preState: {rootFrame: 2, localFrame: 4, localPlayState: "playing"},
      postState: {rootFrame: 2, localFrame: 5, localPlayState: "stopped"},
      evidence,
    }],
    ...(eventFree ? {
      sourceProvenEventFreeFirstCycle: {
        status: "source-proven",
        sourceDrivenEventCount: 0,
        cycleRange: {...nestedRequirement.requiredRange},
        expectedState: {rootFrame: 2, firstLocalFrame: 1, lastLocalFrame: 5, localPlayState: "playing"},
        evidence,
      },
    } : {}),
    orderedSteps: [],
    stateCheckpoints: [{
      id: "natural-entry",
      expectedState: {rootFrame: 2, localFrame: 1, localPlayState: "playing"},
      evidence,
    }, {
      id: "first-cycle-terminal",
      expectedState: eventFree
        ? {rootFrame: 2, localFrame: 5, localPlayState: "playing"}
        : {rootFrame: 2, localFrame: 5, localPlayState: "stopped"},
      evidence,
    }],
    terminalSemantics: {
      status: "source-evidenced",
      kind: eventFree ? "first-cycle-boundary-playing" : "stopped-terminal",
      expectedState: eventFree
        ? {rootFrame: 2, localFrame: 5, localPlayState: "playing"}
        : {rootFrame: 2, localFrame: 5, localPlayState: "stopped"},
      evidence,
    },
  };
}

function noExternalExecutionReport(spec) {
  let previousSourceEventResultSha256 = null;
  const sourceDrivenEventResults = spec.schedule.sourceDrivenEvents.map((event, index) => {
    const result = {
      order: index + 1,
      scheduledEventSha256: sha256Text(canonicalJson(event)),
      eventSequence: index + 1,
      rawEventLogLocator: {eventSequence: index + 1, byteOffset: index * 100},
      observedTrigger: event.trigger,
      resolvedSourceTarget: event.sourceTarget,
      preState: observedState(spec, event.preState, {
        rootFrame: event.preState.rootFrame,
        localFrame: event.preState.localFrame,
        eventLogOffset: index * 100,
      }),
      postState: observedState(spec, event.postState, {
        rootFrame: event.postState.rootFrame,
        localFrame: event.postState.localFrame,
        eventLogOffset: (index + 1) * 100,
      }),
      frameEvidence: [{frame: event.postState.localFrame, file: `source-event-${index + 1}.png`, sha256: HASH_D}],
      previousResultSha256: previousSourceEventResultSha256,
      result: "pass",
    };
    result.resultSha256 = resultHash(result);
    previousSourceEventResultSha256 = result.resultSha256;
    return result;
  });
  const checkpointResults = spec.schedule.stateCheckpoints.map((checkpoint, index) => ({
    checkpointId: checkpoint.id,
    expectedStateSha256: sha256Text(canonicalJson(checkpoint.expectedState)),
    observation: observedState(spec, checkpoint.expectedState, {
      rootFrame: checkpoint.expectedState.rootFrame,
      localFrame: checkpoint.expectedState.localFrame,
      eventLogOffset: index * 100,
    }),
    frameEvidence: [{frame: checkpoint.expectedState.localFrame, file: `checkpoint-${index + 1}.png`, sha256: HASH_D}],
    result: "pass",
  }));
  const zeroActionObservation = {
    status: "observed-no-dispatched-actions",
    rawEventLogSha256: HASH_C,
    previousResultSha256: previousSourceEventResultSha256,
    preState: observedState(spec, spec.schedule.stateCheckpoints[0].expectedState, {rootFrame: 2, localFrame: 1, eventLogOffset: 0}),
    postState: observedState(spec, spec.schedule.stateCheckpoints[1].expectedState, {rootFrame: 2, localFrame: 5, eventLogOffset: 100}),
    frameEvidence: [{frame: 1, file: "entry.png", sha256: HASH_D}, {frame: 5, file: "terminal.png", sha256: HASH_D}],
  };
  zeroActionObservation.resultSha256 = resultHash(zeroActionObservation);
  return {
    schemaVersion: 1,
    status: "complete-pass",
    proofMode: "natural-trace-ordered-events",
    animationId: spec.animationId,
    requirementId: spec.requirementId,
    identity: proofIdentity(spec),
    traceSpecBinding: {file: "audit/trace-specs/nested-no-external.json", sha256: HASH_B},
    authorizedRuntime: {
      name: "Adobe Flash Player Projector",
      version: "32",
      build: "32.0.0.465",
      launchProtocol: "natural playback observation without operator dispatch",
      authority: "original-runtime-natural-trace",
      sourceSwfSha256: HASH_A,
    },
    rawEventLog: {...artifact("events.log"), eventCount: Math.max(1, sourceDrivenEventResults.length), dispatchedActionCount: 0},
    sourceTargetResolutionLog: artifact("targets.json"),
    stateSnapshotArchive: artifact("states.json"),
    originalRuntimeCaptureManifest: artifact("capture.json"),
    frameResults: [],
    orderedStepResults: [],
    sourceDrivenEventResults,
    stateCheckpointResults: checkpointResults,
    terminalResult: {
      expectedSemanticsSha256: sha256Text(canonicalJson(spec.schedule.terminalSemantics)),
      observation: observedState(spec, spec.schedule.terminalSemantics.expectedState, {rootFrame: 2, localFrame: 5, eventLogOffset: 100}),
      frameEvidence: [{frame: 5, file: "terminal.png", sha256: HASH_D}],
      rawEventLogSha256: HASH_C,
      result: "pass",
    },
    zeroActionObservation,
    unexpectedEvents: [],
    sequenceChainSha256: zeroActionObservation.resultSha256,
  };
}

test("accepts source-driven nested natural traces without inventing external operator actions", () => {
  const nested = nestedNaturalRequirement();
  const schedule = noExternalActionsSchedule(nested);
  const input = documents({requirements: [nested], executableTraceSchedules: [schedule]});
  const [spec] = buildTraceSpecsFromDocuments({id: input.manifest.animationId, ...input});

  assert.equal(spec.traceSpecStatus, "source-schedule-ready-for-authoritative-execution");
  assert.equal(spec.schedule.noActionsRequired, false);
  assert.equal(spec.schedule.noExternalActionsRequired, true);
  assert.deepEqual(spec.schedule.orderedSteps, []);
  assert.equal(spec.schedule.naturalEntry.status, "source-evidenced");
  assert.equal(spec.schedule.sourceDrivenEvents[0].trigger.kind, "timeline-frame-script");
  assert.equal(spec.schedule.terminalSemantics.kind, "stopped-terminal");
  assert.equal(spec.executionEvidence.executionProofSchema.required.includes("sourceDrivenEventResults"), true);

  const report = noExternalExecutionReport(spec);
  assert.equal(validateExecutionProof(spec, report, {
    traceSpecFile: "audit/trace-specs/nested-no-external.json",
    traceSpecSha256: HASH_B,
  }), true);

  const missingSourceEvent = structuredClone(report);
  missingSourceEvent.sourceDrivenEventResults = [];
  assert.throws(
    () => validateExecutionProof(spec, missingSourceEvent, {
      traceSpecFile: "audit/trace-specs/nested-no-external.json",
      traceSpecSha256: HASH_B,
    }),
    /exactly one result per scheduled source-driven event/,
  );

  const staleEventHash = structuredClone(report);
  staleEventHash.sourceDrivenEventResults[0].scheduledEventSha256 = HASH_A;
  assert.throws(
    () => validateExecutionProof(spec, staleEventHash, {
      traceSpecFile: "audit/trace-specs/nested-no-external.json",
      traceSpecSha256: HASH_B,
    }),
    /scheduledEventSha256 differs/,
  );

  const wrongObservedTrigger = structuredClone(report);
  wrongObservedTrigger.sourceDrivenEventResults[0].observedTrigger.frame = 4;
  wrongObservedTrigger.sourceDrivenEventResults[0].resultSha256 = resultHash(wrongObservedTrigger.sourceDrivenEventResults[0]);
  assert.throws(
    () => validateExecutionProof(spec, wrongObservedTrigger, {
      traceSpecFile: "audit/trace-specs/nested-no-external.json",
      traceSpecSha256: HASH_B,
    }),
    /observedTrigger differs/,
  );

  const wrongObservedTarget = structuredClone(report);
  wrongObservedTarget.sourceDrivenEventResults[0].resolvedSourceTarget.frame = 4;
  wrongObservedTarget.sourceDrivenEventResults[0].resultSha256 = resultHash(wrongObservedTarget.sourceDrivenEventResults[0]);
  assert.throws(
    () => validateExecutionProof(spec, wrongObservedTarget, {
      traceSpecFile: "audit/trace-specs/nested-no-external.json",
      traceSpecSha256: HASH_B,
    }),
    /resolvedSourceTarget differs/,
  );

  const wrongPreState = structuredClone(report);
  wrongPreState.sourceDrivenEventResults[0].preState.observedState.localFrame = 3;
  wrongPreState.sourceDrivenEventResults[0].preState.observedStateSha256 = sha256Text(canonicalJson(wrongPreState.sourceDrivenEventResults[0].preState.observedState));
  wrongPreState.sourceDrivenEventResults[0].resultSha256 = resultHash(wrongPreState.sourceDrivenEventResults[0]);
  assert.throws(
    () => validateExecutionProof(spec, wrongPreState, {
      traceSpecFile: "audit/trace-specs/nested-no-external.json",
      traceSpecSha256: HASH_B,
    }),
    /preState does not match/,
  );

  const wrongPostState = structuredClone(report);
  wrongPostState.sourceDrivenEventResults[0].postState.observedState.localPlayState = "playing";
  wrongPostState.sourceDrivenEventResults[0].postState.observedStateSha256 = sha256Text(canonicalJson(wrongPostState.sourceDrivenEventResults[0].postState.observedState));
  wrongPostState.sourceDrivenEventResults[0].resultSha256 = resultHash(wrongPostState.sourceDrivenEventResults[0]);
  assert.throws(
    () => validateExecutionProof(spec, wrongPostState, {
      traceSpecFile: "audit/trace-specs/nested-no-external.json",
      traceSpecSha256: HASH_B,
    }),
    /postState does not match/,
  );

  const staleEventLocator = structuredClone(report);
  staleEventLocator.sourceDrivenEventResults[0].rawEventLogLocator.eventSequence = 2;
  staleEventLocator.sourceDrivenEventResults[0].resultSha256 = resultHash(staleEventLocator.sourceDrivenEventResults[0]);
  assert.throws(
    () => validateExecutionProof(spec, staleEventLocator, {
      traceSpecFile: "audit/trace-specs/nested-no-external.json",
      traceSpecSha256: HASH_B,
    }),
    /must locate the actual source-driven event/,
  );

  const brokenSourceEventChain = structuredClone(report);
  brokenSourceEventChain.sourceDrivenEventResults[0].previousResultSha256 = HASH_A;
  brokenSourceEventChain.sourceDrivenEventResults[0].resultSha256 = resultHash(brokenSourceEventChain.sourceDrivenEventResults[0]);
  assert.throws(
    () => validateExecutionProof(spec, brokenSourceEventChain, {
      traceSpecFile: "audit/trace-specs/nested-no-external.json",
      traceSpecSha256: HASH_B,
    }),
    /breaks the source-driven event result chain/,
  );

  const sourceEventAsOperatorDispatch = structuredClone(report);
  sourceEventAsOperatorDispatch.sourceDrivenEventResults[0].dispatchedAction = {event: "timeline-frame-script"};
  sourceEventAsOperatorDispatch.sourceDrivenEventResults[0].resultSha256 = resultHash(sourceEventAsOperatorDispatch.sourceDrivenEventResults[0]);
  assert.throws(
    () => validateExecutionProof(spec, sourceEventAsOperatorDispatch, {
      traceSpecFile: "audit/trace-specs/nested-no-external.json",
      traceSpecSha256: HASH_B,
    }),
    /cannot represent a source-driven event as an operator dispatch/,
  );

  const brokenZeroActionContinuation = structuredClone(report);
  brokenZeroActionContinuation.zeroActionObservation.previousResultSha256 = HASH_A;
  brokenZeroActionContinuation.zeroActionObservation.resultSha256 = resultHash(brokenZeroActionContinuation.zeroActionObservation);
  brokenZeroActionContinuation.sequenceChainSha256 = brokenZeroActionContinuation.zeroActionObservation.resultSha256;
  assert.throws(
    () => validateExecutionProof(spec, brokenZeroActionContinuation, {
      traceSpecFile: "audit/trace-specs/nested-no-external.json",
      traceSpecSha256: HASH_B,
    }),
    /does not continue the source-driven event result chain/,
  );

  const fabricatedDispatch = structuredClone(report);
  fabricatedDispatch.zeroActionObservation.dispatchedAction = {event: "click"};
  fabricatedDispatch.zeroActionObservation.resultSha256 = resultHash(fabricatedDispatch.zeroActionObservation);
  fabricatedDispatch.sequenceChainSha256 = fabricatedDispatch.zeroActionObservation.resultSha256;
  assert.throws(
    () => validateExecutionProof(spec, fabricatedDispatch, {
      traceSpecFile: "audit/trace-specs/nested-no-external.json",
      traceSpecSha256: HASH_B,
    }),
    /cannot fabricate an operator dispatch/,
  );

  const dispatchedCount = structuredClone(report);
  dispatchedCount.rawEventLog.dispatchedActionCount = 1;
  assert.throws(
    () => validateExecutionProof(spec, dispatchedCount, {
      traceSpecFile: "audit/trace-specs/nested-no-external.json",
      traceSpecSha256: HASH_B,
    }),
    /dispatchedActionCount differs from the schedule/,
  );
});

test("accepts only an exact source-proven event-free first-cycle alternative", () => {
  const nested = nestedNaturalRequirement();
  const schedule = noExternalActionsSchedule(nested, {eventFree: true});
  const input = documents({requirements: [nested], executableTraceSchedules: [schedule]});
  const [spec] = buildTraceSpecsFromDocuments({id: input.manifest.animationId, ...input});
  assert.deepEqual(spec.schedule.sourceDrivenEvents, []);
  assert.equal(spec.schedule.sourceProvenEventFreeFirstCycle.sourceDrivenEventCount, 0);
  assert.equal(spec.schedule.terminalSemantics.kind, "first-cycle-boundary-playing");
  const eventFreeReport = noExternalExecutionReport(spec);
  assert.deepEqual(eventFreeReport.sourceDrivenEventResults, []);
  assert.equal(eventFreeReport.zeroActionObservation.previousResultSha256, null);
  assert.equal(validateExecutionProof(spec, eventFreeReport, {
    traceSpecFile: "audit/trace-specs/nested-no-external.json",
    traceSpecSha256: HASH_B,
  }), true);

  const inventedSourceEvent = structuredClone(eventFreeReport);
  inventedSourceEvent.sourceDrivenEventResults = [{}];
  assert.throws(
    () => validateExecutionProof(spec, inventedSourceEvent, {
      traceSpecFile: "audit/trace-specs/nested-no-external.json",
      traceSpecSha256: HASH_B,
    }),
    /exactly one result per scheduled source-driven event/,
  );

  const driftedRange = structuredClone(input);
  driftedRange.inventory.coverage.executableTraceSchedules[0].sourceProvenEventFreeFirstCycle.cycleRange.lastFrame = 4;
  assert.throws(
    () => buildTraceSpecsFromDocuments({id: driftedRange.manifest.animationId, ...driftedRange}),
    /cycleRange must equal the required frame range/,
  );

  const driftedCount = structuredClone(input);
  driftedCount.inventory.coverage.executableTraceSchedules[0].sourceProvenEventFreeFirstCycle.sourceDrivenEventCount = 1;
  assert.throws(
    () => buildTraceSpecsFromDocuments({id: driftedCount.manifest.animationId, ...driftedCount}),
    /sourceDrivenEventCount must be zero/,
  );
});

test("fails closed on incomplete or contradictory noExternalActionsRequired schedules", () => {
  const nested = nestedNaturalRequirement();
  const baseSchedule = noExternalActionsSchedule(nested);
  const build = (schedule) => {
    const input = documents({requirements: [nested], executableTraceSchedules: [schedule]});
    return () => buildTraceSpecsFromDocuments({id: input.manifest.animationId, ...input});
  };

  const missingEntry = structuredClone(baseSchedule);
  delete missingEntry.naturalEntry;
  assert.throws(build(missingEntry), /naturalEntry must be an object/);

  const missingSourcePath = structuredClone(baseSchedule);
  missingSourcePath.sourceDrivenEvents = [];
  assert.throws(build(missingSourcePath), /needs sourceDrivenEvents or sourceProvenEventFreeFirstCycle/);

  const driftedOrder = structuredClone(baseSchedule);
  driftedOrder.sourceDrivenEvents[0].order = 2;
  assert.throws(build(driftedOrder), /order must be contiguous and one-indexed/);

  const missingEventEvidence = structuredClone(baseSchedule);
  missingEventEvidence.sourceDrivenEvents[0].evidence = [];
  assert.throws(build(missingEventEvidence), /must contain source evidence/);

  const missingKind = structuredClone(baseSchedule);
  delete missingKind.terminalSemantics.kind;
  assert.throws(build(missingKind), /needs terminalSemantics.kind/);

  const unsupportedKind = structuredClone(baseSchedule);
  unsupportedKind.terminalSemantics.kind = "guessed-completion";
  assert.throws(build(unsupportedKind), /terminalSemantics.kind is unsupported/);

  const contradictoryPaths = structuredClone(baseSchedule);
  contradictoryPaths.sourceProvenEventFreeFirstCycle = noExternalActionsSchedule(nested, {eventFree: true}).sourceProvenEventFreeFirstCycle;
  assert.throws(build(contradictoryPaths), /mutually exclusive/);

  const fabricatedOperatorStep = structuredClone(baseSchedule);
  fabricatedOperatorStep.orderedSteps = [{order: 1}];
  assert.throws(build(fabricatedOperatorStep), /cannot declare operator-dispatched orderedSteps/);
});

test("requires ordered source targets, checkpoints, evidence, and terminal semantics for an interactive schedule", () => {
  const nestedRequirement = requirement({
    requirementId: "req:sprite-7:interactive:en",
    frameDomainId: "sprite-7",
    traceId: "trace:sprite-7:interactive:en:seed-0",
    scenario: "interactive",
    lastFrame: 5,
    baselineAuthorityRequirement: "original-runtime-natural-trace",
  });
  const executable = {
    requirementId: nestedRequirement.requirementId,
    status: "source-evidenced-executable",
    sourceEvidence: [{artifactId: "swfmill-xml"}],
    orderedSteps: [{
      order: 1,
      action: {event: "release", pointer: {x: 20, y: 30}},
      sourceTarget: {timelineId: "sprite-7", objectId: "9", depth: "2"},
      preStateCheckpoint: {id: "before-release"},
      postStateCheckpoint: {id: "after-release"},
      evidence: [{artifactId: "swfmill-xml", objectId: "9"}],
    }],
    stateCheckpoints: [{
      id: "before-release",
      expectedState: {localFrame: 2, enabled: true},
      evidence: [{artifactId: "swfmill-xml"}],
    }, {
      id: "after-release",
      expectedState: {localFrame: 3, enabled: false},
      evidence: [{artifactId: "swfmill-xml"}],
    }],
    terminalSemantics: {
      status: "source-evidenced",
      expectedState: {localFrame: 5, playState: "stopped"},
      evidence: [{artifactId: "swfmill-xml"}],
    },
  };
  const input = documents({requirements: [nestedRequirement], executableTraceSchedules: [executable]});
  const [spec] = buildTraceSpecsFromDocuments({id: input.manifest.animationId, ...input});
  assert.equal(spec.schedule.orderedSteps.length, 1);
  assert.equal(spec.schedule.orderedSteps[0].sourceTarget.objectId, "9");

  const scheduledStep = spec.schedule.orderedSteps[0];
  const stepResult = {
    order: 1,
    scheduledStepSha256: sha256Text(canonicalJson(scheduledStep)),
    eventSequence: 1,
    rawEventLogLocator: {eventSequence: 1, byteOffset: 0},
    dispatchedAction: scheduledStep.action,
    resolvedSourceTarget: scheduledStep.sourceTarget,
    preState: observedState(spec, {localFrame: 2, enabled: true}, {rootFrame: 2, localFrame: 2, eventLogOffset: 0}),
    postState: observedState(spec, {localFrame: 3, enabled: false}, {rootFrame: 2, localFrame: 3, eventLogOffset: 100}),
    frameEvidence: [{frame: 3, file: "frame-003.png", sha256: HASH_D}],
    previousResultSha256: null,
    result: "pass",
  };
  stepResult.resultSha256 = resultHash(stepResult);
  const checkpointResults = spec.schedule.stateCheckpoints.map((checkpoint, index) => ({
    checkpointId: checkpoint.id,
    expectedStateSha256: sha256Text(canonicalJson(checkpoint.expectedState)),
    observation: observedState(
      spec,
      checkpoint.expectedState,
      {rootFrame: 2, localFrame: index === 0 ? 2 : 3, eventLogOffset: index * 100},
    ),
    frameEvidence: [{frame: index === 0 ? 2 : 3, file: `checkpoint-${index + 1}.png`, sha256: HASH_D}],
    result: "pass",
  }));
  const report = {
    schemaVersion: 1,
    status: "complete-pass",
    proofMode: "natural-trace-ordered-events",
    animationId: spec.animationId,
    requirementId: spec.requirementId,
    identity: proofIdentity(spec),
    traceSpecBinding: {file: "audit/trace-specs/nested.json", sha256: HASH_B},
    authorizedRuntime: {
      name: "Adobe Flash Player Projector",
      version: "32",
      build: "32.0.0.465",
      launchProtocol: "source-evidenced event controller",
      authority: "original-runtime-natural-trace",
      sourceSwfSha256: HASH_A,
    },
    rawEventLog: {...artifact("events.log"), eventCount: 1, dispatchedActionCount: 1},
    sourceTargetResolutionLog: artifact("targets.json"),
    stateSnapshotArchive: artifact("states.json"),
    originalRuntimeCaptureManifest: artifact("capture.json"),
    frameResults: [],
    orderedStepResults: [stepResult],
    stateCheckpointResults: checkpointResults,
    terminalResult: {
      expectedSemanticsSha256: sha256Text(canonicalJson(spec.schedule.terminalSemantics)),
      observation: observedState(spec, {localFrame: 5, playState: "stopped"}, {rootFrame: 2, localFrame: 5, eventLogOffset: 200}),
      frameEvidence: [{frame: 5, file: "terminal.png", sha256: HASH_D}],
      rawEventLogSha256: HASH_C,
      result: "pass",
    },
    zeroActionObservation: null,
    unexpectedEvents: [],
    sequenceChainSha256: stepResult.resultSha256,
  };
  assert.equal(validateExecutionProof(spec, report, {
    traceSpecFile: "audit/trace-specs/nested.json",
    traceSpecSha256: HASH_B,
  }), true);

  const hashEchoWithoutObservedDispatch = structuredClone(report);
  hashEchoWithoutObservedDispatch.orderedStepResults = [];
  assert.throws(
    () => validateExecutionProof(spec, hashEchoWithoutObservedDispatch, {traceSpecFile: "audit/trace-specs/nested.json", traceSpecSha256: HASH_B}),
    /exactly one result per scheduled step/,
  );
  const wrongDispatch = structuredClone(report);
  wrongDispatch.orderedStepResults[0].dispatchedAction = {event: "guessed-click"};
  assert.throws(
    () => validateExecutionProof(spec, wrongDispatch, {traceSpecFile: "audit/trace-specs/nested.json", traceSpecSha256: HASH_B}),
    /dispatchedAction differs/,
  );

  const missingTarget = structuredClone(input);
  missingTarget.inventory.coverage.executableTraceSchedules[0].orderedSteps[0].sourceTarget = {};
  assert.throws(
    () => buildTraceSpecsFromDocuments({id: missingTarget.manifest.animationId, ...missingTarget}),
    /sourceTarget must not be empty/,
  );
});

async function readRandomSoundPilotDocuments(animationId) {
  const profile = RANDOM_SOUND_PILOTS[animationId];
  if (!profile) throw new Error(`unknown random-sound pilot ${animationId}`);
  const workspace = path.resolve("migrations", animationId);
  const [manifestText, coverageText, inventoryText] = await Promise.all([
    readFile(path.join(workspace, "migration.json"), "utf8"),
    readFile(path.join(workspace, "evidence", "full-frame-coverage.json"), "utf8"),
    readFile(path.join(workspace, "audit", "scenario-inventory.json"), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  const coverage = JSON.parse(coverageText);
  const inventory = JSON.parse(inventoryText);
  const manifestTechnical = inventory.evidenceIndex.find((item) => item.artifactId === "migration-technical-contract");
  return {
    workspace,
    manifest,
    coverage,
    inventory,
    hashes: {
      sourceSwfSha256: profile.sourceSwfSha256,
      manifestTechnicalSha256: manifestTechnical.sha256,
      coverageTechnicalSha256: sha256Text(coverageText),
      inventoryTechnicalSha256: profile.inventoryTechnicalSha256,
      manifestFileSha256: sha256Text(manifestText),
      coverageFileSha256: sha256Text(coverageText),
      inventoryFileSha256: sha256Text(inventoryText),
    },
  };
}

test("derives only TI001/IR001 English natural random-sound branches and leaves Spanish and seed injection unresolved", async () => {
  for (const [animationId, profile] of Object.entries(RANDOM_SOUND_PILOTS)) {
    const input = await readRandomSoundPilotDocuments(animationId);
    const derivedSchedules = deriveRandomSoundBranchSourceSchedulesFromEvidence(input);
    assert.deepEqual(derivedSchedules.map((item) => item.requirementId), [
      `req:${profile.frameDomainId}:sound-0:en`,
      `req:${profile.frameDomainId}:sound-1:en`,
    ]);
    const binding = {status: "hash-bound-static-source-derived-minimal-child-entry-candidate-not-runtime-execution"};
    const scheduleDerivationBindings = Object.fromEntries(derivedSchedules.map((item) => [item.requirementId, binding]));
    const specs = buildTraceSpecsFromDocuments({
      id: animationId,
      ...input,
      derivedSchedules,
      scheduleDerivationBindings,
    });
    const byRequirement = new Map(specs.map((spec) => [spec.requirementId, spec]));

    for (const branch of [0, 1]) {
      const ready = byRequirement.get(`req:${profile.frameDomainId}:sound-${branch}:en`);
      assert.equal(ready.traceSpecStatus, "source-schedule-ready-for-authoritative-execution");
      assert.equal(ready.schedule.noExternalActionsRequired, true);
      assert.deepEqual(ready.schedule.orderedSteps, []);
      assert.equal(ready.schedule.sourceProvenEventFreeFirstCycle, undefined);
      assert.deepEqual(ready.schedule.sourceDrivenEvents.map((event) => event.trigger.frame), [1, 5, 142]);
      assert.equal(ready.schedule.sourceDrivenEvents[0].trigger.execution, "natural-avm1-random-observation-only");
      assert.equal(ready.schedule.sourceDrivenEvents[0].postState.branchSelection.observedOutcome, branch);
      assert.equal(ready.schedule.sourceDrivenEvents[0].postState.branchSelection.selectedInstanceName, `Mc_Sound_${branch}`);
      assert.equal(ready.schedule.sourceDrivenEvents[1].postState.selectedAudio.localFrame, 2);
      assert.equal(ready.schedule.sourceDrivenEvents[1].postState.selectedAudio.playState, "playing");
      assert.equal(ready.schedule.sourceDrivenEvents[2].postState.localFrame, 142);
      assert.equal(ready.schedule.sourceDrivenEvents[2].postState.localPlayState, "stopped");
      assert.deepEqual(ready.schedule.stateCheckpoints.map((checkpoint) => checkpoint.id), [
        `frame-1-natural-sound-${branch}-selected`,
        `frame-5-sound-${branch}-play-dispatched`,
        "frame-142-main-timeline-source-stop",
      ]);
      assert.equal(ready.schedule.terminalSemantics.kind, "stopped-terminal");
      assert.match(ready.schedule.terminalSemantics.outsideThisSpecification.join(" "), /complete original course shell/i);
      assert.match(ready.schedule.terminalSemantics.outsideThisSpecification.join(" "), /authoritative listening/i);
      assert.match(ready.schedule.terminalSemantics.outsideThisSpecification.join(" "), /RMSE/i);
      assert.match(ready.strictAcceptanceEffect, /^none;/);
    }

    const unresolved = specs.filter((spec) => (
      spec.identity.frameDomainId === profile.frameDomainId &&
      (spec.identity.language === "es" || spec.identity.scenario === "sound-from-seed")
    ));
    assert.equal(unresolved.length, animationId.includes("ir-001") ? 4 : 2);
    for (const spec of unresolved) {
      assert.equal(spec.traceSpecStatus, "unresolved");
      assert.equal(spec.schedule.status, "unresolved-no-complete-source-event-schedule");
      assert.deepEqual(spec.schedule.sourceEvidence, []);
      assert.deepEqual(spec.schedule.orderedSteps, []);
      assert.equal(spec.schedule.noExternalActionsRequired, undefined);
      assert.equal(spec.sourceBindings.scheduleDerivation, undefined);
    }
  }
});

test("random-sound schedule derivation fails closed on source, inventory, script, or placement drift", async () => {
  const input = await readRandomSoundPilotDocuments("course-g03-l06-ti-001");

  const changedSource = structuredClone(input);
  changedSource.hashes.sourceSwfSha256 = HASH_A;
  assert.throws(
    () => deriveRandomSoundBranchSourceSchedulesFromEvidence(changedSource),
    /preserved source SWF SHA-256 differs/,
  );

  const changedProjection = structuredClone(input);
  changedProjection.hashes.inventoryTechnicalSha256 = HASH_E;
  assert.throws(
    () => deriveRandomSoundBranchSourceSchedulesFromEvidence(changedProjection),
    /scenario-inventory technical projection differs/,
  );

  const changedScript = structuredClone(input);
  changedScript.inventory.interactions.nonEventScripts.find((item) => item.script === "DefineSprite_21/frame_1/DoAction.as").bodySha256 = HASH_B;
  assert.throws(
    () => deriveRandomSoundBranchSourceSchedulesFromEvidence(changedScript),
    /frame_1\/DoAction\.as body SHA-256 differs/,
  );

  const changedPlacement = structuredClone(input);
  changedPlacement.inventory.timelineInventory
    .find((item) => item.timelineId === "sprite-21")
    .namedPlacements.find((item) => item.name === "Mc_Sound_0").depth = "17";
  assert.throws(
    () => deriveRandomSoundBranchSourceSchedulesFromEvidence(changedPlacement),
    /sound placements differ/,
  );
});

test("canonical TI001/IR001 bindings verify current host, authoring, ActionScript, and source hashes without creating execution proof", async () => {
  for (const animationId of Object.keys(RANDOM_SOUND_PILOTS)) {
    const input = await readRandomSoundPilotDocuments(animationId);
    const bundle = await deriveCanonicalCourseSourceSchedules({
      id: animationId,
      root: path.resolve("."),
      ...input,
    });
    assert.equal(bundle.derivedSchedules.length, 2);
    for (const schedule of bundle.derivedSchedules) {
      const binding = bundle.scheduleDerivationBindings[schedule.requirementId];
      assert.equal(binding.status, "hash-bound-static-source-derived-minimal-child-entry-candidate-not-runtime-execution");
      assert.equal(binding.executionEvidenceCreated, false);
      assert.match(binding.sourceArtifacts.ffdecScripts.sha256, /^[a-f0-9]{64}$/);
      assert.match(binding.sourceArtifacts.swfmillXml.sha256, /^[a-f0-9]{64}$/);
      assert.match(binding.sourceArtifacts.hostEntryEvidence.sha256, /^[a-f0-9]{64}$/);
      assert.match(binding.sourceArtifacts.sameLessonShell.sha256, /^[a-f0-9]{64}$/);
      assert.match(binding.sourceArtifacts.authoringAudit.sha256, /^[a-f0-9]{64}$/);
      assert.match(binding.limitations.join(" "), /not.*full original course shell/i);
      assert.match(binding.limitations.join(" "), /audio/i);
      assert.match(binding.limitations.join(" "), /strict/i);
    }
    if (animationId === "course-g04-l01-ir-001") {
      const binding = Object.values(bundle.scheduleDerivationBindings)[0];
      assert.equal(binding.sourceArtifacts.sourceFla.sha256, "c4ba5fd0b37b1a1ad622f4fdf89295a6b76c820588a8000b239b0f4d68984fb9");
      assert.equal(Object.keys(bundle.scheduleDerivationBindings).some((id) => id.includes("sound-from-seed")), false);
    }
  }
});

function rwRequirement(language) {
  const entryState = {
    kind: "natural-root-placement-entry",
    rootTimelineId: "root",
    rootEntryFrame: 6,
    instanceId: "main-animation",
    frameDomainId: "sprite-334",
    localEntryFrame: 1,
    scenario: "default",
    language,
    seed: "0",
  };
  return {
    requirementId: `req:sprite-334:default:${language}`,
    scenario: "default",
    frameDomainId: "sprite-334",
    traceId: `trace:sprite-334:default:${language}:seed-0`,
    language,
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: 1873},
    entryState,
    entryStateSha256: sha256Text(canonicalJson(entryState)),
    baselineAuthorityRequirement: "original-runtime-natural-trace",
    baselineAuthority: "unresolved",
    status: "blocked",
    blockingEvidence: [{file: "audit/scenario-inventory.json", sha256: HASH_E}],
    capturedFrameCount: 0,
    missingFrames: Array.from({length: 1873}, (_, index) => index + 1),
  };
}

function rwGeometry() {
  return {
    schemaVersion: 1,
    parser: "python-xml.etree.ElementTree",
    matrixConvention: "x'=scaleX*x+skewX*y+transX; y'=skewY*x+scaleY*y+transY",
    twipsPerPixel: 20,
    nativeStage: {height: 600, width: 800},
    rootTimeline: {frameCount: 10},
    sprite: {frameCount: 1873, objectId: 334},
    rootPlacement: {
      depth: 3,
      frame: 6,
      name: "animation",
      objectId: 334,
      transformSourceDecimals: {
        scaleX: "0.9717864990234375",
        scaleY: "0.9717864990234375",
        skewX: "0",
        skewY: "0",
        transX: "8060",
        transY: "5358",
      },
    },
    buttonPlacement: {
      depth: 722,
      frame: 673,
      objectId: 111,
      transformSourceDecimals: {
        scaleX: "6.690597534179688",
        scaleY: "0.5203247070312500",
        skewX: "0",
        skewY: "0",
        transX: "32",
        transY: "-3378",
      },
    },
    buttonRemoval: {depth: 722, frame: 674},
    buttonDefinition: {
      actions: ["Play", "EndAction"],
      hitRecord: {
        depth: 1,
        shapeObjectId: 110,
        transformSourceDecimals: {scaleX: "1", scaleY: "1", skewX: "0", skewY: "0", transX: "0", transY: "0"},
      },
      objectId: 111,
      pointerPush: true,
    },
    hitShape: {
      boundsTwips: {bottom: 270, left: -959, right: 960, top: -260},
      definitionTag: "DefineShape3",
      objectId: 110,
    },
    stageHitBounds: {
      coordinateSpace: "native-stage",
      units: "pixels",
      exactDecimals: {
        bottom: "110.5914614078588783740997314453125",
        height: "13.3995799231342971324920654296875",
        left: "92.791997018607775665203857421875",
        right: "716.642811395972990470703125",
        top: "97.191881484724581241607666015625",
        width: "623.850814377365214805499267578125",
      },
      numeric: {
        bottom: 110.59146140785887,
        height: 13.399579923134297,
        left: 92.79199701860777,
        right: 716.642811395973,
        top: 97.19188148472458,
        width: 623.8508143773652,
      },
      interiorPointExactDecimals: {
        x: "404.7174042072903830679534912109375",
        y: "103.89167144629172980785369873046875",
      },
      interiorPointNumeric: {x: 404.7174042072904, y: 103.89167144629172},
      derivationOrder: ["button-hit-record", "sprite-button-placement", "root-sprite-placement"],
    },
  };
}

function rwDocuments() {
  const manifest = {
    animationId: "course-g05-l13-rw-002",
    source: {
      swf: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/RW/L13RW02.swf",
      swfSha256: RW_SOURCE_SHA256,
    },
    runtime: {frameCount: 10, fps: 12, stage: {width: 800, height: 600}},
    implementation: {
      frameDomains: [{
        id: "root",
        kind: "root",
        sourceTimelineId: "root",
        sourceInstanceId: "root",
        parentFrameDomainId: null,
        frameCount: 10,
        scenarioIds: ["root-standalone"],
      }, {
        id: "sprite-334",
        kind: "nested",
        sourceTimelineId: "sprite-334",
        sourceInstanceId: "main-animation",
        parentFrameDomainId: "root",
        parentEntryFrame: 6,
        localEntryFrame: 1,
        frameCount: 1873,
        scenarioIds: ["default"],
      }],
    },
    scenarios: [
      {id: "root-standalone", kind: "linear", reachable: true},
      {id: "default", kind: "interactive", reachable: true},
    ],
  };
  const ffdecEvidence = (script, lineStart, lineEnd) => ({artifactId: "ffdec-scripts", script, lineStart, lineEnd});
  const inventory = {
    schemaVersion: 1,
    animationId: manifest.animationId,
    inventoryStatus: "static-exhaustive-runtime-unverified",
    migrationStatusChanged: false,
    source: {swf: manifest.source.swf, swfSha256: RW_SOURCE_SHA256},
    evidenceIndex: [
      {artifactId: "source-swf", path: manifest.source.swf, sha256: RW_SOURCE_SHA256},
      {artifactId: "migration-manifest", path: "migration.json", sha256: HASH_B},
      {artifactId: "ffdec-scripts", path: "audit/machine/ffdec-scripts.txt.gz", sha256: HASH_C},
      {artifactId: "swfmill-xml", path: "audit/machine/swfmill.xml.gz", sha256: HASH_D},
    ],
    timelineInventory: [{
      timelineId: "sprite-334",
      objectId: "334",
      frameCount: 1873,
      structuralReachability: "reachable-from-root-placement-graph",
      controlStates: [{frame: 1}, {frame: 673}, {frame: 674}, {frame: 1873}],
      evidence: {artifactId: "swfmill-xml", timelineId: "sprite-334"},
    }],
    interactions: {
      handlers: [{
        script: "DefineButton2_111/BUTTONCONDACTION on(press).as",
        bodySha256: "db5ac07fa9ccaadc3e16bdd6ff43e226ad291348f7794be21f6164828bd1b7d0",
        event: ["press"],
        signals: {transitions: [{target: "play", arguments: ""}]},
        evidence: ffdecEvidence("DefineButton2_111/BUTTONCONDACTION on(press).as", 1, 4),
        hitTarget: {
          buttonObjectId: "111",
          hitRecords: [{depth: "1", shapeObjectId: "110", transform: {transX: "0", transY: "0"}}],
          placements: [{timelineId: "sprite-334", frame: 673, depth: "722", objectId: "111"}],
        },
      }],
      nonEventScripts: [{
        script: "DefineSprite_334/frame_673/DoAction.as",
        bodySha256: "931f1fcd7e02d6574eb3386939e4833bfc33717bcdaf9f0c3ea5e091a735e2b8",
        signals: {
          calls: [{target: "stop", arguments: ""}],
          assignments: [{target: "_global.quizSection", operator: "=", expression: "true"}],
        },
        evidence: ffdecEvidence("DefineSprite_334/frame_673/DoAction.as", 9, 11),
      }, {
        script: "DefineSprite_334/frame_674/DoAction.as",
        bodySha256: "70b687558cb87688f2abb52576857fdb7a866f83112ac7b59b1364392023268e",
        signals: {
          calls: [],
          assignments: [{target: "_global.quizSection", operator: "=", expression: "false"}],
        },
        evidence: ffdecEvidence("DefineSprite_334/frame_674/DoAction.as", 13, 14),
      }, {
        script: "DefineSprite_334/frame_1873/DoAction.as",
        bodySha256: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
        signals: {calls: [{target: "stop", arguments: ""}], assignments: []},
        evidence: ffdecEvidence("DefineSprite_334/frame_1873/DoAction.as", 6, 7),
      }],
    },
    coverage: {
      handlerBehaviorGroups: [],
      buttonTargetObligations: [],
      inputObligations: [],
      dragObligations: [],
      correctWrongObligations: [],
      conditionalBranchObligations: [],
      randomObligations: [],
      labeledStateObligations: [],
      glossaryAndHyperlinkObligations: [],
      sectionMenuObligations: [],
      courseRouteObligations: [],
      sideEffectObligations: [],
      dependencyFixtureObligations: [],
    },
    unknowns: [],
  };
  const coverage = {
    schemaVersion: 2,
    animationId: manifest.animationId,
    requirements: [rwRequirement("en"), rwRequirement("es")],
  };
  return {
    manifest,
    coverage,
    inventory,
    hashes: {
      sourceSwfSha256: RW_SOURCE_SHA256,
      manifestTechnicalSha256: HASH_B,
      coverageTechnicalSha256: HASH_D,
      inventoryTechnicalSha256: HASH_E,
      manifestFileSha256: HASH_B,
      coverageFileSha256: HASH_D,
      inventoryFileSha256: HASH_E,
    },
  };
}

test("derives the RW sprite-334 en/es schedules while leaving execution and canonical coverage at zero", () => {
  const input = rwDocuments();
  const derivedSchedules = deriveRw002SourceSchedulesFromEvidence({...input, geometry: rwGeometry()});
  assert.deepEqual(derivedSchedules.map((item) => item.requirementId), [
    "req:sprite-334:default:en",
    "req:sprite-334:default:es",
  ]);
  const binding = {status: "hash-bound-static-source-derivation-not-runtime-execution"};
  const scheduleDerivationBindings = Object.fromEntries(derivedSchedules.map((item) => [item.requirementId, binding]));
  const specs = buildTraceSpecsFromDocuments({
    id: input.manifest.animationId,
    ...input,
    derivedSchedules,
    scheduleDerivationBindings,
  });
  for (const spec of specs) {
    assert.equal(spec.traceSpecStatus, "source-schedule-ready-for-authoritative-execution");
    assert.deepEqual(spec.schedule.playbackSegments.map((item) => item.requiredRange), [
      {firstFrame: 1, lastFrame: 672},
      {firstFrame: 673, lastFrame: 673},
      {firstFrame: 674, lastFrame: 1872},
      {firstFrame: 1873, lastFrame: 1873},
    ]);
    assert.equal(spec.schedule.orderedSteps[0].action.event, "press");
    assert.equal(spec.schedule.orderedSteps[0].sourceTarget.buttonObjectId, 111);
    assert.equal(spec.schedule.orderedSteps[0].sourceTarget.hitShapeObjectId, 110);
    assert.equal(spec.schedule.orderedSteps[0].sourceTarget.stageHitBounds.exactDecimals.left, "92.791997018607775665203857421875");
    assert.equal(spec.schedule.stateCheckpoints[1].expectedState.globalVariables.quizSection, true);
    assert.equal(spec.schedule.stateCheckpoints[2].expectedState.globalVariables.quizSection, false);
    assert.equal(spec.schedule.terminalSemantics.expectedState.localFrame, 1873);
    assert.equal(spec.executionEvidence.status, "not-executed-by-this-generator");
    assert.equal(spec.executionEvidence.executionReport, null);
    assert.deepEqual(spec.executionEvidence.executedSteps, []);
    assert.match(spec.strictAcceptanceEffect, /^none;/);
  }
  assert.equal(input.coverage.requirements.every((item) => item.status === "blocked" && item.capturedFrameCount === 0), true);

  const gapped = structuredClone(derivedSchedules);
  gapped[0].playbackSegments[2].requiredRange.firstFrame = 675;
  assert.throws(
    () => buildTraceSpecsFromDocuments({id: input.manifest.animationId, ...input, derivedSchedules: gapped, scheduleDerivationBindings}),
    /playbackSegments must be contiguous/,
  );
});

test("RW derivation rejects changed source hashes, FFDec facts, and swfmill geometry", () => {
  const badHash = rwDocuments();
  badHash.manifest.source.swfSha256 = HASH_A;
  assert.throws(
    () => deriveRw002SourceSchedulesFromEvidence({...badHash, geometry: rwGeometry()}),
    /preserved source SWF SHA-256 differs/,
  );

  const badScript = rwDocuments();
  badScript.inventory.interactions.handlers[0].signals.transitions[0].target = "gotoAndPlay";
  assert.throws(
    () => deriveRw002SourceSchedulesFromEvidence({...badScript, geometry: rwGeometry()}),
    /button 111 transition differs/,
  );

  const badGeometry = rwGeometry();
  badGeometry.hitShape.boundsTwips.left = -958;
  const input = rwDocuments();
  assert.throws(
    () => deriveRw002SourceSchedulesFromEvidence({...input, geometry: badGeometry}),
    /hit shape geometry differs/,
  );
});

test("swfmill button parser composes hit-record, child, and root transforms into native-stage bounds", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-button-geometry-"));
  const swfmill = path.join(root, "fixture.xml.gz");
  const xml = `<?xml version="1.0"?>
<swf><Header framerate="12" frames="3"><size><Rectangle left="0" right="16000" top="0" bottom="12000"/></size><tags>
<DefineShape3 objectID="110"><bounds><Rectangle left="0" right="20" top="0" bottom="20"/></bounds></DefineShape3>
<DefineButton2 objectID="111"><buttons><Button hitTest="1" objectID="110" depth="1"><transform><Transform transX="0" transY="0"/></transform></Button></buttons><conditions><Condition pointerPush="1"><actions><Play/><EndAction/></actions></Condition></conditions></DefineButton2>
<DefineSprite objectID="334" frames="4"><tags><ShowFrame/><PlaceObject2 depth="722" objectID="111"><transform><Transform scaleX="3" scaleY="4" transX="10" transY="20"/></transform></PlaceObject2><ShowFrame/><RemoveObject2 depth="722"/><ShowFrame/><ShowFrame/></tags></DefineSprite>
<ShowFrame/><PlaceObject2 depth="3" objectID="334" name="animation"><transform><Transform scaleX="2" scaleY="2" transX="100" transY="200"/></transform></PlaceObject2><ShowFrame/><ShowFrame/>
</tags></Header></swf>`;
  await writeFile(swfmill, gzipSync(Buffer.from(xml)));
  const parser = path.resolve("scripts/parse-swfmill-course-button-trace.py");
  const {stdout} = await execFile("python3", [
    parser,
    "--swfmill", swfmill,
    "--sprite-object-id", "334",
    "--root-placement-name", "animation",
    "--root-placement-frame", "2",
    "--button-object-id", "111",
    "--hit-shape-object-id", "110",
    "--button-frame", "2",
    "--button-depth", "722",
    "--button-removal-frame", "3",
  ]);
  const parsed = JSON.parse(stdout);
  assert.deepEqual(parsed.stageHitBounds.exactDecimals, {
    bottom: "20",
    height: "8",
    left: "6",
    right: "12",
    top: "12",
    width: "6",
  });
  assert.deepEqual(parsed.stageHitBounds.interiorPointExactDecimals, {x: "9", y: "16"});
  assert.deepEqual(parsed.stageHitBounds.derivationOrder, ["button-hit-record", "sprite-button-placement", "root-sprite-placement"]);
});

async function writeCanonicalPilotFixture(root) {
  const migrationsRoot = path.join(root, "migrations");
  const sourceRoot = path.join(root, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
  await mkdir(sourceRoot, {recursive: true});
  for (const id of COURSE_TRACE_PILOT_IDS) {
    const workspace = path.join(migrationsRoot, id);
    await mkdir(path.join(workspace, "audit"), {recursive: true});
    await mkdir(path.join(workspace, "evidence"), {recursive: true});
    const sourceRelative = `source-assets/flash/HELP MATH_ORIGINAL FILES/${id}.swf`;
    const sourceBytes = Buffer.from(`preserved-${id}`);
    const sourceHash = sha256Text(sourceBytes);
    await writeFile(path.join(root, sourceRelative), sourceBytes);
    const base = id === TS006_ID ? ts006Documents() : documents({id});
    if (id.startsWith("shell-course-")) {
      base.manifest.scenarios[0].kind = "interactive";
      base.coverage.requirements[0].baselineAuthorityRequirement = "original-runtime-natural-trace";
    }
    base.manifest.source = {swf: sourceRelative, swfSha256: sourceHash};
    const manifestText = `${JSON.stringify(base.manifest, null, 2)}\n`;
    const manifestHash = sha256Text(manifestText);
    base.inventory.source = {swf: sourceRelative, swfSha256: sourceHash};
    base.inventory.evidenceIndex[0] = {artifactId: "source-swf", path: sourceRelative, sha256: sourceHash};
    base.inventory.evidenceIndex[1].sha256 = manifestHash;
    const inventoryText = `${JSON.stringify(base.inventory, null, 2)}\n`;
    const inventoryHash = sha256Text(inventoryText);
    for (const item of base.coverage.requirements) item.blockingEvidence[0].sha256 = inventoryHash;
    await Promise.all([
      writeFile(path.join(workspace, "migration.json"), manifestText),
      writeFile(path.join(workspace, "audit", "scenario-inventory.json"), inventoryText),
      writeFile(path.join(workspace, "evidence", "full-frame-coverage.json"), `${JSON.stringify(base.coverage, null, 2)}\n`),
    ]);
  }
  return migrationsRoot;
}

async function writeReleaseTraceFixture(root) {
  const releaseId = "lesson-fixture-trace-specs";
  const ids = ["course-fixture-trace-one", "shell-fixture-trace-two"];
  const migrationsRoot = path.join(root, "migrations");
  const sourceRoot = path.join(root, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
  const catalogPath = path.join(root, "catalog", "lesson-releases.json");
  await Promise.all([
    mkdir(sourceRoot, {recursive: true}),
    mkdir(path.dirname(catalogPath), {recursive: true}),
    mkdir(migrationsRoot, {recursive: true}),
  ]);
  const members = [];
  for (const [index, id] of ids.entries()) {
    const workspace = path.join(migrationsRoot, id);
    await Promise.all([
      mkdir(path.join(workspace, "audit"), {recursive: true}),
      mkdir(path.join(workspace, "evidence"), {recursive: true}),
    ]);
    const catalogSourcePath = index === 0
      ? "HELP_COURSES/ELMGR4/L10/VB/FIXTURE01.swf"
      : "HELP_COURSES/ELMGR4/L10/index_local.swf";
    const sourceRelative = `source-assets/flash/HELP MATH_ORIGINAL FILES/${catalogSourcePath}`;
    const sourceBytes = Buffer.from(`preserved-release-${id}`);
    const sourceHash = sha256Text(sourceBytes);
    await mkdir(path.dirname(path.join(root, sourceRelative)), {recursive: true});
    await writeFile(path.join(root, sourceRelative), sourceBytes);

    const base = documents({id});
    base.manifest.id = id;
    base.manifest.assetId = `swf-${sourceHash}`;
    base.manifest.source = {
      placementPath: sourceRelative,
      swf: sourceRelative,
      swfSha256: sourceHash,
    };
    base.inventory.source = {swf: sourceRelative, swfSha256: sourceHash};
    base.inventory.evidenceIndex[0] = {artifactId: "source-swf", path: sourceRelative, sha256: sourceHash};
    base.inventory.timelineInventory.push({
      timelineId: "sprite-9",
      frameCount: 12,
      structuralReachability: "reachable-from-root-placement-graph",
      controlStates: [{frame: 1, reasons: ["initial-one-indexed-frame"]}],
      evidence: {artifactId: "swfmill-xml", timelineId: "sprite-9"},
    });
    const manifestText = `${JSON.stringify(base.manifest, null, 2)}\n`;
    base.inventory.evidenceIndex[1].sha256 = sha256Text(manifestText);
    const inventoryText = `${JSON.stringify(base.inventory, null, 2)}\n`;
    const inventoryHash = sha256Text(inventoryText);
    for (const requirementEntry of base.coverage.requirements) {
      requirementEntry.blockingEvidence[0].sha256 = inventoryHash;
    }
    const coverageText = `${JSON.stringify(base.coverage, null, 2)}\n`;
    const declaredTimeline = (domain) => ({
      timelineId: domain.sourceTimelineId,
      sourceTimelineId: domain.sourceTimelineId,
      sourceObjectId: domain.id === "root" ? null : domain.sourceTimelineId.replace("sprite-", ""),
      frameCount: domain.frameCount,
      structuralReachability: domain.id === "root" ? "root" : "reachable-from-root-placement-graph",
      declaredFrameDomains: [{
        frameDomainId: domain.id,
        kind: domain.kind,
        sourceTimelineId: domain.sourceTimelineId,
        sourceInstanceId: domain.sourceInstanceId,
        parentFrameDomainId: domain.parentFrameDomainId,
        parentEntryFrame: domain.parentEntryFrame ?? null,
        localEntryFrame: domain.localEntryFrame ?? null,
        frameCount: domain.frameCount,
      }],
      disposition: "declared-frame-domain",
    });
    const disposition = {
      schemaVersion: 1,
      animationId: id,
      status: "structurally-enumerated-dispositions-unresolved",
      migrationStatusChanged: false,
      generatedFrom: {
        scenarioInventory: {
          path: "audit/scenario-inventory.json",
          sha256: inventoryHash,
          schemaVersion: 1,
          inventoryStatus: "static-exhaustive-runtime-unverified",
        },
        migrationManifest: {
          path: "migration.json",
          technicalProjection: "help-math-technical-manifest-v1",
          technicalProjectionSha256: technicalManifestSha256(base.manifest),
        },
        sourceSwf: {path: sourceRelative, sha256: sourceHash},
      },
      summary: {
        dispositionCounts: {
          "declared-frame-domain": 2,
          "composite-child-with-parent": 0,
          "independent-required": 0,
          nonvisual: 0,
          unresolved: 1,
        },
        highRiskIndependentCandidateCount: 1,
      },
      timelines: [
        ...base.manifest.implementation.frameDomains.map(declaredTimeline),
        {
          timelineId: "sprite-9",
          sourceTimelineId: "sprite-9",
          sourceObjectId: "9",
          frameCount: 12,
          structuralReachability: "reachable-from-root-placement-graph",
          declaredFrameDomains: [],
          disposition: "unresolved",
        },
      ],
    };
    await Promise.all([
      writeFile(path.join(workspace, "migration.json"), manifestText),
      writeFile(path.join(workspace, "audit", "scenario-inventory.json"), inventoryText),
      writeFile(path.join(workspace, "audit", "frame-domain-disposition.json"), `${JSON.stringify(disposition, null, 2)}\n`),
      writeFile(path.join(workspace, "evidence", "full-frame-coverage.json"), coverageText),
    ]);
    members.push({
      ordinal: index + 1,
      animationId: id,
      assetId: `swf-${sourceHash}`,
      releaseRole: index === 0 ? "active-xml-referenced-page" : "lesson-shell",
      shardId: index === 0 ? "fixture-pages" : "fixture-shell",
      source: {path: catalogSourcePath, sha256: sourceHash},
    });
  }
  const catalog = {
    schemaVersion: 1,
    releases: [{
      releaseId,
      publicationMode: "atomic",
      expectedCounts: {members: members.length, shards: 2},
      shards: [
        {ordinal: 1, shardId: "fixture-pages", memberCount: 1},
        {ordinal: 2, shardId: "fixture-shell", memberCount: 1},
      ],
      members,
    }],
  };
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  return {releaseId, ids, migrationsRoot, catalogPath};
}

test("writes and checks exactly one hash-indexed spec per requirement for every canonical pilot", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-trace-specs-"));
  const migrationsRoot = await writeCanonicalPilotFixture(root);
  const factoryOptions = {
    projectRoot: root,
    migrationsRoot,
    ids: COURSE_TRACE_PILOT_IDS,
    sourceScheduleDeriver: NO_DERIVED_SCHEDULES,
    pendingTracePlanSourceBindingResolver: FIXTURE_PENDING_PLAN_SOURCE_BINDINGS,
  };
  const written = await buildCourseTraceSpecs(factoryOptions);
  assert.equal(Object.hasOwn(written, "mode"), false);
  assert.equal(written.pilotCount, COURSE_TRACE_PILOT_IDS.length);
  assert.equal(written.requirementCount, COURSE_TRACE_PILOT_IDS.length + 3);
  assert.equal(written.unresolvedCount, 5);
  assert.equal(written.frameAccurateRootReadyCount, 9);
  assert.equal(written.pilots.every((item) => item.action === "written"), true);

  const checked = await buildCourseTraceSpecs({...factoryOptions, check: true});
  assert.equal(checked.pilotCount, COURSE_TRACE_PILOT_IDS.length);
  assert.equal(checked.pilots.every((item) => item.action === "verified"), true);
  const index = JSON.parse(await readFile(path.join(migrationsRoot, "course-shell-pilot-trace-spec-index.json"), "utf8"));
  assert.equal(index.pilotCount, COURSE_TRACE_PILOT_IDS.length);
  assert.equal(index.pilots.every((pilot) => pilot.traceSpecs.length === pilot.requirementCount), true);
  assert.equal(index.pilots.every((pilot) => pilot.traceSpecs.every((item) => /^[a-f0-9]{64}$/.test(item.sha256))), true);

  const firstFile = path.join(root, index.pilots[0].traceSpecs[0].file);
  await writeFile(firstFile, "{}\n", "utf8");
  await assert.rejects(
    buildCourseTraceSpecs({...factoryOptions, check: true}),
    /stale trace spec/,
  );

  await buildCourseTraceSpecs(factoryOptions);
  const missingFile = path.join(root, index.pilots.at(-1).traceSpecs[0].file);
  await unlink(missingFile);
  await assert.rejects(
    buildCourseTraceSpecs({...factoryOptions, check: true}),
    /missing trace spec/,
  );
});

test("writes isolated release specs and a selection-specific index bound to exact inventory and disposition bytes", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-release-trace-specs-"));
  const fixture = await writeReleaseTraceFixture(root);
  const legacyIndexPath = path.join(fixture.migrationsRoot, "course-shell-pilot-trace-spec-index.json");
  const legacyIndexBytes = "{\"sentinel\":true}\n";
  await writeFile(legacyIndexPath, legacyIndexBytes);
  const factoryOptions = {
    projectRoot: root,
    migrationsRoot: fixture.migrationsRoot,
    lessonReleasesPath: fixture.catalogPath,
    releaseId: fixture.releaseId,
    ids: [fixture.ids[1], fixture.ids[0]],
    sourceScheduleDeriver: NO_DERIVED_SCHEDULES,
    pendingTracePlanSourceBindingResolver: async () => ({}),
  };
  const written = await buildCourseTraceSpecs(factoryOptions);
  assert.equal(written.mode, "lesson-release");
  assert.equal(written.selectionScope, "verified-subset");
  assert.equal(written.memberCount, 2);
  assert.equal(written.atomicReleaseMemberCount, 2);
  assert.equal(written.frameDomainDispositionUnresolvedCount, 2);
  assert.deepEqual(written.pilots.map(({animationId}) => animationId), fixture.ids);
  assert.match(written.index, /lesson-release-trace-spec-indexes\/lesson-fixture-trace-specs--subset-[a-f0-9]{64}\.json$/);
  assert.equal(await readFile(legacyIndexPath, "utf8"), legacyIndexBytes);

  const index = JSON.parse(await readFile(path.join(root, written.index), "utf8"));
  assert.equal(index.artifactType, "lesson-release-original-runtime-trace-spec-index");
  assert.equal(index.status, "blocked-by-unresolved-frame-domain-dispositions");
  assert.equal(index.releaseSelection.fullAtomicReleaseSelected, false);
  assert.deepEqual(index.members.map(({animationId}) => animationId), fixture.ids);
  assert.equal(index.members.every((entry) => entry.technicalBindings.frameDomainDisposition.unresolvedTimelineCount === 1), true);
  assert.equal(index.members.every((entry) => /^[a-f0-9]{64}$/.test(entry.technicalBindings.scenarioInventoryExactFile.sha256)), true);

  const firstSpecEntry = index.members[0].traceSpecs[0];
  assert.match(firstSpecEntry.file, /audit\/trace-specs\/lesson-releases\/lesson-fixture-trace-specs\//);
  const firstSpec = JSON.parse(await readFile(path.join(root, firstSpecEntry.file), "utf8"));
  assert.equal(firstSpec.lessonReleaseMembership.releaseId, fixture.releaseId);
  assert.equal(firstSpec.lessonReleaseMembership.publicationAuthorized, false);
  assert.equal(
    firstSpec.sourceBindings.frameDomainDisposition.scenarioInventoryFileSha256,
    firstSpec.sourceBindings.scenarioInventoryExactFile.sha256,
  );
  assert.equal(firstSpec.sourceBindings.frameDomainDisposition.unresolvedTimelineCount, 1);
  assert.equal(firstSpec.traceSpecStatus, "source-frame-accurate-root-ready-for-authoritative-capture");
  assert.match(firstSpec.strictAcceptanceEffect, /^none;/);

  const checked = await buildCourseTraceSpecs({...factoryOptions, check: true});
  assert.equal(checked.action, "verified");
});

test("release preflight rejects a stale disposition before writing any release trace index", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-release-trace-preflight-"));
  const fixture = await writeReleaseTraceFixture(root);
  const dispositionPath = path.join(
    fixture.migrationsRoot,
    fixture.ids[1],
    "audit",
    "frame-domain-disposition.json",
  );
  const disposition = JSON.parse(await readFile(dispositionPath, "utf8"));
  disposition.generatedFrom.scenarioInventory.sha256 = HASH_A;
  await writeFile(dispositionPath, `${JSON.stringify(disposition, null, 2)}\n`);
  await assert.rejects(
    buildCourseTraceSpecs({
      projectRoot: root,
      migrationsRoot: fixture.migrationsRoot,
      lessonReleasesPath: fixture.catalogPath,
      releaseId: fixture.releaseId,
      sourceScheduleDeriver: NO_DERIVED_SCHEDULES,
      pendingTracePlanSourceBindingResolver: async () => ({}),
    }),
    /does not bind the exact scenario-inventory file SHA-256/,
  );
  const indexPath = path.join(
    fixture.migrationsRoot,
    "lesson-release-trace-spec-indexes",
    `${fixture.releaseId}.json`,
  );
  await assert.rejects(readFile(indexPath), /ENOENT/);
  for (const id of fixture.ids) {
    await assert.rejects(
      readFile(path.join(
        fixture.migrationsRoot,
        id,
        "audit",
        "trace-specs",
        "lesson-releases",
        fixture.releaseId,
        "req-root-root-standalone-en.json",
      )),
      /ENOENT/,
    );
  }
});
