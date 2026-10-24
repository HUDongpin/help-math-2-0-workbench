/** Whole source MP3 decode; preserve every post-latency sample once at source frame10. */
export const P018_AUDIO_SOURCE=Object.freeze({
  "sourceSha256": "f1451b7ab0cfaa3d55b8fef79cfd6a3f31c7ebe834aa4bc50062cb7a2bc83ddb",
  "sourceBytes": 117650,
  "sampleRate": 22050,
  "channels": 1,
  "decodedSamples": 521280,
  "latencySamples": 1673,
  "stopSamples": 538388,
  "stopSeconds": 24.416666666666668,
  "firstBlockFrame": 10,
  "frames": 293,
  "fps": 12,
  "language": "und",
  "segments": [
    {
      "sourceStartSample": 1673,
      "sourceEndSample": 521280,
      "outputStartSample": 16538,
      "outputEndSample": 536145
    }
  ]
} as const);
Object.freeze(P018_AUDIO_SOURCE.segments);
for (const segment of P018_AUDIO_SOURCE.segments) Object.freeze(segment);
