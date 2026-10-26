import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareP012TextData} from './build-g678-alg-l12-p012-text-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'migrations/shared-alg001-l12-p012/graphics-source-v1/source-drawings.js';
const COMPOSITION = 'migrations/shared-alg001-l12-p012/graphics-source-v1/composition.json';
const OUTPUT = 'migrations/shared-alg001-l12-p012/typography-v1';
const BASE_SHA = 'ae25f758635bd24bc2c8c4ae877a57da2be5671d04c02d102491bf56a6d346e9';
const COMPOSITION_SHA = '1b218f41b22a3d5f16c29267e454857a2692e5e7d6e7d4694c4fad87014fa8c6';
const SOURCE_SHA = 'b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa';
const TEXT_SHA = '2298d94d293f34888064cf683ccd002c9a2a81ae80467c3b66914c20e51264fa';
const hash = value => createHash('sha256').update(value).digest('hex');
const relative = name => path.join(ROOT, name);

function replaceOnce(source, before, after) {
  const start = source.indexOf(before);
  assert(start >= 0 && source.indexOf(before, start + 1) < 0, `missing/duplicated source anchor: ${before.slice(0, 55)}`);
  return source.slice(0, start) + after + source.slice(start + before.length);
}

function sourceSpecs(data, composition) {
  assert.equal(data.animationId, 'shared-alg001-l12-p012');
  assert.equal(data.source.swfSha256, SOURCE_SHA);
  assert.equal(composition.source.sha256, SOURCE_SHA);
  assert.equal(composition.rootLayerOrder[0].characterId, 1);
  assert.equal(composition.rootLayerOrder[0].role, 'outlined-English-title');
  const parents = {
    'sprite-86': 'sprite86', 'sprite-61': 'sprite86/sprite61',
    'sprite-74': 'sprite86/sprite74', 'sprite-76': 'sprite86/sprite76',
  };
  const specs = data.instances.map(item => {
    const callPath = parents[item.timelineId];
    assert(callPath, `unexpected text timeline ${item.timelineId}`);
    return {instanceId: item.instanceId, sourceFunction: `text${item.characterId}`,
      callPath, characterId: item.characterId, kind: item.characterId === 34 ? 'dynamic-text' : 'static-text',
      firstFrame: item.firstFrame, lastFrameExclusive: item.lastFrameExclusive,
      matrices: [...new Map(item.poseSegments.map(segment => [JSON.stringify(segment.pose.matrix), segment.pose.matrix])).values()]};
  });
  const button = data.buttonStateTextInstances;
  assert.equal(button.length, 1);
  assert.equal(button[0].instanceId, 'button-71/record-4');
  specs.push({instanceId: button[0].instanceId, sourceFunction: 'text66',
    callPath: 'sprite86/sprite74/button71', characterId: 66,
    kind: 'button-state-text', firstFrame: null, lastFrameExclusive: null,
    matrices: [button[0].matrix]});
  specs.push({instanceId: 'root/depth-1/generation-1', sourceFunction: 'shape1',
    callPath: '', characterId: 1, kind: 'outlined-English-title', firstFrame: 6,
    lastFrameExclusive: 11, matrices: [[0.05,0,0,0.05,0,0]]});
  specs.push({instanceId: 'sprite-86/depth-2/generation-1', sourceFunction: 'shape50',
    callPath: 'sprite86', characterId: 50, kind: 'instruction-underline',
    firstFrame: 32, lastFrameExclusive: 120, matrices: [[1,0,0,1,-275,-3438]]});
  assert.equal(specs.length, 60);
  const ids = specs.map(spec => spec.instanceId);
  assert.equal(new Set(ids).size, ids.length);
  for (const spec of specs) {
    assert(spec.matrices.length > 0);
    assert(spec.matrices.every(matrix => matrix.length === 6 && matrix.every(Number.isFinite)));
  }
  // These shapes are not teaching text: both source clip masks, glossary
  // hit-only rectangle, spider/dot/axes, arrow decoration and bitmap remain.
  assert(specs.every(spec => ![49,52,54,56,47,48].includes(spec.characterId)));
  return specs;
}

