/** Source placement order is the 4 × 3 image-tile order in game sprite 731. */
export function p054RevealShapeId(level: 1 | 2, placementOrder: number): number {
  if ((level !== 1 && level !== 2) || !Number.isInteger(placementOrder) ||
      placementOrder < 1 || placementOrder > 12) {
    throw new Error('Invalid P054 reveal tile');
  }
  return (level === 1 ? 108 : 668) + placementOrder * 2;
}

export function p054RevealTileUrl(level: 1 | 2, placementOrder: number): string {
  p054RevealShapeId(level, placementOrder);
  return `/flash-assets/g678-local/shared-nms002-l02-p054/reveal/${level}/${placementOrder}`;
}
