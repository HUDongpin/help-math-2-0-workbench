# Grade 4 missing MP3 resolution plan v1

Status: **acceptance-neutral; all 16 required runtime sources remain unresolved**.

This document is a deterministic, non-executable resolution plan. It copies no
source, mutates no canonical/quarantine/frozen/archive custody, selects no
candidate, and changes no acceptance or publication gate.

## Bound evidence

| Evidence | Bytes | SHA-256 |
|---|---:|---|
| Runtime alignment | 2272953 | `05357658e7c5f70b9d305ea64063130f1b1d816663748af45cfa1950319a670b` |
| Successor v3 | 23456 | `789ddbd809b8fb8a8d8e3d7ab4b5d3c7c5cddb81cb6f358133575dd63e8ad07f` |
| Current source catalog | 1894761 | `c5ba348ea968b4ae7292d86f7624a77ec105bc8f929bd61b4837c59623f33b29` |
| Quarantine README | 9784 | `fd3f300739e63e84b9a263d724fdbeda55dd3a1b4eee077b472de5228cc76f5e` |
| Quarantine intake receipt | 7858 | `3633334999488f1df0c95fc7bece4669d7d9db86845f1aeab1924fd560802fd4` |
| Quarantine Grade 4 manifest | 798533 | `27c0dc167ed771ffa4f560d71f03f4e373c0d08ff3a52d2868db2bdef11ede4c` |
| Frozen v7/v8 applied receipt | 8375 | `fd0ae61d347ab71abdc68581a2fb89761358f7d9fb1f7e5f8dc8326a54d8f751` |
| Historical technical crosswalk aggregate | 891921 | `43f7d983a0b81b85e3f4e0ff682cae876936409f3a65ae58e3a5bfa49a70f1e4` |

The historical source is represented only by an aggregate descriptor: 1,455
technical records, including 933 audio records. No historical raw path, Drive
display path, claim path, personal record, or archive byte is emitted. Its old
source-catalog match status is not reused; the current catalog is checked
separately.

## Result

- Obligations: 16.
- Binding/language: 8 English final-quiz question/answer dependencies and 8
  ordinary Spanish page dependencies.
- Lesson distribution: L2 = 14, L6 = 1, L8 = 1.
- Expected SHA-256 identities known: 0; unknown: 16.
- Exact target path absent from each named path-bearing catalog: 16/16.
- Basename observed in at least one checked catalog: 14; not observed: 2.
- Selected candidates: 0; promotion records: 0; executor: absent.

Exact-path absence is bounded to the current canonical catalog, the 2026-08-02
Grade 4 quarantine manifest, and the historical technical crosswalk. It is not
proof that the target bytes do not exist elsewhere. The frozen v7/v8 closure
contains 6,060 unique SHA-256 identities, but no frozen object is admissible
until the target's expected SHA-256 and byte count are known.

Counts below are discovery-only `records/distinct SHA-256 identities`:
`C` = current canonical catalog, `Q4` = Grade 4 quarantine manifest, and
`H` = privacy-safe historical aggregate. Basename counts never establish
identity.

## Obligations

