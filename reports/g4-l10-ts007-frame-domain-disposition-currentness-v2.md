# G4 L10 TS007 frame-domain disposition currentness v2

Status: **SOURCE_STATIC_DISPOSITION_CURRENT_ONE_INTERACTIVE_UNRESOLVED_COVERAGE_PREDECESSOR_STALE_PARSE_STABLE_NO_RUNTIME_AUTHORITY**

Decision: **PRESERVE_CURRENT_DISPOSITION_KEEP_SPRITE64_UNRESOLVED_DO_NOT_REFRESH_COVERAGE_DO_NOT_RUN_DOWNSTREAM_TRANSACTION**

V2 is the parse-stable successor to v1. V1's in-memory report contained one `undefined` projection at `independentStaticRecomputation.sprite64.directFfdecFrameScriptCount`; JSON serialization omitted it, so a parsed-file fingerprint recomputation did not equal the in-memory fingerprint. V2 records the exact source-derived integer count `1` and requires zero undefined values plus an exact JSON round-trip. No underlying disposition fact changes.

The current disposition remains 15 declared, 10 composite, and 1 unresolved. `sprite-355` and `sprite-379` are the two nested-parent composites added after coverage; interactive `sprite-64` remains unresolved. Coverage still binds the predecessor (8 composite, 3 unresolved), and all 30 EN/ES requirements remain blocked with zero authoritative frames. Raw/formal unresolved remain 70/74.

No reviewer task, Phase A/B, helper, original runtime, specification, renderer, RMSE, audio, review, acceptance, integration, promotion, release, or publication authority is created.

Report fingerprint: `095c1f6d16c215ebf0b9f16150a448baaf4cc674ab530b22a8200d09f968f180`.
