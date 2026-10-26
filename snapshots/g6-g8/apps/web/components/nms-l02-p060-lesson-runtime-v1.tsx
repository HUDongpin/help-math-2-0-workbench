'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {P060AudioController} from '../../../packages/demos/src/nms-l02-p060-audio-v1';
import {P060Session,type P060SessionSnapshot} from '../../../packages/demos/src/nms-l02-p060-session-v1';
import {P060_ID,type P060Event,type P060GlossaryKey} from '../../../packages/demos/src/nms-l02-p060-state-v1';
import {NmsL02P060ProductRendererV1,P060HintContent} from '../../../packages/demos/src/nms-l02-p060-product-renderer-v1';
import {P060_SOURCE_BUTTON_OCCURRENCES,p060SourceTerm} from '../../../packages/demos/src/generated/nms-l02-p060-terms-v1';
import {loadVerifiedPairAudio} from '../../../packages/demos/src/alg-l12-glossary-pair-audio-loader';

/** The source state owns authored stops; the session owns the single audio
 * clock. Entry is paused. Glossary close requires explicit modern Play. */
export function NmsL02P060LessonRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);useLayoutEffect(()=>{latest.current=props;},[props]);
 const owned=useRef<P060Session|null>(null),audio=useRef<P060AudioController|null>(null);
 const [view,setView]=useState<P060SessionSnapshot|null>(null),[failed,setFailed]=useState(false);
 const root=useRef<HTMLDivElement>(null),hint=useRef<HTMLDialogElement>(null),hintTrigger=useRef<HTMLButtonElement|null>(null);
 const pendingGlossary=useRef<{id:string;trigger:HTMLElement;seen:boolean}|null>(null);
 const replay=useRef(0),complete=useRef(false),lastIdentity=useRef('');
 const publish=useCallback((snapshot:P060SessionSnapshot)=>{
  const identity=JSON.stringify(snapshot);
  if(identity!==lastIdentity.current){lastIdentity.current=identity;setView(snapshot);}
 },[]);
 const command=useCallback((event:P060Event)=>{
  void owned.current?.dispatch(event).then(publish).catch(()=>setFailed(true));
 },[publish]);
 const closeGlossary=useCallback(()=>{
  if(!pendingGlossary.current)return;
  latest.current.onLessonHostRequest?.({type:'close-glossary'});
  pendingGlossary.current=null;
  command({type:'glossary-close'});
 },[command]);
 useEffect(()=>{
  if(process.env.NODE_ENV==='production')return;
  let active=true;
  const transport=new P060AudioController({readVerified:async(binding,signal,context)=>{
   const result=await loadVerifiedPairAudio({...binding,path:binding.urlPath},window.location.origin,context,signal,()=>active&&!signal.aborted);
   if(!result)throw Error('P060_AUDIO_CANCELLED');return result;
  }});
  transport.setVolume(latest.current.volume??1);audio.current=transport;
  const session=new P060Session({audio:transport,onChange:snapshot=>{if(active)publish(snapshot);},onComplete:()=>{
   if(active&&!complete.current){complete.current=true;latest.current.onPlaybackComplete?.();}
  }});
  owned.current=session;complete.current=false;publish(session.snapshot());
  latest.current.onRuntimePausedChange(true);
  let handle=0;
  const tick=(now:number)=>{if(active){publish(session.tick(now));handle=requestAnimationFrame(tick);}};
  handle=requestAnimationFrame(tick);
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const changed=()=>{if(media.matches)void session.dispatch({type:'pause'});};
  media.addEventListener('change',changed);
  return()=>{
   active=false;cancelAnimationFrame(handle);media.removeEventListener('change',changed);
   if(pendingGlossary.current){latest.current.onLessonHostRequest?.({type:'close-glossary'});pendingGlossary.current=null;}
   hint.current?.close();if(owned.current===session)owned.current=null;if(audio.current===transport)audio.current=null;
   void session.close().catch(()=>{});
  };
 },[publish]);
 useEffect(()=>props.connectRuntimeControls({
  setPaused(paused){command({type:paused?'pause':'play'});},
  replay(){if(!owned.current)return false;closeGlossary();hint.current?.close();replay.current++;complete.current=false;
   latest.current.onReplay?.();command({type:'replay'});return true;},
  narration(action){command({type:action==='play'?'play':'pause'});},
  stop(){closeGlossary();command({type:'pause'});},
 }),[props.connectRuntimeControls,command,closeGlossary]);
 useEffect(()=>{audio.current?.setVolume(props.volume??1);},[props.volume]);
 // A host support tool can request pause without calling the transport control.
 useEffect(()=>{if(props.paused&&owned.current?.snapshot().phase==='playing')command({type:'pause'});},[props.paused,command]);
 useEffect(()=>{
  if(!view)return;
  const playing=view.phase==='playing'||view.audio.phase==='loading';
  props.onRuntimePausedChange(!playing);
  props.onPlaybackStateChange?.({audioAvailable:!failed,frame:view.state.mainFrame,frameCount:718,
   frameDomain:'sprite-391',fps:12,narration:failed?'unavailable':playing?'playing':'waiting',
   playbackProgress:(view.state.mainFrame-1)/717,seekAvailable:false,stepFrames:0,transportMode:'none'});
 },[view?.state.mainFrame,view?.phase,view?.audio.phase,failed,props.onRuntimePausedChange,props.onPlaybackStateChange]);
 useEffect(()=>{
  const dialog=hint.current;if(!dialog)return;
  if(view?.state.popupVisible&&!view.state.glossaryKey){if(!dialog.open)dialog.showModal();}
  else if(dialog.open)dialog.close();
 },[view?.state.popupVisible,view?.state.glossaryKey]);
 useEffect(()=>{
  const observer=new MutationObserver(()=>{
   const pending=pendingGlossary.current;if(!pending)return;
   const dialog=document.querySelector(`[role="dialog"][data-glossary-entry-id="${pending.id}"]`);
   if(dialog){pending.seen=true;return;}
   if(pending.seen){pendingGlossary.current=null;command({type:'glossary-close'});
    requestAnimationFrame(()=>{if(pending.trigger.isConnected)pending.trigger.focus({preventScroll:true});});}
  });
  observer.observe(document.body,{subtree:true,childList:true});return()=>observer.disconnect();
 },[command]);
 const openTerm=(id:string,key:string,trigger:HTMLElement)=>{
  const session=owned.current;if(!session||pendingGlossary.current)return;
  // dispatch changes source/audio state synchronously before its playback promise.
  void session.dispatch({type:'glossary-open',key:key as P060GlossaryKey}).then(publish);
  if(session.snapshot().state.glossaryKey!==key)return;
  hint.current?.close();
  const decision=latest.current.onLessonHostRequest?.({type:'open-glossary',entryId:id},{trigger});
  if(decision?.status==='allowed')pendingGlossary.current={id,trigger,seen:false};
  else command({type:'glossary-close'});
 };
 if(!view)return <p role="status">{props.labels.loading}</p>;
 const s=view.state,es=props.uiLanguage==='es',locked=!!s.glossaryKey||!!s.feedback||failed;
 const activeControls=P060_SOURCE_BUTTON_OCCURRENCES.filter(c=>{
  const frame=c.spriteId===391?s.mainFrame:c.spriteId===139&&s.box?.spriteId===139?s.box.frame:
   c.spriteId===388&&s.popupVisible?1:null;
  return frame!==null&&frame>=c.firstPlacedFrame&&frame<c.lastFrameExclusive;
 });
 const glossaryControls=(popup:boolean)=><div className="nms-p060-controls" aria-label={es?'Vocabulario':'Vocabulary'}>
  {activeControls.filter(c=>(c.spriteId===388)===popup).map(c=>{
   const term=p060SourceTerm(c.entryId);if(!term)return null;
   return <button key={c.id} type="button" disabled={locked} data-source-instance-id={c.id}
    data-source-character-id={c.characterId} data-source-key-attribute={c.sourceKeyAttribute}
    onClick={event=>openTerm(term.id,c.sourceKeyAttribute,event.currentTarget)}>{term.labels[es?'es':'en']}</button>;
  })}
 </div>;
 const answers=s.mainFrame===699?<div className="nms-p060-answers" data-p060-answer-controls="true">
  {s.quizControlsVisible&&(['A. 0.2','B. 0.25','C. 0.4','D. 0.5'] as const).map((label,index)=><button key={label}
   type="button" disabled={!s.quizControlsEnabled||locked} data-p060-answer={index+1}
   onClick={()=>command({type:'answer',ordinal:(index+1) as 1|2|3|4})}>{label}</button>)}
 </div>:undefined;
 return <div ref={root} className="runtime-shell nms-p060-runtime" data-lesson-presentation="modern-text-v1"
  data-p060-runtime={P060_ID} data-p060-frame={s.mainFrame} data-p060-ready={!failed}
  data-p060-phase={view.phase} data-p060-audio-phase={view.audio.phase} data-p060-audio-domain={view.audio.domain??''}
  data-p060-audio-sample={view.audio.sourceSample} data-p060-box-frame={s.box?.frame??''}
  data-p060-feedback-frame={s.feedback?.frame??''} data-p060-tries={s.quizTryCount} data-p060-replay={replay.current}
  data-canvas-status={failed?'error':'ready'} data-runtime-paused={view.phase!=='playing'}
  style={{'--flash-stage-width':'800px','--flash-stage-height':'600px','--flash-stage-aspect':'800 / 600'} as CSSProperties}>
  <NmsL02P060ProductRendererV1 mainFrame={s.mainFrame} uiLanguage={es?'es':'en'}
   box={s.box?{kind:s.box.spriteId===139?'picture':'calculator',localFrame:s.box.frame}:null}
   feedback={s.feedback?{spriteId:s.feedback.spriteId,localFrame:s.feedback.frame}:null}
   popupOpen={false} answerControls={answers}/>
  <div className="nms-p060-controls">
   {!s.mainPlaying&&[262,400,527,646].includes(s.mainFrame)&&<button type="button" disabled={locked}
    data-p060-continue="true" onClick={()=>command({type:'continue'})}>{es?'Continuar':'Continue'}</button>}
   {!s.mainPlaying&&[527,646].includes(s.mainFrame)&&s.revealClipVisible&&<button type="button" disabled={locked}
    data-p060-reveal="true" onClick={()=>command({type:'reveal'})}>{es?'Ver explicación':'Show explanation'}</button>}
   {s.box&&s.box.frame===1&&!s.box.playing&&<button type="button" disabled={locked}
    data-p060-box-play="true" onClick={()=>command({type:'box-play'})}>{es?'Reproducir explicación':'Play explanation'}</button>}
   {s.box&&s.box.frame===s.box.releaseFrame&&!s.box.playing&&<button type="button" disabled={locked}
    data-p060-box-close="true" onClick={()=>command({type:'box-release'})}>{es?'Cerrar explicación':'Close explanation'}</button>}
   {s.mainFrame===699&&s.hintVisible&&<button type="button" disabled={!s.hintEnabled||locked}
    data-p060-hint="true" onClick={event=>{hintTrigger.current=event.currentTarget;command({type:'hint'});}}>
    {es?'Necesito más ayuda':'Need More Help'}</button>}
  </div>
  {glossaryControls(false)}
  <dialog ref={hint} className="nms-p060-hint" aria-label={es?'Ayuda con fracciones y decimales':'Fraction and decimal hint'}
   onCancel={event=>{event.preventDefault();command({type:'popup-close'});hintTrigger.current?.focus();}}>
   <P060HintContent/>{glossaryControls(true)}
   <button type="button" data-p060-hint-close="true" onClick={()=>{command({type:'popup-close'});hintTrigger.current?.focus();}}>
    {es?'Cerrar':'Close'}</button>
  </dialog>
  {(failed||view.audio.phase==='error')&&<p role="alert">{props.labels.unavailable}</p>}
 </div>;
}
