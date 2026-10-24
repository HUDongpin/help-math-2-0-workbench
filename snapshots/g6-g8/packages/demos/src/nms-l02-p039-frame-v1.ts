import type {RuntimeContext} from './contract';
import {P039_INTRO_SOURCE as SOURCE} from './generated/nms-l02-p039-intro-source-v1';
import {P039_ID,p039Initial,p039Advance,p039SetPercent,p039Submit,p039CloseWrong,p039Reset,type P039State} from './nms-l02-p039-state-v1';
export const P039_SCENARIOS=Object.freeze([
 {id:'source-practice',label:'Source percent practice'},
 {id:'correct-25',label:'Correct answer: 25 percent'},
 {id:'wrong-first',label:'First incorrect answer'},
 {id:'retry',label:'Close first feedback and retry'},
 {id:'reset-after-wrong',label:'Reset preserves the first wrong attempt'},
 {id:'wrong-second',label:'Second incorrect answer'},
 {id:'corrected-reveal-25',label:'Qualified correction: reveal 25 percent'},
].map(s=>Object.freeze(s)));
/** Visual domains. Off-stage coach230/55frames is transported independently;
 * dormant236/20frames is not activated. Both remain in source audit scope. */
export const P039_FRAME_DOMAINS=Object.freeze({root:10,'sprite-237':579,'sprite-227':15,'sprite-228':35,'sprite-234':13,'sprite-223':5});
const wrong=(s:P039State,percent:number)=>p039Submit(p039SetPercent(s,percent));
function practice(seed:number,replay:number){return p039Advance(p039Initial(seed,replay),545);}
function secondWrong(s:P039State){return wrong(p039CloseWrong(wrong(s,50)),75);}
function scenarioAtHold(s:P039State,scenario:string):P039State{
 switch(scenario){
  case'correct-25':return p039Submit(p039SetPercent(s,25));
  case'wrong-first':return wrong(s,50);
  case'retry':return p039CloseWrong(wrong(s,50));
  case'reset-after-wrong':return p039Reset(p039CloseWrong(wrong(s,50)));
  case'wrong-second':return secondWrong(s);
  case'corrected-reveal-25':return p039CloseWrong(secondWrong(s));
  default:return s;
 }
}
function outroEntry(s:P039State,scenario:string):P039State{
 if(scenario==='wrong-second'||scenario==='corrected-reveal-25')return p039Advance(p039CloseWrong(secondWrong(s)),33);
 const retry=['wrong-first','retry','reset-after-wrong'].includes(scenario)?p039CloseWrong(wrong(s,50)):s;
 return p039Advance(p039Submit(p039SetPercent(retry,25)),11);
}
export function p039ModuleFrame(frame:number,c:RuntimeContext){
 const frameDomain=c.frameDomain??'sprite-237',rootFrame=frameDomain==='root'?frame:6;
 const count=P039_FRAME_DOMAINS[frameDomain as keyof typeof P039_FRAME_DOMAINS];
 if(!Object.hasOwn(P039_FRAME_DOMAINS,frameDomain)||!Number.isSafeInteger(frame)||frame<1||frame>count||c.frame!==frame
  ||!['en','es'].includes(c.lang)||!P039_SCENARIOS.some(s=>s.id===c.scenario)||c.rootFrame!==undefined&&c.rootFrame!==rootFrame)throw Error('P039_QUERY_IDENTITY');
 const initial=p039Initial(c.seed,c.replay??0),hold=practice(c.seed,c.replay??0);
 let state:P039State=initial,localInvocation='main-intro',closePressFrame:number|null=null,actionDisposition='normal';
 if(frameDomain==='root'){localInvocation='root-only-main-entry';}
 else if(frameDomain==='sprite-237'){
  if(frame<546)state=p039Advance(initial,frame-1);
  else if(frame===546){state=scenarioAtHold(hold,c.scenario);localInvocation=c.scenario;}
  else {state=p039Advance(outroEntry(hold,c.scenario),frame-546);localInvocation=['wrong-second','corrected-reveal-25'].includes(c.scenario)?'canonical-corrected-outro':'canonical-correct-outro';}
 }else{
  state=hold;localInvocation='initial-child-placeholder';
  if(frameDomain==='sprite-223'){
   state=p039Advance(wrong(hold,50),20);closePressFrame=frame;localInvocation='held-close-button-after-first-wrong';actionDisposition='native-press-state-inspection';
  }else if(frame>1){
   if(frameDomain==='sprite-227'){const second=['wrong-second','corrected-reveal-25'].includes(c.scenario);state=p039Advance(second?secondWrong(hold):wrong(hold,50),frame-2);localInvocation=second?'second-wrong-popup':'first-wrong-popup';}
   else if(frameDomain==='sprite-234'){state=p039Advance(p039Submit(p039SetPercent(hold,25)),frame-2);localInvocation='canonical-correct-25';if(frame===13)actionDisposition='post-action-resume-main';}
   else {state=p039Advance(p039CloseWrong(secondWrong(hold)),frame-2);localInvocation='canonical-corrected-reveal-25';if(frame===35)actionDisposition='post-action-reset-child-1-resume-main';}
  }
 }
 const visible=frameDomain!=='root'||frame>=6;
 return Object.freeze({animationId:P039_ID,sourceSha256:SOURCE.sourceSha256,frame,frameDomain,rootFrame,mainFrame:visible?state.mainFrame:null,
  language:c.lang,seed:c.seed,replay:c.replay??0,scenario:c.scenario,queryKind:'source-local-inspection' as 'source-local-inspection'|'live-state',localInvocation,closePressFrame,actionDisposition,state});
}
export type P039FrameState=ReturnType<typeof p039ModuleFrame>;
export function p039LiveFrame(state:P039State,language:'en'|'es'):P039FrameState{
 if(!['en','es'].includes(language))throw Error('P039_LANGUAGE');
 return Object.freeze({animationId:P039_ID,sourceSha256:SOURCE.sourceSha256,frame:state.mainFrame,frameDomain:'sprite-237',rootFrame:6,mainFrame:state.mainFrame,
  language,seed:state.seed,replay:state.replay,scenario:'live-interaction',queryKind:'live-state',localInvocation:'live-state',closePressFrame:null,actionDisposition:'normal',state});
}
