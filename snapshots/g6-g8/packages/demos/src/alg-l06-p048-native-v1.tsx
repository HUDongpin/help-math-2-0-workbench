import React from 'react';
import bindings from '../../../migrations/shared-alg001-l06-p048/native-v1/native-bindings-v2.json';
import type {P048Choice,P048Event,P048State} from './alg-l06-p048-state-v1';

export interface P048NativeProps {
  state:P048State;language?:'en'|'es';
  onEvent?:(event:P048Event,trigger?:HTMLButtonElement)=>void;
}
const buttonStyle:React.CSSProperties={font:'inherit',color:'inherit',minHeight:44,
  padding:'.55em .8em',border:'1px solid #8b9dbb',borderRadius:'.35em',
  background:'#f3f7fc',textAlign:'left',overflowWrap:'anywhere',maxWidth:'100%'};

export function P048SourceGraph({frame=224}:{frame?:number}){
  const graph=bindings.graph;
  const highlight=graph.highlightPlacements.some(x=>frame>=x.firstFrame&&frame<=x.lastFrame);
  const dx=-graph.plotPlacementMatrixTwips.transX/20;
  const dy=-graph.plotPlacementMatrixTwips.transY/20;
  return <svg role="img" aria-label={graph.description}
    data-p048-source-graph="145+157" data-p048-highlight={highlight}
    viewBox={graph.viewBox.join(' ')}
    style={{display:'block',width:'100%',maxWidth:'40rem',height:'auto',
      boxSizing:'border-box',border:'1px solid #cbd5e1',background:'#fff'}}>
    <title>{graph.description}</title>
    {graph.paths.filter(x=>x.shapeId!==347||highlight).map(x=><path
      key={`${x.shapeId}:${x.pathIndex}`} d={x.d} fill={x.fill}
      fillRule={x['fill-rule'] as 'evenodd'|'nonzero'|undefined}
      stroke={x.stroke} strokeWidth={x['stroke-width']}
      strokeLinecap={x['stroke-linecap'] as 'round'|'butt'|'square'|undefined}
      strokeLinejoin={x['stroke-linejoin'] as 'round'|'miter'|'bevel'|undefined}
      transform={x.shapeId===347?`translate(${dx} ${dy})`:undefined}
      data-source-shape-id={x.shapeId}/>) }
    {graph.labels.map(x=><text key={x.textId} data-source-text-id={x.textId}
      x={(x.boxPx[0]!+x.boxPx[2]!)/2} y={x.boxPx[3]!-2}
      textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="14" fill="#132d50">
      {x.text}
    </text>)}
  </svg>;
}

export function p048VisibleGlossary(state:P048State){
  return bindings.glossary.filter(x=>x.ownerSpriteId===139?
    state.phase==='nmh-popup'&&state.nmhPopupVisible:
    ['prequiz','quiz-held','postquiz'].includes(state.phase)&&
      state.mainFrame>=x.firstFrame&&state.mainFrame<=x.lastFrame);
}

