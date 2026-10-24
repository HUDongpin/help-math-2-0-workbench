import {selectHostFeedback} from './g678-advanced-manual/host-feedback-selector';
import {P010_IR as IR} from './generated/nms-l02-p010-source-ir-v1';
import type {P010Matrix,P010Pose} from './nms-l02-p010-source-contract-v1';
function freezeSource<T>(value:T):T{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freezeSource(child);}return value;}
freezeSource(IR);
export const P010_ID='shared-nms002-l02-p010';
export const P010_GLYPHS=Object.freeze(['1',',','9','9','8','.','7','5']as const);
export const P010_ANSWERS=Object.freeze(['AnsBtn1','AnsBtn2','AnsBtn3','AnsBtn4','AnsBtn5','AnsBtn6','AnsBtn7','AnsBtn8']as const);
export const P010_BRANCHES=Object.freeze({wrong:[{domain:'99',hold:22,close:23,end:28,popup:16,title:"That's incorrect!"},{domain:'51',hold:20,close:21,end:28,popup:14,title:'incorrect!'},{domain:'67',hold:21,close:22,end:28,popup:15,title:'Try Again!'}],right:[{domain:'143',end:28,title:'Correct!'},{domain:'127',end:28,title:'Good Job!'},{domain:'155',end:25,title:'Great Job!'},{domain:'175',end:33,title:'Well done!'}]}as const);
export type P010Phase='intro'|'question'|'wrong-in'|'wrong-wait'|'wrong-out'|'right'|'outro'|'completed';
export interface P010SessionState{readonly phase:P010Phase;readonly mainFrame:number;readonly localFrame:number;readonly domain:string;readonly seed:number;readonly replay:number;readonly attempts:number;readonly answer:number|null;readonly branch:number|null;readonly outcome:'wrong'|'right'|null;}
export function p010Initial(seed=0,replay=0):P010SessionState{if(!Number.isInteger(seed)||seed<0||seed>0xffffffff||!Number.isInteger(replay)||replay<0)throw Error('P010_BAD_SEED');return Object.freeze({phase:'intro',mainFrame:1,localFrame:1,domain:'176',seed,replay,attempts:0,answer:null,branch:null,outcome:null});}
export function p010Feedback(s:P010SessionState){return s.outcome&&s.branch!==null?P010_BRANCHES[s.outcome][s.branch-1]:undefined;}
export function p010WrongExplanation(answer:number){return `A decimal point is a period symbol ${answer===3||answer===4?'used':'written'} between a whole number and a decimal fraction. Try again.`;}
/** Explicit source-host adapter: selection cardinality is3/4; this seed is not Adobe RNG. */
export function p010Answer(s:P010SessionState,answer:number):P010SessionState{
 if(s.phase!=='question'||!Number.isInteger(answer)||answer<0||answer>7)return s;
 const outcome=answer===5?'right':'wrong',branch=selectHostFeedback(outcome,(s.seed+s.attempts)>>>0).branchIndex,feedback=P010_BRANCHES[outcome][branch-1];
 return Object.freeze({...s,phase:outcome==='right'?'right':'wrong-in',localFrame:2,domain:feedback.domain,attempts:s.attempts+1,answer,branch,outcome});
}
export function p010CloseFeedback(s:P010SessionState):P010SessionState{if(s.outcome!=='wrong'||s.branch===null||!['wrong-in','wrong-wait'].includes(s.phase))return s;const b=P010_BRANCHES.wrong[s.branch-1];if(s.localFrame<b.popup)return s;return Object.freeze({...s,phase:'wrong-out',localFrame:b.close});}
export function p010Tick(s:P010SessionState):P010SessionState{
 if(['question','wrong-wait','completed'].includes(s.phase))return s;
 if(s.phase==='intro'){const frame=Math.min(31,s.mainFrame+1);return Object.freeze({...s,mainFrame:frame,localFrame:frame,phase:frame===31?'question':'intro'});}
 if(s.phase==='outro'){const frame=Math.min(67,s.mainFrame+1);return Object.freeze({...s,mainFrame:frame,localFrame:frame,phase:frame===67?'completed':'outro'});}
 const branch=p010Feedback(s);if(!branch)throw Error('P010_MISSING_BRANCH');const frame=s.localFrame+1;
 if(s.phase==='wrong-in'){const b=P010_BRANCHES.wrong[s.branch!-1];return Object.freeze({...s,localFrame:Math.min(b.hold,frame),phase:frame>=b.hold?'wrong-wait':'wrong-in'});}
 if(frame>=branch.end){if(s.phase==='right')return Object.freeze({...s,phase:'outro',mainFrame:32,localFrame:32,domain:'176',branch:null});return Object.freeze({...s,phase:'question',mainFrame:31,localFrame:31,domain:'176',branch:null});}
 return Object.freeze({...s,localFrame:frame});
}
export function p010Advance(s:P010SessionState,frames:number){if(!Number.isInteger(frames)||frames<0||frames>100000)throw Error('P010_BAD_ADVANCE');for(let i=0;i<frames;i++){const next=p010Tick(s);if(next===s)break;s=next;}return s;}
export function p010LocalPoses(domain:string,frame:number):readonly P010Pose[]{if(!Object.hasOwn(IR.domains,domain))throw Error('P010_BAD_DOMAIN');const d=IR.domains[domain];if(!Number.isInteger(frame)||frame<1||frame>d.frameCount)throw Error('P010_BAD_FRAME');return d.frames[frame-1].map(i=>IR.poses[i]);}
const identity:P010Matrix=[1,0,0,1,0,0];
export const p010Multiply=(a:P010Matrix,b:P010Matrix):P010Matrix=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
export interface P010Node extends P010Pose{readonly instancePath:string;readonly masks:readonly P010Mask[];}
export interface P010Mask extends P010Pose{readonly key:string;}
/** Structural nested local-domain query. Interactive branch selection is supplied
 * separately; dormant feedback remains at its source stop1. */
