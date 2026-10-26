#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {
  chmod, lstat, mkdir, readFile, readdir, realpath, rename, rm, stat,
  unlink, writeFile,
} from 'node:fs/promises';
import {Script} from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';
import {auditG678AlgL11SimpleGlossaryTranche1} from
  './audit-g678-alg-l11-simple-glossary-tranche1.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const RUN_ID = 'g678-alg-l11-simple-glossary-tranche1-current-js-8-v1';
const OUTPUT_ROOT = `work/g678-shared-page-factory/${RUN_ID}`;
const FRAGMENT =
  `catalog/product-bridge-calibrations/${RUN_ID}.fragment.json`;
const AUDIT = 'catalog/g678-alg-l11-simple-glossary-tranche1-audit-v1.json';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const TOOLCHAIN_RUN =
  'work/g678-shared-page-factory/g678-advanced-manual-current-js-3-v1/run-manifest.json';
const SAFE_ADAPTER = 'scripts/build-safe-ffdec-canvas-adapter.mjs';
const SOURCE_STATIC_HOST = 'packages/demos/src/source-static-canvas-candidate.tsx';
const GLOSSARY_HOST =
  'packages/demos/src/private-source-static-alg-l11-simple-glossary-candidate.tsx';
const SOURCE_ENV = 'HELP_MATH_G678_SOURCE_ROOT';
const ASSET_REGISTRY = 'HELP_MATH_CANVAS_ASSETS';
const CALIBRATION_ID = 'g678-alg-l11-simple-glossary-tranche1-candidate-v1';
const CRITICAL_ENVIRONMENT = Object.freeze([
  'FFDEC_JARFILENAME', 'FFDEC_MEMORY', 'FFDEC_STACK_SIZE',
  'JAVA_TOOL_OPTIONS', 'JDK_JAVA_OPTIONS', '_JAVA_OPTIONS', 'CLASSPATH',
]);
const RUNTIME_BLOCKLIST = Object.freeze([
  ['dynamic evaluation', /\b(?:eval|Function)\s*\(/u],
  ['network primitive', /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/u],
  ['timer or animation loop', /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/u],
  ['persistent storage', /\b(?:localStorage|sessionStorage|indexedDB)\b/u],
  ['ambient event listener', /\b(?:addEventListener|removeEventListener)\s*\(/u],
]);
const FALSE_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false,
  productCalibrationPassed: false,
  engineeringPreviewReady: false,
  authoritativeOriginalRuntime: false,
  behaviorAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  releaseEligible: false,
  released: false,
  published: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function portable(value) {
  return value.split(path.sep).join('/');
}

function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function stableFile(target, {json = false, absolute = false} = {}) {
  const resolvedTarget = absolute ? path.resolve(target) : projectPath(target);
  const [before, canonical] = await Promise.all([
    lstat(resolvedTarget, {bigint: true}), realpath(resolvedTarget),
  ]);
  invariant(canonical === resolvedTarget && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${target} must be one canonical ordinary file`);
  const buffer = await readFile(resolvedTarget);
  const after = await lstat(resolvedTarget, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${target} changed during read`);
  return Object.freeze({path: absolute ? resolvedTarget : target,
    bytes: buffer.length, sha256: sha256(buffer), buffer,
    identity: Object.freeze({device: String(after.dev), inode: String(after.ino),
      size: String(after.size), mtimeNs: String(after.mtimeNs),
      mode: Number(after.mode & 0o777n), nlink: Number(after.nlink)}),
    ...(json ? {value: JSON.parse(buffer)} : {})});
}

function descriptor(binding) {
  return Object.freeze({path: binding.path, bytes: binding.bytes,
    sha256: binding.sha256});
}

async function sourceRoot() {
  const requested = process.env[SOURCE_ENV];
  invariant(typeof requested === 'string' && requested.length > 0,
    `${SOURCE_ENV} is required`);
  const root = path.resolve(requested);
  const [canonical, metadata] = await Promise.all([
    realpath(root), lstat(root, {bigint: true}),
  ]);
  invariant(canonical === root && metadata.isDirectory() &&
    !metadata.isSymbolicLink() && (metadata.mode & 0o222n) === 0n,
  `${SOURCE_ENV} must be one canonical read-only directory`);
  const shared = path.join(root, 'G6-G8-shared');
  const [sharedCanonical, sharedMetadata] = await Promise.all([
    realpath(shared), lstat(shared, {bigint: true}),
  ]);
  invariant(sharedCanonical === shared && sharedMetadata.isDirectory() &&
    !sharedMetadata.isSymbolicLink() &&
    (sharedMetadata.mode & 0o222n) === 0n,
  'G6-G8-shared source root custody drifted');
  return Object.freeze({root, shared, identity: Object.freeze({
    realPathSha256: sha256(root), device: String(metadata.dev),
    inode: String(metadata.ino), mode: Number(metadata.mode & 0o777n),
    sharedRealPathSha256: sha256(shared),
    sharedDevice: String(sharedMetadata.dev),
    sharedInode: String(sharedMetadata.ino),
    sharedMode: Number(sharedMetadata.mode & 0o777n)})});
}

async function readSource(source, record) {
  const viewPath = record.source.path;
  const relative = viewPath.replace(/^G6-G8-shared\//u, '');
  invariant(relative !== viewPath && relative.split('/').every((part) =>
    part && part !== '.' && part !== '..'), `${viewPath} is noncanonical`);
  const target = path.join(source.shared, ...relative.split('/'));
  const before = await lstat(target, {bigint: true});
  invariant(await realpath(target) === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (before.mode & 0o222n) === 0n,
  `${viewPath} is not an ordinary read-only source`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink &&
    buffer.length === record.source.bytes &&
    sha256(buffer) === record.source.sha256,
  `${viewPath} source bytes or identity drifted`);
  return Object.freeze({viewPath, buffer, identity: Object.freeze({
    device: String(after.dev), inode: String(after.ino),
    size: String(after.size), mtimeNs: String(after.mtimeNs),
    mode: Number(after.mode & 0o777n), nlink: Number(after.nlink)})});
}

async function verifyToolchain(identity) {
  for (const key of CRITICAL_ENVIRONMENT) {
    invariant(process.env[key] === undefined,
      `${key} must be absent for ALG L11 candidate generation`);
  }
  const verify = async (expected, label) => {
    const current = await stableFile(expected.realPath, {absolute: true});
    invariant(current.bytes === expected.bytes &&
      current.sha256 === expected.sha256,
    `${label} drifted`);
  };
  await verify(identity.java, 'bound Java executable');
  await verify(identity.jar, 'bound FFDec JAR');
  invariant(identity.jarManifest.classPath.length === 37,
    'FFDec classpath denominator drifted');
  for (const item of identity.jarManifest.classPath) {
    await verify(item, `FFDec classpath ${item.entry}`);
  }
  const prefixArgs = [...identity.invocation.prefixArgs];
  const jarIndex = prefixArgs.indexOf('-jar');
  invariant(jarIndex >= 0, 'FFDec invocation lacks -jar');
  prefixArgs.splice(jarIndex, 0, '-Djava.awt.headless=true');
  return Object.freeze({command: identity.java.realPath,
    prefixArgs: Object.freeze(prefixArgs.map((argument) =>
      argument === '<BOUND_FFDEC_JAR>' ? identity.jar.realPath : argument)),
    identity: Object.freeze({...identity,
      effectiveInvocation: Object.freeze({command: '<BOUND_JAVA_EXECUTABLE>',
        prefixArgs: Object.freeze(prefixArgs)})})});
}

async function verifySwfmill() {
  const requested = '/opt/homebrew/bin/swfmill';
  const canonical = await realpath(requested);
  const binding = await stableFile(canonical, {absolute: true});
  invariant(binding.sha256 ===
    'b1299adad7f32d8e489574539e79b0f42c4960148170bc1ca48736e07ccbd311',
  'swfmill executable drifted');
  return Object.freeze({command: canonical,
    identity: Object.freeze({requestedPath: requested, realPath: canonical,
      bytes: binding.bytes, sha256: binding.sha256,
      mode: binding.identity.mode, nlink: binding.identity.nlink,
      version: 'swfmill 0.3.6'})});
}

async function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {cwd: ROOT, env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']});
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({code, signal,
      stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr)}));
  });
}

