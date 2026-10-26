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
  'catalog/product-bridge-calibrations/g678-current-js-310-page-product-calibrated-registration-v1.json';
const KEY_TERM_RECOVERY = 'catalog/g678-ts07-l1-keyterm-recovery-v1.json';
const HOST_AUDIT = 'catalog/g678-ts02-family-audit-v1.json';
const TOOLCHAIN_RUN =
  'work/g678-shared-page-factory/g678-ts07-nms-l1-current-js-1-v1/run-manifest.json';
const OUTPUT = 'catalog/g678-alg-l09-simple-glossary-family-audit-v1.json';
const RUN_ID = 'g678-alg-l09-simple-glossary-family-audit-v1';
const RUN_ROOT = `work/g678-shared-page-factory/${RUN_ID}`;
const EXPECTED_MEMBER_SET_SHA256 =
  '4be8ad87992f1e783cd3fbf6829f1fb4e4e827544fa20e8687a997163e6b95eb';

const EXPECTED_MEMBERS = Object.freeze([
  ['shared-alg001-l09-p005', 'shared-alg001-l09', 'ALG001', 9,
    'G6-G8-shared/ALG001/L9/RW/L9RW05.swf', 238612,
    '41ca7e111ac5dbe32fddaef601e1263f546d106bd5d830bed20f94b9cfc4b5aa',
    'sprite-66', 688, 3, 'RW', 4],
  ['shared-alg001-l09-p010', 'shared-alg001-l09', 'ALG001', 9,
    'G6-G8-shared/ALG001/L9/VB/L9VB04.swf', 236999,
    '382a32cf6f28e548de2a6028943597c5a7f732010098cb91a12eb6c99ccd8abf',
    'sprite-59', 639, 6, 'VB', 3],
  ['shared-alg001-l09-p011', 'shared-alg001-l09', 'ALG001', 9,
    'G6-G8-shared/ALG001/L9/VB/L9VB05.swf', 330488,
    '13864876e6364ffa823c5b6567f5b18e93c45f1e378fd0a184e4ad36d5afecc3',
    'sprite-63', 935, 7, 'VB', 4],
  ['shared-alg001-l09-p013', 'shared-alg001-l09', 'ALG001', 9,
    'G6-G8-shared/ALG001/L9/VB/L9VB07.swf', 245605,
    'ffe625b2b429d55c25a9b9e02ab185196442d21940e7daa83bab00bc93ba775f',
    'sprite-60', 355, 3, 'VB', 6],
  ['shared-alg001-l09-p015', 'shared-alg001-l09', 'ALG001', 9,
    'G6-G8-shared/ALG001/L9/IN/L9IN03.swf', 112263,
    '5b1b9540d2838458da307fb46955772fe15e3b0789b1e3f3acac0c79b3d07529',
    'sprite-40', 361, 2, 'IN', 2],
  ['shared-alg001-l09-p017', 'shared-alg001-l09', 'ALG001', 9,
    'G6-G8-shared/ALG001/L9/IN/L9IN05.swf', 337490,
    'c8eeb6ed17c453f607b11c8dbecfff2ec547234b0c0e1064fbc66859e7111f5d',
    'sprite-51', 1026, 5, 'IN', 4],
  ['shared-alg001-l09-p019', 'shared-alg001-l09', 'ALG001', 9,
    'G6-G8-shared/ALG001/L9/IN/L9IN07.swf', 290517,
    'bbe503704cf2e5f1c63efbb50fe2351e0cd44d47b4c26afbd95bf512c70eee69',
    'sprite-38', 927, 3, 'IN', 6],
  ['shared-alg001-l09-p021', 'shared-alg001-l09', 'ALG001', 9,
    'G6-G8-shared/ALG001/L9/IN/L9IN09.swf', 329290,
    '06ecfd5081aa7f13291c36ff69d854a684a179caea52cf15a257fa01be788c04',
    'sprite-59', 999, 4, 'IN', 8],
  ['shared-alg001-l09-p023', 'shared-alg001-l09', 'ALG001', 9,
    'G6-G8-shared/ALG001/L9/IN/L9IN11.swf', 325451,
    'a2edf94347d394712b135da10b9384f124904ce469f57a94e941afa3be9faf58',
    'sprite-103', 934, 1, 'IN', 10],
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
  '-format', 'script:as', '-export', 'script',
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
      `${key} must be absent for the ALG L9 simple-glossary audit`);
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
    facts.actionScript.tagCounts.DoAction === 2 &&
    facts.actionScript.tagCounts.DoInitAction === 0 &&
    facts.actionScript.tagCounts.DoABC === 0 &&
    facts.actionScript.tagCounts.DoABCDefine === 0 &&
    (facts.tagCounts.DefineButton ?? 0) === 0 &&
    facts.tagCounts.DefineButton2 === expected.buttonCount &&
    facts.audio.tagCounts.SoundStreamHead === 1 &&
    facts.audio.tagCounts.SoundStreamHead2 === 0 &&
    facts.audio.tagCounts.DefineSound === 0 &&
    facts.audio.tagCounts.StartSound === 0 &&
    facts.audio.tagCounts.StartSound2 === 0 &&
    facts.linkageAndImports.importedAssets.length === 0 &&
    facts.linkageAndImports.exportedAssets.length === 0 &&
    facts.linkageAndImports.symbolClasses.length === 0 &&
    root?.scriptTagCount === 2 && main?.declaredFrameCount ===
      expected.mainFrameCount && main.scriptTagCount === 0,
  `${expected.animationId} source structure drifted`);
  const rootEdge = root.placementEdges.find((edge) =>
    edge.childSpriteId === main.spriteId);
  const buttonEdges = main.placementEdges.filter((edge) =>
    edge.characterType === 'DefineButton2').sort((left, right) =>
    left.characterId - right.characterId);
  invariant(rootEdge?.firstFrame === 6 &&
    buttonEdges.length === expected.buttonCount &&
    buttonEdges.every((edge) => edge.firstFrame > 0 &&
      edge.firstFrame <= expected.mainFrameCount),
  `${expected.animationId} placement graph drifted`);
  return Object.freeze({
    rootFrameCount: facts.header.rootFrameCount,
    mainObjectId: main.spriteId,
    mainFrameDomain: main.domainId,
    mainFrameCount: main.declaredFrameCount,
    buttonCharacterIds: Object.freeze(buttonEdges.map((edge) =>
      edge.characterId)),
    buttonFirstFrames: Object.freeze(buttonEdges.map((edge) =>
      edge.firstFrame)),
    soundStreamBlockCount: facts.audio.tagCounts.SoundStreamBlock,
    sourceStructureFingerprintSha256: facts.structureFingerprintSha256,
  });
}

