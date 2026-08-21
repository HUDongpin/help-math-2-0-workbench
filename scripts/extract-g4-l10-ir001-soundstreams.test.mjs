import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  EXPECTED_IR001_STREAMS,
  extractG4L10Ir001SoundStreams,
  parseArguments,
} from './extract-g4-l10-ir001-soundstreams.mjs';

test('parses the private IR001 extractor options fail closed', () => {
  assert.deepEqual(parseArguments(['--check', '--json']), {
    projectRoot: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
    check: true,
    json: true,
    help: false,
  });
  assert.throws(() => parseArguments(['--unknown']), /Unknown option/);
});

test('freezes both IR001 random SoundStream identities', () => {
  assert.deepEqual(
    EXPECTED_IR001_STREAMS.map((item) => ({
      id: item.cueId,
      characterId: item.characterId,
      remainder: item.seedRemainder,
      bytes: item.byteLength,
    })),
    [
      {id: 'random-sound-0', characterId: 5, remainder: 0, bytes: 22568},
      {id: 'random-sound-1', characterId: 6, remainder: 1, bytes: 22568},
    ],
  );
});

test('check mode rejects a project root without frozen source evidence', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'g4-l10-ir001-audio-'));
  await mkdir(path.join(root, 'source-assets'), {recursive: true});
  await writeFile(path.join(root, 'source-assets', 'placeholder'), 'x');
  await assert.rejects(
    extractG4L10Ir001SoundStreams({projectRoot: root, check: true}),
  );
  assert.equal(await readFile(path.join(root, 'source-assets', 'placeholder'), 'utf8'), 'x');
});
