import type{P031FeedbackData}from'./nms-l02-p031-feedback-contract-v1';
import{P031_FEEDBACK_IR as RAW}from'./generated/nms-l02-p031-feedback-ir-v1';
import{p031LocalPoses}from'./nms-l02-p031-source-query-v1';
import type{P031Matrix,P031Pose}from'./nms-l02-p031-feedback-contract-v1';
import type{P031SessionState}from'./nms-l02-p031-state-v1';
const IR:P031FeedbackData=RAW;
const identity:P031Matrix=[1,0,0,1,0,0];
export const p031Multiply=(a:P031Matrix,b:P031Matrix):P031Matrix=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
export interface P031Node extends P031Pose{readonly instancePath:string;readonly masks:readonly P031Mask[];}
export interface P031Mask extends P031Pose{readonly key:string;}
/** Structural nested local-domain query. Interactive branch selection is supplied
 * separately; dormant feedback remains at its source stop1. */
export function p031SourceNodes(domain:string,frame:number):readonly P031Node[]{const nodes:P031Node[]=[];
 const visit=(name:string,f:number,m:P031Matrix,parentColor:readonly number[],inherited:readonly P031Mask[],path:string)=>{
  const masks:P031Mask[]=[];
  for(const p of p031LocalPoses(name,f)){const matrix=p031Multiply(m,p.matrix),color=p.color.map((v,i)=>i<4?v*parentColor[i]:v*parentColor[i-4]+parentColor[i]),instancePath=path+'/d'+p.depth+'g'+p.generation+'c'+p.characterId,active=[...inherited,...masks.filter(a=>p.depth>a.depth&&p.depth<=a.clipDepth)],pose={...p,matrix,color};
   if(p.clipDepth){masks.push({...pose,key:instancePath});continue;}
   const child=String(p.characterId);if(Object.hasOwn(IR.domains,child)){const isFeedback=/^Mc_(Wrong|Right)_Feed/.test(p.name??'');visit(child,isFeedback?1:(f-p.birthFrame)%IR.domains[child].frameCount+1,matrix,color,active,instancePath);}else nodes.push({...pose,instancePath,masks:active});
  }
 };visit(domain,frame,identity,[1,1,1,1,0,0,0,0],[],domain);return nodes;
}

