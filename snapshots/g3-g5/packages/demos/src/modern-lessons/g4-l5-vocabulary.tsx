'use client';
import React from 'react';
import type {AnimationRendererProps,AudioCue,RuntimeContext} from '../contract';
import type {LessonTextBinding,LessonTextPresentationCapability,LessonTextKeyTermsCapability,TextPresentationSnapshot} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {validateLessonTextBinding} from '../lesson-text-snapshot';
type Curve<T> = readonly (readonly [number,T])[];
type Token={sourceDepths?:Curve<number>;nativeShadow?:{xTwips:number;yTwips:number;color:string};sourceBaselines?:Curve<{y:number;fontSizeRatio:number}|null>;sourcePositions?:Curve<{x:number;y:number}|null>;text:string;alpha:Curve<number>;rgb:Curve<readonly number[]>;sourceTextIds:readonly string[];sourceCharacter:number;sourceInstance:string;semanticWord?:string;nativeInk?:readonly number[]};
type Block={id:string;character:number;text:string;role:string;tokens:readonly Token[];alias:boolean;sourceMotion?:Curve<{xEm:number;yEm:number;matrix:readonly number[]}|null>;sourceFontHeightTwips?:number};
type Term={button:number;key:string;block:string;token:number;tokenEnd?:number;word:string;entryId:string;activeFrames:readonly(readonly[number,number])[];sourceTelemetry:boolean;unusedQExpression:boolean};
type Path={d:string;fill?:string;stroke?:string;width?:number};
type Shape={sourceImage?:{source:string;sha256:string;bitmapCharacter:number;x:number;y:number;width:number;height:number;pixelWidth:number;pixelHeight:number};linearGradient?:{matrix:readonly number[];stops:readonly {offset:number;rgba:readonly number[]}[]};character:number;role:string;paths:readonly Path[];bounds:{left:number;right:number;top:number;bottom:number}};
type Placement={character:number;alpha:number;matrix:readonly number[];ratio:number;paths?:readonly Path[];clipRects?:readonly(readonly number[])[]};
type MethodDiagram={sourceDepthStack?:boolean;viewBox:readonly number[];inlineRem:number;description:string;labels:readonly {block:string;sourceDepth:number;x:number;y:number;sourceGlyphBounds:readonly number[];sourceBaselines?:Curve<{y:number;fontSizeRatio:number}|null>;sourcePositions?:Curve<{x:number;y:number;matrix:readonly number[]}|null>}[];nativeDisposition:string};
export type Config={trimSourcePositionedTokens?:boolean;nativeStrokeWidthRem?:number;nativeColorPalette?:Readonly<Record<string,string>>;textInstanceAliases?:readonly {sourceBlock:string;targetBlock:string;highlight:boolean;sourceInstance:string;targetInstance:string;sourceFramesChecked:number}[];methodDiagram?:MethodDiagram;binding:LessonTextBinding;sourceAudio:readonly(AudioCue&{readonly sha256:string})[];keyTerms:LessonTextKeyTermsCapability;fps:number;rootFrame:number;sourceTerminalStop:boolean;sourceGroupSvg:string|null;textDispositions:readonly {character:number;role:string;sourceText:string}[];animationId:string;placementId:string;sourceSwfSha256:string;frameDomain:string;frameCount:number;layout:string;blocks:readonly Block[];terms:readonly Term[];sourceEffects:readonly {kind:string;states:Curve<{alpha:number;matrix:readonly number[]}|null>}[];graphicPlacements:readonly {depth:number;states:Curve<Placement|null>}[];shapes:readonly Shape[];nativeGroups:readonly {name:string;blockIds:readonly string[];text:string;sourceReadOrder:string;nativeSpacing:string}[];outlinedTextAliases:readonly {nativeStroke?:{widthEm:number;color:string};sourceShape:number;sourceShapes:readonly number[];sourceCharacters:readonly number[];text:string;targetBlock:string;targetToken:number;sourceShapeInstance?:string;activeFrames?:readonly (readonly [number,number])[];nativeDisposition?:string}[]};
export function curveAt<T>(curve:Curve<T>,frame:number):T{let value=curve[0][1];for(const [start,next]of curve){if(start>frame)break;value=next;}return value;}
type BaselineLabelProps = {
  left: string;
  top: string;
  fontSizeRatio: number;
  hidden: boolean;
  children: React.ReactNode;
  sourceBaselineY?: number;
  mathToken?: number;
  sourceAnchorX?: number;
  sourceAnchorY?: number;
  sourceDepth?: number;
};

