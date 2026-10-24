import * as React from 'react';
import {P040_SOURCE} from './generated/nms-l02-p040-presentation-v1';
/** Source cell identities and boundaries, independent of animation transport. */
export function P040Grid({language='en'}:{language?:'en'|'es'}){
 const {xLines,yLines,cells}=P040_SOURCE.grid;
 const width=xLines[xLines.length-1]!-xLines[0]!,height=yLines[yLines.length-1]!-yLines[0]!;
 return <svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label={language==='es'?'40 de 100 cuadros sombreados: 40%.':'40 of 100 squares shaded: 40%.'} viewBox={`-10 -10 ${width+20} ${height+20}`} style={{display:'block',width:'100%',height:'auto',maxWidth:'100%'}} data-p040-grid="source-40-of-100">
  {cells.map(cell=><rect key={`${cell.row}-${cell.column}`} x={xLines[cell.column]!-xLines[0]!} y={yLines[cell.row]!-yLines[0]!} width={xLines[cell.column+1]!-xLines[cell.column]!} height={yLines[cell.row+1]!-yLines[cell.row]!} fill={cell.filled?'#ffff66':'#ffffff'} stroke="#000000" strokeWidth={20} data-p040-filled={cell.filled?'true':'false'}/>)}
 </svg>;
}
