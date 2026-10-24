import React from 'react';
import {in012MorphPath, type In012MorphPaint} from './g4-l3-in012-morph';

type Numbers = readonly number[];
export type In012ColorTransform = Readonly<{multiply?: Numbers; add?: Numbers}>;
export type In012Bitmap = Readonly<{href: string; width: number; height: number}>;
type Stop = readonly [number, Numbers];
type Style = Readonly<{
  kind?: string; rgba?: Numbers; widthTwips?: number; matrix?: Numbers;
  stops?: readonly Stop[]; bitmapId?: number; repeat?: boolean;
}>;
type Paint = Readonly<{kind: string; d: string; style: Style}>;
type StaticShape = Readonly<{characterId: number; epochs: readonly Readonly<{paints: readonly Paint[]}>[]}>;
type MorphStyle = Readonly<{
  kind: string; startRgba?: Numbers; endRgba?: Numbers;
  startMatrix?: Numbers; endMatrix?: Numbers;
  stops?: readonly Readonly<{startRatio: number; endRatio: number; startRgba: Numbers; endRgba: Numbers}>[];
}>;
type MorphLine = Readonly<{startWidthTwips: number; endWidthTwips: number; startRgba: Numbers; endRgba: Numbers}>;
type MorphShape = Readonly<{
  characterId: number; paints: readonly In012MorphPaint[];
  decoded: Readonly<{fills: readonly MorphStyle[]; lines: readonly MorphLine[]}>;
}>;
export type In012PaintShape = StaticShape | MorphShape;

function interpolate(a: Numbers, b: Numbers, fraction: number): number[] {
  if (a.length !== b.length || ![...a, ...b].every(Number.isFinite)) throw new Error('Invalid IN012 style endpoints');
  return a.map((v, i) => v + (b[i]! - v) * fraction);
}
function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`Missing IN012 ${label}`);
  return value;
}
export function in012Color(rgba: Numbers, transform?: In012ColorTransform): string {
  if (rgba.length !== 4) throw new Error('Invalid IN012 RGBA');
  const values = rgba.map((v, i) => Math.max(0, Math.min(255,
    v * (transform?.multiply?.[i] ?? 256) / 256 + (transform?.add?.[i] ?? 0))));
  if (!values.every(Number.isFinite)) throw new Error('Nonfinite IN012 color');
  return `rgba(${values[0]},${values[1]},${values[2]},${values[3]! / 255})`;
}
export function in012Paints(shape: In012PaintShape, ratio: number): readonly Paint[] {
  if (!Number.isInteger(ratio) || ratio < 0 || ratio > 65535) throw new RangeError('Invalid IN012 ratio');
  if ('epochs' in shape) return shape.epochs.flatMap(epoch => epoch.paints);
  const fraction = ratio / 65535;
  return shape.paints.map(paint => {
    let style: Style;
    if (paint.kind === 'stroke') {
      const line = required(shape.decoded.lines[paint.sourceStyleIndex - 1], 'morph line');
      style = {widthTwips: line.startWidthTwips + (line.endWidthTwips - line.startWidthTwips) * fraction,
        rgba: interpolate(line.startRgba, line.endRgba, fraction)};
    } else {
      const fill = required(shape.decoded.fills[paint.sourceStyleIndex - 1], 'morph fill');
      if (fill.kind === 'solid') {
        style = {kind: 'solid', rgba: interpolate(required(fill.startRgba, 'start color'), required(fill.endRgba, 'end color'), fraction)};
      } else if (fill.kind === 'linear-gradient' || fill.kind === 'radial-gradient') {
        style = {kind: fill.kind,
          matrix: interpolate(required(fill.startMatrix, 'start matrix'), required(fill.endMatrix, 'end matrix'), fraction),
          stops: required(fill.stops, 'gradient stops').map(stop => [
            stop.startRatio + (stop.endRatio - stop.startRatio) * fraction,
            interpolate(stop.startRgba, stop.endRgba, fraction)] as const)};
      } else throw new Error(`Unsupported IN012 morph fill: ${fill.kind}`);
    }
    return {kind: paint.kind, d: in012MorphPath(paint, ratio), style};
  });
}

