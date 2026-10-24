'use client';
import React,{type CSSProperties} from 'react';
import {P060_DISPLAY_META,P060_SOURCE_TEXT,p060SourceSnapshot,type P060DomainId,type P060SourceObject} from './generated/nms-l02-p060-display-list-v1';

export type P060BoxView={kind:'picture'|'calculator';localFrame:number};
export type P060FeedbackView={spriteId:104|205|217|245|258|275|296|322|354|368;localFrame:number};
export type P060VisualProps={mainFrame:number;box?:P060BoxView|null;feedback?:P060FeedbackView|null;popupOpen?:boolean;
 answerControls?:React.ReactNode;uiLanguage:'en'|'es'};

const ink='#172940',card:CSSProperties={background:'#fff',border:'1px solid #adc7d1',borderRadius:12,padding:'0.7rem',minWidth:0};
const sourceText=(id:number)=>P060_SOURCE_TEXT[id]?.replaceAll('\n--- RECORDSEPARATOR ---\n',' ').replace(/\s+/gu,' ').trim()??'';
const alpha=(item:P060SourceObject)=>Math.max(0,Math.min(1,item.color[3]/256));
const sourceItem=(items:readonly P060SourceObject[],id:number)=>items.find(item=>item.characterId===id&&alpha(item)>0);
const sourcePresence=(items:readonly P060SourceObject[],id:number)=>Boolean(sourceItem(items,id));
const fraction=(numerator:string,denominator:string,ids:string)=><span data-source-text-id={ids} className="nms-p060-fraction"
 style={{display:'inline-flex',verticalAlign:'middle',alignItems:'center',flexDirection:'column',lineHeight:1,margin:'0 0.15em',fontVariantNumeric:'tabular-nums'}}>
 <span>{numerator}</span><span aria-hidden="true" style={{width:'100%',borderTop:'1.5px solid currentColor',margin:'0.1em 0'}}/><span>{denominator}</span>
 </span>;

function SourceWords({main}: {main:readonly P060SourceObject[]}){
 const letters=main.filter(item=>item.characterId>=46&&item.characterId<=60&&alpha(item)>0);
 if(!letters.length)return null;
 return <div aria-hidden="true" data-source-letter-pulses="true" data-source-character-ids={letters.map(item=>item.characterId).join(' ')}
  style={{position:'relative',height:'2rem',overflow:'hidden',margin:'0.2rem 0'}}>
  {letters.map(item=><span key={item.depth} data-source-text-id={item.characterId}
   style={{position:'absolute',left:`${Math.max(0,Math.min(100,(item.transform[4]+8247)/160))}%`,
    top:'0',color:'#8b2762',fontWeight:700,opacity:alpha(item),lineHeight:1}}>{sourceText(item.characterId)}</span>)}
 </div>;
}

function Question({main,showRephrase}:{main:readonly P060SourceObject[];showRephrase:boolean}){
 const item=sourceItem(main,17);if(!item)return null;
 return <section aria-label="Source question" data-p060-panel="question" style={card}>
  <h2 style={{fontSize:'clamp(1.25rem,3vw,1.7rem)',lineHeight:1.3,margin:'0 0 0.45rem',opacity:alpha(item)}}
   data-source-text-id="17 18 19 20">Which <span data-source-key="Decimal fraction" style={{color:'#803064'}}>decimal fraction</span> is{' '}
   <span data-source-key="Equivalent" style={{color:'#803064'}}>equivalent</span> to the{' '}
   <span data-source-key="Fraction" style={{color:'#803064'}}>fraction</span> {fraction('1','5','19 20')}?</h2>
  {showRephrase&&sourcePresence(main,64)&&<p data-source-text-id="64" style={{margin:'0.2rem 0 0',fontWeight:600}}>{sourceText(64)}</p>}
  <SourceWords main={main}/>
 </section>;
}

