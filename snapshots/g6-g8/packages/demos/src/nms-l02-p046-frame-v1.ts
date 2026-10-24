import type {RuntimeContext} from './contract';
import {p046Done,p046Initial,p046Enter,p046Question,p046Input,p046Check,p046CloseFeedback,p046FinishReveal,p046NewWhole,p046Help,p046FinishContinuation,type P046Practice} from './nms-l02-p046-practice-v1';
export const P046_SOURCE_SHA256='c82da2eb14e6db6fbb876e795edd8a8ebc1e890a52d9e7b1b1f5e66153b8cb62';
export const P046_FRAME_DOMAINS=Object.freeze({root:10,'sprite-205':706,'sprite-168':25,'sprite-30':1});
export const P046_SCENARIOS=Object.freeze(['source-inspection','first-wrong','first-correct','second-wrong-reveal','help-example','three-questions-complete','done-early']as const);
function correct(state:P046Practice){const q=p046Question(state);return p046Check(p046Input(p046Input(state,'numerator',q.numerator),'denominator',q.denominator));}
/** Modern inspection recipes, not original runtime traversal or random-number parity. */
export function p046ModuleFrame(frame:number,context:RuntimeContext){
  const frameDomain=context.frameDomain??'sprite-205',rootFrame=frameDomain==='root'?frame:6;
  if(!Object.hasOwn(P046_FRAME_DOMAINS,frameDomain)||!Number.isSafeInteger(frame)||frame<1
    ||frame>P046_FRAME_DOMAINS[frameDomain as keyof typeof P046_FRAME_DOMAINS]||context.frame!==frame
    ||!['en','es'].includes(context.lang)||!P046_SCENARIOS.some(s=>s===context.scenario)
    ||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0
    ||context.rootFrame!==undefined&&context.rootFrame!==rootFrame)throw Error('P046_QUERY_IDENTITY');
  let state:P046Practice=Object.freeze({...p046Initial(context.seed),replay:context.replay??0});
  let mainFrame:number|null=654;
  const requireDomain=(domains:readonly string[])=>{if(!domains.includes(frameDomain))throw Error('P046_QUERY_SCENARIO_DOMAIN');};
  if(context.scenario==='source-inspection'){
    requireDomain(['root','sprite-205']);mainFrame=frameDomain==='root'?(frame<6?null:1):frame;
    if(mainFrame!==null&&mainFrame>=654)state=p046Enter(state);
  }else{
    state=p046Enter(state);
    switch(context.scenario){
      case 'first-wrong':case 'first-correct':
        requireDomain(['sprite-205']);if(frame!==654)throw Error('P046_QUERY_FEEDBACK_ENTRY');
        state=context.scenario==='first-wrong'?p046Check(state):correct(state);break;
      case 'second-wrong-reveal':
        requireDomain(['sprite-168']);
        // Frame1 is the hidden idle clip; authored reveal starts at frame2.
        if(frame>=2){state=p046CloseFeedback(p046Check(p046CloseFeedback(p046Check(state))));if(frame===25)state=p046FinishReveal(state);}break;
      case 'help-example':requireDomain(['sprite-30']);state=p046Help(state,true);break;
      case 'done-early':
        requireDomain(['sprite-205']);if(frame<654)throw Error('P046_QUERY_DONE_ENTRY');state=p046Done(state);mainFrame=frame;if(frame===706)state=p046FinishContinuation(state);break;
      case 'three-questions-complete':
        requireDomain(['sprite-205']);if(frame<654)throw Error('P046_QUERY_COMPLETION_ENTRY');
        for(let i=0;i<3;i++){state=p046CloseFeedback(correct(state));if(i<2)state=p046NewWhole(state);}
        mainFrame=frame;if(frame===706)state=p046FinishContinuation(state);break;
    }
  }
  return Object.freeze({animationId:'shared-nms002-l02-p046',sourceSha256:P046_SOURCE_SHA256,
    frame,frameDomain,rootFrame,mainFrame,state,scenario:context.scenario,language:context.lang,seed:context.seed,replay:context.replay??0,
    postStopInspection:context.scenario==='source-inspection'&&mainFrame!==null&&mainFrame>654,
    queryKind:'deterministic-modern-inspection' as const});
}
