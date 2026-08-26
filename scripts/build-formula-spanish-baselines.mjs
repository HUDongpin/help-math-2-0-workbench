#!/usr/bin/env node

import {execFile as execFileCallback} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdir, mkdtemp, readFile, readdir, rename, rm, stat, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {gunzipSync} from "node:zlib";
import {fileURLToPath} from "node:url";

import pixelmatch from "pixelmatch";
import {PNG} from "pngjs";
import sharp from "sharp";

import {verifyPerFileFlaAuthoringAudit} from "./build-course-strict-readiness.mjs";

const execFile = promisify(execFileCallback);
const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
const projectRoot = path.resolve(scriptDirectory, "..");
const parserPath = path.join(scriptDirectory, "parse-swfmill-formula-panel-evidence.py");
const STAGE = Object.freeze({width: 780, height: 379});
const FPS = 12;
const STATIC_THRESHOLD = 0.05;
export const FORMULA_SPANISH_BASELINE_SCHEMA_VERSION = 2;
export const FORMULA_SPANISH_BASELINE_GENERATOR_VERSION = "2.0.0";
const INVALIDATED_FFDEC_ES_COMPARISON = Object.freeze({
  animationId: "formula-elementary-conversion-01-01",
  canonicalName: "full-frame-comparison-default-es.json",
  archiveName: "full-frame-comparison-default-es.invalidated-ffdec-whole-frame.json",
  sha256: "c0933c5543856535c8de394a3842f73a1d4c3b94de533a18c9f505ffcd90df93",
  failingFrames: Object.freeze([10, 11, 12, 52, 53]),
});
const INVALIDATED_HMR_ES_CAPTURE = Object.freeze({
  animationId: "formula-elementary-conversion-01-04",
  sourceFile: "output/playwright/formula-spanish-fidelity/formula-elementary-conversion-01-04/default/es/capture-manifest.json",
  archiveName: "capture-default-es.invalidated-hmr-err-aborted-frame-7.json",
  sha256: "53ad68a8a6c05aedb701d1cf680e7c24ba6de3114c0b71a37bb6c40d55c3befe",
  capturedFrames: Object.freeze([1, 2, 3, 4, 5, 6]),
  failedRequestCount: 2,
  abortedFrame: 7,
});

export const FORMULA_PILOTS = Object.freeze([
  Object.freeze({id: "formula-elementary-conversion-01-01", key: "conversion-1-1", frameCount: 94}),
  Object.freeze({id: "formula-elementary-conversion-01-02", key: "conversion-1-2", frameCount: 109}),
  Object.freeze({id: "formula-elementary-conversion-01-03", key: "conversion-1-3", frameCount: 170}),
  Object.freeze({id: "formula-elementary-conversion-01-04", key: "conversion-1-4", frameCount: 67}),
]);

function usage() {
  return `Usage:
  node scripts/build-formula-spanish-baselines.mjs [options]

Options:
  --id <animation-id>       Build one pilot (repeatable; default: all four)
  --check                   Recompute and reject stale assets/evidence
  --generated-at <ISO>      Override report generation time
  --ffdec <command>         FFDec launcher (default: ffdec)
  --python <command>        Python launcher (default: python3)
  --help                    Show this help

The builder combines the hash-verified Adobe English natural-playback frames
with only the source-extracted root Mc_SD panel. FFDec full frames are used to
calibrate the panel crop, never as the dynamic runtime baseline. A current,
verified schema-v2 recursive Animate audit is required; schema-v1 audits fail
before generation or --check work begins.`;
}

export function parseArguments(argumentsList) {
  const options = {ids: [], check: false, ffdec: "ffdec", python: "python3"};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const value = argumentsList[index];
    if (value === "--check") options.check = true;
    else if (value === "--help" || value === "-h") options.help = true;
    else if (["--id", "--generated-at", "--ffdec", "--python"].includes(value)) {
      const next = argumentsList[index + 1];
      if (!next) throw new Error(`${value} requires a value`);
      if (value === "--id") options.ids.push(next);
      else if (value === "--generated-at") options.generatedAt = next;
      else if (value === "--ffdec") options.ffdec = next;
      else options.python = next;
      index += 1;
    } else throw new Error(`Unknown option: ${value}`);
  }
  return options;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function portable(candidate) {
  return candidate.split(path.sep).join("/");
}

