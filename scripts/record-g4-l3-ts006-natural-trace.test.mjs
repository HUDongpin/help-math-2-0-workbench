import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {
  appendFile,
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {PNG} from "pngjs";

import {
  appendTs006NaturalTraceRecord,
  initializeTs006NaturalTraceRecorder,
  loadPrebuiltTs006NaturalTraceBridge,
  parseCanonicalJsonl,
  recoverTs006NaturalTraceRecorder,
  verifyTs006NaturalTraceRecorder,
} from "./record-g4-l3-ts006-natural-trace.mjs";
import {
  bindOptionalTs006NaturalTraceLogs,
} from "./prepare-g4-l3-ts006-runtime-capture-pending-candidate.mjs";
import {
  canonicalJson,
  renderTs006NaturalTraceBridge,
} from "./scaffold-g4-l3-ts006-natural-trace-bridge.mjs";

const SESSION_ID = "ts006-en-11111111-1111-4111-8111-111111111111";
const CAPTURE_NAME = "natural-trace-en-001";
const HASHES = Object.freeze({
  trace: "1".repeat(64),
  bridge: "2".repeat(64),
  kit: "3".repeat(64),
  profile: "4".repeat(64),
  host: "5".repeat(64),
  projector: "6".repeat(64),
  runtime: "7".repeat(64),
  containment: "8".repeat(64),
  shell: "9".repeat(64),
});
const AUTHORITY_FALSE = Object.freeze({
  authoritativeOriginalRuntimeTrace: false,
  authoritativeBaseline: false,
  baselineAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictMigrationComplete: false,
  publicRelease: false,
});
const HOST_EVENTS = Object.freeze([
  "profile-empty-preflight",
  "projector-process-started-empty",
  "named-human-file-open-selected-staged-host",
  "same-lesson-host-loaded",
  "same-lesson-natural-navigation-target-resolved",
  "ts006-root-entry-observed",
  "ts006-nested-entry-observed",
  "post-session-side-effect-summary",
]);
const STEP_IDS = Object.freeze([
  "select-host-language",
  "navigate-same-lesson-host-to-ts006",
  "observe-root-preloader-handoff",
  "observe-natural-begin-and-nested-entry",
  "observe-first-natural-terminal",
  "invoke-host-native-replay",
  "observe-second-natural-terminal",
  "exercise-previous-next-and-natural-return",
  "close-runtime-and-record-postconditions",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fakeContract() {
  return {
    schemaVersion: 1,
    artifactType: "ts006-natural-trace-session-contract",
    status: "unsigned-template-only-not-evidence",
    animationId: "course-g04-l03-ts-006",
    language: "en",
    sessionId: SESSION_ID,
    requirementIds: [
      "req:root:lesson-shell-natural-entry:en",
      "req:sprite-23:lesson-shell-natural-entry:en",
    ],
    traceSpecSetSha256: HASHES.trace,
    bridgeInputFingerprintSha256: HASHES.bridge,
    sessionKitSha256: HASHES.kit,
    profileManifestSha256: HASHES.profile,
    hostTreeManifestSha256: HASHES.host,
    projectorExecutableSha256: HASHES.projector,
    runtimeEnvironmentReadinessSha256: HASHES.runtime,
    containmentReadinessSha256: HASHES.containment,
    schedule: STEP_IDS.map((id, index) => ({
      order: index + 1,
      id,
      scheduledStepSha256: createHash("sha256").update(`step-${index + 1}`).digest("hex"),
      action: {
        kind: id === "invoke-host-native-replay"
          ? "host-native-replay"
          : `test-action-${index + 1}`,
      },
      sourceTarget: {kind: "test-target", id: `target-${index + 1}`},
      preStateCheckpoint: {expectedState: {phase: `pre-${index + 1}`}},
      postStateCheckpoint: {expectedState: {phase: `post-${index + 1}`}},
      terminalEffect: null,
    })),
    requiredHostEntryEvents: [...HOST_EVENTS],
    hostEntryContract: {
      selectedHostShellPath:
        "work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/index_local.swf",
      selectedHostShellSha256: HASHES.shell,
      directChildSwfOpenAllowed: false,
      sameLessonNaturalNavigationRequired: true,
      rootEntryMustPrecedeNestedEntry: true,
    },
    replay: {
      required: true,
      actionStepId: "invoke-host-native-replay",
      secondCycleTerminalStepId: "observe-second-natural-terminal",
      fullStateVectorResetMustBeObserved: true,
    },
    audio: {required: false, noSpanishAudioAuthorityMayBeClaimed: true},
    logs: {
      operation: {
        file: "operation.jsonl",
        evidenceType: "ts006-original-runtime-operation-event",
        previousHashField: "previousEventSha256",
        ownHashField: "eventSha256",
      },
      state: {
        file: "state.jsonl",
        evidenceType: "ts006-original-runtime-state-observation",
        previousHashField: "previousRecordSha256",
        ownHashField: "recordSha256",
      },
      "source-target": {
        file: "source-target.jsonl",
        evidenceType: "ts006-original-runtime-source-target-resolution",
        previousHashField: "previousRecordSha256",
        ownHashField: "recordSha256",
      },
      "host-entry": {
        file: "host-entry.jsonl",
        evidenceType: "ts006-original-runtime-host-entry-event",
        previousHashField: "previousRecordSha256",
        ownHashField: "recordSha256",
      },
    },
    executionGate: {
      executionReady: false,
      namedHumanOperatorRequired: true,
    },
    authority: {...AUTHORITY_FALSE},
    acceptance: {...AUTHORITY_FALSE},
    strictAcceptanceEffect: "none",
  };
}

function fakeBridge(contract) {
  return {
    schemaVersion: 1,
    artifactType: "ts006-natural-trace-hash-chain-capture-bridge",
    bridgeManifestSha256: "a".repeat(64),
    bridgeInputFingerprintSha256: contract.bridgeInputFingerprintSha256,
    sessions: [contract],
  };
}

async function createPrebuiltBridge(projectRoot, enContract) {
  const esContract = structuredClone(enContract);
  esContract.language = "es";
  esContract.sessionId =
    "ts006-es-22222222-2222-4222-8222-222222222222";
  esContract.requirementIds = esContract.requirementIds.map((value) =>
    value.replace(/:en$/u, ":es"));
  const manifest = {
    schemaVersion: 1,
    artifactType: "ts006-natural-trace-hash-chain-capture-bridge",
    status: "unsigned-template-only-not-evidence",
    animationId: "course-g04-l03-ts-006",
    traceSpecSetSha256: enContract.traceSpecSetSha256,
    bridgeInputFingerprintSha256:
      enContract.bridgeInputFingerprintSha256,
    sessions: [enContract, esContract],
    logSchemas: {},
    executionGate: {
      executionReady: false,
      blockerCount: 1,
      blockers: ["test-only-not-executable"],
      pendingCandidateOnly: true,
      liveGateMayNotBeSelfApprovedByThisScript: true,
    },
    authority: {...AUTHORITY_FALSE},
    acceptance: {...AUTHORITY_FALSE},
    strictAcceptanceEffect: "none",
  };
  manifest.bridgeManifestSha256 =
    sha256(Buffer.from(canonicalJson(manifest)));
  const bridgesRoot = path.join(
    projectRoot,
    "work/g4-l3-ts006-natural-trace-bridges",
  );
  const bridgeRoot = path.join(
    bridgesRoot,
    manifest.bridgeManifestSha256,
  );
  await mkdir(bridgeRoot, {recursive: true});
  for (const [relative, bytes] of renderTs006NaturalTraceBridge(manifest)) {
    const target = path.join(bridgeRoot, ...relative.split("/"));
    await mkdir(path.dirname(target), {recursive: true});
    await writeFile(target, bytes);
  }
  return {bridgeRoot, manifest, enContract, esContract};
}

function automationSubject(overrides = {}) {
  return {
    externalSubjectId: "codex-computer-use",
    displayName: "Codex Computer Use",
    subjectType: "automation",
    role: "machine-event-recorder",
    namedHuman: false,
    independentReviewer: false,
    ownerRoleUsed: false,
    releaseCustodianRoleUsed: false,
    ...overrides,
  };
}

async function createFixture(t, {
  initialize = true,
  captureSymlink = false,
  rawCapturesSymlink = false,
  legacyCaptureOnly = false,
  createCaptureRoot = true,
} = {}) {
  const temporaryBase = await realpath(os.tmpdir());
  const root = await mkdtemp(path.join(temporaryBase, "ts006-recorder-test-"));
  t.after(async () => {
    await rm(root, {recursive: true, force: true});
  });
  const sessionsRoot = path.join(root, "artifacts/full-frame/g4-l3");
  const sessionRoot = path.join(sessionsRoot, SESSION_ID);
  const evidenceRoot = path.join(sessionRoot, "evidence");
  const rawCapturesRoot = path.join(evidenceRoot, "raw-captures");
  const captureRoot = path.join(rawCapturesRoot, CAPTURE_NAME);
  await mkdir(sessionsRoot, {recursive: true});
  await mkdir(sessionRoot);
  await mkdir(evidenceRoot);
  if (rawCapturesSymlink) {
    const outside = path.join(root, "outside-raw-captures");
    await mkdir(outside);
    await mkdir(path.join(outside, CAPTURE_NAME));
    await symlink(outside, rawCapturesRoot);
  } else {
    await mkdir(rawCapturesRoot);
  }
  if (legacyCaptureOnly) {
    await mkdir(path.join(sessionRoot, CAPTURE_NAME));
  } else if (captureSymlink) {
    const outside = path.join(root, "outside-capture");
    await mkdir(outside);
    await symlink(outside, captureRoot);
  } else if (!rawCapturesSymlink && createCaptureRoot) {
    await mkdir(captureRoot);
  }
  const contract = fakeContract();
  const bridge = fakeBridge(contract);
  const fixture = {
    root,
    sessionsRoot,
    sessionRoot,
    evidenceRoot,
    rawCapturesRoot,
    captureRoot,
    contract,
    bridge,
    common: {
      projectRoot: root,
      allowedSessionsRoot: sessionsRoot,
      sessionRoot,
      captureName: CAPTURE_NAME,
    },
  };
  if (initialize && !captureSymlink && !rawCapturesSymlink && !legacyCaptureOnly) {
    await initializeTs006NaturalTraceRecorder({
      ...fixture.common,
      operator: automationSubject(),
      sessionContract: contract,
      bridgeManifest: bridge,
    });
  }
  return fixture;
}

async function createSessionEvidence(fixture, count = 9) {
  const evidenceRoot = path.join(fixture.sessionRoot, "raw-evidence");
  await mkdir(evidenceRoot, {recursive: true});
  for (let index = 1; index <= count; index += 1) {
    await writeFile(
      path.join(evidenceRoot, `target-${index}.json`),
      `${JSON.stringify({kind: "target", index})}\n`,
    );
    await writeFile(
      path.join(evidenceRoot, `host-${index}.json`),
      `${JSON.stringify({kind: "host", index})}\n`,
    );
  }
}

async function createCaptureFrames(fixture, count = 20) {
  const framesRoot = path.join(fixture.captureRoot, "frames");
  await mkdir(framesRoot, {recursive: true});
  const png = new PNG({width: 800, height: 600});
  png.data.fill(255);
  const bytes = PNG.sync.write(png);
  const frames = [];
  for (let index = 1; index <= count; index += 1) {
    const file = `frames/frame-${String(index).padStart(6, "0")}.png`;
    await writeFile(path.join(fixture.captureRoot, file), bytes);
    frames.push({
      ordinal: index,
      file,
      bytes: bytes.length,
      sha256: sha256(bytes),
      width: 800,
      height: 600,
      status: "complete",
    });
  }
  return frames;
}

async function appendRecord(fixture, kind, monotonicTimeMs, payload, hooks = {}) {
  return appendTs006NaturalTraceRecord({
    ...fixture.common,
    kind,
    occurredAt: new Date(1_750_000_000_000 + monotonicTimeMs).toISOString(),
    monotonicTimeMs,
    payload,
    hooks,
  });
}

function hostPayload(event, index) {
  const base = {
    hostEntryEvent: event,
    evidenceLocator: `raw-evidence/host-${index + 1}.json`,
  };
  if (event === "profile-empty-preflight") {
    return {
      ...base,
      emptyProfileVerified: true,
      sharedObjectFileCount: 0,
      rawEvidenceFileCount: 0,
    };
  }
  if (event === "projector-process-started-empty") {
    return {
      ...base,
      processId: 4242,
      freshProcess: true,
      processExecutableSha256: HASHES.projector,
    };
  }
  if (event === "named-human-file-open-selected-staged-host") {
    return {
      ...base,
      processId: 4242,
      humanFileOpenObserved: false,
      automationFileOpenObserved: true,
      openedFilePath:
        "work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/index_local.swf",
      openedFileSha256: HASHES.shell,
      directChildSwfOpened: false,
    };
  }
  if (event === "same-lesson-host-loaded") {
    return {...base, processId: 4242, sameLessonHostLoaded: true};
  }
  if (event === "same-lesson-natural-navigation-target-resolved") {
    return {
      ...base,
      processId: 4242,
      naturalNavigation: true,
      targetAnimationId: "course-g04-l03-ts-006",
      directSeekUsed: false,
    };
  }
  if (event === "ts006-root-entry-observed") {
    return {
      ...base,
      processId: 4242,
      frameDomainId: "root",
      observedRootFrame: 1,
      screenshotFile: "frames/frame-000001.png",
    };
  }
  if (event === "ts006-nested-entry-observed") {
    return {
      ...base,
      processId: 4242,
      frameDomainId: "sprite-23",
      observedRootFrame: 6,
      observedLocalFrame: 1,
      screenshotFile: "frames/frame-000002.png",
    };
  }
  return {
    ...base,
    processId: 4242,
    processExited: true,
    outboundNetworkSucceededCount: 0,
    persistentSideEffectCount: 0,
    sharedObjectFileCount: 0,
  };
}

async function appendCompleteBundle(
  fixture,
  {openedFilePath = null} = {},
) {
  await createSessionEvidence(fixture);
  const frames = await createCaptureFrames(fixture);
  for (let index = 0; index < STEP_IDS.length; index += 1) {
    const step = STEP_IDS[index];
    const base = index * 10;
    await appendRecord(fixture, "source-target", base, {
      scheduledStepId: step,
      resolvedSourceTarget: {kind: "observed-target", id: `target-${index + 1}`},
      resolutionEvidenceFile: `raw-evidence/target-${index + 1}.json`,
    });
    const domain = index === 0 ? "root" : "sprite-23";
    await appendRecord(fixture, "state", base + 1, {
      scheduledStepId: step,
      checkpointRole: "pre",
      frameDomainId: domain,
      rootFrame: domain === "root" ? 1 : 6,
      localFrame: 1,
      observedState: {phase: `observed-pre-${index + 1}`},
      screenshotFile: `frames/frame-${String(index * 2 + 1).padStart(6, "0")}.png`,
    });
    const operationPayload = {
      scheduledStepId: step,
      result: {status: "observed", step},
    };
    if (step === "invoke-host-native-replay") {
      operationPayload.replayObservation = {
        controlResolved: true,
        fullStateVectorResetObserved: true,
        resetStateVectorSha256: "b".repeat(64),
      };
    }
    if (step === "observe-second-natural-terminal") {
      operationPayload.replayCycleObservation = {
        cycle: 2,
        terminalObserved: true,
        terminalStateSha256: "c".repeat(64),
      };
    }
    await appendRecord(fixture, "operation", base + 2, operationPayload);
    await appendRecord(fixture, "state", base + 3, {
      scheduledStepId: step,
      checkpointRole: "post",
      frameDomainId: domain,
      rootFrame: domain === "root" ? 1 : 6,
      localFrame: Math.min(index + 1, 128),
      observedState: {phase: `observed-post-${index + 1}`},
      screenshotFile: `frames/frame-${String(index * 2 + 2).padStart(6, "0")}.png`,
    });
  }
  for (let index = 0; index < HOST_EVENTS.length; index += 1) {
    const payload = hostPayload(HOST_EVENTS[index], index);
    if (
      openedFilePath !== null &&
      HOST_EVENTS[index] === "named-human-file-open-selected-staged-host"
    ) {
      payload.openedFilePath = openedFilePath;
    }
    await appendRecord(
      fixture,
      "host-entry",
      1_000 + index,
      payload,
    );
  }
  await writeFile(
    path.join(fixture.captureRoot, "capture-manifest.json"),
    `${JSON.stringify({
      schemaVersion: 1,
      evidenceType: "test-only-capture-manifest",
      frames,
    }, null, 2)}\n`,
  );
}

test("initializes a no-replace automation-only recorder and verifies an empty prefix", async (t) => {
  const fixture = await createFixture(t);
  const result = await verifyTs006NaturalTraceRecorder(fixture.common);
  assert.equal(result.status, "partial-prefix-machine-integrity-valid-not-authoritative");
  assert.equal(result.operator.subjectType, "automation");
  assert.equal(result.operator.namedHuman, false);
  assert.equal(result.roleSeparation.namedHumanSessionAttestationEstablished, false);
  assert.equal(result.promotionEligible, false);
  assert.deepEqual(
    Object.values(result.logs).map(({records}) => records),
    [0, 0, 0, 0],
  );
  const recorderManifest = JSON.parse(await readFile(
    path.join(
      fixture.sessionRoot,
      "evidence/natural-trace-logs",
      CAPTURE_NAME,
      "recorder-manifest.json",
    ),
    "utf8",
  ));
  assert.equal(
    recorderManifest.writeBoundary.captureRootRelative,
    `evidence/raw-captures/${CAPTURE_NAME}`,
  );
  assert.equal(
    recorderManifest.writeBoundary.captureRootDirectChildOfSessionRawCapturesRoot,
    true,
  );
  assert.equal(
    recorderManifest.writeBoundary.legacySessionRootCaptureLayoutAccepted,
    false,
  );
  await assert.rejects(
    initializeTs006NaturalTraceRecorder({
      ...fixture.common,
      operator: automationSubject(),
      sessionContract: fixture.contract,
      bridgeManifest: fixture.bridge,
    }),
    /no-replace|already exists/u,
  );
});

test("initialization reserves a not-yet-created no-replace ScreenCaptureKit output path", async (t) => {
  const fixture = await createFixture(t, {
    initialize: false,
    createCaptureRoot: false,
  });
  const result = await initializeTs006NaturalTraceRecorder({
    ...fixture.common,
    operator: automationSubject(),
    sessionContract: fixture.contract,
    bridgeManifest: fixture.bridge,
  });
  assert.equal(result.manifest.status, "initialized-pending-candidate-only");
  assert.equal(
    await lstat(fixture.captureRoot).catch((error) =>
      error.code === "ENOENT" ? null : Promise.reject(error)),
    null,
  );
  await mkdir(fixture.captureRoot);
  const verified = await verifyTs006NaturalTraceRecorder(fixture.common);
  assert.equal(
    verified.status,
    "partial-prefix-machine-integrity-valid-not-authoritative",
  );
});

test("loads a pre-launch content-addressed bridge after profile state changes", async (t) => {
  const fixture = await createFixture(t, {
    initialize: false,
    createCaptureRoot: false,
  });
  const prebuilt = await createPrebuiltBridge(
    fixture.root,
    fixture.contract,
  );
  await writeFile(
    path.join(fixture.sessionRoot, "runtime-launch-log.json"),
    `${canonicalJson({pid: 4242, status: "started"})}\n`,
  );
  const loaded = await loadPrebuiltTs006NaturalTraceBridge({
    projectRoot: fixture.root,
    bridgeRoot: prebuilt.bridgeRoot,
    sessionRoot: fixture.sessionRoot,
  });
  assert.equal(
    loaded.bridgeManifest.bridgeManifestSha256,
    prebuilt.manifest.bridgeManifestSha256,
  );
  assert.equal(loaded.sessionContract.sessionId, SESSION_ID);
  const initialized = await initializeTs006NaturalTraceRecorder({
    ...fixture.common,
    operator: automationSubject(),
    sessionContract: loaded.sessionContract,
    bridgeManifest: loaded.bridgeManifest,
  });
  assert.equal(
    initialized.manifest.status,
    "initialized-pending-candidate-only",
  );
  await mkdir(fixture.captureRoot);
  const verified = await verifyTs006NaturalTraceRecorder({
    ...fixture.common,
    requireBoundBridge: true,
  });
  assert.equal(verified.boundBridgeRequired, true);
  assert.equal(verified.boundBridgeMatches, true);
});

test("prebuilt bridge loader rejects tampering and paths outside its fixed allowlist", async (t) => {
  const fixture = await createFixture(t, {
    initialize: false,
    createCaptureRoot: false,
  });
  const prebuilt = await createPrebuiltBridge(
    fixture.root,
    fixture.contract,
  );
  const contractPath = path.join(
    prebuilt.bridgeRoot,
    "en/session-contract.json",
  );
  await writeFile(contractPath, `${canonicalJson({...fixture.contract, status: "tampered"})}\n`);
  await assert.rejects(
    loadPrebuiltTs006NaturalTraceBridge({
      projectRoot: fixture.root,
      bridgeRoot: prebuilt.bridgeRoot,
      sessionRoot: fixture.sessionRoot,
    }),
    /differs from its manifest rendering/u,
  );

  const outside = path.join(fixture.root, "outside-bridge");
  await mkdir(outside);
  await assert.rejects(
    loadPrebuiltTs006NaturalTraceBridge({
      projectRoot: fixture.root,
      bridgeRoot: outside,
      sessionRoot: fixture.sessionRoot,
    }),
    /direct child/u,
  );
});

test("rejects a re-fingerprinted recorder manifest that claims the legacy capture boundary", async (t) => {
  const fixture = await createFixture(t);
  const manifestPath = path.join(
    fixture.sessionRoot,
    "evidence/natural-trace-logs",
    CAPTURE_NAME,
    "recorder-manifest.json",
  );
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.writeBoundary.captureRootRelative = CAPTURE_NAME;
  manifest.writeBoundary.captureRootDirectChildOfSessionRawCapturesRoot = false;
  manifest.writeBoundary.legacySessionRootCaptureLayoutAccepted = true;
  delete manifest.manifestFingerprintSha256;
  manifest.manifestFingerprintSha256 =
    sha256(Buffer.from(canonicalJson(manifest)));
  await chmod(manifestPath, 0o600);
  await writeFile(manifestPath, `${canonicalJson(manifest)}\n`);
  await chmod(manifestPath, 0o400);
  await assert.rejects(
    verifyTs006NaturalTraceRecorder(fixture.common),
    /capture write boundary drifted from the canonical raw-captures layout/u,
  );
});

test("records the complete four-chain automation bundle with capture screenshot membership", async (t) => {
  const fixture = await createFixture(t);
  await appendCompleteBundle(fixture);
  const result = await verifyTs006NaturalTraceRecorder({
    ...fixture.common,
    complete: true,
  });
  assert.deepEqual(
    Object.fromEntries(Object.entries(result.logs).map(([kind, item]) => [kind, item.records])),
    {operation: 9, state: 18, "source-target": 9, "host-entry": 8},
  );
  assert.equal(result.captureManifest.frameCount, 20);
  assert.equal(result.captureManifest.screenshotRecordCount, 20);
  assert.equal(result.captureManifest.everyScreenshotIsCaptureMember, true);
  assert.equal(
    result.completeBundleValidation.status,
    "complete-automation-log-shape-not-named-human-not-authoritative-not-promoted",
  );
  assert.equal(result.completeBundleValidation.namedHumanFileOpenObserved, false);
  assert.equal(result.bridgeNamedHumanBundleValidationPerformed, false);
  assert.equal(result.authoritativeOriginalRuntimeTraceEstablished, false);
});

test("accepts the exact project-root absolute spelling of the contracted host shell", async (t) => {
  const fixture = await createFixture(t);
  const openedFilePath = path.resolve(
    fixture.root,
    fixture.contract.hostEntryContract.selectedHostShellPath,
  );
  await appendCompleteBundle(fixture, {openedFilePath});
  const result = await verifyTs006NaturalTraceRecorder({
    ...fixture.common,
    complete: true,
  });
  assert.equal(
    result.completeBundleValidation.status,
    "complete-automation-log-shape-not-named-human-not-authoritative-not-promoted",
  );
});

test("rejects any other absolute host-shell path spelling", async (t) => {
  const fixture = await createFixture(t);
  const openedFilePath = `${path.resolve(
    fixture.root,
    fixture.contract.hostEntryContract.selectedHostShellPath,
  )}-other`;
  await appendCompleteBundle(fixture, {openedFilePath});
  await assert.rejects(
    verifyTs006NaturalTraceRecorder({
      ...fixture.common,
      complete: true,
    }),
    /automation file-open record/u,
  );
});

test("canonical pending-candidate bridge verifies recorder output below evidence/raw-captures", async (t) => {
  const fixture = await createFixture(t);
  await appendCompleteBundle(fixture);
  const captureManifestPath = path.join(fixture.captureRoot, "capture-manifest.json");
  const captureManifestBytes = await readFile(captureManifestPath);
  const bridge = await bindOptionalTs006NaturalTraceLogs({
    projectRoot: fixture.root,
    sessionRoot: fixture.sessionRoot,
    captureRoot: fixture.captureRoot,
    captureName: CAPTURE_NAME,
    captureDocument: {
      path: captureManifestPath,
      bytes: captureManifestBytes,
      size: captureManifestBytes.length,
      sha256: sha256(captureManifestBytes),
      value: JSON.parse(captureManifestBytes),
    },
  });
  assert.equal(bridge.present, true);
  assert.equal(bridge.machineIntegrityVerified, true);
  assert.equal(bridge.captureBinding.captureName, CAPTURE_NAME);
  assert.equal(bridge.captureBinding.captureDirectory, CAPTURE_NAME);
  assert.equal(bridge.unresolvedAuthority.strictMigrationComplete, false);
});

test("rejects tampered and truncated canonical JSONL", async (t) => {
  const fixture = await createFixture(t);
  await createSessionEvidence(fixture, 1);
  await appendRecord(fixture, "source-target", 0, {
    scheduledStepId: STEP_IDS[0],
    resolvedSourceTarget: {kind: "observed"},
    resolutionEvidenceFile: "raw-evidence/target-1.json",
  });
  const log = path.join(
    fixture.sessionRoot,
    "evidence/natural-trace-logs",
    CAPTURE_NAME,
    "source-target.jsonl",
  );
  await appendFile(log, "{");
  await assert.rejects(
    verifyTs006NaturalTraceRecorder(fixture.common),
    /partial|truncated|final record/u,
  );
  assert.throws(
    () => parseCanonicalJsonl(Buffer.from("{\"a\":1}\n{\"b\":"), "test partial"),
    /partial|truncated/u,
  );
});

test("rejects symlink roots and hard-linked logs", async (t) => {
  const symlinkFixture = await createFixture(t, {
    initialize: false,
    captureSymlink: true,
  });
  await assert.rejects(
    initializeTs006NaturalTraceRecorder({
      ...symlinkFixture.common,
      operator: automationSubject(),
      sessionContract: symlinkFixture.contract,
      bridgeManifest: symlinkFixture.bridge,
    }),
    /real directory|symbolic/u,
  );

  const rawCapturesSymlinkFixture = await createFixture(t, {
    initialize: false,
    rawCapturesSymlink: true,
  });
  await assert.rejects(
    initializeTs006NaturalTraceRecorder({
      ...rawCapturesSymlinkFixture.common,
      operator: automationSubject(),
      sessionContract: rawCapturesSymlinkFixture.contract,
      bridgeManifest: rawCapturesSymlinkFixture.bridge,
    }),
    /raw-captures root must be a real directory|symbolic-link component/u,
  );

  const fixture = await createFixture(t);
  const recorderRoot = path.join(
    fixture.sessionRoot,
    "evidence/natural-trace-logs",
    CAPTURE_NAME,
  );
  await link(
    path.join(recorderRoot, "operation.jsonl"),
    path.join(fixture.captureRoot, "operation-hardlink.jsonl"),
  );
  await assert.rejects(
    verifyTs006NaturalTraceRecorder(fixture.common),
    /single-link|regular non-symlink/u,
  );
});

test("rejects traversal names and the legacy session-root capture layout", async (t) => {
  const fixture = await createFixture(t, {initialize: false});
  await assert.rejects(
    initializeTs006NaturalTraceRecorder({
      ...fixture.common,
      captureName: "../escape",
      operator: automationSubject(),
      sessionContract: fixture.contract,
      bridgeManifest: fixture.bridge,
    }),
    /captureName must be a safe direct-child name/u,
  );

  const legacyFixture = await createFixture(t, {
    initialize: false,
    legacyCaptureOnly: true,
  });
  await assert.rejects(
    initializeTs006NaturalTraceRecorder({
      ...legacyFixture.common,
      operator: automationSubject(),
      sessionContract: legacyFixture.contract,
      bridgeManifest: legacyFixture.bridge,
    }),
    /legacy session-root capture layout is refused/u,
  );
});

test("rejects replayed or duplicate schedule steps", async (t) => {
  const fixture = await createFixture(t);
  await createSessionEvidence(fixture, 2);
  await appendRecord(fixture, "source-target", 0, {
    scheduledStepId: STEP_IDS[0],
    resolvedSourceTarget: {kind: "observed"},
    resolutionEvidenceFile: "raw-evidence/target-1.json",
  });
  await assert.rejects(
    appendRecord(fixture, "source-target", 1, {
      scheduledStepId: STEP_IDS[0],
      resolvedSourceTarget: {kind: "duplicate"},
      resolutionEvidenceFile: "raw-evidence/target-2.json",
    }),
    new RegExp(`expected source-target step ${STEP_IDS[1]}`, "u"),
  );
});

test("serializes writers with one live per-session lock", async (t) => {
  const fixture = await createFixture(t);
  await createSessionEvidence(fixture, 1);
  let release;
  let locked;
  const lockObserved = new Promise((resolve) => {
    locked = resolve;
  });
  const hold = new Promise((resolve) => {
    release = resolve;
  });
  const first = appendRecord(
    fixture,
    "source-target",
    0,
    {
      scheduledStepId: STEP_IDS[0],
      resolvedSourceTarget: {kind: "first"},
      resolutionEvidenceFile: "raw-evidence/target-1.json",
    },
    {
      afterLock: async () => {
        locked();
        await hold;
      },
    },
  );
  await lockObserved;
  await assert.rejects(
    appendRecord(fixture, "source-target", 1, {
      scheduledStepId: STEP_IDS[0],
      resolvedSourceTarget: {kind: "second"},
      resolutionEvidenceFile: "raw-evidence/target-1.json",
    }),
    /lock is held by live PID|EEXIST/u,
  );
  release();
  await first;
});

test("recovers exact postimage and exact preimage journals but fails closed on partial append", async (t) => {
  const fullFixture = await createFixture(t);
  await createSessionEvidence(fullFixture, 1);
  await assert.rejects(
    appendRecord(
      fullFixture,
      "source-target",
      0,
      {
        scheduledStepId: STEP_IDS[0],
        resolvedSourceTarget: {kind: "observed"},
        resolutionEvidenceFile: "raw-evidence/target-1.json",
      },
      {afterAppend: async () => {
        throw new Error("simulated crash after durable append");
      }},
    ),
    /simulated crash/u,
  );
  await assert.rejects(
    verifyTs006NaturalTraceRecorder(fullFixture.common),
    /unresolved append transaction/u,
  );
  const recovered = await recoverTs006NaturalTraceRecorder(fullFixture.common);
  assert.equal(recovered.recovered[0].recoveredAfterCrash, true);
  const verified = await verifyTs006NaturalTraceRecorder(fullFixture.common);
  assert.equal(verified.logs["source-target"].records, 1);

  const preimageFixture = await createFixture(t);
  await createSessionEvidence(preimageFixture, 1);
  await assert.rejects(
    appendRecord(
      preimageFixture,
      "source-target",
      0,
      {
        scheduledStepId: STEP_IDS[0],
        resolvedSourceTarget: {kind: "observed"},
        resolutionEvidenceFile: "raw-evidence/target-1.json",
      },
      {afterIntent: async () => {
        throw new Error("simulated crash before append");
      }},
    ),
    /simulated crash/u,
  );
  const aborted = await recoverTs006NaturalTraceRecorder(preimageFixture.common);
  assert.equal(
    aborted.recovered[0].recoveryDisposition,
    "aborted-before-append-exact-preimage-preserved",
  );

  const partialFixture = await createFixture(t);
  await createSessionEvidence(partialFixture, 1);
  await assert.rejects(
    appendRecord(
      partialFixture,
      "source-target",
      0,
      {
        scheduledStepId: STEP_IDS[0],
        resolvedSourceTarget: {kind: "observed"},
        resolutionEvidenceFile: "raw-evidence/target-1.json",
      },
      {afterIntent: async () => {
        throw new Error("simulated crash before partial append");
      }},
    ),
    /simulated crash/u,
  );
  const partialLog = path.join(
    partialFixture.sessionRoot,
    "evidence/natural-trace-logs",
    CAPTURE_NAME,
    "source-target.jsonl",
  );
  await appendFile(partialLog, "{\"partial\":");
  await assert.rejects(
    recoverTs006NaturalTraceRecorder(partialFixture.common),
    /partial, truncated, or divergent postimage/u,
  );
});

test("rejects wrong roles, stale bindings, and nested authority escalation", async (t) => {
  const roleFixture = await createFixture(t, {initialize: false});
  await assert.rejects(
    initializeTs006NaturalTraceRecorder({
      ...roleFixture.common,
      operator: automationSubject({
        subjectType: "human",
        role: "runtime-operator",
        namedHuman: true,
      }),
      sessionContract: roleFixture.contract,
      bridgeManifest: roleFixture.bridge,
    }),
    /subjectType must be automation|role must be machine-event-recorder/u,
  );

  const fixture = await createFixture(t);
  await createSessionEvidence(fixture, 1);
  await assert.rejects(
    appendRecord(fixture, "source-target", 0, {
      scheduledStepId: STEP_IDS[0],
      resolvedSourceTarget: {kind: "observed", decision: {ownerAccepted: true}},
      resolutionEvidenceFile: "raw-evidence/target-1.json",
    }),
    /forbidden authority\/role field/u,
  );
  await assert.rejects(
    appendTs006NaturalTraceRecord({
      ...fixture.common,
      kind: "source-target",
      occurredAt: new Date().toISOString(),
      monotonicTimeMs: 0,
      payload: {
        scheduledStepId: STEP_IDS[0],
        sessionId: "wrong-session",
        resolvedSourceTarget: {kind: "observed"},
        resolutionEvidenceFile: "raw-evidence/target-1.json",
      },
    }),
    /field is not allowed|managed field/u,
  );

  const contractPath = path.join(
    fixture.sessionRoot,
    "evidence/natural-trace-logs",
    CAPTURE_NAME,
    "session-contract.json",
  );
  await chmod(contractPath, 0o600);
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  contract.sessionKitSha256 = "f".repeat(64);
  await writeFile(contractPath, `${JSON.stringify(contract)}\n`);
  await chmod(contractPath, 0o400);
  await assert.rejects(
    verifyTs006NaturalTraceRecorder(fixture.common),
    /canonical JSON|binding is stale|session-contract binding/u,
  );
});
