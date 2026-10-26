import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  deriveAssessmentContract,
  deriveControllerContract,
  deriveMatchingContract,
  deriveReachableTextIds,
} from './audit-g678-alg-l11-advanced3-tranche-d.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT,
  'scripts/audit-g678-alg-l11-advanced3-tranche-d.mjs');
const SOURCE_ROOT =
  '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';

const ANSWERS = [
  'A1Opt4', 'A2Opt1', 'A3Opt4', 'A4Opt3', 'A5Opt3', 'A6Opt4',
  'A7Opt2', 'A8Opt1', 'A9Opt4', 'A10Opt2', 'A11Opt4', 'A12Opt1',
  'A13Opt3', 'A14Opt4', 'A15Opt2', 'A16Opt4', 'A17Opt3', 'A18Opt2',
  'A19Opt3', 'A20Opt1', 'A21Opt4', 'A22Opt3', 'A23Opt2', 'A24Opt1',
];

function controllerScript() {
  return `
FILE DefineSprite_116/frame_1/PlaceObject2_56_24/CLIPACTIONRECORD on(release).as
_global.gameLevel1 = true;
_global.gameLevel2 = true;
_global.startGame = true;
_root.doNeedMoreHelp("L11GS03",1);
FILE DefineSprite_116/frame_605/DoAction.as
stop();
Mc_Popup._visible = false;
FILE DefineSprite_116/frame_605/PlaceObject2_56_43/CLIPACTIONRECORD on(release).as
_global.gameLevel1 = true;
_global.gameLevel2 = true;
_global.startGame = true;
_root.doNeedMoreHelp("L11GS03",1,6);
`;
}

function cards() {
  return [1, 2].flatMap((level) =>
    [1, 2, 3, 4, 5, 6].flatMap((pairId) => [1, 2].map((side) => ({
      level, pairId, side, sourceInstanceName: `Mc${pairId}_${side}`,
    }))));
}

function matchingScript() {
  return `${'_global.score += 10;\n'.repeat(48)}${
    '_global.score -= 2;\n'.repeat(48)}_global.score = 0;\n_global.score = 0;
_global.totAnsCount++;
if (_global.totAnsCount >= 6) { _parent.nextFrame(); }
_parent.disableMc();
_parent.enableMc();`;
}

function assessmentScript() {
  return `_global.arrayAnswer = [${ANSWERS.map((value) => `"${value}"`).join(',')}];
_global.quizLabelArray = [${Array.from({length: 24}, (_, index) =>
    `"Q${index + 1}"`).join(',')}];
random(_global.quizLabelArray.length);
_global.quizLabelArray.splice(_global.tempQNo,1);
_global.revLabelArray.splice(_global.tempQNo,1);
_global.totalQuestionsCount = 10;
doGetRandomQuiz(); doGetReview(); setBookMark(); doCloseApp();
doPlayFQQuestionAudio(); doPlayFQAnswerAudio();
"Unsatisfactory"; "Partially Proficient"; "Proficient"; "Advanced";`;
}

test('p033 keeps the exact one- and six-argument L11GS03 handoffs', () => {
  const contract = deriveControllerContract(controllerScript());
  assert.deepEqual(contract.initialHandoffArguments, [1]);
  assert.deepEqual(contract.terminalHandoffArguments, [1, 6]);
  assert.equal(contract.initialFrame, 1);
  assert.equal(contract.terminalFrame, 605);
  assert.deepEqual(contract.phaseBoundary,
    {initialLastFrame: 604, terminalFirstFrame: 605});
  assert.deepEqual(contract.scriptBindings.initialHandoff,
    {path: "DefineSprite_116/frame_1/PlaceObject2_56_24/CLIPACTIONRECORD on(release).as",
      frame: 1, depth: 24});
  assert.deepEqual(contract.scriptBindings.terminalHandoff,
    {path: "DefineSprite_116/frame_605/PlaceObject2_56_43/CLIPACTIONRECORD on(release).as",
      frame: 605, depth: 43});
  assert.deepEqual(contract.scriptBindings.terminalStop,
    {path: "DefineSprite_116/frame_605/DoAction.as", frame: 605,
      depth: null});
  assert.throws(() => deriveControllerContract(controllerScript()
    .replace('"L11GS03",1,6', '"L11GS03",1,5')),
  /terminalHandoff exact path\/frame\/depth binding drifted/u);
  assert.throws(() => deriveControllerContract(controllerScript()
    .replace('_global.startGame = true;', '')),
  /level\/start mutations drifted/u);
});

test('p033 rejects swapped, duplicate, wrong-depth, and wrong-frame witnesses', () => {
  // Use neutral placeholders because the source strings overlap.
  const safelySwapped = controllerScript()
    .replace('doNeedMoreHelp("L11GS03",1);', 'CALL_INITIAL')
    .replace('doNeedMoreHelp("L11GS03",1,6);',
      'doNeedMoreHelp("L11GS03",1);')
    .replace('CALL_INITIAL', 'doNeedMoreHelp("L11GS03",1,6);');
  assert.throws(() => deriveControllerContract(safelySwapped),
    /initialHandoff exact path\/frame\/depth binding drifted/u);
  assert.throws(() => deriveControllerContract(`${controllerScript()}\nFILE DefineSprite_116/frame_605/DoAction.as\nstop();`),
    /duplicate script path/u);
  assert.throws(() => deriveControllerContract(controllerScript().replace(
    'frame_1/PlaceObject2_56_24', 'frame_1/PlaceObject2_56_25')),
  /initialHandoff exact path\/frame\/depth binding drifted/u);
  assert.throws(() => deriveControllerContract(controllerScript().replace(
    'frame_605/PlaceObject2_56_43', 'frame_604/PlaceObject2_56_43')),
  /terminalHandoff exact path\/frame\/depth binding drifted/u);
});

