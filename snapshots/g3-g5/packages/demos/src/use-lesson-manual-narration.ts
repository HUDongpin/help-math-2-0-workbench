'use client';
import {useCallback, useEffect, useRef, useState} from 'react';
import {LessonManualNarrationController, type BoundedNarrationPlan, type ManualNarrationStatus} from './lesson-manual-narration';

export function useLessonManualNarration(options: {identity: string; plan: BoundedNarrationPlan | null; paused: boolean; volume: number}) {
  const [status, setStatus] = useState<ManualNarrationStatus>('idle');
  const controller = useRef<LessonManualNarrationController | null>(null);
  if (!controller.current) controller.current = new LessonManualNarrationController(setStatus);
  const planIdentity = JSON.stringify(options.plan);
  useEffect(() => controller.current!.update(options), [options.identity, planIdentity, options.paused, options.volume]);
  useEffect(() => () => controller.current?.dispose(), []);
  const play = useCallback(() => controller.current!.play(), []);
  const stop = useCallback(() => controller.current!.stop(), []);
  return {status, play, stop};
}
