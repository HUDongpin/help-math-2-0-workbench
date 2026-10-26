#!/usr/bin/env node

import {createHash, randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {parseSwfSourceFacts} from
  './build-g4-l3-machine-source-audits.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SOURCE_ENV = 'HELP_MATH_G678_SOURCE_ROOT';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const PREDECESSOR =
  'catalog/product-bridge-calibrations/g678-current-js-342-page-product-calibrated-registration-v1.json';
const TOOLCHAIN = 'catalog/toolchain.json';
const OUTPUT = 'catalog/g678-alg-l11-residual-routing-audit-v1.json';
const DIAGNOSTIC_ROOT =
  'work/g678-shared-page-factory/g678-alg-l11-residual-routing-audit-v1';
const LESSON_KEY = 'shared-alg001-l11';
const LESSON_XML_SHA256 =
  '329feea5eafa57e0824cbbf03f956c9df2df83c85be81a384f70f34908ab3896';
const LESSON_XML_RELATIVE_PATH = 'ALG001/L11/index.xml';
const PREDECESSOR_SHA256 =
  '45b0710e0808f31b8b8d1658ca98288903be5e888085b8a1c34803a235372bab';
const REGISTERED_IDS = Object.freeze([
  'shared-alg001-l11-p005',
  'shared-alg001-l11-p012',
  'shared-alg001-l11-p015',
  'shared-alg001-l11-p035',
  'shared-alg001-l11-p036',
  'shared-alg001-l11-p037',
  'shared-alg001-l11-p038',
  'shared-alg001-l11-p039',
  'shared-alg001-l11-p043',
]);
const RESIDUAL_IDS = Object.freeze([
  ...[1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 14],
  ...Array.from({length: 19}, (_, index) => index + 16),
  40, 41, 42, 44,
].map((ordinal) => `${LESSON_KEY}-p${String(ordinal).padStart(3, '0')}`));

const FAMILY_ROUTES = Object.freeze([
  Object.freeze({
    familyId: 'l11-intro-media-scrubber',
    ids: Object.freeze(['shared-alg001-l11-p001']),
    complexity: 'interactive-understood',
    implementationLane: 'compiler-assisted-maintained-media-scrubber-adapter',
    reusableCandidate: null,
    reason: 'source scripts bind drag/release to the root media-frame and progress-bar host APIs',
    p1Blockers: Object.freeze([
      'media-scrubber-frame-and-replay-contract-not-implemented',
      'root-host-progress-adapter-not-product-calibrated',
    ]),
  }),
  Object.freeze({
    familyId: 'l11-narrated-linear-glossary',
    ids: Object.freeze([
      'shared-alg001-l11-p002', 'shared-alg001-l11-p003',
      'shared-alg001-l11-p004', 'shared-alg001-l11-p007',
      'shared-alg001-l11-p013', 'shared-alg001-l11-p016',
      'shared-alg001-l11-p017', 'shared-alg001-l11-p018',
      'shared-alg001-l11-p022', 'shared-alg001-l11-p023',
      'shared-alg001-l11-p024',
    ]),
    complexity: 'low',
    implementationLane: 'calibrated-factory-linear-plus-glossary-host',
    reusableCandidate: 'g678-pure-linear-current-js-scaleout-v1',
    reason: 'source scripts expose a single named animation timeline plus glossary-key host calls and no quiz/random/game state',
    p1Blockers: Object.freeze([
      'exact-linear-frame-ir-not-generated',
      'lesson-glossary-host-keys-not-product-calibrated',
    ]),
  }),
  Object.freeze({
    familyId: 'l11-random-audio-label-timeline',
    ids: Object.freeze(['shared-alg001-l11-p006']),
    complexity: 'interactive-understood',
    implementationLane: 'compiler-assisted-random-audio-state-adapter',
    reusableCandidate: null,
    reason: 'source selects one of four S1-S4 labels with AVM1 random before timeline playback',
    p1Blockers: Object.freeze([
      'source-random-event-trace-and-deterministic-replay-not-implemented',
      'random-label-audio-cue-crosswalk-not-resolved',
    ]),
  }),
  Object.freeze({
    familyId: 'l11-two-try-need-more-help',
    ids: Object.freeze([
      'shared-alg001-l11-p009', 'shared-alg001-l11-p010',
    ]),
    complexity: 'interactive-understood',
    implementationLane: 'compiler-assisted-two-try-help-state-adapter',
    reusableCandidate: null,
    reason: 'source feedback clips increment quizTryCount, expose Need More Help, and resume after the second try',
    p1Blockers: Object.freeze([
      'two-try-help-state-and-replay-contract-not-implemented',
      'need-more-help-host-behavior-not-product-calibrated',
    ]),
  }),
  Object.freeze({
    familyId: 'l11-choice-feedback-practice',
    ids: Object.freeze([
      'shared-alg001-l11-p008', 'shared-alg001-l11-p011',
      'shared-alg001-l11-p014', 'shared-alg001-l11-p019',
      'shared-alg001-l11-p020', 'shared-alg001-l11-p021',
      'shared-alg001-l11-p025',
    ]),
    complexity: 'interactive-understood',
    implementationLane: 'compiler-assisted-choice-feedback-state-machine',
    reusableCandidate: 'g678-alg-l09-choice-family-state-machines',
    reason: 'source buttons call distinct right/wrong feedback paths and mutate quizTryCount before resuming the named timeline',
    p1Blockers: Object.freeze([
      'exact-choice-answer-and-feedback-text-map-not-implemented',
      'two-attempt-terminal-and-replay-state-not-product-calibrated',
    ]),
  }),
  Object.freeze({
    familyId: 'l11-tutorial-multi-question-choice',
    ids: Object.freeze(Array.from({length: 7}, (_, index) =>
      `${LESSON_KEY}-p${String(index + 26).padStart(3, '0')}`)),
    complexity: 'behavior-heavy',
    implementationLane: 'advanced-manual-multi-question-choice-state-machine',
    reusableCandidate: 'g678-alg-l09-ti-choice-family',
    reason: 'source uses multiple nested answer clips, per-question two-try feedback strings, help popup state, and timeline resume transitions',
    p1Blockers: Object.freeze([
      'per-question-answer-feedback-and-help-map-not-implemented',
      'multi-stop-state-vector-and-full-replay-not-product-calibrated',
    ]),
  }),
  Object.freeze({
    familyId: 'l11-game-controller-cross-page',
    ids: Object.freeze(['shared-alg001-l11-p033']),
    complexity: 'behavior-heavy',
    implementationLane: 'advanced-manual-cross-page-game-controller',
    reusableCandidate: 'g678-alg-l09-game-controller',
    reason: 'source requires level selection and a typed handoff to L11GS03 with distinct one- and six-argument calls',
    p1Blockers: Object.freeze([
      'level-selection-and-cross-page-navigation-state-not-implemented',
      'typed-l11gs03-host-handoff-not-product-calibrated',
    ]),
  }),
  Object.freeze({
    familyId: 'l11-matching-game',
    ids: Object.freeze(['shared-alg001-l11-p034']),
    complexity: 'behavior-heavy',
    implementationLane: 'advanced-manual-matching-game-state-machine',
    reusableCandidate: 'g678-alg-l09-matching-game',
    reason: 'source contains two levels of six pairs with answer-click, match, score, disable/enable, and replay state',
    p1Blockers: Object.freeze([
      'exact-pair-identities-score-mutations-and-feedback-not-implemented',
      'two-level-game-terminal-and-replay-state-not-product-calibrated',
    ]),
  }),
  Object.freeze({
    familyId: 'l11-guided-tutorial-choice',
    ids: Object.freeze([
      'shared-alg001-l11-p040', 'shared-alg001-l11-p041',
      'shared-alg001-l11-p042',
    ]),
    complexity: 'behavior-heavy',
    implementationLane: 'advanced-manual-guided-tutorial-choice-state-machine',
    reusableCandidate: 'g678-alg-l09-guided-tutorial-family',
    reason: 'source has long nested domains with multiple stops, glossary/help controls, and explicit right/wrong final-choice feedback',
    p1Blockers: Object.freeze([
      'guided-stop-help-choice-and-resume-map-not-implemented',
      'long-domain-natural-trace-and-full-replay-not-product-calibrated',
    ]),
  }),
  Object.freeze({
    familyId: 'l11-random-final-assessment',
    ids: Object.freeze(['shared-alg001-l11-p044']),
    complexity: 'behavior-heavy',
    implementationLane: 'advanced-manual-final-assessment-state-machine',
    reusableCandidate: 'g678-alg-l09-final-assessment-state-machine',
    reason: 'source selects ten unique questions from a twenty-four-question pool and retains answer, review, audio, bookmark, result, and close/report behavior',
    p1Blockers: Object.freeze([
      'exact-ten-of-twenty-four-assessment-and-review-state-not-implemented',
      'legacy-bookmark-report-close-calls-require-reviewed-local-replacement',
      'one-hundred-twenty-grouped-question-answer-audio-cues-not-accepted',
    ]),
  }),
]);

const FALSE_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false,
  behaviorAccepted: false,
  authoritativeOriginalRuntime: false,
  visualFidelityAccepted: false,
  audioAccepted: false,
  humanVisualAccepted: false,
  ownerAccepted: false,
  strictComplete: false,
  released: false,
  published: false,
});

