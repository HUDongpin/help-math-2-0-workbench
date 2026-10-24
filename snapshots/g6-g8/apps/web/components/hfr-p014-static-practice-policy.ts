import type {AnimationModule,RendererPlaybackReport} from '../../../packages/demos/src/contract';
const PAGE='shared-nms002-l11-p014',SHA='9d79c185ac136146d1106d8f9082707646d2f0b3990d739ee06a00bac73a6092';
/** Only an exact current source-terminal report may cross this page's reduced-motion hold. */
export function permitsP014StaticPracticeCompletion(module:AnimationModule,report:RendererPlaybackReport,c:Readonly<{hostPaused:boolean;hidden:boolean|undefined;reduced:boolean|undefined;blocker:string|null}>){
 const p=module.textPresentation,b=p?.binding,d=module.runtime?.frameDomains?.find(d=>d.id==='sprite-237');
 return module.key===PAGE&&module.clock==='renderer'&&b?.placementId===PAGE&&b.animationId===PAGE&&b.sourceSwfSha256===SHA&&b.version==='hfr-nms-l11-p014-live-seven-pair-cards-v1'&&b.template==='complex-figure'&&p?.reducedMotionFrameByDomain?.['sprite-237']===228&&d?.frameCount===273&&d.fps===12&&!c.hostPaused&&c.hidden===false&&c.reduced===true&&!c.blocker&&report.frameDomain==='sprite-237'&&report.frameCount===273&&report.fps===12&&report.frame===273&&report.complete===true&&report.lessonFinished===false&&report.narration==='unavailable';
}
