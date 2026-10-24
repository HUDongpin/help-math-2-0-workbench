import React from 'react';

export type Rw002Matrix = readonly number[];
export type Rw002ColorTransform = {readonly multiply: readonly number[]; readonly add: readonly number[]; readonly divisor: number};
export type Rw002Color = {readonly kind: 'static-rgba'; readonly rgba: readonly number[]} | {readonly kind: 'ratio-rgba'; readonly coefficients: readonly {readonly startByte: number; readonly deltaByte: number; readonly round: boolean; readonly divisor: number}[]};
export type Rw002PaintOperation = {
 readonly kind: 'solid-fill' | 'source-gradient-fill' | 'source-gradient-overlay' | 'source-bitmap-fill' | 'source-stroke';
 readonly sourceOperationIndex?: number; readonly color?: Rw002Color;
 readonly gradientKind?: 'linear' | 'radial'; readonly coordinates?: readonly number[];
 readonly transforms?: readonly Rw002Matrix[]; readonly stops?: readonly {readonly offset: number; readonly color: Rw002Color}[];
 readonly sourceFillRule?: 'evenodd' | null; readonly sourceClipRule?: 'nonzero' | null;
 readonly fillRect?: readonly number[] | null; readonly bitmapCharacterId?: number; readonly patternRepeat?: 'repeat';
 readonly width?: {readonly startTwips: number; readonly deltaTwips: number};
 readonly lineCap?: 'round'; readonly lineJoin?: 'round';
 readonly sourceStyleEpoch?: number; readonly sourceStyleIndex?: number; readonly sourceGradientWitnessIndex?: number;
};
export type Rw002PaintPath = {readonly pathIndex?: number; readonly d: string; readonly morph?: {readonly start: string; readonly end: string}; readonly fillRule: 'evenodd'; readonly clipRule: 'evenodd'; readonly paintOperations: readonly Rw002PaintOperation[]};
export type Rw002Shape = {readonly characterId: number; readonly role: string; readonly sourceTagSha256: string; readonly paths: readonly Rw002PaintPath[]};
export type Rw002Bitmap = {readonly characterId: number; readonly href: string; readonly pixelDimensions: readonly number[]; readonly cacheBytesSha256: string; readonly role: string};
const requireValue = <T,>(value: T | undefined | null, label: string): T => {if(value === undefined || value === null) throw new Error('Missing RW002 '+label); return value;};
const finite = (values: readonly number[], count: number, label: string) => {if(values.length !== count || !values.every(Number.isFinite)) throw new Error('Invalid RW002 '+label); return values;};
const validateRatio = (ratio: number) => {if(!Number.isInteger(ratio) || ratio<0 || ratio>65535) throw new RangeError('Invalid RW002 source ratio');};
export function interpolateRw002Path(path: Rw002PaintPath, ratio: number) {
 validateRatio(ratio); if(!path.morph) return path.d;
 const {start,end}=path.morph, numbers=/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g;
 if(start.replace(numbers,'#')!==end.replace(numbers,'#')) throw new Error('RW002 morph command topology mismatch');
 const a=[...start.matchAll(numbers)].map(m=>Number(m[0])), b=[...end.matchAll(numbers)].map(m=>Number(m[0]));
 if(a.length!==b.length || ![...a,...b].every(Number.isFinite)) throw new Error('RW002 morph coordinate mismatch');
 // Preserve the cached source useRatio's multiply-then-divide operation order.
 let k=0;return start.replace(numbers,()=>String(a[k]+(b[k]-a[k++])*ratio/65535));
}
/** Paint alpha stays intrinsic. These own-source instances have zero AddA;
 * the caller applies the placement's alpha exactly once to its actor. */
