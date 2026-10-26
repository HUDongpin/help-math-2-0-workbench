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
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {parseSwfSourceFacts} from
  './build-g4-l3-machine-source-audits.mjs';
import {auditTs07L1Keyterms} from './audit-g678-ts07-l1-keyterms.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SOURCE_ENV = 'HELP_MATH_G678_SOURCE_ROOT';
const RECOVERY_ENV = 'PRIVATE_RECOVERY_CONTAINERS';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const STRUCTURAL_INVENTORY =
  'catalog/g678-pure-linear-structural-inventory-v1.json';
const PREDECESSOR =
  'catalog/product-bridge-calibrations/g678-current-js-324-page-product-calibrated-registration-v1.json';
const KEY_TERM_RECOVERY = 'catalog/g678-ts07-l1-keyterm-recovery-v1.json';
const HOST_AUDIT = 'catalog/g678-ts02-family-audit-v1.json';
const TOOLCHAIN_RUN =
  'work/g678-shared-page-factory/g678-ts07-nms-l1-current-js-1-v1/run-manifest.json';
const OUTPUT = 'catalog/g678-alg-l09-vb06-drag-family-audit-v1.json';
const RUN_ID = 'g678-alg-l09-vb06-drag-family-audit-v1';
const RUN_ROOT = `work/g678-shared-page-factory/${RUN_ID}`;
const EXPECTED_MEMBER_SET_SHA256 =
  'cbd0f41d75623b3f5899b5942441835626d4136108db853f7b8cbe4cbe57e928';

const EXPECTED_MEMBERS = Object.freeze([
  ['shared-alg001-l09-p012', 'shared-alg001-l09', 'ALG001', 9,
    'G6-G8-shared/ALG001/L9/VB/L9VB06.swf', 480011,
    'a45c6ec1adf9d5341f65024188959fa7b7a99d7c9a189866b629c61df9c3f437',
    'sprite-78', 188, 4, 'VB', 5],
].map((row) => Object.freeze({
  animationId: row[0],
  stableLessonKey: row[1],
  moduleCode: row[2],
  lessonNumber: row[3],
  sourcePath: row[4],
  sourceBytes: row[5],
  sourceSha256: row[6],
  mainFrameDomain: row[7],
  mainFrameCount: row[8],
  buttonCount: row[9],
  sectionCode: row[10],
  sectionPageOrdinal: row[11],
})));

