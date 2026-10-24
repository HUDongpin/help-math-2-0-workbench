'use client';

import {useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import type {AnimationRendererProps} from './contract';
import type {TextPresentationSnapshot} from './lesson-text-contract';
import {P010_TEXT_DATA} from './generated/alg-l12-p010-text-data';
import {P010_GLOSSARY_TERMS} from './alg-l12-p010-glossary';
import {loadP010TypographyAsset, type P010TypographyAsset} from './alg-l12-p010-typography-asset';
import {P010_TITLE, p010FigureDescription, p010GraphLabels, p010TextSnapshot} from './alg-l12-p010-typography';

export interface P010TypographyRendererProps extends AnimationRendererProps {
  readonly glossaryDisabled?: boolean;
  readonly onTermActivate?: (instanceId: string, frame: number, trigger: HTMLButtonElement) => void;
}

/** One host frame drives native text and a staged source-vector drawing. */
export function P010TypographyRenderer(props: P010TypographyRendererProps) {
  const [asset, setAsset] = useState<P010TypographyAsset | null>(null);
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
          if (!context) throw Error('P010 reattached canvas unavailable');
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
    void loadP010TypographyAsset().then(value => {if (active) setAsset(value);})
      .catch(() => {if (active) setError(true);});
    return () => {active = false;};
  }, []);
  useEffect(() => () => {
    if (staging.current) {staging.current.width = 0; staging.current.height = 0;}
    staging.current = null;
  }, []);

  useLayoutEffect(() => {
    if (!asset) return;
    const request = {frame: props.frame, frameDomain: props.frameDomain ?? 'sprite-96', rootFrame: props.rootFrame ?? 6,
      scenario: props.scenario, lang: props.lang, seed: props.seed, replay: props.replay ?? 0};
    const snapshot = p010TextSnapshot(request);
    try {
      if (snapshot.status !== 'ready') throw Error('P010 text context unavailable');
      if (!staging.current) {
        staging.current = document.createElement('canvas');
        staging.current.width = 1600; staging.current.height = 1200;
      }
      const requested = snapshot.suppressedInstances.map(instance => instance.id);
      const result = asset.renderWithText(staging.current, {...request, text: {suppressInstanceIds: requested}});
      const state = result.state;
      if (result.unfulfilledSuppressionIds.length || result.suppressedInstanceIds.length !== requested.length ||
        requested.some(id => !result.suppressedInstanceIds.includes(id)) ||
        (state.localFrame ?? state.frame) !== request.frame || state.frameDomain !== 'sprite-96' ||
        state.rootFrame !== 6 || (state.language ?? state.lang) !== 'en' ||
        state.scenario !== request.scenario || state.seed !== 0) throw Error('P010 text and drawing differ');
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
      if (!context) throw Error('P010 visible canvas unavailable');
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
  const labels = p010GraphLabels(frame);
  const prose = (ids: readonly number[]) => ids.flatMap(characterId => {
    const definition = P010_TEXT_DATA.definitions.find(item => item.characterId === characterId)!;
    return definition.runs.filter(run => run.revealFrame !== null && frame >= run.revealFrame).flatMap(run => {
      const terms = P010_GLOSSARY_TERMS.filter(term => term.sourceTextId === run.id)
        .sort((a,b) => a.spanStart - b.spanStart);
      const content: ReactNode[] = [];
      let cursor = 0;
      for (const term of terms) {
        if (term.spanStart > cursor) content.push(<span key={run.id + ':' + cursor}
          data-source-text-id={run.id}>{run.text.slice(cursor,term.spanStart)}</span>);
        content.push(<button key={term.instanceId} type="button" className="p010-native-term"
          data-source-text-id={run.id} data-source-button-id={term.characterId}
          data-source-button-instance={term.instanceId}
          disabled={props.glossaryDisabled || !props.onTermActivate || frame < term.firstReadableFrame}
          onClick={event => props.onTermActivate?.(term.instanceId, frame, event.currentTarget)}>
          {run.text.slice(term.spanStart,term.spanEnd)}
        </button>);
        cursor = term.spanEnd;
      }
      if (cursor < run.text.length) content.push(<span key={run.id + ':' + cursor}
        data-source-text-id={run.id}>{run.text.slice(cursor)}</span>);
      return content;
    });
  });
  return <section className="p010-source-native" lang="en" data-p010-typography="native-v1"
    data-canvas-status={error ? 'error' : committed && presented === committed ? 'ready' : 'loading'}>
    {error ? <p role="alert">The lesson text and illustration could not load together. Reload this page to try again.</p>
      : committed ? <>
        <h2 className="p010-native-title" data-source-shape-id="97">{P010_TITLE}</h2>
        <p className="p010-native-prose" data-p010-prose="definition">{prose([20, 26])}</p>
        <p className="p010-native-prose" data-p010-prose="coordinates">{prose([32, 36])}</p>
        <figure className="p010-native-figure">
          <div className="p010-graph-scroll" tabIndex={0} aria-label="Scrollable coordinate plane">
            <div className="p010-graph-window" role="img"
              aria-label={p010FigureDescription(frame)}>
              <canvas ref={bindCanvas} width={1600} height={1200} aria-hidden="true"
                data-p010-native-figure="true" data-canvas-frame={frame}/>
              {labels.map(label =>
                <span key={label.id} className="p010-graph-label" aria-hidden="true"
                  data-source-instance-id={label.instanceId} data-source-text-id={label.sourceTextId}
                  data-callout={label.callout ? 'true' : 'false'}
                  style={{left: `calc(${label.x - 40}rem / 13.6)`, top: `calc(${label.y - 185}rem / 13.6)`, opacity: label.alpha}}>
                  {label.text}
                </span>)}
            </div>
          </div>
        </figure>
      </> : <p role="status">Loading lesson text and illustration…</p>}
    {props.uiLanguage === 'es' ? <p className="lesson-text-language-note" lang="es"
      data-lesson-text-language="en" data-spanish-translation="missing">
      Texto original en inglés. Esta página todavía no tiene una traducción al español verificada.
    </p> : null}
  </section>;
}
