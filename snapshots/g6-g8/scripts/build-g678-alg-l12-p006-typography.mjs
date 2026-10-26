#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'acorn';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const P006_TYPOGRAPHY_ID = 'shared-alg001-l12-p006';
export const P006_TYPOGRAPHY_REGISTRY = 'HELP_MATH_P006_TYPOGRAPHY_ASSETS';
export const P006_TYPOGRAPHY_SOURCE_SHA = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6';
export const P006_TYPOGRAPHY_CANDIDATE_SHA = 'b2fd1788ce5bab5efab167bf303608da66621ead66f6d276979fb09558b39ddc';
export const P006_TYPOGRAPHY_INSTANCES = Object.freeze({
  question: 'root:1:1:53/sprite-53:20:1:46',
  title: 'root:65:1:56/sprite-56:1:1:55',
  underlines: 'root:1:1:53/sprite-53:19:1:44',
  background: 'root:1:1:53/sprite-53:17:17:42',
});
const SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/RW/L12RW06.swf';
const WORK = `migrations/${P006_TYPOGRAPHY_ID}`;
const OUT = `${WORK}/typography-v1`;
const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const PREFIX = '__p006Typography';

function walk(node, visit, scope = {}) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'FunctionDeclaration') scope = {...scope, function: node.id.name};
  if (node.type === 'SwitchCase') scope = {...scope, exportFrame: node.test?.value};
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
  throw Error('P006 typography requires literal draw arguments');
}

