#!/usr/bin/env node
// Local-only drawing candidate for a root-held, nested source timeline.
// Generated output is private evidence, never an admission or typography pass.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, readFile, realpath, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';

import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';
import {parseSwfSourceFacts} from './build-g4-l3-machine-source-audits.mjs';
import {SOURCE, validateP003SourceStructure,
  validateP003ExportedScripts} from './audit-g678-nms-l09-p003-source.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IR_PATH = 'migrations/shared-nms002-l09-p003/audit/ROOT_HELD_NESTED_DRAWING_V1.json';
const AUDIO_INVENTORY = 'migrations/shared-nms002-l09-p003/audio-inventory.csv';
// The v1 output froze an earlier audio inventory; preserve it as evidence.
const OUTPUT = 'work/g678-shared-page-factory/g678-nms-l09-p003-root-held-candidate-v2';
const SHA = bytes => createHash('sha256').update(bytes).digest('hex');
const PIN = (file, bytes) => ({path: file, bytes: bytes.length,
  sha256: SHA(bytes)});

function replaceOnce(value, before, after) {
  assert.equal(value.split(before).length, 2,
    `exact generated marker changed: ${before.slice(0, 80)}`);
  return value.replace(before, after);
}

async function readPinned(file, expected) {
  const bytes = await readFile(file);
  assert.deepEqual({bytes: bytes.length, sha256: SHA(bytes)}, expected,
    `input drift: ${file}`);
  return bytes;
}

function specForRoot(ir, raw, helper, irBytes, audioBytes) {
  return {
    schemaVersion: 1,
    animationId: `course-${ir.animationId}`,
    classification: 'private-root-held-nested-source-drawing-candidate-v1',
    title: 'Properties of Operations: Real World Activity',
    source: {swf: `$HELP_MATH_G678_SOURCE_ROOT/${ir.source.path}`,
      swfBytes: ir.source.bytes, swfSha256: ir.source.sha256},
    evidence: {scenarioInventory: IR_PATH,
      scenarioInventorySha256: SHA(irBytes), audioAudit: AUDIO_INVENTORY,
      audioAuditSha256: SHA(audioBytes)},
    ffdecExport: {
      tool: `${ir.ffdec.tool} ${ir.ffdec.format} export`,
      helper: path.join(ir.ffdec.rawExportDirectory, 'canvas.js'),
      helperSha256: SHA(helper), helperBytes: helper.length,
      framesHtml: path.join(ir.ffdec.rawExportDirectory, 'frames.html'),
      framesHtmlSha256: SHA(raw), framesHtmlBytes: raw.length,
      targetSpriteObjectId: ir.root.mainSpriteId,
      targetSpriteFunction: ir.ffdec.rootFunction,
      exportCanvas: {width: ir.stage.width, height: ir.stage.height},
      exportInternalTranslation: {x: 0, y: 0},
      expectedPlacedFunctionCount: ir.ffdec.expectedPlacedFunctionCount,
      expectedPlacedFunctionsSha256: ir.ffdec.expectedPlacedFunctionsSha256,
      expectedFontFunctionCount: ir.ffdec.expectedFontFunctionCount,
      expectedFontFunctionsSha256: ir.ffdec.expectedFontFunctionsSha256,
      embeddedImageVariableCount: ir.ffdec.embeddedImageVariableCount,
      embeddedImageVariablesSha256: ir.ffdec.embeddedImageVariablesSha256,
    },
    timeline: {
      fps: ir.stage.fps, stage: ir.stage,
      root: {frameCount: ir.root.frameCount, preloaderStopFrame: 1,
        beginFrame: ir.root.beginFrame, beginLabel: ir.root.beginLabel,
        // The adapter validates a target sprite offset; a whole-root export
        // is already in stage coordinates. The source placement is restored
        // in the final metadata from the separately asserted IR.
        placementName: '__root_export__', placementDepth: '0',
        placementTwips: {x: 0, y: 0},
        placementPixels: {x: 0, y: 0}},
      // The safe adapter validates the exported 10-frame root. The generated
      // runtime is then transformed below into the source's 635-frame child
      // query domain while holding export root frame index 5.
      local: {timelineId: ir.main.frameDomain,
        frameCount: ir.root.frameCount, playbackMode: 'once',
        publicFrameIndexing: 'one-indexed'},
      stageRenderOffset: {x: 0, y: 0},
    },
    runtimeContract: {kind: 'structural-local-frame',
      scenarios: ['source-static-frame'],
      defaultScenario: 'source-static-frame', supportedLanguages: ['en'],
      seedMapping: 'fixed-zero-no-source-randomness-executed',
      blockedLocalFrameRanges: [],
      currentCanonicalFrameDomainDispositionAsserted: false,
      unresolved: ir.unresolved},
    output: {script: `${OUTPUT}/canvas-renderer.js`,
      manifest: `${OUTPUT}/candidate-manifest.json`,
      spec: `${OUTPUT}/adapter-spec.json`,
      globalRegistry: 'HELP_MATH_CANVAS_ASSETS'},
    strictAcceptanceEffect: 'none',
  };
}

