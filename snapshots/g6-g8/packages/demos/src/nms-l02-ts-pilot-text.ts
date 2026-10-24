import type {SourceGlossaryControlPage} from './source-glossary-controls';

export const P055_ID='shared-nms002-l02-p055';
export const P055_SOURCE='8581db0c66f2b9640eb8ea244e22ec6831d0cb98d1fd9b3fb60b15bcc745758e';
export interface P055TextIr {
 schemaVersion:number;kind:string;animationId:string;sourceSwfSha256:string;frameDomain:string;frameCount:number;
 definitions:Array<{characterId:number;role:string;runs:Array<{text:string;yOffsetTwips:number}>}>;
 instances:Array<{instanceId:string;characterId:number;firstFrame:number;lastFrameExclusive:number;
  poseSegments:Array<{firstFrame:number;lastFrameExclusive:number;pose:{visible:boolean;
   colorTransform:{multiply:number[];add:number[];divisor:number}}}>}>;
}
export function p055TextSnapshot(ir:P055TextIr,frame:number){
 if(ir.schemaVersion!==1||ir.kind!=='nms-l02-ts-p055-source-static-text-v1'||
  ir.animationId!==P055_ID||ir.sourceSwfSha256!==P055_SOURCE||ir.frameDomain!=='sprite-26'||ir.frameCount!==351||
  !Number.isSafeInteger(frame)||frame<1||frame>351)throw Error('P055_TEXT_CONTEXT');
 const active=ir.instances.filter(x=>frame>=x.firstFrame&&frame<x.lastFrameExclusive);
 const text=active.map(instance=>{
  const definition=ir.definitions.find(x=>x.characterId===instance.characterId);
  const poses=instance.poseSegments.filter(x=>frame>=x.firstFrame&&frame<x.lastFrameExclusive);
  if(!definition||poses.length!==1)throw Error('P055_TEXT_POSE');
  const pose=poses[0]!.pose,ct=pose.colorTransform;
  const alpha=Math.max(0,Math.min(1,ct.multiply[3]!/ct.divisor+ct.add[3]!/255));
  if(!Number.isFinite(alpha))throw Error('P055_TEXT_ALPHA');
  let previousY:number|undefined;
  const value=definition.runs.map(run=>{const separator=previousY!==undefined&&previousY!==run.yOffsetTwips?'\n':'';
   previousY=run.yOffsetTwips;return separator+run.text;}).join('');
  return {instanceId:instance.instanceId,characterId:instance.characterId,role:definition.role,
   text:value,alpha,visible:pose.visible&&alpha>0};
 });
 return {frame,suppressionIds:active.map(x=>x.instanceId),text};
}
export const P055_CONTROLS:SourceGlossaryControlPage={animationId:P055_ID,sourceSha256:P055_SOURCE,
 frameDomain:'sprite-26',frameCount:351,controls:[
  {id:'sprite-26/depth-11/generation-1',characterId:15,firstFrame:84,lastFrameExclusive:352,entryId:'Restate',sourceKeyAttribute:'Restate',label:'Restate'},
  {id:'sprite-26/depth-13/generation-1',characterId:16,firstFrame:84,lastFrameExclusive:352,entryId:'Question',sourceKeyAttribute:'Question',label:'Question'},
  {id:'sprite-26/depth-18/generation-1',characterId:22,firstFrame:145,lastFrameExclusive:352,entryId:'Problem',sourceKeyAttribute:'Problem',label:'Problem'},
 ]};
