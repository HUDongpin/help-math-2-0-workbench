import assert from 'node:assert/strict';
import test from 'node:test';
import {build,sourceBitmapSvg} from './build-g678-alg-l11-p034-source-reveal.mjs';
test('source reveal rebuild is deterministic and stores shared source image bytes once',async()=>{
  const data=await build({check:true});assert.equal(data.tiles.length,24);
  assert.ok(Object.keys(data.bitmaps).length<=2);
  assert.ok(Object.values(data.gates).every(value=>value===false));
});
test('source bitmap vector sanitizer rejects external and executable payloads',()=>{
  assert.throws(()=>sourceBitmapSvg('<svg width="1" height="1"><image href="https://invalid.example/image.png"/></svg>','test',{}));
  assert.throws(()=>sourceBitmapSvg('<svg width="1" height="1"><script/></svg>','test',{}));
});
