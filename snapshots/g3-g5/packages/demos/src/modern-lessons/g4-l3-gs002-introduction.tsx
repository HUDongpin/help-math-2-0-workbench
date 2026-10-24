import React from 'react';
import source from './generated/g4-l3-gs002-introduction.json';
import {Gs002SourceText,type Gs002OpenTerm} from './g4-l3-gs002-copy';

export const GS002_INTRODUCTION=source;

export function getGs002Introduction(frame:number,reducedMotion=false){
  const index=Number.isFinite(frame)?Math.max(1,Math.min(427,Math.trunc(frame))):1;
  const state=source.frames[index-1];
  const emphasis=reducedMotion?source.emphasisWindows.find(w=>w.firstFrame<=index&&index<w.lastFrameExclusive)?.term??null:state.emphasis;
  return {...state,emphasis};
}

/** Source-frame copy layer; no clock, no substitute for the remaining animated diagram. */
export function Gs002IntroductionText({frame,reducedMotion=false,onKeyTerm,showSymbols=true}:{
  frame:number;reducedMotion?:boolean;onKeyTerm?:Gs002OpenTerm;showSymbols?:boolean;
}){
  const s=getGs002Introduction(frame,reducedMotion);
  return <section lang="en" data-gs002-intro-text={s.frame} style={{display:'grid',gap:'1rem',minWidth:0,
    fontFamily:'var(--lesson-font-body,"Nunito Sans",system-ui,sans-serif)',color:'#172033'}}>
    {s.instructionPresent&&s.instructionAlpha>0?<p data-source-text="character-98" data-lesson-text-block="intro-instruction"
      style={{margin:0,fontSize:'1.25rem',lineHeight:1.6,overflowWrap:'anywhere',opacity:s.instructionAlpha}}>
      {source.texts[98].text.split(/(positive sign|negative sign)/g).map((part,index)=>
        <span key={index} data-gs002-source-emphasis={part===s.emphasis?part:undefined}
          style={part===s.emphasis?{background:'#f5e7ff',boxShadow:'inset 0 -.15em #70278f'}:undefined}>
          <Gs002SourceText text={part} onKeyTerm={onKeyTerm}/>
        </span>)}
    </p>:null}
    {showSymbols&&s.symbols.length?<div data-gs002-intro-symbols="true" style={{display:'flex',flexWrap:'wrap',gap:'1rem',alignItems:'baseline',
      fontSize:'2rem',lineHeight:1.4,fontWeight:700,fontVariantNumeric:'tabular-nums'}}>
      {s.symbols.map(symbol=><span key={symbol.depth} data-source-text={`character-${symbol.characterId}`}
        data-lesson-text-block={`intro-symbol-${symbol.characterId}`} style={{opacity:symbol.alpha}}>{symbol.text}</span>)}
    </div>:null}
  </section>;
}
