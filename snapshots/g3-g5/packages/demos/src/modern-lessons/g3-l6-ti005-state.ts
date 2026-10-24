import type {RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextBinding,TextPresentationSnapshot} from '../lesson-text-contract';
import {buildLessonTextSnapshot} from '../lesson-text-snapshot';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import sourceModule from '../modules/course-g03-l06-ti-005';
import {TI005_SOURCE as SOURCE} from './g3-l6-ti005.source-data';
export {SOURCE as TI005_SOURCE,sourceModule as TI005_MODULE};
export type Ti005QuestionId='Q1'|'Q2'|'Q3';
export type Ti005Fields=readonly[string,string,string];
export type Ti005Phase='intro'|'answering'|'correct-pending'|'wrong-open'|'ready-for-new'|'outro'|'ended';
export interface Ti005Practice {
 readonly sourceSeed:number;readonly random:number;readonly epoch:number;readonly initialized:boolean;readonly bag:readonly Ti005QuestionId[];
 readonly current:Ti005QuestionId|null;readonly draws:number;readonly fields:Ti005Fields;readonly quizTryCount:number;readonly phase:Ti005Phase;readonly helpOpen:boolean;
 readonly correctGate:Readonly<{epoch:number;question:Ti005QuestionId;draws:number;revisionFloor:number}>|null;
 readonly visualRevisionFloor:number;readonly wrongId:string|null;
}
const instance=(name:string)=>SOURCE.instances.find(i=>i.name===name)!;
export function ti005Audio(domain:string){const a=SOURCE.audio.find(a=>a.frameDomain===domain);if(!a)throw new Error('Missing TI005 source audio '+domain);return{source:a.source,sha256:a.sha256,firstFrame:a.firstFrame,lastFrame:a.lastFrame,language:'shared' as const,spokenLanguage:'undetermined' as const};}
const range=(first:number,end:number)=>Array.from({length:end-first},(_,i)=>first+i);
const activity=(id:string,name:string,first:number,end:number,audio=true):LessonTextActivityDefinition=>{const p=instance(name);return{id,sourceInstanceId:p.sourceInstanceId,frameDomain:p.frameDomain,parentLifetime:p.parentLifetime,parentFrames:range(Math.max(255,p.parentLifetime.firstFrame),p.parentLifetime.lastFrameExclusive),startFrame:first,endFrame:end,fps:12,...audio?{audio:ti005Audio(p.frameDomain)}:{}};};
export const TI005_ACTIVITIES:readonly LessonTextActivityDefinition[]=[
 activity('ti005-right-audio','right-audio',2,20),activity('ti005-right-visual','right-visual',2,25,false),
 ...SOURCE.wrongSegments.map(s=>activity(s.id,'wrong-audio',s.startFrame,s.endFrame)),
 ...SOURCE.buttons.map(b=>({id:b.id,sourceInstanceId:b.sourceInstanceId,frameDomain:b.frameDomain,parentLifetime:b.parentLifetime,parentFrames:range(b.parentLifetime.firstFrame,b.parentLifetime.lastFrameExclusive),startFrame:1,endFrame:5,fps:12,buttonPress:{sourceButtonId:b.sourceButtonId},audio:ti005Audio(b.frameDomain)})),
 // The two source demonstration clicks are real placed clips, not user input.
 ...SOURCE.demoPresses.flatMap(p=>p.parentFrames.map(frame=>({id:p.id+'-at-'+frame,sourceInstanceId:p.sourceInstanceId,frameDomain:p.frameDomain,parentLifetime:p.parentLifetime,parentFrames:[frame],startFrame:frame-p.parentLifetime.firstFrame+1,endFrame:5,fps:12,audio:ti005Audio(p.frameDomain)}))),
];
const blanks=():Ti005Fields=>['','',''];
export function createTi005Practice(seed:number,epoch=0):Ti005Practice{return{sourceSeed:seed>>>0,random:seed>>>0,epoch,initialized:false,bag:[],current:null,draws:0,fields:blanks(),quizTryCount:0,phase:'intro',helpOpen:false,correctGate:null,visualRevisionFloor:-1,wrongId:null};}
function randomNext(value:number){return(Math.imul(value,1664525)+1013904223)>>>0;}
function draw(s:Ti005Practice):Ti005Practice{if(!s.bag.length)return s;const random=randomNext(s.random),bag=[...s.bag],index=Math.floor(random/4294967296*bag.length),[current]=bag.splice(index,1);return{...s,random,bag,current:current!,draws:s.draws+1,fields:blanks(),phase:'answering',helpOpen:false,correctGate:null};}
export function synchronizeTi005(s:Ti005Practice,ctx:Pick<RuntimeContext,'seed'|'replay'|'frame'>):Ti005Practice{
 if(s.sourceSeed!==(ctx.seed>>>0)||s.epoch!==(ctx.replay??0))s=createTi005Practice(ctx.seed,ctx.replay??0);
 if(!s.initialized&&ctx.frame===255)return draw({...s,initialized:true,bag:['Q1','Q2','Q3'],quizTryCount:0});
 if(s.phase==='outro'&&ctx.frame===276)return{...s,phase:'ended',helpOpen:false,correctGate:null};return s;
}
export function ti005CurrentQuestion(s:Ti005Practice){return SOURCE.questions.find(q=>q.label===s.current);}
export function ti005Controls(s:Ti005Practice,frame:number){const quiz=frame===255&&s.initialized;return{edit:quiz&&s.phase==='answering'&&!s.helpOpen,done:quiz&&s.phase==='answering'&&!s.helpOpen,newProblem:quiz&&s.phase==='ready-for-new'&&s.bag.length>0&&!s.helpOpen,help:frame>=255&&frame<276&&['answering','ready-for-new','outro'].includes(s.phase)&&!s.helpOpen,wrongClose:quiz&&s.phase==='wrong-open'&&!s.helpOpen};}
export type Ti005Action=
 |{type:'edit';index:0|1|2;text:string}|{type:'submit';revisionFloor:number}|{type:'new'}|{type:'wrong-close'}|{type:'help-open'}|{type:'help-close'}
 |{type:'correct-complete';epoch:number;activity:LessonTextActivitySnapshot};
