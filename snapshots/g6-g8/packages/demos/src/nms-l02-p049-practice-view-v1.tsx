import React from 'react';
import {P049DecimalInput} from './nms-l02-p049-input-v1';
import {P049DecimalGrid} from './nms-l02-p049-grid-v1';
import {P049GlossaryTerm} from './nms-l02-p049-glossary-v1';
import type {P049State,P049Event} from './nms-l02-p049-practice-v1';
export function P049PracticeView({state,frame,language='en',interactive=true,onEvent,onModalChange}:{state:P049State;frame:number;language?:'en'|'es';interactive?:boolean;onEvent:(event:P049Event)=>void;onModalChange?:(open:boolean)=>void}){
 const id=React.useId(),es=language==='es',help=React.useRef<HTMLDialogElement>(null),hint=React.useRef<HTMLDialogElement>(null),helpButton=React.useRef<HTMLButtonElement>(null),region=React.useRef<HTMLElement>(null);
 const hadHint=React.useRef(false),previousQuestion=React.useRef(state.question);
 React.useEffect(()=>{const d=help.current;if(!d)return;if(state.helpOpen&&!d.open){d.showModal();d.querySelector<HTMLElement>('h3')?.focus();}if(!state.helpOpen&&d.open){d.close();helpButton.current?.focus();}},[state.helpOpen]);
 React.useEffect(()=>{const d=hint.current;if(!d)return;if(state.hintOpen&&!d.open){d.showModal();d.querySelector<HTMLElement>('h3')?.focus();}if(!state.hintOpen&&d.open)d.close();
  if((hadHint.current&&!state.hintOpen)||previousQuestion.current!==state.question)region.current?.querySelector<HTMLInputElement>('input')?.focus();hadHint.current=state.hintOpen;previousQuestion.current=state.question;
 },[state.hintOpen,state.question]);
 const termProps={language,disabled:!interactive,onModalChange};
 const headings=es?['Centenas','Decenas','Unidades','Décimas','Centésimas','Milésimas']:['Hundreds','Tens','Ones','Tenths','Hundredths','Thousandths'];
 return <section className="p049-practice" ref={region} lang={language} data-p049-phase={state.phase}>
  <P049DecimalInput {...{state,frame,language,interactive,onEvent}}/>
  <p role="status">{state.phase==='correct-feedback'?(es?'¡Correcto!':'Correct!'):state.phase==='complete'?(es?'Has terminado las tres preguntas.':'All three questions are finished.'):''}</p>
  <button ref={helpButton} type="button" disabled={!interactive||state.phase!=='ready'||state.helpOpen} aria-haspopup="dialog" onClick={()=>onEvent({type:'help',open:true})}>{es?'Más ayuda':'More Help'}</button>
  <dialog ref={help} aria-labelledby={`${id}-help`} onCancel={e=>{e.preventDefault();onEvent({type:'help',open:false});}}>
   <h3 id={`${id}-help`} tabIndex={-1}>{es?'Usa el ':'Use '}<P049GlossaryTerm {...termProps} term="place-value"/>{es?' para nombrar un ':' to name a '}<P049GlossaryTerm {...termProps} term="decimal"/>:</h3>
   {[0,1].map(group=><section key={group} className="p049-place-group"><h4>{group===0?(es?'Posiciones enteras':'Whole-number places'):(es?'Posiciones decimales':'Decimal places')}</h4>
    <div className="p049-place-values">{headings.slice(group*3,group*3+3).map((label,j)=>{const i=group*3+j;return <div key={label}><strong>{label}</strong><span>{i===2?'0':i===3?'2':i===4?'3':''}</span></div>;})}</div>
   </section>)}
   <p>{es?'Punto decimal':'Decimal point'}: <strong>0 . 2 3</strong></p>
   <P049DecimalGrid parts={23} total={100} language={language}/>
   <p>{es?'Cuenta las ':'Count the '}<P049GlossaryTerm {...termProps} term="tenth">{es?'décimas':'tenths'}</P049GlossaryTerm> = 2</p>
   <p>{es?'Cuenta las ':'Count the '}<P049GlossaryTerm {...termProps} term="hundredth">{es?'centésimas':'hundredths'}</P049GlossaryTerm> = 3</p>
   <button type="button" onClick={()=>onEvent({type:'help',open:false})}>{es?'Cerrar':'Close'}</button>
  </dialog>
  <dialog ref={hint} aria-labelledby={`${id}-hint`} onCancel={e=>{e.preventDefault();onEvent({type:'close-hint'});}}>
   <h3 id={`${id}-hint`} tabIndex={-1}>{es?'Ayuda con decimales':'Decimal help'}</h3>
   <p>{es?'Un ':'A '}<P049GlossaryTerm {...termProps} term="decimal"/>{es?' es una ':' is a special '}<P049GlossaryTerm {...termProps} term="fraction"/>{es?' especial que tiene 10 o una ':' that has either 10 or a '}<P049GlossaryTerm {...termProps} term="power"/>{es?' de 10 partes iguales en el ':' of 10 equal parts in the '}<P049GlossaryTerm {...termProps} term="whole"/>.</p>
   <P049DecimalGrid parts={14} total={100} language={language}/>
   <p className="p049-equivalence"><span>0.14 {es?'o':'or'}</span><span className="p049-fraction" role="img" aria-label={es?'catorce centésimos':'fourteen hundredths'}><span aria-hidden="true">14</span><span aria-hidden="true">100</span></span></p>
   <p><P049GlossaryTerm {...termProps} term="equivalent"/></p>
   <button type="button" onClick={()=>onEvent({type:'close-hint'})}>{es?'Cerrar':'Close'}</button>
  </dialog>
 </section>;
}
