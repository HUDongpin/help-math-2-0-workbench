#!/usr/bin/env node
/** Exact source-placement suppression for the two ALG L12 glossary pages.
 * The source-only Canvas candidates remain immutable. This derivative only
 * wraps reviewed placement calls; native layout and lesson clocks live in the
 * product binding, not in the generated drawing runtime. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'acorn';
import {Script, createContext} from 'node:vm';
import {PAIR_OUTPUT, PAIR_PAGES, PAIR_SOURCE_ROOT, physicalPairInput} from './build-g678-alg-l12-glossary-pair-inputs.mjs';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = fileURLToPath(import.meta.url);
const PREFIX = '__pairNativeText';
const REGISTRY = 'HELP_MATH_GLOSSARY_PAIR_NATIVE_ASSETS';
const SOURCE_CANDIDATES = Object.freeze({
  p013: '560b7fc82bacc85dfc5f853bd15deebb9bb028611fcd6dd989e896f89e630221',
  p015: '2fa76e779d143e9e64039e82582eae0c75856579cb24ef3767d91b1e8976146c',
});
const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;

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
  if (node?.type === 'Literal') return node.value;
  if (node?.type === 'UnaryExpression' && node.operator === '-') return -literal(node.argument);
  if (node?.type === 'ArrayExpression') return node.elements.map(literal);
  throw Error('native Canvas placement requires literal source geometry');
}

function matrixAt(rule, frame) {
  let result;
  for (const event of rule.sourcePlacementEvents) if (event.frame <= frame && event.matrix) result = event.matrix;
  assert(result, `missing source matrix for ${rule.id} at frame ${frame}`);
  return result.map(value => value / 20);
}

/** One synchronous, exact-set draw transaction. It never advances a lesson or
 * draws text itself; the native text binding must supply the active IDs. */
function nativeTextTransaction(rules, context) {
  let active = null;
  function place(id, frame, draw) {
    if (!active) return draw();
    if (frame !== null && active.frame !== frame) throw Error('native Canvas source frame differs');
    if (!active.requested.has(id)) throw Error('native Canvas exact suppression request missing');
    if (active.seen.has(id)) throw Error('native Canvas duplicate source placement');
    active.seen.add(id);
    return undefined;
  }
  function render(canvas, request, draw) {
    if (active) throw Error('native Canvas render is already active');
    if (!request || !Number.isInteger(request.frame) || request.frame < 1 ||
      request.frame > context.frames || request.frameDomain !== context.frameDomain ||
      request.rootFrame !== 6 || request.scenario !== 'source-static-frame' ||
      request.lang !== 'en' || request.seed !== 0)
      throw Error('unsupported native Canvas source context');
    const requested = request.text?.suppressInstanceIds;
    const expected = rules.filter(rule => request.frame >= rule.firstFrame &&
      request.frame < rule.lastFrameExclusive).map(rule => rule.id);
    if (!Array.isArray(requested) || requested.length !== expected.length ||
      new Set(requested).size !== requested.length || requested.some(id => !expected.includes(id)))
      throw Error('native Canvas suppression must match this source frame exactly');
    active = {frame: request.frame, requested: new Set(requested), seen: new Set()};
    try {
      const state = draw(canvas, {frame: request.frame, frameDomain: request.frameDomain,
        rootFrame: request.rootFrame, scenario: request.scenario, lang: request.lang, seed: request.seed});
      if (expected.some(id => !active.seen.has(id)))
        throw Error('native Canvas source placement was not observed');
      return {state, suppressedInstanceIds: [...active.seen], unfulfilledSuppressionIds: [], diagnostics: []};
    } finally { active = null; }
  }
  return {place, render};
}

