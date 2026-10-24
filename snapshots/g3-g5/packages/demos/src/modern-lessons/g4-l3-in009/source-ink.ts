import type {InkRect} from './whole-weather-ink';
export type SourceClip={readonly kind:'none'}|{readonly kind:'bitmap-space-path-union';readonly paths:readonly {readonly d:string;readonly fillRule:'nonzero'|'evenodd'}[]};
type Point=readonly[number,number];
/** Only simple convex M/L/Z polygons are supported. Exact half-plane containment is
 * stronger than finite point sampling: all rectangle boundary and interior points
 * must lie inside one member. Seam-spanning union tokens fail conservatively. */
function polygon(d:string):readonly Point[]{
 const tokens=d.match(/[MLZmlz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi)??[];
 if(d.replace(/[MLZmlz]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?|[\s,]/gi,'')||tokens.shift()!=='M'||tokens.pop()!=='Z')throw Error('Unsupported source clip path');
 const points:Point[]=[];let i=0;while(i<tokens.length){if(tokens[i]==='L')i++;const x=Number(tokens[i++]),y=Number(tokens[i++]);if(!Number.isFinite(x+y))throw Error('Invalid source clip point');points.push([x,y]);}
 if(points.length>3&&points[0][0]===points.at(-1)![0]&&points[0][1]===points.at(-1)![1])points.pop();
 if(points.length<3||points.length>64)throw Error('Unsupported source clip vertex count');
 let sign=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];for(let j=0;j<points.length;j++){const p=points[j],cross=(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);if(Math.abs(cross)<1e-9)continue;const s=Math.sign(cross);if(sign&&sign!==s)throw Error('Nonconvex or self-intersecting source clip');sign=s;}}if(!sign)throw Error('Degenerate source clip');return sign>0?points:[...points].reverse();
}
function inside(rect:InkRect,p:readonly Point[]){const corners:Point[]=[[rect.left,rect.top],[rect.right,rect.top],[rect.right,rect.bottom],[rect.left,rect.bottom]];return p.every((a,i)=>{const b=p[(i+1)%p.length],dx=b[0]-a[0],dy=b[1]-a[1],epsilon=1e-7*Math.hypot(dx,dy);return corners.every(c=>dx*(c[1]-a[1])-dy*(c[0]-a[0])>epsilon);});}
export function createSourceInkGate(){let key='',polygons:readonly(readonly Point[])[]|null=null,none=false;return(clip:SourceClip|null,rects:readonly InkRect[],composition:InkRect):'full'|'partial'|'unsupported'=>{
 const next=JSON.stringify(clip);if(next!==key){key=next;none=clip?.kind==='none';try{polygons=clip?.kind==='bitmap-space-path-union'&&clip.paths.length?clip.paths.map(p=>{if(p.fillRule!=='nonzero'&&p.fillRule!=='evenodd')throw Error('Unsupported fill rule');return polygon(p.d);}):null;}catch{polygons=null;}}
 if(!rects.length||composition.right<=composition.left||composition.bottom<=composition.top)return'partial';if(none)return'full';if(!polygons)return'unsupported';
 const sx=640/(composition.right-composition.left),sy=480/(composition.bottom-composition.top);
 // One CSS pixel expansion clears antialiasing and all four actual Range edges.
 return rects.every(r=>{const b={left:(r.left-composition.left-1)*sx,right:(r.right-composition.left+1)*sx,top:(r.top-composition.top-1)*sy,bottom:(r.bottom-composition.top+1)*sy};return polygons!.some(p=>inside(b,p));})?'full':'partial';
 };}
