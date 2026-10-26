#!/usr/bin/env node

import {spawn} from 'node:child_process';
import {createHash, randomUUID} from 'node:crypto';
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

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SOURCE_ENV = 'HELP_MATH_G678_SOURCE_ROOT';
const RESIDUAL = 'catalog/g678-alg-l11-residual-routing-audit-v1.json';
const RESIDUAL_SHA256 =
  '3d9f30ca17554b9c3cd0e8c0f51273affad3584eb4795a59359ee68fb783891c';
const TOOLCHAIN = 'catalog/toolchain.json';
const FINAL354 =
  'catalog/product-bridge-calibrations/' +
  'g678-current-js-354-page-product-calibrated-registration-v1.json';
const FINAL354_SHA256 =
  'e10f263fe19a9db3141c23ba2611730eed2e3cf7c495b27aef6e862a8936e850';
const TEST = 'scripts/audit-g678-alg-l11-behavior10-tranche-b.test.mjs';
const OUTPUT = 'catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json';
const RUN_ID = 'g678-alg-l11-behavior10-tranche-b-audit-v1';
const RUN_ROOT = `work/g678-shared-page-factory/${RUN_ID}`;
const LESSON_XML = 'G6-G8-shared/ALG001/L11/index.xml';
const LESSON_XML_SHA256 =
  '329feea5eafa57e0824cbbf03f956c9df2df83c85be81a384f70f34908ab3896';

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

const COMMON_BLOCKERS = Object.freeze([
  'authoritative-original-runtime-natural-trace-not-established',
  'visual-fidelity-and-human-review-not-accepted',
  'source-audio-trigger-sync-replay-and-listening-not-accepted',
]);

function spec(row) {
  const [page, family, section, stem, mainObjectId, mainFrameCount,
    quizFrame, resumeFrame, terminalFrame, rightButtonId, rightInstance,
    visibleOrder, correctLabel, semanticAnswer, helpOpenId, helpCloseId,
    helpPopupId, wrongButtonIds, rightEndpoints, wrongEndpoints,
    guidedHits = [], staleAngleOverlayId = null,
    p029Feedback = false] = row;
  return Object.freeze({
    animationId: `shared-alg001-l11-p${page}`,
    page,
    family,
    section,
    sourceStem: stem,
    mainObjectId,
    mainFrameCount,
    quizFrame,
    resumeFrame,
    terminalFrame,
    rightButtonId,
    rightInstance,
    visibleOrder: Object.freeze(visibleOrder),
    correctLabel,
    semanticAnswer,
    helpOpenId,
    helpCloseId,
    helpPopupId,
    wrongButtonIds: Object.freeze(wrongButtonIds),
    rightEndpoints: Object.freeze(rightEndpoints),
    wrongEndpoints: Object.freeze(wrongEndpoints),
    guidedHits: Object.freeze(guidedHits),
    staleAngleOverlayId,
    p029Feedback,
  });
}

const SPECS = Object.freeze([
  spec(['026', 'l11-tutorial-multi-question-choice', 'TI', 'L11TI02',
    228, 294, 180, 181, 294, 77, 'AnsBtn4',
    ['AnsBtn1', 'AnsBtn3', 'AnsBtn2', 'AnsBtn4'], 'D', 'y ≥ 18',
    46, 87, 45, [75, 76],
    [[112, 27], [129, 28], [143, 32], [164, 33]],
    [[182, 31], [196, 28], [210, 29], [225, 28]]]),
  spec(['027', 'l11-tutorial-multi-question-choice', 'TI', 'L11TI03',
    230, 265, 133, 134, 265, 72, 'AnsBtn3',
    ['AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4'], 'C', '0 < n < 5',
    45, 83, 44, [71, 73],
    [[108, 27], [125, 28], [139, 32], [160, 33]],
    [[178, 31], [191, 28], [205, 29], [220, 28]]]),
  spec(['028', 'l11-tutorial-multi-question-choice', 'TI', 'L11TI04',
    259, 397, 127, 128, 397, 96, 'AnsBtn3',
    ['AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4'], 'C',
    'number-line graph of x > 2: open boundary at 2 and ray to the right',
    37, 106, 36, [95],
    [[131, 27], [148, 28], [162, 32], [183, 33]],
    [[201, 31], [214, 28], [228, 29], [244, 28]]]),
  spec(['029', 'l11-tutorial-multi-question-choice', 'TI', 'L11TI05',
    242, 190, 61, 62, 190, 85, 'AnsBtn2',
    ['AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4'], 'B', '−5 < x < 8',
    57, 95, 56, [83, 84],
    [[120, 27], [137, 28], [151, 32], [172, 33]],
    [[190, 31], [206, 28], [220, 29], [235, 28]], [], null, true]),
  spec(['030', 'l11-tutorial-multi-question-choice', 'TI', 'L11TI06',
    236, 195, 63, 64, 195, 86, 'AnsBtn3',
    ['AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4'], 'C', '|x| < 5',
    56, 97, 55, [85, 87],
    [[122, 27], [139, 28], [153, 32], [174, 33]],
    [[192, 31], [205, 28], [219, 29], [234, 28]]]),
  spec(['031', 'l11-tutorial-multi-question-choice', 'TI', 'L11TI07',
    230, 478, 131, 132, 478, 72, 'AnsBtn3',
    ['AnsBtn1', 'AnsBtn2', 'AnsBtn3', 'AnsBtn4'], 'C', 'x > 5',
    46, 83, 45, [71, 73],
    [[108, 27], [125, 28], [139, 32], [160, 33]],
    [[178, 31], [191, 28], [205, 29], [220, 28]]]),
  spec(['032', 'l11-tutorial-multi-question-choice', 'TI', 'L11TI08',
    220, 239, 128, 129, 239, 71, 'AnsBtn3',
    ['AnsBtn1', 'AnsBtn2', 'AnsBtn4', 'AnsBtn3'], 'D', 'miles ≥ 500',
    45, 81, 44, [70],
    [[106, 27], [123, 28], [137, 32], [158, 33]],
    [[176, 31], [189, 28], [203, 29], [218, 28]]]),
  spec(['040', 'l11-guided-tutorial-choice', 'TS', 'L11TS07',
    351, 829, 812, 813, 829, 300, 'AnsBtn1',
    ['AnsBtn3', 'AnsBtn4', 'AnsBtn1', 'AnsBtn2'], 'C',
    'graph beginning at 4 and continuing toward greater values',
    13, 303, 335, [301],
    [[184, 25], [218, 27], [242, 27], [255, 28]],
    [[114, 70], [269, 31], [280, 29], [298, 28]],
    [[338, 71, 234], [338, 73, 236], [497, 73, 285],
      [629, 71, 235], [753, 71, 234]], 350]),
  spec(['041', 'l11-guided-tutorial-choice', 'TS', 'L11TS08',
    338, 901, 884, 885, 901, 298, 'AnsBtn1',
    ['AnsBtn3', 'AnsBtn4', 'AnsBtn1', 'AnsBtn2'], 'C', 'x < 15',
    13, 301, 322, [299],
    [[182, 25], [216, 27], [240, 27], [253, 28]],
    [[89, 70], [267, 31], [278, 29], [296, 28]],
    [[415, 46, 66], [415, 48, 68], [573, 48, 117],
      [705, 46, 67], [829, 46, 66]], 337]),
  spec(['042', 'l11-guided-tutorial-choice', 'TS', 'L11TS09',
    303, 999, 982, 983, 999, 271, 'AnsBtn1',
    ['AnsBtn3', 'AnsBtn4', 'AnsBtn1', 'AnsBtn2'], 'C',
    '500 < v < 550', 13, 274, 287, [272],
    [[198, 25], [232, 27], [256, 27], [269, 28]],
    [[90, 70], [137, 31], [148, 29], [166, 28]],
    [[499, 47, 71], [499, 49, 73], [660, 49, 122],
      [793, 47, 72], [917, 47, 71]], 302]),
]);

