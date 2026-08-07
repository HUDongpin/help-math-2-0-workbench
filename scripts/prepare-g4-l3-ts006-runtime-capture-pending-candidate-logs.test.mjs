import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, rm, symlink, unlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {PNG} from "pngjs";

import {
  bindOptionalTs006NaturalTraceLogs,
} from "./prepare-g4-l3-ts006-runtime-capture-pending-candidate.mjs";
import {
  canonicalJson,
  ts006BridgeRecordSha256,
} from "./scaffold-g4-l3-ts006-natural-trace-bridge.mjs";

const SESSION_ID = "ts006-en-00000000-0000-4000-8000-000000000021";
const CAPTURE_NAME = "natural-trace-en-binding-test";
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

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function pngBytes(red) {
  const png = new PNG({width: 800, height: 600});
  for (let index = 0; index < png.data.length; index += 4) {
    png.data[index] = red;
    png.data[index + 1] = 20;
    png.data[index + 2] = 30;
    png.data[index + 3] = 255;
  }
  return PNG.sync.write(png);
}

function clone(value) {
  return structuredClone(value);
}

function captureBinding(root, captureRoot) {
  void root;
  return {
    sessionId: SESSION_ID,
    captureName: CAPTURE_NAME,
    captureDirectory: path.basename(captureRoot),
    captureManifestFile: "capture-manifest.json",
    bindingStatus: "capture-name-bound-manifest-hash-pending-until-complete-verification",
  };
}

function sessionContract() {
  const schedule = [
    {
      order: 1,
      id: "invoke-host-native-replay",
      action: {kind: "host-native-replay"},
      sourceTarget: {kind: "host-control", instance: "BtnReplay"},
      preStateCheckpoint: {expectedState: {cycle: 1, state: "terminal"}},
      postStateCheckpoint: {expectedState: {cycle: 2, state: "reset"}},
    },
    {
      order: 2,
      id: "observe-second-natural-terminal",
      action: {kind: "observe-natural-terminal"},
      sourceTarget: {kind: "nested-timeline", instance: "sprite-23"},
      preStateCheckpoint: {expectedState: {cycle: 2, state: "running"}},
      postStateCheckpoint: {expectedState: {cycle: 2, state: "terminal"}},
    },
  ].map((step) => ({
    ...step,
    scheduledStepSha256: sha256(Buffer.from(canonicalJson(step))),
  }));
  return {
    schemaVersion: 1,
    artifactType: "ts006-natural-trace-session-contract",
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
    hostEntryContract: {
      selectedHostShellPath: "/read-only/HELP_COURSES/ELMGR4/L3/index_local.swf",
      selectedHostShellSha256: HASHES.shell,
    },
    schedule,
    audio: {required: false},
  };
}

function commonRecord(contract, binding, sequence, evidenceType, operator) {
  return {
    schemaVersion: 1,
    evidenceType,
    animationId: contract.animationId,
    language: contract.language,
    sessionId: contract.sessionId,
    requirementIds: clone(contract.requirementIds),
    traceSpecSetSha256: contract.traceSpecSetSha256,
    bridgeInputFingerprintSha256: contract.bridgeInputFingerprintSha256,
    sessionKitSha256: contract.sessionKitSha256,
    profileManifestSha256: contract.profileManifestSha256,
    hostTreeManifestSha256: contract.hostTreeManifestSha256,
    projectorExecutableSha256: contract.projectorExecutableSha256,
    runtimeEnvironmentReadinessSha256: contract.runtimeEnvironmentReadinessSha256,
    containmentReadinessSha256: contract.containmentReadinessSha256,
    captureBinding: clone(binding),
    sequence,
    occurredAt: new Date(Date.UTC(2026, 6, 27, 1, 0, sequence)).toISOString(),
    monotonicTimeMs: sequence * 100,
    operator: clone(operator),
  };
}

function finishChain(records, ownHashField, previousHashField) {
  let previous = null;
  for (const record of records) {
    record[previousHashField] = previous;
    delete record[ownHashField];
    record[ownHashField] = ts006BridgeRecordSha256(record, ownHashField);
    previous = record[ownHashField];
  }
  return records;
}

