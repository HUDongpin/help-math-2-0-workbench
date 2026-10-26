import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createContext, Script} from 'node:vm';
import {
  P009_ID, P009_PINS, P009_ACCEPTANCE_EFFECTS, auditP009Masks,
  buildP009VisualCandidate, canvasFunctions, composeP009Canvas,
  correctP009Masks, maskFunction, replaceOnce, validateP009Runtime,
} from './build-g678-alg-l12-p009-candidate.mjs';

const work = new URL('../migrations/shared-alg001-l12-p009/', import.meta.url);
const read = relative => readFileSync(new URL(relative, work));
const normalized = value => value.toString().replace(/\r\n?/g, '\n');
const input = {
  helper: read('audit/ffdec-26.2.1-canvas-v1/sprites/DefineSprite_62/canvas.js'),
  mainHtml: read('audit/ffdec-26.2.1-canvas-v1/sprites/DefineSprite_62/frames.html'),
  rootHtml: read('audit/ffdec-26.2.1-canvas-v1/frames/frames.html'),
  xml: read('audit/movie.xml'),
  catalog: JSON.parse(read('audit/source-text-catalog.json')),
  behavior: JSON.parse(read('audit/source-behavior.json')),
  sourceAuditReceipt: read('audit/extraction-receipt.json'),
  canvasReceipt: read('audit/ffdec-26.2.1-canvas-v1/extraction-receipt.json'),
};
const candidate = buildP009VisualCandidate(input);
const runtimeScript = new Script(candidate.runtime);
const hash = value => createHash('sha256').update(value).digest('hex');
const plain = value => JSON.parse(JSON.stringify(value));

function loadRuntime(createElement = () => { throw new Error('unexpected DOM allocation'); }) {
  const context = createContext({document: {createElement}});
  runtimeScript.runInContext(context, {timeout: 3000});
  return {context, asset: context.HELP_MATH_CANVAS_ASSETS[P009_ID]};
}

test('source composition keeps main normalized matrices, all original text, and exact root title', () => {
  const main = normalized(input.mainHtml), root = normalized(input.rootHtml);
  const composed = canvasFunctions(composeP009Canvas(main, root));
  const originals = canvasFunctions(main), parent = canvasFunctions(root);
  assert.equal(composed.size, originals.size + 2);
  for (const [name, code] of originals) assert.equal(composed.get(name), code, name);
  assert.equal(composed.get('shape63'), parent.get('shape63'));
  assert.equal(composed.get('main'), parent.get('main'));
  assert.equal(candidate.sourceTextFunctions.length, 16);
  assert.equal(candidate.placedFunctions.length, 61);
  assert.throws(() => composeP009Canvas(main, root.replace('function shape63(', 'function shape999(')));
  assert.throws(() => composeP009Canvas(main.replace('376.4,205.35', '376.4,205.36'), root));
  assert.throws(() => composeP009Canvas(main, root.replace('0.05,412.4,283.3', '0.05,412.4,283.4')));
  assert.throws(() => replaceOnce('duplicate duplicate', 'duplicate', 'replacement'));
  assert.throws(() => replaceOnce('text', 'absent', 'replacement'));
});

test('opaque mask changes preserve every path and all other runtime bytes', () => {
  let original = candidate.uncorrectedRuntime, corrected = candidate.runtime;
  for (const name of ['shape1', 'shape29']) {
    const before = maskFunction(original, name), after = maskFunction(corrected, name);
    assert.equal(after.text.match(/var pathData="([^"]+)"/)[1], before.text.match(/var pathData="([^"]+)"/)[1]);
    assert.equal(after.text.replace('ctx.fillStyle="rgba(255,255,255,1)";', ''),
      before.text.replace(/ctx\.fillStyle=tocolor\(ctrans\.apply\(\[[^\]]+\]\)\);/, ''));
    original = original.slice(0, before.start) + '__MASK__' + original.slice(before.end);
    corrected = corrected.slice(0, after.start) + '__MASK__' + corrected.slice(after.end);
  }
  assert.equal(corrected, original);
  assert.throws(() => correctP009Masks(candidate.uncorrectedRuntime.replace('[102,153,0,0.6431373]', '[102,153,0,0.64]')));
  assert.throws(() => correctP009Masks(candidate.runtime));
});

