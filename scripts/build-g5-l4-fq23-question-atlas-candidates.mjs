#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {Script} from "node:vm";
import {gunzipSync} from "node:zlib";
import {fileURLToPath} from "node:url";

import {chromium} from "playwright";

import {
  buildSafeRuntime,
  validateAdapterAuditEvidence,
} from "./build-safe-ffdec-canvas-adapter.mjs";

const execFile = promisify(execFileCallback);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");
const GENERATOR_PATH =
  "scripts/build-g5-l4-fq23-question-atlas-candidates.mjs";
const SAFE_ADAPTER_PATH = "scripts/build-safe-ffdec-canvas-adapter.mjs";
const DEFAULT_SPEC_PATHS = Object.freeze([
  "migrations/course-g05-l04-fq-002/audit/question-atlas-current-js-candidate-spec.json",
  "migrations/course-g05-l04-fq-003/audit/question-atlas-current-js-candidate-spec.json",
]);
const EXPECTED_IDS = new Set([
  "course-g05-l04-fq-002",
  "course-g05-l04-fq-003",
]);
const EXPECTED_CLASSIFICATION =
  "source-static-question-atlas-inspection-current-javascript-engineering-candidate-only";
const EXPECTED_FFDEC_VERSION = "JPEXS Free Flash Decompiler v.26.2.1";
const EXPECTED_SCENARIO = "source-static-question-atlas-inspection";
const SOURCE_FRAME_DOMAIN = "sprite-694";
const ATLAS_FRAME_DOMAIN = "sprite-694-question-atlas";
const QUESTION_LABELS = Object.freeze(
  Array.from({length: 18}, (_, index) => `Q${index + 1}`),
);
const HIDDEN_FINISH_PLACEMENT =
  /^[\t ]*place\("sprite16",canvas,ctx,\[0\.05,0\.0,0\.0,0\.05,-158\.25,-58\.05\],ctrans,1,\([01]\+time\)%2,0,time\);$/gm;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function validateHash(value, label) {
  invariant(/^[a-f0-9]{64}$/.test(value ?? ""), `${label}: invalid SHA-256`);
}

function projectPath(relativePath, label = "project path") {
  invariant(
    typeof relativePath === "string" && relativePath.length > 0,
    `${label}: path is required`,
  );
  invariant(!path.isAbsolute(relativePath), `${label}: absolute path is forbidden`);
  const absolutePath = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, absolutePath);
  invariant(
    relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative),
    `${label}: path escapes the project`,
  );
  return absolutePath;
}

function validateEvidenceBinding(spec, pathKey, hashKey, label) {
  invariant(
    typeof spec.evidence?.[pathKey] === "string" &&
      spec.evidence[pathKey].length > 0,
    `${spec.animationId}: ${label} path is required`,
  );
  validateHash(spec.evidence?.[hashKey], `${spec.animationId}: ${label}`);
}

