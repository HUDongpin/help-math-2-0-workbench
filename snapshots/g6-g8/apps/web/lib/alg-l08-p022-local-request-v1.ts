export const P022_RESOURCE_PINS=Object.freeze({
  "source-stream": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p022/source-stream",
    "path": "migrations/shared-alg001-l08-p022/source-v1/stream-47.mp3",
    "bytes": 223080,
    "sha256": "550d5343162d29d64179373291edf9894d9ffe3733b95e576880285ed61ca945",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  },
  "optional-spanish-audio": {
    "originalPath": "/flash-assets/g678-local/shared-alg001-l08-p022/optional-spanish-audio",
    "path": "migrations/shared-alg001-l08-p022/source-v1/L8IN07.mp3",
    "bytes": 376992,
    "sha256": "5578cb73ec783d240ff332db6fcdaa4b93360b80aadce1643f94f132819789b1",
    "contentType": "audio/mpeg",
    "destination": "empty",
    "mode": "cors"
  }
} as const);
export type P022Resource=keyof typeof P022_RESOURCE_PINS;
