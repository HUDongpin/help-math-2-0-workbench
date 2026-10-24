/** Source-only P035 native companion draft. Canvas remains the visual glyph owner. */
import React from 'react';
import geometryJson from '../../../migrations/shared-alg001-l06-p035/native-v1/native-geometry-v1.json';

type Matrix={scaleX:number;scaleY:number;skewX:number;skewY:number;transX:number;transY:number};
type Box={left:number;right:number;top:number;bottom:number};
type Glyph={character:string;x:number;advance:number};
type Definition={id:number;kind:'static'|'edit';role:string;text:string;boundsTwips:Box;
 definitionTransform?:Matrix;runs:{sourceRunId:string;text:string;inkTop:number;inkBottom:number;glyphs:Glyph[]}[]};
type Run={firstFrame:number;lastFrame:number;state:{matrix:Matrix;alphaFactor:number;alphaTerm:number}};
type Instance={instanceId:string;owner:string;objectId:number;depth:number;name:string|null;
 clipDepth:number|null;runs:Run[]};
type Timeline={frameCount:number;instances:Instance[]};
type Shape={objectId:number;boundsTwips:Box;verticesTwips:number[][]};
type Choice={buttonName:string;buttonId:number;buttonInstanceId:string;sourceHandler:'right'|'wrong';
 letter:{text:string;textId:number;instanceId:string};value:{text:string;textId:number;instanceId:string};
 actionSha256:string};
type Geometry={animationId:string;source:{sha256:string};mainFrameCount:number;
 rootMainPlacement:string;definitions:Definition[];timelines:Record<string,Timeline>;
 maskShapes:Record<string,Shape>;feedbackSpriteIds:number[];quizChoices:Choice[];
 feedbackDynamicTextSource:{firstWrong:string;secondWrong:string;sourceProperty:string};
 canvasSourceGlyphsPreserved:true;originalRuntimeAccepted:false};
const source=geometryJson as unknown as Geometry;
const identity:Matrix={scaleX:1,scaleY:1,skewX:0,skewY:0,transX:0,transY:0};
const feedbackSet=new Set(source.feedbackSpriteIds);
const definitions=new Map(source.definitions.map(d=>[d.id,d]));

