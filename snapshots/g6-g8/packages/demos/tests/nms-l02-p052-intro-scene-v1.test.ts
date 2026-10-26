import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {p052IntroScene,p052IntroDigits} from '../src/nms-l02-p052-intro-scene-v1';
import {P052_INTRO_SCENE} from '../src/generated/nms-l02-p052-intro-scene-v1';
test('all114 source intro frames partition exactly and resolve every source shape',()=>{
 const shapes=new Set<number>(P052_INTRO_SCENE.vectors.map(s=>s.characterId));let next=1;
 for(const r of P052_INTRO_SCENE.ranges){assert.equal(r.first,next);assert.ok(r.last>=r.first);next=r.last+1;}
 assert.equal(next,115);assert.equal(shapes.size,37);
 for(let frame=1;frame<=114;frame++)for(const o of p052IntroScene(frame)){
  assert.equal(o.stageMatrix.length,6);assert.ok(o.stageMatrix.every(Number.isFinite));assert.ok(o.alpha>=0&&o.alpha<=1);
  if(o.kind==='shape')assert.ok(shapes.has(o.characterId));else assert.equal(typeof o.text,'string');
 }
});
test('source domains remain root10/main156 with root placement6',()=>{
 assert.equal(P052_INTRO_SCENE.rootFrameCount,10);assert.equal(P052_INTRO_SCENE.mainFrameCount,156);assert.equal(P052_INTRO_SCENE.rootEntryFrame,6);
 assert.deepEqual(P052_INTRO_SCENE.stage,[800,600]);assert.equal(P052_INTRO_SCENE.fps,12);
});
test('exact authored digits ascend001–016 and descend to000; no invented75 demo',()=>{
 assert.equal(p052IntroDigits(31),null);
 for(let f=32;f<=47;f++)assert.equal(p052IntroDigits(f),String(f-31).padStart(3,'0'));
 for(let f=48;f<=61;f++)assert.equal(p052IntroDigits(f),'016');
 for(let f=62;f<=77;f++)assert.equal(p052IntroDigits(f),String(77-f).padStart(3,'0'));
 assert.equal(p052IntroDigits(114),'000');
});
test('prompt fade and source parent transform are retained',()=>{
 assert.equal(p052IntroScene(1).length,0);
 const prompt=(f:number)=>p052IntroScene(f).find(o=>o.characterId===157)!;
 assert.equal(prompt(2).alpha,0);assert.equal(prompt(7).alpha,1);
 assert.deepEqual(prompt(7).stageMatrix,[1,0,0,1,1927,2134]);
 assert.ok(p052IntroScene(7).some(o=>o.characterId===164&&o.path.includes('/sprite-165/')));
});
test('every direct source object has a matching compiled stage transform',()=>{
 const source=JSON.parse(fs.readFileSync(new URL('../../../migrations/shared-nms002-l02-p052/audit/source-display-list-v1.json',import.meta.url),'utf8'));
 for(const row of source.frames.filter((r:{frame:number})=>r.frame<=114))for(const p of row.placements){
  if(p.characterId===165)continue;
  const got=p052IntroScene(row.frame).find(o=>o.path===`sprite-350/depth-${p.depth}`);assert.ok(got);
  assert.equal(got.characterId,p.characterId);const m=p.matrix;
  assert.deepEqual(got.stageMatrix,[m[0],m[1],m[2],m[3],m[4]+8248,m[5]+5666]);
 }
});
test('frame validation rejects practice/outro and noninteger seeks',()=>{
 for(const frame of [0,115,156,-1,1.5,NaN,Infinity])assert.throws(()=>p052IntroScene(frame));
});
