#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, readdir, realpath, rename, writeFile} from
  'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {parseSwfSourceFacts} from
  './build-g4-l3-machine-source-audits.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const SOURCE_ENV = 'HELP_MATH_G678_SOURCE_ROOT';
const CATALOG = 'catalog/g678-shared-catalog.v1.json';
const PREDECESSOR =
  'catalog/product-bridge-calibrations/g678-current-js-336-page-product-calibrated-registration-v1.json';
const OUTPUT = 'catalog/g678-alg-l09-residual-routing-audit-v1.json';

const MEMBERS = Object.freeze([
  {
    animationId: 'shared-alg001-l09-p030', sectionCode: 'GS',
    sectionPageOrdinal: 1, sourceName: 'GS/L9GS02.swf',
    sourceBytes: 238486,
    sourceSha256:
      '490bf1270ebaae387784e73c196646da73db623789574e107ef86734d2f238e9',
    diagnosticName: 'gs02', mainObjectId: 140, mainFrameCount: 749,
    scriptCount: 45, textCount: 40,
    interactiveStopFrames: [748],
    lane: 'advanced-manual-cross-page-game-controller',
    reason:
      'narrated two-level game controller with replay, popup, and a shell call that launches L9GS03',
  },
  {
    animationId: 'shared-alg001-l09-p031', sectionCode: 'GS',
    sectionPageOrdinal: 2, sourceName: 'GS/L9GS03.swf',
    sourceBytes: 694582,
    sourceSha256:
      '1ede8bbaa6a64ac2428d5a4dd9d03cdd6ca346621210f2001ea32b9210826adb',
    diagnosticName: 'gs03', mainObjectId: 227, mainFrameCount: 5,
    scriptCount: 101, textCount: 47,
    interactiveStopFrames: [1, 2, 3, 4, 5],
    lane: 'advanced-manual-game-state-machine',
    reason:
      'two-level matching game with twelve answer pairs, score mutation, fades, feedback, and replay',
  },
  {
    animationId: 'shared-alg001-l09-p037', sectionCode: 'TS',
    sectionPageOrdinal: 6, sourceName: 'TS/L9TS07.swf',
    sourceBytes: 562427,
    sourceSha256:
      '29bfe39a4c2ffd7b163b5c03925efad55ae86b4533a19c278e1abf8dbb91cd35',
    diagnosticName: 'ts07', mainObjectId: 307, mainFrameCount: 942,
    scriptCount: 61, textCount: 70,
    interactiveStopFrames: [396, 564, 712, 869, 925, 942],
    finalQuizStopFrame: 925, resumeFrame: 926,
    rightButtonCharacterId: 266, wrongButtonCharacterId: 267,
    questionTextId: 193, question: 'What is the ratio of socks to shoes?',
    options: [['A', 179, '1 to 4', false], ['B', 182, '2 to 9', false],
      ['C', 185, '9 to 2', true], ['D', 188, '18 to 4', false]],
    helpPromptTextIds: [[234, 235], [237, 238, 239, 240, 241, 242]],
    lane: 'advanced-manual-guided-tutorial-quiz-state-machine',
    reason:
      'four guided stops, two Need More Help branches, a source feedback quiz, and a terminal stop',
  },
  {
    animationId: 'shared-alg001-l09-p038', sectionCode: 'TS',
    sectionPageOrdinal: 7, sourceName: 'TS/L9TS08.swf',
    sourceBytes: 567267,
    sourceSha256:
      '453e9b535c6b349e8ed94598e8db555339d67dc15ac4b89042a117379761112a',
    diagnosticName: 'ts08', mainObjectId: 329, mainFrameCount: 934,
    scriptCount: 63, textCount: 81,
    interactiveStopFrames: [391, 560, 708, 865, 917, 934],
    finalQuizStopFrame: 917, resumeFrame: 918,
    rightButtonCharacterId: 297, wrongButtonCharacterId: 298,
    questionTextId: 52, question: 'What is the value of M?',
    options: [['A', 38, 'M = 2', true], ['B', 41, 'M = 7.5', false],
      ['C', 44, 'M = 15', false], ['D', 47, 'M = 20', false]],
    helpPromptTextIds: [[94, 95], [103, 104, 105, 106]],
    lane: 'advanced-manual-guided-tutorial-quiz-state-machine',
    reason:
      'four guided stops, two Need More Help branches, a source feedback quiz, and a terminal stop',
  },
  {
    animationId: 'shared-alg001-l09-p039', sectionCode: 'TS',
    sectionPageOrdinal: 8, sourceName: 'TS/L9TS09.swf',
    sourceBytes: 641617,
    sourceSha256:
      '7d972629424cab7fe6aafdb21d56f7049dc8dd906069d44006361036aac178ca',
    diagnosticName: 'ts09', mainObjectId: 342, mainFrameCount: 1111,
    scriptCount: 64, textCount: 95,
    interactiveStopFrames: [534, 704, 852, 1008, 1094, 1111],
    finalQuizStopFrame: 1094, resumeFrame: 1095,
    rightButtonCharacterId: 297, wrongButtonCharacterId: 298,
    questionTextId: 38,
    question: 'Does the caterer use a proportional relationship?',
    options: [['A', 31, 'non-proportional relationship', true],
      ['B', 34, 'proportional relationship', false]],
    helpPromptTextIds: [[80, 81], [84, 85, 86, 87, 94]],
    lane: 'advanced-manual-guided-tutorial-quiz-state-machine',
    reason:
      'four guided stops, two Need More Help branches, a source feedback quiz, and a terminal stop',
  },
  {
    animationId: 'shared-alg001-l09-p041', sectionCode: 'FQ',
    sectionPageOrdinal: 2, sourceName: 'FQ/L9FQ02.swf',
    sourceBytes: 40244,
    sourceSha256:
      'a3706178cef1f10fd9d99c430114951bd1c9a07f9c16fc6e66c1d906b6e86af8',
    diagnosticName: 'fq02', mainObjectId: 855, mainFrameCount: 69,
    scriptCount: 99, textCount: 472,
    interactiveStopFrames: [44], questionPoolSize: 24,
    presentedQuestionCount: 10,
    lane: 'advanced-manual-final-assessment-state-machine',
    reason:
      'random ten-of-twenty-four assessment with response arrays, result, review, bookmark, and legacy reporting calls',
  },
].map((member) => Object.freeze(member)));

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

