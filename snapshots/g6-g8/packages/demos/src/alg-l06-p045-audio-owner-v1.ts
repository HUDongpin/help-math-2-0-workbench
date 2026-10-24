import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {P045_MEASURED_BINDINGS} from './alg-l06-p045-measured-bindings-v1';
import {SourceAudioOwnerV1,type SourceAudioId,type SourceAudioSnapshotV1,
  type SourceTransportV1} from './source-stream-audio-owner-v1';

export type P045AudioId=SourceAudioId;
export type P045AudioSnapshot=SourceAudioSnapshotV1;

/** P045 binds its four physically owned streams to the shared owner contract. */
export class P045AudioOwnerV1 extends SourceAudioOwnerV1 {
  constructor(getStateEpoch:()=>number,
    makeTransport?:(binding:DecodedSourceStreamBinding,id:P045AudioId)=>SourceTransportV1){
    super(P045_MEASURED_BINDINGS,getStateEpoch,makeTransport);
  }
}
