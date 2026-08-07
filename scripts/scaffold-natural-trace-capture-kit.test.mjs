import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {link, mkdir, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

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
  DEFAULT_NATURAL_TRACE_KIT_ROOT,
  NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE,
  NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT,
  NATURAL_TRACE_PROOF_MODE,
  NATURAL_TRACE_TEMPLATE_STATUS,
  buildNaturalTraceCaptureKit,
  parseArguments,
  renderNaturalTraceCaptureKit,
  scaffoldNaturalTraceCaptureKit,
  usage,
} from "./scaffold-natural-trace-capture-kit.mjs";
import {
  NATURAL_HOST_OPEN_MENU_PATH,
  NATURAL_HOST_OPEN_METHOD,
  NATURAL_PROJECTOR_LAUNCH_PROTOCOL,
} from "./prepare-natural-trace-candidate.mjs";
import {selectionSha256} from "./lib/trace-frame-selection.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY_TRACE_COVERAGE_INCLUDED_REQUIREMENT_PATHS = [
  "requirementId",
  "scenario",
  "frameDomainId",
  "traceId",
  "language",
  "seed",
  "requiredRange",
  "entryState",
  "entryStateSha256",
  "baselineAuthorityRequirement",
];

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function writeJson(candidate, value) {
  await mkdir(path.dirname(candidate), {recursive: true});
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  await writeFile(candidate, bytes);
  return digest(bytes);
}

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "natural-trace-kit-"));
  const animationId = "course-g05-l13-rw-002";
  const requirementId = "req:sprite-334:default:en";
  const safeId = safeRequirementId(requirementId);
  const workspace = path.join(root, "migrations", animationId);
  const sourceRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L13/RW/L13RW02.swf";
  const archiveRootRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES";
  const originalHostRelative = `${archiveRootRelative}/HELP_COURSES/ELMGR5/L13/index_local.swf`;
  const initialChildRelative = `${archiveRootRelative}/HELP_COURSES/ELMGR5/L13/IR/L13RW01.swf`;
  const spanishAudioRelative = `${archiveRootRelative}/HELP_COURSES/ELMGR5/L13/SA/L13RW02.mp3`;
  const englishKeytermsRelative = `${archiveRootRelative}/HELP_KEYTERMS/KT/ELEMENTARY/XML/ELKTEG4.xml`;
  const sourcePath = path.join(root, sourceRelative);
  const sourceBytes = Buffer.from("fixture RW source SWF\n");
  await mkdir(path.dirname(sourcePath), {recursive: true});
  await writeFile(sourcePath, sourceBytes);
  const sourceSha256 = digest(sourceBytes);
  const originalHostPath = path.join(root, originalHostRelative);
  const initialChildPath = path.join(root, initialChildRelative);
  const spanishAudioPath = path.join(root, spanishAudioRelative);
  const englishKeytermsPath = path.join(root, englishKeytermsRelative);
  const originalHostBytes = Buffer.from("fixture original lesson host SWF\n");
  const initialChildBytes = Buffer.from("fixture default startup child SWF\n");
  const spanishAudioBytes = Buffer.from("fixture Spanish audio MP3 bytes\n");
  const englishKeytermsBytes = Buffer.from("<keyterms><word>Source</word></keyterms>\n");
  await writeFile(originalHostPath, originalHostBytes);
  await mkdir(path.dirname(initialChildPath), {recursive: true});
  await mkdir(path.dirname(spanishAudioPath), {recursive: true});
  await mkdir(path.dirname(englishKeytermsPath), {recursive: true});
  await writeFile(initialChildPath, initialChildBytes);
  await writeFile(spanishAudioPath, spanishAudioBytes);
  await writeFile(englishKeytermsPath, englishKeytermsBytes);
  const originalHostSha256 = digest(originalHostBytes);
  const initialChildSha256 = digest(initialChildBytes);
  const spanishAudioSha256 = digest(spanishAudioBytes);
  const englishKeytermsSha256 = digest(englishKeytermsBytes);
  const entryState = {
    parentFrameDomainId: "root",
    parentEntryFrame: 6,
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
    requiredRange: {firstFrame: 1, lastFrame: 5},
    entryState,
    entryStateSha256,
    baselineAuthorityRequirement: "original-runtime-natural-trace",
    status: "blocked",
  };
  const manifest = {
    schemaVersion: 2,
    id: animationId,
    animationId,
    assetId: `swf-${sourceSha256}`,
    status: "validating",
    source: {swf: sourceRelative, swfSha256: sourceSha256},
    runtime: {
      stage: {width: 800, height: 600},
      fps: 12,
      frameCount: 6,
      rootTimelineId: "root",
      timelineDefinitions: [{id: "root", frameCount: 6}, {id: "sprite-334", frameCount: 5}],
      instances: [{id: "main-animation", sourceTimelineId: "sprite-334", parentFrameDomainId: "root", parentEntryFrame: 6}],
    },
    localization: {bilingualRequired: true, languages: ["en", "es"]},
    scenarios: [{id: "default", kind: "interactive", reachable: true}],
    audio: {required: false, cues: []},
    implementation: {defaultFrameDomainId: "sprite-334", frameDomains: [{id: "root", kind: "root", frameCount: 6}, {id: "sprite-334", kind: "nested", frameCount: 5}]},
    acceptance: {ownerReview: {decision: "pending"}},
  };
  const coverage = {schemaVersion: 2, animationId, requirements: [requirement]};
  const inventory = {
    schemaVersion: 1,
    animationId,
    migrationStatusAtGeneration: "validating",
    migrationStatusChanged: false,
    evidenceIndex: [],
    timelineInventory: [{timelineId: "root", frameCount: 6}, {timelineId: "sprite-334", frameCount: 5}],
  };
  const manifestPath = path.join(workspace, "migration.json");
  const coveragePath = path.join(workspace, "evidence", "full-frame-coverage.json");
  const inventoryPath = path.join(workspace, "audit", "scenario-inventory.json");
  await writeJson(manifestPath, manifest);
  await writeJson(coveragePath, coverage);
  await writeJson(inventoryPath, inventory);

  const hostGeneratorRelative = "scripts/build-rw002-original-host-entry-contract.mjs";
  const hostGeneratorPath = path.join(root, hostGeneratorRelative);
  const hostGeneratorBytes = await readFile(path.join(repositoryRoot, hostGeneratorRelative));
  await mkdir(path.dirname(hostGeneratorPath), {recursive: true});
  await writeFile(hostGeneratorPath, hostGeneratorBytes);
  const generatedBy = {path: hostGeneratorRelative, sha256: digest(hostGeneratorBytes)};
  const requiredFiles = [
    {path: originalHostRelative, sha256: originalHostSha256, bytes: originalHostBytes.length, role: "unmodified-original-lesson-host"},
    {path: initialChildRelative, sha256: initialChildSha256, bytes: initialChildBytes.length, role: "source-script-proven-default-startup-child"},
    {path: sourceRelative, sha256: sourceSha256, bytes: sourceBytes.length, role: "target-animation-child"},
    {path: spanishAudioRelative, sha256: spanishAudioSha256, bytes: spanishAudioBytes.length, role: "source-script-derived-spanish-user-activated-track"},
    {path: englishKeytermsRelative, sha256: englishKeytermsSha256, bytes: englishKeytermsBytes.length, role: "automatic-english-keyterm-xml-read-at-host-root-frame-50"},
  ];
  const hostEvidencePaths = {
    entryContract: path.join(workspace, "audit", "original-host-entry-contract.json"),
    minimalTree: path.join(workspace, "audit", "original-host-minimal-tree.json"),
    sideEffectDenyList: path.join(workspace, "audit", "original-host-side-effect-deny-list.json"),
    placementProof: path.join(workspace, "audit", "original-host-placement-proof.json"),
  };
  const placementProof = {
    schemaVersion: 1,
    artifactType: "help-math-original-host-structural-placement-proof",
    animationId,
    generatedBy,
    sourceHost: {path: originalHostRelative, sha256: originalHostSha256, bytes: originalHostBytes.length},
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
    file: path.relative(root, hostEvidencePaths.placementProof).split(path.sep).join("/"),
    sha256: await writeJson(hostEvidencePaths.placementProof, placementProof),
  };
  const entryContract = {
    schemaVersion: 1,
    artifactType: "help-math-original-host-entry-contract",
    animationId,
    generatedBy,
    sourceHost: {
      path: originalHostRelative,
      sha256: originalHostSha256,
      bytes: originalHostBytes.length,
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
  const minimalTree = {
    schemaVersion: 1,
    artifactType: "help-math-original-host-minimal-lesson-tree-manifest",
    animationId,
    generatedBy,
    selectionPolicy: {failClosed: true, sourceTreeCopiedByThisGenerator: false},
    requiredFiles,
    requiredFileCount: requiredFiles.length,
    requiredTotalBytes: requiredFiles.reduce((total, item) => total + item.bytes, 0),
    archiveRoot: archiveRootRelative,
    expectedRelativeLayoutFromArchiveRoot: requiredFiles.map(({path: file}) => file.slice(`${archiveRootRelative}/`.length)),
    structuralPlacementProof: {path: placementProofDescriptor.file, sha256: placementProofDescriptor.sha256},
    validation: {
      allRequiredFilesExist: true,
      allRequiredHashesMatch: true,
      layoutDerivedFromSourceScripts: true,
      wholeLessonTreeRequired: false,
      automaticKeytermRequestRuntimeResultPending: true,
    },
  };
  const sideEffectDenyList = {
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
      file: path.relative(root, hostEvidencePaths.entryContract).split(path.sep).join("/"),
      sha256: await writeJson(hostEvidencePaths.entryContract, entryContract),
    },
    minimalTree: {
      file: path.relative(root, hostEvidencePaths.minimalTree).split(path.sep).join("/"),
      sha256: await writeJson(hostEvidencePaths.minimalTree, minimalTree),
    },
    sideEffectDenyList: {
      file: path.relative(root, hostEvidencePaths.sideEffectDenyList).split(path.sep).join("/"),
      sha256: await writeJson(hostEvidencePaths.sideEffectDenyList, sideEffectDenyList),
    },
    placementProof: placementProofDescriptor,
  };

  const checkpoints = [
    {id: "frame-1-natural-entry", expectedState: {rootFrame: 6, localFrame: 1, localPlayState: "playing", requiredLanguage: "en"}, evidence: [{artifactId: "fixture"}]},
    {id: "frame-3-before-source-press", expectedState: {rootFrame: 6, localFrame: 3, localPlayState: "stopped", quizSection: true}, evidence: [{artifactId: "fixture"}]},
    {id: "frame-4-after-source-press", expectedState: {rootFrame: 6, localFrame: 4, localPlayState: "playing", quizSection: false}, evidence: [{artifactId: "fixture"}]},
    {id: "frame-5-terminal-source-stop", expectedState: {rootFrame: 6, localFrame: 5, localPlayState: "stopped", quizSection: false}, evidence: [{artifactId: "fixture"}]},
  ];
  const step = {
    order: 1,
    action: {event: "press", dispatchPhase: "pointer-down", coordinateSpace: "native-stage-pixels", pointer: {x: 20, y: 30}, sourceCommand: "play()"},
    sourceTarget: {timelineId: "sprite-334", localFrame: 3, buttonObjectId: 111, hitShapeObjectId: 110, depth: 722},
    preStateCheckpoint: {checkpointId: checkpoints[1].id, expectedState: checkpoints[1].expectedState},
    postStateCheckpoint: {checkpointId: checkpoints[2].id, expectedState: checkpoints[2].expectedState},
    evidence: [{artifactId: "fixture"}],
  };
  const traceGeneratorPath = path.join(root, "scripts", "build-course-trace-specs.mjs");
  const traceGeneratorBytes = Buffer.from("fixture prior course trace generator\n");
  await mkdir(path.dirname(traceGeneratorPath), {recursive: true});
  await writeFile(traceGeneratorPath, traceGeneratorBytes);
  const traceGeneratorSha256 = digest(traceGeneratorBytes);
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
      requiredRange: requirement.requiredRange,
      baselineAuthorityRequirement: "original-runtime-natural-trace",
    },
    traceModel: {kind: "stateful-natural-trace", domainScope: "nested", interactionMode: "interactive", naturalPlaybackClaimed: true},
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
      scheduleDerivation: {
        status: "hash-bound-static-source-derivation-not-runtime-execution",
        generator: {
          path: "scripts/build-course-trace-specs.mjs",
          sha256: traceGeneratorSha256,
        },
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
      frameCount: 5,
      nativeStage: {width: 800, height: 600},
      fps: 12,
    },
    entryState,
    schedule: {
      status: "source-evidenced-executable",
      noActionsRequired: false,
      playbackSegments: [
        {id: "before", requiredRange: {firstFrame: 1, lastFrame: 2}, expectedState: {rootFrame: 6, localPlayState: "playing"}, evidence: [{artifactId: "fixture"}]},
        {id: "stop", requiredRange: {firstFrame: 3, lastFrame: 3}, expectedState: checkpoints[1].expectedState, evidence: [{artifactId: "fixture"}]},
        {id: "after", requiredRange: {firstFrame: 4, lastFrame: 4}, expectedState: checkpoints[2].expectedState, evidence: [{artifactId: "fixture"}]},
        {id: "terminal", requiredRange: {firstFrame: 5, lastFrame: 5}, expectedState: checkpoints[3].expectedState, evidence: [{artifactId: "fixture"}]},
      ],
      orderedSteps: [step],
      stateCheckpoints: checkpoints,
      terminalSemantics: {status: "source-evidenced", expectedState: checkpoints[3].expectedState, evidence: [{artifactId: "fixture"}], outsideThisSpecification: ["Replay", "audio"]},
      exhaustiveFrameCapturePlan: {indexing: "one-indexed", firstFrame: 1, lastFrame: 5, frameCount: 5, executionPrerequisite: "fixture"},
    },
    executionEvidence: {expectedExecutionReportPath: `baseline/trace-executions/${safeId}.json`},
  };
  const specRelative = `migrations/${animationId}/audit/trace-specs/${safeId}.json`;
  const specPath = path.join(root, specRelative);
  const specSha256 = await writeJson(specPath, spec);
  const indexPath = path.join(root, "migrations", "course-shell-pilot-trace-spec-index.json");
  const index = {
    schemaVersion: 1,
    artifactType: "course-shell-pilot-trace-spec-index",
    pilots: [{
      animationId,
      traceSpecs: [{
        requirementId,
        frameDomainId: "sprite-334",
        traceId: requirement.traceId,
        scenario: "default",
        language: "en",
        seed: "0",
        traceModel: "stateful-natural-trace",
        status: spec.traceSpecStatus,
        file: specRelative,
        sha256: specSha256,
        expectedExecutionReport: `migrations/${animationId}/baseline/trace-executions/${safeId}.json`,
      }],
    }],
  };
  await writeJson(indexPath, index);

  const appPath = path.join(root, "Adobe Flash Player.app");
  const executablePath = path.join(appPath, "Contents", "MacOS", "Flash Player");
  const executableBytes = Buffer.from("fixture Adobe Projector executable\n");
  await mkdir(path.dirname(executablePath), {recursive: true});
  await writeFile(executablePath, executableBytes);
  const runtime = {
    runtimeId: "adobe-flash-player-projector",
    name: "Adobe Flash Player Projector",
    version: "32.0.0.465-fixture",
    requestedAppPath: appPath,
    appPath,
    executablePath,
    executableSha256: digest(executableBytes),
  };
  return {
    root,
    animationId,
    requirementId,
    safeId,
    workspace,
    sourcePath,
    originalHostPath,
    originalHostSha256,
    initialChildPath,
    spanishAudioPath,
    englishKeytermsPath,
    archiveRootRelative,
    requiredFiles,
    entryContract,
    minimalTree,
    sideEffectDenyList,
    placementProof,
    originalHostEvidence,
    hostEvidencePaths,
    hostGeneratorPath,
    manifestPath,
    coveragePath,
    inventoryPath,
    indexPath,
    spec,
    traceGeneratorPath,
    traceGeneratorSha256,
    specPath,
    specRelative,
    runtime,
  };
}

