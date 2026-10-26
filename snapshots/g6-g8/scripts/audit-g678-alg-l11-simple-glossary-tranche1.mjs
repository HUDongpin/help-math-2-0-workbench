#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {
  chmod, lstat, mkdir, readFile, readdir, realpath, rename, rm, stat,
  unlink, writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {parseSwfSourceFacts} from './build-g4-l3-machine-source-audits.mjs';
import {auditTs07L1Keyterms} from './audit-g678-ts07-l1-keyterms.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SOURCE_ENV = 'HELP_MATH_G678_SOURCE_ROOT';
const RECOVERY_ENV = 'PRIVATE_RECOVERY_CONTAINERS';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const STRUCTURAL = 'catalog/g678-pure-linear-structural-inventory-v1.json';
const KEY_TERM_RECOVERY = 'catalog/g678-ts07-l1-keyterm-recovery-v1.json';
const TOOLCHAIN_RUN =
  'work/g678-shared-page-factory/g678-ts07-nms-l1-current-js-1-v1/run-manifest.json';
const OUTPUT = 'catalog/g678-alg-l11-simple-glossary-tranche1-audit-v1.json';
const RUN_ID = 'g678-alg-l11-simple-glossary-tranche1-audit-v1';
const RUN_ROOT = `work/g678-shared-page-factory/${RUN_ID}`;
const EXPECTED_SET_SHA256 =
  '238408b999943379615d873dc7e89ef064b4e4468a709fcf93559f0fcfd38d93';

const MEMBERS = Object.freeze([
  ['shared-alg001-l11-p007', 'VB', 3,
    'G6-G8-shared/ALG001/L11/VB/L11VB04.swf', 191388,
    '9880866bb3f5b6add5bdbe5ea7b8509a6ae01ee6ff573c3eff3b2211f5b814e5',
    'sprite-51', 507, 5],
  ['shared-alg001-l11-p013', 'IN', 2,
    'G6-G8-shared/ALG001/L11/IN/L11IN03.swf', 88379,
    '993e638328b1d5109b2d0855b03e32ab3ace81bbac28df80ce66daec9aaf0374',
    'sprite-19', 205, 6],
  ['shared-alg001-l11-p016', 'IN', 5,
    'G6-G8-shared/ALG001/L11/IN/L11IN06.swf', 248835,
    '786e847b6ee75ab8e21852213250080fe41bb1a7c33d8da3cd9177fb9e9c882c',
    'sprite-27', 626, 4],
  ['shared-alg001-l11-p017', 'IN', 6,
    'G6-G8-shared/ALG001/L11/IN/L11IN07.swf', 213849,
    'e4421160be7fb56287e4cfeed729e470d397105dbcf5d5471b55508fc22730b7',
    'sprite-38', 525, 7],
  ['shared-alg001-l11-p018', 'IN', 7,
    'G6-G8-shared/ALG001/L11/IN/L11IN08.swf', 233150,
    'b6f1870dba3b6846556433525e775e6f5b1e61889db5e2a535392198c60ced62',
    'sprite-39', 569, 7],
  ['shared-alg001-l11-p022', 'IN', 11,
    'G6-G8-shared/ALG001/L11/IN/L11IN12.swf', 342826,
    '5e2b65a3658e07d358e8838b5d50296e300c1ae8c2e84b3f9596e1ce670a1a14',
    'sprite-50', 841, 1],
  ['shared-alg001-l11-p023', 'IN', 12,
    'G6-G8-shared/ALG001/L11/IN/L11IN13.swf', 216295,
    'aa54994646e02d3e80fd650f5e9e71cde61b48e9f3981d71c72069f72b43f19b',
    'sprite-59', 579, 5],
  ['shared-alg001-l11-p024', 'IN', 13,
    'G6-G8-shared/ALG001/L11/IN/L11IN14.swf', 159685,
    '9f6ef6b23238789d42978dcbb5a8307480288b0af02ce58653284b18b53170fc',
    'sprite-44', 418, 5],
].map((row) => Object.freeze({
  animationId: row[0], stableLessonKey: 'shared-alg001-l11',
  moduleCode: 'ALG001', lessonNumber: 11, sectionCode: row[1],
  sectionPageOrdinal: row[2], sourcePath: row[3], sourceBytes: row[4],
  sourceSha256: row[5], mainFrameDomain: row[6], mainFrameCount: row[7],
  buttonCount: row[8],
})));

