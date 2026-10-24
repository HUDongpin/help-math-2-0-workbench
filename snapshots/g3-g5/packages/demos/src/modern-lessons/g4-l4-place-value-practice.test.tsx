import assert from'node:assert/strict';import test from'node:test';import fs from'node:fs';import path from'node:path';import{createHash}from'node:crypto';
import{loadLessonTextPresentation}from'../lesson-text-registry';
import{G4_L4_PLACE_VALUE_PRACTICE_CONFIGS as C}from'./generated/g4-l4-place-value-practice-config';
import{getColumnTeachingState}from'./g4-l4-column-arithmetic';
import{getPlaceValuePracticeCopy}from'./g4-l4-place-value-practice-scene';
const root=process.env.PRACTICE_CANDIDATE_ROOT??process.cwd();
const expected=[[['317','+759','1,076'],['598','+207','805'],['1,531','+299','1,830'],['778','+926','1,704'],['892','+109','1,001'],['379','+243','622']],[['65','−36','29'],['72','−19','53'],['516','−327','189'],['470','−349','121'],['3,381','−274','3,107'],['3,474','−2,569','905'],['1,111','−508','603']],[['0.11','+0.79','0.90'],['0.32','−0.18','0.14'],['4.59','+1.66','6.25'],['6.58','−3.39','3.19'],['51.36','+6.07','57.43'],['7.15','−5.57','1.58']]];
test('all19 authored equations retain place-value order, native signs, decimal points and result values',()=>{
 for(const[index,c]of C.entries())for(const[qi,q]of c.questions.entries()){
  const labels=getColumnTeachingState(c,q.frame).blocks.filter(b=>b.role==='label'&&b.visible&&b.state&&b.state.x>c.figure.bounds[0]+c.figure.bounds[2]*.75),groups=new Map<number,typeof labels>();for(const b of labels){const y=b.state!.baseline;groups.set(y,[...(groups.get(y)??[]),b]);}const math=[...groups].sort((a,b)=>a[0]-b[0]).map(([_,row])=>row.sort((a,b)=>a.state!.x-b.state!.x).map(b=>b.text).join('').replaceAll('–','−'));assert.deepEqual(math,expected[index][qi]);
 }
 assert(C[2].blocks.some(b=>'fontScale'in b&&b.fontScale===2.5&&b.text==='.'));assert(C[2].blocks.some(b=>'fontScale'in b&&b.fontScale===3&&b.text==='.'));
});
test('own instruction mask reveals complete words and decimal source wording changes at Q1',()=>{
 const masked=C[1];assert.equal(getPlaceValuePracticeCopy(masked,45).filter(p=>p.visible).flatMap(p=>p.tokens.filter(t=>t.alpha>0).map(t=>t.text)).join('').trim(),'Click New Problem as many');assert.equal(getPlaceValuePracticeCopy(masked,84).filter(p=>p.visible).flatMap(p=>p.tokens.filter(t=>t.alpha>0).map(t=>t.text)).join('').trim(),'Click New Problem as many times as you like to use base ten blocks to solve subtraction problems.');
 for(const[f,word]of [[148,'Problem'],[149,'Number']] as const){const text=getPlaceValuePracticeCopy(C[2],f).filter(p=>p.visible).map(p=>p.text).join('');assert(text.startsWith('Click New '+word));assert.equal(C[2].button.text,'New Problem');}
});
test('three exact registry capabilities retain own source identity, authored question holds and original user-triggered SA',async()=>{
 for(const[index,c]of C.entries()){
  const p=(await loadLessonTextPresentation(c.animationId))!,m=(await import('../modules/'+c.animationId)).default;assert.deepEqual(p.binding,c.binding);assert.equal(p.playbackEndFrameByDomain![c.frameDomain],c.initialQuestionFrame);assert.equal(p.reducedMotionFrameByDomain![c.frameDomain],c.initialQuestionFrame);assert.equal(p.frameControl!.transitions.length,c.poolSize*c.poolSize);assert.deepEqual(p.sourceTimelineAudioCues,c.sourceAudio);assert.deepEqual(m.audioCues,[]);assert.equal(m.audioTracks.length,1);const sa=m.audioTracks[0];assert.equal(sa.activation,'user');assert.deepEqual(sa.visibleWhen,['es']);assert.deepEqual(sa.frameDomains,[c.frameDomain]);assert.equal(sa.timelineBehavior,'pause-while-playing');assert.equal(c.sourceAudio[0].frame,[4,6,4][index]);assert.equal(c.sourceAudio[0].endFrame,c.frameCount+1);assert.equal(c.sourceAudio[0].language,'en');assert.notEqual(sa.sha256,c.sourceAudio[0].sha256);for(const a of[sa,c.sourceAudio[0]])assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'apps/web/public'+a.source))).digest('hex'),a.sha256);
  const r={frame:c.initialQuestionFrame,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:17,replay:0},state=m.getFrameState(r.frame,r);assert.equal(p.getSnapshot(state,r).status,'ready');assert.equal(p.getSnapshot(state,{...r,lang:'es'}).status,'blocked');assert.equal(p.getSnapshot(state,{...r,entryStateSha256:'capture'}).status,'blocked');
 }
});
