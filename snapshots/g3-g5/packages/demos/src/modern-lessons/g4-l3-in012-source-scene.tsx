import React from 'react';
import source from './generated/g4-l3-in012-native-inputs.json';
import {IN012_BITMAPS} from './g4-l3-in012-bitmaps';
import {In012ClippedTimeline, In012ShapePaints, type In012ColorTransform, type In012PaintShape} from './g4-l3-in012-paints';
import {getIn012Timeline, in012ChildTimeline, composeIn012Color, type In012Placement} from './g4-l3-in012-scene';

// JSON inference loses gradient stop tuples; the maintained generator validates them.
const paintShapes = [...source.paints.staticShapes, ...source.paints.morphShapes] as unknown as readonly In012PaintShape[];
const shapes = new Map(paintShapes.map(shape => [shape.characterId, shape]));
const textIds = new Set(source.texts.map(text => text.characterId));
const buttonIds = new Set(source.buttons.map(button => button.characterId));
export type In012NodeContext = Readonly<{
  placement: In012Placement; path: string; timelineId: string; timelineFrame: number;
  colorTransform: In012ColorTransform; mask: boolean;
}>;
export type In012ScenePolicy = Readonly<{
  /** Required on every placement: this is the maintained behavior boundary. */
  resolve: (context: In012NodeContext) => Readonly<{visible: boolean; childFrame?: number}>;
  text: (context: In012NodeContext) => React.ReactNode;
  button: (context: In012NodeContext) => React.ReactNode;
}>;
/** Render source geometry only; scene policy supplies ActionScript-derived state. */
export function In012SourceScene({timelineId, frame, idPrefix, policy, colorTransform, mask = false, path = '', ancestors = []}: {
  timelineId: string; frame: number; idPrefix: string; policy: In012ScenePolicy;
  colorTransform?: In012ColorTransform; mask?: boolean; path?: string; ancestors?: readonly string[];
}) {
  if (ancestors.includes(timelineId) || ancestors.length > 24) throw new Error('IN012 cyclic source scene');
  const snapshot = getIn012Timeline(timelineId, frame);
  const nodes = snapshot.placements.flatMap(placement => {
    const nodePath = `${path}/${placement.instanceId}`;
    const combined = composeIn012Color(colorTransform, placement.colorTransform);
    const context: In012NodeContext = {placement, path: nodePath, timelineId, timelineFrame: frame,
      colorTransform: combined, mask: mask || placement.clipDepth !== undefined};
    const state = policy.resolve(context);
    if (!state.visible) return [];
    const prefix = `${idPrefix}-d${placement.depth}`;
    const shape = shapes.get(placement.characterId);
    const child = in012ChildTimeline(placement.characterId);
    let content: React.ReactNode;
    if (shape) {
      content = <In012ShapePaints shape={shape} ratio={placement.ratio} idPrefix={prefix} colorTransform={combined} bitmaps={IN012_BITMAPS} mask={context.mask}/>;
    } else if (child) {
      const childFrame = state.childFrame ?? (child.frameCount === 1 ? 1 : undefined);
      if (childFrame === undefined) throw new Error(`IN012 child frame policy missing: ${nodePath}`);
      content = <In012SourceScene timelineId={child.timelineId} frame={childFrame} idPrefix={prefix} policy={policy}
        colorTransform={combined} mask={context.mask} path={nodePath} ancestors={[...ancestors, timelineId]}/>;
    } else if (textIds.has(placement.characterId)) {
      content = policy.text(context);
    } else if (buttonIds.has(placement.characterId)) {
      content = policy.button(context);
    } else {
      throw new Error(`Unknown IN012 source character ${placement.characterId}`);
    }
    return [{depth: placement.depth, clipDepth: placement.clipDepth,
      content: <g transform={`matrix(${placement.matrix.join(' ')})`} data-source-instance={placement.instanceId}>{content}</g>}];
  });
  return <In012ClippedTimeline nodes={nodes} idPrefix={idPrefix}/>;
}
