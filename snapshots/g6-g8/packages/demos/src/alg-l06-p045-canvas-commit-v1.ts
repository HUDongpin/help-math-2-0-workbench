// Source-state binding to the frozen P045 visual asset.
import {P045_SOURCE,type P045State} from './alg-l06-p045-state-v1';

export type P045CanvasRequestV1={frame:number;lang:'en';seed:0;
  feedback?:{spriteId:220|307;localFrame:number}};
export type P045ResolvedFrameV1={frameDomain:string;localFrame:number;
  rootFrame:number;lang:string;visualOnly:boolean;audioRendered:boolean;
  feedback:null|{spriteId:number;localFrame:number}};
export interface P045CanvasAssetV1{
  ready():Promise<unknown>;
  resolveFrameState(request:P045CanvasRequestV1):P045ResolvedFrameV1;
  render(canvas:HTMLCanvasElement,request:P045CanvasRequestV1):P045ResolvedFrameV1;
}

export const P045_CANVAS_ASSET_ID = P045_SOURCE.animationId;
export const P045_CANVAS_ASSET_SHA256 =
  '4e9e318fdd503275e8d89b1b462b7e525888f0b0c14ecad3d6c114d18c7d5bc0';

export function p045VisualRequest(state:P045State):P045CanvasRequestV1 {
  if (!state || state.phase === 'left' ||
      !Number.isSafeInteger(state.mainFrame) ||
      state.mainFrame < 1 || state.mainFrame > P045_SOURCE.lastFrame)
    throw new Error('P045_INVALID_SOURCE_FRAME');
  const request:P045CanvasRequestV1 = {frame: state.mainFrame, lang: 'en', seed: 0};
  const feedback = state.feedback;
  const feedbackPhase = ['wrong-feedback-playing', 'wrong-feedback-held',
    'wrong-feedback-tail', 'right-feedback-playing'].includes(state.phase);
  if (feedbackPhase !== Boolean(feedback) ||
      (state.phase === 'nmh-popup' && !state.nmhPopupVisible))
    throw new Error('P045_INCONSISTENT_SOURCE_STATE');
  if (feedback) {
    if (state.mainFrame !== P045_SOURCE.quizFrame ||
        ((state.phase === 'right-feedback-playing') !==
         (feedback.kind === 'right')) ||
        !Number.isSafeInteger(feedback.frame) ||
        !((feedback.kind === 'wrong' && feedback.spriteId === 307 &&
           feedback.frame >= 2 && feedback.frame <= P045_SOURCE.wrongTerminalFrame) ||
          (feedback.kind === 'right' && feedback.spriteId === 220 &&
           feedback.frame >= 2 && feedback.frame <= P045_SOURCE.rightTerminalFrame)))
      throw new Error('P045_UNREACHABLE_FEEDBACK_FRAME');
    request.feedback = {spriteId: feedback.spriteId, localFrame: feedback.frame};
  }
  // P045's source Canvas export does not expose an NMH popup selector.
  // The source-bound native companion owns the reachable popup controls.
  if (state.nmhPopupVisible && state.mainFrame !== P045_SOURCE.quizFrame)
    throw new Error('P045_UNREACHABLE_NMH_POPUP');
  return request;
}

export function p045CommitCanvas(asset:P045CanvasAssetV1,
  canvas:HTMLCanvasElement,state:P045State):P045ResolvedFrameV1 {
  if (!asset || typeof asset.resolveFrameState !== 'function' ||
      typeof asset.render !== 'function')
    throw new Error('P045_CANVAS_ASSET_UNAVAILABLE');
  if (!canvas || canvas.width !== 800 || canvas.height !== 600 ||
      typeof canvas.getContext !== 'function')
    throw new Error('P045_CANVAS_SIZE_OR_CONTEXT');
  const request = p045VisualRequest(state);
  const resolved = asset.resolveFrameState(request);
  if (resolved.frameDomain !== 'sprite-350' ||
      resolved.localFrame !== state.mainFrame ||
      resolved.rootFrame !== 6 || resolved.lang !== 'en' ||
      resolved.visualOnly !== true || resolved.audioRendered !== false ||
      (resolved.feedback?.spriteId ?? null) !== (state.feedback?.spriteId ?? null) ||
      (resolved.feedback?.localFrame ?? null) !== (state.feedback?.frame ?? null))
    throw new Error('P045_CANVAS_RESOLUTION_DRIFT');
  const rendered = asset.render(canvas, request);
  if (rendered !== resolved &&
      (rendered?.localFrame !== resolved.localFrame ||
       rendered?.frameDomain !== resolved.frameDomain))
    throw new Error('P045_CANVAS_RENDER_DRIFT');
  if (typeof canvas.getAttribute === 'function' &&
      (canvas.getAttribute('data-flash-frame') !== String(state.mainFrame) ||
       canvas.getAttribute('data-p045-feedback-sprite') !==
         (state.feedback ? String(state.feedback.spriteId) : 'none') ||
       canvas.getAttribute('data-p045-feedback-frame') !==
         (state.feedback ? String(state.feedback.frame) : 'none')))
    throw new Error('P045_CANVAS_READBACK_DRIFT');
  return resolved;
}
