import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {PNG} from "pngjs";

import {
  parseArguments,
  prepareTs006RuntimeCapturePendingCandidate,
  stableJson,
} from "./prepare-g4-l3-ts006-runtime-capture-pending-candidate.mjs";

const TEST_FILE = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = path.resolve(path.dirname(TEST_FILE), "..");
const SCRIPT_SOURCE = path.join(REPOSITORY_ROOT, "scripts/prepare-g4-l3-ts006-runtime-capture-pending-candidate.mjs");
const PROJECTOR = "/Applications/Adobe Animate 2021/Players/Flash Player.app/Contents/MacOS/Flash Player";
const PROJECTOR_SHA256 = "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30";
const SOURCE_SHELL = path.join(REPOSITORY_ROOT, "work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/index_local.swf");
const SOURCE_CHILD = path.join(REPOSITORY_ROOT, "work/original-runtime-host-trees/course-g04-l03-ts-006/root/HELP_COURSES/ELMGR4/L3/TS/L3TS06.swf");
const SESSION_ID = "ts006-en-00000000-0000-4000-8000-000000000001";
const PID = 4242;
const CAPTURE_NAME = "natural-trace-en-001";
const NETTOP_HEADER = "time,,interface,state,bytes_in,bytes_out,rx_dupe,rx_ooo,re-tx,rtt_avg,rcvsize,tx_win,tc_class,tc_mgt,cc_algo,P,C,R,W,arch,";
const PROJECTOR_WARNING = `2026-07-26 10:00:02.123 Flash Player[${PID}:12345] error messaging the mach port for IMKCFRunLoopWakeUpReliable\n`;

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function pretty(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function fingerprint(value, field) {
  const {[field]: ignored, ...without} = value;
  void ignored;
  return sha256(stableJson(without));
}

function stablePretty(value) {
  const sort = (item) => {
    if (Array.isArray(item)) return item.map(sort);
    if (item && typeof item === "object") return Object.fromEntries(Object.keys(item).sort().map((key) => [key, sort(item[key])]));
    return item;
  };
  return `${JSON.stringify(sort(value), null, 2)}\n`;
}

async function fileDescriptor(root, candidate) {
  const bytes = await readFile(candidate);
  return {path: path.relative(root, candidate).split(path.sep).join("/"), bytes: bytes.length, sha256: sha256(bytes)};
}

async function absoluteDescriptor(candidate) {
  const bytes = await readFile(candidate);
  return {path: candidate, bytes: bytes.length, sha256: sha256(bytes)};
}

async function writeJson(candidate, value) {
  await mkdir(path.dirname(candidate), {recursive: true});
  await writeFile(candidate, pretty(value));
}

function makePng(red) {
  const png = new PNG({width: 800, height: 600});
  for (let index = 0; index < png.data.length; index += 4) {
    png.data[index] = red;
    png.data[index + 1] = 20;
    png.data[index + 2] = 30;
    png.data[index + 3] = 255;
  }
  return PNG.sync.write(png);
}

async function prerequisitesAvailable() {
  try {
    const [projector, shell, child] = await Promise.all([readFile(PROJECTOR), readFile(SOURCE_SHELL), readFile(SOURCE_CHILD)]);
    return sha256(projector) === PROJECTOR_SHA256 && sha256(shell) === "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e" && sha256(child) === "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47";
  } catch {
    return false;
  }
}

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "ts006-pending-candidate-"));
  const sessionRoot = path.join(root, "artifacts/full-frame/g4-l3", SESSION_ID);
  const logsRoot = path.join(sessionRoot, "evidence/logs");
  const captureRoot = path.join(sessionRoot, "evidence/raw-captures", CAPTURE_NAME);
  const runtimeProfile = path.join(sessionRoot, "runtime-profile");
  const hostRoot = path.join(root, "work/original-runtime-host-trees/course-g04-l03-ts-006/root");
  const shellPath = path.join(hostRoot, "HELP_COURSES/ELMGR4/L3/index_local.swf");
  const childPath = path.join(hostRoot, "HELP_COURSES/ELMGR4/L3/TS/L3TS06.swf");
  const scriptPath = path.join(root, "scripts/prepare-g4-l3-ts006-runtime-capture-pending-candidate.mjs");
  await Promise.all([
    mkdir(logsRoot, {recursive: true}),
    mkdir(path.join(captureRoot, "frames"), {recursive: true}),
    mkdir(runtimeProfile, {recursive: true}),
    mkdir(path.dirname(shellPath), {recursive: true}),
    mkdir(path.dirname(childPath), {recursive: true}),
    mkdir(path.dirname(scriptPath), {recursive: true}),
    mkdir(path.join(root, "migrations/course-g04-l03-ts-006/audit/trace-specs"), {recursive: true}),
    mkdir(path.join(root, "migrations/course-g04-l03-ts-006/baseline/trace-executions"), {recursive: true}),
    mkdir(path.join(root, "work/session-kits/en"), {recursive: true}),
    mkdir(path.join(root, "work/capture-tool"), {recursive: true}),
    mkdir(path.join(root, "catalog"), {recursive: true}),
  ]);
  await Promise.all([
    copyFile(SOURCE_SHELL, shellPath),
    copyFile(SOURCE_CHILD, childPath),
    copyFile(SCRIPT_SOURCE, scriptPath),
  ]);
  const sandboxPath = path.join(runtimeProfile, "sandbox.sb");
  const captureToolPath = path.join(root, "work/capture-tool/g4-l3-runtime-capture");
  const sessionKitPath = path.join(root, "work/session-kits/en/kit-manifest.json");
  await Promise.all([
    writeFile(sandboxPath, "(version 1)\n(deny network*)\n"),
    writeFile(captureToolPath, "hash-bound ScreenCaptureKit fixture\n"),
    writeJson(sessionKitPath, {schemaVersion: 1, evidenceType: "test-empty-session-kit", acceptanceEffect: "none"}),
    writeJson(path.join(root, "catalog/completion-ledger.json"), {strictComplete: 0}),
    writeJson(path.join(root, "migrations/course-g04-l03-ts-006/evidence-full-frame-coverage.json"), {status: "pending"}),
  ]);

  const hostManifestPath = path.join(hostRoot, "staging-manifest.json");
  const shellDescriptor = await absoluteDescriptor(shellPath);
  const childDescriptor = await absoluteDescriptor(childPath);
  const hostWithoutFingerprint = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-read-only-original-runtime-host-tree",
    stagedRoot: {
      path: "work/original-runtime-host-trees/course-g04-l03-ts-006/root",
      regularCopiedFilesOnly: true,
      hardLinks: 0,
      symbolicLinks: 0,
    },
    files: [
      {path: "HELP_COURSES/ELMGR4/L3/index_local.swf", bytes: shellDescriptor.bytes, sha256: shellDescriptor.sha256},
      {path: "HELP_COURSES/ELMGR4/L3/TS/L3TS06.swf", bytes: childDescriptor.bytes, sha256: childDescriptor.sha256},
    ],
  };
  await writeJson(hostManifestPath, {...hostWithoutFingerprint, manifestFingerprintSha256: sha256(stablePretty(hostWithoutFingerprint))});

  const requirementRows = [];
  for (const frameDomainId of ["root", "sprite-23"]) {
    const requirementId = `req:${frameDomainId}:lesson-shell-natural-entry:en`;
    const safe = requirementId.replaceAll(":", "-");
    const traceId = `trace:${frameDomainId}:lesson-shell-natural-entry:en:seed-0`;
    const entryStateSha256 = sha256(Buffer.from(`entry-${frameDomainId}`));
    const expectedExecutionReport = `migrations/course-g04-l03-ts-006/baseline/trace-executions/${safe}.json`;
    const specPath = path.join(root, `migrations/course-g04-l03-ts-006/audit/trace-specs/${safe}.json`);
    const spec = {
      schemaVersion: 1,
      artifactType: "course-pilot-original-runtime-trace-specification",
      animationId: "course-g04-l03-ts-006",
      requirementId,
      traceSpecStatus: "unresolved",
      identity: {
        traceId,
        frameDomainId,
        entryStateSha256,
        scenario: frameDomainId === "root" ? "root-unavailable" : "source-static-frame",
        language: "en",
        seed: "0",
        baselineAuthorityRequirement: "original-runtime-natural-trace",
      },
      frameDomain: {id: frameDomainId, nativeStage: {width: 800, height: 600}, fps: 12},
      schedule: {orderedSteps: Array.from({length: 9}, (_, index) => ({order: index + 1})), executedSteps: []},
      sourceBindings: {sourceSwf: {sha256: "fa8962a6ca72c0bb213605a9836b62600992cb5c1cf955f7c871e857e90ddf47"}},
    };
    await writeJson(specPath, spec);
    const specDescriptor = await fileDescriptor(root, specPath);
    requirementRows.push({
      requirementId,
      traceId,
      frameDomainId,
      scenario: spec.identity.scenario,
      language: "en",
      seed: "0",
      traceSpecStatus: "unresolved",
      file: specDescriptor.path,
      bytes: specDescriptor.bytes,
      sha256: specDescriptor.sha256,
      entryStateSha256,
      orderedStepCount: 9,
      executedStepCount: 0,
      expectedExecutionReport,
    });
  }
  const traceIndexPath = path.join(root, "migrations/course-shell-pilot-trace-spec-index.json");
  await writeJson(traceIndexPath, {
    schemaVersion: 1,
    artifactType: "course-shell-pilot-trace-spec-index",
    pilots: [{
      animationId: "course-g04-l03-ts-006",
      traceSpecs: requirementRows.map(({bytes, entryStateSha256, orderedStepCount, executedStepCount, traceSpecStatus, ...row}) => ({...row, status: traceSpecStatus})),
    }],
  });
  const traceIndexDescriptor = await fileDescriptor(root, traceIndexPath);

  const profilePath = path.join(sessionRoot, "profile-manifest.json");
  const sessionKitDescriptor = await fileDescriptor(root, sessionKitPath);
  const sandboxDescriptor = await absoluteDescriptor(sandboxPath);
  const profileWithoutFingerprint = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-empty-current-account-disposable-runtime-profile",
    status: "empty-profile-candidate-not-authorized-not-launched",
    animationId: "course-g04-l03-ts-006",
    language: "en",
    sessionId: SESSION_ID,
    sourceBindings: {sessionKit: sessionKitDescriptor},
    sandbox: {path: sandboxPath, bytes: sandboxDescriptor.bytes, sha256: sandboxDescriptor.sha256},
    acceptance: {
      acceptanceNeutral: true,
      authoritativeOriginalRuntimeTrace: false,
      baselineAccepted: false,
      audioAccepted: false,
      humanVisualAccepted: false,
      ownerAccepted: false,
      strictMigrationComplete: false,
      publicRelease: false,
    },
  };
  await writeJson(profilePath, {...profileWithoutFingerprint, manifestFingerprintSha256: sha256(stableJson(profileWithoutFingerprint))});
  const profileDescriptor = await fileDescriptor(root, profilePath);
  const hostDescriptor = await fileDescriptor(root, hostManifestPath);
  const toolDescriptor = await fileDescriptor(root, captureToolPath);
  const projectorDescriptor = await absoluteDescriptor(PROJECTOR);

  const acceptance = {
    acceptanceNeutral: true,
    authoritativeOriginalRuntimeTrace: false,
    baselineAccepted: false,
    audioAccepted: false,
    humanVisualAccepted: false,
    ownerAccepted: false,
    strictMigrationComplete: false,
    publicRelease: false,
  };
  const preflightSourceWithoutFingerprint = {
    schemaVersion: 1,
    reportType: "g4-l3-ts006-pending-candidate-runtime-preflight",
    sourceBindings: {hostTree: hostDescriptor},
    toolBindings: {projector: projectorDescriptor, captureTool: toolDescriptor},
    selectedProfiles: [{language: "en", sessionId: SESSION_ID, manifest: profileDescriptor, sandbox: sandboxDescriptor}],
    observed: {livePidNetworkAuditRequired: true, capacityPassed: true},
    executionGate: {pendingCandidateRuntimeLaunchReady: true, promotableRuntimeLaunchReady: false},
    acceptance,
  };
  const preflightPath = path.join(logsRoot, "preflight.json");
  await writeJson(preflightPath, {
    ...preflightSourceWithoutFingerprint,
    reportFingerprintSha256: sha256(stableJson(preflightSourceWithoutFingerprint)),
    sessionId: SESSION_ID,
    language: "en",
    copiedToSessionAt: "2026-07-26T10:00:00.000Z",
  });
  const preflightDescriptor = await fileDescriptor(root, preflightPath);

  const launchWithoutFingerprint = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-pending-candidate-projector-process-launch-receipt",
    status: "process-started-shell-not-opened",
    animationId: "course-g04-l03-ts-006",
    language: "en",
    sessionId: SESSION_ID,
    pid: PID,
    startedAt: "2026-07-26T10:00:01.000Z",
    executable: PROJECTOR,
    sandboxPath,
    preflightSha256: preflightDescriptor.sha256,
    workingDirectory: hostRoot,
    argv: [PROJECTOR],
    commandLineSwfArgumentUsed: false,
    shellOpenedByLauncher: false,
    guiFileOpenObserved: false,
    traceSpecificationBindings: {
      index: traceIndexDescriptor,
      requirements: requirementRows,
      executionReportsPresent: false,
      authority: "pending-candidate-specification-only",
    },
    flashProjectorProcessStarted: true,
    runtimeSessionExecuted: false,
    captureAuthority: "pending-candidate-only",
    promotionEligible: false,
    acceptanceEffect: "none",
  };
  const launchPath = path.join(logsRoot, "launch-receipt.json");
  await writeJson(launchPath, {...launchWithoutFingerprint, receiptFingerprintSha256: sha256(stableJson(launchWithoutFingerprint))});

  const exitWithoutFingerprint = {
    schemaVersion: 1,
    evidenceType: "g4-l3-ts006-pending-candidate-projector-exit-receipt",
    sessionId: SESSION_ID,
    language: "en",
    pid: PID,
    startedAt: launchWithoutFingerprint.startedAt,
    endedAt: "2026-07-26T10:00:06.000Z",
    exitCode: 0,
    exitSignal: null,
    completeExitObserved: true,
    runtimeSessionExecuted: false,
    authoritativeTraceClaimed: false,
    promotionEligible: false,
    acceptanceEffect: "none",
  };
  await writeJson(path.join(logsRoot, "exit-receipt.json"), {...exitWithoutFingerprint, receiptFingerprintSha256: sha256(stableJson(exitWithoutFingerprint))});

  const frameOne = makePng(10);
  const frameTwo = makePng(11);
  const frameAlphaMaskSha256 = sha256(Buffer.alloc(800 * 600, 255));
  await Promise.all([
    writeFile(path.join(captureRoot, "frames/frame-000001.png"), frameOne),
    writeFile(path.join(captureRoot, "frames/frame-000002.png"), frameTwo),
  ]);
  const audioBytes = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypM4A "), Buffer.from("lossless-audio-fixture")]);
  await writeFile(path.join(captureRoot, "system-audio-lossless.m4a"), audioBytes);
  const captureManifest = {
    schemaVersion: 1,
    evidenceType: "g4-l3-lossless-window-frame-and-system-audio-capture",
    status: "raw-capture-not-yet-bound-to-runtime-trace",
    window: {windowID: 99, ownerName: "Flash Player", title: `file://${shellPath}`, frameX: 0, frameY: 30, frameWidth: 800, frameHeight: 628, onScreen: true},
    display: {displayID: 1, frameX: 0, frameY: 0, frameWidth: 1920, frameHeight: 1080, includedProcessID: PID, includedApplicationName: "Flash Player", includedBundleIdentifier: "com.macromedia.Flash Player.app"},
    configuration: {
      fps: "12",
      outputWidth: "800",
      outputHeight: "600",
      sourceRect: "0.0,28.0,800.0,600.0",
      resolvedDisplaySourceRect: "0.0,58.0,800.0,600.0",
      pixelFormat: "BGRA",
      windowShadows: "display-window-framing-excluded",
      alphaMaskInvariant: "stable-full-frame-mask-with-only-native-18px-bottom-corners-non-opaque",
      cursor: "excluded",
      audio: "system-audio-48kHz-2ch-ALAC",
      sourceKind: "waited-first-window-exact-pid",
      waitForPidSeconds: "120.0",
      minimumWindowWidth: "800",
      minimumWindowHeight: "600",
    },
    startedAt: "2026-07-26T10:00:02.000Z",
    endedAt: "2026-07-26T10:00:04.000Z",
    frames: [
      {ordinal: 1, file: "frames/frame-000001.png", bytes: frameOne.length, sha256: sha256(frameOne), width: 800, height: 600, presentationTimeSeconds: 100, relativeTimeSeconds: 0, status: "complete"},
      {ordinal: 2, file: "frames/frame-000002.png", bytes: frameTwo.length, sha256: sha256(frameTwo), width: 800, height: 600, presentationTimeSeconds: 100 + (1 / 12), relativeTimeSeconds: 1 / 12, status: "complete"},
    ],
    frameAlphaMaskSha256,
    audio: {
      bufferCount: 2,
      inputPayloadBytes: 4096,
      inputNonZeroBytes: 10,
      inputContainsNonZeroAudio: true,
      firstPresentationTimeSeconds: 100,
      lastPresentationTimeSeconds: 100.08,
      outputFile: "system-audio-lossless.m4a",
      outputBytes: audioBytes.length,
      outputSha256: sha256(audioBytes),
      codec: "Apple Lossless Audio Codec",
      sampleRate: 48000,
      channels: 2,
    },
    droppedOrIncompleteFrameCount: 0,
    runtimeAuthorityClaimed: false,
    acceptanceEffect: "none",
  };
  await writeJson(path.join(captureRoot, "capture-manifest.json"), captureManifest);
  await Promise.all([
    writeFile(path.join(logsRoot, "projector.stdout.log"), ""),
    writeFile(path.join(logsRoot, "projector.stderr.log"), PROJECTOR_WARNING),
    writeFile(path.join(logsRoot, "lsof-network-pre.txt"), ""),
    writeFile(path.join(logsRoot, "nettop.csv"), `${NETTOP_HEADER}\n${NETTOP_HEADER.slice(0, 20)}`),
    writeFile(path.join(logsRoot, "nettop.stderr.log"), ""),
    writeFile(path.join(logsRoot, "lsof-network-post.txt"), ""),
  ]);
  return {root, sessionRoot, captureRoot, logsRoot, scriptPath};
}

