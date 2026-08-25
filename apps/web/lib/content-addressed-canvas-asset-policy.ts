const SHA256 = /^[a-f0-9]{64}$/u;
const SAFE_PROFILE_SEGMENT = /^[A-Za-z0-9._-]+$/u;
const CANVAS_ANIMATION_ID =
  /^course-g(?:03|04|05)-l[0-9]{2}-(?:fq|gs|in|ir|rw|ti|ts|vb)-[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export const CONTENT_ADDRESSED_CANVAS_PREFIX = 'by-sha256';
export const G4_L3_IR001_LOADED_HOST_ANIMATION_ID =
  'course-g04-l03-ir-001-341242cc';
export const G4_L3_IR001_LOADED_HOST_CANVAS_ASSET_PATH =
  'courses/shell-course-g04-l03-index-local/host-composite-assets/course-g04-l03-ir-001-loaded-swf-canvas-renderer.js';
export const CURRENT_JS_PRODUCTION_ASSETS_V2_PROFILE_ID =
  'current-js-production-assets-v2';
export const CURRENT_JS_PRODUCTION_ASSETS_V2_PARENT_PROFILE_ID =
  'current-js-production-assets-v1';
export const CURRENT_JS_PRODUCTION_ASSETS_V2_PARENT_CHECKSUM_SET_SHA256 =
  '52dd1d51335523dc097b0c1a428e897960425ad184069fb023e98e0fcef7ae25';
export const CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVAL_SCOPE =
  'five-lesson-current-js-production-closure';

export const CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVED_RELEASE_IDS =
  Object.freeze([
    'lesson-g03-l02-addition-subtraction-page-only-current-js',
    'lesson-g04-l03-negative-numbers',
    'lesson-g05-l03-exponents-prime-factorizations-page-only',
    'lesson-g05-l04-number-lines',
    'lesson-g05-l05-add-subtract-negative-numbers',
  ] as const);

export interface CurrentJsProductionAssetCountsV2 {
  readonly public: number;
  readonly serverAudio: number;
  readonly total: number;
}

export const CURRENT_JS_PRODUCTION_ASSETS_V2_EXPECTED_COUNTS = Object.freeze({
  public: 929,
  serverAudio: 185,
  total: 1114,
} satisfies CurrentJsProductionAssetCountsV2);

export type CurrentJsProductionAssetStorageRootV2 =
  | 'public'
  | 'server-audio';

export interface CurrentJsProductionAssetEntryV2 {
  readonly assetPath: string;
  readonly relativePath: string;
  readonly storageRoot: CurrentJsProductionAssetStorageRootV2;
  readonly releaseId: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface CurrentJsProductionAssetsV2 {
  readonly schemaVersion: 2;
  readonly profileId: typeof CURRENT_JS_PRODUCTION_ASSETS_V2_PROFILE_ID;
  readonly parentProfileId:
    typeof CURRENT_JS_PRODUCTION_ASSETS_V2_PARENT_PROFILE_ID;
  readonly parentChecksumSetSha256:
    typeof CURRENT_JS_PRODUCTION_ASSETS_V2_PARENT_CHECKSUM_SET_SHA256;
  readonly generatedBy: string;
  readonly approvalScope:
    typeof CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVAL_SCOPE;
  readonly approvedReleaseIds:
    typeof CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVED_RELEASE_IDS;
  readonly counts: CurrentJsProductionAssetCountsV2;
  readonly checksumSetSha256: string;
  readonly entries: readonly CurrentJsProductionAssetEntryV2[];
}

export interface ContentAddressedPageCanvasAssetRequest {
  readonly kind: 'page-renderer';
  readonly sha256: string;
  readonly animationId: string;
  readonly assetPath: string;
  readonly logicalSegments: readonly [string, string, string];
}

export interface ContentAddressedIr001LoadedHostCanvasAssetRequest {
  readonly kind: 'ir001-loaded-host';
  readonly sha256: string;
  readonly animationId: typeof G4_L3_IR001_LOADED_HOST_ANIMATION_ID;
  readonly assetPath:
    typeof G4_L3_IR001_LOADED_HOST_CANVAS_ASSET_PATH;
  readonly logicalSegments: readonly [string, string, string, string];
}

export type ContentAddressedCanvasAssetRequest =
  | ContentAddressedPageCanvasAssetRequest
  | ContentAddressedIr001LoadedHostCanvasAssetRequest;

export interface ParseCurrentJsProductionAssetsV2Options {
  readonly expectedCounts?: CurrentJsProductionAssetCountsV2;
}

type UnknownRecord = Record<string, unknown>;

const PROFILE_KEYS = Object.freeze([
  'schemaVersion',
  'profileId',
  'parentProfileId',
  'parentChecksumSetSha256',
  'generatedBy',
  'approvalScope',
  'approvedReleaseIds',
  'counts',
  'checksumSetSha256',
  'entries',
] as const);

const ENTRY_KEYS = Object.freeze([
  'assetPath',
  'relativePath',
  'storageRoot',
  'releaseId',
  'bytes',
  'sha256',
] as const);

const COUNT_KEYS = Object.freeze(['public', 'serverAudio', 'total'] as const);

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(
  value: UnknownRecord,
  expectedKeys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index]);
}

