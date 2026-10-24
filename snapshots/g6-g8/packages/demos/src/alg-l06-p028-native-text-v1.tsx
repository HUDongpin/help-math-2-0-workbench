import React from 'react';
import {P028_TIMELINE,p028TimelineState,type P028GlossaryKey} from './alg-l06-p028-timeline-v1';

export {P028_TIMELINE,p028TimelineState};
export type {P028GlossaryKey};

export interface P028NativeTextV1Props {
  frame: number;
  language?: 'en' | 'es';
  onGlossary?: (key: P028GlossaryKey, trigger: HTMLButtonElement) => void;
}

type NativeValue=ReturnType<typeof p028TimelineState>['nativeReadyTextInstances'][number];
type Positioned={value:NativeValue;left:number;right:number;baseline:number};
const sourceSpace=P028_TIMELINE.definitions.flatMap(definition=>definition.runs)
  .flatMap(run=>run.glyphs).find(glyph=>glyph.character===' ')?.advance ??
  (()=>{throw Error('P028_SOURCE_SPACE_GLYPH_MISSING');})();

function position(value:NativeValue):Positioned {
  return {value,left:Math.min(...value.runs.map(run=>run.ink.left)),
    right:Math.max(...value.runs.map(run=>run.ink.right)),
    baseline:value.sourceTransform.transY+value.runs[0].y*value.sourceTransform.scaleY};
}
const compact=(text:string)=>text.replace(/\s/gu,'');

/** Read complete source instances in placed order; retain their per-instance alpha. */
export function p028NativeReadingLines(frame:number) {
  const values=p028TimelineState(frame).nativeReadyTextInstances.map(position)
    .sort((a,b)=>a.baseline-b.baseline||a.left-b.left||a.value.depth-b.value.depth);
  const groups:Positioned[][]=[];
  for(const item of values){
    const group=groups.at(-1);
    if(!group||Math.abs(group[0].baseline-item.baseline)>sourceSpace)groups.push([item]);
    else group.push(item);
  }
  return groups.map((group,index)=>{
    const source=group.filter(item=>!group.some(other=>other!==item&&
      other.value.runs.length>1&&other.value.text.includes(item.value.text)&&
      other.left<=item.left&&other.right>=item.right));
    const hidden=new Set<string>();
    for(const overlay of source.filter(item=>item.value.text.length>1&&item.value.runs.length===1)){
      const fragments=source.filter(item=>item!==overlay&&item.value.text.length===1&&
        item.left>=overlay.left-sourceSpace/4&&item.right<=overlay.right+sourceSpace/4)
        .sort((a,b)=>a.left-b.left||a.value.depth-b.value.depth);
      if(fragments.length>1&&compact(fragments.map(item=>item.value.text).join(''))===
          compact(overlay.value.text))for(const item of fragments)hidden.add(item.value.instanceId);
    }
    const ordered=source.filter(item=>!hidden.has(item.value.instanceId))
      .sort((a,b)=>a.left-b.left||a.value.depth-b.value.depth);
    const parts=ordered.map((item,partIndex)=>({value:item.value,
      spaceBefore:partIndex>0&&item.left-ordered[partIndex-1].right>=sourceSpace/2&&
        !/\s$/u.test(ordered[partIndex-1].value.text)&&!/\s/u.test(item.value.text[0])}));
    return {index,parts,text:parts.map(part=>`${part.spaceBefore?' ':''}${part.value.text}`)
      .join('').trimEnd()};
  });
}

/** The original Canvas retains every source glyph until each instance can be suppressed there. */
export function p028CanOpenGlossary(key:P028GlossaryKey,trigger:HTMLButtonElement,
  frame:number,scope:HTMLElement|null):boolean {
  if(!Number.isSafeInteger(frame)||frame<1||frame>P028_TIMELINE.mainFrameCount||
    !scope||!trigger.isConnected||trigger.disabled||!scope.contains(trigger)||
    trigger.getAttribute('data-p028-glossary-key')!==key)return false;
  const instanceId=trigger.getAttribute('data-source-button-instance-id');
  const buttonId=Number(trigger.getAttribute('data-source-button-id'));
  return p028TimelineState(frame).glossaryInstances.some(source=>
    source.key===key&&source.instanceId===instanceId&&source.buttonId===buttonId&&
    trigger.getAttribute('data-source-action-sha256')===source.sourceActionSha256&&
    trigger.getAttribute('data-source-label-text-id')===String(source.label.textId)&&
    trigger.getAttribute('data-source-label-instance-id')===source.label.textInstanceId&&
    trigger.getAttribute('data-source-label-run-id')===source.label.sourceTextId&&
    trigger.getAttribute('data-source-label-segment')===source.label.segment&&
    trigger.getAttribute('data-source-button-visual-state')==='full-hit-and-own-blue-glyph'&&
    source.available);
}

