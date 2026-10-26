import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import p5 from '../src/modules/g678-nms-l01-p005';
import {PLAN} from '../src/timelines/shared-nms002-l01-p005';
const context=(frame:number)=>({frame,frameDomain:'sprite-148',rootFrame:6,scenario:'source-static-frame',lang:'en' as const,seed:0});
test('all219 main states preserve separate child lifetimes and deterministic Replay',()=>{
  for(let frame=1;frame<=219;frame++){
    const state=p5.getFrameState(frame,context(frame));assert.deepEqual(state,p5.getFrameState(frame,context(frame)));
    assert.equal(state.nestedSprites.length,frame<35?2:frame<76?3:4);
    for(const child of state.nestedSprites){
      const first=child.characterId===104?(child.parentCharacterId===129?76:35):child.characterId===129?76:1;
      const length=child.characterId===26?22:child.characterId===129?14:17;
      assert.equal(child.frame,(frame-first)%length+1);
    }
    assert.deepEqual(p5.getFrameState(frame,{...context(frame),frameDomain:'root'}).nestedSprites,[]);
    assert.deepEqual(p5.getFrameState(frame,{...context(frame),lang:'es'}).sourceReading,[]);
  }
  const at=(f:number)=>p5.getFrameState(f,context(f)).nestedSprites.filter(c=>c.parentCharacterId===129)[0]?.frame;
  assert.equal(at(75),undefined);assert.equal(at(76),1);assert.equal(at(89),14);assert.equal(at(90),15);assert.equal(at(92),17);assert.equal(at(93),1);
  assert.deepEqual(p5.getFrameState(1,context(1)).nestedSprites.map(c=>c.frame),[1,1]);
});
test('complete source words reveal at109 and215; exact glossary buttons activate at95 and110',()=>{
  const text=(f:number)=>p5.getFrameState(f,context(f)).sourceReading.map(r=>r.text);
  assert.deepEqual(text(108),[]);assert.deepEqual(text(109),['Positive and Negative Integers']);assert.equal(text(214).length,1);
  assert.deepEqual(text(215),['Positive and Negative Integers','Essential Question: How do you do operations with integers?']);
  const active=(f:number)=>p5.privateSourceStory.controls.filter(c=>c.ranges.some(r=>f>=r.firstFrame&&f<=r.lastFrame)).map(c=>c.entryId);
  assert.deepEqual(active(94),[]);assert.deepEqual(active(95),['positive-integers','negative-integers']);assert.equal(active(109).length,2);
  assert.deepEqual(active(110),['positive-integers','negative-integers','integers','operation']);assert.equal(active(219).length,4);assert.deepEqual(active(220),[]);
});
test('native narration binds the complete unmodified MP3 and all measured PCM samples',()=>{
  const bytes=Buffer.from(p5.privateSourceStory.sourceAudioBase64,'base64');
  assert.equal(bytes.length,90740);assert.equal(createHash('sha256').update(bytes).digest('hex'),'74dbfd2323e132b15267ea3354926b517fceb833d185a0ef5bf0e8726558a4b6');
  assert.equal(PLAN.audioFirstFrame,1);assert.equal(PLAN.latencySamples,1673);assert.equal(PLAN.decoder.decodedSamples,402048);assert.equal(PLAN.decoder.sampleRate,22050);
  assert.equal(PLAN.lastFrame,219);assert.equal(PLAN.sourceHasNegativeSeek,false);
  assert.equal(PLAN.decoder.pcmSha256,'0eb442bdedf89c1b0072a0b23c401dd387f0bce42f1dcde38aa05ef4bf3e547f');
});
