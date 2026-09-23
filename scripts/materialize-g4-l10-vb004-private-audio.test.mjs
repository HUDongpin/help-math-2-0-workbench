import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  EXPECTED_VB004_AUDIO,
  materializeG4L10Vb004PrivateAudio,
  parseArguments,
} from './materialize-g4-l10-vb004-private-audio.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('VB004 freezes one embedded cue and one Spanish host track', () => {
  assert.deepEqual(
    {
      embedded: {
        characterId: EXPECTED_VB004_AUDIO.embedded.characterId,
        headFrame: EXPECTED_VB004_AUDIO.embedded.headFrame,
        firstFrame: EXPECTED_VB004_AUDIO.embedded.firstFrame,
        lastFrame: EXPECTED_VB004_AUDIO.embedded.lastFrame,
        endFrame: EXPECTED_VB004_AUDIO.embedded.endFrame,
        bytes: EXPECTED_VB004_AUDIO.embedded.bytes,
      },
      spanish: {
        bytes: EXPECTED_VB004_AUDIO.spanish.bytes,
        durationMs: EXPECTED_VB004_AUDIO.spanish.durationMs,
      },
    },
    {
      embedded: {
        characterId: 45,
        headFrame: 1,
        firstFrame: 4,
        lastFrame: 213,
        endFrame: 214,
        bytes: 86970,
      },
      spanish: {bytes: 301056, durationMs: 21504},
    },
  );
});

test('VB004 private audio materialization is reproducible and full-EOF decoded', async () => {
  const result = await materializeG4L10Vb004PrivateAudio({root, check: true});
  assert.equal(result.status, 'current');
  assert.equal(result.outputs.length, 4);
});

test('VB004 private audio arguments fail closed', () => {
  assert.deepEqual(parseArguments(['--check']), {root, check: true});
  assert.throws(() => parseArguments(['--unknown']), /Unknown argument/);
  assert.throws(() => parseArguments(['--project-root']), /requires a value/);
});

test('VB004 private audio check rejects a root without the frozen inputs', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'g4-l10-vb004-audio-'));
  await mkdir(path.join(fixture, 'catalog'), {recursive: true});
  await writeFile(path.join(fixture, 'catalog', 'sentinel'), 'preserve');
  await assert.rejects(
    materializeG4L10Vb004PrivateAudio({root: fixture, check: true}),
  );
});
