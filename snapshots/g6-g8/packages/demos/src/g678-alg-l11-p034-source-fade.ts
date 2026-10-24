import {useEffect,useRef,useState} from "react";
import {G678_ALG_L11_P034_SOURCE_FADE as SOURCE} from "./generated/g678-alg-l11-p034-source-fade-v1";

export interface AlgL11P034RevealClock {
  readonly identity:string;
  readonly elapsedByPair:Readonly<Record<number,number>>;
}
export function syncAlgL11P034RevealClock(clock:AlgL11P034RevealClock,identity:string,matched:readonly number[]):AlgL11P034RevealClock{
  if(new Set(matched).size!==matched.length||matched.some(id=>!Number.isSafeInteger(id)||id<1||id>6))throw new Error("invalid source matching pair IDs");
  const previous=clock.identity===identity?clock.elapsedByPair:{};
  return{identity,elapsedByPair:Object.fromEntries(matched.map(id=>[id,previous[id]??0]))};
}
export function advanceAlgL11P034RevealClock(clock:AlgL11P034RevealClock,deltaMs:number,paused:boolean,reducedMotion:boolean):AlgL11P034RevealClock{
  if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid source reveal elapsed time");
  if(paused&&!reducedMotion)return clock;
  return{...clock,elapsedByPair:Object.fromEntries(Object.entries(clock.elapsedByPair).map(([id,elapsed])=>[id,
    reducedMotion?SOURCE.settledAfterMs:Math.min(SOURCE.settledAfterMs,elapsed+deltaMs)]))};
}
export function algL11P034FadeState(elapsedMs:number,matched:boolean,reducedMotion=false){
  if(!Number.isFinite(elapsedMs)||elapsedMs<0)throw new Error("invalid source fade time");
  if(!matched)return{tick:0,sourceAlpha:100,opacity:1,cardVisible:true,tileVisible:false,settled:false};
  const tick=reducedMotion?SOURCE.sourceVisibleFalseTick:Math.min(SOURCE.sourceVisibleFalseTick,Math.floor(elapsedMs/SOURCE.intervalMs));
  const sourceAlpha=SOURCE.initialSourceAlpha-SOURCE.alphaDecrementPerTick*Math.min(tick,SOURCE.firstTransparentTick);
  return{tick,sourceAlpha,opacity:Math.max(0,sourceAlpha)/100,
    cardVisible:tick<SOURCE.sourceVisibleFalseTick,tileVisible:tick>=SOURCE.firstPictureVisibleTick,
    settled:tick>=SOURCE.sourceVisibleFalseTick};
}

export function useAlgL11P034RevealClock(identity:string,matched:readonly number[],paused:boolean,reducedMotion:boolean){
  const key=matched.join(",");
  const current=useRef<AlgL11P034RevealClock>({identity,elapsedByPair:{}});
  const [clock,setClock]=useState(current.current);
  useEffect(()=>{
    current.current=syncAlgL11P034RevealClock(current.current,identity,key?key.split(",").map(Number):[]);
    if(reducedMotion)current.current=advanceAlgL11P034RevealClock(current.current,0,false,true);
    setClock(current.current);
    if(paused||reducedMotion||Object.values(current.current.elapsedByPair).every(elapsed=>elapsed>=SOURCE.settledAfterMs))return;
    let last=performance.now();let handle=0;let active=true;
    const tick=(now:number)=>{
      if(!active)return;
      current.current=advanceAlgL11P034RevealClock(current.current,Math.max(0,now-last),false,false);last=now;
      setClock(current.current);
      if(Object.values(current.current.elapsedByPair).some(elapsed=>elapsed<SOURCE.settledAfterMs))handle=requestAnimationFrame(tick);
    };
    handle=requestAnimationFrame(tick);
    return()=>{
      active=false;cancelAnimationFrame(handle);
      // Preserve the fractional interval on pause or a new match; Replay/level
      // change discards it when sync sees the new identity.
      current.current=advanceAlgL11P034RevealClock(current.current,Math.max(0,performance.now()-last),false,false);
    };
  },[identity,key,paused,reducedMotion]);
  return clock.identity===identity?clock:{identity,elapsedByPair:{}};
}
