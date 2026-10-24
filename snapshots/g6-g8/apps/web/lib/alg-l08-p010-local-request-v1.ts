export const P010_RESOURCE_PINS=Object.freeze({
  "source-stream": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p010/source-stream",
    "path": "migrations/shared-alg001-l08-p010/source-v1/stream-107.mp3",
    "bytes": 252330,
    "sha256": "9d0002a824cba9b4b3bc7e41b0d420c9dc9f0aa539177bde28316fc596808140",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "source-feedback": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p010/source-feedback",
    "path": "migrations/shared-alg001-l08-p010/source-v1/stream-78.mp3",
    "bytes": 5720,
    "sha256": "533f9ecc19d8b4d4ae727b8134870878036da4675a1e4aeec3b5c27a36b1f8bc",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "optional-spanish-audio": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p010/optional-spanish-audio",
    "path": "migrations/shared-alg001-l08-p010/source-v1/L8VB05.mp3",
    "bytes": 258384,
    "sha256": "8668609dc8da1f119cb813f18ab0bad1d4e93d9a3b53b6f40a89c3df25cdd5e3",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  }
} as const);
export type P010Resource=keyof typeof P010_RESOURCE_PINS;
