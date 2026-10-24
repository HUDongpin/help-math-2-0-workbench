import raw from './generated/g4-l3-in012-native-inputs.json';
import type {In012ColorTransform} from './g4-l3-in012-paints';

type Event = Readonly<{
  kind: string; frame: number; eventId: string; sourceTagSha256: string;
  depth?: number; instanceId?: string; move?: boolean; characterId?: number;
  matrix?: readonly number[]; colorTransform?: In012ColorTransform; ratio?: number;
  clipDepth?: number; name?: Readonly<{text: string}>;
  clipActions?: Readonly<{sha256: string; execution: string}>;
}>;
type Timeline = Readonly<{timelineId: string; declaredFrameCount: number; events: readonly Event[]}>;
export type In012Placement = Readonly<{
  depth: number; characterId: number; instanceId: string; placedAtFrame: number;
  lastEventId: string; matrix: readonly number[]; colorTransform?: In012ColorTransform;
  ratio: number; clipDepth?: number; name?: string; clipActionsSha256?: string;
}>;
export type In012TimelineSnapshot = Readonly<{
  timelineId: string; frame: number; placements: readonly In012Placement[];
  actionEvents: readonly Event[];
}>;
const source = raw.timelines as unknown as readonly Timeline[];
const timelines = new Map(source.map(t => [t.timelineId, t]));
const cache = new Map<string, readonly In012TimelineSnapshot[]>();

/** Reconstruct placement records only. ActionScript visibility is not executed. */
export function compileIn012Timeline(timeline: Timeline): readonly In012TimelineSnapshot[] {
  const depths = new Map<number, In012Placement>();
  const snapshots: In012TimelineSnapshot[] = [];
  let cursor = 0;
  for (const [i, event] of timeline.events.entries()) {
    if (!Number.isInteger(event.frame) || event.frame < 1 || event.frame > timeline.declaredFrameCount ||
        (i > 0 && timeline.events[i - 1]!.frame > event.frame)) throw new Error('Invalid IN012 event order');
  }
  for (let frame = 1; frame <= timeline.declaredFrameCount; frame++) {
    const actions: Event[] = [];
    while (cursor < timeline.events.length && timeline.events[cursor]!.frame === frame) {
      const event = timeline.events[cursor++]!;
      if (event.kind === 'action-bytes') { actions.push(event); continue; }
      if (event.kind === 'frame-label') continue;
      const depth = event.depth;
      if (!Number.isInteger(depth) || depth! < 0) throw new Error('Invalid IN012 event depth');
      const previous = depths.get(depth!);
      if (event.kind === 'remove') {
        if (!previous || previous.instanceId !== event.instanceId) throw new Error('IN012 removal identity mismatch');
        depths.delete(depth!); continue;
      }
      if (event.kind !== 'place') throw new Error('Unsupported IN012 source event');
      if (event.move && !previous) throw new Error('IN012 move without placement');
      if (!event.instanceId) throw new Error('IN012 placement without identity');
      const inherited = event.move ? previous : undefined;
      const characterId = event.characterId ?? inherited?.characterId;
      if (characterId === undefined) throw new Error('IN012 placement without character');
      const matrix = event.matrix ?? inherited?.matrix ?? [1, 0, 0, 1, 0, 0];
      if (matrix.length !== 6 || !matrix.every(Number.isFinite)) throw new Error('Invalid IN012 matrix');
      const ratio = event.ratio ?? inherited?.ratio ?? 0;
      if (!Number.isInteger(ratio) || ratio < 0 || ratio > 65535) throw new Error('Invalid IN012 source ratio');
      const sameInstance = inherited?.instanceId === event.instanceId;
      const colorTransform = event.colorTransform ?? inherited?.colorTransform;
      depths.set(depth!, Object.freeze({depth: depth!, characterId, instanceId: event.instanceId,
        placedAtFrame: sameInstance ? inherited!.placedAtFrame : frame, lastEventId: event.eventId,
        matrix: Object.freeze([...matrix]), ratio,
        colorTransform: colorTransform ? Object.freeze({
          multiply: colorTransform.multiply ? Object.freeze([...colorTransform.multiply]) : undefined,
          add: colorTransform.add ? Object.freeze([...colorTransform.add]) : undefined,
        }) : undefined,
        clipDepth: event.clipDepth ?? inherited?.clipDepth,
        name: event.name?.text ?? inherited?.name,
        clipActionsSha256: event.clipActions?.sha256 ?? inherited?.clipActionsSha256,
      }));
    }
    snapshots.push(Object.freeze({timelineId: timeline.timelineId, frame,
      placements: Object.freeze([...depths.values()].sort((a, b) => a.depth - b.depth)),
      actionEvents: Object.freeze(actions),
    }));
  }
  return Object.freeze(snapshots);
}
export function getIn012Timeline(timelineId: string, frame: number): In012TimelineSnapshot {
  const timeline = timelines.get(timelineId);
  if (!timeline || !Number.isInteger(frame) || frame < 1 || frame > timeline.declaredFrameCount) {
    throw new RangeError('Unknown IN012 timeline or frame');
  }
  if (!cache.has(timelineId)) cache.set(timelineId, compileIn012Timeline(timeline));
  return cache.get(timelineId)![frame - 1]!;
}
export function in012ChildTimeline(characterId: number): {timelineId: string; frameCount: number} | undefined {
  const timeline = timelines.get(`sprite-${characterId}`);
  return timeline ? {timelineId: timeline.timelineId, frameCount: timeline.declaredFrameCount} : undefined;
}
export function composeIn012Color(parent?: In012ColorTransform, child?: In012ColorTransform): In012ColorTransform {
  return {
    multiply: [0, 1, 2, 3].map(i => (parent?.multiply?.[i] ?? 256) * (child?.multiply?.[i] ?? 256) / 256),
    add: [0, 1, 2, 3].map(i => (child?.add?.[i] ?? 0) * (parent?.multiply?.[i] ?? 256) / 256 + (parent?.add?.[i] ?? 0)),
  };
}
