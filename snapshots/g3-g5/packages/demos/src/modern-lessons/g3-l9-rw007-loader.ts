import type {LessonCanvasPlaneAdapter} from '../lesson-canvas-plane';
import {buildCanvasAssetRequest} from '../source-static-canvas-candidate';
import {RW007} from './g3-l9-rw007-config';
import {RW007_SCENE} from './generated/g3-l9-rw007-scene-v1';
const loads = new Map<string,Promise<LessonCanvasPlaneAdapter>>();
const registry = () => (globalThis as typeof globalThis & {HELP_MATH_HD_CANVAS_ASSETS?:Record<string,LessonCanvasPlaneAdapter>}).HELP_MATH_HD_CANVAS_ASSETS;

/** Callback references are removed on both success and failure. This is an
 * asset lifecycle promise; it creates no animation clock, interval or listener. */
export function loadRw007Scene():Promise<LessonCanvasPlaneAdapter> {
  const request=buildCanvasAssetRequest({animationId:RW007_SCENE.variantId,assetSource:RW007_SCENE.url,assetSha256:RW007_SCENE.sha256});
  const prior=loads.get(request.key);if(prior)return prior;
  const promise=new Promise<LessonCanvasPlaneAdapter>((resolve,reject)=>{
    const existing=document.querySelector<HTMLScriptElement>(`script[data-rw007-scene="${RW007_SCENE.variantId}"]`);
    const exact=existing?.src===new URL(request.src,document.baseURI).href && existing.integrity===request.integrity &&
      existing.crossOrigin===request.crossOrigin && existing.dataset.rw007SceneSha256===RW007_SCENE.sha256;
    if(existing && !exact){reject(Error('RW007 script integrity binding changed'));return;}
    const script=existing??document.createElement('script');
    const clear=()=>{script.onload=null;script.onerror=null;};
    const fail=(error:unknown)=>{clear();if(!existing)script.remove();reject(error);};
    const finish=async()=>{
      clear();
      try {
        const adapter=registry()?.[RW007_SCENE.variantId];
        if(!adapter || adapter.metadata.animationId!==RW007.animationId || adapter.metadata.sourceSwfSha256!==RW007.sourceSwfSha256 ||
          typeof adapter.renderWithText!=='function' || adapter.metadata.resolution?.mode!=='adaptive-integer' ||
          adapter.metadata.resolution.nativeWidth!==800 || adapter.metadata.resolution.nativeHeight!==600) throw Error('RW007 scene source binding mismatch');
        await adapter.ready();resolve(adapter);
      }catch(error){fail(error);}
    };
    if(registry()?.[RW007_SCENE.variantId]) {
      if(!exact){reject(Error('RW007 scene has no exact loaded script provenance'));return;}
      void finish();return;
    }
    script.onload=()=>{void finish();};script.onerror=()=>fail(Error('RW007 scene could not load'));
    if(!existing){script.async=true;script.dataset.rw007Scene=RW007_SCENE.variantId;script.dataset.rw007SceneSha256=RW007_SCENE.sha256;
      script.integrity=request.integrity!;script.crossOrigin=request.crossOrigin;script.src=request.src;document.head.appendChild(script);}
  }).catch(error=>{loads.delete(request.key);throw error;});
  loads.set(request.key,promise);return promise;
}
