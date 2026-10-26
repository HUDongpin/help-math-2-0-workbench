import {P049AudioTransport,type P049TransportDependencies} from './nms-l02-p049-audio-transport-v1';
import type {P049State,P049Event} from './nms-l02-p049-practice-v1';
export type P049EffectDomain='8'|'35'|'117';
/** Keyboard/click activation adapter for source button down-state streams.
 * Actual input acceptance is checked before dispatch. No sound on generic clicks.
 */
export function p049EffectForEvent(state:P049State,event:P049Event):P049EffectDomain|null {
 if(state.phase==='ready'&&!state.helpOpen){
  if(event.type==='submit')return '35';
  if(event.type==='help'&&event.open)return '8';
 }
 if(state.phase==='wrong-feedback'&&state.hintOpen&&event.type==='close-hint')return '117';
 return null;
}
/** Separate owned channel: cancellation or replacement here never touches narration.
 * Shared source bytes do not merge the three source identities.
 */
export class P049Effects {
 private transport:P049AudioTransport;
 private introReplay=-1;
 private introActive=false;
 constructor(deps:P049TransportDependencies){this.transport=new P049AudioTransport(deps);}
 play(domain:P049EffectDomain){this.introActive=false;return this.transport.play({domain,start:0,end:7350,mainFrame:1});} // frame5 boundary; remaining source tail is verified silent.
 async intro(frame:number,replay:number){
  if(frame<183||frame>=185){if(this.introActive){this.transport.stop();this.introActive=false;}return false;}
  if(this.introReplay===replay)return false;
  this.introReplay=replay;this.introActive=true;
  return this.transport.play({domain:'35',start:0,end:3675,mainFrame:183},(frame-183)/12);
 }
 reset(){this.introReplay=-1;this.introActive=false;this.transport.stop();}
 pause(){this.introActive=false;this.transport.stop();} // Short effects are cancelled, not resumed mid-click.
 setVolume(value:number){this.transport.setVolume(value);}
 snapshot(){return this.transport.snapshot();}
 close(){return this.transport.close();}
}