function commandReceipt(result, command, args, label) {
  invariant(result.code === 0 && result.signal === null,
    `${label} failed: ${result.stderr.toString('utf8')}`);
  invariant(result.stderr.length === 0,
    `${label} emitted stderr: ${result.stderr.toString('utf8')}`);
  return Object.freeze({command: path.basename(command),
    args: Object.freeze(args.map((argument) => path.isAbsolute(argument)
      ? `<${path.basename(argument)}>` : argument)), exitCode: 0,
    stdout: Object.freeze({captured: true, recorded: false,
      reason: 'tool progress contains volatile paths and timings'}),
    stderr: Object.freeze({bytes: 0, sha256: sha256(result.stderr)})});
}

function attributes(source) {
  return Object.fromEntries([...source.matchAll(
    /([A-Za-z][A-Za-z0-9]*)="([^"]*)"/gu,
  )].map((match) => [match[1], match[2]]));
}

function parseRootTarget(xml, animationId) {
  const matches = [...xml.matchAll(
    /^      <PlaceObject2\b([^>]*\bname="(?:animation|Animation)"[^>]*)>([\s\S]*?)^      <\/PlaceObject2>/gmu,
  )];
  invariant(matches.length === 1,
    `${animationId}: expected one direct animation placement`);
  const placed = attributes(matches[0][1]);
  const transformMatch = matches[0][2].match(/<Transform([^>]*)\/>/u);
  invariant(transformMatch, `${animationId}: root transform missing`);
  const transform = attributes(transformMatch[1]);
  const number = (key, fallback) => transform[key] === undefined
    ? fallback : Number(transform[key]);
  const directFrames = [...xml.slice(0, matches[0].index)
    .matchAll(/^      <ShowFrame\/>$/gmu)].length;
  const objectId = Number(placed.objectID);
  invariant(Number.isSafeInteger(objectId) && objectId > 0 &&
    directFrames + 1 === 6, `${animationId}: root target drifted`);
  const matrix = Object.freeze({a: number('scaleX', 1),
    b: number('skewY', 0), c: number('skewX', 0),
    d: number('scaleY', 1), tx: number('transX', 0) / 20,
    ty: number('transY', 0) / 20});
  invariant(Object.values(matrix).every(Number.isFinite),
    `${animationId}: invalid root matrix`);
  return Object.freeze({objectId, beginFrame: 6, matrix,
    instanceName: placed.name, depth: placed.depth});
}

function spriteFrameCount(xml, animationId, objectId) {
  const matches = [...xml.matchAll(new RegExp(
    `<DefineSprite\\s+objectID="${objectId}"\\s+frames="(\\d+)">`, 'gu'))];
  invariant(matches.length === 1 && Number(matches[0][1]) > 1,
    `${animationId}: target frame count invalid`);
  return Number(matches[0][1]);
}

