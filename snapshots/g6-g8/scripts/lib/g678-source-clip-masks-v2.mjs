import assert from 'node:assert/strict';
/** Exclusive source vector masks, including source-bound morph fills with zero-width transparent strokes. */
export function normalizeSourceClipMasks(runtime,masks,xml) {
 let next=runtime;
 for(const mask of masks){
  const tags=[...xml.matchAll(/<PlaceObject[23]\s+[^>]*>/gu)].map(m=>Object.fromEntries([...m[0].matchAll(/([A-Za-z]+)="([^"]*)"/gu)].map(m=>[m[1],m[2]]))).filter(t=>t.objectID===String(mask.characterId));
  assert(tags.length&&tags.every(t=>t.clipDepth&&Number(t.clipDepth)>Number(t.depth)),'every character placement must be a source clip mask');
  assert.deepEqual(tags.map(t=>({depth:Number(t.depth),clipDepth:Number(t.clipDepth)})),mask.placements,'exact source mask placement list');
  const kind=mask.functionKind??'shape';assert(['shape','morphshape'].includes(kind));
  if(kind==='morphshape')assert(xml.includes(`<DefineMorphShape objectID="${mask.characterId}">`),'source morph definition');
  const header=`function ${kind}${mask.characterId}(ctx,ctrans,frame,ratio,time){`,begin=next.indexOf(header),end=next.indexOf('\n}',begin)+2;
  assert(begin>=0&&end>begin&&next.indexOf(header,begin+1)<0,'unique source vector mask');
  const shape=next.slice(begin,end);
  assert.equal((shape.match(/ctx\.fillStyle=/gu)??[]).length,1,'one solid mask fill');
  assert(!/createPattern|drawImage|Gradient/u.test(shape),'non-vector mask requires separate review');
  if(kind==='morphshape'){
   assert.equal((shape.match(/ctx\.strokeStyle=/gu)??[]).length,1,'exact transparent source stroke');
   assert(mask.rawTransparentStroke?.endsWith('((Math.round(0+ratio*(0)/65535))/255)]));'),'zero source stroke alpha');
   assert.equal(shape.split(mask.rawTransparentStroke).length,2,'source stroke binding');
   assert.equal(shape.split('ctx.lineWidth=0.0+ratio*(0)/65535;').length,2,'zero source stroke width');
  }else assert(!/stroke/u.test(shape),'solid stroked mask requires separate review');
  assert.equal(shape.split(mask.rawFill).length,2,'exact source mask fill');
  const corrected=shape.replace(mask.rawFill,'ctx.fillStyle="rgba(0,0,0,1)";');
  next=next.slice(0,begin)+corrected+next.slice(end);
 }
 return next;
}
