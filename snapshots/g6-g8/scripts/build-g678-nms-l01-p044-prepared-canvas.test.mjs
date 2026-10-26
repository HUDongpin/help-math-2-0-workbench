import test from 'node:test';
import assert from 'node:assert/strict';
import {compile} from './g678-nms-l01-p044-build-source-canvas.mjs';
import {extractPreparedImages} from './build-g678-nms-l01-p044-prepared-canvas.mjs';
const original=await compile();
test('extracts exactly ten embedded bitmaps and one source root SVG',()=>{const next=extractPreparedImages(original.code);assert.equal(Object.keys(next.assets).length,11);assert.ok(next.assets.rootImage.startsWith('data:image/svg+xml;base64,'));assert.ok(!next.code.includes('createElement("img")'));assert.ok(next.code.includes('Exact p044 prepared image set required'));});
test('source display function bodies and instance control are not rewritten',()=>{const next=extractPreparedImages(original.code);for(const name of ['placeSource','sprite293','sprite139','resolveSourceObject']){const start=original.code.indexOf(`function ${name}(`),end=original.code.indexOf('\nfunction ',start+1);const body=original.code.slice(start,end);assert.ok(start>0);assert.ok(next.code.includes(body),name);}});
test('missing/renamed source image declaration or root image fails closed',()=>{
  assert.throws(()=>extractPreparedImages(original.code.replace('var imageObj145 =','var unexpectedImage =')));
  assert.throws(()=>extractPreparedImages(original.code.replace('const rootImage=document.createElement("img");','const unexpected=document.createElement("img");')));
});
