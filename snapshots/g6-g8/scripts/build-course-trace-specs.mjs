#!/usr/bin/env node

import {createHash} from "node:crypto";
import {execFile as execFileCallback} from "node:child_process";
import {createReadStream} from "node:fs";
import {access, lstat, mkdir, readFile, readdir, realpath, unlink, writeFile} from "node:fs/promises";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";
import {
  CANONICAL_PROJECTION_ENCODING,
  SCENARIO_INVENTORY_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  projectionDescriptor,
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {
  assertStrictFullDomainRequirement,
  classifyStrictFullDomainRequirement,
} from "./lib/strict-full-domain-requirement.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const defaultMigrationsRoot = path.join(projectRoot, "migrations");
const defaultLessonReleasesPath = path.join(projectRoot, "catalog", "lesson-releases.json");
const GLOBAL_INDEX_BASENAME = "course-shell-pilot-trace-spec-index.json";
const RELEASE_INDEX_DIRECTORY = "lesson-release-trace-spec-indexes";
const execFile = promisify(execFileCallback);

export const COURSE_TRACE_PILOT_IDS = Object.freeze([
  "course-g03-l01-ts-008",
  "course-g03-l01-vb-004",
  "course-g03-l06-fq-002-review",
  "course-g03-l06-ti-001",
  "course-g03-l08-re-001",
  "course-g04-l01-ir-001",
  "course-g04-l03-in-009",
  "course-g04-l03-ts-006",
  "course-g04-l09-gs-002",
  "course-g05-l13-rw-002",
  "shell-course-g04-l01-index-local",
]);

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_CATALOG_ID = /^[a-z0-9][a-z0-9-]{2,127}$/;
const PRESERVED_SOURCE_PREFIX = "source-assets/flash/HELP MATH_ORIGINAL FILES/";
const BASELINE_AUTHORITIES = new Set([
  "original-runtime-frame-accurate",
  "original-runtime-natural-trace",
]);
const READY_SCHEDULE_STATUS = "source-evidenced-executable";
const TERMINAL_SEMANTICS_KINDS = new Set([
  "stopped-terminal",
  "first-cycle-boundary-playing",
  "host-navigation-terminal",
]);
const TS006_TRACE_PROFILE = Object.freeze({
  animationId: "course-g04-l03-ts-006",
  targetSequence: 34,
  rootFrameDomainId: "root",
  nestedFrameDomainId: "sprite-23",
  rootEntryFrame: 1,
  beginFrame: 6,
  nestedTerminalFrame: 128,
  primaryAcquisitionMode: "primary-natural-same-lesson-host-trace",
  supplementalAcquisitionMode: "supplemental-sequential-frame-step-after-natural-trace",
  spanishNarrationControl: Object.freeze({
    label: "En esta p\u00e1gina",
    timelineId: "root",
    frame: 49,
    instanceName: "SA",
    buttonObjectId: "217",
    hitShapeObjectId: "212",
    depth: "202",
    event: "pointer-release-inside",
    actionScript: "DefineButton2_217/BUTTONCONDACTION on(release).as",
    actionScriptLineStart: 175,
    actionScriptLineEnd: 178,
    actionScriptBodySha256: "3a1f4f0b8803ee1c00cd733ff84fbb275949c35d2ab452f79511d06416113a29",
    callee: "_root.doPlaySpanishAudio",
    nativeStagePoint: Object.freeze({x: 699, y: 95}),
    nativeStageBounds: Object.freeze({left: 633.9, right: 762.65, top: 84.4, bottom: 106.4}),
  }),
  pendingPlanSourceBindings: Object.freeze({
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
  }),
});
const RW_002_TRACE_PROFILE = Object.freeze({
  animationId: "course-g05-l13-rw-002",
  sourceSwfSha256: "bf9ab1d12832fbe54c5bef08d0dd51307169eefbae1f75188efd9db94ed9e4e6",
  frameDomainId: "sprite-334",
  sourceObjectId: "334",
  rootEntryFrame: 6,
  frameCount: 1873,
  firstStopFrame: 673,
  resumeFrame: 674,
  terminalStopFrame: 1873,
  buttonObjectId: "111",
  hitShapeObjectId: "110",
  buttonDepth: "722",
  buttonHandlerBodySha256: "db5ac07fa9ccaadc3e16bdd6ff43e226ad291348f7794be21f6164828bd1b7d0",
  firstStopBodySha256: "931f1fcd7e02d6574eb3386939e4833bfc33717bcdaf9f0c3ea5e091a735e2b8",
  resumeBodySha256: "70b687558cb87688f2abb52576857fdb7a866f83112ac7b59b1364392023268e",
  terminalStopBodySha256: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
});
const RW_002_GEOMETRY_PARSER = "scripts/parse-swfmill-course-button-trace.py";
const RANDOM_SOUND_SCRIPT_BODY_SHA256 = Object.freeze({
  naturalRandomSelection: "534196db1b9352db95897e78166465293f70844f5b18292d5da450cfeb3e9cbe",
  selectedAudioDispatch: "4b2a8ea86d7a09876c10ea6d2e0abd838f294518275642d3c7f68c2257c8f16e",
  stop: "2443ef5abd9a49f54017c2a509cda1259fb4f8a3e44bc3cfe669addf2fd291db",
  childPreloaderRequest: "a5082f87ce78b956c1437a6752536a29d6ab81602f2eef0cdc2ea4053c4283e3",
});
const RANDOM_SOUND_TRACE_PROFILES = Object.freeze({
  "course-g03-l06-ti-001": Object.freeze({
    animationId: "course-g03-l06-ti-001",
    sourceSwfPath: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/TI/L6TI01.swf",
    sourceSwfSha256: "722b56b73cfc3bcff71c83cf71b00bfc89b4fdd3b147ecb43646f644f45dc739",
    inventoryTechnicalSha256: "1c74345f4a18c3e61e4e958d1c2f60ece351f05b274542aaef6c801e9ad4b7e7",
    frameDomainId: "sprite-21",
    sourceObjectId: "21",
    ffdecScriptsSha256: "6795b7dd17e1f709b7e3815c1cfc0dea57f2c3ae7a9fcee2a63c808e155b6e7f",
    swfmillXmlSha256: "65f12db57b8c694a119596134a44b1404826a30aaa24e1711e7bfe5a8188e5e1",
    courseXml: {
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/index.xml",
      sha256: "d4f6b7efb8de3fff2cd28bdf31a5d97e24831a3af3fd8ee3cf13b16eb8c98a50",
      placementLine: 123,
      placementStatus: "commented-historical-placement-deliberate-isolated-load-required",
    },
    indexedHostArtifactId: "host-binding-resolution",
    branches: Object.freeze([
      {scenario: "sound-0", outcome: 0, instanceName: "Mc_Sound_0", objectId: "7", depth: "16"},
      {scenario: "sound-1", outcome: 1, instanceName: "Mc_Sound_1", objectId: "8", depth: "18"},
    ]),
    expectedNestedRequirementIds: Object.freeze([
      "req:sprite-21:sound-0:en",
      "req:sprite-21:sound-0:es",
      "req:sprite-21:sound-1:en",
      "req:sprite-21:sound-1:es",
    ]),
    boundArtifacts: Object.freeze({
      sourceSwf: {
        path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/TI/L6TI01.swf",
        sha256: "722b56b73cfc3bcff71c83cf71b00bfc89b4fdd3b147ecb43646f644f45dc739",
        role: "untouched-shipped-child-swf",
      },
      hostEntryEvidence: {
        path: "migrations/course-g03-l06-ti-001/audit/host-binding-resolution.json",
        sha256: "30ee21c4a44418f22d3fbb62024020ef64c55b75d1992e9d24ddf923f7aabae3",
        role: "static-same-lesson-preloader-handoff-and-binding-resolution",
      },
      sameLessonShell: {
        path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/index_local.swf",
        sha256: "30d7e3e88215796190e0bf50c7fab912ae7dde24f8d4093ef77f137ad03ac498",
        role: "untouched-same-lesson-shell-static-source",
      },
      hostEntryExcerptFrame2: {
        path: "migrations/course-g03-l06-ti-001/audit/host-shell-static/DefineSprite_179-frame_2-DoAction.as",
        sha256: "6bf7e12013255f6b14ee4e415135fa8ea08cb6b05e3b837174ead2cbfbfbeffc",
        role: "normalized-same-lesson-preloader-progress-excerpt",
      },
      hostEntryExcerptFrame3: {
        path: "migrations/course-g03-l06-ti-001/audit/host-shell-static/DefineSprite_179-frame_3-DoAction.as",
        sha256: "5ddff1cbdcbbd78927c49c707b0509cb040fad56bcda963156934cc3f972e2fc",
        role: "normalized-same-lesson-begin-handoff-excerpt",
      },
      authoringAudit: {
        path: "migrations/course-g04-l01-ir-001/audit/adobe-animate-2021-authoring-audit.json",
        sha256: "27de76cabebadbf1dd58dc9562c15b4786c93ffb5cc7be350aadaa07dc5241d7",
        role: "paired-common-component-corroboration-only-not-TI-authoring-proof",
      },
      audioRuntimeEvidence: {
        path: "migrations/course-g03-l06-ti-001/audit/audio-runtime-evidence.json",
        sha256: "beb5db3876bce9f3520e45664aacbb68bc3a95c613548714fdf72ae94a8d35a1",
        role: "structural-embedded-soundstream-audit-listening-and-sync-pending",
      },
      courseXml: {
        path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR3/L6/index.xml",
        sha256: "d4f6b7efb8de3fff2cd28bdf31a5d97e24831a3af3fd8ee3cf13b16eb8c98a50",
        role: "commented-historical-course-placement",
      },
    }),
  }),
  "course-g04-l01-ir-001": Object.freeze({
    animationId: "course-g04-l01-ir-001",
    sourceSwfPath: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/IR/L1RW01.swf",
    sourceSwfSha256: "b21b16d1e5756820b5703136708f625dcc3a324d629b2337b1dc42af64559e46",
    sourceFlaPath: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/IR/L1RW01.fla",
    sourceFlaSha256: "c4ba5fd0b37b1a1ad622f4fdf89295a6b76c820588a8000b239b0f4d68984fb9",
    inventoryTechnicalSha256: "c8545d9ba83b5b90d0c62cc1bc908297104058159335594066322c896861cf7f",
    frameDomainId: "sprite-58",
    sourceObjectId: "58",
    ffdecScriptsSha256: "0cacaa6ea5de3d6b08015d04c06c4aa23aa42f54ed8d58f0c62059268b6ad723",
    swfmillXmlSha256: "1fcd12a83f15f09becb8f12be8007f42e11953990c89297dc9d74e90963ea173",
    courseXml: {
      path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/index.xml",
      sha256: "b14d31c2f2c7cd83cc1e2de8bfe5463734b64572756b2677c09e851c46c670b2",
      placementLine: 25,
      placementStatus: "active-course-page-random-audio-yes",
    },
    indexedHostArtifactId: null,
    branches: Object.freeze([
      {scenario: "sound-0", outcome: 0, instanceName: "Mc_Sound_0", objectId: "7", depth: "234"},
      {scenario: "sound-1", outcome: 1, instanceName: "Mc_Sound_1", objectId: "8", depth: "236"},
    ]),
    expectedNestedRequirementIds: Object.freeze([
      "req:sprite-58:sound-0:en",
      "req:sprite-58:sound-0:es",
      "req:sprite-58:sound-1:en",
      "req:sprite-58:sound-1:es",
      "req:sprite-58:sound-from-seed:en",
      "req:sprite-58:sound-from-seed:es",
    ]),
    boundArtifacts: Object.freeze({
      sourceSwf: {
        path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/IR/L1RW01.swf",
        sha256: "b21b16d1e5756820b5703136708f625dcc3a324d629b2337b1dc42af64559e46",
        role: "untouched-shipped-child-swf",
      },
      sourceFla: {
        path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/IR/L1RW01.fla",
        sha256: "c4ba5fd0b37b1a1ad622f4fdf89295a6b76c820588a8000b239b0f4d68984fb9",
        role: "paired-owner-provided-binary-FLA-authoring-source",
      },
      hostEntryEvidence: {
        path: "migrations/course-g04-l01-ir-001/audit/same-lesson-shell-host-entry-binding.json",
        sha256: "aea94d12b8d8a0ce4fe17ce0925a0660827d916e975d9e2097436a017c46c585",
        role: "static-same-lesson-preloader-handoff-and-full-shell-boundary-qualification",
      },
      sameLessonShell: {
        path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/index_local.swf",
        sha256: "ade6cd4b47d8948ae975b6cbceac2c24c91341e94b61e4ce683b4307f373779e",
        role: "untouched-same-lesson-shell-static-source",
      },
      authoringAudit: {
        path: "migrations/course-g04-l01-ir-001/audit/adobe-animate-2021-authoring-audit.json",
        sha256: "27de76cabebadbf1dd58dc9562c15b4786c93ffb5cc7be350aadaa07dc5241d7",
        role: "hash-bound-Adobe-Animate-2021-FLA-authoring-audit",
      },
      audioRuntimeEvidence: {
        path: "migrations/course-g04-l01-ir-001/audit/audio-runtime-evidence.json",
        sha256: "a104a35fd92af2b863230bbfb991431a99fb5113a486df8e5f9fde4be754eef9",
        role: "structural-embedded-soundstream-audit-listening-and-sync-pending",
      },
      courseXml: {
        path: "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/index.xml",
        sha256: "b14d31c2f2c7cd83cc1e2de8bfe5463734b64572756b2677c09e851c46c670b2",
        role: "active-course-placement-random-audio-yes",
      },
    }),
  }),
});

const ORDERED_STEP_SCHEMA = Object.freeze({
  description: "Schema required for each future source-evidenced step. Empty unresolved orderedSteps are intentional and must not be filled from product behavior or inference.",
  required: [
    "order",
    "action",
    "sourceTarget",
    "preStateCheckpoint",
    "postStateCheckpoint",
    "evidence",
  ],
  properties: {
    order: "one-indexed integer contiguous with the preceding step",
    action: "exact source event and input; never a guessed click, key, coordinate, value, or delay",
    sourceTarget: "source timeline/instance/object/script target plus authoritative locator",
    preStateCheckpoint: "complete source-observable state required before dispatch",
    postStateCheckpoint: "complete source-observable state required after dispatch",
    evidence: "one or more scenario-inventory artifact references that prove this exact step and ordering",
    terminalEffect: "optional source-evidenced relationship to completion, Replay, navigation, score, or stop state",
  },
});

const EXECUTION_PROOF_SCHEMA = Object.freeze({
  description: "Contract for a future authorized-original-runtime execution report. A report that only repeats identifiers or hashes is insufficient.",
  required: [
    "schemaVersion",
    "status",
    "proofMode",
    "animationId",
    "requirementId",
    "identity",
    "traceSpecBinding",
    "authorizedRuntime",
    "rawEventLog",
    "sourceTargetResolutionLog",
    "stateSnapshotArchive",
    "originalRuntimeCaptureManifest",
    "frameResults",
    "orderedStepResults",
    "stateCheckpointResults",
    "terminalResult",
    "unexpectedEvents",
    "sequenceChainSha256",
  ],
  invariants: [
    "traceSpecBinding.file and traceSpecBinding.sha256 must identify the exact indexed trace spec used for execution.",
    "orderedStepResults length, one-indexed order, scheduledStepSha256, dispatchedAction, and resolvedSourceTarget must exactly match schedule.orderedSteps.",
    "Each step must preserve an actual monotonic eventSequence index, raw-log locator, pre/post observed state, frame-domain/root/local playheads, and evidence hashes; identifier echoing is not execution proof.",
    "Each result record is chain-bound to the preceding result hash. sequenceChainSha256 must end at the last canonical result record, or at the signed zero-action observation when noActionsRequired is source-evidenced.",
    "stateCheckpointResults must cover every declared checkpoint and compare expectedState with observedState. Missing, extra, reordered, or mismatched events/checkpoints make status failed.",
    "terminalResult must compare the source-evidenced terminal semantics with observed completion/stop/navigation/score/audio/Replay state and must include capture/log hashes.",
    "unexpectedEvents must be empty for a passing report; legacy network, host-command, JavaScript bridge, or persistent side effects remain disabled and recorded.",
    "For frame-accurate root proof, frameResults must contain every required root frame exactly once in strict order and bind the positioning operation, runtime-observed frame, display-list state hash, native-size bitmap, capture-log locator, and previous result hash.",
    "direct-seek-root-exhaustive requires one original-runtime direct-seek operation per frame. sequential-step-root-exhaustive requires a Rewind observation at frame 1 followed by exactly one Step Forward operation for each frame 2..N. Neither positioning mode proves natural playback.",
  ],
  orderedStepResultRequired: [
    "order",
    "scheduledStepSha256",
    "eventSequence",
    "rawEventLogLocator",
    "dispatchedAction",
    "resolvedSourceTarget",
    "preState",
    "postState",
    "frameEvidence",
    "previousResultSha256",
    "resultSha256",
    "result",
  ],
  stateObservationRequired: [
    "observedState",
    "observedStateSha256",
    "rootFrame",
    "frameDomainId",
    "localFrame",
    "screenshotSha256",
    "eventLogOffset",
  ],
  frameAccurateRootResultRequired: [
    "frame",
    "positioningOperation",
    "operationCountSincePrevious",
    "requestSequence",
    "captureLogLocator",
    "observedRootFrame",
    "observedDisplayListStateSha256",
    "screenshotFile",
    "screenshotSha256",
    "width",
    "height",
    "previousResultSha256",
    "resultSha256",
    "result",
  ],
  rawEvidenceRequired: [
    "authorizedRuntime version/build and launch protocol",
    "append-only raw event log path/SHA-256",
    "source-target resolution log path/SHA-256",
    "state-snapshot archive path/SHA-256",
    "original-runtime frame capture manifest path/SHA-256",
  ],
});

function executionProofSchemaFor(schedule) {
  if (schedule?.noExternalActionsRequired !== true) return EXECUTION_PROOF_SCHEMA;
  return {
    ...EXECUTION_PROOF_SCHEMA,
    required: [...EXECUTION_PROOF_SCHEMA.required, "sourceDrivenEventResults", "zeroActionObservation"],
    invariants: [
      ...EXECUTION_PROOF_SCHEMA.invariants,
      "noExternalActionsRequired requires zero operator dispatches. sourceDrivenEventResults must instead match every declared sourceDrivenEvent by exact count, order, schedule hash, observed trigger/target, pre/post state, raw-log locator, and hash chain.",
      "sourceProvenEventFreeFirstCycle requires empty sourceDrivenEventResults. Its zeroActionObservation continues the chain from null; a source-driven first cycle continues from the final sourceDrivenEventResult hash.",
    ],
    sourceDrivenEventResultRequired: [
      "order",
      "scheduledEventSha256",
      "eventSequence",
      "rawEventLogLocator",
      "observedTrigger",
      "resolvedSourceTarget",
      "preState",
      "postState",
      "frameEvidence",
      "previousResultSha256",
      "resultSha256",
      "result",
    ],
  };
}

function canonicalEqual(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function artifactDescriptor(value, label) {
  assertPlainObject(value, label);
  assertNonEmptyString(value.file, `${label}.file`);
  assertSha256(value.sha256, `${label}.sha256`);
  return value;
}

function canonicalRecordSha256(record, hashField = "resultSha256") {
  const payload = {...record};
  delete payload[hashField];
  return sha256Text(canonicalJson(payload));
}

function validateStateObservation(observation, spec, label) {
  assertPlainObject(observation, label);
  assertPlainObject(observation.observedState, `${label}.observedState`);
  if (!Object.keys(observation.observedState).length) throw new Error(`${label}.observedState must not be empty`);
  const stateHash = sha256Text(canonicalJson(observation.observedState));
  if (observation.observedStateSha256 !== stateHash) throw new Error(`${label}.observedStateSha256 does not match observedState`);
  if (!Number.isInteger(observation.rootFrame) || observation.rootFrame < 1) throw new Error(`${label}.rootFrame must be a positive integer`);
  if (observation.frameDomainId !== spec.identity.frameDomainId) throw new Error(`${label}.frameDomainId does not match the trace spec`);
  if (!Number.isInteger(observation.localFrame) || observation.localFrame < spec.identity.requiredRange.firstFrame || observation.localFrame > spec.identity.requiredRange.lastFrame) {
    throw new Error(`${label}.localFrame is outside the required frame range`);
  }
  assertSha256(observation.screenshotSha256, `${label}.screenshotSha256`);
  if (!Number.isInteger(observation.eventLogOffset) || observation.eventLogOffset < 0) throw new Error(`${label}.eventLogOffset must be a non-negative integer`);
}

function validateFrameEvidence(items, label) {
  if (!Array.isArray(items) || !items.length) throw new Error(`${label} must contain captured frame evidence`);
  for (const [index, item] of items.entries()) {
    assertPlainObject(item, `${label}[${index}]`);
    if (!Number.isInteger(item.frame) || item.frame < 1) throw new Error(`${label}[${index}].frame must be a positive integer`);
    assertNonEmptyString(item.file, `${label}[${index}].file`);
    assertSha256(item.sha256, `${label}[${index}].sha256`);
  }
}

function validateSourceDrivenEventResults(spec, report, rawEventLog) {
  const scheduledEvents = spec.schedule.sourceDrivenEvents || [];
  if (!Array.isArray(report.sourceDrivenEventResults) || report.sourceDrivenEventResults.length !== scheduledEvents.length) {
    throw new Error("sourceDrivenEventResults must have exactly one result per scheduled source-driven event");
  }
  if (rawEventLog.eventCount < scheduledEvents.length) {
    throw new Error("rawEventLog lacks one or more scheduled source-driven event observations");
  }

  let previousResultSha256 = null;
  let previousEventSequence = -1;
  for (const [index, result] of report.sourceDrivenEventResults.entries()) {
    const label = `sourceDrivenEventResults[${index}]`;
    const scheduled = scheduledEvents[index];
    assertPlainObject(result, label);
    if (result.order !== index + 1 || scheduled.order !== index + 1) {
      throw new Error(`${label} is missing, extra, or out of order`);
    }
    if (result.scheduledEventSha256 !== sha256Text(canonicalJson(scheduled))) {
      throw new Error(`${label}.scheduledEventSha256 differs from the scheduled source-driven event`);
    }
    if (!Number.isInteger(result.eventSequence) || result.eventSequence < 1 || result.eventSequence <= previousEventSequence) {
      throw new Error(`${label}.eventSequence must be positive and strictly increasing`);
    }
    previousEventSequence = result.eventSequence;
    const locator = assertPlainObject(result.rawEventLogLocator, `${label}.rawEventLogLocator`);
    if (locator.eventSequence !== result.eventSequence || !Number.isInteger(locator.byteOffset) || locator.byteOffset < 0) {
      throw new Error(`${label}.rawEventLogLocator must locate the actual source-driven event`);
    }
    if (Object.hasOwn(result, "dispatchedAction")) {
      throw new Error(`${label} cannot represent a source-driven event as an operator dispatch`);
    }
    if (!canonicalEqual(result.observedTrigger, scheduled.trigger)) {
      throw new Error(`${label}.observedTrigger differs from the scheduled source-driven event`);
    }
    if (!canonicalEqual(result.resolvedSourceTarget, scheduled.sourceTarget)) {
      throw new Error(`${label}.resolvedSourceTarget differs from the scheduled source-driven event`);
    }
    validateStateObservation(result.preState, spec, `${label}.preState`);
    validateStateObservation(result.postState, spec, `${label}.postState`);
    if (!canonicalEqual(result.preState.observedState, scheduled.preState)) {
      throw new Error(`${label}.preState does not match the scheduled source-driven event`);
    }
    if (!canonicalEqual(result.postState.observedState, scheduled.postState)) {
      throw new Error(`${label}.postState does not match the scheduled source-driven event`);
    }
    validateFrameEvidence(result.frameEvidence, `${label}.frameEvidence`);
    if (result.previousResultSha256 !== previousResultSha256) {
      throw new Error(`${label}.previousResultSha256 breaks the source-driven event result chain`);
    }
    if (result.result !== "pass") throw new Error(`${label}.result must be pass`);
    const observedResultHash = canonicalRecordSha256(result);
    if (result.resultSha256 !== observedResultHash) {
      throw new Error(`${label}.resultSha256 does not match the canonical result record`);
    }
    previousResultSha256 = result.resultSha256;
  }
  return previousResultSha256;
}

/**
 * Validate a future execution report against a ready trace spec. This does not
 * verify artifact bytes on disk; the caller that admits the report must also
 * re-hash every descriptor. It does reject identifier-only/hash-echo reports:
 * actual dispatch order, target resolution, state observations, frame proof,
 * checkpoint comparisons, a hash chain, and terminal evidence are mandatory.
 */
export function validateExecutionProof(spec, report, {traceSpecFile, traceSpecSha256} = {}) {
  const frameAccurateRootReady = spec.traceSpecStatus === "source-frame-accurate-root-ready-for-authoritative-capture" &&
    spec.schedule?.status === "not-required-frame-accurate-root";
  const naturalScheduleReady = spec.traceSpecStatus === "source-schedule-ready-for-authoritative-execution" &&
    spec.schedule?.status === READY_SCHEDULE_STATUS;
  if (!frameAccurateRootReady && !naturalScheduleReady) {
    throw new Error(`${spec.animationId}/${spec.requirementId}: unresolved trace specs cannot admit execution proof`);
  }
  assertPlainObject(report, "execution report");
  if (report.schemaVersion !== 1 || report.status !== "complete-pass") throw new Error("execution report must be schema 1 complete-pass");
  if (report.animationId !== spec.animationId || report.requirementId !== spec.requirementId) throw new Error("execution report identity does not match the trace spec");
  const expectedIdentity = {
    frameDomainId: spec.identity.frameDomainId,
    traceId: spec.identity.traceId,
    entryStateSha256: spec.identity.entryStateSha256,
    scenario: spec.identity.scenario,
    language: spec.identity.language,
    seed: spec.identity.seed,
  };
  if (!canonicalEqual(report.identity, expectedIdentity)) throw new Error("execution report composite identity does not match the trace spec");
  assertNonEmptyString(traceSpecFile, "traceSpecFile");
  assertSha256(traceSpecSha256, "traceSpecSha256");
  if (report.traceSpecBinding?.file !== traceSpecFile || report.traceSpecBinding?.sha256 !== traceSpecSha256) {
    throw new Error("execution report does not bind the exact indexed trace spec");
  }
  const runtime = assertPlainObject(report.authorizedRuntime, "authorizedRuntime");
  for (const field of ["name", "version", "build", "launchProtocol"]) assertNonEmptyString(runtime[field], `authorizedRuntime.${field}`);
  if (runtime.authority !== spec.identity.baselineAuthorityRequirement) throw new Error("authorizedRuntime.authority does not satisfy the trace requirement");
  if (runtime.sourceSwfSha256 !== spec.sourceBindings.sourceSwf.sha256) throw new Error("authorizedRuntime.sourceSwfSha256 differs from the bound source");

  const rawEventLog = artifactDescriptor(report.rawEventLog, "rawEventLog");
  artifactDescriptor(report.sourceTargetResolutionLog, "sourceTargetResolutionLog");
  artifactDescriptor(report.stateSnapshotArchive, "stateSnapshotArchive");
  artifactDescriptor(report.originalRuntimeCaptureManifest, "originalRuntimeCaptureManifest");
  if (!Number.isInteger(rawEventLog.eventCount) || rawEventLog.eventCount < 0) throw new Error("rawEventLog.eventCount must be a non-negative integer");
  if (!Number.isInteger(rawEventLog.dispatchedActionCount) || rawEventLog.dispatchedActionCount < 0) throw new Error("rawEventLog.dispatchedActionCount must be a non-negative integer");
  if (rawEventLog.eventCount < rawEventLog.dispatchedActionCount) throw new Error("rawEventLog.eventCount cannot be smaller than dispatchedActionCount");
  if (!Array.isArray(report.unexpectedEvents) || report.unexpectedEvents.length) throw new Error("execution report unexpectedEvents must be an empty array");

  if (frameAccurateRootReady) {
    const positioningAuthority = report.proofMode === "direct-seek-root-exhaustive"
      ? "original-runtime-direct-seek"
      : report.proofMode === "sequential-step-root-exhaustive" ? "original-runtime-frame-step" : null;
    if (!positioningAuthority) throw new Error("frame-accurate root proofMode must be direct-seek-root-exhaustive or sequential-step-root-exhaustive");
    if (runtime.framePositioningAuthority !== positioningAuthority) throw new Error("authorizedRuntime.framePositioningAuthority does not match proofMode");
    if (rawEventLog.dispatchedActionCount !== 0) throw new Error("frame-accurate root proof must not dispatch source/user actions");
    if (!Array.isArray(report.orderedStepResults) || report.orderedStepResults.length) throw new Error("frame-accurate root proof orderedStepResults must be empty");
    if (!Array.isArray(report.stateCheckpointResults) || report.stateCheckpointResults.length) throw new Error("frame-accurate root proof stateCheckpointResults must be empty");
    if (report.terminalResult !== null) throw new Error("frame-accurate root proof cannot claim natural terminal semantics");
    const firstFrame = spec.identity.requiredRange.firstFrame;
    const lastFrame = spec.identity.requiredRange.lastFrame;
    const expectedFrameCount = lastFrame - firstFrame + 1;
    if (!Array.isArray(report.frameResults) || report.frameResults.length !== expectedFrameCount) {
      throw new Error("frame-accurate root frameResults must cover every required frame exactly once");
    }
    if (rawEventLog.eventCount < expectedFrameCount) throw new Error("frame-accurate root rawEventLog lacks one or more frame-position observations");
    let previousResultSha256 = null;
    let previousRequestSequence = 0;
    for (const [index, result] of report.frameResults.entries()) {
      const label = `frameResults[${index}]`;
      assertPlainObject(result, label);
      const expectedFrame = firstFrame + index;
      if (result.frame !== expectedFrame || result.observedRootFrame !== expectedFrame) {
        throw new Error(`${label} is missing, duplicated, out of order, or observed at the wrong root frame`);
      }
      const expectedOperation = report.proofMode === "direct-seek-root-exhaustive"
        ? "direct-seek"
        : index === 0 ? "rewind" : "step-forward";
      if (result.positioningOperation !== expectedOperation || result.operationCountSincePrevious !== 1) {
        throw new Error(`${label} must record exactly one ${expectedOperation} positioning operation`);
      }
      if (!Number.isInteger(result.requestSequence) || result.requestSequence <= previousRequestSequence) {
        throw new Error(`${label}.requestSequence must be positive and strictly increasing`);
      }
      previousRequestSequence = result.requestSequence;
      const locator = assertPlainObject(result.captureLogLocator, `${label}.captureLogLocator`);
      if (locator.requestSequence !== result.requestSequence || !Number.isInteger(locator.byteOffset) || locator.byteOffset < 0) {
        throw new Error(`${label}.captureLogLocator must locate the actual positioning request/observation`);
      }
      assertSha256(result.observedDisplayListStateSha256, `${label}.observedDisplayListStateSha256`);
      assertNonEmptyString(result.screenshotFile, `${label}.screenshotFile`);
      assertSha256(result.screenshotSha256, `${label}.screenshotSha256`);
      if (result.width !== spec.frameDomain.nativeStage.width || result.height !== spec.frameDomain.nativeStage.height) {
        throw new Error(`${label} dimensions differ from the native stage`);
      }
      if (result.previousResultSha256 !== previousResultSha256) throw new Error(`${label}.previousResultSha256 breaks the frame-result chain`);
      if (result.result !== "pass") throw new Error(`${label}.result must be pass`);
      const observedResultHash = canonicalRecordSha256(result);
      if (result.resultSha256 !== observedResultHash) throw new Error(`${label}.resultSha256 does not match the canonical result record`);
      previousResultSha256 = result.resultSha256;
    }
    if (report.zeroActionObservation !== null && report.zeroActionObservation !== undefined) throw new Error("frame-accurate root proof does not use zeroActionObservation");
    if (report.sequenceChainSha256 !== previousResultSha256) throw new Error("sequenceChainSha256 does not terminate at the final frame-accurate root result");
    return true;
  }

  if (report.proofMode !== "natural-trace-ordered-events") throw new Error("natural trace requires natural-trace-ordered-events proofMode");
  if (!Array.isArray(report.frameResults) || report.frameResults.length) throw new Error("natural-trace proof frameResults must be empty; frame captures bind through step/checkpoint evidence");

  const scheduledSteps = spec.schedule.orderedSteps;
  if (!Array.isArray(report.orderedStepResults) || report.orderedStepResults.length !== scheduledSteps.length) {
    throw new Error("orderedStepResults must have exactly one result per scheduled step");
  }
  if (rawEventLog.dispatchedActionCount !== scheduledSteps.length) throw new Error("rawEventLog dispatchedActionCount differs from the schedule");
  let previousResultSha256 = null;
  let previousEventSequence = -1;
  for (const [index, result] of report.orderedStepResults.entries()) {
    const label = `orderedStepResults[${index}]`;
    assertPlainObject(result, label);
    const scheduled = scheduledSteps[index];
    if (result.order !== index + 1 || scheduled.order !== index + 1) throw new Error(`${label} is missing, extra, or out of order`);
    if (result.scheduledStepSha256 !== sha256Text(canonicalJson(scheduled))) throw new Error(`${label}.scheduledStepSha256 differs from the scheduled step`);
    if (!Number.isInteger(result.eventSequence) || result.eventSequence < 1 || result.eventSequence <= previousEventSequence) throw new Error(`${label}.eventSequence must be positive and strictly increasing`);
    previousEventSequence = result.eventSequence;
    assertPlainObject(result.rawEventLogLocator, `${label}.rawEventLogLocator`);
    if (result.rawEventLogLocator.eventSequence !== result.eventSequence || !Number.isInteger(result.rawEventLogLocator.byteOffset) || result.rawEventLogLocator.byteOffset < 0) {
      throw new Error(`${label}.rawEventLogLocator must locate the actual sequenced event`);
    }
    if (!canonicalEqual(result.dispatchedAction, scheduled.action)) throw new Error(`${label}.dispatchedAction differs from the schedule`);
    if (!canonicalEqual(result.resolvedSourceTarget, scheduled.sourceTarget)) throw new Error(`${label}.resolvedSourceTarget differs from the schedule`);
    validateStateObservation(result.preState, spec, `${label}.preState`);
    validateStateObservation(result.postState, spec, `${label}.postState`);
    validateFrameEvidence(result.frameEvidence, `${label}.frameEvidence`);
    if (result.previousResultSha256 !== previousResultSha256) throw new Error(`${label}.previousResultSha256 breaks the result chain`);
    if (result.result !== "pass") throw new Error(`${label}.result must be pass`);
    const observedResultHash = canonicalRecordSha256(result);
    if (result.resultSha256 !== observedResultHash) throw new Error(`${label}.resultSha256 does not match the canonical result record`);
    previousResultSha256 = result.resultSha256;
  }

  if (!Array.isArray(report.stateCheckpointResults) || report.stateCheckpointResults.length !== spec.schedule.stateCheckpoints.length) {
    throw new Error("stateCheckpointResults must cover every declared checkpoint exactly once and in order");
  }
  for (const [index, result] of report.stateCheckpointResults.entries()) {
    const expected = spec.schedule.stateCheckpoints[index];
    const label = `stateCheckpointResults[${index}]`;
    assertPlainObject(result, label);
    if (result.checkpointId !== expected.id || result.expectedStateSha256 !== sha256Text(canonicalJson(expected.expectedState))) {
      throw new Error(`${label} does not bind the declared checkpoint and expected state`);
    }
    validateStateObservation(result.observation, spec, `${label}.observation`);
    validateFrameEvidence(result.frameEvidence, `${label}.frameEvidence`);
    if (result.result !== "pass") throw new Error(`${label}.result must be pass`);
  }

  const terminal = assertPlainObject(report.terminalResult, "terminalResult");
  if (terminal.expectedSemanticsSha256 !== sha256Text(canonicalJson(spec.schedule.terminalSemantics))) {
    throw new Error("terminalResult does not bind the declared terminal semantics");
  }
  validateStateObservation(terminal.observation, spec, "terminalResult.observation");
  validateFrameEvidence(terminal.frameEvidence, "terminalResult.frameEvidence");
  if (terminal.rawEventLogSha256 !== rawEventLog.sha256 || terminal.result !== "pass") throw new Error("terminalResult must pass and bind the raw event log");

  if (scheduledSteps.length) {
    if (report.zeroActionObservation !== null && report.zeroActionObservation !== undefined) throw new Error("an action schedule cannot include zeroActionObservation");
    if (report.sequenceChainSha256 !== previousResultSha256) throw new Error("sequenceChainSha256 does not terminate at the final ordered result");
  } else {
    const noActionsRequired = spec.schedule.noActionsRequired === true;
    const noExternalActionsRequired = spec.schedule.noExternalActionsRequired === true;
    if (!noActionsRequired && !noExternalActionsRequired) {
      throw new Error("an empty ready schedule must be source-evidenced noActionsRequired or noExternalActionsRequired");
    }
    if (rawEventLog.dispatchedActionCount !== 0) throw new Error("a no-action trace dispatched actions");
    let sourceDrivenEventChainSha256 = null;
    if (noExternalActionsRequired) {
      sourceDrivenEventChainSha256 = validateSourceDrivenEventResults(spec, report, rawEventLog);
    } else if (report.sourceDrivenEventResults !== undefined && (
      !Array.isArray(report.sourceDrivenEventResults) || report.sourceDrivenEventResults.length
    )) {
      throw new Error("noActionsRequired execution proof cannot include sourceDrivenEventResults");
    }
    const observation = assertPlainObject(report.zeroActionObservation, "zeroActionObservation");
    if (observation.status !== "observed-no-dispatched-actions" || observation.rawEventLogSha256 !== rawEventLog.sha256) {
      throw new Error("zeroActionObservation must prove the empty dispatch log");
    }
    if (noExternalActionsRequired && (
      Object.hasOwn(observation, "dispatchedAction") ||
      Object.hasOwn(observation, "resolvedSourceTarget") ||
      Object.hasOwn(observation, "operatorDispatch") ||
      (Object.hasOwn(observation, "operatorDispatches") && (
        !Array.isArray(observation.operatorDispatches) || observation.operatorDispatches.length
      ))
    )) {
      throw new Error("noExternalActionsRequired execution proof cannot fabricate an operator dispatch");
    }
    if (noExternalActionsRequired && observation.previousResultSha256 !== sourceDrivenEventChainSha256) {
      throw new Error("zeroActionObservation.previousResultSha256 does not continue the source-driven event result chain");
    }
    validateStateObservation(observation.preState, spec, "zeroActionObservation.preState");
    validateStateObservation(observation.postState, spec, "zeroActionObservation.postState");
    validateFrameEvidence(observation.frameEvidence, "zeroActionObservation.frameEvidence");
    const observationHash = canonicalRecordSha256(observation);
    if (observation.resultSha256 !== observationHash || report.sequenceChainSha256 !== observationHash) {
      throw new Error("zeroActionObservation or sequenceChainSha256 does not match the canonical observation record");
    }
  }
  return true;
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function assertPlainObject(value, label) {
  if (!isPlainObject(value)) throw new Error(`${label} must be an object`);
  return value;
}

function assertSha256(value, label) {
  if (!SHA256_PATTERN.test(value || "")) throw new Error(`${label} must be a lowercase SHA-256`);
  return value;
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || !value.length) throw new Error(`${label} must be a non-empty string`);
  return value;
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort(compareText).map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function sha256File(candidate) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(candidate)) hash.update(chunk);
  return hash.digest("hex");
}

async function exists(candidate) {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function renderJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function safeRequirementId(requirementId) {
  const safe = assertNonEmptyString(requirementId, "requirementId")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  if (!safe) throw new Error(`requirementId cannot produce a safe filename: ${JSON.stringify(requirementId)}`);
  if (safe === "." || safe === ".." || safe.includes("/")) throw new Error(`unsafe requirement filename: ${safe}`);
  return safe;
}

export function parseArguments(argumentsList) {
  const options = {
    check: false,
    ids: [],
    json: false,
    lessonReleasesPath: defaultLessonReleasesPath,
    migrationsRoot: defaultMigrationsRoot,
    python: "python3",
    releaseId: "",
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--check") options.check = true;
    else if (value === "--json") options.json = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (["--id", "--lesson-releases", "--migrations", "--python", "--release-id"].includes(value)) {
      const next = argumentsList[index + 1];
      if (!next || next.startsWith("--")) throw new Error(`${value} requires a value`);
      if (value === "--id") options.ids.push(next);
      else if (value === "--lesson-releases") options.lessonReleasesPath = path.resolve(next);
      else if (value === "--migrations") options.migrationsRoot = path.resolve(next);
      else if (value === "--python") options.python = next;
      else {
        if (options.releaseId) throw new Error("--release-id may be supplied once");
        options.releaseId = next;
      }
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function assertSafeCatalogId(value, label) {
  if (!SAFE_CATALOG_ID.test(value || "")) throw new Error(`${label} is not a safe catalog ID: ${value}`);
}

function assertSafeCatalogSourcePath(value, label) {
  if (
    typeof value !== "string" ||
    !value.endsWith(".swf") ||
    path.posix.isAbsolute(value) ||
    value.includes("\\") ||
    value.split("/").includes("..") ||
    path.posix.normalize(value) !== value
  ) {
    throw new Error(`${label} is not a safe catalog SWF path`);
  }
}

function projectContainedPath(root, candidate, label) {
  const resolved = path.resolve(candidate);
  const relative = path.relative(path.resolve(root), resolved);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} must stay inside the project root`);
  }
  return resolved;
}

export function selectTraceLessonRelease(catalog, {releaseId, ids = []} = {}) {
  if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.releases)) {
    throw new Error("Lesson release catalog is malformed");
  }
  assertSafeCatalogId(releaseId, "Requested lesson release ID");
  if (!Array.isArray(ids)) throw new Error("Requested lesson-release member IDs must be an array");
  if (new Set(ids).size !== ids.length) throw new Error("Requested lesson-release member IDs must not be repeated");
  for (const id of ids) assertSafeCatalogId(id, "Requested animationId");

  const matches = catalog.releases.filter((release) => release?.releaseId === releaseId);
  if (matches.length !== 1) {
    throw new Error(matches.length ? `Lesson release ID is duplicated: ${releaseId}` : `Unknown lesson release: ${releaseId}`);
  }
  const release = matches[0];
  if (release.publicationMode !== "atomic") throw new Error(`${releaseId}: publicationMode must remain atomic`);
  if (
    !Number.isSafeInteger(release.expectedCounts?.members) ||
    release.expectedCounts.members < 1 ||
    !Array.isArray(release.members) ||
    release.members.length !== release.expectedCounts.members
  ) {
    throw new Error(`${releaseId}: release membership is incomplete`);
  }
  if (
    !Number.isSafeInteger(release.expectedCounts?.shards) ||
    release.expectedCounts.shards < 1 ||
    !Array.isArray(release.shards) ||
    release.shards.length !== release.expectedCounts.shards
  ) {
    throw new Error(`${releaseId}: release shard definition is incomplete`);
  }
  const knownShardIds = new Set();
  for (const [index, shard] of release.shards.entries()) {
    assertSafeCatalogId(shard?.shardId, `${releaseId}: shardId`);
    if (knownShardIds.has(shard.shardId)) throw new Error(`${releaseId}: duplicate shardId ${shard.shardId}`);
    knownShardIds.add(shard.shardId);
    if (shard.ordinal !== index + 1) throw new Error(`${releaseId}: shard ordinals must be contiguous`);
    if (!Number.isSafeInteger(shard.memberCount) || shard.memberCount < 1) {
      throw new Error(`${releaseId}/${shard.shardId}: shard memberCount is invalid`);
    }
  }
  const seenAnimationIds = new Set();
  const seenAssetIds = new Set();
  for (const [index, member] of release.members.entries()) {
    if (member?.ordinal !== index + 1) throw new Error(`${releaseId}: member ordinals must be contiguous`);
    assertSafeCatalogId(member.animationId, `${releaseId} member animationId`);
    if (seenAnimationIds.has(member.animationId)) throw new Error(`${releaseId}: duplicate member animationId ${member.animationId}`);
    seenAnimationIds.add(member.animationId);
    assertSha256(member.source?.sha256, `${member.animationId}: release source SHA-256`);
    if (member.assetId !== `swf-${member.source.sha256}`) throw new Error(`${member.animationId}: release assetId does not match source SHA-256`);
    if (seenAssetIds.has(member.assetId)) throw new Error(`${releaseId}: duplicate member assetId ${member.assetId}`);
    seenAssetIds.add(member.assetId);
    assertSafeCatalogSourcePath(member.source.path, `${member.animationId}: release source path`);
    if (typeof member.releaseRole !== "string" || !member.releaseRole.length) throw new Error(`${member.animationId}: releaseRole is missing`);
    assertSafeCatalogId(member.shardId, `${member.animationId}: shardId`);
    if (!knownShardIds.has(member.shardId)) throw new Error(`${member.animationId}: release member references unknown shard ${member.shardId}`);
  }
  for (const shard of release.shards) {
    const observedCount = release.members.filter((member) => member.shardId === shard.shardId).length;
    if (observedCount !== shard.memberCount) {
      throw new Error(`${releaseId}/${shard.shardId}: declared memberCount ${shard.memberCount} differs from ${observedCount}`);
    }
  }
  const requested = ids.length ? new Set(ids) : null;
  if (requested) {
    const missing = ids.filter((id) => !seenAnimationIds.has(id));
    if (missing.length) throw new Error(`Explicit ID(s) are not verified lesson-release members: ${missing.join(", ")}`);
  }
  const members = requested ? release.members.filter((member) => requested.has(member.animationId)) : [...release.members];
  const selectionIdentity = {
    releaseId,
    scope: requested ? "verified-subset" : "complete-atomic-release",
    orderedMembers: members.map((member) => ({
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      sourcePath: member.source.path,
      sourceSha256: member.source.sha256,
    })),
  };
  return {
    release,
    members,
    selectionIdentity,
    selectionSha256: sha256Text(canonicalJson(selectionIdentity)),
  };
}

function evidenceArtifactIds(inventory, animationId) {
  if (!Array.isArray(inventory.evidenceIndex) || !inventory.evidenceIndex.length) {
    throw new Error(`${animationId}: scenario inventory evidenceIndex is missing`);
  }
  const ids = new Set();
  for (const artifact of inventory.evidenceIndex) {
    assertNonEmptyString(artifact.artifactId, `${animationId}: inventory artifactId`);
    if (ids.has(artifact.artifactId)) throw new Error(`${animationId}: duplicate inventory artifactId ${artifact.artifactId}`);
    ids.add(artifact.artifactId);
    const artifactPath = artifact.path || artifact.sourcePath;
    assertNonEmptyString(artifactPath, `${animationId}: ${artifact.artifactId} path/sourcePath`);
    assertSha256(artifact.sha256, `${animationId}: ${artifact.artifactId} SHA-256`);
  }
  return ids;
}

function validateEvidenceReferences(references, artifactIds, label) {
  if (!Array.isArray(references) || !references.length) throw new Error(`${label} must contain source evidence`);
  for (const [index, reference] of references.entries()) {
    assertPlainObject(reference, `${label}[${index}]`);
    const artifactId = assertNonEmptyString(reference.artifactId, `${label}[${index}].artifactId`);
    if (!artifactIds.has(artifactId)) throw new Error(`${label}[${index}] references unknown artifactId ${artifactId}`);
  }
}

function validateNonEmptyObject(value, label) {
  assertPlainObject(value, label);
  if (!Object.keys(value).length) throw new Error(`${label} must not be empty`);
  return value;
}

function validateNoExternalActionsSchedule(schedule, {requirement, model, artifactIds, animationId}) {
  const label = `${animationId}/${requirement.requirementId}`;
  if (model.kind !== "stateful-natural-trace" || model.domainScope !== "nested") {
    throw new Error(`${label}: noExternalActionsRequired is allowed only for a stateful nested natural trace`);
  }
  if (schedule.noActionsRequired === true) {
    throw new Error(`${label}: noActionsRequired and noExternalActionsRequired are mutually exclusive`);
  }
  if (schedule.orderedSteps.length) {
    throw new Error(`${label}: noExternalActionsRequired cannot declare operator-dispatched orderedSteps`);
  }

  const naturalEntry = validateNonEmptyObject(schedule.naturalEntry, `${label}: naturalEntry`);
  if (naturalEntry.status !== "source-evidenced") {
    throw new Error(`${label}: naturalEntry.status must be source-evidenced`);
  }
  validateNonEmptyObject(naturalEntry.sourceTarget, `${label}: naturalEntry.sourceTarget`);
  validateNonEmptyObject(naturalEntry.expectedState, `${label}: naturalEntry.expectedState`);
  validateEvidenceReferences(naturalEntry.evidence, artifactIds, `${label}: naturalEntry.evidence`);

  if (schedule.sourceDrivenEvents !== undefined && !Array.isArray(schedule.sourceDrivenEvents)) {
    throw new Error(`${label}: sourceDrivenEvents must be an array when declared`);
  }
  const sourceDrivenEvents = schedule.sourceDrivenEvents || [];
  for (const [index, event] of sourceDrivenEvents.entries()) {
    const eventLabel = `${label}: sourceDrivenEvents[${index}]`;
    validateNonEmptyObject(event, eventLabel);
    if (event.order !== index + 1) {
      throw new Error(`${eventLabel}.order must be contiguous and one-indexed`);
    }
    for (const field of ["trigger", "sourceTarget", "preState", "postState"]) {
      validateNonEmptyObject(event[field], `${eventLabel}.${field}`);
    }
    validateEvidenceReferences(event.evidence, artifactIds, `${eventLabel}.evidence`);
  }

  const eventFreeContract = schedule.sourceProvenEventFreeFirstCycle;
  if (sourceDrivenEvents.length && eventFreeContract !== undefined) {
    throw new Error(`${label}: sourceDrivenEvents and sourceProvenEventFreeFirstCycle are mutually exclusive`);
  }
  if (!sourceDrivenEvents.length && eventFreeContract === undefined) {
    throw new Error(`${label}: noExternalActionsRequired needs sourceDrivenEvents or sourceProvenEventFreeFirstCycle`);
  }
  if (eventFreeContract !== undefined) {
    validateNonEmptyObject(eventFreeContract, `${label}: sourceProvenEventFreeFirstCycle`);
    if (eventFreeContract.status !== "source-proven") {
      throw new Error(`${label}: sourceProvenEventFreeFirstCycle.status must be source-proven`);
    }
    if (eventFreeContract.sourceDrivenEventCount !== 0) {
      throw new Error(`${label}: sourceProvenEventFreeFirstCycle.sourceDrivenEventCount must be zero`);
    }
    assertPlainObject(eventFreeContract.cycleRange, `${label}: sourceProvenEventFreeFirstCycle.cycleRange`);
    if (!canonicalEqual(eventFreeContract.cycleRange, requirement.requiredRange)) {
      throw new Error(`${label}: sourceProvenEventFreeFirstCycle.cycleRange must equal the required frame range`);
    }
    validateNonEmptyObject(eventFreeContract.expectedState, `${label}: sourceProvenEventFreeFirstCycle.expectedState`);
    validateEvidenceReferences(eventFreeContract.evidence, artifactIds, `${label}: sourceProvenEventFreeFirstCycle.evidence`);
  }
}

function ts006Evidence(...references) {
  return references.map(([artifactId, fields = {}]) => ({artifactId, ...fields}));
}

function validateTs006PendingPlanSourceBindings(bindings, label) {
  assertPlainObject(bindings, label);
  const expected = TS006_TRACE_PROFILE.pendingPlanSourceBindings;
  const expectedKeys = Object.keys(expected);
  const observedKeys = Object.keys(bindings).sort(compareText);
  if (!canonicalEqual(observedKeys, [...expectedKeys].sort(compareText))) {
    throw new Error(`${label} keys differ from the source-locked TS006 same-lesson Shell evidence set`);
  }
  const artifactIds = new Set();
  for (const key of expectedKeys) {
    assertPlainObject(bindings[key], `${label}.${key}`);
    if (!canonicalEqual(bindings[key], expected[key])) {
      throw new Error(`${label}.${key} differs from the source-locked path, byte count, or SHA-256`);
    }
    const artifactId = assertNonEmptyString(bindings[key].artifactId, `${label}.${key}.artifactId`);
    if (artifactIds.has(artifactId)) throw new Error(`${label} contains duplicate artifactId ${artifactId}`);
    artifactIds.add(artifactId);
  }
  return Object.fromEntries(expectedKeys.map((key) => [key, bindings[key]]));
}

function validateTs006SpanishNarrationSourceFacts(scenarioInventory, label) {
  if (scenarioInventory?.schemaVersion !== 1
    || scenarioInventory.animationId !== "shell-course-g04-l03-index-local"
    || scenarioInventory.source?.swfSha256 !== TS006_TRACE_PROFILE.pendingPlanSourceBindings.sameLessonShellSwf.sha256) {
    throw new Error(`${label} identity or Shell source binding differs`);
  }
  const control = TS006_TRACE_PROFILE.spanishNarrationControl;
  const handler = exactlyOne(
    (scenarioInventory.interactions?.handlers || []).filter((item) => item.script === control.actionScript),
    `${label}: Spanish narration button handler`,
  );
  const placement = exactlyOne(
    (handler.hitTarget?.placements || []).filter((item) => (
      item.timelineId === control.timelineId
      && item.frame === control.frame
      && item.name === control.instanceName
      && item.objectId === control.buttonObjectId
      && item.depth === control.depth
    )),
    `${label}: Spanish narration button placement`,
  );
  const hitRecord = exactlyOne(
    (handler.hitTarget?.hitRecords || []).filter((item) => item.shapeObjectId === control.hitShapeObjectId),
    `${label}: Spanish narration hit-shape record`,
  );
  if (handler.bodySha256 !== control.actionScriptBodySha256
    || !canonicalEqual(handler.event, ["release"])
    || handler.scope?.objectId !== control.buttonObjectId
    || handler.signals?.calls?.length !== 1
    || handler.signals.calls[0]?.target !== control.callee
    || placement.objectId !== control.buttonObjectId
    || hitRecord.shapeObjectId !== control.hitShapeObjectId) {
    throw new Error(`${label} Spanish narration button source facts differ`);
  }
  return true;
}

export async function deriveTs006PendingPlanSourceBindings({id, root}) {
  if (id !== TS006_TRACE_PROFILE.animationId) return {};
  const bindings = {};
  const bytesByKey = {};
  for (const [key, expected] of Object.entries(TS006_TRACE_PROFILE.pendingPlanSourceBindings)) {
    const absolute = path.resolve(root, ...expected.path.split("/"));
    const relative = path.relative(path.resolve(root), absolute);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error(`${id}: TS006 pending-plan source ${key} escapes the project root`);
    }
    const bytes = await readFile(absolute);
    const observed = {
      artifactId: expected.artifactId,
      path: expected.path,
      bytes: bytes.length,
      sha256: sha256Text(bytes),
    };
    bindings[key] = observed;
    bytesByKey[key] = bytes;
  }
  validateTs006PendingPlanSourceBindings(bindings, `${id}: pendingTracePlanSourceBindings`);
  validateTs006SpanishNarrationSourceFacts(
    JSON.parse(bytesByKey.sameLessonShellScenarioInventory.toString("utf8")),
    `${id}: same-lesson Shell scenario inventory`,
  );
  return bindings;
}

function ts006PendingTracePlan({animationId, requirement, domain, artifactIds, pendingTracePlanSourceBindings}) {
  if (animationId !== TS006_TRACE_PROFILE.animationId) return null;
  const profile = TS006_TRACE_PROFILE;
  const language = requirement.language;
  const pendingStatus = "planned-pending-authorized-original-runtime-observation";
  const sourceEvidence = ts006Evidence(
    ["source-swf"],
    ["course-xml"],
    ["ffdec-scripts"],
    ["swfmill-xml"],
    ["strict-readiness"],
  );
  const planSourceBindings = language === "es"
    ? validateTs006PendingPlanSourceBindings(
        pendingTracePlanSourceBindings,
        `${animationId}/${requirement.requirementId}: pendingTracePlanSourceBindings`,
      )
    : null;
  const permittedArtifactIds = new Set(artifactIds);
  for (const binding of Object.values(planSourceBindings || {})) permittedArtifactIds.add(binding.artifactId);
  const spanishControlEvidence = language === "es" ? ts006Evidence(
    [planSourceBindings.sameLessonShellSwf.artifactId],
    [planSourceBindings.sameLessonShellScenarioInventory.artifactId, {
      handlerId: "script-0022",
      script: profile.spanishNarrationControl.actionScript,
    }],
    [planSourceBindings.sameLessonShellFfdecScripts.artifactId, {
      script: profile.spanishNarrationControl.actionScript,
      lineStart: profile.spanishNarrationControl.actionScriptLineStart,
      lineEnd: profile.spanishNarrationControl.actionScriptLineEnd,
    }],
    [planSourceBindings.sameLessonShellSwfmillXml.artifactId, {
      timelineId: profile.spanishNarrationControl.timelineId,
      frame: profile.spanishNarrationControl.frame,
      objectId: profile.spanishNarrationControl.buttonObjectId,
      hitShapeObjectId: profile.spanishNarrationControl.hitShapeObjectId,
      depth: profile.spanishNarrationControl.depth,
    }],
    [planSourceBindings.spanishNarrationAudioCandidate.artifactId, {
      runtimePathCandidate: "/SA/L3TS06.mp3",
      successfulLoadAudibilityLanguageAndSynchronization: "not-established-by-static-binding",
    }],
  ) : [];
  if (language === "es") sourceEvidence.push(...spanishControlEvidence);
  validateEvidenceReferences(
    sourceEvidence,
    permittedArtifactIds,
    `${animationId}/${requirement.requirementId}: pending trace-plan sourceEvidence`,
  );

  const checkpoint = (id, expectedState, evidence) => ({
    id,
    status: pendingStatus,
    expectedState,
    evidence,
  });
  const step = ({
    order,
    id,
    action,
    sourceTarget,
    preState,
    postState,
    evidence,
    terminalEffect,
  }) => ({
    order,
    id,
    acquisitionMode: profile.primaryAcquisitionMode,
    status: pendingStatus,
    action,
    sourceTarget,
    preStateCheckpoint: {
      status: pendingStatus,
      expectedState: preState,
    },
    postStateCheckpoint: {
      status: pendingStatus,
      expectedState: postState,
    },
    evidence,
    evidenceAuthority: "planning-constraint-only; exact target resolution and observed state remain execution-report obligations",
    ...(terminalEffect ? {terminalEffect} : {}),
  });
  const hostEvidence = ts006Evidence(["course-xml"], ["strict-readiness"]);
  const rootEntryEvidence = ts006Evidence(
    ["source-swf"],
    ["ffdec-scripts", {script: "frame_1/DoAction.as", lineStart: 4, lineEnd: 6}],
    ["swfmill-xml", {timelineId: "root"}],
  );
  const beginEvidence = ts006Evidence(
    ["source-swf"],
    ["ffdec-scripts", {script: "frame_6/DoAction.as", lineStart: 8, lineEnd: 9}],
    ["swfmill-xml", {timelineId: "root"}],
  );
  const nestedEvidence = ts006Evidence(
    ["source-swf"],
    ["ffdec-scripts", {script: "DefineSprite_23/frame_128/DoAction.as", lineStart: 1, lineEnd: 2}],
    ["swfmill-xml", {timelineId: profile.nestedFrameDomainId}],
  );
  for (const [label, evidence] of [
    ["host", hostEvidence],
    ["root-entry", rootEntryEvidence],
    ["begin", beginEvidence],
    ["nested", nestedEvidence],
  ]) {
    validateEvidenceReferences(
      evidence,
      permittedArtifactIds,
      `${animationId}/${requirement.requirementId}: pending trace-plan ${label} evidence`,
    );
  }

  const freshProcessState = {
    language,
    runtimeProcessState: "fresh-disposable-process-profile",
    sharedObjectState: "empty",
    outboundNetworkState: "denied-and-audited",
  };
  const rootEntryState = {
    language,
    frameDomainId: profile.rootFrameDomainId,
    rootFrame: profile.rootEntryFrame,
    targetAnimationId: animationId,
  };
  const nestedEntryState = {
    language,
    frameDomainId: profile.nestedFrameDomainId,
    rootFrame: profile.beginFrame,
    localFrame: 1,
    sourceInstanceId: "animation",
  };
  const nestedTerminalState = {
    language,
    frameDomainId: profile.nestedFrameDomainId,
    rootFrame: profile.beginFrame,
    localFrame: profile.nestedTerminalFrame,
    localPlayState: "stopped",
  };
  const reentryState = {
    language,
    targetAnimationId: animationId,
    targetSequence: profile.targetSequence,
    entryFreshness: "fresh-natural-reentry-observed",
  };
  const spanishNarrationRequestedState = language === "es" ? {
    ...nestedEntryState,
    pageSpanishNarrationControl: {
      instanceName: profile.spanishNarrationControl.instanceName,
      labelVisibleBeforeRelease: true,
      labelVisibleAfterRelease: false,
      SA_PLAYVisible: false,
      SA_PAUSEVisible: true,
    },
    spanSound: true,
    childTimelineState: "source-function-stops-child-until-onSoundComplete",
    requestedRuntimePathCandidate: "/SA/L3TS06.mp3",
    requestedAudioCandidateSha256: planSourceBindings.spanishNarrationAudioCandidate.sha256,
    successfulLoadAudibilitySpokenLanguageSynchronization: "must-be-observed-not-assumed-from-static-source",
  } : null;
  const firstTerminalState = language === "es" ? {
    ...nestedTerminalState,
    spanishNarrationOutcome: "record-actual-load-audibility-spoken-language-synchronization-and-completion",
  } : nestedTerminalState;
  const languagePreparationSteps = language === "es" ? [] : [
    step({
      order: 1,
      id: "select-host-language",
      action: {
        kind: "host-native-language-selection",
        language,
        coordinatePolicy: "no guessed coordinate; record the exact resolved host-native target in the execution report",
      },
      sourceTarget: {
        kind: "same-lesson-shell-language-control",
        resolutionStatus: "must-be-resolved-and-recorded-by-authorized-runtime-observation",
      },
      preState: {...freshProcessState, selectedLanguage: null},
      postState: {...freshProcessState, selectedLanguage: language},
      evidence: hostEvidence,
    }),
  ];
  const navigationOrder = language === "es" ? 1 : 2;
  const preloaderOrder = language === "es" ? 2 : 3;
  const nestedEntryOrder = language === "es" ? 3 : 4;
  const hostReadyState = language === "es"
    ? freshProcessState
    : {...freshProcessState, selectedLanguage: language};
  const orderedSteps = [
    ...languagePreparationSteps,
    step({
      order: navigationOrder,
      id: "navigate-same-lesson-host-to-ts006",
      action: {
        kind: "same-lesson-natural-navigation",
        targetAnimationId: animationId,
        targetSequence: profile.targetSequence,
        directChildSwfOpenAllowed: false,
      },
      sourceTarget: {
        kind: "same-lesson-shell-course-page",
        targetSequence: profile.targetSequence,
        resolutionStatus: "must-be-resolved-and-recorded-by-authorized-runtime-observation",
      },
      preState: {...hostReadyState, targetPageEntered: false},
      postState: {...rootEntryState, naturalHostEntryObserved: true},
      evidence: hostEvidence,
    }),
    step({
      order: preloaderOrder,
      id: "observe-root-preloader-handoff",
      action: {
        kind: "observe-source-driven-host-handoff",
        operatorDispatchAllowed: false,
      },
      sourceTarget: {
        timelineId: "root",
        frame: profile.rootEntryFrame,
        operation: "_level0.InternalPreloader.gotoAndPlay",
        argument: "jump_check",
      },
      preState: rootEntryState,
      postState: {
        ...rootEntryState,
        preloaderRequest: "jump_check",
        hostResponse: "record-observed-response-without-assumption",
      },
      evidence: rootEntryEvidence,
    }),
    step({
      order: nestedEntryOrder,
      id: "observe-natural-begin-and-nested-entry",
      action: {
        kind: "observe-natural-host-transition",
        operatorDispatchAllowed: false,
      },
      sourceTarget: {
        timelineId: "root",
        frame: profile.beginFrame,
        label: "begin",
        placedInstance: "animation",
        placedTimelineId: profile.nestedFrameDomainId,
      },
      preState: {
        ...rootEntryState,
        preloaderRequest: "jump_check",
      },
      postState: nestedEntryState,
      evidence: beginEvidence,
    }),
    ...(language === "es" ? [step({
      order: 4,
      id: "invoke-page-spanish-narration",
      action: {
        kind: "page-spanish-narration-release",
        event: profile.spanishNarrationControl.event,
        coordinateSpace: "native-stage-pixels",
        point: profile.spanishNarrationControl.nativeStagePoint,
        hitTestPolicy: "point-must-remain-inside-source-derived-button-hit-bounds",
      },
      sourceTarget: {
        kind: "same-lesson-shell-page-spanish-narration-control",
        label: profile.spanishNarrationControl.label,
        timelineId: profile.spanishNarrationControl.timelineId,
        frame: profile.spanishNarrationControl.frame,
        instanceName: profile.spanishNarrationControl.instanceName,
        buttonObjectId: profile.spanishNarrationControl.buttonObjectId,
        hitShapeObjectId: profile.spanishNarrationControl.hitShapeObjectId,
        depth: profile.spanishNarrationControl.depth,
        nativeStageBounds: profile.spanishNarrationControl.nativeStageBounds,
        actionScript: profile.spanishNarrationControl.actionScript,
        actionScriptBodySha256: profile.spanishNarrationControl.actionScriptBodySha256,
        callee: profile.spanishNarrationControl.callee,
      },
      preState: nestedEntryState,
      postState: spanishNarrationRequestedState,
      evidence: spanishControlEvidence,
    })] : []),
    step({
      order: 5,
      id: "observe-first-natural-terminal",
      action: {
        kind: "observe-natural-playback",
        operatorDispatchAllowed: false,
        requiredLocalRange: {firstFrame: 1, lastFrame: profile.nestedTerminalFrame},
      },
      sourceTarget: {
        timelineId: profile.nestedFrameDomainId,
        terminalFrame: profile.nestedTerminalFrame,
        ...(language === "es" ? {
          sourceAudioCompletionPrerequisite: "observe _global.gSound.onSoundComplete before attributing resumed playback or terminal reachability",
        } : {}),
      },
      preState: language === "es" ? spanishNarrationRequestedState : nestedEntryState,
      postState: firstTerminalState,
      evidence: language === "es" ? [...nestedEvidence, ...spanishControlEvidence] : nestedEvidence,
      terminalEffect: "first-natural-terminal-observation-only; Replay and navigation remain pending",
    }),
    step({
      order: 6,
      id: "invoke-host-native-replay",
      action: {
        kind: "host-native-replay",
        coordinatePolicy: "no guessed coordinate; record the exact resolved host-native target in the execution report",
      },
      sourceTarget: {
        kind: "same-lesson-shell-replay-control",
        resolutionStatus: "must-be-resolved-and-recorded-by-authorized-runtime-observation",
      },
      preState: firstTerminalState,
      postState: {...nestedEntryState, replayCycle: 2, completeResetObserved: true},
      evidence: ts006Evidence(["strict-readiness"], ["source-swf"]),
    }),
    step({
      order: 7,
      id: "observe-second-natural-terminal",
      action: {
        kind: "observe-natural-replay-cycle",
        operatorDispatchAllowed: false,
        requiredLocalRange: {firstFrame: 1, lastFrame: profile.nestedTerminalFrame},
      },
      sourceTarget: {
        timelineId: profile.nestedFrameDomainId,
        terminalFrame: profile.nestedTerminalFrame,
        replayCycle: 2,
      },
      preState: {...nestedEntryState, replayCycle: 2},
      postState: {...nestedTerminalState, replayCycle: 2},
      evidence: nestedEvidence,
    }),
    step({
      order: 8,
      id: "exercise-previous-next-and-natural-return",
      action: {
        kind: "host-native-previous-next-and-natural-return",
        coordinatePolicy: "no guessed coordinate; record each exact resolved host-native target and destination",
      },
      sourceTarget: {
        kind: "same-lesson-shell-navigation-controls",
        requiredControls: ["Previous", "Next"],
        resolutionStatus: "must-be-resolved-and-recorded-by-authorized-runtime-observation",
      },
      preState: {...nestedTerminalState, replayCycle: 2},
      postState: reentryState,
      evidence: hostEvidence,
    }),
    step({
      order: 9,
      id: "close-runtime-and-record-postconditions",
      action: {
        kind: "close-authorized-runtime-process",
      },
      sourceTarget: {
        kind: "exact-authorized-runtime-process",
        resolutionStatus: "bind exact PID, executable hash, and process-exit receipt",
      },
      preState: reentryState,
      postState: {
        language,
        runtimeProcessState: "closed",
        outboundNetworkState: "denied-and-audited",
        sharedObjectState: "empty",
      },
      evidence: ts006Evidence(["strict-readiness"]),
      terminalEffect: "session termination only; no migration acceptance or release effect",
    }),
  ];
  for (const [index, item] of orderedSteps.entries()) {
    validateEvidenceReferences(
      item.evidence,
      permittedArtifactIds,
      `${animationId}/${requirement.requirementId}: pending orderedSteps[${index}].evidence`,
    );
  }

  const stateCheckpoints = [
    checkpoint("fresh-contained-process", freshProcessState, ts006Evidence(["strict-readiness"])),
    checkpoint("natural-root-entry-frame-1", rootEntryState, rootEntryEvidence),
    checkpoint("natural-root-begin-and-nested-entry", nestedEntryState, beginEvidence),
    ...(language === "es" ? [checkpoint(
      "page-spanish-narration-requested-sa-play-to-sa-pause",
      spanishNarrationRequestedState,
      spanishControlEvidence,
    )] : []),
    checkpoint(
      "first-natural-nested-terminal",
      firstTerminalState,
      language === "es" ? [...nestedEvidence, ...spanishControlEvidence] : nestedEvidence,
    ),
    checkpoint("replay-reset-to-nested-entry", {...nestedEntryState, replayCycle: 2, completeResetObserved: true}, ts006Evidence(["strict-readiness"], ["source-swf"])),
    checkpoint("second-natural-nested-terminal", {...nestedTerminalState, replayCycle: 2}, nestedEvidence),
    checkpoint("post-navigation-natural-reentry", reentryState, hostEvidence),
  ];
  for (const [index, item] of stateCheckpoints.entries()) {
    validateEvidenceReferences(
      item.evidence,
      permittedArtifactIds,
      `${animationId}/${requirement.requirementId}: pending stateCheckpoints[${index}].evidence`,
    );
  }

  const acquisitionPlan = {
    status: pendingStatus,
    orderInvariant: "The primary natural trace must complete before any supplemental frame positioning in the same language session.",
    primary: {
      acquisitionMode: profile.primaryAcquisitionMode,
      authorityTarget: "original-runtime-natural-trace",
      role: "primary behavior, reachability, language, audio, Replay, navigation, and terminal evidence",
      directSeekAllowed: false,
      requiredBeforeSupplemental: true,
      frameDomainId: domain.id,
      requiredRange: {...requirement.requiredRange},
    },
    supplemental: domain.id === profile.rootFrameDomainId ? [{
      acquisitionMode: profile.supplementalAcquisitionMode,
      authorityTarget: "original-runtime-frame-step",
      role: "supplemental root visual-frame completion only",
      requiredRange: {...requirement.requiredRange},
      prerequisite: profile.primaryAcquisitionMode,
      allowedOperation: "Rewind to frame 1, then exactly one Step Forward operation for each subsequent root frame.",
      forbiddenClaims: [
        "natural playback",
        "runtime reachability",
        "terminal semantics",
        "Replay behavior",
        "navigation behavior",
        "audio synchronization",
      ],
    }] : [],
  };

  return {
    acquisitionPlan,
    ...(planSourceBindings ? {sourceBindings: planSourceBindings} : {}),
    schedule: {
      status: pendingStatus,
      sourceEvidence,
      authorityBoundary: "This is a hash-bound pending-candidate operator plan. Static source constrains frames and scripts, but exact host targets, event ordering, reachability, observed states, Replay, navigation, language, and audio remain unproved until an authorized execution report exists.",
      orderedSteps,
      stateCheckpoints,
      terminalSemantics: {
        status: pendingStatus,
        kind: "host-navigation-terminal",
        expectedState: {
          language,
          runtimeProcessState: "closed",
          naturalReentryVerifiedBeforeClose: true,
          outboundNetworkState: "denied-and-audited",
          sharedObjectState: "empty",
        },
        evidence: ts006Evidence(["strict-readiness"], ["course-xml"]),
      },
      exhaustiveFrameCapturePrerequisite: domain.id === profile.rootFrameDomainId
        ? "Complete the primary natural trace, then execute the separately labeled sequential-frame-step supplement for root frames 1..10; never merge the two authority modes."
        : "Complete the primary natural trace and bind every naturally observed sprite-23 frame 1..128 to the exact requirement identity.",
    },
  };
}

function traceModelFor(domain, scenario, animationId) {
  if (animationId === TS006_TRACE_PROFILE.animationId) {
    return {
      kind: "stateful-natural-trace",
      domainScope: domain.kind === "root" ? "root" : "nested",
      interactionMode: "same-lesson-host-natural-entry-with-separate-supplemental-root-frame-positioning",
      positioningProofModes: domain.kind === "root" ? ["sequential-step-root-exhaustive"] : [],
      naturalPlaybackClaimed: true,
      captureMode: domain.kind === "root"
        ? "primary-natural-trace-then-separately-labeled-root-frame-step-supplement"
        : "primary-natural-root-entry-then-every-one-indexed-local-frame",
    };
  }
  if (domain.kind === "root" && scenario.kind === "linear") {
    return {
      kind: "frame-accurate-root-exhaustive",
      domainScope: "root",
      interactionMode: "no-natural-action-schedule-required-for-frame-accurate-root-baseline",
      captureMode: "every-one-indexed-frame-in-declared-root-range",
      positioningProofModes: ["direct-seek-root-exhaustive", "sequential-step-root-exhaustive"],
      naturalPlaybackClaimed: false,
    };
  }
  return {
    kind: "stateful-natural-trace",
    domainScope: domain.kind === "root" ? "root" : "nested",
    interactionMode: scenario.kind,
    positioningProofModes: [],
    naturalPlaybackClaimed: true,
    captureMode: domain.kind === "root"
      ? "every-one-indexed-frame-after-source-evidenced-root-actions"
      : "natural-root-entry-then-every-one-indexed-local-frame-after-source-evidenced-actions",
  };
}

function candidateExecutableSchedules(inventory, derivedSchedules = []) {
  const candidates = inventory.coverage?.executableTraceSchedules;
  if (candidates !== undefined && !Array.isArray(candidates)) {
    throw new Error(`${inventory.animationId}: coverage.executableTraceSchedules must be an array`);
  }
  if (!Array.isArray(derivedSchedules)) throw new Error(`${inventory.animationId}: derivedSchedules must be an array`);
  return [...(candidates || []), ...derivedSchedules];
}

function validateExecutableSchedule(schedule, {requirement, model, artifactIds, animationId}) {
  assertPlainObject(schedule, `${animationId}/${requirement.requirementId}: executable schedule`);
  if (schedule.status !== READY_SCHEDULE_STATUS) {
    throw new Error(`${animationId}/${requirement.requirementId}: executable schedule status must be ${READY_SCHEDULE_STATUS}`);
  }
  validateEvidenceReferences(schedule.sourceEvidence, artifactIds, `${animationId}/${requirement.requirementId}: schedule.sourceEvidence`);
  if (!Array.isArray(schedule.orderedSteps)) {
    throw new Error(`${animationId}/${requirement.requirementId}: schedule.orderedSteps must be an array`);
  }
  const noActionsRequired = schedule.noActionsRequired === true;
  const noExternalActionsRequired = schedule.noExternalActionsRequired === true;
  if (schedule.noExternalActionsRequired !== undefined && !noExternalActionsRequired) {
    throw new Error(`${animationId}/${requirement.requirementId}: noExternalActionsRequired must be true when declared`);
  }
  if (!schedule.orderedSteps.length && !noActionsRequired && !noExternalActionsRequired) {
    throw new Error(`${animationId}/${requirement.requirementId}: an empty schedule requires source-evidenced noActionsRequired`);
  }
  if (noActionsRequired && model.kind !== "frame-accurate-root-exhaustive") {
    throw new Error(`${animationId}/${requirement.requirementId}: noActionsRequired is allowed only for a linear root trace`);
  }
  if (noExternalActionsRequired) {
    validateNoExternalActionsSchedule(schedule, {requirement, model, artifactIds, animationId});
  }
  if (schedule.playbackSegments !== undefined) {
    if (!Array.isArray(schedule.playbackSegments) || !schedule.playbackSegments.length) {
      throw new Error(`${animationId}/${requirement.requirementId}: playbackSegments must be a non-empty array when declared`);
    }
    let expectedFirstFrame = requirement.requiredRange.firstFrame;
    for (const [index, segment] of schedule.playbackSegments.entries()) {
      assertPlainObject(segment, `${animationId}/${requirement.requirementId}: playbackSegments[${index}]`);
      assertNonEmptyString(segment.id, `${animationId}/${requirement.requirementId}: playbackSegments[${index}].id`);
      assertPlainObject(segment.requiredRange, `${animationId}/${requirement.requirementId}: playbackSegments[${index}].requiredRange`);
      const {firstFrame, lastFrame} = segment.requiredRange;
      if (!Number.isInteger(firstFrame) || !Number.isInteger(lastFrame) || firstFrame !== expectedFirstFrame || lastFrame < firstFrame) {
        throw new Error(`${animationId}/${requirement.requirementId}: playbackSegments must be contiguous, ordered, and one-indexed`);
      }
      assertPlainObject(segment.expectedState, `${animationId}/${requirement.requirementId}: playbackSegments[${index}].expectedState`);
      if (!Object.keys(segment.expectedState).length) {
        throw new Error(`${animationId}/${requirement.requirementId}: playbackSegments[${index}].expectedState must not be empty`);
      }
      validateEvidenceReferences(segment.evidence, artifactIds, `${animationId}/${requirement.requirementId}: playbackSegments[${index}].evidence`);
      expectedFirstFrame = lastFrame + 1;
    }
    if (expectedFirstFrame !== requirement.requiredRange.lastFrame + 1) {
      throw new Error(`${animationId}/${requirement.requirementId}: playbackSegments do not exhaust the required frame range`);
    }
  }
  for (const [index, step] of schedule.orderedSteps.entries()) {
    assertPlainObject(step, `${animationId}/${requirement.requirementId}: orderedSteps[${index}]`);
    if (step.order !== index + 1) throw new Error(`${animationId}/${requirement.requirementId}: ordered step order must be contiguous and one-indexed`);
    for (const field of ["action", "sourceTarget", "preStateCheckpoint", "postStateCheckpoint"]) {
      assertPlainObject(step[field], `${animationId}/${requirement.requirementId}: orderedSteps[${index}].${field}`);
      if (!Object.keys(step[field]).length) throw new Error(`${animationId}/${requirement.requirementId}: orderedSteps[${index}].${field} must not be empty`);
    }
    validateEvidenceReferences(step.evidence, artifactIds, `${animationId}/${requirement.requirementId}: orderedSteps[${index}].evidence`);
  }
  if (!Array.isArray(schedule.stateCheckpoints) || !schedule.stateCheckpoints.length) {
    throw new Error(`${animationId}/${requirement.requirementId}: source-evidenced schedule needs stateCheckpoints`);
  }
  for (const [index, checkpoint] of schedule.stateCheckpoints.entries()) {
    assertPlainObject(checkpoint, `${animationId}/${requirement.requirementId}: stateCheckpoints[${index}]`);
    assertNonEmptyString(checkpoint.id, `${animationId}/${requirement.requirementId}: stateCheckpoints[${index}].id`);
    assertPlainObject(checkpoint.expectedState, `${animationId}/${requirement.requirementId}: stateCheckpoints[${index}].expectedState`);
    validateEvidenceReferences(checkpoint.evidence, artifactIds, `${animationId}/${requirement.requirementId}: stateCheckpoints[${index}].evidence`);
  }
  assertPlainObject(schedule.terminalSemantics, `${animationId}/${requirement.requirementId}: terminalSemantics`);
  if (schedule.terminalSemantics.status !== "source-evidenced") {
    throw new Error(`${animationId}/${requirement.requirementId}: terminalSemantics.status must be source-evidenced`);
  }
  if (schedule.terminalSemantics.kind !== undefined && !TERMINAL_SEMANTICS_KINDS.has(schedule.terminalSemantics.kind)) {
    throw new Error(`${animationId}/${requirement.requirementId}: terminalSemantics.kind is unsupported`);
  }
  if (noExternalActionsRequired && schedule.terminalSemantics.kind === undefined) {
    throw new Error(`${animationId}/${requirement.requirementId}: noExternalActionsRequired needs terminalSemantics.kind`);
  }
  assertPlainObject(schedule.terminalSemantics.expectedState, `${animationId}/${requirement.requirementId}: terminalSemantics.expectedState`);
  validateEvidenceReferences(schedule.terminalSemantics.evidence, artifactIds, `${animationId}/${requirement.requirementId}: terminalSemantics.evidence`);
  return schedule;
}

function findExecutableSchedule(inventory, derivedSchedules, context) {
  const candidates = candidateExecutableSchedules(inventory, derivedSchedules)
    .filter((item) => item?.requirementId === context.requirement.requirementId);
  if (candidates.length > 1) {
    throw new Error(`${context.animationId}/${context.requirement.requirementId}: duplicate executable schedules`);
  }
  return candidates.length ? validateExecutableSchedule(candidates[0], context) : null;
}

function unresolvedMappingSkeleton(model) {
  return [
    {
      mappingId: "action-schedule",
      status: "missing-source-evidence",
      requiredResolution: model.kind === "frame-accurate-root-exhaustive"
        ? "Prove from the original runtime/source whether this root trace is truly action-free, or enumerate every required host/user event in exact order."
        : "Enumerate every source/host/user event in exact order, including input values, coordinates, keys, waits, random outcomes, and language/seed effects where applicable.",
    },
    {
      mappingId: "action-to-source-target",
      status: "missing-source-evidence",
      requiredResolution: "Map every ordered event to an exact source timeline, placed instance, character/script target, and hit/input locator; static handler candidates are not an execution mapping.",
    },
    {
      mappingId: "state-checkpoints",
      status: "missing-source-evidence",
      requiredResolution: "Define the complete observable pre/post state for entry and every action, including root/local playheads, score, attempts, random state, language, audio, overlays, and enabled controls.",
    },
    {
      mappingId: "terminal-semantics",
      status: "missing-source-evidence",
      requiredResolution: "Prove the terminal stop/completion/navigation state and Replay reset vector; a structural last frame is not terminal-behavior evidence.",
    },
  ];
}

function summarizeObligations(inventory) {
  const coverage = inventory.coverage || {};
  const names = [
    "handlerBehaviorGroups",
    "buttonTargetObligations",
    "inputObligations",
    "dragObligations",
    "correctWrongObligations",
    "conditionalBranchObligations",
    "randomObligations",
    "labeledStateObligations",
    "glossaryAndHyperlinkObligations",
    "sectionMenuObligations",
    "courseRouteObligations",
    "sideEffectObligations",
    "dependencyFixtureObligations",
  ];
  return Object.fromEntries(names.map((name) => [name, Array.isArray(coverage[name]) ? coverage[name].length : 0]));
}

export function traceRequirementSelectionIdentity(requirement, frameCount, label = "coverage requirement") {
  const selection = assertStrictFullDomainRequirement(requirement, frameCount, label);
  if (selection.requirementSchemaVersion === 1) {
    return {
      selection,
      identity: {requiredRange: requirement.requiredRange},
    };
  }
  return {
    selection,
    identity: {
      requirementSchemaVersion: 2,
      coverageRole: "full-domain",
      ...(requirement.coverageGroupId !== undefined
        ? {coverageGroupId: requirement.coverageGroupId}
        : {}),
      ...(requirement.requiredRange !== undefined
        ? {requiredRange: requirement.requiredRange}
        : {requiredFrameSet: requirement.requiredFrameSet}),
      selectionSha256: requirement.selectionSha256,
      ...(requirement.naturalPath !== undefined
        ? {naturalPath: requirement.naturalPath}
        : {}),
    },
  };
}

function validateRequirementIdentity({animationId, requirement, domain, scenario}) {
  assertNonEmptyString(requirement.requirementId, `${animationId}: requirementId`);
  assertNonEmptyString(requirement.frameDomainId, `${animationId}/${requirement.requirementId}: frameDomainId`);
  assertNonEmptyString(requirement.traceId, `${animationId}/${requirement.requirementId}: traceId`);
  assertNonEmptyString(requirement.scenario, `${animationId}/${requirement.requirementId}: scenario`);
  if (!domain) throw new Error(`${animationId}/${requirement.requirementId}: unknown frame domain ${requirement.frameDomainId}`);
  if (!scenario) throw new Error(`${animationId}/${requirement.requirementId}: unknown scenario ${requirement.scenario}`);
  if (!domain.scenarioIds?.includes(requirement.scenario)) {
    throw new Error(`${animationId}/${requirement.requirementId}: scenario is not declared for frame domain`);
  }
  if (scenario.reachable !== true) throw new Error(`${animationId}/${requirement.requirementId}: scenario is not declared reachable`);
  if (!Number.isInteger(domain.frameCount) || domain.frameCount < 1) throw new Error(`${animationId}/${requirement.requirementId}: invalid frame-domain frameCount`);
  const selection = traceRequirementSelectionIdentity(
    requirement,
    domain.frameCount,
    `${animationId}/${requirement.requirementId}`,
  );
  assertPlainObject(requirement.entryState, `${animationId}/${requirement.requirementId}: entryState`);
  const observedEntryHash = sha256Text(canonicalJson(requirement.entryState));
  if (observedEntryHash !== requirement.entryStateSha256) {
    throw new Error(`${animationId}/${requirement.requirementId}: entryStateSha256 does not match canonical entryState`);
  }
  if (!BASELINE_AUTHORITIES.has(requirement.baselineAuthorityRequirement)) {
    throw new Error(`${animationId}/${requirement.requirementId}: unsupported baseline authority requirement`);
  }
  const expectedAuthority = animationId === TS006_TRACE_PROFILE.animationId
    ? "original-runtime-natural-trace"
    : domain.kind === "root" && scenario.kind === "linear"
      ? "original-runtime-frame-accurate"
      : "original-runtime-natural-trace";
  if (requirement.baselineAuthorityRequirement !== expectedAuthority) {
    throw new Error(`${animationId}/${requirement.requirementId}: ${domain.kind}/${scenario.kind} requires ${expectedAuthority}`);
  }
  if (!/^(en|es)$/.test(requirement.language || "")) throw new Error(`${animationId}/${requirement.requirementId}: unsupported language`);
  if (!/^-?\d+$/.test(String(requirement.seed ?? ""))) throw new Error(`${animationId}/${requirement.requirementId}: seed must be an integer string or number`);
  return selection;
}

export function buildTraceSpec({
  manifest,
  coverage,
  inventory,
  hashes,
  requirement,
  derivedSchedules = [],
  scheduleDerivationBindings = {},
  pendingTracePlanSourceBindings = {},
}) {
  const animationId = manifest.animationId;
  const domains = manifest.implementation?.frameDomains;
  const scenarios = manifest.scenarios;
  if (!Array.isArray(domains) || !domains.length) throw new Error(`${animationId}: manifest implementation.frameDomains are missing`);
  if (!Array.isArray(scenarios) || !scenarios.length) throw new Error(`${animationId}: manifest scenarios are missing`);
  const domain = domains.find((item) => item.id === requirement.frameDomainId);
  const scenario = scenarios.find((item) => item.id === requirement.scenario);
  const requirementSelection = validateRequirementIdentity({animationId, requirement, domain, scenario});

  const timeline = inventory.timelineInventory?.find((item) => item.timelineId === domain.sourceTimelineId);
  if (!timeline) throw new Error(`${animationId}/${requirement.requirementId}: frame domain has no matching inventory timeline`);
  if (timeline.frameCount !== domain.frameCount) throw new Error(`${animationId}/${requirement.requirementId}: manifest/inventory frame-domain count mismatch`);

  const artifactIds = evidenceArtifactIds(inventory, animationId);
  const model = traceModelFor(domain, scenario, animationId);
  const frameAccurateRootReady = model.kind === "frame-accurate-root-exhaustive";
  const sourceSchedule = frameAccurateRootReady ? null : findExecutableSchedule(inventory, derivedSchedules, {requirement, model, artifactIds, animationId});
  const pendingTracePlan = sourceSchedule ? null : ts006PendingTracePlan({
    animationId,
    requirement,
    domain,
    artifactIds,
    pendingTracePlanSourceBindings,
  });
  const scheduleDerivationBinding = scheduleDerivationBindings[requirement.requirementId] || null;
  if (scheduleDerivationBinding !== null) {
    assertPlainObject(scheduleDerivationBinding, `${animationId}/${requirement.requirementId}: scheduleDerivationBinding`);
    if (!sourceSchedule) throw new Error(`${animationId}/${requirement.requirementId}: derivation binding exists without a ready source schedule`);
  }
  const unresolvedMappings = frameAccurateRootReady || sourceSchedule ? [] : unresolvedMappingSkeleton(model);

  return {
    schemaVersion: 1,
    artifactType: "course-pilot-original-runtime-trace-specification",
    animationId,
    requirementId: requirement.requirementId,
    traceSpecStatus: frameAccurateRootReady
      ? "source-frame-accurate-root-ready-for-authoritative-capture"
      : sourceSchedule ? "source-schedule-ready-for-authoritative-execution" : "unresolved",
    authorityStatement: [
      "This file specifies evidence needed to execute one original-runtime trace; it is not an execution log, baseline capture, RMSE result, or acceptance record.",
      "Static ActionScript/timeline inventories expose candidates and obligations but do not prove event order, runtime reachability, source targets, checkpoints, or terminal semantics.",
      "Empty orderedSteps and executedSteps are intentional when no complete source-evidenced schedule exists; product behavior and the JavaScript rewrite are never used to fill legacy-source gaps.",
      ...(frameAccurateRootReady ? ["This linear root requirement may be captured by exact original-runtime direct seeks or Rewind plus one Step Forward per subsequent frame; this proves only frame-accurate root visuals and never natural playback."] : []),
      ...(pendingTracePlan ? ["The ordered steps, checkpoints, termination, and acquisition modes below are a pending-candidate operator plan. They remain non-authoritative and cannot accept an execution report until exact runtime targets and observations promote the schedule through the evidence gate."] : []),
    ],
    identity: {
      frameDomainId: requirement.frameDomainId,
      traceId: requirement.traceId,
      entryStateSha256: requirement.entryStateSha256,
      scenario: requirement.scenario,
      scenarioKind: scenario.kind,
      language: requirement.language,
      seed: String(requirement.seed),
      ...requirementSelection.identity,
      baselineAuthorityRequirement: requirement.baselineAuthorityRequirement,
    },
    traceModel: model,
    ...(pendingTracePlan ? {acquisitionPlan: pendingTracePlan.acquisitionPlan} : {}),
    sourceBindings: {
      sourceSwf: {
        path: manifest.source.swf,
        sha256: hashes.sourceSwfSha256,
      },
      migrationManifest: {
        path: "migration.json",
        ...projectionDescriptor({
          projection: TECHNICAL_MANIFEST_PROJECTION.id,
          sha256: hashes.manifestTechnicalSha256,
          excludedPaths: TECHNICAL_MANIFEST_PROJECTION.excludedPaths,
        }),
      },
      fullFrameCoverage: {
        path: "evidence/full-frame-coverage.json",
        ...projectionDescriptor({
          projection: TRACE_COVERAGE_PROJECTION.id,
          sha256: hashes.coverageTechnicalSha256,
          includedPaths: TRACE_COVERAGE_PROJECTION.includedRequirementPaths,
          excludedPaths: TRACE_COVERAGE_PROJECTION.excludedRequirementPaths,
        }),
      },
      scenarioInventory: {
        path: "audit/scenario-inventory.json",
        ...projectionDescriptor({
          projection: SCENARIO_INVENTORY_PROJECTION.id,
          sha256: hashes.inventoryTechnicalSha256,
          excludedPaths: SCENARIO_INVENTORY_PROJECTION.excludedPaths,
        }),
      },
      coverageInventoryBinding: {
        status: "verified-current-file-at-spec-generation-not-part-of-execution-binding",
        fileSha256AtSpecGeneration: hashes.inventoryFileSha256,
        technicalProjectionSha256: hashes.inventoryTechnicalSha256,
      },
      ...(scheduleDerivationBinding ? {scheduleDerivation: scheduleDerivationBinding} : {}),
      ...(pendingTracePlan?.sourceBindings ? {pendingTracePlanEvidence: pendingTracePlan.sourceBindings} : {}),
    },
    frameDomain: {
      id: domain.id,
      kind: domain.kind,
      sourceTimelineId: domain.sourceTimelineId,
      sourceInstanceId: domain.sourceInstanceId,
      parentFrameDomainId: domain.parentFrameDomainId,
      parentEntryFrame: domain.parentEntryFrame ?? null,
      localEntryFrame: domain.localEntryFrame ?? 1,
      frameCount: domain.frameCount,
      structuralReachability: timeline.structuralReachability,
      inventoryEvidence: timeline.evidence,
      nativeStage: manifest.runtime.stage,
      fps: manifest.runtime.fps,
    },
    entryState: requirement.entryState,
    schedule: {
      status: frameAccurateRootReady
        ? "not-required-frame-accurate-root"
        : sourceSchedule
          ? READY_SCHEDULE_STATUS
          : pendingTracePlan?.schedule.status || "unresolved-no-complete-source-event-schedule",
      sourceEvidence: frameAccurateRootReady
        ? [timeline.evidence]
        : sourceSchedule?.sourceEvidence || pendingTracePlan?.schedule.sourceEvidence || [],
      noActionsRequired: sourceSchedule?.noActionsRequired === true,
      ...(pendingTracePlan ? {authorityBoundary: pendingTracePlan.schedule.authorityBoundary} : {}),
      ...(sourceSchedule?.noExternalActionsRequired === true ? {
        noExternalActionsRequired: true,
        naturalEntry: sourceSchedule.naturalEntry,
        sourceDrivenEvents: sourceSchedule.sourceDrivenEvents || [],
        ...(sourceSchedule.sourceProvenEventFreeFirstCycle ? {
          sourceProvenEventFreeFirstCycle: sourceSchedule.sourceProvenEventFreeFirstCycle,
        } : {}),
      } : {}),
      ...(sourceSchedule?.playbackSegments ? {playbackSegments: sourceSchedule.playbackSegments} : {}),
      orderedStepSchema: ORDERED_STEP_SCHEMA,
      orderedSteps: sourceSchedule?.orderedSteps || pendingTracePlan?.schedule.orderedSteps || [],
      executedSteps: [],
      stateCheckpoints: sourceSchedule?.stateCheckpoints || pendingTracePlan?.schedule.stateCheckpoints || [],
      terminalSemantics: frameAccurateRootReady ? {
        status: "separate-natural-playback-behavior-gate-not-required-for-frame-accurate-root-baseline",
        expectedState: null,
        evidence: [],
      } : sourceSchedule?.terminalSemantics || pendingTracePlan?.schedule.terminalSemantics || {
          status: "unresolved",
          expectedState: null,
          evidence: [],
        },
      exhaustiveFrameCapturePlan: {
        indexing: "one-indexed",
        firstFrame: 1,
        lastFrame: domain.frameCount,
        frameCount: domain.frameCount,
        executionPrerequisite: frameAccurateRootReady
          ? "Use an authorized original-runtime direct seek for every frame, or Rewind to frame 1 then Step Forward exactly once per subsequent root frame; preserve a sequenced, hash-chained observation/capture result for each exact frame."
          : sourceSchedule
            ? "Execute this source-evidenced schedule in the required original runtime before pairing every frame with implementation evidence."
            : pendingTracePlan?.schedule.exhaustiveFrameCapturePrerequisite
              || "Blocked until the complete source-evidenced event/target/checkpoint/terminal schedule is supplied.",
      },
    },
    unresolvedMappings,
    separateBehaviorUnknowns: frameAccurateRootReady ? [{
      id: "natural-playback-terminal-and-replay-semantics",
      status: "not-resolved-by-frame-accurate-root-baseline",
      note: "Direct seeking or Rewind plus sequential frame stepping can establish frame-accurate root visuals without inventing an action schedule; neither proves natural playback, terminal stop/completion, or Replay.",
    }] : [],
    inventoryContext: {
      inventoryStatus: inventory.inventoryStatus,
      timelineControlStates: timeline.controlStates || [],
      obligationCounts: summarizeObligations(inventory),
      unknownIds: (inventory.unknowns || []).map((item) => item.id).sort(compareText),
      note: "These are static candidates/obligations only and are not mapped into orderedSteps by this generator.",
    },
    executionEvidence: {
      status: "not-executed-by-this-generator",
      expectedExecutionReportPath: `baseline/trace-executions/${safeRequirementId(requirement.requirementId)}.json`,
      hashDagDirection: "source -> stable technical manifest/coverage/inventory projections -> trace spec -> execution report; mutable coverage results, QA, status, signatures, and baseline adoption must never hash-bind back to the spec/report",
      executionProofSchema: executionProofSchemaFor(sourceSchedule),
      executionReport: null,
      originalRuntimeCaptureManifest: null,
      executedSteps: [],
      stateCheckpointResults: [],
      terminalResult: null,
    },
    strictAcceptanceEffect: "none; this specification neither resolves baseline authority nor satisfies branch, visual, RMSE, audio, human-review, or owner-acceptance gates",
  };
}

function exactlyOne(items, label) {
  if (!Array.isArray(items) || items.length !== 1) {
    throw new Error(`${label}: expected exactly one item, observed ${Array.isArray(items) ? items.length : "non-array"}`);
  }
  return items[0];
}

function assertCanonicalValue(observed, expected, label) {
  if (!canonicalEqual(observed, expected)) {
    throw new Error(`${label} differs from the source-locked value`);
  }
}

function indexedEvidenceArtifact(inventory, artifactId, animationId) {
  const artifact = exactlyOne(
    (inventory.evidenceIndex || []).filter((item) => item.artifactId === artifactId),
    `${animationId}: evidence artifact ${artifactId}`,
  );
  assertNonEmptyString(artifact.path, `${animationId}: ${artifactId}.path`);
  assertSha256(artifact.sha256, `${animationId}: ${artifactId}.sha256`);
  return artifact;
}

function sourceScript(inventory, {script, bodySha256, collection}) {
  const animationId = inventory.animationId;
  const entry = exactlyOne(
    (inventory.interactions?.[collection] || []).filter((item) => item.script === script),
    `${animationId}: ${collection} ${script}`,
  );
  if (entry.bodySha256 !== bodySha256) throw new Error(`${animationId}: ${script} body SHA-256 differs`);
  if (entry.evidence?.artifactId !== "ffdec-scripts" || entry.evidence.script !== script) {
    throw new Error(`${animationId}: ${script} is not bound to the indexed FFDec script artifact`);
  }
  return entry;
}

function assertRw002Geometry(geometry) {
  const id = RW_002_TRACE_PROFILE.animationId;
  assertPlainObject(geometry, `${id}: parsed swfmill geometry`);
  if (geometry.schemaVersion !== 1 || geometry.parser !== "python-xml.etree.ElementTree") {
    throw new Error(`${id}: unsupported swfmill geometry parser output`);
  }
  assertCanonicalValue(geometry.nativeStage, {height: 600, width: 800}, `${id}: native stage geometry`);
  assertCanonicalValue(geometry.rootTimeline, {frameCount: 10}, `${id}: root timeline geometry`);
  assertCanonicalValue(geometry.sprite, {frameCount: 1873, objectId: 334}, `${id}: sprite geometry`);
  assertCanonicalValue(geometry.rootPlacement, {
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
  }, `${id}: root placement geometry`);
  assertCanonicalValue(geometry.buttonPlacement, {
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
  }, `${id}: button placement geometry`);
  assertCanonicalValue(geometry.buttonRemoval, {depth: 722, frame: 674}, `${id}: button removal geometry`);
  assertCanonicalValue(geometry.buttonDefinition, {
    actions: ["Play", "EndAction"],
    hitRecord: {
      depth: 1,
      shapeObjectId: 110,
      transformSourceDecimals: {
        scaleX: "1",
        scaleY: "1",
        skewX: "0",
        skewY: "0",
        transX: "0",
        transY: "0",
      },
    },
    objectId: 111,
    pointerPush: true,
  }, `${id}: button definition geometry`);
  assertCanonicalValue(geometry.hitShape, {
    boundsTwips: {bottom: 270, left: -959, right: 960, top: -260},
    definitionTag: "DefineShape3",
    objectId: 110,
  }, `${id}: hit shape geometry`);
  assertCanonicalValue(geometry.stageHitBounds?.exactDecimals, {
    bottom: "110.5914614078588783740997314453125",
    height: "13.3995799231342971324920654296875",
    left: "92.791997018607775665203857421875",
    right: "716.642811395972990470703125",
    top: "97.191881484724581241607666015625",
    width: "623.850814377365214805499267578125",
  }, `${id}: exact native-stage hit bounds`);
  assertCanonicalValue(geometry.stageHitBounds?.interiorPointExactDecimals, {
    x: "404.7174042072903830679534912109375",
    y: "103.89167144629172980785369873046875",
  }, `${id}: exact native-stage hit interior point`);
}

/**
 * Convert the hash-bound static RW source inventory plus parsed swfmill
 * geometry into two language-specific executable schedules. This is a source
 * specification only: it neither launches Flash nor produces capture proof.
 */
export function deriveRw002SourceSchedulesFromEvidence({manifest, coverage, inventory, hashes, geometry}) {
  const profile = RW_002_TRACE_PROFILE;
  if (manifest.animationId !== profile.animationId || coverage.animationId !== profile.animationId || inventory.animationId !== profile.animationId) {
    throw new Error(`${profile.animationId}: RW schedule derivation received a different animation identity`);
  }
  if (manifest.source?.swfSha256 !== profile.sourceSwfSha256 || inventory.source?.swfSha256 !== profile.sourceSwfSha256 || hashes.sourceSwfSha256 !== profile.sourceSwfSha256) {
    throw new Error(`${profile.animationId}: preserved source SWF SHA-256 differs from the locked RW source`);
  }
  const domain = exactlyOne(
    (manifest.implementation?.frameDomains || []).filter((item) => item.id === profile.frameDomainId),
    `${profile.animationId}: ${profile.frameDomainId} frame domain`,
  );
  assertCanonicalValue({
    kind: domain.kind,
    sourceTimelineId: domain.sourceTimelineId,
    sourceInstanceId: domain.sourceInstanceId,
    parentFrameDomainId: domain.parentFrameDomainId,
    parentEntryFrame: domain.parentEntryFrame,
    localEntryFrame: domain.localEntryFrame,
    frameCount: domain.frameCount,
    scenarioIds: domain.scenarioIds,
  }, {
    kind: "nested",
    sourceTimelineId: "sprite-334",
    sourceInstanceId: "main-animation",
    parentFrameDomainId: "root",
    parentEntryFrame: 6,
    localEntryFrame: 1,
    frameCount: 1873,
    scenarioIds: ["default"],
  }, `${profile.animationId}: nested frame-domain contract`);
  const timeline = exactlyOne(
    (inventory.timelineInventory || []).filter((item) => item.timelineId === profile.frameDomainId),
    `${profile.animationId}: ${profile.frameDomainId} source timeline`,
  );
  if (timeline.objectId !== profile.sourceObjectId || timeline.frameCount !== profile.frameCount) {
    throw new Error(`${profile.animationId}: source timeline identity or frame count differs`);
  }

  const button = sourceScript(inventory, {
    collection: "handlers",
    script: "DefineButton2_111/BUTTONCONDACTION on(press).as",
    bodySha256: profile.buttonHandlerBodySha256,
  });
  assertCanonicalValue(button.event, ["press"], `${profile.animationId}: button 111 event`);
  assertCanonicalValue(
    (button.signals?.transitions || []).map(({target, arguments: argumentsValue}) => ({target, arguments: argumentsValue})),
    [{target: "play", arguments: ""}],
    `${profile.animationId}: button 111 transition`,
  );
  const firstStop = sourceScript(inventory, {
    collection: "nonEventScripts",
    script: "DefineSprite_334/frame_673/DoAction.as",
    bodySha256: profile.firstStopBodySha256,
  });
  const resume = sourceScript(inventory, {
    collection: "nonEventScripts",
    script: "DefineSprite_334/frame_674/DoAction.as",
    bodySha256: profile.resumeBodySha256,
  });
  const terminal = sourceScript(inventory, {
    collection: "nonEventScripts",
    script: "DefineSprite_334/frame_1873/DoAction.as",
    bodySha256: profile.terminalStopBodySha256,
  });
  assertCanonicalValue(
    (firstStop.signals?.calls || []).map(({target, arguments: argumentsValue}) => ({target, arguments: argumentsValue})),
    [{target: "stop", arguments: ""}],
    `${profile.animationId}: frame 673 stop`,
  );
  assertCanonicalValue(
    (firstStop.signals?.assignments || []).map(({target, operator, expression}) => ({target, operator, expression})),
    [{target: "_global.quizSection", operator: "=", expression: "true"}],
    `${profile.animationId}: frame 673 quizSection assignment`,
  );
  assertCanonicalValue(resume.signals?.calls || [], [], `${profile.animationId}: frame 674 calls`);
  assertCanonicalValue(
    (resume.signals?.assignments || []).map(({target, operator, expression}) => ({target, operator, expression})),
    [{target: "_global.quizSection", operator: "=", expression: "false"}],
    `${profile.animationId}: frame 674 quizSection assignment`,
  );
  assertCanonicalValue(
    (terminal.signals?.calls || []).map(({target, arguments: argumentsValue}) => ({target, arguments: argumentsValue})),
    [{target: "stop", arguments: ""}],
    `${profile.animationId}: frame 1873 stop`,
  );
  if ((terminal.signals?.assignments || []).length) throw new Error(`${profile.animationId}: frame 1873 contains unexpected assignments`);
  const quizAssignments = (inventory.interactions?.nonEventScripts || [])
    .flatMap((entry) => entry.signals?.assignments || [])
    .filter((assignment) => assignment.target === "_global.quizSection")
    .map(({target, operator, expression}) => ({target, operator, expression}));
  assertCanonicalValue(quizAssignments, [
    {target: "_global.quizSection", operator: "=", expression: "true"},
    {target: "_global.quizSection", operator: "=", expression: "false"},
  ], `${profile.animationId}: complete quizSection assignment inventory`);
  assertCanonicalValue({
    buttonObjectId: button.hitTarget?.buttonObjectId,
    hitRecords: button.hitTarget?.hitRecords,
    placements: (button.hitTarget?.placements || []).map(({timelineId, frame, depth, objectId}) => ({timelineId, frame, depth, objectId})),
  }, {
    buttonObjectId: "111",
    hitRecords: [{depth: "1", shapeObjectId: "110", transform: {transX: "0", transY: "0"}}],
    placements: [{timelineId: "sprite-334", frame: 673, depth: "722", objectId: "111"}],
  }, `${profile.animationId}: button 110/111 static hit target`);
  assertRw002Geometry(geometry);

  const requirements = (coverage.requirements || [])
    .filter((item) => item.frameDomainId === profile.frameDomainId && item.scenario === "default")
    .sort((left, right) => compareText(left.language, right.language));
  if (requirements.length !== 2 || requirements[0].language !== "en" || requirements[1].language !== "es") {
    throw new Error(`${profile.animationId}: expected exactly the en/es sprite-334 default requirements`);
  }

  const swfmillTimeline = {artifactId: "swfmill-xml", timelineId: "sprite-334"};
  const swfmillButton = {artifactId: "swfmill-xml", objectId: "111", hitShapeObjectId: "110"};
  const sourceEvidence = [swfmillTimeline, swfmillButton, button.evidence, firstStop.evidence, resume.evidence, terminal.evidence];
  const stageHitBounds = structuredClone(geometry.stageHitBounds);
  const beforePress = {
    rootFrame: 6,
    rootPlayState: "stopped",
    localFrame: 673,
    localPlayState: "stopped",
    globalVariables: {quizSection: true},
    activeControl: {buttonObjectId: 111, hitShapeObjectId: 110, depth: 722},
  };
  const afterPress = {
    rootFrame: 6,
    rootPlayState: "stopped",
    localFrame: 674,
    localPlayState: "playing",
    globalVariables: {quizSection: false},
    inactiveControl: {buttonObjectId: 111, removalDepth: 722, removalFrame: 674},
  };
  const terminalState = {
    rootFrame: 6,
    rootPlayState: "stopped",
    localFrame: 1873,
    localPlayState: "stopped",
    globalVariables: {quizSection: false},
    button111Active: false,
  };

  return requirements.map((requirement) => ({
    requirementId: requirement.requirementId,
    status: READY_SCHEDULE_STATUS,
    noActionsRequired: false,
    sourceEvidence,
    playbackSegments: [{
      id: "frames-1-672-natural-play",
      requiredRange: {firstFrame: 1, lastFrame: 672},
      expectedState: {
        rootFrame: 6,
        rootPlayState: "stopped",
        localFrameRange: {firstFrame: 1, lastFrame: 672},
        localPlayState: "playing",
        button111Active: false,
      },
      evidence: [swfmillTimeline],
    }, {
      id: "frame-673-source-stop-awaiting-press",
      requiredRange: {firstFrame: 673, lastFrame: 673},
      expectedState: beforePress,
      evidence: [swfmillTimeline, swfmillButton, firstStop.evidence],
    }, {
      id: "frames-674-1872-resumed-play",
      requiredRange: {firstFrame: 674, lastFrame: 1872},
      expectedState: {
        rootFrame: 6,
        rootPlayState: "stopped",
        localFrameRange: {firstFrame: 674, lastFrame: 1872},
        localPlayState: "playing",
        globalVariables: {quizSection: false},
        button111Active: false,
      },
      evidence: [swfmillTimeline, swfmillButton, button.evidence, resume.evidence],
    }, {
      id: "frame-1873-terminal-source-stop",
      requiredRange: {firstFrame: 1873, lastFrame: 1873},
      expectedState: terminalState,
      evidence: [swfmillTimeline, terminal.evidence],
    }],
    orderedSteps: [{
      order: 1,
      action: {
        event: "press",
        dispatchPhase: "pointer-down",
        coordinateSpace: "native-stage-pixels",
        pointer: structuredClone(stageHitBounds.interiorPointNumeric),
        exactPointerDecimals: structuredClone(stageHitBounds.interiorPointExactDecimals),
        hitTest: "inside-source-derived-button-hit-bounds",
        sourceCommand: "play()",
      },
      sourceTarget: {
        timelineId: "sprite-334",
        localFrame: 673,
        buttonObjectId: 111,
        hitShapeObjectId: 110,
        depth: 722,
        stageHitBounds,
      },
      preStateCheckpoint: {checkpointId: "frame-673-before-source-press", expectedState: beforePress},
      postStateCheckpoint: {checkpointId: "frame-674-after-source-press", expectedState: afterPress},
      evidence: [swfmillButton, button.evidence, firstStop.evidence, resume.evidence],
      terminalEffect: "Resumes sprite-334 at frame 673; frame 674 clears quizSection/removes button 111, and natural playback continues to the source stop at frame 1873.",
    }],
    stateCheckpoints: [{
      id: "frame-1-natural-entry",
      expectedState: {
        rootFrame: 6,
        rootPlayState: "stopped",
        localFrame: 1,
        localPlayState: "playing",
        requiredLanguage: requirement.language,
        button111Active: false,
      },
      evidence: [swfmillTimeline],
    }, {
      id: "frame-673-before-source-press",
      expectedState: beforePress,
      evidence: [swfmillTimeline, swfmillButton, firstStop.evidence],
    }, {
      id: "frame-674-after-source-press",
      expectedState: afterPress,
      evidence: [swfmillTimeline, swfmillButton, button.evidence, resume.evidence],
    }, {
      id: "frame-1873-terminal-source-stop",
      expectedState: terminalState,
      evidence: [swfmillTimeline, terminal.evidence],
    }],
    terminalSemantics: {
      status: "source-evidenced",
      expectedState: terminalState,
      evidence: [swfmillTimeline, terminal.evidence],
      outsideThisSpecification: [
        "Replay/reset behavior is not established by these source scripts.",
        "Audio presence, language-track selection, cue timing, and listening acceptance are not established by this schedule.",
      ],
    },
  }));
}

function assertRandomSoundProfileArtifact(inventory, artifactId, expected, animationId) {
  const artifact = indexedEvidenceArtifact(inventory, artifactId, animationId);
  if (artifact.path !== expected.path || artifact.sha256 !== expected.sha256) {
    throw new Error(`${animationId}: ${artifactId} path or SHA-256 differs from the locked random-sound source evidence`);
  }
  return artifact;
}

function randomSoundScript(inventory, profile, frame, bodySha256) {
  return sourceScript(inventory, {
    collection: "nonEventScripts",
    script: `DefineSprite_${profile.sourceObjectId}/frame_${frame}/DoAction.as`,
    bodySha256,
  });
}

function randomSoundExpectedRequirementIds(profile) {
  return [...profile.expectedNestedRequirementIds].sort(compareText);
}

/**
 * Derive the source event schedule shared by TI001 sprite-21 and IR001
 * sprite-58. The two branch schedules classify naturally observed AVM1
 * random(2) outcomes; they never inject a seed or force an outcome. Host and
 * authoring files are byte-verified by deriveCanonicalCourseSourceSchedules
 * before these schedules are emitted by the repository generator.
 */
export function deriveRandomSoundBranchSourceSchedulesFromEvidence({manifest, coverage, inventory, hashes}) {
  const profile = RANDOM_SOUND_TRACE_PROFILES[manifest.animationId];
  if (!profile) throw new Error(`${manifest.animationId}: no locked random-sound trace profile`);
  const id = profile.animationId;
  if (coverage.animationId !== id || inventory.animationId !== id) {
    throw new Error(`${id}: random-sound schedule derivation received a different animation identity`);
  }
  if (
    manifest.source?.swf !== profile.sourceSwfPath ||
    manifest.source?.swfSha256 !== profile.sourceSwfSha256 ||
    inventory.source?.swf !== profile.sourceSwfPath ||
    inventory.source?.swfSha256 !== profile.sourceSwfSha256 ||
    hashes.sourceSwfSha256 !== profile.sourceSwfSha256
  ) {
    throw new Error(`${id}: preserved source SWF SHA-256 differs from the locked random-sound source`);
  }
  if (hashes.inventoryTechnicalSha256 !== profile.inventoryTechnicalSha256) {
    throw new Error(`${id}: scenario-inventory technical projection differs from the locked random-sound evidence`);
  }
  if (profile.sourceFlaPath && (
    manifest.source?.fla !== profile.sourceFlaPath ||
    manifest.source?.flaSha256 !== profile.sourceFlaSha256 ||
    manifest.source?.pairedFlaStatus !== "present"
  )) {
    throw new Error(`${id}: paired FLA identity differs from the locked authoring source`);
  }
  assertCanonicalValue({
    frameCount: manifest.runtime?.frameCount,
    fps: manifest.runtime?.fps,
    stage: manifest.runtime?.stage,
  }, {
    frameCount: 10,
    fps: 12,
    stage: {height: 600, width: 800},
  }, `${id}: root runtime contract`);

  const expectedScenarios = [...new Set(profile.expectedNestedRequirementIds.map((requirementId) => requirementId.split(":")[2]))].sort(compareText);
  const domain = exactlyOne(
    (manifest.implementation?.frameDomains || []).filter((item) => item.id === profile.frameDomainId),
    `${id}: ${profile.frameDomainId} frame domain`,
  );
  assertCanonicalValue({
    kind: domain.kind,
    sourceTimelineId: domain.sourceTimelineId,
    sourceInstanceId: domain.sourceInstanceId,
    parentFrameDomainId: domain.parentFrameDomainId,
    parentEntryFrame: domain.parentEntryFrame,
    localEntryFrame: domain.localEntryFrame,
    frameCount: domain.frameCount,
    scenarioIds: [...(domain.scenarioIds || [])].sort(compareText),
  }, {
    kind: "nested",
    sourceTimelineId: profile.frameDomainId,
    sourceInstanceId: "main-animation",
    parentFrameDomainId: "root",
    parentEntryFrame: 6,
    localEntryFrame: 1,
    frameCount: 142,
    scenarioIds: expectedScenarios,
  }, `${id}: nested random-sound frame-domain contract`);
  for (const scenarioId of expectedScenarios) {
    const scenario = exactlyOne((manifest.scenarios || []).filter((item) => item.id === scenarioId), `${id}: scenario ${scenarioId}`);
    if (scenario.kind !== "interactive" || scenario.reachable !== true) {
      throw new Error(`${id}: scenario ${scenarioId} must remain a reachable interactive source trace`);
    }
  }

  const ffdecScripts = assertRandomSoundProfileArtifact(inventory, "ffdec-scripts", {
    path: "audit/machine/ffdec-scripts.txt.gz",
    sha256: profile.ffdecScriptsSha256,
  }, id);
  const swfmillXml = assertRandomSoundProfileArtifact(inventory, "swfmill-xml", {
    path: "audit/machine/swfmill.xml.gz",
    sha256: profile.swfmillXmlSha256,
  }, id);
  const courseXml = assertRandomSoundProfileArtifact(inventory, "course-xml", profile.courseXml, id);
  if (profile.indexedHostArtifactId) {
    const expectedHost = profile.boundArtifacts.hostEntryEvidence;
    const workspaceRelativeHost = expectedHost.path.replace(`migrations/${id}/`, "");
    assertRandomSoundProfileArtifact(inventory, profile.indexedHostArtifactId, {
      path: workspaceRelativeHost,
      sha256: expectedHost.sha256,
    }, id);
  }

  const rootTimeline = exactlyOne((inventory.timelineInventory || []).filter((item) => item.timelineId === "root"), `${id}: root timeline`);
  if (rootTimeline.frameCount !== 10) throw new Error(`${id}: root source timeline frame count differs`);
  assertCanonicalValue(
    (rootTimeline.frameLabels || []).filter((item) => item.frame === 6),
    [{frame: 6, label: "begin"}],
    `${id}: root begin label`,
  );
  assertCanonicalValue(
    (rootTimeline.namedPlacements || [])
      .filter((item) => item.frame === 6 && item.name === "animation")
      .map(({depth, frame, name, objectId}) => ({depth, frame, name, objectId})),
    [{depth: "1", frame: 6, name: "animation", objectId: profile.sourceObjectId}],
    `${id}: root main-animation placement`,
  );
  const mainTimeline = exactlyOne(
    (inventory.timelineInventory || []).filter((item) => item.timelineId === profile.frameDomainId),
    `${id}: ${profile.frameDomainId} source timeline`,
  );
  if (mainTimeline.objectId !== profile.sourceObjectId || mainTimeline.frameCount !== 142) {
    throw new Error(`${id}: random-sound source timeline identity or frame count differs`);
  }
  assertCanonicalValue(
    (mainTimeline.namedPlacements || [])
      .filter((item) => /^Mc_Sound_[01]$/.test(item.name || ""))
      .map(({depth, frame, name, objectId}) => ({depth, frame, name, objectId}))
      .sort((left, right) => compareText(left.name, right.name)),
    profile.branches.map(({depth, instanceName: name, objectId}) => ({depth, frame: 1, name, objectId})),
    `${id}: sound placements`,
  );

  const rootRequest = sourceScript(inventory, {
    collection: "nonEventScripts",
    script: "frame_1/DoAction.as",
    bodySha256: RANDOM_SOUND_SCRIPT_BODY_SHA256.childPreloaderRequest,
  });
  const rootStop = sourceScript(inventory, {
    collection: "nonEventScripts",
    script: "frame_6/DoAction.as",
    bodySha256: RANDOM_SOUND_SCRIPT_BODY_SHA256.stop,
  });
  const randomSelection = randomSoundScript(inventory, profile, 1, RANDOM_SOUND_SCRIPT_BODY_SHA256.naturalRandomSelection);
  const audioDispatch = randomSoundScript(inventory, profile, 5, RANDOM_SOUND_SCRIPT_BODY_SHA256.selectedAudioDispatch);
  const terminalStop = randomSoundScript(inventory, profile, 142, RANDOM_SOUND_SCRIPT_BODY_SHA256.stop);
  assertCanonicalValue(
    (rootRequest.signals?.calls || []).map(({target, arguments: argumentsValue}) => ({target, arguments: argumentsValue})),
    [
      {target: "_level0.InternalPreloader.gotoAndPlay", arguments: "\"jump_check\""},
      {target: "stop", arguments: ""},
    ],
    `${id}: child preloader request`,
  );
  assertCanonicalValue(
    (rootStop.signals?.calls || []).map(({target, arguments: argumentsValue}) => ({target, arguments: argumentsValue})),
    [{target: "stop", arguments: ""}],
    `${id}: root frame 6 stop`,
  );
  assertCanonicalValue(
    (randomSelection.signals?.calls || []).map(({target, arguments: argumentsValue}) => ({target, arguments: argumentsValue})),
    [{target: "random", arguments: "2"}],
    `${id}: frame 1 random(2) call`,
  );
  assertCanonicalValue(
    (randomSelection.signals?.randomCalls || []).map(({target, arguments: argumentsValue}) => ({target, arguments: argumentsValue})),
    [{target: "random", arguments: "2"}],
    `${id}: frame 1 random-call classification`,
  );
  assertCanonicalValue(
    (randomSelection.signals?.assignments || []).map(({target, operator, expression}) => ({target, operator, expression})),
    [{target: "_global.tempRandomSoundMc", operator: "=", expression: "\"Mc_Sound_\" + tempNum"}],
    `${id}: frame 1 selected-sound assignment`,
  );
  assertCanonicalValue(
    (audioDispatch.signals?.calls || []).map(({target, arguments: argumentsValue}) => ({target, arguments: argumentsValue})),
    [{target: "eval", arguments: "_global.tempRandomSoundMc).gotoAndPlay(2"}],
    `${id}: frame 5 selected-sound dispatch`,
  );
  assertCanonicalValue(
    (terminalStop.signals?.calls || []).map(({target, arguments: argumentsValue}) => ({target, arguments: argumentsValue})),
    [{target: "stop", arguments: ""}],
    `${id}: frame 142 stop`,
  );

  const audioInitialStops = new Map();
  for (const branch of profile.branches) {
    const audioTimeline = exactlyOne(
      (inventory.timelineInventory || []).filter((item) => item.timelineId === `sprite-${branch.objectId}`),
      `${id}: audio sprite ${branch.objectId}`,
    );
    if (audioTimeline.objectId !== branch.objectId || audioTimeline.frameCount !== 135) {
      throw new Error(`${id}: audio sprite ${branch.objectId} identity or frame count differs`);
    }
    const initialStop = sourceScript(inventory, {
      collection: "nonEventScripts",
      script: `DefineSprite_${branch.objectId}/frame_1/DoAction.as`,
      bodySha256: RANDOM_SOUND_SCRIPT_BODY_SHA256.stop,
    });
    const structuralTerminalStop = sourceScript(inventory, {
      collection: "nonEventScripts",
      script: `DefineSprite_${branch.objectId}/frame_135/DoAction.as`,
      bodySha256: RANDOM_SOUND_SCRIPT_BODY_SHA256.stop,
    });
    for (const [label, entry] of [["initial", initialStop], ["structural terminal", structuralTerminalStop]]) {
      assertCanonicalValue(
        (entry.signals?.calls || []).map(({target, arguments: argumentsValue}) => ({target, arguments: argumentsValue})),
        [{target: "stop", arguments: ""}],
        `${id}: audio sprite ${branch.objectId} ${label} stop`,
      );
    }
    audioInitialStops.set(branch.outcome, initialStop);
  }

  const observedRequirementIds = (coverage.requirements || [])
    .filter((item) => item.frameDomainId === profile.frameDomainId)
    .map((item) => item.requirementId)
    .sort(compareText);
  assertCanonicalValue(observedRequirementIds, randomSoundExpectedRequirementIds(profile), `${id}: nested trace requirement set`);
  const requirements = profile.branches.map((branch) => exactlyOne(
    (coverage.requirements || []).filter((item) => (
      item.requirementId === `req:${profile.frameDomainId}:${branch.scenario}:en` &&
      item.frameDomainId === profile.frameDomainId &&
      item.scenario === branch.scenario &&
      item.language === "en" &&
      String(item.seed) === "0"
    )),
    `${id}: English ${branch.scenario} natural-observation requirement`,
  ));

  const swfmillRoot = {artifactId: "swfmill-xml", timelineId: "root", frame: 6, label: "begin"};
  const swfmillMain = {artifactId: "swfmill-xml", timelineId: profile.frameDomainId};
  const coursePlacement = {
    artifactId: "course-xml",
    line: profile.courseXml.placementLine,
    placementStatus: profile.courseXml.placementStatus,
  };
  const indexedHostEvidence = profile.indexedHostArtifactId
    ? [{artifactId: profile.indexedHostArtifactId, derivationRole: "minimal-child-entry-handoff-only"}]
    : [];
  const naturalEntryEvidence = [swfmillRoot, swfmillMain, rootRequest.evidence, rootStop.evidence, coursePlacement, ...indexedHostEvidence];
  const commonSourceEvidence = [
    ...naturalEntryEvidence,
    randomSelection.evidence,
    audioDispatch.evidence,
    terminalStop.evidence,
    ...profile.branches.map((branch) => audioInitialStops.get(branch.outcome).evidence),
  ];
  const outsideThisSpecification = [
    "The complete original course shell, natural course navigation, load-completion timing, and full-shell event ordering are not proven by this minimal child-entry adapter schedule.",
    "Spanish entry/language state is unresolved; these schedules are emitted only for the English trace requirements.",
    "Spoken language/content, authoritative listening, SoundStream synchronization, and audio-child-to-parent frame timing remain unresolved; audio sprite frame 135 is not mapped to a guessed parent frame.",
    "The requirement seed is not injected into AVM1 random(2); sound-from-seed remains unresolved and branch outcomes must be observed naturally and classified.",
    "Replay/reset behavior, visual capture, RMSE, strict validation, human review, and owner acceptance remain separate unresolved gates.",
  ];

  return requirements.map((requirement) => {
    const branch = profile.branches.find((item) => item.scenario === requirement.scenario);
    const otherBranch = profile.branches.find((item) => item.outcome !== branch.outcome);
    const entryState = {
      rootFrame: 6,
      rootPlayState: "stopped",
      localFrame: 1,
      localPlayState: "playing",
      branchSelection: "pending-natural-random-observation",
      randomSeedInjection: "forbidden-not-supported-by-source",
      requiredLanguage: "en",
      languageAndSpokenContentAuthority: "unresolved-pending-authorized-listening",
    };
    const branchSelectedState = {
      rootFrame: 6,
      rootPlayState: "stopped",
      localFrame: 1,
      localPlayState: "playing",
      localVariables: {tempNum: branch.outcome},
      globalVariables: {tempRandomSoundMc: branch.instanceName},
      branchSelection: {
        selectionMechanism: "naturally-observed-avm1-random(2)-outcome",
        observedOutcome: branch.outcome,
        selectedInstanceName: branch.instanceName,
        selectedObjectId: Number(branch.objectId),
        seedInjected: false,
      },
      audioChildren: [
        {instanceName: branch.instanceName, objectId: Number(branch.objectId), localFrame: 1, playState: "stopped"},
        {instanceName: otherBranch.instanceName, objectId: Number(otherBranch.objectId), localFrame: 1, playState: "stopped"},
      ].sort((left, right) => compareText(left.instanceName, right.instanceName)),
    };
    const audioDispatchedState = {
      rootFrame: 6,
      rootPlayState: "stopped",
      localFrame: 5,
      localPlayState: "playing",
      globalVariables: {tempRandomSoundMc: branch.instanceName},
      selectedAudio: {
        instanceName: branch.instanceName,
        objectId: Number(branch.objectId),
        localFrame: 2,
        playState: "playing",
      },
      unselectedAudio: {
        instanceName: otherBranch.instanceName,
        objectId: Number(otherBranch.objectId),
        localFrame: 1,
        playState: "stopped",
      },
    };
    const terminalState = {
      rootFrame: 6,
      rootPlayState: "stopped",
      localFrame: 142,
      localPlayState: "stopped",
      naturallyObservedBranch: branch.scenario,
      audioChildState: "not-claimed-by-this-minimal-schedule",
    };
    const frame1Evidence = [swfmillMain, randomSelection.evidence, audioInitialStops.get(0).evidence, audioInitialStops.get(1).evidence];
    const frame5Evidence = [swfmillMain, audioDispatch.evidence, audioInitialStops.get(branch.outcome).evidence];
    const frame142Evidence = [swfmillMain, terminalStop.evidence];
    return {
      requirementId: requirement.requirementId,
      status: READY_SCHEDULE_STATUS,
      noExternalActionsRequired: true,
      sourceEvidence: commonSourceEvidence,
      naturalEntry: {
        status: "source-evidenced",
        sourceTarget: {
          adapterScope: "minimal-hash-bound-child-entry-adapter",
          rootTimelineId: "root",
          childRootEntryLabel: "begin",
          childRootFrame: 6,
          childInstanceId: "main-animation",
          childTimelineId: profile.frameDomainId,
          hostHandoff: "target.gotoAndPlay(\"begin\") after exact child initialization",
          hostEntryBinding: "sourceBindings.scheduleDerivation.sourceArtifacts.hostEntryEvidence",
          coursePlacementStatus: profile.courseXml.placementStatus,
          completeOriginalCourseShellClaimed: false,
        },
        expectedState: entryState,
        evidence: naturalEntryEvidence,
        authorityBoundary: outsideThisSpecification[0],
      },
      sourceDrivenEvents: [{
        order: 1,
        trigger: {
          kind: "timeline-frame-script",
          timelineId: profile.frameDomainId,
          frame: 1,
          script: randomSelection.script,
          sourceExpression: "tempNum = random(2)",
          execution: "natural-avm1-random-observation-only",
        },
        sourceTarget: {
          timelineId: profile.frameDomainId,
          frame: 1,
          localVariable: "tempNum",
          globalVariable: "_global.tempRandomSoundMc",
          requiredNaturallyObservedOutcome: branch.outcome,
          seedInjectionAllowed: false,
        },
        preState: entryState,
        postState: branchSelectedState,
        evidence: frame1Evidence,
      }, {
        order: 2,
        trigger: {
          kind: "timeline-frame-script",
          timelineId: profile.frameDomainId,
          frame: 5,
          script: audioDispatch.script,
          sourceExpression: "eval(_global.tempRandomSoundMc).gotoAndPlay(2)",
        },
        sourceTarget: {
          timelineId: profile.frameDomainId,
          frame: 5,
          selectedInstanceName: branch.instanceName,
          selectedObjectId: Number(branch.objectId),
          selectedPlacementDepth: Number(branch.depth),
          command: "gotoAndPlay(2)",
        },
        preState: {
          ...branchSelectedState,
          localFrame: 5,
        },
        postState: audioDispatchedState,
        evidence: frame5Evidence,
      }, {
        order: 3,
        trigger: {
          kind: "timeline-frame-script",
          timelineId: profile.frameDomainId,
          frame: 142,
          script: terminalStop.script,
          sourceExpression: "stop()",
        },
        sourceTarget: {timelineId: profile.frameDomainId, frame: 142, command: "stop()"},
        preState: {
          rootFrame: 6,
          rootPlayState: "stopped",
          localFrame: 141,
          localPlayState: "playing",
          naturallyObservedBranch: branch.scenario,
          audioChildState: "not-claimed-by-this-minimal-schedule",
        },
        postState: terminalState,
        evidence: frame142Evidence,
      }],
      orderedSteps: [],
      stateCheckpoints: [{
        id: `frame-1-natural-sound-${branch.outcome}-selected`,
        expectedState: branchSelectedState,
        evidence: frame1Evidence,
      }, {
        id: `frame-5-sound-${branch.outcome}-play-dispatched`,
        expectedState: audioDispatchedState,
        evidence: frame5Evidence,
      }, {
        id: "frame-142-main-timeline-source-stop",
        expectedState: terminalState,
        evidence: frame142Evidence,
      }],
      terminalSemantics: {
        status: "source-evidenced",
        kind: "stopped-terminal",
        expectedState: terminalState,
        evidence: frame142Evidence,
        outsideThisSpecification,
      },
    };
  });
}

async function verifiedWorkspaceArtifact({workspace, inventory, artifactId}) {
  const artifact = indexedEvidenceArtifact(inventory, artifactId, inventory.animationId);
  const resolved = path.resolve(workspace, artifact.path);
  const relative = path.relative(workspace, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${inventory.animationId}: ${artifactId} must remain inside its migration workspace`);
  }
  if (await sha256File(resolved) !== artifact.sha256) {
    throw new Error(`${inventory.animationId}: ${artifactId} bytes differ from the scenario inventory SHA-256`);
  }
  return {artifact, resolved};
}

async function verifiedLockedProjectArtifact({root, animationId, key, descriptor}) {
  const resolved = path.resolve(root, descriptor.path);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${animationId}: locked ${key} artifact must remain inside the project root`);
  }
  const observedSha256 = await sha256File(resolved);
  if (observedSha256 !== descriptor.sha256) {
    throw new Error(`${animationId}: locked ${key} artifact bytes differ from SHA-256 ${descriptor.sha256}`);
  }
  return [key, {
    path: descriptor.path,
    sha256: descriptor.sha256,
    role: descriptor.role,
  }];
}

export async function deriveCanonicalCourseSourceSchedules({id, root, workspace, manifest, coverage, inventory, hashes, python = "python3"}) {
  const randomSoundProfile = RANDOM_SOUND_TRACE_PROFILES[id];
  if (randomSoundProfile) {
    const generatorPath = path.join(root, "scripts", "build-course-trace-specs.mjs");
    const [swfmill, ffdecScripts, generatorSha256, verifiedBoundArtifactEntries] = await Promise.all([
      verifiedWorkspaceArtifact({workspace, inventory, artifactId: "swfmill-xml"}),
      verifiedWorkspaceArtifact({workspace, inventory, artifactId: "ffdec-scripts"}),
      sha256File(generatorPath),
      Promise.all(Object.entries(randomSoundProfile.boundArtifacts).map(([key, descriptor]) => (
        verifiedLockedProjectArtifact({root, animationId: id, key, descriptor})
      ))),
    ]);
    const derivedSchedules = deriveRandomSoundBranchSourceSchedulesFromEvidence({manifest, coverage, inventory, hashes});
    const sourceArtifacts = {
      ...Object.fromEntries(verifiedBoundArtifactEntries),
      swfmillXml: {
        path: swfmill.artifact.path,
        sha256: swfmill.artifact.sha256,
        role: "hash-indexed-static-display-list-and-timeline-source",
      },
      ffdecScripts: {
        path: ffdecScripts.artifact.path,
        sha256: ffdecScripts.artifact.sha256,
        role: "hash-indexed-exported-ActionScript-source",
      },
      scenarioInventoryTechnicalProjection: {
        projection: SCENARIO_INVENTORY_PROJECTION.id,
        sha256: hashes.inventoryTechnicalSha256,
        role: "stable-technical-inventory-projection",
      },
    };
    const limitations = [
      "This binding proves only a static, minimal child-entry adapter candidate; it does not execute or reconstruct the full original course shell.",
      "It does not prove English or Spanish spoken content, authoritative listening, SoundStream synchronization, or audio-child-to-parent timing.",
      "It does not inject or map a seed to AVM1 random(2); sound-from-seed remains unresolved and only naturally observed outcomes may be classified.",
      "It creates no original-runtime execution, frame capture, RMSE, Replay, strict-validation, human-review, or owner-acceptance evidence.",
    ];
    const binding = {
      status: "hash-bound-static-source-derived-minimal-child-entry-candidate-not-runtime-execution",
      candidateScope: "isolated-minimal-child-entry-adapter-for-exact-preserved-child",
      generator: {path: "scripts/build-course-trace-specs.mjs", sha256: generatorSha256},
      sourceArtifacts,
      sourceScriptBodies: {
        frame1NaturalRandomSelection: {
          script: `DefineSprite_${randomSoundProfile.sourceObjectId}/frame_1/DoAction.as`,
          sha256: RANDOM_SOUND_SCRIPT_BODY_SHA256.naturalRandomSelection,
        },
        frame5SelectedAudioDispatch: {
          script: `DefineSprite_${randomSoundProfile.sourceObjectId}/frame_5/DoAction.as`,
          sha256: RANDOM_SOUND_SCRIPT_BODY_SHA256.selectedAudioDispatch,
        },
        frame142MainStop: {
          script: `DefineSprite_${randomSoundProfile.sourceObjectId}/frame_142/DoAction.as`,
          sha256: RANDOM_SOUND_SCRIPT_BODY_SHA256.stop,
        },
      },
      coursePlacement: {
        path: randomSoundProfile.courseXml.path,
        sha256: randomSoundProfile.courseXml.sha256,
        line: randomSoundProfile.courseXml.placementLine,
        status: randomSoundProfile.courseXml.placementStatus,
      },
      naturalRandomPolicy: {
        sourceCall: "random(2)",
        allowedMethod: "restart-untouched-child-and-classify-naturally-observed-outcome",
        seedInjectionAllowed: false,
        forcedBranchAllowed: false,
      },
      derivedScheduleSetSha256: sha256Text(canonicalJson(derivedSchedules)),
      limitations,
      executionEvidenceCreated: false,
      strictAcceptanceEffect: "none; schedule readiness is only a prerequisite for future authoritative natural-trace execution",
    };
    return {
      derivedSchedules,
      scheduleDerivationBindings: Object.fromEntries(derivedSchedules.map((schedule) => [schedule.requirementId, binding])),
    };
  }
  if (id !== RW_002_TRACE_PROFILE.animationId) return {derivedSchedules: [], scheduleDerivationBindings: {}};
  const [swfmill, ffdecScripts] = await Promise.all([
    verifiedWorkspaceArtifact({workspace, inventory, artifactId: "swfmill-xml"}),
    verifiedWorkspaceArtifact({workspace, inventory, artifactId: "ffdec-scripts"}),
  ]);
  const parserPath = path.join(root, RW_002_GEOMETRY_PARSER);
  const generatorPath = path.join(root, "scripts", "build-course-trace-specs.mjs");
  const [{stdout}, parserSha256, generatorSha256] = await Promise.all([
    execFile(python, [
      parserPath,
      "--swfmill", swfmill.resolved,
      "--sprite-object-id", "334",
      "--root-placement-name", "animation",
      "--root-placement-frame", "6",
      "--button-object-id", "111",
      "--hit-shape-object-id", "110",
      "--button-frame", "673",
      "--button-depth", "722",
      "--button-removal-frame", "674",
    ], {maxBuffer: 4 * 1024 * 1024}),
    sha256File(parserPath),
    sha256File(generatorPath),
  ]);
  let geometry;
  try {
    geometry = JSON.parse(stdout);
  } catch (error) {
    throw new Error(`${id}: geometry parser did not return JSON: ${error.message}`);
  }
  const derivedSchedules = deriveRw002SourceSchedulesFromEvidence({manifest, coverage, inventory, hashes, geometry});
  const binding = {
    status: "hash-bound-static-source-derivation-not-runtime-execution",
    generator: {path: "scripts/build-course-trace-specs.mjs", sha256: generatorSha256},
    geometryParser: {path: RW_002_GEOMETRY_PARSER, sha256: parserSha256},
    sourceArtifacts: {
      sourceSwf: {path: manifest.source.swf, sha256: hashes.sourceSwfSha256},
      swfmillXml: {path: swfmill.artifact.path, sha256: swfmill.artifact.sha256},
      ffdecScripts: {path: ffdecScripts.artifact.path, sha256: ffdecScripts.artifact.sha256},
      scenarioInventoryTechnicalProjection: {
        projection: SCENARIO_INVENTORY_PROJECTION.id,
        sha256: hashes.inventoryTechnicalSha256,
      },
    },
    derivedGeometrySha256: sha256Text(canonicalJson(geometry)),
    executionEvidenceCreated: false,
  };
  return {
    derivedSchedules,
    scheduleDerivationBindings: Object.fromEntries(derivedSchedules.map((schedule) => [schedule.requirementId, binding])),
  };
}

function validateDocumentBindings({id, manifest, coverage, inventory, hashes}) {
  if (manifest.animationId !== id || coverage.animationId !== id || inventory.animationId !== id) {
    throw new Error(`${id}: manifest, coverage, and scenario inventory identities must match`);
  }
  if (coverage.schemaVersion !== 2) throw new Error(`${id}: full-frame coverage schemaVersion must be 2`);
  if (inventory.schemaVersion !== 1 || inventory.inventoryStatus !== "static-exhaustive-runtime-unverified" || inventory.migrationStatusChanged !== false) {
    throw new Error(`${id}: scenario inventory must be schema 1, fail-closed, and status-neutral`);
  }
  assertSha256(manifest.source?.swfSha256, `${id}: manifest source SWF SHA-256`);
  if (hashes.sourceSwfSha256 !== manifest.source.swfSha256) throw new Error(`${id}: preserved source SWF hash mismatch`);
  if (inventory.source?.swf !== manifest.source.swf || inventory.source?.swfSha256 !== manifest.source.swfSha256) {
    throw new Error(`${id}: scenario inventory source binding differs from manifest`);
  }
  const manifestArtifact = inventory.evidenceIndex?.find((item) => item.artifactId === "migration-technical-contract")
    || inventory.evidenceIndex?.find((item) => item.artifactId === "migration-manifest");
  if (manifestArtifact?.path !== "migration.json") {
    throw new Error(`${id}: scenario inventory does not identify migration.json`);
  }
  if (manifestArtifact.artifactId === "migration-technical-contract" && (
    manifestArtifact.hashMode !== CANONICAL_PROJECTION_ENCODING ||
    manifestArtifact.projection !== TECHNICAL_MANIFEST_PROJECTION.id ||
    manifestArtifact.sha256 !== hashes.manifestTechnicalSha256
  )) {
    throw new Error(`${id}: scenario inventory technical-manifest projection binding is stale`);
  }
  if (!Array.isArray(coverage.requirements) || !coverage.requirements.length) throw new Error(`${id}: coverage has no requirements`);
  const requirementIds = new Set();
  const filenames = new Set();
  for (const requirement of coverage.requirements) {
    const requirementId = assertNonEmptyString(requirement.requirementId, `${id}: requirementId`);
    if (requirementIds.has(requirementId)) throw new Error(`${id}: duplicate requirementId ${requirementId}`);
    requirementIds.add(requirementId);
    const filename = `${safeRequirementId(requirementId)}.json`;
    if (filenames.has(filename)) throw new Error(`${id}: safe requirement filename collision at ${filename}`);
    filenames.add(filename);
    const inventoryBindings = (requirement.blockingEvidence || [])
      .filter((item) => item.file === "audit/scenario-inventory.json")
      .map((item) => item.sha256);
    if (inventoryBindings.length !== 1 || inventoryBindings[0] !== hashes.inventoryFileSha256) {
      throw new Error(`${id}/${requirementId}: coverage is not bound to the exact scenario inventory SHA-256`);
    }
  }
}

export function buildTraceSpecsFromDocuments({
  id,
  manifest,
  coverage,
  inventory,
  hashes,
  derivedSchedules = [],
  scheduleDerivationBindings = {},
  pendingTracePlanSourceBindings = {},
}) {
  validateDocumentBindings({id, manifest, coverage, inventory, hashes});
  const domains = new Map((manifest.implementation?.frameDomains || []).map((domain) => [domain.id, domain]));
  const canonicalRequirements = coverage.requirements.filter((requirement) => {
    const domain = domains.get(requirement.frameDomainId);
    if (!domain) return true; // buildTraceSpec retains the canonical unknown-domain failure.
    return classifyStrictFullDomainRequirement(
      requirement,
      domain.frameCount,
      `${id}/${requirement.requirementId || "unknown"}`,
    ).eligible;
  });
  const specs = canonicalRequirements.map((requirement) => buildTraceSpec({
    manifest,
    coverage,
    inventory,
    hashes,
    requirement,
    derivedSchedules,
    scheduleDerivationBindings,
    pendingTracePlanSourceBindings,
  }));
  return specs.sort((left, right) => compareText(left.requirementId, right.requirementId));
}

async function readPilotDocuments({id, root, migrationsRoot}) {
  const workspace = path.join(migrationsRoot, id);
  const manifestPath = path.join(workspace, "migration.json");
  const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
  const inventoryPath = path.join(workspace, "audit", "scenario-inventory.json");
  const [manifestText, coverageText, inventoryText] = await Promise.all([
    readFile(manifestPath, "utf8"),
    readFile(coveragePath, "utf8"),
    readFile(inventoryPath, "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  const coverage = JSON.parse(coverageText);
  const inventory = JSON.parse(inventoryText);
  const sourcePath = path.resolve(root, manifest.source?.swf || "");
  const preservedRoot = path.join(root, "source-assets", "flash", "HELP MATH_ORIGINAL FILES");
  const relativeSource = path.relative(preservedRoot, sourcePath);
  if (!manifest.source?.swf || relativeSource.startsWith("..") || path.isAbsolute(relativeSource)) {
    throw new Error(`${id}: manifest SWF must remain inside the preserved source archive`);
  }
  const sourceSwfSha256 = await sha256File(sourcePath);
  return {
    workspace,
    manifest,
    coverage,
    inventory,
    hashes: {
      sourceSwfSha256,
      manifestTechnicalSha256: technicalManifestSha256(manifest),
      coverageTechnicalSha256: traceCoverageSha256(coverage),
      inventoryTechnicalSha256: scenarioInventorySha256(inventory),
      manifestFileSha256: sha256Text(manifestText),
      coverageFileSha256: sha256Text(coverageText),
      inventoryFileSha256: sha256Text(inventoryText),
    },
  };
}

function catalogRelativeSourcePath(value) {
  const normalized = portable(value || "");
  if (!normalized.startsWith(PRESERVED_SOURCE_PREFIX)) return "";
  return normalized.slice(PRESERVED_SOURCE_PREFIX.length);
}

async function assertRegularNonSymlink(candidate, label) {
  const info = await lstat(candidate);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`${label} must be a regular non-symlink file`);
}

async function assertDirectoryNonSymlink(candidate, label) {
  const info = await lstat(candidate);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`${label} must be a real non-symlink directory`);
}

async function loadReleaseSelection({root, migrationsRoot, lessonReleasesPath, releaseId, ids}) {
  const catalogPath = projectContainedPath(
    root,
    lessonReleasesPath || path.join(root, "catalog", "lesson-releases.json"),
    "Lesson release catalog",
  );
  await assertRegularNonSymlink(catalogPath, "Lesson release catalog");
  await assertDirectoryNonSymlink(migrationsRoot, "Migration root");
  const [physicalRoot, physicalCatalog, physicalMigrationsRoot] = await Promise.all([
    realpath(root),
    realpath(catalogPath),
    realpath(migrationsRoot),
  ]);
  projectContainedPath(physicalRoot, physicalCatalog, "Physical lesson release catalog");
  projectContainedPath(physicalRoot, physicalMigrationsRoot, "Physical migration root");

  const catalogBytes = await readFile(catalogPath);
  let catalog;
  try {
    catalog = JSON.parse(catalogBytes.toString("utf8"));
  } catch (error) {
    throw new Error(`Lesson release catalog is not valid JSON: ${error.message}`);
  }
  const selection = selectTraceLessonRelease(catalog, {releaseId, ids});
  const catalogBinding = {
    path: portable(path.relative(root, catalogPath)),
    bytes: catalogBytes.length,
    sha256: sha256Text(catalogBytes),
    schemaVersion: catalog.schemaVersion,
    releaseId,
    releaseFingerprintSha256: sha256Text(canonicalJson(selection.release)),
    orderedMemberIdentitySha256: sha256Text(canonicalJson(selection.release.members.map((member) => ({
      ordinal: member.ordinal,
      animationId: member.animationId,
      assetId: member.assetId,
      sourcePath: member.source.path,
      sourceSha256: member.source.sha256,
    })))),
  };
  const suffix = selection.selectionIdentity.scope === "complete-atomic-release"
    ? ""
    : `--subset-${selection.selectionSha256}`;
  return {
    ...selection,
    catalogBinding,
    indexPath: path.join(migrationsRoot, RELEASE_INDEX_DIRECTORY, `${releaseId}${suffix}.json`),
  };
}

async function validateReleaseWorkspace({id, root, documents, member}) {
  const {workspace, manifest, hashes} = documents;
  await assertDirectoryNonSymlink(workspace, `${id}: migration workspace`);
  for (const relative of [
    "migration.json",
    "evidence/full-frame-coverage.json",
    "audit/scenario-inventory.json",
    "audit/frame-domain-disposition.json",
  ]) {
    await assertRegularNonSymlink(path.join(workspace, ...relative.split("/")), `${id}: ${relative}`);
  }
  if (manifest.animationId !== id || manifest.id !== id) throw new Error(`${id}: workspace identity differs from release member`);
  if (manifest.assetId !== member.assetId) throw new Error(`${id}: workspace assetId differs from release member`);
  if (manifest.source?.swfSha256 !== member.source.sha256 || hashes.sourceSwfSha256 !== member.source.sha256) {
    throw new Error(`${id}: workspace or physical SWF hash differs from release member`);
  }
  if (catalogRelativeSourcePath(manifest.source?.swf) !== member.source.path) {
    throw new Error(`${id}: workspace SWF path differs from release member`);
  }
  if (manifest.source?.placementPath && catalogRelativeSourcePath(manifest.source.placementPath) !== member.source.path) {
    throw new Error(`${id}: workspace placement path differs from release member`);
  }
  const sourcePath = path.resolve(root, manifest.source.swf);
  await assertRegularNonSymlink(sourcePath, `${id}: preserved source SWF`);
  const [physicalPreservedRoot, physicalSource] = await Promise.all([
    realpath(path.join(root, "source-assets", "flash", "HELP MATH_ORIGINAL FILES")),
    realpath(sourcePath),
  ]);
  projectContainedPath(physicalPreservedRoot, physicalSource, `${id}: physical preserved source SWF`);
}

function validateDispositionCounts(id, disposition) {
  if (!Array.isArray(disposition.timelines) || !disposition.timelines.length) {
    throw new Error(`${id}: frame-domain disposition has no timelines`);
  }
  const counts = {
    "declared-frame-domain": 0,
    "composite-child-with-parent": 0,
    "independent-required": 0,
    nonvisual: 0,
    unresolved: 0,
  };
  for (const timeline of disposition.timelines) {
    if (!Object.hasOwn(counts, timeline?.disposition)) {
      throw new Error(`${id}: frame-domain disposition contains unknown disposition ${timeline?.disposition}`);
    }
    counts[timeline.disposition] += 1;
  }
  for (const [kind, count] of Object.entries(counts)) {
    if (disposition.summary?.dispositionCounts?.[kind] !== count) {
      throw new Error(`${id}: frame-domain disposition summary count for ${kind} is stale`);
    }
  }
  return counts;
}

async function readReleaseFrameDomainDisposition({id, workspace, manifest, hashes}) {
  const dispositionPath = path.join(workspace, "audit", "frame-domain-disposition.json");
  const dispositionBytes = await readFile(dispositionPath);
  let disposition;
  try {
    disposition = JSON.parse(dispositionBytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${id}: frame-domain disposition is not valid JSON: ${error.message}`);
  }
  if (disposition.schemaVersion !== 1 || disposition.animationId !== id || disposition.migrationStatusChanged !== false) {
    throw new Error(`${id}: frame-domain disposition identity/status is invalid`);
  }
  if (
    disposition.generatedFrom?.scenarioInventory?.path !== "audit/scenario-inventory.json" ||
    disposition.generatedFrom.scenarioInventory.sha256 !== hashes.inventoryFileSha256
  ) {
    throw new Error(`${id}: frame-domain disposition does not bind the exact scenario-inventory file SHA-256`);
  }
  if (
    disposition.generatedFrom?.migrationManifest?.path !== "migration.json" ||
    disposition.generatedFrom.migrationManifest.technicalProjection !== TECHNICAL_MANIFEST_PROJECTION.id ||
    disposition.generatedFrom.migrationManifest.technicalProjectionSha256 !== hashes.manifestTechnicalSha256
  ) {
    throw new Error(`${id}: frame-domain disposition technical-manifest binding is stale`);
  }
  if (
    disposition.generatedFrom?.sourceSwf?.path !== manifest.source.swf ||
    disposition.generatedFrom.sourceSwf.sha256 !== hashes.sourceSwfSha256
  ) {
    throw new Error(`${id}: frame-domain disposition source SWF binding is stale`);
  }
  const counts = validateDispositionCounts(id, disposition);
  for (const domain of manifest.implementation?.frameDomains || []) {
    const candidates = disposition.timelines.filter((timeline) => (
      timeline.sourceTimelineId === domain.sourceTimelineId &&
      timeline.frameCount === domain.frameCount &&
      timeline.disposition === "declared-frame-domain" &&
      timeline.declaredFrameDomains?.some((declared) => (
        declared.frameDomainId === domain.id &&
        declared.sourceTimelineId === domain.sourceTimelineId &&
        declared.frameCount === domain.frameCount
      ))
    ));
    if (candidates.length !== 1) {
      throw new Error(`${id}: declared frame domain ${domain.id} is not uniquely bound by frame-domain disposition`);
    }
  }
  return {
    document: disposition,
    binding: {
      path: "audit/frame-domain-disposition.json",
      sha256: sha256Text(dispositionBytes),
      fileSha256AtSpecGeneration: sha256Text(dispositionBytes),
      schemaVersion: disposition.schemaVersion,
      status: disposition.status,
      dispositionCounts: counts,
      unresolvedTimelineCount: counts.unresolved,
      independentRequiredTimelineCount: counts["independent-required"],
      highRiskIndependentCandidateCount: disposition.summary?.highRiskIndependentCandidateCount || 0,
      scenarioInventoryFileSha256: hashes.inventoryFileSha256,
      technicalManifestProjectionSha256: hashes.manifestTechnicalSha256,
    },
  };
}

