import {NMS_L02_P001_IR as IR} from './generated/nms-l02-p001-source-ir-v1';
import type {P001Matrix,P001Pose} from './nms-l02-p001-source-contract-v1';
export interface P001Node{readonly characterId:number;readonly instancePath:string;readonly matrix:P001Matrix;readonly alpha:number;}
export interface P001FrameState{readonly animationId:string;readonly frame:number;readonly frameDomain:string;readonly rootFrame:number;readonly mainFrame:number|null;readonly seed:number;readonly replay:number;readonly language:'en'|'es';readonly nodes:readonly P001Node[];readonly visibleTextIds:readonly number[];}
export function p001Multiply(a:P001Matrix,b:P001Matrix):P001Matrix{return Object.freeze([a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]);}
export function getNmsL2P001FrameState(frame:number,context:{frameDomain?:string;seed:number;replay?:number;lang:'en'|'es'}):P001FrameState{
 const domain=context.frameDomain??'sprite-113',max=domain==='root'?10:domain==='sprite-113'?136:0;
 if(!['en','es'].includes(context.lang)||!Number.isSafeInteger(frame)||frame<1||frame>max||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('NMS_L2_P001_INVALID_FRAME_IDENTITY');
 const mainFrame=domain==='root'?(frame>=6?frame-5:null):domain==='sprite-113'?frame:null,nodes:P001Node[]=[];
 function visit(poses:readonly P001Pose[],parent:P001Matrix,alpha:number,prefix:string){for(const pose of poses){const matrix=p001Multiply(parent,pose.matrix),opacity=alpha*pose.alpha,instancePath=prefix+'/'+pose.depth+':'+pose.characterId;
  if(pose.characterId===112)visit(IR.child112,matrix,opacity,instancePath);else nodes.push(Object.freeze({characterId:pose.characterId,instancePath,matrix,alpha:opacity}));}}
 if(mainFrame!==null)visit(IR.frames[mainFrame-1]!,IR.runtime.rootPlacement,1,'root:6/sprite-113');
 const textIds=new Set(IR.texts.map(t=>t.characterId));return Object.freeze({animationId:IR.animationId,frame,frameDomain:domain,rootFrame:domain==='root'?frame:6,mainFrame,seed:context.seed,replay:context.replay??0,language:context.lang,nodes:Object.freeze(nodes),visibleTextIds:Object.freeze([...new Set(nodes.filter(n=>n.alpha>0&&textIds.has(n.characterId)).map(n=>n.characterId))])});
}
/** Standalone child has no terminal DoAction. Loop is the source default;
 * hold is an explicit modern-host disposition, not proof of original-host behavior. */
export function p001FrameAtMilliseconds(ms:number,mode:'loop'|'hold'='loop'){
 if(!['loop','hold'].includes(mode)||!Number.isFinite(ms)||ms<0||ms>Number.MAX_SAFE_INTEGER/12)throw Error('NMS_L2_P001_INVALID_TIME');const elapsed=Math.floor(ms*12/1000);return mode==='loop'?elapsed%136+1:Math.min(elapsed+1,136);
}
