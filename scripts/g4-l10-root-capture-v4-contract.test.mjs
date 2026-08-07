import assert from "node:assert/strict";
import {
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
} from "node:crypto";
import {readFileSync} from "node:fs";
import test from "node:test";

import * as contractApi from "./lib/g4-l10-root-capture-v4-contract.mjs";

import {
  G4_L10_ROOT_CAPTURE_V4_CONSTANTS,
  assertV4PreparationAuthorityAvailable,
  authorizationSigningBytes,
  canonicalJson,
  capacityCalculationSha256,
  contentDescriptor,
  deriveCapacityDemandV4,
  expectedArtifactFilesForPlan,
  guiObserverEventSigningBytes,
  guiObserverSessionReceiptBytes,
  hostTreeManifestBytes,
  launchReplayObservationBytes,
  launchReplayTokenBytes,
  operatorIdentitySha256,
  operatorProjectorExitSigningBytes,
  operatorSourceOpenSigningBytes,
  physicalIdentitySha256,
  preLaunchAdmissionBindingSha256,
  processObserverSessionReceiptBytes,
  profileDiscardReceiptBytes,
  receiptSha256,
  sessionOutputEntrySetSha256,
  sessionOutputManifestBytes,
  sessionPlanSha256,
  sha256Bytes,
  sha256Text,
  sourceOpenStartReceiptSha256,
  statefulFilesystemVerificationReceiptBytes,
  tokenTransitionReceiptBytes,
  validateAuthorizationConsumptionShapeOnly,
  validateAuthorizedProjectorStartShapeOnly,
  validateCapacityPreflightShapeOnly,
  validateContainmentPostflightShapeOnly,
  validateContentDescriptor,
  validateEnvironmentPreflightShapeOnly,
  validateFullSessionChainV4,
  validateLaunchIntentShapeOnly,
  validateNamedOperatorAuthorizationShapeOnly,
  validateOutputRootPreflightShapeOnly,
  validatePreLaunchAdmissionV4,
  validateSessionPlanShapeOnly,
  validateSourceOpenStartReceiptV4ShapeOnly,
} from "./lib/g4-l10-root-capture-v4-contract.mjs";

const NOW = Date.parse("2030-01-01T00:04:30.000Z");
const ZERO_SHA = "0".repeat(64);
const PROJECT_ROOT = "/Volumes/Fixture/HELP MATH 2.0";

function allFalseAuthority() {
  return Object.fromEntries(
    G4_L10_ROOT_CAPTURE_V4_CONSTANTS.authorityKeys.map((key) => [key, false]),
  );
}

function finalizedReceipt(base) {
  const document = {...structuredClone(base), receiptSha256: ZERO_SHA};
  document.receiptSha256 = receiptSha256(document);
  return document;
}

function finalizedPlan(base) {
  const document = {...structuredClone(base), planSha256: ZERO_SHA};
  document.planSha256 = sessionPlanSha256(document);
  return document;
}

function descriptorForJson(file, document) {
  return contentDescriptor(file, canonicalJson(document));
}

function physicalFileEvidence(descriptor, inode, observedAt, {mode = "0400", device = "501"} = {}) {
  return {
    descriptor,
    absolutePath: descriptor.file,
    realPath: descriptor.file,
    device,
    inode: String(inode),
    mode,
    mountId: `fixture-volume-${device}`,
    nlink: 1,
    ordinaryFile: true,
    symlinkFree: true,
    observedAt,
  };
}

function physicalDirectory(
  absolutePath,
  inode,
  observedAt,
  {mode = "0555", device = "501", nlink = 2} = {},
) {
  return {
    absolutePath,
    realPath: absolutePath,
    device,
    inode: String(inode),
    mode,
    mountId: `fixture-volume-${device}`,
    nlink,
    directory: true,
    symlinkFree: true,
    observedAt,
  };
}

function spkiBase64(publicKey) {
  return publicKey.export({type: "spki", format: "der"}).toString("base64");
}

function spkiSha256(publicKey) {
  return sha256Bytes(publicKey.export({type: "spki", format: "der"}));
}

function runnerBinding(plan, environment) {
  return {
    ...structuredClone(plan.runner),
    physicalIdentitySha256: physicalIdentitySha256(
      environment.physicalBindings.runnerExecutable,
    ),
  };
}

function expectedPreLaunchStartIdentity({plan, binding, startInstanceId, nonceSha256}) {
  return sha256Text(canonicalJson({
    schemaVersion: 4,
    identityType: "g4-l10-prelaunch-start-instance-intent-v4",
    sessionId: plan.sessionId,
    planSha256: plan.planSha256,
    startInstanceId,
    nonceSha256,
    runtimeExecutableSha256: plan.runtime.executable.sha256,
    runnerExecutableSha256: binding.executable.sha256,
    runnerPhysicalIdentitySha256: binding.physicalIdentitySha256,
  }));
}

function expectedStartIdentity({
  plan,
  authorization,
  authorizationDescriptor,
  nonceSha256,
  launchIntent,
  preLaunchAdmissionBinding,
  runnerProcess,
  projectorProcess,
}) {
  return sha256Text(canonicalJson({
    schemaVersion: 4,
    identityType: "g4-l10-one-consumption-one-projector-start-v4",
    sessionId: plan.sessionId,
    planSha256: plan.planSha256,
    authorizationSha256: authorizationDescriptor.sha256,
    nonceSha256,
    operatorExternalSubjectId: authorization.operator.externalSubjectId,
    actionId: authorization.action.actionId,
    runtimeExecutableSha256: plan.runtime.executable.sha256,
    runnerExecutableSha256: plan.runner.executable.sha256,
    runnerPhysicalIdentitySha256: launchIntent.runner.physicalIdentitySha256,
    startInstanceId: launchIntent.startInstanceId,
    preLaunchAdmissionBindingSha256: preLaunchAdmissionBinding,
    runnerProcess,
    projectorProcess,
  }));
}

function signAuthorization(document, privateKey) {
  const signed = structuredClone(document);
  signed.signature.signatureBase64 = sign(
    null,
    authorizationSigningBytes(signed),
    privateKey,
  ).toString("base64");
  return signed;
}

function detachedSignature(bytes, privateKey, publicKeySha256) {
  return {
    algorithm: "Ed25519",
    publicKeySha256,
    signatureBase64: sign(null, bytes, privateKey).toString("base64"),
  };
}

function buildPlan({
  language = "en",
  sourceId = "ti003",
  sessionId = language === "en"
    ? "123e4567-e89b-42d3-a456-426614174000"
    : "123e4567-e89b-42d3-a456-426614174001",
} = {}) {
  const sessionSuffix = `${sourceId}-${language}-${sessionId.slice(-8)}`;
  const sourceBytes = Buffer.from(`fixture G4 L10 ${sourceId} source SWF bytes`);
  const runtimeBytes = Buffer.from("fixture Adobe Projector executable bytes");
  const runnerBytes = Buffer.from("fixture exact stateful launcher bytes");
  const sourceSwf = contentDescriptor(
    `${PROJECT_ROOT}/source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/${sourceId.toUpperCase()}.swf`,
    sourceBytes,
  );
  const stagedSource = contentDescriptor(
    `/var/tmp/g4-l10-v4/${sessionSuffix}/host/${sourceId}.swf`,
    sourceBytes,
  );
  const plan = {
    schemaVersion: 4,
    evidenceType: "g4-l10-root-capture-session-plan-v4",
    sessionId,
    releaseId: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.releaseId,
    animationId: `course-g04-l10-${sourceId}-${language}`,
    requirementId: `req-${sourceId}-root-${language}`,
    identity: {
      language,
      frameDomain: "root",
      trace: `${sourceId}-root-exhaustive`,
      entryStateSha256: sha256Text(`entry-state-${sourceId}-${language}`),
      scenario: "default",
      seed: 0,
    },
    captureKit: contentDescriptor(
      `${PROJECT_ROOT}/work/root-capture-kits-v4/${sourceId}-${language}/kit-manifest.json`,
      `kit-${sourceId}-${language}\n`,
    ),
    kitCheck: contentDescriptor(
      `${PROJECT_ROOT}/work/root-capture-kits-v4/${sourceId}-${language}/kit-currentness.json`,
      `kit-currentness-${sourceId}-${language}\n`,
    ),
    traceSpec: contentDescriptor(
      `${PROJECT_ROOT}/migrations/course-g04-l10-${sourceId}-${language}/evidence/root-trace.json`,
      `trace-spec-${sourceId}-${language}\n`,
    ),
    traceSpecIndex: contentDescriptor(
      `${PROJECT_ROOT}/migrations/lesson-release-trace-spec-indexes/g4-l10-v4.json`,
      "trace-index-v4\n",
    ),
    sourceSwf,
    stagedSource,
    runtime: {
      runtimeId: "adobe-flash-player-projector",
      name: "Adobe Flash Player Projector",
      version: "32.0.0.465",
      executable: contentDescriptor(
        "/Applications/Flash Player.app/Contents/MacOS/Flash Player",
        runtimeBytes,
      ),
      rootFrameCount: 10,
      sourceNativeStage: {width: 799.9, height: 599.75},
      captureRaster: {width: 800, height: 600},
    },
    runner: {
      toolId: "g4-l10-stateful-projector-launcher",
      toolVersion: "4.1.0",
      executable: contentDescriptor(
        "/usr/local/libexec/g4-l10-stateful-projector-launcher",
        runnerBytes,
      ),
    },
    captureObligationCount: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.captureObligationCount,
    plannedSessionOutputRoot: `/var/tmp/g4-l10-v4/${sessionSuffix}/session-output`,
    launchContract: {
      protocol: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.launchProtocol,
      projectorStartsEmpty: true,
      namedHumanGuiFileOpen: true,
      sourceOpenMethod: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.sourceOpenMethod,
      menuPath: [...G4_L10_ROOT_CAPTURE_V4_CONSTANTS.sourceOpenMenuPath],
      selectedSourceFile: stagedSource.file,
      authenticatedMarkersRequired: true,
    },
    operationPolicy: {
      policyVersion: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.operationPolicyVersion,
      allowedActionIds: [...G4_L10_ROOT_CAPTURE_V4_CONSTANTS.allowedHumanOperationIds],
      humanOnlyActionIds: [...G4_L10_ROOT_CAPTURE_V4_CONSTANTS.humanOnlyOperationIds],
      forbiddenActionIds: [...G4_L10_ROOT_CAPTURE_V4_CONSTANTS.forbiddenOperationIds],
    },
    stopConditions: [...G4_L10_ROOT_CAPTURE_V4_CONSTANTS.requiredStopConditions],
    stopConditionSetSha256: sha256Text(canonicalJson(
      G4_L10_ROOT_CAPTURE_V4_CONSTANTS.requiredStopConditions,
    )),
    authorityBoundary: allFalseAuthority(),
  };
  return finalizedPlan(plan);
}

