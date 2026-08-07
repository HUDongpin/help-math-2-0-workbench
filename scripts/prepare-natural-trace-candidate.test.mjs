import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {chmod, link, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {PNG} from "pngjs";

import {canonicalJson, safeRequirementId, sha256Text} from "./build-course-trace-specs.mjs";
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
  NATURAL_CAPTURE_SESSION_ATTESTATION_STATEMENT,
  NATURAL_CAPTURE_SESSION_AUTHORITY_NOTE,
  NATURAL_ENVIRONMENT_ISOLATION_STATEMENT,
  NATURAL_HOST_OPEN_MENU_PATH,
  NATURAL_HOST_OPEN_METHOD,
  NATURAL_LAUNCH_RECEIPT_STATEMENT,
  NATURAL_PROJECTOR_LAUNCH_PROTOCOL,
  naturalCaptureSessionAttestationSha256,
  naturalEnvironmentIsolationReceiptSha256,
  naturalHostEntryRecordSha256,
  naturalLaunchReceiptSha256,
  naturalOperationEventSha256,
  naturalStateRecordSha256,
  naturalTargetResolutionSha256,
  parseArguments,
  prepareNaturalTraceCandidate,
} from "./prepare-natural-trace-candidate.mjs";
import {
  CANDIDATE_AUTHORITY,
  CANDIDATE_STATUS,
  orderedFrameSetSha256,
} from "./prepare-root-capture-candidate.mjs";

const PROOF_MODE = "natural-trace-ordered-events";
const APPROVED_EXECUTABLE_SHA256 = "8f4e10c8c28698f3429a1489f9592f6ae5697fb6eb7d15c4cfe83e925b1ebc30";
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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

function chain(records, {hashField, previousField, hash}) {
  let previous = null;
  return records.map((record) => {
    const next = {...record, [previousField]: previous};
    next[hashField] = hash(next);
    previous = next[hashField];
    return next;
  });
}

function chainStates(records) {
  return chain(records, {
    hashField: "recordSha256",
    previousField: "previousRecordSha256",
    hash: naturalStateRecordSha256,
  });
}

function chainTargets(records) {
  return chain(records, {
    hashField: "recordSha256",
    previousField: "previousRecordSha256",
    hash: naturalTargetResolutionSha256,
  });
}

function chainEvents(records) {
  return chain(records, {
    hashField: "eventSha256",
    previousField: "previousEventSha256",
    hash: naturalOperationEventSha256,
  });
}

function chainHostEntry(records) {
  return chain(records, {
    hashField: "recordSha256",
    previousField: "previousRecordSha256",
    hash: naturalHostEntryRecordSha256,
  });
}

function withoutChain(record, hashField, previousField) {
  const next = {...record};
  delete next[hashField];
  delete next[previousField];
  return next;
}

function scheduleBinding(spec) {
  return {
    orderedStepsSha256: sha256Text(canonicalJson(spec.schedule.orderedSteps)),
    stateCheckpointsSha256: sha256Text(canonicalJson(spec.schedule.stateCheckpoints)),
    playbackSegmentsSha256: sha256Text(canonicalJson(spec.schedule.playbackSegments)),
    terminalExpectedStateSha256: sha256Text(canonicalJson(spec.schedule.terminalSemantics.expectedState)),
  };
}

function isoAt(base, milliseconds) {
  return new Date(base + milliseconds).toISOString();
}