const CRITICAL_ENVIRONMENT = Object.freeze([
  'FFDEC_JARFILENAME', 'FFDEC_MEMORY', 'FFDEC_STACK_SIZE',
  'JAVA_TOOL_OPTIONS', 'JDK_JAVA_OPTIONS', '_JAVA_OPTIONS', 'CLASSPATH',
]);
const FFDEC_ARGS = Object.freeze([
  '-config', 'packJavaScripts=false', '-onerror', 'abort', '-timeout', '120',
  '-exportTimeout', '600', '-format', 'script:as,text:txt', '-export',
  'script,text',
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
const ROOT_PRELOADER_STOP =
  '_level0.InternalPreloader.gotoAndPlay("jump_check");\r\nstop();\r\n';
const STOP = 'stop();\r\n';

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

async function checkedRoot(environmentName, childName = null,
  {readOnly = true} = {}) {
  const requested = process.env[environmentName];
  invariant(typeof requested === 'string' && requested.length > 0,
    `${environmentName} is required`);
  const root = path.resolve(requested);
  const [canonical, metadata] = await Promise.all([
    realpath(root), lstat(root, {bigint: true}),
  ]);
  invariant(canonical === root && metadata.isDirectory() &&
    !metadata.isSymbolicLink() && (!readOnly || (metadata.mode & 0o222n) === 0n),
  `${environmentName} must be one canonical ${readOnly ? 'read-only ' : ''}directory`);
  const child = childName ? path.join(root, childName) : root;
  const [childCanonical, childMetadata] = await Promise.all([
    realpath(child), lstat(child, {bigint: true}),
  ]);
  invariant(childCanonical === child && childMetadata.isDirectory() &&
    !childMetadata.isSymbolicLink() &&
    (!readOnly || (childMetadata.mode & 0o222n) === 0n),
  `${environmentName}/${childName ?? ''} custody drifted`);
  return Object.freeze({root, child, identity: Object.freeze({
    realPathSha256: sha256(root), device: String(metadata.dev),
    inode: String(metadata.ino), mode: Number(metadata.mode & 0o777n),
    childRealPathSha256: sha256(child), childDevice: String(childMetadata.dev),
    childInode: String(childMetadata.ino),
    childMode: Number(childMetadata.mode & 0o777n),
  })});
}

async function verifyDirectoryChain(anchor, targetParent, readOnly) {
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
      !metadata.isSymbolicLink() && (!readOnly || (metadata.mode & 0o222n) === 0n),
    `${cursor} directory custody drifted`);
  }
}

async function externalFile(root, relativePath, expected,
  {readOnly = true} = {}) {
  const components = relativePath.split('/');
  invariant(components.every((item) => item && item !== '.' && item !== '..'),
    `${relativePath} is noncanonical`);
  const target = path.join(root, ...components);
  invariant(target.startsWith(`${root}${path.sep}`),
    `${relativePath} escapes source root`);
  await verifyDirectoryChain(root, path.dirname(target), readOnly);
  const binding = await stableFile(target, {absolute: true});
  invariant((!readOnly || (binding.identity.mode & 0o222) === 0) &&
    binding.bytes === expected.bytes && binding.sha256 === expected.sha256,
  `${relativePath} identity drifted`);
  return Object.freeze({...binding, path: relativePath});
}

