import assert from 'node:assert/strict';import test from 'node:test';import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
import {G4_L4_ESTIMATION_EXAMPLE_CONFIGS as C} from './generated/g4-l4-estimation-examples-config';
import {getColumnTeachingState,getColumnShapePaths} from './g4-l4-column-arithmetic';
import {getEstimationCopy,estimationTermActive} from './g4-l4-estimation-examples';
import {G4_L4_IN020_TEXT_PRESENTATION as P20} from './g4-l4-in020';import {G4_L4_IN021_TEXT_PRESENTATION as P21} from './g4-l4-in021';
import M20 from '../modules/course-g04-l04-in-020';import M21 from '../modules/course-g04-l04-in-021';
const root=process.env.ESTIMATION_CANDIDATE_ROOT??process.cwd();
const math=(index:number,frame:number)=>{const labels=getColumnTeachingState(C[index],frame).blocks.filter(b=>b.role==='label'&&b.visible&&b.state),rows=new Map<number,typeof labels>();for(const b of labels)rows.set(b.state!.baseline,[...(rows.get(b.state!.baseline)??[]),b]);return [...rows].sort((a,b)=>a[0]-b[0]).map(([_,row])=>row.sort((a,b)=>a.state!.x-b.state!.x).map(b=>b.text).join(''));};
test('original and rounded operands retain their equation and source-timed approximate relation',()=>{
 assert.deepEqual(math(0,620),['183+307≈500','200+300=500']);assert.deepEqual(math(1,360),['711–289≈400','700–300=400']);
 for(const[i,first]of [[0,533],[1,273]]){assert(math(i,first-1)[0].includes('='));assert(!math(i,first-1)[0].includes('≈'));assert(math(i,first)[0].endsWith('≈'));assert(!math(i,first)[0].includes('='));}
});
test('whole-word instructions and six dictionary actions preserve own source spelling',()=>{
 for(const[i,c]of C.entries()){const text=getEstimationCopy(c,c.frameCount).map(p=>p.tokens.filter(t=>t.alpha>0).map(t=>t.text).join(''));assert.equal(text[0],i===0?'Estimate means to find about how much or about how many.':'Estimate means to find out about how much or about how many.');assert.equal(text[1],'Estimate sums and differences by rounding the numbers before adding or subtracting.');assert.equal(c.terms.length,6);assert(c.terms.every(t=>estimationTermActive(t,c.frameCount)));assert.equal(c.terms.find(t=>t.key==='Round / Rounding')!.entryId,'en-0591-985f6684fc7d');assert(c.terms.every(t=>c.keyTerms.entryIds.includes(t.entryId)));}
});
test('filled source arrows stay continuous closed polygons through their morph',()=>{
 for(const c of C)for(const shape of c.figure.shapes.filter(s=>'morph'in s))for(const ratio of [0,32768,65535]){const paths=getColumnShapePaths(shape,ratio);assert.equal(paths.length,1);assert.equal(paths[0].fill,'rgba(0,0,0,1)');assert.equal(paths[0].stroke,'none');assert.equal((paths[0].d.match(/M /g)??[]).length,1);assert.equal((paths[0].d.match(/L /g)??[]).length,7);const nums=paths[0].d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);assert.deepEqual(nums.slice(0,2),nums.slice(-2));}
});
test('two exact capabilities keep source identity, continuous main PCM cues and explicit original SA',()=>{
 for(const[i,c]of C.entries()){const p=[P20,P21][i],m=[M20,M21][i];assert.deepEqual(p.binding,c.binding);assert.equal(p.playbackEndFrameByDomain![c.frameDomain],c.frameCount);assert.deepEqual(p.reducedMotionFrameByDomain,p.playbackEndFrameByDomain);assert.deepEqual(p.keyTerms,c.keyTerms);assert.deepEqual(p.sourceTimelineAudioCues,c.sourceAudio);assert.deepEqual(m.audioCues,[]);assert.equal(m.audioTracks.length,1);const sa=m.audioTracks[0];assert.equal(sa.activation,'user');assert.deepEqual(sa.visibleWhen,['es']);assert.deepEqual(sa.frameDomains,[c.frameDomain]);assert.equal(sa.timelineBehavior,'pause-while-playing');assert.equal(c.sourceAudio[0].frame,4);assert.equal(c.sourceAudio[0].endFrame,c.frameCount+1);assert.equal(c.sourceAudio[0].language,'en');assert.notEqual(sa.sha256,c.sourceAudio[0].sha256);for(const a of[sa,c.sourceAudio[0]])assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'apps/web/public'+a.source))).digest('hex'),a.sha256);
  const r={frame:c.frameCount,frameDomain:c.frameDomain,rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:17,replay:0},state=m.getFrameState(r.frame,r);assert.equal(p.getSnapshot(state,r).status,'ready');for(const delta of [{lang:'es' as const},{entryStateSha256:'capture'},{rootFrame:5},{frame:0},{seed:18}])assert.equal(p.getSnapshot(state,{...r,...delta}).status,'blocked');
 }
});
