import type {P046FeedbackId,P046SourceTerm} from './alg-l07-p046-source-v1';
import type {FixedExitVectorPathV1} from './source-fixed-exit-help-native-v1';
export type P046VectorPath=FixedExitVectorPathV1;
export interface P046Visual {
 readonly questionAlpha:number;readonly questionOffset:number;readonly graphVisible:boolean;readonly drawVisible:boolean;
 readonly terms:readonly P046SourceTerm[];readonly termFlash:readonly P046SourceTerm[];
 readonly shapes:readonly {readonly characterId:number;readonly depth:number;readonly matrix:readonly number[];readonly alpha:number;readonly ratio:number}[];
 readonly labels:readonly {readonly labelIndex:number;readonly depth:number;readonly alpha:number}[];
 readonly constantHighlight:number;readonly interceptHighlight:number;readonly slopeHighlight:number;readonly numeratorHighlight:number;readonly coordinateHighlight:number;
}
export interface P046VisualSource {
 readonly animationId:string;readonly sourceSha256:string;readonly title:string;readonly titleSourceShapeId:number;readonly question:string;readonly questionNumber:8;readonly questionTextIds:readonly number[];
 readonly titleBranches:readonly {readonly spriteId:P046FeedbackId;readonly title:string;readonly titleIds:readonly number[];readonly depth:number;readonly titleAlpha:readonly {readonly first:number;readonly last:number;readonly value:number}[]}[];
 readonly shapeSources:readonly {readonly characterId:number;readonly paths:readonly P046VectorPath[]}[];
 readonly labelSources:readonly {readonly id:string;readonly characterId:number;readonly sourceTextId:string;readonly text:string;readonly x:number;readonly y:number}[];
 readonly graphViewBox:readonly number[];readonly backgroundHitBounds:readonly number[];readonly keyboardOrigin:readonly number[];readonly keyboardStep:number;
 readonly helpTexts:readonly {readonly id:string;readonly characterId:number;readonly sourceTextId:string;readonly text:string}[];readonly helpTerms:readonly P046SourceTerm[];
 readonly visualStates:readonly {readonly first:number;readonly last:number;readonly value:P046Visual}[];
 readonly sourceTexts:readonly {readonly characterId:number;readonly sourceTextId:string;readonly text:string;readonly sourceTagSha256:string}[];
 readonly pointFrames:readonly {readonly spriteId:number;readonly frames:readonly (readonly (readonly [number,readonly number[]])[])[]}[];
 readonly morphRatioDenominator:65535;readonly registered:false;readonly originalRuntimeAccepted:false;
}
/** Interpolate only the exported source endpoints with the exact SWF ratio. */
export function p046MorphPath(p:P046VectorPath,ratio:number):P046VectorPath {
 if(!Number.isSafeInteger(ratio)||ratio<0||ratio>65535)throw Error('P046_MORPH_RATIO');if(!p.end)return p;
 const end=p.end,t=ratio/65535;const numbers=/-?\d+(?:\.\d+)?/g;
 const last=end.d.match(numbers)?.map(Number)??[];let index=0;
 const d=p.d.replace(numbers,n=>String(Number(n)+(last[index++]-Number(n))*t));
 if(index!==last.length)throw Error('P046_MORPH_PATH_TOPOLOGY');
 const color=(a:string,b:string)=>{if(!/^#[a-f0-9]{6}$/i.test(a)||!/^#[a-f0-9]{6}$/i.test(b))throw Error('P046_MORPH_COLOR');return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)+(parseInt(b.slice(i,i+2),16)-parseInt(a.slice(i,i+2),16))*t).toString(16).padStart(2,'0')).join('');};
 return {...p,d,stroke:end.stroke?color(p.stroke!,end.stroke):p.stroke,'stroke-width':end['stroke-width']?String(Number(p['stroke-width'])+(Number(end['stroke-width'])-Number(p['stroke-width']))*t):p['stroke-width'],'fill-opacity':end['fill-opacity']?String(Number(p['fill-opacity']??1)+(Number(end['fill-opacity'])-Number(p['fill-opacity']??1))*t):p['fill-opacity']};
}