async function writeInitializedEmptyNaturalTraceRecorder(fixture) {
  const bundleRoot = path.join(
    fixture.sessionRoot,
    "evidence/natural-trace-logs",
    CAPTURE_NAME,
  );
  await mkdir(path.join(bundleRoot, "transactions"), {recursive: true});
  const captureBinding = {
    sessionId: SESSION_ID,
    captureName: CAPTURE_NAME,
    captureDirectory: CAPTURE_NAME,
    captureManifestFile: "capture-manifest.json",
    bindingStatus: "capture-name-bound-manifest-hash-pending-until-complete-verification",
  };
  await Promise.all([
    writeJson(path.join(bundleRoot, "session-contract.json"), {
      schemaVersion: 1,
      artifactType: "ts006-natural-trace-session-contract",
      animationId: "course-g04-l03-ts-006",
      language: "en",
      sessionId: SESSION_ID,
    }),
    writeJson(path.join(bundleRoot, "recorder-manifest.json"), {
      schemaVersion: 1,
      artifactType: "ts006-natural-trace-append-only-recorder",
      status: "initialized-pending-candidate-only",
      animationId: "course-g04-l03-ts-006",
      language: "en",
      sessionId: SESSION_ID,
      captureBinding,
      machineClaim: {
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
    }),
    writeFile(path.join(bundleRoot, "operation.jsonl"), ""),
    writeFile(path.join(bundleRoot, "state.jsonl"), ""),
    writeFile(path.join(bundleRoot, "source-target.jsonl"), ""),
    writeFile(path.join(bundleRoot, "host-entry.jsonl"), ""),
  ]);
  return bundleRoot;
}

const integrationReady = await prerequisitesAvailable();

test("parseArguments exposes only the fixed pending-candidate inputs", () => {
  assert.deepEqual(parseArguments(["--session-root", "/tmp/session", "--capture", "capture-001", "--check"]), {
    projectRoot: REPOSITORY_ROOT,
    sessionRoot: "/tmp/session",
    captureName: "capture-001",
    check: true,
  });
  assert.throws(() => parseArguments(["--session-root", "/tmp/session", "--capture", "../escape"]), /safe direct-child/);
});

test("bridge writes and rechecks an append-only, authority-neutral candidate", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const coveragePath = path.join(fixture.root, "migrations/course-g04-l03-ts-006/evidence-full-frame-coverage.json");
  const ledgerPath = path.join(fixture.root, "catalog/completion-ledger.json");
  const before = await Promise.all([readFile(coveragePath), readFile(ledgerPath)]);
  const result = await prepareTs006RuntimeCapturePendingCandidate({
    projectRoot: fixture.root,
    sessionRoot: fixture.sessionRoot,
    captureName: CAPTURE_NAME,
    scriptPath: fixture.scriptPath,
  });
  assert.equal(result.candidate.status, "pending-candidate-unresolved-trace-specifications");
  assert.equal(result.candidate.process.pid, PID);
  assert.equal(result.candidate.machineVerification.exactLaunchedPidBoundByScreenCaptureKit, true);
  assert.equal(result.candidate.networkAudit.projectorStderrSummary.exactPidBoundInputMethodKitDiagnosticCount, 1);
  assert.equal(result.candidate.authority.authoritativeOriginalRuntimeTrace, false);
  assert.equal(result.candidate.authority.authoritativeBaseline, false);
  assert.equal(result.candidate.acceptance.strictMigrationComplete, false);
  assert.equal(result.candidate.promotionEligible, false);
  assert.equal(result.candidate.sourceBindings.naturalTraceLogBundle, null);
  assert.equal(result.candidate.machineVerification.hashChainedNaturalTraceLogBundleMachineIntegrityVerified, false);
  assert.equal(result.candidate.machineVerification.naturalTraceLogBundleCreatesRuntimeAuthority, false);
  assert.equal(result.candidate.machineVerification.naturalTraceLogBundleCreatesReviewOrOwnerAuthority, false);
  assert.equal(result.candidate.unresolvedGates.includes("no-hash-chained-operation-event-log"), true);
  assert.equal(result.candidate.unresolvedGates.includes("no-named-human-session-attestation"), true);
  assert.match(result.outputPath, /evidence\/pending-candidates\/natural-trace-en-001\.pending-candidate\.json$/u);
  assert.equal((await stat(result.outputPath)).mode & 0o777, 0o444);
  await prepareTs006RuntimeCapturePendingCandidate({
    projectRoot: fixture.root,
    sessionRoot: fixture.sessionRoot,
    captureName: CAPTURE_NAME,
    scriptPath: fixture.scriptPath,
    write: false,
  });
  await assert.rejects(() => prepareTs006RuntimeCapturePendingCandidate({
    projectRoot: fixture.root,
    sessionRoot: fixture.sessionRoot,
    captureName: CAPTURE_NAME,
    scriptPath: fixture.scriptPath,
  }), /append-only output refuses replacement/);
  const after = await Promise.all([readFile(coveragePath), readFile(ledgerPath)]);
  assert.deepEqual(after, before);
});

