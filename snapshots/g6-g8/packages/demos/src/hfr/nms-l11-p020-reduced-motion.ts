import {MovieClip,type Runtime} from './display';
import {P020} from './nms-l11-p020-source-binding';
import type {P020PracticeHost} from './nms-l11-p020-practice-host';
export const P020_REDUCED={kind:'source-readable-static-state-v1',sourceBehavior:'audited-source-practice-question',animationId:P020.animationId,dataSha256:P020.data.sha256,sourceSha256:P020.source.sha256,frameDomain:'sprite-219',frame:102,rootFrame:6,maximumInitializationTicks:102} as const;
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
function current(rt:Runtime){if(rt.page.placement.animationId!==P020.animationId||rt.page.source.sha256!==P020.source.sha256||rt.audio!==null||rt.errors.length)throw Error('P020_REDUCED_REQUIRES_EXACT_SILENT_RUNTIME');const main=rt.page_.children.get(3);return main instanceof MovieClip&&main.charId===219&&main.def===rt.page.dictionary[219]?main:null;}
/** Execute unchanged source initialization to the unanswered authored stop. */
export function initializeP020ReducedMotion(rt:Runtime,state:unknown,validatedDataSha256?:string){
 if(!same(state,P020_REDUCED)||validatedDataSha256!==P020.data.sha256)throw Error('P020_REDUCED_SOURCE_BINDING');
 const permitted:readonly number[]=[...P020.glossary.map(g=>g.characterId),...P020.choices.map(c=>c.buttonCharacterId)];
 for(let n=0;n<=102;n++){
  const main=current(rt);if(rt.keyListeners.length||rt.mouseListeners.length||rt.clickables().some(b=>!permitted.includes(b.charId)))throw Error('P020_REDUCED_UNEXPECTED_SOURCE_INPUT');
  if(main?.frame===102){if(main.playing||rt.page_.frame!==6||rt.page_.playing||rt.Global.get('quizSection')!==true||rt.clickables().filter(b=>P020.choices.some(c=>c.buttonCharacterId===b.charId)).length!==3)throw Error('P020_REDUCED_UNANSWERED_QUESTION_REQUIRED');return;}
  if(n<102)rt.tick();
 }
 throw Error('P020_REDUCED_QUESTION_UNREACHABLE');
}
/** Real answer/Close releases alone choose the branch. Settle that authored
 * branch silently, including the natural 144→1 loop; never seek or force a stop. */
export function settleP020ReducedMotion(rt:Runtime,adapter:P020PracticeHost){
 const limit=144+Math.max(...P020.feedback.filter(b=>b.selectedByInspectedHostBranchSet).map(b=>b.totalFrames));
 for(let n=0;n<=limit;n++){
  current(rt);adapter.afterSourceUpdate();const s=adapter.snapshot();if(adapter.runtime!==rt||!s.current)throw Error('P020_REDUCED_LEASE_CHANGED');
  if(s.feedback?.kind==='wrong'&&s.feedback.frame===22&&!s.feedback.playing)return;
  if(!s.feedback&&s.mainFrame===102&&!s.mainPlaying&&adapter.choices().length===3)return;
  if(n<limit)rt.tick();
 }
 throw Error('P020_REDUCED_SOURCE_SETTLE_UNREACHABLE');
}
