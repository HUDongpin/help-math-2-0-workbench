export const P013_RESOURCE_PINS=Object.freeze({
  "source-stream": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p013/source-stream",
    "path": "migrations/shared-alg001-l08-p013/source-v1/stream-223.mp3",
    "bytes": 132210,
    "sha256": "1a052cc677fcc1d5c9b6d6956f81c7cf912df63d1d9c0adcab9b329fd6f397b9",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "source-feedback": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p013/source-feedback",
    "path": "migrations/shared-alg001-l08-p013/source-v1/stream-72.mp3",
    "bytes": 5720,
    "sha256": "533f9ecc19d8b4d4ae727b8134870878036da4675a1e4aeec3b5c27a36b1f8bc",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "optional-spanish-audio": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p013/optional-spanish-audio",
    "path": "migrations/shared-alg001-l08-p013/source-v1/L8VB08.mp3",
    "bytes": 257376,
    "sha256": "376c9702cdc437f39cca3e57c4ed3bb9b5e1e510751c9d103b31841ac1e04321",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  }
} as const);
export type P013Resource=keyof typeof P013_RESOURCE_PINS;
