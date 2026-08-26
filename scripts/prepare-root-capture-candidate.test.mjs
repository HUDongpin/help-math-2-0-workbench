import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, link, lstat, mkdtemp, mkdir, readFile, realpath, readdir, rename, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {PNG} from "pngjs";

import {
  canonicalJson,
  safeRequirementId,
  sha256Text,
} from "./build-course-trace-specs.mjs";
import {
  SCENARIO_INVENTORY_PROJECTION,
  TECHNICAL_MANIFEST_PROJECTION,
  TRACE_COVERAGE_PROJECTION,
  projectionDescriptor,
  scenarioInventorySha256,
  technicalManifestSha256,
  traceCoverageSha256,
} from "./evidence-projections.mjs";
import {
  CAPTURE_SESSION_ATTESTATION_STATEMENT,
  CAPTURE_SESSION_AUTHORITY_NOTE,
  CANDIDATE_AUTHORITY,
  CANDIDATE_STATUS,
  DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT,
  MAX_ROOT_FRAME_PNG_BYTES,
  ROOT_FRAME_DECODED_BYTES,
  ROOT_CAPTURE_V3_REQUIRED_PREFLIGHTS,
  ROOT_PROJECTOR_LAUNCH_PROTOCOL,
  ROOT_SOURCE_OPEN_MENU_PATH,
  ROOT_SOURCE_OPEN_METHOD,
  ROOT_SOURCE_OPEN_START_STATEMENT,
  ROOT_SOURCE_OPEN_STATEMENT,
  captureSessionAttestationSha256,
  displayListRecordSha256,
  prepareRootCaptureCandidate,
  operationEventSha256,
  orderedFrameSetSha256,
  parseArguments,
  rootLaunchReceiptSha256,
  validateRootFramePngBytes,
} from "./prepare-root-capture-candidate.mjs";
import {ROOT_CAPTURE_RASTERIZATION_RULE} from "./lib/root-trace-spec-contract.mjs";
import {buildRootCaptureKit} from "./scaffold-root-capture-kit.mjs";

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

async function writeJson(candidate, value) {
  await mkdir(path.dirname(candidate), {recursive: true});
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  await writeFile(candidate, bytes);
  return digest(bytes);
}

async function writeJsonl(candidate, records) {
  await mkdir(path.dirname(candidate), {recursive: true});
  const bytes = Buffer.from(`${records.map((record) => JSON.stringify(record)).join("\n")}\n`);
  await writeFile(candidate, bytes);
  return digest(bytes);
}

function chainStates(records) {
  let previous = null;
  return records.map((record) => {
    const next = {...record, previousRecordSha256: previous};
    next.recordSha256 = displayListRecordSha256(next);
    previous = next.recordSha256;
    return next;
  });
}

function chainEvents(records) {
  let previous = null;
  return records.map((record) => {
    const next = {...record, previousEventSha256: previous};
    next.eventSha256 = operationEventSha256(next);
    previous = next.eventSha256;
    return next;
  });
}