function deriveMetadata(framesHtml, animationId, objectId, frameCount) {
  const normalized = framesHtml.replace(/\r\n?/gu, '\n');
  const canvas = normalized.match(
    /<canvas\s+id="myCanvas"\s+width="(\d+)"\s+height="(\d+)"/u);
  invariant(canvas, `${animationId}: FFDec Canvas missing`);
  const marker = '<script>var canvas=document.getElementById("myCanvas");';
  const start = normalized.indexOf(marker);
  const end = normalized.indexOf('</script>', start);
  invariant(start >= 0 && end > start &&
    normalized.indexOf(marker, start + 1) < 0,
  `${animationId}: FFDec bootstrap drifted`);
  const inline = normalized.slice(start + '<script>'.length, end);
  const definitionsStart = inline.indexOf('var scalingGrids = {};');
  const viewerStart = inline.indexOf('\nvar frame = -1;');
  invariant(definitionsStart >= 0 && viewerStart > definitionsStart,
    `${animationId}: FFDec definitions drifted`);
  const definitions = inline.slice(definitionsStart, viewerStart).trimEnd();
  const functionName = `sprite${objectId}`;
  const header = definitions.match(new RegExp(
    `function\\s+${functionName}\\(ctx,ctrans,frame,ratio,time\\)\\{\\s*` +
    'ctx\\.save\\(\\);\\s*ctx\\.transform\\(1,0,0,1,' +
    '([-0-9.]+),([-0-9.]+)\\);\\s*var clips = \\[\\];\\s*' +
    'var frame_cnt = (\\d+);'));
  invariant(header && Number(header[3]) === frameCount,
    `${animationId}: target sprite header drifted`);
  const targetEnd = definitions.indexOf('\nfunction ',
    header.index + header[0].length);
  const targetSource = definitions.slice(header.index,
    targetEnd < 0 ? definitions.length : targetEnd);
  const cases = [...targetSource.matchAll(
    /case\s+(\d+):([\s\S]*?)(?=\n\s*case\s+\d+:|\n\s*\})/gu)];
  invariant(cases.length === frameCount && cases.every((match, index) =>
    Number(match[1]) === index), `${animationId}: target frames incomplete`);
  const placedFrames = cases.filter((match) => match[2].includes('place("'))
    .map((match) => Number(match[1]) + 1);
  invariant(placedFrames.length > 0, `${animationId}: target draws no frames`);
  const placedFunctions = [...new Set([...definitions.matchAll(
    /place\("([A-Za-z_$][A-Za-z0-9_$]*)"/gu,
  )].map((match) => match[1]))].sort();
  const fontFunctions = [...definitions.matchAll(
    /function\s+(font\d+)\(ctx,ch,textColor\)\{/gu,
  )].map((match) => match[1]);
  const imageVariables = [...definitions.matchAll(
    /var\s+(imageObj\d+)\s*=\s*document\.createElement\("img"\);\s*\1\.src="data:image\/(?:PNG|JPEG);base64,[A-Za-z0-9+/=]+";/gu,
  )].map((match) => match[1]);
  return Object.freeze({functionName, frameCount,
    exportCanvas: Object.freeze({width: Number(canvas[1]),
      height: Number(canvas[2])}),
    internalTranslation: Object.freeze({x: Number(header[1]),
      y: Number(header[2])}), lastPlacedFrame: Math.max(...placedFrames),
    placedFunctions: Object.freeze({count: placedFunctions.length,
      sha256: sha256(JSON.stringify(placedFunctions))}),
    fontFunctions: Object.freeze({count: fontFunctions.length,
      sha256: sha256(JSON.stringify(fontFunctions))}),
    imageVariables: Object.freeze({count: imageVariables.length,
      sha256: sha256(JSON.stringify(imageVariables))})});
}

function composeStageMatrix(root, internal) {
  return Object.freeze({a: root.a, b: root.b, c: root.c, d: root.d,
    e: root.tx - root.a * internal.x - root.c * internal.y,
    f: root.ty - root.b * internal.x - root.d * internal.y});
}

function replaceExactlyOnce(source, marker, replacement, label) {
  const first = source.indexOf(marker);
  invariant(first >= 0 && source.indexOf(marker, first + marker.length) < 0,
    `${label} marker count drifted`);
  return `${source.slice(0, first)}${replacement}${source.slice(first + marker.length)}`;
}

function finalizeRuntime(runtime, spec, animationId, stageMatrix) {
  const literal = (value) => Object.is(value, -0) ? '0' : String(value);
  let next = replaceExactlyOnce(runtime,
    `ctx.transform(1, 0, 0, 1, ${spec.timeline.stageRenderOffset.x}, ${spec.timeline.stageRenderOffset.y});`,
    `ctx.transform(${[stageMatrix.a, stageMatrix.b, stageMatrix.c,
      stageMatrix.d, stageMatrix.e, stageMatrix.f].map(literal).join(', ')});`,
    `${animationId} root transform`);
  const alias = JSON.stringify(spec.animationId);
  const actual = JSON.stringify(animationId);
  invariant(next.split(alias).length - 1 >= 2,
    `${animationId}: runtime alias missing`);
  next = next.split(alias).join(actual);
  next = replaceExactlyOnce(next,
    `registry[${actual}] = Object.freeze({metadata: METADATA, ready: ready, resolveFrameState: resolveFrameState, render: render});`,
    `Object.defineProperty(registry, ${actual}, {value: Object.freeze({metadata: METADATA, ready: ready, resolveFrameState: resolveFrameState, render: render}), configurable: false, enumerable: true, writable: false});`,
    `${animationId} immutable registry`);
  next = replaceExactlyOnce(next,
    '/* Generated by scripts/build-safe-ffdec-canvas-adapter.mjs. */',
    '/* Generated by scripts/build-g678-alg-l11-simple-glossary-tranche1-current-js.mjs through the hash-bound safe FFDec Canvas adapter. */',
    `${animationId} generator header`);
  invariant(!next.includes(alias), `${animationId}: alias survived`);
  new Script(next, {filename: `${animationId}-canvas-renderer.js`});
  for (const [label, pattern] of RUNTIME_BLOCKLIST) {
    invariant(!pattern.test(next), `${animationId}: runtime contains ${label}`);
  }
  return next;
}

function adapterSpec({record, target, metadata, frames, helper, runtimePath,
  audit}) {
  const animationId = record.animationId;
  const stageMatrix = composeStageMatrix(target.matrix,
    metadata.internalTranslation);
  const alias = `course-${animationId}`;
  const value = {schemaVersion: 1, animationId: alias,
    builderAnimationId: alias, finalAnimationId: animationId,
    classification: 'g678-alg-l11-simple-glossary-unregistered-engineering-candidate',
    title: `${animationId} exact ALG001 L11 glossary candidate`,
    source: {swf: `$${SOURCE_ENV}/${record.source.path}`,
      swfBytes: record.source.bytes, swfSha256: record.source.sha256},
    evidence: {scenarioInventory: audit.path,
      scenarioInventorySha256: audit.sha256,
      audioAudit: audit.path, audioAuditSha256: audit.sha256},
    ffdecExport: {tool: 'JPEXS Free Flash Decompiler 26.2.1 Canvas export',
      helper: helper.path, helperSha256: helper.sha256,
      helperBytes: helper.bytes, framesHtml: frames.path,
      framesHtmlSha256: frames.sha256, framesHtmlBytes: frames.bytes,
      targetSpriteObjectId: target.objectId,
      targetSpriteFunction: metadata.functionName,
      exportCanvas: metadata.exportCanvas,
      exportInternalTranslation: metadata.internalTranslation,
      expectedPlacedFunctionCount: metadata.placedFunctions.count,
      expectedPlacedFunctionsSha256: metadata.placedFunctions.sha256,
      expectedFontFunctionCount: metadata.fontFunctions.count,
      expectedFontFunctionsSha256: metadata.fontFunctions.sha256,
      embeddedImageVariableCount: metadata.imageVariables.count,
      embeddedImageVariablesSha256: metadata.imageVariables.sha256},
    timeline: {fps: 12,
      stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
      root: {frameCount: record.structure.rootFrameCount,
        preloaderStopFrame: 1, beginFrame: 6, beginLabel: 'begin',
        placementName: target.instanceName, placementDepth: target.depth,
        placementTwips: {x: target.matrix.tx * 20,
          y: target.matrix.ty * 20},
        placementPixels: {x: target.matrix.tx, y: target.matrix.ty}},
      local: {timelineId: `sprite-${target.objectId}`,
        frameCount: metadata.frameCount,
        livePlaybackEndFrame: metadata.frameCount,
        playbackMode: 'once', publicFrameIndexing: 'one-indexed'},
      stageRenderOffset: {x: target.matrix.tx - metadata.internalTranslation.x,
        y: target.matrix.ty - metadata.internalTranslation.y}},
    runtimeContract: {kind: 'structural-local-frame',
      scenarios: ['source-static-frame'], defaultScenario: 'source-static-frame',
      supportedLanguages: ['en'],
      seedMapping: 'fixed-zero-no-source-randomness-executed',
      blockedLocalFrameRanges: [],
      unresolved: [
        'Exact KeyAttribute glossary requests are typed; legacy ActionScript is not executed.',
        'Narration language, cue, and listening acceptance remain pending.',
        'Legacy key-term sublinks and example SWFs are not implemented.',
        'Product, browser, original-runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
      ], currentCanonicalFrameDomainDispositionAsserted: false},
    output: {script: runtimePath,
      manifest: runtimePath.replace(/canvas-renderer\.js$/u,
        'member-manifest.json'),
      spec: runtimePath.replace(/canvas-renderer\.js$/u, 'adapter-spec.json'),
      globalRegistry: ASSET_REGISTRY}, strictAcceptanceEffect: 'none'};
  return Object.freeze({value, stageMatrix});
}

function constantName(animationId) {
  return animationId.replace(/[^A-Za-z0-9]+/gu, '_').toUpperCase();
}

function timelineSource(page) {
  const name = constantName(page.animationId);
  const source = {calibrationId: CALIBRATION_ID, deploymentScope: 'local-only',
    source: {path: page.sourcePath, sha256: page.sourceSha256},
    reviewedLane: 'interactive-understood',
    adapterFamily: 'alg-l11-simple-glossary-tranche1-source-static',
    currentJavaScriptRegistered: false, productCalibrationPassed: false,
    engineeringPreviewReady: false,
    productBlockers: ['registration-and-modern-my-lesson-calibration-pending'],
    strictAcceptanceEffect: 'none'};
  const config = {animationId: page.animationId,
    title: `${page.titleEnglish} — unregistered ALG L11 glossary candidate`,
    sourceSwfSha256: page.sourceSha256,
    assetSource: page.runtime.url, assetSha256: page.runtime.sha256,
    stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
    nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
    backingStage: {width: 800, height: 600}, fps: 12,
    rootFrameCount: page.rootFrameCount, rootBeginFrame: 6,
    mainFrameDomain: page.frameDomain, mainFrameCount: page.frameCount,
    livePlaybackEndFrame: page.frameCount, playbackMode: 'once',
    strictCaptureIdentity: true, blockedFrameRanges: [],
    visualMarkers: [{id: `${page.frameDomain}-ffdec-drawing`, firstFrame: 1,
      lastFrame: page.frameCount}],
    sourceControlBehaviorLabel:
      'Exact ALG L11 glossary candidate; registration, product/browser QA, audio, and acceptance are pending.',
    showEngineeringDisclosure: false};
  return `import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";\n\n` +
    `export const ${name}_SOURCE = Object.freeze(${JSON.stringify(source, null, 2)} as const);\n\n` +
    `export const ${name}_CONFIG = Object.freeze(${JSON.stringify(config, null, 2)} satisfies SourceStaticCanvasCandidateConfig);\n`;
}

function moduleSource(page, terms) {
  const name = constantName(page.animationId);
  const glossaryTerms = page.buttons.map((button) => {
    const term = terms.find((candidate) =>
      candidate.normalizedKey === button.sourceKeyAttribute.toLowerCase());
    invariant(term, `${page.animationId}: exact recovered term missing`);
    return {id: term.id, sourceKeyAttribute: button.sourceKeyAttribute,
      sourceCharacterId: button.characterId, firstFrame: button.firstFrame,
      labels: term.labels};
  });
  return `"use client";\n\n` +
    `import {createPrivateAlgL11SimpleGlossaryCandidate} from "../private-source-static-alg-l11-simple-glossary-candidate";\n` +
    `import {${name}_CONFIG, ${name}_SOURCE} from "../timelines/${page.animationId}";\n\n` +
    `export const ${name}_GLOSSARY_TERMS = Object.freeze(${JSON.stringify(glossaryTerms, null, 2)} as const);\n\n` +
    `const candidate = createPrivateAlgL11SimpleGlossaryCandidate(${name}_CONFIG, Object.freeze({\n` +
    `  calibrationId: "${CALIBRATION_ID}",\n` +
    `  companionSurfaceId: "${page.animationId}-glossary",\n` +
    `  glossaryTerms: ${name}_GLOSSARY_TERMS,\n` +
    `}));\n` +
    `const animationModule = Object.freeze({...candidate.module, maturity: "private-current-js" as const});\n\n` +
    `export {${name}_SOURCE};\n` +
    `export const ${name}_MOVIE = candidate.movie;\n` +
    `export const ${name}_RUNTIME = candidate.runtime;\n` +
    `export const ${name}_SOURCE_CONTRACT = candidate.sourceContract;\n` +
    `export const ${name}_SCENARIOS = candidate.scenarios;\n` +
    `export const ${name}_RENDERER = candidate.Renderer;\n` +
    `export default animationModule;\n`;
}

async function directoryInventory(root) {
  const files = [];
  const directories = [];
  const walk = async (current, prefix = '') => {
    const entries = (await readdir(current, {withFileTypes: true}))
      .sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const target = path.join(current, entry.name);
      const relative = portable(path.join(prefix, entry.name));
      invariant(!entry.isSymbolicLink(), `generated symlink: ${target}`);
      if (entry.isDirectory()) {
        directories.push({path: relative});
        await walk(target, relative);
      } else if (entry.isFile()) {
        const binding = await stableFile(target, {absolute: true});
        files.push({path: relative, bytes: binding.bytes,
          sha256: binding.sha256});
      } else invariant(false, `generated special entry: ${target}`);
    }
  };
  await walk(root);
  return Object.freeze({directories, files, fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    checksumSetSha256: sha256(Buffer.from(files.map((file) =>
      `${file.sha256}  ${file.path}\n`).join('')))});
}

