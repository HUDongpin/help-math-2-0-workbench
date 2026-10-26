import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import current from '../src/modules/g678-nms-l01-p010';
import {CONFIG,PLAN} from '../src/timelines/shared-nms002-l01-p010';
import {ContinuousSourceStreamClockCandidate} from '../src/continuous-source-stream-clock-candidate';
const context=(frame:number)=>({frame,frameDomain:'sprite-49',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0});

test('all315 source frame states retain the finite host plan and the ten-frame source root',()=>{
 assert.equal(current.playbackMode,'once');assert.equal(CONFIG.rootFrameCount,10);assert.equal(CONFIG.mainFrameCount,315);assert.equal(PLAN.lastFrame,315);
 assert.equal(CONFIG.sourceSwfSha256,'a83b82a60a68ef3bbe03af6defa18a34b8751318845ae40f2507b6af96900bba');
 for(let frame=1;frame<=315;frame++){
  const s=current.getFrameState(frame,context(frame));assert.deepEqual(s.nestedSprites,[]);
  assert(s.sourceReading.every(r=>r.firstFrame<=frame&&r.lastFrame>=frame));
  for(const h of s.sourceHotspots)for(const r of h.ranges){assert(r.firstFrame<=frame&&r.lastFrame>=frame);assert(r.rect.right>r.rect.left&&r.rect.bottom>r.rect.top);}
 }
 assert.deepEqual(current.getFrameState(316,context(316)).sourceReading,[]);
 assert.deepEqual(current.getFrameState(316,context(316)).sourceHotspots,[]);
 assert.deepEqual(current.getFrameState(315,{...context(315),frameDomain:'root'}).sourceReading,[]);
});
test('definition, signed numberline, absolute-value bars and both distances appear at source beats',()=>{
 const texts=(frame:number)=>current.getFrameState(frame,context(frame)).sourceReading.map(r=>r.text);
 assert.deepEqual(texts(79),[]);
 assert.deepEqual(texts(80),['The absolute value of a number is the distance the number is from zero on a number line.']);
 assert.equal(texts(112).length,1);assert.equal(texts(113).at(-1),'Number line: −10 to +10, with 0 between the negative and positive integers.');
 assert.equal(texts(154).length,2);assert.equal(texts(155).at(-1),'|−4| = 4');
 assert.equal(texts(215).length,3);assert.equal(texts(216).at(-1),'−4 is 4 units from 0.');
 assert.equal(texts(313).length,4);assert.equal(texts(314).at(-1),'+4 is 4 units from 0.');assert.deepEqual(texts(315),texts(314));
});
test('three glossary keys use source-mask-intersected hit regions and remain available at315',()=>{
 const a=current.privateSourceTerminal;
 assert.deepEqual(a.controls.map(c=>[c.sourceCharacterId,c.entryId]),[[11,'absolute-value'],[12,'distance'],[15,'number-line']]);
 const visible=(frame:number)=>current.getFrameState(frame,context(frame)).sourceHotspots.map(h=>h.sourceCharacterId);
 assert.deepEqual(visible(8),[]);assert.deepEqual(visible(9),[11]);assert.deepEqual(visible(39),[11]);
 assert.deepEqual(visible(40),[11,12]);assert.deepEqual(visible(69),[11,12]);assert.deepEqual(visible(70),[11,12,15]);
 assert.deepEqual(visible(315),[11,12,15]);
 for(const h of a.hotspots){const first=h.ranges[0].rect,last=h.ranges.at(-1)!.rect;assert(first.right-first.left<last.right-last.left);}
});
test('the complete source MP3 and native samples finish before the finite host stop',()=>{
 const bytes=Buffer.from(current.privateSourceTerminal.sourceAudioBase64,'base64');assert.equal(bytes.length,128050);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'6c8ecc17d9418e1f6ae11ba3825aa9f3431f0f0e9ab3c9f5b39310f59387ef6f');
 new ContinuousSourceStreamClockCandidate(PLAN,{commitHeldFrame:()=>true});
 assert.equal(PLAN.audioFirstFrame,7);assert.equal(PLAN.latencySamples,1673);assert.equal(PLAN.decoder.decodedSamples,567360);
 const end=(PLAN.audioFirstFrame-1)/PLAN.fps+(PLAN.decoder.decodedSamples-PLAN.latencySamples)/PLAN.decoder.sampleRate;
 assert(Math.abs(end-26.154739229024944)<1e-9);assert(end<(PLAN.lastFrame-1)/PLAN.fps);
 assert.equal(PLAN.sourceSegmentCount,1);assert.equal(PLAN.sourceHasNegativeSeek,false);
});