export function p010SourceNodes(domain:string,frame:number):readonly P010Node[]{const nodes:P010Node[]=[];
 const visit=(name:string,f:number,m:P010Matrix,parentColor:readonly number[],inherited:readonly P010Mask[],path:string)=>{
  const masks:P010Mask[]=[];
  for(const p of p010LocalPoses(name,f)){const matrix=p010Multiply(m,p.matrix),color=p.color.map((v,i)=>i<4?v*parentColor[i]:v*parentColor[i-4]+parentColor[i]),instancePath=path+'/d'+p.depth+'g'+p.generation+'c'+p.characterId,active=[...inherited,...masks.filter(a=>p.depth>a.depth&&p.depth<=a.clipDepth)],pose={...p,matrix,color};
   if(p.clipDepth){masks.push({...pose,key:instancePath});continue;}
   const child=String(p.characterId);if(Object.hasOwn(IR.domains,child)){const isFeedback=/^Mc_(Wrong|Right)_Feed/.test(p.name??'');visit(child,isFeedback?1:(f-p.birthFrame)%IR.domains[child].frameCount+1,matrix,color,active,instancePath);}else nodes.push({...pose,instancePath,masks:active});
  }
 };visit(domain,frame,identity,[1,1,1,1,0,0,0,0],[],domain);return nodes;
}
export function p010Teaching(s:P010SessionState){const poses=p010LocalPoses('176',s.mainFrame),number=poses.find(p=>p.depth===7),question=poses.find(p=>p.depth===3);return Object.freeze({numberVisible:(number?.color[3]??0)>0,numberComplete:(number?.color[3]??0)===1,questionVisible:(question?.color[3]??0)>0,questionComplete:(question?.color[3]??0)===1,numberOpacity:number?.color[3]??0,questionOpacity:question?.color[3]??0,answersEnabled:s.phase==='question',termEnabled:(question?.color[3]??0)===1&&!s.phase.startsWith('wrong')&&s.phase!=='right'});}

export function p010FeedbackTitleVisible(s:P010SessionState){const ids:Record<string,readonly number[]>={'51':[31,32,35],'67':[55,57],'99':[73],'127':[123,124],'143':[138,139],'155':[149,150],'175':[173,174]};if(!Object.hasOwn(ids,s.domain))return false;return p010SourceNodes(s.domain,s.localFrame).some(n=>ids[s.domain].includes(n.characterId)&&n.color[3]>0&&Math.abs(n.matrix[0]*n.matrix[3]-n.matrix[1]*n.matrix[2])>1e-8);}