async function createFixture({wrongDimensionFrame = 0, slowArchive = false} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "helpmath-natural-candidate-"));
  const animationId = "course-g05-l13-rw-002";
  const requirementId = "req:sprite-334:default:en";
  const safeId = safeRequirementId(requirementId);
  const workspace = path.join(root, "migrations", animationId);
  const sourceRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/RW/L13RW02.swf";
  const hostRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/index_local.swf";
  const initialChildRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/IR/L13RW01.swf";
  const spanishAudioRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/SA/L13RW02.mp3";
  const englishKeytermsRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml";
  const sourcePath = path.join(root, sourceRelative);
  const hostPath = path.join(root, hostRelative);
  const initialChildPath = path.join(root, initialChildRelative);
  const spanishAudioPath = path.join(root, spanishAudioRelative);
  const englishKeytermsPath = path.join(root, englishKeytermsRelative);
  const sourceBytes = Buffer.from("fixture nested lesson SWF\n");
  const hostBytes = Buffer.from("fixture original lesson host SWF\n");
  const initialChildBytes = Buffer.from("fixture default startup child SWF\n");
  const spanishAudioBytes = Buffer.from("fixture Spanish audio MP3 bytes\n");
  const englishKeytermsBytes = Buffer.from("<keyterms><word>Source</word></keyterms>\n");
  await mkdir(path.dirname(sourcePath), {recursive: true});
  await writeFile(sourcePath, sourceBytes);
  await writeFile(hostPath, hostBytes);
  await mkdir(path.dirname(initialChildPath), {recursive: true});
  await mkdir(path.dirname(spanishAudioPath), {recursive: true});
  await mkdir(path.dirname(englishKeytermsPath), {recursive: true});
  await writeFile(initialChildPath, initialChildBytes);
  await writeFile(spanishAudioPath, spanishAudioBytes);
  await writeFile(englishKeytermsPath, englishKeytermsBytes);
  const sourceSha256 = digest(sourceBytes);
  const hostSha256 = digest(hostBytes);
  const initialChildSha256 = digest(initialChildBytes);
  const spanishAudioSha256 = digest(spanishAudioBytes);
  const englishKeytermsSha256 = digest(englishKeytermsBytes);

  const frameCount = 3;
  const entryState = {
    kind: "natural-root-placement-entry",
    rootTimelineId: "root",
    rootEntryFrame: 6,
    instanceId: "main-animation",
    frameDomainId: "sprite-334",
    localEntryFrame: 1,
    scenario: "default",
    language: "en",
    seed: "0",
  };
  const entryStateSha256 = sha256Text(canonicalJson(entryState));
  const requirement = {
    requirementId,
    scenario: "default",
    frameDomainId: "sprite-334",
    traceId: "trace:sprite-334:default:en:seed-0",
    language: "en",
    seed: "0",
    requiredRange: {firstFrame: 1, lastFrame: frameCount},
    entryState,
    entryStateSha256,
    baselineAuthorityRequirement: "original-runtime-natural-trace",
    baselineAuthority: "unresolved",
    status: "blocked",
    blockingReason: "No accepted authoritative natural trace baseline.",
    blockingEvidence: [],
    capturedFrameCount: 0,
    missingFrames: [1, 2, 3],
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
    runtime: {stage: {width: 800, height: 600}, fps: 12, frameCount: 10},
    localization: {languages: ["en", "es"]},
    scenarios: [{id: "default", kind: "interactive", reachable: true}],
    implementation: {
      frameDomains: [
        {id: "root", kind: "root", frameCount: 10},
        {id: "sprite-334", kind: "nested", frameCount, parentFrameDomainId: "root", parentEntryFrame: 6},
      ],
    },
    acceptance: {humanVisualReview: {decision: "pending"}, ownerReview: {decision: "pending"}},
  };
  const coverage = {schemaVersion: 2, animationId, requirements: [requirement]};
  const inventory = {
    schemaVersion: 1,
    animationId,
    inventoryStatus: "static-exhaustive-runtime-unverified",
    migrationStatusAtGeneration: "validating",
    migrationStatusChanged: false,
    evidenceIndex: [],
    timelineInventory: [
      {timelineId: "root", frameCount: 10},
      {timelineId: "sprite-334", frameCount},
    ],
  };
  await writeJson(path.join(workspace, "migration.json"), manifest);
  await writeJson(path.join(workspace, "evidence", "full-frame-coverage.json"), coverage);
  await writeJson(path.join(workspace, "audit", "scenario-inventory.json"), inventory);

  const generatorRelative = "scripts/fixture-natural-schedule-generator.mjs";
  const parserRelative = "scripts/fixture-natural-geometry-parser.py";
  const generatorBytes = Buffer.from("// fixture generator\n");
  const parserBytes = Buffer.from("# fixture parser\n");
  await mkdir(path.join(root, "scripts"), {recursive: true});
  await writeFile(path.join(root, generatorRelative), generatorBytes);
  await writeFile(path.join(root, parserRelative), parserBytes);

  const originalHostGeneratorRelative = "scripts/build-rw002-original-host-entry-contract.mjs";
  const originalHostGeneratorBytes = await readFile(path.join(repositoryRoot, originalHostGeneratorRelative));
  const originalHostGeneratorPath = path.join(root, originalHostGeneratorRelative);
  await writeFile(originalHostGeneratorPath, originalHostGeneratorBytes);
  const generatedBy = {path: originalHostGeneratorRelative, sha256: digest(originalHostGeneratorBytes)};
  const requiredFiles = [
    {path: hostRelative, sha256: hostSha256, bytes: hostBytes.length, role: "unmodified-original-lesson-host"},
    {path: initialChildRelative, sha256: initialChildSha256, bytes: initialChildBytes.length, role: "source-script-proven-default-startup-child"},
    {path: sourceRelative, sha256: sourceSha256, bytes: sourceBytes.length, role: "target-animation-child"},
    {path: spanishAudioRelative, sha256: spanishAudioSha256, bytes: spanishAudioBytes.length, role: "source-script-derived-spanish-user-activated-track"},
    {path: englishKeytermsRelative, sha256: englishKeytermsSha256, bytes: englishKeytermsBytes.length, role: "automatic-english-keyterm-xml-read-at-host-root-frame-50"},
  ];
  const originalHostEvidencePaths = {
    entryContract: path.join(workspace, "audit", "original-host-entry-contract.json"),
    minimalTree: path.join(workspace, "audit", "original-host-minimal-tree.json"),
    sideEffectDenyList: path.join(workspace, "audit", "original-host-side-effect-deny-list.json"),
    placementProof: path.join(workspace, "audit", "original-host-placement-proof.json"),
  };
  const originalHostPlacementProof = {
    schemaVersion: 1,
    artifactType: "help-math-original-host-structural-placement-proof",
    animationId,
    generatedBy,
    sourceHost: {path: hostRelative, sha256: hostSha256, bytes: hostBytes.length},
    structuralChain: {
      definitions: [{objectId: 696, frameCount: 1}, {objectId: 697, frameCount: 1}],
      placements: [
        {timelineId: "root", frame: 50, objectId: 697, instanceName: "glossary", depth: 82},
        {timelineId: "sprite-697", frame: 1, objectId: 696, instanceName: "keyterms", depth: 1},
      ],
    },
    runtimeQualification: "Static placement proves the request chain, not XML parse success or exact runtime load outcome.",
  };
  const placementProofDescriptor = {
    file: portable(path.relative(root, originalHostEvidencePaths.placementProof)),
    sha256: await writeJson(originalHostEvidencePaths.placementProof, originalHostPlacementProof),
  };
  const originalHostEntryContract = {
    schemaVersion: 1,
    artifactType: "help-math-original-host-entry-contract",
    animationId,
    generatedBy,
    sourceHost: {
      path: hostRelative,
      sha256: hostSha256,
      bytes: hostBytes.length,
      header: {nativeStage: {width: 800, height: 600}, fps: 12, rootFrameCount: 50},
    },
    targetChild: {path: sourceRelative, sha256: sourceSha256, bytes: sourceBytes.length},
    authority: {
      sourceDerivationComplete: true,
      originalRuntimeExecutedByThisArtifact: false,
      baselineAuthorityClaimed: false,
      naturalTraceFramesCapturedByThisArtifact: 0,
    },
    contracts: {
      childLoad: {status: "source-proven"},
      internalPreloaderEntryHandoff: {status: "source-proven", expectedTargetRootFrame: 6},
      targetNavigationInventory: {status: "source-proven-clean-start-next-control-runtime-navigation-still-to-be-executed"},
      spanishAudioStopResume: {
        expectedResolvedTrack: {
          path: requiredFiles[3].path,
          sha256: requiredFiles[3].sha256,
          bytes: requiredFiles[3].bytes,
          role: requiredFiles[3].role,
        },
      },
      automaticEnglishKeytermRead: {
        status: "source-proven-request-chain-runtime-load-and-parse-result-pending",
        structuralPlacementProof: {path: placementProofDescriptor.file, sha256: placementProofDescriptor.sha256},
        expectedResolvedFile: {
          path: requiredFiles[4].path,
          sha256: requiredFiles[4].sha256,
          bytes: requiredFiles[4].bytes,
          role: requiredFiles[4].role,
        },
      },
    },
  };
  const originalHostMinimalTree = {
    schemaVersion: 1,
    artifactType: "help-math-original-host-minimal-lesson-tree-manifest",
    animationId,
    generatedBy,
    expectedRelativeLayoutFromArchiveRoot: [
      "HELP_COURSES/ELMGR5/L13/index_local.swf",
      "HELP_COURSES/ELMGR5/L13/IR/L13RW01.swf",
      "HELP_COURSES/ELMGR5/L13/RW/L13RW02.swf",
      "HELP_COURSES/ELMGR5/L13/SA/L13RW02.mp3",
      "HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml",
    ],
    requiredFileCount: requiredFiles.length,
    requiredTotalBytes: requiredFiles.reduce((total, item) => total + item.bytes, 0),
    requiredFiles,
    structuralPlacementProof: {path: placementProofDescriptor.file, sha256: placementProofDescriptor.sha256},
    selectionPolicy: {failClosed: true, sourceTreeCopiedByThisGenerator: false},
    validation: {
      allRequiredFilesExist: true,
      allRequiredHashesMatch: true,
      layoutDerivedFromSourceScripts: true,
      wholeLessonTreeRequired: false,
      automaticKeytermRequestRuntimeResultPending: true,
    },
  };
  const originalHostSideEffectDenyList = {
    schemaVersion: 1,
    artifactType: "help-math-original-host-side-effect-deny-list",
    animationId,
    generatedBy,
    defaultPolicy: "deny-all-external-effects-and-dynamic-loads-except-hash-bound-local-read-allowlist",
    authority: {sandboxEnforcedByThisArtifact: false, sideEffectsExecutedByThisArtifact: false},
    localReadAllowlist: requiredFiles.map(({path: file, sha256, bytes, role}) => ({path: file, sha256, bytes, role})),
    deniedCapabilities: [
      {capability: "network"},
      {capability: "javascript-or-browser-navigation"},
      {capability: "persistent-storage"},
      {capability: "process-and-window-control"},
      {capability: "apple-events-launch-services-and-child-processes"},
      {capability: "unmanifested-local-file-read"},
    ],
  };
  const originalHostEvidence = {
    entryContract: {
      file: portable(path.relative(root, originalHostEvidencePaths.entryContract)),
      sha256: await writeJson(originalHostEvidencePaths.entryContract, originalHostEntryContract),
    },
    minimalTree: {
      file: portable(path.relative(root, originalHostEvidencePaths.minimalTree)),
      sha256: await writeJson(originalHostEvidencePaths.minimalTree, originalHostMinimalTree),
    },
    sideEffectDenyList: {
      file: portable(path.relative(root, originalHostEvidencePaths.sideEffectDenyList)),
      sha256: await writeJson(originalHostEvidencePaths.sideEffectDenyList, originalHostSideEffectDenyList),
    },
    placementProof: placementProofDescriptor,
  };
  const runtimeKitRoot = path.join(root, "work", "natural-trace-capture-kits", animationId, safeId);
  const runtimeTreeRoot = path.join(runtimeKitRoot, "runtime-tree");
  const runtimeTreeFiles = [];
  for (const item of requiredFiles) {
    const archiveRelativePath = item.path.slice("source-assets/flash/HELP MATH_ORIGINAL FILES/".length);
    const stagedFile = `runtime-tree/${archiveRelativePath}`;
    const stagedPath = path.join(runtimeKitRoot, stagedFile);
    await mkdir(path.dirname(stagedPath), {recursive: true});
    await writeFile(stagedPath, await readFile(path.join(root, item.path)), {mode: 0o444});
    runtimeTreeFiles.push({
      sourcePath: item.path,
      archiveRelativePath,
      stagedFile,
      sha256: item.sha256,
      bytes: item.bytes,
      role: item.role,
    });
  }
  const runtimeTreeDocument = {
    schemaVersion: 1,
    artifactType: "unsigned-hash-bound-original-host-runtime-tree",
    templateStatus: "unsigned-template-only-not-evidence",
    notEvidence: true,
    animationId,
    requirementId,
    sourceManifest: originalHostEvidence.minimalTree,
    sourceArchiveRoot: "source-assets/flash/HELP MATH_ORIGINAL FILES",
    stagedRoot: "runtime-tree",
    fileCount: requiredFiles.length,
    totalBytes: requiredFiles.reduce((total, item) => total + item.bytes, 0),
    files: runtimeTreeFiles,
    launchHost: {
      sourcePath: hostRelative,
      stagedFile: runtimeTreeFiles[0].stagedFile,
      sha256: hostSha256,
      bytes: hostBytes.length,
    },
    isolation: {
      sourceAssetsLaunchedDirectly: false,
      onlyManifestedCourseContentPresent: true,
      relativeLayoutPreservedFromArchiveRoot: true,
      sourceFilesCopiedByteForByte: true,
      sourceFilesModified: false,
      limitation: "Fixture stages only the five hash-bound HELP Math files; runtime observations remain pending.",
    },
  };
  const runtimeTreeManifestPath = path.join(runtimeKitRoot, "runtime-tree-manifest.json");
  const runtimeTreeManifest = {
    file: portable(path.relative(root, runtimeTreeManifestPath)),
    sha256: await writeJson(runtimeTreeManifestPath, runtimeTreeDocument),
  };

  const frame1State = {
    rootFrame: 6,
    rootPlayState: "stopped",
    localFrame: 1,
    localPlayState: "playing",
    language: "en",
    seed: "0",
  };
  const frame2State = {
    rootFrame: 6,
    rootPlayState: "stopped",
    localFrame: 2,
    localPlayState: "stopped",
    language: "en",
    seed: "0",
    checkpointMarker: "before",
    activeControl: {buttonObjectId: 111, hitShapeObjectId: 110, depth: 722},
  };
  const frame3State = {
    rootFrame: 6,
    rootPlayState: "stopped",
    localFrame: 3,
    localPlayState: "stopped",
    language: "en",
    seed: "0",
    checkpointMarker: "after",
    terminalMarker: "complete",
    globalVariables: {quizSection: false},
    inactiveControl: {buttonObjectId: 111, removalDepth: 722, removalFrame: 3},
  };
  const checkpoints = [
    {id: "frame-1-natural-entry", expectedState: frame1State, evidence: [{artifactId: "fixture-source"}]},
    {id: "frame-2-before-source-press", expectedState: frame2State, evidence: [{artifactId: "fixture-source"}]},
    {
      id: "frame-3-after-source-press",
      expectedState: {...frame3State, terminalMarker: undefined},
      evidence: [{artifactId: "fixture-source"}],
    },
  ];
  delete checkpoints[2].expectedState.terminalMarker;
  const action = {
    event: "press",
    dispatchPhase: "pointer-down",
    coordinateSpace: "native-stage-pixels",
    pointer: {x: 404.7174042072904, y: 103.89167144629172},
    sourceCommand: "play()",
  };
  const sourceTarget = {
    timelineId: "sprite-334",
    localFrame: 2,
    buttonObjectId: 111,
    hitShapeObjectId: 110,
    depth: 722,
    stageHitBounds: {left: 92.79, top: 97.19, right: 716.64, bottom: 110.59, units: "pixels"},
  };
  const orderedStep = {
    order: 1,
    action,
    sourceTarget,
    preStateCheckpoint: {checkpointId: checkpoints[1].id, expectedState: checkpoints[1].expectedState},
    postStateCheckpoint: {checkpointId: checkpoints[2].id, expectedState: checkpoints[2].expectedState},
    evidence: [{artifactId: "fixture-source", script: "button-111-press"}],
  };
  const terminalExpectedState = {
    rootFrame: 6,
    rootPlayState: "stopped",
    localFrame: 3,
    localPlayState: "stopped",
    globalVariables: {quizSection: false},
    terminalMarker: "complete",
  };
  const schedule = {
    status: "source-evidenced-executable",
    sourceEvidence: [{artifactId: "fixture-source"}],
    noActionsRequired: false,
    playbackSegments: [
      {id: "frame-1-natural-play", requiredRange: {firstFrame: 1, lastFrame: 1}, expectedState: frame1State, evidence: [{artifactId: "fixture-source"}]},
      {
        id: "frame-2-source-stop",
        requiredRange: {firstFrame: 2, lastFrame: 2},
        expectedState: {
          rootFrame: 6,
          rootPlayState: "stopped",
          localFrame: 2,
          localPlayState: "stopped",
          activeControl: frame2State.activeControl,
        },
        evidence: [{artifactId: "fixture-source"}],
      },
      {
        id: "frame-3-terminal-stop",
        requiredRange: {firstFrame: 3, lastFrame: 3},
        expectedState: {
          rootFrame: 6,
          rootPlayState: "stopped",
          localFrame: 3,
          localPlayState: "stopped",
          globalVariables: {quizSection: false},
        },
        evidence: [{artifactId: "fixture-source"}],
      },
    ],
    orderedSteps: [orderedStep],
    executedSteps: [],
    stateCheckpoints: checkpoints,
    terminalSemantics: {status: "source-evidenced", expectedState: terminalExpectedState, evidence: [{artifactId: "fixture-source"}]},
    exhaustiveFrameCapturePlan: {indexing: "one-indexed", firstFrame: 1, lastFrame: frameCount, frameCount},
  };
  const spec = {
    schemaVersion: 1,
    artifactType: "course-pilot-original-runtime-trace-specification",
    animationId,
    requirementId,
    traceSpecStatus: "source-schedule-ready-for-authoritative-execution",
    identity: {
      frameDomainId: "sprite-334",
      traceId: requirement.traceId,
      entryStateSha256,
      scenario: "default",
      scenarioKind: "interactive",
      language: "en",
      seed: "0",
      requiredRange: {firstFrame: 1, lastFrame: frameCount},
      baselineAuthorityRequirement: "original-runtime-natural-trace",
    },
    traceModel: {
      kind: "stateful-natural-trace",
      domainScope: "nested",
      interactionMode: "interactive",
      positioningProofModes: [],
      naturalPlaybackClaimed: true,
    },
    sourceBindings: {
      sourceSwf: {path: sourceRelative, sha256: sourceSha256},
      migrationManifest: {
        path: "migration.json",
        ...projectionDescriptor({
          projection: TECHNICAL_MANIFEST_PROJECTION.id,
          sha256: technicalManifestSha256(manifest),
          excludedPaths: TECHNICAL_MANIFEST_PROJECTION.excludedPaths,
        }),
      },
      fullFrameCoverage: {
        path: "evidence/full-frame-coverage.json",
        ...projectionDescriptor({
          projection: TRACE_COVERAGE_PROJECTION.id,
          sha256: traceCoverageSha256(coverage),
          includedPaths: TRACE_COVERAGE_PROJECTION.includedRequirementPaths,
          excludedPaths: TRACE_COVERAGE_PROJECTION.excludedRequirementPaths,
        }),
      },
      scenarioInventory: {
        path: "audit/scenario-inventory.json",
        ...projectionDescriptor({
          projection: SCENARIO_INVENTORY_PROJECTION.id,
          sha256: scenarioInventorySha256(inventory),
          excludedPaths: SCENARIO_INVENTORY_PROJECTION.excludedPaths,
        }),
      },
      scheduleDerivation: {
        status: "hash-bound-static-source-derivation-not-runtime-execution",
        generator: {path: generatorRelative, sha256: digest(generatorBytes)},
        geometryParser: {path: parserRelative, sha256: digest(parserBytes)},
        sourceArtifacts: {
          sourceSwf: {path: sourceRelative, sha256: sourceSha256},
          originalHostSwf: {path: hostRelative, sha256: hostSha256},
        },
        executionEvidenceCreated: false,
      },
    },
    frameDomain: {
      id: "sprite-334",
      kind: "nested",
      sourceTimelineId: "sprite-334",
      sourceInstanceId: "main-animation",
      parentFrameDomainId: "root",
      parentEntryFrame: 6,
      localEntryFrame: 1,
      frameCount,
      nativeStage: {width: 800, height: 600},
      fps: 12,
    },
    entryState,
    schedule,
    executionEvidence: {expectedExecutionReportPath: `baseline/trace-executions/${safeId}.json`},
  };
  const specRelative = `migrations/${animationId}/audit/trace-specs/${safeId}.json`;
  const specPath = path.join(root, specRelative);
  const specSha256 = await writeJson(specPath, spec);
  const expectedExecution = `migrations/${animationId}/baseline/trace-executions/${safeId}.json`;
  const index = {
    schemaVersion: 1,
    artifactType: "course-shell-pilot-trace-spec-index",
    pilots: [{
      animationId,
      traceSpecs: [{
        requirementId,
        status: spec.traceSpecStatus,
        traceModel: "stateful-natural-trace",
        file: specRelative,
        sha256: specSha256,
        expectedExecutionReport: expectedExecution,
      }],
    }],
  };
  await writeJson(path.join(root, "migrations", "course-shell-pilot-trace-spec-index.json"), index);

  const sessionId = "123e4567-e89b-42d3-a456-426614174000";
  const sessionBase = Date.UTC(2026, 6, 21, 0, 0, 0, 0);
  const operator = {
    kind: "human",
    fullName: "María Elena Rivera",
    role: "Authorized Flash Runtime Capture Reviewer",
    organizationOrOwnerId: "HELP-MATH-OWNER-001",
    contact: "maria.rivera@example.edu",
  };
  const executableReceiptRelative = `migrations/${animationId}/evidence/runtime/executable-receipt.txt`;
  const executableReceiptPath = path.join(root, executableReceiptRelative);
  const executableReceiptBytes = Buffer.from(`runtime=Adobe Flash Player Projector 32.0.0.414\nexecutable_sha256=${APPROVED_EXECUTABLE_SHA256}\n`);
  await mkdir(path.dirname(executableReceiptPath), {recursive: true});
  await writeFile(executableReceiptPath, executableReceiptBytes);
  const captureRoot = path.join(root, "work", "authorized-natural-capture", animationId, safeId);
  const receipt = {
    schemaVersion: 1,
    evidenceType: "human-attested-adobe-runtime-toolchain-receipt",
    runtime: {runtimeId: "adobe-flash-player-projector", name: "Adobe Flash Player Projector", version: "32.0.0.414"},
    captureSessionBinding: {
      sessionId,
      traceSpecSha256: specSha256,
      sourceSwfSha256: sourceSha256,
      originalHostSwfSha256: hostSha256,
    },
    capturedAt: isoAt(sessionBase, 50),
    identityArtifacts: [{kind: "executable-sha256-receipt", file: executableReceiptRelative, sha256: digest(executableReceiptBytes)}],
  };
  const receiptRelative = `migrations/${animationId}/evidence/runtime/toolchain-receipt.json`;
  const receiptPath = path.join(root, receiptRelative);

  const nodeExecutable = {path: process.execPath, sha256: digest(await readFile(process.execPath))};
  const captureKitManifestPath = path.join(runtimeKitRoot, "kit-manifest.json");
  const captureKitLauncherPath = path.join(runtimeKitRoot, "launch-original-host-sandboxed.sh");
  const captureKitSandboxProfilePath = path.join(runtimeKitRoot, "sandbox.sb");
  const runtimeAppPath = "/Applications/Adobe Flash Player.app";
  const runtimeExecutablePath = `${runtimeAppPath}/Contents/MacOS/Flash Player`;
  const captureKitManifest = {
    schemaVersion: 1,
    artifactType: "rw-natural-trace-capture-operator-kit",
    status: "unsigned-template-only-not-evidence",
    strictAcceptanceEffect: false,
    animationId,
    requirementId,
    bindings: {originalHostEvidence: structuredClone(originalHostEvidence)},
    runtime: {
      ...receipt.runtime,
      appPath: runtimeAppPath,
      executablePath: runtimeExecutablePath,
      launcherNodeExecutable: nodeExecutable,
    },
    originalHostLaunch: {
      authority: "safety-probe-only-not-authoritative-clean-profile",
      authoritativeCapturePermittedByThisLauncher: false,
      stagedHost: {
        file: runtimeTreeFiles[0].stagedFile,
        sha256: runtimeTreeFiles[0].sha256,
        bytes: runtimeTreeFiles[0].bytes,
      },
      stagedRuntimeTreeManifest: runtimeTreeManifest,
      sourceTreeLaunchedDirectly: false,
      launchProtocol: NATURAL_PROJECTOR_LAUNCH_PROTOCOL,
      launcherStartsEmptyProjector: true,
      commandLineSwfArgumentProvided: false,
      commandLineHostOpenClaimed: false,
      hostOpen: {
        method: NATURAL_HOST_OPEN_METHOD,
        menuPath: [...NATURAL_HOST_OPEN_MENU_PATH],
        selectedHost: {
          file: runtimeTreeFiles[0].stagedFile,
          sha256: runtimeTreeFiles[0].sha256,
          bytes: runtimeTreeFiles[0].bytes,
        },
        requiresNamedHumanObservation: true,
      },
      launchesChildAlone: false,
    },
  };
  const captureKitLauncher = `#!/bin/sh\n"${nodeExecutable.path}" "${path.join(repositoryRoot, "scripts", "prepare-natural-trace-candidate.mjs")}" --check "${specRelative}" "${runtimeAppPath}"\nprintf '%s\\n' 'PROCESS LAUNCH ONLY — NOT HOST-OPEN EVIDENCE.' '${runtimeTreeFiles[0].stagedFile}'\n# PROJECTOR_START_MODE=empty-no-swf-argument\n# HOST_OPEN_MODE=named-human-gui-file-open\nexec /usr/bin/sandbox-exec -f sandbox.sb '${runtimeExecutablePath}'\n`;
  const captureKitSandboxProfile = `(version 1)\n(deny network*)\n(deny appleevent-send)\n(deny file-write* (subpath "Library/Preferences/Macromedia/Flash Player"))\n`;
  const captureKit = {
    kitManifest: {
      file: portable(path.relative(root, captureKitManifestPath)),
      sha256: await writeJson(captureKitManifestPath, captureKitManifest),
    },
    launcher: {
      file: portable(path.relative(root, captureKitLauncherPath)),
      sha256: digest(Buffer.from(captureKitLauncher)),
    },
    sandboxProfile: {
      file: portable(path.relative(root, captureKitSandboxProfilePath)),
      sha256: digest(Buffer.from(captureKitSandboxProfile)),
    },
    runtimeTreeManifest,
    nodeExecutable,
  };
  await writeFile(captureKitLauncherPath, captureKitLauncher, {mode: 0o555});
  await writeFile(captureKitSandboxProfilePath, captureKitSandboxProfile, {mode: 0o444});

  const environmentPreflightInventoryPath = path.join(captureRoot, "environment-preflight-inventory.json");
  const environmentPostflightInventoryPath = path.join(captureRoot, "environment-postflight-inventory.json");
  const environmentPreflightInventory = {
    file: portable(path.relative(root, environmentPreflightInventoryPath)),
    sha256: await writeJson(environmentPreflightInventoryPath, {
      files: [],
      runningFlashProcesses: [],
      ...(slowArchive ? {archiveRacePadding: "x".repeat(32 * 1024 * 1024)} : {}),
    }),
  };
  const environmentPostflightInventory = {
    file: portable(path.relative(root, environmentPostflightInventoryPath)),
    sha256: await writeJson(environmentPostflightInventoryPath, {unexpectedFiles: [], unexpectedMutations: []}),
  };
  const environmentIsolationReceipt = {
    schemaVersion: 1,
    evidenceType: "named-human-disposable-flash-runtime-environment-receipt",
    sessionId,
    animationId,
    requirementId,
    isolationMode: "dedicated-one-time-macos-login-account",
    operatingSystem: {productVersion: "15.5", buildVersion: "24F74", architecture: "arm64"},
    account: {
      userName: "helpmath-capture-fixture",
      uid: 501,
      homeDirectory: "/Users/helpmath-capture-fixture",
      realOsAccount: true,
      dedicatedToCapture: true,
    },
    profile: {
      identifier: "fixture-disposable-flash-profile",
      createdForSession: true,
      reused: false,
      normalSharedObjectReadWriteSemantics: true,
      resetOrDestroyedAfterSession: true,
    },
    preflight: {
      runningFlashProcessCount: 0,
      sharedObjectFileCount: 0,
      cookienameFileCount: 0,
      incomingCookieKeyCount: 0,
      bookmarkState: "absent-or-false",
      dtfBMID: "",
      inventory: environmentPreflightInventory,
    },
    runtimeObservations: {
      sharedObjectGetLocalReturnedObject: true,
      bookmarkBranchTaken: false,
      defaultStartupIrObserved: true,
      targetRwNavigationObserved: true,
      automaticEnglishKeytermRequested: true,
      automaticEnglishKeytermLoadSucceeded: true,
      automaticEnglishKeytermParseSucceeded: true,
    },
    postflight: {
      unexpectedProfileFileCount: 0,
      unexpectedMutations: [],
      profileResetOrDestroyed: true,
      inventory: environmentPostflightInventory,
    },
    operator,
    startedAt: isoAt(sessionBase, -100),
    endedAt: isoAt(sessionBase, 1050),
    signedAt: isoAt(sessionBase, 1150),
    statement: NATURAL_ENVIRONMENT_ISOLATION_STATEMENT,
    receiptSha256: null,
  };
  environmentIsolationReceipt.receiptSha256 = naturalEnvironmentIsolationReceiptSha256(environmentIsolationReceipt);
  const environmentIsolationReceiptPath = path.join(captureRoot, "environment-isolation-receipt.json");
  const environmentIsolation = {
    file: portable(path.relative(root, environmentIsolationReceiptPath)),
    sha256: await writeJson(environmentIsolationReceiptPath, environmentIsolationReceipt),
  };

  const launchKitCheckPath = path.join(captureRoot, "capture-kit-check.json");
  const launchKitCheck = {
    status: "verified-unsigned-template-only",
    animationId,
    requirementId,
    traceSpecSha256: specSha256,
    sourceSwfSha256: sourceSha256,
    originalHostSwfSha256: hostSha256,
    runtimeExecutableSha256: APPROVED_EXECUTABLE_SHA256,
    captureKitManifestSha256: captureKit.kitManifest.sha256,
    launcherSha256: captureKit.launcher.sha256,
    sandboxProfileSha256: captureKit.sandboxProfile.sha256,
    runtimeTreeManifestSha256: captureKit.runtimeTreeManifest.sha256,
    nodeExecutableSha256: captureKit.nodeExecutable.sha256,
    strictAcceptanceEffect: false,
    migrationStatusChanged: false,
  };
  const launchKitCheckDescriptor = {
    file: portable(path.relative(root, launchKitCheckPath)),
    sha256: await writeJson(launchKitCheckPath, launchKitCheck),
  };
  const launchReceiptDocument = {
    schemaVersion: 2,
    evidenceType: "named-human-hash-bound-original-host-launch-receipt",
    sessionId,
    animationId,
    requirementId,
    proofMode: PROOF_MODE,
    captureKit,
    environmentIsolation,
    runtime: receipt.runtime,
    workingDirectory: `${portable(path.relative(root, runtimeKitRoot))}/runtime-tree`,
    kitCheck: launchKitCheckDescriptor,
    launchProtocol: NATURAL_PROJECTOR_LAUNCH_PROTOCOL,
    projectorStart: {
      executablePath: runtimeExecutablePath,
      swfArgument: null,
      processId: 4242,
      startedAt: isoAt(sessionBase, -50),
    },
    hostOpen: {
      method: NATURAL_HOST_OPEN_METHOD,
      menuPath: [...NATURAL_HOST_OPEN_MENU_PATH],
      selectedHost: captureKitManifest.originalHostLaunch.stagedHost,
      openedAt: isoAt(sessionBase, -25),
      playerWindowObserved: true,
    },
    endedAt: isoAt(sessionBase, 1050),
    operator,
    statement: NATURAL_LAUNCH_RECEIPT_STATEMENT,
    receiptSha256: null,
  };
  launchReceiptDocument.receiptSha256 = naturalLaunchReceiptSha256(launchReceiptDocument);
  const launchReceiptPath = path.join(captureRoot, "launch-receipt.json");
  const launchReceipt = {
    file: portable(path.relative(root, launchReceiptPath)),
    sha256: await writeJson(launchReceiptPath, launchReceiptDocument),
  };
  Object.assign(receipt.captureSessionBinding, {
    captureKitManifestSha256: captureKit.kitManifest.sha256,
    sandboxProfileSha256: captureKit.sandboxProfile.sha256,
    environmentIsolationReceiptSha256: environmentIsolation.sha256,
    launchReceiptSha256: launchReceipt.sha256,
  });
  const receiptSha256 = await writeJson(receiptPath, receipt);

  const framesDirectory = path.join(captureRoot, "frames");
  await mkdir(framesDirectory, {recursive: true});
  const screenshots = [];
  for (let frame = 1; frame <= frameCount; frame += 1) {
    const png = new PNG({width: frame === wrongDimensionFrame ? 799 : 800, height: 600});
    png.data.fill(frame * 29);
    const bytes = PNG.sync.write(png);
    const file = path.join(framesDirectory, `source-frame-${frame}.png`);
    await writeFile(file, bytes);
    screenshots.push({frame, file: portable(path.relative(root, file)), sha256: digest(bytes)});
  }
  const observedStates = [frame1State, frame2State, frame3State];
  const common = {
    schemaVersion: 1,
    animationId,
    requirementId,
    proofMode: PROOF_MODE,
    sessionId,
    traceSpecSha256: specSha256,
    sourceSwfSha256: sourceSha256,
    originalHostSwfSha256: hostSha256,
    captureKitManifestSha256: captureKit.kitManifest.sha256,
    sandboxProfileSha256: captureKit.sandboxProfile.sha256,
    environmentIsolationReceiptSha256: environmentIsolation.sha256,
    launchReceiptSha256: launchReceipt.sha256,
    toolchainReceiptSha256: receiptSha256,
    operator,
  };
  const hostEntryDetails = [
    ["clean-profile-observed", {
      sharedObjectGetLocalReturnedObject: true,
      incomingCookieKeyCount: 0,
      bookmarkState: "absent-or-false",
      dtfBMID: "",
    }],
    ["host-root-frame-observed", {hostRootFrame: 50, hostPlayState: "stopped"}],
    ["automatic-keyterm-xml-result", {
      resolvedPath: englishKeytermsRelative,
      sha256: englishKeytermsSha256,
      loadSucceeded: true,
      parseSucceeded: true,
    }],
    ["default-ir-child-load", {
      resolvedPath: initialChildRelative,
      sha256: initialChildSha256,
      loadSucceeded: true,
    }],
    ["next-navigation-action", {
      control: "original-host-next",
      event: "release",
      sectionBefore: 1,
      slideBefore: 2,
      sectionAfter: 2,
      slideAfter: 1,
    }],
    ["target-rw-child-load", {resolvedPath: sourceRelative, sha256: sourceSha256, loadSucceeded: true}],
    ["nested-entry-observed", {
      childRootFrame: 6,
      childRootPlayState: "stopped",
      frameDomainId: "sprite-334",
      localFrame: 1,
    }],
    ["side-effect-summary", {
      unexpectedLocalLoads: [],
      networkAttempts: [],
      appleEvents: [],
      persistentWritesOutsideDisposableProfile: [],
      sandboxDenials: [],
    }],
  ];
  const hostEntryTimes = [10, 20, 30, 40, 50, 60, 70, 900];
  const hostEntryRecords = chainHostEntry(hostEntryDetails.map(([eventKind, details], index) => ({
    schemaVersion: 1,
    evidenceType: "attested-original-host-entry-observation",
    eventKind,
    sessionId,
    animationId,
    requirementId,
    proofMode: PROOF_MODE,
    traceSpecSha256: specSha256,
    sourceSwfSha256: sourceSha256,
    originalHostSwfSha256: hostSha256,
    captureKitManifestSha256: captureKit.kitManifest.sha256,
    environmentIsolationReceiptSha256: environmentIsolation.sha256,
    launchReceiptSha256: launchReceipt.sha256,
    sequence: index + 1,
    occurredAt: isoAt(sessionBase, hostEntryTimes[index]),
    monotonicTimeMs: hostEntryTimes[index],
    operator,
    details,
  })));
  const hostEntryLogPath = path.join(captureRoot, "host-entry-log.jsonl");
  const hostEntryLogSha256 = await writeJsonl(hostEntryLogPath, hostEntryRecords);
  const hostEntryLog = {
    file: portable(path.relative(root, hostEntryLogPath)),
    sha256: hostEntryLogSha256,
    finalRecordSha256: hostEntryRecords.at(-1).recordSha256,
    recordCount: hostEntryRecords.length,
  };
  let states = chainStates(observedStates.map((observedState, index) => ({
    ...common,
    evidenceType: "attested-natural-trace-state-snapshot",
    sequence: index + 1,
    occurredAt: isoAt(sessionBase, [200, 400, 700][index]),
    monotonicTimeMs: [200, 400, 700][index],
    frameDomainId: "sprite-334",
    observedRootFrame: 6,
    observedLocalFrame: index + 1,
    observedState,
    observedStateSha256: sha256Text(canonicalJson(observedState)),
    screenshotFile: screenshots[index].file,
    screenshotSha256: screenshots[index].sha256,
  })));
  let targets = chainTargets([{
    ...common,
    evidenceType: "attested-natural-source-target-resolution",
    sequence: 1,
    occurredAt: isoAt(sessionBase, 450),
    monotonicTimeMs: 450,
    scheduleStepOrder: 1,
    action,
    expectedSourceTarget: sourceTarget,
    resolvedSourceTarget: sourceTarget,
    resolution: "resolved-exactly-to-bound-source-target",
  }]);
  let events = chainEvents([
    {
      ...common,
      evidenceType: "attested-natural-trace-operation",
      eventKind: "frame-observation",
      sequence: 1,
      occurredAt: isoAt(sessionBase, 100),
      monotonicTimeMs: 100,
      frameDomainId: "sprite-334",
      observedRootFrame: 6,
      observedLocalFrame: 1,
      screenshotFile: screenshots[0].file,
      screenshotSha256: screenshots[0].sha256,
      stateSnapshotRecordSha256: states[0].recordSha256,
    },
    {
      ...common,
      evidenceType: "attested-natural-trace-operation",
      eventKind: "frame-observation",
      sequence: 2,
      occurredAt: isoAt(sessionBase, 300),
      monotonicTimeMs: 300,
      frameDomainId: "sprite-334",
      observedRootFrame: 6,
      observedLocalFrame: 2,
      screenshotFile: screenshots[1].file,
      screenshotSha256: screenshots[1].sha256,
      stateSnapshotRecordSha256: states[1].recordSha256,
    },
    {
      ...common,
      evidenceType: "attested-natural-trace-operation",
      eventKind: "source-action-dispatch",
      sequence: 3,
      occurredAt: isoAt(sessionBase, 500),
      monotonicTimeMs: 500,
      scheduleStepOrder: 1,
      action,
      sourceTarget,
      preCheckpointId: checkpoints[1].id,
      postCheckpointId: checkpoints[2].id,
      preStateSnapshotRecordSha256: states[1].recordSha256,
      postStateSnapshotRecordSha256: states[2].recordSha256,
      sourceTargetResolutionRecordSha256: targets[0].recordSha256,
    },
    {
      ...common,
      evidenceType: "attested-natural-trace-operation",
      eventKind: "frame-observation",
      sequence: 4,
      occurredAt: isoAt(sessionBase, 600),
      monotonicTimeMs: 600,
      frameDomainId: "sprite-334",
      observedRootFrame: 6,
      observedLocalFrame: 3,
      screenshotFile: screenshots[2].file,
      screenshotSha256: screenshots[2].sha256,
      stateSnapshotRecordSha256: states[2].recordSha256,
    },
  ]);
  const operationLogPath = path.join(captureRoot, "operation-log.jsonl");
  const stateSnapshotsPath = path.join(captureRoot, "state-snapshots.jsonl");
  const targetResolutionsPath = path.join(captureRoot, "source-target-resolutions.jsonl");
  const operationLogSha256 = await writeJsonl(operationLogPath, events);
  const stateSnapshotsSha256 = await writeJsonl(stateSnapshotsPath, states);
  const targetResolutionsSha256 = await writeJsonl(targetResolutionsPath, targets);
  const frameSetFrames = screenshots.map(({frame, file, sha256}) => ({frame, file, sha256}));
  let attestation = {
    schemaVersion: 1,
    evidenceType: "named-human-natural-trace-capture-session-attestation",
    sessionId,
    animationId,
    requirementId,
    proofMode: PROOF_MODE,
    traceSpec: {file: specRelative, sha256: specSha256},
    sourceSwf: {path: sourceRelative, sha256: sourceSha256},
    originalHostSwf: {path: hostRelative, sha256: hostSha256},
    originalHostEvidence,
    runtimeTreeManifest,
    captureKit,
    environmentIsolation,
    launchReceipt,
    hostEntryLog,
    toolchainReceipt: {
      file: receiptRelative,
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
    sourceTargetResolutions: {
      file: portable(path.relative(root, targetResolutionsPath)),
      sha256: targetResolutionsSha256,
      finalRecordSha256: targets.at(-1).recordSha256,
      recordCount: targets.length,
    },
    stateSnapshots: {
      file: portable(path.relative(root, stateSnapshotsPath)),
      sha256: stateSnapshotsSha256,
      finalRecordSha256: states.at(-1).recordSha256,
      recordCount: states.length,
    },
    frameSet: {
      algorithm: "ordered-frame-path-sha256-v1",
      frameCount,
      frames: frameSetFrames,
      sha256: orderedFrameSetSha256(frameSetFrames),
    },
    scheduleBinding: scheduleBinding(spec),
    startedAt: isoAt(sessionBase, 0),
    endedAt: isoAt(sessionBase, 1000),
    signedAt: isoAt(sessionBase, 1100),
    monotonicTimeOrigin: "milliseconds-since-session-start",
    operator,
    unexpectedEvents: [],
    statement: NATURAL_CAPTURE_SESSION_ATTESTATION_STATEMENT,
    notes: NATURAL_CAPTURE_SESSION_AUTHORITY_NOTE,
  };
  attestation.attestationSha256 = naturalCaptureSessionAttestationSha256(attestation);
  const attestationPath = path.join(captureRoot, "capture-session-attestation.json");
  await writeJson(attestationPath, attestation);

  const fixture = {
    root,
    workspace,
    animationId,
    requirementId,
    safeId,
    sourcePath,
    hostPath,
    initialChildPath,
    spanishAudioPath,
    englishKeytermsPath,
    sourceRelative,
    hostRelative,
    initialChildRelative,
    spanishAudioRelative,
    englishKeytermsRelative,
    manifest,
    coverage,
    inventory,
    spec,
    specPath,
    specRelative,
    receipt,
    receiptPath,
    receiptRelative,
    executableReceiptPath,
    operationLogPath,
    stateSnapshotsPath,
    targetResolutionsPath,
    framesDirectory,
    screenshots,
    states,
    targets,
    events,
    attestation,
    attestationPath,
    operator,
    sessionId,
    originalHostEntryContract,
    originalHostMinimalTree,
    originalHostSideEffectDenyList,
    originalHostPlacementProof,
    originalHostEvidence,
    originalHostEvidencePaths,
    originalHostGeneratorPath,
    runtimeTreeDocument,
    runtimeTreeManifest,
    runtimeTreeManifestPath,
    runtimeTreeRoot,
    captureKit,
    captureKitManifest,
    captureKitManifestPath,
    captureKitLauncher,
    captureKitLauncherPath,
    captureKitSandboxProfile,
    captureKitSandboxProfilePath,
    nodeExecutable,
    environmentIsolation,
    environmentIsolationReceipt,
    environmentIsolationReceiptPath,
    environmentPreflightInventoryPath,
    environmentPostflightInventoryPath,
    launchReceipt,
    launchReceiptDocument,
    launchReceiptPath,
    launchKitCheckPath,
    hostEntryLog,
    hostEntryLogPath,
    hostEntryRecords,
  };
  fixture.options = {
    projectRoot: root,
    spec: specRelative,
    operationLog: portable(path.relative(root, operationLogPath)),
    frames: portable(path.relative(root, framesDirectory)),
    stateSnapshots: portable(path.relative(root, stateSnapshotsPath)),
    sourceTargetResolutions: portable(path.relative(root, targetResolutionsPath)),
    environmentIsolationReceipt: environmentIsolation.file,
    launchReceipt: launchReceipt.file,
    hostEntryLog: hostEntryLog.file,
    toolchainReceipt: receiptRelative,
    captureSessionAttestation: portable(path.relative(root, attestationPath)),
  };
  return fixture;
}