function hostEntryRecords(contract, binding, operator, frameHashes) {
  const events = [
    "profile-empty-preflight",
    "projector-process-started-empty",
    "named-human-file-open-selected-staged-host",
    "same-lesson-host-loaded",
    "same-lesson-natural-navigation-target-resolved",
    "ts006-root-entry-observed",
    "ts006-nested-entry-observed",
    "post-session-side-effect-summary",
  ];
  const records = events.map((hostEntryEvent, index) => {
    const record = {
      ...commonRecord(contract, binding, index + 1, "ts006-original-runtime-host-entry-event", operator),
      hostEntryEvent,
      processId: 4242,
      observedRootFrame: null,
      observedLocalFrame: null,
      evidenceLocator: `test-evidence-${index + 1}`,
      evidenceSha256: "a".repeat(64),
    };
    if (hostEntryEvent === "profile-empty-preflight") {
      Object.assign(record, {
        emptyProfileVerified: true,
        sharedObjectFileCount: 0,
        rawEvidenceFileCount: 0,
        livePreflightReceiptSha256: "b".repeat(64),
      });
    } else if (hostEntryEvent === "projector-process-started-empty") {
      Object.assign(record, {
        freshProcess: true,
        processExecutableSha256: contract.projectorExecutableSha256,
      });
    } else if (hostEntryEvent === "named-human-file-open-selected-staged-host") {
      Object.assign(record, {
        humanFileOpenObserved: false,
        automationFileOpenObserved: true,
        openedFilePath: contract.hostEntryContract.selectedHostShellPath,
        openedFileSha256: contract.hostEntryContract.selectedHostShellSha256,
        directChildSwfOpened: false,
      });
    } else if (hostEntryEvent === "same-lesson-host-loaded") {
      record.sameLessonHostLoaded = true;
    } else if (hostEntryEvent === "same-lesson-natural-navigation-target-resolved") {
      Object.assign(record, {
        naturalNavigation: true,
        targetAnimationId: contract.animationId,
        directSeekUsed: false,
      });
    } else if (hostEntryEvent === "ts006-root-entry-observed") {
      Object.assign(record, {
        frameDomainId: "root",
        observedRootFrame: 1,
        screenshotSha256: frameHashes[0],
      });
    } else if (hostEntryEvent === "ts006-nested-entry-observed") {
      Object.assign(record, {
        frameDomainId: "sprite-23",
        observedRootFrame: 6,
        observedLocalFrame: 1,
        screenshotSha256: frameHashes[1],
      });
    } else if (hostEntryEvent === "post-session-side-effect-summary") {
      Object.assign(record, {
        processExited: true,
        outboundNetworkSucceededCount: 0,
        persistentSideEffectCount: 0,
        sharedObjectFileCount: 0,
        requestAuditSha256: "c".repeat(64),
      });
    }
    return record;
  });
  return finishChain(records, "recordSha256", "previousRecordSha256");
}

