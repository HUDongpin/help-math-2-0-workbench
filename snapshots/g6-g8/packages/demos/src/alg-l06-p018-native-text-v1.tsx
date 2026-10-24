import React from 'react';
import {P018_TEXT_STATE_SOURCE,p018TextState,type P018GlossaryKey}
  from './generated/alg-l06-p018-text-state-v1';

export interface P018NativeTextV1Props {
  frame:number;
  language?:'en'|'es';
  onGlossary?:(key:P018GlossaryKey,trigger:HTMLButtonElement)=>void;
}

type VisibleItem=ReturnType<typeof p018TextState>['visibleText'][number];
const isBlue=(color:number[])=>color.join(',')==='0,0,204,255';
const isMagenta=(color:number[])=>color.join(',')==='255,0,255,255';
function SourceRuns({item}:{item:VisibleItem}){
  return <span data-source-text-id={`character-${item.sourceTextId}`}
    data-source-text-instance-id={item.instanceId}
    data-source-fully-visible={item.fullyVisible?'true':'false'}>
    {item.visibleRuns.map((run,index)=><span key={`${item.instanceId}/run-${index}`}
      data-source-rgba={run.colorRgba.join(',')}
      style={isBlue(run.colorRgba)?{color:'#144fab',fontWeight:650}:
        isMagenta(run.colorRgba)?{color:'#782c83',fontWeight:700}:undefined}>{run.text}</span>)}
  </span>;
}

/** Source-timed English reading companion; Canvas keeps authored glyphs and geometry. */
export function P018NativeTextV1({frame,language='en',onGlossary}:P018NativeTextV1Props){
  const state=p018TextState(frame);
  const byId=(id:number)=>state.visibleText.find(item=>item.sourceTextId===id);
  const first=byId(6),second=byId(19),example=byId(27),exampleTail=byId(28);
  const equations=[22,29,30].map(byId).filter((item):item is VisibleItem=>Boolean(item));
  const controls=state.glossaryControls.filter(control=>control.available);
  return <section lang="en" aria-label="Lesson text" data-p018-native-text="true"
    data-p018-text-frame={frame} data-p018-frame-domain={state.frameDomain}
    data-p018-source-sha256={P018_TEXT_STATE_SOURCE.sourceSwfSha256}
    data-p018-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p018-canvas-suppression="none"
    style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',
      lineHeight:1.5,color:'#15344c',minWidth:0,maxWidth:'100%',boxSizing:'border-box',
      padding:'1rem',background:'#fff',borderRadius:'0.75rem',overflowWrap:'anywhere'}}>
    {first&&<p data-p018-section="definition" style={{margin:'0 0 0.75em'}}><SourceRuns item={first}/></p>}
    {second&&<p data-p018-section="result-instruction" style={{margin:'0 0 0.75em'}}>
      <SourceRuns item={second}/></p>}
    {(example||exampleTail)&&<p data-p018-section="worked-example-prompt"
      style={{margin:'0 0 0.75em'}}>
      {example&&<SourceRuns item={example}/ >}{exampleTail&&<SourceRuns item={exampleTail}/ >}
    </p>}
    {equations.length>0&&<div data-p018-section="source-equations"
      style={{display:'grid',gap:'0.25em',margin:'0 0 0.75em',minWidth:0}}>
      {equations.map(item=><div key={item.instanceId} data-p018-equation-text-id={item.sourceTextId}
        style={{fontWeight:700,minWidth:0}}><SourceRuns item={item}/></div>)}
    </div>}
    {state.sourceHighlight.length>0&&<div data-p018-section="source-highlights"
      aria-hidden="true" style={{display:'flex',flexWrap:'wrap',gap:'0.3em',margin:'0 0 0.75em'}}>
      {state.sourceHighlight.map(item=><span key={item.instanceId}
        data-p018-highlight-text-id={item.sourceTextId}
        data-source-text-instance-id={item.instanceId}
        style={{color:'#782c83',fontWeight:700}}>{item.visibleText}</span>)}
    </div>}
    {controls.length>0&&<div data-p018-section="glossary-controls"
      style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',minWidth:0}}>
      {controls.map(control=><button key={control.sourceButtonInstanceId} type="button"
        data-p018-glossary-key={control.key}
        data-source-button-id={control.sourceButtonId}
        data-source-button-instance-id={control.sourceButtonInstanceId}
        data-source-label-text-id={control.sourceLabelTextId}
        data-source-action-sha256={control.sourceActionSha256}
        data-source-button-visual-state="full-hit-and-own-blue-glyph"
        disabled={!onGlossary}
        onClick={event=>onGlossary?.(control.key,event.currentTarget)}
        style={{border:'1px solid currentColor',borderRadius:'0.4em',background:'#edf6fc',
          color:'inherit',font:'inherit',padding:'0.45em 0.8em',cursor:'pointer',
          maxWidth:'100%',minWidth:0,overflowWrap:'anywhere'}}
        aria-label={`Open ${control.key} glossary`}>{control.key} glossary</button>)}
    </div>}
  </section>;
}
