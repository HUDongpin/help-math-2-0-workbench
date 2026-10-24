import {P052_INTRO_SCENE} from './generated/nms-l02-p052-intro-scene-v1';
export interface P052IntroLeaf {
 readonly path:string;readonly characterId:number;readonly stageMatrix:readonly number[];
 readonly alpha:number;readonly kind:'text'|'shape';readonly text:string|null;
}
/** Static authored intro only. Source main/root domains and script-driven practice remain separate. */
export function p052IntroScene(frame:number):readonly P052IntroLeaf[]{
 if(!Number.isInteger(frame)||frame<1||frame>114)throw Error('P052_INTRO_FRAME');
 const range=P052_INTRO_SCENE.ranges.find(r=>r.first<=frame&&frame<=r.last);
 if(!range)throw Error('P052_INTRO_COVERAGE');return range.objects;
}
export function p052IntroDigits(frame:number):string|null{
 const fields=p052IntroScene(frame).filter(o=>o.kind==='text'&&o.text!==null&&/^\d$/.test(o.text))
  .sort((a,b)=>a.stageMatrix[4]!-b.stageMatrix[4]!);
 return fields.length?fields.map(f=>f.text).join(''):null;
}
