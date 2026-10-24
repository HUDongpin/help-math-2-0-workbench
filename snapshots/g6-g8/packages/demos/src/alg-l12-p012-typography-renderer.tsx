'use client';

import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {P012_TEXT_DATA} from './generated/alg-l12-p012-text-data';
import type {P012LessonState} from './alg-l12-p012-lesson';
import {P012_SOURCE, type P012State} from './alg-l12-p012-state';
import {p012TextSnapshot, type P012TextItem, type P012TextSnapshot} from './alg-l12-p012-text';

const ANIMATION_ID = 'shared-alg001-l12-p012';
const TITLE = 'Graphing in the Coordinate Plane: Vocabulary';
const TITLE_INSTANCE = 'root/depth-1/generation-1';
const UNDERLINE_INSTANCE = 'sprite-86/depth-2/generation-1';
const POPUP_TEXT_INSTANCE = 'sprite-74/depth-10/generation-1';
const POPUP_CLOSE_INSTANCE = 'button-71/record-4';
const COACH_MARKER_INSTANCE = 'sprite-76/depth-1/generation-1';

export interface P012TypographyAsset {
  ready(): Promise<void>;
  renderIntro(canvas: HTMLCanvasElement, request: Readonly<{
    mainFrame: number; suppressInstanceIds: readonly string[]
  }>): P012TypographyResult;
  renderInteractive(canvas: HTMLCanvasElement, state: P012State, request: Readonly<{
    suppressInstanceIds: readonly string[]
  }>): P012TypographyResult;
  readonly metadata: Readonly<{animationId: string; sourceSha256: string; renderScale: number}>;
}

export interface P012TypographyResult {
  readonly source: Readonly<{frameDomain: string; mainFrame: number; rootFrame: number}>;
  readonly renderScale: number;
  readonly suppressedInstanceIds: readonly string[];
  readonly unfulfilledSuppressionIds: readonly string[];
}

export interface P012TypographyRendererProps {
  readonly asset: P012TypographyAsset;
  readonly state: P012LessonState;
  readonly onCoordinate?: (trigger: HTMLButtonElement) => void;
  readonly uiLanguage?: 'en' | 'es';
}

/** These are exact source display-list identities, not text character IDs.
 * The runtime refuses any unknown ID and reports every placement it consumes. */
export function p012TypographySuppressions(state: P012LessonState): readonly string[] {
  const ids: string[] = P012_TEXT_DATA.instances.filter(instance =>
    instance.timelineId === 'sprite-86' &&
    instance.firstFrame <= state.frame && state.frame < instance.lastFrameExclusive)
    .map(instance => instance.instanceId);
  ids.push(TITLE_INSTANCE);
  if (state.frame >= 32) ids.push(UNDERLINE_INSTANCE);
  if (state.phase === 'interaction') {
    ids.push(P012_TEXT_DATA.dynamicCoordinate.bubbleFieldInstanceId);
    if (state.interaction.popup.visible) ids.push(POPUP_TEXT_INSTANCE, POPUP_CLOSE_INSTANCE);
    if (state.interaction.coach.playing && state.interaction.coach.frame <= 2) ids.push(COACH_MARKER_INSTANCE);
  }
  return ids;
}

function percent(value: number, size: 800 | 600): string { return `${value / size * 100}%`; }

function textPosition(item: {x: number; y: number}) {
  return {left: percent(item.x, 800), top: percent(item.y, 600)};
}

function instruction(item: P012TextItem, props: P012TypographyRendererProps) {
  const coordinateRun = item.sourceTextId === 'character-51/run-1' && item.text.startsWith(' ');
  const visibleWord = coordinateRun ? item.text.slice(1, ' coordinates'.length) : '';
  const wholeWord = visibleWord === 'coordinates';
  return <span key={item.sourceTextId} className="p012-native-instruction-run"
    data-source-baseline-x={item.x} data-source-baseline-y={item.y}
    data-source-text-id={item.sourceTextId}
    data-source-instance-id={item.instanceId}>
    {coordinateRun ? <>{' '}{wholeWord ? <button type="button" className="p012-native-coordinate-term"
      data-source-button-id="53" disabled={!props.onCoordinate || props.state.phase === 'left'}
      onClick={event => props.onCoordinate?.(event.currentTarget)}>coordinates</button>
      : <span className="p012-native-coordinate-reveal">{visibleWord}</span>}
      {item.text.slice(1 + visibleWord.length)}</> : item.text}
  </span>;
}

