import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {audioCueMatchesContext} from '../runtime';
import {boundedNarrationPlan} from '../lesson-manual-narration';
import type {AnimationRendererProps} from '../contract';
import {getCourseG04L04Gs002FrameState} from '../modules/course-g04-l04-gs-002';
import {validateLessonTextActivities, validateLessonTextFrameControl} from '../lesson-text-frame-control';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {G4_L4_ZOG_X_PAGE as C} from './generated/g4-l4-zog-x-page-config';
import {G4_L4_ZOG_X_GAME as game} from './generated/g4-l4-zog-x-game-config';
import {ZOG_X_ACTIVITIES, G4_L4_GS002_TEXT_PRESENTATION as capability} from './g4-l4-gs002';
import {createZogXSession, dispatchZogX, synchronizeZogXSession, type ZogXSession} from './g4-l4-zog-x-host-state';
import {getZogXTextSnapshot, zogXSceneState} from './g4-l4-zog-x-text';

const context = (frame: number, patch: Partial<AnimationRendererProps> = {}): AnimationRendererProps =>
  ({frame, frameDomain: game.frameDomain, rootFrame: 6, scenario: 'source-static-frame', lang: 'en', seed: 73, replay: 0, ...patch});
const snapshot = (r: AnimationRendererProps, s = createZogXSession(r.seed, r.replay)) => getZogXTextSnapshot(getCourseG04L04Gs002FrameState(r.frame, r), r, s, r);
function started() {
  let frame = 591;
  const s = dispatchZogX(createZogXSession(73), {type: 'start'}, context(591, {onLessonFrameRequest: req => {frame = req.toFrame; return true;}}));
  return {r: context(frame), s: synchronizeZogXSession(s, context(frame))};
}

test('page capability binds source text and host audio without granting a page admission', () => {
  validateLessonTextBinding(C.binding); validateLessonTextFrameControl(capability.frameControl!, 602);
  validateLessonTextActivities(ZOG_X_ACTIVITIES, 602, 12);
  assert.equal(C.binding.blocks.length, 122); assert.equal(capability.playbackEndFrameByDomain?.[game.frameDomain], 591);
  assert.equal(ZOG_X_ACTIVITIES.find(a => a.id === 'g4-l4-zog-x-wrong-close')!.audio, undefined);
  assert.equal(ZOG_X_ACTIVITIES.filter(a => a.buttonPress).length, 2);
  for (const a of ZOG_X_ACTIVITIES) if (a.audio) {
    const bytes = readFileSync('apps/web/public'+a.audio.source);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), a.audio.sha256);
  }
  const wav = readFileSync('apps/web/public'+C.sourceAudio.source);
  assert.equal(wav.readUInt32LE(4), wav.length-8); assert.equal(wav.readUInt16LE(20), 3);
  assert.equal(wav.readUInt32LE(24), 22050); assert.equal(wav.readUInt32LE(52), wav.length-56);
  const projection = readFileSync('work/typography-v1/g4-l4-zog-x/audio-prep-r2/sprite-841-projected.f32le');
  assert.deepEqual(wav.subarray(56), projection, 'WAV must retain every reviewed PCM sample bit-for-bit');
});

test('every intro frame has exact text/scene suppression identity; authored blank fields stay absent', () => {
  for (let frame=1; frame<=591; frame++) {
    const r=context(frame), s=createZogXSession(73), snap=snapshot(r,s), projection=zogXSceneState(s,r);
    assert.equal(snap.status,'ready');assert.equal(snap.identity.frame,frame);
    assert.equal(new Set(snap.suppressedInstances.map(x=>x.id)).size,snap.suppressedInstances.length);
    assert(snap.blocks.every(x=>!x.visible||x.text.trim()));
    if(frame<591)assert.equal(projection.children.length,0);
    else assert.equal(projection.children.filter(x=>x.visible).length,0,'all feedback and directions start hidden at source591');
  }
  assert.equal(snapshot(context(199)).blocks.find(x=>x.id==='instruction-0')!.visible,false);
  assert.equal(snapshot(context(200)).blocks.find(x=>x.id==='instruction-0')!.text,'Addition');
  assert.equal(snapshot(context(370)).blocks.find(x=>x.id==='instruction-1')!.visible,false);
  assert.equal(snapshot(context(373)).blocks.find(x=>x.id==='instruction-1')!.text,'Each');
  assert(!snapshot(context(591)).blocks.some(x=>x.id.includes('97')||x.id.includes('686')));
});

