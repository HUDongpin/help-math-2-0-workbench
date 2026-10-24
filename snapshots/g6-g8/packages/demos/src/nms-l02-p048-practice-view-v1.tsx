import React from 'react';
import {P048_COPY} from './nms-l02-p048-copy-v1';
import {P048DecimalInput} from './nms-l02-p048-input-v1';
import {P048GlossaryTerm} from './nms-l02-p048-glossary-v1';
import {P048HundredGrid} from './nms-l02-p048-grid-v1';
import {p048Decimal,type P048State,type P048Event} from './nms-l02-p048-practice-v1';
export function P048PracticeView({state,language='en',interactive=true,onEvent}:{state:P048State;language?:'en'|'es';interactive?:boolean;onEvent:(event:P048Event)=>void}){
 const es=language==='es',id=React.useId(),help=React.useRef<HTMLDialogElement>(null),wrong=React.useRef<HTMLDialogElement>(null),helpButton=React.useRef<HTMLButtonElement>(null),region=React.useRef<HTMLElement>(null),prior=React.useRef(state.phase);
 React.useEffect(()=>{
  const d=help.current;if(!d)return;
  if(state.helpOpen&&!d.open){d.showModal();d.querySelector<HTMLElement>('h3')?.focus();}
  if(!state.helpOpen&&d.open){d.close();helpButton.current?.focus();}
 },[state.helpOpen]);
 React.useEffect(()=>{
  const d=wrong.current;if(!d)return;
  if(state.phase==='wrong-feedback'&&!d.open){d.showModal();d.querySelector<HTMLElement>('h3')?.focus();}
  if(state.phase!=='wrong-feedback'&&d.open)d.close();
  if(prior.current!==state.phase){
   if(state.phase==='ready')region.current?.querySelector<HTMLInputElement>('input[type="range"]')?.focus();
   if(state.phase==='reveal'||state.phase==='complete')region.current?.focus();
  }
  prior.current=state.phase;
 },[state.phase]);
 if(state.phase==='intro')return null;
 const feedback=state.phase==='correct-feedback'?(es?'¡Correcto!':'Correct!'):state.phase==='reveal'?`${es?'La respuesta es':'The answer is'} ${p048Decimal(state.value)}.`:state.phase==='complete'?(es?'Has terminado las tres preguntas.':'All three questions are finished.'):'';
 const headings=es?['Centenas','Decenas','Unidades','Décimas','Centésimas','Milésimas']:['Hundreds','Tens','Ones','Tenths','Hundredths','Thousandths'];
 return <section className="p048-practice" ref={region} tabIndex={-1} lang={language} data-p048-phase={state.phase}>
  <h2>{es?'Pregunta 6':'Question 6'}</h2>
  <p className="p048-practice-instruction">{P048_COPY[language].instructionLines.join(' ')}</p>
  <P048DecimalInput state={state} language={language} interactive={interactive} onEvent={onEvent}/>
  <p role="status">{feedback}</p>
  <button ref={helpButton} type="button" disabled={!interactive||state.phase!=='ready'||state.helpOpen} aria-haspopup="dialog" onClick={()=>onEvent({type:'help',open:true})}>{es?'Más ayuda':'More Help'}</button>
  <dialog ref={help} aria-labelledby={`${id}-help`} onCancel={e=>{e.preventDefault();onEvent({type:'help',open:false});}}>
   <h3 id={`${id}-help`} tabIndex={-1}>{es?'Usa el ':'Use '}<P048GlossaryTerm disabled={!interactive} term="place-value" language={language}/>{es?' para nombrar un ':' to name a '}<P048GlossaryTerm disabled={!interactive} term="decimal" language={language}/>:</h3>
   <div className="p048-place-groups">
    {[0,1].map(group=><section key={group} aria-label={group===0?(es?'Posiciones enteras':'Whole-number places'):(es?'Posiciones decimales':'Decimal places')}>
     <h4>{group===0?(es?'Posiciones enteras':'Whole-number places'):(es?'Posiciones decimales':'Decimal places')}</h4>
     <div className="p048-place-values">{headings.slice(group*3,group*3+3).map((label,j)=>{const i=group*3+j;return <div key={label} className={i<3?'p048-whole-column':'p048-decimal-column'}><strong>{label}</strong><span>{i===2?'0':i===3?'2':i===4?'3':''}</span></div>;})}</div>
    </section>)}
   </div>
   <p>{es?'Punto decimal':'Decimal point'}: <strong>0 . 2 3</strong></p>
   <P048HundredGrid value={23} language={language} byColumn tone="red"/>
   <p>{es?'Cuenta las ':'Count the '}<P048GlossaryTerm disabled={!interactive} term="tenth" language={language}>{es?'décimas':'tenths'}</P048GlossaryTerm> = 2</p>
   <p>{es?'Cuenta las ':'Count the '}<P048GlossaryTerm disabled={!interactive} term="hundredth" language={language}>{es?'centésimas':'hundredths'}</P048GlossaryTerm> = 3</p>
   <button type="button" onClick={()=>onEvent({type:'help',open:false})}>{es?'Cerrar':'Close'}</button>
  </dialog>
  <dialog ref={wrong} aria-labelledby={`${id}-wrong`} onCancel={e=>{e.preventDefault();onEvent({type:'close-feedback'});}}>
   <h3 id={`${id}-wrong`} tabIndex={-1}>{state.attempts<2?(es?'Inténtalo de nuevo.':'Try Again.'):(es?'Lo siento.':'Sorry.')}</h3>
   <button type="button" onClick={()=>onEvent({type:'close-feedback'})}>{es?'Cerrar':'Close'}</button>
  </dialog>
 </section>;
}
