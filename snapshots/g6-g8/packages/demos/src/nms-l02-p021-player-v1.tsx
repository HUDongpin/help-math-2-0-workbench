'use client';
import{useEffect,useRef,useState}from'react';
import{P021SourceAudio,type P021AudioSnapshot,type P021AudioDependencies}from'./nms-l02-p021-audio-v1';
import{NmsL2P021Presentation}from'./nms-l02-p021-presentation-v1';
import{p021Initial}from'./nms-l02-p021-state-v1';
export interface P021PlayerControls{setPaused(value:boolean):void;replay():boolean;narration(action:'play'|'stop'):void;stop():void;}
export interface P021PlayerProps{readonly seed:number;readonly uiLanguage:'en'|'es';readonly paused:boolean;readonly volume:number;readonly reducedMotion?:boolean;readonly readAudio:P021AudioDependencies['read'];readonly connectControls?:(controls:P021PlayerControls)=>()=>void;readonly onState?:(s:P021AudioSnapshot)=>void;readonly onPaused?:(paused:boolean)=>void;readonly onReplay?:()=>void;readonly onComplete?:()=>void;}
export function NmsL2P021Player(props:P021PlayerProps){
 const latest=useRef(props);latest.current=props;const engine=useRef<P021SourceAudio|null>(null),seenPaused=useRef(false);const[snapshot,setSnapshot]=useState<P021AudioSnapshot|null>(null);
 useEffect(()=>{let active=true,raf:number|null=null,last='',completed=-1;
  const publish=(s:P021AudioSnapshot)=>{if(!active)return;setSnapshot(s);latest.current.onState?.(s);if(s.phase==='waiting'||s.phase==='completed')latest.current.onPaused?.(true);if(s.phase==='completed'&&completed!==s.state.replay){completed=s.state.replay;latest.current.onComplete?.();}};
  const tick=()=>{raf=null;if(!active)return;const s=session.snapshot(),key=JSON.stringify([s.phase,s.state]);if(key!==last){last=key;publish(s);}if(s.phase==='playing')raf=requestAnimationFrame(tick);};
  const session=new P021SourceAudio({seed:props.seed,read:(d,s)=>latest.current.readAudio(d,s),changed:s=>{publish(s);if(s.phase==='playing'&&raf===null)raf=requestAnimationFrame(tick);else if(s.phase!=='playing'&&raf!==null){cancelAnimationFrame(raf);raf=null;}}});engine.current=session;session.setVolume(latest.current.volume);latest.current.onPaused?.(true);
  const result=(p:Promise<boolean>)=>{void p.then(ok=>{if(active)latest.current.onPaused?.(!ok);});};
  const controls:P021PlayerControls={setPaused(value){if(!active)return;if(value){session.pause();latest.current.onPaused?.(true);}else result(session.play());},replay(){if(!active)return false;result(session.replay());latest.current.onReplay?.();return true;},narration(action){session.setNarrationEnabled(action==='play');if(action==='play')result(session.play());},stop(){if(!active)return;active=false;if(raf!==null)cancelAnimationFrame(raf);void session.close();}};
  const disconnect=latest.current.connectControls?.(controls),visibility=()=>{if(active&&document.hidden){session.pause();latest.current.onPaused?.(true);}};document.addEventListener('visibilitychange',visibility);
  return()=>{active=false;if(raf!==null)cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);disconnect?.();if(engine.current===session)engine.current=null;void session.close();};
 },[props.seed]);
 useEffect(()=>{engine.current?.setVolume(props.volume);},[props.volume]);
 useEffect(()=>{if(props.paused){seenPaused.current=true;engine.current?.pause();}else if(seenPaused.current)void engine.current?.play();},[props.paused]);
 const s=snapshot?.state??p021Initial(props.seed),result=(p:Promise<boolean>|undefined)=>{void p?.then(ok=>latest.current.onPaused?.(!ok));};
 return <div data-p021-audio-phase={snapshot?.phase??'paused'} data-p021-narration={snapshot?.narrationEnabled?'enabled':'disabled'}>
  {snapshot?.failure&&<p role="alert">{props.uiLanguage==='es'?'El audio no está disponible.':'Audio is unavailable.'}</p>}
  <NmsL2P021Presentation state={s} language={props.uiLanguage} reducedMotion={props.reducedMotion} disabled={snapshot?.phase==='failed'||snapshot?.phase==='loading'} onToggle={i=>engine.current?.toggle(i)} onPress={k=>result(engine.current?.press(k))} onRelease={a=>result(engine.current?.release(a))} onClose={()=>result(engine.current?.closeFeedback())}/>
 </div>;
}