test("bridge emits a pending candidate with an explicit blocker for an initialized recorder whose four JSONLs are empty", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  await writeInitializedEmptyNaturalTraceRecorder(fixture);
  const result = await prepareTs006RuntimeCapturePendingCandidate({
    projectRoot: fixture.root,
    sessionRoot: fixture.sessionRoot,
    captureName: CAPTURE_NAME,
    scriptPath: fixture.scriptPath,
  });
  const bundle = result.candidate.sourceBindings.naturalTraceLogBundle;
  assert.equal(bundle.present, true);
  assert.equal(bundle.machineIntegrityVerified, false);
  assert.equal(bundle.blocker, "no-hash-chained-operation-event-log");
  assert.equal(bundle.completionState, "initialized-empty-recorder-logs");
  assert.equal(result.candidate.machineVerification.hashChainedNaturalTraceLogBundleMachineIntegrityVerified, false);
  assert.equal(result.candidate.unresolvedGates.includes("no-hash-chained-operation-event-log"), true);
  assert.equal(result.candidate.authority.authoritativeOriginalRuntimeTrace, false);
  assert.equal(result.candidate.acceptance.strictMigrationComplete, false);
  assert.equal(result.candidate.promotionEligible, false);
});

test("bridge rejects a capture that does not bind the exact launched PID", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const manifestPath = path.join(fixture.captureRoot, "capture-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath));
  manifest.display.includedProcessID = PID + 1;
  await writeJson(manifestPath, manifest);
  await assert.rejects(() => prepareTs006RuntimeCapturePendingCandidate({projectRoot: fixture.root, sessionRoot: fixture.sessionRoot, captureName: CAPTURE_NAME, scriptPath: fixture.scriptPath}), /exact launched PID/);
});

