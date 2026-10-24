import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L08_P012_SOURCE as S,p012InitialState,p012Visual,type P012State}from'./alg-l08-p012-state-v1';
export const P012_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-51',frameCount:1,rootFrame:6},{id:'sprite-53',frameCount:1,rootFrame:6},{id:'sprite-70',frameCount:15,rootFrame:6},{id:'sprite-71',frameCount:1,rootFrame:6},{id:'sprite-74',frameCount:1,rootFrame:6},{id:'sprite-84',frameCount:293,rootFrame:6}]);
export const P012_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P012_DEFAULTS=Object.freeze(Object.fromEntries(P012_DOMAINS.map(d=>[d.id,d.id==='sprite-70'?'wrong-first':'source-slope'])));
export const P012_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l08-p012-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[1],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[1],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 ...[44,80].map((id,i)=>({id:`paragraph-${i}`,sourceTextIds:[`character-${id}`],role:'body' as const,language:'en' as const,readingOrder:i+2,valueSource:'maintained-page-state' as const})),
 ...([{id:'equation-prefix',sources:[4],role:'body'},{id:'slope',sources:[7,48,49,54,72],role:'label'},{id:'equation-suffix',sources:[5],role:'body'},{id:'intercept',sources:[8],role:'label'},{id:'draw',sources:[38,56],role:'label'},{id:'feedback',sources:[69],role:'feedback'},{id:'close',sources:[62],role:'label'}]as const).map((b,i)=>({id:b.id,sourceTextIds:b.sources.map(n=>`character-${n}`),role:b.role,language:'en' as const,readingOrder:4+i,valueSource:'maintained-page-state' as const})),
 ...S.graph.labels.map((l,i)=>({id:`axis-${i}`,sourceTextIds:[l.sourceTextId],role:'label' as const,language:'en' as const,readingOrder:i+11,valueSource:'source-static' as const}))]as const)});
const childKinds={'sprite-51':'track','sprite-53':'thumb','sprite-71':'thumb','sprite-74':'negative-line'}as const;
export function p012View(state:P012State,context:RuntimeContext,ready=true){
 const visual=p012Visual(state.mainFrame),childKind=childKinds[context.frameDomain as keyof typeof childKinds],childOnly=Boolean(childKind),slope=state.mainFrame>=132?state.slope:visual.equationSlope,values:Record<string,{text:string;visible:boolean}>={};
 const set=(id:string,text:string,visible=true)=>values[id]={text,visible:ready&&!childOnly&&visible&&Boolean(text.trim())};
 set('course-title','Graphing Linear Equations:');set('activity-title','Vocabulary');visual.paragraphs.forEach((text,i)=>set(`paragraph-${i}`,text));
 set('equation-prefix','Equation of line: y =',visual.graphAlpha>0);set('slope',slope,visual.graphAlpha>0);set('equation-suffix','x +',visual.graphAlpha>0);set('intercept','0',visual.graphAlpha>0);set('draw','Draw the Line',visual.graphAlpha>0&&visual.drawVisible);set('feedback',state.wrongText??'',state.popupVisible&&state.popupFrame>=2);set('close','Close',state.popupVisible&&state.popupFrame>=2);S.graph.labels.forEach((l,i)=>set(`axis-${i}`,l.text,visual.graphAlpha>0));
 const frameDomain=context.frameDomain??'sprite-84',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,state,ready,childOnly,childKind,visual,slope,values,frame:context.frame,frameDomain,rootFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P012_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P012_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL08P012Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-84',scenario:'source-slope',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-84',spec=P012_DOMAINS.find(d=>d.id===domain),allowed=domain==='sprite-70'?['wrong-first','wrong-second']:domain==='sprite-84'?['source-slope','source-second-wrong']:['source-slope'];
 if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!allowed.includes(context.scenario)||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p012-frame-identity');
 let s=p012InitialState(0,context.replay??0);const second=context.scenario==='source-second-wrong'||context.scenario==='wrong-second',main=domain==='root'?1:domain==='sprite-84'?frame:domain==='sprite-71'||domain==='sprite-74'?136:132;
 s={...s,mainFrame:main,phase:main<132?'prequiz':main===132?'quiz-held':'postquiz',slope:main===136?'':main>=137||main>=133&&!second?'-1':'0.2',sliderX:main>=136?S.slider.replacementX:main>=133&&!second?-60:S.slider.placedX,quizSection:main===132,sliderEnabled:main===132||main>=133&&main<136&&second,drawEnabled:main===132||main>=133&&second,attempts:main>=133?(second?2:1):0};
 if(domain==='sprite-84'&&second&&frame===132)s={...s,phase:'postquiz',quizSection:false,attempts:2,popupFrame:2};
 if(domain==='sprite-70'&&frame>=2)s={...s,phase:'feedback',popupVisible:true,popupFrame:frame,popupSerial:1,attempts:second?2:1,sliderEnabled:false,drawEnabled:false,wrongText:second?S.behavior.wrongLater:S.behavior.wrongFirst};
 return p012View(s,{...context,frame,frameDomain:domain},domain!=='root'||frame>=6);
}
export type P012View=ReturnType<typeof p012View>;