function patchBundle(base, specs) {
  let result = base;
  result = replaceOnce(result, 'var activeInteractive=null;', 'var activeInteractive=null;\nvar activeTypography=null;');
  result = replaceOnce(result,
    'var preparedContexts=new WeakSet();',
    `var typographySpecs=Object.freeze(${JSON.stringify(specs)});\n` +
    `var interactivePlace=place;\n` +
    `place=function(obj,target,ctx,matrix,ctrans,blendMode,frame,ratio,time){\n` +
    `  var typography=activeTypography;\n` +
    `  if(!typography)return interactivePlace(obj,target,ctx,matrix,ctrans,blendMode,frame,ratio,time);\n` +
    `  var callPath=typography.stack.join('/');\n` +
    `  var matches=typographySpecs.filter(function(spec){return spec.sourceFunction===obj&&spec.callPath===callPath&&\n` +
    `    spec.matrices.some(function(expected){return sameMatrix(matrix,expected);});});\n` +
    `  if(matches.length>1)throw new Error('P012 ambiguous source text placement: '+obj);\n` +
    `  var spec=matches[0];\n` +
    `  if(spec&&typography.requested.has(spec.instanceId)){\n` +
    `    if(typography.consumed.has(spec.instanceId))throw new Error('P012 duplicate text suppression: '+spec.instanceId);\n` +
    `    typography.consumed.add(spec.instanceId);\n` +
    `    // The interactive adapter must still consume its nested text34 call.\n` +
    `    if(!(activeInteractive&&obj==='text34'&&callPath==='sprite86/sprite61'))return;\n` +
    `  }\n` +
    `  var nested=/^(sprite|button)\\d+$/.test(obj);\n` +
    `  if(nested)typography.stack.push(obj);\n` +
    `  try{return interactivePlace(obj,target,ctx,matrix,ctrans,blendMode,frame,ratio,time);}\n` +
    `  finally{if(nested)typography.stack.pop();}\n` +
    `};\n` +
    'var preparedContexts=new WeakSet();');
  result = replaceOnce(result,
    'if(!target || target.width!==800 || target.height!==600) throw new Error("P012 source canvas must be 800x600");',
    'if(!target || target.width!==1600 || target.height!==1200) throw new Error("P012 typography canvas must be 1600x1200");');
  result = replaceOnce(result,
    'ctx.setTransform(1,0,0,1,0,0);\n    ctx.fillStyle="#b8d8f7";ctx.fillRect(0,0,800,600);',
    'ctx.setTransform(2,0,0,2,0,0);\n    ctx.fillStyle="#b8d8f7";ctx.fillRect(0,0,800,600);');
  result = replaceOnce(result, '})(globalThis);',
    `var sourceTypographyBase=global.HELP_MATH_P012_SOURCE_DRAWINGS;\n` +
    `function withTypography(request,render){\n` +
    `  if(activeTypography)throw new Error('P012 reentrant typography render');\n` +
    `  if(!request||!Array.isArray(request.suppressInstanceIds))throw new Error('P012 suppression IDs required');\n` +
    `  var requested=new Set(request.suppressInstanceIds);\n` +
    `  if(requested.size!==request.suppressInstanceIds.length)throw new Error('P012 duplicate requested suppression ID');\n` +
    `  for(var id of requested)if(typeof id!=='string'||!typographySpecs.some(function(spec){return spec.instanceId===id;}))\n` +
    `    throw new Error('P012 unknown source suppression ID: '+id);\n` +
    `  var active={requested:requested,consumed:new Set(),stack:[]};activeTypography=active;\n` +
    `  try{var sourceResult=render();}\n` +
    `  finally{activeTypography=null;}\n` +
    `  return Object.freeze({source:sourceResult,renderScale:2,\n` +
    `    suppressedInstanceIds:Object.freeze(Array.from(active.consumed)),\n` +
    `    unfulfilledSuppressionIds:Object.freeze(Array.from(requested).filter(function(id){return !active.consumed.has(id);}))});\n` +
    `}\n` +
    `global.HELP_MATH_P012_TYPOGRAPHY=Object.freeze({\n` +
    `  ready:sourceTypographyBase.ready,\n` +
    `  renderIntro:function(target,request){return withTypography(request,function(){\n` +
    `    return sourceTypographyBase.renderRootFrame6(target,{mainFrame:request.mainFrame});});},\n` +
    `  renderInteractive:function(target,state,request){return withTypography(request,function(){\n` +
    `    return sourceTypographyBase.renderInteractive(target,state,{nativeCoordinate:true});});},\n` +
    `  metadata:Object.freeze({animationId:'shared-alg001-l12-p012',sourceSha256:'${SOURCE_SHA}',\n` +
    `    renderScale:2,stage:Object.freeze({width:800,height:600}),\n` +
    `    suppressionSpecCount:typographySpecs.length})\n` +
    `});\n` +
    '})(globalThis);');
  assert(result.length > base.length);
  return result;
}

