import type {AnimationModule,RendererPlaybackReport} from '../../../packages/demos/src/contract';
import type {LessonHostRequest} from '../../../packages/demos/src/lesson-host-contract';
const PAGE='shared-nms002-l11-p022',SHA='36d1bc4ef0af5a83b10e3a908274c91b621161b581ed3775f84b559260ebbb87';
export interface P022StaticControls{readonly hostPaused:boolean;readonly hidden:boolean|undefined;readonly reduced:boolean|undefined;readonly blocker:string|null}
function exact(module:AnimationModule){const p=module.textPresentation,b=p?.binding,d=module.runtime?.frameDomains?.find(d=>d.id==='sprite-65');return module.key===PAGE&&module.clock==='renderer'&&b?.placementId===PAGE&&b.animationId===PAGE&&b.sourceSwfSha256===SHA&&b.version==='hfr-nms-l11-p022-full-source-native-v2'&&b.template==='complex-figure'&&p?.reducedMotionFrameByDomain?.['sprite-65']===172&&d?.frameCount===216&&d.fps===12;}
/** Five source-correct drops, coach/right completion and the actual terminal216
 * stop are checked by the renderer. This exact report crosses only reduced hold. */
export function permitsP022StaticPracticeCompletion(module:AnimationModule,report:RendererPlaybackReport,c:P022StaticControls){return exact(module)&&!c.hostPaused&&c.hidden===false&&c.reduced===true&&!c.blocker&&report.frameDomain==='sprite-65'&&report.frameCount===216&&report.fps===12&&report.frame===216&&report.complete===true&&report.lessonFinished===false&&report.narration==='unavailable';}
/** Closing an owned glossary dismisses UI while its source clock stays paused. */
export function permitsP022PausedGlossaryClose(module:AnimationModule,request:LessonHostRequest,c:P022StaticControls){return exact(module)&&request.type==='close-glossary'&&c.hostPaused&&c.hidden===false&&!c.blocker;}
