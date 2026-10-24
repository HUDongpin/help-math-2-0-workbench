import{P033_FEEDBACK_IR as IR}from'./generated/nms-l02-p033-feedback-ir-v1';
import{P033_FEEDBACK_TITLES as TITLES}from'./generated/nms-l02-p033-feedback-titles-v1';
import{p033Teaching,p033QuestionText}from'./nms-l02-p033-teaching-v1';
import{P033_OPTIONS,p033Feedback,p033WrongExplanation,p033CloseFeedback}from'./nms-l02-p033-state-v1';
import type{P033FrameState}from'./nms-l02-p033-frame-v1';
import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
const ids=(ns:readonly number[])=>ns.map(n=>'character-'+n);
export const P033_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'nms-l02-p033-native-source-v1',animationId:IR.animationId,placementId:IR.animationId,sourceSwfSha256:IR.sourceSha256,template:'exercise',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[8],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[8],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 {id:'question',sourceTextIds:ids([14]),role:'question',language:'en',readingOrder:2,valueSource:'maintained-page-state'},
 ...[[18,20],[23,22],[29,28],[26,25]].map((ns,i)=>({id:'answer-'+i,sourceTextIds:ids(ns),role:'answer' as const,language:'en' as const,readingOrder:3+i,valueSource:'maintained-page-state' as const})),
 {id:'help',sourceTextIds:ids([4,5]),role:'label',language:'en',readingOrder:7,valueSource:'maintained-page-state'},
 {id:'feedback-title',sourceTextIds:ids([40,62,63,66,77,78,103,104,127,128,147,148,162,163,174,175,179]),sourceShapeIds:[80,88],role:'feedback',language:'en',readingOrder:8,valueSource:'maintained-page-state'},
 {id:'explanation',sourceTextIds:ids([54,69,92,107]),role:'feedback',language:'en',readingOrder:9,valueSource:'maintained-page-state'},
 {id:'close',sourceTextIds:ids([46]),role:'label',language:'en',readingOrder:10,valueSource:'maintained-page-state'},
 {id:'help-definition',sourceTextIds:ids([185]),role:'body',language:'en',readingOrder:11,valueSource:'maintained-page-state'},
 {id:'help-example',sourceTextIds:ids([187,189,190,206,207,208]),role:'body',language:'en',readingOrder:12,valueSource:'maintained-page-state'},
 {id:'chart-title',sourceTextIds:ids([204,219]),role:'heading',language:'en',readingOrder:13,valueSource:'maintained-page-state'},
 {id:'chart-labels',sourceTextIds:ids([192,193,194,195,196,197,198,200,201]),role:'label',language:'en',readingOrder:14,valueSource:'maintained-page-state'},
 {id:'chart-number',sourceTextIds:ids([190,199,206,207,208,220]),role:'label',language:'en',readingOrder:15,valueSource:'maintained-page-state'},
 {id:'transient-number',sourceTextIds:ids([214]),role:'label',language:'en',readingOrder:16,valueSource:'maintained-page-state'},
]as const)});
export function p033TextValues(s:P033FrameState){const state=s.session,t=p033Teaching(state),b=p033Feedback(state),page=!s.component&&s.mainFrame!==null,main=page&&!state.feedback;
 const help=s.component?['211','212'].includes(s.domain):state.help;
 const popup=s.component?['55','70','93','108'].includes(s.domain):p033CloseFeedback(state)!==state;
 const title=TITLES[state.domain as keyof typeof TITLES]?.[state.localFrame-1];const chart=help||main&&t.chartAlpha>0;
 const question=p033QuestionText(state),number=t.decimalEmphasis?'0.25':'';
 const values:Record<string,{text:string;visible:boolean}>={
 'course-title':{text:'Fractions, Decimals, and Percents Concepts:',visible:page||s.domain==='9'},'activity-title':{text:'Instruction',visible:page||s.domain==='9'},
 question:{text:question,visible:main&&question.length>0},help:{text:'Need More Help',visible:main&&t.helpLabelAlpha>0},
 'feedback-title':{text:s.component&&s.domain==='164'?'Correct!':b?.title??'',visible:s.component&&s.domain==='164'||!!state.feedback&&!!title?.visible},explanation:{text:p033WrongExplanation(state),visible:popup},close:{text:'Close',visible:popup||(s.component?s.domain==='212':help)},
 'help-definition':{text:'Use place value to name a decimal:',visible:help},'help-example':{text:'Count the tenths = 2; Count the hundredths = 3; 0.23',visible:help},
 'chart-title':{text:'Place Value Chart',visible:chart},'chart-labels':{text:'Ones; Decimals; Hundreds, Tens, Ones, Decimal Point, Tenths, Hundredths, Thousandths',visible:chart},
 'chart-number':{text:help?'0.23':'0.25',visible:chart},'transient-number':{text:number,visible:main&&number.length>0},
 };
 for(let i=0;i<4;i++)values['answer-'+i]={text:`${'ABCD'[i]}: ${P033_OPTIONS[i]}`,visible:main&&t.optionAlphas[i]>0};return values;
}
/** Native text plus glyph-free art; exact source help uses23hundredths and the main example25hundredths. */
export function p033TextSnapshot(s:P033FrameState){return buildLessonTextSnapshot(P033_TEXT_BINDING,{frame:s.frame,frameDomain:s.frameDomain,rootFrame:s.rootFrame,scenario:s.scenario,lang:s.language,seed:s.seed,replay:s.replay},p033TextValues(s));}
