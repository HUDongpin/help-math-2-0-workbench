import {P010_IR as IR} from './generated/nms-l02-p010-source-ir-v1';
import {P010_ART as ART} from './generated/nms-l02-p010-art-ir-v1';
import {P010_ID,P010_GLYPHS,p010Teaching,p010Feedback,p010FeedbackTitleVisible,p010WrongExplanation} from './nms-l02-p010-timeline-v1';
import type {P010FrameState} from './nms-l02-p010-frame-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
export const P010_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p010-native-source-v1',animationId:P010_ID,placementId:P010_ID,sourceSwfSha256:IR.sourceSha256,template:'exercise',blocks:Object.freeze([
{id:'course-title',sourceTextIds:['character-2/run-0'],sourceShapeIds:[3],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
{id:'question',sourceTextIds:['character-16','character-20'],role:'question',language:'en',readingOrder:1,valueSource:'maintained-page-state'},
...[11,12,10,10,13,9,8,14].map((id,i)=>({id:'answer-'+i,sourceTextIds:['character-'+id],role:'answer' as const,language:'en' as const,readingOrder:i+2,valueSource:'maintained-page-state' as const})),
{id:'feedback-title',sourceTextIds:[31,32,35,57,73,123,124,138,139,149,150,173,174].map(id=>'character-'+id),sourceShapeIds:[55,78,79,86],role:'feedback',language:'en',readingOrder:10,valueSource:'maintained-page-state'},
{id:'explanation',sourceTextIds:[47,62,89].map(id=>'character-'+id),role:'feedback',language:'en',readingOrder:11,valueSource:'maintained-page-state'},
{id:'close',sourceTextIds:['character-40'],role:'label',language:'en',readingOrder:12,valueSource:'maintained-page-state'},
]as const)});
export function p010TextValues(s:P010FrameState){const t=p010Teaching(s.session),b=p010Feedback(s.session),page=!s.component&&s.mainFrame!==null,component=s.component,ids=new Set(s.nodes.filter(n=>n.color[3]>0&&Math.abs(n.matrix[0]*n.matrix[3]-n.matrix[1]*n.matrix[2])>1e-8).map(n=>n.characterId)),popup=component?['48','63','90'].includes(s.domain):!!b&&'popup'in b&&s.frame>=b.popup&&s.session.phase!=='wrong-out';const v:Record<string,{text:string;visible:boolean}>={
 'course-title':{text:'Fractions, Decimals, and Percents Concepts: Vocabulary',visible:page||ids.has(3)},
 question:{text:'Click the decimal point.',visible:page&&t.questionVisible},
 'feedback-title':{text:component&&s.domain==='140'?'Correct!':b?.title??'',visible:component?s.domain==='140':p010FeedbackTitleVisible(s.session)},
 explanation:{text:p010WrongExplanation(s.scenario==='wrong-used'?3:0),visible:popup},close:{text:'Close',visible:popup}};
 for(let i=0;i<8;i++)v['answer-'+i]={text:P010_GLYPHS[i],visible:page&&t.numberVisible};return v;
}
export function p010TextSnapshot(s:P010FrameState){const snapshot=buildLessonTextSnapshot(P010_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},p010TextValues(s));
 return Object.freeze({...snapshot,suppressedInstances:Object.freeze(s.nodes.filter(n=>Object.hasOwn(IR.texts,String(n.characterId))||ART.suppressedShapeIds.includes(n.characterId)).map(n=>{const segments:LessonTextInstanceSegment[]=[];let timelineId=s.frameDomain;for(const m of n.instancePath.matchAll(/\/d(\d+)g(\d+)c(\d+)/gu)){segments.push({timelineId,depth:Number(m[1]),generation:Number(m[2]),characterId:Number(m[3])});timelineId='sprite-'+m[3];}return Object.freeze({id:lessonTextInstanceId(segments),path:Object.freeze(segments)});}))});
}
