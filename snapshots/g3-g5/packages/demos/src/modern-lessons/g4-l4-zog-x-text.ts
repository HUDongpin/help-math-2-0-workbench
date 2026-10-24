import type {AnimationRendererProps, RuntimeContext} from '../contract';
import type {TextPresentationSnapshot} from '../lesson-text-contract';
import {buildLessonTextSnapshot, type LessonTextValue} from '../lesson-text-snapshot';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {getCourseG04L04Gs002FrameState} from '../modules/course-g04-l04-gs-002';
import {G4_L4_ZOG_X_PAGE as C} from './generated/g4-l4-zog-x-page-config';
import {G4_L4_ZOG_X_GAME as game} from './generated/g4-l4-zog-x-game-config';
import {G4_L4_ZOG_X_INTRO as intro} from './generated/g4-l4-zog-x-intro-config';
import {createZogXSession, zogXGameView, type ZogXSession} from './g4-l4-zog-x-host-state';
import {getZogXIntroState} from './g4-l4-zog-x-intro';

export const ZOG_X_BINDING = C.binding;
export interface ZogXSceneChild {readonly id: string; readonly visible: boolean; readonly frame: number}
const active = (p: {firstFrame: number; lastFrameExclusive: number}, frame: number) => p.firstFrame <= frame && frame < p.lastFrameExclusive;

/** Project only host-owned child clocks. An unstarted feedback stays at its
 * authored stopped frame; nested236 also stops at1. Other nested art keeps the
 * original FFDec placement age, including the ending's reused sprite784. */
export function zogXSceneState(s: ZogXSession, r: AnimationRendererProps) {
  const view = zogXGameView(s, r), children: ZogXSceneChild[] = [];
  for (const child of C.children) {
    if (child.parentDomain !== game.frameDomain || !active(child, r.frame)) continue;
    const correct = game.feedback.find(f => f.sourceInstanceId === child.id);
    if (correct) children.push({id: child.id, visible: view.correctStage === correct.stage,
      frame: view.correctStage === correct.stage ? view.correctFrame ?? 1 : 1});
    else if (child.domain === game.wrongFeedback.frameDomain) children.push({id: child.id, visible: view.wrongFrame !== null && view.wrongFrame > 1, frame: view.wrongFrame ?? 1});
    else if (child.domain === 'sprite-20') children.push({id: child.id, visible: s.directions, frame: 1});
    else if (child.domain === game.ending.frameDomain) children.push({id: child.id, visible: true, frame: view.endingFrame ?? 1});
  }
  for (const child of C.children) {
    if (child.domain !== 'sprite-236') continue;
    const parentId = child.id.slice(0, child.id.lastIndexOf('>'));
    const parent = children.find(p => p.id === parentId);
    if (parent?.visible && active(child, parent.frame)) children.push({id: child.id, visible: true, frame: 1});
  }
  const suppressed = C.native.filter(n => n.domain === game.frameDomain ? active(n, r.frame)
    : view.wrongFrame !== null && view.wrongFrame > 1 && active(n, view.wrongFrame));
  return {children, suppressed, view};
}

/** The same source frame and session feed all native copy and scene requests.
 * A direct seek into a question has no reconstructed random history: preserve
 * the existing engineering fallback until Replay establishes a real session. */
export function getZogXTextSnapshot(state: SourceStaticCanvasFrameState, context: RuntimeContext,
  session: ZogXSession = createZogXSession(context.seed, context.replay ?? 0),
  runtime: AnimationRendererProps = context): TextPresentationSnapshot {
  const r = {...runtime, ...context, frameDomain: context.frameDomain ?? game.frameDomain, rootFrame: context.rootFrame ?? game.rootFrame};
  const expected = getCourseG04L04Gs002FrameState(r.frame, r);
  const values: Record<string, LessonTextValue> = Object.fromEntries(C.binding.blocks.map(b => [b.id, {text: '', visible: false}]));
  const set = (id: string, text: string, visible: boolean) => {values[id] = {text, visible: visible && !!text.trim()};};
  const validFrame = Number.isSafeInteger(r.frame) && r.frame >= 1 && r.frame <= game.finalFrame;
  const blockers: string[] = [];
  if (!validFrame || r.frameDomain !== game.frameDomain || r.rootFrame !== game.rootFrame
    || r.scenario !== 'source-static-frame' || r.entryStateSha256 || r.lang !== 'en') blockers.push('unsupported-zog-x-runtime-identity');
  if (!state || state.status !== 'ready' || expected.status !== 'ready' || state.frame !== expected.frame
    || state.animationId !== C.animationId || state.sourceSwfSha256 !== C.sourceSwfSha256
    || !state.sourceStaticVisualReady || state.exportFrame !== expected.exportFrame
    || state.seed !== expected.seed || state.frameDomain !== expected.frameDomain || state.rootFrame !== expected.rootFrame
    || state.language !== expected.language || state.scenario !== expected.scenario) blockers.push('source-frame-identity-mismatch');
  if (session.seed !== (r.seed >>> 0) || session.replay !== (r.replay ?? 0)) blockers.push('zog-x-session-identity-mismatch');
  if (r.frame > game.readyFrame && (!session.pool || session.pool.frame !== r.frame)) blockers.push('zog-x-question-history-unavailable');
  if (validFrame) {
    const projected = zogXSceneState(session, r), view = projected.view, copy = getZogXIntroState(r.frame);
    set('title', intro.title.text, true);
    intro.paragraphs.forEach((chars, i) => set(`instruction-${i}`, chars.map(cid => copy.body.find(x => x.characterId === cid)!.visibleText).join(' ').trim(), r.frame >= 194 && r.frame < 592));
    set('demonstration-prompt', intro.demonstration.prompt.text, copy.demonstrationVisible);
    for (const a of intro.demonstration.answers) {
      set(`demonstration-${a.letter.text}-letter`, a.letter.text, copy.demonstrationVisible);
      set(`demonstration-${a.letter.text}-value`, a.value.text, copy.demonstrationVisible);
    }
    set('start', intro.controls.start.text, r.frame <= game.readyFrame);
    set('repeat', intro.controls.repeat.text, r.frame < game.finalFrame);
    set('skip', intro.controls.skip.text, copy.skipEnabled);
    set('close', intro.controls.close.text, session.directions || view.wrongPopup);
    for (const row of intro.repeatDirections) set(`directions-${row.characterId}`, row.text, session.directions);
    set('wrong', C.wrong.text, view.wrongPopup);
    for (const q of game.questions) {
      const shown = view.question?.id === q.id && r.frame !== game.finalFrame;
      set(q.label, q.prompt, shown);
      set(q.label+'-number', `${view.number}.`, shown);
      for (const a of q.answers) {
        set(`${q.label}-${a.id}-letter`, a.id, shown);
        set(`${q.label}-${a.id}`, a.text, shown);
      }
    }
  }
  const snapshot = buildLessonTextSnapshot(C.binding, r, values);
  if (blockers.length || snapshot.status !== 'ready') return {...snapshot, status: 'blocked', blockers: [...snapshot.blockers, ...blockers], blocks: [], suppressedInstances: []};
  return {...snapshot, suppressedInstances: zogXSceneState(session, r).suppressed.map(({id, path}) => ({id, path}))};
}
