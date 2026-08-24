import candidateProfileJson from '../config/current-js-candidate-assets.v1.json';
import productionProfileJson from '../config/current-js-production-assets.v1.json';

type CurrentJsAssetStorageRoot = 'candidate' | 'public' | 'server-audio';
type CurrentJsAssetEnvironment =
  Readonly<Record<string, string | undefined>>;

export type CurrentJsAssetProfileRecord = Readonly<{
  assetPath: string;
  bytes: number;
  profile: 'candidate' | 'production';
  releaseId: string;
  sha256: string;
  storageRoot: CurrentJsAssetStorageRoot;
}>;

type JsonEntry = Readonly<{
  assetPath: string;
  bytes: number;
  releaseId: string;
  sha256: string;
  storageRoot: CurrentJsAssetStorageRoot;
}>;

const SHA256 = /^[a-f0-9]{64}$/u;
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/u;

function validatedRecords(
  entries: readonly JsonEntry[],
  profile: CurrentJsAssetProfileRecord['profile'],
) {
  const records = new Map<string, CurrentJsAssetProfileRecord>();
  for (const entry of entries) {
    if (
      !entry.assetPath.startsWith('courses/')
      || entry.assetPath.split('/').some((segment) =>
        !SAFE_SEGMENT.test(segment) || segment === '.' || segment === '..'
      )
      || !Number.isSafeInteger(entry.bytes)
      || entry.bytes < 1
      || !SHA256.test(entry.sha256)
      || records.has(entry.assetPath)
      || !['candidate', 'public', 'server-audio'].includes(entry.storageRoot)
    ) {
      throw new Error(
        `Invalid or duplicate ${profile} Current-JS asset: ${entry.assetPath}`,
      );
    }
    records.set(entry.assetPath, Object.freeze({
      assetPath: entry.assetPath,
      bytes: entry.bytes,
      profile,
      releaseId: entry.releaseId,
      sha256: entry.sha256,
      storageRoot: entry.storageRoot,
    }));
  }
  return records;
}

if (
  productionProfileJson.schemaVersion !== 1
  || productionProfileJson.profileId !== 'current-js-production-assets-v1'
  || productionProfileJson.counts.public !== 1135
  || productionProfileJson.counts.serverAudio !== 185
  || productionProfileJson.counts.total !== 1320
  || productionProfileJson.entries.length !== 1320
  || productionProfileJson.checksumSetSha256 !==
    '54e11e77a8d684fcf9542ba7458c12add3edb1a85c16ac99db756a34ed5c6ad4'
) {
  throw new Error('Current-JS production asset profile identity drifted');
}

if (
  candidateProfileJson.schemaVersion !== 1
  || candidateProfileJson.profileId !== 'current-js-candidate-assets-v1'
  || candidateProfileJson.counts.runtime !== 3
  || candidateProfileJson.counts.evidence !== 204
  || candidateProfileJson.entries.length !== 3
  || candidateProfileJson.authority.productionApproved !== false
  || candidateProfileJson.authority.releaseEligible !== false
  || candidateProfileJson.authority.published !== false
) {
  throw new Error('Current-JS candidate asset profile identity drifted');
}

const productionRecords = validatedRecords(
  productionProfileJson.entries as readonly JsonEntry[],
  'production',
);
const candidateRecords = validatedRecords(
  candidateProfileJson.entries as readonly JsonEntry[],
  'candidate',
);

export const CURRENT_JS_CANDIDATE_ASSET_VERSION =
  candidateProfileJson.version;

export const CURRENT_JS_PRODUCTION_APPROVED_RELEASE_IDS = Object.freeze(
  new Set(productionProfileJson.approvedReleaseIds),
);
export const CURRENT_JS_CANDIDATE_RELEASE_IDS = Object.freeze(
  new Set(candidateProfileJson.candidateReleaseIds),
);

function assetPathForSegments(asset: readonly string[]) {
  if (
    asset.length < 3
    || asset[0] !== 'courses'
    || asset.some((segment) =>
      !SAFE_SEGMENT.test(segment) || segment === '.' || segment === '..'
    )
  ) return undefined;
  return asset.join('/');
}

export function currentJsCandidateProfileEnabled(
  env: CurrentJsAssetEnvironment = process.env,
) {
  return env.NODE_ENV !== 'production'
    && env.CURRENT_JS_CANDIDATE_PROFILE_ENABLED === 'true';
}

export function isCurrentJsProductionReleaseApproved(releaseId: string) {
  return CURRENT_JS_PRODUCTION_APPROVED_RELEASE_IDS.has(releaseId);
}

export function isCurrentJsCandidateReleaseAvailable(releaseId: string) {
  return CURRENT_JS_CANDIDATE_RELEASE_IDS.has(releaseId);
}

export function currentJsProductionAssetRecordForSegments(
  asset: readonly string[],
) {
  const assetPath = assetPathForSegments(asset);
  return assetPath ? productionRecords.get(assetPath) : undefined;
}

export function currentJsCandidateAssetRecordForSegments(
  asset: readonly string[],
) {
  const assetPath = assetPathForSegments(asset);
  return assetPath ? candidateRecords.get(assetPath) : undefined;
}

export function currentJsAssetRecordsForSegments(asset: readonly string[]) {
  return Object.freeze({
    candidate: currentJsCandidateAssetRecordForSegments(asset),
    production: currentJsProductionAssetRecordForSegments(asset),
  });
}

export function selectedCurrentJsAssetRecordForSegments(
  asset: readonly string[],
  env: CurrentJsAssetEnvironment = process.env,
) {
  const records = currentJsAssetRecordsForSegments(asset);
  if (currentJsCandidateProfileEnabled(env) && records.candidate) {
    return records.candidate;
  }
  return records.production;
}

export function hasExactCurrentJsAssetBytes(
  record: CurrentJsAssetProfileRecord,
  bytes: Buffer,
  digest: string,
) {
  return bytes.length === record.bytes && digest === record.sha256;
}

export function currentJsProductionAssetRecords() {
  return Object.freeze([...productionRecords.values()]);
}

export function currentJsCandidateAssetRecords() {
  return Object.freeze([...candidateRecords.values()]);
}