/** Render source-local twips. Caller owns placement transforms and clip depth. */
export function In012ShapePaints({shape, ratio = 0, idPrefix, colorTransform, bitmaps, mask = false}: {
  shape: In012PaintShape; ratio?: number; idPrefix: string;
  colorTransform?: In012ColorTransform; bitmaps?: ReadonlyMap<number, In012Bitmap>; mask?: boolean;
}) {
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(idPrefix)) throw new Error('Invalid IN012 SVG ID prefix');
  return <g data-in012-shape={shape.characterId}>{in012Paints(shape, ratio).map((paint, index) => {
    const style = paint.style;
    const id = `${idPrefix}-paint-${index}`;
    if (paint.kind === 'stroke') {
      const width = required(style.widthTwips, 'stroke width');
      return <path key={id} d={paint.d} fill="none" stroke={mask ? '#fff' : in012Color(required(style.rgba, 'stroke color'), colorTransform)}
        strokeWidth={width === 0 ? 1 : width} vectorEffect={width === 0 ? 'non-scaling-stroke' : undefined}
        strokeLinecap="round" strokeLinejoin="round"/>;
    }
    if (paint.kind !== 'fill') throw new Error('Unknown IN012 paint kind');
    if (mask) return <path key={id} d={paint.d} fill="#fff" fillRule="evenodd" clipRule="evenodd"/>;
    if (style.kind === 'solid') return <path key={id} d={paint.d} fill={in012Color(required(style.rgba, 'fill color'), colorTransform)} fillRule="evenodd"/>;
    if (style.kind === 'linear-gradient' || style.kind === 'radial-gradient') {
      const matrix = required(style.matrix, 'gradient matrix');
      if (matrix.length !== 6 || !matrix.every(Number.isFinite)) throw new Error('Invalid IN012 gradient matrix');
      const stops = required(style.stops, 'gradient stops').map(([offset, rgba], i) =>
        <stop key={i} offset={Math.max(0, Math.min(1, offset / 255))} stopColor={in012Color(rgba, colorTransform)}/>);
      return <React.Fragment key={id}><defs>{style.kind === 'linear-gradient' ?
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={-16384} x2={16384} y1={0} y2={0} gradientTransform={`matrix(${matrix.join(' ')})`} spreadMethod="pad">{stops}</linearGradient> :
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={16384} gradientTransform={`matrix(${matrix.join(' ')})`} spreadMethod="pad">{stops}</radialGradient>}</defs>
        <path d={paint.d} fill={`url(#${id})`} fillRule="evenodd"/></React.Fragment>;
    }
    if (style.kind === 'bitmap') {
      if (style.repeat) throw new Error('IN012 repeating bitmap is unsupported');
      const bitmap = required(bitmaps?.get(required(style.bitmapId, 'bitmap ID')), 'hash-bound bitmap');
      const matrix = required(style.matrix, 'bitmap matrix');
      if (matrix.length !== 6 || !matrix.every(Number.isFinite) || bitmap.width <= 0 || bitmap.height <= 0) throw new Error('Invalid IN012 bitmap geometry');
      const filterId = `${id}-color`;
      const channels = [0, 1, 2, 3].map(i => ({slope: (colorTransform?.multiply?.[i] ?? 256) / 256, intercept: (colorTransform?.add?.[i] ?? 0) / 255}));
      if (!channels.every(c => Number.isFinite(c.slope) && Number.isFinite(c.intercept))) throw new Error('Invalid IN012 bitmap color transform');
      const needsFilter = channels.some(c => c.slope !== 1 || c.intercept !== 0);
      return <React.Fragment key={id}><defs><clipPath id={id} clipPathUnits="userSpaceOnUse"><path d={paint.d} clipRule="evenodd"/></clipPath>
        {needsFilter && <filter id={filterId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB"><feComponentTransfer>
          <feFuncR type="linear" {...channels[0]}/><feFuncG type="linear" {...channels[1]}/><feFuncB type="linear" {...channels[2]}/><feFuncA type="linear" {...channels[3]}/>
        </feComponentTransfer></filter>}</defs>
        <g clipPath={`url(#${id})`}><image href={bitmap.href} width={bitmap.width} height={bitmap.height} transform={`matrix(${matrix.join(' ')})`} filter={needsFilter ? `url(#${filterId})` : undefined} preserveAspectRatio="none"/></g></React.Fragment>;
    }
    throw new Error(`Unsupported IN012 fill: ${style.kind}`);
  })}</g>;
}

export type In012DepthNode = Readonly<{
  depth: number;
  clipDepth?: number;
  content: React.ReactNode;
}>;
/** One source timeline at a time. Overlapping clip ranges intersect. */
export function In012ClippedTimeline({nodes, idPrefix}: {
  nodes: readonly In012DepthNode[]; idPrefix: string;
}) {
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(idPrefix)) throw new Error('Invalid IN012 clip prefix');
  const ordered = [...nodes].sort((a, b) => a.depth - b.depth);
  const seen = new Set<number>();
  for (const node of ordered) {
    if (!Number.isInteger(node.depth) || node.depth < 0 || seen.has(node.depth)) throw new Error('Invalid IN012 source depth');
    seen.add(node.depth);
    if (node.clipDepth !== undefined && (!Number.isInteger(node.clipDepth) || node.clipDepth <= node.depth)) throw new Error('Invalid IN012 clip depth');
  }
  const masks = ordered.filter(node => node.clipDepth !== undefined);
  return <g data-in012-timeline={idPrefix}><defs>{masks.map(mask =>
    <clipPath key={mask.depth} id={`${idPrefix}-clip-${mask.depth}`} clipPathUnits="userSpaceOnUse">{mask.content}</clipPath>)}</defs>
    {ordered.filter(node => node.clipDepth === undefined).map(node => {
      let content = <g data-source-depth={node.depth}>{node.content}</g>;
      for (const mask of masks.filter(mask => mask.depth < node.depth && node.depth <= mask.clipDepth!)) {
        content = <g clipPath={`url(#${idPrefix}-clip-${mask.depth})`}>{content}</g>;
      }
      return <React.Fragment key={node.depth}>{content}</React.Fragment>;
    })}</g>;
}
