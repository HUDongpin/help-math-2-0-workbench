/** Exact P010 button release keys and source-instance text spans, without
 * dictionary content, HTML, host callbacks or a second playback clock. */
export const P010_GLOSSARY_SOURCE_SHA256 = 'a846950547f7c3ab7b0445dfc2118d534565ffd352b6e9687ba8211e5d4a3fcd';
export const P010_GLOSSARY_MAIN_FRAME_COUNT = 465;

/** Spans are half-open UTF-16 offsets within sourceTextId. Source hit geometry
 * identifies each lexical span; adjacent comma hits remain evidence only.
 * Eligibility uses the complete native run's full ink and opacity, so length
 * and width share frame 86 while retaining independent spans and buttons.
 * Original clipped-hit/host-return parity remains unverified. */
export const P010_GLOSSARY_TERMS = [
  {
    instanceId: 'sprite-96/depth-4/generation-1', characterId: 22,
    sourceKeyAttribute: 'Point', dictionaryLookupKey: 'Point',
    sourceTextInstanceId: 'sprite-96/depth-3/generation-1',
    sourceTextId: 'character-20/run-1', spanStart: 1, spanEnd: 6, firstReadableFrame: 17,
  },
  {
    instanceId: 'sprite-96/depth-6/generation-1', characterId: 23,
    sourceKeyAttribute: 'Geometric figures', dictionaryLookupKey: 'Geometric figures',
    sourceTextInstanceId: 'sprite-96/depth-3/generation-1',
    sourceTextId: 'character-20/run-3', spanStart: 0, spanEnd: 16, firstReadableFrame: 40,
  },
  {
    instanceId: 'sprite-96/depth-8/generation-1', characterId: 24,
    sourceKeyAttribute: 'Position', dictionaryLookupKey: 'Position',
    sourceTextInstanceId: 'sprite-96/depth-3/generation-1',
    sourceTextId: 'character-20/run-5', spanStart: 0, spanEnd: 8, firstReadableFrame: 58,
  },
  {
    instanceId: 'sprite-96/depth-14/generation-1', characterId: 27,
    sourceKeyAttribute: 'length', dictionaryLookupKey: 'Length',
    sourceTextInstanceId: 'sprite-96/depth-13/generation-1',
    sourceTextId: 'character-26/run-0', spanStart: 0, spanEnd: 6, firstReadableFrame: 86,
  },
  {
    instanceId: 'sprite-96/depth-16/generation-1', characterId: 28,
    sourceKeyAttribute: 'Width', dictionaryLookupKey: 'Width',
    sourceTextInstanceId: 'sprite-96/depth-13/generation-1',
    sourceTextId: 'character-26/run-0', spanStart: 8, spanEnd: 13, firstReadableFrame: 86,
  },
  {
    instanceId: 'sprite-96/depth-18/generation-1', characterId: 29,
    sourceKeyAttribute: 'Height', dictionaryLookupKey: 'Height',
    sourceTextInstanceId: 'sprite-96/depth-13/generation-1',
    sourceTextId: 'character-26/run-2', spanStart: 0, spanEnd: 6, firstReadableFrame: 96,
  },
  {
    instanceId: 'sprite-96/depth-24/generation-1', characterId: 33,
    sourceKeyAttribute: 'Coordinate plane/Cartesian Plane', dictionaryLookupKey: 'Coordinate plane/Cartesian Plane',
    sourceTextInstanceId: 'sprite-96/depth-23/generation-1',
    sourceTextId: 'character-32/run-1', spanStart: 1, spanEnd: 17, firstReadableFrame: 134,
  },
  {
    instanceId: 'sprite-96/depth-26/generation-1', characterId: 34,
    sourceKeyAttribute: 'Coordinate', dictionaryLookupKey: 'Coordinate',
    sourceTextInstanceId: 'sprite-96/depth-23/generation-1',
    sourceTextId: 'character-32/run-3', spanStart: 1, spanEnd: 12, firstReadableFrame: 165,
  },
  {
    instanceId: 'sprite-96/depth-32/generation-1', characterId: 37,
    sourceKeyAttribute: 'Ordered pair', dictionaryLookupKey: 'Ordered pair',
    sourceTextInstanceId: 'sprite-96/depth-31/generation-1',
    sourceTextId: 'character-36/run-0', spanStart: 0, spanEnd: 12, firstReadableFrame: 181,
  },
  {
    instanceId: 'sprite-96/depth-34/generation-1', characterId: 24,
    sourceKeyAttribute: 'Position', dictionaryLookupKey: 'Position',
    sourceTextInstanceId: 'sprite-96/depth-31/generation-1',
    sourceTextId: 'character-36/run-2', spanStart: 1, spanEnd: 9, firstReadableFrame: 195,
  },
] as const;

/** Close emits no resume. Actual frame/sample/transport completion is host-owned. */
export const P010_GLOSSARY_CLOSE_POLICY = 'stay-paused-until-explicit-resume; original-parity-pending';

export type P010GlossaryTerm = (typeof P010_GLOSSARY_TERMS)[number];
export type P010GlossaryIntent = P010GlossaryTerm & {readonly requestedAtFrame: number};

function validP010Frame(frame: number): boolean {
  return Number.isSafeInteger(frame) && frame >= 1 && frame <= P010_GLOSSARY_MAIN_FRAME_COUNT;
}

/** The host pauses before dispatching an accepted intent and supplies the exact
 * source button instance. Reused definitions cannot choose a target by CID. */
export function requestP010Glossary(
  frame: number, instanceId: string, alreadyPending: boolean,
): P010GlossaryIntent | null {
  if (!validP010Frame(frame) || typeof instanceId !== 'string' || alreadyPending !== false) return null;
  const term = P010_GLOSSARY_TERMS.find(item => item.instanceId === instanceId);
  if (!term || frame < term.firstReadableFrame) return null;
  return {...term, requestedAtFrame: frame};
}

export interface P010GlossaryState {
  readonly pending: P010GlossaryIntent | null;
}

export type P010GlossaryAction =
  | {readonly kind: 'request'; readonly frame: number; readonly instanceId: string}
  | {readonly kind: 'close' | 'replay' | 'navigation'};

export function initialP010GlossaryState(): P010GlossaryState {
  return {pending: null};
}

/** Pending is the only state. Close stays paused; Replay/navigation clear the
 * request before the host resets/disposes its sole clock. No resume is emitted. */
export function reduceP010Glossary(
  state: P010GlossaryState, action: P010GlossaryAction,
): P010GlossaryState {
  switch (action.kind) {
    case 'request': {
      const intent = requestP010Glossary(action.frame, action.instanceId, state.pending !== null);
      return intent ? {pending: intent} : state;
    }
    case 'close':
    case 'replay':
    case 'navigation':
      return state.pending === null ? state : {pending: null};
    default:
      return state;
  }
}
