import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, chmodSync, rmSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {resolveTypographyHostClosurePins, TYPOGRAPHY_HOST_SUCCESSOR} from '../lib/g678-typography-host-successor.server';
const root = path.resolve(import.meta.dirname, '../../..');
const manifest = JSON.parse(readFileSync(path.join(root, TYPOGRAPHY_HOST_SUCCESSOR.path), 'utf8'));
const original = manifest.physicalReplacements.map((r: {original: {path: string; bytes: number; sha256: string}}) => r.original);
function withPhase(fn: () => void) {
  const before = {...process.env};
  try {Object.assign(process.env, {NODE_ENV: 'development', HELP_MATH_G678_CALIBRATION_PHASE: 'frozen16-continuous-audio-provisional-browser-qa'}); fn();}
  finally {for (const key of ['NODE_ENV', 'HELP_MATH_G678_CALIBRATION_PHASE']) {if (before[key] === undefined) delete process.env[key]; else process.env[key] = before[key];}}
}
function fixture() {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'helpmath-toolbar-scope-'));
  const pins = [TYPOGRAPHY_HOST_SUCCESSOR, manifest.predecessorManifest, manifest.toolbarZoomDelta.witness,
    manifest.toolbarZoomDelta.appended, manifest.toolbarZoomDelta.current,
    ...manifest.physicalReplacements.map((r: {witness: {path: string}}) => r.witness)];
  for (const pin of pins) {const dest = path.join(temp, pin.path); mkdirSync(path.dirname(dest), {recursive: true}); copyFileSync(path.join(root, pin.path), dest);}
  return temp;
}

test('the current toolbar successor names both real predecessor witnesses and current bytes', () => withPhase(() => {
  const pins = resolveTypographyHostClosurePins(root, original);
  assert.ok(pins.some(p => p.path === manifest.predecessorManifest.path));
  assert.ok(pins.some(p => p.path === manifest.toolbarZoomDelta.witness.path));
  assert.ok(pins.some(p => p.path === 'apps/web/app/globals.css' && p.sha256 === manifest.toolbarZoomDelta.current.sha256));
  assert.equal(new Set(pins.map(p => p.path)).size, pins.length);
}));

test('changed current CSS, a changed append and a writable predecessor fail closed', () => withPhase(() => {
  for (const mode of ['current', 'appended', 'writable-witness']) {
    const temp = fixture();
    try {
      const pin = mode === 'writable-witness' ? manifest.toolbarZoomDelta.witness : manifest.toolbarZoomDelta[mode];
      const file = path.join(temp, pin.path); chmodSync(file, 0o644);
      if (mode !== 'writable-witness') writeFileSync(file, Buffer.concat([readFileSync(file), Buffer.from(' /* drift */')]));
      assert.throws(() => resolveTypographyHostClosurePins(temp, original), /G678_TYPOGRAPHY_HOST_SUCCESSOR_INVALID/);
    } finally {rmSync(temp, {recursive: true, force: true});}
  }
}));

test('the local toolbar successor does not activate in production or another phase', () => withPhase(() => {
  Object.assign(process.env, {NODE_ENV: 'production'}); assert.deepEqual(resolveTypographyHostClosurePins(root, original), original);
  Object.assign(process.env, {NODE_ENV: 'development', HELP_MATH_G678_CALIBRATION_PHASE: 'unrelated'});
  assert.deepEqual(resolveTypographyHostClosurePins(root, original), original);
}));