async function verifyToolchain(toolchainRun) {
  for (const key of CRITICAL_ENVIRONMENT) {
    invariant(process.env[key] === undefined,
      `${key} must be absent for ALG L11 glossary audit`);
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
    receipt: Object.freeze({execution: ffdec.execution,
      java: Object.freeze({bytes: ffdec.java.bytes, sha256: ffdec.java.sha256}),
      jar: Object.freeze({bytes: ffdec.jar.bytes, sha256: ffdec.jar.sha256}),
      classPathFileCount: ffdec.jarManifest.classPath.length,
      classPathChecksumSetSha256: ffdec.jarManifest.classPathChecksumSetSha256,
      criticalEnvironmentVariablesRequiredUnset: CRITICAL_ENVIRONMENT,
      operationArgs: FFDEC_ARGS}),
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

async function walk(root, current = root, rows = []) {
  const entries = await readdir(current, {withFileTypes: true});
  entries.sort((left, right) => compareText(left.name, right.name));
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    invariant(!entry.isSymbolicLink(), `generated symlink: ${absolute}`);
    if (entry.isDirectory()) await walk(root, absolute, rows);
    else if (entry.isFile()) rows.push(absolute);
    else invariant(false, `generated special entry: ${absolute}`);
  }
  return rows;
}

async function exportedFiles(root) {
  const rows = [];
  for (const absolute of await walk(root)) {
    const file = await stableFile(absolute, {absolute: true});
    rows.push(Object.freeze({path: path.relative(root, absolute)
      .split(path.sep).join('/'), bytes: file.bytes, sha256: file.sha256,
    text: file.buffer.toString('utf8')}));
  }
  return Object.freeze(rows.sort((left, right) =>
    compareText(left.path, right.path)));
}

function inventory(rows) {
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

const RESTRICTED_MATH_ENTITIES = Object.freeze(new Map([
  ['003c', '<'],
  ['003e', '>'],
  ['2260', '≠'],
  ['2264', '≤'],
  ['2265', '≥'],
]));

function decodeRestrictedMathEntities(value, sourceKeyAttribute) {
  const decoded = value.replace(/&#x([0-9A-Fa-f]{4});/gu,
    (entity, hexadecimal) => {
      const replacement = RESTRICTED_MATH_ENTITIES.get(
        hexadecimal.toLowerCase());
      invariant(replacement !== undefined,
        `${sourceKeyAttribute} contains unsupported numeric entity ${entity}`);
      return replacement;
    }).replaceAll('&gt;', '>').replaceAll('&lt;', '<');
  invariant(!/&#x|&gt;|&lt;/iu.test(decoded),
    `${sourceKeyAttribute} retains an undecoded math entity`);
  return decoded;
}

function parseKeyTerms(xmlText) {
  const entries = new Map();
  const pattern = /<([^\s>]+~LNG~[^\s>]+)\s+([^>]*)>([\s\S]*?)<\/\1\s*>/giu;
  for (const match of xmlText.matchAll(pattern)) {
    const attributes = Object.fromEntries([...match[2].matchAll(
      /([A-Za-z]+)\s*=\s*"([^"]*)"/gu,
    )].map((attribute) => [attribute[1], attribute[2]]));
    if (!attributes.ScreenkeyTerm) continue;
    const definitions = match[3].split('~LNG~');
    invariant(definitions.length === 2 && attributes.ExFileName?.endsWith('.swf'),
      `${attributes.ScreenkeyTerm} key-term entry shape drifted`);
    const key = normalizeKey(attributes.ScreenkeyTerm);
    const existing = entries.get(key) ?? [];
    existing.push(Object.freeze({
      elementLabel: match[1].split('~LNG~')[0].replaceAll('~', ' ').trim(),
      sourceKeyAttribute: attributes.ScreenkeyTerm,
      spanishLabel: match[1].split('~LNG~')[1].replaceAll('~', ' ').trim(),
      definitions: Object.freeze({en: normalizeText(definitions[0]),
        es: normalizeText(definitions[1])}),
      legacyCompanionReferences: Object.freeze({
        subLinksEn: (attributes.SubLinkEng ?? '').split('~').filter(Boolean),
        subLinksEs: (attributes.SubLinkSpan ?? '').split('~').filter(Boolean),
        exampleSwf: attributes.ExFileName,
      }),
      exactEntrySha256: sha256(match[0]),
    }));
    entries.set(key, existing);
  }
  return entries;
}

