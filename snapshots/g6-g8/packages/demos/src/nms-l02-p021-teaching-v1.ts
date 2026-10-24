import {P021_IR as IR} from './generated/nms-l02-p021-source-ir-v1';
import {p021Target,type P021State} from './nms-l02-p021-state-v1';
function deepFreeze<T>(v:T):T{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))deepFreeze(x);}return v;}deepFreeze(IR);
export function p021LocalPoses(domain:string,frame:number){const d=Object.hasOwn(IR.domains,domain)?IR.domains[domain]:null;if(!d||!Number.isSafeInteger(frame)||frame<1||frame>d.frameCount)throw Error('P021_BAD_DOMAIN_FRAME');return Object.freeze(d.frames[frame-1]!.map(i=>IR.poses[i]!));}
export function p021Teaching(s:P021State){
 const demo=s.phase==='intro',row=IR.intro[s.mainFrame-1];if(!row)throw Error('P021_BAD_MAIN_FRAME');const target=demo?row.target:p021Target(s)??[1,3],parts=demo?row.parts:s.parts;
 return Object.freeze({demo,row,target,parts,selected:demo?row.blue:s.selected,rotation:demo?row.rotation:IR.selectorRotations[parts-1]!,prompt:IR.prompt,showButtons:s.phase!=='completed'});
}
/** All sectors use exactly the same central angle and radius. */
export function p021SectorPath(parts:number,index:number,rotation:number,radius=100){
 if(!Number.isInteger(parts)||parts<1||parts>20||!Number.isInteger(index)||index<0||index>=parts||!Number.isFinite(rotation)||!Number.isFinite(radius)||radius<=0)throw Error('P021_BAD_SECTOR_GEOMETRY');
 if(parts===1)return `M0 ${-radius} A${radius} ${radius} 0 1 1 0 ${radius} A${radius} ${radius} 0 1 1 0 ${-radius} Z`;
 const a=(rotation+index*360/parts)*Math.PI/180,b=a+2*Math.PI/parts;return `M0 0 L${radius*Math.cos(a)} ${radius*Math.sin(a)} A${radius} ${radius} 0 0 1 ${radius*Math.cos(b)} ${radius*Math.sin(b)} Z`;
}
