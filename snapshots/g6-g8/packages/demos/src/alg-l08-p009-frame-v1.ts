import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L08_P009_SOURCE as S,p009InitialState,p009Visual,type P009State}from'./alg-l08-p009-state-v1';
export const P009_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-54',frameCount:1,rootFrame:6},{id:'sprite-56',frameCount:1,rootFrame:6},{id:'sprite-58',frameCount:1,rootFrame:6},{id:'sprite-74',frameCount:15,rootFrame:6},{id:'sprite-78',frameCount:1,rootFrame:6},{id:'sprite-86',frameCount:330,rootFrame:6}]);
export const P009_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P009_DEFAULTS=Object.freeze(Object.fromEntries(P009_DOMAINS.map(d=>[d.id,d.id==='sprite-74'?'wrong-first':'source-slope'])));
export const P009_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l08-p009-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 ...[44,51].map((id,i)=>({id:`paragraph-${i}`,sourceTextIds:[`character-${id}`],role:'body' as const,language:'en' as const,readingOrder:i+2,valueSource:'maintained-page-state' as const})),
 ...([{id:'equation-prefix',sources:[4],role:'body'},{id:'slope',sources:[7,49,57,75],role:'label'},{id:'equation-suffix',sources:[5],role:'body'},{id:'intercept',sources:[8],role:'label'},{id:'draw',sources:[38,60],role:'label'},{id:'feedback',sources:[73],role:'feedback'},{id:'close',sources:[66],role:'label'}]as const).map((b,i)=>({id:b.id,sourceTextIds:b.sources.map(n=>`character-${n}`),role:b.role,language:'en' as const,readingOrder:4+i,valueSource:'maintained-page-state' as const})),
 ...S.graph.labels.map((l,i)=>({id:`axis-${i}`,sourceTextIds:[l.sourceTextId],role:'label' as const,language:'en' as const,readingOrder:i+11,valueSource:'source-static' as const})),
 ...[0,1].map(i=>({id:`origin-zero-${i}`,sourceTextIds:['character-84'],role:'label' as const,language:'en' as const,readingOrder:54+i,valueSource:'maintained-page-state' as const}))]as const)});
export function p009View(state:P009State,context:RuntimeContext,ready=true){
 const visual=p009Visual(state.mainFrame),childKind=({'sprite-54':'draw','sprite-56':'thumb','sprite-58':'initial-line','sprite-78':'answer-line'}as const)[context.frameDomain as 'sprite-54'|'sprite-56'|'sprite-58'|'sprite-78'],childOnly=Boolean(childKind),slope=state.mainFrame>=157&&state.mainFrame<=159?state.slope:visual.equationSlope,values:Record<string,{text:string;visible:boolean}>={};
 const set=(id:string,text:string,visible=true)=>values[id]={text,visible:ready&&!childOnly&&visible&&Boolean(text.trim())};
 set('course-title','Graphing Linear Equations:');set('activity-title','Vocabulary');visual.paragraphs.forEach((text,i)=>set(`paragraph-${i}`,text));
 set('equation-prefix','Equation of line: y =',visual.graphAlpha>0);set('slope',slope,visual.graphAlpha>0);set('equation-suffix','x +',visual.graphAlpha>0);set('intercept','0',visual.graphAlpha>0);set('draw','Draw the Line',visual.graphAlpha>0&&visual.drawVisible);set('feedback',state.wrongText??'',state.popupVisible&&state.popupFrame>=2);set('close','Close',state.popupVisible&&state.popupFrame>=2);S.graph.labels.forEach((l,i)=>set(`axis-${i}`,l.text,visual.graphAlpha>0));
 for(const i of[0,1]){const a=visual.annotations[i];set(`origin-zero-${i}`,a?.text??'',Boolean(a&&a.alpha>0));}
 if(childKind==='draw')values.draw={text:'Draw the Line',visible:ready};
 const frameDomain=context.frameDomain??'sprite-86',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,state,ready,childOnly,childKind,visual,slope,values,frame:context.frame,frameDomain,rootFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P009_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P009_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL08P009Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-86',scenario:'source-slope',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-86',spec=P009_DOMAINS.find(d=>d.id===domain),allowed=domain==='sprite-74'?['wrong-first','wrong-second']:domain==='sprite-86'?['source-slope','source-second-wrong']:['source-slope'];
 if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!allowed.includes(context.scenario)||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p009-frame-identity');
 let s=p009InitialState(0,context.replay??0);const second=context.scenario==='source-second-wrong'||context.scenario==='wrong-second',main=domain==='root'?1:domain==='sprite-86'?frame:domain==='sprite-78'?160:157;
 s={...s,mainFrame:main,phase:main<157?'prequiz':main===157?'quiz-held':'postquiz',slope:main>=160||main>=158&&!second?'2':'1',sliderX:main>=160?S.slider.replacementX:main>=158&&!second?-30:S.slider.placedX,quizSection:main===157,sliderEnabled:main===157||main>=160||main>=158&&second,attempts:main>=158?(second?2:1):0};
 if(domain==='sprite-86'&&second&&frame===157)s={...s,phase:'postquiz',quizSection:false,attempts:2,popupFrame:2};
 if(domain==='sprite-74'&&frame>=2)s={...s,phase:'feedback',popupVisible:true,popupFrame:frame,popupSerial:1,attempts:second?2:1,sliderEnabled:false,wrongText:second?S.behavior.wrongLater:S.behavior.wrongFirst};
 return p009View(s,{...context,frame,frameDomain:domain},domain!=='root'||frame>=6);
}
export type P009View=ReturnType<typeof p009View>;