function validateRule(rule, page) {
  assert.equal(typeof rule.id, 'string');
  assert.match(rule.id, /^sprite-\d+\/depth-\d+\/generation-\d+$/);
  assert.equal(typeof rule.nativeReplacementId, 'string');
  assert.equal(rule.nativeReplacementId, rule.id, `missing exact native replacement for ${rule.id}`);
  assert(Array.isArray(rule.sourceTextIds) && rule.sourceTextIds.length > 0);
  const characterId = Number(rule.object.replace(/^text/, ''));
  assert(Number.isInteger(characterId) && characterId > 0);
  rule.sourceTextIds.forEach((id, index) => assert.equal(id, `character-${characterId}/run-${index}`));
  assert(Number.isInteger(rule.firstFrame) && rule.firstFrame >= 1);
  assert(Number.isInteger(rule.lastFrameExclusive) && rule.lastFrameExclusive <= page.frames + 1 &&
    rule.lastFrameExclusive > rule.firstFrame);
  assert(Array.isArray(rule.sourcePlacementEvents) && rule.sourcePlacementEvents.length > 0);
  for (const event of rule.sourcePlacementEvents) {
    assert(Number.isInteger(event.frame) && event.frame >= 1);
    if (event.matrix) assert(Array.isArray(event.matrix) && event.matrix.length === 6 &&
      event.matrix.every(Number.isFinite));
  }
  assert(rule.sourcePlacementEvents.some(event => event.frame === rule.firstFrame && event.matrix),
    `initial source matrix missing for ${rule.id}`);
  assert.deepEqual(rule.sourceMatrix,
    rule.sourcePlacementEvents.find(event => event.frame === rule.firstFrame).matrix);
  assert.deepEqual(rule.canvasCallMatrix,rule.sourceMatrix.map(value=>value/20));
  assert(Number.isInteger(rule.callOrdinalWithinFrameObject) &&
    rule.callOrdinalWithinFrameObject >= 0);
  assert.match(rule.maskInstanceId,/^sprite-\d+\/depth-\d+\/generation-\d+$/);
}

