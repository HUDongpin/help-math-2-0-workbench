'use client';
import {P062_REVIEW_SHAPES} from './alg-l07-p062-review-source-v1';
export type P062SceneNode={readonly kind:'shape';readonly characterId:number;readonly name:string|null;readonly matrix:readonly number[]}|{readonly kind:'text';readonly characterId:number;readonly name:string|null;readonly text:string;readonly x:number;readonly y:number;readonly fontSize:number};
export interface P062Scene {readonly frame:number;readonly nodes:readonly P062SceneNode[];}
/** Source-frame inspection only. The playable quiz has no route into Review. */
export function P062ReviewScene({scene,values={}}:{scene:P062Scene;values?:Readonly<Record<string,string>>}){
 return <div className="alg-l07-p062__source-scene" tabIndex={0} role="region" aria-label="Dormant source review frame"><svg viewBox="0 0 800 600" role="img" aria-label={`Source review frame ${scene.frame}`}>{scene.nodes.map((n,i)=>n.kind==='shape'?<g key={i} data-source-character={n.characterId} transform={`matrix(${n.matrix.join(' ')})`} dangerouslySetInnerHTML={{__html:P062_REVIEW_SHAPES[n.characterId]!}}/>:<text key={i} x={n.x} y={n.y} fontSize={n.fontSize} data-source-text-id={`character-${n.characterId}`} data-source-instance={n.name??undefined}>{n.name&&Object.hasOwn(values,n.name)?values[n.name]:n.text}</text>)}</svg></div>;
}
