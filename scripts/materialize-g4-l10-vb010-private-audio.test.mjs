import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  EXPECTED_VB010_AUDIO,
  materializeG4L10Vb010PrivateAudio,
  parseArguments,
} from './materialize-g4-l10-vb010-private-audio.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('VB010 freezes one embedded cue and one Spanish host track', () => {
  assert.deepEqual(
    {
      embedded: {
        characterId: EXPECTED_VB010_AUDIO.embedded.characterId,
        headFrame: EXPECTED_VB010_AUDIO.embedded.headFrame,
        firstFrame: EXPECTED_VB010_AUDIO.embedded.firstFrame,
        lastFrame: EXPECTED_VB010_AUDIO.embedded.lastFrame,
        endFrame: EXPECTED_VB010_AUDIO.embedded.endFrame,
        bytes: EXPECTED_VB010_AUDIO.embedded.bytes,
      },
      spanish: {
        bytes: EXPECTED_VB010_AUDIO.spanish.bytes,
        durationMs: EXPECTED_VB010_AUDIO.spanish.durationMs,
      },
    },
    {
      embedded: {
        characterId: 36,
        headFrame: 1,
        firstFrame: 3,
        lastFrame: 128,
        endFrame: 129,
        bytes: 52130,
      },
      spanish: {bytes: 184128, durationMs: 13152},
    },
  );
});

test('VB010 private audio materialization is reproducible and full-EOF decoded', async () => {
  const result = await materializeG4L10Vb010PrivateAudio({root, check: true});
  assert.equal(result.status, 'current');
  assert.equal(result.outputs.length, 4);
});

test('VB010 private audio arguments fail closed', () => {
  assert.deepEqual(parseArguments(['--check']), {root, check: true});
  assert.throws(() => parseArguments(['--unknown']), /Unknown argument/);
  assert.throws(() => parseArguments(['--project-root']), /requires a value/);
});

test('VB010 private audio check rejects a root without the frozen inputs', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'g4-l10-vb010-audio-'));
  await mkdir(path.join(fixture, 'catalog'), {recursive: true});
  await writeFile(path.join(fixture, 'catalog', 'sentinel'), 'preserve');
  await assert.rejects(
    materializeG4L10Vb010PrivateAudio({root: fixture, check: true}),
  );
});
