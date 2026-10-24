import React from 'react';
import {P017_TEXT_STATE_SOURCE,p017TextState,type P017GlossaryKey}
  from './generated/alg-l06-p017-text-state-v1';

export interface P017NativeTextV1Props {
  frame:number;
  language?:'en'|'es';
  onGlossary?:(key:P017GlossaryKey,trigger:HTMLButtonElement)=>void;
}

/** Source-timed reflow companion. Canvas retains the complete authored drawing and glyphs. */
export function P017NativeTextV1({frame,language='en',onGlossary}:P017NativeTextV1Props){
  const state=p017TextState(frame);
  const byId=(id:number)=>state.completeInk.find(item=>item.sourceTextId===id);
  const sourceText=(item:NonNullable<ReturnType<typeof byId>>)=><span key={item.instanceId}
    data-source-text-id={`character-${item.sourceTextId}`}
    data-source-text-instance={item.instanceId}>{item.text}</span>;
  const first=byId(5),continuation=byId(15),output=byId(18),input=byId(22),equation=byId(25);
  const controls=state.glossaryControls.filter(control=>control.available);
  return <section lang="en" aria-label="Lesson text" data-p017-native-text="true"
    data-p017-text-frame={frame} data-p017-frame-domain={state.frameDomain}
    data-p017-source-sha256={P017_TEXT_STATE_SOURCE.sourceSwfSha256}
    data-p017-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p017-canvas-suppression="none"
    data-p017-late-fragment-count={state.unresolvedLateFragments.length}
    style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',
      lineHeight:1.5,color:'#15344c',minWidth:0,padding:'1rem',background:'#fff',
      borderRadius:'0.75rem',overflowWrap:'anywhere'}}>
    {(first||continuation)&&<p data-p017-section="definition" style={{margin:'0 0 0.75em'}}>
      {first&&sourceText(first)}{continuation&&sourceText(continuation)}</p>}
    {output&&<p data-p017-section="output-variable" style={{margin:'0 0 0.75em'}}>
      {sourceText(output)}</p>}
    {input&&<p data-p017-section="input-variable" style={{margin:'0 0 0.75em'}}>
      {sourceText(input)}</p>}
    {equation&&<p data-p017-section="source-equation" style={{margin:'0 0 0.75em',
      fontWeight:700}}>{sourceText(equation)}</p>}
    {controls.length>0&&<div data-p017-section="glossary-controls"
      style={{display:'flex',flexWrap:'wrap',gap:'0.5rem'}}>
      {controls.map(control=><button key={control.sourceButtonId} type="button"
        data-p017-glossary-key={control.key}
        data-source-button-id={control.sourceButtonId}
        data-source-action-sha256={control.sourceActionSha256}
        data-source-button-visual-state="full-hit-and-blue-glyph"
        disabled={!onGlossary}
        onClick={event=>onGlossary?.(control.key,event.currentTarget)}
        style={{border:'1px solid currentColor',borderRadius:'0.4em',background:'#edf6fc',
          color:'inherit',font:'inherit',padding:'0.45em 0.8em',cursor:'pointer',
          maxWidth:'100%',overflowWrap:'anywhere'}}
        aria-label={`Open ${control.key} glossary`}>{control.key} glossary</button>)}
    </div>}
  </section>;
}
