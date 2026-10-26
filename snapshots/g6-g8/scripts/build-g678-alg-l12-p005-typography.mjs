#!/usr/bin/env node
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, mkdir, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'acorn';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/RW/L12RW05.swf';
export const P005_TYPOGRAPHY_ID = 'shared-alg001-l12-p005';
export const P005_TYPOGRAPHY_REGISTRY = 'HELP_MATH_P005_TYPOGRAPHY_ASSETS';
export const P005_TYPOGRAPHY_SOURCE_SHA = 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe';
export const P005_TYPOGRAPHY_CANDIDATE_SHA = '48efbca3ddebf218565cdd635ffa130ae3a402c5693dd1ebcf359b2c30d500dd';
export const P005_TYPOGRAPHY_TITLE_INSTANCE = 'root:135:1:395/sprite-395:2:1:394';
const WORK = `migrations/${P005_TYPOGRAPHY_ID}`;
const OUT = `${WORK}/typography-v1`;
const PREFIX = '__p005Typography';
const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';

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
  throw Error('P005 typography requires literal draw arguments');
}

function sourceEvidence(bytes) {
  assert.equal(bytes.length, 1950595, 'P005 source size drift');
  assert.equal(hash(bytes), P005_TYPOGRAPHY_SOURCE_SHA, 'P005 source hash drift');
  const catalog = collectSwfTextSourceCatalog(bytes);
  assert.deepEqual(catalog.header, {signature: 'CWS', version: 6, sourceBytes: 1950595,
    declaredBytes: 2262082, stageBoundsTwips: {left: 0, right: 16000, top: 0, bottom: 12000},
    frameRate: 12, frameCount: 10});
  const timeline = id => catalog.timelines.find(item => item.timelineId === id);
  assert.deepEqual(['root', 'sprite-391', 'sprite-395'].map(id => timeline(id)?.declaredFrameCount), [10, 968, 1]);
  const placement = (id, instanceId, characterId, first, last, matrix, tagSha) => {
    const item = timeline(id).instances.find(entry => entry.instanceId === instanceId);
    assert(item, `missing exact source instance ${instanceId}`);
    assert.deepEqual([item.characterId, item.firstFrame, item.lastFrameExclusive], [characterId, first, last]);
    const event = timeline(id).events.find(entry => entry.eventId === item.createdByEventId);
    assert.deepEqual(event.matrix, matrix);
    assert.equal(event.sourceTagSha256, tagSha);
    assert.equal(item.updates.length, 1, 'P005 placement update count drift');
    return {instanceId, characterId, firstFrame: first, lastFrameExclusive: last,
      matrix, createdByEventId: item.createdByEventId, sourceTagSha256: tagSha};
  };
  const parent = placement('root', 'root/depth-135/generation-1', 395, 6, 11,
    [1, 0, 0, 1, 8068, -848], '18acf4be76fab54b4a1059805b1baa70919a12a51df40fb725fdc69b619622e8');
  const title = placement('sprite-395', 'sprite-395/depth-2/generation-1', 394, 1, 2,
    [1, 0, 0, 1, 0, 0], '2d3e357b10f0bde2a865ba8b7c5b7ca73442d1683fcc2e4b1dcd280a16f092fb');
  const textPlacement = placement('sprite-395', 'sprite-395/depth-1/generation-1', 393, 1, 2,
    [1, 0, 0, 1, -5661, -1912], '334b80df9f720bf2601c5e956b17cf83e2dad774495838fa193a83fd9b507211');
  const shape = catalog.shapeDefinitions.find(entry => entry.characterId === 394);
  assert.equal(shape?.sourceTagSha256, '64b21d8aaaf3819405b69db395a7fea5d89e4ff7fbb702dc518f088b0ad7b808');
  const text = catalog.textDefinitions.find(entry => entry.characterId === 393);
  assert.equal(text?.sourceTagSha256, '52f9d7b49856a93e5f5be4debf0bba882237e78637519a5a690805fb56d663cc');
  assert.deepEqual(text.runs.map(run => run.text), ['Graphing in the Coordinate Plane: Real World Activity']);
  return {title: {id: P005_TYPOGRAPHY_TITLE_INSTANCE, path: [parent, title],
    sourceShapeCharacterId: 394, sourceShapeTagSha256: shape.sourceTagSha256,
    publicFrames: [1, 968], sourceRole: 'outlined-title'},
  text393: {path: [parent, textPlacement], sourceTextCharacterId: 393,
    sourceTextTagSha256: text.sourceTagSha256, sourceDecodedText: text.runs[0].text,
    decodeStatus: text.runs[0].decodeStatus, suppressed: false, semanticSubstitutionAsserted: false},
  context: {frameDomain: 'sprite-391', rootFrame: 6, frameRange: [1, 968],
    scenario: 'source-static-frame', lang: 'en', seed: 0},
  sourceMasks: {characterIds: [1, 203], preserved: true}};
}