async function scaffoldThenAdvanceIndex(item) {
  await scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime});
  const kitRoot = path.join(item.root, DEFAULT_NATURAL_TRACE_KIT_ROOT, item.animationId, item.safeId);
  const staleManifest = await readFile(path.join(kitRoot, "kit-manifest.json"));
  const index = JSON.parse(await readFile(item.indexPath, "utf8"));
  index.refreshFixtureRevision = "current-index-after-unsigned-kit-scaffold";
  const currentIndexSha256 = await writeJson(item.indexPath, index);
  return {kitRoot, staleManifest, currentIndexSha256};
}

async function scaffoldThenAdvanceTraceGeneratorAndIndex(item, mutateCurrentSpec = null) {
  await scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime});
  const kitRoot = path.join(item.root, DEFAULT_NATURAL_TRACE_KIT_ROOT, item.animationId, item.safeId);
  const staleManifest = await readFile(path.join(kitRoot, "kit-manifest.json"));
  const staleManifestValue = JSON.parse(staleManifest);
  const previousTraceSpecSha256 = staleManifestValue.bindings.traceSpec.sha256;
  const previousTraceSpecGeneratorSha256 = item.traceGeneratorSha256;
  const currentSpec = JSON.parse(await readFile(item.specPath, "utf8"));
  const currentGeneratorBytes = Buffer.from("fixture current course trace generator\n");
  await writeFile(item.traceGeneratorPath, currentGeneratorBytes);
  currentSpec.sourceBindings.scheduleDerivation.generator.sha256 = digest(currentGeneratorBytes);
  if (mutateCurrentSpec) mutateCurrentSpec(currentSpec);
  const currentTraceSpecSha256 = await writeJson(item.specPath, currentSpec);
  const index = JSON.parse(await readFile(item.indexPath, "utf8"));
  index.pilots[0].traceSpecs[0].sha256 = currentTraceSpecSha256;
  index.refreshFixtureRevision = "current-spec-generator-and-index-after-unsigned-kit-scaffold";
  const currentIndexSha256 = await writeJson(item.indexPath, index);
  return {
    kitRoot,
    staleManifest,
    previousTraceSpecSha256,
    previousTraceSpecGeneratorSha256,
    currentTraceSpecSha256,
    currentIndexSha256,
  };
}

async function installRenderedKit(kitRoot, files) {
  await mkdir(kitRoot, {recursive: true});
  for (const [relative, content] of files) {
    const candidate = path.join(kitRoot, relative);
    await mkdir(path.dirname(candidate), {recursive: true});
    await writeFile(candidate, content, {mode: relative.endsWith(".sh") ? 0o555 : 0o444});
  }
}

async function installLegacyDescriptorKitThenAdvanceCurrentDescriptor(item, mutateCoverage = null) {
  const currentKit = await buildNaturalTraceCaptureKit({
    projectRoot: item.root,
    specFile: item.specRelative,
    runtime: item.runtime,
  });
  const previousSpec = structuredClone(currentKit.bound.spec);
  previousSpec.sourceBindings.fullFrameCoverage.includedPaths = [
    ...LEGACY_TRACE_COVERAGE_INCLUDED_REQUIREMENT_PATHS,
  ];
  const previousSpecBytes = Buffer.from(`${JSON.stringify(previousSpec, null, 2)}\n`);
  const previousTraceSpecSha256 = digest(previousSpecBytes);
  const previousIndex = JSON.parse(await readFile(item.indexPath, "utf8"));
  previousIndex.pilots[0].traceSpecs[0].sha256 = previousTraceSpecSha256;
  const previousIndexBytes = Buffer.from(`${JSON.stringify(previousIndex, null, 2)}\n`);
  const previousIndexSha256 = digest(previousIndexBytes);
  const historicalBound = {
    ...currentKit.bound,
    spec: previousSpec,
    specSha256: previousTraceSpecSha256,
    indexSha256: previousIndexSha256,
    bindings: {
      ...currentKit.bound.bindings,
      traceSpec: {
        ...currentKit.bound.bindings.traceSpec,
        sha256: previousTraceSpecSha256,
      },
      traceSpecIndex: {
        ...currentKit.bound.bindings.traceSpecIndex,
        sha256: previousIndexSha256,
      },
    },
  };
  const historicalKit = await renderNaturalTraceCaptureKit({
    bound: historicalBound,
    runtime: item.runtime,
  });
  const kitRoot = path.join(
    item.root,
    DEFAULT_NATURAL_TRACE_KIT_ROOT,
    item.animationId,
    item.safeId,
  );
  await installRenderedKit(kitRoot, historicalKit.files);
  const staleManifest = await readFile(path.join(kitRoot, "kit-manifest.json"));

  const currentGeneratorBytes = Buffer.from("fixture current course trace generator\n");
  await writeFile(item.traceGeneratorPath, currentGeneratorBytes);
  const currentSpec = JSON.parse(await readFile(item.specPath, "utf8"));
  currentSpec.sourceBindings.scheduleDerivation.generator.sha256 = digest(currentGeneratorBytes);
  if (mutateCoverage) {
    const coverage = JSON.parse(await readFile(item.coveragePath, "utf8"));
    mutateCoverage(coverage);
    await writeJson(item.coveragePath, coverage);
    currentSpec.sourceBindings.fullFrameCoverage.sha256 = traceCoverageSha256(coverage);
  }
  const currentTraceSpecSha256 = await writeJson(item.specPath, currentSpec);
  const currentIndex = JSON.parse(await readFile(item.indexPath, "utf8"));
  currentIndex.pilots[0].traceSpecs[0].sha256 = currentTraceSpecSha256;
  currentIndex.refreshFixtureRevision = "current-schema-v2-coverage-descriptor-after-unsigned-kit-scaffold";
  const currentIndexSha256 = await writeJson(item.indexPath, currentIndex);
  return {
    kitRoot,
    staleManifest,
    previousTraceSpecSha256,
    previousTraceSpecGeneratorSha256: item.traceGeneratorSha256,
    currentTraceSpecSha256,
    currentIndexSha256,
  };
}

