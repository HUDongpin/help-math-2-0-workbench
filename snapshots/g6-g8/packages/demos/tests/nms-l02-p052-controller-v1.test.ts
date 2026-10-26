import {test} from 'node:test';
import assert from 'node:assert/strict';
import {P052Controller} from '../src/nms-l02-p052-controller-v1';
import type {P052UserEvent} from '../src/nms-l02-p052-controller-v1';
function session(){return {calls:[] as string[],callbacks:[] as (()=>void)[],paused:0,cancelled:0,closed:0,volume:0.8,setVolume(value:number){if(!Number.isFinite(value)||value<0||value>1)throw Error('VOLUME');this.volume=value;},
 async play(cue:{id:string},callback:()=>void){this.calls.push(cue.id);this.callbacks.push(callback);return true;},
 pause(){this.paused++;},async resume(){return true;},cancel(){this.cancelled++;},async close(){this.closed++;}};}
function setup(){let now=0;const narration=session(),click=session();const controller=new P052Controller({narration,click,now:()=>now,changed:()=>{}});
 return {controller,narration,click,advance(seconds:number){now+=seconds;controller.tick();},
  event(event:Omit<P052UserEvent,'epoch'>){return controller.dispatch({...event,epoch:controller.snapshot().state.epoch} as P052UserEvent);},
  async practice(){await controller.start();now+=10;controller.tick();narration.callbacks.at(-1)!();assert.equal(controller.snapshot().state.phase,'practice');}};
}
test('visual boundary and audio completion are both required in either order',async()=>{
 const a=setup();await a.controller.start();a.advance(10);assert.equal(a.controller.snapshot().state.frame,115);
 assert.equal(a.controller.snapshot().state.phase,'intro');a.narration.callbacks[0]();assert.equal(a.controller.snapshot().state.phase,'practice');
 const b=setup();await b.controller.start();b.narration.callbacks[0]();assert.equal(b.controller.snapshot().state.phase,'intro');
 b.advance(9.5);assert.equal(b.controller.snapshot().state.phase,'practice');
 await assert.rejects(b.controller.dispatch({type:'outro-ended',epoch:0} as unknown as P052UserEvent),/CONTROLLER_EVENT/);
});
test('pause freezes visual elapsed, resume preserves it, feedback does not auto-close',async()=>{
 const h=setup();await h.controller.start();h.advance(2);assert.equal(h.controller.snapshot().state.frame,25);
 await h.controller.dispatch({type:'pause',paused:true,epoch:0});h.advance(100);assert.equal(h.controller.snapshot().state.frame,25);
 await h.controller.dispatch({type:'pause',paused:false,epoch:0});h.advance(1);assert.equal(h.controller.snapshot().state.frame,37);
 h.advance(7);h.narration.callbacks[0]();await h.event({type:'submit'});assert.equal(h.controller.snapshot().state.phase,'wrong');
 h.advance(3);h.narration.callbacks.at(-1)!();assert.equal(h.controller.snapshot().state.phase,'wrong');
 assert.equal(h.controller.snapshot().feedback?.frame,15);assert.deepEqual(h.click.calls,['click']);
 await h.event({type:'close-feedback'});assert.equal(h.controller.snapshot().state.phase,'practice');
 assert.deepEqual(h.click.calls,['click','wrong-close-click']);
});
test('second wrong reveals75 with wrong coach; outro holds until full audio tail',async()=>{
 const h=setup();await h.practice();await h.event({type:'submit'});await h.event({type:'close-feedback'});await h.event({type:'submit'});
 assert.equal(h.controller.snapshot().state.outcome,'revealed');assert.equal(h.controller.snapshot().state.percent,75);
 assert.match(h.narration.calls.at(-1)!,/^wrong-S/);const old=h.narration.callbacks.at(-1)!;
 await h.event({type:'close-feedback'});assert.equal(h.controller.snapshot().state.frame,116);
 assert.equal(h.narration.calls.at(-1),'outro');assert.equal(h.click.calls.at(-1),'right-close-click');
 old();h.advance(4);assert.equal(h.controller.snapshot().state.frame,156);assert.equal(h.controller.snapshot().state.phase,'outro');
 h.narration.callbacks.at(-1)!();assert.equal(h.controller.snapshot().state.phase,'complete');
});
test('Replay cancels both owners and rejects late callbacks and stale UI events',async()=>{
 const h=setup();await h.practice();await h.event({type:'submit'});const old=h.narration.callbacks.at(-1)!;
 await h.event({type:'replay'});old();assert.equal(h.controller.snapshot().state.epoch,1);assert.equal(h.controller.snapshot().state.frame,1);
 await h.controller.dispatch({type:'submit',epoch:0});assert.equal(h.controller.snapshot().state.phase,'intro');
 assert.ok(h.click.cancelled>0);await h.controller.close();h.narration.callbacks.at(-1)!();h.advance(20);
 assert.equal(h.controller.snapshot().state.frame,1);assert.equal(h.narration.closed,1);assert.equal(h.click.closed,1);
});
test('pending or failed start never advances visuals; stale failure cannot poison Replay',async()=>{
 const h=setup();let reject!:(error:Error)=>void;
 h.narration.play=async()=>new Promise<boolean>((_resolve,r)=>{reject=r;});
 const pending=h.controller.start();h.advance(100);assert.equal(h.controller.snapshot().state.frame,1);
 h.narration.play=async function(cue,callback){this.calls.push(cue.id);this.callbacks.push(callback);return true;};
 await h.event({type:'replay'});reject(Error('old load'));await pending;
 assert.equal(h.controller.snapshot().error,null);h.advance(1);assert.equal(h.controller.snapshot().state.frame,13);
 const failed=setup();failed.narration.play=async()=>{throw Error('bad source');};await failed.controller.start();failed.advance(100);
 assert.equal(failed.controller.snapshot().error,'audio-unavailable');assert.equal(failed.controller.snapshot().state.phase,'intro');
 assert.equal(failed.controller.snapshot().state.frame,1);
});
test('pause while loading invalidates the pending start and resume starts the visual clock once',async()=>{
 const h=setup();let finish!:(value:boolean)=>void;
 h.narration.play=async()=>new Promise<boolean>(r=>{finish=r;});
 const pending=h.controller.start();await h.controller.dispatch({type:'pause',paused:true,epoch:0});
 h.advance(50);finish(true);await pending;assert.equal(h.controller.snapshot().state.frame,1);
 assert.equal(h.controller.snapshot().loading,false);
 await h.controller.dispatch({type:'pause',paused:false,epoch:0});h.advance(1);
 assert.equal(h.controller.snapshot().state.frame,13);assert.equal(h.controller.snapshot().error,null);
});
test('volume and narration mute preserve state and never restart either audio owner',async()=>{
 const h=setup();await h.controller.start();h.advance(2);const before=h.controller.snapshot().state;
 h.controller.setVolume(.4);assert.equal(h.narration.volume,.4);assert.equal(h.click.volume,.4);
 h.controller.setNarration(false);assert.equal(h.narration.volume,0);assert.equal(h.click.volume,.4);
 h.controller.setVolume(.6);assert.equal(h.narration.volume,0);assert.equal(h.click.volume,.6);
 h.controller.setNarration(true);assert.equal(h.narration.volume,.6);
 assert.equal(h.controller.snapshot().state,before);assert.deepEqual(h.narration.calls,['intro']);assert.deepEqual(h.click.calls,[]);
 assert.throws(()=>h.controller.setVolume(NaN),/VOLUME/);
});
test('reduced-motion Replay resets without starting audio and waits for explicit Play',async()=>{
 const h=setup();await h.practice();await h.event({type:'submit'});
 const stale=h.narration.callbacks.at(-1)!,calls=h.narration.calls.length;
 await h.controller.dispatch({type:'replay',epoch:0},{autoplayReplay:false});
 const reset=h.controller.snapshot();assert.equal(reset.started,false);assert.equal(reset.state.paused,true);
 assert.equal(reset.state.epoch,1);assert.equal(reset.state.frame,1);assert.equal(reset.state.percent,0);
 assert.equal(reset.error,null);assert.equal(reset.loading,false);assert.equal(h.narration.calls.length,calls);
 stale();h.advance(100);assert.equal(h.controller.snapshot().state.frame,1);
 await h.controller.dispatch({type:'pause',paused:false,epoch:1});
 assert.equal(h.narration.calls.length,calls+1);assert.equal(h.narration.calls.at(-1),'intro');
 h.advance(1);assert.equal(h.controller.snapshot().state.frame,13);
});
test('paused Replay invalidates an in-flight audio load without accepting its failure',async()=>{
 const h=setup();let reject!:(error:Error)=>void;
 h.narration.play=async()=>new Promise<boolean>((_resolve,r)=>{reject=r;});
 const pending=h.controller.start();
 await h.controller.dispatch({type:'replay',epoch:0},{autoplayReplay:false});
 reject(Error('stale source load'));await pending;h.advance(100);
 assert.equal(h.controller.snapshot().error,null);assert.equal(h.controller.snapshot().loading,false);
 assert.equal(h.controller.snapshot().started,false);assert.equal(h.controller.snapshot().state.frame,1);
 assert.equal(h.controller.snapshot().state.paused,true);
});