function resolveTerms(sourceKeys, englishTerms, spanishTerms) {
  return Object.freeze([...new Set(sourceKeys.map(normalizeKey))]
    .sort(compareText).map((normalizedKey) => {
      const englishAll = englishTerms.get(normalizedKey) ?? [];
      const spanishAll = spanishTerms.get(normalizedKey) ?? [];
      const english = englishAll.filter((entry) =>
        normalizeKey(entry.elementLabel) === normalizedKey);
      const spanish = spanishAll.filter((entry) =>
        normalizeKey(entry.elementLabel) === normalizedKey);
      invariant(english.length === 1 && spanish.length === 1,
        `${normalizedKey} must have one exact L1 entry per locale`);
      const left = english[0];
      const right = spanish[0];
      const leftDefinitions = Object.freeze({
        en: decodeRestrictedMathEntities(left.definitions.en,
          left.sourceKeyAttribute),
        es: decodeRestrictedMathEntities(left.definitions.es,
          left.sourceKeyAttribute),
      });
      const rightDefinitions = Object.freeze({
        en: decodeRestrictedMathEntities(right.definitions.en,
          right.sourceKeyAttribute),
        es: decodeRestrictedMathEntities(right.definitions.es,
          right.sourceKeyAttribute),
      });
      const id = normalizedKey.replace(/[^a-z0-9]+/gu, '-')
        .replace(/(^-|-$)/gu, '');
      invariant(id.length > 0, `${normalizedKey} has no stable ID`);
      return Object.freeze({id, normalizedKey,
        sourceKeyAttribute: left.sourceKeyAttribute,
        labels: Object.freeze({en: left.sourceKeyAttribute,
          es: right.spanishLabel}),
        definitions: Object.freeze({en: leftDefinitions.en,
          es: rightDefinitions.es}),
        definitionParity: JSON.stringify(leftDefinitions) ===
          JSON.stringify(rightDefinitions),
        definitionVariants: Object.freeze({englishXml: leftDefinitions,
          spanishXml: rightDefinitions}),
        legacyCompanionReferences: Object.freeze({
          en: left.legacyCompanionReferences,
          es: right.legacyCompanionReferences}),
        sourceEntrySha256: Object.freeze({en: left.exactEntrySha256,
          es: right.exactEntrySha256}),
        sourceCollisionResolution: Object.freeze({
          rule: 'element label must normalize to the exact KeyAttribute',
          sourceEntryCounts: Object.freeze({en: englishAll.length,
            es: spanishAll.length}),
          rejectedMismatchedEntries: Object.freeze({
            en: englishAll.filter((entry) => entry !== left).map((entry) =>
              Object.freeze({elementLabel: entry.elementLabel,
                exampleSwf: entry.legacyCompanionReferences.exampleSwf,
                sourceEntrySha256: entry.exactEntrySha256})),
            es: spanishAll.filter((entry) => entry !== right).map((entry) =>
              Object.freeze({elementLabel: entry.elementLabel,
                exampleSwf: entry.legacyCompanionReferences.exampleSwf,
                sourceEntrySha256: entry.exactEntrySha256})),
          }),
        }),
      });
    }));
}

function memberSetSha256(rows) {
  const projection = [...rows].sort((left, right) =>
    compareText(left.animationId, right.animationId)).map((row) => [
    row.animationId, row.stableLessonKey, row.moduleCode, row.lessonNumber,
    row.sourcePath, row.sourceBytes, row.sourceSha256, row.mainFrameDomain,
    row.mainFrameCount, row.buttonCount,
  ].join('|')).join('\n') + '\n';
  return sha256(projection);
}

function validateStructure(facts, expected) {
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
    root?.scriptTagCount === 2 &&
    main?.declaredFrameCount === expected.mainFrameCount &&
    main.scriptTagCount === 0,
  `${expected.animationId} source structure drifted`);
  const rootEdge = root.placementEdges.find((edge) =>
    edge.childSpriteId === main.spriteId);
  const buttons = main.placementEdges.filter((edge) =>
    edge.characterType === 'DefineButton2').sort((left, right) =>
    left.characterId - right.characterId);
  invariant(rootEdge?.firstFrame === 6 &&
    buttons.length === expected.buttonCount &&
    buttons.every((edge) => edge.firstFrame >= 1 &&
      edge.firstFrame <= expected.mainFrameCount),
  `${expected.animationId} placement graph drifted`);
  return Object.freeze({rootFrameCount: facts.header.rootFrameCount,
    mainObjectId: main.spriteId, mainFrameDomain: main.domainId,
    mainFrameCount: main.declaredFrameCount,
    buttonCharacterIds: Object.freeze(buttons.map((edge) => edge.characterId)),
    buttonFirstFrames: Object.freeze(buttons.map((edge) => edge.firstFrame)),
    defineTextCharacterCount: facts.tagCounts.DefineText ?? 0,
    soundStreamBlockCount: facts.audio.tagCounts.SoundStreamBlock,
    childTimelineScriptCount: 0,
    structureFingerprintSha256: facts.structureFingerprintSha256});
}

