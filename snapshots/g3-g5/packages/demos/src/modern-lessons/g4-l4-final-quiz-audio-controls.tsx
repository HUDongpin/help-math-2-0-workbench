import React,{useEffect,useRef,useState,useMemo} from 'react';
import type {AnimationRendererProps} from '../contract';
import {createSourceQuizAudio,type SourceQuizAudioAsset} from './g4-l4-final-quiz-audio';

export function SourceQuizAudioControls({assets,questionId,ready,runtime,questionPoolSize=25}:{questionPoolSize?:24|25|30;assets:readonly SourceQuizAudioAsset[];questionId:number;ready:boolean;runtime:AnimationRendererProps}) {
 const {asset:fq002AudioAsset,request:fq002AudioRequest,stopRequest:fq002AudioStopRequest}=useMemo(()=>createSourceQuizAudio(assets,questionPoolSize),[assets,questionPoolSize]);
 const uiLanguage=runtime.uiLanguage??runtime.lang;
 const [language,setLanguage]=useState(uiLanguage);
 useEffect(()=>setLanguage(uiLanguage),[uiLanguage]);
 const latest=useRef(runtime);latest.current=runtime;
 useEffect(()=>()=>{
  const current=latest.current;
  // The host may already have published another question's cue when the old
  // effect is cleaned up. Retire only the question/language this effect owned.
  const stop=fq002AudioStopRequest(current.activeInteractiveAudioId??current.pausedInteractiveAudioId,{questionId,language});
  if(stop)current.onLessonHostRequest?.(stop);
 },[questionId,language,runtime.replay]);
 useEffect(()=>{
  const owned=fq002AudioStopRequest(runtime.activeInteractiveAudioId,{questionId,language});
  if(runtime.paused&&owned)runtime.onLessonHostRequest?.({type:'pause-audio',cueId:owned.cueId});
 },[runtime.paused,runtime.activeInteractiveAudioId,runtime.onLessonHostRequest,questionId,language]);
 if(!runtime.audioEnabled||!runtime.onLessonHostRequest)return null;
 const es=uiLanguage==='es';
 return <div role="group" data-lesson-text-block="quiz-audio" data-audio-language={language} lang={es?'es':'en'} aria-label={es?'Audio de la pregunta y las opciones':'Question and answer audio'} style={{display:'flex',flexWrap:'wrap',gap:'.5rem',marginBlock:'1rem'}}>
  <label style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:'.5rem',flexBasis:'100%',minWidth:0}}>
   <span>{es?'Idioma del audio':'Audio language'}</span>
   <select value={language} disabled={!ready||runtime.paused} style={{font:'inherit',minHeight:44,minWidth:0,maxWidth:'100%',padding:'.25em',border:'1px solid currentColor',borderRadius:'.35rem'}} onChange={event=>{
    const next=event.currentTarget.value;
    if((next!=='en'&&next!=='es')||next===language)return;
    const stop=fq002AudioStopRequest(runtime.activeInteractiveAudioId??runtime.pausedInteractiveAudioId,{questionId,language});
    if(stop)runtime.onLessonHostRequest?.(stop);
    setLanguage(next);
   }}>
    <option lang="en" value="en">English</option>
    <option lang="es" value="es">Español</option>
   </select>
  </label>
  {([null,'A','B','C','D'] as const).map(option=>{
   const asset=fq002AudioAsset(questionId,language,option);
   const playing=Boolean(asset&&runtime.activeInteractiveAudioId===asset.id),paused=Boolean(asset&&runtime.pausedInteractiveAudioId===asset.id);
   const subject=option===null?(es?'pregunta':'question'):`${es?'opción':'answer'} ${option}`;
   const action=!asset?(es?'Audio no disponible para':'Audio unavailable for'):playing?(es?'Pausar':'Pause'):paused?(es?'Continuar':'Resume'):(es?'Escuchar':'Listen to');
   return <button key={option??'question'} type="button" disabled={!asset||!ready||runtime.paused} aria-label={`${action} ${subject}`} aria-pressed={playing} data-source-quiz-audio={asset?.id} data-audio-state={playing?'playing':paused?'paused':'idle'} style={{font:'inherit',lineHeight:1.4,minHeight:44,minWidth:0,flex:'1 1 12rem',maxWidth:'100%',padding:'.35em .2em',overflowWrap:'normal',wordBreak:'normal',border:'1px solid currentColor',borderRadius:'.35rem'}} onClick={()=>{
    const request=fq002AudioRequest({questionId,language,option,activeId:runtime.activeInteractiveAudioId,pausedId:runtime.pausedInteractiveAudioId,enabled:runtime.audioEnabled===true,ready,paused:runtime.paused===true});
    if(request)runtime.onLessonHostRequest?.(request);
   }}>{action} {subject}</button>;
  })}
 </div>;
}
