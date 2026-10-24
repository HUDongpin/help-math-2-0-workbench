import React from 'react';
import nativeSource from '../../../../migrations/shared-alg001-l06-p038/native-v1/native-model-v1.json';
import clipSource from '../../../../migrations/shared-alg001-l06-p038/native-v1/source-clip-plan-v1.json';

/** Maintained source-bound companion. Source glyphs stay in Canvas until separate visual calibration. */
type Box = [number, number, number, number];
type Matrix={scaleX:number;scaleY:number;skewX:number;skewY:number;
  transX:number;transY:number};
type Run = {firstFrame:number;lastFrame:number;alphaNumerator:number;
  ratio:number|null;matrixTwips:Matrix;sourceStageBoxPx:Box};
type Instance = {instanceId:string;objectId:number;kind:'text'|'button';
  depth:number;firstFrame:number;lastFrame:number;runs:Run[]};
type MaskRun = {firstFrame:number;lastFrame:number;alphaNumerator:number;
  sourceStageRectPx:Box};
type Mask = {instanceId:string;depth:number;clipDepth:number;
  firstFrame:number;lastFrame:number;runs:MaskRun[]};
type Reveal = {buttonObjectId:number;sourceButtonDepth:number;
  sourceTextObjectId:number;sourceTextDepth:number;
  sourceScriptSha256:string;fullOwnLabelAndHitRanges:number[][];
  firstFullOwnLabelAndHitFrame:number|null};

const source = nativeSource as unknown as {
  frameCount:number;source:{physicalSwf:{sha256:string}};
  root:{placement:{matrixTwips:Matrix}};
  textDefinitions:Record<string,{text:string;localMatrixTwips:Matrix;
    localBoundsTwips:{left:number;right:number;top:number;bottom:number};
    glyphSequence:{character:string;advanceTwips:number}[]}>;
  textSets:{sourceExplanationLines:number[]};
  instances:Instance[];
};
const clip = clipSource as unknown as {
  maskInstances:Mask[];glossaryReveal:Record<string,Reveal>;
  sourceCanvasGlyphsPreserved:boolean;canvasAlignmentCalibrated:boolean;
};
export const P038_GLOSSARY_KEYS =
  ['Table','Output','Input','Equation','Rule','Graph','Function'] as const;
export type P038GlossaryKey = typeof P038_GLOSSARY_KEYS[number];

export interface P038NativeCompanionProps {
  /** One-indexed source sprite-67 frame. */
  frame:number;
  language?:'en'|'es';
  onGlossary?:(key:P038GlossaryKey,trigger:HTMLButtonElement)=>boolean|void;
  rootRef?:React.Ref<HTMLElement>;
}

function runAt<T extends {firstFrame:number;lastFrame:number}>(runs:readonly T[],frame:number) {
  return runs.find(run=>run.firstFrame<=frame&&frame<=run.lastFrame);
}
function contains(outer:Box,inner:Box) {
  return outer[0]<=inner[0]&&outer[1]<=inner[1]&&
    outer[2]>=inner[2]&&outer[3]>=inner[3];
}
function inRanges(frame:number,ranges:readonly number[][]) {
  return ranges.some(([first,last])=>first<=frame&&frame<=last);
}
function sourcePoint(chain:readonly Matrix[],x:number,y:number):[number,number] {
  for(const affine of [...chain].reverse()){
    [x,y]=[affine.scaleX*x+affine.skewX*y+affine.transX,
      affine.skewY*x+affine.scaleY*y+affine.transY];
  }
  return [x/20,y/20];
}
function sourceBox(chain:readonly Matrix[],left:number,right:number,
  top:number,bottom:number):Box {
  const points=[left,right].flatMap(x=>[top,bottom].map(y=>sourcePoint(chain,x,y)));
  return [Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),
    Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
}
function fullSourceGlyphs(instance:Instance,run:Run,
  masks:{sourceStageRectPx:Box;alphaNumerator:number}[]) {
  if(run.alphaNumerator<=0||masks.some(mask=>mask.alphaNumerator<=0))return false;
  if(instance.kind==='button')return masks.every(mask=>
    contains(mask.sourceStageRectPx,run.sourceStageBoxPx));
  const definition=source.textDefinitions[String(instance.objectId)];
  if(!definition)throw new Error(`P038_SOURCE_TEXT_MISSING_${instance.objectId}`);
  let x=0;
  for(const glyph of definition.glyphSequence){
    const start=x;x+=glyph.advanceTwips;
    if(/\s/u.test(glyph.character))continue;
    const box=sourceBox([source.root.placement.matrixTwips,run.matrixTwips,
      definition.localMatrixTwips],start,x,
      definition.localBoundsTwips.top,definition.localBoundsTwips.bottom);
    if(!masks.every(mask=>contains(mask.sourceStageRectPx,box)))return false;
  }
  return true;
}

