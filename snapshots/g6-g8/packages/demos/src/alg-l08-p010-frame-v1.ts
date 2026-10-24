import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L08_P010_SOURCE as S,p010InitialState,p010Visual,type P010State}from'./alg-l08-p010-state-v1';
export const P010_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-2',frameCount:1,rootFrame:6},{id:'sprite-37',frameCount:1,rootFrame:6},{id:'sprite-59',frameCount:1,rootFrame:6},{id:'sprite-61',frameCount:1,rootFrame:6},{id:'sprite-78',frameCount:15,rootFrame:6},{id:'sprite-79',frameCount:1,rootFrame:6},{id:'sprite-107',frameCount:611,rootFrame:6}]);
export const P010_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P010_DEFAULTS=Object.freeze(Object.fromEntries(P010_DOMAINS.map(d=>[d.id,d.id==='sprite-78'?'wrong-first':'source-slope'])));
export const P010_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l08-p010-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 ...[48,56].map((id,i)=>({id:`paragraph-${i}`,sourceTextIds:[`character-${id}`],role:'body' as const,language:'en' as const,readingOrder:i+2,valueSource:'maintained-page-state' as const})),
 ...([{id:'equation-prefix',sources:[5],role:'body'},{id:'slope',sources:[8,52,54,55,62,80],role:'label'},{id:'equation-suffix',sources:[6],role:'body'},{id:'intercept',sources:[9],role:'label'},{id:'draw',sources:[40,64],role:'label'},{id:'feedback',sources:[77],role:'feedback'},{id:'close',sources:[70],role:'label'}]as const).map((b,i)=>({id:b.id,sourceTextIds:b.sources.map(n=>`character-${n}`),role:b.role,language:'en' as const,readingOrder:4+i,valueSource:'maintained-page-state' as const})),
 ...S.graph.labels.map((l,i)=>({id:`axis-${i}`,sourceTextIds:[l.sourceTextId],role:'label' as const,language:'en' as const,readingOrder:i+11,valueSource:'source-static' as const}))]as const)});
const childKinds={'sprite-2':'title','sprite-37':'initial-line','sprite-59':'track','sprite-61':'thumb','sprite-79':'thumb'}as const;
export function p010View(state:P010State,context:RuntimeContext,ready=true){
 const visual=p010Visual(state.mainFrame),childKind=childKinds[context.frameDomain as keyof typeof childKinds],childOnly=Boolean(childKind),slope=state.mainFrame>=212?state.slope:visual.equationSlope,values:Record<string,{text:string;visible:boolean}>={};
 const set=(id:string,text:string,visible=true)=>values[id]={text,visible:ready&&!childOnly&&visible&&Boolean(text.trim())};
 set('course-title','Graphing Linear Equations:');set('activity-title','Vocabulary');visual.paragraphs.forEach((text,i)=>set(`paragraph-${i}`,text));
 set('equation-prefix','Equation of line: y =',visual.graphAlpha>0);set('slope',slope,visual.graphAlpha>0);set('equation-suffix','x +',visual.graphAlpha>0);set('intercept','0',visual.graphAlpha>0);set('draw','Draw the Line',visual.graphAlpha>0&&visual.drawVisible);set('feedback',state.wrongText??'',state.popupVisible&&state.popupFrame>=2);set('close','Close',state.popupVisible&&state.popupFrame>=2);S.graph.labels.forEach((l,i)=>set(`axis-${i}`,l.text,visual.graphAlpha>0));
 if(childKind==='title'){values['course-title']={text:'Graphing Linear Equations:',visible:ready};values['activity-title']={text:'Vocabulary',visible:ready};}
 const frameDomain=context.frameDomain??'sprite-107',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,state,ready,childOnly,childKind,visual,slope,values,frame:context.frame,frameDomain,rootFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P010_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P010_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL08P010Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-107',scenario:'source-slope',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-107',spec=P010_DOMAINS.find(d=>d.id===domain),allowed=domain==='sprite-78'?['wrong-first','wrong-second']:domain==='sprite-107'?['source-slope','source-second-wrong']:['source-slope'];
 if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!allowed.includes(context.scenario)||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p010-frame-identity');
 let s=p010InitialState(0,context.replay??0);const second=context.scenario==='source-second-wrong'||context.scenario==='wrong-second',main=domain==='root'||domain==='sprite-2'?1:domain==='sprite-107'?frame:domain==='sprite-79'?216:212;
 s={...s,mainFrame:main,phase:main<212?'prequiz':main===212?'quiz-held':'postquiz',slope:main>=216||main>=213&&!second?'0.2':'2',sliderX:main>=216?S.slider.replacementX:main>=213&&!second?-48:S.slider.placedX,quizSection:main===212,sliderEnabled:main===212||main>=213&&main<216&&second,attempts:main>=213?(second?2:1):0};
 if(domain==='sprite-107'&&second&&frame===212)s={...s,phase:'postquiz',quizSection:false,attempts:2,popupFrame:2};
 if(domain==='sprite-78'&&frame>=2)s={...s,phase:'feedback',popupVisible:true,popupFrame:frame,popupSerial:1,attempts:second?2:1,sliderEnabled:false,wrongText:second?S.behavior.wrongLater:S.behavior.wrongFirst};
 return p010View(s,{...context,frame,frameDomain:domain},domain!=='root'||frame>=6);
}
export type P010View=ReturnType<typeof p010View>;
