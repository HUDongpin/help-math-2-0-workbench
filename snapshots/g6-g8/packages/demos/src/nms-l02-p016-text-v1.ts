import {P016_IR as IR} from './generated/nms-l02-p016-source-ir-v1';
import {P016_ID,P016_FEEDBACK} from './nms-l02-p016-state-v1';
import {p016Teaching} from './nms-l02-p016-teaching-v1';
import type {P016FrameState} from './nms-l02-p016-frame-v1';
import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
export const P016_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p016-native-source-v1',animationId:P016_ID,placementId:P016_ID,sourceSwfSha256:IR.sourceSha256,template:'exercise',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:['character-110'],sourceShapeIds:[111],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'question',sourceTextIds:['character-125','character-137','character-139','character-140','character-144'],sourceShapeIds:[100],role:'question',language:'en',readingOrder:1,valueSource:'maintained-page-state'},
 {id:'answer-tens',sourceTextIds:['character-141','character-161'],role:'answer',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'answer-ones',sourceTextIds:['character-142','character-162'],role:'answer',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 {id:'reset',sourceTextIds:['character-155'],role:'label',language:'en',readingOrder:4,valueSource:'source-static'},
 {id:'done',sourceTextIds:['character-118'],role:'label',language:'en',readingOrder:5,valueSource:'source-static'},
 {id:'feedback',sourceTextIds:['character-178','character-185'],role:'feedback',language:'en',readingOrder:6,valueSource:'maintained-page-state'},
 {id:'close',sourceTextIds:['character-170'],role:'label',language:'en',readingOrder:7,valueSource:'maintained-page-state'},
 {id:'conclusion',sourceTextIds:['character-191'],role:'body',language:'en',readingOrder:8,valueSource:'maintained-page-state'},
]as const)});
export function p016TextValues(s:P016FrameState){
 const t=p016Teaching(s.session),page=!s.component&&s.mainFrame!==null;
 const correct=s.session.feedback==='correct',wrong=s.session.feedback==='wrong',feedback=(page&&(correct||wrong))||(s.domain==='186'&&s.frame>=2)||(s.domain==='179'&&s.frame>=2);
 const fraction=t.numerator||t.denominator?`${t.numerator}/${t.denominator}`:'',question=t.prompt1.join('')+t.prompt2[0]+fraction+t.prompt2[1]+(t.prompt3?' '+t.prompt3:'');
 return {'course-title':{text:'Fractions, Decimals, and Percents Concepts: Vocabulary',visible:page},
  question:{text:question,visible:page&&!t.final&&!!question.trim()},
  'answer-tens':{text:t.demo?t.demoDigits[0]:s.session.digits[0],visible:page&&!t.final&&!!(t.demo?t.demoDigits[0]:s.session.digits[0])},
  'answer-ones':{text:t.demo?t.demoDigits[1]:s.session.digits[1],visible:page&&!t.final&&!!(t.demo?t.demoDigits[1]:s.session.digits[1])},
  reset:{text:'Reset',visible:page&&!t.final&&t.gridAlpha>0},done:{text:'Done',visible:page&&!t.final&&t.gridAlpha>0},
  feedback:{text:correct||s.domain==='186'?P016_FEEDBACK.correct:P016_FEEDBACK[s.session.wrongKind??'neither'],visible:feedback},
  close:{text:'Close',visible:feedback},conclusion:{text:'The grid is 25% shaded.',visible:page&&t.final}};
}
export function p016TextSnapshot(s:P016FrameState){
 const snapshot=buildLessonTextSnapshot(P016_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},p016TextValues(s));
 // All source text is replaced in native presentation; suppression is per placed instance.
 return Object.freeze({...snapshot,suppressedInstances:Object.freeze(s.poses.filter(p=>Object.hasOwn(IR.texts,String(p.characterId))||[100,111].includes(p.characterId)).map(p=>{const path=Object.freeze([{timelineId:s.frameDomain,depth:p.depth,generation:p.generation,characterId:p.characterId}]);return Object.freeze({id:lessonTextInstanceId(path),path});}))});
}
