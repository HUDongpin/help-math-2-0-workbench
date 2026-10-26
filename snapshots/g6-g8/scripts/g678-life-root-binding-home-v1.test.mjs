import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {after, test} from 'node:test';
import {G678_LIFE_EXECUTION_ROOT as ROOT, G678_LIFE_SOURCE_ROOT as SOURCE, G678_RECORDED_HOME,
  resolveG678HistoricalEvidencePath, resolveG678PhysicalPath} from '../lib/g678-life-root-binding-v1.mjs';
import {readPin} from '../lib/g678-admission-proof.mjs';

// Read-only. The pin is retained by five admitted ALG001 L08 proofs (playwright-cli package.json).
const CACHE = `${G678_RECORDED_HOME}/.npm/_npx/31e32ef8478fbf80`;
const RECORDED_DIR = `${CACHE}/node_modules/@playwright/cli`;
const PIN = {path: 'package.json', bytes: 702, sha256: '1c545fd0ee14db9faed985aebfd205f9d6c2b2da5fbc8d142a7af8e26ee9c510'};
const priorSource = process.env.HELP_MATH_G678_SOURCE_ROOT, priorHome = process.env.HOME;
process.env.HELP_MATH_G678_SOURCE_ROOT = SOURCE;
after(() => {
  for (const [key, value] of [['HELP_MATH_G678_SOURCE_ROOT', priorSource], ['HOME', priorHome]])
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
});
const codexMac = existsSync(G678_RECORDED_HOME);
const localCache = !codexMac && existsSync(path.join(priorHome ?? '', '.npm/_npx/31e32ef8478fbf80'));

test('allow-listed package cache is read from the current home, byte-exact', {skip: !localCache && 'no local npx cache'}, () => {
  const physical = resolveG678HistoricalEvidencePath(RECORDED_DIR, ROOT);
  assert.equal(physical, path.join(priorHome, '.npm/_npx/31e32ef8478fbf80/node_modules/@playwright/cli'));
  assert.equal(readPin(RECORDED_DIR, PIN).length, PIN.bytes);
  assert.throws(() => readPin(RECORDED_DIR, {...PIN, sha256: '0'.repeat(64)}), /current bytes/);
});

test('fresh execution addresses never use the home binding', {skip: codexMac && 'recorded home exists'}, () => {
  assert.throws(() => resolveG678PhysicalPath(RECORDED_DIR, ROOT), /ENOENT/);
});

test('documents and other home folders are not bound', {skip: codexMac && 'recorded home exists'}, () => {
  for (const recorded of [`${G678_RECORDED_HOME}/Documents/Codex/2026-10-07`, `${G678_RECORDED_HOME}/.npm/_npx`,
    `${G678_RECORDED_HOME}/.npm/_npx/31e32ef8478fbf80-other`])
    assert.throws(() => resolveG678HistoricalEvidencePath(recorded, ROOT), /ENOENT/);
});

test('on the recorded home the binding is the identity', {skip: codexMac && 'recorded home exists'}, () => {
  process.env.HOME = G678_RECORDED_HOME;
  try { assert.throws(() => resolveG678HistoricalEvidencePath(RECORDED_DIR, ROOT), /ENOENT/); }
  finally { process.env.HOME = priorHome; }
});
