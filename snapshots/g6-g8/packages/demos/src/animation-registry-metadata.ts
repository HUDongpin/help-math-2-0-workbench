import {
  animationModuleRegistrations,
  registeredAnimationKeys,
} from './registry.metadata.generated';

export type {
  AnimationModuleDeploymentScope,
  AnimationModuleRegistration,
  AnimationRegistryScope,
} from './registry.metadata.generated';

export {registeredAnimationKeys};

export const privateRegisteredAnimationKeys = Object.freeze(
  registeredAnimationKeys.filter(
    (key) => animationModuleRegistrations[key]?.scope === 'private-engineering',
  ),
);

export const registeredPrivateCurrentJsAnimationKeys =
  privateRegisteredAnimationKeys;

export function animationModuleRegistration(key: string) {
  return animationModuleRegistrations[key];
}

export function hasAnimationModule(key: string): boolean {
  return Object.hasOwn(animationModuleRegistrations, key);
}
