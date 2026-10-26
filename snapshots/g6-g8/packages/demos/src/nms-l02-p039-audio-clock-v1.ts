import {P039_AUDIO_SOURCE as SOURCE} from './generated/nms-l02-p039-audio-source-v1';
import {p039Initial,p039Tick,type P039State} from './nms-l02-p039-state-v1';
export interface P039AudioClock {readonly page:P039State;readonly fraction:number;readonly coachSeconds:number|null;readonly pressSeconds:number|null;}
export function p039ClockInitial(seed=0):P039AudioClock{return Object.freeze({page:p039Initial(seed),fraction:0,coachSeconds:null,pressSeconds:null});}
export function p039PageAdvancing(s:P039State){return s.mainPlaying||s.popupPlaying||s.correctPlaying||s.revealPlaying||s.coachPlaying;}
export function p039ClockPage(clock:P039AudioClock,page:P039State):P039AudioClock{
 return Object.freeze({...clock,page,coachSeconds:page.coachBranch===null?null:page.coachSerial!==clock.page.coachSerial?0:clock.coachSeconds});
}
export function p039ClockPress(clock:P039AudioClock,pressed:boolean):P039AudioClock{return Object.freeze({...clock,pressSeconds:pressed?clock.pressSeconds??0:null});}
export function p039AdvanceClock(clock:P039AudioClock,seconds:number):P039AudioClock{
 if(!Number.isFinite(seconds)||seconds<0||seconds>3600)throw Error('P039_CLOCK_ELAPSED');
 let page=clock.page,fraction=clock.fraction,coach=clock.coachSeconds,press=clock.pressSeconds,left=seconds;
 const expire=(elapsed:number|null,dt:number,duration:number)=>elapsed===null?null:elapsed+dt>=duration-1e-9?null:elapsed+dt;
 while(left>1e-10){
  const ticking=p039PageAdvancing(page),dt=ticking?Math.min(left,(1-fraction)/12):left;
  coach=expire(coach,dt,page.coachBranch===null?0:SOURCE.coach.branches[page.coachBranch].samples/SOURCE.sampleRate);
  press=expire(press,dt,SOURCE.streams['223'].totalSamples/SOURCE.sampleRate);
  left=Math.max(0,left-dt);
  if(ticking){fraction+=dt*12;if(fraction>=1-1e-8){fraction=0;page=p039Tick(page);if(page.coachBranch===null)coach=null;}}
  else fraction=0;
 }
 if(!p039PageAdvancing(page))fraction=0;
 return Object.freeze({page,fraction,coachSeconds:coach,pressSeconds:press});
}
export interface P039AudioWindow {readonly key:string;readonly buffer:string;readonly offset:number;readonly duration:number;}
export function p039AudioWindows(clock:P039AudioClock):readonly P039AudioWindow[]{
 const s=clock.page,windows:P039AudioWindow[]=[];
 if(s.mainPlaying){const offset=(s.mainFrame-1+clock.fraction)/12,boundary=s.mainFrame<546?546:579;const duration=(boundary-s.mainFrame-clock.fraction)/12;if(duration>0)windows.push({key:'main',buffer:'237',offset,duration});}
 if(s.correctPlaying&&s.correctFrame!==null){const offset=(s.correctFrame-1+clock.fraction)/12,duration=(13-s.correctFrame-clock.fraction)/12;if(duration>0)windows.push({key:'correct',buffer:'234',offset,duration});}
 if(s.coachBranch!==null&&clock.coachSeconds!==null){const buffer='coach-'+s.coachBranch;windows.push({key:buffer+'-'+s.coachSerial,buffer,offset:clock.coachSeconds,duration:SOURCE.coach.branches[s.coachBranch].samples/SOURCE.sampleRate-clock.coachSeconds});}
 if(clock.pressSeconds!==null)windows.push({key:'press',buffer:'223',offset:clock.pressSeconds,duration:SOURCE.streams['223'].totalSamples/SOURCE.sampleRate-clock.pressSeconds});
 return Object.freeze(windows.map(w=>Object.freeze(w)));
}
