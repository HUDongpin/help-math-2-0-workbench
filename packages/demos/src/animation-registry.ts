import type {AnimationModule} from './contract';
import {animationModuleLoaders} from './registry.generated';
import {withSourceLessonAudio} from './source-lesson-audio';

export type {
  AnimationModuleLoader,
  AnimationModuleRegistration,
  AnimationModuleRegistrationScope,
  AnimationRegistryScope,
} from './registry.generated';
export type {AnimationModule, AnimationRendererProps, RendererPlaybackReport} from './contract';

export {
  animationModuleRegistration,
  hasAnimationModule,
  privateRegisteredAnimationKeys,
  registeredAnimationKeys,
  registeredPrivateCurrentJsAnimationKeys,
} from './animation-registry-metadata';

export async function loadAnimationModule(key: string): Promise<AnimationModule | undefined> {
  const module = await animationModuleLoaders[key]?.();
  return module ? withSourceLessonAudio(module) : undefined;
}
