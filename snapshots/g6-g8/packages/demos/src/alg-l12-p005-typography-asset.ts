import meta from '../../../migrations/shared-alg001-l12-p005/typography-v1/runtime-meta.json';

export interface P005TypographyAsset {
  readonly metadata: {readonly animationId: string; readonly sourceSwfSha256: string};
  ready(): Promise<void>;
  render(canvas: HTMLCanvasElement, request: Record<string, unknown>): Record<string, unknown>;
  renderWithText(canvas: HTMLCanvasElement, request: Record<string, unknown>): {
    state: Record<string, unknown>;
    suppressedInstanceIds: readonly string[];
    unfulfilledSuppressionIds: readonly string[];
  };
}
declare global {
  interface Window {HELP_MATH_P005_TYPOGRAPHY_ASSETS?: Record<string, P005TypographyAsset>;}
}
let pending: Promise<P005TypographyAsset> | undefined;

/** Browser SRI and the private route independently bind the generated adapter. */
export function loadP005TypographyAsset(): Promise<P005TypographyAsset> {
  if (process.env.NODE_ENV === 'production') return Promise.reject(Error('P005 local typography only'));
  if (pending) return pending;
  pending = (async () => {
    // A global left by an older development build is not a hash attestation.
    // Only this module's successful SRI load is cached by the pending promise.
    const previousRegistry = window.HELP_MATH_P005_TYPOGRAPHY_ASSETS;
    if (previousRegistry && Object.prototype.hasOwnProperty.call(previousRegistry, meta.animationId)) {
      if (!Object.getOwnPropertyDescriptor(previousRegistry, meta.animationId)?.configurable ||
        !Reflect.deleteProperty(previousRegistry, meta.animationId)) {
        throw Error('P005 stale typography asset cannot be replaced');
      }
    }
    await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `/flash-assets/g678-local/${meta.animationId}/typography-renderer.js?sha256=${meta.runtimeSha256}`;
        script.integrity = 'sha256-' + btoa(String.fromCharCode(...meta.runtimeSha256.match(/../g)!.map(part => parseInt(part, 16))));
        script.crossOrigin = 'anonymous';
        script.onload = () => {script.remove(); resolve();};
        script.onerror = () => {script.remove(); reject(Error('P005 typography asset unavailable'));};
        document.head.append(script);
    });
    const asset = window.HELP_MATH_P005_TYPOGRAPHY_ASSETS?.[meta.animationId];
    if (!asset || asset.metadata.animationId !== meta.animationId ||
      asset.metadata.sourceSwfSha256 !== meta.sourceSwfSha256 ||
      typeof asset.renderWithText !== 'function') throw Error('P005 typography identity mismatch');
    await asset.ready();
    return asset;
  })().catch(error => {pending = undefined; throw error;});
  return pending;
}
