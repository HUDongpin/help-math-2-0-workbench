import type {LessonTextBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {P034_FRAME_DATA as DATA} from './generated/nms-l02-p034-frame-data-v1';
import {p034Teaching,p034Readable,p034Digits} from './nms-l02-p034-teaching-v1';
import type {P034FrameState} from './nms-l02-p034-frame-v1';
const ids=(ns:readonly number[])=>ns.map(n=>'character-'+n);
export const P034_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p034-native-source-v1',animationId:DATA.animationId,placementId:DATA.animationId,sourceSwfSha256:DATA.sourceSha256,template:'exercise',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[110],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[110],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'instruction-152',sourceTextIds:ids([152]),role:'body',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 {id:'instruction-154',sourceTextIds:ids([154]),role:'body',language:'en',readingOrder:3,valueSource:'maintained-page-state'},
 {id:'decimal-value',sourceTextIds:ids([116,127,128,130,132,134,136,138,140,142,144,169,170]),sourceShapeIds:[113],role:'label',language:'en',readingOrder:4,valueSource:'maintained-page-state'},
 {id:'reset',sourceTextIds:ids([163]),role:'label',language:'en',readingOrder:5,valueSource:'maintained-page-state'},
]as const)});
export function p034TextValues(s:P034FrameState){
 const visible=!s.component&&s.mainFrame!==null,t=p034Teaching(s.state),digits=p034Digits(s.state),number=(digits[0]??'')+(t.gridAlpha>0?'.':'')+digits.slice(1).map(v=>v??'').join('');
 const first=p034Readable(t.runs.filter(r=>r.sourceTextId.startsWith('character-152/'))),second=p034Readable(t.runs.filter(r=>r.sourceTextId.startsWith('character-154/')));
 return {'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible},'activity-title':{text:'Instruction',visible},'instruction-152':{text:first,visible:visible&&first.length>0},'instruction-154':{text:second,visible:visible&&second.length>0},'decimal-value':{text:number,visible:visible&&number.length>0},reset:{text:'Reset',visible:visible&&(s.mainFrame??1)>=395}};
}
export function p034TextSnapshot(s:P034FrameState){return buildLessonTextSnapshot(P034_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},p034TextValues(s));}