async function rewriteSpecAndIndex(fixture, mutate) {
  mutate(fixture.spec);
  const specSha256 = await writeJson(fixture.specPath, fixture.spec);
  const indexPath = path.join(fixture.root, "migrations", "course-shell-pilot-trace-spec-index.json");
  const index = JSON.parse(await readFile(indexPath, "utf8"));
  index.pilots[0].traceSpecs[0].sha256 = specSha256;
  index.pilots[0].traceSpecs[0].status = fixture.spec.traceSpecStatus;
  index.pilots[0].traceSpecs[0].traceModel = fixture.spec.traceModel.kind;
  await writeJson(indexPath, index);
}

async function rewriteStates(fixture, mutate) {
  const states = structuredClone(fixture.states);
  mutate(states);
  fixture.states = chainStates(states.map((record) => withoutChain(record, "recordSha256", "previousRecordSha256")));
  await writeJsonl(fixture.stateSnapshotsPath, fixture.states);
}

async function rewriteTargets(fixture, mutate) {
  const targets = structuredClone(fixture.targets);
  mutate(targets);
  fixture.targets = chainTargets(targets.map((record) => withoutChain(record, "recordSha256", "previousRecordSha256")));
  await writeJsonl(fixture.targetResolutionsPath, fixture.targets);
}

