'use client';

import React from 'react';
import source from './generated/g4-l3-ts004-text.json';
import glossaryTargets from '../../../../scripts/inputs/typography-v1/g4-l3-ts004/glossary-target-disposition.json';

const DOMAIN = 'sprite-70';
const sourceFrame = source.frames[104];
const sourceLetters = sourceFrame.placements.filter(item =>
  item.depth >= 22 && item.depth <= 101 && item.characterId >= 30 && item.characterId <= 60);
if (sourceLetters.length !== 79) throw new Error('TS004 source letter set changed');

const lines = new Map<number, typeof sourceLetters>();
for (const item of sourceLetters) {
  const y = item.matrix[5];
  lines.set(y, [...(lines.get(y) ?? []), item]);
}
const leftLines = [
  [-2964, 'write an equation and'],
  [-2545, 'solve it'],
  [-2116, 'draw a picture'],
  [-1627, 'look for a pattern'],
  [-1188, 'systematically guess'],
  [-669, 'and check'],
] as const;
if (lines.size !== leftLines.length) throw new Error('TS004 source strategy line count changed');
const sourceLine = (y: number, copy: string) => {
  const letters = [...(lines.get(y) ?? [])].sort((a, b) => a.matrix[4] - b.matrix[4]);
  const recovered = letters.map(item => source.texts[String(item.characterId) as keyof typeof source.texts].text).join('');
  if (recovered !== copy.replaceAll(' ', '')) throw new Error(`TS004 source strategy line changed at ${y}`);
  return {copy, depths: letters.map(item => item.depth)};
};
const leftRows = leftLines.map(([y, copy]) => sourceLine(y, copy));
const leftStrategies = [
  {id: 'write-equation', lines: leftRows.slice(0, 2)},
  {id: 'draw-picture', lines: leftRows.slice(2, 3)},
  {id: 'look-pattern', lines: leftRows.slice(3, 4)},
  {id: 'guess-check', lines: leftRows.slice(4, 6)},
].map(item => ({id: item.id, text: item.lines.map(line => line.copy).join(' '),
  depths: item.lines.flatMap(line => line.depths)}));

const rightRuns = source.texts['62'].runs;
const rightLines = new Map<number, string>();
for (const run of rightRuns) {
  if (run.y === null) throw new Error('TS004 right strategy line has no source y');
  rightLines.set(run.y, (rightLines.get(run.y) ?? '') + run.text);
}
const rightStrategies = [...rightLines].sort((a, b) => a[0] - b[0])
  .map(([y, copy]) => ({id: `right-${y}`, text: copy.trim()}));
if (rightStrategies.length !== 4 ||
    rightStrategies.map(item => item.text).join(' ') !== source.texts['62'].text) {
  throw new Error('TS004 source right strategy lines changed');
}
const stepRuns = source.texts['15'].runs.map(run => run.text);
if (JSON.stringify(stepRuns) !== JSON.stringify(['Solve', ' the ', 'problem', '.'])) {
  throw new Error('TS004 source active-step word runs changed');
}
for (const target of glossaryTargets.buttons) {
  const sourceButton = source.glossary.find(item => item.buttonId === target.buttonId);
  if (!sourceButton || sourceButton.sourceKey !== target.sourceKey ||
      (target.nativeTarget && !sourceButton.entryId &&
        !('sourceKeyLookup' in target && target.sourceKeyLookup))) {
    throw new Error(`TS004 glossary target ${target.buttonId} is not source-backed`);
  }
}

function splitUnique(copy: string, word: string) {
  const index = copy.indexOf(word);
  if (index < 0 || copy.indexOf(word, index + word.length) >= 0) {
    throw new Error(`TS004 source word ${word} is not unique in ${copy}`);
  }
  return [copy.slice(0, index), copy.slice(index + word.length)] as const;
}

export type Ts004SourceTerm = Readonly<{
  buttonId: number; sourceKey: string; nativeTarget: string;
}> & (Readonly<{lookup: 'entry-id'; entryId: string}>
  | Readonly<{lookup: 'source-key'}>);

export interface Ts004SceneProps {
  readonly frame: number;
  readonly reducedMotion?: boolean;
  readonly onOpenKeyTerm?: (term: Ts004SourceTerm,
    trigger: HTMLButtonElement) => void;
}

