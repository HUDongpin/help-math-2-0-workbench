/** P010 main-stream timing for one source sprite cycle only. The source has no
 * Stop action on sprite-52; visual wrap/restart policy is a separate decision.
 * FFmpeg decode and source packet arithmetic do not establish original sync or listening. */
const sampleRate=22050,decodedSamples=550656,initialSeekSamples=1673;
const fps=12,firstBlockFrame=4,lastBlockFrame=303;
const audioStartSeconds=(firstBlockFrame-1)/fps;

export const P010_CONTINUOUS_AUDIO=Object.freeze({
 animationId:'shared-alg001-l06-p010',frameDomain:'sprite-52',fps,
 firstBlockFrame,lastBlockFrame,sourceCycleFrames:303,
 sourceSwfSha256:'96552f567037f39868d01b1ba77311858caf2efcdb141ef64ed0878a6c48ce14',
 sourceMp3Sha256:'f5c71e9d066a0d2ce37be7afd20c3d1f8182b5c2c7b6a06a38c131074093fa89',
 sourceMp3Bytes:124280,
 sourceSaSha256:'903c1bd16cebf9f1ceda0d9b8a47905cae20f380bb857fa33fc855a6db350275',
 sourceSaBytes:301056,sourceSaDecodedSamples:1032192,
 sourceAuditSha256:'142f375cbb3fb8344409b859fd5d918df9002cb63b23735b04d77a0504d48775',
 sampleRate,decodedSamples,initialSeekSamples,audioStartSeconds,
 audioEndSeconds:audioStartSeconds+(decodedSamples-initialSeekSamples)/sampleRate,
 lastFrameStartSeconds:(lastBlockFrame-1)/fps,
 sourceCycleSeconds:lastBlockFrame/fps,
 measuredPcmSha256:'edcb1aafafd97d01d93c55138d582a3ac8c45ba14187d840095d525cfc1ccdbd',
 measuredDecoder:'ffmpeg full EOF, mono float32 little-endian; browser decoder unmeasured',
 zeroPayloadFrames:Object.freeze([5]),absentBlockFramesWithinStream:Object.freeze([]),
 syntheticSilenceForZeroPayloadFrame:false,
 sourceStopActionPresent:false,visualWrapPolicyResolved:false,
 arbitrarySourceFrameSeekSupported:false,separateSaAutoplay:false,separateSaSpliced:false,
 alignmentStatus:'source-and-ffmpeg-measured-one-cycle-not-original-runtime-or-listening-accepted',
} as const);

/** Elapsed seconds from source frame 1 within a single 303-frame visual cycle.
 * The caller decides whether and when another cycle exists. */
export function p010ContinuousAudioSlice(position:number){
 const p=P010_CONTINUOUS_AUDIO;
 if(!Number.isFinite(position)||position<0||position>p.sourceCycleSeconds)
  throw Error('P010_INVALID_AUDIO_POSITION');
 if(position>=p.audioEndSeconds)return null;
 const from=Math.max(position,p.audioStartSeconds);
 return Object.freeze({delaySeconds:Math.max(0,p.audioStartSeconds-position),
  firstDecodedSample:p.initialSeekSamples+(from-p.audioStartSeconds)*p.sampleRate,
  durationSeconds:p.audioEndSeconds-from});
}
