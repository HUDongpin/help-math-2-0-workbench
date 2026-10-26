import assert from 'node:assert/strict';import {test} from 'node:test';import {readFile} from 'node:fs/promises';
import {normalizeSourceClipMasks} from './lib/g678-source-clip-masks-v2.mjs';
const base='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222';
const spec=JSON.parse(await readFile(base+'/alg-l10-p005-source-spec-v1.json'));const raw=await readFile(spec.inputs.find(p=>p.path.endsWith('/DefineSprite_128/frames.html')).path,'utf8'),xml=await readFile(base+'/alg-l10-p005-preparation-v1/source/source.xml','utf8');
test('source solid and morph mask fills become opaque while the source geometry and transparent zero-width strokes remain byte-identical',()=>{
 const result=normalizeSourceClipMasks(raw,spec.clipMasks,xml);
 let expected=raw;for(const mask of spec.clipMasks){const header=`function ${mask.functionKind}${mask.characterId}(ctx,ctrans,frame,ratio,time){`,a=expected.indexOf(header),b=expected.indexOf('\n}',a)+2,body=expected.slice(a,b),next=result.slice(result.indexOf(header),result.indexOf('\n}',result.indexOf(header))+2);
  assert.equal(next.replace('ctx.fillStyle="rgba(0,0,0,1)";',mask.rawFill),body);expected=expected.slice(0,a)+next+expected.slice(b);
 }assert.equal(result,expected);
});
test('visible reuse, different depth bindings and nontransparent strokes cannot be admitted as source clip repairs',()=>{
 const mask=spec.clipMasks.find(m=>m.functionKind==='morphshape');
 assert.throws(()=>normalizeSourceClipMasks(raw,[mask],xml+`<PlaceObject2 objectID="${mask.characterId}" depth="400"/>`),/every character placement/);
 assert.throws(()=>normalizeSourceClipMasks(raw,[{...mask,placements:[{depth:1,clipDepth:10}]}],xml),/exact source mask placement/);
 const bad={...mask,rawTransparentStroke:mask.rawTransparentStroke.replace('Math.round(0+ratio*(0)/65535))/255','Math.round(1+ratio*(0)/65535))/255')};
 assert.throws(()=>normalizeSourceClipMasks(raw,[bad],xml),/zero source stroke alpha/);
});
