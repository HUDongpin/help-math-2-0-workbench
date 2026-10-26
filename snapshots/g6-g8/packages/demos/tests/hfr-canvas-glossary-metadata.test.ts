import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {withHfrCanvasGlossary} from '../src/hfr/source-canvas-glossary';
import {hfrCanvasGlossaryProjection} from '../../../apps/web/lib/hfr-canvas-glossary-projection';
import type {HfrPageMeta} from '../src/hfr/types';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const contract=JSON.parse(fs.readFileSync(path.join(root,'catalog/g678-nms-l07-canvas-glossary-v1.json'),'utf8'));
for(const page of contract.pages) {
  const key=page.meta.key;
  test(`${key}: current shared metadata extends the exact retained packet without mutating it`,()=>{
    const original=structuredClone(page.meta),meta=withHfrCanvasGlossary(original);
    assert.notEqual(meta,original);assert.deepEqual(original,page.meta);assert.deepEqual(meta.sourceGlossary,page.binding.sourceGlossary);
    const pin=contract.inputs.find((p:{path:string})=>p.path.startsWith('catalog/product-bridge-calibrations/')&&p.path.includes(key));
    const bytes=fs.readFileSync(path.join(root,pin.path));assert.equal(bytes.length,pin.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),pin.sha256);
    const packet=JSON.parse(bytes.toString()),before=JSON.stringify(packet),projection=hfrCanvasGlossaryProjection(packet);
    assert.deepEqual(projection,{sourceGlossary:page.binding.sourceGlossary,descriptorEntries:page.descriptorEntries});
    assert.equal(JSON.stringify(packet),before);assert.equal(packet.glossary,undefined);
    assert.deepEqual(withHfrCanvasGlossary(meta),meta);
  });
  test(`${key}: source/progress/stage/conflicting term and own-data drift stay rejected`,()=>{
    for(const alter of [
      (m:any)=>m.sourceSha256='0'.repeat(64),(m:any)=>m.lessonKey='shared-nms002-l08',
      (m:any)=>m.compiler='other',(m:any)=>m.progressTimeline++,
      (m:any)=>m.progressFrameCount--,(m:any)=>m.stage.fps=24,
      (m:any)=>m.completionMode='activity',(m:any)=>m.sourceGlossary={...page.binding.sourceGlossary,terms:[]},
    ]) {const meta=structuredClone(page.meta);alter(meta);assert.throws(()=>withHfrCanvasGlossary(meta),/HFR_CANVAS_GLOSSARY/);}
    const packet={source:{sha256:page.binding.sourceSwfSha256},entry:{key,artifacts:{data:{sha256:'0'.repeat(64)}}},meta:page.meta};
    assert.throws(()=>hfrCanvasGlossaryProjection(packet),/exact data/);
    packet.entry.artifacts.data.sha256=page.binding.dataSha256;packet.source.sha256='0'.repeat(64);
    assert.throws(()=>hfrCanvasGlossaryProjection(packet),/original source/);
  });
}
test('an uncalibrated Canvas page gains no source controls or descriptor entries',()=>{
  const meta={...contract.pages[0].meta,key:'shared-nms002-l07-p008'} as HfrPageMeta;
  assert.equal(withHfrCanvasGlossary(meta),meta);
  assert.equal(hfrCanvasGlossaryProjection({source:{sha256:meta.sourceSha256},entry:{key:meta.key,artifacts:{data:{sha256:'0'.repeat(64)}}},meta}),undefined);
});
