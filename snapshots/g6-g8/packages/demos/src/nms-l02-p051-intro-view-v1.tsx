import React from 'react';
import {p051IntroScene} from './nms-l02-p051-intro-scene-v1';
import {P051_TEXT,type P051Language} from './nms-l02-p051-text-v1';
const fractions=[[67,'1','10'],[69,'1','5'],[70,'1','4'],[71,'3','4'],[72,'7','8']] as const;
const decimals=[[74,'0.1'],[76,'0.125'],[78,'0.2'],[80,'0.25'],[82,'0.3'],[89,'0.75'],[84,'0.7'],[86,'0.8'],[87,'0.875']] as const;
/** Semantic layout preserves source visibility and the demonstration's source-coordinate progress.
 * The authored separate fraction bars (including bars embedded in 73/110) become semantic fraction rules.
 * Decorative stopped clips and hit-only rectangles are deliberately not rendered. */
export function P051IntroView({frame,language='en',reducedMotion=false}:{frame:number;language?:P051Language;reducedMotion?:boolean}){
 const scene=p051IntroScene(frame),text=P051_TEXT[language];
 const object=(id:number)=>scene.find(item=>item.characterId===id);
 const alpha=(id:number)=>object(id)?.alpha??0;
 const root=React.useRef<HTMLElement>(null),origin=React.useRef<HTMLSpanElement>(null),target=React.useRef<HTMLSpanElement>(null);
 const [points,setPoints]=React.useState<{sx:number;sy:number;tx:number;ty:number}|null>(null);
 React.useLayoutEffect(()=>{
  const element=root.current,start=origin.current,end=target.current;if(!element||!start||!end)return;
  const measure=()=>{const r=element.getBoundingClientRect(),s=start.getBoundingClientRect(),t=end.getBoundingClientRect();setPoints({sx:s.left+s.width/2-r.left,sy:s.top+s.height/2-r.top,tx:t.left+t.width/2-r.left,ty:t.top+t.height/2-r.top});};
  measure();const resize=new ResizeObserver(measure);resize.observe(element);resize.observe(start);resize.observe(end);return()=>resize.disconnect();
 },[language]);
 const demo=scene.find(item=>item.characterId===74&&item.path.includes('/sprite-119/'))??object(74);
 const progress=demo?Math.max(0,Math.min(1,(4385-demo.matrix[4]!)/(4385-690))):0;
 const visualProgress=reducedMotion?(progress===1?1:0):progress;
 const atTarget=progress===1;
 const pointer=object(109);
 const pointerProgress=pointer?Math.max(0,Math.min(1,(5143-pointer.matrix[4]!)/(5143-1438))):0;
 const red=scene.find(item=>item.characterId>=91&&item.characterId<=105&&item.alpha>0);
 const redRow=red&&red.characterId>=92?(red.characterId<=93?0:red.characterId<=96?1:red.characterId<=99?2:red.characterId<=102?3:4):-1;
 const redDecimal=red?.characterId===91?decimals[Math.max(0,Math.min(8,Math.round((red.matrix[5]!+5828)/728.5)))]?.[0]:undefined;
 const style=(id:number)=>({opacity:alpha(id)});
 return <section ref={root} className="p051-intro" lang={language} data-p051-intro-frame={frame} data-p051-demo-progress={progress} data-p051-red-row={redRow} data-p051-red-decimal={redDecimal??''}>
  <h2 data-p051-source-text="53">{text.title}</h2>
  <h3 data-p051-source-text="60" style={style(60)} aria-hidden={!alpha(60)}>{text.question}</h3>
  <p data-p051-source-text="57" style={style(57)} aria-hidden={!alpha(57)}>{text.instruction}</p>
  <div className="p051-intro-layout">
   <table><thead><tr><th data-p051-source-text="65" style={style(65)} aria-hidden={!alpha(65)} aria-label={text.fraction}>{language==='en'?'Frac\u00adtion':text.fraction}</th><th data-p051-source-text="66" style={style(66)} aria-hidden={!alpha(66)} aria-label={text.equivalentDecimal}>{language==='en'?'Equiv\u00adalent Dec\u00adimal':text.equivalentDecimal}</th></tr></thead>
    <tbody>{fractions.map(([id,n,d],index)=><tr key={id}><td><span data-p051-source-text={id} style={style(id)} aria-hidden={!alpha(id)} className={`p051-intro-fraction ${index===0&&alpha(106)>0?'p051-intro-emphasis':''}`} role="math" aria-label={`${n}/${d}`}><span aria-hidden="true">{n}</span><span aria-hidden="true">{d}</span></span></td><td><span ref={index===0?target:undefined} className={`p051-intro-target ${index===redRow?'p051-intro-target-emphasis':''}`}><span className="p051-intro-target-border" data-p051-source-shape="64" aria-hidden="true" style={{opacity:alpha(64)}}/>{index===0&&atTarget&&!points&&demo?<span style={{opacity:demo.alpha}}>0.1</span>:<span aria-hidden="true">&nbsp;</span>}</span></td></tr>)}</tbody>
   </table>
   <div className="p051-intro-decimals" aria-label={text.decimals}>{decimals.map(([id,value])=><span key={id} ref={id===74?origin:undefined} className={`p051-intro-card ${id===redDecimal?'p051-intro-target-emphasis':''} ${id===74&&alpha(108)>0?'p051-intro-emphasis':''}`} data-p051-source-text={id} aria-hidden={id===74?!!points||atTarget||!demo?.alpha:!alpha(id)} style={{opacity:id===74?(demo?.alpha??0):alpha(id),visibility:id===74&&points?'hidden':undefined}}>{id===74&&atTarget?'\u00a0':value}</span>)}</div>
  </div>
  {demo&&points&&<span className={`p051-intro-moving-card ${redDecimal===74?'p051-intro-target-emphasis':''} ${alpha(108)>0?'p051-intro-emphasis':''}`} data-p051-source-text="74" data-p051-demo="0.1" aria-hidden={!demo.alpha} style={{opacity:demo.alpha,left:points.sx+(points.tx-points.sx)*visualProgress,top:points.sy+(points.ty-points.sy)*visualProgress}}>0.1</span>}
  {pointer&&pointer.alpha>0&&!reducedMotion&&points&&<span className="p051-intro-pointer" data-p051-source-shape="109" aria-hidden="true" style={{opacity:pointer.alpha,left:points.sx+(points.tx-points.sx)*pointerProgress+18,top:points.sy+(points.ty-points.sy)*pointerProgress+18}}>↖</span>}
 </section>;
}