/** Structural SWF placements only; not an observed original-runtime trace. */
export function getTs004SceneState(frame: number, reducedMotion = false) {
  if (!Number.isInteger(frame) || frame < 1 || frame > source.frameCount) {
    throw new Error('TS004 frame is outside the source sprite');
  }
  const placements = new Map(source.frames[frame - 1].placements.map(item => [item.depth, item]));
  const opacity = (depth: number) => {
    const item = placements.get(depth);
    return item ? (reducedMotion ? 1 : item.alpha) : 0;
  };
  const byCharacter = (id: number) => source.frames[frame - 1].placements
    .filter(item => item.characterId === id).reduce((highest, item) => Math.max(highest, opacity(item.depth)), 0);
  const left = leftStrategies.map(item => ({...item,
    opacity: Math.min(...item.depths.map(opacity))}));
  const rightOpacity = byCharacter(62);
  const buttons = glossaryTargets.buttons.flatMap<Ts004SourceTerm>(target => {
    if (!target.nativeTarget || !source.frames[frame - 1].placements.some(item =>
      item.characterId === target.buttonId && item.alpha > 0)) return [];
    const term = source.glossary.find(item => item.buttonId === target.buttonId);
    if (!term || term.sourceKey !== target.sourceKey) throw new Error(`TS004 glossary ${target.buttonId} has no source key`);
    if ('sourceKeyLookup' in target && target.sourceKeyLookup) {
      return [{buttonId: target.buttonId, sourceKey: term.sourceKey,
        lookup: 'source-key', nativeTarget: target.nativeTarget}];
    }
    if (!term.entryId) throw new Error(`TS004 glossary ${target.buttonId} has no entry`);
    return [{buttonId: target.buttonId, sourceKey: term.sourceKey,
      lookup: 'entry-id', entryId: term.entryId, nativeTarget: target.nativeTarget}];
  });
  return {
    frame, frameDomain: DOMAIN, title: source.texts['2'].text,
    activeStep: byCharacter(15) > 0 && byCharacter(16) > 0 ?
      `${source.texts['16'].text} ${source.texts['15'].text}` : null,
    activeStepOpacity: Math.min(byCharacter(15), byCharacter(16)),
    emphasis: {Solve: !reducedMotion && byCharacter(21) > 0,
      problem: !reducedMotion && byCharacter(22) > 0},
    planNumbers: [10, 7, 8, 9].map(id =>
      source.texts[String(id) as keyof typeof source.texts].text + source.texts['6'].text),
    plan: [
      source.texts['11'].text,
      source.texts['13'].text,
      byCharacter(17) > 0 ? source.texts['17'].text : null,
      null,
    ],
    planStepThreeOpacity: byCharacter(17),
    strategiesHeading: byCharacter(24) > 0 ? source.texts['24'].text.trim() : null,
    strategiesHeadingOpacity: byCharacter(24),
    left, right: rightStrategies.map(item => ({...item, opacity: rightOpacity})),
    buttons,
    finalInstruction: byCharacter(68) > 0 ? source.texts['68'].text : null,
    finalInstructionOpacity: byCharacter(68),
  };
}

const styles = `
.ts004-native{box-sizing:border-box;inline-size:100%;max-inline-size:68rem;margin:auto;padding:clamp(.75rem,2vw,1.5rem);font-family:var(--lesson-text-font-body,system-ui,sans-serif);color:#13243b;background:#f5f9ff;container-type:inline-size}
.ts004-native *{box-sizing:border-box}
.ts004-native h2{margin:0 0 1rem}
.ts004-native h3{margin:0 0 .75rem}
.ts004-native__active-step{padding:.45rem .75rem;border-inline-start:4px solid #2363aa;background:#eaf3ff}
.ts004-native__plan{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;list-style:none;padding:0;margin:0 0 1.25rem}
.ts004-native__plan li{min-inline-size:0;min-block-size:5rem;padding:.7rem .85rem;display:flex;gap:.5rem;background:#fff;border:2px solid #8fa9c8;border-radius:.7rem;font-size:var(--lesson-text-body-size,1.125rem);line-height:var(--lesson-text-line-height,1.6);overflow-wrap:anywhere}
.ts004-native__number{font-weight:800;white-space:nowrap}
.ts004-native__strategies{padding:1rem;background:#fff;border-radius:.7rem;box-shadow:0 2px 12px #112c4b17}
.ts004-native__strategies h3::before{content:'';display:inline-block;inline-size:.6rem;block-size:.6rem;margin-inline-end:.6rem;border-radius:50%;background:#bd271b;vertical-align:middle}
.ts004-native__columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
.ts004-native__columns ul{min-inline-size:0;margin:0;padding-inline-start:1.5rem;list-style:disc}
.ts004-native__columns li{padding-inline-start:.15rem;font-size:var(--lesson-text-body-size,1.125rem);line-height:var(--lesson-text-line-height,1.6);overflow-wrap:anywhere}
.ts004-native__term{display:inline-flex;align-items:center;min-inline-size:44px;min-block-size:44px;padding:0;border:0;background:transparent;color:#1556a0;font:inherit;vertical-align:middle;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em;cursor:pointer}
.ts004-native__term[data-emphasis='true']{background:#ffeb81;border-radius:.2rem}
.ts004-native__term:focus-visible{outline:3px solid #1556a0;outline-offset:3px;border-radius:.2rem}
.ts004-native__final{display:flex;align-items:flex-start;gap:.65rem;margin:1rem 0 0;padding:.5rem .75rem;background:#fff;font-size:var(--lesson-text-body-size,1.125rem);line-height:var(--lesson-text-line-height,1.6)}
.ts004-native__final::before{content:'';flex:none;inline-size:.65rem;block-size:.65rem;margin-block-start:.55em;border-radius:50%;background:#bd271b}
@container lesson-text (min-width:48rem){.ts004-native__plan,.ts004-native__columns,.ts004-native__final{--lesson-text-body-size:1.25rem}}
@container (max-width:34rem){.ts004-native__columns{grid-template-columns:1fr}}
@container (max-width:22rem){.ts004-native__plan{grid-template-columns:1fr}}
@media (max-width:400px){
.ts004-native{padding-inline:.25rem}
.ts004-native h2,.ts004-native h3{overflow-wrap:anywhere}
.ts004-native__active-step{padding-inline:.25rem}
.ts004-native__plan li{padding-inline:.3rem;overflow-wrap:break-word;hyphens:auto}
.ts004-native__strategies{padding-inline:.25rem}
.ts004-native__columns ul{padding-inline-start:.8rem}
.ts004-native__columns li{overflow-wrap:break-word;hyphens:auto}
}
`;

