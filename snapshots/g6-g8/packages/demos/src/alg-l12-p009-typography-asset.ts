import meta from '../../../migrations/shared-alg001-l12-p009/typography-v1/runtime-meta.json';

export interface P009TypographyAsset {
  readonly metadata: {readonly animationId: string; readonly sourceSwfSha256: string;
    readonly renderScale: number; readonly requiredCanvas: {readonly width: number; readonly height: number}};
  ready(): Promise<void>;
  render(canvas: HTMLCanvasElement, request: Record<string, unknown>): Record<string, unknown>;
  renderWithText(canvas: HTMLCanvasElement, request: Record<string, unknown>): {
    state: Record<string, unknown>;
    suppressedInstanceIds: readonly string[];
    unfulfilledSuppressionIds: readonly string[];
  };
}
declare global {
  interface Window {HELP_MATH_P009_TYPOGRAPHY_ASSETS?: Record<string, P009TypographyAsset>;}
}
let pending: Promise<P009TypographyAsset> | undefined;

/** Both SRI and the local route bind this exact generated adapter. */
export function loadP009TypographyAsset(): Promise<P009TypographyAsset> {
  if (process.env.NODE_ENV === 'production') return Promise.reject(Error('P009 local typography only'));
  if (pending) return pending;
  pending = (async () => {
    const previous = window.HELP_MATH_P009_TYPOGRAPHY_ASSETS;
    if (previous && Object.prototype.hasOwnProperty.call(previous, meta.animationId)) {
      if (!Object.getOwnPropertyDescriptor(previous, meta.animationId)?.configurable ||
        !Reflect.deleteProperty(previous, meta.animationId)) throw Error('P009 stale asset cannot be replaced');
    }
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `/flash-assets/g678-local/${meta.animationId}/typography-renderer.js?sha256=${meta.runtimeSha256}`;
      script.integrity = 'sha256-' + btoa(String.fromCharCode(...meta.runtimeSha256.match(/../g)!.map(part => parseInt(part, 16))));
      script.crossOrigin = 'anonymous';
      script.onload = () => {script.remove(); resolve();};
      script.onerror = () => {script.remove(); reject(Error('P009 typography asset unavailable'));};
      document.head.append(script);
    });
    const asset = window.HELP_MATH_P009_TYPOGRAPHY_ASSETS?.[meta.animationId];
    if (!asset || asset.metadata.animationId !== meta.animationId ||
      asset.metadata.sourceSwfSha256 !== meta.sourceSha256 || asset.metadata.renderScale !== 2 ||
      asset.metadata.requiredCanvas?.width !== 1600 || asset.metadata.requiredCanvas?.height !== 1200 ||
      typeof asset.renderWithText !== 'function') throw Error('P009 typography identity mismatch');
    await asset.ready();
    return asset;
  })().catch(error => {pending = undefined; throw error;});
  return pending;
}