export function reduceTi005(s:Ti005Practice,frame:number,a:Ti005Action){
 const same={state:s,activities:[] as readonly string[],frameRequest:null as {fromFrame:number;toFrame:number;stopFrame:number}|null},controls=ti005Controls(s,frame);
 const accept=(state:Ti005Practice,activities:readonly string[]=[],outro=false)=>({state,activities,frameRequest:outro?{fromFrame:255,toFrame:256,stopFrame:276}:null});
 if(a.type==='help-open')return controls.help?accept({...s,helpOpen:true}):same;
 if(a.type==='help-close')return s.helpOpen&&frame>=255&&frame<276?accept({...s,helpOpen:false}):same;
 if(a.type==='edit'){if(!controls.edit||!Number.isInteger(a.index)||a.index<0||a.index>2||!/^[0-9]*$/.test(a.text))return same;const fields=[...s.fields] as [string,string,string];fields[a.index]=a.text;return accept({...s,fields});}
 if(a.type==='new')return controls.newProblem?accept(draw(s)):same;
 if(a.type==='submit'){
  const q=ti005CurrentQuestion(s);if(!controls.done||!q||!Number.isSafeInteger(a.revisionFloor))return same;
  const correct=s.fields.every((field,i)=>field===q.fields[i]);
  if(correct)return accept({...s,phase:'correct-pending',correctGate:{epoch:s.epoch,question:q.label,draws:s.draws,revisionFloor:a.revisionFloor},visualRevisionFloor:a.revisionFloor},['ti005-right-audio','ti005-right-visual']);
  const random=randomNext(s.random),variant=Math.floor(random/4294967296*4),wrongId=SOURCE.wrongSegments[variant]!.id,quizTryCount=s.quizTryCount+1;
  return accept({...s,random,quizTryCount,phase:'wrong-open',fields:quizTryCount>=2?q.fields:s.fields,wrongId,correctGate:null},[wrongId]);
 }
 if(a.type==='wrong-close'&&controls.wrongClose){
  if(s.quizTryCount>=2&&s.bag.length===0)return accept({...s,phase:'outro'},[],true);
  if(s.quizTryCount>=2)return accept({...s,phase:'ready-for-new',quizTryCount:0});
  return accept({...s,phase:'answering',fields:blanks()});
 }
 if(a.type==='correct-complete'&&s.phase==='correct-pending'&&frame===255&&s.correctGate){
  const gate=s.correctGate,d=TI005_ACTIVITIES.find(d=>d.id==='ti005-right-audio')!,value=a.activity;
  if(a.epoch!==s.epoch||gate.epoch!==s.epoch||gate.question!==s.current||gate.draws!==s.draws||value.id!==d.id||value.sourceInstanceId!==d.sourceInstanceId||value.frameDomain!==d.frameDomain||value.revision<=gate.revisionFloor||value.status!=='completed'||value.frame!==20)return same;
  const outro=s.bag.length===0;return accept({...s,correctGate:null,phase:outro?'outro':'ready-for-new'},[],outro);
 }
 return same;
}
export function ti005Intro(frame:number){return SOURCE.introSteps.find(s=>frame>=s.firstFrame&&frame<s.lastFrameExclusive);}
export function ti005Visual(s:Ti005Practice,activities:readonly LessonTextActivitySnapshot[]){const d=TI005_ACTIVITIES.find(a=>a.id==='ti005-right-visual')!,active=activities.find(a=>a.id===d.id&&a.sourceInstanceId===d.sourceInstanceId&&a.frameDomain===d.frameDomain&&a.revision>s.visualRevisionFloor);const source=active&&SOURCE.correctVisualSteps.find(p=>active.frame>=p.firstFrame&&active.frame<p.lastFrameExclusive);return{activity:active,visible:Boolean(active?.status==='playing'&&source?.visible),opacity:source?.opacity??0};}
const block=(id:string,sourceTextIds:readonly string[],role:'title'|'body'|'question'|'answer'|'label'|'feedback',sourceShapeIds?:readonly number[])=>({id,sourceTextIds,role,language:'en' as const,valueSource:'maintained-page-state' as const,...sourceShapeIds?{sourceShapeIds}:{} });
const entries=[block('title',SOURCE.header.sourceTextIds,'title'),block('instruction',SOURCE.instruction.sourceTextIds,'body'),
 ...SOURCE.moneyGroups.flatMap(g=>g.items.map(item=>block(item.id,[],'label',[item.shapeId]))),
 block('dollar-symbol',['character-48/run-0'],'label'),block('decimal-point',[],'label',[37,67]),
 ...[83,84,85].map((id,i)=>block('field-'+i,['character-'+id],'answer')),
 block('demo-dollars',['character-51/run-0'],'answer'),block('demo-tenths',['character-53/run-0','character-55'],'answer'),block('demo-hundredths',['character-56'],'answer'),
 block('done',['character-47/run-0'],'label'),block('new',['character-45/run-0','character-62/run-0'],'label'),block('help',['character-4/run-0','character-5/run-0'],'label'),block('close',['character-92/run-0'],'label'),
 block('wrong',['character-118/run-0'],'feedback'),block('correct',['character-65/run-0'],'feedback'),block('help-instruction',SOURCE.helpInstruction.sourceTextIds,'body'),block('help-sum',SOURCE.textDefinitions.find(t=>t.characterId===107)!.runs.map(r=>r.sourceTextId),'answer')];
