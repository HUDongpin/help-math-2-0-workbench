import assert from 'node:assert/strict';
import test from 'node:test';
import {p039PercentAtSourceX,p039SourceXAtPercent,p039GridAtPercent}from'../src/nms-l02-p039-slider-v1';
test('source slider reaches all101percent values and exactly that many cells',()=>{
 for(let n=0;n<=100;n++){
  assert.equal(p039PercentAtSourceX(p039SourceXAtPercent(n)),n);
  const cells=p039GridAtPercent(n);assert.equal(cells.length,100);assert.equal(cells.filter(c=>c.filled).length,n);
  assert(Object.isFrozen(cells)&&cells.every(Object.isFrozen));
 }
 const selected=p039GridAtPercent(25).filter(c=>c.filled);
 assert(selected.every(c=>c.column<2||c.column===2&&c.row>=5));
 assert.deepEqual(selected[0],{index:1,row:9,column:0,filled:true});
});
test('out-of-range source drags clamp and invalid values fail',()=>{
 assert.equal(p039PercentAtSourceX(-1000),0);assert.equal(p039PercentAtSourceX(1000),100);
 for(const n of[-1,101,2.5,NaN])assert.throws(()=>p039GridAtPercent(n));
 assert.throws(()=>p039PercentAtSourceX(Infinity));
});
