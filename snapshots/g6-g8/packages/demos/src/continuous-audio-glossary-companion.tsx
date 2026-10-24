'use client';
import {useEffect,useState,useRef} from 'react';
import {createPortal} from 'react-dom';
import type {AnimationRendererProps} from './contract';
import {visibleFrozenGlossaryControls,type FrozenGlossaryControl} from './frozen-calibration-glossary-candidate';

/** Typed glossary controls driven by the same displayed source frame as audio.
 * The source Canvas remains owned by the registered clock attachment. */
export function ContinuousAudioGlossaryCompanion({animationId,controls,frame,ready,language,targetId,replayEpoch,readFrame,onRequest,onOpened}:{
 animationId:string;controls:readonly FrozenGlossaryControl[];frame:number;ready:boolean;language:'en'|'es';targetId?:string;replayEpoch:number;
 readFrame:()=>number;onRequest?:AnimationRendererProps['onLessonHostRequest'];onOpened:()=>void;
}){
 const [target,setTarget]=useState<HTMLElement|null>(null),[blocked,setBlocked]=useState(false);
 const closeObserver=useRef<MutationObserver|null>(null);
 useEffect(()=>()=>closeObserver.current?.disconnect(),[]);
 useEffect(()=>{const n=targetId?document.getElementById(targetId):null;setTarget(n?.dataset.pageInteractionCompanionHost==='true'?n:null);},[targetId]);
 useEffect(()=>{setBlocked(false);closeObserver.current?.disconnect();closeObserver.current=null;},[replayEpoch]);
 const restoreTriggerAfterClose=(trigger:HTMLButtonElement,control:FrozenGlossaryControl)=>{
  closeObserver.current?.disconnect();const selector='[role="dialog"][data-glossary-entry-id="'+control.entryId+'"]';let seen=Boolean(document.querySelector(selector));
  const observer=new MutationObserver(()=>{const dialog=document.querySelector<HTMLElement>(selector);if(dialog){if(!seen){const bounds=dialog.getBoundingClientRect();window.scrollBy({top:bounds.top+bounds.height/2-window.innerHeight/2,behavior:'instant'});}seen=true;return;}if(!seen)return;observer.disconnect();if(closeObserver.current===observer)closeObserver.current=null;
   if(trigger.isConnected&&!trigger.disabled&&visibleFrozenGlossaryControls(controls,readFrame()).some(c=>c.sourceCharacterId===control.sourceCharacterId))trigger.focus({preventScroll:true});
  });closeObserver.current=observer;observer.observe(document.body,{childList:true,subtree:true});
 };
 const visible=visibleFrozenGlossaryControls(controls,frame),enabled=ready&&Boolean(onRequest);
 if(visible.length===0)return null;
 const content=<section aria-label={language==='es'?'Glosario de esta página':'Glossary for this page'} data-frozen-glossary-controls={animationId}
  data-source-visible-control-count={visible.length} data-controls-ready={enabled?'true':'false'} data-companion-placement={target?'portal':'inline'}
  style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8,padding:12}}>
  {visible.map(control=><button key={control.sourceCharacterId} type="button" data-source-character-id={control.sourceCharacterId} data-source-key-attribute={control.sourceKeyAttribute}
   disabled={!enabled} style={{minHeight:44,padding:'8px 14px',font:'600 1rem system-ui'}} onClick={event=>{
    if(!enabled||!visibleFrozenGlossaryControls(controls,readFrame()).some(c=>c.sourceCharacterId===control.sourceCharacterId)){setBlocked(true);return;}
    const decision=onRequest?.({type:'open-glossary',entryId:control.entryId},{trigger:event.currentTarget});setBlocked(decision?.status!=='allowed');if(decision?.status==='allowed'){restoreTriggerAfterClose(event.currentTarget,control);onOpened();}
   }}>{control.labels[language]}</button>)}
  {blocked?<p role="alert">{language==='es'?'El glosario no está disponible.':'The glossary is unavailable.'}</p>:null}
 </section>;
 return target?createPortal(content,target):content;
}
