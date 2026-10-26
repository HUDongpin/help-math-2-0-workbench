import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildP003AssetInventory} from './materialize-g678-alg-l06-p003-asset-inventory-v1.mjs';

test('P003 asset inventory binds all FFDec source definitions and one generated candidate', () => {
  const bytes = buildP003AssetInventory(process.env.HELP_MATH_G678_SOURCE_ROOT);
  const rows = bytes.toString().trimEnd().split('\n');
  assert.equal(rows.length, 154);
  assert.equal(rows.filter(row => row.startsWith('images-')).length, 7);
  assert.equal(rows.filter(row => row.startsWith('shapes-')).length, 129);
  assert.equal(rows.filter(row => row.startsWith('texts-')).length, 16);
  assert.equal(rows.filter(row => row.startsWith('canvas-renderer.js,')).length, 1);
  assert(rows.some(row => row.includes('Source text character 125: M = $0.50 ∙ C')));
  assert(rows.some(row => row.includes('Source clip mask at depth 1 through 94')));
  assert(rows.at(-1).includes('Unregistered drawing asset'));
});

test('P003 asset inventory rejects a missing or compatibility source root', () => {
  assert.throws(() => buildP003AssetInventory(undefined), /exact source root/u);
  assert.throws(() => buildP003AssetInventory('/Volumes/WestWorld/HELP MATH 2.0/source-assets'),
    /exact source root/u);
});