function fixture({
  language = "en",
  sourceId = "ti003",
  sessionId,
  runnerStartedAt = "2030-01-01T00:02:09.000Z",
} = {}) {
  const ownerKeys = generateKeyPairSync("ed25519");
  const operatorKeys = generateKeyPairSync("ed25519");
  const guiKeys = generateKeyPairSync("ed25519");
  const plan = buildPlan({language, sourceId, ...(sessionId ? {sessionId} : {})});
  const planDescriptor = descriptorForJson(
    `/var/tmp/g4-l10-v4/${plan.sessionId}/session-plan.json`,
    plan,
  );
  const environmentCheckedAt = "2030-01-01T00:00:00.000Z";
  const outputCheckedAt = "2030-01-01T00:00:10.000Z";
  const capacityMeasuredAt = "2030-01-01T00:00:20.000Z";
  const launchObservedAt = "2030-01-01T00:00:30.000Z";
  const startedAt = "2030-01-01T00:02:10.000Z";
  const outputRootPath = plan.plannedSessionOutputRoot;
  const hostRootPath = plan.stagedSource.file.slice(0, plan.stagedSource.file.lastIndexOf("/"));
  const profileRootPath = `/var/tmp/g4-l10-v4/${plan.sessionId}/runtime-profile`;
  const replayRootPath = `/var/tmp/g4-l10-v4/${plan.sessionId}/replay-locks`;
  const expectedFiles = expectedArtifactFilesForPlan(plan);
  const observerPaths = {
    network: `${outputRootPath}/network-observer-session.json`,
    requests: `${outputRootPath}/request-observer-session.json`,
    process: `${outputRootPath}/process-observer-session.json`,
    windows: `${outputRootPath}/window-observer-session.json`,
    effects: `${outputRootPath}/effect-observer-session.json`,
    audio: `${outputRootPath}/audio-observer-session.json`,
    gui: `${outputRootPath}/gui-observer-session.json`,
  };
  const guiSourceOpenEventPath = `${outputRootPath}/gui-source-open-event.json`;
  const hostEntries = [{
    path: plan.stagedSource.file,
    bytes: plan.stagedSource.bytes,
    sha256: plan.stagedSource.sha256,
    mode: "0400",
    ordinaryFile: true,
    readOnly: true,
    symlinkFree: true,
  }];
  const hostTreeManifest = contentDescriptor(
    `/var/tmp/g4-l10-v4/${plan.sessionId}/host-tree-manifest.json`,
    hostTreeManifestBytes({rootRealPath: hostRootPath, entries: hostEntries}),
  );
  const profileManifest = contentDescriptor(
    `/var/tmp/g4-l10-v4/${plan.sessionId}/profile-manifest.json`,
    "empty disposable profile manifest\n",
  );
  const sandboxPolicy = contentDescriptor(
    `/var/tmp/g4-l10-v4/${plan.sessionId}/projector.sb`,
    "default deny sandbox\n",
  );
  const processInventory = contentDescriptor(
    `/var/tmp/g4-l10-v4/${plan.sessionId}/process-inventory.json`,
    "no matching process\n",
  );
  const readyReceipts = Object.fromEntries(
    Object.keys(observerPaths).map((key) => [key, contentDescriptor(
      `/var/tmp/g4-l10-v4/${plan.sessionId}/observers/${key}-ready.json`,
      `${key} observer ready\n`,
    )]),
  );
  const guiPublicKeySpkiBase64 = spkiBase64(guiKeys.publicKey);
  const guiPublicKeySha256 = spkiSha256(guiKeys.publicKey);
  const observers = Object.fromEntries(Object.keys(observerPaths).map((key) => [key, {
    readyReceipt: readyReceipts[key],
    sessionReceiptPath: observerPaths[key],
    ready: true,
      ...(key === "gui" ? {
      observerId: "fixture:authenticated-gui-observer-001",
      publicKeySpkiBase64: guiPublicKeySpkiBase64,
        publicKeySha256: guiPublicKeySha256,
        sourceOpenEventPath: guiSourceOpenEventPath,
    } : {}),
  }]));
  const controls = G4_L10_ROOT_CAPTURE_V4_CONSTANTS.requiredControlIds.map((controlId) => ({
    controlId,
    approved: true,
    verified: true,
  }));
  const physicalBindings = {
    runtimeExecutable: physicalFileEvidence(plan.runtime.executable, 1001, environmentCheckedAt,
      {mode: "0555"}),
    runnerExecutable: physicalFileEvidence(plan.runner.executable, 1002, environmentCheckedAt,
      {mode: "0555"}),
    stagedSource: physicalFileEvidence(plan.stagedSource, 1003, environmentCheckedAt),
    captureKit: physicalFileEvidence(plan.captureKit, 1004, environmentCheckedAt),
    kitCheck: physicalFileEvidence(plan.kitCheck, 1005, environmentCheckedAt),
    traceSpec: physicalFileEvidence(plan.traceSpec, 1006, environmentCheckedAt),
    traceSpecIndex: physicalFileEvidence(plan.traceSpecIndex, 1007, environmentCheckedAt),
    hostTreeManifest: physicalFileEvidence(hostTreeManifest, 1008, environmentCheckedAt),
    profileManifest: physicalFileEvidence(profileManifest, 1009, environmentCheckedAt),
    sandboxPolicy: physicalFileEvidence(sandboxPolicy, 1010, environmentCheckedAt),
    processInventory: physicalFileEvidence(processInventory, 1011, environmentCheckedAt),
    networkObserver: physicalFileEvidence(readyReceipts.network, 1012, environmentCheckedAt),
    requestObserver: physicalFileEvidence(readyReceipts.requests, 1013, environmentCheckedAt),
    processObserver: physicalFileEvidence(readyReceipts.process, 1014, environmentCheckedAt),
    windowObserver: physicalFileEvidence(readyReceipts.windows, 1015, environmentCheckedAt),
    effectObserver: physicalFileEvidence(readyReceipts.effects, 1016, environmentCheckedAt),
    audioObserver: physicalFileEvidence(readyReceipts.audio, 1017, environmentCheckedAt),
    guiObserver: physicalFileEvidence(readyReceipts.gui, 1018, environmentCheckedAt),
  };
  const environment = finalizedReceipt({
    schemaVersion: 4,
    evidenceType: "g4-l10-root-capture-environment-preflight-v4",
    sessionId: plan.sessionId,
    sessionPlan: planDescriptor,
    checkedAt: environmentCheckedAt,
    validUntil: "2030-01-01T00:10:00.000Z",
    host: {
      hostIdSha256: sha256Text("fixture-host-id"),
      platform: "darwin",
      architecture: "arm64",
    },
    runtime: {...structuredClone(plan.runtime), codeSignatureVerified: true, hashVerified: true},
    runner: {...structuredClone(plan.runner), hashVerified: true},
    stagedSource: plan.stagedSource,
    kitCurrentness: {
      policyVersion: "g4-l10-kit-currentness-v4.1",
      captureKit: plan.captureKit,
      kitCheck: plan.kitCheck,
      traceSpec: plan.traceSpec,
      traceSpecIndex: plan.traceSpecIndex,
      checkedAt: environmentCheckedAt,
      allCurrent: true,
      noDescriptorDrift: true,
    },
    hostTree: {
      manifest: hostTreeManifest,
      root: physicalDirectory(hostRootPath, 2001, environmentCheckedAt),
      stagedSource: plan.stagedSource,
      allowlistedDependencies: [],
      allowlistedDependencyPhysical: [],
      entries: hostEntries,
      entryCount: hostEntries.length,
      fileSetSha256: sha256Text(canonicalJson(hostEntries)),
      unexpectedEntryCount: 0,
      readOnly: true,
      symlinkFree: true,
      exactStagedSourcePresent: true,
    },
    profile: {
      manifest: profileManifest,
      sessionRoot: physicalDirectory(profileRootPath, 2002, environmentCheckedAt, {mode: "0700"}),
      initialTreeEntries: [],
      initialTreeSetSha256: sha256Text(canonicalJson([])),
      emptySharedObjectState: true,
      runtimeWritableOnlyWithinSession: true,
      externalReplayLockRoot: physicalDirectory(
        replayRootPath,
        2003,
        environmentCheckedAt,
        {mode: "0700"},
      ),
    },
    sandbox: {
      policy: sandboxPolicy,
      defaultDeny: true,
      outboundDenied: true,
      writeRoots: [profileRootPath],
      readRoots: [hostRootPath],
      profileOnlyWrites: true,
    },
    processAbsence: {
      checkedAt: environmentCheckedAt,
      inventoryReceipt: processInventory,
      matchingProcessCount: 0,
      freshProcessRequired: true,
      verified: true,
    },
    observers,
    physicalBindings,
    controls,
    stopConditionSetSha256: plan.stopConditionSetSha256,
    allApprovedAndVerified: true,
    authorityBoundary: allFalseAuthority(),
  });
  const environmentDescriptor = descriptorForJson(
    `/var/tmp/g4-l10-v4/${plan.sessionId}/preflights/environment.json`,
    environment,
  );
  const captureKitRoot = plan.captureKit.file.slice(0, plan.captureKit.file.lastIndexOf("/"));
  const outputRoot = finalizedReceipt({
    schemaVersion: 4,
    evidenceType: "g4-l10-root-capture-output-root-preflight-v4",
    sessionId: plan.sessionId,
    sessionPlan: planDescriptor,
    checkedAt: outputCheckedAt,
    validUntil: "2030-01-01T00:10:00.000Z",
    root: physicalDirectory(outputRootPath, 3001, outputCheckedAt, {mode: "0700"}),
    pathBoundary: {
      projectRoot: physicalDirectory(PROJECT_ROOT, 3002, outputCheckedAt, {device: "502"}),
      sourceAssetsRoot: physicalDirectory(`${PROJECT_ROOT}/source-assets`, 3003, outputCheckedAt,
        {device: "502"}),
      workRoot: physicalDirectory(`${PROJECT_ROOT}/work`, 3004, outputCheckedAt, {device: "502"}),
      captureKitRoot: physicalDirectory(captureKitRoot, 3005, outputCheckedAt, {device: "502"}),
      stagedRoot: {
        ...structuredClone(environment.hostTree.root),
        observedAt: outputCheckedAt,
      },
    },
    initialState: {exists: true, empty: true, entryCount: 0},
    writePolicy: {
      scope: outputRootPath,
      appendOnly: true,
      overwriteProhibited: true,
      temporaryFilesProhibited: true,
    },
    expectedArtifacts: {
      directories: ["frames"],
      files: [...expectedFiles],
      obligationCount: plan.captureObligationCount,
      unexpectedFilesAllowed: false,
    },
    authorityBoundary: allFalseAuthority(),
  });
  const outputRootDescriptor = descriptorForJson(
    `/var/tmp/g4-l10-v4/${plan.sessionId}/preflights/output-root.json`,
    outputRoot,
  );
  const demand = deriveCapacityDemandV4({plan, expectedArtifacts: outputRoot.expectedArtifacts});
  const freeBytesTarget = demand.requiredBytes + 1_073_741_824;
  const blockSize = 4096;
  const availableBlocks = Math.ceil(freeBytesTarget / blockSize);
  const capacityBase = {
    schemaVersion: 4,
    evidenceType: "g4-l10-root-capture-capacity-preflight-v4",
    sessionId: plan.sessionId,
    sessionPlan: planDescriptor,
    outputRootPreflight: outputRootDescriptor,
    measuredAt: capacityMeasuredAt,
    validUntil: "2030-01-01T00:05:20.000Z",
    measurement: {
      path: outputRootPath,
      realPath: outputRootPath,
      device: outputRoot.root.device,
      mountId: outputRoot.root.mountId,
      blockSize,
      availableBlocks,
      freeBytes: blockSize * availableBlocks,
    },
    demand,
    result: {calculationSha256: ZERO_SHA, admitted: true, marginBytes: 0},
    authorityBoundary: allFalseAuthority(),
  };
  capacityBase.result.calculationSha256 = capacityCalculationSha256(capacityBase);
  capacityBase.result.marginBytes = capacityBase.measurement.freeBytes - demand.requiredBytes;
  const capacity = finalizedReceipt(capacityBase);
  const capacityDescriptor = descriptorForJson(
    `/var/tmp/g4-l10-v4/${plan.sessionId}/preflights/capacity.json`,
    capacity,
  );
  const preflightDescriptors = {
    environment: environmentDescriptor,
    outputRoot: outputRootDescriptor,
    capacity: capacityDescriptor,
  };
  const nonce = "0123456789abcdef0123456789abcdef";
  const nonceSha256 = sha256Text(nonce);
  const startInstanceId = "123e4567-e89b-42d3-a456-426614175000";
  const binding = runnerBinding(plan, environment);
  const preLaunchStartIdentity = expectedPreLaunchStartIdentity({
    plan,
    binding,
    startInstanceId,
    nonceSha256,
  });
  const transitionPath = `${replayRootPath}/${nonceSha256}.started-${startInstanceId}.json`;
  const transitionReceiptPath = `${replayRootPath}/${nonceSha256}.transition-receipt.json`;
  const tokenPreimage = contentDescriptor(
    `${replayRootPath}/${nonceSha256}.unconsumed.json`,
    launchReplayTokenBytes({
      sessionId: plan.sessionId,
      nonceSha256,
      startInstanceId,
      preLaunchStartIdentitySha256: preLaunchStartIdentity,
      transitionPath,
    }),
  );
  const tokenPreimagePhysical = physicalFileEvidence(tokenPreimage, 4001, launchObservedAt);
  const replayTokenForObservation = {
    preimage: tokenPreimage,
    preimagePhysical: tokenPreimagePhysical,
    transitionPath,
  };
  const tokenObservation = contentDescriptor(
    `${replayRootPath}/${nonceSha256}.observation.json`,
    launchReplayObservationBytes({
      sessionId: plan.sessionId,
      observedAt: launchObservedAt,
      replayToken: replayTokenForObservation,
    }),
  );
  const launchIntent = finalizedReceipt({
    schemaVersion: 4,
    evidenceType: "g4-l10-unconsumed-launch-intent-v4",
    sessionId: plan.sessionId,
    sessionPlan: planDescriptor,
    environmentPreflight: environmentDescriptor,
    runner: binding,
    startInstanceId,
    nonceSha256,
    preLaunchStartIdentitySha256: preLaunchStartIdentity,
    observedAt: launchObservedAt,
    validUntil: "2030-01-01T00:05:30.000Z",
    replayToken: {
      state: `unconsumed/${nonceSha256}`,
      preimage: tokenPreimage,
      preimagePhysical: tokenPreimagePhysical,
      observationReceipt: tokenObservation,
      observationReceiptPhysical: physicalFileEvidence(tokenObservation, 4002, launchObservedAt),
      replayLockPath: `${replayRootPath}/${nonceSha256}.lock.json`,
      transitionPath,
      transitionReceiptPath,
      noStartedTransitionPresent: true,
      statefulFilesystemObservationRequired: true,
    },
    authorityBoundary: allFalseAuthority(),
  });
  const launchIntentDescriptor = descriptorForJson(
    `/var/tmp/g4-l10-v4/${plan.sessionId}/launch-intent.json`,
    launchIntent,
  );
  const operator = {
    kind: "named-human",
    fullName: "Fixture Named Operator",
    roleId: "authorized-original-runtime-operator",
    externalSubjectId: "fixture:named-operator-001",
    org: "Fixture Evidence Lab",
    contact: "operator@example.invalid",
    allowedActions: [...G4_L10_ROOT_CAPTURE_V4_CONSTANTS.allowedHumanOperationIds],
    publicKeySpkiBase64: spkiBase64(operatorKeys.publicKey),
    publicKeySha256: spkiSha256(operatorKeys.publicKey),
    identitySha256: ZERO_SHA,
  };
  operator.identitySha256 = operatorIdentitySha256(operator);
  const ownerPublicKeySha256 = spkiSha256(ownerKeys.publicKey);
  const authorizationUnsigned = {
    schemaVersion: 4,
    evidenceType: "g4-l10-named-operator-session-authorization-v4",
    decision: "authorize-once",
    session: {
      sessionId: plan.sessionId,
      issuedAt: "2030-01-01T00:01:00.000Z",
      notBefore: "2030-01-01T00:01:00.000Z",
      expiresAt: "2030-01-01T00:06:00.000Z",
      ttlSeconds: 300,
      nonce,
      oneTimeUseRequired: true,
    },
    sessionPlan: planDescriptor,
    identity: {
      releaseId: plan.releaseId,
      animationId: plan.animationId,
      requirementId: plan.requirementId,
      ...plan.identity,
    },
    operator,
    authorizer: {
      roleId: "owner",
      subjectId: "fixture:owner-001",
      publicKeySha256: ownerPublicKeySha256,
    },
    preflights: preflightDescriptors,
    runner: binding,
    launchIntent: launchIntentDescriptor,
    operationPolicy: structuredClone(plan.operationPolicy),
    action: {actionId: "projector.root-capture-natural-trace"},
    stopConditions: [...plan.stopConditions],
    stopConditionSetSha256: plan.stopConditionSetSha256,
    authorityBoundary: allFalseAuthority(),
    signature: {
      algorithm: "Ed25519",
      signerRole: "owner",
      signerSubjectId: "fixture:owner-001",
      publicKeySha256: ownerPublicKeySha256,
      signatureBase64: "pending",
    },
  };
  const authorization = signAuthorization(authorizationUnsigned, ownerKeys.privateKey);
  const authorizationDescriptor = descriptorForJson(
    `/var/tmp/g4-l10-v4/${plan.sessionId}/authorization.json`,
    authorization,
  );
  const readinessDescriptors = {
    authorization: authorizationDescriptor,
    ...preflightDescriptors,
  };
  const preLaunchBinding = preLaunchAdmissionBindingSha256({
    plan,
    environmentPreflight: environment,
    outputRootPreflight: outputRoot,
    capacityPreflight: capacity,
    authorization,
    launchIntent,
    ownerPublicKey: ownerKeys.publicKey,
  });
  const runnerProcess = {
    pid: 12001,
    processStartTokenSha256: sha256Text("runner-process-start-token-001"),
    executablePath: plan.runner.executable.file,
    executableSha256: plan.runner.executable.sha256,
    startedAt: runnerStartedAt,
    toolId: plan.runner.toolId,
    toolVersion: plan.runner.toolVersion,
  };
  const projectorProcess = {
    pid: 12345,
    processStartTokenSha256: sha256Text("projector-process-start-token-001"),
    executablePath: plan.runtime.executable.file,
    executableSha256: plan.runtime.executable.sha256,
    startedAt,
    parentPid: runnerProcess.pid,
  };
  const replayLockDescriptor = contentDescriptor(
    launchIntent.replayToken.replayLockPath,
    canonicalJson({sessionId: plan.sessionId, nonceSha256, startInstanceId}),
  );
  const replayLockPhysical = physicalFileEvidence(replayLockDescriptor, 5001, startedAt);
  const transitionVerifiedAt = "2030-01-01T00:02:10.001Z";
  const startedToken = contentDescriptor(
    launchIntent.replayToken.transitionPath,
    launchReplayTokenBytes({
      sessionId: plan.sessionId,
      nonceSha256,
      startInstanceId,
      preLaunchStartIdentitySha256: launchIntent.preLaunchStartIdentitySha256,
      transitionPath: launchIntent.replayToken.transitionPath,
    }),
  );
  const startedTokenPhysical = physicalFileEvidence(
    startedToken,
    launchIntent.replayToken.preimagePhysical.inode,
    transitionVerifiedAt,
  );
  const preimagePostObservation = {
    path: launchIntent.replayToken.preimage.file,
    observedAt: transitionVerifiedAt,
    exists: false,
    symlink: false,
    lstatError: "ENOENT",
  };
  const replayLockRetainedPhysical = {
    ...structuredClone(replayLockPhysical),
    observedAt: transitionVerifiedAt,
  };
  const transitionRecord = {
    protocol: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.tokenTransitionProtocol,
    atomicPrimitive: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.tokenTransitionAtomicPrimitives[0],
    fromState: `unconsumed/${nonceSha256}`,
    toState: `started/${startInstanceId}`,
    preimageSha256: launchIntent.replayToken.preimage.sha256,
    startedToken,
    startedTokenPhysical,
    preimagePostObservation,
    replayLockRetainedPhysical,
    authorizationSha256: authorizationDescriptor.sha256,
    launchIntentSha256: launchIntentDescriptor.sha256,
    preLaunchAdmissionBindingSha256: preLaunchBinding,
    startInstanceId,
    transitionedAt: startedAt,
    verifiedAt: transitionVerifiedAt,
    runner: binding,
    lockDevice: "501",
    lockInode: "5001",
    runnerProcess,
    projectorProcess,
    durableFsync: true,
    irreversible: true,
  };
  const transitionReceipt = contentDescriptor(
    launchIntent.replayToken.transitionReceiptPath,
    tokenTransitionReceiptBytes({sessionId: plan.sessionId, nonceSha256, transition: transitionRecord}),
  );
  const statefulFilesystemVerifierBase = {
    runner: binding,
    verifiedAt: transitionVerifiedAt,
    lockDevice: "501",
    lockInode: "5001",
    transitionReceipt,
    startedToken,
    startedTokenPhysical,
    preimagePostObservation,
    replayLockRetainedPhysical,
  };
  const statefulVerificationReceipt = contentDescriptor(
    `${replayRootPath}/${nonceSha256}.stateful-verification.json`,
    statefulFilesystemVerificationReceiptBytes({
      sessionId: plan.sessionId,
      nonceSha256,
      statefulFilesystemVerifier: statefulFilesystemVerifierBase,
    }),
  );
  const statefulVerificationReceiptPhysical = physicalFileEvidence(
    statefulVerificationReceipt,
    5003,
    transitionVerifiedAt,
  );
  const consumptionBase = {
    schemaVersion: 4,
    evidenceType: "g4-l10-authorization-consumption-receipt-v4",
    sessionId: plan.sessionId,
    authorization: authorizationDescriptor,
    nonceSha256,
    consumedAt: startedAt,
    launchIntent: launchIntentDescriptor,
    preLaunchAdmissionBindingSha256: preLaunchBinding,
    replayLock: {
      descriptor: replayLockDescriptor,
      physical: replayLockPhysical,
      atomicPrimitive: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.replayLockAtomicPrimitives[0],
      createdExclusively: true,
      preexisting: false,
      readOnly: true,
      nonceSha256,
      sessionId: plan.sessionId,
      lockDevice: "501",
      lockInode: "5001",
    },
    transition: {
      protocol: transitionRecord.protocol,
      atomicPrimitive: transitionRecord.atomicPrimitive,
      fromState: transitionRecord.fromState,
      toState: transitionRecord.toState,
      preimageSha256: transitionRecord.preimageSha256,
      startedToken,
      startedTokenPhysical,
      preimagePostObservation,
      replayLockRetainedPhysical,
      authorizationSha256: transitionRecord.authorizationSha256,
      launchIntentSha256: transitionRecord.launchIntentSha256,
      preLaunchAdmissionBindingSha256: transitionRecord.preLaunchAdmissionBindingSha256,
      startInstanceId,
      transitionedAt: startedAt,
      verifiedAt: transitionVerifiedAt,
      runner: binding,
      lockDevice: "501",
      lockInode: "5001",
      runnerProcess,
      projectorProcess,
      durableFsync: true,
      irreversible: true,
      receipt: transitionReceipt,
      receiptPhysical: physicalFileEvidence(transitionReceipt, 5002, transitionVerifiedAt),
    },
    runnerProcess,
    projectorProcess,
    statefulFilesystemVerifier: {
      ...statefulFilesystemVerifierBase,
      verificationReceipt: statefulVerificationReceipt,
      verificationReceiptPhysical: statefulVerificationReceiptPhysical,
    },
    statefulFilesystemVerificationPassed: true,
    startIdentitySha256: ZERO_SHA,
    runtimeLaunched: true,
    authorityBoundary: allFalseAuthority(),
  };
  consumptionBase.startIdentitySha256 = expectedStartIdentity({
    plan,
    authorization,
    authorizationDescriptor,
    nonceSha256,
    launchIntent,
    preLaunchAdmissionBinding: preLaunchBinding,
    runnerProcess,
    projectorProcess,
  });
  const consumption = finalizedReceipt(consumptionBase);
  const consumptionDescriptor = descriptorForJson(
    `/var/tmp/g4-l10-v4/${plan.sessionId}/authorization-consumption.json`,
    consumption,
  );
  const authorizedStart = finalizedReceipt({
    schemaVersion: 4,
    evidenceType: "g4-l10-authorized-empty-projector-start-v4",
    sessionId: plan.sessionId,
    sessionPlan: planDescriptor,
    preLaunchAdmissionBindingSha256: preLaunchBinding,
    launchIntent: launchIntentDescriptor,
    runner: binding,
    runnerPhysical: environment.physicalBindings.runnerExecutable,
    readiness: readinessDescriptors,
    authorizationConsumption: consumptionDescriptor,
    runtime: structuredClone(plan.runtime),
    sandbox: environment.sandbox.policy,
    profile: {
      manifest: environment.profile.manifest,
      rootPhysical: environment.profile.sessionRoot,
      initialTreeSetSha256: environment.profile.initialTreeSetSha256,
    },
    outputRoot: structuredClone(outputRoot.root),
    observers: structuredClone(environment.observers),
    transitionReceipt,
    statefulFilesystemVerifierReceipt: statefulVerificationReceipt,
    runnerProcess,
    projectorProcess,
    startInstanceId,
    startIdentitySha256: consumption.startIdentitySha256,
    startedAt,
    argvSwf: null,
    authorityBoundary: allFalseAuthority(),
  });
  const authorizedStartDescriptor = descriptorForJson(
    `/var/tmp/g4-l10-v4/${plan.sessionId}/authorized-projector-start.json`,
    authorizedStart,
  );
  const guiPayload = {
    schemaVersion: 4,
    protocol: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.guiObserverEventProtocol,
    observerId: environment.observers.gui.observerId,
    sessionId: plan.sessionId,
    startInstanceId,
    processId: projectorProcess.pid,
    processStartTokenSha256: projectorProcess.processStartTokenSha256,
    operatorIdentitySha256: operator.identitySha256,
    actionId: "projector.file-open-exact-staged-source",
    menuPath: [...G4_L10_ROOT_CAPTURE_V4_CONSTANTS.sourceOpenMenuPath],
    selectedSource: plan.stagedSource.file,
    observedAt: "2030-01-01T00:02:20.000Z",
    eventSequence: 1,
  };
  const guiSignature = detachedSignature(
    guiObserverEventSigningBytes(guiPayload),
    guiKeys.privateKey,
    guiPublicKeySha256,
  );
  const guiObserverEvent = {
    descriptor: contentDescriptor(
      guiSourceOpenEventPath,
      canonicalJson({payload: guiPayload, signature: guiSignature}),
    ),
    payload: guiPayload,
    signature: guiSignature,
  };
  const captureStartPayload = {
    schemaVersion: 4,
    protocol: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.captureMarkerProtocol,
    markerType: "capture-start",
    sessionId: plan.sessionId,
    startInstanceId,
    processId: projectorProcess.pid,
    processStartTokenSha256: projectorProcess.processStartTokenSha256,
    operatorIdentitySha256: operator.identitySha256,
    markedAt: "2030-01-01T00:02:21.000Z",
    sequence: 1,
  };
  const firstFramePayload = {
    ...structuredClone(captureStartPayload),
    markerType: "first-frame",
    markedAt: "2030-01-01T00:02:22.000Z",
    sequence: 2,
  };
  const captureStartMarker = {
    descriptor: contentDescriptor(
      `${outputRootPath}/capture-start-marker.json`,
      canonicalJson(captureStartPayload),
    ),
    payload: captureStartPayload,
  };
  const firstFrameMarker = {
    descriptor: contentDescriptor(
      `${outputRootPath}/first-frame-marker.json`,
      canonicalJson(firstFramePayload),
    ),
    payload: firstFramePayload,
  };
  const sourceOpenBase = {
    schemaVersion: 4,
    evidenceType: "named-human-hash-bound-root-source-open-start-receipt-v4",
    sessionId: plan.sessionId,
    animationId: plan.animationId,
    requirementId: plan.requirementId,
    captureKit: plan.captureKit,
    kitCheck: plan.kitCheck,
    sessionPlan: planDescriptor,
    runtime: structuredClone(plan.runtime),
    readiness: readinessDescriptors,
    preLaunchAdmissionBindingSha256: preLaunchBinding,
    launchIntent: launchIntentDescriptor,
    authorizationConsumption: consumptionDescriptor,
    authorizedProjectorStart: authorizedStartDescriptor,
    launchProtocol: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.launchProtocol,
    projectorStart: {
      startInstanceId,
      startIdentitySha256: consumption.startIdentitySha256,
      executablePath: plan.runtime.executable.file,
      swfArgument: null,
      processId: projectorProcess.pid,
      processStartTokenSha256: projectorProcess.processStartTokenSha256,
      runnerProcessId: runnerProcess.pid,
      runnerProcessStartTokenSha256: runnerProcess.processStartTokenSha256,
      startedAt,
    },
    sourceOpen: {
      actionId: "projector.file-open-exact-staged-source",
      method: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.sourceOpenMethod,
      menuPath: [...G4_L10_ROOT_CAPTURE_V4_CONSTANTS.sourceOpenMenuPath],
      selectedSource: plan.stagedSource.file,
      openedAt: guiPayload.observedAt,
      playerWindowObserved: true,
    },
    guiObserverEvent,
    captureStartMarker,
    firstFrameMarker,
    operator: structuredClone(operator),
    operatorProof: {
      protocol: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.sourceOpenOperatorSigningProtocol,
      signedAt: "2030-01-01T00:02:23.000Z",
      signature: {
        algorithm: "Ed25519",
        publicKeySha256: operator.publicKeySha256,
        signatureBase64: "pending",
      },
    },
    finalizedAt: "2030-01-01T00:02:30.000Z",
    authorityBoundary: allFalseAuthority(),
    statement: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.sourceOpenStatement,
  };
  sourceOpenBase.operatorProof.signature.signatureBase64 = sign(
    null,
    operatorSourceOpenSigningBytes(sourceOpenBase),
    operatorKeys.privateKey,
  ).toString("base64");
  const sourceOpen = finalizedReceipt(sourceOpenBase);
  const sourceOpenDescriptor = descriptorForJson(
    `/var/tmp/g4-l10-v4/${plan.sessionId}/source-open-start.json`,
    sourceOpen,
  );
  const projectorExitRequestedAt = "2030-01-01T00:03:00.000Z";
  const projectorExitPayload = {
    schemaVersion: 4,
    protocol: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.projectorExitOperatorSigningProtocol,
    actionId: "projector.exit",
    method: "projector-window-close-control",
    sessionId: plan.sessionId,
    startInstanceId,
    processId: projectorProcess.pid,
    processStartTokenSha256: projectorProcess.processStartTokenSha256,
    operatorIdentitySha256: operator.identitySha256,
    requestedAt: projectorExitRequestedAt,
  };
  const projectorExitOperatorSignature = detachedSignature(
    operatorProjectorExitSigningBytes(projectorExitPayload),
    operatorKeys.privateKey,
    operator.publicKeySha256,
  );
  const projectorExitGuiPayload = {
    schemaVersion: 4,
    protocol: G4_L10_ROOT_CAPTURE_V4_CONSTANTS.guiObserverEventProtocol,
    observerId: environment.observers.gui.observerId,
    eventType: "projector-exit-request",
    actionId: "projector.exit",
    sessionId: plan.sessionId,
    startInstanceId,
    processId: projectorProcess.pid,
    processStartTokenSha256: projectorProcess.processStartTokenSha256,
    operatorIdentitySha256: operator.identitySha256,
    observedAt: projectorExitRequestedAt,
    eventSequence: 2,
  };
  const projectorExitGuiEvent = {
    payload: projectorExitGuiPayload,
    signature: detachedSignature(
      guiObserverEventSigningBytes(projectorExitGuiPayload),
      guiKeys.privateKey,
      guiPublicKeySha256,
    ),
  };
  const projectorExitTerminationEvidence = {
    type: "named-human-projector-exit-v4",
    operator: structuredClone(operator),
    payload: projectorExitPayload,
    operatorSignature: projectorExitOperatorSignature,
    guiObserverEvent: projectorExitGuiEvent,
  };
  const guiObserverSessionReceipt = contentDescriptor(
    observerPaths.gui,
    guiObserverSessionReceiptBytes({
      sourceOpenEvent: guiObserverEvent,
      projectorExitEvent: projectorExitGuiEvent,
    }),
  );
  const projectorExitedAt = "2030-01-01T00:03:05.000Z";
  const processAuditBase = {
    processObserverReceipt: {file: "pending", bytes: 1, sha256: ZERO_SHA},
    runnerProcess,
    projectorProcess,
    startInstanceId,
    startIdentitySha256: consumption.startIdentitySha256,
    runnerStartEventCount: 1,
    projectorStartEventCount: 1,
    matchingProjectorStartEventCount: 1,
    duplicateProjectorStartEventCount: 0,
    unexpectedRuntimeStartEventCount: 0,
    projectorExitEventCount: 1,
    exitEvent: {
      processId: projectorProcess.pid,
      processStartTokenSha256: projectorProcess.processStartTokenSha256,
      requestedAt: projectorExitRequestedAt,
      exitedAt: projectorExitedAt,
      exitCode: 0,
      signal: null,
    },
    passed: true,
  };
  const processObserverReceipt = contentDescriptor(
    observerPaths.process,
    processObserverSessionReceiptBytes(processAuditBase),
  );
  processAuditBase.processObserverReceipt = processObserverReceipt;
  const sessionObserverReceipts = {
    network: contentDescriptor(observerPaths.network, "network observer session passed\n"),
    requests: contentDescriptor(observerPaths.requests, "request observer session passed\n"),
    process: processObserverReceipt,
    windows: contentDescriptor(observerPaths.windows, "window observer session passed\n"),
    effects: contentDescriptor(observerPaths.effects, "effect observer session passed\n"),
    audio: contentDescriptor(observerPaths.audio, "audio observer session passed\n"),
    gui: guiObserverSessionReceipt,
  };
  const discardedAt = "2030-01-01T00:03:30.000Z";
  const completedAt = "2030-01-01T00:04:00.000Z";
  const profileIdentity = sha256Text(canonicalJson({
    profileManifestSha256: environment.profile.manifest.sha256,
    profileRootPhysicalSha256: physicalIdentitySha256(environment.profile.sessionRoot),
    initialTreeSetSha256: environment.profile.initialTreeSetSha256,
  }));
  const sharedObjectDispositionBase = {
    profileManifest: environment.profile.manifest,
    profileRootPhysical: environment.profile.sessionRoot,
    preDiscardProfileRootPhysical: {
      ...structuredClone(environment.profile.sessionRoot),
      observedAt: "2030-01-01T00:03:10.000Z",
    },
    profileIdentitySha256: profileIdentity,
    initialTreeSetSha256: environment.profile.initialTreeSetSha256,
    preexistingCount: 0,
    remainingCount: 0,
    persistentSharedObjectObserved: false,
    deletedByOperator: false,
    profileDiscarded: true,
    discardedAt,
    discardReceipt: {file: "pending", bytes: 1, sha256: ZERO_SHA},
    discardReceiptPhysical: null,
    postDiscardTreeEntryCount: 0,
    postDiscardTreeSetSha256: sha256Text(canonicalJson([])),
    remainingProfilePathCount: 0,
    passed: true,
  };
  const profileDiscardReceipt = contentDescriptor(
    `/var/tmp/g4-l10-v4/${plan.sessionId}/postflight/profile-discard.json`,
    profileDiscardReceiptBytes(sharedObjectDispositionBase),
  );
  sharedObjectDispositionBase.discardReceipt = profileDiscardReceipt;
  sharedObjectDispositionBase.discardReceiptPhysical = physicalFileEvidence(
    profileDiscardReceipt,
    6001,
    discardedAt,
  );
  const outputDescriptors = Object.fromEntries(expectedFiles.map((relativePath) => [
    relativePath,
    contentDescriptor(`${outputRootPath}/${relativePath}`, `fixture output ${relativePath}\n`),
  ]));
  for (const descriptor of [
    ...Object.values(sessionObserverReceipts),
    guiObserverEvent.descriptor,
    captureStartMarker.descriptor,
    firstFrameMarker.descriptor,
  ]) {
    const relativePath = descriptor.file.slice(outputRootPath.length + 1);
    outputDescriptors[relativePath] = descriptor;
  }
  const manifestRelativePath = G4_L10_ROOT_CAPTURE_V4_CONSTANTS.sessionOutputManifestRelativePath;
  const nonRecursivePayloadFiles = expectedFiles.filter((relativePath) =>
    relativePath !== manifestRelativePath);
  const outputEntries = nonRecursivePayloadFiles.map((relativePath) => ({
    path: relativePath,
    bytes: outputDescriptors[relativePath].bytes,
    sha256: outputDescriptors[relativePath].sha256,
  }));
  const outputDirectories = [...outputRoot.expectedArtifacts.directories];
  const completeRootEntries = [
    ...outputDirectories.map((entryPath) => ({path: entryPath, type: "directory"})),
    ...expectedFiles.map((entryPath) => ({path: entryPath, type: "ordinary-file"})),
  ].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1
    : left.type < right.type ? -1 : left.type > right.type ? 1 : 0);
  const sessionOutputManifestBase = {
    descriptor: {file: "pending", bytes: 1, sha256: ZERO_SHA},
    physical: null,
    outputRootRealPath: outputRootPath,
    selfRelativePath: manifestRelativePath,
    selfExcludedFromEntries: true,
    directories: outputDirectories,
    directoryPhysicalEntries: outputDirectories.map((directory, index) => physicalDirectory(
      `${outputRootPath}/${directory}`,
      6003 + index,
      completedAt,
      {mode: "0700"},
    )),
    directoryCount: outputDirectories.length,
    entries: outputEntries,
    entryCount: outputEntries.length,
    rootFileCount: expectedFiles.length,
    rootPathSetSha256: sha256Text(canonicalJson(expectedFiles)),
    rootEntryCount: completeRootEntries.length,
    rootEntrySetSha256: sha256Text(canonicalJson(completeRootEntries)),
    specialEntryCount: 0,
    symlinkEntryCount: 0,
    rootEnumerationComplete: true,
    totalBytes: outputEntries.reduce((sum, entry) => sum + entry.bytes, 0),
    entrySetSha256: sessionOutputEntrySetSha256(outputEntries),
    entrySetDescriptor: contentDescriptor(
      "virtual/g4-l10-session-output-entry-set.json",
      canonicalJson(outputEntries),
    ),
    unexpectedFileCount: 0,
    complete: true,
  };
  const sessionOutputManifestDescriptor = contentDescriptor(
    `${outputRootPath}/session-output-manifest.json`,
    sessionOutputManifestBytes(sessionOutputManifestBase),
  );
  sessionOutputManifestBase.descriptor = sessionOutputManifestDescriptor;
  sessionOutputManifestBase.physical = physicalFileEvidence(
    sessionOutputManifestDescriptor,
    6002,
    completedAt,
  );
  const postflightBase = {
    schemaVersion: 4,
    evidenceType: "g4-l10-root-capture-containment-postflight-v4",
    sessionId: plan.sessionId,
    sessionPlan: planDescriptor,
    preLaunchAdmissionBindingSha256: preLaunchBinding,
    launchIntent: launchIntentDescriptor,
    authorizationConsumption: consumptionDescriptor,
    authorizedProjectorStart: authorizedStartDescriptor,
    sourceOpenStartReceipt: sourceOpenDescriptor,
    completedAt,
    outputRootFinalPhysical: {
      ...structuredClone(outputRoot.root),
      observedAt: completedAt,
    },
    projectorExit: {
      startInstanceId,
      processId: projectorProcess.pid,
      processStartTokenSha256: projectorProcess.processStartTokenSha256,
      requestedAt: projectorExitRequestedAt,
      exitedAt: projectorExitedAt,
      terminationMethod: "named-operator-projector-exit",
      terminationEvidence: projectorExitTerminationEvidence,
      exitCode: 0,
      signal: null,
      processObserverReceipt: sessionObserverReceipts.process,
      descendantProcessCountAtStart: 0,
      remainingDescendantProcessCount: 0,
      unexpectedChildProcessCount: 0,
      exitObserved: true,
      remainingMatchingProcessCount: 0,
    },
    processAudit: processAuditBase,
    requestAudit: {
      networkObserverReceipt: sessionObserverReceipts.network,
      requestObserverReceipt: sessionObserverReceipts.requests,
      unexpectedRequestCount: 0,
      successfulNetworkRequestCount: 0,
      legacyEndpointExecutionCount: 0,
      webSocketAttemptCount: 0,
      passed: true,
    },
    effectAudit: {
      windowObserverReceipt: sessionObserverReceipts.windows,
      effectObserverReceipt: sessionObserverReceipts.effects,
      audioObserverReceipt: sessionObserverReceipts.audio,
      dialogs: 0,
      popups: 0,
      downloads: 0,
      hostCommands: 0,
      unexpectedFileWrites: 0,
      unexpectedAudioDeviceEffectCount: 0,
      passed: true,
    },
    guiAudit: {
      guiObserverReceipt: sessionObserverReceipts.gui,
      authenticatedEventCount: 2,
      unexpectedGuiEventCount: 0,
      passed: true,
    },
    sharedObjectDisposition: sharedObjectDispositionBase,
    sessionOutputManifest: sessionOutputManifestBase,
    rehash: {
      sessionPlan: planDescriptor,
      captureKit: plan.captureKit,
      kitCheck: plan.kitCheck,
      traceSpec: plan.traceSpec,
      traceSpecIndex: plan.traceSpecIndex,
      sourceSwf: plan.sourceSwf,
      stagedSource: plan.stagedSource,
      runtimeExecutable: plan.runtime.executable,
      runnerExecutable: plan.runner.executable,
      hostTreeManifest: environment.hostTree.manifest,
      profileManifest: environment.profile.manifest,
      sandboxPolicy: environment.sandbox.policy,
      environmentPreflight: environmentDescriptor,
      outputRootPreflight: outputRootDescriptor,
      capacityPreflight: capacityDescriptor,
      authorization: authorizationDescriptor,
      launchIntent: launchIntentDescriptor,
      authorizationConsumption: consumptionDescriptor,
      authorizedProjectorStart: authorizedStartDescriptor,
      sourceOpenStartReceipt: sourceOpenDescriptor,
      processInventory: environment.processAbsence.inventoryReceipt,
      networkObserverReceipt: sessionObserverReceipts.network,
      requestObserverReceipt: sessionObserverReceipts.requests,
      processObserverReceipt: sessionObserverReceipts.process,
      windowObserverReceipt: sessionObserverReceipts.windows,
      effectObserverReceipt: sessionObserverReceipts.effects,
      audioObserverReceipt: sessionObserverReceipts.audio,
      guiObserverReceipt: sessionObserverReceipts.gui,
      profileDiscardReceipt,
      statefulFilesystemVerifierReceipt: statefulVerificationReceipt,
      replayLock: replayLockDescriptor,
      transitionReceipt,
      guiObserverEvent: guiObserverEvent.descriptor,
      captureStartMarker: captureStartMarker.descriptor,
      firstFrameMarker: firstFrameMarker.descriptor,
      sessionOutputManifest: sessionOutputManifestDescriptor,
      sessionOutputEntrySet: sessionOutputManifestBase.entrySetDescriptor,
    },
    authorityBoundary: allFalseAuthority(),
  };
  const postflight = finalizedReceipt(postflightBase);
  return {
    plan,
    planDescriptor,
    environment,
    environmentDescriptor,
    outputRoot,
    outputRootDescriptor,
    capacity,
    capacityDescriptor,
    preflightDescriptors,
    launchIntent,
    launchIntentDescriptor,
    authorizationUnsigned,
    authorization,
    authorizationDescriptor,
    readinessDescriptors,
    preLaunchBinding,
    consumption,
    consumptionDescriptor,
    authorizedStart,
    authorizedStartDescriptor,
    sourceOpen,
    sourceOpenDescriptor,
    postflight,
    ownerKeys,
    operatorKeys,
    guiKeys,
  };
}