const EXPECTED_IDS = Object.freeze(SPECS.map((member) => member.animationId));
const LABEL_TEXT_IDS = Object.freeze({
  '026': Object.freeze([62, 68, 15, 73]),
  '027': Object.freeze([60, 63, 15, 68]),
  '028': Object.freeze([62, 85, 15, 92]),
  '029': Object.freeze([72, 75, 15, 82]),
  '030': Object.freeze([71, 78, 15, 84]),
  '031': Object.freeze([56, 60, 15, 68]),
  '032': Object.freeze([60, 63, 15, 68]),
  '040': Object.freeze([33, 56, 60, 64]),
  '041': Object.freeze([32, 36, 39, 42]),
  '042': Object.freeze([32, 36, 39, 42]),
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

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function pathExists(target) {
  return stat(target).then(() => true, () => false);
}

async function stableFile(target, {absolute = false, json = false,
  requireReadOnly = false} = {}) {
  const resolved = absolute ? path.resolve(target) : projectPath(target);
  const [before, canonical] = await Promise.all([
    lstat(resolved, {bigint: true}),
    realpath(resolved),
  ]);
  invariant(canonical === resolved && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (!requireReadOnly || (before.mode & 0o222n) === 0n),
  `${target} must be one canonical ordinary single-link file`);
  const buffer = await readFile(resolved);
  const after = await lstat(resolved, {bigint: true});
  invariant(before.dev === after.dev && before.ino === after.ino &&
    before.size === after.size && before.mtimeNs === after.mtimeNs &&
    before.mode === after.mode && before.nlink === after.nlink,
  `${target} changed during read`);
  return Object.freeze({
    path: absolute ? resolved : target,
    bytes: buffer.length,
    sha256: sha256(buffer),
    buffer,
    identity: Object.freeze({
      device: String(after.dev), inode: String(after.ino),
      mode: Number(after.mode & 0o777n), nlink: Number(after.nlink),
    }),
    ...(json ? {value: JSON.parse(buffer.toString('utf8'))} : {}),
  });
}

function descriptor(binding, pathOverride = binding.path) {
  return Object.freeze({path: pathOverride, bytes: binding.bytes,
    sha256: binding.sha256});
}

async function checkedSourceRoot() {
  const requested = process.env[SOURCE_ENV];
  invariant(typeof requested === 'string' && requested.length > 0,
    `${SOURCE_ENV} is required`);
  const root = path.resolve(requested);
  const shared = path.join(root, 'G6-G8-shared');
  for (const [target, label] of [[root, SOURCE_ENV],
    [shared, `${SOURCE_ENV}/G6-G8-shared`]]) {
    const [canonical, metadata] = await Promise.all([
      realpath(target), lstat(target, {bigint: true}),
    ]);
    invariant(canonical === target && metadata.isDirectory() &&
      !metadata.isSymbolicLink() && (metadata.mode & 0o222n) === 0n,
    `${label} must be one canonical read-only directory`);
  }
  return Object.freeze({root, shared});
}

async function externalFile(source, relativePath, expected) {
  invariant(relativePath.startsWith('G6-G8-shared/'),
    `${relativePath} escapes shared source root`);
  const target = path.join(source.root, relativePath);
  const file = await stableFile(target, {absolute: true, requireReadOnly: true});
  invariant(file.bytes === expected.bytes && file.sha256 === expected.sha256,
    `${relativePath} physical identity drifted`);
  return file;
}

function sanitizedEnvironment() {
  const environment = {...process.env};
  for (const key of CRITICAL_ENVIRONMENT) delete environment[key];
  return environment;
}

async function runCommand(command, args, cwd, redactions = []) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {cwd, env: sanitizedEnvironment(),
      stdio: ['ignore', 'pipe', 'pipe']});
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.once('error', reject);
    child.once('close', (code, signal) => {
      const clean = (chunks) => {
        let text = Buffer.concat(chunks).toString('utf8');
        for (const [actual, replacement] of redactions) {
          text = text.split(actual).join(replacement);
        }
        return Buffer.from(text);
      };
      const out = clean(stdout);
      const err = clean(stderr);
      if (code !== 0 || signal !== null) {
        reject(new Error(`${command} failed code=${code} signal=${signal}: ` +
          `${err.toString('utf8').trim() || out.toString('utf8').trim()}`));
      } else resolve(Object.freeze({stdout: out, stderr: err}));
    });
  });
}

function normalizeScript(text) {
  return text.replace(/\r\n?/gu, '\n');
}

function normalizeText(text) {
  return text.replace(/\r\n?/gu, ' ').replace(/\s+/gu, ' ').trim();
}

async function walkFiles(root, current = root, files = []) {
  const entries = await readdir(current, {withFileTypes: true});
  // This mirrors the frozen residual auditor's checksum ordering exactly.
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const target = path.join(current, entry.name);
    invariant(!entry.isSymbolicLink(), `${target} may not be a symlink`);
    if (entry.isDirectory()) await walkFiles(root, target, files);
    else {
      invariant(entry.isFile(), `${target} must be an ordinary file`);
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
    const current = await stableFile(file, {absolute: true});
    const relative = path.relative(root, file).split(path.sep).join('/');
    values.push(Object.freeze({...descriptor(current, relative),
      text: current.buffer.toString('utf8')}));
    checksumRows.push(`${current.sha256}  ${relative}\n`);
    totalBytes += current.bytes;
  }
  return Object.freeze({fileCount: files.length, totalBytes,
    checksumSetSha256: sha256(Buffer.from(checksumRows.join(''))),
    values: Object.freeze(values)});
}

async function singleGeneratedFile(root, suffix, label) {
  const matches = (await walkFiles(root)).filter((file) =>
    file.endsWith(suffix));
  invariant(matches.length === 1,
    `${label} must contain exactly one ${suffix} file, found ${matches.length}`);
  return stableFile(matches[0], {absolute: true});
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`${name}="([^"]*)"`, 'u'));
  invariant(match, `missing ${name} in ${tag.slice(0, 120)}`);
  return match[1];
}

