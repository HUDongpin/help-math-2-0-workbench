#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {Script} from "node:vm";
import {fileURLToPath} from "node:url";

import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";
import {
  privateCurrentJsCalibrationMatches,
  upsertPrivateCurrentJsCalibration,
} from "./private-current-js-registry.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATOR_PATH = "scripts/build-g4-l5-page-only-current-js.mjs";
const FACTORY_RUN_PATH =
  "work/g4-l5-ffdec-canvas-pcode-product-factory/extend-v2/run-manifest.json";
const CATALOG_PATH = "catalog/animations.json";
const COURSE_XML_PATH = "HELP_COURSES/ELMGR4/L5/index.xml";
const COURSE_XML_SHA256 =
  "f71151dd457a019e38bef4086927b2c0b3771101b5a5d2bed101d266a6567ce4";
const CALIBRATION_ID = "g4-l5-page-only-current-js-53-v1";
const FREEZE_PATH =
  `catalog/product-bridge-calibrations/${CALIBRATION_ID}.json`;
const REGISTRY_PATH = "packages/demos/private-current-js-registry.json";
const LOADER_PATH =
  "packages/demos/src/g4-l5-product-registry.generated.ts";
const DATA_PATH = "apps/web/lib/g4-l5-page-only-current-js.generated.ts";
const SOURCE_ROOT = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const ASSET_REGISTRY = "HELP_MATH_CANVAS_ASSETS";
const SHA256 = /^[a-f0-9]{64}$/;

const PRESERVED_PRODUCT_IDS = Object.freeze(new Set([
  "course-g04-l05-rw-002",
  "course-g04-l05-vb-008",
  "course-g04-l05-in-013",
  "course-g04-l05-ti-002",
  "course-g04-l05-gs-003",
  "course-g04-l05-fq-002",
]));

const ACCEPTANCE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  behaviorParityAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseEligible: false,
  published: false,
});

