import {P047_SOURCE,type P047State} from './alg-l06-p047-state-v1';
export const P047_CANVAS_SHA256='d959f374bb092f72efb20b8a80695539c681edbcbc0ab5e55d4f79483fe7eaf7';
type Request={frame:number;lang:'en';seed:0};
type Resolved={frameDomain:string;localFrame:number;rootFrame:number;lang:string;visualOnly:boolean;audioRendered:boolean};
export interface P047CanvasAssetV1 {
  ready():Promise<unknown>;
  resolveFrameState(request:Request):Resolved;
  render(canvas:HTMLCanvasElement,request:Request):Resolved;
}
export function p047CommitCanvas(asset:P047CanvasAssetV1,canvas:HTMLCanvasElement,state:P047State):Resolved {
  if(state.phase==='left'||!Number.isInteger(state.mainFrame)||state.mainFrame<1||state.mainFrame>P047_SOURCE.endFrame)
    throw Error('P047_INVALID_SOURCE_FRAME');
  if(canvas.width!==800||canvas.height!==600)throw Error('P047_INVALID_CANVAS_SIZE');
  const request:Request={frame:state.mainFrame,lang:'en',seed:0};
  const resolved=asset.resolveFrameState(request);
  if(resolved.frameDomain!=='sprite-117'||resolved.localFrame!==state.mainFrame||resolved.rootFrame!==6||
    resolved.lang!=='en'||!resolved.visualOnly||resolved.audioRendered)throw Error('P047_CANVAS_RESOLUTION_DRIFT');
  const rendered=asset.render(canvas,request);
  if(rendered.localFrame!==state.mainFrame||canvas.getAttribute('data-flash-frame')!==String(state.mainFrame))
    throw Error('P047_CANVAS_READBACK_DRIFT');
  return rendered;
}
