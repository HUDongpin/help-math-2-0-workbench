import type {RuntimeContext} from './contract';
import {p044Initial,p044Enter,p044Question,p044SetParts,p044TogglePart,p044Check,p044CloseWrong,p044CloseCorrect,p044FinishReveal,p044NewWhole,p044Help,p044FinishContinuation,type P044Practice} from './nms-l02-p044-practice-v1';
export const P044_SOURCE_SHA256='e31d34af5c1e7c5eda49981b7de68941b3f453e8709c0de0fff10ced4693f622';
export const P044_FRAME_DOMAINS=Object.freeze({root:10,'sprite-243':393,'sprite-219':20,'sprite-234':1,'sprite-235':25,'sprite-238':1,'sprite-29':1});
export const P044_SCENARIOS=Object.freeze(['source-inspection','partition-inspection','partition-selected','first-wrong','second-wrong-reveal','first-correct','help-example','four-questions-complete']as const);
function correct(state:P044Practice){const q=p044Question(state);state=p044SetParts(state,q.denominator);for(let n=1;n<=q.numerator;n++)state=p044TogglePart(state,n);return p044Check(state);}
/** Explicit modern inspection recipes; source-local seeks never invent progress. */
export function p044ModuleFrame(frame:number,context:RuntimeContext){
  const frameDomain=context.frameDomain??'sprite-243',rootFrame=frameDomain==='root'?frame:6;
  if(!Object.hasOwn(P044_FRAME_DOMAINS,frameDomain)||!Number.isSafeInteger(frame)||frame<1
    ||frame>P044_FRAME_DOMAINS[frameDomain as keyof typeof P044_FRAME_DOMAINS]||context.frame!==frame
    ||!['en','es'].includes(context.lang)||!P044_SCENARIOS.some(s=>s===context.scenario)
    ||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0
    ||context.rootFrame!==undefined&&context.rootFrame!==rootFrame)throw Error('P044_QUERY_IDENTITY');
  let state:P044Practice=Object.freeze({...p044Initial(context.seed),replay:context.replay??0});
  let mainFrame:number|null=361;
  const requireDomain=(domains:readonly string[])=>{if(!domains.includes(frameDomain))throw Error('P044_QUERY_SCENARIO_DOMAIN');};
  if(context.scenario==='source-inspection'){
    requireDomain(['root','sprite-243']);mainFrame=frameDomain==='root'?(frame<6?null:1):frame;
    if(mainFrame!==null&&mainFrame>=361)state=p044Enter(state);
  }else{
    state=p044Enter(state);
    switch(context.scenario){
      case 'partition-inspection':case 'partition-selected':
        requireDomain(['sprite-219']);state=p044SetParts(state,frame);if(context.scenario==='partition-selected')state=p044TogglePart(state,1);break;
      case 'first-wrong':requireDomain(['sprite-234']);state=p044Check(state);break;
      case 'second-wrong-reveal':
        requireDomain(['sprite-235']);state=p044Check(p044CloseWrong(p044Check(state)));if(frame===25)state=p044FinishReveal(state);break;
      case 'first-correct':requireDomain(['sprite-238']);state=correct(state);break;
      case 'help-example':requireDomain(['sprite-29']);state=p044Help(state,true);break;
      case 'four-questions-complete':
        requireDomain(['sprite-243']);if(frame<361)throw Error('P044_QUERY_COMPLETION_ENTRY');
        for(let i=0;i<4;i++){state=p044CloseCorrect(correct(state));if(i<3)state=p044NewWhole(state);}
        mainFrame=frame;if(frame===393)state=p044FinishContinuation(state);break;
    }
  }
  return Object.freeze({animationId:'shared-nms002-l02-p044',sourceSha256:P044_SOURCE_SHA256,
    frame,frameDomain,rootFrame,mainFrame,state,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,
    postStopInspection:context.scenario==='source-inspection'&&mainFrame!==null&&mainFrame>361,
    queryKind:'deterministic-modern-inspection' as const});
}