function preLaunchInput(value) {
  return {
    plan: value.plan,
    environmentPreflight: value.environment,
    outputRootPreflight: value.outputRoot,
    capacityPreflight: value.capacity,
    authorization: value.authorization,
    launchIntent: value.launchIntent,
    ownerPublicKey: value.ownerKeys.publicKey,
    nowMs: Date.parse(value.authorizedStart.startedAt),
  };
}

function fullChainInput(value) {
  return {
    ...preLaunchInput(value),
    authorizationConsumption: value.consumption,
    authorizedProjectorStart: value.authorizedStart,
    sourceOpenStartReceipt: value.sourceOpen,
    containmentPostflight: value.postflight,
    nowMs: NOW,
  };
}

function fullOptions(value) {
  return {
    plan: value.plan,
    planDescriptor: value.planDescriptor,
    nowMs: Date.parse(value.authorizedStart.startedAt),
  };
}

function validateShapeFixture(value) {
  const common = fullOptions(value);
  const results = [
    validateSessionPlanShapeOnly(value.plan),
    validateEnvironmentPreflightShapeOnly(value.environment, common),
    validateOutputRootPreflightShapeOnly(value.outputRoot, common),
    validateCapacityPreflightShapeOnly(value.capacity, {
      ...common,
      outputRootPreflight: value.outputRoot,
      outputRootPreflightDescriptor: value.outputRootDescriptor,
    }),
    validateLaunchIntentShapeOnly(value.launchIntent, {
      ...common,
      environmentPreflight: value.environment,
      environmentPreflightDescriptor: value.environmentDescriptor,
    }),
    validateNamedOperatorAuthorizationShapeOnly(value.authorization, {
      ...common,
      ownerPublicKey: value.ownerKeys.publicKey,
      preflightDescriptors: value.preflightDescriptors,
      environmentPreflight: value.environment,
      launchIntent: value.launchIntent,
      launchIntentDescriptor: value.launchIntentDescriptor,
    }),
    validateAuthorizationConsumptionShapeOnly(value.consumption, {
      ...common,
      authorization: value.authorization,
      authorizationDescriptor: value.authorizationDescriptor,
      ownerPublicKey: value.ownerKeys.publicKey,
      preflightDescriptors: value.preflightDescriptors,
      environmentPreflight: value.environment,
      launchIntent: value.launchIntent,
      launchIntentDescriptor: value.launchIntentDescriptor,
      preLaunchAdmissionBindingSha256: value.preLaunchBinding,
    }),
    validateAuthorizedProjectorStartShapeOnly(value.authorizedStart, {
      ...common,
      readinessDescriptors: value.readinessDescriptors,
      authorization: value.authorization,
      authorizationConsumption: value.consumption,
      authorizationConsumptionDescriptor: value.consumptionDescriptor,
      environmentPreflight: value.environment,
      outputRootPreflight: value.outputRoot,
      capacityPreflight: value.capacity,
      launchIntent: value.launchIntent,
      preLaunchAdmissionBindingSha256: value.preLaunchBinding,
    }),
    validateSourceOpenStartReceiptV4ShapeOnly(value.sourceOpen, {
      ...common,
      readinessDescriptors: value.readinessDescriptors,
      authorization: value.authorization,
      authorizationConsumption: value.consumption,
      authorizationConsumptionDescriptor: value.consumptionDescriptor,
      authorizedProjectorStart: value.authorizedStart,
      authorizedProjectorStartDescriptor: value.authorizedStartDescriptor,
      environmentPreflight: value.environment,
      launchIntent: value.launchIntent,
      preLaunchAdmissionBindingSha256: value.preLaunchBinding,
    }),
    validateContainmentPostflightShapeOnly(value.postflight, {
      ...common,
      preLaunchAdmissionBindingSha256: value.preLaunchBinding,
      environmentPreflight: value.environment,
      outputRootPreflight: value.outputRoot,
      capacityPreflight: value.capacity,
      authorization: value.authorization,
      launchIntent: value.launchIntent,
      launchIntentDescriptor: value.launchIntentDescriptor,
      authorizationConsumption: value.consumption,
      authorizationConsumptionDescriptor: value.consumptionDescriptor,
      authorizedProjectorStart: value.authorizedStart,
      authorizedProjectorStartDescriptor: value.authorizedStartDescriptor,
      sourceOpenStartReceipt: value.sourceOpen,
      sourceOpenStartReceiptDescriptor: value.sourceOpenDescriptor,
    }),
  ];
  for (const result of results) {
    assert.equal(result.validationClass, "shape-only-non-admitting");
    assert.equal(result.shapeValid, true);
    assert.equal(result.launchAdmission, false);
    assert.equal(result.authorityEffect, "none");
    assert.equal(result.statefulFilesystemVerificationRequired, true);
  }
}

