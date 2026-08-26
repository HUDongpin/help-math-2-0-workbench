import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  DEFAULT_REPOSITORY_ROOT,
  buildTs006NaturalTraceBridge,
  canonicalJson,
  renderTs006NaturalTraceBridge,
  scaffoldTs006NaturalTraceBridge,
  ts006BridgeRecordSha256,
  validateTs006ProfileReadinessPredecessorProof,
  validateTs006BridgeHashChain,
  validateTs006BridgeLogBundle,
  validateTs006TraceSpecSet,
  verifyTs006NaturalTraceBridge,
} from "./scaffold-g4-l3-ts006-natural-trace-bridge.mjs";
import {
  verifyDisposableProfileSelectionTransaction,
} from "./select-g4-l3-ts006-disposable-runtime-profiles.mjs";

const TRACE_PATHS = [
  "migrations/course-g04-l03-ts-006/audit/trace-specs/req-root-lesson-shell-natural-entry-en.json",
  "migrations/course-g04-l03-ts-006/audit/trace-specs/req-root-lesson-shell-natural-entry-es.json",
  "migrations/course-g04-l03-ts-006/audit/trace-specs/req-sprite-23-lesson-shell-natural-entry-en.json",
  "migrations/course-g04-l03-ts-006/audit/trace-specs/req-sprite-23-lesson-shell-natural-entry-es.json",
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readJson(relative) {
  return JSON.parse(await readFile(path.join(DEFAULT_REPOSITORY_ROOT, relative), "utf8"));
}

async function readJsonDescriptor(relative) {
  const bytes = await readFile(path.join(DEFAULT_REPOSITORY_ROOT, relative));
  return {
    path: relative,
    byteCount: bytes.length,
    sha256: sha256(bytes),
    document: JSON.parse(bytes),
  };
}

async function realProfilePredecessorProofFixture(language = "en") {
  const selectionFile = await readJsonDescriptor(
    "work/g4-l3-ts006-original-runtime-authorization-intake/current-session-profile-selection.json",
  );
  const selection = selectionFile.document;
  const transactionId = selection.selectionTransaction.transactionId;
  const transactionVerification =
    await verifyDisposableProfileSelectionTransaction({
      projectRoot: DEFAULT_REPOSITORY_ROOT,
      transactionId,
    });
  const [
    transactionPreimageFile,
    transactionReceiptFile,
  ] = await Promise.all([
    readJsonDescriptor(selection.selectionTransaction.immutablePreimagePath),
    readJsonDescriptor(selection.selectionTransaction.immutableReceiptPath),
  ]);
  const selectedProfile = selection.profiles.find(
    (profile) => profile.language === language,
  );
  const profileFile = await readJsonDescriptor(selectedProfile.manifestPath);
  return {
    selection,
    selectionFile,
    selectedProfile,
    profileFile,
    readinessBinding: profileFile.document.sourceBindings.readiness,
    transactionVerification,
    transactionPreimageFile,
    transactionReceiptFile,
  };
}

async function realTraceFixture() {
  const traceFiles = await Promise.all(TRACE_PATHS.map(async (relative) => {
    const bytes = await readFile(path.join(DEFAULT_REPOSITORY_ROOT, relative));
    return {
      file: {
        path: relative,
        bytes,
        byteCount: bytes.length,
        sha256: sha256(bytes),
      },
      spec: JSON.parse(bytes),
    };
  }));
  return {
    traceFiles,
    traceIndex: await readJson("migrations/course-shell-pilot-trace-spec-index.json"),
    migrationManifest: await readJson("migrations/course-g04-l03-ts-006/migration.json"),
    coverage: await readJson("migrations/course-g04-l03-ts-006/evidence/full-frame-coverage.json"),
    scenarioInventory: await readJson("migrations/course-g04-l03-ts-006/audit/scenario-inventory.json"),
  };
}

function clone(value) {
  return structuredClone(value);
}

function commonRecord(session, sequence, evidenceType) {
  return {
    schemaVersion: 1,
    evidenceType,
    animationId: session.animationId,
    language: session.language,
    sessionId: session.sessionId,
    requirementIds: clone(session.requirementIds),
    traceSpecSetSha256: session.traceSpecSetSha256,
    bridgeInputFingerprintSha256: session.bridgeInputFingerprintSha256,
    sessionKitSha256: session.sessionKitSha256,
    profileManifestSha256: session.profileManifestSha256,
    hostTreeManifestSha256: session.hostTreeManifestSha256,
    projectorExecutableSha256: session.projectorExecutableSha256,
    runtimeEnvironmentReadinessSha256: session.runtimeEnvironmentReadinessSha256,
    containmentReadinessSha256: session.containmentReadinessSha256,
    sequence,
    occurredAt: new Date(Date.UTC(2026, 6, 26, 4, 0, sequence)).toISOString(),
    monotonicTimeMs: sequence * 100,
    operator: {
      externalSubjectId: "test-only-named-operator",
      displayName: "Test Operator",
    },
  };
}

function hashChain(records, ownHashField, previousHashField) {
  let previous = null;
  return records.map((source) => {
    const record = {
      ...source,
      [previousHashField]: previous,
    };
    record[ownHashField] = ts006BridgeRecordSha256(record, ownHashField);
    previous = record[ownHashField];
    return record;
  });
}

function operationChain(session) {
  const records = session.schedule.map((scheduled, index) => {
    const record = {
      ...commonRecord(session, index + 1, "ts006-original-runtime-operation-event"),
      scheduledOrder: scheduled.order,
      scheduledStepId: scheduled.id,
      scheduledStepSha256: scheduled.scheduledStepSha256,
      action: clone(scheduled.action),
      sourceTargetRecordSha256: "1".repeat(64),
      preStateRecordSha256: "2".repeat(64),
      postStateCheckpointSha256: sha256(
        Buffer.from(canonicalJson(scheduled.postStateCheckpoint)),
      ),
      result: "observed-test-only",
    };
    if (scheduled.id === "invoke-host-native-replay") {
      record.replayObservation = {
        controlResolved: true,
        fullStateVectorResetObserved: true,
        resetStateVectorSha256: "a".repeat(64),
      };
    }
    if (scheduled.id === "observe-second-natural-terminal") {
      record.replayCycleObservation = {
        cycle: 2,
        terminalObserved: true,
        terminalStateSha256: "b".repeat(64),
      };
    }
    if (scheduled.id === "invoke-page-spanish-narration") {
      record.audioObservation = {
        requestedRuntimePath: session.audio.requestedRuntimePathCandidate,
        sourceAudioBytesSha256: session.audio.requestedAudioCandidateSha256,
        successfulLoadObserved: true,
        audibilityObserved: true,
        spokenLanguage: "es",
        completionObserved: true,
        synchronizationObserved: true,
        losslessSessionAudioFile: "test-only-session-audio.flac",
        losslessSessionAudioSha256: "c".repeat(64),
        triggerMonotonicTimeMs: record.monotonicTimeMs,
      };
    }
    return record;
  });
  return hashChain(records, "eventSha256", "previousEventSha256");
}

function sourceTargetChain(session) {
  const records = session.schedule.map((scheduled, index) => ({
    ...commonRecord(session, index + 1, "ts006-original-runtime-source-target-resolution"),
    scheduledOrder: scheduled.order,
    scheduledStepId: scheduled.id,
    scheduledStepSha256: scheduled.scheduledStepSha256,
    expectedSourceTarget: clone(scheduled.sourceTarget),
    resolvedSourceTarget: {
      sourceLocator: `test-only:${scheduled.id}`,
      runtimeObjectIdentity: `object-${index + 1}`,
    },
    resolutionEvidenceSha256: "4".repeat(64),
  }));
  return hashChain(records, "recordSha256", "previousRecordSha256");
}

function hostEntryChain(session) {
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
      ...commonRecord(session, index + 1, "ts006-original-runtime-host-entry-event"),
      hostEntryEvent,
      processId: 12345,
      observedRootFrame: null,
      observedLocalFrame: null,
      evidenceLocator: `test-only-host-entry-${index + 1}`,
      evidenceSha256: "6".repeat(64),
    };
    if (hostEntryEvent === "profile-empty-preflight") {
      Object.assign(record, {
        emptyProfileVerified: true,
        sharedObjectFileCount: 0,
        rawEvidenceFileCount: 0,
        livePreflightReceiptSha256: "d".repeat(64),
      });
    } else if (hostEntryEvent === "projector-process-started-empty") {
      Object.assign(record, {
        freshProcess: true,
        processExecutableSha256: session.projectorExecutableSha256,
      });
    } else if (hostEntryEvent === "named-human-file-open-selected-staged-host") {
      Object.assign(record, {
        humanFileOpenObserved: true,
        openedFilePath: session.hostEntryContract.selectedHostShellPath,
        openedFileSha256: session.hostEntryContract.selectedHostShellSha256,
        directChildSwfOpened: false,
      });
    } else if (hostEntryEvent === "same-lesson-host-loaded") {
      record.sameLessonHostLoaded = true;
    } else if (hostEntryEvent === "same-lesson-natural-navigation-target-resolved") {
      Object.assign(record, {
        naturalNavigation: true,
        targetAnimationId: "course-g04-l03-ts-006",
        directSeekUsed: false,
      });
    } else if (hostEntryEvent === "ts006-root-entry-observed") {
      Object.assign(record, {
        frameDomainId: "root",
        observedRootFrame: 1,
        screenshotSha256: "e".repeat(64),
      });
    } else if (hostEntryEvent === "ts006-nested-entry-observed") {
      Object.assign(record, {
        frameDomainId: "sprite-23",
        observedRootFrame: 6,
        observedLocalFrame: 1,
        screenshotSha256: "f".repeat(64),
      });
    } else if (hostEntryEvent === "post-session-side-effect-summary") {
      Object.assign(record, {
        processExited: true,
        outboundNetworkSucceededCount: 0,
        persistentSideEffectCount: 0,
        sharedObjectFileCount: 0,
        requestAuditSha256: "0".repeat(64),
      });
    }
    return record;
  });
  return hashChain(records, "recordSha256", "previousRecordSha256");
}

