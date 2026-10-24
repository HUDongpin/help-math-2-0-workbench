import {P013_IR as IR} from './generated/nms-l02-p013-source-ir-v1';
import {P013_ID,p013Teaching,P013_WRONG_TEXT} from './nms-l02-p013-timeline-v1';
import type {P013FrameState} from './nms-l02-p013-frame-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
const componentIds=[25,29,32,33,35,36,38,60,93,102,104,106,110,113,114,115,116,117,119,120,121,122];
export const P013_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p013-native-source-v1',animationId:P013_ID,placementId:P013_ID,sourceSwfSha256:IR.sourceSha256,template:'exercise',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:['character-25'],sourceShapeIds:[26],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'question',sourceTextIds:['character-29','character-35','character-36'],role:'question',language:'en',readingOrder:1,valueSource:'maintained-page-state'},
 {id:'instruction',sourceTextIds:['character-32','character-33'],role:'body',language:'en',readingOrder:2,valueSource:'source-static'},
 ...[1,2,3,4,5,6].map(id=>({id:'piece-'+id,sourceTextIds:['character-35','character-38'],role:'answer' as const,language:'en' as const,readingOrder:2+id,valueSource:'maintained-page-state' as const})),
 {id:'placed-values',sourceTextIds:['character-35','character-38'],role:'body',language:'en',readingOrder:9,valueSource:'maintained-page-state'},
 {id:'three-sixths',sourceTextIds:['character-113','character-114','character-115','character-116'],role:'body',language:'en',readingOrder:10,valueSource:'maintained-page-state'},
 {id:'equals',sourceTextIds:['character-117'],role:'body',language:'en',readingOrder:11,valueSource:'maintained-page-state'},
 {id:'one-half',sourceTextIds:['character-119','character-120','character-121','character-122'],role:'body',language:'en',readingOrder:12,valueSource:'maintained-page-state'},
 {id:'correct',sourceTextIds:['character-110'],role:'feedback',language:'en',readingOrder:13,valueSource:'maintained-page-state'},
 {id:'wrong',sourceTextIds:['character-102'],role:'feedback',language:'en',readingOrder:14,valueSource:'maintained-page-state'},
 {id:'close',sourceTextIds:['character-93'],role:'label',language:'en',readingOrder:15,valueSource:'maintained-page-state'},
 ...componentIds.map((id,index)=>({id:'component-'+id,sourceTextIds:['character-'+id],role:'label' as const,language:'en' as const,readingOrder:16+index,valueSource:'maintained-page-state' as const})),
] as const)});
export function p013TextValues(s:P013FrameState) {
 const t=p013Teaching(s.session),page=!s.component&&s.mainFrame!==null;
 const v:Record<string,{text:string;visible:boolean}>={
 'course-title':{text:'Fractions, Decimals, and Percents Concepts: Vocabulary',visible:page},question:{text:'Find an equivalent fraction for 1/2.',visible:page&&t.promptOpacity>0},instruction:{text:'Drag and drop the sixths of the circle on the right to the circle on the left until you make a fraction that equals one-half.',visible:page&&t.promptOpacity>0},
 'placed-values':{text:s.session.used.map(()=>'1/6').join(' + '),visible:page&&s.session.used.length>0},'three-sixths':{text:'3/6',visible:page&&t.threeSixthsOpacity>0},equals:{text:'=',visible:page&&t.equalsOpacity>0},'one-half':{text:'1/2',visible:page&&t.halfOpacity>0},correct:{text:'correct!!!',visible:page&&s.session.correctFrame!==null},wrong:{text:P013_WRONG_TEXT,visible:page&&s.session.wrongOpen},close:{text:'Close',visible:page&&s.session.wrongOpen}};
 for(let id=1;id<=6;id++)v['piece-'+id]={text:'1/6',visible:page&&t.circlesOpacity>0};
 for(const id of componentIds){const def=IR.texts[id],nodes=s.nodes.filter(n=>n.characterId===id),visible=s.component&&nodes.some(n=>n.color[3]>0&&Math.abs(n.matrix[0]*n.matrix[3]-n.matrix[1]*n.matrix[2])>1e-8);v['component-'+id]={text:id===102?P013_WRONG_TEXT:def?.runs.map(r=>r.text).join('')??'',visible};}
 return v;
}
export function p013TextSnapshot(s:P013FrameState) {
 const snapshot=buildLessonTextSnapshot(P013_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},p013TextValues(s));
 return Object.freeze({...snapshot,suppressedInstances:Object.freeze(s.nodes.filter(n=>Object.hasOwn(IR.texts,String(n.characterId))||n.characterId===26).map(n=>{
  const segments:LessonTextInstanceSegment[]=[];let timelineId=s.frameDomain;for(const m of n.instancePath.matchAll(/\/d(\d+)g(\d+)c(\d+)/gu)){segments.push({timelineId,depth:Number(m[1]),generation:Number(m[2]),characterId:Number(m[3])});timelineId='sprite-'+m[3];}return Object.freeze({id:lessonTextInstanceId(segments),path:Object.freeze(segments)});
 }))});
}
