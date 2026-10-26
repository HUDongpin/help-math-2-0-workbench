import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {normalizeSourceSvg} from './g678-nms-l01-p042-build-source-visual.mjs';
const base=new URL('../work/g678-shared-page-factory/g678-nms-l01-p042-source-visual-v1/',import.meta.url);
const raw=readFileSync(new URL('source-root.svg',base),'utf8');
const p=JSON.parse(readFileSync(new URL('source-projection.json',base),'utf8'));
const matrix=[1.000045776367188,0,0,1,412.05,283.4];
test('normalization is deterministic with exact XML matrix and explicit source empty-space glyph only',()=>{
  const a=normalizeSourceSvg(raw,matrix,p.emptyTextGlyph),b=normalizeSourceSvg(raw,matrix,p.emptyTextGlyph);
  assert.deepEqual(a,b); assert.equal(a.svg,readFileSync(new URL('normalized-root.svg',base),'utf8'));
  assert.ok(a.idMap.some(m=>m.sourceId==='text11')); assert.ok(a.idMap.some(m=>m.sourceId==='Mc_ Page_Title'));
});
test('normalizer rejects arbitrary dangling refs, active markup, wrong source whitespace proof and changed root instance',()=>{
  for(const svg of [raw.replace('#text0','#unknown'),raw.replace('</svg>','<script>alert(1)</script></svg>'),
    raw.replace('id="animation"','id="other"'),raw.replace('xlink:href="#text0"','xlink:href="https://invalid.example/image"')])
    assert.throws(()=>normalizeSourceSvg(svg,matrix,p.emptyTextGlyph));
  assert.throws(()=>normalizeSourceSvg(raw,matrix,{...p.emptyTextGlyph,unicode:65}));
});
