import * as React from 'react';
import {P046Partition} from './nms-l02-p046-partition-v1';
import {P046HelpDiagram} from './nms-l02-p046-help-diagram-v1';
import {P046Instruction} from './nms-l02-p046-instruction-v1';
import {P046_COPY} from './nms-l02-p046-copy-v1';
import {p046Question,type P046Practice} from './nms-l02-p046-practice-v1';
export interface P046PracticeViewProps{
 state:P046Practice;language?:'en'|'es';interactive?:boolean;
 onModalChange?:(open:boolean)=>void;
 onParts:(parts:number)=>void;onToggle:(part:number)=>void;
 onInput:(field:'numerator'|'denominator',value:string)=>void;
 onDone:()=>void;onCheck:()=>void;onNew:()=>void;onHelp:(open:boolean)=>void;onCloseFeedback:()=>void;
}
/** Source form, help and feedback presentation; playback state is parent-owned. */
export function P046PracticeView({state,language='en',interactive=true,...actions}:P046PracticeViewProps){
 const copy=P046_COPY[language],q=p046Question(state),id=React.useId();
 const dialog=React.useRef<HTMLDialogElement>(null),trigger=React.useRef<HTMLElement|null>(null),primary=React.useRef<HTMLButtonElement>(null),next=React.useRef<HTMLButtonElement>(null),region=React.useRef<HTMLElement>(null);
 const feedback=state.phase==='wrong-feedback'||state.phase==='correct-feedback';
 const open=feedback||state.helpOpen;
 const title=state.helpOpen?copy.help:state.phase==='correct-feedback'?copy.correct:state.attempts<2?copy.wrongFirst:copy.wrongFinal;
 React.useEffect(()=>{const node=dialog.current;if(open&&node&&!node.open){node.showModal();node.querySelector<HTMLElement>('[data-feedback-heading]')?.focus();}
  if(!open&&node?.open){node.close();const prior=trigger.current;if(state.phase==='ready'&&prior?.isConnected&&!prior.matches(':disabled'))prior.focus();else if(next.current&&!next.current.disabled)next.current.focus();else if(primary.current&&!primary.current.disabled)primary.current.focus();else region.current?.focus();trigger.current=null;}},[open]);
 if(state.phase==='intro')return null;
 const editing=interactive&&state.phase==='ready'&&!state.helpOpen;
 const remember=(action:()=>void)=>{trigger.current=document.activeElement as HTMLElement;action();};
 return <section ref={region} tabIndex={-1} className="p046-activity" lang={language} data-p046-practice-phase={state.phase}>
  <h2>{copy.title}</h2><P046Instruction text={copy.instruction} language={language} enabled={interactive&&!open} onModalChange={actions.onModalChange}/><p>{copy.question} {state.questionIndex+1} / 3</p><p>{copy.target} <strong>{q.numerator}/{q.denominator}</strong>.</p>
  <form onSubmit={event=>{event.preventDefault();if(editing)remember(actions.onCheck);}}>
   <div className="p046-chart-and-answer"><P046Partition key={state.replay+":"+state.questionIndex} parts={state.parts} selected={state.selected} language={language} interactive={editing} onToggle={actions.onToggle}/>
    <div className="p046-fraction-fields">
     <label htmlFor={id+'-num'}>{copy.numerator}</label>
     <input id={id+'-num'} type="text" inputMode="numeric" autoComplete="off" spellCheck={false} value={state.numerator} readOnly={!editing} onChange={e=>{if(editing)actions.onInput('numerator',e.currentTarget.value);}}/>
     <span className="p046-fraction-line" aria-hidden="true"/>
     <label htmlFor={id+'-den'}>{copy.denominator}</label>
     <input id={id+'-den'} type="text" inputMode="numeric" autoComplete="off" spellCheck={false} value={state.denominator} readOnly={!editing} onChange={e=>{if(editing)actions.onInput('denominator',e.currentTarget.value);}}/>
    </div>
   </div>
   <div className="p046-actions"><button type="button" disabled={!editing||state.parts===Number.MAX_SAFE_INTEGER} onClick={()=>actions.onParts(state.parts+1)}>↑ {copy.up}</button><button type="button" disabled={!editing||state.parts===1} onClick={()=>actions.onParts(state.parts-1)}>↓ {copy.down}</button><button ref={primary} type="submit" disabled={!editing}>{copy.check}</button>
    <button ref={next} type="button" disabled={!interactive||state.phase!=='awaiting-new'||state.helpOpen} onClick={actions.onNew}>{copy.next}</button>
    <button type="button" disabled={!interactive||!['ready','awaiting-new'].includes(state.phase)||state.helpOpen} onClick={()=>remember(()=>actions.onHelp(true))}>{copy.help}</button>
   <button type="button" disabled={!interactive||!['ready','awaiting-new'].includes(state.phase)||state.helpOpen} onClick={actions.onDone}>{copy.done}</button></div>
  </form>
  <p role="status">{state.phase==='answer-reveal'?(language==='es'?'Esta es la fracción indicada.':'Here is the requested fraction.'):state.phase==='complete'?(state.finishReason==='done'?copy.ended:language==='es'?'Has terminado las tres fracciones.':'All three fractions finished.'):''}</p>
  <dialog ref={dialog} aria-labelledby={id+'-feedback'} onCancel={e=>{e.preventDefault();if(state.helpOpen)actions.onHelp(false);else actions.onCloseFeedback();}}>
   <h3 id={id+'-feedback'} data-feedback-heading tabIndex={-1}>{state.phase==='wrong-feedback'&&state.attempts===1?copy.tryAgain:title}</h3>
   {state.helpOpen&&<><P046Instruction text={copy.helpText} context="definition" language={language} onModalChange={actions.onModalChange}/><P046HelpDiagram language={language}/></>}
   {state.phase==='wrong-feedback'&&state.attempts===1&&<><P046Instruction text={copy.wrongFirst} context="definition" language={language} onModalChange={actions.onModalChange}/><p>7/8 = 14/16</p><p>{copy.tryAgain}</p></>}
   <button type="button" onClick={()=>state.helpOpen?actions.onHelp(false):actions.onCloseFeedback()}>{copy.close}</button>
  </dialog>
 </section>;
}
