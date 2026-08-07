import assert from "node:assert/strict";
import {chmod, cp, link, lstat, mkdtemp, mkdir, readFile, readdir, rename, rm, rmdir, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

import {canonicalJson, safeRequirementId, sha256Text} from "./build-course-trace-specs.mjs";
import {
  APPROVED_SOURCE_DRIVEN_RUNTIME,
  SOURCE_DRIVEN_BRANCH_AUTHORITY_NOTE,
  SOURCE_DRIVEN_BRANCH_PROOF_MODE,
  SOURCE_DRIVEN_BRANCH_SESSION_STATEMENT,
  SOURCE_DRIVEN_ENVIRONMENT_STATEMENT,
  SOURCE_DRIVEN_LAUNCH_STATEMENT,
  parseArguments,
  prepareSourceDrivenBranchCandidate,
  sourceDrivenAdapterEntryRecordSha256,
  sourceDrivenEnvironmentReceiptSha256,
  sourceDrivenEventRecordSha256,
  sourceDrivenFrameStateRecordSha256,
  sourceDrivenLaunchReceiptSha256,
  sourceDrivenMasterEvidenceChainBindingSha256,
  sourceDrivenOperationRecordSha256,
  sourceDrivenRandomTrialRecordSha256,
  sourceDrivenSessionAttestationSha256,
  validateSourceDrivenBranchSpec,
} from "./prepare-source-driven-branch-candidate.mjs";
import {digest, orderedFrameSetSha256, portable, renderJson} from "./prepare-root-capture-candidate.mjs";
import {
  DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES,
  buildSourceDrivenBranchCaptureKit,
} from "./scaffold-source-driven-branch-capture-kit.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const animationId = "course-g03-l06-ti-001";
const requirementId = "req:sprite-21:sound-0:en";
const safeId = safeRequirementId(requirementId);
const specRelative = `migrations/${animationId}/audit/trace-specs/${safeId}.json`;
const kitRelative = `work/source-driven-branch-capture-kits/${animationId}/${safeId}`;
const indexRelative = "migrations/course-shell-pilot-trace-spec-index.json";
const operator = Object.freeze({
  kind: "human",
  fullName: "Mina Chen",
  role: "Authorized Flash capture operator",
  organizationOrOwnerId: "HELP-MATH-OWNER-001",
  contact: "mina.chen@example.test",
});
const sessionId = "123e4567-e89b-42d3-a456-426614174123";
const tiProfile = DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES[0];
const testFramePng = (() => {
  const png = new PNG({width: 800, height: 600});
  png.data.fill(255);
  return PNG.sync.write(png);
})();

function iso(base, offset) {
  return new Date(base + offset).toISOString();
}

async function writeJson(file, value) {
  const bytes = Buffer.from(renderJson(value));
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
  return digest(bytes);
}

async function writeJsonl(file, records) {
  const bytes = Buffer.from(`${records.map((record) => JSON.stringify(record)).join("\n")}\n`);
  await mkdir(path.dirname(file), {recursive: true});
  await writeFile(file, bytes);
  return digest(bytes);
}

function scheduleBinding(spec) {
  const hash = (value) => sha256Text(canonicalJson(value));
  return {
    naturalEntrySha256: hash(spec.schedule.naturalEntry),
    sourceDrivenEventsSha256: hash(spec.schedule.sourceDrivenEvents),
    stateCheckpointsSha256: hash(spec.schedule.stateCheckpoints),
    terminalSemanticsSha256: hash(spec.schedule.terminalSemantics),
  };
}

async function copyRelative(root, relative) {
  const destination = path.join(root, relative);
  await mkdir(path.dirname(destination), {recursive: true});
  await cp(path.join(repositoryRoot, relative), destination);
}

async function fixtureRuntime(root) {
  const appPath = path.join(root, "Fixture Flash Player.app");
  const executablePath = path.join(appPath, "Contents", "MacOS", "Flash Player");
  const bytes = Buffer.from("fixture Adobe Flash Player executable\n");
  await mkdir(path.dirname(executablePath), {recursive: true});
  await writeFile(executablePath, bytes);
  const approvedRuntime = {
    runtimeId: APPROVED_SOURCE_DRIVEN_RUNTIME.runtimeId,
    name: APPROVED_SOURCE_DRIVEN_RUNTIME.name,
    version: `${APPROVED_SOURCE_DRIVEN_RUNTIME.version}-test`,
    executableSha256: digest(bytes),
  };
  return {...approvedRuntime, requestedAppPath: appPath, appPath, executablePath, approvedRuntime};
}

async function copyProductionInputs(root) {
  const spec = JSON.parse(await readFile(path.join(repositoryRoot, specRelative), "utf8"));
  const paths = [
    specRelative,
    indexRelative,
    `migrations/${animationId}/migration.json`,
    `migrations/${animationId}/evidence/full-frame-coverage.json`,
    `migrations/${animationId}/audit/scenario-inventory.json`,
    spec.sourceBindings.sourceSwf.path,
    spec.sourceBindings.scheduleDerivation.generator.path,
    "scripts/build-adobe-course-host-fixtures.mjs",
    "scripts/source-driven-branch-capture-contracts.mjs",
    "migrations/course-g03-l06-ti-001/audit/audio-runtime-evidence.json",
    tiProfile.fixtureManifest,
  ];
  for (const relative of paths) await copyRelative(root, relative);
  const fixture = JSON.parse(await readFile(path.join(repositoryRoot, tiProfile.fixtureManifest), "utf8"));
  const fixtureRoot = path.dirname(tiProfile.fixtureManifest);
  for (const item of fixture.generatedFileHashes) await copyRelative(root, `${fixtureRoot}/${item.path}`);
  const runtime = await fixtureRuntime(root);
  const kitBuild = await buildSourceDrivenBranchCaptureKit({
    projectRoot: root,
    specFile: specRelative,
    runtime,
    testOnlyApprovedRuntime: runtime.approvedRuntime,
  });
  const kitRoot = path.join(root, kitRelative);
  await mkdir(kitRoot, {recursive: true});
  for (const [relative, descriptor] of kitBuild.files) {
    const destination = path.join(kitRoot, relative);
    await mkdir(path.dirname(destination), {recursive: true});
    await writeFile(destination, descriptor.content, {flag: "wx", mode: descriptor.mode});
    await chmod(destination, descriptor.mode);
  }
  const tree = JSON.parse(kitBuild.files.get("runtime-tree-manifest.json").content);
  const template = (file) => JSON.parse(kitBuild.files.get(file).content.toString("utf8"));
  const templates = {
    environment: template("templates/environment-isolation-receipt.template.json"),
    launch: template("templates/adapter-launch-receipt.template.json"),
    toolchain: template("templates/runtime-toolchain-receipt.template.json"),
    adapterRecord: template("templates/adapter-entry-log.schema.template.jsonl"),
    randomRecord: template("templates/random-trial-log.schema.template.jsonl"),
    eventRecord: template("templates/source-driven-event-log.schema.template.jsonl"),
    frameRecord: template("templates/frame-state-log.schema.template.jsonl"),
    operationRecord: template("templates/operation-log.schema.template.jsonl"),
    captureManifest: template("templates/capture-manifest.template.json"),
    attestation: template("templates/session-attestation.template.json"),
  };
  return {spec, kit: kitBuild.manifest, tree, runtime, approvedRuntime: runtime.approvedRuntime, templates};
}

function commonBinding({spec, specSha256, indexSha256, kitSha256, sandboxSha256, environmentSha256, launchSha256, toolchainSha256}) {
  return {
    schemaVersion: 1,
    animationId,
    requirementId,
    proofMode: SOURCE_DRIVEN_BRANCH_PROOF_MODE,
    sessionId,
    acceptedAttemptId: "attempt-0001",
    traceSpecSha256: specSha256,
    traceSpecIndexSha256: indexSha256,
    sourceSwfSha256: spec.sourceBindings.sourceSwf.sha256,
    captureKitManifestSha256: kitSha256,
    sandboxProfileSha256: sandboxSha256,
    environmentIsolationReceiptSha256: environmentSha256,
    launchReceiptSha256: launchSha256,
    toolchainReceiptSha256: toolchainSha256,
    operator,
  };
}

function chain(records, hasher) {
  let previousRecordSha256 = null;
  return records.map((record) => {
    const item = {...record, previousRecordSha256};
    item.recordSha256 = hasher(item);
    previousRecordSha256 = item.recordSha256;
    return item;
  });
}

async function makeFixture({framesInPending = false, randomTime = 300, cutRandomEdge = false, cutCausalEdge = false, cutOperationEdge = false, randomAttemptCount = 1} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "source-driven-preparer-"));
  const {spec, kit, tree, approvedRuntime, templates} = await copyProductionInputs(root);
  const pendingDirectory = path.join(root, "migrations", animationId, "evidence", "pending-source-driven-branch-capture", safeId);
  const sessionRoot = path.join(root, "work", "authorized-source-driven-capture", animationId, safeId);
  const framesDirectory = framesInPending ? pendingDirectory : path.join(sessionRoot, "frames");
  await mkdir(framesDirectory, {recursive: true});
  const relative = (file) => portable(path.relative(root, file));
  const base = Date.now() - 2 * 60 * 60 * 1000;
  const specPath = path.join(root, specRelative);
  const indexPath = path.join(root, indexRelative);
  const kitManifestPath = path.join(root, kitRelative, "kit-manifest.json");
  const sandboxPath = path.join(root, kitRelative, kit.sandbox.file);
  const specSha256 = digest(await readFile(specPath));
  const indexSha256 = digest(await readFile(indexPath));
  const kitSha256 = digest(await readFile(kitManifestPath));
  const sandboxSha256 = digest(await readFile(sandboxPath));

  const environmentPath = path.join(sessionRoot, "environment.json");
  const environment = {
    ...structuredClone(templates.environment),
    schemaVersion: 1,
    evidenceType: "named-human-disposable-flash-runtime-environment-receipt",
    sessionId,
    animationId,
    requirementId,
    isolationMode: "dedicated-one-time-macos-login-account",
    operatingSystem: {productVersion: "15.5", buildVersion: "24F74", architecture: "arm64"},
    account: {userName: "flash-capture", uid: 502, homeDirectory: "/Users/flash-capture", realOsAccount: true, dedicatedToCapture: true},
    profile: {identifier: "fresh-profile-001", createdForSession: true, reused: false, normalSharedObjectReadWriteSemantics: true, resetOrDestroyedAfterSession: true},
    preflight: {runningFlashProcessCount: 0, sharedObjectFileCount: 0, unexpectedFiles: []},
    postflight: {unexpectedWrites: [], unexpectedNetworkEvents: [], profileResetOrDestroyed: true},
    operator,
    startedAt: iso(base, 0),
    endedAt: iso(base, 65000),
    signedAt: iso(base, 66000),
    statement: SOURCE_DRIVEN_ENVIRONMENT_STATEMENT,
  };
  environment.receiptSha256 = sourceDrivenEnvironmentReceiptSha256(environment);
  const environmentSha256 = await writeJson(environmentPath, environment);

  const adapterDescriptor = tree.files.find(({role}) => role === "minimal-safe-adapter-host");
  const adapterPath = path.join(root, kitRelative, adapterDescriptor.destination);
  const launchPath = path.join(sessionRoot, "launch-receipt.json");
  const launch = {
    ...structuredClone(templates.launch),
    schemaVersion: 1,
    evidenceType: "named-human-source-driven-projector-launch-receipt",
    sessionId,
    animationId,
    requirementId,
    captureKit: {file: relative(kitManifestPath), sha256: kitSha256},
    environmentIsolation: {file: relative(environmentPath), sha256: environmentSha256},
    sandboxProfile: {file: relative(sandboxPath), sha256: sandboxSha256},
    runtime: {...approvedRuntime},
    adapter: {file: relative(adapterPath), sha256: adapterDescriptor.sha256, readOnly: true, minimalAdapterOnly: true},
    launchProtocol: "named-human-sandboxed-minimal-adapter-open",
    projectorStart: {executablePath: kit.runtime.executablePath, processId: 24680, startedAt: iso(base, 1000), launchedByNamedHuman: true, launchedByCandidatePreparer: false},
    adapterOpen: {file: relative(adapterPath), sha256: adapterDescriptor.sha256, openedAt: iso(base, 2000), playerWindowObserved: true, sandboxProfileApplied: true, networkDenied: true},
    operator,
    statement: SOURCE_DRIVEN_LAUNCH_STATEMENT,
    signedAt: iso(base, 3000),
  };
  launch.receiptSha256 = sourceDrivenLaunchReceiptSha256(launch);
  const launchSha256 = await writeJson(launchPath, launch);

  const executableReceiptPath = path.join(sessionRoot, "projector-executable.txt");
  const executableReceiptBytes = Buffer.from(`executable_sha256=${approvedRuntime.executableSha256}\n`);
  await writeFile(executableReceiptPath, executableReceiptBytes);
  const toolchainPath = path.join(sessionRoot, "toolchain.json");
  const toolchain = {
    ...structuredClone(templates.toolchain),
    schemaVersion: 1,
    evidenceType: "human-attested-adobe-runtime-toolchain-receipt",
    runtime: {runtimeId: approvedRuntime.runtimeId, name: approvedRuntime.name, version: approvedRuntime.version},
    captureSessionBinding: {
      sessionId,
      traceSpecSha256: specSha256,
      traceSpecIndexSha256: indexSha256,
      sourceSwfSha256: spec.sourceBindings.sourceSwf.sha256,
      captureKitManifestSha256: kitSha256,
      sandboxProfileSha256: sandboxSha256,
      environmentIsolationReceiptSha256: environmentSha256,
      launchReceiptSha256: launchSha256,
    },
    capturedAt: iso(base, 5000),
    identityArtifacts: [{kind: "executable-sha256-receipt", file: relative(executableReceiptPath), sha256: digest(executableReceiptBytes)}],
  };
  const toolchainSha256 = await writeJson(toolchainPath, toolchain);
  const binding = commonBinding({spec, specSha256, indexSha256, kitSha256, sandboxSha256, environmentSha256, launchSha256, toolchainSha256});
  const traceStart = base + 4000;
  const occurredAt = (monotonicTimeMs) => iso(traceStart, monotonicTimeMs);

  const adapterRecords = chain([
    {...structuredClone(templates.adapterRecord), ...binding, evidenceType: "attested-source-driven-adapter-entry", sequence: 1, occurredAt: occurredAt(100), monotonicTimeMs: 100, phase: "pre-trace", action: "named-human-child-load-trigger", sourceTarget: "minimal-safe-adapter-host", observation: {childLoadTrigger: "single-named-human-pre-trace-click", childLoadTriggerCount: 1, onLoadInitObserved: true, rootFrame: 6, frameDomainId: spec.identity.frameDomainId, localFrame: 1}, operatorDispatch: true},
    {...structuredClone(templates.adapterRecord), ...binding, evidenceType: "attested-source-driven-adapter-entry", sequence: 2, occurredAt: occurredAt(200), monotonicTimeMs: 200, phase: "pre-trace", action: "adapter-begin-handoff", sourceTarget: "exact-preserved-child", observation: {beginHandoff: "target.gotoAndPlay(\"begin\")", beginHandoffCount: 1, traceStartedAfterOnLoadInit: true, rootFrame: 6, frameDomainId: spec.identity.frameDomainId, localFrame: 1}, operatorDispatch: false},
  ], sourceDrivenAdapterEntryRecordSha256);
  const adapterLogPath = path.join(sessionRoot, "adapter-entry.jsonl");
  const adapterLogSha256 = await writeJsonl(adapterLogPath, adapterRecords);

  const randomAttempt = {attemptId: "attempt-0001", sequence: 1, observedOutcome: 0, selectedInstanceName: "Mc_Sound_0", selectedObjectId: 7, disposition: "accepted-natural-match"};
  const randomAttempts = randomAttemptCount === 1 ? [randomAttempt] : [
    {attemptId: "attempt-0001", sequence: 1, observedOutcome: 1, selectedInstanceName: "Mc_Sound_1", selectedObjectId: 8, disposition: "discarded-natural-nonmatch"},
    {attemptId: "attempt-0002", sequence: 2, observedOutcome: 0, selectedInstanceName: "Mc_Sound_0", selectedObjectId: 7, disposition: "accepted-natural-match"},
  ];
  const randomRecords = randomAttempts.map((attempt, index) => ({
    ...structuredClone(templates.randomRecord),
    ...binding,
    evidenceType: "attested-source-driven-natural-random-trial",
    sequence: index + 1,
    occurredAt: occurredAt(randomTime + index * 10),
    monotonicTimeMs: randomTime + index * 10,
    attemptId: attempt.attemptId,
    restartObserved: true,
    randomCall: "random(2)",
    observedOutcome: attempt.observedOutcome,
    naturallyObservedBranch: `sound-${attempt.observedOutcome}`,
    selectedInstanceName: attempt.selectedInstanceName,
    selectedObjectId: attempt.selectedObjectId,
    disposition: attempt.disposition,
    identitySeedInjectedIntoAvm1: false,
    seedInjected: false,
    forcedBranch: false,
    randomOverridden: false,
    branchVariableWrittenByAdapter: false,
    operatorDispatch: false,
    acceptedTraceStarted: attempt.disposition === "accepted-natural-match",
  }));
  let previousRandomHash = cutRandomEdge ? null : adapterRecords.at(-1).recordSha256;
  for (const record of randomRecords) {
    record.previousRecordSha256 = previousRandomHash;
    record.recordSha256 = sourceDrivenRandomTrialRecordSha256(record);
    previousRandomHash = record.recordSha256;
  }
  const randomLogPath = path.join(sessionRoot, "random-trials.jsonl");
  const randomLogSha256 = await writeJsonl(randomLogPath, randomRecords);

  const checkpointByFrame = new Map(spec.schedule.stateCheckpoints.map((checkpoint) => [checkpoint.expectedState.localFrame, checkpoint.expectedState]));
  const frameDescriptors = [];
  const frameRecords = [];
  const eventRecords = [];
  const eventByFrame = new Map(spec.schedule.sourceDrivenEvents.map((event, index) => [event.trigger.frame, {event, index}]));
  const eventTimes = [400, 850, 14550];
  let previousFrameHash = null;
  let previousEventHash = null;
  for (let frame = 1; frame <= 142; frame += 1) {
    const scheduled = eventByFrame.get(frame);
    let sourceEvent = null;
    if (scheduled) {
      const {event, index} = scheduled;
      sourceEvent = {
        ...structuredClone(templates.eventRecord),
        ...binding,
        evidenceType: "attested-source-driven-event-observation",
        sequence: index + 1,
        occurredAt: occurredAt(eventTimes[index]),
        monotonicTimeMs: eventTimes[index],
        scheduledEventOrder: index + 1,
        scheduledEventSha256: sha256Text(canonicalJson(event)),
        observedTrigger: event.trigger,
        resolvedSourceTarget: event.sourceTarget,
        preState: event.preState,
        preStateSha256: sha256Text(canonicalJson(event.preState)),
        postState: event.postState,
        postStateSha256: sha256Text(canonicalJson(event.postState)),
        preStateObservationMethod: "runtime-telemetry-before-source-script",
        postStateObservationMethod: "runtime-telemetry-after-source-script",
        preScreenshotFrame: [1, 5, 141][index],
        postScreenshotFrame: [1, 5, 142][index],
        operatorDispatch: false,
        causalPredecessorRecordSha256: cutCausalEdge && index === 0 ? adapterRecords.at(-1).recordSha256 : (index === 0 ? randomRecords.at(-1).recordSha256 : previousFrameHash),
        previousRecordSha256: previousEventHash,
      };
      sourceEvent.recordSha256 = sourceDrivenEventRecordSha256(sourceEvent);
      previousEventHash = sourceEvent.recordSha256;
      eventRecords.push(sourceEvent);
    }
    const bytes = testFramePng;
    const screenshotPath = path.join(framesDirectory, `frame-${String(frame).padStart(4, "0")}.png`);
    await writeFile(screenshotPath, bytes);
    const screenshotFile = relative(screenshotPath);
    const screenshotSha256 = digest(bytes);
    const observedState = structuredClone(checkpointByFrame.get(frame) || {rootFrame: 6, localFrame: frame});
    frameDescriptors.push({frame, file: screenshotFile, sha256: screenshotSha256});
    const frameRecord = {
      ...structuredClone(templates.frameRecord),
      ...binding,
      evidenceType: "attested-source-driven-natural-frame-state",
      sequence: frame,
      occurredAt: occurredAt(500 + (frame - 1) * 100),
      monotonicTimeMs: 500 + (frame - 1) * 100,
      frameDomainId: spec.identity.frameDomainId,
      observedRootFrame: 6,
      observedLocalFrame: frame,
      naturallyObservedOutcome: 0,
      naturallyObservedBranch: "sound-0",
      observedState,
      observedStateSha256: sha256Text(canonicalJson(observedState)),
      screenshotFile,
      screenshotSha256,
      precedingSourceEventRecordSha256: sourceEvent?.recordSha256 ?? null,
      previousRecordSha256: previousFrameHash,
    };
    frameRecord.recordSha256 = sourceDrivenFrameStateRecordSha256(frameRecord);
    previousFrameHash = frameRecord.recordSha256;
    frameRecords.push(frameRecord);
  }
  const frameLogPath = path.join(sessionRoot, "frame-states.jsonl");
  const frameLogSha256 = await writeJsonl(frameLogPath, frameRecords);
  const eventLogPath = path.join(sessionRoot, "source-events.jsonl");
  const eventLogSha256 = await writeJsonl(eventLogPath, eventRecords);

  const eventsByFrame = new Map(eventRecords.map((record) => [record.observedTrigger.frame, record]));
  const operationBaseRecords = [];
  for (let frame = 1; frame <= 142; frame += 1) {
    const event = eventsByFrame.get(frame);
    if (event) operationBaseRecords.push({operationKind: "source-event-observed", observedFrame: frame, sourceEventOrder: event.scheduledEventOrder, referencedRecordSha256: event.recordSha256, reference: event});
    const state = frameRecords[frame - 1];
    operationBaseRecords.push({operationKind: "frame-state-observed", observedFrame: frame, sourceEventOrder: null, referencedRecordSha256: state.recordSha256, reference: state});
  }
  const operationRecords = operationBaseRecords.map((item, index) => ({
    ...structuredClone(templates.operationRecord),
    ...binding,
    evidenceType: "attested-source-driven-passive-operation",
    sequence: index + 1,
    occurredAt: item.reference.occurredAt,
    monotonicTimeMs: item.reference.monotonicTimeMs,
    operationKind: item.operationKind,
    observedFrame: item.observedFrame,
    sourceEventOrder: item.sourceEventOrder,
    referencedRecordSha256: item.referencedRecordSha256,
    operatorDispatch: false,
  }));
  let previousOperationHash = cutOperationEdge ? adapterRecords.at(-1).recordSha256 : randomRecords.at(-1).recordSha256;
  for (const record of operationRecords) {
    record.previousRecordSha256 = previousOperationHash;
    record.recordSha256 = sourceDrivenOperationRecordSha256(record);
    previousOperationHash = record.recordSha256;
  }
  const operationLogPath = path.join(sessionRoot, "operations.jsonl");
  const operationLogSha256 = await writeJsonl(operationLogPath, operationRecords);

  const masterEvidenceChain = {
    algorithm: "sha256-canonical-json-source-driven-master-evidence-chain-v1",
    root: {source: "adapterEntryLog.sequence-1.recordSha256", sha256: adapterRecords[0].recordSha256},
    intermediates: [
      ["adapterEntryLog.finalRecordSha256", adapterRecords.at(-1).recordSha256],
      ["randomTrialLog.finalRecordSha256", randomRecords.at(-1).recordSha256],
      ["sourceEventLog.event-1.recordSha256", eventRecords[0].recordSha256],
      ["frameStateLog.frame-0001.recordSha256", frameRecords[0].recordSha256],
      ["frameStateLog.frame-0004.recordSha256", frameRecords[3].recordSha256],
      ["sourceEventLog.event-2.recordSha256", eventRecords[1].recordSha256],
      ["frameStateLog.frame-0005.recordSha256", frameRecords[4].recordSha256],
      ["frameStateLog.frame-0141.recordSha256", frameRecords[140].recordSha256],
      ["sourceEventLog.event-3.recordSha256", eventRecords[2].recordSha256],
      ["frameStateLog.frame-0142.recordSha256", frameRecords[141].recordSha256],
    ].map(([source, sha256], index) => ({sequence: index + 1, source, sha256})),
    final: {source: "operationLog.sequence-145.recordSha256", sha256: operationRecords.at(-1).recordSha256},
  };
  masterEvidenceChain.bindingSha256 = sourceDrivenMasterEvidenceChainBindingSha256(masterEvidenceChain);

  const captureManifestPath = path.join(sessionRoot, "capture-manifest.json");
  const captureManifest = {
    ...structuredClone(templates.captureManifest),
    schemaVersion: 1,
    evidenceType: "attested-source-driven-branch-capture-manifest",
    status: "candidate-input-not-canonical",
    animationId,
    requirementId,
    identity: {frameDomainId: spec.identity.frameDomainId, traceId: spec.identity.traceId, entryStateSha256: spec.identity.entryStateSha256, scenario: spec.identity.scenario, language: spec.identity.language, seed: spec.identity.seed},
    traceSpec: {file: specRelative, sha256: specSha256},
    traceSpecIndex: {file: indexRelative, sha256: indexSha256},
    sourceSwf: spec.sourceBindings.sourceSwf,
    captureKitManifest: {file: relative(kitManifestPath), sha256: kitSha256},
    launchReceipt: {file: relative(launchPath), sha256: launchSha256},
    sessionId,
    acceptedAttemptId: "attempt-0001",
    stage: {width: 800, height: 600},
    fps: 12,
    frameNumbering: "one-indexed",
    frameCount: 142,
    adapterEntryLog: {file: relative(adapterLogPath), sha256: adapterLogSha256, recordCount: 2, finalRecordSha256: adapterRecords.at(-1).recordSha256},
    randomTrialLog: {file: relative(randomLogPath), sha256: randomLogSha256, recordCount: 1, finalRecordSha256: randomRecords.at(-1).recordSha256},
    operationLog: {file: relative(operationLogPath), sha256: operationLogSha256, recordCount: 145, finalRecordSha256: operationRecords.at(-1).recordSha256, operatorDispatchCount: 0},
    sourceEventLog: {file: relative(eventLogPath), sha256: eventLogSha256, recordCount: 3, finalRecordSha256: eventRecords.at(-1).recordSha256},
    frameStateLog: {file: relative(frameLogPath), sha256: frameLogSha256, recordCount: 142, finalRecordSha256: frameRecords.at(-1).recordSha256},
    frames: frameDescriptors.map((frame, index) => ({...frame, width: 800, height: 600, stateRecordSha256: frameRecords[index].recordSha256})),
    orderedFrameSetSha256: orderedFrameSetSha256(frameDescriptors),
    masterEvidenceChain,
    authority: structuredClone(kit.templateContract.authority),
    strictAcceptanceEffect: false,
  };
  const captureManifestSha256 = await writeJson(captureManifestPath, captureManifest);

  const attestationPath = path.join(sessionRoot, "session-attestation.json");
  const attestation = {
    ...structuredClone(templates.attestation),
    schemaVersion: 1,
    evidenceType: "named-human-source-driven-branch-capture-session-attestation",
    sessionId,
    animationId,
    requirementId,
    proofMode: SOURCE_DRIVEN_BRANCH_PROOF_MODE,
    traceSpec: {file: specRelative, sha256: specSha256},
    traceSpecIndex: {file: indexRelative, sha256: indexSha256},
    sourceSwf: spec.sourceBindings.sourceSwf,
    captureKitManifest: {file: relative(kitManifestPath), sha256: kitSha256},
    sandboxProfile: {file: relative(sandboxPath), sha256: sandboxSha256},
    environmentIsolation: {file: relative(environmentPath), sha256: environmentSha256},
    launchReceipt: {file: relative(launchPath), sha256: launchSha256},
    toolchainReceipt: {file: relative(toolchainPath), sha256: toolchainSha256, runtime: toolchain.runtime, captureSessionBinding: toolchain.captureSessionBinding},
    adapterEntry: {fixtureManifestSha256: kit.bindings.fixtureManifest.sha256, adapterHostSha256: adapterDescriptor.sha256, childSwfSha256: spec.sourceBindings.sourceSwf.sha256, childLoadTrigger: "single-named-human-pre-trace-click", childLoadTriggerCount: 1, traceStartedAfterOnLoadInit: true, beginHandoff: "target.gotoAndPlay(\"begin\")", beginHandoffCount: 1, rootFrame: 6, frameDomainId: spec.identity.frameDomainId, localFrame: 1, operatorActionsAfterTraceStart: 0, directSeekUsed: false, frameStepUsed: false, completeOriginalCourseShellClaimed: false},
    naturalRandomObservation: {sourceCall: "random(2)", allowedMethod: "restart-untouched-child-and-classify-naturally-observed-outcome", identitySeed: "0", identitySeedInjectedIntoAvm1: false, seedInjected: false, forcedBranch: false, randomOverridden: false, branchVariableWrittenByAdapter: false, attempts: randomAttempts, acceptedAttemptId: "attempt-0001"},
    adapterEntryLog: {file: relative(adapterLogPath), sha256: adapterLogSha256, recordCount: 2, finalRecordSha256: adapterRecords.at(-1).recordSha256},
    randomTrialLog: {file: relative(randomLogPath), sha256: randomLogSha256, recordCount: 1, finalRecordSha256: randomRecords.at(-1).recordSha256},
    operationLog: {file: relative(operationLogPath), sha256: operationLogSha256, recordCount: 145, finalRecordSha256: operationRecords.at(-1).recordSha256},
    sourceEventLog: {file: relative(eventLogPath), sha256: eventLogSha256, recordCount: 3, finalRecordSha256: eventRecords.at(-1).recordSha256},
    frameStateLog: {file: relative(frameLogPath), sha256: frameLogSha256, recordCount: 142, finalRecordSha256: frameRecords.at(-1).recordSha256},
    captureManifest: {file: relative(captureManifestPath), sha256: captureManifestSha256},
    frameSet: {algorithm: "ordered-frame-path-sha256-v1", frameCount: 142, frames: frameDescriptors, sha256: orderedFrameSetSha256(frameDescriptors)},
    scheduleBinding: scheduleBinding(spec),
    masterEvidenceChain,
    authority: structuredClone(kit.templateContract.authority),
    startedAt: iso(traceStart, 0),
    endedAt: iso(traceStart, 60000),
    signedAt: iso(traceStart, 61000),
    monotonicTimeOrigin: "milliseconds-since-session-start",
    operator,
    unexpectedEvents: [],
    statement: SOURCE_DRIVEN_BRANCH_SESSION_STATEMENT,
    notes: SOURCE_DRIVEN_BRANCH_AUTHORITY_NOTE,
  };
  attestation.attestationSha256 = sourceDrivenSessionAttestationSha256(attestation);
  await writeJson(attestationPath, attestation);

  const options = {
    projectRoot: root,
    spec: specRelative,
    kitManifest: `${kitRelative}/kit-manifest.json`,
    environmentIsolationReceipt: relative(environmentPath),
    launchReceipt: relative(launchPath),
    toolchainReceipt: relative(toolchainPath),
    sessionAttestation: relative(attestationPath),
    adapterEntryLog: relative(adapterLogPath),
    randomTrialLog: relative(randomLogPath),
    operationLog: relative(operationLogPath),
    sourceEventLog: relative(eventLogPath),
    frameStateLog: relative(frameLogPath),
    captureManifest: relative(captureManifestPath),
    frames: relative(framesDirectory),
  };
  const archiveDirectory = path.join(root, "artifacts", "full-frame", "pilot-baselines", animationId, safeId, "pending-human-owner-source-driven-branch");
  const protectedPaths = [
    specPath,
    indexPath,
    path.join(root, "migrations", animationId, "migration.json"),
    path.join(root, "migrations", animationId, "evidence", "full-frame-coverage.json"),
    path.join(root, "migrations", animationId, "audit", "scenario-inventory.json"),
    path.join(root, spec.sourceBindings.sourceSwf.path),
  ];
  const protectedHashes = new Map();
  for (const candidate of protectedPaths) protectedHashes.set(candidate, digest(await readFile(candidate)));
  const canonicalBaseline = path.join(root, "migrations", animationId, "baseline", "original-runtime", `${safeId}.json`);
  const canonicalExecution = path.join(root, "migrations", animationId, spec.executionEvidence.expectedExecutionReportPath);
  return {
    root,
    options,
    approvedRuntime,
    spec,
    kit,
    attestation,
    attestationPath,
    operationLogPath,
    operationRecords,
    randomLogPath,
    randomRecords,
    eventLogPath,
    eventRecords,
    framesDirectory,
    pendingDirectory,
    candidateManifestPath: path.join(pendingDirectory, "candidate-manifest.json"),
    candidateReportPath: path.join(pendingDirectory, "candidate-report.json"),
    archiveDirectory,
    protectedHashes,
    canonicalBaseline,
    canonicalExecution,
    preservedSourcePath: path.join(root, spec.sourceBindings.sourceSwf.path),
    stagedChildPath: path.join(root, kitRelative, tree.files.find(({role}) => role === "exact-preserved-child").destination),
  };
}

