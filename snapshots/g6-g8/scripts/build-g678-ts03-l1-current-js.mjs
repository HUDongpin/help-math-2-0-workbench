#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import {Script} from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {buildSafeRuntime} from './build-safe-ffdec-canvas-adapter.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const RUN_ID = 'g678-ts03-l1-current-js-15-v1';
const OUTPUT_ROOT = `work/g678-shared-page-factory/${RUN_ID}`;
const FRAGMENT =
  `catalog/product-bridge-calibrations/${RUN_ID}.fragment.json`;
const AUDIT = 'catalog/g678-ts03-family-audit-v1.json';
const RECOVERY = 'catalog/g678-ts03-l1-keyterm-recovery-v1.json';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const PREDECESSOR =
  'catalog/product-bridge-calibrations/g678-current-js-216-page-registration-v1.json';
const TOOLCHAIN_RUN =
  'work/g678-shared-page-factory/g678-advanced-manual-current-js-3-v1/run-manifest.json';
const SAFE_ADAPTER = 'scripts/build-safe-ffdec-canvas-adapter.mjs';
const SOURCE_STATIC_HOST =
  'packages/demos/src/source-static-canvas-candidate.tsx';
const GLOSSARY_HOST =
  'packages/demos/src/private-source-static-glossary-candidate.tsx';
