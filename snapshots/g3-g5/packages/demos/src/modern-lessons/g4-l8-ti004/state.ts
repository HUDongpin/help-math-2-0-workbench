import source from './source.generated.json';
import type {LessonTextActivitySnapshot} from '../../lesson-text-contract';
export const TI004_SOURCE=source;
export const QUIZ_FRAME=274;
export interface Ti004Gate {readonly id:string;readonly sourceInstanceId:string;readonly frameDomain:string;readonly endFrame:number;readonly questionEpoch:number;readonly revisionFloor:number;}
export interface Ti004State {
 readonly seed:number;readonly random:number;readonly replay:number;readonly initialized:boolean;
 readonly bag:readonly number[];readonly current:number|null;readonly draws:number;readonly answer:string;
 readonly tries:number;readonly editable:boolean;readonly doneEnabled:boolean;readonly newEnabled:boolean;readonly helpEnabled:boolean;
 readonly correct:boolean;readonly correctVisible:boolean;readonly wrongVisible:boolean;readonly wrongText:string;readonly flash:boolean;readonly helpVisible:boolean;
 readonly sourceRefillOnly:boolean;readonly questionEpoch:number;readonly pending:readonly Ti004Gate[];
}
export function createTi004(seed:number,replay=0):Ti004State {return {seed:seed>>>0,random:seed>>>0,replay,initialized:false,bag:[],current:null,draws:0,answer:'',tries:0,editable:false,doneEnabled:false,newEnabled:false,helpEnabled:false,correct:false,correctVisible:false,wrongVisible:false,wrongText:'',flash:false,helpVisible:false,sourceRefillOnly:false,questionEpoch:0,pending:[]};}
const nextRandom=(v:number)=>(Math.imul(v,1664525)+1013904223)>>>0;
const fullBag=()=>source.questions.map((_,i)=>i);
export const ti004Question=(s:Ti004State)=>s.current===null?null:source.questions[s.current]!;
function draw(s:Ti004State):Ti004State {
 const reset={...s,newEnabled:false,doneEnabled:true,helpEnabled:true,answer:'',tries:0,sourceRefillOnly:false};
 // Exact source if/else: refill itself does not draw or restore input mode.
 if(!s.bag.length)return {...reset,bag:fullBag(),sourceRefillOnly:true};
 const random=nextRandom(s.random),bag=[...s.bag],index=Math.floor(random/4294967296*bag.length),[current]=bag.splice(index,1),q=source.questions[current!]!;
 return {...reset,random,bag,current:current!,draws:s.draws+1,editable:true,wrongText:q.nativeFeedback1};
}
export function synchronizeTi004(s:Ti004State,c:{seed:number;replay?:number;frame:number}):Ti004State {if(s.seed!==(c.seed>>>0)||s.replay!==(c.replay??0))s=createTi004(c.seed,c.replay??0);return !s.initialized&&c.frame>=QUIZ_FRAME&&c.frame<=275?draw({...s,initialized:true,bag:fullBag(),questionEpoch:1}):s;}
export function ti004Controls(s:Ti004State,frame:number){const active=frame===QUIZ_FRAME&&s.initialized;return {edit:active&&s.editable,done:active&&s.doneEnabled,newExpression:active&&s.newEnabled,help:active&&s.helpEnabled,helpClose:active&&s.helpVisible,wrongClose:active&&s.wrongVisible};}
export type Ti004Action={type:'edit';text:string}|{type:'submit';revisionFloor:number}|{type:'new'}|{type:'help'}|{type:'help-close'}|{type:'wrong-close'}|{type:'activity-complete';replay:number;activity:LessonTextActivitySnapshot};
function gate(id:string,name:string,endFrame:number,s:Ti004State,revisionFloor:number):Ti004Gate {const i=source.instances.find(i=>i.name===name)!;return {id,sourceInstanceId:i.sourceInstanceId,frameDomain:i.frameDomain!,endFrame,questionEpoch:s.questionEpoch,revisionFloor};}
export function reduceTi004(s:Ti004State,frame:number,a:Ti004Action):{state:Ti004State;activities:readonly string[]} {
 const same={state:s,activities:[] as readonly string[]},controls=ti004Controls(s,frame),accept=(state:Ti004State,activities:readonly string[]=[])=>({state,activities});
 if(a.type==='edit')return controls.edit?accept({...s,answer:a.text}):same;
 if(a.type==='new')return controls.newExpression?accept(draw({...s,questionEpoch:s.questionEpoch+1,pending:[]})):same;
 if(a.type==='help')return controls.help?accept({...s,helpVisible:true,helpEnabled:false,editable:false,doneEnabled:false,newEnabled:false}):same;
 if(a.type==='help-close')return controls.helpClose?accept({...s,helpVisible:false,helpEnabled:true,editable:true,doneEnabled:true,newEnabled:s.correct}):same;
 if(a.type==='wrong-close'){
  if(!controls.wrongClose)return same;const reveal=s.tries>=2,q=ti004Question(s)!;
  return accept({...s,wrongVisible:false,answer:reveal?q.answer:'',editable:!reveal,doneEnabled:!reveal,newEnabled:reveal,helpEnabled:true,tries:reveal?0:s.tries});
 }
 if(a.type==='submit'){
  const q=ti004Question(s);if(!controls.done||!q||!Number.isSafeInteger(a.revisionFloor))return same;
  const locked={...s,editable:false,doneEnabled:false,newEnabled:false,helpEnabled:false};
  if(s.answer===q.answer){const g=gate('ti004-correct','RightFeed',25,s,a.revisionFloor);return accept({...locked,correct:true,correctVisible:true,pending:[...s.pending.filter(p=>p.id!==g.id),g]},[g.id]);}
  const tries=s.tries+1,panel=gate('ti004-wrong-panel','WrongFeed',47,s,a.revisionFloor);let random=s.random,extra:Ti004Gate;
  if(tries===1){random=nextRandom(random);const segment=source.coachSegments[Math.floor(random/4294967296*4)]!;extra=gate(segment.id,'Coach_audio_1',segment.endFrame,s,a.revisionFloor);}else extra=gate('ti004-flash','McFlash',7,s,a.revisionFloor);
  const pending=[...s.pending.filter(p=>p.id!==panel.id&&p.id!==extra.id),panel,extra];
  return accept({...locked,random,tries,wrongVisible:true,wrongText:tries===1?q.feedback:q.nativeFeedback1,flash:tries!==1,pending},[panel.id,extra.id]);
 }
 if(a.type==='activity-complete'){
  if(frame!==QUIZ_FRAME||a.replay!==s.replay)return same;const t=a.activity,g=s.pending.find(p=>p.id===t.id);
  if(!g||g.questionEpoch!==s.questionEpoch||t.sourceInstanceId!==g.sourceInstanceId||t.frameDomain!==g.frameDomain||t.status!=='completed'||t.frame!==g.endFrame||!Number.isSafeInteger(t.revision)||t.revision<=g.revisionFloor)return same;
  const pending=s.pending.filter(p=>p!==g);
  if(g.id==='ti004-correct')return accept({...s,pending,correctVisible:false,doneEnabled:false,newEnabled:true,helpEnabled:true});
  if(g.id==='ti004-wrong-panel')return accept({...s,pending}); // Source47 stop: panel stays until actual Close.
  if(g.id==='ti004-flash')return accept({...s,pending,flash:false});
  const q=ti004Question(s)!;return accept(s.tries===2?{...s,pending,answer:q.answer,editable:false,doneEnabled:false,newEnabled:true}:{...s,pending});
 }
 return same;
}
export function ti004Intro(frame:number){const blocks=source.introBlocks.map(b=>({...b,visibleText:b.tokens.filter(t=>t.completeInkRanges.some(([a,b])=>frame>=a!&&frame<b!)).map(t=>t.text).join('')}));const value=(c:number)=>blocks.find(b=>b.characterId===c&&b.visibleText)?.visibleText??'';return {blocks,expression:value(85),condition:value(87),answer:value(100)||value(101),done:value(93),newExpression:value(90),instructions:[81,102,108].map(c=>({characterId:c,text:value(c)}))};}
