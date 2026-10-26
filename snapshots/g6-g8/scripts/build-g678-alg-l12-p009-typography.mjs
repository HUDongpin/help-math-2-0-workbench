import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'acorn';
import {Script} from 'node:vm';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORK = 'migrations/shared-alg001-l12-p009';
const SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/VB/L12VB04.swf';
const SOURCE_SHA = 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533';
export const P009_CANDIDATE_SHA = '57ee43de0a87a1d2d76c926fe63df037352389cea2349726b16f70509fc685c3';
const REGISTRY = 'HELP_MATH_P009_TYPOGRAPHY_ASSETS';
const PREFIX = '__p009NativeText';
const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';

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
function literal(node) {
  if (node.type === 'Literal') return node.value;
  if (node.type === 'UnaryExpression' && node.operator === '-') return -literal(node.argument);
  if (node.type === 'ArrayExpression') return node.elements.map(literal);
  throw Error('P009 source placement must have literal geometry');
}

export function collectP009SuppressionTargets(bytes) {
  assert.equal(hash(bytes), SOURCE_SHA);
  const source = collectSwfTextSourceCatalog(bytes);
  const main = source.timelines.find(timeline => timeline.timelineId === 'sprite-62');
  const textIds = new Set(source.textDefinitions.map(definition => definition.characterId));
  assert.equal(textIds.size, 16);
  const targets = main.instances.filter(instance => textIds.has(instance.characterId) || [2, 25, 30].includes(instance.characterId)).map(instance => ({
    id: `root:1:1:62/sprite-62:${instance.depth}:${instance.generation}:${instance.characterId}`,
    firstFrame: instance.firstFrame, lastFrameExclusive: instance.lastFrameExclusive,
    object: `${textIds.has(instance.characterId) ? 'text' : 'shape'}${instance.characterId}`,
    sourceInstanceId: instance.instanceId,
    events: instance.updates.map(id => main.events.find(event => event.eventId === id)),
  }));
  assert.equal(targets.length, 47);
  return [...targets, {id: 'root:85:1:63', firstFrame: 1, lastFrameExclusive: 395,
    object: 'shape63', sourceInstanceId: 'root/depth-85/generation-1',
    events: [{frame: 1, matrix: [1, 0, 0, 1, 0, 0]}]}];
}

/** A synchronous render transaction. No clock, network, audio or DOM state. */
function runtime(rules) {
  let active = null;
  function place(id, sourceFrame, draw) {
    if (!active) return draw();
    if (sourceFrame !== null && active.frame !== sourceFrame) throw Error('P009 suppression frame differs');
    if (!active.requested.has(id)) throw Error('P009 exact suppression request missing');
    if (active.seen.has(id)) throw Error('P009 duplicate source placement');
    active.seen.add(id);
    return undefined;
  }
  function render(canvas, request, draw) {
    if (active) throw Error('P009 render is already active');
    if (!request || !Number.isInteger(request.frame) || request.frame < 1 || request.frame > 394 ||
      request.frameDomain !== 'sprite-62' || request.rootFrame !== 6 ||
      request.scenario !== 'source-static-frame' || request.lang !== 'en' || request.seed !== 0)
      throw Error('P009 unsupported native source context');
    const requested = request.text?.suppressInstanceIds;
    const expected = rules.filter(rule => request.frame >= rule.firstFrame && request.frame < rule.lastFrameExclusive).map(rule => rule.id);
    if (!Array.isArray(requested) || requested.length !== expected.length ||
      new Set(requested).size !== requested.length || requested.some(id => !expected.includes(id)))
      throw Error('P009 suppression must match this frame exactly');
    active = {frame: request.frame, requested: new Set(requested), seen: new Set()};
    try {
      const state = draw(canvas, request);
      if (expected.some(id => !active.seen.has(id))) throw Error('P009 source placement was not observed');
      return {state, suppressedInstanceIds: [...active.seen], unfulfilledSuppressionIds: [], diagnostics: []};
    } finally {active = null;}
  }
  return {place, render};
}

