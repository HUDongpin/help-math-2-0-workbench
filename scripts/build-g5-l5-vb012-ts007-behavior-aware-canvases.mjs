#!/usr/bin/env node

import {mkdir, readFile, rename, writeFile} from "node:fs/promises";
import path from "node:path";
import {gunzipSync} from "node:zlib";
import {fileURLToPath} from "node:url";

import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";
import {
  deriveTs007BehaviorIr,
  deriveVb012BehaviorIr,
  expandTs007BehaviorComposite,
  expandVb012BehaviorComposite,
  sha256,
  stableJson,
} from "./lib/g5-l5-representative-behavior-composites.mjs";
import {
  currentJsCandidateEvidencePath,
  separatedCurrentJsCandidateStoragePath,
} from "./current-js-candidate-paths.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
const PARSER_PATH = "scripts/lib/g5-l5-representative-behavior-composites.mjs";
const SHARED_ADAPTER_PATH = "scripts/build-safe-ffdec-canvas-adapter.mjs";

export const PAGE_CONFIGS = Object.freeze([
  Object.freeze({
    key: "vb012",
    animationId: "course-g05-l05-vb-012",
    ordinal: 15,
    sourceSwf:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L5/VB/L5VB12.swf",
    sourceSwfSha256:
      "9530d6f3adb0ed6a3c8fbb5ba22c8084e2f8a20b45a735381574eb78e714abd0",
    migration: "migrations/course-g05-l05-vb-012/migration.json",
    migrationSha256:
      "c1be677235aca21e9fb497bc01017bf6862e7d6b67b8b9c6f546a573f3568605",
    scriptInventory:
      "migrations/course-g05-l05-vb-012/audit/script-inventory.json",
    scriptInventorySha256:
      "d6a7301f6dce15149b0709c21a568724ef03468f52949f6547ac265f1970483a",
    scriptBundle:
      "migrations/course-g05-l05-vb-012/audit/machine/ffdec-scripts.txt.gz",
    scriptBundleSha256:
      "c54be1f355130f407d88a88bc29c7537a4e6daaa9b52f1696ca23cae4e6d7f48",
    swfmill: "migrations/course-g05-l05-vb-012/audit/machine/swfmill.xml.gz",
    swfmillSha256:
      "4190fc0116c6987bfeee6f482bd4de22fcfe9aa1f8b80f0f0903304c78398171",
    scenarioInventory:
      "migrations/course-g05-l05-vb-012/audit/scenario-inventory.json",
    scenarioInventorySha256:
      "3122474757c15cb202b0d69c5ed1f0a5c8a18484b1bea2162ad821380cca812b",
    audioEvidence:
      "migrations/course-g05-l05-vb-012/audit/audio-runtime-evidence.json",
    audioEvidenceSha256:
      "8cc0adc463add859d6cf87e056cd5e6d500f19fe0f2ccd8307d65883d2ee0153",
    rawRoot:
      "work/g5-l5-ffdec-canvas-pcode-factory/full-v2/members/" +
      "course-g05-l05-vb-012/canvas/sprites/DefineSprite_234",
    rawHelperSha256:
      "78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93",
    rawFramesSha256:
      "1bb869a8652fdf41b1e9d535b777690e9ce0a13ed4aabd54b88e309e255e6ac6",
    targetSpriteObjectId: 234,
    targetSpriteFrameCount: 196,
    expectedPlacedFunctionCount: 201,
    expectedPlacedFunctionsSha256:
      "7dd83f4a193bfe86d2f9d17ddec2d8a916499a8bcc7f46a8829eb22904bbd2a9",
    expectedFontFunctionCount: 12,
    expectedFontFunctionsSha256:
      "1b2293722d91342ade652a03ead7f061c8c9eb270c50905049035afcbd9d1f7b",
    embeddedImageVariableCount: 14,
    embeddedImageVariablesSha256:
      "aca9365320a8fc62fb4c8d2f2b99b54d175c21b92421629b2a7c6a6efd9bf830",
    exportCanvas: {width: 1433, height: 561},
    exportInternalTranslation: {x: 847.3, y: 341.35},
    rootPlacement: {
      depth: 3,
      twips: {x: 8248, y: 5666},
      pixels: {x: 412.4, y: 283.3},
    },
    stageRenderOffset: {x: -434.9, y: -58.05000000000001},
    derive: deriveVb012BehaviorIr,
    expand: expandVb012BehaviorComposite,
    title: "Opposites source behavior-aware child timeline",
    behaviorDescription:
      "fixed choice, source-hidden click-through, two-attempt timer consequence, and terminal frame",
  }),
  Object.freeze({
    key: "ts007",
    animationId: "course-g05-l05-ts-007",
    ordinal: 52,
    sourceSwf:
      "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L5/TS/L5TS07.swf",
    sourceSwfSha256:
      "e034c05612a1ff93223b4d3071f56b41204518b0cf9d7a4b436323e79b18a588",
    migration: "migrations/course-g05-l05-ts-007/migration.json",
    migrationSha256:
      "fe741acb9ec022c2e0889decb7e9a70500f62d8a6461277b484773db5516162d",
    scriptInventory:
      "migrations/course-g05-l05-ts-007/audit/script-inventory.json",
    scriptInventorySha256:
      "5a6a2a9e66293bd439bbeae6c81aef46ddddca368f0772446c9194811bd74fd4",
    scriptBundle:
      "migrations/course-g05-l05-ts-007/audit/machine/ffdec-scripts.txt.gz",
    scriptBundleSha256:
      "4f2a00bfcb0b9a06f3c765445d24e86be7dedab28a040056fe59bb2449b8c64d",
    swfmill: "migrations/course-g05-l05-ts-007/audit/machine/swfmill.xml.gz",
    swfmillSha256:
      "4ab76508528707b32bad26c6611f348cf1e4d4806b4a6ee953939902efcb6df0",
    scenarioInventory:
      "migrations/course-g05-l05-ts-007/audit/scenario-inventory.json",
    scenarioInventorySha256:
      "4c9a4d34aee8ec55e816166b48b01ff949b1f336a8e90fe49d5b17f576d83cd2",
    audioEvidence:
      "migrations/course-g05-l05-ts-007/audit/audio-runtime-evidence.json",
    audioEvidenceSha256:
      "afb6d78c74c101b2bacf7a2c8df198ff32a7c00b6609eff26abfdf78ac5b5878",
    rawRoot:
      "work/g5-l5-ffdec-canvas-pcode-factory/full-v2/members/" +
      "course-g05-l05-ts-007/canvas/sprites/DefineSprite_439",
    rawHelperSha256:
      "78256220d01fba044341283703c3923a1ff8ff29499c51f65ab4e6ac825ccb93",
    rawFramesSha256:
      "7299d3e6a8be99e462e4dddd2f16d57f9180864a0f25902a12ebd98b3bf09e00",
    targetSpriteObjectId: 439,
    targetSpriteFrameCount: 690,
    expectedPlacedFunctionCount: 410,
    expectedPlacedFunctionsSha256:
      "04f86a757e2887625906100233aaca0c641c237b7920476b0c02e2a2451dbe49",
    expectedFontFunctionCount: 12,
    expectedFontFunctionsSha256:
      "faf63c663442ed72f70f8ed395d03762410e06234ed35cb39e3da3a21398d9e4",
    embeddedImageVariableCount: 2,
    embeddedImageVariablesSha256:
      "379923a6b52c3c0f4df61d37ca7930c5f6217bdcaf9cd9deef0a2f81fa1e6799",
    exportCanvas: {width: 1757, height: 1239},
    exportInternalTranslation: {x: 963.4, y: 651},
    rootPlacement: {
      depth: 1,
      twips: {x: 8247, y: 5658},
      pixels: {x: 412.35, y: 282.9},
    },
    stageRenderOffset: {x: -551.05, y: -368.1},
    derive: deriveTs007BehaviorIr,
    expand: expandTs007BehaviorComposite,
    title: "Question 1 source behavior-aware child timeline",
    behaviorDescription:
      "five source stops, two explanation boxes, help popup, fixed choice, and terminal frame",
  }),
]);

