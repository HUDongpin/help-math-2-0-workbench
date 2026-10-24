import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
import {P048_MEASURED_BINDINGS} from './alg-l06-p048-measured-bindings-v1';
import {SourceAudioOwnerV1, type SourceAudioId, type SourceTransportV1}
  from './source-stream-audio-owner-v1';

/** Source-bound instance of the existing exclusive stream owner. */
export class P048AudioOwnerV1 extends SourceAudioOwnerV1 {
  constructor(getStateEpoch:()=>number,
    makeTransport?:(binding:DecodedSourceStreamBinding,id:SourceAudioId)=>SourceTransportV1) {
    super(P048_MEASURED_BINDINGS,getStateEpoch,makeTransport);
  }
}
