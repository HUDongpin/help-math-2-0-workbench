import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {P038_TEACHING_SOURCE as SOURCE} from './generated/nms-l02-p038-teaching-source-v1';
import {p038Teaching} from './nms-l02-p038-teaching-v1';
import type {P038FrameState} from './nms-l02-p038-frame-v1';
export const P038_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p038-native-source-v1',animationId:SOURCE.animationId,placementId:SOURCE.animationId,sourceSwfSha256:SOURCE.sourceSha256,template:'explanation',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[2],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[2],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'instruction',sourceTextIds:['character-7','character-10','character-13'],role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'fraction-equation',sourceTextIds:['character-91','character-92','character-93'],sourceShapeIds:[90],role:'label',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 {id:'decimal-equation',sourceTextIds:['character-96'],role:'label',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
]as const)});
export function p038TextSnapshot(s:P038FrameState){const t=p038Teaching(s.state.mainFrame),visible=s.mainFrame!==null,instruction=t.runs.map((r,i)=>(i===3&&r.text?' ':'')+r.text).join('');return buildLessonTextSnapshot(P038_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},{
 'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible},'activity-title':{text:'Instruction',visible},
 instruction:{text:instruction,visible:visible&&instruction.trim().length>0},
 'fraction-equation':{text:'75% = 75/100',visible:visible&&t.fractionAlpha>0},'decimal-equation':{text:'= 0.75',visible:visible&&t.decimalAlpha>0},
 });}
