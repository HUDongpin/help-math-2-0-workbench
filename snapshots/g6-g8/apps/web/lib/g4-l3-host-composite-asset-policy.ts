const SHA256 = /^[a-f0-9]{64}$/;

export const G4_L3_HOST_COMPOSITE_SHA256 = Object.freeze({
  'courses/shell-course-g04-l03-index-local/host-composite-assets/lesson-shell-mc-back-text.svg':
    '102f0ddeec5ede8843149c3c5621fb5a6632a5edc191b768823fbce691740355',
  'courses/shell-course-g04-l03-index-local/host-composite-assets/course-g04-l03-ir-001-loaded-swf-canvas-renderer.js':
    '3240f36c8ad7f11f906f3d4be9a16461ae1e1a4699691c16fb371a5476e1eab0',
} as const);

export type G4L3HostCompositeAssetClassification = Readonly<{
  controlled: boolean;
  expectedSha256: string | null;
  relativePath: string;
}>;

export function classifyG4L3HostCompositeAsset(
  asset: readonly string[],
): G4L3HostCompositeAssetClassification {
  const relativePath = asset.join('/');
  const expectedSha256 =
    G4_L3_HOST_COMPOSITE_SHA256[
      relativePath as keyof typeof G4_L3_HOST_COMPOSITE_SHA256
    ] ?? null;
  return Object.freeze({
    controlled: expectedSha256 !== null,
    expectedSha256,
    relativePath,
  });
}

export function hasExactG4L3HostCompositeDigest(
  url: URL,
  expectedSha256: string,
) {
  const values = url.searchParams.getAll('sha256');
  return values.length === 1
    && SHA256.test(values[0] ?? '')
    && values[0] === expectedSha256;
}
