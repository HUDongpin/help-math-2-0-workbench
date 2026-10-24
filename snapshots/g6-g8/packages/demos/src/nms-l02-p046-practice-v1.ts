import {p046Equivalent} from './nms-l02-p046-equivalence-v1';
/** Source c82da2eb...b8cb62: sprite205/frame654; buttons146/176/198; sprite168/frame25.
 * Deterministic draw order is a modern inspection adapter, not Flash RNG parity.
 */
export const P046_QUESTIONS = Object.freeze([
  Object.freeze({label:'Q1',numerator:'2',denominator:'4'}),
  Object.freeze({label:'Q2',numerator:'4',denominator:'12'}),
  Object.freeze({label:'Q3',numerator:'6',denominator:'10'}),
]);
export interface P046Practice {
  readonly finishReason:null|'all-questions'|'done';readonly seed:number;readonly order:readonly number[];readonly questionIndex:number;
  readonly phase:'intro'|'ready'|'wrong-feedback'|'correct-feedback'|'answer-reveal'|'awaiting-new'|'continuation'|'complete';
  readonly parts:number;readonly selected:readonly number[];
  readonly numerator:string;readonly denominator:string;readonly attempts:number;readonly helpOpen:boolean;readonly replay:number;
}
function freeze(state:P046Practice):P046Practice{return Object.freeze({...state,order:Object.freeze([...state.order]),selected:Object.freeze([...state.selected])});}
export function p046Initial(seed=0):P046Practice{
  if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('P046_SEED');
  const pool=[0,1,2],order:number[]=[];let random=seed;
  while(pool.length){random=(Math.imul(random,1664525)+1013904223)>>>0;order.push(pool.splice(Math.floor(random/4294967296*pool.length),1)[0]);}
  return freeze({finishReason:null,seed,order,questionIndex:0,phase:'intro',parts:1,selected:[],numerator:'',denominator:'',attempts:0,helpOpen:false,replay:0});
}
export function p046Question(state:P046Practice){return P046_QUESTIONS[state.order[state.questionIndex]];}
export function p046Enter(state:P046Practice){return state.phase==='intro'?freeze({...state,phase:'ready'}):state;}
export function p046Input(state:P046Practice,field:'numerator'|'denominator',value:string):P046Practice{
  if(!['numerator','denominator'].includes(field)||typeof value!=='string')throw Error('P046_INPUT');
  return state.phase==='ready'&&!state.helpOpen?freeze({...state,[field]:value}):state;
}
export function p046Check(state:P046Practice):P046Practice{
  if(state.phase!=='ready'||state.helpOpen)return state;
  const q=p046Question(state);
  // Source ratio check is replaced by the documented exact mathematical policy.
  const correct=p046Equivalent(Number(q.numerator),Number(q.denominator),state.numerator,state.denominator);
  return freeze({...state,attempts:state.attempts+1,phase:correct?'correct-feedback':'wrong-feedback'});
}
function finishQuestion(state:P046Practice):P046Practice{return freeze({...state,phase:state.questionIndex===2?'continuation':'awaiting-new',finishReason:state.questionIndex===2?'all-questions':null});}
export function p046CloseFeedback(state:P046Practice):P046Practice{
  if(state.phase==='correct-feedback')return finishQuestion(state);
  if(state.phase!=='wrong-feedback')return state;
  if(state.attempts<2)return freeze({...state,phase:'ready'});
  const q=p046Question(state);return freeze({...state,phase:'answer-reveal',attempts:0,numerator:String(Number(q.numerator)*2),denominator:String(Number(q.denominator)*2)});
}
/** Called only at source COR_ANS_MC frame25, separately from feedback Close. */
export function p046FinishReveal(state:P046Practice){return state.phase==='answer-reveal'?finishQuestion(state):state;}
export function p046NewWhole(state:P046Practice):P046Practice{
  return state.phase==='awaiting-new'&&!state.helpOpen?freeze({...state,questionIndex:state.questionIndex+1,phase:'ready',parts:1,selected:[],numerator:'',denominator:'',attempts:0}):state;
}
export function p046Help(state:P046Practice,open:boolean):P046Practice{return ['ready','awaiting-new'].includes(state.phase)?freeze({...state,helpOpen:open}):state;}
/** Main continuation must reach the authored stop706 before product completion. */
export function p046FinishContinuation(state:P046Practice){return state.phase==='continuation'?freeze({...state,phase:'complete'}):state;}
export function p046Replay(state:P046Practice){return freeze({...p046Initial(state.seed),replay:state.replay+1});}

/** Native consistency policy: changing the partition discards prior selection;
 * changing question restores one white piece. No arbitrary lesson-size ceiling.
 */
export function p046SetParts(state:P046Practice,parts:number):P046Practice{
  if(!Number.isSafeInteger(parts)||parts<1)throw Error('P046_PARTS');
  if(state.phase!=='ready'||state.helpOpen||parts===state.parts)return state;
  return freeze({...state,parts,selected:[]});
}
export function p046TogglePart(state:P046Practice,part:number):P046Practice{
  if(!Number.isSafeInteger(part)||part<1||part>state.parts)throw Error('P046_PART');
  if(state.phase!=='ready'||state.helpOpen)return state;
  const selected=state.selected.includes(part)?state.selected.filter(n=>n!==part):[...state.selected,part].sort((a,b)=>a-b);
  return freeze({...state,selected});
}

/** Source ButtonDone153 at stop654 exits quizSection and resumes main. */
export function p046Done(state:P046Practice):P046Practice{
 return ['ready','awaiting-new'].includes(state.phase)&&!state.helpOpen?freeze({...state,phase:'continuation',finishReason:'done'}):state;
}
