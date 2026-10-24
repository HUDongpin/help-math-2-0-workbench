import type {AnimationRendererProps} from '../../contract';
import type {CourseG04L03In008InteractionState} from '../../timelines/course-g04-l03-in-008-interaction';
type Runtime = Pick<AnimationRendererProps,'frame'|'frameDomain'|'entryStateSha256'|'onLessonActivityRequest'|'onLessonButtonActivityRequest'>;
/** Modern deterministic branch choice; generation counts admitted checks,
 * independent of question draws/revisions. It does not execute AVM1 random. */
export function in008WrongBranch(seed:number,generation:number) {
 if(!Number.isSafeInteger(generation)||generation<1)throw new Error('Invalid check generation');
 let word=((Number.isSafeInteger(seed)?seed:0)>>>0)^Math.imul(generation,0x9e3779b9);
 word^=word>>>16;word=Math.imul(word,0x85ebca6b);word^=word>>>13;
 return `in008-wrong-s${(word>>>0)%4+1}`;
}
export function requestIn008CheckAudio(runtime:Runtime,next:CourseG04L03In008InteractionState,generation:number) {
 if(runtime.entryStateSha256||runtime.frameDomain!=='sprite-57'||runtime.frame!==216||!runtime.onLessonActivityRequest)return false;
 if(next.outcome!=='correct'&&next.outcome!=='wrong')return false;
 const id=next.outcome==='correct'?'in008-correct-coach':in008WrongBranch(next.seed,generation);
 return runtime.onLessonActivityRequest({id,parentFrame:216});
}
/** Caller invokes only after canonical reducer admits Check, incrementing its
 * check-generation ref once per event. Close/New callbacks intentionally have
 * no coach request/cancellation; page/replay lifecycle owns complete teardown. */
export function requestIn008CloseButtonAudio(runtime:Runtime,phase:'press'|'release',token:string,feedbackVisible:boolean){
 if(runtime.entryStateSha256||runtime.frameDomain!=='sprite-57'||runtime.frame!==216||!token||!runtime.onLessonButtonActivityRequest)return false;
 if(phase==='press'&&!feedbackVisible)return false;
 return runtime.onLessonButtonActivityRequest({id:'in008-close-down',parentFrame:216,phase,token});
}
