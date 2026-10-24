import React from 'react';
import {P020_TEXT_STATE_SOURCE,p020TextState,
  type P020GlossaryKey,type P020Option}
  from './generated/alg-l06-p020-text-state-v1';

export interface P020NativeQuizSnapshotV1 {
  phase:'before-quiz'|'awaiting-answer'|'feedback'|'post-quiz'|'closed';
  answersEnabled:boolean;
  feedbackKind:'right'|'wrong'|null;
  feedbackDomain:number|null;
  feedbackFrame:number|null;
  feedbackText:string|null;
  feedbackHoldFrame?:number|null;
  feedbackAwaitingAcknowledgment?:boolean;
  feedbackAckButtonCharacterId?:number|null;
  glossaryOpen?:P020GlossaryKey|null;
}

export interface P020NativeTextV1Props {
  frame:number;
  language?:'en'|'es';
  quizState?:P020NativeQuizSnapshotV1;
  onGlossary?:(key:P020GlossaryKey,trigger:HTMLButtonElement)=>void;
  onAnswer?:(option:P020Option,trigger:HTMLButtonElement)=>void;
  onAcknowledge?:(trigger:HTMLButtonElement)=>void;
}

const inSpans=(spans:[number,number][],frame:number)=>
  spans.some(([from,to])=>from<=frame&&frame<=to);
const controlStyle:React.CSSProperties={border:'1px solid currentColor',
  borderRadius:'0.4em',background:'#edf6fc',color:'inherit',font:'inherit',
  padding:'0.45em 0.8em',cursor:'pointer',maxWidth:'100%',minWidth:0,
  overflowWrap:'anywhere'};