function prepareFixture(fixture, options = fixture.options, hooks = {}) {
  return prepareSourceDrivenBranchCandidate(options, {hooks, testOnlyApprovedRuntime: fixture.approvedRuntime});
}

test("production source-driven specs retain the accepted schedule contract", async () => {
  const relatives = [
    "migrations/course-g03-l06-ti-001/audit/trace-specs/req-sprite-21-sound-0-en.json",
    "migrations/course-g03-l06-ti-001/audit/trace-specs/req-sprite-21-sound-1-en.json",
    "migrations/course-g04-l01-ir-001/audit/trace-specs/req-sprite-58-sound-0-en.json",
    "migrations/course-g04-l01-ir-001/audit/trace-specs/req-sprite-58-sound-1-en.json",
  ];
  for (const relative of relatives.slice(0, 2)) validateSourceDrivenBranchSpec(JSON.parse(await readFile(path.join(repositoryRoot, relative), "utf8")));
  for (const relative of relatives.slice(2)) {
    const spec = JSON.parse(await readFile(path.join(repositoryRoot, relative), "utf8"));
    assert.throws(() => validateSourceDrivenBranchSpec(spec), /capture is blocked/);
  }
  const mutated = JSON.parse(await readFile(path.join(repositoryRoot, relatives[0]), "utf8"));
  mutated.sourceBindings.scheduleDerivation.naturalRandomPolicy.seedInjectionAllowed = true;
  assert.throws(() => validateSourceDrivenBranchSpec(mutated), /natural random policy changed/);
});

