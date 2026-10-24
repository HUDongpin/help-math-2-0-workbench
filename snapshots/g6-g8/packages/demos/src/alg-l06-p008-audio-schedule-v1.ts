/** Source-bound modern playback candidate; original-runtime sync and listening are unaccepted.
 * Empty/missing SWF packet frames do not restart the concatenated MP3 or add silence. */
const sampleRate=22050,decodedSamples=1670976,initialSeekSamples=1673;
const fps=12,firstBlockFrame=19,lastFrame=938;
const audioStartSeconds=(firstBlockFrame-1)/fps;

export const P008_CONTINUOUS_AUDIO=Object.freeze({
 animationId:'shared-alg001-l06-p008',frameDomain:'sprite-507',fps,firstBlockFrame,lastFrame,
 sourceSwfSha256:'6ea847e4682f9581cd72ee4a2fd8a177c9584cbf7a53ab8a2421e1ee0f012350',
 sourceMp3Sha256:'ab14ce47d0f98c841213b222f27e7bc44587ba27849048ed1dd16bd41c2eabe2',
 sourceMp3Bytes:377130,
 sourceSaSha256:'ca48f20431673bb4e6f17c28cb605134f4098161bbcb93cc82c274cb472466f3',
 sourceSaBytes:135072,
 sourceAuditSha256:'d480a9e8ffd48a5b46e03a82035c78f55369f9b5d07757cfaff6759a7df07ee4',
 sampleRate,decodedSamples,initialSeekSamples,audioStartSeconds,
 audioEndSeconds:audioStartSeconds+(decodedSamples-initialSeekSamples)/sampleRate,
 measuredPcmSha256:'de1d41b3edb9c25306cedaaa8f910672c9b2f3ac9d06c2b117a2a6c5305a2487',
 measuredDecoder:'ffmpeg 8.1.2, mono float32 little-endian; browser decoder unmeasured',
 absentBlockFrames:Object.freeze([569,570,571,572,573,574,575,576,577]),
 zeroPayloadFrames:Object.freeze([20,568]),
 negativeRawSeekFrame:568,
 syntheticSilenceForAbsentBlocks:false,
 arbitrarySourceFrameSeekSupported:false,
 separateSaTriggerVerified:false,
 alignmentStatus:'source-and-ffmpeg-measured-candidate-not-original-runtime-or-listening-accepted',
} as const);

/** Position is owned visual elapsed seconds from sprite frame 1; Replay passes zero. */
export function p008ContinuousAudioSlice(position:number){
 const p=P008_CONTINUOUS_AUDIO;
 if(!Number.isFinite(position)||position<0||position>(p.lastFrame-1)/p.fps)
  throw Error('P008_INVALID_AUDIO_POSITION');
 if(position>=p.audioEndSeconds)return null;
 const from=Math.max(position,p.audioStartSeconds);
 return Object.freeze({delaySeconds:Math.max(0,p.audioStartSeconds-position),
  firstDecodedSample:p.initialSeekSamples+(from-p.audioStartSeconds)*p.sampleRate,
  durationSeconds:p.audioEndSeconds-from});
}
