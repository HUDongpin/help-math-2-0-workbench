# Hash-bound legacy CI asset

This Brotli fixture preserves the old TS008 JavaScript renderer required by the existing candidate-profile tests. Its replacement is already present in the frozen release pack. It is never copied into the controlled Preview output or added to the deployment inventory.

```json
{
  "assetPath": "apps/web/candidate-assets/flash-assets/2026-08-22-page-only-candidates-v1/courses/course-g03-l01-ts-008/canvas-renderer.js",
  "uncompressedBytes": 9027191,
  "uncompressedSha256": "863191baf3afc666cdd0ad5db837fe79fdc8892e502137ed75bde9e95f15f090",
  "compressedBytes": 1807341,
  "compressedSha256": "e6cf7f158e2f88e75d19b482cdbfd26a4bab16f715f1496febda77f02549dbb4",
  "sourceGitBlobAtHead": null,
  "authority": "Legacy code test fixture bound to current-js-candidate-assets.v1.json only; not an upload member or a replacement for the current TS008 runtime."
}
```