test("CLI refuses authority-changing or branch-injection switches", () => {
  assert.throws(() => parseArguments(["--seed", "1"]), /Unknown option: --seed/);
  assert.throws(() => parseArguments(["--promote"]), /Unknown option: --promote/);
});

test("unsigned template files are never accepted as session evidence", {timeout: 120000}, async () => {
  const fixture = await makeFixture();
  try {
    await assert.rejects(() => prepareFixture(fixture, {
      ...fixture.options,
      environmentIsolationReceipt: `${kitRelative}/templates/environment-isolation-receipt.template.json`,
    }), /must be a real session artifact, not an unsigned template\/schema file/);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("an explicitly requested missing temp-fixture kit remains ineligible", {timeout: 120000}, async () => {
  const fixture = await makeFixture();
  try {
    await assert.rejects(() => prepareFixture(fixture, {
      ...fixture.options,
      kitManifest: `${kitRelative}/missing-kit-manifest.json`,
    }), /--kit-manifest is missing/);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("production repository root rejects test-only runtime injection before reading evidence", async () => {
  await assert.rejects(
    () => prepareSourceDrivenBranchCandidate({projectRoot: repositoryRoot}, {testOnlyApprovedRuntime: {
      runtimeId: "test-runtime",
      name: "test runtime",
      version: "0",
      executableSha256: "0".repeat(64),
    }}),
    /testOnlyApprovedRuntime is forbidden for the production repository root/,
  );
});

test("rejects a fixture manifest that is not the exact shared-profile identity", {timeout: 120000}, async () => {
  const fixture = await makeFixture();
  const manifestPath = path.join(fixture.root, tiProfile.fixtureManifest);
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.fixtureDigest = "0".repeat(64);
    await chmod(manifestPath, 0o644);
    await writeJson(manifestPath, manifest);
    await chmod(manifestPath, 0o444);
    await assert.rejects(() => prepareFixture(fixture), /fixture manifest is not the exact shared-profile identity/);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects a self-rehashed template that differs from the deterministic v3 scaffold", {timeout: 120000}, async () => {
  const fixture = await makeFixture();
  const templateRelative = "templates/random-trial-log.schema.template.jsonl";
  const templatePath = path.join(fixture.root, kitRelative, templateRelative);
  const manifestPath = path.join(fixture.root, kitRelative, "kit-manifest.json");
  try {
    const bytes = Buffer.from("{\"fake\":true}\n");
    await chmod(templatePath, 0o644);
    await writeFile(templatePath, bytes);
    await chmod(templatePath, 0o444);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.templateContract.files.find(({file}) => file === templateRelative).sha256 = digest(bytes);
    await chmod(manifestPath, 0o644);
    await writeJson(manifestPath, manifest);
    await chmod(manifestPath, 0o444);
    await assert.rejects(() => prepareFixture(fixture), /deterministic v3 kit file differs|capture kit file set differs/);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("IR spec fails closed from the shared captureEligible profile before kit lookup", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "source-driven-ir-blocked-"));
  const irSpec = DEFAULT_SOURCE_DRIVEN_BRANCH_PROFILES[1].specs[0].specFile;
  try {
    await copyRelative(root, irSpec);
    const options = Object.fromEntries([
      "kitManifest", "environmentIsolationReceipt", "launchReceipt", "toolchainReceipt", "sessionAttestation",
      "adapterEntryLog", "randomTrialLog", "operationLog", "sourceEventLog", "frameStateLog", "captureManifest", "frames",
    ].map((field) => [field, "missing"]));
    await assert.rejects(
      () => prepareSourceDrivenBranchCandidate({projectRoot: root, spec: irSpec, ...options}),
      /capture is blocked/,
    );
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("rejects a fully rehashed accepted random observation placed after the natural trace", {timeout: 120000}, async () => {
  const fixture = await makeFixture({randomTime: 20000});
  try {
    await assert.rejects(() => prepareFixture(fixture), /event 1 does not strictly follow its causal predecessor/);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects a cut random-to-event causal edge even when all local hashes are recomputed", {timeout: 120000}, async () => {
  const fixture = await makeFixture({cutCausalEdge: true});
  try {
    await assert.rejects(() => prepareFixture(fixture), /event 1 cross-stream causal predecessor changed/);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects a cut adapter-to-random causal edge with a recomputed random record", {timeout: 120000}, async () => {
  const fixture = await makeFixture({cutRandomEdge: true});
  try {
    await assert.rejects(() => prepareFixture(fixture), /random trial 1 hash chain is invalid/);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects a cut random-to-operation-root edge with all 145 operations recomputed", {timeout: 120000}, async () => {
  const fixture = await makeFixture({cutOperationEdge: true});
  try {
    await assert.rejects(() => prepareFixture(fixture), /operation 1 hash chain is invalid/);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects a random record whose wall clock does not strictly advance past adapter entry", {timeout: 120000}, async () => {
  const fixture = await makeFixture({randomTime: 200.5});
  try {
    await assert.rejects(() => prepareFixture(fixture), /random trial 1\.occurredAt is invalid, non-increasing/);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects two natural random attempts in one accepted session", {timeout: 120000}, async () => {
  const fixture = await makeFixture({randomAttemptCount: 2});
  try {
    await assert.rejects(() => prepareFixture(fixture), /exactly one natural random attempt/);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects an oversized PNG before decoding it", {timeout: 120000}, async () => {
  const fixture = await makeFixture();
  try {
    await writeFile(path.join(fixture.framesDirectory, "frame-0001.png"), Buffer.alloc(16 * 1024 * 1024 + 1));
    await assert.rejects(() => prepareFixture(fixture), /single-file byte limit/);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("preparer rejects manipulation, rolls back atomically, then publishes only a pending candidate", {timeout: 120000}, async () => {
  const fixture = await makeFixture();
  try {
    const manipulated = structuredClone(fixture.attestation);
    manipulated.naturalRandomObservation.seedInjected = true;
    manipulated.attestationSha256 = sourceDrivenSessionAttestationSha256(manipulated);
    await writeJson(fixture.attestationPath, manipulated);
    await assert.rejects(() => prepareFixture(fixture), /seeded, forced, overridden, or written/);
    await assert.rejects(() => readFile(fixture.pendingDirectory), /ENOENT|EISDIR/);

    fixture.attestation.attestationSha256 = sourceDrivenSessionAttestationSha256(fixture.attestation);
    await writeJson(fixture.attestationPath, fixture.attestation);
    const manipulatedOperations = structuredClone(fixture.operationRecords);
    manipulatedOperations[0].operatorDispatch = true;
    await writeJsonl(fixture.operationLogPath, manipulatedOperations);
    await assert.rejects(() => prepareFixture(fixture), /operation 1 was operator-dispatched/);
    await writeJsonl(fixture.operationLogPath, fixture.operationRecords);

    await assert.rejects(() => prepareFixture(fixture, fixture.options, {afterArchive: async () => { throw new Error("injected rollback"); }}), /injected rollback/);
    await assert.rejects(() => readFile(fixture.archiveDirectory), /ENOENT|EISDIR/);
    await assert.rejects(() => readFile(fixture.pendingDirectory), /ENOENT|EISDIR/);

    const result = await prepareFixture(fixture);
    assert.equal(result.status, "attested-candidate-pending-human-owner");
    assert.equal(result.strictAcceptanceEffect, false);
    assert.equal(result.frameCount, 142);
    assert.equal(result.operationRecordCount, 145);
    assert.equal(result.operatorDispatchCount, 0);
    const report = JSON.parse(await readFile(path.join(fixture.pendingDirectory, "candidate-report.json"), "utf8"));
    assert.equal(report.authorityBoundary.canonicalBaselineCreated, false);
    assert.equal(report.authorityBoundary.canonicalExecutionCreated, false);
    assert.equal(report.authorityBoundary.ownerAcceptanceRecorded, false);
    assert.equal((await lstat(fixture.candidateManifestPath)).mode & 0o777, 0o444);
    assert.equal((await lstat(fixture.candidateReportPath)).mode & 0o777, 0o444);
    assert.equal((await lstat(fixture.archiveDirectory)).mode & 0o777, 0o755);
    const archiveEntries = await readdir(fixture.archiveDirectory, {withFileTypes: true});
    assert.ok(archiveEntries.length > 142);
    assert.ok(archiveEntries.every((entry) => entry.isFile()));
    for (const entry of archiveEntries) assert.equal((await lstat(path.join(fixture.archiveDirectory, entry.name))).mode & 0o777, 0o444);
    for (const [candidate, expected] of fixture.protectedHashes) assert.equal(digest(await readFile(candidate)), expected);
    await assert.rejects(() => readFile(fixture.canonicalBaseline), /ENOENT/);
    await assert.rejects(() => readFile(fixture.canonicalExecution), /ENOENT/);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects a frames/pending-output overlap before publishing", {timeout: 120000}, async () => {
  const fixture = await makeFixture({framesInPending: true});
  try {
    const before = (await readdir(fixture.framesDirectory)).sort();
    await assert.rejects(
      () => prepareFixture(fixture),
      /source (?:frame 1|driven frames directory) overlaps source-driven pending output/,
    );
    assert.deepEqual((await readdir(fixture.framesDirectory)).sort(), before);
    await assert.rejects(() => readFile(fixture.candidateManifestPath), {code: "ENOENT"});
    await assert.rejects(() => lstat(fixture.archiveDirectory), {code: "ENOENT"});
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("parent dev:ino CAS rejects a pending-parent symlink swap without touching canonical evidence", {timeout: 120000}, async () => {
  const fixture = await makeFixture();
  const canonicalDirectory = path.dirname(fixture.canonicalBaseline);
  const sentinel = path.join(canonicalDirectory, "canonical-sentinel.txt");
  try {
    await mkdir(canonicalDirectory, {recursive: true});
    await writeFile(sentinel, "canonical sentinel\n");
    await assert.rejects(
      () => prepareFixture(fixture, fixture.options, {
        afterArchive: async ({pendingDirectory}) => {
          await rmdir(pendingDirectory);
          await symlink(canonicalDirectory, pendingDirectory, "dir");
        },
      }),
      /contains forbidden symbolic-link component|directory identity changed/,
    );
    assert.deepEqual(await readdir(canonicalDirectory), ["canonical-sentinel.txt"]);
    assert.equal(await readFile(sentinel, "utf8"), "canonical sentinel\n");
    await assert.rejects(() => lstat(fixture.archiveDirectory), {code: "ENOENT"});
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("archive publication is no-replace and preserves a concurrent sentinel", {timeout: 120000}, async () => {
  const fixture = await makeFixture();
  const sentinel = path.join(fixture.archiveDirectory, "replacement-sentinel.txt");
  try {
    await assert.rejects(
      () => prepareFixture(fixture, fixture.options, {
        beforeArchivePublish: async ({archiveDirectory}) => {
          await mkdir(archiveDirectory, {recursive: false});
          await writeFile(sentinel, "do not replace\n");
        },
      }),
      /EEXIST|file already exists/,
    );
    assert.equal(await readFile(sentinel, "utf8"), "do not replace\n");
    assert.deepEqual(await readdir(fixture.archiveDirectory), ["replacement-sentinel.txt"]);
    await assert.rejects(() => readFile(fixture.candidateManifestPath), {code: "ENOENT"});
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rollback never deletes an archive-directory replacement sentinel", {timeout: 120000}, async () => {
  const fixture = await makeFixture();
  const displacedArchive = `${fixture.archiveDirectory}.owned-by-interrupted-transaction`;
  const sentinel = path.join(fixture.archiveDirectory, "replacement-sentinel.txt");
  try {
    await assert.rejects(
      () => prepareFixture(fixture, fixture.options, {
        afterArchive: async ({archiveDirectory}) => {
          await rename(archiveDirectory, displacedArchive);
          await mkdir(archiveDirectory, {recursive: false});
          await writeFile(sentinel, "foreign replacement\n");
          throw new Error("injected replacement rollback");
        },
      }),
      /injected replacement rollback/,
    );
    assert.equal(await readFile(sentinel, "utf8"), "foreign replacement\n");
    assert.ok((await readdir(displacedArchive)).length > 142);
    await assert.rejects(() => readFile(fixture.candidateManifestPath), {code: "ENOENT"});
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("post-publication manifest tampering fails verification and is not mistaken for owned rollback data", {timeout: 120000}, async () => {
  const fixture = await makeFixture();
  try {
    await assert.rejects(
      () => prepareFixture(fixture, fixture.options, {
        afterManifest: async ({candidateManifestPath}) => {
          await chmod(candidateManifestPath, 0o644);
          await writeFile(candidateManifestPath, "replacement manifest sentinel\n");
        },
      }),
      /candidate manifest SHA-256 changed/,
    );
    assert.equal(await readFile(fixture.candidateManifestPath, "utf8"), "replacement manifest sentinel\n");
    await assert.rejects(() => readFile(fixture.candidateReportPath), {code: "ENOENT"});
    await assert.rejects(() => lstat(fixture.archiveDirectory), {code: "ENOENT"});
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects a staged-child hardlink alias to the preserved source", {timeout: 120000}, async () => {
  const fixture = await makeFixture();
  try {
    await chmod(fixture.preservedSourcePath, 0o444);
    await rm(fixture.stagedChildPath);
    await link(fixture.preservedSourcePath, fixture.stagedChildPath);
    await assert.rejects(
      () => prepareFixture(fixture),
      /must not be hard-linked|hard-links protected input/,
    );
    assert.equal(digest(await readFile(fixture.preservedSourcePath)), fixture.spec.sourceBindings.sourceSwf.sha256);
    await assert.rejects(() => readFile(fixture.candidateManifestPath), {code: "ENOENT"});
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});
