import assert from 'node:assert/strict';

/** Solid vector clip geometry only. All placements must be explicitly bound
 * masks; visible reuse, gradients, images and strokes need another audit. */
export function normalizeSourceClipMasks(runtime, masks, xml) {
  let next = runtime;
  for (const mask of masks) {
    const tags = [...xml.matchAll(/<PlaceObject[23]\s+[^>]*>/gu)]
      .map(match => Object.fromEntries([...match[0].matchAll(/([A-Za-z]+)="([^"]*)"/gu)].map(m => [m[1],m[2]])))
      .filter(tag => tag.objectID === String(mask.characterId));
    assert(tags.length > 0 && tags.every(tag => tag.clipDepth && Number(tag.clipDepth) > Number(tag.depth)), 'every character placement must be a source clip mask');
    assert.deepEqual(tags.map(tag => ({depth:Number(tag.depth),clipDepth:Number(tag.clipDepth)})),mask.placements,'exact source mask placement list');
    const header = `function shape${mask.characterId}(ctx,ctrans,frame,ratio,time){`;
    const begin=next.indexOf(header), end=next.indexOf('\n}',begin)+2;
    assert(begin>=0 && end>begin && next.indexOf(header,begin+1)<0,'unique source vector shape');
    const shape=next.slice(begin,end);
    assert.equal((shape.match(/ctx\.fillStyle=/gu)??[]).length,1,'one solid mask fill');
    assert(!/stroke|createPattern|drawImage|Gradient/u.test(shape),'complex mask requires separate review');
    assert.equal(shape.split(mask.rawFill).length,2,'exact source mask fill');
    const corrected=shape.replace(mask.rawFill,'ctx.fillStyle="rgba(0,0,0,1)";');
    next=next.slice(0,begin)+corrected+next.slice(end);
  }
  return next;
}