async function listJsonBasenames(directory) {
  if (!(await exists(directory))) return [];
  return (await readdir(directory, {withFileTypes: true}))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort(compareText);
}

async function loadPriorGeneratedPaths(indexPath, root) {
  if (!(await exists(indexPath))) return new Set();
  const index = JSON.parse(await readFile(indexPath, "utf8"));
  const paths = new Set();
  for (const pilot of index.pilots || index.members || []) {
    for (const item of pilot.traceSpecs || []) {
      if (typeof item.file !== "string") continue;
      const resolved = path.resolve(root, item.file);
      const expectedRoot = path.join(path.resolve(root, "migrations", pilot.animationId), "audit", "trace-specs");
      const relative = path.relative(expectedRoot, resolved);
      if (!relative.startsWith("..") && !path.isAbsolute(relative) && path.extname(resolved) === ".json") paths.add(resolved);
    }
  }
  return paths;
}

async function preflightGeneratedDirectoryReconciliation({directory, expectedBasenames, priorGeneratedPaths, check, id}) {
  const existing = await listJsonBasenames(directory);
  const unexpected = existing.filter((basename) => !expectedBasenames.has(basename));
  if (!unexpected.length) return unexpected;
  if (check) throw new Error(`${id}: unexpected stale trace spec(s): ${unexpected.join(", ")}`);
  for (const basename of unexpected) {
    if (!priorGeneratedPaths.has(path.join(directory, basename))) {
      throw new Error(`${id}: refusing to remove unindexed JSON from generated trace-spec directory: ${basename}`);
    }
  }
  return unexpected;
}

