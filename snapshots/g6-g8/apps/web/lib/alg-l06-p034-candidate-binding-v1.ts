// Root-reviewed P034 exact local candidate source binding. No registration or acceptance effect.
export const P034_CANDIDATE_BINDING = {
  "sourcePlan": {
    "path": "output/alg-l06-p034-source-planning-20261001-v1/source-plan-v1.json",
    "bytes": 19252,
    "sha256": "85e8310dda320985e6b153364a854d73be70502db0f5861695121dc6c9af5eb9"
  },
  "native": {
    "path": "migrations/shared-alg001-l06-p034/native-v1/geometry-v1.json",
    "bytes": 337287,
    "sha256": "4fd380e0b9203d746cde1b4dce4c7e44d0beb00314049f2e2828e9ba7ece4809"
  },
  "canvas": {
    "path": "migrations/shared-alg001-l06-p034/canvas-v1/canvas-manifest-v1.json",
    "bytes": 6023,
    "sha256": "f52667b9fa4afc4277776d1cb9df3fe13739194f539c085cbaa6271e991c782e"
  },
  "audioSchedule": {
    "path": "migrations/shared-alg001-l06-p034/audio-source-v1/main-block-schedule-v1.json",
    "bytes": 132014,
    "sha256": "0282f01ddad554f0b1d14e3eb1a9a7d8a2b3ceec91c5644aceddc9692da977b6"
  },
  "audioReceipt": {
    "path": "migrations/shared-alg001-l06-p034/audio-source-v1/asset-receipt-v1.json",
    "bytes": 2935,
    "sha256": "4cbee77dbb0c216a700de50c13511371b959bb9b6c0b33c2a9aeb409cf1989b0"
  },
  "browserDecode": {
    "path": "migrations/shared-alg001-l06-p034/audio-source-v1/browser-decode-v1.json",
    "bytes": 1386,
    "sha256": "e938383da2d84012a0f87da418485a5b0d70c1badf705687ba74254b2cbfaeb2"
  },
  "player": {
    "path": "packages/demos/src/alg-l06-p034-player-v1.tsx",
    "bytes": 13449,
    "sha256": "d1a3d94ac7dcb3d2b4c342f8cfac7a967b78ee20521eb226f03c993d3edb5d00"
  },
  "index": {
  "path": "catalog/g678-admission-v1/index-v104.json",
  "bytes": 7775,
  "sha256": "36a62b9ca52510dd15fd53ea2cfae98f3327c4e8539254c4e3d0feb647475252"
},
  "host": {
  "path": "catalog/g678-admission-v1/host-v104.json",
  "bytes": 138680,
  "sha256": "43c33342165bade3de557e3925f79420a2cf5025ae0e16b3ab9688a8727ea6ce"
},
  "candidateRegistrySha256": "02d3e13380136c6c71ba093efaf47757a0dd28a8c4a1f6330b3af712486fa513",
  "packet": {
  "path": "output/g678-p034-continuous-successor-20261001-v1/candidate-source-packet-v8.json",
  "bytes": 37847,
  "sha256": "6d513ecea7380cdf45fd64073e2d05f8afc7608953196c5f1deeadf085450241"
},
  "browserMain": {
    "sourceSha256": "9f75303ceb0bd281d47f92583f1c40aa34b4974695a0c019199682b507131e2d",
    "sourceBytes": 167310,
    "sampleRate": 22050,
    "channels": 1,
    "decodedSamples": 741312,
    "pcmSha256": "337c5ff5833df48a5234844c1e1ada31a72514229d6524c47eec3f0bbba59e3b"
  },
  "browserSpanish": {
    "sourceSha256": "2bebaa57aee0e80591e80cd542dc98f51839593820c9ec16d6a720dbfd9dab30",
    "sourceBytes": 438816,
    "sampleRate": 48000,
    "channels": 1,
    "decodedSamples": 1504512,
    "pcmSha256": "dea44bb9bbc761714b74a6b90f402bc5dcba6aa8b334898e36fe67e6a5c84b61"
  }
} as const;