function completeRecords(contract, binding, frameRows, {
  operator = {
    externalSubjectId: "automation:codex-computer-use",
    displayName: "Codex Computer Use",
    subjectType: "automation",
    role: "machine-event-recorder",
    namedHuman: false,
    provenanceClassification: "automation-only-not-human-attestation",
    independentReviewer: false,
    ownerRoleUsed: false,
    releaseCustodianRoleUsed: false,
  },
  screenshotTraversal = false,
  omitReplayObservation = false,
} = {}) {
  const operation = [];
  const state = [];
  const sourceTarget = [];
  let previousOperation = null;
  let previousState = null;
  let previousTarget = null;
  for (let index = 0; index < contract.schedule.length; index += 1) {
    const scheduled = contract.schedule[index];
    const baseTime = index * 1000;
    const target = {
      ...commonRecord(contract, binding, index + 1, "ts006-original-runtime-source-target-resolution", operator),
      monotonicTimeMs: baseTime + 10,
      scheduledOrder: scheduled.order,
      scheduledStepId: scheduled.id,
      scheduledStepSha256: scheduled.scheduledStepSha256,
      expectedSourceTarget: clone(scheduled.sourceTarget),
      resolvedSourceTarget: {runtimeObjectIdentity: `object-${index + 1}`},
      resolutionEvidenceSha256: "d".repeat(64),
      previousRecordSha256: previousTarget,
    };
    target.recordSha256 = ts006BridgeRecordSha256(target, "recordSha256");
    previousTarget = target.recordSha256;
    sourceTarget.push(target);

    const preObserved = {cycle: index + 1, checkpoint: "pre"};
    const pre = {
      ...commonRecord(contract, binding, index * 2 + 1, "ts006-original-runtime-state-observation", operator),
      monotonicTimeMs: baseTime + 20,
      scheduledOrder: scheduled.order,
      scheduledStepId: scheduled.id,
      scheduledStepSha256: scheduled.scheduledStepSha256,
      checkpointRole: "pre",
      expectedState: clone(scheduled.preStateCheckpoint.expectedState),
      frameDomainId: "root",
      rootFrame: 1,
      localFrame: 1,
      observedState: preObserved,
      observedStateSha256: sha256(Buffer.from(canonicalJson(preObserved))),
      screenshotFile: screenshotTraversal && index === 0 ? "../escape.png" : frameRows[0].file,
      screenshotSha256: frameRows[0].sha256,
      width: 800,
      height: 600,
      causalOperationEventSha256: null,
      previousRecordSha256: previousState,
    };
    pre.recordSha256 = ts006BridgeRecordSha256(pre, "recordSha256");
    previousState = pre.recordSha256;
    state.push(pre);

    const op = {
      ...commonRecord(contract, binding, index + 1, "ts006-original-runtime-operation-event", operator),
      monotonicTimeMs: baseTime + 30,
      scheduledOrder: scheduled.order,
      scheduledStepId: scheduled.id,
      scheduledStepSha256: scheduled.scheduledStepSha256,
      action: clone(scheduled.action),
      sourceTargetRecordSha256: target.recordSha256,
      preStateRecordSha256: pre.recordSha256,
      postStateCheckpointSha256: sha256(Buffer.from(canonicalJson(scheduled.postStateCheckpoint))),
      result: "observed-test-only",
      previousEventSha256: previousOperation,
    };
    if (scheduled.id === "invoke-host-native-replay" && !omitReplayObservation) {
      op.replayObservation = {
        controlResolved: true,
        fullStateVectorResetObserved: true,
        resetStateVectorSha256: "e".repeat(64),
      };
    }
    if (scheduled.id === "observe-second-natural-terminal") {
      op.replayCycleObservation = {
        cycle: 2,
        terminalObserved: true,
        terminalStateSha256: "f".repeat(64),
      };
    }
    op.eventSha256 = ts006BridgeRecordSha256(op, "eventSha256");
    previousOperation = op.eventSha256;
    operation.push(op);

    const postObserved = {cycle: index + 1, checkpoint: "post"};
    const post = {
      ...commonRecord(contract, binding, index * 2 + 2, "ts006-original-runtime-state-observation", operator),
      monotonicTimeMs: baseTime + 40,
      scheduledOrder: scheduled.order,
      scheduledStepId: scheduled.id,
      scheduledStepSha256: scheduled.scheduledStepSha256,
      checkpointRole: "post",
      expectedState: clone(scheduled.postStateCheckpoint.expectedState),
      frameDomainId: "sprite-23",
      rootFrame: 6,
      localFrame: 1,
      observedState: postObserved,
      observedStateSha256: sha256(Buffer.from(canonicalJson(postObserved))),
      screenshotFile: frameRows[1].file,
      screenshotSha256: frameRows[1].sha256,
      width: 800,
      height: 600,
      causalOperationEventSha256: op.eventSha256,
      previousRecordSha256: previousState,
    };
    post.recordSha256 = ts006BridgeRecordSha256(post, "recordSha256");
    previousState = post.recordSha256;
    state.push(post);
  }
  return {
    operation,
    state,
    sourceTarget,
    hostEntry: hostEntryRecords(contract, binding, operator, frameRows.map((frame) => frame.sha256)),
  };
}

async function writeCanonicalJsonl(candidate, records) {
  await writeFile(candidate, `${records.map((record) => canonicalJson(record)).join("\n")}\n`);
}

