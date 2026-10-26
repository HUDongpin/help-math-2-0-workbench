'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {P061AudioController} from '../../../packages/demos/src/nms-l02-p061-audio-v1';
import {P061Session,type P061SessionSnapshot} from '../../../packages/demos/src/nms-l02-p061-session-v1';
import {P061_ID,type P061Event,type P061GlossaryKey} from '../../../packages/demos/src/nms-l02-p061-state-v1';
import {NmsL02P061ProductRendererV1,P061HintContent} from '../../../packages/demos/src/nms-l02-p061-product-renderer-v1';
import {P061_SOURCE_BUTTON_OCCURRENCES,p061SourceTerm} from '../../../packages/demos/src/generated/nms-l02-p061-terms-v1';
import {loadVerifiedPairAudio} from '../../../packages/demos/src/alg-l12-glossary-pair-audio-loader';

/** The source state owns authored stops; the session owns the single audio
 * clock. Entry is paused. Glossary close requires explicit modern Play. */
export function NmsL02P061LessonRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);useLayoutEffect(()=>{latest.current=props;},[props]);
 const owned=useRef<P061Session|null>(null),audio=useRef<P061AudioController|null>(null);
 const [view,setView]=useState<P061SessionSnapshot|null>(null),[failed,setFailed]=useState(false);
 const root=useRef<HTMLDivElement>(null),hint=useRef<HTMLDialogElement>(null),hintTrigger=useRef<HTMLButtonElement|null>(null);
 const pendingGlossary=useRef<{id:string;trigger:HTMLElement;seen:boolean}|null>(null);
 const replay=useRef(0),complete=useRef(false),lastIdentity=useRef('');
 const publish=useCallback((snapshot:P061SessionSnapshot)=>{
  const identity=JSON.stringify(snapshot);
  if(identity!==lastIdentity.current){lastIdentity.current=identity;setView(snapshot);}
 },[]);
 const command=useCallback((event:P061Event)=>{
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
  const transport=new P061AudioController({readVerified:async(binding,signal,context)=>{
   const result=await loadVerifiedPairAudio({...binding,path:binding.urlPath},window.location.origin,context,signal,()=>active&&!signal.aborted);
   if(!result)throw Error('P061_AUDIO_CANCELLED');return result;
  }});
  transport.setVolume(latest.current.volume??1);audio.current=transport;
  const session=new P061Session({audio:transport,onChange:snapshot=>{if(active)publish(snapshot);},onComplete:()=>{
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
  props.onPlaybackStateChange?.({audioAvailable:!failed,frame:view.state.mainFrame,frameCount:879,
   frameDomain:'sprite-315',fps:12,narration:failed?'unavailable':playing?'playing':'waiting',
   playbackProgress:(view.state.mainFrame-1)/878,seekAvailable:false,stepFrames:0,transportMode:'none'});
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
  void session.dispatch({type:'glossary-open',key:key as P061GlossaryKey}).then(publish);
  if(session.snapshot().state.glossaryKey!==key)return;
  hint.current?.close();
  const decision=latest.current.onLessonHostRequest?.({type:'open-glossary',entryId:id},{trigger});
  if(decision?.status==='allowed')pendingGlossary.current={id,trigger,seen:false};
  else command({type:'glossary-close'});
 };
 if(!view)return <p role="status">{props.labels.loading}</p>;
 const s=view.state,es=props.uiLanguage==='es',locked=!!s.glossaryKey||!!s.feedback||failed;
 const activeControls=P061_SOURCE_BUTTON_OCCURRENCES.filter(c=>{
  const frame=c.spriteId===315?s.mainFrame:c.spriteId===111&&s.box?.spriteId===111?s.box.frame:
   c.spriteId===314&&s.popupVisible?1:null;
  return frame!==null&&frame>=c.firstPlacedFrame&&frame<c.lastFrameExclusive;
 });
 const glossaryControls=(popup:boolean)=><div className="nms-p061-controls" aria-label={es?'Vocabulario':'Vocabulary'}>
  {activeControls.filter(c=>(c.spriteId===314)===popup).map(c=>{
   const term=p061SourceTerm(c.entryId);if(!term)return null;
   return <button key={c.id} type="button" disabled={locked} data-source-instance-id={c.id}
    data-source-character-id={c.characterId} data-source-key-attribute={c.sourceKeyAttribute}
    onClick={event=>openTerm(term.id,c.sourceKeyAttribute,event.currentTarget)}>{term.labels[es?'es':'en']}</button>;
  })}
 </div>;
 const answers=s.mainFrame===860?<div className="nms-p061-answers" data-p061-answer-controls="true">
  {s.quizControlsVisible&&(['A. $250','B. $750','C. $1,025','D. $1,250'] as const).map((label,index)=><button key={label}
   type="button" disabled={!s.quizControlsEnabled||locked} data-p061-answer={index+1}
   onClick={()=>command({type:'answer',ordinal:(index+1) as 1|2|3|4})}>{label}</button>)}
 </div>:undefined;
 return <div ref={root} className="runtime-shell nms-p061-runtime" data-lesson-presentation="modern-text-v1"
  data-p061-runtime={P061_ID} data-p061-frame={s.mainFrame} data-p061-ready={!failed}
  data-p061-phase={view.phase} data-p061-audio-phase={view.audio.phase} data-p061-audio-domain={view.audio.domain??''}
  data-p061-audio-sample={view.audio.sourceSample} data-p061-box-frame={s.box?.frame??''}
  data-p061-feedback-frame={s.feedback?.frame??''} data-p061-tries={s.quizTryCount} data-p061-replay={replay.current}
  data-canvas-status={failed?'error':'ready'} data-runtime-paused={view.phase!=='playing'}
  style={{'--flash-stage-width':'800px','--flash-stage-height':'600px','--flash-stage-aspect':'800 / 600'} as CSSProperties}>
  <NmsL02P061ProductRendererV1 mainFrame={s.mainFrame} uiLanguage={es?'es':'en'}
   box={s.box?{spriteId:s.box.spriteId,localFrame:s.box.frame}:null}
   feedback={s.feedback?{spriteId:s.feedback.spriteId,localFrame:s.feedback.frame}:null}
   popupOpen={false} answerControls={answers}/>
  <div className="nms-p061-controls">
   {!s.mainPlaying&&[435,573,700,817].includes(s.mainFrame)&&<button type="button" disabled={locked}
    data-p061-continue="true" onClick={()=>command({type:'continue'})}>{es?'Continuar':'Continue'}</button>}
   {!s.mainPlaying&&[700,817].includes(s.mainFrame)&&s.revealClipVisible&&<button type="button" disabled={locked}
    data-p061-reveal="true" onClick={()=>command({type:'reveal'})}>{es?'Ver explicación':'Show explanation'}</button>}
   {s.box&&s.box.frame===1&&!s.box.playing&&<button type="button" disabled={locked}
    data-p061-box-play="true" onClick={()=>command({type:'box-play'})}>{es?'Reproducir explicación':'Play explanation'}</button>}
   {s.box&&s.box.frame===s.box.releaseFrame&&!s.box.playing&&<button type="button" disabled={locked}
    data-p061-box-close="true" onClick={()=>command({type:'box-release'})}>{es?'Cerrar explicación':'Close explanation'}</button>}
   {s.mainFrame===860&&s.hintVisible&&<button type="button" disabled={!s.hintEnabled||locked}
    data-p061-hint="true" onClick={event=>{hintTrigger.current=event.currentTarget;command({type:'hint'});}}>
    {es?'Necesito más ayuda':'Need More Help'}</button>}
  </div>
  {glossaryControls(false)}
  <dialog ref={hint} className="nms-p061-hint" aria-label={es?'Ayuda con porcentajes':'Percent hint'}
   onCancel={event=>{event.preventDefault();command({type:'popup-close'});hintTrigger.current?.focus();}}>
   <P061HintContent/>{glossaryControls(true)}
   <button type="button" data-p061-hint-close="true" onClick={()=>{command({type:'popup-close'});hintTrigger.current?.focus();}}>
    {es?'Cerrar':'Close'}</button>
  </dialog>
  {(failed||view.audio.phase==='error')&&<p role="alert">{props.labels.unavailable}</p>}
 </div>;
}