function assertTrustAnchorClosed(callback) {
  assert.throws(callback, (error) => {
    assert.equal(error.code, G4_L10_ROOT_CAPTURE_V4_CONSTANTS.ownerTrustAnchorNotConfiguredCode);
    return true;
  });
}

function assertFailsBeforeTrustGate(callback, pattern) {
  assert.throws(callback, (error) => {
    assert.notEqual(error.code, G4_L10_ROOT_CAPTURE_V4_CONSTANTS.ownerTrustAnchorNotConfiguredCode);
    assert.match(error.message, pattern);
    return true;
  });
}

test("complete successor shape chain passes all non-admitting validators and both authority APIs fail closed at the null trust root", () => {
  const value = fixture();
  validateShapeFixture(value);
  assertTrustAnchorClosed(() => validatePreLaunchAdmissionV4(preLaunchInput(value)));
  assertTrustAnchorClosed(() => validateFullSessionChainV4(fullChainInput(value)));
});

test("argument-free preparation authority guard fails before any output root, profile, or token artifact is needed", () => {
  assert.equal(assertV4PreparationAuthorityAvailable.length, 0);
  assert.equal(
    G4_L10_ROOT_CAPTURE_V4_CONSTANTS.preparationAuthorityGuard,
    "assertV4PreparationAuthorityAvailable",
  );
  assertTrustAnchorClosed(() => assertV4PreparationAuthorityAvailable());
});