test("scaffolds a deterministic hash-bound unsigned natural-trace kit without fabricating evidence or changing migration files", async () => {
  const item = await createFixture();
  try {
    const firstBuild = await buildNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime});
    const secondBuild = await buildNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime});
    assert.deepEqual([...secondBuild.files], [...firstBuild.files]);
    const immutableBefore = await Promise.all([
      readFile(item.sourcePath),
      readFile(item.originalHostPath),
      readFile(item.initialChildPath),
      readFile(item.spanishAudioPath),
      readFile(item.englishKeytermsPath),
      readFile(item.manifestPath),
      readFile(item.coveragePath),
      readFile(item.inventoryPath),
      readFile(item.specPath),
      readFile(item.indexPath),
    ]);
    const result = await scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime});
    assert.equal(result.strictAcceptanceEffect, false);
    assert.equal(result.migrationStatusChanged, false);
    const checked = await scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime, check: true});
    assert.equal(checked.status, "verified-unsigned-template-only");
    const kitRoot = path.join(item.root, DEFAULT_NATURAL_TRACE_KIT_ROOT, item.animationId, item.safeId);
    assert.equal(result.kitRoot, kitRoot);
    const manifest = JSON.parse(await readFile(path.join(kitRoot, "kit-manifest.json"), "utf8"));
    const plan = JSON.parse(await readFile(path.join(kitRoot, "capture-plan.template.json"), "utf8"));
    const runtimeTreeManifest = JSON.parse(await readFile(path.join(kitRoot, "runtime-tree-manifest.json"), "utf8"));
    const receipt = JSON.parse(await readFile(path.join(kitRoot, "templates", "runtime-toolchain-receipt.template.json"), "utf8"));
    const environmentReceipt = JSON.parse(await readFile(path.join(kitRoot, "templates", "environment-isolation-receipt.template.json"), "utf8"));
    const launchReceipt = JSON.parse(await readFile(path.join(kitRoot, "templates", "original-host-launch-receipt.template.json"), "utf8"));
    const attestation = JSON.parse(await readFile(path.join(kitRoot, "templates", "capture-session-attestation.template.json"), "utf8"));
    assert.equal(manifest.status, NATURAL_TRACE_TEMPLATE_STATUS);
    assert.equal(manifest.proofMode, NATURAL_TRACE_PROOF_MODE);
    assert.equal(manifest.strictAcceptanceEffect, false);
    assert.equal(manifest.migrationStatusChanged, false);
    assert.equal(manifest.humanReviewRecorded, false);
    assert.equal(manifest.ownerReviewRecorded, false);
    assert.equal(plan.templateStatus, NATURAL_TRACE_TEMPLATE_STATUS);
    assert.equal(plan.notEvidence, true);
    assert.equal(runtimeTreeManifest.templateStatus, NATURAL_TRACE_TEMPLATE_STATUS);
    assert.equal(runtimeTreeManifest.notEvidence, true);
    assert.equal(manifest.bindings.traceSpec.sha256, result.traceSpecSha256);
    assert.equal(manifest.bindings.sourceSwf.sha256, result.sourceSwfSha256);
    assert.equal(manifest.bindings.originalHostSwf.sha256, result.originalHostSwfSha256);
    assert.deepEqual(manifest.bindings.originalHostEvidence, item.originalHostEvidence);
    assert.equal(attestation.originalHostSwf.sha256, result.originalHostSwfSha256);
    assert.deepEqual(attestation.originalHostEvidence, item.originalHostEvidence);
    const kitProjectRelative = path.join(DEFAULT_NATURAL_TRACE_KIT_ROOT, item.animationId, item.safeId).split(path.sep).join("/");
    const expectedRuntimeTreeManifest = {
      file: `${kitProjectRelative}/runtime-tree-manifest.json`,
      sha256: digest(await readFile(path.join(kitRoot, "runtime-tree-manifest.json"))),
    };
    assert.deepEqual(attestation.runtimeTreeManifest, expectedRuntimeTreeManifest);
    assert.deepEqual(attestation.captureKit, {
      kitManifest: {
        file: `${kitProjectRelative}/kit-manifest.json`,
        sha256: digest(await readFile(path.join(kitRoot, "kit-manifest.json"))),
      },
      launcher: {
        file: `${kitProjectRelative}/launch-original-host-sandboxed.sh`,
        sha256: digest(await readFile(path.join(kitRoot, "launch-original-host-sandboxed.sh"))),
      },
      sandboxProfile: {
        file: `${kitProjectRelative}/sandbox.sb`,
        sha256: digest(await readFile(path.join(kitRoot, "sandbox.sb"))),
      },
      runtimeTreeManifest: expectedRuntimeTreeManifest,
      nodeExecutable: {path: process.execPath, sha256: digest(await readFile(process.execPath))},
    });
    const captureKitManifestSha256 = attestation.captureKit.kitManifest.sha256;
    const sandboxProfileSha256 = attestation.captureKit.sandboxProfile.sha256;
    assert.deepEqual(receipt.captureSessionBinding, {
      sessionId: "",
      traceSpecSha256: result.traceSpecSha256,
      sourceSwfSha256: result.sourceSwfSha256,
      originalHostSwfSha256: result.originalHostSwfSha256,
      captureKitManifestSha256,
      sandboxProfileSha256,
      environmentIsolationReceiptSha256: null,
      launchReceiptSha256: null,
    });
    assert.deepEqual(attestation.toolchainReceipt, {
      file: null,
      sha256: null,
      runtime: receipt.runtime,
      captureSessionBinding: receipt.captureSessionBinding,
    });
    assert.deepEqual(attestation.environmentIsolation, {file: null, sha256: null});
    assert.deepEqual(attestation.launchReceipt, {file: null, sha256: null});
    assert.deepEqual(attestation.hostEntryLog, {
      file: null,
      sha256: null,
      finalRecordSha256: null,
      recordCount: null,
    });
    assert.equal(receipt.identityArtifacts[0].file, `${kitProjectRelative}/runtime/runtime-executable-sha256.txt`);
    assert.equal(manifest.runtime.identityReceipt.file, receipt.identityArtifacts[0].file);
    assert.equal(receipt.captureSessionBinding.originalHostSwfSha256, result.originalHostSwfSha256);
    assert.equal(manifest.runtime.executableSha256, item.runtime.executableSha256);
    assert.equal(manifest.originalHostLaunch.launchesChildAlone, false);
    assert.equal(manifest.originalHostLaunch.launchProtocol, NATURAL_PROJECTOR_LAUNCH_PROTOCOL);
    assert.equal(manifest.originalHostLaunch.launcherStartsEmptyProjector, true);
    assert.equal(manifest.originalHostLaunch.commandLineSwfArgumentProvided, false);
    assert.equal(manifest.originalHostLaunch.commandLineHostOpenClaimed, false);
    assert.deepEqual(manifest.originalHostLaunch.hostOpen, {
      method: NATURAL_HOST_OPEN_METHOD,
      menuPath: [...NATURAL_HOST_OPEN_MENU_PATH],
      selectedHost: manifest.originalHostLaunch.stagedHost,
      requiresNamedHumanObservation: true,
    });
    assert.deepEqual(manifest.originalHostLaunch.deniedSideEffects, [
      "network",
      "apple-events",
      "launch-services",
      "writes-outside-ephemeral-temp",
      "stale-flash-preference-and-sharedobject-reads",
      "unmanifested-help-math-content-by-absence",
    ]);
    assert.deepEqual(manifest.expectedEvidenceCounts, {frames: 5, orderedSteps: 1, checkpoints: 4});
    assert.deepEqual(manifest.templates, [
      "templates/runtime-toolchain-receipt.template.json",
      "templates/environment-isolation-receipt.template.json",
      "templates/original-host-launch-receipt.template.json",
      "templates/capture-session-attestation.template.json",
      "templates/host-entry-log.schema.template.jsonl",
      "templates/natural-event-log.schema.template.jsonl",
      "templates/frame-state-log.schema.template.jsonl",
      "templates/source-target-log.schema.template.jsonl",
    ]);
    assert.equal(plan.observations.capturedFrameCount, 0);
    assert.equal(plan.observations.humanSigned, false);
    assert.equal(receipt.capturedAt, null);
    assert.equal(receipt.captureSessionBinding.sessionId, "");
    assert.equal(environmentReceipt.evidenceType, "named-human-disposable-flash-runtime-environment-receipt");
    assert.equal(environmentReceipt.sessionId, "");
    assert.equal(environmentReceipt.animationId, item.animationId);
    assert.equal(environmentReceipt.requirementId, item.requirementId);
    assert.equal(environmentReceipt.isolationMode, null);
    assert.deepEqual(environmentReceipt.account, {
      userName: "",
      uid: null,
      homeDirectory: "",
      realOsAccount: null,
      dedicatedToCapture: null,
    });
    assert.deepEqual(environmentReceipt.profile, {
      identifier: "",
      createdForSession: null,
      reused: null,
      normalSharedObjectReadWriteSemantics: null,
      resetOrDestroyedAfterSession: null,
    });
    assert.deepEqual(environmentReceipt.preflight, {
      runningFlashProcessCount: null,
      sharedObjectFileCount: null,
      cookienameFileCount: null,
      incomingCookieKeyCount: null,
      bookmarkState: null,
      dtfBMID: null,
      inventory: {file: null, sha256: null},
    });
    assert.deepEqual(environmentReceipt.runtimeObservations, {
      sharedObjectGetLocalReturnedObject: null,
      bookmarkBranchTaken: null,
      defaultStartupIrObserved: null,
      targetRwNavigationObserved: null,
      automaticEnglishKeytermRequested: null,
      automaticEnglishKeytermLoadSucceeded: null,
      automaticEnglishKeytermParseSucceeded: null,
    });
    assert.deepEqual(environmentReceipt.postflight, {
      unexpectedProfileFileCount: null,
      unexpectedMutations: null,
      profileResetOrDestroyed: null,
      inventory: {file: null, sha256: null},
    });
    assert.deepEqual(environmentReceipt.operator, {kind: "human", fullName: "", role: "", organizationOrOwnerId: "", contact: ""});
    assert.equal(environmentReceipt.startedAt, null);
    assert.equal(environmentReceipt.endedAt, null);
    assert.equal(environmentReceipt.signedAt, null);
    assert.match(environmentReceipt.statement, /独立、可丢弃且未复用/);
    assert.equal(environmentReceipt.receiptSha256, null);
    assert.equal(launchReceipt.schemaVersion, 2);
    assert.equal(launchReceipt.evidenceType, "named-human-hash-bound-original-host-launch-receipt");
    assert.equal(launchReceipt.sessionId, "");
    assert.equal(launchReceipt.animationId, item.animationId);
    assert.equal(launchReceipt.requirementId, item.requirementId);
    assert.equal(launchReceipt.proofMode, NATURAL_TRACE_PROOF_MODE);
    assert.deepEqual(launchReceipt.captureKit, attestation.captureKit);
    assert.deepEqual(launchReceipt.environmentIsolation, {file: null, sha256: null});
    assert.deepEqual(launchReceipt.runtime, receipt.runtime);
    assert.equal(launchReceipt.workingDirectory, `${kitProjectRelative}/runtime-tree`);
    assert.deepEqual(launchReceipt.kitCheck, {file: null, sha256: null});
    assert.equal(launchReceipt.launchProtocol, NATURAL_PROJECTOR_LAUNCH_PROTOCOL);
    assert.deepEqual(launchReceipt.projectorStart, {
      executablePath: manifest.runtime.executablePath,
      swfArgument: null,
      processId: null,
      startedAt: null,
    });
    assert.deepEqual(launchReceipt.hostOpen, {
      method: NATURAL_HOST_OPEN_METHOD,
      menuPath: [...NATURAL_HOST_OPEN_MENU_PATH],
      selectedHost: manifest.originalHostLaunch.stagedHost,
      openedAt: null,
      playerWindowObserved: null,
    });
    assert.equal(launchReceipt.endedAt, null);
    assert.deepEqual(launchReceipt.operator, {kind: "human", fullName: "", role: "", organizationOrOwnerId: "", contact: ""});
    assert.match(launchReceipt.statement, /hash-bound kit/);
    assert.equal(launchReceipt.receiptSha256, null);
    assert.equal(attestation.operator.fullName, "");
    assert.equal(attestation.startedAt, null);
    assert.equal(attestation.attestationSha256, null);
    assert.deepEqual(attestation.frameSet.frames, []);
    const frameEntries = await readdir(path.join(kitRoot, "frames"));
    assert.deepEqual(frameEntries, ["README.md"]);
    const launcher = await readFile(path.join(kitRoot, "launch-original-host-sandboxed.sh"), "utf8");
    assert.match(launcher, /--check/);
    assert.match(launcher, /index_local\.swf/);
    assert.match(launcher, /PROCESS LAUNCH ONLY — NOT HOST-OPEN EVIDENCE/);
    assert.match(launcher, /PROJECTOR_START_MODE=empty-no-swf-argument/);
    const projectorExecLine = launcher.split(/\r?\n/).find((line) => line.startsWith("exec \/usr\/bin\/sandbox-exec "));
    assert.ok(projectorExecLine);
    assert.equal(projectorExecLine.includes("index_local.swf"), false);
    assert.match(projectorExecLine, /Flash Player'$/);
    const sandbox = await readFile(path.join(kitRoot, "sandbox.sb"), "utf8");
    assert.match(sandbox, /\(deny network\*\)/);
    assert.match(sandbox, /\(deny appleevent-send\)/);
    assert.match(sandbox, /Library\/Preferences\/Macromedia\/Flash Player/);
    assert.match(sandbox, /Library\/Application Support\/Macromedia\/Flash Player/);
    const schemaFiles = [
      "host-entry-log.schema.template.jsonl",
      "natural-event-log.schema.template.jsonl",
      "frame-state-log.schema.template.jsonl",
      "source-target-log.schema.template.jsonl",
    ];
    const schemas = new Map();
    for (const file of schemaFiles) {
      const lines = (await readFile(path.join(kitRoot, "templates", file), "utf8")).trim().split("\n");
      assert.equal(lines.length, 1);
      const schema = JSON.parse(lines[0]);
      schemas.set(file, schema);
      assert.equal(schema.templateStatus, NATURAL_TRACE_TEMPLATE_STATUS);
      assert.equal(schema.notEvidence, true);
      assert.match(schema.artifactType, /schema-template/);
      assert.equal(schema.bindings.animationId, item.animationId);
      assert.equal(schema.bindings.requirementId, item.requirementId);
      assert.equal(schema.bindings.traceSpecSha256, result.traceSpecSha256);
      assert.equal(schema.bindings.sourceSwfSha256, result.sourceSwfSha256);
      assert.equal(schema.bindings.originalHostSwfSha256, result.originalHostSwfSha256);
      assert.equal(schema.bindings.captureKitManifestSha256, captureKitManifestSha256);
      assert.equal(schema.bindings.sandboxProfileSha256, sandboxProfileSha256);
      assert.equal(schema.bindings.environmentIsolationReceiptSha256, null);
      assert.equal(schema.bindings.launchReceiptSha256, null);
      assert.equal(schema.bindings.proofMode, NATURAL_TRACE_PROOF_MODE);
    }
    const hostEntrySchema = schemas.get("host-entry-log.schema.template.jsonl");
    assert.equal(hostEntrySchema.recordKind, "attested-original-host-entry-observation");
    assert.equal(hostEntrySchema.expectedCompletedRecordCount, 8);
    assert.deepEqual(hostEntrySchema.requiredFields, [
      "schemaVersion", "evidenceType", "eventKind", "sessionId", "animationId", "requirementId", "proofMode",
      "traceSpecSha256", "sourceSwfSha256", "originalHostSwfSha256", "captureKitManifestSha256",
      "environmentIsolationReceiptSha256", "launchReceiptSha256", "sequence", "occurredAt", "monotonicTimeMs",
      "operator", "details", "previousRecordSha256", "recordSha256",
    ]);
    assert.match(hostEntrySchema.invariants.join("\n"), /exact event order/);
    assert.match(hostEntrySchema.invariants.join("\n"), /five-file runtime tree/);
    const sessionBoundFields = [
      "captureKitManifestSha256",
      "sandboxProfileSha256",
      "environmentIsolationReceiptSha256",
      "launchReceiptSha256",
      "toolchainReceiptSha256",
    ];
    for (const file of [
      "natural-event-log.schema.template.jsonl",
      "frame-state-log.schema.template.jsonl",
      "source-target-log.schema.template.jsonl",
    ]) {
      const schema = schemas.get(file);
      const fields = Array.isArray(schema.requiredFields) ? schema.requiredFields : schema.requiredFields.common;
      for (const field of sessionBoundFields) assert.ok(fields.includes(field), `${file} must require ${field}`);
    }
    assert.equal(checked.status, "verified-unsigned-template-only");
    assert.equal(checked.captureKitManifestSha256, captureKitManifestSha256);
    assert.equal(checked.launcherSha256, attestation.captureKit.launcher.sha256);
    assert.equal(checked.sandboxProfileSha256, sandboxProfileSha256);
    assert.equal(checked.runtimeTreeManifestSha256, attestation.captureKit.runtimeTreeManifest.sha256);
    assert.equal(checked.nodeExecutableSha256, attestation.captureKit.nodeExecutable.sha256);
    assert.equal(checked.strictAcceptanceEffect, false);
    assert.equal(checked.migrationStatusChanged, false);
    assert.equal(checked.environmentIsolationReceiptSha256 ?? null, null);
    assert.equal(checked.launchReceiptSha256 ?? null, null);
    const allKitText = await Promise.all([...manifest.templates, "README.md", "OPERATOR_CARD.md", "kit-manifest.json", "capture-plan.template.json"].map(async (relative) => {
      const candidate = relative.endsWith(".jsonl") || relative.endsWith(".json")
        ? path.join(kitRoot, relative)
        : path.join(kitRoot, relative);
      return readFile(candidate, "utf8");
    }));
    assert.equal(allKitText.join("\n").includes('"status":"complete-pass"'), false);
    const immutableAfter = await Promise.all([
      readFile(item.sourcePath),
      readFile(item.originalHostPath),
      readFile(item.initialChildPath),
      readFile(item.spanishAudioPath),
      readFile(item.englishKeytermsPath),
      readFile(item.manifestPath),
      readFile(item.coveragePath),
      readFile(item.inventoryPath),
      readFile(item.specPath),
      readFile(item.indexPath),
    ]);
    assert.deepEqual(immutableAfter, immutableBefore);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("stages the exact five-file original-host runtime tree read-only and starts Projector empty for a named-human GUI host open", async () => {
  const item = await createFixture();
  try {
    await scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime});
    const kitRoot = path.join(item.root, DEFAULT_NATURAL_TRACE_KIT_ROOT, item.animationId, item.safeId);
    const runtimeTree = path.join(kitRoot, "runtime-tree");
    for (const required of item.minimalTree.requiredFiles) {
      const archiveRelative = required.path.slice(`${item.archiveRootRelative}/`.length);
      const source = path.join(item.root, required.path);
      const staged = path.join(runtimeTree, archiveRelative);
      const [sourceBytes, stagedBytes, stagedInfo] = await Promise.all([readFile(source), readFile(staged), stat(staged)]);
      assert.deepEqual(stagedBytes, sourceBytes, archiveRelative);
      assert.equal(digest(stagedBytes), required.sha256, archiveRelative);
      assert.equal(stagedBytes.length, required.bytes, archiveRelative);
      assert.equal(stagedInfo.mode & 0o222, 0, `${archiveRelative} must be read-only`);
    }
    const observedRuntimeFiles = [];
    async function walk(directory, prefix = "") {
      for (const entry of await readdir(directory, {withFileTypes: true})) {
        const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) await walk(path.join(directory, entry.name), relative);
        else if (entry.isFile()) observedRuntimeFiles.push(relative);
        else assert.fail(`runtime-tree contains unsupported entry ${relative}`);
      }
    }
    await walk(runtimeTree);
    assert.deepEqual(
      observedRuntimeFiles.sort(),
      item.minimalTree.requiredFiles.map(({path: file}) => file.slice(`${item.archiveRootRelative}/`.length)).sort(),
    );
    const launcher = await readFile(path.join(kitRoot, "launch-original-host-sandboxed.sh"), "utf8");
    const stagedHost = path.join(runtimeTree, "HELP_COURSES", "ELMGR5", "L13", "index_local.swf");
    assert.ok(launcher.includes(stagedHost), "launcher must print the exact staged original host as operator guidance");
    const projectorExecLine = launcher.split(/\r?\n/).find((line) => line.startsWith("exec /usr/bin/sandbox-exec "));
    assert.ok(projectorExecLine, "launcher must contain one explicit Projector process exec");
    assert.equal(projectorExecLine.includes(stagedHost), false, "Projector process exec must not receive a SWF argument");
    const manifest = JSON.parse(await readFile(path.join(kitRoot, "kit-manifest.json"), "utf8"));
    assert.ok(projectorExecLine.trim().endsWith(`'${manifest.runtime.executablePath}'`), "Projector process exec must end at the bound executable");
    assert.equal(launcher.includes("source-assets"), false, "launcher must never point Projector or its working directory at source-assets");
    assert.equal(launcher.includes(item.originalHostPath), false, "launcher must not pass the preserved source host directly");
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("refuses overwrite and a symbolic-link requirement output", async (t) => {
  await t.test("overwrite", async () => {
    const item = await createFixture();
    try {
      await scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime});
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime}),
        /already exists; refusing overwrite/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
  await t.test("symlink", async () => {
    const item = await createFixture();
    const outside = await mkdtemp(path.join(os.tmpdir(), "natural-trace-kit-outside-"));
    try {
      const parent = path.join(item.root, DEFAULT_NATURAL_TRACE_KIT_ROOT, item.animationId);
      await mkdir(parent, {recursive: true});
      await symlink(outside, path.join(parent, item.safeId), "dir");
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime}),
        /forbidden symbolic-link component/,
      );
      assert.deepEqual(await readdir(outside), []);
    } finally {
      await rm(item.root, {recursive: true, force: true});
      await rm(outside, {recursive: true, force: true});
    }
  });
});

