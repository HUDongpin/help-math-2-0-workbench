import {P024_IR as IR} from './generated/nms-l02-p024-source-ir-v1';
import type {P024Matrix,P024Pose} from './nms-l02-p024-source-contract-v1';
function freeze<T>(x:T):T{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.freeze(x);for(const y of Object.values(x))freeze(y);}return x;}freeze(IR);
export const P024_ID='shared-nms002-l02-p024';
export type P024Phase='intro'|'exercise'|'wrong'|'wrong-wait'|'coach'|'correct'|'completed';
export interface P024SessionState{readonly phase:P024Phase;readonly mainFrame:number;readonly localFrame:number;readonly domain:string;readonly seed:number;readonly replay:number;readonly attempts:number;readonly lastDrop:number|null;readonly placed:boolean;}
export function p024Initial(seed=0,replay=0):P024SessionState{if(!Number.isInteger(seed)||seed<0||seed>0xffffffff||!Number.isInteger(replay)||replay<0)throw Error('P024_BAD_SEED');return Object.freeze({phase:'intro',mainFrame:1,localFrame:1,domain:'98',seed,replay,attempts:0,lastDrop:null,placed:false});}
/** Native accessible drop geometry; it does not execute Flash _droptarget. */
export function p024DropIndex(x:number,y:number){return Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&x<=1&&Math.abs(y)<=32?Math.round(x*12):-1;}
export function p024Drop(s:P024SessionState,index:number):P024SessionState{if(s.phase!=='exercise'||!Number.isInteger(index)||index< -1||index>12)return s;const correct=index===3;return Object.freeze({...s,phase:correct?'coach':'wrong',domain:correct?'95':'93',localFrame:2,attempts:s.attempts+1,lastDrop:index,placed:correct});}
export function p024CloseFeedback(s:P024SessionState):P024SessionState{return ['wrong','wrong-wait'].includes(s.phase)?Object.freeze({...s,phase:'exercise',domain:'98',mainFrame:92,localFrame:92}):s;}
export function p024Tick(s:P024SessionState):P024SessionState{
 if(['exercise','wrong-wait','completed'].includes(s.phase))return s;
 if(s.phase==='intro'){const f=s.mainFrame+1;return Object.freeze({...s,mainFrame:f,localFrame:f,phase:f===92?'exercise':'intro'});}
 if(s.phase==='wrong'){const f=s.localFrame+1;return Object.freeze({...s,localFrame:f,phase:f===15?'wrong-wait':'wrong'});}
 if(s.phase==='coach'){const f=s.localFrame+1;return f>=20?Object.freeze({...s,phase:'correct',domain:'77',localFrame:2}):Object.freeze({...s,localFrame:f});}
 if(s.phase==='correct'){const f=s.localFrame+1;return f>=25?Object.freeze({...s,phase:'completed',domain:'98',mainFrame:93,localFrame:93}):Object.freeze({...s,localFrame:f});}
 throw Error('P024_BAD_PHASE');
}
export function p024Advance(s:P024SessionState,n:number){if(!Number.isInteger(n)||n<0||n>100000)throw Error('P024_BAD_ADVANCE');for(let i=0;i<n;i++){const next=p024Tick(s);if(next===s)break;s=next;}return s;}
export function p024LocalPoses(domain:string,frame:number):readonly P024Pose[]{if(!Object.hasOwn(IR.domains,domain))throw Error('P024_BAD_DOMAIN');const d=IR.domains[domain];if(!Number.isInteger(frame)||frame<1||frame>d.frameCount)throw Error('P024_BAD_FRAME');return d.frames[frame-1].map(i=>IR.poses[i]);}
export interface P024Node extends P024Pose{readonly instancePath:string;}
const identity:P024Matrix=[1,0,0,1,0,0];
const multiply=(a:P024Matrix,b:P024Matrix):P024Matrix=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
export function p024SourceNodes(domain:string,frame:number){const nodes:P024Node[]=[];const visit=(d:string,f:number,m:P024Matrix,path:string)=>{for(const p of p024LocalPoses(d,f)){const matrix=multiply(m,p.matrix),instancePath=path+'/d'+p.depth+'g'+p.generation+'c'+p.characterId,child=String(p.characterId);if(Object.hasOwn(IR.domains,child)){const stop=['Right_Feed','Pop1_mc','Coach_audio_1','Coach_audio_2'].includes(p.name??'');visit(child,stop?1:(f-p.birthFrame)%IR.domains[child].frameCount+1,matrix,instancePath);}else nodes.push({...p,matrix,instancePath});}};visit(domain,frame,identity,domain);return nodes;}
export function p024Teaching(s:P024SessionState){const row=IR.teaching[s.mainFrame-1],termEnabled=['intro','exercise','completed'].includes(s.phase);return Object.freeze({row,enabled:s.phase==='exercise',terms:Object.freeze({point:termEnabled&&row.first[1].complete,fraction:termEnabled&&row.second[1].complete}),wrong:['wrong','wrong-wait'].includes(s.phase),correct:s.phase==='correct'});}
export const p024SourceTerm=(id:string)=>IR.terms.find(t=>t.id===id);