function invariant(animationId, condition, message) {
  if (!condition) throw new Error(`${animationId}: ${message}`);
}

function absolute(relativePath) {
  invariant("builder", typeof relativePath === "string" && !path.isAbsolute(relativePath),
    `invalid project-relative path: ${relativePath}`);
  const value = path.resolve(ROOT, relativePath);
  invariant("builder", value.startsWith(`${ROOT}${path.sep}`),
    `path escapes project: ${relativePath}`);
  return value;
}

async function boundFile(animationId, relativePath, expectedHash = null) {
  const bytes = await readFile(absolute(relativePath));
  const digest = sha256(bytes);
  if (expectedHash !== null) {
    invariant(animationId, digest === expectedHash,
      `${relativePath} SHA-256 changed (${digest}, expected ${expectedHash})`);
  }
  return Object.freeze({
    bytes,
    text: bytes.toString("utf8"),
    descriptor: Object.freeze({path: relativePath, bytes: bytes.length, sha256: digest}),
  });
}

async function writeAtomic(animationId, relativePath, bytes) {
  const destination = absolute(relativePath);
  await mkdir(path.dirname(destination), {recursive: true});
  const temporary = `${destination}.tmp-${process.pid}`;
  await writeFile(temporary, bytes, {flag: "wx"});
  try {
    await rename(temporary, destination);
  } catch (error) {
    throw new Error(`${animationId}: failed to publish ${relativePath}: ${error.message}`);
  }
}

