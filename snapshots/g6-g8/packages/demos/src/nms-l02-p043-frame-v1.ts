import type { RuntimeContext } from './contract';
import { p043CompletionDomain } from './nms-l02-p043-clock-v1';
import { p043InitialMatching, p043EnterMatching, p043Match, p043FinishCorrectFeedback, p043FinishCompletion, P043_TARGETS, type P043Term } from './nms-l02-p043-matching-v1';

export const P043_SOURCE_SHA256 = 'a6a13838f1301d7665dd4f8a96c561fd3ef23e90ffeaf6e433909d26cc419528';
export const P043_FRAME_DOMAINS = Object.freeze({ root: 10, 'sprite-250': 225, 'sprite-245': 15, 'sprite-249': 20, 'sprite-143': 27, 'sprite-171': 28, 'sprite-183': 25, 'sprite-204': 33, 'sprite-232': 25 });
export const P043_SCENARIOS = Object.freeze(['source-inspection', 'wrong-fraction-row1', 'correct-fraction-row2', 'four-matches-completion'] as const);

/** Capture entry recipes replay the maintained state machine. These are modern
 * deterministic inspection traces, not proof of original-runtime execution.
 * All-match order: fraction/2, equivalent/4, decimal/1, percent/3.
 */
export function p043ModuleFrame(frame: number, context: RuntimeContext) {
  const frameDomain = context.frameDomain ?? 'sprite-250';
  const rootFrame = frameDomain === 'root' ? frame : 6;
  if (!Object.hasOwn(P043_FRAME_DOMAINS, frameDomain) || !Number.isSafeInteger(frame) || frame < 1
    || frame > P043_FRAME_DOMAINS[frameDomain as keyof typeof P043_FRAME_DOMAINS]
    || context.frame !== frame || !['en', 'es'].includes(context.lang)
    || !P043_SCENARIOS.some(id => id === context.scenario)
    || !Number.isSafeInteger(context.replay ?? 0) || (context.replay ?? 0) < 0
    || context.rootFrame !== undefined && context.rootFrame !== rootFrame) throw Error('P043_QUERY_IDENTITY');
  const completionDomain = p043CompletionDomain(context.seed);
  let matching = Object.freeze({ ...p043InitialMatching(), replay: context.replay ?? 0 });
  let mainFrame: number | null = 223;
  if (context.scenario === 'source-inspection') {
    if (frameDomain !== 'root' && frameDomain !== 'sprite-250') throw Error('P043_QUERY_SCENARIO_DOMAIN');
    mainFrame = frameDomain === 'root' ? frame < 6 ? null : 1 : frame;
    if (mainFrame !== null && mainFrame >= 223) matching = p043EnterMatching(matching);
  } else {
    matching = p043EnterMatching(matching);
    if (context.scenario === 'wrong-fraction-row1') {
      if (frameDomain !== 'sprite-245') throw Error('P043_QUERY_SCENARIO_DOMAIN');
      matching = p043Match(matching, 'fraction', 1);
    } else if (context.scenario === 'correct-fraction-row2') {
      if (frameDomain !== 'sprite-249') throw Error('P043_QUERY_SCENARIO_DOMAIN');
      matching = p043Match(matching, 'fraction', 2);
    } else {
      if (frameDomain !== `sprite-${completionDomain}` && !(frameDomain === 'sprite-250' && frame >= 224)) throw Error('P043_QUERY_SCENARIO_DOMAIN');
      for (const term of ['fraction', 'equivalent', 'decimal', 'percent'] as const satisfies readonly P043Term[]) {
        matching = p043FinishCorrectFeedback(p043Match(matching, term, P043_TARGETS[term]));
      }
      if (frameDomain === 'sprite-250') {
        mainFrame = frame;
        if (frame === 225) matching = p043FinishCompletion(matching);
      }
    }
  }
  return Object.freeze({ animationId: 'shared-nms002-l02-p043', sourceSha256: P043_SOURCE_SHA256,
    frame, frameDomain, rootFrame, mainFrame, matching, completionDomain,
    scenario: context.scenario, language: context.lang, seed: context.seed, replay: context.replay ?? 0,
    postStopInspection: context.scenario === 'source-inspection' && mainFrame !== null && mainFrame > 223,
    queryKind: 'deterministic-modern-inspection' as const });
}
