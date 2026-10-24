import React from 'react';
import bindings from '../../../migrations/shared-alg001-l06-p049/native-v1/native-bindings-v3.json';
import type {P049Choice,P049Event,P049State} from './alg-l06-p049-state-v1';
export interface P049NativeProps {state:P049State;language?:'en'|'es';reducedMotion?:boolean;onEvent?:(event:P049Event,trigger?:HTMLButtonElement)=>void;}
const buttonStyle:React.CSSProperties={font:'inherit',color:'inherit',minHeight:44,padding:'.55em .8em',border:'1px solid #8b9dbb',borderRadius:'.35em',background:'#f3f7fc',textAlign:'left',overflowWrap:'anywhere',maxWidth:'100%'};
const visible=(ranges:readonly (readonly number[])[],frame:number)=>ranges.some(([a,b])=>frame>=a!&&frame<=b!);
export function p049VisibleGlossary(state:P049State){return bindings.glossary.filter(row=>row.ownerSpriteId===138?state.phase==='nmh-popup'&&state.nmhPopupVisible:['prequiz','quiz-held','postquiz'].includes(state.phase)&&state.mainFrame>=row.firstFrame&&state.mainFrame<=row.lastFrame);}
export function P049NativeV1({state,language='en',reducedMotion=false,onEvent}:P049NativeProps){
 const en=language==='en',frame=state.mainFrame;
 const send=(type:string,fields:Partial<P049Event>={},trigger?:HTMLButtonElement)=>onEvent?.({type,epoch:state.epoch,quizGeneration:state.quizGeneration,...fields},trigger);
 const options=(Object.keys(bindings.options) as P049Choice[]).filter(k=>visible(bindings.options[k].visibleRanges,frame));
 const glossary=p049VisibleGlossary(state);
 const emphasized=(tid:number)=>bindings.pairedValueEmphasis.some(x=>x.targetTextId===tid&&(reducedMotion?frame>=x.visibleRanges[0]![0]!&&frame<=x.visibleRanges.at(-1)![1]!:visible(x.visibleRanges,frame)));
 const emphasisStyle=(on:boolean):React.CSSProperties=>on?{outline:'2px solid #b23b27',outlineOffset:2,fontWeight:700}:{};
 const wrong=state.feedback?.kind==='wrong'&&state.feedback.frame>=15&&['wrong-feedback-playing','wrong-feedback-held'].includes(state.phase);
 return <section data-p049-native-v1="true" data-p049-phase={state.phase} data-p049-frame={frame} data-p049-epoch={state.epoch} data-p049-source-sha256={bindings.sourceSha256}
  aria-label={en?'Miles to yards function question':'Pregunta de función de millas a yardas'}
  style={{display:'grid',gap:'.8em',fontSize:'1rem',lineHeight:1.5,minWidth:0,width:'100%',maxWidth:'100%',boxSizing:'border-box',padding:'.75em',color:'#203a60'}}>
  {visible(bindings.question.visibleRanges,frame)&&<p lang="en" data-source-text-id="143" style={{margin:0}}>{bindings.question.text}</p>}
  {bindings.table.rows.some(row=>row.some(cell=>visible(cell.visibleRanges,frame)))&&<table lang="en" aria-label={bindings.table.description}
   style={{borderCollapse:'collapse',width:'100%',maxWidth:'32rem',fontVariantNumeric:'tabular-nums',tableLayout:'fixed'}}>
   <thead><tr>{bindings.table.headers.map(cell=><th key={cell.textId} scope="col" data-source-text-id={cell.textId} style={{border:'1px solid #7187a5',padding:'.5em',textAlign:'center'}}>{cell.text}</th>)}</tr></thead>
   <tbody>{bindings.table.rows.map((row,i)=><tr key={i}>{row.map(cell=><td key={cell.textId} data-source-text-id={cell.textId} style={{border:'1px solid #7187a5',padding:'.5em',textAlign:'center'}}>
    {visible(cell.visibleRanges,frame)&&<span data-p049-source-value-emphasis={String(emphasized(cell.textId))} style={emphasisStyle(emphasized(cell.textId))}>{cell.text}</span>}
   </td>)}</tr>)}</tbody>
  </table>}
  {options.length>0&&<div role="group" aria-label={en?'Answer choices':'Opciones de respuesta'} style={{display:'grid',gap:'.5em',minWidth:0}}>{options.map(letter=>{
   const row=bindings.options[letter];return <button key={letter} type="button" lang="en" style={buttonStyle} data-source-choice={letter} data-source-instance={row.instance} data-source-text-id={row.textId} data-source-button-id={row.buttonId}
    disabled={!onEvent||!state.quizButtonsEnabled} onClick={e=>send('choose',{choice:letter},e.currentTarget)}>{letter}. {row.text}</button>;
  })}</div>}
  {bindings.explanation.filter(x=>visible(x.visibleRanges,frame)).map(row=><p lang="en" key={row.textId} data-source-text-id={row.textId} style={{margin:0,fontWeight:600}}>
   {row.textId===325?<><span>Y = </span><span data-p049-source-value-emphasis={String(emphasized(325))} style={emphasisStyle(emphasized(325))}>8,800</span></>:row.text}
  </p>)}
  {state.phase==='quiz-held'&&<button type="button" style={buttonStyle} data-p049-help-open disabled={!onEvent||!state.nmhButtonEnabled} onClick={e=>send('open-nmh',{},e.currentTarget)}>{en?'Need More Help':'Necesito más ayuda'}</button>}
  {state.nmhPopupVisible&&<div role="region" aria-label={en?'Need More Help':'Necesito más ayuda'} data-p049-help style={{padding:'.8em',border:'1px solid #8b9dbb',display:'grid',gap:'.6em'}}>
   {bindings.helpText.map(row=><p key={row.textId} lang="en" data-source-text-id={row.textId} style={{margin:0}}>{row.text}</p>)}
   {glossary.filter(x=>x.ownerSpriteId===138).map(x=><button key={x.buttonId} type="button" style={buttonStyle} data-source-glossary-id={x.buttonId} disabled={!onEvent||state.phase!=='nmh-popup'} onClick={e=>send('glossary',{buttonId:x.buttonId},e.currentTarget)}>{x.term}</button>)}
   <button type="button" style={buttonStyle} data-p049-help-close disabled={!onEvent||state.phase!=='nmh-popup'} onClick={e=>send('close-nmh',{},e.currentTarget)}>{en?'Close':'Cerrar'}</button>
  </div>}
  <div aria-live="polite" aria-atomic="true">
   {wrong&&<div data-p049-wrong-popup style={{padding:'.8em',border:'2px solid #a74724'}}><p lang="en" style={{marginTop:0}}>{state.wrongFeedText}</p>
    <button type="button" style={buttonStyle} data-p049-wrong-close disabled={!onEvent||state.phase!=='wrong-feedback-held'} onClick={e=>send('close-wrong',{token:state.feedback!.token},e.currentTarget)}>{en?'Close':'Cerrar'}</button>
   </div>}
   {state.phase==='right-feedback-playing'&&<p lang="en" data-source-text-id="186">Great Job!</p>}
  </div>
  {glossary.some(x=>x.ownerSpriteId===327)&&<div style={{display:'flex',flexWrap:'wrap',gap:'.5em'}}>{glossary.filter(x=>x.ownerSpriteId===327).map(x=><button key={x.buttonId} type="button" style={buttonStyle} data-source-glossary-id={x.buttonId} disabled={!onEvent} onClick={e=>send('glossary',{buttonId:x.buttonId},e.currentTarget)}>{x.term}</button>)}</div>}
 </section>;
}