/** One synchronous draw scope; ordinary render and all original leaf graphics remain unchanged. */
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
      frame === 0 && ratio === 0 && active.frame >= 1 && active.frame <= 968 &&
      Array.isArray(matrix) && matrix.length === 6 && matrix.every((value, index) => value === rule.matrix[index]);
    const suppress = mapped && active.validRequest && active.requested.has(instanceId);
    if (!mapped) active.diagnostics.push({kind: 'exact-placement-scope-mismatch', instanceId});
    active.observations.push({instanceId, object: obj, frame: active.frame,
      suppressionRequested: active.requested.has(instanceId), suppressed: Boolean(suppress)});
    if (suppress) {active.suppressed.add(instanceId); return undefined;}
    return draw();
  }
  function render(canvas, request, resolveState, draw) {
    if (active) throw Error('P005 typography render is already active');
    request = request || {};
    if (request.frameDomain !== undefined && request.frameDomain !== 'sprite-391') throw Error('P005 unsupported frame domain');
    if (request.rootFrame !== undefined && request.rootFrame !== 6) throw Error('P005 unsupported root frame');
    if (request.seed !== undefined && request.seed !== 0) throw Error('P005 requires source seed 0');
    if (request.renderScale !== undefined && request.renderScale !== 1) throw Error('P005 typography supports native scale 1 only');
    const requested = request.text?.suppressInstanceIds ?? [];
    if (!Array.isArray(requested) || requested.some(id => typeof id !== 'string') || new Set(requested).size !== requested.length)
      throw Error('P005 typography requires unique suppression instance ids');
    const state = resolveState(request);
    const unknown = requested.filter(id => !Object.prototype.hasOwnProperty.call(configuration.instances, id));
    active = {frame: state.localFrame, scope: null, requested: new Set(requested), validRequest: !unknown.length,
      suppressed: new Set(), observations: [], diagnostics: unknown.map(instanceId => ({kind: 'unsupported-suppression-id', instanceId}))};
    try {
      const actualState = draw(canvas, request);
      return {state: actualState, diagnostics: active.diagnostics, observations: active.observations,
        suppressedInstanceIds: [...active.suppressed],
        unfulfilledSuppressionIds: requested.filter(id => !active.suppressed.has(id))};
    } finally {active = null;}
  }
  return {scope, place, render};
}