async function reconcileGeneratedDirectory({directory, expectedBasenames, priorGeneratedPaths, check, id}) {
  const unexpected = await preflightGeneratedDirectoryReconciliation({
    directory,
    expectedBasenames,
    priorGeneratedPaths,
    check,
    id,
  });
  for (const basename of unexpected) {
    const candidate = path.join(directory, basename);
    await unlink(candidate);
  }
}

function bindReleaseTraceSpec({spec, releaseSelection, member, dispositionBinding}) {
  const memberIdentity = {
    ordinal: member.ordinal,
    animationId: member.animationId,
    assetId: member.assetId,
    releaseRole: member.releaseRole,
    shardId: member.shardId,
    sourcePath: member.source.path,
    sourceSha256: member.source.sha256,
  };
  return {
    ...spec,
    authorityStatement: [
      ...spec.authorityStatement,
      "The exact atomic lesson-release membership, current scenario-inventory bytes, and current frame-domain disposition are hash-bound planning inputs only; unresolved dispositions and natural traces remain fail-closed.",
    ],
    lessonReleaseMembership: {
      releaseId: releaseSelection.release.releaseId,
      publicationMode: releaseSelection.release.publicationMode,
      expectedAtomicMemberCount: releaseSelection.release.expectedCounts.members,
      releaseFingerprintSha256: releaseSelection.catalogBinding.releaseFingerprintSha256,
      member: memberIdentity,
      memberIdentitySha256: sha256Text(canonicalJson(memberIdentity)),
      publicationAuthorized: false,
    },
    sourceBindings: {
      ...spec.sourceBindings,
      lessonReleaseCatalog: releaseSelection.catalogBinding,
      scenarioInventoryExactFile: {
        path: "audit/scenario-inventory.json",
        sha256: spec.sourceBindings.coverageInventoryBinding.fileSha256AtSpecGeneration,
        role: "exact-current-static-scenario-inventory-file-at-spec-generation",
      },
      frameDomainDisposition: dispositionBinding,
    },
  };
}

