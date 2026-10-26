import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync, realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createContext, Script} from 'node:vm';
import {parse} from 'acorn';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';
import {buildP009Typography, P009_CANDIDATE_SHA} from './build-g678-alg-l12-p009-typography.mjs';

const ID = 'shared-alg001-l12-p009';
const PREFIX = '__p009NativeText';
const SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/VB/L12VB04.swf';
const SOURCE_SHA = 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533';
const RUNTIME_SHA = 'a550205ed3e43df256798a6cac5668adf87bf95484c5664e49534f7de99c126d';
const work = new URL('../migrations/shared-alg001-l12-p009/', import.meta.url);
const read = relative => readFileSync(new URL(relative, work));
const sourceBytes = readFileSync(SOURCE);
const candidate = read('candidate-v1/canvas-renderer.js').toString();
const runtime = read('typography-v1/canvas-renderer.js').toString();
const metadata = JSON.parse(read('typography-v1/runtime-meta.json'));
const hash = value => createHash('sha256').update(value).digest('hex');
const plain = value => JSON.parse(JSON.stringify(value));
const source = collectSwfTextSourceCatalog(sourceBytes);
const main = source.timelines.find(timeline => timeline.timelineId === 'sprite-62');
const textIds = new Set(source.textDefinitions.map(definition => definition.characterId));
// Independent source catalog query: 44 text instances, three source underline
// instances, and the outlined title placed by the adapter at root frame 6.
const sourceInstances = main.instances.filter(instance => textIds.has(instance.characterId) || [2, 25, 30].includes(instance.characterId));
const sourceTargets = sourceInstances.map(instance => ({
  id: `root:1:1:62/sprite-62:${instance.depth}:${instance.generation}:${instance.characterId}`,
  firstFrame: instance.firstFrame, lastFrameExclusive: instance.lastFrameExclusive,
}));
sourceTargets.push({id: 'root:85:1:63', firstFrame: 1, lastFrameExclusive: 395});
const expectedIds = frame => sourceTargets.filter(target => frame >= target.firstFrame && frame < target.lastFrameExclusive).map(target => target.id);
const request = frame => ({frame, frameDomain: 'sprite-62', rootFrame: 6,
  scenario: 'source-static-frame', lang: 'en', seed: 0,
  text: {suppressInstanceIds: expectedIds(frame)}});

function walk(node, visit, scope = {}) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'FunctionDeclaration') scope = {...scope, function: node.id.name};
  if (node.type === 'SwitchCase') scope = {...scope, frame: node.test?.value};
  if (node.type) visit(node, scope);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit, scope));
    else if (value && typeof value === 'object') walk(value, visit, scope);
  }
}
const ast = parse(runtime, {ecmaVersion: 2022});
const candidateAst = parse(candidate, {ecmaVersion: 2022});
const wrappedCalls = [];
let runtimeIife, transactionDeclaration;
walk(ast, (node, scope) => {
  if (node.type === 'FunctionExpression' && node.params.length === 1 && node.params[0].name === 'global') runtimeIife = node;
  if (node.type === 'VariableDeclaration' && node.declarations.some(declaration => declaration.id.name === PREFIX)) transactionDeclaration = node;
  if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' &&
    node.callee.object.name === PREFIX && node.callee.property.name === 'place') wrappedCalls.push({node, scope});
});
function literal(node) {
  if (node.type === 'Literal') return node.value;
  if (node.type === 'UnaryExpression' && node.operator === '-') return -literal(node.argument);
  if (node.type === 'ArrayExpression') return node.elements.map(literal);
  throw Error('nonliteral source geometry');
}
function functions(code, tree) {
  const found = new Map();
  walk(tree, node => {
    if (node.type === 'FunctionDeclaration' && /^(?:shape|text|font|button)\d+$|^sprite62$|^main$/.test(node.id.name)) {
      assert.ok(!found.has(node.id.name), `duplicate source drawing function ${node.id.name}`);
      found.set(node.id.name, code.slice(node.start, node.end));
    }
  });
  return found;
}

