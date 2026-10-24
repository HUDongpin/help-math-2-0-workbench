// Private P003 bridge to the fixed-size generated source-drawing candidate.
// Call with a detached 800x600 canvas; publish its pixels and native text only
// after a ready result. This is not a Current-JS registration or acceptance.
import type {RuntimeContext} from '../contract';
import type {TextPresentationSnapshot} from '../lesson-text-contract';
import {NMS_L09_P003_TEXT_BINDING, projectNmsL09P003Text} from
  './shared-nms002-l09-p003-source-text';
import type {NmsL09P003ClockState} from
  './shared-nms002-l09-p003-source-clock';

export interface NmsL09P003CanvasCandidate {
  readonly metadata: {
    readonly animationId: string;
    readonly classification: string;
    readonly sourceSwfSha256: string;
    readonly stage: {readonly width: number; readonly height: number};
  };
  ready(): Promise<void>;
  render(canvas: HTMLCanvasElement, request: Record<string, unknown>): unknown;
  renderWithText(canvas: HTMLCanvasElement, request: Record<string, unknown>): unknown;
}

const EMPHASIS = Object.freeze([
  {frame: 590, shape: 'root:1:1:246/sprite-246:282:1:227'},
  {frame: 592, shape: 'root:1:1:246/sprite-246:285:1:227'},
  {frame: 594, shape: 'root:1:1:246/sprite-246:285:2:227'},
  {frame: 615, shape: 'root:1:1:246/sprite-246:285:3:238'},
  {frame: 617, shape: 'root:1:1:246/sprite-246:285:4:238'},
  {frame: 619, shape: 'root:1:1:246/sprite-246:285:5:238'},
] as const);
const TITLE_OUTLINE = 'root:298:1:249/sprite-249:1:1:248';
const TEXT_IDS = Object.freeze(NMS_L09_P003_TEXT_BINDING.blocks.map(block =>
  block.instance.id));
const SHAPE_IDS = Object.freeze([TITLE_OUTLINE, ...EMPHASIS.map(item => item.shape)]);

function sameIds(actual: unknown, expected: readonly string[]): boolean {
  return Array.isArray(actual) && actual.length === expected.length &&
    actual.every((id: unknown) => typeof id === 'string') &&
    new Set(actual).size === expected.length &&
    expected.every(id => actual.includes(id));
}

function expectedDrawnIds(frame: number): readonly string[] {
  const persistent = TEXT_IDS.slice(0, 8);
  const expression = frame >= 591 ? [TEXT_IDS[8]!] : [];
  const emphasis = EMPHASIS.find(item => item.frame === frame);
  const emphasisIndex = EMPHASIS.findIndex(item => item.frame === frame);
  return [...persistent, ...expression,
    ...(emphasis ? [TEXT_IDS[9 + emphasisIndex]!, emphasis.shape] : []),
    TITLE_OUTLINE];
}

function matchesSourceState(value: unknown, frame: number): boolean {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  return state.localFrame === frame && state.frameDomain === 'sprite-246' &&
    state.rootFrame === 6 && state.scenario === 'source-static-frame' &&
    state.lang === 'en' && state.seed === 0 && state.visualOnly === true &&
    state.audioRendered === false;
}

/** The generated asset requests all 15 text and 7 shape IDs but reports only
 * draw sites active in this frame. The shared plane assumes all requested IDs
 * are reported and requires honest 1x/2x support, so it cannot host this asset.
 */
export function renderNmsL09P003CanvasCandidate({adapter, canvas, clock,
  context}: {
  readonly adapter: NmsL09P003CanvasCandidate;
  readonly canvas: HTMLCanvasElement;
  readonly clock: NmsL09P003ClockState;
  readonly context: RuntimeContext;
}): Readonly<{
  status: 'ready' | 'legacy-fallback';
  snapshot: TextPresentationSnapshot;
  blockers: readonly string[];
  suppressedInstanceIds: readonly string[];
  sourceLanguagePolicy: 'source' | 'source-fallback';
  emphasisRow: 'tank-one' | 'addend-one' | null;
}> {
  const projection = projectNmsL09P003Text(clock, context);
  const snapshot = projection.snapshot;
  if (canvas.width !== 800 || canvas.height !== 600 ||
      adapter.metadata.animationId !== 'course-shared-nms002-l09-p003' ||
      adapter.metadata.classification !==
        'private-root-held-nested-source-drawing-candidate-v1' ||
      adapter.metadata.sourceSwfSha256 !== snapshot.sourceSwfSha256 ||
      adapter.metadata.stage.width !== 800 ||
      adapter.metadata.stage.height !== 600) {
    throw new Error('P003 fixed-canvas source identity or resolution mismatch');
  }
  const sourceRequest = {frame: clock.frame, frameDomain: 'sprite-246',
    rootFrame: 6, scenario: 'source-static-frame', lang: 'en', seed: 0};
  const requested = snapshot.suppressedInstances.map(item => item.id);
  let blocker: string | null = null;
  let seen: readonly string[] = [];
  if (snapshot.status !== 'ready' || snapshot.blockers.length ||
      !sameIds(requested, TEXT_IDS)) {
    blocker = 'P003 text snapshot is not exact';
  } else {
    try {
      const result = adapter.renderWithText(canvas, {...sourceRequest, text: {
        status: 'ready', animationId: snapshot.animationId,
        sourceSwfSha256: snapshot.sourceSwfSha256,
        bindingVersion: snapshot.bindingVersion, frame: clock.frame,
        suppressInstanceIds: requested,
        suppressShapeInstanceIds: SHAPE_IDS,
      }}) as Record<string, unknown> | null;
      if (!result || !matchesSourceState(result.state, clock.frame) ||
          !sameIds(result.suppressedInstanceIds,
            expectedDrawnIds(clock.frame))) {
        blocker = 'P003 active text and outline suppression is incomplete';
      } else {
        seen = result.suppressedInstanceIds as readonly string[];
      }
    } catch {
      blocker = 'P003 exact text suppression failed';
    }
  }
  if (blocker) {
    // A failed partial draw may leave holes. Redraw every source glyph before
    // allowing the canvas to be shown without its semantic DOM counterpart.
    const rawState = adapter.render(canvas, sourceRequest);
    if (!matchesSourceState(rawState, clock.frame)) {
      throw new Error('P003 raw source fallback state mismatch');
    }
    return {status: 'legacy-fallback', snapshot: {...snapshot,
      status: 'blocked', blockers: [...snapshot.blockers, blocker],
      blocks: [], suppressedInstances: []}, blockers: [blocker],
      suppressedInstanceIds: [],
      sourceLanguagePolicy: projection.sourceLanguagePolicy,
      emphasisRow: projection.emphasisRow};
  }
  return {status: 'ready', snapshot, blockers: [],
    suppressedInstanceIds: seen,
    sourceLanguagePolicy: projection.sourceLanguagePolicy,
    emphasisRow: projection.emphasisRow};
}
