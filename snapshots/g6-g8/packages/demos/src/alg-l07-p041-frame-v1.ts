import type{RuntimeContext}from'./contract';import type{LessonTextBinding}from'./lesson-text-contract';import{buildLessonTextSnapshot}from'./lesson-text-snapshot';
import{ALG_L07_P041_SOURCE as S,p041InitialState,p041Visual,p041Branch,p041CanClose,type P041State}from'./alg-l07-p041-state-v1';
export const P041_DOMAINS=Object.freeze([{id:'root',frameCount:10},{id:'sprite-17',frameCount:1,rootFrame:6},{id:'sprite-7',frameCount:1,rootFrame:6},{id:'sprite-213',frameCount:1,rootFrame:6},{id:'sprite-182',frameCount:1,rootFrame:6},{id:'sprite-197',frameCount:1,rootFrame:6},...S.branches.filter((b,i,all)=>all.findIndex(x=>x.spriteId===b.spriteId)===i).map(b=>({id:`sprite-${b.spriteId}`,frameCount:b.terminal,rootFrame:6})),{id:'sprite-223',frameCount:353,rootFrame:6}]);
export const P041_MOVIE=Object.freeze({stage:Object.freeze({width:800,height:600}),fps:12,frameCount:10,durationMs:10000/12});
export const P041_DEFAULTS=Object.freeze(Object.fromEntries(P041_DOMAINS.map(d=>[d.id,d.id==='sprite-213'?'help':d.id==='sprite-182'?'wrong-1':d.id==='sprite-197'?'wrong-2':S.branches.find(b=>`sprite-${b.spriteId}`===d.id)?.key??'source-question'])));
const blocks=[{id:'course-title',sourceTextIds:[],sourceShapeIds:[16],role:'heading' as const},{id:'activity-title',sourceTextIds:[],sourceShapeIds:[16],role:'title' as const},{id:'question',sourceTextIds:['character-19','character-21','character-62','character-63','character-64','character-70'],role:'question' as const},{id:'done-instruction',sourceTextIds:['character-22'],role:'body' as const},{id:'done',sourceTextIds:['character-60','character-61'],role:'label' as const},{id:'help-open',sourceTextIds:['character-11','character-12'],role:'label' as const},{id:'help-close',sourceTextIds:['character-174'],role:'label' as const},
 ...S.table.map(t=>({id:t.id,sourceTextIds:[t.sourceTextId],role:t.id.endsWith('heading')?'label' as const:'body' as const})),
 ...S.graph.labels.map(l=>({id:l.id,sourceTextIds:[l.sourceTextId],role:'label' as const})),
 ...S.helpTexts.map(t=>({id:`help-${t.characterId}`,sourceTextIds:[t.sourceTextId],role:'body' as const})),
 ...S.branches.map(b=>({id:`feedback-title-${b.key}`,sourceTextIds:b.titleIds.map(n=>`character-${n}`),role:'feedback' as const})),
 {id:'wrong-text',sourceTextIds:['character-181','character-196'],role:'feedback' as const},{id:'close',sourceTextIds:['character-174'],role:'label' as const}];
