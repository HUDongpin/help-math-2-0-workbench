import type {AnimationModule,RendererPlaybackReport} from '../../../packages/demos/src/contract';
import type {LessonHostRequest} from '../../../packages/demos/src/lesson-host-contract';
const PAGE='shared-nms002-l11-p019',SHA='2953b69c2fd544e580eda2a87153e2010177f83a229e67e0d07824b7bcdb209d';
export interface P019StaticControls{readonly hostPaused:boolean;readonly hidden:boolean|undefined;readonly reduced:boolean|undefined;readonly blocker:string|null}
export function isP019StaticPracticeModule(module:AnimationModule):boolean{
 const p=module.textPresentation,b=p?.binding,domain=module.runtime?.frameDomains?.find(d=>d.id==='sprite-245');
 return module.key===PAGE&&module.clock==='renderer'&&b?.animationId===PAGE&&b.placementId===PAGE&&b.sourceSwfSha256===SHA&&b.version==='hfr-nms-l11-p019-source-native-preparation-v1'&&b.template==='complex-figure'&&p?.reducedMotionFrameByDomain?.['sprite-245']===97&&domain?.frameCount===139&&domain.fps===12;
}
/** Closing the page's held glossary is UI dismissal, not source playback.
 * The host retains its source-stop-until-explicit-resume pause policy. */
export function permitsP019PausedGlossaryClose(module:AnimationModule,request:LessonHostRequest,controls:P019StaticControls):boolean{
 return isP019StaticPracticeModule(module)&&request.type==='close-glossary'&&controls.hostPaused&&controls.hidden===false&&!controls.blocker;
}
export function permitsP019StaticPractice(module:AnimationModule,controls:P019StaticControls):boolean{return isP019StaticPracticeModule(module)&&!controls.hostPaused&&controls.hidden===false&&controls.reduced===true&&!controls.blocker;}
export function permitsP019StaticPracticeRequest(module:AnimationModule,request:LessonHostRequest,controls:P019StaticControls):boolean{
 if(!permitsP019StaticPractice(module,controls)||request.type!=='record-practice-feedback')return false;
 const count=request.outcome==='correct'?4:request.outcome==='incorrect'?3:0;
 return count>0&&request.interactionId===PAGE&&request.branchCount===count&&Number.isSafeInteger(request.branchIndex)&&request.branchIndex>=1&&request.branchIndex<=count;
}
/** P019's complete report is the sourceActivityExited latch after a correct
 * answer OR two exhausted attempts. The source naturally returns to question97;
 * this policy does not relabel that latch as correctness or force a final stop. */
export function permitsP019StaticPracticeCompletion(module:AnimationModule,report:RendererPlaybackReport,controls:P019StaticControls):boolean{
 return permitsP019StaticPractice(module,controls)&&report.frameDomain==='sprite-245'&&report.frameCount===139&&report.fps===12&&report.frame===97&&report.complete===true&&report.lessonFinished===false&&report.narration==='unavailable';
}