async function createFixture(options = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ts006-pending-log-binding-"));
  const sessionRoot = path.join(root, "artifacts/full-frame/g4-l3", SESSION_ID);
  const captureRoot = path.join(sessionRoot, "evidence/raw-captures", CAPTURE_NAME);
  await mkdir(path.join(captureRoot, "frames"), {recursive: true});
  const frameBytes = [pngBytes(10), pngBytes(20)];
  const frameRows = [];
  for (let index = 0; index < frameBytes.length; index += 1) {
    const file = `frames/frame-${String(index + 1).padStart(6, "0")}.png`;
    await writeFile(path.join(captureRoot, file), frameBytes[index]);
    frameRows.push({
      ordinal: index + 1,
      file,
      bytes: frameBytes[index].length,
      sha256: sha256(frameBytes[index]),
      width: 800,
      height: 600,
    });
  }
  const capture = {
    schemaVersion: 1,
    evidenceType: "test-capture",
    frames: frameRows,
    audio: {
      outputFile: "system-audio-lossless.m4a",
      outputSha256: "0".repeat(64),
    },
  };
  const captureManifestPath = path.join(captureRoot, "capture-manifest.json");
  await writeFile(captureManifestPath, pretty(capture));
  const captureBytes = await readFile(captureManifestPath);
  const captureDocument = {
    path: captureManifestPath,
    bytes: captureBytes,
    size: captureBytes.length,
    sha256: sha256(captureBytes),
    value: capture,
  };

  if (options.withLogs !== false) {
    const bundleRoot = path.join(sessionRoot, "evidence/natural-trace-logs", CAPTURE_NAME);
    await mkdir(path.join(bundleRoot, "transactions"), {recursive: true});
    const contract = sessionContract();
    const binding = captureBinding(root, captureRoot);
    const records = completeRecords(contract, binding, frameRows, options);
    await Promise.all([
      writeFile(path.join(bundleRoot, "recorder-manifest.json"), pretty({
        schemaVersion: 1,
        artifactType: "ts006-natural-trace-append-only-recorder",
        status: "initialized-pending-candidate-only",
        animationId: "course-g04-l03-ts-006",
        language: "en",
        sessionId: SESSION_ID,
        captureBinding: binding,
        operator: records.operation[0].operator,
        machineClaim: {
          classification: "append-only-structural-recording-infrastructure",
          automationEventProvenanceBound: true,
          namedRuntimeOperatorBound: false,
          namedHumanSessionAttestationEstablished: false,
          independentHumanReviewEstablished: false,
          ownerAcceptanceEstablished: false,
          signatureTrustEstablished: false,
          originalRuntimeAuthorityEstablished: false,
        },
        promotionEligible: false,
        strictAcceptanceEffect: "none",
      })),
      writeFile(path.join(bundleRoot, "session-contract.json"), pretty(contract)),
      writeCanonicalJsonl(path.join(bundleRoot, "operation.jsonl"), records.operation),
      writeCanonicalJsonl(path.join(bundleRoot, "state.jsonl"), records.state),
      writeCanonicalJsonl(path.join(bundleRoot, "source-target.jsonl"), records.sourceTarget),
      writeCanonicalJsonl(path.join(bundleRoot, "host-entry.jsonl"), records.hostEntry),
    ]);
    return {root, sessionRoot, captureRoot, captureDocument, bundleRoot, records, contract};
  }
  return {root, sessionRoot, captureRoot, captureDocument, bundleRoot: null, records: null};
}

