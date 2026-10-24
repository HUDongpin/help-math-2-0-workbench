import React from 'react';
import curve from '../../../migrations/shared-alg001-l06-p047/native-v1/graph-curve-v1.json';
import binding from '../../../migrations/shared-alg001-l06-p047/native-v1/native-bindings-v1.json';
/** Five source graph points. Coordinate labels appear in the later teaching
 * timeline. Keep shape27's original curve under a documented affine map. */
export function P047SourceGraphV1({language='en'}:{language?:'en'|'es'}) {
 const x=(value:number)=>180+20*value,y=(value:number)=>180-20*value;
 const ticks=[-6,-4,-2,2,4,6];
 return <figure style={{margin:'1rem 0',maxWidth:'24rem',width:'100%'}}>
  <svg viewBox="0 0 360 360" role="img" aria-label={language==='es'?'Gráfica de la función':'Graph of the function'}
    data-p047-source-graph data-source-shapes="20 27" style={{display:'block',boxSizing:'border-box',width:'100%',height:'auto',background:'#f8fafc',border:'1px solid #94a3b8'}}>
   <desc>{language==='es'?'Puntos de la gráfica':'Graph points'}: {binding.graph.points.map(([px,py])=>`(${px}, ${py})`).join('; ')}.</desc>
   {Array.from({length:15},(_,i)=>i-7).map(n=><g key={n} stroke="#cbd5e1" strokeWidth="1">
    <path d={`M ${x(n)} 20 V 340 M 20 ${y(n)} H 340`}/></g>)}
   <g stroke="#172554" strokeWidth="2"><path d="M 20 180 H 340 M 180 340 V 20"/>
    <path d="M 332 175 L 340 180 L 332 185 M 175 28 L 180 20 L 185 28" fill="none"/></g>
   <g fill="#172554" fontFamily="system-ui" fontSize="16">
    {ticks.map(n=><React.Fragment key={n}><text x={x(n)} y={202} textAnchor="middle">{n}</text>
     <text x={166} y={y(n)+5} textAnchor="end">{n}</text></React.Fragment>)}
    <text x="335" y="166">x</text><text x="192" y="27">y</text><text x="166" y="201" textAnchor="end">0</text>
   </g>
   <path d={curve.rawPath} transform={`matrix(${curve.transform.join(' ')})`} fill="none" stroke="#172554" strokeWidth="2" vectorEffect="non-scaling-stroke" data-source-curve={curve.sourceShape}/>
   {binding.graph.points.map(([px,py],i)=><circle key={i} cx={x(px)} cy={y(py)} r="5" fill="#b91c1c" data-source-point={i+1}/>)}
  </svg>
 </figure>;
}
