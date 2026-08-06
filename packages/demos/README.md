# `@helpmath/demos`

This private workspace package is the website-facing adapter for the existing
React/SVG HELP Math rebuilds. It does not copy, bundle, or export FLA, SWF, or
Ruffle material.

## Integration

Import the package stylesheet once in the website layout, then use the typed
registry or a named component:

```tsx
import "@helpmath/demos/styles.css";
import { demoRegistry, Conversion_1_2 } from "@helpmath/demos";

const entry = demoRegistry.Conversion_1_2;

export function Example() {
  return <Conversion_1_2 spanishFormulaFlag="off" />;
}
```

`listDemoRegistryEntries({ productionOnly: true })` intentionally returns only
manifests whose status is `approved`. Both current manifests are
`conditional`, so the production website must not present them as approved
until the project migration validator passes in strict mode and the acceptance
checklist and required evidence are complete.

## Host requirements

- The host must serve every path listed in `entry.integration.requiredPublicAssets`.
- `Conversion_1_2` supports a one-indexed `captureFrame` prop.
- `Conversion_1_4` supports the same one-indexed `captureFrame` contract.
- Both components retain the workbench's legacy `spanishFormulaFlag` API;
  values `on`/`ON` select Spanish and `off`/`OFF` select English.
- The adapters use monorepo-relative imports into the maintained root
  components. This package is therefore a private workspace boundary, not a
  separately publishable npm artifact.

The `sourceHashes` arrays list the FLA digest first and the SWF digest second.
Hashes identify preserved source evidence; the source files themselves are not
part of this package or its public exports.

## Generated animation registry

`src/registry.generated.ts` is an asynchronous loader map, so an animation page
does not bundle every renderer. `prototype-registry.json` supplies the two
explicit `legacy-prototype` entries. Strict entries come only from
`catalog/completion-ledger.json`; run `npm run generate:registry --workspace
@helpmath/demos` after that ledger changes. Package tests and typechecking fail
if the checked-in generated map is stale.