async function freezeTree(root) {
  for (const entry of await readdir(root, {withFileTypes: true})) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) await freezeTree(target);
    else if (entry.isFile()) await chmod(target, 0o444);
    else invariant(false, `cannot freeze special entry: ${target}`);
  }
  await chmod(root, 0o555);
}

async function thawTree(root) {
  await chmod(root, 0o755);
  for (const entry of await readdir(root, {withFileTypes: true})) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) await thawTree(target);
    else if (entry.isFile()) await chmod(target, 0o644);
  }
}

async function verifyFrozenTree(root) {
  const metadata = await lstat(root, {bigint: true});
  invariant(metadata.isDirectory() && !metadata.isSymbolicLink() &&
    Number(metadata.mode & 0o777n) === 0o555,
  `${root} directory mode drifted`);
  for (const entry of await readdir(root, {withFileTypes: true})) {
    const target = path.join(root, entry.name);
    invariant(!entry.isSymbolicLink(), `${target} is a symlink`);
    if (entry.isDirectory()) await verifyFrozenTree(target);
    else {
      const file = await lstat(target, {bigint: true});
      invariant(file.isFile() && file.nlink === 1n &&
        Number(file.mode & 0o777n) === 0o444,
      `${target} file custody drifted`);
    }
  }
}

async function loadContext() {
  const auditCheck = await auditG678AlgL11SimpleGlossaryTranche1({check: true});
  invariant(auditCheck.check === true,
    'ALG L11 tranche1 audit no longer self-verifies');
  const [audit, catalog, toolchainRun, safeAdapter, sourceStaticHost,
    glossaryHost, generator, source, swfmill] = await Promise.all([
    stableFile(AUDIT, {json: true}), stableFile(CATALOG, {json: true}),
    stableFile(TOOLCHAIN_RUN, {json: true}), stableFile(SAFE_ADAPTER),
    stableFile(SOURCE_STATIC_HOST), stableFile(GLOSSARY_HOST),
    stableFile(path.relative(ROOT, SCRIPT_PATH)), sourceRoot(), verifySwfmill(),
  ]);
  invariant(audit.value.auditId ===
      'g678-alg-l11-simple-glossary-tranche1-audit-v1' &&
    audit.value.records?.length === 8 &&
    audit.value.registrationCandidatePlacementCount === 8 &&
    audit.value.currentJavaScriptRegisteredCount === 0 &&
    audit.value.productCalibrationPassed === false &&
    audit.value.acceptanceEffects?.published === false,
  'ALG L11 tranche1 audit authority drifted');
  const pageMap = new Map(catalog.value.lessons.flatMap((lesson) =>
    lesson.pages.map((page) => [page.animationId, {lesson, page}])));
  for (const record of audit.value.records) {
    const entry = pageMap.get(record.animationId);
    invariant(entry?.lesson.stableLessonKey === 'shared-alg001-l11' &&
      entry.page.viewPath === record.source.path &&
      entry.page.sourceSha256 === record.source.sha256,
    `${record.animationId} audit/catalog cross-binding drifted`);
  }
  const ffdec = await verifyToolchain(toolchainRun.value.toolchain.ffdec);
  const inputs = Object.freeze({audit: descriptor(audit),
    catalog: descriptor(catalog), toolchainRun: descriptor(toolchainRun),
    safeAdapter: descriptor(safeAdapter),
    sourceStaticHost: descriptor(sourceStaticHost),
    glossaryHost: descriptor(glossaryHost), generator: descriptor(generator)});
  return Object.freeze({audit, catalog, pageMap, toolchainRun, ffdec,
    swfmill, source, inputs});
}

