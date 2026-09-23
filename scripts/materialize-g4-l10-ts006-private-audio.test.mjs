import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  EXPECTED_TS006_AUDIO,
  materializeG4L10Ts006PrivateAudio,
  parseArguments,
} from './materialize-g4-l10-ts006-private-audio.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('TS006 private audio disposition freezes one embedded cue and one Spanish host track', () => {
  assert.deepEqual(
    {
      embedded: {
        characterId: EXPECTED_TS006_AUDIO.embedded.characterId,
        firstFrame: EXPECTED_TS006_AUDIO.embedded.firstFrame,
        lastFrame: EXPECTED_TS006_AUDIO.embedded.lastFrame,
        bytes: EXPECTED_TS006_AUDIO.embedded.bytes,
      },
      spanish: {
        bytes: EXPECTED_TS006_AUDIO.spanish.bytes,
        durationMs: EXPECTED_TS006_AUDIO.spanish.durationMs,
      },
    },
    {
      embedded: {characterId: 13, firstFrame: 1, lastFrame: 245, bytes: 101530},
      spanish: {bytes: 106848, durationMs: 7632},
    },
  );
});

test('TS006 private audio materialization is reproducible and full-EOF decoded', async () => {
  const result = await materializeG4L10Ts006PrivateAudio({root, check: true});
  assert.equal(result.action, 'verified');
  assert.equal(result.outputCount, 4);
  assert.equal(result.totalAudioBytes, 208378);
  assert.equal(result.fullEofDecodeCount, 2);
  assert.equal(result.strictAcceptanceEffect, 'none');
});

test('TS006 private audio arguments fail closed', () => {
  assert.deepEqual(parseArguments(['--check']), {root, check: true});
  assert.throws(() => parseArguments(['--unknown']), /Unknown argument/);
  assert.throws(() => parseArguments(['--project-root']), /requires a value/);
});

test('TS006 private audio check rejects a root without the frozen inputs', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'g4-l10-ts006-audio-'));
  await mkdir(path.join(fixture, 'catalog'), {recursive: true});
  await writeFile(path.join(fixture, 'catalog', 'sentinel'), 'preserve');
  await assert.rejects(
    materializeG4L10Ts006PrivateAudio({root: fixture, check: true}),
  );
});
