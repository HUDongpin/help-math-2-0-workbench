import React from 'react';
import type {LessonTextBinding} from '../lesson-text-contract';
import source from './generated/g4-l3-ti005-introduction.json';

export const TI005_INTRODUCTION_DATA = source;
export const TI005_INTRODUCTION_BINDING = source.binding as LessonTextBinding;
/** No authored glossary hyperlink is reachable in the introduction. */
export const TI005_INTRODUCTION_KEY_TERMS = {...source.keyTerms, indexLanguage: 'en' as const};
export type Ti005OpenTerm = (entryId: string, trigger: HTMLButtonElement) => void;
export type Ti005IntroductionState = typeof source.frames[number];

/** One-indexed sprite208 frames; 209 is the question transition, not the last intro. */
export function getTi005Introduction(frame: number): Ti005IntroductionState {
  const finiteFrame = Number.isFinite(frame) ? Math.floor(frame) : 1;
  return source.frames[Math.max(1, Math.min(209, finiteFrame)) - 1]!;
}

const xPercent = (x: number) => `${(x + 5400) / 9400 * 100}%`;
const yPercent = (y: number) => `${y / 4600 * 100}%`;
const prose: React.CSSProperties = {margin: 0, fontSize: 'var(--ti005-prose-size,1.25rem)', lineHeight: 1.6};

export function Ti005Introduction({frame}: {frame: number; onKeyTerm?: Ti005OpenTerm}) {
  const s = getTi005Introduction(frame);
  const text = (key: keyof typeof source.fields) => <span data-lesson-text-block={key} data-source-text={source.fields[key]}>{s[key]}</span>;
  const cuePath = s.cue ? source.cuePaths[String(s.cue.characterId) as keyof typeof source.cuePaths] : '';
  return <section lang="en" data-ti005-native-intro={s.frame} style={{
    fontFamily: 'var(--lesson-font-body,"Nunito",system-ui,sans-serif)',
    color: '#172033', background: '#e9f7ff', borderRadius: 12, padding: '1rem',
    display: 'grid', gap: '1rem', minWidth: 0,
  }}>
    <p style={prose}>{text('number')}{s.number ? ' ' : ''}{text('instruction')}</p>
    {s.answerInstruction || s.answerEnding ? <p style={prose}>{text('answerInstruction')}{text('answerEnding')}</p> : null}
    {s.newProblemInstruction || s.newProblemEnding ? <p style={prose}>{text('newProblemInstruction')}{text('newProblemEnding')}</p> : null}
    {s.exampleVisible ? <div tabIndex={0} role="group"
      aria-label="Pattern demonstration with two missing numbers. Scroll horizontally to explore."
      style={{maxWidth: '100%', overflowX: 'auto'}}>
      <div data-ti005-intro-example="true" style={{position: 'relative', minWidth: '47rem', height: '23rem', fontSize: '1.25rem', lineHeight: 1.6}}>
        {s.pattern.map((label, i) => <span key={i} data-lesson-text-block={`pattern-${i}`} data-source-text={161+i} data-source-sign-depth={12+2*i}
          style={{position: 'absolute', left: xPercent([-4836,-3678,-2522,-1370][i]!), top: yPercent(330), whiteSpace: 'nowrap'}}>{label}</span>)}
        {source.audit.blankBoxes.map((box, i) => <span key={i} role="img" aria-label={`${i === 0 ? 'First' : 'Second'} missing number${i === 0 && s.questionMark ? ': question mark' : ''}`}
          data-ti005-intro-blank={i+1} data-source-shape="160" style={{
            position: 'absolute', left: xPercent(box.left), top: yPercent(box.top),
            width: `${box.width/9400*100}%`, height: `${box.height/4600*100}%`,
            boxSizing: 'border-box', border: '2px solid #172033', background: '#fff',
            display: 'grid', placeItems: 'center',
          }}><span data-lesson-text-block={i === 0 ? 'questionMark' : undefined} style={i === 0 ? {opacity: s.questionMarkAlpha} : undefined}>{i === 0 ? s.questionMark : ''}</span></span>)}
        <span data-lesson-text-block="pattern-separator" data-source-text="165" style={{position: 'absolute', left: xPercent(510), top: yPercent(330)}}>{source.texts['165']}</span>
        <span data-lesson-text-block="pattern-ending" data-source-text="166" style={{position: 'absolute', left: xPercent(1939), top: yPercent(330)}}>{source.texts['166']}</span>
        <span data-ti005-intro-check-state={s.checkState} data-lesson-text-block="checkLabel" style={{
          position: 'absolute', left: xPercent(-4902), top: yPercent(1679), width: `${2943/9400*100}%`,
          minHeight: '2.75rem', border: '2px solid #224b8e', borderRadius: 6, textAlign: 'center',
          background: s.checkState === 'pressed' ? '#c2c5cd' : s.checkState === 'hover' ? '#9ecffe' : '#d8efff',
          boxShadow: s.checkState === 'pressed' ? 'inset 0 2px 3px #697586' : undefined,
        }}>{s.checkLabel}</span>
        <span data-lesson-text-block="newProblemLabel" style={{
          position: 'absolute', left: xPercent(491), top: yPercent(1714), width: `${2980/9400*100}%`,
          minHeight: '2.75rem', border: '2px solid #224b8e', borderRadius: 6, textAlign: 'center', background: '#d8efff',
        }}>{s.newProblemLabel}</span>
        {s.cue && cuePath ? <svg aria-hidden="true" data-ti005-intro-cue={s.cue.characterId}
          viewBox="-5400 0 9400 4600" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
          <path d={cuePath} transform={`matrix(${s.cue.matrix.join(' ')})`} opacity={s.cue.alpha}
            fill={s.cue.characterId === 173 ? '#172033' : 'none'}
            stroke={s.cue.characterId === 181 ? '#009966' : s.cue.characterId === 173 ? '#fff' : '#172033'}
            strokeWidth={s.cue.characterId === 181 ? 60 : 20}/>
        </svg> : null}
      </div>
    </div> : null}
  </section>;
}
