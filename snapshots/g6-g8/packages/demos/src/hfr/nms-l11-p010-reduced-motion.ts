import {MovieClip,type Runtime} from './display';
import {P010} from './nms-l11-p010-source-binding';
import {P010_NATIVE} from './nms-l11-p010-native-binding';
import type {P010PracticeHost} from './nms-l11-p010-practice-host';
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
function current(rt:Runtime){if(rt.page.placement.animationId!==P010.animationId||rt.page.source.sha256!==P010.source.sha256||rt.audio!==null||rt.errors.length)throw Error('P010_REDUCED_MOTION_REQUIRES_EXACT_SILENT_RUNTIME');const main=rt.page_.children.get(4);return main instanceof MovieClip&&main.charId===204&&main.def===rt.page.dictionary[204]?main:null;}
/** Execute only source initialization to the unanswered authored question. */
export function initializeP010ReducedMotion(rt:Runtime,state:unknown,validatedDataSha256?:string){
 if(!same(state,P010_NATIVE.reducedMotion)||validatedDataSha256!==P010.data.sha256)throw Error('P010_REDUCED_MOTION_SOURCE_BINDING');
 for(let n=0;n<=47;n++){
  const main=current(rt);if(rt.keyListeners.length||rt.mouseListeners.length||rt.clickables().some(b=>![9,10,23,24].includes(b.charId)))throw Error('P010_REDUCED_MOTION_UNEXPECTED_INPUT');
  if(main?.frame===47){if(main.playing||rt.page_.frame!==6||rt.page_.playing||rt.Global.get('quizSection')!==true||rt.clickables().filter(b=>[23,24].includes(b.charId)).length!==3)throw Error('P010_REDUCED_MOTION_QUESTION_REQUIRED');return;}
  if(n<47)rt.tick();
 }
 throw Error('P010_REDUCED_MOTION_QUESTION_UNREACHABLE');
}
/** After a real learner source release, settle that same branch without motion
 * or audio. No state is fabricated and a wrong answer never reaches the end. */
export function settleP010ReducedMotion(rt:Runtime,adapter:P010PracticeHost){
 for(let n=0;n<=160;n++){
  current(rt);const s=adapter.snapshot();if(adapter.runtime!==rt||!s.current)throw Error('P010_REDUCED_MOTION_LEASE_CHANGED');
  if(s.feedback?.kind==='wrong'&&s.feedback.frame===22&&!s.feedback.playing)return;
  if(!s.feedback&&s.mainFrame===47&&!s.mainPlaying&&adapter.choices().length===3)return;
  if(n<160)rt.tick();
 }
 throw Error('P010_REDUCED_MOTION_SOURCE_SETTLE_UNREACHABLE');
}
