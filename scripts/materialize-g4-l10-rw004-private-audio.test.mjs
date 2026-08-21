import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  EXPECTED_RW004_AUDIO,
  materializeG4L10Rw004PrivateAudio,
  parseArguments,
} from './materialize-g4-l10-rw004-private-audio.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('RW004 freezes one embedded cue and one Spanish host track', () => {
  assert.deepEqual(
    {
      embedded: {
        characterId: EXPECTED_RW004_AUDIO.embedded.characterId,
        headFrame: EXPECTED_RW004_AUDIO.embedded.headFrame,
        firstFrame: EXPECTED_RW004_AUDIO.embedded.firstFrame,
        lastFrame: EXPECTED_RW004_AUDIO.embedded.lastFrame,
        endFrame: EXPECTED_RW004_AUDIO.embedded.endFrame,
        bytes: EXPECTED_RW004_AUDIO.embedded.bytes,
      },
      spanish: {
        bytes: EXPECTED_RW004_AUDIO.spanish.bytes,
        durationMs: EXPECTED_RW004_AUDIO.spanish.durationMs,
      },
    },
    {
      embedded: {
        characterId: 109,
        headFrame: 1,
        firstFrame: 16,
        lastFrame: 1325,
        endFrame: 1326,
        bytes: 543010,
      },
      spanish: {bytes: 392784, durationMs: 28056},
    },
  );
});

test('RW004 private audio materialization is reproducible and full-EOF decoded', async () => {
  const result = await materializeG4L10Rw004PrivateAudio({root, check: true});
  assert.equal(result.status, 'current');
  assert.equal(result.outputs.length, 4);
});

test('RW004 private audio arguments fail closed', () => {
  assert.deepEqual(parseArguments(['--check']), {root, check: true});
  assert.throws(() => parseArguments(['--unknown']), /Unknown argument/);
  assert.throws(() => parseArguments(['--project-root']), /requires a value/);
});

test('RW004 private audio check rejects a root without the frozen inputs', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'g4-l10-rw004-audio-'));
  await mkdir(path.join(fixture, 'catalog'), {recursive: true});
  await writeFile(path.join(fixture, 'catalog', 'sentinel'), 'preserve');
  await assert.rejects(
    materializeG4L10Rw004PrivateAudio({root: fixture, check: true}),
  );
});