const answerSource=[{letter:'A',value:'0.2',labelIds:'42 40',hitId:193,answerNumber:1},
 {letter:'B',value:'0.25',labelIds:'33 31',hitId:192,answerNumber:2},
 {letter:'C',value:'0.4',labelIds:'36 34',hitId:192,answerNumber:3},
 {letter:'D',value:'0.5',labelIds:'39 37',hitId:192,answerNumber:4}] as const;
function Answers({mainFrame,main,answerControls}:{mainFrame:number;main:readonly P060SourceObject[];answerControls?:React.ReactNode}){
 if(!sourcePresence(main,42))return null;
 const quiz=mainFrame===699;
 return <section aria-label={quiz?'Four-option source question':'Source answer labels'} data-p060-panel="answers"
  data-source-interactive={quiz?'true':'false'} style={card}>
  {quiz&&answerControls!==undefined?answerControls:<ol style={{listStyle:'none',padding:0,margin:0,display:'grid',gap:'0.4rem'}}>
   {answerSource.map(answer=><li key={answer.letter} data-source-text-id={answer.labelIds}
    data-source-answer={answer.answerNumber} data-source-hit-object-id={quiz?answer.hitId:undefined}
    style={{border:'1px solid #bfccd6',borderRadius:8,padding:'0.35rem 0.65rem',background:'#f6fafb'}}>
    <strong>{answer.letter}.</strong> {answer.value}</li>)}
  </ol>}
 </section>;
}

function GivenNeeded({main}:{main:readonly P060SourceObject[]}){
 if(!sourcePresence(main,105))return null;
 return <section data-p060-panel="given-needed" aria-label="Information given and needed" style={{...card,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,13rem),1fr))',gap:'0.5rem'}}>
  <div data-source-text-id="105 107 108 109"><strong>{sourceText(105)}</strong><p style={{margin:'0.3rem 0'}}>
   <span data-source-key="Fraction">{sourceText(107)}</span> {fraction('1','5','108 109')}</p></div>
  <div data-source-text-id="106"><strong>Information needed:</strong><p style={{margin:'0.3rem 0'}}>equivalent decimal fraction</p></div>
 </section>;
}

function DecimalGrid({shadeCount}:{shadeCount:number}){
 return <div data-source-grid-shaded={shadeCount} data-source-shape-id="118" role="img"
  aria-label={`${shadeCount} of 100 decimal grid parts shaded`}
  style={{display:'grid',gridTemplateColumns:'repeat(10,minmax(0,1fr))',width:'min(100%,15rem)',aspectRatio:'1',gap:1,
   background:'#425662',border:'1px solid #425662',margin:'0.6rem auto'}}>
  {Array.from({length:100},(_,index)=><span key={index} aria-hidden="true"
   style={{background:index<shadeCount?'#92f30c':'#fff'}}/>)}
 </div>;
}
function PictureStrategy({main,box}:{main:readonly P060SourceObject[];box:P060BoxView|null}){
 const open=box?.kind==='picture';
 if(!sourcePresence(main,112)&&!open)return null;
 return <section data-p060-panel="picture" data-source-box-local-frame={open?box.localFrame:undefined}
  aria-label="Draw a picture strategy" style={card}>
  <h3 data-source-text-id="112" style={{margin:'0 0 0.35rem'}}>{sourceText(112)}</h3>
  <p data-source-text-id="113 114 119 120" style={{margin:'0.2rem 0'}}>Shade {fraction('1','5','119 120')} of the{' '}
   <span data-source-key="Grid">decimal grid</span> or divide the decimal grid into five equal{' '}
   <span data-source-key="Part">parts</span>. Then, count the shaded parts.</p>
  <DecimalGrid shadeCount={20}/>
  <p data-source-text-id="122" style={{margin:'0.3rem 0'}}>{sourceText(122)}</p>
  <div data-source-text-id="123 124 125 126 127 128" aria-label="One fifth equals twenty hundredths equals zero point two zero equals zero point two"
   style={{fontSize:'1.2rem',fontWeight:700,textAlign:'center'}}>
   {fraction('1','5','123 124')} = {fraction('20','100','126 127')} = 0.20 = 0.2
  </div>
  {open&&<span data-source-nested-sprite="139" aria-hidden="true" hidden/>}
 </section>;
}

