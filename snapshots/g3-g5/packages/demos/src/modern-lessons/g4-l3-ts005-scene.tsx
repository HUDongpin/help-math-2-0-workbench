'use client';

import React from 'react';
import source from './generated/g4-l3-ts005-text.json';
import glossaryTargets from '../../../../scripts/inputs/typography-v1/g4-l3-ts005/glossary-target-disposition.json';

const DOMAIN = 'sprite-40';

function strategyLines(id: '25' | '27') {
  const lines = new Map<number, string>();
  for (const run of source.texts[id].runs) {
    if (run.y === null) throw new Error(`TS005 strategy ${id} has no source y`);
    lines.set(run.y, `${lines.get(run.y) ?? ''}${run.text}`);
  }
  return [...lines].sort((a, b) => a[0] - b[0])
    .map(([, copy]) => copy.trim().replace(/\s+/g, ' ')).filter(Boolean);
}

const rightLines = strategyLines('25');
const leftLines = strategyLines('27');
const left = [leftLines.slice(0, 2).join(' '), leftLines[2], leftLines[3],
  leftLines.slice(4).join(' ')];
const right = [rightLines[0], rightLines[1], rightLines.slice(2, 4).join(' '),
  rightLines[4]];
if (JSON.stringify(left) !== JSON.stringify([
  'write an equation and solve it', 'draw a picture',
  'look for a pattern', 'systematically guess and check',
]) || JSON.stringify(right) !== JSON.stringify([
  'act it out', 'make a table', 'work a simpler problem', 'work backwards',
])) throw new Error('TS005 source strategy reading order changed');
if (source.texts['33'].text !== source.texts['35'].text) {
  throw new Error('TS005 Show your work overlay is not duplicate text');
}
for (const target of glossaryTargets.buttons) {
  const sourceButton = source.glossary.find(item => item.buttonId === target.buttonId);
  const text = source.texts[String(target.textCharacterId) as keyof typeof source.texts];
  if (!sourceButton || sourceButton.sourceKey !== target.sourceKey ||
      !sourceButton.entryId || text.runs[target.textRunIndex]?.text.trim() !== target.word) {
    throw new Error(`TS005 glossary target ${target.buttonId} is not source-backed`);
  }
}

function splitUnique(copy: string, word: string) {
  const index = copy.indexOf(word);
  if (index < 0 || copy.indexOf(word, index + word.length) >= 0) {
    throw new Error(`TS005 source word ${word} is not unique in ${copy}`);
  }
  return [copy.slice(0, index), copy.slice(index + word.length)] as const;
}

/** Source structural frames only; not observed original-runtime playback. */
export function getTs005SceneState(frame: number, reducedMotion = false) {
  if (!Number.isInteger(frame) || frame < 1 || frame > source.frameCount) {
    throw new Error('TS005 frame is outside the source sprite');
  }
  const placements = source.frames[frame - 1].placements;
  const opacity = (id: number) => {
    const matching = placements.filter(item => item.characterId === id);
    if (!matching.length) return 0;
    return reducedMotion ? 1 : Math.max(...matching.map(item => item.alpha));
  };
  const activeStepOpacity = Math.min(opacity(16), opacity(18));
  const buttons = glossaryTargets.buttons.flatMap(target => {
    if (!placements.some(item => item.characterId === target.buttonId && item.alpha > 0)) return [];
    const term = source.glossary.find(item => item.buttonId === target.buttonId);
    if (!term?.entryId) throw new Error(`TS005 glossary ${target.buttonId} has no entry`);
    return [{buttonId: target.buttonId, sourceKey: term.sourceKey,
      entryId: term.entryId, nativeTarget: target.nativeTarget}];
  });
  return {
    frame, frameDomain: DOMAIN, title: source.texts['2'].text,
    numbers: [10, 7, 8, 9].map(id =>
      source.texts[String(id) as keyof typeof source.texts].text + source.texts['6'].text),
    plan: [source.texts['11'].text, source.texts['13'].text, source.texts['15'].text,
      opacity(16) > 0 ? source.texts['16'].text : null],
    activeStep: activeStepOpacity > 0 ? source.texts['18'].text.replace(/\s+/g, ' ').trim() : null,
    activeStepOpacity,
    strategiesHeading: opacity(20) > 0 ? source.texts['20'].text.trim() : null,
    strategiesHeadingOpacity: opacity(20),
    buttons,
    left: left.map((text, index) => ({id: `left-${index + 1}`, text, opacity: opacity(27)})),
    right: right.map((text, index) => ({id: `right-${index + 1}`, text, opacity: opacity(25)})),
    showWork: opacity(33) > 0 ? source.texts['33'].text.trim() : null,
    showWorkOpacity: opacity(33),
    showWorkEmphasis: !reducedMotion && opacity(35) > 0,
  };
}

