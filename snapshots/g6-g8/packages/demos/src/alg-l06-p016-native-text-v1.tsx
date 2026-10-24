import React from 'react';
import {P016_TEXT_STATE_SOURCE,p016TextState,type P016GlossaryKey}
  from './generated/alg-l06-p016-text-state-v1';

export interface P016NativeTextV1Props {
  frame:number;
  language?:'en'|'es';
  onGlossary?:(key:P016GlossaryKey,trigger:HTMLButtonElement)=>void;
}

/** Source-timed reflow companion; the Canvas keeps all original glyphs. */
export function P016NativeTextV1({frame,language='en',onGlossary}:P016NativeTextV1Props){
  const state=p016TextState(frame);
  const byId=(id:number)=>state.completeInk.find(item=>item.sourceTextId===id);
  const lead=byId(8)??byId(4);
  const explanation=[byId(11),byId(12)].filter(item=>item!==undefined);
  const input=[byId(122),byId(123)].filter(item=>item!==undefined);
  const output=byId(125);
  const equation=byId(127);
  const sourceText=(id:number,text:string)=><span key={id} data-source-text-id={`character-${id}`}>{text}</span>;
  return <section lang="en" aria-label="Lesson text" data-p016-native-text="true"
    data-p016-text-frame={frame} data-p016-frame-domain={state.frameDomain}
    data-p016-source-sha256={P016_TEXT_STATE_SOURCE.sourceSwfSha256}
    data-p016-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p016-canvas-suppression="none"
    style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',
      lineHeight:1.5,color:'#15344c',minWidth:0,padding:'1rem',background:'#fff',
      borderRadius:'0.75rem',overflowWrap:'anywhere'}}>
    {lead&&<div data-p016-section="definition" style={{marginBottom:'0.8rem'}}>
      <p style={{margin:'0 0 0.45em'}}>{sourceText(lead.sourceTextId,lead.text)}</p>
      {explanation.length>0&&<p style={{margin:'0 0 0.45em'}}>
        {explanation.map(item=>sourceText(item.sourceTextId,item.text))}
      </p>}
      {state.functionControl.available&&<button type="button"
        data-p016-glossary-key="Function" data-source-button-id={state.functionControl.sourceButtonId}
        data-source-action-sha256={state.functionControl.sourceActionSha256}
        data-source-button-visual-state="hit-test-only-partial-mask"
        disabled={!onGlossary}
        onClick={event=>onGlossary?.('Function',event.currentTarget)}
        style={{border:'1px solid currentColor',borderRadius:'0.4em',background:'#edf6fc',
          color:'inherit',font:'inherit',padding:'0.45em 0.8em',cursor:'pointer',
          maxWidth:'100%',overflowWrap:'anywhere'}}
        aria-label="Open Function glossary">Function glossary</button>}
    </div>}
    {(byId(120)||input.length>0||byId(124)||output)&&<div data-p016-section="input-output"
      style={{borderLeft:'0.3em solid #416f98',padding:'0.2em 0.8em',minWidth:0}}>
      {byId(120)&&<p data-p016-input-heading="true" style={{fontWeight:700,margin:'0 0 0.4em'}}>
        {sourceText(120,byId(120)!.text)}</p>}
      {input.length>0&&<p data-p016-input-value="true" style={{margin:'0 0 0.7em'}}>
        {input.map(item=>sourceText(item.sourceTextId,item.text))}</p>}
      {byId(124)&&<p data-p016-output-heading="true" style={{fontWeight:700,margin:'0 0 0.4em'}}>
        {sourceText(124,byId(124)!.text)}</p>}
      {output&&<p data-p016-output-value="true" style={{margin:'0 0 0.7em'}}>
        {sourceText(125,output.text)}</p>}
      {equation&&<p data-p016-source-equation="true" style={{margin:'0'}}>
        {sourceText(127,equation.text)}</p>}
    </div>}
  </section>;
}
