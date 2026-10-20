import type {AnimationModule} from './contract';
import {animationRegistryGroupForKey} from './animation-registry-group';
import {animationModuleLoaderGroups} from './registry.generated';
import {withSourceLessonAudio} from './source-lesson-audio';
import {loadSourceLessonData} from './source-lesson-data';

export type {
  AnimationModuleLoader,
  AnimationModuleRegistration,
  AnimationModuleRegistrationScope,
  AnimationRegistryScope,
} from './registry-metadata.generated';
export type {AnimationModule, AnimationRendererProps} from './contract';

/**
 * Loads only the key's lesson loader table, then the module and its lesson data.
 * Unknown keys resolve to undefined; a failed chunk load rejects.
 */
export async function loadAnimationModule(key: string): Promise<AnimationModule | undefined> {
  const group = animationRegistryGroupForKey(key);
  const loadGroup = animationModuleLoaderGroups[group];
  if (!loadGroup) return undefined;
  const loaders = await loadGroup();
  if (loaders.animationRegistryGroup !== group) {
    throw new Error(`Animation registry group ${loaders.animationRegistryGroup} loaded for ${key}`);
  }
  const loader = loaders.animationModuleLoaders[key];
  if (!loader) return undefined;
  const [module, lessonData] = await Promise.all([loader(), loadSourceLessonData(key)]);
  return withSourceLessonAudio(module, lessonData);
}
