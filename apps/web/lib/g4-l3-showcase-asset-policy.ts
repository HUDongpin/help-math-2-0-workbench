import {
  currentJsShowcasePublication,
  G4_L3_SHOWCASE_RELEASE_ID,
  type CurrentJsShowcaseEnvironment,
} from './current-js-showcase-publication';

/**
 * The public showcase may serve runtime assets only from the 39 registered
 * G4 L3 page packages and its one lesson-shell package. Keeping the directory
 * names explicit prevents the showcase opt-in from publishing another grade,
 * lesson, draft package, or future unreviewed G4 L3 package by accident.
 */
export const G4_L3_SHOWCASE_ASSET_DIRECTORIES = Object.freeze([
  'course-g04-l03-ir-001-341242cc',
  'course-g04-l03-rw-002',
  'course-g04-l03-rw-003',
  'course-g04-l03-rw-004',
  'course-g04-l03-vb-002',
  'course-g04-l03-vb-003',
  'course-g04-l03-vb-004',
  'course-g04-l03-vb-005',
  'course-g04-l03-vb-006',
  'course-g04-l03-vb-007',
  'course-g04-l03-vb-008',
  'course-g04-l03-vb-009',
  'course-g04-l03-in-002',
  'course-g04-l03-in-003',
  'course-g04-l03-in-004',
  'course-g04-l03-in-005',
  'course-g04-l03-in-006',
  'course-g04-l03-in-007',
  'course-g04-l03-in-008',
  'course-g04-l03-in-009',
  'course-g04-l03-in-010',
  'course-g04-l03-in-011',
  'course-g04-l03-in-012',
  'course-g04-l03-ti-002',
  'course-g04-l03-ti-003',
  'course-g04-l03-ti-004',
  'course-g04-l03-ti-005',
  'course-g04-l03-ti-006',
  'course-g04-l03-gs-002',
  'course-g04-l03-ts-002',
  'course-g04-l03-ts-003',
  'course-g04-l03-ts-004',
  'course-g04-l03-ts-005',
  'course-g04-l03-ts-006',
  'course-g04-l03-ts-007',
  'course-g04-l03-ts-008',
  'course-g04-l03-fq-001',
  'course-g04-l03-fq-002',
  'course-g04-l03-fq-003',
  'shell-course-g04-l03-index-local',
] as const);

const G4_L3_SHOWCASE_ASSET_DIRECTORY_SET = new Set<string>(
  G4_L3_SHOWCASE_ASSET_DIRECTORIES,
);

export function isG4L3ShowcaseAssetSegments(asset: readonly string[]) {
  return asset[0] === 'courses'
    && asset.length >= 3
    && G4_L3_SHOWCASE_ASSET_DIRECTORY_SET.has(asset[1] ?? '');
}

export function isG4L3ShowcaseAssetPath(pathname: string) {
  const prefix = '/flash-assets/';
  return pathname.startsWith(prefix)
    && isG4L3ShowcaseAssetSegments(
      pathname.slice(prefix.length).split('/'),
    );
}

export function isG4L3ShowcaseAssetAuthorized(
  env: CurrentJsShowcaseEnvironment = process.env,
) {
  return currentJsShowcasePublication(
    G4_L3_SHOWCASE_RELEASE_ID,
    env,
  ).enabled;
}
