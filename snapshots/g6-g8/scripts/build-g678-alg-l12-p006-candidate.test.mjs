import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createContext, Script} from 'node:vm';
import {compose, replaceOnce, validateRuntime} from './build-g678-alg-l12-p006-candidate.mjs';

const root = new URL('../', import.meta.url);
const workspace = new URL('../migrations/shared-alg001-l12-p006/', import.meta.url);
const normalized = url => readFileSync(url, 'utf8').replace(/\r\n?/g, '\n');
const runtime = normalized(new URL('candidate-v1/canvas-renderer.js', workspace));

test('candidate regenerates from source-bound full composition', () => {
  const result = spawnSync(process.execPath, ['scripts/build-g678-alg-l12-p006-candidate.mjs', '--check'],
    {cwd: root, encoding: 'utf8', timeout: 30000});
  assert.equal(result.status, 0, result.stderr);
});

test('composition requires exact root definitions and rejects duplicate replacement', () => {
  const base = new URL('audit/ffdec-26.2.1-canvas-v1/', workspace);
  const main = normalized(new URL('sprites/DefineSprite_53/frames.html', base));
  const parent = normalized(new URL('frames/frames.html', base));
  const html = compose(main, parent);
  for (const name of ['sprite53', 'text54', 'shape55', 'sprite56', 'shape57', 'main'])
    assert.equal(html.split(`function ${name}(`).length, 2);
  assert.throws(() => compose(main, parent.replace('function shape57(', 'function shape999(')));
  assert.throws(() => replaceOnce('duplicate duplicate', 'duplicate', 'replacement'));
  assert.throws(() => replaceOnce('text', 'absent', 'replacement'));
});

test('pure state covers all342frames forward and reverse; no audio/interaction authority', async () => {
  const created = [];
  const context = createContext({document: {createElement(kind) {
    created.push(kind); assert.equal(kind, 'img');
    return {complete: true, naturalWidth: 1}; // State-only mock, not image decoding evidence.
  }}});
  validateRuntime(runtime);
  const script = new Script(runtime);
  script.runInContext(context, {timeout: 3000});
  const asset = context.HELP_MATH_CANVAS_ASSETS['shared-alg001-l12-p006'];
  await asset.ready();
  assert.deepEqual(created, ['img']);
  const forward = Array.from({length: 342}, (_, i) => JSON.stringify(asset.resolveFrameState({frame: i + 1})));
  for (let frame = 342; frame >= 1; frame--) {
    const state = asset.resolveFrameState({frame});
    assert.equal(JSON.stringify(state), forward[frame - 1]);
    assert.equal(state.frameDomain, 'sprite-53');
    assert.equal(state.localFrame, frame); assert.equal(state.exportFrame, frame - 1);
    assert.equal(state.rootFrame, 6); assert.equal(state.audioRendered, false);
    assert.equal(state.interactiveStateResolved, false);
  }
  for (const frame of [0, 343, 1.5, NaN]) assert.throws(() => asset.resolveFrameState({frame}));
  assert.throws(() => asset.resolveFrameState({frame: 1, lang: 'es'}));
  assert.throws(() => asset.resolveFrameState({frame: 1, scenario: 'glossary-coordinate'}));
  assert.throws(() => script.runInContext(context), /already registered/);
});

test('runtime rejects network, dynamic evaluation, timers and external bitmap URLs', () => {
  for (const suffix of ['\neval("x")', '\nfetch("x")', '\nsetTimeout(x,1)', '\ndocument.body'])
    assert.throws(() => validateRuntime(runtime + suffix));
  assert.throws(() => validateRuntime(runtime.replace(/data:image\/PNG;base64,[A-Za-z0-9+/=]+/, 'https://invalid.test/a.png')));
});