function stateChain(session) {
  const records = session.schedule.flatMap((scheduled, scheduleIndex) =>
    ["pre", "post"].map((checkpointRole, roleIndex) => {
      const index = scheduleIndex * 2 + roleIndex;
      const frameDomainId = index % 2 === 0 ? "root" : "sprite-23";
      const rootFrame = frameDomainId === "root" ? 1 : 6;
      const localFrame = 1;
      const expectedState = clone(
        checkpointRole === "pre"
          ? scheduled.preStateCheckpoint.expectedState
          : scheduled.postStateCheckpoint.expectedState,
      );
      const observedState = {
        frameDomainId,
        rootFrame,
        localFrame,
        testOnly: true,
      };
      return {
        ...commonRecord(session, index + 1, "ts006-original-runtime-state-observation"),
        scheduledOrder: scheduled.order,
        scheduledStepId: scheduled.id,
        scheduledStepSha256: scheduled.scheduledStepSha256,
        checkpointRole,
        expectedState,
        frameDomainId,
        rootFrame,
        localFrame,
        observedState,
        observedStateSha256: sha256(Buffer.from(canonicalJson(observedState))),
        screenshotFile: `test-only-${frameDomainId}-${index + 1}.png`,
        screenshotSha256: "7".repeat(64),
        width: 800,
        height: 600,
        causalOperationEventSha256:
          checkpointRole === "pre" ? null : "8".repeat(64),
      };
    }),
  );
  return hashChain(records, "recordSha256", "previousRecordSha256");
}

