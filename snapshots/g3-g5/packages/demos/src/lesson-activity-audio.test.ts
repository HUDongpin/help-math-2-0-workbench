import assert from 'node:assert/strict';
import test from 'node:test';
import {LessonActivityAudioController, LessonActivityAudioGroupController, type LessonActivityAudioState} from './lesson-activity-audio';
import type {LessonTextActivityDefinition, LessonTextActivitySnapshot} from './lesson-text-contract';
import {beginSourceClockActivity,cancelSourceClockActivity} from './lesson-source-clock';

class AudioDouble extends EventTarget {
  currentTime=0;volume=1;preload='';readyState=1;error=null;
  plays=0;pauses=0;loads=0;rejectPlay=false;
  constructor(readonly src:string){super();}
  load(){this.loads++;}
  pause(){this.pauses++;}
  play(){this.plays++;return this.rejectPlay?Promise.reject(new Error('blocked')):Promise.resolve();}
}
const definition:LessonTextActivityDefinition={id:'correct-1',frameDomain:'sprite-294',startFrame:2,endFrame:27,fps:12,parentFrames:[728],
  audio:{source:'/lesson-typography-v1/audio/correct-1.mp3',sha256:'a'.repeat(64),language:'shared',spokenLanguage:'undetermined',firstFrame:3,lastFrame:27}};
const activity=(frame:number,revision=1):LessonTextActivitySnapshot=>({id:'correct-1',frameDomain:'sprite-294',frame,revision,status:'playing'});
test('exact clock cancellation stops media and prevents late metadata from starting it',()=>{
  for(const readyState of [0,1]){
    const media=new AudioDouble('/lesson-typography-v1/audio/correct-1.mp3');media.readyState=readyState;
    const controller=new LessonActivityAudioGroupController(()=>media,()=>{});
    const def={...definition,startFrame:3};
    const initial=beginSourceClockActivity([],def,1)!.map(a=>({...a,cancellationToken:'clock:seek:1'}));
    const update=(activities:readonly LessonTextActivitySnapshot[])=>controller.update({identity:'lesson',definitions:[def],activities,enabled:true,paused:false,language:'en',volume:1});
    update(initial);const plays=media.plays;
    const cancelled=cancelSourceClockActivity(initial,{id:def.id,revision:1,cancellationToken:'clock:seek:1',parentFrame:728})!;
    update(cancelled);assert(media.pauses>0);assert.equal(media.currentTime,0);
    media.readyState=1;media.dispatchEvent(new Event('loadedmetadata'));
    assert.equal(media.plays,plays,'cancelled loading activity never starts later');
    controller.dispose();
  }
});
function harness(initialReady=1){
  const elements:AudioDouble[]=[],states:LessonActivityAudioState[]=[];
  const controller=new LessonActivityAudioController(source=>{const audio=new AudioDouble(source);audio.readyState=initialReady;elements.push(audio);return audio as unknown as HTMLAudioElement;},state=>states.push(state));
  const update=(frame:number,changes:Record<string,unknown>={})=>controller.update({identity:'lesson:0:en',definitions:[definition],activity:activity(frame),enabled:true,paused:false,language:'en',volume:.8,...changes});
  return{controller,elements,states,update};
}

test('audio waits for its source entry frame and neither later frames nor volume changes restart it',async()=>{
  const h=harness();h.update(2);assert.equal(h.elements[0]!.plays,0);
  h.update(3);await Promise.resolve();assert.equal(h.elements[0]!.plays,1);
  h.elements[0]!.currentTime=.5;h.update(9,{volume:0});h.update(10,{volume:.4});
  assert.equal(h.elements[0]!.plays,1);assert.equal(h.elements[0]!.currentTime,.5);assert.equal(h.elements[0]!.volume,.4);
  assert.equal(h.states.at(-1)?.status,'playing');
});

test('pause and resume preserve current media time instead of replaying the feedback',async()=>{
  const h=harness();h.update(3);await Promise.resolve();h.elements[0]!.currentTime=.42;
  h.update(8,{paused:true});assert.equal(h.states.at(-1)?.status,'paused');assert.equal(h.elements[0]!.currentTime,.42);
  h.update(8,{paused:false});await Promise.resolve();assert.equal(h.elements[0]!.plays,2);assert.equal(h.elements[0]!.currentTime,.42);
});

test('gotoAndPlay(2) on a frame-one stream keeps the source frame offset',()=>{
  const h=harness();h.update(2,{definitions:[{...definition,audio:{...definition.audio!,firstFrame:1,lastFrame:13}}]});
  assert.equal(h.elements[0]!.currentTime,1/12);
});

test('audio ending does not advance a teaching frame and cannot replay on later frame updates',async()=>{
  const h=harness();h.update(3);await Promise.resolve();h.elements[0]!.dispatchEvent(new Event('ended'));
  h.update(22);assert.equal(h.elements[0]!.plays,1);assert.equal(h.states.at(-1)?.status,'ended');
  assert.equal('frame' in h.states.at(-1)!,false);
});

