import React from 'react';
import {P027_TIMELINE,p027TimelineState,type P027GlossaryKey} from './alg-l06-p027-timeline-v1';

export {P027_TIMELINE,p027TimelineState};
export type {P027GlossaryKey};

export interface P027NativeTextV1Props {
  frame: number;
  language?: 'en' | 'es';
  onGlossary?: (key: P027GlossaryKey, trigger: HTMLButtonElement) => void;
}

/** Source text remains drawn on Canvas until every owned instance can be suppressed there. */
export function P027NativeTextV1({frame,language='en',onGlossary}:P027NativeTextV1Props) {
  const state=p027TimelineState(frame);
  return <section lang="en" aria-label={language==='es'?'Texto original de la lección':'Original lesson text'}
    data-p027-native-text="true" data-p027-frame={frame}
    data-p027-source-sha256={P027_TIMELINE.sourceSwfSha256}
    data-p027-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p027-source-canvas-preserved="true"
    data-p027-suppressed-text-instance-ids={state.suppressibleSourceTextInstanceIds.join(',')}
    data-p027-native-ready-instance-ids={state.nativeReadyTextInstances.map(value=>value.instanceId).join(',')}
    data-p027-partial-instance-ids={state.partialSourceTextInstances.map(value=>value.instanceId).join(',')}
    style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',lineHeight:1.5,
      color:'#15344c',minWidth:0,maxWidth:'100%',boxSizing:'border-box',padding:'1rem',
      background:'#fff',borderRadius:'0.75rem',overflowWrap:'anywhere'}}>
    {state.nativeReadyTextInstances.map(value=><p key={value.instanceId}
      data-p027-section="source-text" data-source-text-id={`character-${value.sourceTextId}`}
      data-source-text-instance-id={value.instanceId} data-source-depth={value.depth}
      style={{margin:'0 0 0.65em',opacity:value.alpha}}>
      {value.runs.map(run=><span key={run.sourceTextId}
        data-source-run-id={run.sourceTextId} data-source-color-rgb={run.colorRgb.join(',')}
        style={run.colorRgb.join(',')==='0,0,204'?{color:'#144fab',fontWeight:650}:undefined}>
        {run.text}</span>)}
    </p>)}
    {state.glossaryInstances.some(control=>control.available)&&<div
      data-p027-section="source-glossary-controls" style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',minWidth:0}}>
      {state.glossaryInstances.filter(control=>control.available).map(control=><button
        key={control.instanceId} type="button" data-p027-glossary-key={control.key}
        data-source-button-id={control.buttonId} data-source-button-instance-id={control.instanceId}
        data-source-action-sha256={control.sourceActionSha256}
        data-source-label-text-id={control.label.textId}
        data-source-label-instance-id={control.label.textInstanceId}
        data-source-label-run-id={control.label.sourceTextId}
        data-source-label-segment={control.label.segment}
        data-source-button-visual-state="full-hit-and-own-blue-glyph"
        disabled={!onGlossary}
        onClick={event=>onGlossary?.(control.key,event.currentTarget)}
        aria-label={language==='es'?`Abrir glosario: ${control.key}`:`Open ${control.key} glossary`}
        style={{minHeight:44,border:'1px solid currentColor',borderRadius:'0.4em',
          background:'#edf6fc',color:'inherit',font:'inherit',padding:'0.45em 0.8em',
          cursor:'pointer',maxWidth:'100%',minWidth:0,overflowWrap:'anywhere'}}>
        {control.key} {language==='es'?'glosario':'glossary'}
      </button>)}
    </div>}
  </section>;
}
