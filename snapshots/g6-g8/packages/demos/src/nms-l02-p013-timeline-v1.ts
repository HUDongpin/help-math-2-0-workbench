import {P013_IR as IR} from './generated/nms-l02-p013-source-ir-v1';
import type {P013Matrix,P013Pose} from './nms-l02-p013-source-contract-v1';
function freeze<T>(v:T):T {if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x);}return v;}
freeze(IR);
export const P013_ID='shared-nms002-l02-p013';
export const P013_ITEMS=freeze([
 {id:1,name:'Mc_1',characterId:76,color:'#ff0000',colorName:'red',angle:210},
 {id:2,name:'Mc_2',characterId:80,color:'#9966ff',colorName:'purple',angle:270},
 {id:3,name:'Mc_3',characterId:72,color:'#ff9900',colorName:'orange',angle:330},
 {id:4,name:'Mc_4',characterId:68,color:'#ffff00',colorName:'yellow',angle:30},
 {id:5,name:'Mc_5',characterId:74,color:'#00cc00',colorName:'green',angle:90},
 {id:6,name:'Mc_6',characterId:78,color:'#50dcfe',colorName:'blue',angle:150},
] as const);
// Degrees begin at the positive x-axis. Right half fills clockwise from the top.
export const P013_TARGET_ANGLES=Object.freeze([270,330,30] as const);
export const P013_WRONG=freeze([{start:3,end:16,label:'S1'},{start:18,end:27,label:'S2'},{start:31,end:36,label:'S3'},{start:40,end:54,label:'S4'}] as const);
export const P013_WRONG_TEXT='Equivalent fractions are equal to the same quantity. Try Again.';
export type P013Phase='intro'|'exercise'|'correct'|'outro'|'completed';
export interface P013State {
 readonly phase:P013Phase;readonly mainFrame:number;readonly used:readonly number[];
 readonly picked:number|null;readonly input:'pointer'|'keyboard'|null;
 readonly wrongOpen:boolean;readonly wrongFrame:number|null;readonly wrongBranch:number|null;
 readonly correctFrame:number|null;readonly closeFrame:number|null;readonly closeHeld:boolean;
 readonly seed:number;readonly replay:number;readonly attempts:number;readonly wrongAttempts:number;
}
export function p013Initial(seed=0,replay=0):P013State {
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff||!Number.isInteger(replay)||replay<0)throw Error('P013_BAD_SEED');
 return freeze({phase:'intro',mainFrame:1,used:[],picked:null,input:null,wrongOpen:false,wrongFrame:null,wrongBranch:null,correctFrame:null,closeFrame:null,closeHeld:false,seed,replay,attempts:0,wrongAttempts:0});
}
export const p013Enabled=(s:P013State)=>s.phase==='exercise'&&!s.wrongOpen;
export function p013Pick(s:P013State,id:number,input:'pointer'|'keyboard'):P013State {
 if(!p013Enabled(s)||s.picked!==null||!P013_ITEMS.some(p=>p.id===id)||s.used.includes(id))return s;
 return freeze({...s,picked:id,input});
}
export function p013Cancel(s:P013State):P013State {return s.picked===null?s:freeze({...s,picked:null,input:null});}
/** Reproducible modern selector; never an Adobe RNG equality claim. */
export function p013WrongBranch(seed:number,attempt:number) {
 let n=(seed+Math.imul(attempt+1,0x9e3779b9))>>>0;n^=n>>>16;n=Math.imul(n,0x21f0aaad);n^=n>>>15;n=Math.imul(n,0x735a2d97);n^=n>>>15;return(n>>>0)%4;
}
export function p013Drop(s:P013State,inTarget:boolean):P013State {
 if(!p013Enabled(s)||s.picked===null)return s;
 if(inTarget){const used=[...s.used,s.picked];return freeze({...s,picked:null,input:null,used,attempts:s.attempts+1,phase:used.length===3?'correct':'exercise',correctFrame:used.length===3?2:null});}
 const branch=p013WrongBranch(s.seed,s.wrongAttempts);
 return freeze({...s,picked:null,input:null,wrongOpen:true,wrongFrame:P013_WRONG[branch].start,wrongBranch:branch,attempts:s.attempts+1,wrongAttempts:s.wrongAttempts+1});
}
export function p013Place(s:P013State,id:number):P013State {return p013Drop(p013Pick(s,id,'keyboard'),true);}
export function p013ClosePress(s:P013State):P013State {return !s.wrongOpen||s.closeHeld?s:freeze({...s,closeHeld:true,closeFrame:1});}
export function p013CloseRelease(s:P013State,activate:boolean):P013State {
 if(!s.wrongOpen&&!s.closeHeld)return s;
 return freeze({...s,closeHeld:false,closeFrame:null,wrongOpen:activate?false:s.wrongOpen});
}
export function p013Tick(s:P013State):P013State {
 let next={...s};let changed=false;
 if(s.phase==='intro'||s.phase==='outro') {
  const end=s.phase==='intro'?153:243;next.mainFrame=Math.min(end,s.mainFrame+1);changed=true;
  if(next.mainFrame===end)next.phase=s.phase==='intro'?'exercise':'completed';
 }
 if(s.wrongFrame!==null){changed=true;const frame=s.wrongFrame+1;next.wrongFrame=frame>=P013_WRONG[s.wrongBranch!].end?null:frame;if(next.wrongFrame===null)next.wrongBranch=null;}
 if(s.correctFrame!==null){changed=true;const frame=s.correctFrame+1;next.correctFrame=frame>=25?null:frame;if(frame>=25)next.phase='outro';}
 if(s.closeHeld&&s.closeFrame!==null&&s.closeFrame<5){changed=true;next.closeFrame=s.closeFrame+1;}
 return changed?freeze(next):s;
}
export function p013Advance(s:P013State,frames:number) {if(!Number.isInteger(frames)||frames<0||frames>100000)throw Error('P013_BAD_ADVANCE');for(let i=0;i<frames;i++){const next=p013Tick(s);if(next===s)break;s=next;}return s;}
export const p013ClockActive=(s:P013State)=>s.phase==='intro'||s.phase==='outro'||s.correctFrame!==null||s.wrongFrame!==null||(s.closeHeld&&s.closeFrame!==null&&s.closeFrame<5);
export function p013LocalPoses(domain:string,frame:number):readonly P013Pose[] {
 if(!Object.hasOwn(IR.domains,domain))throw Error('P013_BAD_DOMAIN');const d=IR.domains[domain];if(!Number.isInteger(frame)||frame<1||frame>d.frameCount)throw Error('P013_BAD_FRAME');return d.frames[frame-1].map(i=>IR.poses[i]);
}
export const p013Multiply=(a:P013Matrix,b:P013Matrix):P013Matrix=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
export interface P013Node extends P013Pose {readonly instancePath:string;readonly ancestorNames:readonly string[];}
/** Stop-aware structural query; explicit domain queries remain diagnostic, not natural traces. */
export function p013SourceNodes(domain:string,frame:number,s?:P013State):readonly P013Node[] {
 const out:P013Node[]=[];
 const visit=(name:string,f:number,m:P013Matrix,pc:readonly number[],path:string,names:readonly string[],depth:number)=>{
  if(depth>20)throw Error('P013_SOURCE_RECURSION');
  for(const p of p013LocalPoses(name,f)) {
   if(p.clipDepth)throw Error('P013_UNEXPECTED_MASK');
   if(s&&p.name&&(/^Mc_[1-6](_Txt)?$/).test(p.name)&&s.used.includes(Number(p.name[3])))continue;
   if(p.name==='Mc_Wrong_Feed'&&(!s||!s.wrongOpen))continue;
   const matrix=p013Multiply(m,p.matrix),color=p.color.map((v,i)=>i<4?v*pc[i]:v*pc[i-4]+pc[i]);
   const instancePath=path+'/d'+p.depth+'g'+p.generation+'c'+p.characterId,ancestorNames=p.name?[...names,p.name]:names;
   if(s){const slot=ancestorNames.find(n=>/^Mc_Temp_[1-3]$/.test(n));if(slot){const index=Number(slot.at(-1))-1,item=s.used[index];if(item&&(index>0||ancestorNames.includes('Mc_Dummy'))){const rgb=P013_ITEMS[item-1].color;color[0]=color[1]=color[2]=0;for(let k=0;k<3;k++)color[k+4]=parseInt(rgb.slice(1+k*2,3+k*2),16)/255;}}}
   const child=String(p.characterId);
   if(Object.hasOwn(IR.domains,child)) {
    const frames=IR.domains[child].frameCount;
    let local=frames===1?1:(f-p.birthFrame)%frames+1;
    if(child==='123')local=s?.mainFrame??1;
    if(child==='58')local=s&&s.mainFrame>=153?s.used.length+1:1;
    if(child==='103'||child==='105')local=1;
    if(child==='107')local=s?.wrongFrame??1;
    if(child==='111')local=s?.correctFrame??1;
    if(child==='99')local=s?.closeFrame??1;
    visit(child,local,matrix,color,instancePath,ancestorNames,depth+1);
   } else out.push({...p,matrix,color,instancePath,ancestorNames});
  }
 };
 visit(domain,frame,[1,0,0,1,0,0],[1,1,1,1,0,0,0,0],domain,[],0);return out;
}
export function p013Teaching(s:P013State) {
 const poses=p013LocalPoses('123',s.mainFrame),alpha=(id:number)=>poses.find(p=>p.characterId===id)?.color[3]??0;
 const move=poses.find(p=>p.characterId===68&&!p.name),cursor=poses.find(p=>p.characterId===66)||poses.find(p=>p.characterId===64);
 // Retain source-authored matrices in normalized two-circle coordinates.
 return freeze({promptOpacity:alpha(29),circlesOpacity:s.mainFrame<153?Math.max(alpha(37),alpha(69)):1,
  termEmphasis:alpha(60)>0,termEnabled:alpha(29)===1&&!s.wrongOpen,
  demoMoving:!!move,demoDeposited:s.mainFrame>=87&&s.mainFrame<=94,
  demoMove:move?{x:(move.matrix[4]-91.45)/180.5,y:(move.matrix[5]-52.5)/100}:null,
  cursor:cursor?{x:(cursor.matrix[4]+89.05)/159.5,y:(cursor.matrix[5]-27.65)/100,opacity:cursor.color[3],hand:cursor.characterId===66}:null,
  goalHalf:s.mainFrame<153,threeSixthsOpacity:alpha(113),equalsOpacity:alpha(117),halfOpacity:alpha(119),
  threeSixthsEmphasis:alpha(115)>0,halfEmphasis:alpha(121)>0,
  targetColors:s.used.map(id=>P013_ITEMS[id-1].color),enabled:p013Enabled(s)});
}

