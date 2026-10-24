export const P014_RESOURCE_PINS=Object.freeze({
  "source-stream": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p014/source-stream",
    "path": "migrations/shared-alg001-l08-p014/source-v1/stream-69.mp3",
    "bytes": 137930,
    "sha256": "b8ccaa1574b1b025197a6904ebc758ae9465549c0b9daf9391b89d54be6dca68",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "optional-spanish-audio": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p014/optional-spanish-audio",
    "path": "migrations/shared-alg001-l08-p014/source-v1/L8VB09.mp3",
    "bytes": 284928,
    "sha256": "3d60362f1571b746cc4c45d68ab772ec6f210c559a3b3368e91195eadcbd3509",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  }
} as const);
export type P014Resource=keyof typeof P014_RESOURCE_PINS;
