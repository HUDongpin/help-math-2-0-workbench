/** Whole source MP3 decode; preserve every post-latency sample once at source frame9. */
export const P017_AUDIO_SOURCE=Object.freeze({
  "sourceSha256": "22e434ef5f7cfc97907c27cd91c5904ca5a352836e7a4940fc8e2e19e35a215c",
  "sourceBytes": 133770,
  "sampleRate": 22050,
  "channels": 1,
  "decodedSamples": 592704,
  "latencySamples": 1673,
  "stopSamples": 608213,
  "stopSeconds": 27.583333333333332,
  "firstBlockFrame": 9,
  "frames": 331,
  "fps": 12,
  "language": "und",
  "segments": [
    {
      "sourceStartSample": 1673,
      "sourceEndSample": 592704,
      "outputStartSample": 14700,
      "outputEndSample": 605731
    }
  ]
} as const);
Object.freeze(P017_AUDIO_SOURCE.segments);
for (const segment of P017_AUDIO_SOURCE.segments) Object.freeze(segment);
