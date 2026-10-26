import React from 'react';
import geometry from '../../../../migrations/shared-alg001-l06-p029/native-v1/geometry-v1.json';

export type P029GlossaryKey = 'Relation' | 'Ordered pair';
export type P029FeedbackFrame = {spriteId:52|67|98|126|151|167|179;frame:number};
type SourceBox = {left:number;right:number;top:number;bottom:number};
type SourceControl = {buttonCharacterId:number;sourceInstanceId:string;
  action:{sha256:string};stageBoundsPx:SourceBox};

export interface P029NativeV1Props {
  frame:number;
  language?:'en'|'es';
  feedback?:P029FeedbackFrame|null;
  value:string;
  onValueChange?:(value:string)=>void;
  onSubmit?:(value:string)=>void;
  onGlossary?:(key:P029GlossaryKey,trigger:HTMLButtonElement)=>void;
  onWrongClose?:(spriteId:52|67|98,trigger:HTMLButtonElement)=>void;
}

const FRAME_COUNTS:Record<P029FeedbackFrame['spriteId'],number>=
  {52:29,67:28,98:28,126:28,151:27,167:28,179:25};
const CONTROL_ATTRIBUTE='data-p029-action';
const SR_ONLY:React.CSSProperties={position:'absolute',width:1,height:1,padding:0,margin:-1,
  overflow:'hidden',clip:'rect(0, 0, 0, 0)',whiteSpace:'nowrap',border:0};

function styleFor(box:SourceBox):React.CSSProperties {
  return {position:'absolute',left:box.left,top:box.top,
    width:box.right-box.left,height:box.bottom-box.top,boxSizing:'border-box'};
}

export function p029NativeState(frame:number,feedback:P029FeedbackFrame|null=null){
  if(!Number.isSafeInteger(frame)||frame<1||frame>234)throw new RangeError('P029_MAIN_FRAME');
  if(feedback&&(!Number.isSafeInteger(feedback.spriteId)||
    !(feedback.spriteId in FRAME_COUNTS)||!Number.isSafeInteger(feedback.frame)||
    feedback.frame<1||feedback.frame>FRAME_COUNTS[feedback.spriteId]||frame<145))
    throw new RangeError('P029_FEEDBACK_FRAME');
  const questionHold=frame===145&&!feedback;
  const glossary=frame>=geometry.glossary[0].visualReadyFrame&&!feedback;
  const close=feedback&&geometry.wrongCloses.find(source=>
    source.feedbackSpriteId===feedback.spriteId&&feedback.frame===source.holdFrame);
  return {questionHold,glossary,close:close??null};
}

/** Validate the native event against the current source instance and frame gate. */
export function p029CanInvoke(button:HTMLButtonElement,scope:HTMLElement|null,
  source:SourceControl,kind:'glossary'|'done'|'close',
  frame:number,feedback:P029FeedbackFrame|null=null):boolean {
  if(!scope||!button.isConnected||button.disabled||!scope.contains(button)||
    button.getAttribute(CONTROL_ATTRIBUTE)!==kind||
    button.getAttribute('data-source-button-id')!==String(source.buttonCharacterId)||
    button.getAttribute('data-source-instance-id')!==source.sourceInstanceId||
    button.getAttribute('data-source-action-sha256')!==source.action.sha256)return false;
  const state=p029NativeState(frame,feedback);
  if(kind==='glossary')return state.glossary;
  if(kind==='done')return state.questionHold;
  return state.close?.buttonCharacterId===source.buttonCharacterId;
}

function sourceAttrs(source:SourceControl,kind:'glossary'|'done'|'close'){
  return {[CONTROL_ATTRIBUTE]:kind,'data-source-button-id':source.buttonCharacterId,
    'data-source-instance-id':source.sourceInstanceId,
    'data-source-action-sha256':source.action.sha256};
}

/** Source Canvas keeps all glyphs; this companion supplies semantic text and controls. */
export function P029NativeV1({frame,language='en',feedback=null,value,
  onValueChange,onSubmit,onGlossary,onWrongClose}:P029NativeV1Props){
  const state=p029NativeState(frame,feedback);
  const scope=React.useRef<HTMLElement>(null);
  const inputId='p029-entry-txt';
  return <section ref={scope} lang="en" aria-label="Relation lesson animation"
    data-p029-native="true" data-p029-frame={frame}
    data-p029-source-sha256={geometry.source.swfSha256}
    data-p029-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p029-source-canvas-glyphs="preserved"
    style={{position:'relative',width:800,height:600,overflow:'hidden'}}>
    {frame>=geometry.semanticText[0].semanticReadyFrame&&<div style={SR_ONLY} data-p029-source-static-text="true">
      {geometry.semanticText.filter(text=>text.role!=='answer-label'&&frame>=text.semanticReadyFrame).map(text=>
        <p key={text.textId} data-source-text-id={text.textId}
          data-source-instance-id={text.sourceInstanceId}>{text.readableText}</p>)}
    </div>}
    {state.glossary&&geometry.glossary.map(source=>
      <button key={source.key} type="button"
        {...sourceAttrs(source,'glossary')} data-p029-glossary-key={source.key}
        aria-label={`Open ${source.key} glossary`}
        disabled={!onGlossary}
        onClick={event=>{
          if(p029CanInvoke(event.currentTarget,scope.current,source,'glossary',frame,feedback))
            onGlossary?.(source.key as P029GlossaryKey,event.currentTarget);
        }}
        style={{...styleFor(source.stageBoundsPx),background:'transparent',border:0,
          cursor:'pointer'}} />)}
    {state.questionHold&&<>
      <label htmlFor={inputId} style={SR_ONLY}>Answer: how many ordered pairs?</label>
      <input id={inputId} type="text" inputMode="text" autoComplete="off"
        name="Entry_txt" value={value} disabled={!onValueChange}
        data-source-text-id={geometry.input.characterId}
        data-source-instance-id={geometry.input.sourceInstanceId}
        onChange={event=>onValueChange?.(event.currentTarget.value)}
        onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();onSubmit?.(value);}}}
        style={{...styleFor(geometry.input.stageBoundsPx),fontSize:22,textAlign:'center',
          color:'#101010',background:'#fff',border:'1px solid #444'}} />
      <button type="button" {...sourceAttrs(geometry.done,'done')}
        aria-label="Done" disabled={!onSubmit}
        onClick={event=>{
          if(p029CanInvoke(event.currentTarget,scope.current,geometry.done,'done',frame,feedback))
            onSubmit?.(value);
        }}
        style={{...styleFor(geometry.done.stageBoundsPx),background:'transparent',
          border:0,cursor:'pointer'}} />
    </>}
    {state.close&&<button type="button" {...sourceAttrs(state.close,'close')}
      aria-label="Close feedback" disabled={!onWrongClose}
      onClick={event=>{
        if(p029CanInvoke(event.currentTarget,scope.current,state.close!,'close',frame,feedback))
          onWrongClose?.(state.close!.feedbackSpriteId as 52|67|98,event.currentTarget);
      }}
      style={{...styleFor(state.close.stageBoundsPx),background:'transparent',
        border:0,cursor:'pointer'}} />}
  </section>;
}