function classifyScripts(rows, structure, expected) {
  invariant(rows.length === expected.buttonCount + 2,
    `${expected.animationId} exact script count drifted`);
  invariant(rows.find((row) => row.path === 'frame_1/DoAction.as')?.text ===
    ROOT_PRELOADER_STOP &&
    rows.find((row) => row.path === 'frame_6/DoAction.as')?.text === STOP,
  `${expected.animationId} root stop contract drifted`);
  const buttons = rows.filter((row) =>
    /^DefineButton2_\d+\/BUTTONCONDACTION on\(release\)\.as$/u.test(row.path))
    .map((row) => {
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
    JSON.stringify(buttons.map((button) => button.characterId)) ===
      JSON.stringify(structure.buttonCharacterIds),
  `${expected.animationId} button character/script identity drifted`);
  return Object.freeze({exactScripts: inventory(rows),
    buttons: Object.freeze(buttons.map((button, index) => Object.freeze({
      ...button, firstFrame: structure.buttonFirstFrames[index],
    }))),
    operationSequence: Object.freeze([
      'literal _global.KeyAttribute assignment',
      '_root.DoHyperLinks() typed modern glossary request',
      '_root.animation_mc.animation.stop() source playback pause',
    ]),
    rootPreloaderStopPresent: true, childTimelineScriptCount: 0});
}

function classifyText(rows, structure, expected) {
  invariant(rows.length === structure.defineTextCharacterCount,
    `${expected.animationId} DefineText export denominator drifted`);
  const characters = rows.map((row) => {
    const match = row.path.match(/^(\d+)\.txt$/u);
    invariant(match, `${expected.animationId} non-character text export`);
    return Object.freeze({characterId: Number(match[1]), path: row.path,
      bytes: row.bytes, sha256: row.sha256,
      sourceText: normalizeText(row.text.replaceAll('--- RECORDSEPARATOR ---', ' ')),
    });
  }).sort((left, right) => left.characterId - right.characterId);
  invariant(new Set(characters.map((row) => row.characterId)).size ===
    characters.length, `${expected.animationId} repeated text character ID`);
  return Object.freeze({exactTextExports: inventory(rows),
    characterCount: characters.length, characters,
    sourceTextProjectionSha256: sha256(characters.map((row) =>
      `${row.characterId}|${row.sourceText}`).join('\n') + '\n')});
}

async function audioCandidates(page, sourceRoot) {
  invariant(page.audioCueCandidates?.length === 1,
    `${page.animationId} audio candidate count drifted`);
  const expected = `G6-G8-shared/ALG001/L11/SA/${path.basename(
    page.viewPath, '.swf')}.mp3`;
  const cue = page.audioCueCandidates[0];
  invariant(cue.acceptance === 'candidate-index-only' &&
    cue.required === null && cue.language === 'undetermined' &&
    cue.hostTrigger === 'pending-authorized-original-runtime' &&
    cue.viewPath === expected,
  `${page.animationId} audio candidate contract drifted`);
  const source = await externalFile(sourceRoot, cue.viewPath,
    {bytes: cue.bytes, sha256: cue.sha256});
  return Object.freeze([{id: cue.id, binding: cue.binding,
    source: descriptor(source), language: cue.language,
    acceptance: cue.acceptance, hostTrigger: cue.hostTrigger,
    startSemantics: cue.startSemantics,
    stopOrCompleteSemantics: cue.stopOrCompleteSemantics,
    replayBehavior: cue.replayBehavior}]);
}

async function directoryInventory(root) {
  const rows = [];
  const visit = async (current) => {
    const entries = await readdir(current, {withFileTypes: true});
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const target = path.join(current, entry.name);
      const relative = path.relative(root, target).split(path.sep).join('/');
      invariant(!entry.isSymbolicLink(), `generated symlink: ${relative}`);
      if (entry.isDirectory()) {
        rows.push(Object.freeze({path: `${relative}/`, kind: 'directory'}));
        await visit(target);
      } else if (entry.isFile()) {
        const binding = await stableFile(target, {absolute: true});
        rows.push(Object.freeze({path: relative, kind: 'file',
          bytes: binding.bytes, sha256: binding.sha256}));
      } else invariant(false, `generated special entry: ${relative}`);
    }
  };
  await visit(root);
  return Object.freeze(rows);
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
    if (entry.isDirectory()) await thawTree(path.join(root, entry.name));
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

async function expectedArtifacts(stageRoot) {
  const recoveryCheck = await auditTs07L1Keyterms({check: true});
  invariant(recoveryCheck.check === true,
    'L1 key-term recovery no longer self-verifies');
  const [catalog, structural, recovery, toolchainRun, generator, source,
    recoveryRoot] = await Promise.all([
    stableFile(CATALOG, {json: true}),
    stableFile(STRUCTURAL, {json: true}),
    stableFile(KEY_TERM_RECOVERY, {json: true}),
    stableFile(TOOLCHAIN_RUN, {json: true}),
    stableFile(path.relative(ROOT, SCRIPT_PATH)),
    checkedRoot(SOURCE_ENV, 'G6-G8-shared'),
    checkedRoot(RECOVERY_ENV, null, {readOnly: false}),
  ]);
  invariant(memberSetSha256(MEMBERS) === EXPECTED_SET_SHA256,
    'ALG L11 tranche1 fixed member set drifted');
  invariant(recovery.value.recoveryId === 'g678-ts07-l1-keyterm-recovery-v1' &&
    recovery.value.selectedSources?.length === 2 &&
    recovery.value.custodyBoundary?.canonicalSourcePromotionAuthorized === false &&
    recovery.value.acceptanceEffects?.published === false,
  'L1 missing-keyterm recovery boundary drifted');
  const toolchain = await verifyToolchain(toolchainRun);
  const pageMap = new Map(catalog.value.lessons.flatMap((lesson) =>
    lesson.pages.map((page) => [page.animationId, {lesson, page}])));
  const structuralMap = new Map(structural.value.records.flatMap((record) =>
    record.placementIds.map((animationId) => [animationId, record])));
  for (const expected of MEMBERS) {
    const entry = pageMap.get(expected.animationId);
    const record = structuralMap.get(expected.animationId);
    invariant(entry?.lesson.stableLessonKey === expected.stableLessonKey &&
      entry.lesson.moduleCode === expected.moduleCode &&
      entry.lesson.lessonNumber === expected.lessonNumber &&
      entry.lesson.keyTerms.english === 'HELP_KEYTERMS/KT/XML/L1KTE01.xml' &&
      entry.lesson.keyTerms.spanish === 'HELP_KEYTERMS/KT/XML/L1KTS01.xml' &&
      entry.page.sectionCode === expected.sectionCode &&
      entry.page.sectionPageOrdinal === expected.sectionPageOrdinal &&
      entry.page.viewPath === expected.sourcePath &&
      entry.page.sourceBytes === expected.sourceBytes &&
      entry.page.sourceSha256 === expected.sourceSha256 &&
      record?.classification.mainFrameDomain === expected.mainFrameDomain &&
      record.classification.mainFrameCount === expected.mainFrameCount &&
      record.classification.buttonCount === expected.buttonCount &&
      record.classification.rootScriptCount === 2 &&
      record.classification.childScriptCount === 0,
    `${expected.animationId} catalog/structural selection drifted`);
  }

  const recoveredSources = new Map(recovery.value.selectedSources.map((row) =>
    [row.localeRole, row]));
  const xmlBindings = {};
  for (const locale of ['en', 'es']) {
    const selected = recoveredSources.get(locale);
    invariant(selected?.casObject?.path && selected.casObject.bytes > 0,
      `${locale} recovered key-term XML descriptor drifted`);
    xmlBindings[locale] = await externalFile(recoveryRoot.root,
      selected.casObject.path, selected.casObject, {readOnly: false});
  }
  const englishTerms = parseKeyTerms(xmlBindings.en.buffer.toString('utf8'));
  const spanishTerms = parseKeyTerms(xmlBindings.es.buffer.toString('utf8'));
  invariant(englishTerms.size === 657 && spanishTerms.size === 657,
    `L1 XML term denominator drifted: ${englishTerms.size}/${spanishTerms.size}`);

  const records = [];
  const sourceKeys = [];
  for (const expected of MEMBERS) {
    const page = pageMap.get(expected.animationId).page;
    const sourceFile = await externalFile(source.root, expected.sourcePath,
      {bytes: expected.sourceBytes, sha256: expected.sourceSha256});
    const memberRoot = path.join(stageRoot, 'members', expected.animationId);
    await mkdir(memberRoot, {recursive: true});
    const stagedPath = path.join(memberRoot, 'source.swf');
    await writeFile(stagedPath, sourceFile.buffer, {flag: 'wx', mode: 0o444});
    await chmod(stagedPath, 0o444);
    const staged = await stableFile(stagedPath, {absolute: true});
    invariant(staged.buffer.equals(sourceFile.buffer),
      `${expected.animationId} compiler input copy drifted`);
    const args = [...toolchain.prefixArgs, ...FFDEC_ARGS, memberRoot, stagedPath];
    const result = await runProcess(toolchain.command, args);
    invariant(result.code === 0 && result.signal === null &&
      result.stderr.length === 0,
    `${expected.animationId} FFDec export failed: ${result.stderr.toString('utf8')}`);
    const sourceAfter = await externalFile(source.root, expected.sourcePath,
      {bytes: expected.sourceBytes, sha256: expected.sourceSha256});
    invariant(sourceAfter.buffer.equals(sourceFile.buffer),
      `${expected.animationId} source changed during extraction`);
    const structure = validateStructure(parseSwfSourceFacts(sourceFile.buffer),
      expected);
    const scripts = await exportedFiles(path.join(memberRoot, 'scripts'));
    const text = await exportedFiles(path.join(memberRoot, 'texts'));
    const behavior = classifyScripts(scripts, structure, expected);
    const sourceText = classifyText(text, structure, expected);
    sourceKeys.push(...behavior.buttons.map((button) =>
      button.sourceKeyAttribute));
    records.push(Object.freeze({animationId: expected.animationId,
      stableLessonKey: expected.stableLessonKey, moduleCode: 'ALG001',
      lessonNumber: 11,
      source: Object.freeze({path: expected.sourcePath,
        bytes: sourceFile.bytes, sha256: sourceFile.sha256,
        mode: sourceFile.identity.mode, nlink: sourceFile.identity.nlink}),
      compilerInputCopy: Object.freeze({
        path: `${RUN_ROOT}/members/${expected.animationId}/source.swf`,
        bytes: staged.bytes, sha256: staged.sha256, mode: 0o444}),
      compilerCommand: Object.freeze({command: '<BOUND_JAVA_EXECUTABLE>',
        operationArgs: FFDEC_ARGS, exitCode: 0,
        stdout: Object.freeze({captured: true, recorded: false,
          reason: 'FFDec progress contains volatile paths and timings'}),
        stderr: Object.freeze({bytes: 0, sha256: sha256(result.stderr)})}),
      structure, behavior, sourceText,
      audioCandidates: await audioCandidates(page, source.root),
      audioCandidateSelectionEstablished: false,
      generationAuthorized: true}));
  }
  await verifyToolchain(toolchainRun);
  records.sort((left, right) => compareText(left.animationId,
    right.animationId));
  const terms = resolveTerms(sourceKeys, englishTerms, spanishTerms);
  const termMap = new Map(terms.map((term) => [term.normalizedKey, term]));
  for (const record of records) {
    for (const button of record.behavior.buttons) {
      invariant(termMap.has(normalizeKey(button.sourceKeyAttribute)),
        `${record.animationId} unresolved L1 key-term target`);
    }
  }
  const sourceKeyProjection = records.flatMap((record) =>
    record.behavior.buttons.map((button) => [record.animationId,
      button.characterId, button.firstFrame, button.sourceKeyAttribute]
      .join('|'))).join('\n') + '\n';
  const inputs = Object.freeze({catalog: descriptor(catalog),
    structuralInventory: descriptor(structural),
    keyTermRecovery: descriptor(recovery), toolchainRun: descriptor(toolchainRun),
    generator: descriptor(generator)});
  const payloadInventory = await directoryInventory(stageRoot);
  const inventoryBytes = stableBytes(payloadInventory);
  await writeFile(path.join(stageRoot, 'output-inventory.json'),
    inventoryBytes, {flag: 'wx'});
  const run = Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l11-simple-glossary-tranche1-audit-run-v1',
    runId: RUN_ID, status: 'complete-source-script-text-keyterm-audit',
    inputs, sourceRoot: source.identity, recoveryRoot: recoveryRoot.identity,
    toolchain: Object.freeze({ffdec: toolchain.receipt}),
    auditedPlacementCount: 8, affectedLessonCount: 1,
    exactButtonScriptCount: records.reduce((sum, record) =>
      sum + record.behavior.buttons.length, 0),
    exactTextCharacterCount: records.reduce((sum, record) =>
      sum + record.sourceText.characterCount, 0),
    recoveredGlossaryTermCount: terms.length,
    registrationCandidatePlacementCount: 8,
    productCalibrationPassed: false, scaleOutAuthorized: false,
    acceptanceEffects: FALSE_EFFECTS,
    outputInventory: Object.freeze({path: `${RUN_ROOT}/output-inventory.json`,
      bytes: inventoryBytes.length, sha256: sha256(inventoryBytes)}),
    records, terms});
  const runBytes = stableBytes(run);
  await writeFile(path.join(stageRoot, 'run-manifest.json'), runBytes,
    {flag: 'wx'});
  const runBinding = Object.freeze({path: `${RUN_ROOT}/run-manifest.json`,
    bytes: runBytes.length, sha256: sha256(runBytes)});
  const audit = Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l11-simple-glossary-tranche1-audit-v1',
    auditId: RUN_ID,
    status: 'exact-8-source-script-text-keyterm-audit-unregistered-candidate',
    scope: Object.freeze({activePagePlacements: 2282,
      selectedAlgL11SimpleGlossaryPlacements: 8, affectedLessons: 1,
      exactButtonScripts: run.exactButtonScriptCount,
      exactTextCharacters: run.exactTextCharacterCount,
      recoveredGlossaryTerms: terms.length, courseShellsInMigrationScope: 0}),
    inputs, compilerRun: runBinding, sourceRoot: source.identity,
    keyTermSources: Object.freeze({
      en: descriptor(xmlBindings.en, recoveredSources.get('en').casObject.path),
      es: descriptor(xmlBindings.es, recoveredSources.get('es').casObject.path),
    }),
    missingKeytermRecoveryBoundary: Object.freeze({
      canonicalSourcePromotionAuthorized: false,
      recoveredXmlUse: 'work-only-exact-term-resolution',
      directReuseOfAlgL09TermPayloads: false,
      restrictedEntityDecode: Object.freeze({
        numericHexDigits: 4,
        numericWhitelist: Object.freeze(['003C', '003E', '2260', '2264',
          '2265']),
        namedWhitelist: Object.freeze(['gt', 'lt']),
        rejectsUnsupportedNumericEntities: true,
        rejectsResidualMathEntities: true,
      }),
      legacySubLinksImplemented: false,
      legacyExampleSwfsImplemented: false}),
    selectedMemberSetSha256: EXPECTED_SET_SHA256,
    sourceKeySetSha256: sha256(sourceKeyProjection), records, terms,
    registrationCandidatePlacementCount: 8,
    currentJavaScriptRegisteredCount: 0,
    productCalibrationPassed: false,
    familyCalibrationPassed: false, scaleOutAuthorized: false,
    productBlockers: Object.freeze([
      'not-registered-in-private-current-js-registry',
      'modern-my-lesson-product-calibration-pending',
      'external-narration-audio-selection-and-listening-acceptance-pending',
      'legacy-key-term-sublinks-and-example-swfs-not-implemented',
      'authoritative-original-runtime-not-established',
      'visual-fidelity-not-accepted']),
    acceptanceEffects: FALSE_EFFECTS});
  return Object.freeze({runBinding, audit, auditBytes: stableBytes(audit),
    exactButtonScriptCount: run.exactButtonScriptCount,
    exactTextCharacterCount: run.exactTextCharacterCount,
    recoveredGlossaryTermCount: run.recoveredGlossaryTermCount});
}

