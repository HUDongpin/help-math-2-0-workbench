import {p050Question, type P050State} from './alg-l06-p050-state-v1';

export const P050_CANVAS_ASSET_ID = 'shared-alg001-l06-p050';
export const P050_CANVAS_ASSET_SHA256 = 'd384ef32b39c8bd1e013c667653bcb5a643cbe703be6c145b87ce87a752347ff';
export interface P050CanvasRequestV1 {
  frame: number; lang: 'en'; seed: 0;
  game: Readonly<{score: number; ordinal: number; scoreFrame: number; directionsOpen: boolean}>;
  feedback: null | Readonly<{spriteId: number; localFrame: number; branch: number | null}>;
}
export interface P050ResolvedFrameV1 {
  frameDomain: string; localFrame: number; rootFrame: number; lang: string;
  visualOnly: boolean; audioRendered: boolean;
  game: P050CanvasRequestV1['game'];
  feedback: null | NonNullable<P050CanvasRequestV1['feedback']> & {wrongText: string | null};
}
export interface P050CanvasAssetV1 {
  ready(): Promise<unknown>;
  resolveFrameState(request: P050CanvasRequestV1): P050ResolvedFrameV1;
  render(canvas: HTMLCanvasElement, request: P050CanvasRequestV1): P050ResolvedFrameV1;
}
export function p050VisualRequest(state: P050State): P050CanvasRequestV1 {
  if (!state || state.phase === 'left' || !Number.isSafeInteger(state.mainFrame) ||
      state.mainFrame < 1 || state.mainFrame > 673) throw Error('P050_INVALID_SOURCE_FRAME');
  const question = state.questionId === null ? null : p050Question(state.questionId);
  if (question ? state.mainFrame !== question.frame : state.mainFrame > 662 && state.mainFrame !== 673)
    throw Error('P050_QUESTION_FRAME_DRIFT');
  const feedbackPhase = ['correct-feedback', 'wrong-feedback', 'wrong-held', 'wrong-tail'].includes(state.phase);
  if (feedbackPhase !== Boolean(state.feedback) || state.directionsOpen && feedbackPhase ||
      Boolean(question) !== (feedbackPhase || state.phase === 'question'))
    throw Error('P050_INCONSISTENT_SOURCE_STATE');
  const feedback = state.feedback;
  if (feedback) {
    if (!question || (state.phase === 'correct-feedback') !== (feedback.kind === 'correct') ||
        !Number.isSafeInteger(feedback.frame) || feedback.frame < 2 ||
        (feedback.kind === 'correct' ? feedback.spriteId !== question.correctFeedbackSpriteId ||
          feedback.endFrame !== question.correctFeedbackEndFrame || feedback.branch !== null || state.wrongText !== null :
          feedback.spriteId !== 380 || feedback.endFrame !== 28 || !Number.isSafeInteger(feedback.branch) ||
          feedback.branch! < 1 || feedback.branch! > 3 || state.wrongText !== `Sorry, the correct answer was ${question.correctChoice}.`) ||
        feedback.frame > feedback.endFrame ||
        state.phase === 'wrong-held' && feedback.frame !== 23 ||
        state.phase === 'wrong-feedback' && feedback.frame >= 23 ||
        state.phase === 'wrong-tail' && feedback.frame < 24)
      throw Error('P050_UNREACHABLE_FEEDBACK');
  }
  return {frame: state.mainFrame, lang: 'en', seed: 0,
    game: {score: state.score, ordinal: question ? state.drawCount : 0,
      scoreFrame: state.scoreAnimation?.frame ?? 1, directionsOpen: state.directionsOpen},
    feedback: feedback ? {spriteId: feedback.spriteId, localFrame: feedback.frame, branch: feedback.branch} : null};
}
function matches(resolved: P050ResolvedFrameV1, request: P050CanvasRequestV1, wrongText: string | null) {
  return resolved?.frameDomain === 'sprite-489' && resolved.localFrame === request.frame &&
    resolved.rootFrame === 6 && resolved.lang === 'en' && resolved.visualOnly === true && resolved.audioRendered === false &&
    resolved.game?.score === request.game.score && resolved.game.ordinal === request.game.ordinal &&
    resolved.game.scoreFrame === request.game.scoreFrame && resolved.game.directionsOpen === request.game.directionsOpen &&
    (resolved.feedback?.spriteId ?? null) === (request.feedback?.spriteId ?? null) &&
    (resolved.feedback?.localFrame ?? null) === (request.feedback?.localFrame ?? null) &&
    (resolved.feedback?.branch ?? null) === (request.feedback?.branch ?? null) &&
    (resolved.feedback?.wrongText ?? null) === wrongText;
}
export function p050CommitCanvas(asset: P050CanvasAssetV1, canvas: HTMLCanvasElement,
  state: P050State): P050ResolvedFrameV1 {
  if (!asset || typeof asset.resolveFrameState !== 'function' || typeof asset.render !== 'function')
    throw Error('P050_CANVAS_ASSET_UNAVAILABLE');
  if (!canvas || canvas.width !== 800 || canvas.height !== 600 || typeof canvas.getContext !== 'function')
    throw Error('P050_CANVAS_SIZE_OR_CONTEXT');
  const request = p050VisualRequest(state), resolved = asset.resolveFrameState(request);
  if (!matches(resolved, request, state.wrongText)) throw Error('P050_CANVAS_RESOLUTION_DRIFT');
  const rendered = asset.render(canvas, request);
  if (!matches(rendered, request, state.wrongText)) throw Error('P050_CANVAS_RENDER_DRIFT');
  if (typeof canvas.getAttribute === 'function' &&
      (canvas.getAttribute('data-flash-frame') !== String(state.mainFrame) ||
       canvas.getAttribute('data-p050-game') !== JSON.stringify(resolved.game) ||
       canvas.getAttribute('data-p050-feedback') !== JSON.stringify(resolved.feedback)))
    throw Error('P050_CANVAS_READBACK_DRIFT');
  return rendered;
}
