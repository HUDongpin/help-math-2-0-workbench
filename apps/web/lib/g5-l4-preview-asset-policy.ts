import {G5_L4_EXECUTIVE_PREVIEW_SCENES} from './g5-l4-executive-preview-content';
import {
  currentJsShowcasePublication,
  G5_L4_SHOWCASE_RELEASE_ID,
  type CurrentJsShowcaseEnvironment,
} from './current-js-showcase-publication';

const SHA256 = /^[a-f0-9]{64}$/;
const G5_L4_SHOWCASE_SHELL_ANIMATION_ID =
  'shell-course-g05-l04-index-local';
const G5_L4_SHOWCASE_SHELL_ASSET_SHA256 = Object.freeze({
  'control-assets/lesson-shell-calculator-up.png':
    '890b013752a495d2561266a4a1b2ebd80de85bc0cb6412763e5ac926b87f8d94',
  'control-assets/lesson-shell-forward-up.png':
    'a485fe38c69c307ed1a2e4dc30964d248e3f3b7ddddc2f4828ed10144b6997df',
  'control-assets/lesson-shell-key-terms-up.png':
    '547c8d71f43ca314f1ad497f75bb9fec1c873c53c4315bbf1dcb0861629f6270',
  'control-assets/lesson-shell-map-up.png':
    '4229e324f4e8538dccd285d8dcd6aed8645009897abc0332932cf38358f036e1',
  'control-assets/lesson-shell-next-neutral-up.png':
    'bdcc6b1de9f36fb0f2fe322a7dbf56a42b05c0f5675698fe031fafa4ca9ad886',
  'control-assets/lesson-shell-pause-up.png':
    '18c5e0e5da7e6c992a5c0bf0ae7dcd7f92d4dd47fb2b9769b0bf5f8d9217b2d5',
  'control-assets/lesson-shell-play-up.png':
    '358a2aaac6e7ba756c913de6b9e8e6468a9a6b9e0e0a290d896bced97e3e7063',
  'control-assets/lesson-shell-previous-neutral-up.png':
    'bdcc6b1de9f36fb0f2fe322a7dbf56a42b05c0f5675698fe031fafa4ca9ad886',
  'control-assets/lesson-shell-replay-up.png':
    '7079f2329ddd27617534201b6c945d4a65266bdc0b61dec1b735992481f74b56',
  'control-assets/lesson-shell-rewind-up.png':
    'b8e515445e7f7f0216afa2726f96229e07a1338fdb3b8d754f1afc69987a5291',
  'control-assets/lesson-shell-spanish-page-audio-up.png':
    '166048633c189ba63c057aa00697f44216aab65d00a1f288af94f8b6a3dc58db',
  'control-assets/lesson-shell-volume-icon-up.png':
    '3cb9da43b2d5b1948905f2b974cc74384ffb53ac714414924c443cc664037c83',
  'control-assets/lesson-shell-volume-muted-icon-up.png':
    '742e70222227de4f64530337994f391a7884f5a6106b1a8ed9cff41a388164ee',
  'control-assets/lesson-shell-volume-slider-source-static.png':
    'e098126899d81da32e8cae04e1d363d7722a29eee2fec9e3b25c39a60e605986',
  'root-frames/frame-0049.png':
    '5782dad93302d435d0104e10bf0df8a953dda474ddca1bd1ffb13501d13ed34f',
  'root-frames/frame-0050.png':
    'fa7b1c355a763fdbdb4db2c5a4a2f007b2ad4b8cc4f04661746db3d0c1533ec6',
} as const);

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
  kind: 'runtime' | 'manifest' | 'other' | 'shell' | null;
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
  if (!hasSafeFlashAssetSegments(asset) || asset.length < 3) {
    return Object.freeze({
      controlled: false,
      animationId: null,
      kind: null,
      expectedRuntimeSha256: null
    });
  }
  const [collection, animationId, ...remainder] = asset;
  if (
    collection === 'courses'
    && animationId === G5_L4_SHOWCASE_SHELL_ANIMATION_ID
    && getExactG5L4ShowcaseShellAssetSha256(remainder)
  ) {
    return Object.freeze({
      controlled: true,
      animationId,
      kind: 'shell' as const,
      expectedRuntimeSha256:
        getExactG5L4ShowcaseShellAssetSha256(remainder)
    });
  }
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

function getExactG5L4ShowcaseShellAssetSha256(
  remainder: readonly string[]
) {
  if (remainder.length !== 2) return null;
  const key = remainder.join('/') as keyof
    typeof G5_L4_SHOWCASE_SHELL_ASSET_SHA256;
  return G5_L4_SHOWCASE_SHELL_ASSET_SHA256[key] ?? null;
}

export function isG5L4ShowcaseAssetSegments(asset: readonly string[]) {
  const classification = classifyG5L4PreviewAsset(asset);
  return classification.controlled
    && (classification.kind === 'runtime' || classification.kind === 'shell');
}

export function isG5L4ShowcaseAssetPath(pathname: string) {
  const prefix = '/flash-assets/';
  return pathname.startsWith(prefix)
    && isG5L4ShowcaseAssetSegments(
      pathname.slice(prefix.length).split('/')
    );
}

export function isG5L4ShowcaseAssetAuthorized(
  env: CurrentJsShowcaseEnvironment = process.env
) {
  return currentJsShowcasePublication(
    G5_L4_SHOWCASE_RELEASE_ID,
    env
  ).enabled;
}

export function isG5L4PreviewAssetAuthorized({
  developmentAudit,
  showcaseEnabled,
  showcaseAsset,
}: {
  developmentAudit: boolean;
  showcaseEnabled: boolean;
  showcaseAsset: boolean;
}) {
  return developmentAudit || (showcaseEnabled && showcaseAsset);
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
