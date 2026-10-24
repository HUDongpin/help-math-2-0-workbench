// Source-state binding to the frozen P043 visual asset.
import {P043_SOURCE,type P043State} from './alg-l06-p043-state-v1';

export type P043CanvasRequestV1={frame:number;lang:'en';seed:0;
  feedback?:{spriteId:202|307;localFrame:number};nmhOpen?:boolean};
export type P043ResolvedFrameV1={frameDomain:string;localFrame:number;
  rootFrame:number;lang:string;visualOnly:boolean;audioRendered:boolean;
  nmhOpen:boolean;feedback:null|{spriteId:number;localFrame:number}};
export interface P043CanvasAssetV1{
  ready():Promise<unknown>;
  resolveFrameState(request:P043CanvasRequestV1):P043ResolvedFrameV1;
  render(canvas:HTMLCanvasElement,request:P043CanvasRequestV1):P043ResolvedFrameV1;
}

export const P043_CANVAS_ASSET_ID = P043_SOURCE.animationId;
export const P043_CANVAS_ASSET_SHA256 =
  '4ef3fd48ec83ba97542791832682e0a14aabec52611d7a4f6f0750e5b4852de5';

export function p043VisualRequest(state:P043State):P043CanvasRequestV1 {
  if (!state || state.phase === 'left' ||
      !Number.isSafeInteger(state.mainFrame) ||
      state.mainFrame < 1 || state.mainFrame > P043_SOURCE.lastFrame)
    throw new Error('P043_INVALID_SOURCE_FRAME');
  const request:P043CanvasRequestV1 = {frame: state.mainFrame, lang: 'en', seed: 0};
  const feedback = state.feedback;
  const feedbackPhase = ['wrong-feedback-playing', 'wrong-feedback-held',
    'wrong-feedback-tail', 'right-feedback-playing'].includes(state.phase);
  if (feedbackPhase !== Boolean(feedback) ||
      (state.phase === 'nmh-popup' && !state.nmhPopupVisible))
    throw new Error('P043_INCONSISTENT_SOURCE_STATE');
  if (feedback) {
    if (state.mainFrame !== P043_SOURCE.quizFrame ||
        ((state.phase === 'right-feedback-playing') !==
         (feedback.kind === 'right')) ||
        !Number.isSafeInteger(feedback.frame) ||
        !((feedback.kind === 'wrong' && feedback.spriteId === 307 &&
           feedback.frame >= 2 && feedback.frame <= 29) ||
          (feedback.kind === 'right' && feedback.spriteId === 202 &&
           feedback.frame >= 2 && feedback.frame <= 31)))
      throw new Error('P043_UNREACHABLE_FEEDBACK_FRAME');
    request.feedback = {spriteId: feedback.spriteId, localFrame: feedback.frame};
  }
  if (state.nmhPopupVisible) {
    const glossaryFromNmh = state.phase === 'host-glossary' &&
      state.glossaryReturn?.phase === 'nmh-popup';
    if (!(state.phase === 'nmh-popup' || glossaryFromNmh) ||
        state.mainFrame !== 62 || feedback)
      throw new Error('P043_UNREACHABLE_NMH_POPUP');
    request.nmhOpen = true;
  }
  return request;
}

export function p043CommitCanvas(asset:P043CanvasAssetV1,
  canvas:HTMLCanvasElement,state:P043State):P043ResolvedFrameV1 {
  if (!asset || typeof asset.resolveFrameState !== 'function' ||
      typeof asset.render !== 'function')
    throw new Error('P043_CANVAS_ASSET_UNAVAILABLE');
  if (!canvas || canvas.width !== 800 || canvas.height !== 600 ||
      typeof canvas.getContext !== 'function')
    throw new Error('P043_CANVAS_SIZE_OR_CONTEXT');
  const request = p043VisualRequest(state);
  const resolved = asset.resolveFrameState(request);
  if (resolved.frameDomain !== 'sprite-342' ||
      resolved.localFrame !== state.mainFrame ||
      resolved.rootFrame !== 6 || resolved.lang !== 'en' ||
      resolved.visualOnly !== true || resolved.audioRendered !== false ||
      resolved.nmhOpen !== Boolean(state.nmhPopupVisible) ||
      (resolved.feedback?.spriteId ?? null) !== (state.feedback?.spriteId ?? null) ||
      (resolved.feedback?.localFrame ?? null) !== (state.feedback?.frame ?? null))
    throw new Error('P043_CANVAS_RESOLUTION_DRIFT');
  const rendered = asset.render(canvas, request);
  if (rendered !== resolved &&
      (rendered?.localFrame !== resolved.localFrame ||
       rendered?.frameDomain !== resolved.frameDomain))
    throw new Error('P043_CANVAS_RENDER_DRIFT');
  if (typeof canvas.getAttribute === 'function' &&
      (canvas.getAttribute('data-flash-frame') !== String(state.mainFrame) ||
       canvas.getAttribute('data-p043-feedback-sprite') !==
         (state.feedback ? String(state.feedback.spriteId) : 'none') ||
       canvas.getAttribute('data-p043-feedback-frame') !==
         (state.feedback ? String(state.feedback.frame) : 'none') ||
       canvas.getAttribute('data-p043-nmh-open') !==
         String(Boolean(state.nmhPopupVisible))))
    throw new Error('P043_CANVAS_READBACK_DRIFT');
  return resolved;
}
