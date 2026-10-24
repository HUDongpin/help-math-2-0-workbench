import type { RuntimeContext } from './contract';
import { P042_TEACHING } from './generated/nms-l02-p042-teaching-v1';
import { replayP042Practice } from './nms-l02-p042-practice-v1';
export const P042_FRAME_DOMAINS = Object.freeze({ root: 10, 'sprite-261': 626 });
export const P042_SCENARIOS = Object.freeze([{ id: 'source-explanation', label: 'Source equivalent-percent demonstration and initial practice' }]);
export function p042ModuleFrame(frame: number, context: RuntimeContext) {
  const frameDomain = context.frameDomain ?? 'sprite-261';
  const rootFrame = frameDomain === 'root' ? frame : 6;
  if (!Object.hasOwn(P042_FRAME_DOMAINS, frameDomain) || !Number.isSafeInteger(frame) || frame < 1
    || frame > P042_FRAME_DOMAINS[frameDomain as keyof typeof P042_FRAME_DOMAINS] || context.frame !== frame
    || !['en', 'es'].includes(context.lang) || context.scenario !== 'source-explanation'
    || !Number.isSafeInteger(context.seed) || context.seed < 0 || context.seed > 0xffffffff
    || !Number.isSafeInteger(context.replay ?? 0) || (context.replay ?? 0) < 0
    || context.rootFrame !== undefined && context.rootFrame !== rootFrame) throw Error('P042_QUERY_IDENTITY');
  const mainFrame = frameDomain === 'root' ? frame < 6 ? null : 1 : frame;
  return Object.freeze({ animationId: 'shared-nms002-l02-p042', sourceSha256: P042_TEACHING.sourceSha256,
    frame, frameDomain, rootFrame, mainFrame, language: context.lang, seed: context.seed,
    replay: context.replay ?? 0, scenario: context.scenario, percentages: replayP042Practice(),
    postStopInspection: mainFrame === 626, queryKind: 'source-local-inspection' as const });
}
export type P042FrameState = ReturnType<typeof p042ModuleFrame>;
