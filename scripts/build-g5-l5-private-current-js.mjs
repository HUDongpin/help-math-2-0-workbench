#!/usr/bin/env node

import {createHash} from "node:crypto";
import {readFile, mkdir, stat, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {buildSafeRuntime} from "./build-safe-ffdec-canvas-adapter.mjs";
import {
  applyRootTransformSuccessor,
  composeRootStageRenderMatrix,
} from "./build-g5-l5-safe-canvas-successor.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GENERATOR_PATH = "scripts/build-g5-l5-private-current-js.mjs";
const SOURCE_SCOPE_PATH = "reports/g5-l5-source-scope-freeze.json";
const ROOT_AUDIT_PATH = "work/g5-l5-root-placement-audit/v1/run-manifest.json";
const QUEUE_PATH = "work/g5-l5-safe-canvas-draft-queue/v1/run-manifest.json";
const ALLOWLIST_PATH = "work/g5-l5-avm1-behavior-allowlist/v2/run-manifest.json";
const LESSONS_PATH = "catalog/lessons.json";
const PRIVATE_REGISTRY_PATH = "packages/demos/private-current-js-registry.json";
const GENERATED_DATA_PATH =
  "apps/web/lib/g5-l5-product-bridge-data.generated.ts";
const SOURCE_ROOT = "source-assets/flash/HELP MATH_ORIGINAL FILES";
const RELEASE_ID = "lesson-g05-l05-add-subtract-negative-numbers";
const COURSE_XML_PATH = "HELP_COURSES/ELMGR5/L5/index.xml";
const COURSE_XML_SHA256 =
  "b6aef32a4be5684cccc7a4f105fe5ca92129c2292f19a71cf975f24bb133fa9e";
const PRODUCT_ASSET_REGISTRY = "HELP_MATH_CANVAS_ASSETS";

const SLICE_IDS = Object.freeze([
  "course-g05-l05-rw-003",
  "course-g05-l05-vb-012",
  "course-g05-l05-ts-007",
]);

const ACCEPTANCE_EFFECTS = Object.freeze({
  authoritativeOriginalRuntime: false,
  behaviorParityAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  humanAudioAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseEligible: false,
  published: false,
});

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
  invariant(
    typeof relativePath === "string" &&
      relativePath.length > 0 &&
      !path.isAbsolute(relativePath),
    `invalid project path: ${relativePath}`,
  );
  const absolute = path.resolve(ROOT, relativePath);
  invariant(
    absolute.startsWith(`${ROOT}${path.sep}`),
    `path escapes isolated worktree: ${relativePath}`,
  );
  return absolute;
}

async function readBytes(relativePath) {
  return readFile(projectPath(relativePath));
}

async function readJson(relativePath) {
  return JSON.parse((await readBytes(relativePath)).toString("utf8"));
}

async function bind(relativePath) {
  const bytes = await readBytes(relativePath);
  return Object.freeze({
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
  });
}

async function synchronize(relativePath, bytes, check) {
  const target = projectPath(relativePath);
  if (check) {
    const existing = await readFile(target).catch(() => null);
    invariant(existing && existing.equals(bytes), `${relativePath} is stale`);
    return;
  }
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, bytes);
}

function parseArguments(argv) {
  let check = false;
  let scope = "slice";
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") check = true;
    else if (argument === "--scope") {
      scope = argv[index + 1];
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      return {help: true, check, scope};
    } else throw new Error(`unknown argument: ${argument}`);
  }
  invariant(scope === "slice" || scope === "all", "--scope must be slice or all");
  return {help: false, check, scope};
}

function usage() {
  return [
    "Usage:",
    "  node scripts/build-g5-l5-private-current-js.mjs --scope slice [--check]",
    "  node scripts/build-g5-l5-private-current-js.mjs --scope all [--check]",
    "",
    "Builds private, page-only Current-JS engineering modules. The legacy",
    "course shell is excluded. No fidelity, audio, human, Owner, strict,",
    "release, or publication gate is promoted.",
  ].join("\n");
}

