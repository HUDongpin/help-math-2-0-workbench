import * as React from 'react';
import {p044IntroFrame} from './nms-l02-p044-intro-v1';
import {P044Instruction} from './nms-l02-p044-instruction-v1';
import {P044Partition,p044PartsLabel} from './nms-l02-p044-partition-v1';
import {P044_COPY} from './nms-l02-p044-practice-view-v1';
export function p044IntroGuidance(language:'en'|'es'){
  return language==='es'?{increase:'Añade partes iguales.',decrease:'Quita una parte para obtener cuatro.', 'select-part':'Selecciona una de las cuatro partes.',numerator:'El numerador indica cuántas partes se seleccionan.','check-answer':'Comprueba la respuesta.','new-whole':'Comienza con un nuevo todo.',fraction:'Ahora el objetivo es un quinto.'}
    :{increase:'Add equal parts.',decrease:'Remove one part to make four.','select-part':'Select one of the four parts.',numerator:'The numerator tells how many parts are selected.','check-answer':'Check the answer.','new-whole':'Start with a new whole.',fraction:'The next target is one fifth.'};
}
export function P044IntroView({frame,language='en',interactive=true,onModalChange}:{frame:number;language?:'en'|'es';interactive?:boolean;onModalChange?:(open:boolean)=>void}){
  const state=p044IntroFrame(frame),c=P044_COPY[language];if(!state.visible)return null;

  return <section className="p044-practice" lang={language} data-p044-intro-frame={frame}>
    <h2>{c.title}</h2><P044Instruction text={c.instruction} language={language} enabled={interactive} onModalChange={onModalChange}/>
    {state.target&&<p className="p044-practice__target">{state.target.numerator}/{state.target.denominator}</p>}
    <p>{language==='es'?'Observa la demostración.':'Watch the demonstration.'}</p>
    <div className="p044-practice__controls">
      <button type="button" disabled data-emphasis={state.emphasis==='decrease'||undefined}>{c.down}</button>
      <output>{p044PartsLabel(state.parts,language)}</output>
      <button type="button" disabled data-emphasis={state.emphasis==='increase'||undefined}>{c.up}</button>
    </div>
    <P044Partition parts={state.parts} selected={state.selected} language={language} disabled onToggle={()=>{}}/>
    <p className="p044-intro-guidance">{state.emphasis?p044IntroGuidance(language)[state.emphasis]:'\u00a0'}</p>
    <div className="p044-practice__controls">
      <button type="button" disabled data-emphasis={state.emphasis==='check-answer'||undefined}>{c.check}</button>
      <button type="button" disabled data-emphasis={state.emphasis==='new-whole'||undefined}>{c.next}</button>
    </div>
  </section>;
}