/** Source-English reading companion. The authored Canvas text remains in place. */
export function P020NativeTextV1({frame,language='en',quizState,
  onGlossary,onAnswer,onAcknowledge}:P020NativeTextV1Props){
  const state=p020TextState(frame);
  const headerReady=state.table.headings.every(heading=>heading.visible);
  const visibleOptions=state.options.filter(option=>option.visible);
  const answerReady=frame===58&&quizState?.phase==='awaiting-answer'&&
    quizState.answersEnabled===true;
  const feedbackFrame=quizState?.feedbackFrame;
  const feedback=quizState?.phase==='feedback'&&
    typeof feedbackFrame==='number'&&Number.isInteger(feedbackFrame)&&
    quizState.feedbackDomain!==null
    ?state.feedback.domains.find(domain=>domain.domain===quizState.feedbackDomain&&
      domain.kind===quizState.feedbackKind&&feedbackFrame>=1&&
      feedbackFrame<=domain.frameCount&&inSpans(domain.titleVisibleSpans,feedbackFrame))
    :undefined;
  const dynamicFeedback=feedback?.kind==='wrong'&&
    typeof feedbackFrame==='number'&&inSpans(feedback.dynamicVisibleSpans,feedbackFrame)&&
    quizState?.feedbackText&&state.feedback.wrongStrings.includes(quizState.feedbackText)
    ?quizState.feedbackText:null;
  const acknowledgment=feedback?.kind==='wrong'&&feedback.acknowledgment&&
    feedbackFrame===feedback.acknowledgment.holdFrame&&
    quizState?.feedbackHoldFrame===feedback.acknowledgment.holdFrame&&
    quizState?.feedbackAckButtonCharacterId===feedback.acknowledgment.buttonId&&
    quizState?.feedbackAwaitingAcknowledgment===true
    ?feedback.acknowledgment:null;
  const glossaryEnabled=quizState?.phase!=='feedback'&&quizState?.phase!=='closed'&&
    (quizState?.glossaryOpen??null)===null;
  return <section lang="en" aria-label="Lesson text" data-p020-native-text="true"
    data-p020-text-frame={frame} data-p020-frame-domain={state.frameDomain}
    data-p020-source-sha256={P020_TEXT_STATE_SOURCE.sourceSwfSha256}
    data-p020-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p020-canvas-suppression="none"
    style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',
      lineHeight:1.5,color:'#15344c',minWidth:0,maxWidth:'100%',boxSizing:'border-box',
      padding:'1rem',background:'#fff',borderRadius:'0.75rem',overflowWrap:'anywhere'}}>
    {state.question.visible&&<p data-p020-question="true"
      data-source-text-id={`character-${state.question.sourceTextId}`}
      data-source-text-instance-id={state.question.sourceTextInstanceId}
      style={{margin:'0 0 0.75em'}}>{state.question.runs.map((run,index)=><span
        key={index} data-source-rgba={run.colorRgba.join(',')}
        style={run.colorRgba.join(',')==='0,0,204,255'
          ?{color:'#144fab',fontWeight:650}:undefined}>{run.text}</span>)}</p>}
    {headerReady&&<div data-p020-section="source-table"
      style={{maxWidth:'100%',overflowX:'auto',margin:'0 0 0.75em'}}>
      <table style={{borderCollapse:'collapse',width:'100%',maxWidth:'22em',tableLayout:'fixed'}}>
        <thead><tr>{state.table.headings.map(heading=><th key={heading.sourceTextInstanceId}
          scope="col" data-source-text-id={`character-${heading.sourceTextId}`}
          data-source-text-instance-id={heading.sourceTextInstanceId}
          style={{textAlign:'left',padding:'0.3em'}}>{heading.text}</th>)}</tr></thead>
        <tbody>{state.table.rows.filter(row=>row.visible).map(row=><tr key={row.inputInstanceId}
          data-p020-source-table-row={row.row}
          data-source-input-instance-id={row.inputInstanceId}
          data-source-output-instance-id={row.outputInstanceId}>
          <td data-source-text-id={`character-${row.inputSourceTextId}`}
            style={{borderTop:'1px solid #a9bdc8',padding:'0.3em'}}>{row.inputText}</td>
          <td data-source-text-id={`character-${row.outputSourceTextId}`}
            style={{borderTop:'1px solid #a9bdc8',padding:'0.3em'}}>{row.outputText}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    {visibleOptions.length>0&&<div role="group"
      aria-label={visibleOptions.length===1?'Answer shown':'Answer choices'}
      data-p020-options="true"
      style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 8.5em), 1fr))',
        gap:'0.5em',marginBottom:'0.8em'}}>
      {visibleOptions.map(option=>
        answerReady?<button key={option.option} type="button"
          data-p020-option={option.option}
          data-source-instance={option.sourceInstance}
          data-source-button-instance-id={option.sourceButtonInstanceId}
          data-source-button-id={option.buttonId}
          data-source-action-sha256={option.sourceActionSha256}
          disabled={!onAnswer}
          onClick={event=>onAnswer?.(option.option,event.currentTarget)}
          style={controlStyle}>{option.label}. {option.value}</button>
        :<span key={option.option} data-p020-option={option.option}
          data-source-instance={option.sourceInstance}
          data-source-label-text-id={option.labelSourceTextId}
          data-source-value-text-id={option.valueSourceTextId}
          style={{padding:'0.35em 0.65em',border:'1px solid #a8bbca',
            borderRadius:'0.4em'}}>{option.label}. {option.value}</span>)}</div>}
    {state.glossaryControls.some(control=>control.available)&&<div role="group"
      aria-label="Vocabulary" data-p020-glossary="true"
      style={{display:'flex',flexWrap:'wrap',gap:'0.5em',minWidth:0,marginBottom:'0.8em'}}>
      {state.glossaryControls.filter(control=>control.available).map(control=><button
        key={control.sourceButtonInstanceId} type="button"
        data-p020-glossary-key={control.key}
        data-source-button-id={control.buttonId}
        data-source-action-sha256={control.sourceActionSha256}
        data-source-button-instance-id={control.sourceButtonInstanceId}
        data-source-label-text-id={control.sourceLabelTextId}
        data-source-button-visual-state="full-hit-and-own-blue-glyph"
        disabled={!onGlossary||!glossaryEnabled}
        onClick={event=>onGlossary?.(control.key,event.currentTarget)}
        style={controlStyle} aria-label={`Open ${control.key} glossary`}>
        {control.key} glossary</button>)}</div>}
    {feedback&&<div role="status" aria-live="polite"
      data-p020-feedback-domain={feedback.domain}
      data-p020-feedback-kind={feedback.kind}
      data-source-text-id={`character-${feedback.textId}`}
      data-source-text-instance-id={feedback.sourceTitleInstanceId}
      style={{borderLeft:'0.3em solid #416f98',padding:'0.25em 0.8em',marginBottom:'0.8em'}}>
      <strong>{feedback.title}</strong>
      {dynamicFeedback&&<p data-p020-dynamic-feedback="true"
        data-source-field-id={`character-${feedback.fieldId}`}
        style={{margin:'0.35em 0 0'}}>{dynamicFeedback}</p>}
      {acknowledgment&&<button type="button" data-p020-feedback-ack="true"
        data-source-button-id={acknowledgment.buttonId}
        data-source-action-sha256={acknowledgment.actionSha256}
        data-source-text-id={`character-${acknowledgment.labelTextId}`}
        disabled={!onAcknowledge}
        onClick={event=>onAcknowledge?.(event.currentTarget)}
        style={{...controlStyle,marginTop:'0.6em'}}>{acknowledgment.label}</button>}
    </div>}
  </section>;
}
