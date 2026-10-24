import React from 'react';
import {Ti003SourceText,type Ti003OpenTerm} from './g4-l3-ti003-keyterms';
import source from './generated/g4-l3-ti003-intro.json';
import {Ti003NumberLine} from './g4-l3-ti003-number-line';
import {COURSE_G04_L03_TI_003_CARDS as cards,createCourseG04L03Ti003NumberLineDragState} from '../timelines/course-g04-l03-ti-003-number-line-drag-interaction';
const initial = createCourseG04L03Ti003NumberLineDragState();
export function Ti003Introduction({frame,onKeyTerm}: {frame: number;onKeyTerm?:Ti003OpenTerm}) {
  const scene = source.frames[Math.max(0,Math.min(138,Math.floor(frame)-1))]!;
  return <section lang="en" data-ti003-native-intro={scene.frame} style={{fontFamily:'var(--lesson-font-body, system-ui, sans-serif)',fontSize:'1.125rem',lineHeight:1.6,padding:'1rem',background:'#e9f7ff',borderRadius:'.75rem'}}>
    <style>{`[data-ti003-native-intro] > p {font-size:1.125rem;line-height:1.6}@media(min-width:768px){[data-ti003-native-intro] > p {font-size:1.25rem}}`}</style>
    <p style={{minHeight:'3rem',margin:'0 0 1rem'}}><strong data-source-text="18" data-lesson-text-block="question-number">{scene.number}</strong>{scene.number?' ':''}<span data-source-text="20" data-lesson-text-block="instruction-first"><Ti003SourceText text={scene.instruction} onKeyTerm={onKeyTerm}/></span><span data-source-text="50" data-lesson-text-block="instruction-ending"><Ti003SourceText text={scene.ending} onKeyTerm={onKeyTerm}/></span></p>
    {scene.axis && <Ti003NumberLine interaction={initial} disabled preview onChoose={()=>{}}/>}
    {scene.cards && <div aria-label="Number cards" style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:'.5rem',marginTop:'1rem'}}>{cards.map(card=><div key={card.id} data-ti003-intro-card={card.id} data-lesson-text-block={`card-${card.id}`} style={{background:'#fff',border:'2px solid #224b8e',borderRadius:'.5rem',padding:'.5rem',textAlign:'center',fontWeight:800}}>{card.valueText.replace('-','−')}</div>)}</div>}
  </section>;
}