function completeLogBundle(session) {
  const operation = [];
  const state = [];
  const sourceTarget = [];
  let priorOperation = null;
  let priorState = null;
  let priorTarget = null;
  for (let index = 0; index < session.schedule.length; index += 1) {
    const scheduled = session.schedule[index];
    const baseTime = index * 1000;
    const target = {
      ...commonRecord(
        session,
        index + 1,
        "ts006-original-runtime-source-target-resolution",
      ),
      monotonicTimeMs: baseTime + 10,
      scheduledOrder: scheduled.order,
      scheduledStepId: scheduled.id,
      scheduledStepSha256: scheduled.scheduledStepSha256,
      expectedSourceTarget: clone(scheduled.sourceTarget),
      resolvedSourceTarget: {
        sourceLocator: `test-only:${scheduled.id}`,
        runtimeObjectIdentity: `object-${index + 1}`,
      },
      resolutionEvidenceSha256: "4".repeat(64),
      previousRecordSha256: priorTarget,
    };
    target.recordSha256 = ts006BridgeRecordSha256(target, "recordSha256");
    priorTarget = target.recordSha256;
    sourceTarget.push(target);

    const preObserved = {
      frameDomainId: "root",
      rootFrame: 1,
      localFrame: 1,
      testOnly: true,
      checkpointRole: "pre",
    };
    const pre = {
      ...commonRecord(
        session,
        index * 2 + 1,
        "ts006-original-runtime-state-observation",
      ),
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
      screenshotFile: `test-only-pre-${index + 1}.png`,
      screenshotSha256: "7".repeat(64),
      width: 800,
      height: 600,
      causalOperationEventSha256: null,
      previousRecordSha256: priorState,
    };
    pre.recordSha256 = ts006BridgeRecordSha256(pre, "recordSha256");
    priorState = pre.recordSha256;
    state.push(pre);

    const op = {
      ...commonRecord(
        session,
        index + 1,
        "ts006-original-runtime-operation-event",
      ),
      monotonicTimeMs: baseTime + 30,
      scheduledOrder: scheduled.order,
      scheduledStepId: scheduled.id,
      scheduledStepSha256: scheduled.scheduledStepSha256,
      action: clone(scheduled.action),
      sourceTargetRecordSha256: target.recordSha256,
      preStateRecordSha256: pre.recordSha256,
      postStateCheckpointSha256: sha256(
        Buffer.from(canonicalJson(scheduled.postStateCheckpoint)),
      ),
      result: "observed-test-only",
      previousEventSha256: priorOperation,
    };
    if (scheduled.id === "invoke-host-native-replay") {
      op.replayObservation = {
        controlResolved: true,
        fullStateVectorResetObserved: true,
        resetStateVectorSha256: "a".repeat(64),
      };
    }
    if (scheduled.id === "observe-second-natural-terminal") {
      op.replayCycleObservation = {
        cycle: 2,
        terminalObserved: true,
        terminalStateSha256: "b".repeat(64),
      };
    }
    if (scheduled.id === "invoke-page-spanish-narration") {
      op.audioObservation = {
        requestedRuntimePath: session.audio.requestedRuntimePathCandidate,
        sourceAudioBytesSha256: session.audio.requestedAudioCandidateSha256,
        successfulLoadObserved: true,
        audibilityObserved: true,
        spokenLanguage: "es",
        completionObserved: true,
        synchronizationObserved: true,
        losslessSessionAudioFile: "test-only-session-audio.flac",
        losslessSessionAudioSha256: "c".repeat(64),
        triggerMonotonicTimeMs: op.monotonicTimeMs,
      };
    }
    op.eventSha256 = ts006BridgeRecordSha256(op, "eventSha256");
    priorOperation = op.eventSha256;
    operation.push(op);

    const postObserved = {
      frameDomainId: "sprite-23",
      rootFrame: 6,
      localFrame: 1,
      testOnly: true,
      checkpointRole: "post",
    };
    const post = {
      ...commonRecord(
        session,
        index * 2 + 2,
        "ts006-original-runtime-state-observation",
      ),
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
      screenshotFile: `test-only-post-${index + 1}.png`,
      screenshotSha256: "7".repeat(64),
      width: 800,
      height: 600,
      causalOperationEventSha256: op.eventSha256,
      previousRecordSha256: priorState,
    };
    post.recordSha256 = ts006BridgeRecordSha256(post, "recordSha256");
    priorState = post.recordSha256;
    state.push(post);
  }
  return {
    operation,
    state,
    sourceTarget,
    hostEntry: hostEntryChain(session),
  };
}

