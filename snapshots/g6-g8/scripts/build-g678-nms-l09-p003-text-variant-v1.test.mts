import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
import {buildP003TextVariant, writeCandidateExclusive} from
  './build-g678-nms-l09-p003-text-variant-v1.mts';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/NMS002/L9/RW/L9RW03.swf';
const SAFE = path.join(ROOT,
  'work/g678-shared-page-factory/g678-nms-l09-p003-root-held-candidate-v1/canvas-renderer.js');
const SHA = bytes => createHash('sha256').update(bytes).digest('hex');

test('fifteen text and seven outline instances cover 4,508 draw calls',
  async () => {
    const catalog = collectSwfTextSourceCatalog(await readFile(SOURCE));
    const safe = await readFile(SAFE, 'utf8');
    const result = buildP003TextVariant(safe, catalog);
    assert.equal(result.matchedCallCount, 4508);
    assert.equal(result.boundInstances.length, 15);
    assert.equal(result.boundEmphasisShapeInstances.length, 6);
    assert.equal(result.boundOutlineInstance,
      'root:298:1:249/sprite-249:1:1:248');
    assert(result.code.includes('renderWithText: __p003RenderWithText'));
    assert(result.code.includes('HELP_MATH_P003_TEXT_CANDIDATES'));
    assert(!result.code.includes('HELP_MATH_CANVAS_ASSETS'));
    for (const preserved of ['text155', 'shape229', 'shape236']) {
      const call = `place("${preserved}"`;
      assert(safe.includes(call));
      assert.equal(result.code.split(call).length,
        safe.split(call).length, `${preserved} prop/highlight calls changed`);
    }
    assert.equal(SHA(safe),
      'b3ca4454098121e236876cdf89882bef55752ae44c220976ecc032f4a01e43da');
    assert.throws(() => buildP003TextVariant(safe + ' ', catalog),
      /safe JavaScript drift/u);
    assert.throws(() => buildP003TextVariant(safe,
      {...catalog, sourceSha256: '0'.repeat(64)}), /text catalog drift/u);
  });

test('exclusive output creation tolerates identical races and rejects collisions',
  async () => {
    const temp = await mkdtemp(path.join(os.tmpdir(), 'g678-p003-text-wx-'));
    const file = path.join(temp, 'candidate.js');
    try {
      const first = Buffer.from('source-bound');
      await Promise.all([
        writeCandidateExclusive([[file, first]]),
        writeCandidateExclusive([[file, first]]),
      ]);
      assert.equal((await readFile(file)).toString(), 'source-bound');
      await assert.rejects(writeCandidateExclusive([[file,
        Buffer.from('different')]]), /output collision/u);
      assert.equal((await readFile(file)).toString(), 'source-bound');
      await writeCandidateExclusive([[file, first]], true);
    } finally {
      await rm(temp, {recursive: true, force: true});
    }
  });
