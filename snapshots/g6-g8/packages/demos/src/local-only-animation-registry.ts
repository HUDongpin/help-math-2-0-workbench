import type {AnimationModule} from './contract';
import {
  localOnlyAnimationModuleLoaders,
  localOnlyAnimationModuleRegistrations,
} from './registry.local-only.generated';

export type {
  AnimationModuleDeploymentScope,
  AnimationModuleLoader,
  AnimationModuleRegistration,
  AnimationModuleRegistrationScope,
  AnimationRegistryScope,
} from './registry.generated';
export type {AnimationModule, AnimationRendererProps} from './contract';

export const registeredLocalOnlyAnimationKeys = Object.freeze(
  Object.keys(localOnlyAnimationModuleLoaders),
);

export function localOnlyAnimationModuleRegistration(key: string) {
  return localOnlyAnimationModuleRegistrations[key];
}

export function hasLocalOnlyAnimationModule(key: string): boolean {
  return Object.hasOwn(localOnlyAnimationModuleLoaders, key);
}

export async function loadLocalOnlyAnimationModule(
  key: string,
): Promise<AnimationModule | undefined> {
  return localOnlyAnimationModuleLoaders[key]?.();
}
