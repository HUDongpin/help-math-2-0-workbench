'use client';
import {useEffect,useRef,useState,type CSSProperties,type PointerEvent as ReactPointerEvent} from 'react';
import {createPortal} from 'react-dom';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps,LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import type {SourceStaticCanvasCandidateConfig} from '../../../packages/demos/src/source-static-canvas-candidate';
import {P018SourceClockV1,type P018AudioPlan,type P018Picture} from '../../../packages/demos/src/nms-l01-p018-source-clock-v1';
import {p018TargetAtPoint,type P018Card,type P018CardId,type P018Point} from '../../../packages/demos/src/nms-l01-p018-interaction-v1';
type Localized=Readonly<{en:string;es:string}>;
type Glossary=Readonly<{id:string;labels:Localized;definitions:Localized}>;
type Bounds=Readonly<{x:number;y:number;width:number;height:number}>;
type Target=Readonly<{id:string;cardId:P018CardId;row:number;integer:number;absoluteValue:number;bounds:Bounds}>;
type Hotspot=Readonly<{entryId:string;sourceCharacterId:number;surface:'main'|'wrong';ranges:readonly Readonly<{firstFrame:number;lastFrame:number;rect:Readonly<{left:number;right:number;top:number;bottom:number}>}>[]}>;
type Practice=Readonly<{prompt:string;wrongDefinition:string;reading:readonly Readonly<{firstFrame:number;lastFrame:number;text:string}>[];cards:readonly P018Card[];targets:readonly Target[];controls:readonly Readonly<{entryId:string;sourceCharacterId:number;surface:'main'|'wrong';labels:Localized;firstMainFrame:number;lastMainFrame:number}>[];sourceHotspots:readonly Hotspot[];wrongCloseBounds:Bounds;glossary:readonly Glossary[]}>;
type Attachment=Readonly<{version:1;CONFIG:SourceStaticCanvasCandidateConfig;PLAN:P018AudioPlan;PRACTICE:Practice;sourceAudioPayloads:Readonly<Record<string,string>>;prepare:()=>Promise<unknown>}>;
type Snapshot=ReturnType<P018SourceClockV1['snapshot']>;
const ID='shared-nms002-l01-p018';
const buttonStyle:CSSProperties={minHeight:44,padding:'8px 12px',border:'1px solid var(--line, #8797a9)',borderRadius:9,background:'var(--paper, white)',color:'var(--ink, #132a40)',fontWeight:600};
const boxStyle:CSSProperties={padding:16,border:'1px solid var(--line, #8797a9)',borderRadius:12,background:'var(--paper, white)',color:'var(--ink, #132a40)',fontSize:16,lineHeight:1.5};
export function NmsL1P018SourceRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null),clockRef=useRef<P018SourceClockV1|null>(null),controlsRef=useRef<LessonRuntimeAdapterControls|null>(null);
 const[practice,setPractice]=useState<Practice|null>(null),[snapshot,setSnapshot]=useState<Snapshot|null>(null),[error,setError]=useState<string|null>(null),[reduced,setReduced]=useState(false),[paintedFrame,setPaintedFrame]=useState(1),[companion,setCompanion]=useState<HTMLElement|null>(null),[glossary,setGlossary]=useState<string|null>(null);
 const sync=useRef<()=>void>(()=>{}),lastSeek=useRef(0),dialog=useRef<HTMLDivElement>(null),focusReturn=useRef<HTMLElement|null>(null),helpTerm=useRef<string|null>(null),previousDialog=useRef<string|null>(null);
 const glossaryRef=useRef<string|null>(null),glossaryResume=useRef(false),glossaryTrigger=useRef<HTMLElement|null>(null),previousPopup=useRef(false),previousPhase=useRef('');
 const pointer=useRef<{id:number;card:P018CardId;start:P018Point;offset:P018Point;moved:boolean}|null>(null);
 useEffect(()=>{const cancel=(event:KeyboardEvent)=>{if(event.key==='Escape'&&pointer.current){event.preventDefault();pointer.current=null;clockRef.current?.cancel();sync.current();}};window.addEventListener('keydown',cancel);return()=>window.removeEventListener('keydown',cancel);},[]);
 const language=props.uiLanguage==='es'?'es':'en',es=language==='es';
 useEffect(()=>{const source=stage.current,owner=source?.closest('.lesson-shell2__learning-column'),id=props.pageInteractionCompanionTargetId;if(!source||!owner||!id?.endsWith('-terminal-source-v1-readable'))return;
  const resolve=()=>{const target=document.getElementById(id);setCompanion(target?.parentElement===owner&&target.dataset.pageInteractionCompanionHost==='true'&&!source.contains(target)?target:null);};resolve();const observer=new MutationObserver(resolve);observer.observe(owner,{childList:true,subtree:true});return()=>observer.disconnect();
 },[props.pageInteractionCompanionTargetId]);
 useEffect(()=>{
  let active=true,ready=false,clock:P018SourceClockV1|undefined,raf=0,ticket=0,lastPaint='',lastView='',lastReport='',completeReported=false,wantPlay=!latest.current.paused,painted=1,runtimeFailed=false;
  const media=matchMedia('(prefers-reduced-motion: reduce)');let motion=media.matches;setReduced(motion);const motionChanged=()=>{motion=media.matches;setReduced(motion);};media.addEventListener('change',motionChanged);
  const pause=()=>{wantPlay=false;ticket++;clock?.pause();latest.current.onRuntimePausedChange(true);};
  const start=(activation:'automatic'|'user')=>{wantPlay=true;if(!active||!ready||!clock)return;if(motion&&activation==='automatic'){pause();return;}
   if(clock.snapshot().phase==='ended'){clock.replay();setGlossary(null);glossaryRef.current=null;glossaryResume.current=false;completeReported=false;latest.current.onReplay?.();}const turn=++ticket;latest.current.onRuntimePausedChange(false);void clock.play({activation,reducedMotion:motion}).then(r=>{if(active&&turn===ticket&&!r.accepted)pause();});
  };
  const stop=()=>{active=false;ticket++;cancelAnimationFrame(raf);pointer.current=null;void clock?.close();};
  const controls:LessonRuntimeAdapterControls={setPaused:v=>v?pause():start('user'),replay(){if(!active||!ready||!clock)return false;ticket++;clock.replay();pointer.current=null;setGlossary(null);glossaryRef.current=null;glossaryResume.current=false;completeReported=false;start('user');return true;},narration:a=>a==='stop'?pause():start('user'),stop};
  controlsRef.current=controls;const disconnect=props.connectRuntimeControls(controls);
  const init=async()=>{
   if(process.env.NODE_ENV==='production'||props.animationId!==ID||props.moduleKey!==ID||props.audioEnabled!==true||props.query.capture==='1'||props.query.lang!=='en'||props.query.frameDomain!=='sprite-78'||props.query.scenario!=='source-static-frame'||String(props.query.seed)!=='0')throw Error('P018_PRIVATE_SCOPE_MISMATCH');
   const module=await loadClientAnimationModule(ID) as (AnimationModule&{privateP018Practice?:Attachment})|undefined;if(!active)return;const a=module?.privateP018Practice;
   if(module?.key!==ID||!a||a.version!==1||a.CONFIG.animationId!==ID||a.CONFIG.mainFrameDomain!=='sprite-78'||a.CONFIG.mainFrameCount!==492||a.PLAN.sourceSwfSha256!==a.CONFIG.sourceSwfSha256||a.PRACTICE.cards.length!==9||a.PRACTICE.controls.length!==5)throw Error('P018_REGISTERED_SOURCE_MISSING');
   setPractice(a.PRACTICE);await a.prepare();if(!active)return;
   const asset=window.HELP_MATH_CANVAS_ASSETS?.[ID] as (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string]&{metadata?:{sourceSwfSha256?:string}})|undefined;
   if(!asset||asset.metadata?.sourceSwfSha256!==a.CONFIG.sourceSwfSha256)throw Error('P018_SOURCE_CANVAS_MISSING');
   const paint=(picture:P018Picture,force=false)=>{
    const target=canvas.current;if(!active||!target||window.HELP_MATH_CANVAS_ASSETS?.[ID]!==asset)return false;
    let frame=picture.mainFrame;
    // Reduced motion holds the static introduction, exercise and ending. Direct user dragging remains available.
    if(motion&&!force&&frame<445)frame=1;else if(motion&&!force&&frame>445&&frame<492)frame=445;
    const request={frame,scenario:'source-static-frame',lang:'en',seed:0,interaction:picture.interaction},key=JSON.stringify(request);
    if(key!==lastPaint){const state=asset.render(target,request) as {localFrame?:number;frameDomain?:string};if(state.localFrame!==frame||state.frameDomain!=='sprite-78'||target.dataset.flashFrame!==String(frame))return false;lastPaint=key;painted=frame;target.dataset.renderState='ready';target.style.display='block';setPaintedFrame(frame);stage.current?.setAttribute('data-flash-frame',String(frame));}
    // A drawn, connected Canvas is committed even when the responsive host temporarily skips offscreen layout.
    return target.isConnected&&target.width===800&&target.height===600;
   };
   clock=new P018SourceClockV1(a.PLAN,a.PRACTICE.cards,{commitPicture:p=>paint(p,true)});clockRef.current=clock;
   const payloads=new Map(Object.entries(a.sourceAudioPayloads).map(([id,b])=>[id,Uint8Array.from(atob(b),c=>c.charCodeAt(0)).buffer]));
   const result=await clock.prepare(payloads);if(!active)return;if(!result.accepted)throw Error(result.reason);clock.setVolume(latest.current.volume??1);ready=true;
   const draw=()=>{if(!active||!clock||runtimeFailed)return;const s=clock.snapshot();if(s.phase==='failed'){runtimeFailed=true;setSnapshot(s);setError(s.failure??'P018_SOURCE_FAILED');latest.current.onRuntimePausedChange(true);void clock.close();return;}if(!paint(s.picture,s.inspectionMode)){pause();setError('P018_SOURCE_PAINT_FAILED');return;}
    const viewKey=JSON.stringify({...s,contextTime:null,audioSample:0,operationSeconds:0});if(viewKey!==lastView){lastView=viewKey;setSnapshot(s);}
    const report:AnimationRuntimePlaybackState={audioAvailable:true,frame:painted,frameCount:492,frameDomain:'sprite-78',fps:12,narration:s.audioNodePlaying?'playing':'idle',playbackProgress:motion||s.inspectionMode?null:(s.picture.mainFrame-1)/491,seekAvailable:true,stepFrames:20,transportMode:'visual-frame-inspector'};
    const key=JSON.stringify(report);if(key!==lastReport){lastReport=key;latest.current.onPlaybackStateChange?.(report);}
    if(s.phase==='ended'&&!completeReported){completeReported=true;if(s.correctDrops===5&&!s.inspectionMode&&!motion)latest.current.onPlaybackComplete?.();latest.current.onRuntimePausedChange(true);}
    if(s.phase==='paused'&&s.globalPaused&&!latest.current.paused)latest.current.onRuntimePausedChange(true);
   };
   sync.current=draw;const loop=()=>{draw();if(active)raf=requestAnimationFrame(loop);};loop();if(wantPlay)start('automatic');else latest.current.onRuntimePausedChange(true);
  };
  void init().catch(e=>{if(!active)return;pause();void clock?.close();setError(e instanceof Error?e.message:String(e));});
  return()=>{stop();sync.current=()=>{};media.removeEventListener('change',motionChanged);disconnect();if(clockRef.current===clock)clockRef.current=null;if(controlsRef.current===controls)controlsRef.current=null;};
 },[props.animationId,props.moduleKey,props.audioEnabled,props.connectRuntimeControls]);
 useEffect(()=>{const c=clockRef.current;if(!c)return;if(props.paused&&['playing','starting'].includes(c.snapshot().phase))c.pause();else if(!props.paused&&snapshot&&c.snapshot().phase==='paused')controlsRef.current?.setPaused(false);},[props.paused,Boolean(snapshot)]);
 useEffect(()=>{clockRef.current?.setVolume(props.volume??1);},[props.volume]);
 useEffect(()=>{const q=props.seekRequest,c=clockRef.current;if(!q||!c||!snapshot||q.requestId===lastSeek.current)return;lastSeek.current=q.requestId;setGlossary(null);glossaryRef.current=null;glossaryResume.current=false;pointer.current=null;c.inspect(q.frame);props.onRuntimePausedChange(true);sync.current();},[props.seekRequest,Boolean(snapshot),props.onRuntimePausedChange]);
 const popup=snapshot?.picture.interaction.popup??'none',entry=practice?.glossary.find(e=>e.id===glossary);
 const openGlossary=(id:string,trigger:HTMLElement)=>{
  if(!practice?.glossary.some(e=>e.id===id)||glossaryRef.current)return;const c=clockRef.current;if(!c)return;
  glossaryTrigger.current=trigger;glossaryResume.current=c.snapshot().phase==='playing'&&!c.snapshot().globalPaused;
  c.pause();props.onRuntimePausedChange(true);glossaryRef.current=id;setGlossary(id);sync.current();
 };
 const closeGlossary=()=>{const resume=glossaryResume.current;glossaryResume.current=false;glossaryRef.current=null;setGlossary(null);if(resume)controlsRef.current?.setPaused(false);const target=glossaryTrigger.current;glossaryTrigger.current=null;requestAnimationFrame(()=>{if(target?.isConnected)target.focus({preventScroll:true});});};
 const closeGlossaryRef=useRef(closeGlossary);closeGlossaryRef.current=closeGlossary;
 useEffect(()=>{if(entry)dialog.current?.querySelector<HTMLButtonElement>('[data-p018-dialog-close]')?.focus({preventScroll:true});},[entry]);
 useEffect(()=>{const keydown=(event:KeyboardEvent)=>{const el=dialog.current;if(!el||!glossaryRef.current)return;
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeGlossaryRef.current();return;}if(event.key!=='Tab')return;
  const items=[...el.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')],first=items[0],last=items.at(-1);
  if(first&&last&&(!el.contains(document.activeElement)||event.shiftKey&&document.activeElement===first||!event.shiftKey&&document.activeElement===last)){event.preventDefault();(event.shiftKey?last:first).focus({preventScroll:true});}
 };document.addEventListener('keydown',keydown,true);return()=>document.removeEventListener('keydown',keydown,true);},[]);
 useEffect(()=>{
  if(popup==='wrong'&&!previousPopup.current&&!glossaryRef.current)document.querySelector<HTMLButtonElement>('[data-p018-companion] [data-p018-close-wrong]')?.focus({preventScroll:true});
  previousPopup.current=popup==='wrong';
  if(snapshot?.phase==='question'&&previousPhase.current!=='question'&&snapshot.interaction.attempts>0){const target=focusReturn.current;if(target?.isConnected&&!target.hasAttribute('disabled'))target.focus({preventScroll:true});}
  previousPhase.current=snapshot?.phase??'';
 },[popup,snapshot?.phase,snapshot?.interaction.attempts]);
 const canAct=Boolean(snapshot&&['question','dragging'].includes(snapshot.phase)&&!entry);
 const select=(id:P018CardId)=>{if(!canAct)return;clockRef.current?.select(id);sync.current();};
 const drop=(target:string|null)=>{const c=clockRef.current;if(!c||!canAct)return;focusReturn.current=document.querySelector<HTMLElement>(`[data-p018-card="${c.snapshot().interaction.selected}"]`);props.onRuntimePausedChange(false);void c.drop(target,{activation:'user',reducedMotion:reduced}).then(()=>sync.current());sync.current();};
 const point=(event:ReactPointerEvent):P018Point|null=>{const rect=canvas.current?.getBoundingClientRect();return rect&&rect.width>0&&rect.height>0?{x:(event.clientX-rect.left)*800/rect.width,y:(event.clientY-rect.top)*600/rect.height}:null;};
 const dragStart=(event:ReactPointerEvent<HTMLDivElement>,card:P018Card)=>{if(!canAct||snapshot?.interaction.locked.includes(card.id)||event.button!==0)return;const p=point(event);if(!p)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);select(card.id);const pos=clockRef.current?.snapshot().interaction.positions[card.id]??card.originTwips;pointer.current={id:event.pointerId,card:card.id,start:p,offset:{x:p.x-(412.4+pos.x/20),y:p.y-(280.3+pos.y/20)},moved:false};};
 const dragMove=(event:ReactPointerEvent<HTMLDivElement>)=>{const d=pointer.current,p=point(event);if(!d||!p||d.id!==event.pointerId)return;d.moved||=Math.hypot(p.x-d.start.x,p.y-d.start.y)>5;if(d.moved){clockRef.current?.move({x:(p.x-d.offset.x-412.4)*20,y:(p.y-d.offset.y-280.3)*20});sync.current();}};
 const dragEnd=(event:ReactPointerEvent<HTMLDivElement>,cancel=false)=>{const d=pointer.current;if(!d||d.id!==event.pointerId)return;pointer.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);if(cancel){clockRef.current?.cancel();sync.current();}else if(d.moved)drop(p018TargetAtPoint(practice?.cards??[],point(event)));};
 const closeWrong=()=>{if(entry||popup!=='wrong')return;clockRef.current?.closePopup();props.onRuntimePausedChange(true);sync.current();};
 const glossaryButtons=(surface:'main'|'wrong')=>practice?.controls.filter(c=>c.surface===surface&&(snapshot?.picture.mainFrame??1)>=c.firstMainFrame&&(snapshot?.picture.mainFrame??1)<=c.lastMainFrame).map(c=><button key={c.sourceCharacterId} type="button" style={buttonStyle} data-p018-glossary={c.entryId} data-p018-glossary-surface={surface} disabled={Boolean(entry)} onClick={e=>openGlossary(c.entryId,e.currentTarget)}>{c.labels[language]}</button>);
 const status=snapshot?.phase==='ended'&&snapshot.correctDrops===5?(es?'¡Completado! Los cinco valores absolutos están en su lugar.':'Complete! All five absolute values are in place.'):
  popup==='wrong'?(es?'Revisa la explicación, cierra el mensaje y vuelve a intentarlo.':'Review the explanation, close the message, and try again.'):
  snapshot?.interaction.selected?(es?`Entero seleccionado: ${practice?.cards.find(c=>c.id===snapshot.interaction.selected)?.label}. Elige una fila.`:`Selected integer: ${practice?.cards.find(c=>c.id===snapshot.interaction.selected)?.label}. Choose a row.`):
  canAct?(es?'Elige un entero y luego la fila que le corresponde en la columna Valor absoluto.':'Choose an integer, then its row in the Absolute Value column.'):(es?'Escucha la explicación.':'Listen to the explanation.');
 const companionContent=practice&&snapshot?<section data-p018-companion style={{...boxStyle,margin:'12px auto',width:'min(100%,680px)'}} onKeyDown={event=>{if(event.key==='Escape'&&snapshot.interaction.selected){event.preventDefault();clockRef.current?.cancel();sync.current();}}}>
  <h3 style={{margin:'0 0 8px',fontSize:18}}>{es?'Práctica de valor absoluto':'Absolute value practice'}</h3>
  {practice.reading.filter(r=>snapshot.picture.mainFrame>=r.firstFrame&&snapshot.picture.mainFrame<=r.lastFrame).map((r,i)=><p key={i} lang="en" data-p018-reading={r.firstFrame} style={{margin:'8px 0'}}>{r.text}</p>)}
  <p role="status" aria-live="polite" data-p018-status>{status}</p>
  {snapshot.picture.mainFrame>=445?<><div role="group" aria-label={es?'Enteros disponibles':'Available integers'} style={{display:'flex',flexWrap:'wrap',gap:8}}>{practice.cards.map(c=><button type="button" key={c.id} style={{...buttonStyle,outline:snapshot.interaction.selected===c.id?'3px solid #146b9c':undefined,minWidth:60}} data-p018-card={c.id} disabled={!canAct||snapshot.interaction.locked.includes(c.id)} aria-pressed={snapshot.interaction.selected===c.id} aria-label={`${es?'Entero':'Integer'} ${c.accessibleLabels[language]}`} onClick={()=>select(c.id)}>{c.label}{snapshot.interaction.locked.includes(c.id)?' ✓':''}</button>)}</div>
   <div role="group" aria-label={es?'Filas de valor absoluto':'Absolute value rows'} style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,marginTop:12}}>{practice.targets.map(t=><button type="button" key={t.id} style={buttonStyle} data-p018-target={t.id} disabled={!canAct||!snapshot.interaction.selected||snapshot.interaction.locked.includes(t.cardId)} onClick={()=>drop(t.id)}>{es?'Valor absoluto de':'Absolute value of'} {String(t.integer).replace('-','−')}{snapshot.interaction.locked.includes(t.cardId)?` = ${t.absoluteValue}`:' = ?'}</button>)}</div>
   <p style={{fontSize:14}}>{es?'También puedes arrastrar los enteros en la imagen. No se utilizan todos.':'You can also drag the integers in the picture. Not every integer is used.'}</p></>:null}
  {popup==='wrong'?<div data-p018-feedback-text style={{marginTop:14,padding:12,background:'#ffffdd',color:'#17252e',borderRadius:8}}>
   <p lang="en" style={{margin:'0 0 10px'}}>{practice.wrongDefinition}</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{glossaryButtons('wrong')}</div>
   <button type="button" data-p018-close-wrong style={{...buttonStyle,marginTop:12}} disabled={Boolean(entry)} onClick={closeWrong}>{es?'Cerrar y volver a intentar':'Close and try again'}</button>
  </div>:null}
  <div role="group" aria-label={es?'Términos de la página':'Page terms'} style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}>{glossaryButtons('main')}</div>
  {reduced?<p data-p018-reduced-note style={{marginBottom:0,fontSize:14}}>{props.labels.reduced}</p>:null}
 </section>:null;
 const modal=entry?<div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(12,25,42,.48)',display:'grid',placeItems:'center',padding:16}}><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`${ID}-dialog-title`} data-p018-dialog={entry.id} style={{...boxStyle,width:'min(100%,620px)',maxHeight:'85dvh',overflowY:'auto',boxShadow:'0 16px 60px #10203044'}}>
  <h3 id={`${ID}-dialog-title`}>{entry.labels[language]}</h3><p>{entry.definitions[language]}</p>
  <button type="button" data-p018-dialog-close style={{...buttonStyle,marginTop:16}} onClick={closeGlossary}>{popup==='wrong'?(es?'Volver a la explicación':'Back to the explanation'):(es?'Cerrar':'Close')}</button>
 </div></div>:null;
 const hitStyle=(b:Bounds):CSSProperties=>({position:'absolute',left:`${b.x/8}%`,top:`${b.y/6}%`,width:`${b.width/8}%`,height:`${b.height/6}%`,minHeight:0,minWidth:0,padding:0,border:0,background:'transparent',cursor:'pointer'});
 return <div className="runtime-shell" style={{height:'auto','--flash-stage-width':'800px','--flash-stage-height':'600px','--flash-stage-aspect':'800 / 600'} as CSSProperties} data-source-clock-runtime={ID} data-source-clock-phase={snapshot?.phase??'loading'} data-source-failure={snapshot?.failure??error??''} data-source-operation={snapshot?.operation??'intro'} data-source-audio-domain={snapshot?.audioDomain??''} data-source-audio-frame={snapshot?.picture.mainFrame??1} data-source-audio-playing={snapshot?.audioNodePlaying?'true':'false'} data-source-feedback-frame={snapshot?.picture.interaction.feedbackFrame??1} data-source-right-frame={snapshot?.picture.interaction.rightFrame??1} data-source-correct-drops={snapshot?.correctDrops??0} data-source-attempts={snapshot?.interaction.attempts??0} data-source-quiz-active={snapshot?.sourceQuizActive?'true':'false'} data-source-inspection={snapshot?.inspectionMode?'true':'false'} data-runtime-volume={props.volume??1} data-audio-available={snapshot?'true':'false'} data-runtime-paused={props.paused?'true':'false'} data-runtime-presentation="modern-wide" data-runtime-playback-complete={snapshot?.phase==='ended'&&snapshot.correctDrops===5&&!snapshot.inspectionMode&&!reduced?'true':'false'}>
  <div ref={stage} className="runtime-stage" style={{position:'relative',height:'auto',aspectRatio:'4 / 3'}} data-animation-module={ID} data-flash-frame={paintedFrame} data-flash-frame-domain="sprite-78" data-source-clock-ready={snapshot?'true':'false'}>
   <canvas ref={canvas} width={800} height={600} data-course-canvas={ID} aria-label={es?'Práctica: completar la tabla de valor absoluto':'Practice: complete the absolute value table'} style={{display:snapshot?'block':'none',width:'100%',height:'auto'}}/>
   {practice&&snapshot?practice.sourceHotspots.filter(h=>h.surface==='wrong'?popup==='wrong':popup==='none').map(h=>{const r=h.ranges.find(r=>paintedFrame>=r.firstFrame&&paintedFrame<=r.lastFrame);if(!r)return null;const label=practice.glossary.find(e=>e.id===h.entryId)?.labels[language]??h.entryId;return <button key={h.sourceCharacterId} type="button" data-p018-source-glossary={h.entryId} data-p018-source-surface={h.surface} disabled={Boolean(entry)} aria-label={label} onClick={e=>openGlossary(h.entryId,e.currentTarget)} style={hitStyle({x:r.rect.left,y:r.rect.top,width:r.rect.right-r.rect.left,height:r.rect.bottom-r.rect.top})}/>;}):null}
   {practice&&popup==='wrong'&&!entry?<button type="button" data-p018-source-close aria-label={es?'Cerrar y volver a intentar':'Close and try again'} style={hitStyle(practice.wrongCloseBounds)} onClick={closeWrong}/>:null}
   {practice&&snapshot?.picture.mainFrame===445&&popup==='none'&&!entry?practice.targets.map(t=><button key={t.id} type="button" data-p018-source-target={t.id} aria-label={`${es?'Valor absoluto de':'Absolute value of'} ${t.integer}`} disabled={!canAct||!snapshot.interaction.selected||snapshot.interaction.locked.includes(t.cardId)} style={hitStyle(t.bounds)} onClick={()=>drop(t.id)}/>):null}
   {practice&&snapshot?.picture.mainFrame===445&&popup==='none'&&!entry?practice.cards.filter(c=>!snapshot.interaction.locked.includes(c.id)).map(c=>{const p=snapshot.interaction.positions[c.id],x=c.sourceBounds.x+(p.x-c.originTwips.x)/20,y=c.sourceBounds.y+(p.y-c.originTwips.y)/20;return <div key={c.id} aria-hidden="true" data-p018-drag={c.id} onPointerDown={e=>dragStart(e,c)} onPointerMove={dragMove} onPointerUp={e=>dragEnd(e)} onPointerCancel={e=>dragEnd(e,true)} onLostPointerCapture={e=>{if(pointer.current?.id===e.pointerId)dragEnd(e,true);}} style={{position:'absolute',left:`${x/8}%`,top:`${y/6}%`,width:`${c.sourceBounds.width/8}%`,height:`${c.sourceBounds.height/6}%`,touchAction:'none',cursor:canAct?'grab':'default',outline:snapshot.interaction.selected===c.id?'2px solid #146b9c':undefined,borderRadius:4}}/>;}):null}
  </div>
  {companion&&companionContent?createPortal(companionContent,companion):null}
  {modal&&typeof document!=='undefined'?createPortal(modal,document.body):null}
  {!snapshot&&!error?<p role="status">{props.labels.loading}</p>:null}{error?<p role="alert" data-source-clock-error={error}>{props.labels.unavailable}</p>:null}
 </div>;
}
