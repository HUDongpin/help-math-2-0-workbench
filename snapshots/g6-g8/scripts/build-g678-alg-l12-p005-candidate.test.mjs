import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Script, createContext} from 'node:vm';
import {validateP005Runtime} from './validate-g678-alg-l12-p005-runtime.mjs';
import {composeP005Definitions, composeP005Render, replaceP005Once} from './build-g678-alg-l12-p005-candidate.mjs';

const wrap = functions => `var scalingGrids = {};\n${functions}\nvar frame = -1;`;
const main = wrap('function shape1(){}\nfunction sprite391(ctx,ctrans,frame,ratio,time){ctx.save();ctx.transform(1,0,0,1,10,20);ctx.restore();}');
const root = wrap('function shape1(){}\nfunction sprite391(ctx,ctrans,frame,ratio,time){}\n' +
  ['font392', 'text393', 'shape394', 'sprite395', 'shape396', 'main'].map(name => `function ${name}(){}`).join('\n'));

test('P005 composition preserves main wrapper and appends only missing root definitions', () => {
  const composed = composeP005Definitions(main, root);
  assert.deepEqual(composed.translation, {x: 10, y: 20});
  assert.equal((composed.html.match(/function sprite391\(/g) || []).length, 1);
  assert.equal((composed.html.match(/function shape1\(/g) || []).length, 1);
  assert.match(composed.html, /function sprite395\(/);
  assert.throws(() => composeP005Definitions(main, root.replace('function shape1(){}', 'function shape1(){return 1;}')));
  assert.throws(() => composeP005Definitions(main, root.replace('function font392()', 'function font999()')));
});

test('P005 composition fails closed on missing/duplicate markers and preserves source root coordinates', () => {
  assert.throws(() => replaceP005Once('a a', 'a', 'b'));
  assert.throws(() => replaceP005Once('a', 'x', 'b'));
  const offset = {x: 268.4, y: 346.85};
  const call = 'ctx.transform(1, 0, 0, 1, 268.4, 346.85);\n        sprite391(ctx, new cxform(0,0,0,0,255,255,255,255), state.exportFrame, 0, 0);';
  const output = composeP005Render(call, offset);
  assert.match(output, /403\.4,-42\.4/);
  assert.ok(output.indexOf('sprite391') < output.indexOf('sprite395'));
  assert.ok(output.indexOf('sprite395') < output.indexOf('shape396'));
  assert.match(output, /ctx\.save\(\);[\s\S]*ctx\.restore\(\);/);
});

test('P005 candidate reproduces pinned exports, composition and runtime', () => {
  const run = spawnSync(process.execPath, [fileURLToPath(new URL('./build-g678-alg-l12-p005-candidate.mjs', import.meta.url)), '--check'], {
    cwd: new URL('../', import.meta.url), encoding: 'utf8', timeout: 45000,
    env: {...process.env, HELP_MATH_G678_SOURCE_ROOT: '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'},
  });
  assert.equal(run.status, 0, run.stderr);
});

test('P005 pure resolver covers all968frames without claiming nested or audio authority', async () => {
  const runtime = readFileSync(new URL('../migrations/shared-alg001-l12-p005/candidate-v1/canvas-renderer.js', import.meta.url), 'utf8');
  validateP005Runtime(runtime);
  const created = [];
  const context = createContext({document: {createElement(kind) {
    created.push(kind); assert.equal(kind, 'img');
    return {complete: true, naturalWidth: 100}; // Resolver-only mock; not bitmap decoding evidence.
  }}});
  const script = new Script(runtime);
  script.runInContext(context, {timeout: 3000});
  const asset = context.HELP_MATH_CANVAS_ASSETS['shared-alg001-l12-p005'];
  await asset.ready();
  assert.deepEqual(created, ['img', 'img', 'img']);
  for (let frame = 1; frame <= 968; frame++) {
    const state = asset.resolveFrameState({frame});
    assert.equal(state.localFrame, frame);
    assert.equal(state.exportFrame, frame - 1);
    assert.equal(state.rootFrame, 6);
    assert.equal(state.frameDomain, 'sprite-391');
    assert.equal(state.audioRendered, false);
  }
  for (const frame of [0, 969, 1.5, NaN]) assert.throws(() => asset.resolveFrameState({frame}));
  assert.throws(() => asset.resolveFrameState({frame: 1, lang: 'es'}));
  assert.throws(() => script.runInContext(context), /already registered/);
});
