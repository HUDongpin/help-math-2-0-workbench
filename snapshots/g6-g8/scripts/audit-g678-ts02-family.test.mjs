import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyTs02Scripts,
  stableFfdecCommandReceipt,
} from './audit-g678-ts02-family.mjs';

const restate =
  'on(release){\r\n   _global.KeyAttribute = "Restate";\r\n' +
  '   _root.DoHyperLinks();\r\n   _root.animation_mc.animation.stop();\r\n}\r\n';
const question =
  'on(release){\r\n   _global.KeyAttribute = "question";\r\n' +
  '   _root.DoHyperLinks();\r\n   _root.animation_mc.animation.stop();\r\n}\r\n';
const problem =
  'on(release){\r\n   _global.KeyAttribute = "problem";\r\n' +
  '   _root.DoHyperLinks();\r\n   _root.animation_mc.animation.stop();\r\n}\r\n';
const row = (path, text) => ({path, text, bytes: Buffer.byteLength(text),
  sha256: 'a'.repeat(64)});

test('TS02 command receipt excludes volatile FFDec progress text', () => {
  const first = stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.from('Exported /tmp/staging-a/frame.as, 00:00.001\n'),
    stderr: Buffer.alloc(0)});
  const second = stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.from('Exported /tmp/staging-b/frame.as, 00:00.987\n'),
    stderr: Buffer.alloc(0)});
  assert.deepEqual(first, second);
  assert.equal(first.stdout.recorded, false);
});

test('TS02 command receipt rejects failed or noisy exports', () => {
  assert.throws(() => stableFfdecCommandReceipt({code: 1, signal: null,
    stdout: Buffer.alloc(0), stderr: Buffer.from('failed')}),
  /FFDec script export failed/u);
  assert.throws(() => stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.alloc(0), stderr: Buffer.from('warning')}),
  /FFDec script export emitted stderr/u);
});

test('TS02 exact handler classifier preserves three source keys and host stop', () => {
  const result = classifyTs02Scripts([
    row('DefineButton2_12/BUTTONCONDACTION on(release).as', restate),
    row('DefineButton2_13/BUTTONCONDACTION on(release).as', question),
    row('DefineButton2_20/BUTTONCONDACTION on(release).as', problem),
    row('frame_1/DoAction.as',
      '_level0.InternalPreloader.gotoAndPlay("jump_check");\r\nstop();\r\n'),
    row('frame_6/DoAction.as', 'stop();\r\n'),
  ], {mainObjectId: 24, mainFrameCount: 324,
    buttonCharacterIds: [12, 13, 20]}, '0'.repeat(64));
  assert.deepEqual(result.buttons.map(({characterId, sourceKeyAttribute}) =>
    ({characterId, sourceKeyAttribute})), [
    {characterId: 12, sourceKeyAttribute: 'Restate'},
    {characterId: 13, sourceKeyAttribute: 'question'},
    {characterId: 20, sourceKeyAttribute: 'problem'},
  ]);
  assert.equal(result.terminalChildStop.present, false);
  assert.deepEqual(result.operationSequence, [
    'literal _global.KeyAttribute assignment',
    '_root.DoHyperLinks() host request',
    '_root.animation_mc.animation.stop()',
  ]);
});

test('TS02 exact handler classifier rejects source behavior drift', () => {
  const files = [
    row('DefineButton2_12/BUTTONCONDACTION on(release).as',
      restate.replace('Restate', 'Repeat')),
    row('DefineButton2_13/BUTTONCONDACTION on(release).as', question),
    row('DefineButton2_20/BUTTONCONDACTION on(release).as', problem),
    row('frame_1/DoAction.as',
      '_level0.InternalPreloader.gotoAndPlay("jump_check");\r\nstop();\r\n'),
    row('frame_6/DoAction.as', 'stop();\r\n'),
  ];
  assert.throws(() => classifyTs02Scripts(files,
    {mainObjectId: 24, mainFrameCount: 324,
      buttonCharacterIds: [12, 13, 20]}, '0'.repeat(64)),
  /button handler shape drifted/u);
});

test('TS02 special source requires its exact terminal child stop', () => {
  const digest =
    'a6fd25e774af5ddf093b1da130275ca23bcb1a6b355c148ab888c32422da7898';
  const files = [
    row('DefineButton2_16/BUTTONCONDACTION on(release).as', restate),
    row('DefineButton2_17/BUTTONCONDACTION on(release).as', question),
    row('DefineButton2_23/BUTTONCONDACTION on(release).as', problem),
    row('DefineSprite_27/frame_354/DoAction.as', 'stop();\r\n'),
    row('frame_1/DoAction.as',
      '_level0.InternalPreloader.gotoAndPlay("jump_check");\r\nstop();\r\n'),
    row('frame_6/DoAction.as', 'stop();\r\n'),
  ];
  const result = classifyTs02Scripts(files,
    {mainObjectId: 27, mainFrameCount: 354,
      buttonCharacterIds: [16, 17, 23]}, digest);
  assert.deepEqual(result.terminalChildStop, {
    present: true,
    frame: 354,
    disposition: 'exact-static-script-proven',
  });
  assert.throws(() => classifyTs02Scripts(files.filter((entry) =>
    !entry.path.startsWith('DefineSprite_')), {
    mainObjectId: 27, mainFrameCount: 354,
    buttonCharacterIds: [16, 17, 23],
  }, digest), /exact script count drifted/u);
});