function BaselineLabel({left, top, fontSizeRatio, hidden, children, sourceBaselineY, mathToken, sourceAnchorX, sourceAnchorY, sourceDepth}: BaselineLabelProps) {
  const textRef = React.useRef<HTMLSpanElement>(null);
  const markerRef = React.useRef<HTMLSpanElement>(null);
  const [baselineOffset, setBaselineOffset] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    if (CSS.supports('text-box-trim', 'trim-end') && CSS.supports('text-box-edge', 'text alphabetic')) return;
    const text = textRef.current;
    const marker = markerRef.current;
    if (!text || !marker) return;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const offset = marker.getBoundingClientRect().top - text.getBoundingClientRect().top;
      if (Number.isFinite(offset)) setBaselineOffset(previous => previous === offset ? previous : offset);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(text);
    void document.fonts.ready.then(measure);
    document.fonts.addEventListener('loadingdone', measure);
    return () => {
      disposed = true;
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', measure);
    };
  }, [fontSizeRatio]);

  return <span
    className="g4l5-vocabulary__method-label g4l5-vocabulary__baseline-label"
    data-source-baseline-y={sourceBaselineY}
    data-source-font-ratio={fontSizeRatio}
    data-source-math-token={mathToken}
    data-source-anchor-x={sourceAnchorX}
    data-source-anchor-y={sourceAnchorY}
    aria-hidden={hidden || undefined}
    style={{left, top, zIndex: sourceDepth, fontSize: `${fontSizeRatio}em`, visibility: hidden ? 'hidden' : 'visible'}}
  >
    <span ref={textRef} data-source-baseline-text data-baseline-ready={baselineOffset === null ? undefined : 'true'} style={{'--g4l5-baseline-offset': `${baselineOffset ?? 0}px`} as React.CSSProperties}>
      {children}<span ref={markerRef} data-source-baseline-marker aria-hidden="true"/>
    </span>
  </span>;
}

