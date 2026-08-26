#!/usr/bin/env node

import {execFile} from "node:child_process";
import {createHash} from "node:crypto";
import {copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {fileURLToPath} from "node:url";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const animationId = "shell-course-g04-l03-index-local";
const sourceSwfRelative = "source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L3/index_local.swf";
const sourceSwfPath = path.join(projectRoot, sourceSwfRelative);
const sourceSwfSha256 = "817e599de43a7924f0a93791e950c8781755692371945a5b7ea4cdd2ad26c58e";
const swfmillRelative = `migrations/${animationId}/audit/machine/swfmill.xml.gz`;
const swfmillPath = path.join(projectRoot, swfmillRelative);
const placementParserRelative = "scripts/parse-swfmill-shell-placement-selectors.py";
const placementParserPath = path.join(projectRoot, placementParserRelative);
const timelineDataRelative = "packages/demos/src/timelines/generated/shell-course-g04-l03-single-frame-domain-assets.ts";
const timelineDataPath = path.join(projectRoot, timelineDataRelative);
const expectedFfdecVersion = "JPEXS Free Flash Decompiler v.26.2.1";

const named = (parentTimelineId, childObjectId, name) => Object.freeze({parentTimelineId, childObjectId, selector: name});
const depth = (parentTimelineId, childObjectId, placementDepth) => Object.freeze({parentTimelineId, childObjectId, selector: `#${placementDepth}`});

export const SINGLE_FRAME_DOMAIN_CONFIGS = Object.freeze([
  Object.freeze({frameDomain: "sprite-87", sourceCharacterId: 87, sourceInstanceId: "m_c.@depth-29.scrollTrack_mc", rootFrame: 50, scenarioId: "keyterm-scroll-track-control-structural", label: "keyterm scroll track control", exporterCanvas: Object.freeze({width: 16, height: 100}), exporterLocalOrigin: Object.freeze({x: 0, y: 0}), placementEdges: Object.freeze([named("root", 709, "m_c"), depth("sprite-709", 88, 29), named("sprite-88", 87, "scrollTrack_mc")]), behaviorObligations: Object.freeze(["scroll track click behavior", "keyterm list position", "event-handler causality"])}),
  Object.freeze({frameDomain: "sprite-88", sourceCharacterId: 88, sourceInstanceId: "m_c.@depth-29", rootFrame: 50, scenarioId: "keyterm-scrollbar-asset-structural", label: "keyterm scrollbar asset", exporterCanvas: Object.freeze({width: 16, height: 100}), exporterLocalOrigin: Object.freeze({x: 0, y: 0}), placementEdges: Object.freeze([named("root", 709, "m_c"), depth("sprite-709", 88, 29)]), behaviorObligations: Object.freeze(["scrollbar event handlers", "drag state", "duplicated placement behavior"])}),
  Object.freeze({frameDomain: "sprite-169", sourceCharacterId: 169, sourceInstanceId: "root.@depth-494", rootFrame: 1, scenarioId: "root-stop-control-a-structural", label: "root stop control A", exporterCanvas: Object.freeze({width: 90, height: 65}), exporterLocalOrigin: Object.freeze({x: 45, y: 32.3}), placementEdges: Object.freeze([depth("root", 169, 494)]), behaviorObligations: Object.freeze(["frame-one stop action", "visibility causality", "duplicate depth-496 placement state"])}),
  Object.freeze({frameDomain: "sprite-179", sourceCharacterId: 179, sourceInstanceId: "root.@depth-14", rootFrame: 49, scenarioId: "root-stop-control-b-structural", label: "root stop control B", exporterCanvas: Object.freeze({width: 797, height: 488}), exporterLocalOrigin: Object.freeze({x: 398.2, y: 441.65}), placementEdges: Object.freeze([depth("root", 179, 14)]), behaviorObligations: Object.freeze(["frame-one stop action", "shell overlay state", "runtime visibility causality"])}),
  Object.freeze({frameDomain: "sprite-185", sourceCharacterId: 185, sourceInstanceId: "mySlider", rootFrame: 49, scenarioId: "media-slider-control-structural", label: "media slider control", exporterCanvas: Object.freeze({width: 108, height: 17}), exporterLocalOrigin: Object.freeze({x: 3.15, y: 8}), placementEdges: Object.freeze([named("root", 185, "mySlider")]), behaviorObligations: Object.freeze(["drag behavior", "media seek state", "progress synchronization"])}),
  Object.freeze({frameDomain: "sprite-253", sourceCharacterId: 253, sourceInstanceId: "replay_mc", rootFrame: 49, scenarioId: "replay-control-structural", label: "Replay control", exporterCanvas: Object.freeze({width: 27, height: 27}), exporterLocalOrigin: Object.freeze({x: 174.65, y: 41.9}), placementEdges: Object.freeze([named("root", 253, "replay_mc")]), behaviorObligations: Object.freeze(["Replay activation", "complete state-vector reset", "audio reset"])}),
  Object.freeze({frameDomain: "sprite-257", sourceCharacterId: 257, sourceInstanceId: "play_mc", rootFrame: 49, scenarioId: "play-control-structural", label: "Play control", exporterCanvas: Object.freeze({width: 27, height: 27}), exporterLocalOrigin: Object.freeze({x: -31.1, y: -14.7}), placementEdges: Object.freeze([named("root", 257, "play_mc")]), behaviorObligations: Object.freeze(["play activation", "media clock resume", "audio resume"])}),
  Object.freeze({frameDomain: "sprite-261", sourceCharacterId: 261, sourceInstanceId: "pause_mc", rootFrame: 49, scenarioId: "pause-control-structural", label: "Pause control", exporterCanvas: Object.freeze({width: 27, height: 27}), exporterLocalOrigin: Object.freeze({x: -30.45, y: -14.95}), placementEdges: Object.freeze([named("root", 261, "pause_mc")]), behaviorObligations: Object.freeze(["pause activation", "media clock suspension", "audio suspension"])}),
  Object.freeze({frameDomain: "sprite-341", sourceCharacterId: 341, sourceInstanceId: "next_mc", rootFrame: 49, scenarioId: "next-control-structural", label: "Next control", exporterCanvas: Object.freeze({width: 44, height: 44}), exporterLocalOrigin: Object.freeze({x: 21.95, y: 21.95}), placementEdges: Object.freeze([named("root", 341, "next_mc")]), behaviorObligations: Object.freeze(["Next activation", "page completion gate", "child loading"])}),
  Object.freeze({frameDomain: "sprite-343", sourceCharacterId: 343, sourceInstanceId: "back_mc1", rootFrame: 49, scenarioId: "previous-control-structural", label: "Previous control", exporterCanvas: Object.freeze({width: 44, height: 44}), exporterLocalOrigin: Object.freeze({x: 21.95, y: 21.95}), placementEdges: Object.freeze([named("root", 343, "back_mc1")]), behaviorObligations: Object.freeze(["Previous activation", "page history", "child loading"])}),
  Object.freeze({frameDomain: "sprite-687", sourceCharacterId: 687, sourceInstanceId: "glossary.keyterms.Scroll_Dragger", rootFrame: 50, scenarioId: "keyterms-scroll-dragger-structural", label: "keyterms scroll dragger", exporterCanvas: Object.freeze({width: 13, height: 13}), exporterLocalOrigin: Object.freeze({x: 6.35, y: 6.5}), placementEdges: Object.freeze([named("root", 694, "glossary"), named("sprite-694", 693, "keyterms"), named("sprite-693", 687, "Scroll_Dragger")]), behaviorObligations: Object.freeze(["drag behavior", "scroll limits", "dynamic text viewport"])}),
  Object.freeze({frameDomain: "sprite-693", sourceCharacterId: 693, sourceInstanceId: "glossary.keyterms", rootFrame: 50, scenarioId: "keyterms-panel-structural", label: "keyterms panel", exporterCanvas: Object.freeze({width: 1641, height: 462}), exporterLocalOrigin: Object.freeze({x: 924.4, y: 265.5}), placementEdges: Object.freeze([named("root", 694, "glossary"), named("sprite-694", 693, "keyterms")]), behaviorObligations: Object.freeze(["keyterms XML population", "English and Spanish dynamic text", "scrolling and close behavior"])}),
  Object.freeze({frameDomain: "sprite-702", sourceCharacterId: 702, sourceInstanceId: "m_c.keyterm_m_c", rootFrame: 50, scenarioId: "keyterm-content-structural", label: "keyterm content", exporterCanvas: Object.freeze({width: 887, height: 286}), exporterLocalOrigin: Object.freeze({x: 82.6, y: 53.3}), placementEdges: Object.freeze([named("root", 709, "m_c"), named("sprite-709", 702, "keyterm_m_c")]), behaviorObligations: Object.freeze(["dynamic definition text", "diagram loading", "Back and close behavior"])}),
  Object.freeze({frameDomain: "sprite-774", sourceCharacterId: 774, sourceInstanceId: "calculator", rootFrame: 50, scenarioId: "calculator-panel-structural", label: "calculator panel", exporterCanvas: Object.freeze({width: 363, height: 488}), exporterLocalOrigin: Object.freeze({x: 181.25, y: 243.8}), placementEdges: Object.freeze([named("root", 774, "calculator")]), behaviorObligations: Object.freeze(["calculator input", "arithmetic behavior", "close and focus behavior"])}),
]);

function invariant(condition, message) { if (!condition) throw new Error(message); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function portable(value) { return value.split(path.sep).join("/"); }
function round(value) { return Number(value.toFixed(12)); }
function edgeArgument({parentTimelineId, childObjectId, selector}) { return `${parentTimelineId}:${childObjectId}:${selector}`; }
function edgeKey({parentTimelineId, sourceObjectId, selector}) { return `${parentTimelineId}:${sourceObjectId}:${selector}`; }
function matrixFromEdge({transform}) { return {a: Number(transform.scaleX), b: Number(transform.skewY), c: Number(transform.skewX), d: Number(transform.scaleY), e: Number(transform.translatePixels.x), f: Number(transform.translatePixels.y)}; }
function multiply(left, right) { return {a: round(left.a * right.a + left.c * right.b), b: round(left.b * right.a + left.d * right.b), c: round(left.a * right.c + left.c * right.d), d: round(left.b * right.c + left.d * right.d), e: round(left.a * right.e + left.c * right.f + left.e), f: round(left.b * right.e + left.d * right.f + left.f)}; }
function compositionMatrix(matrix, origin) { return {...matrix, e: round(matrix.e - matrix.a * origin.x - matrix.c * origin.y), f: round(matrix.f - matrix.b * origin.x - matrix.d * origin.y)}; }

function pngDimensions(bytes, label) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  invariant(bytes.length >= 24 && bytes.subarray(0, 8).equals(signature) && bytes.toString("ascii", 12, 16) === "IHDR", `${label}: invalid PNG`);
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

async function oneExportDirectory(root, id) {
  const prefix = `DefineSprite_${id}`;
  const matches = (await readdir(root)).filter((name) => name === prefix || name.startsWith(`${prefix}_`));
  invariant(matches.length === 1, `${prefix}: expected one export directory, found ${matches.length}`);
  return path.join(root, matches[0]);
}

async function readPlacementEvidence() {
  const argumentsSet = [...new Set(SINGLE_FRAME_DOMAIN_CONFIGS.flatMap(({placementEdges}) => placementEdges.map(edgeArgument)))];
  const {stdout} = await execFileAsync("python3", [placementParserPath, "--swfmill", swfmillPath, ...argumentsSet.flatMap((edge) => ["--edge", edge])], {cwd: projectRoot, maxBuffer: 4 * 1024 * 1024});
  const parsed = JSON.parse(stdout);
  invariant(parsed.schemaVersion === 1 && parsed.parser === "python-xml.etree.ElementTree", "selector placement parser contract drifted");
  return {parsed, byKey: new Map(parsed.edges.map((edge) => [edgeKey(edge), edge]))};
}

async function expectedExport() {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "g4-l3-shell-single-frame-domains-"));
  try {
    const [version, generatorBytes, parserBytes, swfmillBytes, placementEvidence] = await Promise.all([
      execFileAsync("ffdec", ["-help", "export"], {cwd: projectRoot, maxBuffer: 1024 * 1024}),
      readFile(scriptPath), readFile(placementParserPath), readFile(swfmillPath), readPlacementEvidence(),
    ]);
    invariant(`${version.stdout}${version.stderr}`.includes(expectedFfdecVersion), `FFDec version drifted; expected ${expectedFfdecVersion}`);
    const sourceBefore = sha256(await readFile(sourceSwfPath));
    invariant(sourceBefore === sourceSwfSha256, "preserved shell SWF hash mismatch before export");
    const pngRoot = path.join(temporaryRoot, "png");
    const svgRoot = path.join(temporaryRoot, "svg");
    const ids = SINGLE_FRAME_DOMAIN_CONFIGS.map(({sourceCharacterId}) => sourceCharacterId).join(",");
    const frames = SINGLE_FRAME_DOMAIN_CONFIGS.map(({sourceCharacterId}) => `${sourceCharacterId}:1`).join(",");
    for (const [format, target] of [["png", pngRoot], ["svg", svgRoot]]) {
      await execFileAsync("ffdec", ["-format", `sprite:${format}`, "-selectid", ids, "-select", frames, "-onerror", "abort", "-export", "sprite", target, sourceSwfPath], {cwd: projectRoot, maxBuffer: 32 * 1024 * 1024});
    }
    invariant(sha256(await readFile(sourceSwfPath)) === sourceBefore, "preserved shell SWF changed during read-only export");

    const domains = [];
    for (const config of SINGLE_FRAME_DOMAIN_CONFIGS) {
      const pngDirectory = await oneExportDirectory(pngRoot, config.sourceCharacterId);
      const svgDirectory = await oneExportDirectory(svgRoot, config.sourceCharacterId);
      const pngBytes = await readFile(path.join(pngDirectory, "1.png"));
      const dimensions = pngDimensions(pngBytes, config.frameDomain);
      invariant(dimensions.width === config.exporterCanvas.width && dimensions.height === config.exporterCanvas.height, `${config.frameDomain}: exporter canvas drifted`);
      const svg = await readFile(path.join(svgDirectory, "1.svg"), "utf8");
      const originMatch = svg.match(/<g transform="matrix\(1\.0, 0\.0, 0\.0, 1\.0, (-?[0-9.]+), (-?[0-9.]+)\)"/);
      invariant(originMatch && Number(originMatch[1]) === config.exporterLocalOrigin.x && Number(originMatch[2]) === config.exporterLocalOrigin.y, `${config.frameDomain}: exporter origin drifted`);
      const placementChain = config.placementEdges.map((edge) => {
        const evidence = placementEvidence.byKey.get(`${edge.parentTimelineId}:${edge.childObjectId}:${edge.selector}`);
        invariant(evidence, `${config.frameDomain}: placement evidence missing for ${edgeArgument(edge)}`);
        return evidence;
      });
      invariant(placementChain[0].frame === config.rootFrame, `${config.frameDomain}: root entry frame drifted`);
      let effectiveRootMatrix = {a: 1, b: 0, c: 0, d: 1, e: 0, f: 0};
      for (const edge of placementChain) effectiveRootMatrix = multiply(effectiveRootMatrix, matrixFromEdge(edge));
      const rootCompositionMatrix = compositionMatrix(effectiveRootMatrix, config.exporterLocalOrigin);
      const digest = sha256(pngBytes);
      const file = `visual-001-${digest.slice(0, 12)}.png`;
      const asset = {visualIndex: 1, file, sha256: digest, bytes: pngBytes.length, ...dimensions, sourcePath: path.join(pngDirectory, "1.png")};
      const manifest = {
        schemaVersion: 1, evidenceType: "ffdec-static-nested-timeline-implementation-assets", animationId,
        classification: "engineering-structural-inspection-not-strict-acceptance",
        authority: {kind: "ffdec-static-nested-timeline-render", statement: `This PNG and one-frame lookup are a deterministic FFDec static export of ${config.frameDomain} (${config.sourceInstanceId}) for structural inspection only.`, authorityBoundary: "This is not original-runtime playback, ActionScript execution, event causality, dynamic text truth, interaction, audio, localization, Replay, full-stage composition parity, RMSE, strict human review, owner acceptance, or strict completion.", actionScriptExecuted: false, originalRuntimeBaseline: false, naturalPlaybackClaimed: false},
        generator: {path: portable(path.relative(projectRoot, scriptPath)), sha256: sha256(generatorBytes)},
        placementParser: {path: placementParserRelative, sha256: sha256(parserBytes), engine: placementEvidence.parsed.parser},
        tool: {name: "FFDec", version: expectedFfdecVersion},
        source: {swf: sourceSwfRelative, swfSha256: sourceSwfSha256, swfmill: swfmillRelative, swfmillSha256: sha256(swfmillBytes)},
        runtime: {fps: 12, frameDomain: config.frameDomain, sourceCharacterId: config.sourceCharacterId, sourceInstanceId: config.sourceInstanceId, frameCount: 1, rootFrame: config.rootFrame, frameNumbering: "one-indexed", supportedLanguages: ["en", "es"], visualLocalizationStatus: "source-static-shell-control-visuals", spanishTranslationSupplied: false},
        geometry: {exporterCanvas: config.exporterCanvas, exporterLocalOrigin: config.exporterLocalOrigin, rootPlacementChain: placementChain, effectiveRootMatrix, rootCompositionMatrix, rootCompositionOffset: {x: rootCompositionMatrix.e, y: rootCompositionMatrix.f}, compositionStatus: "source-static-placement-matrix-candidate-runtime-unverified"},
        behaviorObligations: config.behaviorObligations,
        deduplication: {method: "sha256-identical-png-bytes", frameCount: 1, uniqueVisualCount: 1, visualRunCount: 1, everyFrameMapped: true},
        assets: [{visualIndex: 1, firstFrame: 1, file, sha256: digest, bytes: pngBytes.length, ...dimensions}],
        frames: [{frame: 1, file, sha256: digest}], strictAcceptanceEffect: "none",
      };
      const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
      domains.push({config, asset, manifest, manifestBytes, manifestSha256: sha256(manifestBytes), rootCompositionMatrix});
    }
    const data = Object.fromEntries(domains.map(({config, asset, manifestSha256, rootCompositionMatrix}) => [config.frameDomain, {
      frameDomain: config.frameDomain, scenarioId: config.scenarioId, label: config.label, sourceCharacterId: config.sourceCharacterId,
      sourceInstanceId: config.sourceInstanceId, frameCount: 1, rootFrame: config.rootFrame, exporterCanvas: config.exporterCanvas,
      exporterLocalOrigin: config.exporterLocalOrigin, rootCompositionMatrix, rootCompositionOffset: {x: rootCompositionMatrix.e, y: rootCompositionMatrix.f},
      assetManifestSha256: manifestSha256, behaviorObligations: config.behaviorObligations,
      assets: [{visualIndex: 1, file: asset.file, sha256: asset.sha256}], runs: [{startFrame: 1, endFrame: 1, visualIndex: 1}],
    }]));
    const timelineData = Buffer.from(`// Generated by ${portable(path.relative(projectRoot, scriptPath))}. Do not edit.\n// FFDec structural inspection data only; this is not original-runtime evidence.\n\nexport const COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA = Object.freeze(${JSON.stringify(data, null, 2)} as const);\n\nexport type CourseShellG04L03SingleFrameDomainId = keyof typeof COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA;\nexport const COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_IDS = Object.freeze(Object.keys(COURSE_SHELL_G04_L03_SINGLE_FRAME_DOMAIN_DATA) as CourseShellG04L03SingleFrameDomainId[]);\n`);
    return {temporaryRoot, domains, timelineData};
  } catch (error) {
    await rm(temporaryRoot, {recursive: true, force: true});
    throw error;
  }
}

