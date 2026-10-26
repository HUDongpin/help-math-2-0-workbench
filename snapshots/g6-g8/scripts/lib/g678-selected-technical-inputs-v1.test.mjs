import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceOrderedLessonMembers} from './g678-selected-technical-inputs-v1.mjs';
const lesson=(moduleCode,moduleLesson,count)=>({moduleCode,moduleLesson,members:Array.from({length:count},(_,i)=>({ordinal:i+1,animationId:`shared-${moduleCode.toLowerCase()}-l${String(moduleLesson).padStart(2,'0')}-p${String(i+1).padStart(3,'0')}`}))});
test('keeps the complete exact selected source denominator rather than a hardcoded 60',()=>{
 const manifest={releases:[lesson('ALG001',6,60),lesson('NMS002',7,52)]};
 assert.equal(sourceOrderedLessonMembers(manifest).length,60);
 assert.equal(sourceOrderedLessonMembers(manifest,'NMS002:7').length,52);
 assert.equal(sourceOrderedLessonMembers(manifest,'NMS002:7').at(-1).animationId,'shared-nms002-l07-p052');
});
test('refuses unknown, ambiguous, empty or wildcard source lessons',()=>{
 const one=lesson('NMS002',7,52);
 for(const value of ['all','NMS002:*','NMS002:07','OTHER:7','ALG001:13'])assert.throws(()=>sourceOrderedLessonMembers({releases:[one]},value));
 assert.throws(()=>sourceOrderedLessonMembers({releases:[one]},'ALG001:6'),/exact source lesson/);
 assert.throws(()=>sourceOrderedLessonMembers({releases:[one,one]},'NMS002:7'),/exact source lesson/);
 assert.throws(()=>sourceOrderedLessonMembers({releases:[lesson('NMS002',7,0)]},'NMS002:7'),/nonempty/);
});
test('source order can be projected but missing, duplicate and wrong-lesson members cannot pass',()=>{
 const one=lesson('NMS002',7,52);
 assert.equal(sourceOrderedLessonMembers({releases:[{...one,members:[...one.members].reverse()}]},'NMS002:7')[0].ordinal,1);
 for(const mutate of [m=>m.splice(1,1),m=>m[1]=m[0],m=>m[1].animationId='shared-alg001-l06-p002',m=>m[1].ordinal=99]){
  const broken=structuredClone(one);mutate(broken.members);
  assert.throws(()=>sourceOrderedLessonMembers({releases:[broken]},'NMS002:7'),/source-ordered exact lesson identities/);
 }
});