test("pre-launch admission requires only knowable pre-start documents and rejects future evidence as an extra field", () => {
  const value = fixture();
  const input = preLaunchInput(value);
  assert.deepEqual(Object.keys(input).sort(), [
    "authorization",
    "capacityPreflight",
    "environmentPreflight",
    "launchIntent",
    "nowMs",
    "outputRootPreflight",
    "ownerPublicKey",
    "plan",
  ]);
  for (const key of Object.keys(input)) {
    const omitted = {...input};
    delete omitted[key];
    assertFailsBeforeTrustGate(() => validatePreLaunchAdmissionV4(omitted), /keys drifted/u);
  }
  assertFailsBeforeTrustGate(() => validatePreLaunchAdmissionV4({
    ...input,
    futureSourceOpen: value.sourceOpen,
  }), /keys drifted/u);
});

test("full-chain validator requires every past and future document but is not itself a pre-launch admission export", () => {
  const value = fixture();
  const input = fullChainInput(value);
  for (const key of Object.keys(input)) {
    const omitted = {...input};
    delete omitted[key];
    assertFailsBeforeTrustGate(() => validateFullSessionChainV4(omitted), /keys drifted/u);
  }
  const admissionExports = Object.keys(contractApi).filter((name) => name.includes("PreLaunchAdmission"));
  assert.deepEqual(admissionExports, ["validatePreLaunchAdmissionV4"]);
  assert.equal(contractApi.validateFullSessionChainV4, validateFullSessionChainV4);
});

test("the rejected predecessor is preserved as metadata only and cannot be mistaken for this successor", () => {
  assert.deepEqual(G4_L10_ROOT_CAPTURE_V4_CONSTANTS.predecessorDraft, {
    status: "rejected-for-launch-non-admitting-predecessor",
    contract: {
      bytes: 80_604,
      sha256: "6f0ba46af9f565d1d4dd7bb5f7f379c3c753631aa1aff4532e371afcb7b0ed65",
    },
    test: {
      bytes: 52_645,
      sha256: "513a08494402a53e1ce9fb79f500d9200bd2da21a4b69a0924d44d086cfdd8c8",
    },
    testResult: "18/18",
    audit: "P0=0/P1=6/P2=2",
  });
  assert.equal(G4_L10_ROOT_CAPTURE_V4_CONSTANTS.productionOwnerTrustAnchorConfigured, false);
});

