import * as React from 'react';
import {P047NumberLine,P047Fraction,type P047NumberLineProps} from './nms-l02-p047-number-line-v1';
import {P047Instruction} from './nms-l02-p047-instruction-v1';
import {P047_COPY} from './nms-l02-p047-copy-v1';
export interface P047PracticeViewProps extends P047NumberLineProps {onHelp:(open:boolean)=>void;onModalChange?:(open:boolean)=>void;}
/** Parent owns feedback timing. Help is the only modal here; no premature Close
 * action is added to the source's automatically returning feedback clips.
 */
export function P047PracticeView({state,language='en',interactive=true,onHelp,onModalChange,...actions}:P047PracticeViewProps){
 const copy=P047_COPY[language],id=React.useId(),dialog=React.useRef<HTMLDialogElement>(null),help=React.useRef<HTMLButtonElement>(null),region=React.useRef<HTMLElement>(null),previous=React.useRef(state.phase);
 React.useEffect(()=>{
  const node=dialog.current;
  if(state.helpOpen&&node&&!node.open){node.showModal();node.querySelector<HTMLElement>('[data-p047-help-title]')?.focus();}
  if(!state.helpOpen&&node?.open){node.close();help.current?.focus();}
 },[state.helpOpen]);
 React.useEffect(()=>{
  const before=previous.current;previous.current=state.phase;
  if(before===state.phase)return;
  if(state.phase==='ready'&&(before==='wrong-feedback'||before==='correct-feedback'))region.current?.querySelector<HTMLButtonElement>('[data-p047-card]:not([hidden]):not(:disabled)')?.focus();
  if(state.phase==='complete')region.current?.focus();
 },[state.phase]);
 if(state.phase==='intro')return null;
 const feedback=state.phase==='correct-feedback'||state.phase==='celebration'?copy.correct:state.phase==='wrong-feedback'?copy.wrong:state.phase==='complete'?copy.complete:'';
 return <section ref={region} tabIndex={-1} className="p047-activity" lang={language} data-p047-practice-phase={state.phase}>
  <h2>{copy.question}</h2><P047Instruction text={copy.instruction} language={language} enabled={interactive&&!state.helpOpen} onModalChange={onModalChange}/>
  <P047NumberLine state={state} language={language} interactive={interactive} {...actions}/>
  <p role="status" aria-live="polite">{feedback}</p><p>{copy.guidance}</p>
  <button ref={help} type="button" disabled={!interactive||state.phase!=='ready'||state.helpOpen} aria-haspopup="dialog" onClick={()=>onHelp(true)}>{copy.help}</button>
  <dialog ref={dialog} aria-labelledby={id} onCancel={e=>{e.preventDefault();onHelp(false);}}>
   <h3 id={id} tabIndex={-1} data-p047-help-title>{copy.help}</h3><P047Instruction text={copy.helpDefinition} language={language} context="definition" onModalChange={onModalChange}/>
   <p data-p047-help-example>{copy.example} <P047Fraction numerator={7} denominator={8}/></p>
   <p data-p047-help-explanation>{copy.helpExplanation} <P047Fraction numerator={7} denominator={8}/>.</p>
   <figure aria-label={copy.helpDiagram}>
    <div className="p047-line-grid" aria-hidden="true"><div className="p047-help-steps">{Array.from({length:7},(_,step)=><span key={step} data-p047-help-step={step+1}/>)}</div>{Array.from({length:9},(_,tick)=><div className="p047-line-mark" key={tick}><div className="p047-line-value">{tick===7&&<P047Fraction numerator={7} denominator={8}/>}</div><span className="p047-tick"/><span>{tick===0?'0':tick===8?'1':'\u00a0'}</span></div>)}</div>
   </figure>
   <button type="button" onClick={()=>onHelp(false)}>{copy.close}</button>
  </dialog>
 </section>;
}
