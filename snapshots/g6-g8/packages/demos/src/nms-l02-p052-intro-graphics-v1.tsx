import React from 'react';
import {P052_INTRO_SCENE} from './generated/nms-l02-p052-intro-scene-v1';
import {p052IntroScene} from './nms-l02-p052-intro-scene-v1';

// Each image is a separate SVG document: source gradient IDs cannot collide.
// Cache encoding once, not on every animation frame. No filesystem/network access.
const vectors=new Map<number,{width:number;height:number;originX:number;originY:number;href:string}>(
 P052_INTRO_SCENE.vectors.map(v=>[v.characterId,{...v,href:`data:image/svg+xml;charset=utf-8,${encodeURIComponent(v.svg)}`}])
);
export function p052StageMatrix(matrix:readonly number[]):string{
 if(matrix.length!==6||!matrix.every(Number.isFinite))throw Error('P052_STAGE_MATRIX');
 return `matrix(${matrix[0]} ${matrix[1]} ${matrix[2]} ${matrix[3]} ${matrix[4]!/20} ${matrix[5]!/20})`;
}
/** Authored graphics plane only. Live instructional text/counters are a separate required layer.
 * Generated SVG normalization remains intact; origin offsets undo its local crop once.
 * This cannot be registered as a complete page on its own.
 */
export function P052IntroGraphics({frame}:{frame:number}){
 const objects=p052IntroScene(frame);
 return <svg viewBox="0 0 800 600" width="800" height="600" aria-hidden="true" focusable="false"
  data-p052-graphics-frame={frame} style={{display:'block',width:'100%',height:'auto',overflow:'hidden'}}>
  {objects.filter(o=>o.kind==='shape').map(object=>{
   const vector=vectors.get(object.characterId);if(!vector)throw Error(`P052_VECTOR_MISSING_${object.characterId}`);
   return <g key={object.path} data-p052-source-path={object.path} data-p052-source-shape={object.characterId}
    transform={p052StageMatrix(object.stageMatrix)} opacity={object.alpha}>
    <image href={vector.href} x={vector.originX} y={vector.originY} width={vector.width} height={vector.height} preserveAspectRatio="none"/>
   </g>;
  })}
 </svg>;
}