async function createFixture({
  proofMode = "sequential-step-root-exhaustive",
  frameCount = 3,
  family = "course",
} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-root-candidate-preparer-"));
  const legacy = family === "legacy";
  const release = family === "release";
  const releaseId = "lesson-fixture-root-candidate";
  const animationId = legacy
    ? "keyterm-elementary-acute-angle"
    : release
      ? "course-g04-l10-ti-003"
      : "course-g04-l03-in-009";
  const scenario = legacy ? "default" : "root-standalone";
  const nativeStage = legacy
    ? {width: 225, height: 225}
    : release
      ? {width: 799.9, height: 599.75}
      : {width: 800, height: 600};
  const captureRaster = {width: Math.ceil(nativeStage.width), height: Math.ceil(nativeStage.height)};
  const requirementId = legacy
    ? "req:root:default:en"
    : release
      ? "req-default-root-en"
      : "req:root:root-standalone:en";
  const safeId = safeRequirementId(requirementId);
  const workspace = path.join(root, "migrations", animationId);
  const sourceRelative = legacy
    ? "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/DIG/acute_angle.swf"
    : release
      ? "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L10/TI/L10TI003.swf"
      : "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN09.swf";
  const sourcePath = path.join(root, sourceRelative);
  await mkdir(path.dirname(sourcePath), {recursive: true});
  const sourceBytes = Buffer.from("fixture original SWF bytes\n");
  await writeFile(sourcePath, sourceBytes);
  const sourceSha256 = digest(sourceBytes);
  const entryState = {
    kind: "original-root-frame-accurate-entry",
    rootTimelineId: "root",
    rootEntryFrame: 1,
    scenario,
    language: "en",
    seed: "0",
  };
  const entryStateSha256 = sha256Text(canonicalJson(entryState));
  const requirement = {
    requirementId,
    scenario,
    frameDomainId: "root",
    traceId: `trace:root:${scenario}:en:seed-0`,
    language: "en",
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: frameCount},
    entryState,
    entryStateSha256,
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    baselineAuthority: "unresolved",
    status: "blocked",
    blockingReason: "No accepted authoritative root baseline.",
    blockingEvidence: [],
    capturedFrameCount: 0,
    missingFrames: Array.from({length: frameCount}, (_, index) => index + 1),
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  };
  const manifest = {
    schemaVersion: 2,
    animationId,
    status: "validating",
    source: {swf: sourceRelative, swfSha256: sourceSha256},
    runtime: {stage: nativeStage, fps: 12, frameCount},
    localization: {languages: ["en"]},
    scenarios: [{id: scenario, kind: "linear", reachable: true}],
    implementation: {frameDomains: [{id: "root", kind: "root", frameCount}]},
    acceptance: {ownerReview: {decision: "pending"}},
  };
  const coverage = {schemaVersion: 2, animationId, requirements: [requirement]};
  const inventory = {
    schemaVersion: 1,
    animationId,
    inventoryStatus: "static-exhaustive-runtime-unverified",
    migrationStatusAtGeneration: "validating",
    migrationStatusChanged: false,
    evidenceIndex: [],
    timelineInventory: [{timelineId: "root", frameCount}],
  };
  await writeJson(path.join(workspace, "migration.json"), manifest);
  await writeJson(path.join(workspace, "evidence", "full-frame-coverage.json"), coverage);
  await writeJson(path.join(workspace, "audit", "scenario-inventory.json"), inventory);
  let releaseCatalog = null;
  if (release) {
    const catalogPath = path.join(root, "catalog", "lesson-releases.json");
    const catalogBytes = Buffer.from(`${JSON.stringify({
      schemaVersion: 1,
      releases: [{releaseId}],
    }, null, 2)}\n`);
    await mkdir(path.dirname(catalogPath), {recursive: true});
    await writeFile(catalogPath, catalogBytes);
    releaseCatalog = {
      path: "catalog/lesson-releases.json",
      bytes: catalogBytes.length,
      sha256: digest(catalogBytes),
      schemaVersion: 1,
      releaseId,
      releaseFingerprintSha256: "1".repeat(64),
      orderedMemberIdentitySha256: "2".repeat(64),
    };
  }
  const spec = {
    schemaVersion: 1,
    artifactType: legacy
      ? "legacy-pilot-original-runtime-trace-specification"
      : "course-pilot-original-runtime-trace-specification",
    animationId,
    requirementId,
    traceSpecStatus: "source-frame-accurate-root-ready-for-authoritative-capture",
    identity: {
      frameDomainId: "root",
      traceId: requirement.traceId,
      entryStateSha256,
      scenario: requirement.scenario,
      scenarioKind: "linear",
      language: "en",
      seed: "0",
      requiredRange: requirement.requiredRange,
      baselineAuthorityRequirement: "original-runtime-frame-accurate",
    },
    traceModel: {
      kind: "frame-accurate-root-exhaustive",
      domainScope: "root",
      positioningProofModes: ["direct-seek-root-exhaustive", "sequential-step-root-exhaustive"],
      naturalPlaybackClaimed: false,
    },
    sourceBindings: {
      sourceSwf: {path: sourceRelative, sha256: sourceSha256},
      migrationManifest: {path: "migration.json", ...projectionDescriptor({
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        sha256: technicalManifestSha256(manifest),
        excludedPaths: TECHNICAL_MANIFEST_PROJECTION.excludedPaths,
      })},
      fullFrameCoverage: {path: "evidence/full-frame-coverage.json", ...projectionDescriptor({
        projection: TRACE_COVERAGE_PROJECTION.id,
        sha256: traceCoverageSha256(coverage),
        includedPaths: TRACE_COVERAGE_PROJECTION.includedRequirementPaths,
        excludedPaths: TRACE_COVERAGE_PROJECTION.excludedRequirementPaths,
      })},
      scenarioInventory: {path: "audit/scenario-inventory.json", ...projectionDescriptor({
        projection: SCENARIO_INVENTORY_PROJECTION.id,
        sha256: scenarioInventorySha256(inventory),
        excludedPaths: SCENARIO_INVENTORY_PROJECTION.excludedPaths,
      })},
      ...(release ? {lessonReleaseCatalog: releaseCatalog} : {}),
    },
    frameDomain: {id: "root", kind: "root", sourceTimelineId: "root", frameCount, nativeStage, fps: 12},
    entryState,
    schedule: {
      status: "not-required-frame-accurate-root",
      noActionsRequired: false,
      orderedSteps: [],
      stateCheckpoints: [],
      exhaustiveFrameCapturePlan: {indexing: "one-indexed", firstFrame: 1, lastFrame: frameCount, frameCount},
      terminalSemantics: {status: "separate-natural-playback-behavior-gate-not-required-for-frame-accurate-root-baseline"},
    },
    executionEvidence: {expectedExecutionReportPath: `baseline/trace-executions/${safeId}.json`},
  };
  const specRelative = release
    ? `migrations/${animationId}/audit/trace-specs/lesson-releases/${releaseId}/${safeId}.json`
    : `migrations/${animationId}/audit/trace-specs/${safeId}.json`;
  const specPath = path.join(root, specRelative);
  const specSha256 = await writeJson(specPath, spec);
  const executionRelative = `migrations/${animationId}/baseline/trace-executions/${safeId}.json`;
  const indexedMember = {
      animationId,
      traceSpecs: [{
        requirementId,
        status: spec.traceSpecStatus,
        traceModel: spec.traceModel.kind,
        frameDomainId: spec.frameDomain.id,
        file: specRelative,
        sha256: specSha256,
        expectedExecutionReport: executionRelative,
      }],
    };
  const index = release ? {
    schemaVersion: 1,
    artifactType: "lesson-release-original-runtime-trace-spec-index",
    releaseSelection: {releaseId},
    releaseCatalog,
    members: [indexedMember],
  } : {
    schemaVersion: 1,
    artifactType: legacy ? "legacy-pilot-trace-spec-index" : "course-shell-pilot-trace-spec-index",
    pilots: [indexedMember],
  };
  const indexPath = path.join(
    root,
    "migrations",
    release
      ? `lesson-release-trace-spec-indexes/${releaseId}.json`
      : legacy
        ? "legacy-pilot-trace-spec-index.json"
        : "course-shell-pilot-trace-spec-index.json",
  );
  await writeJson(indexPath, index);

  const sessionId = "123e4567-e89b-42d3-a456-426614174000";
  const sessionStartedAt = "2026-07-21T00:00:00.000Z";
  const sessionEndedAt = "2026-07-21T00:01:00.000Z";
  const operator = {
    kind: "human",
    fullName: "María Elena Rivera",
    role: "Authorized Flash Runtime Capture Reviewer",
    organizationOrOwnerId: "HELP-MATH-OWNER-001",
    contact: "maria.rivera@example.edu",
  };
  const playerApp = path.join(root, "tooling", "Adobe Flash Player.app");
  const playerExecutable = path.join(playerApp, "Contents", "MacOS", "Flash Player");
  const playerBytes = Buffer.from("fixture Adobe Flash Player Projector executable\n");
  await mkdir(path.dirname(playerExecutable), {recursive: true});
  await writeFile(playerExecutable, playerBytes, {mode: 0o755});
  const runtime = {
    runtimeId: "adobe-flash-player-projector",
    name: "Adobe Flash Player Projector",
    version: "32.0.0.465",
    requestedAppPath: playerApp,
    appPath: playerApp,
    executablePath: playerExecutable,
    executableSha256: digest(playerBytes),
  };
  const kit = await buildRootCaptureKit({projectRoot: root, specFile: specRelative, runtime, protocolV3: true});
  const kitRoot = path.join(root, DEFAULT_ROOT_CAPTURE_KIT_V3_ROOT, animationId, safeId);
  for (const [relative, content] of kit.files) {
    const destination = path.join(kitRoot, relative);
    await mkdir(path.dirname(destination), {recursive: true});
    await writeFile(destination, content);
    await chmod(destination, relative.endsWith(".sh") ? 0o555 : 0o444);
  }
  const sessionRoot = path.join(root, "work", "authorized-capture", animationId, safeId);
  await mkdir(sessionRoot, {recursive: true});
  const kitCheck = {
    status: "verified-unsigned-template-only",
    count: 1,
    results: [{
      status: "verified-unsigned-template-only",
      kitRoot: portable(path.relative(root, kitRoot)),
      animationId,
      requirementId,
      traceSpecSha256: specSha256,
      sourceSwfSha256: sourceSha256,
      runtimeExecutableSha256: runtime.executableSha256,
      captureKitManifestSha256: kit.manifestSha256,
      launcherSha256: digest(Buffer.from(kit.files.get("launch-projector-empty.sh"))),
      sandboxProfileSha256: digest(Buffer.from(kit.files.get("sandbox.sb"))),
      stagedSourceSha256: digest(Buffer.from(kit.files.get("runtime-source/source.swf"))),
      nodeExecutableSha256: kit.manifest.runtime.launcherNodeExecutable.sha256,
      runtimeIdentityReceiptSha256: digest(Buffer.from(kit.files.get("runtime/runtime-executable-sha256.txt"))),
      strictAcceptanceEffect: false,
      migrationStatusChanged: false,
    }],
  };
  const kitCheckPath = path.join(sessionRoot, "root-capture-kit-check.json");
  const kitCheckSha256 = await writeJson(kitCheckPath, kitCheck);
  const launchReceipt = {
    schemaVersion: 3,
    evidenceType: "named-human-hash-bound-root-source-open-start-receipt",
    sessionId,
    animationId,
    requirementId,
    captureKit: {file: portable(path.relative(root, path.join(kitRoot, "kit-manifest.json"))), sha256: kit.manifestSha256},
    runtime: {runtimeId: runtime.runtimeId, name: runtime.name, version: runtime.version, executableSha256: runtime.executableSha256},
    kitCheck: {file: portable(path.relative(root, kitCheckPath)), sha256: kitCheckSha256},
    launchProtocol: ROOT_PROJECTOR_LAUNCH_PROTOCOL,
    projectorStart: {executablePath: kit.manifest.runtime.executablePath, swfArgument: null, processId: 24680, startedAt: "2026-07-20T23:59:59.000Z"},
    sourceOpen: {
      method: ROOT_SOURCE_OPEN_METHOD,
      menuPath: [...ROOT_SOURCE_OPEN_MENU_PATH],
      selectedSource: kit.manifest.stagedSource.staged,
      openedAt: "2026-07-20T23:59:59.500Z",
      playerWindowObserved: true,
    },
    finalizedAt: "2026-07-20T23:59:59.750Z",
    operator,
    statement: ROOT_SOURCE_OPEN_START_STATEMENT,
  };
  launchReceipt.receiptSha256 = rootLaunchReceiptSha256(launchReceipt);
  const launchReceiptPath = path.join(sessionRoot, "source-open-launch-receipt.json");
  const launchReceiptSha256 = await writeJson(launchReceiptPath, launchReceipt);
  const identityArtifactPath = path.join(workspace, "evidence", "runtime", "player-version.txt");
  await mkdir(path.dirname(identityArtifactPath), {recursive: true});
  const identityArtifactBytes = Buffer.from("Adobe Flash Player Projector 32.0.0.465\n");
  await writeFile(identityArtifactPath, identityArtifactBytes);
  const receipt = {
    schemaVersion: 1,
    evidenceType: "human-attested-adobe-runtime-toolchain-receipt",
    runtime: {runtimeId: "adobe-flash-player-projector", name: "Adobe Flash Player Projector", version: "32.0.0.465"},
    captureSessionBinding: {
      sessionId,
      traceSpecSha256: specSha256,
      sourceSwfSha256: sourceSha256,
      captureKitManifestSha256: kit.manifestSha256,
      launchReceiptSha256,
    },
    capturedAt: "2026-07-20T23:59:59.900Z",
    identityArtifacts: [{kind: "product-version-capture", file: "evidence/runtime/player-version.txt", sha256: digest(identityArtifactBytes)}],
  };
  const receiptPath = path.join(workspace, "evidence", "runtime", "toolchain-receipt.json");
  const receiptSha256 = await writeJson(receiptPath, receipt);
  const framesDirectory = path.join(sessionRoot, "frames");
  await mkdir(framesDirectory, {recursive: true});
  const screenshots = [];
  for (let frame = 1; frame <= frameCount; frame += 1) {
    const png = new PNG(captureRaster);
    png.data.fill(frame * 17);
    const bytes = PNG.sync.write(png);
    const file = path.join(framesDirectory, `source-frame-${frame}.png`);
    await writeFile(file, bytes);
    screenshots.push({file: portable(path.relative(root, file)), sha256: digest(bytes)});
  }
  const states = chainStates(screenshots.map((screenshot, index) => ({
    schemaVersion: 1,
    evidenceType: "attested-display-list-state",
    animationId,
    requirementId,
    proofMode,
    sessionId,
    traceSpecSha256: specSha256,
    sourceSwfSha256: sourceSha256,
    captureKitManifestSha256: kit.manifestSha256,
    launchReceiptSha256,
    toolchainReceiptSha256: receiptSha256,
    sequence: index + 1,
    monotonicTimeMs: (index + 1) * 1000 + 100,
    occurredAt: new Date(Date.UTC(2026, 6, 21, 0, 0, index + 1, 100)).toISOString(),
    operator,
    frameDomainId: "root",
    observedRootFrame: index + 1,
    displayListState: {rootFrame: index + 1, depths: [{depth: 1, characterId: 100 + index}]},
    displayListStateSha256: sha256Text(canonicalJson({rootFrame: index + 1, depths: [{depth: 1, characterId: 100 + index}]})),
    screenshotSha256: screenshot.sha256,
  })));
  const events = chainEvents(screenshots.map((screenshot, index) => ({
    schemaVersion: 1,
    evidenceType: "attested-root-frame-operation",
    animationId,
    requirementId,
    sessionId,
    traceSpecSha256: specSha256,
    sourceSwfSha256: sourceSha256,
    captureKitManifestSha256: kit.manifestSha256,
    launchReceiptSha256,
    toolchainReceiptSha256: receiptSha256,
    proofMode,
    sequence: index + 1,
    monotonicTimeMs: (index + 1) * 1000,
    occurredAt: new Date(Date.UTC(2026, 6, 21, 0, 0, index + 1)).toISOString(),
    operator,
    operation: proofMode === "direct-seek-root-exhaustive" ? "direct-seek" : index === 0 ? "rewind" : "step-forward",
    operationCountSincePrevious: 1,
    requestedRootFrame: index + 1,
    observedRootFrame: index + 1,
    screenshotFile: screenshot.file,
    screenshotSha256: screenshot.sha256,
    displayListRecordSha256: states[index].recordSha256,
  })));
  const operationLogPath = path.join(root, "work", "authorized-capture", animationId, safeId, "operation-log.jsonl");
  const displayListPath = path.join(root, "work", "authorized-capture", animationId, safeId, "display-list-states.jsonl");
  const operationLogSha256 = await writeJsonl(operationLogPath, events);
  const displayListSha256 = await writeJsonl(displayListPath, states);
  const frameSetFrames = screenshots.map((screenshot, index) => ({frame: index + 1, file: screenshot.file, sha256: screenshot.sha256}));
  const attestation = {
    schemaVersion: 1,
    evidenceType: "named-human-root-capture-session-attestation",
    sessionId,
    animationId,
    requirementId,
    proofMode,
    traceSpec: {file: specRelative, sha256: specSha256},
    sourceSwf: {path: sourceRelative, sha256: sourceSha256},
    launchReceipt: {file: portable(path.relative(root, launchReceiptPath)), sha256: launchReceiptSha256},
    toolchainReceipt: {
      file: portable(path.relative(root, receiptPath)),
      sha256: receiptSha256,
      runtime: receipt.runtime,
      captureSessionBinding: receipt.captureSessionBinding,
    },
    operationLog: {
      file: portable(path.relative(root, operationLogPath)),
      sha256: operationLogSha256,
      finalEventSha256: events.at(-1).eventSha256,
      eventCount: events.length,
    },
    displayListRecords: {
      file: portable(path.relative(root, displayListPath)),
      sha256: displayListSha256,
      finalRecordSha256: states.at(-1).recordSha256,
      recordCount: states.length,
    },
    frameSet: {
      algorithm: "ordered-frame-path-sha256-v1",
      frameCount: frameSetFrames.length,
      frames: frameSetFrames,
      sha256: orderedFrameSetSha256(frameSetFrames),
    },
    startedAt: sessionStartedAt,
    endedAt: sessionEndedAt,
    signedAt: "2026-07-21T00:01:05.000Z",
    monotonicTimeOrigin: "milliseconds-since-session-start",
    operator,
    statement: CAPTURE_SESSION_ATTESTATION_STATEMENT,
    notes: CAPTURE_SESSION_AUTHORITY_NOTE,
  };
  attestation.attestationSha256 = captureSessionAttestationSha256(attestation);
  const attestationPath = path.join(root, "work", "authorized-capture", animationId, safeId, "capture-session-attestation.json");
  await writeJson(attestationPath, attestation);
  return {
    root,
    workspace,
    animationId,
    requirementId,
    safeId,
    sourcePath,
    nativeStage,
    captureRaster,
    releaseId,
    indexPath,
    manifest,
    coverage,
    spec,
    specPath,
    specRelative,
    operationLogPath,
    displayListPath,
    framesDirectory,
    kit,
    kitRoot,
    kitCheck,
    kitCheckPath,
    launchReceipt,
    launchReceiptPath,
    launchReceiptSha256,
    receiptPath,
    receipt,
    receiptSha256,
    attestation,
    attestationPath,
    sessionId,
    operator,
    events,
    states,
    screenshots,
    options: {
      projectRoot: root,
      spec: specRelative,
      operationLog: portable(path.relative(root, operationLogPath)),
      frames: portable(path.relative(root, framesDirectory)),
      displayListStates: portable(path.relative(root, displayListPath)),
      launchReceipt: portable(path.relative(root, launchReceiptPath)),
      toolchainReceipt: portable(path.relative(root, receiptPath)),
      captureSessionAttestation: portable(path.relative(root, attestationPath)),
      proofMode,
    },
  };
}

