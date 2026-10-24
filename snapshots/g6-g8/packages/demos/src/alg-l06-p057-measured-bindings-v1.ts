/** Generated from P057 source blocks and real Chromium PCM; alignment/listening remain open. */
import type {DecodedSourceStreamBinding} from './decoded-source-stream-transport';
export const P057_AUDIO_READBACK_SHA256="fd172f064d035c812a01257f9250aa86c8bc2f56cc11e237ef9ea7c7d000ca4f";
export const P057_MEASURED_BINDINGS={
  "52": {
    "sourceBytes": 11050,
    "sourceSha256": "529ef71f4768ba9c0f830a67547066e4b8b20091bc8e3cd0782e1fbdfbb64085",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "c87bccb6f3ba10fcfecc47e076d3ded26889c2305a153751c019b004e67d3394"
  },
  "77": {
    "sourceBytes": 9880,
    "sourceSha256": "1b7f35c62c832068bd2e0e54246c591df18f08e9ff8c77527e6f3ba03650246f",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 43776,
    "pcmSha256": "0a6b63f0ec04f53222d1b1f89977387e0841fa4ae090a5e3c58997938e137831"
  },
  "93": {
    "sourceBytes": 11050,
    "sourceSha256": "3dda8c412ae366891bd7ce7f1603c70f4ec8438806191c75a25328963fdb8ee7",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "a17cbe9b778519df16a29b841daf1b06b61d1d64d31482a7771b8d8c830c1982"
  },
  "105": {
    "sourceBytes": 11978,
    "sourceSha256": "f3e05365073feff502feda8779b3d3a5e3ba4ca6ee213e7a162e1ad5b3961eb8",
    "sampleRate": 11025,
    "channels": 1,
    "decodedSamples": 11935,
    "pcmSha256": "79e4ccd4998d79ef463ef12c18c70b2e76cb12393ff50092a0056e77761cfb0e"
  },
  "117": {
    "sourceBytes": 11570,
    "sourceSha256": "770ce8a109fb78c238d218e479047529e8cb39f006f8c70747be376556e2a541",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 51264,
    "pcmSha256": "ce78e46dacfbabe3385d5742485619f3985bb7df827bbd81b63e02925f4a1d1a"
  },
  "129": {
    "sourceBytes": 11050,
    "sourceSha256": "3506fcffbe07e726fd4cf1c750cd2641d2aa06f4ca14379b4407ea5843e4f0f0",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "0e40aaf4b85fa77a0541b47168997f54711e3bc4020e83bf8d1d4bb9bc53d14b"
  },
  "157": {
    "sourceBytes": 11050,
    "sourceSha256": "f87ec03bf9163390a117b6ad1ea7c47dab7ea7e729219acff0e0617f6100a9f1",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 48960,
    "pcmSha256": "5a615a63a611ee4fcfd7674654f49c3ce6ede152ba85865032ccbe031e34a3c3"
  },
  "main": {
    "sourceBytes": 348530,
    "sourceSha256": "cfb45199c31e9024e5f34cffa6b527fb03c0fb3a420a692f91ee7e7d2456d660",
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 1544256,
    "pcmSha256": "729b0a06d2fb2f6b639724593ef342e93b5b0571d9fae510faa1948752c9ebb9"
  },
  "sa": {
    "sourceBytes": 58800,
    "sourceSha256": "2310e2c254f8acd45c47637176cd44b35ef3616cfa5a929cc182df628927ed0a",
    "sampleRate": 48000,
    "channels": 1,
    "decodedSamples": 201600,
    "pcmSha256": "e6972deb337fbafc2579bdd48c7a2e6172cbba8de71a09ae488ef159bcc14ad4"
  }
} as const satisfies Record<string,DecodedSourceStreamBinding>;
export const P057_AUDIO_CLOCKS={
  "52": {
    "spriteId": 52,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 28,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "77": {
    "spriteId": 77,
    "firstAudioFrame": 3,
    "entryFrame": 2,
    "lastFrame": 27,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": [
      {
        "frame": 27,
        "samples": 0,
        "payloadBytes": 0,
        "seek": -1984
      }
    ]
  },
  "93": {
    "spriteId": 93,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 28,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "105": {
    "spriteId": 105,
    "firstAudioFrame": 1,
    "entryFrame": 2,
    "lastFrame": 25,
    "latencySamples": 0,
    "decodedSamplesPerFrame": 918.0832728592162,
    "decodedEntrySample": 919,
    "sourceCodec": "swf-adpcm",
    "sourceRate": 5512,
    "entrySkippedSourceSamples": 459,
    "resamplerPhaseVerified": false,
    "trailingEmptyNegativeMarker": []
  },
  "117": {
    "spriteId": 117,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 29,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "129": {
    "spriteId": 129,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 28,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "157": {
    "spriteId": 157,
    "firstAudioFrame": 2,
    "entryFrame": 2,
    "lastFrame": 28,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": []
  },
  "main": {
    "spriteId": 312,
    "firstAudioFrame": 14,
    "entryFrame": 1,
    "lastFrame": 856,
    "latencySamples": 1673,
    "decodedSamplesPerFrame": 1837.5,
    "decodedEntrySample": 1673,
    "trailingEmptyNegativeMarker": [
      {
        "frame": 855,
        "samples": 0,
        "payloadBytes": 0,
        "seek": -2333
      }
    ]
  }
} as const;
export type P057AudioDomain=keyof typeof P057_MEASURED_BINDINGS;
export type P057EmbeddedDomain=keyof typeof P057_AUDIO_CLOCKS;
