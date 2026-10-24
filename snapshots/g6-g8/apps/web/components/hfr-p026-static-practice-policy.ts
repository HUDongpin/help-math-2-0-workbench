import type {AnimationModule, RendererPlaybackReport} from '../../../packages/demos/src/contract';
import type {LessonHostRequest} from '../../../packages/demos/src/lesson-host-contract';

const PAGE = 'shared-nms002-l11-p026';
const SHA = 'a1b2d1ad691061ca206dab4b868eb9ffede0f880cbc58d1888db2896fe0fb4ea';
interface Controls {readonly hostPaused: boolean; readonly hidden: boolean | undefined; readonly reduced: boolean | undefined; readonly blocker: string | null}

function exact(module: AnimationModule) {
  const presentation = module.textPresentation, binding = presentation?.binding;
  const domain = module.runtime?.frameDomains?.find(value => value.id === 'sprite-114');
  return module.key === PAGE && module.clock === 'renderer' && binding?.placementId === PAGE &&
    binding.animationId === PAGE && binding.sourceSwfSha256 === SHA &&
    binding.version === 'hfr-nms-l11-p026-full-source-native-v1' && binding.template === 'complex-figure' &&
    presentation?.reducedMotionFrameByDomain?.['sprite-114'] === 427 && domain?.frameCount === 474 && domain.fps === 12;
}

/** The page renderer checks five source matches and finished coach/right feedback.
 * Only its exact terminal report may cross the reduced-motion hold. */
export function permitsP026StaticPracticeCompletion(module: AnimationModule, report: RendererPlaybackReport, controls: Controls) {
  return exact(module) && !controls.hostPaused && controls.hidden === false && controls.reduced === true &&
    !controls.blocker && report.frameDomain === 'sprite-114' && report.frameCount === 474 && report.fps === 12 &&
    report.frame === 474 && report.complete === true && report.lessonFinished === false && report.narration === 'unavailable';
}

export function permitsP026PausedGlossaryClose(module: AnimationModule, request: LessonHostRequest, controls: Controls) {
  return exact(module) && request.type === 'close-glossary' && controls.hostPaused && controls.hidden === false && !controls.blocker;
}