function matrixFromRootPlacement(rootPlacement) {
  const transform = rootPlacement.transformTwips;
  return Object.freeze({
    a: transform.scaleX.value,
    b: transform.skewY.value,
    c: transform.skewX.value,
    d: transform.scaleY.value,
    tx: transform.transX / 20,
    ty: transform.transY / 20,
  });
}

function deriveFfdecMetadata(framesHtml, rootMember) {
  const normalized = framesHtml.replace(/\r\n?/g, "\n");
  const canvas = normalized.match(
    /<canvas\s+id="myCanvas"\s+width="(\d+)"\s+height="(\d+)"/,
  );
  invariant(canvas, `${rootMember.animationId}: FFDec export canvas missing`);
  const inlineStartMarker =
    '<script>var canvas=document.getElementById("myCanvas");';
  const inlineStart = normalized.indexOf(inlineStartMarker);
  invariant(
    inlineStart >= 0 &&
      normalized.indexOf(inlineStartMarker, inlineStart + 1) < 0,
    `${rootMember.animationId}: FFDec inline bootstrap drifted`,
  );
  const inlineEnd = normalized.indexOf("</script>", inlineStart);
  invariant(inlineEnd > inlineStart, `${rootMember.animationId}: inline script missing`);
  const inline = normalized.slice(inlineStart + "<script>".length, inlineEnd);
  const definitionsStart = inline.indexOf("var scalingGrids = {};");
  const viewerStart = inline.indexOf("\nvar frame = -1;");
  invariant(
    definitionsStart >= 0 && viewerStart > definitionsStart,
    `${rootMember.animationId}: FFDec definition boundary drifted`,
  );
  const definitions = inline.slice(definitionsStart, viewerStart).trimEnd();
  const functionName = rootMember.targetSprite.functionName;
  const headerPattern = new RegExp(
    `function\\s+${functionName}\\(ctx,ctrans,frame,ratio,time\\)\\{\\s*` +
      "ctx\\.save\\(\\);\\s*ctx\\.transform\\(1,0,0,1," +
      "([-0-9.]+),([-0-9.]+)\\);\\s*var clips = \\[\\];\\s*" +
      "var frame_cnt = (\\d+);",
  );
  const header = definitions.match(headerPattern);
  invariant(
    header && Number(header[3]) === rootMember.targetSprite.frameCount,
    `${rootMember.animationId}: target sprite header drifted`,
  );
  const targetStart = header.index;
  const targetEnd = definitions.indexOf("\nfunction ", targetStart + header[0].length);
  const targetSource = definitions.slice(
    targetStart,
    targetEnd < 0 ? definitions.length : targetEnd,
  );
  const targetCases = [
    ...targetSource.matchAll(
      /case\s+(\d+):([\s\S]*?)(?=\n\s*case\s+\d+:|\n\s*})/g,
    ),
  ];
  invariant(
    targetCases.length === rootMember.targetSprite.frameCount,
    `${rootMember.animationId}: target sprite case inventory drifted`,
  );
  const placedFrames = targetCases
    .filter((match) => match[2].includes('place("'))
    .map((match) => Number(match[1]) + 1);
  const lastPlacedFrame = Math.max(...placedFrames);
  invariant(
    Number.isSafeInteger(lastPlacedFrame) &&
      lastPlacedFrame >= 1 &&
      lastPlacedFrame <= rootMember.targetSprite.frameCount,
    `${rootMember.animationId}: target sprite has no drawable frame`,
  );
  const placedFunctions = [...new Set([
    ...definitions.matchAll(/place\("([A-Za-z_$][A-Za-z0-9_$]*)"/g),
  ].map((match) => match[1]))].sort();
  const fontFunctions = [
    ...definitions.matchAll(/function\s+(font\d+)\(ctx,ch,textColor\)\{/g),
  ].map((match) => match[1]);
  const embeddedImages = [
    ...definitions.matchAll(
      /var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\);\s*\1\.src="data:image\/(?:PNG|JPEG);base64,[A-Za-z0-9+/=]+";/g,
    ),
  ].map((match) => match[1]);
  invariant(placedFunctions.length > 0, `${rootMember.animationId}: empty FFDec function inventory`);
  return Object.freeze({
    exportCanvas: Object.freeze({width: Number(canvas[1]), height: Number(canvas[2])}),
    internalTranslation: Object.freeze({x: Number(header[1]), y: Number(header[2])}),
    lastPlacedFrame,
    trailingEmptyFrameCount:
      rootMember.targetSprite.frameCount - lastPlacedFrame,
    placedFunctions: Object.freeze({
      count: placedFunctions.length,
      sha256: sha256(JSON.stringify(placedFunctions)),
    }),
    fontFunctions: Object.freeze({
      count: fontFunctions.length,
      sha256: sha256(JSON.stringify(fontFunctions)),
    }),
    embeddedImages: Object.freeze({
      count: embeddedImages.length,
      sha256: sha256(JSON.stringify(embeddedImages)),
    }),
  });
}

