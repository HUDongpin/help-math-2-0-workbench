import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync, rmSync, symlinkSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildP003Audit} from './audit-g678-alg-l06-p003-source-v1.mjs';

const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;

test('P003 audit binds one source page, exact two audio runs, source equation and no acceptance',
  {skip: !sourceRoot}, () => {
    const result = buildP003Audit(sourceRoot), audit = JSON.parse(result.audit);
    assert.equal(audit.source.sha256, 'c3d265b61aedccc48e679cbecfe6424a2a78f2a9cb5cfa2a33791fa124933766');
    assert.deepEqual(audit.frameDomains.map(domain => [domain.id, domain.frames]),
      [['root', 10], ['sprite-154', 719], ['sprite-158', 1]]);
    assert.deepEqual(audit.embeddedStream.runs.map(run => [run.firstFrame, run.lastFrame]), [[41, 501], [544, 719]]);
    assert.deepEqual(audit.embeddedStream.gap, {firstFrame: 502, lastFrame: 543});
    assert.deepEqual(audit.embeddedStream.emptyBlocks.map(block => [block.frame, block.seek]), [[42, 0], [501, -2276]]);
    assert(audit.sourceText.definitions.some(item => item.text === 'M = $0.50 ∙ C'));
    assert.equal(audit.separateSaCandidate.disposition, 'relationship-to-embedded-stream-unresolved');
    assert(Object.values(audit.acceptance).every(value => value === false));
    assert.equal(result.mp3.length, result.runOne.length + result.runTwo.length);
  });

test('P003 audit rejects a symlink source root before opening any source', () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'g678-p003-root-'));
  try {
    symlinkSync(directory, path.join(directory, 'alias'));
    assert.throws(() => buildP003Audit(path.join(directory, 'alias')), /real source root/);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
