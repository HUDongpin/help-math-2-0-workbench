import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyTs05Scripts,
  stableFfdecCommandReceipt,
} from './audit-g678-ts05-family.mjs';

const handler = (key) =>
  `on(release){\r\n   _global.KeyAttribute = "${key}";\r\n` +
  '   _root.DoHyperLinks();\r\n' +
  '   _root.animation_mc.animation.stop();\r\n}\r\n';
const row = (path, text) => ({path, text, bytes: Buffer.byteLength(text),
  sha256: 'a'.repeat(64)});
const rootRows = () => [
  row('frame_1/DoAction.as',
    '_level0.InternalPreloader.gotoAndPlay("jump_check");\r\nstop();\r\n'),
  row('frame_6/DoAction.as', 'stop();\r\n'),
];
const buttonRows = (ids, keys) => ids.map((id, index) =>
  row(`DefineButton2_${id}/BUTTONCONDACTION on(release).as`,
    handler(keys[index])));

test('TS05 command receipt excludes volatile FFDec progress text', () => {
  const first = stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.from('Exported /tmp/a/frame.as, 00:00.001\n'),
    stderr: Buffer.alloc(0)});
  const second = stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.from('Exported /tmp/b/frame.as, 00:00.999\n'),
    stderr: Buffer.alloc(0)});
  assert.deepEqual(first, second);
  assert.equal(first.stdout.recorded, false);
});

test('TS05 command receipt rejects failed or noisy exports', () => {
  assert.throws(() => stableFfdecCommandReceipt({code: 1, signal: null,
    stdout: Buffer.alloc(0), stderr: Buffer.from('failed')}),
  /FFDec script export failed/u);
  assert.throws(() => stableFfdecCommandReceipt({code: 0, signal: null,
    stdout: Buffer.alloc(0), stderr: Buffer.from('warning')}),
  /FFDec script export emitted stderr/u);
});

test('TS05 classifier preserves an exact five-key source sequence', () => {
  const ids = [12, 13, 19, 61, 62];
  const keys = ['strategies', 'equation', 'Pattern',
    'Simple / Simpler / Simplest', 'Table'];
  const result = classifyTs05Scripts([
    ...buttonRows(ids, keys), ...rootRows(),
  ], {mainObjectId: 67, mainFrameCount: 263,
    buttonCharacterIds: ids}, '0'.repeat(64));
  assert.deepEqual(result.buttons.map((button) => button.sourceKeyAttribute),
    keys);
  assert.equal(result.terminalChildStop.present, false);
});

test('TS05 classifier preserves the exact ten-button ALG L1 variant', () => {
  const digest = '0'.repeat(64);
  const ids = [14, 15, 77, 78, 103, 104, 105, 106, 107, 108];
  const keys = ['strategies', 'equation', 'Pattern',
    'Simple / Simpler / Simplest', 'table', 'equation', 'Pattern', 'table',
    'strategies', 'Show'];
  const result = classifyTs05Scripts([
    ...buttonRows(ids, keys), ...rootRows(),
  ], {mainObjectId: 109, mainFrameCount: 274,
    buttonCharacterIds: ids}, digest);
  assert.deepEqual(result.buttons.map((button) => button.sourceKeyAttribute),
    keys);
});

test('TS05 special source requires its exact terminal child stop', () => {
  const digest =
    '8d9d70a69611927caed07206c55315b38ebc74f6d16fb00270dfb5ae76af0c94';
  const ids = [18, 19, 26, 61, 62, 63, 64];
  const keys = ['strategies', 'equation', 'Pattern',
    'Simple / Simpler / Simplest', 'table', 'Show', 'Show'];
  const files = [...buttonRows(ids, keys),
    row('DefineSprite_67/frame_274/DoAction.as', 'stop();\r\n'),
    ...rootRows()];
  const result = classifyTs05Scripts(files,
    {mainObjectId: 67, mainFrameCount: 274,
      buttonCharacterIds: ids}, digest);
  assert.deepEqual(result.terminalChildStop, {
    present: true, frame: 274, disposition: 'exact-static-script-proven',
  });
  assert.throws(() => classifyTs05Scripts(files.filter((entry) =>
    !entry.path.startsWith('DefineSprite_')), {
    mainObjectId: 67, mainFrameCount: 274,
    buttonCharacterIds: ids,
  }, digest), /exact script count drifted/u);
});

test('TS05 classifier rejects a changed source key or host operation', () => {
  const ids = [12, 13, 19, 61, 62];
  const keys = ['strategies', 'equation', 'Pattern',
    'Simple / Simpler / Simplest', 'Table'];
  const files = [...buttonRows(ids, keys), ...rootRows()];
  files[0] = row(files[0].path,
    files[0].text.replace('_root.DoHyperLinks();', '_root.Other();'));
  assert.throws(() => classifyTs05Scripts(files,
    {mainObjectId: 67, mainFrameCount: 263,
      buttonCharacterIds: ids}, '0'.repeat(64)),
  /button handler shape drifted/u);
});