test("build binds the exact current TS006 source/runtime inputs but remains fail-closed", async () => {
  const manifest = await buildTs006NaturalTraceBridge();
  assert.equal(manifest.traceSpecs.length, 4);
  assert.equal(manifest.sessions.length, 2);
  assert.deepEqual(manifest.sessions.map((session) => session.language), ["en", "es"]);
  assert.deepEqual(
    [...new Set(manifest.traceSpecs.map((spec) => spec.frameDomainId))].sort(),
    ["root", "sprite-23"],
  );
  assert.equal(manifest.executionGate.executionReady, false);
  assert.equal(manifest.executionGate.blockerCount, 10);
  assert.equal(
    manifest.executionGate.blockers.some(
      (blocker) =>
        /^profile-(en|es)-source-binding-stale:readiness$/u.test(blocker),
    ),
    false,
  );
  assert.equal(manifest.diagnosticPromotionPerformed, false);
  assert.equal(manifest.readOnlyHostTree.files, 657);
  assert.equal(manifest.readOnlyHostTree.physicalMode, "0555-root/0444-files");
  assert.match(manifest.projector.sha256, /^[a-f0-9]{64}$/u);
  assert.equal(manifest.sessions.find((session) => session.language === "en").replay.required, true);
  assert.equal(manifest.sessions.find((session) => session.language === "es").replay.required, true);
  assert.equal(manifest.sessions.find((session) => session.language === "es").audio.required, true);
  assert.equal(
    manifest.sessions.find((session) => session.language === "es").audio.expectedCallee,
    "_root.doPlaySpanishAudio",
  );
  assert.equal(
    manifest.inputBindings.profileSelectionTransaction
      .verifiedByExistingSelectionTransactionVerifier,
    true,
  );
  assert.match(
    manifest.inputBindings.profileSelectionTransaction.transactionId,
    /^[a-f0-9]{64}$/u,
  );
  for (const profile of manifest.selectedProfiles) {
    assert.equal(
      profile.creationTimeReadinessBinding.validationMode,
      "immutable-profile-manifest-plus-fail-closed-selection-cas-predecessor",
    );
    assert.equal(
      profile.creationTimeReadinessBinding
        .verifiedByExistingSelectionTransactionVerifier,
      true,
    );
    assert.equal(
      profile.creationTimeReadinessBinding.currentReadinessEqualityRequired,
      false,
    );
  }
  for (const container of [manifest, ...manifest.sessions, ...Object.values(manifest.logSchemas)]) {
    assert.equal(container.strictAcceptanceEffect, "none");
    for (const value of Object.values(container.authority || {})) {
      assert.equal(value, false);
    }
    for (const value of Object.values(container.acceptance || {})) {
      assert.equal(value, false);
    }
  }
  assert.equal(renderTs006NaturalTraceBridge(manifest).size, 12);
});