export function deriveAnswerRowCrosswalk(svgText, expected = {}) {
  const uses = [...svgText.matchAll(/<use\s+[^>]*id="AnsBtn[1-4]"[^>]*\/>/gu)]
    .map((match) => match[0]);
  invariant(uses.length === 4, `answer hit-region count drifted: ${uses.length}`);
  const rows = uses.map((tag) => {
    const transform = attribute(tag, 'transform');
    const matrix = transform.match(/^matrix\(([^)]+)\)$/u);
    invariant(matrix, `answer transform is not a matrix: ${transform}`);
    const values = matrix[1].split(',').map((value) => Number(value.trim()));
    invariant(values.length === 6 && values.every(Number.isFinite),
      `answer transform matrix drifted: ${transform}`);
    return Object.freeze({
      instanceName: attribute(tag, 'id'),
      characterId: Number(attribute(tag, 'ffdec:characterId')),
      transform,
      translateX: values[4],
      translateY: values[5],
      width: Number(attribute(tag, 'width')),
      height: Number(attribute(tag, 'height')),
      xlinkHref: attribute(tag, 'xlink:href'),
    });
  }).sort((left, right) => left.translateY - right.translateY);
  invariant(new Set(rows.map((row) => row.instanceName)).size === 4 &&
    rows.every((row, index) => index === 0 ||
      row.translateY > rows[index - 1].translateY),
  'answer hit regions must have four unique instance names and Y positions');
  const labeled = rows.map((row, index) => Object.freeze({...row,
    visibleLabel: String.fromCharCode(65 + index),
    correct: row.instanceName === expected.rightInstance}));
  invariant(!expected.visibleOrder || exact(labeled.map((row) =>
    row.instanceName), expected.visibleOrder),
  'answer visible row order drifted');
  invariant(!expected.rightInstance || labeled.filter((row) => row.correct)
    .length === 1, 'source-right answer instance missing');
  if (expected.correctLabel) {
    invariant(labeled.find((row) => row.correct)?.visibleLabel ===
      expected.correctLabel, 'source-right answer visible label drifted');
  }
  return Object.freeze(labeled);
}

export function deriveVisibleLabelTextCrosswalk(svgText, labelTextIds,
  exportedTextById, answerRows) {
  invariant(Array.isArray(labelTextIds) && labelTextIds.length === 4 &&
    new Set(labelTextIds).size === 4 && answerRows.length === 4,
  'visible answer label authority must contain four unique text IDs and rows');
  const frameUses = svgText.slice(0, svgText.indexOf('<defs>'));
  const labels = labelTextIds.map((characterId, index) => {
    const matches = [...frameUses.matchAll(new RegExp(
      `<use\\s+[^>]*ffdec:characterId="${characterId}"[^>]*/>`, 'gu'))]
      .map((match) => match[0]);
    invariant(matches.length === 1,
      `visible label text ${characterId} occurrence drifted: ${matches.length}`);
    const transform = attribute(matches[0], 'transform');
    const matrix = transform.match(/^matrix\(([^)]+)\)$/u);
    const values = matrix?.[1].split(',').map((value) => Number(value.trim()));
    invariant(values?.length === 6 && values.every(Number.isFinite),
      `visible label text ${characterId} transform drifted`);
    const visibleLabel = String.fromCharCode(65 + index);
    const sourceText = exportedTextById.get(characterId)?.normalized;
    invariant(sourceText === visibleLabel,
      `visible label text ${characterId} is not ${visibleLabel}`);
    return Object.freeze({visibleLabel, characterId, sourceText, transform,
      translateX: values[4], translateY: values[5]});
  });
  invariant(labels.every((row, index) => index === 0 ||
    row.translateY > labels[index - 1].translateY),
  'visible A-D text order drifted');
  return Object.freeze(labels.map((label, index) => {
    const answer = answerRows[index];
    const verticalDistance = Math.abs(label.translateY - answer.translateY);
    invariant(label.visibleLabel === answer.visibleLabel &&
      verticalDistance <= 20,
    `visible ${label.visibleLabel} label/hit-region geometry drifted`);
    return Object.freeze({...label,
      linkedAnswerInstanceName: answer.instanceName,
      linkedAnswerCharacterId: answer.characterId,
      verticalDistance,
    });
  }));
}

export function deriveCaseSensitivePopupCrosswalk(svgText,
  {helpPopupId, staleAngleOverlayId = null} = {}) {
  const tags = [...svgText.matchAll(/<use\s+[^>]*id="Mc_Pop(?:up|Up)"[^>]*\/>/gu)]
    .map((match) => match[0]);
  const rows = tags.map((tag) => Object.freeze({
    instanceName: attribute(tag, 'id'),
    characterId: Number(attribute(tag, 'ffdec:characterId')),
    transform: attribute(tag, 'transform'),
    xlinkHref: attribute(tag, 'xlink:href'),
  }));
  invariant(rows.filter((row) => row.instanceName === 'Mc_Popup').length === 1,
    'source help Mc_Popup instance drifted');
  invariant(rows.find((row) => row.instanceName === 'Mc_Popup')
    ?.characterId === helpPopupId, 'source help popup character drifted');
  if (staleAngleOverlayId === null) {
    invariant(!rows.some((row) => row.instanceName === 'Mc_PopUp'),
      'unexpected case-sensitive stale overlay appeared');
  } else {
    invariant(rows.filter((row) => row.instanceName === 'Mc_PopUp').length ===
      1 && rows.find((row) => row.instanceName === 'Mc_PopUp')?.characterId ===
      staleAngleOverlayId, 'case-sensitive stale angle overlay drifted');
  }
  return Object.freeze(rows);
}

function extractDefineSpriteBlock(xmlText, spriteId) {
  const marker = `<item type="DefineSpriteTag"`;
  let start = -1;
  for (let cursor = xmlText.indexOf(marker); cursor >= 0;
    cursor = xmlText.indexOf(marker, cursor + marker.length)) {
    const end = xmlText.indexOf('>', cursor);
    const tag = xmlText.slice(cursor, end + 1);
    if (Number(attribute(tag, 'spriteId')) === spriteId) {
      start = cursor;
      break;
    }
  }
  invariant(start >= 0, `DefineSprite ${spriteId} missing from FFDec XML`);
  const token = /<item(?:\s[^>]*)?\/?>|<\/item>/gu;
  token.lastIndex = start;
  let depth = 0;
  for (let match = token.exec(xmlText); match; match = token.exec(xmlText)) {
    if (match[0].startsWith('</')) depth -= 1;
    else if (!match[0].endsWith('/>')) depth += 1;
    if (depth === 0) return xmlText.slice(start, token.lastIndex);
  }
  throw new Error(`DefineSprite ${spriteId} XML block is unterminated`);
}

