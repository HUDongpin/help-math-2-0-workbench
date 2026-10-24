// Source-state binding to the frozen P049 visual asset.
import {P049_SOURCE,type P049State} from './alg-l06-p049-state-v1';

export type P049CanvasRequestV1={frame:number;lang:'en';seed:0;
  feedback?:{spriteId:192|302;localFrame:number;wrongAttempt?:0|1}};
export type P049ResolvedFrameV1={frameDomain:string;localFrame:number;
  rootFrame:number;lang:string;visualOnly:boolean;audioRendered:boolean;
  feedback:null|{spriteId:number;localFrame:number}};
export interface P049CanvasAssetV1{
  ready():Promise<unknown>;
  resolveFrameState(request:P049CanvasRequestV1):P049ResolvedFrameV1;
  render(canvas:HTMLCanvasElement,request:P049CanvasRequestV1):P049ResolvedFrameV1;
}

export const P049_CANVAS_ASSET_ID = P049_SOURCE.animationId;
export const P049_CANVAS_ASSET_SHA256 =
  '298611af1cccf27353df77f9b4d7b4fdbebe7992e1d0950c974dba83a85fc3d3';

export function p049VisualRequest(state:P049State):P049CanvasRequestV1 {
  if (!state || state.phase === 'left' ||
      !Number.isSafeInteger(state.mainFrame) ||
      state.mainFrame < 1 || state.mainFrame > P049_SOURCE.mainFrames)
    throw new Error('P049_INVALID_SOURCE_FRAME');
  const request:P049CanvasRequestV1 = {frame: state.mainFrame, lang: 'en', seed: 0};
  const feedback = state.feedback;
  const feedbackPhase = ['wrong-feedback-playing', 'wrong-feedback-held',
    'wrong-feedback-tail', 'right-feedback-playing'].includes(state.phase);
  if (feedbackPhase !== Boolean(feedback) ||
      (state.phase === 'nmh-popup' && !state.nmhPopupVisible))
    throw new Error('P049_INCONSISTENT_SOURCE_STATE');
  if (feedback) {
    if (state.mainFrame !== P049_SOURCE.quizFrame ||
        ((state.phase === 'right-feedback-playing') !==
         (feedback.kind === 'right')) ||
        !Number.isSafeInteger(feedback.frame) ||
        !((feedback.kind === 'wrong' && feedback.spriteId === 302 &&
           feedback.frame >= 2 && feedback.frame <= P049_SOURCE.wrong.terminalFrame) ||
          (feedback.kind === 'right' && feedback.spriteId === 192 &&
           feedback.frame >= 2 && feedback.frame <= P049_SOURCE.right.terminalFrame)))
      throw new Error('P049_UNREACHABLE_FEEDBACK_FRAME');
    request.feedback = {spriteId: feedback.spriteId as 192|302, localFrame: feedback.frame,
      ...(feedback.kind==='wrong'?{wrongAttempt:state.quizTryCount}:{})};
  }
  // P049's source Canvas export does not expose an NMH popup selector.
  // The source-bound native companion owns the reachable popup controls.
  if (state.nmhPopupVisible && state.mainFrame !== P049_SOURCE.quizFrame)
    throw new Error('P049_UNREACHABLE_NMH_POPUP');
  return request;
}

export function p049CommitCanvas(asset:P049CanvasAssetV1,
  canvas:HTMLCanvasElement,state:P049State):P049ResolvedFrameV1 {
  if (!asset || typeof asset.resolveFrameState !== 'function' ||
      typeof asset.render !== 'function')
    throw new Error('P049_CANVAS_ASSET_UNAVAILABLE');
  if (!canvas || canvas.width !== 800 || canvas.height !== 600 ||
      typeof canvas.getContext !== 'function')
    throw new Error('P049_CANVAS_SIZE_OR_CONTEXT');
  const request = p049VisualRequest(state);
  const resolved = asset.resolveFrameState(request);
  if (resolved.frameDomain !== 'sprite-327' ||
      resolved.localFrame !== state.mainFrame ||
      resolved.rootFrame !== 6 || resolved.lang !== 'en' ||
      resolved.visualOnly !== true || resolved.audioRendered !== false ||
      (resolved.feedback?.spriteId ?? null) !== (state.feedback?.spriteId ?? null) ||
      (resolved.feedback?.localFrame ?? null) !== (state.feedback?.frame ?? null))
    throw new Error('P049_CANVAS_RESOLUTION_DRIFT');
  const rendered = asset.render(canvas, request);
  if (rendered !== resolved &&
      (rendered?.localFrame !== resolved.localFrame ||
       rendered?.frameDomain !== resolved.frameDomain))
    throw new Error('P049_CANVAS_RENDER_DRIFT');
  if (typeof canvas.getAttribute === 'function' &&
      (canvas.getAttribute('data-flash-frame') !== String(state.mainFrame) ||
       canvas.getAttribute('data-p049-feedback-sprite') !==
         (state.feedback ? String(state.feedback.spriteId) : 'none') ||
       canvas.getAttribute('data-p049-feedback-frame') !==
         (state.feedback ? String(state.feedback.frame) : 'none')))
    throw new Error('P049_CANVAS_READBACK_DRIFT');
  return resolved;
}
