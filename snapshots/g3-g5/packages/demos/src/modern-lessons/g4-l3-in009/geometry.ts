import GEOMETRY from './thermometer-geometry.generated.json';
export interface In009Tick {readonly id:string;readonly depth:number;readonly value:number;readonly text:string;readonly wholeVisible:boolean;readonly sourceAlpha:number;readonly matrix:readonly number[];readonly minusInstanceId:string|null}
export interface In009SourceState {readonly frame:number;readonly wordIndices:readonly number[];readonly ticks:readonly In009Tick[];readonly caption:null|{readonly text:string;readonly value:string;readonly sourceTextId:number;readonly sourceMinusId:number;readonly sourceAlpha:number;readonly wholeVisible:boolean;readonly matrix:readonly number[]};readonly emphasisActive:boolean;readonly emphasisSources:readonly unknown[];readonly thermometerMatrix:readonly number[]|null}
export const IN009_THERMOMETER_BOUNDS=GEOMETRY.thermometerBounds;
function transform(m:readonly number[],x:number,y:number){if(m.length!==6||!m.every(Number.isFinite))throw Error('Malformed source matrix');return{x:m[0]*x+m[2]*y+m[4],y:m[1]*x+m[3]*y+m[5]};}
function inversePoint(m:readonly number[],p:{x:number;y:number}){const d=m[0]*m[3]-m[1]*m[2];if(!Number.isFinite(d)||Math.abs(d)<1e-10)throw Error('Degenerate source thermometer matrix');return{x:(m[3]*(p.x-m[4])-m[2]*(p.y-m[5]))/d,y:(-m[1]*(p.x-m[4])+m[0]*(p.y-m[5]))/d};}
/** Right glyph edge + vertical center, never matrix translation mistaken for a baseline. */
export function projectIn009Ticks(state:In009SourceState){
 if(!state.thermometerMatrix){if(state.ticks.length)throw Error('Tick placement without thermometer geometry');return null;}
 if(state.ticks.length!==13)throw Error('IN009 source scale requires thirteen actual placements');
 const [left,top,width,height]=IN009_THERMOMETER_BOUNDS;
 const positions=state.ticks.map(tick=>{const descriptor=(GEOMETRY.tickTextByDepth as Record<string,{characterId:number;bounds:{left:number;right:number;top:number;bottom:number}}>)[String(tick.depth)];if(!descriptor)throw Error('Unknown source thermometer label');const b=descriptor.bounds,points=[transform(tick.matrix,b.left,b.top),transform(tick.matrix,b.left,b.bottom),transform(tick.matrix,b.right,b.top),transform(tick.matrix,b.right,b.bottom)];const world={x:Math.max(...points.map(p=>p.x)),y:(Math.min(...points.map(p=>p.y))+Math.max(...points.map(p=>p.y)))/2};const local=inversePoint(state.thermometerMatrix!,world);return{...tick,sourceCharacterId:descriptor.characterId,local,anchorXPercent:(local.x-left)/width*100,anchorYPercent:(local.y-top)/height*100};});
 const sorted=[...positions].sort((a,b)=>a.local.y-b.local.y),gaps=sorted.slice(1).map((t,i)=>t.local.y-sorted[i].local.y);if(gaps.some(g=>g<=0))throw Error('Overlapping or unordered source scale anchors');
 return{bounds:IN009_THERMOMETER_BOUNDS,positions,minimumGap:Math.min(...gaps),heightRem:Math.max(46,2*height/Math.min(...gaps)),sourceMatrix:state.thermometerMatrix};
}
