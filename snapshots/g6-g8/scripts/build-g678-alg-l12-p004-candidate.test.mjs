import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Script, createContext} from 'node:vm';
import test from 'node:test';
import {validateP004Runtime} from './validate-g678-alg-l12-p004-runtime.mjs';

const root = new URL('../', import.meta.url);
const runtime = readFileSync(new URL('migrations/shared-alg001-l12-p004/candidate-v1/canvas-renderer.js', root), 'utf8');

test('P004 candidate regeneration matches all stored outputs', () => {
  const run = spawnSync(process.execPath, [fileURLToPath(new URL('./build-g678-alg-l12-p004-candidate.mjs', import.meta.url)), '--check'], {
    cwd: root, env: {...process.env, HELP_MATH_G678_SOURCE_ROOT: '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'}, encoding: 'utf8', timeout: 30000,
  });
  assert.equal(run.status, 0, run.stderr);
});

test('P004 final composed runtime rejects active browser primitives', () => {
  validateP004Runtime(runtime);
  for (const extra of ['fetch("/")', 'setTimeout(()=>{},0)', 'document.body', 'eval("1")', 'document.createElement("img")']) {
    assert.throws(() => validateP004Runtime(runtime + '\n' + extra));
  }
});

test('P004 registers only its own drawing asset and resolves source frames without DOM access', () => {
  const context = createContext({});
  const script = new Script(runtime);
  script.runInContext(context, {timeout: 3000});
  assert.deepEqual(Object.keys(context.HELP_MATH_CANVAS_ASSETS), ['shared-alg001-l12-p004']);
  const asset = context.HELP_MATH_CANVAS_ASSETS['shared-alg001-l12-p004'];
  for (const frame of [1, 18, 19, 29, 203, 969]) {
    const state = asset.resolveFrameState({frame});
    assert.equal(state.frameDomain, 'sprite-90');
    assert.equal(state.localFrame, frame); assert.equal(state.exportFrame, frame - 1);
    assert.equal(state.rootFrame, 6); assert.equal(state.audioRendered, false);
  }
  for (const frame of [0, 970, 1.5, NaN]) assert.throws(() => asset.resolveFrameState({frame}));
  assert.throws(() => asset.resolveFrameState({frame: 1, lang: 'es'}));
  assert.throws(() => script.runInContext(context), /already registered/);
});
