'use client';
import React,{useCallback,useEffect,useLayoutEffect,useRef,useState}from'react';
import{createPortal}from'react-dom';
import type{AnimationRendererProps}from'./contract';
import{prepareFrozenGlossaryCanvas}from'./frozen-glossary-canvas-preparation';
import type{NmsL11Picture,NmsL11SourceAudioCandidate}from'./nms-l11-source-audio-candidate';
import type{NmsAnswerId}from'./g678-advanced-manual/nms002-l11-p030';

type Bounds=Readonly<{x:number;y:number;width:number;height:number}>;
export interface NmsL11ChoiceConfig{
 readonly animationId:string;readonly sourceSwfSha256:string;readonly assetSource:string;readonly assetSha256:string;
 readonly answers:readonly Readonly<{id:string;label:string;whole:number;numerator:number;denominator:number;hitBounds:Bounds}>[];
 readonly helpHitBounds:Bounds;readonly closeHelpHitBounds:Bounds;
 readonly question:Readonly<{prompt:string}>;
 readonly glossary:readonly Readonly<{sourceCharacterId:number;sourceKeyAttribute:string;entryId:string;parent:string;labels:Readonly<{en:string;es:string}>;ranges:readonly Readonly<{firstFrame:number;lastFrame:number}>[];hitBounds:Bounds}>[];
}
export interface NmsL11ChoiceSurface{paint(picture:NmsL11Picture):boolean;readPicture():NmsL11Picture;}
export type NmsL11View=ReturnType<NmsL11SourceAudioCandidate['snapshot']>;
export interface NmsL11ChoiceActions{choose(id:NmsAnswerId):void;openHint():void;closeHint():void;dismissWrong():void;}
const initial:NmsL11Picture={mainFrame:1,hintOpen:false,feedbackObjectId:null,feedbackFrame:1};
const overlayStyle=(b:Bounds):React.CSSProperties=>({position:'absolute',left:`${b.x/8}%`,top:`${b.y/6}%`,width:`${b.width/8}%`,height:`${b.height/6}%`,border:0,padding:0,minHeight:0,minWidth:0,boxSizing:'border-box',background:'transparent',boxShadow:'none',cursor:'pointer'});
const buttonStyle:React.CSSProperties={minHeight:44,padding:'8px 12px',font:'600 1rem system-ui'};

/** The imperative picture surface is owned by the source audio coordinator.
 * React updates controls, without repainting an older frame over a new sound. */