function isSafeProfilePath(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\\')) {
    return false;
  }
  const segments = value.split('/');
  return segments.length > 0
    && segments.every((segment) =>
      segment.length > 0
      && segment !== '.'
      && segment !== '..'
      && SAFE_PROFILE_SEGMENT.test(segment));
}

function hasExactApprovedReleaseIds(value: unknown): boolean {
  return Array.isArray(value)
    && value.length
      === CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVED_RELEASE_IDS.length
    && value.every(
      (releaseId, index) =>
        releaseId
          === CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVED_RELEASE_IDS[index],
    );
}

function parseCounts(
  value: unknown,
  expected: CurrentJsProductionAssetCountsV2,
): CurrentJsProductionAssetCountsV2 | null {
  if (!isRecord(value) || !hasExactKeys(value, COUNT_KEYS)) return null;
  if (
    !Number.isSafeInteger(value.public)
    || !Number.isSafeInteger(value.serverAudio)
    || !Number.isSafeInteger(value.total)
    || (value.public as number) < 0
    || (value.serverAudio as number) < 0
    || (value.total as number) < 0
    || value.public !== expected.public
    || value.serverAudio !== expected.serverAudio
    || value.total !== expected.total
  ) {
    return null;
  }
  return Object.freeze({
    public: value.public as number,
    serverAudio: value.serverAudio as number,
    total: value.total as number,
  });
}

function parseEntry(value: unknown): CurrentJsProductionAssetEntryV2 | null {
  if (!isRecord(value) || !hasExactKeys(value, ENTRY_KEYS)) return null;
  if (
    !isSafeProfilePath(value.assetPath)
    || !isSafeProfilePath(value.relativePath)
    || value.assetPath !== `courses/${value.relativePath}`
    || (value.storageRoot !== 'public' && value.storageRoot !== 'server-audio')
    || typeof value.releaseId !== 'string'
    || !CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVED_RELEASE_IDS.includes(
      value.releaseId as typeof CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVED_RELEASE_IDS[number],
    )
    || !Number.isSafeInteger(value.bytes)
    || (value.bytes as number) < 0
    || typeof value.sha256 !== 'string'
    || !SHA256.test(value.sha256)
  ) {
    return null;
  }
  return Object.freeze({
    assetPath: value.assetPath,
    relativePath: value.relativePath,
    storageRoot: value.storageRoot,
    releaseId: value.releaseId,
    bytes: value.bytes as number,
    sha256: value.sha256,
  });
}

export function isContentAddressedCanvasAssetBranch(
  asset: readonly string[],
): boolean {
  return asset[0] === CONTENT_ADDRESSED_CANVAS_PREFIX;
}

export function parseContentAddressedCanvasAssetSegments(
  asset: readonly string[],
): ContentAddressedCanvasAssetRequest | null {
  if (
    asset[0] !== CONTENT_ADDRESSED_CANVAS_PREFIX
    || !SHA256.test(asset[1] ?? '')
  ) {
    return null;
  }

  const sha256 = asset[1] as string;
  if (
    asset.length === 5
    && asset[2] === 'courses'
    && CANVAS_ANIMATION_ID.test(asset[3] ?? '')
    && asset[4] === 'canvas-renderer.js'
  ) {
    const animationId = asset[3] as string;
    const logicalSegments = Object.freeze([
      'courses',
      animationId,
      'canvas-renderer.js',
    ] as const);
    return Object.freeze({
      kind: 'page-renderer',
      sha256,
      animationId,
      assetPath: logicalSegments.join('/'),
      logicalSegments,
    });
  }

  const hostLogicalSegments = Object.freeze([
    'courses',
    'shell-course-g04-l03-index-local',
    'host-composite-assets',
    'course-g04-l03-ir-001-loaded-swf-canvas-renderer.js',
  ] as const);
  if (
    asset.length === 6
    && asset.slice(2).every(
      (segment, index) => segment === hostLogicalSegments[index],
    )
  ) {
    return Object.freeze({
      kind: 'ir001-loaded-host',
      sha256,
      animationId: G4_L3_IR001_LOADED_HOST_ANIMATION_ID,
      assetPath: G4_L3_IR001_LOADED_HOST_CANVAS_ASSET_PATH,
      logicalSegments: hostLogicalSegments,
    });
  }
  return null;
}

