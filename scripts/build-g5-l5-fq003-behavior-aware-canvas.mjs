#!/usr/bin/env node

import {readFile, mkdir, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {gunzipSync} from "node:zlib";
import {fileURLToPath} from "node:url";

import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";
import {
  deriveFq003BehaviorIr,
  expandFq003BehaviorComposite,
  sha256,
  stableJson,
} from "./lib/g5-l5-fq003-behavior-composite.mjs";
import {
  currentJsCandidateEvidencePath,
  separatedCurrentJsCandidateStoragePath,
} from "./current-js-candidate-paths.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const ANIMATION_ID = "course-g05-l05-fq-003";
const RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
const SOURCE_SWF =
  "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L5/FQ/L5FQ03.swf";
const MIGRATION = `migrations/${ANIMATION_ID}/migration.json`;
const SCRIPT_INVENTORY = `migrations/${ANIMATION_ID}/audit/script-inventory.json`;
const SCRIPT_BUNDLE =
  `migrations/${ANIMATION_ID}/audit/machine/ffdec-scripts.txt.gz`;
const SWFMILL = `migrations/${ANIMATION_ID}/audit/machine/swfmill.xml.gz`;
const SCENARIO_INVENTORY = `migrations/${ANIMATION_ID}/audit/scenario-inventory.json`;
const AUDIO_EVIDENCE = `migrations/${ANIMATION_ID}/audit/audio-runtime-evidence.json`;
const RAW_ROOT =
  `work/g5-l5-ffdec-canvas-pcode-factory/full-v2/members/${ANIMATION_ID}` +
  "/canvas/sprites/DefineSprite_830";
const RAW_HELPER = `${RAW_ROOT}/canvas.js`;
const RAW_FRAMES = `${RAW_ROOT}/frames.html`;
const IR_PATH = `migrations/${ANIMATION_ID}/audit/behavior-composite-ir.json`;
const OUTPUT_ROOT = `apps/web/public/flash-assets/courses/${ANIMATION_ID}`;
const SPEC_PATH = `${OUTPUT_ROOT}/adapter-spec.json`;
const RUNTIME_PATH = `${OUTPUT_ROOT}/canvas-renderer.js`;
const MANIFEST_PATH = `${OUTPUT_ROOT}/manifest.json`;

const EXPECTED = Object.freeze({
  sourceSwfSha256:
    "43c27a0b81662befa75d09fe042c0379090acee274839316d614c8d66ab0d7d2",
  rawHelperSha256:
    "78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93",
  rawFramesSha256:
    "cd8e90a200cbd76fe77752a7b4b5b2c9759247f03d1d6554826e529e885b26f7",
  scriptBundleSha256:
    "55d639d251df5b8f3be222944a644e98bda1d886ccfc0baddd205005ba27f178",
  swfmillSha256:
    "b36bbaf0efe59108413a19007eb73abac0141ef4522e110c69c268f935844bcf",
  targetSpriteObjectId: 830,
  targetSpriteFrameCount: 72,
  expectedPlacedFunctionCount: 809,
  expectedPlacedFunctionsSha256:
    "f0435f8287d82a699093755be185ffc091ef9477cc1dba5e6352843acc346f5c",
  expectedFontFunctionCount: 6,
  expectedFontFunctionsSha256:
    "0786dfd57acf56b52b595e8aa3fbca7443a44a8c4fcbd69bf27fb1ae4b90aa32",
  embeddedImageVariableCount: 1,
  embeddedImageVariablesSha256:
    "7cdb8fda64bf0c00f66a1fb92030e588962eb55355fd72fff5bf3be891b72397",
});

function invariant(condition, message) {
  if (!condition) throw new Error(`${ANIMATION_ID}: ${message}`);
}

function absolute(relativePath) {
  invariant(typeof relativePath === "string" && !path.isAbsolute(relativePath),
    `invalid project-relative path: ${relativePath}`);
  const value = path.resolve(ROOT, relativePath);
  invariant(value.startsWith(`${ROOT}${path.sep}`), `path escapes project: ${relativePath}`);
  return value;
}

async function boundFile(relativePath, expectedHash = null) {
  const bytes = await readFile(absolute(relativePath));
  const digest = sha256(bytes);
  if (expectedHash !== null) {
    invariant(digest === expectedHash,
      `${relativePath} SHA-256 changed (${digest}, expected ${expectedHash})`);
  }
  return Object.freeze({
    bytes,
    text: bytes.toString("utf8"),
    descriptor: Object.freeze({path: relativePath, bytes: bytes.length, sha256: digest}),
  });
}

async function writeAtomic(relativePath, bytes) {
  const destination = absolute(relativePath);
  await mkdir(path.dirname(destination), {recursive: true});
  const temporary = `${destination}.tmp-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  await rename(temporary, destination);
}

async function compare(relativePath, expectedBytes) {
  let observed;
  try {
    observed = await readFile(absolute(relativePath));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`${ANIMATION_ID}: generated file is missing: ${relativePath}`);
    }
    throw error;
  }
  invariant(observed.equals(expectedBytes), `generated file is stale: ${relativePath}`);
}

async function buildArtifacts() {
  const [
    sourceSwf,
    migrationFile,
    scriptInventoryFile,
    scriptBundleFile,
    swfmillFile,
    scenarioInventory,
    audioEvidence,
    rawHelper,
    rawFrames,
    generatorFile,
  ] = await Promise.all([
    boundFile(SOURCE_SWF, EXPECTED.sourceSwfSha256),
    boundFile(MIGRATION),
    boundFile(SCRIPT_INVENTORY),
    boundFile(SCRIPT_BUNDLE, EXPECTED.scriptBundleSha256),
    boundFile(SWFMILL, EXPECTED.swfmillSha256),
    boundFile(SCENARIO_INVENTORY),
    boundFile(AUDIO_EVIDENCE),
    boundFile(RAW_HELPER, EXPECTED.rawHelperSha256),
    boundFile(RAW_FRAMES, EXPECTED.rawFramesSha256),
    boundFile("scripts/build-g5-l5-fq003-behavior-aware-canvas.mjs"),
  ]);
  const migration = JSON.parse(migrationFile.text);
  invariant(migration.animationId === ANIMATION_ID, "migration identity changed");
  invariant(migration.source?.swf === SOURCE_SWF, "migration source path changed");
  invariant(migration.source?.swfSha256 === EXPECTED.sourceSwfSha256,
    "migration source hash changed");
  invariant(migration.runtime?.stage?.width === 800 &&
    migration.runtime?.stage?.height === 600 && migration.runtime?.fps === 12,
  "migration stage or FPS changed");
  const scriptInventory = JSON.parse(scriptInventoryFile.text);
  invariant(scriptInventory.animationId === ANIMATION_ID,
    "script inventory identity changed");

  const bindings = Object.freeze({
    sourceSwf: sourceSwf.descriptor,
    migration: migrationFile.descriptor,
    scriptInventory: scriptInventoryFile.descriptor,
    ffdecScriptsGzip: scriptBundleFile.descriptor,
    swfmillXmlGzip: swfmillFile.descriptor,
    ffdecCanvasHelper: rawHelper.descriptor,
    ffdecFramesHtml: rawFrames.descriptor,
  });
  const ir = deriveFq003BehaviorIr({
    scriptBundleText: gunzipSync(scriptBundleFile.bytes).toString("utf8"),
    scriptInventory,
    swfmillXml: gunzipSync(swfmillFile.bytes).toString("utf8"),
    bindings,
  });
  const behaviorComposite = expandFq003BehaviorComposite(ir, rawFrames.text);
  const spec = Object.freeze({
    schemaVersion: 1,
    animationId: ANIMATION_ID,
    classification: "private-page-only-current-js-engineering",
    title: `${ANIMATION_ID} source behavior-aware child timeline`,
    source: {
      swf: SOURCE_SWF,
      swfBytes: sourceSwf.bytes.length,
      swfSha256: sourceSwf.descriptor.sha256,
    },
    evidence: {
      scenarioInventory: SCENARIO_INVENTORY,
      scenarioInventorySha256: scenarioInventory.descriptor.sha256,
      audioAudit: AUDIO_EVIDENCE,
      audioAuditSha256: audioEvidence.descriptor.sha256,
      behaviorCompositeIr: IR_PATH,
      behaviorCompositeIrFingerprintSha256: ir.artifactFingerprintSha256,
    },
    ffdecExport: {
      tool: "JPEXS Free Flash Decompiler 26.2.1 Canvas export, factory hash-bound",
      helper: RAW_HELPER,
      helperSha256: rawHelper.descriptor.sha256,
      helperBytes: rawHelper.bytes.length,
      framesHtml: RAW_FRAMES,
      framesHtmlSha256: rawFrames.descriptor.sha256,
      framesHtmlBytes: rawFrames.bytes.length,
      targetSpriteObjectId: EXPECTED.targetSpriteObjectId,
      targetSpriteFunction: "sprite830",
      exportCanvas: {width: 1718, height: 567},
      exportInternalTranslation: {x: 1080.3, y: 287.5},
      expectedPlacedFunctionCount: EXPECTED.expectedPlacedFunctionCount,
      expectedPlacedFunctionsSha256: EXPECTED.expectedPlacedFunctionsSha256,
      expectedFontFunctionCount: EXPECTED.expectedFontFunctionCount,
      expectedFontFunctionsSha256: EXPECTED.expectedFontFunctionsSha256,
      embeddedImageVariableCount: EXPECTED.embeddedImageVariableCount,
      embeddedImageVariablesSha256: EXPECTED.embeddedImageVariablesSha256,
    },
    timeline: {
      fps: 12,
      stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
      root: {
        frameCount: 10,
        preloaderStopFrame: 1,
        beginFrame: 6,
        beginLabel: "begin",
        placementName: "animation",
        placementDepth: 3,
        placementTwips: {x: 7350, y: 4322},
        placementPixels: {x: 367.5, y: 216.1},
      },
      local: {
        timelineId: "sprite-830",
        frameCount: 72,
        livePlaybackEndFrame: 71,
        trailingEmptyFrameCount: 1,
        playbackMode: "state-explorer",
        publicFrameIndexing: "one-indexed",
      },
      stageRenderOffset: {x: -712.8, y: -71.4},
    },
    runtimeContract: {
      kind: "structural-local-frame",
      scenarios: ["source-static-frame"],
      defaultScenario: "source-static-frame",
      supportedLanguages: ["en"],
      seedMapping: "no-randomness-injected-into-source-order-final-quiz-rendering",
      blockedLocalFrameRanges: [],
      unresolved: [
        "The generated composite applies only source-parsed visibility, goto, enabled-state consequences, dynamic text, and review colors; it never executes AVM1 or the source SWF.",
        "The source Mc_Result clip is not placed on sprite 830, so the terminal surface deliberately reuses source Mc_Finish without claiming exact result-overlay fidelity.",
        "Audio, original-runtime parity, full-frame fidelity, human review, Owner acceptance, strict completion, release, and publication remain independent closed gates.",
      ],
      prebindingTargetFrameDomainDisposition:
        "source-labeled question/result/review families require an exact behavior-composite state",
      currentCanonicalFrameDomainDispositionAsserted: false,
      sourceBehaviorComposite: behaviorComposite,
    },
    output: {
      script: RUNTIME_PATH,
      manifest: MANIFEST_PATH,
      spec: SPEC_PATH,
      globalRegistry: "HELP_MATH_CANVAS_ASSETS",
    },
    successor: {
      rootPlacementMatrix: {a: 1, b: 0, c: 0, d: 1, tx: 367.5, ty: 216.1},
      stageRenderMatrix: {a: 1, b: 0, c: 0, d: 1, e: -712.8, f: -71.4},
      transformDerivation:
        "source-root-matrix multiplied by inverse FFDec target internal translation",
      behaviorDisposition:
        "source-script assignment IR is required; unknown contract, state, frame, text, glyph, or drawing function fails closed",
    },
    strictAcceptanceEffect: "none",
  });
  const specBytes = Buffer.from(stableJson(spec));
  const {runtime, metadata, placedFunctions, imageVariables} = buildSafeRuntime({
    helperSource: rawHelper.text,
    framesHtml: rawFrames.text,
    spec,
    scale: 1,
  });
  const runtimeBytes = Buffer.from(runtime);
  const irBytes = Buffer.from(stableJson(ir));
  const manifest = Object.freeze({
    schemaVersion: 1,
    artifactType: "g5-l5-fq003-behavior-aware-canvas-candidate-v1",
    animationId: ANIMATION_ID,
    releaseId: RELEASE_ID,
    ordinal: 56,
    sourceSwf: sourceSwf.descriptor,
    behaviorCompositeIr: {
      path: IR_PATH,
      bytes: irBytes.length,
      sha256: sha256(irBytes),
      artifactFingerprintSha256: ir.artifactFingerprintSha256,
      contractId: behaviorComposite.contractId,
      generatedStateCount: behaviorComposite.states.length,
      generatedDynamicTextFieldCount:
        Object.keys(behaviorComposite.dynamicTextFields).length,
    },
    ffdec: {
      helper: rawHelper.descriptor,
      framesHtml: rawFrames.descriptor,
      targetSpriteObjectId: EXPECTED.targetSpriteObjectId,
      targetSpriteFrameCount: EXPECTED.targetSpriteFrameCount,
      placedFunctionCount: placedFunctions.length,
      embeddedImageVariableCount: imageVariables.length,
    },
    generator: generatorFile.descriptor,
    sharedAdapterGenerator: await boundFile(
      "scripts/build-safe-ffdec-canvas-adapter.mjs",
    ).then(({descriptor}) => descriptor),
    adapterSpec: {path: SPEC_PATH, bytes: specBytes.length, sha256: sha256(specBytes)},
    runtime: {
      path: RUNTIME_PATH,
      bytes: runtimeBytes.length,
      sha256: sha256(runtimeBytes),
      registry: spec.output.globalRegistry,
      metadata,
    },
    candidateScope: {
      currentJavaScriptRegistered: true,
      modernMyLessonIntegrated: true,
      sourceBehaviorCompositeRequired: true,
      legacyCourseShellExcluded: true,
      otherG5L5PagesStartedByThisTransaction: 0,
    },
    acceptanceEffects: ir.acceptanceEffects,
  });
  const manifestBytes = Buffer.from(stableJson(manifest));
  return Object.freeze({
    ir,
    behaviorComposite,
    artifacts: Object.freeze([
      Object.freeze({path: IR_PATH, bytes: irBytes}),
      Object.freeze({path: SPEC_PATH, bytes: specBytes}),
      Object.freeze({path: RUNTIME_PATH, bytes: runtimeBytes}),
      Object.freeze({path: MANIFEST_PATH, bytes: manifestBytes}),
    ]),
    summary: Object.freeze({
      irFingerprintSha256: ir.artifactFingerprintSha256,
      contractId: behaviorComposite.contractId,
      stateCount: behaviorComposite.states.length,
      dynamicTextFieldCount: Object.keys(behaviorComposite.dynamicTextFields).length,
      runtimeSha256: sha256(runtimeBytes),
      manifestSha256: sha256(manifestBytes),
    }),
  });
}

export async function run({write = false} = {}) {
  const built = await buildArtifacts();
  for (const artifact of built.artifacts) {
    const storagePath = artifact.path === MANIFEST_PATH
      ? currentJsCandidateEvidencePath(ANIMATION_ID, 'manifest.json', 'v2')
      : artifact.path.startsWith('apps/web/public/flash-assets/courses/')
        ? separatedCurrentJsCandidateStoragePath(artifact.path)
        : artifact.path;
    if (write) await writeAtomic(storagePath, artifact.bytes);
    else await compare(storagePath, artifact.bytes);
  }
  return built.summary;
}

function parseArguments(argv) {
  if (argv.length === 0 || (argv.length === 1 && argv[0] === "--check")) {
    return {write: false};
  }
  if (argv.length === 1 && argv[0] === "--write") return {write: true};
  throw new Error("usage: node scripts/build-g5-l5-fq003-behavior-aware-canvas.mjs [--check|--write]");
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const summary = await run(parseArguments(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}
