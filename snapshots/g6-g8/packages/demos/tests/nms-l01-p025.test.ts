import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import current from '../src/modules/g678-nms-l01-p025';
import {CONFIG,PLAN} from '../src/timelines/shared-nms002-l01-p025';
import {ContinuousSourceStreamClockCandidate} from '../src/continuous-source-stream-clock-candidate';
const context=(frame:number)=>({frame,frameDomain:'sprite-38',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0});
const text=(frame:number):readonly string[]=>current.getFrameState(frame,context(frame)).sourceReading.map(r=>r.text);

test('all337 source frames stay within the admitted finite domain, source reading and visible hit regions',()=>{
 assert.equal(current.playbackMode,'once');assert.equal(CONFIG.rootFrameCount,10);assert.equal(CONFIG.mainFrameCount,337);assert.equal(PLAN.lastFrame,337);
 assert.equal(CONFIG.sourceSwfSha256,'2df9773f0ac3a30efe982b3e9ff1377672790ec8890a1d6bf548177b0f037fdc');
 for(let frame=1;frame<=337;frame++){
  const s=current.getFrameState(frame,context(frame));assert.deepEqual(s.nestedSprites,[]);assert(s.sourceReading.every(r=>r.firstFrame<=frame&&r.lastFrame>=frame));
  for(const h of s.sourceHotspots)for(const r of h.ranges){assert(r.firstFrame<=frame&&r.lastFrame>=frame);assert(0<=r.rect.left&&r.rect.right<=800&&r.rect.right>r.rect.left);assert(0<=r.rect.top&&r.rect.bottom<=600&&r.rect.bottom>r.rect.top);}
 }
 for(const frame of [0,338]){assert.deepEqual(text(frame),[]);assert.deepEqual(current.getFrameState(frame,context(frame)).sourceHotspots,[]);}
 for(const override of [{frameDomain:'root'},{lang:'es' as const},{scenario:'not-source'}])assert.deepEqual(current.getFrameState(337,{...context(337),...override}).sourceReading,[]);
});
test('accessible counts follow six completed source pair fades and the fraction reveals numerator, denominator and quotient in order',()=>{
 assert.deepEqual(text(74),[]);assert.deepEqual(text(75),['Division is the opposite of multiplication.']);assert(!text(127).includes('Division is the grouping of numbers into equal parts.'));assert(text(128).includes('Division is the grouping of numbers into equal parts.'));
 for(const [i,frame]of [153,159,165,171,177,183].entries()){assert(!text(frame-1).includes(`${(i+1)*2} oranges`));assert(text(frame).includes(`${(i+1)*2} oranges`));assert.equal(text(frame).filter(t=>/^\d+ oranges$/u.test(t)).length,1);}
 assert(text(191).includes('12 Oranges'));assert(!text(190).includes('12 Oranges'));assert(text(223).includes('12 oranges arranged in 3 groups.'));assert(text(234).includes('12 oranges in 3 equal groups.'));
 assert(!text(303).includes('12'));assert(text(304).includes('12'));assert(!text(309).includes('12 ÷ 3'));assert(text(310).includes('12 ÷ 3'));assert(!text(328).includes('12 ÷ 3 = 4'));assert(text(329).includes('12 ÷ 3 = 4'));assert.deepEqual(text(337),text(329));
 assert.equal(12/3,4);
});
test('three source morphs retain all nine exact interpolation ratios and six bitmap pairs form three groups of four',()=>{
 const B='/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p025-behavior-source-v1';
 const source=JSON.parse(readFileSync(B+'/semantic-source-audit-v1.json','utf8')),frames=JSON.parse(readFileSync(B+'/source-all-domain-state-audit-v1.json','utf8')).domains['38'].frames;
 const expected=[0,7282,14564,21845,29127,36409,43691,50972,58254];
 for(const [i,depth]of [34,35,36].entries()){assert.deepEqual(Array.from({length:9},(_,j)=>frames[224+j][depth].morph??0),expected);assert.equal(frames[224][depth].id,22+i);assert.notEqual(frames[233][depth]?.id,22+i);}
 assert.equal(frames[233][36].id,25);assert.equal(source.teachingDiagram.groupCenters.length,12);
 for(const group of ['upper-left','upper-right','bottom'])assert.equal(source.teachingDiagram.groupCenters.filter((c:{group:string})=>c.group===group).length,4);
 for(const [i,depth]of [22,24,26,28,30,32].entries()){const f=[153,159,165,171,177,183][i];assert.equal(frames[f-1][depth].alpha,256);assert(frames[f-2][depth].alpha<256);assert.deepEqual(frames[222][depth],frames[336][depth]);}
 assert.equal(frames[303][37].id,26);assert.equal(frames[309][39].id,33);assert.equal(frames[328][40].id,34);assert.equal(frames[328][41].id,35);
});
test('five glossary regions wait for their actual mask intersections and preserve the source equal to Equivalent key',()=>{
 const a=current.privateSourceTerminal;assert.deepEqual(a.controls.map(c=>[c.sourceCharacterId,c.entryId]),[[10,'multiplication'],[11,'opposite'],[14,'division'],[15,'group'],[16,'equivalent']]);
 const visible=(frame:number):readonly number[]=>current.getFrameState(frame,context(frame)).sourceHotspots.map(h=>h.sourceCharacterId);
 for(const [frame,id]of [[66,10],[58,11],[93,14],[101,15],[121,16]]){assert(!visible(frame-1).includes(id));assert(visible(frame).includes(id));}
 for(const h of a.hotspots){const first=h.ranges[0],last=h.ranges.at(-1)!;assert(first.rect.right-first.rect.left<last.rect.right-last.rect.left);const c=a.controls.find(c=>c.sourceCharacterId===h.sourceCharacterId)!;assert.equal(c.ranges[0].firstFrame,first.firstFrame);assert.equal(c.ranges[0].lastFrame,337);}
});
test('complete unchanged MP3 ends before host337, retaining empty source block5 inside the single native stream',()=>{
 const bytes=Buffer.from(current.privateSourceTerminal.sourceAudioBase64,'base64');assert.equal(bytes.length,138320);assert.equal(createHash('sha256').update(bytes).digest('hex'),'29cca7a304e023e41061869501547a1ad1aeca6e01824a018e84ebd5d6f9e67b');
 new ContinuousSourceStreamClockCandidate(PLAN,{commitHeldFrame:()=>true});assert.equal(PLAN.audioFirstFrame,4);assert.equal(PLAN.latencySamples,1673);assert.equal(PLAN.decoder.decodedSamples,612864);assert.equal(PLAN.decoder.sampleRate,22050);assert.equal(PLAN.decoder.channels,1);
 const raw=JSON.parse(readFileSync('/Volumes/American Dream/hudongpin/helpmath-g678-completion-20260909-01a08222/nms-l01-p025-behavior-source-v1/audio/raw-streams-audit.json','utf8'));assert.equal(raw.streams.length,1);assert.deepEqual(raw.streams[0].blocks.map((b:{frame:number})=>b.frame),Array.from({length:334},(_,i)=>i+4));assert.deepEqual(raw.streams[0].blocks.filter((b:{mp3Bytes:number})=>b.mp3Bytes===0),[{frame:5,samples:0,seek:0,mp3Bytes:0}]);
 assert.equal(PLAN.decoder.pcmSha256,'6f08ebc672dfa4ab86434fb9a5be1802be9d32ed79d4ad26edc416e24a9d0e89');const end=(PLAN.audioFirstFrame-1)/PLAN.fps+(PLAN.decoder.decodedSamples-PLAN.latencySamples)/PLAN.decoder.sampleRate;assert(Math.abs(end-176201/6300)<1e-12);assert(end<(PLAN.lastFrame-1)/PLAN.fps);assert.equal(PLAN.sourceSegmentCount,1);assert.equal(PLAN.sourceHasNegativeSeek,false);
});
test('reduced motion preserves22 source still milestones for equal grouping and final result without replaying blink sequences',()=>{
 const frames:readonly number[]=current.privateSourceTerminal.motionKeyframes;assert.equal(frames.length,22);assert.equal(frames[0],1);assert.equal(frames.at(-1),337);assert(frames.every((f,i)=>Number.isInteger(f)&&f>=1&&f<=337&&(i===0||f>frames[i-1])));
 assert.deepEqual(frames.filter(f=>f>=153&&f<=183),[153,159,165,171,177,183]);assert.deepEqual(frames.filter(f=>f>=225&&f<=233),[]);assert(frames.includes(234));assert(frames.includes(304));assert(frames.includes(310));assert(frames.includes(329));
 assert(!frames.includes(301));assert(!frames.includes(303));assert(!frames.includes(331));assert(!frames.includes(333));assert(!frames.includes(335));
});
