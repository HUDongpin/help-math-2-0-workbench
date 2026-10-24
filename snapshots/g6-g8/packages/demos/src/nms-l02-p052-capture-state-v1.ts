import {createP052State,reduceP052,type P052Event,type P052State} from './nms-l02-p052-state-v1';
import {p052Copy,type P052Language} from './nms-l02-p052-copy-v1';

type Action<T> = T extends unknown ? Omit<T,'epoch'> : never;
type Step=Readonly<{event:Action<P052Event>;basis:string}>;
const step=(event:Action<P052Event>,basis:string):Step=>({event,basis});
const ready=step({type:'intro-ready'},'main sprite-350 frame115; native audio completion contract');
const value=(percent:number)=>step({type:'value',percent},'main frame115 drag formula and drawGrid');
const submit=step({type:'submit'},'button310 release');
const closeWrong=step({type:'close-feedback'},'button319 release');
const closeRight=step({type:'close-feedback'},'button328 release');
const help=step({type:'open-help'},'button153 release');
const correct=[ready,value(75),submit];
const wrong=[ready,value(35),submit];
const retry=[...wrong,closeWrong];
const revealed=[...retry,value(100),submit];
const helpSteps=[ready,value(42),help];
const square=step({type:'open-glossary',term:'Square'},'button342 DoHyperLinks; modern local glossary');
const column=step({type:'open-glossary',term:'Column'},'button343 DoHyperLinks; modern local glossary');
const closeGlossary=step({type:'close-glossary'},'modern glossary ownership adapter');
const closeHelp=step({type:'close-help'},'button337 release');
type Definition=Readonly<{first:number;last:number;steps:readonly Step[]}>;
/** Candidate main-domain scenarios, not a substitute for coverage-v2 or natural Flash traces. */
export const P052_CAPTURE_SCENARIOS={
 intro:{first:1,last:114,steps:[]},
 'practice-zero':{first:115,last:115,steps:[ready]},
 'practice-example':{first:115,last:115,steps:[ready,value(35)]},
 'practice-target':{first:115,last:115,steps:[ready,value(75)]},
 'practice-full':{first:115,last:115,steps:[ready,value(100)]},
 'first-wrong':{first:115,last:115,steps:wrong},
 'retry-reset':{first:115,last:115,steps:[...retry,step({type:'reset'},'button307 release; retain attempts')]},
 'first-correct':{first:115,last:115,steps:correct},
 'retry-correct':{first:115,last:115,steps:[...retry,value(75),submit]},
 'second-wrong-reveal':{first:115,last:115,steps:revealed},
 help:{first:115,last:115,steps:helpSteps},
 'glossary-square':{first:115,last:115,steps:[...helpSteps,square]},
 'glossary-column':{first:115,last:115,steps:[...helpSteps,column]},
 'glossary-return':{first:115,last:115,steps:[...helpSteps,square,closeGlossary]},
 'help-return':{first:115,last:115,steps:[...helpSteps,column,closeGlossary,closeHelp]},
 'outro-correct':{first:116,last:156,steps:[...correct,closeRight]},
 'outro-revealed':{first:116,last:156,steps:[...revealed,closeRight]},
 complete:{first:156,last:156,steps:[...correct,closeRight,
  step({type:'frame',frame:156},'main sprite-350 frame156'),
  step({type:'outro-ended'},'native terminal hold after visual/audio completion; not source stop')]},
 'replay-from-glossary':{first:1,last:1,steps:[...helpSteps,column,
  step({type:'replay'},'modern My Lesson Replay resets full state')]},
 'paused-help':{first:115,last:115,steps:[...helpSteps,
  step({type:'pause',paused:true},'modern My Lesson pause adapter')]}
} as const satisfies Record<string,Definition>;
export type P052CaptureScenario=keyof typeof P052_CAPTURE_SCENARIOS;
export type P052CaptureRequest=Readonly<{
 frameDomain:'sprite-350';scenario:P052CaptureScenario;frame:number;language:P052Language;seed:number;
}>;

/** Replays actual kernel events; no direct assignment of desired answer/overlay state. */
export function p052CaptureState(request:P052CaptureRequest){
 if(request.frameDomain!=='sprite-350')throw Error('P052_CAPTURE_DOMAIN');
 if(!Object.hasOwn(P052_CAPTURE_SCENARIOS,request.scenario))throw Error('P052_CAPTURE_SCENARIO');
 p052Copy(request.language);
 const definition:Definition=P052_CAPTURE_SCENARIOS[request.scenario];
 if(!Number.isInteger(request.frame)||request.frame<definition.first||request.frame>definition.last)
  throw Error('P052_CAPTURE_FRAME');
 const initialState=createP052State(request.seed);
 let state=initialState;
 const checkpoints:Array<{event:P052Event;basis:string;before:P052State;after:P052State}>=[];
 for(const scheduled of definition.steps){
  const before=state,event={...scheduled.event,epoch:state.epoch};
  state=reduceP052(state,event);checkpoints.push({event,basis:scheduled.basis,before,after:state});
 }
 // Entry identifies the replayed branch before advancing within the requested domain range.
 const entryState={language:request.language,scenario:request.scenario,rootFrame:6,
  sourceTimelineId:'sprite-350',state};
 if(state.frame!==request.frame){
  const before=state,event:P052Event={type:'frame',frame:request.frame,epoch:state.epoch};
  state=reduceP052(state,event);checkpoints.push({event,basis:'main sprite-350 authored frame',before,after:state});
 }
 if(state.frame!==request.frame)throw Error('P052_CAPTURE_STATE_FRAME_MISMATCH');
 return {animationId:'shared-nms002-l02-p052',frameDomain:'sprite-350' as const,
  rootFrame:6,frame:state.frame,language:request.language,seed:request.seed,
  scenario:request.scenario,initialState,entryState,state,checkpoints};
}
