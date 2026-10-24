import type { LessonTextBinding, LessonTextBlockBinding } from './lesson-text-contract';
import { buildLessonTextSnapshot } from './lesson-text-snapshot';
import { P042_TEACHING } from './generated/nms-l02-p042-teaching-v1';
import { P042_LABELS } from './nms-l02-p042-copy-v1';
import { p042EquivalentForms } from './nms-l02-p042-practice-v1';
import type { P042FrameState } from './nms-l02-p042-frame-v1';
const blocks: LessonTextBlockBinding[] = [];
function block(id: string, ids: number[], role: LessonTextBlockBinding['role'] = 'label', shapes: number[] = []) {
  blocks.push(Object.freeze({ id, sourceTextIds: ids.map(n => `character-${n}`), sourceShapeIds: shapes, role, readingOrder: blocks.length, language: 'en', valueSource: 'maintained-page-state' }));
}
block('course-title', [], 'heading', [1]);
block('activity-title', [5, 6, 7], 'title');
block('instruction', [5, 6, 7], 'body', [21, 26, 253]);
block('chart-caption', [13], 'label', [20]);
for (let row = 0; row < 4; row++) {
  block(`color-${row}`, [9 + row]);
  block(`control-${row}`, [9 + row], 'label', [251, 253]);
  for (const [column, heading, values] of [['percent', 5, [205 + row]], ['fraction', 6, [209 + row * 2, 210 + row * 2]], ['decimal', 7, [217 + row]]] as const) {
    block(`${column}-heading-${row}`, [heading]);
    block(`${column}-value-${row}`, [...values]);
  }
}
block('total', [13, 15, 16, 19], 'label', [137, 160, 162]);
export const P042_TEXT_BINDING: LessonTextBinding = Object.freeze({ schemaVersion: 1, version: 'nms-l02-p042-native-source-v1', animationId: 'shared-nms002-l02-p042', placementId: 'shared-nms002-l02-p042', sourceSwfSha256: P042_TEACHING.sourceSha256, template: 'exercise', blocks: Object.freeze(blocks) });
export function p042TextSnapshot(state: P042FrameState) {
  const frame = Math.min(625, state.mainFrame ?? 1), visible = state.mainFrame !== null, blank = frame >= 498 && frame < 625;
  const copy = P042_LABELS[state.language];
  const percentages = frame === 625 ? state.percentages : P042_TEACHING.beats.find(b => frame >= b.firstFrame && frame <= b.lastFrame)?.percentages ?? [25, 25, 25, 25];
  const values: Record<string, { text: string; visible: boolean }> = {};
  const add = (id: string, text: string) => { values[id] = { text, visible }; };
  add('course-title', 'Fractions, Decimals, and Percents Concepts: Instruction');
  add('activity-title', copy.title);
  add('instruction', frame === 625 ? copy.instruction : blank ? copy.preparation : copy.demonstration);
  add('chart-caption', copy.chart);
  percentages.forEach((percent, row) => {
    const forms = p042EquivalentForms(percent);
    add(`color-${row}`, copy.names[row]);
    add(`control-${row}`, row < 3 ? `${copy.adjust} ${copy.names[row]}` : copy.linked);
    for (const [column, label, value] of [['percent', copy.percent, forms.percent], ['fraction', copy.fraction, `${forms.numerator}/${forms.denominator}`], ['decimal', copy.decimal, forms.decimal]]) {
      add(`${column}-heading-${row}`, label); add(`${column}-value-${row}`, blank ? '—' : value);
    }
  });
  add('total', `${copy.total}: ${blank ? '—' : '100% = 1 = 1.0'}`);
  const binding = { ...P042_TEXT_BINDING, blocks: P042_TEXT_BINDING.blocks.map(b => ({ ...b, language: b.id === 'course-title' ? 'en' as const : state.language })) };
  return buildLessonTextSnapshot(binding, { frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame, scenario: state.scenario, lang: state.language, seed: state.seed, replay: state.replay }, values);
}
