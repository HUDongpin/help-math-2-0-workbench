import type {AnimationModule} from './contract';
import {animationModuleLoaders} from './registry.generated';
import {withSourceLessonAudio} from './source-lesson-audio';
import {loadSourceLessonData} from './source-lesson-data';

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

export async function loadAnimationModule(key: string): Promise<AnimationModule | undefined> {
  const loader = animationModuleLoaders[key];
  if (!loader) return undefined;
  const [module, lessonData] = await Promise.all([loader(), loadSourceLessonData(key)]);
  return withSourceLessonAudio(module, lessonData);
}