export function validateQuestionAtlasSpec(spec) {
  invariant(spec?.schemaVersion === 1, "question-atlas spec schemaVersion must be 1");
  invariant(EXPECTED_IDS.has(spec.animationId), "question-atlas animationId is not allowlisted");
  invariant(
    spec.classification === EXPECTED_CLASSIFICATION,
    `${spec.animationId}: engineering-only classification changed`,
  );
  invariant(
    typeof spec.title === "string" && spec.title.length > 0,
    `${spec.animationId}: title is required`,
  );

  const suffix = spec.animationId.endsWith("002") ? "02" : "03";
  const sourcePrefix =
    "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR5/L4/FQ/";
  invariant(
    spec.source?.swf === `${sourcePrefix}L4FQ${suffix}.swf` &&
      spec.source.fla === `${sourcePrefix}L4FQ${suffix}.fla`,
    `${spec.animationId}: source paths changed`,
  );
  for (const [key, label] of [
    ["swfSha256", "source SWF"],
    ["flaSha256", "source FLA"],
  ]) validateHash(spec.source?.[key], `${spec.animationId}: ${label}`);
  invariant(
    Number.isSafeInteger(spec.source.swfBytes) && spec.source.swfBytes > 0 &&
      Number.isSafeInteger(spec.source.flaBytes) && spec.source.flaBytes > 0 &&
      spec.source.associatedAudio === null,
    `${spec.animationId}: source byte/audio boundary changed`,
  );

  for (const [pathKey, hashKey, label] of [
    ["migrationManifest", "migrationManifestSha256", "migration manifest"],
    ["scenarioInventory", "scenarioInventorySha256", "scenario inventory"],
    ["audioAudit", "audioAuditSha256", "audio audit"],
    ["frameDomainDisposition", "frameDomainDispositionSha256", "frame-domain disposition"],
    ["ffdecScripts", "ffdecScriptsSha256", "FFDec scripts"],
    ["swfmillStructure", "swfmillStructureSha256", "swfmill structure"],
  ]) validateEvidenceBinding(spec, pathKey, hashKey, label);

  const ffdec = spec.ffdecExport;
  invariant(
    ffdec?.tool === EXPECTED_FFDEC_VERSION &&
      ffdec.targetSpriteObjectId === 694 &&
      ffdec.targetSpriteFunction === "sprite694" &&
      ffdec.helperBytes === 52_872 &&
      ffdec.framesHtmlBytes === 1_012_794 &&
      JSON.stringify(ffdec.exportCanvas) ===
        JSON.stringify({width: 1718, height: 567}) &&
      JSON.stringify(ffdec.exportInternalTranslation) ===
        JSON.stringify({x: 1080.3, y: 287.5}),
    `${spec.animationId}: FFDec export identity changed`,
  );
  for (const [key, label] of [
    ["helperSha256", "FFDec helper"],
    ["framesHtmlSha256", "FFDec frames HTML"],
    ["expectedPlacedFunctionsSha256", "placed-function allowlist"],
    ["expectedFontFunctionsSha256", "font-function allowlist"],
    ["embeddedImageVariablesSha256", "embedded-image allowlist"],
  ]) validateHash(ffdec?.[key], `${spec.animationId}: ${label}`);
  invariant(
    ffdec.expectedPlacedFunctionCount === 671 &&
      ffdec.expectedFontFunctionCount === 8 &&
      ffdec.embeddedImageVariableCount === 0,
    `${spec.animationId}: FFDec definition counts changed`,
  );
  invariant(
    EXPECTED_IDS.has(ffdec.staticDrawingEqualsSibling?.animationId) &&
      ffdec.staticDrawingEqualsSibling.animationId !== spec.animationId &&
      ffdec.staticDrawingEqualsSibling.helperSha256 === ffdec.helperSha256 &&
      ffdec.staticDrawingEqualsSibling.framesHtmlSha256 ===
        ffdec.framesHtmlSha256,
    `${spec.animationId}: sibling static-drawing equivalence binding changed`,
  );

  invariant(
    JSON.stringify(spec.timeline?.stage) ===
      JSON.stringify({width: 800, height: 600, backgroundColor: "#b8d8f7"}) &&
      spec.timeline.fps === 12,
    `${spec.animationId}: stage/FPS contract changed`,
  );
  invariant(
    JSON.stringify(spec.timeline.root) ===
      JSON.stringify({
        frameCount: 10,
        preloaderStopFrame: 1,
        beginFrame: 6,
        beginLabel: "Begin",
        placementName: "animation",
        placementTwips: {x: 7350, y: 4322},
        placementPixels: {x: 367.5, y: 216.1},
      }) &&
      JSON.stringify(spec.timeline.local) ===
        JSON.stringify({
          timelineId: SOURCE_FRAME_DOMAIN,
          frameCount: 56,
          playbackMode: "state-explorer",
          publicFrameIndexing: "one-indexed",
        }) &&
      JSON.stringify(spec.timeline.stageRenderOffset) ===
        JSON.stringify({x: -712.8, y: -71.4}),
    `${spec.animationId}: root/local timeline contract changed`,
  );

  const runtime = spec.runtimeContract;
  invariant(
    runtime?.kind === "structural-local-frame" &&
      runtime.defaultScenario === EXPECTED_SCENARIO &&
      JSON.stringify(runtime.scenarios) === JSON.stringify([EXPECTED_SCENARIO]) &&
      JSON.stringify(runtime.supportedLanguages) === JSON.stringify(["en"]),
    `${spec.animationId}: runtime identity changed`,
  );
  invariant(
    JSON.stringify(runtime.blockedLocalFrameRanges?.map((range) => [
      range.firstFrame,
      range.lastFrame,
    ])) === JSON.stringify([[1, 1], [20, 56]]),
    `${spec.animationId}: fail-closed source frame ranges changed`,
  );
  const atlas = runtime.publicQuestionAtlas;
  invariant(
    atlas?.frameDomain === ATLAS_FRAME_DOMAIN &&
      atlas.frameCount === 18 && atlas.firstFrame === 1 && atlas.lastFrame === 18 &&
      atlas.sourceTimelineId === SOURCE_FRAME_DOMAIN &&
      atlas.sourceFirstFrame === 2 && atlas.sourceLastFrame === 19 &&
      atlas.mapping === "source-frame-equals-atlas-frame-plus-one" &&
      JSON.stringify(atlas.labels) === JSON.stringify(QUESTION_LABELS),
    `${spec.animationId}: public question-atlas mapping changed`,
  );
  invariant(
    JSON.stringify(runtime.sourceStaticStructure) === JSON.stringify({
      sourceTimelineId: SOURCE_FRAME_DOMAIN,
      sourceFrameCount: 56,
      doActionFrames: [1, 21, 37],
      placeObject2Count: 861,
      removeObject2Count: 637,
      livePlaybackEndFrame: 1,
      sequentialPlaybackPermitted: false,
    }),
    `${spec.animationId}: source-static branch-atlas structure changed`,
  );
  const behavior = runtime.sourceSelectionBehavior;
  if (spec.animationId.endsWith("002")) {
    invariant(
      behavior?.kind === "random-without-replacement" &&
        behavior.sourceQuestionCount === 18 &&
        behavior.sourcePresentedQuestionCount === 10 &&
        behavior.sourceExpression === "random(_global.quizLabelArray.length)",
      `${spec.animationId}: source random-selection contract changed`,
    );
  } else {
    invariant(
      behavior?.kind === "sequential" &&
        behavior.sourceQuestionCount === 18 &&
        behavior.sourcePresentedQuestionCount === 18 &&
        behavior.sourceExpression ===
          "_global.quizLabelArray[_global.totQuizCount - 1]",
      `${spec.animationId}: source sequential-selection contract changed`,
    );
  }
  invariant(
    behavior.executedByCandidate === false &&
      JSON.stringify(runtime.sourceHiddenSuppression) ===
        JSON.stringify({
          instanceName: "Mc_Finish",
          objectId: 16,
          sourcePlacementFrame: 1,
          sourcePlacementDepth: 225,
          sourceStatement: "Mc_Finish._visible = false;",
          drawingFunction: "sprite16",
          expectedSuppressedPlacementCount: 55,
        }),
    `${spec.animationId}: source-hidden suppression contract changed`,
  );
  for (const key of [
    "legacyActionScriptExecuted",
    "naturalSelectionEnabled",
    "answerControlsEnabled",
    "scoringEnabled",
    "reviewEnabled",
    "audioEnabled",
    "timingEnabled",
    "reportingNetworkEnabled",
    "replayEnabled",
    "spanishEnabled",
  ]) invariant(runtime[key] === false, `${spec.animationId}: ${key} must remain false`);
  invariant(
    Array.isArray(runtime.unresolved) && runtime.unresolved.length >= 7,
    `${spec.animationId}: unresolved obligations are incomplete`,
  );

  const outputPrefix = `public/flash-assets/courses/${spec.animationId}/`;
  invariant(
    spec.output?.script === `${outputPrefix}canvas-renderer.js` &&
      spec.output.manifest === `${outputPrefix}manifest.json` &&
      spec.output.report ===
        `migrations/${spec.animationId}/evidence/question-atlas-current-js-candidate.json` &&
      spec.output.globalRegistry === "HELP_MATH_CANVAS_ASSETS",
    `${spec.animationId}: output contract changed`,
  );
  invariant(
    Object.keys(spec.acceptanceEffects ?? {}).length >= 20 &&
      Object.values(spec.acceptanceEffects).every((value) => value === false) &&
      spec.strictAcceptanceEffect === "none",
    `${spec.animationId}: acceptance effects must remain false`,
  );
  return spec;
}

