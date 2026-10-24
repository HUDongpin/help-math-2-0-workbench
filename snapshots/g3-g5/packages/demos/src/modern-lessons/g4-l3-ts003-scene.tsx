'use client';

import React from 'react';
import source from './generated/g4-l3-ts003-text.json';

const TEXT = source.texts;
const DOMAIN = 'sprite-25';
type TextId = keyof typeof TEXT;
type GlossaryTerm = 'Organize' | 'Information';

export interface Ts003SceneProps {
  readonly frame: number;
  readonly reducedMotion?: boolean;
  readonly onOpenKeyTerm?: (term: GlossaryTerm, trigger: HTMLButtonElement) => void;
}

function placement(frame: number, characterId: number) {
  return source.frames[frame - 1]?.placements.find(item => item.characterId === characterId);
}

function text(characterId: number) {
  const entry = TEXT[String(characterId) as TextId];
  if (!entry) throw new Error(`TS003 source text ${characterId} is missing`);
  return entry.text;
}

function splitOnce(copy: string, term: string) {
  const index = copy.indexOf(term);
  if (index < 0 || copy.indexOf(term, index + term.length) >= 0) {
    throw new Error(`TS003 source term ${term} is not unique in ${copy}`);
  }
  return [copy.slice(0, index), copy.slice(index + term.length)] as const;
}

const [headingPrefix, headingAfterOrganize] = splitOnce(text(15), text(19));
const [headingMiddle, headingSuffix] = splitOnce(headingAfterOrganize, text(20));
if (`${headingPrefix}${text(19)}${headingMiddle}${text(20)}${headingSuffix}` !== text(15)) {
  throw new Error('TS003 source heading composition changed');
}

/** Structural SWF placement and alpha, not an original-runtime visibility claim. */
export function getTs003SceneState(frame: number, reducedMotion = false) {
  if (!Number.isInteger(frame) || frame < 1 || frame > source.frameCount) {
    throw new Error('TS003 frame is outside the source sprite');
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
    numbers: [text(10) + text(6), text(7) + text(6), text(8) + text(6), text(9) + text(6)],
    stepOne: visible(11) ? text(11) : null,
    stepTwo: visible(13) ? text(13) : null,
    stepTwoOpacity: opacity(13),
    heading: visible(15) ? text(15) : null,
    headingOpacity: opacity(15),
    firstBullet: visible(21) ? text(21) : null,
    firstBulletOpacity: opacity(21),
    secondBullet: visible(23) ? text(23) : null,
    secondBulletOpacity: opacity(23),
    glossaryEnabled: {Organize: visible(17), Information: visible(18)},
    emphasis: {Organize: visible(19) && !reducedMotion, Information: visible(20) && !reducedMotion},
  };
}