function laneFor(queueMember) {
  const decisions = queueMember.behavior?.decisionIds ?? [];
  if (queueMember.behavior?.userEventPcodeFileCount === 0) return "low";
  if (
    decisions.includes("fixed-choice-feedback") ||
    ["course-g05-l05-vb-012", "course-g05-l05-vb-013"].includes(
      queueMember.animationId,
    )
  ) return "interactive-understood";
  return "behavior-heavy";
}

function sourceLabel(text, spanish = false) {
  return Object.freeze({
    text,
    sourceLanguage: spanish ? "es" : "en",
    sourceStatus: spanish ? "exact-course-xml" : "exact-page-title",
    usesEnglishFallback: false,
  });
}

function pageLabel(member, spanish = false) {
  if (!spanish) return sourceLabel(member.title.english);
  return Object.freeze({
    text: member.title.english,
    sourceLanguage: "en",
    sourceStatus: "missing-page-level-spanish-title",
    usesEnglishFallback: true,
  });
}

function constantName(animationId) {
  return animationId.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
}

function moduleSource(page, calibrationId) {
  const name = constantName(page.animationId);
  return `"use client";\n\n` +
    `import {createG5L5PrivateCurrentJsCandidate} from "../g5-l5-private-current-js-candidate";\n` +
    `import {${name}_CONFIG, ${name}_SOURCE} from "../timelines/${page.animationId}";\n\n` +
    `const candidate = createG5L5PrivateCurrentJsCandidate(${name}_CONFIG, Object.freeze({\n` +
    `  calibrationId: ${JSON.stringify(calibrationId)},\n` +
    `  complexityLane: ${JSON.stringify(page.complexityLane)},\n` +
    `  sourceBehaviorDecisionIds: Object.freeze(${JSON.stringify(page.behaviorDecisionIds)}),\n` +
    `  sourceUserEventPcodeFileCount: ${page.userEventPcodeFileCount},\n` +
    `}));\n\n` +
    `export {${name}_SOURCE};\n` +
    `export const ${name}_MOVIE = candidate.movie;\n` +
    `export const ${name}_RUNTIME = candidate.runtime;\n` +
    `export const ${name}_SOURCE_CONTRACT = candidate.sourceContract;\n` +
    `export const ${name}_SCENARIOS = candidate.scenarios;\n` +
    `export const ${name}_RENDERER = candidate.Renderer;\n` +
    `export default candidate.module;\n`;
}

