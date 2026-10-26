import React from 'react';
import geometry from '../../../../migrations/shared-alg001-l06-p029/native-v1/geometry-v1.json';
import {p029CanInvoke,p029NativeState,type P029FeedbackFrame,
  type P029GlossaryKey} from './native-source-v1';

export type P029PresentationMode='source-overlay'|'semantic-reflow';
export function p029PresentationMode(stageWidth:number,rootFontPx:number):P029PresentationMode{
  return stageWidth>=800&&rootFontPx<24?'source-overlay':'semantic-reflow';
}

export interface P029ResponsiveNativeProps {
  frame:number;language:'en'|'es';feedback:P029FeedbackFrame|null;value:string;
  onValueChange?:(value:string)=>void;
  onSubmit?:(value:string)=>void;
  onGlossary?:(key:P029GlossaryKey,trigger:HTMLButtonElement)=>void;
  onWrongClose?:(spriteId:52|67|98,trigger:HTMLButtonElement)=>void;
}
type Kind='glossary'|'done'|'close';
type SourceAction={buttonCharacterId:number;sourceInstanceId:string;action:{sha256:string}};
const attrs=(source:SourceAction,kind:Kind)=>({
  'data-p029-action':kind,
  'data-source-button-id':source.buttonCharacterId,
  'data-source-instance-id':source.sourceInstanceId,
  'data-source-action-sha256':source.action.sha256,
});
const buttonStyle:React.CSSProperties={minWidth:44,minHeight:44,maxWidth:'100%',
  padding:'0.35em 0.75em',font:'inherit',lineHeight:1.25,cursor:'pointer'};

/** Source Canvas remains intact. This is one responsive action surface when
 * the scaled source controls would be too small for reading or touch. */
export function P029ResponsiveNativeV2({frame,language,feedback,value,
  onValueChange,onSubmit,onGlossary,onWrongClose}:P029ResponsiveNativeProps){
  const source=p029NativeState(frame,feedback),scope=React.useRef<HTMLElement>(null);
  const text=geometry.semanticText.filter(item=>item.role!=='answer-label'&&
    frame>=item.semanticReadyFrame);
  return <section ref={scope} lang="en" aria-label="Relation lesson animation"
    data-p029-responsive-native="true" data-p029-frame={frame}
    data-p029-source-sha256={geometry.source.swfSha256}
    data-p029-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p029-source-canvas-glyphs="preserved"
    style={{display:'grid',gap:'0.65em',width:'100%',minWidth:0,
      maxWidth:'100%',padding:'0.75em',boxSizing:'border-box',
      fontSize:'1rem',lineHeight:1.4}}>
    {text.map(item=><p key={item.textId} data-source-text-id={item.textId}
      data-source-instance-id={item.sourceInstanceId}
      style={{margin:0,minWidth:0,whiteSpace:'normal',wordBreak:'normal'}}>
      {item.readableText}</p>)}
    {source.glossary&&onGlossary&&<div role="group" aria-label="Source glossary"
      style={{display:'flex',flexWrap:'wrap',gap:'0.5em'}}>
      {geometry.glossary.map(item=><button key={item.key} type="button"
        {...attrs(item,'glossary')} data-p029-glossary-key={item.key}
        onClick={event=>{
          if(p029CanInvoke(event.currentTarget,scope.current,item,'glossary',frame,feedback))
            onGlossary(item.key as P029GlossaryKey,event.currentTarget);
        }} style={buttonStyle}>{item.key}</button>)}
    </div>}
    {source.questionHold&&<div style={{display:'grid',gap:'0.5em',minWidth:0}}>
      <label htmlFor="p029-responsive-entry-txt">Answer</label>
      <input id="p029-responsive-entry-txt" name="Entry_txt" type="text"
        inputMode="text" autoComplete="off" value={value}
        disabled={!onValueChange}
        data-source-text-id={geometry.input.characterId}
        data-source-instance-id={geometry.input.sourceInstanceId}
        onChange={event=>onValueChange?.(event.currentTarget.value)}
        onKeyDown={event=>{if(event.key==='Enter'){
          event.preventDefault();onSubmit?.(event.currentTarget.value);
        }}}
        style={{width:'min(100%,16rem)',minWidth:0,minHeight:44,
          boxSizing:'border-box',font:'inherit',padding:'0.2em 0.35em'}} />
      <div><button type="button" {...attrs(geometry.done,'done')}
        disabled={!onSubmit}
        onClick={event=>{
          if(p029CanInvoke(event.currentTarget,scope.current,geometry.done,
            'done',frame,feedback))onSubmit?.(value);
        }} style={buttonStyle}>Done</button></div>
    </div>}
    {source.close&&<div><button type="button" {...attrs(source.close,'close')}
      disabled={!onWrongClose}
      onClick={event=>{
        if(p029CanInvoke(event.currentTarget,scope.current,source.close!,
          'close',frame,feedback))
          onWrongClose?.(source.close!.feedbackSpriteId as 52|67|98,
            event.currentTarget);
      }} style={buttonStyle}>Close feedback</button></div>}
  </section>;
}
