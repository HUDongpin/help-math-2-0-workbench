/** Source 741913de...c1fcd: sprite204/frame450; buttons134/185/190; sprite189/frame25.
 * Deterministic draw order is a modern inspection adapter, not Flash RNG parity.
 */
export const P045_QUESTIONS = Object.freeze([
  Object.freeze({label:'L1',numerator:'2',denominator:'10'}),
  Object.freeze({label:'L2',numerator:'3',denominator:'10'}),
  Object.freeze({label:'L3',numerator:'4',denominator:'10'}),
]);
export interface P045Practice {
  readonly seed:number;readonly order:readonly number[];readonly questionIndex:number;
  readonly phase:'intro'|'ready'|'wrong-feedback'|'correct-feedback'|'answer-reveal'|'awaiting-new'|'continuation'|'complete';
  readonly numerator:string;readonly denominator:string;readonly attempts:number;readonly helpOpen:boolean;readonly replay:number;
}
function freeze(state:P045Practice):P045Practice{return Object.freeze({...state,order:Object.freeze([...state.order])});}
export function p045Initial(seed=0):P045Practice{
  if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('P045_SEED');
  const pool=[0,1,2],order:number[]=[];let random=seed;
  while(pool.length){random=(Math.imul(random,1664525)+1013904223)>>>0;order.push(pool.splice(Math.floor(random/4294967296*pool.length),1)[0]);}
  return freeze({seed,order,questionIndex:0,phase:'intro',numerator:'',denominator:'',attempts:0,helpOpen:false,replay:0});
}
export function p045Question(state:P045Practice){return P045_QUESTIONS[state.order[state.questionIndex]];}
export function p045Enter(state:P045Practice){return state.phase==='intro'?freeze({...state,phase:'ready'}):state;}
export function p045Input(state:P045Practice,field:'numerator'|'denominator',value:string):P045Practice{
  if(!['numerator','denominator'].includes(field)||typeof value!=='string')throw Error('P045_INPUT');
  return state.phase==='ready'&&!state.helpOpen?freeze({...state,[field]:value}):state;
}
export function p045Check(state:P045Practice):P045Practice{
  if(state.phase!=='ready'||state.helpOpen)return state;
  const q=p045Question(state);
  // Source compares two TextField.text strings with answer strings; do not silently trim or parse numbers.
  const correct=state.numerator===q.numerator&&state.denominator===q.denominator;
  return freeze({...state,attempts:state.attempts+1,phase:correct?'correct-feedback':'wrong-feedback'});
}
function finishQuestion(state:P045Practice):P045Practice{return freeze({...state,phase:state.questionIndex===2?'continuation':'awaiting-new'});}
export function p045CloseFeedback(state:P045Practice):P045Practice{
  if(state.phase==='correct-feedback')return finishQuestion(state);
  if(state.phase!=='wrong-feedback')return state;
  if(state.attempts<2)return freeze({...state,phase:'ready'});
  const q=p045Question(state);return freeze({...state,phase:'answer-reveal',attempts:0,numerator:q.numerator,denominator:q.denominator});
}
/** Called only at source COR_ANS_MC frame25, separately from feedback Close. */
export function p045FinishReveal(state:P045Practice){return state.phase==='answer-reveal'?finishQuestion(state):state;}
export function p045NewWhole(state:P045Practice):P045Practice{
  return state.phase==='awaiting-new'&&!state.helpOpen?freeze({...state,questionIndex:state.questionIndex+1,phase:'ready',numerator:'',denominator:'',attempts:0}):state;
}
export function p045Help(state:P045Practice,open:boolean):P045Practice{return ['ready','awaiting-new'].includes(state.phase)?freeze({...state,helpOpen:open}):state;}
/** Main continuation must reach the authored stop498 before product completion. */
export function p045FinishContinuation(state:P045Practice){return state.phase==='continuation'?freeze({...state,phase:'complete'}):state;}
export function p045Replay(state:P045Practice){return freeze({...p045Initial(state.seed),replay:state.replay+1});}
