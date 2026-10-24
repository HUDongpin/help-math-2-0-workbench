'use client';
import React,{useCallback,useEffect,useLayoutEffect,useRef,useState}from'react';
import{createPortal}from'react-dom';
import type{AnimationRendererProps}from'./contract';
import{prepareFrozenGlossaryCanvas}from'./frozen-glossary-canvas-preparation';
import type{DatL05Picture,DatL05SourceAudioCandidate,DatPopupId}from'./dat-l05-source-audio-candidate';
import type{DatSourceId,DatTargetId}from'./g678-advanced-manual/dat001-l05-p040';
type Bounds=Readonly<{x:number;y:number;width:number;height:number}>;
type Range=Readonly<{firstFrame:number;lastFrame:number;depth:number;bounds:Bounds}>;
export interface DatL05DragConfig{
 readonly animationId:string;readonly sourceSwfSha256:string;readonly assetSource:string;readonly assetSha256:string;readonly mainOriginPixels:Readonly<{x:number;y:number}>;readonly prompt:string;
 readonly items:readonly Readonly<{sourceId:DatSourceId;targetId:DatTargetId;label:string;definitionText:string;originTwips:Readonly<{x:number;y:number}>;targetOriginTwips:Readonly<{x:number;y:number}>;sourcePlacements:readonly Range[];targetPlacements:readonly Range[]}>[];
 readonly popups:readonly Readonly<{instanceName:DatPopupId;placements:readonly Range[];closeBounds:readonly (Bounds&Readonly<{firstFrame:number;lastFrame:number}>)[]}>[];
 readonly popupOpenButtons:readonly Readonly<{characterId:number;targetInstance:DatPopupId;placements:readonly Range[]}>[];
 readonly glossary:readonly Readonly<{characterId:number;entryId:string;keyAttribute:string;labels:Readonly<{en:string;es:string}>;definitions:Readonly<{en:string;es:string}>;placements:readonly Range[]}>[];
}
export type DatL05View=ReturnType<DatL05SourceAudioCandidate['snapshot']>;
export interface DatL05DragSurface{paint(picture:DatL05Picture):boolean;readPicture():DatL05Picture;}
export interface DatL05DragActions{press(id:DatSourceId):void;move(xTwips:number,yTwips:number):void;drop(target:DatTargetId|null):void;cancel():void;openPopup(id:DatPopupId):void;closePopup(id:DatPopupId):void;}
const overlay=(b:Bounds,depth:number):React.CSSProperties=>({position:'absolute',left:`${b.x/8}%`,top:`${b.y/6}%`,width:`${b.width/8}%`,height:`${b.height/6}%`,zIndex:depth*10,padding:0,border:0,minWidth:0,minHeight:0,boxSizing:'border-box',background:'transparent',boxShadow:'none'});
const buttonStyle:React.CSSProperties={minHeight:44,padding:'8px 12px',font:'600 1rem system-ui'};
const at=(r:Readonly<{firstFrame:number;lastFrame:number}>,frame:number)=>frame>=r.firstFrame&&frame<=r.lastFrame;
const contains=(b:Bounds,p:{x:number;y:number})=>p.x>=b.x&&p.x<=b.x+b.width&&p.y>=b.y&&p.y<=b.y+b.height;
function initial(config:DatL05DragConfig):DatL05Picture{return{mainFrame:1,interaction:{positions:Object.fromEntries(config.items.map(i=>[i.sourceId,{...i.originTwips}])) as Record<DatSourceId,{x:number;y:number}>,feedbackObjectId:null,feedbackFrame:1,enlargements:Object.fromEntries(config.popups.map(p=>[p.instanceName,{open:false,elapsedFrames:0}])) as Record<DatPopupId,{open:boolean;elapsedFrames:number}>}};}
/** Source drawing stays on Canvas; transparent hit areas follow source coordinates,
 * while separate native buttons provide a modern keyboard and touch alternative. */
