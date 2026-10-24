'use client';
import {useEffect,useRef,useState,type CSSProperties,type PointerEvent as ReactPointerEvent} from 'react';
import {createPortal} from 'react-dom';
import {loadClientAnimationModule} from '@/lib/load-animation-module.client';
import type {LessonRuntimeAdapterProps,LessonRuntimeAdapterControls} from '@/lib/lesson-runtime-adapter';
import type {AnimationRuntimePlaybackState} from './animation-runtime';
import type {AnimationModule} from '../../../packages/demos/src/contract';
import type {SourceStaticCanvasCandidateConfig} from '../../../packages/demos/src/source-static-canvas-candidate';
import {P021SourceClockV1,type P021AudioPlan,type P021Picture} from '../../../packages/demos/src/nms-l01-p021-source-clock-v1';
import {p021PointInTarget,type P021Problem,type P021Point,type P021Card,type P021Bounds} from '../../../packages/demos/src/nms-l01-p021-interaction-v1';
type Localized=Readonly<{en:string;es:string}>;
type Glossary=Readonly<{id:string;labels:Localized;definitions:Localized}>;
type Practice=Readonly<{problems:readonly P021Problem[];numberLineTarget:P021Bounds;newProblemBounds:P021Bounds;wrongCloseBounds:P021Bounds;glossary:readonly Glossary[];controls:readonly Readonly<{entryId:string;sourceCharacterId:number;labels:Localized;firstMainFrame:number;lastMainFrame:number}>[];sourceHotspots:readonly Readonly<{entryId:string;sourceCharacterId:number;ranges:readonly Readonly<{firstFrame:number;lastFrame:number;bounds:P021Bounds}>[]}>[]}>;
type Attachment=Readonly<{version:1;CONFIG:SourceStaticCanvasCandidateConfig;PLAN:P021AudioPlan;PRACTICE:Practice;sourceAudioPayloads:Readonly<Record<string,string>>;prepare:()=>Promise<unknown>}>;
type Snapshot=ReturnType<P021SourceClockV1['snapshot']>;
const ID='shared-nms002-l01-p021';
const buttonStyle:CSSProperties={minHeight:44,padding:'8px 12px',border:'1px solid var(--line, #8797a9)',borderRadius:9,background:'var(--paper, white)',color:'var(--ink, #132a40)',fontWeight:600};
export function NmsL1P021SourceRuntimeV1(props:LessonRuntimeAdapterProps){
 const latest=useRef(props);latest.current=props;
 const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null),clockRef=useRef<P021SourceClockV1|null>(null),controlsRef=useRef<LessonRuntimeAdapterControls|null>(null),sync=useRef<()=>void>(()=>{}),lastSeek=useRef(0);
 const [practice,setPractice]=useState<Practice|null>(null),[snapshot,setSnapshot]=useState<Snapshot|null>(null),[error,setError]=useState<string|null>(null),[reduced,setReduced]=useState(false),[paintedFrame,setPaintedFrame]=useState(1),[companion,setCompanion]=useState<HTMLElement|null>(null);
 const es=props.uiLanguage==='es',language=es?'es':'en';
 const[glossary,setGlossary]=useState<string|null>(null),dialog=useRef<HTMLDivElement>(null),glossaryRef=useRef<string|null>(null),glossaryResume=useRef(false),glossaryTrigger=useRef<HTMLElement|null>(null);
 const pointer=useRef<{id:number;card:string;target:HTMLDivElement;offset:P021Point;moved:boolean;start:P021Point}|null>(null),focusReturn=useRef<HTMLElement|null>(null),previousPopup=useRef(false),previousStatus=useRef('');
 const clearPointer=(cancel=true)=>{const p=pointer.current;pointer.current=null;if(p?.target.hasPointerCapture(p.id))p.target.releasePointerCapture(p.id);if(cancel)clockRef.current?.cancel();};
 const clearPointerRef=useRef(clearPointer);clearPointerRef.current=clearPointer;
 const clearGlossary=()=>{glossaryRef.current=null;glossaryResume.current=false;glossaryTrigger.current=null;setGlossary(null);};
 const clearGlossaryRef=useRef(clearGlossary);clearGlossaryRef.current=clearGlossary;
 useEffect(()=>{
  const source=stage.current,owner=source?.closest('.lesson-shell2__learning-column'),id=props.pageInteractionCompanionTargetId;if(!source||!owner||!id?.endsWith('-terminal-source-v1-readable'))return;
  const resolve=()=>{const target=document.getElementById(id);setCompanion(target?.parentElement===owner&&target.dataset.pageInteractionCompanionHost==='true'&&!source.contains(target)?target:null);};
  resolve();const observer=new MutationObserver(resolve);observer.observe(owner,{childList:true,subtree:true});return()=>observer.disconnect();
 },[props.pageInteractionCompanionTargetId]);
 useEffect(()=>{
  let active=true,ready=false,clock:P021SourceClockV1|undefined,raf=0,ticket=0,lastPaint='',lastView='',lastReport='',painted=1,wantPlay=!latest.current.paused,runtimeFailed=false;
  const media=matchMedia('(prefers-reduced-motion: reduce)');let motion=media.matches;setReduced(motion);const changed=()=>{motion=media.matches;setReduced(motion);};media.addEventListener('change',changed);
  const pause=()=>{wantPlay=false;ticket++;clearPointerRef.current();clock?.pause();latest.current.onRuntimePausedChange(true);};
  const start=(activation:'automatic'|'user')=>{wantPlay=true;if(!active||!ready||!clock)return;if(motion&&activation==='automatic'){pause();return;}
   const turn=++ticket;latest.current.onRuntimePausedChange(false);void clock.play({activation,reducedMotion:motion}).then(r=>{if(active&&turn===ticket&&(!r.accepted||clock?.snapshot().phase==='question'))pause();});
  };
  const stop=()=>{active=false;ticket++;cancelAnimationFrame(raf);clearPointerRef.current();void clock?.close();};
  const controls:LessonRuntimeAdapterControls={setPaused:v=>v?pause():start('user'),replay(){if(!active||!ready||!clock)return false;clearGlossaryRef.current();clearPointerRef.current();ticket++;clock.replay();start('user');return true;},narration:a=>a==='stop'?pause():start('user'),stop};
  controlsRef.current=controls;const disconnect=props.connectRuntimeControls(controls);
  const init=async()=>{
   if(process.env.NODE_ENV==='production'||props.animationId!==ID||props.moduleKey!==ID||props.audioEnabled!==true||props.query.capture==='1'||props.query.lang!=='en'||props.query.frameDomain!=='sprite-160'||props.query.scenario!=='source-static-frame'||String(props.query.seed)!=='0')throw Error('P021_PRIVATE_SCOPE_MISMATCH');
   const module=await loadClientAnimationModule(ID) as (AnimationModule&{privateP021Practice?:Attachment})|undefined;if(!active)return;const a=module?.privateP021Practice;
   if(module?.key!==ID||!a||a.version!==1||a.CONFIG.animationId!==ID||a.CONFIG.mainFrameDomain!=='sprite-160'||a.CONFIG.mainFrameCount!==572||a.PLAN.sourceSwfSha256!==a.CONFIG.sourceSwfSha256||a.PRACTICE.problems.length!==10||a.PRACTICE.glossary.length!==2||Object.keys(a.sourceAudioPayloads).join()!=='sprite-46,sprite-149,sprite-157,sprite-159,sprite-160')throw Error('P021_REGISTERED_SOURCE_MISSING');
   setPractice(a.PRACTICE);await a.prepare();if(!active)return;
   const asset=window.HELP_MATH_CANVAS_ASSETS?.[ID] as (NonNullable<typeof window.HELP_MATH_CANVAS_ASSETS>[string]&{metadata?:{sourceSwfSha256?:string}})|undefined;
   if(!asset||asset.metadata?.sourceSwfSha256!==a.CONFIG.sourceSwfSha256)throw Error('P021_SOURCE_CANVAS_MISSING');
   const paint=(picture:P021Picture,force=false)=>{
    const target=canvas.current;if(!active||!target||window.HELP_MATH_CANVAS_ASSETS?.[ID]!==asset)return false;
    const frame=motion&&!force&&picture.mainFrame<571?1:picture.mainFrame;
    const request={frame,scenario:'source-static-frame',lang:'en',seed:0,interaction:picture.interaction},key=JSON.stringify(request);
    if(key!==lastPaint){const state=asset.render(target,request) as {localFrame?:number;frameDomain?:string};if(state.localFrame!==frame||state.frameDomain!=='sprite-160'||target.dataset.flashFrame!==String(frame))return false;lastPaint=key;painted=frame;setPaintedFrame(frame);target.dataset.renderState='ready';target.style.display='block';stage.current?.setAttribute('data-flash-frame',String(frame));}
    return target.isConnected&&target.width===800&&target.height===600;
   };
   clock=new P021SourceClockV1(a.PLAN,a.PRACTICE.problems,{commitPicture:p=>paint(p,true)});clockRef.current=clock;
   const payloads=Object.fromEntries(Object.entries(a.sourceAudioPayloads).map(([domain,base64])=>[domain,Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer]));
   const prepared=await clock.prepare(payloads);if(!active)return;if(!prepared.accepted)throw Error(prepared.reason);clock.setVolume(latest.current.volume??1);ready=true;
   const draw=()=>{
    if(!active||!clock||runtimeFailed)return;const s=clock.snapshot();
    if(s.phase==='failed'){runtimeFailed=true;setSnapshot(s);setError(s.failure??'P021_SOURCE_FAILED');latest.current.onRuntimePausedChange(true);void clock.close();return;}
    if(!paint(s.picture,s.inspectionMode)){pause();setError('P021_SOURCE_PAINT_FAILED');return;}
    const viewKey=JSON.stringify({...s,contextTime:null,tracks:s.tracks.map(t=>({...t,seconds:0,audioSample:0}))});if(viewKey!==lastView){lastView=viewKey;setSnapshot(s);}
    const report:AnimationRuntimePlaybackState={audioAvailable:true,frame:painted,frameCount:572,frameDomain:'sprite-160',fps:12,narration:s.audioNodePlaying?'playing':'idle',playbackProgress:motion||s.inspectionMode?null:(s.picture.mainFrame-1)/571,seekAvailable:true,stepFrames:20,transportMode:'visual-frame-inspector'};
    const key=JSON.stringify(report);if(key!==lastReport){lastReport=key;latest.current.onPlaybackStateChange?.(report);}
    if(s.globalPaused&&!latest.current.paused)latest.current.onRuntimePausedChange(true);
   };
   sync.current=draw;const loop=()=>{draw();if(active)raf=requestAnimationFrame(loop);};loop();if(wantPlay)start('automatic');else latest.current.onRuntimePausedChange(true);
  };
  void init().catch(e=>{if(!active)return;pause();void clock?.close();setError(e instanceof Error?e.message:String(e));});
  return()=>{stop();sync.current=()=>{};media.removeEventListener('change',changed);disconnect();if(clockRef.current===clock)clockRef.current=null;if(controlsRef.current===controls)controlsRef.current=null;};
 },[props.animationId,props.moduleKey,props.audioEnabled,props.connectRuntimeControls]);
 useEffect(()=>{const c=clockRef.current;if(!c)return;if(props.paused&&['playing','starting'].includes(c.snapshot().phase))c.pause();else if(!props.paused&&snapshot&&c.snapshot().phase==='paused')controlsRef.current?.setPaused(false);},[props.paused,Boolean(snapshot)]);
 useEffect(()=>{clockRef.current?.setVolume(props.volume??1);},[props.volume]);
 useEffect(()=>{const q=props.seekRequest,c=clockRef.current;if(!q||!c||!snapshot||q.requestId===lastSeek.current)return;lastSeek.current=q.requestId;clearGlossaryRef.current();clearPointerRef.current();c.inspect(q.frame);props.onRuntimePausedChange(true);sync.current();},[props.seekRequest,Boolean(snapshot),props.onRuntimePausedChange]);
 const entry=practice?.glossary.find(e=>e.id===glossary),popup=snapshot?.practice.picture.popup??'none';
 const openGlossary=(id:string,trigger:HTMLElement)=>{
  if(!practice?.glossary.some(e=>e.id===id)||glossaryRef.current)return;const c=clockRef.current;if(!c)return;
  glossaryTrigger.current=trigger;glossaryResume.current=['playing','starting'].includes(c.snapshot().phase)&&!c.snapshot().globalPaused;
  clearPointer();c.pause();props.onRuntimePausedChange(true);glossaryRef.current=id;setGlossary(id);sync.current();
 };
 const closeGlossary=()=>{const resume=glossaryResume.current;glossaryResume.current=false;glossaryRef.current=null;setGlossary(null);if(resume)controlsRef.current?.setPaused(false);const target=glossaryTrigger.current;glossaryTrigger.current=null;requestAnimationFrame(()=>{if(target?.isConnected)target.focus({preventScroll:true});});};
 const closeGlossaryRef=useRef(closeGlossary);closeGlossaryRef.current=closeGlossary;
 useEffect(()=>{if(entry)dialog.current?.querySelector<HTMLButtonElement>('[data-p021-dialog-close]')?.focus({preventScroll:true});},[entry]);
 useEffect(()=>{const keydown=(event:KeyboardEvent)=>{const el=dialog.current;if(!el||!glossaryRef.current)return;
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeGlossaryRef.current();return;}if(event.key!=='Tab')return;
  const items=[...el.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')],first=items[0],last=items.at(-1);
  if(first&&last&&(!el.contains(document.activeElement)||event.shiftKey&&document.activeElement===first||!event.shiftKey&&document.activeElement===last)){event.preventDefault();(event.shiftKey?last:first).focus({preventScroll:true});}
 };document.addEventListener('keydown',keydown,true);return()=>document.removeEventListener('keydown',keydown,true);},[]);
 useEffect(()=>{const cancel=(event:KeyboardEvent)=>{if(event.key==='Escape'&&pointer.current&&!glossaryRef.current){event.preventDefault();clearPointerRef.current();sync.current();}};window.addEventListener('keydown',cancel);return()=>window.removeEventListener('keydown',cancel);},[]);
 const canAct=Boolean(snapshot?.canInteract&&snapshot.practice.status==='question'&&!entry);
 const select=(id:string)=>{if(canAct){clockRef.current?.select(id);sync.current();}};
 const reportAction=(c:P021SourceClockV1,pending:Promise<unknown>)=>{props.onRuntimePausedChange(c.snapshot().globalPaused);sync.current();void pending.then(()=>{if(clockRef.current===c){latest.current.onRuntimePausedChange(c.snapshot().globalPaused);sync.current();}});};
 const drop=(onTarget:boolean)=>{const c=clockRef.current;if(!c||!canAct)return;const id=c.snapshot().practice.selected;focusReturn.current=document.querySelector<HTMLElement>(`[data-p021-companion] [data-p021-card="${id}"]`);reportAction(c,c.drop(onTarget,{activation:'user',reducedMotion:reduced}));};
 const point=(e:ReactPointerEvent):P021Point|null=>{const r=canvas.current?.getBoundingClientRect();return r&&r.width>0&&r.height>0?{x:(e.clientX-r.left)*800/r.width,y:(e.clientY-r.top)*600/r.height}:null;};
 const begin=(e:ReactPointerEvent<HTMLDivElement>,card:P021Card)=>{
  if(!canAct||pointer.current||e.button!==0||snapshot?.practice.picture.step&&card.id===snapshot.practice.problem.firstId)return;const p=point(e),c=clockRef.current;if(!p||!c||!c.begin(card.id))return;e.preventDefault();const pos=c.snapshot().practice.picture.positions[card.id]!;e.currentTarget.setPointerCapture(e.pointerId);pointer.current={id:e.pointerId,card:card.id,target:e.currentTarget,offset:{x:p.x-(412.4+pos.x),y:p.y-(280.3+pos.y)},moved:false,start:p};sync.current();
 };
 const move=(e:ReactPointerEvent<HTMLDivElement>)=>{const d=pointer.current,p=point(e);if(!d||!p||d.id!==e.pointerId)return;d.moved||=Math.hypot(p.x-d.start.x,p.y-d.start.y)>3;if(d.moved){clockRef.current?.move({x:p.x-412.4-d.offset.x,y:p.y-280.3-d.offset.y});sync.current();}};
 const end=(e:ReactPointerEvent<HTMLDivElement>,cancel=false)=>{const d=pointer.current;if(!d||d.id!==e.pointerId)return;if(cancel){clearPointer();sync.current();return;}move(e);const p=point(e);clearPointer(false);if(d.moved)drop(p021PointInTarget(practice!.numberLineTarget,p));else{clockRef.current?.cancel();clockRef.current?.select(d.card);sync.current();}};
 const newProblem=()=>{if(entry)return;clearPointer();const c=clockRef.current;if(c?.newProblem()){props.onRuntimePausedChange(c.snapshot().globalPaused);sync.current();}};
 const pressClose=()=>{const c=clockRef.current;if(!c||entry||popup!=='wrong')return;reportAction(c,c.pressClose({activation:'user',reducedMotion:reduced}));};
 const cancelClose=()=>{clockRef.current?.cancelClose();sync.current();};
 const closeWrong=()=>{const c=clockRef.current;if(!c||entry||!c.closeWrong())return;props.onRuntimePausedChange(c.snapshot().globalPaused);sync.current();requestAnimationFrame(()=>{const target=focusReturn.current;if(target?.isConnected&&!target.hasAttribute('disabled'))target.focus({preventScroll:true});});};
 useEffect(()=>{if(popup==='wrong'&&!previousPopup.current&&!entry)document.querySelector<HTMLButtonElement>('[data-p021-companion] [data-p021-close-wrong]')?.focus({preventScroll:true});previousPopup.current=popup==='wrong';if(snapshot?.practice.status==='answered'&&previousStatus.current!=='answered'&&!entry)document.querySelector<HTMLButtonElement>('[data-p021-companion] [data-p021-new-problem]')?.focus({preventScroll:true});previousStatus.current=snapshot?.practice.status??'';},[popup,snapshot?.practice.status,Boolean(entry)]);
 const closeEvents={onPointerDown:pressClose,onPointerUp:cancelClose,onPointerCancel:cancelClose,onPointerLeave:cancelClose,onKeyDown:(e:React.KeyboardEvent<HTMLButtonElement>)=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat)pressClose();},onKeyUp:(e:React.KeyboardEvent<HTMLButtonElement>)=>{if(e.key==='Enter'||e.key===' ')cancelClose();},onClick:closeWrong};
 const readable=practice&&snapshot?<section data-p021-companion style={{padding:16,border:'1px solid var(--line, #8797a9)',borderRadius:12,background:'var(--paper, white)',color:'var(--ink, #132a40)',fontSize:16,lineHeight:1.5,margin:'12px auto',width:'min(100%,680px)'}}>
  <h3 style={{margin:'0 0 8px',fontSize:18}}>{es?'Suma de enteros en la recta numérica':'Add integers on the number line'}</h3>
  {snapshot.picture.mainFrame<571?<p data-p021-intro>{es?'Escucha el ejemplo: 3 − 5 = −2. Después, elige los saltos para formar una ecuación en la recta numérica.':'Listen to the example: 3 − 5 = −2. Then choose jumps to form an equation on the number line.'}</p>:<>
   <p>{es?'Elige un salto y colócalo en la recta numérica. Usa dos saltos para llegar al resultado indicado. También puedes arrastrarlos en la imagen.':'Choose a jump and place it on the number line. Use two jumps to reach the given result. You can also drag the jumps in the picture.'}</p>
   <p data-p021-equation role="status" aria-live="polite" aria-atomic="true" style={{fontWeight:700,fontSize:24,margin:'18px 0'}}>{snapshot.practice.picture.step===0?`${es?'Resultado':'Result'}: ${snapshot.practice.problem.result}`:snapshot.practice.equation.replaceAll('-', '−').replace('  ',' □ ')}</p>
   <div role="group" aria-label={es?'Saltos disponibles':'Available jumps'} style={{display:'flex',gap:8,flexWrap:'wrap'}}>{snapshot.practice.problem.cards.map(card=><button key={card.id} type="button" data-p021-card={card.id} style={{...buttonStyle,outline:snapshot.practice.selected===card.id?'3px solid #146b9c':undefined}} disabled={!canAct||snapshot.practice.picture.step>=1&&card.id===snapshot.practice.problem.firstId} aria-pressed={snapshot.practice.selected===card.id} onClick={()=>select(card.id)}>{card.labels[language]}{snapshot.practice.picture.step>=1&&card.id===snapshot.practice.problem.firstId?' ✓':''}</button>)}</div>
   <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:12}}>
    <button type="button" data-p021-target style={buttonStyle} disabled={!canAct||!snapshot.practice.selected} onClick={()=>drop(true)}>{es?'Colocar en la recta numérica':'Place on number line'}</button>
    <button type="button" data-p021-new-problem style={buttonStyle} disabled={!snapshot.canNewProblem||Boolean(entry)} onClick={newProblem}>{es?'Nuevo número':'New number'}</button>
   </div>
   {snapshot.practice.status==='correct'||snapshot.practice.status==='answered'?<p data-p021-correct-text role="status">{es?'¡Correcto! Elige un nuevo número para practicar otra vez.':'Correct! Choose a new number to practice again.'}</p>:null}
   {popup==='wrong'?<div data-p021-feedback style={{marginTop:14,padding:12,background:'#ffffdd',color:'#17252e',borderRadius:8}}><p data-p021-feedback-text role="alert" style={{margin:'0 0 12px'}}>{snapshot.practice.problem.feedback[language]}</p><button type="button" data-p021-close-wrong style={buttonStyle} disabled={Boolean(entry)} {...closeEvents}>{es?'Cerrar y volver a intentar':'Close and try again'}</button></div>:null}
  </>}
  <div role="group" aria-label={es?'Términos de la página':'Page terms'} style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}>{practice.controls.filter(c=>snapshot.picture.mainFrame>=c.firstMainFrame&&snapshot.picture.mainFrame<=c.lastMainFrame).map(c=><button key={c.sourceCharacterId} type="button" data-p021-glossary={c.entryId} style={buttonStyle} disabled={Boolean(entry)} onClick={e=>openGlossary(c.entryId,e.currentTarget)}>{c.labels[language]}</button>)}</div>
  {reduced?<p data-p021-reduced-note style={{marginBottom:0,fontSize:14}}>{props.labels.reduced}</p>:null}
 </section>:null;
 const boxStyle:CSSProperties={padding:20,border:'1px solid var(--line, #8797a9)',borderRadius:12,background:'var(--paper, white)',color:'var(--ink, #132a40)',fontSize:16,lineHeight:1.5};
 const modal=entry?<div style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(12,25,42,.48)',display:'grid',placeItems:'center',padding:16}}><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`${ID}-dialog-title`} data-p021-dialog={entry.id} style={{...boxStyle,width:'min(100%,620px)',maxHeight:'85dvh',overflowY:'auto',boxShadow:'0 16px 60px #10203044'}}><h3 id={`${ID}-dialog-title`}>{entry.labels[language]}</h3><p>{entry.definitions[language]}</p><button type="button" data-p021-dialog-close style={{...buttonStyle,marginTop:16}} onClick={closeGlossary}>{es?'Cerrar':'Close'}</button></div></div>:null;
 const hitStyle=(b:P021Bounds):CSSProperties=>({position:'absolute',left:`${b.x/8}%`,top:`${b.y/6}%`,width:`${b.width/8}%`,height:`${b.height/6}%`,minHeight:0,minWidth:0,padding:0,border:0,background:'transparent',cursor:'pointer'});
 return <div className="runtime-shell" style={{height:'auto','--flash-stage-width':'800px','--flash-stage-height':'600px','--flash-stage-aspect':'800 / 600'} as CSSProperties} data-source-clock-runtime={ID} data-source-clock-phase={snapshot?.phase??'loading'} data-source-failure={snapshot?.failure??error??''} data-source-audio-frame={snapshot?.picture.mainFrame??1} data-source-audio-playing={snapshot?.audioNodePlaying?'true':'false'} data-source-audio-domains={snapshot?.activeAudioDomains.join(',')??''} data-source-coach-label={snapshot?.coachLabel??''} data-source-coach-frame={snapshot?.picture.interaction.coachFrame??1} data-source-correct-frame={snapshot?.picture.interaction.correctFrame??1} data-source-close-pressed={snapshot?.picture.interaction.closePressed?'true':'false'} data-source-button-frame={snapshot?.picture.interaction.buttonFrame??1} data-source-step={snapshot?.practice.picture.step??0} data-source-popup={popup} data-source-practice-status={snapshot?.practice.status??'question'} data-source-question-ordinal={snapshot?.practice.questionOrdinal??0} data-source-question-index={snapshot?.practice.picture.questionIndex??0} data-source-result={snapshot?.practice.problem.result??0} data-source-selected={snapshot?.practice.selected??''} data-source-attempts={snapshot?.practice.attempts??0} data-source-quiz-active={snapshot?.sourceQuizActive?'true':'false'} data-source-inspection={snapshot?.inspectionMode?'true':'false'} data-runtime-volume={props.volume??1} data-audio-available={snapshot?'true':'false'} data-runtime-paused={props.paused?'true':'false'} data-runtime-presentation="modern-wide" data-runtime-playback-complete="false">
  <div ref={stage} className="runtime-stage" style={{position:'relative',height:'auto',aspectRatio:'4 / 3'}} data-animation-module={ID} data-flash-frame={paintedFrame} data-flash-frame-domain="sprite-160" data-source-clock-ready={snapshot?'true':'false'}>
   <canvas ref={canvas} width={800} height={600} data-course-canvas={ID} aria-label={es?'Saltos de enteros positivos y negativos en la recta numérica':'Positive and negative integer jumps on the number line'} style={{display:snapshot?'block':'none',width:'100%',height:'auto'}}/>
   {practice&&snapshot?practice.sourceHotspots.map(h=>{const r=h.ranges.find(r=>paintedFrame>=r.firstFrame&&paintedFrame<=r.lastFrame);if(!r)return null;return <button type="button" key={h.sourceCharacterId} data-p021-source-glossary={h.entryId} disabled={Boolean(entry)} aria-label={practice.glossary.find(e=>e.id===h.entryId)?.labels[language]??h.entryId} onClick={e=>openGlossary(h.entryId,e.currentTarget)} style={hitStyle(r.bounds)}/>;}):null}
   {practice&&snapshot?.picture.mainFrame===571?<>
    <button type="button" data-p021-source-target aria-label={es?'Colocar en la recta numérica de la imagen':'Place on the pictured number line'} disabled={!canAct||!snapshot.practice.selected} onClick={()=>drop(true)} style={hitStyle(practice.numberLineTarget)}/>
    {snapshot.practice.problem.cards.map(card=>{const p=snapshot.practice.picture.positions[card.id]!,b=card.sourceLocalBoundsTwips,locked=!canAct||snapshot.practice.picture.step>=1&&card.id===snapshot.practice.problem.firstId;return <div key={card.id} aria-hidden="true" data-p021-drag={card.id} data-p021-card-x={p.x} data-p021-card-y={p.y} onPointerDown={e=>begin(e,card)} onPointerMove={move} onPointerUp={e=>end(e)} onPointerCancel={e=>end(e,true)} onLostPointerCapture={e=>{if(pointer.current?.id===e.pointerId)end(e,true);}} style={{...hitStyle({x:412.4+p.x+b.left/20,y:280.3+p.y+b.top/20,width:(b.right-b.left)/20,height:(b.bottom-b.top)/20}),pointerEvents:locked?'none':'auto',touchAction:'none',cursor:locked?'default':'grab',outline:snapshot.practice.selected===card.id?'2px solid #146b9c':undefined,borderRadius:4}}/>;})}
    <button type="button" data-p021-source-new-problem aria-label={es?'Nuevo número en la imagen':'New number in the picture'} disabled={!snapshot.canNewProblem||Boolean(entry)} onClick={newProblem} style={hitStyle(practice.newProblemBounds)}/>
    {popup==='wrong'?<button type="button" data-p021-source-close aria-label={es?'Cerrar la explicación de la imagen':'Close the explanation in the picture'} disabled={Boolean(entry)} {...closeEvents} style={hitStyle(practice.wrongCloseBounds)}/>:null}
   </>:null}
  </div>
  {companion&&readable?createPortal(readable,companion):null}{modal&&typeof document!=='undefined'?createPortal(modal,document.body):null}
  {!snapshot&&!error?<p role="status">{props.labels.loading}</p>:null}{error?<p role="alert" data-source-clock-error={error}>{props.labels.unavailable}</p>:null}
 </div>;
}
