import type {AnimationModule} from '../../../packages/demos/src/contract';

/** G678 retains its existing authoredTimelineControls/interactiveStops host.
 * Only the shared native presentation is new; unsupported G3 child-host
 * extensions fail explicitly instead of mounting an inert interaction. */
export async function prepareG678LessonTypography(module: AnimationModule | undefined, capture: boolean) {
  const presentation=module?.textPresentation;
  if(!module||!presentation||capture)return module;
  const binding=presentation.binding;
  if(presentation.schemaVersion!==1||!/^shared-(?:nms002|geo001|alg001|dat001)-l\d+-p\d+$/.test(module.key)
    ||binding.animationId!==module.key||!binding.version||!/^[a-f0-9]{64}$/.test(binding.sourceSwfSha256)
    ||!presentation.Renderer||typeof presentation.getSnapshot!=='function')throw new Error('G678 native text presentation is not source-bound');
  if(presentation.frameControl||presentation.activityTimelines?.length||presentation.completion||presentation.keyTerms
    ||presentation.sourceTimelineAudioCues?.length)throw new Error('Use the existing G678 source host contracts; this G3 host extension has not been integrated here');
  for(const [domain,frame] of Object.entries(presentation.reducedMotionFrameByDomain??{})){
    const count=domain==='root'?(module.runtime??module.movie).frameCount:module.runtime?.frameDomains?.find(item=>item.id===domain)?.frameCount;
    if(!count||!Number.isSafeInteger(frame)||frame<1||frame>count)throw new Error('G678 reduced-motion text state is outside its source timeline');
  }
  await presentation.prepare?.();
  return module;
}