test('Replay, page changes and cancelled metadata loads retire prior audio',()=>{
  const h=harness(0);h.update(3);const old=h.elements[0]!;
  h.update(3,{identity:'lesson:1:en',activity:activity(3,2)});old.readyState=1;old.dispatchEvent(new Event('loadedmetadata'));
  assert.equal(old.plays,0);assert.ok(old.pauses>0);
  const next=h.elements[1]!;next.readyState=1;next.dispatchEvent(new Event('loadedmetadata'));assert.equal(next.plays,1);
  h.controller.dispose();assert.ok(next.pauses>0);
});

test('invalid or disabled assets create no media element; shared source audio stays available in ES without a translation claim',()=>{
  const h=harness();h.update(3,{enabled:false});assert.equal(h.elements.length,0);
  h.update(3,{definitions:[{...definition,audio:{...definition.audio!,source:'https://unrelated.example/audio.mp3'}}]});assert.equal(h.elements.length,0);
  h.update(3,{language:'es'});assert.equal(h.elements.length,1);assert.equal(definition.audio!.spokenLanguage,'undetermined');
});

test('blocked playback requires an explicit retry and source completion stops its stream',async()=>{
  const h=harness();h.update(2);h.elements[0]!.rejectPlay=true;h.update(3);await Promise.resolve();await Promise.resolve();
  assert.equal(h.states.at(-1)?.status,'blocked');h.update(4);assert.equal(h.elements[0]!.plays,1);
  h.elements[0]!.rejectPlay=false;assert.equal(h.controller.retry(),true);await Promise.resolve();assert.equal(h.elements[0]!.plays,2);
  h.update(27,{activity:{...activity(27),status:'completed'}});assert.ok(h.elements[0]!.pauses>0);assert.equal(h.elements[0]!.currentTime,0);
});

test('closing into an authored outro retires the intro audio and starts at the corresponding source time',()=>{
  const h=harness();h.update(3);const audio=h.elements[0]!;audio.currentTime=.8;
  const outro={...definition,id:'correct-1-outro',startFrame:23,endFrame:28,
    entryFromActivity:{id:'correct-1',firstFrame:14,lastFrame:22}};
  h.update(23,{definitions:[definition,outro],activity:{...activity(23,2),id:outro.id}});
  assert.ok(audio.pauses>0);assert.equal(audio.currentTime,(23-definition.audio!.firstFrame)/12);
  assert.equal(audio.plays,2);
  h.update(24,{definitions:[definition,outro],activity:{...activity(24,2),id:outro.id}});
  assert.equal(audio.plays,2);
});


test('placed child audio overlaps, restarting one instance leaves its sibling playing, and parent removal cancels it',async()=>{
  const elements:AudioDouble[]=[];
  const group=new LessonActivityAudioGroupController(source=>{const audio=new AudioDouble(source);elements.push(audio);return audio as unknown as HTMLAudioElement;},()=>{});
  const wrong={...definition,id:'wrong-child',sourceInstanceId:'root/Pop1_mc',audio:{...definition.audio!,source:'/audio/wrong.mp3'}};
  const coach={...definition,id:'coach-child',sourceInstanceId:'root/Coach_audio_2',audio:{...definition.audio!,source:'/audio/coach.mp3'}};
  const snapshot=(item:typeof wrong,revision:number):LessonTextActivitySnapshot=>({...activity(3,revision),id:item.id,sourceInstanceId:item.sourceInstanceId});
  const update=(activities:LessonTextActivitySnapshot[],paused=false)=>group.update({identity:'lesson:0',definitions:[wrong,coach],activities,enabled:true,paused,language:'en',volume:.7});
  update([snapshot(wrong,1)]);await Promise.resolve();const wrongAudio=elements[0]!,coachAudio=elements[1]!;
  wrongAudio.currentTime=.4;const priorWrongPauses=wrongAudio.pauses;
  update([snapshot(wrong,1),snapshot(coach,2)]);await Promise.resolve();
  assert.equal(wrongAudio.currentTime,.4);assert.equal(wrongAudio.pauses,priorWrongPauses);assert.equal(coachAudio.plays,1);
  coachAudio.currentTime=.3;const priorCoachPauses=coachAudio.pauses;
  update([snapshot(wrong,3),snapshot(coach,2)]);await Promise.resolve();
  assert.equal(wrongAudio.plays,2);assert.equal(coachAudio.plays,1);assert.equal(coachAudio.pauses,priorCoachPauses);assert.equal(coachAudio.currentTime,.3);
  update([snapshot(wrong,3),snapshot(coach,2)],true);assert.ok(wrongAudio.pauses>priorWrongPauses);assert.ok(coachAudio.pauses>priorCoachPauses);
  update([snapshot(wrong,3),snapshot(coach,2)]);await Promise.resolve();assert.equal(coachAudio.currentTime,.3);
  const beforeRemoval=coachAudio.pauses;update([]);assert.ok(coachAudio.pauses>beforeRemoval);assert.equal(coachAudio.currentTime,0);
  group.dispose();
});


