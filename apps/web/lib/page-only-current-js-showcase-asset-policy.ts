import {
  currentJsShowcasePublication,
  G3_L2_SHOWCASE_RELEASE_ID,
  G5_L3_SHOWCASE_RELEASE_ID,
  G5_L5_SHOWCASE_RELEASE_ID,
  type CurrentJsShowcaseEnvironment,
} from './current-js-showcase-publication';

/**
 * Exact public runtime-directory closure for the page-only lessons whose
 * Current-JavaScript product publication is controlled by showcase flags.
 * Keeping every directory explicit prevents an enabled lesson from exposing
 * another lesson, a future draft package, or a legacy Flash course shell.
 */
export const PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE =
  Object.freeze({
    [G3_L2_SHOWCASE_RELEASE_ID]: Object.freeze([
      'course-g03-l02-fq-001',
      'course-g03-l02-fq-002',
      'course-g03-l02-fq-003',
      'course-g03-l02-gs-002',
      'course-g03-l02-gs-003',
      'course-g03-l02-in-002',
      'course-g03-l02-in-003',
      'course-g03-l02-in-004',
      'course-g03-l02-in-005',
      'course-g03-l02-in-006',
      'course-g03-l02-in-007',
      'course-g03-l02-in-008',
      'course-g03-l02-in-009',
      'course-g03-l02-in-010',
      'course-g03-l02-in-011',
      'course-g03-l02-in-012',
      'course-g03-l02-in-013',
      'course-g03-l02-in-014',
      'course-g03-l02-in-015',
      'course-g03-l02-in-016',
      'course-g03-l02-in-017',
      'course-g03-l02-in-018',
      'course-g03-l02-in-019',
      'course-g03-l02-in-020',
      'course-g03-l02-in-021',
      'course-g03-l02-in-022',
      'course-g03-l02-in-023',
      'course-g03-l02-in-024',
      'course-g03-l02-in-025',
      'course-g03-l02-in-026',
      'course-g03-l02-in-027',
      'course-g03-l02-in-028',
      'course-g03-l02-in-029',
      'course-g03-l02-in-030',
      'course-g03-l02-in-031',
      'course-g03-l02-in-032',
      'course-g03-l02-ir-001-87689b4b',
      'course-g03-l02-rw-002',
      'course-g03-l02-rw-003',
      'course-g03-l02-rw-004',
      'course-g03-l02-rw-005',
      'course-g03-l02-ti-002',
      'course-g03-l02-ti-003',
      'course-g03-l02-ti-004',
      'course-g03-l02-ti-005',
      'course-g03-l02-ti-006',
      'course-g03-l02-ti-007',
      'course-g03-l02-ti-008',
      'course-g03-l02-ti-009',
      'course-g03-l02-ti-010',
      'course-g03-l02-ts-002',
      'course-g03-l02-ts-003',
      'course-g03-l02-ts-004',
      'course-g03-l02-ts-005',
      'course-g03-l02-ts-006',
      'course-g03-l02-ts-007',
      'course-g03-l02-ts-008',
      'course-g03-l02-vb-002',
      'course-g03-l02-vb-003',
      'course-g03-l02-vb-004',
      'course-g03-l02-vb-005',
      'course-g03-l02-vb-006',
      'course-g03-l02-vb-007',
      'course-g03-l02-vb-008',
      'course-g03-l02-vb-009',
      'course-g03-l02-vb-010',
      'course-g03-l02-vb-011',
      'course-g03-l02-vb-012',
      'course-g03-l02-vb-013',
      'course-g03-l02-vb-014',
    ]),
    [G5_L3_SHOWCASE_RELEASE_ID]: Object.freeze([
      'course-g05-l03-fq-001',
      'course-g05-l03-fq-002',
      'course-g05-l03-fq-003',
      'course-g05-l03-gs-002',
      'course-g05-l03-in-002',
      'course-g05-l03-in-003',
      'course-g05-l03-in-004',
      'course-g05-l03-in-005',
      'course-g05-l03-in-006',
      'course-g05-l03-in-007',
      'course-g05-l03-in-008',
      'course-g05-l03-in-009',
      'course-g05-l03-in-010',
      'course-g05-l03-in-011',
      'course-g05-l03-in-012',
      'course-g05-l03-in-013',
      'course-g05-l03-in-014',
      'course-g05-l03-in-015',
      'course-g05-l03-in-016',
      'course-g05-l03-in-017',
      'course-g05-l03-in-018',
      'course-g05-l03-in-019',
      'course-g05-l03-in-020',
      'course-g05-l03-in-021',
      'course-g05-l03-in-022',
      'course-g05-l03-in-023',
      'course-g05-l03-in-024',
      'course-g05-l03-in-025',
      'course-g05-l03-in-026',
      'course-g05-l03-in-027',
      'course-g05-l03-in-028',
      'course-g05-l03-ir-001-c420d2ff',
      'course-g05-l03-rw-002',
      'course-g05-l03-rw-003',
      'course-g05-l03-rw-004',
      'course-g05-l03-ti-002',
      'course-g05-l03-ti-003',
      'course-g05-l03-ti-004',
      'course-g05-l03-ti-005',
      'course-g05-l03-ti-006',
      'course-g05-l03-ti-007',
      'course-g05-l03-ti-008',
      'course-g05-l03-ti-009',
      'course-g05-l03-ts-002',
      'course-g05-l03-ts-003',
      'course-g05-l03-ts-004',
      'course-g05-l03-ts-005',
      'course-g05-l03-ts-006',
      'course-g05-l03-ts-007',
      'course-g05-l03-ts-008',
      'course-g05-l03-vb-002',
      'course-g05-l03-vb-003',
      'course-g05-l03-vb-004',
      'course-g05-l03-vb-005',
      'course-g05-l03-vb-006',
      'course-g05-l03-vb-007',
      'course-g05-l03-vb-008',
      'course-g05-l03-vb-009',
      'course-g05-l03-vb-010',
      'course-g05-l03-vb-011',
      'course-g05-l03-vb-012',
      'course-g05-l03-vb-013',
      'course-g05-l03-vb-014',
      'course-g05-l03-vb-015',
    ]),
    [G5_L5_SHOWCASE_RELEASE_ID]: Object.freeze([
      'course-g05-l05-fq-001',
      'course-g05-l05-fq-002',
      'course-g05-l05-fq-003',
      'course-g05-l05-gs-002',
      'course-g05-l05-in-002',
      'course-g05-l05-in-003',
      'course-g05-l05-in-004',
      'course-g05-l05-in-005',
      'course-g05-l05-in-006',
      'course-g05-l05-in-007',
      'course-g05-l05-in-008',
      'course-g05-l05-in-009',
      'course-g05-l05-in-010',
      'course-g05-l05-in-011',
      'course-g05-l05-in-012',
      'course-g05-l05-in-013',
      'course-g05-l05-in-014',
      'course-g05-l05-in-015',
      'course-g05-l05-in-016',
      'course-g05-l05-in-017',
      'course-g05-l05-in-018',
      'course-g05-l05-in-019',
      'course-g05-l05-in-020',
      'course-g05-l05-ir-001-664ab764',
      'course-g05-l05-rw-002',
      'course-g05-l05-rw-003',
      'course-g05-l05-rw-004',
      'course-g05-l05-ti-002',
      'course-g05-l05-ti-003',
      'course-g05-l05-ti-004',
      'course-g05-l05-ti-005',
      'course-g05-l05-ti-006',
      'course-g05-l05-ti-007',
      'course-g05-l05-ti-008',
      'course-g05-l05-ti-009',
      'course-g05-l05-ti-010',
      'course-g05-l05-ts-002',
      'course-g05-l05-ts-003',
      'course-g05-l05-ts-004',
      'course-g05-l05-ts-005',
      'course-g05-l05-ts-006',
      'course-g05-l05-ts-007',
      'course-g05-l05-ts-008',
      'course-g05-l05-vb-002',
      'course-g05-l05-vb-003',
      'course-g05-l05-vb-004',
      'course-g05-l05-vb-005',
      'course-g05-l05-vb-006',
      'course-g05-l05-vb-007',
      'course-g05-l05-vb-008',
      'course-g05-l05-vb-009',
      'course-g05-l05-vb-010',
      'course-g05-l05-vb-011',
      'course-g05-l05-vb-012',
      'course-g05-l05-vb-013',
      'course-g05-l05-vb-014',
    ]),
  } as const);