const styles = `
.ts003-native{box-sizing:border-box;inline-size:100%;max-inline-size:68rem;margin:auto;padding-block:1.25rem;padding-inline:clamp(8px,2vw,1.75rem);font-family:var(--lesson-font-body,system-ui,sans-serif);color:#13243b;background:#f5f9ff;container-type:inline-size}
.ts003-native *{box-sizing:border-box}
.ts003-native h2{font-family:var(--lesson-font-display,system-ui,sans-serif);font-size:clamp(1.5rem,3.5cqi,2.5rem);line-height:1.2;margin:0 0 .25rem}
.ts003-native__plan{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.35rem;margin:0 0 .35rem;padding:0;list-style:none}
.ts003-native__cell{min-inline-size:0;min-block-size:4rem;padding:.4rem .85rem;border:2px solid #8fa9c8;border-radius:.7rem;background:#fff}
.ts003-native__cell[data-step='2']{border-color:#2363aa;background:#eaf3ff}
.ts003-native__number{font-size:clamp(1.5rem,3.5cqi,2.25rem);font-weight:800;line-height:1.2}
.ts003-native__cell p{font-size:clamp(1.125rem,2.4cqi,1.3rem);line-height:1.45;margin:.4rem 0 0;overflow-wrap:anywhere}
.ts003-native__explanation{padding:.55rem 1.1rem;border-radius:.7rem;background:#fff;box-shadow:0 2px 12px #112c4b17}
.ts003-native h3{font-size:clamp(1.3rem,3cqi,2rem);line-height:1.3;margin:0 0 .75rem}
.ts003-native ul{padding-inline-start:0;margin:.35rem 0 0;display:grid;gap:.35rem;list-style:none}
.ts003-native__explanation li{position:relative;padding-inline-start:1.45rem;font-size:clamp(1.125rem,2.5cqi,1.4rem);line-height:1.5;overflow-wrap:anywhere}
.ts003-native__explanation li::before{content:'';position:absolute;inset-inline-start:.1rem;inset-block-start:.55em;inline-size:.58rem;block-size:.58rem;border:1px solid #8a1111;border-radius:50%;background:#c20b0b}
.ts003-native__term{display:inline-flex;align-items:center;min-block-size:44px;vertical-align:middle;font:inherit;color:#1556a0;border:0;background:transparent;padding:0;cursor:pointer;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em}
.ts003-native__term:disabled{color:inherit;cursor:default}
.ts003-native__term:focus-visible{outline:3px solid #1556a0;outline-offset:3px;border-radius:.2rem}
.ts003-native__term[data-emphasis='true']{background:#ffeb81;border-radius:.2rem}
.ts003-native__term-punctuation{white-space:nowrap}
@container (max-width:31rem){.ts003-native__cell{padding:.4rem;min-block-size:4rem}}
@container (max-width:18rem){.ts003-native__plan{grid-template-columns:1fr}}
@container (max-width:15rem){.ts003-native__cell p{font-size:1rem}.ts003-native h3{font-size:1.15rem}.ts003-native__explanation{padding-inline:clamp(6px,2vw,12px)}.ts003-native__explanation li{font-size:1rem;padding-inline-start:clamp(28px,9cqi,36px)}}
`;

export function G4L3Ts003Scene({frame, reducedMotion = false, onOpenKeyTerm}: Ts003SceneProps) {
  const state = getTs003SceneState(frame, reducedMotion);
  const term = (name: GlossaryTerm, label: string, emphasized = false) => {
    const glossary = source.glossary.find(entry => entry.term === name);
    if (!glossary) throw new Error(`TS003 glossary term ${name} is missing`);
    return <button type="button" className="ts003-native__term"
      disabled={!onOpenKeyTerm || !state.glossaryEnabled[name]}
      data-source-button={glossary.buttonId} data-emphasis={emphasized}
      onClick={event => onOpenKeyTerm?.(name, event.currentTarget)}>{label}</button>;
  };
  return <section className="ts003-native" lang="en" data-modern-text-page="course-g04-l03-ts-003"
    data-source-frame={frame} data-source-frame-domain={DOMAIN}>
    <style>{styles}</style>
    <h2 data-lesson-text-block="title">{state.title}</h2>
    <ol className="ts003-native__plan" aria-label="Four-step plan" data-source-shape="4">
      {state.numbers.map((number, index) => <li className="ts003-native__cell" data-step={index + 1} key={number}>
        <span className="ts003-native__number" aria-label={`Step ${index + 1}`}>{number}</span>
        {index === 0 && state.stepOne ? <p data-lesson-text-block="step-one">{state.stepOne}</p> : null}
        {index === 1 && state.stepTwo ? <p data-lesson-text-block="step-two" style={{opacity: state.stepTwoOpacity}}>{state.stepTwo}</p> : null}
      </li>)}
    </ol>
    {state.heading ? <article className="ts003-native__explanation" aria-label="Step 2 explanation">
      <h3 data-lesson-text-block="step-heading" data-source-shape="14" style={{opacity: state.headingOpacity}}>
        {headingPrefix}{term('Organize', text(19), state.emphasis.Organize)}{headingMiddle}
        <span className="ts003-native__term-punctuation">{term('Information', text(20), state.emphasis.Information)}{headingSuffix}</span>
      </h3>
      {state.firstBullet || state.secondBullet ? <ul>
        {state.firstBullet ? <li data-lesson-text-block="first-bullet" data-source-shape="22"
          style={{opacity: state.firstBulletOpacity}}>{state.firstBullet}</li> : null}
        {state.secondBullet ? <li data-lesson-text-block="second-bullet" data-source-shape="24"
          style={{opacity: state.secondBulletOpacity}}>{state.secondBullet}</li> : null}
      </ul> : null}
    </article> : null}
  </section>;
}
