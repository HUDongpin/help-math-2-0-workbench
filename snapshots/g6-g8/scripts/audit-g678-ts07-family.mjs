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
const OUTPUT = 'catalog/g678-ts07-family-audit-v1.json';
const RUN_ROOT = 'work/g678-shared-page-factory/g678-ts07-family-audit-v1';
const REVIEWED_PLACEMENT_SET_SHA256 =
  'd9fd36495e38c8a1a499e9a58b350253c7b3b839ad789dc5497e0b0e5b73f847';
const BEHAVIOR_SHAPE_PROJECTION_SHA256 =
  'fe7d86e8d86783f1954395684aec003e4de6beeda270648fde05eb91660e0c6a';
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
const SWFMILL = Object.freeze({
  requestedPath: '/opt/homebrew/bin/swfmill',
  sha256: 'b1299adad7f32d8e489574539e79b0f42c4960148170bc1ca48736e07ccbd311',
  version: 'swfmill 0.3.6',
});
const XMLLINT = Object.freeze({
  path: '/usr/bin/xmllint',
  sha256: 'd5bc87cd40a96739fdf5b067e60c3ecfef0d895c95f325afb862774f58e41c75',
  version: 'libxml 2.9.13 XPath 1.0',
});
const QUIZ_INSTANCE_NAMES = Object.freeze([
  'AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4', 'NMHBtn',
  'Mc_Wrong_Feed1', 'Mc_Wrong_Feed2', 'Mc_Wrong_Feed3',
  'Mc_Right_Feed1', 'Mc_Right_Feed2', 'Mc_Right_Feed3', 'Mc_Right_Feed4',
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

function firstJsonDifference(left, right, currentPath = '$') {
  if (Object.is(left, right)) return null;
  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return `${currentPath}.length: ${left.length} !== ${right.length}`;
    }
    for (let index = 0; index < left.length; index += 1) {
      const difference = firstJsonDifference(left[index], right[index],
        `${currentPath}[${index}]`);
      if (difference) return difference;
    }
    return null;
  }
  if (left && right && typeof left === 'object' && typeof right === 'object') {
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])]
      .sort(compareText);
    for (const key of keys) {
      const difference = firstJsonDifference(left[key], right[key],
        `${currentPath}.${key}`);
      if (difference) return difference;
    }
    return null;
  }
  return `${currentPath}: ${JSON.stringify(left)} !== ${JSON.stringify(right)}`;
}