test("fixed operation policy closes set relations and excludes every save/publish/export/convert/direct-child operation", () => {
  const constants = G4_L10_ROOT_CAPTURE_V4_CONSTANTS;
  const allowed = new Set(constants.allowedHumanOperationIds);
  const forbidden = new Set(constants.forbiddenOperationIds);
  assert.equal(constants.humanOnlyOperationIds.every((value) => allowed.has(value)), true);
  assert.equal(constants.humanOnlyOperationIds.includes("projector.file-open-exact-staged-source"), true);
  assert.equal(constants.allowedHumanOperationIds.every((value) => !forbidden.has(value)), true);
  for (const actionId of [
    "projector.save-source",
    "projector.publish-source",
    "projector.export-source",
    "projector.convert-source",
    "projector.direct-child-swf-open",
  ]) {
    assert.equal(allowed.has(actionId), false);
    assert.equal(forbidden.has(actionId), true);
  }
  const value = fixture();
  assert.deepEqual(value.plan.stopConditions,
    G4_L10_ROOT_CAPTURE_V4_CONSTANTS.requiredStopConditions);
  const missingStop = structuredClone(value.plan);
  missingStop.stopConditions.pop();
  missingStop.stopConditionSetSha256 = sha256Text(canonicalJson(missingStop.stopConditions));
  missingStop.planSha256 = sessionPlanSha256(missingStop);
  assertFailsBeforeTrustGate(() => validateSessionPlanShapeOnly(missingStop),
    /stopConditions differ from the exact fixed policy/u);
  const promoted = structuredClone(value.authorizationUnsigned);
  promoted.operator.allowedActions = [...constants.allowedHumanOperationIds, "projector.save-source"].sort();
  promoted.operator.identitySha256 = operatorIdentitySha256(promoted.operator);
  const resigned = signAuthorization(promoted, value.ownerKeys.privateKey);
  assertFailsBeforeTrustGate(() => validateNamedOperatorAuthorizationShapeOnly(resigned, {
    ...fullOptions(value),
    ownerPublicKey: value.ownerKeys.publicKey,
    preflightDescriptors: value.preflightDescriptors,
    environmentPreflight: value.environment,
    launchIntent: value.launchIntent,
    launchIntentDescriptor: value.launchIntentDescriptor,
  }), /allowed actions differ/u);
});

test("capacity is exact policy-derived from capture raster, root frames, 94 obligations, and expected files", () => {
  const value = fixture();
  assert.deepEqual(value.capacity.demand, deriveCapacityDemandV4({
    plan: value.plan,
    expectedArtifacts: value.outputRoot.expectedArtifacts,
  }));
  assert.equal(value.capacity.demand.inputs.sourceNativeStage.width, 799.9);
  assert.equal(value.capacity.demand.inputs.sourceNativeStage.height, 599.75);
  assert.deepEqual(value.capacity.demand.inputs.captureRaster, {width: 800, height: 600});
  assert.equal(value.capacity.demand.components.decodedBytesPerFrame, 800 * 600 * 4);
  assert.equal(value.capacity.demand.inputs.obligationCount, 94);
  assert.equal(
    value.capacity.demand.sizingPolicy.policySha256,
    G4_L10_ROOT_CAPTURE_V4_CONSTANTS.capacitySizingPolicySha256,
  );
  for (const key of [
    "decodedWorkingSetBytes",
    "nativePngWorstCaseBytes",
    "logBytes",
    "manifestBytes",
    "requestAuditBytes",
    "audioAuditBytes",
    "processAuditBytes",
    "operationalAuditBytes",
    "comparisonDecodedBytes",
    "diffDecodedBytes",
    "rmseRecordBytes",
    "comparisonDiffRmseBytes",
    "uncompressedArchiveBytes",
    "compressedArchiveBytes",
    "atomicFinalizationTempBytes",
    "remainingBatchReserveBytes",
    "postSessionResidualBytes",
  ]) assert.ok(value.capacity.demand.components[key] > 0, key);

  const selfClaim = structuredClone(value.capacity);
  selfClaim.demand.components.operationalAuditBytes += 1;
  selfClaim.demand.requiredBytes += 1;
  selfClaim.result.calculationSha256 = capacityCalculationSha256(selfClaim);
  selfClaim.result.marginBytes = selfClaim.measurement.freeBytes - selfClaim.demand.requiredBytes;
  selfClaim.receiptSha256 = receiptSha256(selfClaim);
  assertFailsBeforeTrustGate(() => validateCapacityPreflightShapeOnly(selfClaim, {
    ...fullOptions(value),
    outputRootPreflight: value.outputRoot,
    outputRootPreflightDescriptor: value.outputRootDescriptor,
  }), /exact plan\/stage\/raster\/94-obligation\/artifact formula/u);
});

test("eight TI003-TI006 EN/ES plans preserve fractional source stage while sizing only the integer raster", () => {
  const cases = ["ti003", "ti004", "ti005", "ti006"].flatMap((sourceId, sourceIndex) =>
    ["en", "es"].map((language, languageIndex) => ({
      sourceId,
      language,
      sessionId: `123e4567-e89b-42d3-a456-${String(426614176000 + sourceIndex * 2 + languageIndex).padStart(12, "0")}`,
    })));
  assert.equal(cases.length, 8);
  for (const specimen of cases) {
    const value = fixture(specimen);
    validateSessionPlanShapeOnly(value.plan);
    validateCapacityPreflightShapeOnly(value.capacity, {
      ...fullOptions(value),
      outputRootPreflight: value.outputRoot,
      outputRootPreflightDescriptor: value.outputRootDescriptor,
    });
    assert.deepEqual(value.plan.runtime.sourceNativeStage, {width: 799.9, height: 599.75});
    assert.deepEqual(value.plan.runtime.captureRaster, {width: 800, height: 600});
    assertTrustAnchorClosed(() => validatePreLaunchAdmissionV4(preLaunchInput(value)));

    const roundedSourceStage = structuredClone(value.plan);
    roundedSourceStage.runtime.sourceNativeStage.width = 800;
    roundedSourceStage.planSha256 = sessionPlanSha256(roundedSourceStage);
    assertFailsBeforeTrustGate(() => validateSessionPlanShapeOnly(roundedSourceStage),
      /source-native stage and capture raster drifted/u);

    const fractionalRaster = structuredClone(value.plan);
    fractionalRaster.runtime.captureRaster.width = 799.9;
    fractionalRaster.planSha256 = sessionPlanSha256(fractionalRaster);
    assertFailsBeforeTrustGate(() => validateSessionPlanShapeOnly(fractionalRaster),
      /captureRaster must contain positive integer/u);
  }
});

test("runner identity is bound through plan, physical preflight, owner signature, launch intent, transition, start, and postflight rehash", () => {
  const value = fixture();
  assert.deepEqual(value.authorization.runner, value.launchIntent.runner);
  assert.equal(
    value.authorization.runner.physicalIdentitySha256,
    physicalIdentitySha256(value.environment.physicalBindings.runnerExecutable),
  );
  assert.deepEqual(value.authorizedStart.runner, value.authorization.runner);
  assert.deepEqual(value.postflight.rehash.runnerExecutable, value.plan.runner.executable);
  assert.deepEqual(
    value.postflight.rehash.statefulFilesystemVerifierReceipt,
    value.consumption.statefulFilesystemVerifier.verificationReceipt,
  );

  const differentPid = fixture();
  differentPid.authorizedStart.projectorProcess.pid += 1;
  differentPid.authorizedStart.receiptSha256 = receiptSha256(differentPid.authorizedStart);
  assertFailsBeforeTrustGate(() => validateFullSessionChainV4(fullChainInput(differentPid)),
    /projectorProcess\/consumption binding/u);
});

test("canonical realpath boundaries are computed from physical roots and exact output entries reconcile with no extras", () => {
  const value = fixture();
  assert.equal("outsideWorkRoot" in value.outputRoot.pathBoundary, false);
  assert.deepEqual(
    value.postflight.sessionOutputManifest.entries.map(({path}) => path),
    value.outputRoot.expectedArtifacts.files.filter((path) =>
      path !== G4_L10_ROOT_CAPTURE_V4_CONSTANTS.sessionOutputManifestRelativePath),
  );
  assert.deepEqual(
    [
      ...value.postflight.sessionOutputManifest.entries.map(({path}) => path),
      value.postflight.sessionOutputManifest.selfRelativePath,
    ].sort(),
    value.outputRoot.expectedArtifacts.files,
  );
  assert.equal(
    value.postflight.sessionOutputManifest.entrySetSha256,
    sessionOutputEntrySetSha256(value.postflight.sessionOutputManifest.entries),
  );
  assert.equal(
    value.postflight.sessionOutputManifest.descriptor.file,
    `${value.outputRoot.root.realPath}/session-output-manifest.json`,
  );

  const overlap = structuredClone(value.outputRoot);
  overlap.pathBoundary.workRoot = structuredClone(overlap.root);
  overlap.receiptSha256 = receiptSha256(overlap);
  assertFailsBeforeTrustGate(() => validateOutputRootPreflightShapeOnly(overlap, fullOptions(value)),
    /real path overlaps/u);
});

test("host-tree manifest is an exact sorted ordinary read-only symlink-free allowlist", () => {
  const value = fixture();
  assert.equal(value.environment.hostTree.entryCount, 1);
  assert.equal(value.environment.hostTree.unexpectedEntryCount, 0);
  assert.equal(value.environment.hostTree.entries[0].path, value.plan.stagedSource.file);
  const unexpected = structuredClone(value.environment);
  unexpected.hostTree.unexpectedEntryCount = 1;
  unexpected.receiptSha256 = receiptSha256(unexpected);
  assertFailsBeforeTrustGate(() => validateEnvironmentPreflightShapeOnly(unexpected, fullOptions(value)),
    /host tree is not exact/u);
});

test("audit closure rejects child frame domains, staged/dependency aliases, observer-role aliases, and staged-root physical drift", () => {
  const value = fixture();

  const childDomain = structuredClone(value.plan);
  childDomain.identity.frameDomain = "child:timeline-17";
  childDomain.planSha256 = sessionPlanSha256(childDomain);
  assertFailsBeforeTrustGate(() => validateSessionPlanShapeOnly(childDomain),
    /frameDomain must be exactly root/u);

  const duplicatedStagedDependency = structuredClone(value.environment);
  duplicatedStagedDependency.hostTree.allowlistedDependencies = [value.plan.stagedSource];
  duplicatedStagedDependency.hostTree.allowlistedDependencyPhysical = [
    value.environment.physicalBindings.stagedSource,
  ];
  duplicatedStagedDependency.receiptSha256 = receiptSha256(duplicatedStagedDependency);
  assertFailsBeforeTrustGate(() => validateEnvironmentPreflightShapeOnly(
    duplicatedStagedDependency,
    fullOptions(value),
  ), /cannot be repeated as an allowlisted dependency/u);

  const aliasedObserverRole = structuredClone(value.environment);
  aliasedObserverRole.observers.requests.sessionReceiptPath
    = aliasedObserverRole.observers.network.sessionReceiptPath;
  aliasedObserverRole.receiptSha256 = receiptSha256(aliasedObserverRole);
  assertFailsBeforeTrustGate(() => validateEnvironmentPreflightShapeOnly(
    aliasedObserverRole,
    fullOptions(value),
  ), /fixed control filename/u);

  const differentStagedRoot = fixture();
  differentStagedRoot.outputRoot.pathBoundary.stagedRoot.inode = "999999";
  differentStagedRoot.outputRoot.receiptSha256 = receiptSha256(differentStagedRoot.outputRoot);
  assertFailsBeforeTrustGate(() => validatePreLaunchAdmissionV4(preLaunchInput(differentStagedRoot)),
    /staged-root physical identity/u);
});

test("atomic consumption persists an irreversible unconsumed-to-started transition and exact process instance", () => {
  const value = fixture();
  assert.equal(value.consumption.transition.fromState, `unconsumed/${value.consumption.nonceSha256}`);
  assert.equal(
    value.consumption.transition.toState,
    `started/${value.authorizedStart.startInstanceId}`,
  );
  assert.equal(value.consumption.transition.irreversible, true);
  assert.equal(value.consumption.transition.durableFsync, true);
  assert.equal(value.consumption.statefulFilesystemVerificationPassed, true);
  assert.equal(G4_L10_ROOT_CAPTURE_V4_CONSTANTS.statefulFilesystemVerifierRequired, true);
  assert.equal(
    value.consumption.replayLock.lockInode,
    value.consumption.replayLock.physical.inode,
  );
  assert.deepEqual(value.authorizedStart.projectorProcess, value.consumption.projectorProcess);

  const reversible = structuredClone(value.consumption);
  reversible.transition.irreversible = false;
  reversible.receiptSha256 = receiptSha256(reversible);
  assertFailsBeforeTrustGate(() => validateAuthorizationConsumptionShapeOnly(reversible, {
    ...fullOptions(value),
    authorization: value.authorization,
    authorizationDescriptor: value.authorizationDescriptor,
    environmentPreflight: value.environment,
    launchIntent: value.launchIntent,
    preLaunchAdmissionBindingSha256: value.preLaunchBinding,
  }), /durable irreversible/u);
});