/** Native companion for accessible text and source-gated glossary controls. */
export function P028NativeTextV1({frame,language='en',onGlossary}:P028NativeTextV1Props) {
  const state=p028TimelineState(frame);
  const lines=p028NativeReadingLines(frame);
  return <section lang="en" aria-label={language==='es'?'Texto original de la lección':'Original lesson text'}
    data-p028-native-text="true" data-p028-frame={frame}
    data-p028-source-sha256={P028_TIMELINE.sourceSwfSha256}
    data-p028-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p028-source-canvas-preserved="true"
    data-p028-suppressed-text-instance-ids={state.suppressibleSourceTextInstanceIds.join(',')}
    data-p028-native-ready-instance-ids={state.nativeReadyTextInstances.map(value=>value.instanceId).join(',')}
    data-p028-partial-instance-ids={state.partialSourceTextInstances.map(value=>value.instanceId).join(',')}
    style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',lineHeight:1.5,
      color:'#15344c',minWidth:0,maxWidth:'100%',boxSizing:'border-box',padding:'1rem',
      background:'#fff',borderRadius:'0.75rem',overflowWrap:'anywhere'}}>
    {lines.map(line=><p key={line.index} data-p028-section="source-text"
      data-p028-source-reading-line={line.index}
      style={{margin:'0 0 0.65em',whiteSpace:'normal',overflowWrap:'normal',maxWidth:'100%'}}>
      {line.parts.map(part=><React.Fragment key={part.value.instanceId}>
        {part.spaceBefore?' ':null}
        <span data-source-text-id={`character-${part.value.sourceTextId}`}
          data-source-text-instance-id={part.value.instanceId} data-source-depth={part.value.depth}
          style={{opacity:part.value.alpha}}>
          {part.value.runs.map(run=><span key={run.sourceTextId}
            data-source-run-id={run.sourceTextId} data-source-color-rgb={run.colorRgb.join(',')}
            style={run.colorRgb.join(',')==='0,0,204'?{color:'#144fab',fontWeight:650}:
              run.colorRgb.join(',')==='255,0,255'?{color:'#a000a0',fontWeight:650}:undefined}>
            {run.text}</span>)}
        </span>
      </React.Fragment>)}
    </p>)}
    {state.glossaryInstances.some(control=>control.available)&&<div
      data-p028-section="source-glossary-controls" style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',minWidth:0}}>
      {state.glossaryInstances.filter(control=>control.available).map(control=><button
        key={control.instanceId} type="button" data-p028-glossary-key={control.key}
        data-source-button-id={control.buttonId} data-source-button-instance-id={control.instanceId}
        data-source-action-sha256={control.sourceActionSha256}
        data-source-label-text-id={control.label.textId}
        data-source-label-instance-id={control.label.textInstanceId}
        data-source-label-run-id={control.label.sourceTextId}
        data-source-label-segment={control.label.segment}
        data-source-button-visual-state="full-hit-and-own-blue-glyph"
        disabled={!onGlossary}
        onClick={event=>{const trigger=event.currentTarget;
          const scope=trigger.closest('[data-p028-native-text]') as HTMLElement|null;
          if(p028CanOpenGlossary(control.key,trigger,frame,scope))onGlossary?.(control.key,trigger);}}
        aria-label={language==='es'?`Abrir glosario: ${control.key}`:`Open ${control.key} glossary`}
        style={{minHeight:44,border:'1px solid currentColor',borderRadius:'0.4em',
          background:'#edf6fc',color:'inherit',font:'inherit',padding:'0.45em 0.8em',
          cursor:'pointer',maxWidth:'100%',minWidth:0,overflowWrap:'anywhere'}}>
        {control.key} {language==='es'?'glosario':'glossary'}
      </button>)}
    </div>}
  </section>;
}
