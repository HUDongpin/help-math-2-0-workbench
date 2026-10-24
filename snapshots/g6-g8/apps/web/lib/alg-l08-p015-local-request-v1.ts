export const P015_RESOURCE_PINS=Object.freeze({
  "source-stream": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p015/source-stream",
    "path": "migrations/shared-alg001-l08-p015/source-v1/stream-66.mp3",
    "bytes": 207610,
    "sha256": "282b6789995e4d8a7294c967655b088199083a018acbcd95508fda9d8da8abec",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "optional-spanish-audio": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p015/optional-spanish-audio",
    "path": "migrations/shared-alg001-l08-p015/source-v1/L8VB10.mp3",
    "bytes": 349104,
    "sha256": "ecb49b03d512aaca7dbdfd7d09e52230a237647c20b3bb1c1bc133ab7ddc5854",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  }
} as const);
export type P015Resource=keyof typeof P015_RESOURCE_PINS;
