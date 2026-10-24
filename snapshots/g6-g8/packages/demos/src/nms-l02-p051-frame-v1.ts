import type {RuntimeContext} from './contract';
import {p051Initial,p051Reduce,type P051State} from './nms-l02-p051-practice-v1';
export const P051_SOURCE_SHA256='9c4c9857bb497497b4301a7b1cfec475b5f7bdf9d2cecabcd779fbd887de5d1f';
/** Only the main page and selected feedback domains. Unstarted decoration timelines are excluded. */
export const P051_FRAME_DOMAINS={root:10,'sprite-257':503,'sprite-248':15,'sprite-250':20,'sprite-256':25} as const;
export const P051_SCENARIOS=['source-inspection','practice','wrong-feedback','correct-feedback','completion-feedback','all-correct-outro'] as const;
const finish=(state:P051State)=>p051Reduce(state,{type:'finish',token:state.token});
function ready(replay:number){return finish({...p051Initial(),replay});}
function allCorrect(replay:number){
 let state=ready(replay);
 for(const item of [0,2,3,5,8])state=finish(p051Reduce(state,{type:'drop',item,target:item}));
 return state;
}
/** Deterministic native inspection recipes; querying a frame does not execute a Flash trace. */
export function p051ModuleFrame(frame:number,context:RuntimeContext){
 const domain=context.frameDomain??'sprite-257';
 const rootFrame=domain==='root'?frame:6,replay=context.replay??0;
 if(!Object.hasOwn(P051_FRAME_DOMAINS,domain)||!Number.isSafeInteger(frame)||frame<1
  ||frame>P051_FRAME_DOMAINS[domain as keyof typeof P051_FRAME_DOMAINS]
  ||context.frame!==frame||!['en','es'].includes(context.lang)
  ||!P051_SCENARIOS.some(scenario=>scenario===context.scenario)
  ||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff
  ||!Number.isSafeInteger(replay)||replay<0
  ||(context.rootFrame!==undefined&&context.rootFrame!==rootFrame))throw Error('P051_QUERY_IDENTITY');
 const scenario=context.scenario;
 const requireDomain=(...ids:string[])=>{if(!ids.includes(domain))throw Error('P051_QUERY_SCENARIO_DOMAIN');};
 let state:P051State={...p051Initial(),replay},mainFrame:number|null=485;
 switch(scenario){
  case 'source-inspection':
   requireDomain('root','sprite-257');mainFrame=domain==='root'?(frame<6?null:1):frame;
   if(mainFrame!==null&&mainFrame>=485)state=ready(replay);
   break;
  case 'practice':
   requireDomain('sprite-257');if(frame!==485)throw Error('P051_QUERY_ENTRY');state=ready(replay);break;
  case 'wrong-feedback':
   requireDomain('sprite-248');state=ready(replay);
   if(frame>=2)state=p051Reduce(state,{type:'drop',item:1,target:null});break;
  case 'correct-feedback':
   requireDomain('sprite-250');state=ready(replay);
   if(frame>=2)state=p051Reduce(state,{type:'drop',item:0,target:0});break;
  case 'completion-feedback':requireDomain('sprite-256');state=allCorrect(replay);break;
  case 'all-correct-outro':
   requireDomain('sprite-257');if(frame<486)throw Error('P051_QUERY_ENTRY');
   mainFrame=frame;state=finish(allCorrect(replay));if(frame===503)state=finish(state);break;
 }
 return {animationId:'shared-nms002-l02-p051',sourceSha256:P051_SOURCE_SHA256,frame,frameDomain:domain,
  rootFrame,mainFrame,state,scenario,language:context.lang,seed:context.seed,replay,
  postStopInspection:scenario==='source-inspection'&&mainFrame!==null&&mainFrame>485,
  queryKind:'deterministic-modern-inspection' as const};
}
