import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {SOURCE} from './audit-g678-nms-l09-p003-source.mjs';
import {auditP003AudioStream} from
  './prepare-g678-nms-l09-p003-source-audio-v1.mjs';

const sourceRoot =
  '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';

test('P003 extracts one complete MP3 stream across the authored empty frame',
  async () => {
    assert.equal(process.env.HELP_MATH_G678_SOURCE_ROOT, sourceRoot);
    const source = await readFile(path.join(sourceRoot, SOURCE.path));
    const {stream, sumSamples} = auditP003AudioStream(source);
    assert.equal(stream.blocks.length, 635);
    assert.deepEqual(stream.blocks[1],
      {frame: 2, samples: 0, seek: 0, mp3Bytes: 0});
    assert.equal(sumSamples, 1165824);
    assert.equal(stream.mp3.length, 263120);
    assert.equal(createHash('sha256').update(stream.mp3).digest('hex'),
      'a8ca1683d3f7848f16f9be96e3472c41594485a853778defc96cebfe6243307f');
  });

test('P003 audio audit rejects changed source bytes', async () => {
  const source = Buffer.from(await readFile(path.join(sourceRoot, SOURCE.path)));
  source[150] ^= 1;
  assert.throws(() => auditP003AudioStream(source));
});