export function deriveP029FeedbackSequence({wrongButtonScript,
  popupScript, baseText, tryText, wrongEndpointScript}) {
  const wrong = normalizeScript(wrongButtonScript);
  const popup = normalizeScript(popupScript);
  const endpoint = normalizeScript(wrongEndpointScript);
  invariant(wrong.includes('_global.quizTryCount++;') &&
    wrong.indexOf('_global.quizTryCount++;') <
      wrong.indexOf('Mc_Wrong_Feed4.gotoAndPlay(2);'),
  'p029 wrong button increment timing drifted');
  invariant(popup.includes('if(_global.quizTryCount == 1)') &&
    popup.includes('Try._visible = true;') &&
    popup.includes('Try._visible = false;'),
  'p029 Try visibility script drifted');
  invariant(endpoint.includes('if(_global.quizTryCount >= 2)') &&
    endpoint.includes('_global.quizTryCount = 0;') &&
    endpoint.includes('_global.quizSection = false;') &&
    endpoint.includes('_parent.play();') &&
    !endpoint.includes('_global.quizTryCount++;'),
  'p029 wrong endpoint timing drifted');
  const base = normalizeText(baseText);
  const suffix = normalizeText(tryText);
  invariant(base ===
      'Find the inequality that has x greater than 5 and less than 8.' &&
    suffix === 'Try again.', 'p029 feedback text drifted');
  return Object.freeze({
    incrementLocation: 'wrong-answer-button-before-feedback-playback',
    firstWrong: Object.freeze({quizTryCountDuringPopup: 1,
      visibleText: `${base} ${suffix}`}),
    secondWrong: Object.freeze({quizTryCountDuringPopup: 2,
      visibleText: base, autoResumeAfterFeedback: true,
      resetQuizTryCountTo: 0}),
  });
}

function scriptMap(inventoryValue) {
  return new Map(inventoryValue.values.map((row) => [row.path,
    Object.freeze({...row, normalized: normalizeScript(row.text)})]));
}

function textMap(inventoryValue) {
  return new Map(inventoryValue.values.map((row) => [
    Number(path.basename(row.path, '.txt').match(/^(\d+)/u)?.[1]),
    Object.freeze({...row, normalized: normalizeText(row.text)}),
  ]));
}

function validateTiScripts(specification, scripts) {
  const prefix = `DefineSprite_${specification.mainObjectId}`;
  const init = scripts.get(`${prefix}/frame_${specification.quizFrame}/DoAction.as`);
  const resume = scripts.get(
    `${prefix}/frame_${specification.resumeFrame}/DoAction.as`);
  const terminal = scripts.get(
    `${prefix}/frame_${specification.terminalFrame}/DoAction.as`);
  invariant(init?.normalized ===
      'stop();\n_global.quizSection = true;\n_global.quizTryCount = 0;\n' +
      'Mc_Popup._visible = false;\nCloseBtn._visible = false;\n' &&
    resume?.normalized === '_global.quizSection = false;\n' &&
    terminal?.normalized === 'stop();\n',
  `${specification.animationId} quiz frame state drifted`);
  const rightPath = `DefineButton2_${specification.rightButtonId}/` +
    'BUTTONCONDACTION on(release).as';
  const right = scripts.get(rightPath);
  invariant(right?.normalized.includes('_root.disableQuizButton();') &&
    right.normalized.includes('Mc_Right_Feed4.gotoAndPlay(2);') &&
    right.normalized.includes('NMHBtn.enabled = false;'),
  `${specification.animationId} right answer action drifted`);
  const wrong = specification.wrongButtonIds.map((buttonId) => {
    const row = scripts.get(`DefineButton2_${buttonId}/` +
      'BUTTONCONDACTION on(release).as');
    invariant(row?.normalized.includes('_root.disableQuizButton();') &&
      row.normalized.includes('Mc_Wrong_Feed4.gotoAndPlay(2);') &&
      row.normalized.includes('NMHBtn.enabled = false;'),
    `${specification.animationId} wrong answer ${buttonId} drifted`);
    return row;
  });
  const open = scripts.get(`DefineButton2_${specification.helpOpenId}/` +
    'BUTTONCONDACTION on(release).as');
  const close = scripts.get(`DefineButton2_${specification.helpCloseId}/` +
    'BUTTONCONDACTION on(release).as');
  invariant(open?.normalized.includes('NMHBtn.enabled = false;') &&
    open.normalized.includes('_root.disableQuizButton();') &&
    open.normalized.includes('Mc_Popup._visible = true;') &&
    open.normalized.includes('CloseBtn._visible = true;') &&
    close?.normalized.includes('NMHBtn.enabled = true;') &&
    close.normalized.includes('_root.enableQuizButton();') &&
    close.normalized.includes('Mc_Popup._visible = false;') &&
    close.normalized.includes('CloseBtn._visible = false;'),
  `${specification.animationId} help open/close drifted`);
  return Object.freeze({init, resume, terminal, right,
    wrong: Object.freeze(wrong), open, close});
}

function validateTsScripts(specification, scripts) {
  const prefix = `DefineSprite_${specification.mainObjectId}`;
  const init = scripts.get(`${prefix}/frame_${specification.quizFrame}/DoAction.as`);
  const resume = scripts.get(
    `${prefix}/frame_${specification.resumeFrame}/DoAction.as`);
  const terminal = scripts.get(
    `${prefix}/frame_${specification.terminalFrame}/DoAction.as`);
  invariant(init?.normalized ===
      'stop();\n_global.quizSection = true;\n_global.quizTryCount = 0;\n' +
      'Mc_Popup._visible = false;\n' &&
    resume?.normalized === '_global.quizSection = false;\n' &&
    terminal?.normalized === 'stop();\n',
  `${specification.animationId} final quiz frame state drifted`);
  const right = scripts.get(`DefineButton2_${specification.rightButtonId}/` +
    'BUTTONCONDACTION on(release).as');
  const wrong = scripts.get(`DefineButton2_${specification.wrongButtonIds[0]}/` +
    'BUTTONCONDACTION on(release).as');
  const open = scripts.get(`DefineButton2_${specification.helpOpenId}/` +
    'BUTTONCONDACTION on(release).as');
  const close = scripts.get(`DefineButton2_${specification.helpCloseId}/` +
    'BUTTONCONDACTION on(release).as');
  invariant(right?.normalized.includes('_root.showRightFeed();') &&
    wrong?.normalized.includes('_root.showWrongFeed();') &&
    open?.normalized.includes('Mc_Popup._visible = true;') &&
    close?.normalized.includes('this._visible = false;') &&
    close.normalized.includes('_root.enableQuizButton();') &&
    close.normalized.includes('_parent.NMHBtn.enabled = true;'),
  `${specification.animationId} final answer/help actions drifted`);
  const guided = specification.guidedHits.map(([frame, objectId, depth]) => {
    const sourcePath = `${prefix}/frame_${frame}/` +
      `PlaceObject2_${objectId}_${depth}/CLIPACTIONRECORD on(release).as`;
    const row = scripts.get(sourcePath);
    invariant(row?.normalized ===
      'on(release){\n   _global.quizSection = false;\n   _parent.play();\n}\n',
    `${specification.animationId} guided release ${frame}/${objectId}/${depth} drifted`);
    return Object.freeze({frame, objectId, depth, script: descriptor(row)});
  });
  const mainScriptText = [...scripts.values()].filter((row) =>
    row.path.startsWith(`${prefix}/frame_`)).map((row) => row.normalized)
    .join('\n');
  invariant(!mainScriptText.includes('Mc_PopUp'),
    `${specification.animationId} stale overlay unexpectedly gained AS control`);
  return Object.freeze({init, resume, terminal, right,
    wrong: Object.freeze([wrong]), open, close, guided: Object.freeze(guided)});
}

