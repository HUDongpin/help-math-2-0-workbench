import type {LessonTextBinding, LessonTextBlockBinding} from './lesson-text-contract';
import {buildLessonTextSnapshot} from './lesson-text-snapshot';
import {P037_GAME_SOURCE as GAME} from './generated/nms-l02-p037-state-source-v1';
import {P037_VISUAL_SOURCE as VISUAL} from './generated/nms-l02-p037-visual-source-v1';
import {p037Matched} from './nms-l02-p037-state-v1';
import type {P037FrameState} from './nms-l02-p037-frame-v1';
const block = (id: string, text: number[], shape: number[], role: LessonTextBlockBinding['role'], readingOrder: number): LessonTextBlockBinding =>
  Object.freeze({id, sourceTextIds: Object.freeze(text.map(n => 'character-' + n)), sourceShapeIds: Object.freeze(shape), role,
    language: 'en', readingOrder, valueSource: 'maintained-page-state'});
/** XML page title, translated Close, native accessibility hints and off-stage
 * coach names are separate from these SWF teaching-text bindings. */
export const P037_TEXT_BINDING: LessonTextBinding = Object.freeze({schemaVersion: 1,
  version: 'nms-l02-p037-native-source-v1', animationId: GAME.animationId, placementId: GAME.animationId,
  sourceSwfSha256: GAME.sourceSha256, template: 'exercise', blocks: Object.freeze([
    block('course-title', [], [2], 'heading', 0), block('activity-title', [], [2], 'title', 1),
    block('instruction', [5], [], 'body', 2), block('fraction-header', [9], [], 'label', 3),
    block('decimal-header', [10], [], 'label', 4),
    block('fractions', [12, 13, 15, 17, 19, 20, 30, 31], [11, 14, 16, 18, 21, 29, 32, 33, 34], 'label', 5),
    block('decimal-bank', [23, 24, 25, 26, 27, 28, 35], [], 'answer', 6),
    block('matched-decimals', [23, 24, 25, 26, 27], [], 'answer', 7),
    block('demonstration', [12, 13, 23, 30, 31, 35], [11], 'label', 8),
    block('success', [57], [], 'feedback', 9), block('help-definition', [75], [], 'body', 10),
    ...[70, 71, 72, 73].map((id, i) => block('help-step-' + (i + 1), [id], i === 1 ? [74] : [], 'body', 11 + i)),
  ])});
export function p037TextValues(s: P037FrameState) {
  const visible = s.mainFrame !== null, state = s.state, intro = VISUAL.states[VISUAL.frames[state.mainFrame - 1]];
  const bank = GAME.cards.filter(c => !p037Matched(state, c.id) && !(c.id === 1 && intro.guide)).map(c => c.decimal).join(' ');
  const matched = GAME.targets.filter(t => p037Matched(state, t.id)).map(t => t.decimal).join(' ');
  const result: Record<string, {text: string; visible: boolean}> = {
    'course-title': {text: 'Fractions, Decimals, and Percents Concepts:', visible},
    'activity-title': {text: 'Instruction', visible},
    instruction: {text: VISUAL.instruction.map(r => r.text).join(''), visible},
    'fraction-header': {text: VISUAL.fractionHeader, visible}, 'decimal-header': {text: VISUAL.decimalHeader, visible},
    fractions: {text: GAME.targets.map(t => t.fraction.join('/')).join('; '), visible},
    'decimal-bank': {text: bank, visible: visible && state.mainFrame < 443 && bank.length > 0},
    'matched-decimals': {text: matched, visible: visible && matched.length > 0},
    demonstration: {text: 'Demonstration: 1/2 = 0.5', visible: visible && intro.guide},
    success: {text: VISUAL.correct, visible: visible && state.successPlaying},
    'help-definition': {text: VISUAL.help.map(r => r.text).join(''), visible: visible && state.popupVisible},
  };
  VISUAL.steps.forEach((text, i) => {result['help-step-' + (i + 1)] = {text, visible: visible && state.popupVisible};});
  return result;
}
export function p037TextSnapshot(s: P037FrameState) {
  return buildLessonTextSnapshot(P037_TEXT_BINDING, {frame: s.frame, frameDomain: s.frameDomain,
    rootFrame: s.rootFrame, scenario: s.scenario, lang: s.language, seed: s.seed, replay: s.replay}, p037TextValues(s));
}