async function passingRecorderVerifier(fixture) {
  const logDefinitions = {
    operation: ["operation", "eventSha256"],
    state: ["state", "recordSha256"],
    "source-target": ["sourceTarget", "recordSha256"],
    "host-entry": ["hostEntry", "recordSha256"],
  };
  const logs = {};
  for (const [kind, [recordKey, ownHashField]] of Object.entries(logDefinitions)) {
    const bytes = await readFile(path.join(fixture.bundleRoot, `${kind}.jsonl`));
    logs[kind] = {
      path: `${kind}.jsonl`,
      records: fixture.records[recordKey].length,
      bytes: bytes.length,
      sha256: sha256(bytes),
      chainHeadSha256: fixture.records[recordKey].at(-1)[ownHashField],
    };
  }
  const chainHeads = Object.fromEntries(Object.entries(logs).map(([kind, log]) => [kind, log.chainHeadSha256]));
  const validation = {
    schemaVersion: 1,
    artifactType: "ts006-automation-natural-trace-log-bundle-structural-validation",
    status: "complete-automation-log-shape-not-named-human-not-authoritative-not-promoted",
    namedHumanFileOpenObserved: false,
    automationFileOpenObserved: true,
    namedHumanSessionAttestationEstablished: false,
    authoritativeEvidenceEstablished: false,
    promotionEligible: false,
    strictAcceptanceEffect: "none",
    chainHeads,
    bundleDigestSha256: sha256(Buffer.from(canonicalJson(chainHeads))),
  };
  return {
    schemaVersion: 1,
    artifactType: "ts006-natural-trace-recorder-machine-validation",
    status: "complete-log-shape-and-machine-integrity-valid-not-authoritative",
    animationId: "course-g04-l03-ts-006",
    sessionId: SESSION_ID,
    language: "en",
    captureBinding: captureBinding(fixture.root, fixture.captureRoot),
    logs,
    completeBundleValidation: validation,
    bridgeNamedHumanBundleValidationPerformed: false,
    captureManifest: {
      path: "capture-manifest.json",
      bytes: fixture.captureDocument.size,
      sha256: fixture.captureDocument.sha256,
      frameCount: fixture.captureDocument.value.frames.length,
      screenshotRecordCount: fixture.records.state.length,
      everyScreenshotIsCaptureMember: true,
    },
    operator: fixture.records.operation[0].operator,
    roleSeparation: {
      automationEventProvenanceRecorded: true,
      runtimeOperatorRecorded: false,
      namedHumanSessionAttestationEstablished: false,
      independentVisualReviewerRecorded: false,
      ownerRecorded: false,
      releaseCustodianRecorded: false,
      samePersonRoleCombinationCannotBeMadeIndependentByThisRecorder: true,
    },
    verifiedScreenshotFileCount: fixture.records.state.length,
    machineIntegrityEstablished: true,
    authoritativeOriginalRuntimeTraceEstablished: false,
    signatureTrustEstablished: false,
    promotionEligible: false,
    strictAcceptanceEffect: "none",
  };
}

async function bind(fixture, verifyRecorder = async () => passingRecorderVerifier(fixture)) {
  return bindOptionalTs006NaturalTraceLogs({
    projectRoot: fixture.root,
    sessionRoot: fixture.sessionRoot,
    captureRoot: fixture.captureRoot,
    captureName: CAPTURE_NAME,
    captureDocument: fixture.captureDocument,
    verifyRecorder,
  });
}

test("optional binding preserves the exact missing-log blocker when no selected bundle exists", async (t) => {
  const fixture = await createFixture({withLogs: false});
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  assert.deepEqual(await bind(fixture), {
    present: false,
    machineIntegrityVerified: false,
    blocker: "no-hash-chained-operation-event-log",
  });
});

test("initialized recorder with four empty JSONLs binds an explicit pending hash-chain blocker without complete verification", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  await Promise.all([
    writeFile(path.join(fixture.bundleRoot, "operation.jsonl"), ""),
    writeFile(path.join(fixture.bundleRoot, "state.jsonl"), ""),
    writeFile(path.join(fixture.bundleRoot, "source-target.jsonl"), ""),
    writeFile(path.join(fixture.bundleRoot, "host-entry.jsonl"), ""),
  ]);
  let verifierCalls = 0;
  const result = await bind(fixture, async () => {
    verifierCalls += 1;
    throw new Error("complete recorder verification must not run for an initialized empty bundle");
  });
  assert.equal(verifierCalls, 0);
  assert.equal(result.present, true);
  assert.equal(result.machineIntegrityVerified, false);
  assert.equal(result.blocker, "no-hash-chained-operation-event-log");
  assert.equal(result.completionState, "initialized-empty-recorder-logs");
  assert.equal(result.authorityClassification, "recorder-initialized-no-hash-chain");
  assert.deepEqual(Object.fromEntries(Object.entries(result.logs).map(([kind, log]) => [kind, {
    bytes: log.bytes,
    recordCount: log.recordCount,
    chainHeadSha256: log.chainHeadSha256,
  }])), {
    operation: {bytes: 0, recordCount: 0, chainHeadSha256: null},
    state: {bytes: 0, recordCount: 0, chainHeadSha256: null},
    sourceTarget: {bytes: 0, recordCount: 0, chainHeadSha256: null},
    hostEntry: {bytes: 0, recordCount: 0, chainHeadSha256: null},
  });
  assert.equal(result.recorderVerifierPassed, false);
  assert.equal(result.unresolvedAuthority.authoritativeOriginalRuntimeTrace, false);
  assert.equal(result.unresolvedAuthority.strictMigrationComplete, false);
  assert.equal(result.unresolvedAuthority.publicRelease, false);
});

