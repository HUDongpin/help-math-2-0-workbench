import React from 'react';
import source from './generated/g4-l3-gs002-intro-controls.json';

export const GS002_INTRO_CONTROLS=source;
export function getGs002IntroControls(frame:number,reducedMotion=false){
  const f=Math.max(1,Math.min(426,Number.isFinite(frame)?Math.trunc(frame):1)),s=source.frames[f-1];
  const inside=(range:number[])=>range[0]<=f&&f<range[1];
  return {...s,caretVisible:reducedMotion?inside(source.reducedMotionWindows.caret):s.caret!==null,
    highlightVisible:reducedMotion?inside(source.reducedMotionWindows.newGameHighlight):s.newGameHighlight!==null};
}

/** Read-only authored demonstration; input/Go become functional only in the game controller. */
export function Gs002IntroControls({frame,reducedMotion=false,onNewGame}:{frame:number;reducedMotion?:boolean;onNewGame?:()=>void}){
  const s=getGs002IntroControls(frame,reducedMotion);
  const box=(b:{left:number;right:number;top:number;bottom:number}):React.CSSProperties=>({position:'absolute',
    left:`${(b.left-1000)/5300*100}%`,top:`${(b.top+3300)/4800*100}%`,
    width:`${(b.right-b.left)/5300*100}%`,height:`${(b.bottom-b.top)/4800*100}%`});
  return <figure lang="en" data-gs002-intro-controls={s.frame} style={{margin:0,minWidth:0}}>
    <figcaption style={{fontSize:'1rem',lineHeight:1.6}} data-gs002-copy-authority="modern-current-js">Control demonstration</figcaption>
    <div tabIndex={0} role="group" aria-label={onNewGame?'Control demonstration with New Game button. Scroll horizontally if needed.':'Read-only control demonstration. Scroll horizontally if needed.'}
      style={{overflowX:'auto',maxWidth:'100%',border:'1px solid #8d9bb0',borderRadius:'.5rem'}}>
      <div style={{position:'relative',width:'100%',minWidth:'24rem',aspectRatio:'5300 / 4800',background:'#f7faff'}}>
        <div aria-label="Example signed distance" style={{...box({left:1400,right:4350,top:-1450,bottom:-350}),border:'2px solid #64748b',borderRadius:'.25rem',background:'white'}}/>
        {s.controls.map(c=>{const Tag=c.role==='newGame'&&onNewGame?'button':'span';return <Tag key={c.role}
          type={Tag==='button'?'button':undefined} onClick={Tag==='button'?onNewGame:undefined}
          data-gs002-demo-control={c.role} data-source-text={`character-${c.textId}`}
          data-lesson-text-block={`intro-control-${c.role}`} style={{...box(c.bounds),display:'flex',alignItems:'center',justifyContent:'center',
            border:'2px solid #224b8e',borderRadius:'.35rem',fontSize:'1.125rem',lineHeight:1.3,fontWeight:700,
            background:c.role==='newGame'&&s.highlightVisible?'#fff2a3':'#e5efff',color:'#172033',fontFamily:'inherit',cursor:Tag==='button'?'pointer':undefined}}>{c.text}</Tag>;})}
        {s.symbols.map(n=><span key={n.characterId} data-source-text={`character-${n.characterId}`}
          data-lesson-text-block={`intro-symbol-${n.characterId}`} style={{position:'absolute',left:`${(n.matrix[4]-1000)/5300*100}%`,
            top:`${(n.matrix[5]+3300)/4800*100}%`,fontSize:'1.75rem',lineHeight:1.4,fontWeight:700,paddingLeft:'.35rem'}}>{n.text}</span>)}
        <svg aria-hidden="true" viewBox={source.viewBox.join(' ')} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}>
          {s.caretVisible?<path data-gs002-demo-caret="true" d={source.caretPath} stroke="#172033" strokeWidth={20}/>:null}
          {s.pointer?<path data-gs002-demo-pointer="true" d={source.pointerPath} transform={`matrix(${s.pointer.join(' ')})`} fill="#172033" stroke="white" strokeWidth={20}/>:null}
        </svg>
      </div>
    </div>
  </figure>;
}
