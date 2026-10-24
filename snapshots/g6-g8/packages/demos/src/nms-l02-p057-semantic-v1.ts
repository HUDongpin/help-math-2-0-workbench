import {P057_DISPLAY_SOURCE} from './generated/nms-l02-p057-display-list-v1';
import {p057SourceSpriteFrame,type P057StaticLayer} from './timelines/shared-nms002-l02-p057-display-list';
import type {SourceGlossaryControlPage} from './source-glossary-controls';

export const P057_ID='shared-nms002-l02-p057';
export const P057_SOURCE_SHA='9cc456a0af745dc31240b3a6d805e8e115c1c1c2725f851fca8e907a767820aa';
export const P057_LEFT_STRATEGIES=Object.freeze([
 'write an equation and solve it','draw a picture','look for a pattern','systematically guess and check',
]);
export const P057_RIGHT_STRATEGIES=Object.freeze([
 'act it out','make a table','work a simpler problem','work backwards',
]);
/** Exact source-depth occurrences. Enabling only at full opacity is a modern
 * interaction policy; original hit-test reachability remains unverified. */
export const P057_CONTROLS:SourceGlossaryControlPage=Object.freeze({
 animationId:P057_ID,sourceSha256:P057_SOURCE_SHA,frameDomain:'sprite-66',frameCount:328,
 controls:Object.freeze([
  {id:'sprite-66/depth-18/generation-1',entryId:'solve',sourceKeyAttribute:'Solve',characterId:17,firstFrame:12,lastFrameExclusive:329,label:'Solve'},
  {id:'sprite-66/depth-20/generation-1',entryId:'problem',sourceKeyAttribute:'Problem',characterId:18,firstFrame:12,lastFrameExclusive:329,label:'problem'},
  {id:'sprite-66/depth-25/generation-1',entryId:'strategies',sourceKeyAttribute:'Strategies',characterId:25,firstFrame:77,lastFrameExclusive:329,label:'Strategies'},
  {id:'sprite-66/depth-110/generation-1',entryId:'equation',sourceKeyAttribute:'Equation',characterId:60,firstFrame:103,lastFrameExclusive:329,label:'equation'},
  {id:'sprite-66/depth-112/generation-1',entryId:'pattern',sourceKeyAttribute:'Pattern',characterId:61,firstFrame:103,lastFrameExclusive:329,label:'pattern'},
  {id:'sprite-66/depth-114/generation-1',entryId:'table',sourceKeyAttribute:'Table',characterId:62,firstFrame:103,lastFrameExclusive:329,label:'table'},
  {id:'sprite-66/depth-116/generation-1',entryId:'simple-simpler-simplest',sourceKeyAttribute:'Simple / Simpler / Simplest',characterId:63,firstFrame:103,lastFrameExclusive:329,label:'simpler'},
 ]),
});
function alpha(layers:readonly P057StaticLayer[],depth:number,characterId:number){
 const layer=layers.find(row=>row.depth===depth);
 if(!layer)return 0;
 if(layer.characterId!==characterId)throw Error(`P057 source layer mismatch at depth ${depth}`);
 return layer.alpha256/256;
}
/** Text group membership comes from the source XML, with spaces in the four
 * left phrases recovered from fixed x/y glyph placement and checked visually.
 * Every alpha and emphasis is queried from the generated display list. */
export function p057SemanticSnapshot(frame:number){
 if(P057_DISPLAY_SOURCE.animationId!==P057_ID||P057_DISPLAY_SOURCE.sourceSwfSha256!==P057_SOURCE_SHA||
  P057_DISPLAY_SOURCE.frameCount!==328||P057_DISPLAY_SOURCE.rootPlacement.frame!==6)
  throw Error('P057 source identity drift');
 const layers=p057SourceSpriteFrame(frame);
 if(alpha(layers,11,9)!==1||alpha(layers,13,12)!==1)throw Error('P057 persistent source plan missing');
 const glyphs=layers.filter(row=>row.sourceKind==='DefineText'&&row.characterId>=27&&row.characterId<=57);
 if(glyphs.length!==(frame>=97?79:0))throw Error('P057 strategy glyph membership');
 const glyphAlpha=glyphs[0]?.alpha256??0;
 if(glyphs.some(row=>row.alpha256!==glyphAlpha))throw Error('P057 nonuniform strategy group');
 const emphasis=layers.find(row=>row.depth===119);
 const highlightedTerm=emphasis?.characterId===20?'Solve' as const:emphasis?.characterId===21?'Problem' as const:null;
 const finalPromptAlpha=emphasis?.characterId===64?emphasis.alpha256/256:0;
 const readyControls=P057_CONTROLS.controls.filter(control=>{
  const depth=Number(control.id.split('/depth-')[1].split('/')[0]);
  const layer=layers.find(row=>row.depth===depth);
  if(layer&&layer.characterId!==control.characterId)throw Error('P057 button source identity');
  const sourceReady=layer?.alpha256===256;
  if(sourceReady!==(frame>=control.firstFrame))throw Error('P057 button opacity policy drift');
  return sourceReady;
 });
 return Object.freeze({frame,sourceLayerCount:layers.length,
  headingAlpha:alpha(layers,16,14),stepThreeAlpha:alpha(layers,118,19),
  strategiesHeadingAlpha:alpha(layers,23,23),leftStrategiesAlpha:glyphAlpha/256,
  rightStrategiesAlpha:alpha(layers,109,59),finalPromptAlpha,
  firstBulletAlpha:alpha(layers,24,24),secondBulletAlpha:alpha(layers,120,65),
  highlightedTerm,sourceGlyphCount:glyphs.length,
  availableControlIds:Object.freeze(readyControls.map(control=>control.id)),
  sourceTerminalStopPresent:false as const,originalRuntimeEstablished:false as const});
}