async function exportMember(record, context, stageRoot) {
  const sourceRootPath = path.join(stageRoot, 'sources', record.source.sha256);
  const canvas = path.join(sourceRootPath, 'canvas');
  await mkdir(canvas, {recursive: true});
  const source = await readSource(context.source, record);
  const stagedPath = path.join(sourceRootPath, 'source.swf');
  await writeFile(stagedPath, source.buffer, {flag: 'wx', mode: 0o444});
  await chmod(stagedPath, 0o444);
  const staged = await stableFile(stagedPath, {absolute: true});
  invariant(staged.sha256 === record.source.sha256 &&
    staged.bytes === record.source.bytes, 'staged source drifted');
  const xmlPath = path.join(sourceRootPath, 'source.xml');
  const ffdecArgs = [...context.ffdec.prefixArgs,
    '-config', 'packJavaScripts=false', '-onerror', 'abort',
    '-timeout', '120', '-exportTimeout', '600', '-format',
    'frame:canvas,sprite:canvas,script:as', '-export',
    'frame,sprite,script,image,sound', canvas, stagedPath];
  const swfmillArgs = ['-n', 'swf2xml', stagedPath, xmlPath];
  const [ffdecResult, swfmillResult] = await Promise.all([
    runProcess(context.ffdec.command, ffdecArgs),
    runProcess(context.swfmill.command, swfmillArgs),
  ]);
  const ffdecCommand = commandReceipt(ffdecResult, context.ffdec.command,
    ffdecArgs, `${record.animationId} FFDec`);
  const swfmillCommand = commandReceipt(swfmillResult,
    context.swfmill.command, swfmillArgs, `${record.animationId} swfmill`);
  const [sourceAfter, stagedAfter, xml] = await Promise.all([
    readSource(context.source, record),
    stableFile(stagedPath, {absolute: true}),
    stableFile(xmlPath, {absolute: true}),
  ]);
  invariant(sourceAfter.buffer.equals(source.buffer) &&
    stagedAfter.buffer.equals(source.buffer) &&
    JSON.stringify(stagedAfter.identity) === JSON.stringify(staged.identity),
  `${record.animationId}: source changed during generation`);
  const xmlText = xml.buffer.toString('utf8');
  const target = parseRootTarget(xmlText, record.animationId);
  const frameCount = spriteFrameCount(xmlText, record.animationId,
    target.objectId);
  invariant(target.objectId === record.structure.mainObjectId &&
    frameCount === record.structure.mainFrameCount,
  `${record.animationId}: main timeline drifted`);
  const spriteRoot = path.join(canvas, 'sprites',
    `DefineSprite_${target.objectId}`);
  const [framesFile, helperFile] = await Promise.all([
    stableFile(path.join(spriteRoot, 'frames.html'), {absolute: true}),
    stableFile(path.join(spriteRoot, 'canvas.js'), {absolute: true}),
  ]);
  const rawBase = `${OUTPUT_ROOT}/sources/${record.source.sha256}/canvas/sprites/DefineSprite_${target.objectId}`;
  const frames = Object.freeze({path: `${rawBase}/frames.html`,
    bytes: framesFile.bytes, sha256: framesFile.sha256});
  const helper = Object.freeze({path: `${rawBase}/canvas.js`,
    bytes: helperFile.bytes, sha256: helperFile.sha256});
  const metadata = deriveMetadata(framesFile.buffer.toString('utf8'),
    record.animationId, target.objectId, frameCount);
  return Object.freeze({record, source, staged, xml, ffdecCommand,
    swfmillCommand, target, framesFile, helperFile, frames, helper, metadata});
}

