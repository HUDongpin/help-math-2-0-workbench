import React from 'react';
import type {LessonTextBinding} from '../lesson-text-contract';
import source from './generated/g4-l3-ti006-introduction.json';
import {Ti006SourceText} from './g4-l3-ti006-help';
import type {Ti006OpenTerm} from './g4-l3-ti006-help';
export {TI006_KEY_TERMS as TI006_INTRODUCTION_KEY_TERMS} from './g4-l3-ti006-help';
export type {Ti006OpenTerm} from './g4-l3-ti006-help';

export const TI006_INTRODUCTION_DATA = source;
export const TI006_INTRODUCTION_BINDING = source.binding as LessonTextBinding;
export const TI006_MAIN_AXIS = source.axis;
export const TI006_PLAIN_PROSE = source.plainProse;
export type Ti006IntroductionState = typeof source.frames[number];

/** One-indexed sprite269 intro; 166 hands the diagram to the parent interaction. */
export function getTi006Introduction(frame: number): Ti006IntroductionState {
  const finiteFrame = Number.isFinite(frame) ? Math.floor(frame) : 1;
  return source.frames[Math.max(1, Math.min(166, finiteFrame)) - 1]!;
}

/** Percent within the source axis extent, with room for both arrowheads. */
export const ti006AxisPercent = (tickXTwips: number) => (tickXTwips + 6688) / (6244 + 6688) * 100;

/** Reusable static main axis, distinct from the help diagram's −10..+10 range.
 * This component owns its horizontal viewport; interaction can reuse DATA.axis
 * and ti006AxisPercent when targets need to share the same scrolling surface.
 */
export function Ti006MainAxis({alpha = 1}: {alpha?: number}) {
  if (alpha <= 0) return null;
  return <div role="group" tabIndex={0} aria-label="Number line from negative eight to positive eight. Scroll horizontally to explore."
    data-ti006-main-axis="true" style={{maxWidth: '100%', overflowX: 'auto', opacity: alpha}}>
    <div style={{position: 'relative', minWidth: '56rem', height: '5rem', fontSize: '1.25rem', lineHeight: 1.6}}>
      <span aria-hidden="true" style={{position: 'absolute', left: '1%', right: '1%', top: '1.5rem', borderTop: '2px solid currentColor'}}/>
      <span aria-hidden="true" style={{position: 'absolute', left: 0, top: '.5rem'}}>←</span>
      <span aria-hidden="true" style={{position: 'absolute', right: 0, top: '.5rem'}}>→</span>
      {source.axis.map(a => <span key={a.value} data-ti006-axis-value={a.value} data-source-text={a.characterId}
        data-source-sign={a.introSignShapeId ?? undefined} data-lesson-text-block={`axis-${a.value}`}
        style={{position: 'absolute', left: `${ti006AxisPercent(a.tickXTwips)}%`, top: '.75rem', transform: 'translateX(-50%)', textAlign: 'center'}}>
        <span aria-hidden="true" style={{display: 'block', height: '1.5rem', width: 0, margin: '0 auto', borderLeft: '2px solid currentColor'}}/>
        <span style={{whiteSpace: 'nowrap'}}>{a.label}</span>
      </span>)}
    </div>
  </div>;
}

/** Silent source-frame presentation; parent helper owns resolved glossary links. */
export function Ti006Introduction({frame, questionPhase, onKeyTerm}: {
  frame: number;
  questionPhase?: boolean;
  onKeyTerm?: Ti006OpenTerm;
}) {
  const s = getTi006Introduction(frame);
  const handoff = questionPhase ?? s.questionPhase;
  return <section lang="en" data-ti006-native-intro={s.frame} style={{
    fontFamily: 'var(--lesson-font-body,"Nunito Sans",system-ui,sans-serif)',
    color: '#172033', background: '#e9f7ff', borderRadius: 12, padding: '1rem',
    display: 'grid', gap: '1rem', minWidth: 0,
  }}>
    <p style={{margin: 0, fontSize: 'var(--ti006-prose-size,1.25rem)', lineHeight: 1.6, overflowWrap: 'break-word'}}>
      {(Object.keys(source.fields) as Array<keyof typeof source.fields>).map(key => <React.Fragment key={key}>
        <span data-lesson-text-block={key} data-source-text={source.fields[key]} style={{opacity: s.prose[key].alpha}}><Ti006SourceText text={s[key]} onKeyTerm={onKeyTerm}/></span>
        {key === 'number' && s.number ? ' ' : null}
      </React.Fragment>)}
    </p>
    {!handoff && s.axisVisible ? <Ti006MainAxis alpha={s.axisAlpha}/> : null}
    {!handoff && s.cards.some(card => card.text && card.alpha > 0) ? <div data-ti006-intro-cards="true"
      style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,8rem),1fr))', gap: '.75rem'}}>
      {s.cards.map((card, i) => card.text && card.alpha > 0 ? <div key={card.characterId}
        data-source-text={card.characterId} data-lesson-text-block={`card-${i+1}`}
        style={{border: '2px solid #224b8e', borderRadius: 6, background: '#fff', padding: '.5rem',
          textAlign: 'center', fontSize: '1.25rem', lineHeight: 1.6, opacity: card.alpha}}>
        {card.lines.map((line, j) => <div key={j}>{line}</div>)}
      </div> : null)}
    </div> : null}
  </section>;
}
