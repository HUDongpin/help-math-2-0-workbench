/** Source-bound modern playback candidate; original-runtime sync and listening are unaccepted.
 * Empty/missing SWF packet frames do not restart the concatenated MP3 or add silence. */
const sampleRate=22050,decodedSamples=672192,initialSeekSamples=1673;
const fps=12,firstBlockFrame=2,lastFrame=372;
const audioStartSeconds=(firstBlockFrame-1)/fps;

export const P013_CONTINUOUS_AUDIO=Object.freeze({
 animationId:'shared-alg001-l06-p013',frameDomain:'sprite-140',fps,firstBlockFrame,lastFrame,
 sourceSwfSha256:'1be47750557385ef91c648fb87fdcde642d342caadc35da7a1f7a2d1fdb11d35',
 sourceMp3Sha256:'3d646619b33b9e859aff68bf331f224158916aa9f4e99b16cdc910791c7d41c1',
 sourceMp3Bytes:151710,
 sourceSaSha256:'2db938405bd646e4bf37e0b9cdf5438cc65451a2d4f7304c93dbc2b6653e8575',
 sourceSaBytes:327936,sourceSaDecodedSamples:1124352,sourceSaSampleRate:48000,
 sourceAuditSha256:'73558518b95735e4256432d9b750eabf33e42b04d62cf1c11f6fa1b6151d28d8',
 sampleRate,decodedSamples,initialSeekSamples,audioStartSeconds,
 audioEndSeconds:audioStartSeconds+(decodedSamples-initialSeekSamples)/sampleRate,
 measuredPcmSha256:'df2109f7211fc571f7cc33e639d5b063b73b84c3b5b6dc52c84bd896056f775c',
 measuredDecoder:'ffmpeg 8.1.2 mono float32 little-endian; Chrome 153 separately measured in browser decode receipt',
 absentBlockFrames:Object.freeze([253,254,255]),
 zeroPayloadFrames:Object.freeze([3,161,252]),
 negativeRawSeekFrames:Object.freeze([161,252]),sourceHasNegativeSeek:true,negativeSeekSemanticsResolved:false,
 syntheticSilenceForAbsentBlocks:false,
 arbitrarySourceFrameSeekSupported:false,
 separateSaTriggerVerified:false,separateSaAutoplay:false,separateSaSpliced:false,
 sourceStopActionPresent:false,visualWrapPolicyResolved:false,
 alignmentStatus:'source-and-ffmpeg-measured-candidate-not-original-runtime-or-listening-accepted',
} as const);

/** Position is owned visual elapsed seconds from sprite frame 1; Replay passes zero. */
export function p013ContinuousAudioSlice(position:number){
 const p=P013_CONTINUOUS_AUDIO;
 if(!Number.isFinite(position)||position<0||position>(p.lastFrame-1)/p.fps)
  throw Error('P013_INVALID_AUDIO_POSITION');
 if(position>=p.audioEndSeconds)return null;
 const from=Math.max(position,p.audioStartSeconds);
 return Object.freeze({delaySeconds:Math.max(0,p.audioStartSeconds-position),
  firstDecodedSample:p.initialSeekSamples+(from-p.audioStartSeconds)*p.sampleRate,
  durationSeconds:p.audioEndSeconds-from});
}
