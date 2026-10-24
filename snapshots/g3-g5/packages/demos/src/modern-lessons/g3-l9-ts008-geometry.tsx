'use client';
import React,{useId}from'react';
import{G3_L9_TS008_SOURCE_DATA as source}from'./generated/g3-l9-ts008-source-v1';
export type G3L9GeometryKind='fold'|'symmetry';
type Matrix=readonly number[];
type Color=readonly number[];
type ObjectState={characterId:number;depth:number;matrix:Matrix;ratio:number;clipDepth?:number;colorTransform?:{multiply:readonly number[];add:readonly number[]}};
type Path={path:string;fill?:Color;stroke?:Color;strokeWidth?:number;morph?:boolean};
const geometry=source.geometry;
export function sourceMorphPath(path:string,ratio:number){
 const tokens=path.split(/\s+/);let i=0;const parts:string[]=[];const t=Math.max(0,Math.min(65535,ratio))/65535;
 while(i<tokens.length){if(/^[MLQZ]$/.test(tokens[i])){parts.push(tokens[i++]);continue;}const x0=Number(tokens[i++]),x1=Number(tokens[i++]),y0=Number(tokens[i++]),y1=Number(tokens[i++]);if([x0,x1,y0,y1].some(v=>!Number.isFinite(v)))throw new Error('Unsupported source morph path');parts.push(String(x0+(x1-x0)*t),String(y0+(y1-y0)*t));}
 return parts.join(' ');
}
const matrix=(m:Matrix)=>`matrix(${m.join(' ')})`;
const color=(rgba:Color,transform?:ObjectState['colorTransform'])=>{const values=rgba.map((v,i)=>{const normalized=i===3?v*255:v;return Math.max(0,Math.min(255,normalized*(transform?.multiply[i]??256)/256+(transform?.add[i]??0)));});return`rgba(${values[0]},${values[1]},${values[2]},${values[3]/255})`;};
export function getG3L9GeometryState(kind:G3L9GeometryKind,frame:number){const frames=geometry[kind],index=Math.max(0,Math.min(frames.length-1,Math.round(frame)-1));return frames[index];}
let fontPromise:Promise<void>|null=null;
export function prepareG3L9GeometryFont():Promise<void>{
 if(typeof document==='undefined')return Promise.resolve();
 if(!fontPromise)fontPromise=(async()=>{const response=await fetch(geometry.font.source,{credentials:'same-origin'});if(!response.ok)throw new Error('Source geometry font unavailable');const bytes=await response.arrayBuffer(),sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(v=>v.toString(16).padStart(2,'0')).join('');if(sha!==geometry.font.sha256)throw new Error('Source geometry font hash mismatch');const font=new FontFace(geometry.font.family,bytes,{style:'normal',weight:'400'});await font.load();document.fonts.add(font);})();
 return fontPromise;
}
function Shape({object,clip=false}:{object:ObjectState;clip?:boolean}){
 if(object.characterId===130){const glyph=geometry.glyphs.find(g=>g.characterId===130)!;return<text textRendering="geometricPrecision" x={glyph.x} y={glyph.y} fontSize={glyph.fontHeight} fontFamily={geometry.font.family} fill={clip?'black':color([0,0,0,1],object.colorTransform)} transform={matrix(object.matrix)} data-source-geometric-glyph="x" data-source-glyph-index="6" data-ttf-glyph-index="9" data-source-advance={glyph.sourceAdvance} aria-hidden="true">x</text>;}
 const shape=geometry.shapes[String(object.characterId) as keyof typeof geometry.shapes];if(!shape)throw new Error('Unknown source geometry shape');
 return<>{(shape.paths as readonly Path[]).map((p,i)=><path key={i} transform={matrix(object.matrix)} d={p.morph?sourceMorphPath(p.path,object.ratio):p.path} fill={p.fill?(clip?'black':color(p.fill,object.colorTransform)):'none'} fillRule="evenodd" stroke={p.stroke?(clip?'black':color(p.stroke,object.colorTransform)):undefined} strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>)}</>;
}
/** Only the mathematical glyph/half-shape graph uses the embedded source font.
 * It never supplies body copy, layout advances, or a raster text surrogate. */