test("check mode rejects an added or edited kit instead of silently trusting it", async () => {
  const item = await createFixture();
  try {
    await scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime});
    const kitRoot = path.join(item.root, DEFAULT_NATURAL_TRACE_KIT_ROOT, item.animationId, item.safeId);
    await writeFile(path.join(kitRoot, "unexpected.txt"), "not part of the kit\n");
    await assert.rejects(
      () => scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime, check: true}),
      /file set differs/,
    );
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("check and refresh reject a hard-linked unsigned-kit file", async () => {
  const item = await createFixture();
  try {
    const result = await scaffoldNaturalTraceCaptureKit({
      projectRoot: item.root,
      specFile: item.specRelative,
      runtime: item.runtime,
    });
    const readme = path.join(result.kitRoot, "README.md");
    await link(readme, path.join(item.root, "README-hardlink-alias.md"));
    await assert.rejects(
      () => scaffoldNaturalTraceCaptureKit({
        projectRoot: item.root,
        specFile: item.specRelative,
        runtime: item.runtime,
        check: true,
      }),
      /must not be symbolic- or hard-linked|must not be.*hard-linked/,
    );
    const index = JSON.parse(await readFile(item.indexPath, "utf8"));
    index.refreshFixtureRevision = "hardlink-refresh-rejection";
    await writeJson(item.indexPath, index);
    await assert.rejects(
      () => scaffoldNaturalTraceCaptureKit({
        projectRoot: item.root,
        specFile: item.specRelative,
        runtime: item.runtime,
        refreshUnsignedTemplate: true,
      }),
      /must not be symbolic- or hard-linked|must not be.*hard-linked/,
    );
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("check mode rejects session evidence written into unsigned environment, launch, or host-entry templates", async (t) => {
  const cases = [
    {
      name: "disposable-environment-receipt",
      relative: ["templates", "environment-isolation-receipt.template.json"],
      mutate(value) {
        value.isolationMode = "restored-disposable-macos-vm-snapshot";
        value.account.realOsAccount = true;
        value.receiptSha256 = "1".repeat(64);
        return `${JSON.stringify(value, null, 2)}\n`;
      },
    },
    {
      name: "hash-bound-launch-receipt",
      relative: ["templates", "original-host-launch-receipt.template.json"],
      mutate(value) {
        value.environmentIsolation = {file: "work/fake-environment.json", sha256: "2".repeat(64)};
        value.kitCheck = {file: "work/fake-kit-check.json", sha256: "3".repeat(64)};
        value.receiptSha256 = "4".repeat(64);
        return `${JSON.stringify(value, null, 2)}\n`;
      },
    },
    {
      name: "host-entry-log-schema",
      relative: ["templates", "host-entry-log.schema.template.jsonl"],
      mutate(value) {
        value.bindings.environmentIsolationReceiptSha256 = "5".repeat(64);
        value.bindings.launchReceiptSha256 = "6".repeat(64);
        return `${JSON.stringify(value)}\n`;
      },
    },
  ];
  for (const itemCase of cases) {
    await t.test(itemCase.name, async () => {
      const item = await createFixture();
      try {
        await scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime});
        const candidate = path.join(
          item.root,
          DEFAULT_NATURAL_TRACE_KIT_ROOT,
          item.animationId,
          item.safeId,
          ...itemCase.relative,
        );
        const value = JSON.parse((await readFile(candidate, "utf8")).trim());
        await rm(candidate);
        await writeFile(candidate, itemCase.mutate(value));
        await assert.rejects(
          () => scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime, check: true}),
          /stale or edited/,
        );
      } finally {
        await rm(item.root, {recursive: true, force: true});
      }
    });
  }
});

