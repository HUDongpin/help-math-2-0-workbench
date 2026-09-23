import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";

import {
  G5_L4_LIVE_OBSERVER_ALLOWED_RELATIVE_PATHS,
  G5_L4_LIVE_OBSERVER_FORBIDDEN_RELATIVE_PATHS,
  G5_L4_LIVE_OBSERVER_PROCESS_LAUNCH_CAPABLE,
  G5_L4_LIVE_OBSERVER_REQUIRED_CHANNELS,
  G5_L4_LIVE_OBSERVER_STATE_SEQUENCE,
  G5_L4_LIVE_OBSERVER_SUPERVISOR_CANDIDATE_TYPE,
  classifyG5L4LiveObserverSupervisorCandidate,
} from "./lib/g5-l4-live-observer-supervisor-candidate.mjs";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const HOST_ROOT = "/private/tmp/g5-l4-shell-rw002-host";
const EXECUTABLE = "/Applications/Flash Player.app/Contents/MacOS/Flash Player";

function commonBinding() {
  return {
    sessionId: "g5-l4-shell-rw002-en-observer-candidate-0001",
    projectorPid: 45_678,
    observerPid: 45_670,
    hostTreeRoot: HOST_ROOT,
    hostTreeManifestPath: `${HOST_ROOT}/staging-manifest.json`,
    hostTreeManifestSha256: HASH_A,
    hostTreeFileSetSha256: HASH_B,
  };
}

function event(sequence, timestampMs, type, payload, binding = commonBinding()) {
  return {sequence, timestampMs, type, binding, payload};
}

function validBundle() {
  return {
    schemaVersion: 1,
    candidateType: G5_L4_LIVE_OBSERVER_SUPERVISOR_CANDIDATE_TYPE,
    binding: {
      sessionId: commonBinding().sessionId,
      projector: {pid: 45_678, parentPid: 1, executablePath: EXECUTABLE},
      observer: {pid: 45_670, requiredChannels: [...G5_L4_LIVE_OBSERVER_REQUIRED_CHANNELS]},
      hostTree: {
        root: HOST_ROOT,
        manifestPath: `${HOST_ROOT}/staging-manifest.json`,
        manifestSha256: HASH_A,
        fileSetSha256: HASH_B,
      },
    },
    policy: {
      allowedRelativePaths: [...G5_L4_LIVE_OBSERVER_ALLOWED_RELATIVE_PATHS],
      forbiddenRelativePaths: [...G5_L4_LIVE_OBSERVER_FORBIDDEN_RELATIVE_PATHS],
      maximumUnobservedAttachGapMs: 0,
      maximumDrainGapMs: 100,
      observerFailureAllowed: false,
      successfulNetworkAllowed: false,
    },
    events: [
      event(1, 100, "preflight", {
        observerHealthy: true,
        attachedChannels: [...G5_L4_LIVE_OBSERVER_REQUIRED_CHANNELS],
        hostTreeBindingObserved: true,
      }),
      event(2, 101, "observer-attached", {
        attachedChannels: [...G5_L4_LIVE_OBSERVER_REQUIRED_CHANNELS],
      }),
      event(3, 102, "projector-observed", {parentPid: 1, executablePath: EXECUTABLE}),
      event(4, 103, "monitoring-started", {
        activeChannels: [...G5_L4_LIVE_OBSERVER_REQUIRED_CHANNELS],
      }),
      event(5, 104, "local-request", {
        absolutePath: `${HOST_ROOT}/${G5_L4_LIVE_OBSERVER_ALLOWED_RELATIVE_PATHS[0]}`,
        outcome: "opened",
      }),
      event(6, 105, "network-request", {
        endpoint: "https://legacy.invalid/telemetry",
        outcome: "blocked",
      }),
      event(7, 106, "observer-heartbeat", {
        activeChannels: [...G5_L4_LIVE_OBSERVER_REQUIRED_CHANNELS],
        observerHealthy: true,
      }),
      event(8, 110, "projector-exited", {exitCode: 0, signal: null}),
      event(9, 115, "drained", {
        drainedChannels: [...G5_L4_LIVE_OBSERVER_REQUIRED_CHANNELS],
        lastObservedSequence: 8,
        observerHealthy: true,
      }),
      event(10, 116, "classified", {classificationMode: "offline-synthetic-bundle-only"}),
    ],
  };
}

function resequence(events) {
  return events.map((value, index) => ({...value, sequence: index + 1, timestampMs: 100 + index}));
}

function insertBeforeExit(bundle, inserted) {
  const index = bundle.events.findIndex(({type}) => type === "projector-exited");
  bundle.events.splice(index, 0, inserted);
  bundle.events = resequence(bundle.events);
  const exit = bundle.events.find(({type}) => type === "projector-exited");
  const drained = bundle.events.find(({type}) => type === "drained");
  drained.payload.lastObservedSequence = exit.sequence;
  return bundle;
}