async function rewriteEvents(fixture, mutate) {
  const events = structuredClone(fixture.events);
  mutate(events);
  fixture.events = chainEvents(events.map((record) => withoutChain(record, "eventSha256", "previousEventSha256")));
  await writeJsonl(fixture.operationLogPath, fixture.events);
}

async function rebindEvents(fixture) {
  fixture.events = chainEvents(fixture.events.map((event) => {
    const next = withoutChain(event, "eventSha256", "previousEventSha256");
    if (next.eventKind === "frame-observation") {
      const state = fixture.states[next.observedLocalFrame - 1];
      next.stateSnapshotRecordSha256 = state.recordSha256;
      next.screenshotFile = state.screenshotFile;
      next.screenshotSha256 = state.screenshotSha256;
    } else {
      next.preStateSnapshotRecordSha256 = fixture.states[1].recordSha256;
      next.postStateSnapshotRecordSha256 = fixture.states[2].recordSha256;
      next.sourceTargetResolutionRecordSha256 = fixture.targets[0].recordSha256;
    }
    return next;
  }));
  await writeJsonl(fixture.operationLogPath, fixture.events);
}

async function rewriteAttestation(fixture, mutate, {rehash = true} = {}) {
  const attestation = structuredClone(fixture.attestation);
  mutate(attestation);
  if (rehash) attestation.attestationSha256 = naturalCaptureSessionAttestationSha256(attestation);
  fixture.attestation = attestation;
  await writeJson(fixture.attestationPath, attestation);
}