test("bridge rejects window-only capture without the exact-PID waited-window mode", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const manifestPath = path.join(fixture.captureRoot, "capture-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath));
  manifest.configuration.sourceKind = "window";
  manifest.display = null;
  await writeJson(manifestPath, manifest);
  await assert.rejects(() => prepareTs006RuntimeCapturePendingCandidate({projectRoot: fixture.root, sessionRoot: fixture.sessionRoot, captureName: CAPTURE_NAME, scriptPath: fixture.scriptPath}), /exact-PID waited-window mode/);
});

test("bridge rejects a resolved display crop that is not derived from the exact window stage", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const manifestPath = path.join(fixture.captureRoot, "capture-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath));
  manifest.configuration.resolvedDisplaySourceRect = "25.0,58.0,800.0,600.0";
  await writeJson(manifestPath, manifest);
  await assert.rejects(() => prepareTs006RuntimeCapturePendingCandidate({projectRoot: fixture.root, sessionRoot: fixture.sessionRoot, captureName: CAPTURE_NAME, scriptPath: fixture.scriptPath}), /resolved display crop differs/);
});

test("bridge rejects focus-dependent single-window shadow framing", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const manifestPath = path.join(fixture.captureRoot, "capture-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath));
  manifest.configuration.windowShadows = "single-window-framing-excluded";
  await writeJson(manifestPath, manifest);
  await assert.rejects(() => prepareTs006RuntimeCapturePendingCandidate({projectRoot: fixture.root, sessionRoot: fixture.sessionRoot, captureName: CAPTURE_NAME, scriptPath: fixture.scriptPath}), /focus-dependent single-window shadow framing/);
});