const styles = `
.ts005-native{box-sizing:border-box;inline-size:100%;max-inline-size:68rem;margin:auto;padding:clamp(.75rem,2vw,1.5rem);font-family:var(--lesson-font-body,system-ui,sans-serif);color:#13243b;background:#f5f9ff;container-type:inline-size}
.ts005-native *{box-sizing:border-box}
.ts005-native h2{font-family:var(--lesson-font-display,system-ui,sans-serif);font-size:clamp(1.75rem,3.5cqi,2.25rem);line-height:1.25;margin:0 0 1rem}
.ts005-native h3{font-size:clamp(1.375rem,3cqi,1.625rem);line-height:1.3;margin:0 0 .75rem}
.ts005-native__active-step{padding:.45rem .75rem;border-inline-start:4px solid #2363aa;background:#eaf3ff}
.ts005-native__active-step::before{content:'';display:inline-block;inline-size:.6rem;block-size:.6rem;margin-inline-end:.6rem;border-radius:50%;background:#13243b;vertical-align:middle}
.ts005-native__plan{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;list-style:none;padding:0;margin:0 0 1.25rem}
.ts005-native__plan li{min-inline-size:0;min-block-size:5rem;padding:.7rem .85rem;display:flex;gap:.5rem;background:#fff;border:2px solid #8fa9c8;border-radius:.7rem;font-size:clamp(1.125rem,2.5cqi,1.3rem);line-height:1.5;overflow-wrap:anywhere}
.ts005-native__plan li[data-step='4']{border-color:#2363aa;background:#eaf3ff}
.ts005-native__number{font-weight:800;white-space:nowrap}
.ts005-native__strategies{padding:1rem;background:#fff;border-radius:.7rem;box-shadow:0 2px 12px #112c4b17}
.ts005-native__strategies h3::before{content:'';display:inline-block;inline-size:.6rem;block-size:.6rem;margin-inline-end:.6rem;border-radius:50%;background:#bd271b;vertical-align:middle}
.ts005-native__columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}
.ts005-native__columns ul{min-inline-size:0;margin:0;padding-inline-start:1.5rem;list-style:disc}
.ts005-native__columns li{padding-inline-start:.15rem;font-size:clamp(1.125rem,2.5cqi,1.3rem);line-height:1.55;overflow-wrap:anywhere}
.ts005-native__term{display:inline-flex;align-items:center;min-block-size:44px;padding:0;border:0;background:transparent;color:#1556a0;font:inherit;vertical-align:middle;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em;cursor:pointer}
.ts005-native__term:focus-visible{outline:3px solid #1556a0;outline-offset:3px;border-radius:.2rem}
.ts005-native__show{margin:1rem 0 0;padding:.5rem .75rem;background:#fff;border-inline-start:4px solid #2363aa;font-size:clamp(1.125rem,2.5cqi,1.3rem);line-height:1.5}
.ts005-native__show::before{content:'';display:inline-block;inline-size:.6rem;block-size:.6rem;margin-inline-end:.6rem;border-radius:50%;background:#bd271b;vertical-align:middle}
.ts005-native__show[data-emphasis='true']{background:#ffeb81}
@container (max-width:34rem){.ts005-native__columns{grid-template-columns:1fr}}
@container (max-width:22rem){.ts005-native__plan{grid-template-columns:1fr}}
@media (max-width:400px){.ts005-native{padding-inline:.25rem}.ts005-native h2,.ts005-native h3{overflow-wrap:anywhere}.ts005-native__strategies{padding-inline:.25rem}.ts005-native__plan li{padding-inline:.3rem;overflow-wrap:break-word}.ts005-native__columns ul{padding-inline-start:.8rem}.ts005-native__columns li{overflow-wrap:break-word;hyphens:auto}}
`;

