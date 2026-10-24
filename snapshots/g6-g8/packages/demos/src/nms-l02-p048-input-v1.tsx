import React from 'react';
import {p048Decimal,type P048State,type P048Event} from './nms-l02-p048-practice-v1';
import {P048HundredGrid} from './nms-l02-p048-grid-v1';
/** Controlled native input surface; source state owns attempts and question selection.
 * Native range gives keyboard/touch input in exact hundredths; Flash hit pixels are not reproduced.
 */
export function P048DecimalInput({state,language='en',interactive=true,onEvent}:{state:P048State;language?:'en'|'es';interactive?:boolean;onEvent:(event:P048Event)=>void}){
 const id=React.useId(),enabled=interactive&&state.phase==='ready'&&!state.helpOpen,es=language==='es';
 const question=state.target===null?'':`${es?'Crea el decimal':'Create the decimal'} ${p048Decimal(state.target)}.`;
 return <section className="p048-input" lang={language} aria-labelledby={`${id}-question`}>
  <h3 id={`${id}-question`}>{question}</h3>
  <P048HundredGrid value={state.value} language={language}/>
  <div className="p048-decimal" aria-live="off"><span className="p048-input-label">{es?'Decimal':'Decimal'}</span><output htmlFor={`${id}-range`}>{p048Decimal(state.value)}</output></div>
  <label htmlFor={`${id}-range`}>{es?'Arrastra el control para colorear los cuadrados.':'Drag the slider to shade the squares.'}</label>
  <input id={`${id}-range`} type="range" min={0} max={100} step={1} value={state.value} disabled={!enabled} aria-valuetext={p048Decimal(state.value)} onChange={e=>onEvent({type:'input',value:Number(e.currentTarget.value)})}/>
  <div className="p048-range-ends" aria-hidden="true"><span>0.00</span><span>1.00</span></div>
  <div className="p048-input-actions">
   <button type="button" disabled={!enabled} onClick={()=>onEvent({type:'submit'})}>{es?'Comprobar respuesta':'Check Answer'}</button>
   <button type="button" disabled={!enabled} onClick={()=>onEvent({type:'reset'})}>{es?'Restablecer':'Reset'}</button>
  </div>
 </section>;
}