const CRITICAL_ENVIRONMENT = Object.freeze([
  'FFDEC_JARFILENAME',
  'FFDEC_MEMORY',
  'FFDEC_STACK_SIZE',
  'JAVA_TOOL_OPTIONS',
  'JDK_JAVA_OPTIONS',
  '_JAVA_OPTIONS',
  'CLASSPATH',
]);
const FFDEC_OPERATION_ARGS = Object.freeze([
  '-config', 'packJavaScripts=false', '-onerror', 'abort',
  '-timeout', '120', '-exportTimeout', '600',
  '-format', 'script:as,text:txt', '-export', 'script,text',
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
const ROOT_PRELOADER_AND_STOP =
  '_level0.InternalPreloader.gotoAndPlay("jump_check");\r\nstop();\r\n';
const STOP = 'stop();\r\n';
const EXPECTED_SCRIPT_SHA256 = Object.freeze({
  'DefineButton2_8/BUTTONCONDACTION on(release).as':
    '226066967287fe61bf0df65af3e2afa1e3f30bc761a1870c7bf0df56a5c3355f',
  'DefineButton2_12/BUTTONCONDACTION on(release).as':
    '05f5d87f2ef13416b0cf365008f18ac5b091687bdfdda27e233c310978bf14f8',
  'DefineButton2_13/BUTTONCONDACTION on(release).as':
    'b08b61203940409b345123558774aeabf2365df435ce3c1692547e6a6442b827',
  'DefineButton2_70/BUTTONCONDACTION on(release).as':
    '8a8ad6a4199b702cd72fcaf863894677794f33d98cd9882c9720c5d4845abe42',
  'DefineSprite_57/frame_1/DoAction.as':
    '3271a793e3f9600314c6b0facc05023c4f3ed09c116d452966200a5d04735655',
  'DefineSprite_57/frame_2/DoAction.as':
    '8ce47ab8e286b7de15213df8000f92d7533e6a541f10c304c4d42fe770a5b5cb',
  'DefineSprite_57/frame_16/DoAction.as':
    'df90f09ac21ec5a8756b933ca96dfb5f3a1182082a6f139d756d6493f4dfcca3',
  'DefineSprite_57/frame_27/DoAction.as':
    'df90f09ac21ec5a8756b933ca96dfb5f3a1182082a6f139d756d6493f4dfcca3',
  'DefineSprite_57/frame_36/DoAction.as':
    'df90f09ac21ec5a8756b933ca96dfb5f3a1182082a6f139d756d6493f4dfcca3',
  'DefineSprite_57/frame_54/DoAction.as':
    'df90f09ac21ec5a8756b933ca96dfb5f3a1182082a6f139d756d6493f4dfcca3',
  'DefineSprite_73/frame_1/DoAction.as':
    '225ce70da8c7289a00833009b73b66f22586f234d40bfa2a68cfc9d8609551ae',
  'DefineSprite_75/frame_1/DoAction.as':
    '225ce70da8c7289a00833009b73b66f22586f234d40bfa2a68cfc9d8609551ae',
  'DefineSprite_77/frame_1/DoAction.as':
    '3271a793e3f9600314c6b0facc05023c4f3ed09c116d452966200a5d04735655',
  'DefineSprite_77/frame_20/DoAction.as':
    '13a4f94ac49cf49a0a4df332e55459e1e0b37d2edf6229be9b00413deb2c3938',
  'DefineSprite_78/frame_1/DoAction.as':
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'DefineSprite_78/frame_129/DoAction.as':
    'd01cc7172cbeaa002f7c4f67e9991fcbaf42e54b0fc82f5f20355399f3e4551c',
  'DefineSprite_78/frame_188/DoAction.as':
    '3271a793e3f9600314c6b0facc05023c4f3ed09c116d452966200a5d04735655',
  'frame_1/DoAction.as':
    'af7188282949f2613421ba9c8be629f489bbe2ee1e370a072024794b2d2cfc19',
  'frame_6/DoAction.as':
    '3271a793e3f9600314c6b0facc05023c4f3ed09c116d452966200a5d04735655',
  ...Object.fromEntries([49, 52, 55, 60].flatMap((objectId, index) => {
    const depth = [29, 36, 46, 58][index];
    const base = `DefineSprite_78/frame_129/PlaceObject2_${objectId}_${depth}`;
    return [
      [`${base}/CLIPACTIONRECORD on(press).as`,
        '86283d46ce4ba1de814ddfe44a0d299404176f77d6f284ebb6d97689840f5b04'],
      [`${base}/CLIPACTIONRECORD on(releaseOutside,release).as`,
        index < 2
          ? 'a41e1d024cc100232e9fffd0891fa45cb16c1398d7111a77b305b380f6ede8d9'
          : '06422c0b01e3d848607d21c7024c4861ad35e30aa9c15adc3c19388502398d36'],
      [`${base}/CLIPACTIONRECORD onClipEvent(load).as`,
        '2fdba42dd5b6be2c707eebc8e9e33b94f0570cb075f0b02c769065ed57080be0'],
    ];
  })),
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

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

function descriptor(binding, pathOverride = binding.path) {
  return Object.freeze({path: pathOverride, bytes: binding.bytes,
    sha256: binding.sha256});
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
    identity: Object.freeze({
      device: String(after.dev),
      inode: String(after.ino),
      size: String(after.size),
      mtimeNs: String(after.mtimeNs),
      mode: Number(after.mode & 0o777n),
      nlink: Number(after.nlink),
    }),
    ...(json ? {value: JSON.parse(buffer)} : {}),
  });
}

async function checkedRoot(environmentName, childName = null,
  {requireReadOnly = true} = {}) {
  const requested = process.env[environmentName];
  invariant(typeof requested === 'string' && requested.length > 0,
    `${environmentName} is required`);
  const root = path.resolve(requested);
  const [canonical, metadata] = await Promise.all([
    realpath(root), lstat(root, {bigint: true}),
  ]);
  invariant(canonical === root && metadata.isDirectory() &&
    !metadata.isSymbolicLink() &&
    (!requireReadOnly || (metadata.mode & 0o222n) === 0n),
  `${environmentName} must be one canonical read-only directory`);
  const child = childName ? path.join(root, childName) : root;
  const [childCanonical, childMetadata] = await Promise.all([
    realpath(child), lstat(child, {bigint: true}),
  ]);
  invariant(childCanonical === child && childMetadata.isDirectory() &&
    !childMetadata.isSymbolicLink() &&
    (!requireReadOnly || (childMetadata.mode & 0o222n) === 0n),
  `${environmentName}/${childName ?? ''} must be read-only`);
  return Object.freeze({root, child, identity: Object.freeze({
    realPathSha256: sha256(root),
    device: String(metadata.dev),
    inode: String(metadata.ino),
    mode: Number(metadata.mode & 0o777n),
    childRealPathSha256: sha256(child),
    childDevice: String(childMetadata.dev),
    childInode: String(childMetadata.ino),
    childMode: Number(childMetadata.mode & 0o777n),
  })});
}

async function verifyDirectoryChain(anchor, targetParent,
  {requireReadOnly = true} = {}) {
  const relative = path.relative(anchor, targetParent);
  invariant(relative === '' || (!relative.startsWith(`..${path.sep}`) &&
    relative !== '..' && !path.isAbsolute(relative)),
  `${targetParent} escapes ${anchor}`);
  let cursor = anchor;
  for (const component of relative === '' ? [] : relative.split(path.sep)) {
    cursor = path.join(cursor, component);
    const [metadata, canonical] = await Promise.all([
      lstat(cursor, {bigint: true}), realpath(cursor),
    ]);
    invariant(canonical === cursor && metadata.isDirectory() &&
      !metadata.isSymbolicLink() &&
      (!requireReadOnly || (metadata.mode & 0o222n) === 0n),
    `${cursor} must be one canonical read-only directory`);
  }
}

async function externalFile(root, relativePath, expected = null,
  {requireReadOnly = true} = {}) {
  const components = relativePath.split('/');
  invariant(components.every((component) =>
    component.length > 0 && component !== '.' && component !== '..'),
  `noncanonical external path: ${relativePath}`);
  const target = path.join(root, ...components);
  invariant(target.startsWith(`${root}${path.sep}`),
    `${relativePath} escapes external root`);
  await verifyDirectoryChain(root, path.dirname(target), {requireReadOnly});
  const binding = await stableFile(target, {absolute: true});
  invariant((!requireReadOnly || (binding.identity.mode & 0o222) === 0) &&
    (!expected || (binding.bytes === expected.bytes &&
      binding.sha256 === expected.sha256)),
  `${relativePath} external identity drifted`);
  return Object.freeze({...binding, path: relativePath});
}

async function verifyToolchain(toolchainRun) {
  for (const key of CRITICAL_ENVIRONMENT) {
    invariant(process.env[key] === undefined,
      `${key} must be absent for the ALG L9 VB06 drag audit`);
  }
  const ffdec = toolchainRun.value.toolchain?.ffdec;
  invariant(ffdec?.execution === 'direct-bound-java' &&
    ffdec.invocation?.prefixArgs?.at(-1) === '<BOUND_FFDEC_JAR>' &&
    ffdec.jarManifest?.classPath?.length === 37,
  'reviewed FFDec toolchain is unavailable');
  for (const expected of [ffdec.launcher, ffdec.jar, ffdec.java,
    ...ffdec.jarManifest.classPath]) {
    const current = await stableFile(expected.realPath, {absolute: true});
    invariant(current.bytes === expected.bytes &&
      current.sha256 === expected.sha256,
    `FFDec toolchain drifted: ${expected.realPath}`);
  }
  return Object.freeze({
    command: ffdec.java.realPath,
    prefixArgs: Object.freeze(ffdec.invocation.prefixArgs.map((argument) =>
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
        prefixArgs: ffdec.invocation.prefixArgs,
        operationArgs: FFDEC_OPERATION_ARGS,
      }),
    }),
  });
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

function commandReceipt(result, args) {
  invariant(result.code === 0 && result.signal === null,
    `FFDec failed: ${result.stderr.toString('utf8')}`);
  invariant(result.stderr.length === 0,
    `FFDec emitted stderr: ${result.stderr.toString('utf8')}`);
  return Object.freeze({
    command: '<BOUND_JAVA_EXECUTABLE>',
    args: Object.freeze(args.map((argument) => path.isAbsolute(argument)
      ? `<${path.basename(argument)}>` : argument)),
    exitCode: 0,
    stdout: Object.freeze({captured: true, recorded: false,
      exclusionReason: 'FFDec progress contains volatile paths and timings'}),
    stderr: Object.freeze({bytes: 0, sha256: sha256(result.stderr)}),
  });
}

async function walk(root, current = root, rows = []) {
  const entries = await readdir(current, {withFileTypes: true});
  entries.sort((left, right) => compareText(left.name, right.name));
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    invariant(!entry.isSymbolicLink(),
      `generated tree contains symlink: ${absolute}`);
    if (entry.isDirectory()) await walk(root, absolute, rows);
    else if (entry.isFile()) rows.push(absolute);
    else invariant(false, `generated tree contains special entry: ${absolute}`);
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
  return Object.freeze(rows.sort((left, right) =>
    compareText(left.path, right.path)));
}

async function exportedText(textRoot) {
  const rows = [];
  for (const absolute of await walk(textRoot)) {
    const binding = await stableFile(absolute, {absolute: true});
    rows.push(Object.freeze({
      path: path.relative(textRoot, absolute).split(path.sep).join('/'),
      bytes: binding.bytes,
      sha256: binding.sha256,
      text: binding.buffer.toString('utf8'),
    }));
  }
  return Object.freeze(rows.sort((left, right) =>
    compareText(left.path, right.path)));
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

function normalizeText(value) {
  return value.replaceAll('&nbsp;', ' ').replaceAll('\u00a0', ' ')
    .replace(/\s+/gu, ' ').trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function parseKeyTerms(xmlText) {
  const entries = new Map();
  const pattern =
    /<([^\s>]+~LNG~[^\s>]+)\s+([^>]*)>([\s\S]*?)<\/\1\s*>/giu;
  for (const match of xmlText.matchAll(pattern)) {
    const attributes = Object.fromEntries([...match[2].matchAll(
      /([A-Za-z]+)\s*=\s*"([^"]*)"/gu,
    )].map((attribute) => [attribute[1], attribute[2]]));
    if (!attributes.ScreenkeyTerm) continue;
    const definitions = match[3].split('~LNG~');
    invariant(definitions.length === 2 &&
      typeof attributes.ExFileName === 'string' &&
      attributes.ExFileName.endsWith('.swf'),
    `${attributes.ScreenkeyTerm} key-term entry shape drifted`);
    const normalized = normalizeKey(attributes.ScreenkeyTerm);
    const existing = entries.get(normalized) ?? [];
    existing.push(Object.freeze({
      sourceKeyAttribute: attributes.ScreenkeyTerm,
      spanishLabel: match[1].split('~LNG~')[1]
        .replaceAll('~', ' ').trim(),
      definitions: Object.freeze({
        en: normalizeText(definitions[0]),
        es: normalizeText(definitions[1]),
      }),
      legacyCompanionReferences: Object.freeze({
        subLinksEn: (attributes.SubLinkEng ?? '').split('~').filter(Boolean),
        subLinksEs: (attributes.SubLinkSpan ?? '').split('~').filter(Boolean),
        exampleSwf: attributes.ExFileName,
      }),
      exactEntrySha256: sha256(match[0]),
    }));
    entries.set(normalized, existing);
  }
  return entries;
}

function resolveTerms(sourceKeys, englishTerms, spanishTerms) {
  return Object.freeze([...new Set(sourceKeys.map(normalizeKey))].sort(
    compareText).map((normalizedKey) => {
      const english = englishTerms.get(normalizedKey) ?? [];
      const spanish = spanishTerms.get(normalizedKey) ?? [];
      invariant(english.length === 1 && spanish.length === 1,
        `${normalizedKey} must have one entry in each L1 XML`);
      const left = english[0];
      const right = spanish[0];
      const definitionParity = exact(left.definitions, right.definitions);
      const id = normalizedKey.replace(/[^a-z0-9]+/gu, '-')
        .replace(/(^-|-$)/gu, '');
      invariant(id.length > 0, `${normalizedKey} has no stable term id`);
      return Object.freeze({
        id,
        normalizedKey,
        sourceKeyAttribute: left.sourceKeyAttribute,
        labels: Object.freeze({en: left.sourceKeyAttribute,
          es: right.spanishLabel}),
        definitions: Object.freeze({
          en: left.definitions.en,
          es: right.definitions.es,
        }),
        localeSourceResolution: Object.freeze({
          en: 'HELP_KEYTERMS/KT/XML/L1KTE01.xml',
          es: 'HELP_KEYTERMS/KT/XML/L1KTS01.xml',
        }),
        definitionParity,
        definitionVariants: Object.freeze({
          englishXml: left.definitions,
          spanishXml: right.definitions,
        }),
        legacyCompanionReferences: Object.freeze({
          en: left.legacyCompanionReferences,
          es: right.legacyCompanionReferences,
        }),
        sourceEntrySha256: Object.freeze({
          en: left.exactEntrySha256,
          es: right.exactEntrySha256,
        }),
      });
    }));
}

function selectedSet(rows) {
  const projection = [...rows].sort((left, right) => compareText(
    left.animationId, right.animationId)).map((row) => [
    row.animationId, row.stableLessonKey, row.moduleCode, row.lessonNumber,
    row.sourcePath, row.sourceBytes, row.sourceSha256,
    row.mainFrameDomain, row.mainFrameCount, row.buttonCount,
  ].join('|')).join('\n') + '\n';
  return Object.freeze({projection, sha256: sha256(projection)});
}

function validateFacts(facts, expected) {
  const reachable = facts.frameDomains.domains.filter((domain) =>
    domain.staticallyRootReachable);
  const root = reachable.find((domain) => domain.kind === 'root');
  const main = reachable.find((domain) =>
    domain.domainId === expected.mainFrameDomain);
  invariant(facts.header.stage.width === 800 &&
    facts.header.stage.height === 600 && facts.header.fps === 12 &&
    facts.header.rootFrameCount === 10 &&
    facts.actionScript.version === 'AS1/2' &&
    facts.actionScript.tagCounts.DoAction === 15 &&
    facts.actionScript.tagCounts.DoInitAction === 0 &&
    facts.actionScript.tagCounts.DoABC === 0 &&
    facts.actionScript.tagCounts.DoABCDefine === 0 &&
    (facts.tagCounts.DefineButton ?? 0) === 0 &&
    (facts.tagCounts.DefineButton2 ?? 0) === expected.buttonCount &&
    facts.audio.tagCounts.SoundStreamHead === 3 &&
    facts.audio.tagCounts.SoundStreamHead2 === 0 &&
    facts.audio.tagCounts.DefineSound === 0 &&
    facts.audio.tagCounts.StartSound === 0 &&
    facts.audio.tagCounts.StartSound2 === 0 &&
    facts.linkageAndImports.importedAssets.length === 0 &&
    facts.linkageAndImports.exportedAssets.length === 0 &&
    facts.linkageAndImports.symbolClasses.length === 0 &&
    facts.audio.tagCounts.SoundStreamBlock === 258 &&
    root?.scriptTagCount === 2 && main?.declaredFrameCount ===
      expected.mainFrameCount && main.scriptTagCount === 3,
  `${expected.animationId} source structure drifted`);
  const rootEdge = root.placementEdges.find((edge) =>
    edge.childSpriteId === main.spriteId);
  const glossaryButtonEdges = main.placementEdges.filter((edge) =>
    edge.characterType === 'DefineButton2').sort((left, right) =>
    left.characterId - right.characterId);
  const popupDomains = reachable.filter((domain) =>
    domain.domainId === 'sprite-73' || domain.domainId === 'sprite-75');
  const popupCloseEdges = popupDomains.flatMap((domain) =>
    domain.placementEdges.filter((edge) =>
      edge.characterType === 'DefineButton2'));
  const interactionChildren = main.placementEdges.filter((edge) =>
    edge.characterType === 'DefineSprite' && edge.firstFrame === 129)
    .map((edge) => edge.childSpriteId).sort((left, right) => left - right);
  invariant(rootEdge?.firstFrame === 6 &&
    exact(glossaryButtonEdges.map((edge) => edge.characterId), [8, 12, 13]) &&
    glossaryButtonEdges.every((edge) => edge.firstFrame === 1) &&
    popupCloseEdges.length === 2 &&
    popupCloseEdges.every((edge) => edge.characterId === 70 &&
      edge.firstFrame === 1) &&
    exact(interactionChildren, [46, 49, 52, 55, 57, 60, 73, 75, 77]),
  `${expected.animationId} placement graph drifted`);
  return Object.freeze({
    rootFrameCount: facts.header.rootFrameCount,
    mainObjectId: main.spriteId,
    mainFrameDomain: main.domainId,
    mainFrameCount: main.declaredFrameCount,
    buttonCharacterIds: Object.freeze(glossaryButtonEdges.map((edge) =>
      edge.characterId)),
    buttonFirstFrames: Object.freeze(glossaryButtonEdges.map((edge) =>
      edge.firstFrame)),
    popupCloseButtonCharacterId: 70,
    interactionFrame: 129,
    interactionChildSpriteIds: Object.freeze(interactionChildren),
    soundStreamBlockCount: facts.audio.tagCounts.SoundStreamBlock,
    sourceStructureFingerprintSha256: facts.structureFingerprintSha256,
  });
}

function classifyScripts(rows, textRows, structure, expected) {
  const expectedScripts = Object.entries(EXPECTED_SCRIPT_SHA256)
    .sort(([left], [right]) => compareText(left, right));
  invariant(rows.length === 31 && expectedScripts.length === 31 &&
    exact(rows.map((row) => [row.path, row.sha256]), expectedScripts),
  `${expected.animationId} exact 31-script set drifted`);
  const frameOne = rows.find((row) => row.path === 'frame_1/DoAction.as');
  const frameSix = rows.find((row) => row.path === 'frame_6/DoAction.as');
  const terminal = rows.find((row) => row.path ===
    `DefineSprite_${structure.mainObjectId}/frame_${expected.mainFrameCount}/DoAction.as`);
  invariant(frameOne?.text === ROOT_PRELOADER_AND_STOP &&
    frameSix?.text === STOP && terminal?.text === STOP,
  `${expected.animationId} root script contract drifted`);
  const buttons = rows.filter((row) =>
    /^DefineButton2_(?:8|12|13)\/BUTTONCONDACTION on\(release\)\.as$/u
      .test(row.path)).map((row) => {
    const match = row.text.match(
      /^on\(release\)\{\r\n(?:\s*q;\r\n)?\s*_global\.KeyAttribute = "([^"]+)";\r\n\s*_root\.DoHyperLinks\(\);\r\n\s*_root\.animation_mc\.animation\.stop\(\);\r\n\}\r\n$/u,
    );
    invariant(match, `${expected.animationId} button script drifted`);
    return Object.freeze({
      characterId: Number(row.path.match(/^DefineButton2_(\d+)\//u)[1]),
      sourceKeyAttribute: match[1],
      script: Object.freeze({path: row.path, bytes: row.bytes,
        sha256: row.sha256}),
    });
  }).sort((left, right) => left.characterId - right.characterId);
  invariant(buttons.length === 3 &&
    exact(buttons.map((button) => button.characterId),
      structure.buttonCharacterIds),
  `${expected.animationId} button/script identity drifted`);
  const closeButton = rows.find((row) => row.path ===
    'DefineButton2_70/BUTTONCONDACTION on(release).as');
  const interaction = rows.find((row) => row.path ===
    'DefineSprite_78/frame_129/DoAction.as');
  const randomAudio = rows.find((row) => row.path ===
    'DefineSprite_57/frame_2/DoAction.as');
  const completion = rows.find((row) => row.path ===
    'DefineSprite_77/frame_20/DoAction.as');
  invariant(closeButton?.text.includes('this._visible = false;') &&
    interaction?.text.includes('stop();') &&
    interaction.text.includes('_global.quizDragCount = 0;') &&
    randomAudio?.text.includes('_global.rndAudio[0] = "S1";') &&
    randomAudio.text.includes('_global.rndAudio[3] = "S4";') &&
    completion?.text.includes('if(_global.quizDragCount >= 4)') &&
    completion.text.includes('_parent.play();'),
  `${expected.animationId} stop/audio/completion script contract drifted`);
  const drags = Object.freeze([
    ['drag-1', 49, 29, 'non-proportional', [3, 4]],
    ['drag-3', 52, 36, 'non-proportional', [3, 4]],
    ['drag-4', 55, 46, 'proportional', [1, 2]],
    ['drag-2', 60, 58, 'proportional', [1, 2]],
  ].map(([sourceId, objectId, depth, group, acceptedTargets]) => {
    const base = `DefineSprite_78/frame_129/PlaceObject2_${objectId}_${depth}`;
    const press = rows.find((row) => row.path ===
      `${base}/CLIPACTIONRECORD on(press).as`);
    const release = rows.find((row) => row.path ===
      `${base}/CLIPACTIONRECORD on(releaseOutside,release).as`);
    const load = rows.find((row) => row.path ===
      `${base}/CLIPACTIONRECORD onClipEvent(load).as`);
    invariant(press?.text.includes('startDrag(this,0);') &&
      load?.text.includes('OrgX = _X;') &&
      acceptedTargets.every((target) =>
        release?.text.includes(`_parent.Drop_mc${target}`)) &&
      release?.text.includes('_global.quizDragCount++;') &&
      release.text.includes('enabled = false;'),
    `${expected.animationId} ${sourceId} drag contract drifted`);
    return Object.freeze({sourceId, objectId, depth, group,
      acceptedTargetInstanceNames: Object.freeze(acceptedTargets.map(
        (target) => `Drop_mc${target}`)),
      scripts: Object.freeze({
        press: Object.freeze({path: press.path, bytes: press.bytes,
          sha256: press.sha256}),
        release: Object.freeze({path: release.path, bytes: release.bytes,
          sha256: release.sha256}),
        load: Object.freeze({path: load.path, bytes: load.bytes,
          sha256: load.sha256}),
      })});
  }));
  const textMap = new Map(textRows.map((row) => [row.path, row]));
  const proportionalFeedback = textMap.get('72.txt');
  const nonProportionalFeedback = textMap.get('74.txt');
  invariant(proportionalFeedback?.sha256 ===
      '92a04f5e7d50b1327c78a02a815ff6954755a647ffc390551cb6809f3ed3172a' &&
    nonProportionalFeedback?.sha256 ===
      '28dbbc2f3d3f47a90a5305e5e8e39f65830968e3760499c4e4200351c053654d',
  `${expected.animationId} feedback text evidence drifted`);
  return Object.freeze({
    exactScripts: inventoryProjection(rows),
    exactText: inventoryProjection(textRows),
    buttons: Object.freeze(buttons.map((button, index) => Object.freeze({
      ...button,
      firstFrame: structure.buttonFirstFrames[index],
    }))),
    popupCloseButton: Object.freeze({characterId: 70,
      script: Object.freeze({path: closeButton.path, bytes: closeButton.bytes,
        sha256: closeButton.sha256})}),
    interaction: Object.freeze({
      stopFrame: 129,
      resumeFrame: 130,
      terminalStopFrame: 188,
      sourceGroups: Object.freeze({
        proportional: Object.freeze(['drag-2', 'drag-4']),
        nonProportional: Object.freeze(['drag-1', 'drag-3']),
      }),
      targetGroups: Object.freeze({
        proportional: Object.freeze(['Drop_mc1', 'Drop_mc2']),
        nonProportional: Object.freeze(['Drop_mc3', 'Drop_mc4']),
      }),
      drags,
      completionCounter: '_global.quizDragCount',
      completionThreshold: 4,
      randomFeedbackAudioLabels: Object.freeze(['S1', 'S2', 'S3', 'S4']),
      feedbackText: Object.freeze({
        proportional: Object.freeze({path: '72.txt',
          bytes: proportionalFeedback.bytes,
          sha256: proportionalFeedback.sha256,
          normalized: normalizeText(proportionalFeedback.text
            .replaceAll('--- RECORDSEPARATOR ---', ' '))}),
        nonProportional: Object.freeze({path: '74.txt',
          bytes: nonProportionalFeedback.bytes,
          sha256: nonProportionalFeedback.sha256,
          normalized: normalizeText(nonProportionalFeedback.text
            .replaceAll('--- RECORDSEPARATOR ---', ' '))}),
      }),
    }),
    operationSequence: Object.freeze([
      'literal _global.KeyAttribute assignment',
      '_root.DoHyperLinks() typed modern host request',
      '_root.animation_mc.animation.stop() source playback pause',
      'frame 129 stops and resets quizDragCount',
      'four source cards are grouped by exact _droptarget rules',
      'wrong groups reset position and show group-specific source feedback',
      'four correct placements resume the source timeline at frame 130',
      'main animation reaches its exact authored terminal stop',
    ]),
    rootPreloaderStopPresent: true,
    mainTerminalStopPresent: true,
    childTimelineScriptCount: 13,
  });
}

async function stageSource(memberRoot, source) {
  await mkdir(memberRoot, {recursive: true});
  const target = path.join(memberRoot, 'source.swf');
  await writeFile(target, source.buffer, {flag: 'wx', mode: 0o444});
  await chmod(target, 0o444);
  const binding = await stableFile(target, {absolute: true});
  invariant(binding.buffer.equals(source.buffer),
    'staged compiler input copy drifted');
  return binding;
}

async function extractMember(toolchain, memberRoot, stagedSource) {
  const args = [...toolchain.prefixArgs, ...FFDEC_OPERATION_ARGS,
    memberRoot, stagedSource.path];
  const result = await runProcess(toolchain.command, args);
  return commandReceipt(result, args);
}

async function audioCandidates(page, sourceRoot) {
  invariant(Array.isArray(page.audioCueCandidates) &&
    page.audioCueCandidates.length === 1,
  `${page.animationId} catalog audio candidate count drifted`);
  const sourceStem = path.basename(page.viewPath, '.swf');
  const expectedAudioPath =
    `G6-G8-shared/ALG001/L9/SA/${sourceStem}.mp3`;
  const candidates = [];
  for (const cue of page.audioCueCandidates) {
    invariant(cue.acceptance === 'candidate-index-only' &&
      cue.required === null && cue.language === 'undetermined' &&
      cue.hostTrigger === 'pending-authorized-original-runtime' &&
      cue.viewPath === expectedAudioPath,
    `${page.animationId} audio cue contract drifted`);
    const source = await externalFile(sourceRoot, cue.viewPath,
      {bytes: cue.bytes, sha256: cue.sha256});
    candidates.push(Object.freeze({
      id: cue.id,
      binding: cue.binding,
      source: descriptor(source),
      language: cue.language,
      acceptance: cue.acceptance,
      hostTrigger: cue.hostTrigger,
      startSemantics: cue.startSemantics,
      stopOrCompleteSemantics: cue.stopOrCompleteSemantics,
      replayBehavior: cue.replayBehavior,
    }));
  }
  return Object.freeze(candidates);
}

async function directoryInventory(root) {
  const rows = [];
  const visit = async (current) => {
    const entries = await readdir(current, {withFileTypes: true});
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const target = path.join(current, entry.name);
      const relative = path.relative(root, target).split(path.sep).join('/');
      invariant(!entry.isSymbolicLink(),
        `generated inventory contains symlink: ${relative}`);
      if (entry.isDirectory()) {
        rows.push(Object.freeze({path: `${relative}/`, kind: 'directory'}));
        await visit(target);
      } else if (entry.isFile()) {
        const binding = await stableFile(target, {absolute: true});
        rows.push(Object.freeze({path: relative, kind: 'file',
          bytes: binding.bytes, sha256: binding.sha256}));
      } else invariant(false, `generated inventory special entry: ${relative}`);
    }
  };
  await visit(root);
  return Object.freeze(rows);
}

async function freezeTree(root) {
  const entries = await readdir(root, {withFileTypes: true});
  for (const entry of entries) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) await freezeTree(target);
    else if (entry.isFile()) await chmod(target, 0o444);
    else invariant(false, `cannot freeze special entry: ${target}`);
  }
  await chmod(root, 0o555);
}

