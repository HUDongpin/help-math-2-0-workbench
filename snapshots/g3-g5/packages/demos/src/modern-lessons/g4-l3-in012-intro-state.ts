import source from './generated/g4-l3-in012-native-inputs.json';
import {getIn012Timeline, type In012Placement} from './g4-l3-in012-scene';
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const alpha = (node?: In012Placement) => node ? clamp(((node.colorTransform?.multiply?.[3] ?? 256) / 256 * 255 + (node.colorTransform?.add?.[3] ?? 0)) / 255) : 0;
const maskBounds = source.paints.staticShapes.find(s => s.characterId === 27)!.boundsTwips;

/** Source advance-cell reveal adapted to reflowable native text, not glyph pixels. */
export function getIn012Introduction(frame: number) {
  if (!Number.isInteger(frame) || frame < 1 || frame > 173) throw new RangeError('IN012 intro frame must be 1..173');
  const placements = getIn012Timeline('sprite-228', frame).placements;
  const find = (instanceId: string) => placements.find(p => p.instanceId === instanceId);
  const instructions = source.instructionGlyphAdvances.map(text => {
    const node = placements.find(p => p.characterId === text.characterId);
    const mask = node && placements.find(p => p.characterId === 27 && p.clipDepth !== undefined && p.depth < node.depth && p.clipDepth >= node.depth);
    let right = -Infinity;
    let left = Infinity;
    if (node && mask) {
      if (mask.matrix[1] !== 0 || mask.matrix[2] !== 0 || node.matrix[1] !== 0 || node.matrix[2] !== 0 || node.matrix[0] !== 1) throw new Error('Unsupported IN012 instruction transform');
      left = maskBounds.left * mask.matrix[0]! + mask.matrix[4]!;
      right = maskBounds.right * mask.matrix[0]! + mask.matrix[4]!;
    }
    const origin = (node?.matrix[4] ?? 0) + text.matrix[4]!;
    const glyphs = text.glyphs.map(glyph => ({...glyph, visible: !!node && !!mask && origin + glyph.left >= left && origin + glyph.right <= right}));
    return {characterId: text.characterId, opacity: alpha(node), glyphs,
      visibleText: glyphs.filter(g => g.visible).map(g => g.text).join('')};
  });
  const labels = source.signedLabelStates[0]!;
  const ticks = [
    ...labels.negative.map(n => ({value: n.value, opacity: Math.min(alpha(find(n.textInstance)), alpha(placements.find(p => p.characterId === 20)))})),
    {value: 0, opacity: alpha(placements.find(p => p.characterId === 8))},
    ...labels.positive.map(n => ({value: n.value, opacity: Math.min(alpha(find(n.digitInstance)), alpha(find(n.plusInstance)))})),
  ];
  const cards = source.cards.map(card => ({id: card.card, opacity: alpha(placements.find(p => p.characterId === card.textCharacter))}));
  return {frame, instructions, ticks, cards};
}
