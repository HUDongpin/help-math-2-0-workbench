import type { RuntimeContext } from './contract';
import { p038InitialState, p038Reduce, type P038State } from './alg-l08-p038-state-v1';
import { ALG_L08_P038_PRESENTATION_SOURCE as V, type P038Visual, type P038Spans } from './alg-l08-p038-presentation-source-v1';
export const L8P038_DOMAINS = Object.freeze([
  { id: 'root', frameCount: 10 }, { id: 'sprite-585', frameCount: 525, rootFrame: 6 }, { id: 'sprite-570', frameCount: 1, rootFrame: 6 },
  ...[77, 79, 80, 81, 82].map(id => ({ id: `sprite-${id}`, frameCount: 2, rootFrame: 6 })),
  ...[549, 544, 548, 529, 531].map(id => ({ id: `sprite-${id}`, frameCount: 1, rootFrame: 6 })),
]);
export const L8P038_MOVIE = Object.freeze({ stage: Object.freeze({ width: 800, height: 600 }), fps: 12, frameCount: 10, durationMs: 10000 / 12 });
export const L8P038_DEFAULTS = Object.freeze(Object.fromEntries(L8P038_DOMAINS.map(domain => [domain.id, domain.id === 'sprite-570' ? 'coach' : domain.id === 'sprite-544' ? 'incomplete-hint' : domain.id === 'sprite-548' ? 'wrong-first' : ['root', 'sprite-585'].includes(domain.id) ? 'source-vocabulary' : 'source-child'])));
function at(spans: P038Spans, frame: number): P038Visual {
  const value = spans.find(span => frame >= span.first && frame <= span.last)?.value;
  if (!value) throw new Error('P038_SOURCE_VISUAL_MISSING'); return value;
}
export function p038MainVisual(frame: number): P038Visual {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 525) throw new Error('P038_INVALID_MAIN_FRAME'); return at(V.mainStates, frame);
}
export function p038PointVisual(sprite: number, frame: number): P038Visual {
  const points = V.pointVisuals.find(point => point.spriteId === sprite); if (!points) throw new Error('P038_UNKNOWN_POINT_SPRITE'); return at(points.states, frame);
}
export function p038View(state: P038State, context: RuntimeContext, inspectionVisual: P038Visual | null = null, ready = true) {
  const visual = p038MainVisual(state.mainFrame), visibleTexts = (inspectionVisual ?? visual).nodes.filter(node => node.kind === 'text' && node.alpha > 0);
  return Object.freeze({
    animationId: V.animationId, state, visual, inspectionVisual, ready,
    rootVisual: at(V.rootStates, context.frameDomain === 'root' ? context.frame : 6),
    frame: context.frame, frameDomain: context.frameDomain ?? 'sprite-585', rootFrame: context.frameDomain === 'root' ? context.frame : 6,
    language: context.lang, scenario: context.scenario, seed: context.seed, replay: context.replay ?? 0,
    traceId: context.traceId ?? '', requirementId: context.requirementId ?? '', entryStateSha256: context.entryStateSha256 ?? '',
    sourceTextIds: [...new Set(visibleTexts.map(node => node.kind === 'text' ? node.sourceTextId : ''))],
  });
}
export function algL08P038Frame(frame: number, context: RuntimeContext = { frame, frameDomain: 'sprite-585', scenario: 'source-vocabulary', lang: 'en', seed: 0 }) {
  const domain = context.frameDomain ?? 'sprite-585', spec = L8P038_DOMAINS.find(candidate => candidate.id === domain);
  if (!spec || !Number.isSafeInteger(frame) || frame < 1 || frame > spec.frameCount || !['en', 'es'].includes(context.lang) || !Number.isSafeInteger(context.seed) || context.seed < 0 || context.seed > 4294967295 || !Number.isSafeInteger(context.replay ?? 0) || (context.replay ?? 0) < 0) throw new Error('P038_INVALID_FRAME_IDENTITY');
  let state = p038InitialState(0, context.replay ?? 0), inspection: P038Visual | null = null;
  if (context.scenario !== L8P038_DEFAULTS[domain]) throw new Error('P038_INVALID_FRAME_SCENARIO');
  if (domain === 'root' || domain === 'sprite-585') {
    const main = domain === 'root' ? 1 : frame;
    state = { ...state, mainFrame: main, phase: main < 208 ? 'prequiz' : main === 208 ? 'quiz-held' : main === 525 ? 'ended' : 'postquiz', mainRunning: main < 208 || main > 208 && main < 525, quizSection: main === 208, controlsEnabled: main === 208, fixed: state.fixed.map(point => ({ ...point, visible: main === 208 })) };
  } else {
    state = p038Reduce(p038Reduce(state, { type: 'play', epoch: 0 }), { type: 'advance-main', frame: 208, epoch: 0 });
    if (domain === 'sprite-570') { state = { ...state, help: true, controlsEnabled: false }; inspection = V.coachVisual; }
    else if (domain === 'sprite-544' || domain === 'sprite-548') {
      const id = Number(domain.slice(7)); inspection = at(V.popupVisuals.find(popup => popup.spriteId === id)!.states, 1);
    } else {
      const id = Number(domain.slice(7)), marker = V.offstageAudioMarkers.find(marker => marker.spriteId === id);
      inspection = marker?.firstFrame ?? p038PointVisual(id, frame);
    }
  }
  return p038View(state, { ...context, frame, frameDomain: domain }, inspection, domain !== 'root' || frame >= 6);
}
export type P038View = ReturnType<typeof p038View>;
