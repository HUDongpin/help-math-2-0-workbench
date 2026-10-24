import type {RuntimeContext} from './contract';
import type {LessonTextBinding,LessonTextInstance,LessonTextRole,TextPresentationSnapshot} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
import {P055_ID,P055_SOURCE,p055TextSnapshot,type P055TextIr} from './nms-l02-ts-pilot-text';
import source from './generated/nms-l02-p055-native-text.json';

type NativeDefinition=Omit<P055TextIr['definitions'][number],'runs'>&{runs:Array<{sourceTextId:string;text:string;yOffsetTwips:number}>};
type NativeInstance=P055TextIr['instances'][number]&{depth:number};
type NativeIr=Omit<P055TextIr,'definitions'|'instances'>&{definitions:NativeDefinition[];instances:NativeInstance[]};
export const P055_NATIVE_TEXT_IR=source as unknown as NativeIr;
const ir=P055_NATIVE_TEXT_IR;
const roleFor=(role:string):LessonTextRole=>role==='instruction'?'body':'label';
const generationOf=(item:NativeInstance)=>{
 const match=/^sprite-26\/depth-(\d+)\/generation-(\d+)$/.exec(item.instanceId);
 if(!match||Number(match[1])!==item.depth)throw Error(`P055 instance path: ${item.instanceId}`);
 return Number(match[2]);
};
const pathFor=(item:NativeInstance):LessonTextInstance=>{
 const path=[{timelineId:'root',depth:1,generation:1,characterId:26},
  {timelineId:'sprite-26',depth:item.depth,generation:generationOf(item),characterId:item.characterId}];
 return {id:lessonTextInstanceId(path),path};
};
function makeBinding():LessonTextBinding{
 if(ir.animationId!==P055_ID||ir.sourceSwfSha256!==P055_SOURCE||ir.frameDomain!=='sprite-26'||
  ir.frameCount!==351||ir.definitions.length!==12||ir.instances.length!==18)throw Error('P055 text IR identity mismatch');
 const definitions=new Map(ir.definitions.map(d=>[d.characterId,d]));
 return {schemaVersion:1,version:'nms-l02-p055-source-native-text-v1',placementId:P055_ID,
  animationId:P055_ID,sourceSwfSha256:P055_SOURCE,template:'explanation',
  blocks:ir.instances.map((item,readingOrder)=>{
   const definition=definitions.get(item.characterId);
   if(!definition)throw Error(`P055 missing text definition ${item.characterId}`);
   return {id:item.instanceId,sourceTextIds:definition.runs.map(run=>run.sourceTextId),
    role:roleFor(definition.role),language:'en' as const,readingOrder,
    valueSource:'source-static' as const,instance:pathFor(item)};
  })};
}
export const nmsP055TextBinding=Object.freeze(makeBinding());
export interface P055NativeTextSnapshot extends TextPresentationSnapshot {
 readonly sourceSuppressionInstanceIds:readonly string[];
 readonly rows:readonly Readonly<{instanceId:string;characterId:number;role:string;text:string;alpha:number;visible:boolean}>[];
 readonly sourceLanguage:'en';
 readonly retainedDynamicFieldCharacterIds:readonly [11];
}
/** One pure source-frame projection for DOM visibility and exact Canvas suppression. */
export function nmsP055TextSnapshot(context:RuntimeContext):P055NativeTextSnapshot{
 const valid=Number.isSafeInteger(context.frame)&&context.frame>=1&&context.frame<=351&&
  context.frameDomain==='sprite-26'&&context.rootFrame===6&&context.scenario==='source-static-frame'&&
  context.lang==='en'&&context.seed===0&&Number.isSafeInteger(context.replay??0)&&
  (context.replay??0)>=0;
 const raw=valid?p055TextSnapshot(ir,context.frame):null;
 const byId=new Map(raw?.text.map(row=>[row.instanceId,row])??[]);
 const values=Object.fromEntries(ir.instances.map(item=>[item.instanceId,{
  text:byId.get(item.instanceId)?.text??'',visible:byId.get(item.instanceId)?.visible??false,
 }]));
 const base=buildLessonTextSnapshot(nmsP055TextBinding,context,values);
 if(!valid||base.status!=='ready')return {...base,status:'blocked',blocks:[],suppressedInstances:[],
  blockers:[...base.blockers,...(!valid?['unsupported-p055-source-context']:[])],
  sourceSuppressionInstanceIds:[],rows:[],sourceLanguage:'en',retainedDynamicFieldCharacterIds:[11]};
 const active=new Set(raw!.suppressionIds);
 return {...base,suppressedInstances:base.suppressedInstances.filter(instance=>
   ir.instances.some(item=>active.has(item.instanceId)&&pathFor(item).id===instance.id)),
  sourceSuppressionInstanceIds:raw!.suppressionIds,rows:raw!.text,
  sourceLanguage:'en',retainedDynamicFieldCharacterIds:[11]};
}
