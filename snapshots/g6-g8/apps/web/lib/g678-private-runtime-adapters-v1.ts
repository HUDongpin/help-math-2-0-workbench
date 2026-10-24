import type {PrivateLessonRuntimeAdapter} from './lesson-runtime-adapter';
/** Exact page identity dispatch. Duplicate bindings are rejected before mounting. */
export function selectG678PrivateRuntimeAdapter(
  animationId: string,
  single?: PrivateLessonRuntimeAdapter,
  multiple: readonly PrivateLessonRuntimeAdapter[] = [],
): PrivateLessonRuntimeAdapter | undefined {
  const adapters = single ? [single, ...multiple] : multiple;
  const ids = new Set<string>();
  for (const adapter of adapters) {
    if (!adapter.animationId || ids.has(adapter.animationId)) throw new Error('duplicate-or-empty-private-runtime-binding');
    ids.add(adapter.animationId);
  }
  return adapters.find(adapter => adapter.animationId === animationId);
}


/** This allows review rendering only; descriptor and registration counts stay unchanged. */
export function resolveUnregisteredPrivateRuntimeCandidate(
  adapter: PrivateLessonRuntimeAdapter | undefined,
  context: Readonly<{
    animationId: string;
    rendererKind: 'registered' | 'unavailable';
    sourceAssetId?: string;
    nodeEnv: string | undefined;
    candidateMode: boolean;
    reviewerMode: boolean;
    releasePublished: boolean;
  }>,
) {
  const binding = adapter?.candidateBinding;
  if (!adapter || !binding || context.nodeEnv !== 'development' || !context.candidateMode || !context.reviewerMode ||
      context.releasePublished || context.rendererKind !== 'unavailable' || adapter.animationId !== context.animationId ||
      !/^shared-(?:nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/u.test(context.animationId) ||
      binding.kind !== 'source-bound-unregistered-candidate-v1' || binding.moduleKey !== context.animationId ||
      !/^[a-f0-9]{64}$/u.test(binding.sourceSha256) || context.sourceAssetId !== `swf-${binding.sourceSha256}`) return undefined;
  const query = binding.runtimeQuery;
  if (!query || !/^(root|sprite-[1-9]\d*)$/u.test(query.frameDomain) ||
      !['route-locale', 'fixed-en'].includes(query.language) || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(query.scenario) ||
      !/^(0|[1-9]\d*)$/u.test(query.seed) || !Number.isSafeInteger(Number(query.seed)) || Number(query.seed) > 0xffffffff) return undefined;
  return Object.freeze({animationId: context.animationId, sourceSha256: binding.sourceSha256,
    moduleKey: binding.moduleKey, runtimeQuery: Object.freeze({frameDomain: query.frameDomain,
      language: query.language, scenario: query.scenario, seed: query.seed})});
}
