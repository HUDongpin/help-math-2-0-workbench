'use client';
import {useCallback, useEffect, useRef, useState} from 'react';
import type {LessonTextActivityDefinition, LessonTextActivitySnapshot} from './lesson-text-contract';
import {createSourceAudioMedia} from './source-pcm-audio';
import {LessonActivityAudioGroupController, type LessonActivityAudioState} from './lesson-activity-audio';

export function useLessonActivityAudio(options: {
  readonly identity: string;
  readonly definitions?: readonly LessonTextActivityDefinition[];
  readonly activity?: LessonTextActivitySnapshot;
  readonly activities?: readonly LessonTextActivitySnapshot[];
  readonly enabled: boolean;
  readonly paused: boolean;
  readonly language: 'en' | 'es';
  readonly volume: number;
}) {
  const [state,setState]=useState<LessonActivityAudioState>({status:'idle',activityId:null});
  const controller=useRef<LessonActivityAudioGroupController | null>(null);
  if(!controller.current)controller.current=new LessonActivityAudioGroupController(createSourceAudioMedia,setState);
  const activitiesIdentity=JSON.stringify(options.activities);
  useEffect(()=>{
    controller.current!.update({...options,definitions:options.definitions??[]});
  },[options.identity,options.definitions,options.activity?.id,options.activity?.revision,
    options.activity?.frame,options.activity?.status,activitiesIdentity,options.enabled,options.paused,options.language,options.volume]);
  useEffect(()=>()=>controller.current?.dispose(),[]);
  const stop=useCallback(()=>controller.current?.stop(),[]);
  const retry=useCallback(()=>controller.current?.retry()??false,[]);
  const cancelObservedInstances=useCallback((instances:readonly string[])=>controller.current?.cancelObservedInstances(instances)??0,[]);
  return {state,stop,retry,cancelObservedInstances};
}