function sourceEvidence(bytes) {
  assert.equal(bytes.length, 708053, 'P006 source size drift');
  assert.equal(hash(bytes), P006_TYPOGRAPHY_SOURCE_SHA, 'P006 source hash drift');
  const catalog = collectSwfTextSourceCatalog(bytes);
  const timeline = id => catalog.timelines.find(item => item.timelineId === id);
  const placement = (id, instanceId, characterId, first, last, matrix, tagSha, expectedUpdates = 1) => {
    const item = timeline(id).instances.find(entry => entry.instanceId === instanceId);
    assert(item, `missing exact source instance ${instanceId}`);
    assert.deepEqual([item.characterId, item.firstFrame, item.lastFrameExclusive], [characterId, first, last]);
    const event = timeline(id).events.find(entry => entry.eventId === item.createdByEventId);
    assert.deepEqual(event.matrix, matrix);
    assert.equal(event.sourceTagSha256, tagSha);
    assert.equal(item.updates.length, expectedUpdates, 'placement update count drift');
    return {instanceId, characterId, firstFrame: first, lastFrameExclusive: last,
      matrix, createdByEventId: item.createdByEventId, sourceTagSha256: tagSha};
  };
  assert.deepEqual(['root', 'sprite-53', 'sprite-56'].map(id => timeline(id).declaredFrameCount), [10, 342, 1]);
  const questionParent = placement('root', 'root/depth-1/generation-1', 53, 6, 11,
    [1, 0, 0, 1, 5568, 7337], 'bd70b3fbcdfda6772700c9bbbbbb51f15a234fff3f8bc3ebde72f18579951226');
  const question = placement('sprite-53', 'sprite-53/depth-20/generation-1', 46, 249, 343,
    [1, 0, 0, 1, -3827, -5250], '3da8f75e15b6d9fd2e7945c40786a972dd9a69f3737d2b1bdb936e71bb8825d0');
  const underlines = placement('sprite-53', 'sprite-53/depth-19/generation-1', 44, 249, 343,
    [1, 0, 0, 1, 2514, -4806], '449066673384ba03d8ea6ab4ece8624daa7c96930038dd8f1fd2d36e1f1dd752');
  const background = placement('sprite-53', 'sprite-53/depth-17/generation-17', 42, 242, 343,
    [1, 0, 0, 1, 2514, -4826], '08c55e085f0eb2d2ff51ca50604e068924cbe29e64b24dac22b5ea380c33c9f3', 7);
  const backgroundUpdates = timeline('sprite-53').events.filter(event => event.instanceId === background.instanceId);
  assert.deepEqual(backgroundUpdates.map(event => event.frame), [242, 243, 244, 245, 246, 247, 248]);
  assert.deepEqual(backgroundUpdates.map(event => event.colorTransform), [0, 43, 85, 128, 171, 213, 256]
    .map(alpha => ({multiply: [256, 256, 256, alpha], add: [0, 0, 0, 0], divisor: 256})));
  assert(backgroundUpdates.slice(1).every(event => event.move === true && event.characterId === undefined && event.matrix === undefined));
  const titleParent = placement('root', 'root/depth-65/generation-1', 56, 6, 11,
    [1, 0, 0, 1, 8000, 869], '95c6f1b61934a4383d0df69047f18070121ec9e098e22246c10a204fbe45301e');
  const title = placement('sprite-56', 'sprite-56/depth-1/generation-1', 55, 1, 2,
    [1, 0, 0, 1, 0, 0], '98b8449fc44ed43635f56607f9a303dcedf4413153fad8b23163c918100ed530');
  const text = catalog.textDefinitions.find(entry => entry.characterId === 46);
  assert.equal(text.sourceTagSha256, 'add6792b852d59e5ea04ec0cdbb35e4b52d19ae9bd64156dfb96919938420fdd');
  const shape = catalog.shapeDefinitions.find(entry => entry.characterId === 55);
  assert.equal(shape.sourceTagSha256, 'c12e756f774672ff8ded0cc3916ee99587d3243c138ca83839b2f61a4e1a2dbf');
  const underlineShape = catalog.shapeDefinitions.find(entry => entry.characterId === 44);
  assert.equal(underlineShape.sourceTagSha256, 'b67301df210b5e9ba802077935654f227285dde4570083f3bc6b71cc0df96cc2');
  const backgroundShape = catalog.shapeDefinitions.find(entry => entry.characterId === 42);
  assert.equal(backgroundShape.sourceTagSha256, '9060ab0868b4a2ca44d5e805be99b6bca29abd8816230ef628aa09e55173f7bc');
  return {question: {id: P006_TYPOGRAPHY_INSTANCES.question, path: [questionParent, question],
    sourceTextCharacterId: 46, sourceTextTagSha256: text.sourceTagSha256, publicFrames: [249, 342]},
  title: {id: P006_TYPOGRAPHY_INSTANCES.title, path: [titleParent, title],
    sourceShapeCharacterId: 55, sourceShapeTagSha256: shape.sourceTagSha256, publicFrames: [1, 342]},
  underlines: {id: P006_TYPOGRAPHY_INSTANCES.underlines, path: [questionParent, underlines],
    sourceShapeCharacterId: 44, sourceShapeTagSha256: underlineShape.sourceTagSha256, publicFrames: [249, 342]},
  background: {id: P006_TYPOGRAPHY_INSTANCES.background, path: [questionParent, background],
    sourceShapeCharacterId: 42, sourceShapeTagSha256: backgroundShape.sourceTagSha256, publicFrames: [242, 342],
    alphaUpdates: backgroundUpdates.map(event => ({frame: event.frame, sourceTagSha256: event.sourceTagSha256,
      multiplyAlpha: event.colorTransform.multiply[3], divisor: event.colorTransform.divisor}))},
  offstageRootText54: {suppressed: false, semanticSubstitutionAsserted: false},
  questionRevealMask: {preserved: true, semanticRevealPolicyOwnedByNativeBinding: true}};
}

