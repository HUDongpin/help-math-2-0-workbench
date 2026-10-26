#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {chmod, lstat, readFile, readdir, realpath, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SOURCE_ENV = 'HELP_MATH_G678_SOURCE_ROOT';
const PREFIX = 'g678-alg-l11-advanced3-tranche-d';
const OUTPUT = `catalog/${PREFIX}-audit-v1.json`;
const TEST = `scripts/audit-${PREFIX}.test.mjs`;
const RESIDUAL = 'catalog/g678-alg-l11-residual-routing-audit-v1.json';
const MILESTONE =
  'reports/g678-current-js-calibration-funnel-354-post-family-20260905.json';
const SHARED_CATALOG = 'catalog/g678-shared-catalog.v1.json';
const DIAGNOSTIC_ROOT =
  'work/g678-shared-page-factory/g678-alg-l11-residual-routing-audit-v1';
const IDS = Object.freeze([
  'shared-alg001-l11-p033',
  'shared-alg001-l11-p034',
  'shared-alg001-l11-p044',
]);
const EXPECTED = Object.freeze({
  residualSha256:
    '3d9f30ca17554b9c3cd0e8c0f51273affad3584eb4795a59359ee68fb783891c',
  milestoneSha256:
    '114dc138b20fd6101951ef575863159daad6a9ddf20e5a975e07e3be59538875',
  sharedCatalogSha256:
    'a1692c2a86c6771dcb104f59195b5bfdd2b5281cceff0aaeb63a3aabcf4a5657',
  lessonXmlSha256:
    '329feea5eafa57e0824cbbf03f956c9df2df83c85be81a384f70f34908ab3896',
});

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

const PAGE_EXPECTATIONS = Object.freeze({
  'shared-alg001-l11-p033': Object.freeze({
    sourcePath: 'G6-G8-shared/ALG001/L11/GS/L11GS02.swf',
    bytes: 219424,
    sha256:
      'a45ea47bc800183016612ef316ba9d54c3cc191764650cb2bce24bcd920061c2',
    sourceXmlBytes: 1089205,
    sourceXmlSha256:
      '1b973f677031958d2c7b587a2aa9237379daae9e7e4e972758888c15905992a8',
    scripts: Object.freeze({fileCount: 47, totalBytes: 13824,
      checksumSetSha256:
        '37507461e6ebb9910c06683421d81e144e31964f99375fadafe43888d7baeef1'}),
    texts: Object.freeze({fileCount: 39, totalBytes: 1283,
      checksumSetSha256:
        '3ed8fd15483fba39a5bf503d7102d5f041ea8078ef51d8f8dd83aa19f01fb44b'}),
    commandReceipt: Object.freeze({bytes: 1478,
      sha256:
        '5fba167ea54e304c9ed828db8398955515d7b8317fe36c9759d73f080651dc90'}),
    frozenTree: Object.freeze({fileCount: 92, totalBytes: 1122190,
      checksumSetSha256:
        '556c11babaaa320810800bceb790e88806be8aea4260698129a5c5fd6db58e82'}),
  }),
  'shared-alg001-l11-p034': Object.freeze({
    sourcePath: 'G6-G8-shared/ALG001/L11/GS/L11GS03.swf',
    bytes: 397111,
    sha256:
      '77b4d2a8ee13325bd527f558751ac84e60d1de36d1ff258cb6569f36885ad06c',
    sourceXmlBytes: 3030388,
    sourceXmlSha256:
      '25d66465e54bffe8065ea812cbb606f6212c64869a6716eacdabbdf6231e4ee5',
    scripts: Object.freeze({fileCount: 99, totalBytes: 134235,
      checksumSetSha256:
        '27119f9bcf86049b2c597767ee860b79a410bf642fed26d127f26f278aa2b49f'}),
    texts: Object.freeze({fileCount: 42, totalBytes: 657,
      checksumSetSha256:
        '6dab264a12a4600d3f7f21c3416f32384fc0086e36a071c341742a1ad7d9b012'}),
    commandReceipt: Object.freeze({bytes: 1478,
      sha256:
        '295735def68b31b2a4f86c34c443861c76bc1a8e4d722d49af430f48b878dbf9'}),
    frozenTree: Object.freeze({fileCount: 147, totalBytes: 3198639,
      checksumSetSha256:
        'e83b386fdc35a4f0f64b5355d91d655eb43a2d48541e05196f108044aa0d385d'}),
  }),
  'shared-alg001-l11-p044': Object.freeze({
    sourcePath: 'G6-G8-shared/ALG001/L11/FQ/L11FQ02.swf',
    bytes: 50234,
    sha256:
      'd17c24baef9bf9ea87eefae6cf5d317ad50a211035cd997e0cfba16eb6390ff1',
    sourceXmlBytes: 3392272,
    sourceXmlSha256:
      '0b0e3dc5ad42c1aebc8d702bb1b1df01d457c8774be5783c88202aa00a15ea89',
    scripts: Object.freeze({fileCount: 115, totalBytes: 30253,
      checksumSetSha256:
        'f8bb21a60ef7d530e14deb2a8577dfe8acaa9197b60c73e9106a25cb0a95bb65'}),
    texts: Object.freeze({fileCount: 694, totalBytes: 5826,
      checksumSetSha256:
        'b171f00db9bf1235d24540ded394e02c263b894fa5c73b4ca9129239bfc30d85'}),
    commandReceipt: Object.freeze({bytes: 1477,
      sha256:
        '0900a923f0d99a1798bb1b23a3a786c402fe9dcd423271a3991eb63d37ab60fc'}),
    frozenTree: Object.freeze({fileCount: 815, totalBytes: 3500522,
      checksumSetSha256:
        '83debe68ae53c984e9c4fd9e21d846a4e7a06d1f1be35f54f370a17fd6efe398'}),
  }),
});

