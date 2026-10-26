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
  'catalog/product-bridge-calibrations/g678-current-js-327-page-product-calibrated-registration-v1.json';
const KEY_TERM_RECOVERY = 'catalog/g678-ts07-l1-keyterm-recovery-v1.json';
const HOST_AUDIT = 'catalog/g678-ts02-family-audit-v1.json';
const TOOLCHAIN_RUN =
  'work/g678-shared-page-factory/g678-ts07-nms-l1-current-js-1-v1/run-manifest.json';
const OUTPUT = 'catalog/g678-alg-l09-in06-choice-family-audit-v1.json';
const RUN_ID = 'g678-alg-l09-in06-choice-family-audit-v1';
const RUN_ROOT = `work/g678-shared-page-factory/${RUN_ID}`;
const EXPECTED_MEMBER_SET_SHA256 =
  '67aa44c042098c203774aab25b73daddc0e4eefee6ab004844ab7b008aefb7d0';

const EXPECTED_MEMBERS = Object.freeze([
  ['shared-alg001-l09-p018', 'shared-alg001-l09', 'ALG001', 9,
    'G6-G8-shared/ALG001/L9/IN/L9IN06.swf', 544774,
    'da5717b3f89a31869125193f91ebd081f4b49737a763b61954affd68777269e0',
    'sprite-189', 667, 8, 'IN', 5],
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
const EXPECTED_SCRIPT_INVENTORY = Object.freeze({
  fileCount: 38,
  checksumSetSha256:
    '62c549b265c0be0563cfc1fcc6f58de5b64884153651468ba3c90a883a5df124',
});
const EXPECTED_TEXT_INVENTORY = Object.freeze({
  fileCount: 52,
  checksumSetSha256:
    'fed835f5ed3a46177b5a9856ae3a992b13c2bec993f4384be046ce0ea8e13955',
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
      `${key} must be absent for the ALG L9 IN06 choice audit`);
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
    facts.actionScript.tagCounts.DoAction === 30 &&
    facts.actionScript.tagCounts.DoInitAction === 0 &&
    facts.actionScript.tagCounts.DoABC === 0 &&
    facts.actionScript.tagCounts.DoABCDefine === 0 &&
    (facts.tagCounts.DefineButton ?? 0) === 0 &&
    (facts.tagCounts.DefineButton2 ?? 0) === expected.buttonCount &&
    facts.audio.tagCounts.SoundStreamHead === 8 &&
    facts.audio.tagCounts.SoundStreamHead2 === 0 &&
    facts.audio.tagCounts.DefineSound === 0 &&
    facts.audio.tagCounts.StartSound === 0 &&
    facts.audio.tagCounts.StartSound2 === 0 &&
    facts.linkageAndImports.importedAssets.length === 0 &&
    facts.linkageAndImports.exportedAssets.length === 0 &&
    facts.linkageAndImports.symbolClasses.length === 0 &&
    facts.audio.tagCounts.SoundStreamBlock === 856 &&
    root?.scriptTagCount === 2 && main?.declaredFrameCount ===
      expected.mainFrameCount && main.scriptTagCount === 2,
  `${expected.animationId} source structure drifted`);
  const rootEdge = root.placementEdges.find((edge) =>
    edge.childSpriteId === main.spriteId);
  const mainButtonEdges = main.placementEdges.filter((edge) =>
    edge.characterType === 'DefineButton2').sort((left, right) =>
    left.characterId - right.characterId ||
      left.firstFrame - right.firstFrame);
  const feedbackDomains = reachable.filter((domain) =>
    [58, 70, 87, 101, 126, 140, 160].includes(domain.spriteId));
  const interactionChildren = main.placementEdges.filter((edge) =>
    edge.characterType === 'DefineSprite' && edge.firstFrame === 188)
    .map((edge) => edge.childSpriteId).sort((left, right) => left - right);
  invariant(rootEdge?.firstFrame === 6 &&
    exact(mainButtonEdges.map((edge) => edge.characterId),
      [9, 12, 13, 30, 31, 32]) &&
    exact(mainButtonEdges.map((edge) => edge.firstFrame),
      [75, 155, 155, 188, 188, 188]) &&
    exact(feedbackDomains.map((domain) => domain.spriteId).sort(
      (left, right) => left - right), [58, 70, 87, 101, 126, 140, 160]) &&
    exact(interactionChildren, [58, 70, 87, 101, 126, 140, 160]),
  `${expected.animationId} placement graph drifted`);
  return Object.freeze({
    rootFrameCount: facts.header.rootFrameCount,
    mainObjectId: main.spriteId,
    mainFrameDomain: main.domainId,
    mainFrameCount: main.declaredFrameCount,
    glossaryButtonCharacterIds: Object.freeze([9, 12, 13]),
    glossaryButtonFirstFrames: Object.freeze([75, 155, 155]),
    answerButtonCharacterIds: Object.freeze([30, 31, 32]),
    answerInstanceNames: Object.freeze([
      'AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4',
    ]),
    popupCloseButtonCharacterIds: Object.freeze([119, 135]),
    interactionFrame: 188,
    interactionChildSpriteIds: Object.freeze(interactionChildren),
    rightFeedbackFrameDomains: Object.freeze(
      feedbackDomains.filter((domain) => [58, 70, 87, 101]
        .includes(domain.spriteId)).map((domain) => Object.freeze({
        domainId: domain.domainId,
        frameCount: domain.declaredFrameCount,
        scriptTagCount: domain.scriptTagCount,
      })).sort((left, right) => compareText(left.domainId, right.domainId))),
    wrongFeedbackFrameDomains: Object.freeze(
      feedbackDomains.filter((domain) => [126, 140, 160]
        .includes(domain.spriteId)).map((domain) => Object.freeze({
        domainId: domain.domainId,
        frameCount: domain.declaredFrameCount,
        scriptTagCount: domain.scriptTagCount,
      })).sort((left, right) => compareText(left.domainId, right.domainId))),
    soundStreamBlockCount: facts.audio.tagCounts.SoundStreamBlock,
    sourceStructureFingerprintSha256: facts.structureFingerprintSha256,
  });
}

function classifyScripts(rows, textRows, structure, expected) {
  const exactScripts = inventoryProjection(rows);
  const exactText = inventoryProjection(textRows);
  invariant(rows.length === EXPECTED_SCRIPT_INVENTORY.fileCount &&
    exactScripts.checksumSetSha256 ===
      EXPECTED_SCRIPT_INVENTORY.checksumSetSha256,
  `${expected.animationId} exact 38-script set drifted`);
  invariant(textRows.length === EXPECTED_TEXT_INVENTORY.fileCount &&
    exactText.checksumSetSha256 ===
      EXPECTED_TEXT_INVENTORY.checksumSetSha256,
  `${expected.animationId} exact 52-text set drifted`);
  const scriptMap = new Map(rows.map((row) => [row.path, row]));
  invariant(scriptMap.get('frame_1/DoAction.as')?.text ===
      ROOT_PRELOADER_AND_STOP &&
    scriptMap.get('frame_6/DoAction.as')?.text === STOP,
  `${expected.animationId} root script contract drifted`);
  const glossaryButtons = [9, 12, 13].map((characterId, index) => {
    const row = scriptMap.get(
      `DefineButton2_${characterId}/BUTTONCONDACTION on(release).as`);
    const match = row?.text.match(
      /^on\(release\)\{\r\n\s*_global\.KeyAttribute = "([^"]+)";\r\n\s*_root\.DoHyperLinks\(\);\r\n\s*_root\.animation_mc\.animation\.stop\(\);\r\n\}\r\n$/u,
    );
    invariant(row && match,
      `${expected.animationId} glossary button ${characterId} drifted`);
    return Object.freeze({
      characterId,
      sourceKeyAttribute: match[1],
      firstFrame: structure.glossaryButtonFirstFrames[index],
      script: descriptor(row),
    });
  });
  invariant(exact(glossaryButtons.map((button) =>
    button.sourceKeyAttribute), ['Ratio', 'Simplest form', 'Simplify']),
  `${expected.animationId} glossary source keys drifted`);
  const stop = scriptMap.get('DefineSprite_189/frame_188/DoAction.as');
  const resume = scriptMap.get('DefineSprite_189/frame_189/DoAction.as');
  const wrongReduce = scriptMap.get(
    'DefineButton2_30/BUTTONCONDACTION on(release).as');
  const correct = scriptMap.get(
    'DefineButton2_31/BUTTONCONDACTION on(release).as');
  const wrongCalculation = scriptMap.get(
    'DefineButton2_32/BUTTONCONDACTION on(release).as');
  const close119 = scriptMap.get(
    'DefineButton2_119/BUTTONCONDACTION on(release).as');
  const close135 = scriptMap.get(
    'DefineButton2_135/BUTTONCONDACTION on(release).as');
  const rightDomainScripts = [58, 70, 87, 101].map((spriteId) => {
    const matches = rows.filter((row) =>
      row.path.startsWith(`DefineSprite_${spriteId}/`) &&
      row.text.includes('_parent.play();'));
    invariant(matches.length === 1,
      `${expected.animationId} right domain ${spriteId} drifted`);
    return matches[0];
  });
  const wrongDomainScripts = [126, 140, 160].map((spriteId) => {
    const matches = rows.filter((row) =>
      row.path.startsWith(`DefineSprite_${spriteId}/`) &&
      row.text.includes('_global.quizTryCount++;'));
    invariant(matches.length === 1 &&
      matches[0].text.includes('if(_global.quizTryCount >= 2)') &&
      matches[0].text.includes('_parent.play();'),
    `${expected.animationId} wrong domain ${spriteId} drifted`);
    return matches[0];
  });
  invariant(stop?.text ===
      'stop();\r\n_global.quizSection = true;\r\n_global.quizTryCount = 0;\r\n' &&
    resume?.text === '_global.quizSection = false;\r\n' &&
    wrongReduce?.text.includes(
      '_global.WrongFeed = "Reduce the fraction to its simplest form.";') &&
    wrongReduce.text.includes(
      '_global.WrongFeed = "Reduce the fraction to its simplest form. Try again.";') &&
    wrongReduce.text.includes('_root.showWrongFeed();') &&
    correct?.text.includes('_root.showRightFeed();') &&
    wrongCalculation?.text.includes(
      '_global.WrongFeed = "Your calculations are incorrect.";') &&
    wrongCalculation.text.includes(
      '_global.WrongFeed = "Your calculations are incorrect. Try again.";') &&
    wrongCalculation.text.includes('_root.showWrongFeed();') &&
    close119?.text.includes('_parent.gotoAndPlay(24);') &&
    close135?.text.includes('_parent.gotoAndPlay(21);') &&
    close119.text.includes('i <= 4') && close135.text.includes('i <= 4'),
  `${expected.animationId} multiple-choice contract drifted`);
  const textMap = new Map(textRows.map((row) => [row.path, row]));
  const sourceText = Object.freeze({
    context: textMap.get('5.txt'),
    question: textMap.get('7.txt'),
    instruction: textMap.get('11.txt'),
    optionA: Object.freeze([textMap.get('20.txt'), textMap.get('21.txt')]),
    optionB: Object.freeze([textMap.get('21.txt'), textMap.get('28.txt')]),
    optionC: Object.freeze([textMap.get('22.txt'), textMap.get('23.txt')]),
    optionD: Object.freeze([textMap.get('24.txt'), textMap.get('25.txt')]),
    correct: textMap.get('83.txt'),
  });
  invariant(normalizeText(sourceText.context?.text ?? '') ===
      '64 seventh graders and 96 eighth graders play in the school band.' &&
    normalizeText(sourceText.question?.text
      .replaceAll('--- RECORDSEPARATOR ---', ' ') ?? '') ===
      'What is the ratio of seventh graders to eighth graders in the school band?' &&
    normalizeText(sourceText.instruction?.text
      .replaceAll('--- RECORDSEPARATOR ---', ' ') ?? '') ===
      'Simplify the ratio to its simplest form .' &&
    exact(sourceText.optionA.map((row) => normalizeText(row?.text ?? '')),
      ['1', '2']) &&
    exact(sourceText.optionB.map((row) => normalizeText(row?.text ?? '')),
      ['2', '3']) &&
    exact(sourceText.optionC.map((row) => normalizeText(row?.text ?? '')),
      ['32', '48']) &&
    exact(sourceText.optionD.map((row) => normalizeText(row?.text ?? '')),
      ['64', '96']) &&
    normalizeText(sourceText.correct?.text ?? '') === 'Correct!',
  `${expected.animationId} exact instructional text drifted`);
  return Object.freeze({
    exactScripts,
    exactText,
    buttons: Object.freeze(glossaryButtons),
    interaction: Object.freeze({
      stopFrame: 188,
      resumeFrame: 189,
      terminalFrame: 667,
      correctAnswerInstanceName: 'AnsBtn2',
      correctAnswerButtonCharacterId: 31,
      options: Object.freeze([
        Object.freeze({instanceName: 'AnsBtn1', label: 'A', ratio: '1:2',
          buttonCharacterId: 32, correct: false}),
        Object.freeze({instanceName: 'AnsBtn2', label: 'B', ratio: '2:3',
          buttonCharacterId: 31, correct: true}),
        Object.freeze({instanceName: 'AnsBtn3', label: 'C', ratio: '32:48',
          buttonCharacterId: 30, correct: false}),
        Object.freeze({instanceName: 'AnsBtn4', label: 'D', ratio: '64:96',
          buttonCharacterId: 30, correct: false}),
      ]),
      attemptCounter: '_global.quizTryCount',
      maximumWrongAttempts: 2,
      rightFeedbackHostCall: '_root.showRightFeed()',
      wrongFeedbackHostCall: '_root.showWrongFeed()',
      rightFeedbackDomains: Object.freeze(
        structure.rightFeedbackFrameDomains.map((domain) => domain.domainId)),
      wrongFeedbackDomains: Object.freeze(
        structure.wrongFeedbackFrameDomains.map((domain) => domain.domainId)),
      scripts: Object.freeze({
        stop: descriptor(stop),
        resume: descriptor(resume),
        wrongReduce: descriptor(wrongReduce),
        correct: descriptor(correct),
        wrongCalculation: descriptor(wrongCalculation),
        close119: descriptor(close119),
        close135: descriptor(close135),
        rightDomainResume: Object.freeze(rightDomainScripts.map((row) =>
          descriptor(row))),
        wrongDomainAttempt: Object.freeze(wrongDomainScripts.map((row) =>
          descriptor(row))),
      }),
      sourceText: Object.freeze({
        context: normalizeText(sourceText.context.text),
        question: normalizeText(sourceText.question.text
          .replaceAll('--- RECORDSEPARATOR ---', ' ')),
        instruction: normalizeText(sourceText.instruction.text
          .replaceAll('--- RECORDSEPARATOR ---', ' ')),
        correct: normalizeText(sourceText.correct.text),
        firstWrongByChoice: Object.freeze({
          AnsBtn1: 'Your calculations are incorrect. Try again.',
          AnsBtn3: 'Reduce the fraction to its simplest form. Try again.',
          AnsBtn4: 'Reduce the fraction to its simplest form. Try again.',
        }),
        secondWrongByChoice: Object.freeze({
          AnsBtn1: 'Your calculations are incorrect.',
          AnsBtn3: 'Reduce the fraction to its simplest form.',
          AnsBtn4: 'Reduce the fraction to its simplest form.',
        }),
      }),
    }),
    operationSequence: Object.freeze([
      'literal _global.KeyAttribute assignment opens source-bound glossary',
      'frame 188 stops and resets quizTryCount',
      'AnsBtn2 requests the shell-owned right-feedback path',
      'AnsBtn1 requests calculation feedback',
      'AnsBtn3 and AnsBtn4 request simplest-form feedback',
      'the first wrong-feedback dismissal increments quizTryCount and retries',
      'the second wrong-feedback dismissal resets quizTryCount and resumes',
      'right-feedback dismissal resumes at frame 189',
      'the main visual continues to its authored frame 667 endpoint',
    ]),
    rootPreloaderStopPresent: true,
    mainTerminalStopPresent: false,
    childTimelineScriptCount: 28,
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
  invariant(predecessor.value.selectedPages?.length === 327 &&
    predecessor.value.registrationCandidatePlacementCount === 327 &&
    predecessor.value.deploymentScope === 'local-only',
  '327-page predecessor freeze drifted');
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
      structuralRecord.classification.childScriptCount === 28 &&
      structuralRecord.classification.soundStreamHeadCount === 8 &&
      structuralRecord.classification.soundStreamBlockCount === 856,
    `${expected.animationId} fixed selection drifted`);
    return Object.freeze({...expected, catalogRecord});
  });
  invariant(selected.length === 1 &&
    selectedSet(selected).sha256 === EXPECTED_MEMBER_SET_SHA256,
  'ALG L9 IN06 choice fixed member set drifted');

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
    artifactType: 'g678-alg-l09-in06-choice-family-audit-run-v1',
    runId: RUN_ID,
    status: 'complete-source-script-keyterm-and-audio-audit',
    inputs,
    sourceRoot: source.identity,
    recoveryRoot: recoveryRoot.identity,
    toolchain: Object.freeze({ffdec: toolchain.receipt}),
    auditedPlacementCount: 1,
    affectedLessonCount: 1,
    exactButtonScriptCount: records.reduce((sum, record) =>
      sum + record.behavior.exactScripts.files.filter((file) =>
        file.path.startsWith('DefineButton2_')).length, 0),
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
    artifactType: 'g678-alg-l09-in06-choice-family-audit-v1',
    auditId: RUN_ID,
    status:
      'exact-1-in06-choice-quiz-script-keyterm-audio-audit-registration-candidate',
    scope: Object.freeze({
      activePagePlacements: 2282,
      predecessorRegisteredCurrentJsPages: 327,
      selectedAlgL09In06ChoicePlacements: 1,
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
      'alg-l09-in06-choice-browser-product-calibration-pending',
      'choice-feedback-shell-variants-and-audio-acceptance-pending',
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
    'ALG L9 IN06 choice audit compiler run drifted');
  await verifyFrozenTree(rightRoot);
}

async function publishAudit(bytes) {
  const target = projectPath(OUTPUT);
  await writeFile(target, bytes, {flag: 'wx'});
  const created = await stableFile(OUTPUT);
  try {
    invariant(created.buffer.equals(bytes),
      'ALG L9 IN06 choice audit publication drifted');
  } catch (error) {
    const current = await stableFile(OUTPUT).catch(() => null);
    if (current && current.buffer.equals(bytes) &&
      exact(current.identity, created.identity)) await unlink(target);
    throw error;
  }
}

export async function auditG678AlgL09In06ChoiceFamily(
  {check = false} = {},
) {
  const canonical = projectPath(RUN_ROOT);
  const stage = check
    ? `${canonical}.check-${process.pid}-${Date.now()}`
    : `${canonical}.staging-${process.pid}`;
  invariant(!await stat(stage).then(() => true, () => false),
    'ALG L9 IN06 choice audit staging path already exists');
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
        'ALG L9 IN06 choice audit artifact drifted');
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
  'usage: audit-g678-alg-l09-in06-choice-family.mjs [--check]');
  auditG678AlgL09In06ChoiceFamily({check: args.includes('--check')})
    .then((result) => process.stdout.write(
      `${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
