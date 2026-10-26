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
const RUN_ID = 'g678-alg-l09-guided-tutorial-current-js-3-v1';
const OUTPUT_ROOT = `work/g678-shared-page-factory/${RUN_ID}`;
const FRAGMENT =
  `catalog/product-bridge-calibrations/${RUN_ID}.fragment.json`;
const AUDIT = 'catalog/g678-alg-l09-residual-routing-audit-v1.json';
const KEY_TERM_RECOVERY = 'catalog/g678-ts07-l1-keyterm-recovery-v1.json';
const TI_CHOICE_AUDIT = 'catalog/g678-alg-l09-ti-choice-family-audit-v1.json';
const SIMPLE_GLOSSARY_AUDIT =
  'catalog/g678-alg-l09-simple-glossary-family-audit-v1.json';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const PREDECESSOR =
  'catalog/product-bridge-calibrations/g678-current-js-336-page-product-calibrated-registration-v1.json';
const TOOLCHAIN_RUN =
  'work/g678-shared-page-factory/g678-advanced-manual-current-js-3-v1/run-manifest.json';
const SAFE_ADAPTER = 'scripts/build-safe-ffdec-canvas-adapter.mjs';
const SOURCE_STATIC_HOST =
  'packages/demos/src/source-static-canvas-candidate.tsx';
const ANIMATION_CONTRACT = 'packages/demos/src/contract.ts';
const GUIDED_HOST =
  'packages/demos/src/private-source-static-alg-l09-guided-tutorial-candidate.tsx';
const GUIDED_BEHAVIOR =
  'packages/demos/src/g678-alg-l09-guided-tutorial.ts';
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
const SWFMILL_WARNINGS = Object.freeze({
  'shared-alg001-l09-p037': Object.freeze({bytes: 164,
    sha256: 'ffa405bec50007c1d8f1f18abb5e80166d8d847528fbbf67352d235fd30efe34'}),
  'shared-alg001-l09-p038': Object.freeze({bytes: 165,
    sha256: '9fea9d4d64a10ed7ae8bb4be981dbfb354694a24c1557277b97a47067df8776f'}),
  'shared-alg001-l09-p039': Object.freeze({bytes: 291,
    sha256: 'a417e8bbe43976de95955830cedaa374d5afdd4e2f1813e932a7e5ac65fdaea7'}),
});
const SUPPLEMENTAL_RECOVERED_TERMS = Object.freeze([
  Object.freeze({id: 'column', normalizedKey: 'column',
    sourceKeyAttribute: 'Column',
    labels: Object.freeze({en: 'Column', es: 'Columna'}),
    definitions: Object.freeze({
      en: 'The vertical section on a grid or graph.',
      es: 'Es la parte vertical de un gráfico o una cuadrícula.',
    })}),
  Object.freeze({id: 'simple-simpler-simplest',
    normalizedKey: 'simple / simpler / simplest',
    sourceKeyAttribute: 'Simple / Simpler / Simplest',
    labels: Object.freeze({en: 'Simple / Simpler / Simplest',
      es: 'Simple / Más Simple / El Más Simple'}),
    definitions: Object.freeze({
      en: 'To put something in its easiest form to understand. For example, the simplest form of 8/32 is 1/4.',
      es: 'Es poner algo en su forma más fácil de entender. Por ejemplo, la forma más simple de 8/32 es 1/4.',
    })}),
]);
const CHOICE_LAYOUT = Object.freeze([
  Object.freeze({instanceName: 'AnsBtn1', label: 'A',
    value: 'proportional relationship',
    buttonCharacterId: 167, buttonDepth: 144,
    buttonTransform: Object.freeze({scaleX: '3.438110351562500',
      scaleY: '1.154891967773438', transX: '1885', transY: '-724'}),
    textPlacements: Object.freeze([
      Object.freeze({role: 'label', value: 'A', objectId: 30, depth: 37,
        transX: '-690', transY: '-960'}),
      Object.freeze({role: 'value', value: 'proportional relationship',
        objectId: 31, depth: 38, transX: '1', transY: '-1084'}),
    ])}),
  Object.freeze({instanceName: 'AnsBtn2', label: 'B',
    value: 'non-proportional relationship',
    buttonCharacterId: 166, buttonDepth: 142,
    buttonTransform: Object.freeze({scaleX: '3.900115966796875',
      scaleY: '1.293853759765625', transX: '2277', transY: '402'}),
    textPlacements: Object.freeze([
      Object.freeze({role: 'label', value: 'B', objectId: 33, depth: 46,
        transX: '-690', transY: '163'}),
      Object.freeze({role: 'value', value: 'non-proportional relationship',
        objectId: 34, depth: 47, transX: '0', transY: '76'}),
    ])}),
]);

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
      `${name} must be absent for ALG L9 guided tutorial generation`);
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

