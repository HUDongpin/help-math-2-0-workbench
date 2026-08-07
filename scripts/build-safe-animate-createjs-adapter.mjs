#!/usr/bin/env node

import {createHash} from "node:crypto";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_SPEC = "migrations/course-g03-l01-vb-004/audit/animate-createjs-adapter-spec.json";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function portable(value) {
  return value.split(path.sep).join("/");
}

function resolveProjectPath(root, relativePath, label) {
  assert(typeof relativePath === "string" && relativePath.length > 0, `${label}: path is required`);
  assert(!path.isAbsolute(relativePath), `${label}: path must be project-relative`);
  const resolved = path.resolve(root, relativePath);
  assert(resolved.startsWith(`${root}${path.sep}`), `${label}: path escapes the project root`);
  return resolved;
}

function assertHash(value, expected, label) {
  const observed = sha256(value);
  assert(observed === expected, `${label}: SHA-256 mismatch (expected ${expected}, observed ${observed})`);
  return observed;
}

function assertPngDimensions(buffer, width, height, label) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert(buffer.length >= 24 && buffer.subarray(0, 8).equals(signature), `${label}: not a PNG`);
  assert(buffer.readUInt32BE(16) === width && buffer.readUInt32BE(20) === height, `${label}: unexpected PNG dimensions`);
}

function scenarioById(spec, scenarioId) {
  return spec.runtimeContract.scenarios.find((scenario) => scenario.id === scenarioId);
}