export async function buildCourseTraceSpecs(options = {}) {
  const root = path.resolve(options.projectRoot || projectRoot);
  const migrationsRoot = path.resolve(options.migrationsRoot || path.join(root, "migrations"));
  const sourceScheduleDeriver = options.sourceScheduleDeriver || deriveCanonicalCourseSourceSchedules;
  const pendingTracePlanSourceBindingResolver = options.pendingTracePlanSourceBindingResolver
    || deriveTs006PendingPlanSourceBindings;
  if (typeof sourceScheduleDeriver !== "function") throw new Error("sourceScheduleDeriver must be a function");
  if (typeof pendingTracePlanSourceBindingResolver !== "function") {
    throw new Error("pendingTracePlanSourceBindingResolver must be a function");
  }
  const releaseMode = Boolean(options.releaseId);
  const releaseSelection = releaseMode ? await loadReleaseSelection({
    root,
    migrationsRoot,
    lessonReleasesPath: options.lessonReleasesPath || path.join(root, "catalog", "lesson-releases.json"),
    releaseId: options.releaseId,
    ids: options.ids || [],
  }) : null;
  const ids = releaseMode
    ? releaseSelection.members.map((member) => member.animationId)
    : Array.isArray(options.ids) && options.ids.length ? options.ids : COURSE_TRACE_PILOT_IDS;
  if (!releaseMode && (
    ids.length !== COURSE_TRACE_PILOT_IDS.length ||
    ids.some((id, index) => id !== COURSE_TRACE_PILOT_IDS[index])
  )) {
    throw new Error(`Explicit --id selection requires --release-id; otherwise the course trace factory must process the canonical ${COURSE_TRACE_PILOT_IDS.length} pilots in canonical order`);
  }
  const indexPath = releaseMode
    ? releaseSelection.indexPath
    : path.join(migrationsRoot, GLOBAL_INDEX_BASENAME);
  const priorGeneratedPaths = await loadPriorGeneratedPaths(indexPath, root);
  const results = [];
  const pilotIndexEntries = [];
  const prepared = [];
  for (const [memberIndex, id] of ids.entries()) {
    const documents = await readPilotDocuments({id, root, migrationsRoot});
    const member = releaseMode ? releaseSelection.members[memberIndex] : null;
    let disposition = null;
    if (releaseMode) {
      await validateReleaseWorkspace({id, root, documents, member});
      disposition = await readReleaseFrameDomainDisposition({id, ...documents});
    }
    const pendingTracePlanSourceBindings = await pendingTracePlanSourceBindingResolver({
      id,
      root,
      ...documents,
    });
    const scheduleBundle = await sourceScheduleDeriver({
      id,
      root,
      ...documents,
      python: options.python || "python3",
    });
    const baseSpecs = buildTraceSpecsFromDocuments({
      id,
      ...documents,
      ...scheduleBundle,
      pendingTracePlanSourceBindings,
    });
    const specs = releaseMode
      ? baseSpecs.map((spec) => bindReleaseTraceSpec({
          spec,
          releaseSelection,
          member,
          dispositionBinding: disposition.binding,
        }))
      : baseSpecs;
    const directory = releaseMode
      ? path.join(documents.workspace, "audit", "trace-specs", "lesson-releases", releaseSelection.release.releaseId)
      : path.join(documents.workspace, "audit", "trace-specs");
    const files = specs.map((spec) => {
      const basename = `${safeRequirementId(spec.requirementId)}.json`;
      const rendered = renderJson(spec);
      return {
        spec,
        basename,
        outputPath: path.join(directory, basename),
        rendered,
        sha256: sha256Text(rendered),
      };
    });
    const expectedBasenames = new Set(files.map((item) => item.basename));
    await preflightGeneratedDirectoryReconciliation({
      directory,
      expectedBasenames,
      priorGeneratedPaths,
      check: options.check === true,
      id,
    });
    prepared.push({id, documents, member, disposition, specs, directory, files, expectedBasenames});
  }

  for (const {id, documents, member, disposition, specs, directory, files, expectedBasenames} of prepared) {
    await reconcileGeneratedDirectory({directory, expectedBasenames, priorGeneratedPaths, check: options.check === true, id});
    if (!options.check) await mkdir(directory, {recursive: true});
    for (const file of files) {
      if (options.check) {
        if (!(await exists(file.outputPath))) throw new Error(`${id}: missing trace spec ${file.basename}`);
        const observed = await readFile(file.outputPath, "utf8");
        if (observed !== file.rendered) throw new Error(`${id}: stale trace spec ${file.basename}`);
      } else await writeFile(file.outputPath, file.rendered, "utf8");
    }
    await reconcileGeneratedDirectory({directory, expectedBasenames, priorGeneratedPaths, check: true, id});
    const unresolvedCount = specs.filter((item) => item.traceSpecStatus === "unresolved").length;
    const frameAccurateRootReadyCount = specs.filter((item) => item.traceSpecStatus === "source-frame-accurate-root-ready-for-authoritative-capture").length;
    const naturalScheduleReadyCount = specs.filter((item) => item.traceSpecStatus === "source-schedule-ready-for-authoritative-execution").length;
    results.push({
      animationId: id,
      action: options.check ? "verified" : "written",
      requirementCount: specs.length,
      unresolvedCount,
      frameAccurateRootReadyCount,
      naturalScheduleReadyCount,
      ...(releaseMode ? {
        releaseOrdinal: member.ordinal,
        frameDomainDispositionUnresolvedCount: disposition.binding.unresolvedTimelineCount,
        frameDomainDispositionIndependentRequiredCount: disposition.binding.independentRequiredTimelineCount,
      } : {}),
    });
    pilotIndexEntries.push({
      animationId: id,
      ...(releaseMode ? {
        releaseMembership: {
          ordinal: member.ordinal,
          assetId: member.assetId,
          releaseRole: member.releaseRole,
          shardId: member.shardId,
          sourcePath: member.source.path,
          sourceSha256: member.source.sha256,
        },
      } : {}),
      sourceSwfSha256: documents.hashes.sourceSwfSha256,
      technicalBindings: {
        manifest: projectionDescriptor({
          projection: TECHNICAL_MANIFEST_PROJECTION.id,
          sha256: documents.hashes.manifestTechnicalSha256,
          excludedPaths: TECHNICAL_MANIFEST_PROJECTION.excludedPaths,
        }),
        coverage: projectionDescriptor({
          projection: TRACE_COVERAGE_PROJECTION.id,
          sha256: documents.hashes.coverageTechnicalSha256,
          includedPaths: TRACE_COVERAGE_PROJECTION.includedRequirementPaths,
          excludedPaths: TRACE_COVERAGE_PROJECTION.excludedRequirementPaths,
        }),
        scenarioInventory: projectionDescriptor({
          projection: SCENARIO_INVENTORY_PROJECTION.id,
          sha256: documents.hashes.inventoryTechnicalSha256,
          excludedPaths: SCENARIO_INVENTORY_PROJECTION.excludedPaths,
        }),
        ...(releaseMode ? {
          scenarioInventoryExactFile: {
            path: "audit/scenario-inventory.json",
            sha256: documents.hashes.inventoryFileSha256,
          },
          frameDomainDisposition: disposition.binding,
        } : {}),
      },
      traceSpecDirectory: portable(path.relative(root, directory)),
      requirementCount: specs.length,
      unresolvedCount,
      frameAccurateRootReadyCount,
      naturalScheduleReadyCount,
      traceSpecs: files.map((file) => ({
        requirementId: file.spec.requirementId,
        traceId: file.spec.identity.traceId,
        frameDomainId: file.spec.identity.frameDomainId,
        scenario: file.spec.identity.scenario,
        language: file.spec.identity.language,
        seed: file.spec.identity.seed,
        traceModel: file.spec.traceModel.kind,
        status: file.spec.traceSpecStatus,
        file: portable(path.relative(root, file.outputPath)),
        sha256: file.sha256,
        expectedExecutionReport: portable(path.relative(root, path.join(documents.workspace, file.spec.executionEvidence.expectedExecutionReportPath))),
      })),
    });
  }
  const requirementCount = results.reduce((sum, item) => sum + item.requirementCount, 0);
  const unresolvedCount = results.reduce((sum, item) => sum + item.unresolvedCount, 0);
  const frameAccurateRootReadyCount = results.reduce((sum, item) => sum + item.frameAccurateRootReadyCount, 0);
  const naturalScheduleReadyCount = results.reduce((sum, item) => sum + item.naturalScheduleReadyCount, 0);
  const frameDomainDispositionUnresolvedCount = releaseMode
    ? results.reduce((sum, item) => sum + item.frameDomainDispositionUnresolvedCount, 0)
    : 0;
  const frameDomainDispositionIndependentRequiredCount = releaseMode
    ? results.reduce((sum, item) => sum + item.frameDomainDispositionIndependentRequiredCount, 0)
    : 0;
  const index = releaseMode ? {
    schemaVersion: 1,
    artifactType: "lesson-release-original-runtime-trace-spec-index",
    status: frameDomainDispositionUnresolvedCount || frameDomainDispositionIndependentRequiredCount
      ? "blocked-by-unresolved-frame-domain-dispositions"
      : unresolvedCount
        ? "partially-ready-with-unresolved-natural-traces"
        : "all-selected-traces-ready-for-authoritative-execution",
    releaseCatalog: releaseSelection.catalogBinding,
    releaseSelection: {
      ...releaseSelection.selectionIdentity,
      selectionSha256: releaseSelection.selectionSha256,
      atomicReleaseMemberCount: releaseSelection.release.expectedCounts.members,
      selectedMemberCount: results.length,
      fullAtomicReleaseSelected: releaseSelection.selectionIdentity.scope === "complete-atomic-release",
    },
    memberCount: results.length,
    requirementCount,
    unresolvedCount,
    frameDomainDispositionUnresolvedCount,
    frameDomainDispositionIndependentRequiredCount,
    frameAccurateRootReadyCount,
    naturalScheduleReadyCount,
    readyTraceCount: frameAccurateRootReadyCount + naturalScheduleReadyCount,
    members: pilotIndexEntries,
    strictAcceptanceEffect: "none; indexed release trace specifications are planning artifacts, unresolved frame domains and natural traces remain fail-closed, and no human, owner, strict-completion, or publication gate changes",
  } : {
    schemaVersion: 1,
    artifactType: "course-shell-pilot-trace-spec-index",
    status: unresolvedCount ? "partially-ready-with-unresolved-natural-traces" : "all-traces-ready-for-authoritative-execution",
    pilotCount: results.length,
    requirementCount,
    unresolvedCount,
    frameAccurateRootReadyCount,
    naturalScheduleReadyCount,
    readyTraceCount: frameAccurateRootReadyCount + naturalScheduleReadyCount,
    pilots: pilotIndexEntries,
    strictAcceptanceEffect: "none; indexed trace specifications are planning artifacts and never acceptance evidence",
  };
  const renderedIndex = renderJson(index);
  if (options.check) {
    if (!(await exists(indexPath))) throw new Error(releaseMode ? "lesson-release trace-spec index is missing" : "course/shell pilot trace-spec index is missing");
    const observed = await readFile(indexPath, "utf8");
    if (observed !== renderedIndex) throw new Error(releaseMode ? "lesson-release trace-spec index is stale" : "course/shell pilot trace-spec index is stale");
  } else {
    await mkdir(path.dirname(indexPath), {recursive: true});
    await writeFile(indexPath, renderedIndex, "utf8");
  }
  return {
    action: options.check ? "verified" : "written",
    ...(releaseMode ? {
      mode: "lesson-release",
      releaseId: releaseSelection.release.releaseId,
      selectionScope: releaseSelection.selectionIdentity.scope,
      memberCount: results.length,
      atomicReleaseMemberCount: releaseSelection.release.expectedCounts.members,
      frameDomainDispositionUnresolvedCount,
      frameDomainDispositionIndependentRequiredCount,
    } : {pilotCount: results.length}),
    requirementCount,
    unresolvedCount,
    frameAccurateRootReadyCount,
    naturalScheduleReadyCount,
    readyTraceCount: frameAccurateRootReadyCount + naturalScheduleReadyCount,
    index: portable(path.relative(root, indexPath)),
    pilots: results,
  };
}

