import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  EXPECTED_IN009_AUDIO,
  materializeG4L10In009PrivateAudio,
  parseArguments,
} from './materialize-g4-l10-in009-private-audio.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('IN009 freezes one 953-frame embedded cue and one Spanish host track', () => {
  assert.deepEqual(
    {
      embedded: {
        characterId: EXPECTED_IN009_AUDIO.embedded.characterId,
        headFrame: EXPECTED_IN009_AUDIO.embedded.headFrame,
        firstFrame: EXPECTED_IN009_AUDIO.embedded.firstFrame,
        lastFrame: EXPECTED_IN009_AUDIO.embedded.lastFrame,
        endFrame: EXPECTED_IN009_AUDIO.embedded.endFrame,
        blockCount: EXPECTED_IN009_AUDIO.embedded.blockCount,
        bytes: EXPECTED_IN009_AUDIO.embedded.bytes,
      },
      spanish: {
        bytes: EXPECTED_IN009_AUDIO.spanish.bytes,
        durationMs: EXPECTED_IN009_AUDIO.spanish.durationMs,
      },
    },
    {
      embedded: {
        characterId: 89,
        headFrame: 1,
        firstFrame: 1,
        lastFrame: 953,
        endFrame: 954,
        blockCount: 953,
        bytes: 395070,
      },
      spanish: {bytes: 613536, durationMs: 43824},
    },
  );
});

test('IN009 private audio materialization is reproducible and full-EOF decoded', async () => {
  const result = await materializeG4L10In009PrivateAudio({root, check: true});
  assert.equal(result.status, 'current');
  assert.equal(result.outputs.length, 4);
});

test('IN009 private audio arguments fail closed', () => {
  assert.deepEqual(parseArguments(['--check']), {root, check: true});
  assert.throws(() => parseArguments(['--unknown']), /Unknown argument/);
  assert.throws(() => parseArguments(['--project-root']), /requires a value/);
});

test('IN009 private audio check rejects a root without the frozen inputs', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'g4-l10-in009-audio-'));
  await mkdir(path.join(fixture, 'catalog'), {recursive: true});
  await writeFile(path.join(fixture, 'catalog', 'sentinel'), 'preserve');
  await assert.rejects(
    materializeG4L10In009PrivateAudio({root: fixture, check: true}),
  );
});