export function validateSpec(spec) {
  assert(spec?.schemaVersion === 1, "adapter spec: schemaVersion must be 1");
  assert(spec.animationId === "course-g03-l01-vb-004", "adapter spec: unexpected animationId");
  for (const [label, value] of [
    ["FLA", spec.source?.flaSha256],
    ["SWF", spec.source?.swfSha256],
    ["Animate JavaScript", spec.authoringExport?.javascriptSha256],
    ["glyph export", spec.glyphEvidence?.framesHtmlSha256],
    ["EaselJS", spec.createjs?.easeljs?.sha256],
    ["TweenJS", spec.createjs?.tweenjs?.sha256],
    ["license", spec.createjs?.licenseSha256],
    ["scenario inventory", spec.evidence?.scenarioInventorySha256],
    ["FFDec scripts", spec.evidence?.ffdecScriptsSha256],
    ["audio audit", spec.evidence?.audioAuditSha256],
    ["authoring audit", spec.evidence?.authoringAuditSha256],
    ["Adobe standalone baseline", spec.evidence?.adobeStandaloneBaselineSha256]
  ]) {
    assert(/^[a-f0-9]{64}$/.test(value || ""), `adapter spec: invalid ${label} SHA-256`);
  }
  assert(spec.timeline?.stage?.width === 800 && spec.timeline?.stage?.height === 600, "adapter spec: stage must be 800x600");
  assert(spec.timeline?.fps === 12, "adapter spec: FPS must be 12");
  assert(spec.timeline?.root?.frameCount === 10 && spec.timeline.root.beginFrame === 6, "adapter spec: root timeline changed");
  assert(spec.timeline?.local?.timelineId === "sprite-231" && spec.timeline.local.objectId === 231, "adapter spec: local timeline identity changed");
  assert(spec.timeline.local.frameCount === 222 && spec.timeline.local.quizStopFrame === 56, "adapter spec: local frame contract changed");
  assert(/^#[A-Fa-f0-9]{6}$/.test(spec.timeline.stage.backgroundColor), "adapter spec: invalid stage background");
  assert(Array.isArray(spec.authoringExport?.atlases) && spec.authoringExport.atlases.length === 2, "adapter spec: exactly two atlases are required");
  for (const atlas of spec.authoringExport.atlases) {
    assert(/^[a-f0-9]{64}$/.test(atlas.sha256 || ""), `adapter spec: invalid atlas hash for ${atlas.id}`);
    assert(Number.isSafeInteger(atlas.width) && Number.isSafeInteger(atlas.height), `adapter spec: invalid atlas dimensions for ${atlas.id}`);
  }
  const scenarios = spec.runtimeContract?.scenarios || [];
  assert(scenarios.length === 3, "adapter spec: expected three explicit scenarios");
  assert(scenarioById(spec, spec.runtimeContract.defaultScenario), "adapter spec: default scenario is not defined");
  assert(spec.runtimeContract.defaultFrameDomain === "sprite-231", "adapter spec: default frame domain changed");
  assert(JSON.stringify(spec.runtimeContract.supportedLanguages) === JSON.stringify(["en", "es"]), "adapter spec: source-shared untranslated visual languages changed");
  assert(spec.runtimeContract.visualLocalizationStatus === "source-shared-untranslated-visual", "adapter spec: visual localization boundary changed");
  assert(spec.runtimeContract.audioLocalizationStatus === "unresolved", "adapter spec: audio localization must remain unresolved");
  assert(spec.evidence.ffdecExportedScriptCount === 37, "adapter spec: exhaustive FFDec script count changed");
  assert(spec.evidence.visualLanguageBranchStatus === "none-observed-in-exhaustive-37-script-export", "adapter spec: visual language-branch boundary changed");
  const linear = scenarioById(spec, "linear-to-quiz-stop");
  const inspection = scenarioById(spec, "authoring-frame-inspection");
  const root = scenarioById(spec, "root-standalone");
  assert(linear?.frameDomain === "sprite-231" && linear.frameEndInclusive === 222 && linear.naturalPlaybackEndFrame === 56, "adapter spec: linear addressability/natural-stop contract changed");
  assert(inspection?.frameDomain === "sprite-231" && inspection.frameEndInclusive === 222, "adapter spec: inspection scenario must cover 222 structural frames");
  assert(root?.frameDomain === "root" && root.frameStart === 1 && root.frameEndInclusive === 10 && root.naturalPlaybackEndFrame === 1, "adapter spec: root standalone contract changed");
  const functions = spec.glyphEvidence?.functions || [];
  const placements = spec.glyphEvidence?.placements || [];
  assert(functions[0] === "font1" && functions.length === 16, "adapter spec: authoritative vector function allowlist changed");
  assert(placements.length === 14, "adapter spec: authoritative chart placement count changed");
  for (const placement of placements) {
    assert(functions.includes(placement.function), `adapter spec: placement function ${placement.function} is not allowlisted`);
    assert(Array.isArray(placement.matrix) && placement.matrix.length === 6 && placement.matrix.every(Number.isFinite), `adapter spec: invalid matrix for ${placement.function}`);
  }
  const instruction = spec.glyphEvidence?.instruction;
  assert(instruction?.textFunction === "text8" && functions.includes(instruction.textFunction), "adapter spec: authoritative instruction text function changed");
  for (const [label, matrix] of [
    ["instruction text", instruction?.textMatrix],
    ["instruction underline", instruction?.underlineMatrix]
  ]) {
    assert(Array.isArray(matrix) && matrix.length === 6 && matrix.every(Number.isFinite), `adapter spec: invalid ${label} matrix`);
  }
  assert(Number.isFinite(instruction?.placement?.x) && Number.isFinite(instruction?.placement?.y), "adapter spec: invalid instruction placement");
  assert(
    Array.isArray(instruction?.underlineSegments) &&
      instruction.underlineSegments.length === 3 &&
      instruction.underlineSegments.every((segment) => Array.isArray(segment) && segment.length === 4 && segment.every(Number.isFinite)),
    "adapter spec: invalid instruction underline segments"
  );
  assert(
    Array.isArray(instruction?.strokeColor) &&
      instruction.strokeColor.length === 4 &&
      instruction.strokeColor.every(Number.isFinite),
    "adapter spec: invalid instruction underline color"
  );
  assert(instruction?.unscaledLineWidth === 20, "adapter spec: instruction hairline conversion changed");
  assert(
    JSON.stringify(instruction?.rootPartialRevealFrames?.map(({frame, clipRightExclusive}) => ({frame, clipRightExclusive}))) ===
      JSON.stringify([
        {frame: 7, clipRightExclusive: 291},
        {frame: 8, clipRightExclusive: 361}
      ]),
    "adapter spec: standalone partial instruction reveal evidence changed"
  );
  for (const reveal of instruction.rootPartialRevealFrames) {
    const bounds = reveal.baselineVisibleBounds;
    assert(
      bounds?.x === 80 &&
        bounds?.y === 145 &&
        bounds?.width === reveal.clipRightExclusive - bounds.x &&
        bounds?.height === 21,
      `adapter spec: invalid baseline instruction bounds for root frame ${reveal.frame}`
    );
  }
  assert(JSON.stringify(instruction?.rootFullRevealFrames) === JSON.stringify([9, 10]), "adapter spec: standalone instruction reveal evidence changed");
  assert(JSON.stringify(spec.glyphEvidence.fadeAlphaMultipliers) === JSON.stringify([0, 51, 102, 154, 205, 256]), "adapter spec: chart fade evidence changed");
  assert(spec.output?.productionRegistered === false, "adapter spec: this generator must not register production content");
  return spec;
}

function timelineById(inventory, timelineId) {
  const matches = (inventory.timelineInventory || []).filter((timeline) => timeline.timelineId === timelineId);
  assert(matches.length === 1, `scenario inventory: expected exactly one ${timelineId}`);
  return matches[0];
}

function hasStop(timeline, frame) {
  return timeline.controlStates?.some((state) => state.frame === frame && state.reasons?.includes("script-stop-state"));
}

export function validateAdapterAuditEvidence(spec, scenarioInventory, ffdecScripts, audioAudit, authoringAudit, adobeStandaloneBaseline) {
  validateSpec(spec);
  assert(scenarioInventory.animationId === spec.animationId, "scenario inventory: animationId mismatch");
  assert(scenarioInventory.source?.swfSha256 === spec.source.swfSha256, "scenario inventory: SWF hash mismatch");
  assert(scenarioInventory.source?.flaSha256 === spec.source.flaSha256, "scenario inventory: FLA hash mismatch");
  assert(scenarioInventory.source?.stage?.width === 800 && scenarioInventory.source?.stage?.height === 600, "scenario inventory: stage mismatch");
  assert(scenarioInventory.source?.fps === 12 && scenarioInventory.source?.rootFrameCount === 10, "scenario inventory: root metadata mismatch");
  const root = timelineById(scenarioInventory, "root");
  const local = timelineById(scenarioInventory, "sprite-231");
  assert(root.frameCount === 10 && hasStop(root, 1) && hasStop(root, 6), "scenario inventory: root stop states are incomplete");
  assert(root.frameLabels?.some((label) => label.frame === 6 && label.label === "begin"), "scenario inventory: begin label is missing");
  assert(root.namedPlacements?.some((placement) => placement.frame === 6 && placement.name === "animation" && Number(placement.objectId) === 231), "scenario inventory: Animation03 root placement is missing");
  assert(local.frameCount === 222 && hasStop(local, 56), "scenario inventory: local frame-56 stop is unproven");
  assert(local.controlStates?.some((state) => state.frame === 57), "scenario inventory: local post-stop structural frame is missing");
  for (const name of ["AnsBtn1", "AnsBtn2", "AnsBtn3", "Mc_Right_Feed1", "Mc_Wrong_Feed1"]) {
    assert(local.namedPlacements?.some((placement) => placement.frame === 56 && placement.name === name), `scenario inventory: ${name} frame-56 placement is missing`);
  }
  assert(audioAudit.animationId === spec.animationId, "audio audit: animationId mismatch");
  assert(audioAudit.source?.observedSha256 === spec.source.swfSha256 && audioAudit.source?.hashMatches === true, "audio audit: source hash is unverified");
  assert(audioAudit.externalAudio?.exactAssociations?.length === 1, "audio audit: expected one exact external association");
  assert(audioAudit.externalAudio.exactAssociations[0].languageAssessment?.language === "es", "audio audit: exact external Spanish association changed");
  assert(audioAudit.externalAudio.exactAssociations[0].startFrame === null, "audio audit: an unproven external cue was introduced");
  assert(audioAudit.embeddedAudio?.soundStreams?.length === 11, "audio audit: embedded stream count changed");
  assert(audioAudit.acceptance?.authoritativeListeningComplete === false && audioAudit.acceptance?.hostStateTraversalComplete === false, "audio audit: fail-closed precondition changed");
  assert(authoringAudit.animationId === spec.animationId, "authoring audit: animationId mismatch");
  assert(authoringAudit.source?.flaSha256 === spec.source.flaSha256, "authoring audit: FLA hash mismatch");
  assert(authoringAudit.animateVersion === "MAC 21,0,7,42652", "authoring audit: Animate version changed");
  assert(authoringAudit.nativeMovie?.width === 800 && authoringAudit.nativeMovie?.height === 600 && authoringAudit.nativeMovie?.fps === 12, "authoring audit: native movie metadata changed");
  assert(authoringAudit.authoringAudit?.library?.some((item) => item.name === "Animation03" && item.timeline?.frameCount === 222), "authoring audit: Animation03 timeline is missing");
  assert(scenarioInventory.staticExtraction?.ffdecExportedScriptCount === 37 && scenarioInventory.staticExtraction?.indexedScriptBlockCount === 37, "scenario inventory: exhaustive script indexing changed");
  const ffdecScriptHeaders = ffdecScripts.match(/^===== .+ =====$/gm) || [];
  assert(ffdecScriptHeaders.length === spec.evidence.ffdecExportedScriptCount, "FFDec scripts: exhaustive script-block count changed");
  assert(new Set(ffdecScriptHeaders).size === ffdecScriptHeaders.length, "FFDec scripts: duplicate script-block headers are present");
  assert(!/(?:\blanguage\b|\blocale\b|\bspanish\b|espa[nñ]ol|\blng\b|_global\.(?:lang|language)\b)/i.test(ffdecScripts), "FFDec scripts: a visual language branch is now present and must be modeled explicitly");
  const handlerSignals = JSON.stringify((scenarioInventory.interactions?.handlers || []).map(({signals}) => signals));
  assert(!/(?:language|locale|spanish|\blng\b)/i.test(handlerSignals), "scenario inventory: a visual language branch is now present and must be modeled explicitly");
  assert(adobeStandaloneBaseline.animationId === spec.animationId, "Adobe standalone baseline: animationId mismatch");
  assert(adobeStandaloneBaseline.source?.swfSha256 === spec.source.swfSha256, "Adobe standalone baseline: source hash mismatch");
  assert(adobeStandaloneBaseline.status === "authoritative-standalone-runtime-baseline", "Adobe standalone baseline: authority status changed");
  assert(adobeStandaloneBaseline.runtime?.frameCount === 10 && adobeStandaloneBaseline.runtime?.fps === 12, "Adobe standalone baseline: root runtime contract changed");
  assert(adobeStandaloneBaseline.runtime?.lang === "en", "Adobe standalone baseline: only the observed English runtime may be claimed");
  assert(Array.isArray(adobeStandaloneBaseline.frames) && adobeStandaloneBaseline.frames.length === 10, "Adobe standalone baseline: every root frame is required");
  adobeStandaloneBaseline.frames.forEach((frame, index) => {
    assert(frame.frame === index + 1 && /^[a-f0-9]{64}$/.test(frame.sha256 || "") && frame.width === 800 && frame.height === 600, `Adobe standalone baseline: invalid root frame ${index + 1}`);
  });
  return {root, local};
}

export function parseArguments(argv, {root = ROOT} = {}) {
  let check = false;
  let specPath = DEFAULT_SPEC;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--check") {
      check = true;
    } else if (value === "--spec") {
      const next = argv[index + 1];
      assert(next && !next.startsWith("--"), "--spec requires a path");
      specPath = next;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  return {check, specPath: resolveProjectPath(root, specPath, "spec")};
}

export function resolveAdapterFrameState(request, spec) {
  validateSpec(spec);
  const scenarioId = request?.scenario ?? spec.runtimeContract.defaultScenario;
  const scenario = scenarioById(spec, scenarioId);
  assert(scenario, `unsupported scenario: ${scenarioId}`);
  const frameDomain = request?.frameDomain ?? spec.runtimeContract.defaultFrameDomain;
  assert(frameDomain === scenario.frameDomain, `scenario ${scenario.id} requires frameDomain ${scenario.frameDomain}`);
  const frame = request?.frame ?? 1;
  assert(Number.isSafeInteger(frame), "frame must be a safe integer");
  assert(frame >= scenario.frameStart && frame <= scenario.frameEndInclusive, `frame must be within ${scenario.frameStart}..${scenario.frameEndInclusive} for scenario ${scenario.id}`);
  const lang = request?.lang ?? "en";
  assert(spec.runtimeContract.supportedLanguages.includes(lang), `unsupported source-proven language: ${lang}`);
  const rawSeed = request?.seed ?? 0;
  assert(Number.isSafeInteger(rawSeed), "seed must be a safe integer");
  const seed = rawSeed >>> 0;
  const rootDomain = frameDomain === "root";
  const afterNaturalStop = frame > (scenario.naturalPlaybackEndFrame ?? spec.timeline.local.quizStopFrame);
  const partialInstructionReveal = rootDomain
    ? spec.glyphEvidence.instruction.rootPartialRevealFrames.find((entry) => entry.frame === frame)
    : null;
  return Object.freeze({
    frame,
    frameDomain,
    localFrame: rootDomain ? (frame >= spec.timeline.root.beginFrame ? frame : null) : frame,
    exportFrame: frame - 1,
    rootFrame: rootDomain ? frame : spec.timeline.root.beginFrame,
    exportRootFrame: rootDomain ? frame - 1 : spec.timeline.root.beginFrame - 1,
    scenario: scenario.id,
    lang,
    seed,
    runtimeReachability: rootDomain
      ? "source-standalone-sequential-step"
      : afterNaturalStop || scenario.id === "authoring-frame-inspection"
        ? "structural-only-runtime-reachability-unproven"
        : "source-structured-linear-to-stop",
    interactionBoundary: !rootDomain && frame === spec.timeline.local.quizStopFrame,
    visualLocalizationStatus: spec.runtimeContract.visualLocalizationStatus,
    audioLocalizationStatus: spec.runtimeContract.audioLocalizationStatus,
    audioStatus: spec.runtimeContract.audioStatus,
    interactionStatus: spec.runtimeContract.interactionStatus,
    spanishStatus: spec.runtimeContract.spanishStatus,
    instructionCorrection:
      partialInstructionReveal
        ? "authoritative-swf-vector-partial-reveal"
        : rootDomain && spec.glyphEvidence.instruction.rootFullRevealFrames.includes(frame)
        ? "authoritative-swf-vector-full-reveal"
        : "none",
    instructionClipRight: partialInstructionReveal?.clipRightExclusive ?? null,
    glyphCorrection: (!rootDomain || frame >= spec.timeline.root.beginFrame)
      ? (frame <= spec.glyphEvidence.correctedLocalFrames.endInclusive ? "authoritative-swf-vector-chart" : "none")
      : "none"
  });
}

function extractNamedFunction(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert(start >= 0, `glyph export: ${name} was not found`);
  assert(source.indexOf(marker, start + marker.length) < 0, `glyph export: ${name} occurred more than once`);
  const bodyStart = source.indexOf("{", start + marker.length);
  assert(bodyStart >= 0, `glyph export: ${name} has no body`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`glyph export: ${name} body is unterminated`);
}

export function buildAuthoritativeChartOverlay(framesHtml, spec) {
  assertHash(framesHtml, spec.glyphEvidence.framesHtmlSha256, "glyph export");
  framesHtml = framesHtml.replace(/\r\n?/g, "\n");
  let definitions = spec.glyphEvidence.functions.map((name) => extractNamedFunction(framesHtml, name)).join("\n\n");
  const unscopedFill = "function font1(ctx,ch,textColor){\n\tdefaultFill = textColor;";
  assert(definitions.includes(unscopedFill), "glyph export: font1 fill-scope marker changed");
  definitions = definitions.replace(unscopedFill, "function font1(ctx,ch,textColor){\n\tvar defaultFill = textColor;");
  const fillMatches = definitions.match(/drawPath\(ctx,pathData,false\);\s*ctx\.fill\("evenodd"\);/g) || [];
  assert(fillMatches.length > 10, "glyph export: expected vector fill paths were not found");
  definitions = definitions.replace(/drawPath\(ctx,pathData,false\);\s*ctx\.fill\("evenodd"\);/g, 'ctx.fill(new Path2D(pathData), "evenodd");');
  const strokeMatches = definitions.match(/drawPath\(ctx,pathData,true,scaleMode\);/g) || [];
  assert(strokeMatches.length === 2, "glyph export: expected two chart stroke paths");
  definitions = definitions.replace(/drawPath\(ctx,pathData,true,scaleMode\);/g, "ctx.save(); ctx.lineWidth *= 20; ctx.stroke(new Path2D(pathData)); ctx.restore();");
  assert(!definitions.includes("drawPath("), "glyph export: unresolved drawPath dependency");
  const placementCalls = spec.glyphEvidence.placements.map((placement) => {
    const matrix = placement.matrix.map((value) => Number(value).toString()).join(",");
    return `    ctx.save(); ctx.transform(${matrix}); ${placement.function}(ctx, colorTransform, 0, 0, 0); ctx.restore();`;
  }).join("\n");
  const instruction = spec.glyphEvidence.instruction;
  const instructionTextMatrix = instruction.textMatrix.map((value) => Number(value).toString()).join(",");
  const instructionUnderlineMatrix = instruction.underlineMatrix.map((value) => Number(value).toString()).join(",");
  const instructionSegments = instruction.underlineSegments.map(([x1, y1, x2, y2]) =>
    `    ctx.moveTo(${x1}, ${y1}); ctx.lineTo(${x2}, ${y2});`
  ).join("\n");
  return `/* Generated from hash-pinned shipped-SWF vector evidence. Do not hand edit. */
(function (global) {
  "use strict";
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function tocolor(color) { return "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + color[3] + ")"; }
  function makeColorTransform(alphaMultiplier) {
    return {
      apply: function (color) {
        return [color[0], color[1], color[2], clamp(color[3] * alphaMultiplier / 255, 0, 1)];
      }
    };
  }
${definitions.split("\n").map((line) => `  ${line}`).join("\n")}
  var alphaMultipliers = Object.freeze(${JSON.stringify(spec.glyphEvidence.fadeAlphaMultipliers)});
  global.HELP_MATH_VB004_DRAW_AUTHORITATIVE_CHART = function (ctx, localFrame) {
    if (!Number.isSafeInteger(localFrame) || localFrame < 1 || localFrame > ${spec.glyphEvidence.correctedLocalFrames.endInclusive}) {
      throw new Error("authoritative chart frame must be within 1..${spec.glyphEvidence.correctedLocalFrames.endInclusive}");
    }
    var alphaMultiplier = localFrame <= alphaMultipliers.length ? alphaMultipliers[localFrame - 1] : 256;
    var colorTransform = makeColorTransform(alphaMultiplier);
    ctx.save();
    ctx.translate(${spec.glyphEvidence.chartPlacement.x}, ${spec.glyphEvidence.chartPlacement.y});
${placementCalls}
    ctx.restore();
  };
  global.HELP_MATH_VB004_DRAW_AUTHORITATIVE_INSTRUCTION = function (ctx, clipRightExclusive) {
    var colorTransform = makeColorTransform(256);
    ctx.save();
    if (clipRightExclusive !== null && clipRightExclusive !== undefined) {
      if (!Number.isFinite(clipRightExclusive) || clipRightExclusive <= 0 || clipRightExclusive > ${spec.timeline.stage.width}) {
        throw new Error("invalid authoritative instruction reveal clip");
      }
      ctx.beginPath();
      ctx.rect(0, 0, clipRightExclusive, ${spec.timeline.stage.height});
      ctx.clip();
    }
    ctx.translate(${instruction.placement.x}, ${instruction.placement.y});
    ctx.save();
    ctx.transform(${instructionUnderlineMatrix});
    ctx.beginPath();
${instructionSegments}
    ctx.strokeStyle = tocolor(colorTransform.apply(${JSON.stringify(instruction.strokeColor)}));
    ctx.lineWidth = ${instruction.unscaledLineWidth};
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.transform(${instructionTextMatrix});
    ${instruction.textFunction}(ctx, colorTransform, 0, 0, 0);
    ctx.restore();
    ctx.restore();
  };
})(window);
`;
}

export function sanitizeAnimateExport(source, spec) {
  assertHash(source, spec.authoringExport.javascriptSha256, "Animate JavaScript export");
  const startMarker = "(function (cjs, an) {";
  assert(source.startsWith(startMarker), "Animate export: wrapper start changed");
  const bootstrapMarker = "// bootstrap callback support:";
  const bootstrap = source.indexOf(bootstrapMarker);
  assert(bootstrap > startMarker.length, "Animate export: bootstrap boundary is missing");
  assert(source.indexOf(bootstrapMarker, bootstrap + bootstrapMarker.length) < 0, "Animate export: duplicate bootstrap boundary");
  let body = source.slice(startMarker.length, bootstrap).trim();
  assert(body.includes(`lib.${spec.authoringExport.rootClass} = function`) || body.includes(`(lib.${spec.authoringExport.rootClass} = function`), "Animate export: root class is missing");
  assert(body.includes(`(lib.${spec.authoringExport.localClass} = function`), "Animate export: local class is missing");
  assert(body.includes(`id: '${spec.authoringExport.compositionId}'`), "Animate export: composition ID changed");
  const tickListenerPattern = /^\s*this\.[A-Za-z0-9_]+\.addEventListener\("tick", AdobeAn\.handleFilterCache\);\s*$/gm;
  const listeners = body.match(tickListenerPattern) || [];
  assert(listeners.length === 5, `Animate export: expected five generated filter-cache tick listeners, found ${listeners.length}`);
  body = body.replace(tickListenerPattern, "");
  for (const forbidden of ["AdobeAn", "addEventListener(", "createjs.Stage", "cjs.Stage", "Ticker", "LoadQueue", "makeResponsive", "document.body", "http://", "https://"]) {
    assert(!body.includes(forbidden), `Animate export: unsafe or ambient token remains: ${forbidden}`);
  }
  return `/* Sanitized from a hash-pinned Adobe Animate working-copy export. Do not hand edit. */
(function (global) {
  "use strict";
  global.HELP_MATH_VB004_INSTALL_EXPORT = function (cjs) {
    if (!cjs || !cjs.MovieClip || !cjs.Tween || !cjs.SpriteSheet) throw new Error("pinned CreateJS runtime is incomplete");
    var an = Object.freeze({});
${body.split("\n").map((line) => `    ${line}`).join("\n")}
    function installAtlas(id, image) {
      var metadata = lib.ssMetadata.find(function (entry) { return entry.name === id; });
      if (!metadata) throw new Error("unknown atlas id: " + id);
      if (!image || !image.complete || !image.naturalWidth) throw new Error("atlas is not decoded: " + id);
      ss[id] = new cjs.SpriteSheet({images: [image], frames: metadata.frames});
    }
    return Object.freeze({library: lib, spriteSheets: ss, images: img, installAtlas: installAtlas});
  };
})(window);
`;
}

export function patchTweenJs(source, spec) {
  assertHash(source, spec.createjs.tweenjs.sha256, "TweenJS");
  const tickerRegistration = ',!Tween._inited&&createjs.Ticker&&(createjs.Ticker.addEventListener("tick",Tween),Tween._inited=!0)';
  const first = source.indexOf(tickerRegistration);
  assert(first >= 0 && source.indexOf(tickerRegistration, first + 1) < 0, "TweenJS: automatic ticker registration marker changed");
  const patched = source.replace(tickerRegistration, ",Tween._inited=!0");
  assert(!patched.includes('createjs.Ticker.addEventListener("tick",Tween)'), "TweenJS: automatic ticker registration remains");
  return `/* TweenJS ${spec.createjs.tweenjs.version}, MIT; deterministic patch documented in manifest.json. */\n${patched}`;
}

export function buildSafeRuntime(spec) {
  const scenarios = Object.fromEntries(spec.runtimeContract.scenarios.map((scenario) => [scenario.id, scenario]));
  const runtimeSpec = {
    animationId: spec.animationId,
    stage: spec.timeline.stage,
    fps: spec.timeline.fps,
    rootFrameCount: spec.timeline.root.frameCount,
    rootFrame: spec.timeline.root.beginFrame,
    rootExportFrame: spec.timeline.root.beginFrame - 1,
    localFrameCount: spec.timeline.local.frameCount,
    quizStopFrame: spec.timeline.local.quizStopFrame,
    defaultScenario: spec.runtimeContract.defaultScenario,
    defaultFrameDomain: spec.runtimeContract.defaultFrameDomain,
    scenarios,
    supportedLanguages: spec.runtimeContract.supportedLanguages,
    visualLocalizationStatus: spec.runtimeContract.visualLocalizationStatus,
    audioLocalizationStatus: spec.runtimeContract.audioLocalizationStatus,
    audioStatus: spec.runtimeContract.audioStatus,
    interactionStatus: spec.runtimeContract.interactionStatus,
    spanishStatus: spec.runtimeContract.spanishStatus,
    seedStatus: spec.runtimeContract.seedStatus,
    rootInstructionFullRevealFrames: spec.glyphEvidence.instruction.rootFullRevealFrames,
    rootInstructionPartialRevealFrames: spec.glyphEvidence.instruction.rootPartialRevealFrames,
    rootClass: spec.authoringExport.rootClass,
    atlases: spec.authoringExport.atlases.map((atlas, index) => ({id: atlas.id, elementId: `atlas-${index + 1}`}))
  };
  return `/* Generated deterministic engineering adapter. No ambient playback loop or legacy side effects. */
(function (global, document) {
  "use strict";
  var contract = Object.freeze(${JSON.stringify(runtimeSpec)});
  var canvas = document.getElementById("flash-stage");
  var status = document.getElementById("runtime-status");
  var context = canvas.getContext("2d", {alpha: false});
  var exportBundle = null;
  var exportRoot = null;
  var currentState = null;

  function requireSafeInteger(raw, label, fallback) {
    if (raw === null || raw === undefined || raw === "") return fallback;
    if (!/^-?\\d+$/.test(String(raw))) throw new Error(label + " must be a safe integer");
    var value = Number(raw);
    if (!Number.isSafeInteger(value)) throw new Error(label + " must be a safe integer");
    return value;
  }

  function resolveRequest(request) {
    request = request || {};
    var scenarioId = request.scenario || contract.defaultScenario;
    var scenario = contract.scenarios[scenarioId];
    if (!scenario) throw new Error("unsupported scenario: " + scenarioId);
    var frameDomain = request.frameDomain || contract.defaultFrameDomain;
    if (frameDomain !== scenario.frameDomain) throw new Error("scenario " + scenarioId + " requires frameDomain " + scenario.frameDomain);
    var frame = requireSafeInteger(request.frame, "frame", 1);
    if (frame < scenario.frameStart || frame > scenario.frameEndInclusive) {
      throw new Error("frame must be within " + scenario.frameStart + ".." + scenario.frameEndInclusive + " for scenario " + scenarioId);
    }
    var lang = request.lang || "en";
    if (contract.supportedLanguages.indexOf(lang) < 0) throw new Error("unsupported source-proven language: " + lang);
    var seed = requireSafeInteger(request.seed, "seed", 0) >>> 0;
    var rootDomain = frameDomain === "root";
    var naturalPlaybackEndFrame = scenario.naturalPlaybackEndFrame === undefined ? contract.quizStopFrame : scenario.naturalPlaybackEndFrame;
    var afterNaturalStop = frame > naturalPlaybackEndFrame;
    var partialInstructionReveal = rootDomain ? contract.rootInstructionPartialRevealFrames.find(function (entry) { return entry.frame === frame; }) : null;
    return Object.freeze({
      frame: frame,
      frameDomain: frameDomain,
      localFrame: rootDomain ? (frame >= contract.rootFrame ? frame : null) : frame,
      exportFrame: frame - 1,
      rootFrame: rootDomain ? frame : contract.rootFrame,
      exportRootFrame: rootDomain ? frame - 1 : contract.rootExportFrame,
      scenario: scenarioId,
      lang: lang,
      seed: seed,
      runtimeReachability: rootDomain ? "source-standalone-sequential-step" : (afterNaturalStop || scenarioId === "authoring-frame-inspection" ? "structural-only-runtime-reachability-unproven" : "source-structured-linear-to-stop"),
      interactionBoundary: !rootDomain && frame === contract.quizStopFrame,
      visualLocalizationStatus: contract.visualLocalizationStatus,
      audioLocalizationStatus: contract.audioLocalizationStatus,
      audioStatus: contract.audioStatus,
      interactionStatus: contract.interactionStatus,
      spanishStatus: contract.spanishStatus,
      instructionCorrection: partialInstructionReveal ? "authoritative-swf-vector-partial-reveal" : (rootDomain && contract.rootInstructionFullRevealFrames.indexOf(frame) >= 0 ? "authoritative-swf-vector-full-reveal" : "none"),
      instructionClipRight: partialInstructionReveal ? partialInstructionReveal.clipRightExclusive : null,
      glyphCorrection: (!rootDomain || frame >= contract.rootFrame) && frame <= 56 ? "authoritative-swf-vector-chart" : "none"
    });
  }

  function queryRequest() {
    var params = new URL(document.URL).searchParams;
    return {
      frameDomain: params.get("frameDomain"),
      frame: params.get("frame"),
      scenario: params.get("scenario"),
      lang: params.get("lang"),
      seed: params.get("seed")
    };
  }

  function restoreChartVisibility(animation) {
    if (animation.instance) animation.instance.visible = true;
    for (var index = 1; index <= 15; index += 1) {
      if (animation["instance_" + index]) animation["instance_" + index].visible = true;
    }
    if (animation.instance_17) animation.instance_17.visible = true;
  }

  function suppressSubstitutedChart(animation, localFrame) {
    if (localFrame <= 55 && animation.instance) animation.instance.visible = false;
    if (localFrame === 56) {
      for (var index = 1; index <= 15; index += 1) {
        if (animation["instance_" + index]) animation["instance_" + index].visible = false;
      }
    }
  }

  function suppressSubstitutedInstruction(animation, state) {
    if (state.instructionCorrection !== "none" && animation.instance_17) {
      animation.instance_17.visible = false;
    }
  }

  function setEvidenceAttributes(state) {
    canvas.setAttribute("data-flash-frame", String(state.frame));
    canvas.setAttribute("data-flash-frame-domain", state.frameDomain);
    canvas.setAttribute("data-flash-root-frame", String(state.rootFrame));
    canvas.setAttribute("data-flash-scenario", state.scenario);
    canvas.setAttribute("data-flash-lang", state.lang);
    canvas.setAttribute("data-flash-seed", String(state.seed));
    canvas.setAttribute("data-runtime-reachability", state.runtimeReachability);
    canvas.setAttribute("data-visual-localization-status", state.visualLocalizationStatus);
    canvas.setAttribute("data-audio-localization-status", state.audioLocalizationStatus);
    canvas.setAttribute("data-audio-status", state.audioStatus);
    canvas.setAttribute("data-interaction-status", state.interactionStatus);
    canvas.setAttribute("data-spanish-status", state.spanishStatus);
    canvas.setAttribute("data-instruction-correction", state.instructionCorrection);
    canvas.setAttribute("data-instruction-clip-right", state.instructionClipRight === null ? "none" : String(state.instructionClipRight));
    canvas.setAttribute("data-glyph-correction", state.glyphCorrection);
    canvas.setAttribute("data-render-state", "ready");
    document.documentElement.setAttribute("data-flash-frame", String(state.frame));
    document.documentElement.setAttribute("data-flash-frame-domain", state.frameDomain);
    document.documentElement.setAttribute("data-flash-root-frame", String(state.rootFrame));
    document.documentElement.setAttribute("data-flash-scenario", state.scenario);
    document.documentElement.setAttribute("data-flash-lang", state.lang);
    document.documentElement.setAttribute("data-flash-seed", String(state.seed));
    document.documentElement.setAttribute("data-render-state", "ready");
  }

  function render(request) {
    if (!exportRoot) throw new Error("adapter assets are not ready");
    var state = resolveRequest(request);
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = "source-over";
    context.fillStyle = contract.stage.backgroundColor;
    context.fillRect(0, 0, contract.stage.width, contract.stage.height);
    context.restore();
    exportRoot.gotoAndStop(state.exportRootFrame);
    if (state.localFrame !== null) {
      if (!exportRoot.animation) throw new Error("Animation03 is absent at the requested composite frame");
      restoreChartVisibility(exportRoot.animation);
      exportRoot.animation.gotoAndStop(state.localFrame - 1);
      suppressSubstitutedChart(exportRoot.animation, state.localFrame);
      suppressSubstitutedInstruction(exportRoot.animation, state);
    }
    exportRoot.draw(context, false);
    if (state.localFrame !== null && state.localFrame <= 56) {
      global.HELP_MATH_VB004_DRAW_AUTHORITATIVE_CHART(context, state.localFrame);
    }
    if (state.instructionCorrection !== "none") {
      global.HELP_MATH_VB004_DRAW_AUTHORITATIVE_INSTRUCTION(context, state.instructionClipRight);
    }
    if (global.createjs.Ticker && global.createjs.Ticker._inited) throw new Error("CreateJS Ticker unexpectedly initialized");
    currentState = state;
    setEvidenceAttributes(state);
    status.textContent = "Engineering candidate · " + state.frameDomain + " frame " + state.frame + "/" + (state.frameDomain === "root" ? contract.rootFrameCount : contract.localFrameCount) + " · " + state.scenario;
    return state;
  }

  function decodedImage(image) {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve(image);
    return image.decode().then(function () { return image; });
  }

  function start() {
    var atlasImages = contract.atlases.map(function (atlas) {
      return document.getElementById(atlas.elementId);
    });
    return Promise.all(atlasImages.map(decodedImage)).then(function () {
      if (!global.createjs || !global.createjs.MovieClip || !global.createjs.Tween) throw new Error("pinned CreateJS modules did not load");
      if (global.createjs.Ticker && global.createjs.Ticker._inited) throw new Error("CreateJS Ticker initialized before adapter construction");
      global.createjs.Tween._inited = true;
      exportBundle = global.HELP_MATH_VB004_INSTALL_EXPORT(global.createjs);
      contract.atlases.forEach(function (atlas, index) { exportBundle.installAtlas(atlas.id, atlasImages[index]); });
      var RootClass = exportBundle.library[contract.rootClass];
      if (typeof RootClass !== "function") throw new Error("Animate root class is unavailable");
      exportRoot = new RootClass();
      if (!exportRoot.animation || exportRoot.animation.totalFrames !== contract.localFrameCount) throw new Error("Animation03 frame count mismatch");
      return render(queryRequest());
    });
  }

  function fail(error) {
    var message = error && error.message ? error.message : String(error);
    canvas.setAttribute("data-render-state", "error");
    canvas.setAttribute("data-runtime-error", message);
    document.documentElement.setAttribute("data-render-state", "error");
    status.textContent = "Blocked: " + message;
  }

  global.HELP_MATH_VB004 = Object.freeze({
    contract: contract,
    render: render,
    resolveRequest: resolveRequest,
    getState: function () { return currentState; },
    getDiagnostics: function () {
      return Object.freeze({
        rootCurrentFrame: exportRoot ? exportRoot.currentFrame : null,
        localCurrentFrame: exportRoot && exportRoot.animation ? exportRoot.animation.currentFrame : null,
        rootPaused: exportRoot ? exportRoot.paused : null,
        localPaused: exportRoot && exportRoot.animation ? exportRoot.animation.paused : null,
        tickerInitialized: Boolean(global.createjs && global.createjs.Ticker && global.createjs.Ticker._inited),
        tweenHeadPresent: Boolean(global.createjs && global.createjs.Tween && global.createjs.Tween._tweenHead)
      });
    }
  });
  start().catch(fail);
})(window, document);
`;
}

function buildHtml(spec) {
  return `<!doctype html>
<html lang="en" data-render-state="loading">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="data:,">
  <title>${spec.animationId} engineering candidate</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, sans-serif; background: #eef5fb; }
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: start center; }
    main { width: min(100%, 840px); padding: 20px; }
    .stage { width: 100%; aspect-ratio: 4 / 3; outline: 1px solid #789; background: ${spec.timeline.stage.backgroundColor}; }
    canvas { display: block; width: 100%; height: 100%; }
    p { margin: 10px 0 0; color: #24384b; font-size: 14px; }
    .atlas { display: none; }
    html[data-embed="true"], html[data-embed="true"] body { height: 100%; overflow: hidden; width: 100%; }
    html[data-embed="true"] body { display: block; min-height: 0; }
    html[data-embed="true"] main { height: 100%; padding: 0; width: 100%; }
    html[data-embed="true"] .stage { aspect-ratio: auto; height: 100%; outline: 0; }
    html[data-embed="true"] #runtime-status { clip: rect(0 0 0 0); clip-path: inset(50%); height: 1px; overflow: hidden; position: absolute; white-space: nowrap; width: 1px; }
  </style>
  <script>document.documentElement.dataset.embed = new URL(document.URL).searchParams.get("embed") === "1" ? "true" : "false";</script>
</head>
<body>
  <main>
    <div class="stage">
      <canvas id="flash-stage" width="800" height="600" role="img" aria-label="Place Value: Important Words engineering rendering candidate">Your browser must support Canvas.</canvas>
    </div>
    <p id="runtime-status" role="status">Loading deterministic engineering candidate…</p>
  </main>
  <img class="atlas" id="atlas-1" src="atlas-1.png" alt="">
  <img class="atlas" id="atlas-2" src="atlas-2.png" alt="">
  <script src="easeljs-1.0.2.min.js"></script>
  <script src="tweenjs-1.0.2-deterministic.min.js"></script>
  <script src="authoring-export.js"></script>
  <script src="authoritative-chart-vector.js"></script>
  <script src="runtime.js"></script>
</body>
</html>
`;
}

function buildReadme(spec) {
  return `# ${spec.animationId} safe authoring-renderer candidate

This directory is generated by \`scripts/build-safe-animate-createjs-adapter.mjs\` from hash-pinned working-copy and audit evidence.

- It is an engineering candidate, not a completed migration and not production-registered.
- It renders one explicit, one-indexed \`root\` or nested \`sprite-231\` frame with \`?frameDomain=\` and \`?frame=\`.
- \`root-standalone\` addresses root frames 1–10. \`linear-to-quiz-stop\` and \`authoring-frame-inspection\` address nested frames 1–222; frames after the natural stop at 56 are structural inspection only and do not claim runtime reachability.
- English and Spanish requests share the single source visual timeline, which remains visibly untranslated. All audio, bilingual parity, quiz behavior, scoring, host calls, and Replay fail closed pending authoritative evidence.
- The initial chart uses vector glyphs extracted from the shipped SWF to avoid Adobe Animate's substituted Bauhaus raster text. Standalone root frames 7–10 also replace the instruction with the exact shipped-SWF glyph vectors and underline paths: frames 7 and 8 use exact right-edge reveal clips measured from the hash-bound Adobe baseline, and frames 9 and 10 use the complete reveal.
- EaselJS and TweenJS are pinned locally. TweenJS is mechanically patched so MovieClip construction cannot start the global Ticker; the adapter has no playback timer and draws only after explicit \`gotoAndStop\` calls.

This directory is intentionally outside the product module registry.
`;
}

function buildLicense(licenseText, spec) {
  return `CreateJS EaselJS ${spec.createjs.easeljs.version} and TweenJS ${spec.createjs.tweenjs.version}\nLicense: MIT\nUpstream packages: easeljs and tweenjs from npm\n\n${licenseText.trimEnd()}\n`;
}

async function loadHashedFile(root, relativePath, expectedHash, label, encoding = null) {
  const value = await readFile(resolveProjectPath(root, relativePath, label), encoding || undefined);
  assertHash(value, expectedHash, label);
  return value;
}

async function writeOrCheck(target, value, check) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  if (check) {
    let existing;
    try {
      existing = await readFile(target);
    } catch (error) {
      if (error.code === "ENOENT") throw new Error(`generated output is missing: ${portable(path.relative(ROOT, target))}`);
      throw error;
    }
    assert(existing.equals(buffer), `generated output is stale: ${portable(path.relative(ROOT, target))}`);
    return;
  }
  await mkdir(path.dirname(target), {recursive: true});
  await writeFile(target, buffer);
}