function validateManifest(manifest, page, sourceBytes) {
  assert.equal(manifest.schemaVersion,1);
  assert.equal(manifest.kind,'alg-l12-glossary-pair-native-text-suppression-v1');
  assert.equal(manifest.sourceSwfSha256, page.sha256);
  assert.equal(manifest.sourceCanvasSha256, SOURCE_CANDIDATES[page.short]);
  assert.equal(manifest.animationId, page.id);
  assert.equal(manifest.frameDomain, `sprite-${page.sprite}`);
  assert.equal(manifest.rootFrame, 6);
  assert.equal(manifest.frameCount, page.frames);
  assert(Array.isArray(manifest.rules) && manifest.rules.length > 0,
    'reviewed native suppression rules required');
  for (const rule of manifest.rules) validateRule(rule, page);
  assert.equal(new Set(manifest.rules.map(rule => rule.id)).size, manifest.rules.length);
  assert(Array.isArray(manifest.rootCompanionShapeSuppression) &&
    manifest.rootCompanionShapeSuppression.length===1,
    'exact one source title shape must have a native replacement');
  assert.deepEqual(manifest.claimBoundary,{proseAndTitleOnly:true,
    diagramLabelsRetainedInCanvas:true,titleOutlineReplacedByNativeText:true});
  const catalog=collectSwfTextSourceCatalog(sourceBytes);
  assert.equal(catalog.sourceSha256,page.sha256);
  assert.equal(catalog.unparsedTags.length,0);
  const timeline=catalog.timelines.find(item=>item.timelineId===manifest.frameDomain);
  assert.equal(timeline.declaredFrameCount,page.frames);
  const root=catalog.timelines.find(item=>item.timelineId==='root');
  const title=manifest.rootCompanionShapeSuppression[0];
  const companion=page.short==='p013'?64:77;
  const sourceTitle=root.instances.find(item=>item.instanceId===title.id);
  assert(sourceTitle && sourceTitle.characterId===companion);
  assert.equal(title.object,`shape${companion}`);
  assert.equal(title.sourceShapeId,companion);
  assert.equal(title.placementScope,'render-root-companion');
  assert.equal(title.nativeReplacementId,'title');
  assert.equal(title.firstFrame,1);
  assert.equal(title.lastFrameExclusive,page.frames+1);
  assert.equal(sourceTitle.firstFrame,6);
  assert.equal(sourceTitle.lastFrameExclusive,11);
  assert.equal(title.sourceRootFrame,6);
  assert.deepEqual(title.sourceMatrix,[1,0,0,1,0,0]);
  assert.deepEqual(title.canvasCallMatrix,[0.05,0,0,0.05,0,0]);
  assert.equal(title.callOrdinalWithinFrameObject,0);
  assert.equal(title.sourcePathDataSha256,
    'a423140f7c29dfd35850885bb62d367f8176a95a3ddfe12f400df7c63ae4480b');
  assert.deepEqual(title.sourcePlacementEvents,
    sourceTitle.updates.map(id=>root.events.find(event=>event.eventId===id)).map(event=>({
      eventId:event.eventId,frame:event.frame,sourceTagOffset:event.sourceTagOffset,
      sourceTagSha256:event.sourceTagSha256,matrix:event.matrix,
    })));
  const definitions=new Map(catalog.textDefinitions.map(item=>[item.characterId,item]));
  const textInstances=timeline.instances.filter(item=>definitions.has(item.characterId));
  for (const rule of manifest.rules) {
    const instance=timeline.instances.find(item=>item.instanceId===rule.id);
    assert(instance,`suppressed source instance missing: ${rule.id}`);
    assert.equal(rule.object,`text${instance.characterId}`);
    assert.equal(rule.firstFrame,instance.firstFrame);
    assert.equal(rule.lastFrameExclusive,instance.lastFrameExclusive);
    assert.equal(rule.sourceTextIds.length,definitions.get(instance.characterId).runs.length);
    assert.deepEqual(rule.sourcePlacementEvents,
      instance.updates.map(id=>timeline.events.find(event=>event.eventId===id)).map(event=>({
        eventId:event.eventId,frame:event.frame,sourceTagOffset:event.sourceTagOffset,
        sourceTagSha256:event.sourceTagSha256,matrix:event.matrix??null,
        colorTransform:event.colorTransform??null,visible:event.visible??null,
      })));
    const mask=timeline.instances.find(item=>item.instanceId===rule.maskInstanceId);
    assert(mask && mask.firstFrame<=rule.firstFrame && mask.lastFrameExclusive>=rule.lastFrameExclusive,
      `suppression mask is not active: ${rule.id}`);
  }
  const retained=textInstances.filter(item=>!manifest.rules.some(rule=>rule.id===item.instanceId))
    .map(item=>item.instanceId).sort();
  assert.deepEqual([...manifest.retainedTextInstanceIds].sort(),retained,
    'untargeted graph/source text must remain in Canvas');
  return [...manifest.rules,title];
}