const explicitOrigin = (offsetSeconds: number, firstFrame = 1): LessonTextActivityDefinition =>
  ({...definition,audio:{...definition.audio!,firstFrame,lastFrame:27,offsetSeconds}});

test('explicit source origin retains rational goto2 timing and never changes default declarations',()=>{
  const base=1673/22050;
  const h=harness();h.update(2,{definitions:[explicitOrigin(base)]});
  assert.equal(h.elements[0]!.currentTime,base+1/12);
  assert.ok(Math.abs(h.elements[0]!.currentTime*22050-3510.5)<1e-10);
  const first=harness();first.update(2,{definitions:[explicitOrigin(base,2)]});
  assert.equal(first.elements[0]!.currentTime,base);
  const zero=harness();zero.update(2,{definitions:[explicitOrigin(0)]});
  assert.equal(zero.elements[0]!.currentTime,1/12);
});

test('late first observation uses source origin once, while frame, volume and pause changes preserve cursor',async()=>{
  const h=harness(),defs=[explicitOrigin(1673/22050)];h.update(7,{definitions:defs});
  const audio=h.elements[0]!;assert.equal(audio.currentTime,1673/22050+6/12);await Promise.resolve();
  audio.currentTime=.91;h.update(8,{definitions:defs,volume:0});h.update(9,{definitions:defs,volume:.3});
  assert.equal(audio.currentTime,.91);assert.equal(audio.plays,1);assert.equal(audio.volume,.3);
  h.update(9,{definitions:defs,paused:true});h.update(9,{definitions:defs,paused:false});await Promise.resolve();
  assert.equal(audio.currentTime,.91);assert.equal(audio.plays,2);
  h.update(2,{definitions:defs,activity:activity(2,2)});
  assert.equal(audio.currentTime,1673/22050+1/12);assert.equal(audio.plays,3);
});

test('metadata delay uses latest source frame; removed activity cannot play late',()=>{
  const h=harness(0),defs=[explicitOrigin(1673/22050)];h.update(2,{definitions:defs});h.update(6,{definitions:defs});
  const audio=h.elements[0]!;audio.readyState=1;audio.dispatchEvent(new Event('loadedmetadata'));
  assert.equal(audio.currentTime,1673/22050+5/12);assert.equal(audio.plays,1);
  const cancelled=harness(0);cancelled.update(2,{definitions:defs});const old=cancelled.elements[0]!;
  cancelled.update(2,{definitions:defs,activity:undefined});old.readyState=1;old.dispatchEvent(new Event('loadedmetadata'));
  assert.equal(old.plays,0);
});

test('invalid explicit media origins reject before media creation',()=>{
  for(const offset of [-1,NaN,Infinity,-Infinity,'0',null,{},true]){
    const h=harness();h.update(2,{definitions:[explicitOrigin(offset as number)]});assert.equal(h.elements.length,0);
  }
});

test('independent child origins do not reseek a sibling and removal still cancels sound',async()=>{
  const elements:AudioDouble[]=[];
  const group=new LessonActivityAudioGroupController(source=>{const a=new AudioDouble(source);elements.push(a);return a as unknown as HTMLAudioElement;},()=>{});
  const wrong={...explicitOrigin(1673/22050),id:'wrong-child',sourceInstanceId:'root/Pop1_mc'};
  const coach={...explicitOrigin(.2,2),id:'coach-child',sourceInstanceId:'root/Coach_audio_2'};
  const snap=(d:LessonTextActivityDefinition,revision:number):LessonTextActivitySnapshot=>({...activity(2,revision),id:d.id,sourceInstanceId:d.sourceInstanceId});
  const update=(activities:LessonTextActivitySnapshot[])=>group.update({identity:'lesson:offset',definitions:[wrong,coach],activities,enabled:true,paused:false,language:'en',volume:.6});
  update([snap(wrong,1)]);await Promise.resolve();assert.equal(elements[0]!.currentTime,1673/22050+1/12);
  elements[0]!.currentTime=.8;update([snap(wrong,1),snap(coach,2)]);await Promise.resolve();
  assert.equal(elements[0]!.currentTime,.8);assert.equal(elements[1]!.currentTime,.2);
  update([snap(wrong,3),snap(coach,2)]);assert.equal(elements[0]!.currentTime,1673/22050+1/12);
  assert.equal(elements[1]!.plays,1);update([]);assert.ok(elements.every(a=>a.currentTime===0&&a.pauses>0));
  group.dispose();
});
