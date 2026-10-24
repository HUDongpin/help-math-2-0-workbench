import type {RuntimeContext} from './contract';
import {p049Initial,p049Reduce,P049_ANSWER_DIGITS,P049_QUESTION_STOPS,type P049State} from './nms-l02-p049-practice-v1';
export const P049_SOURCE_SHA256='896e38a05c5e6392f7e9284aa278a5b7e10c13b15f7911fa09d1dc9b1de865b2';
// Sprite20 is retained library evidence, outside the selected root graph.
export const P049_FRAME_DOMAINS={root:10,'sprite-156':435,'sprite-8':5,'sprite-35':5,'sprite-72':20,'sprite-74':55,'sprite-109':1,'sprite-117':5,'sprite-131':1,'sprite-143':20,'sprite-153':20} as const;
export const P049_SCENARIOS=['source-inspection','question-1','question-2','question-3','answer-1','answer-2','answer-3','correct-feedback','first-wrong','second-wrong','help-example','hint-example','all-correct-outro','retry-outro','click-inspection'] as const;
const finish=(s:P049State)=>p049Reduce(s,{type:'phase-finished',token:s.token});
function correct(s:P049State){const digits=P049_ANSWER_DIGITS[s.question];return p049Reduce(p049Reduce(p049Reduce(s,{type:'input',field:0,value:digits[0]}),{type:'input',field:1,value:digits[1]}),{type:'submit'});}
function twiceWrong(s:P049State){return p049Reduce(p049Reduce(p049Reduce(s,{type:'submit'}),{type:'close-hint'}),{type:'submit'});}
/** Explicit native inspection recipes. Frame seeking is not an executed source trace. */
export function p049ModuleFrame(frame:number,context:RuntimeContext){
 const domain=context.frameDomain??'sprite-156',rootFrame=domain==='root'?frame:6;
 if(!Object.hasOwn(P049_FRAME_DOMAINS,domain)||!Number.isSafeInteger(frame)||frame<1||frame>P049_FRAME_DOMAINS[domain as keyof typeof P049_FRAME_DOMAINS]
  ||context.frame!==frame||!['en','es'].includes(context.lang)||!P049_SCENARIOS.some(x=>x===context.scenario)
  ||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0
  ||(context.rootFrame!==undefined&&context.rootFrame!==rootFrame))throw Error('P049_QUERY_IDENTITY');
 let state:P049State=p049Initial(context.replay??0),mainFrame:number|null=327;
 const requireDomain=(expected:string)=>{if(domain!==expected)throw Error('P049_QUERY_SCENARIO_DOMAIN');};
 const question=(q:0|1|2)=>{let s=finish(p049Initial(context.replay??0));for(let i=0;i<q;i++)s=finish(finish(correct(s)));return s;};
 const scenario=context.scenario;
 if(scenario==='source-inspection'){
  if(domain!=='root'&&domain!=='sprite-156')throw Error('P049_QUERY_SCENARIO_DOMAIN');
  mainFrame=domain==='root'?(frame<6?null:1):frame;
  if(mainFrame!==null&&mainFrame>=327)state=question(0);
 }else if(scenario.startsWith('question-')||scenario.startsWith('answer-')){
  requireDomain('sprite-156');const q=(Number(scenario.at(-1))-1) as 0|1|2;state=question(q);mainFrame=frame;
  if(scenario.startsWith('question-')){if(frame!==P049_QUESTION_STOPS[q])throw Error('P049_QUERY_ENTRY');}
  else {const end=q===2?385:P049_QUESTION_STOPS[q+1]!-1;if(frame<=P049_QUESTION_STOPS[q]||frame>end)throw Error('P049_QUERY_ENTRY');state=finish(correct(state));}
 }else if(scenario==='correct-feedback'){
  const q=domain==='sprite-72'?0:domain==='sprite-143'?1:domain==='sprite-153'?2:null;
  if(q===null)throw Error('P049_QUERY_SCENARIO_DOMAIN');state=question(q);mainFrame=P049_QUESTION_STOPS[q];if(frame>=2)state=correct(state);
  // Source callback20 precedes nonzero PCM; this inspection does not invent audio completion.
 }else if(scenario==='first-wrong'||scenario==='second-wrong'){
  requireDomain('sprite-74');state=question(0);if(frame>=2)state=scenario==='first-wrong'?p049Reduce(state,{type:'submit'}):twiceWrong(state);
 }else if(scenario==='help-example'||scenario==='hint-example'){
  requireDomain(scenario==='help-example'?'sprite-109':'sprite-131');state=question(0);
  state=scenario==='help-example'?p049Reduce(state,{type:'help',open:true}):p049Reduce(state,{type:'submit'});
 }else if(scenario==='all-correct-outro'||scenario==='retry-outro'){
  requireDomain('sprite-156');const all=scenario==='all-correct-outro';if(frame<(all?386:411))throw Error('P049_QUERY_ENTRY');state=question(0);
  for(let i=0;i<3;i++)state=finish(finish(all?correct(state):twiceWrong(state)));
  mainFrame=frame;if(frame===435)state=finish(state);
 }else if(scenario==='click-inspection'){
  if(!['sprite-8','sprite-35','sprite-117'].includes(domain))throw Error('P049_QUERY_SCENARIO_DOMAIN');state=question(0);
  if(domain==='sprite-117')state=p049Reduce(state,{type:'submit'});
 }
 return {animationId:'shared-nms002-l02-p049',sourceSha256:P049_SOURCE_SHA256,frame,frameDomain:domain,rootFrame,mainFrame,state,scenario,language:context.lang,seed:context.seed,replay:context.replay??0,
  postStopInspection:scenario==='source-inspection'&&mainFrame!==null&&mainFrame>327,queryKind:'deterministic-modern-inspection' as const};
}
