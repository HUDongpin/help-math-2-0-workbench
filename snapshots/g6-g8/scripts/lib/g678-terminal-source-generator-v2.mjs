#!/usr/bin/env node
// Versioned bounded terminal-page generator. Every admitted page needs its own source spec and product QA; this is not bulk GO.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';
import {buildSafeRuntime} from '../build-safe-ffdec-canvas-adapter.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
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

function metadata(html, objectId, frameCount) {
  const source = html.replace(/\r\n?/gu, '\n');
  const start = source.indexOf('var scalingGrids = {};'), end = source.indexOf('\nvar frame = -1;', start);
  assert(start >= 0 && end > start, 'FFDec definition boundaries');
  const definitions = source.slice(start, end), canvas = source.match(/<canvas\s+id="myCanvas"\s+width="(\d+)"\s+height="(\d+)"/u);
  const header = definitions.match(new RegExp(`function sprite${objectId}\\(ctx,ctrans,frame,ratio,time\\)\\{\\s*ctx.save\\(\\);\\s*ctx.transform\\(1,0,0,1,([-0-9.]+),([-0-9.]+)\\);\\s*var clips = \\[\\];\\s*var frame_cnt = (\\d+);`, 'u'));
  assert(canvas && header && Number(header[3]) === frameCount, 'exact source sprite');
  const placed = [...new Set([...definitions.matchAll(/place\("([A-Za-z_$][A-Za-z0-9_$]*)"/gu)].map(m => m[1]))].sort();
  const fonts = [...definitions.matchAll(/function\s+(font\d+)\(ctx,ch,textColor\)\{/gu)].map(m => m[1]);
  const images = [...definitions.matchAll(/var\s+(imageObj\d+)\s*=\s*document.createElement\("img"\);\s*\1.src="data:image\/(?:PNG|JPEG);base64,[A-Za-z0-9+/=]+";/gu)].map(m => m[1]);
  return {exportCanvas: {width: Number(canvas[1]), height: Number(canvas[2])},
    internal: {x: Number(header[1]), y: Number(header[2])}, placed, fonts, images};
}
export function composeStageMatrix(root, internal) {
  return {a: root.a, b: root.b, c: root.c, d: root.d,
    e: root.tx - root.a * internal.x - root.c * internal.y,
    f: root.ty - root.b * internal.x - root.d * internal.y};
}
function replaceOnce(source, from, to) {
  assert.equal(source.split(from).length, 2, `exact generated marker: ${from}`);
  return source.replace(from, to);
}

export function normalizeClipMaskFills(runtime, masks, xml) {
  let next = runtime;
  for (const mask of masks) {
    const tags = [...xml.matchAll(/<PlaceObject[23]\s+[^>]*>/gu)].map(m => m[0]).filter(t => new RegExp(`objectID="${mask.characterId}"(?:\\s|>)`, 'u').test(t));
    assert.equal(tags.length, 1, 'mask character must have exactly one source placement');
    assert(tags[0].includes(`depth="${mask.depth}"`) && tags[0].includes(`clipDepth="${mask.clipDepth}"`), 'source clip-depth binding');
    const header = `function shape${mask.characterId}(ctx,ctrans,frame,ratio,time){`;
    const begin = next.indexOf(header), end = next.indexOf('\n}', begin) + 2;
    assert(begin >= 0 && end > begin && next.indexOf(header, begin + 1) < 0, 'unique solid vector mask definition');
    const shape = next.slice(begin, end);
    assert.equal((shape.match(/ctx\.fillStyle=/gu) ?? []).length, 1);
    assert(!/stroke|createPattern|drawImage|Gradient/u.test(shape), 'complex mask needs separate review');
    const corrected = replaceOnce(shape, mask.rawFill, 'ctx.fillStyle="rgba(0,0,0,1)";');
    next = next.slice(0, begin) + corrected + next.slice(end);
  }
  return next;
}
export async function buildTerminalSourcePage({ID, CALIBRATION, SPEC, SOURCE, builderPath, modulePath, timelinePath, title}, {check = false} = {}) {
  const RUN = `work/g678-shared-page-factory/${CALIBRATION}`;
  const FREEZE = `catalog/product-bridge-calibrations/${CALIBRATION}.json`, FRAGMENT = FREEZE.replace(/\.json$/u, '.fragment.json');
  const specFile = await readBound(SPEC.path, SPEC), sourceSpec = JSON.parse(specFile.bytes);
  assert.equal(sourceSpec.schemaVersion, 1); assert.equal(sourceSpec.animationId, ID); assert.deepEqual(sourceSpec.source, SOURCE);
  assert.equal(sourceSpec.calibrationId, CALIBRATION);
  const {main} = sourceSpec, frameCount = main.frameCount, objectId = main.objectId, domain = main.frameDomain;
  assert.equal(main.terminalStopFrame, frameCount); assert.deepEqual(main.nestedSprites, []);
  assert.equal(domain, `sprite-${objectId}`); assert.equal(sourceSpec.fps, 12);
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
  const lesson = catalog.lessons.find(l => l.stableLessonKey === sourceSpec.lesson.stableLessonKey);
  const page = lesson.pages[sourceSpec.placement.globalOrdinal - 1];
  assert.equal(page.animationId, ID); assert.equal(page.sourceSha256, SOURCE.sha256);
  assert.equal(lesson.activePageCount, sourceSpec.lesson.activePageCount); assert.deepEqual(lesson.sourceXml, sourceSpec.lessonXml);
  const xml = await readBound(path.join(sourceRoot, lesson.sourceXml.path));
  assert.deepEqual({...xml.binding, path: lesson.sourceXml.path}, {path: lesson.sourceXml.path, bytes: lesson.sourceXml.bytes, sha256: lesson.sourceXml.sha256});
  inputs.push(xml.binding);
  const raw = sourceSpec.inputs.find(p => p.path.endsWith(`/DefineSprite_${objectId}/frames.html`));
  const helper = sourceSpec.inputs.find(p => p.path.endsWith(`/DefineSprite_${objectId}/canvas.js`));
  const audio = sourceSpec.inputs.find(p => p.path.endsWith('/source-stream.mp3'));
  const audioAudit = sourceSpec.inputs.find(p => p.path.endsWith('/source-audio-audit.json'));
  const frames = (await readBound(raw.path, raw)).bytes.toString(), helperSource = (await readBound(helper.path, helper)).bytes.toString();
  const decoded = (await readBound(audio.path, audio)).bytes;
  assert.equal(sha(decoded), sourceSpec.audio.decoder.sourceSha256);
  const facts = JSON.parse((await readBound(sourceSpec.inputs.find(p => p.path.endsWith('/source-facts.json')).path)).bytes);
  const mainFacts = facts.frameDomains.domains.find(d => d.domainId === domain);
  assert.equal(facts.header.rootFrameCount, 10); assert.equal(mainFacts.declaredFrameCount, frameCount);
  assert.deepEqual(mainFacts.placedSpriteIds, []); assert.equal(mainFacts.scriptTagCount, 1);
  const audit = JSON.parse((await readBound(audioAudit.path, audioAudit)).bytes);
  assert.equal(audit.sourceSwfSha256, SOURCE.sha256);
  assert.deepEqual(audit.actions.filter(a => a.domain === domain).map(a => ({frame:a.frame,hex:a.hex})), [{frame: frameCount, hex:'0700'}]);
  assert.equal(audit.actions.length, 3);
  assert.deepEqual(audit.blocks.map(b => b.frame), Array.from({length: frameCount}, (_, i) => i + 1));
  assert(audit.blocks.every(b => b.seek >= 0));
  assert.equal(sourceSpec.audio.sourceSegmentCount, 1); assert.equal(sourceSpec.audio.sourceHasNegativeSeek, false);
  const meta = metadata(frames, objectId, frameCount), placement = sourceSpec.rootPlacements.find(p => p.objectID === String(objectId));
  assert.equal(placement.frame, 6);
  const matrix = placement.transform, tx = Number(matrix.transX) / 20, ty = Number(matrix.transY) / 20;
  const rootMatrix = {a: Number(matrix.scaleX ?? 1), b: Number(matrix.skewY ?? 0), c: Number(matrix.skewX ?? 0), d: Number(matrix.scaleY ?? 1), tx, ty};
  const stageMatrix = composeStageMatrix(rootMatrix, meta.internal);
  const reading = sourceSpec.sourceReading.map(beat => ({firstFrame: beat.firstFrame, lastFrame: frameCount, text: beat.sourceText}));
  for (const beat of sourceSpec.sourceReading) {
    assert(beat.firstFrame >= 1 && beat.firstFrame <= frameCount);
    assert.equal((await readBound(beat.sourceTextBinding.path, beat.sourceTextBinding)).bytes.toString().trim(), beat.sourceText);
    assert(mainFacts.placementEdges.some(p => p.characterId === beat.characterId && p.firstFrame === beat.firstFrame), 'reading beat must be source-placed');
  }
  const runtimePath = `${RUN}/members/${ID}/canvas-renderer.js`;
  const spec = {schemaVersion: 1, animationId: `course-${ID}`, finalAnimationId: ID,
    classification: 'private-source-locked-terminal-source-v2', title,
    source: {swf: `$HELP_MATH_G678_SOURCE_ROOT/${SOURCE.path}`, swfBytes: SOURCE.bytes, swfSha256: SOURCE.sha256},
    evidence: {scenarioInventory: SPEC.path, scenarioInventorySha256: SPEC.sha256, audioAudit: audioAudit.path, audioAuditSha256: audioAudit.sha256},
    ffdecExport: {tool: 'JPEXS Free Flash Decompiler 26.2.1 Canvas export', helper: helper.path, helperSha256: helper.sha256, helperBytes: helper.bytes,
      framesHtml: raw.path, framesHtmlSha256: raw.sha256, framesHtmlBytes: raw.bytes, targetSpriteObjectId: objectId, targetSpriteFunction: `sprite${objectId}`,
      exportCanvas: meta.exportCanvas, exportInternalTranslation: meta.internal,
      expectedPlacedFunctionCount: meta.placed.length, expectedPlacedFunctionsSha256: sha(JSON.stringify(meta.placed)),
      expectedFontFunctionCount: meta.fonts.length, expectedFontFunctionsSha256: sha(JSON.stringify(meta.fonts)),
      embeddedImageVariableCount: meta.images.length, embeddedImageVariablesSha256: sha(JSON.stringify(meta.images))},
    timeline: {fps: 12, stage: sourceSpec.stage,
      root: {frameCount: 10, preloaderStopFrame: 1, beginFrame: 6, beginLabel: 'begin', placementName: placement.name, placementDepth: placement.depth,
        placementTwips: {x: Number(matrix.transX), y: Number(matrix.transY)}, placementMatrix: rootMatrix, placementPixels: {x: tx, y: ty}},
      local: {timelineId: domain, frameCount, livePlaybackEndFrame: frameCount, playbackMode: 'once', publicFrameIndexing: 'one-indexed'},
      stageRenderOffset: {x: tx - meta.internal.x, y: ty - meta.internal.y}},
    runtimeContract: {kind: 'structural-local-frame', scenarios: ['source-static-frame'], defaultScenario: 'source-static-frame', supportedLanguages: ['en'],
      seedMapping: 'fixed-zero-no-source-randomness-executed', blockedLocalFrameRanges: [], currentCanonicalFrameDomainDispositionAsserted: false,
      unresolved: ['Original-runtime, source-audio listening, visual, human, Owner, strict completion and publication remain independent.']},
    output: {script: runtimePath, manifest: `${RUN}/members/${ID}/member-manifest.json`, spec: `${RUN}/adapter-spec.json`, globalRegistry: 'HELP_MATH_CANVAS_ASSETS'}, strictAcceptanceEffect: 'none'};
  let runtime = buildSafeRuntime({helperSource, framesHtml: frames, spec}).runtime;
  runtime = replaceOnce(runtime, `ctx.transform(1, 0, 0, 1, ${spec.timeline.stageRenderOffset.x}, ${spec.timeline.stageRenderOffset.y});`,
    `ctx.transform(${[stageMatrix.a, stageMatrix.b, stageMatrix.c, stageMatrix.d, stageMatrix.e, stageMatrix.f].join(', ')});`);
  const xmlSource = (await readBound(sourceSpec.inputs.find(p => p.path.endsWith('/source.xml')).path)).bytes.toString();
  runtime = normalizeClipMaskFills(runtime, sourceSpec.clipMasks ?? [], xmlSource);
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
    rootFrameCount: 10, rootBeginFrame: 6, mainFrameDomain: domain, mainFrameCount: frameCount, livePlaybackEndFrame: frameCount,
    playbackMode: 'once', strictCaptureIdentity: true, blockedFrameRanges: [], showEngineeringDisclosure: false,
    visualMarkers: [{id: `${domain}-source-drawing`, firstFrame: 1, lastFrame: frameCount}]};
  const timeline = `// Generated by g678-terminal-source-generator-v2.mjs; do not edit.\nimport type {SourceStaticCanvasCandidateConfig} from '../source-static-canvas-candidate';\nimport type {ContinuousSourceClockPlan} from '../continuous-source-stream-clock-candidate';\nexport const CONFIG = ${encode(config).trim()} as const satisfies SourceStaticCanvasCandidateConfig;\nexport const PLAN = ${encode(sourceSpec.audio).trim()} as const satisfies ContinuousSourceClockPlan;\n`;
  const module = `// Generated by g678-terminal-source-generator-v2.mjs; do not edit.\n'use client';\nimport {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';\nimport {prepareFrozenGlossaryCanvas} from '../frozen-glossary-canvas-preparation';\nimport {CONFIG, PLAN} from '../timelines/${path.basename(timelinePath, '.ts')}';\nconst candidate = createSourceStaticCanvasCandidate(CONFIG);\nconst sourceAudioBase64 = ${JSON.stringify(decoded.toString('base64'))};\nexport default Object.freeze({...candidate.module, maturity: 'private-current-js' as const, privateTerminalSource: Object.freeze({version: 1 as const, reading: ${encode(reading).trim()} as const, CONFIG, PLAN, sourceAudioBase64, prepare: () => prepareFrozenGlossaryCanvas(CONFIG)})});\n`;
  const outputs = new Map([[runtimePath, runtime], [timelinePath, timeline], [modulePath, module], [`${RUN}/adapter-spec.json`, encode(spec)]]);
  for (const file of [builderPath, 'scripts/lib/g678-terminal-source-generator-v2.mjs', 'scripts/build-safe-ffdec-canvas-adapter.mjs',
    'packages/demos/src/source-static-canvas-candidate.tsx', 'packages/demos/src/frozen-glossary-canvas-preparation.ts',
    'packages/demos/src/continuous-source-stream-clock-candidate.ts', 'packages/demos/src/decoded-source-stream-transport.ts']) inputs.push((await readBound(file)).binding);
  const entry = {key: ID, module: `./modules/${path.basename(modulePath, '.tsx')}`, maturity: 'private-current-js', complexityLane: 'interactive-understood',
    artifacts: {module: pin(modulePath, module), timeline: pin(timelinePath, timeline), runtime: runtimePin}};
  const boundary = {runtimeKind: 'source-script-bound-product-behavior-current-js-candidate', actionScriptExecution: 'not-executed',
    naturalTraceValidation: 'not-established', audioAcceptance: 'not-established',
    replaySemantics: 'product-complete-state-reset-original-runtime-parity-not-established', productBehavior: 'maintained-javascript-state-machine-implemented'};
  const selected = {animationId: ID, placementId: ID, assetId: page.assetId, stableLessonKey: page.stableLessonKey,
    sourceSha256: SOURCE.sha256, moduleCode: sourceSpec.lesson.moduleCode, lessonNumber: sourceSpec.lesson.lessonNumber, globalPageOrdinal: sourceSpec.placement.globalOrdinal, sectionCode: sourceSpec.placement.sectionCode, sectionPageOrdinal: sourceSpec.placement.sectionPageOrdinal,
    complexityLane: entry.complexityLane, implementationLane: 'advanced-manual', laneReason: sourceSpec.laneReason,
    runtime: {stage: {width: 800, height: 600}, rootFrameCount: 10, rootBeginFrame: 6, frameDomain: domain, frameCount,
      livePlaybackEndFrame: frameCount, language: 'fixed-en', scenario: 'source-static-frame', seed: '0', canvasRenderer: {...runtimePin, url: config.assetSource}},
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
