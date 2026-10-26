import {P048AudioTransport,type P048TransportDependencies} from './nms-l02-p048-audio-transport-v1';
import type {P048State,P048Event} from './nms-l02-p048-practice-v1';
export type P048EffectDomain='8'|'413'|'436';
/** Keyboard/click activation adapter for source button down-state streams.
 * Actual input acceptance is checked before dispatch. No sound on generic clicks.
 */
export function p048EffectForEvent(state:P048State,event:P048Event):P048EffectDomain|null {
 if(state.phase==='ready'&&!state.helpOpen){
  if(event.type==='submit'||event.type==='reset')return '413';
  if(event.type==='help'&&event.open)return '8';
 }
 if(state.phase==='wrong-feedback'&&event.type==='close-feedback')return '436';
 return null;
}
/** Separate owned channel: cancellation or replacement here never touches narration.
 * Shared source bytes do not merge the three source identities.
 */
export class P048Effects {
 private transport:P048AudioTransport;
 private introReplay=-1;
 private introActive=false;
 constructor(deps:P048TransportDependencies){this.transport=new P048AudioTransport(deps);}
 play(domain:P048EffectDomain){this.introActive=false;return this.transport.play({domain,start:0,end:7350});} // frame5 boundary; remaining source tail is verified silent.
 async intro(frame:number,replay:number){
  if(frame<305||frame>=307){if(this.introActive){this.transport.stop();this.introActive=false;}return false;}
  if(this.introReplay===replay)return false;
  this.introReplay=replay;this.introActive=true;
  return this.transport.play({domain:'413',start:0,end:3675},(frame-305)/12);
 }
 reset(){this.introReplay=-1;this.introActive=false;this.transport.stop();}
 pause(){this.introActive=false;this.transport.stop();} // Short effects are cancelled, not resumed mid-click.
 setVolume(value:number){this.transport.setVolume(value);}
 snapshot(){return this.transport.snapshot();}
 close(){return this.transport.close();}
}
