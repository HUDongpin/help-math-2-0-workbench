'use client';
import React from 'react';
import {NMS_L02_P001_IR as IR} from './generated/nms-l02-p001-source-ir-v1';
import {p001Multiply,type P001FrameState} from './nms-l02-p001-timeline-v1';
import {p001TextSnapshot} from './nms-l02-p001-text-v1';
import {LessonTextPresentation} from './lesson-text-presentation';
const h=React.createElement;
function SourceMath({id}:{id:string}){
 const n=(value:string)=>h('mn',null,value),o=(value:string)=>h('mo',null,value),f=(a:string,b:string)=>h('mfrac',null,n(a),n(b));
 const parts=id==='fractions'?[f('1','2'),o(','),f('1','5'),o(','),n('1'),f('2','3')]:id==='number-forms'?[n('3'),o(','),n('3.0'),o(','),n('3.0'),o('×'),h('msup',null,n('10'),n('2')),o(','),h('mi',null,'π'),o(','),h('msqrt',null,n('2'))]:[n('0'),o(','),n('−10'),o(','),n('−4.5')];
 const label=id==='fractions'?'one half, one fifth, one and two thirds':id==='number-forms'?'three, three point zero, three point zero times ten squared, pi, square root of two':'zero, negative ten, negative four point five';
 return h('math',{xmlns:'http://www.w3.org/1998/Math/MathML',display:'inline',displaystyle:'true','aria-label':label},h('mrow',null,...parts));
}
/** The native scene preserves the extracted transforms and source alpha. Its
 * readable semantic counterpart is driven by the same source-visible text set.
 * Tiny/translucent background numerals are illustration, never the only readable math. */
export function NmsL2P001Presentation({state,uiLanguage='en'}:{state:P001FrameState;uiLanguage?:'en'|'es'}){
 const snapshot=p001TextSnapshot(state),blocks=snapshot.blocks.filter(b=>b.visible),heading={...snapshot,blocks:snapshot.blocks.filter(b=>b.id==='course-title'||b.id==='introduction')};
 const scene=<svg className="nms-l02-p001__scene" viewBox="0 0 800 600" aria-hidden="true" focusable="false">
  {state.nodes.map(node=>{if(node.alpha===0||[100,101].includes(node.characterId))return null;const shape=IR.shapes.find(s=>s.characterId===node.characterId),text=IR.texts.find(t=>t.characterId===node.characterId);
   if(shape)return <g key={node.instancePath} transform={`matrix(${node.matrix.join(' ')})`} opacity={node.alpha}><image href={shape.svgDataUri} x={shape.x} y={shape.y} width={shape.width} height={shape.height}/></g>;
   if(text){const matrix=p001Multiply(node.matrix,text.matrix);return <g key={node.instancePath} transform={`matrix(${matrix.join(' ')})`} opacity={node.alpha}>
    {text.glyphs.map((glyph,index)=><text key={index} x={glyph.x} y={glyph.y} fontSize={glyph.size} fontWeight={glyph.bold?700:500} fill={`rgba(${glyph.color.slice(0,3).join(',')},${glyph.color[3]/255})`} fontFamily="HELP Math Nunito Sans, sans-serif">{glyph.text}</text>)}
   </g>;}return null;})}
 </svg>;
 return <section className="nms-l02-p001 lesson-text-presentation" data-p001-frame={state.frame} data-p001-domain={state.frameDomain} data-p001-root-frame={state.rootFrame} data-p001-text-status={snapshot.status} lang={uiLanguage}>
  {uiLanguage==='es'&&<p className="nms-l02-p001__fallback">Texto original en inglés.</p>}
  <LessonTextPresentation template="complex-figure" snapshot={heading} figure={scene} figureReadingOrder={2} figureLabel="Animated mathematical examples"/>
  <div className="nms-l02-p001__examples" lang="en">
   {blocks.filter(b=>['fractions','decimal-list','number-forms'].includes(b.id)).map(block=><div key={block.id} className="nms-l02-p001__math" data-lesson-text-block={block.id}><SourceMath id={block.id}/></div>)}
  </div>
  <div className="nms-l02-p001__ambient" lang="en">{blocks.filter(b=>b.id.startsWith('ambient-')).map(block=><span key={block.id} data-lesson-text-block={block.id}>{block.text}</span>)}</div>
 </section>;
}
