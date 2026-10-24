import test from 'node:test';
import assert from 'node:assert/strict';
import {IN006_PRESENTATION} from './index';
import {boundedNarrationPlan} from '../../lesson-manual-narration';
import {audioCueMatchesContext} from '../../runtime';
import {getG4L3MainTimelineAudioCandidate} from '../../g4-l3-main-timeline-audio.generated';
import {LESSON_MANUAL_NARRATION_PCM} from '../../generated/lesson-manual-narration-pcm';
const context={frameDomain:'sprite-151',scenario:'source-static-frame',seed:0};
test('IN006 actual modern main cue admits EN and cannot override explicit ES host narration',()=>{
 const cues=IN006_PRESENTATION.sourceTimelineAudioCues!;assert.equal(cues.length,1);const cue=cues[0]!;
 assert.equal(cue.language,'en');assert.equal(cue.spokenLanguage,'undetermined');assert.equal(cue.frame,4);assert.equal(cue.endFrame,1055);
 assert.equal(audioCueMatchesContext(cue,{...context,lang:'en'}),true);assert.equal(audioCueMatchesContext(cue,{...context,lang:'es'}),false);
 const en=boundedNarrationPlan(cues,{firstFrame:1,endFrameExclusive:1054},12,{...context,lang:'en'});assert(en);assert.equal(en.parts.length,1);assert.equal(en.parts[0]!.offsetSeconds,0);assert.equal(en.parts[0]!.durationSeconds,87.5);assert.equal(en.parts[0]!.pcm!.sha256,'38b5f9064bff3218b3bd9ded1c5219248070f1e36b8a2449edae704c4e5b0b42');
 assert.equal(boundedNarrationPlan(cues,{firstFrame:1,endFrameExclusive:1054},12,{...context,lang:'es'}),null);
});
test('IN006 exact existing Spanish user track and shared child PCM remain independently routed',()=>{
 const candidate=getG4L3MainTimelineAudioCandidate('course-g04-l03-in-006')!;assert(candidate);const es=candidate.audioTracks.find(t=>t.language==='es')!;assert(es);
 assert.equal(es.source,'/flash-assets/courses/course-g04-l03-in-006/audio/spanish-host-narration.mp3');assert.equal(es.sha256,'93479131bd93642f59ac7999b6c0f8a03c9fee2cadda96989a4a0591d522f03c');assert.equal(es.activation,'user');assert.deepEqual(es.visibleWhen,['es']);assert.deepEqual(es.frameDomains,['sprite-151']);assert.equal(es.timelineBehavior,'pause-while-playing');
 const pcm=LESSON_MANUAL_NARRATION_PCM[es.sha256!]!;assert.equal(pcm.sha256,'497de578bd3dc7efc72ef22964150481dba7b515bf2a44bf18daffa96d0ec381');assert.equal(pcm.sampleRate,48000);assert.equal(pcm.frames,1860480);
 const audio=IN006_PRESENTATION.activityTimelines!.filter(a=>a.audio);assert.equal(audio.length,7);for(const a of audio){assert.equal(a.audio!.language,'shared');assert.equal(a.audio!.spokenLanguage,'undetermined')}
});
