import type{LessonTextBinding,LessonTextBlockBinding}from'./lesson-text-contract';
import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{P040_SOURCE}from'./generated/nms-l02-p040-presentation-v1';
import{P040_EQUATION_TEXT}from'./generated/nms-l02-p040-equation-text-v1';
import{p040InstructionAt}from'./nms-l02-p040-instruction-v1';
import{p040EquationAt}from'./nms-l02-p040-state-v1';
import type{P040FrameState}from'./nms-l02-p040-frame-v1';
const block=(id:string,sourceTextIds:readonly string[],role:LessonTextBlockBinding['role'],readingOrder:number,sourceShapeIds:readonly number[]=[]):LessonTextBlockBinding=>Object.freeze({id,sourceTextIds,sourceShapeIds,role,readingOrder,language:'en',valueSource:'maintained-page-state'});
// White overlay characters38..40 are visual emphasis, not additional teaching text.
export const P040_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p040-native-source-v1',animationId:'shared-nms002-l02-p040',placementId:'shared-nms002-l02-p040',sourceSwfSha256:P040_SOURCE.sourceSha256,template:'explanation',blocks:Object.freeze([
 block('course-title',[],'heading',0,[21]),block('activity-title',[],'title',1,[21]),block('instruction',['character-27'],'body',2),block('grid-caption',['character-23','character-24'],'label',3),
 ...P040_EQUATION_TEXT.filter(t=>![38,39,40].includes(t.characterId)).map((t,i)=>block('equation-'+t.characterId,['character-'+t.characterId],'label',4+i)),
])});
export function p040TextValues(s:P040FrameState){
 const visible=s.mainFrame!==null,frame=s.mainFrame??1,pose=p040EquationAt(frame),instruction=p040InstructionAt(frame).map(g=>g.visible?g.text:' ').join('').trim();
 const values:Record<string,{text:string;visible:boolean}>={
  'course-title':{text:P040_SOURCE.heading.courseHeading,visible},'activity-title':{text:P040_SOURCE.heading.activityHeading,visible},instruction:{text:instruction,visible:visible&&instruction.length>0},'grid-caption':{text:'40% of the figure is shaded.',visible},
 };
 for(const t of P040_EQUATION_TEXT){if([38,39,40].includes(t.characterId))continue;values['equation-'+t.characterId]={text:t.text,visible:visible&&pose.some(p=>p.characterId===t.characterId&&p.alpha>0)};}
 return values;
}
export function p040TextSnapshot(s:P040FrameState){return buildLessonTextSnapshot(P040_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},p040TextValues(s));}
