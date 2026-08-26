import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {lstat, mkdtemp, mkdir, readFile, readdir, readlink, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {promisify} from "node:util";
import {PNG} from "pngjs";

import {
  HUMAN_REVIEW_STATEMENT,
  LEGACY_ADOPTER_CANONICAL_WRITE_IMPLEMENTATION_PRESENT,
  OWNER_REVIEW_STATEMENT,
  PROMOTION_DISABLED_CODE,
  PROMOTION_REMAINING_GATES,
  PROMOTION_WRITES_ENABLED,
  TRUST_REGISTRY_STATEMENT,
  adoptCourseOriginalRuntimeEvidence,
  buildCanonicalReport,
  originalRuntimePromotionBoundary,
  parseArguments,
} from "./adopt-course-original-runtime-evidence.mjs";
import {canonicalJson, safeRequirementId, sha256Text, validateExecutionProof} from "./build-course-trace-specs.mjs";
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
  PROMOTION_REQUIRED,
  ROOT_PROJECTOR_LAUNCH_PROTOCOL,
  ROOT_SOURCE_OPEN_MENU_PATH,
  ROOT_SOURCE_OPEN_METHOD,
  ROOT_SOURCE_OPEN_STATEMENT,
  captureSessionAttestationSha256,
  displayListRecordSha256,
  operationEventSha256,
  orderedFrameSetSha256,
  recordHash,
  rootLaunchReceiptSha256,
} from "./prepare-root-capture-candidate.mjs";

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const execFileAsync = promisify(execFile);

async function snapshotTree(root) {
  const rows = [];
  async function visit(candidate, relative) {
    const info = await lstat(candidate, {bigint: true});
    const kind = info.isDirectory() ? "directory" : info.isFile() ? "file" : info.isSymbolicLink() ? "symlink" : "other";
    const row = {
      path: relative || ".",
      kind,
      ino: String(info.ino),
      mode: String(info.mode),
      size: String(info.size),
      mtimeNs: String(info.mtimeNs),
      ctimeNs: String(info.ctimeNs),
    };
    if (kind === "file") row.sha256 = digest(await readFile(candidate));
    if (kind === "symlink") row.target = await readlink(candidate);
    rows.push(row);
    if (kind === "directory") {
      const entries = await readdir(candidate, {withFileTypes: true});
      entries.sort((left, right) => left.name.localeCompare(right.name));
      for (const entry of entries) {
        const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
        await visit(path.join(candidate, entry.name), childRelative);
      }
    }
  }
  await visit(root, "");
  return rows;
}

async function writeBytes(root, relative, bytes) {
  const candidate = path.join(root, relative);
  await mkdir(path.dirname(candidate), {recursive: true});
  await writeFile(candidate, bytes);
  return {file: portable(relative), sha256: digest(bytes), path: candidate};
}

async function writeJson(root, relative, value) {
  return writeBytes(root, relative, Buffer.from(`${JSON.stringify(value, null, 2)}\n`));
}

async function writeJsonl(root, relative, values) {
  return writeBytes(root, relative, Buffer.from(`${values.map((value) => JSON.stringify(value)).join("\n")}\n`));
}

function namedHuman(fullName, role, contact) {
  return {kind: "human", fullName, role, organizationOrOwnerId: "HELP Math Owner", contact};
}

function registeredIdentity(identityId, human, authorizedRoles) {
  return {...human, identityId, authorizedRoles, status: "active", registeredAt: "2026-07-19T00:00:00.000Z"};
}

