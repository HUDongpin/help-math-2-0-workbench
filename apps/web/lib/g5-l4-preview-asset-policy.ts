import {G5_L4_EXECUTIVE_PREVIEW_SCENES} from './g5-l4-executive-preview-content';

const SHA256 = /^[a-f0-9]{64}$/;

export const G5_L4_PREVIEW_RUNTIME_SHA256 = Object.freeze(
  Object.fromEntries(
    G5_L4_EXECUTIVE_PREVIEW_SCENES.map((scene) => [
      scene.animationId,
      scene.runtimeSha256
    ])
  ) as Readonly<Record<string, string>>
);

export type G5L4PreviewAssetClassification = Readonly<{
  controlled: boolean;
  animationId: string | null;
  kind: 'runtime' | 'manifest' | 'other' | null;
  expectedRuntimeSha256: string | null;
}>;

export function hasSafeFlashAssetSegments(asset: readonly string[]) {
  return asset.length > 0 && asset.every(
    (segment) =>
      segment.length > 0
      && segment !== '.'
      && segment !== '..'
      && !segment.includes('/')
      && !segment.includes('\\')
  );
}

export function classifyG5L4PreviewAsset(
  asset: readonly string[]
): G5L4PreviewAssetClassification {
  const [collection, animationId, ...remainder] = asset;
  const expectedRuntimeSha256 =
    collection === 'courses' && animationId
      ? G5_L4_PREVIEW_RUNTIME_SHA256[animationId] ?? null
      : null;
  if (!expectedRuntimeSha256) {
    return Object.freeze({
      controlled: false,
      animationId: null,
      kind: null,
      expectedRuntimeSha256: null
    });
  }

  const relative = remainder.join('/');
  return Object.freeze({
    controlled: true,
    animationId,
    kind:
      relative === 'canvas-renderer.js'
        ? 'runtime'
        : relative === 'manifest.json'
          ? 'manifest'
          : 'other',
    expectedRuntimeSha256
  });
}

export function isG5L4PreviewAssetAuthorized({
  developmentAudit,
  previewEnabled,
  published
}: {
  developmentAudit: boolean;
  previewEnabled: boolean;
  published: boolean;
}) {
  return developmentAudit || previewEnabled || published;
}

export function hasExactG5L4RuntimeDigest(
  url: URL,
  expectedRuntimeSha256: string
) {
  const values = url.searchParams.getAll('sha256');
  return values.length === 1
    && SHA256.test(values[0] ?? '')
    && values[0] === expectedRuntimeSha256;
}
