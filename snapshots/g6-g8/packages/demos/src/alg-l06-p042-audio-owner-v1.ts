import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {P042_MEASURED_BINDINGS} from './alg-l06-p042-measured-bindings-v1';
import {SourceAudioOwnerV1,type SourceAudioId,type SourceAudioSnapshotV1,
  type SourceTransportV1} from './source-stream-audio-owner-v1';

export type P042AudioId=SourceAudioId;
export type P042AudioSnapshot=SourceAudioSnapshotV1;

/** P042 keeps its public audio contract while sharing source-stream ownership. */
export class P042AudioOwnerV1 extends SourceAudioOwnerV1 {
  constructor(getStateEpoch:()=>number,
    makeTransport?:(binding:DecodedSourceStreamBinding,id:P042AudioId)=>SourceTransportV1){
    super(P042_MEASURED_BINDINGS,getStateEpoch,makeTransport);
  }
}
