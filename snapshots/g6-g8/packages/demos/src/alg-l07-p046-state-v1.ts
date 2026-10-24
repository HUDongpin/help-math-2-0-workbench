import {ALG_L07_P046_SOURCE as S,type P046FeedbackId,type P046PointName,type P046SourceTerm} from './alg-l07-p046-source-v1';
export {ALG_L07_P046_SOURCE} from './alg-l07-p046-source-v1';
export type {P046FeedbackId,P046PointName} from './alg-l07-p046-source-v1';
export type P046Term=P046SourceTerm;
export interface P046Point {readonly x:number;readonly y:number;}
export interface P046Clone extends P046Point {readonly name:`Mc_${number}`;readonly enabled:boolean;}
export interface P046Feedback {readonly spriteId:P046FeedbackId;readonly kind:'right'|'wrong';readonly frame:number;readonly closing:boolean;readonly serial:number;readonly running:boolean;readonly message:string;}
export interface P046State {
 readonly epoch:number;readonly replay:number;readonly phase:'prequiz'|'quiz-held'|'postquiz'|'ended'|'left';readonly mainFrame:number;readonly playing:boolean;readonly mainRunning:boolean;
 readonly quizSection:boolean;readonly quizTryCount:number;readonly mcCount:number;readonly Y:string;readonly C:string;readonly firstPoint:boolean;
 readonly controlsEnabled:boolean;readonly helpEnabled:boolean;readonly disabled:readonly P046PointName[];readonly highlighted:readonly P046PointName[];readonly clones:readonly P046Clone[];
 readonly line:null|{readonly from:P046Point;readonly to:P046Point;readonly visible:boolean};readonly feedback:readonly P046Feedback[];readonly selectionSerial:number;
 readonly help:boolean;readonly prompt:string|null;readonly glossary:P046Term|null;readonly lessonCompleted:false;
}
export type P046Draw=(max:3|4,kind:'right'|'wrong')=>number;
export type P046Event={readonly epoch:number}&(
 |{readonly type:'play'|'pause'|'replay'|'leave'|'submit'|'open-help'|'close-help'|'close-prompt'|'close-glossary'}
 |{readonly type:'advance-main';readonly frame:number}
 |{readonly type:'advance-feedback';readonly frame:number;readonly spriteId:P046FeedbackId;readonly serial:number}
 |{readonly type:'close-feedback';readonly spriteId:P046FeedbackId}
 |{readonly type:'named-point';readonly name:P046PointName}
 |{readonly type:'background-point';readonly point:P046Point}
 |{readonly type:'clone-point';readonly name:string}
 |{readonly type:'open-glossary';readonly term:P046Term});
