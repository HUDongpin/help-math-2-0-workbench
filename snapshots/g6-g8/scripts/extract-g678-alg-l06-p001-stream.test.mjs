import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, rm, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {extractG678AlgL06P001Stream} from './extract-g678-alg-l06-p001-stream.mjs';

const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;

test('P001 source stream extraction is exact, checkable, and never overwrites', {
  skip: !sourceRoot && 'real G6-G8 source root not configured',
}, async () => {
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'g678-p001-extraction-test-'));
  const options = {sourceRoot, projectRoot};
  const audioPath = path.join(projectRoot, 'migrations/shared-alg001-l06-p001/assets/source-stream-142.mp3');
  try {
    await assert.rejects(extractG678AlgL06P001Stream({...options, check: true}));
    const written = await extractG678AlgL06P001Stream(options);
    assert.equal(written.blockCount, 134);
    assert.equal(written.sampleCount, 245952);
    const before = createHash('sha256').update(await readFile(audioPath)).digest('hex');
    assert.equal(before, written.mp3Sha256);
    await extractG678AlgL06P001Stream({...options, check: true});
    await assert.rejects(extractG678AlgL06P001Stream(options), {code: 'EEXIST'});
    const after = createHash('sha256').update(await readFile(audioPath)).digest('hex');
    assert.equal(after, before);
  } finally {
    await rm(projectRoot, {recursive: true, force: true});
  }
});

test('P001 extraction rejects a compatibility symlink as its source root', {
  skip: !sourceRoot && 'real G6-G8 source root not configured',
}, async () => {
  const projectRoot = await mkdtemp(path.join(tmpdir(), 'g678-p001-symlink-test-'));
  try {
    const linkedRoot = path.join(projectRoot, 'linked-source');
    await symlink(sourceRoot, linkedRoot);
    await assert.rejects(
      extractG678AlgL06P001Stream({sourceRoot: linkedRoot, projectRoot}),
      /real directory, not a symlink/,
    );
  } finally {
    await rm(projectRoot, {recursive: true, force: true});
  }
});
