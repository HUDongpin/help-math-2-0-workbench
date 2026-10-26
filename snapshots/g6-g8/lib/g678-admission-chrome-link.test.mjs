import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {readPin} from './g678-admission-proof.mjs';

const work = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../work');

function pinOf(file) {
  const bytes = fs.readFileSync(file);
  return {path: path.basename(file), bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex')};
}

test('an ordinary extra hard link is still rejected', () => {
  const directory = fs.realpathSync(fs.mkdtempSync(path.join(work, 'g678-link-test-')));
  const file = path.join(directory, 'sample.bin');
  fs.writeFileSync(file, 'sample');
  fs.linkSync(file, path.join(directory, 'alias.bin'));
  assert.throws(() => readPin(directory, pinOf(file)), /ordinary bounded file: sample.bin/);
  fs.rmSync(directory, {recursive: true, force: true});
});

test('one ordinary file still pins', () => {
  const directory = fs.realpathSync(fs.mkdtempSync(path.join(work, 'g678-one-test-')));
  const file = path.join(directory, 'sample.bin');
  fs.writeFileSync(file, 'sample');
  const pin = pinOf(file);
  assert.equal(readPin(directory, pin).toString(), 'sample');
  fs.rmSync(directory, {recursive: true, force: true});
});