export function buildNativeGlossaryPairCanvas(page, candidate, manifest, sourceBytes) {
  assert.equal(hash(candidate), SOURCE_CANDIDATES[page.short], 'source Canvas candidate changed');
  assert(!candidate.includes(PREFIX));
  const rules = validateManifest(manifest, page, sourceBytes);
  const ast = parse(candidate, {ecmaVersion: 2022, sourceType: 'script'});
  const edits = [], observations = Array.from({length: page.frames}, () => []);
  const matchesByCall = new Map();
  let iife, registration, registryCount = 0, titleCount=0;
  walk(ast, (node, scope) => {
    if (node.type === 'FunctionExpression' && node.params.length === 1 && node.params[0].name === 'global') iife = node;
    if (node.type === 'Literal' && node.value === 'HELP_MATH_CANVAS_ASSETS') {
      registryCount++;
      edits.push({start:node.start,end:node.end,text:JSON.stringify(REGISTRY)});
    }
    if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' &&
      node.left.object.name === 'registry' && node.right.callee?.object?.name === 'Object')
      registration = node.right.arguments[0];
    if (node.type !== 'CallExpression' || node.callee.name !== 'place' ||
      node.arguments[0]?.type !== 'Literal') return;
    const object = node.arguments[0].value;
    if (!rules.some(rule => rule.object === object)) return;
    assert.equal(node.arguments.length, 9);
    const title=rules.find(rule=>rule.placementScope==='render-root-companion'&&rule.object===object);
    if(title && scope.function==='main')return; // Frozen reference root, not this adapter's entry.
    if(title && scope.function==='render'){
      assert.deepEqual(literal(node.arguments[3]),title.canvasCallMatrix);
      titleCount++;
      edits.push({start:node.start,end:node.end,
        text:`${PREFIX}.place(${JSON.stringify(title.id)},null,()=>${candidate.slice(node.start,node.end)})`});
      return;
    }
    assert.equal(scope.function, `sprite${page.sprite}`, 'native text must be in page-local sprite');
    assert(Number.isInteger(scope.frame) && scope.frame >= 0 && scope.frame < page.frames);
    const frame = scope.frame + 1, matrix = literal(node.arguments[3]);
    const key = `${frame}:${object}`;
    const occurrence = matchesByCall.get(key) ?? 0;
    matchesByCall.set(key, occurrence + 1);
    const matching = rules.filter(rule => rule.placementScope!=='render-root-companion'&&rule.object === object &&
      frame >= rule.firstFrame && frame < rule.lastFrameExclusive &&
      rule.callOrdinalWithinFrameObject === occurrence &&
      matrixAt(rule, frame).every((value, index) => Math.abs(value - matrix[index]) < 1e-12));
    if (matching.length === 0) return; // An unsuppressed copy stays in Canvas.
    assert.equal(matching.length, 1, `ambiguous source placement ${object} at ${frame}`);
    const rule = matching[0];
    assert.deepEqual(matrix,rule.canvasCallMatrix);
    observations[frame-1].push(rule.id);
    edits.push({start: node.start, end: node.end,
      text: `${PREFIX}.place(${JSON.stringify(rule.id)},${frame},()=>${candidate.slice(node.start,node.end)})`});
  });
  assert(iife && registration && registryCount === 2 && titleCount===1,
    'source Canvas title or registration envelope changed');
  for (let frame = 1; frame <= page.frames; frame++) {
    const expected = rules.filter(rule => rule.placementScope!=='render-root-companion'&&
      frame >= rule.firstFrame && frame < rule.lastFrameExclusive)
      .map(rule => rule.id).sort();
    assert.deepEqual(observations[frame-1].sort(), expected,
      `${page.short} frame ${frame} exact source text placement closure`);
  }
  const directive = iife.body.body[0];
  assert.equal(directive.directive, 'use strict');
  const runtimeRules = rules.map(({id, firstFrame, lastFrameExclusive}) => ({id,firstFrame,lastFrameExclusive}));
  edits.push({start: directive.end, end: directive.end,
    text: `\nvar ${PREFIX}=(${nativeTextTransaction.toString()})(${JSON.stringify(runtimeRules)},${JSON.stringify({frames:page.frames,frameDomain:`sprite-${page.sprite}`})});\n`});
  edits.push({start: registration.start + 1, end: registration.start + 1,
    text: `renderWithText:(canvas,request)=>${PREFIX}.render(canvas,request,render),\n`});
  const sourceMetadataFlag='"nativeTextSuppressionApplied": false';
  assert.equal(candidate.split(sourceMetadataFlag).length,2);
  const flagStart=candidate.indexOf(sourceMetadataFlag);
  edits.push({start:flagStart,end:flagStart+sourceMetadataFlag.length,
    text:'"nativeTextSuppressionApplied": true'});
  let runtime = candidate, end = Infinity;
  for (const edit of edits.sort((a,b) => b.start - a.start)) {
    assert(edit.end <= end, 'overlapping native Canvas edits');
    runtime = runtime.slice(0,edit.start) + edit.text + runtime.slice(edit.end);
    end = edit.start;
  }
  new Script(runtime);
  const sandbox = createContext({});
  new Script(runtime).runInContext(sandbox,{timeout:5000});
  const asset = sandbox[REGISTRY]?.[page.id];
  assert(asset?.renderWithText && asset.render && asset.metadata.sourceSwfSha256 === page.sha256);
  return {runtime,rules:runtimeRules,
    placedTextCalls:observations.reduce((n,rows)=>n+rows.length,0)+titleCount};
}

