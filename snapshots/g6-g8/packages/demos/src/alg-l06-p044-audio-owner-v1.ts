import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {P044_MEASURED_BINDINGS} from './alg-l06-p044-measured-bindings-v1';
import {SourceAudioOwnerV1,type SourceAudioId,type SourceAudioSnapshotV1,
  type SourceTransportV1} from './source-stream-audio-owner-v1';

export type P044AudioId=SourceAudioId;
export type P044AudioSnapshot=SourceAudioSnapshotV1;

/** P044 binds its four physically owned streams to the shared owner contract. */
export class P044AudioOwnerV1 extends SourceAudioOwnerV1 {
  constructor(getStateEpoch:()=>number,
    makeTransport?:(binding:DecodedSourceStreamBinding,id:P044AudioId)=>SourceTransportV1){
    super(P044_MEASURED_BINDINGS,getStateEpoch,makeTransport);
  }
}