function runtime(configuration) {
  let active = null;
  function scope(name, draw) {
    if (!active) return draw();
    const prior = active.scope;
    active.scope = name;
    try {return draw();} finally {active.scope = prior;}
  }
  function place(instanceId, obj, canvas, ctx, matrix, ctrans, blendMode, frame, ratio, time, draw) {
    if (!active) return draw();
    const rule = configuration.instances[instanceId];
    const mapped = rule && active.scope === rule.scope && obj === rule.object && blendMode === 1 &&
      active.frame >= rule.frames[0] && active.frame <= rule.frames[1] &&
      Array.isArray(matrix) && matrix.length === 6 && matrix.every((value, index) => value === rule.matrix[index]);
    const suppress = mapped && active.validRequest && active.requested.has(instanceId);
    if (!mapped) active.diagnostics.push({kind: 'exact-placement-scope-mismatch', instanceId});
    active.observations.push({instanceId, object: obj, frame: active.frame,
      suppressionRequested: active.requested.has(instanceId), suppressed: Boolean(suppress)});
    if (suppress) {active.suppressed.add(instanceId); return undefined;}
    return draw();
  }
  function render(canvas, request, resolveState, draw) {
    if (active) throw Error('P006 typography render is already active');
    if (request?.renderScale !== undefined && request.renderScale !== 1) throw Error('P006 typography supports native scale 1 only');
    const requested = request?.text?.suppressInstanceIds ?? [];
    if (!Array.isArray(requested) || requested.some(id => typeof id !== 'string') || new Set(requested).size !== requested.length)
      throw Error('P006 typography requires unique suppression instance ids');
    const state = resolveState(request);
    const unknown = requested.filter(id => !Object.prototype.hasOwnProperty.call(configuration.instances, id));
    active = {frame: state.localFrame, scope: null, requested: new Set(requested), validRequest: !unknown.length,
      suppressed: new Set(), observations: [], diagnostics: unknown.map(instanceId => ({kind: 'unsupported-suppression-id', instanceId}))};
    try {
      const actualState = draw(canvas, request);
      const suppressed = [...active.suppressed];
      const unfulfilled = requested.filter(id => !active.suppressed.has(id));
      return {state: actualState, diagnostics: active.diagnostics, observations: active.observations,
        suppressedInstanceIds: suppressed, unfulfilledSuppressionIds: unfulfilled};
    } finally {active = null;}
  }
  return {scope, place, render};
}

