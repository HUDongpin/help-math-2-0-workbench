const DEFAULT_RESTORE_VOLUME = .8;

function clampVolume(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export interface LegacyMuteTransition {
  readonly lastAudibleVolume: number;
  readonly volume: number;
}

/**
 * Reproduces the statically observed shell intent: mute remembers the current
 * audible level, while unmute restores that remembered non-zero level.
 *
 * This remains a current-JavaScript candidate. Static ActionScript establishes
 * the handlers, but not original-runtime reachability, audio timing, or
 * cross-page persistence.
 */
export function toggleLegacyMute({
  fallbackVolume = DEFAULT_RESTORE_VOLUME,
  lastAudibleVolume,
  volume,
}: {
  fallbackVolume?: number;
  lastAudibleVolume: number;
  volume: number;
}): LegacyMuteTransition {
  const normalizedVolume = clampVolume(volume);
  if (normalizedVolume > 0) {
    return Object.freeze({
      lastAudibleVolume: normalizedVolume,
      volume: 0,
    });
  }

  const remembered = clampVolume(lastAudibleVolume);
  const fallback = clampVolume(fallbackVolume);
  const restored = remembered > 0
    ? remembered
    : fallback > 0
      ? fallback
      : DEFAULT_RESTORE_VOLUME;
  return Object.freeze({
    lastAudibleVolume: restored,
    volume: restored,
  });
}

export function rememberLegacyAudibleVolume({
  lastAudibleVolume,
  volume,
}: {
  lastAudibleVolume: number;
  volume: number;
}) {
  const normalizedVolume = clampVolume(volume);
  return normalizedVolume > 0
    ? normalizedVolume
    : clampVolume(lastAudibleVolume) || DEFAULT_RESTORE_VOLUME;
}

/**
 * The legacy shell kept an ordered arrGoBack stack. Keep duplicates and visit
 * order here instead of reusing the de-duplicated learner progress list.
 */
export function appendLegacyLessonHistory(
  history: readonly string[],
  currentAnimationId: string,
  nextAnimationId: string,
) {
  return currentAnimationId === nextAnimationId
    ? [...history]
    : [...history, currentAnimationId];
}

export function takeLegacyLessonHistory(
  history: readonly string[],
): Readonly<{
  history: readonly string[];
  previousAnimationId: string | null;
}> {
  if (history.length === 0) {
    return Object.freeze({
      history: Object.freeze([]),
      previousAnimationId: null,
    });
  }
  return Object.freeze({
    history: Object.freeze(history.slice(0, -1)),
    previousAnimationId: history.at(-1) ?? null,
  });
}