async function createRootPromotionFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-original-runtime-promotion-"));
  const animationId = "course-g04-l03-in-009";
  const requirementId = "req:root:root-standalone:en";
  const safeId = safeRequirementId(requirementId);
  const workspace = path.join(root, "migrations", animationId);
  const sourceRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/IN/L3IN09.swf";
  const sourceBytes = Buffer.from("fixture preserved swf\n");
  await writeBytes(root, sourceRelative, sourceBytes);
  const sourceSha256 = digest(sourceBytes);
  const entryState = {
    kind: "original-root-frame-accurate-entry",
    rootTimelineId: "root",
    rootEntryFrame: 1,
    scenario: "root-standalone",
    language: "en",
    seed: "0",
  };
  const entryStateSha256 = sha256Text(canonicalJson(entryState));
  const requirement = {
    requirementId,
    scenario: "root-standalone",
    frameDomainId: "root",
    traceId: "trace:root:root-standalone:en:seed-0",
    language: "en",
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: 1},
    entryState,
    entryStateSha256,
    baselineAuthorityRequirement: "original-runtime-frame-accurate",
    baselineAuthority: "unresolved",
    status: "blocked",
    blockingReason: "No accepted original-runtime baseline.",
    blockingEvidence: [],
    capturedFrameCount: 0,
    missingFrames: [1],
    baselineCaptureManifest: "",
    baselineCaptureManifestSha256: "",
    captureManifest: "",
    captureManifestSha256: "",
    metricsFile: "",
    metricsSha256: "",
  };
  const migration = {
    schemaVersion: 2,
    id: animationId,
    animationId,
    assetId: `swf-${sourceSha256}`,
    status: "validating",
    source: {swf: sourceRelative, swfSha256: sourceSha256, placementPath: "fixture", pairedFlaStatus: "missing"},
    runtime: {stage: {width: 2, height: 2}, fps: 12, frameCount: 1, rootTimelineId: "root", timelineDefinitions: [], instances: []},
    localization: {languages: ["en"]},
    scenarios: [{id: "root-standalone", kind: "linear", reachable: true}],
    audio: {cues: []},
    implementation: {rendering: "svg", component: "Fixture", defaultFrameDomainId: "root", frameDomains: [{id: "root", kind: "root", frameCount: 1}]},
    acceptance: {humanVisualReview: {status: "pending"}, ownerReview: {decision: "pending"}},
  };
  const coverage = {schemaVersion: 2, animationId, requirements: [requirement]};
  const inventory = {
    schemaVersion: 1,
    animationId,
    migrationStatusAtGeneration: "validating",
    migrationStatusChanged: false,
    evidenceIndex: [],
    timelineInventory: [{timelineId: "root", frameCount: 1}],
  };
  await Promise.all([
    writeJson(root, `migrations/${animationId}/migration.json`, migration),
    writeJson(root, `migrations/${animationId}/evidence/full-frame-coverage.json`, coverage),
    writeJson(root, `migrations/${animationId}/audit/scenario-inventory.json`, inventory),
  ]);
  const spec = {
    schemaVersion: 1,
    artifactType: "course-pilot-original-runtime-trace-specification",
    animationId,
    requirementId,
    traceSpecStatus: "source-frame-accurate-root-ready-for-authoritative-capture",
    identity: {
      frameDomainId: "root",
      traceId: requirement.traceId,
      entryStateSha256,
      scenario: "root-standalone",
      language: "en",
      seed: "0",
      requiredRange: {firstFrame: 1, lastFrame: 1},
      baselineAuthorityRequirement: "original-runtime-frame-accurate",
    },
    traceModel: {kind: "frame-accurate-root-exhaustive", naturalPlaybackClaimed: false},
    sourceBindings: {
      sourceSwf: {path: sourceRelative, sha256: sourceSha256},
      migrationManifest: {path: "migration.json", ...projectionDescriptor({
        projection: TECHNICAL_MANIFEST_PROJECTION.id,
        sha256: technicalManifestSha256(migration),
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
    },
    frameDomain: {id: "root", kind: "root", nativeStage: {width: 2, height: 2}, fps: 12, frameCount: 1},
    schedule: {
      status: "not-required-frame-accurate-root",
      orderedSteps: [],
      stateCheckpoints: [],
      noActionsRequired: false,
      terminalSemantics: {status: "separate-natural-playback-behavior-gate-not-required-for-frame-accurate-root-baseline"},
    },
    executionEvidence: {expectedExecutionReportPath: `baseline/trace-executions/${safeId}.json`},
  };
  const specRelative = `migrations/${animationId}/audit/trace-specs/${safeId}.json`;
  const specDocument = await writeJson(root, specRelative, spec);
  await writeJson(root, "migrations/course-shell-pilot-trace-spec-index.json", {
    schemaVersion: 1,
    artifactType: "course-shell-pilot-trace-spec-index",
    pilots: [{
      animationId,
      traceSpecs: [{
        requirementId,
        frameDomainId: "root",
        traceId: requirement.traceId,
        scenario: "root-standalone",
        language: "en",
        seed: "0",
        traceModel: spec.traceModel.kind,
        status: spec.traceSpecStatus,
        file: specRelative,
        sha256: specDocument.sha256,
        expectedExecutionReport: `migrations/${animationId}/baseline/trace-executions/${safeId}.json`,
      }],
    }],
  });

  const archiveRelative = `artifacts/full-frame/pilot-baselines/${animationId}/${safeId}/pending-human-owner`;
  const operator = namedHuman("Casey Capture", "Original Runtime Operator", "casey@example.test");
  const sessionId = "11111111-1111-4111-8111-111111111111";
  const proofMode = "sequential-step-root-exhaustive";
  const runtime = {runtimeId: "adobe-flash-player-projector", name: "Adobe Flash Player Projector", version: "32.0.0.465"};
  const executableSha256 = "e".repeat(64);
  const executablePath = "/Applications/Flash Player.app/Contents/MacOS/Flash Player";
  const stagedSource = {path: "staged/L3IN09.swf", sha256: sourceSha256};
  const runtimeArtifact = await writeBytes(root, "work/trust/player-version.txt", Buffer.from("Adobe Flash Player Projector 32.0.0.465\n"));
  const captureKit = await writeJson(root, `${archiveRelative}/root-capture-kit-manifest.json`, {
    schemaVersion: 1,
    runtime: {...runtime, executableSha256, executablePath},
    stagedSource: {staged: stagedSource},
  });
  const kitCheck = await writeJson(root, `${archiveRelative}/root-capture-kit-check.json`, {schemaVersion: 1, status: "pass"});
  const launchReceipt = {
    schemaVersion: 2,
    evidenceType: "named-human-hash-bound-root-source-open-receipt",
    sessionId,
    animationId,
    requirementId,
    captureKit: {file: captureKit.file, sha256: captureKit.sha256},
    runtime: {...runtime, executableSha256},
    kitCheck: {file: kitCheck.file, sha256: kitCheck.sha256},
    launchProtocol: ROOT_PROJECTOR_LAUNCH_PROTOCOL,
    projectorStart: {
      executablePath,
      swfArgument: null,
      processId: 1234,
      startedAt: "2026-07-20T23:59:58.000Z",
    },
    sourceOpen: {
      method: ROOT_SOURCE_OPEN_METHOD,
      menuPath: [...ROOT_SOURCE_OPEN_MENU_PATH],
      selectedSource: stagedSource,
      openedAt: "2026-07-20T23:59:59.000Z",
      playerWindowObserved: true,
    },
    endedAt: "2026-07-21T00:00:04.000Z",
    operator,
    statement: ROOT_SOURCE_OPEN_STATEMENT,
  };
  launchReceipt.receiptSha256 = rootLaunchReceiptSha256(launchReceipt);
  const launch = await writeJson(root, `${archiveRelative}/source-open-launch-receipt.json`, launchReceipt);
  const toolchainReceipt = {
    schemaVersion: 1,
    evidenceType: "human-attested-adobe-runtime-toolchain-receipt",
    runtime,
    captureSessionBinding: {
      sessionId,
      traceSpecSha256: specDocument.sha256,
      sourceSwfSha256: sourceSha256,
      captureKitManifestSha256: captureKit.sha256,
      launchReceiptSha256: launch.sha256,
    },
    capturedAt: "2026-07-21T00:00:01.000Z",
    identityArtifacts: [{kind: "product-version-capture", file: runtimeArtifact.file, sha256: runtimeArtifact.sha256}],
  };
  const toolchain = await writeJson(root, `${archiveRelative}/toolchain-receipt.json`, toolchainReceipt);
  const png = new PNG({width: 2, height: 2});
  png.data.fill(127);
  const frame = await writeBytes(root, `${archiveRelative}/frame-0001.png`, PNG.sync.write(png));
  const statePayload = {rootFrame: 1, depths: [{depth: 1, characterId: 7}]};
  const state = {
    schemaVersion: 1,
    evidenceType: "attested-display-list-state",
    animationId,
    requirementId,
    proofMode,
    sessionId,
    traceSpecSha256: specDocument.sha256,
    sourceSwfSha256: sourceSha256,
    captureKitManifestSha256: captureKit.sha256,
    launchReceiptSha256: launch.sha256,
    toolchainReceiptSha256: toolchain.sha256,
    sequence: 1,
    occurredAt: "2026-07-21T00:00:02.100Z",
    monotonicTimeMs: 2100,
    operator,
    frameDomainId: "root",
    observedRootFrame: 1,
    displayListState: statePayload,
    displayListStateSha256: sha256Text(canonicalJson(statePayload)),
    screenshotSha256: frame.sha256,
    previousRecordSha256: null,
  };
  state.recordSha256 = displayListRecordSha256(state);
  const event = {
    schemaVersion: 1,
    evidenceType: "attested-root-frame-operation",
    animationId,
    requirementId,
    proofMode,
    sessionId,
    traceSpecSha256: specDocument.sha256,
    sourceSwfSha256: sourceSha256,
    captureKitManifestSha256: captureKit.sha256,
    launchReceiptSha256: launch.sha256,
    toolchainReceiptSha256: toolchain.sha256,
    sequence: 1,
    occurredAt: "2026-07-21T00:00:02.000Z",
    monotonicTimeMs: 2000,
    operator,
    operation: "rewind",
    operationCountSincePrevious: 1,
    requestedRootFrame: 1,
    observedRootFrame: 1,
    screenshotFile: frame.file,
    screenshotSha256: frame.sha256,
    displayListRecordSha256: state.recordSha256,
    previousEventSha256: null,
  };
  event.eventSha256 = operationEventSha256(event);
  const rawLog = await writeJsonl(root, `${archiveRelative}/operation-log.jsonl`, [event]);
  const stateLog = await writeJsonl(root, `${archiveRelative}/display-list-states.jsonl`, [state]);
  let targetLog;
  const frameSet = [{frame: 1, file: frame.file, sha256: frame.sha256}];
  const attestation = {
    schemaVersion: 1,
    evidenceType: "named-human-root-capture-session-attestation",
    sessionId,
    animationId,
    requirementId,
    proofMode,
    traceSpec: {file: specRelative, sha256: specDocument.sha256},
    sourceSwf: {path: sourceRelative, sha256: sourceSha256},
    launchReceipt: {file: launch.file, sha256: launch.sha256},
    toolchainReceipt: {file: toolchain.file, sha256: toolchain.sha256, runtime, captureSessionBinding: toolchainReceipt.captureSessionBinding},
    operationLog: {file: rawLog.file, sha256: rawLog.sha256, finalEventSha256: event.eventSha256, eventCount: 1},
    displayListRecords: {file: stateLog.file, sha256: stateLog.sha256, finalRecordSha256: state.recordSha256, recordCount: 1},
    frameSet: {algorithm: "ordered-frame-path-sha256-v1", frameCount: 1, frames: frameSet, sha256: orderedFrameSetSha256(frameSet)},
    startedAt: "2026-07-21T00:00:00.000Z",
    endedAt: "2026-07-21T00:00:03.000Z",
    signedAt: "2026-07-21T00:00:04.000Z",
    monotonicTimeOrigin: "milliseconds-since-session-start",
    operator,
    statement: CAPTURE_SESSION_ATTESTATION_STATEMENT,
    notes: CAPTURE_SESSION_AUTHORITY_NOTE,
  };
  attestation.attestationSha256 = captureSessionAttestationSha256(attestation);
  const attestationDocument = await writeJson(root, `${archiveRelative}/capture-session-attestation.json`, attestation);
  targetLog = await writeJson(root, `${archiveRelative}/source-target-resolution-log.json`, {
    schemaVersion: 1,
    evidenceType: "attested-root-capture-candidate-source-target-resolution-log",
    status: "not-applicable-no-source-or-user-actions",
    animationId,
    requirementId,
    proofMode,
    captureSessionAttestation: {file: attestationDocument.file, sha256: attestationDocument.sha256},
    launchReceipt: {file: launch.file, sha256: launch.sha256},
    captureKit: {manifest: {file: captureKit.file, sha256: captureKit.sha256}, kitCheck: {file: kitCheck.file, sha256: kitCheck.sha256}},
    traceSpecBinding: {file: specRelative, sha256: specDocument.sha256},
    rawEventLog: {file: rawLog.file, sha256: rawLog.sha256},
    resolvedTargets: [],
    dispatchedActionCount: 0,
    statement: "Root frame positioning is runtime control evidence, not a source/user interaction target resolution.",
  });
  const candidateManifest = {
    schemaVersion: 1,
    evidenceType: "attested-root-capture-candidate-manifest",
    status: CANDIDATE_STATUS,
    authority: CANDIDATE_AUTHORITY,
    strictAcceptanceEffect: false,
    promotionRequired: structuredClone(PROMOTION_REQUIRED),
    animationId,
    requirementId,
    frameDomainId: "root",
    traceId: requirement.traceId,
    entryStateSha256,
    scenario: "root-standalone",
    language: "en",
    seed: "0",
    capturedAtClaim: attestation.endedAt,
    source: {swf: sourceRelative, swfSha256: sourceSha256},
    declaredRuntimeFacts: {stage: {width: 2, height: 2}, fps: 12, frameCount: 1, frameNumbering: "one-indexed"},
    attestedCaptureClaim: {
      sessionId,
      namedHuman: operator,
      claimedTool: runtime,
      proofMode,
      entryProtocolClaim: "Named human rewound the bound original source in the approved Projector runtime.",
      operationSequenceChainSha256: event.eventSha256,
      displayListSequenceChainSha256: state.recordSha256,
      captureKit: {manifest: {file: captureKit.file, sha256: captureKit.sha256}, kitCheck: {file: kitCheck.file, sha256: kitCheck.sha256}},
      launchReceipt: {file: launch.file, sha256: launch.sha256},
      toolchainReceipt: {file: toolchain.file, sha256: toolchain.sha256},
      captureSessionAttestation: {file: attestationDocument.file, sha256: attestationDocument.sha256},
      limitation: CAPTURE_SESSION_AUTHORITY_NOTE,
    },
    frames: [{
      animationId,
      requirementId,
      frameDomainId: "root",
      traceId: requirement.traceId,
      entryStateSha256,
      frame: 1,
      file: frame.file,
      sha256: frame.sha256,
      width: 2,
      height: 2,
    }],
  };
  const candidateManifestRelative = `migrations/${animationId}/evidence/pending-root-capture/${safeId}/candidate-manifest.json`;
  const candidateManifestDocument = await writeJson(root, candidateManifestRelative, candidateManifest);
  const candidateResult = {
    frame: 1,
    positioningOperation: "rewind",
    operationCountSincePrevious: 1,
    requestSequence: 1,
    captureLogLocator: {requestSequence: 1, byteOffset: 0},
    observedRootFrame: 1,
    observedDisplayListStateSha256: state.displayListStateSha256,
    displayListRecordSha256: state.recordSha256,
    screenshotFile: frame.file,
    screenshotSha256: frame.sha256,
    width: 2,
    height: 2,
    previousResultSha256: null,
    result: "candidate-observation-bound",
  };
  candidateResult.resultSha256 = recordHash(candidateResult, "resultSha256");
  const candidateReport = {
    schemaVersion: 1,
    evidenceType: "attested-root-capture-candidate-report",
    status: CANDIDATE_STATUS,
    authority: CANDIDATE_AUTHORITY,
    strictAcceptanceEffect: false,
    promotionRequired: structuredClone(PROMOTION_REQUIRED),
    proofMode,
    animationId,
    requirementId,
    identity: {frameDomainId: "root", traceId: requirement.traceId, entryStateSha256, scenario: "root-standalone", language: "en", seed: "0"},
    traceSpecBinding: {file: specRelative, sha256: specDocument.sha256},
    captureKit: candidateManifest.attestedCaptureClaim.captureKit,
    launchReceipt: candidateManifest.attestedCaptureClaim.launchReceipt,
    captureSessionAttestation: candidateManifest.attestedCaptureClaim.captureSessionAttestation,
    claimedRuntime: {
      runtimeId: runtime.runtimeId,
      name: runtime.name,
      version: runtime.version,
      build: runtime.version,
      claimedLaunchProtocol: candidateManifest.attestedCaptureClaim.entryProtocolClaim,
      authority: CANDIDATE_AUTHORITY,
      sourceSwfSha256: sourceSha256,
      captureKit: candidateManifest.attestedCaptureClaim.captureKit,
      launchReceipt: candidateManifest.attestedCaptureClaim.launchReceipt,
      toolchainReceipt: candidateManifest.attestedCaptureClaim.toolchainReceipt,
      sessionId,
      namedHumanOperator: operator,
      captureSessionAttestation: candidateManifest.attestedCaptureClaim.captureSessionAttestation,
      authorityStatement: "candidate only",
      authorityLimitations: [CAPTURE_SESSION_AUTHORITY_NOTE],
    },
    rawEventLog: {file: rawLog.file, sha256: rawLog.sha256, eventCount: 1, dispatchedActionCount: 0},
    sourceTargetResolutionLog: {file: targetLog.file, sha256: targetLog.sha256},
    stateSnapshotArchive: {file: stateLog.file, sha256: stateLog.sha256},
    candidateManifest: {file: candidateManifestRelative, sha256: candidateManifestDocument.sha256},
    frameResults: [candidateResult],
    unexpectedEvents: [],
    candidateSequenceChainSha256: candidateResult.resultSha256,
  };
  const candidateReportRelative = `migrations/${animationId}/evidence/pending-root-capture/${safeId}/candidate-report.json`;
  const candidateReportDocument = await writeJson(root, candidateReportRelative, candidateReport);

  const operatorIdentity = registeredIdentity("operator-casey", operator, ["capture-operator"]);
  const human = namedHuman("Harper Reviewer", "Evidence Reviewer", "harper@example.test");
  const owner = namedHuman("Olivia Owner", "Owner Representative", "olivia@example.test");
  const registry = {
    schemaVersion: 1,
    evidenceType: "course-original-runtime-promotion-trust-registry",
    registryId: "help-math-promotion-registry-fixture",
    issuedAt: "2026-07-20T00:00:00.000Z",
    issuer: namedHuman("Isaac Registry", "Trust Registry Issuer", "isaac@example.test"),
    identities: [
      operatorIdentity,
      registeredIdentity("reviewer-harper", human, ["human-evidence-reviewer"]),
      registeredIdentity("owner-olivia", owner, ["owner-representative"]),
    ],
    runtimes: [{
      ...runtime,
      executableSha256,
      status: "approved",
      registeredAt: "2026-07-19T00:00:00.000Z",
      provenanceArtifacts: [{kind: "product-version-capture", file: runtimeArtifact.file, sha256: runtimeArtifact.sha256}],
    }],
    statement: TRUST_REGISTRY_STATEMENT,
  };
  registry.registrySha256 = recordHash(registry, "registrySha256");
  const registryDocument = await writeJson(root, "work/promotion/trust-registry.json", registry);
  const bindings = {
    candidateManifest: {file: candidateManifestRelative, sha256: candidateManifestDocument.sha256},
    candidateReport: {file: candidateReportRelative, sha256: candidateReportDocument.sha256},
    traceSpec: {file: specRelative, sha256: specDocument.sha256},
    sourceSwf: {path: sourceRelative, sha256: sourceSha256},
    trustRegistry: {file: registryDocument.file, sha256: registryDocument.sha256},
  };
  const humanReview = {
    schemaVersion: 1,
    evidenceType: "course-original-runtime-evidence-human-review",
    decision: "accepted",
    animationId,
    requirementId,
    ...bindings,
    captureOperatorIdentityId: operatorIdentity.identityId,
    runtimeId: runtime.runtimeId,
    reviewer: {identityId: "reviewer-harper", ...human},
    reviewedAt: "2026-07-21T01:00:00.000Z",
    scope: "complete-candidate-dag-native-frames-and-trace-semantics",
    statement: HUMAN_REVIEW_STATEMENT,
    notes: "All one native frame and its diff-free evidence chain were reviewed.",
  };
  humanReview.reviewSha256 = recordHash(humanReview, "reviewSha256");
  const humanReviewDocument = await writeJson(root, "work/promotion/human-review.json", humanReview);
  const ownerReview = {
    schemaVersion: 1,
    evidenceType: "course-original-runtime-evidence-owner-promotion-decision",
    decision: "accepted",
    animationId,
    requirementId,
    ...bindings,
    captureOperatorIdentityId: operatorIdentity.identityId,
    runtimeId: runtime.runtimeId,
    reviewer: {identityId: "owner-olivia", ...owner},
    reviewedAt: "2026-07-21T02:00:00.000Z",
    scope: "promote-exact-candidate-to-original-runtime-baseline-only",
    statement: OWNER_REVIEW_STATEMENT,
    notes: "No JavaScript parity or completion decision is made.",
    humanReview: {file: humanReviewDocument.file, sha256: humanReviewDocument.sha256},
    decisionReason: "The exact reviewed candidate may serve as the immutable original-runtime baseline.",
  };
  ownerReview.decisionSha256 = recordHash(ownerReview, "decisionSha256");
  const ownerReviewDocument = await writeJson(root, "work/promotion/owner-review.json", ownerReview);
  return {
    projectRoot: root,
    animationId,
    requirementId,
    safeId,
    workspace,
    candidateManifest: candidateManifestRelative,
    candidateReport: candidateReportRelative,
    trustRegistry: registryDocument.file,
    humanReview: humanReviewDocument.file,
    ownerReview: ownerReviewDocument.file,
    ownerReviewPath: ownerReviewDocument.path,
    framePath: frame.path,
  };
}

test("parses only explicit read-only diagnostics and exposes no write mode", () => {
  const baseArguments = [
    "--candidate-manifest", "candidate.json",
    "--candidate-report", "report.json",
    "--trust-registry", "registry.json",
    "--human-review", "human.json",
    "--owner-review", "owner.json",
  ];
  const options = parseArguments([...baseArguments, "--dry-run", "--json"]);
  assert.equal(options.dryRun, true);
  assert.equal(options.json, true);
  assert.equal(PROMOTION_WRITES_ENABLED, false);
  assert.equal(LEGACY_ADOPTER_CANONICAL_WRITE_IMPLEMENTATION_PRESENT, false);
  assert.equal(PROMOTION_REMAINING_GATES.length, 5);
  assert.deepEqual(
    PROMOTION_REMAINING_GATES.map(({category}) => category),
    ["authority", "natural-trace-causality-dag", "transaction", "path-transaction", "qualification"],
  );
  const boundary = originalRuntimePromotionBoundary("natural");
  assert.equal(boundary.authoritative, false);
  assert.equal(boundary.strictAcceptanceEffect, false);
  assert.equal(boundary.canonicalWriteImplementationPresent, false);
  assert.equal(boundary.signedReleaseBundleIntegrated, false);
  assert.equal(boundary.typedNaturalCausalityIntegrated, false);
  assert.equal(boundary.durablePromotionTransactionIntegrated, false);
  assert.throws(() => parseArguments(baseArguments), {code: PROMOTION_DISABLED_CODE});
  assert.equal(parseArguments([...baseArguments, "--check"]).check, true);
  assert.throws(() => parseArguments([...baseArguments, "--dry-run", "--check"]), /mutually exclusive/);
  for (const flag of ["--promote", "--write", "--apply", "--force", "--repair", "--promote-without-owner"]) {
    assert.throws(() => parseArguments([...baseArguments, flag]), /Unknown option/);
  }
  assert.equal(parseArguments(["--help"]).help, true);
});

test("legacy adopter contains no filesystem mutation capability or latent promote return", async () => {
  const source = await readFile(path.join(repositoryRoot, "scripts", "adopt-course-original-runtime-evidence.mjs"), "utf8");
  const fsPromisesImport = source.match(/import\s*\{([\s\S]*?)\}\s*from\s*"node:fs\/promises";/)?.[1] || "";
  for (const capability of ["appendFile", "chmod", "copyFile", "cp", "link", "mkdir", "rename", "rm", "rmdir", "symlink", "truncate", "unlink", "writeFile"]) {
    assert.doesNotMatch(fsPromisesImport, new RegExp(`(?:^|\\W)${capability}(?:\\W|$)`), capability);
  }
  assert.doesNotMatch(source, /function\s+(?:writeNewAtomic|replaceAtomic|publishArchive)\b/);
  assert.doesNotMatch(source, /mode:\s*["']promote["']/);
  assert.match(source, /throw promotionDisabledError\(\);\s*\n\}/);
});

test("module and npm entry points expose no default write promotion", async (t) => {
  const fixture = await createRootPromotionFixture();
  t.after(() => rm(fixture.projectRoot, {recursive: true, force: true}));
  const before = await snapshotTree(fixture.projectRoot);
  await assert.rejects(adoptCourseOriginalRuntimeEvidence(fixture), {code: PROMOTION_DISABLED_CODE});
  await assert.rejects(adoptCourseOriginalRuntimeEvidence({...fixture, dryRun: false, check: false}), {code: PROMOTION_DISABLED_CODE});
  assert.deepEqual(await snapshotTree(fixture.projectRoot), before);
  const packageJson = JSON.parse(await readFile(path.join(repositoryRoot, "package.json"), "utf8"));
  assert.match(packageJson.scripts["adopt:course:original-runtime-evidence"], /--dry-run$/);
  assert.match(packageJson.scripts["adopt:course:original-runtime-evidence:check"], /--check$/);
  for (const command of [
    packageJson.scripts["adopt:course:original-runtime-evidence"],
    packageJson.scripts["adopt:course:original-runtime-evidence:check"],
  ]) assert.doesNotMatch(command, /(?:^|\s)--(?:promote|write|apply|force|repair)(?:\s|$)/);

  await assert.rejects(
    execFileAsync(process.execPath, [
      path.join(repositoryRoot, "scripts", "adopt-course-original-runtime-evidence.mjs"),
      "--project-root", fixture.projectRoot,
      "--candidate-manifest", fixture.candidateManifest,
      "--candidate-report", fixture.candidateReport,
      "--trust-registry", fixture.trustRegistry,
      "--human-review", fixture.humanReview,
      "--owner-review", fixture.ownerReview,
    ], {cwd: fixture.projectRoot}),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(error.stderr, new RegExp(PROMOTION_DISABLED_CODE));
      assert.doesNotMatch(error.stdout, /PASS|READ-ONLY DIAGNOSTIC/);
      return true;
    },
  );
  assert.deepEqual(await snapshotTree(fixture.projectRoot), before);
});

test("dry-run is byte-for-byte read-only and remains non-authoritative", async (t) => {
  const fixture = await createRootPromotionFixture();
  t.after(() => rm(fixture.projectRoot, {recursive: true, force: true}));
  const coveragePath = path.join(fixture.workspace, "evidence", "full-frame-coverage.json");
  const coverageBefore = await readFile(coveragePath);
  const before = await snapshotTree(fixture.projectRoot);
  const dry = await adoptCourseOriginalRuntimeEvidence({...fixture, dryRun: true});
  assert.equal(dry.mode, "dry-run");
  assert.equal(dry.ok, true);
  assert.equal(dry.coverageStatusAfter, "blocked");
  assert.equal(dry.authoritative, false);
  assert.equal(dry.promotionWritesEnabled, false);
  assert.equal(dry.promotionBoundary.canonicalWriteImplementationPresent, false);
  assert.equal(dry.promotionBoundary.legacyRegistryAndReviewAuthority, "self-hash-operational-records-not-digital-signatures");
  assert.equal(dry.promotionBoundary.signedReleaseBundleIntegrated, false);
  assert.equal(dry.promotionBoundary.typedNaturalCausalityIntegrated, false);
  assert.equal(dry.promotionBoundary.durablePromotionTransactionIntegrated, false);
  assert.equal(dry.promotionBoundary.remainingGates.length, 5);
  assert.equal(dry.strictAcceptanceChanged, false);
  assert.equal(dry.sourceChanged, false);
  assert.equal(dry.pendingCandidateChanged, false);
  assert.equal("inspection" in dry, false);
  assert.equal("promotionReceipt" in dry, false);
  assert.deepEqual(await snapshotTree(fixture.projectRoot), before);
  assert.deepEqual(await readFile(coveragePath), coverageBefore);
  for (const relative of dry.plannedOutputs.slice(0, -1)) {
    await assert.rejects(lstat(path.join(fixture.projectRoot, relative)), /ENOENT/);
  }
  const coverage = JSON.parse(coverageBefore.toString("utf8"));
  const requirement = coverage.requirements[0];
  assert.equal(requirement.status, "blocked");
  assert.equal(requirement.baselineAuthority, "unresolved");
  assert.equal(requirement.baselineCaptureManifest, "");
  assert.equal(requirement.baselineCaptureManifestSha256, "");
  assert.equal(requirement.capturedFrameCount, 0);
  assert.equal(requirement.captureManifest, "");
  assert.equal(requirement.metricsFile, "");
  const migration = JSON.parse(await readFile(path.join(fixture.workspace, "migration.json"), "utf8"));
  assert.equal(migration.acceptance.ownerReview.decision, "pending");
});

test("rejects a candidate DAG whose archived PNG bytes changed", async (t) => {
  const fixture = await createRootPromotionFixture();
  t.after(() => rm(fixture.projectRoot, {recursive: true, force: true}));
  await writeFile(fixture.framePath, Buffer.from("tampered frame"));
  const before = await snapshotTree(fixture.projectRoot);
  await assert.rejects(
    adoptCourseOriginalRuntimeEvidence({...fixture, dryRun: true}),
    /evidence DAG SHA-256 mismatch/,
  );
  assert.deepEqual(await snapshotTree(fixture.projectRoot), before);
});

test("rejects an owner decision that is not explicitly accepted even when re-hashed", async (t) => {
  const fixture = await createRootPromotionFixture();
  t.after(() => rm(fixture.projectRoot, {recursive: true, force: true}));
  const ownerReview = JSON.parse(await readFile(fixture.ownerReviewPath, "utf8"));
  ownerReview.decision = "rejected";
  ownerReview.decisionSha256 = recordHash(ownerReview, "decisionSha256");
  await writeFile(fixture.ownerReviewPath, `${JSON.stringify(ownerReview, null, 2)}\n`);
  const before = await snapshotTree(fixture.projectRoot);
  await assert.rejects(
    adoptCourseOriginalRuntimeEvidence({...fixture, dryRun: true}),
    /owner review schema\/type\/decision\/identity is invalid/,
  );
  assert.deepEqual(await snapshotTree(fixture.projectRoot), before);
});

test("check mode fails read-only when canonical evidence is absent", async (t) => {
  const fixture = await createRootPromotionFixture();
  t.after(() => rm(fixture.projectRoot, {recursive: true, force: true}));
  const before = await snapshotTree(fixture.projectRoot);
  await assert.rejects(
    adoptCourseOriginalRuntimeEvidence({...fixture, check: true}),
    /canonical accepted archive is missing/,
  );
  assert.deepEqual(await snapshotTree(fixture.projectRoot), before);
});

test("read-only validation rejects symlinked control files", async (t) => {
  const fixture = await createRootPromotionFixture();
  t.after(() => rm(fixture.projectRoot, {recursive: true, force: true}));
  const migrationPath = path.join(fixture.workspace, "migration.json");
  const copiedPath = path.join(fixture.projectRoot, "work", "same-migration.json");
  await mkdir(path.dirname(copiedPath), {recursive: true});
  await writeFile(copiedPath, await readFile(migrationPath));
  await rm(migrationPath);
  await symlink(path.relative(path.dirname(migrationPath), copiedPath), migrationPath);
  const before = await snapshotTree(fixture.projectRoot);
  await assert.rejects(
    adoptCourseOriginalRuntimeEvidence({...fixture, dryRun: true}),
    /migration manifest contains forbidden symbolic-link component/,
  );
  assert.deepEqual(await snapshotTree(fixture.projectRoot), before);
});

test("read-only validation rejects animation IDs outside the fixed pilot allowlist", async (t) => {
  const fixture = await createRootPromotionFixture();
  t.after(() => rm(fixture.projectRoot, {recursive: true, force: true}));
  const manifestPath = path.join(fixture.projectRoot, fixture.candidateManifest);
  const reportPath = path.join(fixture.projectRoot, fixture.candidateReport);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  manifest.animationId = "../source-assets/forbidden";
  report.animationId = manifest.animationId;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const before = await snapshotTree(fixture.projectRoot);
  await assert.rejects(
    adoptCourseOriginalRuntimeEvidence({...fixture, dryRun: true}),
    /fixed course\/shell trace pilot allowlist/,
  );
  assert.deepEqual(await snapshotTree(fixture.projectRoot), before);
});

test("natural candidate conversion emits the canonical scheduled trace contract", () => {
  const sourceSha256 = "a".repeat(64);
  const specSha256 = "b".repeat(64);
  const imageSha256 = "c".repeat(64);
  const action = {event: "release"};
  const sourceTarget = {timelineId: "sprite-1", objectId: "9", depth: "2"};
  const pre = {rootFrame: 2, localFrame: 1, language: "en", seed: "0", enabled: true};
  const post = {rootFrame: 2, localFrame: 2, language: "en", seed: "0", enabled: false};
  const step = {
    order: 1,
    action,
    sourceTarget,
    preStateCheckpoint: {checkpointId: "before", expectedState: pre},
    postStateCheckpoint: {checkpointId: "after", expectedState: post},
  };
  const terminalSemantics = {status: "source-evidenced", expectedState: {...post, playState: "stopped"}};
  const spec = {
    animationId: "course-natural",
    requirementId: "req:sprite-1:default:en",
    traceSpecStatus: "source-schedule-ready-for-authoritative-execution",
    identity: {
      frameDomainId: "sprite-1",
      traceId: "trace:sprite-1:default:en:seed-0",
      entryStateSha256: "d".repeat(64),
      scenario: "default",
      language: "en",
      seed: "0",
      requiredRange: {firstFrame: 1, lastFrame: 2},
      baselineAuthorityRequirement: "original-runtime-natural-trace",
    },
    frameDomain: {id: "sprite-1", kind: "nested", parentEntryFrame: 2, frameCount: 2, nativeStage: {width: 800, height: 600}, fps: 12},
    schedule: {
      status: "source-evidenced-executable",
      noActionsRequired: false,
      orderedSteps: [step],
      stateCheckpoints: [{id: "after", expectedState: post}],
      terminalSemantics,
    },
    sourceBindings: {sourceSwf: {path: "source.swf", sha256: sourceSha256}},
  };
  const states = [pre, terminalSemantics.expectedState].map((observedState, index) => ({
    record: {
      observedState,
      observedStateSha256: sha256Text(canonicalJson(observedState)),
      observedRootFrame: 2,
      observedLocalFrame: index + 1,
      screenshotSha256: imageSha256,
    },
    byteOffset: index * 100,
  }));
  const event = {sequence: 2, action, sourceTarget};
  const bound = {
    definition: {kind: "natural"},
    animationId: spec.animationId,
    requirementId: spec.requirementId,
    spec,
    specFile: "audit/trace.json",
    specDocument: {sha256: specSha256},
    source: spec.sourceBindings.sourceSwf,
    pendingArchiveRelative: "pending",
    candidateReport: {
      proofMode: "natural-trace-ordered-events",
      rawEventLog: {file: "pending/events.jsonl", sha256: "e".repeat(64), eventCount: 3, dispatchedActionCount: 1},
      sourceTargetResolutionLog: {file: "pending/targets.jsonl", sha256: "f".repeat(64)},
      stateSnapshotArchive: {file: "pending/states.jsonl", sha256: "1".repeat(64)},
    },
  };
  const canonicalFrames = [1, 2].map((frame) => ({frame, file: `accepted/frame-${frame}.png`, sha256: imageSha256}));
  const report = buildCanonicalReport({
    bound,
    attestation: {
      runtime: {name: "Adobe Flash Player Projector", version: "32.0.0.414"},
      executableSha256: "2".repeat(64),
      claim: {entryProtocolClaim: "source-bound natural entry"},
    },
    evidence: {
      stateLog: {records: states},
      actionEvents: new Map([[1, {event, byteOffset: 50}]]),
      targetByOrder: new Map([[1, {target: {resolvedSourceTarget: sourceTarget}}]]),
    },
    canonicalFrames,
    acceptedArchiveRelative: "accepted",
    baselineDescriptor: {file: "baseline.json", sha256: "3".repeat(64)},
  });
  assert.equal(report.frameResults.length, 0);
  assert.equal(report.orderedStepResults.length, 1);
  assert.equal(report.terminalResult.frameEvidence.length, 2);
  assert.equal(validateExecutionProof(spec, report, {traceSpecFile: "audit/trace.json", traceSpecSha256: specSha256}), true);
});
