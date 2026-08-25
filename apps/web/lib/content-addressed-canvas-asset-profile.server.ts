import {createHash} from 'node:crypto';
import {lstat, readFile, realpath} from 'node:fs/promises';
import path from 'node:path';

import {
  currentJsProductionAssetChecksumRows,
  findExactContentAddressedCanvasProfileEntry,
  parseCurrentJsProductionAssetsV2,
  type ContentAddressedCanvasAssetRequest,
  type CurrentJsProductionAssetCountsV2,
  type CurrentJsProductionAssetEntryV2,
  type CurrentJsProductionAssetsV2,
} from './content-addressed-canvas-asset-policy';

export const ACTIVE_CURRENT_JS_PRODUCTION_ASSETS_V2_RELATIVE_PATH =
  'apps/web/config/current-js-production-assets.v2.json';

const PUBLIC_CANVAS_ASSET_ROOT =
  'apps/web/public/flash-assets/courses';

export interface LoadActiveCurrentJsProductionAssetsV2Options {
  readonly workspaceRoot: string;
  /** Test-only fixture boundary; production callers use the fixed counts. */
  readonly expectedCounts?: CurrentJsProductionAssetCountsV2;
}

export interface ReadContentAddressedCanvasAssetOptions {
  readonly workspaceRoot: string;
  readonly request: ContentAddressedCanvasAssetRequest;
  readonly profile: CurrentJsProductionAssetsV2;
}

export interface ContentAddressedCanvasAsset {
  readonly bytes: Buffer;
  readonly entry: CurrentJsProductionAssetEntryV2;
  readonly sha256: string;
}

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function profileChecksumSetSha256(
  profile: CurrentJsProductionAssetsV2,
): string {
  return sha256(Buffer.from(
    currentJsProductionAssetChecksumRows(profile.entries).join('\n'),
  ));
}

/**
 * Runtime-only loader. The v2 profile is intentionally not statically
 * imported: until an exact active profile is generated, builds remain valid
 * and every content-addressed request fails closed at 404.
 */
export async function loadActiveCurrentJsProductionAssetsV2({
  workspaceRoot,
  expectedCounts,
}: LoadActiveCurrentJsProductionAssetsV2Options): Promise<
  CurrentJsProductionAssetsV2 | null
> {
  try {
    const profilePath = path.resolve(
      workspaceRoot,
      ACTIVE_CURRENT_JS_PRODUCTION_ASSETS_V2_RELATIVE_PATH,
    );
    const profileEntry = await lstat(profilePath);
    if (profileEntry.isSymbolicLink() || !profileEntry.isFile()) return null;

    const bytes = await readFile(profilePath);
    const value = JSON.parse(bytes.toString('utf8')) as unknown;
    const profile = parseCurrentJsProductionAssetsV2(
      value,
      expectedCounts ? {expectedCounts} : undefined,
    );
    if (!profile) return null;
    if (profileChecksumSetSha256(profile) !== profile.checksumSetSha256) {
      return null;
    }
    return profile;
  } catch {
    return null;
  }
}

/**
 * Resolves one exact public Canvas runtime and rechecks both byte length and
 * SHA-256 after reading it. No candidate, source, private, audio, general
 * shell, or non-IR001 host path is reachable through this function.
 */
export async function readContentAddressedCanvasAsset({
  workspaceRoot,
  request,
  profile,
}: ReadContentAddressedCanvasAssetOptions): Promise<
  ContentAddressedCanvasAsset | null
> {
  const entry = findExactContentAddressedCanvasProfileEntry(request, profile);
  if (!entry || entry.storageRoot !== 'public') return null;

  try {
    const root = path.resolve(workspaceRoot, PUBLIC_CANVAS_ASSET_ROOT);
    const target = path.resolve(root, entry.relativePath);
    if (target === root || !target.startsWith(`${root}${path.sep}`)) {
      return null;
    }

    const [realRoot, targetEntry] = await Promise.all([
      realpath(root),
      lstat(target),
    ]);
    if (targetEntry.isSymbolicLink() || !targetEntry.isFile()) return null;

    const realTarget = await realpath(target);
    if (
      realTarget === realRoot
      || !realTarget.startsWith(`${realRoot}${path.sep}`)
    ) {
      return null;
    }

    const bytes = await readFile(realTarget);
    if (bytes.length !== entry.bytes) return null;
    const observedSha256 = sha256(bytes);
    if (
      observedSha256 !== entry.sha256
      || observedSha256 !== request.sha256
    ) {
      return null;
    }

    return Object.freeze({
      bytes,
      entry,
      sha256: observedSha256,
    });
  } catch {
    return null;
  }
}