export function buildP005Typography({safeJavascript, sourceBytes}) {
  assert.equal(hash(safeJavascript), P005_TYPOGRAPHY_CANDIDATE_SHA, 'P005 candidate hash drift');
  assert.equal(Buffer.byteLength(safeJavascript), 19449678, 'P005 candidate size drift');
  assert(!safeJavascript.includes(PREFIX), 'P005 typography already instrumented');
  const evidence = sourceEvidence(sourceBytes);
  const ast = parse(safeJavascript, {ecmaVersion: 2022, sourceType: 'script'});
  const edits = [], titleSites = [], titleParents = [], registryNodes = [];
  const replace = (node, text) => edits.push({start: node.start, end: node.end, text});
  const insert = (position, text) => edits.push({start: position, end: position, text});
  let iife, registration;
  walk(ast, (node, scope) => {
    if (node.type === 'FunctionExpression' && node.params.length === 1 && node.params[0].name === 'global') iife = node;
    if (node.type === 'Literal' && node.value === 'HELP_MATH_CANVAS_ASSETS') registryNodes.push(node);
    if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' &&
        node.left.object.name === 'registry' && node.right.callee?.object?.name === 'Object') registration = node.right.arguments[0];
    if (node.type !== 'CallExpression' || node.callee.name !== 'place') return;
    const object = node.arguments[0]?.value;
    if (scope.function === 'render' && object === 'sprite395') titleParents.push(node);
    if (scope.function === 'sprite395' && object === 'shape394') titleSites.push({node, frame: scope.exportFrame});
  });
  assert(iife && registration && registryNodes.length === 2, 'P005 unsupported candidate envelope');
  assert.deepEqual(titleSites.map(site => site.frame), [0]);
  assert.equal(titleParents.length, 1);
  assert.equal(titleParents[0].arguments.length, 9);
  assert.deepEqual(literal(titleParents[0].arguments[3]), [0.05, 0, 0, 0.05, 403.4, -42.4]);
  assert.equal(literal(titleParents[0].arguments[5]), 1);
  assert.equal(literal(titleParents[0].arguments[6]), 0);
  assert.equal(literal(titleParents[0].arguments[7]), 5);
  const titleSite = titleSites[0].node;
  assert.equal(titleSite.arguments.length, 9);
  assert.deepEqual(literal(titleSite.arguments[3]), [1, 0, 0, 1, 0, 0]);
  assert.equal(literal(titleSite.arguments[5]), 1);
  assert.equal(literal(titleSite.arguments[6]), 0);
  assert.equal(literal(titleSite.arguments[7]), 0);
  replace(titleSite.callee, `${PREFIX}Place`);
  insert(titleSite.arguments[0].start, `${JSON.stringify(evidence.title.id)},`);
  const parent = titleParents[0];
  replace(parent, `${PREFIX}Runtime.scope('title',function(){return ${safeJavascript.slice(parent.start, parent.end)};})`);
  const configuration = {instances: {[evidence.title.id]: {scope: 'title', object: 'shape394', matrix: [1, 0, 0, 1, 0, 0]}}};
  const directive = iife.body.body[0];
  assert.equal(directive.directive, 'use strict');
  insert(directive.end, `\n/* Generated P005 exact-title typography variant; source graphics remain unchanged. */\n` +
    `var ${PREFIX}Runtime=(${runtime.toString()})(${JSON.stringify(configuration)});\n` +
    `function ${PREFIX}Place(id,obj,targetCanvas,ctx,matrix,ctrans,blendMode,frame,ratio,time){\n` +
    `return ${PREFIX}Runtime.place(id,obj,targetCanvas,ctx,matrix,ctrans,blendMode,frame,ratio,time,function(){return place(obj,targetCanvas,ctx,matrix,ctrans,blendMode,frame,ratio,time);});\n}\n` +
    `function ${PREFIX}Render(targetCanvas,request){return ${PREFIX}Runtime.render(targetCanvas,request,resolveFrameState,sourceFrameRender);}\n`);
  registryNodes.forEach(node => replace(node, JSON.stringify(P005_TYPOGRAPHY_REGISTRY)));
  const metadata = registration.properties.find(property => property.key.name === 'metadata');
  assert(metadata?.value.name === 'METADATA');
  replace(metadata.value, `deepFreeze(Object.assign({},METADATA,{nativeOnlyResolution:{width:800,height:600,supportedScales:[1]},textSuppression:${JSON.stringify(evidence)}}))`);
  insert(registration.end - 1, `,renderWithText:${PREFIX}Render`);
  let cursor = 0, code = '';
  edits.sort((left, right) => left.start - right.start || left.end - right.end);
  for (const edit of edits) {
    assert(edit.start >= cursor, 'overlapping P005 typography edits');
    code += safeJavascript.slice(cursor, edit.start) + edit.text; cursor = edit.end;
  }
  code += safeJavascript.slice(cursor);
  parse(code, {ecmaVersion: 2022, sourceType: 'script'});
  return {code, manifest: {schemaVersion: 1, kind: 'p005-exact-title-typography-v1',
    animationId: P005_TYPOGRAPHY_ID, sourceSwfSha256: P005_TYPOGRAPHY_SOURCE_SHA,
    sourceSwfBytes: sourceBytes.length, globalRegistry: P005_TYPOGRAPHY_REGISTRY,
    originalRuntimeSha256: P005_TYPOGRAPHY_CANDIDATE_SHA, originalRuntimeBytes: 19449678,
    originalCandidate: 'candidate-v2', runtimeSha256: hash(code), runtimeBytes: Buffer.byteLength(code),
    nativeOnlyResolution: {width: 800, height: 600, supportedScales: [1]},
    evidence, instrumentedSites: {title: titleSites.length},
    drawing: {ordinaryRenderPreservesSourceWrapper: true, textRenderUsesHostOwnedDetachedSurface: true,
      sourceMaskAllocationsPreserved: true, nonTitleFunctionsModified: false},
    claimBoundary: {registered: false, nativeTextBindingValidated: false, originalRuntimeEvidence: false,
      typographyAccepted: false, audioAccepted: false, humanReview: false, ownerAccepted: false, strictComplete: false}}};
}

