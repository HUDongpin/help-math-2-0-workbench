# Grade 4 Active-Source Promotion Review — 2026-08-02

## Decision

This review authorizes one bounded canonical-source transaction, not a bulk
promotion of the Grade 4 Drive intake. The transaction is limited to the
active-page dependency closure derived from the canonical lesson XML and the
pinned host audio-routing evidence.

The immutable machine-readable plan is
`catalog/source-promotions/g4-active-source-promotion-2026-08-02.json` (SHA-256
`61fbb021fbab57c427e1c0459c30cf94a88b449d0080c125d616213687833a87`).
The plan is deliberately a pre-mutation artifact; the separate applied receipt
records whether the transaction actually committed.

## Exact selected scope

| Source role | New canonical copies | Exact canonical bindings retained | Missing from both canonical and quarantine |
|---|---:|---:|---:|
| Active-page SWF | 202 | 0 | 0 |
| Same-path FLA | 143 | 20 | 0 |
| Runtime-bound MP3 | 883 | 854 | 16 |
| Lesson XML | 0 | 9 | 0 |
| **Total** | **1,228** | **883** | **16** |

The copy transaction contains 434,656,573 bytes. Its ordered record-set
SHA-256 is
`118691f7e2a301f6a5056f196bd17a77eb3c42d80b73a43244d41445c19a4de6`.
Of the copied records, 1,070 were ordinary new-source candidates, 113 retained
the prior `hold-historical-custody-review` disposition, and 45 retained the
prior `hold-placement-alias-review` disposition. The latter 158 records are
included only because this review binds them to an exact active/runtime path,
confirms the quarantine bytes, and finds no same-path byte conflict.

The remaining 1,022 of the 2,092 generic Grade 4 candidate rows are outside
this dependency closure and are not promoted. Unbound ActionScript, unrelated
images, whole-directory audio, editor files, historical variants, and other
quarantine rows remain excluded.

## Dependency derivation

The 202 SWFs are the exact paths referenced by the 12 canonical Grade 4 lesson
XML documents but absent from the pre-transaction canonical catalog. The 163
FLA bindings use the same path stem as those SWFs: 143 require copying, 20 are
already canonical and byte-identical, and 39 SWFs have no same-path FLA.

Audio reachability is source-derived rather than directory-wide. It uses the
hash-pinned `indexELM.swf`/ActionScript host route for ordinary Spanish page
audio and the target SWFs' static final-quiz label contracts. The resulting
1,753 distinct MP3 paths partition into 883 copies, 854 exact existing
bindings, and 16 unresolved paths. This is evidence of expected source
reachability, not observed playback, language-content correctness, or timing
correctness.

The nine lesson XML bindings are already canonical and match the quarantine
bytes exactly; no XML file is copied.

## Explicit unresolved audio

The unresolved path-set SHA-256 is
`439fce1e41ef10591c165f0eed65638d1a7afc81080db182770911bd1d8c4286`:

- `HELP_COURSES/ELMGR4/L2/FQ/EA/Q22A.mp3`
- `HELP_COURSES/ELMGR4/L2/FQ/EA/Q22B.mp3`
- `HELP_COURSES/ELMGR4/L2/FQ/EA/Q22C.mp3`
- `HELP_COURSES/ELMGR4/L2/FQ/EA/Q22D.mp3`
- `HELP_COURSES/ELMGR4/L2/FQ/EA/Q23A.mp3`
- `HELP_COURSES/ELMGR4/L2/FQ/EA/Q23B.mp3`
- `HELP_COURSES/ELMGR4/L2/FQ/EA/Q23C.mp3`
- `HELP_COURSES/ELMGR4/L2/FQ/EA/Q23D.mp3`
- `HELP_COURSES/ELMGR4/L2/SA/L2IN21.mp3`
- `HELP_COURSES/ELMGR4/L2/SA/L2IN22.mp3`
- `HELP_COURSES/ELMGR4/L2/SA/L2IN23.mp3`
- `HELP_COURSES/ELMGR4/L2/SA/L2IN24.mp3`
- `HELP_COURSES/ELMGR4/L2/SA/L2IN25.mp3`
- `HELP_COURSES/ELMGR4/L2/SA/L2IN26.mp3`
- `HELP_COURSES/ELMGR4/L6/SA/L6GS03.mp3`
- `HELP_COURSES/ELMGR4/L8/SA/L8GS03.mp3`

These remain source and audio-fidelity blockers. No placeholder or synthesized
audio is created.

## FLA container exception