test("bridge recomputes and rejects a stale frame alpha-mask binding", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const manifestPath = path.join(fixture.captureRoot, "capture-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath));
  manifest.frameAlphaMaskSha256 = "0".repeat(64);
  await writeJson(manifestPath, manifest);
  await assert.rejects(() => prepareTs006RuntimeCapturePendingCandidate({projectRoot: fixture.root, sessionRoot: fixture.sessionRoot, captureName: CAPTURE_NAME, scriptPath: fixture.scriptPath}), /alpha-mask SHA-256 differs/);
});

test("bridge rejects non-opaque pixels outside native bottom corners even when PNG and manifest hashes are rewritten together", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const manifestPath = path.join(fixture.captureRoot, "capture-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath));
  const alphaOffset = (300 * 800) + 400;
  const alphaMask = Buffer.alloc(800 * 600, 255);
  alphaMask[alphaOffset] = 254;
  for (const frame of manifest.frames) {
    const framePath = path.join(fixture.captureRoot, frame.file);
    const png = PNG.sync.read(await readFile(framePath));
    png.data[(alphaOffset * 4) + 3] = 254;
    const rewritten = PNG.sync.write(png);
    await writeFile(framePath, rewritten);
    frame.bytes = rewritten.length;
    frame.sha256 = sha256(rewritten);
  }
  manifest.frameAlphaMaskSha256 = sha256(alphaMask);
  await writeJson(manifestPath, manifest);
  await assert.rejects(() => prepareTs006RuntimeCapturePendingCandidate({projectRoot: fixture.root, sessionRoot: fixture.sessionRoot, captureName: CAPTURE_NAME, scriptPath: fixture.scriptPath}), /non-opaque alpha outside the native 18px bottom-corner mask/);
});

