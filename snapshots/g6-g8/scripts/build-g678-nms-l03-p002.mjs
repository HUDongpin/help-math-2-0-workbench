#!/usr/bin/env node
// One exact source page. This does not extend the frozen16 or a factory family.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ID = 'shared-nms002-l03-p002';
export const CALIBRATION = 'g678-nms-l03-p002-current-js-v1';
export const RUN = `work/g678-shared-page-factory/${CALIBRATION}`;
export const FREEZE = `catalog/product-bridge-calibrations/${CALIBRATION}.json`;
export const FRAGMENT = `catalog/product-bridge-calibrations/${CALIBRATION}.fragment.json`;
export const SPEC = Object.freeze({
  path: '/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l03-p002-source-spec-v1.json',
  bytes: 12386, sha256: '5847e10ee99b921f3d814cdcd0c9d1d760bf78ff5a4fab68cc228efcc755a249',
});
export const SOURCE = Object.freeze({
  path: 'G6-G8-shared/NMS002/L3/RW/L3RW02.swf', bytes: 532935,
  sha256: '530ebbd934176f27ae1016720c60ac16ce1cfbec5dc3044feac5bbd4ecde0212',
});
export const encode = value => JSON.stringify(value, null, 2) + '\n';
export const sha = value => createHash('sha256').update(value).digest('hex');
export const pin = (file, bytes) => ({path: file, bytes: Buffer.byteLength(bytes), sha256: sha(bytes)});
export async function readBound(file, expected) {
  const full = path.resolve(ROOT, file), before = await lstat(full, {bigint: true});
  assert(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n && await realpath(full) === full, `ordinary input required: ${file}`);
  const bytes = await readFile(full), after = await lstat(full, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mode', 'mtimeNs', 'nlink']) assert.equal(before[key], after[key], file);
  const binding = pin(file, bytes); if (expected) assert.deepEqual(binding, expected, `input drift: ${file}`);
  return {bytes, binding};
}

function metadata(html) {
  const source = html.replace(/\r\n?/gu, '\n');
  const start = source.indexOf('var scalingGrids = {};'), end = source.indexOf('\nvar frame = -1;', start);
  assert(start >= 0 && end > start, 'FFDec definition boundaries');
  const definitions = source.slice(start, end), canvas = source.match(/<canvas\s+id="myCanvas"\s+width="(\d+)"\s+height="(\d+)"/u);
  const header = definitions.match(/function sprite237\(ctx,ctrans,frame,ratio,time\)\{\s*ctx.save\(\);\s*ctx.transform\(1,0,0,1,([-0-9.]+),([-0-9.]+)\);\s*var clips = \[\];\s*var frame_cnt = (\d+);/u);
  assert(canvas && header && Number(header[3]) === 688, 'exact source sprite');
  const placed = [...new Set([...definitions.matchAll(/place\("([A-Za-z_$][A-Za-z0-9_$]*)"/gu)].map(m => m[1]))].sort();
  const fonts = [...definitions.matchAll(/function\s+(font\d+)\(ctx,ch,textColor\)\{/gu)].map(m => m[1]);
  const images = [...definitions.matchAll(/var\s+(imageObj\d+)\s*=\s*document.createElement\("img"\);\s*\1.src="data:image\/(?:PNG|JPEG);base64,[A-Za-z0-9+/=]+";/gu)].map(m => m[1]);
  return {exportCanvas: {width: Number(canvas[1]), height: Number(canvas[2])},
    internal: {x: Number(header[1]), y: Number(header[2])}, placed, fonts, images};
}
function replaceOnce(source, from, to) {
  assert.equal(source.split(from).length, 2, `exact generated marker: ${from}`);
  return source.replace(from, to);
}

export async function build({check = false} = {}) {
  const specFile = await readBound(SPEC.path, SPEC), sourceSpec = JSON.parse(specFile.bytes);
  assert.equal(sourceSpec.animationId, ID); assert.deepEqual(sourceSpec.source, SOURCE);
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  assert(sourceRoot && path.isAbsolute(sourceRoot) && await realpath(sourceRoot) === sourceRoot);
  const original = await readBound(path.join(sourceRoot, SOURCE.path));
  assert.deepEqual({...original.binding, path: SOURCE.path}, SOURCE);
  assert.equal((await lstat(path.join(sourceRoot, SOURCE.path))).mode & 0o222, 0);
  const inputs = [SPEC, original.binding];
  for (const binding of [sourceSpec.catalog, ...sourceSpec.inputs]) {
    await readBound(binding.path, binding); inputs.push(binding);
  }
  const catalog = JSON.parse((await readBound(sourceSpec.catalog.path)).bytes);
  const lesson = catalog.lessons.find(l => l.stableLessonKey === 'shared-nms002-l03');
  const page = lesson.pages[1];
  assert.equal(page.animationId, ID); assert.equal(page.sourceSha256, SOURCE.sha256);
  assert.equal(lesson.activePageCount, 56); assert.deepEqual(lesson.sourceXml, sourceSpec.lessonXml);
  const xml = await readBound(path.join(sourceRoot, lesson.sourceXml.path));
  assert.deepEqual({...xml.binding, path: lesson.sourceXml.path}, {path: lesson.sourceXml.path, bytes: lesson.sourceXml.bytes, sha256: lesson.sourceXml.sha256});
  inputs.push(xml.binding);
  const raw = sourceSpec.inputs.find(p => p.path.endsWith('/DefineSprite_237/frames.html'));
  const helper = sourceSpec.inputs.find(p => p.path.endsWith('/DefineSprite_237/canvas.js'));
  const audio = sourceSpec.inputs.find(p => p.path.endsWith('/source-stream.mp3'));
  const audioAudit = sourceSpec.inputs.find(p => p.path.endsWith('/source-audio-audit.json'));
  const frames = (await readBound(raw.path, raw)).bytes.toString(), helperSource = (await readBound(helper.path, helper)).bytes.toString();
  const decoded = (await readBound(audio.path, audio)).bytes;
  assert.equal(sha(decoded), sourceSpec.audio.decoder.sourceSha256);
  const meta = metadata(frames), placement = sourceSpec.rootPlacements.find(p => p.objectID === '237');
  assert.deepEqual(placement, {frame: 6, replace: '0', depth: '1', objectID: '237', morph: '5', name: 'Animation', transform: {transX: '7219', transY: '5460'}});
  const tx = 7219 / 20, ty = 5460 / 20;
  const runtimePath = `${RUN}/members/${ID}/canvas-renderer.js`;
  const spec = {schemaVersion: 1, animationId: `course-${ID}`, finalAnimationId: ID,
    classification: 'private-source-locked-nms-l03-p002', title: 'Add and Subtract Fractions: Real World Activity',
    source: {swf: `$HELP_MATH_G678_SOURCE_ROOT/${SOURCE.path}`, swfBytes: SOURCE.bytes, swfSha256: SOURCE.sha256},
    evidence: {scenarioInventory: SPEC.path, scenarioInventorySha256: SPEC.sha256, audioAudit: audioAudit.path, audioAuditSha256: audioAudit.sha256},
    ffdecExport: {tool: 'JPEXS Free Flash Decompiler 26.2.1 Canvas export', helper: helper.path, helperSha256: helper.sha256, helperBytes: helper.bytes,
      framesHtml: raw.path, framesHtmlSha256: raw.sha256, framesHtmlBytes: raw.bytes, targetSpriteObjectId: 237, targetSpriteFunction: 'sprite237',
      exportCanvas: meta.exportCanvas, exportInternalTranslation: meta.internal,
      expectedPlacedFunctionCount: meta.placed.length, expectedPlacedFunctionsSha256: sha(JSON.stringify(meta.placed)),
      expectedFontFunctionCount: meta.fonts.length, expectedFontFunctionsSha256: sha(JSON.stringify(meta.fonts)),
      embeddedImageVariableCount: meta.images.length, embeddedImageVariablesSha256: sha(JSON.stringify(meta.images))},
    timeline: {fps: 12, stage: sourceSpec.stage,
      root: {frameCount: 10, preloaderStopFrame: 1, beginFrame: 6, beginLabel: 'begin', placementName: 'Animation', placementDepth: '1',
        placementTwips: {x: 7219, y: 5460}, placementPixels: {x: tx, y: ty}},
      local: {timelineId: 'sprite-237', frameCount: 688, livePlaybackEndFrame: 688, playbackMode: 'once', publicFrameIndexing: 'one-indexed'},
      stageRenderOffset: {x: tx - meta.internal.x, y: ty - meta.internal.y}},
    runtimeContract: {kind: 'structural-local-frame', scenarios: ['source-static-frame'], defaultScenario: 'source-static-frame', supportedLanguages: ['en'],
      seedMapping: 'fixed-zero-no-source-randomness-executed', blockedLocalFrameRanges: [], currentCanonicalFrameDomainDispositionAsserted: false,
      unresolved: ['Original-runtime, source-audio listening, visual, human, Owner, strict completion and publication remain independent.']},
    output: {script: runtimePath, manifest: `${RUN}/members/${ID}/member-manifest.json`, spec: `${RUN}/adapter-spec.json`, globalRegistry: 'HELP_MATH_CANVAS_ASSETS'}, strictAcceptanceEffect: 'none'};
  let runtime = buildSafeRuntime({helperSource, framesHtml: frames, spec}).runtime;
  runtime = runtime.split(JSON.stringify(spec.animationId)).join(JSON.stringify(ID));
  runtime = replaceOnce(runtime,
    `registry[${JSON.stringify(ID)}] = Object.freeze({metadata: METADATA, ready: ready, resolveFrameState: resolveFrameState, render: render});`,
    `Object.defineProperty(registry, ${JSON.stringify(ID)}, {value: Object.freeze({metadata: METADATA, ready: ready, resolveFrameState: resolveFrameState, render: render}), configurable: false, enumerable: true, writable: false});`);
  new Script(runtime);
  assert(!/\b(?:eval|Function|fetch|XMLHttpRequest|WebSocket|setInterval|setTimeout|requestAnimationFrame|addEventListener)\s*\(/u.test(runtime), 'generated runtime is not a pure drawing asset');
  const runtimePin = pin(runtimePath, runtime);
  const config = {animationId: ID, title: spec.title, sourceSwfSha256: SOURCE.sha256,
    assetSource: `/flash-assets/g678-local/${ID}/canvas-renderer.js`, assetSha256: runtimePin.sha256,
    stage: sourceSpec.stage, nativeStage: sourceSpec.stage, backingStage: {width: 800, height: 600}, fps: 12,
    rootFrameCount: 10, rootBeginFrame: 6, mainFrameDomain: 'sprite-237', mainFrameCount: 688, livePlaybackEndFrame: 688,
    playbackMode: 'once', strictCaptureIdentity: true, blockedFrameRanges: [], showEngineeringDisclosure: false,
    visualMarkers: [{id: 'sprite-237-source-drawing', firstFrame: 1, lastFrame: 688}]};
  const timelinePath = `packages/demos/src/timelines/${ID}.ts`;
  const timeline = `// Generated by build-g678-nms-l03-p002.mjs; do not edit.\nimport type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';\nimport type {ContinuousSourceClockPlan} from '../continuous-source-stream-clock-candidate';\nexport const CONFIG = ${encode(config).trim()} as const satisfies SourceStaticCanvasCandidateConfig;\nexport const PLAN = ${encode(sourceSpec.audio).trim()} as const satisfies ContinuousSourceClockPlan;\n`;
  const modulePath = 'packages/demos/src/modules/g678-nms-l03-p002.tsx';
  const module = `// Generated by build-g678-nms-l03-p002.mjs; do not edit.\n'use client';\nimport {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';\nimport {prepareFrozenGlossaryCanvas} from '../frozen-glossary-canvas-preparation';\nimport {CONFIG, PLAN} from '../timelines/${ID}';\nconst candidate = createSourceStaticCanvasCandidate(CONFIG);\nconst sourceAudioBase64 = ${JSON.stringify(decoded.toString('base64'))};\nexport default Object.freeze({...candidate.module, maturity: 'private-current-js' as const, privateNmsL3: Object.freeze({CONFIG, PLAN, sourceAudioBase64, prepare: () => prepareFrozenGlossaryCanvas(CONFIG)})});\n`;
  const outputs = new Map([[runtimePath, runtime], [timelinePath, timeline], [modulePath, module], [`${RUN}/adapter-spec.json`, encode(spec)]]);
  for (const file of ['scripts/build-g678-nms-l03-p002.mjs', 'scripts/build-safe-ffdec-canvas-adapter.mjs',
    'packages/demos/src/source-static-canvas-candidate.tsx', 'packages/demos/src/frozen-glossary-canvas-preparation.ts',
    'packages/demos/src/continuous-source-stream-clock-candidate.ts', 'packages/demos/src/decoded-source-stream-transport.ts']) inputs.push((await readBound(file)).binding);
  const entry = {key: ID, module: './modules/g678-nms-l03-p002', maturity: 'private-current-js', complexityLane: 'interactive-understood',
    artifacts: {module: pin(modulePath, module), timeline: pin(timelinePath, timeline), runtime: runtimePin}};
  const boundary = {runtimeKind: 'source-script-bound-product-behavior-current-js-candidate', actionScriptExecution: 'not-executed',
    naturalTraceValidation: 'not-established', audioAcceptance: 'not-established',
    replaySemantics: 'product-complete-state-reset-original-runtime-parity-not-established', productBehavior: 'maintained-javascript-state-machine-implemented'};
  const selected = {animationId: ID, placementId: ID, assetId: page.assetId, stableLessonKey: page.stableLessonKey,
    sourceSha256: SOURCE.sha256, moduleCode: 'NMS002', lessonNumber: 3, globalPageOrdinal: 2, sectionCode: 'RW', sectionPageOrdinal: 1,
    complexityLane: entry.complexityLane, implementationLane: 'advanced-manual', laneReason: sourceSpec.laneReason,
    runtime: {stage: {width: 800, height: 600}, rootFrameCount: 10, rootBeginFrame: 6, frameDomain: 'sprite-237', frameCount: 688,
      livePlaybackEndFrame: 688, language: 'fixed-en', scenario: 'source-static-frame', seed: '0', canvasRenderer: {...runtimePin, url: config.assetSource}},
    runtimeEvidenceBoundary: boundary, originalRuntimeAccepted: false, audioAccepted: false};
  const manifest = {schemaVersion: 1, calibrationId: CALIBRATION, deploymentScope: 'local-only', selectedPages: [selected],
    source: SOURCE, sourceSpec: SPEC, sourceCatalog: sourceSpec.catalog, sourceXml: lesson.sourceXml, inputs,
    outputs: [...outputs].map(([p, b]) => pin(p, b)), entry, audioPlan: sourceSpec.audio,
    productCalibrationPassed: false, scaleOutAuthorized: false, acceptanceEffects: sourceSpec.acceptanceEffects};
  const freezeBytes = encode(manifest), freezePin = pin(FREEZE, freezeBytes);
  const calibration = {calibrationId: CALIBRATION, deploymentScope: 'local-only', freezeManifest: FREEZE,
    freezeManifestBytes: freezePin.bytes, freezeManifestSha256: freezePin.sha256, entries: [entry]};
  outputs.set(FREEZE, freezeBytes); outputs.set(FRAGMENT, encode({schemaVersion: 1, calibration}));
  outputs.set(`${RUN}/run-manifest.json`, encode({schemaVersion: 1, animationId: ID, source: SOURCE, inputs,
    outputs: [...outputs].map(([p, b]) => pin(p, b)), frozenCandidate: freezePin, registrationChanged: false, scaleOutAuthorized: false}));
  // Build everything first; retained outputs are compared, never rewritten.
  for (const [file, bytes] of outputs) {
    const full = path.join(ROOT, file), existing = await readFile(full).catch(e => {if (e.code === 'ENOENT') return null; throw e;});
    if (check || existing) assert(existing && existing.equals(Buffer.from(bytes)), `generated output drift: ${file}`);
  }
  if (!check) for (const [file, bytes] of outputs) {
    const full = path.join(ROOT, file); await mkdir(path.dirname(full), {recursive: true});
    try {await writeFile(full, bytes, {flag: 'wx'});} catch (e) {if (e.code !== 'EEXIST') throw e;}
  }
  return {freeze: freezePin, outputs: outputs.size, check, registrationChanged: false};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert(process.argv.length === 2 || process.argv.length === 3 && process.argv[2] === '--check');
  console.log(encode(await build({check: process.argv[2] === '--check'})));
}
