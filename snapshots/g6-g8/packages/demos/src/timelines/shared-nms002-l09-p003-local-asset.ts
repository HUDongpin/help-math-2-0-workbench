// Exact, unregistered v5 runtime loader for the private P003 host probe.
import type {NmsL09P003CanvasCandidate} from './shared-nms002-l09-p003-canvas-bridge';

export const NMS_L09_P003_ASSET = Object.freeze({
  key: 'course-shared-nms002-l09-p003',
  path: '/flash-assets/g678-local/shared-nms002-l09-p003/canvas-renderer.js',
  sha256: 'c03538f5fc07a5697a549f911b15c0aac1c7e4c8da62819188141bba001bad27',
  sourceSwfSha256: 'd6841b40ee8da4857ba9075944c2393ee214e056373fe10abd2f0c2b2a375ebd',
});

declare global {
  interface Window {
    HELP_MATH_P003_TEXT_CANDIDATES?: Record<string, NmsL09P003CanvasCandidate>;
  }
}

let pending: Promise<NmsL09P003CanvasCandidate> | undefined;

function verifiedAdapter(): NmsL09P003CanvasCandidate {
  const adapter = window.HELP_MATH_P003_TEXT_CANDIDATES?.[NMS_L09_P003_ASSET.key];
  if (!adapter || adapter.metadata.animationId !== NMS_L09_P003_ASSET.key ||
      adapter.metadata.classification !== 'private-root-held-nested-source-drawing-candidate-v1' ||
      adapter.metadata.sourceSwfSha256 !== NMS_L09_P003_ASSET.sourceSwfSha256 ||
      adapter.metadata.stage.width !== 800 || adapter.metadata.stage.height !== 600 ||
      typeof adapter.ready !== 'function' ||
      typeof adapter.render !== 'function' ||
      typeof adapter.renderWithText !== 'function') {
    throw new Error('P003 generated asset identity mismatch');
  }
  return adapter;
}

function integrityFromSha256(hex: string): string {
  let binary = '';
  for (let index = 0; index < hex.length; index += 2) {
    binary += String.fromCharCode(Number.parseInt(hex.slice(index, index + 2), 16));
  }
  return `sha256-${btoa(binary)}`;
}

export function loadNmsL09P003LocalAsset(): Promise<NmsL09P003CanvasCandidate> {
  if (typeof window === 'undefined' || location.protocol !== 'http:' ||
      !['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname)) {
    return Promise.reject(new Error('P003 asset requires a local HTTP preview'));
  }
  if (pending) return pending;
  const asset = NMS_L09_P003_ASSET;
  const src = `${asset.path}?sha256=${asset.sha256}`;
  const expected = new URL(src, location.origin).href;
  const integrity = integrityFromSha256(asset.sha256);
  const existing = document.querySelector<HTMLScriptElement>('script[data-help-math-p003-v5]');
  if (existing && (existing.src !== expected || existing.integrity !== integrity ||
      existing.crossOrigin !== 'anonymous')) {
    return Promise.reject(new Error('P003 script integrity binding mismatch'));
  }
  if (existing && !window.HELP_MATH_P003_TEXT_CANDIDATES?.[asset.key]) {
    return Promise.reject(new Error('P003 script exists without registration'));
  }
  if (existing) {
    try {
      const adapter = verifiedAdapter();
      return adapter.ready().then(() => adapter);
    } catch (error) {return Promise.reject(error);}
  }
  if (window.HELP_MATH_P003_TEXT_CANDIDATES?.[asset.key]) {
    return Promise.reject(new Error('P003 registration has no SRI-bound script'));
  }
  pending = new Promise<NmsL09P003CanvasCandidate>((resolve, reject) => {
    const script = document.createElement('script');
    script.dataset.helpMathP003V5 = 'true';
    script.async = true;
    script.integrity = integrity;
    script.crossOrigin = 'anonymous';
    script.src = src;
    script.onload = () => {
      try {
        const adapter = verifiedAdapter();
        void adapter.ready().then(() => resolve(adapter), reject);
      } catch (error) {reject(error);}
    };
    script.onerror = () => reject(new Error('P003 local Canvas runtime could not load'));
    document.head.appendChild(script);
  }).catch(error => {
    // A failed registration stays fail-closed even if the script executed.
    pending = undefined;
    document.querySelector('script[data-help-math-p003-v5]')?.remove();
    throw error;
  });
  return pending;
}
