import React from 'react';
export interface Ti004SourceMask {
 readonly id:string;readonly sourceInstanceId:string;readonly localSourceInstanceId:string;readonly characterId:number;
 readonly depth:number;readonly clipDepth:number;readonly matrix:readonly number[];
 readonly localBoundsTwips:Readonly<{left:number;right:number;top:number;bottom:number}>;
 readonly stageBoundsTwips:Readonly<{left:number;right:number;top:number;bottom:number}>;
 readonly role:string;
}
const scopes:Readonly<Record<string,readonly[number,number]>>={
 'sprite-134/depth-1/generation-1':[1,10],
 'sprite-134/depth-1/generation-2':[1,10],
 'sprite-134/depth-1/generation-3':[1,10],
 'sprite-134/depth-11/generation-1':[11,13],
};
/** Own source76 is exactly the audited four-edge rectangle. No arbitrary path,
 * filter, transform approximation or missing-mask fallback is admitted here. */
export function validateTi004SourceMask(m:Ti004SourceMask){
 const scope=scopes[m.localSourceInstanceId],x=m.matrix,b=m.localBoundsTwips,r=m.stageBoundsTwips;
 if(!scope||m.characterId!==76||m.depth!==scope[0]||m.clipDepth!==scope[1]||m.id!==m.sourceInstanceId||m.id!=='root/depth-4/generation-1/'+m.localSourceInstanceId||m.role!=='source-rectangle-clip-only-not-visible-paint')throw Error('Unqualified own TI004 source mask identity/scope');
 if(x.length!==6||!x.every(Number.isFinite)||x[1]!==0||x[2]!==0||x[0]!<=0||x[3]!<=0||b.left!==-6182||b.right!==6182||b.top!==-332||b.bottom!==333)throw Error('Unqualified own TI004 source rectangle geometry');
 if(r.left!==x[0]!*b.left+x[4]!||r.right!==x[0]!*b.right+x[4]!||r.top!==x[3]!*b.top+x[5]!||r.bottom!==x[3]!*b.bottom+x[5]!)throw Error('TI004 source mask stage bounds mismatch');
 return m;
}
/** Native Nunito line-box allowance for the single instruction under mask11.
 * The authored horizontal reveal, source rectangle, instance and lifetime remain exact.
 * 44 source units is 0.1 of its pinned 440-unit font; glyph positions are unchanged. */
export const TI004_MASK11_NATIVE_TOP_MARGIN=44;
export function ti004NativeMaskBounds(mask:Ti004SourceMask){
 const m=validateTi004SourceMask(mask),source=m.stageBoundsTwips;
 if(m.localSourceInstanceId!=='sprite-134/depth-11/generation-1')return source;
 if(source.top!==2617||source.bottom!==3282)throw Error('Changed TI004 instruction source mask vertical bounds');
 return {...source,top:source.top-TI004_MASK11_NATIVE_TOP_MARGIN};
}
const clipId=(prefix:string,m:Ti004SourceMask)=>prefix+'-source-mask-'+m.id.replaceAll('/','_');
export function Ti004SourceMaskDefinitions({masks,prefix}:{masks:readonly Ti004SourceMask[];prefix:string}){
 if(new Set(masks.map(m=>m.id)).size!==masks.length)throw Error('Duplicate TI004 mask instance');
 return <defs>{masks.map(mask=>{const m=validateTi004SourceMask(mask),source=m.stageBoundsTwips,r=ti004NativeMaskBounds(m);return <clipPath key={m.id} id={clipId(prefix,m)} clipPathUnits="userSpaceOnUse" data-source-mask={m.sourceInstanceId} data-source-mask-character={76} data-source-mask-depth={m.depth} data-source-mask-clip-depth={m.clipDepth} data-source-mask-bounds={JSON.stringify(source)} data-native-mask-top-margin={source.top-r.top}><rect x={r.left} y={r.top} width={r.right-r.left} height={r.bottom-r.top}/></clipPath>;})}</defs>;
}
export function Ti004SourceMaskedNode({children,masks,clipRefs,sourceDepth,prefix}:{children:React.ReactNode;masks:readonly Ti004SourceMask[];clipRefs:readonly string[];sourceDepth:number;prefix:string}){
 const expected=masks.filter(m=>m.depth<sourceDepth&&sourceDepth<=m.clipDepth).map(m=>m.id);
 if(JSON.stringify(clipRefs)!==JSON.stringify(expected))throw Error('TI004 node does not carry its exact authored mask scope');
 let node=children;for(const id of [...clipRefs].reverse()){const mask=masks.find(m=>m.id===id);if(!mask)throw Error('Missing own TI004 source mask');validateTi004SourceMask(mask);node=<g clipPath={'url(#'+clipId(prefix,mask)+')'} data-applied-source-mask={id}>{node}</g>;}return <>{node}</>;
}