function projectPath(candidate) {
  return portable(path.relative(projectRoot, candidate));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sameNumber(actual, expected, label, epsilon = 1e-9) {
  assert(Number.isFinite(actual) && Math.abs(actual - expected) <= epsilon,
    `${label}: expected ${expected}, observed ${actual}`);
}

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function readJson(candidate) {
  const bytes = await readFile(candidate);
  return {bytes, sha256: sha256(bytes), value: JSON.parse(bytes.toString("utf8"))};
}

async function readVerified(candidate, expectedSha256, label) {
  const bytes = await readFile(candidate);
  const observed = sha256(bytes);
  assert(observed === expectedSha256, `${label} SHA-256 mismatch: expected ${expectedSha256}, observed ${observed}`);
  return {bytes, sha256: observed};
}

async function writeAtomically(destination, bytes) {
  await mkdir(path.dirname(destination), {recursive: true});
  const temporary = `${destination}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes);
  await rename(temporary, destination);
}

async function assertArchived(destination, expected, label) {
  const observed = await readFile(destination);
  assert(observed.equals(expected), `${label} is stale: expected ${sha256(expected)}, observed ${sha256(observed)}`);
}

export async function archiveInvalidatedComparison({
  sourceFile,
  archiveFile,
  expectedSha256,
  animationId,
  expectedFailures,
  check = false,
}) {
  let archivedBytes;
  if (await exists(archiveFile)) {
    archivedBytes = (await readVerified(archiveFile, expectedSha256, `${animationId} invalidated comparison archive`)).bytes;
  } else {
    assert(!check, `${animationId}: invalidated comparison archive is missing in --check mode`);
    archivedBytes = (await readVerified(sourceFile, expectedSha256, `${animationId} superseded FFDec comparison`)).bytes;
    await writeAtomically(archiveFile, archivedBytes);
  }
  const report = JSON.parse(archivedBytes.toString("utf8"));
  assert(report.animationId === animationId, `${animationId}: invalidated comparison identity mismatch`);
  assert(String(report.inputs?.baseline?.directory || "").includes("ffdec-root-frames"),
    `${animationId}: invalidated comparison was not based on FFDec whole frames`);
  assert(report.summary?.allAssignedThresholdsPass === false,
    `${animationId}: invalidated comparison does not retain its failed disposition`);
  assert(JSON.stringify(report.summary?.outliers?.failingAssignedThreshold) === JSON.stringify(expectedFailures),
    `${animationId}: invalidated comparison failure frames changed`);
  return {
    file: projectPath(archiveFile),
    sha256: expectedSha256,
    disposition: "invalidated-as-runtime-baseline",
    reason: "FFDec root-frame exports are structural evidence, not natural-playback runtime frames.",
    failingAssignedThresholdFrames: [...expectedFailures],
  };
}

export async function archiveInvalidatedCapture({
  sourceFile,
  archiveFile,
  expectedSha256,
  animationId,
  expectedCapturedFrames,
  expectedFailedRequestCount,
  expectedAbortedFrame,
  check = false,
}) {
  let archivedBytes;
  if (await exists(archiveFile)) {
    archivedBytes = (await readVerified(archiveFile, expectedSha256, `${animationId} invalidated capture archive`)).bytes;
  } else {
    assert(!check, `${animationId}: invalidated capture archive is missing in --check mode`);
    archivedBytes = (await readVerified(sourceFile, expectedSha256, `${animationId} failed HMR capture`)).bytes;
    await writeAtomically(archiveFile, archivedBytes);
  }
  const manifest = JSON.parse(archivedBytes.toString("utf8"));
  assert(manifest.status === "failed", `${animationId}: invalidated capture no longer has failed status`);
  assert(JSON.stringify(manifest.captured?.map(({frame}) => frame)) === JSON.stringify(expectedCapturedFrames),
    `${animationId}: invalidated capture frame coverage changed`);
  assert(manifest.failedRequests?.length === expectedFailedRequestCount,
    `${animationId}: invalidated capture failed-request count changed`);
  assert(String(manifest.error || "").includes("net::ERR_ABORTED")
    && String(manifest.error).includes(`frame=${expectedAbortedFrame}`),
  `${animationId}: invalidated capture does not retain the expected frame-${expectedAbortedFrame} ERR_ABORTED`);
  return {
    file: projectPath(archiveFile),
    sha256: expectedSha256,
    disposition: "invalidated-transient-dev-hmr-capture",
    reason: `The dev server changed during navigation to frame ${expectedAbortedFrame}; the failed manifest is retained and excluded from canonical comparison.`,
    capturedFrames: [...expectedCapturedFrames],
    failedRequestCount: expectedFailedRequestCount,
    abortedFrame: expectedAbortedFrame,
  };
}

function png(bytes, label, stage = STAGE) {
  let image;
  try {
    image = PNG.sync.read(bytes);
  } catch (error) {
    throw new Error(`${label} is not a decodable PNG: ${error.message}`);
  }
  assert(image.width === stage.width && image.height === stage.height,
    `${label} is ${image.width}x${image.height}; expected ${stage.width}x${stage.height}`);
  return image;
}

function cropPixels(image, crop) {
  const bytes = Buffer.alloc(crop.width * crop.height * 4);
  for (let row = 0; row < crop.height; row += 1) {
    const sourceStart = ((crop.y + row) * image.width + crop.x) * 4;
    image.data.copy(bytes, row * crop.width * 4, sourceStart, sourceStart + crop.width * 4);
  }
  return bytes;
}

function compareRgb(left, right, width, height) {
  assert(left.length === right.length && left.length === width * height * 4, "pixel buffers differ in size");
  let squaredError = 0;
  const leftPng = new PNG({width, height});
  const rightPng = new PNG({width, height});
  left.copy(leftPng.data);
  right.copy(rightPng.data);
  for (let index = 0; index < left.length; index += 4) {
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = left[index + channel] - right[index + channel];
      squaredError += delta * delta;
    }
  }
  const diff = new PNG({width, height});
  const mismatchedPixels = pixelmatch(leftPng.data, rightPng.data, diff.data, width, height, {
    threshold: 0.1,
    includeAA: true,
  });
  return {
    normalizedRmse: Math.sqrt(squaredError / (width * height * 3)) / 255,
    mismatchedPixels,
    mismatchedPixelRatio: mismatchedPixels / (width * height),
  };
}

function outsideCropChanged(left, right, stage, crop) {
  let changed = 0;
  for (let y = 0; y < stage.height; y += 1) for (let x = 0; x < stage.width; x += 1) {
    if (x >= crop.x && x < crop.x + crop.width && y >= crop.y && y < crop.y + crop.height) continue;
    const offset = (y * stage.width + x) * 4;
    if (left.data[offset] !== right.data[offset]
      || left.data[offset + 1] !== right.data[offset + 1]
      || left.data[offset + 2] !== right.data[offset + 2]
      || left.data[offset + 3] !== right.data[offset + 3]) changed += 1;
  }
  return changed;
}

function directoryDigest(frames) {
  return sha256(frames.map(({frame, sha256: digest}) => `${frame}\0${digest}\n`).join(""));
}

function extractSvgInner(svgText) {
  const openingStart = svgText.indexOf("<svg");
  const openingEnd = svgText.indexOf(">", openingStart);
  const closing = svgText.lastIndexOf("</svg>");
  assert(openingStart >= 0 && openingEnd > openingStart && closing > openingEnd,
    "FFDec panel SVG has no complete root element");
  // All geometry and metadata are independently parsed with ElementTree. This
  // splice only preserves the exact exported child bytes inside a translated
  // parent SVG so librsvg does not resample a nested data-URI image.
  return svgText.slice(openingEnd + 1, closing);
}

export function buildPanelOverlaySvg(panelSvg, placement, dimensions, stage = STAGE) {
  const inner = extractSvgInner(panelSvg.toString("utf8"));
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:ffdec="https://www.free-decompiler.com/flash" width="${stage.width}" height="${stage.height}" viewBox="0 0 ${stage.width} ${stage.height}">`
    + `<svg x="${placement.x}" y="${placement.y}" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}">${inner}</svg>`
    + "</svg>",
  );
}