The selected FLA set contains one modern ZIP/XFL container:
`HELP_COURSES/ELMGR4/L1/IN/L1IN07.fla`, 1,513,718 bytes, SHA-256
`782bd6d283c2eea38798ecda41ec0a5b93c7d5ebedcff3624a2cc48b471cf073`.
`unzip -t` lists the XFL members and reports no compressed-data error, but
returns status 2 because the central-directory length is reported as 54 bytes
too long / 54 bytes missing. The transaction preserves the source bytes
without repair or resave. This is an authoring-container warning, not a claim
of pristine authoring integrity.

## Verified post-transaction identities

The committed tree contains 9,147 canonical files totaling 3,214,585,414
bytes. The verified source-freeze manifest SHA-256 is
`f0a33c8a3d15afd7340e9ea5523385428bae7546bd8d4227a3a8977ab8914318`;
the verified catalog checksum-set SHA-256 is
`30dfa12b7cd76e7200fb89115155e7d32af1356247c07e3a4f79227e93f34875`.

After a verified commit, Grade 4 canonical source coverage is 645/645 active
pages plus 12/12 lesson shells, or 657/657 source members. This does not change
the current JavaScript registry: it remains 41 page renderers plus two shell
renderers, or 43/657, with 614 renderers still absent.

## Acceptance boundary

This transaction changes canonical source custody and derived catalog state
only. It does not prove original-runtime behavior, JavaScript implementation,
audio completeness, audio synchronization, visual fidelity, human visual
review, owner acceptance, strict completion, release readiness, or
publication. The 16 missing audio paths keep the complete source-dependency
closure explicitly false.

## Applied transaction

Transaction `20260802T040219914Z-1635d216a5c2` committed at
`2026-08-02T04:02:54.364Z`. The authoritative immutable receipt is
`catalog/source-promotions/g4-active-source-promotion-2026-08-02-applied.json`:
17,842 bytes, mode `0444`, SHA-256
`df23e474a6a8ab632b5e7ed6928a485427ed8d1873fb846c2f79d06dfd0c0f72`.
Its prepared-receipt SHA-256 is
`34d8d4707a9bc64450a2283cd77b95f3233bfbb8908c97450cbcaa756ce86e17`.

Before either live name changed, the staged source and catalog trees were
rebuilt, checked, recursively fsynced through no-follow handles, and bound to
the projected identities above. Source and catalog then used separate Darwin
`renameatx_np(RENAME_SWAP)` operations, source first so the brief inter-swap
state was fail-closed. The immutable applied receipt is the forward-only commit
point. Because the two trees have different parent directories, this is a
failure-atomic, recoverable transaction, not one externally observable
single-syscall two-tree snapshot.

The exact pre-promotion roots remain retained and independently verified:

- source:
  `/Volumes/WestWorld/HELP MATH 2.0/source-assets/flash/.HELP MATH_ORIGINAL FILES.g4-active-source-recovery-20260802T040219914Z-1635d216a5c2`
- catalog:
  `/Volumes/WestWorld/HELP MATH 2.0/.catalog.g4-active-source-recovery-20260802T040219914Z-1635d216a5c2`

They retain the exact 7,919-file, 2,779,928,841-byte base manifest
`a9625fb4a99e026fea09e4a1929edc2fa9d47ccf6cdbca7de4ba9ca75adf211e`
and catalog checksum-set
`0d6f20e50576c73aac38aa5a88610c654bbe29430044c2db43d8d6236cf8fe0f`.
Do not delete them without a separate retention decision.

The first staging attempt, transaction
`20260802T035526841Z-6cb936839e72`, encountered `ENOSYS` from Node's
`COPYFILE_FICLONE_FORCE` before any swap. It verified the live base, recorded
`rolled-back`, and was atomically archived under
`work/g4-active-source-promotion-transactions/rolled-back-20260802T035526841Z-6cb936839e72`.
Its partial staging root was retained. The successful transaction used the
reviewed native APFS `/bin/cp -c -R -p -P` clone path plus exact structure,
catalog byte-tree, manifest, catalog, permission, and durability checks.

Independent post-commit checks passed for the source freeze, all 17 catalog
outputs, catalog unit tests, Grade 4 catalog coverage, and committed-transaction
recovery. A separate record-level closure check rehashed all 1,228 copied files
and all 883 retained exact bindings against both the plan and rebuilt catalog,
with zero mismatches; it also confirmed that all 16 unresolved MP3 paths remain
absent from both the canonical tree and catalog.

The repository-wide `npm test` command is not green after this source-identity
change. It exits 1 because multiple older, hash-bound migration, QA, audio, and
completion artifacts correctly reject the new source/catalog identity; the
long-running suite then reports interrupted downstream tests. Those dated
artifacts were not bulk-regenerated or re-signed as part of this bounded source
promotion. The targeted transaction, freeze, catalog, coverage, workbench, and
ledger checks above remain independently green.

This section must be read together with the machine receipt; the plan alone
never proves that source mutation occurred.
