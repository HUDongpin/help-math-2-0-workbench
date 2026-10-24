/** Exact P028 stream; source frame4 begins at5512.5 samples, rounded to5513.
 * One half-sample quantization is explicit; no encoded MP3 blocks are split. */
export const P028_AUDIO_SOURCE=Object.freeze({
  sourceSha256:'c1cc4a6afa15fcdae23dda9f0fcbd3744ddae22184dc2318a4c77e352417f98b',
  sourceBytes:81120,sampleRate:22050,channels:1,decodedSamples:359424,
  latencySamples:1673,stopSamples:365663,stopSeconds:199/12,
  firstBlockFrame:4,frames:199,fps:12,language:'und',
  segments:[{sourceStartSample:1673,sourceEndSample:359424,outputStartSample:5513,outputEndSample:363264}],
} as const);
