import{P027_SOURCE_IR as IR}from'./generated/nms-l02-p027-source-ir-v1';
import{P027_OPTIONS,p027Feedback,p027WrongExplanation}from'./nms-l02-p027-state-v1';
import{p027FeedbackTitleVisible}from'./nms-l02-p027-feedback-v1';import{p027SourceTeaching}from'./nms-l02-p027-source-query-v1';
import type{P027FrameState}from'./nms-l02-p027-frame-v1';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
const titles=[44,66,67,70,81,82,107,108,131,132,151,152,166,167,178,179,183];
export const P027_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p027-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'exercise',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[8],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[8],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'question',sourceTextIds:['character-12'],role:'question',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 ...[33,31,29,27].map((id,i)=>({id:'answer-'+i,sourceTextIds:['character-'+id],role:'answer' as const,language:'en' as const,readingOrder:3+i,valueSource:'maintained-page-state' as const})),
 {id:'help',sourceTextIds:['character-4','character-5'],role:'label',language:'en',readingOrder:7,valueSource:'maintained-page-state'},
 {id:'feedback-title',sourceTextIds:titles.map(id=>'character-'+id),sourceShapeIds:[84,92],role:'feedback',language:'en',readingOrder:8,valueSource:'maintained-page-state'},
 {id:'explanation',sourceTextIds:[58,73,96,111].map(id=>'character-'+id),role:'feedback',language:'en',readingOrder:9,valueSource:'maintained-page-state'},
 {id:'close',sourceTextIds:['character-50'],role:'label',language:'en',readingOrder:10,valueSource:'maintained-page-state'},
 {id:'help-definition',sourceTextIds:['character-191'],role:'body',language:'en',readingOrder:11,valueSource:'maintained-page-state'},
 {id:'help-example',sourceTextIds:[189,190,192].map(id=>'character-'+id),role:'body',language:'en',readingOrder:12,valueSource:'maintained-page-state'},
 {id:'comparison',sourceTextIds:[198,199,200,202,203].map(id=>'character-'+id),sourceShapeIds:[204,205],role:'body',language:'en',readingOrder:13,valueSource:'maintained-page-state'},
 {id:'reduction',sourceTextIds:[198,199,200,202,203].map(id=>'character-'+id),sourceShapeIds:[197,201],role:'body',language:'en',readingOrder:14,valueSource:'maintained-page-state'},
]as const)});
export function p027TextValues(s:P027FrameState){
 const state=s.session,t=p027SourceTeaching(state.mainFrame),b=p027Feedback(state),page=!s.component&&s.mainFrame!==null;
 const popup=s.component?['59','74','97','112'].includes(s.domain):!!b&&'popup'in b&&state.localFrame>=b.popup&&state.phase!=='wrong-out';
 const help=s.component?['194','195'].includes(s.domain):state.help;
 const componentTitles=s.component?[...new Set(s.nodes.filter(n=>titles.includes(n.characterId)&&n.color[3]>0).map(n=>IR.texts.find(t=>t.characterId===n.characterId)!.runs.map(r=>r.text).join('')))]:[];
 const comparison=[t.upperLeftFractionVisible?'2/10 =':'',t.upperRightFractionVisible?'1/5':''].filter(Boolean).join(' ');
 const values:Record<string,{text:string;visible:boolean}>={
  'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:page||s.domain==='9'},'activity-title':{text:'Instruction',visible:page||s.domain==='9'},
  question:{text:IR.texts.find(t=>t.characterId===12)!.runs.map(r=>r.text).join(''),visible:page&&t.questionAlpha>0},
  help:{text:'Need More Help',visible:page&&t.helpVisible},
  'feedback-title':{text:b?.title??componentTitles.join(' '),visible:s.component?componentTitles.length>0:p027FeedbackTitleVisible(state)},
  explanation:{text:p027WrongExplanation(state),visible:popup},close:{text:'Close',visible:popup||(s.component?s.domain==='195':state.help)},
  'help-definition':{text:IR.texts.find(t=>t.characterId===191)!.runs.map(r=>r.text).join(''),visible:help},
  'help-example':{text:'1/2; 2/4',visible:help},comparison:{text:comparison,visible:page&&comparison.length>0},
  reduction:{text:'2/10 = (2 ÷ 2)/(10 ÷ 2) = 1/5',visible:page&&t.reductionFormulaVisible},
 };
 for(let i=0;i<4;i++)values['answer-'+i]={text:`${'ABCD'[i]}: ${P027_OPTIONS[i]![0]}/${P027_OPTIONS[i]![1]}`,visible:page&&!state.feedback&&(i===0?t.correctOptionAlpha:t.wrongCompositeAlpha)>0};
 return values;
}
/** Native text and generated glyph-free feedback art never overlay source fonts. */
export function p027TextSnapshot(s:P027FrameState){return buildLessonTextSnapshot(P027_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},p027TextValues(s));}