async function rewriteEvents(fixture, mutate) {
  const events = structuredClone(fixture.events);
  mutate(events);
  fixture.events = chainEvents(events.map(({eventSha256: _eventSha256, previousEventSha256: _previous, ...record}) => record));
  await writeJsonl(fixture.operationLogPath, fixture.events);
}

async function rewriteStates(fixture, mutate) {
  const states = structuredClone(fixture.states);
  mutate(states);
  fixture.states = chainStates(states.map(({recordSha256: _recordSha256, previousRecordSha256: _previous, ...record}) => record));
  await writeJsonl(fixture.displayListPath, fixture.states);
}

async function rebindEventsToStates(fixture) {
  fixture.events = chainEvents(fixture.events.map(({eventSha256: _hash, previousEventSha256: _previous, ...record}, index) => ({
    ...record,
    displayListRecordSha256: fixture.states[index].recordSha256,
  })));
  await writeJsonl(fixture.operationLogPath, fixture.events);
}

async function rewriteAttestation(fixture, mutate, {rehash = true} = {}) {
  const attestation = structuredClone(fixture.attestation);
  mutate(attestation);
  if (rehash) attestation.attestationSha256 = captureSessionAttestationSha256(attestation);
  fixture.attestation = attestation;
  await writeJson(fixture.attestationPath, attestation);
}

async function rewriteLaunchReceiptForEarlyFailure(fixture, mutate, {rehash = true} = {}) {
  const launchReceipt = structuredClone(fixture.launchReceipt);
  mutate(launchReceipt);
  if (rehash) launchReceipt.receiptSha256 = rootLaunchReceiptSha256(launchReceipt);
  const launchReceiptSha256 = await writeJson(fixture.launchReceiptPath, launchReceipt);
  fixture.launchReceipt = launchReceipt;
  fixture.launchReceiptSha256 = launchReceiptSha256;

  const receipt = structuredClone(fixture.receipt);
  receipt.captureSessionBinding.launchReceiptSha256 = launchReceiptSha256;
  const receiptSha256 = await writeJson(fixture.receiptPath, receipt);
  fixture.receipt = receipt;
  fixture.receiptSha256 = receiptSha256;
  await rewriteAttestation(fixture, (attestation) => {
    attestation.launchReceipt.sha256 = launchReceiptSha256;
    attestation.toolchainReceipt.sha256 = receiptSha256;
    attestation.toolchainReceipt.captureSessionBinding = structuredClone(receipt.captureSessionBinding);
  });
}