export async function generateSafeAnimateCreatejsAdapter({root = ROOT, specPath, check = false} = {}) {
  const resolvedSpec = specPath || resolveProjectPath(root, DEFAULT_SPEC, "spec");
  const specBuffer = await readFile(resolvedSpec);
  const spec = validateSpec(JSON.parse(specBuffer.toString("utf8")));
  const [
    sourceFla,
    sourceSwf,
    workingCopyFla,
    convertedFla,
    animateHtml,
    animateJs,
    easelJs,
    tweenJs,
    licenseText,
    glyphHtml,
    scenarioInventoryBuffer,
    ffdecScriptsBuffer,
    audioAuditBuffer,
    authoringAuditBuffer,
    adobeStandaloneBaselineBuffer,
    ...atlasBuffers
  ] = await Promise.all([
    loadHashedFile(root, spec.source.fla, spec.source.flaSha256, "source FLA"),
    loadHashedFile(root, spec.source.swf, spec.source.swfSha256, "source SWF"),
    loadHashedFile(root, spec.authoringExport.workingCopyFla, spec.authoringExport.workingCopyFlaSha256, "Animate working-copy FLA"),
    loadHashedFile(root, spec.authoringExport.convertedFla, spec.authoringExport.convertedFlaSha256, "Animate converted FLA"),
    loadHashedFile(root, spec.authoringExport.html, spec.authoringExport.htmlSha256, "Animate HTML", "utf8"),
    loadHashedFile(root, spec.authoringExport.javascript, spec.authoringExport.javascriptSha256, "Animate JavaScript", "utf8"),
    loadHashedFile(root, spec.createjs.easeljs.source, spec.createjs.easeljs.sha256, "EaselJS", "utf8"),
    loadHashedFile(root, spec.createjs.tweenjs.source, spec.createjs.tweenjs.sha256, "TweenJS", "utf8"),
    loadHashedFile(root, spec.createjs.licenseSource, spec.createjs.licenseSha256, "CreateJS license", "utf8"),
    loadHashedFile(root, spec.glyphEvidence.framesHtml, spec.glyphEvidence.framesHtmlSha256, "glyph export", "utf8"),
    loadHashedFile(root, spec.evidence.scenarioInventory, spec.evidence.scenarioInventorySha256, "scenario inventory"),
    loadHashedFile(root, spec.evidence.ffdecScripts, spec.evidence.ffdecScriptsSha256, "FFDec scripts"),
    loadHashedFile(root, spec.evidence.audioAudit, spec.evidence.audioAuditSha256, "audio audit"),
    loadHashedFile(root, spec.evidence.authoringAudit, spec.evidence.authoringAuditSha256, "authoring audit"),
    loadHashedFile(root, spec.evidence.adobeStandaloneBaseline, spec.evidence.adobeStandaloneBaselineSha256, "Adobe standalone baseline"),
    ...spec.authoringExport.atlases.map((atlas) => loadHashedFile(root, atlas.source, atlas.sha256, `atlas ${atlas.id}`))
  ]);
  void sourceFla;
  void sourceSwf;
  void workingCopyFla;
  void convertedFla;
  void animateHtml;
  validateAdapterAuditEvidence(
    spec,
    JSON.parse(scenarioInventoryBuffer.toString("utf8")),
    gunzipSync(ffdecScriptsBuffer).toString("utf8"),
    JSON.parse(audioAuditBuffer.toString("utf8")),
    JSON.parse(authoringAuditBuffer.toString("utf8")),
    JSON.parse(adobeStandaloneBaselineBuffer.toString("utf8"))
  );
  atlasBuffers.forEach((buffer, index) => {
    const atlas = spec.authoringExport.atlases[index];
    assertPngDimensions(buffer, atlas.width, atlas.height, `atlas ${atlas.id}`);
  });
  const outputDirectory = resolveProjectPath(root, spec.output.directory, "output directory");
  const files = new Map([
    [spec.createjs.easeljs.output, `/* EaselJS ${spec.createjs.easeljs.version}, MIT; exact upstream file hash is recorded in manifest.json. */\n${easelJs}`],
    [spec.createjs.tweenjs.output, patchTweenJs(tweenJs, spec)],
    ["authoring-export.js", sanitizeAnimateExport(animateJs, spec)],
    ["authoritative-chart-vector.js", buildAuthoritativeChartOverlay(glyphHtml, spec)],
    ["runtime.js", buildSafeRuntime(spec)],
    ["index.html", buildHtml(spec)],
    ["README.md", buildReadme(spec)],
    ["THIRD_PARTY_LICENSE.txt", buildLicense(licenseText, spec)]
  ]);
  spec.authoringExport.atlases.forEach((atlas, index) => files.set(atlas.output, atlasBuffers[index]));
  const generatedFiles = Object.fromEntries([...files].map(([name, value]) => [name, {
    sha256: sha256(value),
    bytes: Buffer.byteLength(value)
  }]));
  const manifest = {
    schemaVersion: 1,
    animationId: spec.animationId,
    generatedBy: "scripts/build-safe-animate-createjs-adapter.mjs",
    scope: spec.scope,
    productionRegistered: false,
    strictAcceptanceEffect: spec.strictAcceptanceEffect,
    source: spec.source,
    authoringExport: {
      tool: spec.authoringExport.tool,
      authority: spec.authoringExport.authority,
      javascriptSha256: spec.authoringExport.javascriptSha256,
      compositionId: spec.authoringExport.compositionId
    },
    deterministicRuntime: {
      tickerRegistrationRemoved: true,
      ambientPlaybackLoop: false,
      rootFrameCount: spec.timeline.root.frameCount,
      rootFrame: spec.timeline.root.beginFrame,
      localFrameDomain: spec.timeline.local.timelineId,
      defaultFrameDomain: spec.runtimeContract.defaultFrameDomain,
      scenarios: spec.runtimeContract.scenarios,
      supportedLanguages: spec.runtimeContract.supportedLanguages,
      visualLocalizationStatus: spec.runtimeContract.visualLocalizationStatus,
      audioLocalizationStatus: spec.runtimeContract.audioLocalizationStatus,
      visualLanguageBranchEvidence: {
        source: spec.evidence.ffdecScripts,
        sha256: spec.evidence.ffdecScriptsSha256,
        exhaustiveScriptCount: spec.evidence.ffdecExportedScriptCount,
        status: spec.evidence.visualLanguageBranchStatus
      },
      audioStatus: spec.runtimeContract.audioStatus,
      interactionStatus: spec.runtimeContract.interactionStatus,
      spanishStatus: spec.runtimeContract.spanishStatus
    },
    glyphCorrection: {
      authority: spec.glyphEvidence.authority,
      evidenceSha256: spec.glyphEvidence.framesHtmlSha256,
      font: spec.glyphEvidence.font,
      localFrames: spec.glyphEvidence.correctedLocalFrames,
      limitation: spec.glyphEvidence.limitation
    },
    upstreamDependencies: {
      easeljs: {version: spec.createjs.easeljs.version, sha256: spec.createjs.easeljs.sha256, license: spec.createjs.license},
      tweenjs: {version: spec.createjs.tweenjs.version, sha256: spec.createjs.tweenjs.sha256, license: spec.createjs.license, deterministicPatch: spec.createjs.tweenjs.deterministicPatch}
    },
    generatedFiles
  };
  files.set("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
  for (const [name, value] of files) await writeOrCheck(path.join(outputDirectory, name), value, check);
  return {
    animationId: spec.animationId,
    outputDirectory: portable(path.relative(root, outputDirectory)),
    fileCount: files.size,
    check,
    productionRegistered: false,
    strictAcceptanceEffect: spec.strictAcceptanceEffect
  };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const result = await generateSafeAnimateCreatejsAdapter(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
