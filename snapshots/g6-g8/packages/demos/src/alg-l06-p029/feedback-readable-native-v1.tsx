import React,{useEffect,useRef} from 'react';
import type {P029State} from './quiz-reducer-v1';
import {P029ResponsiveNativeV2}
 from './responsive-native-v2';
import type {P029GlossaryKey}
 from './native-source-v1';
import {p029FeedbackReadingV1,p029FocusTarget,type P029WrongResolverV6}
 from './feedback-reading-v1';

export interface P029FeedbackReadableNativeProps {
  state:P029State;language:'en'|'es';
  resolveWrongPopup:P029WrongResolverV6;
  onValueChange?:(value:string)=>void;
  onSubmit?:(value:string)=>void;
  onGlossary?:(key:P029GlossaryKey,trigger:HTMLButtonElement)=>void;
  onWrongClose?:(spriteId:52|67|98,trigger:HTMLButtonElement)=>void;
}

/** One always-readable native action surface alongside the untouched Canvas.
 * Source sprite labels and popup edit text follow their own visible frames. */
export function P029FeedbackReadableNativeV1({state,language,resolveWrongPopup,
  onValueChange,onSubmit,onGlossary,onWrongClose}:P029FeedbackReadableNativeProps){
  const root=useRef<HTMLDivElement>(null);
  const feedback=state.feedback?{spriteId:state.feedback.spec.characterId,
    frame:state.feedback.frame}:null;
  const reading=p029FeedbackReadingV1(state,resolveWrongPopup);
  const focus=p029FocusTarget(state);
  const questionAction=state.phase==='question';
  const glossaryAction=state.phase==='prequiz'||state.phase==='question'||
    state.phase==='postquiz';
  useEffect(()=>{
    const selector=focus==='answer'?'input[name="Entry_txt"]':
      focus==='close'?'button[data-p029-action="close"]':null;
    const target=selector?root.current?.querySelector<HTMLElement>(selector):null;
    if(target&&document.activeElement!==target)target.focus();
  },[focus,state.epoch,state.mainFrame,state.feedback?.frame]);
  return <div ref={root} data-p029-readable-feedback="true"
    data-p029-feedback-phase={state.phase}
    data-p029-feedback-sprite={reading?.spriteId??''}
    style={{width:'100%',minWidth:0,maxWidth:'100%'}}>
    {reading&&(reading.label||reading.popup)&&<div role="status" aria-live="polite"
      aria-atomic="true" lang="en" data-p029-feedback-reading="true"
      style={{padding:'0.5em 0.75em',fontSize:'1rem',lineHeight:1.4,
        overflowWrap:'normal',wordBreak:'normal'}}>
      {reading.label&&<p data-source-text-id={reading.label.textId}
        style={{margin:'0 0 0.3em'}}>{reading.label.text}</p>}
      {reading.popup&&<p data-source-edit-text-id={reading.popup.editTextId}
        data-p029-popup-sprite={reading.popup.popupSpriteId}
        style={{margin:0}}>{reading.popup.text}</p>}
    </div>}
    <P029ResponsiveNativeV2 frame={state.mainFrame} language={language}
      feedback={feedback} value={state.entryText}
      onValueChange={questionAction?onValueChange:undefined}
      onSubmit={questionAction?onSubmit:undefined}
      onGlossary={glossaryAction?onGlossary:undefined}
      onWrongClose={state.phase==='feedback-held'?onWrongClose:undefined}/>
  </div>;
}
