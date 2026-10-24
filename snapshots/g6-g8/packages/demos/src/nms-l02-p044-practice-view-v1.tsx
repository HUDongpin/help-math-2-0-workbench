'use client';
import * as React from 'react';
import {P044Instruction} from './nms-l02-p044-instruction-v1';
import {P044HelpDiagram} from './nms-l02-p044-help-diagram-v1';
import {P044Partition,p044PartsLabel} from './nms-l02-p044-partition-v1';
import {p044Question,type P044Practice} from './nms-l02-p044-practice-v1';
export interface P044PracticeViewProps {
  state:P044Practice;language?:'en'|'es';interactive?:boolean;
  onParts:(parts:number)=>void;onToggle:(part:number)=>void;onCheck:()=>void;onNew:()=>void;
  onHelp:(open:boolean)=>void;onCloseFeedback:()=>void;onClickEffect?:()=>void;onModalChange?:(open:boolean)=>void;
}
export const P044_COPY={
  en:{title:'Build the fraction',instruction:'Click the up or down arrows to show the correct number of parts, then select the parts to show the numerator. Check your answer, then choose New Whole for the next fraction.',parts:'Equal parts',up:'Add one part',down:'Remove one part',check:'Check Answer',next:'New Whole',help:'Need More Help',close:'Close',correct:'Yes, you are correct.',wrong:'Divide the whole into the number of parts which is the same as the denominator, and then click the number of parts that is equivalent to the numerator. Try again.',reveal:'Here is the requested fraction.',complete:'All four fractions finished.',helpText:'Count the selected parts: 4 (numerator). Count all the equal parts: 6 (denominator).',question:'Question'},
  es:{title:'Construye la fracción',instruction:'Usa las flechas para dividir el todo en el número correcto de partes; después selecciona las partes que indica el numerador. Comprueba tu respuesta y elige Nuevo todo para la siguiente fracción.',parts:'Partes iguales',up:'Añadir una parte',down:'Quitar una parte',check:'Comprobar respuesta',next:'Nuevo todo',help:'Más ayuda',close:'Cerrar',correct:'Sí, es correcto.',wrong:'Divide el todo en tantas partes como indica el denominador y selecciona tantas partes como indica el numerador. Inténtalo de nuevo.',reveal:'Esta es la fracción indicada.',complete:'Has terminado las cuatro fracciones.',helpText:'Cuenta las partes seleccionadas: 4 (numerador). Cuenta todas las partes iguales: 6 (denominador).',question:'Pregunta'},
}as const;
/** Interaction surface for main361 onwards. Intro demonstration is a separate view. */
export function P044PracticeView(props:P044PracticeViewProps){
  const {state,language='en',interactive=true}=props,c=P044_COPY[language],q=p044Question(state);
  const dialog=React.useRef<HTMLDialogElement>(null),trigger=React.useRef<HTMLElement|null>(null),titleId=React.useId();
  const feedback=state.phase==='wrong-feedback'||state.phase==='correct-feedback',open=state.helpOpen||feedback;
  React.useEffect(()=>{const node=dialog.current;if(open&&node&&!node.open){node.showModal();node.querySelector<HTMLElement>('[data-dialog-heading]')?.focus();}if(!open&&node?.open){node.close();
    const prior=trigger.current;if(prior?.isConnected&&!prior.matches(':disabled'))prior.focus();else node.closest('.p044-practice')?.querySelector<HTMLButtonElement>('[data-p044-primary]:not(:disabled)')?.focus();trigger.current=null;}},[open]);
  const act=(fn:()=>void,click=true)=>{trigger.current=document.activeElement as HTMLElement;fn();if(click)props.onClickEffect?.();};
  // Source help Close28 has no sprite8 down-state effect; feedback Close231/236 do.
  const close=()=>act(()=>state.helpOpen?props.onHelp(false):props.onCloseFeedback(),!state.helpOpen);
  if(state.phase==='intro')return null;
  const enabled=interactive&&state.phase==='ready'&&!state.helpOpen;
  return <section className="p044-practice" lang={language} data-p044-phase={state.phase}>
    <h2>{c.title}</h2><P044Instruction text={c.instruction} language={language} enabled={interactive&&!open} onModalChange={props.onModalChange}/><p>{c.question} {state.questionIndex+1} / 4</p>
    <p className="p044-practice__target" aria-label={`${q.numerator}/${q.denominator}`}>{q.numerator}/{q.denominator}</p>
    <div className="p044-practice__controls" role="group" aria-label={c.parts}>
      <button type="button" disabled={!enabled} onClick={()=>act(()=>props.onParts(Math.max(1,state.parts-1)))}>{c.down}</button>
      <output>{p044PartsLabel(state.parts,language)}</output>
      <button type="button" disabled={!enabled} onClick={()=>act(()=>props.onParts(Math.min(20,state.parts+1)))}>{c.up}</button>
    </div>
    <P044Partition parts={state.parts} selected={state.selected} language={language} disabled={!enabled} onToggle={props.onToggle}/>
    <div className="p044-practice__controls">
      <button type="button" data-p044-primary disabled={!enabled} onClick={()=>act(props.onCheck)}>{c.check}</button>
      <button type="button" data-p044-primary disabled={!interactive||state.phase!=='awaiting-new'||state.helpOpen} onClick={()=>act(props.onNew)}>{c.next}</button>
      <button type="button" disabled={!interactive||!['ready','awaiting-new'].includes(state.phase)||state.helpOpen} onClick={()=>act(()=>props.onHelp(true))}>{c.help}</button>
    </div>
    <p role="status">{state.phase==='answer-reveal'?c.reveal:state.phase==='complete'?c.complete:''}</p>
    <dialog ref={dialog} aria-labelledby={titleId} onCancel={e=>{e.preventDefault();close();}}>
      <h3 id={titleId} data-dialog-heading tabIndex={-1}>{state.helpOpen?c.help:state.phase==='correct-feedback'?c.correct:c.wrong}</h3>
      {state.helpOpen&&<><p>{c.helpText}</p><P044HelpDiagram language={language}/></>}
      <button type="button" onClick={close}>{c.close}</button>
    </dialog>
  </section>;
}