test("profile readiness predecessor proof accepts the exact CAS transaction and rejects tamper, replay, and wrong preimage", async () => {
  const fixture = await realProfilePredecessorProofFixture();
  const verified = validateTs006ProfileReadinessPredecessorProof(fixture);
  assert.equal(
    verified.validationMode,
    "immutable-profile-manifest-plus-fail-closed-selection-cas-predecessor",
  );
  assert.equal(verified.verifiedByExistingSelectionTransactionVerifier, true);
  assert.equal(verified.currentReadinessEqualityRequired, false);
  assert.equal(verified.runtimeAuthorityCreated, false);
  assert.equal(verified.acceptanceAuthorityCreated, false);
  assert.equal(verified.strictAcceptanceEffect, "none");

  const tamperedReceipt = clone(fixture);
  tamperedReceipt.transactionReceiptFile.document.writeBoundary.FlashLaunched =
    true;
  assert.throws(
    () =>
      validateTs006ProfileReadinessPredecessorProof(tamperedReceipt),
    /receiptFingerprintSha256 does not match|runtime, mutation, authority, or acceptance effect/u,
  );

  const predecessorSelection =
    fixture.transactionPreimageFile.document;
  assert.match(
    predecessorSelection.selectionTransaction.transactionId,
    /^[a-f0-9]{64}$/u,
  );
  const replayedReceipt = clone(fixture);
  [
    replayedReceipt.transactionPreimageFile,
    replayedReceipt.transactionReceiptFile,
  ] = await Promise.all([
    readJsonDescriptor(
      predecessorSelection.selectionTransaction.immutablePreimagePath,
    ),
    readJsonDescriptor(
      predecessorSelection.selectionTransaction.immutableReceiptPath,
    ),
  ]);
  assert.throws(
    () =>
      validateTs006ProfileReadinessPredecessorProof(replayedReceipt),
    /does not bind the immutable preimage|replayed|different current selection/u,
  );

  const wrongPreimage = clone(fixture);
  wrongPreimage.transactionPreimageFile.sha256 = "f".repeat(64);
  assert.throws(
    () =>
      validateTs006ProfileReadinessPredecessorProof(wrongPreimage),
    /does not bind the immutable preimage|exact declared predecessor/u,
  );
});

test("trace-set validation rejects missing specs, identity drift, missing Replay, and missing Spanish audio", async () => {
  const fixture = await realTraceFixture();
  assert.doesNotThrow(() => validateTs006TraceSpecSet(fixture));

  const missing = clone(fixture);
  missing.traceFiles.pop();
  assert.throws(() => validateTs006TraceSpecSet(missing), /exactly four/u);

  const badEntry = clone(fixture);
  badEntry.traceFiles[0].spec.entryState.targetSequence = 999;
  assert.throws(() => validateTs006TraceSpecSet(badEntry), /entryStateSha256 mismatch/u);

  const missingReplay = clone(fixture);
  const en = missingReplay.traceFiles.find((item) => item.spec.identity.language === "en");
  en.spec.schedule.orderedSteps = en.spec.schedule.orderedSteps.filter(
    (step) => step.id !== "invoke-host-native-replay",
  );
  assert.throws(() => validateTs006TraceSpecSet(missingReplay), /exactly nine|Replay/u);

  const missingSpanishAudio = clone(fixture);
  const es = missingSpanishAudio.traceFiles.find((item) => item.spec.identity.language === "es");
  es.spec.schedule.orderedSteps.find(
    (step) => step.id === "invoke-page-spanish-narration",
  ).action.kind = "unknown-audio-action";
  assert.throws(() => validateTs006TraceSpecSet(missingSpanishAudio), /Spanish audio action missing/u);
});

