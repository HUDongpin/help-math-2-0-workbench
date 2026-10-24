export const P011_RESOURCE_PINS=Object.freeze({
  "source-stream": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p011/source-stream",
    "path": "migrations/shared-alg001-l08-p011/source-v1/stream-60.mp3",
    "bytes": 116090,
    "sha256": "9bf811027eef0a34d6a2b26048025e26fce69819a80d3e26d7502c46a70b5d8e",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "optional-spanish-audio": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p011/optional-spanish-audio",
    "path": "migrations/shared-alg001-l08-p011/source-v1/L8VB06.mp3",
    "bytes": 217392,
    "sha256": "4da99ae2b55358657c1f349f61e91739b7c950ae30ca773043908b83d250138a",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  }
} as const);
export type P011Resource=keyof typeof P011_RESOURCE_PINS;