export function buildNativeGlossaryPairCanvasCandidates() {
  const output = new Map(), pages = [];
  const generator = physicalPairInput(SCRIPT).pin;
  for (const page of PAIR_PAGES) {
    const sourceBase = `${PAIR_OUTPUT}/candidates/${page.short}`;
    const nativeBase = `${PAIR_OUTPUT}/native-candidates/${page.short}`;
    const source = physicalPairInput(path.join(ROOT,sourceBase,'canvas-renderer.js'),
      {sha256:SOURCE_CANDIDATES[page.short]});
    const manifestInput = physicalPairInput(path.join(ROOT,PAIR_OUTPUT,'native-text',
      `${page.short}-suppression-manifest.json`));
    const manifest = JSON.parse(manifestInput.bytes.toString('utf8'));
    const swf=physicalPairInput(path.join(PAIR_SOURCE_ROOT,'G6-G8-shared/ALG001/L12/VB',
      `${page.stem}.swf`),page);
    const generated = buildNativeGlossaryPairCanvas(page,source.bytes.toString('utf8'),manifest,swf.bytes);
    const metadata = {schemaVersion:1,kind:'g678-alg-l12-glossary-pair-native-canvas-v1',
      animationId:page.id,sourceSwfSha256:page.sha256,sourceSwf:swf.pin,sourceCanvas:source.pin,
      suppressionManifest:manifestInput.pin,generator,
      frameDomain:`sprite-${page.sprite}`,rootFrame:6,frameCount:page.frames,
      runtimeSha256:hash(generated.runtime),runtimeBytes:Buffer.byteLength(generated.runtime),
      exactSuppressionInstances:generated.rules,placedTextCalls:generated.placedTextCalls,
      requiredCanvas:{width:1600,height:1200},renderScale:2,registry:REGISTRY,
      nativeTextSuppressionApplied:true,nativeTextReplacementRequired:true,
      retainedUntargetedSourceText:true,registered:false,audioPlaybackEnabled:false,
      originalRuntimeAccepted:false,fidelityAccepted:false,audioAccepted:false,
      humanAccepted:false,ownerAccepted:false,strictComplete:false,published:false,
      acceptanceEffect:'none'};
    const artifact = `${nativeBase}/canvas-renderer.js`;
    const meta = `${nativeBase}/runtime-meta.json`;
    output.set(artifact,generated.runtime); output.set(meta,json(metadata));
    pages.push({animationId:page.id,runtimeSha256:metadata.runtimeSha256,
      runtimeBytes:metadata.runtimeBytes,suppressionInstances:generated.rules.length,
      placedTextCalls:generated.placedTextCalls});
  }
  return {output,pages};
}

export function main(argv=process.argv.slice(2)) {
  assert(argv.length===1 && ['--dry-run','--write','--check'].includes(argv[0]),
    'use --dry-run, --write, or --check');
  const result=buildNativeGlossaryPairCanvasCandidates();
  if (argv[0]==='--write') {
    for (const relative of result.output.keys()) assert(!fs.existsSync(path.join(ROOT,relative)),
      `immutable native candidate already exists: ${relative}`);
    for (const [relative,data] of result.output) {
      const target=path.join(ROOT,relative);fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.writeFileSync(target,data,{flag:'wx'});
    }
  }
  if (argv[0]!=='--dry-run') for (const [relative,data] of result.output)
    assert.deepEqual(physicalPairInput(path.join(ROOT,relative)).bytes,Buffer.from(data),
      `native Canvas artifact drift: ${relative}`);
  const report={status:argv[0]==='--write'?'NATIVE_CANVAS_PAIR_WRITTEN_UNREGISTERED':
    argv[0]==='--check'?'NATIVE_CANVAS_PAIR_VERIFIED_UNREGISTERED':'NATIVE_CANVAS_PAIR_DRY_RUN',
    pages:result.pages,registered:false,acceptanceEffect:'none'};
  process.stdout.write(json(report));return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===SCRIPT){
  try{main();}catch(error){process.stderr.write(`${error.stack??error}\n`);process.exitCode=1;}
}