function compose(a:Matrix,b:Matrix):Matrix{
 return {scaleX:a.scaleX*b.scaleX+a.skewX*b.skewY,
  skewX:a.scaleX*b.skewX+a.skewX*b.scaleY,
  skewY:a.skewY*b.scaleX+a.scaleY*b.skewY,
  scaleY:a.skewY*b.skewX+a.scaleY*b.scaleY,
  transX:a.scaleX*b.transX+a.skewX*b.transY+a.transX,
  transY:a.skewY*b.transX+a.scaleY*b.transY+a.transY};
}
function point(m:Matrix,x:number,y:number):[number,number]{
 return [m.scaleX*x+m.skewX*y+m.transX,m.skewY*x+m.scaleY*y+m.transY];
}
function corners(box:Box,m:Matrix):[number,number][]{
 return [[box.left,box.top],[box.right,box.top],[box.right,box.bottom],
  [box.left,box.bottom]].map(([x,y])=>point(m,x,y));
}
function onSegment([x,y]:[number,number],[ax,ay]:[number,number],
 [bx,by]:[number,number]):boolean{
 const cross=(x-ax)*(by-ay)-(y-ay)*(bx-ax);
 return Math.abs(cross)<=1e-5&&x>=Math.min(ax,bx)-1e-5&&
  x<=Math.max(ax,bx)+1e-5&&y>=Math.min(ay,by)-1e-5&&y<=Math.max(ay,by)+1e-5;
}
function insidePolygon(pointValue:[number,number],vertices:[number,number][]):boolean{
 let inside=false;
 const [x,y]=pointValue;
 for(let i=0,j=vertices.length-1;i<vertices.length;j=i++){
  const a=vertices[j],b=vertices[i];
  if(onSegment(pointValue,a,b))return true;
  if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
function live(model:Timeline,frame:number){
 return model.instances.flatMap(row=>{
  const run=row.runs.find(r=>r.firstFrame<=frame&&frame<=r.lastFrame);
  return run?[{row,state:run.state}]:[];
 });
}
type Mask={instanceId:string;owner:string;depth:number;clipDepth:number;
 vertices:[number,number][]};
export type P035TextInstance={instanceId:string;owner:string;sourceTextId:number;
 sourceText:string;visibleText:string;role:string;depth:number;alpha:number;
 sourceRunIds:string[];clippingMaskInstanceIds:string[];complete:boolean;
 sourceLanguage:'en';sourceBoundsTwips:Box};

/** A feedback branch is explicit; main frame 145 never advances with its clip. */
export function p035NativeTextState(mainFrame:number,options:{
 feedbackSpriteId?:number;feedbackFrame?:number;wrongTryCount?:0|1}={}){
 if(!Number.isSafeInteger(mainFrame)||mainFrame<1||mainFrame>source.mainFrameCount)
  throw new RangeError('P035_MAIN_FRAME_OUT_OF_RANGE');
 const feedbackId=options.feedbackSpriteId;
 if(feedbackId!==undefined&&(!feedbackSet.has(feedbackId)||mainFrame!==145||
  !Number.isSafeInteger(options.feedbackFrame)||options.feedbackFrame!<1||
  options.feedbackFrame!>source.timelines[String(feedbackId)].frameCount))
  throw new RangeError('P035_FEEDBACK_DOMAIN_OR_FRAME');
 if(options.wrongTryCount!==undefined&&!([80,95,126].includes(feedbackId??-1)&&
  [0,1].includes(options.wrongTryCount)))throw new RangeError('P035_WRONG_FEEDBACK_TRY');
 const root=live(source.timelines.root,6).find(x=>x.row.instanceId===source.rootMainPlacement);
 if(!root)throw Error('P035_ROOT_MAIN_PLACEMENT_LOST');
 const result:P035TextInstance[]=[];
 const activeMasks:Mask[]=[];
 const visits=new Set<string>();
 function addText(instanceId:string,owner:string,depth:number,def:Definition,
  transform:Matrix,alpha:number,masks:Mask[],dynamicValue?:string){
  const local=compose(transform,def.definitionTransform??identity);
  const sourceText=dynamicValue??def.text;
  let visibleText='';
  let complete=true;
  if(def.kind==='edit'){
   const shown=corners(def.boundsTwips,local).every(c=>masks.every(m=>insidePolygon(c,m.vertices)));
   visibleText=shown?sourceText:'';
   complete=shown;
  }else{
   for(const run of def.runs)for(const glyph of run.glyphs){
    const glyphBox={left:Math.min(glyph.x,glyph.x+glyph.advance),
     right:Math.max(glyph.x,glyph.x+glyph.advance),
     top:run.inkTop,bottom:run.inkBottom};
    const shown=corners(glyphBox,local).every(c=>
     masks.every(m=>insidePolygon(c,m.vertices)));
    visibleText+=shown?glyph.character:'';
    complete&&=shown;
   }
  }
  result.push({instanceId,owner,sourceTextId:def.id,sourceText,
   visibleText,role:def.role,depth,alpha,
   sourceRunIds:def.runs.map(r=>r.sourceRunId),
   clippingMaskInstanceIds:masks.map(m=>m.instanceId),complete,
   sourceLanguage:'en',sourceBoundsTwips:def.boundsTwips});
 }
 function walk(owner:string,frame:number,parent:Matrix,parentAlpha:number,
  ancestors:Mask[],path:string){
  const visit=`${path}/${owner}`;
  if(visits.has(visit))throw Error('P035_NESTED_SPRITE_CYCLE');
  visits.add(visit);
  const items=live(source.timelines[owner],frame);
  const masks:Mask[]=items.flatMap(({row,state})=>{
   if(row.clipDepth===null)return [];
   const shape=source.maskShapes[String(row.objectId)];
   if(!shape)throw Error(`P035_MASK_SHAPE_MISSING_${row.objectId}`);
   const m=compose(parent,state.matrix);
   return [{instanceId:`${path}/${row.instanceId}`,owner,depth:row.depth,
    clipDepth:row.clipDepth,vertices:shape.verticesTwips.map(([x,y])=>point(m,x,y))}];
  });
  activeMasks.push(...masks);
  for(const {row,state} of items){
   if(row.clipDepth!==null)continue;
   const alpha=parentAlpha*Math.min(1,Math.max(0,(state.alphaFactor+state.alphaTerm)/256));
   if(alpha<=0)continue;
   const transform=compose(parent,state.matrix);
   const applied=[...ancestors,...masks.filter(m=>m.depth<row.depth&&row.depth<=m.clipDepth)];
   const def=definitions.get(row.objectId);
   if(def){
    const dynamic=def.kind==='edit'&&[78,90,116].includes(def.id)&&
     options.wrongTryCount!==undefined?
      (options.wrongTryCount===0?source.feedbackDynamicTextSource.firstWrong:
       source.feedbackDynamicTextSource.secondWrong):undefined;
    addText(`${path}/${row.instanceId}`,owner,row.depth,def,transform,alpha,applied,dynamic);
   }else if(source.timelines[String(row.objectId)]){
    if(feedbackSet.has(row.objectId)&&row.objectId!==feedbackId)continue;
    const nestedFrame=feedbackSet.has(row.objectId)?options.feedbackFrame!:1;
    walk(String(row.objectId),nestedFrame,transform,alpha,applied,
     `${path}/${row.instanceId}`);
   }else{
    // Static text in authored button records, notably the feedback Close label.
    for(const attachment of geometryJson.buttonTextAttachments.filter(
     a=>a.buttonId===row.objectId&&a.up)){
     const buttonText=definitions.get(attachment.objectId);
     if(buttonText)addText(`${path}/${row.instanceId}/button-depth-${attachment.depth}`,
      owner,row.depth,buttonText,compose(transform,attachment.matrix),alpha,applied);
    }
   }
  }
  visits.delete(visit);
 }
 walk('227',mainFrame,root.state.matrix,1,[],`root-frame-6/${root.row.instanceId}`);
 const unique=new Set(result.map(r=>r.instanceId));
 if(unique.size!==result.length)throw Error('P035_TEXT_INSTANCE_COLLISION');
 const bySuffix=new Map(result.map(r=>[r.instanceId.split('/').slice(-3).join('/'),r]));
 const choices=mainFrame===145&&feedbackId===undefined?source.quizChoices.flatMap(choice=>{
  const letter=bySuffix.get(choice.letter.instanceId);
  const value=bySuffix.get(choice.value.instanceId);
  if(!letter||!value||letter.visibleText!==choice.letter.text||
   value.visibleText!==choice.value.text||!letter.complete||!value.complete)return [];
  const button=live(source.timelines['227'],145).find(x=>
   x.row.instanceId===choice.buttonInstanceId&&x.state.alphaFactor>0);
  if(!button)return [];
  return [{buttonName:choice.buttonName,buttonId:choice.buttonId,
   buttonInstanceId:choice.buttonInstanceId,letterTextInstanceId:letter.instanceId,
   valueTextInstanceId:value.instanceId,letter:letter.visibleText,value:value.visibleText,
   sourceHandler:choice.sourceHandler,actionSha256:choice.actionSha256}];
 }):[];
 return {animationId:source.animationId,mainFrame,frameDomain:'sprite-227' as const,
  feedback:feedbackId===undefined?null:{spriteId:feedbackId,frame:options.feedbackFrame!},
  sourceLanguage:'en' as const,allTextInstances:result,
  prose:result.filter(r=>r.role==='source-prose'&&r.visibleText),
  diagramLabels:result.filter(r=>r.role==='source-diagram-label'&&r.visibleText),
  feedbackText:result.filter(r=>r.role.startsWith('feedback-')&&r.visibleText),
  choices,activeMasks:activeMasks.map(m=>({instanceId:m.instanceId,owner:m.owner,
   depth:m.depth,clipDepth:m.clipDepth})),
  canvasSourceGlyphsPreserved:true as const,
  canvasInstanceSuppressionSupported:false as const,
  sourceMaskProjection:'conservative-full-glyph-polygon-containment' as const,
  originalRuntimeAccepted:false as const,audioAccepted:false as const,
  currentJsRegistered:false as const};
}

/** Readable adjunct; no source Canvas glyph is removed or replaced. */
export function P035NativeCompanionDraft({mainFrame,language='en',feedbackSpriteId,
 feedbackFrame,wrongTryCount,onChoose}:{mainFrame:number;language?:'en'|'es';
 feedbackSpriteId?:number;feedbackFrame?:number;wrongTryCount?:0|1;
 onChoose?:(choice:{buttonName:string;sourceHandler:'right'|'wrong'})=>void}){
 const state=p035NativeTextState(mainFrame,{feedbackSpriteId,feedbackFrame,wrongTryCount});
 return <section lang="en" aria-label="Original lesson text (English)"
  data-p035-native-draft="source-only" data-p035-source-sha256={source.source.sha256}
  data-p035-frame-domain="sprite-227" data-p035-main-frame={mainFrame}
  data-p035-source-language="en"
  data-p035-language-policy={language==='es'?'source-en-fallback':'source-en'}
  data-p035-canvas-source-glyphs="preserved"
  data-p035-mask-policy={state.sourceMaskProjection}>
  {state.prose.map(row=><p key={row.instanceId} data-source-instance-id={row.instanceId}
   data-source-text-id={row.sourceTextId} data-source-role="prose"
   data-source-mask-instances={row.clippingMaskInstanceIds.join(',')}>{row.visibleText}</p>)}
  {state.choices.length>0&&<fieldset data-p035-section="source-quiz-choices">
   <legend>Source question choices</legend>
   {state.choices.map(choice=><button key={choice.buttonInstanceId} type="button"
    data-source-button-instance-id={choice.buttonInstanceId}
    data-source-letter-instance-id={choice.letterTextInstanceId}
    data-source-value-instance-id={choice.valueTextInstanceId}
    data-source-handler={choice.sourceHandler} disabled={!onChoose}
    onClick={()=>onChoose?.({buttonName:choice.buttonName,
      sourceHandler:choice.sourceHandler})}>
    {choice.letter}. {choice.value}</button>)}
  </fieldset>}
  {state.feedbackText.map(row=><p key={row.instanceId}
   data-source-instance-id={row.instanceId} data-source-text-id={row.sourceTextId}
   data-source-role="feedback" data-source-mask-instances={row.clippingMaskInstanceIds.join(',')}>
   {row.visibleText}</p>)}
  {state.diagramLabels.length>0&&<details data-p035-section="source-diagram-label-inventory">
   <summary>Source diagram labels</summary>
   {state.diagramLabels.map(row=><span key={row.instanceId}
    data-source-instance-id={row.instanceId} data-source-text-id={row.sourceTextId}
    data-source-role="diagram-label" data-source-mask-instances={row.clippingMaskInstanceIds.join(',')}>
    {row.visibleText}</span>)}
  </details>}
 </section>;
}