export function rw002Rgba(color: Rw002Color, ratio: number, transform: Rw002ColorTransform): readonly number[] {
 validateRatio(ratio);finite(transform.multiply,4,'multiply');finite(transform.add,4,'add');
 if(transform.divisor!==256 || transform.add[3]!==0) throw new Error('RW002 requires the source zero alpha-offset contract');
 const rgba=color.kind==='static-rgba' ? finite(color.rgba,4,'RGBA') : color.coefficients.map(c=>(c.round?Math.round(c.startByte+c.deltaByte*ratio/65535):c.startByte+c.deltaByte*ratio/65535)/c.divisor);
 finite(rgba,4,'paint coefficients');
 return rgba.map((v,k)=>k===3 ? Math.max(0,Math.min(1,v)) : Math.max(0,Math.min(255,v*transform.multiply[k]/256+transform.add[k])));
}
export function rw002CssColor(color: Rw002Color, ratio: number, transform: Rw002ColorTransform) {
 const c=rw002Rgba(color,ratio,transform); return 'rgba('+c.join(',')+')';
}
const matrix = (m: Rw002Matrix) => 'matrix('+finite(m,6,'paint matrix').join(' ')+')';
const rectangle = (r: readonly number[]) => {finite(r,4,'source paint rectangle');return {x:r[0],y:r[1],width:r[2],height:r[3]};};
/** RW002 ordered operations, in source-local twips. No source JS/AS executes. */
export function Rw002ShapePaints({shape,ratio,idPrefix,colorTransform,bitmaps}: {shape: Rw002Shape;ratio: number;idPrefix: string;colorTransform: Rw002ColorTransform;bitmaps: ReadonlyMap<number,Rw002Bitmap>}) {
 validateRatio(ratio);
 return <>{shape.paths.map((p,pathIndex)=>{
  const d=interpolateRw002Path(p,ratio);
  return <React.Fragment key={pathIndex}>{p.paintOperations.map((op,index)=>{
   const id=idPrefix+'-p'+pathIndex+'-o'+index;
   const evidence={'data-source-paint-kind':op.kind,'data-source-path-index':pathIndex,'data-source-operation-index':index,'data-source-style-epoch':op.sourceStyleEpoch,'data-source-style-index':op.sourceStyleIndex};
   if(op.sourceOperationIndex!==undefined && op.sourceOperationIndex!==index) throw new Error('RW002 ordered source paint index mismatch');
   if(op.kind==='solid-fill') return <path key={id} {...evidence} d={d} fill={rw002CssColor(requireValue(op.color,'solid color'),ratio,colorTransform)} fillRule={p.fillRule}/>;
   if(op.kind==='source-stroke') {
    const w=requireValue(op.width,'stroke width'),width=w.startTwips+w.deltaTwips*ratio/65535;
    if(!Number.isFinite(width)||width<0) throw new Error('Invalid RW002 stroke width');
    return <path key={id} {...evidence} d={d} fill="none" stroke={rw002CssColor(requireValue(op.color,'stroke color'),ratio,colorTransform)} strokeWidth={width===0?1:width} vectorEffect={width===0?'non-scaling-stroke':undefined} strokeLinecap={op.lineCap} strokeLinejoin={op.lineJoin}/>;
   }
   if(op.kind==='source-gradient-fill' || op.kind==='source-gradient-overlay') {
    const direct=op.kind==='source-gradient-fill',coords=finite(requireValue(op.coordinates,'gradient coordinates'),direct?4:6,'gradient coordinates');
    const transforms=requireValue(op.transforms,'gradient transforms'),stops=requireValue(op.stops,'gradient stops');
    if(direct && (op.gradientKind!=='linear'||transforms.length!==0||op.sourceFillRule!=='evenodd'||op.sourceClipRule!==null||op.fillRect!==null)) throw new Error('RW002 direct gradient must remain an unclipped evenodd fill');
    if(!direct && (op.gradientKind!=='radial'||transforms.length!==1||op.sourceClipRule!=='nonzero'||op.sourceFillRule!==null)) throw new Error('RW002 radial overlay must retain its source internal nonzero clip');
    const stopNodes=stops.map((s,k)=>{if(!Number.isFinite(s.offset)||s.offset<0||s.offset>1)throw new Error('Invalid RW002 gradient stop');return <stop key={k} offset={s.offset} stopColor={rw002CssColor(s.color,ratio,colorTransform)}/>;});
    return <React.Fragment key={id}><defs>{direct?<linearGradient id={id} gradientUnits="userSpaceOnUse" x1={coords[0]} y1={coords[1]} x2={coords[2]} y2={coords[3]} spreadMethod="pad">{stopNodes}</linearGradient>:<radialGradient id={id} gradientUnits="userSpaceOnUse" fx={coords[0]} fy={coords[1]} fr={coords[2]} cx={coords[3]} cy={coords[4]} r={coords[5]} spreadMethod="pad">{stopNodes}</radialGradient>}
     {!direct && <clipPath id={id+'-clip'} clipPathUnits="userSpaceOnUse"><path d={d} fillRule="nonzero" clipRule="nonzero"/></clipPath>}</defs>
     {direct?<path {...evidence} d={d} fill={'url(#'+id+')'} fillRule="evenodd" data-source-gradient-witness={op.sourceGradientWitnessIndex}/>:<g {...evidence} clipPath={'url(#'+id+'-clip)'} data-source-gradient-witness={op.sourceGradientWitnessIndex}><rect {...rectangle(requireValue(op.fillRect,'gradient fill rectangle'))} transform={transforms.map(matrix).join(' ')} fill={'url(#'+id+')'}/></g>}
    </React.Fragment>;
   }
   if(op.kind==='source-bitmap-fill') {
    const b=requireValue(bitmaps.get(requireValue(op.bitmapCharacterId,'bitmap identity')),'own retained bitmap'),transforms=requireValue(op.transforms,'bitmap matrices');
    if(b.characterId===65535 || transforms.length!==2 || op.patternRepeat!=='repeat' || op.sourceClipRule!=='nonzero') throw new Error('RW002 real bitmap style ownership mismatch');
    const [width,height]=finite(b.pixelDimensions,2,'bitmap dimensions');if(width<=0||height<=0)throw new Error('Invalid RW002 bitmap size');
    // Full RGB transforms affect retained pixels. feFuncA stays identity;
    // placement alpha is applied only on the containing source actor.
    const channels=[0,1,2].map(k=>({slope:colorTransform.multiply[k]/256,intercept:colorTransform.add[k]/255}));
    const filtered=channels.some(c=>c.slope!==1||c.intercept!==0);
    if(colorTransform.add[3]!==0 || colorTransform.divisor!==256) throw new Error('RW002 bitmap alpha-offset contract changed');
    return <React.Fragment key={id}><defs><clipPath id={id+'-clip'} clipPathUnits="userSpaceOnUse"><path d={d} fillRule="nonzero" clipRule="nonzero"/></clipPath>
     {filtered && <filter id={id+'-rgb'} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncR type="linear" {...channels[0]}/><feFuncG type="linear" {...channels[1]}/><feFuncB type="linear" {...channels[2]}/><feFuncA type="identity"/></feComponentTransfer></filter>}
     <pattern id={id} patternUnits="userSpaceOnUse" width={width} height={height}><image href={b.href} width={width} height={height} preserveAspectRatio="none" filter={filtered?'url(#'+id+'-rgb)':undefined} data-source-bitmap-id={b.characterId} data-source-bitmap-sha256={b.cacheBytesSha256}/></pattern></defs>
     <g {...evidence} data-source-bitmap-id={b.characterId} clipPath={'url(#'+id+'-clip)'}><rect {...rectangle(requireValue(op.fillRect,'bitmap fill rectangle'))} transform={transforms.map(matrix).join(' ')} fill={'url(#'+id+')'}/></g>
    </React.Fragment>;
   }
   throw new Error('Unsupported RW002 source paint');
  })}</React.Fragment>;
 })}</>;
}