function timelineSource(page, asset, calibrationId) {
  const name = constantName(page.animationId);
  const source = page.sourceMember.source;
  const title = `${page.sourceMember.title.english} — private source-static Current-JS engineering module`;
  return `import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";\n\n` +
    `export const ${name}_SOURCE = Object.freeze(${JSON.stringify({
      releaseId: RELEASE_ID,
      releaseOrdinal: page.ordinal,
      swf: `${SOURCE_ROOT}/${source.swf.path}`,
      swfSha256: source.swf.sha256,
      pairedFlaStatus: source.fla ? "present" : "absent-source-scope-swf-only",
      ...(source.fla ? {
        fla: `${SOURCE_ROOT}/${source.fla.path}`,
        flaSha256: source.fla.sha256,
      } : {}),
      sourceStaticFrameDomain: page.frameDomain,
      sourceStaticFrameCount: page.frameCount,
      rootBeginFrame: page.rootBeginFrame,
      sourceOccurrence: page.ordinal,
      candidateManifest: asset.manifestPath,
      candidateManifestSha256: asset.manifestSha256,
      privateRegistrationCalibrationId: calibrationId,
      actionScriptExecuted: false,
      controlsEnabled: [
        "course-g05-l05-vb-012",
        "course-g05-l05-vb-013",
        "course-g05-l05-ts-007",
      ].includes(page.animationId),
      registered: true,
      strictAcceptanceEffect: "none",
    }, null, 2)});\n\n` +
    `export const ${name}_CONFIG = Object.freeze(${JSON.stringify({
      animationId: page.animationId,
      title,
      sourceSwfSha256: source.swf.sha256,
      assetSource: `/flash-assets/courses/${page.animationId}/canvas-renderer.js`,
      assetSha256: asset.runtimeSha256,
      stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
      nativeStage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
      backingStage: {width: 800, height: 600},
      fps: 12,
      rootFrameCount: source.swfMetadata.rootFrameCount,
      rootBeginFrame: page.rootBeginFrame,
      mainFrameDomain: page.frameDomain,
      mainFrameCount: page.frameCount,
      livePlaybackEndFrame: asset.livePlaybackEndFrame,
      playbackMode: page.playbackMode,
      strictCaptureIdentity: true,
      blockedFrameRanges: [],
      visualMarkers: [{
        id: `${page.frameDomain}-ffdec-source-static-drawing`,
        firstFrame: 1,
        lastFrame: page.frameCount,
      }],
      sourceControlBehaviorLabel:
        "Source-bound private Current-JS frame renderer; AVM1 natural behavior, accepted audio, original-runtime parity, and strict fidelity remain independently pending",
    }, null, 2)} satisfies SourceStaticCanvasCandidateConfig);\n`;
}

function buildAdapterSpec(page, rootMember, metadata, rootMatrix, stageRenderMatrix) {
  const sprite = rootMember.targetSprite;
  const placementPixels = {x: rootMatrix.tx, y: rootMatrix.ty};
  const outputBase =
    `apps/web/public/flash-assets/courses/${page.animationId}`;
  return {
    schemaVersion: 1,
    animationId: page.animationId,
    classification: "private-page-only-current-js-engineering",
    title: `${page.animationId} source child timeline`,
    source: {
      swf: rootMember.sourceSwf.path,
      swfBytes: rootMember.sourceSwf.bytes,
      swfSha256: rootMember.sourceSwf.sha256,
    },
    evidence: {
      scenarioInventory: ALLOWLIST_PATH,
      scenarioInventorySha256: page.allowlistSha256,
      audioAudit: QUEUE_PATH,
      audioAuditSha256: page.queueSha256,
    },
    ffdecExport: {
      tool: "JPEXS Free Flash Decompiler 26.2.1 Canvas export, factory hash-bound",
      helper: sprite.helper.path,
      helperSha256: sprite.helper.sha256,
      helperBytes: sprite.helper.bytes,
      framesHtml: sprite.framesHtml.path,
      framesHtmlSha256: sprite.framesHtml.sha256,
      framesHtmlBytes: sprite.framesHtml.bytes,
      targetSpriteObjectId: sprite.objectId,
      targetSpriteFunction: sprite.functionName,
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
      fps: 12,
      stage: {width: 800, height: 600, backgroundColor: "#b8d8f7"},
      root: {
        frameCount: page.sourceMember.source.swfMetadata.rootFrameCount,
        preloaderStopFrame: 1,
        beginFrame: page.rootBeginFrame,
        beginLabel: "begin",
        placementName: rootMember.rootPlacement.name,
        placementDepth: rootMember.rootPlacement.depth,
        placementTwips: {
          x: rootMember.rootPlacement.transformTwips.transX,
          y: rootMember.rootPlacement.transformTwips.transY,
        },
        placementPixels,
      },
      local: {
        timelineId: page.frameDomain,
        frameCount: page.frameCount,
        livePlaybackEndFrame: metadata.lastPlacedFrame,
        trailingEmptyFrameCount: metadata.trailingEmptyFrameCount,
        playbackMode: page.playbackMode,
        publicFrameIndexing: "one-indexed",
      },
      stageRenderOffset: {
        x: placementPixels.x - metadata.internalTranslation.x,
        y: placementPixels.y - metadata.internalTranslation.y,
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
        "Source behavior adapters remain engineering candidates pending authorized natural original-runtime traces.",
        "Audio mapping, listening acceptance, full-frame fidelity, human review, Owner acceptance, strict completion, release, and publication remain independent closed gates.",
      ],
      prebindingTargetFrameDomainDisposition:
        "all source child frames are manually addressable; natural behavior is not claimed",
      currentCanonicalFrameDomainDispositionAsserted: false,
    },
    output: {
      script: `${outputBase}/canvas-renderer.js`,
      manifest: `${outputBase}/manifest.json`,
      spec: `${outputBase}/adapter-spec.json`,
      globalRegistry: PRODUCT_ASSET_REGISTRY,
    },
    successor: {
      rootPlacementMatrix: rootMatrix,
      stageRenderMatrix,
      transformDerivation:
        "source-root-matrix multiplied by inverse FFDec target internal translation",
      frameGateDisposition:
        "private source-static Current-JS; natural behavior and acceptance gates pending",
    },
    strictAcceptanceEffect: "none",
  };
}