class MockContext {
  constructor(canvas, trace = null) { this.canvas = canvas; this.trace = trace; this.depth = 0; this.operations = 0; }
  record(name, args = []) { this.operations++; if (this.trace) this.trace.push([this.canvas.index, name, ...args]); }
  save() { this.depth++; }
  restore() { assert.ok(this.depth > 0, 'unbalanced native restore'); this.depth--; }
  transform(...args) { this.record('transform', args); }
  setTransform(...args) { this.record('setTransform', args); }
  resetTransform() { this.record('resetTransform'); }
  scale(...args) { this.record('scale', args); }
  rotate(...args) { this.record('rotate', args); }
  translate(...args) { this.record('translate', args); }
  beginPath() { this.record('beginPath'); }
  moveTo(...args) { this.record('moveTo', args); }
  lineTo(...args) { this.record('lineTo', args); }
  quadraticCurveTo(...args) { this.record('quadraticCurveTo', args); }
  bezierCurveTo(...args) { this.record('bezierCurveTo', args); }
  closePath() { this.record('closePath'); }
  fill(rule) { this.record('fill', [this.fillStyle, rule]); }
  stroke() { this.record('stroke', [this.strokeStyle, this.lineWidth]); }
  fillRect(...args) { this.canvas.onFillRect?.(); this.record('fillRect', args); }
  drawImage(image, ...args) { this.record('drawImage', [image.index, image.width, image.height, ...args]); }
}
class MockCanvas {
  constructor(index = 0, trace = null, width = 1600, height = 1200) {
    this.index = index; this.width = width; this.height = height;
    this.style = {}; this.attributes = {}; this.context = new MockContext(this, trace);
  }
  getContext(kind) { assert.equal(kind, '2d'); return this.context; }
  setAttribute(name, value) { this.attributes[name] = value; }
}

function load(code = runtime, {exposeTransaction = false, trace = null} = {}) {
  const created = [];
  const context = createContext({document: {createElement(kind) {
    assert.equal(kind, 'canvas');
    const canvas = new MockCanvas(created.length + 1, trace, 0, 0); created.push(canvas); return canvas;
  }}});
  if (exposeTransaction) {
    // Test-only in-memory probe. The delivered runtime remains untouched.
    code = code.slice(0, transactionDeclaration.end) +
      `\nglobal.__p009TestTransaction=${PREFIX};\n` + code.slice(transactionDeclaration.end);
  }
  new Script(code).runInContext(context, {timeout: 3000});
  const registry = context.HELP_MATH_P009_TYPOGRAPHY_ASSETS ?? context.HELP_MATH_CANVAS_ASSETS;
  return {context, asset: registry[ID], created, target: new MockCanvas(0, trace), transaction: context.__p009TestTransaction};
}

test('exact source, candidate, generator and delivered runtime bindings reproduce the artifact', () => {
  assert.equal(realpathSync(SOURCE), SOURCE);
  assert.equal(sourceBytes.length, 165405); assert.equal(hash(sourceBytes), SOURCE_SHA);
  assert.deepEqual(read('audit/source-input.swf'), sourceBytes);
  assert.equal(hash(candidate), P009_CANDIDATE_SHA);
  assert.equal(hash(runtime), RUNTIME_SHA); assert.equal(Buffer.byteLength(runtime), 4619022);
  const generated = buildP009Typography(candidate, sourceBytes);
  assert.equal(generated.runtime, runtime);
  assert.deepEqual(generated.targets, sourceTargets);
  assert.deepEqual(metadata.exactSuppressionInstances, sourceTargets);
  assert.equal(metadata.generatorSha256, hash(readFileSync(new URL('./build-g678-alg-l12-p009-typography.mjs', import.meta.url))));
  assert.equal(metadata.runtimeSha256, hash(runtime)); assert.equal(metadata.runtimeBytes, Buffer.byteLength(runtime));
  assert.equal(metadata.sourceSha256, SOURCE_SHA); assert.equal(metadata.sourceCandidateSha256, P009_CANDIDATE_SHA);
  assert.equal(metadata.acceptanceEffect, 'none'); assert.equal(metadata.registered, false); assert.equal(metadata.audioEnabled, false);
  assert.throws(() => buildP009Typography(candidate + '\n', sourceBytes), /candidate changed/);
  const changedSource = Buffer.from(sourceBytes); changedSource[changedSource.length - 1] ^= 1;
  assert.throws(() => buildP009Typography(candidate, changedSource));
});