function validateFeedbackEndpoints(specification, scripts) {
  const classify = (endpoints, wrong) => endpoints.map(([spriteId, frame]) => {
    const sourcePath = `DefineSprite_${spriteId}/frame_${frame}/DoAction.as`;
    const row = scripts.get(sourcePath);
    invariant(row?.normalized.includes('stop();') &&
      row.normalized.includes('_parent.play();') &&
      row.normalized.includes('_global.quizSection = false;') &&
      (wrong
        ? row.normalized.includes('if(_global.quizTryCount >= 2)')
        : row.normalized.includes('_root.disableQuizButton();')),
    `${specification.animationId} ${wrong ? 'wrong' : 'right'} feedback endpoint drifted`);
    if (wrong && specification.p029Feedback) {
      invariant(!row.normalized.includes('_global.quizTryCount++;'),
        `${specification.animationId} p029 endpoint increment reappeared`);
    } else if (wrong) {
      invariant(row.normalized.includes('_global.quizTryCount++;'),
        `${specification.animationId} wrong endpoint increment missing`);
    }
    return Object.freeze({spriteId, frame, script: descriptor(row)});
  });
  return Object.freeze({
    right: Object.freeze(classify(specification.rightEndpoints, false)),
    wrong: Object.freeze(classify(specification.wrongEndpoints, true)),
  });
}

async function writeCommandEvidence(memberRoot, name, command, args,
  sourcePath, sourceRoot, stageRoot) {
  const result = await runCommand(command, args, memberRoot, [
    [sourceRoot, '<canonical-read-only-source-root>'],
    [stageRoot, '<staging-root>'],
  ]);
  invariant(result.stderr.length === 0,
    `${name} emitted stderr: ${result.stderr.toString('utf8').trim()}`);
  const canonicalStdout = Buffer.from(result.stdout.toString('utf8')
    .replace(/\b\d{2}:\d{2}\.\d{3}\b/gu, '<duration>')
    .split('\n').filter((line) => line.length > 0)
    .sort(compareText).join('\n') + '\n');
  await Promise.all([
    writeFile(path.join(memberRoot, `${name}.stdout`), canonicalStdout,
      {flag: 'wx'}),
    writeFile(path.join(memberRoot, `${name}.stderr`), result.stderr,
      {flag: 'wx'}),
  ]);
  return Object.freeze({command, args: Object.freeze(args.map((value) =>
    value === sourcePath ? '<canonical-read-only-source>' :
      value.startsWith(stageRoot) ? value.replace(stageRoot, '<staging-root>') :
        value))});
}

