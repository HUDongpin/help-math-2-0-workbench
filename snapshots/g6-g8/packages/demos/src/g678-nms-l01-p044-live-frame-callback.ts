/** A queued RAF carries its batch timestamp, not its actual execution time.
 * Sample the same monotonic clock used by immediate pause/glossary flushes.
 * The strict nested-clock validator remains unchanged; no timestamp clamping. */
export function createP044LiveFrameCallback(advance:(now:number)=>void,readNow:()=>number){
  return (_batchTimestamp:number):void=>{advance(readNow());};
}
