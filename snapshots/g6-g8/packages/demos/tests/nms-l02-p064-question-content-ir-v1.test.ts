import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

type Placement = {symbolId: number; kind: string; name: string | null; rawText?: string};
type Question = {
  questionId: number;
  questionFrame: number;
  reviewFrame: number;
  correctOption: number;
  frameDeltaPlacements: Placement[];
  frameMoveUpdates: {attributes: {depth: string}}[];
  options: {option: number; instance: Placement; children: Placement[]}[];
  reviewDeltaOptionPlacements: Placement[];
  reviewMoveUpdates: {attributes: {depth: string}}[];
};
type QuestionIr = {
  authority: string;
  source: {sha256: string};
  sourceQuizContractSha256: string;
  mainSprite: {symbolId: number; frames: number; reviewEntryFrame: number; textDefinitions: number; moveOnlyUpdates: number};
  questions: Question[];
  instanceNameAnomalies: {questionId: number; option: number; actual: string}[];
  reviewNameAnomalies: {questionId: number; actual: string}[];
  sourceDerivedReviewLookupMisses: {questionId: number; option: number; computedReviewName: string}[];
};

const bytes = readFileSync(new URL('../../../migrations/shared-nms002-l02-p064/audit/question-content-ir-v1.json', import.meta.url));
const ir = JSON.parse(bytes.toString('utf8')) as QuestionIr;

test('source-locked P064 IR contains all 35 question and review frame identities', () => {
  assert.equal(createHash('sha256').update(bytes).digest('hex'),
    'ecc84d6053005e5d34f9f1dd615144a6a1c5638bf650bf572ff071f42169c350');
  assert.equal(ir.authority, 'static-source-structure-only');
  assert.equal(ir.source.sha256, 'f655f05d7be5576503a66f52909b322bd3fce3e7b51a7fcda52291f755bf346c');
  assert.equal(ir.sourceQuizContractSha256, '943270c7fdeefd4226e5f13a9d2679cf277c9415efbe8b5e979798cd12a537e5');
  assert.deepEqual(ir.mainSprite, {symbolId: 1258, frames: 90, questionLabels: 35,
    reviewEntryFrame: 38, reviewLabels: 35, textDefinitions: 649, moveOnlyUpdates: 12});
  assert.equal(ir.questions.length, 35);
  for (const [index, question] of ir.questions.entries()) {
    assert.equal(question.questionId, index + 1);
    assert.equal(question.questionFrame, index + 2);
    assert.equal(question.reviewFrame, index + 55);
    assert.deepEqual(question.options.map(option => option.option), [1, 2, 3, 4]);
    assert.equal(question.reviewDeltaOptionPlacements.length, 4);
    assert.ok(question.correctOption >= 1 && question.correctOption <= 4);
  }
  assert.equal(ir.questions.reduce((count, question) => count + question.frameMoveUpdates.length +
    question.reviewMoveUpdates.length, 0), 12);
});

test('IR retains text and graphic dependencies without inventing a text-only question', () => {
  const q1 = ir.questions[0]!;
  assert.ok(q1.frameDeltaPlacements.some(item =>
    item.rawText?.trim() === 'What is the name for the shaded part of this fraction?'));
  assert.equal(q1.options[0]!.children.find(item => item.rawText?.includes('RECORDSEPARATOR'))?.rawText?.trim(),
    '1\n--- RECORDSEPARATOR ---\n5');
  const q2 = ir.questions[1]!;
  assert.ok(q2.frameDeltaPlacements.some(item => item.symbolId === 70 && item.kind === 'DefineShape'));
  assert.equal(q2.frameDeltaPlacements.some(item => item.rawText?.includes('?')), false);
  assert.ok(ir.questions[9]!.options.every(option => option.children.some(child =>
    child.rawText?.trim() === String.fromCharCode(64 + option.option))));
});

test('source instance-name defects and derived review lookup misses remain visible', () => {
  assert.deepEqual(ir.instanceNameAnomalies.map(item => [item.questionId, item.option, item.actual]),
    [[10, 4, 'A10Opt4 '], [23, 3, 'A231Opt3']]);
  assert.deepEqual(ir.reviewNameAnomalies.map(item => [item.questionId, item.actual]),
    [[21, 'R210Opt3']]);
  assert.deepEqual(ir.sourceDerivedReviewLookupMisses.map(item =>
    [item.questionId, item.option, item.computedReviewName]),
  [[10, 4, 'R10Opt4 '], [21, 3, 'R21Opt3'], [23, 3, 'R231Opt3']]);
  assert.equal(ir.questions[22]!.correctOption, 2);
});
