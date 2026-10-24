import type {LessonTextActivitySnapshot} from '../../lesson-text-contract';
export interface PendingFeedback {identity:string;activityId:string;revision:number;phase:'correct'|'final';}
/** Caller validates the reducer candidate and admits host activity before committing a drop.
 * identity must include page, seed, replay/runtimeEpoch. Await the newly observed
 * activity revision (> pre-request floor); never guess revision or accept old state. */
export function completionAction(pending:PendingFeedback, identity:string, activities:readonly LessonTextActivitySnapshot[]) {
 if(pending.identity!==identity)return null;
 const a=activities.find(x=>x.id===pending.activityId&&x.revision===pending.revision);
 if(!a||a.status!=='completed')return null;
 if(pending.phase==='correct'&&a.id==='in010-correct-coach'&&a.sourceInstanceId==='sprite-90/depth-114/generation-1'&&a.frameDomain==='sprite-89'&&a.frame===20)return 'feedback-complete' as const;
 if(pending.phase==='final'&&a.id==='in010-final-feedback'&&a.sourceInstanceId==='sprite-90/depth-56/generation-1'&&a.frameDomain==='sprite-52'&&a.frame===25)return 'final-feedback-complete' as const;
 return null;
}
/** Caller consumes pending token BEFORE dispatch/request. If feedback-complete
 * produces final-correct-feedback (six placements), request final activity once;
 * record its fresh observed revision. This prevents repeated effect/final chains.
 * Replay/unmount replaces identity and clears pending; Close affects wrong UI only.
 * No private clock mutations, unrelated timers or fabricated source completion. */