async function compare(animationId, relativePath, expectedBytes) {
  let observed;
  try {
    observed = await readFile(absolute(relativePath));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`${animationId}: generated file is missing: ${relativePath}`);
    }
    throw error;
  }
  invariant(animationId, observed.equals(expectedBytes),
    `generated file is stale: ${relativePath}`);
}

function pagePaths(config) {
  const outputRoot = `apps/web/public/flash-assets/courses/${config.animationId}`;
  return Object.freeze({
    rawHelper: `${config.rawRoot}/canvas.js`,
    rawFrames: `${config.rawRoot}/frames.html`,
    ir: `migrations/${config.animationId}/audit/behavior-composite-ir.json`,
    outputRoot,
    spec: `${outputRoot}/adapter-spec.json`,
    runtime: `${outputRoot}/canvas-renderer.js`,
    manifest: `${outputRoot}/manifest.json`,
  });
}

export async function buildPageArtifacts(config) {
  const id = config.animationId;
  const paths = pagePaths(config);
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
    parserFile,
    generatorFile,
    sharedAdapter,
  ] = await Promise.all([
    boundFile(id, config.sourceSwf, config.sourceSwfSha256),
    boundFile(id, config.migration, config.migrationSha256),
    boundFile(id, config.scriptInventory, config.scriptInventorySha256),
    boundFile(id, config.scriptBundle, config.scriptBundleSha256),
    boundFile(id, config.swfmill, config.swfmillSha256),
    boundFile(id, config.scenarioInventory, config.scenarioInventorySha256),
    boundFile(id, config.audioEvidence, config.audioEvidenceSha256),
    boundFile(id, paths.rawHelper, config.rawHelperSha256),
    boundFile(id, paths.rawFrames, config.rawFramesSha256),
    boundFile(id, PARSER_PATH),
    boundFile(id, "scripts/build-g5-l5-vb012-ts007-behavior-aware-canvases.mjs"),
    boundFile(id, SHARED_ADAPTER_PATH),
  ]);
  const migration = JSON.parse(migrationFile.text);
  invariant(id, migration.animationId === id, "migration identity changed");
  invariant(id, migration.source?.swf === config.sourceSwf,
    "migration source path changed");
  invariant(id, migration.source?.swfSha256 === config.sourceSwfSha256,
    "migration source hash changed");
  invariant(id,
    migration.runtime?.stage?.width === 800 &&
      migration.runtime?.stage?.height === 600 &&
      migration.runtime?.fps === 12,
    "migration stage or FPS changed",
  );
  const scriptInventory = JSON.parse(scriptInventoryFile.text);
  invariant(id, scriptInventory.animationId === id,
    "script inventory identity changed");
  const bindings = Object.freeze({
    sourceSwf: sourceSwf.descriptor,
    migration: migrationFile.descriptor,
    scriptInventory: scriptInventoryFile.descriptor,
    ffdecScriptsGzip: scriptBundleFile.descriptor,
    swfmillXmlGzip: swfmillFile.descriptor,
    scenarioInventory: scenarioInventory.descriptor,
    audioRuntimeEvidence: audioEvidence.descriptor,
    ffdecCanvasHelper: rawHelper.descriptor,
    ffdecFramesHtml: rawFrames.descriptor,
    parserImplementation: parserFile.descriptor,
  });
  const swfmillXml = gunzipSync(swfmillFile.bytes).toString("utf8");
  const ir = config.derive({
    scriptBundleText: gunzipSync(scriptBundleFile.bytes).toString("utf8"),
    scriptInventory,
    swfmillXml,
    bindings,
  });
  const behaviorComposite = config.expand(ir, rawFrames.text, swfmillXml);
  const spec = Object.freeze({
    schemaVersion: 1,
    animationId: id,
    classification: "private-page-only-current-js-engineering",
    title: config.title,
    source: {
      swf: config.sourceSwf,
      swfBytes: sourceSwf.bytes.length,
      swfSha256: sourceSwf.descriptor.sha256,
    },
    evidence: {
      scenarioInventory: config.scenarioInventory,
      scenarioInventorySha256: scenarioInventory.descriptor.sha256,
      audioAudit: config.audioEvidence,
      audioAuditSha256: audioEvidence.descriptor.sha256,
      behaviorCompositeIr: paths.ir,
      behaviorCompositeIrFingerprintSha256: ir.artifactFingerprintSha256,
    },
    ffdecExport: {
      tool: "JPEXS Free Flash Decompiler 26.2.1 Canvas export, factory hash-bound",
      helper: paths.rawHelper,
      helperSha256: rawHelper.descriptor.sha256,
      helperBytes: rawHelper.bytes.length,
      framesHtml: paths.rawFrames,
      framesHtmlSha256: rawFrames.descriptor.sha256,
      framesHtmlBytes: rawFrames.bytes.length,
      targetSpriteObjectId: config.targetSpriteObjectId,
      targetSpriteFunction: `sprite${config.targetSpriteObjectId}`,
      exportCanvas: config.exportCanvas,
      exportInternalTranslation: config.exportInternalTranslation,
      expectedPlacedFunctionCount: config.expectedPlacedFunctionCount,
      expectedPlacedFunctionsSha256: config.expectedPlacedFunctionsSha256,
      expectedFontFunctionCount: config.expectedFontFunctionCount,
      expectedFontFunctionsSha256: config.expectedFontFunctionsSha256,
      embeddedImageVariableCount: config.embeddedImageVariableCount,
      embeddedImageVariablesSha256: config.embeddedImageVariablesSha256,
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
        placementDepth: config.rootPlacement.depth,
        placementTwips: config.rootPlacement.twips,
        placementPixels: config.rootPlacement.pixels,
      },
      local: {
        timelineId: `sprite-${config.targetSpriteObjectId}`,
        frameCount: config.targetSpriteFrameCount,
        livePlaybackEndFrame: config.targetSpriteFrameCount,
        trailingEmptyFrameCount: 0,
        playbackMode: "state-explorer",
        publicFrameIndexing: "one-indexed",
      },
      stageRenderOffset: config.stageRenderOffset,
    },
    runtimeContract: {
      kind: "structural-local-frame",
      scenarios: ["source-static-frame"],
      defaultScenario: "source-static-frame",
      supportedLanguages: ["en"],
      seedMapping: "no-randomness-injected-into-source-order-rendering",
      blockedLocalFrameRanges: [],
      unresolved: [
        "The generated composite applies only the explicitly parsed source visibility and child-frame consequences; it never executes AVM1 or the source SWF.",
        "Source feedback animation selection remains disabled and the typed modern My Lesson companion owns the bounded feedback state.",
        "Spanish source visuals remain fail-closed; bilingual product chrome does not establish Spanish Flash visual or audio fidelity.",
        "Audio, original-runtime parity, full-frame fidelity, human review, Owner acceptance, strict completion, release, and publication remain independent closed gates.",
      ],
      prebindingTargetFrameDomainDisposition:
        `${config.behaviorDescription} require an exact behavior-composite state`,
      currentCanonicalFrameDomainDispositionAsserted: false,
      sourceBehaviorComposite: behaviorComposite,
    },
    output: {
      script: paths.runtime,
      manifest: paths.manifest,
      spec: paths.spec,
      globalRegistry: "HELP_MATH_CANVAS_ASSETS",
    },
    successor: {
      rootPlacementMatrix: {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        tx: config.rootPlacement.pixels.x,
        ty: config.rootPlacement.pixels.y,
      },
      stageRenderMatrix: {
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: config.stageRenderOffset.x,
        f: config.stageRenderOffset.y,
      },
      transformDerivation:
        "source-root-matrix multiplied by inverse FFDec target internal translation",
      behaviorDisposition:
        "source-script assignment IR is required; unknown contract, state, frame, or drawing function fails closed",
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
    artifactType: "g5-l5-representative-behavior-aware-canvas-candidate-v1",
    animationId: id,
    releaseId: RELEASE_ID,
    ordinal: config.ordinal,
    sourceSwf: sourceSwf.descriptor,
    behaviorCompositeIr: {
      path: paths.ir,
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
      targetSpriteObjectId: config.targetSpriteObjectId,
      targetSpriteFrameCount: config.targetSpriteFrameCount,
      placedFunctionCount: placedFunctions.length,
      embeddedImageVariableCount: imageVariables.length,
    },
    generator: generatorFile.descriptor,
    parser: parserFile.descriptor,
    sharedAdapterGenerator: sharedAdapter.descriptor,
    adapterSpec: {path: paths.spec, bytes: specBytes.length, sha256: sha256(specBytes)},
    runtime: {
      path: paths.runtime,
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
      calibratedPageCount: 1,
      otherG5L5PagesStartedByThisTransaction: 0,
    },
    acceptanceEffects: ir.acceptanceEffects,
  });
  const manifestBytes = Buffer.from(stableJson(manifest));
  return Object.freeze({
    config,
    ir,
    behaviorComposite,
    paths,
    artifacts: Object.freeze([
      Object.freeze({path: paths.ir, bytes: irBytes}),
      Object.freeze({path: paths.spec, bytes: specBytes}),
      Object.freeze({path: paths.runtime, bytes: runtimeBytes}),
      Object.freeze({path: paths.manifest, bytes: manifestBytes}),
    ]),
    summary: Object.freeze({
      animationId: id,
      irFingerprintSha256: ir.artifactFingerprintSha256,
      contractId: behaviorComposite.contractId,
      stateCount: behaviorComposite.states.length,
      dynamicTextFieldCount: Object.keys(behaviorComposite.dynamicTextFields).length,
      runtimeSha256: sha256(runtimeBytes),
      manifestSha256: sha256(manifestBytes),
    }),
  });
}

