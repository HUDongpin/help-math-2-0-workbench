import type {RuntimeContext} from './contract';
import {P037_GAME_SOURCE as SOURCE} from './generated/nms-l02-p037-state-source-v1';
import {P037_ID, p037Initial, p037Advance, p037Drop, p037OpenTerm,
  type P037State, type P037TermId} from './nms-l02-p037-state-v1';

export const P037_SCENARIOS = Object.freeze([
  {id: 'source-practice', label: 'Source fraction and decimal matching'},
  {id: 'wrong-drop', label: 'Source wrong-drop feedback'},
  {id: 'all-correct', label: 'Five exact source matches'},
  {id: 'late-distractor', label: 'Distractor during completion feedback'},
  {id: 'replay', label: 'Deterministic source Replay'},
  ...(['column', 'equivalent-decimal', 'simple-simpler-simplest', 'decimal-equivalent', 'fraction'] as const)
    .map(id => ({id: id + '-glossary', label: 'Source ' + id + ' glossary'})),
].map(s => Object.freeze(s)));
export const P037_FRAME_DOMAINS = Object.freeze({root: 10, 'sprite-80': 483,
  'sprite-52': 20, 'sprite-58': 25, 'sprite-79': 15});
const intro = [p037Initial()];
for (let frame = 2; frame <= 442; frame++) intro.push(p037Advance(intro[frame - 2], 1));
Object.freeze(intro);
const exercise = intro[441];
function solved() {
  let state = exercise;
  for (let id = 1; id <= 5; id++) state = p037Advance(p037Drop(state, id, id), 18);
  return state;
}
const celebration = solved();
const outro = p037Advance(celebration, 23);
function mainState(frame: number, scenario: string): P037State {
  if (frame < 442) return intro[frame - 1];
  if (frame > 442) return p037Advance(outro, frame - 442);
  if (scenario === 'all-correct') return celebration;
  if (scenario === 'late-distractor') return p037Drop(celebration, 6, null);
  if (scenario === 'wrong-drop' || ['simple-simpler-simplest-glossary', 'decimal-equivalent-glossary', 'fraction-glossary'].includes(scenario)) return p037Drop(exercise, 6, 1);
  return exercise;
}
/** Source-local inspection selects a legal invocation of the requested child.
 * This is an inspection fixture, not an absolute timestamp in one playthrough.
 * Frame 25 of sprite58 is reported after its authored gotoAndStop(1) action. */
function localState(domain: string, frame: number, scenario: string): P037State {
  if (domain === 'root') return intro[0];
  if (domain === 'sprite-80') return mainState(frame, scenario);
  if (frame === 1) return exercise;
  if (domain === 'sprite-52') return p037Advance(p037Drop(exercise, 1, 1), frame - 2);
  if (domain === 'sprite-58') {
    const start = scenario === 'late-distractor' ? p037Drop(celebration, 6, null) : celebration;
    return p037Advance(start, frame - 2);
  }
  return p037Advance(p037Drop(exercise, 6, 1), frame - 2);
}
export function p037ModuleFrame(frame: number, c: RuntimeContext) {
  const frameDomain = c.frameDomain ?? 'sprite-80';
  const count = P037_FRAME_DOMAINS[frameDomain as keyof typeof P037_FRAME_DOMAINS];
  const rootFrame = frameDomain === 'root' ? frame : SOURCE.rootEntry;
  if (!Object.hasOwn(P037_FRAME_DOMAINS, frameDomain) || !Number.isSafeInteger(frame) || frame < 1 || frame > count
    || c.frame !== frame || !['en', 'es'].includes(c.lang) || !P037_SCENARIOS.some(s => s.id === c.scenario)
    || c.rootFrame !== undefined && c.rootFrame !== rootFrame) throw Error('P037_FRAME_IDENTITY');
  // Validate identity even when the selected frame has no visible main clip.
  p037Initial(c.seed, c.replay ?? 0);
  const visible = frameDomain !== 'root' || frame >= SOURCE.rootEntry;
  let state = Object.freeze({...localState(frameDomain, frame, c.scenario), seed: c.seed, replay: c.replay ?? 0});
  const requestedTerm = c.scenario.endsWith('-glossary') ? c.scenario.slice(0, -9) as P037TermId : null;
  if (visible && requestedTerm) state = p037OpenTerm(state, requestedTerm);
  return Object.freeze({animationId: P037_ID, sourceSha256: SOURCE.sourceSha256, frame, frameDomain,
    domain: frameDomain === 'root' ? 'root' : frameDomain.slice(7), rootFrame,
    mainFrame: visible ? state.mainFrame : null, language: c.lang, seed: c.seed, replay: c.replay ?? 0,
    scenario: c.scenario, queryKind: 'source-local-inspection' as 'source-local-inspection' | 'live-state',
    requestedTerm, termAvailable: requestedTerm !== null && state.term === requestedTerm,
    actionDisposition: frameDomain === 'sprite-58' && frame === 25 ? 'post-action-reset-to-1' : 'normal', state});
}
export type P037FrameState = ReturnType<typeof p037ModuleFrame>;
export function p037LiveFrame(state: P037State, language: 'en' | 'es'): P037FrameState {
  if (!['en', 'es'].includes(language)) throw Error('P037_LANGUAGE');
  return Object.freeze({animationId: P037_ID, sourceSha256: SOURCE.sourceSha256,
    frame: state.mainFrame, frameDomain: 'sprite-80', domain: '80', rootFrame: SOURCE.rootEntry,
    mainFrame: state.mainFrame, language, seed: state.seed, replay: state.replay,
    scenario: 'live-interaction', queryKind: 'live-state', requestedTerm: state.term,
    termAvailable: state.term !== null, actionDisposition: 'normal', state});
}