export function mapRootRuntimeToHeldChild(runtime, metadata, ir) {
  assert.equal(ir.root.beginFrame, 6);
  assert.equal(ir.ffdec.rootFunction, 'main');
  assert.equal(ir.ffdec.rootExportFrame, 5);
  assert.equal(ir.ffdec.rootExportTimeForLocalFrame, 'localFrame - 1');
  assert.equal(ir.main.terminalStopFrame, ir.main.frameCount);
  const frameCount = ir.main.frameCount;
  runtime = replaceOnce(runtime,
    `frame > ${ir.root.frameCount}) {\n        throw new Error("frame must be a safe integer within 1..${ir.root.frameCount}");`,
    `frame > ${frameCount}) {\n        throw new Error("frame must be a safe integer within 1..${frameCount}");`);
  runtime = replaceOnce(runtime, 'exportFrame: frame - 1,',
    'exportFrame: 5,');
  runtime = replaceOnce(runtime,
    'main(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);',
    'main(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, state.localFrame - 1);');
  const updated = structuredClone(metadata);
  updated.sourceRootTimeline = {
    ...updated.sourceRootTimeline,
    placementName: 'Animation',
    placementTwips: {x: ir.root.mainPlacementTwips[0],
      y: ir.root.mainPlacementTwips[1]},
    placementPixels: {x: ir.root.mainPlacementTwips[0] / 20,
      y: ir.root.mainPlacementTwips[1] / 20},
  };
  updated.deterministicContentTimeline = {
    ...updated.deterministicContentTimeline,
    timelineId: ir.main.frameDomain,
    frameCount,
    durationMs: frameCount * 1000 / ir.stage.fps,
    sourceTerminalStopFrame: frameCount,
    stateCoverage: 'root-held-nested-source-drawing-only',
  };
  updated.rootHeldNestedDrawing = {
    rootExportFrame: ir.ffdec.rootExportFrame,
    rootExportTime: 'localFrame - 1',
    rootPlacedCharacterIds: ir.root.placedCharacterIds,
    nestedSpriteIds: ir.main.nestedSpriteIds,
    nativeTypographyImplemented: false,
    sourceAudioEnabled: false,
  };
  runtime = replaceOnce(runtime,
    `var METADATA = deepFreeze(${JSON.stringify(metadata, null, 2)});`,
    `var METADATA = deepFreeze(${JSON.stringify(updated, null, 2)});`);
  new Script(runtime, {filename: 'p003-root-held-canvas-renderer.js'});
  return runtime;
}

async function run(check) {
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  assert(sourceRoot && path.isAbsolute(sourceRoot) &&
    await realpath(sourceRoot) === sourceRoot,
  'real absolute HELP_MATH_G678_SOURCE_ROOT required');
  const irBytes = await readFile(path.join(ROOT, IR_PATH));
  const ir = JSON.parse(irBytes);
  assert.equal(ir.schemaVersion, 1);
  assert.equal(ir.animationId, 'shared-nms002-l09-p003');
  assert.deepEqual(ir.source, {...SOURCE,
    structureFingerprintSha256: ir.source.structureFingerprintSha256});
  const sourceBytes = await readPinned(path.join(sourceRoot, SOURCE.path),
    {bytes: SOURCE.bytes, sha256: SOURCE.sha256});
  const structure = validateP003SourceStructure(sourceBytes,
    parseSwfSourceFacts(sourceBytes));
  assert.equal(structure.sourceStructureFingerprintSha256,
    ir.source.structureFingerprintSha256);
  const ffdecRoot = ir.ffdec.rawExportDirectory;
  const rootStat = await stat(ffdecRoot);
  assert(rootStat.isDirectory());
  const raw = await readPinned(path.join(ffdecRoot, 'frames.html'),
    ir.ffdec.framesHtml);
  const helper = await readPinned(path.join(ffdecRoot, 'canvas.js'),
    ir.ffdec.helper);
  const scriptAudit = await validateP003ExportedScripts(
    '/Volumes/American Dream/hudongpin/g678-nms-l09-p003-audit-kQfgW7/scripts');
  const audioBytes = await readFile(path.join(ROOT, AUDIO_INVENTORY));
  const spec = specForRoot(ir, raw, helper, irBytes, audioBytes);
  const result = buildSafeRuntime({helperSource: helper.toString(),
    framesHtml: raw.toString(), spec});
  const runtime = mapRootRuntimeToHeldChild(result.runtime,
    result.metadata, ir);
  const runtimeBytes = Buffer.from(runtime);
  const specBytes = Buffer.from(`${JSON.stringify(spec, null, 2)}\n`);
  const inputs = [PIN(IR_PATH, irBytes), PIN(AUDIO_INVENTORY, audioBytes),
    PIN(SOURCE.path, sourceBytes),
    PIN(path.join(ffdecRoot, 'frames.html'), raw),
    PIN(path.join(ffdecRoot, 'canvas.js'), helper)];
  const manifest = {schemaVersion: 1,
    kind: 'g678-unregistered-root-held-canvas-candidate-v1',
    animationId: ir.animationId, claimBoundary: ir.claimBoundary,
    inputs, sourceStructure: structure, decompiledScripts: scriptAudit,
    outputs: [PIN(spec.output.script, runtimeBytes),
      PIN(spec.output.spec, specBytes)],
    currentJavaScriptRegistered: false, nativeTypographyImplemented: false,
    audioAccepted: false, originalRuntimeAccepted: false,
    scaleOutAuthorized: false};
  const outputs = new Map([
    [spec.output.script, runtimeBytes],
    [spec.output.spec, specBytes],
    [spec.output.manifest,
      Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`)],
  ]);
  for (const [relative, bytes] of outputs) {
    const full = path.join(ROOT, relative);
    if (check) {
      assert((await readFile(full)).equals(bytes),
        `generated output drift: ${relative}`);
      continue;
    }
    await mkdir(path.dirname(full), {recursive: true});
    try { await writeFile(full, bytes, {flag: 'wx'}); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      assert((await readFile(full)).equals(bytes),
        `generated output collision: ${relative}`);
    }
  }
  process.stdout.write(`${JSON.stringify({animationId: ir.animationId,
    runtime: manifest.outputs[0], check, registered: false})}\n`);
}

const invoked = process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invoked) run(process.argv.includes('--check')).catch(error => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
