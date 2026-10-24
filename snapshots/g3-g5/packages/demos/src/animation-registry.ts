import {validateTerminalTimelineAudio} from './terminal-timeline-audio';
import {LESSON_MANUAL_NARRATION_PCM} from './generated/lesson-manual-narration-pcm';
import type {AnimationModule} from './contract';
import {animationModuleLoaders} from './registry.generated';
import {loadLessonTextPresentation} from './lesson-text-registry';
import {validateLessonTextActivities, validateLessonTextFrameControl} from './lesson-text-frame-control';
import {validateLessonTextKeyTerms} from './lesson-text-keyterms';
import {validateLessonTextCompletion} from './lesson-text-completion';
import {isSameOriginAssetSource} from './runtime';

export type {
  AnimationModuleLoader,
  AnimationModuleRegistration,
  AnimationModuleRegistrationScope,
  AnimationRegistryScope,
} from './registry.generated';
export type {AnimationModule, AnimationRendererProps} from './contract';

export {
  animationModuleRegistration,
  hasAnimationModule,
  privateRegisteredAnimationKeys,
  registeredAnimationKeys,
  registeredPrivateCurrentJsAnimationKeys,
} from './animation-registry-metadata';

export async function loadAnimationModule(
  key: string,
): Promise<AnimationModule | undefined> {
  const animationModule = await animationModuleLoaders[key]?.();
  if (animationModule?.interactionCompletion) {
    const domain = animationModule.interactionCompletion.frameDomain;
    const count = domain === 'root' ? (animationModule.runtime ?? animationModule.movie).frameCount
      : animationModule.runtime?.frameDomains?.find(value => value.id === domain)?.frameCount;
    if (!count) throw new Error('Lesson interaction completion refers to an unknown source domain');
    validateLessonTextCompletion(animationModule.interactionCompletion, count);
  }
  return animationModule;
}

/** Presentation opt-in is separate so the longstanding one-argument loader
 * remains compatible with Array.map and other existing callbacks. */
export async function loadAnimationModuleForPresentation(
  key: string,
  options: Readonly<{modernText?: boolean; signal?: AbortSignal}> = {},
): Promise<AnimationModule | undefined> {
  const animationModule = await loadAnimationModule(key);
  if (!animationModule || options.modernText !== true) return animationModule;
  const textPresentation = await loadLessonTextPresentation(key);
  for (const [domainId, endFrame] of [
    ...Object.entries(textPresentation?.playbackEndFrameByDomain ?? {}),
    ...Object.entries(textPresentation?.reducedMotionFrameByDomain ?? {}),
  ]) {
    const runtime = animationModule.runtime ?? animationModule.movie;
    const frameCount = domainId === 'root' ? runtime.frameCount :
      animationModule.runtime?.frameDomains?.find(domain => domain.id === domainId)?.frameCount;
    if (!frameCount || !Number.isSafeInteger(endFrame) || endFrame < 1 || endFrame > frameCount) {
      throw new Error('Modern lesson text declares an invalid source playback or reduced-motion frame.');
    }
  }
  if (textPresentation?.frameControl) {
    const domain = textPresentation.frameControl.frameDomain;
    const frameCount = domain === 'root' ? (animationModule.runtime ?? animationModule.movie).frameCount
      : animationModule.runtime?.frameDomains?.find(value => value.id === domain)?.frameCount;
    if (!frameCount) throw new Error('Modern lesson frame control has no source timeline.');
    validateLessonTextFrameControl(textPresentation.frameControl, frameCount);
    if (textPresentation.activityTimelines) validateLessonTextActivities(textPresentation.activityTimelines, frameCount, (animationModule.runtime ?? animationModule.movie).fps);
  } else if (textPresentation?.activityTimelines?.length) {
    throw new Error('Modern lesson source activities require a declared parent timeline.');
  }
  if (textPresentation?.keyTerms) validateLessonTextKeyTerms(textPresentation.keyTerms);
  const audioIds=new Set<string>();
  for(const cue of textPresentation?.sourceTimelineAudioCues??[]){
    const count=cue.frameDomain==='root'?(animationModule.runtime??animationModule.movie).frameCount
      :animationModule.runtime?.frameDomains?.find(domain=>domain.id===cue.frameDomain)?.frameCount;
    if(!count||!cue.id||audioIds.has(cue.id)||!isSameOriginAssetSource(cue.source)||!/^[a-f0-9]{64}$/.test(cue.sha256)
      ||!['en','es','shared'].includes(cue.language)||!Number.isSafeInteger(cue.frame)||cue.frame<1||cue.frame>count
      ||!Number.isSafeInteger(cue.endFrame)||cue.endFrame!<=cue.frame||cue.endFrame!>count+1){
      throw new Error('Modern lesson main audio lacks exact source boundaries');
    }
    audioIds.add(cue.id);
  }
  if (textPresentation?.completion) {
    const domain=textPresentation.completion.frameDomain;
    const count=domain==='root' ? (animationModule.runtime??animationModule.movie).frameCount
      : animationModule.runtime?.frameDomains?.find(value=>value.id===domain)?.frameCount;
    if(!count)throw new Error('Modern lesson completion refers to an unknown source domain');
    validateLessonTextCompletion(textPresentation.completion,count);
  }
  if(textPresentation)validateTerminalTimelineAudio(animationModule,textPresentation,LESSON_MANUAL_NARRATION_PCM);
  if (options.signal?.aborted) throw options.signal.reason ?? new Error('Lesson preparation cancelled');
  if (textPresentation?.prepare) await textPresentation.prepare(options.signal);
  return textPresentation
    ? Object.freeze({...animationModule, textPresentation,
      ...(textPresentation.playbackMode ? {playbackMode:textPresentation.playbackMode} : {}),
      ...(textPresentation.playbackEndFrameByDomain ? {playbackEndFrameByDomain: Object.freeze({
        ...animationModule.playbackEndFrameByDomain, ...textPresentation.playbackEndFrameByDomain,
      })} : {}),
    })
    : animationModule;
}
