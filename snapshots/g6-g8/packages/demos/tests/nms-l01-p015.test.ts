import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import current from '../src/modules/g678-nms-l01-p015';
import {CONFIG,PLAN} from '../src/timelines/shared-nms002-l01-p015';
import {ContinuousSourceStreamClockCandidate} from '../src/continuous-source-stream-clock-candidate';
const context=(frame:number)=>({frame,frameDomain:'sprite-52',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0});

test('all329 source frames retain the source root and finite host plan without promoting other frame domains',()=>{
 assert.equal(current.playbackMode,'once');assert.equal(CONFIG.rootFrameCount,10);assert.equal(CONFIG.mainFrameCount,329);assert.equal(PLAN.lastFrame,329);
 assert.equal(CONFIG.sourceSwfSha256,'7a6122f1ce5d894c27b3703aca7e9ff332eef43b4f53d0b19c6aabea0d62835f');
 for(let frame=1;frame<=329;frame++){
  const s=current.getFrameState(frame,context(frame));assert.deepEqual(s.nestedSprites,[]);
  assert(s.sourceReading.every(r=>r.firstFrame<=frame&&r.lastFrame>=frame));
  for(const h of s.sourceHotspots)for(const r of h.ranges){assert(r.firstFrame<=frame&&r.lastFrame>=frame);assert(0<=r.rect.left&&r.rect.right<=800&&r.rect.right>r.rect.left);assert(0<=r.rect.top&&r.rect.bottom<=600&&r.rect.bottom>r.rect.top);}
 }
 for(const frame of [0,330]){assert.deepEqual(current.getFrameState(frame,context(frame)).sourceReading,[]);assert.deepEqual(current.getFrameState(frame,context(frame)).sourceHotspots,[]);}
 for(const override of [{frameDomain:'root'},{lang:'es' as const},{scenario:'not-source'}])assert.deepEqual(current.getFrameState(329,{...context(329),...override}).sourceReading,[]);
});
test('the readable explanation follows the signed line, complete definition and both three-jump examples',()=>{
 const texts=(frame:number)=>current.getFrameState(frame,context(frame)).sourceReading.map(r=>r.text);
 assert.deepEqual(texts(5),[]);assert.deepEqual(texts(6),['Number line: −10 to +10, with 0 between the negative and positive integers.']);
 assert.equal(texts(95).length,1);assert.equal(texts(96).at(-1),'Opposite integers are integers that have the same distance from zero on a number line but in different directions.');
 assert.equal(texts(148).length,2);assert.equal(texts(149).at(-1),'−3 is 3 units to the left of 0.');
 assert.equal(texts(227).length,3);assert.equal(texts(228).at(-1),'+3 is 3 units to the right of 0.');
 assert.equal(texts(303).length,4);assert.equal(texts(304).at(-1),'−3 and +3 are opposite integers: the same distance from 0, in different directions.');assert.deepEqual(texts(329),texts(304));
});
test('eight exact glossary keys respect source alpha and both moving clip masks',()=>{
 const a=current.privateSourceTerminal;assert.deepEqual(a.controls.map(c=>[c.sourceCharacterId,c.entryId]),[[27,'opposite'],[28,'positive-integers'],[29,'negative-integers'],[33,'opposite-integers'],[34,'distance'],[35,'integers'],[38,'direction'],[39,'number-line']]);
 const visible=(frame:number): readonly number[]=>current.getFrameState(frame,context(frame)).sourceHotspots.map(h=>h.sourceCharacterId);
 assert.deepEqual(visible(1),[]);assert.deepEqual(visible(2),[27,28,29]);assert.deepEqual(visible(8),[27,28,29]);assert.deepEqual(visible(9),[27,28,29,33]);
 for(const [f,id] of [[31,35],[48,34],[63,39],[89,38]]){assert(!visible(f-1).includes(id));assert(visible(f).includes(id));}
 assert.deepEqual(visible(329),[27,28,29,33,34,35,38,39]);
 for(const h of a.hotspots){const first=h.ranges[0].rect,last=h.ranges.at(-1)!.rect;if([27,28,29].includes(h.sourceCharacterId))assert.deepEqual(first,last);else assert(first.right-first.left<last.right-last.left);}
});
test('all unchanged source MP3 samples end before host329 without an appended silence or another loop',()=>{
 const bytes=Buffer.from(current.privateSourceTerminal.sourceAudioBase64,'base64');assert.equal(bytes.length,132600);assert.equal(createHash('sha256').update(bytes).digest('hex'),'e286da08631135bed7fda56754075bda8419d13e83fabeaa86f00df4be378a03');
 new ContinuousSourceStreamClockCandidate(PLAN,{commitHeldFrame:()=>true});assert.equal(PLAN.audioFirstFrame,10);assert.equal(PLAN.latencySamples,1673);assert.equal(PLAN.decoder.decodedSamples,587520);assert.equal(PLAN.decoder.sampleRate,22050);assert.equal(PLAN.decoder.channels,1);
 const end=(PLAN.audioFirstFrame-1)/PLAN.fps+(PLAN.decoder.decodedSamples-PLAN.latencySamples)/PLAN.decoder.sampleRate;assert(Math.abs(end-27.31902494331066)<1e-9);assert(end<(PLAN.lastFrame-1)/PLAN.fps);assert.equal(PLAN.sourceSegmentCount,1);assert.equal(PLAN.sourceHasNegativeSeek,false);
});
