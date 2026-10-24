import {p051Intro} from './nms-l02-p051-intro-v1';
import {P051_INTRO_NESTED_119} from './generated/nms-l02-p051-intro-nested-v1';
type Matrix=readonly number[];
function compose(a:Matrix,b:Matrix){return [a[0]!*b[0]!+a[2]!*b[1]!,a[1]!*b[0]!+a[3]!*b[1]!,a[0]!*b[2]!+a[2]!*b[3]!,a[1]!*b[2]!+a[3]!*b[3]!,a[0]!*b[4]!+a[2]!*b[5]!+a[4]!,a[1]!*b[4]!+a[3]!*b[5]!+a[5]!];}
export interface P051IntroObject {path:string;characterId:number;matrix:Matrix;stageMatrix:Matrix;alpha:number;text:string|null;ratio:number;}
/** Expand the only nested intro sprite using its single source frame.
 * Button states remain separate; this does not infer source scripts or morph geometry.
 */
export function p051IntroScene(frame:number):readonly P051IntroObject[]{
 return p051Intro(frame).objects.flatMap((object):P051IntroObject[]=>{
  const path=`sprite-257/depth-${object.depth}`;
  if(object.characterId!==119)return [{...object,path}];
  return P051_INTRO_NESTED_119.map(child=>({path:`${path}/sprite-119/depth-${child.depth}`,characterId:child.characterId,matrix:compose(object.matrix,child.matrix),stageMatrix:compose(object.stageMatrix,child.matrix),alpha:object.alpha*child.alpha,text:child.text,ratio:0}));
 });
}
