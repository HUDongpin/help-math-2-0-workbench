'use client';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {AnimationRendererProps,AudioCue,RuntimeContext} from '../contract';
import type {LessonTextActivityDefinition,LessonTextActivitySnapshot,LessonTextBinding,LessonTextKeyTermsCapability,LessonTextPresentationCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
import {LessonSourceButton} from '../lesson-source-button';
import {ColumnArithmeticScene,getColumnTeachingState,type ColumnArithmeticConfig} from './g4-l4-column-arithmetic';
import {numberLineValue as at} from './g4-l4-number-line';
import {createPracticeState,synchronizePracticeState,proposePracticeAction,type PracticeConfig,type PracticeState,type PracticeAction} from './g4-l4-practice-state';
type Curve=readonly(readonly[number,number])[];
type PracticeKeyTermTarget=Readonly<{button:number;key:string;entryId:string;color?:string}>;
type PracticeTerm=PracticeKeyTermTarget&Readonly<{text:string;occurrence?:number;blockId?:string}>;
type Text=Readonly<{id:string;text:string;sourceTextIds:readonly string[];terms?:readonly PracticeTerm[];alpha?:Curve;color?:readonly(readonly[number,string])[];continuesBlockId?:string;connector?:Readonly<{after:string;sourceShape:number;sourceInstance:string;alpha:Curve}>}>;
type PanelSection=Readonly<{id:string;sourceFrame:number;column:ColumnArithmeticConfig;heading:Text;before:readonly Text[];after:readonly Text[];terms:readonly PracticeTerm[]}>;
type Panel=PanelSection&Readonly<{sections?:readonly PanelSection[]}>;
export interface PracticePageConfig extends PracticeConfig{
 readonly animationId:string;readonly placementId:string;readonly sourceSha256:string;readonly rootFrame:6;readonly frameDomain:string;readonly fps:12;
 readonly binding:LessonTextBinding;readonly text:Readonly<Record<string,string>>;
 readonly question:readonly(Text&{readonly tokens:readonly Readonly<{text:string;alpha:Curve;sourceTextIds:readonly string[];color?:readonly(readonly[number,string])[];keyTerm?:PracticeKeyTermTarget}>[]})[];
 readonly stepNumbers:readonly(Text&{readonly alpha:Curve})[];
 readonly stepCopy:readonly(Text&{readonly alpha:Curve;readonly stepIndex?:0|1|2|3})[];
 readonly answerViews:readonly(Text&{readonly blockId:string;readonly alpha:Curve;readonly sourceButton:number})[];
 readonly feedbackViews:readonly Readonly<{id:string;labels:readonly(Text&{readonly alpha:Curve})[]}>[];
 readonly panels:readonly Panel[];readonly completedPanels:readonly Panel[];readonly activities:readonly LessonTextActivityDefinition[];readonly keyTerms:LessonTextKeyTermsCapability;
 readonly sourceAudio:readonly(AudioCue&{readonly sha256:string})[];
 readonly help:PracticeConfig['help']&Readonly<{button:number;closeButton:number}>;
}
function boundActivity(running:PracticeState['feedback'],activities:readonly LessonTextActivitySnapshot[]){
 if(!running)return null;const d=running.definition,matches=activities.filter(a=>a.id===d.id&&a.frameDomain===d.frameDomain&&a.sourceInstanceId===d.sourceInstanceId&&Number.isSafeInteger(a.revision)&&a.revision>running.revisionFloor&&a.frame>=d.startFrame&&a.frame<=d.endFrame);
 return matches.length===1?matches[0]:null;
}
export function getPracticeSnapshot(c:PracticePageConfig,state:SourceStaticCanvasFrameState,r:RuntimeContext,stored=createPracticeState({...r,replay:r.replay??0}),activities:readonly LessonTextActivitySnapshot[]=[]):TextPresentationSnapshot{
 const blockers:string[]=[];
 if(state.status!=='ready'||state.blocker||state.animationId!==c.animationId||state.sourceSwfSha256!==c.sourceSha256)blockers.push('source-identity-mismatch');
 if(r.lang!=='en'||state.language!=='en')blockers.push('spanish-text-not-source-verified');
 if(r.scenario!=='source-static-frame'||state.scenario!==r.scenario||r.entryStateSha256)blockers.push('original-renderer-required');
 if((r.frameDomain??c.frameDomain)!==c.frameDomain||state.frameDomain!==c.frameDomain||!Number.isInteger(r.frame)||r.frame<1||r.frame>c.frameCount||state.frame!==r.frame||state.rootFrame!==c.rootFrame||(r.rootFrame!==undefined&&r.rootFrame!==c.rootFrame)||state.seed!==(r.seed>>>0))blockers.push('teaching-state-identity-mismatch');
 const s=synchronizePracticeState(c,stored,{...r,replay:r.replay??0}),feedback=boundActivity(s.feedback,activities),panel=s.help?c.panels.find(p=>p.id==='help'):s.box?c.panels.find(p=>p.id===s.box!.definition.id.replace('-open','')):null;
 const visible=new Set<string>(['root-title']);
 if(panel){for(const section of [panel,...(panel.sections??[])])for(const b of [section.heading,...section.before,...section.after,...section.column.blocks.slice(1)])visible.add(b.id);if(s.help||s.boxReady)visible.add('close');}
 else{
  for(const q of c.question)if(q.tokens.some(t=>at(t.alpha,r.frame,0)>0))visible.add(q.id);
  for(const b of [...c.stepNumbers,...c.stepCopy])if(at(b.alpha,r.frame,0)>0)visible.add(b.id);
  for(const panel of c.completedPanels)if(at(panel.heading.alpha??[],r.frame,0)>0)for(const section of [panel,...(panel.sections??[])]){for(const b of [section.heading,...section.before,...section.after])if(at(b.alpha??[[1,1]],r.frame,1)>0)visible.add(b.id);for(const b of getColumnTeachingState(section.column,r.frame).blocks.slice(1))if(b.visible)visible.add(b.id);}
  for(const b of c.answerViews)if(at(b.alpha,r.frame,0)>0)visible.add(b.blockId);
  if(c.help.availableFrames.includes(r.frame))visible.add('need-more-help');
 }
 if(feedback)for(const label of c.feedbackViews.find(f=>f.id===feedback.id)!.labels)if(at(label.alpha,feedback.frame,0)>0)visible.add(label.id);
 return {schemaVersion:1,animationId:c.animationId,bindingVersion:c.binding.version,sourceSwfSha256:c.sourceSha256,status:blockers.length?'blocked':'ready',blockers,identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:r.replay??0},suppressedInstances:[],blocks:blockers.length?[]:c.binding.blocks.map(b=>({...b,text:c.question.find(q=>q.id===b.id)?.tokens.filter(t=>at(t.alpha,r.frame,0)>0).map(t=>t.text).join('')??c.text[b.id],visible:visible.has(b.id)}))};
}
const CSS=`
.g4l4-practice{inline-size:100%;min-inline-size:0;padding:.8rem;box-sizing:border-box;background:#fffdf7;color:#17273c;font:1.125rem/1.65 var(--lesson-font-body,system-ui,sans-serif)}
.g4l4-practice *{box-sizing:border-box;transition:none!important}.g4l4-practice [hidden]{display:none!important}.g4l4-practice h2{font:700 2.25rem/1.25 var(--lesson-font-display,system-ui,sans-serif);margin:0 0 .65em}.g4l4-practice h3{font:700 1.4rem/1.35 var(--lesson-font-display,system-ui,sans-serif);margin:.5rem 0}
.g4l4-practice h2,.g4l4-practice .g4l4-column h2{overflow-wrap:anywhere}
.g4l4-practice p{margin:.6rem 0}.g4l4-practice button{font:inherit;min-block-size:44px;min-inline-size:44px;cursor:pointer;touch-action:manipulation}.g4l4-practice button:disabled{cursor:default}.g4l4-practice button:focus-visible,.g4l4-practice [tabindex]:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
.g4l4-practice__step{border-block-start:1px solid #b9c8d6;padding:.5rem 0}.g4l4-practice__step-button{border:2px solid #1757af;border-radius:.4rem;background:#fff;color:#124f98;padding:.3rem .7rem;font-weight:700!important}
.g4l4-practice__choices{display:flex;flex-wrap:wrap;gap:.7rem}.g4l4-practice__choices button{border:2px solid #4f7299;background:white;color:inherit;border-radius:.4rem;padding:.5rem .8rem;white-space:nowrap;font-variant-numeric:tabular-nums}
.g4l4-practice__action{border:1px solid #1757af;border-radius:.4rem;background:#1757af;color:white;padding:.5rem 1rem;margin-block:.6rem}
.g4l4-practice__dialog,.g4l4-practice__feedback{padding:.75rem;border:2px solid #4f7299;border-radius:.5rem;background:#f5f9ff;scroll-margin-block-start:calc(var(--lesson-platform-header-height,0px) + 1rem)}
.g4l4-practice__feedback[data-kind='wrong']{background:#fff4ef;border-color:#9d4d36}.g4l4-practice__feedback[data-kind='correct']{background:#eff9f2;border-color:#286b45}
.g4l4-practice__term{border:0;background:transparent;color:inherit;text-align:start;padding:0;text-decoration:underline;text-underline-offset:.15em}.g4l4-practice__letters{letter-spacing:.1em}.g4l4-practice__connector{display:inline-block;inline-size:1.4em;block-size:1em;vertical-align:-.12em;fill:none;stroke:currentColor;stroke-width:1.5}.g4l4-practice .g4l4-column{padding:0}
@media(max-width:480px){.g4l4-practice{padding-inline:0}.g4l4-practice h2{font-size:1.625rem}.g4l4-practice__dialog{padding:.2rem}
.lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-practice){width:calc(100vw - 8px);max-width:none;margin-inline:calc((100% - 100vw + 8px)/2)}
.lesson-shell2 .lesson-shell2__legacy-stage:has(.runtime-shell[data-lesson-presentation='modern-text-v1'] .g4l4-practice)>.lesson-shell2__stage{padding-inline:2px}}
`;
// Own039/040 keep intact source equations at the root font on narrow screens.
// The source figure coordinates and all mathematical/Help arrow paths stay unchanged.
const OWN039040_MATH_CSS=`
.g4l4-practice[data-modern-text-page="course-g04-l09-ts-008"] .g4l4-column__label[data-lesson-text-block^="step-4-check-math-"],
.g4l4-practice[data-modern-text-page="course-g04-l09-ts-008"] .g4l4-column__label[data-lesson-text-block^="retained-step-4-check-math-"]{font-size:1rem!important}
@media(max-width:480px){
.g4l4-practice[data-modern-text-page="course-g04-l09-ts-007"] .g4l4-column__label,
.g4l4-practice[data-modern-text-page="course-g04-l09-ts-008"] .g4l4-column__label:not([data-lesson-text-block="help-math-19"]){font-size:1rem!important}
.g4l4-practice[data-modern-text-page="course-g04-l09-ts-008"] .g4l4-column__port{inline-size:calc(100vw - 4px);max-inline-size:none;margin-inline:calc((100% - 100vw + 4px)/2)}
.g4l4-practice[data-modern-text-page="course-g04-l09-ts-008"] .g4l4-column__label[data-lesson-text-block="help-math-20"]{font-variation-settings:'wdth' 90}
}
`;
export function PracticeScene({config:c,runtime:r,session:s,activities=[],onAction}:{config:PracticePageConfig;runtime:AnimationRendererProps;session:PracticeState;activities?:readonly LessonTextActivitySnapshot[];onAction?:(a:PracticeAction)=>void}){
 const root=useRef<HTMLElement>(null),panel=s.help?c.panels.find(p=>p.id==='help'):s.box?c.panels.find(p=>p.id===s.box!.definition.id.replace('-open','')):null,feedback=boundActivity(s.feedback,activities),stepIndex=c.steps.findIndex(v=>v.hold===r.frame);
 const canAct=!r.paused&&!!onAction&&!!r.onLessonFrameRequest&&!!r.onLessonActivityRequest&&s.pendingFromFrame===null&&!s.feedback&&!panel;
 const floor=()=>Math.max(-1,...activities.map(a=>a.revision));
 useLayoutEffect(()=>{const target=r.frame===c.frameCount?'replay':s.focus??(stepIndex>=0?'step-'+stepIndex:null);if(!target)return;const element=root.current?.querySelector<HTMLElement>(`[data-practice-focus="${target}"]`);element?.focus({preventScroll:true});if(panel)element?.scrollIntoView({block:'nearest',behavior:'instant'});},[s.focus,stepIndex,r.replay,r.frame===c.frameCount,panel?.id]);
 const keyTermButton=(t:PracticeKeyTermTarget,text:string,key:React.Key,hidden=false)=><button key={key} type="button" className="g4l4-practice__term" data-source-keyterm={t.key} data-source-button={t.button} data-keyterm-entry-id={t.entryId} style={t.color?{color:t.color}:undefined} disabled={hidden||!r.onLessonHostRequest} onClick={e=>r.onLessonHostRequest?.({type:'open-keyterm',entryId:t.entryId,sourceAnimationId:c.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:e.currentTarget,keyTermIndexLanguage:'en'})}>{text}</button>;
 const rich=(b:Text,p:Pick<PanelSection,'terms'>)=>{const terms=p.terms.filter(t=>(!t.blockId||t.blockId===b.id)&&b.text.includes(t.text));if(!terms.length)return b.text;const result:React.ReactNode[]=[];let cursor=0;
  while(cursor<b.text.length){const next=terms.map(t=>{let index=b.text.indexOf(t.text,t.occurrence===undefined?cursor:0);for(let i=0;i<(t.occurrence??0)&&index>=0;i++)index=b.text.indexOf(t.text,index+t.text.length);return {t,index};}).filter(v=>v.index>=cursor).sort((a,b)=>a.index-b.index)[0];if(!next){result.push(b.text.slice(cursor));break;}result.push(b.text.slice(cursor,next.index));const t=next.t;result.push(keyTermButton(t,t.text,next.index));cursor=next.index+t.text.length;}
  return result;
 };
 const renderPanel=(panel:PanelSection,frame:number)=><ColumnArithmeticScene config={panel.column} keyboardScrollStep={c.animationId==='course-g04-l09-ts-007'?16:c.animationId==='course-g04-l09-ts-008'?13:undefined} frame={frame} replay={r.replay} renderLabel={b=>rich(b,panel)} headingBlockId={panel.heading.id} heading={<span style={{opacity:at(panel.heading.alpha??[[1,1]],frame,1)}}>{rich(panel.heading,panel)}</span>} after={panel.after.map(b=><p key={b.id} data-lesson-text-block={b.id} style={{opacity:at(b.alpha??[[1,1]],frame,1)}}>{rich(b,panel)}</p>)}>{panel.before.map(b=><p key={b.id} data-lesson-text-block={b.id} style={{opacity:at(b.alpha??[[1,1]],frame,1)}}>{rich(b,panel)}</p>)}</ColumnArithmeticScene>;
 const copy=(t:Text)=>{if(!t.connector)return rich(t,{terms:t.terms??[]});const a=t.connector,end=t.text.indexOf(a.after)+a.after.length;return <>{t.text.slice(0,end)}<svg className="g4l4-practice__connector" viewBox="0 0 24 12" role="img" aria-label="leads to" data-source-shape={a.sourceShape} data-source-instance={a.sourceInstance} style={{opacity:at(a.alpha,r.frame,0)}}><path d="M1 6H21M15 1L21 6L15 11"/></svg>{t.text.slice(end)}</>;};
 const labels=feedback?c.feedbackViews.find(v=>v.id===feedback.id)!.labels:[],letters=labels.filter(l=>l.text.length===1),other=labels.filter(l=>l.text.length!==1);
 return <section ref={root} className="g4l4-practice" lang="en" data-modern-text-page={c.animationId} data-lesson-text-status="ready" data-lesson-frame={r.frame} data-lesson-replay={r.replay??0} data-practice-mode={s.help?'help':s.box?'step-panel':s.feedback?'feedback':s.pendingFromFrame!==null?'resuming':'main'} data-feedback-activity-id={feedback?.id??''} data-feedback-activity-frame={feedback?.frame??''}>
  <style>{CSS}</style>{['course-g04-l09-ts-007','course-g04-l09-ts-008'].includes(c.animationId)&&<style>{OWN039040_MATH_CSS}</style>}<h2 data-lesson-text-block="root-title">{c.text['root-title']}</h2>
  <div hidden={!!panel}>
   <p>{c.question.map(q=><span key={q.id} data-lesson-text-block={q.id}>{q.tokens.map((t,i)=>{const alpha=at(t.alpha,r.frame,0);return <span key={i} data-source-text-ids={t.sourceTextIds.join(',')} aria-hidden={alpha<=0} style={{opacity:alpha,color:t.color?at(t.color,r.frame,'inherit'):undefined}}>{t.keyTerm?keyTermButton(t.keyTerm,t.text,i,alpha<=0):t.text}</span>;})}</span>)}</p>
   {c.stepNumbers.map((b,i)=>{const alpha=at(b.alpha,r.frame,0);return alpha>0?<div className="g4l4-practice__step" key={b.id} style={{opacity:alpha}}><h3>{stepIndex===i?<button type="button" className="g4l4-practice__step-button" data-lesson-text-block={b.id} data-practice-focus={'step-'+i} disabled={!canAct} onClick={()=>onAction?.(c.steps[i].box?{type:'open-step',revisionFloor:floor()}:{type:'continue-step'})}>{b.text}</button>:<span data-lesson-text-block={b.id}>{b.text}</span>}</h3>{c.stepCopy.filter(v=>!v.continuesBlockId&&(v.stepIndex??(v.id==='main-48'?0:1))===i).map(v=>at(v.alpha,r.frame,0)>0?<p key={v.id}>{[v,...c.stepCopy.filter(t=>t.continuesBlockId===v.id)].map((t,j)=><React.Fragment key={t.id}>{j>0?' ':null}<span data-lesson-text-block={t.id} style={{opacity:at(t.alpha,r.frame,0)}}>{copy(t)}</span></React.Fragment>)}</p>:null)}{c.completedPanels.filter(p=>p.id==='completed-step-'+(i+1)&&at(p.heading.alpha??[],r.frame,0)>0).map(p=><div key={p.id} data-retained-panel={p.id}>{[p,...(p.sections??[])].map(section=><React.Fragment key={section.id}>{renderPanel(section,r.frame)}</React.Fragment>)}</div>)}</div>:null;})}
   <div className="g4l4-practice__choices" role="group" aria-label="Answer choices">{c.answerViews.map(a=>{const alpha=at(a.alpha,r.frame,0);return alpha>0?<button key={a.id} type="button" data-lesson-text-block={a.blockId} data-practice-focus={'choice-'+a.id} data-source-button={a.sourceButton} style={{opacity:alpha}} disabled={!canAct||r.frame!==c.finalFrame} onClick={()=>onAction?.({type:'choose',choice:a.id,revisionFloor:floor()})}>{a.text}</button>:null;})}</div>
   {c.help.availableFrames.includes(r.frame)&&<button type="button" className="g4l4-practice__action" data-lesson-text-block="need-more-help" data-practice-focus="help" data-source-button={c.help.button} disabled={!canAct} onClick={()=>onAction?.({type:'open-help'})}>{c.text['need-more-help']}</button>}
  </div>
  {panel&&<div className="g4l4-practice__dialog" role="dialog" aria-modal="true" aria-label={panel.heading.text} tabIndex={-1} data-practice-focus="step-opening" onKeyDown={e=>{
   if(e.key==='Escape'&&(s.help||s.boxReady)){e.preventDefault();onAction?.({type:s.help?'close-help':'close-step'});return;}
   if(e.key!=='Tab')return;const buttons=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]'));e.preventDefault();if(!buttons.length){e.currentTarget.focus();return;}const i=buttons.indexOf(document.activeElement as HTMLElement);buttons[e.shiftKey?(i<=0?buttons.length-1:i-1):(i+1)%buttons.length].focus();
  }}>
   {[panel,...(panel.sections??[])].map(section=><React.Fragment key={section.id}>{renderPanel(section,panel.sourceFrame)}</React.Fragment>)}
   {(s.help||s.boxReady)&&<LessonSourceButton runtime={r} activityId={s.help?'close-help':'close-'+s.box!.definition.id} type="button" className="g4l4-practice__action" data-practice-focus={s.help?'help-close':'step-close'} data-lesson-text-block="close" data-source-button={s.help?c.help.closeButton:c.steps[stepIndex].box!.closeButton} disabled={r.paused||!onAction} onClick={()=>onAction?.({type:s.help?'close-help':'close-step'})}>{c.text.close}</LessonSourceButton>}
  </div>}
  {s.feedback&&<div className="g4l4-practice__feedback" role="status" aria-live="polite" tabIndex={-1} data-practice-focus="feedback" data-kind={s.feedback.kind}>
   {letters.length>0&&<p className="g4l4-practice__letters">{letters.map(l=><span key={l.id} data-lesson-text-block={l.id} aria-hidden={at(l.alpha,feedback!.frame,0)<=0} style={{opacity:at(l.alpha,feedback!.frame,0),color:l.color?at(l.color,feedback!.frame,'inherit'):undefined}}>{l.text}</span>)}</p>}
   {other.map(l=>at(l.alpha,feedback!.frame,0)>0?<p key={l.id} data-lesson-text-block={l.id} style={{opacity:at(l.alpha,feedback!.frame,0),color:l.color?at(l.color,feedback!.frame,'inherit'):undefined}}>{l.text}</p>:null)}
  </div>}
  {r.frame===c.frameCount&&<button type="button" className="g4l4-practice__action" data-practice-focus="replay" disabled={!r.onReplay} onClick={r.onReplay}>Replay</button>}
 </section>;
}
export function createPracticePresentation(c:PracticePageConfig,getFrameState:(frame:number,r:RuntimeContext)=>SourceStaticCanvasFrameState,Fallback:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 validateLessonTextBinding(c.binding);
 function Renderer(r:AnimationRendererProps){
  const context={...r,replay:r.replay??0,frameDomain:r.frameDomain??c.frameDomain},state=(r.state??getFrameState(r.frame,context))as SourceStaticCanvasFrameState;
  const [stored,setStored]=useState(()=>createPracticeState(context)),s=synchronizePracticeState(c,stored,context),live=useRef(s);live.current=s;
  const activities=r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]),snapshot=getPracticeSnapshot(c,state,context,s,activities),ready=snapshot.status==='ready';
  const apply=(a:PracticeAction)=>{if(!ready)return;const proposal=proposePracticeAction(c,live.current,context,a);if(!proposal)return;const q=proposal.request;if(q&&(q.kind==='frame'?!r.onLessonFrameRequest?.(q.transition):!r.onLessonActivityRequest?.({id:q.id,parentFrame:q.parentFrame})))return;live.current=proposal.state;setStored(proposal.state);};
  useEffect(()=>{if(!ready||r.paused)return;for(const running of [s.boxReady?null:s.box,s.feedback]){const a=boundActivity(running,activities);if(a?.status==='completed'&&a.sourceInstanceId)apply({type:'activity-completed',proof:{...a,sourceInstanceId:a.sourceInstanceId}});}},[ready,r.paused,s,activities]);
  if(!ready)return <Fallback {...r} state={state}/>;
  return <PracticeScene config={c} runtime={r} session={s} activities={activities} onAction={apply}/>;
 }
 return {schemaVersion:1,binding:c.binding,Renderer,getSnapshot:(s,r)=>getPracticeSnapshot(c,s,r),playbackMode:'once',playbackEndFrameByDomain:{[c.frameDomain]:c.steps[0].hold},reducedMotionFrameByDomain:{[c.frameDomain]:c.steps[0].hold},frameControl:{frameDomain:c.frameDomain,completionFrame:c.frameCount,transitions:[...c.steps.map(s=>s.transition),c.finalTransition]},activityTimelines:c.activities,sourceTimelineAudioCues:c.sourceAudio,keyTerms:c.keyTerms};
}
