import type{LessonTextActivityDefinition}from'../lesson-text-contract';
import source from'./generated/g4-l3-ti002-native-inputs.json';
import audio from'./generated/g4-l3-ti002-feedback-audio.json';
const main=source.timelines.find(t=>t.timelineId==='sprite-272')!;
const instance=(cid:number)=>{const row=main.events.find(e=>e.kind==='place'&&e.characterId===cid&&e.frame===238);if(!row?.instanceId)throw Error('TI002 source instance missing');return row.instanceId;};
const lifetime=(id:string)=>({firstFrame:238,lastFrameExclusive:main.events.find(e=>e.kind==='remove'&&e.instanceId===id)?.frame??255});
function activity(cid:number,id:string,startFrame:number,endFrame:number):LessonTextActivityDefinition{
 const owner=instance(cid),stream=audio.streams.find(s=>s.spriteId===cid);
 const base={id,sourceInstanceId:owner,parentLifetime:lifetime(owner),frameDomain:`sprite-${cid}`,startFrame,endFrame,fps:12,parentFrames:[238]};
 if(!stream||stream.codec==='none')return base;
 if(!stream.source||!stream.head||!stream.blocks.length)throw Error('TI002 audio source not prepared');
 const sha256=stream.codec==='swf-adpcm'?stream.sha256:stream.payloadSha256;
 if(!sha256)throw Error('TI002 audio hash missing');
 return {...base,audio:{source:stream.source,sha256,language:'shared',spokenLanguage:'undetermined',firstFrame:stream.blocks[0].frame,lastFrame:stream.blocks.at(-1)!.frame,offsetSeconds:stream.codec==='mp3'?(stream.head.latencySeekSamples??0)/22050:0}};
}
/** Prepared activities only. Branch seek uses modern continuous PCM scheduling;
 * original Flash random audio and seek equivalence remain unverified. */
export const TI002_FEEDBACK_ACTIVITIES:readonly LessonTextActivityDefinition[]=[
 ...audio.correctRewardOrder.map((cid,i)=>activity(cid,`ti002-correct-${i+1}`,2,audio.streams.find(s=>s.spriteId===cid)!.frameCount)),
 activity(267,'ti002-wrong-popup',2,15),
 ...audio.wrongCoachBranches.map(branch=>activity(269,`ti002-wrong-coach-${branch.label.toLowerCase()}`,branch.startFrame,branch.stopFrame)),
];
const circleParent=instance(175),circlePlacement=source.timelines.find(t=>t.timelineId==='sprite-175')!.events.find(e=>e.characterId===174)!;
export const TI002_CIRCLE_ACTIVITY:LessonTextActivityDefinition={id:'ti002-picture-decrease',sourceInstanceId:`${circleParent}/${circlePlacement.instanceId}`,parentLifetime:lifetime(circleParent),frameDomain:'sprite-174',startFrame:1,endFrame:10,fps:12,parentFrames:Array.from({length:17},(_,i)=>238+i)};