function outputDirectory(config) { return path.join(projectRoot, `public/flash-assets/courses/${animationId}/${config.frameDomain}`); }

async function checkOutput(expected) {
  for (const domain of expected.domains) {
    const directory = outputDirectory(domain.config);
    invariant(JSON.stringify((await readdir(directory)).sort()) === JSON.stringify([domain.asset.file, "manifest.json"].sort()), `${domain.config.frameDomain}: output file set mismatch`);
    invariant((await readFile(path.join(directory, "manifest.json"))).equals(domain.manifestBytes), `${domain.config.frameDomain}: manifest is stale`);
    const bytes = await readFile(path.join(directory, domain.asset.file));
    invariant(sha256(bytes) === domain.asset.sha256 && bytes.length === domain.asset.bytes, `${domain.config.frameDomain}: visual asset drifted`);
  }
  invariant((await readFile(timelineDataPath)).equals(expected.timelineData), "single-frame-domain timeline data is stale");
}

async function writeOutput(expected) {
  await mkdir(path.dirname(timelineDataPath), {recursive: true});
  for (const domain of expected.domains) {
    const directory = outputDirectory(domain.config);
    await mkdir(directory, {recursive: true});
    const expectedNames = new Set([domain.asset.file, "manifest.json"]);
    const unexpected = (await readdir(directory)).filter((name) => !expectedNames.has(name));
    invariant(unexpected.length === 0, `${domain.config.frameDomain}: refusing unexpected files ${unexpected.join(", ")}`);
    await copyFile(domain.asset.sourcePath, path.join(directory, domain.asset.file));
    await writeFile(path.join(directory, "manifest.json"), domain.manifestBytes);
  }
  await writeFile(timelineDataPath, expected.timelineData);
  await checkOutput(expected);
}

export function parseArguments(argv) {
  const unknown = argv.filter((argument) => argument !== "--check");
  if (unknown.length) throw new Error(`Unknown argument: ${unknown[0]}`);
  return {check: argv.includes("--check")};
}

export async function buildG4L3ShellSingleFrameDomains({check = false} = {}) {
  const expected = await expectedExport();
  try {
    if (check) await checkOutput(expected); else await writeOutput(expected);
    return expected.domains.map(({manifest}) => manifest);
  } finally {
    await rm(expected.temporaryRoot, {recursive: true, force: true});
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const options = parseArguments(process.argv.slice(2));
  const manifests = await buildG4L3ShellSingleFrameDomains(options);
  console.log(`${options.check ? "Verified" : "Built"} ${manifests.length} one-frame G4 L3 shell structural domains (${manifests.length} frames, ${manifests.length} visuals).`);
}