test('strict directive stays first and is active for the inserted transaction', () => {
  const body = runtimeIife.body.body;
  assert.equal(body[0].directive, 'use strict'); assert.equal(body[1], transactionDeclaration);
  assert.ok(transactionDeclaration.start > body[0].end);
  const probe = runtime.slice(0, body[0].end) + '\n__p009UndeclaredStrictProbe=1;\n' + runtime.slice(body[0].end);
  const context = createContext({document: {createElement() { throw Error('unexpected DOM'); }}});
  assert.throws(() => new Script(probe).runInContext(context), /__p009UndeclaredStrictProbe is not defined/);
  assert.equal(context.__p009UndeclaredStrictProbe, undefined);
});

test('48 exact suppression rules and every instrumented call match physical source geometry across 394 frames', () => {
  assert.equal(textIds.size, 16);
  assert.equal(sourceInstances.filter(instance => textIds.has(instance.characterId)).length, 44);
  assert.equal(sourceTargets.length, 48); assert.equal(new Set(sourceTargets.map(target => target.id)).size, 48);
  const sourceById = new Map(sourceInstances.map(instance => [`root:1:1:62/sprite-62:${instance.depth}:${instance.generation}:${instance.characterId}`, instance]));
  const byFrame = Array.from({length: 394}, () => []);
  const titles = [];
  for (const {node, scope} of wrappedCalls) {
    assert.equal(node.arguments.length, 3);
    const [idNode, frameNode, thunk] = node.arguments;
    const id = literal(idNode), frame = literal(frameNode);
    assert.equal(thunk.type, 'ArrowFunctionExpression'); assert.equal(thunk.params.length, 0);
    const call = thunk.body;
    assert.equal(call.type, 'CallExpression'); assert.equal(call.callee.name, 'place'); assert.equal(call.arguments.length, 9);
    const matrix = literal(call.arguments[3]);
    if (id === 'root:85:1:63') {
      assert.equal(scope.function, 'render'); assert.equal(frame, null); assert.equal(call.arguments[0].value, 'shape63');
      assert.deepEqual(matrix, [0.05, 0, 0, 0.05, 0, 0]); titles.push(node); continue;
    }
    assert.equal(scope.function, 'sprite62'); assert.equal(frame, scope.frame + 1);
    const instance = sourceById.get(id); assert.ok(instance, 'instrumented placement must identify a real source instance');
    assert.equal(call.arguments[0].value, `${textIds.has(instance.characterId) ? 'text' : 'shape'}${instance.characterId}`);
    assert.ok(frame >= instance.firstFrame && frame < instance.lastFrameExclusive);
    let inheritedMatrix;
    for (const eventId of instance.updates) {
      const event = main.events.find(event => event.eventId === eventId);
      if (event.frame <= frame && event.matrix) inheritedMatrix = event.matrix;
    }
    assert.ok(inheritedMatrix);
    inheritedMatrix.forEach((value, index) => assert.ok(Math.abs(value / 20 - matrix[index]) < 1e-12,
      `source matrix component ${index} differs for ${id} at ${frame}`));
    byFrame[frame - 1].push(id);
  }
  assert.equal(titles.length, 1);
  for (let frame = 1; frame <= 394; frame++) {
    const actual = [...byFrame[frame - 1], 'root:85:1:63'];
    assert.equal(new Set(actual).size, actual.length, `duplicate exact placement at ${frame}`);
    assert.deepEqual(actual.sort(), expectedIds(frame).sort(), `physical source suppression closure at ${frame}`);
  }
  assert.equal(metadata.placedTextCalls, byFrame.reduce((sum, calls) => sum + calls.length, 0));
});