export interface Ts005SceneProps {
  readonly frame: number;
  readonly reducedMotion?: boolean;
  readonly onOpenKeyTerm?: (term: {buttonId: number; sourceKey: string; entryId: string},
    trigger: HTMLButtonElement) => void;
}

export function G4L3Ts005Scene({frame, reducedMotion = false, onOpenKeyTerm}: Ts005SceneProps) {
  const state = getTs005SceneState(frame, reducedMotion);
  const term = (label: string, nativeTarget: string) => {
    const current = state.buttons.find(item => item.nativeTarget === nativeTarget);
    if (!current || !onOpenKeyTerm) return <span>{label}</span>;
    return <button type="button" className="ts005-native__term" data-source-button={current.buttonId}
      onClick={event => onOpenKeyTerm(current, event.currentTarget)}>{label}</button>;
  };
  const withTerm = (copy: string, word: string, nativeTarget: string) => {
    const [before, after] = splitUnique(copy, word);
    return <>{before}{term(word, nativeTarget)}{after}</>;
  };
  const [beforeStrategies, afterStrategies] = state.strategiesHeading
    ? splitUnique(state.strategiesHeading, 'Strategies') : ['', ''];
  return <section className="ts005-native" lang="en" data-modern-text-page="course-g04-l03-ts-005"
    data-source-frame={frame} data-source-frame-domain={DOMAIN}>
    <style>{styles}</style>
    <h2 data-lesson-text-block="title">{state.title}</h2>
    {state.activeStep ? <h3 className="ts005-native__active-step" data-source-shape="17"
      data-lesson-text-block="active-step" data-source-characters="16,18"
      style={{opacity: state.activeStepOpacity}}>{state.activeStep}</h3> : null}
    <ol className="ts005-native__plan" aria-label="Four-step plan" data-source-shape="4">
      {state.plan.map((copy, index) => <li key={index} data-step={index + 1}>
        <span className="ts005-native__number" data-lesson-text-block={`step-${index + 1}-number`}>
          {state.numbers[index]}
        </span>
        {copy ? <span data-lesson-text-block={`step-${index + 1}`}>{copy}</span> : null}
      </li>)}
    </ol>
    {state.strategiesHeading ? <section className="ts005-native__strategies" aria-label="Strategies to try">
      <h3 data-lesson-text-block="strategies-heading" data-source-shape="19,21"
        style={{opacity: state.strategiesHeadingOpacity}}>
        {beforeStrategies}{term('Strategies', 'strategies-heading/strategies')}{afterStrategies}
      </h3>
      {state.left[0].opacity > 0 || state.right[0].opacity > 0 ? <div className="ts005-native__columns">
        <ul data-source-shape="26">{state.left.filter(item => item.opacity > 0).map(item => <li key={item.id}
          data-lesson-text-block={item.id} style={{opacity: item.opacity}}>
          {item.id === 'left-1' ? withTerm(item.text, 'equation', 'left/write-equation/equation') :
            item.id === 'left-3' ? withTerm(item.text, 'pattern', 'left/look-pattern/pattern') : item.text}
        </li>)}</ul>
        <ul data-source-shape="24">{state.right.filter(item => item.opacity > 0).map(item => <li key={item.id}
          data-lesson-text-block={item.id} style={{opacity: item.opacity}}>
          {item.id === 'right-2' ? withTerm(item.text, 'table', 'right/make-table/table') :
            item.id === 'right-3' ? withTerm(item.text, 'simpler', 'right/work-simpler-problem/simpler') : item.text}
        </li>)}</ul>
      </div> : null}
    </section> : null}
    {state.showWork ? <p className="ts005-native__show" data-lesson-text-block="show-work" data-source-shape="32"
      data-source-overlay-shape={state.showWorkEmphasis ? '34' : undefined}
      data-emphasis={state.showWorkEmphasis} style={{opacity: state.showWorkOpacity}}>
      {withTerm(state.showWork, 'Show', 'show-work/show')}</p> : null}
  </section>;
}
