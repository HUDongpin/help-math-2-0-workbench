import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Script, createContext} from 'node:vm';
import test from 'node:test';
import {buildSourceDrawings, canvasDeclarations} from './build-g678-alg-l12-p012-graphics-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'migrations/shared-alg001-l12-p012/graphics-source-v1');
const source = path.join(root, 'output/p011-source-triage-20260927-v1');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

function loadAsset(image, timers = {}) {
  const script = readFileSync(path.join(output, 'source-drawings.js'), 'utf8');
  const context = createContext({document: {createElement(kind) {
    assert.equal(kind, 'img');
    return image;
  }}, setTimeout: timers.setTimeout ?? setTimeout, clearTimeout: timers.clearTimeout ?? clearTimeout});
  new Script(script).runInContext(context);
  return context.HELP_MATH_P012_SOURCE_DRAWINGS;
}

test('source Canvas extraction, bundle and composition reproduce from pinned SWF and FFDec', () => {
  const result = spawnSync(process.execPath,
    [path.join(root, 'scripts/build-g678-alg-l12-p012-graphics-source.mjs'), '--check'],
    {cwd: root, encoding: 'utf8', timeout: 30000});
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(readFileSync(path.join(output, 'manifest.json'), 'utf8'));
  const composition = JSON.parse(readFileSync(path.join(output, 'composition.json'), 'utf8'));
  assert.equal(manifest.source.sha256, 'b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa');
  assert.equal(manifest.rawOutputs.length, 15);
  assert.equal(composition.sourceFunctionCount, 86);
  assert.equal(composition.classifiedVisuals.shape1.observedText,
    'Graphing in the Coordinate Plane: Vocabulary');
  assert.deepEqual(composition.rootLayerOrder.map(p => [p.depth, p.characterId]), [[1,1],[2,86]]);
  assert.deepEqual(composition.interactiveFrame119.bindings.map(b => b.sourceFunction),
    ['sprite32','sprite61','sprite74','sprite76','sprite57','text34']);
  assert.equal(composition.textSuppressionApplied, false);
  assert.equal(composition.graphicsSuppressionApplied, false);
  for (const descriptor of manifest.rawOutputs) {
    const bytes = readFileSync(path.join(root, descriptor.path));
    assert.equal(bytes.length, descriptor.bytes);
    assert.equal(sha(bytes), descriptor.sha256);
  }
});

test('generated browser code retains source functions and exposes the exact interactive entry', () => {
  const helper = readFileSync(path.join(output, 'raw/frames/canvas.js'), 'utf8');
  const html = readFileSync(path.join(output, 'raw/frames/frames.html'), 'utf8');
  const declarations = canvasDeclarations(html);
  assert(declarations.includes('function sprite86('));
  assert(declarations.includes('function shape1('));
  const built = buildSourceDrawings(helper, html);
  assert.equal(built.names.length, 86);
  assert.equal(sha(built.script), sha(readFileSync(path.join(output, 'source-drawings.js'))));
  assert(!built.script.includes('eval('));
  assert(!built.script.includes('setInterval('));
  assert(!built.script.includes("window.addEventListener('load'"));
  assert(!built.script.includes('document.getElementById("width_size")'));
  assert(built.script.includes('renderInteractive:renderInteractive'));
  assert(built.script.includes('active.consumed[obj]=true'));
});

test('bitmap readiness fails closed for an already failed decode and validates reducer state', async () => {
  const broken = loadAsset({complete: true, naturalWidth: 0, src: ''});
  await assert.rejects(broken.ready(), /failed to decode/);
  const ready = loadAsset({complete: true, naturalWidth: 38, src: ''});
  await ready.ready();
  const state = {spider:{x:133.8,y:19.1,rotation:0}, dot:{x:133.7,y:18.85},
    bubble:{x:135.1,y:-11.8}, popup:{visible:false,frame:1},
    coach:{frame:1,playing:false}, coordinateText:'(0,0)'};
  assert.throws(() => ready.renderInteractive(null, {...state,spider:{...state.spider,rotation:45}},
    {nativeCoordinate:true}), /rotation/);
  assert.throws(() => ready.renderInteractive(null, {...state,popup:{visible:true,frame:1}},
    {nativeCoordinate:true}), /Visible popup/);
  assert.throws(() => ready.renderInteractive(null, {...state,coordinateText:'(1,0)'},
    {nativeCoordinate:false}), /nativeCoordinate/);
});

test('pending bitmap decode has a bounded failure and removes listeners', async () => {
  const listeners = new Map();
  const image = {complete:false,naturalWidth:0,src:'',
    addEventListener(name, callback){listeners.set(name, callback);},
    removeEventListener(name){listeners.delete(name);}};
  const asset = loadAsset(image, {setTimeout(callback, millis) {
    assert.equal(millis, 10000);
    queueMicrotask(callback);
    return 1;
  }, clearTimeout(){}});
  await assert.rejects(asset.ready(), /timed out/);
  assert.equal(listeners.size, 0);
});
