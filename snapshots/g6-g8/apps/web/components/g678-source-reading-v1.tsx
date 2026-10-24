import {Fragment,type ReactNode} from 'react';
export type G678SourceReadingBeat = Readonly<{
  firstFrame:number; lastFrame:number; text:string;
  table?:Readonly<{headers:readonly string[];rows:readonly (readonly string[])[]}>;
  steps?:readonly string[];
}>;
/** Small source math notation: a base followed by an explicitly grouped exponent. */
function MathText({text}:{text:string}) {
  const pattern=/(\d+)\^(?:\(([^)]+)\)|([0-9n]+))/gu;
  const parts:ReactNode[]=[];let end=0,hasPower=false;
  for(const match of text.matchAll(pattern)) {
    const start=match.index!, exponent=match[2]??match[3];
    parts.push(text.slice(end,start),<Fragment key={start}>{match[1]}<sup style={{fontSize:'0.7em',lineHeight:0}}>{exponent}</sup></Fragment>);
    end=start+match[0].length;hasPower=true;
  }
  if(!hasPower)return <>{text}</>;
  parts.push(text.slice(end));
  const spoken=text.replace(pattern,(_all,base,group,single)=>`${base} to the power (${group??single})`).replaceAll('−',' minus ').replaceAll('+',' plus ').replaceAll('=',' equals ');
  return <span role="math" aria-label={spoken}><span aria-hidden="true">{parts}</span></span>;
}
export function G678SourceReadingBeatView({beat}:{beat:G678SourceReadingBeat}) {
  if(beat.table)return <table lang="en" data-source-reading-table style={{width:'100%',tableLayout:'fixed',borderCollapse:'collapse',fontSize:16,fontVariantNumeric:'tabular-nums',margin:'0 0 12px'}}>
    <caption style={{textAlign:'left',fontSize:18,fontWeight:600,padding:'0 0 8px'}}>{beat.text}</caption>
    <thead><tr>{beat.table.headers.map(header=><th scope="col" key={header} style={{padding:'8px 5px',textAlign:'left',borderBottom:'2px solid currentColor',verticalAlign:'bottom',overflowWrap:'anywhere'}}>{header}</th>)}</tr></thead>
    <tbody>{beat.table.rows.map((row,index)=><tr key={index}>{row.map((cell,column)=>column===0
      ? <th key={column} scope="row" style={{padding:'7px 5px',textAlign:'left',fontWeight:500,borderBottom:'1px solid var(--lesson-platform-hair, var(--line))',overflowWrap:'anywhere'}}>{cell}</th>
      : <td key={column} style={{padding:'7px 5px',borderBottom:'1px solid var(--lesson-platform-hair, var(--line))',verticalAlign:'middle'}}><MathText text={cell}/></td>)}</tr>)}</tbody>
  </table>;
  if(beat.steps)return <div lang="en" data-source-reading-steps style={{margin:'12px 0 0'}}>
    <p style={{fontSize:18,fontWeight:600,margin:'0 0 4px'}}>{beat.text}</p>
    {beat.steps.map((step,index)=><p key={index} style={{fontSize:20,margin:'4px 0',lineHeight:1.55}}><MathText text={step}/></p>)}
  </div>;
  return <p lang="en" style={{fontSize:18,margin:0,fontWeight:beat.text.trim().endsWith(':')?700:400}}><MathText text={beat.text}/></p>;
}
