import test from 'node:test';
import assert from 'node:assert/strict';
import {witnessHistoricalInputs,OLD_REGISTRY,REGISTRY,WITNESS} from './prepare-g678-nms-l01-p044-stable-candidate.mjs';
test('only exact378 historical registry becomes its immutable witness',()=>{
  const source={path:'source.swf',bytes:1,sha256:'a'.repeat(64)},inputs=[source,OLD_REGISTRY];
  const result=witnessHistoricalInputs(inputs);assert.equal(result[0],source);assert.deepEqual(result[1],{...OLD_REGISTRY,path:WITNESS});assert.equal(inputs[1].path,REGISTRY);
});
test('wrong hash/count or duplicate/missing mutable snapshot cannot be remapped',()=>{
  for(const inputs of[[],[OLD_REGISTRY,OLD_REGISTRY],[{...OLD_REGISTRY,sha256:'b'.repeat(64)}],[{...OLD_REGISTRY,bytes:1}]])assert.throws(()=>witnessHistoricalInputs(inputs));
});
