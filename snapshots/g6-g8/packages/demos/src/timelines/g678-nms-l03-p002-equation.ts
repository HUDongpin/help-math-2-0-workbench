/** Source table: Monday 2/3 mile, Tuesday 1/2 mile, Wednesday 3/4 mile.
 * At source frame 626 the unit-free sum is placed (depths 104–116).
 * Its last plus sign has no following operand. The modern presentation omits
 * that redundant sign and retains the unanswered question. Raw art is retained.
 */
export function nmsL3P002Equation(frame: number) {
  if (!Number.isSafeInteger(frame) || frame < 1 || frame > 688) throw Error('invalid-nms-l3-source-frame');
  return Object.freeze({visible: frame >= 626, terms: Object.freeze(['2/3', '1/2', '3/4']), answer: '?' as const});
}

/** Paint in the same 800 × 600 coordinate system as the source drawing. */
export function paintNmsL3P002Equation(context: CanvasRenderingContext2D, frame: number) {
  if (!nmsL3P002Equation(frame).visible) return;
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.fillStyle = '#edf4b0';
  context.fillRect(395, 118, 299, 61);
  context.fillStyle = '#111'; context.strokeStyle = '#111'; context.lineWidth = 1.5;
  context.font = '20px Arial, sans-serif'; context.textAlign = 'center'; context.textBaseline = 'alphabetic';
  for (const [top, bottom, x] of [['2', '3', 418], ['1', '2', 462], ['3', '4', 506]] as const) {
    context.fillText(top, x, 145); context.beginPath(); context.moveTo(x - 9, 151); context.lineTo(x + 9, 151); context.stroke(); context.fillText(bottom, x, 171);
  }
  context.fillText('+', 440, 157); context.fillText('+', 484, 157);
  context.textAlign = 'left'; context.fillText('= ?', 525, 157);
  context.restore();
}
