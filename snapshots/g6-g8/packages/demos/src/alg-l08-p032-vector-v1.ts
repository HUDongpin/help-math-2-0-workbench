/** Source SVG endpoint interpolation by the SWF's 16-bit morph ratio. */
const number=/-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;
export function p032MorphValue(name:string,values:string,ratio:number):string{
 const pair=values.split(';');if(pair.length!==2||!Number.isInteger(ratio)||ratio<0||ratio>65535)throw Error('invalid-p032-morph');
 if(ratio===0)return pair[0];if(ratio===65535)return pair[1];const t=ratio/65535;if(name==='stroke'||name==='fill'){
  const colors=pair.map(v=>/^#[0-9a-f]{6}$/i.test(v)?[1,3,5].map(i=>parseInt(v.slice(i,i+2),16)):null);
  if(colors[0]&&colors[1])return '#'+colors[0].map((x,i)=>Math.round(x+(colors[1]![i]-x)*t).toString(16).padStart(2,'0')).join('');
  if(pair[0]===pair[1])return pair[0];throw Error('unsupported-p032-color');
 }
 const a=pair[0].match(number)?.map(Number)??[],b=pair[1].match(number)?.map(Number)??[];
 if(a.length!==b.length||pair[0].replace(number,'#')!==pair[1].replace(number,'#'))throw Error('incompatible-p032-morph-edges');let i=0;
 return pair[0].replace(number,()=>{const value=a[i]+(b[i]-a[i])*t;i++;return String(value);});
}