async function prepareMember(specification, residualMember, source,
  stageRoot) {
  const memberRoot = path.join(stageRoot, specification.animationId);
  await mkdir(memberRoot, {recursive: false});
  const sourceFile = await externalFile(source, residualMember.source.path,
    residualMember.source);
  const audio = residualMember.audioLane.candidates[0];
  invariant(residualMember.audioLane.catalogCandidateCount === 1 &&
    audio.acceptance === 'candidate-index-only' && audio.required === null,
  `${specification.animationId} audio candidate contract drifted`);
  const audioFile = await externalFile(source, audio.path, audio);
  const ffdecXml = path.join(memberRoot, 'ffdec-source.xml');
  const exportRoot = path.join(memberRoot, 'ffdec-export');
  const mainSvgRoot = path.join(memberRoot, 'main-frame-svg');
  const helpSvgRoot = path.join(memberRoot, 'help-popup-svg');
  const sourcePath = sourceFile.path;
  const commands = [];
  commands.push(await writeCommandEvidence(memberRoot, 'ffdec-swf2xml',
    'ffdec', ['-onerror', 'abort', '-timeout', '120', '-swf2xml',
      sourcePath, ffdecXml], sourcePath, source.root, stageRoot));
  commands.push(await writeCommandEvidence(memberRoot, 'ffdec-script-text',
    'ffdec', ['-onerror', 'abort', '-timeout', '120', '-exportTimeout', '600',
      '-format', 'script:as,text:plain', '-export', 'script,text', exportRoot,
      sourcePath], sourcePath, source.root, stageRoot));
  commands.push(await writeCommandEvidence(memberRoot, 'ffdec-main-frame-svg',
    'ffdec', ['-onerror', 'abort', '-timeout', '120', '-exportTimeout', '600',
      '-format', 'sprite:svg', '-select',
      `${specification.mainObjectId}:${specification.quizFrame}`,
      '-selectid', String(specification.mainObjectId), '-export', 'sprite',
      mainSvgRoot, sourcePath], sourcePath, source.root, stageRoot));
  commands.push(await writeCommandEvidence(memberRoot, 'ffdec-help-popup-svg',
    'ffdec', ['-onerror', 'abort', '-timeout', '120', '-exportTimeout', '600',
      '-format', 'sprite:svg', '-select', `${specification.helpPopupId}:1`,
      '-selectid', String(specification.helpPopupId), '-export', 'sprite',
      helpSvgRoot, sourcePath], sourcePath, source.root, stageRoot));
  let angleSvgRoot = null;
  if (specification.staleAngleOverlayId !== null) {
    angleSvgRoot = path.join(memberRoot, 'stale-angle-overlay-svg');
    commands.push(await writeCommandEvidence(memberRoot,
      'ffdec-stale-angle-overlay-svg', 'ffdec', ['-onerror', 'abort',
        '-timeout', '120', '-exportTimeout', '600', '-format', 'sprite:svg',
        '-select', `${specification.staleAngleOverlayId}:1`, '-selectid',
        String(specification.staleAngleOverlayId), '-export', 'sprite',
        angleSvgRoot, sourcePath], sourcePath, source.root, stageRoot));
  }

  const [xml, scriptsInventory, textsInventory, mainSvg, helpSvg,
    angleSvg] = await Promise.all([
    stableFile(ffdecXml, {absolute: true}),
    inventory(path.join(exportRoot, 'scripts'), '.as'),
    inventory(path.join(exportRoot, 'texts'), '.txt'),
    singleGeneratedFile(mainSvgRoot, '.svg',
      `${specification.animationId} main frame SVG`),
    singleGeneratedFile(helpSvgRoot, '.svg',
      `${specification.animationId} help popup SVG`),
    angleSvgRoot ? singleGeneratedFile(angleSvgRoot, '.svg',
      `${specification.animationId} stale angle overlay SVG`) : null,
  ]);
  invariant(scriptsInventory.fileCount ===
      residualMember.structuralSignals.scriptFileCount &&
    scriptsInventory.checksumSetSha256 ===
      residualMember.structuralSignals.scriptChecksumSetSha256 &&
    textsInventory.fileCount === residualMember.structuralSignals.textFileCount &&
    textsInventory.checksumSetSha256 ===
      residualMember.structuralSignals.textChecksumSetSha256,
  `${specification.animationId} fresh FFDec script/text set drifted`);
  const xmlText = xml.buffer.toString('utf8');
  invariant(xmlText.includes('_generator="JPEXS Free Flash Decompiler v.26.2.1"') &&
    xmlText.includes('frameCount="10"') && xmlText.includes('frameRate="12.0"') &&
    xmlText.includes('hasEndTag="true"') &&
    xmlText.includes(`type="DefineSpriteTag"`) &&
    xmlText.includes(`spriteId="${specification.mainObjectId}"`),
  `${specification.animationId} FFDec binary/tag closure drifted`);
  for (const buttonId of new Set([specification.rightButtonId,
    ...specification.wrongButtonIds])) {
    invariant(xmlText.includes(
      `type="DefineButton2Tag" buttonId="${buttonId}"`),
    `${specification.animationId} answer button ${buttonId} missing in FFDec XML`);
  }
  const scripts = scriptMap(scriptsInventory);
  const texts = textMap(textsInventory);
  const state = specification.section === 'TI'
    ? validateTiScripts(specification, scripts)
    : validateTsScripts(specification, scripts);
  const feedback = validateFeedbackEndpoints(specification, scripts);
  const answerRows = deriveAnswerRowCrosswalk(mainSvg.buffer.toString('utf8'),
    specification);
  const visibleLabelTexts = deriveVisibleLabelTextCrosswalk(
    mainSvg.buffer.toString('utf8'), LABEL_TEXT_IDS[specification.page],
    texts, answerRows);
  const popupInstances = deriveCaseSensitivePopupCrosswalk(
    mainSvg.buffer.toString('utf8'), specification);
  const correct = answerRows.find((row) => row.correct);
  invariant(correct?.characterId === specification.rightButtonId,
    `${specification.animationId} source-right character geometry drifted`);
  const helpBlock = extractDefineSpriteBlock(xmlText,
    specification.helpPopupId);
  invariant(!helpBlock.includes(
    `characterId="${specification.staleAngleOverlayId}"`),
  `${specification.animationId} stale angle overlay entered source help popup`);

  let p029 = null;
  if (specification.p029Feedback) {
    const sprite202 = extractDefineSpriteBlock(xmlText, 202);
    const sprite203 = extractDefineSpriteBlock(xmlText, 203);
    const sprite206 = extractDefineSpriteBlock(xmlText, 206);
    invariant(sprite202.includes('characterId="201"') &&
      sprite203.includes('characterId="200"') &&
      sprite203.includes('characterId="202"') && sprite203.includes('name="Try"') &&
      sprite206.includes('characterId="203"') &&
      sprite206.includes('name="Mc_Feed_Popup"'),
    'p029 feedback object/text placement chain drifted');
    p029 = deriveP029FeedbackSequence({
      wrongButtonScript: state.wrong[0].text,
      popupScript: scripts.get('DefineSprite_203/frame_1/DoAction.as')?.text,
      baseText: texts.get(200)?.text,
      tryText: texts.get(201)?.text,
      wrongEndpointScript: scripts.get(
        'DefineSprite_206/frame_28/DoAction.as')?.text,
    });
  }

  const rel = (target) => path.relative(stageRoot, target)
    .split(path.sep).join('/');
  const blockers = [...COMMON_BLOCKERS];
  let staleOverlay = null;
  if (specification.staleAngleOverlayId !== null) {
    const angleBlock = extractDefineSpriteBlock(xmlText,
      specification.staleAngleOverlayId);
    invariant(angleBlock.includes(
      `spriteId="${specification.staleAngleOverlayId}"`) && angleSvg,
    `${specification.animationId} stale angle overlay evidence missing`);
    blockers.unshift(
      'case-sensitive-stale-angle-overlay-original-runtime-disposition-unresolved');
    staleOverlay = Object.freeze({
      instanceName: 'Mc_PopUp',
      characterId: specification.staleAngleOverlayId,
      placedAtFinalQuizFrame: specification.quizFrame,
      controlledByExtractedActionScript: false,
      distinctFromSourceHelpInstance: true,
      sourceStaticVisibility: 'present-without-local-hide-script',
      originalRuntimeDispositionEstablished: false,
      sourceDivergenceDecisionEstablished: false,
      frameSvg: descriptor(angleSvg, rel(angleSvg.path)),
      p1Blocker:
        'case-sensitive-stale-angle-overlay-original-runtime-disposition-unresolved',
    });
  }
  const stateDescriptor = (row) => descriptor(row,
    `${specification.animationId}/${row.path}`);
  const commandReceipt = stableBytes({
    schemaVersion: 1,
    animationId: specification.animationId,
    source: descriptor(sourceFile, residualMember.source.path),
    commands,
    ffdec: {version: '26.2.1', onError: 'abort', retry: false},
    acceptanceEffects: FALSE_EFFECTS,
  });
  const commandPath = path.join(memberRoot, 'command-receipt.json');
  await writeFile(commandPath, commandReceipt, {flag: 'wx'});
  const commandBinding = await stableFile(commandPath, {absolute: true});

  return Object.freeze({
    animationId: specification.animationId,
    familyId: specification.family,
    implementationLane: residualMember.routing.implementationLane,
    reuseStatus: residualMember.routing.reuseStatus,
    reuseAuthorized: false,
    source: Object.freeze({...descriptor(sourceFile, residualMember.source.path),
      physicalReadOnlyIdentityVerified: true}),
    audioCandidate: Object.freeze({...descriptor(audioFile, audio.path),
      status: 'candidate-index-only', required: null,
      triggerEstablished: false, replayEstablished: false, accepted: false}),
    freshFfdecBinaryClosure: Object.freeze({
      tool: 'JPEXS Free Flash Decompiler', version: '26.2.1',
      sourceOpenedFromCanonicalReadOnlyBinary: true,
      swfEndTagPresent: true,
      swfRootFrameCount: 10,
      swfFrameRate: 12,
      swfXml: descriptor(xml, rel(xml.path)),
      scripts: Object.freeze({fileCount: scriptsInventory.fileCount,
        totalBytes: scriptsInventory.totalBytes,
        checksumSetSha256: scriptsInventory.checksumSetSha256}),
      texts: Object.freeze({fileCount: textsInventory.fileCount,
        totalBytes: textsInventory.totalBytes,
        checksumSetSha256: textsInventory.checksumSetSha256}),
      residualSwfmillWarningsPreserved:
        residualMember.diagnosticEvidence.swfmillWarnings,
      swfmillWarningsUsedAsSoleAuthority: false,
      independentFfdecTagAndExportClosurePassed: true,
      commandReceipt: descriptor(commandBinding, rel(commandBinding.path)),
    }),
    sourceStateMachine: Object.freeze({
      mainObjectId: specification.mainObjectId,
      frameCount: specification.mainFrameCount,
      quizFrame: specification.quizFrame,
      resumeFrame: specification.resumeFrame,
      terminalFrame: specification.terminalFrame,
      initScript: stateDescriptor(state.init),
      resumeScript: stateDescriptor(state.resume),
      terminalScript: stateDescriptor(state.terminal),
      guidedHits: state.guided ?? Object.freeze([]),
      feedbackEndpoints: feedback,
      p029FeedbackSequence: p029,
    }),
    answerVisibleGeometryCrosswalk: Object.freeze({
      sourceFrame: specification.quizFrame,
      frameSvg: descriptor(mainSvg, rel(mainSvg.path)),
      frameSvgBindsExactTextVectorAndHitGeometry: true,
      hitRegionProjectionSha256: sha256(stableBytes(answerRows)),
      visibleLabelTextProjectionSha256:
        sha256(stableBytes(visibleLabelTexts)),
      visibleLabelTexts,
      rows: answerRows,
      correct: Object.freeze({
        sourceRightButtonId: specification.rightButtonId,
        sourceInstanceName: specification.rightInstance,
        visibleLabel: specification.correctLabel,
        semanticAnswer: specification.semanticAnswer,
      }),
      sourceRightAction: stateDescriptor(state.right),
      sourceWrongActions: Object.freeze(state.wrong.map(stateDescriptor)),
      tsAnsBtn1SemanticCConflictResolved:
        specification.section === 'TS' ? correct.visibleLabel === 'C' : null,
      specialGeometryConclusion: specification.page === '028'
        ? Object.freeze({kind: 'number-line-graph', inequality: 'x > 2',
          boundary: 2, boundaryClosed: false, rayDirection: 'right',
          exactGeometryBoundByFrameSvg: true})
        : specification.page === '030'
          ? Object.freeze({kind: 'absolute-value-inequality',
            expression: '|x| < 5', operator: '<', absoluteValueBars: 2,
            exactGlyphGeometryBoundByFrameAndHelpSvg: true})
          : null,
    }),
    helpPopup: Object.freeze({
      sourceInstanceName: 'Mc_Popup',
      characterId: specification.helpPopupId,
      mainFrameInstance: popupInstances.find((row) =>
        row.instanceName === 'Mc_Popup'),
      frameSvg: descriptor(helpSvg, rel(helpSvg.path)),
      openButtonId: specification.helpOpenId,
      closeButtonId: specification.helpCloseId,
      openScript: stateDescriptor(state.open),
      closeScript: stateDescriptor(state.close),
      sourceHelpContentBoundByExactSvg: true,
      staleAngleOverlay: staleOverlay,
    }),
    sourceAuditPassed: true,
    registrationCandidate: false,
    productCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false,
    p1Blockers: Object.freeze(blockers),
    acceptanceEffects: FALSE_EFFECTS,
  });
}

