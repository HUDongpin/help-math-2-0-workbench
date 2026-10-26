import{p026Initial,p026Tick,p026Choose,p026Replay,type P026State}from'./nms-l02-p026-state-v1';
export interface P026Clock{readonly game:P026State;readonly paused:boolean;readonly fractionalTick:number;}
export function p026ClockInitial(seed:number):P026Clock{return Object.freeze({game:p026Initial(seed),paused:true,fractionalTick:0});}
export function p026ClockPause(s:P026Clock,paused:boolean):P026Clock{if(s.game.phase==='completed'&&!paused)return s;return s.paused===paused?s:Object.freeze({...s,paused});}
/** Delta is active wall time; waiting/board motion consumes ticks without moving
 * the main source/audio playhead. A paused clock consumes neither time stream. */
export function p026ClockAdvance(s:P026Clock,seconds:number):P026Clock{
 if(!Number.isFinite(seconds)||seconds<0||seconds>Number.MAX_SAFE_INTEGER/24)throw Error('P026_CLOCK_DELTA');
 if(s.paused||s.game.phase==='completed'||seconds===0)return s;
 const total=s.fractionalTick+seconds*12,whole=Math.floor(total+1e-9),fractionalTick=Math.max(0,total-whole);let game=s.game;
 for(let i=0;i<whole;i++){const next=p026Tick(game);if(next===game)break;game=next;}
 return Object.freeze({game,paused:game.phase==='completed',fractionalTick:game.phase==='completed'?0:fractionalTick});
}
export function p026ClockChoose(s:P026Clock,id:number):P026Clock{if(s.paused)return s;const game=p026Choose(s.game,id);return game===s.game?s:Object.freeze({...s,game});}
export function p026ClockReplay(s:P026Clock):P026Clock{return Object.freeze({game:p026Replay(s.game),paused:true,fractionalTick:0});}
export function p026MainAudioSeconds(s:P026Clock):number{
 if(s.game.phase==='completed')return 491/12;
 const moving=s.game.phase==='intro'||s.game.phase==='between'||s.game.phase==='outro';return(s.game.mainFrame-1+(moving?s.fractionalTick:0))/12;
}
export function p026MainAudioBoundary(s:P026Clock):number|null{
 return s.game.phase==='intro'?391/12:s.game.phase==='between'?424/12:s.game.phase==='outro'?491/12:null;
}
