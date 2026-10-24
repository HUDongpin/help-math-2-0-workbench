import React from 'react';
import source from './generated/g4-l3-ti004-question.json';
import {COURSE_G04_L03_TI_004_CARDS as cards} from '../timelines/course-g04-l03-ti-004-least-to-greatest-drag-interaction';
import {Ti004SourceText,type Ti004OpenTerm} from './g4-l3-ti004-keyterms';
export function Ti004Introduction({frame,onKeyTerm}:{frame:number;onKeyTerm?:Ti004OpenTerm}){
 const s=source.frames[Math.max(0,Math.min(123,frame-1))]!;
 return <section lang="en" data-ti004-native-intro={frame} style={{fontFamily:'var(--lesson-font-body,system-ui,sans-serif)',background:'#e9f7ff',borderRadius:12,padding:'1rem',display:'grid',gap:'1rem'}}>
  <p style={{margin:0,fontSize:'var(--ti004-prose-size,1.25rem)',lineHeight:1.6}}><span data-lesson-text-block="question-number">{s.number}</span>{s.number?' ':''}<span data-source-text="161" data-lesson-text-block="instruction-first"><Ti004SourceText text={s.instruction} onKeyTerm={onKeyTerm}/></span><span data-source-text="177" data-lesson-text-block="instruction-ending"><Ti004SourceText text={s.ending} onKeyTerm={onKeyTerm}/></span></p>
  {s.cards?<>
   <div tabIndex={0} role="group" aria-label="Positions from least on the left to greatest on the right. Scroll horizontally to explore." style={{overflowX:'auto',maxWidth:'100%',padding:'.5rem .25rem 1rem'}}>
    <div style={{minWidth:'42rem'}}>
     <div style={{display:'flex',justifyContent:'space-between',fontSize:'1.125rem',lineHeight:1.6}}><strong data-lesson-text-block="least" style={{color:s.emphasis==='least'?'#9d174d':'#111'}}>{s.least}</strong><strong data-lesson-text-block="greatest" style={{color:s.emphasis==='greatest'?'#9d174d':'#111'}}>{s.greatest}</strong></div>
     <div data-ti004-intro-emphasis={s.emphasis??s.line?.sourceShapeId??'none'} style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'.5rem',position:'relative',padding:'.5rem 0'}}>
      {cards.map(c=><span key={c.id} aria-hidden="true" style={{height:'.5rem',borderBottom:'2px solid #224b8e'}}/>)}
      {s.line?<span aria-hidden="true" style={{position:'absolute',left:`${s.line.left}%`,width:`${s.line.width}%`,bottom:'.5rem',borderBottom:'3px solid #b91c1c'}}/>:null}
     </div>
    </div>
   </div>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,4rem),1fr))',gap:'.5rem'}}>{cards.map(c=><span key={c.id} data-ti004-intro-card={c.id} data-lesson-text-block={`card-${c.id}`} style={{border:'2px solid #224b8e',borderRadius:8,padding:'.5rem',textAlign:'center',fontSize:'1.125rem',lineHeight:1.5}}>{c.valueText.replace('-','−')}</span>)}</div>
  </>:null}
 </section>;
}
