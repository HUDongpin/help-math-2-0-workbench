import type {AnimationModule, RendererPlaybackReport} from '../../../packages/demos/src/contract';
import type {LessonHostRequest} from '../../../packages/demos/src/lesson-host-contract';

const PAGE = 'shared-nms002-l11-p027';
const SHA = 'bf11159ecf9dbb76b887f303e707bc0f55697e5ec8b5386ea1b3d6eb524632f5';
interface Controls {readonly hostPaused: boolean; readonly hidden: boolean | undefined; readonly reduced: boolean | undefined; readonly blocker: string | null}

function exact(module: AnimationModule) {
  const presentation = module.textPresentation, binding = presentation?.binding;
  const domain = module.runtime?.frameDomains?.find(value => value.id === 'sprite-142');
  return module.key === PAGE && module.clock === 'renderer' && binding?.placementId === PAGE &&
    binding.animationId === PAGE && binding.sourceSwfSha256 === SHA &&
    binding.version === 'hfr-nms-l11-p027-full-source-native-v1' && binding.template === 'complex-figure' &&
    presentation?.reducedMotionFrameByDomain?.['sprite-142'] === 278 && domain?.frameCount === 298 && domain.fps === 12;
}

/** The page renderer checks four source matches and finished coach/right feedback.
 * Only its exact terminal report may cross the reduced-motion hold. */
export function permitsP027StaticPracticeCompletion(module: AnimationModule, report: RendererPlaybackReport, controls: Controls) {
  return exact(module) && !controls.hostPaused && controls.hidden === false && controls.reduced === true &&
    !controls.blocker && report.frameDomain === 'sprite-142' && report.frameCount === 298 && report.fps === 12 &&
    report.frame === 298 && report.complete === true && report.lessonFinished === false && report.narration === 'unavailable';
}

export function permitsP027PausedGlossaryClose(module: AnimationModule, request: LessonHostRequest, controls: Controls) {
  return exact(module) && request.type === 'close-glossary' && controls.hostPaused && controls.hidden === false && !controls.blocker;
}
