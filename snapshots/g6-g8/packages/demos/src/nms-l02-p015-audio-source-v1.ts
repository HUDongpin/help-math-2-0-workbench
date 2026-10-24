/** Whole source MP3 decode; source-frame segments preserve all post-latency samples once. */
export const P015_AUDIO_SOURCE=Object.freeze({
  "sourceSha256": "2a2f187245a750124c279c03d07134a2fd80886142e7636bc91be2adba08e9a0",
  "sourceBytes": 124670,
  "sampleRate": 22050,
  "channels": 1,
  "decodedSamples": 552384,
  "latencySamples": 1673,
  "stopSamples": 617400,
  "stopSeconds": 28,
  "firstBlockFrame": 8,
  "frames": 336,
  "fps": 12,
  "language": "und",
  "segments": [
    {
      "sourceStartSample": 1673,
      "sourceEndSample": 271720,
      "outputStartSample": 12863,
      "outputEndSample": 282910
    },
    {
      "sourceStartSample": 271720,
      "sourceEndSample": 552384,
      "outputStartSample": 334425,
      "outputEndSample": 615089
    }
  ]
} as const);
Object.freeze(P015_AUDIO_SOURCE.segments);
for (const segment of P015_AUDIO_SOURCE.segments) Object.freeze(segment);
