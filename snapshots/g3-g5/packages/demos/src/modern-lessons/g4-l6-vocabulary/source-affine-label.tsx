import React from 'react';
import {curveAt} from '../g4-l5-vocabulary';
export type SourceMatrix=readonly[number,number,number,number,number,number];
export type NativeAffineLabel={block:string;sourceInstance:string;sourceCharacter:number;sourcePivot:readonly[0,0];localAnchor:readonly[number,number];localGlyphBounds:readonly number[];states:readonly(readonly[number,SourceMatrix|null])[]};
export function sourceAffinePlacement(matrix:SourceMatrix,anchor:readonly[number,number],viewBox:readonly number[],inlineRem:number){
 const[x,y,width,height]=viewBox,[a,b,c,d,tx,ty]=matrix,scale=inlineRem/width;
 return{pivotPercent:{x:100*(tx-x)/width,y:100*(ty-y)/height},anchorRem:{x:anchor[0]*scale,y:anchor[1]*scale},linearCss:`matrix(${a},${b},${c},${d},0,0)`,sourcePivot:[tx,ty]as const,sourceAnchor:[a*anchor[0]+c*anchor[1]+tx,b*anchor[0]+d*anchor[1]+ty]as const};
}
export function SourceAffineLabel({item,frame,viewBox,inlineRem,sourceDepth,visible,children}:{item:NativeAffineLabel;frame:number;viewBox:readonly number[];inlineRem:number;sourceDepth:number;visible:boolean;children:React.ReactNode}){
 const matrix=curveAt(item.states,frame);if(!matrix)return null;const p=sourceAffinePlacement(matrix,item.localAnchor,viewBox,inlineRem);
 return <span data-native-source-affine={item.block} data-source-affine-instance={item.sourceInstance} data-source-affine-matrix={matrix.join(' ')} data-source-local-anchor={item.localAnchor.join(' ')} data-source-transform-origin="0 0" aria-hidden={!visible||undefined} style={{position:'absolute',left:p.pivotPercent.x+'%',top:p.pivotPercent.y+'%',width:0,height:0,transformOrigin:'0 0',transform:p.linearCss,zIndex:sourceDepth,visibility:visible?'visible':'hidden'}}><span className="g4l6-vocabulary__label" style={{left:p.anchorRem.x+'rem',top:p.anchorRem.y+'rem'}}>{children}</span></span>;
}