test("bridge accepts the legacy stable native top-corner antialiasing invariant", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const manifestPath = path.join(fixture.captureRoot, "capture-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath));
  const alphaOffset = 797;
  const alphaMask = Buffer.alloc(800 * 600, 255);
  alphaMask[alphaOffset] = 254;
  for (const frame of manifest.frames) {
    const framePath = path.join(fixture.captureRoot, frame.file);
    const png = PNG.sync.read(await readFile(framePath));
    png.data[(alphaOffset * 4) + 3] = 254;
    const rewritten = PNG.sync.write(png);
    await writeFile(framePath, rewritten);
    frame.bytes = rewritten.length;
    frame.sha256 = sha256(rewritten);
  }
  manifest.configuration.alphaMaskInvariant =
    "stable-full-frame-mask-with-only-native-18px-four-corners-non-opaque";
  manifest.frameAlphaMaskSha256 = sha256(alphaMask);
  await writeJson(manifestPath, manifest);
  const result = await prepareTs006RuntimeCapturePendingCandidate({
    projectRoot: fixture.root,
    sessionRoot: fixture.sessionRoot,
    captureName: CAPTURE_NAME,
    scriptPath: fixture.scriptPath,
  });
  assert.equal(result.candidate.promotionEligible, false);
  assert.equal(result.candidate.acceptance.strictMigrationComplete, false);
});

