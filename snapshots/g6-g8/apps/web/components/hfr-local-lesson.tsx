'use client';
import {useEffect, useState} from 'react';
import type {AnimationModule} from '@helpmath/demos/animation-registry';
import {prepareG678LessonTypography} from '@/lib/g678-lesson-typography-presentation';
import type {PageOnlyLessonPlayerDescriptor} from '@/lib/whole-lesson-player-descriptor';
import type {LessonRuntimeAdapterProps, PrivateLessonRuntimeAdapter} from '@/lib/lesson-runtime-adapter';
import {DescriptorDrivenWholeLessonPlayerHfrCoreV1 as DescriptorDrivenWholeLessonPlayer} from './descriptor-driven-whole-lesson-player-hfr-core-v1.generated';
import {loadHfrLocalAnimationModule} from '@/lib/hfr-local-animation-loader-v1.generated';
import {HFR_LOCAL_CANDIDATE_SOURCES as CANDIDATE_SOURCES, loadHfrLocalCandidate as loadCandidate} from '@/lib/hfr-local-candidates-v2.generated';
import {RendererClockedRuntime} from './renderer-clocked-runtime';

function CandidateRuntime(props: LessonRuntimeAdapterProps) {
  const [module, setModule] = useState<AnimationModule | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setModule(null);
    setFailed(false);
    if (process.env.NODE_ENV !== 'development' || !Object.hasOwn(CANDIDATE_SOURCES, props.animationId) || props.moduleKey !== props.animationId) {
      setFailed(true); return;
    }
    loadCandidate(props.animationId)
      .then(value => prepareG678LessonTypography(value?.default, false))
      .then(value => {if (!value) throw new Error('HFR source module unavailable'); if (!cancelled) setModule(value);})
      .catch(() => {if (!cancelled) setFailed(true);});
    return () => {cancelled = true;};
  }, [props.animationId, props.moduleKey]);
  if (failed) return <p className="runtime-unavailable">{props.labels.unavailable}</p>;
  if (!module || module.key !== props.moduleKey) return <p aria-live="polite">{props.labels.loading}</p>;
  return <RendererClockedRuntime {...props} animationModule={module} onLessonFinished={props.onSourceExit}/>;
}
const candidates: Readonly<Record<string, PrivateLessonRuntimeAdapter>> = Object.freeze(Object.fromEntries(
  Object.entries(CANDIDATE_SOURCES).map(([animationId, sourceSha256]) => [animationId, Object.freeze({
    animationId, audioEnabled: true,
    candidateBinding: Object.freeze({kind: 'source-bound-unregistered-candidate-v1' as const, moduleKey: animationId, sourceSha256,
      runtimeQuery: Object.freeze({frameDomain: 'root', language: 'fixed-en' as const, scenario: 'hfr', seed: '0'})}),
    Component: CandidateRuntime,
  })]),
));

export function HfrLocalLesson({descriptor, animationId, locale, mode, audioEnabled = true}: {
  descriptor: PageOnlyLessonPlayerDescriptor; animationId: string; locale: 'en' | 'es'; mode: 'candidate' | 'registered';
  audioEnabled?: boolean;
}) {
  return <DescriptorDrivenWholeLessonPlayer loadAnimationModule={loadHfrLocalAnimationModule} descriptor={descriptor} initialPlacementId={animationId} locale={locale}
    privateRuntimeAdapter={mode === 'candidate' && Object.hasOwn(candidates, animationId) ? candidates[animationId] : undefined}
    audioEnabled={audioEnabled} candidateMode reviewerMode hostPresentation="modern-wide" releasePublished={false}
    strictCompleteMemberCount={0}/>;
}