export function P048NativeV1({state,language='en',onEvent}:P048NativeProps){
  const send=(type:string,fields:Partial<P048Event>={},trigger?:HTMLButtonElement)=>
    onEvent?.({type,epoch:state.epoch,quizGeneration:state.quizGeneration,...fields},trigger);
  const en=language==='en';
  const visibleOptions=(Object.keys(bindings.options) as P048Choice[]).filter(letter=>
    bindings.options[letter].visibleRanges.some(([first,last])=>state.mainFrame>=first!&&state.mainFrame<=last!));
  const quiz=visibleOptions.length>0;
  const wrong=state.feedback?.kind==='wrong'&&state.feedback.frame>=16&&
    ['wrong-feedback-playing','wrong-feedback-held'].includes(state.phase);
  const glossary=p048VisibleGlossary(state);
  return <section data-p048-native-v1="true" data-p048-phase={state.phase}
    data-p048-frame={state.mainFrame} data-p048-epoch={state.epoch}
    data-p048-source-sha256={bindings.sourceSha256}
    aria-label={en?'Machine efficiency question':'Pregunta sobre la eficiencia de una máquina'}
    style={{display:'grid',gap:'.8em',fontSize:'1rem',lineHeight:1.5,minWidth:0,
      width:'100%',maxWidth:'100%',boxSizing:'border-box',padding:'.75em',color:'#203a60'}}>
    {state.mainFrame>=2&&<>
      <p lang="en" data-source-text-id="144" style={{margin:0}}>{bindings.question.text}</p>
      <P048SourceGraph frame={state.mainFrame}/>
    </>}
    {quiz&&<div role="group" aria-label={en?'Answer choices':'Opciones de respuesta'}
      style={{display:'grid',gap:'.5em',minWidth:0}}>
      {visibleOptions.map(letter=>{
        const row=bindings.options[letter];
        return <button key={letter} type="button" lang="en" style={buttonStyle}
          data-source-choice={letter} data-source-instance={row.instance}
          data-source-text-id={row.textId} data-source-button-id={row.buttonId}
          disabled={!onEvent||!state.quizButtonsEnabled}
          onClick={event=>send('choose',{choice:letter},event.currentTarget)}>
          {letter}. {row.text.trim()}
        </button>;
      })}
    </div>}
    {state.phase==='quiz-held'&&<button type="button" style={buttonStyle}
      data-p048-help-open="true" disabled={!onEvent||!state.nmhButtonEnabled}
      onClick={event=>send('open-nmh',{},event.currentTarget)}>
      {en?'Need More Help':'Necesito más ayuda'}
    </button>}
    {state.nmhPopupVisible&&<div role="region" aria-label={en?'Need More Help':'Necesito más ayuda'}
      data-p048-help="true" style={{padding:'.8em',border:'1px solid #8b9dbb',display:'grid',gap:'.6em'}}>
      {bindings.helpText.map(row=><p key={row.textId} data-source-text-id={row.textId}
        lang="en" style={{margin:0}}>{row.text}</p>)}
      <div style={{display:'flex',flexWrap:'wrap',gap:'.5em'}}>
        {glossary.filter(x=>x.ownerSpriteId===139).map(x=><button key={x.buttonId} type="button"
          style={buttonStyle} data-source-glossary-id={x.buttonId}
          disabled={!onEvent||state.phase!=='nmh-popup'}
          onClick={event=>send('glossary',{buttonId:x.buttonId},event.currentTarget)}>{x.term}</button>)}
      </div>
      <button type="button" style={buttonStyle} data-p048-help-close="true"
        disabled={!onEvent||state.phase!=='nmh-popup'}
        onClick={event=>send('close-nmh',{},event.currentTarget)}>{en?'Close':'Cerrar'}</button>
    </div>}
    <div aria-live="polite" aria-atomic="true">
      {wrong&&<div data-p048-wrong-popup="true" style={{padding:'.8em',border:'2px solid #a74724'}}>
        <p lang="en" style={{marginTop:0}}>{state.wrongFeedText}</p>
        <button type="button" style={buttonStyle} data-p048-wrong-close="true"
          disabled={!onEvent||state.phase!=='wrong-feedback-held'}
          onClick={event=>send('close-wrong',{token:state.feedback!.token},event.currentTarget)}>
          {en?'Close':'Cerrar'}
        </button>
      </div>}
      {state.phase==='right-feedback-playing'&&<p lang="en">Excellent!</p>}
    </div>
    {glossary.some(x=>x.ownerSpriteId===348)&&<div
      aria-label={en?'Key terms':'Términos clave'} style={{display:'flex',flexWrap:'wrap',gap:'.5em'}}>
      {glossary.filter(x=>x.ownerSpriteId===348).map(x=><button key={x.buttonId} type="button"
        style={buttonStyle} data-source-glossary-id={x.buttonId} disabled={!onEvent}
        onClick={event=>send('glossary',{buttonId:x.buttonId},event.currentTarget)}>{x.term}</button>)}
    </div>}
  </section>;
}