test("four log chains validate exact bindings and reject tamper/cross-session replay", async () => {
  const manifest = await buildTs006NaturalTraceBridge();
  const en = manifest.sessions.find((session) => session.language === "en");
  const es = manifest.sessions.find((session) => session.language === "es");
  const cases = [
    ["operation", operationChain(es)],
    ["source-target", sourceTargetChain(en)],
    ["host-entry", hostEntryChain(en)],
    ["state", stateChain(es)],
  ];
  for (const [kind, records] of cases) {
    const result = validateTs006BridgeHashChain(records, {
      kind,
      sessionContract: kind === "operation" || kind === "state" ? es : en,
    });
    assert.equal(result.structurallyValid, true);
    assert.equal(result.authoritativeEvidenceEstablished, false);
  }

  const bundleRecords = completeLogBundle(es);
  const bundle = validateTs006BridgeLogBundle({
    ...bundleRecords,
    sessionContract: es,
  });
  assert.equal(bundle.status, "structurally-valid-not-promoted-not-authoritative");
  assert.equal(bundle.authoritativeEvidenceEstablished, false);
  assert.match(bundle.bundleDigestSha256, /^[a-f0-9]{64}$/u);

  const brokenBundle = clone(bundleRecords);
  brokenBundle.operation[0].sourceTargetRecordSha256 = "d".repeat(64);
  brokenBundle.operation[0].eventSha256 = ts006BridgeRecordSha256(
    brokenBundle.operation[0],
    "eventSha256",
  );
  assert.throws(
    () =>
      validateTs006BridgeLogBundle({
        ...brokenBundle,
        sessionContract: es,
      }),
    /operation does not bind|previous hash mismatch/u,
  );

  const tampered = operationChain(es);
  tampered[1].action = { kind: "tampered" };
  assert.throws(
    () => validateTs006BridgeHashChain(tampered, { kind: "operation", sessionContract: es }),
    /hash mismatch|action mismatch/u,
  );

  const crossSession = sourceTargetChain(en);
  crossSession[0].sessionId = es.sessionId;
  crossSession[0].recordSha256 = ts006BridgeRecordSha256(crossSession[0], "recordSha256");
  assert.throws(
    () => validateTs006BridgeHashChain(crossSession, { kind: "source-target", sessionContract: en }),
    /binding mismatch/u,
  );

  const brokenPrevious = hostEntryChain(en);
  brokenPrevious[2].previousRecordSha256 = "9".repeat(64);
  brokenPrevious[2].recordSha256 = ts006BridgeRecordSha256(brokenPrevious[2], "recordSha256");
  assert.throws(
    () => validateTs006BridgeHashChain(brokenPrevious, { kind: "host-entry", sessionContract: en }),
    /previous hash mismatch/u,
  );
});

test("exclusive scaffold is deterministic, verifies current inputs, and detects drift", async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "ts006-natural-trace-bridge-test-"));
  const outputPath = path.join(temporaryRoot, "bridge");
  try {
    const result = await scaffoldTs006NaturalTraceBridge({ outputPath });
    assert.equal(result.executionReady, false);
    assert.equal(result.fileCount, 12);
    assert.equal((await stat(path.join(outputPath, "bridge-manifest.json"))).mode & 0o777, 0o400);
    assert.equal((await stat(path.join(outputPath, "en"))).mode & 0o777, 0o700);
    const verified = await verifyTs006NaturalTraceBridge({ outputPath });
    assert.equal(verified.current, true);
    await assert.rejects(
      scaffoldTs006NaturalTraceBridge({ outputPath }),
      /output path already exists/u,
    );

    const readme = path.join(outputPath, "README.md");
    await chmod(readme, 0o600);
    await writeFile(readme, `${await readFile(readme, "utf8")}\ntamper\n`);
    await assert.rejects(
      verifyTs006NaturalTraceBridge({ outputPath }),
      /scaffold file drifted/u,
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
