'use client';
import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {AnimationRendererProps} from '../contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {CourseG04L04Gs002Renderer, getCourseG04L04Gs002FrameState} from '../modules/course-g04-l04-gs-002';
import {LessonCanvasPlane, type LessonCanvasPlaneAdapter} from '../lesson-canvas-plane';
import {LessonSourceButton} from '../lesson-source-button';
import {loadLunchActivityScene as loadHashBoundScene} from './g4-l4-lunch-activity';
import {G4_L4_ZOG_X_PAGE as C} from './generated/g4-l4-zog-x-page-config';
import {G4_L4_ZOG_X_INTRO as intro} from './generated/g4-l4-zog-x-intro-config';
import {G4_L4_ZOG_X_GAME as game} from './generated/g4-l4-zog-x-game-config';
import {ZogXTeachingCopy, ZogXRepeatDirectionsCopy, ZogXIntroDemonstration, getZogXIntroState} from './g4-l4-zog-x-intro';
import {ZogXQuestion} from './g4-l4-zog-x-question';
import {createZogXSession, synchronizeZogXSession, dispatchZogX, zogXOwnedActivities, type ZogXSession, type ZogXHostAction} from './g4-l4-zog-x-host-state';
import {getZogXTextSnapshot, zogXSceneState} from './g4-l4-zog-x-text';

const STAGE = Object.freeze({width: 800, height: 600});
const all = (r: AnimationRendererProps) => r.lessonActivities ?? (r.lessonActivity ? [r.lessonActivity] : []);
let scene: Promise<LessonCanvasPlaneAdapter> | undefined;
/** Reuse the existing hash-bound loader without changing its other consumers.
 * GS002 additionally requires every requested child dispatch to be fulfilled. */
export function loadZogXScene() {
  return scene ??= loadHashBoundScene(C).then(adapter => ({...adapter,
    renderWithText(canvas: HTMLCanvasElement, request: Record<string, unknown>) {
      const result = adapter.renderWithText!(canvas, request) as ReturnType<NonNullable<LessonCanvasPlaneAdapter['renderWithText']>> & {unfulfilledChildIds?: readonly string[]};
      if (!result.unfulfilledChildIds || result.unfulfilledChildIds.length) throw Error('GS002 child projection was not drawn');
      return result;
    },
  })).catch(error => {scene = undefined; throw error;});
}

