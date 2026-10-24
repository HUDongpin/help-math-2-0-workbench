// Source-state binding to the frozen P044 visual asset.
import {P044_SOURCE,type P044State} from './alg-l06-p044-state-v1';

export type P044CanvasRequestV1={frame:number;lang:'en';seed:0;
  feedback?:{spriteId:198|336;localFrame:number}};
export type P044ResolvedFrameV1={frameDomain:string;localFrame:number;
  rootFrame:number;lang:string;visualOnly:boolean;audioRendered:boolean;
  feedback:null|{spriteId:number;localFrame:number}};
export interface P044CanvasAssetV1{
  ready():Promise<unknown>;
  resolveFrameState(request:P044CanvasRequestV1):P044ResolvedFrameV1;
  render(canvas:HTMLCanvasElement,request:P044CanvasRequestV1):P044ResolvedFrameV1;
}

export const P044_CANVAS_ASSET_ID = P044_SOURCE.animationId;
export const P044_CANVAS_ASSET_SHA256 =
  '26a7c58ba4f7ce018ffd8d1f552ecb8d63fa6d480eef7721a14cd8ba36cce01b';

export function p044VisualRequest(state:P044State):P044CanvasRequestV1 {
  if (!state || state.phase === 'left' ||
      !Number.isSafeInteger(state.mainFrame) ||
      state.mainFrame < 1 || state.mainFrame > P044_SOURCE.lastFrame)
    throw new Error('P044_INVALID_SOURCE_FRAME');
  const request:P044CanvasRequestV1 = {frame: state.mainFrame, lang: 'en', seed: 0};
  const feedback = state.feedback;
  const feedbackPhase = ['wrong-feedback-playing', 'wrong-feedback-held',
    'wrong-feedback-tail', 'right-feedback-playing'].includes(state.phase);
  if (feedbackPhase !== Boolean(feedback) ||
      (state.phase === 'nmh-popup' && !state.nmhPopupVisible))
    throw new Error('P044_INCONSISTENT_SOURCE_STATE');
  if (feedback) {
    if (state.mainFrame !== P044_SOURCE.quizFrame ||
        ((state.phase === 'right-feedback-playing') !==
         (feedback.kind === 'right')) ||
        !Number.isSafeInteger(feedback.frame) ||
        !((feedback.kind === 'wrong' && feedback.spriteId === 336 &&
           feedback.frame >= 2 && feedback.frame <= P044_SOURCE.wrongTerminalFrame) ||
          (feedback.kind === 'right' && feedback.spriteId === 198 &&
           feedback.frame >= 2 && feedback.frame <= P044_SOURCE.rightTerminalFrame)))
      throw new Error('P044_UNREACHABLE_FEEDBACK_FRAME');
    request.feedback = {spriteId: feedback.spriteId, localFrame: feedback.frame};
  }
  // P044's source Canvas export does not expose an NMH popup selector.
  // The source-bound native companion owns the reachable popup controls.
  if (state.nmhPopupVisible && state.mainFrame !== P044_SOURCE.quizFrame)
    throw new Error('P044_UNREACHABLE_NMH_POPUP');
  return request;
}

export function p044CommitCanvas(asset:P044CanvasAssetV1,
  canvas:HTMLCanvasElement,state:P044State):P044ResolvedFrameV1 {
  if (!asset || typeof asset.resolveFrameState !== 'function' ||
      typeof asset.render !== 'function')
    throw new Error('P044_CANVAS_ASSET_UNAVAILABLE');
  if (!canvas || canvas.width !== 800 || canvas.height !== 600 ||
      typeof canvas.getContext !== 'function')
    throw new Error('P044_CANVAS_SIZE_OR_CONTEXT');
  const request = p044VisualRequest(state);
  const resolved = asset.resolveFrameState(request);
  if (resolved.frameDomain !== 'sprite-354' ||
      resolved.localFrame !== state.mainFrame ||
      resolved.rootFrame !== 6 || resolved.lang !== 'en' ||
      resolved.visualOnly !== true || resolved.audioRendered !== false ||
      (resolved.feedback?.spriteId ?? null) !== (state.feedback?.spriteId ?? null) ||
      (resolved.feedback?.localFrame ?? null) !== (state.feedback?.frame ?? null))
    throw new Error('P044_CANVAS_RESOLUTION_DRIFT');
  const rendered = asset.render(canvas, request);
  if (rendered !== resolved &&
      (rendered?.localFrame !== resolved.localFrame ||
       rendered?.frameDomain !== resolved.frameDomain))
    throw new Error('P044_CANVAS_RENDER_DRIFT');
  if (typeof canvas.getAttribute === 'function' &&
      (canvas.getAttribute('data-flash-frame') !== String(state.mainFrame) ||
       canvas.getAttribute('data-p044-feedback-sprite') !==
         (state.feedback ? String(state.feedback.spriteId) : 'none') ||
       canvas.getAttribute('data-p044-feedback-frame') !==
         (state.feedback ? String(state.feedback.frame) : 'none')))
    throw new Error('P044_CANVAS_READBACK_DRIFT');
  return resolved;
}
