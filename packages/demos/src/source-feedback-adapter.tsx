'use client';
import React,{useEffect,useRef,useState} from 'react';import {createPortal} from 'react-dom';
import type {AnimationModule,AnimationRendererProps} from './contract';
import {createSourceStaticCanvasCandidate,type SourceStaticCanvasCandidateConfig} from './source-static-canvas-candidate';
import contracts from './source-feedback-contracts.generated.json';
type Card={sourceName:string;sourceCharacter:string;pair:number;side:number;text:string};
type Feedback={domain:string;startFrame:number};
type Config={canvasConfig:SourceStaticCanvasCandidateConfig;levels:{label:string;sourceFrame:number;cards:Card[];feedback:{correct:Feedback;incorrect:Feedback}}[]};
const pages=contracts as unknown as Record<string,Config>;
type GameAsset={ready:()=>Promise<void>;renderSourceCard:(canvas:HTMLCanvasElement,id:string)=>void};
const buttonStyle={minHeight:44,border:'2px solid #0758ba',borderRadius:8,background:'#fff',color:'#123',padding:8};
function SourceCardButton({animationId,card,index,selected,matched,onChoose,spanish}:{animationId:string;card:Card;index:number;selected:boolean;matched:boolean;onChoose:()=>void;spanish:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);const [ready,setReady]=useState(false);
 useEffect(()=>{let cancelled=false,timer:ReturnType<typeof setTimeout>|undefined;setReady(false);
 const draw=async()=>{const asset=(globalThis as typeof globalThis&{HELP_MATH_CANVAS_ASSETS?:Record<string,GameAsset>}).HELP_MATH_CANVAS_ASSETS?.[animationId];if(!asset){timer=setTimeout(()=>void draw(),50);return;}await asset.ready();if(cancelled||!canvas.current)return;asset.renderSourceCard(canvas.current,card.sourceCharacter);setReady(true);};void draw();return()=>{cancelled=true;if(timer)clearTimeout(timer);};},[animationId,card.sourceCharacter]);
 return <button type="button" data-source-card={card.sourceName} data-card-ready={ready} data-card-matched={matched} disabled={!ready||matched} aria-pressed={selected}
  aria-label={`${spanish?'Tarjeta':'Card'} ${index+1}${card.text?': '+card.text:''}`} onClick={onChoose}
  style={{...buttonStyle,outline:selected?'3px solid #ee8a00':undefined,opacity:matched?.45:1,minWidth:0}}>
  <span>{spanish?'Tarjeta':'Card'} {index+1}{matched?' ✓':''}</span><canvas ref={canvas} width={260} height={130} style={{display:'block',width:'100%',height:'auto'}}/>
 </button>;
}
export function withSourceFeedback(module:AnimationModule):AnimationModule{
 const config=pages[module.key];if(!config)return module;
 const visual=createSourceStaticCanvasCandidate(config.canvasConfig),Base=visual.Renderer;
 function Session(props:AnimationRendererProps){
  const [level,setLevel]=useState(0),[selected,setSelected]=useState<string|null>(null),[matched,setMatched]=useState<number[]>([]),[score,setScore]=useState(0),[feedback,setFeedback]=useState<'correct'|'incorrect'|null>(null),[target,setTarget]=useState<HTMLElement|null>(null);
  const spanish=(props.uiLanguage??props.lang)==='es',current=config.levels[level];
  const stop=()=>props.onLessonHostRequest?.({type:'stop-audio'});
  useEffect(()=>{setTarget(props.pageInteractionCompanionTargetId?document.getElementById(props.pageInteractionCompanionTargetId):null);},[props.pageInteractionCompanionTargetId]);
  useEffect(()=>{if(props.paused)props.onLessonHostRequest?.({type:'stop-audio'});},[props.paused,props.onLessonHostRequest]);
  useEffect(()=>{if(!props.activeInteractiveAudioId)setFeedback(null);},[props.activeInteractiveAudioId]);
  const reset=(nextLevel:number)=>{stop();setLevel(nextLevel);setSelected(null);setMatched([]);setScore(0);setFeedback(null);};
  const choose=(card:Card)=>{
   stop();setFeedback(null);
   if(!selected){setSelected(card.sourceName);return;}
   if(selected===card.sourceName){setSelected(null);return;}
   const previous=current.cards.find(c=>c.sourceName===selected)!;const correct=previous.pair===card.pair&&previous.side!==card.side;
   const outcome=correct?'correct':'incorrect';setScore(n=>n+(correct?10:-2));setSelected(null);if(correct)setMatched([...matched,card.pair]);setFeedback(outcome);
   // This request exists only after a real two-card operation. Never autoplay feedback at entry.
   const cueId=spanish ? `${module.key}-modern-es-feedback-${outcome}` : `${module.key}-feedback-${current.feedback[outcome].domain}`;
   if(props.audioEnabled&&module.interactiveAudioAssets?.some(asset=>asset.id===cueId))props.onLessonHostRequest?.({type:'play-audio',cueId});
  };
  const state={...visual.getFrameState(current.sourceFrame,{...props,lang:'en',frameDomain:config.canvasConfig.mainFrameDomain}),behaviorCompositeContractId:config.canvasConfig.sourceBehaviorCompositeContractId,behaviorCompositeState:JSON.stringify({level,selected,matched,feedback})};
  const controls=<section data-source-feedback-game={module.key} data-level={level} data-score={score} data-matched={matched.length} style={{padding:12,background:'#f6faff',color:'#123'}}>
   <p>{spanish?'Selecciona dos tarjetas que correspondan.':'Choose two matching cards.'}</p>
   <div style={{display:'flex',gap:8}}>{config.levels.map((_,i)=><button type="button" key={i} aria-pressed={level===i} style={buttonStyle} onClick={()=>reset(i)}>{spanish?'Nivel':'Level'} {i+1}</button>)}<button style={buttonStyle} type="button" onClick={()=>{reset(0);props.onReplay?.();}}>{spanish?'Repetir':'Replay game'}</button></div>
   <p role="status">{spanish?'Puntuación':'Score'}: {score} — {matched.length} / 6 {feedback ? (feedback==='correct'?(spanish?'Correcto':'Correct'):(spanish?'No coinciden':'Not a match')):''}</p>
   {props.activeInteractiveAudioId&&<button type="button" style={buttonStyle} onClick={stop}>{spanish?'Detener audio':'Stop audio'}</button>}
   <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:8}}>{current.cards.map((card,index)=><SourceCardButton key={`${level}:${card.sourceName}`} animationId={module.key} card={card} index={index} selected={selected===card.sourceName} matched={matched.includes(card.pair)} onChoose={()=>choose(card)} spanish={spanish}/>)}</div>
   {spanish&&!module.interactiveAudioAssets?.some(asset=>asset.id===`${module.key}-modern-es-feedback-correct`)&&<p>No hay una grabación de respuesta disponible en español.</p>}
  </section>;
  return <><div data-source-quiz-visual><Base {...props} lang="en" frame={current.sourceFrame} state={state}/></div>{target?createPortal(controls,target):controls}</>;
 }
 function Renderer(props:AnimationRendererProps){return <Session key={`${props.replay??0}:${props.uiLanguage??props.lang}`} {...props}/>;}
 return Object.freeze({...module,transport:undefined,Renderer});
}
