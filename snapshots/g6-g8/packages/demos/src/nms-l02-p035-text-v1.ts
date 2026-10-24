import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {P035_FRAME_DATA as DATA} from './generated/nms-l02-p035-frame-data-v1';
import {p035Teaching,p035Readable,p035Equation} from './nms-l02-p035-teaching-v1';
import type {P035FrameState} from './nms-l02-p035-frame-v1';
const ids=(ns:readonly number[])=>ns.map(n=>'character-'+n);
export const P035_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p035-native-source-v1',animationId:DATA.animationId,placementId:DATA.animationId,sourceSwfSha256:DATA.sourceSha256,template:'explanation',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[8],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[8],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'page-title',sourceTextIds:ids([11]),role:'title',language:'en',readingOrder:2,valueSource:'source-static'},
 {id:'definition',sourceTextIds:ids([11]),role:'body',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 {id:'left-equation',sourceTextIds:ids([16,17,20,21,22,23]),sourceShapeIds:[15,19],role:'label',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
 {id:'right-equation',sourceTextIds:ids([16,17,20,23,26,31,32,33,44,45]),sourceShapeIds:[25,28,30,36,37,38,41,42,43],role:'label',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
]as const)});
export function p035TextValues(s:P035FrameState){
 const visible=s.mainFrame!==null,t=p035Teaching(s.state.mainFrame),definition=p035Readable(t.runs),left=p035Equation(t.left),right=p035Equation(t.right);
 return {'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible},'activity-title':{text:'Instruction',visible},'page-title':{text:'Equivalent Decimals',visible},definition:{text:definition,visible:visible&&definition.length>0},'left-equation':{text:left,visible:visible&&left.length>0},'right-equation':{text:right,visible:visible&&right.length>0}};
}
export function p035TextSnapshot(s:P035FrameState){return buildLessonTextSnapshot(P035_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},p035TextValues(s));}