type PageOnlyShowcaseReleaseId = keyof
  typeof PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE;

const releaseIdByDirectory = new Map<string, PageOnlyShowcaseReleaseId>();
for (const [releaseId, directories] of Object.entries(
  PAGE_ONLY_CURRENT_JS_SHOWCASE_ASSET_DIRECTORIES_BY_RELEASE,
) as Array<[PageOnlyShowcaseReleaseId, readonly string[]]>) {
  for (const directory of directories) {
    if (releaseIdByDirectory.has(directory)) {
      throw new Error(`Duplicate page-only showcase asset directory: ${directory}`);
    }
    releaseIdByDirectory.set(directory, releaseId);
  }
}

export function pageOnlyCurrentJsShowcaseReleaseIdForAssetSegments(
  asset: readonly string[],
): PageOnlyShowcaseReleaseId | undefined {
  if (
    asset[0] !== 'courses'
    || asset.length < 3
    || asset.some((segment) =>
      segment.length === 0
      || segment === '.'
      || segment === '..'
      || segment.includes('/')
      || segment.includes('\\')
    )
  ) {
    return undefined;
  }
  return releaseIdByDirectory.get(asset[1] ?? '');
}

export function isPageOnlyCurrentJsShowcaseAssetSegments(
  asset: readonly string[],
) {
  return pageOnlyCurrentJsShowcaseReleaseIdForAssetSegments(asset) !==
    undefined;
}

export function isPageOnlyCurrentJsShowcaseAssetPath(pathname: string) {
  const prefix = '/flash-assets/';
  return pathname.startsWith(prefix)
    && isPageOnlyCurrentJsShowcaseAssetSegments(
      pathname.slice(prefix.length).split('/'),
    );
}

export function isPageOnlyCurrentJsShowcaseAssetAuthorized(
  asset: readonly string[],
  env: CurrentJsShowcaseEnvironment = process.env,
) {
  const releaseId = pageOnlyCurrentJsShowcaseReleaseIdForAssetSegments(asset);
  return releaseId !== undefined
    && currentJsShowcasePublication(releaseId, env).enabled;
}
