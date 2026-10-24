export const P016_RESOURCE_PINS=Object.freeze({
  "source-stream": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p016/source-stream",
    "path": "migrations/shared-alg001-l08-p016/source-v1/stream-33.mp3",
    "bytes": 237900,
    "sha256": "3a5fca715105463140b069502cfea91342d6c3ebec0f0befcbc1576e9376b974",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "optional-spanish-audio": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p016/optional-spanish-audio",
    "path": "migrations/shared-alg001-l08-p016/source-v1/L8VB11.mp3",
    "bytes": 273840,
    "sha256": "e274239ac6ffc687e041a7b01ad5b312ca37fd183363c12ddfb2aef0a0bae045",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  }
} as const);
export type P016Resource=keyof typeof P016_RESOURCE_PINS;
