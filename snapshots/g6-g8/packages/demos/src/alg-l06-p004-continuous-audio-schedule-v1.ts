/** Candidate source alignment only; original-runtime synchronization is unaccepted.
 * One stream: empty packet blocks never manufacture gaps or audio restarts. */
const sampleRate=22050,decodedSamples=1457856,initialSeekSamples=1673;
export const P004_CONTINUOUS_AUDIO=Object.freeze({
 animationId:'shared-alg001-l06-p004',frameDomain:'sprite-95',fps:12,lastFrame:831,
 sourceSwfSha256:'514867e794dbc86059a452c5f1091cabfabf73e6f7918d0d28d9cf7ee604573e',
 sourceSha256:'e8f5307618bd63789f468c7a056cf80ae7828f17b665a24893fafc3ad8bb7f7e',sourceBytes:329030,
 sampleRate,decodedSamples,initialSeekSamples,audioStartSeconds:0,
 audioEndSeconds:(decodedSamples-initialSeekSamples)/sampleRate,
 measuredPcmSha256:'25578da60ff3c1abd38315f17c24472abce5ec85d8a0167f605fe1dc147e31c7',
 measuredPcmReceiptSha256:'b8e43d509454da15d6dbb190f5ebafefb87a222b86d79893afe45270fdb02376',
 measuredDecoder:'Chrome 153.0.8010.54; mono float32 little-endian; measured twice',
 alignmentStatus:'continuous-source-stream-candidate-not-original-runtime-accepted',
} as const);

/** Resume from an owned elapsed position; no arbitrary source-frame scrubbing. */
export function p004ContinuousAudioSlice(position:number){
 const p=P004_CONTINUOUS_AUDIO;
 if(!Number.isFinite(position)||position<0||position>(p.lastFrame-1)/p.fps)
  throw Error('P004_INVALID_AUDIO_POSITION');
 if(position>=p.audioEndSeconds)return null;
 return Object.freeze({delaySeconds:0,firstDecodedSample:p.initialSeekSamples+position*p.sampleRate,
  durationSeconds:p.audioEndSeconds-position});
}