export async function compositeSpanishPanel(basePng, overlaySvg) {
  return sharp(basePng, {limitInputPixels: false})
    .composite([{input: overlaySvg, left: 0, top: 0}])
    .png({compressionLevel: 9, adaptiveFiltering: false, palette: false})
    .toBuffer();
}

async function exportPanelSvg({ffdec, swf, objectId}) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "help-formula-spanish-panel-"));
  try {
    await execFile(ffdec, [
      "-onerror", "abort",
      "-selectid", String(objectId),
      "-format", "sprite:svg",
      "-export", "sprite",
      temporary,
      swf,
    ], {maxBuffer: 8 * 1024 * 1024});
    const candidate = path.join(temporary, `DefineSprite_${objectId}`, "1.svg");
    assert(await exists(candidate), `FFDec did not export ${candidate}`);
    return await readFile(candidate);
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
}

export async function parseStructure({python, swfmill, svg}) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "help-formula-panel-svg-"));
  try {
    const svgPath = path.join(temporary, "panel.svg");
    await writeFile(svgPath, svg);
    const {stdout} = await execFile(python, [parserPath, "--swfmill", swfmill, "--svg", svgPath], {
      maxBuffer: 4 * 1024 * 1024,
    });
    return JSON.parse(stdout);
  } finally {
    await rm(temporary, {recursive: true, force: true});
  }
}

function outputRecord(file, bytes, frame) {
  return {
    frame,
    file: path.basename(file),
    sha256: sha256(bytes),
    bytes: bytes.length,
    width: STAGE.width,
    height: STAGE.height,
  };
}

