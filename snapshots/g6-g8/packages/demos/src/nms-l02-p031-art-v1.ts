import type{P031ArtData}from'./nms-l02-p031-feedback-contract-v1';
import {P031_ART as RAW} from './generated/nms-l02-p031-feedback-art-v1';
import {p031SourceNodes} from './nms-l02-p031-feedback-v1';
import {p031LocalPoses} from './nms-l02-p031-source-query-v1';
import type {P031MorphAttribute} from './nms-l02-p031-feedback-contract-v1';
const ART:P031ArtData=RAW;
const NS='http://www.w3.org/2000/svg';
function el(tag:string,attrs:Record<string,string|number>={}){const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));return e;}
export function p031Interpolate(start:string,end:string,ratio:number){const t=ratio/65535;if(/^#[0-9a-f]{6}$/i.test(start)&&/^#[0-9a-f]{6}$/i.test(end))return '#'+[1,3,5].map(i=>Math.round(parseInt(start.slice(i,i+2),16)+(parseInt(end.slice(i,i+2),16)-parseInt(start.slice(i,i+2),16))*t).toString(16).padStart(2,'0')).join('');const re=/[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g,a=[...start.matchAll(re)],b=[...end.matchAll(re)];if(a.length!==b.length||start.replace(re,'#')!==end.replace(re,'#'))throw Error('P031_MORPH_TOPOLOGY');let i=0;return start.replace(re,()=>{const j=i++;return String(Number(a[j][0])+(Number(b[j][0])-Number(a[j][0]))*t);});}
/** Source illustrations only. No source fonts, teaching text or legacy controls. */
export function createP031Art(svg:SVGSVGElement,prefix:string){
 const defs=el('defs'),scene=el('g');svg.replaceChildren(defs,scene);const cache=new Map<string,string>();
 for(const b of ART.images)defs.append(el('image',{id:b.id,href:b.uri,width:b.width,height:b.height}));
 function namespace(root:Element,variant:string){const refs=new Map([...root.querySelectorAll('[id]')].map(e=>[e.id,prefix+'-'+variant+'-'+e.id]));for(const e of root.querySelectorAll('*'))for(const a of [...e.attributes]){let v=a.value;if(a.name==='id')v=refs.get(v)??v;else for(const[from,to]of refs)v=v==='#'+from?'#'+to:v.replaceAll('url(#'+from+')','url(#'+to+')');e.setAttribute(a.name,v);}}
 // Images have stable source IDs in each private SVG; qualify every use and ID.
 for(const img of defs.querySelectorAll('image'))img.id=prefix+'-'+img.id;
 function shape(id:number,ratio:number){const key=id+'-'+ratio;if(cache.has(key))return cache.get(key)!;const a=ART.art[id];const g=el('g',{id:prefix+'-shape-'+key});g.innerHTML=a.body;const paths=g.querySelectorAll('path');const set=(e:Element,attrs:readonly P031MorphAttribute[])=>{for(const x of attrs)e.setAttribute(x.attribute,p031Interpolate(x.start,x.end,ratio));};
  for(const m of a.morphs)set(paths[m.pathIndex],m.attributes);
  for(const m of a.elementMorphs)set(g.querySelectorAll(m.selector)[m.elementIndex],m.attributes);
  for(const m of a.elementTransforms){const target=g.querySelectorAll(m.selector)[m.elementIndex];let value='';for(const a of m.transforms){if(!['translate','scale','rotate','skewX','skewY'].includes(a.type))throw Error('P031_TRANSFORM');const transform=a.type+'('+p031Interpolate(a.start,a.end,ratio)+')';value=a.additive==='replace'?transform:value+' '+transform;target.setAttribute(a.attribute,value.trim());}}
  namespace(g,key);for(const use of g.querySelectorAll('use')){const ref=use.getAttribute('href');if(ref?.startsWith('#nms2p31-b'))use.setAttribute('href','#'+prefix+'-'+ref.slice(1));}
  defs.append(g);cache.set(key,g.id);return g.id;
 }
 return{draw(domain:string,frame:number){scene.replaceChildren();for(const e of defs.querySelectorAll('[data-ephemeral]'))e.remove();const pose=p031LocalPoses('242',147).find(p=>String(p.characterId)===domain);svg.setAttribute('viewBox',[-412.4-(pose?.matrix[4]??0),-283.3-(pose?.matrix[5]??0),800,600].join(' '));
  let serial=0;const nodes=p031SourceNodes(domain,frame);for(const n of nodes){if(!Object.hasOwn(ART.art,String(n.characterId)))continue;let outer=el('g');scene.append(outer);
   for(const m of n.masks){const id=prefix+'-clip-'+serial++,clip=el('clipPath',{id,clipPathUnits:'userSpaceOnUse','data-ephemeral':1});for(const p of ART.maskGeometry[m.characterId]){const morph=p.morph.find(a=>a.attribute==='d');clip.append(el('path',{d:morph?p031Interpolate(morph.start,morph.end,m.ratio):p.d,'clip-rule':p.fillRule,transform:'matrix('+m.matrix.join(' ')+')'}));}defs.append(clip);const next=el('g',{'clip-path':'url(#'+id+')'});outer.append(next);outer=next;}
   const g=el('g',{transform:'matrix('+n.matrix.join(' ')+')'});outer.append(g);if(n.color.some((v,i)=>v!==(i<4?1:0))){const id=prefix+'-color-'+serial++,f=el('filter',{id,'data-ephemeral':1,'color-interpolation-filters':'sRGB'}),c=n.color;f.append(el('feColorMatrix',{type:'matrix',values:[c[0],0,0,0,c[4],0,c[1],0,0,c[5],0,0,c[2],0,c[6],0,0,0,c[3],c[7]].join(' ')}));defs.append(f);g.setAttribute('filter','url(#'+id+')');}g.append(el('use',{href:'#'+shape(n.characterId,n.ratio)}));}
  return nodes;
 },close(){svg.replaceChildren();cache.clear();}};
}