function projectPath(relativePath) {
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes the project root`);
  return absolute;
}

function descriptor(binding, pathOverride = binding.path) {
  return Object.freeze({path: pathOverride, bytes: binding.bytes,
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
      `${key} must be unset for the TS07 audit`);
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
  const swfmillRealPath = await realpath(SWFMILL.requestedPath);
  const [swfmill, xmllint] = await Promise.all([
    stableFile(swfmillRealPath, {absolute: true}),
    stableFile(XMLLINT.path, {absolute: true}),
  ]);
  invariant(swfmill.sha256 === SWFMILL.sha256 &&
    xmllint.sha256 === XMLLINT.sha256,
  'TS07 swfmill/xmllint toolchain drifted');
  return Object.freeze({
    command: ffdec.java.realPath,
    jar: ffdec.jar.realPath,
    prefixArgs: Object.freeze(recordedPrefixArgs.map((argument) =>
      argument === '<BOUND_FFDEC_JAR>' ? ffdec.jar.realPath : argument)),
    swfmill: Object.freeze({command: swfmillRealPath,
      receipt: Object.freeze({requestedPath: SWFMILL.requestedPath,
        realPath: swfmillRealPath, bytes: swfmill.bytes,
        sha256: swfmill.sha256, version: SWFMILL.version})}),
    xmllint: Object.freeze({command: XMLLINT.path,
      receipt: Object.freeze({path: XMLLINT.path, bytes: xmllint.bytes,
        sha256: xmllint.sha256, version: XMLLINT.version})}),
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
      swfmill: Object.freeze({requestedPath: SWFMILL.requestedPath,
        realPath: swfmillRealPath, bytes: swfmill.bytes,
        sha256: swfmill.sha256, version: SWFMILL.version}),
      xmllint: Object.freeze({path: XMLLINT.path, bytes: xmllint.bytes,
        sha256: xmllint.sha256, version: XMLLINT.version}),
    }),
  });
}

async function captureProcess(command, args, options = {}) {
  const {input, ...spawnOptions} = options;
  const child = spawn(command, args,
    {...spawnOptions, stdio: [input ? 'pipe' : 'ignore', 'pipe', 'pipe']});
  const stdout = [];
  const stderr = [];
  child.stdout.on('data', (chunk) => stdout.push(chunk));
  child.stderr.on('data', (chunk) => stderr.push(chunk));
  if (input) child.stdin.end(input);
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({code, signal}));
  });
  return Object.freeze({
    code: result.code,
    signal: result.signal,
    stdout: Buffer.concat(stdout),
    stderr: Buffer.concat(stderr),
  });
}

async function runCommand(command, args, options) {
  return stableFfdecCommandReceipt(await captureProcess(command, args, options));
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
  const match = text.match(/^on\(release\)\{\r\n(?:   q;\r\n)?   _global\.KeyAttribute = "([^"]+)";\r\n   _root\.DoHyperLinks\(\);\r\n   _root\.animation_mc\.animation\.stop\(\);\r\n\}\r\n$/u);
  return match ? Object.freeze({sourceKeyAttribute: match[1],
    strayQExpressionPresent: text.includes('   q;\r\n')}) : null;
}

function compactScript(text, {maskWrongFeed = false} = {}) {
  const value = maskWrongFeed
    ? text.replace(/_global\.WrongFeed = "[^"]*";/u,
      '_global.WrongFeed = "<SOURCE_LITERAL>";')
    : text;
  return value.trim().replace(/\s+/gu, ' ');
}

const ANSWER_HANDLER_TEMPLATES = new Set([
  'on(release){ _root.disableQuizButton(); _root.showWrongFeed(); NMHBtn.enabled = false; }',
  'on(release){ _root.disableQuizButton(); _root.showRightFeed(); NMHBtn.enabled = false; }',
  'on(release){ _global.WrongFeed = "<SOURCE_LITERAL>"; _root.disableQuizButton(); _root.showWrongFeed(); NMHBtn.enabled = false; }',
  'on(release){ _root.disableQuizButton(); _root.showWrongFeed(); _root.help_but.visible = true; }',
  'on(release){ _global.WrongFeed = "<SOURCE_LITERAL>"; _root.disableQuizButton(); _root.showWrongFeed(); _root.help_but.visible = true; }',
  'on(release){ _root.disableQuizButton(); _root.showRightFeed(); }',
]);
const RETRY_TEMPLATES = new Set([
  'stop(); _root.enableQuizButton(); this.gotoAndStop(1); _global.quizTryCount++; _parent.NMHBtn.enabled = true; if(_global.quizTryCount >= 2) { _global.quizTryCount = 0; _global.quizSection = false; _parent.play(); }',
  'stop(); _root.enableQuizButton(); this.gotoAndStop(1); _global.quizTryCount++; if(_global.quizTryCount >= 2) { _global.quizTryCount = 0; _global.quizSection = false; _parent.play(); }',
  'stop(); _root.enableQuizButton(); this.gotoAndStop(1); _parent.NMHBtn.enabled = true; _global.quizTryCount++; if(_global.quizTryCount >= 2) { _global.quizTryCount = 0; _global.quizSection = false; _parent.play(); }',
]);
const RIGHT_FEEDBACK_TERMINAL_TEMPLATES = new Set([
  'stop(); _root.disableQuizButton(); _global.quizSection = false; _parent.play(); this.gotoAndStop(1);',
  'stop(); _root.disableQuizButton(); _global.quizSection = false; this.gotoAndStop(1); _parent.play();',
]);
const QUIZ_STOP_TEMPLATES = new Set([
  'stop(); _global.quizSection = true; _global.quizTryCount = 0; Mc_Popup._visible = false;',
  'stop(); _global.quizSection = true; _global.quizTryCount = 0; Mc_Popup._visible = false; CloseBtn._visible = false;',
  'stop(); _global.quizSection = true; _global.quizTryCount = 0; Mc_Popup1._visible = false;',
]);
const ALLOWED_ROOT_CALLS = new Set([
  'DoHyperLinks', 'disableQuizButton', 'enableQuizButton',
  'showRightFeed', 'showWrongFeed',
]);
const ALLOWED_EXPORTED_ASSET_NAMES = new Set([
  'need',
  'DownArrow',
  'FScrollBarSymbol',
  'FUIComponentSymbol',
  'ScrollThumb',
  'UpArrow',
  'show mc1_new_001',
]);

export function classifyTs07Scripts(scriptFiles, structure, sourceSha256) {
  invariant(Array.isArray(scriptFiles), 'TS07 script files must be an array');
  const releaseRows = scriptFiles.filter((row) =>
    /^DefineButton2_\d+\/BUTTONCONDACTION on\(release\)\.as$/u.test(row.path));
  const answerRows = releaseRows.filter((row) =>
    /_root\.show(?:Right|Wrong)Feed\(\)/u.test(row.text));
  const answers = answerRows.map((row) => Object.freeze({
    characterId: Number(row.path.match(/^DefineButton2_(\d+)\//u)[1]),
    result: row.text.includes('_root.showRightFeed()') ? 'right' : 'wrong',
    customWrongFeed: row.text.match(/_global\.WrongFeed = "([^"]*)";/u)?.[1]
      ?? null,
    script: Object.freeze({path: row.path, bytes: row.bytes,
      sha256: row.sha256}),
  })).sort((left, right) => left.characterId - right.characterId);
  invariant([2, 3, 4].includes(answers.length) &&
    answers.filter((answer) => answer.result === 'right').length === 1 &&
    answers.every((answer) => ANSWER_HANDLER_TEMPLATES.has(compactScript(
      answerRows.find((row) => row.path === answer.script.path).text,
      {maskWrongFeed: true}))),
  `${sourceSha256} TS07 answer-handler shape drifted`);
  const glossaryButtons = releaseRows.flatMap((row) => {
    const parsed = parseGlossaryHandler(row.text);
    return parsed ? [Object.freeze({
      characterId: Number(row.path.match(/^DefineButton2_(\d+)\//u)[1]),
      ...parsed,
      script: Object.freeze({path: row.path, bytes: row.bytes,
        sha256: row.sha256}),
    })] : [];
  }).sort((left, right) => left.characterId - right.characterId);
  invariant(glossaryButtons.length >= 3 && glossaryButtons.length <= 32,
    `${sourceSha256} TS07 glossary-handler denominator drifted`);
  const retryRows = scriptFiles.filter((row) =>
    row.text.includes('_global.quizTryCount++;'));
  invariant([3, 4, 5].includes(retryRows.length) && retryRows.every((row) =>
    RETRY_TEMPLATES.has(compactScript(row.text))),
  `${sourceSha256} TS07 retry/resume shape drifted`);
  const quizStopRows = scriptFiles.filter((row) =>
    row.text.includes('_global.quizSection = true;') &&
      row.text.includes('_global.quizTryCount = 0;'));
  invariant(quizStopRows.length === 1 && QUIZ_STOP_TEMPLATES.has(
    compactScript(quizStopRows[0].text)),
  `${sourceSha256} TS07 quiz-stop shape drifted`);
  const quizStopMatch = quizStopRows[0].path.match(
    new RegExp(`^DefineSprite_${structure.mainObjectId}/frame_(\\d+)/DoAction\\.as$`,
      'u'));
  invariant(quizStopMatch && Number(quizStopMatch[1]) <
    structure.mainFrameCount,
  `${sourceSha256} TS07 quiz stop is outside the main timeline`);
  const frameOne = scriptFiles.find((row) => row.path === 'frame_1/DoAction.as');
  const frameSix = scriptFiles.find((row) => row.path === 'frame_6/DoAction.as');
  invariant(frameOne?.text === ROOT_PRELOADER_AND_STOP,
    `${sourceSha256} root frame-1 script drifted`);
  invariant(frameSix?.text === STOP,
    `${sourceSha256} root frame-6 stop drifted`);
  const rootCalls = [...new Set(scriptFiles.flatMap((row) =>
    [...row.text.matchAll(/_root\.([A-Za-z_$][\w$]*)\s*\(/gu)]
      .map((match) => match[1])))];
  invariant(rootCalls.length === ALLOWED_ROOT_CALLS.size &&
    rootCalls.every((call) => ALLOWED_ROOT_CALLS.has(call)) &&
    !scriptFiles.some((row) => /\beval\s*\(/u.test(row.text)),
  `${sourceSha256} TS07 host-call surface drifted`);
  const exactScripts = inventoryProjection(scriptFiles);
  const globalNames = [...new Set(scriptFiles.flatMap((row) =>
    [...row.text.matchAll(/_global\.([A-Za-z_$][\w$]*)/gu)]
      .map((match) => match[1])))].sort(compareText);
  return Object.freeze({
    exactScripts,
    globalNames: Object.freeze(globalNames),
    answers: Object.freeze(answers),
    rightAnswerCharacterId: answers.find((answer) =>
      answer.result === 'right').characterId,
    glossaryButtons: Object.freeze(glossaryButtons),
    allWrongFeedbackTerminalScripts: Object.freeze(retryRows.map((row) =>
      Object.freeze({
      script: Object.freeze({path: row.path, bytes: row.bytes,
        sha256: row.sha256}),
      twoAttemptThreshold: 2,
      }))),
    quizStop: Object.freeze({frame: Number(quizStopMatch[1]),
      script: Object.freeze({path: quizStopRows[0].path,
        bytes: quizStopRows[0].bytes, sha256: quizStopRows[0].sha256})}),
    customWrongFeedOverrideCount: answers.filter((answer) =>
      answer.customWrongFeed !== null).length,
    rootPreloaderStopPresent: true,
    operationSequence: Object.freeze([
      'quiz stop resets quizTryCount and exposes the source answer surface',
      'answer handler disables quiz controls and requests right/wrong host feedback',
      'wrong-feedback completion reenables controls, increments quizTryCount, and resumes the parent only at the two-attempt threshold',
      'glossary handlers request DoHyperLinks and stop the animation timeline',
    ]),
  });
}

function validateFacts(facts, sourceSha256) {
  const reachable = facts.frameDomains.domains.filter((domain) =>
    domain.staticallyRootReachable);
  const root = reachable.find((domain) => domain.kind === 'root');
  const main = reachable.filter((domain) => domain.kind === 'sprite' &&
    domain.declaredFrameCount > 1).sort((left, right) =>
    right.declaredFrameCount - left.declaredFrameCount)[0];
  const exportedAssetNames = new Set(facts.linkageAndImports.exportedAssets.map(
    (asset) => asset.name));
  invariant(facts.header.stage.width === 800 &&
    facts.header.stage.height === 600 && facts.header.fps === 12 &&
    facts.header.version === 6 &&
    facts.header.rootFrameCount === 10 &&
    facts.actionScript.version === 'AS1/2' &&
    facts.actionScript.tagCounts.DoAction >= 32 &&
    facts.actionScript.tagCounts.DoAction <= 49 &&
    [0, 2].includes(facts.actionScript.tagCounts.DoInitAction) &&
    facts.actionScript.tagCounts.DoABC === 0 &&
    facts.actionScript.tagCounts.DoABCDefine === 0 &&
    (facts.tagCounts.DefineButton ?? 0) === 0 &&
    (facts.tagCounts.DefineButton2 ?? 0) >= 12 &&
    (facts.tagCounts.DefineButton2 ?? 0) <= 45 &&
    facts.audio.tagCounts.DefineSound === 0 &&
    facts.audio.tagCounts.StartSound === 0 &&
    facts.audio.tagCounts.SoundStreamHead >= 8 &&
    facts.audio.tagCounts.SoundStreamHead <= 11 &&
    facts.audio.tagCounts.SoundStreamHead2 === 0 &&
    facts.audio.tagCounts.SoundStreamBlock >= 898 &&
    facts.audio.tagCounts.SoundStreamBlock <= 1261 &&
    facts.audio.tagCounts.StartSound2 === 0 &&
    facts.linkageAndImports.importedAssets.length === 0 &&
    facts.linkageAndImports.exportedAssets.length >= 3 &&
    facts.linkageAndImports.exportedAssets.length <= 22 &&
    exportedAssetNames.has('need') &&
    [...exportedAssetNames].every((name) =>
      ALLOWED_EXPORTED_ASSET_NAMES.has(name)) &&
    facts.linkageAndImports.symbolClasses.length === 0 &&
    main?.declaredFrameCount >= 689 && main.declaredFrameCount <= 995 &&
    [2, 4].includes(root?.scriptTagCount),
  `${sourceSha256} TS07 source structure drifted`);
  const mainRootEdge = root.placementEdges.find((edge) =>
    edge.childSpriteId === main.spriteId);
  invariant(mainRootEdge?.firstFrame === 6,
  `${sourceSha256} TS07 static placement graph drifted`);
  return Object.freeze({
    mainObjectId: main.spriteId,
    mainFrameDomain: main.domainId,
    mainFrameCount: main.declaredFrameCount,
    definedButtonCount: facts.tagCounts.DefineButton2 ?? 0,
    soundStreamHeadCount: facts.audio.tagCounts.SoundStreamHead,
    soundStreamBlockCount: facts.audio.tagCounts.SoundStreamBlock,
    doInitActionCount: facts.actionScript.tagCounts.DoInitAction,
    rootScriptTagCount: root.scriptTagCount,
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

function behaviorShapeProjection(records) {
  const projection = [...records].sort((left, right) => compareText(
    left.placements[0].animationId, right.placements[0].animationId,
  )).map((record) => [
    record.placements[0].animationId,
    record.sourceSha256,
    record.structure.mainObjectId,
    record.structure.mainFrameCount,
    record.behavior.exactScripts.fileCount,
    record.behavior.exactScripts.checksumSetSha256,
    record.behavior.answers.length,
    record.behavior.quiz.correctAnswerOrdinal,
    record.behavior.quiz.answerInstances.filter((answer) =>
      answer.result === 'wrong').length,
    record.behavior.quizStop.frame,
    record.behavior.allWrongFeedbackTerminalScripts.length,
    record.behavior.quiz.wrongFeedbackDomains.length,
    record.behavior.quiz.rightFeedbackDomains.length,
    record.behavior.quiz.wrongFeedbackDomains.map((domain) =>
      domain.activeAtQuizStop ? '1' : '0').join(''),
    record.behavior.quiz.rightFeedbackDomains.map((domain) =>
      domain.activeAtQuizStop ? '1' : '0').join(''),
    record.behavior.glossaryButtons.length,
    record.behavior.customWrongFeedOverrideCount,
    record.structure.soundStreamHeadCount,
    record.structure.soundStreamBlockCount,
  ].join('|')).join('\n') + '\n';
  return Object.freeze({projection, sha256: sha256(projection)});
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

function redactedArgs(args) {
  return Object.freeze(args.map((argument) => path.isAbsolute(argument)
    ? `<${path.basename(argument)}>` : argument));
}

function auxiliaryCommandReceipt(result, command, args, label) {
  invariant(result.code === 0 && result.signal === null,
    `${label} failed: ${result.stderr.toString('utf8')}`);
  return Object.freeze({
    command: path.basename(command),
    args: redactedArgs(args),
    exitCode: 0,
    stdout: Object.freeze({bytes: result.stdout.length,
      sha256: sha256(result.stdout)}),
    stderr: Object.freeze({bytes: result.stderr.length,
      sha256: sha256(result.stderr)}),
  });
}

async function extractXml(toolchain, memberRoot, stagedSource) {
  const xmlPath = path.join(memberRoot, 'source.xml');
  const args = ['-n', 'swf2xml', stagedSource, xmlPath];
  const result = await captureProcess(toolchain.swfmill.command, args,
    {cwd: ROOT, env: process.env});
  const command = auxiliaryCommandReceipt(result,
    toolchain.swfmill.command, args, 'swfmill TS07 XML export');
  const xml = await stableFile(xmlPath, {absolute: true});
  return Object.freeze({xml, command});
}

function instanceNode(mainObjectId, instanceName, quizStopFrame) {
  return `/swf/Header/tags/DefineSprite[@objectID='${mainObjectId}']/tags/` +
    `PlaceObject2[@name='${instanceName}']` +
    `[count(preceding-sibling::ShowFrame)+1<=${quizStopFrame}]`;
}

function quizInstanceXPath(mainObjectId, quizStopFrame) {
  const fields = QUIZ_INSTANCE_NAMES.map((name) => {
    const node = instanceNode(mainObjectId, name, quizStopFrame);
    return [
      `'${name}|'`,
      `count(${node})`,
      "'|'",
      `string((${node})[last()]/@objectID)`,
      "'|'",
      `count((${node})[last()]/preceding-sibling::ShowFrame)+1`,
      "'|'",
      `string((${node})[last()]/@depth)`,
      "'|'",
      `string((${node})[last()]/transform/Transform/@scaleX)`,
      "'|'",
      `string((${node})[last()]/transform/Transform/@skewY)`,
      "'|'",
      `string((${node})[last()]/transform/Transform/@skewX)`,
      "'|'",
      `string((${node})[last()]/transform/Transform/@scaleY)`,
      "'|'",
      `string((${node})[last()]/transform/Transform/@transX)`,
      "'|'",
      `string((${node})[last()]/transform/Transform/@transY)`,
      "';'",
    ].join(',');
  });
  return `concat(${fields.join(',')})`;
}

function inactiveReplacementXPath(mainObjectId, quizStopFrame, instances) {
  const fields = instances.map((instance) => {
    const node = instanceNode(mainObjectId, instance.instanceName,
      quizStopFrame);
    const following = `((${node})[last()]/following-sibling::*[` +
      `count(preceding-sibling::ShowFrame)+1<=${quizStopFrame} and (` +
      `((self::RemoveObject or self::RemoveObject2) and ` +
      `@depth='${instance.depth}') or (self::PlaceObject2 and ` +
      `@depth='${instance.depth}' and @replace='1' and @objectID and ` +
      `@objectID!='${instance.objectId}'))])`;
    return `'${instance.instanceName}|',count(${following}),';'`;
  });
  return `concat(${fields.join(',')})`;
}

async function runXpath(toolchain, xml, xpath, label) {
  const args = ['--xpath', xpath, '-'];
  const result = await captureProcess(toolchain.xmllint.command, args,
    {cwd: ROOT, env: process.env, input: xml.buffer});
  invariant(result.stderr.length === 0, `${label} emitted stderr`);
  return Object.freeze({
    text: result.stdout.toString('utf8'),
    command: Object.freeze({
      ...auxiliaryCommandReceipt(result, toolchain.xmllint.command,
        ['--xpath', '<BOUND_XPATH>', '<VERIFIED_XML_BUFFER>'], label),
      stdin: Object.freeze({bytes: xml.bytes, sha256: xml.sha256}),
      xpathSha256: sha256(xpath),
    }),
  });
}

function frameScript(scriptFiles, objectId, templates, label) {
  const pattern = new RegExp(
    `^DefineSprite_${objectId}/frame_(\\d+)/DoAction(?:_\\d+)?\\.as$`, 'u');
  const matches = scriptFiles.flatMap((row) => {
    const pathMatch = row.path.match(pattern);
    return pathMatch && templates.has(compactScript(row.text))
      ? [Object.freeze({frame: Number(pathMatch[1]), script: Object.freeze({
        path: row.path, bytes: row.bytes, sha256: row.sha256,
      })})] : [];
  });
  invariant(matches.length === 1,
    `${label} must have one exact terminal script`);
  return matches[0];
}

async function quizInstanceCrosswalk({facts, structure, scripts, scriptFiles, xml,
  toolchain, sourceSha256}) {
  const quizStopFrame = scripts.quizStop.frame;
  const selected = await runXpath(toolchain, xml,
    quizInstanceXPath(structure.mainObjectId, quizStopFrame),
    `${sourceSha256} TS07 quiz instance XPath`);
  const parseNumber = (value, fallback) => value === '' ? fallback : Number(value);
  const instances = selected.text.trim().split(';').filter(Boolean).map((entry) => {
    const [instanceName, count, objectId, placementFrame, depth,
      scaleX, skewY, skewX, scaleY, transX, transY] = entry.split('|');
    const value = Object.freeze({
      instanceName,
      selectionCount: Number(count),
      objectId: Number(objectId),
      placementFrame: Number(placementFrame),
      depth: Number(depth),
      matrix: Object.freeze({
        a: parseNumber(scaleX, 1),
        b: parseNumber(skewY, 0),
        c: parseNumber(skewX, 0),
        d: parseNumber(scaleY, 1),
        tx: parseNumber(transX, 0) / 20,
        ty: parseNumber(transY, 0) / 20,
      }),
    });
    invariant(QUIZ_INSTANCE_NAMES.includes(value.instanceName) &&
      Number.isSafeInteger(value.objectId) && value.objectId > 0 &&
      Number.isSafeInteger(value.depth) && value.depth > 0 &&
      value.placementFrame >= 1 && value.placementFrame <= quizStopFrame &&
      Object.values(value.matrix).every(Number.isFinite),
    `${sourceSha256} TS07 quiz instance crosswalk is invalid`);
    return value;
  });
  invariant(instances.length === QUIZ_INSTANCE_NAMES.length &&
    new Set(instances.map((instance) => instance.instanceName)).size ===
      QUIZ_INSTANCE_NAMES.length &&
    instances.every((instance) => instance.selectionCount === 1 ||
      (instance.instanceName === 'Mc_Wrong_Feed1' &&
        instance.selectionCount === 3)),
  `${sourceSha256} TS07 named quiz instance set drifted`);
  const activity = await runXpath(toolchain, xml,
    inactiveReplacementXPath(structure.mainObjectId, quizStopFrame, instances),
    `${sourceSha256} TS07 quiz activity XPath`);
  const inactiveCounts = Object.fromEntries(activity.text.trim().split(';')
    .filter(Boolean).map((entry) => {
      const [name, count] = entry.split('|');
      return [name, Number(count)];
    }));
  invariant(Object.keys(inactiveCounts).length === instances.length &&
    Object.values(inactiveCounts).every((count) =>
      Number.isSafeInteger(count) && count >= 0),
  `${sourceSha256} TS07 quiz activity result is invalid`);
  const activeInstances = instances.map((instance) => Object.freeze({
    ...instance,
    invalidatingChangeCount: inactiveCounts[instance.instanceName],
    activeAtQuizStop: inactiveCounts[instance.instanceName] === 0,
  }));
  const answerInstances = activeInstances.filter((instance) =>
    /^AnsBtn[1-4]$/u.test(instance.instanceName)).map((instance) => {
    const handler = scripts.answers.find((answer) =>
      answer.characterId === instance.objectId);
    invariant(handler, `${sourceSha256} ${instance.instanceName} lacks handler`);
    return Object.freeze({...instance,
      ordinal: Number(instance.instanceName.slice('AnsBtn'.length)),
      result: handler.result,
      customWrongFeed: handler.customWrongFeed,
      script: handler.script,
    });
  }).sort((left, right) => left.ordinal - right.ordinal);
  invariant(answerInstances.length === 4 &&
    answerInstances.every((answer) => answer.activeAtQuizStop) &&
    answerInstances.filter((answer) => answer.result === 'right').length === 1,
  `${sourceSha256} TS07 answer-instance semantics drifted`);
  const feedbackDomain = (instance, kind) => {
    const terminal = frameScript(scriptFiles, instance.objectId,
      kind === 'wrong' ? RETRY_TEMPLATES : RIGHT_FEEDBACK_TERMINAL_TEMPLATES,
      `${sourceSha256} ${instance.instanceName}`);
    const domain = facts.frameDomains.domains.find((candidate) =>
      candidate.kind === 'sprite' && candidate.spriteId === instance.objectId);
    invariant(domain?.staticallyRootReachable &&
      domain.tagCounts.SoundStreamHead === 1 &&
      domain.tagCounts.SoundStreamBlock > 0,
    `${sourceSha256} ${instance.instanceName} audio domain drifted`);
    return Object.freeze({...instance, kind, terminal,
      frameDomain: domain.domainId,
      frameCount: domain.declaredFrameCount,
      soundStreamHeadCount: domain.tagCounts.SoundStreamHead,
      soundStreamBlockCount: domain.tagCounts.SoundStreamBlock,
    });
  };
  const wrongFeedbackDomains = activeInstances.filter((instance) =>
    instance.instanceName.startsWith('Mc_Wrong_Feed')).map((instance) =>
    feedbackDomain(instance, 'wrong'));
  const rightFeedbackDomains = activeInstances.filter((instance) =>
    instance.instanceName.startsWith('Mc_Right_Feed')).map((instance) =>
    feedbackDomain(instance, 'right'));
  invariant(wrongFeedbackDomains.length === 3 && rightFeedbackDomains.length === 4,
    `${sourceSha256} TS07 feedback-domain cardinality drifted`);
  const hintInstance = activeInstances.find((instance) =>
    instance.instanceName === 'NMHBtn');
  invariant(hintInstance?.activeAtQuizStop,
    `${sourceSha256} TS07 NMHBtn is inactive at the quiz stop`);
  return Object.freeze({
    answerInstances: Object.freeze(answerInstances),
    correctAnswerOrdinal: answerInstances.find((answer) =>
      answer.result === 'right').ordinal,
    hintInstance,
    wrongFeedbackDomains: Object.freeze(wrongFeedbackDomains),
    rightFeedbackDomains: Object.freeze(rightFeedbackDomains),
    commands: Object.freeze({selectedInstances: selected.command,
      activeAtQuizStop: activity.command}),
  });
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
      .test(hostText) &&
    /function showWrongFeed\(\)[\s\S]*?intMc_Name = random\(3\);[\s\S]*?Mc_Wrong_Feed/u
      .test(hostText) &&
    /function showRightFeed\(\)[\s\S]*?intMc_Name = random\(4\);[\s\S]*?Mc_Right_Feed/u
      .test(hostText) &&
    /function disableQuizButton\(\)[\s\S]*?while\(i <= 25\)[\s\S]*?AnsBtn[\s\S]*?NMHBtn\.enabled = false;/u
      .test(hostText) &&
    /function enableQuizButton\(\)[\s\S]*?while\(i <= 25\)[\s\S]*?AnsBtn[\s\S]*?NMHBtn\.enabled = true;/u
      .test(hostText),
  'alternate shell glossary/quiz host contract drifted');
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
      'showWrongFeed selects one of three legacy feedback domains',
      'showRightFeed selects one of four legacy feedback domains',
      'disableQuizButton and enableQuizButton address AnsBtn1..25 and NMHBtn',
    ]),
    limitations: Object.freeze([
      'This one alternate shell is historical host evidence, not a migrated course shell and not authority for all 44 lesson hosts.',
      'The referenced key-term XML bytes are absent from the selected source root, so the source-requested TS07 glossary definitions are not recovered.',
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
      /\/TS\/L\d+TS07\.swf$/u.test(page.viewPath)).map((page) =>
      Object.freeze({...page,
        stableLessonKey: lesson.stableLessonKey,
        moduleCode: lesson.moduleCode,
        lessonNumber: lesson.lessonNumber,
        lesson,
      })));
  const placementSet = reviewedPlacementSet(pages);
  invariant(pages.length === 44 &&
    new Set(pages.map((page) => page.stableLessonKey)).size === 44 &&
    pages.every((page) => page.titleEnglish === 'Question 1' &&
      page.titleRaw === 'Question 1' && page.titleSpanish === 'Pregunta 1') &&
    placementSet.sha256 === REVIEWED_PLACEMENT_SET_SHA256,
  'TS07 reviewed placement/lesson set drifted');
  const groups = new Map();
  for (const page of pages) {
    invariant(/^G6-G8-shared\/(?:NMS002|GEO001|ALG001|DAT001)\/L\d+\/TS\/L\d+TS07\.swf$/u
      .test(page.viewPath), `noncanonical TS07 source: ${page.viewPath}`);
    const group = groups.get(page.sourceSha256) ?? [];
    group.push(page);
    groups.set(page.sourceSha256, group);
  }
  invariant(groups.size === 44, 'TS07 unique SWF denominator drifted');
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
        `${page.animationId} TS07 audio cue denominator drifted`);
      const audioCandidates = [];
      for (const cue of page.audioCueCandidates) {
        invariant(cue.acceptance === 'candidate-index-only' &&
          ['lesson-SA', 'FQ/SA'].includes(cue.binding) &&
          cue.language === 'undetermined' && cue.required === null &&
          cue.hostTrigger === 'pending-authorized-original-runtime' &&
          /^G6-G8-shared\/(?:NMS002|GEO001|ALG001|DAT001)\/L\d+\/(?:FQ\/)?SA\/L\d+TS07\.mp3$/u
            .test(cue.viewPath),
        `${page.animationId} TS07 audio cue contract drifted`);
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
        invariant(page.animationId === 'shared-alg001-l02-p054' &&
          new Set(audioCandidates.map((candidate) =>
            `${candidate.source.bytes}:${candidate.source.sha256}`)).size === 1,
        `${page.animationId} unreviewed TS07 audio ambiguity appeared`);
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
    const [command, xmlExport] = await Promise.all([
      extractScripts(toolchain, memberRoot, stagedSource),
      extractXml(toolchain, memberRoot, stagedSource),
    ]);
    const scriptFiles = await exportedScripts(path.join(memberRoot, 'scripts'));
    const scripts = classifyTs07Scripts(scriptFiles, structure, digest);
    const quiz = await quizInstanceCrosswalk({facts, structure, scripts,
      scriptFiles, xml: xmlExport.xml, toolchain, sourceSha256: digest});
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
        definedButton2Count: structure.definedButtonCount,
        soundStreamHeadCount: structure.soundStreamHeadCount,
        soundStreamBlockCount: structure.soundStreamBlockCount,
        doInitActionCount: structure.doInitActionCount,
        rootScriptTagCount: structure.rootScriptTagCount,
        sourceStructureFingerprintSha256: facts.structureFingerprintSha256,
      }),
      behavior: Object.freeze({...scripts, quiz}),
      extraction: Object.freeze({
        ffdec: command,
        swfmill: xmlExport.command,
        swfmillXml: descriptor(xmlExport.xml,
          `${RUN_ROOT}/members/${digest}/source.xml`),
      }),
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
  'TS07 glossary dependency denominator drifted');
  const allAudioCandidates = pages.flatMap((page) => page.audioCueCandidates);
  invariant(allAudioCandidates.length === 45 &&
    pages.filter((page) => page.audioCueCandidates.length === 2).length === 1,
  'TS07 catalog audio candidate distribution drifted');
  const numericDistribution = (values) => Object.fromEntries(
    [...new Set(values)].sort((left, right) => left - right).map((value) =>
      [String(value), values.filter((candidate) => candidate === value).length]));
  const textDistribution = (values) => Object.fromEntries(
    [...new Set(values)].sort(compareText).map((value) =>
      [value, values.filter((candidate) => candidate === value).length]));
  const mainFrameCounts = numericDistribution(records.map((record) =>
    record.structure.mainFrameCount));
  const rootFrameCounts = numericDistribution(records.map((record) =>
    record.structure.rootFrameCount));
  const doInitActionDistributions = numericDistribution(records.map((record) =>
    record.structure.doInitActionCount));
  const rootScriptTagDistributions = numericDistribution(records.map((record) =>
    record.structure.rootScriptTagCount));
  const answerDistributions = textDistribution(records.map((record) => {
    const right = record.behavior.answers.filter((answer) =>
      answer.result === 'right').length;
    const wrong = record.behavior.answers.length - right;
    return `${right}R/${wrong}W`;
  }));
  const allWrongFeedbackScriptDistributions = numericDistribution(records.map(
    (record) => record.behavior.allWrongFeedbackTerminalScripts.length));
  const correctAnswerOrdinalDistributions = numericDistribution(records.map(
    (record) => record.behavior.quiz.correctAnswerOrdinal));
  const audioStreamHeadDistributions = numericDistribution(records.map((record) =>
    record.structure.soundStreamHeadCount));
  const globalSurfaceDistributions = textDistribution(records.map((record) =>
    record.behavior.globalNames.join('|')));
  const behaviorShape = behaviorShapeProjection(records);
  const customWrongFeedOverridePageCount = records.filter((record) =>
    record.behavior.customWrongFeedOverrideCount > 0).length;
  const customWrongFeedOverrideCount = records.reduce((sum, record) =>
    sum + record.behavior.customWrongFeedOverrideCount, 0);
  const scriptFileCounts = records.map((record) =>
    record.behavior.exactScripts.fileCount);
  const glossaryHandlerCounts = records.map((record) =>
    record.behavior.glossaryButtons.length);
  const soundStreamBlockCounts = records.map((record) =>
    record.structure.soundStreamBlockCount);
  const inactiveFeedbackDomains = records.flatMap((record) => [
    ...record.behavior.quiz.wrongFeedbackDomains,
    ...record.behavior.quiz.rightFeedbackDomains,
  ].filter((domain) => !domain.activeAtQuizStop).map((domain) => Object.freeze({
    animationId: record.placements[0].animationId,
    instanceName: domain.instanceName,
    objectId: domain.objectId,
    invalidatingChangeCount: domain.invalidatingChangeCount,
  }))).sort((left, right) => compareText(
    `${left.animationId}|${left.instanceName}`,
    `${right.animationId}|${right.instanceName}`,
  ));
  const distributionChecks = Object.freeze({
    rootFrameCounts: JSON.stringify(rootFrameCounts) ===
      JSON.stringify({'10': 44}),
    doInitActionDistributions: JSON.stringify(doInitActionDistributions) ===
      JSON.stringify({
      '0': 43,
      '2': 1,
      }),
    rootScriptTagDistributions: JSON.stringify(rootScriptTagDistributions) ===
      JSON.stringify({
      '2': 43,
      '4': 1,
      }),
    answerDistributions: JSON.stringify(answerDistributions) === JSON.stringify({
      '1R/1W': 18,
      '1R/2W': 4,
      '1R/3W': 22,
      }),
    allWrongFeedbackScriptDistributions:
      JSON.stringify(allWrongFeedbackScriptDistributions) === JSON.stringify({
      '3': 12,
      '4': 20,
      '5': 12,
      }),
    correctAnswerOrdinalDistributions:
      JSON.stringify(correctAnswerOrdinalDistributions) === JSON.stringify({
        '1': 14,
        '2': 7,
        '3': 22,
        '4': 1,
      }),
    audioStreamHeadDistributions:
      JSON.stringify(audioStreamHeadDistributions) === JSON.stringify({
      '8': 12,
      '9': 19,
      '10': 3,
      '11': 10,
      }),
    globalSurfaceDistributions:
      JSON.stringify(globalSurfaceDistributions) === JSON.stringify({
      'FStyleFormat|KeyAttribute|quizSection|quizTryCount': 1,
      'KeyAttribute|WrongFeed|quizSection|quizTryCount': 10,
      'KeyAttribute|quizSection|quizTryCount': 33,
      }),
    mainFrameMinimum: Math.min(...Object.keys(mainFrameCounts).map(Number)) === 689,
    mainFrameMaximum: Math.max(...Object.keys(mainFrameCounts).map(Number)) === 995,
    scriptFileMinimum: Math.min(...scriptFileCounts) === 57,
    scriptFileMaximum: Math.max(...scriptFileCounts) === 100,
    glossaryHandlerMinimum: Math.min(...glossaryHandlerCounts) === 3,
    glossaryHandlerMaximum: Math.max(...glossaryHandlerCounts) === 32,
    soundStreamBlockMinimum: Math.min(...soundStreamBlockCounts) === 898,
    soundStreamBlockMaximum: Math.max(...soundStreamBlockCounts) === 1261,
    quizStops: records.every((record) => record.behavior.quizStop.frame > 0),
    quizFeedbackDomains: records.every((record) =>
      record.behavior.quiz.answerInstances.length === 4 &&
      record.behavior.quiz.wrongFeedbackDomains.length === 3 &&
      record.behavior.quiz.rightFeedbackDomains.length === 4),
    customWrongFeedOverridePageCount:
      customWrongFeedOverridePageCount === 10,
    customWrongFeedOverrideCount: customWrongFeedOverrideCount === 19,
    behaviorShape:
      behaviorShape.sha256 === BEHAVIOR_SHAPE_PROJECTION_SHA256,
  });
  const distributionFailures = Object.entries(distributionChecks)
    .filter(([, passed]) => !passed).map(([name]) => name);
  invariant(distributionFailures.length === 0,
    `TS07 source/behavior distribution drifted: ${distributionFailures.join(', ')}; ` +
      `observedBehaviorShape=${behaviorShape.sha256}`);
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-ts07-family-audit-v1',
    auditId: 'g678-ts07-family-audit-v1',
    status:
      'complete-source-script-audio-and-host-contract-audit-product-calibration-blocked',
    scope: Object.freeze({
      activePagePlacements: 2282,
      ts07Placements: 44,
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
    behaviorShapeProjectionSha256: behaviorShape.sha256,
    exactClassifier: Object.freeze({
      path: 'G6-G8-shared/<module>/L<lesson>/TS/L<lesson>TS07.swf',
      title: 'Question 1 / Pregunta 1',
      stage: '800x600 at 12 fps with exact ten-frame root timeline',
      rootFrameDistribution: rootFrameCounts,
      doInitActionDistribution: doInitActionDistributions,
      rootScriptTagDistribution: rootScriptTagDistributions,
      mainTimelineFrameCountDistribution: mainFrameCounts,
      scriptFileCountRange: Object.freeze({minimum: 57, maximum: 100}),
      answerHandlerDistribution: answerDistributions,
      allWrongFeedbackTerminalScriptDistribution:
        allWrongFeedbackScriptDistributions,
      correctAnswerOrdinalDistribution: correctAnswerOrdinalDistributions,
      glossaryHandlerCountRange: Object.freeze({minimum: 3, maximum: 32}),
      customWrongFeedOverrides: Object.freeze({
        affectedPages: customWrongFeedOverridePageCount,
        handlerCount: customWrongFeedOverrideCount,
      }),
      inactiveFeedbackDomains: Object.freeze(inactiveFeedbackDomains),
      globalSurfaceDistribution: globalSurfaceDistributions,
      quizStopPlacementCount: records.length,
      embeddedAudio:
        '8-11 SoundStreamHead and 898-1261 SoundStreamBlock tags per source; feedback/audio domain semantics remain unresolved',
      soundStreamHeadDistribution: audioStreamHeadDistributions,
      sourceBehavior:
        'one quiz stop, four active named answer instances with one right outcome, three named wrong-feedback domains, four named right-feedback domains with per-domain stop-frame activity, and source glossary pause handlers per page',
    }),
    historicalHostReference: hostReference,
    glossaryDependencies: Object.freeze(glossaryByLesson),
    records: Object.freeze(records),
    familyCalibrationPassed: false,
    scaleOutAuthorized: false,
    registrationCandidatePlacementCount: 0,
    acceptanceEffects: FALSE_EFFECTS,
    productBlockers: Object.freeze({
      sourceAnswerLabelsAndGeometryBound: false,
      typedAssessmentStateMachineImplemented: false,
      feedbackDomainToHostVariantMapEstablished: false,
      allNamedFeedbackDomainsActiveAtQuizStop: false,
      allSourceRequestedKeyTermDefinitionsResolved: false,
      typedModernGlossaryContentBound: false,
      sourceQuizAndGlossaryPauseResumeParityEstablished: false,
      sourceAudioCandidateSelectionEstablished: false,
      sourceAudioLanguageAndCueSemanticsEstablished: false,
      authorizedOriginalRuntimeObserved: false,
      representativeBrowserProductCalibrationPassed: false,
    }),
    limitations: Object.freeze([
      'The audit proves exact source structure, ActionScript handler shapes, catalog audio bytes, and one alternate-shell static host contract; it does not prove natural runtime behavior or host reachability for all lessons.',
      'All 44 lesson key-term XML references remain absent from the selected source root; separately recovered L1 glossary evidence must be bound before any eligible subset is implemented.',
      'Visible answer text/geometry has not yet been mapped to the source handler character IDs, and the modern typed two-attempt assessment state machine has not been implemented.',
      'The alternate shell proves random three-way wrong and four-way right feedback selection only for that single historical host; it does not prove that every page-host pair resolves the seven named child domains identically.',
      'Some named feedback instances are removed or replaced before the final quiz stop; the exact inactive-domain list is retained and blocks a uniform family promotion.',
      'The 45 catalog MP3 candidate rows, 44 unique MP3 hashes, and embedded sound streams remain language/cue/listening-acceptance neutral.',
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
    'TS07 frozen run tree drifted');
  const verifyModes = async (current) => {
    const entries = await readdir(current, {withFileTypes: true});
    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const metadata = await lstat(absolute, {bigint: true});
      invariant(!metadata.isSymbolicLink(),
        `TS07 frozen run contains symlink: ${absolute}`);
      if (metadata.isDirectory()) {
        invariant((metadata.mode & 0o777n) === 0o555n,
          `TS07 frozen run directory mode drifted: ${absolute}`);
        await verifyModes(absolute);
      } else {
        invariant(metadata.isFile() && metadata.nlink === 1n &&
          (metadata.mode & 0o777n) === 0o444n,
        `TS07 frozen run file custody drifted: ${absolute}`);
      }
    }
  };
  const rootMetadata = await lstat(canonicalRoot, {bigint: true});
  invariant((rootMetadata.mode & 0o777n) === 0o555n,
    'TS07 frozen run root mode drifted');
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

export async function auditTs07Family({check = false} = {}) {
  const canonicalRun = projectPath(RUN_ROOT);
  const stage = check ? `${canonicalRun}.check-${process.pid}-${Date.now()}` :
    `${canonicalRun}.staging-${process.pid}`;
  invariant(!await lstat(stage).then(() => true, () => false),
    'TS07 audit staging path already exists');
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
      artifactType: 'g678-ts07-family-audit-run-v1',
      runId: 'g678-ts07-family-audit-v1',
      status: artifact.status,
      audit: {path: OUTPUT, bytes: bytes.length, sha256: sha256(bytes)},
      outputInventory: {
        path: `${RUN_ROOT}/output-inventory.json`,
        bytes: outputInventory.length,
        sha256: sha256(outputInventory),
      },
      recordCount: artifact.records.length,
      placementCount: artifact.scope.ts07Placements,
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
      invariant(current.buffer.equals(bytes),
        `TS07 family audit drifted: ${firstJsonDifference(
          JSON.parse(current.buffer), artifact) ?? 'byte-only difference'}`);
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
      placements: artifact.scope.ts07Placements,
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
    'usage: audit-g678-ts07-family.mjs [--check]');
  auditTs07Family({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
