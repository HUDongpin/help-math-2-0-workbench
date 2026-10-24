import {P046_SOURCE,type P046State} from './alg-l06-p046-state-v1';
export const P046_CANVAS_SHA256='888a3e9f41e236eda7b4d0fe9c04a0aaa38d9e12bdbdbe844cc6d1e12a5272d6';
type Request={frame:number;lang:'en';seed:0};
type Resolved={frameDomain:string;localFrame:number;rootFrame:number;lang:string;visualOnly:boolean;audioRendered:boolean};
export interface P046CanvasAssetV1 {
  ready():Promise<unknown>;
  resolveFrameState(request:Request):Resolved;
  render(canvas:HTMLCanvasElement,request:Request):Resolved;
}
export function p046CommitCanvas(asset:P046CanvasAssetV1,canvas:HTMLCanvasElement,state:P046State):Resolved {
  if(state.phase==='left'||!Number.isInteger(state.mainFrame)||state.mainFrame<1||state.mainFrame>P046_SOURCE.endFrame)
    throw Error('P046_INVALID_SOURCE_FRAME');
  if(canvas.width!==800||canvas.height!==600)throw Error('P046_INVALID_CANVAS_SIZE');
  const request:Request={frame:state.mainFrame,lang:'en',seed:0};
  const resolved=asset.resolveFrameState(request);
  if(resolved.frameDomain!=='sprite-123'||resolved.localFrame!==state.mainFrame||resolved.rootFrame!==6||
    resolved.lang!=='en'||!resolved.visualOnly||resolved.audioRendered)throw Error('P046_CANVAS_RESOLUTION_DRIFT');
  const rendered=asset.render(canvas,request);
  if(rendered.localFrame!==state.mainFrame||canvas.getAttribute('data-flash-frame')!==String(state.mainFrame))
    throw Error('P046_CANVAS_READBACK_DRIFT');
  return rendered;
}
