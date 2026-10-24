import {
  localOnlyAnimationModuleRegistrations,
  registeredLocalOnlyAnimationKeys,
} from './registry.local-only.metadata.generated';

export type {
  AnimationModuleDeploymentScope,
  AnimationModuleRegistration,
  AnimationRegistryScope,
} from './registry.generated';

export {registeredLocalOnlyAnimationKeys};

export function localOnlyAnimationModuleRegistration(key: string) {
  return localOnlyAnimationModuleRegistrations[key];
}

export function hasLocalOnlyAnimationModule(key: string): boolean {
  return Object.hasOwn(localOnlyAnimationModuleRegistrations, key);
}
