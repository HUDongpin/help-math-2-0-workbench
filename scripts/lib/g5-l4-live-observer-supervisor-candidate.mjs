/**
 * G5 L4 CR-04/CR-05 offline observer-supervisor classifier candidate.
 *
 * This module is intentionally import-free and synchronous. It classifies an
 * already-collected synthetic event bundle; it cannot attach an observer,
 * launch a runtime, inspect the filesystem, open a socket, or start a process.
 * A passing result is therefore never live verification or production
 * implementation evidence.
 */

export const G5_L4_LIVE_OBSERVER_SUPERVISOR_SCHEMA_VERSION = 1;
export const G5_L4_LIVE_OBSERVER_SUPERVISOR_CANDIDATE_TYPE =
  "g5-l4-cr04-cr05-offline-observer-supervisor-candidate";
export const G5_L4_LIVE_OBSERVER_PROCESS_LAUNCH_CAPABLE = false;

export const G5_L4_LIVE_OBSERVER_REQUIRED_CHANNELS = Object.freeze([
  "filesystem",
  "network",
  "process",
]);

export const G5_L4_LIVE_OBSERVER_ALLOWED_RELATIVE_PATHS = Object.freeze([
  "HELP_COURSES/ELMGR5/L4/index_local.swf",
  "HELP_COURSES/ELMGR5/L4/index.xml",
  "HELP_COURSES/ELMGR5/L4/IR/L4RW01.swf",
  "HELP_COURSES/ELMGR5/L4/RW/L4RW02.swf",
  "HELP_COURSES/ELMGR5/L4/SA/L4RW02.mp3",
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTSG4.xml",
]);

export const G5_L4_LIVE_OBSERVER_FORBIDDEN_RELATIVE_PATHS = Object.freeze([
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTE01.xml",
  "HELP_KEYTERMS/KT/ELEMENTARY/XML/L4KTS01.xml",
]);

export const G5_L4_LIVE_OBSERVER_STATE_SEQUENCE = Object.freeze([
  "preflight",
  "observer-attached",
  "projector-observed",
  "monitoring",
  "drained",
  "classified",
]);

const HASH = /^[a-f0-9]{64}$/u;
const SESSION_ID = /^g5-l4-[a-z0-9-]{8,100}$/u;
const EVENT_TYPES = new Set([
  "preflight",
  "observer-attached",
  "projector-observed",
  "monitoring-started",
  "observer-heartbeat",
  "local-request",
  "network-request",
  "observer-failure",
  "projector-exited",
  "drained",
  "classified",
]);

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`G5 L4 live-observer offline candidate: ${message}`);
  }
}

function assertExactKeys(value, expected, label) {
  invariant(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  invariant(
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()),
    `${label} keys drifted`,
  );
}

function isCanonicalAbsolutePath(value) {
  if (typeof value !== "string" || value.length < 2 || value[0] !== "/"
    || value.endsWith("/") || value.includes("\\") || value.includes("\0")) {
    return false;
  }
  const components = value.slice(1).split("/");
  return components.every((component) => component.length > 0 && component !== "." && component !== "..");
}

function isCanonicalRelativePath(value) {
  if (typeof value !== "string" || value.length === 0 || value[0] === "/"
    || value.endsWith("/") || value.includes("\\") || value.includes("\0")) {
    return false;
  }
  const components = value.split("/");
  return components.every((component) => component.length > 0 && component !== "." && component !== "..");
}

function assertCanonicalAbsolutePath(value, label) {
  invariant(isCanonicalAbsolutePath(value), `${label} must be one canonical absolute path`);
}

function assertCanonicalRelativePaths(values, label) {
  invariant(Array.isArray(values) && values.length > 0, `${label} must be a non-empty array`);
  invariant(values.every(isCanonicalRelativePath), `${label} contains a non-canonical relative path`);
  invariant(new Set(values).size === values.length, `${label} contains duplicate paths`);
}

