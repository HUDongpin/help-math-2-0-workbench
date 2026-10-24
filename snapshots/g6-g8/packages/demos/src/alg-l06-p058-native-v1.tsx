import React,{useEffect,useRef} from 'react';
import {p058SourceState} from './alg-l06-p058-source-v1';
import {P058_BEHAVIOR_SOURCE as B,type P058State,type P058Choice} from './alg-l06-p058-state-v1';
const button:React.CSSProperties={font:'inherit',minHeight:44,padding:'.55em .75em',color:'#203a60',background:'#f3f7fc',border:'1px solid #8b9dbb',borderRadius:'.35em',textAlign:'left',maxWidth:'100%',overflowWrap:'anywhere'};
const card:React.CSSProperties={border:'1px solid #9aaec8',borderRadius:'.4em',padding:'.75em',display:'grid',gap:'.4em',minWidth:0};
function SourceGraph({graph:g}: {graph:NonNullable<ReturnType<typeof p058SourceState>['graph']>}){
 const [left,top,width,height]=g.viewBox;
 return <figure lang="en" data-p058-native-graph data-source-shape-id={g.shapeId} style={{margin:0,width:'100%',maxWidth:'34rem',minWidth:0}}>
  <figcaption style={{marginBottom:'.5em'}}>Signal strength (s) over time (t)</figcaption>
  <div style={{display:'grid',gridTemplateColumns:'3.8em minmax(0,1fr)',paddingRight:'.75em',paddingTop:'.5em'}}>
   <div style={{position:'relative'}}>{g.yLabels.map(l=><span key={l.id} data-source-text-id={l.id} style={{position:'absolute',right:'.5em',top:`${(l.sourceY-top)/height*100}%`,transform:'translateY(-50%)',whiteSpace:'nowrap'}}>{l.text}</span>)}</div>
   <svg role="img" aria-label="Cell phone signal strength over 24 hours" viewBox={g.viewBox.join(' ')} style={{display:'block',width:'100%',height:'auto',overflow:'visible',background:'white'}}>
    {g.sourceGridPaths.map((d,i)=><path key={i} d={d} fill="none" stroke="#dc765e" strokeWidth=".7" vectorEffect="non-scaling-stroke"/>)}
    <path d={`M ${left} ${top} L ${left} ${top+height} ${left+width} ${top+height}`} fill="none" stroke="#203a60" strokeWidth="1.5" vectorEffect="non-scaling-stroke"/>
    <path data-p058-source-curve d={g.sourceCurvePath} fill="none" stroke="#172b48" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
   </svg>
   <span/>
   <div style={{position:'relative',height:'1.75em',marginTop:'.25em'}}>{g.xLabels.map(l=><span key={l.id} data-source-text-id={l.id} style={{position:'absolute',left:`${(l.sourceX-left)/width*100}%`,transform:'translateX(-50%)',whiteSpace:'nowrap'}}>{l.text}</span>)}</div>
  </div>
  <p style={{margin:0,textAlign:'center'}} data-source-text-id="158">t (hours)</p>
 </figure>;
}
export function P058NativeV1({state,language='en',disabled=false,onChoose,onStep,onContinue,onCloseBox,onOpenHelp,onCloseHelp,onGlossary}:{
 state:P058State;language?:'en'|'es';disabled?:boolean;onChoose:(choice:P058Choice)=>void;
 onStep:()=>void;onContinue:()=>void;onCloseBox:()=>void;onOpenHelp:()=>void;onCloseHelp:()=>void;
 onGlossary?:(buttonId:number,owner:number,key:string,trigger:HTMLButtonElement)=>void;
}){
 const s=p058SourceState(state),en=language==='en',step=B.steps.findIndex(x=>x.frame===state.mainFrame);
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
  <button ref={stepTrigger} type="button" data-p058-step={index+1} disabled={controlsDisabled||!!state.stepBox?.playing} style={button} onClick={onStep}>
   {index<2?(en?'Continue':'Continuar'):(en?`Show step ${index+1}`:`Mostrar paso ${index+1}`)}
  </button>
  {index>=2&&<button type="button" data-p058-continue disabled={controlsDisabled||!!state.stepBox?.playing} style={button} onClick={onContinue}>{en?'Continue':'Continuar'}</button>}
 </div>;
 return <section data-p058-native data-source-sha256={s.sourceSha256} style={{display:'grid',gap:'.75em',padding:'.75em',fontSize:'1rem',lineHeight:1.5,color:'#203a60',minWidth:0,boxSizing:'border-box',overflowWrap:'anywhere'}}>
  {s.question&&<h2 lang="en" data-source-text-id="17" style={{fontSize:'1.15em',margin:0}}>{s.question.text}</h2>}
  {s.graph&&<SourceGraph graph={s.graph}/>}
  <div role="group" aria-label={en?'Answer choices':'Opciones de respuesta'} style={{display:'flex',flexWrap:'wrap',gap:'.5em'}}>
   {s.options.map(o=><button type="button" style={button} key={o.letter} data-p058-choice={o.letter} data-source-button-id={o.buttonId} data-source-text-id={o.textId}
    disabled={controlsDisabled||!state.quizButtonsEnabled||state.phase!=='quiz-held'} onClick={()=>onChoose(o.letter)}>{o.letter}. {o.value}</button>)}
  </div>
  <div style={{display:'grid',gap:'.75em'}}>
   <div style={card} data-p058-reading-step="1"><h3 style={{fontSize:'1em',margin:0}}>{en?'Step 1':'Paso 1'}</h3>{lines(s.step1)}{stepButton(0)}</div>
   <div style={card} data-p058-reading-step="2"><h3 style={{fontSize:'1em',margin:0}}>{en?'Step 2':'Paso 2'}</h3>{lines(s.step2)}{stepButton(1)}</div>
   <div style={card} data-p058-reading-step="3"><h3 style={{fontSize:'1em',margin:0}}>{en?'Step 3':'Paso 3'}</h3>{lines(s.stages)}{stepButton(2)}</div>
   <div style={card} data-p058-reading-step="4"><h3 style={{fontSize:'1em',margin:0}}>{en?'Step 4':'Paso 4'}</h3>{lines(s.check)}{stepButton(3)}</div>
  </div>
  {state.stepBox?.frame===15&&!state.stepBox.playing&&<button type="button" data-p058-close-box style={button} disabled={controlsDisabled} onClick={onCloseBox}>{en?'Close':'Cerrar'}</button>}
  {state.mainFrame===934&&<button type="button" ref={helpTrigger} data-p058-help style={button} disabled={controlsDisabled||!state.nmhButtonEnabled||state.phase!=='quiz-held'} onClick={onOpenHelp}>{en?'Need More Help':'Más ayuda'}</button>}
  {s.help&&<section data-p058-help-panel aria-label={en?'Function help':'Ayuda de funciones'} style={card}>
   {lines(s.help)}<button type="button" data-p058-close-help disabled={controlsDisabled} style={button} onClick={onCloseHelp}>{en?'Close':'Cerrar'}</button>
  </section>}
  {state.feedback&&<p role="status" data-p058-feedback={state.feedback.spriteId}>{state.feedback.kind==='right'?(en?'Correct.':'Correcto.'):(en?'Try again.':'Inténtalo de nuevo.')}</p>}
  <div style={{display:'flex',flexWrap:'wrap',gap:'.5em'}}>{s.glossary.map(g=><button key={`${g.ownerSpriteId}-${g.buttonId}`} type="button" style={button} data-p058-glossary={g.key} data-source-glossary-id={g.buttonId} data-source-owner={g.ownerSpriteId}
   disabled={controlsDisabled||!onGlossary||state.phase==='feedback-playing'||state.phase==='host-selection-pending'} onClick={e=>onGlossary?.(g.buttonId,g.ownerSpriteId,g.key,e.currentTarget)}>{g.key}</button>)}</div>
 </section>;
}
