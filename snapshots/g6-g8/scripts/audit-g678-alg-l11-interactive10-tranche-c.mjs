#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {
  chmod,
  lstat,
  readFile,
  readdir,
  realpath,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {parseSwfSourceFacts} from
  './build-g4-l3-machine-source-audits.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SOURCE_ENV = 'HELP_MATH_G678_SOURCE_ROOT';
const RESIDUAL = 'catalog/g678-alg-l11-residual-routing-audit-v1.json';
const RESIDUAL_BYTES = 654262;
const RESIDUAL_SHA256 =
  '3d9f30ca17554b9c3cd0e8c0f51273affad3584eb4795a59359ee68fb783891c';
const RESIDUAL_BUILDER = 'scripts/audit-g678-alg-l11-residual-routing.mjs';
const RESIDUAL_BUILDER_BYTES = 49473;
const RESIDUAL_BUILDER_SHA256 =
  'a1010356e7ba67e59a58a6c6f7f1665867a154d21b83f302b6c82b7100c08284';
const DIAGNOSTIC_ROOT =
  'work/g678-shared-page-factory/g678-alg-l11-residual-routing-audit-v1';
export const OUTPUT =
  'catalog/g678-alg-l11-interactive10-tranche-c-audit-v1.json';

const FALSE_EFFECTS = Object.freeze({
  currentJavaScriptRegistered: false,
  registrationCandidate: false,
  productCalibrationPassed: false,
  browserCalibrationPassed: false,
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

const COMMON_CORRECT_SCRIPT =
  'on(release){\n   _root.disableQuizButton();\n' +
  '   _root.showRightFeed();\n}\n';

const CHOICE_CONFIG = Object.freeze({
  'shared-alg001-l11-p008': Object.freeze({
    quizFrame: 68,
    correctScript: 'DefineButton2_170/BUTTONCONDACTION on(release).as',
    wrongScripts: Object.freeze([
      'DefineButton2_171/BUTTONCONDACTION on(release).as',
    ]),
    tryMutationModel: 'feedback-endpoint',
    baseWrongText:
      'This is a graph of the inequality: the absolute value of x is less than 3.',
    retryWrongText:
      'This is a graph of the inequality: the absolute value of x is less than 3. Try again.',
    dismissCount: 2,
    geometryMode: 'text-row',
  }),
  'shared-alg001-l11-p011': Object.freeze({
    quizFrame: 87,
    correctScript: 'DefineButton2_168/BUTTONCONDACTION on(release).as',
    wrongScripts: Object.freeze([
      'DefineButton2_169/BUTTONCONDACTION on(release).as',
    ]),
    tryMutationModel: 'feedback-endpoint',
    baseWrongText:
      'Remember that when you multiply or divide by a negative number in an inequality you must reverse the direction of the inequality symbol.',
    retryWrongText:
      'Remember that when you multiply or divide by a negative number in an inequality you must reverse the direction of the inequality symbol. Try again.',
    dismissCount: 2,
    needMoreHelpScripts: Object.freeze([
      'DefineButton2_8/BUTTONCONDACTION on(release).as',
      'DefineButton2_48/BUTTONCONDACTION on(release).as',
    ]),
    geometryMode: 'text-row',
  }),
  'shared-alg001-l11-p014': Object.freeze({
    quizFrame: 137,
    correctScript: 'DefineButton2_28/BUTTONCONDACTION on(release).as',
    wrongScripts: Object.freeze([
      'DefineButton2_27/BUTTONCONDACTION on(release).as',
    ]),
    tryMutationModel: 'selection',
    baseWrongText: 'Find the symbol for greater than or equal to. ',
    retryWrongText:
      'Find the symbol for greater than or equal to. Try again!',
    dismissCount: 3,
    geometryMode: 'text-row',
  }),
  'shared-alg001-l11-p019': Object.freeze({
    quizFrame: 239,
    correctScript: 'DefineButton2_47/BUTTONCONDACTION on(release).as',
    wrongScripts: Object.freeze([
      'DefineButton2_46/BUTTONCONDACTION on(release).as',
    ]),
    tryMutationModel: 'selection',
    baseWrongText:
      'Simplify the inequality.  You can add or subtract any positive or negative number from the inequality. ',
    retryWrongText:
      'Simplify the inequality.  You can add or subtract any positive or negative number from the inequality. Try again!!',
    dismissCount: 3,
    geometryMode: 'number-line-row',
  }),
  'shared-alg001-l11-p020': Object.freeze({
    quizFrame: 111,
    correctScript: 'DefineButton2_48/BUTTONCONDACTION on(release).as',
    wrongScripts: Object.freeze([
      'DefineButton2_47/BUTTONCONDACTION on(release).as',
    ]),
    tryMutationModel: 'selection',
    baseWrongText:
      'Simplify the inequality.  You can add or subtract any positive or negative number from the inequality.',
    retryWrongText:
      'Simplify the inequality.  You can add or subtract any positive or negative number from the inequality. Try again!',
    dismissCount: 3,
    geometryMode: 'number-line-row',
  }),
  'shared-alg001-l11-p021': Object.freeze({
    quizFrame: 121,
    correctScript: 'DefineButton2_45/BUTTONCONDACTION on(release).as',
    wrongScripts: Object.freeze([
      'DefineButton2_44/BUTTONCONDACTION on(release).as',
      'DefineButton2_46/BUTTONCONDACTION on(release).as',
    ]),
    tryMutationModel: 'p021-split',
    baseWrongText:
      'Simplify the inequality. If you multiply or divide an inequality by a negative number, reverse the direction of the inequality symbol.',
    retryWrongText:
      'Simplify the inequality. If you multiply or divide an inequality by a negative number, reverse the direction of the inequality symbol. Try again.',
    dismissCount: 3,
    geometryMode: 'number-line-row',
  }),
  'shared-alg001-l11-p025': Object.freeze({
    quizFrame: 68,
    correctScript: 'DefineButton2_56/BUTTONCONDACTION on(release).as',
    wrongScripts: Object.freeze([
      'DefineButton2_55/BUTTONCONDACTION on(release).as',
    ]),
    tryMutationModel: 'selection',
    baseWrongText:
      'This is a graph of the inequality: The absolute value of x less than 7.',
    retryWrongText:
      'This is a graph of the inequality: The absolute value of x less than 7.  Try again!',
    dismissCount: 3,
    geometryMode: 'text-row',
  }),
});

const EXPECTED = Object.freeze([
  ['shared-alg001-l11-p006', 'VB', 2, 'L11VB03.swf', 60698,
    '99e16233803ad705db3c00602aa01c987e072fe5a25b92a8f17b68a5228e464b',
    50, 53, 'l11-random-audio-label-timeline',
    'compiler-assisted-random-audio-state-adapter', 'L11VB03.mp3', 49392,
    '12b83734f9549040ade1a2b17a0e52721e08e7e275f2de54a0b71355df75c78e'],
  ['shared-alg001-l11-p008', 'VB', 4, 'L11VB05.swf', 337089,
    '5875c3606fdc2e8c110ee5b3bbd24140d83dd76e5df15e7aacfc80fdaf9240e3',
    176, 178, 'l11-choice-feedback-practice',
    'compiler-assisted-choice-feedback-state-machine', 'L11VB05.mp3', 73920,
    '0e1fd5f5c334643f45edf49c016902d91c7e248e209783ece3a505458764869f'],
  ['shared-alg001-l11-p009', 'VB', 5, 'L11VB06.swf', 259884,
    'be0691900b2a6f0da6e991e42ddd828b5447b3e9cd4cc521861f34cbc153ae59',
    65, 431, 'l11-two-try-need-more-help',
    'compiler-assisted-two-try-help-state-adapter', 'L11VB06.mp3', 130704,
    'f1dd59f74dd06b0d683910c4c0a9ea2e9da3ce6861eeb12882dd5526ac2e9605'],
  ['shared-alg001-l11-p010', 'VB', 6, 'L11VB07.swf', 224821,
    'fbd57827ff58fa20f070aeaa4f126048b2777c702ec29eb5ca23001972642366',
    75, 394, 'l11-two-try-need-more-help',
    'compiler-assisted-two-try-help-state-adapter', 'L11VB07.mp3', 168336,
    '00ba0f8ba8fabd094fb73e188eab6ed21cd695f96ee98e18d3b0bdb693343e40'],
  ['shared-alg001-l11-p011', 'VB', 7, 'L11VB08.swf', 398309,
    'c7c2b870244b6723cc97a44668ef9bf0f1e594f8fb803acd61d596c1981736e2',
    185, 320, 'l11-choice-feedback-practice',
    'compiler-assisted-choice-feedback-state-machine', 'L11VB08.mp3', 91728,
    'c675d5a4409b020883b74fe44332efff932bc2ab3d8f29dbf1cf3dd85cb93100'],
  ['shared-alg001-l11-p014', 'IN', 3, 'L11IN04.swf', 817534,
    '06deceb1a665fce790adec00774176d48451e237e545467dabdf93b2ef7c9ce1',
    177, 220, 'l11-choice-feedback-practice',
    'compiler-assisted-choice-feedback-state-machine', 'L11IN04.mp3', 166656,
    'aed61c700c895fa013747661517c900958c75fd49c4a4fa6c589ef80f568814a'],
  ['shared-alg001-l11-p019', 'IN', 8, 'L11IN09.swf', 242927,
    'f9fe0392510752ffd9bd91b96f623b1c508b919913f8b78ace3d3ceaebaa5c63',
    205, 361, 'l11-choice-feedback-practice',
    'compiler-assisted-choice-feedback-state-machine', 'L11IN09.mp3', 196560,
    'f0942b307c8074ce9663ff106d2cf00cdd86a16118c1b86f0e61f485784f7724'],
  ['shared-alg001-l11-p020', 'IN', 9, 'L11IN10.swf', 803422,
    '246138f95b39f1d7e1022930e722085b6084c918d9d81f56f26d816d9a30bb2f',
    197, 225, 'l11-choice-feedback-practice',
    'compiler-assisted-choice-feedback-state-machine', 'L11IN10.mp3', 122640,
    '634e8ed85d3bb39a7964463395e9a0a813bf62b1fe22954bdcdb075a0cc2b309'],
  ['shared-alg001-l11-p021', 'IN', 10, 'L11IN11.swf', 216566,
    '9cb1f5e554cfee312bc24815882c6472550666ab8837d54b4448ce78d1b384c3',
    208, 318, 'l11-choice-feedback-practice',
    'compiler-assisted-choice-feedback-state-machine', 'L11IN11.mp3', 144816,
    '07093c86d9c6e74fce1a3addd847f6beffb2f1221183d22cdbcf2f771ed42eb5'],
  ['shared-alg001-l11-p025', 'IN', 14, 'L11IN15.swf', 783971,
    '875756026b4499a1efb7d52268e4ab6c668255303bac851651ffafa723242c4d',
    204, 177, 'l11-choice-feedback-practice',
    'compiler-assisted-choice-feedback-state-machine', 'L11IN15.mp3', 76608,
    'b0dff1791c118717c24f8c0455bb58cf1a28bfc5584a7935e577585d827d6efc'],
].map((row) => Object.freeze({
  animationId: row[0], sectionCode: row[1], sectionPageOrdinal: row[2],
  sourcePath: `G6-G8-shared/ALG001/L11/${row[1]}/${row[3]}`,
  sourceBytes: row[4], sourceSha256: row[5], mainObjectId: row[6],
  mainFrameCount: row[7], familyId: row[8], implementationLane: row[9],
  audioPath: `G6-G8-shared/ALG001/L11/SA/${row[10]}`,
  audioBytes: row[11], audioSha256: row[12],
})));

const EXPECTED_IDS = Object.freeze(EXPECTED.map((row) => row.animationId));

const FAMILY_BLOCKERS = Object.freeze({
  'l11-random-audio-label-timeline': Object.freeze([
    'source-random-event-trace-and-deterministic-replay-not-implemented',
    'random-label-audio-cue-crosswalk-not-resolved',
    'authoritative-original-runtime-natural-trace-not-established',
    'visual-fidelity-and-human-review-not-accepted',
    'source-audio-trigger-sync-replay-and-listening-not-accepted',
  ]),
  'l11-choice-feedback-practice': Object.freeze([
    'exact-choice-answer-and-feedback-text-map-not-implemented',
    'two-attempt-terminal-and-replay-state-not-product-calibrated',
    'authoritative-original-runtime-natural-trace-not-established',
    'visual-fidelity-and-human-review-not-accepted',
    'source-audio-trigger-sync-replay-and-listening-not-accepted',
  ]),
  'l11-two-try-need-more-help': Object.freeze([
    'two-try-help-state-and-replay-contract-not-implemented',
    'need-more-help-host-behavior-not-product-calibrated',
    'authoritative-original-runtime-natural-trace-not-established',
    'visual-fidelity-and-human-review-not-accepted',
    'source-audio-trigger-sync-replay-and-listening-not-accepted',
  ]),
});

const EXPECTED_LIMITATIONS = Object.freeze([
  'The frozen FFDec diagnostic script/text/XML inventories and current physical SWF/MP3 bytes are source-audited; no authoritative natural runtime trace is claimed.',
  'p009/p010 retain an explicit runtime-parent blocker because the BtnClose action targets _parent frame 65 while the button is physically nested in a one-frame popup sprite.',
  'p006 S1-S4 streamed-audio frame windows are structurally exact; cue meaning, deterministic Replay policy, external MP3 trigger/sync, and listening acceptance remain false.',
  'Each choice page binds four logical slots to exact source placement, text and shape definition hashes; absent slots are explicit, while browser pixel fidelity and human review remain later gates.',
  'p011 alone binds the one-frame source Need More Help popup, exact object 10/11 text records and open/close visibility lifecycle; the other six choice pages have zero source help scripts and authorize no help UI.',
  'This audit authorizes no candidate generation until independent P0/P1 review, and never authorizes registration, product/browser calibration, acceptance, release, or publication.',
]);

const EXPECTED_HOST_CALLS = Object.freeze({
  'shared-alg001-l11-p006': Object.freeze([
    'DoHyperLinks', 'enableButton', 'play',
  ]),
  'shared-alg001-l11-p008': Object.freeze([
    'DoHyperLinks', 'disableQuizButton', 'enableButton',
    'enableQuizButton', 'gotoAndPlay', 'play', 'showRightFeed',
    'showWrongFeed',
  ]),
  'shared-alg001-l11-p009': Object.freeze([
    'DoHyperLinks', 'enableQuizButton', 'gotoAndPlay', 'play',
  ]),
  'shared-alg001-l11-p010': Object.freeze([
    'DoHyperLinks', 'enableQuizButton', 'gotoAndPlay', 'play',
  ]),
  'shared-alg001-l11-p011': Object.freeze([
    'DoHyperLinks', 'disableQuizButton', 'enableButton',
    'enableQuizButton', 'gotoAndPlay', 'play', 'showRightFeed',
    'showWrongFeed',
  ]),
  'shared-alg001-l11-p014': Object.freeze([
    'DoHyperLinks', 'disableQuizButton', 'enableButton',
    'enableQuizButton', 'gotoAndPlay', 'play', 'showRightFeed',
    'showWrongFeed',
  ]),
  'shared-alg001-l11-p019': Object.freeze([
    'DoHyperLinks', 'disableQuizButton', 'enableButton',
    'enableQuizButton', 'gotoAndPlay', 'play', 'showRightFeed',
    'showWrongFeed',
  ]),
  'shared-alg001-l11-p020': Object.freeze([
    'DoHyperLinks', 'disableQuizButton', 'enableButton',
    'enableQuizButton', 'gotoAndPlay', 'play', 'showRightFeed',
    'showWrongFeed',
  ]),
  'shared-alg001-l11-p021': Object.freeze([
    'DoHyperLinks', 'disableQuizButton', 'enableButton',
    'enableQuizButton', 'gotoAndPlay', 'play', 'showRightFeed',
    'showWrongFeed',
  ]),
  'shared-alg001-l11-p025': Object.freeze([
    'DoHyperLinks', 'disableQuizButton', 'enableButton',
    'enableQuizButton', 'globalToLocal', 'gotoAndPlay', 'play',
    'pressFocus', 'showRightFeed', 'showWrongFeed', 'startDragLoop',
  ]),
});

// Filled from a source-derived projection and intentionally checked again by
// the standalone validator. A changed source geometry requires a new audit.
const EXPECTED_CHOICE_GEOMETRY_SHA256 = Object.freeze({
  'shared-alg001-l11-p008':
    'ce8ce9a32cdf2224a861685b46429dd878a57302b10fdab0aff987b43e07e717',
  'shared-alg001-l11-p011':
    '6cf4c65519ba459ed719a70d48935597cdefc4e8d8a0f871ffbed136349fe3ef',
  'shared-alg001-l11-p014':
    'f754403cc77ac4b7bafef5be5eb6dcef6c837ed04e7d735206f16a08f5274eed',
  'shared-alg001-l11-p019':
    '6b18ec382894fe857f7fdc17b1a6363fa212961333dae9f4ff096375b6e35d72',
  'shared-alg001-l11-p020':
    '3ab47dfb1897fd0dc31674766783ffaee434f2757dc5145182c6f83979ac49e9',
  'shared-alg001-l11-p021':
    'a3a4093e756ad438f1184d581ea53132ac1bbfb6cacb15fb437a10de8e548886',
  'shared-alg001-l11-p025':
    '00b0f4a8e1af3987b61d32928348483d72701bbfda8914811d8ddd7af920a54d',
});

// This projection closes the standalone-validator gap between high-level
// member assertions and the exact source evidence reconstructed by prepare().
// Any source-evidence change requires a successor audit, not a partial update
// to a nested receipt.
const EXPECTED_MEMBER_SOURCE_EVIDENCE_SHA256 = Object.freeze({
  'shared-alg001-l11-p006':
    '537c0d9ea429e50ddf538966c708f75a7900d5d8bc52f825040cd3d5a7874e5e',
  'shared-alg001-l11-p008':
    'ff5d08819003a84f8a812684b7d4107f119c2b7acb55705294573356162c1a84',
  'shared-alg001-l11-p009':
    '6f1c4140a738f489ab0c7f2ae88ff3f4c9522da7cbb5ea127ff80e75bb0603bc',
  'shared-alg001-l11-p010':
    '38b0d01dfc5a9fcdc38062678d603e05f0290812381c7bc3198d4e549f0c2c91',
  'shared-alg001-l11-p011':
    'be0455afb015725fdba8a6926b5dc3c9880b3aa3047a4edf25473be7c9028626',
  'shared-alg001-l11-p014':
    '83a999fa3409e68da3d459c1b35d59955735e55a5258bec6da1c77738a1fcb62',
  'shared-alg001-l11-p019':
    'a8fa6e7a51eab28c3a5eb4cc7d2b116fb3605551625de17e6d2cd5314dfcbaf4',
  'shared-alg001-l11-p020':
    'dab4e25b9a05ed51140b6c2b60b3481152354b0fd163dfcf3da9afc07eb70b69',
  'shared-alg001-l11-p021':
    '47bd3042d461f2b06251d55bb8c85bb3b79b8980103153f89a6bfc24fb6926b3',
  'shared-alg001-l11-p025':
    '499465fdb888c53cc1494794feff5afae40bf80efc685503270d109318de31d7',
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

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function stableFile(target, {absolute = false, json = false,
  readOnly = false} = {}) {
  const resolved = absolute ? path.resolve(target) : projectPath(target);
  const [before, canonical] = await Promise.all([
    lstat(resolved, {bigint: true}), realpath(resolved),
  ]);
  invariant(canonical === resolved && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (!readOnly || (before.mode & 0o222n) === 0n),
  `${target} must be one canonical${readOnly ? ' read-only' : ''} file`);
  const buffer = await readFile(resolved);
  const after = await lstat(resolved, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${target} changed during read`);
  return Object.freeze({path: absolute ? resolved : target,
    bytes: buffer.length, sha256: sha256(buffer), buffer,
    ...(json ? {value: JSON.parse(buffer)} : {})});
}

async function sourceRoot() {
  const requested = process.env[SOURCE_ENV];
  invariant(typeof requested === 'string' && path.isAbsolute(requested),
    `${SOURCE_ENV} is required as an absolute path`);
  const root = path.resolve(requested);
  const shared = path.join(root, 'G6-G8-shared');
  for (const target of [root, shared]) {
    const [canonical, metadata] = await Promise.all([
      realpath(target), lstat(target, {bigint: true}),
    ]);
    invariant(canonical === target && metadata.isDirectory() &&
      !metadata.isSymbolicLink() && (metadata.mode & 0o222n) === 0n,
    `${target} source custody drifted`);
  }
  return root;
}

async function externalFile(root, relativePath, bytes, digest) {
  const target = path.join(root, ...relativePath.split('/'));
  invariant(target.startsWith(`${root}${path.sep}`),
    `${relativePath} escapes source root`);
  const current = await stableFile(target, {absolute: true, readOnly: true});
  invariant(current.bytes === bytes && current.sha256 === digest,
    `${relativePath} physical identity drifted`);
  return Object.freeze({path: relativePath, bytes, sha256: digest});
}

async function walkFrozen(root, current = root, rows = []) {
  const directory = await lstat(current, {bigint: true});
  invariant(directory.isDirectory() && !directory.isSymbolicLink() &&
    Number(directory.mode & 0o777n) === 0o555,
  `${current} must be a frozen 0555 directory`);
  const entries = await readdir(current, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const target = path.join(current, entry.name);
    invariant(!entry.isSymbolicLink(), `${target} may not be a symlink`);
    if (entry.isDirectory()) await walkFrozen(root, target, rows);
    else {
      invariant(entry.isFile(), `${target} must be an ordinary file`);
      const currentFile = await stableFile(target,
        {absolute: true, readOnly: true});
      const metadata = await lstat(target, {bigint: true});
      invariant(Number(metadata.mode & 0o777n) === 0o444,
        `${target} must be frozen 0444`);
      rows.push(Object.freeze({path: path.relative(root, target)
        .split(path.sep).join('/'), bytes: currentFile.bytes,
      sha256: currentFile.sha256, buffer: currentFile.buffer}));
    }
  }
  return rows;
}

function inventory(rows) {
  const projection = rows.map((row) =>
    `${row.sha256}  ${row.path}\n`).join('');
  return Object.freeze({fileCount: rows.length,
    totalBytes: rows.reduce((sum, row) => sum + row.bytes, 0),
    checksumSetSha256: sha256(Buffer.from(projection))});
}

function binding(row) {
  return Object.freeze({path: row.path, bytes: row.bytes,
    sha256: row.sha256});
}

function normalizeScript(buffer) {
  return buffer.toString('utf8').replace(/\r\n?/gu, '\n');
}

function normalizeText(buffer) {
  return buffer.toString('utf8').replaceAll('--- RECORDSEPARATOR ---', ' | ')
    .replace(/\s+/gu, ' ').trim();
}

function visibleTextRecords(buffer) {
  return Object.freeze(buffer.toString('utf8')
    .split('--- RECORDSEPARATOR ---')
    .map((value) => value.replace(/\s+/gu, ' ').trim())
    .filter(Boolean));
}

function scriptByPath(rows, scriptPath) {
  const row = rows.find((candidate) => candidate.path === scriptPath);
  invariant(row, `missing exact script ${scriptPath}`);
  return row;
}

function extractSprite(xml, objectId, frameCount = null) {
  const marker = `<DefineSprite objectID="${objectId}"`;
  const start = xml.indexOf(marker);
  invariant(start >= 0, `missing DefineSprite ${objectId}`);
  const openEnd = xml.indexOf('>', start);
  const end = xml.indexOf('</DefineSprite>', openEnd);
  invariant(end > openEnd, `unterminated DefineSprite ${objectId}`);
  const opening = xml.slice(start, openEnd + 1);
  if (frameCount !== null) {
    invariant(opening.includes(`frames="${frameCount}"`),
      `DefineSprite ${objectId} frame count drifted`);
  }
  return xml.slice(start, end);
}

function activeTimelineAtFrame(xml, objectId, frameCount, targetFrame) {
  const sprite = extractSprite(xml, objectId, frameCount);
  let frame = 1;
  const active = new Map();
  const expression =
    /<ShowFrame\/>|<RemoveObject2\b([^>]*)\/>|<PlaceObject2\b([^>]*)>([\s\S]*?)<\/PlaceObject2>/gu;
  for (const match of sprite.matchAll(expression)) {
    if (match[0] === '<ShowFrame/>') {
      if (frame === targetFrame) break;
      frame += 1;
      continue;
    }
    if (match[1] !== undefined) {
      const depth = Number(match[1].match(/depth="(\d+)"/u)?.[1]);
      active.delete(depth);
      continue;
    }
    const attributes = Object.fromEntries([...match[2].matchAll(
      /(\w+)="([^"]*)"/gu)].map((item) => [item[1], item[2]]));
    const transform = match[3].match(/<Transform\b([^>]*)\/>/u)?.[1] ?? '';
    const transformAttributes = Object.fromEntries([...transform.matchAll(
      /(\w+)="([^"]*)"/gu)].map((item) => [item[1], item[2]]));
    const depth = Number(attributes.depth);
    const previous = active.get(depth) ?? {};
    active.set(depth, Object.freeze({...previous, depth,
      objectId: attributes.objectID === undefined ? previous.objectId :
        Number(attributes.objectID),
      name: attributes.name ?? previous.name ?? null,
      transX: Number(transformAttributes.transX ?? previous.transX ?? 0),
      transY: Number(transformAttributes.transY ?? previous.transY ?? 0),
      transform: Object.freeze(Object.fromEntries(Object.entries(
        transformAttributes).sort(([left], [right]) =>
        left.localeCompare(right)))),
      placementFragmentSha256: sha256(Buffer.from(match[0]))}));
  }
  invariant(frame === targetFrame, `${objectId} target frame is unavailable`);
  return active;
}

function sourceDefinition(xml, objectId) {
  const openingExpression = new RegExp(
    `<(Define[A-Za-z0-9_]*)\\b[^>]*\\bobjectID="${objectId}"[^>]*>`, 'u');
  const opening = openingExpression.exec(xml);
  invariant(opening, `source definition ${objectId} is absent`);
  const end = xml.indexOf(`</${opening[1]}>`,
    opening.index + opening[0].length);
  invariant(end >= 0, `source definition ${objectId} is unterminated`);
  const fragment = xml.slice(opening.index,
    end + `</${opening[1]}>`.length);
  return Object.freeze({objectId, type: opening[1], fragment,
    sha256: sha256(Buffer.from(fragment))});
}

function reachableDefinitionProjection(xml, objectId, textRows) {
  const textById = new Map(textRows.map((row) => [
    Number(row.path.match(/^(\d+)/u)?.[1]), row,
  ]));
  const seen = new Set();
  const values = [];
  function visit(id) {
    if (seen.has(id)) return;
    seen.add(id);
    const definition = sourceDefinition(xml, id);
    const text = textById.get(id);
    values.push(Object.freeze({objectId: id, type: definition.type,
      definitionSha256: definition.sha256,
      ...(text ? {text: Object.freeze({path: text.path, bytes: text.bytes,
        sha256: text.sha256, value: normalizeText(text.buffer)})} : {}),
      ...(definition.type.startsWith('DefineShape') ?
        {shapeSha256: definition.sha256} : {})}));
    for (const match of definition.fragment.matchAll(
      /<PlaceObject2\b[^>]*\bobjectID="(\d+)"[^>]*>/gu)) {
      visit(Number(match[1]));
    }
  }
  visit(objectId);
  return Object.freeze(values);
}

function transformedVisualBounds(xml, placement) {
  const definition = sourceDefinition(xml, placement.objectId);
  const boundsBody = definition.fragment.match(
    /<bounds>([\s\S]*?)<\/bounds>/u)?.[1];
  const rectangle = boundsBody?.match(/<Rectangle\b([^>]*)\/>/u)?.[1];
  if (!rectangle) return null;
  const attributes = Object.fromEntries([...rectangle.matchAll(
    /(\w+)="([^"]*)"/gu)].map((item) => [item[1], Number(item[2])]));
  invariant(['left', 'right', 'top', 'bottom'].every((key) =>
    Number.isFinite(attributes[key])),
  `source definition ${placement.objectId} bounds drifted`);
  const matrix = placement.transform;
  const scaleX = Number(matrix.scaleX ?? 1);
  const scaleY = Number(matrix.scaleY ?? 1);
  const skew0 = Number(matrix.rotateSkew0 ?? 0);
  const skew1 = Number(matrix.rotateSkew1 ?? 0);
  const transX = Number(matrix.transX ?? placement.transX ?? 0);
  const transY = Number(matrix.transY ?? placement.transY ?? 0);
  const corners = [
    [attributes.left, attributes.top],
    [attributes.right, attributes.top],
    [attributes.left, attributes.bottom],
    [attributes.right, attributes.bottom],
  ].map(([x, y]) => ({x: scaleX * x + skew0 * y + transX,
    y: skew1 * x + scaleY * y + transY}));
  return Object.freeze({minX: Math.min(...corners.map((item) => item.x)),
    maxX: Math.max(...corners.map((item) => item.x)),
    minY: Math.min(...corners.map((item) => item.y)),
    maxY: Math.max(...corners.map((item) => item.y))});
}

function choiceGeometryProjection(xml, texts, expected, config) {
  const active = activeTimelineAtFrame(xml, expected.mainObjectId,
    expected.mainFrameCount, config.quizFrame);
  const textById = new Map(texts.map((row) => [
    Number(row.path.match(/^(\d+)/u)?.[1]), normalizeText(row.buffer),
  ]));
  const buttons = [...active.values()].filter((placement) =>
    /^AnsBtn[1-4]$/u.test(placement.name ?? ''))
    .sort((left, right) => left.transY - right.transY);
  const labels = [...active.values()].filter((placement) =>
    /^[A-D]$/u.test(textById.get(placement.objectId) ?? ''))
    .sort((left, right) => left.transY - right.transY);
  invariant((buttons.length === 3 || buttons.length === 4) &&
    labels.length === buttons.length,
  `${expected.animationId} visible option denominator drifted`);
  const correctObjectId = Number(config.correctScript.match(
    /^DefineButton2_(\d+)\//u)?.[1]);
  const wrongObjectIds = new Set(config.wrongScripts.map((scriptPath) =>
    Number(scriptPath.match(/^DefineButton2_(\d+)\//u)?.[1])));
  const minimumButtonDepth = Math.min(...buttons.map((button) => button.depth));
  const present = [];
  for (let index = 0; index < buttons.length; index += 1) {
    const button = buttons[index];
    const label = labels[index];
    const visibleLabel = textById.get(label.objectId);
    invariant(visibleLabel === String.fromCharCode(65 + index),
      `${expected.animationId} visible option label order drifted`);
    const previousY = buttons[index - 1]?.transY;
    const nextY = buttons[index + 1]?.transY;
    const lower = previousY === undefined
      ? button.transY - (nextY - button.transY) / 2
      : (previousY + button.transY) / 2;
    const upper = nextY === undefined
      ? button.transY + (button.transY - previousY) / 2
      : (button.transY + nextY) / 2;
    const rowPlacements = [...active.values()].filter((placement) => {
      if (placement.depth >= minimumButtonDepth) return false;
      const bounds = transformedVisualBounds(xml, placement);
      if (config.geometryMode === 'number-line-row') {
        return bounds !== null && bounds.maxY >= lower && bounds.minY < upper;
      }
      return placement.transY >= lower && placement.transY < upper &&
        placement.transX < -2500;
    })
      .sort((left, right) => left.depth - right.depth)
      .map((placement) => Object.freeze({depth: placement.depth,
        objectId: placement.objectId, name: placement.name,
        transX: placement.transX, transY: placement.transY,
        transform: placement.transform,
        visualBounds: transformedVisualBounds(xml, placement),
        placementFragmentSha256: placement.placementFragmentSha256,
        reachableObjects: reachableDefinitionProjection(xml,
          placement.objectId, texts)}));
    invariant(rowPlacements.some((placement) =>
      placement.objectId === label.objectId),
    `${expected.animationId} ${visibleLabel} row omitted its label`);
    const hitTarget = Object.freeze({depth: button.depth,
      objectId: button.objectId, name: button.name,
      transX: button.transX, transY: button.transY,
      transform: button.transform,
      placementFragmentSha256: button.placementFragmentSha256,
      reachableObjects: reachableDefinitionProjection(xml,
        button.objectId, texts)});
    const correct = button.objectId === correctObjectId;
    invariant(correct || wrongObjectIds.has(button.objectId),
      `${expected.animationId} ${visibleLabel} has no answer ActionScript`);
    const projection = Object.freeze({slot: visibleLabel, present: true,
      sourceInstanceName: button.name, correct, hitTarget,
      visibleObjects: Object.freeze(rowPlacements),
      visibleTextValues: Object.freeze(rowPlacements.flatMap((placement) =>
        placement.reachableObjects.flatMap((object) =>
          object.text ? [object.text.value] : [])))});
    present.push(Object.freeze({...projection,
      geometrySha256: sha256(stableBytes(projection))}));
  }
  invariant(present.filter((slot) => slot.correct).length === 1,
    `${expected.animationId} source-correct option count drifted`);
  const slots = ['A', 'B', 'C', 'D'].map((slot) => {
    const current = present.find((item) => item.slot === slot);
    return current ?? Object.freeze({slot, present: false,
      absence: Object.freeze({unpairedNamedButtonAbsent:
        buttons.length === labels.length,
      visibleLabelAbsent: !labels.some((label) =>
        textById.get(label.objectId) === slot)})});
  });
  invariant(slots.filter((slot) => slot.present).length === buttons.length &&
    slots.filter((slot) => !slot.present).every((slot) =>
      slot.absence.unpairedNamedButtonAbsent &&
        slot.absence.visibleLabelAbsent),
  `${expected.animationId} absent option proof drifted`);
  return Object.freeze({geometryMode: config.geometryMode,
    optionSlots: Object.freeze(slots), presentOptionCount: buttons.length,
    geometrySetSha256: sha256(stableBytes(slots))});
}

function timelinePlacements(xml, objectId, frameCount) {
  const sprite = extractSprite(xml, objectId, frameCount);
  let frame = 1;
  const placements = [];
  for (const match of sprite.matchAll(
    /<ShowFrame\/>|<PlaceObject2\b([^>]*)>([\s\S]*?)<\/PlaceObject2>/gu)) {
    if (match[0] === '<ShowFrame/>') {
      frame += 1;
      continue;
    }
    const attributes = Object.fromEntries([...match[1].matchAll(
      /(\w+)="([^"]*)"/gu)].map((item) => [item[1], item[2]]));
    placements.push(Object.freeze({parentObjectId: objectId, frame,
      depth: Number(attributes.depth), objectId: Number(attributes.objectID),
      name: attributes.name ?? null,
      placementFragmentSha256: sha256(Buffer.from(match[0]))}));
  }
  return Object.freeze(placements);
}

function p011NeedMoreHelpProjection(xml, texts, needMoreHelp) {
  invariant(needMoreHelp.length === 2,
    'p011 Need More Help script denominator drifted');
  const openSource = normalizeScript(needMoreHelp[0].buffer);
  const closeSource = normalizeScript(needMoreHelp[1].buffer);
  invariant(openSource.includes('NMHBtn.enabled = false;') &&
    openSource.includes('_root.disableQuizButton();') &&
    openSource.includes('Mc_Popup._visible = true;') &&
    openSource.includes('CloseBtn._visible = true;') &&
    closeSource.includes('NMHBtn.enabled = true;') &&
    closeSource.includes('_root.enableQuizButton();') &&
    closeSource.includes('Mc_Popup._visible = false;') &&
    closeSource.includes('CloseBtn._visible = false;'),
  'p011 Need More Help visibility lifecycle drifted');
  const main = activeTimelineAtFrame(xml, 185, 320, 87);
  const popup = main.get(52);
  const closeButton = main.get(64);
  const openButton = main.get(72);
  invariant(popup?.objectId === 17 && popup.name === 'Mc_Popup' &&
    exact(popup.transform, {scaleX: '1.000076293945312',
      scaleY: '1.000000000000000', transX: '6845', transY: '-5871'}) &&
    closeButton?.objectId === 48 && closeButton.name === 'CloseBtn' &&
    exact(closeButton.transform, {scaleX: '1.000000000000000',
      scaleY: '1.002212524414062', transX: '6188', transY: '-2860'}) &&
    openButton?.objectId === 8 && openButton.name === 'NMHBtn' &&
    exact(openButton.transform, {transX: '5726', transY: '-3722'}),
  'p011 Need More Help main placement drifted');
  const popupFrame = activeTimelineAtFrame(xml, 17, 1, 1);
  const textById = new Map(texts.map((row) => [
    Number(row.path.match(/^(\d+)/u)?.[1]), row,
  ]));
  const textPlacements = [3, 4].map((depth) => {
    const placement = popupFrame.get(depth);
    const expectedObjectId = depth === 3 ? 10 : 11;
    const expectedTransform = depth === 3
      ? {transX: '-13921', transY: '3367'}
      : {transX: '-13921', transY: '3961'};
    const text = textById.get(expectedObjectId);
    const definition = sourceDefinition(xml, expectedObjectId);
    invariant(placement?.objectId === expectedObjectId &&
      exact(placement.transform, expectedTransform) && text &&
      definition.type === 'DefineText',
    `p011 Need More Help text ${expectedObjectId} placement drifted`);
    const records = visibleTextRecords(text.buffer);
    const visibleText = records.join(' ').replace(/\s+([.])/gu, '$1');
    invariant((expectedObjectId === 10 &&
      exact(records, ['Use the rules of inequalities to find the solution set.']) &&
      visibleText ===
        'Use the rules of inequalities to find the solution set.') ||
      (expectedObjectId === 11 && exact(records, [
        'Inequality Rule 3: You can multiply or divide both sides of an',
        'inequality', 'by any negative number but you must', 'reverse', 'the',
        'direction', 'of the', 'inequality', 'symbol', '.',
      ]) && visibleText === 'Inequality Rule 3: You can multiply or divide ' +
        'both sides of an inequality by any negative number but you must ' +
        'reverse the direction of the inequality symbol.'),
    `p011 Need More Help text ${expectedObjectId} value drifted`);
    return Object.freeze({depth, objectId: expectedObjectId,
      transform: placement.transform,
      placementFragmentSha256: placement.placementFragmentSha256,
      definitionSha256: definition.sha256,
      text: Object.freeze({path: text.path, bytes: text.bytes,
        sha256: text.sha256, records, visibleText})});
  });
  invariant(xml.includes('<DefineSprite objectID="17" frames="1">') &&
    xml.includes('<Symbol objectID="17" name="show mc1_new_001"/>'),
  'p011 Need More Help popup sprite/export drifted');
  const projectPlacement = (placement) => Object.freeze({
    depth: placement.depth, objectId: placement.objectId,
    name: placement.name, transform: placement.transform,
    placementFragmentSha256: placement.placementFragmentSha256,
  });
  return Object.freeze({popupSprite: Object.freeze({objectId: 17,
    frameCount: 1, exportName: 'show mc1_new_001'}),
  mainTimelineFrame: 87,
  mainPlacements: Object.freeze({popup: projectPlacement(popup),
    closeButton: projectPlacement(closeButton),
    openButton: projectPlacement(openButton)}),
  textPlacements: Object.freeze(textPlacements),
  visibilityLifecycle: Object.freeze({openScript: binding(needMoreHelp[0]),
    closeScript: binding(needMoreHelp[1]), openDisablesQuiz: true,
    openShowsPopupAndCloseButton: true, closeEnablesQuiz: true,
    closeHidesPopupAndCloseButton: true})});
}

function randomLabelFrames(xml) {
  const sprite = extractSprite(xml, 30, 55);
  let frame = 1;
  let blocks = 0;
  const labels = [];
  for (const match of sprite.matchAll(
    /<ShowFrame\/>|<FrameLabel label="([^"]+)"|<SoundStreamBlock>|<SoundStreamHead\b/gu)) {
    if (match[0] === '<ShowFrame/>') frame += 1;
    else if (match[1]) labels.push(Object.freeze({label: match[1], frame,
      soundStreamBlocksBefore: blocks}));
    else if (match[0] === '<SoundStreamBlock>') blocks += 1;
  }
  invariant(frame === 56 && blocks === 53 && exact(labels, [
    {label: 'S1', frame: 3, soundStreamBlocksBefore: 0},
    {label: 'S2', frame: 18, soundStreamBlocksBefore: 15},
    {label: 'S3', frame: 31, soundStreamBlocksBefore: 28},
    {label: 'S4', frame: 40, soundStreamBlocksBefore: 37},
  ]), 'p006 random label/audio frame map drifted');
  return Object.freeze([
    {label: 'S1', startFrame: 3, returnFrame: 16,
      soundStreamBlockCount: 15},
    {label: 'S2', startFrame: 18, returnFrame: 27,
      soundStreamBlockCount: 13},
    {label: 'S3', startFrame: 31, returnFrame: 36,
      soundStreamBlockCount: 9},
    {label: 'S4', startFrame: 40, returnFrame: 54,
      soundStreamBlockCount: 16},
  ].map(Object.freeze));
}

export function deriveSourceWrongAttemptSequence({tryMutationModel,
  baseWrongText, retryWrongText}) {
  invariant(['feedback-endpoint', 'selection', 'p021-split']
    .includes(tryMutationModel), 'unknown source try mutation model');
  let count = 0;
  const attempts = [];
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    let text;
    if (tryMutationModel === 'selection') {
      count += 1;
      text = count === 1 ? retryWrongText : baseWrongText;
    } else if (tryMutationModel === 'p021-split') {
      if (count === 1) {
        count += 1;
        text = baseWrongText;
      } else text = retryWrongText;
    } else text = count === 1 ? baseWrongText : retryWrongText;
    const afterSelection = count;
    if (tryMutationModel !== 'selection') count += 1;
    const resumesParent = count >= 2;
    if (resumesParent) count = 0;
    attempts.push(Object.freeze({attempt, text, afterSelection,
      afterFeedbackEndpoint: count, resumesParent}));
  }
  return Object.freeze(attempts);
}

function ordered(source, tokens, message) {
  let cursor = -1;
  for (const token of tokens) {
    const index = source.indexOf(token, cursor + 1);
    invariant(index > cursor, `${message}: ${token} ordering drifted`);
    cursor = index;
  }
}

export function assertSourceTryMutationOrdering({tryMutationModel,
  baseWrongText, retryWrongText}, wrongSources, endpointSources) {
  invariant(Array.isArray(wrongSources) && wrongSources.length >= 1 &&
    Array.isArray(endpointSources) && endpointSources.length === 3,
  'source try ordering inputs drifted');
  for (const source of wrongSources) {
    invariant(typeof source === 'string', 'wrong script text is required');
    const commonTail = ['_root.disableQuizButton();',
      '_root.showWrongFeed();'];
    if (tryMutationModel === 'feedback-endpoint') {
      invariant(!source.includes('_global.quizTryCount++;'),
        'feedback-endpoint selection increment drifted');
      ordered(source, ['if(_global.quizTryCount == 1)',
        `_global.WrongFeed = ${JSON.stringify(baseWrongText)};`,
        `_global.WrongFeed = ${JSON.stringify(retryWrongText)};`,
        ...commonTail], 'feedback-endpoint wrong script');
    } else if (tryMutationModel === 'selection') {
      ordered(source, ['_global.quizTryCount++;',
        'if(_global.quizTryCount == 1)',
        `_global.WrongFeed = ${JSON.stringify(retryWrongText)};`,
        `_global.WrongFeed = ${JSON.stringify(baseWrongText)};`,
        ...commonTail], 'selection wrong script');
    } else if (tryMutationModel === 'p021-split') {
      ordered(source, ['if(_global.quizTryCount == 1)',
        '_global.quizTryCount++;',
        `_global.WrongFeed = ${JSON.stringify(baseWrongText)};`,
        `_global.WrongFeed = ${JSON.stringify(retryWrongText)};`,
        ...commonTail], 'p021 split wrong script');
    } else invariant(false, 'unknown source try mutation model');
  }
  for (const source of endpointSources) {
    invariant(typeof source === 'string', 'endpoint script text is required');
    if (tryMutationModel === 'selection') {
      invariant(!source.includes('_global.quizTryCount++;'),
        'selection endpoint increment drifted');
      ordered(source, ['_root.enableQuizButton();',
        'if(_global.quizTryCount >= 2)',
        '_global.quizTryCount = 0;', '_global.quizSection = false;',
        '_parent.play();'], 'selection feedback endpoint');
    } else {
      ordered(source, ['_root.enableQuizButton();',
        '_global.quizTryCount++;', 'if(_global.quizTryCount >= 2)',
        '_global.quizTryCount = 0;', '_global.quizSection = false;',
        '_parent.play();'], `${tryMutationModel} feedback endpoint`);
    }
  }
  return true;
}

function verifyChoiceSource(expected, residual, scripts, texts, xml) {
  const config = CHOICE_CONFIG[expected.animationId];
  invariant(config && residual.sourceSemantics.mainDomainStopFrames
    .includes(config.quizFrame), `${expected.animationId} quiz frame drifted`);
  const geometry = choiceGeometryProjection(xml, texts, expected, config);

  const correct = scriptByPath(scripts, config.correctScript);
  invariant(normalizeScript(correct.buffer) === COMMON_CORRECT_SCRIPT,
    `${expected.animationId} correct script drifted`);
  const wrong = config.wrongScripts.map((scriptPath) =>
    scriptByPath(scripts, scriptPath));
  for (const row of wrong) {
    const source = normalizeScript(row.buffer);
    invariant(source.includes(JSON.stringify(config.baseWrongText)) &&
      source.includes(JSON.stringify(config.retryWrongText)) &&
      source.includes('_root.disableQuizButton();') &&
      source.includes('_root.showWrongFeed();'),
    `${expected.animationId} wrong script drifted`);
  }
  const wrongEndpoints = scripts.filter((row) => {
    const source = normalizeScript(row.buffer);
    return source.includes('_root.enableQuizButton();') &&
      source.includes('_global.quizTryCount') &&
      source.includes('_parent.play();');
  });
  invariant(wrongEndpoints.length === 3,
    `${expected.animationId} wrong feedback endpoint count drifted`);
  const wrongSources = wrong.map((row) => normalizeScript(row.buffer));
  const endpointSources = wrongEndpoints.map((row) =>
    normalizeScript(row.buffer));
  assertSourceTryMutationOrdering(config, wrongSources, endpointSources);
  const dismiss = scripts.filter((row) =>
    normalizeScript(row.buffer).includes('eval("AnsBtn" + i).gotoAndStop(1)'));
  invariant(dismiss.length === config.dismissCount,
    `${expected.animationId} feedback dismiss count drifted`);
  const needMoreHelp = (config.needMoreHelpScripts ?? []).map((scriptPath) =>
    scriptByPath(scripts, scriptPath));
  if (expected.animationId === 'shared-alg001-l11-p011') {
    invariant(normalizeScript(needMoreHelp[0].buffer)
      .includes('Mc_Popup._visible = true;') &&
      normalizeScript(needMoreHelp[1].buffer)
        .includes('Mc_Popup._visible = false;'),
    'p011 Need More Help open/close drifted');
  }
  const needMoreHelpProjection = expected.animationId ===
      'shared-alg001-l11-p011'
    ? p011NeedMoreHelpProjection(xml, texts, needMoreHelp)
    : null;
  return Object.freeze({kind: 'choice-feedback-practice',
    quizFrame: config.quizFrame, geometry,
    correctScript: binding(correct), wrongScripts: wrong.map(binding),
    tryMutationModel: config.tryMutationModel,
    literalTwoAttemptSequence: deriveSourceWrongAttemptSequence(config),
    tryMutationOrdering: Object.freeze({exactOrderingPassed: true,
      wrongScriptSequenceSha256: sha256(stableBytes(wrongSources)),
      endpointScriptSequenceSha256: sha256(stableBytes(endpointSources))}),
    wrongFeedbackEndpointScripts: wrongEndpoints.map(binding),
    feedbackDismissScripts: dismiss.map(binding),
    needMoreHelpScripts: needMoreHelp.map(binding),
    needMoreHelp: needMoreHelpProjection,
    sourceCorrectnessBoundary:
      'all four logical option slots bind source placement and recursively reachable text/shape definitions; graph/vector visual fidelity remains a later browser and human gate',
  });
}

function verifyRandomSource(expected, residual, scripts, xml, swfFacts) {
  invariant(exact(residual.sourceSemantics.randomAudioLabels,
    ['S1', 'S2', 'S3', 'S4']), 'p006 random label list drifted');
  const random = scriptByPath(scripts,
    'DefineSprite_30/frame_2/DoAction.as');
  const source = normalizeScript(random.buffer);
  invariant(source === 'stop();\n_global.rndAudio = new Array();\n' +
    '_global.rndAudio[0] = "S1";\n_global.rndAudio[1] = "S2";\n' +
    '_global.rndAudio[2] = "S3";\n_global.rndAudio[3] = "S4";\n' +
    'tempInt = random(_global.rndAudio.length);\n' +
    'tempLabel = _global.rndAudio[tempInt];\n' +
    'gotoAndPlay(tempLabel);\n', 'p006 random selection script drifted');
  const labelWindows = randomLabelFrames(xml);
  const randomDomain = swfFacts.frameDomains.domains.find((domain) =>
    domain.domainId === 'sprite-30');
  invariant(randomDomain?.declaredFrameCount === 55 &&
    randomDomain.audioTagCount === 54 &&
    swfFacts.audio.tagCounts.SoundStreamHead === 4 &&
    swfFacts.audio.tagCounts.SoundStreamBlock === 143,
  'p006 embedded audio structure drifted');
  const active = activeTimelineAtFrame(xml, 50, 53, 24);
  const correct = active.get(6);
  const wrongLeft = active.get(24);
  const wrongRight = active.get(26);
  invariant(correct?.objectId === 22 && correct.name === 'Opt_1' &&
    wrongLeft?.objectId === 26 && wrongLeft.name === 'Opt_2' &&
    wrongRight?.objectId === 26 && wrongRight.name === 'Opt_2',
  'p006 answer hit regions drifted');
  const correctScript = scriptByPath(scripts,
    'DefineSprite_50/frame_24/PlaceObject2_22_6/' +
      'CLIPACTIONRECORD on(release).as');
  const wrongScripts = [24, 26].map((depth) => scriptByPath(scripts,
    `DefineSprite_50/frame_24/PlaceObject2_26_${depth}/` +
      'CLIPACTIONRECORD on(release).as'));
  invariant(normalizeScript(correctScript.buffer)
    .includes('_parent.RightFeed_mc.gotoAndPlay(2);') &&
    wrongScripts.every((row) => normalizeScript(row.buffer)
      .includes('_parent.Mc_Feed_Popup1.gotoAndPlay(2);')),
  'p006 answer feedback scripts drifted');
  const returnScripts = [16, 27, 36, 54].map((frame) => scriptByPath(scripts,
    `DefineSprite_30/frame_${frame}/DoAction.as`));
  invariant(returnScripts.every((row) => normalizeScript(row.buffer)
    .includes('gotoAndStop(1);') && normalizeScript(row.buffer)
    .includes('_parent.enableButton();')),
  'p006 random branch return scripts drifted');
  return Object.freeze({kind: 'random-audio-label-timeline',
    choiceStopFrame: 24, terminalStopFrame: 53,
    selectionScript: binding(random), labelWindows,
    answerBindings: Object.freeze([
      {instanceName: 'Opt_1', objectId: 22, depths: [6], correct: true,
        sourceTextProjection: ['x', '>', '5'],
        semanticProjection: 'x > 5'},
      {instanceName: 'Opt_2', objectId: 26, depths: [24, 26], correct: false,
        sourceVisualProjection: 'DefineShape3_25'},
    ].map(Object.freeze)),
    correctScript: binding(correctScript),
    wrongScripts: wrongScripts.map(binding),
    returnScripts: returnScripts.map(binding),
    embeddedAudioStructure: Object.freeze({randomSpriteObjectId: 30,
      randomSpriteFrameCount: 55, randomSpriteAudioTagCount: 54,
      swfSoundStreamHeadCount: 4, swfSoundStreamBlockCount: 143,
      structuralMapPassed: true, listeningAcceptancePassed: false}),
    deterministicImplementationBoundary:
      'candidate adapter must inject and receipt a deterministic S1-S4 choice; Replay seed policy is not authorized by this source audit',
  });
}

function verifyTwoTrySource(expected, scripts, swfFacts, xml) {
  const config = expected.animationId.endsWith('p009')
    ? {nestedObjectId: 43, nestedDepth: 36, popupObjectId: 19,
        closeButtonObjectId: 15}
    : {nestedObjectId: 58, nestedDepth: 51, popupObjectId: 34,
        closeButtonObjectId: 31};
  const stop1 = scriptByPath(scripts,
    `DefineSprite_${config.nestedObjectId}/frame_1/DoAction.as`);
  const stop64 = scriptByPath(scripts,
    `DefineSprite_${config.nestedObjectId}/frame_64/DoAction.as`);
  const complete = scriptByPath(scripts,
    `DefineSprite_${config.nestedObjectId}/frame_70/DoAction.as`);
  const close = scriptByPath(scripts,
    `DefineButton2_${config.closeButtonObjectId}/` +
      'BUTTONCONDACTION on(release).as');
  invariant(normalizeScript(stop1.buffer) === 'stop();\n' &&
    normalizeScript(stop64.buffer) === 'stop();\n' &&
    normalizeScript(close.buffer) ===
      'on(release){\n   _parent.gotoAndPlay(65);\n}\n',
  `${expected.animationId} two-try entry scripts drifted`);
  const completion = normalizeScript(complete.buffer);
  invariant(completion.includes('_global.quizTryCount++;') &&
    completion.includes('_parent.NMHBtn.enabled = true;') &&
    completion.includes('if(_global.quizTryCount >= 2)') &&
    completion.includes('_global.quizSection = false;') &&
    completion.includes('_parent.play();'),
  `${expected.animationId} two-try completion drifted`);
  const nestedDomain = swfFacts.frameDomains.domains.find((domain) =>
    domain.domainId === `sprite-${config.nestedObjectId}`);
  invariant(nestedDomain?.declaredFrameCount === 70 &&
    nestedDomain.parentDomainIds.includes(`sprite-${expected.mainObjectId}`) &&
    nestedDomain.placedSpriteIds.includes(config.popupObjectId),
  `${expected.animationId} two-try nested domain drifted`);
  extractSprite(xml, config.popupObjectId, 1);
  const mainPlacement = timelinePlacements(xml, expected.mainObjectId,
    expected.mainFrameCount).filter((placement) =>
    placement.objectId === config.nestedObjectId);
  const popupPlacement = timelinePlacements(xml, config.nestedObjectId, 70)
    .filter((placement) => placement.objectId === config.popupObjectId);
  const buttonPlacement = timelinePlacements(xml, config.popupObjectId, 1)
    .filter((placement) => placement.objectId === config.closeButtonObjectId);
  invariant(mainPlacement.length === 1 && mainPlacement[0].frame === 1 &&
    mainPlacement[0].depth === config.nestedDepth &&
    mainPlacement[0].name === 'Mc_Wrong_Feed3' &&
    popupPlacement.length === 1 && popupPlacement[0].frame === 38 &&
    popupPlacement[0].depth === 1 &&
    popupPlacement[0].name === 'Mc_Feed_Popup' &&
    buttonPlacement.length === 1 && buttonPlacement[0].frame === 1 &&
    buttonPlacement[0].depth === 1 &&
    buttonPlacement[0].name === 'BtnClose' &&
    sourceDefinition(xml, config.closeButtonObjectId).type === 'DefineButton2',
  `${expected.animationId} main/nested/popup/BtnClose parent chain drifted`);
  return Object.freeze({kind: 'two-try-need-more-help',
    mainTimeline: Object.freeze({objectId: expected.mainObjectId,
      frameCount: expected.mainFrameCount}),
    nestedTimeline: Object.freeze({objectId: config.nestedObjectId,
      frameCount: 70, stopFrames: [1, 64], closeTargetFrame: 65,
      completionFrame: 70, popupObjectId: config.popupObjectId}),
    closeButton: Object.freeze({objectId: config.closeButtonObjectId,
      instanceName: 'BtnClose', script: binding(close)}),
    sourceParentChain: Object.freeze({
      mainToNested: mainPlacement[0], nestedToPopup: popupPlacement[0],
      popupFrameCount: 1, popupToCloseButton: buttonPlacement[0],
      closeButtonDefinitionType: 'DefineButton2',
    }),
    stopScripts: Object.freeze([binding(stop1), binding(stop64)]),
    completionScript: binding(complete),
    exactStaticSequence: Object.freeze([
      'nested frame 64 stops with feedback popup present',
      'BtnClose source action requests _parent.gotoAndPlay(65)',
      'nested frame 70 returns itself to frame 1 and increments quizTryCount',
      'at quizTryCount >= 2 it resets count, clears quizSection, and plays parent',
    ]),
    runtimeParentBindingEstablished: false,
    runtimeParentBindingBlocker:
      'BtnClose is physically nested in the one-frame popup sprite; authoritative runtime must establish which timeline _parent resolves before product calibration',
  });
}

async function buildRecord(expected, residual, sourceRootPath) {
  invariant(residual.animationId === expected.animationId &&
    residual.source.path === expected.sourcePath &&
    residual.source.bytes === expected.sourceBytes &&
    residual.source.sha256 === expected.sourceSha256 &&
    residual.sectionCode === expected.sectionCode &&
    residual.sectionPageOrdinal === expected.sectionPageOrdinal &&
    residual.runtime.namedAnimationPlacements.length === 1 &&
    residual.runtime.namedAnimationPlacements[0].objectId ===
      expected.mainObjectId &&
    residual.runtime.namedAnimationPlacements[0].frameCount ===
      expected.mainFrameCount &&
    residual.routing.familyId === expected.familyId &&
    residual.routing.complexity === 'interactive-understood' &&
    residual.routing.implementationLane === expected.implementationLane &&
    residual.routing.reuseAuthorized === false,
  `${expected.animationId} residual source route drifted`);
  const audio = residual.audioLane.candidates;
  invariant(residual.audioLane.status === 'candidate-index-only' &&
    residual.audioLane.accepted === false && audio.length === 1 &&
    audio[0].path === expected.audioPath &&
    audio[0].bytes === expected.audioBytes &&
    audio[0].sha256 === expected.audioSha256 &&
    audio[0].physicalReadOnlyIdentityVerified === true,
  `${expected.animationId} residual audio route drifted`);

  const memberRoot = projectPath(`${DIAGNOSTIC_ROOT}/${expected.animationId}`);
  const diagnosticRows = await walkFrozen(memberRoot);
  const scripts = diagnosticRows.filter((row) =>
    row.path.startsWith('ffdec-export/scripts/') && row.path.endsWith('.as'))
    .map((row) => Object.freeze({...row,
      path: row.path.slice('ffdec-export/scripts/'.length)}));
  const texts = diagnosticRows.filter((row) =>
    row.path.startsWith('ffdec-export/texts/') && row.path.endsWith('.txt'))
    .map((row) => Object.freeze({...row,
      path: row.path.slice('ffdec-export/texts/'.length)}));
  const sourceXml = diagnosticRows.find((row) => row.path === 'source.xml');
  invariant(sourceXml && sourceXml.bytes ===
    residual.diagnosticEvidence.sourceXml.bytes &&
    sourceXml.sha256 === residual.diagnosticEvidence.sourceXml.sha256 &&
    exact(inventory(scripts), residual.diagnosticEvidence.scripts) &&
    exact(inventory(texts), residual.diagnosticEvidence.texts) &&
    exact(inventory(diagnosticRows), residual.diagnosticEvidence.frozenTree),
  `${expected.animationId} frozen diagnostic inventory drifted`);

  const [source, physicalAudio] = await Promise.all([
    externalFile(sourceRootPath, expected.sourcePath,
      expected.sourceBytes, expected.sourceSha256),
    externalFile(sourceRootPath, expected.audioPath,
      expected.audioBytes, expected.audioSha256),
  ]);
  const swfFacts = parseSwfSourceFacts((await stableFile(
    path.join(sourceRootPath, ...expected.sourcePath.split('/')),
    {absolute: true, readOnly: true})).buffer);
  invariant(swfFacts.header.stage.width === 800 &&
    swfFacts.header.stage.height === 600 && swfFacts.header.fps === 12 &&
    swfFacts.header.rootFrameCount === 10 &&
    swfFacts.actionScript.version === 'AS1/2',
  `${expected.animationId} physical SWF header drifted`);
  const mainDomain = swfFacts.frameDomains.domains.find((domain) =>
    domain.domainId === `sprite-${expected.mainObjectId}`);
  invariant(mainDomain?.staticallyRootReachable === true &&
    mainDomain.declaredFrameCount === expected.mainFrameCount,
  `${expected.animationId} main timeline drifted`);

  const scriptText = scripts.map((row) => normalizeScript(row.buffer))
    .join('\n');
  const hostCalls = [...new Set([...scriptText.matchAll(
    /\b(?:_root|_parent|_level0)\.([A-Za-z_$][\w$]*)\s*\(/gu)]
    .map((match) => match[1]))].sort();
  invariant(exact(hostCalls, residual.structuralSignals.hostCalls),
    `${expected.animationId} host call set drifted`);
  const xml = sourceXml.buffer.toString('utf8');
  const sourceContract = expected.animationId.endsWith('p006')
    ? verifyRandomSource(expected, residual, scripts, xml, swfFacts)
    : CHOICE_CONFIG[expected.animationId]
      ? verifyChoiceSource(expected, residual, scripts, texts, xml)
      : verifyTwoTrySource(expected, scripts, swfFacts, xml);
  return Object.freeze({animationId: expected.animationId,
    sectionCode: expected.sectionCode,
    sectionPageOrdinal: expected.sectionPageOrdinal,
    source, familyId: expected.familyId, complexity: 'interactive-understood',
    implementationLane: expected.implementationLane,
    exactMainTimeline: Object.freeze({objectId: expected.mainObjectId,
      frameCount: expected.mainFrameCount,
      rootFrameCount: swfFacts.header.rootFrameCount,
      fps: swfFacts.header.fps}),
    exactScriptInventory: residual.diagnosticEvidence.scripts,
    exactTextInventory: residual.diagnosticEvidence.texts,
    hostCalls: Object.freeze(hostCalls), sourceContract,
    physicalAudioCandidate: Object.freeze({...physicalAudio,
      required: null, trigger: 'pending-authorized-original-runtime',
      replayBehavior: 'pending-authorized-original-runtime',
      acceptance: 'candidate-index-only', accepted: false}),
    diagnosticEvidence: Object.freeze({root:
      `${DIAGNOSTIC_ROOT}/${expected.animationId}`,
    sourceXml: Object.freeze({path:
      `${DIAGNOSTIC_ROOT}/${expected.animationId}/source.xml`,
    bytes: sourceXml.bytes, sha256: sourceXml.sha256}),
    frozenTree: residual.diagnosticEvidence.frozenTree,
    ffdecScriptInventoryVerified: true,
    ffdecTextInventoryVerified: true}),
    semanticReuseBoundary: Object.freeze({candidate:
      residual.routing.reusableCandidate,
    reuseAuthorized: false,
    exactSemanticDiffRequired: residual.routing.reuseStatus ===
      'candidate-only-exact-semantic-diff-required',
    differences: Object.freeze(expected.familyId ===
      'l11-choice-feedback-practice' ? [
        'three or four visible answer hit targets are source-specific',
        'quiz stop/resume/terminal frames are source-specific',
        'wrong-attempt mutation occurs at selection, feedback endpoint, or the p021 split path',
        'Need More Help is live only on p011 while p008 retains endpoint-only NMH references',
        'graph/vector answer geometry and exact feedback strings are source-specific',
        'p025 Flash scroll infrastructure is not a reusable product requirement',
      ] : [
        'no ALG L9 reuse is authorized by the residual authority',
        'timeline, random/help state, host calls, and Replay require an exact family adapter',
      ])}),
    sourceAuditP0Count: 0, sourceAuditP1Count: 0,
    registrationCandidate: false, productCalibrationPassed: false,
    browserCalibrationPassed: false, acceptanceEffects: FALSE_EFFECTS,
    productBlockers: residual.routing.p1Blockers});
}

function exactKeys(value, expected, message) {
  invariant(value && typeof value === 'object' && !Array.isArray(value) &&
    exact(Object.keys(value).sort(), [...expected].sort()), message);
}

function memberSourceEvidenceProjection(member) {
  return Object.freeze({source: member.source,
    exactMainTimeline: member.exactMainTimeline,
    exactScriptInventory: member.exactScriptInventory,
    exactTextInventory: member.exactTextInventory,
    hostCalls: member.hostCalls,
    sourceContract: member.sourceContract,
    physicalAudioCandidate: member.physicalAudioCandidate,
    diagnosticEvidence: member.diagnosticEvidence,
    semanticReuseBoundary: member.semanticReuseBoundary,
    productBlockers: member.productBlockers});
}

function validateInteractive10AuditAgainstCurrentGenerator(value,
  expectedGenerator,
) {
  exactKeys(value, [
    'schemaVersion', 'artifactType', 'auditId', 'status', 'stableLessonKey',
    'moduleCode', 'lessonNumber', 'lessonActivePageCount', 'inputs',
    'exactPlacementIds', 'auditedPlacementCount', 'familyCounts',
    'complexityCounts', 'physicalAudioCandidateCount',
    'physicalAudioIdentityVerifiedCount', 'audioAcceptedCount',
    'ffdecFrozenDiagnosticMemberCount', 'choiceLogicalOptionSlotCount',
    'choicePresentOptionCount', 'choiceAbsentOptionCount',
    'choiceGeometrySetSha256', 'choiceNeedMoreHelpControlPlacementCount',
    'choiceNeedMoreHelpTextPlacementCount', 'twoTryParentChainVerifiedCount',
    'tryMutationOrderingVerifiedCount', 'sourceAuditP0Count',
    'sourceAuditP1Count', 'sourceContractAuditPassed',
    'independentReviewPassed', 'candidateImplementationAuthorized',
    'registrationCandidatePlacementCount',
    'currentJavaScriptRegisteredPlacementCount', 'productCalibrationPassed',
    'browserCalibrationPassed', 'wholeLessonEngineeringPreviewReady',
    'semanticReuse', 'members', 'limitations', 'acceptanceEffects',
  ], 'interactive10 audit top-level schema drifted');
  invariant(value?.artifactType ===
    'g678-alg-l11-interactive10-tranche-c-source-audit-v1' &&
    value.schemaVersion === 1 &&
    value.auditId === 'g678-alg-l11-interactive10-tranche-c-audit-v1' &&
    value.status ===
      'exact-10-source-script-frame-answer-try-random-audio-host-audited-no-registration' &&
    value.stableLessonKey === 'shared-alg001-l11' &&
    value.moduleCode === 'ALG001' && value.lessonNumber === 11 &&
    value.lessonActivePageCount === 44 &&
    value.auditedPlacementCount === 10 &&
    exact(value.familyCounts, {
      'l11-random-audio-label-timeline': 1,
      'l11-choice-feedback-practice': 7,
      'l11-two-try-need-more-help': 2,
    }) && exact(value.complexityCounts, {'interactive-understood': 10}) &&
    value.physicalAudioCandidateCount === 10 &&
    value.physicalAudioIdentityVerifiedCount === 10 &&
    value.audioAcceptedCount === 0 &&
    value.ffdecFrozenDiagnosticMemberCount === 10 &&
    value.choiceLogicalOptionSlotCount === 28 &&
    value.choicePresentOptionCount === 23 &&
    value.choiceAbsentOptionCount === 5 &&
    value.choiceNeedMoreHelpControlPlacementCount === 1 &&
    value.choiceNeedMoreHelpTextPlacementCount === 2 &&
    value.twoTryParentChainVerifiedCount === 2 &&
    value.tryMutationOrderingVerifiedCount === 7 &&
    value.sourceAuditP0Count === 0 && value.sourceAuditP1Count === 0 &&
    value.sourceContractAuditPassed === true &&
    value.independentReviewPassed === false &&
    value.candidateImplementationAuthorized === false &&
    value.registrationCandidatePlacementCount === 0 &&
    value.currentJavaScriptRegisteredPlacementCount === 0 &&
    value.productCalibrationPassed === false &&
    value.browserCalibrationPassed === false &&
    value.wholeLessonEngineeringPreviewReady === false &&
    exact(value.semanticReuse, {algL09AssumedEquivalent: false,
      reuseAuthorized: false, exactSemanticDiffRequired: true}) &&
    exact(value.limitations, EXPECTED_LIMITATIONS) &&
    exact(value.acceptanceEffects, FALSE_EFFECTS),
  'interactive10 audit top-level boundary drifted');
  exactKeys(value.inputs, ['residualAuthority', 'residualBuilder', 'generator',
    'sourceRoot', 'frozenDiagnosticRoot'],
  'interactive10 input schema drifted');
  exactKeys(value.inputs.residualAuthority, ['path', 'bytes', 'sha256'],
    'interactive10 residual authority schema drifted');
  exactKeys(value.inputs.residualBuilder, ['path', 'bytes', 'sha256'],
    'interactive10 residual builder schema drifted');
  exactKeys(value.inputs.generator, ['path', 'bytes', 'sha256'],
    'interactive10 generator schema drifted');
  exactKeys(value.inputs.sourceRoot, ['environmentVariable', 'relativeRoot',
    'canonicalReadOnlyVerified'], 'interactive10 source root schema drifted');
  exactKeys(expectedGenerator, ['path', 'bytes', 'sha256'],
    'interactive10 expected generator schema drifted');
  invariant(exact(value.inputs.residualAuthority, {path: RESIDUAL,
    bytes: RESIDUAL_BYTES, sha256: RESIDUAL_SHA256}) &&
    exact(value.inputs.residualBuilder, {path: RESIDUAL_BUILDER,
      bytes: RESIDUAL_BUILDER_BYTES, sha256: RESIDUAL_BUILDER_SHA256}) &&
    exact(value.inputs.generator, expectedGenerator) &&
    expectedGenerator.path === path.relative(ROOT, SCRIPT_PATH) &&
    exact(value.inputs.sourceRoot, {environmentVariable: SOURCE_ENV,
      relativeRoot: 'G6-G8-shared', canonicalReadOnlyVerified: true}) &&
    value.inputs.frozenDiagnosticRoot === DIAGNOSTIC_ROOT,
  'interactive10 input binding drifted');
  invariant(exact(value.exactPlacementIds, EXPECTED_IDS),
    'interactive10 exact placement IDs drifted');
  invariant(exact(value.members.map((member) => member.animationId),
    EXPECTED_IDS), 'interactive10 exact member set drifted');
  const geometryRows = [];
  for (const expected of EXPECTED) {
    const member = value.members.find((row) =>
      row.animationId === expected.animationId);
    exactKeys(member, ['animationId', 'sectionCode', 'sectionPageOrdinal',
      'source', 'familyId', 'complexity', 'implementationLane',
      'exactMainTimeline', 'exactScriptInventory', 'exactTextInventory',
      'hostCalls', 'sourceContract', 'physicalAudioCandidate',
      'diagnosticEvidence', 'semanticReuseBoundary', 'sourceAuditP0Count',
      'sourceAuditP1Count', 'registrationCandidate',
      'productCalibrationPassed', 'browserCalibrationPassed',
      'acceptanceEffects', 'productBlockers'],
    `${expected.animationId} member schema drifted`);
    exactKeys(member.source, ['path', 'bytes', 'sha256'],
      `${expected.animationId} source identity schema drifted`);
    exactKeys(member.exactMainTimeline,
      ['objectId', 'frameCount', 'rootFrameCount', 'fps'],
      `${expected.animationId} main timeline schema drifted`);
    exactKeys(member.exactScriptInventory,
      ['fileCount', 'totalBytes', 'checksumSetSha256'],
      `${expected.animationId} script inventory schema drifted`);
    exactKeys(member.exactTextInventory,
      ['fileCount', 'totalBytes', 'checksumSetSha256'],
      `${expected.animationId} text inventory schema drifted`);
    exactKeys(member.physicalAudioCandidate, ['path', 'bytes', 'sha256',
      'required', 'trigger', 'replayBehavior', 'acceptance', 'accepted'],
    `${expected.animationId} physical audio schema drifted`);
    exactKeys(member.diagnosticEvidence, ['root', 'sourceXml', 'frozenTree',
      'ffdecScriptInventoryVerified', 'ffdecTextInventoryVerified'],
    `${expected.animationId} diagnostic evidence schema drifted`);
    exactKeys(member.diagnosticEvidence.sourceXml, ['path', 'bytes', 'sha256'],
      `${expected.animationId} diagnostic source XML schema drifted`);
    exactKeys(member.diagnosticEvidence.frozenTree,
      ['fileCount', 'totalBytes', 'checksumSetSha256'],
      `${expected.animationId} frozen tree schema drifted`);
    exactKeys(member.semanticReuseBoundary, ['candidate', 'reuseAuthorized',
      'exactSemanticDiffRequired', 'differences'],
    `${expected.animationId} semantic reuse schema drifted`);
    const sourceEvidenceSha256 = sha256(stableBytes(
      memberSourceEvidenceProjection(member)));
    invariant(sourceEvidenceSha256 ===
      EXPECTED_MEMBER_SOURCE_EVIDENCE_SHA256[expected.animationId],
    `${expected.animationId} exact source evidence projection drifted: ${
      sourceEvidenceSha256}`);
    invariant(member && member.source.path === expected.sourcePath &&
      member.source.bytes === expected.sourceBytes &&
      member.source.sha256 === expected.sourceSha256 &&
      member.sectionCode === expected.sectionCode &&
      member.sectionPageOrdinal === expected.sectionPageOrdinal &&
      member.familyId === expected.familyId &&
      member.complexity === 'interactive-understood' &&
      member.implementationLane === expected.implementationLane &&
      member.exactMainTimeline.objectId === expected.mainObjectId &&
      member.exactMainTimeline.frameCount === expected.mainFrameCount &&
      member.exactMainTimeline.rootFrameCount === 10 &&
      member.exactMainTimeline.fps === 12 &&
      exact(member.hostCalls, EXPECTED_HOST_CALLS[expected.animationId]) &&
      member.physicalAudioCandidate.path === expected.audioPath &&
      member.physicalAudioCandidate.bytes === expected.audioBytes &&
      member.physicalAudioCandidate.sha256 === expected.audioSha256 &&
      member.physicalAudioCandidate.required === null &&
      member.physicalAudioCandidate.trigger ===
        'pending-authorized-original-runtime' &&
      member.physicalAudioCandidate.replayBehavior ===
        'pending-authorized-original-runtime' &&
      member.physicalAudioCandidate.acceptance === 'candidate-index-only' &&
      member.physicalAudioCandidate.accepted === false &&
      exact(member.productBlockers, FAMILY_BLOCKERS[expected.familyId]) &&
      member.semanticReuseBoundary.reuseAuthorized === false &&
      member.diagnosticEvidence.ffdecScriptInventoryVerified === true &&
      member.diagnosticEvidence.ffdecTextInventoryVerified === true &&
      member.sourceAuditP0Count === 0 && member.sourceAuditP1Count === 0 &&
      member.registrationCandidate === false &&
      member.productCalibrationPassed === false &&
      member.browserCalibrationPassed === false &&
      exact(member.acceptanceEffects, FALSE_EFFECTS),
    `${expected.animationId} audit boundary drifted`);
    const choice = CHOICE_CONFIG[expected.animationId];
    if (choice) {
      invariant(member.sourceContract.kind === 'choice-feedback-practice' &&
        member.sourceContract.quizFrame === choice.quizFrame &&
        member.sourceContract.tryMutationModel === choice.tryMutationModel &&
        member.sourceContract.geometry.geometryMode === choice.geometryMode &&
        member.sourceContract.geometry.optionSlots.length === 4 &&
        exact(member.sourceContract.geometry.optionSlots.map((slot) =>
          slot.slot), ['A', 'B', 'C', 'D']) &&
        member.sourceContract.geometry.presentOptionCount ===
          (['shared-alg001-l11-p011', 'shared-alg001-l11-p014']
            .includes(expected.animationId) ? 4 : 3) &&
        (EXPECTED_CHOICE_GEOMETRY_SHA256[expected.animationId] === undefined ||
          member.sourceContract.geometry.geometrySetSha256 ===
            EXPECTED_CHOICE_GEOMETRY_SHA256[expected.animationId]) &&
        member.sourceContract.tryMutationOrdering.exactOrderingPassed === true &&
        exact(member.sourceContract.literalTwoAttemptSequence,
          deriveSourceWrongAttemptSequence(choice)),
      `${expected.animationId} choice contract drifted`);
      if (expected.animationId === 'shared-alg001-l11-p011') {
        const help = member.sourceContract.needMoreHelp;
        invariant(member.sourceContract.needMoreHelpScripts.length === 2 &&
          help?.popupSprite.objectId === 17 &&
          help.popupSprite.frameCount === 1 &&
          help.popupSprite.exportName === 'show mc1_new_001' &&
          help.mainTimelineFrame === 87 &&
          help.mainPlacements.popup.depth === 52 &&
          help.mainPlacements.popup.objectId === 17 &&
          help.mainPlacements.popup.name === 'Mc_Popup' &&
          help.mainPlacements.closeButton.depth === 64 &&
          help.mainPlacements.closeButton.objectId === 48 &&
          help.mainPlacements.closeButton.name === 'CloseBtn' &&
          help.mainPlacements.openButton.depth === 72 &&
          help.mainPlacements.openButton.objectId === 8 &&
          help.mainPlacements.openButton.name === 'NMHBtn' &&
          help.textPlacements.length === 2 &&
          exact(help.textPlacements.map((text) => text.objectId), [10, 11]) &&
          exact(help.textPlacements.map((text) => text.depth), [3, 4]) &&
          exact(help.textPlacements.map((text) => text.text.visibleText), [
            'Use the rules of inequalities to find the solution set.',
            'Inequality Rule 3: You can multiply or divide both sides of an ' +
              'inequality by any negative number but you must reverse the ' +
              'direction of the inequality symbol.',
          ]) && Object.values(help.visibilityLifecycle).every((value) =>
            typeof value === 'object' || value === true),
        'p011 exact Need More Help projection drifted');
      } else {
        invariant(member.sourceContract.needMoreHelpScripts.length === 0 &&
          member.sourceContract.needMoreHelp === null,
        `${expected.animationId} must not invent Need More Help`);
      }
      const present = member.sourceContract.geometry.optionSlots.filter(
        (slot) => slot.present);
      invariant(present.filter((slot) => slot.correct).length === 1 &&
        present.every((slot) => /^[A-D]$/u.test(slot.slot) &&
          typeof slot.geometrySha256 === 'string' &&
          slot.geometrySha256.length === 64 &&
          slot.visibleObjects.length > 0 &&
          slot.hitTarget.reachableObjects.length > 0 && (() => {
            const {geometrySha256, ...projection} = slot;
            return sha256(stableBytes(projection)) === geometrySha256;
          })()) &&
        member.sourceContract.geometry.optionSlots.filter((slot) =>
          !slot.present).every((slot) =>
          slot.absence.unpairedNamedButtonAbsent === true &&
          slot.absence.visibleLabelAbsent === true),
      `${expected.animationId} choice geometry schema drifted`);
      invariant(member.sourceContract.geometry.geometrySetSha256 ===
        sha256(stableBytes(member.sourceContract.geometry.optionSlots)),
      `${expected.animationId} choice geometry checksum drifted`);
      geometryRows.push(`${expected.animationId}|${
        member.sourceContract.geometry.geometrySetSha256}\n`);
    } else if (expected.animationId.endsWith('p006')) {
      invariant(member.sourceContract.kind ===
        'random-audio-label-timeline' &&
        exact(member.sourceContract.labelWindows, [
          {label: 'S1', startFrame: 3, returnFrame: 16,
            soundStreamBlockCount: 15},
          {label: 'S2', startFrame: 18, returnFrame: 27,
            soundStreamBlockCount: 13},
          {label: 'S3', startFrame: 31, returnFrame: 36,
            soundStreamBlockCount: 9},
          {label: 'S4', startFrame: 40, returnFrame: 54,
            soundStreamBlockCount: 16},
        ]) && member.sourceContract.embeddedAudioStructure
          .listeningAcceptancePassed === false,
      'p006 random/audio contract drifted');
    } else {
      const chain = member.sourceContract.sourceParentChain;
      const p009 = expected.animationId.endsWith('p009');
      invariant(member.sourceContract.kind === 'two-try-need-more-help' &&
        member.sourceContract.nestedTimeline.frameCount === 70 &&
        exact(member.sourceContract.nestedTimeline.stopFrames, [1, 64]) &&
        member.sourceContract.nestedTimeline.closeTargetFrame === 65 &&
        member.sourceContract.nestedTimeline.completionFrame === 70 &&
        chain.mainToNested.parentObjectId === expected.mainObjectId &&
        chain.mainToNested.frame === 1 &&
        chain.mainToNested.depth === (p009 ? 36 : 51) &&
        chain.mainToNested.objectId === (p009 ? 43 : 58) &&
        chain.mainToNested.name === 'Mc_Wrong_Feed3' &&
        chain.nestedToPopup.parentObjectId === (p009 ? 43 : 58) &&
        chain.nestedToPopup.frame === 38 &&
        chain.nestedToPopup.depth === 1 &&
        chain.nestedToPopup.objectId === (p009 ? 19 : 34) &&
        chain.nestedToPopup.name === 'Mc_Feed_Popup' &&
        chain.popupFrameCount === 1 &&
        chain.popupToCloseButton.parentObjectId === (p009 ? 19 : 34) &&
        chain.popupToCloseButton.frame === 1 &&
        chain.popupToCloseButton.depth === 1 &&
        chain.popupToCloseButton.objectId === (p009 ? 15 : 31) &&
        chain.popupToCloseButton.name === 'BtnClose' &&
        chain.closeButtonDefinitionType === 'DefineButton2' &&
        member.sourceContract.runtimeParentBindingEstablished === false,
      `${expected.animationId} two-try contract drifted`);
    }
  }
  invariant(value.choiceGeometrySetSha256 === sha256(Buffer.from(
    geometryRows.join(''))), 'interactive10 geometry set projection drifted');
  return true;
}

export async function validateInteractive10Audit(value) {
  const current = await stableFile(SCRIPT_PATH, {absolute: true});
  const trustedGenerator = Object.freeze({
    path: path.relative(ROOT, SCRIPT_PATH), bytes: current.bytes,
    sha256: current.sha256,
  });
  return validateInteractive10AuditAgainstCurrentGenerator(value,
    trustedGenerator);
}

export async function prepareG678AlgL11Interactive10TrancheCAudit() {
  const [residual, residualBuilder, generator, sourceRootPath] =
    await Promise.all([
      stableFile(RESIDUAL, {json: true, readOnly: true}),
      stableFile(RESIDUAL_BUILDER),
      stableFile(path.relative(ROOT, SCRIPT_PATH)),
      sourceRoot(),
    ]);
  invariant(residual.bytes === RESIDUAL_BYTES &&
    residual.sha256 === RESIDUAL_SHA256 &&
    residualBuilder.sha256 === RESIDUAL_BUILDER_SHA256 &&
    residual.value.artifactType === 'g678-alg-l11-residual-routing-audit-v1' &&
    residual.value.status === 'exact-35-source-script-text-routed-no-registration',
  'residual authority drifted');
  const residualById = new Map(residual.value.members.map((member) =>
    [member.animationId, member]));
  const members = [];
  for (const expected of EXPECTED) {
    const source = residualById.get(expected.animationId);
    invariant(source, `${expected.animationId} is absent from residual authority`);
    members.push(await buildRecord(expected, source, sourceRootPath));
  }
  const choiceMembers = members.filter((member) =>
    member.sourceContract.kind === 'choice-feedback-practice');
  const choiceSlots = choiceMembers.flatMap((member) =>
    member.sourceContract.geometry.optionSlots);
  const choiceGeometrySetSha256 = sha256(Buffer.from(choiceMembers.map(
    (member) => `${member.animationId}|${
      member.sourceContract.geometry.geometrySetSha256}\n`).join('')));
  const generatorDescriptor = Object.freeze({
    path: path.relative(ROOT, SCRIPT_PATH), bytes: generator.bytes,
    sha256: generator.sha256,
  });
  const artifact = Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l11-interactive10-tranche-c-source-audit-v1',
    auditId: 'g678-alg-l11-interactive10-tranche-c-audit-v1',
    status:
      'exact-10-source-script-frame-answer-try-random-audio-host-audited-no-registration',
    stableLessonKey: 'shared-alg001-l11', moduleCode: 'ALG001',
    lessonNumber: 11, lessonActivePageCount: 44,
    inputs: Object.freeze({residualAuthority: Object.freeze({path: RESIDUAL,
      bytes: residual.bytes, sha256: residual.sha256}),
    residualBuilder: Object.freeze({path: RESIDUAL_BUILDER,
      bytes: residualBuilder.bytes, sha256: residualBuilder.sha256}),
    generator: generatorDescriptor,
    sourceRoot: Object.freeze({environmentVariable: SOURCE_ENV,
      relativeRoot: 'G6-G8-shared', canonicalReadOnlyVerified: true}),
    frozenDiagnosticRoot: DIAGNOSTIC_ROOT}),
    exactPlacementIds: EXPECTED_IDS, auditedPlacementCount: 10,
    familyCounts: Object.freeze({
      'l11-random-audio-label-timeline': 1,
      'l11-choice-feedback-practice': 7,
      'l11-two-try-need-more-help': 2,
    }),
    complexityCounts: Object.freeze({'interactive-understood': 10}),
    physicalAudioCandidateCount: 10,
    physicalAudioIdentityVerifiedCount: 10,
    audioAcceptedCount: 0,
    ffdecFrozenDiagnosticMemberCount: 10,
    choiceLogicalOptionSlotCount: choiceSlots.length,
    choicePresentOptionCount: choiceSlots.filter((slot) => slot.present).length,
    choiceAbsentOptionCount: choiceSlots.filter((slot) => !slot.present).length,
    choiceGeometrySetSha256,
    choiceNeedMoreHelpControlPlacementCount: choiceMembers.filter((member) =>
      member.sourceContract.needMoreHelp !== null).length,
    choiceNeedMoreHelpTextPlacementCount: choiceMembers.reduce((sum, member) =>
      sum + (member.sourceContract.needMoreHelp?.textPlacements.length ?? 0), 0),
    twoTryParentChainVerifiedCount: members.filter((member) =>
      member.sourceContract.kind === 'two-try-need-more-help').length,
    tryMutationOrderingVerifiedCount: choiceMembers.filter((member) =>
      member.sourceContract.tryMutationOrdering.exactOrderingPassed).length,
    sourceAuditP0Count: 0, sourceAuditP1Count: 0,
    sourceContractAuditPassed: true,
    independentReviewPassed: false,
    candidateImplementationAuthorized: false,
    registrationCandidatePlacementCount: 0,
    currentJavaScriptRegisteredPlacementCount: 0,
    productCalibrationPassed: false, browserCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false,
    semanticReuse: Object.freeze({algL09AssumedEquivalent: false,
      reuseAuthorized: false, exactSemanticDiffRequired: true}),
    members: Object.freeze(members),
    limitations: EXPECTED_LIMITATIONS,
    acceptanceEffects: FALSE_EFFECTS});
  await validateInteractive10Audit(artifact);
  return Object.freeze({artifact, bytes: stableBytes(artifact)});
}

export async function auditG678AlgL11Interactive10TrancheC(
  {check = false} = {},
) {
  const prepared = await prepareG678AlgL11Interactive10TrancheCAudit();
  if (check) {
    const current = await stableFile(OUTPUT, {json: true, readOnly: true});
    invariant(current.buffer.equals(prepared.bytes),
      'interactive10 tranche-c audit artifact drifted');
    await validateInteractive10Audit(current.value);
  } else {
    await writeFile(projectPath(OUTPUT), prepared.bytes,
      {flag: 'wx', mode: 0o444});
    await chmod(projectPath(OUTPUT), 0o444);
    const current = await stableFile(OUTPUT, {readOnly: true});
    invariant(current.buffer.equals(prepared.bytes),
      'interactive10 tranche-c audit publication drifted');
  }
  return Object.freeze({check, output: OUTPUT, bytes: prepared.bytes.length,
    sha256: sha256(prepared.bytes), auditedPlacementCount: 10,
    sourceAuditP0Count: 0, sourceAuditP1Count: 0,
    physicalAudioIdentityVerifiedCount: 10,
    registrationCandidatePlacementCount: 0,
    productCalibrationPassed: false, browserCalibrationPassed: false,
    acceptanceEffects: FALSE_EFFECTS});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: audit-g678-alg-l11-interactive10-tranche-c.mjs [--check]');
  auditG678AlgL11Interactive10TrancheC({check: args.includes('--check')})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