export function G4L3Ts004Scene({frame, reducedMotion = false, onOpenKeyTerm}: Ts004SceneProps) {
  const state = getTs004SceneState(frame, reducedMotion);
  const term = (label: string, nativeTarget: string, emphasized = false) => {
    const current = state.buttons.find(item => item.nativeTarget === nativeTarget);
    if (!current || !onOpenKeyTerm) return <span>{label}</span>;
    return <button type="button" className="ts004-native__term" data-source-button={current.buttonId}
      data-emphasis={emphasized}
      data-source-key={current.sourceKey} data-keyterm-lookup={current.lookup}
      onClick={event => onOpenKeyTerm(current, event.currentTarget)}>{label}</button>;
  };
  const withTerm = (copy: string, word: string, nativeTarget: string) => {
    const [before, after] = splitUnique(copy, word);
    return <>{before}{term(word, nativeTarget)}{after}</>;
  };
  const [beforeStrategies, afterStrategies] = splitUnique(source.texts['24'].text.trim(), 'Strategies');
  return <section className="ts004-native lesson-text-presentation" lang="en" data-modern-text-page="course-g04-l03-ts-004"
    data-source-frame={frame} data-source-frame-domain={DOMAIN}>
    <style>{styles}</style>
    <h2 className="lesson-text-presentation__block--title" data-lesson-text-block="title">{state.title}</h2>
    {state.activeStep ? <h3 className="ts004-native__active-step lesson-text-presentation__block--heading" data-lesson-text-block="active-step"
      data-source-characters="16,15" data-source-shape="14"
      style={{opacity: state.activeStepOpacity}}>{source.texts['16'].text} {term(stepRuns[0], 'active-step/solve', state.emphasis.Solve)}
      {stepRuns[1]}{term(stepRuns[2], 'active-step/problem', state.emphasis.problem)}{stepRuns[3]}</h3> : null}
    <ol className="ts004-native__plan" aria-label="Four-step plan" data-source-shape="4">
      {state.plan.map((copy, index) => <li key={index} data-step={index + 1}>
        <span className="ts004-native__number" data-lesson-text-block={`step-${index + 1}-number`}>
          {state.planNumbers[index]}
        </span>
        {copy ? <span data-lesson-text-block={`step-${index + 1}`}
          style={index === 2 ? {opacity: state.planStepThreeOpacity} : undefined}>{copy}</span> : null}
      </li>)}
    </ol>
    {state.strategiesHeading ? <section className="ts004-native__strategies" aria-label="Strategies to try">
      <h3 className="lesson-text-presentation__block--heading" data-lesson-text-block="strategies-heading" data-source-shape="25"
        style={{opacity: state.strategiesHeadingOpacity}}>
        {beforeStrategies}{term('Strategies', 'strategies-heading/strategies')}{afterStrategies}
      </h3>
      {state.left.some(item => item.opacity > 0) || state.right.some(item => item.opacity > 0) ?
        <div className="ts004-native__columns">
          <ul data-source-shape="29">{state.left.filter(item => item.opacity > 0).map(item => <li key={item.id}
            data-lesson-text-block={item.id} style={{opacity: item.opacity}}>
            {item.id === 'write-equation' ? withTerm(item.text, 'equation', 'left/write-equation/equation') :
              item.id === 'look-pattern' ? withTerm(item.text, 'pattern', 'left/look-pattern/pattern') : item.text}
          </li>)}</ul>
          <ul data-source-shape="61">{state.right.filter(item => item.opacity > 0).map(item => <li key={item.id}
            data-lesson-text-block={item.id} style={{opacity: item.opacity}}>
            {item.id === 'right-900' ? withTerm(item.text, 'table', 'right/make-table/table') :
              item.id === 'right-1420' ? withTerm(item.text, 'simpler', 'right/work-simpler-problem/simpler') : item.text}
          </li>)}</ul>
        </div> : null}
    </section> : null}
    {state.finalInstruction ? <p className="ts004-native__final" data-lesson-text-block="final-instruction" data-source-shape="69"
      style={{opacity: state.finalInstructionOpacity}}>{state.finalInstruction}</p> : null}
  </section>;
}
