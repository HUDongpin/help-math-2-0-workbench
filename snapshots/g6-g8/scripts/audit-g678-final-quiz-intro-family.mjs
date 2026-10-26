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
const OUTPUT = 'catalog/g678-final-quiz-intro-family-audit-v1.json';
const RUN_ROOT =
  'work/g678-shared-page-factory/g678-final-quiz-intro-family-audit-v1';
const NORMALIZED_SCRIPT_SET_SHA256 =
  'd22a552c88ee9f1e49b2e66779a3b1bf5260edb7555e160823e93965e3fd2165';
const CRITICAL_ENVIRONMENT = Object.freeze([
  'FFDEC_JARFILENAME', 'FFDEC_MEMORY', 'FFDEC_STACK_SIZE',
  'JAVA_TOOL_OPTIONS', 'JDK_JAVA_OPTIONS', '_JAVA_OPTIONS', 'CLASSPATH',
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

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

export function stableFfdecCommandReceipt({code, signal, stdout, stderr}) {
  invariant(code === 0 && signal === null,
    `FFDec script export failed: ${stderr.toString('utf8')}`);
  invariant(stderr.length === 0,
    `FFDec script export emitted stderr: ${stderr.toString('utf8')}`);
  // Drain stdout in the caller, but deliberately exclude its volatile paths,
  // parallel completion order, and timings from the reproducibility receipt.
  void stdout;
  return Object.freeze({exitCode: code,
    stdout: Object.freeze({captured: true, recorded: false,
      exclusionReason:
        'FFDec progress contains volatile staging paths, parallel completion order, and timings; exported scripts are hash-bound below.'}),
    stderr: Object.freeze({bytes: stderr.length, sha256: sha256(stderr)})});
}

function projectPath(relativePath) {
  const absolute = path.resolve(ROOT, relativePath);
  invariant(absolute.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes the project root`);
  return absolute;
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
    ...(json ? {value: JSON.parse(buffer)} : {})});
}

function descriptor(binding) {
  return Object.freeze({path: binding.path, bytes: binding.bytes,
    sha256: binding.sha256});
}

async function sourceRoot() {
  const supplied = process.env[SOURCE_ENV];
  invariant(typeof supplied === 'string' && supplied.length > 0,
    `${SOURCE_ENV} is required`);
  const root = path.resolve(supplied);
  const [canonical, metadata] = await Promise.all([
    realpath(root), lstat(root, {bigint: true}),
  ]);
  invariant(canonical === root && metadata.isDirectory() &&
    !metadata.isSymbolicLink() && (metadata.mode & 0o222n) === 0n,
  `${SOURCE_ENV} must be a canonical read-only directory`);
  const shared = path.join(root, 'G6-G8-shared');
  const [sharedCanonical, sharedMetadata] = await Promise.all([
    realpath(shared), lstat(shared, {bigint: true}),
  ]);
  invariant(sharedCanonical === shared && sharedMetadata.isDirectory() &&
    !sharedMetadata.isSymbolicLink() &&
    (sharedMetadata.mode & 0o222n) === 0n,
  'G6-G8-shared must be a canonical read-only directory');
  return Object.freeze({root, shared, identity: Object.freeze({
    realPathSha256: sha256(root), device: String(metadata.dev),
    inode: String(metadata.ino), mode: Number(metadata.mode & 0o777n),
  })});
}

async function readSource(source, page) {
  invariant(/^G6-G8-shared\/(?:NMS002|GEO001|ALG001|DAT001)\/L\d+\/FQ\/L\d+FQ01\.swf$/u
    .test(page.viewPath), `noncanonical FQ01 source: ${page.viewPath}`);
  const target = path.join(source.root, ...page.viewPath.split('/'));
  invariant(target.startsWith(`${source.shared}${path.sep}`),
    `${page.viewPath} escapes the reviewed shared root`);
  const [canonical, before] = await Promise.all([
    realpath(target), lstat(target, {bigint: true}),
  ]);
  invariant(canonical === target && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (before.mode & 0o222n) === 0n,
  `${page.viewPath} must be a canonical read-only source`);
  const buffer = await readFile(target);
  const after = await lstat(target, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink &&
    buffer.length === page.sourceBytes && sha256(buffer) === page.sourceSha256,
  `${page.viewPath} source identity drifted`);
  return buffer;
}

async function verifyToolchain(toolchainRun) {
  for (const key of CRITICAL_ENVIRONMENT) {
    invariant(process.env[key] === undefined,
      `${key} must be unset for the FQ01 audit`);
  }
  const ffdec = toolchainRun.value.toolchain?.ffdec;
  invariant(ffdec?.execution === 'direct-bound-java' &&
    ffdec.invocation?.prefixArgs?.at(-1) === '<BOUND_FFDEC_JAR>',
  'reviewed FFDec invocation is unavailable');
  const bindings = [ffdec.launcher, ffdec.jar, ffdec.java,
    ...ffdec.jarManifest.classPath];
  for (const expected of bindings) {
    const current = await stableFile(expected.realPath, {absolute: true});
    invariant(current.bytes === expected.bytes &&
      current.sha256 === expected.sha256,
    `FFDec toolchain drifted: ${expected.realPath}`);
  }
  return Object.freeze({
    command: ffdec.java.realPath,
    jar: ffdec.jar.realPath,
    identity: ffdec,
  });
}

async function runCommand(command, args, options) {
  const child = spawn(command, args, {...options, stdio: ['ignore', 'pipe', 'pipe']});
  const stdout = [];
  const stderr = [];
  child.stdout.on('data', (chunk) => stdout.push(chunk));
  child.stderr.on('data', (chunk) => stderr.push(chunk));
  const result = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({code, signal}));
  });
  return stableFfdecCommandReceipt({code: result.code,
    signal: result.signal, stdout: Buffer.concat(stdout),
    stderr: Buffer.concat(stderr)});
}

async function walkFiles(root, current = root, files = []) {
  const entries = await readdir(current, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    invariant(!entry.isSymbolicLink(), `script export contains symlink: ${absolute}`);
    if (entry.isDirectory()) await walkFiles(root, absolute, files);
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function normalizedScriptInventory(files, mainObjectId) {
  const rows = files.map((file) => Object.freeze({
    path: file.path.replace(
      `DefineSprite_${mainObjectId}/frame_52/DoAction.as`,
      'DefineSprite_{main}/frame_52/DoAction.as',
    ),
    bytes: file.bytes,
    sha256: file.sha256,
  })).sort((left, right) => left.path < right.path ? -1 :
    left.path > right.path ? 1 : 0);
  const projection = rows.map((row) =>
    `${row.path}|${row.bytes}|${row.sha256}`).join('\n') + '\n';
  return Object.freeze({files: rows, fileCount: rows.length,
    checksumSetSha256: sha256(projection)});
}

function validateFacts(facts) {
  const reachable = facts.frameDomains.domains.filter((domain) =>
    domain.staticallyRootReachable);
  const main = reachable.filter((domain) => domain.kind === 'sprite' &&
    domain.declaredFrameCount > 1).sort((left, right) =>
    right.declaredFrameCount - left.declaredFrameCount)[0];
  const unreachableScriptDomains = facts.frameDomains.domains.filter((domain) =>
    !domain.staticallyRootReachable && domain.scriptTagCount > 0);
  invariant(facts.header.stage.width === 800 &&
    facts.header.stage.height === 600 && facts.header.fps === 12 &&
    facts.header.rootFrameCount === 10 &&
    facts.actionScript.version === 'AS1/2' &&
    facts.actionScript.tagCounts.DoAction === 12 &&
    facts.actionScript.tagCounts.DoInitAction === 2 &&
    facts.actionScript.tagCounts.DoABC === 0 &&
    facts.actionScript.tagCounts.DoABCDefine === 0 &&
    (facts.tagCounts.DefineButton ?? 0) === 0 &&
    (facts.tagCounts.DefineButton2 ?? 0) === 0 &&
    facts.audio.tagCounts.SoundStreamHead === 0 &&
    facts.audio.tagCounts.SoundStreamHead2 === 0 &&
    facts.audio.tagCounts.SoundStreamBlock === 0 &&
    facts.linkageAndImports.importedAssets.length === 0 &&
    JSON.stringify(facts.linkageAndImports.exportedAssets.map(({name}) => name)) ===
      JSON.stringify(['FUIComponentSymbol', 'UpArrow', 'ScrollThumb',
        'DownArrow', 'FScrollBarSymbol']) &&
    main?.declaredFrameCount === 52 && main.scriptTagCount === 1 &&
    unreachableScriptDomains.length === 5 &&
    unreachableScriptDomains.every((domain) =>
      [1, 2, 3, 4, 5].includes(domain.spriteId)),
  'FQ01 source structure drifted');
  return Object.freeze({mainObjectId: main.spriteId,
    mainFrameDomain: main.domainId, mainFrameCount: main.declaredFrameCount,
    unreachableLinkageSpriteIds: Object.freeze(
      unreachableScriptDomains.map((domain) => domain.spriteId).sort()),
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

async function expectedAudit(stageRoot) {
  const [catalog, toolchainRun, builder, source] = await Promise.all([
    stableFile(CATALOG, {json: true}), stableFile(TOOLCHAIN_RUN, {json: true}),
    stableFile(path.relative(ROOT, SCRIPT_PATH)), sourceRoot(),
  ]);
  const toolchain = await verifyToolchain(toolchainRun);
  const pages = catalog.value.lessons.flatMap((lesson) =>
    lesson.pages.filter((page) => /\/FQ\/L\d+FQ01\.swf$/u.test(page.viewPath))
      .map((page) => Object.freeze({...page,
        stableLessonKey: lesson.stableLessonKey,
        moduleCode: lesson.moduleCode,
        lessonNumber: lesson.lessonNumber,
      })));
  invariant(pages.length === 44 &&
    new Set(pages.map((page) => page.stableLessonKey)).size === 44,
  'FQ01 placement/lesson denominator drifted');
  const groups = new Map();
  for (const page of pages) {
    const group = groups.get(page.sourceSha256) ?? [];
    group.push(page);
    groups.set(page.sourceSha256, group);
  }
  invariant(groups.size === 6, 'FQ01 unique SWF denominator drifted');
  const records = [];
  const argsPrefix = [
    '-Djava.net.preferIPv4Stack=true', '-Djna.nosys=true',
    '-Djava.util.Arrays.useLegacyMergeSort=true', '-Xmx1024m',
    '-jar', toolchain.jar,
  ];
  for (const [digest, group] of [...groups].sort(([left], [right]) =>
    left.localeCompare(right))) {
    let representative = null;
    for (const page of group) {
      const buffer = await readSource(source, page);
      representative ??= buffer;
    }
    const facts = parseSwfSourceFacts(representative);
    const classification = validateFacts(facts);
    const memberRoot = path.join(stageRoot, digest);
    const stagedSource = path.join(memberRoot, 'source.swf');
    const scriptRoot = path.join(memberRoot, 'scripts');
    await mkdir(memberRoot, {recursive: true});
    await writeFile(stagedSource, representative, {flag: 'wx', mode: 0o444});
    await chmod(stagedSource, 0o444);
    const command = await runCommand(toolchain.command, [
      ...argsPrefix, '-config', 'packJavaScripts=false', '-onerror', 'abort',
      '-timeout', '120', '-exportTimeout', '600', '-format', 'script:as',
      '-export', 'script', memberRoot, stagedSource,
    ], {cwd: ROOT, env: process.env});
    const scriptFiles = [];
    for (const absolute of await walkFiles(scriptRoot)) {
      const binding = await stableFile(absolute, {absolute: true});
      scriptFiles.push(Object.freeze({
        path: path.relative(scriptRoot, absolute).split(path.sep).join('/'),
        bytes: binding.bytes, sha256: binding.sha256,
      }));
    }
    const normalized = normalizedScriptInventory(scriptFiles,
      classification.mainObjectId);
    invariant(normalized.fileCount === 14 &&
      normalized.checksumSetSha256 === NORMALIZED_SCRIPT_SET_SHA256,
    `${digest} FQ01 exact script set drifted`);
    records.push(Object.freeze({
      sourceSha256: digest,
      sourceBytes: representative.length,
      sourcePaths: Object.freeze(group.map((page) => page.viewPath).sort()),
      placementIds: Object.freeze(group.map((page) => page.animationId).sort()),
      lessonKeys: Object.freeze(group.map((page) => page.stableLessonKey).sort()),
      moduleCodes: Object.freeze([...new Set(group.map((page) =>
        page.moduleCode))].sort()),
      structure: Object.freeze({
        stage: '800x600', fps: 12, rootFrameCount: 10,
        mainFrameDomain: classification.mainFrameDomain,
        mainObjectId: classification.mainObjectId,
        mainFrameCount: classification.mainFrameCount,
        buttonCount: 0, audioStreamCount: 0,
        unreachableLinkageSpriteIds:
          classification.unreachableLinkageSpriteIds,
        sourceStructureFingerprintSha256: facts.structureFingerprintSha256,
      }),
      exactScripts: normalized,
      command,
      generationAuthorized: false,
    }));
  }
  await verifyToolchain(toolchainRun);
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-final-quiz-intro-family-audit-v1',
    auditId: 'g678-final-quiz-intro-family-audit-v1',
    status: 'complete-source-and-exact-script-audit-calibration-pending',
    scope: Object.freeze({activePagePlacements: 2282,
      finalQuizIntroPlacements: 44, affectedLessons: 44,
      uniqueSourceSwfs: 6, courseShells: 0}),
    inputs: Object.freeze({catalog: descriptor(catalog),
      toolchainRun: descriptor(toolchainRun), builder: descriptor(builder)}),
    sourceRoot: Object.freeze({environmentVariable: SOURCE_ENV,
      ...source.identity, requireReadOnlySources: true}),
    exactClassifier: Object.freeze({
      path: 'G6-G8-shared/<module>/L<lesson>/FQ/L<lesson>FQ01.swf',
      mainTimeline: '52 frames at 12 fps with one exact terminal stop()',
      rootScripts: 'exact InternalPreloader handoff plus root stop()',
      buttons: 0,
      audioStreams: 0,
      unreachableLinkage:
        'FUIComponentSymbol/UpArrow/ScrollThumb/DownArrow/FScrollBarSymbol only',
      normalizedExactScriptSetSha256: NORMALIZED_SCRIPT_SET_SHA256,
    }),
    records,
    familyCalibrationPassed: false,
    scaleOutAuthorized: false,
    registrationCandidatePlacementCount: 0,
    acceptanceEffects: FALSE_EFFECTS,
    limitations: Object.freeze([
      'The audit proves exact source structure and scripts, not browser playback or product calibration.',
      'The unreachable linkage classification is static and does not execute legacy ActionScript.',
      'No Current-JS registration, whole-lesson preview, acceptance, release, or publication effect is granted.',
    ]),
  });
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

export async function auditFinalQuizIntroFamily({check = false} = {}) {
  const canonicalRun = projectPath(RUN_ROOT);
  const stage = check
    ? `${canonicalRun}.check-${process.pid}-${Date.now()}`
    : `${canonicalRun}.staging-${process.pid}`;
  invariant(!await lstat(stage).then(() => true, () => false),
    'FQ01 audit staging path already exists');
  if (!check) invariant(!await lstat(canonicalRun).then(() => true, () => false),
    `${RUN_ROOT} already exists`);
  await mkdir(stage, {recursive: false});
  try {
    const artifact = await expectedAudit(stage);
    const bytes = stableBytes(artifact);
    const runManifest = stableBytes({schemaVersion: 1,
      runId: 'g678-final-quiz-intro-family-audit-v1',
      status: artifact.status,
      audit: {path: OUTPUT, bytes: bytes.length, sha256: sha256(bytes)},
      recordCount: artifact.records.length,
      placementCount: artifact.scope.finalQuizIntroPlacements,
      familyCalibrationPassed: false,
      scaleOutAuthorized: false,
      acceptanceEffects: FALSE_EFFECTS});
    await writeFile(path.join(stage, 'run-manifest.json'), runManifest,
      {flag: 'wx'});
    if (check) {
      const current = await stableFile(OUTPUT);
      invariant(current.buffer.equals(bytes), 'FQ01 family audit drifted');
      await rm(stage, {recursive: true});
    } else {
      await freezeTree(stage);
      await chmod(stage, 0o755);
      await rename(stage, canonicalRun);
      await chmod(canonicalRun, 0o555);
      await writeExclusive(OUTPUT, bytes);
    }
    return Object.freeze({check, output: OUTPUT, bytes: bytes.length,
      sha256: sha256(bytes), status: artifact.status,
      placements: artifact.scope.finalQuizIntroPlacements,
      affectedLessons: artifact.scope.affectedLessons,
      uniqueSourceSwfs: artifact.scope.uniqueSourceSwfs,
      familyCalibrationPassed: false, scaleOutAuthorized: false,
      registrationCandidatePlacementCount: 0,
      acceptanceEffects: FALSE_EFFECTS});
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
    'usage: audit-g678-final-quiz-intro-family.mjs [--check]');
  auditFinalQuizIntroFamily({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
