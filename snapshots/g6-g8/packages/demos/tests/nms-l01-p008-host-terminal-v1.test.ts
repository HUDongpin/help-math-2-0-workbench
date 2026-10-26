import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import current from '../src/modules/g678-nms-l01-p008-host-terminal-v1';
import unhosted from '../src/modules/g678-nms-l01-p008';
import {CONFIG,PLAN,SOURCE_HOST} from '../src/timelines/shared-nms002-l01-p008-host-terminal-v1';
import {ContinuousSourceStreamClockCandidate} from '../src/continuous-source-stream-clock-candidate';
const context=(frame:number)=>({frame,frameDomain:'sprite-81',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0});

test('the hosted page stops at330 while retaining every source drawing, text and hit region',()=>{
  assert.equal(current.playbackMode,'once');assert.equal(unhosted.playbackMode,'loop');assert.equal(CONFIG.mainFrameCount,330);assert.equal(CONFIG.rootFrameCount,10);
  assert.equal(SOURCE_HOST.sourceSwfSha256,'275499325edb24daed95952b207d2dd4ed83056ebac54cd0bc911673058086c9');assert.equal(SOURCE_HOST.terminalFrame,330);
  for(let f=1;f<=330;f++){const a=current.getFrameState(f,context(f)),b=unhosted.getFrameState(f,context(f));assert.deepEqual(a.sourceReading,b.sourceReading);assert.deepEqual(a.sourceHotspots,b.sourceHotspots);assert.deepEqual(a.nestedSprites,b.nestedSprites);assert.equal(a.sourceHostTerminalFrame,330);}
  assert.equal(current.privateSourceTerminal.sourceAudioBase64,unhosted.privateSourceCycle.sourceAudioBase64);
  assert.equal(createHash('sha256').update(Buffer.from(current.privateSourceTerminal.sourceAudioBase64,'base64')).digest('hex'),'4e5d29e5e72ac363c6b859c9a63a44bfe2035e066bc146f0f7fe6ed8087d98e9');
});
test('the source audio finishes before the host terminal frame without cutting any decoded sample',()=>{
  new ContinuousSourceStreamClockCandidate(PLAN,{commitHeldFrame:()=>true});assert.equal(PLAN.audioFirstFrame,8);assert.equal(PLAN.latencySamples,1673);assert.equal(PLAN.decoder.decodedSamples,592704);
  const audioEnd=(PLAN.audioFirstFrame-1)/PLAN.fps+(PLAN.decoder.decodedSamples-PLAN.latencySamples)/PLAN.decoder.sampleRate;
  assert(Math.abs(audioEnd-27.387460317460317)<1e-9);assert(audioEnd<(PLAN.lastFrame-1)/PLAN.fps);assert.equal(PLAN.lastFrame,330);assert.equal(PLAN.sourceSegmentCount,1);
});
test('final source text and glossary remain available at the host hold with no synthetic next frame',()=>{
  const final=current.getFrameState(330,context(330));assert.equal(final.sourceReading.at(-1)?.text,'-5 and +5 are opposite integers.');assert.equal(final.sourceHotspots.length,8);
  assert.deepEqual(current.getFrameState(331,context(331)).sourceReading,[]);assert.deepEqual(current.getFrameState(331,context(331)).sourceHotspots,[]);
  assert.deepEqual(current.getFrameState(94,{...context(94),frameDomain:'root'}).sourceReading,[]);
});
