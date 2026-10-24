export const P004_AUDIO_SOURCE = Object.freeze({
  "sourceBytes": 368810,
  "sourceSha256": "ce81813640d92f1a5625e2ee9bc571cad0a25e09970abe7c23d74afbcf939e4d",
  "sampleRate": 22050,
  "channels": 1,
  "decodedSamples": 1634112,
  "latencySamples": 1673,
  "stopSeconds": 95.91666666666667,
  "stopSamples": 2114963,
  "segments": [
    {
      "firstFrame": 102,
      "lastBlockFrame": 152,
      "sourceStartSample": 1673,
      "sourceEndSample": 93298,
      "outputStartSample": 185588,
      "outputEndSample": 277213
    },
    {
      "firstFrame": 199,
      "lastBlockFrame": 348,
      "sourceStartSample": 93298,
      "sourceEndSample": 366936,
      "outputStartSample": 363825,
      "outputEndSample": 637463
    },
    {
      "firstFrame": 453,
      "lastBlockFrame": 510,
      "sourceStartSample": 366936,
      "sourceEndSample": 471474,
      "outputStartSample": 830550,
      "outputEndSample": 935088
    },
    {
      "firstFrame": 519,
      "lastBlockFrame": 1152,
      "sourceStartSample": 471474,
      "sourceEndSample": 1634112,
      "outputStartSample": 951825,
      "outputEndSample": 2114463
    }
  ]
} as const);

Object.freeze(P004_AUDIO_SOURCE.segments);
for (const segment of P004_AUDIO_SOURCE.segments) Object.freeze(segment);