export function G3L9SourceGeometry({kind,frame,label}:{kind:G3L9GeometryKind;frame:number;label:string}){
 const prefix=useId().replace(/:/g,''),state=getG3L9GeometryState(kind,frame),objects=state.objects as readonly ObjectState[],masks=objects.filter(o=>o.clipDepth!==undefined),clipId=(o:ObjectState)=>`${prefix}-${kind}-depth-${o.depth}`;
 return<svg className="g3-l9-ts008__geometry" viewBox={geometry.viewBoxes[kind].join(' ')} role="img" aria-label={label} data-source-geometry={kind} data-source-geometry-frame={state.frame} data-source-font-sha256={geometry.font.sha256}>
  <defs>{masks.map(mask=><clipPath id={clipId(mask)} key={mask.depth} clipPathUnits="userSpaceOnUse"><Shape object={mask} clip/></clipPath>)}</defs>
  {objects.filter(o=>o.clipDepth===undefined).map(object=>{let node=<Shape object={object}/>;for(const mask of masks.filter(m=>m.depth<object.depth&&m.clipDepth!>=object.depth))node=<g clipPath={`url(#${clipId(mask)})`}>{node}</g>;return<g key={object.depth} data-source-character={object.characterId}>{node}</g>;})}
 </svg>;
}
export function G3L9SourceLetter({letter,hidden=false}:{letter:'P'|'Q'|'X'|'Z';hidden?:boolean}){
 return<svg className="g3-l9-ts008__letter" viewBox="0 -800 850 900" role={hidden?undefined:'img'} aria-label={hidden?undefined:letter} aria-hidden={hidden||undefined} data-source-geometric-letter={letter} data-source-font-sha256={geometry.font.sha256}>
  <text textRendering="geometricPrecision" x="0" y="0" fontSize="1024" fontFamily={geometry.font.family} fontWeight="400" fill="currentColor">{letter}</text>
 </svg>;
}
/** One row keeps its source glyph/axis placement relationship in both consumers.
 * The Help sample is its readable stop18; this does not reproduce enlargement.
 * X/Z keep the disclosed native font104 substitution, including its baseline. */
export function G3L9SourceTableLetter({row,variant='main'}:{row:'A'|'B'|'C'|'D';variant?:'main'|'help'}){
 const config=geometry.tableRows.find(r=>r.row===row)!,placement=config.placements[variant],glyph=config.glyph,axes=geometry.shapes['117'];
 const label=config.letter==='X'?'X: two lines of symmetry, vertical and horizontal':`${config.letter}: attempted vertical fold; the halves do not match`;
 return<svg className="g3-l9-ts008__letter" viewBox={placement.viewBox.join(' ')} role="img" aria-label={label} data-source-table-row={row} data-source-table-variant={variant} data-source-axis-shape="117" data-source-table-frame={placement.frame} data-source-font-policy={glyph.fontPolicy} data-source-font-sha256={geometry.font.sha256}>
  <text textRendering="geometricPrecision" x={glyph.x} y={glyph.y} fontSize={glyph.fontHeight} fontFamily={geometry.font.family} fontWeight="400" fill={color([glyph.color[0],glyph.color[1],glyph.color[2],glyph.color[3]/255])} data-source-character={config.characterId} aria-hidden="true">{config.letter}</text>
  {config.pathIndexes.map(index=>{const axis=axes.paths[index];return<path key={index} d={axis.path} transform={matrix(placement.axisMatrix)} fill="none" stroke={color(axis.stroke)} strokeWidth={axis.strokeWidth} strokeLinecap="round" strokeLinejoin="round" data-source-axis-path={index}/>;})}
 </svg>;
}