function commandReceipt(result, command, args, label,
  expectedStderr = Object.freeze({bytes: 0,
    sha256: sha256(Buffer.alloc(0))})) {
  invariant(result.code === 0 && result.signal === null,
    `${label} failed: ${result.stderr.toString('utf8')}`);
  invariant(result.stderr.length === expectedStderr.bytes &&
    sha256(result.stderr) === expectedStderr.sha256,
    `${label} emitted stderr: ${result.stderr.toString('utf8')}`);
  return Object.freeze({command: path.basename(command),
    args: Object.freeze(args.map((argument) => path.isAbsolute(argument)
      ? `<${path.basename(argument)}>` : argument)),
    exitCode: 0,
    stdout: Object.freeze({captured: true, recorded: false,
      exclusionReason: 'tool progress contains volatile staging paths and timings'}),
    stderr: Object.freeze({bytes: result.stderr.length,
      sha256: sha256(result.stderr)})});
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

function choiceLayoutBindingLegacy(xml, animationId, objectId) {
  const sprites = [...xml.matchAll(new RegExp(
    `<DefineSprite\\s+objectID="${objectId}"\\s+frames="436">([\\s\\S]*?)` +
    '<\\/DefineSprite>', 'gu'))];
  invariant(sprites.length === 1,
    `${animationId}: choice sprite XML domain drifted`);
  const body = sprites[0][1];
  const placements = [...body.matchAll(
    /<PlaceObject2\b([^>]*)>([\s\S]*?)<\/PlaceObject2>/gu,
  )].map((match) => Object.freeze({
    index: match.index,
    attributes: attributes(match[1]),
    transform: attributes(match[2].match(/<Transform([^>]*)\/>/u)?.[1] ?? ''),
  }));
  const directFrame = (placement) =>
    [...body.slice(0, placement.index).matchAll(/<ShowFrame\/>/gu)].length + 1;
  const exactPlacement = (predicate, label, expectedFrame) => {
    const matches = placements.filter(predicate);
    invariant(matches.length === 1 && directFrame(matches[0]) === expectedFrame,
      `${animationId}: ${label} placement drifted`);
    return matches[0];
  };
  const options = CHOICE_LAYOUT.map((expected) => {
    const button = exactPlacement((placement) =>
      placement.attributes.name === expected.instanceName &&
      Number(placement.attributes.objectID) === expected.buttonCharacterId &&
      Number(placement.attributes.depth) === expected.buttonDepth &&
      placement.attributes.morph === '92' &&
      Object.entries(expected.buttonTransform).every(([key, value]) =>
        placement.transform[key] === value), `${expected.instanceName} button`,
    93);
    const textPlacements = expected.textPlacements.map((text) => {
      exactPlacement((placement) =>
        Number(placement.attributes.objectID) === text.objectId &&
        Number(placement.attributes.depth) === text.depth &&
        placement.attributes.name === undefined &&
        placement.transform.transX === text.transX &&
        placement.transform.transY === text.transY,
      `${expected.instanceName} ${text.role} text`, 86);
      return text;
    });
    return Object.freeze({instanceName: expected.instanceName,
      label: expected.label, value: expected.value,
      buttonCharacterId: expected.buttonCharacterId,
      buttonDepth: Number(button.attributes.depth),
      textPlacements: Object.freeze(textPlacements)});
  });
  invariant(placements.filter((placement) =>
    /^AnsBtn[12]$/u.test(placement.attributes.name ?? '')).length === 2,
  `${animationId}: unexpected named answer-button placement count`);
  const projection = Object.freeze({source: 'swfmill-source-xml',
    frameDomain: `sprite-${objectId}`, textPlacedFrame: 86,
    answerButtonsPlacedFrame: 93,
    correctAnswerInstanceName: 'AnsBtn2',
    correctAnswerButtonCharacterId: 166,
    options: Object.freeze(options)});
  const bytes = stableBytes(projection);
  return Object.freeze({...projection, projectionBytes: bytes.length,
    projectionSha256: sha256(bytes)});
}

function choiceLayoutBinding(
  xml,
  animationId,
  objectId,
  frameCount,
  stopFrame,
  auditedOptions,
) {
  const sprites = [...xml.matchAll(new RegExp(
    `<DefineSprite\\s+objectID="${objectId}"\\s+frames="${frameCount}">` +
    '([\\s\\S]*?)<\\/DefineSprite>', 'gu'))];
  invariant(sprites.length === 1,
    `${animationId}: TI choice sprite XML domain drifted`);
  const body = sprites[0][1];
  const placements = [...body.matchAll(
    /<PlaceObject2\b([^>]*)>([\s\S]*?)<\/PlaceObject2>/gu,
  )].map((match) => Object.freeze({
    index: match.index,
    attributes: attributes(match[1]),
    transform: attributes(match[2].match(/<Transform([^>]*)\/>/u)?.[1] ?? ''),
  }));
  const directFrame = (placement) =>
    [...body.slice(0, placement.index).matchAll(/<ShowFrame\/>/gu)].length + 1;
  const options = auditedOptions.map((expected) => {
    const buttons = placements.filter((placement) =>
      Number(placement.attributes.objectID) === expected.buttonCharacterId &&
      Number(placement.attributes.depth) === expected.buttonDepth &&
      placement.attributes.name === expected.sourceInstanceName &&
      placement.transform.transY === expected.buttonTransY &&
      directFrame(placement) === stopFrame);
    invariant(buttons.length === 1,
      `${animationId}: ${expected.id} source button placement drifted`);
    const textPlacement = (objectIdValue, role) => {
      const candidates = placements.filter((placement) =>
        Number(placement.attributes.objectID) === objectIdValue &&
        placement.attributes.name === undefined &&
        directFrame(placement) <= stopFrame);
      invariant(candidates.length > 0,
        `${animationId}: ${expected.id} ${role} text placement missing`);
      const frame = Math.max(...candidates.map(directFrame));
      const latest = candidates.filter((placement) =>
        directFrame(placement) === frame);
      invariant(latest.length === 1,
        `${animationId}: ${expected.id} ${role} text placement ambiguous`);
      return Object.freeze({role, value: role === 'label'
        ? expected.label : expected.value, objectId: objectIdValue,
      depth: Number(latest[0].attributes.depth), frame,
      transX: latest[0].transform.transX ?? '0',
      transY: latest[0].transform.transY ?? '0'});
    };
    return Object.freeze({
      id: expected.id,
      label: expected.label,
      value: expected.value,
      correct: expected.correct,
      buttonCharacterId: expected.buttonCharacterId,
      buttonDepth: expected.buttonDepth,
      sourceInstanceName: expected.sourceInstanceName,
      buttonTransY: expected.buttonTransY,
      textPlacements: Object.freeze([
        textPlacement(expected.labelTextId, 'label'),
        textPlacement(expected.valueTextId, 'value'),
      ]),
    });
  });
  const projection = Object.freeze({
    source: 'swfmill-source-xml',
    frameDomain: `sprite-${objectId}`,
    answerButtonsPlacedFrame: stopFrame,
    correctChoiceId: auditedOptions.find((option) => option.correct)?.id,
    sourceInstanceNamesMayRepeatOrDifferFromVisualOrder: true,
    options: Object.freeze(options),
  });
  const bytes = stableBytes(projection);
  return Object.freeze({...projection, projectionBytes: bytes.length,
    projectionSha256: sha256(bytes)});
}

function guidedStopBinding(
  xml,
  animationId,
  objectId,
  frameCount,
  interaction,
) {
  const sprites = [...xml.matchAll(new RegExp(
    `<DefineSprite\\s+objectID="${objectId}"\\s+frames="${frameCount}">` +
    '([\\s\\S]*?)<\\/DefineSprite>', 'gu'))];
  invariant(sprites.length === 1,
    `${animationId}: guided tutorial sprite XML domain drifted`);
  const body = sprites[0][1];
  const actionFrames = [...body.matchAll(/<DoAction>/gu)].map((match) =>
    [...body.slice(0, match.index).matchAll(/<ShowFrame\/>/gu)].length + 1);
  const stops = interaction.stops.map((stop) => Object.freeze({...stop}));
  invariant(stops.length === 6 && stops.every((stop) =>
    actionFrames.includes(stop.frame)) &&
    stops.slice(0, -1).every((stop) =>
      stop.resumeFrame === stop.frame + 1) &&
    stops.at(-1).frame === frameCount &&
    stops.at(-1).kind === 'terminal',
  `${animationId}: guided tutorial stop domain drifted`);
  const projection = Object.freeze({source: 'swfmill-source-xml',
    frameDomain: `sprite-${objectId}`,
    directDoActionFrames: Object.freeze(actionFrames),
    stops: Object.freeze(stops),
    finalQuestion: interaction.sourceText.question,
    options: interaction.options,
    correctChoiceId: interaction.correctChoiceId});
  const bytes = stableBytes(projection);
  return Object.freeze({...projection, projectionBytes: bytes.length,
    projectionSha256: sha256(bytes)});
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
    '/* Generated by scripts/build-g678-alg-l09-guided-tutorial-current-js.mjs through the hash-bound safe FFDec Canvas adapter. */',
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
    classification:
      'private-g678-alg-l09-guided-tutorial-current-js-engineering',
    title: `${placement.animationId} reviewed ALG L9 guided tutorial timeline`,
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
      root: {frameCount: record.structure.rootFrameCount,
        preloaderStopFrame: 1, beginFrame: 6,
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
        `Legacy ActionScript is not executed; ${record.behavior.interaction.stops.length} source stops, two Need More Help branches, a ${record.behavior.interaction.options.length}-choice final check, two wrong attempts, typed right-feedback, and glossary requests are maintained typed product behavior.`,
        'Shell-owned right/wrong feedback variants and narration audio plus catalog MP3 language/cue/listening semantics remain pending.',
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
    adapterFamily: 'advanced-manual-alg-l09-guided-tutorial-source-static',
    familyVisualPlaybackCalibrationPassed: false,
    currentJavaScriptRegistered: false,
    productCalibrationPassed: false,
    engineeringPreviewReady: false,
    productBlockers: [
      'alg-l09-guided-tutorial-browser-product-calibration-pending',
    ],
    strictAcceptanceEffect: 'none'};
  const config = {animationId: page.animationId,
    title: `${page.titleEnglish} — local-only ALG L9 guided tutorial Current-JS candidate`,
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
      'ALG L9 source-guided tutorial candidate awaiting browser product calibration; narration/feedback audio and acceptance gates remain independent.',
    showEngineeringDisclosure: false};
  return `import type {SourceStaticCanvasCandidateConfig} from "../source-static-canvas-candidate";\n\n` +
    `export const ${name}_SOURCE = Object.freeze(${JSON.stringify(source, null, 2)} as const);\n\n` +
    `export const ${name}_CONFIG = Object.freeze(${JSON.stringify(config, null, 2)} satisfies SourceStaticCanvasCandidateConfig);\n`;
}

function moduleSource(page, terms) {
  const name = constantName(page.animationId);
  const groupedButtons = new Map();
  for (const button of page.buttons) {
    const key = button.sourceKeyAttribute.toLocaleLowerCase('en-US');
    const prior = groupedButtons.get(key);
    if (prior) prior.push(button.characterId);
    else groupedButtons.set(key, [button.characterId]);
  }
  const glossaryTerms = [...groupedButtons].map(([normalized, characterIds]) => {
    const term = terms.find((candidate) =>
      candidate.normalizedKey === normalized);
    invariant(term, `${page.animationId}: recovered glossary term missing`);
    const firstButton = page.buttons.find((button) =>
      button.sourceKeyAttribute.toLocaleLowerCase('en-US') === normalized);
    return {id: term.id,
      sourceKeyAttribute: firstButton.sourceKeyAttribute,
      sourceCharacterIds: characterIds.sort((left, right) => left - right),
      firstFrame: 1,
      labels: term.labels};
  }).sort((left, right) => left.id.localeCompare(right.id));
  const spanishHelp = {
    'shared-alg001-l09-p037': [
      'Datos dados: número de pares de calcetines y número de pares de zapatos. Información necesaria: ¿cuántos calcetines por zapatos?',
      'En la razón calcetines : zapatos, los calcetines van primero. Sustituye las palabras por 18:4 y simplifica a 9:2.',
    ],
    'shared-alg001-l09-p038': [
      'Dato dado: una proporción. Información necesaria: el valor de M.',
      'Multiplica ambas razones por M, multiplica ambas cantidades por 5 y divide entre el coeficiente de M.',
    ],
    'shared-alg001-l09-p039': [
      'Dato dado: G = 2P + 10. Información necesaria: si la ecuación representa una relación proporcional.',
      'Haz una tabla de valores, compara las razones y observa que no todas son iguales; la relación no es proporcional.',
    ],
  }[page.animationId];
  invariant(spanishHelp?.length === 2,
    `${page.animationId}: Spanish help copy is missing`);
  const behavior = {animationId: page.animationId,
    source: {path: page.sourcePath, bytes: page.sourceBytes,
      sha256: page.sourceSha256},
    frameDomain: page.frameDomain, frameCount: page.frameCount,
    stops: page.guidedBehavior.stops,
    finalQuestion: page.guidedBehavior.sourceText.question,
    options: page.guidedBehavior.options.map((option) => ({
      id: option.id, label: option.label, value: option.value,
      correct: option.correct,
    })),
    correctChoiceId: page.guidedBehavior.correctChoiceId,
    maximumWrongAttempts: 2,
    sourceFeedbackDomainCount: 8};
  const helpPrompts = page.guidedBehavior.helpPrompts.map((prompt, index) => ({
    stopId: `help-${index + 1}`,
    text: {en: prompt.text, es: spanishHelp[index]},
  }));
  return `"use client";\n\n` +
    `import {createPrivateSourceStaticAlgL09GuidedTutorialCandidate} from "../private-source-static-alg-l09-guided-tutorial-candidate";\n` +
    `import type {AlgL09GuidedTutorialBehavior} from "../g678-alg-l09-guided-tutorial";\n` +
    `import {${name}_CONFIG, ${name}_SOURCE} from "../timelines/${page.animationId}";\n\n` +
    `export const ${name}_BEHAVIOR = Object.freeze(${JSON.stringify(behavior, null, 2)} satisfies AlgL09GuidedTutorialBehavior);\n\n` +
    `export const ${name}_GLOSSARY_TERMS = Object.freeze(${JSON.stringify(glossaryTerms, null, 2)} as const);\n\n` +
    `export const ${name}_HELP_PROMPTS = Object.freeze(${JSON.stringify(helpPrompts, null, 2)} as const);\n\n` +
    `const candidate = createPrivateSourceStaticAlgL09GuidedTutorialCandidate(${name}_CONFIG, Object.freeze({\n` +
    `  calibrationId: "g678-alg-l09-guided-tutorial-product-calibration-v1",\n` +
    `  companionSurfaceId: "${page.animationId}-guided-tutorial",\n` +
    `  behavior: ${name}_BEHAVIOR,\n` +
    `  glossaryTerms: ${name}_GLOSSARY_TERMS,\n` +
    `  helpPrompts: ${name}_HELP_PROMPTS,\n` +
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
      `ALG L9 guided tutorial frozen directory drifted: ${current}`);
    for (const entry of await readdir(current, {withFileTypes: true})) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile()) {
        const file = await stableFile(absolute, {projectRelative: false});
        invariant(file.identity.mode === 0o444 && file.identity.nlink === 1,
      `ALG L9 guided tutorial frozen file drifted: ${absolute}`);
      } else invariant(false,
        `ALG L9 guided tutorial frozen tree special entry: ${absolute}`);
    }
  }
  await walk(root);
}

