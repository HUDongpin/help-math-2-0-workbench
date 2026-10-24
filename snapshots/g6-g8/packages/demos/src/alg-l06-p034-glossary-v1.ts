import source from '../../../migrations/shared-alg001-l06-p034/native-v1/geometry-v1.json';
import type {p034NativeTextState} from './native-text/alg-l06-p034-native';

export type P034GlossaryKey='Vertical-line test'|'Graph'|'Function'|'Vertical'|'Line';
type NativeState=ReturnType<typeof p034NativeTextState>;
type Box={left:number;right:number;top:number;bottom:number};
type Transform={scaleX:number;scaleY:number;transX:number;transY:number};
const KEYS:readonly P034GlossaryKey[]=['Vertical-line test','Graph','Function','Vertical','Line'];
const runAt=<T extends {firstFrame:number;lastFrame:number}>(runs:readonly T[],frame:number)=>
 runs.find(run=>run.firstFrame<=frame&&frame<=run.lastFrame);
const box=(bounds:Box,t:Transform):Box=>{
 const x1=bounds.left*t.scaleX+t.transX,x2=bounds.right*t.scaleX+t.transX;
 const y1=bounds.top*t.scaleY+t.transY,y2=bounds.bottom*t.scaleY+t.transY;
 return {left:Math.min(x1,x2),right:Math.max(x1,x2),
  top:Math.min(y1,y2),bottom:Math.max(y1,y2)};
};
const contains=(outer:Box,inner:Box)=>outer.left<=inner.left+2&&
 outer.right>=inner.right-2&&outer.top<=inner.top+2&&outer.bottom>=inner.bottom-2;
const overlap=(a:Box,b:Box)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*
 Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
const area=(a:Box)=>(a.right-a.left)*(a.bottom-a.top);
const union=(boxes:Box[]):Box=>({left:Math.min(...boxes.map(x=>x.left)),
 right:Math.max(...boxes.map(x=>x.right)),top:Math.min(...boxes.map(x=>x.top)),
 bottom:Math.max(...boxes.map(x=>x.bottom))});

/** All ten physical placements remain distinct; an unrevealed blue label
 * cannot be enabled by a present but invisible source button. The hit shape
 * overlap is a source-bounds correspondence, not Flash-pixel hit parity. */
export function p034GlossaryState(frame:number,native:NativeState){
 if(native.frame!==frame||native.frameDomain!==source.frameDomain)
  throw Error('P034_GLOSSARY_NATIVE_FRAME_MISMATCH');
 return source.glossary.map(control=>{
  const key=control.key as P034GlossaryKey;
  if(!KEYS.includes(key))throw Error('P034_GLOSSARY_UNKNOWN_SOURCE_KEY');
  const buttonRun=runAt(control.runs,frame);
  const label=native.activeTextInstances.find(x=>x.instanceId===control.label.instanceId&&
   x.ownerSpriteId===40&&x.sourceTextId===control.label.textId&&
   x.depth===control.label.depth);
  const definition=source.definitions.find(x=>x.textId===control.label.textId);
  const sourceRun=definition?.runs.find(x=>x.sourceTextId===control.label.sourceRunId);
  if(!sourceRun)throw Error('P034_GLOSSARY_SOURCE_RUN_MISSING');
  const glyphs=sourceRun.glyphs.slice(control.label.glyphStart,
   control.label.glyphStart+control.label.glyphCount);
  if(glyphs.map(x=>x.character).join('')!==control.label.segment||
   glyphs.length!==control.label.glyphCount||
   sourceRun.colorRgb.join(',')!=='0,0,204')
   throw Error('P034_GLOSSARY_SOURCE_LABEL_MISMATCH');
  const ink=label?glyphs.map(glyph=>box({left:glyph.x,right:glyph.x+glyph.advance,
   top:sourceRun.inkTop,bottom:sourceRun.inkBottom},label.sourceTransform)):[];
  const clipping=label?native.activeMasks.filter(mask=>mask.depth<label.depth&&
   label.depth<=mask.clipDepth):[];
  const labelComplete=ink.length===glyphs.length&&
   ink.every(glyph=>clipping.every(mask=>contains(mask.boundsTwips,glyph)));
  const inner=control.hitTransform,outer=buttonRun?.state.transform;
  const hitBounds=outer?box(box(control.hitShapeBoundsTwips,inner),outer):null;
  const labelBounds=ink.length?union(ink):null;
  const sourceHitAligned=!!hitBounds&&!!labelBounds&&
   overlap(hitBounds,labelBounds)/area(labelBounds)>=0.75;
  const available=!!buttonRun&&buttonRun.state.alpha>0&&!!label&&label.alpha>0&&
   labelComplete&&sourceHitAligned;
  return {key,buttonId:control.buttonId,buttonInstanceId:control.buttonInstanceId,
   depth:control.depth,sourceActionSha256:control.actionSha256,
   label:control.label,buttonPresent:!!buttonRun&&buttonRun.state.alpha>0,
   labelComplete,sourceHitAligned,hitBounds,available};
 });
}

/** The live trigger must belong to this exact native companion instance. */
export function p034CanOpenGlossary(key:P034GlossaryKey,trigger:HTMLButtonElement,
 frame:number,scope:HTMLElement|null,native:NativeState):boolean{
 if(!scope||!scope.isConnected||!trigger.isConnected||trigger.disabled||
  !scope.contains(trigger)||scope.getAttribute('data-p034-frame')!==String(frame)||
  trigger.getAttribute('data-p034-glossary-key')!==key)return false;
 return p034GlossaryState(frame,native).some(control=>control.available&&
  control.key===key&&
  trigger.getAttribute('data-source-button-id')===String(control.buttonId)&&
  trigger.getAttribute('data-source-button-instance-id')===control.buttonInstanceId&&
  trigger.getAttribute('data-source-action-sha256')===control.sourceActionSha256&&
  trigger.getAttribute('data-source-label-instance-id')===control.label.instanceId&&
  trigger.getAttribute('data-source-label-run-id')===control.label.sourceRunId&&
  trigger.getAttribute('data-source-label-segment')===control.label.segment&&
  trigger.getAttribute('data-source-button-visual-state')==='full-own-blue-glyph-and-hit');
}