test("audit closure derives irreversible consumption from rename-preserved inode, absent preimage, and retained lock observations", () => {
  const consumptionOptions = (value) => ({
    ...fullOptions(value),
    authorization: value.authorization,
    authorizationDescriptor: value.authorizationDescriptor,
    ownerPublicKey: value.ownerKeys.publicKey,
    preflightDescriptors: value.preflightDescriptors,
    environmentPreflight: value.environment,
    launchIntent: value.launchIntent,
    launchIntentDescriptor: value.launchIntentDescriptor,
    preLaunchAdmissionBindingSha256: value.preLaunchBinding,
  });

  const renamedDifferentInode = fixture();
  renamedDifferentInode.consumption.transition.startedTokenPhysical.inode = "999999";
  renamedDifferentInode.consumption.receiptSha256 = receiptSha256(renamedDifferentInode.consumption);
  assertFailsBeforeTrustGate(() => validateAuthorizationConsumptionShapeOnly(
    renamedDifferentInode.consumption,
    consumptionOptions(renamedDifferentInode),
  ), /preserve the renamed preimage physical inode\/bytes/u);

  const preimageStillPresent = fixture();
  preimageStillPresent.consumption.transition.preimagePostObservation.exists = true;
  preimageStillPresent.consumption.receiptSha256 = receiptSha256(preimageStillPresent.consumption);
  assertFailsBeforeTrustGate(() => validateAuthorizationConsumptionShapeOnly(
    preimageStillPresent.consumption,
    consumptionOptions(preimageStillPresent),
  ), /prove the unconsumed preimage absent/u);

  const lockReplaced = fixture();
  lockReplaced.consumption.transition.replayLockRetainedPhysical.inode = "999998";
  lockReplaced.consumption.receiptSha256 = receiptSha256(lockReplaced.consumption);
  assertFailsBeforeTrustGate(() => validateAuthorizationConsumptionShapeOnly(
    lockReplaced.consumption,
    consumptionOptions(lockReplaced),
  ), /retained replay-lock identity/u);
});

test("audit closure rejects a runner process that predates launch intent and owner authorization", () => {
  const value = fixture({runnerStartedAt: "2030-01-01T00:00:20.000Z"});
  assertFailsBeforeTrustGate(() => validateAuthorizationConsumptionShapeOnly(value.consumption, {
    ...fullOptions(value),
    authorization: value.authorization,
    authorizationDescriptor: value.authorizationDescriptor,
    ownerPublicKey: value.ownerKeys.publicKey,
    preflightDescriptors: value.preflightDescriptors,
    environmentPreflight: value.environment,
    launchIntent: value.launchIntent,
    launchIntentDescriptor: value.launchIntentDescriptor,
    preLaunchAdmissionBindingSha256: value.preLaunchBinding,
  }), /runner started outside the launch-intent\/owner-authorized window/u);
});

test("re-audit closure proves exactly one Projector start event and rejects nonzero descendants", () => {
  const baseline = fixture();
  assert.equal(baseline.postflight.processAudit.runnerStartEventCount, 1);
  assert.equal(baseline.postflight.processAudit.projectorStartEventCount, 1);
  assert.equal(baseline.postflight.processAudit.matchingProjectorStartEventCount, 1);
  assert.equal(baseline.postflight.processAudit.duplicateProjectorStartEventCount, 0);
  assert.equal(baseline.postflight.processAudit.unexpectedRuntimeStartEventCount, 0);
  assert.equal(baseline.postflight.processAudit.projectorExitEventCount, 1);

  const duplicateStart = fixture();
  duplicateStart.postflight.processAudit.projectorStartEventCount = 2;
  duplicateStart.postflight.processAudit.duplicateProjectorStartEventCount = 1;
  duplicateStart.postflight.receiptSha256 = receiptSha256(duplicateStart.postflight);
  assertFailsBeforeTrustGate(() => validateFullSessionChainV4(fullChainInput(duplicateStart)),
    /did not prove exactly one runner\/projector start and one exit/u);

  const descendantAtExit = fixture();
  descendantAtExit.postflight.projectorExit.descendantProcessCountAtStart = 2;
  descendantAtExit.postflight.receiptSha256 = receiptSha256(descendantAtExit.postflight);
  assertFailsBeforeTrustGate(() => validateFullSessionChainV4(fullChainInput(descendantAtExit)),
    /projector exit chronology\/disposition drifted/u);
});

test("named-human proof binds the owner-signed operator key, authenticated GUI event, and both capture markers", () => {
  const value = fixture();
  assert.equal(value.authorization.operator.publicKeySha256, spkiSha256(value.operatorKeys.publicKey));
  assert.equal(value.authorization.operator.identitySha256,
    operatorIdentitySha256(value.authorization.operator));
  assert.equal(value.sourceOpen.guiObserverEvent.payload.actionId,
    "projector.file-open-exact-staged-source");
  assert.equal(value.sourceOpen.captureStartMarker.payload.markerType, "capture-start");
  assert.equal(value.sourceOpen.firstFrameMarker.payload.markerType, "first-frame");
  assert.equal(
    value.sourceOpen.guiObserverEvent.descriptor.sha256,
    value.postflight.rehash.guiObserverEvent.sha256,
  );

  const badGui = structuredClone(value.sourceOpen);
  badGui.guiObserverEvent.signature.signatureBase64 = Buffer.alloc(64, 9).toString("base64");
  badGui.receiptSha256 = sourceOpenStartReceiptSha256(badGui);
  assertFailsBeforeTrustGate(() => validateSourceOpenStartReceiptV4ShapeOnly(badGui, {
    ...fullOptions(value),
    readinessDescriptors: value.readinessDescriptors,
    authorization: value.authorization,
    authorizationConsumption: value.consumption,
    authorizedProjectorStart: value.authorizedStart,
    environmentPreflight: value.environment,
    launchIntent: value.launchIntent,
    preLaunchAdmissionBindingSha256: value.preLaunchBinding,
  }), /GUI observer Ed25519 signature verification failed/u);

  const badOperator = structuredClone(value.sourceOpen);
  badOperator.operatorProof.signature.signatureBase64 = Buffer.alloc(64, 8).toString("base64");
  badOperator.receiptSha256 = sourceOpenStartReceiptSha256(badOperator);
  assertFailsBeforeTrustGate(() => validateSourceOpenStartReceiptV4ShapeOnly(badOperator, {
    ...fullOptions(value),
    readinessDescriptors: value.readinessDescriptors,
    authorization: value.authorization,
    authorizationConsumption: value.consumption,
    authorizedProjectorStart: value.authorizedStart,
    environmentPreflight: value.environment,
    launchIntent: value.launchIntent,
    preLaunchAdmissionBindingSha256: value.preLaunchBinding,
  }), /named operator Ed25519 signature verification failed/u);
});

function refinalizeProfileDiscard(value, discardedAt) {
  const disposition = value.postflight.sharedObjectDisposition;
  disposition.discardedAt = discardedAt;
  disposition.discardReceipt = contentDescriptor(
    disposition.discardReceipt.file,
    profileDiscardReceiptBytes(disposition),
  );
  disposition.discardReceiptPhysical = physicalFileEvidence(
    disposition.discardReceipt,
    disposition.discardReceiptPhysical.inode,
    discardedAt,
  );
  value.postflight.rehash.profileDiscardReceipt = disposition.discardReceipt;
  value.postflight.receiptSha256 = receiptSha256(value.postflight);
}

function refinalizeSessionOutput(value) {
  const manifest = value.postflight.sessionOutputManifest;
  manifest.entryCount = manifest.entries.length;
  manifest.totalBytes = manifest.entries.reduce((sum, entry) => sum + entry.bytes, 0);
  manifest.entrySetSha256 = sessionOutputEntrySetSha256(manifest.entries);
  manifest.entrySetDescriptor = contentDescriptor(
    manifest.entrySetDescriptor.file,
    canonicalJson(manifest.entries),
  );
  manifest.descriptor = contentDescriptor(
    manifest.descriptor.file,
    sessionOutputManifestBytes(manifest),
  );
  manifest.physical = physicalFileEvidence(
    manifest.descriptor,
    manifest.physical.inode,
    value.postflight.completedAt,
  );
  value.postflight.rehash.sessionOutputManifest = manifest.descriptor;
  value.postflight.rehash.sessionOutputEntrySet = manifest.entrySetDescriptor;
  value.postflight.receiptSha256 = receiptSha256(value.postflight);
}

test("profile discard is after exact process exit, keeps physical/tree identity, and precedes completion", () => {
  const value = fixture();
  assert.ok(Date.parse(value.postflight.projectorExit.exitedAt)
    <= Date.parse(value.postflight.sharedObjectDisposition.discardedAt));
  assert.ok(Date.parse(value.postflight.sharedObjectDisposition.discardedAt)
    <= Date.parse(value.postflight.completedAt));
  assert.deepEqual(
    value.postflight.sharedObjectDisposition.profileRootPhysical,
    value.environment.profile.sessionRoot,
  );
  assert.equal(
    value.postflight.sharedObjectDisposition.preDiscardProfileRootPhysical.inode,
    value.environment.profile.sessionRoot.inode,
  );
  assert.equal(
    value.postflight.sharedObjectDisposition.initialTreeSetSha256,
    value.environment.profile.initialTreeSetSha256,
  );

  refinalizeProfileDiscard(value, "2030-01-01T00:03:04.000Z");
  assertFailsBeforeTrustGate(() => validateFullSessionChainV4(fullChainInput(value)),
    /discard chronology/u);
});

test("session output manifest binds sorted entries, expected artifacts, observer/marker hashes, and rejects extras", () => {
  const value = fixture();
  const paths = value.postflight.sessionOutputManifest.entries.map(({path}) => path);
  assert.deepEqual(paths, [...paths].sort());
  const processPath = value.postflight.projectorExit.processObserverReceipt.file
    .slice(value.plan.plannedSessionOutputRoot.length + 1);
  const processEntry = value.postflight.sessionOutputManifest.entries
    .find(({path}) => path === processPath);
  assert.equal(processEntry.sha256, value.postflight.projectorExit.processObserverReceipt.sha256);

  value.postflight.sessionOutputManifest.entries[0].path = "unexpected-extra.bin";
  value.postflight.sessionOutputManifest.entries.sort((left, right) => left.path.localeCompare(right.path));
  refinalizeSessionOutput(value);
  assertFailsBeforeTrustGate(() => validateFullSessionChainV4(fullChainInput(value)),
    /manifest is incomplete|do not reconcile exactly to expectedArtifacts|does not reconcile observer\/marker/u);
});

test("postflight rehash closes kit, traces, preflights, authorization, transition, observers, discard, and exact output set", () => {
  const value = fixture();
  const required = [
    "captureKit", "kitCheck", "traceSpec", "traceSpecIndex", "environmentPreflight",
    "outputRootPreflight", "capacityPreflight", "authorization", "launchIntent",
    "authorizationConsumption", "authorizedProjectorStart", "sourceOpenStartReceipt",
    "runnerExecutable", "processInventory", "networkObserverReceipt", "requestObserverReceipt",
    "processObserverReceipt", "windowObserverReceipt", "effectObserverReceipt",
    "audioObserverReceipt", "guiObserverReceipt", "profileDiscardReceipt",
    "statefulFilesystemVerifierReceipt", "replayLock", "transitionReceipt", "guiObserverEvent",
    "captureStartMarker", "firstFrameMarker", "sessionOutputManifest", "sessionOutputEntrySet",
  ];
  for (const key of required) assert.ok(key in value.postflight.rehash, key);

  delete value.postflight.rehash.authorization;
  value.postflight.receiptSha256 = receiptSha256(value.postflight);
  assertFailsBeforeTrustGate(() => validateFullSessionChainV4(fullChainInput(value)), /keys drifted/u);
});

test("audit closure accounts for the manifest itself and requires byte-exact observer rehash plus output-root device binding", () => {
  const baseline = fixture();
  const manifestPath = G4_L10_ROOT_CAPTURE_V4_CONSTANTS.sessionOutputManifestRelativePath;
  assert.equal(baseline.outputRoot.expectedArtifacts.files.includes(manifestPath), true);
  assert.equal(
    baseline.postflight.sessionOutputManifest.entries.some(({path}) => path === manifestPath),
    false,
  );
  assert.equal(baseline.postflight.sessionOutputManifest.selfExcludedFromEntries, true);
  assert.equal(
    baseline.postflight.sessionOutputManifest.rootFileCount,
    baseline.outputRoot.expectedArtifacts.files.length,
  );

  const recursiveInventoryLie = fixture();
  recursiveInventoryLie.postflight.sessionOutputManifest.selfExcludedFromEntries = false;
  recursiveInventoryLie.postflight.receiptSha256 = receiptSha256(recursiveInventoryLie.postflight);
  assertFailsBeforeTrustGate(() => validateFullSessionChainV4(fullChainInput(recursiveInventoryLie)),
    /not directly inside the exact physical output root/u);

  const samePathDifferentBytes = fixture();
  samePathDifferentBytes.postflight.rehash.networkObserverReceipt = {
    ...samePathDifferentBytes.postflight.rehash.networkObserverReceipt,
    bytes: samePathDifferentBytes.postflight.rehash.networkObserverReceipt.bytes + 1,
    sha256: "1".repeat(64),
  };
  samePathDifferentBytes.postflight.receiptSha256 = receiptSha256(samePathDifferentBytes.postflight);
  assertFailsBeforeTrustGate(() => validateFullSessionChainV4(fullChainInput(samePathDifferentBytes)),
    /differs from its exact expected descriptor/u);

  const crossDeviceManifest = fixture();
  crossDeviceManifest.postflight.sessionOutputManifest.physical.device = "999";
  crossDeviceManifest.postflight.sessionOutputManifest.physical.mountId = "fixture-volume-999";
  crossDeviceManifest.postflight.receiptSha256 = receiptSha256(crossDeviceManifest.postflight);
  assertFailsBeforeTrustGate(() => validateFullSessionChainV4(fullChainInput(crossDeviceManifest)),
    /differs from the exact output-root device\/mount/u);
});

