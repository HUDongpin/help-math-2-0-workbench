import type {RuntimeContext} from './contract';
import type {AlgL10P004Matrix,AlgL10P004Point} from './alg-l10-p004-source-model-v1';
import {ALG_L10_P004_SOURCE as SOURCE} from './generated/alg-l10-p004-source-v1';
export {ALG_L10_P004_SOURCE} from './generated/alg-l10-p004-source-v1';
export type {AlgL10P004Matrix,AlgL10P004Point} from './alg-l10-p004-source-model-v1';
const IDENTITY:AlgL10P004Matrix=Object.freeze([1,0,0,1,0,0]);
export interface AlgL10P004Placement {readonly depth:number;readonly characterId:number;readonly matrix:AlgL10P004Matrix;readonly alpha:number;readonly clipDepth:number|null;readonly ratio:number;readonly instanceId:string;readonly bornFrame:number;}
export function algL10P004DomainFrame(domain:string,frame:number):readonly AlgL10P004Placement[]{
 const t=SOURCE.domains[domain];if(!t||!Number.isSafeInteger(frame)||frame<1||frame>t.frames)throw Error('ALG_L10_P004_DOMAIN_FRAME');
 const depths=new Map<number,AlgL10P004Placement>();
 for(const e of t.events){const [at,depth,place,move,characterId,matrix,alpha,clipDepth,instanceId,ratio]=e;if(at>frame)break;
  if(!place){depths.delete(depth);continue;}const previous=depths.get(depth),inherited=move?previous:undefined,cid=characterId??inherited?.characterId;
  if(cid===undefined||!instanceId||(move&&!previous))throw Error('ALG_L10_P004_SOURCE_PLACEMENT');
  depths.set(depth,Object.freeze({depth,characterId:cid,matrix:matrix?Object.freeze([...matrix]) as AlgL10P004Matrix:inherited?.matrix??IDENTITY,alpha:alpha??inherited?.alpha??1,clipDepth:clipDepth??inherited?.clipDepth??null,ratio:ratio??inherited?.ratio??0,instanceId,bornFrame:previous?.instanceId===instanceId?previous.bornFrame:at}));
 }return Object.freeze([...depths.values()].sort((a,b)=>a.depth-b.depth));
}
export function algL10P004MorphPaths(characterId:number,ratio:number){
 if(!Number.isInteger(ratio)||ratio<0||ratio>65535)throw Error('ALG_L10_P004_MORPH_RATIO');const m=SOURCE.morphs[characterId];if(!m)throw Error('ALG_L10_P004_MORPH');
 return Object.freeze(m.paths.map(path=>Object.freeze({d:path.start.map((a,i)=>typeof a==='number'?a+((path.end[i] as number)-a)*ratio/65535:a).join(' '),paint:Object.freeze({...path.paint})})));
}
export function algL10P004MaskPolygon(node:AlgL10P004Placement):readonly AlgL10P004Point[]{
 const m=SOURCE.masks[node.characterId];if(!m)throw Error('ALG_L10_P004_MASK');
 return Object.freeze(m.start.map((a,i)=>{const b=m.end[i];return Object.freeze([a[0]+(b[0]-a[0])*node.ratio/65535,a[1]+(b[1]-a[1])*node.ratio/65535]) as AlgL10P004Point;}));
}
export function algL10P004Transform(p:AlgL10P004Point,m:AlgL10P004Matrix):AlgL10P004Point{return Object.freeze([m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]]);}
const cross=(a:AlgL10P004Point,b:AlgL10P004Point,c:AlgL10P004Point)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const EPS=1e-8;
export function algL10P004PointInPolygon(p:AlgL10P004Point,poly:readonly AlgL10P004Point[]){let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j],b=poly[i];if(Math.abs(cross(a,b,p))<EPS&&p[0]>=Math.min(a[0],b[0])-EPS&&p[0]<=Math.max(a[0],b[0])+EPS&&p[1]>=Math.min(a[1],b[1])-EPS&&p[1]<=Math.max(a[1],b[1])+EPS)return true;
 if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }return inside;
}
function intersect(a:AlgL10P004Point,b:AlgL10P004Point,c:AlgL10P004Point,d:AlgL10P004Point):AlgL10P004Point|null{
 const den=(b[0]-a[0])*(d[1]-c[1])-(b[1]-a[1])*(d[0]-c[0]);if(Math.abs(den)<EPS)return null;
 const t=((c[0]-a[0])*(d[1]-c[1])-(c[1]-a[1])*(d[0]-c[0]))/den,u=((c[0]-a[0])*(b[1]-a[1])-(c[1]-a[1])*(b[0]-a[0]))/den;
 return t>=0&&t<=1&&u>=0&&u<=1?Object.freeze([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]):null;
}
/** All source masks are simple line polygons. Membership uses actual polygons,
 * including the irregular outer mask. Nonzero area rejects an edge-only touch. */