test("mixed empty and populated recorder logs remain a hard fail-closed error", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  await writeFile(path.join(fixture.bundleRoot, "operation.jsonl"), "");
  let verifierCalls = 0;
  await assert.rejects(() => bind(fixture, async () => {
    verifierCalls += 1;
    throw new Error("complete recorder verification must not run for a partially initialized bundle");
  }), /partially initialized: empty operation/);
  assert.equal(verifierCalls, 0);
});

test("complete four-chain bundle binds only machine integrity and capture membership", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const result = await bind(fixture);
  assert.equal(result.present, true);
  assert.equal(result.machineIntegrityVerified, true);
  assert.equal(result.authorityClassification, "hash-chain-machine-integrity-only");
  assert.deepEqual(Object.fromEntries(Object.entries(result.logs).map(([kind, log]) => [kind, log.recordCount])), {
    operation: 2,
    state: 4,
    sourceTarget: 2,
    hostEntry: 8,
  });
  assert.equal(result.captureBinding.uniqueStateScreenshotFileCount, 2);
  assert.equal(result.operator.role, "machine-event-recorder");
  assert.equal(result.operator.namedHuman, false);
  assert.equal(result.operator.independentReviewer, false);
  assert.equal(result.operator.namedHumanSessionAttestationEstablished, false);
  assert.equal(result.operator.reviewerOrOwnerAuthorityEstablished, false);
  assert.equal(result.structuralValidation.authoritativeEvidenceEstablished, false);
  assert.equal(result.structuralValidation.namedHumanFileOpenObserved, false);
  assert.equal(result.structuralValidation.automationFileOpenObserved, true);
  assert.equal(result.unresolvedAuthority.strictMigrationComplete, false);
});

test("present but incomplete logs fail closed instead of being treated as absent", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  await unlink(path.join(fixture.bundleRoot, "source-target.jsonl"));
  await assert.rejects(() => bind(fixture), /incomplete: missing source-target\.jsonl/);
});

test("record tampering is rejected by the exported bridge hash-chain validator", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const operationPath = path.join(fixture.bundleRoot, "operation.jsonl");
  const records = (await readFile(operationPath, "utf8")).trimEnd().split("\n").map(JSON.parse);
  records[0].result = "tampered-without-rehash";
  await writeCanonicalJsonl(operationPath, records);
  await assert.rejects(() => bind(fixture), /record 1 hash mismatch/);
});

test("Replay evidence remains mandatory even when an attacker rehashes the operation chain", async (t) => {
  const fixture = await createFixture({omitReplayObservation: true});
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  await assert.rejects(() => bind(fixture), /Replay control resolution was not observed/);
});

test("capture-relative traversal is rejected after otherwise valid chain construction", async (t) => {
  const fixture = await createFixture({screenshotTraversal: true});
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  await assert.rejects(() => bind(fixture), /screenshotFile is not a canonical capture-relative path|escapes the selected capture/);
});

test("automation-recorder identity cannot be reused as an independent reviewer role", async (t) => {
  const fixture = await createFixture({
    operator: {
      externalSubjectId: "same-person",
      displayName: "Same Person",
      subjectType: "automation",
      role: "independent-visual-reviewer",
      namedHuman: false,
      provenanceClassification: "automation-only-not-human-attestation",
      independentReviewer: true,
      ownerRoleUsed: false,
      releaseCustodianRoleUsed: false,
    },
  });
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  await assert.rejects(() => bind(fixture), /cannot be reused as a named human, reviewer, owner, or release custodian/);
});

test("symlinked log members are rejected before recorder verification", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const operationPath = path.join(fixture.bundleRoot, "operation.jsonl");
  const outsidePath = path.join(fixture.root, "outside-operation.jsonl");
  await writeFile(outsidePath, await readFile(operationPath));
  await unlink(operationPath);
  await symlink(outsidePath, operationPath);
  await assert.rejects(() => bind(fixture), /must be a regular single-link file|symbolic-link/);
});

test("recorder manifest or capture-manifest drift reported by the canonical verifier is propagated", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  await assert.rejects(() => bind(fixture, async () => {
    throw new Error("recorder capture manifest SHA-256 drifted");
  }), /capture manifest SHA-256 drifted/);
});

test("selected capture manifest descriptor drift fails before optional logs can be trusted", async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  fixture.captureDocument.sha256 = "f".repeat(64);
  await assert.rejects(() => bind(fixture), /capture manifest descriptor is missing or stale/);
});
