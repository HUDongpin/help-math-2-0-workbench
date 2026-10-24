'use client';
import * as React from 'react';
import {P040_SOURCE} from './generated/nms-l02-p040-presentation-v1';
import {P040Grid} from './nms-l02-p040-grid-v1';
import {P040Instruction} from './nms-l02-p040-instruction-v1';
import {P040Equation} from './nms-l02-p040-equation-v1';
import {NmsL2P040TermDialog} from './nms-l02-p040-term-dialog-v1';
import type {P040State,P040Term} from './nms-l02-p040-state-v1';
import './nms-l02-p040-presentation-v1.css';
export interface P040PresentationProps {state:P040State;language?:'en'|'es';reducedMotion?:boolean;interactive?:boolean;onTerm:(term:P040Term)=>void;onCloseTerm:()=>void}
/** Controlled teaching surface; its owner supplies transport and source audio. */
export function P040Presentation({state,language='en',reducedMotion=false,interactive=true,onTerm,onCloseTerm}:P040PresentationProps){
 const trigger=React.useRef<HTMLElement|null>(null),term=P040_SOURCE.terms.find(t=>t.id===state.term);
 return <section className="p040-presentation" lang="en" data-p040-frame={state.frame}>
  <p className="p040-presentation__course"><span data-lesson-text-block="course-title">{P040_SOURCE.heading.courseHeading}</span>{' '}<span data-lesson-text-block="activity-title">{P040_SOURCE.heading.activityHeading}</span></p>
  <h2 className="p040-presentation__title">Equivalent Percents, Fractions, Decimal Fractions</h2>
  {language==='es'&&<p className="p040-presentation__language" lang="es">Esta página conserva las instrucciones originales en inglés. Las definiciones están disponibles en español.</p>}
  <P040Instruction frame={state.frame} reducedMotion={reducedMotion} interactive={interactive&&!state.term} onTerm={id=>{trigger.current=document.activeElement as HTMLElement;onTerm(id)}}/>
  <div className="p040-presentation__layout"><figure className="p040-presentation__grid"><P040Grid language={language}/><figcaption data-lesson-text-block="grid-caption">40% of the figure is shaded.</figcaption></figure><div className="p040-presentation__equation"><P040Equation frame={state.frame} language={language} reducedMotion={reducedMotion}/></div></div>
  {term&&<NmsL2P040TermDialog term={term} language={language} trigger={trigger.current} onClose={onCloseTerm}/>}
 </section>;
}