| # | Exact runtime dependency | Lesson | Binding | Lang | Expected SHA | Basename observations | Disposition |
|---:|---|---:|---|---|---|---|---|
| 1 | `HELP_COURSES/ELMGR4/L2/FQ/EA/Q22A.mp3` | L2 | final-quiz-question-answer | en | null | C 24/23; Q4 23/22; H 8/8 | `blocked-expected-sha256-unknown-generic-fq-basename-ambiguous` |
| 2 | `HELP_COURSES/ELMGR4/L2/FQ/EA/Q22B.mp3` | L2 | final-quiz-question-answer | en | null | C 32/32; Q4 23/22; H 7/7 | `blocked-expected-sha256-unknown-generic-fq-basename-ambiguous` |
| 3 | `HELP_COURSES/ELMGR4/L2/FQ/EA/Q22C.mp3` | L2 | final-quiz-question-answer | en | null | C 29/27; Q4 23/22; H 9/9 | `blocked-expected-sha256-unknown-generic-fq-basename-ambiguous` |
| 4 | `HELP_COURSES/ELMGR4/L2/FQ/EA/Q22D.mp3` | L2 | final-quiz-question-answer | en | null | C 31/29; Q4 23/22; H 12/12 | `blocked-expected-sha256-unknown-generic-fq-basename-ambiguous` |
| 5 | `HELP_COURSES/ELMGR4/L2/FQ/EA/Q23A.mp3` | L2 | final-quiz-question-answer | en | null | C 27/25; Q4 23/22; H 5/5 | `blocked-expected-sha256-unknown-generic-fq-basename-ambiguous` |
| 6 | `HELP_COURSES/ELMGR4/L2/FQ/EA/Q23B.mp3` | L2 | final-quiz-question-answer | en | null | C 27/26; Q4 23/22; H 5/5 | `blocked-expected-sha256-unknown-generic-fq-basename-ambiguous` |
| 7 | `HELP_COURSES/ELMGR4/L2/FQ/EA/Q23C.mp3` | L2 | final-quiz-question-answer | en | null | C 30/27; Q4 23/22; H 7/7 | `blocked-expected-sha256-unknown-generic-fq-basename-ambiguous` |
| 8 | `HELP_COURSES/ELMGR4/L2/FQ/EA/Q23D.mp3` | L2 | final-quiz-question-answer | en | null | C 21/20; Q4 23/22; H 3/2 | `blocked-expected-sha256-unknown-generic-fq-basename-ambiguous` |
| 9 | `HELP_COURSES/ELMGR4/L2/SA/L2IN21.mp3` | L2 | ordinary-spanish-page | es | null | C 2/2; Q4 0/0; H 0/0 | `blocked-expected-sha256-unknown-cross-grade-basename-only` |
| 10 | `HELP_COURSES/ELMGR4/L2/SA/L2IN22.mp3` | L2 | ordinary-spanish-page | es | null | C 2/2; Q4 0/0; H 0/0 | `blocked-expected-sha256-unknown-cross-grade-basename-only` |
| 11 | `HELP_COURSES/ELMGR4/L2/SA/L2IN23.mp3` | L2 | ordinary-spanish-page | es | null | C 2/2; Q4 0/0; H 0/0 | `blocked-expected-sha256-unknown-cross-grade-basename-only` |
| 12 | `HELP_COURSES/ELMGR4/L2/SA/L2IN24.mp3` | L2 | ordinary-spanish-page | es | null | C 2/2; Q4 0/0; H 0/0 | `blocked-expected-sha256-unknown-cross-grade-basename-only` |
| 13 | `HELP_COURSES/ELMGR4/L2/SA/L2IN25.mp3` | L2 | ordinary-spanish-page | es | null | C 2/2; Q4 0/0; H 0/0 | `blocked-expected-sha256-unknown-cross-grade-basename-only` |
| 14 | `HELP_COURSES/ELMGR4/L2/SA/L2IN26.mp3` | L2 | ordinary-spanish-page | es | null | C 2/2; Q4 0/0; H 0/0 | `blocked-expected-sha256-unknown-cross-grade-basename-only` |
| 15 | `HELP_COURSES/ELMGR4/L6/SA/L6GS03.mp3` | L6 | ordinary-spanish-page | es | null | C 0/0; Q4 0/0; H 0/0 | `blocked-expected-sha256-unknown-basename-not-observed-in-checked-scopes` |
| 16 | `HELP_COURSES/ELMGR4/L8/SA/L8GS03.mp3` | L8 | ordinary-spanish-page | es | null | C 0/0; Q4 0/0; H 0/0 | `blocked-expected-sha256-unknown-basename-not-observed-in-checked-scopes` |

## Four-state recovery protocol

| State | Machine status | Condition | Required machine behavior |
|---:|---|---|---|
| 1 | `blocked-expected-identity-unknown` | expectedSha256 or expectedBytes is unknown | select no candidate; retain the obligation as required-unresolved-source |
| 2 | `blocked-exact-bytes-not-found-in-checked-scopes` | expectedSha256 and expectedBytes are known but exactMatchCount is zero | retain the obligation and record the bounded checked scopes; do not infer nonexistence elsewhere |
| 3 | `candidate-only-pending-provenance-review` | at least one exact SHA-256 plus byte-count match exists but Grade 4 custody or provenance is unresolved | record only privacy-safe candidate counts and immutable identity; copy nothing |
| 4 | `eligible-for-new-successor-plan` | exact identity and reviewed Grade 4 provenance are both established | create a new hash-bound successor plan; never mutate the frozen closure or apply automatically |

State 4 authorizes only creation of a new, reviewed, hash-bound successor plan.
It does not authorize source promotion. Any future promotion requires separate
review, separate authorization, and a separately implemented executor.

## Fixed boundaries

- `promotionRecords` remains empty and no write/apply executor exists.
- Filename, basename, case, grade resemblance, placement resemblance, size,
  audio similarity, or listening judgment cannot establish byte identity.
- Cross-grade `L2IN21.mp3` through `L2IN26.mp3` observations are not Grade 4
  candidates without exact expected identity and reviewed provenance.
- `L6GS03.mp3` and `L8GS03.mp3` were not observed by basename in the named
  checked catalogs; that bounded result is not universal nonexistence proof.
- Canonical source promotion, dependency closure, JavaScript implementation,
  original-runtime evidence, runtime/audio fidelity, human/owner acceptance,
  strict completion, whole-course integration, and publication all remain
  false.
