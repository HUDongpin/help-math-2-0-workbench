import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import current from '../src/modules/g678-nms-l01-p017-v3';
import {CONFIG,PLAN} from '../src/timelines/shared-nms002-l01-p017';
import {ContinuousSourceStreamClockCandidate} from '../src/continuous-source-stream-clock-candidate';
const context=(frame:number)=>({frame,frameDomain:'sprite-62',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0});

test('all646 source frames preserve the finite source-host domain and bounded visible hit regions',()=>{
 assert.equal(current.playbackMode,'once');assert.equal(CONFIG.rootFrameCount,10);assert.equal(CONFIG.mainFrameCount,646);assert.equal(PLAN.lastFrame,646);
 assert.equal(CONFIG.sourceSwfSha256,'33b044501fcdd85755abd7a4d14e2ca93e1b9482f28c35a94bef97f9cc890e1f');
 for(let frame=1;frame<=646;frame++){
  const s=current.getFrameState(frame,context(frame));assert.deepEqual(s.nestedSprites,[]);
  assert(s.sourceReading.every(r=>r.firstFrame<=frame&&r.lastFrame>=frame));
  for(const h of s.sourceHotspots)for(const r of h.ranges){assert(r.firstFrame<=frame&&r.lastFrame>=frame);assert(0<=r.rect.left&&r.rect.right<=800&&r.rect.right>r.rect.left);assert(0<=r.rect.top&&r.rect.bottom<=600&&r.rect.bottom>r.rect.top);}
 }
 for(const frame of [0,647]){assert.deepEqual(current.getFrameState(frame,context(frame)).sourceReading,[]);assert.deepEqual(current.getFrameState(frame,context(frame)).sourceHotspots,[]);}
 for(const override of [{frameDomain:'root'},{lang:'es' as const},{scenario:'not-source'}])assert.deepEqual(current.getFrameState(646,{...context(646),...override}).sourceReading,[]);
});
test('the readable sequence retains signed-seven results and waits for each source reveal',()=>{
 const texts=(frame:number)=>current.getFrameState(frame,context(frame)).sourceReading.map(r=>r.text);
 assert.deepEqual(texts(171),[]);assert.equal(texts(172).at(-1),'The absolute value of a number is the distance the number is from zero on a number line. For a positive number, it’s the number itself. For a negative number it is the number’s positive value.');
 assert.equal(texts(300).length,1);assert.equal(texts(301).at(-1),'|7| = 7: the absolute value of 7 is 7.');
 assert.equal(texts(331).length,2);assert.equal(texts(332).at(-1),'7 is 7 units from 0. The arrow points from 7 toward 0.');
 assert.equal(texts(396).length,3);assert.equal(texts(397).at(-1),'−7 is also 7 units from 0. The arrow points from −7 toward 0.');
 assert.equal(texts(487).length,4);assert.equal(texts(488).at(-1),'|−7| = 7: the absolute value of −7 is 7.');
 assert.equal(texts(564).length,5);assert.equal(texts(565).at(-1),'7 and −7 are opposites; |7| = |−7| = 7.');assert.deepEqual(texts(646),texts(565));
});
test('both source hotspots and companion terms wait for the three source mask intersections',()=>{
 const a=current.privateSourceTerminal;assert.deepEqual(a.controls.map(c=>[c.sourceCharacterId,c.entryId]),[[10,'absolute-value'],[11,'distance'],[61,'opposite']]);
 const visible=(frame:number):readonly number[]=>current.getFrameState(frame,context(frame)).sourceHotspots.map(h=>h.sourceCharacterId);
 assert.deepEqual(visible(4),[]);assert.deepEqual(visible(5),[10]);assert.deepEqual(visible(37),[10]);assert.deepEqual(visible(38),[10,11]);assert.deepEqual(visible(531),[10,11]);assert.deepEqual(visible(532),[10,11,61]);
 for(const h of a.hotspots){const first=h.ranges[0],last=h.ranges.at(-1)!;assert(first.rect.right-first.rect.left<last.rect.right-last.rect.left);const c=a.controls.find(c=>c.sourceCharacterId===h.sourceCharacterId)!;assert.equal(c.ranges[0].firstFrame,first.firstFrame);assert.equal(c.ranges[0].lastFrame,646);}
});
test('the unchanged embedded MP3 completes before host646 without padding or replay',()=>{
 const bytes=Buffer.from(current.privateSourceTerminal.sourceAudioBase64,'base64');assert.equal(bytes.length,266890);assert.equal(createHash('sha256').update(bytes).digest('hex'),'64bff0adacfa63e39c360f55bfc37dfd58ee3aece846d2245d0398306ec84a7f');
 new ContinuousSourceStreamClockCandidate(PLAN,{commitHeldFrame:()=>true});assert.equal(PLAN.audioFirstFrame,3);assert.equal(PLAN.latencySamples,1673);assert.equal(PLAN.decoder.decodedSamples,1182528);assert.equal(PLAN.decoder.sampleRate,22050);assert.equal(PLAN.decoder.channels,1);
 assert.equal(PLAN.decoder.pcmSha256,'6b49ed87d8179207255174d883390dbf773f107b9b2bdcb071e9f2769cd0037f');
 const end=(PLAN.audioFirstFrame-1)/PLAN.fps+(PLAN.decoder.decodedSamples-PLAN.latencySamples)/PLAN.decoder.sampleRate;assert(Math.abs(end-118453/2205)<1e-12);assert(end<(PLAN.lastFrame-1)/PLAN.fps);assert.equal(PLAN.sourceSegmentCount,1);assert.equal(PLAN.sourceHasNegativeSeek,false);
});
