import{P027_SOURCE_IR as IR}from'./generated/nms-l02-p027-source-ir-v1';
import{p027LocalPoses}from'./nms-l02-p027-source-query-v1';
import type{P027Matrix,P027Pose}from'./nms-l02-p027-source-contract-v1';
import type{P027SessionState}from'./nms-l02-p027-state-v1';
const identity:P027Matrix=[1,0,0,1,0,0];
export const p027Multiply=(a:P027Matrix,b:P027Matrix):P027Matrix=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
export interface P027Node extends P027Pose{readonly instancePath:string;readonly masks:readonly P027Mask[];}
export interface P027Mask extends P027Pose{readonly key:string;}
/** Structural nested local-domain query. Interactive branch selection is supplied
 * separately; dormant feedback remains at its source stop1. */
export function p027SourceNodes(domain:string,frame:number):readonly P027Node[]{const nodes:P027Node[]=[];
 const visit=(name:string,f:number,m:P027Matrix,parentColor:readonly number[],inherited:readonly P027Mask[],path:string)=>{
  const masks:P027Mask[]=[];
  for(const p of p027LocalPoses(name,f)){const matrix=p027Multiply(m,p.matrix),color=p.color.map((v,i)=>i<4?v*parentColor[i]:v*parentColor[i-4]+parentColor[i]),instancePath=path+'/d'+p.depth+'g'+p.generation+'c'+p.characterId,active=[...inherited,...masks.filter(a=>p.depth>a.depth&&p.depth<=a.clipDepth)],pose={...p,matrix,color};
   if(p.clipDepth){masks.push({...pose,key:instancePath});continue;}
   const child=String(p.characterId);if(Object.hasOwn(IR.domains,child)){const isFeedback=/^Mc_(Wrong|Right)_Feed/.test(p.name??'');visit(child,isFeedback?1:(f-p.birthFrame)%IR.domains[child].frameCount+1,matrix,color,active,instancePath);}else nodes.push({...pose,instancePath,masks:active});
  }
 };visit(domain,frame,identity,[1,1,1,1,0,0,0,0],[],domain);return nodes;
}

export function p027FeedbackTitleVisible(s:P027SessionState) {
 const ids:Record<string,readonly number[]>={
  '62':[44],'77':[66,67,70],'98':[81,82,84,92],'116':[107,108],
  '142':[131,132],'154':[151,152],'171':[166,167],'185':[178,179,183],
 };
 if(!Object.hasOwn(ids,s.domain)) return false;
 return p027SourceNodes(s.domain,s.localFrame).some(n=>ids[s.domain].includes(n.characterId)&&n.color[3]>0&&Math.abs(n.matrix[0]*n.matrix[3]-n.matrix[1]*n.matrix[2])>1e-8);
}