test("parseArguments exposes only fixed offline natural-trace candidate inputs", () => {
  const options = parseArguments([
    "--spec", "spec.json",
    "--operation-log", "operations.jsonl",
    "--frames", "frames",
    "--state-snapshots", "states.jsonl",
    "--source-target-resolutions", "targets.jsonl",
    "--host-entry-log", "host-entry.jsonl",
    "--environment-isolation-receipt", "environment.json",
    "--launch-receipt", "launch.json",
    "--toolchain-receipt", "receipt.json",
    "--capture-session-attestation", "attestation.json",
  ]);
  assert.equal(options.stateSnapshots, "states.jsonl");
  assert.equal(options.sourceTargetResolutions, "targets.jsonl");
  assert.equal(options.hostEntryLog, "host-entry.jsonl");
  assert.equal(options.environmentIsolationReceipt, "environment.json");
  assert.equal(options.launchReceipt, "launch.json");
  for (const forbidden of ["--update-coverage", "--operator", "--baseline-output", "--archive-output", "--promote"]) {
    assert.throws(() => parseArguments([forbidden]), /Unknown option/);
  }
});

test("prepares pending-only natural-trace evidence and leaves source, coverage, status, and reviews unchanged", async () => {
  const fixture = await createFixture();
  try {
    const sourceBefore = await readFile(fixture.sourcePath);
    const hostBefore = await readFile(fixture.hostPath);
    const manifestPath = path.join(fixture.workspace, "migration.json");
    const coveragePath = path.join(fixture.workspace, "evidence", "full-frame-coverage.json");
    const manifestBefore = await readFile(manifestPath);
    const coverageBefore = await readFile(coveragePath);
    const result = await prepareNaturalTraceCandidate(fixture.options);
    assert.equal(result.status, CANDIDATE_STATUS);
    assert.equal(result.authority, CANDIDATE_AUTHORITY);
    assert.equal(result.strictAcceptanceEffect, false);
    assert.equal(result.frameCount, 3);
    assert.equal(result.orderedStepCount, 1);
    assert.equal(result.coverageChanged, false);
    assert.equal(result.statusChanged, false);
    assert.equal(result.reviewsChanged, false);
    assert.equal(result.sourceChanged, false);
    assert.match(result.archiveDirectory, /pending-human-owner-natural-trace$/);
    assert.deepEqual(await readFile(fixture.sourcePath), sourceBefore);
    assert.deepEqual(await readFile(fixture.hostPath), hostBefore);
    assert.deepEqual(await readFile(manifestPath), manifestBefore);
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
    assert.equal(candidateReport.orderedStepResults.length, 1);
    assert.equal(candidateReport.checkpointResults.length, 3);
    assert.equal(candidateReport.terminalResult.result, "candidate-terminal-semantics-observed");
    assert.equal(candidateReport.claimedRuntime.originalHostSwf.sha256, digest(hostBefore));
    assert.deepEqual(candidateManifest.source.originalHostEvidence, fixture.originalHostEvidence);
    assert.deepEqual(candidateReport.originalHostEvidence, fixture.originalHostEvidence);
    assert.deepEqual(candidateReport.claimedRuntime.originalHostEvidence, fixture.originalHostEvidence);
    assert.deepEqual(candidateReport.runtimeTreeManifest, candidateManifest.source.runtimeTreeManifest);
    assert.deepEqual(candidateReport.claimedRuntime.runtimeTreeManifest, candidateManifest.source.runtimeTreeManifest);
    assert.equal(candidateManifest.source.runtimeTreeManifest.sha256, fixture.runtimeTreeManifest.sha256);
    assert.match(candidateManifest.source.runtimeTreeManifest.file, /pending-human-owner-natural-trace\/runtime-tree-manifest\.json$/);
    assert.deepEqual(
      await readFile(path.join(fixture.root, candidateManifest.source.runtimeTreeManifest.file)),
      await readFile(fixture.runtimeTreeManifestPath),
    );
    assert.deepEqual(candidateReport.captureKit, candidateManifest.source.captureKit);
    assert.deepEqual(candidateReport.claimedRuntime.captureKit, candidateManifest.source.captureKit);
    assert.deepEqual(candidateManifest.source.captureKit.runtimeTreeManifest, candidateManifest.source.runtimeTreeManifest);
    assert.deepEqual(candidateManifest.source.captureKit.nodeExecutable, fixture.nodeExecutable);
    for (const [key, basename, sourcePath] of [
      ["kitManifest", "capture-kit-manifest.json", fixture.captureKitManifestPath],
      ["launcher", "capture-kit-launcher.sh", fixture.captureKitLauncherPath],
      ["sandboxProfile", "capture-kit-sandbox.sb", fixture.captureKitSandboxProfilePath],
    ]) {
      assert.equal(candidateManifest.source.captureKit[key].sha256, fixture.captureKit[key].sha256);
      assert.match(candidateManifest.source.captureKit[key].file, new RegExp(`pending-human-owner-natural-trace/${basename}$`));
      assert.deepEqual(
        await readFile(path.join(fixture.root, candidateManifest.source.captureKit[key].file)),
        await readFile(sourcePath),
      );
    }
    assert.deepEqual(candidateReport.environmentIsolation, candidateManifest.source.environmentIsolation);
    assert.deepEqual(candidateReport.claimedRuntime.environmentIsolation, candidateManifest.source.environmentIsolation);
    assert.deepEqual(candidateReport.launchReceipt, candidateManifest.source.launchReceipt);
    assert.deepEqual(candidateReport.claimedRuntime.launchReceipt, candidateManifest.source.launchReceipt);
    assert.deepEqual(candidateReport.hostEntryLog, candidateManifest.source.hostEntryLog);
    assert.deepEqual(candidateReport.claimedRuntime.hostEntryLog, candidateManifest.source.hostEntryLog);
    for (const [descriptor, sourcePath] of [
      [candidateManifest.source.environmentIsolation.receipt, fixture.environmentIsolationReceiptPath],
      [candidateManifest.source.environmentIsolation.preflightInventory, fixture.environmentPreflightInventoryPath],
      [candidateManifest.source.environmentIsolation.postflightInventory, fixture.environmentPostflightInventoryPath],
      [candidateManifest.source.launchReceipt.receipt, fixture.launchReceiptPath],
      [candidateManifest.source.launchReceipt.kitCheck, fixture.launchKitCheckPath],
      [candidateManifest.source.hostEntryLog, fixture.hostEntryLogPath],
    ]) {
      assert.deepEqual(await readFile(path.join(fixture.root, descriptor.file)), await readFile(sourcePath));
    }
    const serialized = JSON.stringify([candidateManifest, candidateReport]);
    for (const forbidden of ["\"status\":\"complete\"", "\"baselineAuthority\":", "\"authority\":\"original-runtime-natural-trace\""]) {
      assert.equal(serialized.includes(forbidden), false, forbidden);
    }
    await assert.rejects(() => readFile(path.join(fixture.workspace, "baseline", "original-runtime", `${fixture.safeId}.json`)), {code: "ENOENT"});
    await assert.rejects(() => readFile(path.join(fixture.workspace, fixture.spec.executionEvidence.expectedExecutionReportPath)), {code: "ENOENT"});
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects a wrong-status or root-domain specification before candidate publication", async (t) => {
  for (const [name, mutate] of [
    ["wrong-status", (spec) => { spec.traceSpecStatus = "unresolved"; }],
    ["root-domain", (spec) => { spec.frameDomain.kind = "root"; spec.traceModel.domainScope = "root"; }],
  ]) await t.test(name, async () => {
    const fixture = await createFixture();
    try {
      await rewriteSpecAndIndex(fixture, mutate);
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /only a ready indexed stateful natural trace/);
      await assert.rejects(
        () => readFile(path.join(fixture.workspace, "evidence", "pending-natural-trace-capture", fixture.safeId, "candidate-manifest.json")),
        {code: "ENOENT"},
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects action and source-target substitutions even with rebuilt record chains", async (t) => {
  await t.test("action", async () => {
    const fixture = await createFixture();
    try {
      await rewriteTargets(fixture, (targets) => { targets[0].action.sourceCommand = "gotoAndPlay(1)"; });
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /differs from the exact source schedule or hash chain/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("source-target", async () => {
    const fixture = await createFixture();
    try {
      await rewriteTargets(fixture, (targets) => { targets[0].resolvedSourceTarget.buttonObjectId = 999; });
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /differs from the exact source schedule or hash chain/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects checkpoint and terminal semantic substitutions after internally consistent rehashing", async (t) => {
  await t.test("checkpoint", async () => {
    const fixture = await createFixture();
    try {
      await rewriteStates(fixture, (states) => {
        states[1].observedState.checkpointMarker = "changed";
        states[1].observedStateSha256 = sha256Text(canonicalJson(states[1].observedState));
      });
      await rebindEvents(fixture);
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /checkpoint frame-2-before-source-press.*differs/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("terminal", async () => {
    const fixture = await createFixture();
    try {
      await rewriteStates(fixture, (states) => {
        states[2].observedState.terminalMarker = "not-complete";
        states[2].observedStateSha256 = sha256Text(canonicalJson(states[2].observedState));
      });
      await rebindEvents(fixture);
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /terminal state\.terminalMarker differs/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects missing, extra, and non-800x600 PNGs without changing coverage", async (t) => {
  await t.test("frame-gap", async () => {
    const fixture = await createFixture();
    try {
      const coverageBefore = await readFile(path.join(fixture.workspace, "evidence", "full-frame-coverage.json"));
      await rm(path.join(fixture.root, fixture.screenshots[1].file));
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /frameSet frame 2 is missing|exactly 3 regular PNG files/);
      assert.deepEqual(await readFile(path.join(fixture.workspace, "evidence", "full-frame-coverage.json")), coverageBefore);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("extra-png", async () => {
    const fixture = await createFixture();
    try {
      await writeFile(path.join(fixture.framesDirectory, "extra.png"), await readFile(path.join(fixture.root, fixture.screenshots[0].file)));
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /exactly 3 regular PNG files/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("dimensions", async () => {
    const fixture = await createFixture({wrongDimensionFrame: 2});
    try {
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /799x600; expected 800x600/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects tampered operation, state, and source-target hash chains", async (t) => {
  for (const [name, field, write, expected] of [
    ["operation", "events", "operationLogPath", /operation event hash\/identity\/sequence chain/],
    ["state", "states", "stateSnapshotsPath", /state snapshot hash\/identity\/frame chain/],
    ["target", "targets", "targetResolutionsPath", /source-target resolution.*exact source schedule or hash chain/],
  ]) await t.test(name, async () => {
    const fixture = await createFixture();
    try {
      fixture[field][0][field === "events" ? "eventSha256" : "recordSha256"] = "0".repeat(64);
      await writeJsonl(fixture[write], fixture[field]);
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), expected);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects session, receipt, operator, host, and unexpected-event mismatches", async (t) => {
  await t.test("record-session", async () => {
    const fixture = await createFixture();
    try {
      await rewriteEvents(fixture, (events) => { events[0].sessionId = "123e4567-e89b-42d3-a456-426614174001"; });
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /session\/spec\/source\/receipt identity binding is invalid/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("receipt-runtime", async () => {
    const fixture = await createFixture();
    try {
      fixture.receipt.runtime.version = "32.0.0.465";
      await writeJson(fixture.receiptPath, fixture.receipt);
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /require the approved Adobe Flash Player Projector 32\.0\.0\.414 runtime/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("receipt-executable", async () => {
    const fixture = await createFixture();
    try {
      const bytes = Buffer.from(`executable_sha256=${"f".repeat(64)}\n`);
      await writeFile(fixture.executableReceiptPath, bytes);
      fixture.receipt.identityArtifacts[0].sha256 = digest(bytes);
      await writeJson(fixture.receiptPath, fixture.receipt);
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /not bound to the approved Flash Player executable SHA-256/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("automation-operator", async () => {
    const fixture = await createFixture();
    try {
      await rewriteAttestation(fixture, (attestation) => {
        attestation.operator = {...attestation.operator, fullName: "Codex Automation Bot", role: "AI Agent"};
      });
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /must not use an automation-like identity/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("unexpected-event", async () => {
    const fixture = await createFixture();
    try {
      await rewriteAttestation(fixture, (attestation) => { attestation.unexpectedEvents.push({event: "extra-click"}); });
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /unexpectedEvents must be an explicitly empty array/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("host-binding", async () => {
    const fixture = await createFixture();
    try {
      await rewriteAttestation(fixture, (attestation) => { attestation.originalHostSwf.sha256 = "1".repeat(64); });
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /original host SWF differs from the preserved lesson host/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("requires explicit matching untampered environment, launch, and host-entry evidence", async (t) => {
  await t.test("legacy-v1-launch-receipt-fails-closed", async () => {
    const fixture = await createFixture();
    try {
      const legacy = structuredClone(fixture.launchReceiptDocument);
      legacy.schemaVersion = 1;
      legacy.receiptSha256 = naturalLaunchReceiptSha256(legacy);
      const sha256 = await writeJson(fixture.launchReceiptPath, legacy);
      await rewriteAttestation(fixture, (attestation) => {
        attestation.launchReceipt.sha256 = sha256;
      });
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /natural launch receipt identity\/runtime\/signature binding is invalid/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  await t.test("launch-receipt-cannot-claim-a-command-line-swf-argument", async () => {
    const fixture = await createFixture();
    try {
      const changed = structuredClone(fixture.launchReceiptDocument);
      changed.projectorStart.swfArgument = changed.hostOpen.selectedHost.file;
      changed.receiptSha256 = naturalLaunchReceiptSha256(changed);
      const sha256 = await writeJson(fixture.launchReceiptPath, changed);
      await rewriteAttestation(fixture, (attestation) => {
        attestation.launchReceipt.sha256 = sha256;
      });
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /two-stage Projector start\/GUI host-open identity is invalid/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  for (const [name, field, optionLabel] of [
    ["environment", "environmentIsolationReceipt", "--environment-isolation-receipt"],
    ["launch", "launchReceipt", "--launch-receipt"],
    ["host-entry", "hostEntryLog", "--host-entry-log"],
  ]) await t.test(`missing-${name}-input`, async () => {
    const fixture = await createFixture();
    try {
      delete fixture.options[field];
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        new RegExp(optionLabel.replaceAll("-", "\\-")),
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  for (const [name, field, sourcePath, expected] of [
    ["environment", "environmentIsolationReceipt", "environmentIsolationReceiptPath", /environment-isolation receipt path differs from the supplied evidence path/],
    ["launch", "launchReceipt", "launchReceiptPath", /launch receipt path differs from the supplied evidence path/],
    ["host-entry", "hostEntryLog", "hostEntryLogPath", /hostEntryLog\.file differs from the supplied evidence path/],
  ]) await t.test(`wrong-${name}-path`, async () => {
    const fixture = await createFixture();
    try {
      const duplicate = path.join(path.dirname(fixture[sourcePath]), `wrong-${path.basename(fixture[sourcePath])}`);
      await writeFile(duplicate, await readFile(fixture[sourcePath]));
      fixture.options[field] = portable(path.relative(fixture.root, duplicate));
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), expected);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });

  for (const [name, sourcePath, changedBytes, expected] of [
    ["environment", "environmentIsolationReceiptPath", Buffer.from("tampered environment receipt\n"), /environment-isolation receipt SHA-256 mismatch/],
    ["launch", "launchReceiptPath", Buffer.from("tampered launch receipt\n"), /launch receipt SHA-256 mismatch/],
    ["host-entry", "hostEntryLogPath", null, /host-entry log bytes\/count\/final chain differ/],
  ]) await t.test(`tampered-${name}-bytes`, async () => {
    const fixture = await createFixture();
    try {
      const bytes = changedBytes || Buffer.from(
        (await readFile(fixture[sourcePath], "utf8")).replace('{"schemaVersion"', '{ "schemaVersion"'),
      );
      await writeFile(fixture[sourcePath], bytes);
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), expected);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("requires exact current original-host entry, placement proof, five-file tree, and deny-list evidence", async (t) => {
  await t.test("missing-attestation-binding", async () => {
    const fixture = await createFixture();
    try {
      await rewriteAttestation(fixture, (attestation) => { delete attestation.originalHostEvidence; });
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /attestation fields must be exactly/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("attestation-binding-substitution", async () => {
    const fixture = await createFixture();
    try {
      await rewriteAttestation(fixture, (attestation) => {
        attestation.originalHostEvidence.entryContract.sha256 = "f".repeat(64);
      });
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /original-host evidence differs from the current hash-bound audit reports/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("missing-report", async () => {
    const fixture = await createFixture();
    try {
      await rm(fixture.originalHostEvidencePaths.minimalTree);
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /original-host minimalTree is not valid JSON|ENOENT/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("stale-generator", async () => {
    const fixture = await createFixture();
    try {
      await writeFile(fixture.originalHostGeneratorPath, "// generator replaced after reports\n");
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /original-host entryContract generator SHA-256 is stale/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("tampered-entry-contract", async () => {
    const fixture = await createFixture();
    try {
      fixture.originalHostEntryContract.contracts.childLoad.status = "guessed";
      await writeJson(fixture.originalHostEvidencePaths.entryContract, fixture.originalHostEntryContract);
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /entry contract does not prove the bounded source entry/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("stale-five-file-tree", async () => {
    const fixture = await createFixture();
    try {
      await writeFile(fixture.englishKeytermsPath, "<keyterms>post-report replacement</keyterms>\n");
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /minimal-tree file 5 bytes\/SHA-256 are stale/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("tampered-deny-all-policy", async () => {
    const fixture = await createFixture();
    try {
      fixture.originalHostSideEffectDenyList.defaultPolicy = "allow-network";
      await writeJson(fixture.originalHostEvidencePaths.sideEffectDenyList, fixture.originalHostSideEffectDenyList);
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /side-effect deny list differs from the fail-closed minimal-tree allowlist/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("synchronized-sixth-file-expansion", async () => {
    const fixture = await createFixture();
    try {
      const extraRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/RW/EXTRA.swf";
      const extraBytes = Buffer.from("unapproved sixth runtime-tree file\n");
      await writeFile(path.join(fixture.root, extraRelative), extraBytes);
      const extra = {
        path: extraRelative,
        sha256: digest(extraBytes),
        bytes: extraBytes.length,
        role: "attacker-added-runtime-dependency",
      };
      fixture.originalHostMinimalTree.requiredFiles.push(extra);
      fixture.originalHostMinimalTree.requiredFileCount = 6;
      fixture.originalHostMinimalTree.requiredTotalBytes += extra.bytes;
      fixture.originalHostMinimalTree.expectedRelativeLayoutFromArchiveRoot.push(
        extraRelative.slice("source-assets/flash/HELP MATH_ORIGINAL FILES/".length),
      );
      fixture.originalHostSideEffectDenyList.localReadAllowlist.push(extra);
      await writeJson(fixture.originalHostEvidencePaths.minimalTree, fixture.originalHostMinimalTree);
      await writeJson(fixture.originalHostEvidencePaths.sideEffectDenyList, fixture.originalHostSideEffectDenyList);
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /minimal-tree manifest is incomplete or authority-escalating/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("synchronized-required-role-tamper", async () => {
    const fixture = await createFixture();
    try {
      const changedRole = "attacker-reclassified-spanish-track";
      fixture.originalHostMinimalTree.requiredFiles[3].role = changedRole;
      fixture.originalHostEntryContract.contracts.spanishAudioStopResume.expectedResolvedTrack.role = changedRole;
      fixture.originalHostSideEffectDenyList.localReadAllowlist[3].role = changedRole;
      await writeJson(fixture.originalHostEvidencePaths.entryContract, fixture.originalHostEntryContract);
      await writeJson(fixture.originalHostEvidencePaths.minimalTree, fixture.originalHostMinimalTree);
      await writeJson(fixture.originalHostEvidencePaths.sideEffectDenyList, fixture.originalHostSideEffectDenyList);
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /minimal-tree manifest is incomplete or authority-escalating/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("synchronized-required-bytes-tamper", async () => {
    const fixture = await createFixture();
    try {
      fixture.originalHostMinimalTree.requiredFiles[3].bytes += 1;
      fixture.originalHostMinimalTree.requiredTotalBytes += 1;
      fixture.originalHostEntryContract.contracts.spanishAudioStopResume.expectedResolvedTrack.bytes += 1;
      fixture.originalHostSideEffectDenyList.localReadAllowlist[3].bytes += 1;
      await writeJson(fixture.originalHostEvidencePaths.entryContract, fixture.originalHostEntryContract);
      await writeJson(fixture.originalHostEvidencePaths.minimalTree, fixture.originalHostMinimalTree);
      await writeJson(fixture.originalHostEvidencePaths.sideEffectDenyList, fixture.originalHostSideEffectDenyList);
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /minimal-tree file 4 bytes\/SHA-256 are stale/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("tampered-structural-placement-proof", async () => {
    const fixture = await createFixture();
    try {
      fixture.originalHostPlacementProof.structuralChain.definitions[0].frameCount = 2;
      const placementSha256 = await writeJson(
        fixture.originalHostEvidencePaths.placementProof,
        fixture.originalHostPlacementProof,
      );
      const reboundPlacement = {
        path: fixture.originalHostEvidence.placementProof.file,
        sha256: placementSha256,
      };
      fixture.originalHostEntryContract.contracts.automaticEnglishKeytermRead.structuralPlacementProof = reboundPlacement;
      fixture.originalHostMinimalTree.structuralPlacementProof = reboundPlacement;
      await writeJson(fixture.originalHostEvidencePaths.entryContract, fixture.originalHostEntryContract);
      await writeJson(fixture.originalHostEvidencePaths.minimalTree, fixture.originalHostMinimalTree);
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /structural placement proof does not establish the automatic keyterm request boundary/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("post-hoc-semantically-valid-report-replacement", async () => {
    const fixture = await createFixture();
    try {
      fixture.originalHostEntryContract.postHocField = "changes report bytes without changing validated semantics";
      await writeJson(fixture.originalHostEvidencePaths.entryContract, fixture.originalHostEntryContract);
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /original-host evidence differs from the current hash-bound audit reports/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects same-project symbolic links in original-host audit inputs", async (t) => {
  for (const key of ["entryContract", "minimalTree", "sideEffectDenyList", "placementProof"]) {
    await t.test(`report-${key}`, async () => {
      const fixture = await createFixture();
      try {
        const fixedPath = fixture.originalHostEvidencePaths[key];
        const realFile = path.join(path.dirname(fixedPath), `same-root-real-${path.basename(fixedPath)}`);
        await writeFile(realFile, await readFile(fixedPath));
        await rm(fixedPath);
        await symlink(realFile, fixedPath);
        await assert.rejects(
          () => prepareNaturalTraceCandidate(fixture.options),
          /original-host .*symbolic link|forbidden symbolic-link/,
        );
      } finally {
        await rm(fixture.root, {recursive: true, force: true});
      }
    });
  }
  await t.test("generator", async () => {
    const fixture = await createFixture();
    try {
      const realGenerator = path.join(path.dirname(fixture.originalHostGeneratorPath), "same-root-real-host-generator.mjs");
      await writeFile(realGenerator, await readFile(fixture.originalHostGeneratorPath));
      await rm(fixture.originalHostGeneratorPath);
      await symlink(realGenerator, fixture.originalHostGeneratorPath);
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /original-host .* generator.*symbolic link|forbidden symbolic-link/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects a stale or expanded checked-kit runtime tree", async (t) => {
  await t.test("manifest-hash-tamper", async () => {
    const fixture = await createFixture();
    try {
      await rewriteAttestation(fixture, (attestation) => {
        attestation.runtimeTreeManifest.sha256 = "e".repeat(64);
      });
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /runtime-tree manifest SHA-256 differs from the signed attestation/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("staged-file-tamper", async () => {
    const fixture = await createFixture();
    try {
      const staged = path.join(
        path.dirname(fixture.runtimeTreeManifestPath),
        fixture.runtimeTreeDocument.files[2].stagedFile,
      );
      await chmod(staged, 0o644);
      await writeFile(staged, "changed after the checked kit was staged\n");
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /staged runtime file 3 bytes\/SHA-256 are stale/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("extra-unmanifested-file", async () => {
    const fixture = await createFixture();
    try {
      await writeFile(path.join(fixture.runtimeTreeRoot, "unmanifested.swf"), "not in the five-file tree\n");
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /staged runtime tree contains missing or unmanifested files/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("manifest-same-project-symlink", async () => {
    const fixture = await createFixture();
    try {
      const realManifest = path.join(path.dirname(fixture.runtimeTreeManifestPath), "same-root-real-runtime-tree-manifest.json");
      await writeFile(realManifest, await readFile(fixture.runtimeTreeManifestPath));
      await rm(fixture.runtimeTreeManifestPath);
      await symlink(realManifest, fixture.runtimeTreeManifestPath);
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /runtime-tree manifest.*symbolic link|forbidden symbolic-link/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("staged-file-same-project-symlink", async () => {
    const fixture = await createFixture();
    try {
      const staged = path.join(
        path.dirname(fixture.runtimeTreeManifestPath),
        fixture.runtimeTreeDocument.files[2].stagedFile,
      );
      const realFile = path.join(path.dirname(staged), "same-root-real-L13RW02.swf");
      await writeFile(realFile, await readFile(staged), {mode: 0o444});
      await rm(staged);
      await symlink(realFile, staged);
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /natural runtime tree contains a forbidden symbolic link|natural staged runtime file .*symbolic-link/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("requires the exact hash-bound non-authoritative capture kit", async (t) => {
  await t.test("missing-attestation-capture-kit", async () => {
    const fixture = await createFixture();
    try {
      await rewriteAttestation(fixture, (attestation) => { delete attestation.captureKit; });
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /attestation fields must be exactly/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("rebound-kit-manifest-authority-escalation", async () => {
    const fixture = await createFixture();
    try {
      fixture.captureKitManifest.originalHostLaunch.authoritativeCapturePermittedByThisLauncher = true;
      const sha256 = await writeJson(fixture.captureKitManifestPath, fixture.captureKitManifest);
      await rewriteAttestation(fixture, (attestation) => { attestation.captureKit.kitManifest.sha256 = sha256; });
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /capture kit manifest identity, runtime, or non-authority boundary is invalid/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("rebound-kit-manifest-original-host-report-substitution", async () => {
    const fixture = await createFixture();
    try {
      fixture.captureKitManifest.bindings.originalHostEvidence.entryContract.sha256 = "f".repeat(64);
      const sha256 = await writeJson(fixture.captureKitManifestPath, fixture.captureKitManifest);
      await rewriteAttestation(fixture, (attestation) => { attestation.captureKit.kitManifest.sha256 = sha256; });
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /capture kit manifest identity, runtime, or non-authority boundary is invalid/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("rebound-launcher-omits-check", async () => {
    const fixture = await createFixture();
    try {
      const changed = fixture.captureKitLauncher.replace(" --check ", " ");
      await chmod(fixture.captureKitLauncherPath, 0o644);
      await writeFile(fixture.captureKitLauncherPath, changed, {mode: 0o555});
      await rewriteAttestation(fixture, (attestation) => {
        attestation.captureKit.launcher.sha256 = digest(Buffer.from(changed));
      });
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /capture kit launcher omits a required hash-bound launch component/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("rebound-launcher-mentions-source-assets", async () => {
    const fixture = await createFixture();
    try {
      const changed = `${fixture.captureKitLauncher}# source-assets/ is forbidden\n`;
      await chmod(fixture.captureKitLauncherPath, 0o644);
      await writeFile(fixture.captureKitLauncherPath, changed, {mode: 0o555});
      await rewriteAttestation(fixture, (attestation) => {
        attestation.captureKit.launcher.sha256 = digest(Buffer.from(changed));
      });
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /capture kit launcher must not launch directly from source-assets/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("rebound-launcher-passes-staged-host-as-projector-argument", async () => {
    const fixture = await createFixture();
    try {
      const changed = fixture.captureKitLauncher.replace(
        `'${fixture.captureKitManifest.runtime.executablePath}'\n`,
        `'${fixture.captureKitManifest.runtime.executablePath}' '${fixture.captureKitManifest.originalHostLaunch.stagedHost.file}'\n`,
      );
      await chmod(fixture.captureKitLauncherPath, 0o644);
      await writeFile(fixture.captureKitLauncherPath, changed, {mode: 0o555});
      await rewriteAttestation(fixture, (attestation) => {
        attestation.captureKit.launcher.sha256 = digest(Buffer.from(changed));
      });
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /launcher must start an empty Projector without a SWF argument/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("rebound-sandbox-omits-network-deny", async () => {
    const fixture = await createFixture();
    try {
      const changed = fixture.captureKitSandboxProfile.replace("(deny network*)\n", "");
      await chmod(fixture.captureKitSandboxProfilePath, 0o644);
      await writeFile(fixture.captureKitSandboxProfilePath, changed, {mode: 0o444});
      await rewriteAttestation(fixture, (attestation) => {
        attestation.captureKit.sandboxProfile.sha256 = digest(Buffer.from(changed));
      });
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /capture kit sandbox omits a required safety-probe restriction/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("node-executable-substitution", async () => {
    const fixture = await createFixture();
    try {
      await rewriteAttestation(fixture, (attestation) => {
        attestation.captureKit.nodeExecutable.sha256 = "f".repeat(64);
      });
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /capture kit Node executable differs from the local hash-bound launcher runtime/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
  await t.test("runtime-tree-binding-substitution", async () => {
    const fixture = await createFixture();
    try {
      await rewriteAttestation(fixture, (attestation) => {
        attestation.captureKit.runtimeTreeManifest = {
          ...attestation.captureKit.runtimeTreeManifest,
          sha256: "f".repeat(64),
        };
      });
      await assert.rejects(
        () => prepareNaturalTraceCandidate(fixture.options),
        /capture kit runtime-tree binding differs from the signed runtime-tree manifest/,
      );
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects input and fixed-output symlink escapes", async (t) => {
  await t.test("input-frame", async () => {
    const fixture = await createFixture();
    const outside = await mkdtemp(path.join(os.tmpdir(), "helpmath-natural-outside-"));
    try {
      const framePath = path.join(fixture.root, fixture.screenshots[0].file);
      const outsideFrame = path.join(outside, "outside.png");
      await writeFile(outsideFrame, await readFile(framePath));
      await rm(framePath);
      await symlink(outsideFrame, framePath);
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /exactly 3 regular PNG files|symlink-escaping/);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
      await rm(outside, {recursive: true, force: true});
    }
  });
  await t.test("pending-output-to-canonical", async () => {
    const fixture = await createFixture();
    try {
      const target = path.join(fixture.workspace, "baseline", "original-runtime");
      const parent = path.join(fixture.workspace, "evidence", "pending-natural-trace-capture");
      const linkPath = path.join(parent, fixture.safeId);
      await mkdir(target, {recursive: true});
      await mkdir(parent, {recursive: true});
      await symlink(target, linkPath, "dir");
      assert.equal(await realpath(linkPath), await realpath(target));
      await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /contains forbidden symbolic-link component/);
      assert.deepEqual(await readdir(target), []);
    } finally {
      await rm(fixture.root, {recursive: true, force: true});
    }
  });
});

test("rejects archived frame bytes changed after their initial copy validation", async () => {
  const fixture = await createFixture({slowArchive: true});
  try {
    const archiveParent = path.join(
      fixture.root,
      "artifacts",
      "full-frame",
      "pilot-baselines",
      fixture.animationId,
      fixture.safeId,
    );
    await mkdir(archiveParent, {recursive: true});
    let settled = false;
    const preparation = (async () => {
      try {
        return {value: await prepareNaturalTraceCandidate(fixture.options)};
      } catch (error) {
        return {error};
      } finally {
        settled = true;
      }
    })();

    let tamperedAfterInitialValidation = false;
    const deadline = Date.now() + 5000;
    while (!settled && Date.now() < deadline) {
      const entries = await readdir(archiveParent, {withFileTypes: true});
      const staged = entries.find((entry) => entry.isDirectory() && entry.name.startsWith(".tmp-pending-human-owner-natural-trace-"));
      if (staged) {
        const stagedRoot = path.join(archiveParent, staged.name);
        const frame1 = path.join(stagedRoot, "frame-0001.png");
        const frame2 = path.join(stagedRoot, "frame-0002.png");
        try {
          const [frame1Bytes, frame2Bytes] = await Promise.all([readFile(frame1), readFile(frame2)]);
          if (digest(frame1Bytes) === fixture.screenshots[0].sha256 && digest(frame2Bytes) === fixture.screenshots[1].sha256) {
            await chmod(frame1, 0o644);
            await writeFile(frame1, "tampered only after frame 1 had already passed its initial archival-copy validation\n");
            tamperedAfterInitialValidation = true;
            break;
          }
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
      }
      await new Promise((resolve) => setImmediate(resolve));
    }
    const outcome = await preparation;
    assert.equal(
      tamperedAfterInitialValidation,
      true,
      `the test must alter staged frame 1 only after staged frame 2 proves frame 1's initial validation completed; preparation outcome: ${outcome.error?.message || "completed"}`,
    );
    assert.ok(outcome.error, "candidate preparation must reject the post-copy archive tamper");
    assert.match(
      outcome.error.message,
      /archived natural frame 1 changed before candidate publication/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("append-only overwrite rejection preserves coverage, migration status/reviews, and both source SWFs", async () => {
  const fixture = await createFixture();
  try {
    const manifestPath = path.join(fixture.workspace, "migration.json");
    const coveragePath = path.join(fixture.workspace, "evidence", "full-frame-coverage.json");
    const before = {
      manifest: await readFile(manifestPath),
      coverage: await readFile(coveragePath),
      source: await readFile(fixture.sourcePath),
      host: await readFile(fixture.hostPath),
    };
    await prepareNaturalTraceCandidate(fixture.options);
    await assert.rejects(() => prepareNaturalTraceCandidate(fixture.options), /already exists/);
    assert.deepEqual(await readFile(manifestPath), before.manifest);
    assert.deepEqual(await readFile(coveragePath), before.coverage);
    assert.deepEqual(await readFile(fixture.sourcePath), before.source);
    assert.deepEqual(await readFile(fixture.hostPath), before.host);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rejects hard-linked session PNG inputs", async () => {
  const fixture = await createFixture();
  try {
    const frame = path.join(fixture.root, fixture.screenshots[0].file);
    await link(frame, path.join(path.dirname(frame), "hardlink-alias.png"));
    await assert.rejects(
      () => prepareNaturalTraceCandidate(fixture.options),
      /exactly 3 regular PNG files|must not be hard-linked/,
    );
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("input CAS rejects a post-validation replacement and publishes nothing", async () => {
  const fixture = await createFixture();
  try {
    await assert.rejects(
      () => prepareNaturalTraceCandidate(fixture.options, {
        hooks: {
          afterStaging: async () => {
            await writeFile(fixture.operationLogPath, "foreign replacement after validation\n");
          },
        },
      }),
      /natural operation log.*changed after staging hook/,
    );
    const pending = path.join(fixture.workspace, "evidence", "pending-natural-trace-capture", fixture.safeId);
    await assert.rejects(() => readFile(path.join(pending, "candidate-manifest.json")), {code: "ENOENT"});
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("archive publication never replaces a foreign append-only slot", async () => {
  const fixture = await createFixture();
  const archiveDirectory = path.join(
    fixture.root,
    "artifacts",
    "full-frame",
    "pilot-baselines",
    fixture.animationId,
    fixture.safeId,
    "pending-human-owner-natural-trace",
  );
  const sentinel = path.join(archiveDirectory, "foreign-sentinel.txt");
  try {
    await assert.rejects(
      () => prepareNaturalTraceCandidate(fixture.options, {
        hooks: {
          beforeArchivePublish: async () => {
            await mkdir(archiveDirectory, {recursive: false});
            await writeFile(sentinel, "foreign archive owner\n");
          },
        },
      }),
      /archive output already exists|append-only publication refuses replacement/,
    );
    assert.equal(await readFile(sentinel, "utf8"), "foreign archive owner\n");
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rollback removes only owned archive bytes and preserves a foreign sentinel", async () => {
  const fixture = await createFixture();
  let sentinel;
  try {
    await assert.rejects(
      () => prepareNaturalTraceCandidate(fixture.options, {
        hooks: {
          afterArchive: async ({archiveDirectory}) => {
            sentinel = path.join(archiveDirectory, "foreign-sentinel.txt");
            await writeFile(sentinel, "foreign concurrent archive byte\n");
            throw new Error("injected post-archive failure");
          },
        },
      }),
      /injected post-archive failure/,
    );
    assert.equal(await readFile(sentinel, "utf8"), "foreign concurrent archive byte\n");
    assert.deepEqual((await readdir(path.dirname(sentinel))).sort(), ["foreign-sentinel.txt"]);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});

test("rollback preserves a foreign candidate-manifest replacement", async () => {
  const fixture = await createFixture();
  let candidateManifestPath;
  try {
    await assert.rejects(
      () => prepareNaturalTraceCandidate(fixture.options, {
        hooks: {
          afterManifest: async ({candidateManifestPath: candidate}) => {
            candidateManifestPath = candidate;
            await rm(candidate);
            await writeFile(candidate, "foreign replacement manifest\n", {mode: 0o444});
          },
        },
      }),
      /candidate manifest.*ownership|candidate manifest.*changed/,
    );
    assert.equal(await readFile(candidateManifestPath, "utf8"), "foreign replacement manifest\n");
    assert.equal((await lstat(candidateManifestPath)).nlink, 1);
  } finally {
    await rm(fixture.root, {recursive: true, force: true});
  }
});