const P034_CARD_ROWS = Object.freeze([
  [1, 'Mc1_1', 59, [56]], [1, 'Mc5_1', 65, [61, 62, 63, 64]],
  [1, 'Mc6_1', 70, [62, 67, 68, 64, 69]],
  [1, 'Mc2_2', 74, [72, 73]], [1, 'Mc4_1', 77, [76]],
  [1, 'Mc3_1', 81, [79, 61, 80, 63, 68, 64, 69]],
  [1, 'Mc3_2', 83, [69, 80, 64]], [1, 'Mc1_2', 86, [84]],
  [1, 'Mc5_2', 88, [69, 62, 64]],
  [1, 'Mc6_2', 90, [61, 62, 64]],
  [1, 'Mc2_1', 92, [69, 62, 64]],
  [1, 'Mc4_2', 93, [63, 80, 64]],
  [2, 'Mc1_1', 195, [192, 61, 62, 193, 68, 64, 63, 194]],
  [2, 'Mc4_1', 198, [193, 80, 64, 63]],
  [2, 'Mc3_2', 201, [199, 80, 64]],
  [2, 'Mc5_1', 203, [192, 80, 64]],
  [2, 'Mc2_1', 206, [205, 67, 80, 69, 68, 64, 61, 63]],
  [2, 'Mc6_2', 208, [67, 62, 64]],
  [2, 'Mc4_2', 211, [63, 62, 64]],
  [2, 'Mc1_2', 213, [61, 67, 80, 64]],
  [2, 'Mc2_2', 215, [69, 62, 64]],
  [2, 'Mc6_1', 217, [192, 80, 64]],
  [2, 'Mc3_1', 219, [194, 62, 61, 68, 64, 69, 63]],
  [2, 'Mc5_2', 221, [67, 80, 64]],
]);

