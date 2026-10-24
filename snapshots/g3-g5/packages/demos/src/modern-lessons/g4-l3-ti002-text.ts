import type{AnimationRendererProps}from'../contract';
import type{LessonTextBinding,LessonTextBlockBinding,LessonTextRole,TextPresentationSnapshot}from'../lesson-text-contract';
import type{CourseG04L03Ti002KeyTermDragState as State}from'../timelines/course-g04-l03-ti-002-key-term-drag-interaction';
import{ti002SourceBlockers}from'./g4-l3-ti002-source-context';
import{ti002RewardTextVisible,TI002_REWARDS}from'./g4-l3-ti002-reward';
import source from'./generated/g4-l3-ti002-native-inputs.json';
const baseIds=[54,59,56,61,62,63,64,65,66,67,68,69,71,76,79,83,87,200,250,224,211,266];
const text=(id:number)=>source.texts.find(t=>t.characterId===id)!;
const blocks:LessonTextBlockBinding[]=[];
const add=(id:string,sourceTextIds:readonly string[],role:LessonTextRole,sourceShapeIds?:readonly number[])=>blocks.push({id,sourceTextIds,role,readingOrder:blocks.length,language:'en',valueSource:'maintained-page-state',...(sourceShapeIds?{sourceShapeIds}:{})});
// Authored reward phases reuse the same word with different glyph definitions.
const rewardTextVariants:Readonly<Record<number,readonly number[]>>={200:[200,201],250:[250,251],224:[224,225,229],211:[211,212]};
for(const id of baseIds){
 const variants=(rewardTextVariants[id]??[id]).map(text);
 if(variants.some(t=>t.text!==text(id).text))throw new Error('TI002 reward text variant mismatch');
 add(`text-${id}`,variants.flatMap(t=>t.runs.map(r=>r.sourceTextId)),id===54?'heading':id===56?'question':id>=200?'feedback':[65,66,67,68,69].includes(id)?'answer':'label');
}
add('wrong-close',text(148).runs.map(r=>r.sourceTextId),'label');add('picture-close',text(148).runs.map(r=>r.sourceTextId),'label');
for(const scope of['inline','popup'])for(const diagram of source.signedPictureLabels.diagrams){
 if(scope==='inline'){
  const inline=source.inlineSignedPictureLabels.diagrams.find(d=>d.timelineId===diagram.timelineId)!;
  for(const label of inline.labels)add(`inline-${diagram.timelineId}-${label.signedValue}`,label.sourceTextIds,'label',label.sourceShapeIds.length?label.sourceShapeIds:undefined);
 }else for(const label of diagram.labels){
  const outlined='sourceShapeId'in label;
  add(`popup-${diagram.timelineId}-${label.signedValue}`,outlined?[]:label.sourceTextIds!,'label',outlined?[label.sourceShapeId!]:label.sign?[label.sign.characterId]:undefined);
 }
}
export const TI002_BINDING:LessonTextBinding={schemaVersion:1,version:'g04-l03-placement-024-native-v1',placementId:'g04-l03-placement-024',animationId:'course-g04-l03-ti-002',sourceSwfSha256:source.sourceSwfSha256,template:'exercise',blocks};
const rewardText:Record<string,number>={'ti002-correct-1':200,'ti002-correct-2':250,'ti002-correct-3':224,'ti002-correct-4':211};
export function getTi002TextSnapshot(state:unknown,runtime:AnimationRendererProps,interaction?:State,ui:{pictureButtonId?:number;rewardActivityId?:string;rewardFrame?:number}={}):TextPresentationSnapshot{
 const blockers=[...ti002SourceBlockers(state,runtime)];
 if(runtime.frame>=238&&!interaction)blockers.push('interaction-state-required');
 if(runtime.frame>238&&interaction?.outcome!=='complete')blockers.push('completed-interaction-required');
 if(interaction?.outcome==='correct-feedback'&&(!rewardText[ui.rewardActivityId??'']||!Number.isInteger(ui.rewardFrame)||ui.rewardFrame!<2||ui.rewardFrame!>TI002_REWARDS[ui.rewardActivityId as keyof typeof TI002_REWARDS]?.end))blockers.push('feedback-source-state-required');
 const intro=runtime.frame<238&&!blockers.length?source.intro.frameIndices[runtime.frame-1].map(i=>source.intro.placementPool[i]):[];
 if(ui.pictureButtonId!==undefined&&!source.pictureEntrypoints.some(p=>p.sourceButtonId===ui.pictureButtonId))blockers.push('unknown-picture-source');
 const picture=source.pictureEntrypoints.find(p=>p.sourceButtonId===ui.pictureButtonId);
 const visibleText=(id:number)=>{
  if(id===54)return true;
  if(runtime.frame<238){if([200,250,224,211,266].includes(id))return false;return intro.some(p=>p.characterId===id&&p.opacity>0);}
  if(id===266)return interaction?.outcome==='wrong';
  if(id>=200)return interaction?.outcome==='correct-feedback'&&rewardText[ui.rewardActivityId??'']===id&&ti002RewardTextVisible(ui.rewardActivityId as keyof typeof TI002_REWARDS,ui.rewardFrame!);
  return true; // Placed terms retain the same source text after leaving the bank.
 };
 return {schemaVersion:1,animationId:TI002_BINDING.animationId,bindingVersion:TI002_BINDING.version,sourceSwfSha256:TI002_BINDING.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,identity:{frame:runtime.frame,frameDomain:runtime.frameDomain??'sprite-272',rootFrame:runtime.rootFrame??6,scenario:runtime.scenario,language:runtime.lang,seed:runtime.seed,replay:runtime.replay??0},suppressedInstances:[],blocks:blockers.length?[]:blocks.map(b=>{
  let value='',visible=false;
  if(b.id.startsWith('text-')){const id=Number(b.id.slice(5));value=text(id).text;visible=visibleText(id);}
  else if(b.id.endsWith('close')){value=text(148).text;visible=b.id==='wrong-close'?interaction?.outcome==='wrong':!!picture;}
  else{const match=/^(inline|popup)-(sprite-\d+)-(-?\d+)$/.exec(b.id)!;const n=Number(match[3]);value=n<0?`−${-n}`:n>0?`+${n}`:'0';visible=match[1]==='popup'?picture?.timelineId===match[2]:runtime.frame>=238||intro.some(p=>p.characterId===61&&p.opacity>0);}
  return {id:b.id,text:value,visible:!!visible,role:b.role,language:b.language,readingOrder:b.readingOrder};
 })};
}