function projectPath(relativePath) {
  const target = path.resolve(ROOT, relativePath);
  invariant(target.startsWith(`${ROOT}${path.sep}`),
    `${relativePath} escapes project root`);
  return target;
}

async function stableFile(target, {absolute = false, json = false,
  requireReadOnly = true} = {}) {
  const resolved = absolute ? path.resolve(target) : projectPath(target);
  const [canonical, before] = await Promise.all([
    realpath(resolved), lstat(resolved, {bigint: true}),
  ]);
  invariant(canonical === resolved && before.isFile() &&
    !before.isSymbolicLink() && before.nlink === 1n &&
    (!requireReadOnly || (before.mode & 0o222n) === 0n),
  `${target} must be one canonical read-only ordinary file`);
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

function descriptor(item, pathOverride = item.path) {
  return Object.freeze({path: pathOverride, bytes: item.bytes,
    sha256: item.sha256});
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

async function walkFiles(root, current = root, files = []) {
  const entries = await readdir(current, {withFileTypes: true});
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const target = path.join(current, entry.name);
    const metadata = await lstat(target, {bigint: true});
    invariant(!metadata.isSymbolicLink() && (metadata.mode & 0o222n) === 0n,
      `${target} must be read-only and nonsymlink`);
    if (entry.isDirectory()) await walkFiles(root, target, files);
    else if (entry.isFile()) files.push(target);
    else invariant(false, `${target} is not an ordinary file`);
  }
  return files;
}

async function inventory(relativeRoot, extension) {
  const root = projectPath(relativeRoot);
  const files = (await walkFiles(root)).filter((file) =>
    file.endsWith(extension));
  const rows = [];
  const values = [];
  let totalBytes = 0;
  for (const file of files) {
    const current = await stableFile(file, {absolute: true});
    const relative = path.relative(root, file).split(path.sep).join('/');
    rows.push(`${current.sha256}  ${relative}\n`);
    values.push(Object.freeze({path: relative, buffer: current.buffer,
      bytes: current.bytes, sha256: current.sha256}));
    totalBytes += current.bytes;
  }
  return Object.freeze({fileCount: files.length, totalBytes,
    checksumSetSha256: sha256(Buffer.from(rows.join(''))), values});
}

function mainAction(scripts, member, frame) {
  const expected = `DefineSprite_${member.mainObjectId}/frame_${frame}/DoAction.as`;
  const matches = scripts.values.filter((item) => item.path === expected);
  invariant(matches.length === 1,
    `${member.animationId}: missing ${expected}`);
  return matches[0].buffer.toString('utf8').replace(/\r\n?/gu, '\n');
}

function diagnosticText(texts, member, objectId) {
  const matches = texts.values.filter((item) => item.path === `${objectId}.txt`);
  invariant(matches.length === 1,
    `${member.animationId}: text ${objectId} is missing`);
  return matches[0].buffer.toString('utf8')
    .replace(/--- RECORDSEPARATOR ---/gu, ' ')
    .replace(/\s+/gu, ' ').trim();
}

function semanticEvidence(member, scripts, texts) {
  const actionTexts = scripts.values.map((item) => Object.freeze({
    path: item.path,
    text: item.buffer.toString('utf8').replace(/\r\n?/gu, '\n'),
  }));
  if (member.sectionCode === 'GS' && member.sectionPageOrdinal === 1) {
    const last = mainAction(scripts, member, 748);
    invariant(last.includes('stop();'),
    `${member.animationId}: two-level game contract drifted`);
    const releases = actionTexts.filter((item) =>
      item.path.startsWith(`DefineSprite_${member.mainObjectId}/`) &&
      item.path.endsWith('CLIPACTIONRECORD on(release).as'));
    invariant(releases.length === 6,
      `${member.animationId}: game control count drifted`);
    const combinedReleaseText = releases.map((item) => item.text).join('\n');
    invariant(combinedReleaseText.includes('_global.gameLevel1 = true;') &&
      combinedReleaseText.includes('_global.gameLevel2 = true;') &&
      combinedReleaseText.includes('_global.startGame = true;') &&
      combinedReleaseText.includes('_root.doNeedMoreHelp("L9GS03",1,6);'),
    `${member.animationId}: level selection / GS03 handoff drifted`);
    return Object.freeze({sourceLevelCount: 2,
      sourceControlCount: releases.length, sourceScoreMutation: false,
      replayAndLevelSelection: true,
      crossPageTarget: 'L9GS03', legacyShellHandoff: 'doNeedMoreHelp'});
  }
  if (member.sectionCode === 'GS') {
    invariant(member.interactiveStopFrames.every((frame) =>
      mainAction(scripts, member, frame).includes('stop();')),
    `${member.animationId}: matching-game stops drifted`);
    const releases = actionTexts.filter((item) =>
      item.path.startsWith(`DefineSprite_${member.mainObjectId}/frame_4/`) &&
      item.path.endsWith('CLIPACTIONRECORD on(release).as'));
    invariant(releases.length === 12 && releases.every((item) =>
      item.text.includes('_global.ansClickCount++;') &&
      item.text.includes('_global.score')),
    `${member.animationId}: matching-game pair/score scripts drifted`);
    return Object.freeze({sourceLevelCount: 2,
      sourcePairCount: 6, sourceAnswerReleaseCount: releases.length,
      sourceScoreMutation: true, replayAndLevelSelection: true});
  }
  if (member.sectionCode === 'TS') {
    invariant(member.interactiveStopFrames.every((frame) =>
      mainAction(scripts, member, frame).includes('stop();')) &&
      mainAction(scripts, member, member.finalQuizStopFrame)
        .includes('_global.quizTryCount = 0;') &&
      mainAction(scripts, member, member.resumeFrame)
        .includes('_global.quizSection = false;'),
    `${member.animationId}: guided tutorial stop/resume contract drifted`);
    const right = actionTexts.filter((item) =>
      item.path.includes(`DefineButton2_${member.rightButtonCharacterId}/`) &&
      item.text.includes('_root.showRightFeed();'));
    const wrong = actionTexts.filter((item) =>
      item.path.includes(`DefineButton2_${member.wrongButtonCharacterId}/`) &&
      item.text.includes('_root.showWrongFeed();'));
    const needMoreHelpBranches = actionTexts.filter((item) =>
      item.path.startsWith(`DefineSprite_${member.mainObjectId}/`) &&
      item.text.includes('NMHBtn._visible = true;'));
    const glossaryTerms = [...new Set(actionTexts.flatMap((item) =>
      [...item.text.matchAll(/_global\.KeyAttribute = "([^"]+)";/gu)]
        .map((match) => match[1])))].sort();
    const glossaryButtons = actionTexts.flatMap((item) => {
      const character = item.path.match(/^DefineButton2_(\d+)\//u);
      const key = item.text.match(/_global\.KeyAttribute = "([^"]+)";/u);
      return character && key ? [Object.freeze({
        characterId: Number(character[1]), sourceKeyAttribute: key[1],
      })] : [];
    }).sort((left, right) => left.characterId - right.characterId);
    invariant(right.length === 1 && wrong.length === 1 &&
      needMoreHelpBranches.length === 2 && glossaryTerms.length > 0,
    `${member.animationId}: feedback/help/glossary behavior drifted`);
    const question = diagnosticText(texts, member, member.questionTextId);
    invariant(question === member.question,
      `${member.animationId}: final question text drifted`);
    const options = member.options.map(([label, objectId, value, correct]) => {
      const actual = diagnosticText(texts, member, objectId);
      invariant(actual === value,
        `${member.animationId}: option ${label} text drifted`);
      return Object.freeze({id: `choice-${label.toLowerCase()}`, label,
        value, textObjectId: objectId, correct});
    });
    invariant(options.filter((option) => option.correct).length === 1,
      `${member.animationId}: correct choice is not unique`);
    const helpPrompts = member.helpPromptTextIds.map((ids, index) =>
      Object.freeze({stopFrame:
        member.interactiveStopFrames[2 + index], textObjectIds: ids,
      text: ids.map((id) => diagnosticText(texts, member, id)).join(' ')}));
    return Object.freeze({guidedStopCount:
      member.interactiveStopFrames.length - 2,
    needMoreHelpBranchCount: needMoreHelpBranches.length,
    finalQuizStopFrame: member.finalQuizStopFrame,
    resumeFrame: member.resumeFrame,
    rightButtonCharacterId: member.rightButtonCharacterId,
    wrongButtonCharacterId: member.wrongButtonCharacterId,
    question, options: Object.freeze(options),
    correctChoiceId: options.find((option) => option.correct).id,
    helpPrompts: Object.freeze(helpPrompts),
    glossaryTerms: Object.freeze(glossaryTerms),
    glossaryButtons: Object.freeze(glossaryButtons)});
  }
  const first = mainAction(scripts, member, 1);
  const terminal = mainAction(scripts, member, 44);
  const answerMatch = first.match(
    /_global\.arrayAnswer = \[(.*?)\];/u);
  const quizLabels = first.match(
    /_global\.quizLabelArray = \[(.*?)\];/u);
  invariant(first.includes('function doGetRandomQuiz()') &&
    first.includes('random(_global.quizLabelArray.length)') &&
    first.includes('_global.totalQuestionsCount = 10;') &&
    first.includes('function doGetReview()') &&
    first.includes('_root.setBookMark();') && first.includes('getURL(strURL,"");') &&
    answerMatch && quizLabels &&
    (answerMatch[1].match(/"A\d+Opt\d+"/gu) ?? []).length === 24 &&
    (quizLabels[1].match(/"Q\d+"/gu) ?? []).length === 24 &&
    terminal.includes('stop();'),
  `${member.animationId}: randomized final-assessment contract drifted`);
  return Object.freeze({questionPoolSize: 24, presentedQuestionCount: 10,
    answerKeySize: 24, randomizedWithoutReplacement: true,
    responseReviewImplementedInSource: true,
    legacyBookmarkAndReportCallsPresent: true});
}

async function inspectMember(member, context) {
  const sourceRelative = `ALG001/L9/${member.sourceName}`;
  const source = await stableFile(path.join(context.sharedRoot, sourceRelative),
    {absolute: true});
  invariant(source.bytes === member.sourceBytes &&
    source.sha256 === member.sourceSha256,
  `${member.animationId}: source identity drifted`);
  const facts = parseSwfSourceFacts(source.buffer);
  const mainDomain = facts.frameDomains.domains.find((domain) =>
    domain.domainId === `sprite-${member.mainObjectId}`);
  invariant(facts.header.stage.width === 800 &&
    facts.header.stage.height === 600 && facts.header.fps === 12 &&
    facts.header.rootFrameCount === 10 &&
    facts.actionScript.version === 'AS1/2' &&
    mainDomain?.declaredFrameCount === member.mainFrameCount &&
    mainDomain.staticallyRootReachable === true,
  `${member.animationId}: SWF structure drifted`);
  const diagnosticRoot =
    `work/g678-shared-page-factory/g678-alg-l09-${member.diagnosticName}-diagnostic-20260904`;
  const [xml, scripts, texts] = await Promise.all([
    stableFile(`${diagnosticRoot}/source.xml`),
    inventory(`${diagnosticRoot}/export/scripts`, '.as'),
    inventory(`${diagnosticRoot}/export/texts`, '.txt'),
  ]);
  invariant(scripts.fileCount === member.scriptCount &&
    texts.fileCount === member.textCount,
  `${member.animationId}: FFDec diagnostic inventory drifted`);
  const xmlText = xml.buffer.toString('utf8');
  const named = xmlText.match(new RegExp(
    `<PlaceObject2[^>]*objectID="${member.mainObjectId}"[^>]*name="animation"`,
    'u'));
  const sprite = xmlText.match(new RegExp(
    `<DefineSprite objectID="${member.mainObjectId}" frames="(\\d+)"`, 'u'));
  invariant(named && sprite && Number(sprite[1]) === member.mainFrameCount,
    `${member.animationId}: named animation XML binding drifted`);
  return Object.freeze({animationId: member.animationId,
    stableLessonKey: 'shared-alg001-l09', moduleCode: 'ALG001',
    lessonNumber: 9, sectionCode: member.sectionCode,
    sectionPageOrdinal: member.sectionPageOrdinal,
    source: Object.freeze({path: `G6-G8-shared/${sourceRelative}`,
      bytes: source.bytes, sha256: source.sha256}),
    runtime: Object.freeze({rootFrameCount: 10, fps: 12,
      mainFrameDomain: `sprite-${member.mainObjectId}`,
      mainFrameCount: member.mainFrameCount,
      domainFingerprintSha256: mainDomain.domainFingerprintSha256}),
    diagnosticEvidence: Object.freeze({sourceXml: descriptor(xml),
      scripts: Object.freeze({fileCount: scripts.fileCount,
        totalBytes: scripts.totalBytes,
        checksumSetSha256: scripts.checksumSetSha256}),
      texts: Object.freeze({fileCount: texts.fileCount,
        totalBytes: texts.totalBytes,
        checksumSetSha256: texts.checksumSetSha256})}),
    interactiveStopFrames: Object.freeze(member.interactiveStopFrames),
    semanticEvidence: semanticEvidence(member, scripts, texts),
    lane: member.lane, laneReason: member.reason,
    registrationCandidate: false,
    productCalibrationPassed: false,
  });
}

async function expectedArtifact() {
  const [catalog, predecessor, builder, sharedRoot] = await Promise.all([
    stableFile(CATALOG, {json: true, requireReadOnly: false}),
    stableFile(PREDECESSOR, {json: true, requireReadOnly: false}),
    stableFile(path.relative(ROOT, SCRIPT_PATH), {requireReadOnly: false}),
    readSourceRoot(),
  ]);
  invariant(predecessor.value.registrationCandidatePlacementCount === 336 &&
    predecessor.value.selectedPages.length === 336 &&
    predecessor.value.selectedPages.every((page) =>
      !MEMBERS.some((member) => member.animationId === page.animationId)),
  '336-page predecessor must exclude the six ALG L9 residual placements');
  const catalogLesson = catalog.value.lessons.find((lesson) =>
    lesson.stableLessonKey === 'shared-alg001-l09');
  invariant(catalogLesson?.activePageCount === 41,
    'ALG L9 catalog denominator drifted');
  for (const member of MEMBERS) {
    const page = catalogLesson.pages.find((candidate) =>
      candidate.animationId === member.animationId);
    invariant(page?.sectionCode === member.sectionCode &&
      page.sectionPageOrdinal === member.sectionPageOrdinal &&
      page.sourceBytes === member.sourceBytes &&
      page.sourceSha256 === member.sourceSha256,
    `${member.animationId}: catalog binding drifted`);
  }
  const inspected = await Promise.all(MEMBERS.map((member) =>
    inspectMember(member, {sharedRoot})));
  const laneCounts = Object.freeze(Object.fromEntries([...new Set(
    inspected.map((member) => member.lane))].sort().map((lane) => [lane,
    inspected.filter((member) => member.lane === lane).length])));
  return Object.freeze({schemaVersion: 1,
    artifactType: 'g678-alg-l09-residual-routing-audit-v1',
    generatedAt: new Date().toISOString(),
    status: 'exact-6-source-script-routed-no-registration',
    inputs: Object.freeze({catalog: descriptor(catalog),
      predecessor: descriptor(predecessor), builder: descriptor(builder)}),
    auditedPlacementCount: inspected.length,
    affectedLessonCount: 1,
    lessonActivePageCount: 41,
    predecessorRegisteredPageCount: 35,
    remainingPlacementCount: 6,
    laneCounts,
    members: Object.freeze(inspected),
    registrationCandidatePlacementCount: 0,
    productCalibrationPassed: false,
    wholeLessonEngineeringPreviewReady: false,
    scaleOutAuthorized: false,
    blockers: Object.freeze([
      'maintained-game-state-machines-not-implemented',
      'guided-tutorial-multi-stop-host-consumer-not-implemented',
      'randomized-final-assessment-state-machine-not-implemented',
      'browser-product-calibration-pending',
      'authoritative-original-runtime-not-established',
      'visual-fidelity-not-accepted',
      'audio-acceptance-pending',
    ]),
    limitations: Object.freeze([
      'The six diagnostics are source-bound lane-routing evidence only and do not register a renderer.',
      'FFDec PNG/script and swfmill XML exports are frozen read-only private work evidence, not original-runtime or visual-fidelity acceptance.',
      'Legacy final-assessment bookmark/report calls are evidence only; they are not authorized network behavior for the maintained product runtime.',
    ]),
    acceptanceEffects: FALSE_EFFECTS});
}

export async function auditG678AlgL09ResidualRouting({check = false} = {}) {
  const artifact = await expectedArtifact();
  const target = projectPath(OUTPUT);
  let bytes;
  if (check) {
    const current = await stableFile(OUTPUT, {json: true,
      requireReadOnly: false});
    const expected = stableBytes({...artifact,
      generatedAt: current.value.generatedAt});
    invariant(current.buffer.equals(expected),
      'ALG L9 residual routing audit drifted');
    bytes = current.buffer;
  } else {
    bytes = stableBytes(artifact);
    await mkdir(path.dirname(target), {recursive: true});
    const staging = `${target}.staging-${process.pid}`;
    await writeFile(staging, bytes, {flag: 'wx'});
    await rename(staging, target);
  }
  return Object.freeze({check, output: OUTPUT,
    bytes: bytes.length, sha256: sha256(bytes), auditedPlacementCount: 6,
    registrationCandidatePlacementCount: 0,
    laneCounts: artifact.laneCounts,
    productCalibrationPassed: false,
    acceptanceEffects: FALSE_EFFECTS});
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const args = process.argv.slice(2);
  invariant(args.length <= 1 && (args.length === 0 || args[0] === '--check'),
    'usage: audit-g678-alg-l09-residual-routing.mjs [--check]');
  auditG678AlgL09ResidualRouting({check: args[0] === '--check'})
    .then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`))
    .catch((error) => {
      process.stderr.write(`${error.stack ?? error.message}\n`);
      process.exitCode = 1;
    });
}
