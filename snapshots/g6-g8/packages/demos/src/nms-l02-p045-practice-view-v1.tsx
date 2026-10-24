import * as React from 'react';
import {P045Chart,type P045ChartNumerator} from './nms-l02-p045-chart-v1';
import {P045HelpDiagram} from './nms-l02-p045-help-diagram-v1';
import {P045Instruction} from './nms-l02-p045-instruction-v1';
import {P045_COPY} from './nms-l02-p045-copy-v1';
import {p045Question,type P045Practice} from './nms-l02-p045-practice-v1';
export interface P045PracticeViewProps{
 state:P045Practice;language?:'en'|'es';interactive?:boolean;
 onModalChange?:(open:boolean)=>void;
 onInput:(field:'numerator'|'denominator',value:string)=>void;
 onCheck:()=>void;onNew:()=>void;onHelp:(open:boolean)=>void;onCloseFeedback:()=>void;
}
/** Source form, help and feedback presentation; playback state is parent-owned. */
export function P045PracticeView({state,language='en',interactive=true,...actions}:P045PracticeViewProps){
 const copy=P045_COPY[language],q=p045Question(state),id=React.useId();
 const dialog=React.useRef<HTMLDialogElement>(null),trigger=React.useRef<HTMLElement|null>(null),primary=React.useRef<HTMLButtonElement>(null),next=React.useRef<HTMLButtonElement>(null),region=React.useRef<HTMLElement>(null);
 const feedback=state.phase==='wrong-feedback'||state.phase==='correct-feedback';
 const open=feedback||state.helpOpen;
 const title=state.helpOpen?copy.help:state.phase==='correct-feedback'?copy.correct:state.attempts<2?copy.wrongFirst:copy.wrongFinal;
 React.useEffect(()=>{const node=dialog.current;if(open&&node&&!node.open){node.showModal();node.querySelector<HTMLElement>('[data-feedback-heading]')?.focus();}
  if(!open&&node?.open){node.close();const prior=trigger.current;if(state.phase==='ready'&&prior?.isConnected&&!prior.matches(':disabled'))prior.focus();else if(next.current&&!next.current.disabled)next.current.focus();else if(primary.current&&!primary.current.disabled)primary.current.focus();else region.current?.focus();trigger.current=null;}},[open]);
 if(state.phase==='intro')return null;
 const editing=interactive&&state.phase==='ready'&&!state.helpOpen;
 const remember=(action:()=>void)=>{trigger.current=document.activeElement as HTMLElement;action();};
 return <section ref={region} tabIndex={-1} className="p045-activity" lang={language} data-p045-practice-phase={state.phase}>
  <h2>{copy.title}</h2><P045Instruction text={copy.instruction} language={language} enabled={interactive&&!open} onModalChange={actions.onModalChange}/><p>{copy.question} {state.questionIndex+1} / 3</p>
  <form onSubmit={event=>{event.preventDefault();if(editing)remember(actions.onCheck);}}>
   <div className="p045-chart-and-answer"><P045Chart numerator={Number(q.numerator) as P045ChartNumerator} language={language}/>
    <div className="p045-fraction-fields">
     <label htmlFor={id+'-num'}>{copy.numerator}</label>
     <input id={id+'-num'} type="text" inputMode="numeric" autoComplete="off" spellCheck={false} value={state.numerator} readOnly={!editing} onChange={e=>{if(editing)actions.onInput('numerator',e.currentTarget.value);}}/>
     <span className="p045-fraction-line" aria-hidden="true"/>
     <label htmlFor={id+'-den'}>{copy.denominator}</label>
     <input id={id+'-den'} type="text" inputMode="numeric" autoComplete="off" spellCheck={false} value={state.denominator} readOnly={!editing} onChange={e=>{if(editing)actions.onInput('denominator',e.currentTarget.value);}}/>
    </div>
   </div>
   <div className="p045-actions"><button ref={primary} type="submit" disabled={!editing}>{copy.check}</button>
    <button ref={next} type="button" disabled={!interactive||state.phase!=='awaiting-new'||state.helpOpen} onClick={actions.onNew}>{copy.next}</button>
    <button type="button" disabled={!interactive||!['ready','awaiting-new'].includes(state.phase)||state.helpOpen} onClick={()=>remember(()=>actions.onHelp(true))}>{copy.help}</button></div>
  </form>
  <p role="status">{state.phase==='answer-reveal'?(language==='es'?'Esta es la fracción indicada.':'Here is the requested fraction.'):state.phase==='complete'?(language==='es'?'Has terminado las tres fracciones.':'All three fractions finished.'):''}</p>
  <dialog ref={dialog} aria-labelledby={id+'-feedback'} onCancel={e=>{e.preventDefault();if(state.helpOpen)actions.onHelp(false);else actions.onCloseFeedback();}}>
   <h3 id={id+'-feedback'} data-feedback-heading tabIndex={-1}>{title}</h3>
   {state.helpOpen&&<><p>{copy.helpText}</p><P045HelpDiagram language={language}/></>}
   <button type="button" onClick={()=>state.helpOpen?actions.onHelp(false):actions.onCloseFeedback()}>{copy.close}</button>
  </dialog>
 </section>;
}