const named=S.points.map(p=>p.name),others=named.slice(1);
export function p046InitialState(epoch=0,replay=0):P046State {
 return {epoch,replay,phase:'prequiz',mainFrame:1,playing:false,mainRunning:true,quizSection:false,quizTryCount:0,mcCount:100,Y:'',C:'',firstPoint:false,controlsEnabled:false,helpEnabled:false,disabled:[],highlighted:[],clones:[],line:null,feedback:[],selectionSerial:0,help:false,prompt:null,glossary:null,lessonCompleted:false};
}
export function p046Branch(id:P046FeedbackId){const b=S.branches.find(b=>b.spriteId===id);if(!b)throw Error('P046_UNKNOWN_FEEDBACK');return b;}
export function p046SourceDraw(max:3|4,unit:()=>number=Math.random){const n=unit();if(!Number.isFinite(n)||n<0||n>=1)throw RangeError('P046_RANDOM_UNIT');return Math.floor(n*max)+1;}
export function p046CanInteract(s:P046State){return s.mainFrame===318&&s.controlsEnabled&&!s.help&&!s.prompt&&!s.glossary&&s.phase!=='left';}
export function p046CanPlay(s:P046State){return !s.playing&&!s.glossary&&s.phase!=='left'&&(s.mainRunning||s.feedback.some(f=>f.running));}
export function p046CanClose(s:P046State,id:P046FeedbackId){const f=s.feedback.find(f=>f.spriteId===id),b=p046Branch(id);return Boolean(f&&b.kind==='wrong'&&!f.closing&&f.frame>=b.closeFirst&&f.frame<=b.hold&&!s.help&&!s.prompt&&!s.glossary);}
function enabled(s:P046State,yes:boolean):P046State {return {...s,controlsEnabled:yes&&s.mainFrame===318,helpEnabled:yes&&s.mainFrame===318,disabled:yes?[]:named,clones:s.clones.map(p=>({...p,enabled:yes}))};}
function prompt(s:P046State,text:string):P046State {return {...enabled(s,false),prompt:text};}
function location(s:P046State,name:string):P046Point {const p=S.points.find(p=>p.name===name)??s.clones.find(p=>p.name===name);if(!p)throw Error('P046_SOURCE_POINT_MISSING');return {x:p.x,y:p.y};}
/** Source coordinates are twips in sprite288; no grid snapping is added. */
export function p046Reduce(s:P046State,e:P046Event,draw:P046Draw=(max)=>p046SourceDraw(max)):P046State {
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='leave')return {...p046InitialState(s.epoch+1,s.replay),phase:'left',mainRunning:false};
 if(e.type==='replay')return p046InitialState(s.epoch+1,s.replay+1);
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return p046CanPlay(s)?{...s,playing:true}:s;
 if(e.type==='advance-main'){
  if(!s.playing||!s.mainRunning||s.glossary||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>641)return s;
  const frame=s.phase==='prequiz'?Math.min(e.frame,318):e.frame;
  if(frame<318&&s.phase==='prequiz')return {...s,mainFrame:frame};
  if(frame===318&&s.phase==='prequiz')return {...s,mainFrame:318,phase:'quiz-held',mainRunning:false,playing:false,controlsEnabled:true,helpEnabled:true,quizSection:true};
  // The source removes quiz placements at319; dynamic clones and Help125 survive.
  return {...s,mainFrame:frame,phase:frame===641?'ended':'postquiz',mainRunning:frame!==641,playing:frame!==641,controlsEnabled:false,helpEnabled:false,feedback:[],disabled:[],highlighted:[],prompt:null};
 }
 if(e.type==='named-point'){
  if(!p046CanInteract(s)||!named.includes(e.name)||s.disabled.includes(e.name))return s;
  if(s.Y&&s.C)return prompt(s,S.messages[4]);
  return {...s,[e.name==='PT_1'?'Y':'C']:e.name,disabled:[...s.disabled,e.name],highlighted:[...new Set([...s.highlighted,e.name])]};
 }
 if(e.type==='background-point'){
  if(!p046CanInteract(s)||!Number.isFinite(e.point.x)||!Number.isFinite(e.point.y))return s;
  if(s.Y&&s.C)return prompt(s,S.messages[3]);
  const count=s.mcCount+1,name=`Mc_${count}` as const;
  return {...s,mcCount:count,[s.Y?'C':'Y']:name,clones:[...s.clones,{...e.point,name,enabled:true}]};
 }
 if(e.type==='clone-point'){
  if(s.glossary||s.help||s.prompt)return s;const p=s.clones.find(p=>p.name===e.name);if(!p?.enabled)return s;
  return {...s,firstPoint:true,clones:s.clones.map(p=>p.name===e.name?{...p,enabled:false}:p)};
 }
 if(e.type==='submit'){
  if(!p046CanInteract(s))return s;
  if(!s.Y||!s.C)return prompt(s,S.messages[0]);
  let Y=s.Y,C=s.C;if(Y==='PT_1'&&others.includes(C as P046PointName)){Y='PT_3';C='PT_5';}
  const right=others.includes(Y as P046PointName)&&others.includes(C as P046PointName),kind=right?'right':'wrong',max=right?4:3,index=draw(max,kind);
  if(!Number.isSafeInteger(index)||index<1||index>max)throw RangeError('P046_FEEDBACK_DRAW');
  const b=S.branches.find(b=>b.kind===kind&&b.index===index)!;const serial=s.selectionSerial+1,count=s.quizTryCount+(right?0:1);
  const feedback:P046Feedback={spriteId:b.spriteId,kind,frame:2,closing:false,serial,running:true,message:right?'':S.messages[count===1?1:2]};
  const next:P046State={...s,Y:right?Y:'',C:right?C:'',quizTryCount:count,playing:true,selectionSerial:serial,line:{from:location(s,C),to:location(s,Y),visible:true},feedback:[...s.feedback.filter(f=>f.spriteId!==b.spriteId),feedback]};
  // A fresh call restarts only the selected clip. Other right clips keep running.
  return right?next:enabled(next,false);
 }
 if(e.type==='advance-feedback'){
  const f=s.feedback.find(f=>f.spriteId===e.spriteId&&f.serial===e.serial);if(!f||!s.playing||s.glossary||!f.running||!Number.isSafeInteger(e.frame)||e.frame<=f.frame)return s;
  const b=p046Branch(f.spriteId);if(e.frame>b.terminal)return s;
  const frame=b.kind==='wrong'&&!f.closing?Math.min(e.frame,b.hold):e.frame;
  if(frame===b.terminal){
   const resume=b.kind==='right'||s.quizTryCount>=2;
   const next:P046State={...s,phase:resume?'postquiz':s.phase,mainRunning:resume||s.mainRunning,quizSection:resume?false:s.quizSection,quizTryCount:b.kind==='wrong'&&resume?0:s.quizTryCount,helpEnabled:b.kind==='right'?false:s.helpEnabled,line:s.line?{...s.line,visible:false}:null,feedback:s.feedback.filter(x=>x.spriteId!==f.spriteId),clones:b.kind==='wrong'?[]:s.clones};
   const result=b.kind==='wrong'?enabled(next,true):next;
   return {...result,playing:result.mainRunning||result.feedback.some(f=>f.running)};
  }
  const running=!(b.kind==='wrong'&&!f.closing&&frame===b.hold),feedback=s.feedback.map(x=>x.spriteId===f.spriteId?{...f,frame,running}:x);
  return {...s,feedback,playing:s.mainRunning||feedback.some(f=>f.running)};
 }
 if(e.type==='close-feedback'){
  if(!p046CanClose(s,e.spriteId))return s;const b=p046Branch(e.spriteId);if(b.kind!=='wrong')return s;
  return {...s,playing:true,feedback:s.feedback.map(f=>f.spriteId===e.spriteId?{...f,frame:b.closeJump,closing:true,running:true}:f)};
 }
 if(e.type==='open-help')return p046CanInteract(s)&&s.helpEnabled?{...enabled(s,false),help:true}:s;
 if(e.type==='close-help')return s.help&&!s.glossary?{...enabled(s,true),help:false}:s;
 if(e.type==='close-prompt')return s.prompt&&!s.glossary?{...enabled(s,true),prompt:null}:s;
 if(e.type==='open-glossary')return !s.glossary&&S.terms.some(t=>t.sourceActionKey===e.term)?{...s,glossary:e.term,playing:false}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null}:s;
 return s;
}
