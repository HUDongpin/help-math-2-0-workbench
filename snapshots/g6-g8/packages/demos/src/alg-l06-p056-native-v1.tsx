import React,{useEffect,useRef} from 'react';
import {p056SourceState} from './alg-l06-p056-source-v1';
import {P056_BEHAVIOR_SOURCE as B,type P056State,type P056Choice} from './alg-l06-p056-state-v1';
const button:React.CSSProperties={font:'inherit',minHeight:44,padding:'.55em .75em',color:'#203a60',background:'#f3f7fc',border:'1px solid #8b9dbb',borderRadius:'.35em',textAlign:'left',maxWidth:'100%',overflowWrap:'anywhere'};
const card:React.CSSProperties={border:'1px solid #9aaec8',borderRadius:'.4em',padding:'.75em',display:'grid',gap:'.4em',minWidth:0};
export function P056NativeV1({state,language='en',disabled=false,onChoose,onStep,onContinue,onCloseBox,onOpenHelp,onCloseHelp,onGlossary}:{
 state:P056State;language?:'en'|'es';disabled?:boolean;onChoose:(choice:P056Choice)=>void;
 onStep:()=>void;onContinue:()=>void;onCloseBox:()=>void;onOpenHelp:()=>void;onCloseHelp:()=>void;
 onGlossary?:(buttonId:number,owner:305|270|288,key:string,trigger:HTMLButtonElement)=>void;
}){
 const s=p056SourceState(state),en=language==='en',step=B.steps.findIndex(x=>x.frame===state.mainFrame);
 const stepTrigger=useRef<HTMLButtonElement>(null),helpTrigger=useRef<HTMLButtonElement>(null);
 const previous=useRef({box:state.stepBox,help:state.helpVisible});
 useEffect(()=>{const p=previous.current;
  if(p.box?.closing&&state.stepBox?.sourceStopped&&state.stepBox.frame===1)stepTrigger.current?.focus();
  if(p.help&&!state.helpVisible)helpTrigger.current?.focus();
  previous.current={box:state.stepBox,help:state.helpVisible};
 },[state.stepBox,state.helpVisible]);
 const controlsDisabled=disabled||!!state.glossaryTerm;
 const lines=(rows:readonly {id:number;text:string}[])=>rows.map(r=><p key={r.id} lang="en" data-source-text-id={r.id} style={{margin:0}}>{r.text}</p>);
 const stepButton=(index:number)=>state.phase==='step-held'&&step===index&&<div style={{display:'flex',flexWrap:'wrap',gap:'.5em'}}>
  <button ref={stepTrigger} type="button" data-p056-step={index+1} disabled={controlsDisabled||!!state.stepBox?.playing} style={button} onClick={onStep}>
   {index<2?(en?'Continue':'Continuar'):(en?`Show step ${index+1}`:`Mostrar paso ${index+1}`)}
  </button>
  {index>=2&&<button type="button" data-p056-continue disabled={controlsDisabled||!!state.stepBox?.playing} style={button} onClick={onContinue}>{en?'Continue':'Continuar'}</button>}
 </div>;
 return <section data-p056-native data-source-sha256={s.sourceSha256} style={{display:'grid',gap:'.75em',padding:'.75em',fontSize:'1rem',lineHeight:1.5,color:'#203a60',minWidth:0,boxSizing:'border-box',overflowWrap:'anywhere'}}>
  {s.question&&<h2 lang="en" data-source-text-id="19" style={{fontSize:'1.15em',margin:0}}>{s.question.text}</h2>}
  <div role="group" aria-label={en?'Answer choices':'Opciones de respuesta'} style={{display:'flex',flexWrap:'wrap',gap:'.5em'}}>
   {s.options.map(o=><button type="button" style={button} key={o.letter} data-p056-choice={o.letter} data-source-button-id={o.buttonId} data-source-text-id={o.textId}
    disabled={controlsDisabled||!state.quizButtonsEnabled||state.phase!=='quiz-held'} onClick={()=>onChoose(o.letter)}>{o.letter}. {o.value}</button>)}
  </div>
  <div style={{display:'grid',gap:'.75em'}}>
   <div style={card} data-p056-reading-step="1"><h3 style={{fontSize:'1em',margin:0}}>{en?'Step 1':'Paso 1'}</h3>{lines(s.step1)}{stepButton(0)}</div>
   <div style={card} data-p056-reading-step="2"><h3 style={{fontSize:'1em',margin:0}}>{en?'Step 2':'Paso 2'}</h3>{lines(s.step2)}{stepButton(1)}</div>
   <div style={card} data-p056-reading-step="3"><h3 style={{fontSize:'1em',margin:0}}>{en?'Step 3':'Paso 3'}</h3>{lines(s.calculation)}{stepButton(2)}</div>
   <div style={card} data-p056-reading-step="4"><h3 style={{fontSize:'1em',margin:0}}>{en?'Step 4':'Paso 4'}</h3>
    {s.table&&<><p lang="en" data-source-text-id="255" style={{margin:0}}>{s.table.intro.text}</p>
     <table lang="en" style={{borderCollapse:'collapse',maxWidth:'100%',width:'16em',textAlign:'center'}}><thead><tr>{s.table.headers.map(h=><th key={h.id} scope="col" style={{border:'1px solid #9aaec8',padding:'.25em'}} data-source-text-id={h.id}>{h.text}</th>)}</tr></thead>
      <tbody>{s.table.rows.map((row,i)=><tr key={i}>{row.map(r=><td key={r.id} style={{border:'1px solid #9aaec8',padding:'.25em'}} data-source-text-id={r.id}>{r.text}</td>)}</tr>)}</tbody></table>{lines(s.table.conclusion)}</>}{stepButton(3)}
   </div>
  </div>
  {state.stepBox?.frame===15&&!state.stepBox.playing&&<button type="button" data-p056-close-box style={button} disabled={controlsDisabled} onClick={onCloseBox}>{en?'Close':'Cerrar'}</button>}
  {state.mainFrame===801&&<button type="button" ref={helpTrigger} data-p056-help style={button} disabled={controlsDisabled||!state.nmhButtonEnabled||state.phase!=='quiz-held'} onClick={onOpenHelp}>{en?'Need More Help':'Más ayuda'}</button>}
  {s.help&&<section data-p056-help-panel aria-label={en?'Function help':'Ayuda de funciones'} style={card}>
   {lines(s.help.paragraphs)}<div data-source-text-id="286" lang="en">{s.help.equations.map((line,i)=><p key={i} style={{margin:0}}>{line}</p>)}</div>
   <button type="button" data-p056-close-help disabled={controlsDisabled} style={button} onClick={onCloseHelp}>{en?'Close':'Cerrar'}</button>
  </section>}
  {state.feedback&&<p role="status" data-p056-feedback={state.feedback.spriteId}>{state.feedback.kind==='right'?(en?'Correct.':'Correcto.'):(en?'Try again.':'Inténtalo de nuevo.')}</p>}
  <div style={{display:'flex',flexWrap:'wrap',gap:'.5em'}}>{s.glossary.map(g=><button key={`${g.ownerSpriteId}-${g.buttonId}`} type="button" style={button} data-p056-glossary={g.key} data-source-glossary-id={g.buttonId} data-source-owner={g.ownerSpriteId}
   disabled={controlsDisabled||!onGlossary||state.phase==='feedback-playing'||state.phase==='host-selection-pending'} onClick={e=>onGlossary?.(g.buttonId,g.ownerSpriteId,g.key,e.currentTarget)}>{g.key}</button>)}</div>
 </section>;
}
