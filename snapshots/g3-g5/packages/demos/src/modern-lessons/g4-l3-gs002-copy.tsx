import React from 'react';
import source from './generated/g4-l3-gs002-text.json';
import type {CourseG04L03Gs002InteractionState} from '../timelines/course-g04-l03-gs-002-interaction';

export const GS002_COPY = source;
export type Gs002OpenTerm = (entryId: string, trigger: HTMLButtonElement) => void;

/** Source-linked inline terms; caller owns host pause, dialog, and focus return. */
export function Gs002SourceText({text, onKeyTerm}: {text: string; onKeyTerm?: Gs002OpenTerm}) {
  return <>{text.split(/(positive sign|negative sign)/gi).map((part,index)=>{
    const term=part.toLowerCase()==='positive sign'?'Positive sign':
      part.toLowerCase()==='negative sign'?'Negative sign':null;
    return term && onKeyTerm ? <button key={index} type="button"
      data-gs002-keyterm={source.keyTerms[term]}
      onClick={event=>onKeyTerm(source.keyTerms[term],event.currentTarget)}
      style={{font:'inherit',lineHeight:'inherit',color:'#153d8a',textDecoration:'underline',
        border:0,padding:0,background:'transparent',maxWidth:'100%',overflowWrap:'anywhere',textAlign:'inherit'}}>{part}</button>
      : <React.Fragment key={index}>{part}</React.Fragment>;
  })}</>;
}

/** Popup prose only. The help diagram is a separate required component. */
export function Gs002Instructions({kind,onKeyTerm}:{kind:'instructions'|'help';onKeyTerm?:Gs002OpenTerm}) {
  return <div lang="en" data-gs002-native-copy={kind} style={{display:'grid',gap:'1rem',minWidth:0}}>
    {source[kind].map(block=><p key={block.characterId} data-source-text={block.sourceTextId} data-lesson-text-block={`${kind}-${block.characterId}`}
      style={{font:'inherit',lineHeight:1.6,margin:0,maxWidth:'70ch',overflowWrap:'anywhere'}}>
      <Gs002SourceText text={block.text} onKeyTerm={onKeyTerm}/>
    </p>)}
  </div>;
}

/** No local timer: values come from the single existing game reducer. */
export function Gs002GameStatus({state}:{state:Pick<CourseG04L03Gs002InteractionState,'timerDisplay'|'score'>}) {
  return <dl lang="en" data-gs002-native-status="true" style={{display:'flex',flexWrap:'wrap',gap:'1rem 2rem',margin:0}}>
    <div><dt data-lesson-text-block="time-label" data-source-text={source.labels.time.sourceTextId}>{source.labels.time.text}
      {' '}<span aria-label="hours, minutes, seconds">({source.labels.hours.text}:{source.labels.minutes.text}:{source.labels.seconds.text})</span></dt>
      <dd data-lesson-text-block="timer" data-source-text={`character-${source.dynamicFields.timer}`}
        style={{margin:0,fontVariantNumeric:'tabular-nums',fontSize:'1.25em',fontWeight:700}}>{state.timerDisplay}</dd></div>
    <div><dt data-lesson-text-block="score-label" data-source-text={source.labels.score.sourceTextId}>{source.labels.score.text}</dt>
      <dd data-lesson-text-block="game-score" data-source-text={`character-${source.dynamicFields.score}`} aria-live="polite"
        style={{margin:0,fontVariantNumeric:'tabular-nums',fontSize:'1.25em',fontWeight:700}}>{state.score}</dd></div>
  </dl>;
}

export function Gs002FeedbackText({text}:{text:string}) {
  const isSource=source.feedback.includes(text);
  return <p lang="en" data-source-text={isSource?'character-157':undefined}
    data-lesson-text-block={isSource?'source-feedback':undefined}
    data-gs002-copy-authority={isSource?'source-script':'modern-current-js'}
    style={{margin:0,font:'inherit',lineHeight:1.6,overflowWrap:'anywhere'}}>{text}</p>;
}

/** The opening score is an external legacy global, not the initialized game score. */
export function Gs002IntroStatus({frame}:{frame:number}) {
  if(!Number.isInteger(frame)||frame<source.introStatus.firstFrame||frame>source.introStatus.lastFrame)return null;
  return <dl lang="en" data-gs002-intro-status="true" style={{display:'flex',flexWrap:'wrap',gap:'1rem 2rem',margin:0,minWidth:0}}>
    <div><dt data-lesson-text-block="time-label" data-source-text={source.labels.time.sourceTextId}>{source.labels.time.text}
      {' '}<span aria-label="hours, minutes, seconds">({source.labels.hours.text}:{source.labels.minutes.text}:{source.labels.seconds.text})</span></dt>
      <dd data-lesson-text-block="timer" data-source-text="character-77" style={{margin:0,fontVariantNumeric:'tabular-nums',fontSize:'1.25em',fontWeight:700}}>
        {source.introStatus.timerInitialText}</dd></div>
    <div><dt data-lesson-text-block="score-label" data-source-text={source.labels.score.sourceTextId}>{source.labels.score.text}</dt>
      <dd data-gs002-copy-authority="modern-current-js" data-source-value-authority={source.introStatus.scoreAuthority}
        aria-label="Score not initialized" style={{margin:0,fontSize:'1.25em',fontWeight:700}}>—</dd></div>
  </dl>;
}