async function compareRun(expectedRoot, canonicalRoot) {
  const [expected, current] = await Promise.all([
    directoryInventory(expectedRoot), directoryInventory(canonicalRoot),
  ]);
  invariant(JSON.stringify(expected) === JSON.stringify(current),
    'ALG L11 tranche1 audit compiler run drifted');
  await verifyFrozenTree(canonicalRoot);
}

async function publishAudit(bytes) {
  const target = projectPath(OUTPUT);
  await writeFile(target, bytes, {flag: 'wx'});
  const created = await stableFile(OUTPUT);
  try {
    invariant(created.buffer.equals(bytes), 'audit publication drifted');
  } catch (error) {
    const current = await stableFile(OUTPUT).catch(() => null);
    if (current?.buffer.equals(bytes) &&
      JSON.stringify(current.identity) === JSON.stringify(created.identity)) {
      await unlink(target);
    }
    throw error;
  }
}

export async function auditG678AlgL11SimpleGlossaryTranche1(
  {check = false} = {},
) {
  const canonical = projectPath(RUN_ROOT);
  const stage = check ? `${canonical}.check-${process.pid}-${Date.now()}` :
    `${canonical}.staging-${process.pid}`;
  invariant(!await stat(stage).then(() => true, () => false),
    'ALG L11 tranche1 audit staging path already exists');
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
      const current = await stableFile(OUTPUT);
      invariant(current.buffer.equals(result.auditBytes),
        'ALG L11 tranche1 audit artifact drifted');
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
    return Object.freeze({check, output: OUTPUT,
      bytes: result.auditBytes.length, sha256: sha256(result.auditBytes),
      compilerRun: result.runBinding, auditedPlacementCount: 8,
      exactButtonScriptCount: result.exactButtonScriptCount,
      exactTextCharacterCount: result.exactTextCharacterCount,
      recoveredGlossaryTermCount: result.recoveredGlossaryTermCount,
      registrationCandidatePlacementCount: 8,
      currentJavaScriptRegisteredCount: 0,
      productCalibrationPassed: false,
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
    'usage: audit-g678-alg-l11-simple-glossary-tranche1.mjs [--check]');
  auditG678AlgL11SimpleGlossaryTranche1({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