export function NmsL11ChoiceCandidateRenderer({config,view,actions,onSurfaceReady,externalClock=false,...props}:AnimationRendererProps&{config:NmsL11ChoiceConfig;view?:NmsL11View;actions?:NmsL11ChoiceActions;onSurfaceReady?:(surface:NmsL11ChoiceSurface|null)=>void;externalClock?:boolean}){
 if(config.animationId!=='shared-nms002-l11-p030'||config.sourceSwfSha256!=='853d0c3350fc1c39dfc730eb369041d91565003b6bdeed238aece874b2e06913')throw Error('NMS choice source mismatch');
 const canvas=useRef<HTMLCanvasElement>(null),picture=useRef<NmsL11Picture>(initial);
 const[ready,setReady]=useState(false),[error,setError]=useState<string|null>(null),[target,setTarget]=useState<HTMLElement|null>(null);
 const language=props.uiLanguage??props.lang,spanish=language==='es',eligible=(props.frameDomain??'sprite-260')==='sprite-260'&&props.scenario==='source-static-frame'&&!props.entryStateSha256;
 const shown=externalClock?picture.current:(view?.picture??{...initial,mainFrame:props.frame});
 const question=eligible&&shown.mainFrame===97,selecting=question&&!shown.hintOpen&&shown.feedbackObjectId===null&&view?.phase==='question',hint=question&&shown.hintOpen;
 const enabled=ready&&!error&&Boolean(actions),dismiss=question&&view?.phase==='feedback-dismissal';
 const currentGlossary=(g:NmsL11ChoiceConfig['glossary'][number],p:NmsL11Picture)=>g.parent==='popup-39'?p.mainFrame===97&&p.hintOpen:g.ranges.some(r=>p.mainFrame>=r.firstFrame&&p.mainFrame<=r.lastFrame);
 const visibleGlossary=eligible?config.glossary.filter(g=>currentGlossary(g,shown)):[];
 const answerText=(a:NmsL11ChoiceConfig['answers'][number])=>`${a.label}: ${a.whole?a.whole+' + ':''}${a.numerator}/${a.denominator}`;
 useEffect(()=>{const n=props.pageInteractionCompanionTargetId?document.getElementById(props.pageInteractionCompanionTargetId):null;setTarget(n?.dataset.pageInteractionCompanionHost==='true'?n:null);},[props.pageInteractionCompanionTargetId]);
 useEffect(()=>{let active=true;setReady(false);setError(null);prepareFrozenGlossaryCanvas(config).then(()=>{if(active)setReady(true);},e=>{if(active)setError(e.message);});return()=>{active=false;};},[config]);
 const makeSurface=useCallback(():NmsL11ChoiceSurface=>({
  paint(p){if(!ready||!canvas.current)return false;const asset=window.HELP_MATH_CANVAS_ASSETS?.[config.animationId];if(!asset)return false;
   const state=(asset.render as unknown as (c:HTMLCanvasElement,r:unknown)=>{localFrame:number})(canvas.current,{frame:p.mainFrame,lang:'en',scenario:'source-static-frame',seed:0,choice:{hintOpen:p.hintOpen,feedbackObjectId:p.feedbackObjectId,feedbackFrame:p.feedbackFrame}});
   if(state.localFrame!==p.mainFrame||canvas.current.dataset.sourceFeedbackObject!==String(p.feedbackObjectId)||canvas.current.dataset.sourceFeedbackFrame!==String(p.feedbackFrame))return false;picture.current=Object.freeze({...p});return true;},
  readPicture(){return picture.current;},
 }),[ready,config]);
 useLayoutEffect(()=>{if(!ready)return;try{if(!makeSurface().paint(externalClock?picture.current:shown))throw Error('NMS picture not committed');}catch(e){setError(e instanceof Error?e.message:String(e));}},[ready,makeSurface,externalClock,props.frame]);
 useLayoutEffect(()=>{if(!ready||error)return;onSurfaceReady?.(makeSurface());return()=>onSurfaceReady?.(null);},[ready,error,makeSurface,onSurfaceReady]);
 const openGlossary=(g:NmsL11ChoiceConfig['glossary'][number],trigger:HTMLButtonElement)=>{if(eligible&&ready&&!error&&currentGlossary(g,picture.current))props.onLessonHostRequest?.({type:'open-glossary',entryId:g.entryId},{trigger});};
 const controls=<section data-nms-l11-controls={config.animationId} aria-label={spanish?'Actividad de números racionales':'Rational numbers activity'} style={{padding:12}}>
  {question?<><p lang="en">{config.question.prompt}</p><div style={{display:'flex',flexWrap:'wrap',gap:8}}>
   <button style={buttonStyle} type="button" data-nms-l11-help disabled={!enabled||!selecting} onClick={()=>actions?.openHint()}>{spanish?'Más ayuda':'Need More Help'}</button>
   <button style={buttonStyle} type="button" data-nms-l11-close-help disabled={!enabled||!hint} onClick={()=>actions?.closeHint()}>{spanish?'Cerrar ayuda':'Close help'}</button>
   {config.answers.map(a=><button style={buttonStyle} type="button" key={a.id} data-nms-l11-answer={a.id} disabled={!enabled||!selecting} onClick={()=>actions?.choose(a.id as NmsAnswerId)}>{answerText(a)}</button>)}
   <button style={buttonStyle} type="button" data-nms-l11-dismiss disabled={!enabled||!dismiss} onClick={()=>actions?.dismissWrong()}>{spanish?'Continuar':'Continue feedback'}</button>
  </div><p lang="en" aria-live="polite" data-nms-l11-wrong-feedback style={{height:72,lineHeight:'24px',overflowY:'auto'}}>{view?.interaction.wrongFeedbackText??''}</p></>:null}
  {visibleGlossary.length>0?<div aria-label={spanish?'Glosario de esta página':'Glossary for this page'} style={{display:'flex',flexWrap:'wrap',gap:8}}>{visibleGlossary.map(g=><button style={buttonStyle} key={g.sourceCharacterId} type="button" data-nms-l11-glossary={g.sourceCharacterId} disabled={!ready||Boolean(error)||!props.onLessonHostRequest} onClick={e=>openGlossary(g,e.currentTarget)}>{g.labels[language]}</button>)}</div>:null}
 </section>;
 return <div data-nms-l11-choice-candidate={config.animationId} data-source-surface-ready={ready&&!error?'true':'false'}>
  <div style={{position:'relative',width:'100%',maxWidth:800,aspectRatio:'4 / 3'}}>
   <canvas ref={canvas} width={800} height={600} aria-label={spanish?'Actividad de números racionales; usa los botones debajo de la animación.':'Rational numbers activity; use the buttons below the animation.'} style={{display:'block',width:'100%',height:'100%'}}/>
   {question&&config.answers.map(a=><button key={a.id} type="button" tabIndex={-1} aria-hidden="true" data-nms-l11-answer-overlay={a.id} style={overlayStyle(a.hitBounds)} disabled={!enabled||!selecting} onClick={()=>actions?.choose(a.id as NmsAnswerId)}/>)}
   {question?<button type="button" tabIndex={-1} aria-hidden="true" data-nms-l11-help-overlay style={overlayStyle(config.helpHitBounds)} disabled={!enabled||!selecting} onClick={()=>actions?.openHint()}/>:null}
   {hint?<button type="button" tabIndex={-1} aria-hidden="true" data-nms-l11-close-help-overlay style={overlayStyle(config.closeHelpHitBounds)} disabled={!enabled} onClick={()=>actions?.closeHint()}/>:null}
   {visibleGlossary.map(g=><button key={g.sourceCharacterId} type="button" tabIndex={-1} aria-hidden="true" data-nms-l11-glossary-overlay={g.sourceCharacterId} style={overlayStyle(g.hitBounds)} disabled={!ready||Boolean(error)||!props.onLessonHostRequest} onClick={e=>openGlossary(g,e.currentTarget)}/>)}
  </div>
  {error?<p role="alert">{spanish?'No se pudo cargar la animación.':'The animation could not be loaded.'}</p>:null}
  {target?createPortal(controls,target):controls}
 </div>;
}
