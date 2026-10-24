import{ALG_L07_P041_SOURCE as S,type P041BranchKey,type P041SourceTerm}from'./alg-l07-p041-source-v1';
export{ALG_L07_P041_SOURCE}from'./alg-l07-p041-source-v1';
export type P041Term=P041SourceTerm;
export type P041Handle=0|1;
export interface P041Point{readonly x:number;readonly y:number;}
export interface P041State{
 readonly epoch:number;readonly replay:number;readonly phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'ended'|'left';readonly mainFrame:number;readonly playing:boolean;
 readonly quizSection:boolean;readonly quizTryCount:number;readonly doneClicked:boolean;readonly doneEnabled:boolean;readonly helpEnabled:boolean;readonly handlesEnabled:boolean;readonly startDragMc:boolean;
 readonly points:readonly[P041Point,P041Point];readonly dragging:P041Handle|null;
 readonly feedback:null|{readonly key:P041BranchKey;readonly spriteId:109|126|147|159|186|200;readonly kind:'right'|'wrong';readonly frame:number;readonly closing:boolean;readonly serial:number};
 readonly selectionSerial:number;readonly help:boolean;readonly glossary:P041Term|null;readonly lessonCompleted:false;
}
export type P041Draw=(max:3|4,kind:'right'|'wrong')=>number;
export type P041Event={readonly epoch:number}&(
 |{readonly type:'play'|'pause'|'replay'|'leave'|'submit'|'close-feedback'|'open-help'|'close-help'|'close-glossary'}
 |{readonly type:'advance-main'|'advance-feedback';readonly frame:number}
 |{readonly type:'drag-start'|'drag-move';readonly handle:P041Handle;readonly point:P041Point}
 |{readonly type:'drag-end';readonly handle:P041Handle}
 |{readonly type:'open-glossary';readonly term:P041Term});
export function p041InitialState(epoch=0,replay=0):P041State{return{epoch,replay,phase:'prequiz',mainFrame:1,playing:false,quizSection:false,quizTryCount:0,doneClicked:false,doneEnabled:false,helpEnabled:false,handlesEnabled:false,startDragMc:false,points:[{...S.drag.initial[0]},{...S.drag.initial[1]}],dragging:null,feedback:null,selectionSerial:0,help:false,glossary:null,lessonCompleted:false};}
export function p041Visual(frame:number){const v=S.visualStates.find(s=>frame>=s.first&&frame<=s.last);if(!v)throw Error('P041_INVALID_VISUAL_FRAME');return v.value;}
export function p041Branch(key:P041BranchKey){const b=S.branches.find(b=>b.key===key);if(!b)throw Error('P041_INVALID_BRANCH');return b;}
export function p041SourceDraw(max:3|4,randomUnit:()=>number=Math.random){const n=randomUnit();if(!Number.isFinite(n)||n<0||n>=1)throw RangeError('P041_INVALID_RANDOM_UNIT');return Math.floor(n*max)+1;}
export function p041CanDrag(s:P041State){return s.phase==='quiz-held'&&s.handlesEnabled&&!s.help&&!s.glossary;}
export function p041CanClose(s:P041State){if(!s.feedback||s.glossary||s.help)return false;const b=p041Branch(s.feedback.key);return b.kind==='wrong'&&!s.feedback.closing&&s.feedback.frame>=b.closeFirst&&s.feedback.frame<=b.hold;}
export function p041CanPlay(s:P041State){
 if(s.playing||s.help||s.glossary)return false;
 if(s.phase==='prequiz'||s.phase==='postquiz')return true;
 if(s.phase!=='feedback'||!s.feedback)return false;const b=p041Branch(s.feedback.key);
 return !(b.kind==='wrong'&&!s.feedback.closing&&s.feedback.frame>=b.hold);
}
function clamp(p:P041Point):P041Point|null{if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return null;const b=S.drag.bounds;return{x:Math.max(b.left,Math.min(b.right,p.x)),y:Math.max(b.top,Math.min(b.bottom,p.y))};}
/** Source hitTest(object): sequential object-bound overlap followed by x-only snap.
 * Shape1 bounds are asymmetric (-3.8..4.7); alpha-zero targets still participate. */
