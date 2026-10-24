import type {RuntimeContext} from './contract';
import {p047Initial,p047FinishPhase,p047Select,p047Drop,p047Help,P047_CARDS,type P047Practice} from './nms-l02-p047-practice-v1';
export const P047_SOURCE_SHA256='6298123b7431ed8aad86a409125c7db979bfeeaf272efd67188d12f66e2d7df6';
export const P047_FRAME_DOMAINS=Object.freeze({root:10,'sprite-81':188,'sprite-76':25,'sprite-78':20,'sprite-80':55,'sprite-35':1});
export const P047_SCENARIOS=Object.freeze(['source-inspection','first-correct','first-wrong','help-example','celebration','all-cards-complete']as const);
const finish=(s:P047Practice)=>p047FinishPhase(s,s.phaseToken);
/** Deterministic inspection recipes; not original runtime traversal. */
export function p047ModuleFrame(frame:number,context:RuntimeContext){
 const domain=context.frameDomain??'sprite-81',rootFrame=domain==='root'?frame:6;
 if(!Object.hasOwn(P047_FRAME_DOMAINS,domain)||!Number.isSafeInteger(frame)||frame<1||frame>P047_FRAME_DOMAINS[domain as keyof typeof P047_FRAME_DOMAINS]||context.frame!==frame||!['en','es'].includes(context.lang)||!P047_SCENARIOS.some(s=>s===context.scenario)||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0||context.rootFrame!==undefined&&context.rootFrame!==rootFrame)throw Error('P047_QUERY_IDENTITY');
 let state:P047Practice=Object.freeze({...p047Initial(context.seed),replay:context.replay??0}),mainFrame:number|null=140;
 const requireDomain=(value:string)=>{if(domain!==value)throw Error('P047_QUERY_SCENARIO_DOMAIN');};
 if(context.scenario==='source-inspection'){
  if(!['root','sprite-81'].includes(domain))throw Error('P047_QUERY_SCENARIO_DOMAIN');
  mainFrame=domain==='root'?(frame<6?null:1):frame;if(mainFrame!==null&&mainFrame>=140)state=finish(state);
 }else{
  state=finish(state);
  switch(context.scenario){
   case 'first-correct':requireDomain('sprite-78');if(frame>=2)state=p047Drop(p047Select(state,1),4);break;
   case 'first-wrong':requireDomain('sprite-80');if(frame>=2)state=p047Drop(p047Select(state,1),0);break;
   case 'help-example':requireDomain('sprite-35');state=p047Help(state,true);break;
   case 'celebration':case 'all-cards-complete':
    requireDomain(context.scenario==='celebration'?'sprite-76':'sprite-81');
    if(context.scenario==='all-cards-complete'&&frame<140)throw Error('P047_QUERY_COMPLETION_ENTRY');
    for(const card of P047_CARDS)state=finish(p047Drop(p047Select(state,card.id),card.tick));
    if(context.scenario==='celebration'){if(frame===1)state=Object.freeze({...state,phase:'correct-feedback'});if(frame===25)state=finish(state);}
    else {state=finish(state);mainFrame=frame;if(frame===188)state=finish(state);}break;
  }
 }
 return Object.freeze({animationId:'shared-nms002-l02-p047',sourceSha256:P047_SOURCE_SHA256,frame,frameDomain:domain,rootFrame,mainFrame,state,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,postStopInspection:context.scenario==='source-inspection'&&mainFrame!==null&&mainFrame>140,queryKind:'deterministic-modern-inspection' as const});
}
