import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  EXPECTED_TS005_AUDIO,
  materializeG4L10Ts005PrivateAudio,
  parseArguments,
} from './materialize-g4-l10-ts005-private-audio.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('TS005 freezes one frame-1 embedded cue and one Spanish host track', () => {
  assert.deepEqual(
    {
      embedded: {
        characterId: EXPECTED_TS005_AUDIO.embedded.characterId,
        headFrame: EXPECTED_TS005_AUDIO.embedded.headFrame,
        firstFrame: EXPECTED_TS005_AUDIO.embedded.firstFrame,
        lastFrame: EXPECTED_TS005_AUDIO.embedded.lastFrame,
        endFrame: EXPECTED_TS005_AUDIO.embedded.endFrame,
        bytes: EXPECTED_TS005_AUDIO.embedded.bytes,
      },
      spanish: {
        bytes: EXPECTED_TS005_AUDIO.spanish.bytes,
        durationMs: EXPECTED_TS005_AUDIO.spanish.durationMs,
      },
    },
    {
      embedded: {
        characterId: 32,
        headFrame: 1,
        firstFrame: 1,
        lastFrame: 234,
        endFrame: 235,
        bytes: 96850,
      },
      spanish: {bytes: 213360, durationMs: 15240},
    },
  );
});

test('TS005 private audio materialization is reproducible and full-EOF decoded', async () => {
  const result = await materializeG4L10Ts005PrivateAudio({root, check: true});
  assert.equal(result.status, 'current');
  assert.equal(result.outputs.length, 4);
});

test('TS005 private audio arguments fail closed', () => {
  assert.deepEqual(parseArguments(['--check']), {root, check: true});
  assert.throws(() => parseArguments(['--unknown']), /Unknown argument/);
  assert.throws(() => parseArguments(['--project-root']), /requires a value/);
});

test('TS005 private audio check rejects a root without the frozen inputs', async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), 'g4-l10-ts005-audio-'));
  await mkdir(path.join(fixture, 'catalog'), {recursive: true});
  await writeFile(path.join(fixture, 'catalog', 'sentinel'), 'preserve');
  await assert.rejects(
    materializeG4L10Ts005PrivateAudio({root: fixture, check: true}),
  );
});
