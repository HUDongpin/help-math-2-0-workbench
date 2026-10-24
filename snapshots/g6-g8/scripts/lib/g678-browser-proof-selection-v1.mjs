import assert from 'node:assert/strict';

/** Select only proof ownership after the complete live admission has passed.
 * This does not select/filter shared host, registry, dispatch or witness pins. */
export function selectBrowserProofRows({admittedPages,animationIds,inputScope='all-admitted'}) {
 assert(inputScope==='all-admitted'||inputScope==='selected-pages','explicit supported browser input scope');
 assert(Array.isArray(animationIds)&&animationIds.length>0&&
  animationIds.every(id=>typeof id==='string'&&id.length>0)&&
  new Set(animationIds).size===animationIds.length,'explicit distinct browser pages');
 assert(Array.isArray(admittedPages)&&admittedPages.length>0,'nonempty admitted proof rows');
 const admitted=new Set(admittedPages.map(page=>page.animationId));
 assert(admitted.size===admittedPages.length,'unique admitted proof rows');
 assert(animationIds.every(id=>admitted.has(id)),'browser pages must be admitted');
 if(inputScope==='all-admitted')return admittedPages;
 const selected=new Set(animationIds);
 return admittedPages.filter(page=>selected.has(page.animationId));
}
