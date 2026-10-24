import React from 'react';
import {P049DecimalGrid} from './nms-l02-p049-grid-v1';
import {p049DisplayedDigits,type P049State,type P049Event} from './nms-l02-p049-practice-v1';
import './nms-l02-p049-view-v1.css';
export function P049DecimalInput({state,frame,language='en',interactive=true,onEvent}:{state:P049State;frame:number;language?:'en'|'es';interactive?:boolean;onEvent:(event:P049Event)=>void}){
 const id=React.useId(),es=language==='es',enabled=interactive&&state.phase==='ready'&&!state.helpOpen&&!state.hintOpen;
 const digits=p049DisplayedDigits(state,frame);
 const names=es?['Décimas','Centésimas']:['Tenths','Hundredths'];
 return <section className="p049-input" lang={language} aria-labelledby={`${id}-instruction`}>
  <h2>{es?'Pregunta 7':'Question 7'}</h2>
  <p id={`${id}-instruction`}>{es?'Nombra el decimal que se muestra. Haz clic en cada casilla y escribe el valor correcto. Después, haz clic en Comprobar respuesta.':'Name the decimal shown. Click each box and type the correct value. Then click Check Answer.'}</p>
  <P049DecimalGrid parts={[8,37,98][state.question]!} total={state.question===0?10:100} language={language}/>
  <div className="p049-entry" role="group" aria-label={es?'Respuesta decimal':'Decimal answer'}>
   <span className="p049-fixed-digit" aria-label={es?'Unidades: cero':'Ones: zero'}>0</span>
   <span className="p049-fixed-digit" aria-label={es?'Punto decimal':'Decimal point'}>.</span>
   {names.map((name,field)=><label key={name} htmlFor={`${id}-${field}`}><span>{name}</span><input id={`${id}-${field}`} type="text" inputMode="numeric" autoComplete="off" spellCheck={false} value={digits[field]} disabled={!enabled}
    onChange={e=>onEvent({type:'input',field:field as 0|1,value:e.currentTarget.value})}
    onKeyDown={e=>{if(enabled&&e.key==='Enter'){e.preventDefault();onEvent({type:'submit'});}}}/></label>)}
  </div>
  <button type="button" disabled={!enabled} onClick={()=>onEvent({type:'submit'})}>{es?'Comprobar respuesta':'Check Answer'}</button>
 </section>;
}