test("re-audit closure keeps output, disposable profile, and replay-lock roots physically disjoint and re-observes the output inode", () => {
  const profileOverlap = fixture();
  const overlappingProfilePath = `${profileOverlap.outputRoot.root.realPath}/runtime-profile`;
  profileOverlap.environment.profile.sessionRoot = physicalDirectory(
    overlappingProfilePath,
    91001,
    profileOverlap.environment.checkedAt,
    {mode: "0700"},
  );
  profileOverlap.environment.sandbox.writeRoots = [overlappingProfilePath];
  profileOverlap.environment.receiptSha256 = receiptSha256(profileOverlap.environment);
  assertFailsBeforeTrustGate(() => validatePreLaunchAdmissionV4(preLaunchInput(profileOverlap)),
    /output root overlaps the disposable profile physical root/u);

  const replayOverlap = fixture();
  const overlappingReplayPath = `${replayOverlap.outputRoot.root.realPath}/replay-locks`;
  replayOverlap.environment.profile.externalReplayLockRoot = physicalDirectory(
    overlappingReplayPath,
    91002,
    replayOverlap.environment.checkedAt,
    {mode: "0700"},
  );
  replayOverlap.environment.receiptSha256 = receiptSha256(replayOverlap.environment);
  assertFailsBeforeTrustGate(() => validatePreLaunchAdmissionV4(preLaunchInput(replayOverlap)),
    /output root overlaps the external replay-lock physical root/u);

  const finalInodeDrift = fixture();
  finalInodeDrift.postflight.outputRootFinalPhysical.inode = "999999";
  finalInodeDrift.postflight.receiptSha256 = receiptSha256(finalInodeDrift.postflight);
  assertFailsBeforeTrustGate(() => validateFullSessionChainV4(fullChainInput(finalInodeDrift)),
    /final output-root physical identity drifted/u);
});

test("audit closure cryptographically proves human-only exit and requires an exact supervisor stop-condition ID", () => {
  const mutateBase64Signature = (signatureBase64) => {
    const bytes = Buffer.from(signatureBase64, "base64");
    bytes[0] ^= 0x01;
    return bytes.toString("base64");
  };

  const forgedOperatorExit = fixture();
  const operatorSignature = forgedOperatorExit.postflight.projectorExit
    .terminationEvidence.operatorSignature;
  operatorSignature.signatureBase64 = mutateBase64Signature(operatorSignature.signatureBase64);
  forgedOperatorExit.postflight.receiptSha256 = receiptSha256(forgedOperatorExit.postflight);
  assertFailsBeforeTrustGate(() => validateFullSessionChainV4(fullChainInput(forgedOperatorExit)),
    /named operator Ed25519 signature verification failed/u);

  const forgedGuiExit = fixture();
  const guiSignature = forgedGuiExit.postflight.projectorExit
    .terminationEvidence.guiObserverEvent.signature;
  guiSignature.signatureBase64 = mutateBase64Signature(guiSignature.signatureBase64);
  forgedGuiExit.postflight.receiptSha256 = receiptSha256(forgedGuiExit.postflight);
  assertFailsBeforeTrustGate(() => validateFullSessionChainV4(fullChainInput(forgedGuiExit)),
    /GUI observer Ed25519 signature verification failed/u);

  const unknownSupervisorReason = fixture();
  unknownSupervisorReason.postflight.projectorExit.terminationMethod
    = "supervisor-stop-condition-termination";
  unknownSupervisorReason.postflight.projectorExit.terminationEvidence = {
    type: "supervisor-stop-condition-v4",
    triggeredStopConditionId: "caller-invented-stop-condition",
    triggerObserverReceipt: unknownSupervisorReason.postflight.projectorExit.processObserverReceipt,
  };
  unknownSupervisorReason.postflight.receiptSha256 = receiptSha256(unknownSupervisorReason.postflight);
  assertFailsBeforeTrustGate(() => validateFullSessionChainV4(fullChainInput(unknownSupervisorReason)),
    /lacks one exact fixed stop-condition ID/u);
});

test("literal canonical signing bytes and SHA are stable across key order and preserve Unicode/newline semantics", () => {
  const signingDocument = {
    z: "雪",
    a: {s: "line\n", n: -0},
    signature: {algorithm: "ignored-by-signing-bytes"},
  };
  const expected = Buffer.from('{"a":{"n":0,"s":"line\\n"},"z":"雪"}\n', "utf8");
  assert.deepEqual(authorizationSigningBytes(signingDocument), expected);
  assert.equal(sha256Bytes(expected), "def02356f883f545a89740398d6e0af672c4a1c6be6ce9cb0233e87b988704f6");
  assert.equal(canonicalJson({z: "雪", a: {s: "line\n", n: 0}}), expected.toString("utf8"));
  assert.equal(canonicalJson({b: 2, a: 1}), canonicalJson({a: 1, b: 2}));
  assert.notEqual(canonicalJson({text: "é"}), canonicalJson({text: "e\u0301"}));
  assert.notEqual(sha256Bytes(expected), sha256Bytes(expected.subarray(0, expected.length - 1)));
  assert.throws(() => canonicalJson({unsafe: Number.MAX_SAFE_INTEGER + 1}), /unsafe integer/u);
  assert.throws(() => canonicalJson({nan: Number.NaN}), /non-finite/u);
  assert.throws(() => canonicalJson({infinite: Number.POSITIVE_INFINITY}), /non-finite/u);
});

test("RFC 8032 Ed25519 empty-message known-answer vector verifies independently and rejects mutation", () => {
  const rawPublicKey = Buffer.from(
    "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
    "hex",
  );
  const spkiDer = Buffer.concat([
    Buffer.from("302a300506032b6570032100", "hex"),
    rawPublicKey,
  ]);
  const publicKey = createPublicKey({key: spkiDer, format: "der", type: "spki"});
  const signature = Buffer.from(
    "e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e06522490155"
      + "5fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b",
    "hex",
  );
  assert.equal(verify(null, Buffer.alloc(0), publicKey, signature), true);
  const mutated = Buffer.from(signature);
  mutated[0] ^= 1;
  assert.equal(verify(null, Buffer.alloc(0), publicKey, mutated), false);
});

test("ten audited full-chain mutations all fail at their semantic gate before the null trust-root gate", () => {
  const attacks = [
    {
      name: "policy intersection",
      pattern: /exact fixed policy|canonical sorted/u,
      mutate(value) {
        value.plan.operationPolicy.allowedActionIds.push("projector.save-source");
        value.plan.operationPolicy.allowedActionIds.sort();
        value.plan.planSha256 = sessionPlanSha256(value.plan);
      },
    },
    {
      name: "positive-integer capacity self-claim",
      pattern: /exact plan\/stage\/raster\/94-obligation\/artifact formula/u,
      mutate(value) {
        value.capacity.demand.components.comparisonDiffRmseBytes += 1;
        value.capacity.demand.requiredBytes += 1;
        value.capacity.result.calculationSha256 = capacityCalculationSha256(value.capacity);
        value.capacity.result.marginBytes = value.capacity.measurement.freeBytes
          - value.capacity.demand.requiredBytes;
        value.capacity.receiptSha256 = receiptSha256(value.capacity);
      },
    },
    {
      name: "owner-signed runner physical swap",
      pattern: /runner physical identity drifted/u,
      mutate(value) {
        const authorization = structuredClone(value.authorization);
        authorization.runner.physicalIdentitySha256 = "a".repeat(64);
        value.authorization = signAuthorization(authorization, value.ownerKeys.privateKey);
      },
    },
    {
      name: "same consumption different Projector PID",
      pattern: /projectorProcess\/consumption binding/u,
      mutate(value) {
        value.authorizedStart.projectorProcess.pid += 1;
        value.authorizedStart.receiptSha256 = receiptSha256(value.authorizedStart);
      },
    },
    {
      name: "output/work realpath overlap",
      pattern: /real path overlaps/u,
      mutate(value) {
        value.outputRoot.pathBoundary.workRoot = structuredClone(value.outputRoot.root);
        value.outputRoot.receiptSha256 = receiptSha256(value.outputRoot);
      },
    },
    {
      name: "profile discard before process exit",
      pattern: /discard chronology/u,
      mutate(value) {
        refinalizeProfileDiscard(value, "2030-01-01T00:03:04.000Z");
      },
    },
    {
      name: "incomplete postflight rehash",
      pattern: /keys drifted/u,
      mutate(value) {
        delete value.postflight.rehash.transitionReceipt;
        value.postflight.receiptSha256 = receiptSha256(value.postflight);
      },
    },
    {
      name: "forged authenticated GUI event",
      pattern: /GUI observer Ed25519 signature verification failed/u,
      mutate(value) {
        value.sourceOpen.guiObserverEvent.signature.signatureBase64 = Buffer.alloc(64, 4)
          .toString("base64");
        value.sourceOpen.receiptSha256 = sourceOpenStartReceiptSha256(value.sourceOpen);
      },
    },
    {
      name: "unexpected host-tree entry",
      pattern: /host tree is not exact/u,
      mutate(value) {
        value.environment.hostTree.unexpectedEntryCount = 1;
        value.environment.receiptSha256 = receiptSha256(value.environment);
      },
    },
    {
      name: "unexpected session-output file",
      pattern: /manifest is incomplete|do not reconcile exactly to expectedArtifacts|does not reconcile observer\/marker/u,
      mutate(value) {
        value.postflight.sessionOutputManifest.entries[0].path = "unexpected-extra.bin";
        value.postflight.sessionOutputManifest.entries.sort((left, right) =>
          left.path.localeCompare(right.path));
        refinalizeSessionOutput(value);
      },
    },
  ];
  assert.ok(attacks.length >= 8);
  for (const attack of attacks) {
    const value = fixture();
    attack.mutate(value);
    assertFailsBeforeTrustGate(
      () => validateFullSessionChainV4(fullChainInput(value)),
      attack.pattern,
      attack.name,
    );
  }
});

test("arbitrary caller-generated owner keys prove only self-consistency and never bootstrap project trust", () => {
  const first = fixture();
  const second = fixture({
    language: "es",
    sourceId: "ti006",
    sessionId: "123e4567-e89b-42d3-a456-426614177777",
  });
  assert.notEqual(spkiSha256(first.ownerKeys.publicKey), spkiSha256(second.ownerKeys.publicKey));
  assertTrustAnchorClosed(() => validatePreLaunchAdmissionV4(preLaunchInput(first)));
  assertTrustAnchorClosed(() => validatePreLaunchAdmissionV4(preLaunchInput(second)));
  assertTrustAnchorClosed(() => validateFullSessionChainV4(fullChainInput(first)));
  assertTrustAnchorClosed(() => validateFullSessionChainV4(fullChainInput(second)));

  const wrongKeyInput = preLaunchInput(first);
  wrongKeyInput.ownerPublicKey = second.ownerKeys.publicKey;
  assertFailsBeforeTrustGate(() => validatePreLaunchAdmissionV4(wrongKeyInput),
    /public-key hash drifted/u);
});

test("all acceptance effects remain false and no contract code can launch a process or write filesystem state", () => {
  const value = fixture();
  for (const document of [
    value.plan,
    value.environment,
    value.outputRoot,
    value.capacity,
    value.launchIntent,
    value.authorization,
    value.consumption,
    value.authorizedStart,
    value.sourceOpen,
    value.postflight,
  ]) assert.equal(Object.values(document.authorityBoundary).every((effect) => effect === false), true);

  const promoted = structuredClone(value.postflight);
  promoted.authorityBoundary.originalRuntimeEvidence = true;
  promoted.receiptSha256 = receiptSha256(promoted);
  assertFailsBeforeTrustGate(() => validateContainmentPostflightShapeOnly(promoted, {
    ...fullOptions(value),
    environmentPreflight: value.environment,
    outputRootPreflight: value.outputRoot,
    sourceOpenStartReceipt: value.sourceOpen,
  }), /was promoted/u);

  const source = readFileSync(
    new URL("./lib/g4-l10-root-capture-v4-contract.mjs", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(source, /node:fs|node:child_process|spawn\s*\(|execFile\s*\(/u);
  assert.equal(G4_L10_ROOT_CAPTURE_V4_CONSTANTS.statefulFilesystemVerifierRequired, true);
});
