import source from './source.generated.json';
import type {LessonTextActivitySnapshot} from '../../lesson-text-contract';
export const IN008_SOURCE=source;
export const QUIZ_FRAME=244;
export interface In008State {
 readonly seed:number;readonly random:number;readonly replay:number;readonly initialized:boolean;
 readonly bag:readonly number[];readonly current:number|null;readonly draws:number;readonly answer:string;
 readonly tries:number;readonly editable:boolean;readonly doneEnabled:boolean;readonly newEnabled:boolean;
 readonly correctVisible:boolean;readonly wrongVisible:boolean;readonly flash:boolean;readonly sourceRefillOnly:boolean;
 readonly activityEpoch:number;readonly pending:readonly CompletionGate[];
}
export interface CompletionGate {readonly id:string;readonly sourceInstanceId:string;readonly frameDomain:string;readonly endFrame:number;readonly epoch:number;readonly revisionFloor:number;}
export function createIn008(seed:number,replay=0):In008State {return {seed:seed>>>0,random:seed>>>0,replay,initialized:false,bag:[],current:null,draws:0,answer:'',tries:0,editable:false,doneEnabled:false,newEnabled:false,correctVisible:false,wrongVisible:false,flash:false,sourceRefillOnly:false,activityEpoch:0,pending:[]};}
const nextRandom=(v:number)=>(Math.imul(v,1664525)+1013904223)>>>0;
const fullBag=()=>source.questions.map((_,i)=>i);
function draw(s:In008State):In008State {
 const reset={...s,newEnabled:false,doneEnabled:true,answer:'',tries:0,sourceRefillOnly:false};
 // Source doGetRandQuiz has an if/else, not a second draw after refill.
 if(!s.bag.length)return {...reset,bag:fullBag(),sourceRefillOnly:true};
 const random=nextRandom(s.random),bag=[...s.bag],index=Math.floor(random/4294967296*bag.length),[current]=bag.splice(index,1);
 return {...reset,random,bag,current:current!,draws:s.draws+1,editable:true};
}
export function synchronizeIn008(s:In008State,context:{seed:number;replay?:number;frame:number}):In008State {
 if(s.seed!==(context.seed>>>0)||s.replay!==(context.replay??0))s=createIn008(context.seed,context.replay??0);
 return !s.initialized&&context.frame===QUIZ_FRAME?draw({...s,initialized:true,bag:fullBag()}):s;
}
export const in008Question=(s:In008State)=>s.current===null?null:source.questions[s.current]!;
export const in008Controls=(s:In008State,frame:number)=>({edit:frame===QUIZ_FRAME&&s.initialized&&s.editable,done:frame===QUIZ_FRAME&&s.initialized&&s.doneEnabled,newExpression:frame===QUIZ_FRAME&&s.initialized&&s.newEnabled,wrongClose:frame===QUIZ_FRAME&&s.wrongVisible});
export type In008Action={type:'edit';text:string}|{type:'submit';revisionFloor:number}|{type:'new'}|{type:'wrong-close'}|{type:'activity-complete';replay:number;epoch:number;activity:LessonTextActivitySnapshot};
function gate(id:string,name:string,endFrame:number,epoch:number,revisionFloor:number):CompletionGate {
 const p=source.instances.find(i=>i.name===name)!;
 return{id,sourceInstanceId:p.sourceInstanceId,frameDomain:p.frameDomain!,endFrame,epoch,revisionFloor};
}
export function reduceIn008(s:In008State,frame:number,action:In008Action):{state:In008State;activities:readonly string[]} {
 const same={state:s,activities:[] as readonly string[]},controls=in008Controls(s,frame),accept=(state:In008State,activities:readonly string[]=[])=>({state,activities});
 if(action.type==='edit')return controls.edit?accept({...s,answer:action.text}):same;
 if(action.type==='new')return controls.newExpression?accept(draw({...s,correctVisible:false,wrongVisible:false,flash:false,pending:[],activityEpoch:s.activityEpoch+1})):same;
 if(action.type==='submit'){
  const q=in008Question(s);if(!controls.done||!q||!Number.isSafeInteger(action.revisionFloor))return same;
  const epoch=s.activityEpoch+1,locked={...s,editable:false,doneEnabled:false,newEnabled:false,activityEpoch:epoch};
  // Both original values are strings; retain whitespace/leading-zero behavior.
  if(s.answer===q.answer){const pending=[gate('in008-correct','RightFeed',25,epoch,action.revisionFloor)];return accept({...locked,correctVisible:true,pending},pending.map(g=>g.id));}
  const tries=s.tries+1,random=nextRandom(s.random),segment=source.coachSegments[Math.floor(random/4294967296*4)]!,coach=gate(segment.id,'Coach_audio_1',segment.endFrame,epoch,action.revisionFloor),pending=tries===1?[coach,gate('in008-wrong-panel','WrongFeed',47,epoch,action.revisionFloor)]:[coach,gate('in008-flash','McFlash',7,epoch,action.revisionFloor)];
  return accept({...locked,random,tries,wrongVisible:tries===1,flash:tries!==1,pending},pending.map(g=>g.id));
 }
 function closeWrong(){return accept({...s,wrongVisible:false,answer:'',editable:s.tries<2,doneEnabled:s.tries<2,newEnabled:s.tries>=2,tries:s.tries>=2?0:s.tries,pending:s.pending.filter(g=>g.id!=='in008-wrong-panel')});}
 if(action.type==='wrong-close')return controls.wrongClose?closeWrong():same;
 if(action.type==='activity-complete'){
  if(frame!==QUIZ_FRAME||action.replay!==s.replay||action.epoch!==s.activityEpoch)return same;
  const a=action.activity,g=s.pending.find(g=>g.id===a.id);
  if(!g||g.epoch!==action.epoch||a.sourceInstanceId!==g.sourceInstanceId||a.frameDomain!==g.frameDomain||a.status!=='completed'||a.frame!==g.endFrame||!Number.isSafeInteger(a.revision)||a.revision<=g.revisionFloor)return same;
  const pending=s.pending.filter(p=>p!==g);
  if(g.id==='in008-correct')return accept({...s,pending,correctVisible:false,doneEnabled:false,newEnabled:true});
  if(g.id==='in008-wrong-panel')return closeWrong();
  if(g.id==='in008-flash')return accept({...s,pending,flash:false});
  const q=in008Question(s)!;return accept(s.tries===2?{...s,pending,answer:q.answer,editable:false,doneEnabled:false,newEnabled:true}:{...s,pending});
 }
 return same;
}
export function in008Intro(frame:number){
 const blocks=source.introBlocks.map(b=>({...b,visibleText:b.tokens.filter(t=>t.completeInkRanges.some(([a,b])=>frame>=a!&&frame<b!)).map(t=>t.text).join('')}));
 const value=(characters:readonly number[])=>blocks.find(b=>characters.includes(b.characterId)&&b.visibleText)?.visibleText??'';
 return{blocks,expression:value([76,105]),condition:value([78,104]),answer:frame<source.nativeAnswerRetirementFrame?value([96,97]):'',done:value([84]),newExpression:value([81]),instructions:[88,99,110].map(cid=>({characterId:cid,text:value([cid])}))};
}
