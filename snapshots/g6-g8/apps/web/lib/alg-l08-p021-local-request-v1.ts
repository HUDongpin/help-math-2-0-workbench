export const P021_RESOURCE_PINS=Object.freeze({
  "source-stream": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p021/source-stream",
    "path": "migrations/shared-alg001-l08-p021/source-v1/stream-70.mp3",
    "bytes": 326040,
    "sha256": "ba54d8c7e0e9431d0b793bb6e9d46ba42dea139db577f130786224aefb2d8418",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "optional-spanish-audio": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p021/optional-spanish-audio",
    "path": "migrations/shared-alg001-l08-p021/source-v1/L8IN06.mp3",
    "bytes": 388752,
    "sha256": "aa7718b3a4b7ec5a485ba99e2745fdd8554a0c866680ee5f2c7a2e31f62aecce",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  }
} as const);
export type P021Resource=keyof typeof P021_RESOURCE_PINS;
