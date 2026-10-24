import{P031_FEEDBACK_IR as IR}from'./generated/nms-l02-p031-feedback-ir-v1';
import{P031_FEEDBACK_TITLES as TITLES}from'./generated/nms-l02-p031-feedback-titles-v1';
import{p031Teaching,p031QuestionText}from'./nms-l02-p031-teaching-v1';
import{P031_OPTIONS,p031Feedback,p031WrongExplanation,p031CloseFeedback}from'./nms-l02-p031-state-v1';
import type{P031FrameState}from'./nms-l02-p031-frame-v1';
import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
const ids=(ns:readonly number[])=>ns.map(n=>'character-'+n);
export const P031_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p031-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'exercise',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[10],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[10],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'question',sourceTextIds:ids([16]),role:'question',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 ...[[22,20],[24,25],[30,31],[27,28]].map((ns,i)=>({id:'answer-'+i,sourceTextIds:ids(ns),role:'answer' as const,language:'en' as const,readingOrder:3+i,valueSource:'maintained-page-state' as const})),
 {id:'help',sourceTextIds:ids([4,5]),role:'label',language:'en',readingOrder:7,valueSource:'maintained-page-state'},
 {id:'feedback-title',sourceTextIds:ids([62,63,64,77,78,104,105,114,115,126,127,139,162,163,179,192,193,196]),sourceShapeIds:[177],role:'feedback',language:'en',readingOrder:8,valueSource:'maintained-page-state'},
 {id:'explanation',sourceTextIds:ids([153,171,183,198]),role:'feedback',language:'en',readingOrder:9,valueSource:'maintained-page-state'},
 {id:'close',sourceTextIds:ids([145]),role:'label',language:'en',readingOrder:10,valueSource:'maintained-page-state'},
 {id:'help-definition',sourceTextIds:ids([206]),role:'body',language:'en',readingOrder:11,valueSource:'maintained-page-state'},
 {id:'help-example',sourceTextIds:ids([208,210,211,227,228]),role:'body',language:'en',readingOrder:12,valueSource:'maintained-page-state'},
 {id:'chart-title',sourceTextIds:ids([225]),role:'heading',language:'en',readingOrder:13,valueSource:'maintained-page-state'},
 {id:'chart-labels',sourceTextIds:ids([213,214,215,216,217,218,219,221,222]),role:'label',language:'en',readingOrder:14,valueSource:'maintained-page-state'},
 {id:'chart-number',sourceTextIds:ids([220,227,228,241]),role:'label',language:'en',readingOrder:15,valueSource:'maintained-page-state'},
 {id:'transient-number',sourceTextIds:ids([233,234,235]),role:'label',language:'en',readingOrder:16,valueSource:'maintained-page-state'},
]as const)});
export function p031TextValues(s:P031FrameState){const state=s.session,t=p031Teaching(state),b=p031Feedback(state),page=!s.component&&s.mainFrame!==null,main=page&&!state.feedback;
 const help=s.component?['231','232'].includes(s.domain):state.help;
 const popup=s.component?['154','172','184','199'].includes(s.domain):p031CloseFeedback(state)!==state;
 const title=TITLES[state.domain as keyof typeof TITLES]?.[state.localFrame-1];const chart=help||main&&t.chartAlpha>0;
 const question=p031QuestionText(state),number=[['0',t.zeroDigitAlpha],['.',t.pointAlpha],['7',t.sevenDigitAlpha]].filter(([,a])=>Number(a)>0).map(([v])=>v).join('');
 const values:Record<string,{text:string;visible:boolean}>={
 'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:page||s.domain==='11'},'activity-title':{text:'Instruction',visible:page||s.domain==='11'},
 question:{text:question,visible:main&&question.length>0},help:{text:'Need More Help',visible:main&&t.helpButtonPoses.length>0},
 'feedback-title':{text:b?.title??'',visible:!!state.feedback&&!!title?.visible},explanation:{text:p031WrongExplanation(state),visible:popup},close:{text:'Close',visible:popup||(s.component?s.domain==='232':help)},
 'help-definition':{text:'Use place value to name a decimal:',visible:help},'help-example':{text:'Count the tenths = 2; Count the hundredths = 3; 0.23',visible:help},
 'chart-title':{text:'Place Value Chart',visible:chart},'chart-labels':{text:'Ones; Decimals; Hundreds, Tens, Ones, Decimal Point, Tenths, Hundredths, Thousandths',visible:chart},
 'chart-number':{text:help?'0.23':'0.7',visible:chart},'transient-number':{text:number,visible:main&&number.length>0},
 };
 for(let i=0;i<4;i++)values['answer-'+i]={text:`${'ABCD'[i]}: ${P031_OPTIONS[i]}`,visible:main&&t.optionAlphas[i]>0};return values;
}
/** Native text plus glyph-free art; source-help correction is explicitly bound in the audit. */
export function p031TextSnapshot(s:P031FrameState){return buildLessonTextSnapshot(P031_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},p031TextValues(s));}