function label(item: P012TextItem, type: 'axis' | 'control') {
  return <span key={item.instanceId} className={`p012-native-${type}-label`}
    style={textPosition(item)} data-source-text-id={item.sourceTextId}
    data-source-instance-id={item.instanceId}>{item.text}</span>;
}

function nestedTextAnchor(characterId: 66 | 73, instanceId: string,
  parents: readonly string[]): {x: number; y: number} {
  const definition = P012_TEXT_DATA.definitions.find(item => item.characterId === characterId);
  if (!definition || !('runs' in definition) || !('matrix' in definition))
    throw new Error(`P012 missing nested text ${characterId}`);
  const run = definition.runs[0];
  if (!run) throw new Error(`P012 missing nested text run ${characterId}`);
  const point = (matrix: readonly number[], [x, y]: readonly [number, number]): [number, number] =>
    [matrix[0]! * x + matrix[2]! * y + matrix[4]!,
      matrix[1]! * x + matrix[3]! * y + matrix[5]!];
  let anchor: [number, number] = point(definition.matrix, run.baselineTwips);
  const placement = instanceId === POPUP_CLOSE_INSTANCE
    ? P012_TEXT_DATA.buttonStateTextInstances.find(item => item.instanceId === instanceId)?.matrix
    : P012_TEXT_DATA.instances.find(item => item.instanceId === instanceId)?.poseSegments[0]?.pose.matrix;
  if (!placement) throw new Error(`P012 missing nested placement ${instanceId}`);
  anchor = point(placement, anchor);
  for (const childTimelineId of parents) {
    const matrix = P012_TEXT_DATA.parentPlacements.find(item => item.childTimelineId === childTimelineId)?.matrix;
    if (!matrix) throw new Error(`P012 missing parent placement ${childTimelineId}`);
    anchor = point(matrix, anchor);
  }
  return {x: anchor[0] / 20, y: anchor[1] / 20};
}

/** Source baselines after each nested placement and the root 800×600 mapping. */
const POPUP_TEXT_ANCHOR = nestedTextAnchor(73, POPUP_TEXT_INSTANCE, ['sprite-74', 'sprite-86']);
const POPUP_CLOSE_ANCHOR = nestedTextAnchor(66, POPUP_CLOSE_INSTANCE,
  ['button-71', 'sprite-74', 'sprite-86']);