export async function prepareP012Typography() {
  const baseBytes = await readFile(relative(BASE));
  const compositionBytes = await readFile(relative(COMPOSITION));
  const textBytes = await readFile(relative('packages/demos/src/generated/alg-l12-p012-text-data.ts'));
  assert.equal(hash(baseBytes), BASE_SHA, 'source graphics bundle drift');
  assert.equal(hash(compositionBytes), COMPOSITION_SHA, 'source composition drift');
  assert.equal(hash(textBytes), TEXT_SHA, 'native text data drift');
  const {data} = await prepareP012TextData();
  const specs = sourceSpecs(data, JSON.parse(compositionBytes));
  const renderer = patchBundle(baseBytes.toString(), specs);
  const runtimeMeta = {schemaVersion: 1, kind: 'p012-typography-runtime-v1',
    animationId: data.animationId, sourceSha256: SOURCE_SHA, renderScale: 2,
    runtimeBytes: Buffer.byteLength(renderer), runtimeSha256: hash(renderer),
    graphicsSource: {path: BASE, sha256: BASE_SHA},
    composition: {path: COMPOSITION, sha256: COMPOSITION_SHA},
    textData: {path: 'packages/demos/src/generated/alg-l12-p012-text-data.ts', sha256: TEXT_SHA},
    suppressedSourceInstanceIds: specs.map(spec => spec.instanceId),
    shapeClassification: {title: 'root/depth-1/generation-1',
      instructionUnderline: 'sprite-86/depth-2/generation-1',
      retainedUnclassifiedVectorsAndMasks: true},
    claimBoundary: {sourceDrawingAndNativeTextCandidate: true, visualFidelityAccepted: false,
      typographyAccepted: false, audioAccepted: false, humanAccepted: false, published: false}};
  const files = new Map([
    ['renderer.js', renderer],
    ['runtime-meta.json', JSON.stringify(runtimeMeta, null, 2) + '\n'],
    ['suppression-specs.json', JSON.stringify({schemaVersion: 1, sourceSha256: SOURCE_SHA,
      graphicsSourceSha256: BASE_SHA, specs}, null, 2) + '\n'],
  ]);
  return {files, runtimeMeta, specs};
}

async function main() {
  assert(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'use --write or --check');
  const {files, runtimeMeta, specs} = await prepareP012Typography();
  if (process.argv[2] === '--write') await mkdir(relative(OUTPUT), {recursive: true});
  for (const [name, value] of files) {
    const target = path.join(relative(OUTPUT), name);
    if (process.argv[2] === '--check') assert.equal((await readFile(target)).toString(), value, `typography ${name} drift`);
    else await writeFile(target, value, {flag: 'wx'});
  }
  console.log(JSON.stringify({state: process.argv[2] === '--check' ? 'P012_TYPOGRAPHY_VERIFIED' : 'P012_TYPOGRAPHY_CREATED',
    runtimeSha256: runtimeMeta.runtimeSha256, runtimeBytes: runtimeMeta.runtimeBytes,
    suppressionSpecCount: specs.length, renderScale: 2}));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch(error => {console.error(error); process.exitCode = 1;});
