/** Source 6298123b...e2d7df6: main81/140, card69..72, feedback78/80, completion76/25.
 * Pointer and keyboard adapters submit the same tick index. Pixel hit testing belongs
 * to the view; these mathematical targets do not claim original Flash hit-test parity.
 */
export const P047_CARDS = Object.freeze([
 Object.freeze({id:1,numerator:1,denominator:2,tick:4,sourceText:41}),
 Object.freeze({id:2,numerator:1,denominator:4,tick:2,sourceText:42}),
 Object.freeze({id:3,numerator:1,denominator:8,tick:1,sourceText:43}),
 Object.freeze({id:4,numerator:5,denominator:8,tick:5,sourceText:55}),
] as const);
export const P047_WORKED_EXAMPLE = Object.freeze({numerator:3,denominator:4,tick:6});
export type P047CardId = 1|2|3|4;
export type P047Phase = 'intro'|'ready'|'correct-feedback'|'wrong-feedback'|'celebration'|'continuation'|'complete';
export interface P047Practice {
 readonly phase:P047Phase;readonly matched:readonly P047CardId[];readonly selected:P047CardId|null;
 readonly helpOpen:boolean;readonly attempts:number;readonly wrongBranch:0|1|2|3;
 readonly seed:number;readonly random:number;readonly replay:number;readonly phaseToken:number;
}
function freeze(s:P047Practice):P047Practice {return Object.freeze({...s,matched:Object.freeze([...s.matched])});}
export function p047Initial(seed=0):P047Practice {
 if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('P047_SEED');
 return freeze({phase:'intro',matched:[],selected:null,helpOpen:false,attempts:0,wrongBranch:0,seed,random:seed,replay:0,phaseToken:0});
}
function transition(s:P047Practice,phase:P047Phase):P047Practice {return freeze({...s,phase,selected:null,helpOpen:false,phaseToken:s.phaseToken+1});}
export function p047CanInteract(s:P047Practice):boolean {return s.phase==='ready'&&!s.helpOpen;}
export function p047Select(s:P047Practice,id:P047CardId):P047Practice {
 if(!P047_CARDS.some(c=>c.id===id))throw Error('P047_CARD');
 return p047CanInteract(s)&&!s.matched.includes(id)?freeze({...s,selected:id}):s;
}
/** Cancel (Escape/pointercancel) is a modern input interruption, not a wrong release. */
export function p047Cancel(s:P047Practice):P047Practice {return p047CanInteract(s)&&s.selected!==null?freeze({...s,selected:null}):s;}
export function p047Drop(s:P047Practice,tick:number|null):P047Practice {
 if(tick!==null&&(!Number.isInteger(tick)||tick<0||tick>8))throw Error('P047_TICK');
 if(!p047CanInteract(s)||s.selected===null||s.matched.includes(s.selected))return s;
 const card=P047_CARDS.find(c=>c.id===s.selected)!;
 if(tick===card.tick)return transition({...s,attempts:s.attempts+1,matched:[...s.matched,card.id]},'correct-feedback');
 // Reproducible four-branch selection is a native adapter, not Flash RNG parity.
 const random=(Math.imul(s.random,1664525)+1013904223)>>>0;
 return transition({...s,attempts:s.attempts+1,random,wrongBranch:Math.floor(random/4294967296*4) as 0|1|2|3},'wrong-feedback');
}
export function p047Help(s:P047Practice,open:boolean):P047Practice {
 return s.phase==='ready'?freeze({...s,helpOpen:open,selected:null}):s;
}
/** The playback controller calls this only after the selected window or source
 * timeline segment ends. Tokens reject stale audio/timer callbacks after Replay.
 * Nonzero feedback tails may extend authored callbacks: see native-audio-windows.
 */
export function p047FinishPhase(s:P047Practice,token:number):P047Practice {
 if(token!==s.phaseToken)return s;
 switch(s.phase){
  case 'intro':case 'wrong-feedback':return transition(s,'ready');
  case 'correct-feedback':return transition(s,s.matched.length===4?'celebration':'ready');
  case 'celebration':return transition(s,'continuation');
  case 'continuation':return transition(s,'complete');
  default:return s;
 }
}
export function p047Replay(s:P047Practice):P047Practice {
 return freeze({...p047Initial(s.seed),replay:s.replay+1,phaseToken:s.phaseToken+1});
}
