import React from 'react';
import {P014_TEXT_STATE_SOURCE, p014TextState,
  type P014GlossaryKey, type P014Option}
  from './generated/alg-l06-p014-text-state-v1';

export interface P014NativeQuizSnapshotV1 {
  phase: 'before-quiz' | 'awaiting-answer' | 'feedback' | 'post-quiz' | 'closed';
  answersEnabled: boolean;
  feedbackKind: 'right' | 'wrong' | null;
  feedbackDomain: number | null;
  feedbackText: string | null;
  feedbackFrame?: number | null;
  feedbackHoldFrame?: number | null;
  feedbackAwaitingAcknowledgment?: boolean;
  feedbackAckButtonCharacterId?: number | null;
}

export interface P014NativeTextV1Props {
  frame: number;
  language?: 'en' | 'es';
  quizState?: P014NativeQuizSnapshotV1;
  onGlossary?: (key: P014GlossaryKey, trigger: HTMLButtonElement) => void;
  onAnswer?: (option: P014Option, trigger: HTMLButtonElement) => void;
  onAcknowledge?: (trigger: HTMLButtonElement) => void;
}

/** Semantic reading companion; all source artwork and glyphs remain in the Canvas. */
export function P014NativeTextV1({frame, language = 'en', quizState,
  onGlossary, onAnswer, onAcknowledge}: P014NativeTextV1Props) {
  const state=p014TextState(frame);
  const answerReady=frame===120&&quizState?.phase==='awaiting-answer'&&
    quizState.answersEnabled===true;
  const feedbackBranch=quizState?.phase==='feedback'&&quizState.feedbackDomain!==null
    ? state.feedback.domains.find(domain=>domain.domain===quizState.feedbackDomain&&
      domain.kind===quizState.feedbackKind) : undefined;
  const feedbackFrame=quizState?.feedbackFrame;
  const feedback=feedbackBranch&&typeof feedbackFrame==='number'&&
    Number.isInteger(feedbackFrame)&&feedbackFrame>=feedbackBranch.titleSemanticFrame&&
    feedbackFrame<=feedbackBranch.frameCount?feedbackBranch:undefined;
  const dynamicFeedback=feedback?.kind==='wrong'&&
    typeof feedbackFrame==='number'&&
    typeof feedback.dynamicSemanticFrame==='number'&&
    feedbackFrame>=feedback.dynamicSemanticFrame&&quizState?.feedbackText&&
    state.feedback.wrongStrings.includes(quizState.feedbackText)
    ? quizState.feedbackText : null;
  const acknowledgment=feedback?.kind==='wrong'
    ? state.feedback.acknowledgments.find(item=>item.domain===feedback.domain&&
      item.buttonId===quizState?.feedbackAckButtonCharacterId&&
      item.holdFrame===quizState?.feedbackHoldFrame&&
      item.fullAlphaFrame===quizState?.feedbackFrame&&
      quizState?.feedbackAwaitingAcknowledgment===true) : undefined;
  const controlStyle:React.CSSProperties={border:'1px solid currentColor',
    borderRadius:'0.4em',background:'#edf6fc',color:'inherit',font:'inherit',
    padding:'0.45em 0.8em',cursor:'pointer'};
  const glossaryReady=quizState?.phase!=='feedback'&&quizState?.phase!=='closed';
  return <section lang="en" aria-label="Lesson text" data-p014-native-text="true"
    data-p014-text-frame={frame} data-p014-frame-domain={state.frameDomain}
    data-p014-source-sha256={P014_TEXT_STATE_SOURCE.sourceSwfSha256}
    data-p014-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p014-canvas-suppression="none"
    style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',
      lineHeight:1.5,color:'#15344c',minWidth:0,padding:'1rem',background:'#fff',
      borderRadius:'0.75rem',overflowWrap:'anywhere'}}>
    {state.prompt.visible&&<p data-p014-prompt="true"
      data-source-text-id={`character-${state.prompt.sourceTextId}`}
      style={{margin:'0 0 0.75em'}}>{state.prompt.text}</p>}
    {state.formula.visible&&<p data-p014-formula="fahrenheit"
      data-p014-formula-stage={state.formula.stage}
      data-source-text-ids={state.formula.sourceTextIds.map(id=>`character-${id}`).join(' ')}
      style={{fontVariantNumeric:'tabular-nums',fontSize:'1.15em',margin:'0 0 0.75em'}}>
      {state.formula.text}{state.result.visible&&<span data-p014-result="true"
        data-source-text-id={`character-${state.result.sourceTextId}`}>
        {' '}{state.result.text}</span>}</p>}
    {state.options.some(option=>option.visible)&&<div role="group"
      aria-label="Answer choices" data-p014-options="true"
      style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 8.5em), 1fr))',
        gap:'0.5em',marginBottom:'0.8em'}}>
      {state.options.filter(option=>option.visible).map(option=>
        answerReady?<button key={option.letter} type="button"
          data-p014-option={option.letter}
          data-source-instance={option.sourceInstance}
          data-source-button-id={option.buttonId}
          data-source-action-sha256={option.sourceActionSha256}
          disabled={!onAnswer}
          onClick={event=>onAnswer?.(option.letter,event.currentTarget)}
          style={controlStyle}>{option.label}. {option.value}</button>
        :<span key={option.letter} data-p014-option={option.letter}
          data-source-instance={option.sourceInstance}
          style={{padding:'0.35em 0.65em',border:'1px solid #a8bbca',
            borderRadius:'0.4em'}}>{option.label}. {option.value}</span>)}</div>}
    {state.diagram.some(label=>label.visible)&&<p data-p014-diagram-labels="true"
      style={{margin:'0 0 0.7em'}}>
      {state.diagram.filter(label=>label.characterId!==210&&label.visible).map(label=>
        <span key={label.characterId}
          data-source-text-id={`character-${label.characterId}`}
          style={{marginRight:'0.8em'}}>{label.text}{' '}
          {label.characterId===208&&state.diagramValues.input.visible&&<span
            data-p014-input-value="true"
            data-source-text-id={`character-${state.diagramValues.input.sourceTextId}`}>
            {state.diagramValues.input.text}</span>}
          {label.characterId===209&&<span data-p014-output-value="true"
            data-source-text-ids={state.diagramValues.output.visible
              ?state.diagramValues.output.sourceTextIds.map(id=>`character-${id}`).join(' ')
              :'character-210'}>
            {state.diagramValues.output.visible
              ?state.diagramValues.output.text
              :state.diagram.find(item=>item.characterId===210)?.text}</span>}
        </span>)}
    </p>}
    {state.glossary.some(control=>control.available)&&<div role="group"
      aria-label="Vocabulary" data-p014-glossary="true"
      style={{display:'flex',flexWrap:'wrap',gap:'0.5em',marginBottom:'0.8em'}}>
      {state.glossary.filter(control=>control.available).map(control=><button
        key={control.key} type="button" data-p014-glossary-key={control.key}
        data-source-button-id={control.buttonId}
        data-source-action-sha256={control.sourceActionSha256}
        data-source-button-visual-state={control.visualState}
        disabled={!onGlossary||!glossaryReady}
        onClick={event=>onGlossary?.(control.key,event.currentTarget)}
        style={controlStyle} aria-label={`Open ${control.key} glossary`}>
        {control.key} glossary</button>)}</div>}
    {feedback&&<div role="status" aria-live="polite"
      data-p014-feedback-domain={feedback.domain}
      data-p014-feedback-kind={feedback.kind}
      data-source-text-id={`character-${feedback.textId}`}
      style={{borderLeft:'0.3em solid #416f98',padding:'0.25em 0.8em',marginBottom:'0.8em'}}>
      <strong>{feedback.title}</strong>
      {dynamicFeedback&&<p data-p014-dynamic-feedback="true"
        data-source-field-id={`character-${feedback.fieldId}`}
        style={{margin:'0.35em 0 0'}}>{dynamicFeedback}</p>}
      {acknowledgment&&<button type="button" data-p014-feedback-ack="true"
        data-source-button-id={acknowledgment.buttonId}
        data-source-action-sha256={acknowledgment.actionSha256}
        data-source-text-id={`character-${acknowledgment.labelTextId}`}
        disabled={!onAcknowledge}
        onClick={event=>onAcknowledge?.(event.currentTarget)}
        style={{...controlStyle,marginTop:'0.6em'}}>{acknowledgment.label}</button>}
    </div>}
  </section>;
}