export function P012TypographyRenderer(props: P012TypographyRendererProps) {
  const {asset, state} = props;
  const visible = useRef<HTMLCanvasElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [assetReady, setAssetReady] = useState(false);
  const [failure, setFailure] = useState(false);
  const [diagramScrollNeeded, setDiagramScrollNeeded] = useState(false);
  const [presented, setPresented] = useState<Readonly<{lesson: P012LessonState; text: P012TextSnapshot}> | null>(null);

  useLayoutEffect(() => {
    const viewport = scroller.current;
    if (!viewport) return;
    const update = () => setDiagramScrollNeeded(viewport.scrollWidth > viewport.clientWidth + 1);
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let live = true;
    setAssetReady(false);
    void asset.ready().then(() => {if (live) setAssetReady(true);})
      .catch(() => {if (live) setFailure(true);});
    return () => {live = false;};
  }, [asset]);

  useLayoutEffect(() => {
    if (!assetReady || !visible.current) return;
    const target = visible.current;
    if (state.phase === 'left') {
      target.getContext('2d')?.clearRect(0, 0, 1600, 1200);
      setPresented(null);
      return;
    }
    try {
      if (asset.metadata.animationId !== ANIMATION_ID ||
        asset.metadata.sourceSha256 !== P012_SOURCE.swfSha256 || asset.metadata.renderScale !== 2)
        throw new Error('P012 typography asset identity mismatch');
      const snapshot = p012TextSnapshot(state.frame, state.interaction.coordinateText);
      const suppressed = p012TypographySuppressions(state);
      const staging = document.createElement('canvas');
      staging.width = 1600; staging.height = 1200;
      const result = state.phase === 'interaction'
        ? asset.renderInteractive(staging, state.interaction, {suppressInstanceIds: suppressed})
        : asset.renderIntro(staging, {mainFrame: state.frame, suppressInstanceIds: suppressed});
      if (result.renderScale !== 2 || result.source.frameDomain !== 'sprite-86' ||
        result.source.mainFrame !== state.frame || result.source.rootFrame !== 6 ||
        result.unfulfilledSuppressionIds.length !== 0 ||
        result.suppressedInstanceIds.length !== suppressed.length ||
        suppressed.some(id => !result.suppressedInstanceIds.includes(id)))
        throw new Error('P012 native text and source drawing disagree');
      const context = target.getContext('2d');
      if (!context) throw new Error('P012 visible canvas unavailable');
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, 1600, 1200);
      context.drawImage(staging, 0, 0);
      setPresented({lesson: state, text: snapshot});
      setFailure(false);
    } catch {
      target.getContext('2d')?.clearRect(0, 0, 1600, 1200);
      setPresented(null);
      setFailure(true);
    }
  }, [asset, assetReady, state]);

  const committed = !failure && presented?.lesson === state ? presented.text : null;
  const coordinate = committed?.coordinate;
  const coordinateX = coordinate ? coordinate.x +
    (state.phase === 'interaction' ? state.interaction.bubble.x - P012_SOURCE.bubbleOrigin.x : 0) : 0;
  const coordinateY = coordinate ? coordinate.y +
    (state.phase === 'interaction' ? state.interaction.bubble.y - P012_SOURCE.bubbleOrigin.y : 0) : 0;

  return <section className="p012-typography" lang="en" data-p012-typography="native-v1"
    data-flash-animation-id={ANIMATION_ID} data-flash-frame-domain="sprite-86"
    data-flash-root-frame="6" data-flash-frame={state.frame}
    data-canvas-status={failure ? 'error' : committed ? 'ready' : 'loading'}>
    {committed && <>
      <h2 className="p012-native-title" data-source-shape-id="1"
        data-source-instance-id={TITLE_INSTANCE}>{TITLE}</h2>
      {committed.introRuns.length > 0 && <p className="p012-native-prose">
        {committed.introRuns.map(item => instruction(item, props))}
      </p>}
    </>}
    {diagramScrollNeeded && <p className="p012-diagram-scroll-help" id="p012-diagram-scroll-help">
      Scroll horizontally to view the full coordinate plane.
    </p>}
    <div ref={scroller} className="p012-typography-viewport" role="region" tabIndex={0}
      aria-label="Scrollable coordinate plane illustration"
      aria-describedby={diagramScrollNeeded ? 'p012-diagram-scroll-help' : undefined}>
      <figure className="p012-typography-stage">
        <canvas ref={visible} width={1600} height={1200} aria-hidden="true" />
        {committed && <>
          {committed.labels.map(item => label(item, 'axis'))}
          {committed.controlLabels.map(item => label(item, 'control'))}
          {coordinate && <span className="p012-native-coordinate" style={textPosition({x: coordinateX, y: coordinateY})}
            data-source-text-id={coordinate.sourceTextId}
            data-source-instance-id={coordinate.instanceId}>{coordinate.text}</span>}
          {state.phase === 'interaction' && state.interaction.popup.visible && <>
            <span className="p012-native-feedback" style={textPosition(POPUP_TEXT_ANCHOR)}
              data-source-text-id={committed.feedbackText.sourceTextId}
              data-source-instance-id={POPUP_TEXT_INSTANCE}>{committed.feedbackText.text}</span>
            <span className="p012-native-close-label" style={textPosition(POPUP_CLOSE_ANCHOR)}
              data-source-text-id="character-66/run-0"
              data-source-instance-id={POPUP_CLOSE_INSTANCE}>Close</span>
          </>}
        </>}
        <figcaption className="p012-typography-caption">Coordinate plane. Spider ordered pair{' '}
          {state.interaction.coordinateText}.</figcaption>
      </figure>
    </div>
    {failure && <p role="alert">The lesson text and illustration could not load together. Reload this page to try again.</p>}
    {!failure && !committed && <p role="status">Loading lesson text and illustration…</p>}
    {props.uiLanguage === 'es' && <p className="lesson-text-language-note" lang="es"
      data-lesson-text-language="en" data-spanish-translation="missing">
      Texto original en inglés. Esta página todavía no tiene una traducción al español verificada.
    </p>}
  </section>;
}