const SOURCE_ENV = 'HELP_MATH_G678_SOURCE_ROOT';
const ASSET_REGISTRY = 'HELP_MATH_CANVAS_ASSETS';
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
const ACCEPTANCE_EFFECTS = Object.freeze({
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

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function portable(value) {
  return value.split(path.sep).join('/');
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function projectPath(relativePath) {
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return absolute;
}

async function stableFile(target, {json = false, projectRelative = true} = {}) {
  const absolute = projectRelative ? projectPath(target) : path.resolve(target);
  const [resolved, before] = await Promise.all([
    realpath(absolute), lstat(absolute, {bigint: true}),
  ]);
  invariant(resolved === absolute && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n,
  `${target} must be one canonical ordinary file`);
  const buffer = await readFile(absolute);
  const after = await lstat(absolute, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${target} changed during read`);
  return Object.freeze({absolute, buffer,
    path: projectRelative ? target : absolute,
    bytes: buffer.length, sha256: sha256(buffer),
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
  const [resolved, metadata] = await Promise.all([
    realpath(root), lstat(root, {bigint: true}),
  ]);
  invariant(root === resolved && metadata.isDirectory() &&
    !metadata.isSymbolicLink() && (metadata.mode & 0o222n) === 0n,
  `${SOURCE_ENV} must be a real read-only directory`);
  const shared = path.join(root, 'G6-G8-shared');
  const [sharedResolved, sharedMetadata] = await Promise.all([
    realpath(shared), lstat(shared, {bigint: true}),
  ]);
  invariant(sharedResolved === shared && sharedMetadata.isDirectory() &&
    !sharedMetadata.isSymbolicLink() &&
    (sharedMetadata.mode & 0o222n) === 0n,
  'G6-G8-shared must be a real read-only directory');
  return Object.freeze({root, shared,
    identity: Object.freeze({realPathSha256: sha256(resolved),
      device: String(metadata.dev), inode: String(metadata.ino),
      mode: Number(metadata.mode & 0o777n),
      sharedRealPathSha256: sha256(shared),
      sharedDevice: String(sharedMetadata.dev),
      sharedInode: String(sharedMetadata.ino),
      sharedMode: Number(sharedMetadata.mode & 0o777n)})});
}

async function readSource(source, record) {
  const viewPath = record.placements[0].sourcePath;
  const relative = viewPath.replace(/^G6-G8-shared\//u, '');
  invariant(relative !== viewPath && relative.split('/').every((segment) =>
    segment && segment !== '.' && segment !== '..'),
  `${viewPath} is not canonical`);
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
    buffer.length === record.sourceBytes &&
    sha256(buffer) === record.sourceSha256,
  `${viewPath} source bytes or identity drifted`);
  return Object.freeze({relative, viewPath, buffer,
    identity: Object.freeze({device: String(after.dev), inode: String(after.ino),
      size: String(after.size), mtimeNs: String(after.mtimeNs),
      mode: Number(after.mode & 0o777n), nlink: Number(after.nlink)})});
}

async function verifyToolchain(identity) {
  for (const name of CRITICAL_ENVIRONMENT) {
    invariant(process.env[name] === undefined,
      `${name} must be absent for TS03 generation`);
  }
  const verify = async (expected, label) => {
    const current = await stableFile(expected.realPath,
      {projectRelative: false});
    invariant(current.bytes === expected.bytes &&
      current.sha256 === expected.sha256 &&
      current.identity.mode === expected.mode &&
      current.identity.nlink === expected.nlink,
    `${label} drifted`);
  };
  await verify(identity.java, 'bound Java executable');
  await verify(identity.jar, 'bound FFDec JAR');
  invariant(identity.jarManifest.classPath.length === 37,
    'FFDec classpath denominator drifted');
  for (const entry of identity.jarManifest.classPath) {
    await verify(entry, `FFDec classpath ${entry.entry}`);
  }
  const recordedPrefixArgs = [...identity.invocation.prefixArgs];
  const jarIndex = recordedPrefixArgs.indexOf('-jar');
  invariant(jarIndex >= 0, 'FFDec direct-Java invocation lacks -jar');
  recordedPrefixArgs.splice(jarIndex, 0, '-Djava.awt.headless=true');
  return Object.freeze({
    command: identity.java.realPath,
    prefixArgs: Object.freeze(recordedPrefixArgs.map((argument) =>
      argument === '<BOUND_FFDEC_JAR>' ? identity.jar.realPath : argument)),
    identity: Object.freeze({...identity,
      effectiveInvocation: Object.freeze({
        command: '<BOUND_JAVA_EXECUTABLE>',
        prefixArgs: Object.freeze(recordedPrefixArgs),
      })}),
  });
}

async function verifySwfmill() {
  const requested = '/opt/homebrew/bin/swfmill';
  const real = await realpath(requested);
  const binding = await stableFile(real, {projectRelative: false});
  invariant(binding.sha256 ===
    'b1299adad7f32d8e489574539e79b0f42c4960148170bc1ca48736e07ccbd311',
  'swfmill executable drifted');
  return Object.freeze({command: real,
    identity: Object.freeze({requestedPath: requested, realPath: real,
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
      ? `<${path.basename(argument)}>` : argument)),
    exitCode: 0,
    stdout: Object.freeze({captured: true, recorded: false,
      exclusionReason: 'tool progress contains volatile staging paths and timings'}),
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
    directFrames + 1 === 6,
  `${animationId}: root target or begin frame drifted`);
  const matrix = Object.freeze({a: number('scaleX', 1),
    b: number('skewY', 0), c: number('skewX', 0),
    d: number('scaleY', 1), tx: number('transX', 0) / 20,
    ty: number('transY', 0) / 20});
  invariant(Object.values(matrix).every(Number.isFinite),
    `${animationId}: root matrix invalid`);
  return Object.freeze({objectId, beginFrame: 6, matrix,
    instanceName: placed.name, depth: placed.depth});
}

function spriteFrameCount(xml, animationId, objectId) {
  const matches = [...xml.matchAll(new RegExp(
    `<DefineSprite\\s+objectID="${objectId}"\\s+frames="(\\d+)">`, 'gu'))];
  invariant(matches.length === 1 && Number(matches[0][1]) > 1,
    `${animationId}: named animation sprite frame count is invalid`);
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
      y: Number(header[2])}),
    lastPlacedFrame: Math.max(...placedFrames),
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

function finalizeRuntime(runtime, spec, placement, stageMatrix) {
  const literal = (value) => Object.is(value, -0) ? '0' : String(value);
  let next = replaceExactlyOnce(runtime,
    `ctx.transform(1, 0, 0, 1, ${spec.timeline.stageRenderOffset.x}, ${spec.timeline.stageRenderOffset.y});`,
    `ctx.transform(${[stageMatrix.a, stageMatrix.b, stageMatrix.c,
      stageMatrix.d, stageMatrix.e, stageMatrix.f].map(literal).join(', ')});`,
    `${placement.animationId} root transform`);
  const alias = JSON.stringify(spec.animationId);
  const actual = JSON.stringify(placement.animationId);
  invariant(next.split(alias).length - 1 >= 2,
    `${placement.animationId}: runtime alias missing`);
  next = next.split(alias).join(actual);
  const mutable =
    `registry[${actual}] = Object.freeze({metadata: METADATA, ready: ready, ` +
    'resolveFrameState: resolveFrameState, render: render});';
  const immutable =
    `Object.defineProperty(registry, ${actual}, {value: Object.freeze({metadata: METADATA, ready: ready, ` +
    'resolveFrameState: resolveFrameState, render: render}), configurable: false, enumerable: true, writable: false});';
  next = replaceExactlyOnce(next, mutable, immutable,
    `${placement.animationId} immutable registry`);
  next = replaceExactlyOnce(next,
    '/* Generated by scripts/build-safe-ffdec-canvas-adapter.mjs. */',
    '/* Generated by scripts/build-g678-ts03-l1-current-js.mjs through the hash-bound safe FFDec Canvas adapter. */',
    `${placement.animationId} generator header`);
  invariant(!next.includes(alias), `${placement.animationId}: alias survived`);
  new Script(next, {filename: `${placement.animationId}-canvas-renderer.js`});
  for (const [label, pattern] of RUNTIME_BLOCKLIST) {
    invariant(!pattern.test(next),
      `${placement.animationId}: runtime contains ${label}`);
  }
  return next;
}

function adapterSpec({placement, record, target, metadata,
  framesBinding, helperBinding, runtimePath, inputs}) {
  const stageMatrix = composeStageMatrix(target.matrix,
    metadata.internalTranslation);
  const alias = `course-${placement.animationId}`;
  const value = {
    schemaVersion: 1,
    animationId: alias,
    builderAnimationId: alias,
    finalAnimationId: placement.animationId,
    classification: 'private-g678-ts03-l1-current-js-engineering',
    title: `${placement.animationId} reviewed TS03 glossary timeline`,
    source: {swf: `$${SOURCE_ENV}/${record.placements[0].sourcePath}`,
      swfBytes: record.sourceBytes, swfSha256: record.sourceSha256},
    evidence: {scenarioInventory: inputs.audit.path,
      scenarioInventorySha256: inputs.audit.sha256,
      audioAudit: inputs.audit.path,
      audioAuditSha256: inputs.audit.sha256},
    ffdecExport: {tool: 'JPEXS Free Flash Decompiler 26.2.1 Canvas export',
      helper: helperBinding.path, helperSha256: helperBinding.sha256,
      helperBytes: helperBinding.bytes,
      framesHtml: framesBinding.path,
      framesHtmlSha256: framesBinding.sha256,
      framesHtmlBytes: framesBinding.bytes,
      targetSpriteObjectId: placement.objectId,
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
      root: {frameCount: 10, preloaderStopFrame: 1, beginFrame: 6,
        beginLabel: 'begin', placementName: target.instanceName,
        placementDepth: target.depth,
        placementTwips: {x: target.matrix.tx * 20,
          y: target.matrix.ty * 20},
        placementPixels: {x: target.matrix.tx, y: target.matrix.ty}},
      local: {timelineId: `sprite-${placement.objectId}`,
        frameCount: placement.frameCount,
        livePlaybackEndFrame: placement.frameCount,
        playbackMode: 'once', publicFrameIndexing: 'one-indexed'},
      stageRenderOffset: {x: target.matrix.tx - metadata.internalTranslation.x,
        y: target.matrix.ty - metadata.internalTranslation.y}},
    runtimeContract: {kind: 'structural-local-frame',
      scenarios: ['source-static-frame'], defaultScenario: 'source-static-frame',
      supportedLanguages: ['en'],
      seedMapping: 'fixed-zero-no-source-randomness-executed',
      blockedLocalFrameRanges: [],
      unresolved: [
        'Legacy ActionScript is not executed; Organize/Information are maintained typed host requests.',
        'Embedded narration and catalog MP3 language/cue/listening semantics remain pending.',
        'Legacy key-term sublinks and example SWFs remain outside this candidate.',
        'Original-runtime, fidelity, human, Owner, strict, release, and publication gates remain false.',
      ], currentCanonicalFrameDomainDispositionAsserted: false},
    output: {script: runtimePath,
      manifest: runtimePath.replace(/canvas-renderer\.js$/u,
        'member-manifest.json'),
      spec: runtimePath.replace(/canvas-renderer\.js$/u,
        'adapter-spec.json'), globalRegistry: ASSET_REGISTRY},
    strictAcceptanceEffect: 'none',
  };
  return Object.freeze({value, stageMatrix});
}

function constantName(animationId) {
  return animationId.replace(/[^A-Za-z0-9]+/gu, '_').toUpperCase();
}

function timelineSource(page) {
  const name = constantName(page.animationId);
  const source = {calibrationId: RUN_ID, deploymentScope: 'local-only',
    source: {path: page.sourcePath, sha256: page.sourceSha256},
    reviewedLane: 'interactive-understood',
    adapterFamily: 'ts03-l1-glossary-source-static',
    familyVisualPlaybackCalibrationPassed: false,
    currentJavaScriptRegistered: false,
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
    productBlockers: ['ts03-l1-browser-product-calibration-pending'],
    strictAcceptanceEffect: 'none'};
  const config = {animationId: page.animationId,
    title: `${page.titleEnglish} — local-only TS03 Current-JS candidate`,
    sourceSwfSha256: page.sourceSha256,
    assetSource: page.runtime.url, assetSha256: page.runtime.sha256,
    stage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
    nativeStage: {width: 800, height: 600, backgroundColor: '#b8d8f7'},
    backingStage: {width: 800, height: 600}, fps: 12,
    rootFrameCount: 10, rootBeginFrame: 6,
    mainFrameDomain: page.frameDomain, mainFrameCount: page.frameCount,
    livePlaybackEndFrame: page.frameCount, playbackMode: 'once',
    strictCaptureIdentity: true, blockedFrameRanges: [],
    visualMarkers: [{id: `${page.frameDomain}-ffdec-drawing`, firstFrame: 1,
      lastFrame: page.frameCount}],
    sourceControlBehaviorLabel:
      'TS03 typed glossary candidate awaiting browser product calibration; audio and acceptance gates remain independent.',
    showEngineeringDisclosure: false};
  return `import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";\n\n` +
    `export const ${name}_SOURCE = Object.freeze(${JSON.stringify(source, null, 2)} as const);\n\n` +
    `export const ${name}_CONFIG = Object.freeze(${JSON.stringify(config, null, 2)} satisfies SourceStaticCanvasCandidateConfig);\n`;
}

function moduleSource(page, terms) {
  const name = constantName(page.animationId);
  const glossaryTerms = page.buttons.map((button) => {
    const term = terms.find((candidate) =>
      candidate.sourceKeyAttribute === button.sourceKeyAttribute);
    invariant(term, `${page.animationId}: recovered glossary term missing`);
    return {id: term.id, sourceKeyAttribute: term.sourceKeyAttribute,
      sourceCharacterId: button.characterId, firstFrame: page.buttonFirstFrame,
      labels: term.labels};
  });
  return `"use client";\n\n` +
    `import {createPrivateSourceStaticGlossaryCandidate} from "../private-source-static-glossary-candidate";\n` +
    `import {${name}_CONFIG, ${name}_SOURCE} from "../timelines/${page.animationId}";\n\n` +
    `export const ${name}_GLOSSARY_TERMS = Object.freeze(${JSON.stringify(glossaryTerms, null, 2)} as const);\n\n` +
    `const candidate = createPrivateSourceStaticGlossaryCandidate(${name}_CONFIG, Object.freeze({\n` +
    `  calibrationId: "g678-ts03-l1-product-calibration-v1",\n` +
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

async function freezeTree(root) {
  const entries = await readdir(root, {withFileTypes: true});
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) await freezeTree(target);
    else if (entry.isFile()) await chmod(target, 0o444);
    else invariant(false, `special file in frozen tree: ${target}`);
  }
  await chmod(root, 0o555);
}

async function thawTree(root) {
  const entries = await readdir(root, {withFileTypes: true});
  await chmod(root, 0o755);
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) await thawTree(target);
    else if (entry.isFile()) await chmod(target, 0o644);
  }
}

async function directoryInventory(root) {
  const files = [];
  const directories = [];
  async function walk(current, prefix = '') {
    const entries = (await readdir(current, {withFileTypes: true}))
      .sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const relative = portable(path.join(prefix, entry.name));
      if (entry.isDirectory()) {
        directories.push({path: relative});
        await walk(absolute, relative);
      } else if (entry.isFile()) {
        const binding = await stableFile(absolute, {projectRelative: false});
        files.push({path: relative, bytes: binding.bytes,
          sha256: binding.sha256});
      } else invariant(false, `special inventory entry: ${absolute}`);
    }
  }
  await walk(root);
  return Object.freeze({directories, files,
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    checksumSetSha256: sha256(Buffer.from(files.map((file) =>
      `${file.sha256}  ${file.path}\n`).join('')))});
}

async function verifyFrozenTree(root) {
  async function walk(current) {
    const [canonical, metadata] = await Promise.all([
      realpath(current), lstat(current, {bigint: true}),
    ]);
    invariant(canonical === current && metadata.isDirectory() &&
      !metadata.isSymbolicLink() && (metadata.mode & 0o777n) === 0o555n,
    `TS03 frozen directory drifted: ${current}`);
    for (const entry of await readdir(current, {withFileTypes: true})) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile()) {
        const file = await stableFile(absolute, {projectRelative: false});
        invariant(file.identity.mode === 0o444 && file.identity.nlink === 1,
          `TS03 frozen file drifted: ${absolute}`);
      } else invariant(false, `TS03 frozen tree special entry: ${absolute}`);
    }
  }
  await walk(root);
}

async function loadContext() {
  const [audit, recovery, catalog, predecessor, toolchainRun, safeAdapter,
    sourceStaticHost, glossaryHost, generator, source, swfmill] =
    await Promise.all([
      stableFile(AUDIT, {json: true}),
      stableFile(RECOVERY, {json: true}),
      stableFile(CATALOG, {json: true}),
      stableFile(PREDECESSOR, {json: true}),
      stableFile(TOOLCHAIN_RUN, {json: true}),
      stableFile(SAFE_ADAPTER), stableFile(SOURCE_STATIC_HOST),
      stableFile(GLOSSARY_HOST),
      stableFile(portable(path.relative(ROOT, SCRIPT_PATH))),
      sourceRoot(), verifySwfmill(),
    ]);
  invariant(audit.value.scope?.ts03Placements === 44 &&
    audit.value.scope.uniqueSourceSwfs === 43 &&
    audit.value.records?.length === 43 &&
    audit.value.familyCalibrationPassed === false &&
    audit.value.registrationCandidatePlacementCount === 0,
  'TS03 audit authority drifted');
  invariant(recovery.value.eligibility?.eligiblePlacementCount === 15 &&
    recovery.value.eligibility.blockedPlacementCount === 29 &&
    recovery.value.productCalibrationPassed === false &&
    recovery.value.registrationCandidatePlacementCount === 0 &&
    recovery.value.custodyBoundary.canonicalSourcePromotionAuthorized === false,
  'TS03 L1 recovery authority drifted');
  invariant(predecessor.value.selectedPages?.length === 216 &&
    predecessor.value.registrationCandidatePlacementCount === 216 &&
    predecessor.value.deploymentScope === 'local-only',
  '216-page predecessor freeze drifted');
  const eligibleIds = new Set(recovery.value.eligibility.eligible.map((row) =>
    row.animationId));
  const existing = new Set(predecessor.value.selectedPages.map((page) =>
    page.animationId));
  invariant(eligibleIds.size === 15 &&
    [...eligibleIds].every((id) => !existing.has(id)),
  'TS03 eligible set overlaps predecessor');
  const records = audit.value.records.map((record) => Object.freeze({
    ...record,
    selectedPlacements: Object.freeze(record.placements.filter((placement) =>
      eligibleIds.has(placement.animationId))),
  })).filter((record) => record.selectedPlacements.length > 0);
  invariant(records.reduce((sum, record) =>
    sum + record.selectedPlacements.length, 0) === 15 &&
    records.length === 14,
  'TS03 selected source/member denominator drifted');
  const pageMap = new Map(catalog.value.lessons.flatMap((lesson) =>
    lesson.pages.map((page) => [page.animationId, {lesson, page}])));
  const ffdec = await verifyToolchain(toolchainRun.value.toolchain.ffdec);
  const inputs = Object.freeze({audit: descriptor(audit),
    recovery: descriptor(recovery), catalog: descriptor(catalog),
    predecessor: descriptor(predecessor), toolchainRun: descriptor(toolchainRun),
    safeAdapter: descriptor(safeAdapter),
    sourceStaticHost: descriptor(sourceStaticHost),
    glossaryHost: descriptor(glossaryHost), generator: descriptor(generator)});
  return Object.freeze({audit, recovery, catalog, predecessor, toolchainRun,
    source, swfmill, ffdec, inputs, records, pageMap});
}

async function exportUnique(record, context, stageRoot) {
  const sourceRootPath = path.join(stageRoot, 'sources', record.sourceSha256);
  const canvas = path.join(sourceRootPath, 'canvas');
  await mkdir(canvas, {recursive: true});
  const source = await readSource(context.source, record);
  const stagedSource = path.join(sourceRootPath, 'source.swf');
  await writeFile(stagedSource, source.buffer, {flag: 'wx', mode: 0o444});
  await chmod(stagedSource, 0o444);
  const staged = await stableFile(stagedSource, {projectRelative: false});
  invariant(staged.sha256 === record.sourceSha256 &&
    staged.bytes === record.sourceBytes, 'staged TS03 source drifted');
  const xmlPath = path.join(sourceRootPath, 'source.xml');
  const ffdecArgs = [...context.ffdec.prefixArgs,
    '-config', 'packJavaScripts=false', '-onerror', 'abort',
    '-timeout', '120', '-exportTimeout', '600', '-format',
    'frame:canvas,sprite:canvas,script:as', '-export',
    'frame,sprite,script,image,sound', canvas, stagedSource];
  const swfmillArgs = ['-n', 'swf2xml', stagedSource, xmlPath];
  const [ffdecResult, swfmillResult] = await Promise.all([
    runProcess(context.ffdec.command, ffdecArgs),
    runProcess(context.swfmill.command, swfmillArgs),
  ]);
  const ffdecCommand = commandReceipt(ffdecResult, context.ffdec.command,
    ffdecArgs, `${record.sourceSha256} FFDec`);
  const swfmillCommand = commandReceipt(swfmillResult,
    context.swfmill.command, swfmillArgs, `${record.sourceSha256} swfmill`);
  const [sourceAfter, stagedAfter, xml] = await Promise.all([
    readSource(context.source, record),
    stableFile(stagedSource, {projectRelative: false}),
    stableFile(xmlPath, {projectRelative: false}),
  ]);
  invariant(sourceAfter.buffer.equals(source.buffer) &&
    stagedAfter.buffer.equals(source.buffer) &&
    JSON.stringify(stagedAfter.identity) === JSON.stringify(staged.identity),
  `${record.sourceSha256}: source changed during extraction`);
  const xmlText = xml.buffer.toString('utf8');
  const target = parseRootTarget(xmlText,
    record.selectedPlacements[0].animationId);
  const frameCount = spriteFrameCount(xmlText,
    record.selectedPlacements[0].animationId, target.objectId);
  invariant(target.objectId === record.structure.mainObjectId &&
    frameCount === record.structure.mainFrameCount,
  `${record.sourceSha256}: TS03 main timeline drifted`);
  const spriteRoot = path.join(canvas, 'sprites',
    `DefineSprite_${target.objectId}`);
  const [frames, helper] = await Promise.all([
    stableFile(path.join(spriteRoot, 'frames.html'), {projectRelative: false}),
    stableFile(path.join(spriteRoot, 'canvas.js'), {projectRelative: false}),
  ]);
  const metadata = deriveMetadata(frames.buffer.toString('utf8'),
    record.selectedPlacements[0].animationId, target.objectId, frameCount);
  return Object.freeze({record, source, staged, xml, ffdecCommand,
    swfmillCommand, target, frameCount, frames, helper, metadata});
}

async function buildMember(exported, placementRecord, context, stageRoot) {
  const animationId = placementRecord.animationId;
  const catalogRecord = context.pageMap.get(animationId);
  invariant(catalogRecord?.page.viewPath === placementRecord.sourcePath &&
    catalogRecord.page.sourceSha256 === exported.record.sourceSha256,
  `${animationId}: catalog/source audit cross-binding drifted`);
  const placement = Object.freeze({animationId,
    objectId: exported.target.objectId, frameCount: exported.frameCount});
  const memberRoot = path.join(stageRoot, 'members', animationId);
  await mkdir(memberRoot, {recursive: true});
  const runtimePath = `${OUTPUT_ROOT}/members/${animationId}/canvas-renderer.js`;
  const rawBase = `${OUTPUT_ROOT}/sources/${exported.record.sourceSha256}/canvas/sprites/DefineSprite_${placement.objectId}`;
  const framesBinding = Object.freeze({path: `${rawBase}/frames.html`,
    bytes: exported.frames.bytes, sha256: exported.frames.sha256});
  const helperBinding = Object.freeze({path: `${rawBase}/canvas.js`,
    bytes: exported.helper.bytes, sha256: exported.helper.sha256});
  const spec = adapterSpec({placement, record: exported.record,
    target: exported.target, metadata: exported.metadata,
    framesBinding, helperBinding, runtimePath, inputs: context.inputs});
  const built = buildSafeRuntime({
    helperSource: exported.helper.buffer.toString('utf8'),
    framesHtml: exported.frames.buffer.toString('utf8'),
    spec: spec.value,
  });
  const runtimeBytes = Buffer.from(finalizeRuntime(built.runtime,
    spec.value, placement, spec.stageMatrix));
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
  const buttons = exported.record.behavior.buttons.map((button) =>
    Object.freeze({characterId: button.characterId,
      sourceKeyAttribute: button.sourceKeyAttribute}));
  const manifest = {schemaVersion: 1,
    artifactType: 'g678-ts03-l1-current-js-member-v1', animationId,
    source: {path: placementRecord.sourcePath,
      bytes: exported.record.sourceBytes,
      sha256: exported.record.sourceSha256,
      compilerRepresentativePath: exported.source.viewPath,
      compilerCopy: {path: `${OUTPUT_ROOT}/sources/${exported.record.sourceSha256}/source.swf`,
        bytes: exported.staged.bytes, sha256: exported.staged.sha256,
        mode: 0o444}},
    reviewedAuthority: {audit: context.inputs.audit,
      keyTermRecovery: context.inputs.recovery,
      exactScripts: exported.record.behavior.exactScripts},
    timeline: {rootFrameCount: 10, rootBeginFrame: 6,
      frameDomain: `sprite-${placement.objectId}`,
      frameCount: placement.frameCount,
      livePlaybackEndFrame: placement.frameCount,
      lastPlacedFrame: exported.metadata.lastPlacedFrame,
      rootPlacementMatrix: exported.target.matrix,
      buttons, buttonFirstFrame: exported.record.structure.buttonFirstFrame,
      explicitChildStop: exported.record.structure.explicitChildStop},
    compiler: {ffdecCommand: exported.ffdecCommand,
      swfmillCommand: exported.swfmillCommand,
      rawFrames: framesBinding, rawHelper: helperBinding,
      adapterBuilder: context.inputs.safeAdapter},
    runtime: {canvasRenderer: runtime,
      adapterSpec: {path: `${OUTPUT_ROOT}/members/${animationId}/adapter-spec.json`,
        bytes: specBytes.length, sha256: sha256(specBytes)}},
    product: {familyVisualPlaybackCalibrationPassed: false,
      typedGlossaryIntentImplemented: true,
      currentJavaScriptRegistered: false,
      productCalibrationPassed: false,
      engineeringPreviewReady: false},
    productBlockers: ['ts03-l1-browser-product-calibration-pending'],
    acceptanceEffects: ACCEPTANCE_EFFECTS};
  const manifestBytes = stableBytes(manifest);
  await writeFile(path.join(memberRoot, 'member-manifest.json'), manifestBytes,
    {flag: 'wx'});
  await freezeTree(memberRoot);
  return Object.freeze({animationId,
    page: Object.freeze({animationId,
      placementId: catalogRecord.page.placementId,
      assetId: catalogRecord.page.assetId,
      moduleCode: catalogRecord.lesson.moduleCode,
      lessonNumber: catalogRecord.lesson.lessonNumber,
      stableLessonKey: catalogRecord.lesson.stableLessonKey,
      globalPageOrdinal: catalogRecord.page.globalOrdinal,
      sectionCode: catalogRecord.page.sectionCode,
      sectionPageOrdinal: catalogRecord.page.sectionPageOrdinal,
      titleEnglish: catalogRecord.page.titleEnglish,
      sourcePath: placementRecord.sourcePath,
      sourceSha256: exported.record.sourceSha256,
      frameDomain: `sprite-${placement.objectId}`,
      frameCount: placement.frameCount,
      buttonFirstFrame: exported.record.structure.buttonFirstFrame,
      buttons, runtime}),
    manifest: Object.freeze({path: `${OUTPUT_ROOT}/members/${animationId}/member-manifest.json`,
      bytes: manifestBytes.length, sha256: sha256(manifestBytes)}),
    runtime});
}

async function build(context, stageRoot) {
  const exports = [];
  for (const record of context.records) {
    exports.push(await exportUnique(record, context, stageRoot));
  }
  await verifyToolchain(context.toolchainRun.value.toolchain.ffdec);
  const members = [];
  for (const exported of exports) {
    for (const placement of exported.record.selectedPlacements) {
      members.push(await buildMember(exported, placement, context, stageRoot));
    }
  }
  members.sort((left, right) => compareText(left.animationId,
    right.animationId));
  invariant(exports.length === 14 && members.length === 15,
    'TS03 generated source/member denominator drifted');
  const payloadInventory = await directoryInventory(stageRoot);
  const inventoryBytes = stableBytes(payloadInventory);
  await writeFile(path.join(stageRoot, 'output-inventory.json'),
    inventoryBytes, {flag: 'wx'});
  const run = {schemaVersion: 1,
    artifactType: 'g678-ts03-l1-current-js-run-v1', runId: RUN_ID,
    status: 'generated-local-only-product-calibration-pending',
    deploymentScope: 'local-only',
    inputs: context.inputs,
    sourceRoot: context.source.identity,
    toolchain: {ffdec: context.ffdec.identity,
      swfmill: context.swfmill.identity},
    generatedPlacementCount: 15,
    compiledUniqueSwfCount: 14,
    affectedLessonCount: 15,
    registryEntriesWritten: 0,
    familyVisualPlaybackCalibrationPassed: false,
    scaleOutAuthorized: false,
    productBlockers: ['ts03-l1-browser-product-calibration-pending'],
    acceptanceEffects: ACCEPTANCE_EFFECTS,
    outputInventory: {path: `${OUTPUT_ROOT}/output-inventory.json`,
      bytes: inventoryBytes.length, sha256: sha256(inventoryBytes)},
    sources: exports.map((exported) => Object.freeze({
      sourceSha256: exported.record.sourceSha256,
      sourceBytes: exported.record.sourceBytes,
      selectedAnimationIds: exported.record.selectedPlacements.map(
        (placement) => placement.animationId),
      sourceIdentity: exported.source.identity,
      stagedSource: {path: `${OUTPUT_ROOT}/sources/${exported.record.sourceSha256}/source.swf`,
        bytes: exported.staged.bytes, sha256: exported.staged.sha256},
      xml: {path: `${OUTPUT_ROOT}/sources/${exported.record.sourceSha256}/source.xml`,
        bytes: exported.xml.bytes, sha256: exported.xml.sha256},
      ffdecCommand: exported.ffdecCommand,
      swfmillCommand: exported.swfmillCommand,
    })),
    members: members.map((member) => Object.freeze({animationId: member.animationId,
      manifest: member.manifest, runtime: member.runtime}))};
  const runBytes = stableBytes(run);
  await writeFile(path.join(stageRoot, 'run-manifest.json'), runBytes,
    {flag: 'wx'});
  const runBinding = Object.freeze({path: `${OUTPUT_ROOT}/run-manifest.json`,
    bytes: runBytes.length, sha256: sha256(runBytes)});
  const tracked = new Map();
  const entries = [];
  const terms = context.recovery.value.terms;
  for (const member of members) {
    const timelinePath = `packages/demos/src/timelines/${member.animationId}.ts`;
    const modulePath = `packages/demos/src/modules/${member.animationId}.tsx`;
    const timelineBytes = Buffer.from(timelineSource(member.page));
    const moduleBytes = Buffer.from(moduleSource(member.page, terms));
    tracked.set(timelinePath, timelineBytes);
    tracked.set(modulePath, moduleBytes);
    entries.push(Object.freeze({key: member.animationId,
      module: `./modules/${member.animationId}`,
      maturity: 'private-current-js',
      complexityLane: 'interactive-understood',
      deploymentScope: 'local-only',
      adapterFamily: 'ts03-l1-glossary-source-static',
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
    artifactType: 'g678-ts03-l1-current-js-fragment-v1',
    runId: RUN_ID, compilerRun: runBinding,
    deploymentScope: 'local-only',
    reviewedAudit: context.inputs.audit,
    keyTermRecovery: context.inputs.recovery,
    predecessorFreeze: context.inputs.predecessor,
    auditedPlacementCount: 44,
    recoveredEligiblePlacementCount: 15,
    blockedPlacementCount: 29,
    generatedPlacementCount: 15,
    entries,
    currentJavaScriptRegisteredCount: 0,
    overallProductCalibrationPassed: false,
    wholeLessonEngineeringPreviewCount: 0,
    productBlockers: ['ts03-l1-browser-product-calibration-pending'],
    acceptanceEffects: ACCEPTANCE_EFFECTS};
  const fragmentBytes = stableBytes(fragment);
  tracked.set(FRAGMENT, fragmentBytes);
  return Object.freeze({members, run, runBytes, runBinding,
    fragment, fragmentBytes, tracked});
}

async function publishTracked(tracked) {
  const created = [];
  try {
    for (const [relativePath, bytes] of tracked) {
      const target = projectPath(relativePath);
      await mkdir(path.dirname(target), {recursive: true});
      await writeFile(target, bytes, {flag: 'wx'});
      const binding = await stableFile(target);
      invariant(binding.buffer.equals(bytes),
        `${relativePath} changed during publication`);
      created.push(Object.freeze({target, relativePath,
        bytes: binding.bytes, sha256: binding.sha256,
        identity: binding.identity}));
    }
  } catch (error) {
    for (const item of created.reverse()) {
      const current = await stableFile(item.target,
        {projectRelative: false}).catch(() => null);
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
  for (const [relativePath, expected] of tracked) {
    const current = await stableFile(relativePath);
    invariant(current.buffer.equals(expected),
      `${relativePath} drifted from TS03 generator`);
  }
}

async function compareRun(expectedRoot, canonicalRoot) {
  const [expected, current] = await Promise.all([
    directoryInventory(expectedRoot), directoryInventory(canonicalRoot),
  ]);
  invariant(JSON.stringify(expected) === JSON.stringify(current),
    'TS03 compiler run drifted');
  await verifyFrozenTree(canonicalRoot);
}

export async function runTs03L1CurrentJs({check = false} = {}) {
  const context = await loadContext();
  const canonical = projectPath(OUTPUT_ROOT);
  const stage = check ? `${canonical}.check-${process.pid}-${Date.now()}` :
    `${canonical}.staging-${process.pid}`;
  invariant(!await stat(stage).then(() => true, () => false),
    'TS03 generator staging path exists');
  if (!check) {
    invariant(!await stat(canonical).then(() => true, () => false),
      `${OUTPUT_ROOT} already exists`);
    for (const row of context.recovery.value.eligibility.eligible) {
      for (const relativePath of [
        `packages/demos/src/timelines/${row.animationId}.ts`,
        `packages/demos/src/modules/${row.animationId}.tsx`,
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
      fragment: {path: FRAGMENT, bytes: result.fragmentBytes.length,
        sha256: sha256(result.fragmentBytes)},
      generatedPlacementCount: 15,
      compiledUniqueSwfCount: 14,
      affectedLessonCount: 15,
      currentJavaScriptRegisteredCount: 0,
      productCalibrationPassed: false,
      scaleOutAuthorized: false,
      acceptanceEffects: ACCEPTANCE_EFFECTS});
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
    'usage: build-g678-ts03-l1-current-js.mjs [--check]');
  runTs03L1CurrentJs({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