const BASELINE_STYLE=`
.g4l5-vocabulary__method-label.g4l5-vocabulary__baseline-label {
  inline-size: 0;
  block-size: 0;
  transform: none;
}
.g4l5-vocabulary__baseline-label > [data-source-baseline-text] {
  position: absolute;
  bottom: 0;
  white-space: pre;
  transform: translateX(-50%);
  text-box-trim: trim-end;
  text-box-edge: text alphabetic;
}
[data-source-baseline-marker] {
  display: inline-block;
  vertical-align: baseline;
  inline-size: 0;
  block-size: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
@supports not ((text-box-trim: trim-end) and (text-box-edge: text alphabetic)) {
  .g4l5-vocabulary__baseline-label > [data-source-baseline-text] {
    top: 0;
    bottom: auto;
    text-box-trim: none;
    transform: translateX(-50%) translateY(calc(-1 * var(--g4l5-baseline-offset)));
    visibility: hidden;
  }
  .g4l5-vocabulary__baseline-label > [data-source-baseline-text][data-baseline-ready='true'] {
    visibility: inherit;
  }
}
`;
export function getTeachingState(config:Config,requestedFrame:number){const frame=Math.max(1,Math.min(config.frameCount,Math.floor(Number.isFinite(requestedFrame)?requestedFrame:1)));return{frame,blocks:config.blocks.map(b=>({...b,tokens:b.tokens.map(t=>({...t,alpha:curveAt(t.alpha,frame),rgb:curveAt(t.rgb,frame)}))})),graphics:config.graphicPlacements.map(p=>({...p,value:curveAt(p.states,frame)})),labelArrival:config.sourceEffects.find(e=>e.kind==='label-arrival')};}
const STYLE=`
.g4l5-vocabulary{container-type:inline-size;inline-size:100%;min-inline-size:0;box-sizing:border-box;background:#fffdf7;color:#172336;padding:1rem;font-family:var(--lesson-font-body,'Nunito Sans'),sans-serif;font-size:var(--lesson-text-body-size,1.125rem);line-height:1.6}.g4l5-vocabulary *{box-sizing:border-box}
.g4l5-vocabulary h2{font-family:var(--lesson-font-display,Fredoka),sans-serif;font-size:clamp(1.75rem,3.5cqi,2.25rem);line-height:1.25;color:#10389c;margin:0 0 .8rem}.g4l5-vocabulary__definition{padding:.5rem .6rem;background:#fff;border-radius:.4rem;margin:.7rem 0;max-inline-size:70ch}
.g4l5-vocabulary h2 .g4l5-vocabulary__word{display:inline;white-space:normal;overflow-wrap:normal}.g4l5-vocabulary__word{display:inline-block;white-space:pre;transition:none!important}.g4l5-vocabulary__term{font:inherit;color:#1556a0;background:transparent;border:0;padding:0;min-block-size:44px;min-inline-size:44px;border-radius:.2rem;text-decoration:underline;text-underline-offset:.15em;cursor:pointer}.g4l5-vocabulary__term:disabled{color:inherit;cursor:default}.g4l5-vocabulary__term:focus-visible,.g4l5-vocabulary__scroll:focus-visible{outline:3px solid #1556a0;outline-offset:3px}
.g4l5-vocabulary__scroll{max-inline-size:100%;min-inline-size:0;overflow-x:auto;overscroll-behavior-inline:contain;padding:.3rem}.g4l5-vocabulary__equation{inline-size:max-content;min-inline-size:100%;font-size:1.375rem;line-height:1.5;white-space:nowrap;text-align:center;font-variant-numeric:tabular-nums}
.g4l5-vocabulary__factors{display:grid;grid-template-columns:repeat(5,minmax(min-content,max-content));justify-content:center;column-gap:.4em;align-items:center;font-size:1.5rem;line-height:1.5;min-inline-size:max-content;padding:.5rem .3rem}.g4l5-vocabulary__factors>.g4l5-vocabulary__word{text-align:center}.g4l5-vocabulary__arrow{grid-row:2;display:block;inline-size:1.4em;block-size:2.5em;justify-self:center}.g4l5-vocabulary__factor-label{grid-row:3;grid-column:1/4;justify-self:center;transform-origin:center top}.g4l5-vocabulary__emphasis{color:#172336!important;text-decoration:underline;text-decoration-color:#c71585;text-decoration-thickness:.13em;text-underline-offset:.14em;font-weight:700;background:#fbe4f3;border-radius:.15em}
.g4l5-vocabulary__arrays{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.7fr);gap:.8rem;align-items:start}.g4l5-vocabulary__card{min-inline-size:0;padding:.5rem;border:1px solid #acb6c4;border-radius:.5rem;background:#f4f7fb;text-align:center}.g4l5-vocabulary__diagram,.g4l5-vocabulary__arrow{overflow:hidden}.g4l5-vocabulary__diagram{display:block;inline-size:100%;block-size:auto;max-block-size:15rem}.g4l5-vocabulary__array-label{white-space:nowrap;inline-size:max-content;min-inline-size:100%;font-size:1.375rem}.g4l5-vocabulary__array-part{display:inline-block}.g4l5-vocabulary__array-part[data-part=operator]{margin-inline:.25em}.g4l5-vocabulary__array-part[data-part=array-word]{margin-inline-start:.25em}.g4l5-vocabulary__row-label,.g4l5-vocabulary__column-label{font-size:1.125rem;line-height:1.5;min-block-size:1.5em}
.g4l5-vocabulary__examples{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.6rem;align-items:stretch}
.g4l5-vocabulary__vertical{display:grid;grid-template-columns:1em max-content;grid-template-rows:auto auto .2em auto;justify-content:center;column-gap:.4em;inline-size:max-content;min-inline-size:100%;font-size:1.375rem;line-height:1.3;text-align:right;font-variant-numeric:tabular-nums}
.g4l5-vocabulary__vertical [data-part=top]{grid-column:2;grid-row:1}
.g4l5-vocabulary__vertical [data-part=operator]{grid-column:1;grid-row:2}
.g4l5-vocabulary__vertical [data-part=operand]{grid-column:2;grid-row:2}
.g4l5-vocabulary__vertical [data-part=result]{grid-column:2;grid-row:4}
.g4l5-vocabulary__rule{grid-column:1/3;grid-row:3;border-block-start:2px solid currentColor}
.g4l5-vocabulary__dots{display:block;inline-size:11.53rem;max-inline-size:100%;block-size:auto;margin:.45rem auto}
.g4l5-vocabulary__groups{font-size:1.375rem;line-height:1.45}
.g4l5-vocabulary__annotated{display:grid;grid-template-columns:repeat(5,minmax(min-content,max-content));justify-content:center;column-gap:.4em;align-items:center;font-size:1.5rem;line-height:1.45;min-inline-size:max-content;padding:.5rem .3rem}
.g4l5-vocabulary__annotated>.g4l5-vocabulary__word{text-align:center}
.g4l5-vocabulary__product{grid-row:3;grid-column:5;justify-self:center;transform-origin:center top}
.g4l5-vocabulary__product-arrow{grid-row:2;grid-column:5;display:block;block-size:2.2em;inline-size:.8em;justify-self:center;overflow:visible}
@container(max-width:42rem){.g4l5-vocabulary__arrays,.g4l5-vocabulary__examples{grid-template-columns:1fr}}@container(max-width:26rem){.g4l5-vocabulary{padding:.5rem;font-size:1.125rem}.g4l5-vocabulary h2{font-size:1.125rem}.g4l5-vocabulary__card{padding:.35rem}}
`;
const METHOD_STYLE=`
.g4l5-vocabulary__method-diagram{position:relative;margin:1rem auto;font-size:1.375rem;line-height:1.35;font-variant-numeric:tabular-nums}.g4l5-vocabulary__method-diagram>svg{position:absolute;inset:0;inline-size:100%;block-size:100%;overflow:visible}.g4l5-vocabulary__method-label{position:absolute;transform:translate(-50%,-50%);white-space:nowrap}.g4l5-vocabulary__semantic-word{white-space:nowrap}.g4l5-vocabulary__term-group{max-inline-size:100%;white-space:normal;text-align:start}.g4l5-vocabulary__method-rule{vector-effect:non-scaling-stroke}
`;
const ARRAY_LABEL_STYLE=`
.g4l5-vocabulary__array-part{display:inline-flex;align-items:baseline;gap:.08em}.g4l5-vocabulary__array-part>[data-lesson-text-block]{display:inline-flex;padding-inline:.03em}
`;
const NEXT_STYLE=`
.g4l5-vocabulary__foil-grid{display:grid;grid-template-columns:max-content max-content;gap:.4rem 1.25rem;inline-size:max-content;min-inline-size:100%;justify-content:center;font-size:1.375rem;line-height:1.8;font-variant-numeric:tabular-nums}
.g4l5-vocabulary__foil-fragments{display:inline-flex;align-items:baseline;gap:.08em;white-space:nowrap}.g4l5-vocabulary__foil-fragments>span{display:inline-flex;padding-inline:.03em}.g4l5-vocabulary__foil-fragments>[data-source-math-operator=true]{margin-inline:.22em}
.g4l5-vocabulary__foil-result{justify-self:end}.g4l5-vocabulary__foil-rule{grid-column:2;justify-self:stretch;text-align:right;white-space:nowrap}.g4l5-vocabulary__foil-plus{margin-inline-end:.8em}
`;
export function NativeVocabulary({config,frame,replay=0,onLessonHostRequest}:{config:Config;frame:number;replay?:number;onLessonHostRequest?:AnimationRendererProps['onLessonHostRequest']}){
 const clipPrefix=React.useId().replace(/:/g,'');const nativeColor=(color:string)=>config.nativeColorPalette?.[color]??color;
 const state=getTeachingState(config,frame),blocks=new Map(state.blocks.map(b=>[b.id,b]));const visible=(id:string)=>blocks.get(id)!.tokens.some(t=>t.alpha>0);
 const graphics=state.graphics.filter((p):p is{depth:number;states:Curve<Placement|null>;value:Placement}=>p.value!==null);
 const highlighted=(id:string,index:number)=>config.outlinedTextAliases.some(a=>!a.nativeStroke&&a.targetBlock===id&&a.targetToken===index&&(!a.activeFrames||a.activeFrames.some(([lo,hi])=>state.frame>=lo&&state.frame<hi))&&graphics.some(g=>a.sourceShapes.includes(g.value.character)&&g.value.alpha>0))||config.textInstanceAliases?.some(a=>a.highlight&&a.targetBlock===id&&(blocks.get(a.sourceBlock)?.tokens[index]?.alpha??0)>0)===true;
 const nativeStroke=(id:string,index:number)=>config.outlinedTextAliases.find(a=>a.nativeStroke&&a.targetBlock===id&&a.targetToken===index&&(!a.activeFrames||a.activeFrames.some(([lo,hi])=>state.frame>=lo&&state.frame<hi))&&graphics.some(g=>a.sourceShapes.includes(g.value.character)&&g.value.alpha>0))?.nativeStroke;
 const renderToken=(id:string,index:number,style?:React.CSSProperties)=>{const token=blocks.get(id)!.tokens[index],term=config.terms.find(t=>t.block===id&&t.token===index&&t.tokenEnd===undefined),shown=token.alpha>0,active=term?.activeFrames.some(([first,last])=>state.frame>=first&&state.frame<last)??false;
  const displayText=(config.animationId==='course-g04-l05-in-008'&&token.sourcePositions&&token.sourceBaselines||config.trimSourcePositionedTokens&&token.sourcePositions)?token.text.trimEnd():token.text;const outline=nativeStroke(id,index),shadow=token.nativeShadow,diagram=config.methodDiagram;
  const content=term?<><button type="button" className="g4l5-vocabulary__term" disabled={!shown||!active||!onLessonHostRequest} data-source-button={term.button} data-source-keyterm={term.key} data-keyterm-entry-id={term.entryId} onClick={event=>{if(shown&&active)onLessonHostRequest?.({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:config.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget,keyTermIndexLanguage:'en'});}}>{term.word}</button><span style={{color:'#172336'}}>{token.text.slice(term.word.length)}</span></>:displayText;
  return <span key={index} className={'g4l5-vocabulary__word'+(highlighted(id,index)?' g4l5-vocabulary__emphasis':'')} data-source-token={index} data-source-character={token.sourceCharacter} data-source-instance={token.sourceInstance} data-source-text-ids={token.sourceTextIds.join(',')} aria-hidden={!shown||undefined} style={{...style,...(outline?{WebkitTextStroke:`${outline.widthEm}em ${outline.color}`,paintOrder:'stroke fill'}:{}),...(shadow&&diagram?{textShadow:`${shadow.xTwips*diagram.inlineRem/diagram.viewBox[2]}rem ${shadow.yTwips*diagram.inlineRem/diagram.viewBox[2]}rem 0 ${shadow.color}`}:{}) ,opacity:token.alpha,visibility:shown?'visible':'hidden',color:term?undefined:nativeColor(`rgb(${(token.nativeInk??token.rgb).join(',')})`)}}>{content}</span>;
 };
 const groupedTerm=(id:string,term:Term)=>{const members=blocks.get(id)!.tokens.slice(term.token,term.tokenEnd),shown=members.some(t=>t.alpha>0),complete=members.every(t=>t.alpha>0),active=term.activeFrames.some(([first,last])=>state.frame>=first&&state.frame<last);return <button key={term.token} type="button" className="g4l5-vocabulary__term g4l5-vocabulary__term-group" disabled={!complete||!active||!onLessonHostRequest} data-source-button={term.button} data-source-keyterm={term.key} data-keyterm-entry-id={term.entryId} aria-hidden={!shown||undefined} style={{visibility:shown?'visible':'hidden'}} onClick={event=>{if(complete&&active)onLessonHostRequest?.({type:'open-keyterm',entryId:term.entryId,sourceAnimationId:config.animationId,playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger:event.currentTarget,keyTermIndexLanguage:'en'});}}>{members.map((_t,index)=>renderToken(id,term.token+index))}</button>;};
 const tokens=(id:string)=>{const list=blocks.get(id)!.tokens;if(!config.methodDiagram)return list.map((_t,i)=>renderToken(id,i));const output:React.ReactNode[]=[];for(let i=0;i<list.length;i++){const term=config.terms.find(t=>t.block===id&&t.token===i&&t.tokenEnd!==undefined);if(term){output.push(groupedTerm(id,term));i=term.tokenEnd!-1;continue;}const group=list[i].semanticWord;if(group){const start=i;while(i+1<list.length&&list[i+1].semanticWord===group)i++;output.push(<span key={start} className="g4l5-vocabulary__semantic-word" data-source-semantic-word={group}>{list.slice(start,i+1).map((_t,index)=>renderToken(id,start+index))}</span>);}else output.push(renderToken(id,i));}return output;};const block=(id:string)=>{const b=blocks.get(id)!,motion=b.sourceMotion?curveAt(b.sourceMotion,state.frame):null;return <span data-lesson-text-block={id} style={b.sourceMotion?{display:'inline-block',transform:`translate(${motion?.xEm??0}em,${motion?.yEm??0}em)`}:undefined}>{tokens(id)}</span>;};
 const equation=(id:string)=><div className="g4l5-vocabulary__scroll" role="region" aria-label="Multiplication example" tabIndex={0}><div className="g4l5-vocabulary__equation">{block(id)}</div></div>;
 const body=(id:string)=><p className="g4l5-vocabulary__definition lesson-text-presentation__block lesson-text-presentation__block--body" data-lesson-text-block={id} aria-hidden={!visible(id)||undefined} style={{visibility:visible(id)?'visible':'hidden'}}>{tokens(id)}</p>;
 const drawing=(roles:string[],placements:typeof graphics=graphics)=>placements.map(({depth,value})=>{const shape=config.shapes.find(s=>s.character===value.character);if(!shape||!roles.includes(shape.role))return null;const graphic=<g key={depth} data-source-shape={value.character} data-source-depth={depth} data-source-ratio={value.ratio} transform={`matrix(${value.matrix.join(' ')})`} opacity={value.alpha}>{shape.linearGradient?<defs><linearGradient id={`${clipPrefix}-source-gradient-${depth}`} gradientUnits="userSpaceOnUse" x1={-16384} y1={0} x2={16384} y2={0} gradientTransform={`matrix(${shape.linearGradient.matrix.join(' ')})`}>{shape.linearGradient.stops.map((stop,i)=><stop key={i} offset={stop.offset} stopColor={`rgb(${stop.rgba.slice(0,3).join(',')})`} stopOpacity={stop.rgba[3]/255}/>)}</linearGradient></defs>:null}{shape.sourceImage?<image data-source-bitmap={shape.sourceImage.bitmapCharacter} data-source-image-sha={shape.sourceImage.sha256} href={shape.sourceImage.source} x={shape.sourceImage.x} y={shape.sourceImage.y} width={shape.sourceImage.width} height={shape.sourceImage.height} preserveAspectRatio="none"/>:null}{(value.paths??shape.paths).map((p,i)=><path key={i} d={p.d} fill={p.fill==='source-linear-gradient'?`url(#${clipPrefix}-source-gradient-${depth})`:nativeColor(p.fill??'none')} stroke={nativeColor(p.stroke??'none')} strokeWidth={p.width??0} data-source-stroke-width={config.nativeStrokeWidthRem&&p.stroke&&p.stroke!=='none'?p.width:undefined} data-native-stroke-width-rem={config.nativeStrokeWidthRem&&p.stroke&&p.stroke!=='none'?config.nativeStrokeWidthRem:undefined} vectorEffect={config.nativeStrokeWidthRem&&p.stroke&&p.stroke!=='none'?'non-scaling-stroke':undefined} style={config.nativeStrokeWidthRem&&p.stroke&&p.stroke!=='none'?{strokeWidth:`${config.nativeStrokeWidthRem}rem`}:undefined}/>)}</g>;if(value.clipRects===undefined)return graphic;const clipId=`${clipPrefix}-source-mask-${depth}`;return <React.Fragment key={depth}><defs><clipPath id={clipId} clipPathUnits="userSpaceOnUse">{value.clipRects.map(([l,r,t,b],i)=><rect key={i} x={l} y={t} width={r-l} height={b-t}/>)}</clipPath></defs><g clipPath={`url(#${clipId})`} data-source-graphic-mask={depth}>{graphic}</g></React.Fragment>;});
 const methodDiagram=()=>{
  const d=config.methodDiagram!;
  const [x,y,width,height]=d.viewBox,shown=d.labels.some(label=>visible(label.block))||graphics.some(g=>g.value.alpha>0);
  return <div className="g4l5-vocabulary__scroll" role="region" aria-label={d.description} aria-hidden={!shown||undefined} tabIndex={shown?0:-1} style={{visibility:shown?'visible':'hidden'}}><div className="g4l5-vocabulary__method-diagram" data-method-diagram={config.layout} style={{inlineSize:d.inlineRem+'rem',blockSize:d.inlineRem*height/width+'rem',...(d.sourceDepthStack?{isolation:'isolate'}:{})}}>{d.sourceDepthStack?graphics.filter(g=>config.shapes.some(shape=>shape.character===g.value.character&&shape.role==='instructional')).map(g=><svg key={g.depth} viewBox={d.viewBox.join(' ')} aria-hidden="true" data-source-graphic-layer={g.depth} style={{zIndex:g.depth,pointerEvents:'none'}}>{drawing(['instructional'],[g])}</svg>):<svg viewBox={d.viewBox.join(' ')} aria-hidden="true">{drawing(['instructional'])}</svg>}{d.labels.map(label=>{
   const b=blocks.get(label.block)!,sourceDepth=d.sourceDepthStack?Math.max(label.sourceDepth,...b.tokens.map(t=>t.sourceDepths?curveAt(t.sourceDepths,state.frame):label.sourceDepth)):undefined;
   const baseline=label.sourceBaselines?curveAt(label.sourceBaselines,state.frame):null;
   if(b.tokens.some(t=>t.sourcePositions))return <span key={label.block} data-lesson-text-block={label.block} data-source-positioned-math="true" style={{display:'contents'}}>{b.tokens.map((token,index)=>{
    const anchor=token.sourcePositions?curveAt(token.sourcePositions,state.frame):null;
    const tokenBaseline=token.sourceBaselines?curveAt(token.sourceBaselines,state.frame):baseline;
    if(label.sourceBaselines||token.sourceBaselines)return <BaselineLabel key={index} sourceDepth={d.sourceDepthStack?(token.sourceDepths?curveAt(token.sourceDepths,state.frame):label.sourceDepth):undefined} left={100*((anchor?.x??label.x)-x)/width+'%'} top={100*((tokenBaseline?.y??label.y)-y)/height+'%'} fontSizeRatio={tokenBaseline?.fontSizeRatio??1} sourceBaselineY={tokenBaseline?.y} mathToken={index} sourceAnchorX={anchor?.x} sourceAnchorY={anchor?.y} hidden={!tokenBaseline||!anchor||token.alpha<=0}>{renderToken(label.block,index)}</BaselineLabel>;
    return <span key={index} className="g4l5-vocabulary__method-label" data-source-math-token={index} data-source-anchor-x={anchor?.x} data-source-anchor-y={anchor?.y} aria-hidden={!anchor||token.alpha<=0||undefined} style={{visibility:anchor&&token.alpha>0?'visible':'hidden',left:100*((anchor?.x??label.x)-x)/width+'%',top:100*((anchor?.y??label.y)-y)/height+'%'}}>{renderToken(label.block,index)}</span>;
   })}</span>;
   const position=label.sourcePositions?curveAt(label.sourcePositions,state.frame)??label:label;
   if(label.sourceBaselines)return <BaselineLabel key={label.block} sourceDepth={sourceDepth} left={100*(position.x-x)/width+'%'} top={100*((baseline?.y??label.y)-y)/height+'%'} fontSizeRatio={baseline?.fontSizeRatio??1} sourceBaselineY={baseline?.y} hidden={!baseline||!visible(label.block)}>{block(label.block)}</BaselineLabel>;
   return <span key={label.block} className="g4l5-vocabulary__method-label" aria-hidden={!visible(label.block)||undefined} style={{visibility:visible(label.block)?'visible':'hidden',left:100*(position.x-x)/width+'%',top:100*(position.y-y)/height+'%'}}>{block(label.block)}</span>;
  })}</div></div>;
 };
 const foilCalculation=()=>{const fragment=(ids:readonly string[])=><span className="g4l5-vocabulary__foil-fragments">{ids.map(id=><span key={id} data-source-math-operator={['×','=',':'].includes(blocks.get(id)!.text)}>{block(id)}</span>)}</span>;return <div className="g4l5-vocabulary__scroll" role="region" aria-label="FOIL partial products and sum" tabIndex={0}><div className="g4l5-vocabulary__foil-grid">{config.nativeGroups.map(group=>{const split=group.blockIds.findIndex(id=>blocks.get(id)!.text==='=')+1;return <React.Fragment key={group.name}>{group.name==='result'?<span className="g4l5-vocabulary__foil-rule">{block('text-69')}</span>:null}<span data-foil-row={group.name}>{fragment(group.blockIds.slice(0,split))}</span><span className="g4l5-vocabulary__foil-result">{group.name==='last'?<span className="g4l5-vocabulary__foil-plus">{block('text-68')}</span>:null}{fragment(group.blockIds.slice(split))}</span></React.Fragment>;})}</div></div>;};
 const joinedBody=(ids:string[])=><p className="g4l5-vocabulary__definition lesson-text-presentation__block lesson-text-presentation__block--body" aria-hidden={!ids.some(visible)||undefined} style={{visibility:ids.some(visible)?'visible':'hidden'}}>{ids.map(id=><React.Fragment key={id}>{block(id)}</React.Fragment>)}</p>;
 const arrow=graphics.map(p=>p.value).find(g=>config.shapes.some(s=>s.character===g.character&&s.role==='arrows'));const arrowShape=arrow?config.shapes.find(s=>s.character===arrow.character):undefined;
 const arrival=state.labelArrival?curveAt(state.labelArrival.states,state.frame):null;
 const arrayLabel=(name:string)=>{const group=config.nativeGroups.find(g=>g.name===name)!;return <div className="g4l5-vocabulary__array-label" data-array-label={name}><span className="g4l5-vocabulary__array-part">{block(group.blockIds[0])}{block(group.blockIds[1])}</span><span className="g4l5-vocabulary__array-part" data-part="operator">{' '}{block(group.blockIds[2])}{' '}</span><span className="g4l5-vocabulary__array-part">{block(group.blockIds[3])}</span><span className="g4l5-vocabulary__array-part" data-part="array-word">{' '}{group.blockIds.slice(4).map(id=><React.Fragment key={id}>{block(id)}</React.Fragment>)}</span></div>;};
 const arrayCard=(side:'left'|'right')=>{const left=side==='left',rows=left?'text-16':'text-17',columns=left?'text-18':'text-19',equation=left?'text-38':'text-41',graphicVisible=graphics.some(p=>p.value.character===15&&p.value.alpha>0);return <div className="g4l5-vocabulary__card" data-array-card={side}><div className="g4l5-vocabulary__column-label">{block(columns)}</div><svg className="g4l5-vocabulary__diagram" viewBox={left?'-5800 -1510 3820 3630':'-820 -1130 6650 2590'} role="img" aria-label={left?'Three rows and three columns of objects':'Two rows and seven columns of objects'} aria-hidden={!graphicVisible||undefined} style={{visibility:graphicVisible?'visible':'hidden'}}>{drawing(['instructional','highlights'])}</svg><div className="g4l5-vocabulary__row-label">{block(rows)}</div><div className="g4l5-vocabulary__scroll" role="region" aria-label={left?'Three by three array calculation':'Two by seven array calculation'} tabIndex={0}>{arrayLabel(side)}<div className="g4l5-vocabulary__equation">{block(equation)}</div></div></div>;};
 return <section className="g4l5-vocabulary lesson-text-presentation" data-modern-text-page={config.animationId} data-placement-id={config.placementId} data-source-sha={config.sourceSwfSha256} data-frame-domain={config.frameDomain} data-lesson-frame={state.frame} data-lesson-replay={replay} lang="en"><style>{STYLE+(config.methodDiagram?METHOD_STYLE:'')+(config.methodDiagram?.labels.some(label=>label.sourceBaselines)?BASELINE_STYLE:'')+(config.layout==='two-arrays'?ARRAY_LABEL_STYLE:'')+(['foil-method','number-line'].includes(config.layout)?NEXT_STYLE:'')}</style><h2 className="lesson-text-presentation__block lesson-text-presentation__block--title" data-lesson-text-block="title">{tokens('title')}</h2>{config.layout==='lattice-method'?joinedBody(['text-8','text-18']):config.layout==='foil-method'?joinedBody(['text-8','text-17']):['common-method-narrative','array-narrative'].includes(config.layout)?body('text-7'):['lattice-method-narrative','foil-method-narrative','number-line-demonstration'].includes(config.layout)?null:<p className="g4l5-vocabulary__definition lesson-text-presentation__block lesson-text-presentation__block--body" data-lesson-text-block="text-8" aria-hidden={!visible('text-8')||undefined} style={{visibility:visible('text-8')?'visible':'hidden'}}>{tokens('text-8')}</p>}
 {config.layout==='repeated-addition'?<>
   {body('text-28')}
   <div className="g4l5-vocabulary__examples">
    <div className="g4l5-vocabulary__card" aria-label="First multiplication example and repeated addition">{equation('text-16')}{equation('text-33')}</div>
    <div className="g4l5-vocabulary__card" aria-label="Column multiplication example"><div className="g4l5-vocabulary__vertical"><span data-part="top">{block('text-20')}</span><span data-part="operator">{block('text-21')}</span><span data-part="operand">{block('text-17')}</span><span data-part="result">{block('text-19')}</span><span className="g4l5-vocabulary__rule" data-lesson-text-block="text-18" data-source-character="18" role="separator" aria-label="Calculation line" aria-hidden={blocks.get('text-18')!.tokens[0].alpha<=0||undefined} style={{opacity:blocks.get('text-18')!.tokens[0].alpha}}/></div>{equation('text-34')}</div>
    <div className="g4l5-vocabulary__card g4l5-vocabulary__groups" aria-label="Three groups of five">{block('text-22')}<img className="g4l5-vocabulary__dots" src={config.sourceGroupSvg!} alt="Three rows of five green dots" data-source-character="24" aria-hidden={(graphics.find(g=>g.value.character===24)?.value?.alpha??0)<=0||undefined} style={{opacity:graphics.find(g=>g.value.character===24)?.value?.alpha??0}}/>{block('text-23')}{equation('text-35')}</div>
   </div>
  </>:config.layout==='annotated-product'?<div className="g4l5-vocabulary__scroll" role="region" aria-label="Product in a multiplication equation" tabIndex={0}><div className="g4l5-vocabulary__annotated"><span style={{display:'contents'}} data-lesson-text-block="text-16">{blocks.get('text-16')!.tokens.map((_t,i)=>renderToken('text-16',i,{gridColumn:i+1,gridRow:1}))}</span>
   <svg className="g4l5-vocabulary__product-arrow" viewBox="-230 590 270 950" aria-hidden="true" data-source-character={arrow?.character??''} style={{opacity:arrow?.alpha??0}}>{arrowShape?.paths.map((p,i)=><path key={i} d={p.d} fill={nativeColor(p.fill??'none')} stroke={nativeColor(p.stroke??'none')} strokeWidth={p.width??0}/>)}</svg>
   <div className="g4l5-vocabulary__product" data-lesson-text-block="text-18" style={{transform:`scale(${arrival?Math.min(1.25,1+(arrival.matrix[0]-1)*.0625):1})`}}>{tokens('text-18')}</div>
  </div></div>:config.layout==='annotated-factors'?<div className="g4l5-vocabulary__scroll" role="region" aria-label="Factors in a multiplication equation" tabIndex={0}><div className="g4l5-vocabulary__factors"><span style={{display:'contents'}} data-lesson-text-block="text-17">{blocks.get('text-17')!.tokens.map((_t,i)=>renderToken('text-17',i,{gridColumn:i+1,gridRow:1}))}</span><svg className="g4l5-vocabulary__arrow" style={{gridColumn:1}} viewBox="-1650 200 600 1100" aria-hidden="true">{drawing(['arrows','mixedArrowAndOutlinedText'])}</svg><svg className="g4l5-vocabulary__arrow" style={{gridColumn:3}} viewBox="-1100 200 600 1100" aria-hidden="true">{drawing(['arrows','mixedArrowAndOutlinedText'])}</svg><div className="g4l5-vocabulary__factor-label" data-lesson-text-block="text-18" style={{transform:`scale(${arrival?Math.min(1.25,1+(arrival.matrix[0]-1)*.0625):1})`}}>{tokens('text-18')}</div></div></div>:config.layout==='lattice-method'?<>{equation('text-19')}{methodDiagram()}{equation('text-27')}</>:config.layout==='common-method'?<>{equation('text-13-depth-11-generation-2')}{methodDiagram()}{equation('text-27')}{joinedBody(['text-30','text-32'])}</>:config.layout==='foil-method'?<>{equation('text-19')}{equation('text-20')}{foilCalculation()}{methodDiagram()}</>:['number-line','common-method-narrative','lattice-method-narrative','foil-method-narrative','array-narrative','number-line-demonstration'].includes(config.layout)?methodDiagram():<div className="g4l5-vocabulary__arrays">{arrayCard('left')}{arrayCard('right')}</div>}
 </section>;
}

