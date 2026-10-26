import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import current from '../src/modules/g678-nms-l01-p023';
import {CONFIG,PLAN} from '../src/timelines/shared-nms002-l01-p023';
import {ContinuousSourceStreamClockCandidate} from '../src/continuous-source-stream-clock-candidate';
const context=(frame:number)=>({frame,frameDomain:'sprite-59',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0});

test('all1030 source frames preserve the finite source-host domain and bounded visible hit regions',()=>{
 assert.equal(current.playbackMode,'once');assert.equal(CONFIG.rootFrameCount,10);assert.equal(CONFIG.mainFrameCount,1030);assert.equal(PLAN.lastFrame,1030);
 assert.equal(CONFIG.sourceSwfSha256,'786e3a3e22f8d757a4943586435428bbfa5533cad2787bbd75337941da172421');
 for(let frame=1;frame<=1030;frame++){
  const s=current.getFrameState(frame,context(frame));assert.deepEqual(s.nestedSprites,[]);
  assert(s.sourceReading.every(r=>r.firstFrame<=frame&&r.lastFrame>=frame));
  for(const h of s.sourceHotspots)for(const r of h.ranges){assert(r.firstFrame<=frame&&r.lastFrame>=frame);assert(0<=r.rect.left&&r.rect.right<=800&&r.rect.right>r.rect.left);assert(0<=r.rect.top&&r.rect.bottom<=600&&r.rect.bottom>r.rect.top);}
 }
 for(const frame of [0,1031]){assert.deepEqual(current.getFrameState(frame,context(frame)).sourceReading,[]);assert.deepEqual(current.getFrameState(frame,context(frame)).sourceHotspots,[]);}
 for(const override of [{frameDomain:'root'},{lang:'es' as const},{scenario:'not-source'}])assert.deepEqual(current.getFrameState(1030,{...context(1030),...override}).sourceReading,[]);
});
test('literal temperature table reveals one row at each source milestone and retains the blank initial hour count',()=>{
 const rows=(frame:number)=>current.getFrameState(frame,context(frame)).sourceReading.filter(r=>'table'in r).map(r=>r.table!.rows);
 assert.deepEqual(rows(304),[]);
 const starts=[305,318,338,345,350,355,360,365];
 for(let i=0;i<starts.length;i++){
  const table=rows(starts[i]);assert.equal(table.length,1);assert.equal(table[0].length,7);
  for(let j=0;j<7;j++){assert.equal(Boolean(table[0][j][1]),j<i);assert.equal(table[0][j][2],j<i&&j>0?String(j):'');}
 }
 assert.deepEqual(rows(1030),rows(365));assert.deepEqual(rows(365)[0].map(r=>r[1]),['0º','0º+6º=6º','6º+6º=12º','12º+6º=18º','18º+6º=24º','24º+6º=30º','30º+6º=36º']);
 const text=(f:number)=>current.getFrameState(f,context(f)).sourceReading.map(r=>r.text);
 assert.deepEqual(text(244),[]);assert(text(245)[0].includes('zero degrees Fahrenheit at 7:00 AM.'));
 assert(!text(783).some(t=>t.startsWith('Temperature (1:00 PM)')));assert(text(784).includes('Temperature (1:00 PM) = 6 hours × 6º + 0º = 36º'));
 assert(!text(971).includes('Multiplication is repeated addition of a number.'));assert(text(972).includes('Multiplication is repeated addition of a number.'));
 assert.equal((13-7)*6+0,36);
});
test('all six glossary hit regions wait for nonempty source mask intersections',()=>{
 const a=current.privateSourceTerminal;assert.deepEqual(a.controls.map(c=>[c.sourceCharacterId,c.entryId]),[[10,'temperature'],[13,'increase'],[14,'fahrenheit'],[15,'degree'],[57,'multiplication'],[58,'addition']]);
 const visible=(frame:number):readonly number[]=>current.getFrameState(frame,context(frame)).sourceHotspots.map(h=>h.sourceCharacterId);
 for(const [frame,id]of [[102,10],[118,15],[123,14],[166,13],[936,57],[960,58]]){assert(!visible(frame-1).includes(id));assert(visible(frame).includes(id));}
 for(const h of a.hotspots){const first=h.ranges[0],last=h.ranges.at(-1)!;assert(first.rect.right-first.rect.left<last.rect.right-last.rect.left);const c=a.controls.find(c=>c.sourceCharacterId===h.sourceCharacterId)!;assert.equal(c.ranges[0].firstFrame,first.firstFrame);assert.equal(c.ranges[0].lastFrame,1030);}
});
test('complete embedded MP3 precedes host1030 by a genuine source visual tail',()=>{
 const bytes=Buffer.from(current.privateSourceTerminal.sourceAudioBase64,'base64');assert.equal(bytes.length,424840);assert.equal(createHash('sha256').update(bytes).digest('hex'),'9af2f21b3a019b605680ddfea9d4e8e9ca2c224639e70c150717ab75c998789f');
 new ContinuousSourceStreamClockCandidate(PLAN,{commitHeldFrame:()=>true});assert.equal(PLAN.audioFirstFrame,6);assert.equal(PLAN.latencySamples,1673);assert.equal(PLAN.decoder.decodedSamples,1882368);assert.equal(PLAN.decoder.sampleRate,22050);assert.equal(PLAN.decoder.channels,1);
 assert.equal(PLAN.decoder.pcmSha256,'8e088edf7c5acf5ae637d701bb9569531569c69aaaf0fc7f790574ceadbf30cb');const end=(PLAN.audioFirstFrame-1)/PLAN.fps+(PLAN.decoder.decodedSamples-PLAN.latencySamples)/PLAN.decoder.sampleRate;assert(Math.abs(end-755953/8820)<1e-12);assert(end<(PLAN.lastFrame-1)/PLAN.fps);assert.equal(PLAN.sourceSegmentCount,1);assert.equal(PLAN.sourceHasNegativeSeek,false);
});
test('reduced-motion static milestones include progressive table states and the complete terminal drawing',()=>{
 const frames=current.privateSourceTerminal.motionKeyframes;assert.equal(frames.length,21);assert.equal(frames[0],1);assert.equal(frames.at(-1),1030);
 assert(frames.every((f,i)=>Number.isInteger(f)&&f>=1&&f<=1030&&(i===0||f>frames[i-1])));
 assert.deepEqual(frames.filter(f=>f>=305&&f<=365),[305,318,338,345,350,355,360,365]);assert(frames.includes(785));assert(frames.includes(972));
});