test('all source leaf graphics are byte-identical and retained root main is not instrumented', () => {
  const before = functions(candidate, candidateAst), after = functions(runtime, ast);
  const leafNames = [...before.keys()].filter(name => /^(shape|text|font|button)\d+$/.test(name));
  assert.ok(leafNames.length >= 60);
  for (const name of leafNames) assert.equal(after.get(name), before.get(name), `preserved leaf drawing ${name}`);
  assert.equal(after.get('main'), before.get('main'));
  const nativeSprite = after.get('sprite62');
  const edits = wrappedCalls.filter(call => call.scope.function === 'sprite62').map(({node}) => ({
    start: node.start, end: node.end, text: runtime.slice(node.arguments[2].body.start, node.arguments[2].body.end),
  }));
  let spriteNode;
  walk(ast, node => { if (node.type === 'FunctionDeclaration' && node.id.name === 'sprite62') spriteNode = node; });
  let restored = nativeSprite;
  for (const edit of edits.sort((a, b) => b.start - a.start))
    restored = restored.slice(0, edit.start - spriteNode.start) + edit.text + restored.slice(edit.end - spriteNode.start);
  assert.equal(restored, before.get('sprite62'), 'removing exact call instrumentation restores candidate sprite byte-for-byte');
  const rootCases = [];
  walk(candidateAst, (node, scope) => {
    if (scope.function === 'main' && node.type === 'CallExpression' && node.callee.name === 'place' && node.arguments[0].value === 'shape63') rootCases.push(scope.frame);
  });
  assert.deepEqual(rootCases, [5, 6, 7, 8, 9]);
});

test('all 394 actual mock renders fulfill every active source rule without mutating the request', async () => {
  const loaded = load(); await loaded.asset.ready(); assert.equal(loaded.created.length, 0);
  for (let frame = 1; frame <= 394; frame++) {
    loaded.created.length = 0;
    const input = request(frame), unchanged = JSON.stringify(input);
    const result = loaded.asset.renderWithText(loaded.target, input);
    assert.equal(JSON.stringify(input), unchanged);
    assert.deepEqual([...result.suppressedInstanceIds].sort(), expectedIds(frame).sort(), `observed actual placement closure at ${frame}`);
    assert.equal(new Set(result.suppressedInstanceIds).size, result.suppressedInstanceIds.length);
    assert.deepEqual(plain(result.unfulfilledSuppressionIds), []); assert.deepEqual(plain(result.diagnostics), []);
    assert.equal(result.state.localFrame, frame); assert.equal(result.state.rootFrame, 6);
    assert.equal(result.state.audioRendered, false); assert.equal(result.state.interactiveStateResolved, false);
    assert.equal(loaded.target.attributes['data-flash-frame'], String(frame));
    assert.equal(loaded.target.context.depth, 0); assert.equal(loaded.target.context._savedMatrices.length, 1);
    assert.deepEqual(plain(loaded.target.context._matrix), [2, 0, 0, 2, 0, 0]);
    for (const canvas of loaded.created) {
      assert.equal(canvas.width, 1600); assert.equal(canvas.height, 1200);
      assert.equal(canvas.context.depth, 0); assert.equal(canvas.context._savedMatrices.length, 1);
    }
  }
  const ids = request(394).text.suppressInstanceIds;
  const reversed = request(394); reversed.text.suppressInstanceIds = [...ids].reverse();
  assert.deepEqual([...loaded.asset.renderWithText(loaded.target, reversed).suppressedInstanceIds].sort(), [...ids].sort());
});

