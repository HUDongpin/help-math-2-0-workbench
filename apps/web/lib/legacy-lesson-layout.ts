export const LEGACY_LESSON_LAYOUT_CONTRACT =
  'native-stage-with-adaptive-functional-rails-v1';

export const LEGACY_WIDE_FUNCTIONAL_MIN_WIDTH = 1280;
export const LEGACY_MAP_RAIL_MIN_WIDTH = 1600;
export const LEGACY_TOOL_RAIL_MIN_WIDTH = 1800;
export const LEGACY_NATIVE_STAGE_MIN_CONTAINER_WIDTH = 848;
export const LEGACY_COMPACT_HEIGHT_MAX = 880;
export const LEGACY_COMPACT_LANDSCAPE_MAX_WIDTH = 1279;

export type LegacyLessonLayoutMode =
  | 'legacy-native'
  | 'wide-functional'
  | 'compact';

export type LegacyLessonPanelPresentation = 'overlay' | 'rail';
export type LegacyLessonWorkspaceDensity = 'comfortable' | 'compact-height';

export interface LegacyLessonLayoutPolicy {
  readonly compactLandscape: boolean;
  readonly containerWidth: number;
  readonly layoutMode: LegacyLessonLayoutMode;
  readonly mapPresentation: LegacyLessonPanelPresentation;
  readonly stageCapWidth: number;
  readonly toolPresentation: LegacyLessonPanelPresentation;
  readonly workspaceDensity: LegacyLessonWorkspaceDensity;
}

function positiveFinite(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive finite number`);
  }
  return value;
}

/**
 * Keeps the authored Flash plane independent from the modern workspace.
 *
 * Wide and ordinary native layouts never use remaining viewport height to
 * shrink the authored stage. A short page may scroll, but its 800 x 600
 * source coordinate system remains pixel-sized. Only the deliberately compact
 * landscape layout reserves a second column for accessible controls and caps
 * the stage by both remaining width and height. Narrow portrait layouts rely
 * on the CSS aspect-ratio wrapper to scale proportionally to their container.
 */
export function resolveLegacyLessonLayout({
  authoredStage,
  containerWidth,
  stageTop,
  viewportHeight,
  viewportWidth,
}: {
  authoredStage: Readonly<{height: number; width: number}>;
  containerWidth: number;
  stageTop: number;
  viewportHeight: number;
  viewportWidth: number;
}): LegacyLessonLayoutPolicy {
  const authoredWidth = positiveFinite(
    authoredStage.width,
    'authoredStage.width',
  );
  const authoredHeight = positiveFinite(
    authoredStage.height,
    'authoredStage.height',
  );
  const measuredContainerWidth = positiveFinite(
    containerWidth,
    'containerWidth',
  );
  const measuredViewportWidth = positiveFinite(
    viewportWidth,
    'viewportWidth',
  );
  const measuredViewportHeight = positiveFinite(
    viewportHeight,
    'viewportHeight',
  );
  if (!Number.isFinite(stageTop)) {
    throw new Error('stageTop must be finite');
  }

  const compactLandscape =
    measuredViewportWidth > measuredViewportHeight &&
    measuredViewportWidth >= 681 &&
    measuredViewportWidth <= LEGACY_COMPACT_LANDSCAPE_MAX_WIDTH &&
    measuredViewportHeight <= 500;

  let stageCapWidth = authoredWidth;
  if (compactLandscape) {
    const availableHeight = Math.max(
      210,
      measuredViewportHeight - Math.max(0, stageTop) - 16,
    );
    const reservedControlWidth = Math.min(
      340,
      Math.max(280, Math.round(measuredContainerWidth * .36)),
    );
    const availableWidth = Math.max(
      280,
      measuredContainerWidth - reservedControlWidth - 20,
    );
    stageCapWidth = Math.min(
      authoredWidth,
      availableWidth,
      Math.max(
        280,
        Math.floor(availableHeight * (authoredWidth / authoredHeight)),
      ),
    );
  }

  const layoutMode: LegacyLessonLayoutMode =
    measuredViewportWidth >= LEGACY_WIDE_FUNCTIONAL_MIN_WIDTH
      ? 'wide-functional'
      : compactLandscape ||
          measuredContainerWidth < LEGACY_NATIVE_STAGE_MIN_CONTAINER_WIDTH
        ? 'compact'
        : 'legacy-native';

  return Object.freeze({
    compactLandscape,
    containerWidth: measuredContainerWidth,
    layoutMode,
    mapPresentation:
      measuredViewportWidth >= LEGACY_MAP_RAIL_MIN_WIDTH
        ? 'rail'
        : 'overlay',
    stageCapWidth,
    toolPresentation:
      measuredViewportWidth >= LEGACY_TOOL_RAIL_MIN_WIDTH
        ? 'rail'
        : 'overlay',
    workspaceDensity:
      layoutMode === 'wide-functional' &&
        measuredViewportHeight <= LEGACY_COMPACT_HEIGHT_MAX
        ? 'compact-height'
        : 'comfortable',
  });
}
