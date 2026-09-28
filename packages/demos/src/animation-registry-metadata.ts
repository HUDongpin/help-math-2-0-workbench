// Server-safe registry queries must not import the renderer loader graph.
import {animationModuleRegistrations} from './registry-metadata.generated';

export type {
  AnimationModuleRegistration,
  AnimationModuleRegistrationScope,
  AnimationRegistryScope,
} from './registry-metadata.generated';

export const registeredAnimationKeys = Object.freeze(
  Object.keys(animationModuleRegistrations),
);
export const privateRegisteredAnimationKeys = Object.freeze(
  registeredAnimationKeys.filter(
    (key) => animationModuleRegistrations[key]?.scope === 'private-engineering',
  ),
);
export const registeredPrivateCurrentJsAnimationKeys = privateRegisteredAnimationKeys;

export function animationModuleRegistration(key: string) {
  return animationModuleRegistrations[key];
}

export function hasAnimationModule(key: string): boolean {
  return Object.hasOwn(animationModuleRegistrations, key);
}