export interface P013Fractions {readonly main:number;readonly wrong:number;readonly correct:number;readonly close:number;}
export const P013_ZERO_FRACTIONS=Object.freeze({main:0,wrong:0,correct:0,close:0});
/** Each source MovieClip retains its own sub-frame clock when an event starts another clip. */
export function p013Elapse(s:P013State,f:P013Fractions,seconds:number):{state:P013State;fractions:P013Fractions} {
 if(!Number.isFinite(seconds)||seconds<0)throw Error('P013_BAD_ELAPSE');
 let state={...s},fractions={...f},mainSeconds=seconds;
 const advance=(frame:number,fraction:number,end:number,dt:number)=>{
  const value=frame+fraction+dt*12;const reached=value>=end-1e-8;
  return {frame:reached?end:Math.floor(value+1e-8),fraction:reached?0:Math.max(0,value-Math.floor(value+1e-8)),reached};
 };
 if(s.wrongFrame!==null){const q=advance(s.wrongFrame,f.wrong,P013_WRONG[s.wrongBranch!].end,seconds);state.wrongFrame=q.reached?null:q.frame;state.wrongBranch=q.reached?null:s.wrongBranch;fractions.wrong=q.fraction;}
 if(s.closeFrame!==null&&s.closeHeld){const q=advance(s.closeFrame,f.close,5,seconds);state.closeFrame=q.frame;fractions.close=q.fraction;}
 if(s.correctFrame!==null){const q=advance(s.correctFrame,f.correct,25,seconds);state.correctFrame=q.reached?null:q.frame;fractions.correct=q.fraction;if(q.reached){state.phase='outro';mainSeconds=Math.max(0,seconds-(25-s.correctFrame-f.correct)/12);}}
 if(state.phase==='intro'||state.phase==='outro') {
  const end=state.phase==='intro'?153:243,q=advance(s.mainFrame,f.main,end,mainSeconds);state.mainFrame=q.frame;fractions.main=q.fraction;
  if(q.reached)state.phase=state.phase==='intro'?'exercise':'completed';
 }
 return freeze({state, fractions});
}
