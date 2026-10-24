'use client';

import React from 'react';
import source from './generated/g4-l3-ts002-text.json';

const TEXT = source.texts;
const DOMAIN = 'sprite-27';
const MAX_FRAME = 355;
type TextId = keyof typeof TEXT;
type GlossaryTerm = (typeof source.glossary)[number]['term'];

export interface Ts002SceneProps {
  readonly frame: number;
  readonly reducedMotion?: boolean;
  readonly onOpenKeyTerm?: (term: GlossaryTerm, trigger: HTMLButtonElement) => void;
}

function placement(frame: number, characterId: number) {
  return source.frames[frame - 1]?.placements.find(item => item.characterId === characterId);
}

function text(characterId: number) {
  const entry = TEXT[String(characterId) as TextId];
  if (!entry) throw new Error(`TS002 source text ${characterId} is missing`);
  return entry.text;
}

function splitOnce(copy: string, term: string) {
  const index = copy.indexOf(term);
  if (index < 0 || copy.indexOf(term, index + term.length) >= 0) {
    throw new Error(`TS002 source term ${term} is not unique in ${copy}`);
  }
  return [copy.slice(0, index), copy.slice(index + term.length)] as const;
}

const [headingPrefix, headingAfterRestate] = splitOnce(text(14), text(18));
const [headingMiddle, headingSuffix] = splitOnce(headingAfterRestate, text(19));
const firstBulletRuns = TEXT['21'].runs;
const [firstBulletPrefix, firstBulletLineEnd] = splitOnce(
  firstBulletRuns.slice(0, -1).map(run => run.text).join(''), text(24),
);
const firstBulletLastLine = firstBulletRuns.at(-1)?.text;
if (firstBulletRuns.length !== 4 || !firstBulletLastLine ||
    `${firstBulletPrefix}${text(24)}${firstBulletLineEnd} ${firstBulletLastLine}` !== text(21)) {
  throw new Error('TS002 source bullet line break changed');
}

/** Structural SWF placement and alpha, not an original-runtime visibility claim. */
export function getTs002SceneState(frame: number, reducedMotion = false) {
  if (!Number.isInteger(frame) || frame < 1 || frame > MAX_FRAME) {
    throw new Error('TS002 frame is outside the source sprite');
  }
  const visible = (id: number) => {
    const item = placement(frame, id);
    return Boolean(item && (reducedMotion || item.alpha > 0));
  };
  const opacity = (id: number) => reducedMotion ? 1 : placement(frame, id)?.alpha ?? 0;
  return {
    frame,
    frameDomain: DOMAIN,
    title: text(source.titleCharacterId),
    numbers: [text(10) + text(9), text(6), text(7), text(8)],
    stepCell: visible(11) ? text(11) : null,
    stepCellOpacity: opacity(11),
    heading: visible(14) ? text(14) : null,
    headingOpacity: opacity(14),
    firstBullet: visible(21) ? text(21) : null,
    firstBulletOpacity: opacity(21),
    secondBullet: visible(25) ? text(25) : null,
    secondBulletOpacity: opacity(25),
    emphasis: {
      restate: visible(18) && !reducedMotion,
      question: visible(19) && !reducedMotion,
      problem: visible(24) && !reducedMotion,
    },
  };
}

