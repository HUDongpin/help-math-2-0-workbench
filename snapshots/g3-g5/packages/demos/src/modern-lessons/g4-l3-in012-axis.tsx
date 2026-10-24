import React, {useId} from 'react';
import source from './generated/g4-l3-in012-native-inputs.json';
import {getIn012Timeline} from './g4-l3-in012-scene';
import {In012ShapePaints, type In012PaintShape} from './g4-l3-in012-paints';
const left = -5800, width = 11600;
const shapes = source.paints.staticShapes as unknown as readonly In012PaintShape[];
const axisIds = new Set([7, 9, 18, 20]);
const tickShape = source.paints.staticShapes.find(s => s.characterId === 20)!;
const tickPath = tickShape.epochs[0]!.paints[0]!.d;
const ticks = [...tickPath.matchAll(/M(-?\d+) (-?\d+)/g)].map(m => Number(m[1])).sort((a,b) => a-b);
if (ticks.length !== 17) throw new Error('IN012 source tick count mismatch');
const reference = getIn012Timeline('sprite-228', 174).placements;
const transform = reference.find(p => p.characterId === 20)!.matrix;
export function in012TickLeft(value: number): string {
  if (!Number.isInteger(value) || value < -8 || value > 8) throw new RangeError('Invalid IN012 axis value');
  return `${((ticks[value + 8]! * transform[0]! + transform[4]! - left) / width) * 100}%`;
}
export function in012TargetLeft(targetId: string): string {
  const target = reference.find(p => p.name === targetId);
  if (!target || !/^Mc_Tar_[1-5]$/.test(targetId)) throw new Error('Unknown IN012 target');
  return `${(target.matrix[4]! - left) / width * 100}%`;
}
/** Original axis paths in a responsive strip; teaching labels stay native HTML. */
export function In012AxisArt({frame, top}: {frame: number; top: string}) {
  const prefix = `in012axis-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const nodes = getIn012Timeline('sprite-228', frame).placements.filter(p => axisIds.has(p.characterId));
  return <svg className="in012-source-axis" aria-hidden="true" data-in012-source-axis="true" viewBox={`${left} -850 ${width} 950`} preserveAspectRatio="none"
    style={{position:'absolute',left:0,top,width:'100%',height:'2rem',overflow:'visible'}}>
    <style>{'.in012-source-axis path[stroke]{vector-effect:non-scaling-stroke;stroke-width:.125rem}'}</style>
    {nodes.map(node => <g key={node.instanceId} transform={`matrix(${node.matrix.join(' ')})`}>
      <In012ShapePaints shape={shapes.find(s => s.characterId === node.characterId)!} idPrefix={`${prefix}-${node.depth}`} colorTransform={node.colorTransform}/>
    </g>)}
  </svg>;
}
