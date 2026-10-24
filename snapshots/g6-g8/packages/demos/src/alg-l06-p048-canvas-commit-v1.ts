// Source-state binding to the frozen P048 visual asset.
import {P048_SOURCE,type P048State} from './alg-l06-p048-state-v1';

export type P048CanvasRequestV1={frame:number;lang:'en';seed:0;
  feedback?:{spriteId:217|304;localFrame:number;wrongAttempt?:0|1}};
export type P048ResolvedFrameV1={frameDomain:string;localFrame:number;
  rootFrame:number;lang:string;visualOnly:boolean;audioRendered:boolean;
  feedback:null|{spriteId:number;localFrame:number}};
export interface P048CanvasAssetV1{
  ready():Promise<unknown>;
  resolveFrameState(request:P048CanvasRequestV1):P048ResolvedFrameV1;
  render(canvas:HTMLCanvasElement,request:P048CanvasRequestV1):P048ResolvedFrameV1;
}

export const P048_CANVAS_ASSET_ID = P048_SOURCE.animationId;
export const P048_CANVAS_ASSET_SHA256 =
  'a27fa6d830bab0f90c653e62f89e069c2301b570a7e34e309592bbf552e0733f';

export function p048VisualRequest(state:P048State):P048CanvasRequestV1 {
  if (!state || state.phase === 'left' ||
      !Number.isSafeInteger(state.mainFrame) ||
      state.mainFrame < 1 || state.mainFrame > P048_SOURCE.lastFrame)
    throw new Error('P048_INVALID_SOURCE_FRAME');
  const request:P048CanvasRequestV1 = {frame: state.mainFrame, lang: 'en', seed: 0};
  const feedback = state.feedback;
  const feedbackPhase = ['wrong-feedback-playing', 'wrong-feedback-held',
    'wrong-feedback-tail', 'right-feedback-playing'].includes(state.phase);
  if (feedbackPhase !== Boolean(feedback) ||
      (state.phase === 'nmh-popup' && !state.nmhPopupVisible))
    throw new Error('P048_INCONSISTENT_SOURCE_STATE');
  if (feedback) {
    if (state.mainFrame !== P048_SOURCE.quizFrame ||
        ((state.phase === 'right-feedback-playing') !==
         (feedback.kind === 'right')) ||
        !Number.isSafeInteger(feedback.frame) ||
        !((feedback.kind === 'wrong' && feedback.spriteId === 304 &&
           feedback.frame >= 2 && feedback.frame <= P048_SOURCE.wrongTerminalFrame) ||
          (feedback.kind === 'right' && feedback.spriteId === 217 &&
           feedback.frame >= 2 && feedback.frame <= P048_SOURCE.rightTerminalFrame)))
      throw new Error('P048_UNREACHABLE_FEEDBACK_FRAME');
    request.feedback = {spriteId: feedback.spriteId, localFrame: feedback.frame,
      ...(feedback.kind==='wrong'?{wrongAttempt:state.quizTryCount}:{})};
  }
  // P048's source Canvas export does not expose an NMH popup selector.
  // The source-bound native companion owns the reachable popup controls.
  if (state.nmhPopupVisible && state.mainFrame !== P048_SOURCE.quizFrame)
    throw new Error('P048_UNREACHABLE_NMH_POPUP');
  return request;
}

export function p048CommitCanvas(asset:P048CanvasAssetV1,
  canvas:HTMLCanvasElement,state:P048State):P048ResolvedFrameV1 {
  if (!asset || typeof asset.resolveFrameState !== 'function' ||
      typeof asset.render !== 'function')
    throw new Error('P048_CANVAS_ASSET_UNAVAILABLE');
  if (!canvas || canvas.width !== 800 || canvas.height !== 600 ||
      typeof canvas.getContext !== 'function')
    throw new Error('P048_CANVAS_SIZE_OR_CONTEXT');
  const request = p048VisualRequest(state);
  const resolved = asset.resolveFrameState(request);
  if (resolved.frameDomain !== 'sprite-348' ||
      resolved.localFrame !== state.mainFrame ||
      resolved.rootFrame !== 6 || resolved.lang !== 'en' ||
      resolved.visualOnly !== true || resolved.audioRendered !== false ||
      (resolved.feedback?.spriteId ?? null) !== (state.feedback?.spriteId ?? null) ||
      (resolved.feedback?.localFrame ?? null) !== (state.feedback?.frame ?? null))
    throw new Error('P048_CANVAS_RESOLUTION_DRIFT');
  const rendered = asset.render(canvas, request);
  if (rendered !== resolved &&
      (rendered?.localFrame !== resolved.localFrame ||
       rendered?.frameDomain !== resolved.frameDomain))
    throw new Error('P048_CANVAS_RENDER_DRIFT');
  if (typeof canvas.getAttribute === 'function' &&
      (canvas.getAttribute('data-flash-frame') !== String(state.mainFrame) ||
       canvas.getAttribute('data-p048-feedback-sprite') !==
         (state.feedback ? String(state.feedback.spriteId) : 'none') ||
       canvas.getAttribute('data-p048-feedback-frame') !==
         (state.feedback ? String(state.feedback.frame) : 'none')))
    throw new Error('P048_CANVAS_READBACK_DRIFT');
  return resolved;
}