function classifyScripts(rows, structure, expected) {
  invariant(rows.length === expected.buttonCount + 2,
    `${expected.animationId} exact script count drifted`);
  const frameOne = rows.find((row) => row.path === 'frame_1/DoAction.as');
  const frameSix = rows.find((row) => row.path === 'frame_6/DoAction.as');
  invariant(frameOne?.text === ROOT_PRELOADER_AND_STOP &&
    frameSix?.text === STOP,
  `${expected.animationId} root script contract drifted`);
  const buttons = rows.filter((row) =>
    /^DefineButton2_\d+\/BUTTONCONDACTION on\(release\)\.as$/u
      .test(row.path)).map((row) => {
    const match = row.text.match(
      /^on\(release\)\{\r\n\s*_global\.KeyAttribute = "([^"]+)";\r\n\s*_root\.DoHyperLinks\(\);\r\n\s*_root\.animation_mc\.animation\.stop\(\);\r\n\}\r\n$/u,
    );
    invariant(match, `${expected.animationId} button script drifted`);
    return Object.freeze({
      characterId: Number(row.path.match(/^DefineButton2_(\d+)\//u)[1]),
      sourceKeyAttribute: match[1],
      script: Object.freeze({path: row.path, bytes: row.bytes,
        sha256: row.sha256}),
    });
  }).sort((left, right) => left.characterId - right.characterId);
  invariant(buttons.length === expected.buttonCount &&
    exact(buttons.map((button) => button.characterId),
      structure.buttonCharacterIds),
  `${expected.animationId} button/script identity drifted`);
  return Object.freeze({
    exactScripts: inventoryProjection(rows),
    buttons: Object.freeze(buttons.map((button, index) => Object.freeze({
      ...button,
      firstFrame: structure.buttonFirstFrames[index],
    }))),
    operationSequence: Object.freeze([
      'literal _global.KeyAttribute assignment',
      '_root.DoHyperLinks() typed modern host request',
      '_root.animation_mc.animation.stop() source playback pause',
    ]),
    rootPreloaderStopPresent: true,
    childTimelineScriptCount: 0,
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
  invariant(predecessor.value.selectedPages?.length === 310 &&
    predecessor.value.registrationCandidatePlacementCount === 310 &&
    predecessor.value.deploymentScope === 'local-only',
  '310-page predecessor freeze drifted');
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
      structuralRecord.classification.childScriptCount === 0,
    `${expected.animationId} fixed selection drifted`);
    return Object.freeze({...expected, catalogRecord});
  });
  invariant(selected.length === 9 &&
    selectedSet(selected).sha256 === EXPECTED_MEMBER_SET_SHA256,
  'ALG L9 simple-glossary fixed member set drifted');

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
    const scriptRows = await exportedScripts(path.join(memberRoot, 'scripts'));
    const behavior = classifyScripts(scriptRows, structure, selectedMember);
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
    artifactType: 'g678-alg-l09-simple-glossary-family-audit-run-v1',
    runId: RUN_ID,
    status: 'complete-source-script-keyterm-and-audio-audit',
    inputs,
    sourceRoot: source.identity,
    recoveryRoot: recoveryRoot.identity,
    toolchain: Object.freeze({ffdec: toolchain.receipt}),
    auditedPlacementCount: 9,
    affectedLessonCount: 1,
    exactButtonScriptCount: records.reduce((sum, record) =>
      sum + record.behavior.buttons.length, 0),
    recoveredGlossaryTermCount: terms.length,
    definitionConflictCount: definitionConflictKeys.length,
    localeSpecificDefinitionResolution: true,
    registrationCandidatePlacementCount: 9,
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
    artifactType: 'g678-alg-l09-simple-glossary-family-audit-v1',
    auditId: RUN_ID,
    status:
      'exact-9-source-script-keyterm-audio-audit-registration-candidate',
    scope: Object.freeze({
      activePagePlacements: 2282,
      predecessorRegisteredCurrentJsPages: 310,
      selectedAlgL09SimpleGlossaryPlacements: 9,
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
    registrationCandidatePlacementCount: 9,
    familyCalibrationPassed: false,
    scaleOutAuthorized: false,
    productBlockers: Object.freeze([
      'alg-l09-simple-glossary-browser-product-calibration-pending',
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
    'ALG L9 simple-glossary audit compiler run drifted');
  await verifyFrozenTree(rightRoot);
}

async function publishAudit(bytes) {
  const target = projectPath(OUTPUT);
  await writeFile(target, bytes, {flag: 'wx'});
  const created = await stableFile(OUTPUT);
  try {
    invariant(created.buffer.equals(bytes),
      'ALG L9 simple-glossary audit publication drifted');
  } catch (error) {
    const current = await stableFile(OUTPUT).catch(() => null);
    if (current && current.buffer.equals(bytes) &&
      exact(current.identity, created.identity)) await unlink(target);
    throw error;
  }
}

export async function auditG678AlgL09SimpleGlossaryFamily(
  {check = false} = {},
) {
  const canonical = projectPath(RUN_ROOT);
  const stage = check
    ? `${canonical}.check-${process.pid}-${Date.now()}`
    : `${canonical}.staging-${process.pid}`;
  invariant(!await stat(stage).then(() => true, () => false),
    'ALG L9 simple-glossary audit staging path already exists');
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
        'ALG L9 simple-glossary audit artifact drifted');
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
      auditedPlacementCount: 9,
      exactButtonScriptCount: result.run.exactButtonScriptCount,
      recoveredGlossaryTermCount: result.run.recoveredGlossaryTermCount,
      definitionConflictCount: result.run.definitionConflictCount,
      registrationCandidatePlacementCount: 9,
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
  'usage: audit-g678-alg-l09-simple-glossary-family.mjs [--check]');
  auditG678AlgL09SimpleGlossaryFamily({check: args.includes('--check')})
    .then((result) => process.stdout.write(
      `${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
