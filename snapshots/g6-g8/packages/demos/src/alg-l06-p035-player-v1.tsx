'use client';
/** Maintained P035 My Lesson composition draft. Registration is a separate gate. */
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import {P035_FEEDBACK,P035_SOURCE,type P035Choice,type P035Glossary}
 from './alg-l06-p035-state-v1';
import {P035MeasuredAudioIntegrationV1,type P035MeasuredAudioOptions}
 from './alg-l06-p035-measured-audio-v1';
import type {P035MeasuredDomainId}
 from './alg-l06-p035-measured-bindings-v1';
import {P035VisualCompositionDraft,type P035CanvasAsset,
 type P035VisualHandle,type P035VisualOwner}
 from './alg-l06-p035-visual-v1';
import {p035HostVariant,p035InteractionOwnerFor,p035ValidateHostVariants,
 p035VariantRequest,type P035HostVariants}
 from './alg-l06-p035-player-model-v1';

type Owner=P035MeasuredAudioIntegrationV1;
type Snapshot=ReturnType<Owner['snapshot']>;
type Result={accepted:boolean;reason:string};
const INIT_FAILURE_CODES=new Set([
 'P035_HOST_VARIANT_UNAVAILABLE','P035_BASE_URL_INVALID',
 'P035_SOURCE_URL_NOT_ROOT_RELATIVE','P035_SOURCE_URL_OUT_OF_SCOPE',
 'P035_SOURCE_URL_COLLISION','P035_INVALID_MEASURED_TRANSPORT',
 'P035_MISSING_MEASURED_TRANSPORT','P035_SOURCE_AUDIO_PLAN_DRIFT',
 'P035_CLOCK_OWNER_MISSING','P035_TRANSPORT_FACTORY_MISSING',
 'P035_INITIAL_CANVAS_FRAME_NOT_COMMITTED','P035_CANVAS_COMMIT_MISMATCH',
 'P035_CANVAS_SIZE','P035_MAIN_FRAME','P035_INVALID_MAIN_FRAME',
 'P035_SOURCE_HTTP_BINDING','P035_SOURCE_HTTP_ENVELOPE',
 'P035_SOURCE_HTTP_BODY_MISSING','P035_SOURCE_HTTP_OVERLONG',
 'P035_SOURCE_HTTP_EARLY_EOF','P035_SOURCE_SHA256_MISMATCH',
]);
const failureCode=(reason:string):string=>{
 const code=reason.match(/\bP035_[A-Z0-9_]{1,64}\b/)?.[0];
 if(code&&INIT_FAILURE_CODES.has(code))return code;
 if(reason==='Lesson visual is unavailable.')return 'P035_VISUAL_UNAVAILABLE';
 if(reason==='invalid-volume'||reason==='Error: volume: invalid-volume')
  return 'P035_VOLUME_REJECTED';
 return 'P035_UNCLASSIFIED_FAILURE';
};
export type P035PlayerControls={setPaused:(paused:boolean)=>void;
 replay:()=>boolean;narration:(action:'play'|'stop')=>void;
 stop:()=>void;closeGlossary:()=>void};
export type P035PlayerProps={
 canvasAsset:P035CanvasAsset|null;
 sourceUrls:Readonly<Record<P035MeasuredDomainId,string>>;
 baseUrl:string;feedbackVariants:P035HostVariants;
 renderGlossary?:(key:P035Glossary)=>React.ReactNode;
 onOpenGlossary?:(key:P035Glossary,trigger:HTMLButtonElement)=>void;
 nativeTextTarget?:HTMLElement|null;
 volume?:number;
 language?:'en'|'es';hidePlaybackControls?:boolean;
 fetchSource?:P035MeasuredAudioOptions['fetchSource'];
 createContext?:P035MeasuredAudioOptions['createContext'];
 connectControls?:(controls:P035PlayerControls)=>void|(()=>void);
 onSnapshot?:(snapshot:Snapshot)=>void;
};
const choiceFor=(letter:string,value:string,handler:'right'|'wrong'):
 P035Choice|null=>{
 if(!Object.prototype.hasOwnProperty.call(P035_SOURCE.choices,letter))return null;
 const key=letter as P035Choice,source=P035_SOURCE.choices[key];
 if(source.text!==value||(key==='B')!==(handler==='right'))return null;
 return key;
};