export async function run({write = false, only = null} = {}) {
  const selected = only === null
    ? PAGE_CONFIGS
    : PAGE_CONFIGS.filter(({key}) => key === only);
  invariant("builder", selected.length > 0,
    `unknown page selector: ${only}`);
  const builtPages = [];
  for (const config of selected) {
    const built = await buildPageArtifacts(config);
    for (const artifact of built.artifacts) {
      const storagePath = artifact.path === pagePaths(config).manifest
        ? currentJsCandidateEvidencePath(
            config.animationId,
            'manifest.json',
            'v2',
          )
        : artifact.path.startsWith('apps/web/public/flash-assets/courses/')
          ? separatedCurrentJsCandidateStoragePath(artifact.path)
          : artifact.path;
      if (write) {
        await writeAtomic(config.animationId, storagePath, artifact.bytes);
      } else {
        await compare(config.animationId, storagePath, artifact.bytes);
      }
    }
    builtPages.push(built.summary);
  }
  return Object.freeze({
    mode: write ? "write" : "check",
    calibratedPageCount: builtPages.length,
    otherG5L5PagesStarted: 0,
    pages: Object.freeze(builtPages),
  });
}

function parseArguments(argv) {
  let write = false;
  let only = null;
  for (const argument of argv) {
    if (argument === "--check") write = false;
    else if (argument === "--write") write = true;
    else if (argument.startsWith("--only=")) only = argument.slice("--only=".length);
    else {
      throw new Error(
        "usage: node scripts/build-g5-l5-vb012-ts007-behavior-aware-canvases.mjs " +
        "[--check|--write] [--only=vb012|--only=ts007]",
      );
    }
  }
  return {write, only};
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const summary = await run(parseArguments(process.argv.slice(2)));
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}
