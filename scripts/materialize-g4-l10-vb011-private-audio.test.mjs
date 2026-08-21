import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  EXPECTED_VB011_AUDIO,
  materializeG4L10Vb011PrivateAudio,
  parseArguments,
} from './materialize-g4-l10-vb011-private-audio.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('VB011 freezes one embedded cue and one Spanish host track', () => {
  assert.deepEqual(
    {
      embedded: {
        characterId: EXPECTED_VB011_AUDIO.embedded.characterId,
        headFrame: EXPECTED_VB011_AUDIO.embedded.headFrame,
        firstFrame: EXPECTED_VB011_AUDIO.embedded.firstFrame,
        lastFrame: EXPECTED_VB011_AUDIO.embedded.lastFrame,
        endFrame: EXPECTED_VB011_AUDIO.embedded.endFrame,
        bytes: EXPECTED_VB011_AUDIO.embedded.bytes,
      },
      spanish: {
        bytes: EXPECTED_VB011_AUDIO.spanish.bytes,
        durationMs: EXPECTED_VB011_AUDIO.spanish.durationMs,
      },
    },
    {
      embedded: {
        characterId: 31,
        headFrame: 1,
        firstFrame: 2,
        lastFrame: 153,
        endFrame: 154,
        bytes: 62920,
      },
      spanish: {bytes: 187152, durationMs: 13368},
    },
  );
});

test('VB011 private audio materialization is reproducible and full-EOF decoded', async () => {
  const result = await materializeG4L10Vb011PrivateAudio({root, check: true});
  assert.equal(result.status, 'current');
  assert.equal(result.outputs.length, 4);
});

test('VB011 private audio arguments fail closed', () => {
  assert.deepEqual(parseArguments(['--check']), {root, check: true});
  assert.throws(() => parseArguments(['--unknown']), /Unknown argument/);
  assert.throws(() => parseArguments(['--project-root']), /requires a value/);
});

test('VB011 private audio check rejects a root without the frozen inputs', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'g4-l10-vb011-audio-'));
  await mkdir(path.join(fixture, 'catalog'), {recursive: true});
  await writeFile(path.join(fixture, 'catalog', 'sentinel'), 'preserve');
  await assert.rejects(
    materializeG4L10Vb011PrivateAudio({root: fixture, check: true}),
  );
});