/** Host-selected feedback variants are prepared before choices. A click can
 * therefore request playback in its real user gesture, with no invented
 * shell-selection rule or after-await user-activation claim. */
export function P035PlayerV1({canvasAsset,sourceUrls,baseUrl,
 feedbackVariants,renderGlossary,onOpenGlossary,nativeTextTarget,volume=1,
 language='en',hidePlaybackControls=false,
 fetchSource,createContext,connectControls,onSnapshot}:P035PlayerProps){
 const visual=useRef<P035VisualHandle>(null),owner=useRef<Owner|null>(null);
 const root=useRef<HTMLDivElement>(null);
 const mounted=useRef(false),generation=useRef(0),raf=useRef<number|null>(null);
 const startingTicket=useRef<number|null>(null),paintSerial=useRef(0);
 const failing=useRef(false);
 const ready=useRef(false),painted=useRef<{frame:number;feedbackId:number|null;
  feedbackFrame:number|null}|null>(null),prepared=useRef(new Set<P035MeasuredDomainId>());
 const choiceTrigger=useRef<HTMLButtonElement|null>(null);
 const glossaryTrigger=useRef<HTMLButtonElement|null>(null);
 const closeGlossaryButton=useRef<HTMLButtonElement>(null);
 const playButton=useRef<HTMLButtonElement>(null);
 const lastPhase=useRef<string>('prequiz');
 const [initialPaint,setInitialPaint]=useState<{
  asset:P035CanvasAsset;serial:number}|null>(null);
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null);
 const [status,setStatus]=useState<'loading'|'ready'|'failed'>('loading');
 const [error,setError]=useState(''),[saPreparing,setSaPreparing]=useState(false);
 const [errorCode,setErrorCode]=useState('none');
 const observer=useRef(onSnapshot),glossaryContent=useRef(renderGlossary);
 const externalGlossary=useRef(onOpenGlossary),volumeRef=useRef(volume);
 const nativeTarget=useRef(nativeTextTarget);
 const saPreparingRef=useRef(false),hostVariants=useRef(feedbackVariants);
 const choiceKey=useRef<string|null>(null),glossaryKey=useRef<string|null>(null);
 observer.current=onSnapshot;glossaryContent.current=renderGlossary;
 externalGlossary.current=onOpenGlossary;volumeRef.current=volume;
 nativeTarget.current=nativeTextTarget;
 const nativeButtons=(selector:string):HTMLButtonElement[]=>[
  ...root.current?.querySelectorAll<HTMLButtonElement>(selector)??[],
  ...nativeTarget.current?.querySelectorAll<HTMLButtonElement>(selector)??[]];
 const urlsKey=JSON.stringify(sourceUrls),variantsKey=JSON.stringify(feedbackVariants);

 const stopLoop=()=>{if(raf.current!==null)cancelAnimationFrame(raf.current);raf.current=null;};
 const reconcileCanvas=(next:Snapshot):boolean=>{
  const fb=next.state.feedback,prior=painted.current;
  if(prior?.frame===next.state.mainFrame&&
   prior.feedbackId===(fb?.characterId??null)&&
   prior.feedbackFrame===(fb?.frame??null))return true;
  return fb?visual.current?.commitFeedback(fb.characterId,fb.frame)===true:
   visual.current?.commitMain(next.state.mainFrame)===true;
 };
 const publish=(instance:Owner,synchronous=false)=>{
  if(!mounted.current||owner.current!==instance)return;
  const next=instance.snapshot();
  if(synchronous&&!reconcileCanvas(next)){
   failed('Lesson visual is unavailable.');return;
  }
  if(synchronous)flushSync(()=>setSnapshot(next));else setSnapshot(next);
  try{observer.current?.(next);}catch{setError('Lesson update unavailable.');}
 };
 const failed=(reason:string)=>{
  if(failing.current)return;
  failing.current=true;ready.current=false;stopLoop();owner.current?.pause();
  setErrorCode(failureCode(reason));
  setError('Lesson playback is unavailable.');setStatus('failed');
 };
 const requireAccepted=(result:Result,action:string)=>{
  if(!result.accepted)throw Error(`${action}: ${result.reason}`);
 };
 const shouldTick=(s:Snapshot)=>s.phase==='playing'&&
  s.state.supplemental==='off'&&
  (s.state.mainPlaying||s.state.phase==='feedback-playing'||s.mainFinalAudioTailPending);
 const loop=useRef<()=>void>(()=>{});
 loop.current=()=>{
  if(raf.current!==null)return;
  const instance=owner.current;if(!instance||!shouldTick(instance.snapshot()))return;
  raf.current=requestAnimationFrame(()=>{
   raf.current=null;
   const current=owner.current;if(!current||current!==instance||!mounted.current)return;
   void current.tick().then(()=>{
    if(owner.current!==current||!mounted.current)return;
    publish(current,true);loop.current();
   }).catch(e=>{if(owner.current===current)failed(String(e));});
  });
 };

 const onPainted=useCallback((state:{localFrame:number;
  feedback:null|{spriteId:number;localFrame:number}})=>{
  painted.current={frame:state.localFrame,
   feedbackId:state.feedback?.spriteId??null,
   feedbackFrame:state.feedback?.localFrame??null};
  // A fresh child paint is the readiness signal. Strict Mode can clean up and
  // remount the visual while the parent still holds an older paint state.
  if(state.localFrame===1&&state.feedback===null&&canvasAsset&&
   !owner.current&&startingTicket.current===null)
   setInitialPaint({asset:canvasAsset,serial:++paintSerial.current});
 },[canvasAsset]);

 useEffect(()=>{
  mounted.current=true;
  return()=>{mounted.current=false;generation.current++;stopLoop();ready.current=false;
   choiceTrigger.current=null;glossaryTrigger.current=null;painted.current=null;
   const old=owner.current;owner.current=null;if(old)void old.close();};
 },[]);
 useEffect(()=>{
  if(initialPaint?.asset!==canvasAsset||!canvasAsset||!visual.current)return;
  const ticket=++generation.current;
  let disposed=false,unsubscribe:(()=>void)|null=null,instance:Owner|null=null;
  let launchTimer:ReturnType<typeof setTimeout>|null=null;
  ready.current=false;prepared.current=new Set();failing.current=false;
  setStatus('loading');setError('');setErrorCode('none');
  try{p035ValidateHostVariants(feedbackVariants);
   hostVariants.current={...feedbackVariants};}
  catch(e){failed(String(e));return;}
  // Constructing the owner commits frame 1 synchronously. Run that commit
  // after the child's layout-effect setup and Strict Mode cleanup have settled.
  launchTimer=setTimeout(()=>{launchTimer=null;
   if(disposed||generation.current!==ticket||!mounted.current||
    painted.current?.frame!==1||painted.current.feedbackId!==null||
    painted.current.feedbackFrame!==null||!visual.current)return;
   startingTicket.current=ticket;
   void (async()=>{
   try{
    instance=await P035MeasuredAudioIntegrationV1.create({
     nowSeconds:()=>performance.now()/1000,
     commitMain:frame=>visual.current?.commitMain(frame)===true,
     commitFeedback:(id,frame)=>visual.current?.commitFeedback(id,frame)===true,
     sourceUrls,baseUrl,fetchSource,createContext});
    if(disposed||generation.current!==ticket){await instance.close();return;}
    requireAccepted(instance.setVolume(volumeRef.current),'volume');
    owner.current=instance;
    unsubscribe=instance.subscribe(()=>publish(instance!));
    publish(instance);
    for(const id of ['main',...p035ValidateHostVariants(feedbackVariants)] as
      P035MeasuredDomainId[]){
      requireAccepted(await instance.prepare(id),`prepare ${String(id)}`);
      if(disposed||generation.current!==ticket)return;
      prepared.current.add(id);
    }
    if(disposed||generation.current!==ticket)return;
    ready.current=true;setStatus('ready');publish(instance,true);
   }catch(e){if(!disposed&&generation.current===ticket)failed(String(e));}
   finally{if(startingTicket.current===ticket)startingTicket.current=null;}
   })();
  },0);
  return()=>{disposed=true;generation.current++;stopLoop();ready.current=false;
   if(launchTimer!==null)clearTimeout(launchTimer);
   if(startingTicket.current===ticket)startingTicket.current=null;
   unsubscribe?.();if(instance){if(owner.current===instance)owner.current=null;
    void instance.close();}};
 // `urlsKey`/`variantsKey` ensure changed source or host policy remounts owner.
 },[initialPaint,canvasAsset,urlsKey,variantsKey,baseUrl,fetchSource,createContext]);
 useEffect(()=>{
  const current=owner.current;if(!current)return;
  const result=current.setVolume(volume);
  if(!result.accepted)failed(result.reason);
 },[volume]);

 const readCurrentOwner=useCallback(():P035VisualOwner|null=>{
  const current=owner.current;if(!current||!mounted.current||
   initialPaint?.asset!==canvasAsset)return null;
  const now=current.snapshot(),paint=painted.current;
  const matched=paint?.frame===now.state.mainFrame&&
   paint.feedbackId===(now.state.feedback?.characterId??null)&&
   paint.feedbackFrame===(now.state.feedback?.frame??null);
  return {...p035InteractionOwnerFor(now,ready.current&&matched),phase:now.state.phase};
 },[initialPaint,canvasAsset]);
 const initialState=useRef({state:{phase:'prequiz' as const,mainFrame:1},
  mainAudioToken:0,feedbackEpoch:0,supplementalEpoch:0,generation:0});
 const visualOwner:P035VisualOwner=snapshot?
  {...p035InteractionOwnerFor(snapshot,ready.current&&initialPaint?.asset===canvasAsset&&
    painted.current?.frame===snapshot.state.mainFrame),phase:snapshot.state.phase}:
  {mainFrame:initialState.current.state.mainFrame,mainAudioToken:0,
   feedbackEpoch:0,spanishEpoch:0,interactionEpoch:0,feedback:null,
   inputLocked:true,glossaryOpen:false,spanishSelected:false,
   canChoose:false,canOpenGlossary:false,canCloseFeedback:false,phase:'prequiz'};

 const actions=useRef<{
  play:()=>Promise<void>;pause:()=>void;replay:()=>boolean;
  startSa:()=>Promise<void>;returnSa:()=>void;
  openGlossary:(key:string,trigger:HTMLButtonElement)=>void;
  closeGlossary:()=>void;
  choose:(choice:{buttonName:string;letter:string;value:string;
   sourceHandler:'right'|'wrong'},
   trigger:HTMLButtonElement)=>void;
  closeWrong:(spriteId:number,destination:number,trigger:HTMLButtonElement)=>void;
 }|null>(null);
 actions.current={
  async play(){const current=owner.current;if(!current||!ready.current)return;
   const s=current.snapshot();let work:Promise<Result>;
   if(s.state.supplemental==='paused')work=current.resumeSupplemental({activation:'user'});
   else if(s.state.phase==='feedback-playing'&&s.phase==='paused')
    work=current.resumeFeedback({activation:'user'});
   else work=current.playMain({activation:'user'});
   const ticket=current.snapshot().generation;
   try{const result=await work;
    if(owner.current!==current||current.snapshot().generation!==ticket)return;
    requireAccepted(result,'play');if(owner.current===current){
    setError('');publish(current,true);loop.current();}}
   catch(e){if(owner.current===current&&current.snapshot().generation===ticket)
    failed(String(e));}},
  pause(){const current=owner.current;if(!current)return;
   stopLoop();const result=current.pause();
   if(result.accepted)publish(current,true);},
  replay(){const current=owner.current;if(!current||!ready.current)return false;
   stopLoop();choiceTrigger.current=null;glossaryTrigger.current=null;
   const result=current.replay();if(!result.accepted){failed(result.reason);return false;}
   failing.current=false;setStatus('ready');setError('');setErrorCode('none');
   publish(current,true);return true;},
  async startSa(){const current=owner.current;if(!current||!ready.current)return;
   if(current.snapshot().state.supplemental==='paused'){
    const resumed=current.resumeSupplemental({activation:'user'});
    const ticket=current.snapshot().generation;
    try{const result=await resumed;
     if(owner.current!==current||current.snapshot().generation!==ticket)return;
     requireAccepted(result,'resume audio');setError('');publish(current,true);}
    catch(e){if(owner.current===current&&current.snapshot().generation===ticket)
     failed(String(e));}return;
   }
   if(!prepared.current.has('sa')){
    if(saPreparingRef.current)return;
    saPreparingRef.current=true;setSaPreparing(true);
    const ticket=current.snapshot().generation;
    try{const result=await current.prepare('sa');
     if(owner.current!==current||current.snapshot().generation!==ticket)return;
     requireAccepted(result,'prepare audio');
     prepared.current.add('sa');publish(current,true);}
    catch(e){if(owner.current===current&&current.snapshot().generation===ticket)
     setError('Optional audio is unavailable.');}
    finally{saPreparingRef.current=false;setSaPreparing(false);}return;
   }
   const started=current.startSupplemental({activation:'user'});
   const ticket=current.snapshot().generation;
   try{const result=await started;
    if(owner.current===current&&current.snapshot().generation===ticket){
     setError(result.accepted?'':'Audio is paused. Press Play to continue.');
     stopLoop();publish(current,true);}}
   catch(e){if(owner.current===current&&current.snapshot().generation===ticket)
    setError('Optional audio is unavailable.');}},
  returnSa(){const current=owner.current;if(!current)return;
   const result=current.returnSupplemental();
   if(result.accepted)publish(current,true);},
  openGlossary(key,trigger){const current=owner.current;if(!current||!ready.current)return;
   const result=current.openGlossary(key as P035Glossary);
   if(!result.accepted)return;
   stopLoop();glossaryTrigger.current=trigger;glossaryKey.current=key;
   publish(current,true);
   try{externalGlossary.current?.(key as P035Glossary,trigger);}
   catch(e){current.closeGlossary();publish(current,true);failed(String(e));}},
  closeGlossary(){const current=owner.current;if(!current)return;
   const result=current.closeGlossary();if(!result.accepted)return;
   publish(current,true);const trigger=glossaryTrigger.current,key=glossaryKey.current;
   glossaryTrigger.current=null;glossaryKey.current=null;
   requestAnimationFrame(()=>{
    const fallback=key?nativeButtons('button[data-p035-kind="glossary"]')
      .find(button=>button.dataset.p035Key===key&&!button.disabled):null;
    (trigger?.isConnected&&!trigger.disabled?trigger:fallback)?.focus({preventScroll:true});
   });},
  choose(choice,trigger){const current=owner.current;if(!current||!ready.current)return;
   const key=choiceFor(choice.letter,choice.value,choice.sourceHandler);
   if(!key)return;
   const chosen=current.choose(key);if(!chosen.accepted)return;
   stopLoop();choiceTrigger.current=trigger;
   choiceKey.current=choice.buttonName;publish(current,true);
   const request=p035VariantRequest(current.snapshot().state,key);
   if(!request){failed('Feedback is unavailable.');return;}
   let id;try{id=p035HostVariant(request,hostVariants.current);}
   catch(e){failed(String(e));return;}
   if(!prepared.current.has(id)){failed('Feedback is unavailable.');return;}
   // No fetch/decode await precedes this call: activation is the real choice click.
   const started=current.resolveFeedback(id,{activation:'user'});
   const ticket=current.snapshot().generation;
   void started.then(result=>{
    if(owner.current!==current||current.snapshot().generation!==ticket)return;
    if(!result.accepted){
     const now=current.snapshot();
     if(now.state.phase==='feedback-playing'&&now.phase==='paused')
      setError('Feedback is paused. Press Play to continue.');
     else failed('Feedback is unavailable.');
    }
    publish(current,true);loop.current();
   }).catch(e=>{if(owner.current===current&&current.snapshot().generation===ticket)
    failed(String(e));});
  },
  closeWrong(spriteId,destination,trigger){const current=owner.current;
   if(!current||!ready.current)return;
   const fb=current.snapshot().state.feedback;
   if(!fb||fb.characterId!==spriteId||fb.kind!=='wrong'||
    P035_FEEDBACK[fb.characterId].close!==destination)return;
   const started=current.closeWrong(fb.token);
   const ticket=current.snapshot().generation;
   void started.then(result=>{
    if(owner.current!==current||current.snapshot().generation!==ticket)return;
    if(!result.accepted){
     const now=current.snapshot();
     if(now.state.phase==='feedback-playing'&&now.phase==='paused')
      setError('Feedback is paused. Press Play to continue.');
     else failed('Feedback is unavailable.');
    }
    publish(current,true);loop.current();
   }).catch(e=>{if(owner.current===current&&current.snapshot().generation===ticket)
    failed(String(e));});
  },
 };
 useEffect(()=>connectControls?.({
  setPaused:paused=>{if(paused)actions.current?.pause();else void actions.current?.play();},
  replay:()=>actions.current?.replay()??false,
  narration:action=>{if(action==='stop')actions.current?.pause();
   else void actions.current?.play();},
  stop:()=>actions.current?.pause(),closeGlossary:()=>actions.current?.closeGlossary(),
 }),[connectControls]);
 useEffect(()=>{
  const next=snapshot?.state.phase??'prequiz',prev=lastPhase.current;
  lastPhase.current=next;
  if(prev.startsWith('feedback')&&next==='question'){
   requestAnimationFrame(()=>{
    const old=choiceTrigger.current;
    const fallback=nativeButtons('button[data-p035-kind="choice"]').find(button=>
      button.dataset.p035Key===choiceKey.current&&!button.disabled)??
      nativeButtons('button[data-p035-kind="choice"]:not(:disabled)')[0];
    (old?.isConnected&&!old.disabled?old:fallback)?.focus({preventScroll:true});
   });
  }else if(prev.startsWith('feedback')&&next==='postquiz')
   requestAnimationFrame(()=>playButton.current?.focus({preventScroll:true}));
 },[snapshot?.state.phase]);
 useEffect(()=>{
  if(snapshot?.state.glossaryOpen&&!onOpenGlossary)
   closeGlossaryButton.current?.focus({preventScroll:true});
 },[snapshot?.state.glossaryOpen,onOpenGlossary]);

 const labels=language==='es'?{
  group:'Controles de la lección',play:'Reproducir',pause:'Pausar',replay:'Repetir',
  prepare:'Preparar audio opcional',audio:'Reproducir audio opcional',
  return:'Volver a la animación',close:'Cerrar',
  ready:'Audio listo. Pulse Reproducir audio opcional.',
  error:'La reproducción se detuvo.',loading:'Cargando la lección…'
 }:{group:'Lesson controls',play:'Play',pause:'Pause',replay:'Replay',
  prepare:'Prepare optional audio',audio:'Play optional audio',
  return:'Return to animation',close:'Close',
  ready:'Audio ready. Press Play optional audio.',
  error:'Playback stopped.',loading:'Loading lesson…'};
 const state=snapshot?.state,saPhase=state?.supplemental??'off';
 const canMain=ready.current&&state?.supplemental==='off'&&
  state.glossaryOpen===null&&
  (state.phase==='prequiz'||state.phase==='postquiz')&&
  (state.mainFrame<534||snapshot?.mainFinalAudioTailHeld===true)&&
  !['playing','failed','closed'].includes(snapshot?.phase??'closed');
 const canFeedbackResume=ready.current&&state?.phase==='feedback-playing'&&
  snapshot?.phase==='paused';
 const canSaResume=ready.current&&saPhase==='paused';
 const canPlay=canMain||canFeedbackResume||canSaResume;
 return <div ref={root} data-p035-player="source-bound"
  data-p035-error-code={errorCode}
  data-p035-phase={state?.phase??'loading'} data-p035-frame={state?.mainFrame??1}
  data-p035-audio-owner={snapshot?.activeOwner??'none'}
  data-p035-main-native-eof={String(snapshot?.nativeEof.main??false)}
  data-p035-quiz-hold={String(state?.phase==='question')}
  data-p035-source-boundary-held={String(state?.mainFrame===534)}
  data-p035-lesson-complete="false" data-p035-language={language}>
  <style>{`[data-p035-player] [data-p035-controls]{display:flex;flex-wrap:wrap;gap:.5rem;padding:.75rem;box-sizing:border-box;min-width:0;max-width:100%;font:inherit}
   [data-p035-player] button{min-height:44px;min-width:0;max-width:100%;padding:.45em .8em;font:inherit;overflow-wrap:anywhere}
   [data-p035-player] canvas{display:block;width:100%;max-width:800px;height:auto;aspect-ratio:4/3}`}</style>
  <P035VisualCompositionDraft ref={visual} owner={visualOwner}
   readCurrentOwner={readCurrentOwner} canvasAsset={canvasAsset}
   nativeTextTarget={nativeTextTarget}
   language={language} onPainted={onPainted}
   onChoose={(choice,trigger)=>actions.current?.choose(choice,trigger)}
   onOpenGlossary={(key,trigger)=>actions.current?.openGlossary(key,trigger)}
   onCloseFeedback={(close,trigger)=>actions.current?.closeWrong(
    close.feedbackSpriteId,close.sourceGotoAndPlayFrame,trigger)}/>
  <div role="group" aria-label={labels.group} data-p035-controls="true">
   {!hidePlaybackControls&&<>
    <button ref={playButton} type="button" onClick={()=>void actions.current?.play()}
     disabled={!canPlay}>{labels.play}</button>
    <button type="button" onClick={()=>actions.current?.pause()}
     disabled={snapshot?.phase!=='playing'}>{labels.pause}</button>
    <button type="button" onClick={()=>actions.current?.replay()}
     disabled={!ready.current}>{labels.replay}</button>
   </>}
   <button type="button" onClick={()=>void actions.current?.startSa()}
    disabled={!ready.current||saPreparing||saPhase==='playing'||saPhase==='ended'||
     state?.feedback!==null||state.phase==='feedback-pending'||!!state.glossaryOpen}>
    {prepared.current.has('sa')?labels.audio:labels.prepare}</button>
   {saPhase!=='off'&&<button type="button" onClick={()=>actions.current?.returnSa()}>
    {labels.return}</button>}
  </div>
  {prepared.current.has('sa')&&saPhase==='off'&&<p role="status">{labels.ready}</p>}
  {state?.glossaryOpen&&!onOpenGlossary&&<div role="dialog" aria-modal="true"
   aria-label={`${state.glossaryOpen} glossary`} data-p035-glossary="true">
   {glossaryContent.current?.(state.glossaryOpen)??null}
   <button ref={closeGlossaryButton} type="button"
    onClick={()=>actions.current?.closeGlossary()}>{labels.close}</button>
  </div>}
  {(error||snapshot?.failure)&&<p role="alert">{labels.error}
   {language==='en'&&error&&error!=='Lesson playback is unavailable.'?` ${error}`:''}</p>}
  {status==='loading'&&<p role="status">{labels.loading}</p>}
 </div>;
}
