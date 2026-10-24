export const P035_RESOURCE_PINS=Object.freeze({
  "source-stream": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p035/source-stream",
    "path": "migrations/shared-alg001-l08-p035/source-v1/stream-358.mp3",
    "bytes": 99840,
    "sha256": "2dd24cb401d0c2ee4cf7bcfedc0d9ebddf3c039ab4ff834386c8aa3599937ff8",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "feedback-255": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p035/feedback-255",
    "path": "migrations/shared-alg001-l08-p035/source-v1/stream-255.mp3",
    "bytes": 11050,
    "sha256": "b08449fd7fb0c0288fc90f56473e10d3f10494c1a9747e20481ec7dd50bdfe19",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "feedback-350": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p035/feedback-350",
    "path": "migrations/shared-alg001-l08-p035/source-v1/stream-350.mp3",
    "bytes": 11570,
    "sha256": "770ce8a109fb78c238d218e479047529e8cb39f006f8c70747be376556e2a541",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "optional-spanish-audio": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p035/optional-spanish-audio",
    "path": "migrations/shared-alg001-l08-p035/source-v1/L8TI07.mp3",
    "bytes": 216384,
    "sha256": "a5ac1ca35a6226218a1617e05f961fa9e2260dbd8b947051b21f3396ac59e569",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  }
} as const);
export type P035Resource=keyof typeof P035_RESOURCE_PINS;