async function readBinding(relativePath, expected = {}) {
  const absolutePath = projectPath(relativePath, relativePath);
  const [metadata, canonical] = await Promise.all([
    lstat(absolutePath),
    realpath(absolutePath),
  ]);
  invariant(metadata.isFile(), `${relativePath}: expected a regular file`);
  invariant(canonical === absolutePath, `${relativePath}: path alias is forbidden`);
  const bytes = await readFile(absolutePath);
  const binding = {
    path: relativePath,
    bytes: bytes.length,
    sha256: sha256(bytes),
    contents: bytes,
  };
  if (expected.bytes !== undefined) {
    invariant(binding.bytes === expected.bytes, `${relativePath}: byte count drifted`);
  }
  if (expected.sha256 !== undefined) {
    invariant(binding.sha256 === expected.sha256, `${relativePath}: SHA-256 drifted`);
  }
  return binding;
}

function withoutContents(binding) {
  const {contents: _contents, ...metadata} = binding;
  return metadata;
}

async function inspectFfdec(command) {
  const result = await execFile(command, ["-help"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  invariant(
    `${result.stdout}\n${result.stderr}`.includes(EXPECTED_FFDEC_VERSION),
    `FFDec version changed; expected ${EXPECTED_FFDEC_VERSION}`,
  );
  return {command, version: EXPECTED_FFDEC_VERSION};
}

async function exportSprite({ffdec, sourceSwf, temporaryRoot}) {
  const exportRoot = path.join(temporaryRoot, "sprite-694");
  const result = await execFile(
    ffdec.command,
    [
      "-config", "packJavaScripts=false",
      "-onerror", "abort",
      "-selectid", "694",
      "-format", "sprite:canvas",
      "-export", "sprite",
      exportRoot,
      projectPath(sourceSwf, "source SWF"),
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  invariant(
    `${result.stdout}\n${result.stderr}`.includes(EXPECTED_FFDEC_VERSION),
    `${sourceSwf}: FFDec export version changed`,
  );
  const directory = path.join(exportRoot, "DefineSprite_694");
  const [helper, frames] = await Promise.all([
    readFile(path.join(directory, "canvas.js")),
    readFile(path.join(directory, "frames.html")),
  ]);
  return {helper, frames};
}

function validateStaticEvidence(spec, {
  scenario,
  audio,
  disposition,
  scripts,
  swfmill,
}) {
  validateAdapterAuditEvidence(spec, scenario, audio);
  const local = scenario.timelineInventory?.find(
    (timeline) => timeline.timelineId === SOURCE_FRAME_DOMAIN,
  );
  invariant(local?.objectId === "694" && local.frameCount === 56,
    `${spec.animationId}: sprite-694 evidence changed`);
  const labels = new Map(
    (local.frameLabels ?? []).map((label) => [label.label, label.frame]),
  );
  for (const [index, label] of QUESTION_LABELS.entries()) {
    invariant(labels.get(label) === index + 2,
      `${spec.animationId}: ${label} source-frame mapping changed`);
  }
  invariant(labels.get("Review") === 21 && labels.get("R1") === 38 &&
    labels.get("R18") === 55,
  `${spec.animationId}: review frame boundary changed`);
  invariant(
    local.namedPlacements?.some((placement) =>
      placement.frame === 1 && placement.depth === "225" &&
      placement.name === "Mc_Finish" && placement.objectId === "16"),
    `${spec.animationId}: Mc_Finish placement is unproven`,
  );
  invariant(
    disposition.summary?.dispositionCounts?.unresolved === 149 &&
      disposition.summary.highRiskIndependentCandidates?.some((item) =>
        item.timelineId === SOURCE_FRAME_DOMAIN && item.frameCount === 56),
    `${spec.animationId}: unresolved frame-domain boundary changed`,
  );
  invariant(
    audio.embeddedAudio?.defineSounds?.length === 0 &&
      audio.embeddedAudio?.soundStreams?.length === 0 &&
      audio.externalAudio?.exactAssociations?.length === 0 &&
      audio.externalAudio?.exactCount === 0 &&
      audio.externalAudio?.candidateOnlyCount === 83,
    `${spec.animationId}: audio association boundary changed`,
  );
  invariant(
    scripts.includes("Mc_Result._visible = false;") &&
      scripts.includes("Mc_Finish._visible = false;") &&
      scripts.includes("Mc_Finish.gotoAndStop(1);") &&
      scripts.includes("_global.quizLabelArray = [\"Q1\",\"Q2\",\"Q3\",\"Q4\",\"Q5\",\"Q6\",\"Q7\",\"Q8\",\"Q9\",\"Q10\",\"Q11\",\"Q12\",\"Q13\",\"Q14\",\"Q15\",\"Q16\",\"Q17\",\"Q18\"];") &&
      scripts.includes("QuizReport_URL") && scripts.includes("getURL("),
    `${spec.animationId}: required source script statements changed`,
  );
  const spriteStart = swfmill.indexOf('<DefineSprite objectID="694" frames="56">');
  const spriteEnd = swfmill.indexOf("</DefineSprite>", spriteStart);
  invariant(spriteStart >= 0 && spriteEnd > spriteStart,
    `${spec.animationId}: sprite-694 XML boundary is missing`);
  const spriteXml = swfmill.slice(spriteStart, spriteEnd);
  const doActionCount = [...spriteXml.matchAll(/<DoAction(?:\s|>)/g)].length;
  const placeObject2Count = [...spriteXml.matchAll(/<PlaceObject2(?:\s|>)/g)].length;
  const removeObject2Count = [...spriteXml.matchAll(/<RemoveObject2(?:\s|>)/g)].length;
  invariant(
    doActionCount === 3 &&
      placeObject2Count ===
        spec.runtimeContract.sourceStaticStructure.placeObject2Count &&
      removeObject2Count ===
        spec.runtimeContract.sourceStaticStructure.removeObject2Count,
    `${spec.animationId}: swfmill placement/removal census changed`,
  );
  if (spec.animationId.endsWith("002")) {
    invariant(
      scripts.includes("_global.tempQNo = random(_global.quizLabelArray.length);") &&
        scripts.includes("_global.totalQuestionsCount = 10;"),
      `${spec.animationId}: random 10-of-18 source behavior changed`,
    );
  } else {
    invariant(
      scripts.includes("_global.qLabelName = _global.quizLabelArray[_global.totQuizCount - 1];") &&
        scripts.includes("_global.totalQuestionsCount = 18;") &&
        !/\brandom\s*\(/.test(scripts),
      `${spec.animationId}: sequential 18-of-18 source behavior changed`,
    );
  }
}

function suppressSourceHiddenFinish(framesHtml, spec) {
  const normalized = framesHtml.replace(/\r\n?/g, "\n");
  const matches = [...normalized.matchAll(HIDDEN_FINISH_PLACEMENT)];
  invariant(
    matches.length ===
      spec.runtimeContract.sourceHiddenSuppression.expectedSuppressedPlacementCount,
    `${spec.animationId}: Mc_Finish drawing placement count changed`,
  );
  const transformed = normalized.replace(
    HIDDEN_FINISH_PLACEMENT,
    "\t\t\t// Mc_Finish is source-hidden in the question-atlas inspection state.",
  );
  invariant(
    !HIDDEN_FINISH_PLACEMENT.test(transformed),
    `${spec.animationId}: Mc_Finish suppression is incomplete`,
  );
  return {transformed, suppressedPlacementCount: matches.length};
}

async function runBrowserSweep(browser, runtime, spec) {
  const page = await browser.newPage({viewport: {width: 800, height: 600}});
  const consoleErrors = [];
  const pageErrors = [];
  const networkRequests = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => networkRequests.push(request.url()));
  try {
    await page.setContent(
      '<canvas id="stage" width="800" height="600"></canvas>',
      {waitUntil: "load"},
    );
    await page.addScriptTag({content: runtime});
    const result = await page.evaluate(async ({animationId, scenario}) => {
      const asset = globalThis.HELP_MATH_CANVAS_ASSETS?.[animationId];
      if (!asset) throw new Error("question-atlas runtime did not register");
      await asset.ready();
      const canvas = document.getElementById("stage");
      const context = canvas.getContext("2d", {willReadFrequently: true});
      const frames = [];
      for (let atlasFrame = 1; atlasFrame <= 18; atlasFrame += 1) {
        const sourceFrame = atlasFrame + 1;
        const state = asset.render(canvas, {
          frame: sourceFrame,
          scenario,
          lang: "en",
          seed: 0,
        });
        if (
          state.localFrame !== sourceFrame ||
          state.exportFrame !== atlasFrame ||
          state.frameDomain !== "sprite-694" ||
          state.rootFrame !== 6 ||
          state.scenario !== scenario ||
          state.lang !== "en" ||
          state.seed !== 0 ||
          state.audioRendered !== false
        ) {
          throw new Error(
            `question-atlas deterministic identity mismatch at atlas frame ${atlasFrame}`,
          );
        }
        if (
          canvas.getAttribute("data-flash-frame") !== String(sourceFrame) ||
          canvas.getAttribute("data-flash-frame-domain") !== "sprite-694" ||
          canvas.getAttribute("data-flash-root-frame") !== "6" ||
          canvas.getAttribute("data-runtime-scenario") !== scenario ||
          canvas.getAttribute("data-runtime-seed") !== "0"
        ) {
          throw new Error(
            `question-atlas canvas identity mismatch at atlas frame ${atlasFrame}`,
          );
        }
        const pixels = context.getImageData(0, 0, 800, 600).data;
        let opaquePixelCount = 0;
        let fnv1a32 = 2166136261;
        for (let index = 0; index < pixels.length; index += 4) {
          fnv1a32 ^= pixels[index];
          fnv1a32 = Math.imul(fnv1a32, 16777619);
          fnv1a32 ^= pixels[index + 1];
          fnv1a32 = Math.imul(fnv1a32, 16777619);
          fnv1a32 ^= pixels[index + 2];
          fnv1a32 = Math.imul(fnv1a32, 16777619);
          fnv1a32 ^= pixels[index + 3];
          fnv1a32 = Math.imul(fnv1a32, 16777619);
          if (pixels[index + 3] === 255) opaquePixelCount += 1;
        }
        frames.push({
          atlasFrame,
          questionLabel: `Q${atlasFrame}`,
          sourceFrame,
          sourceExportFrame: atlasFrame,
          rgbaFnv1a32: (fnv1a32 >>> 0).toString(16).padStart(8, "0"),
          opaquePixelCount,
          pngDataUrl: canvas.toDataURL("image/png"),
        });
      }

      const rejectedRequests = [
        {frame: 0, scenario, lang: "en", seed: 0},
        {frame: 1, scenario, lang: "en", seed: 0},
        {frame: 20, scenario, lang: "en", seed: 0},
        {frame: 56, scenario, lang: "en", seed: 0},
        {frame: 57, scenario, lang: "en", seed: 0},
        {frame: 2, scenario: "default", lang: "en", seed: 0},
        {frame: 2, scenario, lang: "es", seed: 0},
        {frame: 2, scenario, lang: "en", seed: 0.5},
      ];
      let rejectedOperationCount = 0;
      for (const request of rejectedRequests) {
        for (const operation of ["resolve", "render"]) {
          try {
            if (operation === "resolve") asset.resolveFrameState(request);
            else asset.render(canvas, request);
          } catch {
            rejectedOperationCount += 1;
            continue;
          }
          throw new Error(
            `${operation} accepted blocked request ${JSON.stringify(request)}`,
          );
        }
      }
      return {
        frames,
        rejectedRequestCount: rejectedRequests.length,
        rejectedOperationCount,
        expectedRejectedOperationCount: rejectedRequests.length * 2,
      };
    }, {
      animationId: spec.animationId,
      scenario: EXPECTED_SCENARIO,
    });

    const frames = result.frames.map(({pngDataUrl, ...frame}) => {
      invariant(
        typeof pngDataUrl === "string" &&
          pngDataUrl.startsWith("data:image/png;base64,"),
        `${spec.animationId}: Chromium did not return a PNG frame`,
      );
      const png = Buffer.from(pngDataUrl.slice(pngDataUrl.indexOf(",") + 1), "base64");
      return {...frame, pngBytes: png.length, pngSha256: sha256(png)};
    });
    invariant(
      frames.length === 18 &&
        frames.every((frame, index) =>
          frame.atlasFrame === index + 1 &&
          frame.sourceFrame === index + 2 &&
          frame.sourceExportFrame === index + 1 &&
          frame.questionLabel === `Q${index + 1}` &&
          frame.opaquePixelCount === 800 * 600 &&
          frame.pngBytes > 0 && /^[a-f0-9]{64}$/.test(frame.pngSha256)),
      `${spec.animationId}: Chromium 18-page sweep was incomplete`,
    );
    invariant(
      new Set(frames.map((frame) => frame.pngSha256)).size >= 2,
      `${spec.animationId}: Chromium atlas pages were unexpectedly pixel-invariant`,
    );
    invariant(
      result.rejectedOperationCount === result.expectedRejectedOperationCount,
      `${spec.animationId}: browser fail-closed request sweep was incomplete`,
    );
    invariant(
      consoleErrors.length === 0 && pageErrors.length === 0 &&
        networkRequests.length === 0,
      `${spec.animationId}: browser safety failed: console=${consoleErrors.join("; ")} page=${pageErrors.join("; ")} network=${networkRequests.join("; ")}`,
    );
    return {
      scope:
        "asset-level deterministic English source-static question-atlas inspection only; not product QA or acceptance",
      browser: `Chromium ${browser.version()}`,
      nativeStage: {width: 800, height: 600},
      atlasFrameDomain: ATLAS_FRAME_DOMAIN,
      sourceFrameDomain: SOURCE_FRAME_DOMAIN,
      renderedAtlasFrameCount: 18,
      renderedSourceFrameRange: [2, 19],
      deterministicSeed: 0,
      frames,
      rejectedRequestCount: result.rejectedRequestCount,
      rejectedOperationCount: result.rejectedOperationCount,
      consoleErrorCount: 0,
      pageErrorCount: 0,
      unexpectedNetworkRequestCount: 0,
      productQaComplete: false,
      strictAcceptanceEffect: "none",
    };
  } finally {
    await page.close();
  }
}

async function writeOrCheck(relativePath, contents, check) {
  const absolutePath = projectPath(relativePath, "generated output");
  const preserved = path.resolve(ROOT, "source-assets");
  invariant(
    !absolutePath.startsWith(`${preserved}${path.sep}`),
    "generated output may not be written under source-assets",
  );
  if (check) {
    const actual = await readFile(absolutePath);
    invariant(
      actual.equals(Buffer.from(contents)),
      `${relativePath}: generated output is stale`,
    );
  } else {
    await mkdir(path.dirname(absolutePath), {recursive: true});
    await writeFile(absolutePath, contents);
  }
}

export async function buildQuestionAtlasCandidate({
  specPath,
  ffdec,
  browser: suppliedBrowser,
  check = false,
}) {
  const specBinding = await readBinding(specPath);
  const spec = validateQuestionAtlasSpec(
    JSON.parse(specBinding.contents.toString("utf8")),
  );
  const [sourceSwf, sourceFla, migrationManifest, scenario, audio,
    disposition, scripts, swfmill] = await Promise.all([
    readBinding(spec.source.swf, {
      bytes: spec.source.swfBytes,
      sha256: spec.source.swfSha256,
    }),
    readBinding(spec.source.fla, {
      bytes: spec.source.flaBytes,
      sha256: spec.source.flaSha256,
    }),
    readBinding(spec.evidence.migrationManifest, {
      sha256: spec.evidence.migrationManifestSha256,
    }),
    readBinding(spec.evidence.scenarioInventory, {
      sha256: spec.evidence.scenarioInventorySha256,
    }),
    readBinding(spec.evidence.audioAudit, {
      sha256: spec.evidence.audioAuditSha256,
    }),
    readBinding(spec.evidence.frameDomainDisposition, {
      sha256: spec.evidence.frameDomainDispositionSha256,
    }),
    readBinding(spec.evidence.ffdecScripts, {
      sha256: spec.evidence.ffdecScriptsSha256,
    }),
    readBinding(spec.evidence.swfmillStructure, {
      sha256: spec.evidence.swfmillStructureSha256,
    }),
  ]);
  const parsedScenario = JSON.parse(scenario.contents.toString("utf8"));
  const parsedAudio = JSON.parse(audio.contents.toString("utf8"));
  const parsedDisposition = JSON.parse(disposition.contents.toString("utf8"));
  const scriptText = gunzipSync(scripts.contents).toString("utf8");
  const swfmillText = gunzipSync(swfmill.contents).toString("utf8");
  validateStaticEvidence(spec, {
    scenario: parsedScenario,
    audio: parsedAudio,
    disposition: parsedDisposition,
    scripts: scriptText,
    swfmill: swfmillText,
  });

  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), `${spec.animationId}-question-atlas-`),
  );
  let ownedBrowser = null;
  try {
    ownedBrowser = suppliedBrowser ? null : await chromium.launch({headless: true});
    const browser = suppliedBrowser ?? ownedBrowser;
    const exported = await exportSprite({
      ffdec,
      sourceSwf: spec.source.swf,
      temporaryRoot,
    });
    invariant(
      exported.helper.length === spec.ffdecExport.helperBytes &&
        sha256(exported.helper) === spec.ffdecExport.helperSha256,
      `${spec.animationId}: FFDec helper export changed`,
    );
    invariant(
      exported.frames.length === spec.ffdecExport.framesHtmlBytes &&
        sha256(exported.frames) === spec.ffdecExport.framesHtmlSha256,
      `${spec.animationId}: FFDec frames export changed`,
    );
    const suppression = suppressSourceHiddenFinish(
      exported.frames.toString("utf8"),
      spec,
    );
    const {runtime, metadata, placedFunctions, imageVariables} =
      buildSafeRuntime({
        helperSource: exported.helper.toString("utf8"),
        framesHtml: suppression.transformed,
        spec,
      });
    invariant(
      !runtime.includes(
        'place("sprite16",canvas,ctx,[0.05,0.0,0.0,0.05,-158.25,-58.05]',
      ),
      `${spec.animationId}: generated runtime retained Mc_Finish drawing calls`,
    );
    new Script(runtime, {filename: path.basename(spec.output.script)});
    const runtimeBytes = Buffer.from(runtime);
    const browserQa = await runBrowserSweep(browser, runtime, spec);
    const atlas = spec.runtimeContract.publicQuestionAtlas;
    const manifest = {
      schemaVersion: 1,
      animationId: spec.animationId,
      classification: spec.classification,
      authority:
        "Hash-bound English source-static question drawing atlas for inspection only; not a quiz runtime, original-runtime baseline, fidelity acceptance, or release artifact.",
      generator: GENERATOR_PATH,
      safeDrawingAdapter: SAFE_ADAPTER_PATH,
      inputs: {
        spec: withoutContents(specBinding),
        sourceSwf: withoutContents(sourceSwf),
        sourceFla: withoutContents(sourceFla),
        migrationManifest: withoutContents(migrationManifest),
        scenarioInventory: withoutContents(scenario),
        audioAudit: withoutContents(audio),
        frameDomainDisposition: withoutContents(disposition),
        ffdecScripts: withoutContents(scripts),
        swfmillStructure: withoutContents(swfmill),
        ffdecExport: {
          tool: ffdec.version,
          objectId: 694,
          helper: {
            bytes: exported.helper.length,
            sha256: sha256(exported.helper),
          },
          framesHtml: {
            bytes: exported.frames.length,
            sha256: sha256(exported.frames),
          },
        },
      },
      transformation: {
        kind: "source-proven-hidden-instance-suppression",
        instanceName: "Mc_Finish",
        objectId: 16,
        sourceStatement:
          spec.runtimeContract.sourceHiddenSuppression.sourceStatement,
        suppressedDrawingFunction: "sprite16",
        suppressedPlacementCount: suppression.suppressedPlacementCount,
        transformedFramesHtmlSha256: sha256(suppression.transformed),
        allOtherFfdecDrawingDefinitionsPreserved: true,
      },
      output: {
        script: spec.output.script,
        bytes: runtimeBytes.length,
        sha256: sha256(runtimeBytes),
        globalRegistry: spec.output.globalRegistry,
      },
      safety: {
        noLegacyActionScriptExecuted: true,
        noDynamicEvaluation: true,
        noNetworkPrimitives: true,
        noTimersOrAutoplay: true,
        noPersistentStorage: true,
        noAmbientDomListeners: true,
        sourceHiddenFinishRemovedFromDrawingGraph: true,
        drawingObjectAllowlistCount: placedFunctions.length,
        drawingObjectAllowlistSha256: sha256(JSON.stringify(placedFunctions)),
        embeddedImages: imageVariables,
      },
      sourceTimeline: metadata,
      questionAtlas: {
        frameDomain: atlas.frameDomain,
        frameCount: atlas.frameCount,
        sourceTimelineId: atlas.sourceTimelineId,
        sourceFrameRange: [atlas.sourceFirstFrame, atlas.sourceLastFrame],
        mapping: atlas.mapping,
        labels: atlas.labels,
        internalAssetRequestsUseSourceFrameNumbers: true,
        sourceStaticStructure: spec.runtimeContract.sourceStaticStructure,
      },
      sourceSelectionBehavior: spec.runtimeContract.sourceSelectionBehavior,
      browserQa,
      unresolved: spec.runtimeContract.unresolved,
      acceptanceEffects: spec.acceptanceEffects,
      strictAcceptanceEffect: "none",
    };
    const report = {
      schemaVersion: 1,
      evidenceType:
        "source-static-question-atlas-current-javascript-engineering-candidate",
      animationId: spec.animationId,
      classification: spec.classification,
      currentJavaScriptOutputPresent: true,
      engineeringCandidateOnly: true,
      source: {
        swf: withoutContents(sourceSwf),
        fla: withoutContents(sourceFla),
      },
      staticDrawingRelationship: {
        siblingAnimationId:
          spec.ffdecExport.staticDrawingEqualsSibling.animationId,
        ffdecHelperSha256: spec.ffdecExport.helperSha256,
        ffdecFramesHtmlSha256: spec.ffdecExport.framesHtmlSha256,
        scope:
          spec.ffdecExport.staticDrawingEqualsSibling.scope,
        wholeSwfOrBehaviorEqualityClaimed: false,
      },
      questionAtlas: manifest.questionAtlas,
      sourceSelectionBehavior: spec.runtimeContract.sourceSelectionBehavior,
      transformation: manifest.transformation,
      safety: manifest.safety,
      browserQa,
      output: manifest.output,
      unresolved: spec.runtimeContract.unresolved,
      acceptanceEffects: spec.acceptanceEffects,
      strictAcceptanceEffect: "none",
    };
    await Promise.all([
      writeOrCheck(spec.output.script, runtimeBytes, check),
      writeOrCheck(spec.output.manifest, stableJson(manifest), check),
      writeOrCheck(spec.output.report, stableJson(report), check),
    ]);
    return {
      animationId: spec.animationId,
      check,
      questionAtlasFrames: 18,
      sourceFrameRange: [2, 19],
      sourceSelectionKind:
        spec.runtimeContract.sourceSelectionBehavior.kind,
      outputScript: spec.output.script,
      outputSha256: manifest.output.sha256,
      outputBytes: manifest.output.bytes,
      suppressedMcFinishPlacements:
        suppression.suppressedPlacementCount,
      browserQa,
      strictAcceptanceEffect: "none",
    };
  } finally {
    if (ownedBrowser) await ownedBrowser.close();
    await rm(temporaryRoot, {recursive: true, force: true});
  }
}

export function parseArguments(argv) {
  const options = {
    check: false,
    ffdec: "ffdec",
    specs: [...DEFAULT_SPEC_PATHS],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
    } else if (argument === "--ffdec" || argument === "--spec") {
      const value = argv[index + 1];
      invariant(value && !value.startsWith("-"), `${argument} requires one value`);
      if (argument === "--ffdec") options.ffdec = value;
      else options.specs = [value];
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      options.help = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

export async function buildQuestionAtlasCandidates(options = {}) {
  const ffdec = await inspectFfdec(options.ffdec ?? "ffdec");
  const specPaths = options.specs ?? [...DEFAULT_SPEC_PATHS];
  const results = [];
  const browser = await chromium.launch({headless: true});
  try {
    for (const specPath of specPaths) {
      results.push(await buildQuestionAtlasCandidate({
        specPath,
        ffdec,
        browser,
        check: options.check ?? false,
      }));
    }
  } finally {
    await browser.close();
  }
  invariant(
    specPaths.length !== DEFAULT_SPEC_PATHS.length ||
      new Set(results.map((result) => result.animationId)).size === 2,
    "default question-atlas run did not produce two distinct candidates",
  );
  if (results.length === 2) {
    invariant(
      JSON.stringify(results[0].browserQa.frames.map((frame) => frame.pngSha256)) ===
        JSON.stringify(results[1].browserQa.frames.map((frame) => frame.pngSha256)),
      "FQ002/FQ003 hash-identical source-static drawing exports rendered differently",
    );
  }
  return {
    check: options.check ?? false,
    ffdec: ffdec.version,
    chromium: results[0]?.browserQa.browser ?? null,
    siblingAtlasPixelsEqual: results.length === 2,
    results,
  };
}

function usage() {
  return [
    "Usage: node scripts/build-g5-l4-fq23-question-atlas-candidates.mjs [options]",
    "",
    "Options:",
    "  --check         Verify generated runtime, manifest, and report are current",
    "  --ffdec <path>  FFDec executable (default: ffdec)",
    "  --spec <path>   Build one allowlisted spec instead of both defaults",
  ].join("\n");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  console.log(JSON.stringify(await buildQuestionAtlasCandidates(options), null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
