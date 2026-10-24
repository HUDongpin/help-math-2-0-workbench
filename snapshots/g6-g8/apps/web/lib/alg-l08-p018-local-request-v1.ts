export const P018_RESOURCE_PINS=Object.freeze({
  "source-stream": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p018/source-stream",
    "path": "migrations/shared-alg001-l08-p018/source-v1/stream-60.mp3",
    "bytes": 67080,
    "sha256": "dbf0eb600ec544624ebdffec8b79ba8d05a55675d38d503016b6467776921b94",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "optional-spanish-audio": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p018/optional-spanish-audio",
    "path": "migrations/shared-alg001-l08-p018/source-v1/L8IN03.mp3",
    "bytes": 273504,
    "sha256": "00fe36994703bac541320b7c9765074b5cd93984606787ac48bdae7ab834cb76",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  }
} as const);
export type P018Resource=keyof typeof P018_RESOURCE_PINS;
