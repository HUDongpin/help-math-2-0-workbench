import React from 'react';
import {P015_TEXT_STATE_SOURCE,p015TextState,type P015GlossaryKey}
  from './generated/alg-l06-p015-text-state-v1';

export interface P015NativeTextV1Props {
  frame:number;
  language?:'en'|'es';
  onGlossary?:(key:P015GlossaryKey,trigger:HTMLButtonElement)=>void;
}

/** Reflowing semantic companion; the Canvas retains all source glyphs and artwork. */
export function P015NativeTextV1({frame,language='en',onGlossary}:P015NativeTextV1Props){
  const state=p015TextState(frame);
  const buttonStyle:React.CSSProperties={border:'1px solid currentColor',borderRadius:'0.4em',
    background:'#edf6fc',color:'inherit',font:'inherit',padding:'0.45em 0.8em',
    cursor:'pointer',maxWidth:'100%',overflowWrap:'anywhere'};
  return <section lang="en" aria-label="Lesson text" data-p015-native-text="true"
    data-p015-text-frame={frame} data-p015-frame-domain={state.frameDomain}
    data-p015-source-sha256={P015_TEXT_STATE_SOURCE.sourceSwfSha256}
    data-p015-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p015-canvas-suppression="none"
    style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',
      lineHeight:1.5,color:'#15344c',minWidth:0,padding:'1rem',background:'#fff',
      borderRadius:'0.75rem',overflowWrap:'anywhere'}}>
    {state.machineLabel.visible&&<p data-p015-machine-label="true"
      data-source-text-id={`character-${state.machineLabel.sourceTextId}`}
      aria-label={`Machine label: ${state.machineLabel.text}`}
      style={{margin:'0 0 0.7em'}}>{state.machineLabel.text}</p>}
    {state.sections.map(section=>{
      const controls=state.controls.filter(control=>section.controls.includes(control.buttonId)
        &&control.available);
      return (section.visible||controls.length>0)&&<div key={section.id}
        data-p015-section={section.id}
        style={{borderLeft:'0.3em solid #416f98',padding:'0.2em 0.8em',
          margin:'0 0 0.75em',minWidth:0}}>
        {section.visible&&<p data-p015-sentence={section.id}
          data-source-text-id={`character-${section.sourceTextId}`}
          style={{margin:'0 0 0.45em'}}>{section.text}</p>}
        {controls.length>0&&<div role="group" aria-label="Vocabulary"
          style={{display:'flex',flexWrap:'wrap',gap:'0.5em',minWidth:0}}>
          {controls.map(control=><button key={control.key} type="button"
            data-p015-glossary-key={control.key}
            data-source-button-id={control.buttonId}
            data-source-text-id={`character-${control.termTextId}`}
            data-source-action-sha256={control.sourceActionSha256}
            data-source-button-visual-state={control.sourceVisualState}
            disabled={!onGlossary}
            onClick={event=>onGlossary?.(control.key,event.currentTarget)}
            style={buttonStyle} aria-label={`Open ${control.key} glossary`}>
            {control.key} glossary</button>)}
        </div>}
      </div>;
    })}
  </section>;
}
