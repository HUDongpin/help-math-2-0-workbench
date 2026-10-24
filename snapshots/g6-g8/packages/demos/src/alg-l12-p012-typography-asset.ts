import type {P012TypographyAsset} from './alg-l12-p012-typography-renderer';
const ID = 'shared-alg001-l12-p012';
export type P012AssetRecord = Readonly<{name: string; sha256: string; bytes: number; contentType: string}>;
export type P012Assets = readonly P012AssetRecord[];
export const p012AssetPath = (assets: P012Assets, name: string) => {
  const records = assets.filter(item => item.name === name);
  if (records.length !== 1 || !/^[a-f0-9]{64}$/.test(records[0].sha256)) throw Error('P012 resource identity');
  return `/flash-assets/g678-local/${ID}/${name}?sha256=${records[0].sha256}`;
};
const pendingAssets = new Map<string, Promise<P012TypographyAsset>>();
export function loadP012Typography(assets: P012Assets): Promise<P012TypographyAsset> {
  if (process.env.NODE_ENV === 'production') return Promise.reject(Error('Local P012 renderer only'));
  const url = p012AssetPath(assets, 'typography.js');
  const existing = pendingAssets.get(url); if (existing) return existing;
  const promise = new Promise<P012TypographyAsset>((resolve, reject) => {
    const script = document.createElement('script');
    const hash = assets.find(item => item.name === 'typography.js')!.sha256;
    script.src = url; script.crossOrigin = 'anonymous';
    script.integrity = 'sha256-' + btoa(String.fromCharCode(...hash.match(/../g)!.map(part => parseInt(part, 16))));
    const timer = window.setTimeout(() => {script.remove(); reject(Error('P012 illustration load timeout'));}, 15000);
    const finish = () => {clearTimeout(timer); script.onload = null; script.onerror = null; script.remove();};
    script.onerror = () => {finish(); reject(Error('P012 illustration unavailable'));};
    script.onload = () => {
      finish();
      const asset = (globalThis as unknown as {HELP_MATH_P012_TYPOGRAPHY?: P012TypographyAsset}).HELP_MATH_P012_TYPOGRAPHY;
      if (!asset || typeof asset.renderIntro !== 'function' || typeof asset.renderInteractive !== 'function') {
        reject(Error('P012 illustration contract')); return;
      }
      void asset.ready().then(() => resolve(asset), reject);
    };
    document.head.append(script);
  }).catch(error => {pendingAssets.delete(url); throw error;});
  pendingAssets.set(url, promise); return promise;
}