async function loadContext() {
  const [audit, recovery, tiChoiceAudit, simpleGlossaryAudit, catalog,
    predecessor, toolchainRun, safeAdapter, animationContract,
    sourceStaticHost, guidedHost, guidedBehavior, generator, source, swfmill] =
    await Promise.all([
      stableFile(AUDIT, {json: true}),
      stableFile(KEY_TERM_RECOVERY, {json: true}),
      stableFile(TI_CHOICE_AUDIT, {json: true}),
      stableFile(SIMPLE_GLOSSARY_AUDIT, {json: true}),
      stableFile(CATALOG, {json: true}),
      stableFile(PREDECESSOR, {json: true}),
      stableFile(TOOLCHAIN_RUN, {json: true}),
      stableFile(SAFE_ADAPTER), stableFile(ANIMATION_CONTRACT),
      stableFile(SOURCE_STATIC_HOST),
      stableFile(GUIDED_HOST), stableFile(GUIDED_BEHAVIOR),
      stableFile(portable(path.relative(ROOT, SCRIPT_PATH))),
      sourceRoot(), verifySwfmill(),
    ]);
  invariant(audit.value.artifactType ===
      'g678-alg-l09-residual-routing-audit-v1' &&
    audit.value.status ===
      'exact-6-source-script-routed-no-registration' &&
    audit.value.auditedPlacementCount === 6 &&
    audit.value.registrationCandidatePlacementCount === 0 &&
    audit.value.members?.length === 6 &&
    audit.value.members.filter((member) => member.lane ===
      'advanced-manual-guided-tutorial-quiz-state-machine').length === 3 &&
    audit.value.productCalibrationPassed === false &&
    Object.values(audit.value.acceptanceEffects).every((value) =>
      value === false),
  'ALG L9 residual routing audit authority drifted');
  invariant(recovery.value.artifactType ===
      'g678-ts07-l1-keyterm-recovery-v1' &&
    recovery.value.terms?.length === 77 &&
    recovery.value.productCalibrationPassed === false,
  'G678 key-term recovery authority drifted');
  invariant(tiChoiceAudit.value.artifactType ===
      'g678-alg-l09-ti-choice-family-audit-v1' &&
    tiChoiceAudit.value.terms?.length === 22 &&
    simpleGlossaryAudit.value.artifactType ===
      'g678-alg-l09-simple-glossary-family-audit-v1' &&
    simpleGlossaryAudit.value.terms?.length === 18,
  'ALG L9 glossary authority drifted');
  invariant(predecessor.value.selectedPages?.length === 336 &&
    predecessor.value.registrationCandidatePlacementCount === 336 &&
    predecessor.value.deploymentScope === 'local-only',
  '336-page predecessor freeze drifted');
  const guidedMembers = audit.value.members.filter((member) => member.lane ===
    'advanced-manual-guided-tutorial-quiz-state-machine');
  const eligibleIds = new Set(guidedMembers.map((row) => row.animationId));
  const existing = new Set(predecessor.value.selectedPages.map((page) =>
    page.animationId));
  invariant(eligibleIds.size === 3 &&
    [...eligibleIds].every((id) => !existing.has(id)),
  'ALG L9 guided tutorial eligible set overlaps predecessor');
  const stopIds = ['step-1', 'step-2', 'help-1', 'help-2', 'quiz',
    'terminal'];
  const records = guidedMembers.map((member) => {
    const placement = Object.freeze({
      animationId: member.animationId,
      stableLessonKey: member.stableLessonKey,
      moduleCode: member.moduleCode,
      lessonNumber: member.lessonNumber,
      sourcePath: member.source.path,
    });
    const stops = member.interactiveStopFrames.map((frame, index) =>
      Object.freeze({id: stopIds[index], frame,
        resumeFrame: index === 5 ? null : frame + 1,
        kind: index < 2 ? 'continue' : index < 4 ? 'help-or-continue' :
          index === 4 ? 'quiz' : 'terminal'}));
    const interaction = Object.freeze({
      stops: Object.freeze(stops),
      stopFrame: member.semanticEvidence.finalQuizStopFrame,
      resumeFrame: member.semanticEvidence.resumeFrame,
      options: Object.freeze(member.semanticEvidence.options),
      correctChoiceId: member.semanticEvidence.correctChoiceId,
      sourceText: Object.freeze({question:
        member.semanticEvidence.question}),
      helpPrompts: Object.freeze(member.semanticEvidence.helpPrompts),
      maximumWrongAttempts: 2,
      sourceFeedbackDomainCount: 8,
      sourceTerminalStopPresent: true,
    });
    return Object.freeze({
      animationId: member.animationId,
      stableLessonKey: member.stableLessonKey,
      moduleCode: member.moduleCode,
      lessonNumber: member.lessonNumber,
      source: member.source,
      sourceSha256: member.source.sha256,
      sourceBytes: member.source.bytes,
      structure: Object.freeze({rootFrameCount: member.runtime.rootFrameCount,
        mainObjectId: Number(member.runtime.mainFrameDomain.slice(7)),
        mainFrameCount: member.runtime.mainFrameCount,
        buttonFirstFrame: 1,
        buttonFirstFrames:
          member.semanticEvidence.glossaryButtons.map(() => 1),
        explicitChildStop: true,
        interactiveStopFrame: member.semanticEvidence.finalQuizStopFrame,
        resumeFrame: member.semanticEvidence.resumeFrame}),
      behavior: Object.freeze({
        buttons: Object.freeze(member.semanticEvidence.glossaryButtons.map(
          (button) => Object.freeze({...button, placements: Object.freeze([])}))),
        exactScripts: member.diagnosticEvidence.scripts,
        exactText: member.diagnosticEvidence.texts,
        interaction,
      }),
      placements: Object.freeze([placement]),
      selectedPlacements: Object.freeze([placement]),
    });
  });
  invariant(records.reduce((sum, record) =>
    sum + record.selectedPlacements.length, 0) === 3 &&
    records.length === 3,
  'ALG L9 guided tutorial selected source/member denominator drifted');
  const pageMap = new Map(catalog.value.lessons.flatMap((lesson) =>
    lesson.pages.map((page) => [page.animationId, {lesson, page}])));
  const ffdec = await verifyToolchain(toolchainRun.value.toolchain.ffdec);
  const inputs = Object.freeze({audit: descriptor(audit),
    recovery: descriptor(recovery), catalog: descriptor(catalog),
    tiChoiceAudit: descriptor(tiChoiceAudit),
    simpleGlossaryAudit: descriptor(simpleGlossaryAudit),
    predecessor: descriptor(predecessor), toolchainRun: descriptor(toolchainRun),
    safeAdapter: descriptor(safeAdapter),
    animationContract: descriptor(animationContract),
    sourceStaticHost: descriptor(sourceStaticHost),
    guidedHost: descriptor(guidedHost),
    guidedBehavior: descriptor(guidedBehavior),
    generator: descriptor(generator)});
  return Object.freeze({audit, recovery, tiChoiceAudit, simpleGlossaryAudit,
    catalog, predecessor, toolchainRun,
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
    staged.bytes === record.sourceBytes,
  'staged ALG L9 guided tutorial source drifted');
  const xmlPath = path.join(sourceRootPath, 'source.xml');
  const ffdecArgs = [...context.ffdec.prefixArgs,
    '-config', 'packJavaScripts=false', '-onerror', 'abort',
    '-timeout', '120', '-exportTimeout', '600', '-format',
    'frame:canvas,sprite:canvas,script:as', '-export',
    'frame,sprite,script,image,sound', canvas, stagedSource];
  const swfmillArgs = ['-n', 'swf2xml', stagedSource, xmlPath];
  const ffdecResult = await runProcess(context.ffdec.command, ffdecArgs);
  const swfmillResult = await runProcess(
    context.swfmill.command, swfmillArgs);
  const ffdecCommand = commandReceipt(ffdecResult, context.ffdec.command,
    ffdecArgs, `${record.sourceSha256} FFDec`);
  const expectedWarning =
    SWFMILL_WARNINGS[record.selectedPlacements[0].animationId];
  invariant(expectedWarning,
    `${record.sourceSha256}: reviewed swfmill warning binding missing`);
  const swfmillCommand = commandReceipt(swfmillResult,
    context.swfmill.command, swfmillArgs, `${record.sourceSha256} swfmill`,
    expectedWarning);
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
  `${record.sourceSha256}: ALG L9 guided tutorial main timeline drifted`);
  const guidedLayout = guidedStopBinding(xmlText,
    record.selectedPlacements[0].animationId, target.objectId, frameCount,
    record.behavior.interaction);
  const spriteRoot = path.join(canvas, 'sprites',
    `DefineSprite_${target.objectId}`);
  const [frames, helper] = await Promise.all([
    stableFile(path.join(spriteRoot, 'frames.html'), {projectRelative: false}),
    stableFile(path.join(spriteRoot, 'canvas.js'), {projectRelative: false}),
  ]);
  const metadata = deriveMetadata(frames.buffer.toString('utf8'),
    record.selectedPlacements[0].animationId, target.objectId, frameCount);
  return Object.freeze({record, source, staged, xml, ffdecCommand,
    swfmillCommand, target, frameCount, guidedLayout, frames, helper, metadata});
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
      sourceKeyAttribute: button.sourceKeyAttribute,
      firstFrame: 1,
      sourcePlacements: button.placements}));
  const manifest = {schemaVersion: 1,
    artifactType: 'g678-alg-l09-guided-tutorial-current-js-member-v1',
    animationId,
    source: {path: placementRecord.sourcePath,
      bytes: exported.record.sourceBytes,
      sha256: exported.record.sourceSha256,
      compilerRepresentativePath: exported.source.viewPath,
      compilerCopy: {path: `${OUTPUT_ROOT}/sources/${exported.record.sourceSha256}/source.swf`,
        bytes: exported.staged.bytes, sha256: exported.staged.sha256,
        mode: 0o444}},
    reviewedAuthority: {audit: context.inputs.audit,
      keyTermRecovery: context.inputs.recovery,
      exactScripts: exported.record.behavior.exactScripts,
      exactText: exported.record.behavior.exactText,
      sourceGuidedStopBinding: exported.guidedLayout,
      maintainedBehavior: context.inputs.guidedBehavior,
      maintainedHostAdapter: context.inputs.guidedHost},
    timeline: {rootFrameCount: exported.record.structure.rootFrameCount,
      rootBeginFrame: 6,
      frameDomain: `sprite-${placement.objectId}`,
      frameCount: placement.frameCount,
      livePlaybackEndFrame: placement.frameCount,
      lastPlacedFrame: exported.metadata.lastPlacedFrame,
      rootPlacementMatrix: exported.target.matrix,
      buttons,
      buttonFirstFrame: exported.record.structure.buttonFirstFrame,
      buttonFirstFrames: exported.record.structure.buttonFirstFrames,
      explicitChildStop: exported.record.structure.explicitChildStop,
      interactiveStops: exported.record.behavior.interaction.stops
        .filter((stop) => stop.kind !== 'terminal')
        .map((stop) => Object.freeze({id: `${animationId}-${stop.id}`,
          frameDomain: `sprite-${placement.objectId}`,
          stopFrame: stop.frame, resumeFrame: stop.resumeFrame,
          resolution: stop.kind === 'quiz'
            ? 'explicit-source-feedback-finished'
            : 'explicit-source-control-finished',
          completionDisposition: 'blocked-while-unresolved'}))},
    compiler: {ffdecCommand: exported.ffdecCommand,
      swfmillCommand: exported.swfmillCommand,
      rawFrames: framesBinding, rawHelper: helperBinding,
      adapterBuilder: context.inputs.safeAdapter},
    runtime: {canvasRenderer: runtime,
      adapterSpec: {path: `${OUTPUT_ROOT}/members/${animationId}/adapter-spec.json`,
        bytes: specBytes.length, sha256: sha256(specBytes)}},
    product: {familyVisualPlaybackCalibrationPassed: false,
      sourceGuidedStopsBound: true,
      sourceNeedMoreHelpBranchesBound: true,
      sourceFinalChoiceQuizBound: true,
      accessiblePointerAndKeyboardInteractionImplemented: true,
      choiceFeedbackAudioAccepted: false,
      typedGlossaryIntentImplemented: buttons.length > 0,
      currentJavaScriptRegistered: false,
      productCalibrationPassed: false,
      engineeringPreviewReady: false},
    productBlockers: [
      'alg-l09-guided-tutorial-browser-product-calibration-pending',
      'choice-feedback-shell-variants-and-audio-acceptance-pending',
    ],
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
      sourceBytes: exported.record.sourceBytes,
      sourceSha256: exported.record.sourceSha256,
      rootFrameCount: exported.record.structure.rootFrameCount,
      frameDomain: `sprite-${placement.objectId}`,
      frameCount: placement.frameCount,
      interactiveStopFrame: exported.record.behavior.interaction.stopFrame,
      resumeFrame: exported.record.behavior.interaction.resumeFrame,
      buttonFirstFrame: exported.record.structure.buttonFirstFrame,
      buttons,
      guidedBehavior: exported.record.behavior.interaction,
      runtime}),
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
  invariant(exports.length === 3 && members.length === 3,
    'ALG L9 guided tutorial generated source/member denominator drifted');
  const payloadInventory = await directoryInventory(stageRoot);
  const inventoryBytes = stableBytes(payloadInventory);
  await writeFile(path.join(stageRoot, 'output-inventory.json'),
    inventoryBytes, {flag: 'wx'});
  const run = {schemaVersion: 1,
    artifactType: 'g678-alg-l09-guided-tutorial-current-js-run-v1',
    runId: RUN_ID,
    status: 'generated-local-only-product-calibration-pending',
    deploymentScope: 'local-only',
    inputs: context.inputs,
    sourceRoot: context.source.identity,
    toolchain: {ffdec: context.ffdec.identity,
      swfmill: context.swfmill.identity},
    generatedPlacementCount: 3,
    compiledUniqueSwfCount: 3,
    affectedLessonCount: 1,
    registryEntriesWritten: 0,
    familyVisualPlaybackCalibrationPassed: false,
    scaleOutAuthorized: false,
    productBlockers: [
      'alg-l09-guided-tutorial-browser-product-calibration-pending',
      'choice-feedback-shell-variants-and-audio-acceptance-pending',
    ],
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
  const terms = [...context.recovery.value.terms,
    ...context.tiChoiceAudit.value.terms,
    ...context.simpleGlossaryAudit.value.terms,
    ...SUPPLEMENTAL_RECOVERED_TERMS];
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
      complexityLane: 'behavior-heavy',
      deploymentScope: 'local-only',
      adapterFamily:
        'advanced-manual-alg-l09-guided-tutorial-source-static',
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
    artifactType: 'g678-alg-l09-guided-tutorial-current-js-fragment-v1',
    runId: RUN_ID, compilerRun: runBinding,
    deploymentScope: 'local-only',
    reviewedAudit: context.inputs.audit,
    keyTermRecovery: context.inputs.recovery,
    predecessorFreeze: context.inputs.predecessor,
    auditedPlacementCount: 3,
    recoveredEligiblePlacementCount: 3,
    blockedPlacementCount: 0,
    generatedPlacementCount: 3,
    entries,
    currentJavaScriptRegisteredCount: 0,
    overallProductCalibrationPassed: false,
    wholeLessonEngineeringPreviewCount: 0,
    productBlockers: [
      'alg-l09-guided-tutorial-browser-product-calibration-pending',
      'choice-feedback-shell-variants-and-audio-acceptance-pending',
    ],
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
      `${relativePath} drifted from ALG L9 guided tutorial generator`);
  }
}

async function compareRun(expectedRoot, canonicalRoot) {
  const [expected, current] = await Promise.all([
    directoryInventory(expectedRoot), directoryInventory(canonicalRoot),
  ]);
  invariant(JSON.stringify(expected) === JSON.stringify(current),
    'ALG L9 guided tutorial compiler run drifted');
  await verifyFrozenTree(canonicalRoot);
}

export async function runAlgL09GuidedTutorialCurrentJs(
  {check = false} = {},
) {
  const context = await loadContext();
  const canonical = projectPath(OUTPUT_ROOT);
  const stage = check ? `${canonical}.check-${process.pid}-${Date.now()}` :
    `${canonical}.staging-${process.pid}`;
  invariant(!await stat(stage).then(() => true, () => false),
    'ALG L9 guided tutorial generator staging path exists');
  if (!check) {
    invariant(!await stat(canonical).then(() => true, () => false),
      `${OUTPUT_ROOT} already exists`);
    for (const row of context.records) {
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
      generatedPlacementCount: 3,
      compiledUniqueSwfCount: 3,
      affectedLessonCount: 1,
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
    'usage: build-g678-alg-l09-guided-tutorial-current-js.mjs [--check]');
  runAlgL09GuidedTutorialCurrentJs({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
