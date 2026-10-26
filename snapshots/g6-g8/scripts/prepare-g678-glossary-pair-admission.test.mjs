import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {buildPairAdmissionPlan, preparePairAdmission} from './prepare-g678-glossary-pair-admission.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('../', import.meta.url)));

test('P013 producer requires the real source root before any host or registry read', () => {
  assert.throws(() => buildPairAdmissionPlan({root: ROOT, sourceRoot: '/tmp'}),
    /physical authorized root/);
  assert.throws(() => buildPairAdmissionPlan({root: ROOT, sourceRoot: ''}),
    /physical authorized root/);
});

test('exclusive candidate output precheck makes a conflicting freeze fail before writing', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'g678-p013-admission-'));
  try {
    const freeze = 'catalog/product-bridge-calibrations/existing.json';
    fs.mkdirSync(path.join(temp, path.dirname(freeze)), {recursive: true});
    fs.writeFileSync(path.join(temp, freeze), 'preserved\n');
    assert.throws(() => preparePairAdmission({outputs: [{path: freeze, bytes: Buffer.from('new\n')}]}, temp),
      /immutable outputs absent/);
    assert.equal(fs.readFileSync(path.join(temp, freeze), 'utf8'), 'preserved\n');
    assert.equal(fs.existsSync(path.join(temp, 'work/g678-workflow/candidates/shared-alg001-l12-p013-v2.json')), false);
  } finally {fs.rmSync(temp, {recursive: true, force: true});}
});
