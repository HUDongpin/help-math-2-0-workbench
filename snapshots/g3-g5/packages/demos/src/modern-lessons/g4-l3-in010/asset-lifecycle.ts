/** Preparation claims survive successful decode until their host signal aborts.
 * Mount leases are separate, so Replay/StrictMode never owns the host claim. */
export function createPreparedAssetStore<T extends {dispose():void}>(load:(signal:AbortSignal)=>Promise<T>){
 type Claim={remove():void};type Entry={controller:AbortController;promise:Promise<T>;value?:T;leases:number;claims:Set<Claim>;unclaimedWarm:boolean;closed:boolean};let current:Entry|null=null;
 const close=(entry:Entry)=>{if(entry.closed)return;entry.closed=true;entry.controller.abort();for(const claim of entry.claims)claim.remove();entry.claims.clear();entry.value?.dispose();if(current===entry)current=null;};
 const maybeClose=(entry:Entry)=>{if(!entry.closed&&entry.leases===0&&entry.claims.size===0&&!entry.unclaimedWarm)close(entry);};
 const deferredClose=(entry:Entry)=>queueMicrotask(()=>maybeClose(entry));
 const ensure=()=>{if(current)return current;const entry:Entry={controller:new AbortController(),promise:null!,leases:0,claims:new Set(),unclaimedWarm:false,closed:false};current=entry;entry.promise=Promise.resolve().then(()=>load(entry.controller.signal)).then(value=>{if(entry.closed){value.dispose();throw new Error('Lesson asset preparation cancelled');}entry.value=value;return value;},error=>{close(entry);throw error;});return entry;};
 return{peekReady:()=>current?.value??null,
 prepare:(signal?:AbortSignal):Promise<void>=>{if(signal?.aborted)return Promise.reject(new Error('Lesson asset preparation cancelled'));const entry=ensure();if(!signal){entry.unclaimedWarm=true;return entry.promise.then(()=>{});}
  return new Promise<void>((resolve,reject)=>{const abort=()=>{claim.remove();entry.claims.delete(claim);reject(new Error('Lesson asset preparation cancelled'));deferredClose(entry);};const claim:Claim={remove:()=>signal.removeEventListener('abort',abort)};entry.claims.add(claim);signal.addEventListener('abort',abort,{once:true});entry.promise.then(()=>{if(!signal.aborted&&!entry.closed)resolve();else reject(new Error('Lesson asset preparation cancelled'));},reject);});
 },
 acquire:()=>{const entry=ensure();entry.unclaimedWarm=false;entry.leases++;let released=false;return{ready:entry.promise,release:()=>{if(released)return;released=true;entry.leases--;deferredClose(entry);}};},
 /** Drops only a legacy no-signal warm cache; live host claims cannot be stolen. */
 disposeUnused:()=>{if(current&&current.leases===0){current.unclaimedWarm=false;maybeClose(current);}}
 };
}