test("bridge accepts the measured native stage-edge mask under the current invariant", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const manifestPath = path.join(fixture.captureRoot, "capture-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath));
  const alphaOffsets = [(18 * 800) + 797, (597 * 800) + 399];
  const alphaOccupancyMask = Buffer.alloc(800 * 600, 255);
  for (const alphaOffset of alphaOffsets) alphaOccupancyMask[alphaOffset] = 0;
  for (const [frameIndex, frame] of manifest.frames.entries()) {
    const framePath = path.join(fixture.captureRoot, frame.file);
    const png = PNG.sync.read(await readFile(framePath));
    for (const alphaOffset of alphaOffsets) png.data[(alphaOffset * 4) + 3] = 254;
    if (frameIndex > 0) png.data[(alphaOffsets[0] * 4) + 3] = 252;
    const rewritten = PNG.sync.write(png);
    await writeFile(framePath, rewritten);
    frame.bytes = rewritten.length;
    frame.sha256 = sha256(rewritten);
  }
  manifest.configuration.alphaMaskInvariant =
    "stable-full-frame-mask-with-only-native-3px-right-bottom-edges-plus-19px-bottom-corners-non-opaque";
  manifest.configuration.alphaMaskBinding = "stable-opaque-versus-nonopaque-occupancy";
  manifest.configuration.alphaValueJitterTolerance = "2";
  manifest.configuration.maximumObservedAlphaValueDelta = manifest.frames.length > 1 ? "2" : "0";
  manifest.frameAlphaMaskSha256 = sha256(alphaOccupancyMask);
  await writeJson(manifestPath, manifest);
  const result = await prepareTs006RuntimeCapturePendingCandidate({
    projectRoot: fixture.root,
    sessionRoot: fixture.sessionRoot,
    captureName: CAPTURE_NAME,
    scriptPath: fixture.scriptPath,
  });
  assert.equal(result.candidate.promotionEligible, false);
  assert.equal(result.candidate.acceptance.strictMigrationComplete, false);
});