test("fails closed for unresolved/stale specs, stale projection/index bindings, and stale runtime executables", async (t) => {
  await t.test("unresolved", async () => {
    const item = await createFixture();
    try {
      const spec = JSON.parse(await readFile(item.specPath, "utf8"));
      spec.traceSpecStatus = "unresolved";
      await writeJson(item.specPath, spec);
      await assert.rejects(
        () => buildNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime}),
        /exact current ready RW sprite-334 natural-trace/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
  await t.test("stale-projection", async () => {
    const item = await createFixture();
    try {
      const manifest = JSON.parse(await readFile(item.manifestPath, "utf8"));
      manifest.runtime.frameCount = 999;
      await writeJson(item.manifestPath, manifest);
      await assert.rejects(
        () => buildNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime}),
        /projection binding is stale/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
  await t.test("stale-index", async () => {
    const item = await createFixture();
    try {
      const index = JSON.parse(await readFile(item.indexPath, "utf8"));
      index.pilots[0].traceSpecs[0].sha256 = "0".repeat(64);
      await writeJson(item.indexPath, index);
      await assert.rejects(
        () => buildNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime}),
        /not the exact current indexed ready natural trace/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
  await t.test("stale-runtime", async () => {
    const item = await createFixture();
    try {
      await writeFile(item.runtime.executablePath, "changed executable\n");
      await assert.rejects(
        () => buildNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime}),
        /executable SHA-256 is stale/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
});

test("fails closed when original-host audit reports are missing, tampered, or generator-stale", async (t) => {
  await t.test("missing-report", async () => {
    const item = await createFixture();
    try {
      await rm(item.hostEvidencePaths.minimalTree);
      await assert.rejects(
        () => buildNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime}),
        /ENOENT|original-host minimalTree/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
  await t.test("tampered-entry-contract", async () => {
    const item = await createFixture();
    try {
      item.entryContract.contracts.childLoad.status = "guessed";
      await writeJson(item.hostEvidencePaths.entryContract, item.entryContract);
      await assert.rejects(
        () => buildNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime}),
        /entry contract does not prove the bounded source entry/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
  await t.test("generator-stale", async () => {
    const item = await createFixture();
    try {
      await writeFile(item.hostGeneratorPath, "// changed after host audit reports were generated\n");
      await assert.rejects(
        () => buildNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime}),
        /original-host entryContract generator SHA-256 is stale/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
  await t.test("tampered-placement-proof", async () => {
    const item = await createFixture();
    try {
      item.placementProof.structuralChain.placements[1].instanceName = "not-keyterms";
      const placementSha256 = await writeJson(item.hostEvidencePaths.placementProof, item.placementProof);
      const reboundPlacement = {path: item.originalHostEvidence.placementProof.file, sha256: placementSha256};
      item.entryContract.contracts.automaticEnglishKeytermRead.structuralPlacementProof = reboundPlacement;
      item.minimalTree.structuralPlacementProof = reboundPlacement;
      await writeJson(item.hostEvidencePaths.entryContract, item.entryContract);
      await writeJson(item.hostEvidencePaths.minimalTree, item.minimalTree);
      await assert.rejects(
        () => buildNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime}),
        /structural placement proof does not establish the automatic keyterm request boundary/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
});

test("CLI requires --spec and exposes no output, promotion, or acceptance switches", () => {
  const options = parseArguments(["--spec", "migrations/a/audit/trace-specs/x.json", "--player-app", "/Applications/Fake.app", "--check"]);
  assert.equal(options.specFile, "migrations/a/audit/trace-specs/x.json");
  assert.equal(options.playerApp, "/Applications/Fake.app");
  assert.equal(options.check, true);
  const refresh = parseArguments(["--spec", "migrations/a/audit/trace-specs/x.json", "--refresh-unsigned-template"]);
  assert.equal(refresh.refreshUnsignedTemplate, true);
  const priorGenerator = "a".repeat(64);
  const generatorRefresh = parseArguments([
    "--spec", "migrations/a/audit/trace-specs/x.json",
    "--refresh-unsigned-template",
    "--previous-trace-spec-generator-sha256", priorGenerator,
  ]);
  assert.equal(generatorRefresh.previousTraceSpecGeneratorSha256, priorGenerator);
  assert.throws(
    () => parseArguments(["--spec", "migrations/a/audit/trace-specs/x.json", "--check", "--refresh-unsigned-template"]),
    /mutually exclusive/,
  );
  assert.throws(() => parseArguments([]), /--spec is required/);
  assert.throws(() => parseArguments(["--spec"]), /--spec requires a value/);
  assert.throws(
    () => parseArguments(["--spec", "migrations/a/audit/trace-specs/x.json", "--previous-trace-spec-generator-sha256", priorGenerator]),
    /requires --refresh-unsigned-template/,
  );
  assert.throws(
    () => parseArguments(["--spec", "migrations/a/audit/trace-specs/x.json", "--refresh-unsigned-template", "--previous-trace-spec-generator-sha256", "ABC"]),
    /lowercase SHA-256/,
  );
  assert.throws(() => parseArguments(["--output", "elsewhere"]), /Unknown option/);
  assert.throws(() => parseArguments(["--promote"]), /Unknown option/);
  assert.throws(() => parseArguments(["--update-coverage"]), /Unknown option/);
  assert.match(usage(), /--refresh-unsigned-template/);
  assert.match(usage(), /--previous-trace-spec-generator-sha256/);
  assert.match(usage(), /append-only archive/);
  assert.match(usage(), /never launches the runtime/);
  assert.match(usage(), /never.*changes status/s);
});

test("refreshes only an exact stale unsigned template and retains an append-only byte-exact archive", async () => {
  const item = await createFixture();
  try {
    const {kitRoot, staleManifest, currentIndexSha256} = await scaffoldThenAdvanceIndex(item);
    const result = await scaffoldNaturalTraceCaptureKit({
      projectRoot: item.root,
      specFile: item.specRelative,
      runtime: item.runtime,
      refreshUnsignedTemplate: true,
    });
    assert.equal(result.status, "refreshed-unsigned-template-only");
    assert.equal(result.traceSpecIndexSha256, currentIndexSha256);
    assert.equal(result.strictAcceptanceEffect, false);
    assert.equal(result.migrationStatusChanged, false);
    assert.deepEqual(await readFile(path.join(result.archiveRoot, "kit-manifest.json")), staleManifest);
    const archiveRecord = JSON.parse(await readFile(result.archiveRecord, "utf8"));
    assert.equal(archiveRecord.evidenceType, "natural-trace-unsigned-template-stale-archive-record");
    assert.equal(archiveRecord.animationId, item.animationId);
    assert.equal(archiveRecord.requirementId, item.requirementId);
    assert.equal(archiveRecord.previousTreeSha256, result.previousTreeSha256);
    assert.equal(archiveRecord.traceSpecIndex.currentSha256, currentIndexSha256);
    assert.equal(archiveRecord.replacementCaptureKitManifestSha256, result.captureKitManifestSha256);
    assert.equal(archiveRecord.strictAcceptanceEffect, false);
    assert.equal(archiveRecord.humanReviewRecorded, false);
    assert.equal(archiveRecord.ownerReviewRecorded, false);
    assert.ok(archiveRecord.inventory.length > 0);
    const archiveIntegrityBytes = await readFile(result.archiveIntegrity);
    const archiveIntegrity = JSON.parse(archiveIntegrityBytes);
    assert.equal(path.basename(result.archiveIntegrity), NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE);
    assert.equal(archiveIntegrity.evidenceType, "natural-trace-unsigned-template-stale-archive-integrity-sidecar");
    assert.equal(archiveIntegrity.archiveRecord.sha256, digest(await readFile(result.archiveRecord)));
    assert.equal(archiveIntegrity.archivedKit.fileCount, archiveRecord.inventory.length);
    assert.equal(archiveIntegrity.directoryTreeIdentity.algorithm, NATURAL_TRACE_ARCHIVE_TREE_ALGORITHM_CURRENT);
    assert.equal(archiveIntegrity.directoryTreeIdentity.sha256, archiveRecord.previousTreeSha256);
    assert.equal(archiveIntegrity.directoryTreeIdentity.legacyCompatibilityDerivation, false);
    assert.equal(archiveIntegrity.strictAcceptanceEffect, false);
    assert.equal(archiveIntegrity.humanReviewRecorded, false);
    assert.equal(archiveIntegrity.ownerReviewRecorded, false);
    const currentManifest = JSON.parse(await readFile(path.join(kitRoot, "kit-manifest.json"), "utf8"));
    assert.equal(currentManifest.bindings.traceSpecIndex.sha256, currentIndexSha256);
    const checked = await scaffoldNaturalTraceCaptureKit({
      projectRoot: item.root,
      specFile: item.specRelative,
      runtime: item.runtime,
      check: true,
    });
    assert.equal(checked.status, "verified-unsigned-template-only");
    await assert.rejects(
      () => scaffoldNaturalTraceCaptureKit({
        projectRoot: item.root,
        specFile: item.specRelative,
        runtime: item.runtime,
        refreshUnsignedTemplate: true,
      }),
      /already binds the current trace-spec index/,
    );
    assert.deepEqual(await readFile(path.join(result.archiveRoot, "kit-manifest.json")), staleManifest);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("refreshes an exact unsigned kit after generator-only trace-spec and index drift with a hash-closing witness", async () => {
  const item = await createFixture();
  try {
    const stale = await scaffoldThenAdvanceTraceGeneratorAndIndex(item);
    const result = await scaffoldNaturalTraceCaptureKit({
      projectRoot: item.root,
      specFile: item.specRelative,
      runtime: item.runtime,
      refreshUnsignedTemplate: true,
      previousTraceSpecGeneratorSha256: stale.previousTraceSpecGeneratorSha256,
    });
    assert.equal(result.status, "refreshed-unsigned-template-only");
    assert.equal(result.previousTraceSpecSha256, stale.previousTraceSpecSha256);
    assert.equal(result.traceSpecSha256, stale.currentTraceSpecSha256);
    assert.equal(result.traceSpecIndexSha256, stale.currentIndexSha256);
    assert.deepEqual(result.traceSpecDriftProof, {
      kind: "single-allowlisted-trace-spec-field-drift",
      path: "sourceBindings.scheduleDerivation.generator.sha256",
      previousGeneratorSha256: stale.previousTraceSpecGeneratorSha256,
      currentGeneratorSha256: digest("fixture current course trace generator\n"),
      reconstructedPreviousTraceSpecSha256: stale.previousTraceSpecSha256,
      currentTraceSpecSha256: stale.currentTraceSpecSha256,
      allOtherTraceSpecBytesReconstructedFromCurrent: true,
    });
    assert.deepEqual(await readFile(path.join(result.archiveRoot, "kit-manifest.json")), stale.staleManifest);
    const archiveRecord = JSON.parse(await readFile(result.archiveRecord, "utf8"));
    assert.equal(archiveRecord.traceSpec.previousSha256, stale.previousTraceSpecSha256);
    assert.equal(archiveRecord.traceSpec.currentSha256, stale.currentTraceSpecSha256);
    assert.deepEqual(archiveRecord.traceSpec.driftProof, result.traceSpecDriftProof);
    assert.equal(archiveRecord.traceSpecIndex.currentSha256, stale.currentIndexSha256);
    assert.equal(archiveRecord.humanReviewRecorded, false);
    assert.equal(archiveRecord.ownerReviewRecorded, false);
    const checked = await scaffoldNaturalTraceCaptureKit({
      projectRoot: item.root,
      specFile: item.specRelative,
      runtime: item.runtime,
      check: true,
    });
    assert.equal(checked.status, "verified-unsigned-template-only");
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("refreshes the exact RW generator plus projection-inert schema-v2 coverage descriptor cascade", async () => {
  const item = await createFixture();
  try {
    const stale = await installLegacyDescriptorKitThenAdvanceCurrentDescriptor(item);
    const result = await scaffoldNaturalTraceCaptureKit({
      projectRoot: item.root,
      specFile: item.specRelative,
      runtime: item.runtime,
      refreshUnsignedTemplate: true,
      previousTraceSpecGeneratorSha256: stale.previousTraceSpecGeneratorSha256,
    });
    assert.equal(result.status, "refreshed-unsigned-template-only");
    assert.equal(result.previousTraceSpecSha256, stale.previousTraceSpecSha256);
    assert.equal(result.traceSpecSha256, stale.currentTraceSpecSha256);
    assert.equal(result.traceSpecIndexSha256, stale.currentIndexSha256);
    assert.equal(
      result.traceSpecDriftProof.kind,
      "allowlisted-generator-and-inert-coverage-descriptor-drift",
    );
    assert.deepEqual(result.traceSpecDriftProof.paths, [
      "sourceBindings.scheduleDerivation.generator.sha256",
      "sourceBindings.fullFrameCoverage.includedPaths",
    ]);
    assert.equal(
      result.traceSpecDriftProof.previousGeneratorSha256,
      stale.previousTraceSpecGeneratorSha256,
    );
    assert.equal(
      result.traceSpecDriftProof.reconstructedPreviousTraceSpecSha256,
      stale.previousTraceSpecSha256,
    );
    assert.deepEqual(
      result.traceSpecDriftProof.coverageDescriptorDrift.previousIncludedPaths,
      LEGACY_TRACE_COVERAGE_INCLUDED_REQUIREMENT_PATHS,
    );
    assert.deepEqual(
      result.traceSpecDriftProof.coverageDescriptorDrift.currentIncludedPaths,
      [...TRACE_COVERAGE_PROJECTION.includedRequirementPaths],
    );
    assert.deepEqual(result.traceSpecDriftProof.coverageDescriptorDrift.addedPaths, [
      "requirementSchemaVersion",
      "coverageRole",
      "coverageGroupId",
      "requiredFrameSet",
      "selectionSha256",
      "naturalPath",
      "strictAcceptanceEffect",
    ]);
    assert.equal(
      result.traceSpecDriftProof.coverageDescriptorDrift.previousProjectionSha256,
      result.traceSpecDriftProof.coverageDescriptorDrift.currentProjectionSha256,
    );
    assert.equal(
      result.traceSpecDriftProof.coverageDescriptorDrift.projectionSha256Unchanged,
      true,
    );
    assert.equal(result.traceSpecDriftProof.allOtherTraceSpecBytesReconstructedFromCurrent, true);
    assert.deepEqual(
      await readFile(path.join(result.archiveRoot, "kit-manifest.json")),
      stale.staleManifest,
    );
    const archiveRecord = JSON.parse(await readFile(result.archiveRecord, "utf8"));
    assert.deepEqual(archiveRecord.traceSpec.driftProof, result.traceSpecDriftProof);
    assert.equal(archiveRecord.strictAcceptanceEffect, false);
    assert.equal(archiveRecord.humanReviewRecorded, false);
    assert.equal(archiveRecord.ownerReviewRecorded, false);
    const checked = await scaffoldNaturalTraceCaptureKit({
      projectRoot: item.root,
      specFile: item.specRelative,
      runtime: item.runtime,
      check: true,
    });
    assert.equal(checked.status, "verified-unsigned-template-only");
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("schema-v2 descriptor refresh rejects projection-changing coverage semantics", async () => {
  const item = await createFixture();
  try {
    const stale = await installLegacyDescriptorKitThenAdvanceCurrentDescriptor(
      item,
      (coverage) => {
        coverage.requirements[0].requirementSchemaVersion = 2;
        coverage.requirements[0].coverageRole = "full-domain";
        coverage.requirements[0].coverageGroupId =
          "coverage-group:sprite-334:default:en:seed-0";
        coverage.requirements[0].selectionSha256 = selectionSha256(
          coverage.requirements[0],
          5,
        );
      },
    );
    await assert.rejects(
      () => scaffoldNaturalTraceCaptureKit({
        projectRoot: item.root,
        specFile: item.specRelative,
        runtime: item.runtime,
        refreshUnsignedTemplate: true,
        previousTraceSpecGeneratorSha256: stale.previousTraceSpecGeneratorSha256,
      }),
      /projection-changing coverage semantics/,
    );
    assert.deepEqual(
      await readFile(path.join(stale.kitRoot, "kit-manifest.json")),
      stale.staleManifest,
    );
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("generator-drift refresh requires the exact witness and rejects every non-allowlisted spec change", async (t) => {
  await t.test("missing witness", async () => {
    const item = await createFixture();
    try {
      await scaffoldThenAdvanceTraceGeneratorAndIndex(item);
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({
          projectRoot: item.root,
          specFile: item.specRelative,
          runtime: item.runtime,
          refreshUnsignedTemplate: true,
        }),
        /previous-trace-spec-generator-sha256 is required/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("incorrect witness", async () => {
    const item = await createFixture();
    try {
      await scaffoldThenAdvanceTraceGeneratorAndIndex(item);
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({
          projectRoot: item.root,
          specFile: item.specRelative,
          runtime: item.runtime,
          refreshUnsignedTemplate: true,
          previousTraceSpecGeneratorSha256: "b".repeat(64),
        }),
        /does not reconstruct the stale trace specification/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("stale current generator binding", async () => {
    const item = await createFixture();
    try {
      const stale = await scaffoldThenAdvanceTraceGeneratorAndIndex(item);
      await writeFile(item.traceGeneratorPath, "tampered current generator bytes\n");
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({
          projectRoot: item.root,
          specFile: item.specRelative,
          runtime: item.runtime,
          refreshUnsignedTemplate: true,
          previousTraceSpecGeneratorSha256: stale.previousTraceSpecGeneratorSha256,
        }),
        /current trace-spec generator SHA-256 binding is stale/,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  const mutations = {
    schedule: (spec) => { spec.schedule.playbackSegments[0].expectedState.localPlayState = "stopped"; },
    source: (spec) => { spec.sourceBindings.scheduleDerivation.sourceArtifacts = {unexpected: true}; },
    identity: (spec) => { spec.identity.scenarioKind = "assessment"; },
    terminal: (spec) => { spec.schedule.terminalSemantics.expectedState.quizSection = true; },
  };
  for (const [label, mutate] of Object.entries(mutations)) await t.test(label, async () => {
    const item = await createFixture();
    try {
      const stale = await scaffoldThenAdvanceTraceGeneratorAndIndex(item, mutate);
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({
          projectRoot: item.root,
          specFile: item.specRelative,
          runtime: item.runtime,
          refreshUnsignedTemplate: true,
          previousTraceSpecGeneratorSha256: stale.previousTraceSpecGeneratorSha256,
        }),
        /does not reconstruct the stale trace specification.*non-allowlisted/s,
      );
      assert.deepEqual(await readFile(path.join(stale.kitRoot, "kit-manifest.json")), stale.staleManifest);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
});

test("unsigned-template refresh rejects tampering, extra session evidence, and symbolic links", async (t) => {
  await t.test("tampered deterministic file", async () => {
    const item = await createFixture();
    try {
      const {kitRoot} = await scaffoldThenAdvanceIndex(item);
      const readme = path.join(kitRoot, "README.md");
      await rm(readme);
      await writeFile(readme, "tampered unsigned-template claim\n");
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime, refreshUnsignedTemplate: true}),
        /not an exact generator-produced unsigned template/,
      );
      assert.equal(await readFile(readme, "utf8"), "tampered unsigned-template claim\n");
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("extra frame/session evidence", async () => {
    const item = await createFixture();
    try {
      const {kitRoot} = await scaffoldThenAdvanceIndex(item);
      const evidence = path.join(kitRoot, "frames", "frame-0001.png");
      await writeFile(evidence, "not a real png\n");
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime, refreshUnsignedTemplate: true}),
        /file set differs.*runtime\/session evidence/s,
      );
      assert.equal(await readFile(evidence, "utf8"), "not a real png\n");
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("symbolic-link evidence entry", async () => {
    const item = await createFixture();
    const outside = await mkdtemp(path.join(os.tmpdir(), "natural-trace-refresh-symlink-"));
    try {
      const {kitRoot} = await scaffoldThenAdvanceIndex(item);
      const outsideFile = path.join(outside, "frame.png");
      await writeFile(outsideFile, "outside\n");
      await symlink(outsideFile, path.join(kitRoot, "frames", "frame-0001.png"));
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime, refreshUnsignedTemplate: true}),
        /forbidden symbolic link/,
      );
      assert.equal(await readFile(outsideFile, "utf8"), "outside\n");
    } finally {
      await rm(item.root, {recursive: true, force: true});
      await rm(outside, {recursive: true, force: true});
    }
  });
});

test("generator-drift refresh rejects human edits, filled fields, signatures, extras, and symlinks", async (t) => {
  const cases = {
    "human-edited operator card": {
      mutate: async ({kitRoot}) => {
        const candidate = path.join(kitRoot, "OPERATOR_CARD.md");
        await rm(candidate);
        await writeFile(candidate, "human notes must be preserved\n");
      },
      error: /not an exact generator-produced unsigned template/,
    },
    "filled human identity": {
      mutate: async ({kitRoot}) => {
        const candidate = path.join(kitRoot, "templates", "capture-session-attestation.template.json");
        const value = JSON.parse(await readFile(candidate, "utf8"));
        value.operator.fullName = "Named Human";
        await rm(candidate);
        await writeJson(candidate, value);
      },
      error: /not an exact generator-produced unsigned template/,
    },
    "filled signature": {
      mutate: async ({kitRoot}) => {
        const candidate = path.join(kitRoot, "templates", "capture-session-attestation.template.json");
        const value = JSON.parse(await readFile(candidate, "utf8"));
        value.signedAt = "2026-07-22T00:00:00.000Z";
        value.attestationSha256 = "c".repeat(64);
        await rm(candidate);
        await writeJson(candidate, value);
      },
      error: /not an exact generator-produced unsigned template/,
    },
    "extra evidence": {
      mutate: async ({kitRoot}) => {
        await writeFile(path.join(kitRoot, "frames", "frame-0001.png"), "not evidence\n");
      },
      error: /file set differs.*runtime\/session evidence/s,
    },
    "symbolic-link evidence": {
      mutate: async ({kitRoot, outside}) => {
        const target = path.join(outside, "outside.png");
        await writeFile(target, "outside\n");
        await symlink(target, path.join(kitRoot, "frames", "frame-0001.png"));
      },
      error: /forbidden symbolic link/,
    },
  };
  for (const [label, fixtureCase] of Object.entries(cases)) await t.test(label, async () => {
    const item = await createFixture();
    const outside = await mkdtemp(path.join(os.tmpdir(), "natural-trace-generator-drift-"));
    try {
      const stale = await scaffoldThenAdvanceTraceGeneratorAndIndex(item);
      await fixtureCase.mutate({kitRoot: stale.kitRoot, outside});
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({
          projectRoot: item.root,
          specFile: item.specRelative,
          runtime: item.runtime,
          refreshUnsignedTemplate: true,
          previousTraceSpecGeneratorSha256: stale.previousTraceSpecGeneratorSha256,
        }),
        fixtureCase.error,
      );
    } finally {
      await rm(item.root, {recursive: true, force: true});
      await rm(outside, {recursive: true, force: true});
    }
  });
});

test("generator-drift refresh preserves locking, CAS, append-only archive reuse, and rollback", async (t) => {
  await t.test("concurrent callers serialize", async () => {
    const item = await createFixture();
    let enterCas;
    let releaseCas;
    const entered = new Promise((resolve) => { enterCas = resolve; });
    const release = new Promise((resolve) => { releaseCas = resolve; });
    try {
      const stale = await scaffoldThenAdvanceTraceGeneratorAndIndex(item);
      const first = scaffoldNaturalTraceCaptureKit({
        projectRoot: item.root,
        specFile: item.specRelative,
        runtime: item.runtime,
        refreshUnsignedTemplate: true,
        previousTraceSpecGeneratorSha256: stale.previousTraceSpecGeneratorSha256,
        transactionHooks: {beforeCas: async () => { enterCas(); await release; }},
      });
      await entered;
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({
          projectRoot: item.root,
          specFile: item.specRelative,
          runtime: item.runtime,
          refreshUnsignedTemplate: true,
          previousTraceSpecGeneratorSha256: stale.previousTraceSpecGeneratorSha256,
        }),
        /refresh is already in progress/,
      );
      releaseCas();
      assert.equal((await first).status, "refreshed-unsigned-template-only");
    } finally {
      releaseCas?.();
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("stale CAS preserves concurrent bytes", async () => {
    const item = await createFixture();
    try {
      const stale = await scaffoldThenAdvanceTraceGeneratorAndIndex(item);
      const readme = path.join(stale.kitRoot, "README.md");
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({
          projectRoot: item.root,
          specFile: item.specRelative,
          runtime: item.runtime,
          refreshUnsignedTemplate: true,
          previousTraceSpecGeneratorSha256: stale.previousTraceSpecGeneratorSha256,
          transactionHooks: {
            beforeCas: async () => {
              await rm(readme);
              await writeFile(readme, "concurrent operator content\n");
            },
          },
        }),
        /changed after refresh validation; stale CAS refused/,
      );
      assert.equal(await readFile(readme, "utf8"), "concurrent operator content\n");
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });

  await t.test("rollback preserves and reuses append-only archive", async () => {
    const item = await createFixture();
    try {
      const stale = await scaffoldThenAdvanceTraceGeneratorAndIndex(item);
      let archiveRoot;
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({
          projectRoot: item.root,
          specFile: item.specRelative,
          runtime: item.runtime,
          refreshUnsignedTemplate: true,
          previousTraceSpecGeneratorSha256: stale.previousTraceSpecGeneratorSha256,
          transactionHooks: {
            afterArchive: async ({archiveKitRoot}) => { archiveRoot = archiveKitRoot; },
            afterDisplace: async () => { throw new Error("injected generator-drift rollback"); },
          },
        }),
        /injected generator-drift rollback/,
      );
      assert.deepEqual(await readFile(path.join(stale.kitRoot, "kit-manifest.json")), stale.staleManifest);
      assert.deepEqual(await readFile(path.join(archiveRoot, "kit-manifest.json")), stale.staleManifest);
      const retried = await scaffoldNaturalTraceCaptureKit({
        projectRoot: item.root,
        specFile: item.specRelative,
        runtime: item.runtime,
        refreshUnsignedTemplate: true,
        previousTraceSpecGeneratorSha256: stale.previousTraceSpecGeneratorSha256,
      });
      assert.equal(retried.archiveReused, true);
      assert.equal(retried.status, "refreshed-unsigned-template-only");
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
});

test("unsigned-template refresh serializes concurrent callers", async () => {
  const item = await createFixture();
  let enterCas;
  let releaseCas;
  const entered = new Promise((resolve) => { enterCas = resolve; });
  const release = new Promise((resolve) => { releaseCas = resolve; });
  try {
    await scaffoldThenAdvanceIndex(item);
    const first = scaffoldNaturalTraceCaptureKit({
      projectRoot: item.root,
      specFile: item.specRelative,
      runtime: item.runtime,
      refreshUnsignedTemplate: true,
      transactionHooks: {beforeCas: async () => { enterCas(); await release; }},
    });
    await entered;
    const second = scaffoldNaturalTraceCaptureKit({
      projectRoot: item.root,
      specFile: item.specRelative,
      runtime: item.runtime,
      refreshUnsignedTemplate: true,
    });
    await assert.rejects(second, /refresh is already in progress/);
    releaseCas();
    assert.equal((await first).status, "refreshed-unsigned-template-only");
  } finally {
    releaseCas?.();
    await rm(item.root, {recursive: true, force: true});
  }
});

test("unsigned-template refresh rejects a stale CAS and leaves concurrent bytes untouched", async () => {
  const item = await createFixture();
  try {
    const {kitRoot} = await scaffoldThenAdvanceIndex(item);
    const readme = path.join(kitRoot, "README.md");
    await assert.rejects(
      () => scaffoldNaturalTraceCaptureKit({
        projectRoot: item.root,
        specFile: item.specRelative,
        runtime: item.runtime,
        refreshUnsignedTemplate: true,
        transactionHooks: {
          beforeCas: async () => {
            await rm(readme);
            await writeFile(readme, "concurrent operator content\n");
          },
        },
      }),
      /changed after refresh validation; stale CAS refused/,
    );
    assert.equal(await readFile(readme, "utf8"), "concurrent operator content\n");
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("unsigned-template refresh rolls back the active kit after displacement while preserving the archive", async () => {
  const item = await createFixture();
  try {
    const {kitRoot, staleManifest} = await scaffoldThenAdvanceIndex(item);
    let archivedRoot;
    await assert.rejects(
      () => scaffoldNaturalTraceCaptureKit({
        projectRoot: item.root,
        specFile: item.specRelative,
        runtime: item.runtime,
        refreshUnsignedTemplate: true,
        transactionHooks: {
          afterArchive: async ({archiveKitRoot}) => { archivedRoot = archiveKitRoot; },
          afterDisplace: async () => { throw new Error("injected post-displacement failure"); },
        },
      }),
      /injected post-displacement failure/,
    );
    assert.deepEqual(await readFile(path.join(kitRoot, "kit-manifest.json")), staleManifest);
    assert.deepEqual(await readFile(path.join(archivedRoot, "kit-manifest.json")), staleManifest);
    const retried = await scaffoldNaturalTraceCaptureKit({
      projectRoot: item.root,
      specFile: item.specRelative,
      runtime: item.runtime,
      refreshUnsignedTemplate: true,
    });
    assert.equal(retried.archiveReused, true);
    assert.equal(retried.status, "refreshed-unsigned-template-only");
    assert.deepEqual(await readFile(path.join(archivedRoot, "kit-manifest.json")), staleManifest);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("unsigned-template refresh refuses a tampered reusable stale archive", async () => {
  const item = await createFixture();
  try {
    const {kitRoot, staleManifest} = await scaffoldThenAdvanceIndex(item);
    let archiveRecord;
    await assert.rejects(
      () => scaffoldNaturalTraceCaptureKit({
        projectRoot: item.root,
        specFile: item.specRelative,
        runtime: item.runtime,
        refreshUnsignedTemplate: true,
        transactionHooks: {
          afterArchive: async ({archiveRecord: candidate}) => { archiveRecord = candidate; },
          afterDisplace: async () => { throw new Error("retain stale active kit"); },
        },
      }),
      /retain stale active kit/,
    );
    await rm(archiveRecord);
    await writeFile(archiveRecord, "{}\n", {mode: 0o444});
    await assert.rejects(
      () => scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime, refreshUnsignedTemplate: true}),
      /archive record differs/,
    );
    assert.deepEqual(await readFile(path.join(kitRoot, "kit-manifest.json")), staleManifest);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});

test("unsigned-template refresh refuses a missing or tampered reusable integrity sidecar", async (t) => {
  for (const variant of ["missing", "tampered"]) await t.test(variant, async () => {
    const item = await createFixture();
    try {
      const {kitRoot, staleManifest} = await scaffoldThenAdvanceIndex(item);
      let archiveIntegrity;
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({
          projectRoot: item.root,
          specFile: item.specRelative,
          runtime: item.runtime,
          refreshUnsignedTemplate: true,
          transactionHooks: {
            afterArchive: async ({archiveRecord}) => {
              archiveIntegrity = path.join(path.dirname(archiveRecord), NATURAL_TRACE_ARCHIVE_INTEGRITY_FILE);
            },
            afterDisplace: async () => { throw new Error("retain stale active kit for sidecar test"); },
          },
        }),
        /retain stale active kit for sidecar test/,
      );
      await rm(archiveIntegrity);
      if (variant === "tampered") await writeFile(archiveIntegrity, "{}\n", {mode: 0o444});
      await assert.rejects(
        () => scaffoldNaturalTraceCaptureKit({projectRoot: item.root, specFile: item.specRelative, runtime: item.runtime, refreshUnsignedTemplate: true}),
        variant === "missing" ? /extra, missing, or symbolic-link entries/ : /integrity sidecar differs/,
      );
      assert.deepEqual(await readFile(path.join(kitRoot, "kit-manifest.json")), staleManifest);
    } finally {
      await rm(item.root, {recursive: true, force: true});
    }
  });
});

test("rollback conflict preserves both concurrent active bytes and the displaced stale backup", async () => {
  const item = await createFixture();
  try {
    const {kitRoot, staleManifest} = await scaffoldThenAdvanceIndex(item);
    await assert.rejects(
      () => scaffoldNaturalTraceCaptureKit({
        projectRoot: item.root,
        specFile: item.specRelative,
        runtime: item.runtime,
        refreshUnsignedTemplate: true,
        transactionHooks: {
          afterDisplace: async () => {
            await mkdir(kitRoot, {recursive: false});
            await writeFile(path.join(kitRoot, "concurrent-owner.txt"), "foreign concurrent active bytes\n");
            throw new Error("injected concurrent active-path conflict");
          },
        },
      }),
      /rollback could not safely restore.*preserved recovery transaction/s,
    );
    assert.equal(await readFile(path.join(kitRoot, "concurrent-owner.txt"), "utf8"), "foreign concurrent active bytes\n");
    const transactionParent = path.join(item.root, DEFAULT_NATURAL_TRACE_KIT_ROOT, ".refresh-transactions");
    const transactions = (await readdir(transactionParent)).filter((name) => name.startsWith(`${item.animationId}--${item.safeId}--`));
    assert.equal(transactions.length, 1);
    const displacedManifest = path.join(transactionParent, transactions[0], "displaced-stale-kit", "kit-manifest.json");
    assert.deepEqual(await readFile(displacedManifest), staleManifest);
  } finally {
    await rm(item.root, {recursive: true, force: true});
  }
});