async function buildMember(exported, context, stageRoot) {
  const record = exported.record;
  const animationId = record.animationId;
  const entry = context.pageMap.get(animationId);
  const memberRoot = path.join(stageRoot, 'members', animationId);
  await mkdir(memberRoot, {recursive: true});
  const runtimePath = `${OUTPUT_ROOT}/members/${animationId}/canvas-renderer.js`;
  const spec = adapterSpec({record, target: exported.target,
    metadata: exported.metadata, frames: exported.frames,
    helper: exported.helper, runtimePath, audit: context.inputs.audit});
  const built = buildSafeRuntime({
    helperSource: exported.helperFile.buffer.toString('utf8'),
    framesHtml: exported.framesFile.buffer.toString('utf8'),
    spec: spec.value});
  const runtimeBytes = Buffer.from(finalizeRuntime(built.runtime,
    spec.value, animationId, spec.stageMatrix));
  const specBytes = stableBytes(spec.value);
  await Promise.all([
    writeFile(path.join(memberRoot, 'canvas-renderer.js'), runtimeBytes,
      {flag: 'wx'}),
    writeFile(path.join(memberRoot, 'adapter-spec.json'), specBytes,
      {flag: 'wx'}),
  ]);
  const runtime = Object.freeze({path: runtimePath,
    bytes: runtimeBytes.length, sha256: sha256(runtimeBytes),
    url: `/flash-assets/g678-local/${animationId}/canvas-renderer.js`,
    globalRegistry: ASSET_REGISTRY});
  const buttons = record.behavior.buttons.map((button) => Object.freeze({
    characterId: button.characterId,
    sourceKeyAttribute: button.sourceKeyAttribute,
    firstFrame: button.firstFrame}));
  const manifest = {schemaVersion: 1,
    artifactType: 'g678-alg-l11-simple-glossary-tranche1-current-js-member-v1',
    animationId, source: {path: record.source.path,
      bytes: record.source.bytes, sha256: record.source.sha256,
      compilerRepresentativePath: exported.source.viewPath,
      compilerCopy: {path: `${OUTPUT_ROOT}/sources/${record.source.sha256}/source.swf`,
        bytes: exported.staged.bytes, sha256: exported.staged.sha256,
        mode: 0o444}},
    reviewedAuthority: {audit: context.inputs.audit,
      keyTermRecovery: context.audit.value.inputs.keyTermRecovery,
      exactScripts: record.behavior.exactScripts,
      exactTextExports: record.sourceText.exactTextExports},
    timeline: {rootFrameCount: record.structure.rootFrameCount,
      rootBeginFrame: 6, frameDomain: `sprite-${exported.target.objectId}`,
      frameCount: exported.metadata.frameCount,
      livePlaybackEndFrame: exported.metadata.frameCount,
      lastPlacedFrame: exported.metadata.lastPlacedFrame,
      rootPlacementMatrix: exported.target.matrix, buttons,
      buttonFirstFrame: Math.min(...record.structure.buttonFirstFrames),
      buttonFirstFrames: record.structure.buttonFirstFrames,
      explicitChildStop: false},
    compiler: {ffdecCommand: exported.ffdecCommand,
      swfmillCommand: exported.swfmillCommand,
      rawFrames: exported.frames, rawHelper: exported.helper,
      adapterBuilder: context.inputs.safeAdapter},
    runtime: {canvasRenderer: runtime,
      adapterSpec: {path: `${OUTPUT_ROOT}/members/${animationId}/adapter-spec.json`,
        bytes: specBytes.length, sha256: sha256(specBytes)}},
    product: {typedGlossaryIntentImplemented: true,
      currentJavaScriptRegistered: false, productCalibrationPassed: false,
      engineeringPreviewReady: false, browserQAPassed: false},
    productBlockers: ['registration-and-modern-my-lesson-calibration-pending'],
    acceptanceEffects: FALSE_EFFECTS};
  const manifestBytes = stableBytes(manifest);
  await writeFile(path.join(memberRoot, 'member-manifest.json'), manifestBytes,
    {flag: 'wx'});
  const page = Object.freeze({animationId,
    placementId: entry.page.placementId, assetId: entry.page.assetId,
    moduleCode: entry.lesson.moduleCode,
    lessonNumber: entry.lesson.lessonNumber,
    stableLessonKey: entry.lesson.stableLessonKey,
    globalPageOrdinal: entry.page.globalOrdinal,
    sectionCode: entry.page.sectionCode,
    sectionPageOrdinal: entry.page.sectionPageOrdinal,
    titleEnglish: entry.page.titleEnglish, sourcePath: record.source.path,
    sourceSha256: record.source.sha256,
    rootFrameCount: record.structure.rootFrameCount,
    frameDomain: `sprite-${exported.target.objectId}`,
    frameCount: exported.metadata.frameCount, buttons, runtime});
  return Object.freeze({animationId, page,
    manifest: Object.freeze({path: `${OUTPUT_ROOT}/members/${animationId}/member-manifest.json`,
      bytes: manifestBytes.length, sha256: sha256(manifestBytes)}), runtime});
}

