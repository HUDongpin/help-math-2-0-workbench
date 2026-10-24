'use client';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {AnimationRendererProps} from '../contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {CourseG04L04In004Renderer,getCourseG04L04In004FrameState} from '../modules/course-g04-l04-in-004';
import {getIn004TextSnapshot} from './g4-l4-in004-text';
import {LessonSourceButton} from '../lesson-source-button';
import {In004Intro,In004TeachingCopy} from './g4-l4-in004-intro';
import {In004QuestionFigure} from './g4-l4-in004-question';
import {G4_L4_IN004_NATIVE_CONFIG as C} from './generated/g4-l4-in004-native-config';
import {createIn004Session,synchronizeIn004Session,bindIn004Children,dispatchIn004,in004OwnedActivities,type In004HostAction,type In004Session} from './g4-l4-in004-host-state';
const all=(r:AnimationRendererProps)=>r.lessonActivities??(r.lessonActivity?[r.lessonActivity]:[]);
/** Composition for the existing My Lesson source-clock APIs. The formal
 * capability/source binding and registry admission remain separate. */
export function In004Page(r:AnimationRendererProps){
 const [stored,set]=useState(()=>createIn004Session(r.seed,r.replay??0));
 const activities=all(r),s=synchronizeIn004Session(stored,r,activities),live=useRef(s),runtime=useRef(r);live.current=s;runtime.current=r;
 const close=useRef<HTMLButtonElement>(null),wrongWasOpen=useRef(false),returnFocus=useRef<HTMLElement|null>(null);
 const commit=(next:In004Session)=>{if(next!==live.current){live.current=next;set(next);}};
 const act=(a:In004HostAction)=>{const prior=live.current.practice?.wrongOpen,next=dispatchIn004(live.current,a,runtime.current);if(!prior&&next.practice?.wrongOpen&&typeof document!=='undefined')returnFocus.current=document.activeElement as HTMLElement;commit(next);};
 useEffect(()=>{if(r.paused)return;const bound=bindIn004Children(s,activities);if(bound!==s){commit(bound);return;}commit(dispatchIn004(s,{type:'finish'},r));},[s,activities,r.frame,r.paused]);
 useEffect(()=>()=>{const p=runtime.current;for(const a of in004OwnedActivities(live.current,all(p)))if(a.cancellationToken)p.onLessonActivityCancel?.({id:a.id,sourceInstanceId:a.sourceInstanceId,revision:a.revision,cancellationToken:a.cancellationToken,parentFrame:p.frame});},[r.seed,r.replay]);
 const wrong=Boolean(s.practice?.wrongOpen);
 useLayoutEffect(()=>{if(wrong&&!wrongWasOpen.current)close.current?.focus();wrongWasOpen.current=wrong;},[wrong]);
 const openTerm:React.ComponentProps<typeof In004Intro>['onOpenKeyTerm']=r.onLessonHostRequest?(term,trigger)=>r.onLessonHostRequest?.({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:C.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger,keyTermIndexLanguage:'en'}):undefined;
 const source=(r.state??getCourseG04L04In004FrameState(r.frame,r)) as SourceStaticCanvasFrameState,snapshot=getIn004TextSnapshot(source,r,s,activities);
 if(snapshot.status!=='ready')return <CourseG04L04In004Renderer {...r} state={source}/>;
 if(r.frame>=1&&r.frame<=470)return <div data-modern-text-page={C.animationId} data-lesson-frame={r.frame} data-lesson-replay={r.replay??0} data-lesson-text-status={snapshot.status}><In004Intro frame={r.frame} replay={r.replay} paused={r.paused} reducedMotion={r.reducedMotion} onOpenKeyTerm={openTerm} onBegin={r.onLessonFrameRequest?()=>act({type:'begin'}):undefined}/></div>;
 const ready=s.practice&&C.questions.find(q=>q.id===s.practice!.question)?.frame===r.frame;
 const p=s.practice,locked=!!r.paused||!r.onLessonActivityRequest||!r.onLessonActivitiesRequest||!r.onLessonFrameRequest;
 const correct=in004OwnedActivities(s,activities).some(a=>a.id==='in004-g4l4-final'&&a.status==='playing'&&a.frame>=2&&a.frame<25);
 return <section className="in004-intro" lang="en" data-modern-text-page={C.animationId} data-lesson-frame={r.frame} data-lesson-replay={r.replay??0} data-lesson-text-status={snapshot.status} data-in004-page-frame={r.frame} data-in004-replay={r.replay??0} data-in004-current-question={ready?p?.question:''}>
  <In004TeachingCopy frame={r.frame} onOpenKeyTerm={openTerm}/><style>{`.in004-page__button{padding:.35em .7em;border:1px solid #1556a0;border-radius:.4em;background:#1556a0;color:white}.in004-page__button:disabled{background:#dce6ef;color:#35485c}.in004-page__feedback{margin:1em 0;padding:1em;border:2px solid #99552e;border-radius:.5em;background:#fff4e5}.in004-page__feedback--correct{border-color:#296a42;background:#edf8ed}`}</style>
  {ready&&p?<>
   <button type="button" className="in004-page__button" data-in004-new-problem data-lesson-text-block="newProblem" disabled={locked||!p.newProblemEnabled} onClick={()=>act({type:'new-problem'})}>{C.copy.newProblem.text}</button>
   <In004QuestionFigure state={p} paused={locked} onAction={a=>{if(a.type!=='feedback-complete')act(a);}}/>
   {correct&&<div className="in004-page__feedback in004-page__feedback--correct" role="status" data-in004-correct><strong data-lesson-text-block="correct">{C.copy.correct.text}</strong></div>}
   {wrong&&<div className="in004-page__feedback" role="region" aria-label="Try again" data-in004-wrong><p data-lesson-text-block="wrong">{C.copy.wrong.text}</p><LessonSourceButton ref={close} runtime={r} activityId="in004-g4l4-close-down" data-lesson-text-block="close" type="button" className="in004-page__button" disabled={!!r.paused} onClick={()=>{act({type:'close-wrong'});returnFocus.current?.focus();}}>{C.copy.close.text}</LessonSourceButton></div>}
  </>:<p role="status">Select Replay to start a new practice.</p>}
  <p><button type="button" className="in004-page__button" disabled={!r.onReplay} onClick={r.onReplay}>Replay</button></p>
 </section>;
}