const XML_PARSER = String.raw`
import json
import sys
import xml.etree.ElementTree as ET

root = ET.parse(sys.argv[1]).getroot()
header = root.find('./Header')
tags = header.find('./tags')
sprites = {}
for sprite in tags.findall('./DefineSprite'):
    sprites[int(sprite.attrib['objectID'])] = int(sprite.attrib['frames'])
named = []
for node in tags.findall('./PlaceObject2') + tags.findall('./PlaceObject3'):
    if node.attrib.get('name') == 'animation':
        object_id = int(node.attrib['objectID'])
        named.append({
            'objectId': object_id,
            'frameCount': sprites.get(object_id),
            'depth': int(node.attrib['depth']),
            'directRootPlacement': True,
        })
print(json.dumps({
    'parser': 'python-xml.etree.ElementTree',
    'swfVersion': int(root.attrib['version']),
    'compressed': root.attrib.get('compressed') == '1',
    'fps': float(header.attrib['framerate']),
    'rootFrameCount': int(header.attrib['frames']),
    'defineSpriteCount': len(sprites),
    'defineButton2Count': len(tags.findall('./DefineButton2')),
    'namedAnimationPlacements': named,
}, separators=(',', ':')))
`;

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function pathExists(target) {
  try {
    await lstat(target);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

async function stableFile(target, {absolute = false, json = false,
  requireReadOnly = false} = {}) {
  const resolved = absolute ? path.resolve(target) : projectPath(target);
  const [canonical, before] = await Promise.all([
    realpath(resolved), lstat(resolved, {bigint: true}),
  ]);
  invariant(canonical === resolved && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (!requireReadOnly || (before.mode & 0o222n) === 0n),
  `${target} must be one canonical${requireReadOnly ? ' read-only' : ''} ordinary file`);
  const buffer = await readFile(resolved);
  const after = await lstat(resolved, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${target} changed during read`);
  return Object.freeze({path: absolute ? resolved : target,
    bytes: buffer.length, sha256: sha256(buffer), buffer,
    ...(json ? {value: JSON.parse(buffer.toString('utf8'))} : {})});
}

function descriptor(file, pathOverride = file.path) {
  return Object.freeze({path: pathOverride, bytes: file.bytes,
    sha256: file.sha256});
}

async function readSourceRoot() {
  const requested = process.env[SOURCE_ENV];
  invariant(typeof requested === 'string' && requested.length > 0,
    `${SOURCE_ENV} is required`);
  const root = path.resolve(requested);
  const shared = path.join(root, 'G6-G8-shared');
  for (const [target, label] of [[root, SOURCE_ENV], [shared,
    `${SOURCE_ENV}/G6-G8-shared`]]) {
    const [canonical, metadata] = await Promise.all([
      realpath(target), lstat(target, {bigint: true}),
    ]);
    invariant(canonical === target && metadata.isDirectory() &&
      !metadata.isSymbolicLink() && (metadata.mode & 0o222n) === 0n,
    `${label} must be one canonical read-only directory`);
  }
  return shared;
}

async function resolveInputs() {
  const [catalog, predecessor, toolchain, builder, sharedRoot] =
    await Promise.all([
      stableFile(CATALOG, {json: true}),
      stableFile(PREDECESSOR, {json: true}),
      stableFile(TOOLCHAIN, {json: true}),
      stableFile(path.relative(ROOT, SCRIPT_PATH)),
      readSourceRoot(),
    ]);
  invariant(predecessor.sha256 === PREDECESSOR_SHA256 &&
    predecessor.value.registrationCandidatePlacementCount === 342,
  'final342 predecessor identity/count drifted');
  const lesson = catalog.value.lessons.find((candidate) =>
    candidate.stableLessonKey === LESSON_KEY);
  invariant(lesson?.activePageCount === 44 &&
    lesson.sourceXml?.sha256 === LESSON_XML_SHA256 &&
    lesson.pages.length === 44,
  'ALG001 L11 source catalog/XML denominator drifted');
  const sourceLessonXml = await stableFile(
    path.join(sharedRoot, LESSON_XML_RELATIVE_PATH), {
      absolute: true,
      requireReadOnly: true,
    });
  invariant(sourceLessonXml.path ===
    path.join(sharedRoot, LESSON_XML_RELATIVE_PATH) &&
    sourceLessonXml.bytes === lesson.sourceXml.bytes &&
    sourceLessonXml.bytes === 10280 &&
    sourceLessonXml.sha256 === lesson.sourceXml.sha256 &&
    sourceLessonXml.sha256 === LESSON_XML_SHA256,
  'ALG001 L11 external source Lesson XML physical identity drifted');
  const selectedIds = predecessor.value.selectedPages
    .filter((page) => page.stableLessonKey === LESSON_KEY)
    .map((page) => page.animationId).sort();
  invariant(JSON.stringify(selectedIds) ===
    JSON.stringify([...REGISTERED_IDS].sort()),
  'final342 ALG001 L11 registered placement set drifted');
  const residual = lesson.pages.filter((page) =>
    !selectedIds.includes(page.animationId));
  invariant(JSON.stringify(residual.map((page) => page.animationId)) ===
    JSON.stringify(RESIDUAL_IDS),
  'ALG001 L11 residual placement set/order drifted');
  return Object.freeze({catalog, predecessor, toolchain, builder, sharedRoot,
    sourceLessonXml, lesson, residual});
}

async function run(command, args, cwd) {
  try {
    const result = await execFileAsync(command, args, {
      cwd, encoding: 'buffer', maxBuffer: 128 * 1024 * 1024,
    });
    return Object.freeze({stdout: result.stdout ?? Buffer.alloc(0),
      stderr: result.stderr ?? Buffer.alloc(0)});
  } catch (error) {
    const stdout = Buffer.isBuffer(error?.stdout) ? error.stdout :
      Buffer.from(error?.stdout ?? '');
    const stderr = Buffer.isBuffer(error?.stderr) ? error.stderr :
      Buffer.from(error?.stderr ?? '');
    throw new Error(`${command} failed (${error?.code ?? 'unknown'}): ${
      stderr.toString('utf8').trim() || stdout.toString('utf8').trim()}`);
  }
}

async function freezeTree(current) {
  const entries = await readdir(current, {withFileTypes: true});
  for (const entry of entries) {
    const target = path.join(current, entry.name);
    invariant(!entry.isSymbolicLink(), `${target} may not be a symlink`);
    if (entry.isDirectory()) {
      await freezeTree(target);
      await chmod(target, 0o555);
    } else {
      invariant(entry.isFile(), `${target} must be an ordinary file`);
      await chmod(target, 0o444);
    }
  }
}

async function prepareMemberDiagnostic(page, stagingRoot, sharedRoot,
  toolchain) {
  const relativeSource = page.viewPath.replace(/^G6-G8-shared\//u, '');
  invariant(relativeSource !== page.viewPath,
    `${page.animationId}: canonical view path drifted`);
  const sourcePath = path.join(sharedRoot, relativeSource);
  const source = await stableFile(sourcePath, {absolute: true,
    requireReadOnly: true});
  invariant(source.bytes === page.sourceBytes &&
    source.sha256 === page.sourceSha256,
  `${page.animationId}: physical source identity drifted`);
  const memberRoot = path.join(stagingRoot, page.animationId);
  const exportRoot = path.join(memberRoot, 'ffdec-export');
  await mkdir(memberRoot, {recursive: false});
  const xmlPath = path.join(memberRoot, 'source.xml');
  const [swfmillResult, ffdecResult] = await Promise.all([
    run('swfmill', ['swf2xml', sourcePath, xmlPath], memberRoot),
    run('ffdec', ['-onerror', 'abort', '-format', 'text:plain',
      '-export', 'script,text', exportRoot, sourcePath], memberRoot),
  ]);
  await Promise.all([
    writeFile(path.join(memberRoot, 'swfmill.stdout'),
      swfmillResult.stdout, {flag: 'wx'}),
    writeFile(path.join(memberRoot, 'swfmill.stderr'),
      swfmillResult.stderr, {flag: 'wx'}),
    writeFile(path.join(memberRoot, 'ffdec.stdout'),
      ffdecResult.stdout, {flag: 'wx'}),
    writeFile(path.join(memberRoot, 'ffdec.stderr'),
      ffdecResult.stderr, {flag: 'wx'}),
    writeFile(path.join(memberRoot, 'command-receipt.json'), stableBytes({
      schemaVersion: 1,
      animationId: page.animationId,
      source: {path: page.viewPath, bytes: source.bytes,
        sha256: source.sha256},
      commands: {
        swfmill: ['swfmill', 'swf2xml', '<canonical-read-only-source>',
          'source.xml'],
        ffdec: ['ffdec', '-onerror', 'abort', '-format', 'text:plain',
          '-export', 'script,text', 'ffdec-export',
          '<canonical-read-only-source>'],
      },
      toolchain: {
        ffdec: toolchain.value.flashForensics.ffdec,
        swfmill: toolchain.value.flashForensics.swfmill,
      },
      acceptanceEffects: FALSE_EFFECTS,
    }), {flag: 'wx'}),
  ]);
  await freezeTree(memberRoot);
  await chmod(memberRoot, 0o555);
}

async function runPool(items, concurrency, worker) {
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]);
    }
  }
  await Promise.all(Array.from({length: Math.min(concurrency, items.length)},
    () => next()));
}

async function prepareDiagnostics() {
  const inputs = await resolveInputs();
  const target = projectPath(DIAGNOSTIC_ROOT);
  invariant(!(await pathExists(target)),
    `${DIAGNOSTIC_ROOT} already exists; diagnostics are create-exclusive`);
  await mkdir(path.dirname(target), {recursive: true});
  const staging = `${target}.staging-${process.pid}-${randomUUID()}`;
  await mkdir(staging, {recursive: false});
  await runPool(inputs.residual, 4, (page) => prepareMemberDiagnostic(
    page, staging, inputs.sharedRoot, inputs.toolchain));
  await freezeTree(staging);
  await chmod(staging, 0o555);
  invariant(!(await pathExists(target)),
    `${DIAGNOSTIC_ROOT} appeared during preparation`);
  await rename(staging, target);
  return Object.freeze({prepared: true, diagnosticRoot: DIAGNOSTIC_ROOT,
    memberCount: inputs.residual.length, mode: '0555-directories-0444-files',
    acceptanceEffects: FALSE_EFFECTS});
}

async function walkFiles(root, current = root, files = []) {
  const metadata = await lstat(current, {bigint: true});
  invariant(metadata.isDirectory() && !metadata.isSymbolicLink() &&
    Number(metadata.mode & 0o777n) === 0o555,
  `${current} must be a frozen 0555 directory`);
  const entries = await readdir(current, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const target = path.join(current, entry.name);
    invariant(!entry.isSymbolicLink(), `${target} may not be a symlink`);
    if (entry.isDirectory()) await walkFiles(root, target, files);
    else {
      invariant(entry.isFile(), `${target} must be an ordinary file`);
      const file = await lstat(target, {bigint: true});
      invariant(file.nlink === 1n && Number(file.mode & 0o777n) === 0o444,
        `${target} must be a frozen 0444 single-link file`);
      files.push(target);
    }
  }
  return files;
}

async function inventory(root, suffix) {
  const files = (await walkFiles(root)).filter((file) => file.endsWith(suffix));
  const values = [];
  const checksumRows = [];
  let totalBytes = 0;
  for (const file of files) {
    const current = await stableFile(file, {absolute: true,
      requireReadOnly: true});
    const relative = path.relative(root, file).split(path.sep).join('/');
    values.push(Object.freeze({...descriptor(current, relative),
      text: current.buffer.toString('utf8').replace(/\r\n?/gu, '\n')}));
    checksumRows.push(`${current.sha256}  ${relative}\n`);
    totalBytes += current.bytes;
  }
  return Object.freeze({fileCount: files.length, totalBytes,
    checksumSetSha256: sha256(Buffer.from(checksumRows.join(''))), values});
}

async function treeInventory(root) {
  const files = await walkFiles(root);
  const rows = [];
  let totalBytes = 0;
  for (const file of files) {
    const current = await stableFile(file, {absolute: true,
      requireReadOnly: true});
    const relative = path.relative(root, file).split(path.sep).join('/');
    rows.push(`${current.sha256}  ${relative}\n`);
    totalBytes += current.bytes;
  }
  return Object.freeze({fileCount: files.length, totalBytes,
    checksumSetSha256: sha256(Buffer.from(rows.join('')))});
}

async function verifyAudioCandidates(candidates, sharedRoot) {
  const verified = [];
  for (const candidate of candidates) {
    const relative = candidate.viewPath.replace(/^G6-G8-shared\//u, '');
    invariant(relative !== candidate.viewPath,
      `${candidate.id}: audio view path drifted`);
    const file = await stableFile(path.join(sharedRoot, relative),
      {absolute: true, requireReadOnly: true});
    invariant(file.bytes === candidate.bytes &&
      file.sha256 === candidate.sha256,
    `${candidate.id}: physical audio identity drifted`);
    verified.push(Object.freeze({id: candidate.id, path: candidate.viewPath,
      bytes: file.bytes, sha256: file.sha256,
      required: candidate.required,
      hostTrigger: candidate.hostTrigger,
      replayBehavior: candidate.replayBehavior,
      acceptance: candidate.acceptance,
      physicalReadOnlyIdentityVerified: true}));
  }
  return Object.freeze(verified);
}

async function parseXml(xmlPath) {
  const result = await run('python3', ['-c', XML_PARSER, xmlPath], ROOT);
  invariant(result.stderr.length === 0,
    `${xmlPath}: Python XML parser emitted stderr`);
  return JSON.parse(result.stdout.toString('utf8'));
}

function countMatches(text, expression) {
  return [...text.matchAll(expression)].length;
}

function isKnownSwfmillBoundaryWarning(lines) {
  if (lines.length < 3 || (lines.length - 1) % 2 !== 0 ||
    lines.at(-1) !== 'WARNING: reached EOF while reading SWF') return false;
  for (let index = 0; index < lines.length - 1; index += 2) {
    if (!/^WARNING: end of tag UnknownTag is @\d+, should be @\d+$/u
      .test(lines[index]) ||
      !/^WARNING: end of tag DefineSprite is @\d+, should be @\d+$/u
        .test(lines[index + 1])) return false;
  }
  return true;
}

async function diagnosticSummary(page, sharedRoot) {
  const memberRoot = projectPath(`${DIAGNOSTIC_ROOT}/${page.animationId}`);
  const relativeSource = page.viewPath.replace(/^G6-G8-shared\//u, '');
  const source = await stableFile(path.join(sharedRoot, relativeSource),
    {absolute: true, requireReadOnly: true});
  invariant(source.bytes === page.sourceBytes &&
    source.sha256 === page.sourceSha256,
  `${page.animationId}: source changed after diagnostic extraction`);
  const [xml, scripts, texts, receipt, ffdecStdout, ffdecStderr,
    swfmillStderr, diagnosticTree, audioCandidates] =
    await Promise.all([
    stableFile(path.join(memberRoot, 'source.xml'), {absolute: true,
      requireReadOnly: true}),
    inventory(path.join(memberRoot, 'ffdec-export', 'scripts'), '.as'),
    inventory(path.join(memberRoot, 'ffdec-export', 'texts'), '.txt'),
    stableFile(path.join(memberRoot, 'command-receipt.json'), {absolute: true,
      json: true, requireReadOnly: true}),
    stableFile(path.join(memberRoot, 'ffdec.stdout'), {absolute: true,
      requireReadOnly: true}),
    stableFile(path.join(memberRoot, 'ffdec.stderr'), {absolute: true,
      requireReadOnly: true}),
    stableFile(path.join(memberRoot, 'swfmill.stderr'), {absolute: true,
      requireReadOnly: true}),
    treeInventory(memberRoot),
    verifyAudioCandidates(page.audioCueCandidates, sharedRoot),
  ]);
  invariant(receipt.value.animationId === page.animationId &&
    receipt.value.source.sha256 === source.sha256 &&
    JSON.stringify(receipt.value.acceptanceEffects) ===
      JSON.stringify(FALSE_EFFECTS),
  `${page.animationId}: diagnostic command receipt drifted`);
  const swfmillWarningLines = swfmillStderr.buffer.toString('utf8')
    .trim().split('\n').filter(Boolean);
  invariant(ffdecStdout.buffer.toString('utf8').startsWith(
    'JPEXS Free Flash Decompiler v.26.2.1\n') &&
    ffdecStderr.bytes === 0 &&
    (swfmillWarningLines.length === 0 ||
      isKnownSwfmillBoundaryWarning(swfmillWarningLines)),
  `${page.animationId}: extractor version/error log drifted`);
  const [xmlFacts, swfFacts] = await Promise.all([
    parseXml(xml.path), Promise.resolve(parseSwfSourceFacts(source.buffer)),
  ]);
  invariant(xmlFacts.rootFrameCount === swfFacts.header.rootFrameCount &&
    xmlFacts.fps === swfFacts.header.fps &&
    xmlFacts.swfVersion === swfFacts.header.version,
  `${page.animationId}: swfmill/binary parser facts disagree`);
  const scriptText = scripts.values.map((value) => value.text).join('\n');
  const namedAnimationObjectIds = xmlFacts.namedAnimationPlacements
    .map((placement) => placement.objectId);
  const stopPaths = scripts.values.filter((value) => /\bstop\s*\(\s*\)/u
    .test(value.text)).map((value) => value.path);
  const buttonActionPaths = scripts.values.filter((value) =>
    /DefineButton2_/u.test(value.path)).map((value) => value.path);
  const hostCalls = [...new Set([...scriptText.matchAll(
    /\b(?:_root|_parent|_level0)\.([A-Za-z_$][\w$]*)\s*\(/gu)]
    .map((match) => match[1]))].sort();
  const globalWrites = [...new Set([...scriptText.matchAll(
    /\b_global\.([A-Za-z_$][\w$]*)\s*(?:=|\+\+|--|\+=|-=)/gu)]
    .map((match) => match[1]))].sort();
  const glossaryKeys = [...new Set([...scriptText.matchAll(
    /_global\.KeyAttribute\s*=\s*"([^"]+)"/gu)]
    .map((match) => match[1]))].sort();
  const wrongFeedbackTexts = [...new Set([...scriptText.matchAll(
    /_global\.WrongFeed\s*=\s*"([^"]+)"/gu)]
    .map((match) => match[1]))].sort();
  const crossPageTargets = [...new Set([...scriptText.matchAll(
    /doNeedMoreHelp\s*\(\s*"([^"]+)"/gu)]
    .map((match) => match[1]))].sort();
  const randomAudioLabels = [...scriptText.matchAll(
    /_global\.rndAudio\[\d+\]\s*=\s*"([^"]+)"/gu)]
    .map((match) => match[1]);
  const answerKeyMatch = scriptText.match(
    /_global\.arrayAnswer\s*=\s*\[((?:"[^"]+"\s*,?\s*)+)\]/u);
  const answerKey = answerKeyMatch ?
    [...answerKeyMatch[1].matchAll(/"([^"]+)"/gu)].map((match) => match[1]) : [];
  const quizLabelsMatch = scriptText.match(
    /_global\.quizLabelArray\s*=\s*\[((?:"[^"]+"\s*,?\s*)+)\]/u);
  const quizLabels = quizLabelsMatch ?
    [...quizLabelsMatch[1].matchAll(/"([^"]+)"/gu)].map((match) => match[1]) : [];
  const mainDomainStopFrames = [...new Set(stopPaths.flatMap((scriptPath) => {
    const match = scriptPath.match(/^DefineSprite_(\d+)(?:_[^/]*)?\/frame_(\d+)\//u);
    return match && namedAnimationObjectIds.includes(Number(match[1])) ?
      [Number(match[2])] : [];
  }))].sort((left, right) => left - right);
  const semanticWitnesses = scripts.values.filter((value) =>
    /(?:DoHyperLinks|KeyAttribute|rndAudio|random\(|quizTryCount|WrongFeed|Mc_Right_Feed|Mc_Wrong_Feed|showRightFeed|showWrongFeed|doNeedMoreHelp|gameLevel|ansClickCount|_global\.score|doGetRandomQuiz|arrayAnswer|quizLabelArray|setBookMark|doPlayFQ|setMediaFrame|setProgressBar|startDrag\s*\(|stopDrag\s*\()/u
      .test(value.text)).map((value) => Object.freeze({
        path: value.path, bytes: value.bytes, sha256: value.sha256,
      }));
  const sourceDomains = swfFacts.frameDomains.domains.filter((domain) =>
    domain.staticallyRootReachable).map((domain) => Object.freeze({
      domainId: domain.domainId,
      frameCount: domain.declaredFrameCount,
      parentDomainIds: domain.parentDomainIds,
      placedSpriteIds: domain.placedSpriteIds,
      scriptTagCount: domain.scriptTagCount,
      audioTagCount: domain.audioTagCount,
      fingerprintSha256: domain.domainFingerprintSha256,
    }));
  return Object.freeze({
    animationId: page.animationId,
    source: Object.freeze({path: page.viewPath, bytes: source.bytes,
      sha256: source.sha256, swfMagic: page.swfMagic}),
    sectionCode: page.sectionCode,
    sectionPageOrdinal: page.sectionPageOrdinal,
    titleEnglish: page.titleEnglish,
    runtime: Object.freeze({stage: swfFacts.header.stage,
      fps: swfFacts.header.fps,
      rootFrameCount: swfFacts.header.rootFrameCount,
      actionScriptVersion: swfFacts.actionScript.version,
      rootReachableDomains: Object.freeze(sourceDomains),
      namedAnimationPlacements: Object.freeze(xmlFacts.namedAnimationPlacements),
      defineSpriteCount: xmlFacts.defineSpriteCount,
      defineButton2Count: xmlFacts.defineButton2Count}),
    structuralSignals: Object.freeze({
      scriptFileCount: scripts.fileCount,
      scriptChecksumSetSha256: scripts.checksumSetSha256,
      textFileCount: texts.fileCount,
      textChecksumSetSha256: texts.checksumSetSha256,
      stopScriptCount: stopPaths.length,
      stopScriptPaths: Object.freeze(stopPaths),
      buttonActionCount: buttonActionPaths.length,
      buttonActionPaths: Object.freeze(buttonActionPaths),
      hostCalls: Object.freeze(hostCalls),
      globalWrites: Object.freeze(globalWrites),
      randomCallCount: countMatches(scriptText, /\brandom\s*\(/gu),
      getUrlCallCount: countMatches(scriptText, /\bgetURL\s*\(/gu),
      loadMovieCallCount: countMatches(scriptText, /\bloadMovie(?:Num)?\s*\(/gu),
      startDragCallCount: countMatches(scriptText, /\bstartDrag\s*\(/gu),
      stopDragCallCount: countMatches(scriptText, /\bstopDrag\s*\(/gu),
      rightFeedbackCallCount: countMatches(scriptText,
        /\b(?:showRightFeed|rightFeed)\s*\(/gu),
      wrongFeedbackCallCount: countMatches(scriptText,
        /\b(?:showWrongFeed|wrongFeed)\s*\(/gu),
      nextScreenCallCount: countMatches(scriptText,
        /\b(?:doNextScreen|nextScreen|doNeedMoreHelp)\s*\(/gu),
    }),
    sourceSemantics: Object.freeze({
      glossaryKeys: Object.freeze(glossaryKeys),
      wrongFeedbackTexts: Object.freeze(wrongFeedbackTexts),
      crossPageTargets: Object.freeze(crossPageTargets),
      randomAudioLabels: Object.freeze(randomAudioLabels),
      mainDomainStopFrames: Object.freeze(mainDomainStopFrames),
      rightFeedbackClipReferenceCount: countMatches(scriptText,
        /\bMc_Right_Feed\w*/gu),
      wrongFeedbackClipReferenceCount: countMatches(scriptText,
        /\bMc_Wrong_Feed\w*/gu),
      quizTryCountReferenceCount: countMatches(scriptText,
        /_global\.quizTryCount/gu),
      needMoreHelpControlReferenceCount: countMatches(scriptText,
        /\bNMHBtn\b/gu),
      scoreMutationCount: countMatches(scriptText,
        /_global\.score\s*(?:=|\+=|-=|\+\+|--)/gu),
      answerKey: Object.freeze(answerKey),
      quizLabels: Object.freeze(quizLabels),
      semanticScriptWitnesses: Object.freeze(semanticWitnesses),
    }),
    audioLane: Object.freeze({status: page.audioStatus,
      catalogCandidateCount: audioCandidates.length,
      candidates: audioCandidates,
      accepted: false}),
    diagnosticEvidence: Object.freeze({
      root: DIAGNOSTIC_ROOT,
      sourceXml: descriptor(xml,
        `${DIAGNOSTIC_ROOT}/${page.animationId}/source.xml`),
      scripts: Object.freeze({fileCount: scripts.fileCount,
        totalBytes: scripts.totalBytes,
        checksumSetSha256: scripts.checksumSetSha256}),
      texts: Object.freeze({fileCount: texts.fileCount,
        totalBytes: texts.totalBytes,
        checksumSetSha256: texts.checksumSetSha256}),
      commandReceipt: descriptor(receipt,
        `${DIAGNOSTIC_ROOT}/${page.animationId}/command-receipt.json`),
      frozenTree: diagnosticTree,
      xmlParser: xmlFacts.parser,
      swfmillWarnings: Object.freeze(swfmillWarningLines),
      swfmillWarningLog: descriptor(swfmillStderr,
        `${DIAGNOSTIC_ROOT}/${page.animationId}/swfmill.stderr`),
    }),
  });
}

function routeMember(summary) {
  const matches = FAMILY_ROUTES.filter((family) =>
    family.ids.includes(summary.animationId));
  invariant(matches.length === 1,
    `${summary.animationId}: expected one exact family route`);
  const family = matches[0];
  const structural = summary.structuralSignals;
  const semantic = summary.sourceSemantics;
  invariant(summary.runtime.stage.width === 800 &&
    summary.runtime.stage.height === 600 && summary.runtime.fps === 12 &&
    summary.runtime.rootFrameCount === 10 &&
    summary.runtime.actionScriptVersion === 'AS1/2' &&
    summary.runtime.namedAnimationPlacements.length === 1 &&
    summary.runtime.namedAnimationPlacements[0].frameCount > 0 &&
    summary.runtime.rootReachableDomains.some((domain) =>
      domain.domainId === `sprite-${
        summary.runtime.namedAnimationPlacements[0].objectId}`),
  `${summary.animationId}: named source timeline binding drifted`);

  switch (family.familyId) {
    case 'l11-intro-media-scrubber':
      invariant(structural.startDragCallCount >= 1 &&
        structural.stopDragCallCount >= 1 &&
        structural.hostCalls.includes('setMediaFrame') &&
        structural.hostCalls.includes('setProgressBar') &&
        semantic.answerKey.length === 0,
      `${summary.animationId}: media scrubber semantics drifted`);
      break;
    case 'l11-narrated-linear-glossary':
      invariant(structural.randomCallCount === 0 &&
        structural.rightFeedbackCallCount === 0 &&
        structural.wrongFeedbackCallCount === 0 &&
        semantic.quizTryCountReferenceCount === 0 &&
        semantic.glossaryKeys.length > 0 &&
        structural.hostCalls.includes('DoHyperLinks'),
      `${summary.animationId}: narrated linear/glossary semantics drifted`);
      break;
    case 'l11-random-audio-label-timeline':
      invariant(structural.randomCallCount === 1 &&
        JSON.stringify(semantic.randomAudioLabels) ===
          JSON.stringify(['S1', 'S2', 'S3', 'S4']) &&
        structural.globalWrites.includes('rndAudio') &&
        semantic.answerKey.length === 0,
      `${summary.animationId}: random audio label semantics drifted`);
      break;
    case 'l11-two-try-need-more-help':
      invariant(semantic.quizTryCountReferenceCount >= 3 &&
        semantic.needMoreHelpControlReferenceCount >= 1 &&
        structural.rightFeedbackCallCount === 0 &&
        structural.wrongFeedbackCallCount === 0 &&
        structural.randomCallCount === 0,
      `${summary.animationId}: two-try Need More Help semantics drifted`);
      break;
    case 'l11-choice-feedback-practice':
      invariant(semantic.quizTryCountReferenceCount >= 4 &&
        structural.rightFeedbackCallCount >= 1 &&
        structural.wrongFeedbackCallCount >= 1 &&
        structural.randomCallCount === 0,
      `${summary.animationId}: choice feedback practice semantics drifted`);
      break;
    case 'l11-tutorial-multi-question-choice':
      invariant(semantic.quizTryCountReferenceCount >= 4 &&
        semantic.rightFeedbackClipReferenceCount >= 1 &&
        semantic.wrongFeedbackClipReferenceCount >= 1 &&
        semantic.needMoreHelpControlReferenceCount >= 2 &&
        structural.randomCallCount === 0,
      `${summary.animationId}: tutorial multi-question semantics drifted`);
      break;
    case 'l11-game-controller-cross-page':
      invariant(JSON.stringify(semantic.crossPageTargets) ===
        JSON.stringify(['L11GS03']) &&
        structural.nextScreenCallCount === 2 &&
        structural.globalWrites.includes('gameLevel1') &&
        structural.globalWrites.includes('gameLevel2') &&
        structural.globalWrites.includes('startGame'),
      `${summary.animationId}: cross-page game-controller semantics drifted`);
      break;
    case 'l11-matching-game':
      invariant(summary.runtime.namedAnimationPlacements[0].frameCount === 5 &&
        structural.globalWrites.includes('ansClickCount') &&
        structural.globalWrites.includes('score') &&
        semantic.scoreMutationCount >= 2 &&
        semantic.mainDomainStopFrames.length >= 2,
      `${summary.animationId}: two-level matching-game semantics drifted`);
      break;
    case 'l11-guided-tutorial-choice':
      invariant(structural.stopScriptCount >= 40 &&
        structural.rightFeedbackCallCount >= 1 &&
        structural.wrongFeedbackCallCount >= 1 &&
        semantic.quizTryCountReferenceCount >= 4 &&
        semantic.needMoreHelpControlReferenceCount >= 2,
      `${summary.animationId}: guided tutorial choice semantics drifted`);
      break;
    case 'l11-random-final-assessment':
      invariant(summary.runtime.namedAnimationPlacements[0].frameCount === 69 &&
        structural.randomCallCount === 1 &&
        structural.getUrlCallCount === 2 &&
        semantic.answerKey.length === 24 &&
        semantic.quizLabels.length === 24 &&
        structural.hostCalls.includes('doGetRandomQuiz') &&
        structural.hostCalls.includes('doGetReview') &&
        structural.hostCalls.includes('setBookMark'),
      `${summary.animationId}: random final-assessment semantics drifted`);
      break;
    default:
      invariant(false, `${summary.animationId}: unknown family route`);
  }

  const p1Blockers = [...family.p1Blockers,
    'authoritative-original-runtime-natural-trace-not-established',
    'visual-fidelity-and-human-review-not-accepted'];
  if (summary.audioLane.catalogCandidateCount > 0 ||
    family.familyId === 'l11-random-final-assessment') {
    p1Blockers.push('source-audio-trigger-sync-replay-and-listening-not-accepted');
  }
  if (summary.diagnosticEvidence.swfmillWarnings.length > 0) {
    p1Blockers.push(
      'swfmill-tag-boundary-eof-warning-requires-independent-ffdec-binary-review');
  }
  return Object.freeze({...summary,
    routing: Object.freeze({familyId: family.familyId,
      familyPlacementCount: family.ids.length,
      complexity: family.complexity,
      implementationLane: family.implementationLane,
      laneReason: family.reason,
      reusableCandidate: family.reusableCandidate,
      reuseStatus: family.reusableCandidate ?
        'candidate-only-exact-semantic-diff-required' :
        'new-family-representative-slice-required',
      reuseAuthorized: false,
      familyCalibrationPassed: false,
      p1Blockers: Object.freeze(p1Blockers)}),
    registrationCandidate: false,
    productCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false,
    acceptanceEffects: FALSE_EFFECTS,
  });
}

export function deriveFinalAssessmentAudioHostCalls(hostCalls) {
  invariant(Array.isArray(hostCalls) && hostCalls.every((call) =>
    typeof call === 'string'),
  'final-assessment extracted host calls must be strings');
  const observed = hostCalls.filter((call) => call.startsWith('doPlayFQ'))
    .slice().sort();
  invariant(JSON.stringify(observed) === JSON.stringify([
    'doPlayFQAnswerAudio', 'doPlayFQQuestionAudio',
  ]),
  'final-assessment extracted audio host-call contract drifted');
  return Object.freeze(observed);
}

async function groupedFinalAssessmentAudio(lesson, sharedRoot,
  finalAssessmentMember) {
  invariant(lesson.audioGroupedCandidates.length === 120 &&
    lesson.audioGroupedCandidates.every((candidate) =>
      candidate.binding === 'FQ/EA'),
  'ALG001 L11 grouped final-assessment audio denominator drifted');
  const candidates = await verifyAudioCandidates(
    lesson.audioGroupedCandidates, sharedRoot);
  const rows = candidates.map((candidate) =>
    `${candidate.sha256}  ${candidate.path}\n`);
  invariant(finalAssessmentMember?.animationId ===
    'shared-alg001-l11-p044',
  'grouped final-assessment audio must bind exact p044 member');
  const hostCallsObserved = deriveFinalAssessmentAudioHostCalls(
    finalAssessmentMember.structuralSignals.hostCalls);
  return Object.freeze({binding: 'FQ/EA', catalogCandidateCount: 120,
    physicalReadOnlyIdentityVerifiedCount: candidates.length,
    totalBytes: candidates.reduce((sum, candidate) =>
      sum + candidate.bytes, 0),
    checksumSetSha256: sha256(Buffer.from(rows.join(''))),
    sourceQuestionCount: 24,
    expectedPerQuestionCueCount: 5,
    hostCallsObserved,
    hostCallsEvidence: Object.freeze({
      animationId: finalAssessmentMember.animationId,
      ffdecScriptChecksumSetSha256:
        finalAssessmentMember.structuralSignals.scriptChecksumSetSha256,
      derivation:
        'exact doPlayFQ-prefixed calls parsed from frozen FFDec script exports',
    }),
    required: null,
    triggerSyncReplayResolved: false,
    listeningAccepted: false,
    acceptanceEffects: FALSE_EFFECTS});
}

function countBy(values, field) {
  return Object.freeze(Object.fromEntries([...new Set(values.map((value) =>
    value.routing[field]))].sort().map((key) => [key,
    values.filter((value) => value.routing[field] === key).length])));
}

async function expectedArtifact() {
  const inputs = await resolveInputs();
  const routed = [];
  for (const page of inputs.residual) {
    routed.push(routeMember(await diagnosticSummary(page,
      inputs.sharedRoot)));
  }
  invariant(routed.length === 35 && routed.every((member) =>
    RESIDUAL_IDS.includes(member.animationId) &&
    member.acceptanceEffects === FALSE_EFFECTS),
  'routed residual member set/effects drifted');
  const familyIds = FAMILY_ROUTES.flatMap((family) => family.ids);
  invariant(familyIds.length === 35 && new Set(familyIds).size === 35 &&
    JSON.stringify(familyIds.slice().sort()) ===
      JSON.stringify(RESIDUAL_IDS.slice().sort()),
  'family routing must partition the exact residual set once');
  const finalAssessmentMember = routed.find((member) =>
    member.animationId === 'shared-alg001-l11-p044');
  const groupedAudio = await groupedFinalAssessmentAudio(inputs.lesson,
    inputs.sharedRoot, finalAssessmentMember);
  const pageAudioCandidateCount = routed.reduce((sum, member) =>
    sum + member.audioLane.catalogCandidateCount, 0);
  const swfmillWarningMemberCount = routed.filter((member) =>
    member.diagnosticEvidence.swfmillWarnings.length > 0).length;
  invariant(pageAudioCandidateCount === 32,
    'ALG001 L11 residual page-audio candidate count drifted');
  invariant(swfmillWarningMemberCount === 10,
    'ALG001 L11 swfmill warning-member count drifted');
  const uniqueP1Blockers = [...new Set(routed.flatMap((member) =>
    member.routing.p1Blockers))].sort();
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-alg-l11-residual-routing-audit-v1',
    generatedAt: new Date().toISOString(),
    status: 'exact-35-source-script-text-routed-no-registration',
    inputs: Object.freeze({
      sharedCatalog: descriptor(inputs.catalog),
      sourceLessonXml: Object.freeze({
        path: inputs.lesson.sourceXml.path,
        externalAbsolutePath: inputs.sourceLessonXml.path,
        bytes: inputs.sourceLessonXml.bytes,
        sha256: inputs.sourceLessonXml.sha256,
        physicalReadOnlyOrdinarySingleLinkVerified: true,
        catalogIdentityMatched: true,
      }),
      predecessorFinal342: descriptor(inputs.predecessor),
      toolchain: descriptor(inputs.toolchain),
      builder: descriptor(inputs.builder),
      diagnosticRoot: DIAGNOSTIC_ROOT,
    }),
    stableLessonKey: LESSON_KEY,
    moduleCode: 'ALG001',
    lessonNumber: 11,
    lessonActivePageCount: 44,
    predecessorRegisteredPageCount: 9,
    auditedResidualPlacementCount: routed.length,
    residualPlacementIds: RESIDUAL_IDS,
    familyCount: FAMILY_ROUTES.length,
    familyCounts: countBy(routed, 'familyId'),
    complexityCounts: countBy(routed, 'complexity'),
    implementationLaneCounts: countBy(routed, 'implementationLane'),
    sourceIdentityVerifiedCount: routed.length,
    swfmillXmlParsedCount: routed.length,
    swfmillCleanMemberCount: routed.length - swfmillWarningMemberCount,
    swfmillWarningMemberCount,
    ffdecScriptInventoryVerifiedCount: routed.length,
    ffdecTextInventoryVerifiedCount: routed.length,
    frozenDiagnosticMemberCount: routed.length,
    pageAudioCandidateCount,
    pageAudioPhysicalIdentityVerifiedCount: pageAudioCandidateCount,
    groupedFinalAssessmentAudio: groupedAudio,
    members: Object.freeze(routed),
    registrationCandidatePlacementCount: 0,
    currentJavaScriptRegisteredPlacementCount: 0,
    productCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false,
    scaleOutAuthorized: false,
    p1BlockerCount: uniqueP1Blockers.length,
    p1Blockers: Object.freeze(uniqueP1Blockers),
    limitations: Object.freeze([
      'The exact 35-member artifact is source-bound routing evidence only; it does not implement or register JavaScript.',
      'A reusableCandidate records a review target, not semantic equivalence or scale-out authorization; every candidate requires an exact source-semantic diff and representative product slice.',
      'swfmill XML, FFDec scripts/texts, and binary parser facts establish static structure only; they do not establish original-runtime causality, appearance, audio, or fidelity.',
      'Legacy bookmark, report, close, loadMovie, glossary, and cross-page calls are recorded as evidence and are never executed by this audit.',
      'All audio bindings remain candidate evidence with unknown requirement/trigger/replay semantics and no named-human listening acceptance.',
    ]),
    acceptanceEffects: FALSE_EFFECTS,
  });
}

export async function auditG678AlgL11ResidualRouting({check = false} = {}) {
  const artifact = await expectedArtifact();
  let bytes;
  if (check) {
    const current = await stableFile(OUTPUT, {json: true,
      requireReadOnly: true});
    bytes = current.buffer;
    const expected = stableBytes({...artifact,
      generatedAt: current.value.generatedAt});
    invariant(bytes.equals(expected),
      'ALG001 L11 residual routing audit drifted');
  } else {
    const target = projectPath(OUTPUT);
    invariant(!(await pathExists(target)),
      `${OUTPUT} already exists; artifact is create-exclusive`);
    bytes = stableBytes(artifact);
    await writeFile(target, bytes, {flag: 'wx', mode: 0o444});
    await chmod(target, 0o444);
  }
  return Object.freeze({check, output: OUTPUT, bytes: bytes.length,
    sha256: sha256(bytes), auditedResidualPlacementCount: 35,
    familyCount: 10, pageAudioCandidateCount: 32,
    groupedFinalAssessmentAudioCandidateCount: 120,
    registrationCandidatePlacementCount: 0,
    productCalibrationPassed: false,
    acceptanceEffects: FALSE_EFFECTS});
}

async function summarizeDiagnostics() {
  const inputs = await resolveInputs();
  const summaries = [];
  for (const page of inputs.residual) {
    summaries.push(await diagnosticSummary(page, inputs.sharedRoot));
  }
  return summaries.map((summary) => ({
    id: summary.animationId,
    section: `${summary.sectionCode}${String(summary.sectionPageOrdinal)
      .padStart(2, '0')}`,
    title: summary.titleEnglish,
    rootFrames: summary.runtime.rootFrameCount,
    named: summary.runtime.namedAnimationPlacements,
    reachable: summary.runtime.rootReachableDomains.map((domain) =>
      `${domain.domainId}:${domain.frameCount}`),
    buttons: summary.structuralSignals.defineButton2Count,
    buttonActions: summary.structuralSignals.buttonActionCount,
    stops: summary.structuralSignals.stopScriptCount,
    random: summary.structuralSignals.randomCallCount,
    right: summary.structuralSignals.rightFeedbackCallCount,
    wrong: summary.structuralSignals.wrongFeedbackCallCount,
    next: summary.structuralSignals.nextScreenCallCount,
    drag: `${summary.structuralSignals.startDragCallCount}/${
      summary.structuralSignals.stopDragCallCount}`,
    getUrl: summary.structuralSignals.getUrlCallCount,
    loadMovie: summary.structuralSignals.loadMovieCallCount,
    hostCalls: summary.structuralSignals.hostCalls,
    globals: summary.structuralSignals.globalWrites,
    audio: summary.audioLane.catalogCandidateCount,
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || [
    '--check', '--prepare-diagnostics', '--summarize-diagnostics',
  ].includes(args[0])),
  'usage: audit-g678-alg-l11-residual-routing.mjs [--check | --prepare-diagnostics | --summarize-diagnostics]');
  let operation;
  if (args[0] === '--prepare-diagnostics') operation = prepareDiagnostics();
  else if (args[0] === '--summarize-diagnostics') {
    operation = summarizeDiagnostics();
  } else operation = auditG678AlgL11ResidualRouting({check: args[0] === '--check'});
  operation
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