async function freezeTree(current) {
  const entries = await readdir(current, {withFileTypes: true});
  for (const entry of entries) {
    const target = path.join(current, entry.name);
    invariant(!entry.isSymbolicLink(), `${target} may not be a symlink`);
    if (entry.isDirectory()) await freezeTree(target);
    else {
      invariant(entry.isFile(), `${target} must be an ordinary file`);
      await chmod(target, 0o444);
    }
  }
  await chmod(current, 0o555);
}

async function thawTree(current) {
  await chmod(current, 0o755);
  for (const entry of await readdir(current, {withFileTypes: true})) {
    if (entry.isDirectory()) await thawTree(path.join(current, entry.name));
  }
}

async function frozenTreeInventory(root) {
  const files = [];
  const visit = async (current) => {
    const metadata = await lstat(current, {bigint: true});
    invariant(metadata.isDirectory() && !metadata.isSymbolicLink() &&
      Number(metadata.mode & 0o777n) === 0o555,
    `${current} must be one frozen 0555 directory`);
    const entries = await readdir(current, {withFileTypes: true});
    entries.sort((left, right) => compareText(left.name, right.name));
    for (const entry of entries) {
      const target = path.join(current, entry.name);
      invariant(!entry.isSymbolicLink(), `${target} may not be a symlink`);
      if (entry.isDirectory()) await visit(target);
      else {
        const metadataFile = await lstat(target, {bigint: true});
        invariant(metadataFile.isFile() && metadataFile.nlink === 1n &&
          Number(metadataFile.mode & 0o777n) === 0o444,
        `${target} must be one frozen 0444 single-link file`);
        const binding = await stableFile(target, {absolute: true,
          requireReadOnly: true});
        files.push(Object.freeze({
          path: path.relative(root, target).split(path.sep).join('/'),
          bytes: binding.bytes, sha256: binding.sha256,
        }));
      }
    }
  };
  await visit(root);
  return Object.freeze(files);
}

async function ordinaryTreeInventory(root) {
  const files = await walkFiles(root);
  const rows = [];
  for (const target of files) {
    const binding = await stableFile(target, {absolute: true});
    rows.push(Object.freeze({
      path: path.relative(root, target).split(path.sep).join('/'),
      bytes: binding.bytes, sha256: binding.sha256,
    }));
  }
  return Object.freeze(rows);
}

