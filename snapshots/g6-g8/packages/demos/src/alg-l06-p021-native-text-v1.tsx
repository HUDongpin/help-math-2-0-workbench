import React from 'react';
import {P021_TEXT_STATE_SOURCE,p021TextState,type P021GlossaryKey}
  from './generated/alg-l06-p021-text-state-v1';

export interface P021NativeTextV1Props {
  frame:number;
  language?:'en'|'es';
  onGlossary?:(key:P021GlossaryKey,trigger:HTMLButtonElement)=>void;
}

type TextItem=ReturnType<typeof p021TextState>['visibleText'][number];
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

/** Source-timed English reading companion; the maintained Canvas preserves authored glyphs. */
export function P021NativeTextV1({frame,language='en',onGlossary}:P021NativeTextV1Props){
  const state=p021TextState(frame);
  const controls=state.glossaryControls.filter(control=>control.available);
  const [inputHeading,outputHeading]=state.tableHeadings;
  const tableReady=Boolean(inputHeading&&outputHeading);
  const pairs=state.orderedPairs.filter(pair=>pair.available);
  return <section lang="en" aria-label="Lesson text" data-p021-native-text="true"
    data-p021-text-frame={frame} data-p021-frame-domain={state.frameDomain}
    data-p021-source-sha256={P021_TEXT_STATE_SOURCE.sourceSwfSha256}
    data-p021-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p021-canvas-suppression="none"
    style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',
      lineHeight:1.5,color:'#15344c',minWidth:0,maxWidth:'100%',boxSizing:'border-box',
      padding:'1rem',background:'#fff',borderRadius:'0.75rem',overflowWrap:'anywhere'}}>
    {state.prose.length>0&&<p data-p021-section="definition" style={{margin:'0 0 0.75em'}}>
      {state.prose.map(item=><SourceText key={item.instanceId} item={item}/>)}
    </p>}
    {state.example.available&&<p data-p021-section="source-example"
      data-p021-source-example-frame={state.example.firstCompletePairFrame}
      data-p021-source-instance-ids={state.example.sourceInstanceIds.join('|')}
      style={{margin:'0 0 0.75em'}}>
      ({state.example.inputText}, {state.example.outputText})
    </p>}
    {tableReady&&<div data-p021-section="source-table"
      style={{maxWidth:'100%',overflowX:'auto',margin:'0 0 0.75em'}}>
      <table style={{borderCollapse:'collapse',width:'100%',maxWidth:'22em',tableLayout:'fixed'}}>
        <thead><tr><th scope="col" style={{textAlign:'left',padding:'0.3em'}}>
          <SourceText item={inputHeading!}/></th>
          <th scope="col" style={{textAlign:'left',padding:'0.3em'}}>
            <SourceText item={outputHeading!}/></th></tr></thead>
        <tbody>{state.tableRows.filter(row=>row.available).map(row=><tr key={row.inputInstanceId}
          data-p021-source-pair-frame={row.firstCompletePairFrame}
          data-p021-source-input-instance-id={row.inputInstanceId}
          data-p021-source-output-instance-id={row.outputInstanceId}>
          <td style={{borderTop:'1px solid #a9bdc8',padding:'0.3em'}}>{row.inputText}</td>
          <td style={{borderTop:'1px solid #a9bdc8',padding:'0.3em'}}>{row.outputText}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    {pairs.length>0&&<div data-p021-section="source-ordered-pairs"
      aria-label="Ordered pairs shown by the source" style={{margin:'0 0 0.75em'}}>
      {pairs.map(pair=><span key={pair.ordinal}
        data-p021-ordered-pair-ordinal={pair.ordinal}
        data-p021-ordered-pair-frame={pair.firstCompletePairFrame}
        data-p021-source-instance-ids={pair.sourceInstanceIds.join('|')}
        style={{display:'inline-block',marginInlineEnd:'0.75em'}}>
        ({pair.inputText}, {pair.outputText})</span>)}
    </div>}
    {controls.length>0&&<div data-p021-section="glossary-controls"
      style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',minWidth:0}}>
      {controls.map(control=><button key={control.sourceButtonInstanceId} type="button"
        data-p021-glossary-key={control.key}
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