test("bridge rejects any raw-capture authority escalation", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const manifestPath = path.join(fixture.captureRoot, "capture-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath));
  manifest.runtimeAuthorityClaimed = true;
  await writeJson(manifestPath, manifest);
  await assert.rejects(() => prepareTs006RuntimeCapturePendingCandidate({projectRoot: fixture.root, sessionRoot: fixture.sessionRoot, captureName: CAPTURE_NAME, scriptPath: fixture.scriptPath}), /raw-capture authority boundary/);
});

test("bridge rejects any PID-scoped network row", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  await writeFile(path.join(fixture.logsRoot, "nettop.csv"), `${NETTOP_HEADER}\n10:00:03,Flash Player.${PID},en0,Established,1,2\n`);
  await assert.rejects(() => prepareTs006RuntimeCapturePendingCandidate({projectRoot: fixture.root, sessionRoot: fixture.sessionRoot, captureName: CAPTURE_NAME, scriptPath: fixture.scriptPath}), /process\/network row/);
});

test("bridge rejects unrecognized Projector stderr instead of silently treating it as harmless", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  await writeFile(path.join(fixture.logsRoot, "projector.stderr.log"), "unexpected runtime warning\n");
  await assert.rejects(() => prepareTs006RuntimeCapturePendingCandidate({projectRoot: fixture.root, sessionRoot: fixture.sessionRoot, captureName: CAPTURE_NAME, scriptPath: fixture.scriptPath}), /unrecognized or wrong-PID diagnostic/);
});

test("bridge rejects a trace specification changed after launch", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  const changed = path.join(fixture.root, "migrations/course-g04-l03-ts-006/audit/trace-specs/req-root-lesson-shell-natural-entry-en.json");
  await writeFile(changed, `${await readFile(changed, "utf8")} `);
  await assert.rejects(() => prepareTs006RuntimeCapturePendingCandidate({projectRoot: fixture.root, sessionRoot: fixture.sessionRoot, captureName: CAPTURE_NAME, scriptPath: fixture.scriptPath}), /bytes or SHA-256 are stale/);
});

test("bridge rejects frame-byte drift and never creates a candidate", {skip: !integrationReady}, async (t) => {
  const fixture = await createFixture();
  t.after(() => rm(fixture.root, {recursive: true, force: true}));
  await writeFile(path.join(fixture.captureRoot, "frames/frame-000002.png"), makePng(99));
  await assert.rejects(() => prepareTs006RuntimeCapturePendingCandidate({projectRoot: fixture.root, sessionRoot: fixture.sessionRoot, captureName: CAPTURE_NAME, scriptPath: fixture.scriptPath}), /frame 2 bytes or SHA-256/);
});
