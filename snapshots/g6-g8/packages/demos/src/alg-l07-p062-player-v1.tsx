'use client';
import {useEffect,useRef,useState} from 'react';
import {P062_CONTENT} from './alg-l07-p062-content-source-v1';
import {P062Session} from './alg-l07-p062-session-v1';
import {p062InitialState,p062Random} from './alg-l07-p062-state-v1';
import {P062QuestionView} from './alg-l07-p062-presentation-v1';
export interface P062Controls {setPaused(value:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;closeGlossary():void;stop():void;}
type Snapshot=ReturnType<P062Session['snapshot']>;
export interface P062PlayerProps {
 readonly seed:number;readonly uiLanguage:'en'|'es';readonly paused?:boolean;readonly volume?:number;
 readonly readAudio:(id:string,signal:AbortSignal)=>Promise<ArrayBuffer>;
 readonly connectControls?:(controls:P062Controls)=>()=>void;readonly onState?:(snapshot:Snapshot)=>void;
 readonly onPaused?:(value:boolean)=>void;readonly onReplay?:()=>void;readonly onExit?:()=>void;
}
export function AlgL07P062Player(props:P062PlayerProps){
 const latest=useRef(props);latest.current=props;const engine=useRef<P062Session|null>(null),root=useRef<HTMLDivElement>(null),[snapshot,setSnapshot]=useState<Snapshot|null>(null);
 useEffect(()=>{let active=true;const session=new P062Session({seed:latest.current.seed,load:(id,signal)=>latest.current.readAudio(id,signal),changed(){if(!active)return;const s=session.snapshot();setSnapshot(s);latest.current.onState?.(s);}});engine.current=session;session.setVolume(latest.current.volume??.8);session.tick();
  const controls:P062Controls={setPaused(v){if(!active)return;if(v)session.pause();else void session.play();},replay(){if(!active)return false;latest.current.onReplay?.();void session.replay();return true;},narration(action){if(action==='stop')session.pause();else void session.play();},closeGlossary(){},stop(){void session.close();}};
  const disconnect=latest.current.connectControls?.(controls),timer=setInterval(()=>session.tick(),1000/12),hidden=()=>{if(document.hidden)session.pause();};document.addEventListener('visibilitychange',hidden);
  return()=>{active=false;clearInterval(timer);document.removeEventListener('visibilitychange',hidden);disconnect?.();if(engine.current===session)engine.current=null;void session.close();};
 },[props.seed]);
 useEffect(()=>{engine.current?.setVolume(props.volume??.8);},[props.volume]);
 // Host Pause controls sound. The page's source wall clock keeps running.
 useEffect(()=>{if(props.paused)engine.current?.pause();},[props.paused]);
 const state=snapshot?.state??p062InitialState(p062Random(props.seed)(30)),question=P062_CONTENT[state.currentQuestionId-1]!,es=props.uiLanguage==='es',finish=state.phase==='finish',exited=state.phase==='exited',prior=useRef({question:0,replay:0,finish:false});
 useEffect(()=>{const old=prior.current;if(finish&&!old.finish)root.current?.querySelector<HTMLButtonElement>('[data-p062-continue]')?.focus();else if(!finish&&!exited&&(old.question!==state.currentQuestionId||old.replay!==state.replay))root.current?.querySelector<HTMLElement>('[data-p062-question-focus]')?.focus({preventScroll:true});prior.current={question:state.currentQuestionId,replay:state.replay,finish};},[state.currentQuestionId,state.replay,finish,exited]);
 const continueQuiz=async()=>{if(await engine.current?.continue())latest.current.onExit?.();};
 return <div ref={root} className="alg-l07-p062" data-p062-state={state.phase} data-p062-phase={snapshot?.phase??'initializing'} data-p062-current-question={state.currentQuestionId} data-p062-frame={state.currentQuestionId+1} data-p062-responses={state.responses.length} data-p062-score={snapshot?.score.correct??0} data-p062-replay={state.replay} data-p062-audio-id={snapshot?.audio?.id??''} data-p062-audio-phase={snapshot?.audio?.phase??'idle'} data-p062-decoded-sample={snapshot?.audio?.decodedSample??0} data-p062-elapsed-ms={snapshot?.elapsedMs??0} data-p062-report-count={state.reportDispatchCount}>
  {!exited&&<div aria-hidden={finish?true:undefined} inert={finish||undefined}><P062QuestionView question={question} ordinal={Math.min(10,state.responses.length+1)} uiLanguage={props.uiLanguage} disabled={finish} onAnswer={(id,option)=>engine.current?.choose(id,option)} onAudio={target=>{latest.current.onPaused?.(false);void engine.current?.audio(target);}} activeAudio={snapshot?.audio&&!snapshot.audio.paused?snapshot.audio.target:null}/></div>}
  {finish&&<section className="alg-l07-p062__finish" role="dialog" aria-modal="true" aria-labelledby="p062-finish-title" onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();root.current?.querySelector<HTMLButtonElement>('[data-p062-continue]')?.focus();}}}>
   <h3 id="p062-finish-title" lang="en" data-source-text-id="character-13">You have completed the quiz.</h3><p lang="en" data-source-text-id="character-14 character-15">Your score is {snapshot?.score.correct??0} / 10.</p><button type="button" data-p062-continue onClick={()=>void continueQuiz()}>{es?'Continuar':'Continue'}</button>
  </section>}
  {exited&&<p role="status" lang={props.uiLanguage}>{es?'El cuestionario ha terminado.':'The quiz has ended.'}</p>}
  {!props.connectControls&&!finish&&<div className="alg-l07-p062__actions" lang={props.uiLanguage}><button type="button" onClick={()=>void engine.current?.replay()}>{es?'Repetir':'Replay'}</button>{snapshot?.audio&&<button type="button" onClick={()=>engine.current?.stopAudio()}>{es?'Detener audio':'Stop audio'}</button>}</div>}
  {snapshot?.failure&&<p role="alert" lang={props.uiLanguage}>{es?'No se pudo reproducir el audio. Puedes volver a intentarlo.':'Audio could not play. You can try again.'}</p>}
 </div>;
}