function Calculator({localFrame}:{localFrame:number|null}){
 const display=localFrame===null?'':localFrame>=90?'0.2':localFrame>=74?'5':localFrame>=36?'1':'';
 const displayId=display==='1'?186:display==='5'?187:display==='0.2'?188:null;
 return <div data-source-calculator="190" data-source-calculator-local-frame={localFrame??undefined}
  style={{maxWidth:'13rem',margin:'0.5rem auto',padding:'0.7rem',border:'2px solid #405774',borderRadius:12,background:'#e9edf0'}}>
  <output aria-label="Calculator display" data-source-text-id={displayId} style={{display:'block',minHeight:'2rem',padding:'0.2rem 0.45rem',textAlign:'right',background:'#f8fff3',border:'1px solid #697977',fontVariantNumeric:'tabular-nums',fontSize:'1.4rem'}}>{display}</output>
  <div aria-label="Calculator keypad illustration" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:3,marginTop:'0.45rem'}}>
   {['M+','MRC','C','CE','7','8','9','÷','4','5','6','×','1','2','3','−','0','.','=','+'].map((key,index)=><span key={index}
    data-source-text-id={index<4?[177,178,179,180][index]:undefined}
    style={{background:'#fff',border:'1px solid #8e9a9e',borderRadius:3,textAlign:'center',fontSize:'0.8rem',padding:'0.2rem 0'}}>{key}</span>)}
  </div>
 </div>;
}
function CalculatorStrategy({main,box}:{main:readonly P060SourceObject[];box:P060BoxView|null}){
 const open=box?.kind==='calculator';
 if(!sourcePresence(main,142)&&!open)return null;
 return <section data-p060-panel="calculator" aria-label="Use the calculator strategy" style={card}>
  <h3 data-source-text-id="142" style={{margin:'0 0 0.35rem'}}>{sourceText(142)}</h3>
  <ol style={{margin:'0.2rem 0',paddingLeft:'1.4rem'}}>
   <li data-source-text-id="143">Enter the top number of the fraction: 1</li>
   <li data-source-text-id="146 147">Press the divide symbol (÷)</li>
   <li data-source-text-id="144">Enter the bottom number of the fraction: 5</li>
   <li data-source-text-id="145">Press the equal symbol (=)</li>
  </ol>
  <Calculator localFrame={open?box.localFrame:null}/>
 </section>;
}

const feedbackText:Record<P060FeedbackView['spriteId'],number[]>={104:[89,90],205:[198,199],217:[211],245:[223],258:[253,254],275:[270,271],296:[294,295],322:[311,312],354:[351,352],368:[361,362,366]};
const feedbackMaxFrame:Record<P060FeedbackView['spriteId'],number>={104:70,205:29,217:28,245:28,258:31,275:28,296:33,322:31,354:25,368:32};
function Feedback({feedback}:{feedback:P060FeedbackView|null}){
 if(!feedback)return null;
 const domain=String(feedback.spriteId) as P060DomainId,local=p060SourceSnapshot(domain,feedback.localFrame);
 const visible=feedbackText[feedback.spriteId].find(id=>sourcePresence(local,id));
 return <aside data-p060-feedback-sprite={feedback.spriteId} data-source-feedback-frame={feedback.localFrame}
  aria-live="polite" style={{...card,borderColor:'#8d7cc3',background:'#f8f5ff'}}>
  {visible?<strong data-source-text-id={visible}>{sourceText(visible)}</strong>:<span aria-hidden="true">&nbsp;</span>}
 </aside>;
}
export function P060HintContent(){
 return <section data-source-popup-sprite="388"
  style={{...card,border:'2px solid #4f6388',background:'#fffef2'}}>
  <p data-source-text-id="372" style={{margin:'0 0 0.5rem'}}><span data-source-key="Fraction">Fractions</span> and{' '}
   <span data-source-key="Decimal">decimals</span> are <span data-source-key="Equivalent">equivalent</span> when they{' '}
   <span data-source-key="Represent">represent</span> the same <span data-source-key="Value">value</span>.</p>
  <p data-source-text-id="373 376 377 378" style={{margin:0}}>{sourceText(373)} {fraction('3','4','377 378')} = 0.75</p>
  <span data-source-control-id="370" data-source-control-label="Close" aria-hidden="true" hidden/>
 </section>;
}

