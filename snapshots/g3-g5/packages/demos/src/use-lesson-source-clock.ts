'use client';
import {useCallback, useLayoutEffect, useRef, useState} from 'react';
import type {AnimationModule} from './contract';
import type {LessonTextActivityCancellation, LessonTextActivityDefinition} from './lesson-text-contract';
import {clampFrame, frameAtElapsedMs, frameToElapsedMs, resolvePlaybackEndFrame} from './runtime';
import {advanceSourceActivities, beginSourceClockActivities, cancelSourceClockActivity, sourceActivitiesAtParentFrame, sourceActivityBlocksParent, releaseSourceButtonActivity, type SourceClockActivity} from './lesson-source-clock';

interface Clock {
  signature: string; milliseconds: number; frame: number; stopFrame: number;
  sourceControlled: boolean; activities: readonly SourceClockActivity[]; revision: number; seekRevision: number;
}
/** One RAF owns the parent and all placed children. Layout, media and page
 * components consume its frames; none of them owns another teaching timer. */
export function useLessonSourceClock(movie: AnimationModule['movie'] | undefined,
  playbackMode: AnimationModule['playbackMode'], playbackEndFrame: AnimationModule['playbackEndFrame'],
  running: boolean, replay: number, playbackIdentity: string, activityRunning: boolean) {
  const fps=movie?.fps??0, frameCount=movie?.frameCount??0, mode=playbackMode??'once';
  const initialEnd=movie?resolvePlaybackEndFrame(movie,playbackEndFrame):1;
  const signature=`${playbackIdentity}:${fps}:${frameCount}:${initialEnd}:${mode}:${replay}`;
  const fresh=():Clock=>({signature,milliseconds:0,frame:1,stopFrame:initialEnd,sourceControlled:false,activities:[],revision:0,seekRevision:0});
  const value=useRef<Clock>(fresh());
  const [snapshot,setSnapshot]=useState(value.current);
  const [loopRevision,setLoopRevision]=useState(0);
  const loop=useRef<{request:number;last:number;signature:string;main:boolean;children:boolean;advance:(now:number)=>void}|null>(null);
  const publish=useCallback(()=>setSnapshot(previous=>{
    const next=value.current;
    if(previous.signature===next.signature&&previous.frame===next.frame&&previous.stopFrame===next.stopFrame
      &&previous.sourceControlled===next.sourceControlled&&previous.revision===next.revision&&previous.seekRevision===next.seekRevision
      &&previous.activities.length===next.activities.length&&previous.activities.every((activity,index)=>{
        const other=next.activities[index];return other&&activity.revision===other.revision&&activity.frame===other.frame&&activity.status===other.status;
      }))return previous;
    return {...next};
  }),[]);
  const stopLoop=useCallback(()=>{
    const active=loop.current;if(!active)return;
    // Invalidate first: a canceled callback must never retain clock ownership.
    loop.current=null;cancelAnimationFrame(active.request);active.advance(performance.now());publish();
  },[publish]);
  // Freeze and publish at commit, before a paused render can be painted.
  // A passive cleanup can otherwise add elapsed time after pause is visible.
  useLayoutEffect(()=>{
    stopLoop();
    if(value.current.signature!==signature){value.current=fresh();publish();}
    if(!fps||!frameCount)return;
    const playbackMovie={stage:{width:1,height:1},fps,frameCount,durationMs:frameCount*1000/fps};
    const active={request:0,last:performance.now(),signature,main:running,children:activityRunning,advance:(_now:number)=>{}};
    active.advance=(now:number)=>{
      if(value.current.signature!==active.signature)return;
      // A RAF queued in the current render turn can predate this effect.
      // Clamping its delta to zero must not rewind the elapsed-time anchor.
      const dt=Math.max(0,now-active.last);active.last=Math.max(active.last,now);
      const current=value.current;
      const main=active.main&&!sourceActivityBlocksParent(current.activities);
      const milliseconds=current.milliseconds+(main?dt:0);
      const frame=main?frameAtElapsedMs(milliseconds,playbackMovie,mode,current.stopFrame):current.frame;
      value.current={...current,milliseconds,frame,
        activities:sourceActivitiesAtParentFrame(active.children?advanceSourceActivities(current.activities,dt):current.activities,frame)};
    };
    const shouldRun=()=>Boolean((running&&!sourceActivityBlocksParent(value.current.activities)
      &&(mode==='loop'||value.current.frame<value.current.stopFrame))
      ||(activityRunning&&value.current.activities.some(activity=>activity.status==='playing')));
    if(!shouldRun())return;
    loop.current=active;
    const tick=(now:number)=>{
      if(loop.current!==active)return;active.advance(now);publish();
      if(shouldRun())active.request=requestAnimationFrame(tick);else loop.current=null;
    };
    active.request=requestAnimationFrame(tick);
    return stopLoop;
  },[signature,fps,frameCount,mode,running,activityRunning,loopRevision,stopLoop,publish]);
  const restart=useCallback(()=>{publish();setLoopRevision(value=>value+1);},[publish]);
  const seekToFrame=useCallback((requested:number)=>{
    if(!movie||value.current.signature!==signature)return;
    stopLoop();const frame=clampFrame(requested,frameCount);
    value.current={...value.current,frame,milliseconds:frameToElapsedMs(frame,movie),activities:[],seekRevision:value.current.seekRevision+1};restart();
  },[signature,movie,frameCount,stopLoop,restart]);
  const continueSourceFrame=useCallback((toFrame:number,stopFrame:number)=>{
    if(!movie||value.current.signature!==signature||!Number.isSafeInteger(toFrame)||!Number.isSafeInteger(stopFrame)
      ||toFrame<1||toFrame>stopFrame||stopFrame>frameCount||sourceActivityBlocksParent(value.current.activities))return false;
    stopLoop();value.current={...value.current,frame:toFrame,stopFrame,milliseconds:frameToElapsedMs(toFrame,movie),sourceControlled:true,
      activities:sourceActivitiesAtParentFrame(value.current.activities.filter(activity=>activity.sourceInstanceId),toFrame)};restart();return true;
  },[signature,movie,frameCount,stopLoop,restart]);
  const beginSourceActivities=useCallback((definitions:readonly LessonTextActivityDefinition[],parentFrame?:number,pressToken?:string)=>{
    if(value.current.signature!==signature||!definitions.length)return false;
    stopLoop();
    // Reduced motion initially presents an explicit source hold while the
    // automatic parent clock remains dormant at 1. Adopt that same hold before
    // checking placed-child lifetimes; this does not advance a hidden timeline.
    let candidate=value.current;
    if(parentFrame!==undefined&&parentFrame!==candidate.frame){
      if(running||value.current.sourceControlled||!movie||!definitions.every(definition=>definition.parentFrames.includes(parentFrame))){restart();return false;}
      candidate={...candidate,frame:parentFrame,milliseconds:frameToElapsedMs(parentFrame,movie),sourceControlled:true};
    }
    const revision=value.current.revision+1;
    const prepared=beginSourceClockActivities(candidate.activities,definitions,revision);
    const activities=prepared?.map(activity=>activity.revision>=revision?{...activity,
      cancellationToken:JSON.stringify([signature,candidate.seekRevision,activity.revision]),
      ...(pressToken?{pressToken}:{}),
    }:activity);
    if(!activities){restart();return false;}
    value.current={...candidate,activities,revision:revision+definitions.length-1};restart();return true;
  },[signature,stopLoop,restart,running,movie]);
  const beginSourceActivity=useCallback((definition:LessonTextActivityDefinition,parentFrame?:number)=>beginSourceActivities([definition],parentFrame),[beginSourceActivities]);
  const beginSourceButtonActivity=useCallback((definition:LessonTextActivityDefinition,parentFrame:number,token:string)=>{
    if(!definition.buttonPress)return false;
    return beginSourceActivities([definition],parentFrame,token);
  },[beginSourceActivities]);
  const releaseSourceButton=useCallback((id:string,token:string)=>{
    if(value.current.signature!==signature)return false;
    stopLoop();const activities=releaseSourceButtonActivity(value.current.activities,id,token);
    if(!activities){restart();return false;}
    value.current={...value.current,activities};restart();return true;
  },[signature,stopLoop,restart]);
  const current=snapshot.signature===signature?snapshot:fresh();
  const cancelSourceActivity=useCallback((request:LessonTextActivityCancellation)=>{
    if(value.current.signature!==signature)return false;
    stopLoop();
    const activities=request.parentFrame===value.current.frame?cancelSourceClockActivity(value.current.activities,request):undefined;
    if(!activities){restart();return false;}
    value.current={...value.current,activities};restart();return true;
  },[signature,stopLoop,restart]);
  // Read after pauseNow(): its final elapsed-time flush can advance beyond the
  // rendered snapshot. Callers must never invent cancellation tokens.
  const readCurrent=useCallback(()=>value.current.signature===signature ? {
    frame:value.current.frame, seekRevision:value.current.seekRevision,
    sourceControlled:value.current.sourceControlled,
    activities:value.current.activities.map(({definition:_definition,milliseconds:_milliseconds,...activity})=>activity),
  } : null,[signature]);
  const lessonActivities=current.activities.map(({definition:_definition,milliseconds:_milliseconds,...activity})=>activity);
  return {frame:current.frame,pauseNow:stopLoop,readCurrent,restartNow:restart,seekRevision:current.seekRevision,seekToFrame,continueSourceFrame,
    sourceFrame:current.sourceControlled?current.frame:undefined,sourceStopFrame:current.stopFrame,beginSourceActivity,beginSourceActivities,beginSourceButtonActivity,releaseSourceButton,cancelSourceActivity,
    lessonActivity:lessonActivities.at(-1),lessonActivities};
}
