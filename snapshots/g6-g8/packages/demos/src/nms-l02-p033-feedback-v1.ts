import type{P033FeedbackData}from'./nms-l02-p033-feedback-contract-v1';
import{P033_FEEDBACK_IR as RAW}from'./generated/nms-l02-p033-feedback-ir-v1';
import{p033LocalPoses}from'./nms-l02-p033-source-query-v1';
import type{P033Matrix,P033Pose}from'./nms-l02-p033-feedback-contract-v1';
import type{P033SessionState}from'./nms-l02-p033-state-v1';
const IR:P033FeedbackData=RAW;
const identity:P033Matrix=[1,0,0,1,0,0];
export const p033Multiply=(a:P033Matrix,b:P033Matrix):P033Matrix=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
export interface P033Node extends P033Pose{readonly instancePath:string;readonly masks:readonly P033Mask[];}
export interface P033Mask extends P033Pose{readonly key:string;}
/** Structural nested local-domain query. Interactive branch selection is supplied
 * separately; dormant feedback remains at its source stop1. */
export function p033SourceNodes(domain:string,frame:number):readonly P033Node[]{const nodes:P033Node[]=[];
 const visit=(name:string,f:number,m:P033Matrix,parentColor:readonly number[],inherited:readonly P033Mask[],path:string)=>{
  const masks:P033Mask[]=[];
  for(const p of p033LocalPoses(name,f)){const matrix=p033Multiply(m,p.matrix),color=p.color.map((v,i)=>i<4?v*parentColor[i]:v*parentColor[i-4]+parentColor[i]),instancePath=path+'/d'+p.depth+'g'+p.generation+'c'+p.characterId,active=[...inherited,...masks.filter(a=>p.depth>a.depth&&p.depth<=a.clipDepth)],pose={...p,matrix,color};
   if(p.clipDepth){masks.push({...pose,key:instancePath});continue;}
   const child=String(p.characterId);if(Object.hasOwn(IR.domains,child)){const isFeedback=/^Mc_(Wrong|Right)_Feed/.test(p.name??'');visit(child,isFeedback?1:(f-p.birthFrame)%IR.domains[child].frameCount+1,matrix,color,active,instancePath);}else nodes.push({...pose,instancePath,masks:active});
  }
 };visit(domain,frame,identity,[1,1,1,1,0,0,0,0],[],domain);return nodes;
}