async function thawTree(root) {
  await chmod(root, 0o755);
  const entries = await readdir(root, {withFileTypes: true});
  for (const entry of entries) {
    if (entry.isDirectory()) await thawTree(path.join(root, entry.name));
  }
}

async function verifyFrozenTree(root) {
  const visit = async (current) => {
    const metadata = await lstat(current, {bigint: true});
    invariant(metadata.isDirectory() && !metadata.isSymbolicLink() &&
      Number(metadata.mode & 0o777n) === 0o555,
    `${current} directory mode drifted`);
    for (const entry of await readdir(current, {withFileTypes: true})) {
      const target = path.join(current, entry.name);
      invariant(!entry.isSymbolicLink(), `${target} is a symlink`);
      if (entry.isDirectory()) await visit(target);
      else {
        const file = await lstat(target, {bigint: true});
        invariant(file.isFile() && file.nlink === 1n &&
          Number(file.mode & 0o777n) === 0o444,
        `${target} file custody drifted`);
      }
    }
  };
  await visit(root);
}

async function expectedArtifacts(stageRoot) {
  const recoveryCheck = await auditTs07L1Keyterms({check: true});
  invariant(recoveryCheck.check === true,
    'L1 key-term recovery no longer self-verifies');
  const [catalog, structural, predecessor, recovery, hostAudit,
    toolchainRun, generator, source, recoveryRoot] = await Promise.all([
    stableFile(CATALOG, {json: true}),
    stableFile(STRUCTURAL_INVENTORY, {json: true}),
    stableFile(PREDECESSOR, {json: true}),
    stableFile(KEY_TERM_RECOVERY, {json: true}),
    stableFile(HOST_AUDIT, {json: true}),
    stableFile(TOOLCHAIN_RUN, {json: true}),
    stableFile(path.relative(ROOT, SCRIPT_PATH)),
    checkedRoot(SOURCE_ENV, 'G6-G8-shared'),
    checkedRoot(RECOVERY_ENV, null, {requireReadOnly: false}),
  ]);
  invariant(predecessor.value.selectedPages?.length === 324 &&
    predecessor.value.registrationCandidatePlacementCount === 324 &&
    predecessor.value.deploymentScope === 'local-only',
  '324-page predecessor freeze drifted');
  invariant(recovery.value.recoveryId ===
      'g678-ts07-l1-keyterm-recovery-v1' &&
    recovery.value.selectedSources?.length === 2 &&
    recovery.value.custodyBoundary?.canonicalSourcePromotionAuthorized ===
      false && recovery.value.acceptanceEffects?.published === false,
  'L1 key-term recovery authority drifted');
  invariant(hostAudit.value.auditId === 'g678-ts02-family-audit-v1' &&
    hostAudit.value.glossaryHostReference?.provenStaticBehavior?.includes(
      'sets _global.Pause=true and _global.Play=false') &&
    hostAudit.value.acceptanceEffects?.published === false,
  'typed glossary host source authority drifted');

  const toolchain = await verifyToolchain(toolchainRun);
  const pageMap = new Map(catalog.value.lessons.flatMap((lesson) =>
    lesson.pages.map((page) => [page.animationId, {lesson, page}])));
  const structuralMap = new Map(structural.value.records.flatMap((record) =>
    record.placementIds.map((animationId) => [animationId, record])));
  const predecessorIds = new Set(predecessor.value.selectedPages.map((page) =>
    page.animationId));
  const selected = EXPECTED_MEMBERS.map((expected) => {
    const catalogRecord = pageMap.get(expected.animationId);
    const structuralRecord = structuralMap.get(expected.animationId);
    invariant(catalogRecord && structuralRecord &&
      !predecessorIds.has(expected.animationId) &&
      catalogRecord.lesson.stableLessonKey === expected.stableLessonKey &&
      catalogRecord.lesson.moduleCode === expected.moduleCode &&
      catalogRecord.lesson.lessonNumber === expected.lessonNumber &&
      catalogRecord.lesson.keyTerms.english ===
        'HELP_KEYTERMS/KT/XML/L1KTE01.xml' &&
      catalogRecord.lesson.keyTerms.spanish ===
        'HELP_KEYTERMS/KT/XML/L1KTS01.xml' &&
      catalogRecord.page.sectionCode === expected.sectionCode &&
      catalogRecord.page.sectionPageOrdinal === expected.sectionPageOrdinal &&
      catalogRecord.page.viewPath === expected.sourcePath &&
      catalogRecord.page.sourceBytes === expected.sourceBytes &&
      catalogRecord.page.sourceSha256 === expected.sourceSha256 &&
      structuralRecord.classification.mainFrameDomain ===
        expected.mainFrameDomain &&
      structuralRecord.classification.mainFrameCount ===
        expected.mainFrameCount &&
      structuralRecord.classification.buttonCount === expected.buttonCount &&
      structuralRecord.classification.rootScriptCount === 2 &&
      structuralRecord.classification.childScriptCount === 13 &&
      structuralRecord.classification.soundStreamHeadCount === 3 &&
      structuralRecord.classification.soundStreamBlockCount === 258,
    `${expected.animationId} fixed selection drifted`);
    return Object.freeze({...expected, catalogRecord});
  });
  invariant(selected.length === 1 &&
    selectedSet(selected).sha256 === EXPECTED_MEMBER_SET_SHA256,
  'ALG L9 VB06 drag fixed member set drifted');

  const recoverySources = new Map(recovery.value.selectedSources.map(
    (row) => [row.localeRole, row]));
  const keyTermBindings = {};
  for (const locale of ['en', 'es']) {
    const selectedSource = recoverySources.get(locale);
    invariant(selectedSource?.casObject?.path &&
      selectedSource.casObject.bytes > 0 &&
      /^[a-f0-9]{64}$/u.test(selectedSource.casObject.sha256),
    `${locale} recovered XML descriptor drifted`);
    keyTermBindings[locale] = await externalFile(recoveryRoot.root,
      selectedSource.casObject.path, selectedSource.casObject,
      {requireReadOnly: false});
  }
  const englishTerms = parseKeyTerms(
    keyTermBindings.en.buffer.toString('utf8'));
  const spanishTerms = parseKeyTerms(
    keyTermBindings.es.buffer.toString('utf8'));
  invariant(englishTerms.size === 657 && spanishTerms.size === 657,
    `L1 key-term XML entry denominator drifted: ${englishTerms.size}/${spanishTerms.size}`);

  const records = [];
  const allSourceKeys = [];
  for (const selectedMember of selected) {
    const sourceFile = await externalFile(source.root,
      selectedMember.sourcePath, {bytes: selectedMember.sourceBytes,
        sha256: selectedMember.sourceSha256});
    const memberRoot = path.join(stageRoot, 'members',
      selectedMember.animationId);
    const staged = await stageSource(memberRoot, sourceFile);
    const command = await extractMember(toolchain, memberRoot, staged);
    const sourceAfter = await externalFile(source.root,
      selectedMember.sourcePath, {bytes: selectedMember.sourceBytes,
        sha256: selectedMember.sourceSha256});
    invariant(sourceAfter.buffer.equals(sourceFile.buffer),
      `${selectedMember.animationId} source changed during extraction`);
    const facts = parseSwfSourceFacts(sourceFile.buffer);
    const structure = validateFacts(facts, selectedMember);
    const [scriptRows, textRows] = await Promise.all([
      exportedScripts(path.join(memberRoot, 'scripts')),
      exportedText(path.join(memberRoot, 'texts')),
    ]);
    const behavior = classifyScripts(scriptRows, textRows, structure,
      selectedMember);
    allSourceKeys.push(...behavior.buttons.map((button) =>
      button.sourceKeyAttribute));
    const audio = await audioCandidates(selectedMember.catalogRecord.page,
      source.root);
    records.push(Object.freeze({
      animationId: selectedMember.animationId,
      stableLessonKey: selectedMember.stableLessonKey,
      moduleCode: selectedMember.moduleCode,
      lessonNumber: selectedMember.lessonNumber,
      source: Object.freeze({path: selectedMember.sourcePath,
        bytes: sourceFile.bytes, sha256: sourceFile.sha256,
        mode: sourceFile.identity.mode, nlink: sourceFile.identity.nlink}),
      compilerInputCopy: Object.freeze({
        path: `${RUN_ROOT}/members/${selectedMember.animationId}/source.swf`,
        bytes: staged.bytes, sha256: staged.sha256, mode: 0o444,
      }),
      structure,
      behavior,
      audioCandidates: audio,
      audioCandidateSelectionEstablished: false,
      generationAuthorized: true,
    }));
  }
  await verifyToolchain(toolchainRun);
  records.sort((left, right) => compareText(left.animationId,
    right.animationId));
  const terms = resolveTerms(allSourceKeys, englishTerms, spanishTerms);
  const termMap = new Map(terms.map((term) => [term.normalizedKey, term]));
  for (const record of records) {
    for (const button of record.behavior.buttons) {
      invariant(termMap.has(normalizeKey(button.sourceKeyAttribute)),
        `${record.animationId} unresolved glossary source key`);
    }
  }
  const definitionConflictKeys = terms.filter((term) =>
    !term.definitionParity).map((term) => term.normalizedKey);
  const sourceKeyProjection = records.flatMap((record) =>
    record.behavior.buttons.map((button) => [record.animationId,
      button.characterId, button.firstFrame,
      button.sourceKeyAttribute].join('|'))).join('\n') + '\n';
  const inputs = Object.freeze({
    catalog: descriptor(catalog),
    structuralInventory: descriptor(structural),
    predecessorFreeze: descriptor(predecessor),
    keyTermRecovery: descriptor(recovery),
    glossaryHostAudit: descriptor(hostAudit),
    toolchainRun: descriptor(toolchainRun),
    generator: descriptor(generator),
  });
  const inventory = await directoryInventory(stageRoot);
  const inventoryBytes = stableBytes(inventory);
  await writeFile(path.join(stageRoot, 'output-inventory.json'),
    inventoryBytes, {flag: 'wx'});
  const run = Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-alg-l09-vb06-drag-family-audit-run-v1',
    runId: RUN_ID,
    status: 'complete-source-script-keyterm-and-audio-audit',
    inputs,
    sourceRoot: source.identity,
    recoveryRoot: recoveryRoot.identity,
    toolchain: Object.freeze({ffdec: toolchain.receipt}),
    auditedPlacementCount: 1,
    affectedLessonCount: 1,
    exactButtonScriptCount: records.reduce((sum, record) =>
      sum + record.behavior.buttons.length + 1, 0),
    recoveredGlossaryTermCount: terms.length,
    definitionConflictCount: definitionConflictKeys.length,
    localeSpecificDefinitionResolution: true,
    registrationCandidatePlacementCount: 1,
    productCalibrationPassed: false,
    scaleOutAuthorized: false,
    acceptanceEffects: FALSE_EFFECTS,
    outputInventory: Object.freeze({path: `${RUN_ROOT}/output-inventory.json`,
      bytes: inventoryBytes.length, sha256: sha256(inventoryBytes)}),
    records,
    terms,
  });
  const runBytes = stableBytes(run);
  await writeFile(path.join(stageRoot, 'run-manifest.json'), runBytes,
    {flag: 'wx'});
  const runBinding = Object.freeze({path: `${RUN_ROOT}/run-manifest.json`,
    bytes: runBytes.length, sha256: sha256(runBytes)});
  const audit = Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-alg-l09-vb06-drag-family-audit-v1',
    auditId: RUN_ID,
    status:
      'exact-1-vb06-grouped-drag-script-keyterm-audio-audit-registration-candidate',
    scope: Object.freeze({
      activePagePlacements: 2282,
      predecessorRegisteredCurrentJsPages: 324,
      selectedAlgL09Vb06DragPlacements: 1,
      affectedLessons: 1,
      exactButtonScripts: run.exactButtonScriptCount,
      recoveredGlossaryTerms: terms.length,
      courseShellsInMigrationScope: 0,
    }),
    inputs,
    compilerRun: runBinding,
    sourceRoot: source.identity,
    keyTermSources: Object.freeze({
      en: descriptor(keyTermBindings.en,
        recoverySources.get('en').casObject.path),
      es: descriptor(keyTermBindings.es,
        recoverySources.get('es').casObject.path),
    }),
    selectedMemberSetSha256: EXPECTED_MEMBER_SET_SHA256,
    sourceKeySetSha256: sha256(sourceKeyProjection),
    definitionConflictNormalizedKeys: Object.freeze(definitionConflictKeys),
    localeSpecificDefinitionResolution: Object.freeze({
      en: 'use the exact entry from the lesson-referenced L1KTE01.xml',
      es: 'use the exact entry from the lesson-referenced L1KTS01.xml',
      crossFileDifferencesPreserved: true,
      mergedOrInventedDefinitions: false,
    }),
    records,
    terms,
    registrationCandidatePlacementCount: 1,
    familyCalibrationPassed: false,
    scaleOutAuthorized: false,
    productBlockers: Object.freeze([
      'alg-l09-vb06-drag-browser-product-calibration-pending',
      'random-feedback-audio-runtime-and-listening-acceptance-pending',
      'external-narration-audio-selection-and-listening-acceptance-pending',
      'legacy-key-term-sublinks-and-example-swfs-not-implemented',
      'authoritative-original-runtime-not-established',
      'visual-fidelity-not-accepted',
    ]),
    acceptanceEffects: FALSE_EFFECTS,
  });
  return Object.freeze({run, runBytes, runBinding, audit,
    auditBytes: stableBytes(audit)});
}