function validateAuthoringAudit(audit, manifest, pilot) {
  assert(audit.animationId === pilot.id, `${pilot.id}: authoring audit animationId mismatch`);
  assert(audit.source?.flaSha256 === manifest.source.flaSha256, `${pilot.id}: authoring audit FLA hash mismatch`);
  assert(audit.protocol?.openedWithoutSaving === true, `${pilot.id}: FLA was not recorded as opened without saving`);
  assert(audit.nativeMovie?.frameCount === pilot.frameCount, `${pilot.id}: authoring frame count mismatch`);
  const mcLayer = audit.authoringAudit?.timeline?.layers?.find(({name}) => name === "Mc");
  assert(mcLayer, `${pilot.id}: FLA authoring audit has no Mc layer`);
  assert(mcLayer.frameCount === pilot.frameCount, `${pilot.id}: FLA Mc layer does not span the movie`);
  assert(mcLayer.keyframes?.length === 1
    && mcLayer.keyframes[0].flashFrame === 1
    && mcLayer.keyframes[0].duration === pilot.frameCount
    && mcLayer.keyframes[0].elementCount === 2,
  `${pilot.id}: FLA Mc layer does not contain two persistent frame-1 definition elements`);
  const spanishLibrary = audit.authoringAudit?.library?.find(({name}) => name === "Mc_S_Def");
  assert(spanishLibrary?.timeline?.frameCount === 1 && spanishLibrary.timeline.layerCount === 2,
    `${pilot.id}: FLA Mc_S_Def is not a static one-frame/two-layer symbol`);
  return {
    mcLayer: {index: mcLayer.index, frameCount: mcLayer.frameCount, keyframes: mcLayer.keyframes},
    spanishLibraryItem: spanishLibrary,
  };
}

export async function requireCurrentFormulaAuthoringAudit({
  root = projectRoot,
  migrationRoot,
  manifest,
  pilot,
  header,
}) {
  assert(header?.widthPx === STAGE.width
    && header?.heightPx === STAGE.height
    && header?.frameRate === FPS
    && header?.frameCount === pilot.frameCount,
  `${pilot.id}: machine-audit header is unavailable or differs from the formula runtime`);
  const contract = await verifyPerFileFlaAuthoringAudit({
    projectRoot: root,
    workspace: migrationRoot,
    manifest,
    header,
  });
  assert(
    contract.state.status === "verified-current-recursive-authoring-audit"
      && contract.state.comprehensiveCurrentContract === true,
    `${pilot.id}: FLA-derived Spanish baseline requires a verified current schema-v2 recursive Animate authoring audit; observed ${contract.state.status}`,
  );
  const authoringFile = path.join(migrationRoot, "audit", "adobe-animate-2021-authoring-audit.json");
  const authoringSource = await readJson(authoringFile);
  assert(authoringSource.sha256 === contract.state.report.sha256,
    `${pilot.id}: verified Animate authoring report hash changed before semantic validation`);
  const semanticEvidence = validateAuthoringAudit(authoringSource.value, manifest, pilot);
  return {
    authoringFile,
    authoringSource,
    semanticEvidence,
    contract: {
      status: contract.state.status,
      comprehensiveCurrentContract: contract.state.comprehensiveCurrentContract,
      strictAcceptanceEffect: contract.state.strictAcceptanceEffect,
      canonicalSchemaVersion: contract.state.canonicalSchemaVersion,
      evidence: contract.evidence.map(({id, path: evidencePath, sha256: digest}) => ({
        id,
        file: evidencePath.startsWith("audit/")
          ? portable(path.relative(root, path.join(migrationRoot, evidencePath)))
          : evidencePath,
        sha256: digest,
      })),
    },
  };
}

function machineOutput(report, relative) {
  const result = report.outputs?.find(({path: candidate}) => candidate === relative);
  assert(result, `machine report has no ${relative}`);
  return result;
}

function validateStructure(structure, pilot) {
  sameNumber(structure.stage.width, STAGE.width, `${pilot.id} parsed stage width`);
  sameNumber(structure.stage.height, STAGE.height, `${pilot.id} parsed stage height`);
  sameNumber(structure.header.frameRate, FPS, `${pilot.id} parsed FPS`);
  assert(structure.header.frameCount === pilot.frameCount, `${pilot.id}: parsed frame count mismatch`);
  assert(structure.header.showFrameCount === pilot.frameCount, `${pilot.id}: root ShowFrame count mismatch`);
  const panel = structure.panel;
  assert(panel.instanceName === "Mc_SD" && panel.objectId === 134 && panel.depth === 4,
    `${pilot.id}: expected Mc_SD character 134 at root depth 4`);
  assert(panel.placementFrame === 1 && panel.persistsThroughFrame === pilot.frameCount,
    `${pilot.id}: Mc_SD does not persist from frame 1 through terminal frame`);
  assert(panel.rootDepthEvents.length === 1
    && panel.rootDepthEvents[0].tag === "PlaceObject2"
    && panel.rootDepthEvents[0].frame === 1
    && panel.rootDepthEvents[0].objectID === 134,
  `${pilot.id}: root depth 4 is replaced or removed after Mc_SD placement`);
  assert(panel.spriteFrameCount === 1, `${pilot.id}: Mc_SD is not a static one-frame sprite`);
  sameNumber(structure.exportedSvg.width, 365.7, `${pilot.id} panel width`);
  sameNumber(structure.exportedSvg.height, 52.8, `${pilot.id} panel height`);
  assert(JSON.stringify(structure.exportedSvg.characterIds) === JSON.stringify([132, 133]),
    `${pilot.id}: exported Mc_SD does not contain source characters 132 and 133`);
  sameNumber(panel.placementPixels.x, 414.3, `${pilot.id} panel x`);
  return panel;
}

