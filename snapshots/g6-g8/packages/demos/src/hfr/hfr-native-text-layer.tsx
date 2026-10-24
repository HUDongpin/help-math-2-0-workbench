import {buildP001ReadableCompanion,P001ReadableCompanionView} from './p001-readable-companion';
import React, {useLayoutEffect, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import type {HfrNativeTextFrame,HfrTextIdentity,HfrTextRuntime,HfrNativeGlossaryIntent} from './hfr-native-text';
import {isHfrNativeTextFrameCurrent,requestHfrNativeGlossary,buildHfrAnchoredGlossaryLabels} from './hfr-native-text';

/** This is actual semantic HTML/SVG, not a hidden text inventory. Only the parent
 * renderer owns the HFR clock. Commit the exact frame before enabling suppression. */
export function HfrNativeTextLayer({frame,runtime,identity,onCommitted,proseHost,labelsHost,onGlossaryActivate}:{frame:HfrNativeTextFrame;runtime:HfrTextRuntime;identity:HfrTextIdentity;proseHost?:HTMLElement|null;labelsHost?:HTMLElement|null;onCommitted?:(frame:HfrNativeTextFrame|null)=>void;onGlossaryActivate?:(intent:HfrNativeGlossaryIntent)=>void}) {
  const portals=proseHost!==undefined||labelsHost!==undefined;
  const companion=frame.readableCompanion?buildP001ReadableCompanion(frame,runtime,identity):null;
  const anchoredGlossary=buildHfrAnchoredGlossaryLabels(frame,runtime,identity);
  const ready=anchoredGlossary!==null&&(!companion||companion.status==='ready')&&(!(frame.styledSentenceDecision||frame.joinedQuestionDecision)||Boolean(frame.styledSentence&&onGlossaryActivate))&&(!frame.vocabularyDecision||Boolean(onGlossaryActivate))&&frame.snapshot.status==='ready'&&isHfrNativeTextFrameCurrent(frame,runtime,identity)&&(!portals||Boolean(proseHost&&labelsHost));
  useLayoutEffect(()=>{onCommitted?.(ready?frame:null);return()=>onCommitted?.(null);},[frame,ready,onCommitted]);
  if(!ready)return null;
  if(frame.styledSentence){const sentence=frame.styledSentence,content=<section lang="en" data-hfr-styled-sentence="source-glossary-sentence-v1" data-hfr-native-source={frame.snapshot.sourceSwfSha256} data-hfr-source-frame={frame.snapshot.identity.frame}
    style={{boxSizing:'border-box',width:'100%',minWidth:0,maxWidth:'100%',padding:'clamp(.75rem,2vw,1.25rem)',background:'#fffdf8'}}>
    <h2 style={{margin:'0 0 .75rem',fontFamily:'var(--lesson-font-display, "Fredoka", sans-serif)',fontSize:'var(--lesson-text-title, 1.75rem)',lineHeight:1.35,color:'rgb(16,63,159)',overflowWrap:'anywhere'}}>{sentence.title}</h2>
    <p data-lesson-text-block={sentence.blockId} style={{margin:0,fontFamily:'var(--lesson-font-body, "Nunito Sans", sans-serif)',fontSize:'var(--lesson-text-body, 1.125rem)',lineHeight:1.6,overflowWrap:'anywhere',whiteSpace:'pre-wrap',opacity:frame.opacityByBlock[sentence.blockId]}}>
      {sentence.tokens.map((token,index)=>{const control=token.glossaryButtonCharacterId===undefined?sentence.controls.find(c=>c.runIndex===token.glossaryRunIndex):sentence.controls.find(c=>c.sourceButtonCharacterId===token.glossaryButtonCharacterId),style={color:`rgba(${token.colorRgba!.slice(0,3).join(',')},${token.colorRgba![3]/255})`,fontWeight:token.fontWeight,...(token.fontScale===undefined?{}:{fontSize:`${token.fontScale}em`})};return control?
        <button key={index} type="button" data-hfr-source-button={control.sourceButtonCharacterId} data-hfr-glossary-entry={control.dictionaryEntryId}
          style={{...style,display:'inline',fontFamily:'inherit',fontSize:'inherit',lineHeight:'inherit',whiteSpace:'normal',background:'transparent',border:0,padding:0,textDecoration:'underline',cursor:'pointer'}}
          onClick={event=>requestHfrNativeGlossary(frame,runtime,identity,control,event.currentTarget,onGlossaryActivate)}>{token.text}</button>:<span key={index} style={style}>{token.text}</span>;})}
    </p>
  </section>;return portals?<>{createPortal(content,proseHost!)}{createPortal(null,labelsHost!)}</>:content;}
  if(companion){const content=<P001ReadableCompanionView snapshot={companion} sourceSha256={frame.snapshot.sourceSwfSha256}/>;return portals?<>{createPortal(content,proseHost!)}{createPortal(null,labelsHost!)}</>:content;}
  const sourceOrderedP012=frame.vocabularyDecision?.animationId==='shared-nms002-l11-p012'&&frame.snapshot.sourceSwfSha256==='6a374691151f299737f718a17921db4d50b68040c6516df1d779279f17a002a5'&&frame.snapshot.identity.frameDomain==='sprite-43';
  const blocks=frame.snapshot.blocks.filter(b=>b.visible),prose:ReactNode[]=[],labels:ReactNode[]=[],anchoredButtons:ReactNode[]=[];
  for(const b of blocks){
    const common={'data-lesson-text-block':b.id,lang:b.language};
    const style={opacity:frame.opacityByBlock[b.id],fontFamily:'var(--lesson-font-body, "Nunito Sans", sans-serif)',fontSize:'var(--lesson-text-body, 1.125rem)',whiteSpace:'pre-wrap' as const};
    if(b.anchor){
      const controls=anchoredGlossary![b.id];
      if(controls){
        const content:ReactNode[]=[],rendered=new Set<number>();
        for(const token of frame.tokensByBlock[b.id]){
          if(token.glossaryButtonCharacterId===undefined){content.push(token.text);continue;}
          if(rendered.has(token.glossaryButtonCharacterId))continue;
          rendered.add(token.glossaryButtonCharacterId);
          const label=controls.find(label=>label.control.sourceButtonCharacterId===token.glossaryButtonCharacterId)!;
          const {bounds,anchor,control}=label,width=bounds.right-bounds.left,height=bounds.bottom-bounds.top;
          content.push(<button key={control.sourceButtonCharacterId} type="button"
            data-hfr-source-button={control.sourceButtonCharacterId} data-hfr-glossary-entry={control.dictionaryEntryId}
            data-hfr-anchored-glossary="source-hit-and-glyph-v1" aria-label={label.text}
            style={{...style,position:'absolute',left:`${bounds.left/anchor.stageWidth*100}%`,top:`${bounds.top/anchor.stageHeight*100}%`,
              width:`${width/anchor.stageWidth*100}%`,height:`${height/anchor.stageHeight*100}%`,minWidth:0,minHeight:0,
              margin:0,padding:0,border:0,background:'transparent',overflow:'visible',pointerEvents:'auto',cursor:'pointer'}}
            onClick={event=>requestHfrNativeGlossary(frame,runtime,identity,control,event.currentTarget,onGlossaryActivate)}>
            <svg aria-hidden="true" focusable="false" width="100%" height="100%" style={{position:'absolute',inset:0,overflow:'visible',pointerEvents:'none'}}>
              <svg x={`${(anchor.x-bounds.left)/width*100}%`} y={`${(anchor.y-bounds.top)/height*100}%`} width={label.sourceGlyphOffsetsTwips?"100%":"1"} height="1" overflow="visible">
                <text x={label.sourceGlyphOffsetsTwips?.map(offset=>`${offset/20/width*100}%`).join(' ')??"0"} y="0" transform={`matrix(${label.linear.join(' ')})`} fill={`rgba(${label.colorRgba.slice(0,3).join(',')},${label.colorRgba[3]/255})`}
                  style={{fontFamily:style.fontFamily,fontSize:`${label.fontSizeRem}rem`}}>{label.text}</text>
              </svg>
            </svg>
          </button>);
        }
        anchoredButtons.push(<span key={b.id} {...common} style={{display:'contents'}}>{content}</span>);
        continue;
      }
      const geometry=frame.geometryByBlock[b.id],tokens=frame.tokensByBlock[b.id];
      // A one-pixel nested viewport locates an unscaled native text origin in the
      // responsive figure. The source's own affine transform stays explicit;
      // the entire 800px scene never shrinks the browser font with a viewBox.
      labels.push(<svg key={b.id} x={`${b.anchor.x/b.anchor.stageWidth*100}%`} y={`${b.anchor.y/b.anchor.stageHeight*100}%`} width={geometry?.sourceGlyphOffsetsTwips?"100%":"1"} height="1" overflow="visible">
        <text key={b.id} {...common} x={geometry?.sourceGlyphOffsetsTwips?.map(offset=>`${offset/20/b.anchor!.stageWidth*100}%`).join(' ')??"0"} y="0" transform={geometry?`matrix(${geometry.linear.join(' ')})`:undefined} style={{...style,fontSize:geometry?`${geometry.fontSizeRem}rem`:style.fontSize}} aria-label={b.text}>
          {tokens?tokens.map((token,i)=><tspan key={i} fill={token.colorRgba?`rgba(${token.colorRgba.slice(0,3).join(',')},${token.colorRgba[3]/255})`:undefined} baselineShift={token.baseline==='superscript'?'super':undefined} fontSize={token.baseline==='superscript'?'65%':undefined}>{token.text}</tspan>):b.text}
        </text>
      </svg>);
    }
    else if(b.role==='title')prose.push(<h2 key={b.id} {...common} style={{...style,fontFamily:'var(--lesson-font-display, "Fredoka", sans-serif)',fontSize:'var(--lesson-text-title, 1.75rem)'}}>{b.text}</h2>);
    else if(b.role==='heading')prose.push(<h3 key={b.id} {...common} style={style}>{b.text}</h3>);
    else if(frame.vocabularyDecision){const tokens=frame.tokensByBlock[b.id]??[];prose.push(<p key={b.id} {...common} style={{...style,lineHeight:1.6}}>{tokens.map((token,index)=>{
      if(token.glossaryButtonCharacterId!==undefined&&index>0&&tokens[index-1].glossaryButtonCharacterId===token.glossaryButtonCharacterId)return null;
      const group=[token];if(token.glossaryButtonCharacterId!==undefined)for(let next=index+1;next<tokens.length&&tokens[next].glossaryButtonCharacterId===token.glossaryButtonCharacterId;next++)group.push(tokens[next]);
      const control=frame.vocabularyControls?.find(c=>c.sourceButtonCharacterId===token.glossaryButtonCharacterId);
      const color=token.colorRgba?`rgba(${token.colorRgba.slice(0,3).join(',')},${token.colorRgba[3]/255})`:undefined;
      return control?<button key={index} type="button" data-hfr-source-button={control.sourceButtonCharacterId} data-hfr-glossary-entry={control.dictionaryEntryId}
        style={{color,fontFamily:'inherit',fontSize:'inherit',lineHeight:'inherit',minHeight:'2.75rem',verticalAlign:'baseline',whiteSpace:'normal',background:'transparent',border:0,padding:0,textDecoration:'underline',cursor:'pointer'}}
        onClick={event=>requestHfrNativeGlossary(frame,runtime,identity,control,event.currentTarget,onGlossaryActivate)}>{group.length===1?token.text:group.map((part,partIndex)=><span key={partIndex} style={{color:part.colorRgba?`rgba(${part.colorRgba.slice(0,3).join(',')},${part.colorRgba[3]/255})`:undefined}}>{part.text}</span>)}</button>:<span key={index} style={{color}}>{token.text}</span>;
    })}</p>);}
    else prose.push(<p key={b.id} {...common} style={style}>{b.text}</p>);
  }
  if(portals)return <>
    {createPortal(<div data-hfr-native-text="candidate" data-hfr-native-source={frame.snapshot.sourceSwfSha256} className="hfr-native-text-prose">{prose}</div>,proseHost!)}
    {createPortal(<>{sourceOrderedP012?anchoredButtons:null}<svg className="hfr-native-text-labels" data-hfr-native-text="candidate" data-hfr-native-source={frame.snapshot.sourceSwfSha256} width="100%" height="100%" focusable="false" style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>{labels}</svg>{sourceOrderedP012?null:anchoredButtons}</>,labelsHost!)}
  </>;
  return <div data-hfr-native-text="candidate" data-hfr-native-source={frame.snapshot.sourceSwfSha256} data-hfr-content-language={blocks[0]?.language??'en'} data-hfr-route-language={identity.lang}>
    <div className="hfr-native-text-prose">{prose}</div>
    {sourceOrderedP012?anchoredButtons:null}
    {labels.length?<svg className="hfr-native-text-labels" width="100%" height="100%" focusable="false" style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>{labels}</svg>:null}
    {sourceOrderedP012?null:anchoredButtons}
  </div>;
}
