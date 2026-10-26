// Generated from an actual successful native receipt by bind-native-v3.py.
import type {AlgL10P004Playback} from './alg-l10-p004-playback-v1';
export const ALG_L10_P004_PLAYBACK={
  "animationId": "shared-alg001-l10-p004",
  "mainPlan": {
    "version": 1,
    "sourceSwfSha256": "5ac9be9459e12bdc6552d53a66b67ceb645633d2fe57522639a043d28180f5b2",
    "frameDomain": "sprite-60",
    "firstFrame": 1,
    "lastFrame": 609,
    "fps": 12,
    "decoder": {
      "sourceSha256": "7b758330f9ed87a2583d728657792362eadbb175ee0206078c3cf798de2da0fd",
      "sourceBytes": 225940,
      "sampleRate": 22050,
      "channels": 1,
      "decodedSamples": 1001088,
      "pcmSha256": "8c76d237da04bd906c072f319bb2ac2f4bc587212b203db1cc70cbc25d246d25"
    },
    "segments": [
      {
        "firstFrame": 11,
        "firstDecodedSample": 1673,
        "endDecodedSample": 745344
      },
      {
        "firstFrame": 471,
        "firstDecodedSample": 745784,
        "endDecodedSample": 1001088
      }
    ],
    "emptyNegativeBlocks": [
      {
        "frame": 417,
        "samples": 0,
        "seek": -2150,
        "mp3Bytes": 0
      }
    ],
    "alignmentStatus": "source-run-candidate-not-original-runtime-accepted"
  },
  "spanish": {
    "sourceSha256": "7c52cff0fddc1c54979bd7f9ff039766dac50da92192580e1154a937ecc6134c",
    "sourceBytes": 436800,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 687959,
    "pcmSha256": "d2b7c1204750aa45c0d2c4a11b42e5f664907672ff787de3ee0fd9e460689886"
  },
  "nativeReceipt": {
    "path": "output/g678-helper-browser-root-20261008-1701-v1/p004-native-recovered-result-v1.json",
    "bytes": 10608,
    "sha256": "5f38b3a96995cd1364ca622f8aa280297729dea0336451e302fabce978b39368"
  }
} as const satisfies AlgL10P004Playback;
