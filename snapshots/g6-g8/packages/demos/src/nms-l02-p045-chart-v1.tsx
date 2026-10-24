import * as React from 'react';
export type P045ChartNumerator = 2 | 3 | 4;
/** Source sprite177 labels L1/L2/L3. Exact equal angles are a documented native
 * geometry adaptation; the source's tiny mixed-fill edge in shape169 is omitted.
 */
export function p045ChartSectors(numerator:P045ChartNumerator){
  if(![2,3,4].includes(numerator))throw Error('P045_CHART_QUESTION');
  return Object.freeze(Array.from({length:10},(_,index)=>{
    const startDegrees=-108+index*36,endDegrees=startDegrees+36;
    const a=startDegrees*Math.PI/180,b=endDegrees*Math.PI/180;
    return Object.freeze({part:index+1,startDegrees,endDegrees,
      selected:index===0||index>=11-numerator,
      path:`M120 120 L${120+100*Math.cos(a)} ${120+100*Math.sin(a)} A100 100 0 0 1 ${120+100*Math.cos(b)} ${120+100*Math.sin(b)} Z`});
  }));
}
export function P045Chart({numerator,language='en'}:{numerator:P045ChartNumerator;language?:'en'|'es'}){
  const sectors=p045ChartSectors(numerator);
  const description=language==='es'?`Gráfico circular dividido en 10 partes iguales; ${numerator} están coloreadas de azul.`:`Pie chart divided into 10 equal parts; ${numerator} are shaded blue.`;
  return <figure className="p045-chart" style={{width:'100%',maxWidth:'20rem',margin:'1rem auto'}}>
    <svg viewBox="0 0 240 240" role="img" aria-label={description} style={{display:'block',width:'100%',height:'auto'}}>
      {sectors.map(sector=><path key={sector.part} data-part={sector.part} data-selected={sector.selected}
        d={sector.path} fill={sector.selected?'#0000ff':'#fff'} stroke="#172c43" strokeWidth="1.5"/>)}
    </svg>
    <figcaption style={{textAlign:'center',overflowWrap:'anywhere'}}>{language==='es'?'Gráfico circular':'Pie chart'}</figcaption>
  </figure>;
}
