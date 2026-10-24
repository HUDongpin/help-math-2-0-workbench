import React from 'react';
import source from '../../../../migrations/shared-alg001-l06-p034/native-v1/geometry-v1.json';
import {p034CanOpenGlossary,p034GlossaryState,type P034GlossaryKey}
 from '../alg-l06-p034-glossary-v1';

type Box={left:number;right:number;top:number;bottom:number};
type Transform={scaleX:number;scaleY:number;transX:number;transY:number};
type SourceInstance=(typeof source.instances)[number];
type SourceRun=SourceInstance['runs'][number];
type Definition=(typeof source.definitions)[number];

export interface P034NativeTextProps {
  /** One-indexed sprite-40 frame; root frame 6 instantiates that sprite. */
  frame:number;
  language?:'en'|'es';
  onOpenGlossary?:(key:P034GlossaryKey,trigger:HTMLButtonElement)=>boolean|void;
  rootRef?:React.Ref<HTMLElement>;
}

function box(bounds:Box,transform:Transform):Box {
  const x1=bounds.left*transform.scaleX+transform.transX;
  const x2=bounds.right*transform.scaleX+transform.transX;
  const y1=bounds.top*transform.scaleY+transform.transY;
  const y2=bounds.bottom*transform.scaleY+transform.transY;
  return {left:Math.min(x1,x2),right:Math.max(x1,x2),
    top:Math.min(y1,y2),bottom:Math.max(y1,y2)};
}
function contains(outer:Box,inner:Box):boolean {
  // Twip rounding tolerance follows the maintained P032 native projection.
  return outer.left<=inner.left+2&&outer.right>=inner.right-2&&
    outer.top<=inner.top+2&&outer.bottom>=inner.bottom-2;
}
function activeRun(row:{runs:readonly SourceRun[]},frame:number):SourceRun|undefined {
  return row.runs.find(run=>run.firstFrame<=frame&&frame<=run.lastFrame);
}

export function p034NativeTextState(frame:number) {
  if(!Number.isSafeInteger(frame)||frame<1||frame>source.mainFrameCount)
    throw new RangeError('P034_MAIN_FRAME_OUT_OF_RANGE');
  const graphLive=source.graphPlacement.runs.some(run=>
    run.firstFrame<=frame&&frame<=run.lastFrame&&run.state.alpha>0);
  const masks=source.masks.flatMap(row=>{
    const run=activeRun(row,frame);
    if(!run)return [];
    const sourceBounds=source.maskShapeBoundsTwips[String(row.objectId) as '2'|'10'|'30'];
    return [{row,run,bounds:box(sourceBounds,run.state.transform)}];
  });
  const values=source.instances.flatMap(row=>{
    const run=activeRun(row,row.ownerSpriteId===36?1:frame);
    if(!run||run.state.alpha<=0||(row.ownerSpriteId===36&&!graphLive))return [];
    const definition=source.definitions.find(value=>value.textId===row.objectId);
    if(!definition)throw new Error(`P034_SOURCE_TEXT_MISSING_${row.objectId}`);
    const clipping=row.ownerSpriteId===40?masks.filter(mask=>
      mask.row.depth<row.depth&&row.depth<=mask.row.clipDepth!):[];
    const glyphs=definition.runs.flatMap(sourceRun=>sourceRun.glyphs.map(glyph=>{
      const glyphBounds=box({left:glyph.x,right:glyph.x+glyph.advance,
        top:sourceRun.inkTop,bottom:sourceRun.inkBottom},run.state.transform);
      return {character:glyph.character,bounds:glyphBounds,
        visible:/\s/u.test(glyph.character)||clipping.every(mask=>contains(mask.bounds,glyphBounds))};
    }));
    const partialGlyphCount=glyphs.filter(glyph=>!glyph.visible).length;
    return [{instanceId:row.instanceId,ownerSpriteId:row.ownerSpriteId,
      sourceTextId:row.objectId,role:definition.role,text:definition.text,
      depth:row.depth,alpha:run.state.alpha/256,sourceTransform:run.state.transform,
      definition,partialGlyphCount,complete:partialGlyphCount===0,
      clippingMaskInstanceIds:clipping.map(mask=>mask.row.instanceId)}];
  });
  return {frame,frameDomain:'sprite-40' as const,sourceLanguage:'en' as const,
    activeTextInstances:values,nativeReadyTextInstances:values.filter(v=>v.complete),
    partialSourceTextInstances:values.filter(v=>!v.complete),
    activeMasks:masks.map(({row,bounds})=>({instanceId:row.instanceId,
      depth:row.depth,clipDepth:row.clipDepth,boundsTwips:bounds})),
    canvasSourceGlyphsPreserved:true as const,
    suppressibleSourceTextInstanceIds:[] as string[],
    originalRuntimeAccepted:false as const};
}

