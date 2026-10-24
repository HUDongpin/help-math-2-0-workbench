export const P009_RESOURCE_PINS=Object.freeze({
  "source-stream": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p009/source-stream",
    "path": "migrations/shared-alg001-l08-p009/source-v1/stream-86.mp3",
    "bytes": 136240,
    "sha256": "f35a03364bea48ac24667119ba8c1b62c1fcc6d6a53f474b974fb033e563ba1a",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "source-feedback": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p009/source-feedback",
    "path": "migrations/shared-alg001-l08-p009/source-v1/stream-74.mp3",
    "bytes": 5720,
    "sha256": "533f9ecc19d8b4d4ae727b8134870878036da4675a1e4aeec3b5c27a36b1f8bc",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "optional-spanish-audio": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p009/optional-spanish-audio",
    "path": "migrations/shared-alg001-l08-p009/source-v1/L8VB04.mp3",
    "bytes": 169680,
    "sha256": "57200dcd0bc7677b0042b3b94eb42a08e06bf9b1520552737ef4ada3fe336ee3",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  }
} as const);
export type P009Resource=keyof typeof P009_RESOURCE_PINS;
