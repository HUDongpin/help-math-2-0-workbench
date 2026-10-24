import {NMS_L02_P002_IR as IR} from './generated/nms-l02-p002-source-ir-v1';
import type {P002Matrix,P002Color,P002Pose,P002VisibleText} from './nms-l02-p002-source-contract-v1';
const IDENTITY:P002Matrix=[1,0,0,1,0,0],IDENTITY_COLOR:P002Color=[1,1,1,1,0,0,0,0];
export interface P002Mask {readonly characterId:number;readonly matrix:P002Matrix;readonly ratio:number;readonly key:string;readonly depth:number;readonly clipDepth:number;}
export interface P002Node extends P002Pose {readonly instancePath:string;readonly domain:string;readonly domainFrame:number;readonly masks:readonly P002Mask[];}
export interface P002FrameState {readonly animationId:string;readonly sourceSha256:string;readonly frame:number;readonly frameDomain:'root'|'sprite-310';readonly rootFrame:number;readonly mainFrame:number|null;readonly seed:number;readonly replay:number;readonly language:'en'|'es';readonly nodes:readonly P002Node[];readonly visibleTexts:readonly P002VisibleText[];}
export function p002Multiply(a:P002Matrix,b:P002Matrix):P002Matrix {return Object.freeze([a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]);}
/** Local-domain source query. Child32/90/313 queries have no invented root placement. */
export function getNmsL2P002DomainPoses(domain:string,frame:number):readonly P002Pose[] {
 const d=Object.hasOwn(IR.domains,domain)?IR.domains[domain]:undefined;
 if(!d||!Number.isSafeInteger(frame)||frame<1||frame>d.frameCount)throw Error('NMS_L2_P002_INVALID_DOMAIN_QUERY');
 return Object.freeze(d.frames[frame-1]!.map(index=>IR.poses[index]!));
}
export function getNmsL2P002FrameState(frame:number,context:{frameDomain?:string;seed:number;replay?:number;lang:'en'|'es'}):P002FrameState {
 const domain=context.frameDomain??'sprite-310',max=domain==='root'?10:domain==='sprite-310'?910:0;
 if(!['en','es'].includes(context.lang)||!Number.isSafeInteger(frame)||frame<1||frame>max||!Number.isSafeInteger(context.seed)||context.seed<0||context.seed>0xffffffff||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)throw Error('NMS_L2_P002_INVALID_FRAME_IDENTITY');
 const rootFrame=domain==='root'?frame:6,mainFrame=domain==='root'?(frame>=6?frame-5:null):frame,nodes:P002Node[]=[];
 function visit(name:string,localFrame:number,parent:P002Matrix,parentColor:P002Color,inherited:readonly P002Mask[],prefix:string):void {
  const masks:P002Mask[]=[];
  for(const p of getNmsL2P002DomainPoses(name,localFrame)){
   const matrix=p002Multiply(parent,p.matrix),color=Object.freeze(p.color.map((v,i)=>i<4?v*parentColor[i]!:v*parentColor[i-4]!+parentColor[i]!)) as unknown as P002Color;
   const instancePath=prefix+'/d'+p.depth+'g'+p.generation+'c'+p.characterId;
   const active=Object.freeze([...inherited,...masks.filter(m=>p.depth>m.depth&&p.depth<=m.clipDepth)]);
   if(p.clipDepth>0){masks.push(Object.freeze({characterId:p.characterId,matrix,ratio:p.ratio,key:instancePath+'f'+localFrame,depth:p.depth,clipDepth:p.clipDepth}));continue;}
   const child=IR.domains[String(p.characterId)];
   if(child){const nextFrame=p.characterId===310?mainFrame!:(localFrame-p.birthFrame)%child.frameCount+1;visit(String(p.characterId),nextFrame,matrix,color,active,instancePath+'/sprite-'+p.characterId);}
   else nodes.push(Object.freeze({...p,matrix,color,instancePath,domain:name,domainFrame:localFrame,masks:active}));
  }
 }
 visit('root',rootFrame,IDENTITY,IDENTITY_COLOR,[],'root:'+rootFrame);
 const visibleTexts=mainFrame===null?Object.freeze([]):IR.visibilityStates[IR.visibilityFrames[mainFrame-1]!]!;
 return Object.freeze({animationId:IR.animationId,sourceSha256:IR.sourceSha256,frame,frameDomain:domain as 'root'|'sprite-310',rootFrame,mainFrame,seed:context.seed,replay:context.replay??0,language:context.lang,nodes:Object.freeze(nodes),visibleTexts});
}
/** No terminal child DoAction exists. Hold is a modern-host choice, not original-host proof. */
export function p002FrameAtMilliseconds(ms:number,mode:'loop'|'hold'='loop'):number {
 if(!['loop','hold'].includes(mode)||!Number.isFinite(ms)||ms<0||ms>Number.MAX_SAFE_INTEGER/12)throw Error('NMS_L2_P002_INVALID_TIME');const elapsed=Math.floor(ms*12/1000);return mode==='loop'?elapsed%910+1:Math.min(elapsed+1,910);
}