/** Responsive companion only. The source Canvas still owns visual glyphs. */
export function P034NativeTextV1({frame,language='en',onOpenGlossary,rootRef}:P034NativeTextProps) {
  const state=p034NativeTextState(frame);
  const ready=state.nativeReadyTextInstances;
  const narrative=ready.filter(v=>v.role!=='graph-label');
  const glossary=p034GlossaryState(frame,state).filter(control=>control.available);
  return <section ref={rootRef} lang="en" aria-label="Original lesson text (English)"
    data-p034-native-text="true" data-p034-frame={frame}
    data-p034-source-sha256={source.source.sha256}
    data-p034-language-policy={language==='es'?'source-en-fallback':'source-en'}
    data-p034-source-canvas-glyphs="preserved"
    data-p034-graph-label-policy="canvas-only-native-inventory-retained"
    data-p034-narrative-instance-ids={narrative.map(v=>v.instanceId).join(',')}
    data-p034-ready-instance-ids={ready.map(v=>v.instanceId).join(',')}
    data-p034-partial-instance-ids={state.partialSourceTextInstances.map(v=>v.instanceId).join(',')}
    data-p034-glossary-button-ids={glossary.map(v=>v.buttonId).join(',')}
    style={{display:'grid',gap:'0.65em',minWidth:0,maxWidth:'100%',padding:'0.75em',
      boxSizing:'border-box',fontFamily:'var(--font-lesson-sans, Arial), sans-serif',
      fontSize:'1rem',lineHeight:1.5,color:'#15344c',overflowWrap:'anywhere'}}>
    {narrative.map(value=><p key={`${value.ownerSpriteId}/${value.instanceId}`}
      data-p034-text-role={value.role} data-source-text-id={value.sourceTextId}
      data-source-text-instance-id={`${value.ownerSpriteId}/${value.instanceId}`}
      data-source-depth={value.depth} data-source-mask-instances={value.clippingMaskInstanceIds.join(',')}
      style={{margin:0,opacity:value.alpha}}>
      {value.definition.runs.map(run=><span key={run.sourceTextId}
        data-source-run-id={run.sourceTextId} data-source-color-rgb={run.colorRgb.join(',')}
        style={run.colorRgb.join(',')==='0,0,204'?{color:'#144fab',fontWeight:650}:undefined}>
        {run.text}</span>)}
    </p>)}
    {glossary.length>0&&<div data-p034-section="source-glossary-controls"
      style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',minWidth:0}}>
      {glossary.map(control=><button key={control.buttonInstanceId} type="button"
        data-p034-glossary-key={control.key} data-source-button-id={control.buttonId}
        data-source-button-instance-id={control.buttonInstanceId}
        data-source-action-sha256={control.sourceActionSha256}
        data-source-label-instance-id={control.label.instanceId}
        data-source-label-run-id={control.label.sourceRunId}
        data-source-label-segment={control.label.segment}
        data-source-button-visual-state="full-own-blue-glyph-and-hit"
        disabled={!onOpenGlossary}
        onClick={event=>{
          const trigger=event.currentTarget;
          const scope=trigger.closest('[data-p034-native-text]') as HTMLElement|null;
          if(p034CanOpenGlossary(control.key,trigger,frame,scope,state))
            onOpenGlossary?.(control.key,trigger);
        }}
        aria-label={language==='es'?`Abrir glosario: ${control.key}`:
          `Open ${control.key} glossary`}
        style={{minHeight:44,border:'1px solid currentColor',borderRadius:'0.4em',
          background:'#edf6fc',color:'inherit',font:'inherit',padding:'0.45em 0.8em',
          cursor:'pointer',maxWidth:'100%',minWidth:0,overflowWrap:'anywhere'}}>
        {control.key} {language==='es'?'glosario':'glossary'}
      </button>)}
    </div>}
  </section>;
}
