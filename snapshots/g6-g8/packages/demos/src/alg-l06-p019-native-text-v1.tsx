import React from 'react';
import {P019_TEXT_STATE_SOURCE,p019TextState,type P019GlossaryKey}
  from './generated/alg-l06-p019-text-state-v1';

export interface P019NativeTextV1Props {
  frame:number;
  language?:'en'|'es';
  onGlossary?:(key:P019GlossaryKey,trigger:HTMLButtonElement)=>void;
}

type VisibleItem=ReturnType<typeof p019TextState>['visibleText'][number];
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
export function P019NativeTextV1({frame,language='en',onGlossary}:P019NativeTextV1Props){
  const state=p019TextState(frame);
  const bySourceId=(id:number)=>state.visibleText.find(item=>item.sourceTextId===id);
  const first=bySourceId(6),second=bySourceId(18);
  const inputHeading=bySourceId(23),outputHeading=bySourceId(24);
  const tableReady=Boolean(inputHeading?.fullyVisible&&outputHeading?.fullyVisible);
  const controls=state.glossaryControls.filter(control=>control.available);
  return <section lang="en" aria-label="Lesson text" data-p019-native-text="true"
    data-p019-text-frame={frame} data-p019-frame-domain={state.frameDomain}
    data-p019-source-sha256={P019_TEXT_STATE_SOURCE.sourceSwfSha256}
    data-p019-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p019-canvas-suppression="none"
    style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',
      lineHeight:1.5,color:'#15344c',minWidth:0,maxWidth:'100%',boxSizing:'border-box',
      padding:'1rem',background:'#fff',borderRadius:'0.75rem',overflowWrap:'anywhere'}}>
    {(first||second)&&<p data-p019-section="definition" style={{margin:'0 0 0.75em'}}>
      {first&&<SourceRuns item={first}/ >}{second&&<SourceRuns item={second}/ >}
    </p>}
    {tableReady&&<div data-p019-section="source-table"
      style={{maxWidth:'100%',overflowX:'auto',margin:'0 0 0.75em'}}>
      <table style={{borderCollapse:'collapse',width:'100%',maxWidth:'22em',tableLayout:'fixed'}}>
        <thead><tr><th scope="col" style={{textAlign:'left',padding:'0.3em'}}>
          <SourceRuns item={inputHeading!}/></th>
          <th scope="col" style={{textAlign:'left',padding:'0.3em'}}>
            <SourceRuns item={outputHeading!}/></th></tr></thead>
        <tbody>{state.tableRows.filter(row=>row.available).map(row=><tr key={row.inputInstanceId}
          data-p019-source-pair-frame={row.firstCompletePairFrame}
          data-p019-source-input-instance-id={row.inputInstanceId}
          data-p019-source-output-instance-id={row.outputInstanceId}>
          <td style={{borderTop:'1px solid #a9bdc8',padding:'0.3em'}}>{row.inputText}</td>
          <td style={{borderTop:'1px solid #a9bdc8',padding:'0.3em'}}>{row.outputText}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    {state.sourceHighlight.length>0&&<div data-p019-section="source-highlights"
      aria-hidden="true" style={{display:'flex',flexWrap:'wrap',gap:'0.3em',margin:'0 0 0.75em'}}>
      {state.sourceHighlight.map(item=><span key={item.instanceId}
        data-p019-highlight-text-id={item.sourceTextId}
        data-source-text-instance-id={item.instanceId}
        style={{color:'#782c83',fontWeight:700}}>{item.visibleText}</span>)}
    </div>}
    {controls.length>0&&<div data-p019-section="glossary-controls"
      style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',minWidth:0}}>
      {controls.map(control=><button key={control.sourceButtonInstanceId} type="button"
        data-p019-glossary-key={control.key}
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
