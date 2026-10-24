import type {RuntimeContext} from './contract';
import {p045Initial,p045Enter,p045Question,p045Input,p045Check,p045CloseFeedback,p045FinishReveal,p045NewWhole,p045Help,p045FinishContinuation,type P045Practice} from './nms-l02-p045-practice-v1';
export const P045_SOURCE_SHA256='741913de5407656b5c20362d89762274bb04090a1685321cedc27e4ac00c1fcd';
export const P045_FRAME_DOMAINS=Object.freeze({root:10,'sprite-204':498,'sprite-189':25,'sprite-30':1});
export const P045_SCENARIOS=Object.freeze(['source-inspection','first-wrong','first-correct','second-wrong-reveal','help-example','three-questions-complete']as const);
function correct(state:P045Practice){const q=p045Question(state);return p045Check(p045Input(p045Input(state,'numerator',q.numerator),'denominator',q.denominator));}
/** Modern inspection recipes, not original runtime traversal or random-number parity. */
export function p045ModuleFrame(frame:number,context:RuntimeContext){
  const frameDomain=context.frameDomain??'sprite-204',rootFrame=frameDomain==='root'?frame:6;
  if(!Object.hasOwn(P045_FRAME_DOMAINS,frameDomain)||!Number.isSafeInteger(frame)||frame<1
    ||frame>P045_FRAME_DOMAINS[frameDomain as keyof typeof P045_FRAME_DOMAINS]||context.frame!==frame
    ||!['en','es'].includes(context.lang)||!P045_SCENARIOS.some(s=>s===context.scenario)
    ||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0
    ||context.rootFrame!==undefined&&context.rootFrame!==rootFrame)throw Error('P045_QUERY_IDENTITY');
  let state:P045Practice=Object.freeze({...p045Initial(context.seed),replay:context.replay??0});
  let mainFrame:number|null=450;
  const requireDomain=(domains:readonly string[])=>{if(!domains.includes(frameDomain))throw Error('P045_QUERY_SCENARIO_DOMAIN');};
  if(context.scenario==='source-inspection'){
    requireDomain(['root','sprite-204']);mainFrame=frameDomain==='root'?(frame<6?null:1):frame;
    if(mainFrame!==null&&mainFrame>=450)state=p045Enter(state);
  }else{
    state=p045Enter(state);
    switch(context.scenario){
      case 'first-wrong':case 'first-correct':
        requireDomain(['sprite-204']);if(frame!==450)throw Error('P045_QUERY_FEEDBACK_ENTRY');
        state=context.scenario==='first-wrong'?p045Check(state):correct(state);break;
      case 'second-wrong-reveal':
        requireDomain(['sprite-189']);
        // Frame1 is the hidden idle clip; authored reveal starts at frame2.
        if(frame>=2){state=p045CloseFeedback(p045Check(p045CloseFeedback(p045Check(state))));if(frame===25)state=p045FinishReveal(state);}break;
      case 'help-example':requireDomain(['sprite-30']);state=p045Help(state,true);break;
      case 'three-questions-complete':
        requireDomain(['sprite-204']);if(frame<450)throw Error('P045_QUERY_COMPLETION_ENTRY');
        for(let i=0;i<3;i++){state=p045CloseFeedback(correct(state));if(i<2)state=p045NewWhole(state);}
        mainFrame=frame;if(frame===498)state=p045FinishContinuation(state);break;
    }
  }
  return Object.freeze({animationId:'shared-nms002-l02-p045',sourceSha256:P045_SOURCE_SHA256,
    frame,frameDomain,rootFrame,mainFrame,state,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,
    postStopInspection:context.scenario==='source-inspection'&&mainFrame!==null&&mainFrame>450,
    queryKind:'deterministic-modern-inspection' as const});
}
