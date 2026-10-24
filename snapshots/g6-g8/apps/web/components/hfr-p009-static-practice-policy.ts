import type {AnimationModule,RendererPlaybackReport} from '../../../packages/demos/src/contract';
import type {LessonHostRequest} from '../../../packages/demos/src/lesson-host-contract';

const PAGE='shared-nms002-l11-p009',SHA='adec3c300a897fb11c12b06ab406a8c4352c0c24353f7890097c903fae6f67c5';
export function isP009StaticPracticeModule(module:AnimationModule):boolean{
 const p=module.textPresentation,b=p?.binding,domain=module.runtime?.frameDomains?.find(d=>d.id==='sprite-221');
 return module.key===PAGE&&module.clock==='renderer'&&b?.animationId===PAGE&&b.placementId===PAGE&&b.sourceSwfSha256===SHA&&b.version==='hfr-nms-l11-p009-full-native-v1'&&b.template==='exercise'&&p?.reducedMotionFrameByDomain?.['sprite-221']===64&&domain?.frameCount===98&&domain.fps===12;
}
export interface P009StaticControls{readonly hostPaused:boolean;readonly hidden:boolean|undefined;readonly reduced:boolean|undefined;readonly blocker:string|null}
export function permitsP009StaticPractice(module:AnimationModule,controls:P009StaticControls):boolean{return isP009StaticPracticeModule(module)&&!controls.hostPaused&&controls.hidden===false&&controls.reduced===true&&!controls.blocker;}
/** Only the selected authored feedback result may cross a reduced-motion clock
 * hold. Navigation, audio, legacy operations and unrelated practice stay held. */
export function permitsP009StaticPracticeRequest(module:AnimationModule,request:LessonHostRequest,controls:P009StaticControls):boolean{
 if(!permitsP009StaticPractice(module,controls)||request.type!=='record-practice-feedback')return false;
 const count=request.outcome==='correct'?4:request.outcome==='incorrect'?3:0;
 return count>0&&request.interactionId===PAGE&&request.branchCount===count&&Number.isSafeInteger(request.branchIndex)&&request.branchIndex>=1&&request.branchIndex<=count;
}
/** The renderer remains source-clock authority. Static completion may pass only
 * for this exact activity's reported correct terminal stop, with silent media. */
export function permitsP009StaticPracticeCompletion(module:AnimationModule,report:RendererPlaybackReport,controls:P009StaticControls):boolean{
 return permitsP009StaticPractice(module,controls)&&report.frameDomain==='sprite-221'&&report.frameCount===98&&report.fps===12&&report.frame===98&&report.complete===true&&report.lessonFinished===false&&report.narration==='unavailable';
}
