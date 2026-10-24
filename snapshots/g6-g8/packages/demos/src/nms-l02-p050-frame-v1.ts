import type {RuntimeContext} from './contract';
import {p050Initial,p050Reduce,type P050State} from './nms-l02-p050-practice-v1';
export const P050_SOURCE_SHA256='28600adb8cd9a280e5052a25e448b7c71fc4b85ac4a5e89f6a73f23d7768a197';
/** Native inspection domains currently supported. Library-only timelines remain source evidence. */
export const P050_FRAME_DOMAINS={root:10,'sprite-94':260,'sprite-35':1,'sprite-88':15,'sprite-91':20,'sprite-85':25,'sprite-89':25} as const;
export const P050_SCENARIOS=['source-inspection','practice','wrong-feedback','correct-feedback','help-example','completion-feedback','all-correct-outro'] as const;
const finish=(state:P050State)=>p050Reduce(state,{type:'finish',token:state.token});
function ready(replay:number){return finish({...p050Initial(),replay});}
function allCorrect(replay:number){let state=ready(replay);for(const item of [1,2,3,4,5])state=finish(p050Reduce(state,{type:'drop',item,target:item}));return state;}
/** A deterministic inspection recipe is not an executed original-runtime trace. */
export function p050ModuleFrame(frame:number,context:RuntimeContext){
 const domain=context.frameDomain??'sprite-94',rootFrame=domain==='root'?frame:6,replay=context.replay??0;
 if(!Object.hasOwn(P050_FRAME_DOMAINS,domain)||!Number.isSafeInteger(frame)||frame<1||frame>P050_FRAME_DOMAINS[domain as keyof typeof P050_FRAME_DOMAINS]
  ||context.frame!==frame||!['en','es'].includes(context.lang)||!P050_SCENARIOS.some(value=>value===context.scenario)
  ||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||!Number.isSafeInteger(replay)||replay<0
  ||(context.rootFrame!==undefined&&context.rootFrame!==rootFrame))throw Error('P050_QUERY_IDENTITY');
 const scenario=context.scenario;
 const requireDomain=(...ids:string[])=>{if(!ids.includes(domain))throw Error('P050_QUERY_SCENARIO_DOMAIN');};
 let state:P050State={...p050Initial(),replay},mainFrame:number|null=209;
 switch(scenario){
  case 'source-inspection':
   requireDomain('root','sprite-94');mainFrame=domain==='root'?(frame<6?null:1):frame;
   if(mainFrame!==null&&mainFrame>=209)state=ready(replay);
   break;
  case 'practice':requireDomain('sprite-94');if(frame!==209)throw Error('P050_QUERY_ENTRY');state=ready(replay);break;
  case 'wrong-feedback':requireDomain('sprite-88');state=ready(replay);if(frame>=2)state=p050Reduce(state,{type:'drop',item:1,target:null});break;
  case 'correct-feedback':requireDomain('sprite-91');state=ready(replay);if(frame>=2)state=p050Reduce(state,{type:'drop',item:1,target:1});break;
  case 'help-example':requireDomain('sprite-35');state=p050Reduce(ready(replay),{type:'help',open:true});break;
  case 'completion-feedback':requireDomain('sprite-85','sprite-89');state=allCorrect(replay);break;
  case 'all-correct-outro':
   requireDomain('sprite-94');if(frame<210)throw Error('P050_QUERY_ENTRY');mainFrame=frame;state=finish(allCorrect(replay));if(frame===260)state=finish(state);break;
 }
 return {animationId:'shared-nms002-l02-p050',sourceSha256:P050_SOURCE_SHA256,frame,frameDomain:domain,rootFrame,mainFrame,state,scenario,language:context.lang,seed:context.seed,replay,
  postStopInspection:scenario==='source-inspection'&&mainFrame!==null&&mainFrame>209,queryKind:'deterministic-modern-inspection' as const};
}
