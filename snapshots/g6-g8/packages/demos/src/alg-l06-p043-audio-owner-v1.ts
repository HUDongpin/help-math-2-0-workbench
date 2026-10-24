import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {P043_MEASURED_BINDINGS} from './alg-l06-p043-measured-bindings-v1';
import {SourceAudioOwnerV1,type SourceAudioId,type SourceAudioSnapshotV1,
  type SourceTransportV1} from './source-stream-audio-owner-v1';

export type P043AudioId=SourceAudioId;
export type P043AudioSnapshot=SourceAudioSnapshotV1;

/** P043 binds its four physically owned streams to the shared owner contract. */
export class P043AudioOwnerV1 extends SourceAudioOwnerV1 {
  constructor(getStateEpoch:()=>number,
    makeTransport?:(binding:DecodedSourceStreamBinding,id:P043AudioId)=>SourceTransportV1){
    super(P043_MEASURED_BINDINGS,getStateEpoch,makeTransport);
  }
}
