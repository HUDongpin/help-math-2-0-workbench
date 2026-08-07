export type WholeLessonSessionLocale = 'en' | 'es';

export interface WholeLessonSessionDescriptor {
  readonly releaseId: string;
  readonly pages: readonly Readonly<{
    animationId: string;
  }>[];
}

export interface WholeLessonSessionProgress {
  readonly schemaVersion: 1;
  readonly releaseId: string;
  readonly currentAnimationId: string;
  readonly locale: WholeLessonSessionLocale;
  readonly visitedAnimationIds: readonly string[];
  readonly reviewedAnimationIds: readonly string[];
  readonly replayCounts: Readonly<Record<string, number>>;
}

/**
 * Converts a legacy learner-state value into the generic session shape.
 *
 * The adapter is deliberately supplied by the course integration: this module
 * does not know legacy course field names. Its result still has to carry the
 * exact descriptor releaseId and is normalized through the descriptor page
 * allowlist before it can become session state.
 */
export type WholeLessonLegacyProgressAdapter = (value: unknown) => unknown;

interface DescriptorPolicy {
  readonly releaseId: string;
  readonly animationIds: readonly string[];
  readonly animationIdSet: ReadonlySet<string>;
}

const STORAGE_KEY_PREFIX = 'helpmath:whole-lesson-session';
const STORAGE_SCHEMA_VERSION = 1;

function descriptorPolicy(
  descriptor: WholeLessonSessionDescriptor,
): DescriptorPolicy {
  const releaseId = descriptor?.releaseId;
  const pages = descriptor?.pages;
  if (typeof releaseId !== 'string' ||
    releaseId.length === 0 ||
    releaseId.trim() !== releaseId ||
    !Array.isArray(pages) ||
    pages.length === 0) {
    throw new TypeError('Invalid whole-lesson session descriptor');
  }

  const animationIds = pages.map((page) => page?.animationId);
  if (animationIds.some((animationId) =>
    typeof animationId !== 'string' ||
    animationId.length === 0 ||
    animationId.trim() !== animationId
  ) || new Set(animationIds).size !== animationIds.length) {
    throw new TypeError('Invalid whole-lesson session descriptor page allowlist');
  }

  return {
    releaseId,
    animationIds,
    animationIdSet: new Set(animationIds),
  };
}

function assertLocale(
  locale: WholeLessonSessionLocale,
): WholeLessonSessionLocale {
  if (locale !== 'en' && locale !== 'es') {
    throw new TypeError('Invalid whole-lesson session locale');
  }
  return locale;
}

function orderedAnimationIds(
  value: unknown,
  policy: DescriptorPolicy,
): string[] {
  if (!Array.isArray(value)) return [];
  const present = new Set(value.filter(
    (candidate): candidate is string =>
      typeof candidate === 'string' &&
      policy.animationIdSet.has(candidate),
  ));
  return policy.animationIds.filter((animationId) => present.has(animationId));
}

function replayCounts(
  value: unknown,
  policy: DescriptorPolicy,
): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(policy.animationIds.flatMap((animationId) => {
    const count = (value as Record<string, unknown>)[animationId];
    return Number.isSafeInteger(count) && Number(count) >= 0
      ? [[animationId, Number(count)]]
      : [];
  }));
}

function initialProgress(
  policy: DescriptorPolicy,
  locale: WholeLessonSessionLocale,
): WholeLessonSessionProgress {
  const currentAnimationId = policy.animationIds[0]!;
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    releaseId: policy.releaseId,
    currentAnimationId,
    locale,
    visitedAnimationIds: [currentAnimationId],
    reviewedAnimationIds: [],
    replayCounts: {},
  };
}

function normalizedCandidate(
  value: unknown,
  policy: DescriptorPolicy,
  locale: WholeLessonSessionLocale,
): WholeLessonSessionProgress {
  const initial = initialProgress(policy, locale);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return initial;

  const candidate = value as Record<string, unknown>;
  if (candidate.schemaVersion !== STORAGE_SCHEMA_VERSION ||
    candidate.releaseId !== policy.releaseId) {
    return initial;
  }

  const currentAnimationId = typeof candidate.currentAnimationId === 'string' &&
    policy.animationIdSet.has(candidate.currentAnimationId)
    ? candidate.currentAnimationId
    : initial.currentAnimationId;
  const visited = orderedAnimationIds(candidate.visitedAnimationIds, policy);

  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    releaseId: policy.releaseId,
    currentAnimationId,
    // The route locale is the document-language authority. Persisted state
    // restores learner placement only and cannot override this parameter.
    locale,
    visitedAnimationIds: orderedAnimationIds(
      [...visited, currentAnimationId],
      policy,
    ),
    reviewedAnimationIds: orderedAnimationIds(
      candidate.reviewedAnimationIds,
      policy,
    ),
    replayCounts: replayCounts(candidate.replayCounts, policy),
  };
}

function parsedJson(serialized: string | null): unknown {
  if (!serialized) return undefined;
  try {
    return JSON.parse(serialized) as unknown;
  } catch {
    return undefined;
  }
}

function progressForMutation(
  progress: WholeLessonSessionProgress,
  policy: DescriptorPolicy,
): WholeLessonSessionProgress {
  return normalizedCandidate(progress, policy, assertLocale(progress.locale));
}

function progressBelongsToRelease(
  progress: WholeLessonSessionProgress,
  policy: DescriptorPolicy,
): boolean {
  return progress.schemaVersion === STORAGE_SCHEMA_VERSION &&
    progress.releaseId === policy.releaseId;
}

