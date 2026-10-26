import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {buildTitleData} from './build-g678-alg-l06-p001-title-data.mjs';

test('P001 title data generation is exact and cannot overwrite a peer output', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'g678-p001-title-data-test-'));
  const output = path.join(directory, 'candidate.ts');
  try {
    await assert.rejects(buildTitleData({check: true, output}), {code: 'ENOENT'});
    const built = await buildTitleData({output});
    assert.equal(built.frameCount, 134);
    const before = createHash('sha256').update(await readFile(output)).digest('hex');
    assert.equal(before, built.sha256);
    await buildTitleData({check: true, output});
    await assert.rejects(buildTitleData({output}), {code: 'EEXIST'});
    const after = createHash('sha256').update(await readFile(output)).digest('hex');
    assert.equal(after, before);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
