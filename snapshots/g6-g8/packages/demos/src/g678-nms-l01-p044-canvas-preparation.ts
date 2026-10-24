import {P044_SOURCE_IMAGE_URIS,createP044PreparedSourceCanvasAdapter} from './generated/g678-nms-l01-p044-prepared-source-canvas-v2';
import type {P044MountVisual} from './g678-nms-l01-p044-candidate-view';
let prepared:Promise<P044MountVisual>|null=null;
/** Loading completion, not a source-authored pause. The module loader awaits
 * all actual decode promises before it admits the exact animation module. */
export function prepareP044CanvasMount():Promise<P044MountVisual>{
  if(typeof document==='undefined')return Promise.reject(new Error('P044 prepared rendering requires the browser document'));
  if(prepared)return prepared;
  prepared=Promise.all(Object.entries(P044_SOURCE_IMAGE_URIS).map(async([name,uri])=>{
    const image=document.createElement('img');image.src=uri as string;
    await image.decode();
    if(!image.complete||image.naturalWidth<1||image.naturalHeight<1||image.src!==uri)throw new Error(`P044 source resource failed decode: ${name}`);
    return[name,image] as const;
  })).then(entries=>{
    const images=Object.freeze(Object.fromEntries(entries));
    const mount:P044MountVisual=async(canvas:HTMLCanvasElement)=>{
      const adapter=createP044PreparedSourceCanvasAdapter(canvas,images);
      // This is already resolved resource state; no image creation or async
      // fetch/decode occurs on remount or Replay.
      return{render(query){adapter.render({rootFrame:6,mainFrame:query.mainFrame,
        instances:query.sourceContexts.map(context=>({path:context.instancePath.map(({parentDomain,depth,sourceObjectId,placementFrame})=>
          ({parentDomain,depth,sourceObjectId,placementFrame})),frame:context.frame,visible:context.visible}))});}};
    };
    return mount;
  });
  return prepared;
}