export function DatL05DragCandidateRenderer({config,view,actions,onSurfaceReady,externalClock=false,...props}:AnimationRendererProps&{config:DatL05DragConfig;view?:DatL05View;actions?:DatL05DragActions;onSurfaceReady?:(surface:DatL05DragSurface|null)=>void;externalClock?:boolean}){
 if(config.animationId!=='shared-dat001-l05-p040'||config.sourceSwfSha256!=='0945d41f55d2c0746ccd4e7d820983f3eea2c49bf9c54e1f6174f5ee33d420f6')throw Error('DAT source surface mismatch');
 const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null),picture=useRef<DatL05Picture>(initial(config));
 const pointer=useRef<{id:number;sourceId:DatSourceId;offset:{x:number;y:number};node:HTMLButtonElement}|null>(null);
 const[ready,setReady]=useState(false),[error,setError]=useState<string|null>(null),[target,setTarget]=useState<HTMLElement|null>(null);
 const language=props.uiLanguage??props.lang,es=language==='es',eligible=(props.frameDomain??'sprite-315')==='sprite-315'&&props.scenario==='source-static-frame'&&!props.entryStateSha256;
 const shown=externalClock?picture.current:(view?.picture??{...initial(config),mainFrame:props.frame}),frame=shown.mainFrame;
 const enabled=ready&&!error&&Boolean(actions),question=eligible&&frame===238,dragPhases=['question','feedback-playing','feedback-paused','starting-feedback'];
 const canPress=(id:DatSourceId)=>enabled&&question&&!view?.interaction.locked.includes(id)&&Boolean(view&&(dragPhases.includes(view.phase)||(view.phase==='dragging'&&view.interaction.activeSource===id)));
 const ranges=(rows:readonly Range[])=>rows.filter(r=>at(r,frame));
 const visibleGlossary=eligible?config.glossary.filter(g=>ranges(g.placements).length):[];
 const visiblePopups=eligible?config.popups.filter(p=>ranges(p.placements).length):[];
 useEffect(()=>{const n=props.pageInteractionCompanionTargetId?document.getElementById(props.pageInteractionCompanionTargetId):null;setTarget(n?.dataset.pageInteractionCompanionHost==='true'?n:null);},[props.pageInteractionCompanionTargetId]);
 useEffect(()=>{let active=true;setReady(false);setError(null);prepareFrozenGlossaryCanvas(config).then(()=>{if(active)setReady(true);},e=>{if(active)setError(e.message);});return()=>{active=false;};},[config]);
 const makeSurface=useCallback(():DatL05DragSurface=>({paint(p){if(!ready||!canvas.current)return false;const asset=window.HELP_MATH_CANVAS_ASSETS?.[config.animationId];if(!asset)return false;const result=(asset.render as unknown as(c:HTMLCanvasElement,p:unknown)=>{localFrame:number})(canvas.current,{frame:p.mainFrame,interaction:p.interaction,lang:'en',scenario:'source-static-frame',seed:0});
  if(result.localFrame!==p.mainFrame||canvas.current.dataset.sourceFeedbackObject!==String(p.interaction.feedbackObjectId)||canvas.current.dataset.sourceFeedbackFrame!==String(p.interaction.feedbackFrame))return false;picture.current=p;return true;},readPicture(){return picture.current;}}),[ready,config]);
 useLayoutEffect(()=>{if(!ready)return;try{if(!makeSurface().paint(externalClock?picture.current:shown))throw Error('DAT source picture not committed');}catch(e){setError(e instanceof Error?e.message:String(e));}},[ready,makeSurface,externalClock,props.frame]);
 useLayoutEffect(()=>{if(!ready||error)return;onSurfaceReady?.(makeSurface());return()=>onSurfaceReady?.(null);},[ready,error,makeSurface,onSurfaceReady]);
 useEffect(()=>()=>{const p=pointer.current;pointer.current=null;if(p){try{p.node.releasePointerCapture(p.id);}catch{/* browser already released capture */}}},[]);
 const point=(clientX:number,clientY:number)=>{const rect=stage.current!.getBoundingClientRect();return{x:(clientX-rect.left)*800/rect.width,y:(clientY-rect.top)*600/rect.height};};
 const sourcePoint=(p:{x:number;y:number})=>({x:(p.x-config.mainOriginPixels.x)*20,y:(p.y-config.mainOriginPixels.y)*20});
 const move=(e:React.PointerEvent<HTMLButtonElement>)=>{const p=pointer.current;if(!p||p.id!==e.pointerId)return;const v=sourcePoint(point(e.clientX,e.clientY));actions?.move(v.x-p.offset.x,v.y-p.offset.y);};
 const pick=(id:DatSourceId,e:React.PointerEvent<HTMLButtonElement>)=>{if(!canPress(id)||pointer.current||e.button!==0)return;e.preventDefault();const current=picture.current.interaction.positions[id],v=sourcePoint(point(e.clientX,e.clientY));pointer.current={id:e.pointerId,sourceId:id,offset:{x:v.x-current.x,y:v.y-current.y},node:e.currentTarget};e.currentTarget.setPointerCapture(e.pointerId);actions?.press(id);};
 const release=(e:React.PointerEvent<HTMLButtonElement>,cancel:boolean)=>{const held=pointer.current;if(!held||held.id!==e.pointerId)return;pointer.current=null;try{held.node.releasePointerCapture(held.id);}catch{/* implicit browser release */}if(cancel){actions?.cancel();return;}
  const p=point(e.clientX,e.clientY),shown=picture.current;
  const covered=config.popups.some(w=>shown.interaction.enlargements[w.instanceName].open&&w.placements.some(r=>at(r,shown.mainFrame)&&contains(r.bounds,p)));
  const target=!covered?config.items.flatMap(i=>i.targetPlacements.filter(r=>at(r,shown.mainFrame)&&contains(r.bounds,p)).map(r=>({id:i.targetId,depth:r.depth}))).sort((a,b)=>b.depth-a.depth)[0]?.id:null;
  actions?.drop(target??null);
 };
 const glossary=(g:DatL05DragConfig['glossary'][number],trigger:HTMLButtonElement)=>{if(!eligible||!ready||error||!g.placements.some(r=>at(r,picture.current.mainFrame)))return;if(view?.phase==='dragging')actions?.cancel();props.onLessonHostRequest?.({type:'open-glossary',entryId:g.entryId},{trigger});};
 const selected=config.items.find(i=>i.sourceId===view?.interaction.activeSource);
 const controls=<section data-dat-l05-controls={config.animationId} aria-label={es?'Actividad de probabilidad':'Probability activity'} style={{padding:12}}>
  {question?<><p lang="en">{config.prompt}</p><p>{es?'Selecciona un término y luego su definición.':'Select a term, then select its matching definition.'}</p><div style={{display:'flex',flexWrap:'wrap',gap:8}}>{config.items.map(i=><button key={i.sourceId} lang="en" type="button" style={buttonStyle} data-dat-l05-source={i.sourceId} aria-pressed={view?.interaction.activeSource===i.sourceId} disabled={!canPress(i.sourceId)||view?.phase==='dragging'} onClick={()=>actions?.press(i.sourceId)}>{i.label}</button>)}</div>
   <div style={{display:'grid',gap:8,marginTop:8}}>{config.items.map((i,n)=><button type="button" key={i.targetId} data-dat-l05-target={i.targetId} style={{...buttonStyle,textAlign:'left'}} disabled={!enabled||view?.phase!=='dragging'} onClick={()=>actions?.drop(i.targetId)}>{n+1}. <span lang="en">{i.definitionText}</span></button>)}</div>
   <button type="button" data-dat-l05-cancel style={buttonStyle} disabled={!enabled||view?.phase!=='dragging'} onClick={()=>actions?.cancel()}>{es?'Cancelar selección':'Cancel selection'}</button>
   <p aria-live="polite" data-dat-l05-feedback style={{minHeight:48}}>{selected?<span lang="en">{selected.label}</span>:view?.interaction.feedback?.kind==='wrong'?(es?'Inténtalo de nuevo.':'Try again.'):view?.interaction.feedback?.kind==='right'?(es?'Correspondencia correcta.':'Correct match.'):null} {es?`${view?.interaction.correctDrops??0} de 5 términos colocados.`:`Matched ${view?.interaction.correctDrops??0} of 5 terms.`}</p>
  </>:null}
  {visiblePopups.length?<div style={{display:'flex',flexWrap:'wrap',gap:8}}>{visiblePopups.map((p,n)=><React.Fragment key={p.instanceName}><button type="button" style={buttonStyle} data-dat-l05-popup={p.instanceName} disabled={!enabled} onClick={()=>actions?.openPopup(p.instanceName)}>{es?'Ampliar imagen':'Enlarge picture'} {n+1}</button>{shown.interaction.enlargements[p.instanceName].open?<button type="button" style={buttonStyle} data-dat-l05-popup-close={p.instanceName} disabled={!enabled} onClick={()=>actions?.closePopup(p.instanceName)}>{es?'Cerrar imagen':'Close picture'} {n+1}</button>:null}</React.Fragment>)}</div>:null}
  {visibleGlossary.length?<div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>{visibleGlossary.map(g=><button key={g.characterId} type="button" style={buttonStyle} data-dat-l05-glossary={g.characterId} disabled={!ready||Boolean(error)||!props.onLessonHostRequest} onClick={e=>glossary(g,e.currentTarget)}>{g.labels[language]}</button>)}</div>:null}
 </section>;
 return <div data-dat-l05-drag-candidate={config.animationId} data-source-surface-ready={ready&&!error?'true':'false'}><div ref={stage} style={{position:'relative',isolation:'isolate',width:'100%',maxWidth:800,aspectRatio:'4 / 3'}}>
  <canvas ref={canvas} width={800} height={600} aria-label={es?'Relaciona los términos de probabilidad; también puedes usar los botones debajo.':'Match the probability terms; you can also use the buttons below.'} style={{display:'block',width:'100%',height:'100%'}}/>
  {eligible&&config.items.flatMap(i=>ranges(i.sourcePlacements).map(r=>{const p=shown.interaction.positions[i.sourceId],b={...r.bounds,x:r.bounds.x+(p.x-i.originTwips.x)/20,y:r.bounds.y+(p.y-i.originTwips.y)/20};return<button key={i.sourceId+'-'+r.depth} type="button" tabIndex={-1} aria-hidden="true" data-dat-l05-source-overlay={i.sourceId} style={{...overlay(b,r.depth),touchAction:'none',cursor:'grab'}} disabled={!canPress(i.sourceId)} onPointerDown={e=>pick(i.sourceId,e)} onPointerMove={move} onPointerUp={e=>release(e,false)} onPointerCancel={e=>release(e,true)} onLostPointerCapture={e=>{if(pointer.current?.id===e.pointerId)release(e,true);}}/>;}))}
  {eligible&&config.popupOpenButtons.flatMap(b=>ranges(b.placements).map(r=><button key={b.characterId+'-'+r.depth} type="button" tabIndex={-1} aria-hidden="true" data-dat-l05-popup-overlay={b.characterId} style={{...overlay(r.bounds,r.depth),cursor:'pointer'}} disabled={!enabled} onClick={()=>actions?.openPopup(b.targetInstance)}/>))}
  {visiblePopups.filter(p=>shown.interaction.enlargements[p.instanceName].open).flatMap(p=>ranges(p.placements).map(r=><React.Fragment key={p.instanceName+'-'+r.depth}><div data-dat-l05-popup-block={p.instanceName} style={overlay(r.bounds,r.depth)}/>{p.closeBounds.filter(b=>at(b,frame)).map((b,i)=><button key={i} type="button" tabIndex={-1} aria-hidden="true" data-dat-l05-popup-close-overlay={p.instanceName} style={{...overlay(b,r.depth),zIndex:r.depth*10+1,cursor:'pointer'}} disabled={!enabled} onClick={()=>actions?.closePopup(p.instanceName)}/>)}</React.Fragment>))}
  {visibleGlossary.flatMap(g=>ranges(g.placements).map(r=><button key={g.characterId+'-'+r.depth} type="button" tabIndex={-1} aria-hidden="true" data-dat-l05-glossary-overlay={g.characterId} style={{...overlay(r.bounds,r.depth),cursor:'pointer'}} disabled={!ready||Boolean(error)||!props.onLessonHostRequest} onClick={e=>glossary(g,e.currentTarget)}/>))}
 </div>{error?<p role="alert">{es?'No se pudo cargar la animación.':'The animation could not be loaded.'}</p>:null}{target?createPortal(controls,target):controls}</div>;
}
