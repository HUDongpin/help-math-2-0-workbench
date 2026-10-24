export const P019_RESOURCE_PINS=Object.freeze({
  "source-stream": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p019/source-stream",
    "path": "migrations/shared-alg001-l08-p019/source-v1/stream-80.mp3",
    "bytes": 154180,
    "sha256": "7bc68fbd2cc3710b450d281b63e29f175992185cab9549be21372146619a80d3",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "optional-spanish-audio": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p019/optional-spanish-audio",
    "path": "migrations/shared-alg001-l08-p019/source-v1/L8IN04.mp3",
    "bytes": 344064,
    "sha256": "2ffc5e1194df49988527fe3e798341fd895ad97ed72f4e6a09042aac9a9046f6",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  }
} as const);
export type P019Resource=keyof typeof P019_RESOURCE_PINS;
