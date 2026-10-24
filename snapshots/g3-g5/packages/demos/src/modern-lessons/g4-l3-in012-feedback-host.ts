import type {LessonTextActivityDefinition} from '../lesson-text-contract';
import audio from './generated/g4-l3-in012-feedback-audio.json';
import source from './generated/g4-l3-in012-native-inputs.json';
const main = source.timelines.find(t => t.timelineId === 'sprite-228')!;
const lifetime = (instance: string) => ({firstFrame:174,lastFrameExclusive:main.events.find(e => e.kind==='remove' && e.instanceId===instance)?.frame ?? 216});
const stream = (id: number) => audio.streams.find(s => s.characterId===id)!;
const activity = (cid: number,id: string,startFrame: number,endFrame: number): LessonTextActivityDefinition => {
 const s=stream(cid);
 return {id,sourceInstanceId:s.sourceInstanceId,parentLifetime:lifetime(cid===219?stream(223).sourceInstanceId:s.sourceInstanceId),frameDomain:s.frameDomain,startFrame,endFrame,fps:12,parentFrames:[174],
 ...(cid===219?{buttonPress:{sourceButtonId:220}}:{}),
 audio:{source:s.source,sha256:s.sha256,language:'shared',spokenLanguage:'undetermined',firstFrame:s.firstBlockFrame,lastFrame:s.lastBlockFrame,offsetSeconds:s.latencySeekSamples/s.sampleRate}};
};
const finalInstance=main.events.find(e=>e.kind==='place'&&e.characterId===227&&e.frame===174)!.instanceId!;
/** Prepared host-clock activities. Wrong seek is an explicit modern continuous
 * frame1-origin offset at startFrame2, NOT established original Flash seek parity.
 * Final feedback is silent: this source has no local stream/StartSound.
 */
export const IN012_FEEDBACK_ACTIVITIES: readonly LessonTextActivityDefinition[] = [
 activity(37,'in012-correct-coach',2,20),activity(223,'in012-wrong-popup',2,15),
 {id:'in012-final-feedback',sourceInstanceId:finalInstance,parentLifetime:lifetime(finalInstance),frameDomain:'sprite-227',startFrame:2,endFrame:25,fps:12,parentFrames:[174]},
 activity(219,'in012-close-down',1,5),
];
