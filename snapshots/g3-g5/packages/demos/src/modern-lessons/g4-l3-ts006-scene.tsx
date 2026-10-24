'use client';

import React from 'react';
import source from './generated/g4-l3-ts006-text.json';

const DOMAIN = 'sprite-23';
type TextId = keyof typeof source.texts;
const text = (id: number) => source.texts[String(id) as TextId].text;
const normalized = (copy: string) => copy.replace(/\s+/g, ' ').trim();
const labels = [15, 12, 13, 14].map(id => text(id));
const copy = [16, 18, 20, 22].map(id => normalized(text(id)));
const tableCopy = [6, 7, 8, 9].map(id => normalized(text(id)).replace(/\s+\./g, '.'));
if (source.frameDomain !== DOMAIN || source.frameCount !== 128 || text(11) !== '.' ||
    JSON.stringify(labels) !== JSON.stringify(['1', '2', '3', '4']) ||
    tableCopy.some((value, index) => value !== `${labels[index]}. ${copy[index]}`)) {
  throw new Error('TS006 shipped source four-step table changed');
}

/** All four steps are structurally present at sprite-23 frame 1–128. */
export function getTs006SceneState(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > source.frameCount) {
    throw new Error('TS006 frame is outside the source sprite');
  }
  return {frame, frameDomain: DOMAIN, title: text(2),
    steps: labels.map((number, index) => ({number: `${number}.`, copy: copy[index]}))};
}

const styles = `
.ts006-native{box-sizing:border-box;inline-size:100%;max-inline-size:68rem;margin:auto;padding:clamp(.75rem,2vw,1.5rem);background:#fffaf7;color:#17263d;font-family:var(--lesson-font-body,system-ui,sans-serif);container-type:inline-size}
.ts006-native *{box-sizing:border-box}
.ts006-native h2{margin:0 0 1.25rem;font-family:var(--lesson-font-display,system-ui,sans-serif);font-size:clamp(1.75rem,3.5cqi,2.25rem);line-height:1.25;overflow-wrap:anywhere}
.ts006-native__plan{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-template-areas:'one three' 'two four';gap:.75rem;list-style:none;margin:0;padding:0}
.ts006-native__plan li{display:flex;min-inline-size:0;min-block-size:6rem;gap:.5rem;align-items:flex-start;padding:clamp(.75rem,2cqi,1.25rem);border:2px solid #e4a078;border-radius:.75rem;background:#fff;font-size:clamp(1.125rem,2.5cqi,1.375rem);line-height:1.45;overflow-wrap:anywhere}
.ts006-native__plan li[data-step='1']{grid-area:one}
.ts006-native__plan li[data-step='2']{grid-area:two}
.ts006-native__plan li[data-step='3']{grid-area:three}
.ts006-native__plan li[data-step='4']{grid-area:four}
.ts006-native__number{flex:none;font-weight:800;white-space:nowrap}
@container (max-width:22rem){.ts006-native__plan{grid-template-columns:1fr;grid-template-areas:'one' 'two' 'three' 'four'}}
@container (max-width:16rem){.ts006-native__plan li{display:block;font-size:1rem}.ts006-native__number{margin-inline-end:.35rem}.ts006-native__plan li span:last-child{overflow-wrap:normal;word-break:normal}}
@media (max-width:400px){.ts006-native{padding-inline:.25rem}.ts006-native__plan li{padding-inline:.5rem}}
`;

export function G4L3Ts006Scene({frame}: {readonly frame: number}) {
  const state = getTs006SceneState(frame);
  return <section className="ts006-native" lang="en" data-modern-text-page="course-g04-l03-ts-006"
    data-source-frame={frame} data-source-frame-domain={DOMAIN}>
    <style>{styles}</style>
    <h2 data-lesson-text-block="title" data-source-companion="sprite-3">{state.title}</h2>
    <ol className="ts006-native__plan" aria-label="Four-step plan" data-source-shape="4">
      {state.steps.map((step, index) => <li key={step.number} data-step={index + 1}
        data-lesson-text-block={`step-${index + 1}`}>
        <span className="ts006-native__number">{step.number}</span><span>{step.copy}</span>
      </li>)}
    </ol>
  </section>;
}