export function buildP006Typography({safeJavascript, sourceBytes}) {
  assert.equal(hash(safeJavascript), P006_TYPOGRAPHY_CANDIDATE_SHA, 'P006 candidate hash drift');
  assert.equal(Buffer.byteLength(safeJavascript), 11507597, 'P006 candidate size drift');
  assert(!safeJavascript.includes(PREFIX), 'P006 typography already instrumented');
  const evidence = sourceEvidence(sourceBytes);
  const ast = parse(safeJavascript, {ecmaVersion: 2022, sourceType: 'script'});
  const edits = [];
  const replace = (node, text) => edits.push({start: node.start, end: node.end, text});
  const insert = (position, text) => edits.push({start: position, end: position, text});
  const bodySites = [], titleSites = [], underlineSites = [], backgroundSites = [], bodyParents = [], titleParents = [], registryNodes = [];
  let iife, registration;
  walk(ast, (node, scope) => {
    if (node.type === 'FunctionExpression' && node.params.length === 1 && node.params[0].name === 'global') iife = node;
    if (node.type === 'Literal' && node.value === 'HELP_MATH_CANVAS_ASSETS') registryNodes.push(node);
    if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' &&
        node.left.object.name === 'registry' && node.right.callee?.object?.name === 'Object') registration = node.right.arguments[0];
    if (node.type !== 'CallExpression') return;
    if (scope.function === 'render' && node.callee.name === 'sprite53') bodyParents.push(node);
    if (node.callee.name !== 'place') return;
    const object = node.arguments[0]?.value;
    if (scope.function === 'render' && object === 'sprite56') titleParents.push(node);
    if (scope.function === 'sprite53' && object === 'text46') bodySites.push({node, frame: scope.exportFrame});
    if (scope.function === 'sprite53' && object === 'shape44') underlineSites.push({node, frame: scope.exportFrame});
    if (scope.function === 'sprite53' && object === 'shape42') backgroundSites.push({node, frame: scope.exportFrame});
    if (scope.function === 'sprite56' && object === 'shape55') titleSites.push({node, frame: scope.exportFrame});
  });
  assert(iife && registration && registryNodes.length === 2, 'P006 unsupported candidate envelope');
  assert.deepEqual(bodySites.map(site => site.frame), Array.from({length: 94}, (_, index) => index + 248));
  assert.deepEqual(titleSites.map(site => site.frame), [0]);
  assert.deepEqual(underlineSites.map(site => site.frame), Array.from({length: 94}, (_, index) => index + 248));
  assert.deepEqual(backgroundSites.map(site => site.frame), Array.from({length: 101}, (_, index) => index + 241));
  assert.equal(bodyParents.length, 1); assert.equal(titleParents.length, 1);
  assert.deepEqual(literal(titleParents[0].arguments[3]), [0.05, 0, 0, 0.05, 400, 43.45]);
  for (const [sites, matrix, id] of [[bodySites, [0.05, 0, 0, 0.05, -191.35, -262.5], evidence.question.id],
    [titleSites, [1, 0, 0, 1, 0, 0], evidence.title.id],
    [underlineSites, [0.05, 0, 0, 0.05, 125.7, -240.3], evidence.underlines.id],
    [backgroundSites, [0.05, 0, 0, 0.05, 125.7, -241.3], evidence.background.id]]) {
    for (const {node} of sites) {
      assert.equal(node.arguments.length, 9);
      assert.deepEqual(literal(node.arguments[3]), matrix);
      assert.equal(literal(node.arguments[5]), 1);
      replace(node.callee, `${PREFIX}Place`);
      insert(node.arguments[0].start, `${JSON.stringify(id)},`);
    }
  }
  for (const [node, name] of [[bodyParents[0], 'question'], [titleParents[0], 'title']]) {
    replace(node, `${PREFIX}Runtime.scope(${JSON.stringify(name)},function(){return ${safeJavascript.slice(node.start, node.end)};})`);
  }
  const configuration = {instances: {
    [evidence.question.id]: {scope: 'question', object: 'text46', matrix: [0.05, 0, 0, 0.05, -191.35, -262.5], frames: [249, 342]},
    [evidence.title.id]: {scope: 'title', object: 'shape55', matrix: [1, 0, 0, 1, 0, 0], frames: [1, 342]},
    [evidence.underlines.id]: {scope: 'question', object: 'shape44', matrix: [0.05, 0, 0, 0.05, 125.7, -240.3], frames: [249, 342]},
    [evidence.background.id]: {scope: 'question', object: 'shape42', matrix: [0.05, 0, 0, 0.05, 125.7, -241.3], frames: [242, 342]},
  }};
  const directive = iife.body.body[0];
  assert.equal(directive.directive, 'use strict');
  insert(directive.end, `\n/* Generated P006 exact-placement typography variant; source graphics remain unchanged. */\n` +
    `var ${PREFIX}Runtime=(${runtime.toString()})(${JSON.stringify(configuration)});\n` +
    `function ${PREFIX}Place(id,obj,targetCanvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){\n` +
    `return ${PREFIX}Runtime.place(id,obj,targetCanvas,ctx,matrix,ctrans,blendMode,frame,ratio,time,function(){return place(obj,targetCanvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);});\n}\n` +
    `function ${PREFIX}Render(targetCanvas,request){return ${PREFIX}Runtime.render(targetCanvas,request,resolveFrameState,sourceRender);}\n`);
  registryNodes.forEach(node => replace(node, JSON.stringify(P006_TYPOGRAPHY_REGISTRY)));
  const metadata = registration.properties.find(property => property.key.name === 'metadata');
  assert(metadata?.value.name === 'METADATA');
  replace(metadata.value, `deepFreeze(Object.assign({},METADATA,{nativeOnlyResolution:{width:800,height:600,supportedScales:[1]},textSuppression:${JSON.stringify(evidence)}}))`);
  insert(registration.end - 1, `,renderWithText:${PREFIX}Render`);
  let cursor = 0, code = '';
  edits.sort((left, right) => left.start - right.start || left.end - right.end);
  for (const edit of edits) {
    assert(edit.start >= cursor, 'overlapping P006 typography edits');
    code += safeJavascript.slice(cursor, edit.start) + edit.text; cursor = edit.end;
  }
  code += safeJavascript.slice(cursor);
  parse(code, {ecmaVersion: 2022, sourceType: 'script'});
  return {code, manifest: {schemaVersion: 1, kind: 'p006-exact-placement-typography-v1',
    animationId: P006_TYPOGRAPHY_ID, sourceSwfSha256: P006_TYPOGRAPHY_SOURCE_SHA,
    globalRegistry: P006_TYPOGRAPHY_REGISTRY, originalRuntimeSha256: P006_TYPOGRAPHY_CANDIDATE_SHA,
    originalRuntimeBytes: 11507597, originalCandidate: 'candidate-v2', runtimeSha256: hash(code), runtimeBytes: Buffer.byteLength(code),
    nativeOnlyResolution: {width: 800, height: 600, supportedScales: [1]},
    evidence, instrumentedSites: {question: bodySites.length, title: titleSites.length,
      underlines: underlineSites.length, background: backgroundSites.length},
    drawing: {ordinaryRenderPreservesSourceWrapper: true, textRenderUsesHostOwnedDetachedSurface: true,
      sourceMaskAllocationsPreserved: true, nonTextFunctionsModified: false},
    claimBoundary: {registered: false, nativeTextBindingValidated: false, originalRuntimeEvidence: false,
      typographyAccepted: false, humanReview: false, ownerAccepted: false, strictComplete: false}}};
}