function sameArray(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function assertChannels(value, label) {
  invariant(Array.isArray(value) && value.every((channel) => typeof channel === "string"),
    `${label} must be a string array`);
}

function assertPositivePid(value, label) {
  invariant(Number.isSafeInteger(value) && value > 1, `${label} must be a positive non-system PID`);
}

function assertEventBindingShape(binding, label) {
  assertExactKeys(binding, [
    "sessionId",
    "projectorPid",
    "observerPid",
    "hostTreeRoot",
    "hostTreeManifestPath",
    "hostTreeManifestSha256",
    "hostTreeFileSetSha256",
  ], label);
  invariant(typeof binding.sessionId === "string", `${label} session ID must be a string`);
  assertPositivePid(binding.projectorPid, `${label} Projector PID`);
  assertPositivePid(binding.observerPid, `${label} observer PID`);
  assertCanonicalAbsolutePath(binding.hostTreeRoot, `${label} host-tree root`);
  assertCanonicalAbsolutePath(binding.hostTreeManifestPath, `${label} host-tree manifest path`);
  invariant(HASH.test(binding.hostTreeManifestSha256 || ""), `${label} manifest SHA-256 is invalid`);
  invariant(HASH.test(binding.hostTreeFileSetSha256 || ""), `${label} file-set SHA-256 is invalid`);
}

function assertPayloadShape(type, payload, label) {
  const keysByType = {
    preflight: ["observerHealthy", "attachedChannels", "hostTreeBindingObserved"],
    "observer-attached": ["attachedChannels"],
    "projector-observed": ["parentPid", "executablePath"],
    "monitoring-started": ["activeChannels"],
    "observer-heartbeat": ["activeChannels", "observerHealthy"],
    "local-request": ["absolutePath", "outcome"],
    "network-request": ["endpoint", "outcome"],
    "observer-failure": ["channel", "reason"],
    "projector-exited": ["exitCode", "signal"],
    drained: ["drainedChannels", "lastObservedSequence", "observerHealthy"],
    classified: ["classificationMode"],
  };
  assertExactKeys(payload, keysByType[type], `${label} payload`);
  switch (type) {
    case "preflight":
      invariant(typeof payload.observerHealthy === "boolean"
        && typeof payload.hostTreeBindingObserved === "boolean", `${label} preflight booleans are invalid`);
      assertChannels(payload.attachedChannels, `${label} attached channels`);
      break;
    case "observer-attached":
      assertChannels(payload.attachedChannels, `${label} attached channels`);
      break;
    case "projector-observed":
      invariant(Number.isSafeInteger(payload.parentPid) && payload.parentPid > 0,
        `${label} parent PID is invalid`);
      invariant(typeof payload.executablePath === "string", `${label} executable path must be a string`);
      break;
    case "monitoring-started":
      assertChannels(payload.activeChannels, `${label} active channels`);
      break;
    case "observer-heartbeat":
      assertChannels(payload.activeChannels, `${label} active channels`);
      invariant(typeof payload.observerHealthy === "boolean", `${label} observer health must be boolean`);
      break;
    case "local-request":
      invariant(typeof payload.absolutePath === "string", `${label} local path must be a string`);
      invariant(["blocked", "missing", "opened"].includes(payload.outcome),
        `${label} local outcome is invalid`);
      break;
    case "network-request":
      invariant(typeof payload.endpoint === "string" && payload.endpoint.length > 0,
        `${label} network endpoint must be non-empty`);
      invariant(["blocked", "succeeded"].includes(payload.outcome),
        `${label} network outcome is invalid`);
      break;
    case "observer-failure":
      invariant(typeof payload.channel === "string" && typeof payload.reason === "string"
        && payload.reason.length > 0, `${label} observer failure is invalid`);
      break;
    case "projector-exited":
      invariant((payload.exitCode === null || Number.isSafeInteger(payload.exitCode))
        && (payload.signal === null || typeof payload.signal === "string")
        && (payload.exitCode !== null || payload.signal !== null), `${label} exit observation is invalid`);
      break;
    case "drained":
      assertChannels(payload.drainedChannels, `${label} drained channels`);
      invariant(Number.isSafeInteger(payload.lastObservedSequence) && payload.lastObservedSequence >= 1,
        `${label} last-observed sequence is invalid`);
      invariant(typeof payload.observerHealthy === "boolean", `${label} observer health must be boolean`);
      break;
    case "classified":
      invariant(typeof payload.classificationMode === "string", `${label} classification mode must be a string`);
      break;
    default:
      invariant(false, `${label} event type is unsupported`);
  }
}

function validateBundleShape(bundle) {
  assertExactKeys(bundle, ["schemaVersion", "candidateType", "binding", "policy", "events"], "bundle");
  invariant(bundle.schemaVersion === G5_L4_LIVE_OBSERVER_SUPERVISOR_SCHEMA_VERSION,
    "schema version is unsupported");
  invariant(bundle.candidateType === G5_L4_LIVE_OBSERVER_SUPERVISOR_CANDIDATE_TYPE,
    "candidate type is unsupported");

  assertExactKeys(bundle.binding, ["sessionId", "projector", "observer", "hostTree"], "bundle binding");
  invariant(SESSION_ID.test(bundle.binding.sessionId || ""), "session ID is invalid");

  assertExactKeys(bundle.binding.projector, ["pid", "parentPid", "executablePath"], "Projector binding");
  assertPositivePid(bundle.binding.projector.pid, "Projector PID");
  invariant(Number.isSafeInteger(bundle.binding.projector.parentPid) && bundle.binding.projector.parentPid > 0,
    "Projector parent PID is invalid");
  assertCanonicalAbsolutePath(bundle.binding.projector.executablePath, "Projector executable");

  assertExactKeys(bundle.binding.observer, ["pid", "requiredChannels"], "observer binding");
  assertPositivePid(bundle.binding.observer.pid, "observer PID");
  invariant(bundle.binding.observer.pid !== bundle.binding.projector.pid,
    "observer and Projector PIDs must differ");
  assertChannels(bundle.binding.observer.requiredChannels, "required observer channels");
  invariant(sameArray(bundle.binding.observer.requiredChannels, G5_L4_LIVE_OBSERVER_REQUIRED_CHANNELS),
    "required observer channels drifted");

  assertExactKeys(bundle.binding.hostTree, [
    "root", "manifestPath", "manifestSha256", "fileSetSha256",
  ], "host-tree binding");
  assertCanonicalAbsolutePath(bundle.binding.hostTree.root, "host-tree root");
  assertCanonicalAbsolutePath(bundle.binding.hostTree.manifestPath, "host-tree manifest path");
  invariant(bundle.binding.hostTree.manifestPath === `${bundle.binding.hostTree.root}/staging-manifest.json`,
    "host-tree manifest must be the exact manifest leaf under the exact root");
  invariant(HASH.test(bundle.binding.hostTree.manifestSha256 || ""), "host-tree manifest SHA-256 is invalid");
  invariant(HASH.test(bundle.binding.hostTree.fileSetSha256 || ""), "host-tree file-set SHA-256 is invalid");

  assertExactKeys(bundle.policy, [
    "allowedRelativePaths",
    "forbiddenRelativePaths",
    "maximumUnobservedAttachGapMs",
    "maximumDrainGapMs",
    "observerFailureAllowed",
    "successfulNetworkAllowed",
  ], "observer policy");
  assertCanonicalRelativePaths(bundle.policy.allowedRelativePaths, "allowed paths");
  assertCanonicalRelativePaths(bundle.policy.forbiddenRelativePaths, "forbidden paths");
  invariant(sameArray(bundle.policy.allowedRelativePaths, G5_L4_LIVE_OBSERVER_ALLOWED_RELATIVE_PATHS),
    "allowed path set drifted from the exact seven-file host tree");
  invariant(sameArray(bundle.policy.forbiddenRelativePaths, G5_L4_LIVE_OBSERVER_FORBIDDEN_RELATIVE_PATHS),
    "forbidden path set drifted from the exact missing lesson XML paths");
  invariant(bundle.policy.maximumUnobservedAttachGapMs === 0,
    "unobserved attach gaps must be prohibited");
  invariant(Number.isSafeInteger(bundle.policy.maximumDrainGapMs)
    && bundle.policy.maximumDrainGapMs >= 0 && bundle.policy.maximumDrainGapMs <= 10_000,
  "maximum drain gap must be a bounded integer");
  invariant(bundle.policy.observerFailureAllowed === false, "observer failure cannot be allowed");
  invariant(bundle.policy.successfulNetworkAllowed === false, "successful network cannot be allowed");

  invariant(Array.isArray(bundle.events), "events must be an array");
  for (const [index, event] of bundle.events.entries()) {
    const label = `event ${index + 1}`;
    assertExactKeys(event, ["sequence", "timestampMs", "type", "binding", "payload"], label);
    invariant(event.sequence === index + 1, `${label} sequence must be contiguous and one-indexed`);
    invariant(Number.isSafeInteger(event.timestampMs) && event.timestampMs >= 0,
      `${label} timestamp must be a non-negative integer`);
    invariant(EVENT_TYPES.has(event.type), `${label} type is unsupported`);
    assertEventBindingShape(event.binding, `${label} binding`);
    assertPayloadShape(event.type, event.payload, label);
  }
  return bundle;
}

function expectedEventBinding(bundle) {
  return {
    sessionId: bundle.binding.sessionId,
    projectorPid: bundle.binding.projector.pid,
    observerPid: bundle.binding.observer.pid,
    hostTreeRoot: bundle.binding.hostTree.root,
    hostTreeManifestPath: bundle.binding.hostTree.manifestPath,
    hostTreeManifestSha256: bundle.binding.hostTree.manifestSha256,
    hostTreeFileSetSha256: bundle.binding.hostTree.fileSetSha256,
  };
}

function sameObject(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function addFailure(failures, code) {
  failures.add(code);
}

function exactRelativePath(hostTreeRoot, absolutePath) {
  if (!isCanonicalAbsolutePath(absolutePath)) return {kind: "noncanonical", relativePath: null};
  const prefix = `${hostTreeRoot}/`;
  if (!absolutePath.startsWith(prefix)) return {kind: "outside", relativePath: null};
  const relativePath = absolutePath.slice(prefix.length);
  if (!isCanonicalRelativePath(relativePath)) return {kind: "noncanonical", relativePath: null};
  return {kind: "inside", relativePath};
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

/**
 * Classify a synthetic, already-collected observer event bundle.
 *
 * No argument can enable I/O or process execution. Semantic failures return a
 * deterministic `fail-closed` classification; structural/schema drift throws.
 */
export function classifyG5L4LiveObserverSupervisorCandidate(input) {
  const bundle = validateBundleShape(input);
  const failures = new Set();
  const expectedBinding = expectedEventBinding(bundle);
  const observedStates = [];
  const stateVisits = Object.fromEntries(G5_L4_LIVE_OBSERVER_STATE_SEQUENCE.map((state) => [state, 0]));
  const counters = {
    allowedLocalRequestCount: 0,
    forbiddenLocalRequestCount: 0,
    unallowlistedLocalRequestCount: 0,
    networkRequestCount: 0,
    successfulNetworkRequestCount: 0,
    observerFailureCount: 0,
  };
  let state = null;
  let previousTimestampMs = null;
  let attachedAtMs = null;
  let projectorObservedAtMs = null;
  let projectorExitEvent = null;
  let drainedEvent = null;

  const enterState = (nextState, requiredPriorState) => {
    if (state !== requiredPriorState) addFailure(failures, "state-transition-gap");
    state = nextState;
    observedStates.push(nextState);
    stateVisits[nextState] += 1;
    if (stateVisits[nextState] > 1) addFailure(failures, "duplicate-state-transition");
  };

  for (const event of bundle.events) {
    if (previousTimestampMs !== null && event.timestampMs < previousTimestampMs) {
      addFailure(failures, "nonmonotonic-event-timestamps");
    }
    previousTimestampMs = event.timestampMs;
    if (!sameObject(event.binding, expectedBinding)) addFailure(failures, "event-binding-mismatch");

    switch (event.type) {
      case "preflight":
        enterState("preflight", null);
        if (!event.payload.observerHealthy || !event.payload.hostTreeBindingObserved
          || !sameArray(event.payload.attachedChannels, G5_L4_LIVE_OBSERVER_REQUIRED_CHANNELS)) {
          addFailure(failures, "preflight-failure");
        }
        break;
      case "observer-attached":
        enterState("observer-attached", "preflight");
        attachedAtMs = event.timestampMs;
        if (!sameArray(event.payload.attachedChannels, G5_L4_LIVE_OBSERVER_REQUIRED_CHANNELS)) {
          addFailure(failures, "observer-channel-gap");
        }
        break;
      case "projector-observed":
        if (state !== "observer-attached") addFailure(failures, "observer-attach-gap");
        enterState("projector-observed", "observer-attached");
        projectorObservedAtMs = event.timestampMs;
        if (event.payload.parentPid !== bundle.binding.projector.parentPid
          || event.payload.executablePath !== bundle.binding.projector.executablePath) {
          addFailure(failures, "projector-identity-mismatch");
        }
        break;
      case "monitoring-started":
        enterState("monitoring", "projector-observed");
        if (!sameArray(event.payload.activeChannels, G5_L4_LIVE_OBSERVER_REQUIRED_CHANNELS)) {
          addFailure(failures, "observer-channel-gap");
        }
        break;
      case "observer-heartbeat":
        if (state !== "monitoring" || projectorExitEvent !== null) {
          addFailure(failures, "activity-outside-monitoring");
        }
        if (!event.payload.observerHealthy
          || !sameArray(event.payload.activeChannels, G5_L4_LIVE_OBSERVER_REQUIRED_CHANNELS)) {
          addFailure(failures, "observer-failure");
          counters.observerFailureCount += 1;
        }
        break;
      case "local-request": {
        if (state !== "monitoring" || projectorExitEvent !== null) {
          addFailure(failures, "activity-outside-monitoring");
        }
        const classifiedPath = exactRelativePath(bundle.binding.hostTree.root, event.payload.absolutePath);
        if (classifiedPath.kind !== "inside") {
          addFailure(failures, classifiedPath.kind === "outside"
            ? "request-outside-exact-host-tree"
            : "noncanonical-local-resource-path");
          addFailure(failures, "unallowlisted-local-resource-request");
          counters.unallowlistedLocalRequestCount += 1;
          break;
        }
        const relativePath = classifiedPath.relativePath;
        const forbidden = bundle.policy.forbiddenRelativePaths.includes(relativePath);
        const allowed = bundle.policy.allowedRelativePaths.includes(relativePath)
          && event.payload.absolutePath === `${bundle.binding.hostTree.root}/${relativePath}`;
        if (forbidden) {
          addFailure(failures, "forbidden-local-resource-request");
          counters.forbiddenLocalRequestCount += 1;
        }
        if (!allowed) {
          addFailure(failures, "unallowlisted-local-resource-request");
          counters.unallowlistedLocalRequestCount += 1;
        } else {
          counters.allowedLocalRequestCount += 1;
        }
        break;
      }
      case "network-request":
        if (state !== "monitoring" || projectorExitEvent !== null) {
          addFailure(failures, "activity-outside-monitoring");
        }
        counters.networkRequestCount += 1;
        if (event.payload.outcome === "succeeded") {
          addFailure(failures, "successful-network-request");
          counters.successfulNetworkRequestCount += 1;
        }
        break;
      case "observer-failure":
        if (state !== "monitoring" || projectorExitEvent !== null) {
          addFailure(failures, "activity-outside-monitoring");
        }
        addFailure(failures, "observer-failure");
        counters.observerFailureCount += 1;
        break;
      case "projector-exited":
        if (state !== "monitoring" || projectorExitEvent !== null) {
          addFailure(failures, "projector-exit-observation-gap");
        }
        projectorExitEvent = event;
        break;
      case "drained":
        enterState("drained", "monitoring");
        drainedEvent = event;
        if (projectorExitEvent === null
          || event.payload.lastObservedSequence !== event.sequence - 1
          || event.payload.lastObservedSequence !== projectorExitEvent?.sequence
          || event.timestampMs - (projectorExitEvent?.timestampMs ?? event.timestampMs)
            > bundle.policy.maximumDrainGapMs) {
          addFailure(failures, "observer-drain-gap");
        }
        if (!event.payload.observerHealthy
          || !sameArray(event.payload.drainedChannels, G5_L4_LIVE_OBSERVER_REQUIRED_CHANNELS)) {
          addFailure(failures, "observer-drain-gap");
          addFailure(failures, "observer-channel-gap");
        }
        break;
      case "classified":
        enterState("classified", "drained");
        if (event.payload.classificationMode !== "offline-synthetic-bundle-only") {
          addFailure(failures, "classification-mode-mismatch");
        }
        break;
      default:
        invariant(false, `unhandled event type ${event.type}`);
    }
  }

  if (attachedAtMs === null || projectorObservedAtMs === null
    || attachedAtMs > projectorObservedAtMs
    || Math.max(0, attachedAtMs - projectorObservedAtMs)
      > bundle.policy.maximumUnobservedAttachGapMs) {
    addFailure(failures, "observer-attach-gap");
  }
  if (projectorExitEvent === null) addFailure(failures, "projector-exit-observation-gap");
  if (drainedEvent === null) addFailure(failures, "observer-drain-gap");
  if (G5_L4_LIVE_OBSERVER_STATE_SEQUENCE.some((required) => stateVisits[required] !== 1)) {
    addFailure(failures, "missing-required-state");
  }
  if (state !== "classified") addFailure(failures, "classification-not-reached");

  const failureCodes = [...failures].sort();
  const output = {
    schemaVersion: G5_L4_LIVE_OBSERVER_SUPERVISOR_SCHEMA_VERSION,
    candidateType: G5_L4_LIVE_OBSERVER_SUPERVISOR_CANDIDATE_TYPE,
    binding: {
      sessionId: bundle.binding.sessionId,
      projectorPid: bundle.binding.projector.pid,
      observerPid: bundle.binding.observer.pid,
      hostTreeRoot: bundle.binding.hostTree.root,
      hostTreeManifestPath: bundle.binding.hostTree.manifestPath,
      hostTreeManifestSha256: bundle.binding.hostTree.manifestSha256,
      hostTreeFileSetSha256: bundle.binding.hostTree.fileSetSha256,
    },
    stateMachine: {
      expectedStates: [...G5_L4_LIVE_OBSERVER_STATE_SEQUENCE],
      observedStates,
      finalState: state,
      attachGapObserved: failureCodes.includes("observer-attach-gap"),
      drainGapObserved: failureCodes.includes("observer-drain-gap"),
    },
    requestAudit: {
      ...counters,
      passed: failureCodes.length === 0,
    },
    classification: {
      mode: "offline-synthetic-bundle-only",
      outcome: failureCodes.length === 0 ? "synthetic-pass-candidate" : "fail-closed",
      failureCodes,
    },
    capabilityBoundary: {
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
    },
  };
  return deepFreeze(output);
}
