import type {RuntimeContext} from './contract';
import {p048Initial,p048Reduce,type P048State} from './nms-l02-p048-practice-v1';
export const P048_SOURCE_SHA256='18786203d58efb8aa54c3701e72838887d0702ff03d68819830938a252facce7';
export const P048_FRAME_DOMAINS={root:10,'sprite-498':363,'sprite-442':20,'sprite-444':55,'sprite-448':25,'sprite-450':25,'sprite-488':1} as const;
export const P048_SCENARIOS=['source-inspection','first-correct','first-wrong','second-wrong-reveal','help-example','all-questions-complete'] as const;
const begin=(s:P048State)=>p048Reduce(s,{type:'intro-finished',token:s.token});
const finish=(s:P048State)=>p048Reduce(s,{type:'phase-finished',token:s.token});
/** Explicit native inspection recipes, never proof of Flash execution or natural traces.
 * Nested frame identities stay separate from the source ten-frame root timeline.
 */
export function p048ModuleFrame(frame:number,context:RuntimeContext){
 const domain=context.frameDomain??'sprite-498',rootFrame=domain==='root'?frame:6;
 if(!Object.hasOwn(P048_FRAME_DOMAINS,domain)||!Number.isSafeInteger(frame)||frame<1||frame>P048_FRAME_DOMAINS[domain as keyof typeof P048_FRAME_DOMAINS]||context.frame!==frame||!['en','es'].includes(context.lang)||!P048_SCENARIOS.some(s=>s===context.scenario)||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0||(context.rootFrame!==undefined&&context.rootFrame!==rootFrame))throw Error('P048_QUERY_IDENTITY');
 let state:P048State={...p048Initial(context.seed),replay:context.replay??0},mainFrame:number|null=330;
 const requireDomain=(expected:string)=>{if(domain!==expected)throw Error('P048_QUERY_SCENARIO_DOMAIN');};
 if(context.scenario==='source-inspection'){
  if(domain!=='root'&&domain!=='sprite-498')throw Error('P048_QUERY_SCENARIO_DOMAIN');
  mainFrame=domain==='root'?(frame<6?null:1):frame;
  if(mainFrame!==null&&mainFrame>=330)state=begin(state);
 }else{
  state=begin(state);
  switch(context.scenario){
   case 'first-correct':
    if(domain!=='sprite-442'&&domain!=='sprite-448')throw Error('P048_QUERY_SCENARIO_DOMAIN');
    if(frame>=2)state=p048Reduce(p048Reduce(state,{type:'input',value:state.target!}),{type:'submit'});
    if(domain==='sprite-448'&&frame===25)state=finish(state);
    break;
   case 'first-wrong':requireDomain('sprite-444');if(frame>=2)state=p048Reduce(state,{type:'submit'});break;
   case 'second-wrong-reveal':
    requireDomain('sprite-450');
    state=p048Reduce(p048Reduce(p048Reduce(state,{type:'submit'}),{type:'close-feedback'}),{type:'submit'});
    if(frame>=2)state=p048Reduce(state,{type:'close-feedback'});
    if(frame===25)state=finish(state);
    break;
   case 'help-example':requireDomain('sprite-488');state=p048Reduce(state,{type:'help',open:true});break;
   case 'all-questions-complete':
    requireDomain('sprite-498');if(frame<330)throw Error('P048_QUERY_COMPLETION_ENTRY');
    for(let i=0;i<3;i++)state=finish(p048Reduce(p048Reduce(state,{type:'input',value:state.target!}),{type:'submit'}));
    mainFrame=frame;if(frame===363)state=finish(state);break;
  }
 }
 return {animationId:'shared-nms002-l02-p048',sourceSha256:P048_SOURCE_SHA256,frame,frameDomain:domain,rootFrame,mainFrame,state,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,postStopInspection:context.scenario==='source-inspection'&&mainFrame!==null&&mainFrame>330,queryKind:'deterministic-modern-inspection' as const};
}
