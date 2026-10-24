import React from 'react';
import {p052ExerciseSemantics,p052ShadeSummary,type P052Language} from './nms-l02-p052-copy-v1';
import type {P052State,P052Event} from './nms-l02-p052-state-v1';

function useModal(ref:React.RefObject<HTMLDialogElement|null>,open:boolean,interactive:boolean,returnRegion?:React.RefObject<HTMLElement|null>){
 React.useEffect(()=>{
  const dialog=ref.current;if(!dialog||!open)return;
  const trigger=document.activeElement instanceof HTMLElement?document.activeElement:null;
  // Static capture initially supplies open for SSR. Promote it to the same
  // native modal layer as playback; disabled actions still cannot advance state.
  if(dialog.open&&!dialog.matches(':modal'))dialog.close();
  if(!dialog.open)dialog.showModal();dialog.querySelector<HTMLElement>('h3')?.focus();
  return()=>{
   dialog.close();
   if(!interactive)return;
   if(trigger?.isConnected&&trigger!==document.body&&trigger!==document.documentElement)trigger.focus({preventScroll:true});
   else if(returnRegion?.current?.isConnected){
    // Done is removed while feedback is open. Resolve the newly mounted control,
    // or the retained question after right-feedback Close enters the outro.
    const target=returnRegion.current.querySelector<HTMLElement>('[data-p052-feedback-return]:not(:disabled)')
     ??returnRegion.current.querySelector<HTMLElement>('[data-p052-question]');
    target?.focus({preventScroll:true});
   }
  };
 },[ref,open,interactive,returnRegion]);
}
export function P052PercentGrid({percent,language,example=false}:{percent:number;language:P052Language;example?:boolean}){
 const label=p052ShadeSummary(percent,language);
 return <svg className="p052-grid" viewBox="0 0 200 200" role="img" aria-label={label} data-p052-grid={example?'example':'answer'}>
  {Array.from({length:100},(_,index)=><rect key={index} x={index%10*20} y={Math.floor(index/10)*20}
   width={20} height={20} fill={index<percent?'#0000ff':'#ffffff'} stroke="#18354b" strokeWidth={1}
   data-p052-shaded={index<percent?'true':'false'}/>)}
 </svg>;
}
/** Controlled exercise view. Parent owns state/audio/clocks; not a registered page renderer. */
export function P052PracticeView({state,language,interactive=true,onEvent}:{
 state:P052State;language:P052Language;interactive?:boolean;onEvent:(event:P052Event)=>void;
}){
 const id=React.useId(),feedback=React.useRef<HTMLDialogElement>(null),help=React.useRef<HTMLDialogElement>(null),glossary=React.useRef<HTMLDialogElement>(null);
 const returnRegion=React.useRef<HTMLElement>(null);
 const semantic=p052ExerciseSemantics(state,language),copy=semantic.copy;
 const feedbackOpen=state.phase==='wrong'||state.phase==='right';
 useModal(feedback,feedbackOpen,interactive,returnRegion);useModal(help,state.help,interactive);useModal(glossary,!!state.glossary,interactive);
 if(state.phase==='intro'&&state.frame!==115)throw Error('P052_PRACTICE_VIEW_REQUIRES_EXERCISE_PHASE');
 const send=(event:P052Event)=>{if(interactive)onEvent(event);};
 const close=(type:'close-feedback'|'close-help'|'close-glossary')=>send({type,epoch:state.epoch});
 const cancel=(type:'close-feedback'|'close-help'|'close-glossary')=>(event:React.SyntheticEvent<HTMLDialogElement>)=>{
  event.preventDefault();event.stopPropagation();if(!state.paused)close(type);
 };
 const resume=state.paused?<button type="button" disabled={!interactive} onClick={()=>send({type:'pause',paused:false,epoch:state.epoch})}>{language==='es'?'Continuar':'Resume'}</button>:null;
 const closeButton=(type:'close-feedback'|'close-help'|'close-glossary')=><button type="button" disabled={!interactive||state.paused} onClick={()=>close(type)}>{copy.close}</button>;
 return <section ref={returnRegion} className="p052-practice" lang={language} data-p052-phase={state.phase}>
  <h2 tabIndex={-1} data-p052-question data-p052-source-text="158">{copy.question}</h2>
  <p id={`${id}-prompt`} data-p052-source-text="157 159">{copy.prompt}</p>
  <div className="p052-exercise-layout">
   <figure><P052PercentGrid percent={state.percent} language={language}/><figcaption aria-live="polite" aria-atomic="true">{semantic.summary}</figcaption></figure>
   <div className="p052-answer-controls">
    <output className="p052-digits" aria-label={semantic.summary}>{semantic.digits}<span aria-hidden="true">%</span></output>
    {(state.phase==='practice'||(state.phase==='intro'&&state.frame===115))&&<>
     <label htmlFor={`${id}-range`}>{copy.slider}</label>
     <input id={`${id}-range`} type="range" min={0} max={100} step={1} value={state.percent}
      disabled={!interactive||semantic.controlsDisabled} aria-describedby={`${id}-prompt ${id}-keyboard`} aria-valuetext={semantic.summary}
      onChange={event=>send({type:'value',percent:Number(event.currentTarget.value),epoch:state.epoch})}/>
     <p id={`${id}-keyboard`}>{copy.keyboard}</p>
     <div className="p052-actions">
      <button type="button" data-p052-feedback-return disabled={!interactive||semantic.controlsDisabled} onClick={()=>send({type:'submit',epoch:state.epoch})}>{copy.done}</button>
      <button type="button" disabled={!interactive||semantic.controlsDisabled} onClick={()=>send({type:'reset',epoch:state.epoch})}>{copy.reset}</button>
      <button type="button" aria-haspopup="dialog" disabled={!interactive||semantic.controlsDisabled} onClick={()=>send({type:'open-help',epoch:state.epoch})}>{copy.help}</button>
     </div>
    </>}
   </div>
  </div>
  {state.paused&&<p role="status">{copy.paused}</p>}
  <dialog ref={feedback} className="p052-dialog" open={feedbackOpen&&!interactive} aria-labelledby={`${id}-feedback`} onCancel={cancel('close-feedback')}>
   <h3 id={`${id}-feedback`} tabIndex={-1} data-p052-source-text={state.phase==='wrong'?'321':'330'}>{semantic.feedback}</h3>
   {resume}{closeButton('close-feedback')}
  </dialog>
  <dialog ref={help} className="p052-dialog" open={state.help&&!interactive} aria-labelledby={`${id}-help`} onCancel={cancel('close-help')}>
   <h3 id={`${id}-help`} tabIndex={-1}>{copy.help}</h3>
   <p data-p052-source-text="340">{copy.helpExplanation}</p><p>{copy.rowColumnNote}</p>
   <figure className="p052-help-example"><P052PercentGrid percent={35} language={language} example/><figcaption data-p052-source-text="339">{copy.example}</figcaption></figure>
   <div className="p052-actions">{(['Square','Column'] as const).map(term=><button type="button" key={term} aria-haspopup="dialog"
    disabled={!interactive||state.paused||!!state.glossary} onClick={()=>send({type:'open-glossary',term,epoch:state.epoch})}>{copy.glossary[term].title}</button>)}</div>
   {resume}{closeButton('close-help')}
  </dialog>
  <dialog ref={glossary} className="p052-dialog" open={!!state.glossary&&!interactive} aria-labelledby={`${id}-term`} onCancel={cancel('close-glossary')}>
   <h3 id={`${id}-term`} tabIndex={-1}>{semantic.glossary?.title}</h3><p>{semantic.glossary?.definition}</p>
   {resume}{closeButton('close-glossary')}
  </dialog>
 </section>;
}
