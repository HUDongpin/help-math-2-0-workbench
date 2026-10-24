import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L07_P009_SOURCE as S,p009InitialState,p009Visual,p009Reduce,type P009State}from'./alg-l07-p009-state-v1';
export const P009_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-80',frameCount:604,rootFrame:6},{id:'sprite-79',frameCount:19,rootFrame:6}]);
export const P009_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P009_DEFAULTS=Object.freeze({'root':'source-demo','sprite-80':'source-demo','sprite-79':'empty-input'});
const blocks=[['definition',[12],'body'],['instruction',[42],'body'],['ending',[51],'body'],['x-label',[18,54,38],'label'],['x-value',[34,40,39,46,59],'label'],['y-label',[20,36,55,56],'label'],['y-value',[35,34,37,60],'label'],['equation-y',[21],'label'],['equation-x',[25],'label'],['slope-value',[26,57],'label'],['intercept-value',[27,58],'label'],['slope-label',[28,47],'label'],['intercept-label',[29,48],'label'],['enter',[4,5],'label'],['reset',[23,62,63],'label'],['hint',[78],'feedback'],['close',[70],'label']]as const;
export const P009_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p009-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze([
 {id:'course-title',sourceTextIds:[],sourceShapeIds:[9],role:'heading',language:'en',readingOrder:0,valueSource:'source-static'},
 {id:'activity-title',sourceTextIds:[],sourceShapeIds:[9],role:'title',language:'en',readingOrder:1,valueSource:'source-static'},
 ...blocks.map(([id,ids,role],i)=>({id,sourceTextIds:ids.map(n=>`character-${n}`),role,language:'en' as const,readingOrder:i+2,valueSource:'maintained-page-state' as const}))]as const)});
export function p009View(state:P009State,context:RuntimeContext,ready=true){const v=p009Visual(state.mainFrame),form=state.phase==='form',shown=ready&&v.machineAlpha>0;
 const values:Record<string,{text:string;visible:boolean}>={};const set=(id:string,text:string,visible=true)=>values[id]={text,visible:ready&&visible&&Boolean(text.trim())};
 set('course-title','Linear and Nonlinear Functions:');set('activity-title','Vocabulary');set('definition',v.definition,Boolean(v.definition));set('instruction',v.instruction,Boolean(v.instruction));set('ending',v.ending,Boolean(v.ending));
 set('x-label','x =',shown);set('x-value',form?state.inputs.x:v.input,shown);set('y-label','y =',shown);set('y-value',form?state.output:v.output,shown);set('equation-y','y =',shown);set('equation-x','x +',shown);set('slope-value',form?state.inputs.slope:v.exampleSlope,shown);set('intercept-value',form?state.inputs.intercept:v.exampleIntercept,shown);set('slope-label','Slope',shown);set('intercept-label','y-intercept',shown);set('enter','Enter',shown);set('reset','Set new function',shown);set('hint',S.hintText,state.hint);set('close','Close',state.hint);
 const frameDomain=context.frameDomain??'sprite-80',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,form,values,frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,hintFrame:frameDomain==='sprite-79'?context.frame:1,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P009_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P009_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL07P009Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-80',scenario:'source-demo',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-80',spec=P009_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p009-frame-identity');
 const scenarios=['source-demo','empty-input','calculated','reset','legacy-invalid'];if(!scenarios.includes(context.scenario)||(domain==='root'&&context.scenario!=='source-demo')||(domain==='sprite-79'&&context.scenario!=='empty-input')||(domain==='sprite-80'&&context.scenario!=='source-demo'&&frame<600))throw Error('invalid-p009-scenario');
 let s=p009InitialState(0,context.replay??0),main=domain==='root'?1:domain==='sprite-79'?600:frame;
 if(main>=600)s={...s,phase:'form',mainFrame:main,enterEnabled:true,newEnabled:true};else s={...s,mainFrame:main};
 if(context.scenario==='empty-input')s=p009Reduce(s,{type:'submit',epoch:s.epoch});
 if(context.scenario==='calculated'||context.scenario==='legacy-invalid'){s={...s,inputs:{x:'4',slope:context.scenario==='calculated'?'3/4':'--2',intercept:'-2'}};s=p009Reduce(s,{type:'submit',epoch:s.epoch});}
 if(context.scenario==='reset')s=p009Reduce(s,{type:'reset',epoch:s.epoch});
 return p009View(s,{...context,frame,frameDomain:domain},domain!=='root'||frame>=6);
}
export type P009View=ReturnType<typeof p009View>;