async function rewriteKitCheckForEarlyFailure(fixture, mutate) {
  const kitCheck = structuredClone(fixture.kitCheck);
  mutate(kitCheck);
  const kitCheckSha256 = await writeJson(fixture.kitCheckPath, kitCheck);
  fixture.kitCheck = kitCheck;
  await rewriteLaunchReceiptForEarlyFailure(fixture, (launchReceipt) => {
    launchReceipt.kitCheck.sha256 = kitCheckSha256;
  });
}

async function rewriteSpecAndIndex(fixture, mutate) {
  mutate(fixture.spec);
  const sha256 = await writeJson(fixture.specPath, fixture.spec);
  const index = JSON.parse(await readFile(fixture.indexPath, "utf8"));
  const member = (index.members || index.pilots)[0];
  member.traceSpecs[0].sha256 = sha256;
  member.traceSpecs[0].status = fixture.spec.traceSpecStatus;
  await writeJson(fixture.indexPath, index);
}

function fixedCandidatePaths(fixture) {
  const pendingDirectory = path.join(fixture.workspace, "evidence", "pending-root-capture", fixture.safeId);
  const archiveDirectory = path.join(
    fixture.root, "artifacts", "full-frame", "pilot-baselines",
    fixture.animationId, fixture.safeId, "pending-human-owner",
  );
  return {
    pendingDirectory,
    candidateManifestPath: path.join(pendingDirectory, "candidate-manifest.json"),
    candidateReportPath: path.join(pendingDirectory, "candidate-report.json"),
    archiveDirectory,
  };
}

test("parseArguments exposes only explicit offline candidate-preparer inputs", () => {
  assert.deepEqual(ROOT_CAPTURE_V3_REQUIRED_PREFLIGHTS, [
    "external-named-operator-authorization",
    "authorized-disposable-offline-environment-preflight",
    "outside-kit-session-output-root-preflight",
    "fresh-storage-capacity-preflight",
  ]);
  const options = parseArguments([
    "--spec", "spec.json",
    "--operation-log", "operations.jsonl",
    "--frames", "frames",
    "--display-list-states", "states.jsonl",
    "--launch-receipt", "launch.json",
    "--toolchain-receipt", "receipt.json",
    "--capture-session-attestation", "attestation.json",
    "--proof-mode", "sequential-step-root-exhaustive",
  ]);
  assert.equal(options.proofMode, "sequential-step-root-exhaustive");
  assert.equal(options.launchReceipt, "launch.json");
  assert.equal(options.captureSessionAttestation, "attestation.json");
  assert.throws(() => parseArguments(["--update-coverage"]), /Unknown option/);
  assert.throws(() => parseArguments(["--operator", "unsigned-name"]), /Unknown option/);
  assert.throws(() => parseArguments(["--baseline-output", "canonical.json"]), /Unknown option/);
  assert.throws(() => parseArguments(["--execution-output", "canonical.json"]), /Unknown option/);
  assert.throws(() => parseArguments(["--archive-output", "archive"]), /Unknown option/);
  assert.throws(() => parseArguments(["--candidate-manifest-output", "manifest.json"]), /Unknown option/);
  assert.throws(() => parseArguments(["--candidate-report-output", "report.json"]), /Unknown option/);
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
});

