import type {AnimationModule} from '@helpmath/demos/animation-registry';

const G678_LOCAL_ONLY_ANIMATION_ID =
  /^shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/u;

export function isG678LocalOnlyAnimationId(key: string): boolean {
  return G678_LOCAL_ONLY_ANIMATION_ID.test(key);
}

export async function loadClientAnimationModule(
  key: string,
): Promise<AnimationModule | undefined> {
  if (isG678LocalOnlyAnimationId(key)) {
    if (process.env.NODE_ENV === 'production' && process.env.HELP_MATH_G678_COMPILED_LOCAL_QA !== '1') return undefined;
    const registry = await import(
      '@helpmath/demos/local-only-animation-registry'
    );
    return registry.loadLocalOnlyAnimationModule(key);
  }
  const registry = await import('@helpmath/demos/animation-registry');
  return registry.loadAnimationModule(key);
}
