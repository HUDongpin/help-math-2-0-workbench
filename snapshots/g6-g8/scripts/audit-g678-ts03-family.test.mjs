import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyTs03Scripts,
  stableFfdecCommandReceipt,
} from './audit-g678-ts03-family.mjs';

const organize =
  'on(release){\r\n   _global.KeyAttribute = "Organize";\r\n' +
  '   _root.DoHyperLinks();\r\n   _root.animation_mc.animation.stop();\r\n}\r\n';
const information =
  'on(release){\r\n   _global.KeyAttribute = "Information";\r\n' +
  '   _root.DoHyperLinks();\r\n   _root.animation_mc.animation.stop();\r\n}\r\n';
const row = (path, text) => ({path, text, bytes: Buffer.byteLength(text),
  sha256: 'a'.repeat(64)});

test('TS03 command receipt excludes volatile FFDec progress text', () => {
  const first = stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.from('Exported /tmp/staging-a/frame.as, 00:00.001\n'),
    stderr: Buffer.alloc(0)});
  const second = stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.from('Exported /tmp/staging-b/frame.as, 00:00.987\n'),
    stderr: Buffer.alloc(0)});
  assert.deepEqual(first, second);
  assert.equal(first.stdout.recorded, false);
});

test('TS03 command receipt rejects failed or noisy exports', () => {
  assert.throws(() => stableFfdecCommandReceipt({code: 1, signal: null,
    stdout: Buffer.alloc(0), stderr: Buffer.from('failed')}),
  /FFDec script export failed/u);
  assert.throws(() => stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.alloc(0), stderr: Buffer.from('warning')}),
  /FFDec script export emitted stderr/u);
});

test('TS03 exact handler classifier preserves two source keys and host stop', () => {
  const result = classifyTs03Scripts([
    row('DefineButton2_17/BUTTONCONDACTION on(release).as', organize),
    row('DefineButton2_18/BUTTONCONDACTION on(release).as', information),
    row('frame_1/DoAction.as',
      '_level0.InternalPreloader.gotoAndPlay("jump_check");\r\n'),
    row('frame_6/DoAction.as', 'stop();\r\n'),
  ], {mainObjectId: 25, mainFrameCount: 223,
    buttonCharacterIds: [17, 18]}, '0'.repeat(64));
  assert.deepEqual(result.buttons.map(({characterId, sourceKeyAttribute}) =>
    ({characterId, sourceKeyAttribute})), [
    {characterId: 17, sourceKeyAttribute: 'Organize'},
    {characterId: 18, sourceKeyAttribute: 'Information'},
  ]);
  assert.equal(result.terminalChildStop.present, false);
  assert.deepEqual(result.operationSequence, [
    'literal _global.KeyAttribute assignment',
    '_root.DoHyperLinks() host request',
    '_root.animation_mc.animation.stop()',
  ]);
});

test('TS03 exact handler classifier rejects source behavior drift', () => {
  const files = [
    row('DefineButton2_17/BUTTONCONDACTION on(release).as',
      organize.replace('Organize', 'Organization')),
    row('DefineButton2_18/BUTTONCONDACTION on(release).as', information),
    row('frame_1/DoAction.as',
      '_level0.InternalPreloader.gotoAndPlay("jump_check");\r\n'),
    row('frame_6/DoAction.as', 'stop();\r\n'),
  ];
  assert.throws(() => classifyTs03Scripts(files,
    {mainObjectId: 25, mainFrameCount: 223,
      buttonCharacterIds: [17, 18]}, '0'.repeat(64)),
  /button handler shape drifted/u);
});

test('TS03 special source requires its exact terminal child stop', () => {
  const digest =
    '193a429150e88c623e5c5d1368fc888fd63ae46841fd74ba53e39eaeca350f58';
  const files = [
    row('DefineButton2_17/BUTTONCONDACTION on(release).as', organize),
    row('DefineButton2_18/BUTTONCONDACTION on(release).as', information),
    row('DefineSprite_25/frame_234/DoAction.as', 'stop();\r\n'),
    row('frame_1/DoAction.as',
      '_level0.InternalPreloader.gotoAndPlay("jump_check");\r\nstop();\r\n'),
    row('frame_6/DoAction.as', 'stop();\r\n'),
  ];
  const result = classifyTs03Scripts(files,
    {mainObjectId: 25, mainFrameCount: 234,
      buttonCharacterIds: [17, 18]}, digest);
  assert.deepEqual(result.terminalChildStop, {
    present: true,
    frame: 234,
    disposition: 'exact-static-script-proven',
  });
  assert.throws(() => classifyTs03Scripts(files.filter((entry) =>
    !entry.path.startsWith('DefineSprite_')), {
    mainObjectId: 25, mainFrameCount: 234,
    buttonCharacterIds: [17, 18],
  }, digest), /exact script count drifted/u);
});