async function validateAdobeEnglishBaseline(pilot, migrationRoot, manifest) {
  const reportFile = path.join(migrationRoot, manifest.baseline.report);
  const reportSource = await readVerified(reportFile, manifest.baseline.reportSha256, `${pilot.id} Adobe report`);
  const report = JSON.parse(reportSource.bytes.toString("utf8"));
  assert(report.status === "authoritative-standalone-runtime-baseline", `${pilot.id}: Adobe report status is not authoritative`);
  assert(report.authority?.kind === "original-swf-adobe-flash-player-runtime", `${pilot.id}: Adobe report authority mismatch`);
  assert(report.runtime?.lang === "en" && report.runtime?.scenario === "standalone-default",
    `${pilot.id}: Adobe base is not standalone-default/en`);
  assert(report.frames?.length === pilot.frameCount, `${pilot.id}: Adobe report frame coverage mismatch`);
  const archive = path.resolve(projectRoot, report.capture.archiveDirectory);
  const frames = [];
  for (const record of report.frames) {
    const file = path.join(archive, record.file);
    const source = await readVerified(file, record.sha256, `${pilot.id} Adobe frame ${record.frame}`);
    png(source.bytes, `${pilot.id} Adobe frame ${record.frame}`);
    frames.push({record, file, bytes: source.bytes});
  }
  return {reportFile, reportSource, report, archive, frames};
}

async function validateFfdecRootFrames(pilot, migrationRoot, manifest) {
  const reportFile = path.join(migrationRoot, "baseline", "ffdec-root-frames.json");
  const reportSource = await readJson(reportFile);
  const report = reportSource.value;
  assert(report.animationId === pilot.id && report.status === "structural-baseline-only",
    `${pilot.id}: FFDec structural report identity/status mismatch`);
  assert(report.source?.swfSha256 === manifest.source.swfSha256, `${pilot.id}: FFDec structural source hash mismatch`);
  assert(report.frames?.length === pilot.frameCount, `${pilot.id}: FFDec structural frame coverage mismatch`);
  const archive = path.resolve(projectRoot, report.archive.root);
  const frames = [];
  for (const record of report.frames) {
    const file = path.join(archive, record.file);
    const source = await readVerified(file, record.sha256, `${pilot.id} FFDec frame ${record.frame}`);
    frames.push({record, file, bytes: source.bytes, image: png(source.bytes, `${pilot.id} FFDec frame ${record.frame}`)});
  }
  return {reportFile, reportSource, report, archive, frames};
}