test('mask geometry executes as opaque fill with the source path, independently of frame and color transform', () => {
  for (const name of ['shape1', 'shape29']) {
    const trace = [];
    const isolated = createContext({drawPath(ctx, data, stroke) { trace.push({data, stroke}); }});
    new Script(maskFunction(candidate.runtime, name).text).runInContext(isolated);
    const path = maskFunction(candidate.uncorrectedRuntime, name).text.match(/var pathData="([^"]+)"/)[1];
    for (const frame of [0, 119, 393]) {
      const ctx = {fill(rule) { trace.push({fillStyle: this.fillStyle, rule}); }};
      isolated[name](ctx, {apply() { throw new Error('mask must ignore source alpha transform'); }}, frame, 0, 0);
      assert.deepEqual(trace.slice(-2), [{data: path, stroke: false}, {fillStyle: 'rgba(255,255,255,1)', rule: 'evenodd'}]);
    }
  }
});

test('source mask audit rejects a color, nonclip placement, color transform, or bitmap expansion', () => {
  assert.equal(candidate.maskAudit.exclusiveClipDepthGeometry, true);
  assert.equal(candidate.maskAudit.instanceIds.length, 4);
  const xml = input.xml.toString();
  const firstPlace = xml.match(/<item type="PlaceObject2Tag" characterId="1"[^>]+>/)[0];
  for (const changed of [
    xml.replace('alpha="164" blue="0" green="153" red="102"', 'alpha="165" blue="0" green="153" red="102"'),
    xml.replace(firstPlace, firstPlace.replace('placeFlagHasClipDepth="true"', 'placeFlagHasClipDepth="false"')),
    xml.replace(firstPlace, firstPlace.replace('placeFlagHasColorTransform="false"', 'placeFlagHasColorTransform="true"')),
  ]) assert.throws(() => auditP009Masks(Buffer.from(changed), input.catalog));
  const changedCatalog = structuredClone(input.catalog);
  changedCatalog.summary.bitmapDefinitions = 1;
  assert.throws(() => auditP009Masks(input.xml, changedCatalog));
});

test('candidate inputs fail closed on source or receipt byte drift', () => {
  for (const name of ['helper', 'mainHtml', 'rootHtml', 'xml', 'sourceAuditReceipt', 'canvasReceipt']) {
    const changed = Buffer.from(input[name]); changed[changed.length - 1] ^= 1;
    assert.throws(() => buildP009VisualCandidate({...input, [name]: changed}), /input hash drift/);
  }
  const catalog = structuredClone(input.catalog); catalog.sourceSha256 = '0'.repeat(64);
  assert.throws(() => buildP009VisualCandidate({...input, catalog}), /input hash drift/);
  assert.equal(hash(input.xml), P009_PINS.xml.sha256);
});

test('all 394 public frame states are pure in forward, reverse, and nonsequential inspection', async () => {
  const {context, asset} = loadRuntime();
  await asset.ready();
  assert.equal(asset.metadata.animationId, P009_ID);
  assert.deepEqual(plain(asset.metadata.requiredCanvas), {width: 1600, height: 1200});
  assert.equal(asset.metadata.renderScale, 2);
  const forward = Array.from({length: 394}, (_, i) => JSON.stringify(asset.resolveFrameState({frame: i + 1})));
  for (let frame = 394; frame >= 1; frame--) {
    const state = asset.resolveFrameState({frame});
    assert.equal(JSON.stringify(state), forward[frame - 1]);
    assert.equal(state.frameDomain, 'sprite-62');
    assert.equal(state.localFrame, frame); assert.equal(state.exportFrame, frame - 1);
    assert.equal(state.rootFrame, 6); assert.equal(state.audioRendered, false);
    assert.equal(state.visualOnly, true); assert.equal(state.interactiveStateResolved, false);
    assert.equal(state.seed, 0);
    assert.ok(Object.isFrozen(state));
  }
  for (const frame of [394, 1, 201, 28, 393, 1]) {
    const state = plain(asset.resolveFrameState({frame, seed: 37}));
    assert.equal(state.seed, 37, 'request seed is retained as inspection metadata');
    state.seed = 0;
    assert.equal(JSON.stringify(state), forward[frame - 1]);
  }
  for (const frame of [0, 395, 1.5, NaN, Infinity, '1']) assert.throws(() => asset.resolveFrameState({frame}));
  for (const request of [{frame: 1, lang: 'es'}, {frame: 1, scenario: 'glossary-ordered_pair'}, {frame: 1, seed: 0.1}])
    assert.throws(() => asset.resolveFrameState(request));
  assert.throws(() => runtimeScript.runInContext(context), /already registered/);
});