async function build(context, stageRoot) {
  const exports = [];
  for (const record of context.audit.value.records) {
    exports.push(await exportMember(record, context, stageRoot));
  }
  await verifyToolchain(context.toolchainRun.value.toolchain.ffdec);
  const members = [];
  for (const exported of exports) {
    members.push(await buildMember(exported, context, stageRoot));
  }
  members.sort((left, right) => compareText(left.animationId,
    right.animationId));
  invariant(exports.length === 8 && members.length === 8,
    'ALG L11 tranche1 generated denominator drifted');
  const payloadInventory = await directoryInventory(stageRoot);
  const inventoryBytes = stableBytes(payloadInventory);
  await writeFile(path.join(stageRoot, 'output-inventory.json'),
    inventoryBytes, {flag: 'wx'});
  const run = {schemaVersion: 1,
    artifactType: 'g678-alg-l11-simple-glossary-tranche1-current-js-run-v1',
    runId: RUN_ID, status: 'generated-unregistered-local-only-candidates',
    deploymentScope: 'local-only', inputs: context.inputs,
    sourceRoot: context.source.identity,
    toolchain: {ffdec: context.ffdec.identity,
      swfmill: context.swfmill.identity},
    generatedPlacementCount: 8, compiledUniqueSwfCount: 8,
    affectedLessonCount: 1, registryEntriesWritten: 0,
    currentJavaScriptRegisteredCount: 0,
    productCalibrationPassed: false, browserQAPassed: false,
    engineeringPreviewReady: false, scaleOutAuthorized: false,
    productBlockers: ['registration-and-modern-my-lesson-calibration-pending'],
    acceptanceEffects: FALSE_EFFECTS,
    outputInventory: {path: `${OUTPUT_ROOT}/output-inventory.json`,
      bytes: inventoryBytes.length, sha256: sha256(inventoryBytes)},
    sources: exports.map((item) => Object.freeze({
      sourceSha256: item.record.source.sha256,
      sourceBytes: item.record.source.bytes,
      selectedAnimationIds: [item.record.animationId],
      sourceIdentity: item.source.identity,
      stagedSource: {path: `${OUTPUT_ROOT}/sources/${item.record.source.sha256}/source.swf`,
        bytes: item.staged.bytes, sha256: item.staged.sha256},
      xml: {path: `${OUTPUT_ROOT}/sources/${item.record.source.sha256}/source.xml`,
        bytes: item.xml.bytes, sha256: item.xml.sha256},
      ffdecCommand: item.ffdecCommand,
      swfmillCommand: item.swfmillCommand})),
    members: members.map((member) => Object.freeze({
      animationId: member.animationId, manifest: member.manifest,
      runtime: member.runtime}))};
  const runBytes = stableBytes(run);
  await writeFile(path.join(stageRoot, 'run-manifest.json'), runBytes,
    {flag: 'wx'});
  const runBinding = Object.freeze({path: `${OUTPUT_ROOT}/run-manifest.json`,
    bytes: runBytes.length, sha256: sha256(runBytes)});
  const tracked = new Map();
  const entries = [];
  for (const member of members) {
    const timelinePath = `packages/demos/src/timelines/${member.animationId}.ts`;
    const modulePath = `packages/demos/src/modules/${member.animationId}.tsx`;
    const timelineBytes = Buffer.from(timelineSource(member.page));
    const moduleBytes = Buffer.from(moduleSource(member.page,
      context.audit.value.terms));
    tracked.set(timelinePath, timelineBytes);
    tracked.set(modulePath, moduleBytes);
    entries.push(Object.freeze({key: member.animationId,
      module: `./modules/${member.animationId}`,
      maturity: 'private-current-js', complexityLane: 'interactive-understood',
      deploymentScope: 'local-only',
      adapterFamily: 'alg-l11-simple-glossary-tranche1-source-static',
      timeline: {path: timelinePath, bytes: timelineBytes.length,
        sha256: sha256(timelineBytes)},
      moduleFile: {path: modulePath, bytes: moduleBytes.length,
        sha256: sha256(moduleBytes)},
      memberManifest: member.manifest,
      runtime: {canvasRenderer: member.runtime,
        frameDomain: member.page.frameDomain,
        frameCount: member.page.frameCount,
        livePlaybackEndFrame: member.page.frameCount}}));
  }
  const fragment = {schemaVersion: 1,
    artifactType: 'g678-alg-l11-simple-glossary-tranche1-current-js-fragment-v1',
    runId: RUN_ID, compilerRun: runBinding, deploymentScope: 'local-only',
    reviewedAudit: context.inputs.audit, auditedPlacementCount: 8,
    recoveredEligiblePlacementCount: 8, blockedPlacementCount: 0,
    generatedPlacementCount: 8, entries,
    currentJavaScriptRegisteredCount: 0,
    productCalibrationPassed: false, browserQAPassed: false,
    engineeringPreviewReady: false, wholeLessonEngineeringPreviewCount: 0,
    productBlockers: ['registration-and-modern-my-lesson-calibration-pending'],
    acceptanceEffects: FALSE_EFFECTS};
  const fragmentBytes = stableBytes(fragment);
  tracked.set(FRAGMENT, fragmentBytes);
  return Object.freeze({runBinding, fragmentBytes, tracked});
}