test("requires a completed external schema-v3 start receipt and rejects the v2 cycle", async (t) => {
  await t.test("missing-input", async () => {
    const fixture = await createFixture();
    try {
      const options = {...fixture.options};
      delete options.launchReceipt;
      await assert.rejects(() => prepareRootCaptureCandidate(options), /--launch-receipt must be a non-empty string/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  for (const [name, mutate, expected] of [
    ["old-schema-v1", (receipt) => { receipt.schemaVersion = 1; }, /schema, identity, statement, or canonical hash is invalid/],
    ["old-schema-v2-cycle", (receipt) => {
      receipt.schemaVersion = 2;
      receipt.evidenceType = "named-human-hash-bound-root-source-open-receipt";
      receipt.endedAt = "2026-07-21T00:01:00.500Z";
      delete receipt.finalizedAt;
      receipt.statement = ROOT_SOURCE_OPEN_STATEMENT;
    }, /fields must be exactly|schema, identity, statement, or canonical hash is invalid/],
    ["template-marker", (receipt) => { receipt.templateStatus = "unsigned-template-only-not-evidence"; }, /fields must be exactly/],
    ["future-log-cycle", (receipt) => { receipt.operationLogSha256 = "f".repeat(64); }, /fields must be exactly/],
    ["command-line-swf", (receipt) => { receipt.projectorStart.swfArgument = receipt.sourceOpen.selectedSource.file; }, /swfArgument/],
    ["wrong-method", (receipt) => { receipt.sourceOpen.method = "command-line-open"; }, /\(method\)/],
    ["wrong-menu", (receipt) => { receipt.sourceOpen.menuPath = ["Finder", "Open"]; }, /\(menuPath\)/],
    ["wrong-staged-source", (receipt) => { receipt.sourceOpen.selectedSource.sha256 = "a".repeat(64); }, /\(selectedSource\)/],
    ["window-not-observed", (receipt) => { receipt.sourceOpen.playerWindowObserved = false; }, /\(playerWindowObserved\)/],
    ["different-operator", (receipt) => { receipt.operator.fullName = "Different Human"; }, /operator differs from the capture-session operator/],
    ["different-session", (receipt) => { receipt.sessionId = "123e4567-e89b-42d3-a456-426614174001"; }, /schema, identity, statement, or canonical hash is invalid/],
    ["source-open-before-projector", (receipt) => { receipt.sourceOpen.openedAt = "2026-07-20T23:59:58.999Z"; }, /chronology must satisfy/],
    ["finalized-before-source-open", (receipt) => { receipt.finalizedAt = "2026-07-20T23:59:59.499Z"; }, /chronology must satisfy/],
    ["finalized-after-session-start", (receipt) => { receipt.finalizedAt = "2026-07-21T00:00:00.001Z"; }, /chronology must satisfy/],
  ]) await t.test(name, async () => {
    const fixture = await createFixture();
    try {
      await rewriteLaunchReceiptForEarlyFailure(fixture, mutate);
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), expected);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects stale checked-kit and launch-receipt bindings fail closed", async (t) => {
  await t.test("legacy-v2-kit-root", async () => {
    const fixture = await createFixture();
    try {
      const v2Kit = await buildRootCaptureKit({
        projectRoot: fixture.root,
        specFile: fixture.specRelative,
        runtime: fixture.kit.runtime,
      });
      const v2Root = path.join(
        fixture.root,
        "work",
        "root-capture-kits",
        fixture.animationId,
        fixture.safeId,
      );
      for (const [relative, content] of v2Kit.files) {
        const destination = path.join(v2Root, relative);
        await mkdir(path.dirname(destination), {recursive: true});
        await writeFile(destination, content);
        await chmod(destination, relative.endsWith(".sh") ? 0o555 : 0o444);
      }
      await rewriteLaunchReceiptForEarlyFailure(fixture, (receipt) => {
        receipt.captureKit = {
          file: portable(path.relative(fixture.root, path.join(v2Root, "kit-manifest.json"))),
          sha256: v2Kit.manifestSha256,
        };
      });
      await assert.rejects(
        () => prepareRootCaptureCandidate(fixture.options),
        /not the fixed current requirement kit manifest/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("stale-kit-check", async () => {
    const fixture = await createFixture();
    try {
      await rewriteKitCheckForEarlyFailure(fixture, (kitCheck) => {
        kitCheck.results[0].launcherSha256 = "b".repeat(64);
      });
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /does not prove the exact current kit/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("operation-log-launch-hash", async () => {
    const fixture = await createFixture();
    try {
      await rewriteEvents(fixture, (events) => { events[0].launchReceiptSha256 = "c".repeat(64); });
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /operation log hash\/identity\/sequence chain/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("display-list-kit-hash", async () => {
    const fixture = await createFixture();
    try {
      await rewriteStates(fixture, (states) => { states[0].captureKitManifestSha256 = "d".repeat(64); });
      await rebindEventsToStates(fixture);
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /display-list record hash\/identity\/sequence chain/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

for (const proofMode of ["sequential-step-root-exhaustive", "direct-seek-root-exhaustive"]) {
  test(`prepares only a pending human/owner candidate for ${proofMode}`, async () => {
    const fixture = await createFixture({proofMode});
    try {
      const sourceBefore = digest(await readFile(fixture.sourcePath));
      const manifestBefore = await readFile(path.join(fixture.workspace, "migration.json"));
      const coveragePath = path.join(fixture.workspace, "evidence", "full-frame-coverage.json");
      const coverageBefore = await readFile(coveragePath);
      const result = await prepareRootCaptureCandidate(fixture.options);
      assert.equal(result.frameCount, 3);
      assert.equal(result.status, CANDIDATE_STATUS);
      assert.equal(result.authority, CANDIDATE_AUTHORITY);
      assert.equal(result.strictAcceptanceEffect, false);
      assert.match(result.archiveDirectory, /pending-human-owner$/);
      assert.equal(result.coverageChanged, false);
      assert.equal(result.statusChanged, false);
      assert.equal(digest(await readFile(fixture.sourcePath)), sourceBefore);
      assert.deepEqual(await readFile(path.join(fixture.workspace, "migration.json")), manifestBefore);
      assert.deepEqual(await readFile(coveragePath), coverageBefore);
      const candidateManifest = JSON.parse(await readFile(path.join(fixture.root, result.candidateManifest.file), "utf8"));
      const candidateReport = JSON.parse(await readFile(path.join(fixture.root, result.candidateReport.file), "utf8"));
      for (const document of [candidateManifest, candidateReport]) {
        assert.equal(document.status, CANDIDATE_STATUS);
        assert.equal(document.authority, CANDIDATE_AUTHORITY);
        assert.equal(document.strictAcceptanceEffect, false);
        assert.equal(document.promotionRequired.status, "not-implemented");
      }
      assert.deepEqual(candidateManifest.frames.map(({frame}) => frame), [1, 2, 3]);
      const archiveDirectory = path.join(fixture.root, result.archiveDirectory);
      assert.equal((await lstat(archiveDirectory)).mode & 0o777, 0o755);
      const archiveNames = (await readdir(archiveDirectory)).sort();
      assert.equal(archiveNames.length, 11);
      for (const basename of archiveNames) {
        const info = await lstat(path.join(archiveDirectory, basename));
        assert.equal(info.isFile(), true, basename);
        assert.equal(info.nlink, 1, basename);
        assert.equal(info.mode & 0o777, 0o444, basename);
      }
      for (const frame of candidateManifest.frames) {
        const bytes = await readFile(path.join(fixture.root, frame.file));
        assert.equal(digest(bytes), frame.sha256);
        assert.deepEqual(validateRootFramePngBytes(bytes, `published ${frame.file}`), {
          width: 800,
          height: 600,
          compressedBytes: bytes.length,
          decodedBytes: ROOT_FRAME_DECODED_BYTES,
          sha256: frame.sha256,
        });
      }
      assert.deepEqual(candidateManifest.attestedCaptureClaim.captureSessionAttestation, result.captureSessionAttestation);
      assert.deepEqual(candidateManifest.attestedCaptureClaim.launchReceipt, result.launchReceipt);
      assert.deepEqual(candidateManifest.attestedCaptureClaim.captureKit, result.captureKit);
      assert.deepEqual(candidateReport.captureSessionAttestation, result.captureSessionAttestation);
      assert.deepEqual(candidateReport.launchReceipt, result.launchReceipt);
      assert.equal(digest(await readFile(path.join(fixture.root, result.launchReceipt.file))), result.launchReceipt.sha256);
      assert.equal(digest(await readFile(path.join(fixture.root, result.captureKit.manifest.file))), result.captureKit.manifest.sha256);
      assert.equal(digest(await readFile(path.join(fixture.root, result.captureKit.kitCheck.file))), result.captureKit.kitCheck.sha256);
      assert.equal(candidateReport.claimedRuntime.sessionId, fixture.sessionId);
      assert.deepEqual(candidateReport.claimedRuntime.namedHumanOperator, fixture.operator);
      assert.equal(candidateReport.claimedRuntime.authority, CANDIDATE_AUTHORITY);
      assert.deepEqual(candidateReport.frameResults.map(({positioningOperation}) => positioningOperation),
        proofMode === "direct-seek-root-exhaustive" ? ["direct-seek", "direct-seek", "direct-seek"] : ["rewind", "step-forward", "step-forward"]);
      const serialized = JSON.stringify([candidateManifest, candidateReport]);
      for (const forbidden of [
        '"status":"complete"', '"status":"complete-pass"', '"baselineAuthority":',
        '"authority":"original-runtime-frame-accurate"', '"authorizedRuntime":',
      ]) assert.equal(serialized.includes(forbidden), false, forbidden);
      await assert.rejects(() => readFile(path.join(fixture.workspace, "baseline", "original-runtime", `${fixture.safeId}.json`)), {code: "ENOENT"});
      await assert.rejects(() => readFile(path.join(fixture.workspace, fixture.spec.executionEvidence.expectedExecutionReportPath)), {code: "ENOENT"});
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
}

test("prepares a legacy acute-angle-sized root candidate with exact legacy index and PNG dimensions", async () => {
  const fixture = await createFixture({family: "legacy"});
  try {
    assert.equal(
      fixture.kit.manifest.bindings.traceSpecIndex.file,
      "migrations/legacy-pilot-trace-spec-index.json",
    );
    const result = await prepareRootCaptureCandidate(fixture.options);
    const candidateManifest = JSON.parse(
      await readFile(path.join(fixture.root, result.candidateManifest.file), "utf8"),
    );
    assert.deepEqual(candidateManifest.declaredRuntimeFacts.stage, {width: 225, height: 225});
    assert.equal(candidateManifest.declaredRuntimeFacts.fps, 12);
    assert.equal(candidateManifest.frames.length, 3);
    for (const frame of candidateManifest.frames) {
      assert.equal(frame.width, 225);
      assert.equal(frame.height, 225);
      const bytes = await readFile(path.join(fixture.root, frame.file));
      assert.deepEqual(
        validateRootFramePngBytes(bytes, `legacy frame ${frame.frame}`, fixture.nativeStage),
        {
          width: 225,
          height: 225,
          compressedBytes: bytes.length,
          decodedBytes: 225 * 225 * 4,
          sha256: frame.sha256,
        },
      );
    }
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("prepares a canonical lesson-release candidate while preserving fractional native stage and integer capture raster", async () => {
  const fixture = await createFixture({family: "release"});
  try {
    assert.equal(
      fixture.kit.manifest.bindings.traceSpecIndex.file,
      `migrations/lesson-release-trace-spec-indexes/${fixture.releaseId}.json`,
    );
    assert.deepEqual(fixture.kit.manifest.frameDomain.nativeStage, {
      width: 799.9,
      height: 599.75,
    });
    assert.deepEqual(fixture.kit.manifest.captureRaster, {
      rule: ROOT_CAPTURE_RASTERIZATION_RULE,
      width: 800,
      height: 600,
    });

    const result = await prepareRootCaptureCandidate(fixture.options);
    const candidateManifest = JSON.parse(
      await readFile(path.join(fixture.root, result.candidateManifest.file), "utf8"),
    );
    assert.equal(candidateManifest.strictAcceptanceEffect, false);
    assert.deepEqual(candidateManifest.declaredRuntimeFacts.stage, {
      width: 799.9,
      height: 599.75,
    });
    assert.deepEqual(candidateManifest.declaredRuntimeFacts.captureRaster, {
      rule: ROOT_CAPTURE_RASTERIZATION_RULE,
      width: 800,
      height: 600,
    });
    assert.equal(candidateManifest.frames.length, 3);
    for (const frame of candidateManifest.frames) {
      assert.equal(frame.width, 800);
      assert.equal(frame.height, 600);
      const bytes = await readFile(path.join(fixture.root, frame.file));
      assert.deepEqual(
        validateRootFramePngBytes(bytes, `lesson-release frame ${frame.frame}`, fixture.captureRaster),
        {
          width: 800,
          height: 600,
          compressedBytes: bytes.length,
          decodedBytes: ROOT_FRAME_DECODED_BYTES,
          sha256: frame.sha256,
        },
      );
    }
    await assert.rejects(
      () => readFile(path.join(fixture.workspace, "baseline", "original-runtime", `${fixture.safeId}.json`)),
      {code: "ENOENT"},
    );
    await assert.rejects(
      () => readFile(path.join(fixture.workspace, fixture.spec.executionEvidence.expectedExecutionReportPath)),
      {code: "ENOENT"},
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects unresolved and nested trace specifications before creating evidence", async () => {
  const fixture = await createFixture();
  try {
    await rewriteSpecAndIndex(fixture, (spec) => {
      spec.traceSpecStatus = "unresolved";
      spec.frameDomain.kind = "nested";
    });
    await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /only a ready frame-accurate root/);
    assert.equal(await readFile(path.join(fixture.workspace, "evidence", "full-frame-coverage.json"), "utf8"), `${JSON.stringify(fixture.coverage, null, 2)}\n`);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects a wrong sequential Step operation even when the attacker rebuilds the event hash chain", async () => {
  const fixture = await createFixture();
  try {
    await rewriteEvents(fixture, (events) => { events[1].operation = "rewind"; });
    await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /Rewind\/Step\/direct-seek contract/);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects non-monotonic events and a broken append-only hash chain", async (t) => {
  await t.test("non-monotonic", async () => {
    const fixture = await createFixture();
    try {
      await rewriteEvents(fixture, (events) => { events[1].monotonicTimeMs = events[0].monotonicTimeMs; });
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /monotonicTimeMs is not strictly increasing/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("broken-chain", async () => {
    const fixture = await createFixture();
    try {
      fixture.events[1].previousEventSha256 = "0".repeat(64);
      await writeJsonl(fixture.operationLogPath, fixture.events);
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /operation log hash\/identity\/sequence chain/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects cross-stream overlap unless event_i <= state_i < event_i+1 in both clocks", async () => {
  const fixture = await createFixture();
  try {
    await rewriteStates(fixture, (states) => {
      states[0].monotonicTimeMs = fixture.events[1].monotonicTimeMs;
      states[0].occurredAt = fixture.events[1].occurredAt;
    });
    await rebindEventsToStates(fixture);
    await assert.rejects(
      () => prepareRootCaptureCandidate(fixture.options),
      /event_i <= state_i < event_i\+1 in both wall and monotonic time/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects incomplete PNG coverage and non-native PNG dimensions transactionally", async (t) => {
  await t.test("missing-frame", async () => {
    const fixture = await createFixture();
    try {
      await rm(path.join(fixture.root, fixture.screenshots[2].file));
      const coverageBefore = await readFile(path.join(fixture.workspace, "evidence", "full-frame-coverage.json"));
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /frameSet\.frames\[2\]\.file is missing|exactly 3 PNG files/);
      assert.deepEqual(await readFile(path.join(fixture.workspace, "evidence", "full-frame-coverage.json")), coverageBefore);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("wrong-dimensions", async () => {
    const fixture = await createFixture();
    try {
      const png = new PNG({width: 799, height: 600});
      png.data.fill(255);
      const bytes = PNG.sync.write(png);
      const screenshotPath = path.join(fixture.root, fixture.screenshots[0].file);
      await writeFile(screenshotPath, bytes);
      const newHash = digest(bytes);
      fixture.states[0].screenshotSha256 = newHash;
      fixture.states = chainStates(fixture.states.map(({recordSha256: _hash, previousRecordSha256: _previous, ...record}) => record));
      await writeJsonl(fixture.displayListPath, fixture.states);
      fixture.events[0].screenshotSha256 = newHash;
      fixture.events[0].displayListRecordSha256 = fixture.states[0].recordSha256;
      for (let index = 1; index < fixture.events.length; index += 1) fixture.events[index].displayListRecordSha256 = fixture.states[index].recordSha256;
      fixture.events = chainEvents(fixture.events.map(({eventSha256: _hash, previousEventSha256: _previous, ...record}) => record));
      await writeJsonl(fixture.operationLogPath, fixture.events);
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /799x600; expected 800x600/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects a non-allowlisted runtime receipt and a symlink escape", async (t) => {
  await t.test("runtime", async () => {
    const fixture = await createFixture();
    try {
      const receipt = JSON.parse(await readFile(fixture.receiptPath, "utf8"));
      receipt.runtime = {runtimeId: "ruffle", name: "Ruffle", version: "1"};
      await writeJson(fixture.receiptPath, receipt);
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /runtime label is not recognized for an Adobe capture candidate/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("symlink-escape", async () => {
    const fixture = await createFixture();
    const outside = await mkdtemp(path.join(os.tmpdir(), "helpmath-outside-frame-"));
    try {
      const outsideFile = path.join(outside, "outside.png");
      await writeFile(outsideFile, await readFile(path.join(fixture.root, fixture.screenshots[0].file)));
      const link = path.join(fixture.framesDirectory, "escape.png");
      await symlink(outsideFile, link);
      await rewriteEvents(fixture, (events) => { events[0].screenshotFile = portable(path.relative(fixture.root, link)); });
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /outside the project root, or symlink-escaping|exactly 3 regular PNG files/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
      await rm(outside, {recursive: true, force: true});
    }
  });
});

test("rejects stale PNG and toolchain identity-artifact hashes", async (t) => {
  await t.test("png-hash", async () => {
    const fixture = await createFixture();
    try {
      const screenshotPath = path.join(fixture.root, fixture.screenshots[0].file);
      const bytes = Buffer.from(await readFile(screenshotPath));
      bytes[bytes.length - 8] ^= 1;
      await writeFile(screenshotPath, bytes);
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /screenshot SHA-256 mismatch/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("receipt-artifact-hash", async () => {
    const fixture = await createFixture();
    try {
      await writeFile(path.join(fixture.workspace, "evidence", "runtime", "player-version.txt"), "tampered\n");
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /identityArtifacts\[0\] SHA-256 mismatch/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("requires a named-human same-session attestation and rejects post-hoc evidence replacement", async (t) => {
  await t.test("missing-attestation", async () => {
    const fixture = await createFixture();
    try {
      const options = {...fixture.options};
      delete options.captureSessionAttestation;
      const coveragePath = path.join(fixture.workspace, "evidence", "full-frame-coverage.json");
      const coverageBefore = await readFile(coveragePath);
      await assert.rejects(() => prepareRootCaptureCandidate(options), /--capture-session-attestation must be a non-empty string/);
      assert.deepEqual(await readFile(coveragePath), coverageBefore);
      await assert.rejects(
        () => readFile(path.join(fixture.workspace, "evidence", "pending-root-capture", fixture.safeId, "candidate-manifest.json")),
        {code: "ENOENT"},
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("post-hoc-png-and-log-replacement", async () => {
    const fixture = await createFixture();
    try {
      const replacement = new PNG({width: 800, height: 600});
      replacement.data.fill(233);
      const bytes = PNG.sync.write(replacement);
      const newHash = digest(bytes);
      await writeFile(path.join(fixture.root, fixture.screenshots[0].file), bytes);
      fixture.states[0].screenshotSha256 = newHash;
      fixture.states = chainStates(fixture.states.map(({recordSha256: _hash, previousRecordSha256: _previous, ...record}) => record));
      await writeJsonl(fixture.displayListPath, fixture.states);
      fixture.events[0].screenshotSha256 = newHash;
      for (let index = 0; index < fixture.events.length; index += 1) fixture.events[index].displayListRecordSha256 = fixture.states[index].recordSha256;
      fixture.events = chainEvents(fixture.events.map(({eventSha256: _hash, previousEventSha256: _previous, ...record}) => record));
      await writeJsonl(fixture.operationLogPath, fixture.events);
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /differs from the attested ordered frame set|differ from the capture-session attestation/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects every session/spec/source/receipt/time/operator binding mismatch", async (t) => {
  const cases = [
    ["operation-session", async (fixture) => rewriteEvents(fixture, (events) => { events[0].sessionId = "123e4567-e89b-42d3-a456-426614174001"; }), /operation log hash\/identity\/sequence chain/],
    ["display-spec", async (fixture) => rewriteStates(fixture, (states) => { states[0].traceSpecSha256 = "1".repeat(64); }), /display-list record hash\/identity\/sequence chain/],
    ["operation-source", async (fixture) => rewriteEvents(fixture, (events) => { events[0].sourceSwfSha256 = "2".repeat(64); }), /operation log hash\/identity\/sequence chain/],
    ["display-receipt", async (fixture) => rewriteStates(fixture, (states) => { states[0].toolchainReceiptSha256 = "3".repeat(64); }), /display-list record hash\/identity\/sequence chain/],
    ["operation-time", async (fixture) => rewriteEvents(fixture, (events) => { events[0].occurredAt = "2026-07-20T23:59:59.000Z"; }), /outside the session window/],
    ["display-time", async (fixture) => {
      await rewriteStates(fixture, (states) => { states[0].monotonicTimeMs = 70000; });
      await rebindEventsToStates(fixture);
    }, /outside the session window/],
    ["operator", async (fixture) => rewriteEvents(fixture, (events) => { events[0].operator = {...fixture.operator, fullName: "Another Human"}; }), /operator differs from the named-human session attestation/],
  ];
  for (const [name, mutate, expected] of cases) await t.test(name, async () => {
    const fixture = await createFixture();
    try {
      await mutate(fixture);
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), expected);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects stale or fabricated attestation identity, reviewer, chain, and content", async (t) => {
  const cases = [
    ["spec", (attestation) => { attestation.traceSpec.sha256 = "4".repeat(64); }, /differs from the current indexed trace spec/, true],
    ["source", (attestation) => { attestation.sourceSwf.sha256 = "5".repeat(64); }, /differs from the bound source/, true],
    ["receipt", (attestation) => { attestation.toolchainReceipt.sha256 = "6".repeat(64); }, /receipt path\/hash\/runtime identity mismatch/, true],
    ["receipt-session-binding", (attestation) => {
      attestation.toolchainReceipt.captureSessionBinding.sessionId = "123e4567-e89b-42d3-a456-426614174001";
    }, /receipt path\/hash\/runtime identity mismatch/, true],
    ["final-chain", (attestation) => { attestation.operationLog.finalEventSha256 = "7".repeat(64); }, /bytes\/count\/final chain differ/, true],
    ["automation-reviewer", (attestation) => {
      attestation.operator = {...attestation.operator, fullName: "Codex Automation Bot", role: "AI Agent"};
    }, /must not use an automation-like identity/, true],
    ["tampered-statement", (attestation) => { attestation.statement = "changed after signature"; }, /SHA-256 does not match its canonical content/, false],
  ];
  for (const [name, mutate, expected, rehash] of cases) await t.test(name, async () => {
    const fixture = await createFixture();
    try {
      await rewriteAttestation(fixture, mutate, {rehash});
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), expected);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("requires the receipt bytes themselves to bind the exact capture session", async (t) => {
  await t.test("unbound-receipt", async () => {
    const fixture = await createFixture();
    try {
      const receipt = structuredClone(fixture.receipt);
      delete receipt.captureSessionBinding;
      await writeJson(fixture.receiptPath, receipt);
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /toolchain receipt fields must be exactly/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("old-session-receipt-with-attestation-only-forgery", async () => {
    const fixture = await createFixture();
    try {
      const receipt = structuredClone(fixture.receipt);
      receipt.captureSessionBinding.sessionId = "123e4567-e89b-42d3-a456-426614174001";
      const newReceiptSha256 = await writeJson(fixture.receiptPath, receipt);
      await rewriteAttestation(fixture, (attestation) => {
        // The attestation falsely keeps the current session binding while merely
        // updating the receipt byte hash. Receipt bytes remain bound to old session.
        attestation.toolchainReceipt.sha256 = newReceiptSha256;
      });
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /receipt path\/hash\/runtime identity mismatch/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  for (const [name, capturedAt] of [
    ["receipt-before-launch-finalized", "2026-07-20T23:59:59.749Z"],
    ["receipt-after-attestation-start", "2026-07-21T00:00:00.001Z"],
  ]) await t.test(name, async () => {
    const fixture = await createFixture();
    try {
      const receipt = structuredClone(fixture.receipt);
      receipt.capturedAt = capturedAt;
      const newReceiptSha256 = await writeJson(fixture.receiptPath, receipt);
      await rewriteAttestation(fixture, (attestation) => {
        attestation.toolchainReceipt.sha256 = newReceiptSha256;
      });
      await assert.rejects(
        () => prepareRootCaptureCandidate(fixture.options),
        /chronology must satisfy launch\.finalizedAt <= capturedAt <= attestation\.startedAt/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("toolchain-receipt-cannot-bind-future-attestation", async () => {
    const fixture = await createFixture();
    try {
      const receipt = structuredClone(fixture.receipt);
      receipt.attestationSha256 = "8".repeat(64);
      await writeJson(fixture.receiptPath, receipt);
      await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /toolchain receipt fields must be exactly/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects programmatic custom output destinations as well as CLI flags", async (t) => {
  for (const field of ["archiveOutput", "candidateManifestOutput", "candidateReportOutput"]) {
    await t.test(field, async () => {
      const fixture = await createFixture();
      try {
        await assert.rejects(
          () => prepareRootCaptureCandidate({...fixture.options, [field]: "attacker-controlled"}),
          new RegExp(`${field} is unsupported`),
        );
      } finally {
        await rm(fixture.root, {recursive: true, force: true});
      }
    });
  }
});

test("rejects internal output symlinks that resolve fixed pending paths into canonical evidence", async (t) => {
  const cases = [
    {
      name: "pending-requirement-to-canonical-baseline",
      create: async (fixture) => {
        const target = path.join(fixture.workspace, "baseline", "original-runtime");
        const linkParent = path.join(fixture.workspace, "evidence", "pending-root-capture");
        const linkPath = path.join(linkParent, fixture.safeId);
        await mkdir(target, {recursive: true});
        await mkdir(linkParent, {recursive: true});
        await symlink(target, linkPath, "dir");
        return {target, linkPath};
      },
    },
    {
      name: "pending-requirement-to-canonical-trace-execution",
      create: async (fixture) => {
        const target = path.join(fixture.workspace, "baseline", "trace-executions");
        const linkParent = path.join(fixture.workspace, "evidence", "pending-root-capture");
        const linkPath = path.join(linkParent, fixture.safeId);
        await mkdir(target, {recursive: true});
        await mkdir(linkParent, {recursive: true});
        await symlink(target, linkPath, "dir");
        return {target, linkPath};
      },
    },
    {
      name: "pending-archive-to-canonical-original-runtime",
      create: async (fixture) => {
        const archiveParent = path.join(fixture.root, "artifacts", "full-frame", "pilot-baselines", fixture.animationId, fixture.safeId);
        const target = path.join(archiveParent, "original-runtime");
        const linkPath = path.join(archiveParent, "pending-human-owner");
        await mkdir(target, {recursive: true});
        await symlink(target, linkPath, "dir");
        return {target, linkPath};
      },
    },
  ];
  for (const {name, create} of cases) await t.test(name, async () => {
    const fixture = await createFixture();
    try {
      const {target, linkPath} = await create(fixture);
      // This proves the fixture reproduces the old write-through primitive:
      // the fixed pending path really resolves to the canonical directory.
      assert.equal(await realpath(linkPath), await realpath(target));
      await assert.rejects(
        () => prepareRootCaptureCandidate(fixture.options),
        /contains forbidden symbolic-link component/,
      );
      assert.deepEqual(await readdir(target), []);
      await assert.rejects(
        () => readFile(path.join(fixture.workspace, "evidence", "pending-root-capture", fixture.safeId, "candidate-manifest.json")),
        {code: "ENOENT"},
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("append-only EEXIST rejection preserves coverage, source, manifest status, and reviews", async () => {
  const fixture = await createFixture();
  try {
    const coveragePath = path.join(fixture.workspace, "evidence", "full-frame-coverage.json");
    const manifestPath = path.join(fixture.workspace, "migration.json");
    const coverageBefore = await readFile(coveragePath);
    const manifestBefore = await readFile(manifestPath);
    const sourceBefore = await readFile(fixture.sourcePath);
    await prepareRootCaptureCandidate(fixture.options);
    await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /already exists/);
    assert.deepEqual(await readFile(coveragePath), coverageBefore);
    assert.deepEqual(await readFile(manifestPath), manifestBefore);
    assert.deepEqual(await readFile(fixture.sourcePath), sourceBefore);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("PNG validation rejects compressed oversize and hostile IHDR before decode", () => {
  assert.throws(
    () => validateRootFramePngBytes(Buffer.alloc(MAX_ROOT_FRAME_PNG_BYTES + 1), "oversized fixture"),
    /compressed PNG byte limit/,
  );
  const png = new PNG({width: 800, height: 600});
  const bytes = PNG.sync.write(png);
  const hostileIhdr = Buffer.from(bytes);
  hostileIhdr.writeUInt32BE(100_000, 16);
  assert.throws(
    () => validateRootFramePngBytes(hostileIhdr, "hostile IHDR fixture"),
    /IHDR is 100000x600.*decoded byte limit/,
  );
  const observed = validateRootFramePngBytes(bytes, "valid fixture");
  assert.equal(observed.decodedBytes, ROOT_FRAME_DECODED_BYTES);
  assert.equal(observed.compressedBytes, bytes.length);
});

test("rejects hard-linked protected input even when the alias is outside the frames directory", async () => {
  const fixture = await createFixture();
  try {
    const firstFrame = path.join(fixture.root, fixture.screenshots[0].file);
    await link(firstFrame, path.join(path.dirname(fixture.framesDirectory), "outside-frame-hardlink.png"));
    await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /root frame 1 must not be hard-linked/);
    const {candidateManifestPath, candidateReportPath, archiveDirectory} = fixedCandidatePaths(fixture);
    for (const candidate of [candidateManifestPath, candidateReportPath, archiveDirectory]) {
      await assert.rejects(() => lstat(candidate), {code: "ENOENT"});
    }
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects frames-directory overlap with the fixed pending output before publication", async () => {
  const fixture = await createFixture();
  try {
    const {pendingDirectory, candidateManifestPath, candidateReportPath, archiveDirectory} = fixedCandidatePaths(fixture);
    const overlappingFrames = path.join(pendingDirectory, "frames-input");
    await mkdir(path.dirname(overlappingFrames), {recursive: true});
    await rename(fixture.framesDirectory, overlappingFrames);
    fixture.framesDirectory = overlappingFrames;
    fixture.options.frames = portable(path.relative(fixture.root, overlappingFrames));
    const replacementFiles = fixture.screenshots.map((_, index) => portable(path.relative(
      fixture.root,
      path.join(overlappingFrames, `source-frame-${index + 1}.png`),
    )));
    fixture.screenshots.forEach((screenshot, index) => { screenshot.file = replacementFiles[index]; });
    await rewriteEvents(fixture, (events) => {
      events.forEach((event, index) => { event.screenshotFile = replacementFiles[index]; });
    });
    const operationLogSha256 = digest(await readFile(fixture.operationLogPath));
    await rewriteAttestation(fixture, (attestation) => {
      attestation.operationLog.sha256 = operationLogSha256;
      attestation.operationLog.finalEventSha256 = fixture.events.at(-1).eventSha256;
      attestation.frameSet.frames.forEach((frame, index) => { frame.file = replacementFiles[index]; });
      attestation.frameSet.sha256 = orderedFrameSetSha256(attestation.frameSet.frames);
    });
    await assert.rejects(() => prepareRootCaptureCandidate(fixture.options), /root (?:frame 1|frames directory) overlaps root pending output/);
    for (const candidate of [candidateManifestPath, candidateReportPath, archiveDirectory]) {
      await assert.rejects(() => lstat(candidate), {code: "ENOENT"});
    }
    assert.equal((await readdir(overlappingFrames)).length, 3);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("inode CAS rejects a same-byte protected-input replacement after snapshot", async () => {
  const fixture = await createFixture();
  try {
    const originalBytes = await readFile(fixture.operationLogPath);
    const displaced = `${fixture.operationLogPath}.displaced-original`;
    await assert.rejects(
      () => prepareRootCaptureCandidate(fixture.options, {hooks: {
        afterInputSnapshot: async () => {
          await rename(fixture.operationLogPath, displaced);
          await writeFile(fixture.operationLogPath, originalBytes);
        },
      }}),
      /operation log changed after input snapshot candidate preparation/,
    );
    assert.deepEqual(await readFile(fixture.operationLogPath), originalBytes);
    assert.deepEqual(await readFile(displaced), originalBytes);
    const outputs = fixedCandidatePaths(fixture);
    for (const candidate of [outputs.candidateManifestPath, outputs.candidateReportPath, outputs.archiveDirectory]) {
      await assert.rejects(() => lstat(candidate), {code: "ENOENT"});
    }
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("CAS rejects a late protected-input mutation after report publication and rolls back only owned output", async () => {
  const fixture = await createFixture();
  try {
    const outputs = fixedCandidatePaths(fixture);
    await assert.rejects(
      () => prepareRootCaptureCandidate(fixture.options, {hooks: {
        afterReport: async () => {
          await writeFile(fixture.operationLogPath, "foreign late mutation\n");
        },
      }}),
      /operation log changed after final publication|operation log SHA-256 changed/,
    );
    for (const candidate of [outputs.candidateManifestPath, outputs.candidateReportPath, outputs.archiveDirectory]) {
      await assert.rejects(() => lstat(candidate), {code: "ENOENT"});
    }
    assert.equal(await readFile(fixture.operationLogPath, "utf8"), "foreign late mutation\n");
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("exclusive archive publication preserves a concurrently inserted sentinel", async () => {
  const fixture = await createFixture();
  try {
    const outputs = fixedCandidatePaths(fixture);
    const sentinel = path.join(outputs.archiveDirectory, "foreign-sentinel.txt");
    await assert.rejects(
      () => prepareRootCaptureCandidate(fixture.options, {hooks: {
        beforeArchivePublish: async ({archiveDirectory}) => {
          await mkdir(archiveDirectory, {recursive: false});
          await writeFile(sentinel, "foreign archive sentinel\n");
        },
      }}),
      /EEXIST|file already exists/,
    );
    assert.equal(await readFile(sentinel, "utf8"), "foreign archive sentinel\n");
    await assert.rejects(() => lstat(outputs.candidateManifestPath), {code: "ENOENT"});
    await assert.rejects(() => lstat(outputs.candidateReportPath), {code: "ENOENT"});
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("final archived-PNG verification detects and preserves a foreign frame replacement", async () => {
  const fixture = await createFixture();
  try {
    const outputs = fixedCandidatePaths(fixture);
    const displaced = `${outputs.archiveDirectory}.displaced-owned-frame`;
    const replacement = path.join(outputs.archiveDirectory, "frame-0001.png");
    await assert.rejects(
      () => prepareRootCaptureCandidate(fixture.options, {hooks: {
        afterArchivePublishBeforeVerify: async ({archiveDirectory}) => {
          await rename(path.join(archiveDirectory, "frame-0001.png"), displaced);
          await writeFile(replacement, "foreign replacement sentinel\n");
        },
      }}),
      /SHA-256 changed|inode changed|archive inventory changed/,
    );
    assert.equal(await readFile(replacement, "utf8"), "foreign replacement sentinel\n");
    assert.equal((await lstat(displaced)).isFile(), true);
    await assert.rejects(() => lstat(outputs.candidateManifestPath), {code: "ENOENT"});
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rollback preserves a foreign archive-directory replacement and sentinel", async () => {
  const fixture = await createFixture();
  try {
    const outputs = fixedCandidatePaths(fixture);
    const displaced = `${outputs.archiveDirectory}.displaced-owned-archive`;
    const sentinel = path.join(outputs.archiveDirectory, "foreign-directory-sentinel.txt");
    await assert.rejects(
      () => prepareRootCaptureCandidate(fixture.options, {hooks: {
        afterArchive: async ({archiveDirectory}) => {
          await rename(archiveDirectory, displaced);
          await mkdir(archiveDirectory, {recursive: false});
          await writeFile(sentinel, "foreign directory replacement\n");
          throw new Error("injected archive replacement failure");
        },
      }}),
      /injected archive replacement failure/,
    );
    assert.equal(await readFile(sentinel, "utf8"), "foreign directory replacement\n");
    assert.equal((await lstat(displaced)).isDirectory(), true);
    await assert.rejects(() => lstat(outputs.candidateManifestPath), {code: "ENOENT"});
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rollback preserves a foreign candidate-manifest replacement", async () => {
  const fixture = await createFixture();
  try {
    const outputs = fixedCandidatePaths(fixture);
    const displaced = `${outputs.candidateManifestPath}.displaced-owned-file`;
    await assert.rejects(
      () => prepareRootCaptureCandidate(fixture.options, {hooks: {
        afterManifest: async ({candidateManifestPath}) => {
          await rename(candidateManifestPath, displaced);
          await writeFile(candidateManifestPath, "foreign manifest sentinel\n");
          throw new Error("injected manifest replacement failure");
        },
      }}),
      /injected manifest replacement failure/,
    );
    assert.equal(await readFile(outputs.candidateManifestPath, "utf8"), "foreign manifest sentinel\n");
    assert.equal((await lstat(displaced)).isFile(), true);
    await assert.rejects(() => lstat(outputs.candidateReportPath), {code: "ENOENT"});
    await assert.rejects(() => lstat(outputs.archiveDirectory), {code: "ENOENT"});
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});
