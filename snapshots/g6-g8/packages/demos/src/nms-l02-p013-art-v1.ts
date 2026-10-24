import {P013_ART as ART} from './generated/nms-l02-p013-art-ir-v1';
import {p013SourceNodes,type P013State} from './nms-l02-p013-timeline-v1';
const NS='http://www.w3.org/2000/svg';
function el(tag:string,attrs:Record<string,string|number>={}){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));return e;}
/** Source vector-only component inspection. Product teaching uses responsive native diagrams. */
export function createP013Art(svg:SVGSVGElement,prefix:string) {
 const defs=el('defs'),scene=el('g');svg.replaceChildren(defs,scene);const shapes=new Map<number,string>();
 for(const image of ART.images)defs.append(el('image',{id:prefix+'-'+image.id,href:image.uri,width:image.width,height:image.height}));
 for(const a of Object.values(ART.art)) {
  if(a.morphs.length||a.elementMorphs.length||a.elementTransforms.length)throw Error('P013_UNEXPECTED_MORPH');
  const g=el('g',{id:prefix+'-shape-'+a.characterId});g.innerHTML=a.body;
  const ids=new Map([...g.querySelectorAll('[id]')].map(e=>[e.id,prefix+'-c'+a.characterId+'-'+e.id]));
  for(const e of g.querySelectorAll('*'))for(const attr of [...e.attributes]){let value=attr.value;
   if(attr.name==='id')value=ids.get(value)??value;
   else{for(const[from,to]of ids)value=value==='#'+from?'#'+to:value.replaceAll('url(#'+from+')','url(#'+to+')');for(const image of ART.images)if(value==='#'+image.id)value='#'+prefix+'-'+image.id;}
   e.setAttribute(attr.name,value);
  }
  defs.append(g);shapes.set(a.characterId,g.id);
 }
 return {draw(domain:string,frame:number,state?:P013State){scene.replaceChildren();for(const e of defs.querySelectorAll('[data-ephemeral]'))e.remove();let serial=0;
  for(const n of p013SourceNodes(domain,frame,state)){if(!shapes.has(n.characterId)||n.color[3]===0)continue;
   const g=el('g',{transform:'matrix('+n.matrix.join(' ')+')'}),c=n.color;scene.append(g);
   if(c.some((v,i)=>v!==(i<4?1:0))){const id=prefix+'-color-'+serial++,filter=el('filter',{id,'data-ephemeral':1,'color-interpolation-filters':'sRGB'});filter.append(el('feColorMatrix',{type:'matrix',values:[c[0],0,0,0,c[4],0,c[1],0,0,c[5],0,0,c[2],0,c[6],0,0,0,c[3],c[7]].join(' ')}));defs.append(filter);g.setAttribute('filter','url(#'+id+')');}
   g.append(el('use',{href:'#'+shapes.get(n.characterId)}));
  }
  const box=(scene as SVGGElement).getBBox();svg.setAttribute('viewBox',[box.x-5,box.y-5,Math.max(10,box.width+10),Math.max(10,box.height+10)].join(' '));
 },close(){svg.replaceChildren();}};
}
