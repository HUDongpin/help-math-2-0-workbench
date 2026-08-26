# G4 L10 VB003 source-static natural-trace partial-order graph v1 review input

Status: `REVIEW_INPUT_FROZEN_NO_REVIEW_TASK_NO_VERDICT_NO_RUNTIME_AUTHORITY`

This is a frozen, acceptance-neutral review input. It is not an independent-review verdict, formal natural-trace specification, capture kit, original-runtime authority, security acceptance, helper implementation, baseline, renderer, or release decision.

## Exact closure

- Review-universe files: 8
- Review-universe bytes: 322169
- Review-universe set SHA-256: `59fbb1441f3072641d09c92aa8d823b2294280ac3fc54217ab6b5d26dadefe76`
- Chunk count: 111
- Maximum chunk bytes: 3072
- Chunk-set SHA-256: `6d2b571b663b75ba6ad1cccdd7b4bac7b27a40d8565bb7893c1059a111b03882`
- Xattr-set SHA-256: `74c611b0ee27a8d453fc81555fc7183ec55f72a63a0d154c74420494d8d62223`
- Review-input fingerprint SHA-256: `b02ae9700ad97ed96b69d9805347374be10cdf29c2ebb239549d0fac36430de5`

## Inputs

| Role | Path | Bytes | SHA-256 | Mode | Chunks | Max chunk |
|---|---|---:|---|---:|---:|---:|
| `partial-order-graph` | `reports/g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1.json` | 47214 | `8a9e5711ebb14c2acab46013772214c1be79d73fae10d9ecaaf011b5ea96b819` | `0444` | 16 | 3069 |
| `partial-order-graph-builder` | `scripts/build-g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1.mjs` | 48641 | `7f291baaf2ccb6b1204bdafd77f2cd78818add1c6202f077410921da8faaf24e` | `0644` | 17 | 3066 |
| `partial-order-graph-builder-test` | `scripts/build-g4-l10-vb003-source-static-natural-trace-partial-order-graph-v1.test.mjs` | 9634 | `1c2fc0ee4650b7548e1c90060a37c3e148dfab440d867ddca117c013e4ca237d` | `0644` | 4 | 3065 |
| `host-entry-antecedent` | `reports/g4-l10-vb003-host-entry-antecedent.json` | 38497 | `9c64d146c8560551beac47fd493c0a9a35135e3d4dc756363f3ac643525c595d` | `0644` | 13 | 3072 |
| `language-audio-technical-binding` | `migrations/course-g04-l10-vb-003/audit/language-audio-technical-binding.json` | 17024 | `ac87d1db72a799b8ec58a451051dc7d1e9cfe3d104c1722058b36769dc44081e` | `0644` | 6 | 3053 |
| `original-runtime-baseline-gap-matrix` | `reports/g4-l10-vb003-original-runtime-baseline-acquisition-gap-matrix-v1.json` | 16324 | `9bfa425bbc79feec945985358aa79d60bc9d2565a6571b44f55eee14443ce603` | `0444` | 6 | 3068 |
| `scenario-inventory` | `migrations/course-g04-l10-vb-003/audit/scenario-inventory.json` | 134836 | `55a149952185c0f45e5843f6018288f7036269807cca1264e41905038a08b44a` | `0644` | 45 | 3071 |
| `latest-native-helper-security-review-failure` | `reports/g4-l10-native-helper-v2-14-independent-review-batch-4d05187e-failed-v1.json` | 9999 | `de1bfbf4323a44360932851772bf35db09f8bc3e4310f65eac28b976aa002ea2` | `0444` | 4 | 3066 |

The JSON companion freezes every native `sed -n` line range. A reviewer must emit at most one declared content chunk per terminal result, verify that private temporary chunk with native `wc` and `shasum`, and reconstruct each file without emitting any whole file or aggregate.

## Graph sets

| Set | Count | SHA-256 |
|---|---:|---|
| `sourceStaticObligationAtomSet` | 10 | `19c1b88dc34b6623de13964d145a3238f5ad5ff0264bff1d8b730338812595b3` |
| `verifiedStaticNodeSet` | 37 | `986360d84d88982dc7e24abca6d770ec7bdc8c4fd7623b85bd3eded176d5bb66` |
| `verifiedStaticEdgeSet` | 28 | `a3d1115500501abfd387759f04239e8ebf72c897e0a0faf07312f2f90ede311f` |
| `unresolvedCausalityEdgeSet` | 17 | `d6b938ce5cee972ab6a22d33257b54c44558709e9cd6f954b9e12ade27e05efc` |
| `unresolvedRuntimeClaimSet` | 10 | `e1918d0c7950f5b49fc0cce356cfbb6ca77f3d744ee32fe73decef8af273eb5b` |
| `candidateBranchSurfaceSet` | 11 | `fd01c88fa69e5457c48406785ebd0fbbc1097f1e4b56a52a2ca2826bf60ae609` |

These are source-static sets only. The 17 unresolved causal edges, 10 unresolved runtime claims, and 11 candidate branch surfaces are not formal requirements or runtime facts.

## Review scopes

- **schema-lineage:** validate all eight exact file identities and their source lineage; validate the six graph set counts and SHA-256 identities; validate graph builder, test, antecedent, audio, gap and scenario bindings.
- **causality-adversarial:** attack every promotion from source-static order to runtime causality; attack promotion of branch surfaces into formal requirements or capture schedules; confirm the historical graph security boundary plus the latest failed batch fail closed.
- **whole:** read every byte of all eight inputs through the bounded chunk transport; reconcile the 37, 28, 17, 10, 11 and 10 set cardinalities; confirm all formalization, runtime, helper, acceptance, integration and publication gates remain zero or false.

## Closed authority

No reviewer task is authorized or created by this artifact. The latest v2.14 helper-security batch is failed, nonreusable, and not specification-review-qualified; it grants no production-helper or runtime authority. Every authority and acceptance effect remains false.
