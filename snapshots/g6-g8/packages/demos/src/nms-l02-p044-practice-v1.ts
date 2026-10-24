/** Source e31d34af...93f622: sprite243/frame361, buttons76/81/85/86/231/236.
 * Seeded question ordering is a modern deterministic adapter, not Flash random parity.
 */
export const P044_QUESTIONS = Object.freeze([
  Object.freeze({numerator:1,denominator:4}),Object.freeze({numerator:2,denominator:10}),
  Object.freeze({numerator:3,denominator:5}),Object.freeze({numerator:6,denominator:8}),
]);
export interface P044Practice {
  readonly seed:number; readonly order:readonly number[]; readonly questionIndex:number;
  readonly phase:'intro'|'ready'|'wrong-feedback'|'correct-feedback'|'answer-reveal'|'awaiting-new'|'continuation'|'complete';
  readonly parts:number; readonly selected:readonly number[]; readonly attempts:number;
  readonly helpOpen:boolean; readonly replay:number;
}
function freeze(state:P044Practice):P044Practice {
  return Object.freeze({...state,order:Object.freeze([...state.order]),selected:Object.freeze([...state.selected])});
}
export function p044Initial(seed=0):P044Practice {
  if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('P044_SEED');
  const remaining=[0,1,2,3],order:number[]=[];let random=seed;
  while(remaining.length){random=(Math.imul(random,1664525)+1013904223)>>>0;order.push(remaining.splice(Math.floor(random/4294967296*remaining.length),1)[0]);}
  return freeze({seed,order,questionIndex:0,phase:'intro',parts:1,selected:[],attempts:0,helpOpen:false,replay:0});
}
export function p044Question(state:P044Practice){return P044_QUESTIONS[state.order[state.questionIndex]];}
export function p044Enter(state:P044Practice):P044Practice {return state.phase==='intro'?freeze({...state,phase:'ready'}):state;}
export function p044SetParts(state:P044Practice,parts:number):P044Practice {
  if(!Number.isInteger(parts)||parts<1||parts>20)throw Error('P044_PARTS');
  return state.phase==='ready'&&!state.helpOpen?freeze({...state,parts,selected:[]}):state;
}
export function p044TogglePart(state:P044Practice,part:number):P044Practice {
  if(!Number.isInteger(part)||part<1||part>state.parts)throw Error('P044_PART_ID');
  if(state.phase!=='ready'||state.helpOpen)return state;
  return freeze({...state,selected:state.selected.includes(part)?state.selected.filter(p=>p!==part):[...state.selected,part].sort((a,b)=>a-b)});
}
export function p044Check(state:P044Practice):P044Practice {
  if(state.phase!=='ready'||state.helpOpen)return state;
  const question=p044Question(state),attempts=state.attempts+1;
  if(state.parts===question.denominator&&state.selected.length===question.numerator)return freeze({...state,attempts,phase:'correct-feedback'});
  if(attempts===1)return freeze({...state,attempts,phase:'wrong-feedback'});
  // Source showAns paints the first numerator pieces in the denominator layout.
  return freeze({...state,attempts:0,phase:'answer-reveal',parts:question.denominator,selected:Array.from({length:question.numerator},(_,i)=>i+1)});
}
export function p044CloseWrong(state:P044Practice):P044Practice {return state.phase==='wrong-feedback'?freeze({...state,phase:'ready'}):state;}
function finishQuestion(state:P044Practice):P044Practice {
  return freeze({...state,phase:state.questionIndex===3?'continuation':'awaiting-new'});
}
/** Correct dialog Close is the authored progression event, not audio end. */
export function p044CloseCorrect(state:P044Practice):P044Practice {return state.phase==='correct-feedback'?finishQuestion(state):state;}
/** Caller must wait for COR_ANS_MC sprite235/frame25. */
export function p044FinishReveal(state:P044Practice):P044Practice {return state.phase==='answer-reveal'?finishQuestion(state):state;}
export function p044NewWhole(state:P044Practice):P044Practice {
  return state.phase==='awaiting-new'&&!state.helpOpen?freeze({...state,questionIndex:state.questionIndex+1,phase:'ready',parts:1,selected:[],attempts:0}):state;
}
export function p044Help(state:P044Practice,open:boolean):P044Practice {
  return ['ready','awaiting-new'].includes(state.phase)?freeze({...state,helpOpen:open}):state;
}
/** Separate completion boundary: source main continuation/host trace is still pending. */
export function p044FinishContinuation(state:P044Practice):P044Practice {return state.phase==='continuation'?freeze({...state,phase:'complete'}):state;}
export function p044Replay(state:P044Practice):P044Practice {return freeze({...p044Initial(state.seed),replay:state.replay+1});}
