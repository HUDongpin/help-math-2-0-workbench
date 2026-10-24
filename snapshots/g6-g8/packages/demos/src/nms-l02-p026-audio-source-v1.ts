// Generated whole-stream mapping; never edit. Main clock pauses at authored action entry.
export const P026_AUDIO_SOURCE = Object.freeze({
  "sourceSha256": "a153d93dd77d22747200de36ac1e2771c5a957398331f9641eb3e760907b6af9",
  "sourceBytes": 200590,
  "sampleRate": 22050,
  "channels": 1,
  "decodedSamples": 888768,
  "latencySamples": 1673,
  "stopSamples": 902213,
  "stopSeconds": 40.916666666666664,
  "firstBlockFrame": 8,
  "frames": 491,
  "fps": 12,
  "language": "und",
  "interactiveStopFrames": [
    392,
    425
  ],
  "interactiveStopSeconds": [
    32.583333333333336,
    35.333333333333336
  ],
  "segments": [
    {
      "sourceStartSample": 1673,
      "sourceEndSample": 888768,
      "outputStartSample": 12863,
      "outputEndSample": 899958
    }
  ]
} as const);
Object.freeze(P026_AUDIO_SOURCE.segments);
for(const s of P026_AUDIO_SOURCE.segments)Object.freeze(s);
Object.freeze(P026_AUDIO_SOURCE.interactiveStopFrames);Object.freeze(P026_AUDIO_SOURCE.interactiveStopSeconds);
