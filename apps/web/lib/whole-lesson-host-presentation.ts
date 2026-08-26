/**
 * Host presentation selection for the whole-lesson player.
 *
 * `legacy-composite` draws the source shell chrome over the authored plane:
 * the header band, the footer band, and the source hit areas layered on the
 * artwork. `modern-wide` draws only the authored content band between those
 * two chrome bands, at that band's own aspect ratio, and renders no chrome.
 *
 * Cropping is lossless by construction. The chrome asset is fully opaque
 * across both bands, so nothing the page renderer draws underneath them is
 * visible in the legacy presentation either.
 *
 * This module changes host presentation only. It creates no Flash fidelity,
 * audio, human visual, original-runtime, Owner, strict-completion, release, or
 * publication acceptance, and it expands none of those gates. The authored
 * stage, frame domains, and every `data-flash-*` identity are untouched.
 */

export type WholeLessonHostPresentation = 'legacy-composite' | 'modern-wide';

export const DEFAULT_WHOLE_LESSON_HOST_PRESENTATION: WholeLessonHostPresentation =
  'legacy-composite';

export type WholeLessonHostPresentationEnvironment =
  Readonly<Record<string, string | undefined>>;

/**
 * The authored content band, derived from evidence the descriptor already
 * carries. Nothing here is a second copy of a measurement: the band is
 * whatever the authored stage leaves once the declared chrome bands are
 * removed, so a corrected header height corrects the plane automatically.
 */
export interface WholeLessonContentPlane {
  /** Authored width of the band, in stage units. */
  readonly width: number;
  /** Authored height of the band, in stage units. */
  readonly height: number;
  /** Authored offset of the band's top edge from the stage top. */
  readonly top: number;
  /**
   * Height of the full authored stage expressed as a percentage of the band,
   * for positioning the page renderer inside a band-shaped window.
   */
  readonly stageHeightPercent: number;
  /** Offset of the stage top relative to the band, as a percentage of it. */
  readonly stageTopPercent: number;
}

function positiveFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }
  return value;
}

function nonNegativeFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }
  return value;
}

export function wholeLessonContentPlane({
  stage,
  headerHeight,
  footerHeight,
}: {
  stage: Readonly<{width: number; height: number}>;
  headerHeight: number;
  footerHeight: number;
}): WholeLessonContentPlane {
  const width = positiveFinite(stage.width, 'stage.width');
  const stageHeight = positiveFinite(stage.height, 'stage.height');
  const top = nonNegativeFinite(headerHeight, 'headerHeight');
  const footer = nonNegativeFinite(footerHeight, 'footerHeight');

  const height = stageHeight - top - footer;
  if (height <= 0) {
    throw new Error(
      'chrome bands consume the whole authored stage; no content band remains',
    );
  }

  return Object.freeze({
    width,
    height,
    top,
    stageHeightPercent: (stageHeight / height) * 100,
    stageTopPercent: (-top / height) * 100,
  });
}

/**
 * True only when the deployment explicitly opts in. The widescreen shell is a
 * declared, non-default presentation; absent the flag every lesson keeps the
 * legacy composite exactly as before.
 */
export function isModernWideShellEnabled(
  env: WholeLessonHostPresentationEnvironment = process.env,
) {
  return env.MODERN_WIDE_SHELL_ENABLED === 'true';
}

/**
 * A lesson may only render a presentation it declares. An undeclared
 * presentation falls back to the legacy composite rather than guessing, so a
 * descriptor that has not been reviewed for widescreen cannot be switched on
 * by an environment variable alone.
 */
export function resolveWholeLessonHostPresentation({
  declared,
  enabled,
}: {
  declared: readonly WholeLessonHostPresentation[] | undefined;
  enabled: boolean;
}): WholeLessonHostPresentation {
  if (!enabled) return DEFAULT_WHOLE_LESSON_HOST_PRESENTATION;
  if (!declared || !declared.includes('modern-wide')) {
    return DEFAULT_WHOLE_LESSON_HOST_PRESENTATION;
  }
  return 'modern-wide';
}