test('duplicate, unknown, missing and out-of-context suppression requests fail closed', () => {
  const {asset, target} = load();
  const input = request(394), ids = input.text.suppressInstanceIds;
  const badLists = [undefined, null, {}, [], [...ids.slice(1)], [ids[0], ...ids.slice(0, -1)],
    ['unknown-instance', ...ids.slice(1)], [...ids, 'unknown-instance'], expectedIds(1)];
  for (const list of badLists)
    assert.throws(() => asset.renderWithText(target, {...input, text: {suppressInstanceIds: list}}), /suppression must match/);
  assert.throws(() => asset.renderWithText(target, {...input, text: undefined}), /suppression must match/);
  for (const changed of [{frame: 0}, {frame: 395}, {frame: 1.5}, {frame: NaN},
    {frameDomain: 'root'}, {rootFrame: 5}, {scenario: 'glossary-ordered_pair'}, {lang: 'es'}, {seed: 1}])
    assert.throws(() => asset.renderWithText(target, {...input, ...changed}), /unsupported native source context/);
  assert.throws(() => asset.renderWithText(target, null), /unsupported native source context/);
  assert.deepEqual([...asset.renderWithText(target, input).suppressedInstanceIds].sort(), [...ids].sort());
});

test('source mismatch, duplicate observation, unfulfilled closure and reentrancy release active state in finally', () => {
  const {asset, target, transaction} = load(runtime, {exposeTransaction: true});
  const input = request(1), title = 'root:85:1:63';
  const failingDraws = [
    {pattern: /suppression frame differs/, draw() { transaction.place(title, 2, () => {}); }},
    {pattern: /duplicate source placement/, draw() { transaction.place(title, null, () => {}); transaction.place(title, null, () => {}); }},
    {pattern: /exact suppression request missing/, draw() { transaction.place('unknown-instance', null, () => {}); }},
    {pattern: /source placement was not observed/, draw() { return asset.resolveFrameState({frame: 1}); }},
    {pattern: /already active/, draw() { transaction.render(target, input, () => {}); }},
    {pattern: /synthetic draw failure/, draw() { throw Error('synthetic draw failure'); }},
  ];
  for (const {draw, pattern} of failingDraws) {
    assert.throws(() => transaction.render(target, input, draw), pattern);
    let ordinaryCalls = 0;
    assert.equal(transaction.place(title, null, () => { ordinaryCalls++; return 37; }), 37);
    assert.equal(ordinaryCalls, 1, 'ordinary placement runs after finally releases the active transaction');
    assert.deepEqual(plain(asset.renderWithText(target, input).suppressedInstanceIds), [title]);
  }
});

test('a real draw exception releases active suppression and ordinary render remains usable', () => {
  const {asset, target} = load();
  target.onFillRect = () => { throw Error('mock Canvas draw failed'); };
  assert.throws(() => asset.renderWithText(target, request(394)), /mock Canvas draw failed/);
  target.onFillRect = null;
  assert.equal(asset.render(target, {frame: 394}).localFrame, 394);
  assert.deepEqual([...asset.renderWithText(target, request(394)).suppressedInstanceIds].sort(), expectedIds(394).sort());
  const wrongCanvas = new MockCanvas(0, null, 800, 600);
  assert.throws(() => asset.renderWithText(wrongCanvas, request(394)), /1600x1200/);
  assert.equal(asset.renderWithText(target, request(394)).state.localFrame, 394);
});

test('ordinary render preserves the candidate drawing trace before and after native text transactions', () => {
  for (const frame of [1, 12, 142, 210, 291, 394]) {
    const baselineTrace = [], nativeTrace = [];
    const baseline = load(candidate, {trace: baselineTrace}), native = load(runtime, {trace: nativeTrace});
    const baselineState = baseline.asset.render(baseline.target, {frame});
    assert.deepEqual(plain(native.asset.render(native.target, {frame})), plain(baselineState));
    assert.deepEqual(nativeTrace, baselineTrace, `ordinary candidate/native drawing trace at ${frame}`);
    native.asset.renderWithText(native.target, request(frame));
    nativeTrace.length = 0; native.created.length = 0;
    assert.deepEqual(plain(native.asset.render(native.target, {frame})), plain(baselineState));
    assert.deepEqual(nativeTrace, baselineTrace, `ordinary drawing restored after native transaction at ${frame}`);
  }
});