export function ZogXPage(props: AnimationRendererProps) {
  const r = {...props, frameDomain: props.frameDomain ?? game.frameDomain, rootFrame: props.rootFrame ?? game.rootFrame};
  const [stored, setStored] = useState(() => createZogXSession(r.seed, r.replay ?? 0));
  const s = synchronizeZogXSession(stored, r, all(r)), live = useRef(s), runtime = useRef(r);
  live.current = s; runtime.current = r;
  const [adapter, setAdapter] = useState<LessonCanvasPlaneAdapter | null>(null), [failed, setFailed] = useState(false);
  const container = useRef<HTMLElement>(null), closeDirections = useRef<HTMLButtonElement>(null), closeWrong = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null), wasWrong = useRef(false), wasDirections = useRef(false);
  const completed = useRef('');
  const commit = (next: ZogXSession) => {if (next !== live.current) {live.current = next; setStored(next);}};
  const act = (action: ZogXHostAction) => {
    if ((action.type === 'repeat' || action.type === 'answer') && typeof document !== 'undefined') returnFocus.current = document.activeElement as HTMLElement;
    commit(dispatchZogX(live.current, action, runtime.current));
  };
  const restoreFocus = () => {
    if (returnFocus.current?.isConnected) returnFocus.current.focus();
    else container.current?.querySelector<HTMLElement>('[data-zog-x-answer]:not(:disabled),[data-zog-x-start]:not(:disabled),[data-zog-x-repeat]:not(:disabled)')?.focus();
  };
  useEffect(() => {if (!r.paused) commit(dispatchZogX(s, {type: 'observe'}, r));}, [s, r.frame, r.paused, r.lessonActivities, r.lessonActivity]);
  useEffect(() => () => {
    const last = runtime.current;
    for (const a of zogXOwnedActivities(live.current, all(last))) if (a.cancellationToken) last.onLessonActivityCancel?.({id: a.id,
      sourceInstanceId: a.sourceInstanceId, revision: a.revision, cancellationToken: a.cancellationToken, parentFrame: last.frame});
  }, []);
  const source = (r.state ?? getCourseG04L04Gs002FrameState(r.frame, r)) as SourceStaticCanvasFrameState;
  const snapshot = getZogXTextSnapshot(source, r, s, r), projected = zogXSceneState(s, r), view = projected.view;
  useEffect(() => {
    if (snapshot.status !== 'ready') return;
    let cancelled = false;
    void loadZogXScene().then(value => {if (!cancelled) setAdapter(value);}).catch(() => {if (!cancelled) setFailed(true);});
    return () => {cancelled = true;};
  }, [snapshot.status]);
  useLayoutEffect(() => {
    if (s.directions && !wasDirections.current) closeDirections.current?.focus();
    if (view.wrongPopup && !wasWrong.current && !s.directions) closeWrong.current?.focus();
    if ((!s.directions && wasDirections.current) || (!view.wrongPopup && wasWrong.current)) restoreFocus();
    wasDirections.current = s.directions; wasWrong.current = view.wrongPopup;
  }, [s.directions, view.wrongPopup, adapter]);
  useEffect(() => {
    const key = `${r.seed}:${r.replay ?? 0}`;
    if (!view.endingComplete || r.paused || completed.current === key) return;
    if (r.onLessonCompletionRequest?.({id: 'g4-l4-zog-x-complete', frameDomain: game.frameDomain, frame: game.finalFrame, seed: r.seed, replay: r.replay ?? 0})) completed.current = key;
  }, [view.endingComplete, r.seed, r.replay, r.paused, r.onLessonCompletionRequest]);
  const openTerm: React.ComponentProps<typeof ZogXTeachingCopy>['onOpenKeyTerm'] = r.onLessonHostRequest ? (term, trigger) => {
    r.onLessonHostRequest?.({type: 'open-keyterm', entryId: term.entryId, sourceAnimationId: C.animationId,
      playbackDisposition: 'source-stop-timeline-and-audio-until-explicit-resume'}, {trigger, keyTermIndexLanguage: 'en'});
  } : undefined;
  if (snapshot.status !== 'ready') return <CourseG04L04Gs002Renderer {...r} state={source}/>;
  const copy = getZogXIntroState(r.frame, r.reducedMotion), locked = !!r.paused;
  const request = {...r, zogXScene: {children: projected.children}};
  const attributes = {'data-modern-lesson': 'g4-l4-gs002', 'data-presentation-status': 'candidate', 'data-source-swf-sha256': C.sourceSwfSha256,
    'data-flash-frame': r.frame, 'data-flash-frame-domain': r.frameDomain, 'data-flash-root-frame': r.rootFrame, 'data-flash-lang': r.lang,
    'data-flash-seed': r.seed, 'data-flash-scenario': r.scenario, 'data-replay': r.replay ?? 0,
    'data-zog-x-correct-stage': view.correctStage ?? '', 'data-zog-x-correct-frame': view.correctFrame ?? '',
    'data-zog-x-wrong-frame': view.wrongFrame ?? '', 'data-zog-x-ending-frame': view.endingFrame ?? '',
    'data-language-policy': r.uiLanguage === 'es' ? 'source-fallback' : 'source', 'data-spanish-translation': 'false',
    'data-original-runtime-accepted': 'false', 'data-owner-accepted': 'false', 'data-strict-migration-complete': 'false'};
  return <section ref={container} {...attributes} lang="en" className="zog-x-page"><style>{CSS}</style>
    {failed ? <p role="status">The lesson figure could not load.</p> : adapter ?
      <LessonCanvasPlane adapter={adapter} nativeStage={STAGE} sourceBitmapBound request={request} snapshot={snapshot}
        renderKey={JSON.stringify([snapshot.identity, projected.children, s.directions, view.number, view.answersEnabled])} figureLabel="Zog-X meets the robots">
        {(committed, figure) => <>
          <ZogXTeachingCopy frame={committed.identity.frame} onOpenKeyTerm={openTerm}/>
          <div className="zog-x-page__layout"><figure className="zog-x-page__scene">{figure}</figure>
            <div className="zog-x-page__interaction">
              <ZogXIntroDemonstration frame={committed.identity.frame} reducedMotion={r.reducedMotion}/>
              {view.question && r.frame !== game.finalFrame && <ZogXQuestion question={view.question} number={view.number}
                enabled={view.answersEnabled && !!r.onLessonActivityRequest && !!r.onLessonFrameRequest} onAnswer={choice => act({type: 'answer', choice})}/>}
              {view.wrongPopup && <section className="zog-x-page__panel" role="dialog" aria-label="Answer feedback" data-zog-x-wrong>
                <p data-lesson-text-block="wrong">{C.wrong.text}</p>
                <LessonSourceButton ref={closeWrong} runtime={r} activityId="g4-l4-zog-x-wrong-close-down" type="button" data-zog-x-close-wrong
                  data-lesson-text-block="close" disabled={!view.wrongCloseEnabled} onClick={() => act({type: 'close-wrong'})}>{intro.controls.close.text}</LessonSourceButton>
              </section>}
              {s.directions && <section className="zog-x-page__panel" role="dialog" aria-label="Repeat Directions" data-zog-x-directions>
                <ZogXRepeatDirectionsCopy onOpenKeyTerm={openTerm}/>
                <LessonSourceButton ref={closeDirections} runtime={r} activityId="g4-l4-zog-x-directions-close-down" type="button" data-zog-x-close-directions
                  data-lesson-text-block="close" disabled={locked} onClick={() => act({type: 'close-directions'})}>{intro.controls.close.text}</LessonSourceButton>
              </section>}
            </div>
          </div>
          {r.frame < game.finalFrame && <div className="zog-x-page__controls">
            {copy.skipEnabled && <button type="button" data-zog-x-skip data-lesson-text-block="skip" disabled={locked || !r.onLessonFrameRequest}
              onClick={() => act({type: 'skip'})}>{intro.controls.skip.text}</button>}
            {r.frame <= game.readyFrame && <button type="button" data-zog-x-start data-lesson-text-block="start" data-source-emphasis={copy.startEmphasis}
              disabled={locked || r.frame !== game.readyFrame || s.directions || !r.onLessonFrameRequest} onClick={() => act({type: 'start'})}>{intro.controls.start.text}</button>}
            <button type="button" data-zog-x-repeat data-lesson-text-block="repeat" data-source-emphasis={copy.repeatEmphasis}
              disabled={locked || r.frame < game.readyFrame || s.directions} onClick={() => act({type: 'repeat'})}>{intro.controls.repeat.text}</button>
          </div>}
        </>}
      </LessonCanvasPlane> : <p role="status">Loading lesson figure…</p>}
  </section>;
}

