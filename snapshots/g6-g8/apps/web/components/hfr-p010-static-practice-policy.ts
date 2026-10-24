import type {AnimationModule,RendererPlaybackReport} from '../../../packages/demos/src/contract';
import type {LessonHostRequest} from '../../../packages/demos/src/lesson-host-contract';

const PAGE='shared-nms002-l11-p010',SHA='cfaacd10d60ed16d065fcf4d415550392233bf1d6f388bb22c687bcf5965bd08';
export function isP010StaticPracticeModule(module:AnimationModule):boolean{
 const p=module.textPresentation,b=p?.binding,domain=module.runtime?.frameDomains?.find(d=>d.id==='sprite-204');
 return module.key===PAGE&&module.clock==='renderer'&&b?.animationId===PAGE&&b.placementId===PAGE&&b.sourceSwfSha256===SHA&&b.version==='hfr-nms-l11-p010-full-native-v1'&&b.template==='exercise'&&p?.reducedMotionFrameByDomain?.['sprite-204']===47&&domain?.frameCount===83&&domain.fps===12;
}
export interface P010StaticControls{readonly hostPaused:boolean;readonly hidden:boolean|undefined;readonly reduced:boolean|undefined;readonly blocker:string|null}
export function permitsP010StaticPractice(module:AnimationModule,controls:P010StaticControls):boolean{return isP010StaticPracticeModule(module)&&!controls.hostPaused&&controls.hidden===false&&controls.reduced===true&&!controls.blocker;}
/** Only the selected authored feedback result may cross a reduced-motion clock
 * hold. Navigation, audio, legacy operations and unrelated practice stay held. */
export function permitsP010StaticPracticeRequest(module:AnimationModule,request:LessonHostRequest,controls:P010StaticControls):boolean{
 if(!permitsP010StaticPractice(module,controls)||request.type!=='record-practice-feedback')return false;
 const count=request.outcome==='correct'?4:request.outcome==='incorrect'?3:0;
 return count>0&&request.interactionId===PAGE&&request.branchCount===count&&Number.isSafeInteger(request.branchIndex)&&request.branchIndex>=1&&request.branchIndex<=count;
}
/** The renderer remains source-clock authority. Static completion may pass only
 * for this exact activity's reported correct activity latch after returning to the authored question47, with silent media. */
export function permitsP010StaticPracticeCompletion(module:AnimationModule,report:RendererPlaybackReport,controls:P010StaticControls):boolean{
 return permitsP010StaticPractice(module,controls)&&report.frameDomain==='sprite-204'&&report.frameCount===83&&report.fps===12&&report.frame===47&&report.complete===true&&report.lessonFinished===false&&report.narration==='unavailable';
}