class MockContext {
  constructor(canvas) { this.canvas = canvas; this.calls = []; this.depth = 0; }
  save() { this.depth++; }
  restore() { assert.ok(this.depth > 0, 'unbalanced native restore'); this.depth--; }
  transform(...args) { this.calls.push(['transform', ...args]); }
  setTransform(...args) { this.calls.push(['setTransform', ...args]); }
  resetTransform() {}
  scale() {}
  rotate() {}
  translate() {}
  beginPath() {}
  moveTo() {}
  lineTo() {}
  quadraticCurveTo() {}
  bezierCurveTo() {}
  closePath() {}
  fill(rule) { this.calls.push(['fill', this.fillStyle, rule]); }
  stroke() {}
  fillRect(...args) { this.calls.push(['fillRect', ...args]); }
  drawImage(...args) { this.calls.push(['drawImage', ...args]); }
}
class MockCanvas {
  constructor(width = 0, height = 0) { this.width = width; this.height = height; this.style = {}; this.attributes = {}; this.context = new MockContext(this); }
  getContext(kind) { assert.equal(kind, '2d'); return this.context; }
  setAttribute(name, value) { this.attributes[name] = value; }
}

test('representative source frames render at 2x with isolated clipping and balanced context state', async () => {
  const created = [];
  const {asset} = loadRuntime(kind => { assert.equal(kind, 'canvas'); const canvas = new MockCanvas(); created.push(canvas); return canvas; });
  await asset.ready(); assert.equal(created.length, 0, 'no DOM allocation before rendering');
  const target = new MockCanvas(1600, 1200);
  for (const frame of [1, 11, 12, 28, 71, 72, 100, 111, 120, 141, 142, 162, 184, 201, 209, 210, 240, 284, 291, 321, 393, 394, 1]) {
    created.length = 0; target.context.calls.length = 0;
    const state = asset.render(target, {frame});
    assert.equal(state.localFrame, frame);
    assert.equal(target.attributes['data-flash-frame'], String(frame));
    assert.equal(target.attributes['data-flash-frame-domain'], 'sprite-62');
    assert.equal(target.attributes['data-flash-root-frame'], '6');
    assert.deepEqual(target.context.calls[0], ['setTransform', 2, 0, 0, 2, 0, 0]);
    assert.ok(target.context.calls.some(call => JSON.stringify(call) === JSON.stringify(['fillRect', 0, 0, 800, 600])));
    assert.equal(target.context.depth, 0);
    assert.equal(target.context._savedMatrices.length, 1);
    assert.deepEqual(plain(target.context._matrix), [2, 0, 0, 2, 0, 0]);
    const activeMasks = input.catalog.timelines.flatMap(t => t.instances)
      .filter(instance => [1, 29].includes(instance.characterId) &&
        frame >= instance.firstFrame && frame < instance.lastFrameExclusive).length;
    assert.equal(created.length, activeMasks * 2, `source clip lifetimes at frame ${frame}`);
    for (const canvas of created) {
      assert.equal(canvas.width, 1600); assert.equal(canvas.height, 1200);
      assert.equal(canvas.context.depth, 0);
      assert.equal(canvas.context._savedMatrices.length, 1);
    }
    assert.equal(created.filter(canvas => canvas.context.calls.some(call => call[0] === 'fill' && call[1] === 'rgba(255,255,255,1)')).length,
      activeMasks, `one opaque geometry canvas per active source mask at frame ${frame}`);
  }
  assert.throws(() => asset.render(new MockCanvas(800, 600), {frame: 1}), /1600x1200/);
  assert.throws(() => asset.render(null, {frame: 1}), /2D canvas context/);
  const foreign = new MockCanvas(1600, 1200); foreign.context.__helpMathFfdecAssetId = 'other';
  assert.throws(() => asset.render(foreign, {frame: 1}), /different FFDec adapter/);
});

test('runtime allows the retained source documentation comment and blocks executable external behavior', () => {
  validateP009Runtime(candidate.runtime);
  assert.match(candidate.runtime, /html5rocks/);
  for (const suffix of [
    '\neval("x")', '\nfetch("x")', '\nsetTimeout(x,1)', '\ndocument.body',
    '\nnew Audio()', '\n_root.DoHyperLinks()', '\nvar remote="https://invalid.test/a.png";',
    '\nvar remote="http://invalid.test/a.png";', '\nimport("x")',
  ]) assert.throws(() => validateP009Runtime(candidate.runtime + suffix));
});

test('visual engineering candidate asserts no registration or downstream acceptance', () => {
  assert.ok(Object.values(P009_ACCEPTANCE_EFFECTS).every(value => value === false));
  assert.equal(candidate.spec.timeline.local.originalTerminalStopEstablished, false);
  assert.equal(candidate.spec.composition.naturalRootExecution, false);
  assert.equal(candidate.spec.runtimeContract.currentCanonicalFrameDomainDispositionAsserted, false);
  assert.ok(candidate.spec.runtimeContract.unresolved.length >= 6);
});