const CSS = `.zog-x-page{--lesson-text-body-size:1.125rem;container:lesson-text / inline-size;min-inline-size:0;max-inline-size:84rem;margin-inline:auto;color:#172c43;font:var(--lesson-text-body-size,1.125rem)/var(--lesson-text-line-height,1.6) var(--lesson-text-font-body,system-ui,sans-serif)}.zog-x-page *{box-sizing:border-box}.zog-x-page__layout{display:grid;gap:1.25rem;align-items:start;min-inline-size:0}.zog-x-page__scene{margin:0;min-inline-size:0;border:1px solid #c3d4e5;border-radius:.8rem;overflow:hidden}.zog-x-page__interaction{min-inline-size:0}.zog-x-page__controls{display:flex;flex-wrap:wrap;gap:.7rem;margin-block-start:1rem}.zog-x-page__controls button,.zog-x-page__panel>button{font:var(--lesson-text-label-size,1.125rem)/var(--lesson-text-line-height,1.6) var(--lesson-text-font-body,system-ui,sans-serif);min-block-size:44px;max-inline-size:100%;padding:.4em .8em;border:2px solid #285c8e;border-radius:.5rem;background:#e7f1fc;color:#173e64;cursor:pointer}.zog-x-page__controls button:disabled,.zog-x-page__panel>button:disabled{cursor:default;background:#e4e9ef;color:#465567;border-color:#9fadb9}.zog-x-page__controls button[data-source-emphasis=true]{outline:3px solid #9b4c00;outline-offset:2px}.zog-x-page button:focus-visible{outline:3px solid #a64100;outline-offset:3px}.zog-x-page__panel{font-size:var(--lesson-text-body-size,1.125rem);margin-block:1rem;padding:1rem;border:2px solid #8e6a37;border-radius:.7rem;background:#fff7e4}.zog-x-page__panel>p{margin:0 0 .7rem}@container lesson-text (min-width:48rem){.zog-x-page :is(.zog-x-copy,.zog-x-demo,.zog-x-question,.zog-x-page__panel){--lesson-text-body-size:1.25rem}}@container lesson-text (min-width:56rem){.zog-x-page__layout{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}`;
