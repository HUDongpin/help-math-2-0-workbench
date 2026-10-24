export const P012_RESOURCE_PINS=Object.freeze({
  "source-stream": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p012/source-stream",
    "path": "migrations/shared-alg001-l08-p012/source-v1/stream-84.mp3",
    "bytes": 120900,
    "sha256": "4c1c3686439a5cff129ac0091e00d95ef909c2db0a7a16c373126914c386095f",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "source-feedback": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p012/source-feedback",
    "path": "migrations/shared-alg001-l08-p012/source-v1/stream-70.mp3",
    "bytes": 5720,
    "sha256": "533f9ecc19d8b4d4ae727b8134870878036da4675a1e4aeec3b5c27a36b1f8bc",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "optional-spanish-audio": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p012/optional-spanish-audio",
    "path": "migrations/shared-alg001-l08-p012/source-v1/L8VB07.mp3",
    "bytes": 223104,
    "sha256": "96e1e327924cf846bd1b34ffc0710fb9b94578f994254bab10b33aa31b076c00",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  }
} as const);
export type P012Resource=keyof typeof P012_RESOURCE_PINS;
