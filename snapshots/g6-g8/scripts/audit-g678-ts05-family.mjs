#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {constants as fsConstants} from 'node:fs';
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  unlink,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {parseSwfSourceFacts} from './build-g4-l3-machine-source-audits.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SOURCE_ENV = 'HELP_MATH_G678_SOURCE_ROOT';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const TOOLCHAIN_RUN =
  'work/g678-shared-page-factory/g678-advanced-manual-current-js-3-v1/run-manifest.json';
const OUTPUT = 'catalog/g678-ts05-family-audit-v1.json';
const RUN_ROOT = 'work/g678-shared-page-factory/g678-ts05-family-audit-v1';
const REVIEWED_PLACEMENT_SET_SHA256 =
  'b69e3b813bd1db9b28cd98295ccf904abc473f32c98b7cb899e48a11dc58602f';
const EXPLICIT_CHILD_STOP_SOURCE_SHA256 =
  '8d9d70a69611927caed07206c55315b38ebc74f6d16fb00270dfb5ae76af0c94';
const HOST_REFERENCE = Object.freeze({
  relativePath:
    'G6-G8-shared/GEO001/_alternate/HelpProgram/Outside/LocalUser/devry/L1/index.swf',
  bytes: 124644,
  sha256: 'bff072979e18d8aaea6f2bea31a84204d4263b5ff58761d3ed8af6008604b39e',
  scriptFileCount: 547,
  scriptBytes: 221077,
  scriptChecksumSetSha256:
    '41263e398eca6a8576e76fdf7de79e622cfbacfdace73c4e6191df3a53ff6e43',
  rootHostScript: Object.freeze({
    path: 'frame_35/DoAction.as',
    bytes: 118058,
    sha256: '2e4e79cc5af51c9199912f527b08df10fa2a0815ac09b9d1b5140f95fb897f6d',
  }),
  keyTermComponentScript: Object.freeze({
    path: 'DefineSprite_653/frame_1/DoAction.as',
    bytes: 3348,
    sha256: '5459e1edbf153cf43421fa4bd9ac1c1eae0dce7aec445e659cce1ba1b96c0645',
  }),
});
const CRITICAL_ENVIRONMENT = Object.freeze([
  'FFDEC_JARFILENAME',
  'FFDEC_MEMORY',
  'FFDEC_STACK_SIZE',
  'JAVA_TOOL_OPTIONS',
  'JDK_JAVA_OPTIONS',
  '_JAVA_OPTIONS',
  'CLASSPATH',
]);
const FALSE_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false,
  behaviorAccepted: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});
const KEY_SEQUENCES = Object.freeze([
  Object.freeze(['equation', 'Pattern', 'Simple / Simpler / Simplest',
    'Table', 'strategies']),
  Object.freeze(['strategies', 'equation', 'Pattern',
    'Simple / Simpler / Simplest', 'Table']),
  Object.freeze(['Strategies', 'Equation', 'Pattern',
    'Simple / Simpler / Simplest', 'Table']),
  Object.freeze(['strategies', 'equation', 'Pattern',
    'Simple / Simpler / Simplest', 'table', 'equation', 'Pattern', 'table',
    'strategies', 'Show']),
  Object.freeze(['strategies', 'equation', 'Pattern',
    'Simple / Simpler / Simplest', 'table', 'Show', 'Show']),
  Object.freeze(['Strategies', 'equation', 'Pattern',
    'Simple / Simpler / Simplest', 'table', 'Show', 'Show']),
  Object.freeze(['Strategies', 'Equation', 'Pattern',
    'Simple / Simpler / Simplest', 'Table', 'Show', 'Show']),
  Object.freeze(['strategies', 'equation', 'Pattern',
    'Simple / Simpler / Simplest', 'Table', 'strategies']),
  Object.freeze(['strategies', 'Equation', 'Pattern',
    'Simple / Simpler / Simplest', 'Table', 'Strategies']),
]);
const ROOT_PRELOADER =
  '_level0.InternalPreloader.gotoAndPlay("jump_check");\r\n';