test("normal synthetic bundle follows the exact state machine but grants no live or production authority", () => {
  const result = classifyG5L4LiveObserverSupervisorCandidate(validBundle());
  assert.equal(result.classification.outcome, "synthetic-pass-candidate");
  assert.deepEqual(result.classification.failureCodes, []);
  assert.deepEqual(result.stateMachine.expectedStates, G5_L4_LIVE_OBSERVER_STATE_SEQUENCE);
  assert.deepEqual(result.stateMachine.observedStates, G5_L4_LIVE_OBSERVER_STATE_SEQUENCE);
  assert.equal(result.stateMachine.finalState, "classified");
  assert.equal(result.requestAudit.allowedLocalRequestCount, 1);
  assert.equal(result.requestAudit.networkRequestCount, 1);
  assert.equal(result.requestAudit.successfulNetworkRequestCount, 0);
  assert.deepEqual(result.capabilityBoundary, {
    offlineClassificationCandidate: true,
    cr04LiveVerified: false,
    cr05LiveVerified: false,
    productionImplementation: false,
    processLaunchCapable: false,
    launchEnabled: false,
    runtimeExecutionOccurred: false,
    authoritativeOriginalRuntimeEvidence: false,
    humanVisualAccepted: false,
    ownerFidelityAccepted: false,
    strictComplete: false,
    published: false,
    acceptanceEffect: "none",
  });
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.capabilityBoundary), true);
});