export const P041_TEXT_BINDING:LessonTextBinding=Object.freeze({schemaVersion:1,version:'alg-l07-p041-native-source-v1',animationId:S.animationId,placementId:S.animationId,sourceSwfSha256:S.sourceSha256,template:'complex-figure',blocks:Object.freeze(blocks.map((b,readingOrder)=>({...b,language:'en' as const,readingOrder,valueSource:'maintained-page-state' as const})))});
export function p041View(state:P041State,context:RuntimeContext,ready=true){
 const v=p041Visual(state.mainFrame),f=state.feedback,b=f?p041Branch(f.key):null,titleAlpha=f&&b?b.titleAlpha.find(s=>f.frame>=s.first&&f.frame<=s.last)?.value??0:0,closeVisible=p041CanClose({...state,glossary:null});
 const values:Record<string,{text:string;visible:boolean}>={'course-title':{text:'Linear and Nonlinear Functions:',visible:ready},'activity-title':{text:'Try It!',visible:ready},question:{text:'3 '+S.question,visible:ready&&v.questionAlpha>0},'done-instruction':{text:S.doneInstruction,visible:ready&&v.questionAlpha>0},done:{text:'Done',visible:ready&&v.doneOutlineVisible},'help-open':{text:'Need More Help',visible:ready&&['quiz-held','feedback'].includes(state.phase)},'help-close':{text:'Close',visible:ready&&state.help},close:{text:'Close',visible:ready&&closeVisible},'wrong-text':{text:S.feedbackHint,visible:ready&&closeVisible}};
 for(const t of S.table)values[t.id]={text:t.text,visible:ready&&v.tableVisible};
 for(const l of S.graph.labels)values[l.id]={text:l.text,visible:ready&&v.graphVisible};
 for(const t of S.helpTexts)values[`help-${t.characterId}`]={text:t.text,visible:ready&&state.help};
 for(const branch of S.branches)values[`feedback-title-${branch.key}`]={text:branch.title,visible:ready&&b?.key===branch.key&&titleAlpha>0};
 const frameDomain=context.frameDomain??'sprite-223',rootFrame=frameDomain==='root'?context.frame:6;
 return Object.freeze({animationId:S.animationId,ready,state,visual:v,feedbackTitle:b?.title??'',feedbackTitleAlpha:titleAlpha,closeVisible,frame:context.frame,frameDomain,rootFrame,mainFrame:state.mainFrame,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,traceId:context.traceId??'',requirementId:context.requirementId??'',entryStateSha256:context.entryStateSha256??'',sourceTextIds:Object.freeze([...new Set(P041_TEXT_BINDING.blocks.filter(b=>values[b.id].visible).flatMap(b=>b.sourceTextIds))]),textSnapshot:buildLessonTextSnapshot(P041_TEXT_BINDING,{...context,frameDomain,rootFrame},values)});
}
export function algL07P041Frame(frame:number,context:RuntimeContext={frame,frameDomain:'sprite-223',scenario:'source-question',lang:'en',seed:0}){
 const domain=context.frameDomain??'sprite-223',spec=P041_DOMAINS.find(d=>d.id===domain);if(!spec||!Number.isSafeInteger(frame)||frame<1||frame>spec.frameCount||!['en','es'].includes(context.lang)||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>4294967295||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('invalid-p041-frame-identity');
 let s=p041InitialState(0,context.replay??0),ready=domain!=='root'||frame>=6;const id=Number(domain.slice(7)),popup=id===182||id===197,b=S.branches.find(b=>b.key===context.scenario);
 if(b&&(b.spriteId===id||(popup&&b.kind==='wrong'&&b.child===id))){
  const local=popup&&b.kind==='wrong'?b.closeFirst:frame;const points=b.kind==='right'?[S.drag.targets[0],S.drag.targets[1]]as const:[{x:-48,y:60},S.drag.initial[1]]as const;
  s={...s,phase:'feedback',mainFrame:230,quizSection:true,quizTryCount:1,doneClicked:true,startDragMc:true,points,feedback:{key:b.key,spriteId:b.spriteId,kind:b.kind,frame:local,closing:b.kind==='wrong'&&local>b.hold,serial:1},selectionSerial:1};
 }else if(domain==='sprite-213'){
  if(context.scenario!=='help')throw Error('invalid-p041-help-scenario');s={...s,phase:'quiz-held',mainFrame:230,help:true,quizSection:true,handlesEnabled:true};
 }else{
  if(!['source-question','source-alternate-path'].includes(context.scenario)||(!['root','sprite-17','sprite-7','sprite-223'].includes(domain)))throw Error('invalid-p041-main-scenario');const main=domain==='sprite-223'?frame:domain==='sprite-7'?230:1,post=main>230,alternate=context.scenario==='source-alternate-path';
  // Static engineering entries choose an explicit, reachable correct pair for
  // postquiz. Live My Lesson always retains the learner's actual released y.
  s={...s,mainFrame:main,phase:main<230?'prequiz':main===230?'quiz-held':main===353?'ended':'postquiz',quizSection:main===230,helpEnabled:main===230,handlesEnabled:main===230,doneClicked:post,quizTryCount:post?1:0,startDragMc:post,points:post?[S.drag.targets[alternate?2:0],S.drag.targets[alternate?3:1]]:s.points};
 }
 return p041View(s,{...context,frame,frameDomain:domain},ready);
}
export type P041View=ReturnType<typeof p041View>;