async function physicalInput(filename) {
  const before = await lstat(filename, {bigint: true});
  // lstat first also rejects a dangling symlink rather than treating it as a
  // missing output and discovering it after earlier members were published.
  assert(!before.isSymbolicLink(), 'P005 requires a physical path without symlinks');
  assert(before.isFile(), 'P005 requires a regular physical file');
  assert.equal(await realpath(filename), filename, 'P005 requires a physical path without symlinks');
  const bytes = await readFile(filename);
  const after = await lstat(filename, {bigint: true});
  const stamp = stat => [stat.dev, stat.ino, stat.size, stat.mtimeNs, stat.ctimeNs].map(String);
  assert.deepEqual(stamp(after), stamp(before), 'P005 physical input changed during read');
  assert.equal(BigInt(bytes.length), after.size, 'P005 physical input size drift');
  return {filename, bytes, sha256: hash(bytes), stamp: stamp(after)};
}

export async function buildP005TypographyFiles({root = ROOT, source = SOURCE, check = true} = {}) {
  root = path.resolve(root); source = path.resolve(source);
  assert.equal(await realpath(root), root, 'P005 output root must be physical');
  const inputs = await Promise.all([physicalInput(source),
    physicalInput(path.join(root, WORK, 'candidate-v2/canvas-renderer.js')),
    physicalInput(fileURLToPath(import.meta.url)), physicalInput(path.join(ROOT, 'scripts/lib/swf-text-source-catalog.mjs'))]);
  const result = buildP005Typography({sourceBytes: inputs[0].bytes, safeJavascript: inputs[1].bytes.toString('utf8')});
  const manifest = {...result.manifest, generator: {version: '1.0.0',
    sha256: inputs[2].sha256, sourceParserSha256: inputs[3].sha256}};
  const meta = Object.fromEntries(['animationId', 'sourceSwfSha256', 'runtimeSha256', 'runtimeBytes'].map(key => [key, manifest[key]]));
  const outputs = [['canvas-renderer.js', result.code], ['runtime-meta.json', json(meta)], ['source-evidence.json', json(manifest)]];
  const outputRoot = path.join(root, OUT);
  assert.equal(await realpath(path.join(root, WORK)), path.join(root, WORK), 'P005 workspace must be physical');
  let outputExists = true;
  try {assert.equal(await realpath(outputRoot), outputRoot, 'P005 output directory must be physical');}
  catch (error) {if (error.code !== 'ENOENT') throw error; outputExists = false;}
  // Check every existing output before a first write. Never overwrite a drifted member.
  for (const [name, content] of outputs) {
    const destination = path.join(outputRoot, name);
    try {
      const existing = await physicalInput(destination);
      assert.equal(existing.bytes.toString('utf8'), content,
        check ? `P005 typography output drift: ${name}` : `refusing to overwrite changed P005 typography output: ${name}`);
    } catch (error) {if (error.code !== 'ENOENT' || check) throw error;}
  }
  for (const prior of inputs) {
    const current = await physicalInput(prior.filename);
    assert.equal(current.sha256, prior.sha256, 'P005 input changed before publication');
    assert.deepEqual(current.stamp, prior.stamp, 'P005 input changed before publication');
  }
  if (!check) {
    if (!outputExists) await mkdir(outputRoot);
    assert.equal(await realpath(outputRoot), outputRoot, 'P005 output directory must be physical');
    for (const [name, content] of outputs) {
      const destination = path.join(outputRoot, name);
      try {await writeFile(destination, content, {flag: 'wx'});}
      catch (error) {
        if (error.code !== 'EEXIST') throw error;
        assert.equal((await physicalInput(destination)).bytes.toString('utf8'), content,
          `refusing to overwrite changed P005 typography output: ${name}`);
      }
    }
  }
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  assert(args.length === 1 && ['--check', '--write'].includes(args[0]),
    'Usage: build-g678-alg-l12-p005-typography.mjs (--check | --write)');
  buildP005TypographyFiles({check: args[0] === '--check'})
    .then(manifest => console.log(json({animationId: manifest.animationId, runtimeSha256: manifest.runtimeSha256,
      runtimeBytes: manifest.runtimeBytes, instrumentedSites: manifest.instrumentedSites})))
    .catch(error => {console.error(error); process.exitCode = 1;});
}
