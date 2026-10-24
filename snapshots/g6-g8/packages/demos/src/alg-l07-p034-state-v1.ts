import {ALG_L07_P034_SOURCE as S,type P034SourceTerm,type P034SourceTile,type P034SourceTarget} from './alg-l07-p034-source-v1';
export {ALG_L07_P034_SOURCE} from './alg-l07-p034-source-v1';
export type P034Term=P034SourceTerm;
export type P034Tile=P034SourceTile;
export type P034Target=P034SourceTarget;
export type P034State={epoch:number;replay:number;mainFrame:number;phase:'prequiz'|'quiz-held'|'feedback'|'postquiz'|'ended'|'left';playing:boolean;
 quizSection:boolean;quizDragCount:number;placed:Partial<Record<P034Target,P034Tile>>;selected:P034Tile|null;popup:boolean;
 feedback:null|{spriteId:60|62;frame:number};glossary:P034Term|null;lessonCompleted:false};
export type P034Event={type:'play'|'pause'|'replay'|'leave'|'close-popup'|'close-glossary';epoch:number}|
 {type:'advance-main'|'advance-feedback';epoch:number;frame:number}|{type:'press';epoch:number;tile:P034Tile}|
 {type:'drop';epoch:number;target:P034Target|null}|{type:'open-glossary';epoch:number;term:P034Term};
export function p034InitialState(epoch=0,replay=0):P034State{return{epoch,replay,mainFrame:1,phase:'prequiz',playing:false,quizSection:false,quizDragCount:0,placed:{},selected:null,popup:false,feedback:null,glossary:null,lessonCompleted:false};}
export function p034Visual(frame:number){if(!Number.isSafeInteger(frame)||frame<1||frame>S.mainFrameCount)throw Error('P034_MAIN_FRAME');return S.visualStates.find(s=>s.first<=frame&&frame<=s.last)!.value;}
export function p034CanPlay(s:P034State){return !s.glossary&&!s.selected&&['prequiz','feedback','postquiz'].includes(s.phase);}
export function p034CanPress(s:P034State,tile:P034Tile){return s.quizSection&&!s.glossary&&['quiz-held','feedback'].includes(s.phase)&&S.drops.some(d=>d.name===tile)&&!Object.values(s.placed).includes(tile);}
/** Source166 owns four distinct tiles. Count increments on a valid release, but
 * main playback resumes only at right-coach62 frame20 after the fourth drop. */
export function p034Reduce(s:P034State,e:P034Event):P034State{
 if(e.epoch!==s.epoch||s.phase==='left')return s;
 if(e.type==='leave'||e.type==='replay')return{...p034InitialState(s.epoch+1,s.replay+(e.type==='replay'?1:0)),phase:e.type==='leave'?'left':'prequiz'};
 if(e.type==='pause')return s.playing?{...s,playing:false}:s;
 if(e.type==='play')return p034CanPlay(s)&&!s.playing?{...s,playing:true}:s;
 if(e.type==='open-glossary')return !s.glossary&&p034Visual(s.mainFrame).terms.includes(e.term)?{...s,glossary:e.term,playing:false}:s;
 if(e.type==='close-glossary')return s.glossary?{...s,glossary:null,playing:false}:s;
 if(s.glossary)return s;
 if(e.type==='close-popup')return s.popup?{...s,popup:false}:s;
 if(e.type==='advance-main'){
  if(!s.playing||!['prequiz','postquiz'].includes(s.phase)||!Number.isSafeInteger(e.frame)||e.frame<=s.mainFrame||e.frame>S.mainFrameCount)return s;
  if(s.phase==='prequiz'&&e.frame>=S.quizFrame)return{...s,mainFrame:S.quizFrame,phase:'quiz-held',playing:false,quizSection:true,quizDragCount:0,placed:{},popup:false};
  if(e.frame===S.mainFrameCount)return{...s,mainFrame:e.frame,phase:'ended',playing:false};
  return{...s,mainFrame:e.frame};
 }
 if(e.type==='press'){
  if(!p034CanPress(s,e.tile))return s;
  // Both coaches stop at1 on every source press, including an interrupted cue.
  return{...s,epoch:s.epoch+1,selected:e.tile,feedback:null,popup:false,phase:'quiz-held',playing:false};
 }
 if(e.type==='drop'){
  if(!s.selected||!s.quizSection||s.phase!=='quiz-held')return s;
  const tile=S.drops.find(t=>t.name===s.selected)!,ok=e.target!==null&&!s.placed[e.target]&&tile.allowedTargets.includes(e.target);
  return{...s,epoch:s.epoch+1,placed:ok?{...s.placed,[e.target!]:s.selected}:s.placed,quizDragCount:s.quizDragCount+(ok?1:0),selected:null,popup:!ok,phase:'feedback',playing:true,feedback:{spriteId:ok?62:60,frame:2}};
 }
 if(e.type==='advance-feedback'){
  const f=s.feedback;if(!s.playing||s.phase!=='feedback'||!f||!Number.isSafeInteger(e.frame)||e.frame<=f.frame||e.frame>21)return s;
  if(f.spriteId===62&&e.frame>=20&&s.quizDragCount===4)return{...s,epoch:s.epoch+1,phase:'postquiz',playing:true,quizSection:false,quizDragCount:0,feedback:null,popup:false};
  // A coach without a main-resume call naturally wraps after20 to its stop at1.
  if(e.frame===21)return{...s,epoch:s.epoch+1,phase:'quiz-held',playing:false,feedback:null};
  return{...s,feedback:{...f,frame:e.frame}};
 }
 return s;
}