export function wholeLessonSessionStorageKey(
  descriptor: WholeLessonSessionDescriptor,
): string {
  const {releaseId} = descriptorPolicy(descriptor);
  return `${STORAGE_KEY_PREFIX}:${encodeURIComponent(releaseId)}:v${STORAGE_SCHEMA_VERSION}`;
}

export function createInitialWholeLessonSessionProgress(
  descriptor: WholeLessonSessionDescriptor,
  locale: WholeLessonSessionLocale,
): WholeLessonSessionProgress {
  return initialProgress(descriptorPolicy(descriptor), assertLocale(locale));
}

export function parseWholeLessonSessionProgress(
  serialized: string | null,
  descriptor: WholeLessonSessionDescriptor,
  locale: WholeLessonSessionLocale,
): WholeLessonSessionProgress {
  return normalizedCandidate(
    parsedJson(serialized),
    descriptorPolicy(descriptor),
    assertLocale(locale),
  );
}

export function parseLegacyWholeLessonSessionProgress(
  serialized: string | null,
  descriptor: WholeLessonSessionDescriptor,
  locale: WholeLessonSessionLocale,
  adapter: WholeLessonLegacyProgressAdapter,
): WholeLessonSessionProgress {
  const policy = descriptorPolicy(descriptor);
  const routeLocale = assertLocale(locale);
  const parsed = parsedJson(serialized);
  if (parsed === undefined) return initialProgress(policy, routeLocale);

  try {
    return normalizedCandidate(adapter(parsed), policy, routeLocale);
  } catch {
    return initialProgress(policy, routeLocale);
  }
}

/**
 * Reports whether a normalized, release-bound session has a later page to
 * offer through a resume decision. Review/replay history alone does not open
 * the prompt when the learner already stopped on the first page.
 */
export function wholeLessonHasResumablePlacement(
  progress: WholeLessonSessionProgress,
  descriptor: WholeLessonSessionDescriptor,
): boolean {
  const policy = descriptorPolicy(descriptor);
  if (!progressBelongsToRelease(progress, policy)) return false;
  const current = progressForMutation(progress, policy);
  return current.currentAnimationId !== policy.animationIds[0];
}

/**
 * Implements the legacy prompt's "start at the beginning" navigation
 * semantics without erasing modern local review/replay history. Clearing all
 * locally stored progress remains a separate, explicit restart action.
 */
export function startWholeLessonAtBeginning(
  progress: WholeLessonSessionProgress,
  descriptor: WholeLessonSessionDescriptor,
): WholeLessonSessionProgress {
  const policy = descriptorPolicy(descriptor);
  const current = progressForMutation(progress, policy);
  if (!progressBelongsToRelease(progress, policy)) return current;
  const firstAnimationId = policy.animationIds[0]!;
  return {
    ...current,
    currentAnimationId: firstAnimationId,
    visitedAnimationIds: orderedAnimationIds(
      [...current.visitedAnimationIds, firstAnimationId],
      policy,
    ),
  };
}

export function visitWholeLessonPage(
  progress: WholeLessonSessionProgress,
  descriptor: WholeLessonSessionDescriptor,
  animationId: string,
): WholeLessonSessionProgress {
  const policy = descriptorPolicy(descriptor);
  const current = progressForMutation(progress, policy);
  if (!progressBelongsToRelease(progress, policy)) return current;
  if (!policy.animationIdSet.has(animationId)) return current;
  return {
    ...current,
    currentAnimationId: animationId,
    visitedAnimationIds: orderedAnimationIds(
      [...current.visitedAnimationIds, animationId],
      policy,
    ),
  };
}

export function reviewWholeLessonPage(
  progress: WholeLessonSessionProgress,
  descriptor: WholeLessonSessionDescriptor,
  animationId: string,
): WholeLessonSessionProgress {
  const policy = descriptorPolicy(descriptor);
  const current = progressForMutation(progress, policy);
  if (!progressBelongsToRelease(progress, policy)) return current;
  if (!policy.animationIdSet.has(animationId)) return current;
  return {
    ...current,
    reviewedAnimationIds: orderedAnimationIds(
      [...current.reviewedAnimationIds, animationId],
      policy,
    ),
  };
}

export function recordWholeLessonReplay(
  progress: WholeLessonSessionProgress,
  descriptor: WholeLessonSessionDescriptor,
  animationId: string,
): WholeLessonSessionProgress {
  const policy = descriptorPolicy(descriptor);
  const current = progressForMutation(progress, policy);
  if (!progressBelongsToRelease(progress, policy)) return current;
  if (!policy.animationIdSet.has(animationId)) return current;
  const previousCount = current.replayCounts[animationId] ?? 0;
  return {
    ...current,
    replayCounts: {
      ...current.replayCounts,
      [animationId]: previousCount < Number.MAX_SAFE_INTEGER
        ? previousCount + 1
        : previousCount,
    },
  };
}

export function setWholeLessonSessionLocale(
  progress: WholeLessonSessionProgress,
  descriptor: WholeLessonSessionDescriptor,
  locale: WholeLessonSessionLocale,
): WholeLessonSessionProgress {
  const policy = descriptorPolicy(descriptor);
  return {
    ...progressForMutation(progress, policy),
    locale: assertLocale(locale),
  };
}

export function wholeLessonReviewedPercent(
  progress: WholeLessonSessionProgress,
  descriptor: WholeLessonSessionDescriptor,
): number {
  const policy = descriptorPolicy(descriptor);
  const current = progressForMutation(progress, policy);
  return Math.round(
    (current.reviewedAnimationIds.length / policy.animationIds.length) * 100,
  );
}