const styles = `
.ts002-native{box-sizing:border-box;inline-size:100%;max-inline-size:68rem;margin:auto;padding:1.25rem 1.75rem;font-family:var(--lesson-font-body,system-ui,sans-serif);color:#13243b;background:#f5f9ff;container-type:inline-size}
.ts002-native *{box-sizing:border-box}
.ts002-native h2{font-family:var(--lesson-font-display,system-ui,sans-serif);font-size:clamp(1.5rem,3.5cqi,2.5rem);line-height:1.2;margin:0 0 .25rem}
.ts002-native__plan{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.35rem;margin:0 0 .35rem;padding:0;list-style:none}
.ts002-native__cell{min-inline-size:0;min-block-size:4rem;padding:.4rem .85rem;border:2px solid #8fa9c8;border-radius:.7rem;background:#fff}
.ts002-native__cell[data-step='1']{border-color:#2363aa;background:#eaf3ff}
.ts002-native__number{font-size:clamp(1.5rem,3.5cqi,2.25rem);font-weight:800;line-height:1.2}
.ts002-native__cell p{font-size:clamp(1.125rem,2.4cqi,1.3rem);line-height:1.45;margin:.4rem 0 0;overflow-wrap:anywhere}
.ts002-native__explanation{padding:.55rem 1.1rem;border-radius:.7rem;background:#fff;box-shadow:0 2px 12px #112c4b17}
.ts002-native h3{font-size:clamp(1.3rem,3cqi,2rem);line-height:1.3;margin:0 0 .75rem}
.ts002-native ul{padding-inline-start:0;margin:.35rem 0 0;display:grid;gap:.35rem;list-style:none}
.ts002-native__explanation li{position:relative;padding-inline-start:1.45rem;font-size:clamp(1.125rem,2.5cqi,1.4rem);line-height:1.5;overflow-wrap:anywhere}
.ts002-native__explanation li::before{content:'';position:absolute;inset-inline-start:.1rem;inset-block-start:.55em;inline-size:.58rem;block-size:.58rem;border:1px solid #8a1111;border-radius:50%;background:#c20b0b}
.ts002-native__term{display:inline-flex;align-items:center;min-block-size:44px;vertical-align:middle;font:inherit;color:#1556a0;border:0;background:transparent;padding:0;cursor:pointer;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em}
.ts002-native__term:disabled{color:inherit;cursor:default}
.ts002-native__term:focus-visible{outline:3px solid #1556a0;outline-offset:3px;border-radius:.2rem}
.ts002-native__term[data-emphasis='true']{background:#ffeb81;border-radius:.2rem}
.ts002-native__term-punctuation{white-space:nowrap}
@container (max-width:31rem){.ts002-native{padding-inline:.8rem}.ts002-native__cell{padding:.4rem;min-block-size:4rem}.ts002-native__source-break{display:none}}
@container (max-width:18rem){.ts002-native__plan{grid-template-columns:1fr}}
@container (max-width:15rem){.ts002-native{padding-inline:clamp(6px,2vw,12px)}.ts002-native__explanation{padding-inline:clamp(6px,2vw,12px)}.ts002-native__explanation li{padding-inline-start:clamp(20px,7vw,28px)}}
`;

export function G4L3Ts002Scene({frame, reducedMotion = false, onOpenKeyTerm}: Ts002SceneProps) {
  const state = getTs002SceneState(frame, reducedMotion);
  const term = (name: GlossaryTerm, label: string, emphasized = false) => (
    <button type="button" className="ts002-native__term" disabled={!onOpenKeyTerm}
      data-source-button={source.glossary.find(entry => entry.term === name)?.buttonId}
      data-source-shape={name === 'problem' ? 20 : undefined}
      data-emphasis={emphasized} onClick={event => onOpenKeyTerm?.(name, event.currentTarget)}>{label}</button>
  );
  return <section className="ts002-native" lang="en" data-modern-text-page="course-g04-l03-ts-002"
    data-source-frame={frame} data-source-frame-domain={DOMAIN}>
    <style>{styles}</style>
    <h2>{state.title}</h2>
    <ol className="ts002-native__plan" aria-label="Four-step plan" data-source-shape="4">
      {state.numbers.map((number, index) => <li className="ts002-native__cell" data-step={index + 1} key={number}>
        <span className="ts002-native__number" aria-label={`Step ${index + 1}`}>{number}</span>
        {index === 0 && state.stepCell ? <p data-lesson-text-block="step-cell" style={{opacity: state.stepCellOpacity}}>{state.stepCell}</p> : null}
      </li>)}
    </ol>
    {state.heading ? <article className="ts002-native__explanation" aria-label="Step 1 explanation">
      <h3 data-lesson-text-block="step-heading" data-source-shape="13" style={{opacity: state.headingOpacity}}>
        {headingPrefix}{term('Restate', text(18), state.emphasis.restate)}{headingMiddle}<span className="ts002-native__term-punctuation">{term('question', text(19), state.emphasis.question)}{headingSuffix}</span>
      </h3>
      {state.firstBullet || state.secondBullet ? <ul>
        {state.firstBullet ? <li data-lesson-text-block="first-bullet" data-source-shape="22" style={{opacity: state.firstBulletOpacity}}>
          {firstBulletPrefix}{term('problem', text(24), state.emphasis.problem)}{firstBulletLineEnd}<br className="ts002-native__source-break"/> {firstBulletLastLine}
        </li> : null}
        {state.secondBullet ? <li data-lesson-text-block="second-bullet" data-source-shape="26" style={{opacity: state.secondBulletOpacity}}>{state.secondBullet}</li> : null}
      </ul> : null}
    </article> : null}
  </section>;
}