const ROOT_PRELOADER_AND_STOP = `${ROOT_PRELOADER}stop();\r\n`;
const STOP = 'stop();\r\n';
const FFDEC_OPERATION_ARGS = Object.freeze([
  '-config',
  'packJavaScripts=false',
  '-onerror',
  'abort',
  '-timeout',
  '120',
  '-exportTimeout',
  '600',
  '-format',
  'script:as',
  '-export',
  'script',
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

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function projectPath(relativePath) {
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes the project root`);
  return absolute;
}

function descriptor(binding) {
  return Object.freeze({path: binding.path, bytes: binding.bytes,
    sha256: binding.sha256});
}

export function stableFfdecCommandReceipt({code, signal, stdout, stderr}) {
  invariant(code === 0 && signal === null,
    `FFDec script export failed: ${stderr.toString('utf8')}`);
  invariant(stderr.length === 0,
    `FFDec script export emitted stderr: ${stderr.toString('utf8')}`);
  void stdout;
  return Object.freeze({
    exitCode: code,
    stdout: Object.freeze({
      captured: true,
      recorded: false,
      exclusionReason:
        'FFDec progress contains volatile staging paths, parallel completion order, and timings; exported scripts are hash-bound below.',
    }),
    stderr: Object.freeze({bytes: stderr.length, sha256: sha256(stderr)}),
  });
}

async function stableFile(target, {json = false, absolute = false} = {}) {
  const resolvedTarget = absolute ? path.resolve(target) : projectPath(target);
  const [before, canonical] = await Promise.all([
    lstat(resolvedTarget, {bigint: true}),
    realpath(resolvedTarget),
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
  return Object.freeze({
    path: absolute ? resolvedTarget : target,
    bytes: buffer.length,
    sha256: sha256(buffer),
    buffer,
    ...(json ? {value: JSON.parse(buffer)} : {}),
  });
}

async function sourceRoot() {
  const supplied = process.env[SOURCE_ENV];
  invariant(typeof supplied === 'string' && supplied.length > 0,
    `${SOURCE_ENV} is required`);
  const root = path.resolve(supplied);
  const [canonical, metadata] = await Promise.all([
    realpath(root),
    lstat(root, {bigint: true}),
  ]);
  invariant(canonical === root && metadata.isDirectory() &&
    !metadata.isSymbolicLink() && (metadata.mode & 0o222n) === 0n,
  `${SOURCE_ENV} must be a canonical read-only directory`);
  const shared = path.join(root, 'G6-G8-shared');
  const [sharedCanonical, sharedMetadata] = await Promise.all([
    realpath(shared),
    lstat(shared, {bigint: true}),
  ]);
  invariant(sharedCanonical === shared && sharedMetadata.isDirectory() &&
    !sharedMetadata.isSymbolicLink() &&
    (sharedMetadata.mode & 0o222n) === 0n,
  'G6-G8-shared must be a canonical read-only directory');
  return Object.freeze({
    root,
    shared,
    identity: Object.freeze({
      realPathSha256: sha256(root),
      device: String(metadata.dev),
      inode: String(metadata.ino),
      mode: Number(metadata.mode & 0o777n),
      sharedDevice: String(sharedMetadata.dev),
      sharedInode: String(sharedMetadata.ino),
      sharedMode: Number(sharedMetadata.mode & 0o777n),
    }),
  });
}

async function verifyReadOnlyDirectoryChain(anchor, targetParent) {
  const relative = path.relative(anchor, targetParent);
  invariant(relative === '' || (!relative.startsWith(`..${path.sep}`) &&
    relative !== '..' && !path.isAbsolute(relative)),
  `${targetParent} escapes ${anchor}`);
  let cursor = anchor;
  for (const component of relative === '' ? [] : relative.split(path.sep)) {
    cursor = path.join(cursor, component);
    const [metadata, canonical] = await Promise.all([
      lstat(cursor, {bigint: true}),
      realpath(cursor),
    ]);
    invariant(canonical === cursor && metadata.isDirectory() &&
      !metadata.isSymbolicLink() && (metadata.mode & 0o222n) === 0n,
    `${cursor} must be a canonical read-only source directory`);
  }
}

async function readSourceAsset(source, relativePath, expected) {
  const components = relativePath.split('/');
  invariant(components.length > 1 && components.every((component) =>
    component.length > 0 && component !== '.' && component !== '..'),
  `noncanonical source path: ${relativePath}`);
  const target = path.join(source.root, ...components);
  invariant(target.startsWith(`${source.shared}${path.sep}`),
    `${relativePath} escapes the reviewed shared root`);
  await verifyReadOnlyDirectoryChain(source.shared, path.dirname(target));
  const [canonical, before] = await Promise.all([
    realpath(target),
    lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (before.mode & 0o222n) === 0n,
  `${relativePath} must be a canonical read-only source`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink &&
    buffer.length === expected.bytes && sha256(buffer) === expected.sha256,
  `${relativePath} source identity drifted`);
  return Object.freeze({
    path: relativePath,
    bytes: buffer.length,
    sha256: expected.sha256,
    mode: Number(before.mode & 0o777n),
    nlink: Number(before.nlink),
    buffer,
  });
}

async function verifyToolchain(toolchainRun) {
  for (const key of CRITICAL_ENVIRONMENT) {
    invariant(process.env[key] === undefined,
      `${key} must be unset for the TS05 audit`);
  }
  const ffdec = toolchainRun.value.toolchain?.ffdec;
  invariant(ffdec?.execution === 'direct-bound-java' &&
    ffdec.invocation?.prefixArgs?.at(-1) === '<BOUND_FFDEC_JAR>' &&
    ffdec.jarManifest?.classPath?.length === 37,
  'reviewed FFDec direct-Java invocation is unavailable');
  const bindings = [ffdec.launcher, ffdec.jar, ffdec.java,
    ...ffdec.jarManifest.classPath];
  for (const expected of bindings) {
    const current = await stableFile(expected.realPath, {absolute: true});
    invariant(current.bytes === expected.bytes &&
      current.sha256 === expected.sha256,
    `FFDec toolchain drifted: ${expected.realPath}`);
  }
  const recordedPrefixArgs = [...ffdec.invocation.prefixArgs];
  const jarIndex = recordedPrefixArgs.indexOf('-jar');
  invariant(jarIndex >= 0, 'FFDec direct-Java invocation lacks -jar');
  recordedPrefixArgs.splice(jarIndex, 0, '-Djava.awt.headless=true');
  return Object.freeze({
    command: ffdec.java.realPath,
    jar: ffdec.jar.realPath,
    prefixArgs: Object.freeze(recordedPrefixArgs.map((argument) =>
      argument === '<BOUND_FFDEC_JAR>' ? ffdec.jar.realPath : argument)),
    receipt: Object.freeze({
      execution: ffdec.execution,
      java: Object.freeze({bytes: ffdec.java.bytes,
        sha256: ffdec.java.sha256}),
      jar: Object.freeze({bytes: ffdec.jar.bytes,
        sha256: ffdec.jar.sha256}),
      classPathFileCount: ffdec.jarManifest.classPath.length,
      classPathChecksumSetSha256:
        ffdec.jarManifest.classPathChecksumSetSha256,
      criticalEnvironmentVariablesRequiredUnset: CRITICAL_ENVIRONMENT,
      invocation: Object.freeze({
        command: '<BOUND_JAVA_EXECUTABLE>',
        prefixArgs: Object.freeze(recordedPrefixArgs),
        operationArgs: FFDEC_OPERATION_ARGS,
      }),
    }),
  });
}

async function runCommand(command, args, options) {
  const child = spawn(command, args,
    {...options, stdio: ['ignore', 'pipe', 'pipe']});
  const stdout = [];
  const stderr = [];
  child.stdout.on('data', (chunk) => stdout.push(chunk));
  child.stderr.on('data', (chunk) => stderr.push(chunk));
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({code, signal}));
  });
  return stableFfdecCommandReceipt({
    code: result.code,
    signal: result.signal,
    stdout: Buffer.concat(stdout),
    stderr: Buffer.concat(stderr),
  });
}

async function walk(root, current = root, rows = []) {
  const entries = await readdir(current, {withFileTypes: true});
  entries.sort((left, right) => compareText(left.name, right.name));
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    invariant(!entry.isSymbolicLink(), `generated tree contains symlink: ${absolute}`);
    if (entry.isDirectory()) await walk(root, absolute, rows);
    else if (entry.isFile()) rows.push(absolute);
    else invariant(false, `generated tree contains special file: ${absolute}`);
  }
  return rows;
}

async function exportedScripts(scriptRoot) {
  const rows = [];
  for (const absolute of await walk(scriptRoot)) {
    const binding = await stableFile(absolute, {absolute: true});
    rows.push(Object.freeze({
      path: path.relative(scriptRoot, absolute).split(path.sep).join('/'),
      bytes: binding.bytes,
      sha256: binding.sha256,
      text: binding.buffer.toString('utf8'),
    }));
  }
  return rows.sort((left, right) => compareText(left.path, right.path));
}

function inventoryProjection(rows) {
  const projection = rows.map((row) =>
    `${row.path}|${row.bytes}|${row.sha256}`).join('\n') + '\n';
  return Object.freeze({
    files: Object.freeze(rows.map(({text, ...row}) => Object.freeze(row))),
    fileCount: rows.length,
    totalBytes: rows.reduce((sum, row) => sum + row.bytes, 0),
    checksumSetSha256: sha256(projection),
  });
}

function parseGlossaryHandler(text) {
  const match = text.match(/^on\(release\)\{\r\n   _global\.KeyAttribute = "([^"]+)";\r\n   _root\.DoHyperLinks\(\);\r\n   _root\.animation_mc\.animation\.stop\(\);\r\n\}\r\n$/u);
  return match?.[1] ?? null;
}

export function classifyTs05Scripts(scriptFiles, structure, sourceSha256) {
  invariant(Array.isArray(scriptFiles), 'TS05 script files must be an array');
  const expectedSpecial = sourceSha256 === EXPLICIT_CHILD_STOP_SOURCE_SHA256;
  const expectedButtonCount = structure.buttonCharacterIds.length;
  invariant(scriptFiles.length === expectedButtonCount + 2 +
    (expectedSpecial ? 1 : 0),
    `${sourceSha256} TS05 exact script count drifted`);
  const buttonRows = scriptFiles.filter((row) =>
    /^DefineButton2_\d+\/BUTTONCONDACTION on\(release\)\.as$/u.test(row.path));
  invariant(buttonRows.length === expectedButtonCount,
    `${sourceSha256} has an unexpected release-handler count`);
  const parsedButtons = buttonRows.map((row) => Object.freeze({
    characterId: Number(row.path.match(/^DefineButton2_(\d+)\//u)[1]),
    sourceKeyAttribute: parseGlossaryHandler(row.text),
    script: Object.freeze({path: row.path, bytes: row.bytes,
      sha256: row.sha256}),
  })).sort((left, right) => left.characterId - right.characterId);
  const keySequence = parsedButtons.map((button) => button.sourceKeyAttribute);
  invariant(KEY_SEQUENCES.some((expected) =>
    JSON.stringify(keySequence) === JSON.stringify(expected)),
  `${sourceSha256} TS05 button handler shape drifted`);
  invariant(JSON.stringify(parsedButtons.map((button) => button.characterId)) ===
    JSON.stringify(structure.buttonCharacterIds),
  `${sourceSha256} handler/placement button IDs drifted`);
  const frameOne = scriptFiles.find((row) => row.path === 'frame_1/DoAction.as');
  const frameSix = scriptFiles.find((row) => row.path === 'frame_6/DoAction.as');
  invariant(frameOne?.text === ROOT_PRELOADER_AND_STOP,
    `${sourceSha256} root frame-1 script drifted`);
  invariant(frameSix?.text === STOP,
    `${sourceSha256} root frame-6 stop drifted`);
  const childStops = scriptFiles.filter((row) =>
    /^DefineSprite_\d+\/frame_\d+\/DoAction\.as$/u.test(row.path));
  if (expectedSpecial) {
    invariant(childStops.length === 1 && childStops[0].text === STOP &&
      childStops[0].path ===
        `DefineSprite_${structure.mainObjectId}/frame_${structure.mainFrameCount}/DoAction.as`,
    `${sourceSha256} explicit terminal child stop drifted`);
  } else {
    invariant(childStops.length === 0,
      `${sourceSha256} gained an unreviewed child timeline script`);
  }
  const exactScripts = inventoryProjection(scriptFiles);
  return Object.freeze({
    exactScripts,
    buttons: Object.freeze(parsedButtons),
    operationSequence: Object.freeze([
      'literal _global.KeyAttribute assignment',
      '_root.DoHyperLinks() host request',
      '_root.animation_mc.animation.stop()',
    ]),
    rootPreloaderStopPresent: true,
    terminalChildStop: Object.freeze({
      present: expectedSpecial,
      frame: expectedSpecial ? structure.mainFrameCount : null,
      disposition: expectedSpecial ? 'exact-static-script-proven' :
        'absent-source-timeline-reaches-declared-end-without-stop-script',
    }),
  });
}

function validateFacts(facts, sourceSha256) {
  const reachable = facts.frameDomains.domains.filter((domain) =>
    domain.staticallyRootReachable);
  const root = reachable.find((domain) => domain.kind === 'root');
  const main = reachable.filter((domain) => domain.kind === 'sprite' &&
    domain.declaredFrameCount > 1).sort((left, right) =>
    right.declaredFrameCount - left.declaredFrameCount)[0];
  const special = sourceSha256 === EXPLICIT_CHILD_STOP_SOURCE_SHA256;
  const expectedButtonCount = facts.tagCounts.DefineButton2 ?? 0;
  invariant(facts.header.stage.width === 800 &&
    facts.header.stage.height === 600 && facts.header.fps === 12 &&
    facts.header.rootFrameCount === 10 &&
    facts.actionScript.version === 'AS1/2' &&
    facts.actionScript.tagCounts.DoAction === (special ? 3 : 2) &&
    facts.actionScript.tagCounts.DoInitAction === 0 &&
    facts.actionScript.tagCounts.DoABC === 0 &&
    facts.actionScript.tagCounts.DoABCDefine === 0 &&
    (facts.tagCounts.DefineButton ?? 0) === 0 &&
    facts.tagCounts.DefineButton2 === expectedButtonCount &&
    facts.audio.tagCounts.DefineSound === 0 &&
    facts.audio.tagCounts.StartSound === 0 &&
    facts.audio.tagCounts.SoundStreamHead === 1 &&
    facts.audio.tagCounts.SoundStreamHead2 === 0 &&
    facts.audio.tagCounts.SoundStreamBlock ===
      ({234: 225, 263: 254, 274: 265})[main?.declaredFrameCount] &&
    facts.audio.tagCounts.StartSound2 === 0 &&
    facts.linkageAndImports.importedAssets.length === 0 &&
    facts.linkageAndImports.exportedAssets.length === 0 &&
    facts.linkageAndImports.symbolClasses.length === 0 &&
    [234, 263, 274]
      .includes(main?.declaredFrameCount) &&
    [5, 6, 7, 10].includes(expectedButtonCount) &&
    main.scriptTagCount === (special ? 1 : 0) &&
    main.audioTagCount === facts.audio.tagCounts.SoundStreamBlock + 1 &&
    root?.scriptTagCount === 2,
  `${sourceSha256} TS05 source structure drifted`);
  const mainRootEdge = root.placementEdges.find((edge) =>
    edge.childSpriteId === main.spriteId);
  const buttonEdges = main.placementEdges.filter((edge) =>
    edge.characterType === 'DefineButton2').sort((left, right) =>
    left.characterId - right.characterId);
  const buttonFirstFrames = buttonEdges.map((edge) => edge.firstFrame);
  const buttonFrameVector = buttonFirstFrames.join(',');
  invariant(mainRootEdge?.firstFrame === 6 &&
    buttonEdges.length === expectedButtonCount &&
    ['103,139,139,139,139,237,242',
      '106,144,144,144,144',
      '106,150,150,150,150',
      '111,146,146,146,146,246,246,246,246,246',
      '112,150,150,150,150',
      '113,150,150,150,150,150',
      '115,150,150,150,150,150',
      '150,150,150,150,150'].includes(buttonFrameVector) &&
    buttonEdges.every((edge) => edge.placementCount === 1),
  `${sourceSha256} TS05 static placement graph drifted`);
  return Object.freeze({
    mainObjectId: main.spriteId,
    mainFrameDomain: main.domainId,
    mainFrameCount: main.declaredFrameCount,
    buttonCharacterIds: Object.freeze(buttonEdges.map((edge) =>
      edge.characterId).sort((left, right) => left - right)),
    buttonFirstFrame: buttonEdges[0].firstFrame,
    buttonFirstFrames: Object.freeze(buttonFirstFrames),
    soundStreamBlockCount: facts.audio.tagCounts.SoundStreamBlock,
    explicitChildStop: special,
  });
}

function reviewedPlacementSet(pages) {
  const projection = [...pages].sort((left, right) =>
    compareText(left.animationId, right.animationId)).map((page) => [
    page.animationId,
    page.stableLessonKey,
    page.moduleCode,
    page.lessonNumber,
    page.viewPath,
    page.sourceBytes,
    page.sourceSha256,
  ].join('|')).join('\n') + '\n';
  return Object.freeze({
    projection,
    sha256: sha256(projection),
  });
}

function glossaryDependencyRecord(lesson, source) {
  invariant(lesson.dependencyStatus === 'has-static-review-holds' &&
    lesson.keyTerms?.diagramDirectory === 'HELP_KEYTERMS/KT/DIG',
  `${lesson.stableLessonKey} key-term dependency status drifted`);
  const references = [lesson.keyTerms.english, lesson.keyTerms.spanish];
  invariant(references.every((reference) =>
    /^HELP_KEYTERMS\/KT\/XML\/L\d+KT[ES]01\.xml$/u.test(reference)),
  `${lesson.stableLessonKey} key-term references drifted`);
  const holds = lesson.dependencyHolds.filter((hold) =>
    references.includes(hold.reference));
  invariant(holds.length === 2 && holds.every((hold) =>
    hold.candidateCount === 0 &&
    hold.status === 'unresolved-static-reference'),
  `${lesson.stableLessonKey} key-term dependency hold drifted`);
  return Promise.all(references.map(async (reference) => {
    const candidate = path.join(source.root, ...reference.split('/'));
    const present = await lstat(candidate).then(() => true, (error) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });
    invariant(!present,
      `${lesson.stableLessonKey} key-term source appeared without review: ${reference}`);
    return Object.freeze({
      reference,
      candidateCount: 0,
      status: 'unresolved-static-reference',
      selectedSourceRootCandidatePresent: false,
    });
  }));
}

async function extractScripts(toolchain, memberRoot, stagedSource) {
  return runCommand(toolchain.command, [
    ...toolchain.prefixArgs,
    ...FFDEC_OPERATION_ARGS,
    memberRoot,
    stagedSource,
  ], {cwd: ROOT, env: process.env});
}

async function stageSource(memberRoot, buffer) {
  await mkdir(memberRoot, {recursive: true});
  const stagedSource = path.join(memberRoot, 'source.swf');
  await writeFile(stagedSource, buffer, {flag: 'wx', mode: 0o444});
  await chmod(stagedSource, 0o444);
  const binding = await stableFile(stagedSource, {absolute: true});
  invariant(binding.buffer.equals(buffer), 'staged source copy drifted');
  return stagedSource;
}

async function hostReferenceAudit(source, toolchain, stageRoot) {
  const sourceBinding = await readSourceAsset(source,
    HOST_REFERENCE.relativePath, HOST_REFERENCE);
  const memberRoot = path.join(stageRoot, 'host-reference');
  const stagedSource = await stageSource(memberRoot, sourceBinding.buffer);
  const command = await extractScripts(toolchain, memberRoot, stagedSource);
  const rows = await exportedScripts(path.join(memberRoot, 'scripts'));
  const inventory = inventoryProjection(rows);
  invariant(inventory.fileCount === HOST_REFERENCE.scriptFileCount &&
    inventory.totalBytes === HOST_REFERENCE.scriptBytes &&
    inventory.checksumSetSha256 === HOST_REFERENCE.scriptChecksumSetSha256,
  'alternate shell exact script set drifted');
  for (const expected of [HOST_REFERENCE.rootHostScript,
    HOST_REFERENCE.keyTermComponentScript]) {
    const row = rows.find((candidate) => candidate.path === expected.path);
    invariant(row?.bytes === expected.bytes && row.sha256 === expected.sha256,
      `alternate shell script drifted: ${expected.path}`);
  }
  const hostText = rows.find((row) =>
    row.path === HOST_REFERENCE.rootHostScript.path).text;
  const componentText = rows.find((row) =>
    row.path === HOST_REFERENCE.keyTermComponentScript.path).text;
  invariant(/function DoHyperLinks\(\)[\s\S]*?_loc2_\.Pause = true;[\s\S]*?_loc2_\.Play = false;[\s\S]*?_loc2_\.KeyAttribute \+= "~English";[\s\S]*?_loc1_\.m_c\.doGetSubLink\(_loc2_\.KeyAttribute\);/u
    .test(hostText) &&
    /function doGetSubLink\(subLinkWord\)[\s\S]*?_root\.doCreateSubLink\(subLinkWord\);/u
      .test(componentText) &&
    /_loc2_\.KeyTermVar = _loc2_\.xmlPath \+ "XML\/L1KTE01\.xml";/u
      .test(hostText),
  'alternate shell DoHyperLinks/key-term contract drifted');
  return Object.freeze({
    authority: 'single-alternate-GEO001-L1-shell-static-reference-only',
    source: descriptor(sourceBinding),
    exactScripts: inventory,
    selectedScripts: Object.freeze([
      HOST_REFERENCE.rootHostScript,
      HOST_REFERENCE.keyTermComponentScript,
    ]),
    command,
    provenStaticBehavior: Object.freeze([
      'sets _global.Pause=true and _global.Play=false',
      'opens the key-term container and disables legacy navigation',
      'appends ~English to _global.KeyAttribute',
      'calls m_c.doGetSubLink(KeyAttribute)',
      'loads lesson key-term XML through KeyTermVar',
    ]),
    limitations: Object.freeze([
      'This one alternate shell is historical host evidence, not a migrated course shell and not authority for all 44 lesson hosts.',
      'The referenced key-term XML bytes are absent from the selected source root, so the source-requested TS05 glossary definitions are not recovered.',
      'No legacy shell code is executed or included in a product bundle.',
    ]),
  });
}

async function expectedAudit(stageRoot) {
  const [catalog, toolchainRun, builder, source] = await Promise.all([
    stableFile(CATALOG, {json: true}),
    stableFile(TOOLCHAIN_RUN, {json: true}),
    stableFile(path.relative(ROOT, SCRIPT_PATH)),
    sourceRoot(),
  ]);
  const toolchain = await verifyToolchain(toolchainRun);
  const pages = catalog.value.lessons.flatMap((lesson) =>
    lesson.pages.filter((page) =>
      /\/TS\/L\d+TS05\.swf$/u.test(page.viewPath)).map((page) =>
      Object.freeze({...page,
        stableLessonKey: lesson.stableLessonKey,
        moduleCode: lesson.moduleCode,
        lessonNumber: lesson.lessonNumber,
        lesson,
      })));
  const placementSet = reviewedPlacementSet(pages);
  invariant(pages.length === 44 &&
    new Set(pages.map((page) => page.stableLessonKey)).size === 44 &&
    placementSet.sha256 === REVIEWED_PLACEMENT_SET_SHA256,
  'TS05 reviewed placement/lesson set drifted');
  const groups = new Map();
  for (const page of pages) {
    invariant(/^G6-G8-shared\/(?:NMS002|GEO001|ALG001|DAT001)\/L\d+\/TS\/L\d+TS05\.swf$/u
      .test(page.viewPath), `noncanonical TS05 source: ${page.viewPath}`);
    const group = groups.get(page.sourceSha256) ?? [];
    group.push(page);
    groups.set(page.sourceSha256, group);
  }
  invariant(groups.size === 44, 'TS05 unique SWF denominator drifted');
  const records = [];
  const glossaryByLesson = [];
  for (const [digest, group] of [...groups].sort(([left], [right]) =>
    compareText(left, right))) {
    let representative = null;
    const placements = [];
    for (const page of [...group].sort((left, right) =>
      compareText(left.animationId, right.animationId))) {
      const swf = await readSourceAsset(source, page.viewPath,
        {bytes: page.sourceBytes, sha256: page.sourceSha256});
      representative ??= swf.buffer;
      invariant(representative.equals(swf.buffer),
        `${digest} duplicate catalog source bytes differ`);
      invariant([1, 2].includes(page.audioCueCandidates?.length),
        `${page.animationId} TS05 audio cue denominator drifted`);
      const audioCandidates = [];
      for (const cue of page.audioCueCandidates) {
        invariant(cue.acceptance === 'candidate-index-only' &&
          ['lesson-SA', 'FQ/SA'].includes(cue.binding) &&
          cue.language === 'undetermined' && cue.required === null &&
          cue.hostTrigger === 'pending-authorized-original-runtime' &&
          /^G6-G8-shared\/(?:NMS002|GEO001|ALG001|DAT001)\/L\d+\/(?:FQ\/)?SA\/L\d+TS05\.mp3$/u
            .test(cue.viewPath),
        `${page.animationId} TS05 audio cue contract drifted`);
        const audio = await readSourceAsset(source, cue.viewPath,
          {bytes: cue.bytes, sha256: cue.sha256});
        audioCandidates.push(Object.freeze({
          id: cue.id,
          binding: cue.binding,
          source: descriptor(audio),
          language: cue.language,
          acceptance: cue.acceptance,
          hostTrigger: cue.hostTrigger,
          startSemantics: cue.startSemantics,
          stopOrCompleteSemantics: cue.stopOrCompleteSemantics,
          replayBehavior: cue.replayBehavior,
        }));
      }
      if (audioCandidates.length === 2) {
        invariant(page.animationId === 'shared-alg001-l02-p052' &&
          new Set(audioCandidates.map((candidate) =>
            `${candidate.source.bytes}:${candidate.source.sha256}`)).size === 1,
        `${page.animationId} unreviewed TS05 audio ambiguity appeared`);
      }
      const glossary = await glossaryDependencyRecord(page.lesson, source);
      glossaryByLesson.push(Object.freeze({
        stableLessonKey: page.stableLessonKey,
        references: Object.freeze(glossary),
      }));
      placements.push(Object.freeze({
        animationId: page.animationId,
        stableLessonKey: page.stableLessonKey,
        moduleCode: page.moduleCode,
        lessonNumber: page.lessonNumber,
        sourcePath: page.viewPath,
        audioCandidates: Object.freeze(audioCandidates),
        audioCandidateSelectionEstablished: false,
      }));
    }
    const facts = parseSwfSourceFacts(representative);
    const structure = validateFacts(facts, digest);
    const memberRoot = path.join(stageRoot, 'members', digest);
    const stagedSource = await stageSource(memberRoot, representative);
    const command = await extractScripts(toolchain, memberRoot, stagedSource);
    const scriptFiles = await exportedScripts(path.join(memberRoot, 'scripts'));
    const scripts = classifyTs05Scripts(scriptFiles, structure, digest);
    records.push(Object.freeze({
      sourceSha256: digest,
      sourceBytes: representative.length,
      placements: Object.freeze(placements),
      structure: Object.freeze({
        stage: '800x600',
        fps: 12,
        rootFrameCount: facts.header.rootFrameCount,
        mainFrameDomain: structure.mainFrameDomain,
        mainObjectId: structure.mainObjectId,
        mainFrameCount: structure.mainFrameCount,
        buttonCount: structure.buttonCharacterIds.length,
        buttonCharacterIds: structure.buttonCharacterIds,
        buttonFirstFrame: structure.buttonFirstFrame,
        buttonFirstFrames: structure.buttonFirstFrames,
        audioStreamCount: 1,
        soundStreamBlockCount: structure.soundStreamBlockCount,
        sourceStructureFingerprintSha256: facts.structureFingerprintSha256,
      }),
      behavior: scripts,
      command,
      compilerInputCopyStorage: 'ignored-private-frozen-run',
      generationAuthorized: false,
    }));
  }
  const hostReference = await hostReferenceAudit(source, toolchain, stageRoot);
  await verifyToolchain(toolchainRun);
  glossaryByLesson.sort((left, right) =>
    compareText(left.stableLessonKey, right.stableLessonKey));
  invariant(glossaryByLesson.length === 44 &&
    new Set(glossaryByLesson.map((row) => row.stableLessonKey)).size === 44,
  'TS05 glossary dependency denominator drifted');
  const allAudioCandidates = pages.flatMap((page) => page.audioCueCandidates);
  invariant(allAudioCandidates.length === 45 &&
    pages.filter((page) => page.audioCueCandidates.length === 2).length === 1,
  'TS05 catalog audio candidate distribution drifted');
  const frameCounts = Object.fromEntries(
    [234, 263, 274].map((frameCount) =>
    [String(frameCount), records.filter((record) =>
      record.structure.mainFrameCount === frameCount).length]));
  const rootFrameCounts = Object.fromEntries([10].map((frameCount) =>
    [String(frameCount), records.filter((record) =>
      record.structure.rootFrameCount === frameCount).length]));
  const buttonFirstFrameVectors = Object.fromEntries([
    '103,139,139,139,139,237,242',
    '106,144,144,144,144',
    '106,150,150,150,150',
    '111,146,146,146,146,246,246,246,246,246',
    '112,150,150,150,150',
    '113,150,150,150,150,150',
    '115,150,150,150,150,150',
    '150,150,150,150,150',
  ].map((vector) => [vector, records.filter((record) =>
    record.structure.buttonFirstFrames.join(',') === vector).length]));
  const keySequences = Object.fromEntries(KEY_SEQUENCES.map((keys) =>
    keys.join('|')).map((sequence) => [sequence, records.filter((record) =>
    record.behavior.buttons.map((button) =>
      button.sourceKeyAttribute).join('|') === sequence).length]));
  invariant(JSON.stringify(frameCounts) ===
    JSON.stringify({'234': 22, '263': 15, '274': 7}) &&
    JSON.stringify(rootFrameCounts) === JSON.stringify({'10': 44}) &&
    JSON.stringify(buttonFirstFrameVectors) ===
      JSON.stringify({
        '103,139,139,139,139,237,242': 6,
        '106,144,144,144,144': 13,
        '106,150,150,150,150': 1,
        '111,146,146,146,146,246,246,246,246,246': 1,
        '112,150,150,150,150': 11,
        '113,150,150,150,150,150': 2,
        '115,150,150,150,150,150': 1,
        '150,150,150,150,150': 9,
      }) &&
    JSON.stringify(keySequences) === JSON.stringify({
      [KEY_SEQUENCES[0].join('|')]: 9,
      [KEY_SEQUENCES[1].join('|')]: 23,
      [KEY_SEQUENCES[2].join('|')]: 2,
      [KEY_SEQUENCES[3].join('|')]: 1,
      [KEY_SEQUENCES[4].join('|')]: 3,
      [KEY_SEQUENCES[5].join('|')]: 2,
      [KEY_SEQUENCES[6].join('|')]: 1,
      [KEY_SEQUENCES[7].join('|')]: 1,
      [KEY_SEQUENCES[8].join('|')]: 2,
    }) &&
    records.filter((record) =>
      record.behavior.terminalChildStop.present).length === 1,
  'TS05 frame/terminal distribution drifted');
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-ts05-family-audit-v1',
    auditId: 'g678-ts05-family-audit-v1',
    status:
      'complete-source-script-audio-and-host-contract-audit-product-calibration-blocked',
    scope: Object.freeze({
      activePagePlacements: 2282,
      ts05Placements: 44,
      affectedLessons: 44,
      uniqueSourceSwfs: 44,
      catalogAudioCandidateRecords: allAudioCandidates.length,
      uniqueCatalogAudioSha256: new Set(allAudioCandidates.map((cue) =>
        cue.sha256)).size,
      courseShellsInMigrationScope: 0,
    }),
    inputs: Object.freeze({
      catalog: descriptor(catalog),
      toolchainRun: descriptor(toolchainRun),
      builder: descriptor(builder),
    }),
    extractionToolchain: toolchain.receipt,
    sourceRoot: Object.freeze({
      environmentVariable: SOURCE_ENV,
      ...source.identity,
      requireReadOnlySources: true,
    }),
    reviewedPlacementSetSha256: REVIEWED_PLACEMENT_SET_SHA256,
    exactClassifier: Object.freeze({
      path: 'G6-G8-shared/<module>/L<lesson>/TS/L<lesson>TS05.swf',
      title: '4 Step Plan',
      stage: '800x600 at 12 fps; root frame distribution is recorded below',
      rootFrameDistribution: rootFrameCounts,
      mainTimelineDistribution: frameCounts,
      buttons:
        'exact source-recorded TS05 glossary handlers; source-specific key and first-placement distributions are recorded below',
      keySequenceDistribution: keySequences,
      buttonFirstFrameVectorDistribution: buttonFirstFrameVectors,
      embeddedAudio:
        'one SoundStreamHead and 225/254/265 SoundStreamBlock tags per source',
      terminalBehavior:
        'one source has an exact child terminal stop; 43 sources have no child stop script',
    }),
    glossaryHostReference: hostReference,
    glossaryDependencies: Object.freeze(glossaryByLesson),
    records: Object.freeze(records),
    familyCalibrationPassed: false,
    scaleOutAuthorized: false,
    registrationCandidatePlacementCount: 0,
    acceptanceEffects: FALSE_EFFECTS,
    productBlockers: Object.freeze({
      keyTermDefinitionSourcesRecovered: false,
      typedModernGlossaryContentBound: false,
      sourcePauseResumeParityEstablished: false,
      sourceAudioCandidateSelectionEstablished: false,
      sourceAudioLanguageAndCueSemanticsEstablished: false,
      authorizedOriginalRuntimeObserved: false,
      representativeBrowserProductCalibrationPassed: false,
    }),
    limitations: Object.freeze([
      'The audit proves exact source structure, scripts, catalog audio bytes, and one historical host call shape; it does not prove natural runtime behavior.',
      'All 44 lesson key-term XML references remain unresolved with zero catalog candidates, so TS05 glossary definitions must not be invented.',
      'The 44 catalog MP3 candidates and embedded streams remain language/cue/listening-acceptance neutral.',
      'No Current-JS registration, whole-lesson engineering preview, acceptance, release, or publication effect is granted.',
    ]),
  });
}

async function treeInventory(root, {excludeControlFiles = false} = {}) {
  const files = [];
  const directories = [];
  const visit = async (current) => {
    const entries = await readdir(current, {withFileTypes: true});
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      if (excludeControlFiles &&
        ['run-manifest.json', 'output-inventory.json'].includes(relative)) continue;
      const metadata = await lstat(absolute, {bigint: true});
      invariant(!metadata.isSymbolicLink(),
        `run tree contains symlink: ${relative}`);
      if (metadata.isDirectory()) {
        directories.push(Object.freeze({path: relative}));
        await visit(absolute);
      } else if (metadata.isFile()) {
        invariant(metadata.nlink === 1n,
          `run tree contains hardlink: ${relative}`);
        const binding = await stableFile(absolute, {absolute: true});
        files.push(Object.freeze({path: relative, bytes: binding.bytes,
          sha256: binding.sha256}));
      } else {
        invariant(false, `run tree contains special file: ${relative}`);
      }
    }
  };
  await visit(root);
  return Object.freeze({
    schemaVersion: 1,
    directories: Object.freeze(directories.sort((left, right) =>
      compareText(left.path, right.path))),
    files: Object.freeze(files.sort((left, right) =>
      compareText(left.path, right.path))),
  });
}

async function freezeTree(root) {
  const entries = await readdir(root, {withFileTypes: true});
  for (const entry of entries) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) await freezeTree(absolute);
    else if (entry.isFile()) await chmod(absolute, 0o444);
  }
  await chmod(root, 0o555);
}

async function verifyFrozenRun(expectedRoot, canonicalRoot) {
  const [expected, observed] = await Promise.all([
    treeInventory(expectedRoot),
    treeInventory(canonicalRoot),
  ]);
  invariant(JSON.stringify(expected) === JSON.stringify(observed),
    'TS05 frozen run tree drifted');
  const verifyModes = async (current) => {
    const entries = await readdir(current, {withFileTypes: true});
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const metadata = await lstat(absolute, {bigint: true});
      invariant(!metadata.isSymbolicLink(),
        `TS05 frozen run contains symlink: ${absolute}`);
      if (metadata.isDirectory()) {
        invariant((metadata.mode & 0o777n) === 0o555n,
          `TS05 frozen run directory mode drifted: ${absolute}`);
        await verifyModes(absolute);
      } else {
        invariant(metadata.isFile() && metadata.nlink === 1n &&
          (metadata.mode & 0o777n) === 0o444n,
        `TS05 frozen run file custody drifted: ${absolute}`);
      }
    }
  };
  const rootMetadata = await lstat(canonicalRoot, {bigint: true});
  invariant((rootMetadata.mode & 0o777n) === 0o555n,
    'TS05 frozen run root mode drifted');
  await verifyModes(canonicalRoot);
}

async function writeExclusive(relativePath, bytes) {
  const target = projectPath(relativePath);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, bytes, {flag: 'wx'});
  try {
    await copyFile(temporary, target, fsConstants.COPYFILE_EXCL);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function auditTs05Family({check = false} = {}) {
  const canonicalRun = projectPath(RUN_ROOT);
  const stage = check ? `${canonicalRun}.check-${process.pid}-${Date.now()}` :
    `${canonicalRun}.staging-${process.pid}`;
  invariant(!await lstat(stage).then(() => true, () => false),
    'TS05 audit staging path already exists');
  if (!check) {
    invariant(!await lstat(canonicalRun).then(() => true, () => false),
      `${RUN_ROOT} already exists`);
    invariant(!await lstat(projectPath(OUTPUT)).then(() => true, () => false),
      `${OUTPUT} already exists`);
  }
  await mkdir(stage, {recursive: false});
  try {
    const artifact = await expectedAudit(stage);
    const bytes = stableBytes(artifact);
    const outputInventory = stableBytes(await treeInventory(stage,
      {excludeControlFiles: true}));
    await writeFile(path.join(stage, 'output-inventory.json'),
      outputInventory, {flag: 'wx'});
    const runManifest = stableBytes({
      schemaVersion: 1,
      artifactType: 'g678-ts05-family-audit-run-v1',
      runId: 'g678-ts05-family-audit-v1',
      status: artifact.status,
      audit: {path: OUTPUT, bytes: bytes.length, sha256: sha256(bytes)},
      outputInventory: {
        path: `${RUN_ROOT}/output-inventory.json`,
        bytes: outputInventory.length,
        sha256: sha256(outputInventory),
      },
      recordCount: artifact.records.length,
      placementCount: artifact.scope.ts05Placements,
      affectedLessonCount: artifact.scope.affectedLessons,
      familyCalibrationPassed: false,
      scaleOutAuthorized: false,
      registrationCandidatePlacementCount: 0,
      acceptanceEffects: FALSE_EFFECTS,
    });
    await writeFile(path.join(stage, 'run-manifest.json'), runManifest,
      {flag: 'wx'});
    if (check) {
      const current = await stableFile(OUTPUT);
      invariant(current.buffer.equals(bytes), 'TS05 family audit drifted');
      await verifyFrozenRun(stage, canonicalRun);
      await rm(stage, {recursive: true});
    } else {
      await freezeTree(stage);
      await rename(stage, canonicalRun);
      try {
        await writeExclusive(OUTPUT, bytes);
      } catch (error) {
        const failed = `${canonicalRun}.failed-tracked-publication-${Date.now()}`;
        await chmod(canonicalRun, 0o755).catch(() => {});
        await rename(canonicalRun, failed).catch(() => {});
        throw error;
      }
    }
    return Object.freeze({
      check,
      output: OUTPUT,
      bytes: bytes.length,
      sha256: sha256(bytes),
      status: artifact.status,
      placements: artifact.scope.ts05Placements,
      affectedLessons: artifact.scope.affectedLessons,
      uniqueSourceSwfs: artifact.scope.uniqueSourceSwfs,
      familyCalibrationPassed: false,
      scaleOutAuthorized: false,
      registrationCandidatePlacementCount: 0,
      acceptanceEffects: FALSE_EFFECTS,
    });
  } catch (error) {
    if (await lstat(stage).then(() => true, () => false)) {
      await chmod(stage, 0o755).catch(() => {});
      await rename(stage, `${stage}.failed`).catch(() => {});
    }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: audit-g678-ts05-family.mjs [--check]');
  auditTs05Family({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