/** Source-static presentation. A separate state adapter owns controls, audio and transitions. */
export function NmsL02P060ProductRendererV1(props:P060VisualProps){
 const {mainFrame,uiLanguage}=props,box=props.box??null,feedback=props.feedback??null,popupOpen=props.popupOpen??false;
 const invalid=!Number.isInteger(mainFrame)||mainFrame<1||mainFrame>718||
  (box!==null&&(box.kind==='picture'?(mainFrame!==527||!Number.isInteger(box.localFrame)||box.localFrame<1||box.localFrame>21):
   box.kind==='calculator'?(mainFrame!==646||!Number.isInteger(box.localFrame)||box.localFrame<1||box.localFrame>109):true))||
  (feedback!==null&&(!Number.isInteger(feedback.localFrame)||feedback.localFrame<1||feedback.localFrame>feedbackMaxFrame[feedback.spriteId]||
   !([104,205,217,245,258,275,296,322,354,368] as number[]).includes(feedback.spriteId)||
   (feedback.spriteId===104?![401,527].includes(mainFrame):mainFrame!==699)))||
  (popupOpen&&mainFrame!==699)||(props.answerControls!==undefined&&mainFrame!==699);
 if(invalid)return <article role="alert" data-p060-status="invalid-source-state">The P060 source visual state is unavailable.</article>;
 const main=p060SourceSnapshot('391',mainFrame);
 return <article lang="en" data-p060-product="shared-nms002-l02-p060" data-p060-main-frame={mainFrame}
  data-source-swf-sha256={P060_DISPLAY_META.sourceSwfSha256} data-source-frame-domain="sprite-391"
  data-language-policy={uiLanguage==='es'?'english-source-fallback':'english-source'}
  style={{boxSizing:'border-box',color:ink,fontFamily:'var(--lesson-text-font-body,sans-serif)',fontSize:'1rem',lineHeight:1.45,
   maxWidth:'68rem',margin:'0 auto',padding:'clamp(0.7rem,2vw,1.4rem)',background:'#eff5f6'}}>
  {uiLanguage==='es'&&<p lang="es" data-spanish-translation="missing" style={{...card,margin:'0 0 0.65rem'}}>
   Texto original en inglés. No hay una traducción al español verificada.</p>}
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,25rem),1fr))',gap:'0.65rem'}}>
   <Question main={main} showRephrase={mainFrame>=263}/><Answers mainFrame={mainFrame} main={main} answerControls={props.answerControls}/>
  </div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,23rem),1fr))',gap:'0.65rem',marginTop:'0.65rem'}}>
   <GivenNeeded main={main}/><PictureStrategy main={main} box={box}/><CalculatorStrategy main={main} box={box}/>
  </div>
  {[262,400,527,646].includes(mainFrame)&&<span data-source-stop-frame={mainFrame} data-source-control-ids="61 63" aria-hidden="true" hidden/>}
  {mainFrame===699&&<p data-source-control-id="13" data-source-control-label="Need More Help" style={{fontWeight:600,margin:'0.65rem 0'}}>Need More Help</p>}
  {popupOpen&&<aside role="dialog" aria-modal="true" aria-label="Fraction and decimal hint"><P060HintContent/></aside>}
  <Feedback feedback={feedback}/>
  {mainFrame===718&&<span data-source-terminal-frame="718" aria-hidden="true" hidden/>}
 </article>;
}