export function p041Snap(point:P041Point):P041Point{
 let p={...point};const h=S.drag.handleBounds;
 for(const index of S.drag.presentSnapOrder){const target=S.drag.targets.find(t=>t.index===index)!,b=target.bounds;
  if(p.x+h.right>=b.left&&p.x+h.left<=b.right&&p.y+h.bottom>=b.top&&p.y+h.top<=b.bottom)p={...p,x:target.x};
 }return p;
}
/** Preserve source precedence and x-only equality, including the alternate pair. */
export function p041SourceCorrect(s:Pick<P041State,'points'|'startDragMc'>){const[a,b]=s.points,[one,two,three,four]=S.drag.targets;return(s.startDragMc&&a.x===one.x&&b.x===two.x)||(a.x===three.x&&b.x===four.x)||(s.startDragMc&&a.x===two.x&&b.x===one.x)||(a.x===four.x&&b.x===three.x);}
function replacePoint(s:P041State,handle:P041Handle,p:P041Point):readonly[P041Point,P041Point]{return handle===0?[p,s.points[1]]:[s.points[0],p];}
export function p041Reduce(s:P041State,e:P041Event,draw:P041Draw=(max)=>p041SourceDraw(max)):P041State{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='leave')return{...p041InitialState(s.epoch+1,s.replay),phase:'left'};
 if(e.type==='replay')return p041InitialState(s.epoch+1,s.replay+1);
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return p041CanPlay(s)?{...s,playing:true}:s;
 if(e.type==='advance-main'){
  if(!s.playing||s.feedback||s.help||s.glossary||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>S.mainFrameCount)return s;
  const frame=s.phase==='prequiz'?Math.min(e.frame,S.quizFrame):e.frame;
  if(s.phase==='prequiz'&&frame===S.quizFrame)return{...s,mainFrame:frame,phase:'quiz-held',playing:false,quizSection:true,quizTryCount:0,doneClicked:false,doneEnabled:false,helpEnabled:true,handlesEnabled:true,startDragMc:false,points:[{...S.drag.initial[0]},{...S.drag.initial[1]}],dragging:null};
  return{...s,mainFrame:frame,phase:frame===S.mainFrameCount?'ended':s.phase,playing:frame!==S.mainFrameCount};
 }
 if(e.type==='drag-start'||e.type==='drag-move'){
  if(!p041CanDrag(s)||(e.handle!==0&&e.handle!==1)||(e.type==='drag-move'&&s.dragging!==e.handle)||(e.type==='drag-start'&&s.dragging!==null))return s;
  const p=clamp(e.point);if(!p)return s;return{...s,dragging:e.handle,points:replacePoint(s,e.handle,p)};
 }
 if(e.type==='drag-end'){
  if(!p041CanDrag(s)||s.dragging!==e.handle)return s;const p=p041Snap(s.points[e.handle]),initial=S.drag.initial[e.handle];
  return{...s,points:replacePoint(s,e.handle,p),dragging:null,startDragMc:true,doneEnabled:s.doneEnabled||p.x!==initial.x||p.y!==initial.y};
 }
 if(e.type==='submit'){
  if(!p041CanDrag(s)||!s.doneEnabled||s.dragging!==null)return s;const kind=p041SourceCorrect(s)?'right':'wrong',max=kind==='right'?4:3,index=draw(max,kind);
  if(!Number.isSafeInteger(index)||index<1||index>max)throw RangeError('P041_INVALID_FEEDBACK_DRAW');
  const branch=p041Branch(`${kind}-${index}`as P041BranchKey),serial=s.selectionSerial+1;
  return{...s,epoch:s.epoch+1,phase:'feedback',playing:true,doneClicked:true,doneEnabled:false,helpEnabled:false,handlesEnabled:false,quizTryCount:s.quizTryCount+1,selectionSerial:serial,feedback:{key:branch.key,spriteId:branch.spriteId,kind,frame:2,closing:false,serial}};
 }
 if(e.type==='advance-feedback'){
  const f=s.feedback;if(!f||s.phase!=='feedback'||!s.playing||s.help||s.glossary||!Number.isSafeInteger(e.frame)||e.frame<=f.frame)return s;const b=p041Branch(f.key);if(e.frame>b.terminal)return s;
  const frame=b.kind==='wrong'&&!f.closing?Math.min(e.frame,b.hold):e.frame;
  if(frame===b.terminal){
   if(b.kind==='wrong')return{...s,epoch:s.epoch+1,phase:'quiz-held',playing:false,feedback:null,doneEnabled:true,helpEnabled:true,handlesEnabled:true};
   return{...s,epoch:s.epoch+1,phase:'postquiz',mainFrame:S.postQuizFrame,playing:true,quizSection:false,feedback:null,doneEnabled:false,helpEnabled:false,handlesEnabled:false};
  }return{...s,feedback:{...f,frame},playing:!(b.kind==='wrong'&&!f.closing&&frame===b.hold)};
 }
 if(e.type==='close-feedback'){
  if(!p041CanClose(s))return s;const f=s.feedback!,b=p041Branch(f.key);if(b.kind!=='wrong')return s;
  return{...s,epoch:s.epoch+1,playing:true,feedback:{...f,frame:b.closeJump,closing:true}};
 }
 if(e.type==='open-help'){
  if(s.phase!=='quiz-held'||!s.helpEnabled||s.help||s.glossary||s.dragging!==null)return s;
  return{...s,help:true,helpEnabled:false,doneEnabled:s.doneClicked?false:s.doneEnabled,playing:false};
 }
 if(e.type==='close-help'){
  if(!s.help||s.glossary)return s;return{...s,help:false,helpEnabled:true,doneEnabled:s.doneClicked?true:s.doneEnabled};
 }
 if(e.type==='open-glossary'){
  if(s.glossary||s.dragging!==null||!(s.help?S.helpTerms:p041Visual(s.mainFrame).terms).includes(e.term))return s;
  return{...s,glossary:e.term,playing:false};
 }
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null}:s;
 return s;
}
