import {P024_IR as IR} from './generated/nms-l02-p024-source-ir-v1';
import type {P024FrameState} from './nms-l02-p024-frame-v1';
import {p024Teaching} from './nms-l02-p024-timeline-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
export const P024_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p024-native-source-v1',animationId:'shared-nms002-l02-p024',placementId:'shared-nms002-l02-p024',sourceSwfSha256:IR.sourceSha256,template:'exercise',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'instruction',sourceTextIds:['character-60','character-68'],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'zero',sourceTextIds:['character-5'],role:'body',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 {id:'one',sourceTextIds:['character-6'],role:'body',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
 {id:'correct',sourceTextIds:['character-76'],role:'feedback',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
 {id:'wrong',sourceTextIds:['character-89','character-91','character-92'],sourceShapeIds:[90],role:'body',language:'en',readingOrder:6,valueSource:'maintained-page-state'},
 {id:'close',sourceTextIds:['character-82'],role:'label',language:'en',readingOrder:7,valueSource:'maintained-page-state'},
]as const)});
export function p024TextSnapshot(s:P024FrameState){const t=p024Teaching(s.session),page=!s.component,wrong=t.wrong&&(page||s.domain==='93'),correct=t.correct&&(page||s.domain==='77')&&s.session.localFrame>=2;const text=t.row.first.concat(t.row.second).map(r=>r.text).join(''),values={'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:page},'activity-title':{text:'Instruction',visible:page},instruction:{text,visible:page&&text.length>0},zero:{text:'0',visible:page&&t.row.axisAlpha>0},one:{text:'1',visible:page&&t.row.axisAlpha>0},correct:{text:'Correct!!!',visible:correct},wrong:{text:'Divide the number line into four equal parts. 1/4 is one of four equal parts. Try again.',visible:wrong},close:{text:'Close',visible:wrong}};const snapshot=buildLessonTextSnapshot(P024_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},values);return Object.freeze({...snapshot,suppressedInstances:Object.freeze(s.nodes.filter(n=>Object.hasOwn(IR.texts,String(n.characterId))||[1,90].includes(n.characterId)).map(n=>{const path:LessonTextInstanceSegment[]=[];let timelineId=s.frameDomain;for(const m of n.instancePath.matchAll(/\/d(\d+)g(\d+)c(\d+)/gu)){path.push({timelineId,depth:Number(m[1]),generation:Number(m[2]),characterId:Number(m[3])});timelineId='sprite-'+m[3];}return Object.freeze({id:lessonTextInstanceId(path),path:Object.freeze(path)});} ))});}
