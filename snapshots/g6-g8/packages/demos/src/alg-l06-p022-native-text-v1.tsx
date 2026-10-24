import React from 'react';
import {P022_TEXT_STATE_SOURCE,p022TextState,type P022GlossaryKey}
  from './generated/alg-l06-p022-text-state-v1';

export interface P022NativeTextV1Props {
  frame:number;
  language?:'en'|'es';
  onGlossary?:(key:P022GlossaryKey,trigger:HTMLButtonElement)=>void;
}

type TextItem=Pick<ReturnType<typeof p022TextState>['visibleText'][number],
  'sourceTextId'|'instanceId'|'runs'>;
const isBlue=(rgba:number[])=>rgba.join(',')==='0,0,204,255';
function SourceText({item}:{item:TextItem}){
  return <span data-source-text-id={`character-${item.sourceTextId}`}
    data-source-text-instance-id={item.instanceId}>
    {item.runs.map((run,index)=><span key={`${item.instanceId}/run-${index}`}
      data-source-rgba={run.colorRgba.join(',')}
      style={isBlue(run.colorRgba)?{color:'#144fab',fontWeight:650}:undefined}>
      {run.text}</span>)}
  </span>;
}

/** Source-timed English reading companion; authored Canvas glyphs remain intact. */
export function P022NativeTextV1({frame,language='en',onGlossary}:P022NativeTextV1Props){
  const state=p022TextState(frame);
  const controls=state.glossaryControls.filter(control=>control.available);
  return <section lang="en" aria-label="Lesson text" data-p022-native-text="true"
    data-p022-text-frame={frame} data-p022-frame-domain={state.frameDomain}
    data-p022-source-sha256={P022_TEXT_STATE_SOURCE.sourceSwfSha256}
    data-p022-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p022-canvas-suppression="none"
    style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',
      lineHeight:1.5,color:'#15344c',minWidth:0,maxWidth:'100%',boxSizing:'border-box',
      padding:'1rem',background:'#fff',borderRadius:'0.75rem',overflowWrap:'anywhere'}}>
    {state.prose.length>0&&<p data-p022-section="definition" style={{margin:'0 0 0.75em'}}>
      {state.prose.map(item=><SourceText key={item.instanceId} item={item}/>)}
    </p>}
    {state.steps.length>0&&<div data-p022-section="source-steps"
      aria-label="Steps already revealed in the lesson" style={{margin:'0 0 0.75em'}}>
      {state.steps.map(item=><p key={item.instanceId} data-p022-step-source-id={item.sourceTextId}
        data-p022-step-first-complete-frame={item.completeInkSpans[0]?.[0]}
        style={{margin:'0 0 0.3em',fontVariantNumeric:'lining-nums tabular-nums'}}>
        <SourceText item={item}/></p>)}
    </div>}
    {state.orderedPair.available&&<p data-p022-section="source-ordered-pair"
      data-p022-ordered-pair-first-frame={state.orderedPair.firstCompletePairFrame}
      data-p022-source-instance-ids={state.orderedPair.sourceInstanceIds.join('|')}
      style={{margin:'0 0 0.75em'}}>{state.orderedPair.text}</p>}
    {controls.length>0&&<div data-p022-section="glossary-controls"
      style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',minWidth:0}}>
      {controls.map(control=><button key={control.sourceButtonInstanceId} type="button"
        data-p022-glossary-key={control.key}
        data-p022-source-button-instance-id={control.sourceButtonInstanceId}
        data-p022-source-action-sha256={control.sourceActionSha256}
        data-p022-source-label-instance-id={control.sourceLabelTextInstanceId}
        data-p022-source-label-text-id={control.sourceLabelTextId}
        data-p022-source-label-segment={control.sourceLabelSegment}
        data-source-button-id={control.sourceButtonId}
        data-source-button-instance-id={control.sourceButtonInstanceId}
        data-source-action-sha256={control.sourceActionSha256}
        data-source-label-text-id={control.sourceLabelTextId}
        data-source-label-segment={control.sourceLabelSegment}
        data-source-button-visual-state="full-hit-and-own-blue-glyph"
        disabled={!onGlossary}
        onClick={event=>onGlossary?.(control.key,event.currentTarget)}
        aria-label={`Open ${control.key} glossary`}
        style={{border:'1px solid currentColor',borderRadius:'0.4em',background:'#edf6fc',
          color:'inherit',font:'inherit',padding:'0.45em 0.8em',cursor:'pointer',
          maxWidth:'100%',minWidth:0,overflowWrap:'anywhere'}}>
        {control.key} glossary</button>)}
    </div>}
  </section>;
}
