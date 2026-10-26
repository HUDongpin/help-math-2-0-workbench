import type {
  AnimationModule,
  AnimationModuleRegistration,
} from '@helpmath/demos/animation-registry';

export const registeredLocalOnlyAnimationKeys = Object.freeze([]) as readonly string[];

export function localOnlyAnimationModuleRegistration(
  _key: string,
): AnimationModuleRegistration | undefined {
  return undefined;
}

export function hasLocalOnlyAnimationModule(_key: string): boolean {
  return false;
}

export async function loadLocalOnlyAnimationModule(
  _key: string,
): Promise<AnimationModule | undefined> {
  return undefined;
}