export function p038NativeTextState(frame:number) {
  if(!Number.isSafeInteger(frame)||frame<1||frame>source.frameCount)
    throw new RangeError('P038_SPRITE_FRAME_OUT_OF_RANGE');
  const masks=clip.maskInstances.flatMap(mask=>{
    const run=runAt(mask.runs,frame);
    return run?[{instanceId:mask.instanceId,depth:mask.depth,
      clipDepth:mask.clipDepth,alphaNumerator:run.alphaNumerator,
      sourceStageRectPx:run.sourceStageRectPx}]:[];
  });
  // Inventory retains zero-alpha, source ratio and replacement/removal timing.
  const inventory=source.instances.flatMap(instance=>{
    const run=runAt(instance.runs,frame);
    if(!run)return [];
    const enclosing=masks.filter(mask=>
      mask.depth<instance.depth&&instance.depth<=mask.clipDepth);
    const fullyUnclipped=fullSourceGlyphs(instance,run,enclosing);
    return [{instanceId:instance.instanceId,objectId:instance.objectId,
      kind:instance.kind,depth:instance.depth,
      sourceAlphaNumerator:run.alphaNumerator,sourceRatio:run.ratio,
      sourceStageBoxPx:run.sourceStageBoxPx,
      sourceMaskInstanceIds:enclosing.map(mask=>mask.instanceId),
      fullyUnclippedSourceGlyphs:fullyUnclipped}];
  });
  const glossary=P038_GLOSSARY_KEYS.map(key=>{
    const binding=clip.glossaryReveal[key];
    if(!binding)throw new Error(`P038_GLOSSARY_BINDING_MISSING_${key}`);
    const button=inventory.find(row=>row.kind==='button'&&
      row.objectId===binding.buttonObjectId);
    const label=inventory.find(row=>row.kind==='text'&&
      row.objectId===binding.sourceTextObjectId&&row.depth===binding.sourceTextDepth);
    return {key,buttonObjectId:binding.buttonObjectId,
      sourceTextObjectId:binding.sourceTextObjectId,
      sourceScriptSha256:binding.sourceScriptSha256,
      buttonInstanceId:button?.instanceId,
      labelInstanceId:label?.instanceId,
      sourceFullOwnLabelAndHit:!!button&&!!label&&
        button.sourceAlphaNumerator>0&&label.sourceAlphaNumerator>0&&
        inRanges(frame,binding.fullOwnLabelAndHitRanges)};
  });
  return {frame,frameDomain:'sprite-67' as const,
    sourceLanguage:'en' as const,sourceSwfSha256:source.source.physicalSwf.sha256,
    sourceCanvasGlyphsPreserved:true as const,
    sourceCanvasGlyphSuppressionIds:[] as number[],
    sourceStageOverlayEnabled:false as const,
    canvasAlignmentCalibrated:false as const,
    sourceInventory:inventory,activeMasks:masks,glossary,
    fullyUnclippedNarrative:inventory.filter(row=>row.kind==='text'&&
      row.fullyUnclippedSourceGlyphs&&
      source.textSets.sourceExplanationLines.includes(row.objectId)),
    originalRuntimeAccepted:false as const};
}

