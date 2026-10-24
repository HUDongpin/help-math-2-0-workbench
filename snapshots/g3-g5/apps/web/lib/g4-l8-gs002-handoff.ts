import type {Gs002GameStart, RuntimeContext} from '../../../packages/demos/src/contract';
import type {LessonTextBinding} from '../../../packages/demos/src/lesson-text-contract';

export function isGs002GameStart(request: unknown): request is Gs002GameStart {
  if (!request || typeof request !== 'object') return false;
  const r = request as Gs002GameStart;
  return r.sourceAnimationId === 'course-g04-l08-gs-002'
    && r.sourcePlacementId === 'g04-l08-placement-035'
    && r.targetAnimationId === 'course-g04-l08-gs-003'
    && r.targetPlacementId === 'g04-l08-placement-036'
    && (r.level === 1 || r.level === 2) && r.startGame === true
    && r.rootEntryFrame === 6 && Number.isSafeInteger(r.sourceFrame)
    && ((r.sourceFrame >= 1 && r.sourceFrame <= 6) || r.sourceFrame === 731 || r.sourceFrame === 732);
}

export interface GsGameRuntimeContext {
  readonly animationId: string;
  readonly moduleKey: string;
  readonly placementId?: string;
  readonly binding?: LessonTextBinding;
  readonly runtime?: RuntimeContext;
  readonly state?: unknown;
  readonly modernText: boolean;
  readonly capture: boolean;
  readonly paused: boolean;
}

function exactSource(current: GsGameRuntimeContext, animationId: string, placementId: string,
  sourceSha256: string, frameDomain: string): boolean {
  const r = current.runtime, s = current.state as Record<string, unknown> | undefined;
  return Boolean(current.modernText && !current.capture && r && s
    && current.animationId === animationId && current.moduleKey === animationId
    && current.placementId === placementId && current.binding?.animationId === animationId
    && current.binding.placementId === placementId && current.binding.sourceSwfSha256 === sourceSha256
    && r.lang === 'en' && r.scenario === 'source-static-frame' && !r.entryStateSha256
    && r.frameDomain === frameDomain && r.rootFrame === 6
    && s.status === 'ready' && s.animationId === animationId && s.sourceSwfSha256 === sourceSha256
    && s.frameDomain === frameDomain && s.rootFrame === 6 && s.frame === r.frame
    && s.language === r.lang && s.scenario === r.scenario && s.seed === (r.seed >>> 0));
}

export function gs002GameStartAllowed(request: unknown, current: GsGameRuntimeContext): request is Gs002GameStart {
  return isGs002GameStart(request) && !current.paused
    && exactSource(current, 'course-g04-l08-gs-002', 'g04-l08-placement-035',
      '73e22cf32ac0b943f053b19b0c839c1173d8d2c3c3e280f80d70be49f4c37def', 'sprite-219')
    && request.sourceFrame === current.runtime!.frame;
}

export function gs003EntryLevelAllowed(level: unknown, current: GsGameRuntimeContext): level is 1 | 2 {
  return (level === 1 || level === 2)
    && exactSource(current, 'course-g04-l08-gs-003', 'g04-l08-placement-036',
      '639ffd18c919d6309f866737c266067895786b8546d7098d34d6c98c9ddf9ac9', 'sprite-223');
}
