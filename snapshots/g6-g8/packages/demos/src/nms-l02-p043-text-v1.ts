import type { LessonTextBinding, LessonTextBlockBinding } from './lesson-text-contract';
import { buildLessonTextSnapshot } from './lesson-text-snapshot';
import { P043_COPY } from './nms-l02-p043-copy-v1';
import { P043_COMPLETION_TEXT } from './nms-l02-p043-completion-v1';
import { P043_SOURCE_SHA256, p043ModuleFrame } from './nms-l02-p043-frame-v1';
import { P043_TARGETS } from './nms-l02-p043-matching-v1';
import { P043_DIAGRAM_DESCRIPTIONS, p043DiagramCaption, type P043Picture } from './nms-l02-p043-diagrams-v1';
import { P043_GLOSSARY } from './generated/nms-l02-p043-glossary-v1';
const blocks: LessonTextBlockBinding[] = [];
function block(id: string, ids: number[], role: LessonTextBlockBinding['role'] = 'label') {
  blocks.push(Object.freeze({ id, sourceTextIds: ids.map(n => `character-${n}`), role,
    readingOrder: blocks.length, language: 'en', valueSource: 'maintained-page-state' }));
}
block('course-title', [53], 'heading');
block('activity-title', [55], 'title');
block('instruction', [55], 'body');
block('action', [55], 'body');
const terms = ['fraction', 'equivalent', 'decimal', 'percent'] as const;
for (const [index, term] of terms.entries()) block(`term-${term}`, [72,75,74,73].slice(index,index+1));
for (let row = 1; row <= 4; row++) {
  block(`row-${row}-answer`, [74,72,73,75].slice(row-1,row), 'answer');
  block(`row-${row}-definition`, [64,67,66,65].slice(row-1,row), 'body');
}
block('wrong', [244], 'feedback');
block('close', [237]);
// "Correct!" is modern accessible status for the source correct-audio event.
block('correct', [248], 'feedback');
for (const [domain, text] of Object.entries(P043_COMPLETION_TEXT)) block(`completion-${domain}`, [...text.sourceTextIds], 'feedback');
const pictures = ['decimal', 'fraction', 'percent', 'equivalent'] as const;
const pictureIds = { decimal: [80], fraction: [83,85,93,114,115,118], percent: [92,124], equivalent: [87,88,89,90] };
for (const picture of pictures) {
  block(`picture-${picture}`, pictureIds[picture]);
  block(`picture-description-${picture}`, pictureIds[picture], 'body');
  block(`expanded-${picture}`, pictureIds[picture]);
}
const glossaryIds = {fraction:[64], power:[64], whole:[64,67], part:[67], group:[67], value:[65]};
for (const term of P043_GLOSSARY) {
  block(`glossary-${term.id}`, glossaryIds[term.id]);
  block(`glossary-definition-${term.id}`, glossaryIds[term.id], 'body');
}
export const P043_TEXT_BINDING: LessonTextBinding = Object.freeze({ schemaVersion: 1,
  version: 'nms-l02-p043-native-source-v1', animationId: 'shared-nms002-l02-p043', placementId: 'shared-nms002-l02-p043',
  sourceSwfSha256: P043_SOURCE_SHA256, template: 'exercise', blocks: Object.freeze(blocks) });
export type P043TextOverlay = {kind:'picture'; picture: Exclude<P043Picture,'decimal'>} | {kind:'glossary'; id: typeof P043_GLOSSARY[number]['id']} | null;
export function p043TextSnapshot(state: ReturnType<typeof p043ModuleFrame>, overlay: P043TextOverlay = null) {
  if (overlay && (state.mainFrame === null || state.mainFrame < 11 || state.matching.phase === 'wrong-feedback'
    || overlay.kind === 'picture' && (state.mainFrame < 223 || !['fraction','percent','equivalent'].includes(overlay.picture))
    || overlay.kind === 'glossary' && !P043_GLOSSARY.some(t=>t.id===overlay.id))) throw Error('P043_TEXT_OVERLAY_IDENTITY');
  const c = P043_COPY[state.language], visible = state.mainFrame !== null;
  const rowsVisible = visible && state.mainFrame! >= 11;
  const values: Record<string, {text: string; visible: boolean}> = {};
  const add = (id: string, text: string, show = visible) => { values[id] = {text, visible: show}; };
  add('course-title', 'Fractions, Decimals, and Percent Concepts: Try It!');
  add('activity-title', c.title); add('instruction', c.instruction);
  add('action', state.matching.phase === 'intro' ? c.wait : c.action);
  for (const term of terms) add(`term-${term}`, c.names[term], rowsVisible && !state.matching.matched.includes(term));
  for (let row = 1; row <= 4; row++) {
    const term = state.matching.matched.find(t => P043_TARGETS[t] === row);
    add(`row-${row}-answer`, term ? c.names[term] : String(row), rowsVisible);
    add(`row-${row}-definition`, c.definitions[row-1], rowsVisible);
  }
  const wrong = visible && state.matching.phase === 'wrong-feedback';
  add('wrong', c.wrong, wrong); add('close', c.close, wrong || overlay !== null);
  add('correct', c.correct, visible && state.matching.phase === 'correct-feedback');
  for (const [domain, text] of Object.entries(P043_COMPLETION_TEXT)) add(`completion-${domain}`, text[state.language], visible
    && domain === state.completionDomain && ['completion-feedback','complete'].includes(state.matching.phase));
  for (const picture of pictures) {
    add(`picture-${picture}`, p043DiagramCaption(picture,state.language),rowsVisible);
    add(`picture-description-${picture}`, P043_DIAGRAM_DESCRIPTIONS[state.language][picture],rowsVisible);
    add(`expanded-${picture}`,p043DiagramCaption(picture,state.language),overlay?.kind==='picture' && overlay.picture===picture);
  }
  for (const term of P043_GLOSSARY) {
    add(`glossary-${term.id}`,term.labels[state.language],rowsVisible);
    add(`glossary-definition-${term.id}`,term.definitions[state.language],overlay?.kind==='glossary' && overlay.id===term.id);
  }
  const binding = { ...P043_TEXT_BINDING, blocks: blocks.map(b => ({...b, language: b.id === 'course-title' ? 'en' as const : state.language})) };
  return buildLessonTextSnapshot(binding, {frame: state.frame, frameDomain: state.frameDomain, rootFrame: state.rootFrame,
    scenario: state.scenario, lang: state.language, seed: state.seed, replay: state.replay}, values);
}