export async function buildP006TypographyFiles({root = ROOT, source = SOURCE, check = false} = {}) {
  assert.equal(await realpath(source), source, 'P006 requires physical source');
  const sourceBytes = await readFile(source);
  const candidate = await readFile(path.join(root, WORK, 'candidate-v2/canvas-renderer.js'), 'utf8');
  const result = buildP006Typography({safeJavascript: candidate, sourceBytes});
  const generatorBytes = await readFile(fileURLToPath(import.meta.url));
  const parserBytes = await readFile(path.join(ROOT, 'scripts/lib/swf-text-source-catalog.mjs'));
  const manifest = {...result.manifest, generator: {version: '1.0.0',
    sha256: hash(generatorBytes), sourceParserSha256: hash(parserBytes)}};
  const runtimeMeta = Object.fromEntries(['animationId', 'sourceSwfSha256', 'runtimeSha256', 'runtimeBytes'].map(key => [key, manifest[key]]));
  const outputs = [['canvas-renderer.js', result.code], ['adapter-manifest.json', json(manifest)], ['runtime-meta.json', json(runtimeMeta)]];
  if (!check) await mkdir(path.join(root, OUT), {recursive: true});
  for (const [name, content] of outputs) {
    const destination = path.join(root, OUT, name);
    if (check) assert.equal(await readFile(destination, 'utf8'), content, `P006 typography output drift: ${name}`);
    else {
      try {await writeFile(destination, content, {flag: 'wx'});}
      catch (error) {
        if (error.code !== 'EEXIST') throw error;
        assert.equal(await readFile(destination, 'utf8'), content, `refusing to overwrite changed P006 typography output: ${name}`);
      }
    }
  }
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  assert(args.length <= 1 && args.every(arg => arg === '--check'), 'Usage: build-g678-alg-l12-p006-typography.mjs [--check]');
  buildP006TypographyFiles({check: args.includes('--check')})
    .then(manifest => console.log(json({animationId: manifest.animationId, runtimeSha256: manifest.runtimeSha256,
      runtimeBytes: manifest.runtimeBytes, instrumentedSites: manifest.instrumentedSites})))
    .catch(error => {console.error(error); process.exitCode = 1;});
}