const BLOCKED_RUNTIME_PATTERNS = Object.freeze([
  ["network primitive", /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/],
  ["timer or animation loop", /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/],
  ["persistent storage", /\b(?:localStorage|sessionStorage|indexedDB)\b/],
  ["ambient event listener", /\b(?:addEventListener|removeEventListener)\s*\(/],
  ["dynamic evaluation", /\b(?:eval|Function)\s*\(/],
]);

function invariant(value, message) {
  if (!value) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function projectPath(relativePath) {
  invariant(typeof relativePath === "string" && relativePath.length > 0 &&
    !path.isAbsolute(relativePath), `invalid project path: ${relativePath}`);
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`),
    `path escapes worktree: ${relativePath}`);
  return absolute;
}

async function readBytes(relativePath) {
  return readFile(projectPath(relativePath));
}

async function readJson(relativePath) {
  return JSON.parse((await readBytes(relativePath)).toString("utf8"));
}

async function binding(relativePath) {
  const bytes = await readBytes(relativePath);
  return Object.freeze({path: relativePath, bytes: bytes.length,
    sha256: sha256(bytes)});
}

async function synchronize(relativePath, bytes, check) {
  const target = projectPath(relativePath);
  if (check) {
    const current = await readFile(target).catch(() => null);
    invariant(current?.equals(bytes), `${relativePath} is stale or absent`);
    return;
  }
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, bytes);
}

function parseArguments(argv) {
  invariant(argv.length <= 1 && [undefined, "--check"].includes(argv[0]),
    "usage: build-g4-l5-page-only-current-js.mjs [--check]");
  return Object.freeze({check: argv[0] === "--check"});
}

function attributes(source) {
  return Object.fromEntries([...source.matchAll(
    /([A-Za-z][A-Za-z0-9]*)="([^"]*)"/g,
  )].map((match) => [match[1], match[2]]));
}

function courseSequence(catalog) {
  const pages = [];
  for (const entry of catalog.animations ?? []) {
    const references = entry.references?.courseXml ?? [];
    for (const reference of references) {
      if (reference.sourceXmlPath !== COURSE_XML_PATH) continue;
      invariant(entry.flags?.shell === false && entry.flags?.variant === false &&
        entry.flags?.referenced === true &&
        entry.source?.path === reference.expectedPath,
      `${entry.animationId}: source eligibility drifted`);
      pages.push(Object.freeze({
        ordinal: reference.occurrence,
        animationId: entry.animationId,
        assetId: entry.assetId,
        source: Object.freeze({...entry.source}),
        pairedFla: entry.pairedFla ? Object.freeze({...entry.pairedFla}) : null,
        sectionCode: entry.classification.section.code,
        sectionTitleEnglish: entry.classification.section.titleEnglish,
        sectionTitleSpanish: entry.classification.section.titleSpanish,
        titleEnglish: entry.classification.titleEnglish ??
          entry.classification.titleDisplay,
        titleSpanish: entry.classification.titleSpanish ?? null,
      }));
    }
  }
  pages.sort((left, right) => left.ordinal - right.ordinal);
  invariant(pages.length === 53 && pages.every((page, index) =>
    page.ordinal === index + 1), "G4 L5 source order must remain 1..53");
  return Object.freeze(pages);
}

function parseRootTarget(xml, animationId) {
  const matches = [...xml.matchAll(
    /^      <PlaceObject2\b([^>]*\bname="(?:animation|Animation)"[^>]*)>([\s\S]*?)^      <\/PlaceObject2>/gm,
  )];
  invariant(matches.length === 1,
    `${animationId}: expected one direct named animation placement`);
  const placement = attributes(matches[0][1]);
  const transformMatch = matches[0][2].match(/<Transform([^>]*)\/>/);
  invariant(transformMatch, `${animationId}: animation transform is missing`);
  const transform = attributes(transformMatch[1]);
  const number = (key, fallback) => transform[key] === undefined
    ? fallback : Number(transform[key]);
  const objectId = Number(placement.objectID);
  const rootBeginFrame = Number(placement.morph) + 1;
  const rootMatrix = Object.freeze({
    a: number("scaleX", 1),
    b: number("skewY", 0),
    c: number("skewX", 0),
    d: number("scaleY", 1),
    tx: number("transX", 0) / 20,
    ty: number("transY", 0) / 20,
  });
  invariant(Number.isSafeInteger(objectId) && objectId > 0 &&
    Number.isSafeInteger(rootBeginFrame) && rootBeginFrame > 0 &&
    Object.values(rootMatrix).every(Number.isFinite),
  `${animationId}: animation placement is invalid`);
  return Object.freeze({objectId, rootBeginFrame, rootMatrix,
    instanceName: placement.name, depth: placement.depth});
}

function deriveFfdecMetadata(framesHtml, objectId, animationId) {
  const normalized = framesHtml.replace(/\r\n?/g, "\n");
  const canvas = normalized.match(
    /<canvas\s+id="myCanvas"\s+width="(\d+)"\s+height="(\d+)"/,
  );
  invariant(canvas, `${animationId}: target Canvas is missing`);
  const marker = '<script>var canvas=document.getElementById("myCanvas");';
  const start = normalized.indexOf(marker);
  const end = normalized.indexOf("</script>", start);
  invariant(start >= 0 && end > start &&
    normalized.indexOf(marker, start + 1) < 0,
  `${animationId}: target Canvas bootstrap drifted`);
  const inline = normalized.slice(start + "<script>".length, end);
  const definitionsStart = inline.indexOf("var scalingGrids = {};");
  const viewerStart = inline.indexOf("\nvar frame = -1;");
  invariant(definitionsStart >= 0 && viewerStart > definitionsStart,
    `${animationId}: FFDec definition boundary drifted`);
  const definitions = inline.slice(definitionsStart, viewerStart).trimEnd();
  const functionName = `sprite${objectId}`;
  const header = definitions.match(new RegExp(
    `function\\s+${functionName}\\(ctx,ctrans,frame,ratio,time\\)\\{\\s*` +
    "ctx\\.save\\(\\);\\s*ctx\\.transform\\(1,0,0,1," +
    "([-0-9.]+),([-0-9.]+)\\);\\s*var clips = \\[\\];\\s*" +
    "var frame_cnt = (\\d+);",
  ));
  invariant(header, `${animationId}: target sprite header drifted`);
  const frameCount = Number(header[3]);
  const targetStart = header.index;
  const targetEnd = definitions.indexOf("\nfunction ",
    targetStart + header[0].length);
  const targetSource = definitions.slice(targetStart,
    targetEnd < 0 ? definitions.length : targetEnd);
  const cases = [...targetSource.matchAll(
    /case\s+(\d+):([\s\S]*?)(?=\n\s*case\s+\d+:|\n\s*})/g,
  )];
  invariant(cases.length === frameCount && frameCount > 0,
    `${animationId}: target sprite frame inventory drifted`);
  const placed = cases.filter((match) => match[2].includes('place("'))
    .map((match) => Number(match[1]) + 1);
  invariant(placed.length > 0, `${animationId}: target sprite draws no frames`);
  const placedFunctions = [...new Set([...definitions.matchAll(
    /place\("([A-Za-z_$][A-Za-z0-9_$]*)"/g,
  )].map((match) => match[1]))].sort();
  const fontFunctions = [...definitions.matchAll(
    /function\s+(font\d+)\(ctx,ch,textColor\)\{/g,
  )].map((match) => match[1]);
  const images = [...definitions.matchAll(
    /var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\);\s*\1\.src="data:image\/(?:PNG|JPEG);base64,[A-Za-z0-9+/=]+";/g,
  )].map((match) => match[1]);
  return Object.freeze({
    functionName,
    frameCount,
    exportCanvas: Object.freeze({width: Number(canvas[1]),
      height: Number(canvas[2])}),
    internalTranslation: Object.freeze({x: Number(header[1]),
      y: Number(header[2])}),
    lastPlacedFrame: Math.max(...placed),
    placedFunctions: Object.freeze({count: placedFunctions.length,
      sha256: sha256(JSON.stringify(placedFunctions))}),
    fontFunctions: Object.freeze({count: fontFunctions.length,
      sha256: sha256(JSON.stringify(fontFunctions))}),
    embeddedImages: Object.freeze({count: images.length,
      sha256: sha256(JSON.stringify(images))}),
  });
}

function composeStageMatrix(root, internal) {
  const matrix = Object.freeze({
    a: root.a, b: root.b, c: root.c, d: root.d,
    e: root.tx - root.a * internal.x - root.c * internal.y,
    f: root.ty - root.b * internal.x - root.d * internal.y,
  });
  invariant(Math.abs(matrix.a * internal.x + matrix.c * internal.y +
    matrix.e - root.tx) < 1e-9 &&
    Math.abs(matrix.b * internal.x + matrix.d * internal.y +
    matrix.f - root.ty) < 1e-9, "stage matrix composition failed");
  return matrix;
}

function replaceOnce(source, marker, replacement, label) {
  const first = source.indexOf(marker);
  invariant(first >= 0 && source.indexOf(marker, first + marker.length) < 0,
    `${label}: marker count drifted`);
  return `${source.slice(0, first)}${replacement}${source.slice(first + marker.length)}`;
}

function applyStageMatrix(runtime, metadata, spec, rootMatrix, stageMatrix) {
  const literal = (value) => Object.is(value, -0) ? "0" : String(value);
  const offset = spec.timeline.stageRenderOffset;
  let next = replaceOnce(runtime,
    `ctx.transform(1, 0, 0, 1, ${offset.x}, ${offset.y});`,
    `ctx.transform(${[stageMatrix.a, stageMatrix.b, stageMatrix.c,
      stageMatrix.d, stageMatrix.e, stageMatrix.f].map(literal).join(", ")});`,
    "root transform");
  const oldMetadata = `var METADATA = deepFreeze(${JSON.stringify(metadata, null, 2)});`;
  const successor = {...metadata,
    primaryVisualCompiler: "FFDec Canvas plus P-code",
    sourceRootTimeline: {...metadata.sourceRootTimeline,
      placementMatrix: rootMatrix},
    stageRenderMatrix: stageMatrix,
    frameGateDisposition:
      "private manual source-static frames; natural AVM1 behavior is not claimed",
  };
  next = replaceOnce(next, oldMetadata,
    `var METADATA = deepFreeze(${JSON.stringify(successor, null, 2)});`,
    "runtime metadata");
  next = replaceOnce(next,
    "/* Generated by scripts/build-safe-ffdec-canvas-adapter.mjs. */",
    "/* Generated by scripts/build-g4-l5-page-only-current-js.mjs using the hash-bound safe FFDec adapter. */",
    "generator header");
  new Script(next, {filename: `${spec.animationId}-canvas-renderer.js`});
  for (const [label, expression] of BLOCKED_RUNTIME_PATTERNS) {
    invariant(!expression.test(next), `${spec.animationId}: runtime contains ${label}`);
  }
  return next;
}

function adapterSpec(page, target, metadata, detail, memberPath,
  framesBinding, helperBinding) {
  const stage = page.source.swf.stage;
  const stageMatrix = composeStageMatrix(target.rootMatrix,
    metadata.internalTranslation);
  return Object.freeze({
    stageMatrix,
    value: {
      schemaVersion: 1,
      animationId: page.animationId,
      classification: "private-page-only-current-js-engineering",
      title: `${page.animationId} source child timeline`,
      source: {swf: `${SOURCE_ROOT}/${page.source.path}`,
        swfBytes: page.source.bytes, swfSha256: page.source.sha256},
      evidence: {compilerMemberManifest: memberPath,
        compilerMemberManifestSha256: sha256(jsonBytes(detail)),
        scenarioInventory: memberPath,
        scenarioInventorySha256: sha256(jsonBytes(detail)),
        audioAudit: memberPath,
        audioAuditSha256: sha256(jsonBytes(detail))},
      ffdecExport: {
        tool: "JPEXS Free Flash Decompiler 26.2.1 Canvas export, factory hash-bound",
        helper: helperBinding.path,
        helperSha256: helperBinding.sha256,
        helperBytes: helperBinding.bytes,
        framesHtml: framesBinding.path,
        framesHtmlSha256: framesBinding.sha256,
        framesHtmlBytes: framesBinding.bytes,
        targetSpriteObjectId: target.objectId,
        targetSpriteFunction: metadata.functionName,
        exportCanvas: metadata.exportCanvas,
        exportInternalTranslation: metadata.internalTranslation,
        expectedPlacedFunctionCount: metadata.placedFunctions.count,
        expectedPlacedFunctionsSha256: metadata.placedFunctions.sha256,
        expectedFontFunctionCount: metadata.fontFunctions.count,
        expectedFontFunctionsSha256: metadata.fontFunctions.sha256,
        embeddedImageVariableCount: metadata.embeddedImages.count,
        embeddedImageVariablesSha256: metadata.embeddedImages.sha256,
      },
      timeline: {
        fps: page.source.swf.fps,
        stage: {width: Math.ceil(stage.width), height: Math.ceil(stage.height),
          backgroundColor: "#b8d8f7"},
        root: {frameCount: page.source.swf.frameCount,
          preloaderStopFrame: 1, beginFrame: target.rootBeginFrame,
          beginLabel: "begin", placementName: target.instanceName,
          placementDepth: target.depth,
          placementTwips: {x: target.rootMatrix.tx * 20,
            y: target.rootMatrix.ty * 20},
          placementPixels: {x: target.rootMatrix.tx, y: target.rootMatrix.ty}},
        local: {timelineId: `sprite-${target.objectId}`,
          frameCount: metadata.frameCount,
          livePlaybackEndFrame: metadata.lastPlacedFrame,
          playbackMode: "once", publicFrameIndexing: "one-indexed"},
        stageRenderOffset: {
          x: target.rootMatrix.tx - metadata.internalTranslation.x,
          y: target.rootMatrix.ty - metadata.internalTranslation.y,
        },
      },
      runtimeContract: {
        kind: "structural-local-frame",
        scenarios: ["source-static-frame"],
        defaultScenario: "source-static-frame",
        supportedLanguages: ["en"],
        seedMapping: "no-randomness-injected-into-source-static-frame-rendering",
        blockedLocalFrameRanges: [],
        unresolved: [
          "The renderer uses hash-pinned FFDec drawing functions and never executes AVM1 or the source SWF.",
          "Natural interaction, audio, original-runtime parity, full-frame fidelity, human review, Owner acceptance, strict completion, release, and publication remain closed gates.",
        ],
        currentCanonicalFrameDomainDispositionAsserted: false,
      },
      output: {script: `apps/web/public/flash-assets/courses/${page.animationId}/canvas-renderer.js`,
        manifest: `apps/web/public/flash-assets/courses/${page.animationId}/manifest.json`,
        spec: `apps/web/public/flash-assets/courses/${page.animationId}/adapter-spec.json`,
        globalRegistry: ASSET_REGISTRY},
      strictAcceptanceEffect: "none",
    },
  });
}

function constantName(animationId) {
  return animationId.replace(/[^A-Za-z0-9]+/g, "_").toUpperCase();
}

function timelineSource(page, asset) {
  const name = constantName(page.animationId);
  const stage = page.source.swf.stage;
  return `import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";\n\n` +
    `export const ${name}_SOURCE = Object.freeze(${JSON.stringify({
      releaseId: "lesson-g04-l05-multiplication-page-only-candidate",
      releaseOrdinal: page.ordinal,
      swf: `${SOURCE_ROOT}/${page.source.path}`,
      swfSha256: page.source.sha256,
      pairedFlaStatus: page.pairedFla ? "present" : "absent-source-scope-swf-only",
      sourceStaticFrameDomain: page.frameDomain,
      sourceStaticFrameCount: page.frameCount,
      rootBeginFrame: page.rootBeginFrame,
      sourceOccurrence: page.ordinal,
      candidateManifest: asset.manifestPath,
      candidateManifestSha256: asset.manifestSha256,
      privateRegistrationCalibrationId: CALIBRATION_ID,
      actionScriptExecuted: false,
      controlsEnabled: false,
      registered: true,
      strictAcceptanceEffect: "none",
    }, null, 2)});\n\n` +
    `export const ${name}_CONFIG = Object.freeze(${JSON.stringify({
      animationId: page.animationId,
      title: `${page.titleEnglish} — private source-static Current-JS engineering module`,
      sourceSwfSha256: page.source.sha256,
      assetSource: `/flash-assets/courses/${page.animationId}/canvas-renderer.js`,
      assetSha256: asset.runtimeSha256,
      stage: {width: stage.width, height: stage.height,
        backgroundColor: "#b8d8f7"},
      nativeStage: {width: stage.width, height: stage.height,
        backgroundColor: "#b8d8f7"},
      backingStage: {width: Math.ceil(stage.width), height: Math.ceil(stage.height)},
      fps: page.source.swf.fps,
      rootFrameCount: page.source.swf.frameCount,
      rootBeginFrame: page.rootBeginFrame,
      mainFrameDomain: page.frameDomain,
      mainFrameCount: page.frameCount,
      livePlaybackEndFrame: page.livePlaybackEndFrame,
      playbackMode: "once",
      strictCaptureIdentity: true,
      blockedFrameRanges: [],
      visualMarkers: [{id: `${page.frameDomain}-ffdec-source-static-drawing`,
        firstFrame: 1, lastFrame: page.frameCount}],
      sourceControlBehaviorLabel:
        "Private source-bound manual frame renderer; AVM1 behavior, audio, fidelity, and acceptance remain pending",
    }, null, 2)} satisfies SourceStaticCanvasCandidateConfig);\n`;
}

function moduleSource(page) {
  const name = constantName(page.animationId);
  return `"use client";\n\n` +
    `import {createSourceStaticCanvasCandidate} from "../source-static-canvas-candidate";\n` +
    `import {${name}_CONFIG, ${name}_SOURCE} from "../timelines/${page.animationId}";\n\n` +
    `const candidate = createSourceStaticCanvasCandidate(${name}_CONFIG);\n` +
    `const module = Object.freeze({...candidate.module, maturity: "private-current-js" as const});\n\n` +
    `export {${name}_SOURCE};\n` +
    `export const ${name}_MOVIE = candidate.movie;\n` +
    `export const ${name}_RUNTIME = candidate.runtime;\n` +
    `export const ${name}_SOURCE_CONTRACT = candidate.sourceContract;\n` +
    `export const ${name}_SCENARIOS = candidate.scenarios;\n` +
    `export const ${name}_RENDERER = candidate.Renderer;\n` +
    `export default module;\n`;
}

function loaderSource(pages) {
  return Buffer.from([
    "// Generated by scripts/build-g4-l5-page-only-current-js.mjs. Do not edit.",
    "import type {AnimationModule} from './contract';", "",
    "const loaders: Readonly<Record<string, () => Promise<AnimationModule>>> = Object.freeze({",
    pages.map((page) =>
      `  '${page.animationId}': () => import('./modules/${page.animationId}').then(({default: animationModule}) => animationModule),`
    ).join("\n"),
    "});", "",
    "export const g4L5ProductModuleKeys = Object.freeze(Object.keys(loaders));",
    "export async function loadG4L5ProductModule(key: string): Promise<AnimationModule | undefined> {",
    "  return loaders[key]?.();", "}", "",
  ].join("\n"));
}

async function buildVisual(page, member, detail, check) {
  const base = path.posix.dirname(`${path.posix.dirname(FACTORY_RUN_PATH)}/${member.manifestPath}`);
  const xmlPath = `${base}/swfmill/source.xml`;
  const xml = (await readBytes(xmlPath)).toString("utf8");
  const target = parseRootTarget(xml, page.animationId);
  const spriteBase = `${base}/canvas/sprites/DefineSprite_${target.objectId}`;
  const framesPath = `${spriteBase}/frames.html`;
  const helperPath = `${spriteBase}/canvas.js`;
  const [frames, helper] = await Promise.all([readBytes(framesPath),
    readBytes(helperPath)]);
  const metadata = deriveFfdecMetadata(frames.toString("utf8"),
    target.objectId, page.animationId);
  const framesBinding = {path: framesPath, bytes: frames.length,
    sha256: sha256(frames)};
  const helperBinding = {path: helperPath, bytes: helper.length,
    sha256: sha256(helper)};
  const spec = adapterSpec(page, target, metadata, detail,
    `${path.posix.dirname(FACTORY_RUN_PATH)}/${member.manifestPath}`,
    framesBinding, helperBinding);
  const built = buildSafeRuntime({helperSource: helper.toString("utf8"),
    framesHtml: frames.toString("utf8"), spec: spec.value});
  const runtime = Buffer.from(applyStageMatrix(built.runtime, built.metadata,
    spec.value, target.rootMatrix, spec.stageMatrix));
  const outputBase = `apps/web/public/flash-assets/courses/${page.animationId}`;
  const runtimePath = `${outputBase}/canvas-renderer.js`;
  const specPath = `${outputBase}/adapter-spec.json`;
  const manifestPath = `${outputBase}/manifest.json`;
  const specBytes = jsonBytes(spec.value);
  const manifest = {
    schemaVersion: 1,
    artifactType: "g4-l5-private-page-only-current-js-asset-v1",
    animationId: page.animationId,
    ordinal: page.ordinal,
    sourceSwf: {path: page.source.path, bytes: page.source.bytes,
      sha256: page.source.sha256},
    compilerMemberManifest: await binding(
      `${path.posix.dirname(FACTORY_RUN_PATH)}/${member.manifestPath}`),
    ffdec: {framesHtml: await binding(framesPath), helper: await binding(helperPath),
      targetSpriteObjectId: target.objectId,
      targetSpriteFrameCount: metadata.frameCount},
    generator: await binding(GENERATOR_PATH),
    runtime: {path: runtimePath, bytes: runtime.length, sha256: sha256(runtime),
      registry: ASSET_REGISTRY},
    adapterSpec: {path: specPath, bytes: specBytes.length,
      sha256: sha256(specBytes)},
    currentJavaScript: {privateEngineeringRegistered: true,
      modernMyLessonIntegrated: true, publicReleaseRegistered: false},
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
  const manifestBytes = jsonBytes(manifest);
  await synchronize(runtimePath, runtime, check);
  await synchronize(specPath, specBytes, check);
  await synchronize(manifestPath, manifestBytes, check);
  return Object.freeze({target, metadata, runtimePath,
    runtimeSha256: manifest.runtime.sha256, manifestPath,
    manifestSha256: sha256(manifestBytes)});
}

function dataSource(pages, freezeSha256) {
  const sectionCodes = [...new Set(pages.map((page) => page.sectionCode))];
  const sections = sectionCodes.map((code, index) => {
    const members = pages.filter((page) => page.sectionCode === code);
    return {order: index + 1, code, activePageCount: members.length,
      firstActiveAnimationId: members[0].animationId,
      titleEnglish: members[0].sectionTitleEnglish,
      titleSpanish: members[0].sectionTitleSpanish};
  });
  const value = {schemaVersion: 1, calibrationId: CALIBRATION_ID,
    freeze: {path: FREEZE_PATH, sha256: freezeSha256},
    course: {grade: 4, lesson: 5, title: "Multiplication",
      sourceXmlPath: COURSE_XML_PATH, sourceXmlSha256: COURSE_XML_SHA256,
      activePageCount: 53, courseShellCount: 0}, sections,
    pages: pages.map((page) => ({ordinal: page.ordinal,
      animationId: page.animationId, assetId: page.assetId,
      sectionCode: page.sectionCode,
      sectionPageOrdinal: pages.filter((candidate) =>
        candidate.sectionCode === page.sectionCode &&
        candidate.ordinal <= page.ordinal).length,
      titleEnglish: page.titleEnglish,
      titleSpanish: page.titleSpanish,
      sourceOccurrence: page.ordinal, swfSha256: page.source.sha256,
      frameDomain: page.frameDomain, frameCount: page.frameCount,
      complexityLane: page.complexityLane, registered: true,
      audioAvailable: page.preservedProduct &&
        Boolean(page.catalogEntry?.audio?.exact?.length)})),
    acceptanceEffects: ACCEPTANCE_EFFECTS};
  return Buffer.from(`/* Generated by ${GENERATOR_PATH}. Do not edit. */\n` +
    `export const G4_L5_PAGE_ONLY_CURRENT_JS = Object.freeze(${JSON.stringify(value, null, 2)} as const);\n`);
}

async function build({check}) {
  const [run, catalog, generatorBinding, registryBefore] = await Promise.all([
    readJson(FACTORY_RUN_PATH), readJson(CATALOG_PATH), binding(GENERATOR_PATH),
    readJson(REGISTRY_PATH),
  ]);
  invariant(run.mode === "extend" && run.members?.length === 53 &&
    run.release?.expectedActivePageCount === 53 &&
    run.release?.legacyFlashCourseShellExcluded === true &&
    Object.values(run.acceptanceEffects ?? {}).every((value) => value === false),
  "G4 L5 compiler extension manifest is inadmissible");
  const sequence = courseSequence(catalog);
  const assets = new Map();
  const pages = [];
  for (const sourcePage of sequence) {
    const member = run.members[sourcePage.ordinal - 1];
    invariant(member?.animationId === sourcePage.animationId &&
      member.ordinal === sourcePage.ordinal,
    `${sourcePage.animationId}: compiler sequence drifted`);
    const memberPath = `${path.posix.dirname(FACTORY_RUN_PATH)}/${member.manifestPath}`;
    const detailBytes = await readBytes(memberPath);
    invariant(sha256(detailBytes) === member.manifest.sha256,
      `${sourcePage.animationId}: compiler member hash drifted`);
    const detail = JSON.parse(detailBytes.toString("utf8"));
    const sourceBytes = await readBytes(`${SOURCE_ROOT}/${sourcePage.source.path}`);
    const sourceMode = (await stat(projectPath(
      `${SOURCE_ROOT}/${sourcePage.source.path}`))).mode;
    invariant(sourceBytes.length === sourcePage.source.bytes &&
      sha256(sourceBytes) === sourcePage.source.sha256 &&
      (sourceMode & 0o222) === 0,
    `${sourcePage.animationId}: frozen source changed or is writable`);
    const preservedProduct = PRESERVED_PRODUCT_IDS.has(sourcePage.animationId);
    let visual = null;
    let frameDomain;
    let frameCount;
    let rootBeginFrame = 6;
    let livePlaybackEndFrame;
    if (preservedProduct) {
      const old = JSON.parse(await readFile(projectPath(
        "tools/g4-l5-ffdec-canvas-pcode-product-factory/product-ir.json"),
      "utf8")).members.find((candidate) =>
        candidate.animationId === sourcePage.animationId);
      invariant(old, `${sourcePage.animationId}: preserved product IR missing`);
      frameDomain = old.source.productFrameDomain.id;
      frameCount = old.source.productFrameDomain.frameCount;
      livePlaybackEndFrame = frameCount;
    } else {
      visual = await buildVisual(sourcePage, member, detail, check);
      assets.set(sourcePage.animationId, visual);
      frameDomain = `sprite-${visual.target.objectId}`;
      frameCount = visual.metadata.frameCount;
      rootBeginFrame = visual.target.rootBeginFrame;
      livePlaybackEndFrame = visual.metadata.lastPlacedFrame;
    }
    const pcodeCount = detail.avm1?.classifiedOpcodeOccurrences ?? 0;
    pages.push({...sourcePage,
      catalogEntry: catalog.animations.find((entry) =>
        entry.animationId === sourcePage.animationId),
      preservedProduct, visual, frameDomain, frameCount, rootBeginFrame,
      livePlaybackEndFrame,
      complexityLane: preservedProduct ? "interactive-understood" :
        pcodeCount === 0 ? "low" : "behavior-heavy"});
  }

  for (const page of pages.filter(({preservedProduct}) => !preservedProduct)) {
    const asset = assets.get(page.animationId);
    await synchronize(`packages/demos/src/timelines/${page.animationId}.ts`,
      Buffer.from(timelineSource(page, asset)), check);
    await synchronize(`packages/demos/src/modules/${page.animationId}.tsx`,
      Buffer.from(moduleSource(page)), check);
  }

  const selectedPages = pages.map((page) => ({
    animationId: page.animationId,
    globalPageOrdinal: page.ordinal,
    sectionCode: page.sectionCode,
    sectionPageOrdinal: pages.filter((candidate) =>
      candidate.sectionCode === page.sectionCode &&
      candidate.ordinal <= page.ordinal).length,
    complexityLane: page.complexityLane,
    implementation: page.preservedProduct
      ? {kind: "preserved-six-page-product-calibration",
          predecessorCalibrationId: "g4-l5-ffdec-product-factory-v2"}
      : {kind: "hash-bound-ffdec-source-static-current-js",
          asset: page.visual},
    runtime: {frameDomain: page.frameDomain, frameCount: page.frameCount,
      rootBeginFrame: page.rootBeginFrame,
      livePlaybackEndFrame: page.livePlaybackEndFrame,
      actionScriptExecuted: false, naturalTraceValidated: false},
  }));
  const freeze = {
    schemaVersion: 1,
    calibrationId: CALIBRATION_ID,
    status: "page-only-private-current-js-registered-53-of-53",
    scope: {releaseId: "lesson-g04-l05-multiplication-page-only-candidate",
      activePageCount: 53, courseShellCount: 0, selectedPageCount: 53,
      excludedHistoricalShellAnimationId: "shell-course-g04-l05-index-local"},
    inputs: {compilerRun: await binding(FACTORY_RUN_PATH),
      catalog: await binding(CATALOG_PATH), generator: generatorBinding,
      predecessorCalibration:
        await binding("catalog/product-bridge-calibrations/g4-l5-ffdec-product-factory-v2.json")},
    selectedPages,
    modernMyLesson: {pageOnlyDescriptor: true,
      exactSourceOrderMemberCount: 53, legacyCourseShellIncluded: false,
      privateRouteOnly: true},
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
  const freezeBytes = jsonBytes(freeze);
  await synchronize(FREEZE_PATH, freezeBytes, check);
  const freezeSha256 = sha256(freezeBytes);

  const privateCalibration = {
    calibrationId: CALIBRATION_ID, freezeManifest: FREEZE_PATH,
    entries: pages.map((page) => ({key: page.animationId,
      module: `./modules/${page.animationId}`,
      maturity: "private-current-js",
      complexityLane: page.complexityLane}))};
  if (check) {
    invariant(privateCurrentJsCalibrationMatches(
      registryBefore, privateCalibration,
    ), `${REGISTRY_PATH}: ${CALIBRATION_ID} is stale or absent`);
  } else {
    await synchronize(REGISTRY_PATH, jsonBytes(
      upsertPrivateCurrentJsCalibration(registryBefore, privateCalibration),
    ), false);
  }
  await synchronize(LOADER_PATH, loaderSource(pages), check);
  await synchronize(DATA_PATH, dataSource(pages, freezeSha256), check);
  return {calibrationId: CALIBRATION_ID, registered: pages.length,
    activePages: 53, courseShellCount: 0,
    preservedProductPages: pages.filter(({preservedProduct}) =>
      preservedProduct).length,
    generatedSourceStaticPages: assets.size, freezePath: FREEZE_PATH,
    freezeSha256, check};
}

const options = parseArguments(process.argv.slice(2));
build(options).then((result) => {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}).catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
