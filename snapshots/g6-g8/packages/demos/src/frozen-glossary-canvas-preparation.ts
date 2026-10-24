import {buildCanvasAssetRequest, type SourceStaticCanvasCandidateConfig} from './source-static-canvas-candidate';

type Config = Pick<SourceStaticCanvasCandidateConfig, 'animationId' | 'assetSource' | 'assetSha256' | 'sourceSwfSha256'>;
type Prepared = Readonly<{animationId: string; sourceSwfSha256: string; assetSha256: string; loaderAwaitedReady: true}>;
const pending = new Map<string, Promise<Prepared>>();

/** Admit the module only after the same hash-bound Canvas script and its images
 * are ready. The existing Canvas renderer still verifies and paints each frame.
 * This gate does not change a source frame, timeline, sound or host action. */
export function prepareFrozenGlossaryCanvas(config: Config): Promise<Prepared> {
  if (typeof document === 'undefined') return Promise.reject(new Error('Frozen glossary preparation requires a browser document'));
  if (!config.assetSha256 || !/^[a-f0-9]{64}$/u.test(config.assetSha256) || !/^[a-f0-9]{64}$/u.test(config.sourceSwfSha256)) {
    return Promise.reject(new Error('Exact source and Canvas hashes are required'));
  }
  const request=buildCanvasAssetRequest(config);
  const expected=new URL(request.src, document.baseURI);
  if (expected.origin !== location.origin || expected.pathname !== `/flash-assets/g678-local/${config.animationId}/canvas-renderer.js`) {
    return Promise.reject(new Error('Frozen glossary Canvas must use the exact same-origin local route'));
  }
  const key=`${request.key}:${config.sourceSwfSha256}`;
  const prior=pending.get(key);if(prior)return prior;
  const run=async():Promise<Prepared>=>{
    const selector=`script[data-help-math-canvas-asset="${config.animationId}"]`;
    const matches=document.querySelectorAll<HTMLScriptElement>(selector);
    if(matches.length>1)throw new Error('Ambiguous Canvas script binding');
    let script=matches[0];
    const verifyScript=()=>{
      if(!script?.isConnected || script.src!==expected.href || script.integrity!==request.integrity || script.crossOrigin!==request.crossOrigin || script.dataset.helpMathCanvasSha256!==config.assetSha256) {
        throw new Error('Canvas script integrity binding changed');
      }
    };
    if(script)verifyScript();
    const registered=window.HELP_MATH_CANVAS_ASSETS?.[config.animationId];
    if(registered&&!script)throw new Error('Canvas registration has no exact script binding');
    if(!registered){
      // A different loader's pending script has no owned readiness promise.
      // Do not overwrite its handlers or infer that it completed successfully.
      if(script)throw new Error('Canvas script is already pending outside this preparation');
      script=document.createElement('script');script.async=true;
      script.dataset.helpMathCanvasAsset=config.animationId;script.dataset.helpMathCanvasSha256=config.assetSha256;
      script.integrity=request.integrity!;script.crossOrigin=request.crossOrigin!;script.src=expected.href;
      await new Promise<void>((resolve,reject)=>{
        const clear=()=>{script.onload=null;script.onerror=null;};
        script.onload=()=>{clear();resolve();};
        script.onerror=()=>{clear();script.remove();reject(new Error('Frozen glossary Canvas failed integrity or network loading'));};
        document.head.appendChild(script);
      });
    }
    verifyScript();
    const registry=window.HELP_MATH_CANVAS_ASSETS,descriptor=registry&&Object.getOwnPropertyDescriptor(registry,config.animationId);
    const asset=descriptor?.value;
    if(!asset||descriptor?.configurable!==false||descriptor.writable!==false||typeof asset.ready!=='function'||typeof asset.render!=='function'||
      asset.metadata?.animationId!==config.animationId||asset.metadata?.sourceSwfSha256!==config.sourceSwfSha256) {
      throw new Error('Frozen glossary Canvas immutable source identity mismatch');
    }
    await asset.ready();
    verifyScript();
    if(Object.getOwnPropertyDescriptor(window.HELP_MATH_CANVAS_ASSETS!,config.animationId)?.value!==asset)throw new Error('Canvas registration changed during preparation');
    return Object.freeze({animationId:config.animationId,sourceSwfSha256:config.sourceSwfSha256,assetSha256:config.assetSha256!,loaderAwaitedReady:true});
  };
  const promise=run().catch(error=>{pending.delete(key);throw error;});pending.set(key,promise);return promise;
}
