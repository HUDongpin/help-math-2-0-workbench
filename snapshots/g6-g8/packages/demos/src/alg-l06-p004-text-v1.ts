import {P004_SOURCE_TEXT_BLOCKS} from './alg-l06-p004-text.generated';
export {P004_TEXT_PROVENANCE} from './alg-l06-p004-text.generated';

/** English source text, in explicit source-definition order, at the requested
 * one-indexed main frame. Individual symbols stay separate; this readable
 * projection does not execute actions or infer a spatial equation. Root title
 * 96 is held at root frame 6 while main sprite 95 advances. Identical strings
 * are shown once per frame; no duplicate is removed from the source data. */
export function p004ReadableText(frame:number):readonly string[]{
 if(!Number.isSafeInteger(frame)||frame<1||frame>831)throw new RangeError('P004 frame must be an integer in 1..831');
 const seen=new Set<string>(),result:string[]=[];
 for(const block of P004_SOURCE_TEXT_BLOCKS){
  if(block.ranges.some(([first,last])=>frame>=first&&frame<=last)&&!seen.has(block.text)){
   seen.add(block.text);result.push(block.text);
  }
 }
 return Object.freeze(result);
}