export function getVocabularyTextSnapshot(config:Config,state:SourceStaticCanvasFrameState,context:RuntimeContext):TextPresentationSnapshot{
 const blockers:string[]=[];
 if(state.animationId!==config.animationId||state.sourceSwfSha256!==config.sourceSwfSha256)blockers.push('source-identity-mismatch');
 if(state.status!=='ready')blockers.push(state.blocker??'source-state-not-ready');
 if(state.frameDomain!==config.frameDomain||(context.frameDomain??config.frameDomain)!==config.frameDomain)blockers.push('unsupported-frame-domain');
 if(state.rootFrame!==config.rootFrame||(context.rootFrame!==undefined&&context.rootFrame!==config.rootFrame))blockers.push('unsupported-root-context');
 if(state.scenario!=='source-static-frame'||context.scenario!==state.scenario)blockers.push('unsupported-scenario');
 if(state.language!=='en'||context.lang!=='en')blockers.push('spanish-text-not-source-verified');
 if(!Number.isInteger(context.frame)||context.frame<1||context.frame>config.frameCount||state.frame!==context.frame)blockers.push('source-frame-mismatch');
 if(state.seed!==(context.seed>>>0))blockers.push('source-seed-mismatch');
 if(context.entryStateSha256)blockers.push('capture-uses-source-canvas');
 const teaching=getTeachingState(config,state.frame);
 return{schemaVersion:1,animationId:config.animationId,bindingVersion:config.binding.version,sourceSwfSha256:config.sourceSwfSha256,status:blockers.length?'blocked':'ready',blockers,
 identity:{frame:state.frame,frameDomain:state.frameDomain,rootFrame:state.rootFrame,scenario:state.scenario,language:state.language,seed:state.seed,replay:context.replay??0},suppressedInstances:[],
 blocks:blockers.length?[]:config.binding.blocks.map(b=>{const value=teaching.blocks.find(t=>t.id===b.id)!;return{id:b.id,text:value.tokens.filter(t=>t.alpha>0).map(t=>t.text).join(''),visible:value.tokens.some(t=>t.alpha>0),role:b.role,language:b.language,readingOrder:b.readingOrder};})};
}
export function createVocabularyPresentation(config:Config,getFrameState:(frame:number,context:RuntimeContext)=>SourceStaticCanvasFrameState,FallbackRenderer:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 validateLessonTextBinding(config.binding);
 const getSnapshot=(state:SourceStaticCanvasFrameState,context:RuntimeContext)=>getVocabularyTextSnapshot(config,state,context);
 function Renderer(props:AnimationRendererProps){
  const context:RuntimeContext={...props,frameDomain:props.frameDomain??config.frameDomain};const state=(props.state??getFrameState(props.frame,context))as SourceStaticCanvasFrameState;
  if(getSnapshot(state,context).status!=='ready')return <FallbackRenderer {...props} state={state}/>;
  return <div data-flash-frame-domain={state.frameDomain} data-flash-root-frame={state.rootFrame}><NativeVocabulary key={props.replay??0} config={config} frame={state.frame} replay={props.replay} onLessonHostRequest={props.onLessonHostRequest}/></div>;
 }
 return{schemaVersion:1,binding:config.binding,Renderer,getSnapshot,playbackMode:'once',playbackEndFrameByDomain:{[config.frameDomain]:config.frameCount},reducedMotionFrameByDomain:{[config.frameDomain]:config.frameCount},sourceTimelineAudioCues:config.sourceAudio,...(config.terms.length?{keyTerms:config.keyTerms}:{})};
}
