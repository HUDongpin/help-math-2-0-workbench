import type {AnimationModule,RendererPlaybackReport} from '../../../packages/demos/src/contract';
import type {LessonHostRequest} from '../../../packages/demos/src/lesson-host-contract';
const PAGE='shared-nms002-l11-p020',SHA='4f3da6d49a2281938ea9a064eb6376a961ba705654f96b11633c7e4ae8990f59';
export interface P020StaticControls{readonly hostPaused:boolean;readonly hidden:boolean|undefined;readonly reduced:boolean|undefined;readonly blocker:string|null}
export function isP020StaticPracticeModule(module:AnimationModule):boolean{
 const p=module.textPresentation,b=p?.binding,domain=module.runtime?.frameDomains?.find(d=>d.id==='sprite-219');
 return module.key===PAGE&&module.clock==='renderer'&&b?.animationId===PAGE&&b.placementId===PAGE&&b.sourceSwfSha256===SHA&&b.version==='hfr-nms-l11-p020-source-native-preparation-v1'&&b.template==='complex-figure'&&p?.reducedMotionFrameByDomain?.['sprite-219']===102&&domain?.frameCount===144&&domain.fps===12;
}
/** Closing the page's held glossary is UI dismissal, not source playback.
 * The host retains its source-stop-until-explicit-resume pause policy. */
export function permitsP020PausedGlossaryClose(module:AnimationModule,request:LessonHostRequest,controls:P020StaticControls):boolean{
 return isP020StaticPracticeModule(module)&&request.type==='close-glossary'&&controls.hostPaused&&controls.hidden===false&&!controls.blocker;
}
export function permitsP020StaticPractice(module:AnimationModule,controls:P020StaticControls):boolean{return isP020StaticPracticeModule(module)&&!controls.hostPaused&&controls.hidden===false&&controls.reduced===true&&!controls.blocker;}
export function permitsP020StaticPracticeRequest(module:AnimationModule,request:LessonHostRequest,controls:P020StaticControls):boolean{
 if(!permitsP020StaticPractice(module,controls)||request.type!=='record-practice-feedback')return false;
 const count=request.outcome==='correct'?4:request.outcome==='incorrect'?3:0;
 return count>0&&request.interactionId===PAGE&&request.branchCount===count&&Number.isSafeInteger(request.branchIndex)&&request.branchIndex>=1&&request.branchIndex<=count;
}
/** P020's complete report is the sourceActivityExited latch after a correct
 * answer OR two exhausted attempts. The source naturally returns to question102;
 * this policy does not relabel that latch as correctness or force a final stop. */
export function permitsP020StaticPracticeCompletion(module:AnimationModule,report:RendererPlaybackReport,controls:P020StaticControls):boolean{
 return permitsP020StaticPractice(module,controls)&&report.frameDomain==='sprite-219'&&report.frameCount===144&&report.fps===12&&report.frame===102&&report.complete===true&&report.lessonFinished===false&&report.narration==='unavailable';
}