/** The page owner retains source DoHyperLinks/stop behavior and replay cleanup. */
export function p038CanOpenGlossary(key:P038GlossaryKey,
  trigger:HTMLButtonElement,frame:number,scope:HTMLElement|null,
  state=p038NativeTextState(frame)) {
  if(state.frame!==frame||!scope||!scope.contains(trigger)||
     scope.getAttribute('data-p038-frame')!==String(frame)||
     trigger.disabled||trigger.getAttribute('data-p038-glossary-key')!==key)
    return false;
  const control=state.glossary.find(value=>value.key===key);
  return !!control?.sourceFullOwnLabelAndHit&&
    trigger.getAttribute('data-source-button-id')===String(control.buttonObjectId)&&
    trigger.getAttribute('data-source-button-instance-id')===control.buttonInstanceId;
}

/** Responsive semantic companion; no unverified source-stage-to-DOM overlay. */
export function P038NativeTextCompanionV1({frame,language='en',onGlossary,rootRef}
  :P038NativeCompanionProps) {
  const state=p038NativeTextState(frame);
  const ready=state.glossary.filter(value=>value.sourceFullOwnLabelAndHit);
  return <section ref={rootRef} lang="en" aria-label="Original lesson text (English)"
    data-p038-native-companion="true" data-p038-frame={frame}
    data-p038-source-sha256={state.sourceSwfSha256}
    data-p038-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p038-source-canvas-glyphs="preserved"
    data-p038-canvas-alignment="uncalibrated"
    data-p038-glossary-keys={ready.map(row=>row.key).join(',')}
    style={{display:'grid',gap:'0.65em',minWidth:0,maxWidth:'100%',
      boxSizing:'border-box',padding:'0.75em',
      fontFamily:'var(--font-lesson-sans, Arial), sans-serif',
      fontSize:'1rem',lineHeight:1.5,color:'#15344c'}}>
    {state.fullyUnclippedNarrative.map(value=><p key={value.instanceId}
      data-source-text-id={value.objectId}
      data-source-text-instance-id={value.instanceId}
      data-source-depth={value.depth}
      data-source-mask-instances={value.sourceMaskInstanceIds.join(',')}
      style={{margin:0,whiteSpace:'pre-wrap',opacity:value.sourceAlphaNumerator/256}}>
      {source.textDefinitions[String(value.objectId)]?.text}
    </p>)}
    {ready.length>0&&<div data-p038-section="source-glossary-controls"
      style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',minWidth:0}}>
      {ready.map(control=><button key={control.key} type="button"
        data-p038-glossary-key={control.key}
        data-source-button-id={control.buttonObjectId}
        data-source-button-instance-id={control.buttonInstanceId}
        data-source-label-instance-id={control.labelInstanceId}
        data-source-action-sha256={control.sourceScriptSha256}
        data-source-button-visual-state="full-own-label-and-hit-source-clip"
        disabled={!onGlossary}
        onClick={event=>{
          const trigger=event.currentTarget;
          const scope=trigger.closest('[data-p038-native-companion]') as HTMLElement|null;
          if(p038CanOpenGlossary(control.key,trigger,frame,scope,state))
            onGlossary?.(control.key,trigger);
        }}
        aria-label={language==='es'?`Abrir glosario: ${control.key}`:
          `Open ${control.key} glossary`}
        style={{minHeight:44,border:'1px solid currentColor',borderRadius:'0.4em',
          background:'#edf6fc',color:'inherit',font:'inherit',
          padding:'0.45em 0.8em',cursor:'pointer',maxWidth:'100%',
          minWidth:0,overflowWrap:'anywhere'}}>
        {control.key} {language==='es'?'glosario':'glossary'}
      </button>)}
    </div>}
  </section>;
}