async function buildPilot(pilot, options) {
  const migrationRoot = path.join(projectRoot, "migrations", pilot.id);
  const manifestSource = await readJson(path.join(migrationRoot, "migration.json"));
  const manifest = manifestSource.value;
  assert(manifest.animationId === pilot.id, `${pilot.id}: migration identity mismatch`);
  assert(manifest.runtime?.frameCount === pilot.frameCount
    && manifest.runtime?.fps === FPS
    && manifest.runtime?.stage?.width === STAGE.width
    && manifest.runtime?.stage?.height === STAGE.height,
  `${pilot.id}: migration runtime metadata mismatch`);
  const sourceSwf = path.resolve(projectRoot, manifest.source.swf);
  const sourceFla = path.resolve(projectRoot, manifest.source.fla);
  await readVerified(sourceSwf, manifest.source.swfSha256, `${pilot.id} source SWF`);
  await readVerified(sourceFla, manifest.source.flaSha256, `${pilot.id} source FLA`);

  const machineFile = path.join(migrationRoot, "audit", "machine", "report.json");
  const machineSource = await readJson(machineFile);
  const machine = machineSource.value;
  assert(machine.source?.hashMatches === true && machine.source?.expectedSha256 === manifest.source.swfSha256,
    `${pilot.id}: machine audit is not bound to source SWF`);
  const authoring = await requireCurrentFormulaAuthoringAudit({
    migrationRoot,
    manifest,
    pilot,
    header: machine.findings?.ffdecHeader,
  });
  const swfmillRecord = machineOutput(machine, "audit/machine/swfmill.xml.gz");
  const swfmillFile = path.join(migrationRoot, "audit", "machine", "swfmill.xml.gz");
  const swfmillSource = await readVerified(swfmillFile, swfmillRecord.sha256, `${pilot.id} swfmill XML`);
  assert(sha256(gunzipSync(swfmillSource.bytes)) === swfmillRecord.uncompressedSha256,
    `${pilot.id}: uncompressed swfmill XML hash mismatch`);
  const scriptRecord = machineOutput(machine, "audit/machine/ffdec-scripts.txt.gz");
  const scriptFile = path.join(migrationRoot, "audit", "machine", "ffdec-scripts.txt.gz");
  const scriptSource = await readVerified(scriptFile, scriptRecord.sha256, `${pilot.id} FFDec scripts`);
  const scripts = gunzipSync(scriptSource.bytes);
  assert(sha256(scripts) === scriptRecord.uncompressedSha256, `${pilot.id}: uncompressed script hash mismatch`);
  const scriptText = scripts.toString("utf8");
  assert(scriptText.includes('if(_root.dtfSpanishFormulas.text.toUpperCase() == "ON")')
    && scriptText.includes("Mc_SD._visible = true;")
    && scriptText.includes("Mc_SD._visible = false;"),
  `${pilot.id}: source language-visibility script was not recovered exactly`);

  const panelSvg = await exportPanelSvg({ffdec: options.ffdec, swf: sourceSwf, objectId: 134});
  const structure = await parseStructure({python: options.python, swfmill: swfmillFile, svg: panelSvg});
  const panel = validateStructure(structure, pilot);
  const crop = {
    x: Math.floor(panel.placementPixels.x),
    y: Math.floor(panel.placementPixels.y),
    width: Math.ceil(panel.placementPixels.x + structure.exportedSvg.width) - Math.floor(panel.placementPixels.x),
    height: Math.ceil(panel.placementPixels.y + structure.exportedSvg.height) - Math.floor(panel.placementPixels.y),
  };
  assert(crop.x >= 0 && crop.y >= 0 && crop.x + crop.width <= STAGE.width && crop.y + crop.height <= STAGE.height,
    `${pilot.id}: panel crop lies outside the native stage`);

  const adobe = await validateAdobeEnglishBaseline(pilot, migrationRoot, manifest);
  const ffdec = await validateFfdecRootFrames(pilot, migrationRoot, manifest);
  const invalidatedComparison = pilot.id === INVALIDATED_FFDEC_ES_COMPARISON.animationId
    ? await archiveInvalidatedComparison({
      sourceFile: path.join(migrationRoot, "evidence", INVALIDATED_FFDEC_ES_COMPARISON.canonicalName),
      archiveFile: path.join(migrationRoot, "evidence", INVALIDATED_FFDEC_ES_COMPARISON.archiveName),
      expectedSha256: INVALIDATED_FFDEC_ES_COMPARISON.sha256,
      animationId: pilot.id,
      expectedFailures: INVALIDATED_FFDEC_ES_COMPARISON.failingFrames,
      check: options.check,
    })
    : null;
  const invalidatedCapture = pilot.id === INVALIDATED_HMR_ES_CAPTURE.animationId
    ? await archiveInvalidatedCapture({
      sourceFile: path.join(projectRoot, INVALIDATED_HMR_ES_CAPTURE.sourceFile),
      archiveFile: path.join(migrationRoot, "evidence", INVALIDATED_HMR_ES_CAPTURE.archiveName),
      expectedSha256: INVALIDATED_HMR_ES_CAPTURE.sha256,
      animationId: pilot.id,
      expectedCapturedFrames: INVALIDATED_HMR_ES_CAPTURE.capturedFrames,
      expectedFailedRequestCount: INVALIDATED_HMR_ES_CAPTURE.failedRequestCount,
      expectedAbortedFrame: INVALIDATED_HMR_ES_CAPTURE.abortedFrame,
      check: options.check,
    })
    : null;
  const structuralCropHashes = new Set(ffdec.frames.map(({image}) => sha256(cropPixels(image, crop))));
  assert(structuralCropHashes.size === 1,
    `${pilot.id}: FFDec source display structure does not keep an invariant Mc_SD crop across all frames`);

  const overlay = buildPanelOverlaySvg(panelSvg, panel.placementPixels, structure.exportedSvg);
  const outputDirectory = path.join(
    projectRoot,
    "artifacts", "full-frame", "pilot-baselines", pilot.id, "source-composited-spanish-default",
  );
  const assetFile = path.join(projectRoot, "public", "flash-assets", pilot.key, "formula-es.svg");
  const outputFrames = [];
  const outputBytes = [];
  let outsideCropChangedPixels = 0;
  const compositedCropHashes = new Set();
  for (let index = 0; index < adobe.frames.length; index += 1) {
    const frame = index + 1;
    assert(adobe.frames[index].record.frame === frame && ffdec.frames[index].record.frame === frame,
      `${pilot.id}: source frame records are not sequential at ${frame}`);
    const bytes = await compositeSpanishPanel(adobe.frames[index].bytes, overlay);
    const image = png(bytes, `${pilot.id} composited Spanish frame ${frame}`);
    outsideCropChangedPixels += outsideCropChanged(png(adobe.frames[index].bytes, `${pilot.id} Adobe base ${frame}`), image, STAGE, crop);
    compositedCropHashes.add(sha256(cropPixels(image, crop)));
    const file = path.join(outputDirectory, `frame-${String(frame).padStart(4, "0")}.png`);
    outputFrames.push(outputRecord(file, bytes, frame));
    outputBytes.push({file, bytes});
  }
  assert(outsideCropChangedPixels === 0, `${pilot.id}: compositor changed pixels outside the source-derived panel crop`);
  assert(compositedCropHashes.size === 1, `${pilot.id}: composited Spanish panel is not visually fixed across all frames`);

  const calibrationFrames = [1, pilot.frameCount].map((frame) => {
    const structural = cropPixels(ffdec.frames[frame - 1].image, crop);
    const composited = cropPixels(png(outputBytes[frame - 1].bytes, `${pilot.id} output ${frame}`), crop);
    const comparison = compareRgb(structural, composited, crop.width, crop.height);
    assert(comparison.normalizedRmse <= STATIC_THRESHOLD,
      `${pilot.id}: frame ${frame} panel calibration RMSE ${comparison.normalizedRmse} exceeds ${STATIC_THRESHOLD}`);
    return {
      frame,
      sourceStructuralFrame: projectPath(ffdec.frames[frame - 1].file),
      sourceStructuralFrameSha256: ffdec.frames[frame - 1].record.sha256,
      compositedFrame: projectPath(outputBytes[frame - 1].file),
      compositedFrameSha256: outputFrames[frame - 1].sha256,
      crop,
      ...comparison,
      assignedThreshold: STATIC_THRESHOLD,
      result: "pass",
    };
  });

  let generatedAt = options.generatedAt;
  const reportFile = path.join(migrationRoot, "baseline", "source-composited-spanish-default.json");
  if (options.check && !generatedAt) generatedAt = (await readJson(reportFile)).value.generatedAt;
  generatedAt ??= new Date().toISOString();
  assert(!Number.isNaN(Date.parse(generatedAt)), "--generated-at must be an ISO timestamp");
  const ffdecVersion = (await execFile(options.ffdec, ["-help"], {maxBuffer: 2 * 1024 * 1024}))
    .stdout.split(/\r?\n/).find((line) => line.includes("JPEXS Free Flash Decompiler"))?.trim() || "unknown";
  const pythonVersionResult = await execFile(options.python, ["--version"]);
  const report = {
    schemaVersion: FORMULA_SPANISH_BASELINE_SCHEMA_VERSION,
    generatedBy: {
      script: "scripts/build-formula-spanish-baselines.mjs",
      version: FORMULA_SPANISH_BASELINE_GENERATOR_VERSION,
      authoringAuditRequirement: "verified-current-recursive-authoring-audit",
    },
    animationId: pilot.id,
    status: "authoritative-source-composited-spanish-visual-baseline",
    generatedAt,
    authority: {
      kind: "original-swf-adobe-runtime-plus-swf-structural-spanish-panel",
      statement: "Every dynamic pixel begins with the hash-verified Adobe Flash Player natural-playback English frame. Only the source-extracted root Mc_SD panel is composited at its SWF PlaceObject2 transform for the source-evidenced Spanish ON branch.",
      evidencePriority: ["original FLA authoring structure", "original SWF display-list tags and ActionScript", "Adobe English natural-playback runtime", "controlled Adobe Spanish runtime cross-check", "FFDec panel-only structural calibration"],
      ffdecWholeFrameUsedAsRuntime: false,
    },
    runtime: {stage: STAGE, fps: FPS, frameCount: pilot.frameCount, scenario: "default", lang: "es", seed: "0"},
    source: {
      swf: {file: manifest.source.swf, sha256: manifest.source.swfSha256},
      fla: {file: manifest.source.fla, sha256: manifest.source.flaSha256},
      migrationManifest: {
        file: projectPath(path.join(migrationRoot, "migration.json")),
        identityCheckedAtGeneration: true,
        animationId: manifest.animationId,
        sourceSwfSha256: manifest.source.swfSha256,
        runtime: {
          stage: manifest.runtime.stage,
          fps: manifest.runtime.fps,
          frameCount: manifest.runtime.frameCount,
        },
      },
      machineAudit: {file: projectPath(machineFile), sha256: machineSource.sha256},
      swfmillXml: {file: projectPath(swfmillFile), sha256: swfmillSource.sha256, uncompressedSha256: swfmillRecord.uncompressedSha256},
      ffdecScripts: {file: projectPath(scriptFile), sha256: scriptSource.sha256, uncompressedSha256: scriptRecord.uncompressedSha256},
      animateAuthoringAudit: {
        file: projectPath(authoring.authoringFile),
        sha256: authoring.authoringSource.sha256,
        contract: authoring.contract,
        corroboration: authoring.semanticEvidence,
      },
      adobeEnglishRuntimeReport: {file: projectPath(adobe.reportFile), sha256: adobe.reportSource.sha256},
      ffdecRootStructuralReport: {file: projectPath(ffdec.reportFile), sha256: ffdec.reportSource.sha256},
      supersededFfdecWholeFrameComparison: invalidatedComparison,
      invalidatedImplementationCaptureAttempt: invalidatedCapture,
    },
    parsedStructure: {
      parser: projectPath(parserPath),
      xmlParser: "Python xml.etree.ElementTree",
      stage: structure.stage,
      frameRate: structure.header.frameRate,
      frameCount: structure.header.frameCount,
      showFrameCount: structure.header.showFrameCount,
      panel,
      exportedSvg: {...structure.exportedSvg, file: projectPath(assetFile), sha256: sha256(panelSvg)},
      actionScriptCondition: '_root.dtfSpanishFormulas.text.toUpperCase() == "ON"',
      actionScriptEffect: "Mc_SD._visible=true for ON; false otherwise",
      structuralCrop: crop,
      structuralCropAllFramesIdentical: true,
      structuralCropSha256: [...structuralCropHashes][0],
    },
    composition: {
      base: "hash-verified Adobe Flash Player 32 natural-playback standalone-default/en frame at the same one-indexed frame",
      overlay: "only source-extracted Mc_SD character 134 at root depth 4",
      placement: panel.placementPixels,
      dimensions: {width: structure.exportedSvg.width, height: structure.exportedSvg.height},
      changedRegion: crop,
      outsideChangedPixelCountAcrossAllFrames: outsideCropChangedPixels,
      compositedPanelCropAllFramesIdentical: true,
      outputAlpha: 255,
      renderer: "sharp/libvips/librsvg",
    },
    capture: {
      archiveDirectory: projectPath(outputDirectory),
      frameControl: "same-frame Adobe English natural-playback base plus fixed root panel",
      alphaComposite: {backgroundColor: "#e4e4e4", outputAlpha: 255},
    },
    frames: outputFrames,
    calibration: {
      contract: {frames: [1, pilot.frameCount], region: "source-derived Mc_SD crop only", normalizedRgbRmseThreshold: STATIC_THRESHOLD},
      frames: calibrationFrames,
      allPass: true,
      controlledAdobeCrossCheck: pilot.id === "formula-elementary-conversion-01-01"
        ? {
          file: "baseline/controlled-spanish-host-adobe-player-probe.json",
          scope: "Mc_SD visibility at root frames 1, 52, and 94 only; fixture gotoAndStop is not natural nested-timeline evidence",
        }
        : null,
    },
    archive: {
      root: projectPath(outputDirectory),
      frameCount: outputFrames.length,
      directorySha256: directoryDigest(outputFrames),
      ignoredByGit: true,
    },
    toolchain: {
      ffdec: ffdecVersion,
      python: `${pythonVersionResult.stdout}${pythonVersionResult.stderr}`.trim(),
      sharp: sharp.versions.sharp,
      libvips: sharp.versions.vips,
      librsvg: sharp.versions.rsvg,
      png: sharp.versions.png,
      pixelmatch: "7.2.0",
      pngjs: "7.0.0",
    },
    integrity: {checkCommand: `node scripts/build-formula-spanish-baselines.mjs --id ${pilot.id} --check`},
    limitations: [
      "The source-composited baseline is authoritative for the child SWF's Spanish visual branch, not for the unrecovered external default value of the original 800x600 indexELM shell.",
      "The controlled Adobe parent proves Mc_SD visibility at sampled root frames but cannot supply natural nested-timeline frames after direct gotoAndStop; its whole frames are excluded.",
      "Silent PNGs do not prove English/Spanish narration, activation, cue timing, pause/resume, or synchronization.",
      "This report is machine/engineering evidence and is not human visual review or owner acceptance.",
    ],
  };
  const reportBytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);

  if (options.check) {
    await assertArchived(assetFile, panelSvg, `${pilot.id} source Spanish panel SVG`);
    for (let index = 0; index < outputBytes.length; index += 1) {
      await assertArchived(outputBytes[index].file, outputBytes[index].bytes, `${pilot.id} Spanish baseline frame ${index + 1}`);
    }
    await assertArchived(reportFile, reportBytes, `${pilot.id} Spanish baseline report`);
  } else {
    await writeAtomically(assetFile, panelSvg);
    for (const item of outputBytes) await writeAtomically(item.file, item.bytes);
    await writeAtomically(reportFile, reportBytes);
  }
  return report;
}

export async function buildFormulaSpanishBaselines(options = {}) {
  const requested = options.ids?.length ? new Set(options.ids) : new Set(FORMULA_PILOTS.map(({id}) => id));
  const unknown = [...requested].filter((id) => !FORMULA_PILOTS.some((pilot) => pilot.id === id));
  assert(!unknown.length, `Unknown formula pilot(s): ${unknown.join(", ")}`);
  const reports = [];
  for (const pilot of FORMULA_PILOTS) if (requested.has(pilot.id)) reports.push(await buildPilot(pilot, options));
  return reports;
}

async function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(`${error.message}\n\n${usage()}`);
    process.exitCode = 1;
    return;
  }
  if (options.help) {
    console.log(usage());
    return;
  }
  const reports = await buildFormulaSpanishBaselines(options);
  console.log(JSON.stringify({
    mode: options.check ? "check" : "write",
    reports: reports.map((report) => ({
      animationId: report.animationId,
      frameCount: report.frames.length,
      directorySha256: report.archive.directorySha256,
      panelSha256: report.parsedStructure.exportedSvg.sha256,
      calibrationRmse: report.calibration.frames.map(({frame, normalizedRmse}) => ({frame, normalizedRmse})),
    })),
  }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