function addPlaybackBoundaryMetadata(runtime, page, metadata) {
  const needle =
    `  "deterministicContentTimeline": {\n` +
    `    "timelineId": ${JSON.stringify(page.frameDomain)},\n` +
    `    "frameCount": ${page.frameCount},\n`;
  invariant(
    runtime.indexOf(needle) >= 0 &&
      runtime.indexOf(needle, runtime.indexOf(needle) + 1) < 0,
    `${page.animationId}: deterministic runtime timeline metadata drifted`,
  );
  return runtime.replace(
    needle,
    needle +
      `    "livePlaybackEndFrame": ${metadata.lastPlacedFrame},\n` +
      `    "trailingEmptyFrameCount": ${metadata.trailingEmptyFrameCount},\n`,
  );
}

async function buildVisual(page, rootMember, generatorBinding, check) {
  const [helper, frames] = await Promise.all([
    readBytes(rootMember.targetSprite.helper.path),
    readBytes(rootMember.targetSprite.framesHtml.path),
  ]);
  invariant(
    sha256(helper) === rootMember.targetSprite.helper.sha256 &&
      sha256(frames) === rootMember.targetSprite.framesHtml.sha256,
    `${page.animationId}: FFDec source binding changed`,
  );
  const metadata = deriveFfdecMetadata(frames.toString("utf8"), rootMember);
  const rootMatrix = matrixFromRootPlacement(rootMember.rootPlacement);
  const stageRenderMatrix = composeRootStageRenderMatrix(
    rootMatrix,
    metadata.internalTranslation,
  );
  const spec = buildAdapterSpec(page, rootMember, metadata, rootMatrix, stageRenderMatrix);
  const built = buildSafeRuntime({
    helperSource: helper.toString("utf8"),
    framesHtml: frames.toString("utf8"),
    spec,
  });
  const successor = applyRootTransformSuccessor({
    runtime: built.runtime,
    metadata: built.metadata,
    spec,
    rootMatrix,
    stageRenderMatrix,
    frameGateDisposition:
      "private source-static Current-JS; natural behavior and acceptance gates pending",
  });
  const boundedRuntime = addPlaybackBoundaryMetadata(
    successor.runtime,
    page,
    metadata,
  );
  const runtime = Buffer.from(boundedRuntime.replace(
    "Generated by scripts/build-g5-l5-safe-canvas-successor.mjs using the hash-bound safe FFDec adapter.",
    "Generated by scripts/build-g5-l5-private-current-js.mjs using the hash-bound safe FFDec adapter.",
  ));
  const runtimePath =
    `apps/web/public/flash-assets/courses/${page.animationId}/canvas-renderer.js`;
  const specPath =
    `apps/web/public/flash-assets/courses/${page.animationId}/adapter-spec.json`;
  const manifestPath =
    `apps/web/public/flash-assets/courses/${page.animationId}/manifest.json`;
  const manifest = {
    schemaVersion: 1,
    artifactType: "g5-l5-private-page-only-current-js-asset-v1",
    animationId: page.animationId,
    releaseId: RELEASE_ID,
    ordinal: page.ordinal,
    sourceSwf: rootMember.sourceSwf,
    ffdec: {
      framesHtml: rootMember.targetSprite.framesHtml,
      helper: rootMember.targetSprite.helper,
      targetSpriteObjectId: rootMember.targetSprite.objectId,
      targetSpriteFrameCount: rootMember.targetSprite.frameCount,
    },
    generator: generatorBinding,
    runtime: {
      path: runtimePath,
      bytes: runtime.length,
      sha256: sha256(runtime),
      registry: PRODUCT_ASSET_REGISTRY,
    },
    adapterSpec: {
      path: specPath,
      sha256: sha256(jsonBytes(spec)),
    },
    currentJavaScript: {
      privateEngineeringRegistered: true,
      modernMyLessonIntegrated: true,
      publicReleaseRegistered: false,
    },
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
  const specBytes = jsonBytes(spec);
  const manifestBytes = jsonBytes(manifest);
  await synchronize(runtimePath, runtime, check);
  await synchronize(specPath, specBytes, check);
  await synchronize(manifestPath, manifestBytes, check);
  return Object.freeze({
    runtimePath,
    runtimeSha256: manifest.runtime.sha256,
    manifestPath,
    manifestSha256: sha256(manifestBytes),
    adapterSpecPath: specPath,
    adapterSpecSha256: sha256(specBytes),
    livePlaybackEndFrame: metadata.lastPlacedFrame,
    trailingEmptyFrameCount: metadata.trailingEmptyFrameCount,
  });
}

function generatedDataSource({calibrationId, freezePath, freezeSha256,
  pages, sections, scope}) {
  const data = {
    schemaVersion: 1,
    calibrationId,
    releaseId: RELEASE_ID,
    scope,
    course: {
      grade: 5,
      lesson: 5,
      courseName: "Counting on Numbers",
      title: "Add & Subtract Negative Numbers",
      sourceXmlPath: COURSE_XML_PATH,
      sourceXmlSha256: COURSE_XML_SHA256,
      activePageCount: 56,
      courseShellCount: 0,
    },
    freeze: {path: freezePath, sha256: freezeSha256},
    sections,
    pages: pages.map((page) => ({
      ordinal: page.ordinal,
      animationId: page.animationId,
      assetId: page.sourceMember.assetId,
      sectionCode: page.sourceMember.section,
      sectionPageOrdinal: page.sourceMember.sectionPageOrdinal,
      titleEnglish: page.sourceMember.title.english,
      sourceOccurrence: page.sourceMember.xmlOccurrence,
      frameDomain: page.frameDomain,
      frameCount: page.frameCount,
      complexityLane: page.complexityLane,
      registered: page.selected,
    })),
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
  return Buffer.from(
    `/* Generated by ${GENERATOR_PATH}. Do not edit. */\n` +
      `export const G5_L5_PRODUCT_BRIDGE_DATA = Object.freeze(${JSON.stringify(data, null, 2)} as const);\n`,
  );
}

async function build({check, scope}) {
  const [sourceScope, rootAudit, queue, allowlist, lessons,
    generatorBinding, queueBinding, allowlistBinding] = await Promise.all([
    readJson(SOURCE_SCOPE_PATH),
    readJson(ROOT_AUDIT_PATH),
    readJson(QUEUE_PATH),
    readJson(ALLOWLIST_PATH),
    readJson(LESSONS_PATH),
    bind(GENERATOR_PATH),
    bind(QUEUE_PATH),
    bind(ALLOWLIST_PATH),
  ]);
  invariant(
    sourceScope.reportType === "g5-l5-source-scope-freeze" &&
      sourceScope.releaseId === RELEASE_ID &&
      sourceScope.summary?.pageCount === 56 &&
      sourceScope.summary?.shellCount === 1 &&
      sourceScope.members?.length === 57,
    "G5 L5 source scope changed",
  );
  const sourceMembers = sourceScope.members.slice(0, 56);
  invariant(
    sourceMembers.every((member, index) =>
      member.role === "lesson-page" && member.ordinal === index + 1) &&
      sourceScope.members[56].role === "lesson-shell",
    "page-only source order or shell exclusion changed",
  );
  invariant(
    rootAudit.members?.length === 56 && queue.members?.length === 56 &&
      allowlist.scope?.activeLessonPages === 56,
    "factory audit scope changed",
  );
  const lesson = lessons.lessons.find(({grade, lesson}) => grade === 5 && lesson === 5);
  invariant(
    lesson?.path === COURSE_XML_PATH && lesson.sha256 === COURSE_XML_SHA256 &&
      lesson.pageReferenceCount === 56 && lesson.sections?.length === 8,
    "G5 L5 course XML catalog binding changed",
  );

  const selectedIds = scope === "slice"
    ? SLICE_IDS
    : Object.freeze(sourceMembers.map(({animationId}) => animationId));
  const selectedSet = new Set(selectedIds);
  const calibrationId = scope === "slice"
    ? "g5-l5-product-vertical-slice-v1"
    : "g5-l5-page-only-current-js-56-v1";
  const freezePath = scope === "slice"
    ? "catalog/product-bridge-calibrations/g5-l5-product-vertical-slice-v1.json"
    : "catalog/product-bridge-calibrations/g5-l5-page-only-current-js-56-v1.json";

  const pages = sourceMembers.map((sourceMember) => {
    const rootMember = rootAudit.members.find(({animationId}) =>
      animationId === sourceMember.animationId);
    const queueMember = queue.members.find(({animationId}) =>
      animationId === sourceMember.animationId);
    invariant(
      rootMember && queueMember &&
        rootMember.ordinal === sourceMember.ordinal &&
        queueMember.ordinal === sourceMember.ordinal &&
        rootMember.sourceSwf.sha256 === sourceMember.source.swf.sha256,
      `${sourceMember.animationId}: source/factory identity drifted`,
    );
    const decisions = queueMember.behavior?.decisionIds ?? [];
    const complexityLane = laneFor(queueMember);
    return {
      animationId: sourceMember.animationId,
      ordinal: sourceMember.ordinal,
      sourceMember,
      rootMember,
      queueMember,
      selected: selectedSet.has(sourceMember.animationId),
      frameDomain: `sprite-${rootMember.targetSprite.objectId}`,
      frameCount: rootMember.targetSprite.frameCount,
      rootBeginFrame: rootMember.rootPlacement.morphFrame + 1,
      playbackMode: "once",
      complexityLane,
      behaviorDecisionIds: decisions,
      userEventPcodeFileCount:
        queueMember.behavior?.userEventPcodeFileCount ?? 0,
      allowlistSha256: allowlistBinding.sha256,
      queueSha256: queueBinding.sha256,
    };
  });
  invariant(
    pages.filter(({selected}) => selected).map(({animationId}) => animationId)
      .join("\n") === selectedIds.join("\n"),
    "selected page order changed",
  );

  const assets = new Map();
  for (const page of pages.filter(({selected}) => selected)) {
    const sourcePath = `${SOURCE_ROOT}/${page.sourceMember.source.swf.path}`;
    const sourceBytes = await readBytes(sourcePath);
    const sourceMode = (await stat(projectPath(sourcePath))).mode;
    invariant(
      sourceBytes.length === page.sourceMember.source.swf.bytes &&
        sha256(sourceBytes) === page.sourceMember.source.swf.sha256 &&
        (sourceMode & 0o222) === 0,
      `${page.animationId}: frozen source SWF changed or is writable`,
    );
    assets.set(
      page.animationId,
      await buildVisual(page, page.rootMember, generatorBinding, check),
    );
  }

  const selectedPages = pages.filter(({selected}) => selected).map((page) => ({
    animationId: page.animationId,
    globalPageOrdinal: page.ordinal,
    sectionCode: page.sourceMember.section,
    sectionPageOrdinal: page.sourceMember.sectionPageOrdinal,
    complexityLane: page.complexityLane,
    source: {
      swfSha256: page.sourceMember.source.swf.sha256,
      flaSha256: page.sourceMember.source.fla?.sha256 ?? null,
    },
    runtime: {
      frameDomain: page.frameDomain,
      frameCount: page.frameCount,
      rootBeginFrame: page.rootBeginFrame,
      playbackMode: page.playbackMode,
      asset: assets.get(page.animationId),
    },
    behavior: {
      decisionIds: page.behaviorDecisionIds,
      userEventPcodeFileCount: page.userEventPcodeFileCount,
      avm1Executed: false,
      naturalTraceValidated: false,
    },
  }));
  const freeze = {
    schemaVersion: 1,
    calibrationId,
    status: scope === "slice"
      ? "three-lane-private-product-vertical-slice"
      : "page-only-private-current-js-registered-56-of-56",
    scope: {
      releaseId: RELEASE_ID,
      activePageCount: 56,
      courseShellCount: 0,
      selectedPageCount: selectedPages.length,
      excludedHistoricalShellAnimationId: sourceScope.members[56].animationId,
    },
    inputs: {
      sourceScope: await bind(SOURCE_SCOPE_PATH),
      rootPlacementAudit: await bind(ROOT_AUDIT_PATH),
      safeCanvasDraftQueue: queueBinding,
      avm1Allowlist: allowlistBinding,
      generator: generatorBinding,
    },
    selectedPages,
    modernMyLesson: {
      pageOnlyDescriptor: true,
      exactSourceOrderMemberCount: 56,
      legacyCourseShellIncluded: false,
      privateRouteOnly: true,
    },
    acceptanceEffects: ACCEPTANCE_EFFECTS,
  };
  const freezeBytes = jsonBytes(freeze);
  await synchronize(freezePath, freezeBytes, check);
  const freezeSha256 = sha256(freezeBytes);

  for (const page of pages.filter(({selected}) => selected)) {
    const asset = assets.get(page.animationId);
    await synchronize(
      `packages/demos/src/timelines/${page.animationId}.ts`,
      Buffer.from(timelineSource(page, asset, calibrationId)),
      check,
    );
    await synchronize(
      `packages/demos/src/modules/${page.animationId}.tsx`,
      Buffer.from(moduleSource(page, calibrationId)),
      check,
    );
  }

  const privateRegistry = {
    schemaVersion: 1,
    registryScope: "private-engineering",
    calibrationId,
    freezeManifest: freezePath,
    entries: pages.filter(({selected}) => selected).map((page) => ({
      key: page.animationId,
      module: `./modules/${page.animationId}`,
      maturity: "private-current-js",
      complexityLane: page.complexityLane,
    })),
  };
  await synchronize(PRIVATE_REGISTRY_PATH, jsonBytes(privateRegistry), check);

  const sections = lesson.sections.map((section) => {
    const first = pages.find(({sourceMember}) =>
      sourceMember.section === section.code);
    invariant(first, `missing first page for section ${section.code}`);
    return {
      order: section.number,
      code: section.code,
      activePageCount: section.pageReferenceCount,
      firstActiveAnimationId: first.animationId,
      labels: {
        en: sourceLabel(section.titleEnglish),
        es: sourceLabel(section.titleSpanish, true),
      },
    };
  });
  await synchronize(
    GENERATED_DATA_PATH,
    generatedDataSource({
      calibrationId,
      freezePath,
      freezeSha256,
      pages,
      sections,
      scope,
    }),
    check,
  );

  return {
    scope,
    calibrationId,
    registered: selectedPages.length,
    activePages: 56,
    courseShellCount: 0,
    freezePath,
    freezeSha256,
    check,
  };
}

const options = parseArguments(process.argv.slice(2));
if (options.help) process.stdout.write(`${usage()}\n`);
else build(options).then((result) => {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}).catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