export const TI005_BINDING:LessonTextBinding={schemaVersion:1,version:'g3-l6-ti005-native-money-v1',placementId:SOURCE.placementId,animationId:SOURCE.animationId,sourceSwfSha256:SOURCE.sourceSwfSha256,template:'complex-figure',blocks:entries.map((b,readingOrder)=>({...b,readingOrder}))};
export function ti005Snapshot(state:SourceStaticCanvasFrameState,ctx:RuntimeContext,practice=createTi005Practice(ctx.seed,ctx.replay??0),activities:readonly LessonTextActivitySnapshot[]=[]):TextPresentationSnapshot{
 const expected=sourceModule.getFrameState(ctx.frame,ctx),frame=expected.frame,s=synchronizeTi005(practice,ctx),intro=ti005Intro(frame),controls=ti005Controls(s,frame),visual=ti005Visual(s,activities);
 const valid=Boolean(state&&state.status==='ready'&&expected.status==='ready'&&state.animationId===SOURCE.animationId&&state.sourceSwfSha256===SOURCE.sourceSwfSha256&&state.frame===frame&&state.frameDomain===SOURCE.domain&&(ctx.frameDomain??SOURCE.domain)===SOURCE.domain&&state.rootFrame===6&&(ctx.rootFrame===undefined||ctx.rootFrame===6)&&state.scenario==='source-static-frame'&&ctx.scenario===state.scenario&&state.language==='en'&&ctx.lang==='en'&&state.seed===expected.seed);
 const values:Record<string,{text:string;visible:boolean}>={title:{text:SOURCE.header.text,visible:true},instruction:{text:SOURCE.instruction.text,visible:frame>=5},'dollar-symbol':{text:'$',visible:Boolean(intro?.fieldsVisible)||frame>=255},'decimal-point':{text:'.',visible:Boolean(intro?.fieldsVisible)||frame>=255},done:{text:'Done',visible:frame>=11},new:{text:'New Problem',visible:frame>=11},help:{text:'Need More Help',visible:frame>=255&&frame<276},close:{text:'Close',visible:s.helpOpen||controls.wrongClose},wrong:{text:'Oops! Try again',visible:s.phase==='wrong-open'},correct:{text:'correct!!!',visible:visual.visible},'help-instruction':{text:SOURCE.helpInstruction.text.replace('values.Example:','values. Example:'),visible:s.helpOpen},'help-sum':{text:'$3.00 + $0.25 + $0.10 + $0.05 + $0.06 = $3.46',visible:s.helpOpen}};
 for(const g of SOURCE.moneyGroups)for(const item of g.items)values[item.id]={text:item.label,visible:g.id==='intro'?Boolean(intro&&intro.moneyOpacity>0):g.id==='help'?s.helpOpen:frame>=255&&s.current===g.id};
 for(let i=0;i<3;i++){values['field-'+i]={text:s.fields[i]!,visible:frame>=255&&s.fields[i]!.length>0};values[['demo-dollars','demo-tenths','demo-hundredths'][i]!]={text:intro?.fields[i]??'',visible:Boolean(intro?.fieldsVisible&&intro.fields[i])};}
 const snapshot=buildLessonTextSnapshot(TI005_BINDING,{...ctx,frame,frameDomain:SOURCE.domain,rootFrame:6,scenario:'source-static-frame',lang:state?.language??ctx.lang,seed:expected.seed},values);return valid?snapshot:{...snapshot,status:'blocked',blockers:['exact-source-runtime-identity-mismatch'],blocks:snapshot.blocks.map(b=>({...b,visible:false}))};
}