export function parseCurrentJsProductionAssetsV2(
  value: unknown,
  options: ParseCurrentJsProductionAssetsV2Options = {},
): CurrentJsProductionAssetsV2 | null {
  if (!isRecord(value) || !hasExactKeys(value, PROFILE_KEYS)) return null;

  const expectedCounts = options.expectedCounts
    ?? CURRENT_JS_PRODUCTION_ASSETS_V2_EXPECTED_COUNTS;
  const counts = parseCounts(value.counts, expectedCounts);
  if (
    value.schemaVersion !== 2
    || value.profileId !== CURRENT_JS_PRODUCTION_ASSETS_V2_PROFILE_ID
    || value.parentProfileId
      !== CURRENT_JS_PRODUCTION_ASSETS_V2_PARENT_PROFILE_ID
    || value.parentChecksumSetSha256
      !== CURRENT_JS_PRODUCTION_ASSETS_V2_PARENT_CHECKSUM_SET_SHA256
    || typeof value.generatedBy !== 'string'
    || value.generatedBy.length === 0
    || value.approvalScope !== CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVAL_SCOPE
    || !hasExactApprovedReleaseIds(value.approvedReleaseIds)
    || !counts
    || typeof value.checksumSetSha256 !== 'string'
    || !SHA256.test(value.checksumSetSha256)
    || !Array.isArray(value.entries)
  ) {
    return null;
  }

  const entries: CurrentJsProductionAssetEntryV2[] = [];
  const assetPaths = new Set<string>();
  const storageKeys = new Set<string>();
  for (const candidate of value.entries) {
    const entry = parseEntry(candidate);
    if (!entry) return null;
    const storageKey = `${entry.storageRoot}\u0000${entry.relativePath}`;
    if (assetPaths.has(entry.assetPath) || storageKeys.has(storageKey)) {
      return null;
    }
    assetPaths.add(entry.assetPath);
    storageKeys.add(storageKey);
    entries.push(entry);
  }

  const publicCount = entries.filter(
    (entry) => entry.storageRoot === 'public',
  ).length;
  const serverAudioCount = entries.filter(
    (entry) => entry.storageRoot === 'server-audio',
  ).length;
  if (
    publicCount !== counts.public
    || serverAudioCount !== counts.serverAudio
    || entries.length !== counts.total
  ) {
    return null;
  }

  return Object.freeze({
    schemaVersion: 2,
    profileId: CURRENT_JS_PRODUCTION_ASSETS_V2_PROFILE_ID,
    parentProfileId: CURRENT_JS_PRODUCTION_ASSETS_V2_PARENT_PROFILE_ID,
    parentChecksumSetSha256:
      CURRENT_JS_PRODUCTION_ASSETS_V2_PARENT_CHECKSUM_SET_SHA256,
    generatedBy: value.generatedBy,
    approvalScope: CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVAL_SCOPE,
    approvedReleaseIds: CURRENT_JS_PRODUCTION_ASSETS_V2_APPROVED_RELEASE_IDS,
    counts,
    checksumSetSha256: value.checksumSetSha256,
    entries: Object.freeze(entries),
  });
}

export function currentJsProductionAssetChecksumRows(
  entries: readonly CurrentJsProductionAssetEntryV2[],
): readonly string[] {
  return Object.freeze(
    entries
      .map((entry) =>
        `${entry.sha256} ${entry.bytes} ${entry.relativePath}`)
      .sort((left, right) => {
        const leftPath = left.slice(
          left.indexOf(' ', left.indexOf(' ') + 1) + 1,
        );
        const rightPath = right.slice(
          right.indexOf(' ', right.indexOf(' ') + 1) + 1,
        );
        return leftPath < rightPath ? -1 : leftPath > rightPath ? 1 : 0;
      }),
  );
}

export function findExactContentAddressedCanvasProfileEntry(
  request: ContentAddressedCanvasAssetRequest,
  profile: CurrentJsProductionAssetsV2,
): CurrentJsProductionAssetEntryV2 | null {
  const expectedRelativePath = request.assetPath.slice('courses/'.length);
  const requestIdentityMatches = request.kind === 'page-renderer'
    ? request.assetPath
        === `courses/${request.animationId}/canvas-renderer.js`
      && request.logicalSegments.join('/') === request.assetPath
    : request.animationId === G4_L3_IR001_LOADED_HOST_ANIMATION_ID
      && request.assetPath === G4_L3_IR001_LOADED_HOST_CANVAS_ASSET_PATH
      && request.logicalSegments.join('/') === request.assetPath;
  const entry = profile.entries.find(
    (candidate) => candidate.assetPath === request.assetPath,
  );
  if (
    !requestIdentityMatches
    || !entry
    || entry.storageRoot !== 'public'
    || entry.sha256 !== request.sha256
    || entry.bytes < 1
    || entry.assetPath !== request.assetPath
    || entry.relativePath !== expectedRelativePath
  ) {
    return null;
  }
  return entry;
}