function usage() {
  return `Usage: node scripts/build-course-trace-specs.mjs [options]\n\nOptions:\n  --release-id <release-id>     Select one exact atomic lesson release\n  --id <animation-id>           Select a verified in-release subset member; repeatable\n  --lesson-releases <file>      Release catalog (default: catalog/lesson-releases.json)\n  --migrations <directory>      Migration root (default: migrations)\n  --python <command>            Python with xml.etree.ElementTree (default: python3)\n  --check                       Verify generated specs and the selection-specific hash index\n  --json                        Print one JSON summary\n  -h, --help                    Show this help\n\nWithout --release-id, this command preserves the canonical ${COURSE_TRACE_PILOT_IDS.length}-pilot operation and ${GLOBAL_INDEX_BASENAME}. Release mode selects the complete ordered atomic release unless one or more --id values request a verified subset. It binds exact scenario-inventory bytes and the current fail-closed frame-domain disposition, writes isolated release trace specs plus a release/selection-specific index, and never changes migration status, reviews, acceptance, or publication.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(`${usage()}\n`);
    else {
      const result = await buildCourseTraceSpecs(options);
      if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      else {
        for (const pilot of result.pilots) {
          process.stdout.write(`${pilot.action}: ${pilot.animationId} (${pilot.requirementCount} requirements; ${pilot.frameAccurateRootReadyCount} frame-accurate root ready; ${pilot.unresolvedCount} unresolved)\n`);
        }
        if (result.mode === "lesson-release") {
          process.stdout.write(`${result.action}: ${result.memberCount}/${result.atomicReleaseMemberCount} selected release members, ${result.requirementCount} requirements -> ${result.index}\n`);
        } else {
          process.stdout.write(`${result.action}: ${result.pilotCount}/${COURSE_TRACE_PILOT_IDS.length} pilots, ${result.requirementCount} requirements -> ${result.index}\n`);
        }
      }
    }
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}
