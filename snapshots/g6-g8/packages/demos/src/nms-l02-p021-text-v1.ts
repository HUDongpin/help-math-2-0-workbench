import{P021_IR as IR}from'./generated/nms-l02-p021-source-ir-v1';
import{P021_ID,P021_FEEDBACK}from'./nms-l02-p021-state-v1';
import{p021Teaching}from'./nms-l02-p021-teaching-v1';
import type{P021FrameState}from'./nms-l02-p021-frame-v1';
import type{LessonTextBinding}from'./lesson-text-contract';
import{buildLessonTextSnapshot,lessonTextInstanceId}from'./lesson-text-snapshot';
const promptIds=[38,...IR.texts.filter(t=>t.characterId>=44&&t.characterId<=102).map(t=>t.characterId)];
export const P021_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p021-native-source-v1',animationId:P021_ID,placementId:P021_ID,sourceSwfSha256:IR.sourceSha256,template:'exercise',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[14],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'instructions',sourceTextIds:promptIds.map(i=>'character-'+i),role:'body',language:'en',readingOrder:1,valueSource:'maintained-page-state'},
 {id:'target',sourceTextIds:[18,19,20,41,42,170,171,182,183,184].map(i=>'character-'+i),sourceShapeIds:[16],role:'question',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'parts',sourceTextIds:[22,112,186].map(i=>'character-'+i),role:'label',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 {id:'check',sourceTextIds:[24,27,167].map(i=>'character-'+i),role:'label',language:'en',readingOrder:4,valueSource:'source-static'},
 {id:'new',sourceTextIds:[33,36,172].map(i=>'character-'+i),role:'label',language:'en',readingOrder:5,valueSource:'source-static'},
 {id:'feedback',sourceTextIds:[568,572].map(i=>'character-'+i),role:'feedback',language:'en',readingOrder:6,valueSource:'maintained-page-state'},
 {id:'close',sourceTextIds:['character-561'],role:'label',language:'en',readingOrder:7,valueSource:'maintained-page-state'},
]as const)});
export function p021TextValues(s:P021FrameState){const t=p021Teaching(s.session),page=!s.component&&s.mainFrame!==null,feedback=s.session.feedback!=='none'&&(page||s.domain==='569'||s.domain==='573');return{'course-title':{text:'Fractions, Decimals, and Percents Concepts: Instruction',visible:page},instructions:{text:t.prompt,visible:page},target:{text:`${t.target[0]} out of ${t.target[1]} (${t.target[0]}/${t.target[1]})`,visible:page},parts:{text:`${t.parts} ${t.parts===1?'Piece':'Pieces'}`,visible:page||s.domain==='551'},check:{text:'Check Answer',visible:page},new:{text:'New Whole',visible:page},feedback:{text:s.session.feedback==='correct'?P021_FEEDBACK.correct:s.session.attempts===1?P021_FEEDBACK.first:P021_FEEDBACK.later,visible:feedback},close:{text:'Close',visible:feedback}};}
export function p021TextSnapshot(s:P021FrameState){const snap=buildLessonTextSnapshot(P021_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},p021TextValues(s));const textIds=new Set(IR.texts.map(t=>t.characterId));return Object.freeze({...snap,suppressedInstances:Object.freeze(s.poses.filter(p=>textIds.has(p.characterId)||p.characterId===14||p.characterId===16).map(p=>{const path=Object.freeze([{timelineId:s.frameDomain,depth:p.depth,generation:p.generation,characterId:p.characterId}]);return Object.freeze({id:lessonTextInstanceId(path),path});}))});}
