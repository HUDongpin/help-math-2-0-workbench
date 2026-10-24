import React from 'react';
import {P023_TEXT_STATE_SOURCE,p023TextState,type P023GlossaryKey} from './generated/alg-l06-p023-text-state-v1';
export {P023_TEXT_STATE_SOURCE,p023TextState};
export type {P023GlossaryKey};
type TextItem=Pick<ReturnType<typeof p023TextState>['visibleText'][number],
 'sourceTextId'|'instanceId'|'runs'>;
const isBlue=(rgba:number[])=>rgba.join(',')==='0,0,204,255';
function SourceText({item}:{item:TextItem}){
 return <span data-source-text-id={'character-'+item.sourceTextId}
  data-source-text-instance-id={item.instanceId}>
  {item.runs.map((run,index)=><span key={item.instanceId+'/run-'+index}
   data-source-rgba={run.colorRgba.join(',')}
   style={isBlue(run.colorRgba)?{color:'#144fab',fontWeight:650}:undefined}>
   {run.text}</span>)}
 </span>;
}
export interface P023NativeTextV1Props {frame:number;language?:'en'|'es';
 onGlossary?:(key:P023GlossaryKey,trigger:HTMLButtonElement)=>void;}
/** Source-timed English reading companion; authored Canvas glyphs remain intact. */
export function P023NativeTextV1({frame,language='en',onGlossary}:P023NativeTextV1Props){
 const state=p023TextState(frame);
 const controls=state.glossaryControls.filter(item=>item.available);
 return <section lang="en" aria-label="Lesson text" data-p023-native-text="true"
  data-p023-text-frame={frame} data-p023-frame-domain={state.frameDomain}
  data-p023-source-sha256={P023_TEXT_STATE_SOURCE.sourceSwfSha256}
  data-p023-language-policy={language==='es'?'source-en-fallback':'source-en'}
  data-p023-canvas-suppression="none"
  style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',lineHeight:1.5,
   color:'#15344c',minWidth:0,maxWidth:'100%',boxSizing:'border-box',padding:'1rem',
   background:'#fff',borderRadius:'0.75rem',overflowWrap:'anywhere'}}>
  {state.definitionRuns.some(run=>run.available)&&<p data-p023-section="definition"
   data-p023-definition-complete={Boolean(state.definition)} style={{margin:'0 0 0.75em'}}>
   <span data-source-text-id={'character-'+state.definitionSource.sourceTextId}
    data-source-text-instance-id={state.definitionSource.instanceId}>
    {state.definitionRuns.filter(run=>run.available).map(run=><span
     key={state.definitionSource.instanceId+'/run-'+run.index}
     data-source-rgba={run.colorRgba.join(',')}
     data-p023-run-first-complete-frame={run.completeInkSpans[0]?.[0]}
     style={isBlue(run.colorRgba)?{color:'#144fab',fontWeight:650}:undefined}>
     {run.text}</span>)}
   </span></p>}
  {state.table.available&&<table data-p023-section="source-table"
   data-p023-table-first-frame={P023_TEXT_STATE_SOURCE.reading.tableFirstCompleteFrame}
   style={{borderCollapse:'collapse',margin:'0 0 0.75em',fontVariantNumeric:'tabular-nums'}}>
   <thead><tr>{state.table.headers.map(item=><th key={item!.instanceId} scope="col"
    style={{padding:'0.25em 0.75em',textAlign:'center'}}><SourceText item={item!}/></th>)}</tr></thead>
   <tbody>{state.table.rows.map((row,index)=><tr key={index}>
    <td style={{padding:'0.2em 0.75em',textAlign:'center'}}><SourceText item={row.input!}/></td>
    <td style={{padding:'0.2em 0.75em',textAlign:'center'}}><SourceText item={row.output!}/></td>
   </tr>)}</tbody></table>}
  {state.setNotation.available&&<p data-p023-section="source-set-notation"
   data-p023-set-first-ordered-frame={state.setNotation.firstOrderedFrame}
   data-p023-source-instance-ids={state.setNotation.tokens.map(item=>item!.instanceId).join('|')}
   style={{margin:'0 0 0.75em',fontVariantNumeric:'tabular-nums'}}>
   {state.setNotation.tokens.map(item=><SourceText key={item!.instanceId} item={item!}/>)}
  </p>}
  {controls.length>0&&<div data-p023-section="glossary-controls"
   style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',minWidth:0}}>
   {controls.map(control=><button key={control.sourceButtonInstanceId} type="button"
    data-p023-glossary-key={control.key}
    data-p023-source-button-instance-id={control.sourceButtonInstanceId}
    data-p023-source-action-sha256={control.sourceActionSha256}
    data-p023-source-label-instance-id={control.sourceLabelTextInstanceId}
    data-p023-source-label-text-id={control.sourceLabelTextId}
    data-p023-source-label-segment={control.sourceLabelSegment}
    data-source-button-id={control.sourceButtonId}
    data-source-button-instance-id={control.sourceButtonInstanceId}
    data-source-action-sha256={control.sourceActionSha256}
    data-source-label-text-id={control.sourceLabelTextId}
    data-source-label-segment={control.sourceLabelSegment}
    data-source-button-visual-state="full-hit-and-own-blue-glyph"
    disabled={!onGlossary}
    onClick={event=>onGlossary?.(control.key,event.currentTarget)}
    aria-label={language==='es'?'Abrir glosario: '+control.key:'Open '+control.key+' glossary'}
    style={{border:'1px solid currentColor',borderRadius:'0.4em',background:'#edf6fc',
     color:'inherit',font:'inherit',padding:'0.45em 0.8em',cursor:'pointer',
     maxWidth:'100%',minWidth:0,overflowWrap:'anywhere'}}>
    {control.key} {language==='es'?'glosario':'glossary'}</button>)}
  </div>}
 </section>;
}