const P044_ANSWER_KEY = Object.freeze([
  'A1Opt4', 'A2Opt1', 'A3Opt4', 'A4Opt3', 'A5Opt3', 'A6Opt4',
  'A7Opt2', 'A8Opt1', 'A9Opt4', 'A10Opt2', 'A11Opt4', 'A12Opt1',
  'A13Opt3', 'A14Opt4', 'A15Opt2', 'A16Opt4', 'A17Opt3', 'A18Opt2',
  'A19Opt3', 'A20Opt1', 'A21Opt4', 'A22Opt3', 'A23Opt2', 'A24Opt1',
]);

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function stableBytes(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function projectPath(relative) {
  const target = path.resolve(ROOT, relative);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relative} escapes project root`);
  return target;
}

async function stableFile(target, {absolute = false, json = false,
  readOnly = false} = {}) {
  const resolved = absolute ? path.resolve(target) : projectPath(target);
  const [canonical, before] = await Promise.all([
    realpath(resolved), lstat(resolved, {bigint: true}),
  ]);
  invariant(canonical === resolved && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (!readOnly || (before.mode & 0o222n) === 0n),
  `${target} must be one canonical ordinary${readOnly ? ' read-only' : ''} file`);
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

function descriptor(file, displayPath = file.path) {
  return Object.freeze({path: displayPath, bytes: file.bytes,
    sha256: file.sha256});
}

async function validateSourceRoot() {
  const configured = process.env[SOURCE_ENV];
  invariant(typeof configured === 'string' && configured.length > 0,
    `${SOURCE_ENV} is required`);
  invariant(path.isAbsolute(configured) && path.normalize(configured) === configured,
    `${SOURCE_ENV} must be one normalized absolute path`);
  const root = path.resolve(configured);
  const [canonical, metadata] = await Promise.all([
    realpath(root), lstat(root, {bigint: true}),
  ]);
  invariant(canonical === root && metadata.isDirectory() &&
    !metadata.isSymbolicLink(), `${SOURCE_ENV} must be a canonical directory`);
  const shared = path.join(root, 'G6-G8-shared');
  const sharedMetadata = await lstat(shared, {bigint: true});
  invariant(sharedMetadata.isDirectory() && !sharedMetadata.isSymbolicLink(),
    `${SOURCE_ENV}/G6-G8-shared must be a real directory`);
  return shared;
}

async function walkFrozenFiles(root, current = root, files = []) {
  const metadata = await lstat(current, {bigint: true});
  invariant(metadata.isDirectory() && !metadata.isSymbolicLink() &&
    Number(metadata.mode & 0o777n) === 0o555,
  `${current} must be a frozen 0555 directory`);
  const entries = await readdir(current, {withFileTypes: true});
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const target = path.join(current, entry.name);
    invariant(!entry.isSymbolicLink(), `${target} may not be a symlink`);
    if (entry.isDirectory()) await walkFrozenFiles(root, target, files);
    else {
      invariant(entry.isFile(), `${target} must be an ordinary file`);
      const item = await lstat(target, {bigint: true});
      invariant(item.nlink === 1n && Number(item.mode & 0o777n) === 0o444,
        `${target} must be a frozen 0444 single-link file`);
      files.push(target);
    }
  }
  return files;
}

async function inventory(root, suffix = null) {
  const files = (await walkFrozenFiles(root)).filter((file) =>
    suffix === null || file.endsWith(suffix));
  let totalBytes = 0;
  const rows = [];
  const values = [];
  for (const file of files) {
    const item = await stableFile(file, {absolute: true, readOnly: true});
    const relative = path.relative(root, file).split(path.sep).join('/');
    totalBytes += item.bytes;
    rows.push(`${item.sha256}  ${relative}\n`);
    values.push(Object.freeze({...descriptor(item, relative),
      text: item.buffer.toString('utf8').replace(/\r\n?/gu, '\n')}));
  }
  return Object.freeze({fileCount: files.length, totalBytes,
    checksumSetSha256: sha256(Buffer.from(rows.join(''))), values});
}

function exactObject(actual, expected, message) {
  invariant(JSON.stringify(actual) === JSON.stringify(expected), message);
}

function normalizeText(text) {
  return text.replace(/\r\n?/gu, '\n')
    .replace(/\s*--- RECORDSEPARATOR ---\s*/gu, ' ')
    .replace(/\s+/gu, ' ').trim();
}

export function deriveReachableTextIds(xmlText, sourceCharacterId,
  availableTextIds) {
  invariant(typeof xmlText === 'string' &&
    Number.isSafeInteger(sourceCharacterId) && sourceCharacterId > 0 &&
    availableTextIds instanceof Set,
  'source XML text-graph inputs are invalid');
  const seen = new Set();
  const found = [];
  function visit(objectId) {
    if (seen.has(objectId)) return;
    seen.add(objectId);
    if (availableTextIds.has(objectId)) found.push(objectId);
    const opening = new RegExp(
      `<(Define[A-Za-z0-9_]*)[^>]*\\bobjectID="${objectId}"[^>]*>`, 'u')
      .exec(xmlText);
    invariant(opening, `source XML object ${objectId} is absent`);
    const tag = opening[1];
    const start = opening.index + opening[0].length;
    const end = xmlText.indexOf(`</${tag}>`, start);
    invariant(end >= start, `source XML object ${objectId} is unterminated`);
    const body = xmlText.slice(start, end);
    for (const match of body.matchAll(
      /<PlaceObject2\b[^>]*\bobjectID="(\d+)"[^>]*>/gu)) {
      visit(Number(match[1]));
    }
  }
  visit(sourceCharacterId);
  return Object.freeze(found);
}

function parseQuotedArray(script, assignment) {
  const escaped = assignment.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = script.match(new RegExp(
    `${escaped}\\s*=\\s*\\[((?:"[^"]+"\\s*,?\\s*)+)\\]`, 'u'));
  invariant(match, `${assignment} exact quoted array is absent`);
  return [...match[1].matchAll(/"([^"]+)"/gu)].map((item) => item[1]);
}

export function deriveControllerContract(script) {
  invariant(typeof script === 'string', 'controller script bundle is required');
  const markers = [...script.matchAll(/^FILE ([^\n]+)\n/gmu)];
  invariant(markers.length > 0,
    'p033 controller script bundle has no path markers');
  const files = new Map();
  for (let index = 0; index < markers.length; index += 1) {
    const marker = markers[index];
    const filePath = marker[1];
    invariant(!files.has(filePath),
      `p033 duplicate script path ${filePath}`);
    const start = marker.index + marker[0].length;
    const end = index + 1 < markers.length ? markers[index + 1].index :
      script.length;
    files.set(filePath, script.slice(start, end));
  }
  const expectedBindings = Object.freeze({
    initialHandoff: Object.freeze({
      path: 'DefineSprite_116/frame_1/PlaceObject2_56_24/CLIPACTIONRECORD on(release).as',
      frame: 1, depth: 24,
      call: /doNeedMoreHelp\s*\(\s*"L11GS03"\s*,\s*1\s*\)/u,
    }),
    terminalHandoff: Object.freeze({
      path: 'DefineSprite_116/frame_605/PlaceObject2_56_43/CLIPACTIONRECORD on(release).as',
      frame: 605, depth: 43,
      call: /doNeedMoreHelp\s*\(\s*"L11GS03"\s*,\s*1\s*,\s*6\s*\)/u,
    }),
    terminalStop: Object.freeze({
      path: 'DefineSprite_116/frame_605/DoAction.as', frame: 605,
      depth: null, call: /\bstop\s*\(\s*\)\s*;/u,
    }),
  });
  const scriptBindings = {};
  for (const [name, binding] of Object.entries(expectedBindings)) {
    const content = files.get(binding.path);
    invariant(typeof content === 'string' && binding.call.test(content),
      `p033 ${name} exact path/frame/depth binding drifted`);
    scriptBindings[name] = Object.freeze({path: binding.path,
      frame: binding.frame, depth: binding.depth});
  }
  const callOwners = [...files.entries()].filter(([, content]) =>
    /doNeedMoreHelp\s*\(/u.test(content));
  exactObject(callOwners.map(([filePath]) => filePath), [
    expectedBindings.initialHandoff.path,
    expectedBindings.terminalHandoff.path,
  ], 'p033 cross-page calls must occur only at the exact source paths');
  invariant(callOwners.every(([, content]) =>
    (content.match(/doNeedMoreHelp\s*\(/gu) ?? []).length === 1),
  'p033 exact source path contains duplicate cross-page calls');
  invariant((script.match(/_global\.gameLevel1\s*=\s*true/gu) ?? []).length === 2 &&
    (script.match(/_global\.gameLevel2\s*=\s*true/gu) ?? []).length === 2 &&
    (script.match(/_global\.startGame\s*=\s*true/gu) ?? []).length === 2,
  'p033 level/start mutations drifted');
  return Object.freeze({target: 'L11GS03', initialHandoffArguments: [1],
    terminalHandoffArguments: [1, 6], levelCount: 2,
    selectionRequiredBeforeStart: true, startFlag: 'startGame',
    initialFrame: 1, terminalFrame: 605,
    phaseBoundary: Object.freeze({initialLastFrame: 604,
      terminalFirstFrame: 605}),
    scriptBindings: Object.freeze(scriptBindings),
    maintainedReplayMustResetSelection: true});
}

export function deriveMatchingContract(script, cards) {
  invariant(typeof script === 'string' && Array.isArray(cards),
    'matching source inputs are required');
  invariant(cards.length === 24 && new Set(cards.map((card) =>
    `${card.level}:${card.sourceInstanceName}`)).size === 24,
  'p034 exact 24-card inventory drifted');
  for (const level of [1, 2]) {
    const levelCards = cards.filter((card) => card.level === level);
    invariant(levelCards.length === 12, `p034 level ${level} card count drifted`);
    for (const pairId of [1, 2, 3, 4, 5, 6]) {
      const pair = levelCards.filter((card) => card.pairId === pairId);
      invariant(pair.length === 2 && new Set(pair.map((card) => card.side)).size === 2,
        `p034 level ${level} pair ${pairId} drifted`);
    }
  }
  invariant((script.match(/_global\.score\s*\+=\s*10/gu) ?? []).length === 48 &&
    (script.match(/_global\.score\s*-=\s*2/gu) ?? []).length === 48 &&
    (script.match(/_global\.score\s*=\s*0/gu) ?? []).length === 2,
  'p034 score mutation multiplicity drifted');
  invariant(/_global\.totAnsCount\+\+[\s\S]*?_global\.totAnsCount\s*>=\s*6[\s\S]*?_parent\.nextFrame\s*\(\s*\)/u
    .test(script), 'p034 six-match completion transition drifted');
  invariant(/_parent\.disableMc\s*\(\s*\)/u.test(script) &&
    /_parent\.enableMc\s*\(\s*\)/u.test(script),
  'p034 disable/feedback/enable boundary drifted');
  return Object.freeze({levelCount: 2, pairsPerLevel: 6,
    cardsPerLevel: 12, firstClickSelects: true,
    secondClickEvaluatesPair: true, correctScoreDelta: 10,
    incorrectScoreDelta: -2, disableDuringFeedback: true,
    feedbackMustBeDismissedBeforeNextSelection: true,
    completeAfterMatchedPairCount: 6,
    maintainedReplayMustResetScoreSelectionMatchesAndFeedback: true});
}

export function deriveAssessmentContract(script, correctActionNames,
  wrongActionNames) {
  invariant(typeof script === 'string' && Array.isArray(correctActionNames) &&
    Array.isArray(wrongActionNames), 'assessment source inputs are required');
  const answerKey = parseQuotedArray(script, '_global.arrayAnswer');
  const quizLabels = parseQuotedArray(script, '_global.quizLabelArray');
  exactObject(answerKey, P044_ANSWER_KEY, 'p044 answer key drifted');
  exactObject(quizLabels, Array.from({length: 24}, (_, i) => `Q${i + 1}`),
    'p044 question labels drifted');
  exactObject(correctActionNames.slice().sort(), P044_ANSWER_KEY.slice().sort(),
    'p044 correct-option action placement drifted');
  invariant(wrongActionNames.length === 72 &&
    new Set([...correctActionNames, ...wrongActionNames]).size === 96,
  'p044 24-by-4 option action inventory drifted');
  invariant((script.match(/\brandom\s*\(/gu) ?? []).length === 1 &&
    /random\s*\(\s*_global\.quizLabelArray\.length\s*\)/u.test(script) &&
    /_global\.quizLabelArray\.splice\s*\(\s*_global\.tempQNo\s*,\s*1\s*\)/u.test(script) &&
    /_global\.revLabelArray\.splice\s*\(\s*_global\.tempQNo\s*,\s*1\s*\)/u.test(script) &&
    /_global\.totalQuestionsCount\s*=\s*10/u.test(script),
  'p044 unique random 10-of-24 selection contract drifted');
  for (const call of ['doGetRandomQuiz', 'doGetReview', 'setBookMark',
    'doCloseApp', 'doPlayFQQuestionAudio', 'doPlayFQAnswerAudio']) {
    invariant(script.includes(call), `p044 host call ${call} is absent`);
  }
  const gradeBands = Object.freeze([
    Object.freeze({minimum: 0, maximum: 3, label: 'Unsatisfactory'}),
    Object.freeze({minimum: 4, maximum: 6,
      label: 'Partially Proficient'}),
    Object.freeze({minimum: 7, maximum: 8, label: 'Proficient'}),
    Object.freeze({minimum: 9, maximum: 10, label: 'Advanced'}),
  ]);
  for (const band of gradeBands) invariant(script.includes(`"${band.label}"`),
    `p044 grade label ${band.label} is absent`);
  return Object.freeze({poolSize: 24, selectionCount: 10,
    sampling: 'random-index-then-splice-without-replacement', answerKey,
    quizLabels, optionCountPerQuestion: 4, correctActionCount: 24,
    wrongActionCount: 72, gradeBands,
    reviewPreservesQuestionOrder: true,
    legacyHostCallsRecordedNotExecuted: Object.freeze([
      'doCloseApp', 'doGetReview', 'setBookMark',
      'doPlayFQQuestionAudio', 'doPlayFQAnswerAudio',
    ]), maintainedReplayMustResampleAndResetResponsesReviewAndScore: true});
}

function assertMilestone(value) {
  const text = JSON.stringify(value);
  invariant(text.includes('"registeredCurrentJsPages":354') ||
    text.includes('"registeredCurrentJsPageCount":354') ||
    text.includes('"registeredPageCount":354'),
  'final354 milestone registered count drifted');
  invariant(text.includes('"productHostCalibratedPages":138') ||
    text.includes('"productHostCalibratedPageCount":138'),
  'final354 product-host count drifted');
  invariant(text.includes('"currentJavaScriptRegistered":false') ||
    text.includes('"overallG678CurrentJavaScriptComplete":false'),
  'final354 downstream boundary is absent');
}

async function buildCards(memberRoot, sourceXml) {
  const textsRoot = path.join(memberRoot, 'ffdec-export', 'texts');
  const xmlText = sourceXml.buffer.toString('utf8');
  const availableTextIds = new Set((await readdir(textsRoot))
    .filter((name) => /^\d+\.txt$/u.test(name))
    .map((name) => Number(name.slice(0, -4))));
  const cards = [];
  for (const [level, sourceInstanceName, sourceCharacterId,
    sourceTextIds] of P034_CARD_ROWS) {
    invariant(new RegExp(
      `<PlaceObject2\\b[^>]*\\bobjectID="${sourceCharacterId}"[^>]*\\bname="${sourceInstanceName}"[^>]*>`,
      'u').test(xmlText),
    `p034 ${level}:${sourceInstanceName} XML binding drifted`);
    exactObject(deriveReachableTextIds(xmlText, sourceCharacterId,
      availableTextIds), sourceTextIds,
    `p034 ${level}:${sourceInstanceName} reachable source texts drifted`);
    const sourceTexts = [];
    for (const textId of sourceTextIds) {
      const text = await stableFile(path.join(textsRoot, `${textId}.txt`),
        {absolute: true, readOnly: true});
      sourceTexts.push(Object.freeze({textId, value: normalizeText(
        text.buffer.toString('utf8')), sha256: text.sha256}));
    }
    const match = sourceInstanceName.match(/^Mc([1-6])_([12])$/u);
    invariant(match, `p034 ${sourceInstanceName} instance format drifted`);
    cards.push(Object.freeze({level, sourceInstanceName, sourceCharacterId,
      pairId: Number(match[1]), side: Number(match[2]),
      sourceTexts: Object.freeze(sourceTexts)}));
  }
  return Object.freeze(cards);
}

function actionNameFromPath(value) {
  const match = value.path.match(/PlaceObject2_\d+_\d+\/CLIPACTIONRECORD/u);
  invariant(match, `${value.path}: assessment action path drifted`);
  const scriptName = value.text.match(/_global\.arrayResponseAnswer\.push\(this\._name\)/u);
  invariant(scriptName, `${value.path}: response action drifted`);
  return value;
}

function optionNameForAction(xmlText, value) {
  const pathMatch = value.path.match(/frame_(\d+)\/PlaceObject2_(\d+)_(\d+)\//u);
  invariant(pathMatch, `${value.path}: option placement path drifted`);
  const [, frame, objectId, depth] = pathMatch;
  const frameLabel = Number(frame) - 1;
  invariant(frameLabel >= 1 && frameLabel <= 24,
    `${value.path}: option question number drifted`);
  const candidates = [...xmlText.matchAll(new RegExp(
    `<PlaceObject2[^>]*depth="${depth}"[^>]*objectID="${objectId}"[^>]*name="(A${frameLabel}Opt[1-4])"`, 'gu'))];
  invariant(candidates.length === 1,
    `${value.path}: exact option name could not be recovered`);
  return candidates[0][1];
}

async function verifyAudio(lesson, sharedRoot) {
  const p033 = lesson.pages.find((page) => page.animationId === IDS[0]);
  invariant(p033?.audioCueCandidates?.length === 1,
    'p033 exact audio candidate count drifted');
  const candidate = p033.audioCueCandidates[0];
  const source = await stableFile(path.join(sharedRoot,
    candidate.viewPath.replace(/^G6-G8-shared\//u, '')),
  {absolute: true, readOnly: true});
  invariant(source.bytes === 731136 && source.sha256 ===
    'c3da6e052c439cdd40ef9aec723a151d62c897110558fe46c03d929bab6c8ab2',
  'p033 candidate audio identity drifted');

  invariant(lesson.audioGroupedCandidates.length === 120,
    'p044 grouped audio denominator drifted');
  const rows = [];
  const cues = new Map();
  let totalBytes = 0;
  for (const item of lesson.audioGroupedCandidates) {
    invariant(item.binding === 'FQ/EA', `${item.id}: grouped binding drifted`);
    const audio = await stableFile(path.join(sharedRoot,
      item.viewPath.replace(/^G6-G8-shared\//u, '')),
    {absolute: true, readOnly: true});
    invariant(audio.bytes === item.bytes && audio.sha256 === item.sha256,
      `${item.id}: grouped audio identity drifted`);
    const basename = path.basename(item.viewPath);
    const match = basename.match(/^Q(\d{1,2})([A-D]?)\.mp3$/u);
    invariant(match && Number(match[1]) >= 1 && Number(match[1]) <= 24,
      `${item.id}: grouped audio filename drifted`);
    const question = Number(match[1]);
    const cue = match[2] || 'question';
    const current = cues.get(question) ?? [];
    current.push(cue);
    cues.set(question, current);
    rows.push(`${audio.sha256}  ${item.viewPath}\n`);
    totalBytes += audio.bytes;
  }
  for (let question = 1; question <= 24; question += 1) {
    exactObject((cues.get(question) ?? []).sort(),
      ['A', 'B', 'C', 'D', 'question'],
      `p044 question ${question} five-cue audio closure drifted`);
  }
  invariant(totalBytes === 10860511 &&
    sha256(Buffer.from(rows.join(''))) ===
      '9e0853a0baf1ae7223bd6e94bc6c1fc48bd7890e7fcdefa8e4f0894f8ff7ca14',
  'p044 grouped audio aggregate drifted');
  return Object.freeze({p033: Object.freeze({...descriptor(source,
    candidate.viewPath), requirement: null, triggerSyncReplayResolved: false,
    listeningAccepted: false}), p044: Object.freeze({binding: 'FQ/EA',
      sourceQuestionCount: 24, cueCountPerQuestion: 5, fileCount: 120,
      totalBytes, checksumSetSha256:
        '9e0853a0baf1ae7223bd6e94bc6c1fc48bd7890e7fcdefa8e4f0894f8ff7ca14',
      requirement: null, triggerSyncReplayResolved: false,
      listeningAccepted: false})});
}

async function expectedArtifact() {
  const sharedRoot = await validateSourceRoot();
  const [builder, test, residual, milestone, catalog] = await Promise.all([
    stableFile(SCRIPT_PATH, {absolute: true}),
    stableFile(TEST),
    stableFile(RESIDUAL, {json: true, readOnly: true}),
    stableFile(MILESTONE, {json: true}),
    stableFile(SHARED_CATALOG, {json: true}),
  ]);
  invariant(residual.sha256 === EXPECTED.residualSha256 &&
    milestone.sha256 === EXPECTED.milestoneSha256 &&
    catalog.sha256 === EXPECTED.sharedCatalogSha256,
  'advanced3 upstream hash binding drifted');
  assertMilestone(milestone.value);
  const lesson = catalog.value.lessons.find((candidate) =>
    candidate.moduleCode === 'ALG001' && candidate.lessonNumber === 11);
  invariant(lesson?.stableLessonKey === 'shared-alg001-l11' &&
    lesson.sourceXmlSha256 === EXPECTED.lessonXmlSha256,
  'ALG001 L11 source catalog binding drifted');
  const lessonXml = await stableFile(path.join(sharedRoot,
    'ALG001/L11/index.xml'), {absolute: true, readOnly: true});
  invariant(lessonXml.sha256 === EXPECTED.lessonXmlSha256,
    'ALG001 L11 physical lesson XML drifted');

  const residualMembers = residual.value.members.filter((member) =>
    IDS.includes(member.animationId));
  exactObject(residualMembers.map((member) => member.animationId), IDS,
    'advanced3 residual exact membership/order drifted');
  const audited = [];
  let p034Cards;
  let p033Contract;
  let p034Contract;
  let p044Contract;
  for (const member of residualMembers) {
    const expected = PAGE_EXPECTATIONS[member.animationId];
    const catalogPage = lesson.pages.find((page) =>
      page.animationId === member.animationId);
    invariant(catalogPage && catalogPage.viewPath === expected.sourcePath &&
      catalogPage.sourceBytes === expected.bytes &&
      catalogPage.sourceSha256 === expected.sha256,
    `${member.animationId}: catalog source identity drifted`);
    const source = await stableFile(path.join(sharedRoot,
      expected.sourcePath.replace(/^G6-G8-shared\//u, '')),
    {absolute: true, readOnly: true});
    invariant(source.bytes === expected.bytes && source.sha256 === expected.sha256,
      `${member.animationId}: physical source identity drifted`);
    const memberRoot = projectPath(`${DIAGNOSTIC_ROOT}/${member.animationId}`);
    const [sourceXml, scripts, texts, receipt, frozenTree, stderr] =
      await Promise.all([
        stableFile(path.join(memberRoot, 'source.xml'),
          {absolute: true, readOnly: true}),
        inventory(path.join(memberRoot, 'ffdec-export', 'scripts'), '.as'),
        inventory(path.join(memberRoot, 'ffdec-export', 'texts'), '.txt'),
        stableFile(path.join(memberRoot, 'command-receipt.json'),
          {absolute: true, json: true, readOnly: true}),
        inventory(memberRoot),
        stableFile(path.join(memberRoot, 'swfmill.stderr'),
          {absolute: true, readOnly: true}),
      ]);
    invariant(sourceXml.bytes === expected.sourceXmlBytes &&
      sourceXml.sha256 === expected.sourceXmlSha256,
    `${member.animationId}: source.xml drifted`);
    exactObject({fileCount: scripts.fileCount, totalBytes: scripts.totalBytes,
      checksumSetSha256: scripts.checksumSetSha256}, expected.scripts,
    `${member.animationId}: FFDec scripts drifted`);
    exactObject({fileCount: texts.fileCount, totalBytes: texts.totalBytes,
      checksumSetSha256: texts.checksumSetSha256}, expected.texts,
    `${member.animationId}: FFDec texts drifted`);
    invariant(receipt.bytes === expected.commandReceipt.bytes &&
      receipt.sha256 === expected.commandReceipt.sha256 &&
      receipt.value.animationId === member.animationId &&
      receipt.value.source.sha256 === source.sha256,
    `${member.animationId}: command receipt drifted`);
    exactObject({fileCount: frozenTree.fileCount,
      totalBytes: frozenTree.totalBytes,
      checksumSetSha256: frozenTree.checksumSetSha256}, expected.frozenTree,
    `${member.animationId}: frozen diagnostic tree drifted`);
    invariant(stderr.bytes === 0,
      `${member.animationId}: swfmill warning boundary drifted`);

    const scriptBundle = scripts.values.map((item) =>
      `FILE ${item.path}\n${item.text}`).join('\n');
    if (member.animationId === IDS[0]) {
      p033Contract = deriveControllerContract(scriptBundle);
    } else if (member.animationId === IDS[1]) {
      p034Cards = await buildCards(memberRoot, sourceXml);
      p034Contract = deriveMatchingContract(scriptBundle, p034Cards);
    } else {
      const xmlText = sourceXml.buffer.toString('utf8');
      const actions = scripts.values.filter((item) =>
        /arrayResponseAnswer\.push\(this\._name\)/u.test(item.text))
        .map(actionNameFromPath);
      const correct = actions.filter((item) =>
        /arrayCorrectAnswer\.push\(this\._name\)/u.test(item.text))
        .map((item) => optionNameForAction(xmlText, item));
      const wrong = actions.filter((item) =>
        /arrayWrongAnswer\.push\(this\._name\)/u.test(item.text))
        .map((item) => optionNameForAction(xmlText, item));
      p044Contract = deriveAssessmentContract(scriptBundle, correct, wrong);
    }
    audited.push(Object.freeze({animationId: member.animationId,
      sectionCode: member.sectionCode,
      sectionPageOrdinal: member.sectionPageOrdinal,
      titleEnglish: member.titleEnglish,
      source: descriptor(source, expected.sourcePath),
      runtime: member.runtime,
      ffdec: Object.freeze({sourceXml: descriptor(sourceXml,
        `${DIAGNOSTIC_ROOT}/${member.animationId}/source.xml`),
        scripts: expected.scripts, texts: expected.texts,
        commandReceipt: descriptor(receipt,
          `${DIAGNOSTIC_ROOT}/${member.animationId}/command-receipt.json`),
        frozenTree: expected.frozenTree, swfmillWarnings: Object.freeze([])}),
      registrationCandidate: false, productCalibrationPassed: false,
      wholeLessonEngineeringPreviewReady: false,
      acceptanceEffects: FALSE_EFFECTS}));
  }
  invariant(p033Contract && p034Contract && p034Cards && p044Contract,
    'advanced3 exact contracts were not all derived');
  const audio = await verifyAudio(lesson, sharedRoot);
  return Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l11-advanced3-tranche-d-source-behavior-audit',
    generatedAt: new Date().toISOString(), prefix: PREFIX,
    moduleCode: 'ALG001', lessonNumber: 11,
    stableLessonKey: 'shared-alg001-l11', exactPlacementCount: 3,
    exactPlacementIds: IDS,
    inputs: Object.freeze({builder: descriptor(builder,
      'scripts/audit-g678-alg-l11-advanced3-tranche-d.mjs'),
      test: descriptor(test),
      residualAudit: descriptor(residual), final354Milestone: descriptor(milestone),
      sharedCatalog: descriptor(catalog), sourceLessonXml: Object.freeze({
        ...descriptor(lessonXml, 'G6-G8-shared/ALG001/L11/index.xml'),
        physicalReadOnlyOrdinarySingleLinkVerified: true})}),
    sourceIdentityVerifiedCount: 3,
    ffdecScriptInventoryVerifiedCount: 3,
    ffdecTextInventoryVerifiedCount: 3,
    pages: Object.freeze(audited),
    behaviorContracts: Object.freeze({p033CrossPageController: p033Contract,
      p034MatchingGame: Object.freeze({...p034Contract, cards: p034Cards}),
      p044RandomFinalAssessment: p044Contract}),
    audioCustody: audio,
    auditFindings: Object.freeze({p0: Object.freeze([]), p1: Object.freeze([]),
      p2: Object.freeze([
        'p033 source audio trigger and replay timing remain unknown until authorized original-runtime evidence and listening review',
        'p034 and p044 vector/graph appearance remains outside this static source-behavior audit',
        'legacy p044 report bookmark and close calls are recorded only and must not be executed by maintained candidates',
      ]), p0Count: 0, p1Count: 0, p2Count: 3}),
    maintainedCandidateImplementationAuthorizedByThisAudit: true,
    registrationCandidatePlacementCount: 0,
    currentJavaScriptRegisteredPlacementCount: 0,
    productCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false,
    acceptancePassed: false, releaseAuthorized: false, published: false,
    scaleOutAuthorized: false,
    limitations: Object.freeze([
      'This artifact authorizes only three bounded maintained engineering candidates after P0/P1=0; it does not register or product-calibrate them.',
      'Static SWF/XML/ActionScript/text/audio custody does not establish authoritative original runtime, visual fidelity, audio acceptance, human or Owner acceptance.',
      'The exact final354 registry milestone remains unchanged at 354 pages and ALG001 L11 remains 21/44 registered.',
    ]), acceptanceEffects: FALSE_EFFECTS});
}

export async function auditG678AlgL11Advanced3TrancheD({check = false} = {}) {
  const artifact = await expectedArtifact();
  let bytes;
  if (check) {
    const current = await stableFile(OUTPUT, {json: true, readOnly: true});
    bytes = current.buffer;
    const expected = stableBytes({...artifact,
      generatedAt: current.value.generatedAt});
    invariant(bytes.equals(expected), 'advanced3 tranche-d audit drifted');
  } else {
    const target = projectPath(OUTPUT);
    try {
      await lstat(target);
      throw new Error(`${OUTPUT} already exists; artifact is create-exclusive`);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    bytes = stableBytes(artifact);
    await writeFile(target, bytes, {flag: 'wx', mode: 0o444});
    await chmod(target, 0o444);
  }
  return Object.freeze({check, output: OUTPUT, bytes: bytes.length,
    sha256: sha256(bytes), exactPlacementCount: 3,
    auditP0Count: 0, auditP1Count: 0, auditP2Count: 3,
    maintainedCandidateImplementationAuthorizedByThisAudit: true,
    registrationCandidatePlacementCount: 0,
    productCalibrationPassed: false,
    acceptanceEffects: FALSE_EFFECTS});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 &&
    (args.length === 0 || args[0] === '--check'),
  `usage: ${path.basename(SCRIPT_PATH)} [--check]`);
  auditG678AlgL11Advanced3TrancheD({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
