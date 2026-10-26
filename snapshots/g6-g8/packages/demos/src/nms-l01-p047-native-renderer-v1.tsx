'use client';
import React from 'react';
import type {AnimationRendererProps} from './contract';
import {P047QuizPlayer} from './nms-l01-p047-quiz-player-v1';
import {readP047AudioAsset} from './nms-l01-p047-audio-loader-v1';

export const P047_QUIZ_STOP = Object.freeze({id: 'p047-final-quiz', frameDomain: 'sprite-1024', stopFrame: 1,
  resumeFrame: 2, resolution: 'explicit-source-control-finished' as const, completionDisposition: 'blocked-while-unresolved' as const,
  rendererStateOnResume: 'preserve' as const, requiresHostInteractiveStop: true as const, strictAcceptanceEffect: 'none' as const});

/** Generic modern-host view uses the same session/player as the exact My Lesson
 * adapter. The quiz's state, rather than elapsed frames, owns its question. */
export function P047NativeRenderer(props: AnimationRendererProps) {
  // The generic renderer contract has no host volume input. Source audio is
  // available only through the registered private quiz adapter, which receives
  // the complete transport contract. Reject a mistaken audio-enabled fallback.
  if (props.audioEnabled === true) return <p role="alert">The quiz is unavailable in this view.</p>;
  return <P047QuizPlayer key={`${props.seed}:${props.replay ?? 0}`} seed={props.seed}
    uiLanguage={props.uiLanguage ?? props.lang} paused={props.paused} audioEnabled={false}
    readAudio={readP047AudioAsset} onReplay={props.onReplay}
    onComplete={() => props.onInteractiveStopResolved?.({stopId: P047_QUIZ_STOP.id,
      frameDomain: P047_QUIZ_STOP.frameDomain, resolution: P047_QUIZ_STOP.resolution, source: 'maintained-source-derived-interaction'})}/>
}
