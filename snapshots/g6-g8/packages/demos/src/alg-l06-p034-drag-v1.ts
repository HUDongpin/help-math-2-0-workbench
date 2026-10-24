/** P034 page-owned drag state. Hit range and keyboard steps are modern policy,
 * not measurements of Flash MovieClip._width or the authored hit polygon. */
export const P034_GRAPH={stageX:385.2,stageY:278.55,
  scale:1.04998779296875,firstFrame:433,lastFrame:434} as const;
export const P034_ENGINEERING_INPUT={
  hitLocal:{left:-80,right:80,top:-80,bottom:80},
  lineLocal:{left:-70,right:70},keyboardStep:5,
  provenance:'modern-engineering-range-not-original-runtime' as const,
} as const;

export interface P034DragState {
  frame:number;
  replayToken:number;
  visible:boolean;
  xGraphLocalPixels:number;
  pointerId:number|null;
}
const INITIAL_X=0.2; // source Mc_Line placement transX=4 twips
const validFrame=(frame:number)=>Number.isSafeInteger(frame)&&frame>=1&&frame<=434;
const inGraph=(frame:number)=>frame>=P034_GRAPH.firstFrame&&frame<=P034_GRAPH.lastFrame;
const clamp=(x:number)=>Math.max(P034_ENGINEERING_INPUT.lineLocal.left,
  Math.min(P034_ENGINEERING_INPUT.lineLocal.right,x));

export function p034InitialDrag(frame:number,replayToken=0):P034DragState {
  if(!validFrame(frame)||!Number.isSafeInteger(replayToken)||replayToken<0)
    throw new RangeError('P034_INVALID_FRAME_OR_REPLAY');
  return {frame,replayToken,visible:false,xGraphLocalPixels:INITIAL_X,pointerId:null};
}

/** Prop frame is authoritative. Regression or Replay retires the old line. */
export function p034SyncDrag(state:P034DragState,frame:number,
  replayToken:number):P034DragState {
  if(!validFrame(frame)||!Number.isSafeInteger(replayToken)||replayToken<0)
    throw new RangeError('P034_INVALID_FRAME_OR_REPLAY');
  if(frame===state.frame&&replayToken===state.replayToken)return state;
  if(replayToken!==state.replayToken||frame<state.frame||!inGraph(frame))
    return p034InitialDrag(frame,replayToken);
  // Source graph persists at 434, but a gesture belongs to one exact frame.
  return {...state,frame,replayToken,pointerId:null};
}

export function p034StageToGraph(stageX:number,stageY:number){
  if(!Number.isFinite(stageX)||!Number.isFinite(stageY))
    throw new RangeError('P034_NONFINITE_POINTER');
  return {x:(stageX-P034_GRAPH.stageX)/P034_GRAPH.scale,
    y:(stageY-P034_GRAPH.stageY)/P034_GRAPH.scale};
}
export function p034ClientToStage(clientX:number,clientY:number,
  rect:{left:number;top:number;width:number;height:number}){
  if(!Number.isFinite(clientX)||!Number.isFinite(clientY)||
    !Number.isFinite(rect.left)||!Number.isFinite(rect.top)||
    !Number.isFinite(rect.width)||!Number.isFinite(rect.height)||
    rect.width<=0||rect.height<=0)throw new RangeError('P034_INVALID_CANVAS_RECT');
  return {x:(clientX-rect.left)*800/rect.width,
    y:(clientY-rect.top)*600/rect.height};
}
function inEngineeringHit(x:number,y:number){
  const hit=P034_ENGINEERING_INPUT.hitLocal;
  return hit.left<=x&&x<=hit.right&&hit.top<=y&&y<=hit.bottom;
}
export function p034PointerDown(state:P034DragState,pointerId:number,
  stageX:number,stageY:number):P034DragState {
  if(!inGraph(state.frame)||state.pointerId!==null||
    !Number.isSafeInteger(pointerId)||pointerId<0)return state;
  const local=p034StageToGraph(stageX,stageY);
  if(!inEngineeringHit(local.x,local.y))return state;
  return {...state,visible:true,xGraphLocalPixels:clamp(local.x),pointerId};
}
export function p034PointerMove(state:P034DragState,pointerId:number,
  stageX:number):P034DragState {
  if(state.pointerId!==pointerId||!inGraph(state.frame))return state;
  return {...state,xGraphLocalPixels:clamp(p034StageToGraph(stageX,P034_GRAPH.stageY).x)};
}
export function p034PointerEnd(state:P034DragState,pointerId:number):P034DragState {
  return state.pointerId===pointerId?{...state,pointerId:null}:state;
}
/** Cancelling capture stops movement and leaves the last shown line in place. */
export const p034PointerCancel=p034PointerEnd;

export function p034Keyboard(state:P034DragState,key:string):P034DragState {
  if(!inGraph(state.frame))return state;
  if(key==='Escape')return {...state,visible:false,xGraphLocalPixels:INITIAL_X,pointerId:null};
  if(key==='Enter'||key===' ')return {...state,visible:true,pointerId:null};
  const x=state.visible?state.xGraphLocalPixels:INITIAL_X;
  if(key==='ArrowLeft')return {...state,visible:true,xGraphLocalPixels:clamp(x-P034_ENGINEERING_INPUT.keyboardStep),pointerId:null};
  if(key==='ArrowRight')return {...state,visible:true,xGraphLocalPixels:clamp(x+P034_ENGINEERING_INPUT.keyboardStep),pointerId:null};
  if(key==='Home')return {...state,visible:true,xGraphLocalPixels:P034_ENGINEERING_INPUT.lineLocal.left,pointerId:null};
  if(key==='End')return {...state,visible:true,xGraphLocalPixels:P034_ENGINEERING_INPUT.lineLocal.right,pointerId:null};
  return state;
}

export function p034CleanupDrag(state:P034DragState):P034DragState {
  return p034InitialDrag(state.frame,state.replayToken);
}
