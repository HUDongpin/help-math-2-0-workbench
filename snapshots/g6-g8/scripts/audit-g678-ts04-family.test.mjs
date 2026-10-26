import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyTs04Scripts,
  stableFfdecCommandReceipt,
} from './audit-g678-ts04-family.mjs';

const handler = (key) =>
  `on(release){\r\n   _global.KeyAttribute = "${key}";\r\n` +
  '   _root.DoHyperLinks();\r\n' +
  '   _root.animation_mc.animation.stop();\r\n}\r\n';
const row = (path, text) => ({path, text, bytes: Buffer.byteLength(text),
  sha256: 'a'.repeat(64)});
const rootRows = (special = false) => [
  row('frame_1/DoAction.as',
    '_level0.InternalPreloader.gotoAndPlay("jump_check");\r\n' +
      (special ? 'stop();\r\n' : '')),
  row('frame_6/DoAction.as', 'stop();\r\n'),
];
const buttonRows = (ids, keys) => ids.map((id, index) =>
  row(`DefineButton2_${id}/BUTTONCONDACTION on(release).as`,
    handler(keys[index])));

test('TS04 command receipt excludes volatile FFDec progress text', () => {
  const first = stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.from('Exported /tmp/a/frame.as, 00:00.001\n'),
    stderr: Buffer.alloc(0)});
  const second = stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.from('Exported /tmp/b/frame.as, 00:00.999\n'),
    stderr: Buffer.alloc(0)});
  assert.deepEqual(first, second);
  assert.equal(first.stdout.recorded, false);
});

test('TS04 command receipt rejects failed or noisy exports', () => {
  assert.throws(() => stableFfdecCommandReceipt({code: 1, signal: null,
    stdout: Buffer.alloc(0), stderr: Buffer.from('failed')}),
  /FFDec script export failed/u);
  assert.throws(() => stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.alloc(0), stderr: Buffer.from('warning')}),
  /FFDec script export emitted stderr/u);
});

test('TS04 classifier preserves the exact seven-key source sequence', () => {
  const ids = [12, 13, 19, 61, 62, 63, 64];
  const keys = ['Solve', 'Problem', 'strategies', 'Equation', 'Pattern',
    'Table', 'Simple / Simpler / Simplest'];
  const result = classifyTs04Scripts([
    ...buttonRows(ids, keys), ...rootRows(),
  ], {mainObjectId: 67, mainFrameCount: 282,
    buttonCharacterIds: ids}, '0'.repeat(64));
  assert.deepEqual(result.buttons.map((button) => button.sourceKeyAttribute),
    keys);
  assert.equal(result.terminalChildStop.present, false);
});

test('TS04 classifier preserves the exact nine-button ALG L1 variant', () => {
  const digest =
    '1cc636b802262f172974ae08148123f32c66a51914eef7b20174fb11562a6f55';
  const ids = [14, 15, 77, 78, 103, 104, 105, 106, 107];
  const keys = ['Solve', 'strategies', 'strategies', 'Data tables',
    'Equation', 'Pattern', 'Table', 'Simple / Simpler / Simplest', 'problem'];
  const result = classifyTs04Scripts([
    ...buttonRows(ids, keys), ...rootRows(),
  ], {mainObjectId: 108, mainFrameCount: 282,
    buttonCharacterIds: ids}, digest);
  assert.deepEqual(result.buttons.map((button) => button.sourceKeyAttribute),
    keys);
});

test('TS04 special source requires its exact terminal child stop', () => {
  const digest =
    '5aab5af3e867255098af58652ca8a3fc752eaaab78794ad2198baf735ea7c018';
  const ids = [18, 19, 26, 61, 62, 63, 64];
  const keys = ['Solve', 'Problem', 'strategies', 'Equation', 'Pattern',
    'Table', 'Simple / Simpler / Simplest'];
  const files = [...buttonRows(ids, keys),
    row('DefineSprite_67/frame_328/DoAction.as', 'stop();\r\n'),
    ...rootRows(true)];
  const result = classifyTs04Scripts(files,
    {mainObjectId: 67, mainFrameCount: 328,
      buttonCharacterIds: ids}, digest);
  assert.deepEqual(result.terminalChildStop, {
    present: true, frame: 328, disposition: 'exact-static-script-proven',
  });
  assert.throws(() => classifyTs04Scripts(files.filter((entry) =>
    !entry.path.startsWith('DefineSprite_')), {
    mainObjectId: 67, mainFrameCount: 328,
    buttonCharacterIds: ids,
  }, digest), /exact script count drifted/u);
});

test('TS04 classifier rejects a changed source key or host operation', () => {
  const ids = [12, 13, 19, 61, 62, 63, 64];
  const keys = ['Solve', 'Problem', 'strategies', 'Equation', 'Pattern',
    'Table', 'Simple / Simpler / Simplest'];
  const files = [...buttonRows(ids, keys), ...rootRows()];
  files[0] = row(files[0].path,
    files[0].text.replace('_root.DoHyperLinks();', '_root.Other();'));
  assert.throws(() => classifyTs04Scripts(files,
    {mainObjectId: 67, mainFrameCount: 282,
      buttonCharacterIds: ids}, '0'.repeat(64)),
  /button handler shape drifted/u);
});
