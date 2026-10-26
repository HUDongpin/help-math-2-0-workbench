import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

type Audit={animationId:string;embeddedStreams:{sourceCharacterId:number;
 headFrame:number;firstBlockFrame:number;lastBlockFrame:number;blockCount:number;
 cueTiming:string;spokenLanguage:string;originalRuntimeAudible:boolean}[];
 structuralTotals:{soundStreamHeadCount:number;soundStreamBlockCount:number};
 lessonSaCandidate:{sourceFile:string;sha256:string;durationMs:number;
 language:string;startSemantics:string};
 originalRuntimeAccepted:boolean;audioAccepted:boolean;strictComplete:boolean};
function load(page:'p053'|'p054'){
 const file=new URL(`../../../migrations/shared-nms002-l02-${page}/audit/audio-structure-v1.json`,import.meta.url);
 const bytes=readFileSync(file);
 return {sha256:createHash('sha256').update(bytes).digest('hex'),value:JSON.parse(bytes.toString('utf8')) as Audit};
}
function assertCoverage(audit:Audit,ids:number[],blocks:number){
 assert.deepEqual(audit.embeddedStreams.map(item=>item.sourceCharacterId),ids);
 assert.equal(audit.structuralTotals.soundStreamHeadCount,ids.length);
 assert.equal(audit.structuralTotals.soundStreamBlockCount,blocks);
 assert.equal(audit.embeddedStreams.reduce((sum,item)=>sum+item.blockCount,0),blocks);
 assert.ok(audit.embeddedStreams.every(item=>item.headFrame<=item.firstBlockFrame&&
  item.firstBlockFrame<=item.lastBlockFrame&&item.cueTiming==='structural-frame-range-only'&&
  item.spokenLanguage==='unverified'&&!item.originalRuntimeAudible));
 assert.equal(audit.originalRuntimeAccepted,false);
 assert.equal(audit.audioAccepted,false);
 assert.equal(audit.strictComplete,false);
}
test('P053 and P054 audio audits bind all five distinct embedded stream domains',()=>{
 const a=load('p053'),b=load('p054');
 assert.equal(a.sha256,'2468bc4e992701c7fee12a5b52566dcf4653dcb965a474f2d041927c8a5d7d56');
 assert.equal(b.sha256,'0e1b96f79f08d636bdf1aeb5650901b2e43ac091f72c3c36e594b3e3354a3871');
 assertCoverage(a.value,[187],619);
 assertCoverage(b.value,[194,208,648,729],266);
 assert.deepEqual(a.value.embeddedStreams.map(item=>[item.firstBlockFrame,item.lastBlockFrame]),[[4,694]]);
 assert.deepEqual(b.value.embeddedStreams.map(item=>[item.firstBlockFrame,item.lastBlockFrame]),
  [[2,27],[3,31],[16,121],[14,118]]);
});
test('same-byte lesson-SA candidates remain separate unaccepted placements',()=>{
 const a=load('p053').value,b=load('p054').value;
 assert.notEqual(a.lessonSaCandidate.sourceFile,b.lessonSaCandidate.sourceFile);
 assert.equal(a.lessonSaCandidate.sha256,b.lessonSaCandidate.sha256);
 assert.equal(a.lessonSaCandidate.durationMs,54552);
 assert.equal(b.lessonSaCandidate.durationMs,54552);
 for(const item of [a,b]){
  assert.equal(item.lessonSaCandidate.language,'undetermined');
  assert.equal(item.lessonSaCandidate.startSemantics,'unverified-original-host-trigger');
 }
});
test('missing embedded stream fails the structural completeness assertion',()=>{
 const audit=load('p054').value;
 const missing={...audit,embeddedStreams:audit.embeddedStreams.slice(1)};
 assert.throws(()=>assertCoverage(missing,[194,208,648,729],266));
});
test('provisional inventories include each source stream without inventing an accepted cue',()=>{
 for(const page of ['p053','p054'] as const){
  const audit=load(page).value;
  const file=new URL(`../../../migrations/shared-nms002-l02-${page}/audio-inventory.csv`,import.meta.url);
  const rows=readFileSync(file,'utf8').trim().split('\n').slice(1);
  const ids=rows.map(row=>row.split(',')[0]);
  assert.deepEqual(ids,[...audit.embeddedStreams.map(item=>`embedded-stream-sprite-${item.sourceCharacterId}`),
   'lesson-SA-candidate']);
  assert.ok(rows.every(row=>row.includes('unverified')));
  assert.ok(rows.at(-1)?.includes(audit.lessonSaCandidate.sha256));
 }
});
