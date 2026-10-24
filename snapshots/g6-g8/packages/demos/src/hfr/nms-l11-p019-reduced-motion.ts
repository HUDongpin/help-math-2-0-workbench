import {MovieClip,type Runtime} from './display';
import {P019} from './nms-l11-p019-source-binding';
import type {P019PracticeHost} from './nms-l11-p019-practice-host';
export const P019_REDUCED={kind:'source-readable-static-state-v1',sourceBehavior:'audited-source-practice-question',animationId:P019.animationId,dataSha256:P019.data.sha256,sourceSha256:P019.source.sha256,frameDomain:'sprite-245',frame:97,rootFrame:6,maximumInitializationTicks:97} as const;
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
function current(rt:Runtime){if(rt.page.placement.animationId!==P019.animationId||rt.page.source.sha256!==P019.source.sha256||rt.audio!==null||rt.errors.length)throw Error('P019_REDUCED_REQUIRES_EXACT_SILENT_RUNTIME');const main=rt.page_.children.get(3);return main instanceof MovieClip&&main.charId===245&&main.def===rt.page.dictionary[245]?main:null;}
/** Execute unchanged source initialization to the unanswered authored stop. */
export function initializeP019ReducedMotion(rt:Runtime,state:unknown,validatedDataSha256?:string){
 if(!same(state,P019_REDUCED)||validatedDataSha256!==P019.data.sha256)throw Error('P019_REDUCED_SOURCE_BINDING');
 const permitted:readonly number[]=[...P019.glossary.map(g=>g.characterId),...P019.choices.map(c=>c.buttonCharacterId)];
 for(let n=0;n<=97;n++){
  const main=current(rt);if(rt.keyListeners.length||rt.mouseListeners.length||rt.clickables().some(b=>!permitted.includes(b.charId)))throw Error('P019_REDUCED_UNEXPECTED_SOURCE_INPUT');
  if(main?.frame===97){if(main.playing||rt.page_.frame!==6||rt.page_.playing||rt.Global.get('quizSection')!==true||rt.clickables().filter(b=>P019.choices.some(c=>c.buttonCharacterId===b.charId)).length!==3)throw Error('P019_REDUCED_UNANSWERED_QUESTION_REQUIRED');return;}
  if(n<97)rt.tick();
 }
 throw Error('P019_REDUCED_QUESTION_UNREACHABLE');
}
/** Real answer/Close releases alone choose the branch. Settle that authored
 * branch silently, including the natural 139→1 loop; never seek or force a stop. */
export function settleP019ReducedMotion(rt:Runtime,adapter:P019PracticeHost){
 const limit=139+Math.max(...P019.feedback.filter(b=>b.selectedByInspectedHostBranchSet).map(b=>b.totalFrames));
 for(let n=0;n<=limit;n++){
  current(rt);adapter.afterSourceUpdate();const s=adapter.snapshot();if(adapter.runtime!==rt||!s.current)throw Error('P019_REDUCED_LEASE_CHANGED');
  if(s.feedback?.kind==='wrong'&&s.feedback.frame===22&&!s.feedback.playing)return;
  if(!s.feedback&&s.mainFrame===97&&!s.mainPlaying&&adapter.choices().length===3)return;
  if(n<limit)rt.tick();
 }
 throw Error('P019_REDUCED_SOURCE_SETTLE_UNREACHABLE');
}