function commonArea(polys:readonly (readonly AlgL10P004Point[])[]){
 const candidates:AlgL10P004Point[]=polys.flatMap(p=>[...p]);
 for(let a=0;a<polys.length;a++)for(let b=a+1;b<polys.length;b++)for(let i=0;i<polys[a].length;i++)for(let j=0;j<polys[b].length;j++){
 const p=intersect(polys[a][i],polys[a][(i+1)%polys[a].length],polys[b][j],polys[b][(j+1)%polys[b].length]);if(p)candidates.push(p);}
 const inside=candidates.filter(p=>polys.every(poly=>algL10P004PointInPolygon(p,poly)));
 if(inside.length<3)return false;const a=inside[0],b=inside.find(p=>Math.hypot(p[0]-a[0],p[1]-a[1])>EPS);return !!b&&inside.some(c=>Math.abs(cross(a,b,c))>EPS);
}
/** Whole logical text boxes must survive every source clip. Splitting each
 * edge at real intersections handles concave masks, including narrow notches. */
export function algL10P004ContainedByClips(poly:readonly AlgL10P004Point[],clips:readonly (readonly AlgL10P004Point[])[]){
 if(!commonArea([poly]))return false;
 return clips.every(clip=>poly.every(p=>algL10P004PointInPolygon(p,clip))&&poly.every((a,i)=>{
  const b=poly[(i+1)%poly.length],points=[a,b],axis=Math.abs(b[0]-a[0])>=Math.abs(b[1]-a[1])?0:1;
  for(let j=0;j<clip.length;j++){const p=intersect(a,b,clip[j],clip[(j+1)%clip.length]);if(p)points.push(p);}
  points.sort((p,q)=>p[axis]-q[axis]);
  return points.slice(1).every((p,j)=>algL10P004PointInPolygon([(p[0]+points[j][0])/2,(p[1]+points[j][1])/2],clip));
 }));
}
export function algL10P004ClipPolygons(node:AlgL10P004Placement,all:readonly AlgL10P004Placement[]){return Object.freeze(all.filter(m=>m.clipDepth!==null&&node.depth>m.depth&&node.depth<=m.clipDepth).map(m=>Object.freeze(algL10P004MaskPolygon(m).map(p=>algL10P004Transform(p,m.matrix)))));}
function shapePolygon(node:AlgL10P004Placement){const hit=SOURCE.buttons[node.characterId];if(!hit)throw Error('ALG_L10_P004_BUTTON');const mask=SOURCE.masks[hit.hitShape];return Object.freeze(mask.start.map(p=>algL10P004Transform(p,node.matrix)));}
export interface AlgL10P004Owner {readonly instanceId:string;readonly characterId:number;readonly term:string;readonly frame:number;readonly replay:number;readonly seed:number;}
function identity(frame:number,c:RuntimeContext){const d=c.frameDomain??'sprite-60',max=d==='root'?10:d==='sprite-60'?609:0;
 if(!Number.isInteger(frame)||frame<1||frame>max||c.frame!==frame||c.scenario!=='source-static-frame'||!['en','es'].includes(c.lang)||!Number.isSafeInteger(c.seed)||c.seed<0||c.seed>0xffffffff||!Number.isSafeInteger(c.replay??0)||(c.replay??0)<0||(c.rootFrame!==undefined&&c.rootFrame!==(d==='root'?frame:6)))throw Error('ALG_L10_P004_IDENTITY');return d;
}
export function algL10P004Frame(frame:number,c:RuntimeContext){const domain=identity(frame,c),rootFrame=domain==='root'?frame:6,mainFrame=domain==='root'?(frame<6?null:Math.min(609,frame-5)):frame;
 const root=algL10P004DomainFrame('root',rootFrame),main=mainFrame===null?Object.freeze([]):algL10P004DomainFrame('sprite-60',mainFrame),replay=c.replay??0;
 const buttons=main.filter(n=>SOURCE.buttons[n.characterId]&&n.alpha>0&&commonArea([shapePolygon(n),...algL10P004ClipPolygons(n,main)]));
 const owners=Object.freeze(buttons.map(n=>Object.freeze({instanceId:n.instanceId,characterId:n.characterId,term:SOURCE.buttons[n.characterId].term,frame:mainFrame!,replay,seed:c.seed})));
 const mainPlacement=root.find(n=>n.characterId===60&&n.clipDepth===null);
 const readingTexts=Object.freeze(main.flatMap(n=>{const t=SOURCE.texts[n.characterId];if(!t||n.alpha<=0||!mainPlacement||mainPlacement.alpha<=0||t.runs.some(r=>r.color[3]<=0))return[];
  // DefineText bounds include trailing blank space. Use the existing source
  // run advances for logical x extent, retaining exact source vertical bounds.
  const left=Math.min(...t.runs.map(r=>r.x)),right=Math.max(...t.runs.map(r=>r.x+r.advance)),b=t.bounds;
  const poly:AlgL10P004Point[]=([[left,b.top],[right,b.top],[right,b.bottom],[left,b.bottom]] as const).map(p=>algL10P004Transform(algL10P004Transform(p,n.matrix),mainPlacement.matrix));
  const clips=[...algL10P004ClipPolygons(n,main).map(p=>p.map(v=>algL10P004Transform(v,mainPlacement.matrix))),...algL10P004ClipPolygons(mainPlacement,root),[[0,0],[800,0],[800,600],[0,600]] as const];
  return algL10P004ContainedByClips(poly,clips)?[Object.freeze({characterId:n.characterId,text:t.text})]:[];
 }));
 return Object.freeze({animationId:SOURCE.animationId,frame,frameDomain:domain,rootFrame,mainFrame,root,main,language:c.lang,visualLanguage:'en',visualLanguageFallback:c.lang==='es',seed:c.seed,replay,title:SOURCE.title,terminalHeld:mainFrame===609,owners,readingTexts,sourceTextIds:Object.freeze(readingTexts.map(t=>t.characterId)),lessonCompleted:false});
}
export type AlgL10P004Frame=ReturnType<typeof algL10P004Frame>;
export interface AlgL10P004Interaction {readonly frame:number;readonly language:'en'|'es';readonly seed:number;readonly replay:number;readonly paused:boolean;readonly glossary:AlgL10P004Owner|null;}
const view=(s:AlgL10P004Interaction)=>algL10P004Frame(s.frame,{frame:s.frame,frameDomain:'sprite-60',rootFrame:6,lang:s.language,seed:s.seed,replay:s.replay,scenario:'source-static-frame'});
export function createAlgL10P004Interaction(language:'en'|'es',seed:number):AlgL10P004Interaction{const s=Object.freeze({frame:1,language,seed,replay:0,paused:true,glossary:null});view(s);return s;}
export function algL10P004OpenGlossary(s:AlgL10P004Interaction,owner:AlgL10P004Owner,point?:AlgL10P004Point):AlgL10P004Interaction{
 const v=view(s),actual=v.owners.find(o=>o.instanceId===owner.instanceId&&o.characterId===owner.characterId&&o.term===owner.term&&o.frame===owner.frame&&o.replay===owner.replay&&o.seed===owner.seed);
 if(!actual)throw Error('ALG_L10_P004_STALE_GLOSSARY_OWNER');
 if(point){if(point.some(x=>!Number.isFinite(x)))throw Error('ALG_L10_P004_HIT_POINT');const n=v.main.find(x=>x.instanceId===actual.instanceId)!;if(![shapePolygon(n),...algL10P004ClipPolygons(n,v.main)].every(p=>algL10P004PointInPolygon(point,p)))throw Error('ALG_L10_P004_OUTSIDE_HIT');}
 return Object.freeze({...s,paused:true,glossary:actual});
}
export function algL10P004CloseGlossary(s:AlgL10P004Interaction):AlgL10P004Interaction{view(s);return Object.freeze({...s,paused:true,glossary:null});}
export function algL10P004Replay(s:AlgL10P004Interaction):AlgL10P004Interaction{view(s);if(!Number.isSafeInteger(s.replay+1))throw Error('ALG_L10_P004_REPLAY');return Object.freeze({...s,frame:1,replay:s.replay+1,paused:true,glossary:null});}
export function algL10P004Seek(s:AlgL10P004Interaction,frame:number):AlgL10P004Interaction{view(s);const next=Object.freeze({...s,frame,paused:true,glossary:null});view(next);return next;}
export function algL10P004Playing(s:AlgL10P004Interaction,playing:boolean):AlgL10P004Interaction{view(s);return Object.freeze({...s,paused:!playing||s.frame===609||s.glossary!==null});}
export function algL10P004Advance(s:AlgL10P004Interaction,frame:number):AlgL10P004Interaction{view(s);if(!Number.isSafeInteger(frame)||frame<s.frame||frame>609)throw Error('ALG_L10_P004_ADVANCE');if(s.paused)return s;return Object.freeze({...s,frame,paused:frame===609});}
