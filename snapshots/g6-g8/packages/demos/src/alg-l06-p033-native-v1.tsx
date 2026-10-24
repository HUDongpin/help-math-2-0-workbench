import React from 'react';
import {p033SourceState} from './alg-l06-p033-source-v1';
import {P033_BEHAVIOR_SOURCE,type P033State} from './alg-l06-p033-state-v1';
const button:React.CSSProperties={font:'inherit',minHeight:44,padding:'.55em .75em',color:'#203a60',background:'#f3f7fc',border:'1px solid #8b9dbb',borderRadius:'.35em',textAlign:'left',maxWidth:'100%',overflowWrap:'anywhere'};
export function P033NativeV1({state,language='en',reducedMotion=false,onChoose,onClose,onGlossary,disabled=false}:{
 state:P033State;language?:'en'|'es';reducedMotion?:boolean;disabled?:boolean;
 onChoose?:(answer:1|2|3|4)=>void;onClose?:(generation:number)=>void;
 onGlossary?:(key:string,trigger:HTMLButtonElement)=>void;
}){
 const s=p033SourceState(state.mainFrame,reducedMotion),en=language==='en',f=state.feedback;
 const branch=P033_BEHAVIOR_SOURCE.binding.branches.find(b=>b.spriteId===f?.spriteId);
 const close=f?.kind==='wrong'&&branch?.kind==='wrong'&&!f.closeRequested&&f.frame>=branch.closePlacementFirst&&f.frame<=branch.hold;
 return <section data-p033-native data-p033-frame={state.mainFrame} data-source-sha256={s.sourceSha256}
  aria-label={en?'Testing ordered pairs':'Comprobar pares ordenados'}
  style={{display:'grid',gap:'.65em',fontSize:'1rem',lineHeight:1.5,padding:'.75em',minWidth:0,maxWidth:'100%',boxSizing:'border-box',overflowWrap:'anywhere',color:'#203a60'}}>
  <p lang="en" data-source-text-id="5" style={{margin:0,fontWeight:600}}>{s.question}</p>
  <div role="group" aria-label={en?'Answer choices':'Opciones de respuesta'} style={{display:'grid',gap:'.5em'}}>
   {s.options.map(a=><div key={a.letter} lang="en" data-source-choice={a.letter} data-source-text-id={a.textId}>
    {state.mainFrame===52&&onChoose?<button type="button" style={button} data-source-button-id={a.buttonId}
     disabled={disabled||!state.quizButtonsEnabled||state.phase!=='quiz-held'} onClick={()=>onChoose(a.answer as 1|2|3|4)}>{a.letter}. {a.text}</button>:
     <span>{a.letter}. {a.letter==='A'&&s.emphasizedPair!==null?<>{'{'}{a.text.slice(1,-1).split(/, (?=\()/).map((pair,i)=><React.Fragment key={i}>
      {i>0?', ':''}<span data-p033-pair={i} style={i===s.emphasizedPair?{outline:'2px solid #b23b27',outlineOffset:2,fontWeight:700}:undefined}>{pair}</span>
     </React.Fragment>)}{'}'}</>:a.text}</span>}
   </div>)}
  </div>
  {s.explanation.length>0&&<p lang="en" data-source-text-group="178,184" style={{margin:0}}>{s.explanation.map(r=><span key={r.textId} data-source-text-id={r.textId}>{r.text}</span>)}</p>}
  {f&&<div data-p033-feedback={f.spriteId} role="status">
   {f.kind==='wrong'&&close&&<p lang="en">{state.wrongFeedText}</p>}
   {f.kind==='right'&&<p>{en?'Correct.':'Correcto.'}</p>}
   {close&&onClose&&<button type="button" style={button} data-p033-close disabled={disabled} onClick={()=>onClose(f.generation)}>{en?'Close':'Cerrar'}</button>}
  </div>}
  {s.glossary.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:'.5em'}}>{s.glossary.map(g=><button key={g.buttonId} type="button" style={button} data-source-glossary-id={g.buttonId} disabled={disabled||!onGlossary} onClick={e=>onGlossary?.(g.key,e.currentTarget)}>{g.key}</button>)}</div>}
 </section>;
}