test('p034 uses exact level/pair/side identity and source scoring', () => {
  const contract = deriveMatchingContract(matchingScript(), cards());
  assert.equal(contract.levelCount, 2);
  assert.equal(contract.pairsPerLevel, 6);
  assert.equal(contract.correctScoreDelta, 10);
  assert.equal(contract.incorrectScoreDelta, -2);
  const duplicate = cards();
  duplicate[1] = {...duplicate[1], sourceInstanceName: duplicate[0].sourceInstanceName};
  assert.throws(() => deriveMatchingContract(matchingScript(), duplicate),
    /24-card inventory drifted/u);
  assert.throws(() => deriveMatchingContract(matchingScript()
    .replace('_global.score += 10;', ''), cards()),
  /score mutation multiplicity drifted/u);
});

test('source XML graph binds each p034 card to its reachable text IDs', () => {
  const xml = '<swf><DefineText objectID="7"></DefineText>' +
    '<DefineSprite objectID="8"><tags><PlaceObject2 objectID="7">' +
    '</PlaceObject2></tags></DefineSprite></swf>';
  assert.deepEqual(deriveReachableTextIds(xml, 8, new Set([7])), [7]);
  assert.throws(() => deriveReachableTextIds(xml.replace('objectID="7"',
    'objectID="6"'), 8, new Set([7])), /object 7 is absent/u);
  assert.throws(() => deriveReachableTextIds(xml, 9, new Set([7])),
    /object 9 is absent/u);
});

test('p044 binds exact 24-key, 10-without-replacement, option, and grade contract', () => {
  const all = Array.from({length: 24}, (_, question) =>
    Array.from({length: 4}, (_, option) => `A${question + 1}Opt${option + 1}`))
    .flat();
  const wrong = all.filter((name) => !ANSWERS.includes(name));
  const contract = deriveAssessmentContract(assessmentScript(), ANSWERS, wrong);
  assert.equal(contract.poolSize, 24);
  assert.equal(contract.selectionCount, 10);
  assert.equal(new Set(contract.answerKey).size, 24);
  assert.equal(contract.wrongActionCount, 72);
  assert.throws(() => deriveAssessmentContract(assessmentScript()
    .replace('A1Opt4', 'A1Opt3'), ANSWERS, wrong), /answer key drifted/u);
  assert.throws(() => deriveAssessmentContract(assessmentScript()
    .replace('_global.quizLabelArray.splice(_global.tempQNo,1);', ''),
  ANSWERS, wrong), /unique random 10-of-24/u);
  assert.throws(() => deriveAssessmentContract(assessmentScript(), ANSWERS,
    wrong.slice(1)), /24-by-4 option action inventory/u);
});

test('checked audit is exact, read-only, and keeps every downstream gate false', () => {
  const result = spawnSync(process.execPath, [SCRIPT, '--check'], {
    cwd: ROOT,
    env: {...process.env, HELP_MATH_G678_SOURCE_ROOT: SOURCE_ROOT},
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.exactPlacementCount, 3);
  assert.equal(summary.auditP0Count, 0);
  assert.equal(summary.auditP1Count, 0);
  assert.equal(summary.registrationCandidatePlacementCount, 0);
  assert.equal(summary.productCalibrationPassed, false);
  assert.ok(Object.values(summary.acceptanceEffects).every((value) => !value));
  const artifact = JSON.parse(readFileSync(path.join(ROOT,
    'catalog/g678-alg-l11-advanced3-tranche-d-audit-v1.json'), 'utf8'));
  assert.deepEqual(artifact.exactPlacementIds, [
    'shared-alg001-l11-p033', 'shared-alg001-l11-p034',
    'shared-alg001-l11-p044',
  ]);
  assert.equal(artifact.currentJavaScriptRegisteredPlacementCount, 0);
  assert.equal(artifact.wholeLessonEngineeringPreviewReady, false);
  assert.equal(artifact.acceptancePassed, false);
  assert.equal(artifact.releaseAuthorized, false);
  assert.equal(artifact.published, false);
});

test('CLI requires the explicit canonical source root and never defaults it', () => {
  const missing = {...process.env};
  delete missing.HELP_MATH_G678_SOURCE_ROOT;
  const missingResult = spawnSync(process.execPath, [SCRIPT, '--check'], {
    cwd: ROOT, env: missing, encoding: 'utf8',
  });
  assert.notEqual(missingResult.status, 0);
  assert.match(missingResult.stderr, /HELP_MATH_G678_SOURCE_ROOT is required/u);
  const relativeResult = spawnSync(process.execPath, [SCRIPT, '--check'], {
    cwd: ROOT,
    env: {...process.env, HELP_MATH_G678_SOURCE_ROOT: '../source'},
    encoding: 'utf8',
  });
  assert.notEqual(relativeResult.status, 0);
  assert.match(relativeResult.stderr, /normalized absolute path/u);
});