async function compareRun(leftRoot, rightRoot) {
  const [left, right] = await Promise.all([
    directoryInventory(leftRoot), directoryInventory(rightRoot),
  ]);
  invariant(exact(left, right),
    'ALG L9 VB06 drag audit compiler run drifted');
  await verifyFrozenTree(rightRoot);
}

async function publishAudit(bytes) {
  const target = projectPath(OUTPUT);
  await writeFile(target, bytes, {flag: 'wx'});
  const created = await stableFile(OUTPUT);
  try {
    invariant(created.buffer.equals(bytes),
      'ALG L9 VB06 drag audit publication drifted');
  } catch (error) {
    const current = await stableFile(OUTPUT).catch(() => null);
    if (current && current.buffer.equals(bytes) &&
      exact(current.identity, created.identity)) await unlink(target);
    throw error;
  }
}

export async function auditG678AlgL09Vb06DragFamily(
  {check = false} = {},
) {
  const canonical = projectPath(RUN_ROOT);
  const stage = check
    ? `${canonical}.check-${process.pid}-${Date.now()}`
    : `${canonical}.staging-${process.pid}`;
  invariant(!await stat(stage).then(() => true, () => false),
    'ALG L9 VB06 drag audit staging path already exists');
  if (!check) {
    invariant(!await stat(canonical).then(() => true, () => false),
      `${RUN_ROOT} already exists`);
    invariant(!await stat(projectPath(OUTPUT)).then(() => true, () => false),
      `${OUTPUT} already exists`);
  }
  await mkdir(stage, {recursive: false});
  try {
    const result = await expectedArtifacts(stage);
    await freezeTree(stage);
    if (check) {
      const currentAudit = await stableFile(OUTPUT);
      invariant(currentAudit.buffer.equals(result.auditBytes),
        'ALG L9 VB06 drag audit artifact drifted');
      await compareRun(stage, canonical);
      await thawTree(stage);
      await rm(stage, {recursive: true});
    } else {
      await rename(stage, canonical);
      try {
        await publishAudit(result.auditBytes);
      } catch (error) {
        await chmod(canonical, 0o755).catch(() => {});
        await rename(canonical,
          `${canonical}.failed-tracked-publication-${Date.now()}`)
          .catch(() => {});
        throw error;
      }
    }
    return Object.freeze({
      check,
      output: OUTPUT,
      bytes: result.auditBytes.length,
      sha256: sha256(result.auditBytes),
      compilerRun: result.runBinding,
      auditedPlacementCount: 1,
      exactButtonScriptCount: result.run.exactButtonScriptCount,
      recoveredGlossaryTermCount: result.run.recoveredGlossaryTermCount,
      definitionConflictCount: result.run.definitionConflictCount,
      registrationCandidatePlacementCount: 1,
      productCalibrationPassed: false,
      acceptanceEffects: FALSE_EFFECTS,
    });
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
  invariant(args.length <= 1 &&
    (args.length === 0 || args[0] === '--check'),
  'usage: audit-g678-alg-l09-vb06-drag-family.mjs [--check]');
  auditG678AlgL09Vb06DragFamily({check: args.includes('--check')})
    .then((result) => process.stdout.write(
      `${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
