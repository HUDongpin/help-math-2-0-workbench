'use client';

import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {AnimationRendererProps} from './contract';
import type {TextPresentationSnapshot} from './lesson-text-contract';
import {P009_TEXT_DATA} from './generated/alg-l12-p009-text-data';
import {P009_GLOSSARY_TERMS} from './alg-l12-p009-glossary';
import {loadP009TypographyAsset, type P009TypographyAsset} from './alg-l12-p009-typography-asset';
import {P009_TITLE, p009GraphLabels, p009TextSnapshot} from './alg-l12-p009-typography';

export interface P009TypographyRendererProps extends AnimationRendererProps {
  readonly glossaryDisabled?: boolean;
  readonly onTermActivate?: (characterId: number, frame: number, trigger: HTMLButtonElement) => void;
}

/** One host frame drives native text and a staged source-vector drawing. */
export function P009TypographyRenderer(props: P009TypographyRendererProps) {
  const [asset, setAsset] = useState<P009TypographyAsset | null>(null);
  const [error, setError] = useState(false);
  const [committed, setCommitted] = useState<TextPresentationSnapshot | null>(null);
  const [presented, setPresented] = useState<TextPresentationSnapshot | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const staging = useRef<HTMLCanvasElement | null>(null);
  const bindCanvas = useCallback((element: HTMLCanvasElement | null) => {
    const old = canvas.current;
    if (old && old !== element) {old.width = 0; old.height = 0;}
    canvas.current = element;
    if (element) {
      element.width = 1600; element.height = 1200;
      // StrictMode can detach and reattach a newly conditional Canvas after its
      // first layout copy. Reattach must restore pixels as well as dimensions;
      // otherwise the existing committed snapshot would falsely remain ready.
      if (staging.current) {
        try {
          const context = element.getContext('2d');
          if (!context) throw Error('P009 reattached canvas unavailable');
          context.setTransform(1, 0, 0, 1, 0, 0);
          context.drawImage(staging.current, 0, 0);
        } catch {
          staging.current.width = 0; staging.current.height = 0; staging.current = null;
          element.width = 0; element.height = 0;
          setPresented(null); setCommitted(null); setError(true);
        }
      }
    }
  }, []);
  useEffect(() => {
    let active = true;
    void loadP009TypographyAsset().then(value => {if (active) setAsset(value);})
      .catch(() => {if (active) setError(true);});
    return () => {active = false;};
  }, []);
  useEffect(() => () => {
    if (staging.current) {staging.current.width = 0; staging.current.height = 0;}
    staging.current = null;
  }, []);

  useLayoutEffect(() => {
    if (!asset) return;
    const request = {frame: props.frame, frameDomain: props.frameDomain ?? 'sprite-62', rootFrame: props.rootFrame ?? 6,
      scenario: props.scenario, lang: props.lang, seed: props.seed, replay: props.replay ?? 0};
    const snapshot = p009TextSnapshot(request);
    try {
      if (snapshot.status !== 'ready') throw Error('P009 text context unavailable');
      if (!staging.current) {
        staging.current = document.createElement('canvas');
        staging.current.width = 1600; staging.current.height = 1200;
      }
      const requested = snapshot.suppressedInstances.map(instance => instance.id);
      const result = asset.renderWithText(staging.current, {...request, text: {suppressInstanceIds: requested}});
      const state = result.state;
      if (result.unfulfilledSuppressionIds.length || result.suppressedInstanceIds.length !== requested.length ||
        requested.some(id => !result.suppressedInstanceIds.includes(id)) ||
        (state.localFrame ?? state.frame) !== request.frame || state.frameDomain !== 'sprite-62' ||
        state.rootFrame !== 6 || (state.language ?? state.lang) !== 'en' ||
        state.scenario !== request.scenario || state.seed !== 0) throw Error('P009 text and drawing differ');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCommitted(snapshot); setError(false);
    } catch {
      if (staging.current) {staging.current.width = 0; staging.current.height = 0; staging.current = null;}
      setCommitted(null); setPresented(null); setError(true);
    }
  }, [asset, props.frame, props.frameDomain, props.rootFrame, props.scenario, props.lang, props.seed, props.replay]);

  useLayoutEffect(() => {
    if (!canvas.current || !staging.current || !committed || error) return;
    try {
      const context = canvas.current.getContext('2d');
      if (!context) throw Error('P009 visible canvas unavailable');
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, 1600, 1200); context.drawImage(staging.current, 0, 0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPresented(committed);
    } catch {
      if (staging.current) {staging.current.width = 0; staging.current.height = 0; staging.current = null;}
      setPresented(null); setCommitted(null); setError(true);
    }
  }, [committed, error]);

  const frame = committed?.identity.frame ?? 1;
  const labels = p009GraphLabels(frame);
  const firstFlash = labels.some(label => label.characterId === 60);
  const secondFlash = labels.some(label => label.characterId === 61);
  const prose = (ids: readonly number[]) => ids.flatMap(characterId => {
    const definition = P009_TEXT_DATA.definitions.find(item => item.characterId === characterId)!;
    return definition.runs.filter(run => run.revealFrame !== null && frame >= run.revealFrame).map(run => {
      const term = P009_GLOSSARY_TERMS.find(item => item.sourceTextId === run.id);
      return term ? <button key={run.id} type="button" className="p009-native-term"
        data-source-text-id={run.id} data-source-button-id={term.characterId}
        disabled={props.glossaryDisabled || !props.onTermActivate}
        onClick={event => props.onTermActivate?.(term.characterId, frame, event.currentTarget)}>{run.text}</button>
        : <span key={run.id} data-source-text-id={run.id}>{run.text}</span>;
    });
  });
  return <section className="p009-source-native" lang="en" data-p009-typography="native-v1"
    data-canvas-status={error ? 'error' : committed && presented === committed ? 'ready' : 'loading'}>
    {error ? <p role="alert">The lesson text and illustration could not load together. Reload this page to try again.</p>
      : committed ? <>
        <h2 className="p009-native-title" data-source-shape-id="63">{P009_TITLE}</h2>
        <p className="p009-native-prose" data-p009-prose="definition">{prose([4, 26])}</p>
        <figure className="p009-native-figure">
          <div className="p009-graph-scroll" tabIndex={0} aria-label="Scrollable coordinate plane">
            <div className="p009-graph-window" role="img"
              aria-label={frame < 15 ? 'Coordinate plane illustration' : `Coordinate plane with x- and y-axes labelled from minus five to five${frame >= 285 ? ', showing the ordered pair (4,2)' : ''}`}>
              <canvas ref={bindCanvas} width={1600} height={1200} aria-hidden="true"
                data-p009-native-figure="true" data-canvas-frame={frame}/>
              {labels.filter(label => label.characterId !== 60 && label.characterId !== 61).map(label =>
                <span key={label.id} className="p009-graph-label" aria-hidden="true"
                  data-source-instance-id={label.id} data-source-text-ids={label.sourceTextIds.join(' ')}
                  style={{left: `calc(${label.x - 210}rem / 17)`, top: `calc(${label.y - 120}rem / 17)`, opacity: label.alpha}}>
                  {label.characterId === 59 ? <span data-source-flash={firstFlash ? 'first-coordinate' : secondFlash ? 'second-coordinate' : 'none'}>
                    (<span style={{visibility: firstFlash ? 'hidden' : 'visible'}}>4</span>,<span style={{visibility: secondFlash ? 'hidden' : 'visible'}}>2</span>)
                  </span> : label.text}
                </span>)}
            </div>
          </div>
        </figure>
        <p className="p009-native-prose" data-p009-prose="coordinates">{prose([31, 43])}</p>
      </> : <p role="status">Loading lesson text and illustration…</p>}
    {props.uiLanguage === 'es' ? <p className="lesson-text-language-note" lang="es"
      data-lesson-text-language="en" data-spanish-translation="missing">
      Texto original en inglés. Esta página todavía no tiene una traducción al español verificada.
    </p> : null}
  </section>;
}
