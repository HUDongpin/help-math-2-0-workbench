import type {AnimationModule} from './contract';
import {
  animationModuleLoaders,
  animationModuleRegistrations,
} from './registry.generated';

export type {
  AnimationModuleLoader,
  AnimationModuleRegistration,
  AnimationRegistryScope,
} from './registry.generated';
export type {AnimationModule, AnimationRendererProps} from './contract';

export const registeredAnimationKeys = Object.freeze(Object.keys(animationModuleLoaders));
export const privateRegisteredAnimationKeys = Object.freeze(
  registeredAnimationKeys.filter(
    (key) => animationModuleRegistrations[key]?.scope === 'private-engineering',
  ),
);

export function animationModuleRegistration(key: string) {
  return animationModuleRegistrations[key];
}

export function hasAnimationModule(key: string): boolean {
  return Object.hasOwn(animationModuleLoaders, key);
}

export async function loadAnimationModule(key: string): Promise<AnimationModule | undefined> {
  return animationModuleLoaders[key]?.();
}
