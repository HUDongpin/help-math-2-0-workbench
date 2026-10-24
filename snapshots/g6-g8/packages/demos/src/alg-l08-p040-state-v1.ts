import {createP040State,reduceP040,p040Question,type P040State,type P040Action,type P040AnswerFlag} from './alg-l08-p040-game-state-v2';
export{p040Box,p040SourcePredicate,p040Question}from'./alg-l08-p040-game-state-v2';
export type{P040Action,P040AnswerFlag}from'./alg-l08-p040-game-state-v2';
export interface P040ProductState{source:P040State;paused:boolean;worldTicks:number;instructionChildFrame:number;terminalQuestion:string;terminalScore:string;looseBoxVisible:boolean;looseBoxDisposition:'source-rollover-hidden'|'unverified-two-parent-release'|null;}
export function p040InitialState(seed=1):P040ProductState{return{source:createP040State(seed),paused:true,worldTicks:0,instructionChildFrame:1,terminalQuestion:'',terminalScore:'00000',looseBoxVisible:true,looseBoxDisposition:null};}
export type P040ProductAction=P040Action|{epoch:number;type:'pause'|'resume'|'loose-box-rollover'|'loose-box-release'};
export function p040Act(s:P040ProductState,a:P040ProductAction):P040ProductState{
 if(a.epoch!==s.source.epoch)return s;
 if(a.type==='pause'||a.type==='resume')return{...s,paused:a.type==='pause'};
 if(a.type==='loose-box-rollover'||a.type==='loose-box-release')return s.source.mainFrame===737?{...s,looseBoxVisible:a.type==='loose-box-rollover'?false:s.looseBoxVisible,looseBoxDisposition:a.type==='loose-box-rollover'?'source-rollover-hidden':'unverified-two-parent-release'}:s;
 const next=reduceP040(s.source,a as P040Action);if(next===s.source)return s;
 if(a.type==='replay')return{...p040InitialState(s.source.seed),source:next};
 const jump=next.mainFrame!==s.source.mainFrame;
 return{...s,source:next,looseBoxVisible:jump?true:s.looseBoxVisible,looseBoxDisposition:jump?null:s.looseBoxDisposition,
 terminalQuestion:next.game?p040Question(next)?.equation??'':s.terminalQuestion,terminalScore:next.game?.scoreCells??s.terminalScore};
}
/** The instruction clock advances main; only frame736 runs the audited game.
 * Feedback clocks are independent source owners. The world tick runs car and
 * solution first; terminal feedback arms car motion for the following tick. */
export function p040InstructionFrame(s:P040ProductState,frame:number):P040ProductState{
 if(s.source.mainFrame>=736||frame<s.source.mainFrame||frame>736)return s;
 if(frame===736)return p040Act(s,{type:'enter-game',epoch:s.source.epoch});
 return{...s,source:{...s.source,mainFrame:frame}};
}
export function p040WorldTick(s:P040ProductState):P040ProductState{
 if(s.paused)return s;let next=s.source;
 if(next.mainFrame===736&&next.game){const feedback=next.game.feedback;next=reduceP040({...next,game:{...next.game,feedback:[]}},{type:'tick',epoch:next.epoch});if(next.game)next={...next,game:{...next.game,feedback}};}
 return{...s,source:next,worldTicks:s.worldTicks+1,instructionChildFrame:s.instructionChildFrame%77+1,terminalQuestion:next.game?p040Question(next)?.equation??'':s.terminalQuestion,terminalScore:next.game?.scoreCells??s.terminalScore};
}
export function p040FeedbackFrame(s:P040ProductState,kind:P040AnswerFlag,frame:number):P040ProductState{
 const g=s.source.game,f=g?.feedback.find(x=>x.kind===kind);if(!g||!f||frame<f.frame)return s;const end=kind==='Wrong'?28:27;if(frame>end)return s;
 return{...s,source:{...s.source,game:{...g,feedback:frame===end?g.feedback.filter(x=>x.kind!==kind):g.feedback.map(x=>x.kind===kind?{...x,frame}:x),moveFlag:frame===end?true:g.moveFlag,ansFlag:frame===end?kind:g.ansFlag,car:frame===end?{...g.car,frame:2}:g.car}}};
}
