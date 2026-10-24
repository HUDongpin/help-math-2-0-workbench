import React from 'react';
import {P025_TIMELINE,p025TimelineState,type P025TimelineGlossaryKey} from './alg-l06-p025-timeline-v1';
export {P025_TIMELINE,p025TimelineState};
export type P025GlossaryKey=P025TimelineGlossaryKey;

/** Own only source-complete paragraphs. Transient source ink stays on Canvas. */
export function P025NativeTextV1({frame,language='en',onGlossary}:{frame:number;language?:'en'|'es';
 onGlossary?:(key:P025GlossaryKey,trigger:HTMLButtonElement)=>void}){
 const state=p025TimelineState(frame);
 return <section lang="en" aria-label="Lesson text" data-p025-native-text="true"
  data-p025-text-frame={frame} data-p025-source-sha256={P025_TIMELINE.sourceSwfSha256}
  data-p025-language-policy={language==='es'?'source-en-fallback':'source-en'}
  data-p025-suppressed-text-ids={state.suppressibleSourceTextIds.join(',')}
  style={{fontFamily:'var(--font-lesson-sans, Arial), sans-serif',fontSize:'1rem',lineHeight:1.5,
   color:'#15344c',minWidth:0,maxWidth:'100%',boxSizing:'border-box',padding:'1rem',
   background:'#fff',borderRadius:'0.75rem',overflowWrap:'anywhere'}}>
  {state.nativeParagraphs.map(p=><p key={p.instanceId} data-p025-section={p.name}
   data-source-text-id={'character-'+p.sourceTextId} data-source-text-instance-id={p.instanceId}
   style={{margin:'0 0 0.75em'}}>{p.runs.map(run=><span key={run.sourceTextId}
    data-source-run-id={run.sourceTextId} data-source-rgba={run.colorRgba.join(',')}
    style={run.colorRgba.join(',')==='0,0,204,255'?{color:'#144fab',fontWeight:650}:undefined}>
    {run.text}</span>)}</p>)}
  <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',minWidth:0}}>
   {state.glossaryInstances.filter(c=>c.available).map(c=><button key={c.instanceId}
    type="button" data-p025-glossary-key={c.key} data-source-button-id={c.buttonId}
    data-source-button-instance-id={c.instanceId} data-source-action-sha256={c.sourceActionSha256}
    data-source-label-text-id={c.label.textId} data-source-label-segment={c.label.segment}
    data-source-button-visual-state="full-hit-and-own-blue-glyph" disabled={!onGlossary}
    onClick={event=>onGlossary?.(c.key,event.currentTarget)}
    aria-label={language==='es'?'Abrir glosario: '+c.key:'Open '+c.key+' glossary'}
    style={{minHeight:44,border:'1px solid currentColor',borderRadius:'0.4em',background:'#edf6fc',
     color:'inherit',font:'inherit',padding:'0.45em 0.8em',cursor:'pointer',maxWidth:'100%',
     minWidth:0,overflowWrap:'anywhere'}}>{c.key} {language==='es'?'glosario':'glossary'}</button>)}
  </div>
 </section>;
}
