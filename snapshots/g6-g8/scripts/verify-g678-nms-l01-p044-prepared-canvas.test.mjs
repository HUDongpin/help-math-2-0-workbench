import test from 'node:test';
import assert from 'node:assert/strict';
import {verify,drawingBodies} from './verify-g678-nms-l01-p044-prepared-canvas.mjs';
test('AST comparison excludes outside resource declarations, not actual function statements',()=>{
  const a='export function factory(){function draw(){return 1;}const image="old";}',b=a.replace('old','new');
  assert.deepEqual(drawingBodies(a),drawingBodies(b));assert.notDeepEqual(drawingBodies(a),drawingBodies(a.replace('return 1','return 2')));
});
test('actual V1/V2 functions compare identically and a sourceDraw mutation fails',async()=>{const result=await verify();assert.ok(result.identicalFunctionCount>100);assert.equal(result.actualSourceDrawMutationRejected,true);});