test('unrelated seeks and mismatched source/session identities cannot invent a live question', () => {
  for (const frame of [592,596,601,602]) {
    const snap=snapshot(context(frame));assert.equal(snap.status,'blocked');assert.equal(snap.suppressedInstances.length,0);
  }
  const {r,s}=started();assert.equal(snapshot(r,s).status,'ready');
  assert.equal(snapshot({...r,uiLanguage:'es'},s).status,'ready','Spanish UI retains the explicit English source-text fallback');
  for(const patch of [{frameDomain:'root'}, {rootFrame:7}, {scenario:'unknown'}, {entryStateSha256:'a'.repeat(64)}, {seed:74}, {replay:1}, {lang:'es' as const}])
    assert.equal(snapshot({...r,...patch},s).status,'blocked');
  const foreign=getCourseG04L04Gs002FrameState(r.frame,{...r,seed:74});assert.equal(getZogXTextSnapshot(foreign,r,s,r).status,'blocked');
  const source=getCourseG04L04Gs002FrameState(r.frame,r);
  for(const patch of [{animationId:'course-g04-l04-in-008'}, {sourceSwfSha256:'0'.repeat(64)},
    {exportFrame:null}, {sourceStaticVisualReady:false}]) {
    const blocked=getZogXTextSnapshot({...source,...patch},r,s,r);
    assert.equal(blocked.status,'blocked');assert.equal(blocked.blocks.length,0);assert.equal(blocked.suppressedInstances.length,0);
  }
});

test('each correct clock controls its own visible art and nested236 holds its authored stop', () => {
  const {r,s}=started();
  for(const f of game.feedback){
    for(const frame of [f.startFrame,f.endFrame]){
      const id=`g4-l4-zog-x-correct-${f.stage}`,token='source-clock-token';
      const session:ZogXSession={...s,correct:{id,floor:0,revision:1,token},pool:{...s.pool!,correctSelect:f.stage}};
      const runtime={...r,lessonActivities:[{id,sourceInstanceId:f.sourceInstanceId,frameDomain:f.frameDomain,frame,revision:1,cancellationToken:token,status:frame===f.endFrame?'completed' as const:'playing' as const}]};
      const projected=zogXSceneState(session,runtime),correct=projected.children.find(x=>x.id===f.sourceInstanceId)!;
      assert.equal(correct.frame,frame);assert.equal(correct.visible,true);
      assert(projected.children.filter(x=>x.id!==correct.id&&!x.id.includes('>')).every(x=>!x.visible));
      const stopped=projected.children.filter(x=>x.id.startsWith(correct.id+'>'));
      if(frame===f.endFrame&&[3,4].includes(f.stage)){assert.equal(stopped.length,1);assert.equal(stopped[0].frame,1);}
      assert.equal(snapshot(runtime,session).status,'ready');
    }
  }
});

test('wrong panel suppression begins at26 and disappears after the source60 close projection wraps', () => {
  const {r,s}=started();
  for(const frame of [2,25,26,55,60]){
    const id=frame===60?'g4-l4-zog-x-wrong-close':'g4-l4-zog-x-wrong',token='wrong-token';
    const session:ZogXSession={...s,wrong:{id,floor:0,revision:1,token}};
    const runtime={...r,lessonActivities:[{id,sourceInstanceId:game.wrongFeedback.sourceInstanceId,frameDomain:game.wrongFeedback.frameDomain,frame,revision:1,cancellationToken:token,status:'playing' as const}]};
    const projected=zogXSceneState(session,runtime);
    assert.equal(projected.suppressed.some(x=>x.role==='native-wrong-feedback-panel'),frame>=26);
    if(frame===60){
      const ended=zogXSceneState(session,{...runtime,lessonActivities:runtime.lessonActivities.map(x=>({...x,status:'completed' as const}))});
      assert.equal(ended.view.wrongFrame,1);assert(!ended.suppressed.some(x=>x.role==='native-wrong-feedback-panel'));
    }
  }
});

// A real ES host click previously selected the shared main PCM instead of the
// preserved Spanish track. Visual English fallback does not select audio.
test('Spanish narration cannot be shadowed by the English main source stream', () => {
  const base = {frameDomain: game.frameDomain, scenario: 'source-static-frame', seed: 0};
  const cues = capability.sourceTimelineAudioCues!;
  assert(audioCueMatchesContext(cues[0], {...base, lang: 'en'}));
  assert.equal(audioCueMatchesContext(cues[0], {...base, lang: 'es'}), false);
  assert(boundedNarrationPlan(cues, {firstFrame: 1, endFrameExclusive: 591}, 12, {...base, lang: 'en'}));
  assert.equal(boundedNarrationPlan(cues, {firstFrame: 1, endFrameExclusive: 591}, 12, {...base, lang: 'es'}), null);
  assert.equal(C.spanishTrack.language, 'es');
  assert.deepEqual(C.spanishTrack.visibleWhen, ['es']);
  assert.equal(C.spanishTrack.activation, 'user');
  assert.equal(C.spanishTrack.timelineBehavior, 'pause-while-playing');
  assert(ZOG_X_ACTIVITIES.every(a => !a.audio || a.audio.language === 'shared'));
});
