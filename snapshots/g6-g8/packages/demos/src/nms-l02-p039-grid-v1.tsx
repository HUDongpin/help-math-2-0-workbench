import * as React from 'react';
import {P039_GRID_ART} from './generated/nms-l02-p039-grid-art-source-v1';
import {p039IntroAt} from './nms-l02-p039-intro-v1';
import {p039GridAtPercent,p039SourceXAtPercent} from './nms-l02-p039-slider-v1';
import type {P039State} from './nms-l02-p039-state-v1';

type Path = {d:string;fill?:string;fillRule?:string;stroke?:string;strokeWidth?:string;strokeLinecap?:string;strokeLinejoin?:string};
const shapes:Readonly<Record<string,readonly Path[]>>=P039_GRID_ART.shapes;
export function p039GridArtAt(frame:number) {
  if(!Number.isInteger(frame)||frame<1||frame>545)throw Error('P039_GRID_ART_FRAME');
  let lo=0,hi=P039_GRID_ART.beats.length-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(P039_GRID_ART.beats[mid].firstFrame<=frame)lo=mid;else hi=mid-1;}
  return P039_GRID_ART.beats[lo].placements;
}

/** Native vector diagram. Page controls and explanatory text are composed by the page host. */
export function P039Grid({state,language='en',showPracticeSlider=true}:{state:P039State;language?:'en'|'es';showPracticeSlider?:boolean}) {
  const intro=state.mainFrame<546?p039IntroAt(state.mainFrame):null;
  const count=intro?intro.filled.length:state.percent;
  const label=language==='es'?`${count} de 100 cuadros sombreados`:`${count} of 100 squares shaded`;
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox={!intro&&!showPracticeSlider?"-315 -133 218 219":"-350 -145 280 330"} role="img" aria-label={label}
    data-p039-grid="native-svg" data-main-frame={state.mainFrame} data-filled-count={count}
    style={{display:'block',width:'100%',height:'auto'}}>
    {intro?p039GridArtAt(state.mainFrame).map(item=><g key={item.depth} data-source-depth={item.depth} data-source-character={item.characterId}
      transform={`matrix(${item.matrix.join(' ')})`} opacity={item.opacity}>
      {shapes[item.characterId].map((path,index)=><path key={index} {...path as React.SVGProps<SVGPathElement>}/>)}
    </g>):<g data-p039-practice-grid="true">
      {p039GridAtPercent(state.percent).map(cell=><rect key={cell.index} data-cell-index={cell.index} data-filled={cell.filled?'true':'false'}
        x={-306.5+cell.column*20} y={-124+cell.row*20} width={20} height={20} fill={cell.filled?'#ff3366':'#ffffff'} stroke="#000000" strokeWidth={1}/>)}
      {showPracticeSlider&&<><rect x={-333} y={108.35} width={240} height={5} fill="#999999" stroke="#000000"/>
      <rect x={p039SourceXAtPercent(state.percent)-8.45} y={103.05} width={16.9} height={16.75} fill="#ff6600" stroke="#a93c01"/></>}
    </g>}
  </svg>;
}