export function buildP009Typography(candidate, bytes) {
  assert.equal(hash(candidate), P009_CANDIDATE_SHA, 'P009 source candidate changed');
  assert(!candidate.includes(PREFIX));
  const targets = collectP009SuppressionTargets(bytes);
  const ast = parse(candidate, {ecmaVersion: 2022, sourceType: 'script'});
  const edits = [], observations = Array.from({length: 394}, () => []);
  let iife, registration, registryCount = 0, titleCount = 0;
  const retainedRootTitleFrames = [];
  walk(ast, (node, scope) => {
    if (node.type === 'FunctionExpression' && node.params.length === 1 && node.params[0].name === 'global') iife = node;
    if (node.type === 'Literal' && node.value === 'HELP_MATH_CANVAS_ASSETS') {
      edits.push({start: node.start, end: node.end, text: JSON.stringify(REGISTRY)}); registryCount++;
    }
    if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' &&
      node.left.object.name === 'registry' && node.right.callee?.object?.name === 'Object') registration = node.right.arguments[0];
    if (node.type !== 'CallExpression' || node.callee.name !== 'place') return;
    const object = node.arguments[0]?.value;
    if (!targets.some(target => target.object === object)) return;
    assert.equal(node.arguments.length, 9);
    const matrix = literal(node.arguments[3]);
    // The retained FFDec root function is reference code, not this adapter's
    // entry point. The maintained render() composes the frozen root-6 title.
    if (scope.function === 'main' && object === 'shape63') {
      assert.deepEqual(matrix, [0.05, 0, 0, 0.05, 0, 0]);
      retainedRootTitleFrames.push(scope.frame); return;
    }
    const isTitle = scope.function === 'render' && object === 'shape63';
    assert(isTitle || (scope.function === 'sprite62' && Number.isInteger(scope.frame)), 'unexpected text placement scope');
    const frame = isTitle ? 1 : scope.frame + 1;
    const matches = targets.filter(target => target.object === object && frame >= target.firstFrame && frame < target.lastFrameExclusive).filter(target => {
      let sourceMatrix;
      for (const event of target.events) if (event.frame <= frame && event.matrix) sourceMatrix = event.matrix;
      assert(sourceMatrix, 'missing inherited source transform');
      return sourceMatrix.every((value, index) => Math.abs(value / 20 - matrix[index]) < 1e-12);
    });
    assert.equal(matches.length, 1, `ambiguous ${object} at ${frame}`);
    const target = matches[0];
    if (isTitle) titleCount++; else observations[scope.frame].push(target.id);
    edits.push({start: node.start, end: node.end,
      text: `${PREFIX}.place(${JSON.stringify(target.id)},${isTitle ? 'null' : frame},()=>${candidate.slice(node.start, node.end)})`});
  });
  assert(iife && registration && registryCount === 2 && titleCount === 1, 'P009 candidate envelope differs');
  assert.deepEqual(retainedRootTitleFrames, [5, 6, 7, 8, 9]);
  for (let i = 0; i < 394; i++) {
    const expected = targets.filter(target => target.object !== 'shape63' && i + 1 >= target.firstFrame && i + 1 < target.lastFrameExclusive).map(target => target.id).sort();
    assert.deepEqual(observations[i].sort(), expected, `P009 frame ${i + 1} source text closure`);
  }
  const rules = targets.map(({id, firstFrame, lastFrameExclusive}) => ({id, firstFrame, lastFrameExclusive}));
  const directive = iife.body.body[0];
  assert.equal(directive.directive, 'use strict', 'P009 strict runtime directive required');
  edits.push({start: directive.end, end: directive.end,
    text: `\nconst ${PREFIX}=(${runtime.toString()})(${JSON.stringify(rules)});\n`});
  edits.push({start: registration.start + 1, end: registration.start + 1,
    text: `renderWithText:(canvas,request)=>${PREFIX}.render(canvas,request,render),\n`});
  let output = candidate, end = Infinity;
  for (const edit of edits.sort((a, b) => b.start - a.start)) {
    assert(edit.end <= end, 'overlapping P009 generated edits');
    output = output.slice(0, edit.start) + edit.text + output.slice(edit.end); end = edit.start;
  }
  new Script(output);
  return {runtime: output, targets: rules, placedTextCalls: observations.reduce((count, rows) => count + rows.length, 0)};
}

async function main() {
  assert(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]));
  assert.equal(await realpath(SOURCE), SOURCE);
  const candidate = await readFile(path.join(ROOT, WORK, 'candidate-v1/canvas-renderer.js'), 'utf8');
  const result = buildP009Typography(candidate, await readFile(SOURCE));
  const metadata = {animationId: 'shared-alg001-l12-p009', version: 'p009-source-native-text-v1',
    sourceSha256: SOURCE_SHA, sourceCandidateSha256: P009_CANDIDATE_SHA,
    generatorSha256: hash(await readFile(fileURLToPath(import.meta.url))),
    runtimeSha256: hash(result.runtime), runtimeBytes: Buffer.byteLength(result.runtime),
    renderScale: 2, canvas: {width: 1600, height: 1200}, bitmapCount: 0,
    exactSuppressionInstances: result.targets, placedTextCalls: result.placedTextCalls,
    acceptanceEffect: 'none', registered: false, audioEnabled: false};
  const out = path.join(ROOT, WORK, 'typography-v1');
  if (process.argv[2] === '--write') await mkdir(out);
  for (const [name, value] of [['canvas-renderer.js', result.runtime], ['runtime-meta.json', json(metadata)]]) {
    if (process.argv[2] === '--check') assert.equal(await readFile(path.join(out, name), 'utf8'), value);
    else await writeFile(path.join(out, name), value, {flag: 'wx'});
  }
  console.log(json({runtimeSha256: metadata.runtimeSha256, runtimeBytes: metadata.runtimeBytes,
    suppressionInstances: result.targets.length, placedTextCalls: result.placedTextCalls}));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch(error => {console.error(error); process.exitCode = 1;});