async function expectedArtifacts(stageRoot) {
  const [residual, final354, toolchain, builder, test, source] =
    await Promise.all([
    stableFile(RESIDUAL, {json: true, requireReadOnly: true}),
    stableFile(FINAL354, {json: true}),
    stableFile(TOOLCHAIN, {json: true}),
    stableFile(path.relative(ROOT, SCRIPT_PATH)),
    stableFile(TEST),
    checkedSourceRoot(),
    ]);
  invariant(residual.sha256 === RESIDUAL_SHA256 &&
    residual.value.artifactType === 'g678-alg-l11-residual-routing-audit-v1' &&
    residual.value.status === 'exact-35-source-script-text-routed-no-registration',
  'canonical residual audit authority drifted');
  invariant(toolchain.value.flashForensics?.ffdec?.version === '26.2.1' &&
    toolchain.value.flashForensics.ffdec.releaseAssetSha256 ===
      'a160249e037115b935db253e993a6c00694f5d89bc4808c379e9a08a4034795c',
  'FFDec toolchain authority drifted');
  const final354Ids = final354.value.selectedPages?.map((page) =>
    page.animationId) ?? [];
  invariant(final354.sha256 === FINAL354_SHA256 &&
    final354.value.status ===
      'private-current-js-product-host-calibrated-candidates-registered' &&
    final354Ids.length === 354 && new Set(final354Ids).size === 354 &&
    final354Ids.filter((animationId) =>
      animationId.startsWith('shared-alg001-l11-p')).length === 21 &&
    EXPECTED_IDS.every((animationId) => !final354Ids.includes(animationId)) &&
    final354.value.productCalibrationPassed === false &&
    Object.values(final354.value.acceptanceEffects).every((value) =>
      value === false),
  'final354 predecessor or behavior10 absence boundary drifted');
  const lessonXml = await stableFile(path.join(source.root, LESSON_XML),
    {absolute: true, requireReadOnly: true});
  invariant(lessonXml.sha256 === LESSON_XML_SHA256 && lessonXml.bytes === 10280,
    'external lesson XML physical identity drifted');
  const residualMap = new Map(residual.value.members.map((member) =>
    [member.animationId, member]));
  const selected = SPECS.map((specification) => {
    const member = residualMap.get(specification.animationId);
    invariant(member?.routing.familyId === specification.family &&
      member.source.path ===
        `G6-G8-shared/ALG001/L11/${specification.section}/` +
          `${specification.sourceStem}.swf` &&
      member.registrationCandidate === false &&
      member.productCalibrationPassed === false &&
      Object.values(member.acceptanceEffects).every((value) => value === false),
    `${specification.animationId} residual member authority drifted`);
    return Object.freeze({specification, member});
  });
  invariant(exact(selected.map((row) => row.specification.animationId),
    EXPECTED_IDS), 'behavior10 exact member order drifted');

  const members = [];
  for (const row of selected) {
    members.push(await prepareMember(row.specification, row.member,
      source, stageRoot));
  }
  const inputBindings = Object.freeze({
    residualRoutingAudit: descriptor(residual),
    predecessorFinal354: descriptor(final354),
    sourceLessonXml: Object.freeze({...descriptor(lessonXml, LESSON_XML),
      externalAbsolutePath: lessonXml.path,
      physicalReadOnlyIdentityVerified: true}),
    toolchain: descriptor(toolchain),
    builder: descriptor(builder),
    focusedTest: descriptor(test),
  });
  const evidenceInventory = await ordinaryTreeInventory(stageRoot);
  const inventoryBytes = stableBytes(evidenceInventory);
  await writeFile(path.join(stageRoot, 'evidence-inventory.json'),
    inventoryBytes, {flag: 'wx'});
  const run = Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-alg-l11-behavior10-tranche-b-audit-run-v1',
    runId: RUN_ID,
    status: 'complete-exact-10-fresh-ffdec-binary-script-text-svg-audit',
    inputs: inputBindings,
    auditedPlacementCount: 10,
    tutorialChoiceCount: 7,
    guidedTutorialChoiceCount: 3,
    freshFfdecBinaryClosureCount: 10,
    answerVisibleGeometryCrosswalkCount: 10,
    tsAnsBtn1SemanticCResolvedCount: 3,
    p029FeedbackOrderingResolvedCount: 1,
    staleAngleOverlayUnresolvedCount: 3,
    registrationCandidatePlacementCount: 0,
    productCalibrationPassed: false,
    scaleOutAuthorized: false,
    acceptanceEffects: FALSE_EFFECTS,
    evidenceInventory: Object.freeze({
      path: `${RUN_ROOT}/evidence-inventory.json`,
      bytes: inventoryBytes.length,
      sha256: sha256(inventoryBytes),
      fileCountBeforeInventoryAndManifest: evidenceInventory.length,
    }),
    members,
  });
  const runBytes = stableBytes(run);
  await writeFile(path.join(stageRoot, 'run-manifest.json'), runBytes,
    {flag: 'wx'});
  const runBinding = Object.freeze({
    path: `${RUN_ROOT}/run-manifest.json`,
    bytes: runBytes.length,
    sha256: sha256(runBytes),
  });
  const audit = Object.freeze({
    schemaVersion: 1,
    artifactType: 'g678-alg-l11-behavior10-tranche-b-audit-v1',
    auditId: RUN_ID,
    status:
      'exact-10-source-binary-script-text-answer-geometry-audited-unregistered-original-runtime-blocked',
    scope: Object.freeze({
      activePagePlacements: 2282,
      algL11ActivePagePlacements: 44,
      predecessorFinal354RegisteredPages: 354,
      predecessorAlgL11RegisteredPages: 21,
      selectedBehavior10Placements: 10,
      tutorialChoicePlacements: 7,
      guidedTutorialChoicePlacements: 3,
      courseShellsInMigrationScope: 0,
    }),
    inputs: inputBindings,
    diagnosticRun: runBinding,
    selectedPlacementIds: EXPECTED_IDS,
    freshFfdecBinaryClosureCount: 10,
    answerVisibleGeometryCrosswalkCount: 10,
    tsAnsBtn1SemanticCResolvedCount: 3,
    p028GraphGeometryBoundCount: 1,
    p030AbsoluteValueGlyphBoundCount: 1,
    p029FeedbackOrderingResolvedCount: 1,
    staleAngleOverlaySourceDefectCount: 3,
    staleAngleOverlayOriginalRuntimeDispositionEstablishedCount: 0,
    sourceAuditPassedPlacementCount: 10,
    p1Blockers: Object.freeze([
      'case-sensitive-stale-angle-overlay-original-runtime-disposition-unresolved',
      'authoritative-original-runtime-natural-trace-not-established',
      'visual-fidelity-and-human-review-not-accepted',
      'source-audio-trigger-sync-replay-and-listening-not-accepted',
    ]),
    members,
    registrationCandidatePlacementCount: 0,
    currentJavaScriptRegisteredPlacementCount: 0,
    productCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false,
    scaleOutAuthorized: false,
    acceptanceEffects: FALSE_EFFECTS,
  });
  return Object.freeze({run, runBytes, runBinding, audit,
    auditBytes: stableBytes(audit)});
}

async function publishAudit(bytes) {
  const target = projectPath(OUTPUT);
  await writeFile(target, bytes, {flag: 'wx', mode: 0o444});
  const created = await stableFile(OUTPUT, {requireReadOnly: true});
  try {
    invariant(created.buffer.equals(bytes),
      'behavior10 audit publication drifted');
  } catch (error) {
    const current = await stableFile(OUTPUT, {requireReadOnly: true})
      .catch(() => null);
    if (current && current.buffer.equals(bytes) &&
      exact(current.identity, created.identity)) await unlink(target);
    throw error;
  }
}

export async function auditG678AlgL11Behavior10TrancheB(
  {check = false} = {},
) {
  const canonical = projectPath(RUN_ROOT);
  const stage = check
    ? `${canonical}.check-${process.pid}-${randomUUID()}`
    : `${canonical}.staging-${process.pid}-${randomUUID()}`;
  invariant(!await pathExists(stage), 'behavior10 audit stage already exists');
  if (!check) {
    invariant(!await pathExists(canonical), `${RUN_ROOT} already exists`);
    invariant(!await pathExists(projectPath(OUTPUT)), `${OUTPUT} already exists`);
  }
  await mkdir(stage, {recursive: false});
  try {
    const result = await expectedArtifacts(stage);
    await freezeTree(stage);
    if (check) {
      const current = await stableFile(OUTPUT, {requireReadOnly: true});
      invariant(current.buffer.equals(result.auditBytes),
        'behavior10 audit artifact drifted');
      const [freshInventory, canonicalInventory] = await Promise.all([
        frozenTreeInventory(stage), frozenTreeInventory(canonical),
      ]);
      invariant(exact(freshInventory, canonicalInventory),
        'behavior10 frozen diagnostic run drifted');
      await thawTree(stage);
      await rm(stage, {recursive: true});
    } else {
      await rename(stage, canonical);
      try {
        await publishAudit(result.auditBytes);
      } catch (error) {
        await rename(canonical,
          `${canonical}.failed-publication-${Date.now()}`).catch(() => {});
        throw error;
      }
    }
    return Object.freeze({
      check,
      output: OUTPUT,
      bytes: result.auditBytes.length,
      sha256: sha256(result.auditBytes),
      diagnosticRun: result.runBinding,
      auditedPlacementCount: 10,
      freshFfdecBinaryClosureCount: 10,
      answerVisibleGeometryCrosswalkCount: 10,
      tsAnsBtn1SemanticCResolvedCount: 3,
      staleAngleOverlayUnresolvedCount: 3,
      registrationCandidatePlacementCount: 0,
      productCalibrationPassed: false,
      acceptanceEffects: FALSE_EFFECTS,
    });
  } catch (error) {
    if (await pathExists(stage)) {
      await thawTree(stage).catch(() => {});
      await rename(stage, `${stage}.failed`).catch(() => {});
    }
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: audit-g678-alg-l11-behavior10-tranche-b.mjs [--check]');
  const result = await auditG678AlgL11Behavior10TrancheB({
    check: args[0] === '--check',
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