async function publishTracked(tracked) {
  const created = [];
  try {
    for (const [relativePath, bytes] of tracked) {
      const target = projectPath(relativePath);
      await mkdir(path.dirname(target), {recursive: true});
      await writeFile(target, bytes, {flag: 'wx'});
      const current = await stableFile(relativePath);
      invariant(current.buffer.equals(bytes),
        `${relativePath} changed during publication`);
      created.push(Object.freeze({target, relativePath, bytes: current.bytes,
        sha256: current.sha256, identity: current.identity}));
    }
  } catch (error) {
    for (const item of created.reverse()) {
      const current = await stableFile(item.target, {absolute: true})
        .catch(() => null);
      if (current && current.bytes === item.bytes &&
        current.sha256 === item.sha256 &&
        JSON.stringify(current.identity) === JSON.stringify(item.identity)) {
        await unlink(item.target);
      }
    }
    throw error;
  }
}

async function compareTracked(tracked) {
  for (const [relativePath, bytes] of tracked) {
    const current = await stableFile(relativePath);
    invariant(current.buffer.equals(bytes),
      `${relativePath} drifted from ALG L11 tranche1 generator`);
  }
}

async function compareRun(expectedRoot, canonicalRoot) {
  const [expected, current] = await Promise.all([
    directoryInventory(expectedRoot), directoryInventory(canonicalRoot),
  ]);
  invariant(JSON.stringify(expected) === JSON.stringify(current),
    'ALG L11 tranche1 compiler run drifted');
  await verifyFrozenTree(canonicalRoot);
}

export async function runAlgL11SimpleGlossaryTranche1CurrentJs(
  {check = false} = {},
) {
  const context = await loadContext();
  const canonical = projectPath(OUTPUT_ROOT);
  const stage = check ? `${canonical}.check-${process.pid}-${Date.now()}` :
    `${canonical}.staging-${process.pid}`;
  invariant(!await stat(stage).then(() => true, () => false),
    'ALG L11 tranche1 generator staging path exists');
  if (!check) {
    invariant(!await stat(canonical).then(() => true, () => false),
      `${OUTPUT_ROOT} already exists`);
    for (const record of context.audit.value.records) {
      for (const relativePath of [
        `packages/demos/src/timelines/${record.animationId}.ts`,
        `packages/demos/src/modules/${record.animationId}.tsx`,
      ]) invariant(!await stat(projectPath(relativePath)).then(() => true,
        () => false), `${relativePath} already exists`);
    }
    invariant(!await stat(projectPath(FRAGMENT)).then(() => true, () => false),
      `${FRAGMENT} already exists`);
  }
  await mkdir(stage, {recursive: false});
  try {
    const result = await build(context, stage);
    if (check) {
      await compareTracked(result.tracked);
      await compareRun(stage, canonical);
      await thawTree(stage);
      await rm(stage, {recursive: true});
    } else {
      await freezeTree(stage);
      await rename(stage, canonical);
      try {
        await publishTracked(result.tracked);
      } catch (error) {
        await chmod(canonical, 0o755).catch(() => {});
        await rename(canonical,
          `${canonical}.failed-tracked-publication-${Date.now()}`)
          .catch(() => {});
        throw error;
      }
    }
    return Object.freeze({check, runId: RUN_ID,
      compilerRun: result.runBinding,
      fragment: Object.freeze({path: FRAGMENT,
        bytes: result.fragmentBytes.length,
        sha256: sha256(result.fragmentBytes)}),
      generatedPlacementCount: 8, compiledUniqueSwfCount: 8,
      affectedLessonCount: 1, currentJavaScriptRegisteredCount: 0,
      productCalibrationPassed: false, browserQAPassed: false,
      engineeringPreviewReady: false, scaleOutAuthorized: false,
      acceptanceEffects: FALSE_EFFECTS});
  } catch (error) {
    if (await stat(stage).then(() => true, () => false)) {
      await chmod(stage, 0o755).catch(() => {});
      await rename(stage, `${stage}.failed`).catch(() => {});
    }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: build-g678-alg-l11-simple-glossary-tranche1-current-js.mjs [--check]');
  runAlgL11SimpleGlossaryTranche1CurrentJs({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
