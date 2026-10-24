import type {RuntimeContext} from './contract';
import {p026Initial,p026Choose,p026Tick,type P026State} from './nms-l02-p026-state-v1';
import {p026SourceTeaching} from './nms-l02-p026-source-query-v1';
import {P026_SOURCE_IR as IR} from './generated/nms-l02-p026-source-ir-v1';

export const P026_SCENARIOS = Object.freeze(['correct-pairs','wrong-then-correct'] as const);
export type P026Scenario = typeof P026_SCENARIOS[number];
export interface P026TraceEvent {readonly tick:number;readonly action:'choose';readonly cardId:number;readonly round:number;readonly pairId:number;}
export interface P026Trace {readonly states:readonly P026State[];readonly events:readonly P026TraceEvent[];}
export interface P026FrameState {
 readonly animationId:string;readonly sourceSha256:string;readonly frame:number;
 readonly frameDomain:'root'|'sprite-82'|'native-interaction';readonly rootFrame:number;
 readonly scenario:P026Scenario|'live-interaction';readonly language:'en'|'es';readonly seed:number;readonly replay:number;
 readonly mainFrame:number|null;readonly game:P026State|null;readonly traceTick:number|null;
 readonly queryKind:'root-placement-diagnostic'|'first-visit-main-frame'|'native-scripted-interaction'|'live-state';
}
/** Explicit native input schedule, not an original Flash execution recording.
 * Each input occurs immediately before its tick. One tick is 1/12 second.
 * A wrong pair is attempted once in each round only in wrong-then-correct.
 */
export function p026BuildTrace(seed:number,scenario:P026Scenario,replay=0):P026Trace {
 if(!P026_SCENARIOS.includes(scenario))throw Error('P026_SCENARIO');
 let state=p026Initial(seed,replay);
 const states:P026State[]=[state],events:P026TraceEvent[]=[],wrongRounds=new Set<number>();
 let wrongAttempt=false;
 while(state.phase!=='completed'){
  let choice:number|undefined;
  if(state.phase==='ready'){
   wrongAttempt=scenario==='wrong-then-correct'&&!wrongRounds.has(state.round);
   choice=state.cards.find(c=>!c.removed)!.id;
  }else if(state.phase==='second'){
   const first=state.cards.find(c=>c.id===state.first)!;
   choice=state.cards.find(c=>!c.removed&&c.id!==first.id&&(wrongAttempt?c.pairId!==first.pairId:c.pairId===first.pairId))!.id;
   if(wrongAttempt)wrongRounds.add(state.round);
  }
  if(choice!==undefined){const card=state.cards.find(c=>c.id===choice)!;events.push(Object.freeze({tick:states.length,action:'choose',cardId:choice,round:state.round,pairId:card.pairId}));state=p026Choose(state,choice);}
  state=p026Tick(state);states.push(state);
  if(states.length>2000)throw Error('P026_TRACE_DID_NOT_TERMINATE');
 }
 return Object.freeze({states:Object.freeze(states),events:Object.freeze(events)});
}
// Bound the cache: capture callers may supply many seeds and Replay identities.
let cached:{seed:number;scenario:P026Scenario;replay:number;trace:P026Trace}|undefined;
function trace(seed:number,scenario:P026Scenario,replay:number){if(!cached||cached.seed!==seed||cached.scenario!==scenario||cached.replay!==replay)cached={seed,scenario,replay,trace:p026BuildTrace(seed,scenario,replay)};return cached.trace;}
export function p026ModuleFrame(frame:number,context:RuntimeContext):P026FrameState {
 const domain=context.frameDomain??'native-interaction',scenario=context.scenario as P026Scenario,replay=context.replay??0;
 if(!['root','sprite-82','native-interaction'].includes(domain)||!['en','es'].includes(context.lang)||!P026_SCENARIOS.includes(scenario)||!Number.isSafeInteger(frame)||frame<1||context.frame!==frame)throw Error('P026_FRAME_IDENTITY');
 const t=trace(context.seed,scenario,replay),max=domain==='root'?10:domain==='sprite-82'?491:t.states.length;
 if(frame>max)throw Error('P026_FRAME_RANGE');
 const rootFrame=domain==='root'?frame:6;
 if(context.rootFrame!==undefined&&context.rootFrame!==rootFrame)throw Error('P026_ROOT_FRAME');
 // Source root frames after its stop are diagnostic placements, never elapsed time.
 const main=domain==='root'?(frame<6?null:1):domain==='sprite-82'?frame:null;
 const index=domain==='native-interaction'?frame-1:main===null?null:t.states.findIndex(s=>s.mainFrame===main);
 if(index!==null&&index<0)throw Error('P026_UNREACHABLE_MAIN_FRAME');
 const game=index===null?null:t.states[index]!;
 return Object.freeze({animationId:IR.animationId,sourceSha256:IR.sourceSha256,frame,frameDomain:domain as P026FrameState['frameDomain'],rootFrame,scenario,language:context.lang,seed:context.seed,replay,mainFrame:game?.mainFrame??null,game,traceTick:index,queryKind:domain==='root'?'root-placement-diagnostic':domain==='sprite-82'?'first-visit-main-frame':'native-scripted-interaction'});
}
export function p026FrameTeaching(state:P026FrameState){return state.mainFrame===null?null:p026SourceTeaching(state.mainFrame);}
export const P026_TRACE_FRAME_COUNTS=Object.freeze(Object.fromEntries(P026_SCENARIOS.map(s=>[s,p026BuildTrace(0,s).states.length])) as Readonly<Record<P026Scenario,number>>);

/** Live event state must never be replaced with a first-visit frame lookup. */
export function p026LiveFrame(game:P026State,language:'en'|'es'):P026FrameState {
 if(!['en','es'].includes(language))throw Error('P026_LIVE_LANGUAGE');
 return Object.freeze({animationId:IR.animationId,sourceSha256:IR.sourceSha256,frame:game.mainFrame,frameDomain:'sprite-82',rootFrame:6,scenario:'live-interaction',language,seed:game.seed,replay:game.replay,mainFrame:game.mainFrame,game,traceTick:null,queryKind:'live-state'});
}
