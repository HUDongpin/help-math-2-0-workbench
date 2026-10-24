'use client';
import {useEffect,useRef,useState,type CSSProperties,type PointerEvent as ReactPointerEvent} from 'react';
import {createPortal} from 'react-dom';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps,LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import type {SourceStaticCanvasCandidateConfig} from '../../../packages/demos/src/source-static-canvas-candidate';
import {P007SourceClockV1,type P007AudioPlan,type P007Picture} from '../../../packages/demos/src/nms-l01-p007-source-clock-v1';
import {p007TargetAtPoint,type P007Card,type P007CardId,type P007Point} from '../../../packages/demos/src/nms-l01-p007-interaction-v1';
type Localized=Readonly<{en:string;es:string}>;
type Glossary=Readonly<{id:string;labels:Localized;definitions:Localized}>;
type Practice=Readonly<{prompt:string;helpPrompt:string;helpDefinition:string;helpExamples:readonly number[];cards:readonly P007Card[];controls:readonly Readonly<{entryId:string;sourceCharacterId:number;surface:string;labels:Localized;firstMainFrame:number;lastMainFrame:number}>[];glossary:readonly Glossary[]}>;
type Attachment=Readonly<{version:1;CONFIG:SourceStaticCanvasCandidateConfig;PLAN:P007AudioPlan;PRACTICE:Practice;sourceAudioPayloads:Readonly<Record<string,string>>;prepare:()=>Promise<unknown>}>;
type Snapshot=ReturnType<P007SourceClockV1['snapshot']>;
const ID='shared-nms002-l01-p007';
const buttonStyle:CSSProperties={minHeight:44,padding:'8px 12px',border:'1px solid var(--line, #8797a9)',borderRadius:9,background:'var(--paper, white)',color:'var(--ink, #132a40)',fontWeight:600};
const boxStyle:CSSProperties={padding:16,border:'1px solid var(--line, #8797a9)',borderRadius:12,background:'var(--paper, white)',color:'var(--ink, #132a40)',fontSize:16,lineHeight:1.5};
export function NmsL1P007SourceRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null),clockRef=useRef<P007SourceClockV1|null>(null),controlsRef=useRef<LessonRuntimeAdapterControls|null>(null);
 const[practice,setPractice]=useState<Practice|null>(null),[snapshot,setSnapshot]=useState<Snapshot|null>(null),[error,setError]=useState<string|null>(null),[reduced,setReduced]=useState(false),[paintedFrame,setPaintedFrame]=useState(1),[companion,setCompanion]=useState<HTMLElement|null>(null),[glossary,setGlossary]=useState<string|null>(null);
 const sync=useRef<()=>void>(()=>{}),lastSeek=useRef(0),dialog=useRef<HTMLDivElement>(null),focusReturn=useRef<HTMLElement|null>(null),helpTerm=useRef<string|null>(null),previousDialog=useRef<string|null>(null);
 const pointer=useRef<{id:number;card:P007CardId;start:P007Point;offset:P007Point;moved:boolean}|null>(null);
 useEffect(()=>{const cancel=(event:KeyboardEvent)=>{if(event.key==='Escape'&&pointer.current){event.preventDefault();pointer.current=null;clockRef.current?.cancel();sync.current();}};window.addEventListener('keydown',cancel);return()=>window.removeEventListener('keydown',cancel);},[]);
 const language=props.uiLanguage==='es'?'es':'en',es=language==='es';
 useEffect(()=>{const source=stage.current,owner=source?.closest('.lesson-shell2__learning-column'),id=props.pageInteractionCompanionTargetId;if(!source||!owner||!id?.endsWith('-terminal-source-v1-readable'))return;
  const resolve=()=>{const target=document.getElementById(id);setCompanion(target?.parentElement===owner&&target.dataset.pageInteractionCompanionHost==='true'&&!source.contains(target)?target:null);};resolve();const observer=new MutationObserver(resolve);observer.observe(owner,{childList:true,subtree:true});return()=>observer.disconnect();
 },[props.pageInteractionCompanionTargetId]);
 useEffect(()=>{
  let active=true,ready=false,clock:P007SourceClockV1|undefined,raf=0,ticket=0,lastPaint='',lastView='',lastReport='',completeReported=false,wantPlay=!latest.current.paused,painted=1,runtimeFailed=false;
  const media=matchMedia('(prefers-reduced-motion: reduce)');let motion=media.matches;setReduced(motion);const motionChanged=()=>{motion=media.matches;setReduced(motion);};media.addEventListener('change',motionChanged);
  const pause=()=>{wantPlay=false;ticket++;clock?.pause();latest.current.onRuntimePausedChange(true);};
  const start=(activation:'automatic'|'user')=>{wantPlay=true;if(!active||!ready||!clock)return;if(motion&&activation==='automatic'){pause();return;}
   if(clock.snapshot().phase==='ended'){clock.replay();setGlossary(null);completeReported=false;latest.current.onReplay?.();}const turn=++ticket;latest.current.onRuntimePausedChange(false);void clock.play({activation,reducedMotion:motion}).then(r=>{if(active&&turn===ticket&&!r.accepted)pause();});
  };
  const stop=()=>{active=false;ticket++;cancelAnimationFrame(raf);pointer.current=null;void clock?.close();};
  const controls:LessonRuntimeAdapterControls={setPaused:v=>v?pause():start('user'),replay(){if(!active||!ready||!clock)return false;ticket++;clock.replay();pointer.current=null;setGlossary(null);completeReported=false;start('user');return true;},narration:a=>a==='stop'?pause():start('user'),stop};
  controlsRef.current=controls;const disconnect=props.connectRuntimeControls(controls);
  const init=async()=>{
   if(process.env.NODE_ENV==='production'||props.animationId!==ID||props.moduleKey!==ID||props.audioEnabled!==true||props.query.capture==='1'||props.query.lang!=='en'||props.query.frameDomain!=='sprite-120'||props.query.scenario!=='source-static-frame'||String(props.query.seed)!=='0')throw Error('P007_PRIVATE_SCOPE_MISMATCH');
   const module=await loadClientAnimationModule(ID) as (AnimationModule&{privateP007Practice?:Attachment})|undefined;if(!active)return;const a=module?.privateP007Practice;
   if(module?.key!==ID||!a||a.version!==1||a.CONFIG.animationId!==ID||a.CONFIG.mainFrameDomain!=='sprite-120'||a.CONFIG.mainFrameCount!==220||a.PLAN.sourceSwfSha256!==a.CONFIG.sourceSwfSha256||a.PRACTICE.cards.length!==4||a.PRACTICE.controls.length!==5)throw Error('P007_REGISTERED_SOURCE_MISSING');
   setPractice(a.PRACTICE);await a.prepare();if(!active)return;
   const asset=window.HELP_MATH_CANVAS_ASSETS?.[ID] as (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string]&{metadata?:{sourceSwfSha256?:string}})|undefined;
   if(!asset||asset.metadata?.sourceSwfSha256!==a.CONFIG.sourceSwfSha256)throw Error('P007_SOURCE_CANVAS_MISSING');
   const paint=(picture:P007Picture,force=false)=>{
    const target=canvas.current;if(!active||!target||window.HELP_MATH_CANVAS_ASSETS?.[ID]!==asset)return false;
    let frame=picture.mainFrame;
    // Reduced motion presents the static introduction, exercise and ending. Direct user dragging remains available.
    if(motion&&!force&&frame<178)frame=1;else if(motion&&!force&&frame>178&&frame<220)frame=178;
    const request={frame,scenario:'source-static-frame',lang:'en',seed:0,interaction:picture.interaction},key=JSON.stringify(request);
    if(key!==lastPaint){const state=asset.render(target,request) as {localFrame?:number;frameDomain?:string};if(state.localFrame!==frame||state.frameDomain!=='sprite-120'||target.dataset.flashFrame!==String(frame))return false;lastPaint=key;painted=frame;target.dataset.renderState='ready';target.style.display='block';setPaintedFrame(frame);stage.current?.setAttribute('data-flash-frame',String(frame));}
    // A drawn, connected Canvas is committed even when the responsive host temporarily skips offscreen layout.
    return target.isConnected&&target.width===800&&target.height===600;
   };
   clock=new P007SourceClockV1(a.PLAN,a.PRACTICE.cards,{commitPicture:p=>paint(p,true)});clockRef.current=clock;
   const payloads=new Map(Object.entries(a.sourceAudioPayloads).map(([id,b])=>[id,Uint8Array.from(atob(b),c=>c.charCodeAt(0)).buffer]));
   const result=await clock.prepare(payloads);if(!active)return;if(!result.accepted)throw Error(result.reason);clock.setVolume(latest.current.volume??1);ready=true;
   const draw=()=>{if(!active||!clock||runtimeFailed)return;const s=clock.snapshot();if(s.phase==='failed'){runtimeFailed=true;setSnapshot(s);setError(s.failure??'P007_SOURCE_FAILED');latest.current.onRuntimePausedChange(true);void clock.close();return;}if(!paint(s.picture)){pause();setError('P007_SOURCE_PAINT_FAILED');return;}
    const viewKey=JSON.stringify({...s,contextTime:null,audioSample:0,operationSeconds:0});if(viewKey!==lastView){lastView=viewKey;setSnapshot(s);}
    const report:AnimationRuntimePlaybackState={audioAvailable:true,frame:painted,frameCount:220,frameDomain:'sprite-120',fps:12,narration:s.audioNodePlaying?'playing':'idle',playbackProgress:motion||s.inspectionMode?null:(s.picture.mainFrame-1)/219,seekAvailable:true,stepFrames:20,transportMode:'visual-frame-inspector'};
    const key=JSON.stringify(report);if(key!==lastReport){lastReport=key;latest.current.onPlaybackStateChange?.(report);}
    if(s.phase==='ended'&&!completeReported){completeReported=true;if(s.correctDrops===4&&!s.inspectionMode&&!motion)latest.current.onPlaybackComplete?.();latest.current.onRuntimePausedChange(true);}
    if(s.phase==='paused'&&s.globalPaused&&!latest.current.paused)latest.current.onRuntimePausedChange(true);
   };
   sync.current=draw;const loop=()=>{draw();if(active)raf=requestAnimationFrame(loop);};loop();if(wantPlay)start('automatic');else latest.current.onRuntimePausedChange(true);
  };
  void init().catch(e=>{if(!active)return;pause();void clock?.close();setError(e instanceof Error?e.message:String(e));});
  return()=>{stop();sync.current=()=>{};media.removeEventListener('change',motionChanged);disconnect();if(clockRef.current===clock)clockRef.current=null;if(controlsRef.current===controls)controlsRef.current=null;};
 },[props.animationId,props.moduleKey,props.audioEnabled,props.connectRuntimeControls]);
 useEffect(()=>{const c=clockRef.current;if(!c)return;if(props.paused&&['playing','starting'].includes(c.snapshot().phase))c.pause();else if(!props.paused&&snapshot&&c.snapshot().phase==='paused')controlsRef.current?.setPaused(false);},[props.paused,Boolean(snapshot)]);
 useEffect(()=>{clockRef.current?.setVolume(props.volume??1);},[props.volume]);
 useEffect(()=>{const q=props.seekRequest,c=clockRef.current;if(!q||!c||!snapshot||q.requestId===lastSeek.current)return;lastSeek.current=q.requestId;setGlossary(null);pointer.current=null;c.inspect(q.frame);props.onRuntimePausedChange(true);sync.current();},[props.seekRequest,Boolean(snapshot),props.onRuntimePausedChange]);
 const popup=snapshot?.picture.interaction.popup??'none',entry=practice?.glossary.find(e=>e.id===glossary),dialogKey=entry?`glossary:${entry.id}`:popup==='none'?null:popup;
 const closeDialog=()=>{if(entry){setGlossary(null);return;}clockRef.current?.closePopup();sync.current();};
 const closeDialogRef=useRef(closeDialog);closeDialogRef.current=closeDialog;
 useEffect(()=>{
  const prior=previousDialog.current;previousDialog.current=dialogKey;
  if(dialogKey){if(!prior&&!focusReturn.current)focusReturn.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
   const target=prior?.startsWith('glossary:')&&dialogKey==='help'&&helpTerm.current?dialog.current?.querySelector<HTMLButtonElement>(`[data-p007-glossary="${helpTerm.current}"]`):dialog.current?.querySelector<HTMLButtonElement>('[data-p007-dialog-close]');target?.focus();
  }else if(prior){const target=focusReturn.current;focusReturn.current=null;if(target?.isConnected)target.focus();}
 },[dialogKey]);
 const rememberFocus=(fallback:string)=>{if(previousDialog.current)return;const current=document.activeElement;focusReturn.current=current instanceof HTMLButtonElement?current:document.querySelector<HTMLElement>(fallback);};
 const openGlossary=(id:string)=>{if(!practice?.glossary.some(e=>e.id===id))return;rememberFocus(`[data-p007-companion] [data-p007-glossary="${id}"]`);if(popup==='help')helpTerm.current=id;clockRef.current?.pause();props.onRuntimePausedChange(true);setGlossary(id);sync.current();};
 const canAct=Boolean(snapshot&&['question','dragging'].includes(snapshot.phase)&&!entry);
 const select=(id:P007CardId)=>{if(!canAct)return;clockRef.current?.select(id);sync.current();};
 const drop=(target:string|null)=>{const c=clockRef.current;if(!c)return;focusReturn.current=document.querySelector<HTMLElement>(`[data-p007-card="${c.snapshot().interaction.selected}"]`);props.onRuntimePausedChange(false);void c.drop(target,{activation:'user',reducedMotion:reduced}).then(()=>sync.current());sync.current();};
 const point=(event:ReactPointerEvent):P007Point|null=>{const rect=canvas.current?.getBoundingClientRect();return rect&&rect.width>0&&rect.height>0?{x:(event.clientX-rect.left)*800/rect.width,y:(event.clientY-rect.top)*600/rect.height}:null;};
 const dragStart=(event:ReactPointerEvent<HTMLDivElement>,card:P007Card)=>{if(!canAct||snapshot?.interaction.locked.includes(card.id)||event.button!==0)return;const p=point(event);if(!p)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);select(card.id);const pos=clockRef.current?.snapshot().interaction.positions[card.id]??card.originTwips;pointer.current={id:event.pointerId,card:card.id,start:p,offset:{x:p.x-(414.4+pos.x/20),y:p.y-(283.3+pos.y/20)},moved:false};};
 const dragMove=(event:ReactPointerEvent<HTMLDivElement>)=>{const d=pointer.current,p=point(event);if(!d||!p||d.id!==event.pointerId)return;d.moved||=Math.hypot(p.x-d.start.x,p.y-d.start.y)>5;if(d.moved){clockRef.current?.move({x:(p.x-d.offset.x-414.4)*20,y:(p.y-d.offset.y-283.3)*20});sync.current();}};
 const dragEnd=(event:ReactPointerEvent<HTMLDivElement>,cancel=false)=>{const d=pointer.current;if(!d||d.id!==event.pointerId)return;pointer.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);if(cancel){clockRef.current?.cancel();sync.current();}else if(d.moved)drop(p007TargetAtPoint(practice?.cards??[],point(event)));};
 const help=()=>{if(!canAct)return;rememberFocus('[data-p007-help]');clockRef.current?.openHelp();props.onRuntimePausedChange(true);sync.current();};
 const glossaryButtons=(surface:'main'|'help')=>practice?.controls.filter(c=>(c.surface===surface||c.surface==='both')&&(snapshot?.picture.mainFrame??1)>=c.firstMainFrame).map(c=><button key={c.entryId} type="button" style={buttonStyle} data-p007-glossary={c.entryId} onClick={()=>openGlossary(c.entryId)}>{c.labels[language]}</button>);
 const status=snapshot?.phase==='ended'&&snapshot.correctDrops===4?(es?'¡Completado! Los cuatro enteros están en su posición.':'Complete! All four integers are in position.'):
  snapshot?.interaction.result==='wrong'?(es?'Inténtalo de nuevo. El entero vuelve a su lugar.':'Try again. The integer returns to its starting place.'):
  snapshot?.interaction.selected?(es?`Entero seleccionado: ${practice?.cards.find(c=>c.id===snapshot.interaction.selected)?.label}. Elige una posición.`:`Selected integer: ${practice?.cards.find(c=>c.id===snapshot.interaction.selected)?.label}. Choose a position.`):
  canAct?(es?'Elige un entero y luego una posición en la recta numérica.':'Choose an integer, then choose a position on the number line.'):(es?'Escucha la explicación.':'Listen to the explanation.');
 const companionContent=practice&&snapshot?<section data-p007-companion style={{...boxStyle,margin:'12px auto',width:'min(100%,680px)'}} onKeyDown={event=>{if(event.key==='Escape'&&snapshot.interaction.selected){event.preventDefault();clockRef.current?.cancel();sync.current();}}}>
  <h3 style={{margin:'0 0 8px',fontSize:18}}>{es?'Práctica con enteros':'Integer practice'}</h3>
  <p lang="en" style={{margin:'0 0 10px'}}>{practice.prompt}</p>
  <p role="status" aria-live="polite" data-p007-status>{status}</p>
  {snapshot.picture.mainFrame===178?<><div role="group" aria-label={es?'Enteros disponibles':'Available integers'} style={{display:'flex',flexWrap:'wrap',gap:8}}>{practice.cards.map(c=><button type="button" key={c.id} style={{...buttonStyle,outline:snapshot.interaction.selected===c.id?'3px solid #146b9c':undefined,minWidth:60}} data-p007-card={c.id} disabled={!canAct||snapshot.interaction.locked.includes(c.id)} aria-pressed={snapshot.interaction.selected===c.id} aria-label={`${es?'Entero':'Integer'} ${c.accessibleLabels[language]}`} onClick={()=>select(c.id)}>{c.label}{snapshot.interaction.locked.includes(c.id)?' ✓':''}</button>)}</div>
  <div role="group" aria-label={es?'Posiciones de la recta numérica':'Number line positions'} style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,marginTop:12}}>{practice.cards.map(c=><button type="button" key={c.targetId} style={buttonStyle} data-p007-target={c.targetId} disabled={!canAct||!snapshot.interaction.selected||snapshot.interaction.locked.includes(c.id)} onClick={()=>drop(c.targetId)}>{es?'Entre':'Between'} {c.neighborValues[0]} {es?'y':'and'} {c.neighborValues[1]}{snapshot.interaction.locked.includes(c.id)?` → ${c.label}`:''}</button>)}</div>
  <p style={{fontSize:14}}>{es?'También puedes arrastrar los enteros en la imagen.':'You can also drag the integers in the picture.'}</p>
  <button type="button" style={buttonStyle} data-p007-help disabled={!canAct} onClick={help}>{es?'Necesito más ayuda':'Need More Help'}</button></>:null}
  <div role="group" aria-label={es?'Términos de la página':'Page terms'} style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}>{glossaryButtons('main')}</div>
 </section>:null;
 const modal=dialogKey&&practice?<div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(12,25,42,.48)',display:'grid',placeItems:'center',padding:16}}><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`${ID}-dialog-title`} data-p007-dialog={dialogKey} style={{...boxStyle,width:'min(100%,620px)',maxHeight:'85dvh',overflowY:'auto',boxShadow:'0 16px 60px #10203044'}} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeDialogRef.current();}if(e.key==='Tab'){const list=[...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')];if(!list.length)return;const first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}>
  <h3 id={`${ID}-dialog-title`}>{entry?entry.labels[language]:popup==='wrong'?(es?'¡Inténtalo de nuevo!':'Try again!'):(es?'Ayuda con los enteros':'Integer help')}</h3>
  {entry?<p>{entry.definitions[language]}</p>:popup==='wrong'?<p>{es?'Cierra este mensaje y prueba otra posición en la recta numérica.':'Close this message and try another position on the number line.'}</p>:<><p lang="en">{practice.helpDefinition}</p><p>{es?'Ejemplos':'Examples'}: {practice.helpExamples.join(', ')}</p><p>{Array.from({length:19},(_,i)=>i-9).join(' · ')}</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{glossaryButtons('help')}</div></>}
  <button type="button" data-p007-dialog-close style={{...buttonStyle,marginTop:16}} onClick={closeDialog}>{entry&&popup==='help'?(es?'Volver a la ayuda':'Back to help'):(es?'Cerrar':'Close')}</button>
 </div></div>:null;
 return <div className="runtime-shell" style={{'--flash-stage-width':'800px','--flash-stage-height':'600px','--flash-stage-aspect':'800 / 600'} as CSSProperties} data-source-clock-runtime={ID} data-source-clock-phase={snapshot?.phase??'loading'} data-source-failure={snapshot?.failure??''} data-source-operation={snapshot?.operation??'intro'} data-source-audio-domain={snapshot?.audioDomain??''} data-source-audio-frame={snapshot?.picture.mainFrame??1} data-source-audio-playing={snapshot?.audioNodePlaying?'true':'false'} data-source-correct-drops={snapshot?.correctDrops??0} data-source-attempts={snapshot?.interaction.attempts??0} data-source-quiz-active={snapshot?.sourceQuizActive?'true':'false'} data-source-inspection={snapshot?.inspectionMode?'true':'false'} data-runtime-volume={props.volume??1} data-audio-available={snapshot?'true':'false'} data-runtime-paused={props.paused?'true':'false'} data-runtime-presentation="modern-wide" data-runtime-playback-complete={snapshot?.phase==='ended'&&snapshot.correctDrops===4&&!snapshot.inspectionMode&&!reduced?'true':'false'}>
  <div ref={stage} className="runtime-stage" style={{position:'relative',height:'auto',aspectRatio:'4 / 3'}} data-animation-module={ID} data-flash-frame={paintedFrame} data-flash-frame-domain="sprite-120" data-source-clock-ready={snapshot?'true':'false'}>
   <canvas ref={canvas} width={800} height={600} data-course-canvas={ID} aria-label={es?'Práctica: enteros en una recta numérica':'Practice: integers on a number line'} style={{display:snapshot?'block':'none',width:'100%',height:'auto'}}/>
   {snapshot&&paintedFrame>=5&&!dialogKey?[
    {id:'integers',tx:-2215,sx:1.148300170898438},{id:'position',tx:1693,sx:1.263931274414062},{id:'number-line',tx:4942,sx:1.847335815429688},
   ].map(c=><div key={c.id} aria-hidden="true" data-p007-source-glossary={c.id} onClick={()=>openGlossary(c.id)} style={{position:'absolute',left:`${(414.4+c.tx/20-604*c.sx/20)/8}%`,top:`${(283.3-3019/20-192*1.173065185546875/20)/6}%`,width:`${1207*c.sx/20/8}%`,height:`${383*1.173065185546875/20/6}%`,cursor:'pointer'}}/>):null}
   {snapshot?.picture.mainFrame===178&&!dialogKey?<div aria-hidden="true" data-p007-source-help onClick={help} style={{position:'absolute',left:`${(414.4+5625/20-1335/20)/8}%`,top:`${(283.3-1833/20-315/20)/6}%`,width:`${2661/20/8}%`,height:`${630/20/6}%`,cursor:canAct?'pointer':'default'}}/>:null}
   {practice&&snapshot?.picture.mainFrame===178&&!dialogKey?practice.cards.filter(c=>!snapshot.interaction.locked.includes(c.id)).map(c=>{const p=snapshot.interaction.positions[c.id],x=c.sourceBounds.x+(p.x-c.originTwips.x)/20,y=c.sourceBounds.y+(p.y-c.originTwips.y)/20;return <div key={c.id} aria-hidden="true" data-p007-drag={c.id} onPointerDown={e=>dragStart(e,c)} onPointerMove={dragMove} onPointerUp={e=>dragEnd(e)} onPointerCancel={e=>dragEnd(e,true)} onLostPointerCapture={e=>{if(pointer.current?.id===e.pointerId)dragEnd(e,true);}} style={{position:'absolute',left:`${x/8}%`,top:`${y/6}%`,width:`${c.sourceBounds.width/8}%`,height:`${c.sourceBounds.height/6}%`,touchAction:'none',cursor:canAct?'grab':'default',outline:snapshot.interaction.selected===c.id?'2px solid #146b9c':undefined,borderRadius:4}}/>;}):null}
  </div>
  {companion&&companionContent?createPortal(companionContent,companion):companionContent}
  {modal&&typeof document!=='undefined'?createPortal(modal,document.body):null}
  {!snapshot&&!error?<p role="status">{props.labels.loading}</p>:null}{error?<p role="alert" data-source-clock-error={error}>{props.labels.unavailable}</p>:null}{reduced?<p>{props.labels.reduced}</p>:null}
 </div>;
}
