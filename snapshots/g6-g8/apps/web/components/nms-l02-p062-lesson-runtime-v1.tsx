'use client';
import {useCallback,useEffect,useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';
import {P062AudioController} from '../../../packages/demos/src/nms-l02-p062-audio-v1';
import {P062Session,type P062SessionSnapshot} from '../../../packages/demos/src/nms-l02-p062-session-v1';
import {P062_ID,type P062Event} from '../../../packages/demos/src/nms-l02-p062-state-v1';
import {NmsL02P062ProductRendererV1,P062HintContent} from '../../../packages/demos/src/nms-l02-p062-product-renderer-v1';
import {loadVerifiedPairAudio} from '../../../packages/demos/src/alg-l12-glossary-pair-audio-loader';

/** The source state owns authored stops; the session owns the single audio
 * clock. Entry is paused and no KeyAttribute glossary controls are created. */
export function NmsL02P062LessonRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);useLayoutEffect(()=>{latest.current=props;},[props]);
 const owned=useRef<P062Session|null>(null),audio=useRef<P062AudioController|null>(null);
 const [view,setView]=useState<P062SessionSnapshot|null>(null),[failed,setFailed]=useState(false);
 const root=useRef<HTMLDivElement>(null),hint=useRef<HTMLDialogElement>(null),hintTrigger=useRef<HTMLButtonElement|null>(null);
 const replay=useRef(0),complete=useRef(false),lastIdentity=useRef('');
 const publish=useCallback((snapshot:P062SessionSnapshot)=>{
  const identity=JSON.stringify(snapshot);
  if(identity!==lastIdentity.current){lastIdentity.current=identity;setView(snapshot);}
 },[]);
 const command=useCallback((event:P062Event)=>{
  const session=owned.current;if(!session)return;
  void session.dispatch(event).then(snapshot=>{
   if(owned.current===session)publish(snapshot);
  }).catch(()=>{if(owned.current===session)setFailed(true);});
 },[publish]);
 useEffect(()=>{
  if(process.env.NODE_ENV==='production')return;
  let active=true;
  const transport=new P062AudioController({readVerified:async(binding,signal,context)=>{
   const result=await loadVerifiedPairAudio({...binding,path:binding.urlPath},window.location.origin,context,signal,()=>active&&!signal.aborted);
   if(!result)throw Error('P062_AUDIO_CANCELLED');return result;
  }});
  transport.setVolume(latest.current.volume??1);audio.current=transport;
  const session=new P062Session({audio:transport,onChange:snapshot=>{if(active)publish(snapshot);},onComplete:()=>{
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
   hint.current?.close();if(owned.current===session)owned.current=null;if(audio.current===transport)audio.current=null;
   void session.close().catch(()=>{});
  };
 },[publish]);
 useEffect(()=>props.connectRuntimeControls({
  setPaused(paused){command({type:paused?'pause':'play'});},
  replay(){if(!owned.current)return false;hint.current?.close();replay.current++;complete.current=false;
   latest.current.onReplay?.();command({type:'replay'});return true;},
  narration(action){command({type:action==='play'?'play':'pause'});},
  stop(){command({type:'pause'});},
 }),[props.connectRuntimeControls,command]);
 useEffect(()=>{audio.current?.setVolume(props.volume??1);},[props.volume]);
 // A host support tool can request pause without calling the transport control.
 useEffect(()=>{if(props.paused&&owned.current?.snapshot().phase==='playing')command({type:'pause'});},[props.paused,command]);
 useEffect(()=>{
  if(!view)return;
  const playing=view.phase==='playing'||view.audio.phase==='loading';
  props.onRuntimePausedChange(!playing);
  props.onPlaybackStateChange?.({audioAvailable:!failed,frame:view.state.mainFrame,frameCount:834,
   frameDomain:'sprite-315',fps:12,narration:failed?'unavailable':playing?'playing':'waiting',
   playbackProgress:(view.state.mainFrame-1)/833,seekAvailable:false,stepFrames:0,transportMode:'none'});
 },[view?.state.mainFrame,view?.phase,view?.audio.phase,failed,props.onRuntimePausedChange,props.onPlaybackStateChange]);
 useEffect(()=>{
  const dialog=hint.current;if(!dialog)return;
  if(view?.state.popupVisible){if(!dialog.open)dialog.showModal();}
  else if(dialog.open)dialog.close();
 },[view?.state.popupVisible]);
 if(!view)return <p role="status">{props.labels.loading}</p>;
 const s=view.state,es=props.uiLanguage==='es',locked=!!s.feedback||failed;
 const answers=s.mainFrame===815?<div className="nms-p062-answers" data-p062-answer-controls="true">
  {s.quizControlsVisible&&(['A. $20.08','B. $20.80','C. $21.60','D. $21.80'] as const).map((label,index)=><button key={label}
   type="button" disabled={!s.quizControlsEnabled||locked} data-p062-answer={index+1}
   onClick={()=>command({type:'answer',ordinal:(index+1) as 1|2|3|4})}>{label}</button>)}
 </div>:undefined;
 return <div ref={root} className="runtime-shell nms-p062-runtime" data-lesson-presentation="modern-text-v1"
  data-p062-runtime={P062_ID} data-p062-frame={s.mainFrame} data-p062-ready={!failed}
  data-p062-phase={view.phase} data-p062-audio-phase={view.audio.phase} data-p062-audio-domain={view.audio.domain??''}
  data-p062-audio-sample={view.audio.sourceSample} data-p062-box-frame={s.box?.frame??''}
  data-p062-feedback-frame={s.feedback?.frame??''} data-p062-tries={s.quizTryCount} data-source-glossary-controls="0" data-p062-replay={replay.current}
  data-canvas-status={failed?'error':'ready'} data-runtime-paused={view.phase!=='playing'}
  style={{'--flash-stage-width':'800px','--flash-stage-height':'600px','--flash-stage-aspect':'800 / 600'} as CSSProperties}>
  <NmsL02P062ProductRendererV1 mainFrame={s.mainFrame} uiLanguage={es?'es':'en'}
   box={s.box?{spriteId:s.box.spriteId,localFrame:s.box.frame}:null}
   feedback={s.feedback?{spriteId:s.feedback.spriteId,localFrame:s.feedback.frame}:null}
   popupOpen={false} answerControls={answers}/>
  <div className="nms-p062-controls">
   {!s.mainPlaying&&[384,523,650,766].includes(s.mainFrame)&&<button type="button" disabled={locked}
    data-p062-continue="true" onClick={()=>command({type:'continue'})}>{es?'Continuar':'Continue'}</button>}
   {!s.mainPlaying&&[650,766].includes(s.mainFrame)&&s.revealClipVisible&&<button type="button" disabled={locked}
    data-p062-reveal="true" onClick={()=>command({type:'reveal'})}>{es?'Ver explicación':'Show explanation'}</button>}
   {s.box&&s.box.frame===1&&!s.box.playing&&<button type="button" disabled={locked}
    data-p062-box-play="true" onClick={()=>command({type:'box-play'})}>{es?'Reproducir explicación':'Play explanation'}</button>}
   {s.box&&s.box.frame===s.box.releaseFrame&&!s.box.playing&&<button type="button" disabled={locked}
    data-p062-box-close="true" onClick={()=>command({type:'box-release'})}>{es?'Cerrar explicación':'Close explanation'}</button>}
   {s.mainFrame===815&&s.hintVisible&&<button type="button" disabled={!s.hintEnabled||locked}
    data-p062-hint="true" onClick={event=>{hintTrigger.current=event.currentTarget;command({type:'hint'});}}>
    {es?'Necesito más ayuda':'Need More Help'}</button>}
  </div>
  <dialog ref={hint} className="nms-p062-hint" aria-label={es?'Ayuda con porcentajes':'Percent hint'}
   onCancel={event=>{event.preventDefault();command({type:'popup-close'});hintTrigger.current?.focus();}}>
   <P062HintContent/>
   <button type="button" data-p062-hint-close="true" onClick={()=>{command({type:'popup-close'});hintTrigger.current?.focus();}}>
    {es?'Cerrar':'Close'}</button>
  </dialog>
  {(failed||view.audio.phase==='error')&&<p role="alert">{props.labels.unavailable}</p>}
 </div>;
}