test("candidate module is import-free, exposes no process launcher, and remains offline-only", async () => {
  const source = await readFile(new URL("./lib/g5-l4-live-observer-supervisor-candidate.mjs", import.meta.url), "utf8");
  assert.equal(G5_L4_LIVE_OBSERVER_PROCESS_LAUNCH_CAPABLE, false);
  assert.doesNotMatch(source, /^\s*import\s/mu);
  assert.doesNotMatch(source, /node:child_process|\bexecFile\s*\(|\bspawn\s*\(|\bfork\s*\(/u);
  assert.match(source, /cannot attach an observer[\s\S]*or start a process/u);
});

test("exact schemas reject authority injection at the bundle, event, and payload boundaries", () => {
  const top = validBundle();
  top.productionImplementation = true;
  assert.throws(() => classifyG5L4LiveObserverSupervisorCandidate(top), /bundle keys drifted/u);

  const eventInjection = validBundle();
  eventInjection.events[0].launchEnabled = true;
  assert.throws(() => classifyG5L4LiveObserverSupervisorCandidate(eventInjection), /event 1 keys drifted/u);

  const payloadInjection = validBundle();
  payloadInjection.events[0].payload.cr04LiveVerified = true;
  assert.throws(() => classifyG5L4LiveObserverSupervisorCandidate(payloadInjection), /payload keys drifted/u);
});

test("Projector observation before observer attachment is an attach gap and fails closed", () => {
  const bundle = validBundle();
  const attached = bundle.events[1];
  const projector = bundle.events[2];
  bundle.events[1] = {...projector, sequence: 2, timestampMs: 101};
  bundle.events[2] = {...attached, sequence: 3, timestampMs: 102};
  const result = classifyG5L4LiveObserverSupervisorCandidate(bundle);
  assert.equal(result.classification.outcome, "fail-closed");
  assert.equal(result.stateMachine.attachGapObserved, true);
  assert.ok(result.classification.failureCodes.includes("observer-attach-gap"));
  assert.ok(result.classification.failureCodes.includes("state-transition-gap"));
});

test("a late or incomplete observer drain fails closed", () => {
  const late = validBundle();
  late.events.find(({type}) => type === "drained").timestampMs = 211;
  let result = classifyG5L4LiveObserverSupervisorCandidate(late);
  assert.equal(result.classification.outcome, "fail-closed");
  assert.ok(result.classification.failureCodes.includes("observer-drain-gap"));

  const incomplete = validBundle();
  incomplete.events.find(({type}) => type === "drained").payload.drainedChannels = ["filesystem", "process"];
  result = classifyG5L4LiveObserverSupervisorCandidate(incomplete);
  assert.ok(result.classification.failureCodes.includes("observer-channel-gap"));
  assert.ok(result.classification.failureCodes.includes("observer-drain-gap"));
});

test("observer failure and unhealthy heartbeat each fail closed", () => {
  const explicit = insertBeforeExit(validBundle(), event(1, 1, "observer-failure", {
    channel: "filesystem",
    reason: "observer stream terminated",
  }));
  let result = classifyG5L4LiveObserverSupervisorCandidate(explicit);
  assert.equal(result.classification.outcome, "fail-closed");
  assert.equal(result.requestAudit.observerFailureCount, 1);
  assert.ok(result.classification.failureCodes.includes("observer-failure"));

  const heartbeat = validBundle();
  heartbeat.events.find(({type}) => type === "observer-heartbeat").payload.observerHealthy = false;
  result = classifyG5L4LiveObserverSupervisorCandidate(heartbeat);
  assert.ok(result.classification.failureCodes.includes("observer-failure"));
});

test("a successful network request fails closed while a blocked attempt remains auditable", () => {
  const bundle = validBundle();
  bundle.events.find(({type}) => type === "network-request").payload.outcome = "succeeded";
  const result = classifyG5L4LiveObserverSupervisorCandidate(bundle);
  assert.equal(result.classification.outcome, "fail-closed");
  assert.equal(result.requestAudit.networkRequestCount, 1);
  assert.equal(result.requestAudit.successfulNetworkRequestCount, 1);
  assert.ok(result.classification.failureCodes.includes("successful-network-request"));
});

test("either exact missing lesson XML request is forbidden and unallowlisted", () => {
  for (const forbidden of G5_L4_LIVE_OBSERVER_FORBIDDEN_RELATIVE_PATHS) {
    const bundle = validBundle();
    const request = bundle.events.find(({type}) => type === "local-request");
    request.payload.absolutePath = `${HOST_ROOT}/${forbidden}`;
    request.payload.outcome = "missing";
    const result = classifyG5L4LiveObserverSupervisorCandidate(bundle);
    assert.equal(result.classification.outcome, "fail-closed");
    assert.equal(result.requestAudit.forbiddenLocalRequestCount, 1);
    assert.equal(result.requestAudit.unallowlistedLocalRequestCount, 1);
    assert.ok(result.classification.failureCodes.includes("forbidden-local-resource-request"));
    assert.ok(result.classification.failureCodes.includes("unallowlisted-local-resource-request"));
  }
});

test("allowed-path substring and host-root prefix attacks are never allowlisted", () => {
  const substring = validBundle();
  substring.events.find(({type}) => type === "local-request").payload.absolutePath =
    `${HOST_ROOT}/${G5_L4_LIVE_OBSERVER_ALLOWED_RELATIVE_PATHS[0]}.evil`;
  let result = classifyG5L4LiveObserverSupervisorCandidate(substring);
  assert.equal(result.requestAudit.allowedLocalRequestCount, 0);
  assert.equal(result.requestAudit.unallowlistedLocalRequestCount, 1);
  assert.ok(result.classification.failureCodes.includes("unallowlisted-local-resource-request"));

  const prefix = validBundle();
  prefix.events.find(({type}) => type === "local-request").payload.absolutePath =
    `${HOST_ROOT}.evil/${G5_L4_LIVE_OBSERVER_ALLOWED_RELATIVE_PATHS[0]}`;
  result = classifyG5L4LiveObserverSupervisorCandidate(prefix);
  assert.equal(result.requestAudit.allowedLocalRequestCount, 0);
  assert.ok(result.classification.failureCodes.includes("request-outside-exact-host-tree"));
  assert.ok(result.classification.failureCodes.includes("unallowlisted-local-resource-request"));
});

test("non-canonical traversal spellings fail closed instead of normalizing into the allowlist", () => {
  const bundle = validBundle();
  bundle.events.find(({type}) => type === "local-request").payload.absolutePath =
    `${HOST_ROOT}/HELP_COURSES/ELMGR5/L4/../L4/index_local.swf`;
  const result = classifyG5L4LiveObserverSupervisorCandidate(bundle);
  assert.equal(result.classification.outcome, "fail-closed");
  assert.ok(result.classification.failureCodes.includes("noncanonical-local-resource-path"));
  assert.ok(result.classification.failureCodes.includes("unallowlisted-local-resource-request"));
});

test("PID, host-tree root, and host-tree digest drift fail the repeated event binding", () => {
  for (const mutate of [
    (binding) => { binding.projectorPid += 1; },
    (binding) => { binding.hostTreeRoot = `${HOST_ROOT}-other`; },
    (binding) => { binding.hostTreeFileSetSha256 = "c".repeat(64); },
  ]) {
    const bundle = validBundle();
    mutate(bundle.events[4].binding);
    const result = classifyG5L4LiveObserverSupervisorCandidate(bundle);
    assert.equal(result.classification.outcome, "fail-closed");
    assert.ok(result.classification.failureCodes.includes("event-binding-mismatch"));
  }
});

test("Projector executable identity drift fails closed", () => {
  const bundle = validBundle();
  bundle.events.find(({type}) => type === "projector-observed").payload.executablePath =
    `${EXECUTABLE}.evil`;
  const result = classifyG5L4LiveObserverSupervisorCandidate(bundle);
  assert.equal(result.classification.outcome, "fail-closed");
  assert.ok(result.classification.failureCodes.includes("projector-identity-mismatch"));
});
