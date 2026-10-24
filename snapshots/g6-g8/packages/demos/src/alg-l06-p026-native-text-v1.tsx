import React from 'react';
import {P026_TIMELINE,p026TimelineState,type P026GlossaryKey} from './alg-l06-p026-timeline-v1';

export {P026_TIMELINE,p026TimelineState};
export type {P026GlossaryKey};

export interface P026NativeTextV1Props {
  frame: number;
  language?: 'en' | 'es';
  onGlossary?: (key: P026GlossaryKey, trigger: HTMLButtonElement) => void;
}

/** Complete source paragraphs become native text; moving partial ink stays on the source canvas. */
export function P026NativeTextV1({frame,language='en',onGlossary}:P026NativeTextV1Props) {
  const state=p026TimelineState(frame);
  return <section lang="en" aria-label={language==='es'?'Texto original de la lección':'Original lesson text'}
    data-p026-native-text="true" data-p026-frame={frame}
    data-p026-source-sha256={P026_TIMELINE.sourceSwfSha256}
    data-p026-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p026-suppressed-text-ids={state.suppressibleSourceTextIds.join(',')}
    data-p026-suppressed-text-instance-ids={state.suppressibleSourceTextInstanceIds.join(',')}
    data-p026-canvas-fallback-instance-ids={state.canvasFallbackTextInstanceIds.join(',')}
    style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',lineHeight:1.5,
      color:'#15344c',minWidth:0,maxWidth:'100%',boxSizing:'border-box',padding:'1rem',
      background:'#fff',borderRadius:'0.75rem',overflowWrap:'anywhere'}}>
    {state.nativeParagraphs.map(paragraph=><p key={paragraph.instanceId}
      data-p026-section="source-paragraph" data-source-text-id={`character-${paragraph.sourceTextId}`}
      data-source-text-instance-id={paragraph.instanceId} data-source-depth={paragraph.depth}
      style={{margin:'0 0 0.75em',opacity:paragraph.alpha}}>
      {paragraph.runs.map(run=><span key={run.sourceTextId}
        data-source-run-id={run.sourceTextId} data-source-color-rgb={run.colorRgb.join(',')}
        style={run.colorRgb.join(',')==='0,0,204'?{color:'#144fab',fontWeight:650}:undefined}>
        {run.text}</span>)}
    </p>)}
    {state.glossaryInstances.some(control=>control.available)&&<div
      data-p026-section="source-glossary-controls" style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',minWidth:0}}>
      {state.glossaryInstances.filter(control=>control.available).map(control=><button
        key={control.instanceId} type="button" data-p026-glossary-key={control.key}
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
