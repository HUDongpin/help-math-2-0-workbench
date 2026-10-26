'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {P053SourceScene} from '../../../packages/demos/src/nms-l02-p053-source-scene-v1';
import {P053ReadableDirections} from '../../../packages/demos/src/nms-l02-p053-readable-directions-v1';
import {initialP053PlayerState,p053AvailableControls,p053SceneOptions,reduceP053Player,
 type P053PlayerAction} from '../../../packages/demos/src/nms-l02-p053-player-state-v1';
import {createP053SourceAudioLoader,type P053SourceAudioSession,type P053SourceAudioState}
 from '../../../packages/demos/src/nms-l02-p053-source-audio-loader';
import {p053StartHostRequest} from '../../../packages/demos/src/nms-l02-p053-host-navigation-v1';
import type {LessonRuntimeAdapterProps} from '@/lib/lesson-runtime-adapter';

const ID='shared-nms002-l02-p053';
/** Source-static frame projection with independent, explicit narration. Neither
 * the visual hold nor narration end reports reviewed-page completion. */
export function NmsL02P053LessonRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;
 const [state,setState]=useState(initialP053PlayerState);
 const current=useRef(state);
 const mounted=useRef(false);
 const [audioState,setAudioState]=useState<P053SourceAudioState>({status:'idle',playing:false,volume:1});
 const audio=useRef<P053SourceAudioSession|null>(null);
 const valid=props.animationId===ID&&props.moduleKey===ID&&props.query.lang==='en'&&
  props.query.frameDomain==='sprite-187'&&props.query.scenario==='source-directions-v1';
 const es=props.uiLanguage==='es';
 const dispatch=useCallback((action:P053PlayerAction)=>{
  if(!mounted.current)return current.current;
  const next=reduceP053Player(current.current,action);current.current=next;setState(next);
  return next;
 },[]);
 const stop=useCallback(()=>{audio.current?.stop();dispatch({type:'pause'});},[dispatch]);
 const narration=useCallback((action:'play'|'stop')=>{
  dispatch({type:'pause'});
  if(action==='stop')audio.current?.stop();else void audio.current?.play();
 },[dispatch]);
 useEffect(()=>{
  if(!valid)return;
  mounted.current=true;
  const session=createP053SourceAudioLoader(undefined,next=>{if(mounted.current)setAudioState(next);});audio.current=session;
  session.setVolume(latest.current.volume??1);
  const disconnect=latest.current.connectRuntimeControls({
   setPaused(paused){session.stop();dispatch({type:paused?'pause':'play'});},
   replay(){session.stop();dispatch({type:'replay'});return true;},
   narration,stop,
  });
  return()=>{mounted.current=false;current.current=reduceP053Player(current.current,{type:'pause'});
   session.dispose();audio.current=null;disconnect();};
 },[valid,dispatch,narration,stop,props.connectRuntimeControls]);
 useEffect(()=>{audio.current?.setVolume(props.volume??1);},[props.volume]);
 useEffect(()=>{
  if(!valid||!state.playing)return;
  const generation=state.clock.generation;
  const timer=setInterval(()=>dispatch({type:'tick',nowMs:performance.now(),generation}),1000/24);
  return()=>clearInterval(timer);
 },[valid,state.playing,state.clock.generation,dispatch]);
 useEffect(()=>{
  if(!valid)return;
  latest.current.onRuntimePausedChange(!state.playing);
  latest.current.onPlaybackStateChange?.({audioAvailable:true,frame:state.mainFrame,
   frameCount:693,frameDomain:'sprite-187',fps:12,narration:audioState.playing?'playing':
    audioState.status==='loading'?'waiting':audioState.status==='error'?'blocked':'idle',
   playbackProgress:(state.mainFrame-1)/692,seekAvailable:false,stepFrames:0,transportMode:'none'});
 },[valid,state.mainFrame,state.playing,audioState]);
 useEffect(()=>{if(props.seekRequest)stop();},[props.seekRequest,stop]);
 const unresolved=state.controller.directionsPopupVisible==='unresolved-after-close';
 const perform=(action:P053PlayerAction)=>{
  if(['repeat','skip','close-popup','start'].includes(action.type))audio.current?.stop();
  const next=dispatch(action);
  if(action.type==='start'&&next.startIntent){
   stop();
   const request=p053StartHostRequest(next.startIntent,ID);
   latest.current.onLessonHostRequest?.(request);
   // Same-placement navigation may preserve the React instance. Explicitly
   // project the source host's reload without relying on component remount.
   if(request.targetAnimationId===ID){
    current.current=initialP053PlayerState();setState(current.current);
   }
  }
 };
 if(!valid)return <section role="alert" data-p053-runtime-status="blocked">
  {es?'El contexto de las instrucciones no está disponible.':'The directions context is unavailable.'}</section>;
 return <section className="p053-host" data-animation-id={ID} data-p053-runtime-status="contextual-candidate"
  data-p053-frame={state.mainFrame} data-p053-playing={String(state.playing)}
  data-p053-level={state.controller.selectedLevel??'none'} data-p053-audio={audioState.status}
  data-p053-level-message={String(state.controller.levelMessageVisible)}
  data-p053-popup={String(state.controller.directionsPopupVisible)}>
  {unresolved?<div role="alert" className="p053-hold">
   {es?'La vista después de cerrar las instrucciones está pendiente de verificar. Usa Repetir para volver al inicio.':
    'The view after closing directions is pending verification. Use Replay to return to the beginning.'}
  </div>:<P053SourceScene {...p053SceneOptions(state)}/>}
  {state.controller.directionsPopupVisible===true&&<P053ReadableDirections uiLanguage={props.uiLanguage??'en'}/>}
  {!unresolved&&<div className="p053-controls" aria-label={es?'Controles de las instrucciones':'Directions controls'}>
   {p053AvailableControls(state).map(control=><button key={control.sourceName} type="button"
    data-p053-control={control.sourceName} data-source-alpha={control.sourceAlpha256}
    disabled={!control.controlsEnabled}
    aria-pressed={control.action.startsWith('select-level')?
     state.controller.selectedLevel===(control.action==='select-level-1'?1:2):undefined}
    onMouseEnter={()=>{if(current.current.controller.controlsEnabled&&
      p053AvailableControls(current.current).some(c=>c.sourceName===control.sourceName))
      perform({type:'hover',control:control.sourceName});}}
    onMouseLeave={()=>{if(current.current.controller.controlsEnabled&&
      p053AvailableControls(current.current).some(c=>c.sourceName===control.sourceName))
      perform({type:'leave',control:control.sourceName});}}
    onClick={()=>perform(control.action==='select-level-1'||control.action==='select-level-2'
     ?{type:'select-level',level:control.action==='select-level-1'?1:2}
     :{type:control.action})}>{control.sourceLabel}</button>)}
   {state.controller.directionsPopupVisible===true&&<button type="button" data-p053-close
    onClick={()=>perform({type:'close-popup'})}>{es?'Cerrar instrucciones':'Close directions'}</button>}
  </div>}
  {state.controller.inlineMessage&&<p role="status">{state.controller.inlineMessage}</p>}
  <div className="p053-controls">
   <button type="button" onClick={()=>{audio.current?.stop();dispatch({type:'replay'});}}>
    {es?'Repetir desde el inicio':'Replay from beginning'}</button>
   <button type="button" disabled={audioState.status==='loading'||audioState.playing}
    onClick={()=>narration('play')}>{es?'Escuchar instrucciones en inglés':'Listen to English directions'}</button>
   <button type="button" disabled={audioState.status==='idle'} onClick={()=>narration('stop')}>
    {es?'Detener audio':'Stop audio'}</button>
  </div>
  <p>{es?'La imagen se pausa mientras escuchas. Reanuda la animación con Reproducir.':
   'The picture pauses while you listen. Resume the animation with Play.'}</p>
  {audioState.status==='error'&&<p role="alert">{es?'No se pudo reproducir el audio. Puedes intentarlo otra vez.':
   'Audio could not play. You can try again.'}</p>}
 </section>;
}
