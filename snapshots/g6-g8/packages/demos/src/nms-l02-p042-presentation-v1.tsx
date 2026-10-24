'use client';
import * as React from 'react';
import { P042_TEACHING } from './generated/nms-l02-p042-teaching-v1';
import { P042_CUES } from './generated/nms-l02-p042-cues-v1';
import { p042EquivalentForms, type P042Handle, type P042Percentages } from './nms-l02-p042-practice-v1';
import './nms-l02-p042-presentation-v1.css';

const colors = ['#0066ff', '#00ffff', '#00d52c', '#ed47ed'] as const;
import { P042_LABELS } from './nms-l02-p042-copy-v1';

export interface P042PresentationProps {
  frame: number;
  percentages: P042Percentages;
  language?: 'en' | 'es';
  interactive?: boolean;
  onAdjust: (handle: P042Handle, percentage: number) => void;
}

/** Controlled surface: the owning player supplies the source clock, audio and Replay. */
export function P042Presentation({ frame, percentages, language = 'en', interactive = true, onAdjust }: P042PresentationProps) {
  const current = Math.max(1, Math.min(625, Math.floor(Number.isFinite(frame) ? frame : 1)));
  const practice = current === 625;
  const blank = current >= 498 && !practice;
  const beat = P042_TEACHING.beats.find(item => current >= item.firstFrame && current <= item.lastFrame);
  const values: P042Percentages = practice ? percentages : blank ? [25, 25, 25, 25] : beat?.percentages ?? [25, 25, 25, 25];
  const copy = P042_LABELS[language];
  const cue = P042_CUES.beats.find(item => current >= item.firstFrame && current <= item.lastFrame)?.cue;
  let cursor = 0;
  const wedges = [3, 2, 1, 0].map(index => {
    const value = values[index];
    const start = cursor; cursor += value;
    return `${colors[index]} ${start}% ${cursor}%`;
  }).join(', ');
  const summary = values.map((value, index) => `${copy.names[index]} ${value}%`).join(', ');
  return <section className="p042-presentation" lang={language} data-p042-frame={current} data-p042-phase={practice ? 'practice' : blank ? 'preparation' : 'demonstration'}>
    <p lang="en" data-lesson-text-block="course-title">Fractions, Decimals, and Percents Concepts: Instruction</p>
    <h2 data-lesson-text-block="activity-title">{copy.title}</h2>
    <p data-lesson-text-block="instruction">{practice ? copy.instruction : blank ? copy.preparation : copy.demonstration}</p>
    <figure className="p042-presentation__chart" data-emphasis={cue?.chart || undefined}>
      <div className="p042-presentation__pie" role="img" aria-label={`${copy.chart}: ${summary}`} style={{ background: `conic-gradient(from 90deg, ${wedges})` }} />
      <figcaption data-lesson-text-block="chart-caption">{copy.chart}</figcaption>
    </figure>
    <div className="p042-presentation__rows" role="list" aria-label={copy.chart}>
      {values.map((value, index) => {
        const forms = p042EquivalentForms(value);
        const enabled = practice && interactive && index < 3;
        return <div role="listitem" className="p042-presentation__row" key={index} data-color-index={index}>
          <h3 data-lesson-text-block={`color-${index}`}><span className="p042-presentation__swatch" style={{ backgroundColor: colors[index] }} aria-hidden="true" />{copy.names[index]}</h3>
          {index < 3 ? <label className="p042-presentation__control" data-emphasis={cue?.focus?.row === index && cue.focus.field === 'slider' || undefined}><span data-lesson-text-block={`control-${index}`}>{copy.adjust} {copy.names[index]}</span><input type="range" min={0} max={values[index] + values[index + 1]} step={1} value={value} disabled={!enabled} aria-valuetext={`${value}%`} onChange={event => onAdjust(index as P042Handle, Number(event.currentTarget.value))} /></label> : <p className="p042-presentation__linked" data-lesson-text-block={`control-${index}`}>{copy.linked}</p>}
          <dl>
            <div data-emphasis={cue?.heading === 'percent' || cue?.focus?.row === index && cue.focus.field === 'percent' || undefined}><dt data-lesson-text-block={`percent-heading-${index}`}>{copy.percent}</dt><dd data-lesson-text-block={`percent-value-${index}`}>{blank ? '—' : forms.percent}</dd></div>
            <div data-emphasis={cue?.heading === 'fraction' || cue?.focus?.row === index && cue.focus.field === 'fraction' || undefined}><dt data-lesson-text-block={`fraction-heading-${index}`}>{copy.fraction}</dt><dd data-lesson-text-block={`fraction-value-${index}`}>{blank ? '—' : `${forms.numerator}/${forms.denominator}`}</dd></div>
            <div data-emphasis={cue?.heading === 'decimal' || cue?.focus?.row === index && cue.focus.field === 'decimal' || undefined}><dt data-lesson-text-block={`decimal-heading-${index}`}>{copy.decimal}</dt><dd data-lesson-text-block={`decimal-value-${index}`}>{blank ? '—' : forms.decimal}</dd></div>
          </dl>
        </div>;
      })}
    </div>
    <p className="p042-presentation__total" data-lesson-text-block="total" data-emphasis={cue?.total || undefined}>{copy.total}: {blank ? '—' : '100% = 1 = 1.0'}</p>
  </section>;
}
