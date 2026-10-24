/** Source endpoint interpolation for IN012. No ActionScript or timeline policy. */
export type In012MorphEdge = Readonly<{
  sourceEdgeIndex: number;
  reversed: boolean;
  start: readonly number[];
  end: readonly number[];
}>;
export type In012MorphPaint = Readonly<{
  kind: string;
  sourceStyleIndex: number;
  contours: readonly Readonly<{closed: boolean; edges: readonly In012MorphEdge[]}>[];
}>;

export function in012MorphPath(paint: In012MorphPaint, ratio: number): string {
  if (!Number.isInteger(ratio) || ratio < 0 || ratio > 65535) {
    throw new RangeError('IN012 morph ratio must be an unsigned 16-bit integer');
  }
  const fraction = ratio / 65535;
  return paint.contours.map(contour => {
    if (!contour.edges.length) throw new Error('Empty IN012 morph contour');
    let first: number[] | undefined;
    let previous: number[] | undefined;
    const commands: string[] = [];
    for (const edge of contour.edges) {
      if (![4, 6].includes(edge.start.length) || edge.start.length !== edge.end.length ||
          ![...edge.start, ...edge.end].every(Number.isFinite)) {
        throw new Error('Invalid IN012 paired edge');
      }
      const values = edge.start.map((value, i) => value + (edge.end[i]! - value) * fraction);
      if (!first) {
        first = values.slice(0, 2);
        commands.push(`M${first.join(' ')}`);
      } else if (previous![0] !== values[0] || previous![1] !== values[1]) {
        throw new Error('Discontinuous IN012 paired contour');
      }
      commands.push(`${values.length === 4 ? 'L' : 'Q'}${values.slice(2).join(' ')}`);
      previous = values.slice(-2);
    }
    if (contour.closed) {
      if (first![0] !== previous![0] || first![1] !== previous![1]) {
        throw new Error('IN012 closed contour endpoints differ');
      }
      commands.push('Z');
    } else if (paint.kind === 'fill') {
      throw new Error('IN012 fill contour must be closed');
    }
    return commands.join(' ');
  }).join(' ');
}
