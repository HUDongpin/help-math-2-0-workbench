'use client';
import {useEffect,useId,useRef,useState,type ComponentType} from 'react';
import type {RuntimeContext} from './contract';
import type {createFixedExitHelpSessionV1} from './source-fixed-exit-help-session-v1';
import type {FixedExitNativeGlossaryV1} from './source-fixed-exit-help-native-v1';

type SessionConstructor<T extends string,I extends number,M extends number>=ReturnType<typeof createFixedExitHelpSessionV1<T,I,M>>;
type Session<T extends string,I extends number,M extends number>=InstanceType<SessionConstructor<T,I,M>>;
type Snapshot<T extends string,I extends number,M extends number>=ReturnType<Session<T,I,M>['snapshot']>;
export interface FixedExitHelpControlsV1{setPaused(value:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void;closeGlossary():void;inspect(frame:number):boolean;}
export interface FixedExitPresentationPropsV1<T extends string,V>{view:V;onChoose?:(answer:1|2|3|4,trigger:HTMLButtonElement)=>void;onClose?:()=>void;onTerm?:(term:T,trigger:HTMLButtonElement)=>void;onHelp?:(trigger:HTMLButtonElement)=>void;onHelpClose?:()=>void;}
export interface FixedExitHelpPlayerPropsV1<T extends string,I extends number,M extends number>{seed:number;uiLanguage:'en'|'es';paused?:boolean;volume?:number;reducedMotion?:boolean;readAudio:(id:I|M|'sa',signal:AbortSignal)=>Promise<ArrayBuffer>;connectControls?:(c:FixedExitHelpControlsV1)=>()=>void;onState?:(s:Snapshot<T,I,M>)=>void;onPaused?:(v:boolean)=>void;onReplay?:()=>void;onGlossary?:(term:T,trigger:HTMLButtonElement)=>void;}

/** The two slope pages use the audited fixed-exit session unchanged. This
 * component owns only host controls, focus, React lifetime and explicit SA. */
export function createFixedExitHelpPlayerV1<T extends string,I extends number,M extends number,V>(config:{scope:'p042'|'p043'|'p044'|'p045';mainSpriteId:M;terms:readonly FixedExitNativeGlossaryV1<T>[];Session:SessionConstructor<T,I,M>;initialState:()=>Snapshot<T,I,M>['state'];view:(state:Snapshot<T,I,M>['state'],context:RuntimeContext)=>V;Presentation:ComponentType<FixedExitPresentationPropsV1<T,V>>}){
 const {scope,mainSpriteId,terms,Presentation}=config,css=`alg-l07-${scope}`;
 function TermDialog({term,language,trigger,close}:{term:T;language:'en'|'es';trigger:HTMLButtonElement|null;close:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null),button=useRef<HTMLButtonElement>(null),heading=useRef<HTMLHeadingElement>(null),id=useId(),entry=terms.find(t=>t.sourceActionKey===term)!;
  useEffect(()=>{dialog.current?.showModal();heading.current?.focus();return()=>{dialog.current?.close();if(trigger?.isConnected)trigger.focus({preventScroll:true});};},[term,trigger]);
  return <dialog ref={dialog} className={`${css}__dialog`} lang={language} aria-labelledby={id} {...{[`data-${scope}-glossary-id`]:entry.id}} data-source-entry-sha256={entry.sourceEntrySha256[language]} onCancel={e=>{e.preventDefault();close();}} onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();button.current?.focus();}}}><h2 id={id} ref={heading} tabIndex={-1}>{entry.labels[language]}</h2><p>{entry.definitions[language]}</p><p>{language==='es'?'La animación seguirá en pausa al cerrar. Usa Reanudar para continuar.':'The animation will stay paused when you close. Use Resume to continue.'}</p><button ref={button} type="button" onClick={close}>{language==='es'?'Cerrar':'Close'}</button></dialog>;
 }
 return function FixedExitHelpPlayer(props:FixedExitHelpPlayerPropsV1<T,I,M>){
  const latest=useRef(props);latest.current=props;
  const engine=useRef<Session<T,I,M>|null>(null),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement|null>(null),answerTrigger=useRef<HTMLButtonElement|null>(null),helpTrigger=useRef<HTMLButtonElement|null>(null),lastAnswer=useRef<1|2|3|4>(1),[snapshot,setSnapshot]=useState<Snapshot<T,I,M>|null>(null);
  useEffect(()=>{
   let active=true,raf:number|null=null,last='';
   const update=()=>{if(!active)return;const s=session.snapshot(),key=JSON.stringify(s);if(key!==last){last=key;setSnapshot(s);latest.current.onState?.(s);}if(s.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);};
   const tick=()=>{raf=null;session.tick();update();};
   const session=new config.Session({load:(id,signal)=>latest.current.readAudio(id,signal),changed:update});engine.current=session;session.setVolume(latest.current.volume??.8);update();
   const playFromHost=()=>{void session.play().then(()=>{if(active)latest.current.onPaused?.(!['playing','loading','start-pending'].includes(session.snapshot().phase));});};
   const controls:FixedExitHelpControlsV1={setPaused(value){if(!active)return;latest.current.onPaused?.(value);if(value)session.pause();else playFromHost();},replay(){if(!active)return false;latest.current.onReplay?.();latest.current.onPaused?.(false);void session.replay();return true;},narration(action){if(!active)return;latest.current.onPaused?.(action==='stop');if(action==='stop')session.pause();else playFromHost();},stop(){if(active)void session.close();},closeGlossary(){session.closeGlossary();latest.current.onPaused?.(true);},inspect(frame){return session.inspect(frame);}};
   const disconnect=latest.current.connectControls?.(controls),hidden=()=>{if(document.hidden){session.pause();latest.current.onPaused?.(true);}};document.addEventListener('visibilitychange',hidden);
   return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);disconnect?.();document.removeEventListener('visibilitychange',hidden);if(engine.current===session)engine.current=null;void session.close();};
  },[props.seed]);
  useEffect(()=>{engine.current?.setVolume(props.volume??.8);},[props.volume]);useEffect(()=>{if(props.paused)engine.current?.pause();},[props.paused]);
  const state=snapshot?.state??config.initialState(),feedback=state.feedback,domain=feedback?`sprite-${feedback.spriteId}`:`sprite-${mainSpriteId}`,scenario=feedback?(feedback.kind==='right'?'right-feedback':(state.quizTryCount===1?'wrong-second':'wrong-first')+'-'+(['a','b','c','d'][lastAnswer.current-1]??'a')):'source-question';
  const view=config.view(state,{frame:feedback?.frame??state.mainFrame,frameDomain:domain,scenario,lang:props.uiLanguage,seed:props.seed,replay:state.replay}),es=props.uiLanguage==='es',playing=['playing','loading','start-pending'].includes(snapshot?.phase??'');
  useEffect(()=>{if(state.phase==='feedback')root.current?.querySelector<HTMLElement>(`[data-${scope}-feedback]`)?.focus();else if(state.phase==='quiz-held'&&answerTrigger.current?.isConnected)answerTrigger.current.focus({preventScroll:true});},[state.phase,state.selectionSerial]);
  const priorHelp=useRef(false);useEffect(()=>{if(priorHelp.current&&!state.help&&helpTrigger.current?.isConnected)helpTrigger.current.focus({preventScroll:true});priorHelp.current=state.help;},[state.help]);
  const data=Object.fromEntries(Object.entries({phase:snapshot?.phase??'initializing',frame:state.mainFrame,'help-visible':state.help,replay:state.replay,'quiz-phase':state.phase,attempts:state.quizTryCount,selected:state.selected??'','feedback-id':feedback?.spriteId??'','feedback-frame':feedback?.frame??'','audio-phase':snapshot?.audioPhase??'idle','audio-domain':snapshot?.audioDomain??mainSpriteId,'decoded-sample':snapshot?.decodedSample??0,'audio-mode':snapshot?.mode??'main',glossary:state.glossary??''}).map(([key,value])=>[`data-${scope}-${key}`,value]));
  const close=()=>{engine.current?.closeGlossary();latest.current.onPaused?.(true);};
  return <div ref={root} className={`${css}-player`} {...data}>
   <Presentation view={view} onChoose={(answer,button)=>{if(snapshot?.loading||snapshot?.mode==='sa')return;answerTrigger.current=button;lastAnswer.current=answer;latest.current.onPaused?.(false);void engine.current?.choose(answer);}} onClose={()=>{latest.current.onPaused?.(false);void engine.current?.closeFeedback();}} onHelp={button=>{helpTrigger.current=button;if(engine.current?.openHelp())latest.current.onPaused?.(true);}} onHelpClose={()=>{if(engine.current?.closeHelp())latest.current.onPaused?.(true);}} onTerm={(term,button)=>{if(!engine.current?.openGlossary(term))return;trigger.current=button;latest.current.onPaused?.(true);latest.current.onGlossary?.(term,button);}}/>
   <div className={`${css}-player__controls`} lang={props.uiLanguage}>{!props.connectControls&&<><button type="button" disabled={Boolean(state.glossary)} onClick={()=>playing?engine.current?.pause():void engine.current?.play()}>{playing?(es?'Pausa':'Pause'):(es?'Reanudar':'Resume')}</button><button type="button" onClick={()=>{latest.current.onReplay?.();void engine.current?.replay();}}>{es?'Repetir':'Replay'}</button></>}
    <button type="button" {...{[`data-${scope}-spanish-audio`]:true}} disabled={Boolean(state.glossary)||Boolean(snapshot?.loading)} onClick={()=>{latest.current.onPaused?.(false);void engine.current?.spanishAudio();}}>{es?'Audio en español':'Spanish Audio'}</button>{snapshot?.mode==='sa'&&<button type="button" {...{[`data-${scope}-return`]:true}} onClick={()=>{engine.current?.returnMain();latest.current.onPaused?.(true);}}>{es?'Volver a la animación':'Return to animation'}</button>}
   </div>
   {state.glossary&&!props.onGlossary&&<TermDialog term={state.glossary} language={props.uiLanguage} trigger={trigger.current} close={close}/>}
   {snapshot?.failure&&<p role="alert" lang={props.uiLanguage}>{es?'No se pudo reproducir el audio. Inténtalo de nuevo.':'Audio could not play. Please try again.'}</p>}
  </div>;
 };
}
