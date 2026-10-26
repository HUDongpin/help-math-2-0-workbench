import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';

import {
  classifyTs07Scripts,
  stableFfdecCommandReceipt,
} from './audit-g678-ts07-family.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const row = (path, text) => ({
  path,
  text,
  bytes: Buffer.byteLength(text),
  sha256: sha256(text),
});
const glossaryHandler = (key, {strayQ = false} = {}) =>
  'on(release){\r\n' +
  `${strayQ ? '   q;\r\n' : ''}   _global.KeyAttribute = "${key}";\r\n` +
  '   _root.DoHyperLinks();\r\n' +
  '   _root.animation_mc.animation.stop();\r\n}\r\n';
const retry =
  'stop(); _root.enableQuizButton(); this.gotoAndStop(1); ' +
  '_global.quizTryCount++; _parent.NMHBtn.enabled = true; ' +
  'if(_global.quizTryCount >= 2) { _global.quizTryCount = 0; ' +
  '_global.quizSection = false; _parent.play(); }';
const fixture = () => [
  row('frame_1/DoAction.as',
    '_level0.InternalPreloader.gotoAndPlay("jump_check");\r\nstop();\r\n'),
  row('frame_6/DoAction.as', 'stop();\r\n'),
  row('DefineButton2_10/BUTTONCONDACTION on(release).as',
    'on(release){ _root.disableQuizButton(); _root.showWrongFeed(); ' +
    'NMHBtn.enabled = false; }'),
  row('DefineButton2_20/BUTTONCONDACTION on(release).as',
    'on(release){ _root.disableQuizButton(); _root.showRightFeed(); ' +
    'NMHBtn.enabled = false; }'),
  row('DefineButton2_30/BUTTONCONDACTION on(release).as',
    glossaryHandler('Question')),
  row('DefineButton2_31/BUTTONCONDACTION on(release).as',
    glossaryHandler('Represented', {strayQ: true})),
  row('DefineButton2_32/BUTTONCONDACTION on(release).as',
    glossaryHandler('Y-intercept')),
  row('DefineSprite_600/frame_20/DoAction.as', retry),
  row('DefineSprite_601/frame_20/DoAction.as', retry),
  row('DefineSprite_602/frame_20/DoAction.as', retry),
  row('DefineSprite_500/frame_700/DoAction.as',
    'stop(); _global.quizSection = true; _global.quizTryCount = 0; ' +
    'Mc_Popup._visible = false;'),
];
const structure = Object.freeze({mainObjectId: 500, mainFrameCount: 900});

test('TS07 command receipt excludes volatile FFDec progress text', () => {
  const first = stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.from('Exported /tmp/a/frame.as, 00:00.001\n'),
    stderr: Buffer.alloc(0)});
  const second = stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.from('Exported /tmp/b/frame.as, 00:00.999\n'),
    stderr: Buffer.alloc(0)});
  assert.deepEqual(first, second);
  assert.equal(first.stdout.recorded, false);
});

test('TS07 command receipt rejects failed or noisy exports', () => {
  assert.throws(() => stableFfdecCommandReceipt({code: 1, signal: null,
    stdout: Buffer.alloc(0), stderr: Buffer.from('failed')}),
  /FFDec script export failed/u);
  assert.throws(() => stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.alloc(0), stderr: Buffer.from('warning')}),
  /FFDec script export emitted stderr/u);
});

test('TS07 classifier preserves quiz, retry, and glossary behavior', () => {
  const result = classifyTs07Scripts(fixture(), structure, '0'.repeat(64));
  assert.deepEqual(result.answers.map((answer) => answer.result),
    ['wrong', 'right']);
  assert.equal(result.rightAnswerCharacterId, 20);
  assert.deepEqual(result.glossaryButtons.map((button) => ({
    key: button.sourceKeyAttribute,
    strayQ: button.strayQExpressionPresent,
  })), [
    {key: 'Question', strayQ: false},
    {key: 'Represented', strayQ: true},
    {key: 'Y-intercept', strayQ: false},
  ]);
  assert.equal(result.allWrongFeedbackTerminalScripts.length, 3);
  assert.equal(result.quizStop.frame, 700);
  assert.deepEqual(result.globalNames,
    ['KeyAttribute', 'quizSection', 'quizTryCount']);
});

test('TS07 classifier rejects retry or host-surface drift', () => {
  const changedRetry = fixture();
  changedRetry[7] = row(changedRetry[7].path,
    changedRetry[7].text.replace('>= 2', '>= 3'));
  assert.throws(() => classifyTs07Scripts(changedRetry, structure,
    '0'.repeat(64)), /retry\/resume shape drifted/u);

  assert.throws(() => classifyTs07Scripts([
    ...fixture(), row('DefineSprite_700/frame_1/DoAction.as', 'eval("x");'),
  ], structure, '0'.repeat(64)), /host-call surface drifted/u);
});
