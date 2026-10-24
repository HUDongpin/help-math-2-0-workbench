import {P022_IR as IR} from './generated/nms-l02-p022-source-ir-v1';
import {P022_ART as ART} from './generated/nms-l02-p022-art-ir-v1';
import {P022_ID,P022_OPTIONS,p022Teaching,p022Feedback,p022FeedbackTitleVisible,p022WrongExplanation} from './nms-l02-p022-timeline-v1';
import type {P022FrameState} from './nms-l02-p022-frame-v1';
import type {LessonTextBinding,LessonTextInstanceSegment} from './lesson-text-contract';
import {buildLessonTextSnapshot,lessonTextInstanceId} from './lesson-text-snapshot';
export const P022_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p022-native-source-v1',animationId:P022_ID,placementId:P022_ID,sourceSwfSha256:IR.sourceSha256,template:'exercise',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[8],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'question',sourceTextIds:['character-14'],role:'question',language:'en',readingOrder:1,valueSource:'maintained-page-state'},
 ...[[20,25,26],[24,25,29],[31,32,33,202,203],[22,27,28]].map((ids,i)=>({id:'answer-'+i,sourceTextIds:ids.map(id=>'character-'+id),...(i===2?{sourceShapeIds:[205]}:{}),role:'answer' as const,language:'en' as const,readingOrder:i+2,valueSource:'maintained-page-state' as const})),
 {id:'help',sourceTextIds:['character-4','character-5'],role:'label',language:'en',readingOrder:6,valueSource:'maintained-page-state'},
 {id:'feedback-title',sourceTextIds:[44,66,67,70,81,82,107,108,131,132,151,152,166,167,178,179,183].map(id=>'character-'+id),sourceShapeIds:[84,92],role:'feedback',language:'en',readingOrder:7,valueSource:'maintained-page-state'},
 {id:'explanation',sourceTextIds:[58,73,96,111].map(id=>'character-'+id),role:'feedback',language:'en',readingOrder:8,valueSource:'maintained-page-state'},
 {id:'close',sourceTextIds:['character-50'],role:'label',language:'en',readingOrder:9,valueSource:'maintained-page-state'},
 {id:'help-example',sourceTextIds:[189,190,191,192,193,194,195,196,197].map(id=>'character-'+id),role:'body',language:'en',readingOrder:10,valueSource:'maintained-page-state'},
] as const)});
export function p022TextValues(s:P022FrameState) {
 const t=p022Teaching(s.session),b=p022Feedback(s.session),page=!s.component&&s.mainFrame!==null;
 const popup=s.component?['59','74','97','112'].includes(s.domain):!!b&&'popup'in b&&s.frame>=b.popup&&s.session.phase!=='wrong-out';
 const help=s.session.help||['199','200'].includes(s.domain);
 const values:Record<string,{text:string;visible:boolean}>={
  'course-title':{text:'Fractions, Decimals, and Percents Concepts: Instruction',visible:page||s.domain==='9'},
  question:{text:t.row.question.map(r=>r.text).join(''),visible:page&&t.row.question.some(r=>r.text)},
  help:{text:'Need More Help',visible:page&&t.row.helpVisible},
  'feedback-title':{text:b?.title??(s.domain==='168'?'Correct!':''),visible:s.component?s.domain==='168':p022FeedbackTitleVisible(s.session)},
  explanation:{text:p022WrongExplanation(s.session),visible:popup},
  close:{text:'Close',visible:popup||help},
  'help-example':{text:'Example: numerator / denominator = parts selected / total equal parts = 4/6. Count the selected parts = 4 (numerator). Count the equal parts = 6 (denominator).',visible:help},
 };
 for(let i=0;i<4;i++) values['answer-'+i]={text:`${'ABCD'[i]} ${P022_OPTIONS[i][0]}/${P022_OPTIONS[i][1]}`,visible:page&&t.row.choices[i].alpha>0};
 return values;
}
export function p022TextSnapshot(s:P022FrameState) {
 const snapshot=buildLessonTextSnapshot(P022_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},p022TextValues(s));
 return Object.freeze({...snapshot,suppressedInstances:Object.freeze(s.nodes.filter(n=>Object.hasOwn(IR.texts,String(n.characterId))||ART.suppressedShapeIds.includes(n.characterId)||[84,92].includes(n.characterId)).map(n=>{
  const segments:LessonTextInstanceSegment[]=[];let timelineId=s.frameDomain;
  for(const m of n.instancePath.matchAll(/\/d(\d+)g(\d+)c(\d+)/gu)) {segments.push({timelineId,depth:Number(m[1]),generation:Number(m[2]),characterId:Number(m[3])});timelineId='sprite-'+m[3];}
  return Object.freeze({id:lessonTextInstanceId(segments),path:Object.freeze(segments)});
 }))});
}
