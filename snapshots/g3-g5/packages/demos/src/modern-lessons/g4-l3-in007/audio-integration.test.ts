import test from 'node:test';
import assert from 'node:assert/strict';
import {IN007_PRESENTATION,requestIn007KeyTerm,IN007_KEYTERM_BUTTONS} from './index';
import {getCourseG04L03In007FrameState} from '../../modules/course-g04-l03-in-007';
import {loadLessonTextPresentation} from '../../lesson-text-registry';
import {loadAnimationModule} from '../../animation-registry';
import {boundedNarrationPlan} from '../../lesson-manual-narration';
import {audioCueMatchesContext} from '../../runtime';
const ID='course-g04-l03-in-007',MAIN='35e62bb8ad052e76e20331722668f979a15588e6dbe39623a41291e0848fcaad',ES='96447525dc60534210a1752626bb9a627df2ce815339fded5ae2e13447fc10aa';
const context={frameDomain:'sprite-98',scenario:'source-static-frame',seed:0};
test('final registered IN007 capability owns EN main and keeps ES explicit-track priority',async()=>{
 const actual=await loadLessonTextPresentation(ID);assert.equal(actual,IN007_PRESENTATION,'Registry must return final maintained export');assert.equal(actual.binding.animationId,ID);assert.equal(actual.binding.sourceSwfSha256,'91c013434558ec9d6b49df67ae29106073b1a98de19099fdda26ab8d5f2d8d45');
 const cues=actual.sourceTimelineAudioCues!;assert.equal(cues.length,1);const cue=cues[0]!;assert.equal(cue.sha256,MAIN);assert.equal(cue.frame,1);assert.equal(cue.endFrame,556);assert.equal(cue.language,'en');assert.equal(cue.spokenLanguage,'undetermined');assert(audioCueMatchesContext(cue,{...context,lang:'en'}));assert(!audioCueMatchesContext(cue,{...context,lang:'es'}));assert.equal(boundedNarrationPlan(cues,{firstFrame:1,endFrameExclusive:555},12,{...context,lang:'es'}),null);const en=boundedNarrationPlan(cues,{firstFrame:1,endFrameExclusive:555},12,{...context,lang:'en'})!;assert(en);assert.equal(en.parts[0]!.pcm!.sha256,'b90817558e566faa0385edc0c786f216d6caa0d64ac2d0de128fc3adb87772ef');
 const module=await loadAnimationModule(ID);assert(module);const track=module.audioTracks!.find(t=>t.sha256===ES)!;assert(track);assert.equal(track.source,'/flash-assets/courses/course-g04-l03-in-007/audio/spanish-host-narration.mp3');assert.equal(track.language,'es');assert.equal(track.activation,'user');assert.deepEqual(track.visibleWhen,['es']);assert.deepEqual(track.frameDomains,['sprite-98']);assert.equal(track.timelineBehavior,'pause-while-playing');
 assert.equal(actual.playbackEndFrameByDomain!['sprite-98'],555);assert.equal(actual.reducedMotionFrameByDomain!['sprite-98'],555);assert.equal(actual.frameControl,undefined,'No authored parent goto/stop at555');assert.equal(actual.activityTimelines,undefined,'No source companion feedback stream');
});
test('final renderer keyword wrapper validates complete source snapshot and real reveal frame',()=>{
 const expected=[{button:10,term:'Pattern',id:'en-0459-b510b9647e1c',frame:23},{button:12,term:'Set',id:'en-0612-bf9e68924be1',frame:29},{button:11,term:'Symbol',id:'en-0677-bff39ce92c9e',frame:57},{button:15,term:'Rule',id:'en-0594-2fc559859c42',frame:98}];
 assert.deepEqual(new Set(IN007_PRESENTATION.keyTerms!.entryIds),new Set(expected.map(x=>x.id)));assert.equal(IN007_PRESENTATION.keyTerms!.indexLanguage,'en');
 for(const item of expected){let calls:any[]=[];const fixture=(frame:number)=>{const runtime:any={frame,frameDomain:'sprite-98',rootFrame:6,scenario:'source-static-frame',lang:'en',seed:0,replay:0,onLessonHostRequest:(...args:any[])=>{calls.push(args);return {status:'allowed'}}};return {...runtime,state:getCourseG04L03In007FrameState(frame,runtime)}};
 const trigger={}as HTMLElement,runtime=fixture(item.frame);assert.equal(IN007_KEYTERM_BUTTONS[item.button as keyof typeof IN007_KEYTERM_BUTTONS].term,item.term);requestIn007KeyTerm(runtime,item.button,trigger,true);assert.deepEqual(calls,[[{type:'open-keyterm',entryId:item.id,sourceAnimationId:ID,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger,keyTermIndexLanguage:'en'}]]);calls=[];
 const invalid=[fixture(item.frame-1),{...runtime,entryStateSha256:'capture'},{...runtime,rootFrame:5},{...runtime,scenario:'wrong-scenario'},{...runtime,state:{...runtime.state,sourceSwfSha256:'0'.repeat(64)}},{...runtime,state:{...runtime.state,status:'blocked'}},{...runtime,state:{...runtime.state,frame:item.frame+1}}];
 for(const r of invalid)assert.equal(requestIn007KeyTerm(r,item.button,trigger,true),null);assert.equal(requestIn007KeyTerm(runtime,item.button,trigger,false),null);assert.equal(calls.length,0,'Caller true must never bypass actual snapshot/reveal admission');}
});
